// functions/api/push-send.js
// Send a Web Push notification to a single user by userId.
// Authentication: x-cron-secret header (for server-side callers) OR Firebase auth token.
//
// POST body: { userId, title, body, url }
//   userId — Firebase UID (used as KV key lookup)
//   title  — notification title (optional, has default)
//   body   — notification body (optional, has default)
//   url    — click-through URL (optional, defaults to '/')
//
// Response:
//   { ok: true }                   — push sent successfully
//   { ok: false, expired: true }   — subscription expired; it has been deleted from KV
//   { error: string }              — 4xx/5xx errors

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { corsHeaders, isAllowedOrigin, ok, err } from './_helpers.js';

// ── VAPID JWT + raw Web Push send (no npm dependency) ─────────────────────────
async function sendWebPush(subscription, payload, env) {
  const VAPID_PRIVATE = env.VAPID_PRIVATE_KEY;
  const VAPID_PUBLIC  = env.VAPID_PUBLIC_KEY;
  const VAPID_SUBJECT = 'mailto:support@nasahrvatska.com';

  if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
    throw new Error('VAPID keys not configured');
  }

  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  // Build VAPID JWT header + payload (ES256)
  const jwtHeader  = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwtPayload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const sigInput = `${jwtHeader}.${jwtPayload}`;

  // Import VAPID private key (PKCS8 DER, base64url-encoded)
  const keyBytes = Uint8Array.from(
    atob(VAPID_PRIVATE.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const token = `${sigInput}.${sig}`;

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${token},k=${VAPID_PUBLIC}`,
      'Content-Type':  'application/json',
      'TTL':           '86400',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  return res.status;
}

// Constant-time string comparison — prevents timing attacks on secret comparison.
// Always iterates the full length regardless of match/mismatch position.
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(String(a));
  const bBytes = enc.encode(String(b));
  const len = Math.max(aBytes.length, bBytes.length);
  // Seed diff=1 when lengths differ so unequal-length strings always fail
  let diff = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
     
    diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }
  return diff === 0;
}

// ── Auth: accept either CRON_SECRET or a valid Firebase ID token ───────────────
async function isAuthorized(request, env) {
  const cronSecret = request.headers.get('x-cron-secret') || '';
  if (env.CRON_SECRET && timingSafeEqual(cronSecret, env.CRON_SECRET)) return true;

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (FIREBASE_PROJECT_ID) {
    const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
    if (uid) return true;
  }

  return false;
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const isDev  = env.ENVIRONMENT !== 'production';

  // CORS check (allow same-origin calls and cron secret callers with no origin)
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Rate-limit: generous since only trusted callers should reach here
  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // Auth check
  const authorized = await isAuthorized(request, env);
  if (!authorized) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders(origin) });
  }

  if (!env.PUSH_SUBSCRIPTIONS) {
    return new Response(JSON.stringify({ ok: false, warning: 'push_not_configured' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return err(400, 'Invalid content type', origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return err(400, 'Invalid JSON', origin); }

  const { userId, title, body: msgBody, url } = body;

  if (!userId || typeof userId !== 'string') {
    return err(400, 'Missing or invalid userId', origin);
  }

  // Sanitize the KV key the same way push-subscribe.js does
  const kvKey = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

  let record;
  try {
    record = await env.PUSH_SUBSCRIPTIONS.get(kvKey, { type: 'json' });
  } catch (e) {
    console.error('[push-send] KV get error:', e.message);
    return err(500, 'Storage error', origin);
  }

  if (!record?.subscription?.endpoint) {
    return err(404, 'No push subscription found for this user', origin);
  }

  const payload = {
    title:   String(title  || 'Naša Hrvatska').slice(0, 100),
    body:    String(msgBody || 'Time to practice Croatian!').slice(0, 200),
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/badge-72.png',
    tag:     'nh-push',
    renotify: true,
    data:    { url: String(url || '/').slice(0, 500) },
    actions: [
      { action: 'study',   title: '📚 Study Now' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  try {
    const status = await sendWebPush(record.subscription, payload, env);
    const expired = status === 410 || status === 404;

    if (expired) {
      // Clean up stale subscription
      await env.PUSH_SUBSCRIPTIONS.delete(kvKey).catch(() => {});
      return ok({ ok: false, expired: true, status }, origin);
    }

    return ok({ ok: status >= 200 && status < 300, status }, origin);
  } catch (e) {
    console.error('[push-send] sendWebPush error:', e.message);
    return err(500, e.message, origin);
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
