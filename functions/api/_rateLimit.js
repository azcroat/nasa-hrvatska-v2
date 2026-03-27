/**
 * Rate limiting using Cloudflare Cache API.
 * Best-effort: counters may not be perfectly atomic under very high concurrency,
 * but provide strong protection against casual abuse.
 * @param {Request} request
 * @param {number} limitPerMinute - max requests per IP per minute
 * @returns {Promise<boolean>} true = allowed, false = rate limited
 */
export async function checkRateLimit(request, limitPerMinute = 20) {
  try {
    const ip = request.headers.get('cf-connecting-ip') ||
               request.headers.get('x-forwarded-for') ||
               'unknown';
    const path = new URL(request.url).pathname;
    const window = Math.floor(Date.now() / 60000); // 1-minute windows
    const cacheKey = new Request(
      `https://rl.internal/v1${path}/${encodeURIComponent(ip)}/${window}`,
      { method: 'GET' }
    );
    let cache;
    try { cache = caches.default; } catch { return true; } // fail open if Cache API unavailable

    const stored = await cache.match(cacheKey);
    const count = stored ? parseInt(await stored.text(), 10) || 0 : 0;

    if (count >= limitPerMinute) return false;

    // Increment (fire-and-forget — intentional, avoids blocking the response)
    cache.put(
      cacheKey,
      new Response(String(count + 1), {
        headers: { 'Cache-Control': `max-age=61` },
      })
    );
    return true;
  } catch {
    return true; // Fail open on any error
  }
}
