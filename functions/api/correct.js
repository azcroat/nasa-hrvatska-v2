// Cloudflare Pages Function — AI Croatian Writing Correction
// Uses Anthropic Claude to correct Croatian writing and provide feedback

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname.endsWith(".pages.dev");
  } catch { return false; }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
  }

  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({
      corrected: "",
      score: 50,
      level: "AI correction unavailable",
      errors: [],
      encouragement: "Keep writing in Croatian — practice makes perfect!"
    }), {
      status: 200,
      headers: CORS,
    });
  }

  try {
    const { prompt, text } = await request.json();
    if (!text || text.length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid text" }), { status: 400, headers: CORS });
    }

    const systemPrompt = `You are a Croatian language teacher. The student was asked to write about: "${prompt}".

Analyze their Croatian text and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "corrected": "the corrected Croatian text",
  "score": 75,
  "level": "B1 - Intermediate",
  "errors": [
    {"original": "wrong word/phrase", "correct": "correct form", "rule": "brief grammar rule explanation"}
  ],
  "encouragement": "One encouraging sentence about their progress"
}

Score 0-100 based on grammar accuracy, vocabulary, and natural expression.
Level: A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper-Intermediate), C1 (Advanced).
List up to 5 most important errors. Be encouraging and specific.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      throw new Error("Anthropic API error " + response.status);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "{}";

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      // If JSON parse fails, return a graceful fallback
      result = {
        corrected: text,
        score: 60,
        level: "Analysis complete",
        errors: [],
        encouragement: "Great effort writing in Croatian! Keep practicing every day."
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS, "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(JSON.stringify({
      corrected: "",
      score: 0,
      level: "Error",
      errors: [],
      encouragement: "Keep writing — every sentence is progress!"
    }), {
      status: 200,
      headers: CORS,
    });
  }
}
