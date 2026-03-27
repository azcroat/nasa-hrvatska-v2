// Cloudflare Pages Function — AI Dialogue Partner
// Powers free-form Croatian conversation within real-world scenarios.
// The AI plays the NPC character; the learner plays themselves.

import { checkRateLimit } from './_rateLimit.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

function sanitizeParam(value, maxLen = 400) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\r\n\t]/g, ' ')
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

const SCENARIO_CONTEXTS = {
  cafe:             { character: "Konobar (waiter)",                    setting: "a café in Zagreb",                          role: "You are a friendly Croatian waiter. Be welcoming, helpful, and natural. 1-2 sentences per reply." },
  directions:       { character: "Prolaznik (local passer-by)",          setting: "a street in a Croatian city",               role: "You are a helpful Croatian local giving directions or local tips. 1-2 sentences." },
  doctor:           { character: "Doktor (doctor)",                      setting: "a medical clinic in Croatia",               role: "You are a Croatian doctor. Ask about symptoms and give brief advice. Professional but warm. 1-2 sentences." },
  shopping:         { character: "Prodavačica (shop assistant)",          setting: "a clothing store in Croatia",               role: "You are a helpful Croatian shop assistant. Help find items and answer questions. 1-2 sentences." },
  meeting:          { character: "Marko (a friendly Croatian local)",    setting: "a social event in Croatia",                 role: "You are Marko, a warm and curious Croatian person meeting a foreigner. Be encouraging. 1-2 sentences." },
  transport:        { character: "Blagajnica (ticket clerk)",             setting: "a train station in Croatia",               role: "You are a Croatian train ticket clerk. Handle ticket purchases efficiently. 1-2 sentences." },
  emergency:        { character: "Dispečer hitne pomoći (dispatcher)",   setting: "emergency services call",                   role: "You are an emergency dispatcher. Ask clear essential questions. Calm and professional. 1-2 sentences." },
  pharmacy:         { character: "Ljekarnica Ana (pharmacist)",          setting: "a pharmacy in Split",                       role: "You are pharmacist Ana. Help with medication questions professionally and caringly. 1-2 sentences." },
  restaurant:       { character: "Konobar (waiter at Dubrovnik restaurant)", setting: "an upscale restaurant in Dubrovnik",   role: "You are a professional Croatian waiter at a fine restaurant. Handle reservations and orders elegantly. 1-2 sentences." },
  family_gathering: { character: "Gospođa Horvat (Croatian host)",       setting: "a Croatian family gathering",              role: "You are Gospođa Horvat welcoming a foreign guest. Be warm, hospitable, and traditionally Croatian. 1-2 sentences." },
};

const VALID_SCENARIO_IDS = Object.keys(SCENARIO_CONTEXTS);
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

  const { scenario_id, userMessage, history = [], level } = body;

  if (!VALID_SCENARIO_IDS.includes(scenario_id)) return err(400, "Invalid scenario", origin);
  if (typeof userMessage !== "string" || !userMessage.trim()) return err(400, "Missing userMessage", origin);

  const safeMsg = sanitizeParam(userMessage, 500);
  if (!safeMsg) return err(400, "Empty message after sanitization", origin);

  const safeLevel = VALID_LEVELS.includes(level) ? level : "A2";
  const safeHistory = Array.isArray(history) ? history.slice(-16) : [];

  const ctx = SCENARIO_CONTEXTS[scenario_id];

  const levelGuidance = {
    A1: "Use very simple present tense, basic vocabulary only. Max 10 words per sentence.",
    A2: "Use simple present and past tense. Keep vocabulary everyday and common.",
    B1: "Use varied tenses naturally. Intermediate vocabulary is fine.",
    B2: "Use rich natural Croatian. All tenses and connectives appropriate.",
    C1: "Use sophisticated, idiomatic Croatian with complex structures.",
    C2: "Use fully natural, native-level Croatian.",
  }[safeLevel] || "";

  const systemPrompt = `You are ${ctx.character} in ${ctx.setting}. ${ctx.role}

The learner is studying Croatian at CEFR level ${safeLevel}. ${levelGuidance}

RULES:
1. ALWAYS reply ONLY in Croatian — never switch to English in your main reply
2. Keep reply to 1-3 sentences maximum — brief and natural
3. If the learner made a grammar mistake, naturally model the correct form in your reply (implicit correction — never lecture or point it out)
4. If the learner's message is completely incomprehensible, respond: "Oprostite, nisam razumio/razumjela."
5. Stay completely in character — you ARE this person in this Croatian setting
6. Never break the 4th wall or mention being an AI

After your Croatian reply, add on a new line:
COACHING: [one coaching tip in English, max 80 chars, ONLY if there's a clear grammar correction worth noting — otherwise write null]`;

  const messages = [];
  for (const turn of safeHistory) {
    if ((turn.role === "user" || turn.role === "assistant") && turn.content) {
      const content = sanitizeParam(String(turn.content), 400);
      if (content) messages.push({ role: turn.role, content });
    }
  }
  messages.push({ role: "user", content: safeMsg });

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
        max_tokens: 280,
        system: systemPrompt,
        messages,
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("dialogue.js: network error:", fetchErr.message);
    return err(502, "Service temporarily unavailable", origin);
  }

  if (!res.ok) {
    console.error("dialogue.js: Anthropic error", res.status);
    return err(502, "AI service error", origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) return err(502, "Empty response from AI", origin);

  const coachingMatch = raw.match(/\nCOACHING:\s*(.+)$/s);
  const coaching = (coachingMatch && coachingMatch[1].trim() !== "null")
    ? coachingMatch[1].trim().slice(0, 120)
    : null;
  const reply = raw.replace(/\nCOACHING:.*$/s, "").trim();

  return ok({ reply, coaching }, origin);
}
