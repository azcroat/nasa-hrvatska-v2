// Cloudflare Pages Function — Whisper STT Proxy
// POST raw audio bytes → OpenAI Whisper API (model whisper-1, language hr)
// Returns { text: string }
// 503 when OPENAI_API_KEY is not set — client falls back to Web Speech API

import { checkRateLimit } from './_rateLimit.js';

function isAllowedOrigin(origin, isDev) {
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
    return new Response('Forbidden', { status: 403, headers: corsHeaders(origin) });
  }

  const OPENAI_KEY = env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    // 503 is the agreed signal for the client to fall back to Web Speech API silently
    return new Response(
      JSON.stringify({ error: 'stt_not_configured' }),
      { status: 503, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit: 30 requests/minute — generous given each VAD capture is ~2–4 s of audio
  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limit_exceeded' }),
      { status: 429, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Client sends raw audio bytes; Content-Type identifies the container format.
    // MediaRecorder produces audio/webm on Chrome/Edge, audio/ogg on Firefox, audio/mp4 on Safari.
    const ct = request.headers.get('content-type') || 'audio/webm';
    if (!ct.startsWith('audio/')) {
      return new Response(
        JSON.stringify({ error: 'Expected audio/* Content-Type' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await request.arrayBuffer();

    if (!audioBuffer.byteLength) {
      return new Response(
        JSON.stringify({ error: 'Empty audio body' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }
    // Guard: OpenAI Whisper limit is 25 MB; we enforce 20 MB to leave headroom
    if (audioBuffer.byteLength > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Audio too large (max 20 MB)' }),
        { status: 413, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Map MIME type to a file extension Whisper accepts
    const ext = ct.includes('ogg')         ? 'ogg'
              : ct.includes('mp4') || ct.includes('m4a') ? 'mp4'
              : ct.includes('wav')         ? 'wav'
              : 'webm';                    // Chrome / Edge default

    // Build multipart/form-data for the OpenAI Whisper API
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: ct }), `speech.${ext}`);
    form.append('model', 'whisper-1');
    // Explicit language code gives Whisper ~15–20 % accuracy lift for Croatian
    // compared with auto-detect (which confuses hr with bs/sr/sl).
    form.append('language', 'hr');
    // Prompt seeds the decoder with high-frequency Croatian vocabulary and all
    // five diacritics (č, ć, š, ž, đ).  Whisper uses this as a soft prior —
    // it won't force these words, but it biases toward correct spellings.
    form.append('prompt',
      'Razgovor na standardnom hrvatskom jeziku. ' +
      'Uobičajene fraze: hvala lijepa, molim, dobar dan, kako ste, ' +
      'gdje je, koliko košta, ne razumijem, možete li ponoviti, ' +
      'govorim malo hrvatski, razumijem, da, ne, možda.'
    );

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
      signal: AbortSignal.timeout(20000), // Whisper is normally <3 s; 20 s is generous
    });

    if (!whisperRes.ok) {
      const errBody = await whisperRes.text().catch(() => '');
      console.error('[STT] Whisper error', whisperRes.status, errBody.slice(0, 200));
      return new Response(
        JSON.stringify({ error: 'Transcription service error', status: whisperRes.status }),
        { status: 502, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const result = await whisperRes.json();
    const text = (result.text || '').trim();

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return new Response(
      JSON.stringify({ error: isTimeout ? 'Transcription timed out — please try again' : 'STT proxy error' }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }
}
