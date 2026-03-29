/**
 * /api/report-error — client-side error telemetry endpoint.
 *
 * Receives structured error reports from the browser via sendBeacon or fetch.
 * Logs them as structured JSON to console.error (visible in Cloudflare Workers
 * dashboard under "Logs" for the Pages project).
 *
 * No authentication required — errors come from unauthenticated contexts too
 * (e.g. login screen crashes). Rate limiting relies on Cloudflare's built-in
 * per-IP throttling.
 */

import { corsHeaders, isAllowedOrigin } from './_helpers.js';

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  // Allow same-origin sendBeacon (no Origin header) or known origins
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json();
    const {
      message = '',
      stack = '',
      context: ctx = '',
      url = '',
      ts = 0,
    } = body;

    // Structured log — visible in Cloudflare Pages → Functions → Logs
    console.error(JSON.stringify({
      type: 'client_error',
      message: String(message).slice(0, 500),
      stack: String(stack).slice(0, 1500),
      context: String(ctx).slice(0, 100),
      url: String(url).replace(/[?#].*/, '').slice(0, 200),
      ts: Number(ts) || 0,
    }));
  } catch {
    // Malformed body — still return 200 so sendBeacon doesn't retry
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
