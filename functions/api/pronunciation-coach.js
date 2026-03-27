// Cloudflare Pages Function — AI Pronunciation Coach
// Analyzes a pronunciation attempt and provides specific, actionable coaching.
// Returns phonetic guidance + minimal pair drills.

import { checkRateLimit } from './_rateLimit.js';

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
    return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders(origin) });
  }

  if (!ANTHROPIC_KEY) return err(500, "Service not configured", origin);

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type", origin);

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body", origin); }

  const { word, spoken, score, level } = body;

  if (typeof word !== "string" || !word.trim()) return err(400, "Missing word", origin);

  const safeWord = sanitizeParam(word, 100);
  const safeSpoken = sanitizeParam(spoken || "", 150);
  const safeScore = Math.min(Math.max(parseInt(score) || 0, 0), 100);
  const safeLevel = VALID_LEVELS.includes(level) ? level : "B1";

  const userMsg = `A Croatian learner (CEFR ${safeLevel}) tried to pronounce: "${safeWord}"
Speech recognition heard: "${safeSpoken || "unclear/nothing"}"
Similarity score: ${safeScore}% (100 = perfect match)

${safeScore >= 85 ? "They are very close — give encouragement and fine-tuning." : safeScore >= 60 ? "They are partially correct — give targeted correction." : "They are struggling significantly — give clear foundational coaching."}

Provide actionable Croatian pronunciation coaching, considering common difficulties for English speakers.

Return ONLY valid JSON (no markdown):
{
  "feedback": "1-2 sentences of specific coaching — what exactly to fix and how",
  "issue": "one of: stress | vowel | consonant | cluster | length | near-perfect",
  "phonetic_guide": "phonetic breakdown for English speakers e.g. 'hvala = HVAH-lah (H is breathy, A is pure AH)'",
  "drills": [
    {"word": "Croatian word to practice", "tip": "why this helps, max 50 chars"},
    {"word": "Croatian word", "tip": "..."},
    {"word": "Croatian word", "tip": "..."}
  ]
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
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 320,
        system: "You are a Croatian pronunciation coach. Give specific, actionable feedback. Return ONLY valid JSON, no markdown.",
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("pronunciation-coach.js: network error:", fetchErr.message);
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
    console.error("pronunciation-coach.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed", origin);
  }

  return ok({
    feedback: String(parsed.feedback || "").slice(0, 300),
    issue: String(parsed.issue || "consonant").slice(0, 20),
    phonetic_guide: String(parsed.phonetic_guide || "").slice(0, 200),
    drills: Array.isArray(parsed.drills) ? parsed.drills.slice(0, 3) : [],
  }, origin);
}
