// Cloudflare Pages Function — TTS Proxy
// ElevenLabs (primary, no content filtering, native Croatian quality)
// Azure (fallback)

// ── ElevenLabs ────────────────────────────────────────────────────────────────
// eleven_multilingual_v2 handles Croatian natively with no content filtering.
// Voice: "Charlotte" — clear, neutral European female voice.
// Override voice by setting ELEVENLABS_VOICE_ID env var in Cloudflare.
const EL_DEFAULT_VOICE = "XB0fDUnXU5powFXDhCwa"; // Charlotte

async function tryElevenLabs(text, slow, apiKey, voiceId) {
  const body = {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: slow ? 0.80 : 0.45,
      similarity_boost: 0.80,
      style: 0.0,
      use_speaker_boost: true,
    },
    speed: slow ? 0.80 : 0.90,
  };

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return null;
  return res.arrayBuffer();
}

// ── Azure (fallback) ──────────────────────────────────────────────────────────
// IPA phoneme map kept for reference — Azure hr-HR does NOT support IPA
// so these tags are stripped out. Azure remains as a network fallback only.
async function tryAzure(text, slow, azureKey, primaryRegion) {
  const voice = slow ? "hr-HR-SreckoNeural" : "hr-HR-GabrijelaNeural";
  const safeText = text.replace(
    /[<>&"']/g,
    // eslint-disable-next-line security/detect-object-injection
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );

  const ssml = slow
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="slow">${safeText}</prosody></voice></speak>`
    : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}">${safeText}</voice></speak>`;

  const regions = [primaryRegion, "eastus", "eastus2", "westeurope", "northeurope", "westus2"].filter(
    (r, i, a) => a.indexOf(r) === i
  );

  for (const region of regions) {
    const tokenRes = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: "POST", headers: { "Ocp-Apim-Subscription-Key": azureKey, "Content-Length": "0" } }
    );
    if (!tokenRes.ok) continue;
    const token = await tokenRes.text();

    const response = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "NasaHrvatska/1.0",
        },
        body: ssml,
      }
    );

    if (response.ok) return response.arrayBuffer();
    if (response.status !== 400) break;
  }
  return null;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const allowed = ["nasahrvatska.com", "pages.dev", "localhost"];
  if (!allowed.some((d) => origin.includes(d))) {
    return new Response("Forbidden", { status: 403 });
  }

  const ELEVENLABS_KEY = env.ELEVENLABS_API_KEY;
  const AZURE_KEY = env.AZURE_TTS_KEY;
  const PRIMARY_REGION = env.AZURE_TTS_REGION || "eastus";
  const VOICE_ID = env.ELEVENLABS_VOICE_ID || EL_DEFAULT_VOICE;

  if (!ELEVENLABS_KEY && !AZURE_KEY) {
    return new Response("TTS not configured", { status: 500 });
  }

  try {
    const { text, slow } = await request.json();
    if (!text || text.length > 500) {
      return new Response("Invalid text", { status: 400 });
    }

    let buffer = null;

    // 1. Try ElevenLabs (best quality, no content filtering)
    if (ELEVENLABS_KEY) {
      try {
        buffer = await tryElevenLabs(text, !!slow, ELEVENLABS_KEY, VOICE_ID);
      } catch {
        // network error — fall through to Azure
      }
    }

    // 2. Fall back to Azure
    if (!buffer && AZURE_KEY) {
      try {
        buffer = await tryAzure(text, !!slow, AZURE_KEY, PRIMARY_REGION);
      } catch {
        // fall through
      }
    }

    if (buffer) {
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new Response("TTS unavailable", { status: 503 });
  } catch {
    return new Response("TTS proxy error", { status: 500 });
  }
}
