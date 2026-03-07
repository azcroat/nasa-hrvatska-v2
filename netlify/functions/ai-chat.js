// Netlify Function — Gemini AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser

const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Models to try in order — fall back if one is unavailable
const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-cache",
};

function ok(body) {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}
function err(status, message) {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

exports.handler = async function(event) {
  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return err(405, "Method not allowed — use POST");
  }

  if (!GEMINI_KEY) {
    return err(500, "AI_KEY_MISSING: The GEMINI_API_KEY environment variable is not set in Netlify. Go to Site Settings → Environment Variables and add it.");
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return err(400, "Invalid JSON in request body");
  }

  const { messages, systemPrompt, mode } = body;
  if (!messages || !Array.isArray(messages) || !systemPrompt) {
    return err(400, "Missing required fields: messages (array) and systemPrompt");
  }

  // ── Build Gemini contents — must start with user, strictly alternate ────────
  // Filter to only real messages (strip hints/system messages)
  let rawMsgs = messages.filter(m => m.role === "user" || m.role === "assistant");

  // Convert to Gemini roles
  let contents = rawMsgs.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  // Gemini requires first message to be from "user" — drop leading model messages
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }

  // Enforce strict alternation: if two consecutive same-role messages appear,
  // merge them (join text) so the array stays valid
  const merged = [];
  for (const msg of contents) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      // Append text to previous message instead of adding a duplicate role
      merged[merged.length - 1].parts[0].text += "\n" + msg.parts[0].text;
    } else {
      merged.push(msg);
    }
  }
  contents = merged;

  // Must have at least one user message
  if (contents.length === 0 || contents[0].role !== "user") {
    return err(400, "No valid user messages to send");
  }

  // ── Generation config ────────────────────────────────────────────────────────
  const genConfig = {
    temperature: mode === "evaluate" ? 0.2 : 0.85,
    maxOutputTokens: mode === "evaluate" ? 1600 : 400,
    topP: 0.9,
    topK: 40,
  };
  // Only set responseMimeType for evaluate — some model versions don't support it
  // We handle this gracefully below
  const wantJson = mode === "evaluate";
  if (wantJson) {
    genConfig.responseMimeType = "application/json";
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: genConfig,
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",      threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  // ── Try each model in order ──────────────────────────────────────────────────
  let lastError = "";
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // 400 with responseMimeType for older models — retry without it
        if (res.status === 400 && wantJson) {
          const payloadNoMime = { ...payload, generationConfig: { ...genConfig } };
          delete payloadNoMime.generationConfig.responseMimeType;
          const res2 = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadNoMime),
          });
          const data2 = await res2.json();
          if (res2.ok) {
            const text2 = extractText(data2);
            if (text2) return ok({ text: text2, model });
          }
        }
        lastError = data.error?.message || `HTTP ${res.status} from Gemini`;
        continue; // try next model
      }

      // Check for safety block or empty candidates
      const candidate = data.candidates?.[0];
      if (!candidate) {
        lastError = "Gemini returned no candidates (possible safety block or quota issue)";
        continue;
      }
      if (candidate.finishReason === "SAFETY") {
        // Rephrase as a soft in-character message rather than a hard error
        return ok({ text: "Izvini, ne mogu odgovoriti na to pitanje. Pokušajmo nešto drugo! (Safety filter triggered — try rephrasing.)", model });
      }

      const text = extractText(data);
      if (!text) {
        lastError = `Empty response from ${model} (finishReason: ${candidate.finishReason || "unknown"})`;
        continue;
      }

      return ok({ text, model });

    } catch(fetchErr) {
      lastError = `Network error calling ${model}: ${fetchErr.message}`;
      continue;
    }
  }

  // All models failed
  return err(502, `AI unavailable — all models failed. Last error: ${lastError}`);
};

function extractText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}
