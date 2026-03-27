// Cloudflare Pages Function — TTS Proxy
// ElevenLabs (primary, no content filtering, native Croatian quality)
// Azure (fallback)

// ── ElevenLabs ────────────────────────────────────────────────────────────────
// eleven_multilingual_v2 handles Croatian natively with no content filtering.
// Voice: "Charlotte" — clear, neutral European female voice.
// Override voice by setting ELEVENLABS_VOICE_ID env var in Cloudflare.
const EL_DEFAULT_VOICE = "XB0fDUnXU5powFXDhCwa"; // Charlotte

async function tryElevenLabs(text, slow, apiKey, voiceId) {
  // Only force language_code='hr' when the text contains Croatian-specific diacritics (č,ć,š,ž,đ).
  // For ASCII-only text (English loanwords in Gen Z section, šatrovački without diacritics, etc.)
  // the multilingual model auto-detects correctly — forcing 'hr' on English words like
  // "Bussin" or "No cap" makes Charlotte apply Croatian phoneme rules to English, producing
  // unnatural pronunciation ("noh tsap" instead of "no cap").
  // Force Croatian when diacritics are present OR when common Croatian ASCII words appear.
  // Short Croatian sentences without diacritics (e.g. "Tko si ti?", "Kako si danas?",
  // "Kakav je pas?") were being auto-detected as the wrong language, causing poor quality.
  const hasCroatianChars = /[čćšžđČĆŠŽĐ]/.test(text) ||
    /\b(tko|gdje|kad|kako|kamo|kakav|kakva|kakvo|čiji|koliko|zašto|odakle|dokle|koji|koja|koje|sam|si|smo|ste|jest|jesi|jesu|nisam|nisi|nije|nismo|niste|nisu|imam|imaš|ima|imamo|imate|imaju|idem|ideš|ide|idemo|idete|idu|da|ne|bok|hvala|molim|dobar|dobra|dobro|dan|jutro|večer)\b/i.test(text);

  const body = {
    text,
    model_id: "eleven_multilingual_v2",
    ...(hasCroatianChars && { language_code: "hr" }), // Force Croatian when Croatian patterns detected
    voice_settings: {
      stability: 1.0,             // Max stability — fully neutral, no emotional variation.
                                  // At 0.88 the model "performs" loaded phrases (e.g. "Jebem ti mater"
                                  // gets screeched/shouted). 1.0 locks in flat, educational delivery.
      similarity_boost: 0.80,     // Slightly closer to Charlotte's neutral base (was 0.75)
      style: 0.0,                 // No style exaggeration — clean delivery
      use_speaker_boost: true,
    },
    speed: slow ? 0.68 : 0.88,   // 0.88 = clear measured pace; 0.68 = study mode
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
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
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    return res.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Azure (fallback) ──────────────────────────────────────────────────────────
// IPA phoneme map kept for reference — Azure hr-HR does NOT support IPA
// so these tags are stripped out. Azure remains as a network fallback only.
async function tryAzure(text, slow, azureKey, primaryRegion) {
  // Use GabrijelaNeural for both — consistent female voice. SreckoNeural was used
  // for slow but caused jarring gender switch mid-lesson. Prosody handles speed.
  const voice = "hr-HR-GabrijelaNeural";
  const safeText = text.replace(
    /[<>&"']/g,
    // eslint-disable-next-line security/detect-object-injection
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );

  const ssml = slow
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-25%">${safeText}</prosody></voice></speak>`
    : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="-8%">${safeText}</prosody></voice></speak>`;

  const regions = [primaryRegion, "eastus", "eastus2", "westeurope", "northeurope", "westus2"].filter(
    (r, i, a) => a.indexOf(r) === i
  );

  for (const region of regions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const tokenRes = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        { method: "POST", headers: { "Ocp-Apim-Subscription-Key": azureKey, "Content-Length": "0" }, signal: controller.signal }
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
          signal: controller.signal,
        }
      );

      if (response.ok) return response.arrayBuffer();
      if (response.status !== 400) break;
    } catch {
      // Timeout or network error — try next region
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname.endsWith(".pages.dev");
  } catch { return false; }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
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
