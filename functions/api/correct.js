// Cloudflare Pages Function — AI Croatian Writing Correction
// Uses Anthropic Claude to correct Croatian writing and provide feedback

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

function sanitizeParam(value, maxLen = 200) {
  return String(value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/[`\\]/g, '')
    .trim()
    .slice(0, maxLen);
}

function CORS(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: CORS(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: CORS(origin),
    });
  }

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: CORS(origin),
    });
  }

  // Auth — optional (guests use IP-based quota)
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;

  // Daily AI quota (cost 1 — short correction call)
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: 'daily_quota_exceeded',
        message: 'Daily AI limit reached. Resets at midnight UTC.',
        resetAt: quota.resetAt,
      }),
      { status: 429, headers: CORS(origin) },
    );
  }

  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 503,
      headers: CORS(origin),
    });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 400,
      headers: CORS(origin),
    });
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: CORS(origin),
    });
  }

  const { prompt, text } = reqBody;
  if (typeof text !== 'string' || !text.trim()) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), {
      status: 400,
      headers: CORS(origin),
    });
  }
  if (text.length > 3000) {
    return new Response(JSON.stringify({ error: 'Text too long (max 3000 chars)' }), {
      status: 400,
      headers: CORS(origin),
    });
  }

  const safePrompt = sanitizeParam(prompt, 300);

  const systemPrompt = `You are a Croatian language teacher. The student was asked to write about: "${safePrompt}".

Analyze their Croatian text and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "corrected_text": "the full corrected Croatian text",
  "score": 75,
  "level_demonstrated": "B1 - Intermediate",
  "changes": [
    {"original": "wrong word or phrase as written", "corrected": "correct form", "note": "brief grammar rule explanation"}
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
List up to 5 most important changes. List 1-3 strengths and 1-2 improvements. Be encouraging and specific.`;

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
      headers: CORS(origin),
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
      headers: CORS(origin),
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
      { status: response.status >= 500 ? 502 : response.status, headers: CORS(origin) },
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
      headers: CORS(origin),
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
    headers: { ...CORS(origin), 'Cache-Control': 'no-store' },
  });
}
