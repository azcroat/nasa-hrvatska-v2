// Cloudflare Pages Function — Adaptive Daily Curriculum Plan
// Generates a personalized 15-minute daily Croatian learning plan using Claude.

import { checkRateLimit } from './_rateLimit.js';
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache',
  };
}

function ok(body, origin) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) });
}

// ── Input validation ──────────────────────────────────────────────────────────

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_GOALS = ['heritage', 'family', 'travel', 'culture', 'fluent', 'partner'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

function sanitizeGoal(goal) {
  return VALID_GOALS.includes(goal) ? goal : 'fluent';
}

function sanitizeStreak(streak) {
  const n = Number(streak);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 9999);
}

function sanitizeStringArray(arr, maxItems, maxItemLen) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((item) => sanitizeParam(String(item ?? ''), maxItemLen))
    .filter(Boolean);
}

function sanitizeRecentActivity(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { flashcards: 0, listening: 0, speaking: 0, writing: 0, lastActive: 0 };
  }
  const clamp = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), 9999) : 0;
  };
  return {
    flashcards: clamp(raw.flashcards),
    listening: clamp(raw.listening),
    speaking: clamp(raw.speaking),
    writing: clamp(raw.writing),
    lastActive: clamp(raw.lastActive),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS check
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) return err(403, 'Forbidden', origin);

  const allowed = await checkRateLimit(request, 20, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Daily AI quota check (cost 2 — Sonnet model)
  const quota = await checkAIQuota(request, env, null, 2);
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

  const { level, srWeakWords, majaPatterns, recentActivity, goal, streak } = body;
  const learnerErrors = body.learnerErrors || [];
  const stylePreferences = body.stylePreferences || null;

  // ── Validate and sanitize inputs ──
  const safeLevel = sanitizeLevel(level);
  const safeGoal = sanitizeGoal(goal);
  const safeStreak = sanitizeStreak(streak);
  const safeSrWeakWords = sanitizeStringArray(srWeakWords, 8, 60);
  const safeMajaPatterns = sanitizeStringArray(majaPatterns, 10, 100);
  const safeRecentActivity = sanitizeRecentActivity(recentActivity);

  // Sanitize learnerErrors — each entry expected: { pattern, category, count }
  const safeLearnerErrors = Array.isArray(learnerErrors)
    ? learnerErrors
        .slice(0, 6)
        .map((e) => {
          if (!e || typeof e !== 'object') return null;
          const pattern = sanitizeParam(String(e.pattern ?? ''), 100);
          const category = sanitizeParam(String(e.category ?? ''), 60);
          const count =
            Number.isFinite(Number(e.count)) && Number(e.count) >= 0
              ? Math.floor(Number(e.count))
              : 0;
          if (!pattern) return null;
          return { pattern, category, count };
        })
        .filter(Boolean)
    : [];

  // Sanitize stylePreferences
  const safeStyle =
    stylePreferences && stylePreferences.dataPoints >= 5
      ? {
          preferred: (stylePreferences.preferredTypes || [])
            .slice(0, 3)
            .map((t) => String(t).slice(0, 30)),
          avoided: (stylePreferences.avoidedTypes || [])
            .slice(0, 3)
            .map((t) => String(t).slice(0, 30)),
          dataPoints: parseInt(stylePreferences.dataPoints) || 0,
        }
      : null;

  // ── Build prompts ──
  const systemPrompt =
    'You are a Croatian language learning coach creating a personalized daily practice plan. Return ONLY valid JSON, no markdown.';

  const learnerErrorsBlock =
    safeLearnerErrors.length > 0
      ? `\nLEARNER'S PERSISTENT ERRORS (prioritize addressing these):\n` +
        safeLearnerErrors
          .map((e) => `- ${e.pattern} (${e.category}, seen ${e.count} times)`)
          .join('\n') +
        `\n\nFor each activity in your plan, if it addresses one of these errors, explain SPECIFICALLY how in the "reason" field. Don't just say "you need practice" — say "this targets your accusative case errors with animate nouns."`
      : '';

  const styleBlock = safeStyle
    ? `
LEARNER STYLE PROFILE (based on ${safeStyle.dataPoints} sessions):
- Preferred activity types: ${safeStyle.preferred.join(', ') || 'not yet determined'}
- Low completion types: ${safeStyle.avoided.join(', ') || 'none identified'}
- INSTRUCTION: Prioritize preferred types in your activity selection. For avoided types, only include them if they directly address a critical error pattern — and keep them short (5 min max). Never include more than 1 avoided type per plan.
`
    : '';

  const userMessage =
    `Create a personalized 15-minute daily Croatian practice plan for a ${safeLevel} learner with goal '${safeGoal}' (${safeStreak} day streak). ` +
    `Their weakest SRS words: ${safeSrWeakWords.join(', ') || 'none yet'}. ` +
    `Maja mistake patterns: ${safeMajaPatterns.join(', ') || 'none'}. ` +
    `Recent activity counts: ${JSON.stringify(safeRecentActivity)}.` +
    learnerErrorsBlock +
    styleBlock +
    ` Return JSON: { greeting: 'short encouraging Croatian greeting to the user (5-10 words)', activities: [ { id: string (one of: srsreview=spaced-repetition card review, aiconvo=AI listening/conversation practice, live_tutor=AI speaking session with tutor Marija, writing=written composition practice, grammar_diagnosis=grammar gap analysis, dialogue=conversational dialogue with Maja, shadowing=pronunciation shadowing drill, aspectdrill=verb aspect perfective/imperfective drill), title: string, reason: string (why this specifically today, 1 sentence — be specific if addressing a persistent error), duration: number (minutes, 3-7), priority: 'high'|'medium' } ], motivational_note: 'one encouraging sentence about their progress', focus_topic: 'one grammar/vocab area to focus on today', theme: 'one sentence connecting all activities to a single grammar or vocab thread, e.g. Today\\'s thread: perfective aspect in past tense' } — exactly 3 activities totaling ~15 minutes.`;

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
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error('daily-plan.js: network error calling Anthropic:', fetchErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('daily-plan.js: failed to read response body:', bodyErr.message);
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
    console.error('daily-plan.js: Anthropic API error', res.status, errMsg);
    return err(
      res.status >= 500 ? 502 : res.status,
      isDev ? errMsg || 'Anthropic API error: HTTP ' + res.status : 'AI service error',
      origin,
    );
  }

  // Block 4: parse JSON — catches malformed responses
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('daily-plan.js: JSON parse failed:', rawBody.slice(0, 200));
    return err(502, 'Invalid response from AI', origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('daily-plan.js: Anthropic returned empty response');
    return err(500, 'Empty response from AI', origin);
  }

  // ── Parse Claude's JSON response ──
  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('daily-plan.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return err(500, 'Failed to parse AI response', origin);
  }

  // ── Validate activities array ──
  if (!Array.isArray(parsed.activities) || parsed.activities.length !== 3) {
    console.error('daily-plan.js: activities array invalid, length:', parsed.activities?.length);
    return err(500, 'AI returned invalid plan structure', origin);
  }

  // Only self-contained screens — flashcards/listening/speaking require pre-loaded
  // data props and cannot be launched safely from the daily plan card.
  const VALID_ACTIVITY_IDS = [
    'srsreview',
    'aiconvo',
    'live_tutor',
    'writing',
    'grammar_diagnosis',
    'dialogue',
    'shadowing',
    'aspectdrill',
  ];
  const VALID_PRIORITIES = ['high', 'medium'];

  const activities = parsed.activities.map((act) => ({
    id: VALID_ACTIVITY_IDS.includes(act.id) ? act.id : 'flashcards',
    title: sanitizeParam(String(act.title || ''), 80),
    reason: sanitizeParam(String(act.reason || ''), 200),
    duration: Math.min(Math.max(Number(act.duration) || 5, 1), 30),
    priority: VALID_PRIORITIES.includes(act.priority) ? act.priority : 'medium',
  }));

  const greeting = sanitizeParam(String(parsed.greeting || ''), 150);
  const motivational_note = sanitizeParam(String(parsed.motivational_note || ''), 250);
  const focus_topic = sanitizeParam(String(parsed.focus_topic || ''), 100);
  const theme = sanitizeParam(String(parsed.theme || ''), 150);

  return ok(
    {
      greeting,
      activities,
      motivational_note,
      focus_topic,
      theme,
      generatedAt: Date.now(),
      stylePersonalized: safeStyle !== null,
    },
    origin,
  );
}
