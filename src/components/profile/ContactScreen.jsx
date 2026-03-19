import React, { useState } from 'react';

const ISSUE_TYPES = [
  { id: "bug",     icon: "🐛", label: "Bug Report",      color: "#dc2626", bg: "#fef2f2", desc: "Something isn't working" },
  { id: "feature", icon: "💡", label: "Feature Request",  color: "#2563eb", bg: "#eff6ff", desc: "Suggest an improvement" },
  { id: "content", icon: "📝", label: "Content Error",    color: "#ca8a04", bg: "#fefce8", desc: "Wrong translation or text" },
  { id: "question",icon: "❓", label: "Question",         color: "#16a34a", bg: "#f0fdf4", desc: "How does something work?" },
  { id: "other",   icon: "💬", label: "Other",            color: "#7c3aed", bg: "#faf5ff", desc: "Anything else" },
];

// Simple client-side rate limit: max 3 tickets per hour
function checkRateLimit() {
  try {
    const raw = JSON.parse(localStorage.getItem("contactSubmits") || "[]");
    const cutoff = Date.now() - 60 * 60 * 1000;
    const recent = raw.filter(t => t > cutoff);
    if (recent.length >= 3) return false;
    recent.push(Date.now());
    localStorage.setItem("contactSubmits", JSON.stringify(recent));
    return true;
  } catch { return true; }
}

export default function ContactScreen({ goBack, authUser, name, level, stats }) {
  const [type,        setType]        = useState("");
  const [subject,     setSubject]     = useState("");
  const [description, setDescription] = useState("");
  const [replyEmail,  setReplyEmail]  = useState(authUser?.e || "");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [ticketId,    setTicketId]    = useState(null);

  const selected = ISSUE_TYPES.find(t => t.id === type);
  const canSubmit = type && subject.trim() && description.trim().length >= 10 && !loading;

  async function submit() {
    if (!canSubmit) return;
    if (!checkRateLimit()) {
      setError("You've submitted 3 tickets this hour. Please wait a bit before sending another.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, subject: subject.trim(), description: description.trim(),
          replyEmail: replyEmail.trim() || null,
          userName: name || "Unknown",
          userLevel: level || "?",
          userXp: stats?.xp || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) { setTicketId(data.ticketId || "SENT"); }
      else setError(data.error || "Could not send. Please try again.");
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (ticketId) return (
    <div className="scr-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "32px 24px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: "#0f172a", fontWeight: 900, marginBottom: 8 }}>Ticket Submitted!</h2>
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>
        Your report has been sent to the administrator.
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 28, fontFamily: "monospace", letterSpacing: ".1em" }}>
        Ticket #{ticketId}
      </div>
      {replyEmail && (
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 28, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 20px" }}>
          We'll reply to <strong>{replyEmail}</strong> if we need more info.
        </div>
      )}
      <button className="b bp" onClick={goBack} style={{ minWidth: 160 }}>← Back to Profile</button>
    </div>
  );

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b", padding: "4px 2px" }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Contact Support</h2>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Report a bug, suggest a feature, or ask a question</div>
        </div>
      </div>

      {/* Issue type */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Issue Type</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ISSUE_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px",
                border: `2px solid ${type === t.id ? t.color : "#e2e8f0"}`,
                borderRadius: 12, background: type === t.id ? t.bg : "var(--card)",
                cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: type === t.id ? t.color : "#0f172a" }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{t.desc}</div>
              </div>
              {type === t.id && <span style={{ color: t.color, fontSize: 18, fontWeight: 900 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Subject <span style={{ color: "#dc2626" }}>*</span></div>
        <input
          type="text"
          placeholder="Brief summary of your issue…"
          value={subject}
          onChange={e => { setSubject(e.target.value.slice(0, 120)); setError(""); }}
          style={{ width: "100%", boxSizing: "border-box",
            border: `1.5px solid ${subject.length > 100 ? "#f59e0b" : "#e2e8f0"}`,
            borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none" }}
        />
        <div style={{ fontSize: 11, color: subject.length > 100 ? "#f59e0b" : "#94a3b8", textAlign: "right", marginTop: 4 }}>{subject.length}/120</div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Description <span style={{ color: "#dc2626" }}>*</span></div>
        <textarea
          placeholder={"Describe the issue in detail.\n\nFor bugs: what did you do, what happened, what did you expect?\nFor content errors: paste the incorrect text and what it should say."}
          value={description}
          onChange={e => { setDescription(e.target.value.slice(0, 2000)); setError(""); }}
          rows={6}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical",
            border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 14px",
            fontSize: 14, lineHeight: 1.6, outline: "none", fontFamily: "'Outfit', sans-serif" }}
        />
        <div style={{ fontSize: 11, color: description.length > 1800 ? "#f59e0b" : "#94a3b8", textAlign: "right", marginTop: 4 }}>{description.length}/2000</div>
      </div>

      {/* Reply email */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Your Email <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional — for follow-up)</span></div>
        <input
          type="email"
          placeholder="you@example.com"
          value={replyEmail}
          onChange={e => setReplyEmail(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box",
            border: "1.5px solid #e2e8f0", borderRadius: 12,
            padding: "12px 14px", fontSize: 15, outline: "none" }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: 12, padding: "12px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        className="b bp"
        style={{ width: "100%", fontSize: 16, padding: "15px", opacity: canSubmit ? 1 : 0.45 }}
        disabled={!canSubmit}
        onClick={submit}>
        {loading ? "Sending…" : selected ? `Send ${selected.icon} ${selected.label}` : "Send Report"}
      </button>

      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
        Reports go directly to the administrator. Max 3 per hour.
      </div>
    </div>
  );
}
