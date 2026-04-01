// Cloudflare Pages Function — Server timestamp for streak clock-manipulation resistance
// GET /api/server-time → { ts: number, iso: string }
// No auth required; no-store cache prevents CDN caching.

export async function onRequest() {
  return new Response(
    JSON.stringify({ ts: Date.now(), iso: new Date().toISOString() }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
