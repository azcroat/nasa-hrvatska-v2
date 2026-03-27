/**
 * Cloudflare Pages Middleware — Security & Rate Limiting
 * Applies to all /api/* routes
 */

// Simple in-memory rate limiter using Cloudflare's Cache API
// Limits: 30 requests/minute per IP for AI endpoints, 60 for others
const AI_ENDPOINTS = ['/api/ai-chat', '/api/news', '/api/correct'];
const AI_RATE_LIMIT = 20; // per minute
const GENERAL_RATE_LIMIT = 60; // per minute

async function getRateLimit(cache, key) {
  const cached = await cache.match(new Request(`https://ratelimit.internal/${key}`));
  if (!cached) return 0;
  return parseInt(await cached.text(), 10) || 0;
}

async function setRateLimit(cache, key, count) {
  const res = new Response(String(count), {
    headers: { 'Cache-Control': 'max-age=60' }, // 1 minute window
  });
  await cache.put(new Request(`https://ratelimit.internal/${key}`), res);
}

export async function onRequest(context) {
  const { request, next } = context;

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return next();
  }

  // Get client IP
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  const isAI = AI_ENDPOINTS.some(ep => pathname.startsWith(ep));
  const limit = isAI ? AI_RATE_LIMIT : GENERAL_RATE_LIMIT;
  const cacheKey = `rl:${ip}:${pathname}`;

  try {
    const cache = caches.default;
    const current = await getRateLimit(cache, cacheKey);

    if (current >= limit) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    // Increment counter (fire and forget — don't await to avoid latency)
    setRateLimit(cache, cacheKey, current + 1).catch(() => {});
  } catch {
    // If rate limiting fails, allow request through (fail open)
  }

  const response = await next();
  return response;
}
