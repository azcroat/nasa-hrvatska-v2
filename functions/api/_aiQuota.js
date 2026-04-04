/**
 * Per-user daily AI usage quota.
 *
 * Primary storage: Cloudflare KV (PUSH_SUBSCRIPTIONS namespace, globally consistent).
 * Fallback storage: Cloudflare Cache API (always available, no bindings required,
 *   but per-datacenter — a user hitting a different Cloudflare PoP gets a fresh window).
 *
 * The Cache API fallback means all 17 AI endpoints have real quota enforcement even
 * when the KV namespace is not yet bound in the Cloudflare Pages dashboard.
 * This converts the previous fail-open (zero enforcement) into per-datacenter enforcement.
 *
 * Key format (KV and Cache API):  quota:{uid}:{YYYY-MM-DD}
 * Key format (IP fallback):       quota:ip:{ip}:{YYYY-MM-DD}
 * Burst key:                       quota_burst:{uid}:{unix-second}
 * KV TTL: 172800 s (48 h) — covers timezone edge cases
 * Cache TTL: seconds until next UTC midnight (key expires with its quota window)
 */

// ── Plan limits ───────────────────────────────────────────────────────────────
const FREE_ANNUAL_TURNS_PER_DAY = 100;
// eslint-disable-next-line no-unused-vars
const _PAID_TURNS_PER_DAY       = 300; // reserved for future paid tier
const ANON_IP_TURNS_PER_DAY    = 15;

// ── Time helpers ──────────────────────────────────────────────────────────────

