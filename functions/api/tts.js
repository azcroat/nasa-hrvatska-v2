// Cloudflare Pages Function — TTS Proxy
// Two voice paths:
//   gabrijela (default): Azure hr-HR-GabrijelaNeural → Google Translate → Edge TTS → Google Cloud
//   charlotte (opt-in):  ElevenLabs Charlotte eleven_multilingual_v2 → Azure hr-HR-GabrijelaNeural
// Client falls back to Web Speech API when this endpoint returns 503.

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';

// ── Azure TTS ─────────────────────────────────────────────────────────────────
// hr-HR-GabrijelaNeural: native Croatian Neural voice.
// Phonemically accurate for all Croatian diacritics (č, ć, š, ž, đ) and pitch accent.
// Prosody rate: -8% normal, -25% slow mode (study pace).
// Regional failover: tries each region in order until one succeeds.
async function tryAzure(text, slow, azureKey, primaryRegion) {
  const voice = 'hr-HR-GabrijelaNeural';
  const safeText = text.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
  );

  const ssml = slow
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-25%">${safeText}</prosody></voice></speak>`
    : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-8%">${safeText}</prosody></voice></speak>`;

  const regions = [
    primaryRegion,
    'eastus',
    'eastus2',
    'westeurope',
    'northeurope',
    'westus2',
  ].filter((r, i, a) => r && a.indexOf(r) === i);

  for (const region of regions) {
    try {
      // Use separate per-fetch timeouts so a slow token fetch does not eat into
      // the time budget for the TTS synthesis fetch (shared controller bug).
      const tokenRes = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: 'POST',
          headers: { 'Ocp-Apim-Subscription-Key': azureKey, 'Content-Length': '0' },
          signal: AbortSignal.timeout(5000),
        },
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
          signal: AbortSignal.timeout(8000),
        },
      );

      if (response.ok) return response.arrayBuffer();
      if (response.status !== 400) break; // 400 = bad SSML, no point retrying other regions
    } catch {
      // Timeout or network error — try next region
    }
  }
  return null;
}

