// Cloudflare Pages Function — AI Error Explanation
// When a learner gets a cloze, dictation, or flashcard wrong, explains WHY.
// Returns a pedagogically useful explanation of the grammar rule.

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders, sanitizeParam } from './_helpers.js';
import { parseUserContext, renderContextPrompt } from './_userContext.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

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

const VALID_TYPES = ['cloze', 'dictation', 'flashcard'];
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') || ''),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { origin, isDev } = gate;

  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return err(400, 'Invalid content type', origin);

  let reqBody;
  try {
    reqBody = await request.json();
  } catch {
    return err(400, 'Invalid JSON in request body', origin);
  }

  const { wrong, correct, context: ctx, type, level } = reqBody;

  if (!VALID_TYPES.includes(type)) return err(400, 'Invalid type', origin);
  if (typeof correct !== 'string' || !correct.trim())
    return err(400, 'Missing correct answer', origin);

  const safeWrong = sanitizeParam(wrong || '', 200);
  const safeCorrect = sanitizeParam(correct, 200);
  const safeCtx = sanitizeParam(ctx || '', 300);
  const safeLevel = VALID_LEVELS.includes(level) ? level : 'B1';

  const userCtx = parseUserContext(reqBody);
  const contextProse = renderContextPrompt(userCtx, 'explain-error');

  const TYPE_DESCS = {
    cloze: 'fill-in-the-blank grammar exercise',
    dictation: 'listening dictation exercise',
    flashcard: 'vocabulary flashcard',
  };

  const typeDesc = TYPE_DESCS[type];

  const userMsg = safeCtx
    ? `Croatian ${typeDesc} at CEFR ${safeLevel} level.
Full sentence/context: "${safeCtx}"
${safeWrong ? `Learner chose: "${safeWrong}"` : 'Learner got it wrong.'}
Correct answer: "${safeCorrect}"

Explain concisely WHY "${safeCorrect}" is correct. Name the grammar rule, case, or pattern.`
    : `Croatian ${typeDesc} at CEFR ${safeLevel}.
Correct answer: "${safeCorrect}"${safeWrong ? `\nLearner answered: "${safeWrong}"` : ''}

Explain the grammar rule. Be specific about case, tense, or pattern.`;

  const basePrompt = `You are a Croatian grammar teacher. Give a concise explanation (2-3 sentences) of why an answer is correct.
Return ONLY valid JSON (no markdown, no code blocks):
{"explanation":"2-3 sentences explaining the grammar rule","rule":"short rule name e.g. 'Accusative case' or 'Negation genitive'","tip":"one memorable tip max 100 chars","example":"one short example sentence in Croatian showing the rule"}`;

  const systemPrompt = contextProse ? basePrompt + '\n\n' + contextProse : basePrompt;

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
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 180,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
  } catch (fetchErr) {
    console.error('explain-error.js: network error:', fetchErr.message);
    return err(502, 'Service temporarily unavailable', origin);
  }

  // Block 2: read body — catches body-read failures
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('explain-error.js: failed to read response body:', bodyErr.message);
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
    console.error('explain-error.js: API error', res.status, errMsg);
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
    console.error('explain-error.js: JSON parse failed:', rawBody.slice(0, 200));
    return err(502, 'Invalid response from AI', origin);
  }

  const raw = data?.content?.[0]?.text?.trim() || '';
  if (!raw) return err(502, 'Empty response from AI', origin);

  let parsed;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('explain-error.js: JSON parse failed. Raw:', raw.slice(0, 200));
    return err(502, 'parse_failed', origin);
  }

  return ok(
    {
      explanation: String(parsed.explanation || '').slice(0, 400),
      rule: String(parsed.rule || '').slice(0, 80),
      tip: String(parsed.tip || '').slice(0, 150),
      example: String(parsed.example || '').slice(0, 150),
    },
    origin,
  );
}
