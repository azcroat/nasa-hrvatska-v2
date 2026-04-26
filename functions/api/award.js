/**
 * POST /api/award — Server-side XP validation endpoint.
 *
 * Validates the activityType against ACTIVITY_XP_MAP and enforces a
 * 600 XP / 10-minute per-user velocity cap via Cloudflare KV.
 *
 * Returns { awarded, activityType } — the client writes awarded XP to
 * Firestore via the existing fbApplyDelta path. This Worker never writes
 * to Firestore directly (no service account needed).
 *
 * Error responses:
 *   401 { error: 'unauthorized' }     — missing/invalid Firebase token
 *   400 { error: 'invalid_activity_type' } — missing or non-string
 *   400 { error: 'invalid_xp' }       — non-integer, ≤ 0, or > 10000
 *   429 { error: 'rate_limited' }     — 60 req/min per IP exceeded
 */

import { ACTIVITY_XP_MAP } from './_activityXp.js';
import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';

const VELOCITY_BUDGET = 600; // XP per window
const VELOCITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const VELOCITY_TTL_S = 700; // KV TTL: 10 min + 2 min buffer

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }

  const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: corsHeaders(origin),
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const { activityType, claimedXp } = body || {};

  if (typeof activityType !== 'string' || !activityType.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_activity_type' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
    return new Response(JSON.stringify({ error: 'invalid_xp' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const maxXp = ACTIVITY_XP_MAP[activityType] ?? ACTIVITY_XP_MAP.default;

  // ── Per-user velocity check via KV ────────────────────────────────────────
  const kv = env.XP_VELOCITY;
  if (kv) {
    try {
      const now = Date.now();
      const key = `xpv2:${uid}`;
      const raw = await kv.get(key);
      let entry = raw ? JSON.parse(raw) : { total: 0, windowStart: now };

      // Reset window if it has expired
      if (now - entry.windowStart > VELOCITY_WINDOW_MS) {
        entry = { total: 0, windowStart: now };
      }

      const remaining = Math.max(0, VELOCITY_BUDGET - entry.total);
      const awarded = Math.min(claimedXp, maxXp, remaining);
      entry.total += awarded;

      // Write-back KV synchronously before returning — prevents concurrent requests from
      // reading the same pre-update state and each being awarded up to VELOCITY_BUDGET.
      await kv.put(key, JSON.stringify(entry), { expirationTtl: VELOCITY_TTL_S });

      return new Response(JSON.stringify({ awarded, activityType }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    } catch (e) {
      // KV unavailable — fall through to allowlist-only cap
      console.warn('[award] KV error, falling back to allowlist-only cap:', e.message);
    }
  }

  // ── KV unavailable: cap by allowlist only ─────────────────────────────────
  const awarded = Math.min(claimedXp, maxXp);
  return new Response(JSON.stringify({ awarded, activityType }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
