// functions/api/push-subscribe.js
// Registers a browser push subscription in Cloudflare KV.
// Called from the client when the user grants push notification permission.
// The subscription is read later by the scheduled worker (functions/scheduled.js).

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    if (isDev && h === 'localhost') return true;
    return (
      h === 'nasahrvatska.com' ||
      h.endsWith('.nasahrvatska.com') ||
      h === 'nasa-hrvatska-v2.pages.dev' ||
      h.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache',
  };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  const allowed = await checkRateLimit(request, 10); // 10/min — subscribe is rare
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Require Firebase auth — reject if misconfigured (never allow anonymous subscriptions)
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

  if (!env.PUSH_SUBSCRIPTIONS) {
    // KV not configured — push is optional, return success with warning
    return new Response(JSON.stringify({ ok: true, warning: 'push_not_configured' }), {
      status: 200,
      headers: corsHeaders(origin),
    });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'invalid_content_type' }), {
      status: 400,
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

  const { subscription, streak = 0, name = '' } = body;
  if (!subscription?.endpoint) {
    return new Response(JSON.stringify({ error: 'Missing subscription' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  // Sanitize subscription endpoint
  try {
    new URL(subscription.endpoint);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid endpoint URL' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const kvKey = (uid || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const today = new Date().toISOString().slice(0, 10);

  try {
    await env.PUSH_SUBSCRIPTIONS.put(
      kvKey,
      JSON.stringify({
        subscription,
        streak: Math.max(0, Math.floor(Number(streak) || 0)),
        name: String(name || '').slice(0, 50),
        lastPracticed: today, // don't notify on subscribe day
        lastNotified: null,
        updatedAt: Date.now(),
      }),
      { expirationTtl: 60 * 60 * 24 * 90 }, // auto-expire after 90 days
    );
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (e) {
    console.error('[push-subscribe] KV write error:', e.message);
    return new Response(JSON.stringify({ error: 'Storage error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
