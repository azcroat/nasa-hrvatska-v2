// Cloudflare Pages Function — Photo Vocab
// Accepts a base64-encoded image, uses Claude's vision capability to identify
// objects/text in the image, and returns Croatian vocabulary for what was found.

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

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const VALID_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VALID_CATEGORIES = ["food", "object", "place", "action", "text", "person", "animal", "other"];

// 5MB base64 limit — base64 overhead ~33%, so ~5MB base64 ≈ ~3.75MB raw
const MAX_BASE64_BYTES = 5 * 1024 * 1024;

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : "B1";
}

// ── PREFLIGHT ──────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";

  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden", origin);

  const allowed = await checkRateLimit(request, 10);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429, headers: corsHeaders(origin) });
  }

  // Auth required
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (!uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders(origin) });
  }

  // Daily AI quota check (cost 2 — vision is expensive)
  const quota = await checkAIQuota(request, env, uid, 2);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: 'daily_quota_exceeded', message: 'Daily AI limit reached. Resets at midnight UTC.', resetAt: quota.resetAt }),
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return err(500, "Service not configured", origin);

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return err(400, "Invalid content type", origin);

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body", origin); }

  const { imageData, mediaType, level, context } = body;

  // Validate required fields
  if (!imageData || typeof imageData !== "string") return err(400, "imageData is required", origin);
  if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) return err(400, "mediaType must be image/jpeg, image/png, or image/webp", origin);

  // Size guard — check character length as proxy for byte size
  if (imageData.length > MAX_BASE64_BYTES) {
    return err(413, "Image too large. Maximum size is 5MB.", origin);
  }

  const safeLevel = sanitizeLevel(typeof level === "string" ? level.trim() : "");
  const safeContext = context ? sanitizeParam(String(context), 100) : "";

  // ── Build Claude vision request ────────────────────────────────────────────
  const textPrompt =
    `You are a Croatian language teacher helping a ${safeLevel} learner discover vocabulary from real life.\n\n` +
    `Look at this image and identify the most useful Croatian vocabulary for a language learner.\n` +
    (safeContext ? `Context hint: ${safeContext}\n` : '') +
    `\nReturn a JSON object: {\n` +
    `  "items": [up to 8 most useful vocabulary items, each: {hr, en, pronunciation, category, example}],\n` +
    `  "scene": "one sentence describing what you see"\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Focus on concrete, learnable vocabulary\n` +
    `- pronunciation: write it as English phonetics (e.g. "kah-VAH" for kava)\n` +
    `- example: a simple sentence at ${safeLevel} level using the word\n` +
    `- If the image contains readable text (menu, sign, label), prioritize translating that text\n` +
    `- Respond with valid JSON only. No markdown.`;

  const claudeBody = {
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: imageData },
        },
        {
          type: "text",
          text: textPrompt,
        },
      ],
    }],
  };

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify(claudeBody),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("photo-vocab.js: network error calling Anthropic:", fetchErr.message);
    return ok({ items: [], scene: "Could not analyze image." }, origin);
  }

  if (!res.ok) {
    console.error("photo-vocab.js: Anthropic API error", res.status, data?.error?.message);
    return ok({ items: [], scene: "Could not analyze image." }, origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("photo-vocab.js: Anthropic returned empty response");
    return ok({ items: [], scene: "Could not analyze image." }, origin);
  }

  // ── Parse and validate response ────────────────────────────────────────────
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("photo-vocab.js: JSON parse failed. Raw:", raw.slice(0, 200));
    return ok({ items: [], scene: "Could not analyze image." }, origin);
  }

  const items = Array.isArray(parsed.items)
    ? parsed.items.slice(0, 8).map(item => ({
        hr: sanitizeParam(String(item.hr || ""), 100),
        en: sanitizeParam(String(item.en || ""), 100),
        pronunciation: sanitizeParam(String(item.pronunciation || ""), 100),
        category: VALID_CATEGORIES.includes(item.category) ? item.category : "other",
        example: sanitizeParam(String(item.example || ""), 300),
      })).filter(item => item.hr && item.en)
    : [];

  const scene = sanitizeParam(String(parsed.scene || ""), 300);

  return ok({ items, scene }, origin);
}
