// Cloudflare Pages Function — Translation proxy
// Proxies to MyMemory (free, no key) so the browser never needs to
// hit an external domain directly — avoids CSP connect-src issues.
// Adding MYMEMORY_EMAIL env var lifts the limit from 1k → 10k words/day.

import { checkRateLimit } from './_rateLimit.js';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';

  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const { text, from, to } = await request.json();
    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response(JSON.stringify({ error: 'invalid_input' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    if (!['en', 'hr'].includes(from) || !['en', 'hr'].includes(to) || from === to) {
      return new Response(JSON.stringify({ error: 'invalid_langpair' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const email = env.MYMEMORY_EMAIL || '';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${from}|${to}${email ? `&de=${encodeURIComponent(email)}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let upstream;
    try {
      upstream = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const data = await upstream.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return new Response(JSON.stringify({ translation: data.responseData.translatedText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300', ...corsHeaders(origin) },
      });
    }
    if (data.responseStatus === 429 || String(data.responseDetails || '').toLowerCase().includes('limit')) {
      return new Response(JSON.stringify({ error: 'rate_limit' }), {
        status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    return new Response(JSON.stringify({ error: 'unavailable' }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}
