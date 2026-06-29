// functions/api/assess-speaking.js
import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';
import { transcribeCroatian } from './_transcribe.js';

const MAX_AUDIO_B64 = 2_000_000; // ~90s compressed
// Minimum word count before we consider the transcript "long enough" to score fairly.
// This drives `transcriptSufficiency` below — a transcript-length heuristic, NOT acoustic confidence.
const MIN_WORDS_FOR_SUFFICIENCY = 3;
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const VALID_CEFR = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function sanitizeParam(value, maxLen = 200) {
  return String(value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/[`\\]/g, '')
    .trim()
    .slice(0, maxLen);
}

function CORS(origin) {
  return {
    'Content-Type': 'application/json',
    ...corsHeaders(origin),
    'Cache-Control': 'no-store',
  };
}
function err(status, error, origin) {
  return new Response(JSON.stringify({ error }), { status, headers: CORS(origin) });
}

/** Decode base64 → ArrayBuffer for the transcription providers. */
function b64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}

const RUBRIC = (level, prompt, transcript) =>
  `You are a strict CEFR Croatian speaking examiner. The candidate was asked (level ${level}): "${prompt}".\n` +
  `Their spoken answer, transcribed, was: "${transcript}".\n` +
  `Score PRODUCTIVE speaking on four criteria, each 0.0–1.0, where ${level} competence ≈ 0.8:\n` +
  `- range: vocabulary/structures used\n- accuracy: grammatical control (cases, aspect, agreement)\n` +
  `- fluency: flow without breakdown\n- task: relevance and completeness vs the prompt.\n` +
  `Be rigorous: a sparse or off-topic answer scores low even if grammatical.\n` +
  `Respond with ONLY minified JSON: {"range":0.0,"accuracy":0.0,"fluency":0.0,"task":0.0}`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { origin } = gate;

  // Body + clip cap.
  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'bad_json', origin);
  }
  const { level, prompt, audioBase64, mime } = body || {};
  if (!level || !prompt || typeof audioBase64 !== 'string')
    return err(400, 'missing_fields', origin);

  // Validate level against known CEFR values.
  const safeLevel = sanitizeParam(level, 2);
  if (!VALID_CEFR.has(safeLevel)) return err(400, 'invalid_level', origin);

  // Sanitize prompt before interpolation into rubric template.
  const safePrompt = sanitizeParam(prompt, 500);

  if (audioBase64.length > MAX_AUDIO_B64) return err(413, 'audio_too_large', origin);

  // 5. Transcribe via the shared FORMAT-AWARE chain (Deepgram → Whisper-1 →
  //    Workers AI fallback). The client sends `mime` (audio/mp4 on iOS Safari,
  //    audio/webm on Chrome); routing by it is what makes iOS recordings
  //    transcribe correctly. Previously this used Workers AI Whisper alone, which
  //    is format-blind and returned empty text for iOS mp4 — so an iOS learner's
  //    spoken answer was silently ungradable (transcriptSufficiency 0 → null).
  let audioBuffer;
  try {
    audioBuffer = b64ToArrayBuffer(audioBase64);
  } catch {
    return err(400, 'bad_audio', origin);
  }
  let transcript = '';
  try {
    const { text } = await transcribeCroatian(audioBuffer, mime, env, { allowWorkersAI: true });
    transcript = (text || '').trim();
  } catch (e) {
    console.error('[assess-speaking] STT failed:', e && e.message);
    return err(e && e.timedOut ? 504 : 502, 'stt_failed', origin);
  }
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  // transcriptSufficiency is a transcript-LENGTH heuristic (word-count bucket), NOT an
  // acoustic/STT confidence. Below the consumer's floor it signals "too little speech to score".
  const transcriptSufficiency =
    wordCount >= MIN_WORDS_FOR_SUFFICIENCY ? 0.9 : wordCount > 0 ? 0.3 : 0;

  // 6. Rubric-score with Claude.
  let scores;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(28000),
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: RUBRIC(safeLevel, safePrompt, transcript || '(no speech detected)'),
          },
        ],
      }),
    });
    if (!r.ok) return err(502, 'rubric_failed', origin);
    const data = await r.json();
    const text =
      data && data.content && data.content[0] && data.content[0].text ? data.content[0].text : '';
    const parsed = JSON.parse(text);
    const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));
    scores = {
      range: clamp(parsed.range),
      accuracy: clamp(parsed.accuracy),
      fluency: clamp(parsed.fluency),
      task: clamp(parsed.task),
    };
  } catch (e) {
    console.error('[assess-speaking] rubric failed:', e && e.message);
    return err(502, 'rubric_failed', origin);
  }

  return new Response(JSON.stringify({ transcript, scores, transcriptSufficiency }), {
    status: 200,
    headers: CORS(origin),
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: CORS(origin) });
}
