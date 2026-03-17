// Cloudflare Pages Function — Azure TTS Proxy
// Keeps the Azure key server-side, never exposed to the browser

export async function onRequestGet(context) {
  const { env } = context;
  const AZURE_KEY = env.AZURE_TTS_KEY;
  const AZURE_REGION = env.AZURE_TTS_REGION || "westeurope";
  if (!AZURE_KEY) return new Response("NO KEY SET", { status: 200 });
  try {
    const r = await fetch(
      `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Length": "0" } }
    );
    const body = await r.text().catch(() => "");
    return new Response(`key_status=${r.status} region=${AZURE_REGION} key_prefix=${AZURE_KEY.substring(0,6)}`, { status: 200 });
  } catch(e) {
    return new Response("key_test_error: " + e.message, { status: 200 });
  }
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

    const response = await fetch(
      `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        },
        body: ssml,
      }
    );

    if (!response.ok) {
      const azureErr = await response.text().catch(() => "");
      return new Response("Azure TTS error " + response.status + " region=" + AZURE_REGION + ": " + azureErr, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response("TTS proxy error", { status: 500 });
  }
}
