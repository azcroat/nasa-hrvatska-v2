// Cloudflare Pages Function — Grammar Diagnosis
// Accepts aggregated mistake data and synthesizes top 2-3 grammar blind spots with drill exercises.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

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

// ── Input validation ──────────────────────────────────────────────────────────

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : "B1";
}

// ── Build compact mistake summary ─────────────────────────────────────────────

function buildMistakeSummary(srMistakes, majaPatterns, writingMistakes) {
  const parts = [];

  // SRS: find top 8 most-wrong words by wrong_count
  if (srMistakes && typeof srMistakes === "object" && !Array.isArray(srMistakes)) {
    const entries = Object.entries(srMistakes)
      .map(([word, stats]) => {
        const wrongCount = Number(stats?.wrong_count) || 0;
        const rightCount = Number(stats?.right_count) || 0;
        return { word: sanitizeParam(word, 40), wrongCount, rightCount };
      })
      .filter(e => e.word && e.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 8);

    if (entries.length > 0) {
      const wordList = entries.map(e => `${e.word}(${e.wrongCount}w/${e.rightCount}r)`).join(", ");
      parts.push(`SRS weakest words: ${wordList}`);
    }
  }

  // Maja patterns
  if (Array.isArray(majaPatterns) && majaPatterns.length > 0) {
    const safe = majaPatterns.slice(0, 20).map(p => sanitizeParam(String(p), 80)).filter(Boolean);
    if (safe.length > 0) parts.push(`Maja patterns: ${safe.join(", ")}`);
  }

  // Writing mistakes
  if (Array.isArray(writingMistakes) && writingMistakes.length > 0) {
    const safe = writingMistakes.slice(0, 20).map(m => sanitizeParam(String(m), 200)).filter(Boolean);
    if (safe.length > 0) parts.push(`Writing mistakes: ${safe.join("; ")}`);
  }

  return parts.length > 0 ? parts.join(". ") : "No mistake data available.";
}

// ── Content validation ─────────────────────────────────────────────────────────

