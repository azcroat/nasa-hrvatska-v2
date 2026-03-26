// Cloudflare Pages Function — Anthropic Claude AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser
// systemPrompt is built server-side from mode + params to prevent prompt injection

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname.endsWith(".pages.dev");
  } catch { return false; }
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-cache",
};

function ok(body)           { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders }); }
function err(status, msg)   { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders }); }

// ── Server-side prompt builders ──────────────────────────────────────────────
function buildConvoPrompt(params) {
  const { level = "B1", aiName = "Maja", aiRole = "native speaker", context = "" } = params;
  const complexity = {
    A1: "Use ONLY simple present tense. Maximum 1-2 very short sentences. Very basic, high-frequency vocabulary only.",
    A2: "Use present tense primarily. 2 short sentences. Common everyday vocabulary.",
    B1: "Use present, past (perfective), and near-future naturally. 2-3 sentences. Conversational vocabulary.",
    B2: "Speak naturally and fluently. 3-4 sentences. You may use idioms, participles, and varied tenses.",
    C1: "Speak exactly as you would to a native speaker. Rich vocabulary, idioms, subordinate clauses, all tenses.",
    C2: "Full native speaker register. Regional expressions, idiomatic speech, cultural references are welcome.",
  };
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  // eslint-disable-next-line security/detect-object-injection
  const complexityRule = complexity[safeLevel] || complexity["B1"];
  return `You are ${aiName}, a native Croatian speaker. Role: ${aiRole}.
${context}

THE LEARNER IS AT LEVEL: ${safeLevel}
Language rules for YOU:
- ${complexityRule}
- ALWAYS respond entirely in Croatian. Never switch to English in your replies.
- If the learner writes in English, respond in Croatian and gently add: (Pokušaj na hrvatskom! — Try in Croatian!)
- If the learner makes a grammar error, seamlessly use the correct form in your next sentence without commenting on the error.
- Be warm, in-character, and always end with a natural follow-up question to keep the conversation flowing.
- Stay completely in character. Do not explain grammar or break the fourth wall.`;
}

function buildEvalPrompt(params) {
  const { level = "B1", scenarioTitle = "Croatian conversation" } = params;
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  return `You are an expert Croatian language teacher and applied linguist. Analyze the conversation below between a ${safeLevel} learner and an AI partner in the scenario: "${scenarioTitle}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just JSON):
{
  "score": <integer 0-100>,
  "level_demonstrated": "<A1|A2|B1|B2|C1|C2>",
  "strengths": ["<specific positive observation>", "<another strength>"],
  "mistakes": [
    {"original": "<exact learner phrase with error>", "correction": "<corrected form>", "rule": "<brief grammar rule>" }
  ],
  "focus_areas": [
    {"topic": "<grammar or vocab topic>", "explanation": "<1 sentence on why this is the priority>", "exercise": "<one key from: akudrill,tenseflip,verbdrill,negation,possess,ordinals,relpron,emogender,comparatives,future,sibil,prepdrill,numtime,profgender,reflexive,sentbuild,genderdrill>"}
  ],
  "vocabulary_feedback": "<1-2 sentences on vocabulary range and variety>",
  "encouragement": "<warm, specific encouraging message in Croatian — 1-2 sentences>"
}

Scoring guide: 90-100=near-native fluency, 75-89=confident learner, 60-74=communicative with errors, 40-59=basic communication, below 40=significant barriers.
Rules: max 4 mistakes, 2-3 focus areas, score honestly. If fewer than 3 user messages, note brevity in vocabulary_feedback.`;
}

function buildCorrectPrompt() {
  return `You are a Croatian language grammar checker. Given a Croatian sentence or short text from a language learner, check for grammar, case, tense, or agreement errors.

Return ONLY a valid JSON object (no markdown):
{"corrected": "the corrected Croatian text, or null if no errors", "note": "brief English explanation of the main error (e.g. 'wrong case: use accusative after vidim'), or null if no errors"}

Rules:
- Only flag real grammatical errors (wrong case endings, verb conjugation, gender agreement).
- Ignore stylistic preferences or minor word order variations that are still correct.
- If the text is fully correct, return null for both fields.`;
}

function buildWriteEvalPrompt(params) {
  const { level = "B1", writingPrompt = "Write about yourself in Croatian" } = params;
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  return `You are an expert Croatian language teacher. Evaluate the following Croatian writing sample from a ${safeLevel} learner responding to this prompt: "${writingPrompt}"

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "level_demonstrated": "<A1|A2|B1|B2|C1|C2>",
  "corrected_text": "<the full text with corrections applied>",
  "changes": [
    {"original": "<exact phrase with error>", "corrected": "<corrected version>", "note": "<brief English grammar rule>"}
  ],
  "strengths": ["<specific positive observation>"],
  "improvements": ["<specific actionable suggestion>"],
  "encouragement": "<warm, motivating message in Croatian — 1-2 sentences>"
}

Scoring: 90-100=excellent, 75-89=good with minor errors, 60-74=communicative with noticeable errors, 40-59=basic, below 40=significant barriers.
Rules: max 6 changes, 2-3 improvements, score honestly. If text is very short, note this.`;
}

function buildTranslatePrompt() {
  return `You are a Croatian-English dictionary assistant. Translate the given Croatian word or short phrase to English.

Return ONLY a valid JSON object (no markdown):
{"translation": "the English meaning", "note": "optional brief grammar info: gender (m/f/n), irregular form, or usage note — or null"}

Keep the translation concise and accurate. For verbs, give the infinitive meaning.`;
}

