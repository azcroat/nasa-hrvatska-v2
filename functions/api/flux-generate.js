// Cloudflare Pages Function — AI image generation via Replicate FLUX.1-schnell
// POST /api/flux-generate
// Body (vocab):  { type: "vocab", word: "plaža", meaning: "beach" }
// Body (scene):  { type: "scene", sceneText: "...", storyTitle: "..." }
// Body (custom): { type: "custom", prompt: "..." }
// Returns: { imageUrl: "https://..." }

import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin, sanitizeParam, ok, err } from './_helpers.js';

function buildVocabPrompt(word, meaning) {
  const clean = meaning.toLowerCase().replace(/^to\s+/, '');
  return `Travel photography, Croatia: ${clean}. Mediterranean golden light, vivid saturated colors, cinematic composition, no text, no watermarks, no people's faces close-up. Canon 5D, f/2.8.`;
}

function buildScenePrompt(sceneText, storyTitle) {
  const scene = sceneText.slice(0, 100);
  const title = storyTitle.slice(0, 50);
  return `Watercolor illustration, Croatian setting: "${title}" — ${scene}. Warm Mediterranean palette, impressionist storybook style, scenic, no text, no watermarks.`;
}

function buildCustomPrompt(userPrompt) {
  return `Croatian travel photograph: ${userPrompt.slice(0, 200)}. Mediterranean atmosphere, cinematic light, no text, no watermarks.`;
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) return err(403, 'Forbidden', origin);

  const allowed = await checkRateLimit(request, 4);
  if (!allowed) return err(429, 'Rate limited', origin);

  const REPLICATE_API_KEY = env.REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY) return err(503, 'Image generation not configured', origin);

  let body;
  try { body = await request.json(); } catch { return err(400, 'Invalid JSON', origin); }

  const { type = 'vocab' } = body;
  let prompt;
  let aspectRatio = '1:1';

  if (type === 'scene') {
    const sceneText = sanitizeParam(body.sceneText || '', 200);
    const storyTitle = sanitizeParam(body.storyTitle || '', 80);
    if (!sceneText) return err(400, 'Missing sceneText', origin);
    prompt = buildScenePrompt(sceneText, storyTitle);
    aspectRatio = '16:9';
  } else if (type === 'custom') {
    const userPrompt = sanitizeParam(body.prompt || '', 250);
    if (!userPrompt) return err(400, 'Missing prompt', origin);
    prompt = buildCustomPrompt(userPrompt);
    aspectRatio = '16:9';
  } else {
    const word = sanitizeParam(body.word || '', 80);
    const meaning = sanitizeParam(body.meaning || '', 150);
    if (!word || !meaning) return err(400, 'Missing word or meaning', origin);
    prompt = buildVocabPrompt(word, meaning);
    aspectRatio = '1:1';
  }

  try {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: 'webp',
          output_quality: 78,
          num_inference_steps: 4,
        },
      }),
      signal: AbortSignal.timeout(55000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[flux-generate] Replicate ${res.status}: ${text.slice(0, 300)}`);
      return err(502, 'Image generation failed', origin);
    }

    const data = await res.json();

    // Synchronous result (Prefer: wait resolved immediately)
    if (data.output && Array.isArray(data.output) && data.output[0]) {
      return ok({ imageUrl: data.output[0] }, origin);
    }

    // Poll if still processing (rare with Prefer: wait but handles edge cases)
    if (data.id) {
      const pollUrl = `https://api.replicate.com/v1/predictions/${data.id}`;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2500));
        const poll = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!poll.ok) break;
        const pd = await poll.json();
        if (pd.status === 'succeeded' && pd.output?.[0]) {
          return ok({ imageUrl: pd.output[0] }, origin);
        }
        if (pd.status === 'failed' || pd.status === 'canceled') {
          return err(502, 'Image generation failed', origin);
        }
      }
    }

    return err(504, 'Image generation timed out', origin);
  } catch (e) {
    console.error('[flux-generate] error:', e.message);
    return err(500, 'Server error', origin);
  }
}
