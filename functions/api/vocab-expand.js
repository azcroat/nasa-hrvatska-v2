// Cloudflare Pages Function — Vocab Expand
// Given a Croatian word and the user's CEFR level, returns 3 example sentences
// showing the word used in context at appropriate difficulty.
// Used for inline vocab expansion in the vocabulary journal.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// ── Security helpers ──────────────────────────────────────────────────────────

function sanitizeParam(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\r\n]/g, ' ')
    .replace(/[`\\]/g, '')
    .replace(/\bignore\b.*\binstruction/gi, '')
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

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache',
  };
}

function ok(body, origin) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) });
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

// ── PREFLIGHT ──────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';

  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) return err(403, 'Forbidden', origin);

  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Auth — optional (guests use IP-based quota; authenticated users get named quota)
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;

  // Daily AI quota (cost 1 — lightweight Claude Haiku call)
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: 'daily_quota_exceeded',
        message: 'Daily AI limit reached. Resets at midnight UTC.',
        resetAt: quota.resetAt,
      }),
      { status: 429, headers: corsHeaders(origin) },
    );
  }

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Invalid content type', origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON in request body', origin);
  }

  const { word, translation, level } = body;

  if (!word || typeof word !== 'string') return err(400, 'word is required', origin);

  // Max word length guard
  const trimmedWord = word.trim();
  if (trimmedWord.length > 50) return err(400, 'word too long', origin);
  if (trimmedWord.length === 0) return err(400, 'word is required', origin);

  const safeWord = sanitizeParam(trimmedWord, 50);
  const safeTranslation = sanitizeParam(typeof translation === 'string' ? translation : '', 100);
  const safeLevel = sanitizeLevel(typeof level === 'string' ? level.trim() : '');

  // ── KV cache check ─────────────────────────────────────────────────────────
  const cacheKey = `vocab:${safeWord.toLowerCase()}:${safeLevel}`;

  if (env.KV) {
    try {
      const cached = await env.KV.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return ok({ ...parsed, cached: true }, origin);
      }
    } catch (kvErr) {
      console.warn('vocab-expand.js: KV read error:', kvErr.message);
    }
  }

  // ── Build prompts ─────────────────────────────────────────────────────────
  const systemPrompt =
    `You are a Croatian language teacher. Generate exactly 3 example sentences for the given Croatian word, appropriate for a ${safeLevel} level learner. Each sentence should:\n` +
    `1. Show the word used naturally in context\n` +
    `2. Be progressively slightly more complex\n` +
    `3. Include common collocations or different grammatical cases where relevant\n\n` +
    `Return valid JSON only: {"examples": [{"hr": "...", "en": "...", "note": "..."}]}\n` +
    `No markdown. Make sentences feel like real Croatian speech, not textbook examples.`;

  const userMessage = safeTranslation
    ? `Croatian word: ${safeWord} (meaning: ${safeTranslation})`
    : `Croatian word: ${safeWord}`;

  // ── Call Anthropic ─────────────────────────────────────────────────────────

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
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error('vocab-expand.js: network error calling Anthropic:', fetchErr.message);
    return ok({ examples: [], cached: false }, origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('vocab-expand.js: failed to read response body:', bodyErr.message);
    return ok({ examples: [], cached: false }, origin);
  }

  // Block 3: check res.ok
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('vocab-expand.js: Anthropic API error', res.status, errMsg);
    return ok({ examples: [], cached: false }, origin);
  }

  // Block 4: parse JSON
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('vocab-expand.js: JSON parse failed:', rawBody.slice(0, 200));
    return ok({ examples: [], cached: false }, origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('vocab-expand.js: Anthropic returned empty response');
    return ok({ examples: [], cached: false }, origin);
  }

  // ── Parse and validate response ────────────────────────────────────────────
  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('vocab-expand.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return ok({ examples: [], cached: false }, origin);
  }

  const examples = Array.isArray(parsed.examples)
    ? parsed.examples
        .slice(0, 3)
        .map((e) => ({
          hr: sanitizeParam(String(e.hr || ''), 300),
          en: sanitizeParam(String(e.en || ''), 300),
          note: e.note ? sanitizeParam(String(e.note), 200) : undefined,
        }))
        .filter((e) => e.hr && e.en)
    : [];

  const result = { examples, cached: false };

  // ── Store in KV (7 days) ───────────────────────────────────────────────────
  if (env.KV && examples.length > 0) {
    try {
      await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 604800 });
    } catch (kvErr) {
      console.warn('vocab-expand.js: KV write error:', kvErr.message);
    }
  }

  return ok(result, origin);
}
