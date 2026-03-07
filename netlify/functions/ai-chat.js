// Netlify Function — Gemini AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ALLOWED = ["nasahrvatska.com", "nasahrvatska.netlify.app", "localhost"];

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const origin = event.headers.origin || event.headers.referer || "";
  if (!ALLOWED.some(d => origin.includes(d))) return { statusCode: 403, body: "Forbidden" };

  if (!GEMINI_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY not configured in Netlify env vars" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { messages, systemPrompt, mode } = body;
  if (!messages || !Array.isArray(messages) || !systemPrompt) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing messages or systemPrompt" }) };
  }

  // Gemini requires strictly alternating user/model roles starting with user.
  // Filter out hint messages and ensure correct roles.
  const contents = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  // Gemini rejects empty contents array
  if (!contents.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "No valid messages" }) };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`;

  const genConfig = { temperature: mode === "evaluate" ? 0.2 : 0.88, maxOutputTokens: mode === "evaluate" ? 1400 : 350 };
  if (mode === "evaluate") genConfig.responseMimeType = "application/json";

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: genConfig,
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",    threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",   threshold: "BLOCK_ONLY_HIGH" },
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data.error?.message || "Gemini API error" }) };
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({ text })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Proxy error: " + e.message }) };
  }
};
