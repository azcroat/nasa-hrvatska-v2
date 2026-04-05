// Cloudflare Pages Function — SRS Sync after Maja sessions
// Extracts vocabulary and grammar patterns from a Maja conversation for SRS study.
// Uses claude-haiku-4-5-20251001 (simple extraction task).

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-cache",
  };
}

function ok(body, origin)         { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) }); }
function err(status, msg, origin) { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) }); }

// ── System prompt ─────────────────────────────────────────────────────────────

const SRS_SYSTEM_PROMPT = `Extract vocabulary and grammar patterns from this Croatian language learning conversation.

Return ONLY valid JSON:
{
  "vocabulary": [
    {"word": "Croatian word", "english": "English translation", "priority": "high|medium|low"}
  ],
  "grammarGaps": [
    {"pattern": "grammar concept name", "example": "example of the error or usage", "priority": "high|medium|low"}
  ],
  "sessionSummary": "One sentence summary of what was practiced"
}

Focus on:
- Words the learner used incorrectly or hesitated on
- New words introduced by Maja that the learner should memorize
- Grammar patterns where errors occurred
- Limit to max 5 vocabulary items and 3 grammar gaps (most important only)`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS check
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden", origin);

  // Rate limit
  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429, headers: corsHeaders(origin) });
  }

  // Require valid Firebase auth token
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (FIREBASE_PROJECT_ID && !uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders(origin) });
  }

  // Daily AI quota check (cost 1 — simple extraction task)
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: 'daily_quota_exceeded', message: 'Daily AI limit reached. Resets at midnight UTC.', resetAt: quota.resetAt }),
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  // API key check
  if (!ANTHROPIC_KEY) return err(500, "Service not configured", origin);

  // Content-type check
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type", origin);

  // Parse body
  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body", origin); }

  const { conversation, level, userName } = body;

  // Validate conversation
  if (typeof conversation !== "string" || !conversation.trim()) {
    return err(400, "Missing or invalid conversation", origin);
  }

  // Sanitize and truncate conversation to 4000 chars max
  const safeConversation = sanitizeParam(conversation, 4000);
  if (!safeConversation) return err(400, "Conversation is empty after sanitization", origin);

  const safeLevel    = sanitizeParam(level || "B1", 10);
  const safeUserName = sanitizeParam(userName || "Student", 50);

  // ── Build user message ──
  const userMessage = `Student: ${safeUserName}\nLevel: ${safeLevel}\n\nConversation:\n${safeConversation}`;

  // ── Call Anthropic (Haiku) ──
  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: SRS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("srs-sync.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  if (!res.ok) {
    console.error("srs-sync.js: Anthropic API error", res.status, data?.error?.message);
    return err(res.status, isDev ? (data?.error?.message || "Anthropic API error: HTTP " + res.status) : "AI service error", origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("srs-sync.js: Anthropic returned empty response");
    return ok({ vocabulary: [], grammarGaps: [], sessionSummary: "" }, origin);
  }

  // ── Parse and validate the JSON response ──
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("srs-sync.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return ok({ vocabulary: [], grammarGaps: [], sessionSummary: "" }, origin);
  }

  // Validate vocabulary array
  const VALID_PRIORITIES = ["high", "medium", "low"];
  const vocabulary = Array.isArray(parsed.vocabulary)
    ? parsed.vocabulary.slice(0, 5).map((v) => ({
        word:     sanitizeParam(String(v?.word    || ""), 100),
        english:  sanitizeParam(String(v?.english || ""), 100),
        priority: VALID_PRIORITIES.includes(v?.priority) ? v.priority : "medium",
      })).filter((v) => v.word)
    : [];

  // Validate grammarGaps array
  const grammarGaps = Array.isArray(parsed.grammarGaps)
    ? parsed.grammarGaps.slice(0, 3).map((g) => ({
        pattern:  sanitizeParam(String(g?.pattern || ""), 100),
        example:  sanitizeParam(String(g?.example || ""), 200),
        priority: VALID_PRIORITIES.includes(g?.priority) ? g.priority : "medium",
      })).filter((g) => g.pattern)
    : [];

  // Validate sessionSummary
  const sessionSummary = typeof parsed.sessionSummary === "string"
    ? sanitizeParam(parsed.sessionSummary, 300)
    : "";

  return ok({ vocabulary, grammarGaps, sessionSummary }, origin);
}
