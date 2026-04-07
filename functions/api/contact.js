// Cloudflare Pages Function — Support Ticket via Resend
// POST /api/contact { type, subject, description, replyEmail, userName, userLevel, userXp }
// Sends a formatted support email to the admin (ADMIN_EMAIL env var).

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';

function CORS(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://nasahrvatska.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    // Include Authorization so apiFetch's Bearer token passes CORS preflight
    // in dev (localhost:4173 → wrangler:8788) and cross-origin preview deploys.
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/; // eslint-disable-line no-useless-escape

const TYPE_COLORS = {
  bug:     { bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626", label: "🐛 Bug Report" },
  feature: { bg: "#eff6ff", border: "#93c5fd", badge: "#2563eb", label: "💡 Feature Request" },
  content: { bg: "#fefce8", border: "#fde047", badge: "#ca8a04", label: "📝 Content Error" },
  question:{ bg: "#f0fdf4", border: "#86efac", badge: "#16a34a", label: "❓ Question" },
  other:   { bg: "#faf5ff", border: "#c4b5fd", badge: "#7c3aed", label: "💬 Other" },
};

export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: CORS(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  const allowed = await checkRateLimit(request, 5);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: "Too many requests. Please wait a minute." }),
      { status: 429, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  // CSRF-style check: require Content-Type: application/json (bots and CSRF attacks often omit this)
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid content type." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  // Try to extract the authenticated user's email from the Firebase ID token
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  let authedEmail = null;
  if (FIREBASE_PROJECT_ID) {
    try {
      const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
      if (uid) {
        // Decode the JWT payload to extract the email claim (no crypto — already verified by getFirebaseUid)
        const authHeader = request.headers.get('authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            authedEmail = payload?.email || null;
          }
        }
      }
    } catch {
      // Auth is optional for contact form — continue without it
    }
  }

  const RESEND_KEY  = env.RESEND_API_KEY;
  const ADMIN_EMAIL = env.ADMIN_EMAIL;
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_EMAIL environment variable is not configured");
    return new Response(JSON.stringify({ ok: false, error: "Contact service is temporarily unavailable." }), {
      status: 500, headers: { ...CORS(origin), "Content-Type": "application/json" }
    });
  }

  if (!RESEND_KEY) {
    console.error("RESEND_API_KEY environment variable is not configured");
    return new Response(JSON.stringify({ ok: false, error: "Contact service is temporarily unavailable." }),
      { status: 503, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'Bad request' }), { status: 400, headers: { ...CORS(origin), 'Content-Type': 'application/json' } }); }

  const { type, subject, description, replyEmail: rawReplyEmail, userName, userLevel, userXp } = body;

  // If auth is available, enforce that replyEmail matches the authenticated user's email.
  // If it doesn't match (or is spoofed), use the auth email instead so the ticket
  // is reliably attributed to the real sender.
  let replyEmail = rawReplyEmail;
  if (authedEmail) {
    if (replyEmail && replyEmail.toLowerCase() !== authedEmail.toLowerCase()) {
      // Silently override the mismatched email with the verified auth email
      replyEmail = authedEmail;
    } else if (!replyEmail) {
      replyEmail = authedEmail;
    }
  }

  const VALID_TYPES = ["bug", "feature", "content", "question", "other"];
  if (!VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid type." }), { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  if (!type || !subject || !description) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }
  if (description.trim().length < 10) {
    return new Response(JSON.stringify({ ok: false, error: "Description must be at least 10 characters." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }
  if (subject.length > 120 || description.length > 2000) {
    return new Response(JSON.stringify({ ok: false, error: "Content too long." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }
  if (replyEmail && !EMAIL_RE.test(replyEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email address." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }
  if (replyEmail && /[\r\n\t%]/.test(replyEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email address." }),
      { status: 400, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }

  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

   
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
      <a href="mailto:${encodeURIComponent(replyEmail)}?subject=${encodeURIComponent(`Re: [${ticketId}] ${subject}`)}"
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
      signal: AbortSignal.timeout(10000),
    });

    await res.json().catch(() => ({})); // consume body; we don't forward Resend's internals
    return new Response(JSON.stringify({
      ok: res.ok,
      ticketId,
      // Return the actual reply email used (may differ from what the user typed
      // if the server overrode it with the verified Firebase auth email).
      replyEmail: replyEmail || null,
    }), { status: res.ok ? 200 : 500, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }),
      { status: 502, headers: { ...CORS(origin), "Content-Type": "application/json" } });
  }
}
