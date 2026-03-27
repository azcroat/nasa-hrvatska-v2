// Cloudflare Pages Function — Anthropic Claude AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser
// systemPrompt is built server-side from mode + params to prevent prompt injection

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ── Security: sanitize user-supplied prompt parameters ────────────────────────
function sanitizeParam(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  // Remove characters that could be used for prompt injection
  return String(value)
    .replace(/[\r\n]/g, ' ')          // newline injection
    .replace(/[`\\]/g, '')            // backtick/backslash injection
    .replace(/\bignore\b.*\binstruction/gi, '') // crude prompt injection attempt filter
    .trim()
    .slice(0, maxLen);
}

function sanitizeLevel(level) {
  const VALID = ['A1','A2','B1','B2','C1','C2'];
  return VALID.includes(level) ? level : 'B1';
}

function sanitizeCategory(cat) {
  const VALID = ['greeting','work','travel','food','slang','love','sports','family'];
  return VALID.includes(cat) ? cat : 'greeting';
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

function ok(body)           { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders }); }
function err(status, msg)   { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders }); }

// ── Server-side prompt builders ──────────────────────────────────────────────
function buildConvoPrompt(params) {
  const rawLevel = params?.level; const rawName = params?.aiName; const rawRole = params?.aiRole; const rawCtx = params?.context;
  const level = sanitizeLevel(rawLevel);
  const aiName = sanitizeParam(rawName || "Maja", 50);
  const aiRole = sanitizeParam(rawRole || "native speaker", 80);
  const context = sanitizeParam(rawCtx || "", 300);
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
  const level = sanitizeLevel(params?.level);
  const scenarioTitle = sanitizeParam(params?.scenarioTitle || "Croatian conversation", 100);
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

function buildStoryPrompt(params) {
  const city = sanitizeParam(params?.city || "Zagreb", 50);
  const region = sanitizeParam(params?.region || "Croatia", 50);
  const level = sanitizeLevel(params?.level);
  const character_name = sanitizeParam(params?.character_name || "Marko", 40);
  const goal_theme = params?.goal_theme ? sanitizeParam(params.goal_theme, 120) : null;
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  const complexity = {
    A1: "Use ONLY present tense, very short sentences (max 8 words each), and the 200 most common Croatian words. Every 3rd sentence should have an English hint in parentheses.",
    A2: "Use mostly present tense with occasional simple past. Short clear sentences. Common everyday vocabulary. Add English hints for any uncommon words.",
    B1: "Use present and past tense naturally. Conversational vocabulary. Include some cultural details. No English hints needed — context makes meaning clear.",
    B2: "Write like a skilled author for a native Croatian teen. All tenses, idioms welcome. Rich descriptive language. Cultural depth.",
    C1: "Write literary Croatian. Complex sentences, subordinate clauses, all tenses, idiomatic expressions. Rich and authentic.",
    C2: "Write like a published Croatian author. Use regional color, colloquialisms, literary devices. Completely authentic native-level Croatian.",
  };
  // eslint-disable-next-line security/detect-object-injection
  const complexityRule = complexity[safeLevel] || complexity["B1"];
  const goalLine = goal_theme
    ? `\nPersonalization theme: The story should weave in themes of ${goal_theme}. Let this shape the plot, setting details, and emotional arc naturally.`
    : "";
  return `You are a master Croatian storyteller creating an immersive language learning experience.

Write a vivid, emotionally engaging short story (350-450 words) set in ${city}, ${region}, Croatia.
The main character's name is ${character_name}.
The story should feel authentic to life in ${city} — mention real local details, food, architecture, customs where natural.${goalLine}

CEFR Level: ${safeLevel}
Language rules: ${complexityRule}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "story title in Croatian",
  "title_en": "English translation of title",
  "story": "the full Croatian story text",
  "vocabulary": [
    {"hr": "word/phrase", "en": "English meaning", "note": "grammar note or usage tip (optional)"}
  ],
  "comprehension_questions": [
    {"hr": "question in Croatian", "en": "English translation", "hint": "brief answer hint"}
  ],
  "cultural_note": "1-2 sentences about a real cultural detail from the story"
}

Include 8-12 vocabulary items (the most useful/interesting words from the story).
Include 3 comprehension questions.
The story must feel like literature, not a language exercise — engaging plot, real emotion, authentic Croatian life.`;
}

function buildHeritagePrompt(params) {
  const region = sanitizeParam(params?.region || "Croatia", 50);
  const family_notes = sanitizeParam(params?.family_notes || "", 400);
  const user_name = sanitizeParam(params?.user_name || "you", 50);
  const ancestor_era = sanitizeParam(params?.ancestor_era || "early 20th century", 80);
  return `You are a Croatian cultural historian and storyteller. Create a deeply personal, emotionally resonant narrative connecting someone to their Croatian roots.

User name: ${user_name}
Their Croatian connection: ${region}
Family notes they provided: ${family_notes || "No specific details provided"}
Historical era: ${ancestor_era}

Write a 3-part narrative (400-500 words total):
1. "Your Land" — Paint a vivid picture of what ${region} looked, smelled, sounded like in the ${ancestor_era}. Specific, sensory, authentic.
2. "Their Lives" — Describe the daily life of ordinary people from ${region} in that era. Work, food, festivals, language, hardships.
3. "Your Connection" — Bridge the history to ${user_name} personally. What phrases would their ancestors have used? What does it mean to carry this heritage?

Return ONLY valid JSON (no markdown):
{
  "title": "personalized title for ${user_name}",
  "parts": [
    {"heading": "Your Land", "text": "..."},
    {"heading": "Their Lives", "text": "..."},
    {"heading": "Your Connection", "text": "..."}
  ],
  "ancestral_phrases": [
    {"hr": "phrase they would have used", "en": "English meaning", "context": "when/why they'd say this"}
  ],
  "regional_words": [
    {"hr": "regional word/dialect term", "en": "meaning", "note": "why this word is special to this region"}
  ],
  "did_you_know": "one surprising historical fact about ${region} that most people don't know"
}

Include 4-5 ancestral phrases and 3-4 regional words.
The tone must be warm, poetic, and personal — this should move someone to tears.`;
}

function buildPhraseOfDayPrompt(params) {
  const category = sanitizeCategory(params?.category);
  const level = sanitizeLevel(params?.level);
  const seed = sanitizeParam(params?.seed || "", 20);
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  const categoryDesc = {
    greeting: "everyday Croatian greetings and farewells — include some that are uniquely Croatian or regional",
    work: "professional Croatian — office, business, career phrases",
    travel: "Croatian travel phrases — transport, hotels, asking directions, emergencies",
    food: "Croatian food culture — ordering, complimenting food, market shopping, restaurant phrases",
    slang: "authentic Croatian slang and colloquialisms — what young Croatians actually say today",
    love: "Croatian expressions of affection, friendship, and relationships",
    sports: "Croatian sports culture — football, basketball, cheering, sports talk",
    family: "Croatian family vocabulary and expressions — terms of endearment, family dynamics",
  };
  // eslint-disable-next-line security/detect-object-injection
  const catDesc = categoryDesc[category] || categoryDesc["greeting"];

  return `You are a Croatian language and culture expert creating a "Phrase of the Day" for a learner at CEFR level ${safeLevel}.

Category: ${catDesc}
Seed for variety: ${seed}

Choose ONE memorable, genuinely useful Croatian phrase. Prioritize phrases that:
- Are actually used by native Croatians (not textbook Croatian)
- Have interesting cultural context
- Are level-appropriate: ${safeLevel}
- Would surprise or delight a learner

Return ONLY valid JSON (no markdown):
{
  "phrase": "the Croatian phrase",
  "translation": "natural English equivalent (not word-for-word)",
  "literal": "word-for-word translation if different from natural translation",
  "pronunciation_guide": "syllable-by-syllable pronunciation guide: e.g. 'do-BAR DAN'",
  "level": "${safeLevel}",
  "category": "${category}",
  "when_to_use": "1 sentence: specific situation when you'd use this",
  "cultural_note": "1-2 sentences of cultural context that makes this phrase come alive",
  "example_dialogue": [
    {"speaker": "Person A", "hr": "Croatian line", "en": "English"},
    {"speaker": "Person B", "hr": "Croatian response using the phrase", "en": "English"}
  ],
  "word_breakdown": [
    {"word": "each word", "meaning": "meaning", "grammar": "brief grammar note"}
  ],
  "related_phrases": [
    {"hr": "related phrase", "en": "meaning"}
  ]
}

Include 2-3 related phrases. The cultural note must be genuinely interesting, not generic.`;
}

function buildAdaptiveConvoPrompt(params) {
  const level = sanitizeLevel(params?.level);
  const aiName = sanitizeParam(params?.aiName || "Maja", 50);
  const aiRole = sanitizeParam(params?.aiRole || "native speaker", 80);
  const context = sanitizeParam(params?.context || "", 300);
  const weak_areas = Array.isArray(params?.weak_areas)
    ? params.weak_areas.slice(0, 5).map(a => sanitizeParam(String(a), 50))
    : [];
  const topics_mastered = Array.isArray(params?.topics_mastered)
    ? params.topics_mastered.slice(0, 10).map(t => sanitizeParam(String(t), 50))
    : [];
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  const complexity = {
    A1: "Use ONLY simple present tense. Maximum 1-2 very short sentences. Very basic vocabulary only.",
    A2: "Use present tense primarily. 2 short sentences. Common everyday vocabulary.",
    B1: "Use present, past (perfective), and near-future naturally. 2-3 sentences. Conversational vocabulary.",
    B2: "Speak naturally and fluently. 3-4 sentences. You may use idioms, participles, and varied tenses.",
    C1: "Speak exactly as you would to a native speaker. Rich vocabulary, idioms, subordinate clauses, all tenses.",
    C2: "Full native speaker register. Regional expressions, idiomatic speech, cultural references are welcome.",
  };
  // eslint-disable-next-line security/detect-object-injection
  const complexityRule = complexity[safeLevel] || complexity["B1"];

  const weakAreasText = weak_areas.length > 0
    ? `\nThe learner struggles with: ${weak_areas.join(", ")}. Naturally weave opportunities to practice these into the conversation — e.g. ask questions that require them to use dative case, or construct sentences that invite past tense responses. Never comment on their grammar; just model correct usage in your own speech.`
    : "";

  const masteredText = topics_mastered.length > 0
    ? `\nThe learner has mastered: ${topics_mastered.slice(0, 5).join(", ")}. You can use these confidently in your speech.`
    : "";

  return `You are ${aiName}, a native Croatian speaker. Role: ${aiRole}.
${context}

THE LEARNER IS AT LEVEL: ${safeLevel}
Language rules for YOU:
- ${complexityRule}
- ALWAYS respond entirely in Croatian. Never switch to English in your replies.
- If the learner writes in English, respond in Croatian and gently add: (Pokušaj na hrvatskom! — Try in Croatian!)
- If the learner makes a grammar error, seamlessly use the correct form in your next sentence without commenting.
- Be warm, in-character, and always end with a natural follow-up question to keep conversation flowing.
- Stay completely in character. Do not explain grammar or break the fourth wall.${weakAreasText}${masteredText}`;
}

function buildNewsSimplifyPrompt(params) {
  const level = sanitizeLevel(params?.level);
  const title = sanitizeParam(params?.title || "", 200);
  const original = sanitizeParam(params?.original || "", 1000);
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  const complexity = {
    A1: "Use ONLY the 500 most common Croatian words. Maximum 8 words per sentence. Present tense only. No subordinate clauses.",
    A2: "Simple vocabulary (top 1000 Croatian words). Short sentences (max 12 words). Present tense mostly. One subordinate clause max.",
    B1: "Conversational Croatian. 15-word sentences max. All tenses allowed. Some compound sentences. Common idioms OK.",
    B2: "Natural Croatian. Full complexity of the original, but simplify any bureaucratic or highly technical language.",
    C1: "Keep close to original Croatian. Simplify only jargon or highly specialized terms.",
  };
  // eslint-disable-next-line security/detect-object-injection
  const complexityRule = complexity[safeLevel] || complexity["B1"];

  return `You are a Croatian language teacher simplifying a news article for a language learner at CEFR level ${safeLevel}.

Original article title: ${title}
Original text: ${original}

Simplification rules: ${complexityRule}

Return ONLY valid JSON (no markdown):
{
  "simplified_title": "simplified Croatian title",
  "simplified_title_en": "English translation",
  "simplified_text": "the simplified Croatian article (150-250 words)",
  "simplified_text_en": "English translation of your simplified version",
  "key_vocabulary": [
    {"hr": "important word from article", "en": "meaning", "note": "usage note if helpful"}
  ],
  "summary_one_sentence": {"hr": "one Croatian sentence summarizing the story", "en": "English"}
}

Include 6-8 key vocabulary items. Keep the simplified text accurate to the original facts.`;
}

function buildPostcardCoachPrompt(params) {
  const city = sanitizeParam(params?.city || "Croatia", 50);
  const level = sanitizeLevel(params?.level);
  const user_name = sanitizeParam(params?.user_name || "", 50);
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  return `You are a warm, encouraging Croatian language teacher helping a student write a postcard from ${city}.
The student is at CEFR level ${safeLevel}.${user_name ? ` Their name is ${user_name}.` : ""}

Evaluate their Croatian postcard message and provide corrections.

Return ONLY valid JSON (no markdown):
{
  "score": <integer 0-100>,
  "corrected_text": "the fully corrected Croatian postcard message",
  "changes": [
    {"original": "exact phrase with error", "corrected": "corrected version", "note": "brief English grammar explanation"}
  ],
  "tone_feedback": "1 sentence: is it appropriately warm/casual for a postcard?",
  "local_touch": "1 sentence: a suggestion to make it feel more authentically Croatian (cultural detail, local expression)",
  "encouragement": "warm, personal encouragement in Croatian (use their name if provided)",
  "alternative_closing": "a beautiful Croatian postcard closing phrase they could use",
  "scene_description": "2-3 sentence vivid description of ${city} to use as image prompt for AI art generation: golden hour light, specific architectural details, atmosphere"
}

Max 5 changes. Be encouraging — postcard writing is joyful!`;
}

function buildSystemPrompt(mode, params) {
  switch (mode) {
    case "convo":
    case "chat":
      return buildConvoPrompt(params || {});
    case "adaptive_convo":
      return buildAdaptiveConvoPrompt(params || {});
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
    case "story":
      return buildStoryPrompt(params || {});
    case "heritage":
      return buildHeritagePrompt(params || {});
    case "phrase_of_day":
      return buildPhraseOfDayPrompt(params || {});
    case "news_simplify":
      return buildNewsSimplifyPrompt(params || {});
    case "postcard":
      return buildPostcardCoachPrompt(params || {});
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

  if (!ANTHROPIC_KEY) return err(500, "Service not configured");

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, "Invalid content type");

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body"); }

  const { messages, mode, params } = body;

  // ── Input type validation ────────────────────────────────────────────────────
  if (typeof mode !== 'string' || mode.length > 30) return err(400, "Invalid request");
  if (params !== undefined && (typeof params !== 'object' || Array.isArray(params))) {
    return err(400, "Invalid request");
  }
  if (messages !== undefined && !Array.isArray(messages)) return err(400, "Invalid request");
  if (Array.isArray(messages)) {
    if (messages.length > 50) return err(400, "Too many messages");
    for (const msg of messages) {
      if (typeof msg !== 'object' || !msg) return err(400, "Invalid message format");
      if (!['user','assistant'].includes(msg.role)) return err(400, "Invalid message role");
      if (typeof msg.content !== 'string') return err(400, "Invalid message content");
      if (msg.content.length > 4000) return err(400, "Message too long");
    }
  }

  // ── "explain" mode: no messages array needed — topic comes from params ──────
  if (mode === "explain") {
    const topic = sanitizeParam(params?.topic || "Croatian grammar", 80);
    const systemPrompt = buildExplainPrompt(params || {});
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        signal: AbortSignal.timeout(28000),
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

  // ── Single-prompt modes (no conversation history needed) ──────────────────
  const SINGLE_PROMPT_MODES = ["story", "heritage", "phrase_of_day", "news_simplify", "postcard"];
  if (SINGLE_PROMPT_MODES.includes(mode)) {
    const systemPrompt = buildSystemPrompt(mode, params);
    if (!systemPrompt) return err(400, "Unknown mode: " + mode);
    const userContent = (messages && messages[0]?.content) ? String(messages[0].content).slice(0, 2000) : "Generate content";
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        signal: AbortSignal.timeout(28000),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: (mode === "story" || mode === "heritage") ? 2000 : 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (!res.ok) return err(res.status, "Upstream error");
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      // Try to return parsed JSON for these structured modes
      try {
        const parsed = JSON.parse(raw);
        return new Response(JSON.stringify({ ...parsed, _raw: raw, model: MODEL }), { status: 200, headers: corsHeaders });
      } catch {
        return ok({ text: raw, model: MODEL });
      }
    } catch (fetchErr) {
      console.error("Network error calling Anthropic:", fetchErr.message);
      return err(502, "Service temporarily unavailable");
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
    max_tokens: (mode === "evaluate" || mode === "writeeval" || mode === "story" || mode === "heritage") ? 2000 : (mode === "phrase_of_day" || mode === "postcard" || mode === "news_simplify") ? 1000 : (mode === "correct" || mode === "translate") ? 200 : mode === "wordanalyze" ? 400 : 500,
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
      signal: AbortSignal.timeout(28000),
      body: JSON.stringify(payload),
    });
    data = await res.json();
  } catch (fetchErr) {
    console.error("Network error calling Anthropic:", fetchErr.message);
    return err(502, "Service temporarily unavailable");
  }

  if (!res.ok) {
    return err(res.status, data?.error?.message || ("Anthropic API error: HTTP " + res.status));
  }

  const text = data?.content?.[0]?.text?.trim() || "";
  if (!text) {
    console.error("Anthropic empty response, stop_reason:", data?.stop_reason);
    return err(500, "AI service returned an empty response");
  }

  return ok({ text, model: MODEL });
}
