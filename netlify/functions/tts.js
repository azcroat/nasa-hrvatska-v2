// Netlify Function — Azure TTS Proxy
// Keeps the Azure key server-side, never exposed to the browser
const AZURE_KEY = process.env.AZURE_TTS_KEY;
const AZURE_REGION = process.env.AZURE_TTS_REGION || "westeurope";

exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Rate limit: check origin
  const origin = event.headers.origin || event.headers.referer || "";
  const allowed = ["nasahrvatska.com", "nasahrvatska.netlify.app", "localhost"];
  if (!allowed.some(d => origin.includes(d))) {
    return { statusCode: 403, body: "Forbidden" };
  }

  if (!AZURE_KEY) {
    return { statusCode: 500, body: "TTS not configured" };
  }

  try {
    const { text, slow } = JSON.parse(event.body);
    if (!text || text.length > 500) {
      return { statusCode: 400, body: "Invalid text" };
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
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
        },
        body: ssml
      }
    );

    if (!response.ok) {
      return { statusCode: response.status, body: "Azure TTS error" };
    }

    const buffer = await response.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, body: "TTS proxy error" };
  }
};
