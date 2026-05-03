/**
 * Rate limiting — D1 primary (globally consistent), Cache API secondary (per-PoP),
 * in-memory fallback (per-isolate, ephemeral).
 *
 * D1 provides atomic increments via INSERT ... ON CONFLICT DO UPDATE ... RETURNING,
 * eliminating the cross-datacenter bypass possible with Cache API alone.
 *
 * The rate_limits table is created automatically on first use (no manual migration needed).
 */

// ── Module-level fallback map ─────────────────────────────────────────────────
const _fallbackCounters = new Map();

function _cleanFallback() {
  const cutoff = Date.now() - 120000;
  for (const [key, val] of _fallbackCounters) {
    if (val.windowStart < cutoff) _fallbackCounters.delete(key);
  }
  if (_fallbackCounters.size > 500) {
    const oldest = [..._fallbackCounters.entries()].sort(
      (a, b) => a[1].windowStart - b[1].windowStart,
    );
    oldest.slice(0, 100).forEach(([k]) => _fallbackCounters.delete(k));
  }
}

function _fallbackCheck(key, limit) {
  _cleanFallback();
  const fallbackLimit = Math.max(1, Math.floor(limit * 0.5));
  const minuteWindow = Math.floor(Date.now() / 60000);
  const existing = _fallbackCounters.get(key);
  if (!existing || existing.windowStart !== minuteWindow) {
    _fallbackCounters.set(key, { count: 1, windowStart: minuteWindow });
    return true;
  }
  if (existing.count >= fallbackLimit) return false;
  existing.count++;
  return true;
}

// ── D1 tier (globally consistent) ────────────────────────────────────────────
// Module-level flag: table creation attempted once per isolate cold-start
let _rlTableReady = false;

async function _ensureRlTable(db) {
  if (_rlTableReady) return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS rate_limits (
           key           TEXT    PRIMARY KEY,
           count         INTEGER NOT NULL DEFAULT 0,
           window_minute INTEGER NOT NULL,
           updated_at    INTEGER NOT NULL
         )`,
      )
      .run();
    _rlTableReady = true;
  } catch {
    // Table may already exist or DDL may be unavailable — ignore
  }
}

async function _d1Check(db, key, limit) {
  const minute = Math.floor(Date.now() / 60000);
  const now = Date.now();
  await _ensureRlTable(db);
  // Probabilistic cleanup: ~1% of requests purge rows older than 2 minutes
  if (Math.random() < 0.01) {
    db.prepare('DELETE FROM rate_limits WHERE updated_at < ?1')
      .bind(now - 120000)
      .run()
      .catch(() => {});
  }
  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_minute, updated_at)
         VALUES (?1, 1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE
         SET count        = CASE WHEN window_minute = ?2 THEN count + 1 ELSE 1 END,
             window_minute = ?2,
             updated_at   = ?3
         RETURNING count`,
      )
      .bind(key, minute, now)
      .first();
    if (!row) return null;
    return row.count <= limit;
  } catch (e) {
    console.warn('[RateLimit] D1 unavailable:', e.message);
    return null;
  }
}

/**
 * Check rate limit for the request.
 * @param {Request} request
 * @param {number}  limitPerMinute  max requests per IP per minute (default 20)
 * @param {object}  [env]           Cloudflare env binding; pass context.env for D1 support
 * @returns {Promise<boolean>} true = allowed, false = rate limited
 */
export async function checkRateLimit(request, limitPerMinute = 20, env = null) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const path = new URL(request.url).pathname;
  const window = Math.floor(Date.now() / 60000);
  const key = `${path}/${encodeURIComponent(ip)}/${window}`;
  const fallbackKey = `${path}/${ip}/${window}`;
  const d1Key = `rl:${path}:${ip}`;

  // ── Tier 1: D1 atomic increment (globally consistent) ──────────────────────
  const db = env?.AI_QUOTA_DB ?? null;
  if (db) {
    const d1Result = await _d1Check(db, d1Key, limitPerMinute);
    if (d1Result !== null) return d1Result;
    // D1 failed — fall through to Cache API
  }

  // ── Tier 2: Cache API (per-PoP) ────────────────────────────────────────────
  let cache;
  try {
    cache = caches.default;
  } catch {
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
    console.warn('[RateLimit] Cache operation failed — using in-memory fallback:', e?.message);
    return _fallbackCheck(fallbackKey, limitPerMinute);
  }
}
