// Netlify Function — Anthropic Claude AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // Fast, cost-effective, excellent for language tutoring

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-cache",
};

function ok(body)       { return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) }; }
function err(status, message) { return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) }; }

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return err(405, "Method not allowed — use POST");

  // Origin check — only allow requests from our own domains
  const origin = event.headers.origin || event.headers.referer || "";
  const allowed = ["nasahrvatska.com", "nasahrvatska.netlify.app", "localhost"];
  if (!allowed.some(d => origin.includes(d))) {
    return err(403, "Forbidden");
  }

  if (!ANTHROPIC_KEY) {
    return err(500, "AI_KEY_MISSING: The ANTHROPIC_API_KEY environment variable is not set in Netlify. Go to Site Settings → Environment Variables and add it.");
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return err(400, "Invalid JSON in request body"); }

  const { messages, systemPrompt, mode } = body;
  if (!messages || !Array.isArray(messages) || !systemPrompt) {
    return err(400, "Missing required fields: messages (array) and systemPrompt");
  }

  // ── Build Anthropic messages array ──────────────────────────────────────────
  // Filter to only real messages (strip hints), map roles
  let anthropicMsgs = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content || "" }));

  // Anthropic requires strictly alternating user/assistant starting with user
  // Drop leading assistant messages
  while (anthropicMsgs.length > 0 && anthropicMsgs[0].role !== "user") {
    anthropicMsgs.shift();
  }

  // Merge consecutive same-role messages
  const merged = [];
  for (const msg of anthropicMsgs) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }
  anthropicMsgs = merged;

  if (anthropicMsgs.length === 0 || anthropicMsgs[0].role !== "user") {
    return err(400, "No valid user messages to send");
  }

  // ── Call Anthropic Messages API ─────────────────────────────────────────────
  const maxTokens = mode === "evaluate" ? 1600 : 400;

  const payload = {
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: anthropicMsgs,
  };

  let res, data;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    data = await res.json();
  } catch(fetchErr) {
    return err(502, "Network error calling Anthropic API: " + fetchErr.message);
  }

  if (!res.ok) {
    const msg = data?.error?.message || ("Anthropic API error: HTTP " + res.status);
    return err(res.status, msg);
  }

  // Extract text from response
  const text = data?.content?.[0]?.text?.trim() || "";
  if (!text) {
    return err(500, "Anthropic returned an empty response. Stop reason: " + (data?.stop_reason || "unknown"));
  }

  return ok({ text, model: MODEL });
};
