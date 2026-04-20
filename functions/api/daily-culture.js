// Cloudflare Pages Function — Dynamic Croatia Today content
// GET /api/daily-culture
// Returns a fresh AI-generated daily Croatian phrase, cultural fact, and
// learning tip — date-keyed so the same content is returned all day.
// Uses the existing ANTHROPIC_API_KEY (no new credentials required).
//
// Response is cached at the Cloudflare edge for 6 hours.

import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin, err } from './_helpers.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

// Seven Croatian cities/regions rotated by day-of-week
const LOCATIONS = [
  { city: 'Dubrovnik', region: 'Dalmatia', emoji: '🏰' },
  { city: 'Split', region: 'Dalmatia', emoji: '🏛️' },
  { city: 'Zagreb', region: 'Slavonia', emoji: '🏙️' },
  { city: 'Hvar', region: 'Dalmatia', emoji: '🌿' },
  { city: 'Plitvice Lakes', region: 'Lika', emoji: '🌊' },
  { city: 'Rovinj', region: 'Istria', emoji: '🎨' },
  { city: 'Šibenik', region: 'Dalmatia', emoji: '⛵' },
];

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) return err(403, 'Forbidden', origin);

  const allowed = await checkRateLimit(request, 20);
  if (!allowed) return err(429, 'Rate limited', origin);

  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return err(503, 'Not configured', origin);

  // Date-based seed for determinism — same content all day
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // "2026-03-28"
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const location = LOCATIONS[dayOfYear % LOCATIONS.length];

  const prompt = `Today is ${dateStr}. Generate a short, engaging "Croatia Today" daily learning card for someone studying Croatian.

Location focus: ${location.city}, ${location.region} ${location.emoji}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "phrase": "<a useful Croatian phrase related to ${location.city} or daily life there>",
  "translation": "<English translation>",
  "pronunciation": "<phonetic pronunciation hint for English speakers>",
  "culturalFact": "<one fascinating, specific cultural fact about ${location.city} or Croatian culture — 1-2 sentences, vivid and surprising>",
  "tip": "<one practical Croatian language tip, grammar trick, or cultural etiquette tip — 1 sentence>",
  "category": "<one of: Greetings, Food & Drink, Travel, Shopping, Social, Culture>"
}

The phrase should be practical and conversational. The cultural fact should be specific — not generic tourism copy. Make it feel like insider knowledge.`;

  // Block 1: network errors only
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (fetchErr) {
    console.error('[daily-culture] network error calling Anthropic:', fetchErr.message);
    return err(502, 'AI temporarily unavailable', origin);
  }

  // Block 2: read body as text first — non-2xx responses may not be JSON
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error('[daily-culture] failed to read response body:', bodyErr.message);
    return err(502, 'AI temporarily unavailable', origin);
  }

  // Block 3: check ok status
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* body not JSON */
    }
    console.error(`[daily-culture] Anthropic ${res.status}`, errMsg);
    return err(502, 'AI unavailable', origin);
  }

  // Block 4: parse Anthropic JSON envelope
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error(
      '[daily-culture] JSON parse failed on Anthropic response:',
      rawBody.slice(0, 200),
    );
    return err(502, 'AI unavailable', origin);
  }

  const raw = data.content?.[0]?.text || '';

  // Parse JSON — strip any accidental markdown fences
  const jsonStr = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('[daily-culture] JSON parse failed:', raw.slice(0, 200));
    return err(502, 'Invalid AI response', origin);
  }

  // Attach location metadata
  parsed.city = location.city;
  parsed.region = location.region;
  parsed.locationEmoji = location.emoji;
  parsed.date = dateStr;

  // Cache at edge for 6 hours — same content all day globally
  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=21600, s-maxage=21600',
      ...corsHeaders(origin),
    },
  });
}
