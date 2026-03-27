// Cloudflare Pages Function — Support Ticket via Resend
// POST /api/contact { type, subject, description, replyEmail, userName, userLevel, userXp }
// Sends a formatted support email to the admin (ADMIN_EMAIL env var).

const CORS = {
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
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

const TYPE_COLORS = {
  bug:     { bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626", label: "🐛 Bug Report" },
  feature: { bg: "#eff6ff", border: "#93c5fd", badge: "#2563eb", label: "💡 Feature Request" },
  content: { bg: "#fefce8", border: "#fde047", badge: "#ca8a04", label: "📝 Content Error" },
  question:{ bg: "#f0fdf4", border: "#86efac", badge: "#16a34a", label: "❓ Question" },
  other:   { bg: "#faf5ff", border: "#c4b5fd", badge: "#7c3aed", label: "💬 Other" },
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response("Forbidden", { status: 403 });
  }

  const RESEND_KEY  = env.RESEND_API_KEY;
  const ADMIN_EMAIL = env.ADMIN_EMAIL;
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_EMAIL environment variable is not configured");
    return new Response(JSON.stringify({ ok: false, error: "Contact service is temporarily unavailable." }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Contact not configured." }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid content type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  let body;
  try { body = await request.json(); }
  catch { return new Response("Bad request", { status: 400 }); }

  const { type, subject, description, replyEmail, userName, userLevel, userXp } = body;

  const VALID_TYPES = ["bug", "feature", "content", "question", "other"];
  if (!VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid type." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (!type || !subject || !description) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (subject.length > 120 || description.length > 2000) {
    return new Response(JSON.stringify({ ok: false, error: "Content too long." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (replyEmail && !EMAIL_RE.test(replyEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email address." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (replyEmail && /[\r\n]/.test(replyEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email address." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

  // eslint-disable-next-line security/detect-object-injection
  const typeInfo = TYPE_COLORS[type] || TYPE_COLORS.other;
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const ticketId = Date.now().toString(36).toUpperCase();
  const safeSubject = esc(subject);
  const safeReplyEmail = esc(replyEmail);
  const safeUserName = esc(userName || "Anonymous");

  const replyBlock = replyEmail ? `
    <div style="margin-top:20px;padding:16px 20px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:11px;font-weight:700;color:#166534;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Reply To</div>
        <div style="font-size:14px;color:#15803d;font-weight:700">${safeReplyEmail}</div>
      </div>
      <a href="mailto:${safeReplyEmail}?subject=Re: [${ticketId}] ${safeSubject}"
         style="background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-weight:700;font-size:13px">
        Reply ↗
      </a>
    </div>` : `<div style="margin-top:20px;padding:14px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#94a3b8;font-size:13px">No reply email provided.</div>`;

  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.12)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a1628 0%,#0e7490 100%);padding:32px 40px">
      <div style="font-size:11px;letter-spacing:.2em;color:rgba(255,255,255,.55);font-weight:700;text-transform:uppercase;margin-bottom:10px">Naša Hrvatska · Support Ticket</div>
      <div style="font-size:22px;font-weight:900;color:#fff;line-height:1.25">${safeSubject}</div>
      <div style="margin-top:14px;display:inline-block;background:${typeInfo.badge};color:#fff;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700">${typeInfo.label}</div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px">

      <!-- Ticket meta -->
      <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;flex:1;min-width:120px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Ticket ID</div>
          <div style="font-size:14px;font-weight:900;color:#0f172a;letter-spacing:.05em">#${ticketId}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;flex:1;min-width:120px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Submitted</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a">${timestamp}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;flex:1;min-width:120px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">User</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a">${safeUserName} · ${esc(userLevel || "?")} · ${parseInt(userXp)||0} XP</div>
        </div>
      </div>

      <!-- Description -->
      <div style="margin-bottom:8px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase">Description</div>
      <div style="background:${typeInfo.bg};border:1.5px solid ${typeInfo.border};border-radius:12px;padding:20px 24px;font-size:15px;color:#1e293b;line-height:1.7;white-space:pre-wrap">${esc(description)}</div>

      <!-- Reply block -->
      ${replyBlock}

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center;padding-top:20px;border-top:1px solid #f1f5f9">
        <a href="https://claude.ai" style="display:inline-block;background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;text-decoration:none;border-radius:12px;padding:12px 28px;font-weight:700;font-size:14px">Open Claude to fix →</a>
        <div style="margin-top:12px;font-size:12px;color:#94a3b8">Naša Hrvatska · nasahrvatska.com</div>
      </div>
    </div>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Naša Hrvatska Support <hello@nasahrvatska.com>",
        to: [ADMIN_EMAIL],
        reply_to: replyEmail || undefined,
        subject: `[${typeInfo.label}] ${subject} — #${ticketId}`,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: res.ok, ticketId, ...data }),
      { status: res.ok ? 200 : 500, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
