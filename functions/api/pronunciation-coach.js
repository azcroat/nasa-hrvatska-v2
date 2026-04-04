// Cloudflare Pages Function — AI Pronunciation Coach
// Analyzes a pronunciation attempt and provides specific, actionable coaching.
// Returns phonetic guidance + phoneme-level drills.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

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

// ---------------------------------------------------------------------------
// Croatian phoneme rule engine
// Detects the specific sounds English speakers struggle with and returns
// targeted hints for each one found in the target word.
// ---------------------------------------------------------------------------
function analyzeCroatianPhonemes(target, spoken) {
  if (!target || !spoken) return null;
  const t = target.toLowerCase();
  const s = spoken.toLowerCase();

  // If the transcript matches exactly there is nothing to flag.
  if (t === s) return null;

  const issues = [];

  // ć/č confusion — the most common problem for English speakers.
  // ć (/tɕ/) is a soft palatal affricate; č (/tʃ/) is the harder postalveolar one.
  if ((t.includes('ć') || t.includes('č')) && !s.includes('ć') && !s.includes('č')) {
    issues.push({
      phoneme: 'ć/č',
      ipa: 'tɕ / tʃ',
      hint: "Croatian 'ć' is softer than English 'ch' — like the 't' in 'future'. 'č' is harder, like English 'ch' in 'church'. Both require the tongue higher and further forward than in English.",
    });
  }

  // đ/dž confusion.
  // đ (/dʑ/) is voiced palatal; dž (/dʒ/) is the voiced postalveolar (like English 'j' in 'jeans').
  if ((t.includes('đ') || t.includes('dž')) && t !== s) {
    issues.push({
      phoneme: 'đ/dž',
      ipa: 'dʑ / dʒ',
      hint: "'đ' is like the 'j' in 'jeans' but voiced further forward in the mouth — softer. 'dž' is like the 'j' in 'jungle', identical to English.",
    });
  }

  // š (/ʃ/) — English speakers often substitute plain 's'.
  if (t.includes('š') && !s.includes('š') && !s.includes('sh')) {
    issues.push({
      phoneme: 'š',
      ipa: 'ʃ',
      hint: "'š' is exactly like English 'sh' in 'show'. Round your lips slightly and push the tongue back from the teeth ridge.",
    });
  }

  // ž (/ʒ/) — the voiced counterpart of š.
  if (t.includes('ž') && !s.includes('ž')) {
    issues.push({
      phoneme: 'ž',
      ipa: 'ʒ',
      hint: "'ž' is like the 's' in 'measure' or 'pleasure' — your vocal cords vibrate. It never appears as a plain 'z' in Croatian.",
    });
  }

  // lj (/ʎ/) — palatal lateral, has no English equivalent.
  if (t.includes('lj') && !s.includes('lj')) {
    issues.push({
      phoneme: 'lj',
      ipa: 'ʎ',
      hint: "'lj' is a single sound — like 'lli' in 'million' said quickly as one syllable. Press the middle of your tongue to the roof of your mouth, not just the tip.",
    });
  }

  // nj (/ɲ/) — palatal nasal, like Spanish 'ñ'.
  if (t.includes('nj') && !s.includes('nj')) {
    issues.push({
      phoneme: 'nj',
      ipa: 'ɲ',
      hint: "'nj' is like the 'ny' in 'canyon' said as one sound, or Spanish 'ñ'. Press the middle of your tongue to the roof of your mouth while humming through your nose.",
    });
  }

  // Trilled r (/r/) — Croatian r is always trilled, even syllabic (e.g., 'krv', 'prst').
  if (t.includes('r') && t !== s) {
    // Only flag if r is actually in a position that looks difficult (consonant clusters).
    const hasConsonantR = /[^aeiou]r[^aeiou]/.test(t) || /^r[^aeiou]/.test(t) || /[^aeiou]r$/.test(t);
    if (hasConsonantR) {
      issues.push({
        phoneme: 'r (trilled)',
        ipa: 'r',
        hint: "Croatian 'r' is always trilled (rolled). Touch the tip of your tongue to the ridge behind your upper teeth and let air flutter it. In clusters like 'kr', 'tr', 'prst', the 'r' can be syllabic — it carries the vowel sound by itself.",
      });
    }
  }

  // Stress — Croatian stress almost always falls on the first syllable.
  const vowelCount = (t.match(/[aeiouàáâãäåèéêëìíîïòóôõöùúûüaeiouAEIOUaeiouAEIOU]/g) || []).length;
  if (vowelCount >= 3) {
    // Build a rough first-syllable hint by taking up to the second vowel boundary.
    const firstSyllableMatch = t.match(/^([^aeiou]*[aeiou]+[^aeiou]*)/);
    const firstSyllable = firstSyllableMatch ? firstSyllableMatch[1].toUpperCase() : t.slice(0, 3).toUpperCase();
    issues.push({
      phoneme: 'stress',
      ipa: 'ˈ (primary stress marker)',
      hint: `Croatian stress almost always falls on the FIRST syllable. Emphasize "${firstSyllable}..." and let the rest of the word be lighter.`,
    });
  }

  return issues.length > 0 ? issues : null;
}

