// Cloudflare Pages Function — AI Error Explanation
// When a learner gets a cloze, dictation, or flashcard wrong, explains WHY.
// Returns a pedagogically useful explanation of the grammar rule.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function sanitizeParam(value, maxLen = 300) {
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

const VALID_TYPES = ["cloze", "dictation", "flashcard"];
const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden", origin);

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429, headers: corsHeaders(origin) });
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

  const { wrong, correct, context: ctx, type, level } = body;

  if (!VALID_TYPES.includes(type)) return err(400, "Invalid type", origin);
  if (typeof correct !== "string" || !correct.trim()) return err(400, "Missing correct answer", origin);

  const safeWrong = sanitizeParam(wrong || "", 200);
  const safeCorrect = sanitizeParam(correct, 200);
  const safeCtx = sanitizeParam(ctx || "", 300);
  const safeLevel = VALID_LEVELS.includes(level) ? level : "B1";

  const TYPE_DESCS = {
    cloze: "fill-in-the-blank grammar exercise",
    dictation: "listening dictation exercise",
    flashcard: "vocabulary flashcard",
  };
   
  const typeDesc = TYPE_DESCS[type];

  const userMsg = safeCtx
    ? `Croatian ${typeDesc} at CEFR ${safeLevel} level.
Full sentence/context: "${safeCtx}"
${safeWrong ? `Learner chose: "${safeWrong}"` : "Learner got it wrong."}
Correct answer: "${safeCorrect}"

Explain concisely WHY "${safeCorrect}" is correct. Name the grammar rule, case, or pattern.`
    : `Croatian ${typeDesc} at CEFR ${safeLevel}.
Correct answer: "${safeCorrect}"${safeWrong ? `\nLearner answered: "${safeWrong}"` : ""}

Explain the grammar rule. Be specific about case, tense, or pattern.`;

  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 180,
        system: `You are a Croatian grammar teacher. Give a concise explanation (2-3 sentences) of why an answer is correct.
Return ONLY valid JSON (no markdown, no code blocks):
{"explanation":"2-3 sentences explaining the grammar rule","rule":"short rule name e.g. 'Accusative case' or 'Negation genitive'","tip":"one memorable tip max 100 chars","example":"one short example sentence in Croatian showing the rule"}`,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("explain-error.js: network error:", fetchErr.message);
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
    console.error("explain-error.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed", origin);
  }

  return ok({
    explanation: String(parsed.explanation || "").slice(0, 400),
    rule: String(parsed.rule || "").slice(0, 80),
    tip: String(parsed.tip || "").slice(0, 150),
    example: String(parsed.example || "").slice(0, 150),
  }, origin);
}
