// Cloudflare Pages Function — Server timestamp for streak clock-manipulation resistance
// GET /api/server-time → { ts: number, iso: string }
// No auth required; no-store cache prevents CDN caching.

import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';

export async function onRequest({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const isDev  = env.ENVIRONMENT !== 'production';

  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403 });
  }

  // 60 req/min per IP — generous for legitimate use, blocks flood abuse
  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  return new Response(
    JSON.stringify({ ts: Date.now(), iso: new Date().toISOString() }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders(origin),
      },
    }
  );
}
