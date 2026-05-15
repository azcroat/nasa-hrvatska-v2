// Scene video endpoint — Cloudflare Pages Function
// GET /api/scene-video?scene=dubrovnik
//
// Returns a video URL for the requested Croatian scene.
// Priority: KV cache → Pexels API (if key configured) → Wikimedia Commons fallback
// Results are cached in KV (PUSH_SUBSCRIPTIONS namespace) for 7 days.
//
// Optional Cloudflare env vars:
//   PEXELS_API_KEY — free API key from pexels.com/api (200 req/hr, no cost)
//                    Without this, Wikimedia Commons public-domain videos are used.
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
import { log, logError } from './_logger.js';
import { getFirebaseUid } from './_verifyToken.js';

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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const SCENE_QUERIES = {
  dubrovnik: 'dubrovnik croatia scenic',
  dalmatian: 'dalmatian coast croatia sea',
  plitvice: 'plitvice lakes waterfall',
  zagreb: 'zagreb croatia city',
  labin: 'istria croatia',
  mostar: 'mostar bridge river',
  food: 'croatian food seafood',
};

// Wikimedia Commons public-domain videos — used when PEXELS_API_KEY is not configured.
// All files are CC0 / public domain, no attribution required for video playback.
const WIKIMEDIA_FALLBACKS = {
  dubrovnik:
    'https://upload.wikimedia.org/wikipedia/commons/5/5d/Dubrovnik_%2C_Croatia_in_Ultra_4K.webm',
  dalmatian: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Hvar%2CCroatia_in_Ultra_4K.webm',
  plitvice:
    'https://upload.wikimedia.org/wikipedia/commons/5/5c/Plitvice_Lakes_National_Park%2C_Croatia_in_Ultra_4k.webm',
  zagreb:
    'https://upload.wikimedia.org/wikipedia/commons/b/b4/Zagreb_old_city_tour_%2C_Croatia_in_Ultra_4K.webm',
  mostar: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Titov_most%2C_Mostar_082227.webm',
  labin:
    'https://upload.wikimedia.org/wikipedia/commons/3/39/-Piran_-360_vr_video_Part_2._-insta360x4.webm',
  // food: no suitable public-domain video — client falls back to Ken Burns image effect
};

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const scene = url.searchParams.get('scene')?.toLowerCase();

  if (!scene || !SCENE_QUERIES[scene]) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown scene' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Require Firebase auth — Pexels free quota is shared across all callers.
  // Without auth, a rotating-IP attacker can exhaust Pexels rate limit for real users.
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (FIREBASE_PROJECT_ID) {
    const _uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
    if (!_uid) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  }

  const allowed = await checkRateLimit(request, 30, env);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Check KV cache first (7-day TTL)
  const KV = env.PUSH_SUBSCRIPTIONS;
  const cacheKey = `scene-video-${scene}`;
  if (KV) {
    const cached = await KV.get(cacheKey, { type: 'json' }).catch(() => null);
    if (cached?.url) {
      log('scene-video', 'KV cache hit', { scene });
      return new Response(JSON.stringify({ ok: true, url: cached.url, cached: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  }

  const PEXELS_KEY = env.PEXELS_API_KEY;
  if (!PEXELS_KEY) {
    // No Pexels key — serve Wikimedia Commons public-domain video if available
    const wikiUrl = WIKIMEDIA_FALLBACKS[scene];
    if (wikiUrl) {
      // Cache the fallback URL so future requests skip this logic
      if (KV) {
        await KV.put(cacheKey, JSON.stringify({ url: wikiUrl }), { expirationTtl: 604800 }).catch(
          () => {},
        );
      }
      log('scene-video', 'Wikimedia fallback served', { scene });
      return new Response(JSON.stringify({ ok: true, url: wikiUrl, source: 'wikimedia' }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    // No fallback available for this scene — client falls back to Ken Burns image effect
    return new Response(JSON.stringify({ ok: false, error: 'Video service not configured' }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const query = SCENE_QUERIES[scene];
  const pexelsUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&size=medium&orientation=landscape`;

  let videoUrl = null;
  try {
    const res = await fetch(pexelsUrl, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Pexels ${res.status}`);

    const data = await res.json();
    const videos = data.videos || [];

    // Pick first video that has an HD or FHD file link
    for (const v of videos) {
      const files = (v.video_files || []).sort((a, b) => b.width - a.width);
      // Prefer 1280×720 or 1920×1080 — avoid 4K (too large) and SD (too small)
      const file = files.find(
        (f) => f.width >= 1280 && f.width <= 1920 && f.file_type === 'video/mp4',
      );
      if (file?.link) {
        videoUrl = file.link;
        break;
      }
      // Fallback: any MP4 ≥ 1280px wide
      const fallback = files.find((f) => f.width >= 1280 && f.file_type === 'video/mp4');
      if (fallback?.link) {
        videoUrl = fallback.link;
        break;
      }
    }
  } catch (e) {
    logError('scene-video', 'Pexels lookup failed', e, { scene });
    return new Response(JSON.stringify({ ok: false, error: 'Video lookup failed' }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  if (!videoUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'No suitable video found' }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Cache in KV for 7 days (604800 seconds)
  if (KV) {
    await KV.put(cacheKey, JSON.stringify({ url: videoUrl }), { expirationTtl: 604800 }).catch(
      () => {},
    );
  }

  return new Response(JSON.stringify({ ok: true, url: videoUrl }), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}
