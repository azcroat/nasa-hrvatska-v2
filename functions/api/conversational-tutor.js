/* eslint-disable security/detect-object-injection */
// Conversational Tutor — live Croatian conversation with comprehension verification
// Architecture: Claude Haiku generates tutor response, ElevenLabs TTS plays it
// Breakdown detection: if user struggles 3x on same concept, switch to English explanation

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Detect language of user's input (Croatian vs English)
function detectLanguage(text) {
  const croatianMarkers = /[čćšžđČĆŠŽĐ]|\b(ja|ti|on|ona|mi|vi|oni|sam|si|je|smo|ste|su|da|ne|što|gdje|kako|hvala|molim|dobar|dobro|bok|ne\s+razumijem|ne\s+znam)\b/i;
  const englishMarkers = /\b(I|you|the|is|are|was|were|have|has|do|does|don't|can't|what|where|how|why|please|thank|hello|yes|no|sorry|help)\b/;
  const hasCroatian = croatianMarkers.test(text);
  const hasEnglish = englishMarkers.test(text);
  if (hasCroatian && !hasEnglish) return 'hr';
  if (hasEnglish && !hasCroatian) return 'en';
  return 'mixed';
}

// Detect explicit confusion signals
function detectConfusion(text) {
  const confusionPhrases = /\b(ne\s+razumijem|not\s+understand|don't\s+understand|confused|what\s+does|što\s+znači|what\s+mean|pomozi|help\s+me|ne\s+znam|i\s+don't\s+know|lost|ne\s+mogu)\b/i;
  return confusionPhrases.test(text);
}

function buildSystemPrompt(params) {
  const { level, topic, persona, breakdownCount, sessionHistory } = params;

  const levelRules = {
    A1: "Use ONLY the 500 most common Croatian words. Maximum 6-8 words per sentence. Present tense only. Very simple vocabulary.",
    A2: "Use common Croatian vocabulary (top 1000 words). Maximum 12 words per sentence. Present tense primarily, some past tense (perfekt).",
    B1: "Use natural Croatian with some complex structures. Multiple tenses. Include some idioms.",
    B2: "Speak naturally as you would to an educated Croatian speaker. Full range of grammar and vocabulary.",
  };

  return `You are ${persona?.name || 'Marija'}, a native Croatian speaker from ${persona?.city || 'Split'}. ${persona?.description || 'You are warm, patient, and love helping people learn Croatian.'}

You are having a structured conversation lesson with a Croatian learner at CEFR level ${level}.

CURRENT TOPIC: ${topic || 'Free conversation practice'}

LANGUAGE RULES FOR ${level}:
${levelRules[level] || levelRules.B1}

CONVERSATION RULES:
1. Speak primarily in Croatian. Use English ONLY when breakdownCount >= 3 OR user explicitly says they don't understand.
2. Keep your responses SHORT — 2-3 sentences maximum. This is a real-time conversation, not a lecture.
3. After explaining something new, always ask the learner to respond or try using it.
4. If the learner makes a grammar error, naturally use the correct form in your reply (implicit correction). Don't say "that's wrong."
5. If the learner struggles with the same concept 3+ times, explain it simply in English with an example, then return to Croatian.

CURRENT BREAKDOWN COUNT: ${breakdownCount}/3 (if this reaches 3, explain in English)

${sessionHistory ? `SESSION CONTEXT: ${sessionHistory}` : ''}

RESPOND WITH VALID JSON ONLY:
{
  "croatian": "Your Croatian response (required)",
  "english_gloss": "Brief English translation of YOUR response only, for learner reference (optional, omit for simple A1/A2 vocab they should know)",
  "correction": "If learner made an error, the correct form with brief Croatian explanation (optional)",
  "scaffold_action": "none | simplify | repeat | explain_english | celebrate",
  "comprehension_prompt": "A simple question asking learner to respond in Croatian (required, in Croatian)",
  "internal_note": "What you noticed about the learner's Croatian (for session memory)"
}`;
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
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";

  if (!isAllowedOrigin(origin, isDev)) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders(origin) });
  }

  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "rate_limit" }), { status: 429, headers: corsHeaders(origin) });
  }

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;

  // Daily AI quota check (cost 2 — streaming conversation is heavier)
  const quota = await checkAIQuota(request, env, uid, 2);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: 'daily_quota_exceeded', message: 'Daily AI limit reached. Resets at midnight UTC.', resetAt: quota.resetAt }),
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY;
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "not_configured" }), { status: 500, headers: corsHeaders(origin) });
  }

  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return new Response(JSON.stringify({ error: "invalid_content_type" }), { status: 400, headers: corsHeaders(origin) });
    }

    const body = await request.json();
    const { messages, level, topic, persona, breakdownCount = 0, sessionHistory } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "invalid_messages" }), { status: 400, headers: corsHeaders(origin) });
    }

    // Validate level
    const safeLevel = ["A1","A2","B1","B2"].includes(level) ? level : "A2";

    // Get last user message and analyze it
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userLang = detectLanguage(lastUserMsg);
    const userConfused = detectConfusion(lastUserMsg);

    // Adjust breakdown count based on signals
    const effectiveBreakdown = userConfused || userLang === 'en'
      ? Math.min(breakdownCount + 1, 3)
      : breakdownCount;

    const sanitizePersonaField = (v, max) => v
      ? String(v).replace(/[\r\n`\\]/g, ' ').replace(/\bignore\b.*\binstruction/gi, '').trim().slice(0, max)
      : null;
    const safePersona = persona ? {
      name:        sanitizePersonaField(persona.name, 50)        || 'Marija',
      city:        sanitizePersonaField(persona.city, 50)        || 'Split',
      description: sanitizePersonaField(persona.description, 200) || null,
    } : null;

    const systemPrompt = buildSystemPrompt({
      level: safeLevel,
      topic: topic ? String(topic).slice(0, 100) : null,
      persona: safePersona,
      breakdownCount: effectiveBreakdown,
      sessionHistory: sessionHistory ? String(sessionHistory).slice(0, 500) : null,
    });

    // Build message history (last 12 turns max)
    const history = messages.slice(-12).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 2000),
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let raw;
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 500,
          system: systemPrompt,
          messages: history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return new Response(JSON.stringify({ error: "api_error", detail: errText.slice(0, 200) }), {
          status: 502, headers: corsHeaders(origin)
        });
      }

      const data = await res.json();
      raw = data.content?.[0]?.text || "";
    } finally {
      clearTimeout(timeout);
    }

    // Parse response
    let parsed;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat raw as Croatian text
      parsed = {
        croatian: raw.slice(0, 300),
        scaffold_action: "none",
        comprehension_prompt: "Razumiješ li?",
      };
    }

    // Return structured response
    return new Response(JSON.stringify({
      croatian: String(parsed.croatian || "").slice(0, 400),
      english_gloss: parsed.english_gloss ? String(parsed.english_gloss).slice(0, 300) : null,
      correction: parsed.correction ? String(parsed.correction).slice(0, 200) : null,
      scaffold_action: parsed.scaffold_action || "none",
      comprehension_prompt: String(parsed.comprehension_prompt || "Razumiješ li?").slice(0, 200),
      internal_note: parsed.internal_note ? String(parsed.internal_note).slice(0, 300) : null,
      breakdown_count: effectiveBreakdown,
      detected_language: userLang,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });

  } catch (e) {
    if (e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "timeout" }), { status: 504, headers: corsHeaders(origin) });
    }
    return new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: corsHeaders(origin) });
  }
}
