// One-time announcement email sender
// Usage: node scripts/announce.js users.csv
// Requires: RESEND_API_KEY in environment
//   export RESEND_API_KEY=re_xxxx  (Mac/Linux)
//   set RESEND_API_KEY=re_xxxx     (Windows CMD)
//
// Get users.csv from Firebase Console:
//   Authentication → Users → (three-dot menu) → Download accounts → CSV

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { resolve } from 'path';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = 'Naša Hrvatska <hello@nasahrvatska.com>';
const SUBJECT = 'Big updates to Naša Hrvatska — we\'ve been busy 🇭🇷';

if (!RESEND_KEY) {
  console.error('\n❌  Set RESEND_API_KEY before running.\n');
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('\n❌  Provide path to CSV: node scripts/announce.js users.csv\n');
  process.exit(1);
}

// ── HTML email ───────────────────────────────────────────────────────────────
function buildEmail(name) {
  const greeting = name ? `Bok ${name},` : 'Bok,';
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
    <div style="color:rgba(255,255,255,.65);font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px">Naša Hrvatska</div>
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0;line-height:1.3">We&rsquo;ve been busy building<br>something special for you 🇭🇷</h1>
  </div>

  <!-- Body -->
  <div style="padding:36px 40px">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px">${greeting}</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px">
      Thank you for your patience while we&rsquo;ve been working hard behind the scenes.
      We&rsquo;ve made major improvements to Naša Hrvatska and we&rsquo;d love for you to come back and experience them.
    </p>

    <div style="background:#f8fafc;border-radius:14px;padding:20px 24px;margin-bottom:28px">
      <p style="font-weight:900;font-size:14px;color:#0e7490;text-transform:uppercase;letter-spacing:.08em;margin:0 0 16px">What&rsquo;s new</p>

      ${[
        ['🧠', 'Smarter learning', 'We upgraded to the SM-2 spaced repetition algorithm — the same science behind Anki. Words you struggle with come back sooner. Words you know get pushed further out. Your vocabulary now actually sticks.'],
        ['🎵', 'Song Lyrics Mode', 'Learn Croatian through real Croatian songs. Fill in the missing words as you listen — a proven method that makes vocabulary memorable. Find it in the Croatia → Immersion Hub.'],
        ['🛡️', 'Streak Freeze', 'Miss a day? Your streak is now protected. Earn streak freezes as you learn — so one busy day doesn\'t wipe out weeks of progress.'],
        ['🏆', 'Streak Milestones', '7 days, 30 days, 100 days — hitting these now triggers a real celebration. You\'ve earned it.'],
        ['👨‍👩‍👧‍👦', 'Easier family invites', 'Share a single link and family members join your leaderboard instantly. No more typing codes.'],
        ['📱', 'Better notifications', 'Daily practice reminders — and a special notification on your Croatian name day (imendan).'],
      ].map(([icon, title, desc]) => `
      <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px">${icon}</span>
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:15px;margin-bottom:3px">${title}</div>
          <div style="color:#64748b;font-size:14px;line-height:1.55">${desc}</div>
        </div>
      </div>`).join('')}
    </div>

    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px">
      We built this app for Croatian heritage families — for parents who want their children to know their language,
      for diaspora communities who want to stay connected to their roots. Your support means everything to us.
    </p>

    <div style="text-align:center;margin-bottom:32px">
      <a href="https://nasahrvatska.com"
         style="display:inline-block;background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;text-decoration:none;border-radius:14px;padding:16px 40px;font-weight:800;font-size:16px;letter-spacing:.01em">
        Come Back &amp; Explore →
      </a>
    </div>

    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px">
      Hvala vam — thank you, from the bottom of our hearts.
    </p>
    <p style="color:#374151;font-size:15px;font-weight:700;margin:0">
      — The Naša Hrvatska Team
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Naša Hrvatska · <a href="https://nasahrvatska.com" style="color:#94a3b8">nasahrvatska.com</a><br>
      You&rsquo;re receiving this because you created an account.
      <a href="https://nasahrvatska.com" style="color:#94a3b8">Unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── CSV parser (handles Firebase export format) ──────────────────────────────
async function parseEmails(filePath) {
  const users = [];
  const rl = createInterface({ input: createReadStream(resolve(filePath)), crlfDelay: Infinity });
  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (!headers) { headers = cols.map(h => h.toLowerCase()); continue; }
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const nameIdx  = headers.findIndex(h => h.includes('display') || h.includes('name'));
    const email = cols[emailIdx];
    const name  = nameIdx >= 0 ? cols[nameIdx] : '';
    if (email && email.includes('@')) users.push({ email, name: name || '' });
  }
  return users;
}

// ── Send via Resend ──────────────────────────────────────────────────────────
async function send(email, name) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], subject: SUBJECT, html: buildEmail(name) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const users = await parseEmails(csvPath);
console.log(`\n📬  Sending to ${users.length} users...\n`);

let sent = 0, failed = 0;
for (const { email, name } of users) {
  try {
    await send(email, name);
    sent++;
    process.stdout.write(`  ✓ ${email}\n`);
  } catch (e) {
    failed++;
    process.stdout.write(`  ✗ ${email} — ${e.message}\n`);
  }
  // 2 per second to respect Resend rate limits
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n✅  Done. ${sent} sent, ${failed} failed.\n`);
