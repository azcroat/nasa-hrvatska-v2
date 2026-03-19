// Cloudflare Pages Function — Anthropic Claude AI Conversation Proxy
// Keeps the API key server-side; never exposed to the browser

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-cache",
};

function ok(body)           { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders }); }
function err(status, msg)   { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders }); }

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  const allowed = isDev ? ["nasahrvatska.com", "pages.dev", "localhost"] : ["nasahrvatska.com", "pages.dev"];
  if (!allowed.some(d => origin.includes(d))) return err(403, "Forbidden");

  if (!ANTHROPIC_KEY) return err(500, "AI_KEY_MISSING: Add ANTHROPIC_API_KEY in Cloudflare Pages → Settings → Environment Variables.");

  let body;
  try { body = await request.json(); }
  catch { return err(400, "Invalid JSON in request body"); }

  const { messages, systemPrompt, mode } = body;
  if (!messages || !Array.isArray(messages) || !systemPrompt) {
    return err(400, "Missing required fields: messages (array) and systemPrompt");
  }

  let anthropicMsgs = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content || "" }));

  while (anthropicMsgs.length > 0 && anthropicMsgs[0].role !== "user") {
    anthropicMsgs.shift();
  }

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

  const payload = {
    model: MODEL,
    max_tokens: mode === "evaluate" || mode === "writeeval" ? 1600 : (mode === "correct" || mode === "translate") ? 200 : 400,
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
  } catch (fetchErr) {
    return err(502, "Network error calling Anthropic API: " + fetchErr.message);
  }

  if (!res.ok) {
    return err(res.status, data?.error?.message || ("Anthropic API error: HTTP " + res.status));
  }

  const text = data?.content?.[0]?.text?.trim() || "";
  if (!text) return err(500, "Anthropic returned an empty response. Stop reason: " + (data?.stop_reason || "unknown"));

  return ok({ text, model: MODEL });
}