// ── ElevenLabs TTS ───────────────────────────────────────────────────────────
// Charlotte voice (XB0fDUnXU5powFXDhCwa) via eleven_multilingual_v2 model.
// Supports Croatian (hr) natively. More emotive prosody than Azure; slight
// non-native accent on Croatian diacritics — offered as an explicit opt-in.
// Slow mode: speed=0.75 (ElevenLabs native speed control, range 0.7–1.2).
async function tryElevenLabs(text, slow, apiKey) {
  if (!apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: 'hr',
        voice_settings: {
          stability: slow ? 0.65 : 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
          speed: slow ? 0.75 : 1.0,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Google Translate TTS ──────────────────────────────────────────────────────
// Unofficial Google Translate speech endpoint — Croatian (hr), no API key.
// Simple HTTP GET; returns audio/mpeg. Works reliably from Cloudflare Workers.
// Capped at 200 chars — sufficient for all vocabulary words and short phrases.
async function tryGoogleTranslateTTS(text, slow) {
  const trimmed = text.slice(0, 200);
  const url =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(trimmed)}&tl=hr&client=gtx` +
    `&ttsspeed=${slow ? '0.3' : '1'}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 11; Tablet Build/RQ3A.210805.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
        Referer: 'https://translate.google.com/',
        Accept: 'audio/mpeg, audio/mp3, audio/*, */*',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    // Accept audio/mpeg, audio/mp3, or any binary response
    if (!ct.includes('audio') && !ct.includes('mpeg') && !ct.includes('octet-stream')) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Microsoft Edge TTS ────────────────────────────────────────────────────────
// hr-HR-GabrijelaNeural via Edge browser's speech synthesis endpoint.
// Kept as backup — WebSocket from Cloudflare Workers can be unreliable.
async function tryEdgeTTS(text, slow, edgeTtsToken) {
  if (!edgeTtsToken) return null; // No token configured — skip this provider
  const voice = 'hr-HR-GabrijelaNeural';
  const rate = slow ? '-25%' : '-8%';
  const safeText = text.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
  );
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='hr-HR'><voice name='${voice}'><prosody rate='${rate}'>${safeText}</prosody></voice></speak>`;
  const connId = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=${edgeTtsToken}&ConnectionId=${connId}`;

  return new Promise((resolve, reject) => {
    let ws;
    const chunks = [];
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      return reject(e);
    }

    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch (closeErr) {
        void closeErr;
      }
      reject(new Error('edge-tts timeout'));
    }, 12000);

    ws.addEventListener('open', () => {
      const now = new Date().toISOString().replace(/Z$/, '000Z');
      const reqId = crypto.randomUUID().replace(/-/g, '').toUpperCase();
      ws.send(
        `X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`,
      );
      ws.send(
        `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${now}\r\nPath:ssml\r\n\r\n${ssml}`,
      );
    });

    ws.addEventListener('message', (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();
          if (chunks.length === 0) {
            reject(new Error('edge-tts no audio'));
            return;
          }
          const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
          const merged = new Uint8Array(totalLen);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          resolve(merged.buffer);
        }
      } else {
        // Binary frame — Cloudflare Workers deliver WebSocket binary as ArrayBuffer.
        // Parse the 2-byte header to find where audio data starts.
        let ab;
        if (event.data instanceof ArrayBuffer) {
          ab = event.data;
        } else if (event.data && typeof event.data.arrayBuffer === 'function') {
          // Fallback for Blob-like objects (shouldn't occur in Workers but guard anyway)
          event.data
            .arrayBuffer()
            .then((buf) => {
              const view = new DataView(buf);
              const headerLen = view.getUint16(0);
              const audioStart = 2 + headerLen;
              if (buf.byteLength > audioStart) chunks.push(buf.slice(audioStart));
            })
            .catch(() => {});
          return;
        }
        if (!ab) return;
        const view = new DataView(ab);
        const headerLen = view.getUint16(0);
        const audioStart = 2 + headerLen;
        if (ab.byteLength > audioStart) chunks.push(ab.slice(audioStart));
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
    ws.addEventListener('close', () => {
      clearTimeout(timeout);
    });
  });
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
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const b64url = (s) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
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
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
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
          speakingRate: slow ? 0.7 : 0.9,
          pitch: 0,
        },
      }),
      signal: controller.signal,
    });
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
    if (isDev && hostname === 'localhost') return true; // dev server only — never allow-all
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
  // Echo the request origin so the browser's CORS check passes for any allowed origin.
  // Fall back to the production domain for null-origin (PWA standalone, Capacitor native).
  const allowOrigin = origin || 'https://nasahrvatska.com';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'X-TTS-Backends',
    Vary: 'Origin',
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
  // Default to production-safe mode when ENVIRONMENT is not set.
  // Using !== 'production' would open all origins if the env var is misconfigured.
  const isDev = env.ENVIRONMENT === 'development';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders(origin) });
  }

  const allowed = await checkRateLimit(request, 60, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Require Firebase auth to prevent unbounded Azure/Google TTS billing.
  // Unauthenticated callers (including rotating-IP attackers) are rejected before any API call.
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (FIREBASE_PROJECT_ID) {
    const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
    if (!uid) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }
  }

  const AZURE_KEY = env.AZURE_TTS_KEY;
  const PRIMARY_REGION = env.AZURE_TTS_REGION || 'westeurope';
  const ELEVENLABS_KEY = env.ELEVENLABS_API_KEY || null;
  // Google TTS uses the Firebase service account already in Cloudflare — no separate key required.
  const GOOGLE_SA_JSON = env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_TTS_KEY || null;

  // Diagnostic header — tells the client exactly which backends are available.
  // Visible in the debug overlay via the [TTS] log entries.
  const diagBackends =
    [
      AZURE_KEY ? 'azure' : null,
      ELEVENLABS_KEY ? 'elevenlabs' : null,
      'gtranslate',
      'edge',
      GOOGLE_SA_JSON ? 'google' : null,
    ]
      .filter(Boolean)
      .join(',') || 'none';

  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response('Invalid content type', { status: 400, headers: corsHeaders(origin) });
    }
    const body = await request.json();
    const text = body.text;
    const slow = body.slow === true;
    // 'charlotte' = ElevenLabs Charlotte voice; anything else = Azure Gabriela (default)
    const voice = body.voice === 'charlotte' ? 'charlotte' : 'gabrijela';

    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response('Invalid text', { status: 400, headers: corsHeaders(origin) });
    }

    // ── Edge cache (POST responses aren't auto-cached by Cloudflare) ──────────
    // Voice is included in the key so Gabriela and Charlotte audio never collide.
    const cacheKey = new Request(
      `https://tts-cache.internal/v3/${voice}/${encodeURIComponent(text.slice(0, 400))}?slow=${slow}`,
      { method: 'GET' },
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

    if (voice === 'charlotte') {
      // ── Charlotte path: ElevenLabs first, Azure Gabriela as fallback ────────
      if (ELEVENLABS_KEY) {
        try {
          buffer = await tryElevenLabs(text, slow, ELEVENLABS_KEY);
        } catch {
          /* fall through to Azure */
        }
      }
      if (!buffer && AZURE_KEY) {
        try {
          buffer = await tryAzure(text, slow, AZURE_KEY, PRIMARY_REGION);
        } catch {
          /* fall through */
        }
      }
    } else {
      // ── Gabriela path (default): Azure → Google Translate → Edge → Google ───
      // ── 1. Azure hr-HR-GabrijelaNeural (primary) ────────────────────────────
      if (AZURE_KEY) {
        try {
          buffer = await tryAzure(text, slow, AZURE_KEY, PRIMARY_REGION);
        } catch {
          /* fall through */
        }
      }

      // ── 2. Google Translate TTS hr (free, HTTP, no key required) ───────────
      if (!buffer) {
        try {
          buffer = await tryGoogleTranslateTTS(text, slow);
        } catch {
          /* fall through */
        }
      }

      // ── 3. Microsoft Edge hr-HR-GabrijelaNeural (WebSocket backup) ──────────
      if (!buffer) {
        try {
          buffer = await tryEdgeTTS(text, slow, env.EDGE_TTS_TOKEN || null);
        } catch {
          /* fall through */
        }
      }

      // ── 4. Google hr-HR-Wavenet-B (backup if service account configured) ────
      if (!buffer && GOOGLE_SA_JSON) {
        try {
          buffer = await tryGoogle(text, slow, GOOGLE_SA_JSON);
        } catch {
          /* fall through */
        }
      }
    }

    // ── 503 → client falls back to Web Speech API ────────────────────────────
    if (!buffer) {
      const whyFailed =
        voice === 'charlotte'
          ? [
              ELEVENLABS_KEY ? 'elevenlabs-failed' : 'elevenlabs-not-configured',
              AZURE_KEY ? 'azure-failed' : 'azure-not-configured',
            ].join(',')
          : [
              AZURE_KEY ? 'azure-failed' : 'azure-not-configured',
              'gtranslate-failed',
              'edge-failed',
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
      try {
        edgeCache.put(cacheKey, ttsResponse.clone());
      } catch {
        /* ignore */
      }
    }

    return ttsResponse;
  } catch {
    return new Response('TTS proxy error', { status: 500, headers: corsHeaders(origin) });
  }
}
