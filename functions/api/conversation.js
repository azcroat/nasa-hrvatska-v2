/* eslint-disable security/detect-object-injection */
// Cloudflare Pages Function — Live Croatian Conversation Partner (Streaming)
// Endpoint: POST /api/conversation
//
// Purpose: Powers the live voice conversation feature — user speaks (Web Speech API STT),
// this endpoint generates Maja's Croatian response with scaffolding metadata,
// then the client pipes it to ElevenLabs TTS for playback.
//
// Architecture:
//   Browser (Web Speech API STT)
//     → POST /api/conversation  (this file, streams SSE)
//     → Claude claude-sonnet-4-6 (streaming)
//     → Browser parses first complete JSON chunk
//     → Browser POSTs croatian text → /api/tts  (ElevenLabs)
//     → Browser plays audio
//
// Response: Server-Sent Events stream. Each chunk is a JSON line ending in "\n\n".
// Final event: { done: true, ...fullResponseObject }

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ── Per-session limits ─────────────────────────────────────────────────────────
// Conversation turns are expensive (streaming + TTS per turn).
// Level-based caps: A1 learners fatigue faster; B2+ can sustain longer sessions.
// These are enforced via the client sending turnCount; server validates hard max.
const MAX_TURNS_BY_LEVEL = { A1: 8, A2: 10, B1: 15, B2: 20, C1: 25, C2: 25 };
const MAX_TURNS_PER_SESSION = 10; // fallback if level unknown
const SESSION_RATE_LIMIT_PER_MINUTE = 4; // ~3 sessions/hour = 1 every 20 min, 4/min is generous

// ── Security helpers ───────────────────────────────────────────────────────────

