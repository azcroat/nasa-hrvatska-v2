// functions/api/assess-speaking.js
import { getFirebaseUid } from './_verifyToken.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkAIQuota } from './_aiQuota.js';

const MAX_AUDIO_B64 = 2_000_000; // ~90s compressed
const MIN_WORDS_FOR_CONFIDENCE = 3;
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const VALID_CEFR = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function sanitizeParam(value, maxLen = 200) {
  return String(value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/[`\\]/g, '')
    .trim()
    .slice(0, maxLen);
}

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}

function CORS(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
}
function err(status, error, origin) {
  return new Response(JSON.stringify({ error }), { status, headers: CORS(origin) });
}

/** Decode base64 → array of byte values (the shape Workers AI Whisper expects). */
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
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
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  // 0. CORS allow-list — mirror correct.js.
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: CORS(origin),
    });
  }

  // 1. Auth — hard reject anonymous (closes the anon-AI-cost vector).
  const uid = env.FIREBASE_PROJECT_ID
    ? await getFirebaseUid(request, env.FIREBASE_PROJECT_ID)
    : null;
  if (!uid) return err(401, 'unauthenticated', origin);

  // 2. Rate limit (mirror correct.js: 20 req/min per IP).
  const allowed = await checkRateLimit(request, 20, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: CORS(origin),
    });
  }

  // 3. Daily AI quota (cost 1 — two paid services per request).
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: 'daily_quota_exceeded',
        message: 'Daily AI limit reached. Resets at midnight UTC.',
        resetAt: quota.resetAt,
      }),
      { status: 429, headers: CORS(origin) },
    );
  }

  // 4. Body + clip cap.
  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'bad_json', origin);
  }
  const { level, prompt, audioBase64 } = body || {};
  if (!level || !prompt || typeof audioBase64 !== 'string')
    return err(400, 'missing_fields', origin);

  // Validate level against known CEFR values.
  const safeLevel = sanitizeParam(level, 2);
  if (!VALID_CEFR.has(safeLevel)) return err(400, 'invalid_level', origin);

  // Sanitize prompt before interpolation into rubric template.
  const safePrompt = sanitizeParam(prompt, 500);

  if (audioBase64.length > MAX_AUDIO_B64) return err(413, 'audio_too_large', origin);

  // 5. Transcribe with Workers AI Whisper.
  let transcript = '';
  try {
    const stt = await env.AI.run('@cf/openai/whisper', { audio: b64ToBytes(audioBase64) });
    transcript = (stt && stt.text ? String(stt.text) : '').trim();
  } catch (e) {
    console.error('[assess-speaking] STT failed:', e && e.message);
    return err(502, 'stt_failed', origin);
  }
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  const confidence = wordCount >= MIN_WORDS_FOR_CONFIDENCE ? 0.9 : wordCount > 0 ? 0.3 : 0;

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

  return new Response(JSON.stringify({ transcript, scores, confidence }), {
    status: 200,
    headers: CORS(origin),
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: CORS(origin) });
}
