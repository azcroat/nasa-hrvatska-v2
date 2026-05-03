/**
 * /api/report-error — client-side error telemetry endpoint.
 *
 * Receives structured error reports from the browser via sendBeacon or fetch.
 * Logs them as structured JSON to console.error (visible in Cloudflare Workers
 * dashboard under "Logs" for the Pages project).
 *
 * Optional: set SENTRY_DSN env var to also forward errors to Sentry via the
 * Sentry Envelope API. This gives persistent storage + alerting beyond the
 * ephemeral Cloudflare log stream.
 *
 * No authentication required — errors come from unauthenticated contexts too
 * (e.g. login screen crashes). Rate limiting relies on Cloudflare's built-in
 * per-IP throttling.
 */

import { corsHeaders, isAllowedOrigin } from './_helpers.js';
import { checkRateLimit } from './_rateLimit.js';

// In-memory deduplication per Worker instance (resets on restart, ~a few minutes).
// Prevents log storms from a single browser hammering the endpoint.
const _seen = new Map();
const DEDUP_WINDOW_MS = 60_000; // 1 minute per unique message

function isDuplicate(message) {
  const key = String(message).slice(0, 120);
  const last = _seen.get(key) || 0;
  if (Date.now() - last < DEDUP_WINDOW_MS) return true;
  _seen.set(key, Date.now());
  // Prune map if it grows too large
  if (_seen.size > 200) {
    const oldest = [..._seen.entries()].sort((a, b) => a[1] - b[1])[0][0];
    _seen.delete(oldest);
  }
  return false;
}

/**
 * Forward a structured error to Sentry via the Envelope API.
 * Uses SENTRY_DSN env var — format: https://PUBLIC_KEY@sentry.io/PROJECT_ID
 * No SDK needed — raw HTTP envelope format.
 */
async function forwardToSentry(dsn, payload) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '');
    const publicKey = url.username;
    const storeUrl = `https://${url.hostname}/api/${projectId}/store/`;

    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date(payload.ts || Date.now()).toISOString(),
      platform: 'javascript',
      level: 'error',
      exception: {
        values: [
          {
            type: 'Error',
            value: String(payload.message).slice(0, 500),
            stacktrace: payload.stack
              ? {
                  frames: String(payload.stack)
                    .split('\n')
                    .slice(1, 8)
                    .map((line) => ({
                      filename: (line.match(/\((.+?):\d+:\d+\)/) || [])[1] || line.trim(),
                      function: (line.match(/at\s+(\S+)/) || [])[1] || '?',
                    }))
                    .reverse(),
                }
              : undefined,
          },
        ],
      },
      tags: {
        context: String(payload.context || '').slice(0, 100),
        source: 'report-error-worker',
      },
      request: payload.url ? { url: String(payload.url).slice(0, 200) } : undefined,
    };

    await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Sentry forwarding is best-effort — never block the response
  }
}

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
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  // 30 reports/min per IP — prevents log-flood abuse
  const allowed = await checkRateLimit(request, 30, env);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, // Return 200 so sendBeacon doesn't retry
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const body = await request.json();
    const { message = '', stack = '', context: ctx = '', url = '', ts = 0 } = body;

    // Dedup guard — prevents log storms from a single error repeating rapidly
    if (!isDuplicate(message)) {
      const structured = {
        type: 'client_error',
        message: String(message).slice(0, 500),
        stack: String(stack).slice(0, 1500),
        context: String(ctx).slice(0, 100),
        url: String(url)
          .replace(/[?#].*/, '')
          .slice(0, 200),
        ts: Number(ts) || 0,
      };

      // Structured log — visible in Cloudflare Pages → Functions → Logs
      console.error(JSON.stringify(structured));

      // Forward to Sentry if SENTRY_DSN is configured
      if (env.SENTRY_DSN) {
        context.waitUntil(forwardToSentry(env.SENTRY_DSN, structured));
      }
    }
  } catch {
    // Malformed body — still return 200 so sendBeacon doesn't retry
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
