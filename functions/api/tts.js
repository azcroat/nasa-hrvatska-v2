// Cloudflare Pages Function — Azure TTS Proxy
// Keeps the Azure key server-side, never exposed to the browser

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
    const rate = slow ? "-30%" : "+0%";
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody rate="${rate}">${text.replace(/[<>&"']/g, '')}</prosody></voice></speak>`;

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
      return new Response("Azure TTS error", { status: response.status });
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
