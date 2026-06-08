// Cloudflare Pages Function — AI Croatian Writing Correction
// Uses Anthropic Claude to correct Croatian writing and provide feedback

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';
import { parseUserContext, renderContextPrompt } from './_userContext.js';
import { sanitizeParam } from './_helpers.js';

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
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: 'AI_KEY_MISSING' }), { status: 503, headers });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 400,
      headers,
    });
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { prompt, text } = reqBody;
  if (typeof text !== 'string' || !text.trim()) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers });
  }
  if (text.length > 3000) {
    return new Response(JSON.stringify({ error: 'Text too long (max 3000 chars)' }), {
      status: 400,
      headers,
    });
  }

  const safePrompt = sanitizeParam(prompt, 300);
  const userCtx = parseUserContext(reqBody);
  const contextProse = renderContextPrompt(userCtx, 'correct');

  const basePrompt = `You are a Croatian language teacher. The student was asked to write about: "${safePrompt}".

Analyze their Croatian text and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "corrected_text": "the full corrected Croatian text",
  "score": 75,
  "level_demonstrated": "B1 - Intermediate",
  "changes": [
    {"original": "wrong word or phrase as written", "corrected": "correct form", "note": "brief grammar rule explanation", "errorType": "case"}
  ],
  "strengths": [
    "One specific thing the student did well"
  ],
  "improvements": [
    "One specific area to focus on next time"
  ],
  "encouragement": "One encouraging sentence about their progress"
}

Score 0-100 based on grammar accuracy, vocabulary, and natural expression.
level_demonstrated: A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper-Intermediate), C1 (Advanced).
List up to 5 most important changes. List 1-3 strengths and 1-2 improvements. Be encouraging and specific.

For each item in "changes", set "errorType" to exactly one of these tokens:
- "case" — wrong noun case (nominativ/akuzativ/genitiv/lokativ/instrumental/dativ/vokativ)
- "aspect" — wrong verb aspect (imperfective vs perfective)
- "agreement" — gender/number/case agreement between adjective+noun, subject+verb, etc.
- "tense" — wrong tense (present/past/future/conditional)
- "word_order" — words in the wrong order
- "vocab" — wrong word choice (right form, wrong meaning)
- "spelling" — typo or diacritic mistake
- "other" — anything else
If unsure, use "other". This field is required.`;

  const systemPrompt = contextProse ? basePrompt + '\n\n' + contextProse : basePrompt;

  // Block 1: network errors only
  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });
  } catch (fetchErr) {
    console.error('[correct] network error calling Anthropic:', fetchErr.message);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 502,
      headers,
    });
  }

  // Block 2: read body as text first — non-2xx responses may not be JSON
  let rawBody;
  try {
    rawBody = await response.text();
  } catch (bodyErr) {
    console.error('[correct] failed to read Anthropic response body:', bodyErr.message);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 502,
      headers,
    });
  }

  // Block 3: check ok status
  if (!response.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* body not JSON */
    }
    console.error('[correct] Anthropic API error', response.status, errMsg);
    return new Response(
      JSON.stringify({
        error: isDev
          ? errMsg || 'Anthropic API error: HTTP ' + response.status
          : 'AI service error',
      }),
      { status: response.status >= 500 ? 502 : response.status, headers },
    );
  }

  // Block 4: parse Anthropic JSON envelope
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('[correct] JSON parse failed on Anthropic response:', rawBody.slice(0, 200));
    return new Response(JSON.stringify({ error: 'Invalid response from AI' }), {
      status: 502,
      headers,
    });
  }

  const rawText = data.content?.[0]?.text || '{}';

  // Parse Claude's JSON payload — graceful fallback if malformed
  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    result = {
      corrected_text: text,
      score: 60,
      level_demonstrated: 'Analysis complete',
      changes: [],
      strengths: [],
      improvements: [],
      encouragement: 'Great effort writing in Croatian! Keep practicing every day.',
    };
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...headers, 'Cache-Control': 'no-store' },
  });
}
