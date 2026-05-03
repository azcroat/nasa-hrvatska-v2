// Cloudflare Pages Function — Translation proxy
// Proxies to MyMemory (free, no key) so the browser never needs to
// hit an external domain directly — avoids CSP connect-src issues.
// Adding MYMEMORY_EMAIL env var lifts the limit from 1k → 10k words/day.

import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const allowed = await checkRateLimit(request, 30, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const { text, from, to } = await request.json();
    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response(JSON.stringify({ error: 'invalid_input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    if (!['en', 'hr'].includes(from) || !['en', 'hr'].includes(to) || from === to) {
      return new Response(JSON.stringify({ error: 'invalid_langpair' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const email = env.MYMEMORY_EMAIL || '';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${from}|${to}${email ? `&de=${encodeURIComponent(email)}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let upstream;
    try {
      upstream = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      throw fetchErr; // re-throw so outer catch handles it cleanly
    }

    // Read body as text first — non-2xx responses may return plain-text or HTML error
    // pages, and calling upstream.json() on those throws a parse error that falls into
    // the outer catch and hides the real HTTP status.
    let rawBody;
    try {
      rawBody = await upstream.text();
    } catch (bodyErr) {
      console.error('[translate] failed to read upstream response body:', bodyErr.message);
      return new Response(JSON.stringify({ error: 'server_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (!upstream.ok) {
      console.error('[translate] upstream HTTP error', upstream.status, rawBody.slice(0, 200));
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error('[translate] JSON parse failed:', rawBody.slice(0, 200));
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return new Response(JSON.stringify({ translation: data.responseData.translatedText }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300',
          ...corsHeaders(origin),
        },
      });
    }
    if (
      data.responseStatus === 429 ||
      String(data.responseDetails || '')
        .toLowerCase()
        .includes('limit')
    ) {
      return new Response(JSON.stringify({ error: 'rate_limit' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    return new Response(JSON.stringify({ error: 'unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}