function sanitizeParam(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\x00-\x1F\x7F]/g, ' ')  // eslint-disable-line no-control-regex -- strip control characters
    .replace(/[`\\]/g, '')
    // Broad injection phrase patterns — catch variants with spacing, punctuation, unicode tricks
    .replace(/ign[o0]re\b.{0,80}(instruct|prompt|system|above|previous|prior)/gi, '')
    .replace(/\b(system prompt|jailbreak|disregard|forget (all|your|previous)|new (role|persona|instruction))/gi, '')
    .replace(/\bact as\b.{0,40}\b(ai|gpt|claude|llm|model|assistant)\b/gi, '')
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
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const VALID_LEVELS = ["A1", "A2", "B1", "B2"];
const VALID_TOPICS = [
  "free",
  "introductions",
  "daily_life",
  "food",
  "family",
  "travel",
  "sport",
  "culture",
  "at_the_market",
  "at_the_cafe",
  "directions",
  "work",
  "weather",
];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : "A2";
}

function sanitizeTopic(topic) {
  return VALID_TOPICS.includes(topic) ? topic : "free";
}

function sanitizeTurnCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(Math.floor(num), MAX_TURNS_PER_SESSION + 10); // allow slight over for validation msg
}

// ── Ability estimator ─────────────────────────────────────────────────────────
// Analyzes sanitized conversation history to detect whether the learner is
// performing above or below their stated level. Called after sanitization so
// the messages array uses the same capped/cleaned content that Claude sees.

function estimateAbility(messages) {
  if (!messages || messages.length < 2) return null;
  const userMessages = messages.filter(m => m.role === 'user' && m.content?.length > 3);
  if (userMessages.length < 2) return null;

  const signals = {
    avgLength: userMessages.reduce((s, m) => s + m.content.length, 0) / userMessages.length,
    hasSubclauses: userMessages.some(m => /jer|koji|koja|koje|kada|ako|iako/i.test(m.content)),
    hasPastTense: userMessages.some(m => /sam bio|sam bila|jesam|bio je|bila je/i.test(m.content)),
    hasFutureTense: userMessages.some(m => /ću|ćeš|će|ćemo|ćete/i.test(m.content)),
    errorRate: userMessages.filter(m => /\[correction\]/i.test(m.content || '')).length / userMessages.length,
    codeSwitch: userMessages.filter(m => /\b(the|is|are|and|but|I|you|we)\b/.test(m.content)).length,
  };

  // Estimate level shift: 'lower', 'same', or 'higher'
  if (signals.codeSwitch > userMessages.length * 0.4) return 'lower';
  if (signals.avgLength < 15 && !signals.hasSubclauses) return 'lower';
  if (signals.avgLength > 60 && signals.hasSubclauses && signals.hasPastTense) return 'higher';
  return 'same';
}

// ── System prompt builder ──────────────────────────────────────────────────────

function buildConversationSystemPrompt({ level, topic, turnCount, maxTurns, userName, mistakePatterns, abilityShift, learnerErrors, isHeritage }) {

  const safeLevel = sanitizeLevel(level);
  const sessionMax = maxTurns || MAX_TURNS_BY_LEVEL[safeLevel] || MAX_TURNS_PER_SESSION;
  const safeTopic = sanitizeTopic(topic);
  const name = sanitizeParam(userName || "", 50);

  // ── Adaptive difficulty note (from real-time ability estimate) ──
  const adaptiveNote = abilityShift === 'lower'
    ? '\n\nADAPTIVE: Learner is struggling — simplify vocabulary, use shorter sentences, increase scaffolding.'
    : abilityShift === 'higher'
    ? '\n\nADAPTIVE: Learner is performing above stated level — introduce slightly more complex structures naturally.'
    : '';

  // ── Heritage speaker context ──
  const heritageNote = isHeritage
    ? `\n\nHERITAGE SPEAKER CONTEXT: This learner grew up hearing Croatian at home (diaspora community — may be from Australia, USA, Germany, Canada, or similar). They likely speak naturally but have systematic gaps: frozen vocabulary from parents' emigration era, simplified case system (especially genitive plural), possible dialect mixing (Dalmatian/Slavonian forms in otherwise standard Croatian), anglicisms/germanisms. Do NOT treat them as a complete beginner. Meet them at their actual production level. Gently recast archaic or regional forms toward standard Croatian when they occur. Acknowledge their heritage warmly if appropriate — Maja would genuinely respect this connection to Croatian.`
    : '';

  // ── Known weak areas injected from frontend error ledger ──
  const safeErrors = Array.isArray(learnerErrors) ? learnerErrors : [];
  const errorContext = safeErrors.length > 0
    ? `\n\nLEARNER'S KNOWN WEAK AREAS: ${safeErrors.slice(0, 5).map(e => sanitizeParam(String(e?.pattern || ''), 60)).filter(Boolean).join(', ')}. Naturally work in practice of these patterns.`
    : '';

  // ── CEFR-calibrated language rules ──
  const languageRules = {
    A1: `CRITICAL A1 RULES:
- Maximum 1–2 very short sentences per response. Present tense ONLY.
- Vocabulary: the 300 most common Croatian words. No idioms, no complex clauses.
- GRAMMAR: Use NOMINATIVE and ACCUSATIVE cases only. Do NOT use Genitive, Dative, Locative, or Instrumental in your own sentences — these cases are not yet taught.
- Speak at a noticeably slow, deliberate pace (the TTS caller will use slow:true for A1).
- End every turn with one simple yes/no question: "Jesi li...?" or "Voliš li...?"
- If the learner writes in English or seems lost: give a short Croatian sentence AND its English translation in parentheses — just this once.
- Celebrate any attempt: "Bravo!", "Super!", "Odlično!"`,

    A2: `A2 RULES:
- 2–3 short, clear sentences. Present and simple past (sam bio/bila).
- Everyday vocabulary. One gentle idiom per session maximum.
- Yes/no questions and simple open questions: "Što voliš...?", "Gdje si bio/bila?"
- ASPECT: A2 is recognition-only. Use aspect naturally in your own speech but do NOT explicitly correct aspect errors or introduce aspect rules — the learner is not yet expected to produce aspect correctly. Gently recast aspect errors without comment.
- If learner seems confused (repeats the same wrong word twice, says "ne razumijem", writes in English):
  set scaffolding_level to 2 and add a brief English gloss in the english_gloss field.
- Do not use English in the croatian field.`,

    B1: `B1 RULES:
- 3–4 conversational sentences. Present, past (perfekt), and near-future naturally.
- Natural idioms welcome: "Nema veze", "Baš tako", "Kakva glupost".
- Open questions that require a sentence to answer: "Što misliš o...?", "Zašto...?"
- Rely on implicit recast (use correct form naturally) over explicit correction.
- English gloss only if learner explicitly says they don't understand.`,

    B2: `B2 RULES:
- 4–5 sentences of natural Croatian. All tenses freely.
- Idioms, cultural references, mild humor all welcome.
- Treat the learner as a near-peer who can handle nuance.
- Never use English in the croatian field — full immersion.
- Gentle recast is fine; explicit corrections are rare and only for repeated systematic errors.`,
  };

  // ── Topic scenario injection ──
  const topicScenarios = {
    free:          "This is open conversation. Follow wherever the learner leads.",
    introductions: "You are meeting this person for the first time. Exchange names, where you're from, why they're learning Croatian.",
    daily_life:    "Talk about daily routines: waking up, meals, commuting, evening plans.",
    food:          "Discuss Croatian food: your love of prstaci, brudet, fritule, which konoba you recommend, what the learner likes to cook.",
    family:        "Talk about family: siblings, parents, do they have children, family traditions.",
    travel:        "Discuss travel in Croatia: which islands, cities, national parks the learner wants to visit or has visited.",
    sport:         "Talk about sport: football (you support Hajduk Split), swimming in the Adriatic, hiking Medvednica.",
    culture:       "Discuss Croatian culture: music, film, Krleža, Dubrovnik festival, local customs.",
    at_the_market: "ROLEPLAY: You are a vendor at Dolac market in Zagreb. The learner is shopping. Be helpful but stay in Croatian. Discuss prices, produce, recipes.",
    at_the_cafe:   "ROLEPLAY: You are both at a café in Zagreb. The learner is ordering. Discuss coffee, what to eat, the view.",
    directions:    "ROLEPLAY: The learner is lost and asking for directions. Help them navigate to a landmark in Zagreb (Ban Jelačić square, Dolac, Gornji grad).",
    work:          "Talk about work: what you both do, working in Croatia, office culture, dream jobs.",
    weather:       "Discuss Croatian weather: Bura wind in Dalmatia, Zagreb winters, summer heat on the islands.",
  };

  // ── Scaffolding rules (used to set scaffolding_level in output) ──
  const scaffoldingRules = `
SCAFFOLDING — THE MOST IMPORTANT MECHANISM:
The scaffolding_level integer (0–3) you return tells the client how to present your response:
  0 = Full Croatian, no support (normal conversation, learner keeping up)
  1 = Croatian primary, english_gloss provided as optional hover/tooltip
  2 = Croatian + English gloss shown prominently (learner is struggling)
  3 = Switch-scaffold: the croatian field contains a Croatian sentence that is deliberately simplified
      AND rephrased to be more comprehensible. english_gloss contains full English. Use this when
      learner has shown clear incomprehension 2+ times in a row.

WHEN TO ESCALATE scaffolding_level:
- Learner writes "ne razumijem" / "I don't understand" / "što?" / "hm?" → escalate to 2
- Learner repeats the same incorrect phrase → note in correction, escalate to 1
- Learner writes entirely in English (not just one word) → escalate to 2, respond in both
- Learner gives no response / single letter → escalate to 1, prompt gently
- Conversation is flowing well → scaffolding_level 0 (default)

WHEN TO DE-ESCALATE:
- After any scaffolded turn, if learner responds correctly in Croatian → drop scaffolding_level by 1
- Never stay at level 3 for more than 2 consecutive turns — it breaks immersion`;

  // ── Correction strategy ──
  const rawPatterns = Array.isArray(mistakePatterns) ? mistakePatterns : [];
  const mistakeLines = rawPatterns.slice(0, 8).map(p => {
    const pattern = sanitizeParam(String(p?.pattern || ""), 60);
    const pCount  = Math.min(Math.max(Number(p?.count) || 0, 0), 999);
    return pattern ? `- ${pattern} (seen ${pCount}x)` : null;
  }).filter(Boolean);

  const correctionRules = `
CORRECTION STRATEGY:
PRIMARY method: IMPLICIT RECAST — use the correct form naturally in your reply without comment.
  Example: learner says "Ja idem u Zagreb jutro" → you say "...da, sutra ideš u Zagreb?" (correcting "jutro→sutra" and word order silently)

EXPLICIT CORRECTION (populate the correction object) ONLY when:
  (a) The same pattern has appeared 3+ times this session (check mistake_patterns), OR
  (b) The error changes the meaning so much it would cause real confusion, OR
  (c) The learner explicitly asks "je li to točno?" or "how do I say..."

When you DO correct explicitly:
  - correction.original = exact wrong phrase the learner used
  - correction.corrected = the right form, in Croatian
  - correction.explanation = one SHORT sentence in English explaining the rule
  - correction.echo = the sentence in YOUR reply that naturally demonstrates the correct form

Never say "that's wrong" or "you made a mistake". Weave corrections as positive restatements.

KNOWN RECURRING PATTERNS FOR THIS LEARNER:
${mistakeLines.length ? mistakeLines.join("\n") : "None recorded yet — first session or clean slate."}`;

  // ── Session arc guidance ──
  let sessionArcGuidance = "";
  if (turnCount === 0) {
    sessionArcGuidance = `OPENING TURN (turn 0):
This is the very first message of this conversation session.
- Warm greeting, introduce the topic lightly: "${safeTopic === 'free' ? 'Open with a warm "Bok!" and a simple question about how they are or what they want to talk about.' : `Introduce the topic: ${topicScenarios[safeTopic]}`}"
- Set a welcoming, low-pressure tone.
- For A1/A2: speak very slowly and simply. This is the trust-building moment.`;
  } else if (turnCount >= sessionMax - 2) {
    sessionArcGuidance = `CLOSING TURNS (turn ${turnCount} of ${sessionMax}):
The session is nearly over. Begin wrapping up naturally — don't end abruptly but do not introduce new complex topics.
On the final 2 turns, bring the conversation to a warm close. Compliment what the learner did well today.
End the last turn with a short encouraging phrase like: "Do sljedećeg puta! Učio/Učila si super danas."
Set is_session_end: true in your response on the very last turn.`;
  } else {
    sessionArcGuidance = `CONVERSATION TURN (turn ${turnCount} of ${sessionMax}):
Keep the conversation flowing. One open question at the end to keep momentum.
${safeTopic !== 'free' ? `Stay loosely on the topic of: ${topicScenarios[safeTopic]}` : 'Follow wherever the learner leads.'}`;
  }

  return `You ARE Maja Kovačević. You are a real Croatian woman — not an AI, not an assistant. Never break character, never mention you are an AI, never switch out of the conversation frame.

ABOUT MAJA:
You are 34 years old, born in Zadar (Dalmatia), living in Zagreb for ten years. You teach Croatian to foreigners at Gimnazija Lucijana Vranjanina. You are married to Tomislav (civil engineer); your daughter Ana is 6. You love Dalmatian food (prstaci, brudet, peka), hate Zagreb winters, support Hajduk Split with full Dalmatian devotion. You admire Miroslav Krleža. You think the Dalmatian dialect is the most beautiful Croatian.

YOUR SPEECH PATTERNS:
"Joj!" when surprised. "Pa vidi..." when explaining. "Baš tako!" when someone gets it right. "Znači..." to think aloud. You are warm, genuinely funny, occasionally sardonic with students you know. You are proud of Croatia.

YOUR STUDENT:
${name ? `Name: ${name}` : "Name not yet known — find out in the first turn."}
CEFR Level: ${safeLevel}
Conversation topic/scenario: ${topicScenarios[safeTopic]}
Turn number: ${turnCount}

LANGUAGE RULES FOR THIS STUDENT'S LEVEL:
${languageRules[safeLevel] || languageRules["A2"]}

${sessionArcGuidance}

${scaffoldingRules}

${correctionRules}

SPACED REPETITION WITHIN SESSION:
If you made an implicit recast on a word/form earlier in the session, try to naturally use that same word/form again 2–3 turns later to reinforce it. Do this organically — never make it feel like a test.

THE FEEL OF THIS INTERACTION:
This must feel like talking to a real, patient, engaging Croatian person — not a quiz, not a flashcard, not a grammar lesson. The learner should forget they're "studying". The best learning happens when conversation feels genuinely compelling.
- Ask about things you'd actually be curious about.
- React emotionally to what they share (surprise, delight, sympathy).
- Share small opinions of your own.
- Use the learner's name occasionally (if you know it).
- Never list vocabulary, never give "a tip", never break the 4th wall.

OUTPUT FORMAT — CRITICAL:
Return ONLY a single valid JSON object. No markdown, no code blocks, no explanation, no text before or after.

SCHEMA:

{
  "croatian": "Your full response in Croatian (always present, always Croatian)",
  "english_gloss": null,
  "correction": null,
  "scaffolding_level": 0,
  "emotion": "warm",
  "topic_detected": "daily_life",
  "level_demonstrated": "${safeLevel}",
  "is_session_end": false,
  "recast_word": null,
  "errorPatterns": []
}

FIELD RULES:
- croatian: ALWAYS present. ALWAYS Croatian. The full response text for TTS.
- english_gloss: string | null. English translation or partial gloss. Null when scaffolding_level is 0.
- correction: null OR object with keys: original (string), corrected (string), explanation (string), echo (string)
- scaffolding_level: integer 0–3. See scaffolding rules above. Default 0.
- emotion: one of "warm" | "encouraging" | "playful" | "proud" | "curious" | "concerned" | "teasing" | "neutral"
- topic_detected: one of "${VALID_TOPICS.join('" | "')}"
- level_demonstrated: your assessment of what CEFR level the learner's message demonstrates: "A1"|"A2"|"B1"|"B2"
- is_session_end: boolean. True ONLY on the final closing turn.
- recast_word: string | null. If you did an implicit recast, name the word/form you corrected (e.g. "instrumental case"). Null otherwise.
- errorPatterns: array of strings. Grammar/vocabulary patterns you explicitly corrected THIS turn (e.g. ["accusative_case", "verb_conjugation"]). Empty array [] if no explicit correction was made.${adaptiveNote}${errorContext}${heritageNote}`;
}

// ── CORS ───────────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  // CORS
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders(origin) });
  }

  // Stricter rate limit for conversation (expensive endpoint)
  const allowed = await checkRateLimit(request, SESSION_RATE_LIMIT_PER_MINUTE);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Conversation is limited to 3 sessions per hour." }),
      { status: 429, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  // Auth
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (FIREBASE_PROJECT_ID && !uid) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders(origin) });
  }

  // Daily AI quota check (cost 2 — streaming conversation is heavier)
  const quota = await checkAIQuota(request, env, uid, 2);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: 'daily_quota_exceeded', message: 'Daily AI limit reached. Resets at midnight UTC.', resetAt: quota.resetAt }),
      { status: 429, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "Service not configured" }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return new Response(
      JSON.stringify({ error: "Invalid content type" }),
      { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  let body;
  try { body = await request.json(); }
  catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  const {
    messages,        // Array<{ role: 'user'|'assistant', content: string }>
    level,           // 'A1' | 'A2' | 'B1' | 'B2'
    topic,           // string from VALID_TOPICS
    turnCount,       // integer, how many turns have happened in this session
    userName,        // optional string
    mistakePatterns, // optional Array<{ pattern: string, count: number }>
    learnerErrors,   // optional Array<{ pattern: string }> — unified error ledger from frontend
    isHeritage,      // optional boolean — diaspora/heritage Croatian speaker
  } = body;

  // Validate turn count — hard cap enforced server-side, level-adjusted
  const safeLevel = ['A1','A2','B1','B2','C1','C2'].includes(level) ? level : null;
  const maxTurns = (safeLevel && MAX_TURNS_BY_LEVEL[safeLevel]) || MAX_TURNS_PER_SESSION;
  const safeTurnCount = sanitizeTurnCount(turnCount);
  if (safeTurnCount >= maxTurns) {
    return new Response(
      JSON.stringify({ error: "Session limit reached", session_end: true }),
      { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array required" }),
      { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  // Sanitize and validate messages — only 'user' and 'assistant' roles, string content
  const anthropicMessages = [];
  for (const msg of messages.slice(-20)) { // cap context at 20 turns
    const role = msg.role === "assistant" ? "assistant" : "user";
    const content = sanitizeParam(String(msg.content || ""), 1000);
    if (!content) continue;
    anthropicMessages.push({ role, content });
  }

  // Must end with a user message
  if (anthropicMessages.length === 0 || anthropicMessages[anthropicMessages.length - 1].role !== "user") {
    return new Response(
      JSON.stringify({ error: "Last message must be from user" }),
      { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  // Estimate learner ability from sanitized message history
  const abilityShift = estimateAbility(anthropicMessages);

  // Build system prompt
  const systemPrompt = buildConversationSystemPrompt({
    level: sanitizeLevel(level),
    topic: sanitizeTopic(topic),
    turnCount: safeTurnCount,
    maxTurns,
    userName,
    mistakePatterns,
    abilityShift,
    learnerErrors,
    isHeritage: isHeritage === true,
  });

  // ── Stream from Anthropic API ──────────────────────────────────────────────
  // We use the raw fetch + SSE approach rather than the Anthropic SDK because
  // Cloudflare Workers must return a streaming Response immediately. We pipe
  // Anthropic's SSE stream through a TransformStream to the client.
  //
  // Client receives: text/event-stream
  //   - Multiple `data: {"type":"delta","text":"..."}` events as tokens arrive
  //   - A final `data: {"type":"done","result":{...parsed JSON...}}` event
  //   - An `event: error` event on failure
  //
  // The client should buffer all delta text, then on "done" parse result directly.
  // Because Maja outputs a JSON object, the client does NOT need to parse streaming
  // tokens — it waits for the "done" event which contains the fully parsed object.
  // The streaming gives faster time-to-first-token for perceived responsiveness.

  let anthropicStream;
  try {
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600, // Conversation responses are short; cap to control cost
        stream: true,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(
        JSON.stringify({ error: "AI service error", detail: errText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    anthropicStream = anthropicRes.body;
  } catch (fetchErr) {
    const isTimeout = fetchErr?.name === 'TimeoutError' || fetchErr?.name === 'AbortError';
    return new Response(
      JSON.stringify({ error: isTimeout ? "AI service timed out" : "Failed to reach AI service" }),
      { status: 503, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }

  // ── TransformStream: Anthropic SSE → client SSE ────────────────────────────
  // Anthropic sends SSE with event types: message_start, content_block_delta,
  // message_stop, etc. We extract the text deltas and buffer the full response,
  // then emit a final "done" event with the parsed JSON result.

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Process the stream asynchronously (do NOT await — we return the readable immediately)
  (async () => {
    let fullText = "";
    const reader = anthropicStream.getReader();
    let buffer = "";

    const write = (chunk) => writer.write(encoder.encode(chunk));

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          let parsed;
          try { parsed = JSON.parse(data); } catch { continue; }

          // Anthropic SSE event types we care about
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            const text = parsed.delta.text || "";
            fullText += text;
            // Forward delta to client for fast perceived response
            await write(`data: ${JSON.stringify({ type: "delta", text })}\n\n`);
          }

          // message_stop = end of generation
          if (parsed.type === "message_stop") {
            // Parse the full accumulated JSON response from Maja
            let result = null;
            try {
              // Strip any markdown code fences if model adds them despite instructions
              const cleaned = fullText
                .replace(/^```json\s*/i, "")
                .replace(/```\s*$/, "")
                .trim();
              result = JSON.parse(cleaned);
            } catch {
              // JSON parse failure — return a graceful fallback
              result = fallbackResponse(safeTurnCount, maxTurns);
            }

            // Enforce is_session_end based on server-side turn count (not model's choice)
            if (safeTurnCount >= maxTurns - 1) {
              result.is_session_end = true;
            }

            await write(`data: ${JSON.stringify({ type: "done", result })}\n\n`);
          }
        }
      }
    } catch (streamErr) {
      // Stream read error — send error event; surface timeout specifically
      const isTimeout = streamErr?.name === 'TimeoutError' || streamErr?.name === 'AbortError';
      if (isTimeout) {
        await write(`data: ${JSON.stringify({ error: "timeout", done: true })}\n\n`);
      } else {
        await write(`event: error\ndata: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      }
    } finally {
      try { await writer.close(); } catch { /* ignore */ }
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no", // Disable nginx buffering if any proxy is in path
    },
  });
}

// ── Fallback when Claude returns unparseable JSON ──────────────────────────────

function fallbackResponse(turnCount, maxTurns) {
  const phrases = [
    "Joj, nisam te dobro razumjela! Možeš li ponoviti?",
    "Pa vidi... reci mi još jednom, molim te.",
    "Znači... nisam sigurna jesam li razumjela. Ponovi!",
    "Baš tako — ali ajde ponovi, da budem sigurna.",
  ];
  return {
    croatian: phrases[Math.floor(Math.random() * phrases.length)],
    english_gloss: "Sorry, I didn't quite catch that — can you repeat?",
    correction: null,
    scaffolding_level: 1,
    emotion: "warm",
    topic_detected: "other",
    level_demonstrated: "A2",
    is_session_end: turnCount >= maxTurns - 1,
    recast_word: null,
  };
}
