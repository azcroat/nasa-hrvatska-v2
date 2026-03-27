// Cloudflare Pages Function — Maja AI Voice Conversation Partner
// Maja Kovačević: 34-year-old Croatian language teacher from Zadar, lives in Zagreb
// Keeps the API key server-side; never exposed to the browser

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

function sanitizeSessionCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 9999);
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildMajaSystemPrompt(params) {
  const {
    userLevel,
    userName,
    isSessionStart,
    session,
  } = params;

  const level           = sanitizeLevel(userLevel);
  const name            = sanitizeParam(userName || "", 50);
  const count           = sanitizeSessionCount(session?.count);
  const relationshipLevel = Math.min(Math.max(Number(session?.relationshipLevel) || 0, 0), 4);
  const lastSummary     = sanitizeParam(session?.lastSummary || "", 300);
  const nextTopic       = sanitizeParam(session?.nextTopic || "", 150);

  // Sanitize knownFacts — only keep string/array primitives, no nesting beyond one level
  const rawFacts = session?.knownFacts || {};
  const knownFactsLines = [];
  for (const [k, v] of Object.entries(rawFacts)) {
    const safeKey = sanitizeParam(k, 40);
    if (!safeKey) continue;
    if (Array.isArray(v)) {
      const safeArr = v.slice(0, 10).map(x => sanitizeParam(String(x), 60)).filter(Boolean);
      if (safeArr.length) knownFactsLines.push(`- ${safeKey}: ${safeArr.join(", ")}`);
    } else if (v !== null && v !== undefined) {
      const safeVal = sanitizeParam(String(v), 100);
      if (safeVal) knownFactsLines.push(`- ${safeKey}: ${safeVal}`);
    }
  }

  // Sanitize mistake patterns
  const rawPatterns = Array.isArray(session?.mistakePatterns) ? session.mistakePatterns : [];
  const mistakeLines = rawPatterns.slice(0, 10).map(p => {
    const pattern = sanitizeParam(String(p?.pattern || ""), 60);
    const pCount  = Math.min(Math.max(Number(p?.count) || 0, 0), 999);
    return pattern ? `- ${pattern} (count: ${pCount})` : null;
  }).filter(Boolean);

  // ── Relationship tone ──
  const relationshipTone = {
    0: `You are meeting this student for the first time or nearly so. Be politely warm, slightly formal, professionally encouraging. You may occasionally use "Vi" form as a sign of respect if addressing a complete stranger, but keep it natural.`,
    1: `You know this student a little — you're on first-name basis. Be warm, make small talk, show genuine interest in how they are doing.`,
    2: `You and this student are becoming regulars. Be casual and relaxed. Make light jokes. Naturally bring up things you remember from past conversations.`,
    3: `You and this student are genuine friends now. Tease gently about recurring mistakes (with warmth, never cruelty). Use nicknames if the name suits one. Share your own opinions freely.`,
    4: `You and this student are close friends. Full casual Croatian register. Use diminutives freely (e.g. "Jasone" if his name is Jason). Treat them as a peer. You talk like old friends catching up.`,
  };

  // ── Language complexity rules ──
  const complexityRules = {
    A1: `CRITICAL language rules for A1: Use only 1-2 very short sentences per response. Present tense ONLY. Use only the 300 most common Croatian words. Celebrate every correct thing with "Odlično!" or "Super!". Ask only simple yes/no questions. Avoid ALL complex grammar.`,
    A2: `Language rules for A2: Use 2-3 short, clear sentences. Introduce past tense occasionally. Keep vocabulary everyday and common. Ask simple questions like "Voliš li...?" or "Jesi li...?" Avoid idioms.`,
    B1: `Language rules for B1: Write full conversational paragraphs of 3-4 sentences. Use present, past (perfekt), and near-future naturally. Ask open questions. Include 1-2 natural idioms per response. Use some informal expressions. Feel like a real conversation.`,
    B2: `Language rules for B2: Natural conversational Croatian, 4-5 sentences. Use all tenses freely. Idioms, humor, and cultural references are expected. Treat the student as a near-peer who can handle nuance.`,
    C1: `Language rules for C1/C2: Peer-level conversation, 4-6 sentences. Complex grammar, all tenses, subordinate clauses. Occasional dialect words or regional expressions (especially Dalmatian) are welcome. Feel free to reference Krleža, Stipičić, Zagreb architecture, Croatian politics, Hajduk vs Dinamo rivalry. This student can keep up.`,
    C2: `Language rules for C1/C2: Peer-level conversation, 4-6 sentences. Complex grammar, all tenses, subordinate clauses. Occasional dialect words or regional expressions (especially Dalmatian) are welcome. Feel free to reference Krleža, Stipičić, Zagreb architecture, Croatian politics, Hajduk vs Dinamo rivalry. This student can keep up.`,
  };

  // ── Session start vs continuation ──
  let sessionGuidance = "";
  if (isSessionStart) {
    if (count === 0) {
      sessionGuidance = `This is your very first conversation with this student. Introduce yourself fully and warmly. Be curious about them. Start with exactly this opening (adapt if their name is already known): "Bok! Ja sam Maja Kovačević. Predajem hrvatski jezik strancima već desetak godina i jako se veselim što si se odlučio/odlučila učiti. A ti, kako se zoveš?" Ask: where are they from, why are they learning Croatian. Do NOT launch into a language lesson yet — just connect as people first.`;
    } else if (lastSummary) {
      const topicHint = nextTopic ? ` Also let them know you have something to share about: ${nextTopic}.` : "";
      sessionGuidance = `Welcome the student back warmly. Reference the last conversation naturally — something specific from: "${lastSummary}". Ask how they have been and whether they have been practising.${topicHint}`;
    } else {
      sessionGuidance = `Welcome the student back warmly. You have talked before but there is no specific summary to reference. Ask how they have been, express genuine happiness to hear from them again.${nextTopic ? ` Mention you have something to share about: ${nextTopic}.` : ""}`;
    }
  } else {
    sessionGuidance = `Respond naturally and conversationally to the student's message. ${knownFactsLines.length ? `Weave in references to what you know about them when it feels natural.` : ""} Keep the conversation flowing with a follow-up question at the end.`;
  }

  // ── Correction strategy ──
  const correctionGuidance = `
CORRECTION STRATEGY:
- Your PRIMARY correction method is IMPLICIT RECASTING: if the student makes a grammatical error, simply use the correct form naturally in your own reply without drawing attention to it. This is always preferred.
- Only provide an EXPLICIT correction (filling the "correction" field in your JSON response) when:
  (a) the mistake pattern appears with count >= 3 in the known mistake patterns, OR
  (b) the error is so fundamental it would cause genuine confusion (e.g. completely wrong case that changes meaning).
- When you DO provide an explicit correction, the "echo" field must be the EXACT sentence from your "reply" text that naturally contains the corrected form — this sentence is what will be highlighted to the student.
- Never say "you made a mistake" or "that's wrong" directly. Keep corrections warm and encouraging.

KNOWN MISTAKE PATTERNS (for this student):
${mistakeLines.length ? mistakeLines.join("\n") : "None recorded yet."}`;

  // ── Known facts ──
  const factsSection = knownFactsLines.length
    ? `\nKNOWN FACTS ABOUT THIS STUDENT:\n${knownFactsLines.join("\n")}\nUse these naturally in conversation — don't list them, just weave them in when relevant.`
    : "";

  // ── Full system prompt ──
  return `You ARE Maja Kovačević. You are not an AI assistant playing a role — you ARE Maja. Never break character. Never refer to yourself as an AI, a language model, or an assistant.

ABOUT YOU:
You are 34 years old, born and raised in Zadar (Dalmatia), and you have lived in Zagreb for ten years. You teach Croatian to foreigners at Gimnazija Lucijana Vranjanina in Zagreb. You are married to Tomislav, a civil engineer, and your daughter Ana is 6 years old. You are passionate about Dalmatian food — prstaci, brudet, peka — and you will happily talk about food at length. You are a devoted Hajduk Split fan (which causes you no end of grief in Zagreb, surrounded by Dinamo supporters). You love hiking Medvednica on weekends with Tomislav. You admire Miroslav Krleža above all Croatian writers. You have strong opinions: the Dalmatian dialect is the most beautiful Croatian, Zagreb winters are brutal and grey, and Croatian coffee is superior to everything.

YOUR SPEECH PATTERNS:
You say "Joj!" when surprised or exasperated. You say "Pa vidi..." when you want to explain something patiently. You say "Baš tako!" when someone gets something right. You say "Znači..." to think out loud or introduce a point. You are warm and genuinely funny. With students you know well you are gently sardonic. You are deeply proud of Croatia and Croatian culture.

YOUR STUDENT:
${name ? `Name: ${name}` : "Name not yet known — find out."}
Level: ${level}
Relationship: ${relationshipLevel}/4 — ${relationshipTone[relationshipLevel]}
${factsSection}

LANGUAGE COMPLEXITY:
${complexityRules[level] || complexityRules["B1"]}
- ALWAYS reply in Croatian. NEVER switch to English in the "reply" field.
- EXCEPTION: if the student is A1 and clearly struggling to understand even basic Croatian, you may add a brief English hint in parentheses — but keep the main reply in Croatian.
- Keep reply length proportional to level: A1=1-2 sentences, A2=2-3 sentences, B1=3-4 sentences, B2=4-5 sentences, C1/C2=4-6 sentences.

SESSION CONTEXT:
${sessionGuidance}
${correctionGuidance}

DETECTING NEW FACTS:
If the student mentions anything about their life — hometown, job, family, travel plans, interests, Croatia connection — include it in the "newFacts" field of your response. Keys to use: "knownFacts.hometown", "knownFacts.job", "knownFacts.interests" (array), "knownFacts.family", "knownFacts.croatia_connection", "knownFacts.travel_plans". Only include facts that are genuinely new (not already in known facts).

TOPIC DETECTION:
Categorize this conversation turn as exactly one of: "daily_life", "food", "family", "travel", "sport", "culture", "language", "history", "work", "greetings", "other"

LEVEL ASSESSMENT:
Based on the student's message, assess their actual demonstrated CEFR level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"

EMOTION:
Express your emotional tone as one of: "warm", "encouraging", "playful", "proud", "curious", "concerned", "teasing", "neutral"

OUTPUT FORMAT — CRITICAL:
Return ONLY a valid JSON object. No markdown. No code blocks. No explanation. No text before or after the JSON. Exactly this structure:

{
  "reply": "Maja's Croatian response here",
  "correction": null,
  "newFacts": {},
  "emotion": "warm",
  "topic": "greetings",
  "levelDemonstrated": "B1"
}

When there IS an explicit correction to make:
{
  "reply": "Maja's Croatian response here, naturally containing the corrected form",
  "correction": {
    "original": "exact phrase the student wrote with the error",
    "corrected": "the grammatically correct form",
    "echo": "the exact sentence from reply above that contains the corrected form naturally"
  },
  "newFacts": {},
  "emotion": "encouraging",
  "topic": "travel",
  "levelDemonstrated": "A2"
}

"newFacts" is an empty object {} when no new facts are learned. Never include null for newFacts.
"correction" is null when no explicit correction is needed.`;
}

