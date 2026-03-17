// Cloudflare Pages Function — Azure TTS Proxy
// Keeps the Azure key server-side, never exposed to the browser

export async function onRequestGet(context) {
  // Diagnostic endpoint (GET /api/tts)
  return new Response("TTS proxy running", { status: 200 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const AZURE_KEY = env.AZURE_TTS_KEY;
  const AZURE_REGION = env.AZURE_TTS_REGION || "westeurope";

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
    const safeText = text.replace(/[<>&"']/g, '');
    const ssml = slow
      ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="slow">${safeText}</prosody></voice></speak>`
      : `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}">${safeText}</voice></speak>`;

    // Try regions in order — if AZURE_TTS_REGION is set use it first, then try common fallbacks
    const regionsToTry = [AZURE_REGION];
    if (AZURE_REGION === "westeurope") regionsToTry.push("eastus", "eastus2", "northeurope", "westus2");

    let response = null;
    let usedRegion = AZURE_REGION;
    for (const region of regionsToTry) {
      const tokenRes = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Length": "0" } }
      );
      if (!tokenRes.ok) continue;
      const token = await tokenRes.text();
      const r = await fetch(
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
      if (r.ok || r.status !== 400) { response = r; usedRegion = region; break; }
    }
    if (!response) response = await fetch(
      `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3", "User-Agent": "NasaHrvatska/1.0" }, body: ssml }
    );

    if (!response.ok) {
      const azureErr = await response.text().catch(() => "");
      return new Response("Azure TTS error " + response.status + " region=" + usedRegion + ": " + azureErr, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-TTS-Region": usedRegion,
      },
    });
  } catch (e) {
    return new Response("TTS proxy error: " + e.message, { status: 500 });
  }
}
