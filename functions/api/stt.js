// Cloudflare Pages Function — Deepgram STT Proxy
// POST /api/stt
// Body: raw audio binary (audio/webm, audio/ogg, audio/wav)
// Returns: { transcript, confidence }

import { checkRateLimit } from './_rateLimit.js';

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen';

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return hostname === 'nasahrvatska.com'
      || hostname.endsWith('.nasahrvatska.com')
      || hostname === 'nasa-hrvatska-v2.pages.dev'
      || hostname.endsWith('.nasa-hrvatska-v2.pages.dev');
  } catch { return false; }
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders(origin) });
  }

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), { status: 429, headers: corsHeaders(origin) });
  }

  const DEEPGRAM_KEY = env.DEEPGRAM_API_KEY;
  if (!DEEPGRAM_KEY) {
    // Graceful fallback: if no Deepgram key configured, return empty transcript
    // Frontend falls back to Web Speech API
    return new Response(JSON.stringify({ transcript: '', confidence: 0, fallback: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const audioBuffer = await request.arrayBuffer();
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'empty_audio' }), { status: 400, headers: corsHeaders(origin) });
    }
    if (audioBuffer.byteLength > 10 * 1024 * 1024) { // 10MB max
      return new Response(JSON.stringify({ error: 'audio_too_large' }), { status: 400, headers: corsHeaders(origin) });
    }

    const contentType = request.headers.get('content-type') || 'audio/webm';

    // Deepgram query params — optimized for Croatian conversational speech
    const params = new URLSearchParams({
      model: 'nova-3',           // Best accuracy model
      language: 'hr',            // Croatian
      smart_format: 'true',      // Capitalize sentences, add punctuation
      punctuate: 'true',
      utterances: 'false',
      diarize: 'false',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let dgRes;
    try {
      dgRes = await fetch(`${DEEPGRAM_URL}?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_KEY}`,
          'Content-Type': contentType,
        },
        body: audioBuffer,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!dgRes.ok) {
      const errText = await dgRes.text().catch(() => '');
      console.error(`Deepgram error ${dgRes.status}: ${errText.slice(0, 200)}`);
      return new Response(JSON.stringify({ error: 'stt_error', transcript: '' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const data = await dgRes.json();

    // Extract transcript from Deepgram response structure
    const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alternative?.transcript || '';
    const confidence = alternative?.confidence ?? 0;
    const words = alternative?.words || [];

    return new Response(JSON.stringify({ transcript: transcript.trim(), confidence, words }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (e) {
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'timeout', transcript: '' }), { status: 504, headers: corsHeaders(origin) });
    }
    return new Response(JSON.stringify({ error: 'server_error', transcript: '' }), { status: 500, headers: corsHeaders(origin) });
  }
}