// ---------------------------------------------------------------------------
// Format Deepgram word-level data into a concise coaching note.
// wordData shape: { confidence: 0–1, start: float, end: float, word: string }
// ---------------------------------------------------------------------------
function formatWordData(wordData) {
  if (!wordData || typeof wordData !== 'object') return null;

  const confidence = typeof wordData.confidence === 'number'
    ? Math.round(wordData.confidence * 100)
    : null;
  const duration = (typeof wordData.start === 'number' && typeof wordData.end === 'number')
    ? Math.round((wordData.end - wordData.start) * 1000)
    : null;

  const parts = [];
  if (confidence !== null) {
    parts.push(`Deepgram word confidence: ${confidence}% (${
      confidence >= 85 ? 'high — the recognizer heard it clearly'
      : confidence >= 60 ? 'moderate — the recognizer is unsure'
      : 'low — heavily mispronounced or unclear'
    })`);
  }
  if (duration !== null) {
    parts.push(`spoken duration: ${duration}ms (${
      duration < 200 ? 'very short — may have been clipped or rushed'
      : duration > 1500 ? 'very long — possible hesitation or false start'
      : 'normal range'
    })`);
  }

  return parts.length > 0 ? parts.join('; ') : null;
}

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

  // wordData is optional — sent when Deepgram returns per-word timing/confidence.
  const { word, spoken, score, level, wordData } = body;

  if (typeof word !== "string" || !word.trim()) return err(400, "Missing word", origin);

  const safeWord  = sanitizeParam(word, 100);
  const safeSpoken = sanitizeParam(spoken || "", 150);
  const safeScore = Math.min(Math.max(parseInt(score) || 0, 0), 100);
  const safeLevel = VALID_LEVELS.includes(level) ? level : "B1";

  // Run the local phoneme rule engine before building the Claude prompt.
  const phonemeIssues = analyzeCroatianPhonemes(safeWord, safeSpoken);
  const wordDataNote  = formatWordData(wordData);

  const phonemeContext = phonemeIssues
    ? `\nDetected Croatian phoneme issues for English speakers:\n${phonemeIssues.map(i => `  • ${i.phoneme} [${i.ipa}]: ${i.hint}`).join('\n')}`
    : '';

  const wordDataContext = wordDataNote
    ? `\nDeepgram acoustic signal data: ${wordDataNote}`
    : '';

  const performanceContext = safeScore >= 85
    ? "Overall similarity is very high — give encouragement and fine-tune any remaining phoneme issues."
    : safeScore >= 60
    ? "Overall similarity is moderate — prioritize the most impactful phoneme correction, then secondary issues."
    : "Overall similarity is low — focus on foundational mouth placement before rhythm or stress.";

  const userMsg = `A Croatian learner (CEFR ${safeLevel}) attempted to pronounce: "${safeWord}"
Speech recognition heard: "${safeSpoken || "unclear/nothing"}"
Text similarity score: ${safeScore}% (100 = perfect match)
${wordDataContext}

${performanceContext}
${phonemeContext}

COACHING INSTRUCTIONS:
1. If phoneme issues were detected above, address them DIRECTLY and SPECIFICALLY — do not give generic advice.
2. Give the IPA symbol in English-speaker-friendly terms (e.g., /tɕ/ = like 't' in 'future').
3. Provide a 3-word drill sentence using the target sound in three different words, e.g. for 'č': "Čovjek čeka čašu" — so the learner hears the same phoneme in context.
4. Tailor vocabulary and complexity to CEFR ${safeLevel}.

Return ONLY valid JSON (no markdown):
{
  "feedback": "2-3 sentences: what went wrong phoneme-by-phoneme and exactly how to fix it",
  "issue": "one of: stress | vowel | consonant | cluster | length | near-perfect",
  "phonetic_guide": "phonetic breakdown for English speakers, e.g. '${safeWord} = ...' with stressed syllable in CAPS",
  "drills": [
    {"word": "Croatian word using the same target sound", "tip": "why this drill helps, max 60 chars"},
    {"word": "another Croatian word", "tip": "..."},
    {"word": "another Croatian word", "tip": "..."}
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
        max_tokens: 420,
        system: "You are an expert Croatian pronunciation coach specializing in helping native English speakers. You give precise, phoneme-level feedback grounded in articulatory phonetics, always in plain English. Return ONLY valid JSON, no markdown fences.",
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
    feedback:       String(parsed.feedback       || "").slice(0, 500),
    issue:          String(parsed.issue          || "consonant").slice(0, 20),
    phonetic_guide: String(parsed.phonetic_guide || "").slice(0, 300),
    drills: Array.isArray(parsed.drills) ? parsed.drills.slice(0, 3) : [],
    // Pass detected phoneme issues back so the client can highlight them in the UI if desired.
    phoneme_issues: phonemeIssues || [],
  }, origin);
}
