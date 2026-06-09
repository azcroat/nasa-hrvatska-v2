// Cloudflare Pages Function — Croatian STT Proxy
//
// Provider chain (first configured key wins):
//   1. Deepgram nova-3     (DEEPGRAM_API_KEY)  — fastest, lowest latency for short clips
//   2. OpenAI Whisper-1    (OPENAI_API_KEY)    — highest accuracy, especially for diacritics
//
// Both return the same response shape: { text: string }
// 503 when neither key is configured → useWhisperSTT falls back to Web Speech API.
//
// Audio format: raw bytes, Content-Type = audio/webm | audio/ogg | audio/mp4 | audio/wav
// MediaRecorder output: audio/webm;codecs=opus (Chrome/Edge), audio/ogg (Firefox), audio/mp4 (Safari)

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Provider 1: Deepgram nova-3 ───────────────────────────────────────────────
// Deepgram excels at short conversational clips (<30 s) — lower latency than Whisper
// because it processes the audio as a continuous stream rather than a batch job.
// Croatian (hr) is fully supported with punctuation and smart formatting.
async function transcribeDeepgram(audioBuffer, mimeType, apiKey) {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'hr',
    smart_format: 'true',
    punctuate: 'true',
    filler_words: 'false',
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
    signal: AbortSignal.timeout(15000), // Deepgram is typically <1 s for short clips
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Deepgram ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  // Deepgram response: { results: { channels: [{ alternatives: [{ transcript: "..." }] }] } }
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  return transcript.trim();
}

// ── Provider 2: OpenAI Whisper-1 ──────────────────────────────────────────────
// Whisper has the edge on uncommon vocabulary and correct diacritic spelling,
// particularly for words with đ, which Deepgram can occasionally normalise away.
// The prompt hint seeds the decoder with common Croatian forms.
async function transcribeWhisper(audioBuffer, mimeType, apiKey) {
  const ext = mimeType.includes('ogg')
    ? 'ogg'
    : mimeType.includes('mp4') || mimeType.includes('m4a')
      ? 'mp4'
      : mimeType.includes('wav')
        ? 'wav'
        : 'webm'; // Chrome/Edge default

  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), `speech.${ext}`);
  form.append('model', 'whisper-1');
  form.append('language', 'hr');
  form.append(
    'prompt',
    'Razgovor na standardnom hrvatskom jeziku. ' +
      'Fraze: hvala lijepa, molim, dobar dan, kako ste, gdje je, ' +
      'koliko košta, ne razumijem, možete li ponoviti, govorim malo hrvatski.',
  );

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Whisper ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.text || '').trim();
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const DEEPGRAM_KEY = env.DEEPGRAM_API_KEY;
  const OPENAI_KEY = env.OPENAI_API_KEY;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 30 });
  if (!gate.ok) return gate.response;
  const { origin } = gate;

  // 503 is the agreed signal for useWhisperSTT to fall back to Web Speech API silently.
  // Check AFTER the auth gate: anon callers get 401; 503 only reaches authenticated users.
  if (!DEEPGRAM_KEY && !OPENAI_KEY) {
    return new Response(JSON.stringify({ error: 'stt_not_configured' }), {
      status: 503,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Accept either base64-JSON (native-safe, sent via _nativePost) or a raw audio/* body.
  const ct = request.headers.get('content-type') || 'audio/webm';
  let audioBuffer;
  let audioCt;
  if (ct.includes('application/json')) {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const { audioBase64, mimeType } = body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audioBase64' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const bin = atob(audioBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    audioBuffer = bytes.buffer;
    audioCt =
      typeof mimeType === 'string' && mimeType.startsWith('audio/') ? mimeType : 'audio/webm';
  } else if (ct.startsWith('audio/')) {
    audioBuffer = await request.arrayBuffer();
    audioCt = ct;
  } else {
    return new Response(JSON.stringify({ error: 'Expected audio/* or application/json' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  if (!audioBuffer.byteLength) {
    return new Response(JSON.stringify({ error: 'Empty audio body' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
  if (audioBuffer.byteLength > 20 * 1024 * 1024) {
    // 20 MB guard
    return new Response(JSON.stringify({ error: 'Audio too large (max 20 MB)' }), {
      status: 413,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // ── Transcription: Deepgram primary → Whisper fallback ───────────────────
  let text = '';
  let lastError = null;

  if (DEEPGRAM_KEY) {
    try {
      text = await transcribeDeepgram(audioBuffer, audioCt, DEEPGRAM_KEY);
    } catch (e) {
      console.error('[STT] Deepgram failed, trying Whisper fallback:', e.message);
      lastError = e;
    }
  }

  // Try Whisper if Deepgram failed or wasn't configured
  if (!text && OPENAI_KEY) {
    try {
      text = await transcribeWhisper(audioBuffer, audioCt, OPENAI_KEY);
      lastError = null;
    } catch (e) {
      console.error('[STT] Whisper also failed:', e.message);
      lastError = e;
    }
  }

  // Both providers failed
  if (lastError) {
    const isTimeout = lastError?.name === 'TimeoutError' || lastError?.name === 'AbortError';
    return new Response(
      JSON.stringify({
        error: isTimeout ? 'Transcription timed out — please try again' : 'Transcription failed',
      }),
      {
        status: isTimeout ? 504 : 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}
