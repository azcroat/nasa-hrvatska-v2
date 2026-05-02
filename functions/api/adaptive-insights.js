// Cloudflare Pages Function — Adaptive Insights
// Analyzes a user's error patterns and SRS vocab data, returns personalized
// weak areas and a prioritized study recommendation list.

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
const VALID_SEVERITIES = ['high', 'medium', 'low'];
const VALID_SCREENS = ['aspect', 'declension', 'flashcards', 'grammar', 'conjugation', 'matching'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

// ── Static fallback ───────────────────────────────────────────────────────────

function staticFallback(origin) {
  return ok(
    {
      weakAreas: [
        {
          area: 'Verbal aspect',
          severity: 'high',
          explanation:
            'Imperfective vs. perfective verb pairs are one of the most common challenges for English speakers learning Croatian.',
        },
        {
          area: 'Case endings',
          severity: 'medium',
          explanation: 'Noun and adjective declension takes consistent practice to internalize.',
        },
        {
          area: 'Vocabulary retention',
          severity: 'low',
          explanation: 'Regular SRS review sessions will help lock in new words.',
        },
      ],
      todaysFocus: 'Focus on reviewing your flashcard deck and practice verb aspects in context.',
      drillSuggestions: [
        {
          type: 'Aspect drill',
          description: 'Choose the correct verb aspect for each sentence',
          screen: 'aspect',
        },
        {
          type: 'Flashcard review',
          description: 'Review your weakest SRS cards',
          screen: 'flashcards',
        },
        {
          type: 'Case practice',
          description: 'Practice noun declension with common words',
          screen: 'declension',
        },
      ],
      encouragement: "You're making real progress — keep up the great work!",
      cached: false,
      generatedAt: Date.now(),
    },
    origin,
  );
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

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Auth required
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (!uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: corsHeaders(origin),
    });
  }

  // Daily AI quota check (cost 1)
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

  const { uid: bodyUid, level, errorLog, srsWeakWords, lessonsCompleted, recentTopics } = body;

  // uid in body must match token uid
  if (bodyUid && bodyUid !== uid) return err(403, 'Forbidden', origin);

  const safeLevel = sanitizeLevel(typeof level === 'string' ? level.trim() : '');

  // Sanitize errorLog — cap at 50 entries
  const safeErrorLog = Array.isArray(errorLog)
    ? errorLog.slice(0, 50).map((e) => ({
        type: sanitizeParam(String(e.type || ''), 40),
        context: sanitizeParam(String(e.context || ''), 100),
        timestamp: Number.isFinite(e.timestamp) ? e.timestamp : 0,
      }))
    : [];

  // Sanitize srsWeakWords — cap at 30
  const safeSrsWeakWords = Array.isArray(srsWeakWords)
    ? srsWeakWords
        .slice(0, 30)
        .map((w) => ({
          word: sanitizeParam(String(w.word || ''), 50),
          accuracy: Number.isFinite(w.accuracy) ? Math.min(1, Math.max(0, w.accuracy)) : 0,
          reviews: Number.isInteger(w.reviews) ? Math.max(0, w.reviews) : 0,
        }))
        .filter((w) => w.word)
    : [];

  const safeLessonsCompleted = Number.isFinite(lessonsCompleted)
    ? Math.max(0, Math.floor(lessonsCompleted))
    : 0;

  const safeRecentTopics = Array.isArray(recentTopics)
    ? recentTopics
        .slice(0, 10)
        .map((t) => sanitizeParam(String(t), 60))
        .filter(Boolean)
    : [];

  // ── KV cache check ─────────────────────────────────────────────────────────
  const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const cacheKey = `insights:${uid}:${todayDate}`;

  if (env.KV) {
    try {
      const cached = await env.KV.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return ok({ ...parsed, cached: true }, origin);
      }
    } catch (kvErr) {
      console.warn('adaptive-insights.js: KV read error:', kvErr.message);
    }
  }

  // ── Build prompts ─────────────────────────────────────────────────────────
  const systemPrompt =
    `You are a Croatian language pedagogy expert. Analyze the learner's error patterns and return a JSON object with exactly these fields:\n` +
    `- weakAreas: array of up to 3 objects {area, severity, explanation} identifying their biggest struggles\n` +
    `- todaysFocus: one sentence in English telling the user what to focus on today\n` +
    `- drillSuggestions: array of up to 3 objects {type, description, screen} — screen should be one of: "aspect", "declension", "flashcards", "grammar", "conjugation", "matching"\n` +
    `- encouragement: one warm, specific sentence acknowledging their progress\n\n` +
    `Respond with valid JSON only. No markdown. Croatian learner context: ${safeLevel} level, ${safeLessonsCompleted} lessons completed.`;

  const userMessage =
    `Error patterns: ${JSON.stringify(safeErrorLog)}\n` +
    `Weak vocab: ${JSON.stringify(safeSrsWeakWords)}\n` +
    `Recent topics: ${safeRecentTopics.join(', ')}`;

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error('adaptive-insights.js: network error calling Anthropic:', fetchErr.message);
    return staticFallback(origin);
  }

  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('adaptive-insights.js: failed to read response body:', bodyErr.message);
    return staticFallback(origin);
  }

  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('adaptive-insights.js: Anthropic API error', res.status, errMsg);
    return staticFallback(origin);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('adaptive-insights.js: JSON parse failed:', rawBody.slice(0, 200));
    return staticFallback(origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('adaptive-insights.js: Anthropic returned empty response');
    return staticFallback(origin);
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
    console.error('adaptive-insights.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return staticFallback(origin);
  }

  // Validate and clean weakAreas
  const weakAreas = Array.isArray(parsed.weakAreas)
    ? parsed.weakAreas
        .slice(0, 3)
        .map((a) => ({
          area: sanitizeParam(String(a.area || ''), 100),
          severity: VALID_SEVERITIES.includes(a.severity) ? a.severity : 'medium',
          explanation: sanitizeParam(String(a.explanation || ''), 400),
        }))
        .filter((a) => a.area)
    : [];

  // Validate drillSuggestions
  const drillSuggestions = Array.isArray(parsed.drillSuggestions)
    ? parsed.drillSuggestions
        .slice(0, 3)
        .map((d) => ({
          type: sanitizeParam(String(d.type || ''), 80),
          description: sanitizeParam(String(d.description || ''), 200),
          screen: VALID_SCREENS.includes(d.screen) ? d.screen : 'flashcards',
        }))
        .filter((d) => d.type)
    : [];

  const todaysFocus = sanitizeParam(String(parsed.todaysFocus || ''), 300);
  const encouragement = sanitizeParam(String(parsed.encouragement || ''), 300);

  const result = {
    weakAreas,
    todaysFocus,
    drillSuggestions,
    encouragement,
    cached: false,
    generatedAt: Date.now(),
  };

  // ── Store in KV ────────────────────────────────────────────────────────────
  if (env.KV) {
    try {
      await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 43200 });
    } catch (kvErr) {
      console.warn('adaptive-insights.js: KV write error:', kvErr.message);
    }
  }

  return ok(result, origin);
}
