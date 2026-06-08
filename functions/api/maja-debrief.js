// Cloudflare Pages Function — Maja End-of-Session Debrief
// Generates a personalised post-conversation summary from Maja Kovačević's perspective
// Keeps the API key server-side; never exposed to the browser

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

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

function sanitizeHistory(value, maxLen = 300) {
  return String(value || '')
    .replace(/[\r\n]/g, ' ') // no newlines
    .replace(/[`\\]/g, '') // no backticks/backslash
    .replace(/\b(ignore|disregard|override|forget|system|instruction|prompt)\b/gi, '[…]') // mask injection keywords
    .trim()
    .slice(0, maxLen);
}

function ok(body, origin) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Input validation ──────────────────────────────────────────────────────────

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

function sanitizeSessionCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 9999);
}

// ── Fallback debrief ──────────────────────────────────────────────────────────

function debriefFallback(userName) {
  const name = userName ? ` ${userName}` : '';
  return {
    majaNotes: `Drago mi je što smo razgovarali${name}! Svaki razgovor je korak naprijed — vidimo se sljedeći put!`,
    didWell:
      'You kept the conversation going and made a genuine effort to communicate in Croatian.',
    focusNext:
      'Continue practising verb conjugation in the past tense (perfekt) — this will make your speech flow much more naturally.',
    newVocab: [],
    nextTopicSuggestion:
      'Maja wants to tell you about the Advent markets in Zagreb and what makes them different from any Christmas market you have seen.',
    updatedFacts: {},
    mistakePatternsUpdate: [],
    xpEarned: 30,
    suggestLevelUp: false,
    suggestLevelUpTo: null,
    levelUpMessage: null,
  };
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildDebriefSystemPrompt(params) {
  const { userName, userLevel, knownFacts, mistakePatterns, durationSeconds, messageCount } =
    params;

  const name = sanitizeParam(userName || '', 50);
  const level = sanitizeLevel(userLevel);
  const isShort = messageCount < 4;

  // Sanitize knownFacts
  const rawFacts = knownFacts || {};
  const factsLines = [];
  for (const [k, v] of Object.entries(rawFacts)) {
    const safeKey = sanitizeParam(k, 40);
    if (!safeKey) continue;
    if (Array.isArray(v)) {
      const safeArr = v
        .slice(0, 10)
        .map((x) => sanitizeParam(String(x), 60))
        .filter(Boolean);
      if (safeArr.length) factsLines.push(`- ${safeKey}: ${safeArr.join(', ')}`);
    } else if (v !== null && v !== undefined) {
      const safeVal = sanitizeParam(String(v), 100);
      if (safeVal) factsLines.push(`- ${safeKey}: ${safeVal}`);
    }
  }

  // Sanitize mistake patterns
  const rawPatterns = Array.isArray(mistakePatterns) ? mistakePatterns : [];
  const patternLines = rawPatterns
    .slice(0, 10)
    .map((p) => {
      const pattern = sanitizeParam(String(p?.pattern || ''), 60);
      const pCount = Math.min(Math.max(Number(p?.count) || 0, 0), 999);
      return pattern ? `- ${pattern} (seen ${pCount} times)` : null;
    })
    .filter(Boolean);

  const durationMin = durationSeconds ? Math.round(durationSeconds / 60) : null;

  return `You are Maja Kovačević — a 34-year-old Croatian language teacher from Zadar who lives in Zagreb. You are warm, witty, deeply proud of Croatian culture, and genuinely invested in your students' progress. You teach at Gimnazija Lucijana Vranjanina. You love Dalmatian food, you support Hajduk Split, and you hike Medvednica on weekends.

You have just finished a conversation session with your student${name ? ` ${name}` : ''}. Your job is to write a personalised end-of-session debrief that will motivate them to come back.

STUDENT PROFILE:
${name ? `Name: ${name}` : 'Name: unknown'}
Level: ${level}
Session duration: ${durationMin !== null ? `approximately ${durationMin} minute${durationMin === 1 ? '' : 's'}` : 'unknown'}
Message count: ${messageCount}
${factsLines.length ? `Known facts:\n${factsLines.join('\n')}` : 'Known facts: none yet'}
${patternLines.length ? `Recurring mistake patterns:\n${patternLines.join('\n')}` : 'Recurring mistake patterns: none recorded'}

DEBRIEF INSTRUCTIONS:

1. MAJA NOTES ("majaNotes"): Write exactly 2 sentences in ENGLISH, personally from Maja to the student. Reference something SPECIFIC from the conversation history — a topic you actually discussed, a word they used well, a joke that landed, a question they asked. Do NOT be generic. This is the note they read at the top of their debrief, so it must feel personal. ${isShort ? 'The session was very short (fewer than 4 messages) — gently encourage them to stay longer next time, in a warm and non-judgmental way.' : ''}

2. DID WELL ("didWell"): One sentence in English identifying something genuinely specific the student did well. Reference actual content — not "good effort" but something like "You used the locative correctly when talking about where you live" or "You asked follow-up questions which kept the conversation feeling natural." Look at the actual conversation to find this.

3. FOCUS NEXT ("focusNext"): One sentence in English naming ONE specific grammar pattern or vocabulary area the student should practise. Be precise — not "practice grammar" but "practice the genitive plural of feminine nouns" or "learn the verbs of motion (ići, dolaziti, putovati) with their aspect pairs." Base this on actual errors seen, or gaps in their language if no errors were made.

4. NEW VOCABULARY ("newVocab"): Find 3-8 Croatian words or short phrases that appeared in MAJA'S messages during this session which would be genuinely useful and interesting for the student to remember. Prioritise: culturally rich words, idioms, words with interesting grammar, words that came up in a meaningful context. For each:
   - "hr": the Croatian word/phrase
   - "en": natural English equivalent
   - "used_in": the exact short phrase or sentence from Maja's messages where it appeared (quote it directly)

5. NEXT TOPIC SUGGESTION ("nextTopicSuggestion"): One sentence describing something Maja HERSELF would want to bring up next session — something specific, personal, and authentic to her character. Examples: a Dalmatian recipe she wants to explain, an upcoming Croatian cultural event, a Krleža story she thinks the student would love, something funny that happened at school, a hike she did on Medvednica. Make it feel like she is genuinely looking forward to the next conversation.

6. UPDATED FACTS ("updatedFacts"): If the conversation revealed any new information about the student (hometown, job, interests, family, Croatia connection, travel plans), include them here using the same key structure as knownFacts (e.g. "knownFacts.hometown": "Chicago"). Empty object if nothing new was learned.

7. MISTAKE PATTERNS UPDATE ("mistakePatternsUpdate"): If you noticed any grammar error patterns in the student's messages during this session, return them as an array. Use the same pattern names as the existing patterns list where possible, or create a descriptive new name. Each item: {"pattern": "pattern_name", "count": N} where N is how many times you saw it in this session only. Empty array if no clear patterns.

8. XP EARNED ("xpEarned"): Always return 30.

9. LEVEL-UP SUGGESTION ("suggestLevelUp"): Based on the conversation, does the student consistently perform ABOVE their stated level (${level})? Return true ONLY if they clearly and repeatedly used grammar or vocabulary beyond their level — for example, an A1 student constructing correct complex sentences, or an A2 student using B1 aspect distinctions correctly. Return false if they are at or below their current level. When true, also populate "suggestLevelUpTo" with the next level (A1→A2, A2→B1, B1→B2, B2→C1). When true, also write "levelUpMessage" — one short warm sentence from Maja encouraging the level change.

OUTPUT FORMAT — CRITICAL:
Return ONLY a valid JSON object. No markdown. No code blocks. No explanation before or after. Exactly this structure:

{
  "majaNotes": "Two warm, specific English sentences from Maja to the student.",
  "didWell": "One specific English sentence about what they did well.",
  "focusNext": "One precise English sentence about what to practise next.",
  "newVocab": [
    {"hr": "šetnica", "en": "promenade / boardwalk", "used_in": "Šetnica u Zadru je prekrasna navečer."}
  ],
  "nextTopicSuggestion": "One sentence about what Maja wants to discuss next time.",
  "updatedFacts": {},
  "mistakePatternsUpdate": [],
  "xpEarned": 30,
  "suggestLevelUp": false,
  "suggestLevelUpTo": null,
  "levelUpMessage": null
}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') || ''),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const gate = await requireAuthedAI(context, { cost: 2, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { origin, isDev } = gate;

  // API key check
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);

  // Content-type check
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Invalid content type', origin);

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON in request body', origin);
  }

  const { history, session, durationSeconds } = body;

  // ── Validate history ──
  if (!Array.isArray(history)) return err(400, 'history must be an array', origin);
  if (history.length > 200) return err(400, 'history too long (max 200 turns)', origin);
  if (history.length === 0) return err(400, 'history is empty', origin);

  // ── Validate session ──
  if (!session || typeof session !== 'object')
    return err(400, 'session object is required', origin);

  const userName = sanitizeParam(session.userName || '', 50);
  const userLevel = sanitizeLevel(session.userLevel);
  const safeCount = sanitizeSessionCount(session.count);
  const knownFacts =
    session.knownFacts && typeof session.knownFacts === 'object' ? session.knownFacts : {};
  const mistakePatterns = Array.isArray(session.mistakePatterns) ? session.mistakePatterns : [];

  // ── Validate durationSeconds ──
  const safeDuration =
    typeof durationSeconds === 'number' && durationSeconds >= 0
      ? Math.min(Math.floor(durationSeconds), 86400)
      : null;

  // ── Build conversation transcript for Claude ──
  // Sanitize and format history into a readable transcript
  const transcriptLines = [];
  let userMessageCount = 0;
  for (const turn of history.slice(0, 150)) {
    if (typeof turn !== 'object' || !turn) continue;
    const role =
      turn.role === 'maja' ? 'Maja' : turn.role === 'user' ? userName || 'Student' : null;
    if (!role) continue;
    const content = sanitizeHistory(String(turn.content || ''), 300);
    if (!content) continue;
    transcriptLines.push(`${role}: ${content}`);
    if (turn.role === 'user') userMessageCount++;
  }

  if (transcriptLines.length === 0) return err(400, 'No valid messages in history', origin);

  // Cap total transcript to prevent prompt stuffing
  const transcript = transcriptLines.join('\n').slice(0, 8000);

  // ── Build system prompt ──
  const systemPrompt = buildDebriefSystemPrompt({
    userName,
    userLevel,
    count: safeCount,
    knownFacts,
    mistakePatterns,
    durationSeconds: safeDuration,
    messageCount: userMessageCount,
  });

  // ── Call Anthropic ──

  // Block 1: fetch — catches network errors only
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Here is the full conversation transcript to analyse:\n\n${transcript}\n\nPlease generate the end-of-session debrief now.`,
          },
        ],
      }),
    });
  } catch (fetchErr) {
    console.error('maja-debrief.js: network error calling Anthropic:', fetchErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('maja-debrief.js: failed to read response body:', bodyErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 3: check res.ok — map errors to client-safe responses
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('maja-debrief.js: Anthropic API error', res.status, errMsg);
    return err(
      res.status >= 500 ? 502 : res.status,
      isDev ? errMsg || 'API error: HTTP ' + res.status : 'AI service error',
      origin,
    );
  }

  // Block 4: parse JSON — catches malformed responses
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('maja-debrief.js: JSON parse failed:', rawBody.slice(0, 200));
    return err(502, 'Invalid response from AI', origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('maja-debrief.js: Anthropic returned empty response');
    return ok(debriefFallback(userName), origin);
  }

  // ── Parse Claude's JSON response ──
  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('maja-debrief.js: JSON parse failed, using fallback. Raw:', raw.slice(0, 200));
    return ok(debriefFallback(userName), origin);
  }

  // ── Validate and sanitize the parsed response ──
  const majaNotes =
    typeof parsed.majaNotes === 'string' && parsed.majaNotes.trim()
      ? parsed.majaNotes.trim().slice(0, 600)
      : debriefFallback(userName).majaNotes;

  const didWell =
    typeof parsed.didWell === 'string' && parsed.didWell.trim()
      ? parsed.didWell.trim().slice(0, 400)
      : debriefFallback(userName).didWell;

  const focusNext =
    typeof parsed.focusNext === 'string' && parsed.focusNext.trim()
      ? parsed.focusNext.trim().slice(0, 400)
      : debriefFallback(userName).focusNext;

  // Validate newVocab array
  const newVocab = Array.isArray(parsed.newVocab)
    ? parsed.newVocab.slice(0, 10).reduce((acc, item) => {
        if (
          typeof item === 'object' &&
          item &&
          typeof item.hr === 'string' &&
          item.hr.trim() &&
          typeof item.en === 'string' &&
          item.en.trim()
        ) {
          acc.push({
            hr: item.hr.trim().slice(0, 100),
            en: item.en.trim().slice(0, 100),
            used_in: typeof item.used_in === 'string' ? item.used_in.trim().slice(0, 300) : '',
          });
        }
        return acc;
      }, [])
    : [];

  const nextTopicSuggestion =
    typeof parsed.nextTopicSuggestion === 'string' && parsed.nextTopicSuggestion.trim()
      ? parsed.nextTopicSuggestion.trim().slice(0, 400)
      : debriefFallback(userName).nextTopicSuggestion;

  const updatedFacts =
    parsed.updatedFacts &&
    typeof parsed.updatedFacts === 'object' &&
    !Array.isArray(parsed.updatedFacts)
      ? parsed.updatedFacts
      : {};

  // Validate mistakePatternsUpdate
  const mistakePatternsUpdate = Array.isArray(parsed.mistakePatternsUpdate)
    ? parsed.mistakePatternsUpdate.slice(0, 15).reduce((acc, item) => {
        if (
          typeof item === 'object' &&
          item &&
          typeof item.pattern === 'string' &&
          item.pattern.trim()
        ) {
          const pCount = Math.min(Math.max(Number(item.count) || 0, 0), 999);
          acc.push({ pattern: item.pattern.trim().slice(0, 80), count: pCount });
        }
        return acc;
      }, [])
    : [];

  return ok(
    {
      majaNotes,
      didWell,
      focusNext,
      newVocab,
      nextTopicSuggestion,
      updatedFacts,
      mistakePatternsUpdate,
      xpEarned: 30,
    },
    origin,
  );
}
