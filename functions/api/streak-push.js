// functions/api/streak-push.js
// Internal endpoint: sends a Web Push notification to a single push subscription.
// Authentication: x-cron-secret header must match env.CRON_SECRET (set in Cloudflare dashboard).
// Called by the scheduled Cloudflare Worker defined in functions/scheduled.js.

function buildNotification(name, streak) {
  const displayName = (name || 'Učenik').split(' ')[0]; // first name only

  if (streak === 0) {
    return {
      title: '🇭🇷 Naša Hrvatska',
      body: `${displayName}, your Croatian streak is waiting. Start today!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'streak-reminder',
      data: { url: '/' },
    };
  }
  if (streak < 7) {
    return {
      title: `🔥 Keep your ${streak}-day streak!`,
      body: `${displayName}, don't break your Croatian streak today.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'streak-reminder',
      data: { url: '/' },
    };
  }
  if (streak < 30) {
    return {
      title: `🔥 ${streak} days of Croatian!`,
      body: `${displayName}, you're building a real habit. Keep it going today.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'streak-reminder',
      data: { url: '/' },
    };
  }
  return {
    title: `⭐ ${streak}-day champion!`,
    body: `${displayName}, you're on a ${streak}-day streak. Amazing — practice today!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'streak-reminder',
    data: { url: '/' },
  };
}

async function sendWebPush(subscription, payload, env) {
  const VAPID_PRIVATE = env.VAPID_PRIVATE_KEY;
  const VAPID_PUBLIC  = env.VAPID_PUBLIC_KEY;
  const VAPID_SUBJECT = 'mailto:support@nasahrvatska.com';

  if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
    throw new Error('VAPID keys not configured in env');
  }

  // ── Build VAPID JWT (ES256) ────────────────────────────────────────────────
  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const headerB64 = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const sigInput = `${headerB64}.${payloadB64}`;

  // Import the VAPID private key (PKCS8 DER, base64url-encoded)
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

  // ── Send push request ─────────────────────────────────────────────────────
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

export async function onRequestPost({ request, env }) {
  // Internal-only: require CRON_SECRET
  const secret = request.headers.get('x-cron-secret') || '';
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response('Invalid content type', { status: 400 });
  }

  let body;
  try { body = await request.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const { subscription, streak = 0, name = '' } = body;
  if (!subscription?.endpoint) {
    return new Response(JSON.stringify({ error: 'Missing subscription.endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const notification = buildNotification(name, streak);

  try {
    const status = await sendWebPush(subscription, notification, env);

    // 410 Gone / 404 = subscription expired, caller should delete it
    const expired = status === 410 || status === 404;
    return new Response(JSON.stringify({ ok: !expired, expired, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[streak-push] sendWebPush error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
