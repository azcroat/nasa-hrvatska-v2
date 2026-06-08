/**
 * Per-user daily AI usage quota — D1 primary, KV fallback.
 *
 * D1 (SQLite at the edge) gives globally consistent atomic increments,
 * eliminating the per-datacenter Cache API bypass in the previous version.
 *
 * Binding name:   AI_QUOTA_DB  (D1 database — bind in Cloudflare dashboard)
 * Fallback:       PUSH_SUBSCRIPTIONS (KV) — used if D1 not bound
 *
 * Key format (KV fallback):   quota:{uid}:{YYYY-MM-DD}
 * Burst key (KV fallback):    quota_burst:{uid}:{unix-second}
 * D1 table:                   ai_quota(subject, turns, window_date)
 *                             ai_burst(subject, count, window_second)
 */

// Generous per-user daily ceiling — an ABUSE cap, not a paywall. AI is free for
// all signed-in users; this only stops a runaway/compromised account. Raise freely.
const FREE_ANNUAL_TURNS_PER_DAY = 300;
const ANON_IP_TURNS_PER_DAY = 15;

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function nextMidnightUTC() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

function secondsUntilMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
}

function limitForUid() {
  return FREE_ANNUAL_TURNS_PER_DAY;
}

// ── D1 helpers (primary storage) ─────────────────────────────────────────────

async function _d1CheckBurst(db, subject) {
  if (!db) return false;
  const nowSecond = Math.floor(Date.now() / 1000);
  try {
    // Upsert: reset count if window_second changed (new second), else increment
    const result = await db
      .prepare(
        `
      INSERT INTO ai_burst (subject, count, window_second) VALUES (?1, 1, ?2)
      ON CONFLICT(subject) DO UPDATE SET
        count = CASE WHEN window_second = ?2 THEN count + 1 ELSE 1 END,
        window_second = ?2
      RETURNING count
    `,
      )
      .bind(subject, nowSecond)
      .first();
    return (result?.count ?? 1) > 3;
  } catch (e) {
    console.warn('[AIQuota] D1 burst check failed:', e?.message);
    return false; // fail-open for burst (secondary guard only)
  }
}

async function _d1CheckAndIncrement(db, subject, today, cost, limit) {
  if (!db) return null;
  try {
    // Upsert row; if date changed, reset turns to cost (start of new window)
    const upsert = await db
      .prepare(
        `
      INSERT INTO ai_quota (subject, turns, window_date) VALUES (?1, ?2, ?3)
      ON CONFLICT(subject) DO UPDATE SET
        turns = CASE WHEN window_date = ?3 THEN turns + ?2 ELSE ?2 END,
        window_date = ?3
      RETURNING turns, window_date
    `,
      )
      .bind(subject, cost, today)
      .first();

    if (!upsert) throw new Error('D1 upsert returned no rows');

    const currentTurns = upsert.turns;

    if (currentTurns > limit) {
      // Over-incremented — roll back the cost to leave an accurate count
      await db
        .prepare(
          `
        UPDATE ai_quota SET turns = turns - ?1
        WHERE subject = ?2 AND window_date = ?3
      `,
        )
        .bind(cost, subject, today)
        .run();
      return { allowed: false, turns: currentTurns - cost };
    }

    return { allowed: true, turns: currentTurns };
  } catch (e) {
    console.warn('[AIQuota] D1 check failed:', e?.message);
    return null; // signal caller to fall back to KV
  }
}

async function _d1GetStatus(db, subject, today) {
  if (!db) return null;
  try {
    const row = await db
      .prepare('SELECT turns, window_date FROM ai_quota WHERE subject = ?1')
      .bind(subject)
      .first();
    if (!row || row.window_date !== today) return { turns: 0 };
    return { turns: row.turns };
  } catch (e) {
    console.warn('[AIQuota] D1 status check failed:', e?.message);
    return null;
  }
}

// ── KV helpers (fallback storage) ────────────────────────────────────────────

