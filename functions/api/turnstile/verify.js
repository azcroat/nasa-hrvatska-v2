// Cloudflare Pages Function - Turnstile token verification
// POST /api/turnstile/verify { token, action? }
// Verifies a Turnstile challenge token via Cloudflare's siteverify endpoint
// using the TURNSTILE_SECRET_KEY env var. Returns { ok: true/false, error? }.
//
// This is the pre-auth bot gate for signup. No Firebase token required - this
// endpoint runs before the user has an account. Rate-limited by the global
// middleware to prevent brute-force token guessing.

import { checkRateLimit } from '../_rateLimit.js';

function CORS(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function isAllowedOrigin(origin, isDev) {
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: CORS(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), {
      status: 403,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }

  const allowed = await checkRateLimit(request, 10, env);
  if (!allowed) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Too many requests. Please wait a minute.' }),
      { status: 429, headers: { ...CORS(origin), 'Content-Type': 'application/json' } },
    );
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type.' }), {
      status: 400,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }

  const TURNSTILE_SECRET = env.TURNSTILE_SECRET_KEY;
  if (!TURNSTILE_SECRET) {
    // Feature flag: if no secret is configured, signup proceeds without Turnstile.
    // The client widget is also feature-flagged on VITE_TURNSTILE_SITEKEY so they stay in sync.
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Bad request' }), {
      status: 400,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }

  const token = (body?.token || '').toString().trim();
  if (!token || token.length > 4096) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid token.' }), {
      status: 400,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }

  const expectedAction = (body?.action || '').toString().trim() || null;
  const ip = request.headers.get('cf-connecting-ip') || '';

  try {
    const form = new URLSearchParams();
    form.set('secret', TURNSTILE_SECRET);
    form.set('response', token);
    if (ip) form.set('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    const success = data?.success === true;

    // Action binding: if the client declared an expected action and Turnstile returned
    // a different one, treat as failed. Defends against cross-form token reuse.
    if (success && expectedAction && data?.action && data.action !== expectedAction) {
      return new Response(JSON.stringify({ ok: false, error: 'Action mismatch.' }), {
        status: 400,
        headers: { ...CORS(origin), 'Content-Type': 'application/json' },
      });
    }

    if (!success) {
      const codes = Array.isArray(data?.['error-codes']) ? data['error-codes'] : [];
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Verification failed. Please try again.',
          codes,
        }),
        { status: 400, headers: { ...CORS(origin), 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[turnstile/verify] siteverify error:', e?.message);
    return new Response(JSON.stringify({ ok: false, error: 'Service temporarily unavailable.' }), {
      status: 502,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }
}
