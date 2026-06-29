// functions/api/_transcribe.js
//
// Shared Croatian speech-to-text. NOT a route (leading underscore).
//
// Why this exists: /api/assess-speaking used to transcribe ONLY via Workers AI
// Whisper (`env.AI.run('@cf/openai/whisper', …)`), which is FORMAT-BLIND — it is
// handed a bare byte array with no container/codec hint. iOS Safari's
// MediaRecorder emits audio/mp4 (AAC), and Workers AI Whisper frequently returns
// an empty/garbled transcript for it → transcriptSufficiency 0 → null score → the
// learner's spoken answer is silently ungradable. /api/stt already solved this
// with a FORMAT-AWARE provider chain (Deepgram nova-3, then OpenAI Whisper-1 with
// an explicit file extension / Content-Type). This module extracts that chain so
// both endpoints share one battle-tested, iOS-safe path.
//
// Provider order (first NON-EMPTY result wins):
//   1. Deepgram nova-3   (DEEPGRAM_API_KEY) — format-aware via Content-Type
//   2. OpenAI Whisper-1  (OPENAI_API_KEY)   — format-aware via file extension
//   3. Workers AI Whisper(env.AI)           — opt-in fallback, no extra key
// 1 and 2 are what make iOS mp4 transcribe correctly; 3 is a no-key backstop.

// ── Provider 1: Deepgram nova-3 ───────────────────────────────────────────────
export async function transcribeDeepgram(audioBuffer, mimeType, apiKey) {
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
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Deepgram ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  return transcript.trim();
}

// ── Provider 2: OpenAI Whisper-1 ──────────────────────────────────────────────
// The file extension derived from mimeType is what lets Whisper decode iOS mp4.
export async function transcribeWhisper(audioBuffer, mimeType, apiKey) {
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

// ── Provider 3: Workers AI Whisper (format-blind fallback) ────────────────────
// Pin language to Croatian; the `audio` field is an array of byte values, the
// shape @cf/openai/whisper expects.
export async function transcribeWorkersAI(bytes, env) {
  const stt = await env.AI.run('@cf/openai/whisper', { audio: bytes, language: 'hr' });
  return (stt && stt.text ? String(stt.text) : '').trim();
}

/**
 * Transcribe Croatian audio through the provider chain. Returns
 * `{ text, provider }` — `text` may be '' when every configured provider ran but
 * detected no speech. Throws only when every configured provider ERRORED (so the
 * caller can surface a 502/504), with `.causes` listing the per-provider errors.
 *
 * @param {ArrayBuffer} audioBuffer  decoded audio bytes
 * @param {string} mimeType          e.g. 'audio/mp4' (iOS), 'audio/webm' (Chrome)
 * @param {object} env               Cloudflare env bindings
 * @param {{ allowWorkersAI?: boolean }} [opts]  include the Workers AI fallback
 */
export async function transcribeCroatian(audioBuffer, mimeType, env, opts = {}) {
  const { allowWorkersAI = false } = opts;
  const mt =
    typeof mimeType === 'string' && mimeType.startsWith('audio/') ? mimeType : 'audio/webm';
  const causes = [];

  if (env.DEEPGRAM_API_KEY) {
    try {
      const text = await transcribeDeepgram(audioBuffer, mt, env.DEEPGRAM_API_KEY);
      if (text) return { text, provider: 'deepgram' };
    } catch (e) {
      causes.push(['deepgram', e]);
    }
  }

  if (env.OPENAI_API_KEY) {
    try {
      const text = await transcribeWhisper(audioBuffer, mt, env.OPENAI_API_KEY);
      if (text) return { text, provider: 'whisper' };
    } catch (e) {
      causes.push(['whisper', e]);
    }
  }

  if (allowWorkersAI && env.AI) {
    try {
      const bytes = Array.from(new Uint8Array(audioBuffer));
      const text = await transcribeWorkersAI(bytes, env);
      return { text, provider: 'workers-ai' };
    } catch (e) {
      causes.push(['workers-ai', e]);
    }
  }

  // Every configured provider errored — propagate so the caller returns 502/504.
  if (causes.length > 0) {
    const err = new Error('all_stt_failed');
    err.causes = causes;
    // Surface a timeout if any provider timed out, so the caller can map to 504.
    err.timedOut = causes.some(([, e]) => e?.name === 'TimeoutError' || e?.name === 'AbortError');
    throw err;
  }

  // No provider configured, or providers ran and detected no speech.
  return { text: '', provider: 'none' };
}
