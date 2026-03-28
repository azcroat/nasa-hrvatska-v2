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
const PAID_TURNS_PER_DAY        = 200
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

  if (!kv) {
    console.warn('[AIQuota] PUSH_SUBSCRIPTIONS KV unavailable — allowing request through')
    return { allowed: true, remaining: 999, resetAt }
  }

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
    console.error('[AIQuota] KV error — allowing request through:', e?.message)
    return { allowed: true, remaining: 999, resetAt }
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
    console.warn('[AIQuota] PUSH_SUBSCRIPTIONS KV unavailable — returning zero usage')
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