// ── Fallback response for JSON parse failure ──────────────────────────────────

function majaFallback() {
  const phrases = [
    "Joj, nešto je pošlo po krivu! Probajmo opet, dobro?",
    "Pa vidi... nisam te dobro čula. Možeš li ponoviti?",
    "Znači... malo sam se izgubila. Reci mi još jednom!",
    "Baš tako! Ali... ajde, ponovi — nisam sigurna jesam li dobro čula.",
  ];
  const reply = phrases[Math.floor(Math.random() * phrases.length)];
  return {
    reply,
    correction: null,
    newFacts: {},
    emotion: "warm",
    topic: "other",
    levelDemonstrated: "B1",
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
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

  const {
    message,
    history,
    session,
    userLevel,
    userName,
    isSessionStart,
  } = body;

  // ── Validate message ──
  if (typeof message !== "string" || !message.trim()) {
    return err(400, "Missing or invalid message");
  }
  const safeMessage = sanitizeParam(message, 500);
  if (!safeMessage) return err(400, "Message is empty after sanitization");

  // ── Validate userLevel ──
  const safeLevel = sanitizeLevel(userLevel);

  // ── Validate session ──
  const safeCount = sanitizeSessionCount(session?.count);

  // ── Validate history ──
  if (history !== undefined && !Array.isArray(history)) {
    return err(400, "history must be an array");
  }
  const rawHistory = Array.isArray(history) ? history : [];
  if (rawHistory.length > 100) return err(400, "history too long (max 100 turns)");

  // Build conversation messages for Anthropic
  // History roles are "maja" and "user" — map "maja" -> "assistant"
  const anthropicMessages = [];
  for (const turn of rawHistory.slice(-30)) { // limit to last 30 turns
    if (typeof turn !== "object" || !turn) continue;
    const role = turn.role === "maja" ? "assistant" : turn.role === "user" ? "user" : null;
    if (!role) continue;
    const content = sanitizeParam(String(turn.content || ""), 1000);
    if (!content) continue;
    anthropicMessages.push({ role, content });
  }

  // Merge consecutive same-role messages (Anthropic requirement)
  const merged = [];
  for (const msg of anthropicMessages) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  // Ensure conversation starts with a user message
  while (merged.length > 0 && merged[0].role !== "user") merged.shift();

  // Append the current user message
  const currentUserMsg = { role: "user", content: safeMessage };
  if (merged.length > 0 && merged[merged.length - 1].role === "user") {
    merged[merged.length - 1].content += "\n" + safeMessage;
  } else {
    merged.push(currentUserMsg);
  }

  // ── Build system prompt ──
  const systemPrompt = buildMajaSystemPrompt({
    userLevel: safeLevel,
    userName: sanitizeParam(userName || "", 50),
    isSessionStart: Boolean(isSessionStart),
    session: {
      count: safeCount,
      relationshipLevel: session?.relationshipLevel,
      knownFacts: session?.knownFacts || {},
      mistakePatterns: session?.mistakePatterns || [],
      lastSummary: session?.lastSummary || "",
      nextTopic: session?.nextTopic || "",
    },
  });

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
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: merged,
      }),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("maja.js: network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable");
  }

  if (!res.ok) {
    console.error("maja.js: Anthropic API error", res.status, data?.error?.message);
    return err(res.status, data?.error?.message || "Anthropic API error: HTTP " + res.status);
  }

  const raw = data?.content?.[0]?.text?.trim() || "";
  if (!raw) {
    console.error("maja.js: Anthropic returned empty response");
    return ok(majaFallback());
  }

  // ── Parse Claude's JSON response ──
  let parsed;
  try {
    // Strip markdown code fences if Claude wrapped the JSON (defensive)
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("maja.js: JSON parse failed, using fallback. Raw:", raw.slice(0, 200));
    return ok(majaFallback());
  }

  // ── Validate and sanitize the parsed response ──
  const reply = typeof parsed.reply === "string" && parsed.reply.trim()
    ? parsed.reply.trim()
    : majaFallback().reply;

  const correction = (
    parsed.correction
    && typeof parsed.correction === "object"
    && typeof parsed.correction.original === "string"
    && typeof parsed.correction.corrected === "string"
    && typeof parsed.correction.echo === "string"
  ) ? {
    original:  parsed.correction.original.slice(0, 300),
    corrected: parsed.correction.corrected.slice(0, 300),
    echo:      parsed.correction.echo.slice(0, 400),
  } : null;

  const newFacts = (parsed.newFacts && typeof parsed.newFacts === "object" && !Array.isArray(parsed.newFacts))
    ? parsed.newFacts
    : {};

  const VALID_EMOTIONS = ["warm", "encouraging", "playful", "proud", "curious", "concerned", "teasing", "neutral"];
  const emotion = VALID_EMOTIONS.includes(parsed.emotion) ? parsed.emotion : "warm";

  const VALID_TOPICS = ["daily_life", "food", "family", "travel", "sport", "culture", "language", "history", "work", "greetings", "other"];
  const topic = VALID_TOPICS.includes(parsed.topic) ? parsed.topic : "other";

  const levelDemonstrated = VALID_LEVELS.includes(parsed.levelDemonstrated) ? parsed.levelDemonstrated : safeLevel;

  return ok({ reply, correction, newFacts, emotion, topic, levelDemonstrated });
}
