// Cloudflare Pages Function — TTS Proxy
// ElevenLabs (primary, no content filtering, native Croatian quality)
// Azure (fallback)

import { checkRateLimit } from './_rateLimit.js';

// ── ElevenLabs ────────────────────────────────────────────────────────────────
// eleven_flash_v2_5: 32-language model, ~75ms latency, 50% cheaper than v2, full Croatian support.
// Voice: "Charlotte" (EL_DEFAULT_VOICE) — clear, neutral European female voice, English/Swedish-trained.
// Charlotte approximates Croatian phonemes — ć/č and đ/dž are handled incorrectly for native speakers.
// For Croatian text, Azure hr-HR-GabrijelaNeural is used when Charlotte is the active voice, as it is
// a phonemically accurate native Croatian neural voice.
// To use a Croatian ElevenLabs voice instead, set ELEVENLABS_VOICE_ID env var in Cloudflare — when a
// custom voice ID is configured, the operator's choice is trusted and ElevenLabs remains primary.
const EL_DEFAULT_VOICE = "XB0fDUnXU5powFXDhCwa"; // Charlotte (English/Swedish-trained)

async function tryElevenLabs(text, slow, apiKey, voiceId, stream = false) {
  // Only force language_code='hr' when the text contains Croatian-specific diacritics (č,ć,š,ž,đ).
  // For ASCII-only text (English loanwords in Gen Z section, šatrovački without diacritics, etc.)
  // the multilingual model auto-detects correctly — forcing 'hr' on English words like
  // "Bussin" or "No cap" makes Charlotte apply Croatian phoneme rules to English, producing
  // unnatural pronunciation ("noh tsap" instead of "no cap").
  // Force Croatian when diacritics are present OR when common Croatian ASCII words appear.
  // Short Croatian sentences without diacritics (e.g. "Tko si ti?", "Kako si danas?",
  // "Kakav je pas?") were being auto-detected as the wrong language, causing poor quality.
  const hasCroatianChars = /[čćšžđČĆŠŽĐ]/.test(text) ||
    /\b(tko|gdje|kad|kako|kamo|kakav|kakva|kakvo|čiji|koliko|zašto|odakle|dokle|koji|koja|koje|sam|si|smo|ste|jest|jesi|jesu|nisam|nisi|nije|nismo|niste|nisu|imam|imaš|ima|imamo|imate|imaju|idem|ideš|ide|idemo|idete|idu|da|ne|bok|hvala|molim|dobar|dobra|dobro|dan|jutro|večer|uskrs|uskrsna|uskrsne|uskrsni|uskrsno|pisanica|pisanice|janje|janjetina|hren|sunka|blagoslov|blagoslovi|procesija|procesije|svetkovina|svetkovine|tjedan|tjedna|petak|nedjelja|nedjelje|proljetni|utorak|srijeda|subota|slavlje|slavljenje|cestitam|cestitamo|cestitati|tradicija|tradicije|tradicionalni|obiteljski|obiteljska|obiteljsko|obitelji|obred|obredi|misa|crkveni|crkva|krizma|korizma|post|postiti|molitva|molitve|hrana|jelo|jela|stol|blagovanje|blaguje|proslava|proslave|proslaviti|vjera|vjere|vjernik|crkvi|svecano|svecana|svecani|blagdan|blagdani|narod|naroda|kultura|kulture|kulturni|povijest|povijesti|povjesni|domovina|domovine|domovinski|sloboda|slobode|nada|nade|ljubav|ljubavi|radost|radosti|mir|mira|sretan|sretna|sretno|veseo|vesela|veselo|srce|srca|zemlja|zemlje|grad|grada|more|mora|otok|otoka|planina|planine|rijeka|rijeke|ucenje|uciti|ucim|ucis|uci|ucimo|ucite|uce|jezik|jezika|razgovor|razgovora|govoriti|govorim|govori|govorimo|razumjeti|razumijem|razumije|pisati|pisem|pise|pisemo|citati|citat|citam|cita|citamo|putovanje|putovati|putujem|putuje|prijatelj|prijatelji|prijatelja|baka|dida|tata|mama|sestra|brat|stric|teta|ujak|unuk|unuka|posjet|posjeta|posjetiti|slavonija|dalmacija|zagreb|split|dubrovnik|zadar|rijeka|osijek|varazdin|pula|sibenik|trogir|hvar|vis|brac|korcula|krk|rab|lika|istra|slavonski|dalmatinski|primorski|licko|zagorski|kulen|sarma|pasticada|buzara|prstaci|brudet|peka|soparnik|fritule|krostule|kroasan|makovnjaca|orehnjaca|kruh|vino|rakija|medica|travarica|kava|kafe|sir|prsut|kobasica|salata|juha|riba|zubatac|lubin|spar|tuna|skusa|kozice|hobotnica|lignje|skampi|kamenice|punjene|paprike|lonac|grah|gulas|specijalitet|restoran|konoba|kavana|caffe|bar|pekara|trznica|tvornica|bolnica|skola|fakultet|sveuciliste|knjiznica|muzej|kazaliste|kino|stadion|luka|kolodvor|aerodrom|hotel|hostel|apartman|kuca|stan|vila|dvorac|tvrdjava|most|cesta|ulica|trg|park|plaza|sumska)\b/i.test(text);

  const body = {
    text,
    model_id: "eleven_flash_v2_5",
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
    if (stream) return res; // Return Response so body can be piped directly
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
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

// ── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders(origin) });
  }

  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders(origin) });
  }

  const ELEVENLABS_KEY = env.ELEVENLABS_API_KEY;
  const AZURE_KEY = env.AZURE_TTS_KEY;
  const PRIMARY_REGION = env.AZURE_TTS_REGION || "eastus";
  const VOICE_ID = env.ELEVENLABS_VOICE_ID || EL_DEFAULT_VOICE;

  if (!ELEVENLABS_KEY && !AZURE_KEY) {
    return new Response("TTS not configured", { status: 500, headers: corsHeaders(origin) });
  }

  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response("Invalid content type", { status: 400 });
    }
    const body = await request.json();
    const text = body.text;
    const slow = body.slow === true; // explicit boolean check
    const wantStream = body.stream === true;
    // Client voice preference: 'gabrijela' | 'charlotte' | (absent = auto)
    const clientVoice = ['gabrijela', 'charlotte'].includes(body.voice) ? body.voice : 'auto';
    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response("Invalid text", { status: 400 });
    }

    // Streaming path — pipe ElevenLabs response body directly to client (~75ms to first byte)
    // Azure does not support streaming mode.
    if (wantStream && ELEVENLABS_KEY) {
      const elevenLabsRes = await tryElevenLabs(text, slow, ELEVENLABS_KEY, VOICE_ID, true);
      if (elevenLabsRes) {
        return new Response(elevenLabsRes.body, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked',
            ...corsHeaders(origin),
          },
        });
      }
      // If ElevenLabs streaming failed, fall through to buffered path
    }

    // Check Cloudflare edge cache first (POST responses aren't auto-cached)
    const cacheKey = new Request(
      `https://tts-cache.internal/v1/${encodeURIComponent(text.slice(0, 400))}?slow=${slow}&voice=${clientVoice}`,
      { method: "GET" }
    );
    let edgeCache;
    try {
      edgeCache = caches.default;
      const cached = await edgeCache.match(cacheKey);
      if (cached) return cached;
    } catch {
      edgeCache = null; // Cache API unavailable — proceed without caching
    }

    let buffer = null;

    // Determine if text is Croatian
    const hasCroatianChars = /[čćšžđČĆŠŽĐ]/.test(text) ||
      /\b(tko|gdje|kad|kako|kamo|kakav|kakva|kakvo|čiji|koliko|zašto|odakle|dokle|koji|koja|koje|sam|si|smo|ste|jest|jesi|jesu|nisam|nisi|nije|nismo|niste|nisu|imam|imaš|ima|imamo|imate|imaju|idem|ideš|ide|idemo|idete|idu|da|ne|bok|hvala|molim|dobar|dobra|dobro|dan|jutro|večer|uskrs|uskrsna|uskrsne|uskrsni|uskrsno|pisanica|pisanice|janje|janjetina|hren|sunka|blagoslov|blagoslovi|procesija|procesije|svetkovina|svetkovine|tjedan|tjedna|petak|nedjelja|nedjelje|proljetni|utorak|srijeda|subota|slavlje|slavljenje|cestitam|cestitamo|cestitati|tradicija|tradicije|tradicionalni|obiteljski|obiteljska|obiteljsko|obitelji|obred|obredi|misa|crkveni|crkva|krizma|korizma|post|postiti|molitva|molitve|hrana|jelo|jela|stol|blagovanje|blaguje|proslava|proslave|proslaviti|vjera|vjere|vjernik|crkvi|svecano|svecana|svecani|blagdan|blagdani|narod|naroda|kultura|kulture|kulturni|povijest|povijesti|povjesni|domovina|domovine|domovinski|sloboda|slobode|nada|nade|ljubav|ljubavi|radost|radosti|mir|mira|sretan|sretna|sretno|veseo|vesela|veselo|srce|srca|zemlja|zemlje|grad|grada|more|mora|otok|otoka|planina|planine|rijeka|rijeke|ucenje|uciti|ucim|ucis|uci|ucimo|ucite|uce|jezik|jezika|razgovor|razgovora|govoriti|govorim|govori|govorimo|razumjeti|razumijem|razumije|pisati|pisem|pise|pisemo|citati|citat|citam|cita|citamo|putovanje|putovati|putujem|putuje|prijatelj|prijatelji|prijatelja|baka|dida|tata|mama|sestra|brat|stric|teta|ujak|unuk|unuka|posjet|posjeta|posjetiti|slavonija|dalmacija|zagreb|split|dubrovnik|zadar|rijeka|osijek|varazdin|pula|sibenik|trogir|hvar|vis|brac|korcula|krk|rab|lika|istra|slavonski|dalmatinski|primorski|licko|zagorski|kulen|sarma|pasticada|buzara|prstaci|brudet|peka|soparnik|fritule|krostule|kroasan|makovnjaca|orehnjaca|kruh|vino|rakija|medica|travarica|kava|kafe|sir|prsut|kobasica|salata|juha|riba|zubatac|lubin|spar|tuna|skusa|kozice|hobotnica|lignje|skampi|kamenice|punjene|paprike|lonac|grah|gulas|specijalitet|restoran|konoba|kavana|caffe|bar|pekara|trznica|tvornica|bolnica|skola|fakultet|sveuciliste|knjiznica|muzej|kazaliste|kino|stadion|luka|kolodvor|aerodrom|hotel|hostel|apartman|kuca|stan|vila|dvorac|tvrdjava|most|cesta|ulica|trg|park|plaza|sumska)\b/i.test(text);

    // Voice routing:
    //   clientVoice='gabrijela' → Azure GabrijelaNeural always (native Croatian)
    //   clientVoice='charlotte' → ElevenLabs Charlotte always (natural English-trained)
    //   clientVoice='auto'      → Azure for Croatian text, Charlotte otherwise
    const useAzurePrimary =
      clientVoice === 'gabrijela' ||
      (clientVoice === 'auto' && hasCroatianChars && VOICE_ID === EL_DEFAULT_VOICE);

    const useElPrimary = clientVoice === 'charlotte';

    if (useAzurePrimary && AZURE_KEY) {
      // 1. Try Azure first (native Croatian phonemes)
      try {
        buffer = await tryAzure(text, slow, AZURE_KEY, PRIMARY_REGION);
      } catch {
        // fall through to ElevenLabs
      }
    }

    // 2. Try ElevenLabs (primary when charlotte preference, or fallback otherwise)
    if (!buffer && ELEVENLABS_KEY && (useElPrimary || !useAzurePrimary || !buffer)) {
      try {
        buffer = await tryElevenLabs(text, slow, ELEVENLABS_KEY, VOICE_ID);
      } catch {
        // network error — fall through
      }
    }

    // 3. Final fallback: Azure for any remaining failures
    if (!buffer && AZURE_KEY && !useAzurePrimary) {
      try {
        buffer = await tryAzure(text, slow, AZURE_KEY, PRIMARY_REGION);
      } catch {
        // fall through
      }
    }

    if (buffer) {
      const ttsResponse = new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          ...corsHeaders(origin),
        },
      });
      // Store in edge cache asynchronously (don't block response)
      if (edgeCache) {
        try { edgeCache.put(cacheKey, ttsResponse.clone()); } catch { /* ignore */ }
      }
      return ttsResponse;
    }

    return new Response("TTS unavailable", { status: 503, headers: corsHeaders(origin) });
  } catch {
    return new Response("TTS proxy error", { status: 500 });
  }
}
