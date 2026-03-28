// Cloudflare Pages Function — Flash Context
// Given a Croatian word + English meaning + CEFR level, generate a fresh example sentence.

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

function ok(body, origin)         { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) }); }
function err(status, msg, origin) { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) }); }

// ── Input validation ──────────────────────────────────────────────────────────

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : "B1";
}

// ── Complexity guidance by CEFR level ─────────────────────────────────────────

const complexityNote = {
  A1: "Use only present tense. Keep sentence structure simple SVO (subject-verb-object). Use only the most common everyday vocabulary.",
  A2: "Use only present tense. Keep sentence structure simple SVO. Vocabulary should be everyday and common.",
  B1: "May include past tense (perfekt) or near-future. Sentence structure can be slightly more varied.",
  B2: "Use richer sentence structure with connectives (jer, ali, iako, kad). All common tenses are appropriate.",
  C1: "Use complex sentence structure, subordinate clauses, and sophisticated vocabulary. All tenses and aspects are appropriate.",
  C2: "Use highly natural, idiomatic Croatian. Complex grammar, all tenses and aspects, rich vocabulary.",
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";

  // OPTIONS preflight
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS check
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

  // API key check
  if (!ANTHROPIC_KEY) return err(500, "Service not configured", origin);

  // Content-type check
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type", origin);

  // Parse body
  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body", origin); }

  const { word, meaning, level, missCount = 0, learnerErrors = [] } = body;

  // Validate word
  if (typeof word !== "string" || !word.trim()) {
    return err(400, "Missing or invalid word", origin);
  }
  const safeWord = sanitizeParam(word, 60);
  if (!safeWord) return err(400, "word is empty after sanitization", origin);

  // Validate meaning
  if (typeof meaning !== "string" || !meaning.trim()) {
    return err(400, "Missing or invalid meaning", origin);
  }
  const safeMeaning = sanitizeParam(meaning, 100);
  if (!safeMeaning) return err(400, "meaning is empty after sanitization", origin);

  // Validate level
  const safeLevel = sanitizeLevel(level);

  // Validate missCount and learnerErrors
  const safeMissCount = (Number.isFinite(Number(missCount)) && Number(missCount) >= 0)
    ? Math.min(Math.floor(Number(missCount)), 999)
    : 0;
  const safeLearnerErrors = Array.isArray(learnerErrors)
    ? learnerErrors.slice(0, 6).map(e => sanitizeParam(String(e ?? ''), 100)).filter(Boolean)
    : [];

  // ── Build prompts ──
  const systemPrompt = `You are a Croatian language teacher creating rich flashcard context.
Word: ${safeWord} (${safeMeaning})
Level: ${safeLevel}
Complexity guidance: ${complexityNote[safeLevel] || complexityNote["B1"]}
Times missed: ${safeMissCount}
${safeMissCount > 2 ? 'This word is frequently missed — make examples especially memorable and add a mnemonic.' : ''}
${safeLearnerErrors.length > 0 ? 'Learner struggles with: ' + safeLearnerErrors.join(', ') + '. Incorporate these patterns in examples.' : ''}

Return ONLY valid JSON, no markdown.`;

  const userMessage =
    `Create two different example sentences in Croatian for the word '${safeWord}'. ` +
    `Return JSON: { "examples": [ { "hr": "...", "en": "..." }, { "hr": "...", "en": "..." } ], "note": "brief grammar note in English, max 80 chars or null", "mnemonic": "memory trick if helpful, null if not" }`;

  // ── Call Anthropic ──
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
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("flash-context.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  if (!res.ok) {
    console.error("flash-context.js: Anthropic API error", res.status, data?.error?.message);
    return err(res.status, data?.error?.message || "Anthropic API error: HTTP " + res.status, origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("flash-context.js: Anthropic returned empty response");
    return err(502, "Empty response from AI", origin);
  }

  // ── Parse response ──
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("flash-context.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed", origin);
  }

  // Validate required fields
  if (!Array.isArray(parsed.examples) || parsed.examples.length < 1) {
    console.error("flash-context.js: missing or invalid examples array in response");
    return err(502, "parse_failed", origin);
  }

  const examples = parsed.examples.slice(0, 2).map(ex => {
    if (typeof ex?.hr !== "string" || !ex.hr.trim() || typeof ex?.en !== "string" || !ex.en.trim()) {
      return null;
    }
    return { hr: ex.hr.trim(), en: ex.en.trim() };
  }).filter(Boolean);

  if (examples.length < 1) {
    console.error("flash-context.js: no valid example entries in response");
    return err(502, "parse_failed", origin);
  }

  const note     = (typeof parsed.note === "string" && parsed.note.trim()) ? parsed.note.trim().slice(0, 80) : null;
  const mnemonic = (typeof parsed.mnemonic === "string" && parsed.mnemonic.trim()) ? parsed.mnemonic.trim().slice(0, 200) : null;

  return ok({ examples, note, mnemonic }, origin);
}