async function _kvRead(kv, key) {
  if (!kv) return null;
  try {
    const raw = await kv.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function _kvWrite(kv, key, data, ttlSeconds) {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
  } catch (e) {
    console.warn('[AIQuota] KV write failed:', e?.message);
  }
}

// ── Core quota functions ──────────────────────────────────────────────────────

export async function checkAIQuota(request, env, uid, cost = 1) {
  const db = env.AI_QUOTA_DB || null;
  const kv = env.PUSH_SUBSCRIPTIONS || null;
  const resetAt = nextMidnightUTC();
  const today = todayUTC();

  if (!db && !kv) {
    console.warn(
      '[AIQuota] Neither AI_QUOTA_DB nor PUSH_SUBSCRIPTIONS bound — rejecting (fail-closed)',
    );
    return { allowed: false, remaining: 0, resetAt };
  }

  // ── Burst check ───────────────────────────────────────────────────────────
  const burstSubject = uid
    ? `burst:${uid}`
    : `burst:ip:${request.headers.get('cf-connecting-ip') || 'unknown'}`;

  if (db) {
    const burstExceeded = await _d1CheckBurst(db, burstSubject);
    if (burstExceeded) {
      console.warn('[AIQuota] Burst limit exceeded (D1):', burstSubject);
      return { allowed: false, remaining: 0, resetAt };
    }
  } else {
    // KV burst fallback
    const secondKey = `quota_burst:${burstSubject}:${Math.floor(Date.now() / 1000)}`;
    const burstData = await _kvRead(kv, secondKey);
    if ((burstData?.count ?? 0) >= 3) {
      return { allowed: false, remaining: 0, resetAt };
    }
    await _kvWrite(kv, secondKey, { count: (burstData?.count ?? 0) + 1 }, 5);
  }

  // ── Daily quota ───────────────────────────────────────────────────────────
  const quotaSubject = uid
    ? `quota:${uid}`
    : `quota:ip:${request.headers.get('cf-connecting-ip') || 'unknown'}`;
  const limit = uid ? limitForUid() : ANON_IP_TURNS_PER_DAY;

  // Try D1 first
  if (db) {
    const d1Result = await _d1CheckAndIncrement(db, quotaSubject, today, cost, limit);
    if (d1Result !== null) {
      const remaining = Math.max(0, limit - d1Result.turns);
      return { allowed: d1Result.allowed, remaining, resetAt };
    }
    // D1 failed — fall through to KV
    console.warn('[AIQuota] D1 failed, falling back to KV');
  }

  // KV fallback
  const kvKey = uid
    ? `quota:${uid}:${today}`
    : `quota:ip:${request.headers.get('cf-connecting-ip') || 'unknown'}:${today}`;
  try {
    const data = await _kvRead(kv, kvKey);
    const current = data?.turns ?? 0;
    if (current + cost > limit) {
      return { allowed: false, remaining: Math.max(0, limit - current), resetAt };
    }
    await _kvWrite(kv, kvKey, { turns: current + cost }, secondsUntilMidnight());
    return { allowed: true, remaining: Math.max(0, limit - current - cost), resetAt };
  } catch (e) {
    console.error('[AIQuota] All storage backends failed — rejecting (fail-closed):', e?.message);
    return { allowed: false, remaining: 0, resetAt };
  }
}

export async function getQuotaStatus(env, uid) {
  const db = env.AI_QUOTA_DB || null;
  const kv = env.PUSH_SUBSCRIPTIONS || null;
  const resetAt = nextMidnightUTC();
  const today = todayUTC();
  const limit = uid ? limitForUid() : ANON_IP_TURNS_PER_DAY;

  if (!uid) return { used: 0, limit, remaining: limit, resetAt };

  const quotaSubject = `quota:${uid}`;

  if (db) {
    const status = await _d1GetStatus(db, quotaSubject, today);
    if (status !== null) {
      const used = status.turns;
      return { used, limit, remaining: Math.max(0, limit - used), resetAt };
    }
  }

  // KV fallback
  const kvKey = `quota:${uid}:${today}`;
  try {
    const data = await _kvRead(kv, kvKey);
    const used = data?.turns ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used), resetAt };
  } catch (e) {
    console.error('[AIQuota] getQuotaStatus error:', e?.message);
    return { used: 0, limit, remaining: limit, resetAt };
  }
}
