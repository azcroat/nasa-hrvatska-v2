// functions/api/streak-push.js
// Internal endpoint: sends a Web Push notification to a single push subscription.
// Authentication: x-cron-secret header must match env.CRON_SECRET (set in Cloudflare dashboard).
// Called by the scheduled Cloudflare Worker defined in functions/scheduled.js.

// Deterministic variant picker — uses (streak + seed) % length so the same
// user gets a different message each day without needing localStorage in a Worker.
function pickIdx(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function buildNotification(name, streak, dueSeed = 0) {
  const displayName = (name || '').split(' ')[0].trim() || 'Učenik';
  const nameTag    = `, ${displayName}`;
  const namePrefix = `${displayName}, `;

  // Seed varies by day so messages rotate daily
  const daySeed = Math.floor(Date.now() / 86400000) + streak + dueSeed;

  // ── No streak yet ─────────────────────────────────────────────────────────
  if (streak === 0) {
    const titles = [
      '🇭🇷 Naša Hrvatska',
      `📅 Start your streak today${nameTag}!`,
      `🇭🇷 Croatian is waiting${nameTag}`,
      `⏰ ${namePrefix}study time!`,
      `🌟 ${namePrefix}begin your Croatian journey`,
    ];
    const bodies = [
      `${namePrefix}your Croatian streak is waiting. Start today!`,
      `Even 5 minutes of Croatian builds a habit. Open the app and start! 🇭🇷`,
      `Dobar dan${nameTag}! Time for today's Croatian lesson.`,
      `Your Croatian skills are waiting — first lesson is the hardest. Go for it!`,
      `${namePrefix}language starts with one session. Today's the day! 🇭🇷`,
    ];
    return {
      title:   pickIdx(titles, daySeed),
      body:    pickIdx(bodies, daySeed + 1),
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/badge-72.png',
      tag:     'streak-reminder',
      renotify: true,
      data:    { url: '/', action: 'open_lesson' },
      actions: [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    };
  }

  // ── Early streak (1–6 days) ───────────────────────────────────────────────
  if (streak < 7) {
    const titles = [
      `🔥 Keep your ${streak}-day streak${nameTag}!`,
      `⏰ ${namePrefix}your streak is at risk!`,
      `🇭🇷 ${streak} days strong — don't stop${nameTag}`,
      `📅 Don't forget your Croatian today${nameTag}`,
      `🔥 ${namePrefix}${streak} days and counting!`,
    ];
    const bodies = [
      `${namePrefix}don't break your Croatian streak today. Just 5 minutes!`,
      `Maja is waiting. 5 minutes keeps your ${streak}-day streak alive 🔥`,
      `Your ${streak}-day streak ends tonight without a quick review.`,
      `Don't let ${streak} days of hard work slip away — one session saves it.`,
      `Quick quiz? ~5 minutes. Streak stays alive 🔥`,
    ];
    return {
      title:   pickIdx(titles, daySeed),
      body:    pickIdx(bodies, daySeed + 1),
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/badge-72.png',
      tag:     'streak-reminder',
      renotify: true,
      data:    { url: '/', action: 'open_lesson' },
      actions: [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    };
  }

  // ── Building habit (7–29 days) ────────────────────────────────────────────
  if (streak < 30) {
    const titles = [
      `🔥 ${streak} days of Croatian${nameTag}!`,
      `⭐ ${namePrefix}${streak}-day habit forming!`,
      `🇭🇷 ${streak} days strong${nameTag} — keep going!`,
      `🔥 ${namePrefix}you're building something real`,
      `📅 Day ${streak} — don't stop now${nameTag}!`,
    ];
    const bodies = [
      `${namePrefix}you're building a real habit. Keep it going today.`,
      `${streak} days in! You're ${30 - streak} days from a 30-day milestone 🎯`,
      `Your Croatian is genuinely improving. One more session today!`,
      `Research shows ${streak}+ day learners reach conversational level 3× faster. You're doing it!`,
      `Halfway to 30 days? Almost there. Don't quit now${nameTag}! 🔥`,
    ];
    return {
      title:   pickIdx(titles, daySeed),
      body:    pickIdx(bodies, daySeed + 1),
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/badge-72.png',
      tag:     'streak-reminder',
      renotify: true,
      data:    { url: '/', action: 'open_lesson' },
      actions: [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    };
  }

  // ── Champion (30+ days) ───────────────────────────────────────────────────
  const titles = [
    `⭐ ${streak}-day champion${nameTag}!`,
    `🏆 ${namePrefix}${streak} days — incredible!`,
    `🔥 ${streak} days of Croatian mastery${nameTag}`,
    `⭐ ${namePrefix}you're in the top 1% of learners`,
    `🇭🇷 ${streak} days — legend${nameTag}!`,
  ];
  const bodies = [
    `${namePrefix}you're on a ${streak}-day streak. Amazing — practice today!`,
    `${streak} days! Your consistency is extraordinary. One more session?`,
    `You've studied Croatian for ${streak} days straight. Don't let today be the day it ends.`,
    `${streak}-day streaks are rare. You're doing something most people only dream about!`,
    `At ${streak} days, you're not just learning — you're living the language. Keep going${nameTag}!`,
  ];
  return {
    title:   pickIdx(titles, daySeed),
    body:    pickIdx(bodies, daySeed + 1),
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/badge-72.png',
    tag:     'streak-reminder',
    renotify: true,
    data:    { url: '/', action: 'open_lesson' },
    actions: [
      { action: 'study',   title: '📚 Study Now' },
      { action: 'dismiss', title: 'Later'         },
    ],
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

// Constant-time string comparison — prevents timing attacks on secret comparison.
// Always iterates the full length regardless of match/mismatch position.
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(String(a));
  const bBytes = enc.encode(String(b));
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
     
    diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  // Internal-only: require CRON_SECRET
  const secret = request.headers.get('x-cron-secret') || '';
  if (!env.CRON_SECRET || !timingSafeEqual(secret, env.CRON_SECRET)) {
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