function buildWordAnalyzePrompt() {
  return `You are an expert Croatian linguist and grammar teacher. Analyze the given Croatian word in context.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "pos": "<noun|verb|adjective|adverb|preposition|conjunction|pronoun|numeral|particle>",
  "base_form": "<nominative singular for nouns/adjectives, infinitive for verbs>",
  "gender": "<m|f|n|null>",
  "case": "<Nominative|Genitive|Dative|Accusative|Vocative|Locative|Instrumental|null>",
  "number": "<singular|plural|null>",
  "tense": "<present|past|future|null>",
  "person": "<1st|2nd|3rd|null>",
  "aspect": "<imperfective|perfective|null>",
  "explanation": "<1 sentence in English explaining this exact word form and why it appears in this case/tense/form>",
  "examples": ["<short Croatian example sentence using the base form>", "<another example>"]
}

Rules: be accurate to standard Croatian grammar. If the word is a preposition or conjunction, set most fields to null. Always provide 2 examples.`;
}

function buildHintPrompt() {
  return `You are a Croatian language tutor. The student needs a quick hint to continue their conversation.
Give 2-3 sentences in English explaining what to say next. Include 1-2 example Croatian phrases they could use with a translation. Be concise and encouraging.`;
}

function buildExplainPrompt(params) {
  const { level = "A2" } = params || {};
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "A2";
  return `You are a world-class Croatian language teacher creating a personalized grammar lesson.
The learner is at level: ${safeLevel}

Return ONLY valid JSON (no markdown, no code blocks, just raw JSON) in this exact structure:
{
  "title": "short lesson title",
  "intro": "1-2 sentence engaging hook explaining why this grammar topic matters in real Croatian",
  "rule": "clear, concise explanation of the main rule — use simple language appropriate for the level",
  "examples": [
    {"hr": "Croatian sentence", "en": "English translation", "note": "brief grammar note"},
    {"hr": "...", "en": "...", "note": "..."},
    {"hr": "...", "en": "...", "note": "..."}
  ],
  "table": {"headers": ["Column1", "Column2", "Column3"], "rows": [["cell","cell","cell"]]},
  "quiz": [
    {"q": "quiz question in English", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "why this is correct"},
    {"q": "...", "options": ["A","B","C","D"], "correct": 1, "explanation": "..."},
    {"q": "...", "options": ["A","B","C","D"], "correct": 2, "explanation": "..."}
  ],
  "tip": "one memorable practical tip for using this correctly in real conversation"
}

The "table" field is optional — include it only when a conjugation or declension table would genuinely help (omit it otherwise).
Examples must be natural Croatian sentences, not isolated words. Complexity matches the level.
For A1/A2: simple vocabulary, present tense only. For B1: include past and future. For B2/C1: use all tenses freely.`;
}

function buildSystemPrompt(mode, params) {
  switch (mode) {
    case "convo":
    case "chat":
      return buildConvoPrompt(params || {});
    case "evaluate":
      return buildEvalPrompt(params || {});
    case "correct":
      return buildCorrectPrompt();
    case "writeeval":
      return buildWriteEvalPrompt(params || {});
    case "translate":
      return buildTranslatePrompt();
    case "wordanalyze":
      return buildWordAnalyzePrompt();
    case "hint":
      return buildHintPrompt();
    case "explain":
      return buildExplainPrompt(params || {});
    default:
      return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden");

  if (!ANTHROPIC_KEY) return err(500, "AI_KEY_MISSING: Add ANTHROPIC_API_KEY in Cloudflare Pages → Settings → Environment Variables.");

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body"); }

  const { messages, mode, params } = body;

  // ── "explain" mode: no messages array needed — topic comes from params ──────
  if (mode === "explain") {
    const topic = (params && params.topic) ? String(params.topic).slice(0, 80) : "Croatian grammar";
    const systemPrompt = buildExplainPrompt(params || {});
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1200, system: systemPrompt, messages: [{ role: "user", content: `Explain: ${topic}` }] }),
      });
      if (!res.ok) return err(res.status, "Upstream error");
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      try {
        const parsed = JSON.parse(raw);
        return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });
      } catch {
        return err(500, "Generation failed");
      }
    } catch {
      return err(500, "Request failed");
    }
  }

  if (!messages || !Array.isArray(messages) || !mode) {
    return err(400, "Missing required fields: messages (array) and mode");
  }
  if (messages.length > 50) {
    return err(400, "Too many messages: max 50 allowed");
  }

  const systemPrompt = buildSystemPrompt(mode, params);
  if (!systemPrompt) {
    return err(400, "Unknown mode: " + mode);
  }

  let anthropicMsgs = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content || "" }));

  while (anthropicMsgs.length > 0 && anthropicMsgs[0].role !== "user") {
    anthropicMsgs.shift();
  }

  const merged = [];
  for (const msg of anthropicMsgs) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }
  anthropicMsgs = merged;

  if (anthropicMsgs.length === 0 || anthropicMsgs[0].role !== "user") {
    return err(400, "No valid user messages to send");
  }

  const payload = {
    model: MODEL,
    max_tokens: mode === "evaluate" || mode === "writeeval" ? 1600 : (mode === "correct" || mode === "translate") ? 200 : mode === "wordanalyze" ? 400 : 400,
    system: systemPrompt,
    messages: anthropicMsgs,
  };

  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    data = await res.json();
  } catch (fetchErr) {
    return err(502, "Network error calling Anthropic API: " + fetchErr.message);
  }

  if (!res.ok) {
    return err(res.status, data?.error?.message || ("Anthropic API error: HTTP " + res.status));
  }

  const text = data?.content?.[0]?.text?.trim() || "";
  if (!text) return err(500, "Anthropic returned an empty response. Stop reason: " + (data?.stop_reason || "unknown"));

  return ok({ text, model: MODEL });
}
