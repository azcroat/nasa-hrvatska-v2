/* eslint-disable no-console */
/**
 * Cloudflare Pages Middleware — Security, Rate Limiting & Request Logging
 * Applies to all /api/* routes.
 *
 * Primary rate limiting via Cache API.
 * Fallback: module-level in-memory circuit breaker when Cache API unavailable.
 * When fallback activates, applies 50% of normal limit (multiple isolates may run).
 *
 * All requests are logged as structured JSON: { ts, level, endpoint, method, ms, status }.
 * Use `wrangler tail` or a Cloudflare Log Drain to ingest these in production.
 */

// ── Module-level fallback map ─────────────────────────────────────────────────
// Used when caches.default is unavailable. Per-isolate — not shared across instances.
const _mwFallback = new Map();

function _mwCleanup() {
  if (_mwFallback.size <= 500) return;
  const cutoffWindow = Math.floor(Date.now() / 60000) - 2;
  for (const [k, v] of _mwFallback) {
    if (v.w < cutoffWindow) _mwFallback.delete(k);
  }
}

function _mwFallbackCheck(key, limit) {
  _mwCleanup();
  const fallbackLimit = Math.max(1, Math.floor(limit * 0.5));
  const window = Math.floor(Date.now() / 60000);
  const entry = _mwFallback.get(key);
  if (!entry || entry.w !== window) {
    _mwFallback.set(key, { c: 1, w: window });
    return true;
  }
  if (entry.c >= fallbackLimit) return false;
  entry.c++;
  return true;
}

// ── Rate limit config ─────────────────────────────────────────────────────────
// Per-endpoint AI rate limiting is owned by requireAuthedAI (D1-backed, globally
// consistent). Middleware applies a uniform general limit only.
const GENERAL_RATE_LIMIT = 60; // per minute

async function getRateLimit(cache, key) {
  const cached = await cache.match(new Request(`https://ratelimit.internal/${key}`));
  if (!cached) return 0;
  return parseInt(await cached.text(), 10) || 0;
}

async function setRateLimit(cache, key, count) {
  const res = new Response(String(count), {
    headers: { 'Cache-Control': 'max-age=60' },
  });
  await cache.put(new Request(`https://ratelimit.internal/${key}`), res);
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const start = Date.now();

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) return next();

  // Use only cf-connecting-ip — x-forwarded-for is client-controlled and spoofable.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  const limit = GENERAL_RATE_LIMIT;
  const cacheKey = `rl:${ip}:${pathname}`;

  try {
    const cache = caches.default;
    const current = await getRateLimit(cache, cacheKey);

    if (current >= limit) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // Increment — fire and forget to avoid adding latency
    setRateLimit(cache, cacheKey, current + 1).catch(() => {});
  } catch {
    // Cache API unavailable — use in-memory fallback instead of failing open
    console.warn('[Middleware] Cache API unavailable — using in-memory fallback');
    const allowed = _mwFallbackCheck(cacheKey, limit);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }
  }

  const response = await next();

  // Structured request log — visible in `wrangler tail` and Cloudflare Log Drains
  const ms = Date.now() - start;
  const status = response?.status ?? 0;
  const logEntry = JSON.stringify({
    ts: new Date().toISOString(),
    level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
    endpoint: pathname,
    method: request.method,
    ms,
    status,
  });
  if (status >= 500) {
    console.error(logEntry);
  } else if (status >= 400) {
    console.warn(logEntry);
  } else {
    console.log(logEntry);
  }

  return response;
}
