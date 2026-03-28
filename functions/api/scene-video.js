/* eslint-disable security/detect-object-injection */
// Scene video endpoint — Cloudflare Pages Function
// GET /api/scene-video?scene=dubrovnik
//
// Returns a Pexels video URL for the requested Croatian scene.
// Results are cached in KV (PUSH_SUBSCRIPTIONS namespace) for 7 days.
// Falls back gracefully when PEXELS_API_KEY is not configured.
//
// Required Cloudflare env vars:
//   PEXELS_API_KEY — free API key from pexels.com/api (200 req/hr, no cost)
//
// Scene keys → Pexels search queries:
//   dubrovnik     → "dubrovnik croatia scenic"
//   dalmatian     → "dalmatian coast croatia sea"
//   plitvice      → "plitvice lakes croatia waterfall"
//   zagreb        → "zagreb croatia city"
//   labin         → "istria croatia"
//   mostar        → "mostar bridge river"
//   food          → "croatian food seafood"

import { checkRateLimit } from './_rateLimit.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SCENE_QUERIES = {
  dubrovnik: 'dubrovnik croatia scenic',
  dalmatian: 'dalmatian coast croatia sea',
  plitvice:  'plitvice lakes waterfall',
  zagreb:    'zagreb croatia city',
  labin:     'istria croatia',
  mostar:    'mostar bridge river',
  food:      'croatian food seafood',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const scene = url.searchParams.get('scene')?.toLowerCase();

  if (!scene || !SCENE_QUERIES[scene]) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown scene' }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }),
      { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  // Check KV cache first (7-day TTL)
  const KV = env.PUSH_SUBSCRIPTIONS;
  const cacheKey = `scene-video-${scene}`;
  if (KV) {
    const cached = await KV.get(cacheKey, { type: 'json' }).catch(() => null);
    if (cached?.url) {
      return new Response(JSON.stringify({ ok: true, url: cached.url, cached: true }),
        { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
  }

  const PEXELS_KEY = env.PEXELS_API_KEY;
  if (!PEXELS_KEY) {
    // No API key configured — client falls back to Ken Burns
    return new Response(JSON.stringify({ ok: false, error: 'Video service not configured' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const query = SCENE_QUERIES[scene];
  const pexelsUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&size=medium&orientation=landscape`;

  let videoUrl = null;
  try {
    const res = await fetch(pexelsUrl, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (!res.ok) throw new Error(`Pexels ${res.status}`);

    const data = await res.json();
    const videos = data.videos || [];

    // Pick first video that has an HD or FHD file link
    for (const v of videos) {
      const files = (v.video_files || []).sort((a, b) => b.width - a.width);
      // Prefer 1280×720 or 1920×1080 — avoid 4K (too large) and SD (too small)
      const file = files.find(f => f.width >= 1280 && f.width <= 1920 && f.file_type === 'video/mp4');
      if (file?.link) {
        videoUrl = file.link;
        break;
      }
      // Fallback: any MP4 ≥ 1280px wide
      const fallback = files.find(f => f.width >= 1280 && f.file_type === 'video/mp4');
      if (fallback?.link) {
        videoUrl = fallback.link;
        break;
      }
    }
  } catch (e) {
    console.error(`scene-video Pexels error (${scene}):`, e.message);
    return new Response(JSON.stringify({ ok: false, error: 'Video lookup failed' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  if (!videoUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'No suitable video found' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  // Cache in KV for 7 days (604800 seconds)
  if (KV) {
    await KV.put(cacheKey, JSON.stringify({ url: videoUrl }), { expirationTtl: 604800 }).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true, url: videoUrl }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
