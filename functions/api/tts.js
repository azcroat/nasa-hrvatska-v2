// Cloudflare Pages Function — TTS Proxy
// Azure hr-HR-GabrijelaNeural (primary) → Google hr-HR-Wavenet-B (backup)
// Client falls back to Web Speech API when this endpoint returns 503.

import { checkRateLimit } from './_rateLimit.js';

// ── Azure TTS ─────────────────────────────────────────────────────────────────
// hr-HR-GabrijelaNeural: native Croatian Neural voice.
// Phonemically accurate for all Croatian diacritics (č, ć, š, ž, đ) and pitch accent.
// Prosody rate: -8% normal, -25% slow mode (study pace).
// Regional failover: tries each region in order until one succeeds.
async function tryAzure(text, slow, azureKey, primaryRegion) {
  const voice = 'hr-HR-GabrijelaNeural';
  const safeText = text.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c])
  );

  const ssml = slow
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-25%">${safeText}</prosody></voice></speak>`
    : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-8%">${safeText}</prosody></voice></speak>`;

  const regions = [primaryRegion, 'eastus', 'eastus2', 'westeurope', 'northeurope', 'westus2'].filter(
    (r, i, a) => r && a.indexOf(r) === i
  );

  for (const region of regions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const tokenRes = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: 'POST',
          headers: { 'Ocp-Apim-Subscription-Key': azureKey, 'Content-Length': '0' },
          signal: controller.signal,
        }
      );
      if (!tokenRes.ok) continue;
      const token = await tokenRes.text();

      const response = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
            'User-Agent': 'NasaHrvatska/1.0',
          },
          body: ssml,
          signal: controller.signal,
        }
      );

      if (response.ok) return response.arrayBuffer();
      if (response.status !== 400) break; // 400 = bad SSML, no point retrying other regions
    } catch {
      // Timeout or network error — try next region
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

// ── Google Cloud TTS ──────────────────────────────────────────────────────────
// hr-HR-Wavenet-B: native Croatian Neural voice (same phoneme quality tier as Azure).
// Uses the Firebase service account already stored in FIREBASE_SERVICE_ACCOUNT_JSON.
// One-time setup: enable the Cloud Text-to-Speech API at:
//   https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
async function _getGoogleAccessToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const now = Math.floor(Date.now() / 1000);
  const b64url = (s) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const sigInput = new TextEncoder().encode(`${header}.${payload}`);
  const sigBuffer = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, sigInput);
  const sig = b64url(String.fromCharCode(...new Uint8Array(sigBuffer)));
  const jwt = `${header}.${payload}.${sig}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) return null;
  const { access_token } = await tokenRes.json();
  return access_token || null;
}

async function tryGoogle(text, slow, serviceAccountJson) {
  let accessToken;
  try {
    accessToken = await _getGoogleAccessToken(serviceAccountJson);
    if (!accessToken) return null;
  } catch {
    return null;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'hr-HR', name: 'hr-HR-Wavenet-B', ssmlGender: 'FEMALE' },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: slow ? 0.70 : 0.90,
            pitch: 0,
          },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.audioContent) return null;
    // audioContent is base64-encoded MP3 — decode to ArrayBuffer
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// `localhost` is always allowed regardless of isDev — it is the Capacitor native
// WebView origin (androidScheme: 'https' sets Origin: https://localhost).
// External browsers cannot send Origin: https://localhost, so this is safe.
function isAllowedOrigin(origin, isDev) {
  if (!origin) return true; // PWA standalone mode / no-origin requests
  try {
    const hostname = new URL(origin).hostname;
    if (hostname === 'localhost') return true; // Capacitor native WebView (all envs)
    if (isDev) return true; // dev server — allow all origins
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch { return false; }
}

function corsHeaders(origin) {
  // Echo the request origin so the browser's CORS check passes for any allowed origin.
  // Fall back to wildcard for null-origin / no-origin requests (PWA standalone).
  const allowOrigin = origin || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'X-TTS-Backends',
    'Vary': 'Origin',
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders(origin) });
  }

  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  const AZURE_KEY   = env.AZURE_TTS_KEY;
  const PRIMARY_REGION = env.AZURE_TTS_REGION || 'eastus';
  // Google TTS uses the Firebase service account already in Cloudflare — no separate key required.
  const GOOGLE_SA_JSON = env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_TTS_KEY || null;

  // Diagnostic header — tells the client exactly which backends are available.
  // Visible in the debug overlay via the [TTS] log entries.
  const diagBackends = [AZURE_KEY ? 'azure' : null, GOOGLE_SA_JSON ? 'google' : null].filter(Boolean).join(',') || 'none';

  if (!AZURE_KEY && !GOOGLE_SA_JSON) {
    return new Response('TTS not configured — set AZURE_TTS_KEY or enable FIREBASE_SERVICE_ACCOUNT_JSON', {
      status: 503,
      headers: { ...corsHeaders(origin), 'X-TTS-Backends': diagBackends },
    });
  }

  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response('Invalid content type', { status: 400, headers: corsHeaders(origin) });
    }
    const body = await request.json();
    const text = body.text;
    const slow = body.slow === true;

    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response('Invalid text', { status: 400, headers: corsHeaders(origin) });
    }

    // ── Edge cache (POST responses aren't auto-cached by Cloudflare) ──────────
    const cacheKey = new Request(
      `https://tts-cache.internal/v2/${encodeURIComponent(text.slice(0, 400))}?slow=${slow}`,
      { method: 'GET' }
    );
    let edgeCache;
    try {
      edgeCache = caches.default;
      const cached = await edgeCache.match(cacheKey);
      if (cached) return cached;
    } catch {
      edgeCache = null;
    }

    let buffer = null;

    // ── 1. Azure hr-HR-GabrijelaNeural (primary) ──────────────────────────────
    if (AZURE_KEY) {
      try { buffer = await tryAzure(text, slow, AZURE_KEY, PRIMARY_REGION); } catch { /* fall through */ }
    }

    // ── 2. Google hr-HR-Wavenet-B (backup) ───────────────────────────────────
    if (!buffer && GOOGLE_SA_JSON) {
      try { buffer = await tryGoogle(text, slow, GOOGLE_SA_JSON); } catch { /* fall through */ }
    }

    // ── 503 → client falls back to Web Speech API ────────────────────────────
    if (!buffer) {
      const whyFailed = [
        AZURE_KEY ? 'azure-failed' : 'azure-not-configured',
        GOOGLE_SA_JSON ? 'google-failed' : 'google-not-configured',
      ].join(',');
      return new Response(`TTS unavailable — ${whyFailed}`, {
        status: 503,
        headers: { ...corsHeaders(origin), 'X-TTS-Backends': diagBackends },
      });
    }

    const ttsResponse = new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders(origin),
      },
    });

    // Store in Cloudflare edge cache asynchronously (non-blocking)
    if (edgeCache) {
      try { edgeCache.put(cacheKey, ttsResponse.clone()); } catch { /* ignore */ }
    }

    return ttsResponse;
  } catch {
    return new Response('TTS proxy error', { status: 500, headers: corsHeaders(origin) });
  }
}
