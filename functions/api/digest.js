// Weekly progress digest email via Resend (resend.com — free 3,000 emails/month)
// Set RESEND_API_KEY in Cloudflare Pages environment variables.
// Call this endpoint from the frontend on Sunday with the user's stats.
// POST /api/digest  { email, name, xp, lessons, streakDays, wordsLearned }

import { checkRateLimit } from './_rateLimit.js';

function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return hostname === 'nasahrvatska.com'
      || hostname.endsWith('.nasahrvatska.com')
      || hostname === 'nasa-hrvatska-v2.pages.dev'
      || hostname.endsWith('.nasa-hrvatska-v2.pages.dev');
  } catch { return false; }
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/; // eslint-disable-line no-useless-escape

export async function onRequestPost(ctx) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (ctx.request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const origin = ctx.request.headers.get('origin') || ctx.request.headers.get('referer') || '';
  const isDev = ctx.env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  const allowed = await checkRateLimit(ctx.request, 5); // 5 per minute max
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
  }

  const RESEND_KEY = ctx.env.RESEND_API_KEY;
  if (!RESEND_KEY) return new Response(JSON.stringify({ ok: false, error: 'Service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  let body;
  try { body = await ctx.request.json(); } catch { return new Response('bad request', { status: 400, headers: corsHeaders }); }

  const { email, name, xp, lessons, streakDays, wordsLearned } = body;
  if (!email || !name) return new Response('missing fields', { status: 400, headers: corsHeaders });
  if (!EMAIL_RE.test(email) || /[\r\n\t%]/.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid email address.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  const safeName = esc(name);
  const safeXp = parseInt(xp) || 0;
  const safeLessons = parseInt(lessons) || 0;
  const safeStreak = parseInt(streakDays) || 0;
  const safeWords = parseInt(wordsLearned) || 0;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#0a1628,#0e7490);padding:32px 40px;color:#fff;text-align:center">
        <div style="font-size:13px;letter-spacing:.15em;opacity:.7;margin-bottom:8px">NAŠA HRVATSKA</div>
        <div style="font-size:26px;font-weight:900">Your Weekly Progress 🇭🇷</div>
      </div>
      <div style="padding:32px 40px">
        <p style="font-size:16px;color:#374151">Bog <strong>${safeName}</strong>! Here's what you achieved this week:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0">
          ${[
            ['⭐', 'Total XP', safeXp.toLocaleString()],
            ['📚', 'Lessons', safeLessons],
            ['🔥', 'Streak', `${safeStreak} days`],
            ['💬', 'Words', safeWords],
          ].map(([icon, label, val]) => `
            <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;border:1px solid #e2e8f0">
              <div style="font-size:24px">${icon}</div>
              <div style="font-size:18px;font-weight:900;color:#0f172a;margin:4px 0">${val}</div>
              <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">${label}</div>
            </div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:24px">
          <a href="https://nasahrvatska.com" style="display:inline-block;background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;text-decoration:none;border-radius:14px;padding:14px 32px;font-weight:700;font-size:15px">
            Continue Learning →
          </a>
        </div>
        <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px">
          Naša Hrvatska · nasahrvatska.com<br>
          <a href="https://nasahrvatska.com" style="color:#94a3b8">Unsubscribe</a>
        </p>
      </div>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Naša Hrvatska <hello@nasahrvatska.com>',
      to: [email],
      subject: `Your Croatian progress this week, ${safeName}! 🇭🇷`,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify({ ok: res.ok, ...data }), {
    status: res.ok ? 200 : 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://nasahrvatska.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
