/**
 * /api/save-progress — iOS exit-save insurance endpoint.
 *
 * Receives progress JSON via navigator.sendBeacon POST when the user closes the app
 * on iOS Safari (where the Firebase SDK async setDoc may not complete before page kill).
 * Verifies the Firebase ID token from the request body, then writes to Firestore via
 * the REST API using the user's own token (Firestore rules allow owner writes).
 *
 * sendBeacon sends a Blob with Content-Type: application/json containing:
 *   { token: "<Firebase ID token>", uid: "<user UID>", data: "<JSON string of progress>" }
 */

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';
import { toDocId } from './_docId.js';

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  // CORS guard — allow empty Origin (PWA home-screen app, iOS sendBeacon in standalone mode).
  // Firebase token in the request body is the security boundary.
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders(origin) });
  }

  // Rate limit: 30 saves per minute per IP (well above normal usage)
  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429, headers: corsHeaders(origin) });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: corsHeaders(origin) });
  }

  const { token, uid, data } = body || {};
  if (!token || !uid || !data) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: corsHeaders(origin) });
  }

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), { status: 500, headers: corsHeaders(origin) });
  }

  // Verify Firebase ID token by constructing a synthetic request with Bearer header
  const syntheticReq = new Request('https://dummy.internal', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifiedUid = await getFirebaseUid(syntheticReq, FIREBASE_PROJECT_ID);
  if (!verifiedUid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders(origin) });
  }

  // Ensure the token's uid matches the claimed uid (prevents one user writing another's doc)
  if (verifiedUid !== uid) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders(origin) });
  }

  // Validate data is a JSON string (progress blob) and within Firestore size limit.
  // validProgressSize() in Firestore rules rejects progress > 200KB — pre-check here
  // so we return a clear 413 rather than silently failing with a Firestore 403.
  if (typeof data !== 'string' || data.length > 204800) {
    return new Response(JSON.stringify({ error: 'payload_too_large' }), { status: 413, headers: corsHeaders(origin) });
  }
  try {
    JSON.parse(data);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_data' }), { status: 400, headers: corsHeaders(origin) });
  }

  // Write to Firestore via REST API using the user's own ID token.
  // Only updates `progress` and `updated` — leaves all other fields (leaderboard, family) intact.
  // The Firestore security rule allows each user to write their own /users/{docId} document.
  const docId = toDocId(uid);
  // Only update progress blob + timestamp. Do NOT write top-level xp here:
  // fbApplyDelta owns the authoritative xp field via atomic increments. If this beacon
  // wrote a stale absolute xp value (local state may lag behind atomic deltas from another
  // device), validXpUpdate in Firestore rules would reject the entire PATCH with 403.
  // The progress blob already contains stats.xp; the overlay in fbWatchProgress/fbLoadProgress
  // handles the Math.max merge when the snapshot is read back.
  const firestoreUrl = [
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}`,
    `/databases/(default)/documents/users/${docId}`,
    `?updateMask.fieldPaths=progress&updateMask.fieldPaths=updated`,
  ].join('');

  try {
    const res = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        fields: {
          progress: { stringValue: data },
          updated:  { integerValue: String(Date.now()) },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[save-progress] Firestore write failed:', res.status, errText.slice(0, 200));
      return new Response('Upstream error', { status: 502, headers: corsHeaders(origin) });
    }
  } catch (e) {
    console.warn('[save-progress] Fetch error:', e.message);
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 503, headers: corsHeaders(origin) });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
