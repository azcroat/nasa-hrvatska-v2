// Cloudflare Pages Function — Listening Exercise Generator
// Generates a complete AI Croatian listening exercise: dialogue or monologue + comprehension questions.

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function ok(body, origin) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Input validation ──────────────────────────────────────────────────────────

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_TOPICS = [
  'cafe',
  'market',
  'family',
  'travel',
  'weather',
  'sports',
  'work',
  'weekend',
  'restaurant',
  'city',
  'school',
  'nature',
  'health',
  'culture',
  'history',
];
const VALID_STYLES = ['dialogue', 'monologue'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

function sanitizeTopic(topic) {
  return VALID_TOPICS.includes(topic) ? topic : 'cafe';
}

function sanitizeStyle(style) {
  return VALID_STYLES.includes(style) ? style : 'dialogue';
}

// ── Content validation ─────────────────────────────────────────────────────────

function validateCroatianContent(data) {
  const warnings = [];

  // Check questions have exactly 1 correct answer
  if (data.questions) {
    data.questions.forEach((q, i) => {
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= (q.options?.length || 4)) {
        warnings.push(`Q${i + 1}: invalid correct index`);
        q.correct = 0; // safe default
      }
      if (!q.options || q.options.length < 2) {
        warnings.push(`Q${i + 1}: insufficient options`);
      }
    });
  }

  // Check speakers have content
  if (data.speakers) {
    data.speakers.forEach((spk, i) => {
      if (!spk.lines || spk.lines.length === 0) {
        warnings.push(`Speaker ${i + 1}: no lines`);
      }
    });
  }

  // Check vocabulary has translations
  if (data.vocabulary) {
    data.vocabulary = data.vocabulary.filter((v) => v.hr && v.en);
  }

  if (warnings.length > 0) console.warn('[listening] Content warnings:', warnings);
  return data;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') || ''),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { origin, isDev } = gate;

  // API key check
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);

  // Content-type check
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Invalid content type', origin);

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON in request body', origin);
  }

  const { topic, level, style } = body;

  // Validate inputs
  const safeTopic = sanitizeTopic(typeof topic === 'string' ? topic.trim() : '');
  const safeLevel = sanitizeLevel(typeof level === 'string' ? level.trim() : '');
  const safeStyle = sanitizeStyle(typeof style === 'string' ? style.trim() : '');

  // ── Build prompts ──
  const systemPrompt =
    'You are creating Croatian language listening exercises. Return ONLY valid JSON, no markdown, no code blocks.';

  const styleInstructions =
    safeStyle === 'dialogue'
      ? `a dialogue between 2 speakers named Ana and Marko with 8-12 exchanges. Use the format: speakers: [{name: "Ana", lines: ["line1", "line2", ...]}, {name: "Marko", lines: ["line1", ...]}] — alternate turns naturally. Do NOT include the "narrator" field.`
      : `a monologue by a narrator speaking naturally and continuously. Use the format: narrator: "full Croatian text". Do NOT include the "speakers" field.`;

  const userMessage =
    `Create a Croatian language listening exercise about '${safeTopic}' at CEFR level ${safeLevel} as a ${safeStyle}. ` +
    `The exercise should be ${styleInstructions} ` +
    `Use vocabulary appropriate for CEFR ${safeLevel}. ` +
    `Include 3 comprehension questions with 4 multiple-choice options each (exactly one correct). ` +
    `Return JSON with this exact structure: { ` +
    `"title": "short Croatian title", ` +
    `${safeStyle === 'dialogue' ? `"speakers": [{"name": "string", "lines": ["string"]}]` : `"narrator": "full Croatian text"`}, ` +
    `"en_summary": "brief English summary of what happens", ` +
    `"questions": [{ "q": "Croatian question", "options": ["option A", "option B", "option C", "option D"], "correct": 0 }], ` +
    `"vocab": [{"hr": "word", "en": "meaning"}] ` +
    `} — questions must have exactly 3 items, correct is 0-3 index, vocab must have 5-8 key words used in the exercise.`;

  // ── Call Anthropic ──

  // Block 1: fetch — catches network errors only
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error('listening.js: network error calling Anthropic:', fetchErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('listening.js: failed to read response body:', bodyErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 3: check res.ok — map errors to client-safe responses
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('listening.js: Anthropic API error', res.status, errMsg);
    return err(
      res.status >= 500 ? 502 : res.status,
      isDev ? errMsg || 'API error: HTTP ' + res.status : 'AI service error',
      origin,
    );
  }

  // Block 4: parse JSON — catches malformed responses
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('listening.js: JSON parse failed:', rawBody.slice(0, 200));
    return err(502, 'Invalid response from AI', origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('listening.js: Anthropic returned empty response');
    return err(502, 'Empty response from AI', origin);
  }

  // ── Parse response ──
  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('listening.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return err(502, 'parse_failed', origin);
  }

  // Validate required structure
  if (typeof parsed.title !== 'string' || !parsed.title.trim()) {
    console.error('listening.js: missing title in response');
    return err(502, 'parse_failed', origin);
  }
  if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) {
    console.error('listening.js: missing or empty questions array');
    return err(502, 'parse_failed', origin);
  }
  if (!Array.isArray(parsed.vocab)) {
    console.error('listening.js: missing vocab array');
    return err(502, 'parse_failed', origin);
  }

  // Validate style-specific field
  if (safeStyle === 'dialogue') {
    if (!Array.isArray(parsed.speakers) || parsed.speakers.length === 0) {
      console.error('listening.js: missing speakers array for dialogue');
      return err(502, 'parse_failed', origin);
    }
  } else {
    if (typeof parsed.narrator !== 'string' || !parsed.narrator.trim()) {
      console.error('listening.js: missing narrator for monologue');
      return err(502, 'parse_failed', origin);
    }
  }

  // ── Content validation ──
  parsed = validateCroatianContent(parsed);

  // Build clean response
  const response = {
    title: parsed.title.trim(),
    en_summary: typeof parsed.en_summary === 'string' ? parsed.en_summary.trim() : '',
    questions: parsed.questions.slice(0, 3).map((q) => ({
      q: String(q.q || '').trim(),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o).trim()) : [],
      correct: Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
    })),
    vocab: parsed.vocab
      .slice(0, 8)
      .map((v) => ({
        hr: String(v.hr || '').trim(),
        en: String(v.en || '').trim(),
      }))
      .filter((v) => v.hr && v.en),
    level: safeLevel,
    topic: safeTopic,
    style: safeStyle,
  };

  if (safeStyle === 'dialogue') {
    response.speakers = parsed.speakers.map((s) => ({
      name: String(s.name || '').trim(),
      lines: Array.isArray(s.lines) ? s.lines.map((l) => String(l).trim()).filter(Boolean) : [],
    }));
  } else {
    response.narrator = parsed.narrator.trim();
  }

  return ok(response, origin);
}
