// Cloudflare Pages Function — Azure TTS Proxy
// Keeps the Azure key server-side, never exposed to the browser

// IPA phoneme map for explicit Croatian words.
// Azure's content filter scans surface text — wrapping with IPA phoneme tags
// lets the neural voice pronounce them correctly without triggering the filter.
const PHONEME_MAP = [
  // jeb- family (most frequent)
  ['jebem ti mater',  'jɛbɛm ti matɛr'],
  ['jebem mu mater',  'jɛbɛm mu matɛr'],
  ['jebem ti',        'jɛbɛm ti'],
  ['jebem',           'jɛbɛm'],
  ['jebeš',           'jɛbɛʃ'],
  ['jebemo',          'jɛbɛmɔ'],
  ['jebote',          'jɛbɔtɛ'],
  ['jebiga',          'jɛbiga'],
  ['jebi ga',         'jɛbi ɡa'],
  ['jebi se',         'jɛbi sɛ'],
  ['jebi',            'jɛbi'],
  ['jebo te',         'jɛbɔ tɛ'],
  ['jebo',            'jɛbɔ'],
  ['ojebat',          'ɔjɛbaːt'],
  ['odjebi',          'ɔdjɛbi'],
  ['nabijem',         'nabijɛm'],
  // kurac family
  ['kurac od ovce',   'kuraʦ ɔd ɔvʦɛ'],
  ['kurvin sine',     'kurvin sinɛ'],
  ['kurvin',          'kurvin'],
  ['kurca',           'kurʦa'],
  ['kurcu',           'kurʦu'],
  ['kurcev',          'kurʦɛv'],
  ['kurac',           'kuraʦ'],
  // pizda / pička family
  ['pičkin dim',      'pitʃkin dim'],
  ['pičkin',          'pitʃkin'],
  ['pičku',           'pitʃku'],
  ['pičke',           'pitʃkɛ'],
  ['pička',           'pitʃka'],
  ['pizdu',           'pizdu'],
  ['pizde',           'pizdɛ'],
  ['pizda',           'pizda'],
  // šupak
  ['šupčić',          'ʃupt͡ʃit͡ɕ'],
  ['šupca',           'ʃuptsa'],
  ['šupak',           'ʃupak'],
  // sranje / govno
  ['sranje',          'sranʲɛ'],
  ['govnu',           'ɡɔvnu'],
  ['govnom',          'ɡɔvnɔm'],
  ['govno',           'ɡɔvnɔ'],
  // other
  ['đubre',           'd͡ʒubrɛ'],
  ['majmune',         'majmunɛ'],
];

function encodeForAzure(text) {
  let result = text;
  for (const [word, ipa] of PHONEME_MAP) {
    // Case-insensitive whole-word replacement
    const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, match =>
      `<phoneme alphabet="ipa" ph="${ipa}">${match}</phoneme>`
    );
  }
  return result;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const AZURE_KEY = env.AZURE_TTS_KEY;
  const PRIMARY_REGION = env.AZURE_TTS_REGION || "eastus";

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const allowed = ["nasahrvatska.com", "pages.dev", "localhost"];
  if (!allowed.some(d => origin.includes(d))) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!AZURE_KEY) {
    return new Response("TTS not configured", { status: 500 });
  }

  try {
    const { text, slow } = await request.json();
    if (!text || text.length > 500) {
      return new Response("Invalid text", { status: 400 });
    }

    const voice = slow ? "hr-HR-SreckoNeural" : "hr-HR-GabrijelaNeural";
    // Strip XML-special chars first, then apply phoneme encoding
    const safeText = text.replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;' }[c]));
    const encodedText = encodeForAzure(safeText);

    const ssml = slow
      ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="slow">${encodedText}</prosody></voice></speak>`
      : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}">${encodedText}</voice></speak>`;

    // Try primary region first, then common fallbacks
    const regions = [PRIMARY_REGION, "eastus", "eastus2", "westeurope", "northeurope", "westus2"]
      .filter((r, i, a) => a.indexOf(r) === i); // dedupe

    for (const region of regions) {
      const tokenRes = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Length": "0" } }
      );
      if (!tokenRes.ok) continue;
      const token = await tokenRes.text();

      const response = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
            "User-Agent": "NasaHrvatska/1.0",
          },
          body: ssml,
        }
      );

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
      // 400 = wrong region or voice issue — try next; other errors = stop
      if (response.status !== 400) break;
    }

    return new Response("Azure TTS unavailable", { status: 503 });
  } catch (e) {
    return new Response("TTS proxy error", { status: 500 });
  }
}
