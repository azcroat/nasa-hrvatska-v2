// ONE-SHOT announcement sender — DELETE after use
// GET /api/announce-send?token=nasahrvatska2026

const TOKEN = 'nasahrvatska2026';
const FROM  = 'Naša Hrvatska <hello@nasahrvatska.com>';
const SUBJECT = 'Naša Hrvatska just got a lot better \uD83C\uDDF3\uD83C\uDDF7';

const USERS = [
  { email: 'nmetes7@gmail.com',                   name: 'Nino' },
  { email: 'iva5666@gmail.com',                   name: 'Iva' },
  { email: 'klaraschreiner@icloud.com',           name: 'Klara' },
  { email: 'tomislavschreiner@icloud.com',        name: 'Tomislav' },
  { email: 'stemberga@msn.com',                   name: 'Ana' },
  { email: 'zmetes91@gmail.com',                  name: 'Zrinka' },
  { email: 'ivafrankie@icloud.com',               name: 'Iva' },
  { email: 'nschreiner@live.com',                 name: 'Nadalina' },
  { email: 'bretkins92@gmail.com',                name: 'Kate and Ray' },
  { email: 'mila.misura@gmail.com',               name: 'Mila' },
  { email: 'm13milicevic@yahoo.com',              name: 'Mila' },
  { email: 'jschreiner75@gmail.com',              name: 'Jeff' },
  { email: 'hi@nikolametes.com',                  name: 'Nino' },
  { email: 'ivam13193@gmail.com',                 name: 'Iva' },
  { email: 'fmilicevic@yahoo.com',                name: 'Hrvat' },
  { email: 'tomislavschreiner@icloid.com',        name: 'Tomislav' },
  { email: 'mandymetes62@gmail.com',              name: 'Mandy' },
];

function buildEmail(name) {
  const greeting = name ? `Bog ${name},` : 'Bog,';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.10)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0a1628 0%,#0c3d6b 60%,#0e7490 100%);padding:40px 40px 32px;text-align:center">
    <div style="display:flex;justify-content:center;margin-bottom:16px">
      <div style="width:60px;height:6px;background:#D4002D;border-radius:2px 0 0 2px"></div>
      <div style="width:60px;height:6px;background:#F5F5F5"></div>
      <div style="width:60px;height:6px;background:#003DA5;border-radius:0 2px 2px 0"></div>
    </div>
    <div style="color:rgba(255,255,255,.65);font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px">Na&#353;a Hrvatska</div>
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0;line-height:1.3">A big round of updates<br>just landed &#x1F1ED;&#x1F1F7;</h1>
  </div>

  <!-- Body -->
  <div style="padding:36px 40px">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px">${greeting}</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px">
      We&rsquo;ve just shipped the most thorough update to Na&#353;a Hrvatska since launch &mdash;
      dozens of fixes, accuracy improvements, and polish across every part of the app.
      If you haven&rsquo;t been in recently, now is a great time to come back.
    </p>

    <div style="background:#f8fafc;border-radius:14px;padding:20px 24px;margin-bottom:28px">
      <p style="font-weight:900;font-size:14px;color:#0e7490;text-transform:uppercase;letter-spacing:.08em;margin:0 0 16px">What&rsquo;s new</p>

      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F3C6;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">Streak badges that actually fire</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">Hit 7, 30, 60, or 100 days and you&rsquo;ll now get a real celebration. The milestone badges were silently broken &mdash; they&rsquo;re working perfectly now.</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F4D6;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">Baka&rsquo;s Letters &mdash; all 16 chapters</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">The final chapters of Baka&rsquo;s story are now fully accessible. Read all 16 chapters of authentic family letters from the homeland.</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F3AF;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">More accurate Croatian throughout</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">We combed through every lesson, drill, and phrase. Grammar examples, case usage, and vocabulary are now more precise and authentic.</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F3B5;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">Lyrics mode on mobile</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">The fill-in-the-blank song lyrics exercise now works cleanly on all screen sizes, including smaller phones.</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F4BE;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">Prestige &amp; streak sync fixed</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">Prestige resets and streak recoveries now save to your account immediately &mdash; no more silent rollbacks when switching devices.</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">&#x1F50D;</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">Search modal fixed</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">The global search (magnifying glass icon) was invisible on some devices. It&rsquo;s now fully visible and working everywhere.</div>
        </div>
      </div>
    </div>

    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px">
      We built this for Croatian heritage families &mdash; for parents who want their children to know their language,
      for diaspora communities who want to stay connected to the homeland. Your support means everything to us.
    </p>

    <div style="text-align:center;margin-bottom:32px">
      <a href="https://nasahrvatska.com"
         style="display:inline-block;background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;text-decoration:none;border-radius:14px;padding:16px 40px;font-weight:800;font-size:16px;letter-spacing:.01em">
        Come Back &amp; Explore &#x2192;
      </a>
    </div>

    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px">
      Hvala vam &mdash; thank you, from the bottom of our hearts.
    </p>
    <p style="color:#374151;font-size:15px;font-weight:700;margin:0">
      &mdash; The Na&#353;a Hrvatska Team
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Na&#353;a Hrvatska &middot; <a href="https://nasahrvatska.com" style="color:#94a3b8">nasahrvatska.com</a><br>
      You&rsquo;re receiving this because you created an account.
    </p>
  </div>

</div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (token !== TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const RESEND_KEY = env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const results = [];
  for (const { email, name } of USERS) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [email], subject: SUBJECT, html: buildEmail(name) }),
      });
      const body = await res.json();
      results.push({ email, ok: res.ok, status: res.status, id: body.id || null, error: body.message || null });
      // small delay to respect rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      results.push({ email, ok: false, error: e.message });
    }
  }

  const sent   = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  return new Response(JSON.stringify({ sent, failed, results }, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
