// NPC greeting video — self-healing KV cache backed by D-ID
// GET /api/npc-video?portrait=barista
//
// First call for a portrait triggers D-ID generation (10-25s), caches URL in KV for 30 days.
// All subsequent calls return the cached URL instantly.
//
// Portrait keys match PORTRAIT_MAP in SpeakingAvatar.jsx:
//   barista, vendor, mature-woman, young-woman, grandmother,
//   mature-man, young-man, fisherman, tutor-hero, secretary
//
// Required env vars: DID_API_KEY, PUSH_SUBSCRIPTIONS (KV namespace)
// Portrait images must be publicly accessible at /images/portraits/{key}.webp

import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';
import { log, logError } from './_logger.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const VALID_PORTRAITS = new Set([
  'barista',
  'vendor',
  'mature-woman',
  'young-woman',
  'grandmother',
  'mature-man',
  'young-man',
  'fisherman',
  'tutor-hero',
  'secretary',
]);

// Croatian greeting + gender per portrait type
const NPC_GREETINGS = {
  barista: { text: 'Dobar dan! Što ćete popiti?', gender: 'female' },
  vendor: { text: 'Dobar dan! Čime vam mogu pomoći?', gender: 'female' },
  'mature-woman': { text: 'Dobar dan! Izvolite, molim.', gender: 'female' },
  'young-woman': { text: 'Bok! Što mogu učiniti za vas?', gender: 'female' },
  grandmother: { text: 'Dobro jutro, drago dijete! Sjednite, molim.', gender: 'female' },
  'mature-man': { text: 'Dobar dan! Što trebate?', gender: 'male' },
  'young-man': { text: 'Bok! Mogu li vam pomoći?', gender: 'male' },
  fisherman: { text: 'Dobar dan! Svježa riba danas, jako dobra!', gender: 'male' },
  'tutor-hero': { text: 'Dobar dan! Spremi se za učenje.', gender: 'female' },
  secretary: { text: 'Dobar dan! Čime vam mogu pomoći?', gender: 'female' },
};

const CROATIAN_VOICES = {
  female: 'hr-HR-GabrijelaNeural',
  male: 'hr-HR-SreckoNeural',
};

const KV_TTL = 60 * 60 * 24 * 30; // 30 days — D-ID video URLs are long-lived

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  const allowed = await checkRateLimit(request, 20, env);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: 'Rate limited' }), {
      status: 429,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Require Firebase auth — D-ID is paid (~$0.30+/video). Without auth gate, a rotating-IP
  // attacker can drain the budget. Cache miss → D-ID call → real money.
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  let _uid = null;
  if (FIREBASE_PROJECT_ID) {
    _uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
    if (!_uid) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  }

  // Per-user daily AI quota
  const _quota = await checkAIQuota(request, env, _uid, 1);
  if (!_quota.allowed) {
    return new Response(JSON.stringify({ error: 'quota_exceeded', resetAt: _quota.resetAt }), {
      status: 429,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const portrait = url.searchParams.get('portrait')?.toLowerCase();

  if (!portrait || !VALID_PORTRAITS.has(portrait)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown portrait' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const KV = env.PUSH_SUBSCRIPTIONS;
  const cacheKey = `npc-video-${portrait}`;

  // Return cached URL if available
  if (KV) {
    const cached = await KV.get(cacheKey, { type: 'json' }).catch(() => null);
    if (cached?.videoUrl) {
      log('npc-video', 'KV cache hit', { portrait });
      return new Response(JSON.stringify({ ok: true, videoUrl: cached.videoUrl, cached: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  }

  const DID_API_KEY = env.DID_API_KEY;
  if (!DID_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Avatar not configured' }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const npc = NPC_GREETINGS[portrait];
  if (!npc) {
    return new Response(JSON.stringify({ ok: false, error: 'No greeting for portrait' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const productionOrigin = isDev
    ? 'https://nasahrvatska.com'
    : origin.startsWith('http')
      ? new URL(origin).origin
      : 'https://nasahrvatska.com';
  const imageUrl = `${productionOrigin}/images/portraits/${portrait}.webp`;
  const voiceId = CROATIAN_VOICES[npc.gender] || CROATIAN_VOICES.female;
  const authHeader = `Basic ${btoa(DID_API_KEY + ':')}`;

  try {
    // Create D-ID talk
    const createRes = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: 'text',
          input: npc.text,
          provider: { type: 'microsoft', voice_id: voiceId },
        },
        config: { fluent: true, pad_audio: 0.25, stitch: true },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!createRes.ok) {
      const txt = await createRes.text().catch(() => '');
      logError('npc-video', 'D-ID create failed', new Error(txt.slice(0, 200)), {
        portrait,
        status: createRes.status,
      });
      return new Response(JSON.stringify({ ok: false, error: 'D-ID creation failed' }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const { id } = await createRes.json();
    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'No talk ID from D-ID' }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Poll for completion (up to 25 seconds)
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const pollRes = await fetch(`https://api.d-id.com/talks/${id}`, {
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(8000),
      });
      if (!pollRes.ok) continue;
      const pd = await pollRes.json();

      if (pd.status === 'done' && pd.result_url) {
        const videoUrl = pd.result_url;
        log('npc-video', 'D-ID generation complete', { portrait, pollAttempt: i + 1 });
        // Cache in KV for 30 days
        if (KV) {
          await KV.put(cacheKey, JSON.stringify({ videoUrl, portrait, generated: Date.now() }), {
            expirationTtl: KV_TTL,
          }).catch(() => {});
        }
        return new Response(JSON.stringify({ ok: true, videoUrl }), {
          status: 200,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      if (pd.status === 'error' || pd.status === 'rejected') {
        logError('npc-video', 'D-ID poll returned error status', new Error(pd.error || pd.status), {
          portrait,
        });
        return new Response(JSON.stringify({ ok: false, error: 'Generation failed' }), {
          status: 502,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
    }

    logError('npc-video', 'D-ID generation timed out after 10 polls', new Error('timeout'), {
      portrait,
    });
    return new Response(JSON.stringify({ ok: false, error: 'Timed out' }), {
      status: 504,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    logError('npc-video', 'Unhandled error', e, { portrait });
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
}
