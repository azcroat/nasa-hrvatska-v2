// Cloudflare Pages Function — returns current server timestamp
// Used by dateUtils.ts to get authoritative date for streak calculations
// (prevents timezone/device-clock bugs)

export async function onRequestGet({ request }) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), { status: 200, headers });
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