function validateDiagnosis(data) {
  if (!data.blindSpots || !Array.isArray(data.blindSpots)) {
    data.blindSpots = [];
  }
  // Ensure each blind spot has required fields
  data.blindSpots = data.blindSpots
    .filter(bs => bs.name && bs.explanation)
    .slice(0, 5) // allow up to 5 blind spots
    .map(bs => ({
      name: bs.name,
      severity: ['high','medium','low'].includes(bs.severity) ? bs.severity : 'medium',
      explanation: bs.explanation,
      example: bs.example || null,
      drills: Array.isArray(bs.drills) ? bs.drills.slice(0, 3) : [],
    }));
  return data;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS check
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden", origin);

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429, headers: corsHeaders(origin) });
  }

  // Require valid Firebase auth token for AI endpoints
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (FIREBASE_PROJECT_ID && !uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders(origin) });
  }

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

  const { level, srMistakes, majaPatterns, writingMistakes } = body;

  // Validate level
  const safeLevel = sanitizeLevel(typeof level === "string" ? level.trim() : "");

  // Validate srMistakes — must be object (or absent)
  const safeSrMistakes = (srMistakes && typeof srMistakes === "object" && !Array.isArray(srMistakes))
    ? srMistakes
    : {};

  // Cap srMistakes to 100 entries
  const srEntries = Object.entries(safeSrMistakes).slice(0, 100);
  const cappedSrMistakes = Object.fromEntries(srEntries);

  // Validate majaPatterns
  const safeMajaPatterns = Array.isArray(majaPatterns)
    ? majaPatterns.slice(0, 20).map(p => sanitizeParam(String(p), 80)).filter(Boolean)
    : [];

  // Validate writingMistakes
  const safeWritingMistakes = Array.isArray(writingMistakes)
    ? writingMistakes.slice(0, 20).map(m => sanitizeParam(String(m), 200)).filter(Boolean)
    : [];

  // Build compact summary
  const summary = buildMistakeSummary(cappedSrMistakes, safeMajaPatterns, safeWritingMistakes);

  // ── Build prompts ──
  const systemPrompt = "You are a Croatian language learning coach analyzing a student's mistake patterns. Return ONLY valid JSON.";

  const userMessage =
    `Based on this mistake data for a CEFR ${safeLevel} learner: ${summary}. ` +
    `Identify the top 3-5 grammar blind spots. PRIORITIZE checking for these six high-frequency Croatian error types — ` +
    `include any that appear in the data: ` +
    `(1) Verbal aspect — imperfective/perfective confusion (most common Croatian error for English speakers); ` +
    `(2) Clitic placement — clitics (sam/si/je/ga/mu/se etc.) placed at clause end instead of Wackernagel second position; ` +
    `(3) Animate accusative — masculine animate nouns in accusative should equal genitive singular (vidim brata, not vidim brat); ` +
    `(4) Genitive of negation — after nema, negated verbs the object takes genitive not accusative (nema kruha, ne vidim brata); ` +
    `(5) Gender/number agreement — adjective/numeral agreement errors (dva/dvije, jedan/jedna/jedno); ` +
    `(6) Vocative avoidance — using nominative for direct address instead of vocative (prijatelju!, Marija!). ` +
    `For each blind spot found, provide: a name, severity (high/medium/low), ` +
    `a 2-sentence explanation of the rule in simple English, 2 example sentences (one wrong, one correct, ` +
    `both in Croatian with English translations), and 3 targeted drill questions (multiple choice, Croatian). ` +
    `Return JSON: { ` +
    `"blindSpots": [{ ` +
    `"name": "string", ` +
    `"severity": "high"|"medium"|"low", ` +
    `"explanation": "string", ` +
    `"example": { "wrong": "string", "correct": "string", "wrong_en": "string", "correct_en": "string" }, ` +
    `"drills": [{ "q": "string", "options": ["string","string","string","string"], "correct": 0 }] ` +
    `}], ` +
    `"summary": "one sentence overall assessment" ` +
    `} — blindSpots must have 3-5 items, each drills array must have exactly 3 items, correct is 0-3 index.`;

  // ── Call Anthropic ──

  // Block 1: fetch — catches network errors only
  let res;
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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error("grammar-diagnosis.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error("grammar-diagnosis.js: failed to read response body:", bodyErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  // Block 3: check res.ok — map errors to client-safe responses
  if (!res.ok) {
    let errMsg;
    try { errMsg = JSON.parse(rawBody)?.error?.message; } catch { /* not JSON */ }
    console.error("grammar-diagnosis.js: Anthropic API error", res.status, errMsg);
    return err(res.status >= 500 ? 502 : res.status, isDev ? (errMsg || "API error: HTTP " + res.status) : "AI service error", origin);
  }

  // Block 4: parse JSON — catches malformed responses
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error("grammar-diagnosis.js: JSON parse failed:", rawBody.slice(0, 200));
    return err(502, "Invalid response from AI", origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("grammar-diagnosis.js: Anthropic returned empty response");
    return err(502, "Empty response from AI", origin);
  }

  // ── Parse response ──
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("grammar-diagnosis.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed", origin);
  }

  // ── Content validation ──
  parsed = validateDiagnosis(parsed);

  // Validate blindSpots
  if (!Array.isArray(parsed.blindSpots) || parsed.blindSpots.length < 1 || parsed.blindSpots.length > 3) {
    console.error("grammar-diagnosis.js: blindSpots missing or out of range after validation");
    return err(502, "parse_failed", origin);
  }

  const VALID_SEVERITIES = ["high", "medium", "low"];

  // Build clean response
  const blindSpots = parsed.blindSpots.slice(0, 3).map(spot => ({
    name: sanitizeParam(String(spot.name || ""), 100),
    severity: VALID_SEVERITIES.includes(spot.severity) ? spot.severity : "medium",
    explanation: sanitizeParam(String(spot.explanation || ""), 500),
    example: {
      wrong:      String(spot.example?.wrong      || "").trim(),
      correct:    String(spot.example?.correct    || "").trim(),
      wrong_en:   String(spot.example?.wrong_en   || "").trim(),
      correct_en: String(spot.example?.correct_en || "").trim(),
    },
    drills: Array.isArray(spot.drills)
      ? spot.drills.slice(0, 3).map(d => ({
          q:       String(d.q || "").trim(),
          options: Array.isArray(d.options) ? d.options.slice(0, 4).map(o => String(o).trim()) : [],
          correct: Number.isInteger(d.correct) && d.correct >= 0 && d.correct <= 3 ? d.correct : 0,
        }))
      : [],
  }));

  const summaryText = typeof parsed.summary === "string" ? parsed.summary.trim() : "";

  return ok({
    blindSpots,
    summary: summaryText,
    generatedAt: Date.now(),
  }, origin);
}
