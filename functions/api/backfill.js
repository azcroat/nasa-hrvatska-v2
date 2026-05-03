/**
 * /api/backfill — Server-side user stats reconciliation endpoint.
 *
 * Iterates all /users documents in Firestore and reconciles any discrepancies
 * between the top-level scalar fields (xp, lessonsCompleted, streak) and the
 * values inside the progress JSON blob. Takes Math.max for all numeric counters.
 *
 * Auth: POST body must include { secret: "<CRON_SECRET>" }
 * Pagination: pass { pageToken: "..." } to continue from a prior response.
 * Returns: { ok, processed, updated, errors, nextPageToken, hasMore }
 *
 * Required Cloudflare Pages environment variables (set in dashboard, NOT here):
 *   CRON_SECRET                  — shared secret for auth
 *   FIREBASE_SERVICE_ACCOUNT_JSON — full service account JSON from Firebase console
 *   VITE_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID — Firebase project ID
 *
 * Usage (run once, then re-run with nextPageToken until hasMore === false):
 *   curl -X POST https://nasahrvatska.com/api/backfill \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"<CRON_SECRET>"}'
 */

import { corsHeaders, isAllowedOrigin } from './_helpers.js';

// ── Timing-safe string comparison ────────────────────────────────────────────
function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const te = new TextEncoder();
  const aBytes = te.encode(a);
  const bBytes = te.encode(b);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

// ── Base64URL helpers ─────────────────────────────────────────────────────────
function b64url(input) {
  const str = typeof input === 'string' ? input : String.fromCharCode(...new Uint8Array(input));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

// ── Service account → Firestore access token ─────────────────────────────────
async function getFirestoreToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = b64urlJson({ alg: 'RS256', typ: 'JWT' });
  const payload = b64urlJson({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const toSign = `${header}.${payload}`;

  // Strip PEM armour → DER bytes
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(toSign),
  );

  const jwt = `${toSign}.${b64url(sigBuf)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    signal: AbortSignal.timeout(12000),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Token exchange failed ${tokenRes.status}: ${errText.slice(0, 200)}`);
  }
  const { access_token } = await tokenRes.json();
  if (!access_token) throw new Error('No access_token in token response');
  return access_token;
}

// ── Firestore REST value extractor ───────────────────────────────────────────
function fsVal(v) {
  if (!v) return null;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue) return (v.arrayValue.values || []).map(fsVal);
  if (v.mapValue) {
    const m = {};
    for (const k in v.mapValue.fields || {}) m[k] = fsVal(v.mapValue.fields[k]);
    return m;
  }
  return null;
}

function intField(n) {
  return { integerValue: String(Math.max(0, Math.floor(n))) };
}
function strField(s) {
  return { stringValue: String(s) };
}

// ── Route handlers ────────────────────────────────────────────────────────────
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  // CORS — allow requests from the app and from curl (empty origin)
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auth — must supply the CRON_SECRET
  const CRON_SECRET = env.CRON_SECRET;
  if (!CRON_SECRET || !timingSafeEqual(body.secret, CRON_SECRET)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Config
  const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const SA_JSON = env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
  if (!PROJECT_ID || !SA_JSON) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Server misconfigured: missing FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT_JSON',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Get admin access token
  let token;
  try {
    token = await getFirestoreToken(SA_JSON);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: `Token error: ${e.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // List up to 100 user documents (paginated)
  const PAGE_SIZE = 100;
  const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`;
  const pageParam = body.pageToken ? `&pageToken=${encodeURIComponent(body.pageToken)}` : '';
  const listUrl = `${BASE_URL}?pageSize=${PAGE_SIZE}${pageParam}`;

  let docs = [];
  let nextPageToken;
  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!listRes.ok) {
      const errText = await listRes.text().catch(() => '');
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Firestore list failed ${listRes.status}: ${errText.slice(0, 200)}`,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const listData = await listRes.json();
    docs = listData.documents || [];
    nextPageToken = listData.nextPageToken;
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: `List error: ${e.message}` }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Reconcile each document ───────────────────────────────────────────────
  let processed = 0,
    updated = 0,
    skipped = 0,
    errors = 0;
  const errorLog = [];

  for (const doc of docs) {
    processed++;
    try {
      const fields = doc.fields || {};

      // Must have a progress blob to reconcile
      const progressStr = fsVal(fields.progress);
      if (!progressStr || typeof progressStr !== 'string') {
        skipped++;
        continue;
      }

      let progress;
      try {
        progress = JSON.parse(progressStr);
      } catch {
        errors++;
        errorLog.push(`${doc.name}: corrupted JSON`);
        continue;
      }

      const st = progress.stats || progress.st || {};

      // Top-level scalar fields stored directly on the Firestore document
      const topXP = Number(fsVal(fields.xp)) || 0;
      const topLC = Number(fsVal(fields.lessonsCompleted)) || 0;
      const topStreak = Number(fsVal(fields.streak)) || 0;

      // Values inside the progress blob
      const blobXP = Number(st.xp) || 0;
      const blobLC = Number(st.lc) || 0;
      const blobStreak =
        progress.streak && typeof progress.streak.count === 'number'
          ? progress.streak.count
          : Number(st.str) || 0;

      // Reconciled values — always take Math.max
      const reconcXP = Math.max(topXP, blobXP);
      const reconcLC = Math.max(topLC, blobLC);
      const reconcStreak = Math.max(topStreak, blobStreak);

      // Determine what (if anything) needs updating
      const blobNeedsUpdate =
        reconcXP !== blobXP || reconcLC !== blobLC || reconcStreak !== blobStreak;
      const topNeedsUpdate = reconcXP !== topXP || reconcLC !== topLC || reconcStreak !== topStreak;

      if (!blobNeedsUpdate && !topNeedsUpdate) {
        skipped++;
        continue;
      }

      // Update blob stats in-place
      if (blobNeedsUpdate) {
        progress.stats = { ...st, xp: reconcXP, lc: reconcLC, str: reconcStreak };
        if (progress.streak && typeof progress.streak.count === 'number') {
          progress.streak = { ...progress.streak, count: reconcStreak };
        }
      }

      // Build PATCH update mask and fields
      const updateFields = { progress: strField(JSON.stringify(progress)) };
      const fieldPaths = ['progress'];

      if (reconcXP !== topXP) {
        updateFields.xp = intField(reconcXP);
        fieldPaths.push('xp');
      }
      if (reconcLC !== topLC) {
        updateFields.lessonsCompleted = intField(reconcLC);
        fieldPaths.push('lessonsCompleted');
      }
      if (reconcStreak !== topStreak) {
        updateFields.streak = intField(reconcStreak);
        fieldPaths.push('streak');
      }

      const docId = doc.name.split('/').pop();
      const maskQS = fieldPaths
        .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
        .join('&');
      const patchUrl = `${BASE_URL}/${docId}?${maskQS}`;

      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ fields: updateFields }),
      });

      if (patchRes.ok) {
        updated++;
      } else {
        errors++;
        const errText = await patchRes.text().catch(() => '');
        errorLog.push(`${docId}: PATCH ${patchRes.status} ${errText.slice(0, 100)}`);
      }
    } catch (e) {
      errors++;
      errorLog.push(`${doc.name}: ${e.message}`);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed,
      updated,
      skipped,
      errors,
      errorLog: errorLog.slice(0, 20), // cap log size
      nextPageToken: nextPageToken || null,
      hasMore: !!nextPageToken,
      message: nextPageToken
        ? `Processed ${processed} users. Send { pageToken: "${nextPageToken}" } to continue.`
        : `Complete. Processed ${processed} users total.`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
