/**
 * Per-user daily AI usage quota using Cloudflare KV.
 * KV namespace: PUSH_SUBSCRIPTIONS (already bound to the app)
 *
 * Key format:  quota:{uid}:{YYYY-MM-DD}
 * Key format (IP fallback): quota:ip:{ip}:{YYYY-MM-DD}
 * TTL: 172800 s (48 h) — covers timezone edge cases
 */

// ── Plan limits ───────────────────────────────────────────────────────────────
const FREE_ANNUAL_TURNS_PER_DAY = 50
// eslint-disable-next-line no-unused-vars
const _PAID_TURNS_PER_DAY        = 200 // reserved for future paid tier
const ANON_IP_TURNS_PER_DAY     = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return today's date string in UTC: "YYYY-MM-DD" */
function todayUTC() {
  return new Date().toISOString().slice(0, 10)
}

/** ISO timestamp for the next UTC midnight — the quota reset point */
function nextMidnightUTC() {
  const now  = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return next.toISOString()
}

/** Resolve the per-day limit for a uid based on JWT source claim (future-proofing). */
function limitForUid(/* uid, source */) {
  // All users currently treated as free_annual.
  // When source is available from JWT claims, branch here:
  //   if (source === 'stripe' || source === 'revenuecat') return PAID_TURNS_PER_DAY
  return FREE_ANNUAL_TURNS_PER_DAY
}

// ── Core quota functions ──────────────────────────────────────────────────────

/**
 * Check (and increment) the daily AI quota for a user.
 *
 * @param {Request}     request  - Incoming CF request (used for IP fallback)
 * @param {object}      env      - CF env (must have PUSH_SUBSCRIPTIONS KV binding)
 * @param {string|null} uid      - Firebase uid; null = anonymous IP-based quota
 * @param {number}      cost     - Quota units this call costs (default 1)
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: string }>}
 */
export async function checkAIQuota(request, env, uid, cost = 1) {
  const kv      = env.PUSH_SUBSCRIPTIONS
  const resetAt = nextMidnightUTC()
  const isProd  = env.ENVIRONMENT === 'production'

  // KV unavailable: fail-closed in production (prevent unmetered AI spend),
  // fail-open in development (allow local testing without KV binding).
  if (!kv) {
    if (isProd) {
      console.error('[AIQuota] PUSH_SUBSCRIPTIONS KV unavailable in production — denying request to prevent unmetered AI spend')
      return { allowed: false, remaining: 0, resetAt }
    }
    console.warn('[AIQuota] PUSH_SUBSCRIPTIONS KV unavailable — allowing request in non-production environment')
    return { allowed: true, remaining: 50, resetAt }
  }

  // Per-second burst check: max 3 requests per second per uid/IP
  const burstSubject = uid
    ? `quota_burst:${uid}`
    : `quota_burst:ip:${request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'}`
  const secondKey = `${burstSubject}:${Math.floor(Date.now() / 1000)}`
  try {
    const burstRaw = await kv.get(secondKey)
    const burstCount = burstRaw ? (JSON.parse(burstRaw)?.count ?? 0) : 0
    if (burstCount >= 3) {
      console.warn('[AIQuota] Burst limit exceeded for', burstSubject)
      return { allowed: false, remaining: 0, resetIn: 1 }
    }
    await kv.put(secondKey, JSON.stringify({ count: burstCount + 1 }), { expirationTtl: 5 })
  } catch (e) {
    // Fail open on burst check errors — don't block legitimate requests due to KV hiccups
    console.warn('[AIQuota] Burst KV error — allowing request:', e?.message)
  }

  // Daily quota window: keyed by UTC date string (YYYY-MM-DD)
  const today = todayUTC()
  let kvKey
  let limit

  if (uid) {
    kvKey = `quota:${uid}:${today}`
    limit = limitForUid()
  } else {
    // Anonymous: use IP, stricter limit
    const ip = request.headers.get('cf-connecting-ip')
           || request.headers.get('x-forwarded-for')
           || 'unknown'
    kvKey = `quota:ip:${ip}:${today}`
    limit = ANON_IP_TURNS_PER_DAY
  }

  try {
    const raw     = await kv.get(kvKey)
    const current = raw ? (JSON.parse(raw)?.turns ?? 0) : 0

    if (current + cost > limit) {
      return { allowed: false, remaining: Math.max(0, limit - current), resetAt }
    }

    // Increment
    await kv.put(kvKey, JSON.stringify({ turns: current + cost }), { expirationTtl: 172800 })

    return { allowed: true, remaining: Math.max(0, limit - current - cost), resetAt }
  } catch (e) {
    // Fail open: KV errors shouldn't block legitimate users
    console.error('[AIQuota] KV error — allowing request (fail-open):', e?.message)
    return { allowed: true, remaining: 10, resetAt }
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
  const kv      = env.PUSH_SUBSCRIPTIONS
  const resetAt = nextMidnightUTC()
  const today   = todayUTC()
  const limit   = uid ? limitForUid() : ANON_IP_TURNS_PER_DAY

  if (!kv) {
    console.warn('[AIQuota] PUSH_SUBSCRIPTIONS KV unavailable in getQuotaStatus — returning full quota')
    return { used: 0, limit, remaining: limit, resetAt }
  }

  try {
    const kvKey = uid ? `quota:${uid}:${today}` : null
    if (!kvKey) return { used: 0, limit, remaining: limit, resetAt }

    const raw  = await kv.get(kvKey)
    const used = raw ? (JSON.parse(raw)?.turns ?? 0) : 0
    return { used, limit, remaining: Math.max(0, limit - used), resetAt }
  } catch (e) {
    console.error('[AIQuota] KV error in getQuotaStatus:', e?.message)
    return { used: 0, limit, remaining: limit, resetAt }
  }
}