/** Return today's date string in UTC: "YYYY-MM-DD" */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/** ISO timestamp for the next UTC midnight — the quota reset point */
function nextMidnightUTC() {
  const now  = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

/**
 * Seconds remaining until next UTC midnight.
 * Minimum 60 — prevents a zero-TTL edge case in the final seconds of the day.
 */
function secondsUntilMidnight() {
  const now  = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
}

/** Resolve the per-day limit for a uid based on JWT source claim (future-proofing). */
function limitForUid(/* uid, source */) {
  // All users currently treated as free_annual.
  // When source is available from JWT claims, branch here:
  //   if (source === 'stripe' || source === 'revenuecat') return PAID_TURNS_PER_DAY
  return FREE_ANNUAL_TURNS_PER_DAY;
}

// ── Cache API helpers (fallback storage) ─────────────────────────────────────
// Uses the same internal URL trick as _rateLimit.js to avoid the Cache API requiring
// real HTTP responses — Cloudflare's Cache API accepts any URL with cache.put().

const _CACHE_PREFIX = 'https://quota.internal/v1/';

async function _cacheGet(subject) {
  try {
    const cache = caches.default;
    const req   = new Request(_CACHE_PREFIX + subject, { method: 'GET' });
    const res   = await cache.match(req);
    if (!res) return null;
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

async function _cachePut(subject, data, ttlSeconds) {
  try {
    const cache = caches.default;
    const req   = new Request(_CACHE_PREFIX + subject, { method: 'GET' });
    await cache.put(req, new Response(JSON.stringify(data), {
      headers: { 'Cache-Control': `max-age=${ttlSeconds}` },
    }));
  } catch { /* ignore cache write failures — quota is a guardrail, not a hard gate */ }
}

// ── Unified read / write helpers ──────────────────────────────────────────────
// These abstract over KV vs Cache API so the quota logic reads identically
// regardless of which storage backend is active.

async function _read(kv, subject) {
  if (kv) {
    try {
      const raw = await kv.get(subject);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return _cacheGet(subject);
    }
  }
  return _cacheGet(subject);
}

async function _write(kv, subject, data, ttlSeconds) {
  if (kv) {
    try {
      await kv.put(subject, JSON.stringify(data), { expirationTtl: ttlSeconds });
      return;
    } catch {
      // KV write failed — fall through to Cache API
    }
  }
  await _cachePut(subject, data, ttlSeconds);
}

// ── Core quota functions ──────────────────────────────────────────────────────

/**
 * Check (and increment) the daily AI quota for a user.
 *
 * @param {Request}     request  - Incoming CF request (used for IP fallback)
 * @param {object}      env      - CF env (PUSH_SUBSCRIPTIONS KV binding, if configured)
 * @param {string|null} uid      - Firebase uid; null = anonymous IP-based quota
 * @param {number}      cost     - Quota units this call costs (default 1)
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: string }>}
 */
export async function checkAIQuota(request, env, uid, cost = 1) {
  const kv      = env.PUSH_SUBSCRIPTIONS || null; // may be undefined if not bound
  const resetAt = nextMidnightUTC();
  const dailyTtl = secondsUntilMidnight();

  if (!kv) {
    // Log once per request so ops can see KV is not configured and bind it.
    // This is NOT fail-open: Cache API enforcement is now active.
    console.warn('[AIQuota] PUSH_SUBSCRIPTIONS KV not bound — using Cache API fallback (per-datacenter enforcement)');
  }

  // ── Per-second burst check (max 3 requests / second / subject) ─────────────
  const burstSubject = uid
    ? `quota_burst:${uid}`
    : `quota_burst:ip:${request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'}`;
  const secondKey = `${burstSubject}:${Math.floor(Date.now() / 1000)}`;

  try {
    const burstData  = await _read(kv, secondKey);
    const burstCount = burstData?.count ?? 0;
    if (burstCount >= 3) {
      console.warn('[AIQuota] Burst limit exceeded for', burstSubject);
      return { allowed: false, remaining: 0, resetIn: 1 };
    }
    await _write(kv, secondKey, { count: burstCount + 1 }, 5 /* 5-second TTL */);
  } catch (e) {
    // Burst check failed — log but allow the request (burst is a secondary guard)
    console.warn('[AIQuota] Burst check error — allowing request:', e?.message);
  }

  // ── Daily quota window ─────────────────────────────────────────────────────
  const today = todayUTC();
  let quotaKey;
  let limit;

  if (uid) {
    quotaKey = `quota:${uid}:${today}`;
    limit    = limitForUid();
  } else {
    const ip = request.headers.get('cf-connecting-ip')
            || request.headers.get('x-forwarded-for')
            || 'unknown';
    quotaKey = `quota:ip:${ip}:${today}`;
    limit    = ANON_IP_TURNS_PER_DAY;
  }

  try {
    const data    = await _read(kv, quotaKey);
    const current = data?.turns ?? 0;

    if (current + cost > limit) {
      return { allowed: false, remaining: Math.max(0, limit - current), resetAt };
    }

    await _write(kv, quotaKey, { turns: current + cost }, dailyTtl);
    return { allowed: true, remaining: Math.max(0, limit - current - cost), resetAt };
  } catch (e) {
    // Both KV and Cache API failed — this is a genuine infrastructure error.
    // Fail open only as the absolute last resort; log clearly so it surfaces.
    console.error('[AIQuota] All storage backends failed — allowing request (last-resort fail-open):', e?.message);
    return { allowed: true, remaining: 10, resetAt };
  }
}

/**
 * Read current quota usage without incrementing.
 *
 * @param {object}      env  - CF env
 * @param {string|null} uid  - Firebase uid
 * @returns {Promise<{ used: number, limit: number, remaining: number, resetAt: string }>}
 */
export async function getQuotaStatus(env, uid) {
  const kv      = env.PUSH_SUBSCRIPTIONS || null;
  const resetAt = nextMidnightUTC();
  const today   = todayUTC();
  const limit   = uid ? limitForUid() : ANON_IP_TURNS_PER_DAY;

  if (!uid) return { used: 0, limit, remaining: limit, resetAt };

  const quotaKey = `quota:${uid}:${today}`;

  try {
    const data = await _read(kv, quotaKey);
    const used = data?.turns ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used), resetAt };
  } catch (e) {
    console.error('[AIQuota] getQuotaStatus error:', e?.message);
    return { used: 0, limit, remaining: limit, resetAt };
  }
}
