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
// Format-aware Croatian transcription, shared with /api/assess-speaking so both
// endpoints handle iOS mp4 identically. See functions/api/_transcribe.js.
import { transcribeDeepgram, transcribeWhisper } from './_transcribe.js';

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
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
