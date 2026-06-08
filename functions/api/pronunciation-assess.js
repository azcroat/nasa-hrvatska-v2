// Cloudflare Pages Function — Azure Pronunciation Assessment
// Accepts a base64-encoded WAV recording + reference text, submits to Azure
// Cognitive Services Pronunciation Assessment REST API, and returns phoneme-level
// scores. Requires Firebase auth token (Authorization: Bearer <token>).

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';

function ok(body, origin) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...corsHeaders(origin),
    },
  });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...corsHeaders(origin),
    },
  });
}

// ── Input sanitisation ────────────────────────────────────────────────────────
function sanitizeText(value, maxLen = 500) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\r\n]/g, ' ')
    .replace(/[`\\]/g, '')
    .replace(/\bignore\b.*\binstruction/gi, '')
    .trim()
    .slice(0, maxLen);
}

// ── Base64 → ArrayBuffer ──────────────────────────────────────────────────────
// Cloudflare Workers runtime provides atob() and Uint8Array.
function base64ToUint8Array(b64) {
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Parse Azure NBest Pronunciation Assessment response ───────────────────────
// Azure REST response shape (NBest[0]):
//   PronunciationAssessment: { AccuracyScore, FluencyScore, CompletenessScore, PronScore }
//   Words: [{ Word, PronunciationAssessment: { AccuracyScore }, Phonemes: [{ Phoneme, PronunciationAssessment: { AccuracyScore } }] }]
function parseAzureResponse(azureData) {
  const nbest = azureData?.NBest?.[0];
  if (!nbest) return null;

  const pa = nbest.PronunciationAssessment || {};
  const overall = Math.round(pa.PronScore ?? 0);
  const accuracy = Math.round(pa.AccuracyScore ?? 0);
  const fluency = Math.round(pa.FluencyScore ?? 0);
  const completeness = Math.round(pa.CompletenessScore ?? 0);

  const word_scores = (nbest.Words || []).map((w) => ({
    word: w.Word || '',
    score: Math.round(w.PronunciationAssessment?.AccuracyScore ?? 0),
    phonemes: (w.Phonemes || []).map((p) => ({
      phoneme: p.Phoneme || '',
      score: Math.round(p.PronunciationAssessment?.AccuracyScore ?? 0),
    })),
  }));

  return { overall, accuracy, fluency, completeness, word_scores };
}

// ── Preflight ─────────────────────────────────────────────────────────────────
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 10 });
  if (!gate.ok) return gate.response;
  const { origin } = gate;

  // Check env vars early — return a clear signal so the client can fall back.
  const AZURE_KEY = env.AZURE_SPEECH_KEY;
  const AZURE_REGION = env.AZURE_SPEECH_REGION;
  if (!AZURE_KEY || !AZURE_REGION) {
    return ok({ ok: false, error: 'not_configured' }, origin);
  }

  // Parse body
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Expected application/json', origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON', origin);
  }

  const { audioBase64, referenceText, locale = 'hr-HR', audioMimeType = 'audio/wav' } = body;

  if (typeof audioBase64 !== 'string' || !audioBase64) {
    return err(400, 'Missing audioBase64', origin);
  }
  if (typeof referenceText !== 'string' || !referenceText.trim()) {
    return err(400, 'Missing referenceText', origin);
  }

  // Validate locale to an allowlist (Croatian + common fallbacks)
  const ALLOWED_LOCALES = ['hr-HR', 'hr', 'en-US', 'en-GB'];
  const safeLocale = ALLOWED_LOCALES.includes(locale) ? locale : 'hr-HR';
  const safeReferenceText = sanitizeText(referenceText, 500);

  // Decode audio
  let audioBytes;
  try {
    audioBytes = base64ToUint8Array(audioBase64);
  } catch {
    return err(400, 'Invalid base64 audio', origin);
  }

  // Validate size: Azure REST accepts up to ~60 s of audio; WAV is typically
  // ~88 kB/s at 44 kHz mono 16-bit. Cap at 8 MB to be safe.
  if (audioBytes.byteLength > 8 * 1024 * 1024) {
    return err(400, 'Audio too large (max 8 MB)', origin);
  }

  // Map the client's recorded MIME type to the Content-Type Azure accepts.
  // Azure explicitly supports: audio/wav, audio/ogg;codecs=opus, audio/mpeg.
  // Chrome MediaRecorder always produces audio/webm;codecs=opus (WAV is unsupported in Chrome).
  // Sending 'audio/wav' when the audio is actually WebM caused Azure to misparse the binary
  // and return a garbage-but-consistent score (~84%). We now use the real format.
  const ALLOWED_MIME_TYPES = new Set([
    'audio/wav',
    'audio/pcm',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/ogg; codecs=opus',
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/webm; codecs=opus',
    'audio/mpeg',
    'audio/mp4',
  ]);
  // Normalise: lowercase, strip extra whitespace
  const normMime = String(audioMimeType).toLowerCase().replace(/\s+/g, ' ').trim();
  const azureContentType = ALLOWED_MIME_TYPES.has(normMime) ? normMime : 'audio/wav';

  // Build the Pronunciation-Assessment header value.
  // Azure requires this as a base64-encoded JSON object.
  const assessmentConfig = {
    ReferenceText: safeReferenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    EnableMiscue: true,
  };
  const assessmentHeader = btoa(JSON.stringify(assessmentConfig));

  // Call Azure Cognitive Services Pronunciation Assessment REST API.
  const azureUrl = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${safeLocale}&format=detailed`;

  // Block 1: fetch — catches network errors only
  let azureRes;
  try {
    azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': azureContentType,
        Accept: 'application/json',
        'Pronunciation-Assessment': assessmentHeader,
      },
      body: audioBytes,
      signal: AbortSignal.timeout(20000),
    });
  } catch (fetchErr) {
    console.error('pronunciation-assess.js: Azure fetch error:', fetchErr?.message);
    return err(502, 'azure_unavailable', origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await azureRes.text();
  } catch (bodyErr) {
    console.error('pronunciation-assess.js: failed to read response body:', bodyErr?.message);
    return err(502, 'azure_unavailable', origin);
  }

  // Block 3: check res.ok
  if (!azureRes.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error(
      'pronunciation-assess.js: Azure HTTP error:',
      azureRes.status,
      errMsg || rawBody.slice(0, 300),
    );
    return err(502, 'azure_error', origin);
  }

  // Block 4: parse JSON
  let azureData;
  try {
    azureData = JSON.parse(rawBody);
  } catch {
    console.error('pronunciation-assess.js: JSON parse failed:', rawBody.slice(0, 200));
    return err(502, 'parse_failed', origin);
  }

  const parsed = parseAzureResponse(azureData);
  if (!parsed) {
    console.error(
      'pronunciation-assess.js: unexpected Azure response shape:',
      JSON.stringify(azureData).slice(0, 300),
    );
    return err(502, 'parse_failed', origin);
  }

  return ok({ ok: true, ...parsed }, origin);
}
