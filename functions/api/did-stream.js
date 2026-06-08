// Cloudflare Pages Function — D-ID talking avatar video generation
// POST /api/did-stream
// Body: { imageUrl: "https://...", text: "Croatian text", gender: "female"|"male" }
// Returns: { videoUrl: "https://...", id: "..." }
//
// Requires: DID_API_KEY in Cloudflare environment variables
// D-ID authentication: Basic auth with API key as username, empty password
// Typical generation time: 10-25 seconds (polled internally, up to 25s)

import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders, sanitizeParam, ok, err } from './_helpers.js';

const CROATIAN_VOICES = {
  female: 'hr-HR-GabrijelaNeural',
  male: 'hr-HR-SreckoNeural',
};

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = await requireAuthedAI(context, { cost: 3, rateLimit: 5 });
  if (!gate.ok) return gate.response;
  const { origin, isDev } = gate;

  const DID_API_KEY = env.DID_API_KEY;
  if (!DID_API_KEY) return err(503, 'Avatar video not configured', origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON', origin);
  }

  const { imageUrl, text, gender = 'female' } = body;
  if (!imageUrl || !text) return err(400, 'Missing imageUrl or text', origin);

  // Validate imageUrl is from our own domain or a known CDN
  try {
    const u = new URL(imageUrl);
    const allowed = ['nasahrvatska.com', 'nasa-hrvatska-v2.pages.dev', 'localhost'];
    if (!isDev && !allowed.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))) {
      return err(400, 'Invalid imageUrl domain', origin);
    }
  } catch {
    return err(400, 'Invalid imageUrl', origin);
  }

  const safeText = sanitizeParam(text, 400);

  const voiceId = CROATIAN_VOICES[gender] || CROATIAN_VOICES.female;

  // D-ID uses Basic auth: base64(apiKey:)
  const authHeader = `Basic ${btoa(DID_API_KEY + ':')}`;

  try {
    // 1. Create the talk
    const createRes = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: 'text',
          input: safeText,
          provider: { type: 'microsoft', voice_id: voiceId },
        },
        config: { fluent: true, pad_audio: 0.25, stitch: true },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!createRes.ok) {
      const txt = await createRes.text().catch(() => '');
      console.error(`[did-stream] create ${createRes.status}: ${txt.slice(0, 300)}`);
      return err(502, 'Avatar creation failed', origin);
    }

    const { id } = await createRes.json();
    if (!id) return err(502, 'No talk ID returned from D-ID', origin);

    // 2. Poll for completion — up to 25 seconds (10 × 2.5s)
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const pollRes = await fetch(`https://api.d-id.com/talks/${id}`, {
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(8000),
      });
      if (!pollRes.ok) continue;
      const pd = await pollRes.json();
      if (pd.status === 'done' && pd.result_url) {
        return ok({ videoUrl: pd.result_url, id }, origin);
      }
      if (pd.status === 'error' || pd.status === 'rejected') {
        console.error('[did-stream] poll error:', pd.error || pd.status);
        return err(502, 'Avatar video generation failed', origin);
      }
    }

    return err(504, 'Avatar video timed out — image may not be publicly accessible', origin);
  } catch (e) {
    console.error('[did-stream] error:', e.message);
    return err(500, 'Server error', origin);
  }
}
