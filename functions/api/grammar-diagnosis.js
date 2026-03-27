// Cloudflare Pages Function — Grammar Diagnosis
// Accepts aggregated mistake data and synthesizes top 2-3 grammar blind spots with drill exercises.

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
    `Identify the top 2-3 grammar blind spots. For each, provide: a name, severity (high/medium/low), ` +
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
    `} — blindSpots must have 2-3 items, each drills array must have exactly 3 items, correct is 0-3 index.`;

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
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("grammar-diagnosis.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable");
  }

  if (!res.ok) {
    console.error("grammar-diagnosis.js: Anthropic API error", res.status, data?.error?.message);
    return err(res.status, data?.error?.message || "Anthropic API error: HTTP " + res.status);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("grammar-diagnosis.js: Anthropic returned empty response");
    return err(502, "Empty response from AI");
  }

  // ── Parse response ──
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("grammar-diagnosis.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return err(502, "parse_failed");
  }

  // Validate blindSpots
  if (!Array.isArray(parsed.blindSpots) || parsed.blindSpots.length < 1 || parsed.blindSpots.length > 3) {
    console.error("grammar-diagnosis.js: blindSpots missing or out of range");
    return err(502, "parse_failed");
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
  });
}
