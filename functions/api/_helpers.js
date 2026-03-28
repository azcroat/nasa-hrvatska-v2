// Shared utilities for all Cloudflare Pages Functions in /functions/api/
// Import in each endpoint: import { sanitizeParam, corsHeaders, isAllowedOrigin, ok, err } from './_helpers.js';

export function sanitizeParam(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[`\\]/g, '')
    .replace(/\b(ignore|disregard|override|forget|system\s+prompt|jailbreak|bypass)\b.*?\b(instruction|rule|above|prompt)\b/gi, '[redacted]')
    .replace(/<[^>]*>/g, '')
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
