// Cloudflare Pages Function — AI Personalized Micro-Lesson
// Generates a targeted 5-minute lesson from the learner's SRS weak words.
// Adapts to their level and goal for maximum relevance.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

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
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

function corsHeaders(origin) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-cache",
  };
}

function ok(body, origin) { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) }); }
function err(status, msg, origin) { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) }); }

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const VALID_GOALS = ["heritage", "family", "travel", "culture", "partner", "fluent"];

const GOAL_CONTEXT = {
  heritage: "diaspora heritage speaker reconnecting with Croatian family language and culture",
  family:   "learning Croatian to communicate with Croatian family members and relatives",
  travel:   "preparing to travel and navigate Croatia independently as a tourist",
  culture:  "immersing in Croatian history, culture, food, and traditions",
  partner:  "learning Croatian to communicate with a Croatian partner and their family",
  fluent:   "working toward full conversational fluency in Croatian",
};

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Content validation ─────────────────────────────────────────────────────────

function validateMicroLesson(data) {
  if (!data.title || !data.examples || !Array.isArray(data.examples)) return null;
  // Ensure quiz has valid structure
  if (data.quiz) {
    data.quiz = data.quiz.filter(q =>
      q.question && Array.isArray(q.options) && q.options.length >= 2 &&
      typeof q.answer === 'number' && q.answer < q.options.length
    );
  }
  return data;
}

export async function onRequestPost({ request, env }) {
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden", origin);

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders(origin) });
  }

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;

  // Daily AI quota check (cost 1)
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: 'daily_quota_exceeded', message: 'Daily AI limit reached. Resets at midnight UTC.', resetAt: quota.resetAt }),
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  if (!ANTHROPIC_KEY) return err(500, "Service not configured", origin);

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type", origin);

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body", origin); }

  const { weakWords, level, goal } = body;

  if (!Array.isArray(weakWords) || weakWords.length === 0) return err(400, "Missing weakWords array", origin);

  const safeLevel = VALID_LEVELS.includes(level) ? level : "A2";
  const safeGoal = VALID_GOALS.includes(goal) ? goal : "fluent";

  // Take top 5 weak words
  const topWords = weakWords.slice(0, 5).map(w => ({
    hr: sanitizeParam(String(w.hr || w.word || ""), 60),
    en: sanitizeParam(String(w.en || w.meaning || ""), 80),
    missCount: Math.min(Math.max(parseInt(w.missCount || w.wrong || 0) || 0, 0), 99),
  })).filter(w => w.hr && w.en);

  if (topWords.length === 0) return err(400, "No valid weak words", origin);

  const goalDesc = GOAL_CONTEXT[safeGoal];
  const wordsList = topWords.map(w => `- ${w.hr} (${w.en}) — missed ${w.missCount}×`).join("\n");

  const userMsg = `Create a personalized 5-minute Croatian micro-lesson for a ${safeLevel} learner who is ${goalDesc}.

These are their most-missed spaced repetition words:
${wordsList}

Design the lesson around WHY they keep missing these words — find the common pattern and address it directly.

Return ONLY valid JSON (no markdown):
{
  "title": "engaging lesson title, max 8 words",
  "focus": "one-line description of the grammar/vocab pattern targeted",
  "intro": "2-sentence intro explaining the pattern these words share and why it trips learners up",
  "examples": [
    {"hr": "natural Croatian sentence using one weak word", "en": "English translation", "highlight": "exact weak word used", "note": "grammar note max 65 chars"},
    {"hr": "...", "en": "...", "highlight": "...", "note": "..."},
    {"hr": "...", "en": "...", "highlight": "...", "note": "..."}
  ],
  "quiz": [
    {"question": "Croatian sentence with ___ blank for the target word", "options": ["correct answer", "plausible wrong", "plausible wrong", "plausible wrong"], "answer": 0, "explanation": "why this is correct, max 80 chars"},
    {"question": "...", "options": ["correct", "wrong", "wrong", "wrong"], "answer": 0, "explanation": "..."},
    {"question": "...", "options": ["correct", "wrong", "wrong", "wrong"], "answer": 0, "explanation": "..."}
  ],
  "tip": "one memorable mnemonic or concrete trick to remember these words"
}`;

  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1100,
        system: "You are a Croatian language teacher creating a targeted micro-lesson. Return ONLY valid JSON, no markdown.",
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("micro-lesson.js: network error:", fetchErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  if (!res.ok) return err(502, "AI service error", origin);

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) return err(502, "Empty response from AI", origin);

  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("micro-lesson.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed", origin);
  }

  // ── Content validation ──
  const validated = validateMicroLesson(parsed);
  if (!validated) {
    console.error("micro-lesson.js: content validation failed — missing title or examples");
    return err(502, "parse_failed", origin);
  }

  return ok({
    title: String(validated.title || "").slice(0, 80),
    focus: String(validated.focus || "").slice(0, 150),
    intro: String(validated.intro || "").slice(0, 500),
    examples: Array.isArray(validated.examples) ? validated.examples.slice(0, 3) : [],
    quiz: Array.isArray(validated.quiz) ? validated.quiz.slice(0, 3) : [],
    tip: String(validated.tip || "").slice(0, 200),
    weakWords: topWords,
    generatedAt: Date.now(),
  }, origin);
}
