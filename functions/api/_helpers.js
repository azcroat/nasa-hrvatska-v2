// Shared utilities for all Cloudflare Pages Functions in /functions/api/
// Import in each endpoint: import { sanitizeParam, corsHeaders, isAllowedOrigin, ok, err } from './_helpers.js';

/**
 * Sanitize a structured parameter (name, level, city, etc.) before interpolating
 * into a system prompt or using as a trusted value.
 *
 * IMPORTANT: Free-text user inputs (e.g. the learner's own message) must NEVER be
 * interpolated into system prompts. Pass them as the user message content instead,
 * so the model treats them as untrusted input rather than instructions.
 */
export function sanitizeParam(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  return String(value)
    // Normalize whitespace control characters to a single space
    .replace(/[\r\n\t]/g, ' ')
    // Remove characters commonly used for prompt/code injection
    .replace(/[`\\]/g, '')
    // Broad prompt-injection pattern: catch "ignore/disregard/override/forget … instructions/rules/prompt"
    // and variations like "ignore all previous" or "disregard the system prompt above"
    .replace(
      /\b(ignore|disregard|override|forget|bypass|jailbreak|system\s*prompt|act\s+as|pretend|you\s+are\s+now)\b[\s\S]{0,80}?\b(instruction|rule|above|below|prompt|constraint|boundary|limit)\b/gi,
      '[redacted]'
    )
    // Strip any HTML/XML tags
    .replace(/<[^>]*>/g, '')
    // Collapse repeated whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeLevel(level, valid = ["A1","A2","B1","B2","C1","C2"]) {
  return valid.includes(level) ? level : "B1";
}

export function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

export function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function ok(data, origin) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export function err(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}
