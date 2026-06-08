// Cloudflare Pages Function — Live Tutor Summary
// After a LiveTutor voice session ends, generates a brief personalized summary
// of the session from Marija's perspective.

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

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function sanitizeLevel(level) {
  return VALID_LEVELS.includes(level) ? level : 'B1';
}

// ── XP formula ────────────────────────────────────────────────────────────────

function calcXp(durationSecs, turnCount) {
  const raw = Math.round(durationSecs / 60) * 10 + turnCount * 3;
  return Math.min(75, Math.max(25, raw));
}

// ── Static fallback ───────────────────────────────────────────────────────────

function staticFallback(durationSecs, turnCount, origin) {
  return ok(
    {
      summary:
        'Odlično! We had a great practice session together. I really enjoyed our conversation and could see you working hard throughout.',
      strength: 'You stayed engaged and kept the conversation flowing.',
      nextStep: 'Try to use what we practised today in your next flashcard or writing session.',
      xpEarned: calcXp(durationSecs, turnCount),
    },
    origin,
  );
}

// ── PREFLIGHT ──────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') || ''),
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { origin } = gate;

  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Invalid content type', origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON in request body', origin);
  }

  const { transcript, level, topic, durationSecs, turnCount } = body;

  const safeLevel = sanitizeLevel(typeof level === 'string' ? level.trim() : '');
  const safeTopic = sanitizeParam(typeof topic === 'string' ? topic : '', 100);
  const safeDurationSecs = Number.isFinite(durationSecs)
    ? Math.max(0, Math.floor(durationSecs))
    : 0;
  const safeTurnCount = Number.isFinite(turnCount) ? Math.max(0, Math.floor(turnCount)) : 0;

  // Short/empty transcript fallback — no Claude call needed
  const safeTranscript = typeof transcript === 'string' ? transcript.trim() : '';
  if (safeTranscript.length < 20) {
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // Cap transcript at 4000 chars to stay within token budget
  const truncatedTranscript = safeTranscript.slice(0, 4000);

  const xpHint = calcXp(safeDurationSecs, safeTurnCount);

  // ── Build prompts ─────────────────────────────────────────────────────────
  const systemPrompt =
    `You are Marija, a warm Croatian language tutor from Split. A student just finished a voice conversation session with you.\n\n` +
    `Write a brief, encouraging session debrief. Be specific — reference what they actually talked about if possible. ` +
    `Speak as Marija directly (first person, warm, Croatian teacher voice).\n\n` +
    `Return valid JSON only:\n` +
    `{\n` +
    `  "summary": "2-3 sentences from Marija about this specific session",\n` +
    `  "strength": "one specific thing they did well",\n` +
    `  "nextStep": "one concrete next step",\n` +
    `  "xpEarned": number between 25-75 based on session length and engagement\n` +
    `}\n` +
    `No markdown.`;

  const userMessage =
    `Session details:\n` +
    `- Level: ${safeLevel}\n` +
    (safeTopic ? `- Topic: ${safeTopic}\n` : '') +
    `- Duration: ${Math.round(safeDurationSecs / 60)} minutes\n` +
    `- Turn count: ${safeTurnCount}\n` +
    `- Suggested XP: ${xpHint}\n\n` +
    `Transcript:\n${truncatedTranscript}`;

  // ── Call Anthropic ─────────────────────────────────────────────────────────

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
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (fetchErr) {
    console.error('live-tutor-summary.js: network error calling Anthropic:', fetchErr.message);
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('live-tutor-summary.js: failed to read response body:', bodyErr.message);
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // Block 3: check res.ok — map errors to client-safe responses
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('live-tutor-summary.js: Anthropic API error', res.status, errMsg);
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // Block 4: parse JSON — catches malformed responses
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('live-tutor-summary.js: JSON parse failed:', rawBody.slice(0, 200));
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) {
    console.error('live-tutor-summary.js: Anthropic returned empty response');
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // ── Parse and validate response ────────────────────────────────────────────
  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('live-tutor-summary.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return staticFallback(safeDurationSecs, safeTurnCount, origin);
  }

  // Clamp xpEarned to valid range, fall back to formula if missing
  let xpEarned = Number.isFinite(parsed.xpEarned) ? Math.round(parsed.xpEarned) : xpHint;
  xpEarned = Math.min(75, Math.max(25, xpEarned));

  return ok(
    {
      summary: sanitizeParam(String(parsed.summary || ''), 600),
      strength: sanitizeParam(String(parsed.strength || ''), 300),
      nextStep: sanitizeParam(String(parsed.nextStep || ''), 300),
      xpEarned,
    },
    origin,
  );
}
