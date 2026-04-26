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

// ── RFC 8291 payload encryption (ECDH + AES-128-GCM) ─────────────────────────
// Web Push services require encrypted payloads when the subscription includes keys.
// Two-stage HKDF derivation:
//   Stage 1 — combine ECDH shared secret with auth secret into IKM
//   Stage 2 — derive CEK (16 bytes) and nonce (12 bytes) from IKM using a random salt

function b64uDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
}

function concatBytes(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

async function encryptPayload(plaintextBytes, subscription) {
  const uaPublicBytes = b64uDecode(subscription.keys.p256dh);
  const authSecret = b64uDecode(subscription.keys.auth);

  // Generate ephemeral P-256 key pair (Application Server)
  const asKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ]);
  const asPublicBytes = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey));

  // Import user-agent public key for ECDH
  const uaPublicKey = await crypto.subtle.importKey(
    'raw',
    uaPublicBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // ECDH shared secret (32 bytes)
  const ecdhBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey },
    asKeyPair.privateKey,
    256,
  );
  const ecdhSecret = new Uint8Array(ecdhBits);

  // Stage 1: IKM = HKDF(salt=auth_secret, IKM=ecdh_secret,
  //                     info="WebPush: info\x00" + uaPublic + asPublic, L=32)
  const ikmMaterial = await crypto.subtle.importKey('raw', ecdhSecret, 'HKDF', false, [
    'deriveBits',
  ]);
  const keyInfo = concatBytes(
    new TextEncoder().encode('WebPush: info\x00'),
    uaPublicBytes,
    asPublicBytes,
  );
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: keyInfo },
      ikmMaterial,
      256,
    ),
  );

  // Stage 2: derive CEK and nonce from IKM using a random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);

  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new TextEncoder().encode('Content-Encoding: aes128gcm\x00\x01'),
      },
      ikmKey,
      128,
    ),
  );
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new TextEncoder().encode('Content-Encoding: nonce\x00\x01'),
      },
      ikmKey,
      96,
    ),
  );

  // Encrypt: AES-128-GCM(plaintext + 0x02 padding delimiter)
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      concatBytes(plaintextBytes, new Uint8Array([0x02])), // 0x02 = last-record delimiter (RFC 8188)
    ),
  );

  // Build aes128gcm content-coding header: salt(16) + rs(4, BE) + keyIDLen(1) + keyID(65)
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false); // record size
  header[20] = 65; // key ID length
  header.set(asPublicBytes, 21);

  return concatBytes(header, ciphertext);
}

// ── VAPID JWT + Web Push send ─────────────────────────────────────────────────
async function sendWebPush(subscription, payload, env) {
  const VAPID_PRIVATE = env.VAPID_PRIVATE_KEY;
  const VAPID_PUBLIC = env.VAPID_PUBLIC_KEY;
  const VAPID_SUBJECT = 'mailto:support@nasahrvatska.com';

  if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
    throw new Error('VAPID keys not configured');
  }

  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  // Build VAPID JWT header + payload (ES256)
  const jwtHeader = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const jwtPayload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigInput = `${jwtHeader}.${jwtPayload}`;

  // Import VAPID private key (PKCS8 DER, base64url-encoded)
  const keyBytes = b64uDecode(VAPID_PRIVATE);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const token = `${sigInput}.${sig}`;

  // Encrypt payload when the subscription includes encryption keys (RFC 8291).
  // All modern browser PushManager subscriptions include keys — unencrypted pushes
  // are rejected with 400 by Chrome (FCM) and Firefox push services.
  let body;
  const pushHeaders = {
    Authorization: `vapid t=${token},k=${VAPID_PUBLIC}`,
    TTL: '86400',
  };

  if (subscription.keys?.p256dh && subscription.keys?.auth) {
    const plaintextBytes = new TextEncoder().encode(JSON.stringify(payload));
    body = await encryptPayload(plaintextBytes, subscription);
    pushHeaders['Content-Type'] = 'application/octet-stream';
    pushHeaders['Content-Encoding'] = 'aes128gcm';
  } else {
    // No encryption keys — send without a body so the service worker
    // shows a generic notification on the push event.
    body = null;
    pushHeaders['Content-Length'] = '0';
  }

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: pushHeaders,
    body,
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
  const isDev = env.ENVIRONMENT !== 'production';

  // CORS check (allow same-origin calls and cron secret callers with no origin)
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  // Rate-limit: generous since only trusted callers should reach here
  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // Auth check — accept either CRON_SECRET (server-to-server) or Firebase user token
  const cronSecret = request.headers.get('x-cron-secret') || '';
  const isCron = env.CRON_SECRET && timingSafeEqual(cronSecret, env.CRON_SECRET);
  const authorized = await isAuthorized(request, env);
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: corsHeaders(origin),
    });
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
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON', origin);
  }

  const { userId, title, body: msgBody, url } = body;

  if (!userId || typeof userId !== 'string') {
    return err(400, 'Missing or invalid userId', origin);
  }

  // Non-cron callers: enforce that the Firebase-authenticated UID matches the target userId.
  // This prevents any authenticated user from sending push notifications to other users.
  if (!isCron) {
    const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
    const callerUid = FIREBASE_PROJECT_ID
      ? await getFirebaseUid(request, FIREBASE_PROJECT_ID)
      : null;
    if (!callerUid || callerUid !== userId) {
      return err(403, 'forbidden', origin);
    }
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
    title: String(title || 'Naša Hrvatska').slice(0, 100),
    body: String(msgBody || 'Time to practice Croatian!').slice(0, 200),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72.png',
    tag: 'nh-push',
    renotify: true,
    data: { url: String(url || '/').slice(0, 500) },
    actions: [
      { action: 'study', title: '📚 Study Now' },
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
