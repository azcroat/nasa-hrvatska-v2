/**
 * Rate limiting using Cloudflare Cache API with in-memory circuit-breaker fallback.
 * Primary: Cache API (distributed, survives isolate restarts)
 * Fallback: Module-level Map (per-isolate only, activates when Cache API is unavailable)
 *
 * When the fallback activates, it applies half the normal limit since per-isolate
 * state is ephemeral and multiple isolates may be running simultaneously.
 */

// ── Module-level fallback map ─────────────────────────────────────────────────
// Used when caches.default is unavailable. Per-isolate — not shared across instances.
const _fallbackCounters = new Map();

function _cleanFallback() {
  const cutoff = Date.now() - 120000; // 2 minutes
  for (const [key, val] of _fallbackCounters) {
    if (val.windowStart < cutoff) _fallbackCounters.delete(key);
  }
  // Prevent unbounded growth
  if (_fallbackCounters.size > 500) {
    const oldest = [..._fallbackCounters.entries()].sort(
      (a, b) => a[1].windowStart - b[1].windowStart,
    );
    oldest.slice(0, 100).forEach(([k]) => _fallbackCounters.delete(k));
  }
}

function _fallbackCheck(key, limit) {
  _cleanFallback();
  // Apply 50% limit when using fallback — multiple isolates may be running
  const fallbackLimit = Math.max(1, Math.floor(limit * 0.5));
  const window = Math.floor(Date.now() / 60000);
  const existing = _fallbackCounters.get(key);
  if (!existing || existing.windowStart !== window) {
    _fallbackCounters.set(key, { count: 1, windowStart: window });
    return true; // allowed
  }
  if (existing.count >= fallbackLimit) return false; // rate limited
  existing.count++;
  return true;
}

/**
 * Check rate limit for the request.
 * @param {Request} request
 * @param {number} limitPerMinute - max requests per IP per minute
 * @returns {Promise<boolean>} true = allowed, false = rate limited
 */
export async function checkRateLimit(request, limitPerMinute = 20) {
  // Use only the Cloudflare-injected header — x-forwarded-for is client-controllable
  // and can be spoofed to bypass rate limits by cycling through fake IPs.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const path = new URL(request.url).pathname;
  const window = Math.floor(Date.now() / 60000); // 1-minute windows
  const key = `${path}/${encodeURIComponent(ip)}/${window}`;
  const fallbackKey = `${path}/${ip}/${window}`;

  let cache;
  try {
    cache = caches.default;
  } catch {
    // Cache API unavailable — use in-memory fallback
    console.warn('[RateLimit] Cache API unavailable — using in-memory fallback');
    return _fallbackCheck(fallbackKey, limitPerMinute);
  }

  try {
    const cacheKey = new Request(`https://rl.internal/v1${key}`, { method: 'GET' });
    const stored = await cache.match(cacheKey);
    const count = stored ? parseInt(await stored.text(), 10) || 0 : 0;

    if (count >= limitPerMinute) return false;

    await cache.put(
      cacheKey,
      new Response(String(count + 1), {
        headers: { 'Cache-Control': 'max-age=61' },
      }),
    );
    return true;
  } catch (e) {
    // Cache operation failed — use in-memory fallback
    console.warn('[RateLimit] Cache operation failed — using in-memory fallback:', e?.message);
    return _fallbackCheck(fallbackKey, limitPerMinute);
  }
}
