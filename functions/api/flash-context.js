// Cloudflare Pages Function — Flash Context
// Given a Croatian word + English meaning + CEFR level, generate a fresh example sentence.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

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

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-cache",
};

function ok(body)         { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders }); }
function err(status, msg) { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders }); }

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
  // OPTIONS preflight
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS check
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden");

  // API key check
  if (!ANTHROPIC_KEY) return err(500, "Service not configured");

  // Content-type check
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type");

  // Parse body
  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body"); }

  const { word, meaning, level } = body;

  // Validate word
  if (typeof word !== "string" || !word.trim()) {
    return err(400, "Missing or invalid word");
  }
  const safeWord = sanitizeParam(word, 60);
  if (!safeWord) return err(400, "word is empty after sanitization");

  // Validate meaning
  if (typeof meaning !== "string" || !meaning.trim()) {
    return err(400, "Missing or invalid meaning");
  }
  const safeMeaning = sanitizeParam(meaning, 100);
  if (!safeMeaning) return err(400, "meaning is empty after sanitization");

  // Validate level
  const safeLevel = sanitizeLevel(level);

  // ── Build prompts ──
  const systemPrompt = "You are a Croatian language teacher creating example sentences. Return ONLY valid JSON, no markdown.";

  const userMessage =
    `Create one example sentence in Croatian using the word '${safeWord}' (meaning: '${safeMeaning}'). ` +
    `CEFR level: ${safeLevel}. ` +
    `Complexity guidance: ${complexityNote[safeLevel] || complexityNote["B1"]} ` +
    `Return JSON: { "hr": "Croatian sentence", "en": "English translation", "note": "optional grammar note in English, max 80 chars or null" }`;

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
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("flash-context.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable");
  }

  if (!res.ok) {
    console.error("flash-context.js: Anthropic API error", res.status, data?.error?.message);
    return err(res.status, data?.error?.message || "Anthropic API error: HTTP " + res.status);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("flash-context.js: Anthropic returned empty response");
    return err(502, "Empty response from AI");
  }

  // ── Parse response ──
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("flash-context.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed");
  }

  // Validate required fields
  if (typeof parsed.hr !== "string" || !parsed.hr.trim()) {
    console.error("flash-context.js: missing hr field in response");
    return err(502, "parse_failed");
  }
  if (typeof parsed.en !== "string" || !parsed.en.trim()) {
    console.error("flash-context.js: missing en field in response");
    return err(502, "parse_failed");
  }

  const hr = parsed.hr.trim();
  const en = parsed.en.trim();
  const note = (typeof parsed.note === "string" && parsed.note.trim()) ? parsed.note.trim().slice(0, 80) : null;

  return ok({ hr, en, note });
}
