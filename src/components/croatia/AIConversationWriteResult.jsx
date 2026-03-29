import React from 'react';
import { speak } from '../../data.jsx';

export default function AIConversationWriteResult({
  writeEvalError,
  writeEval,
  onBackToWriting,
  onReset,
}) {
  if (writeEvalError || !writeEval) return (
    <div className="scr-wrap" style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--error)", marginBottom: 20 }}>
        {writeEvalError || "Could not load evaluation"}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="b bg" onClick={onBackToWriting}>Back to Writing</button>
        <button className="b bp" onClick={onReset}>Start Over</button>
      </div>
    </div>
  );

  const ev = writeEval;
  const scoreEmoji = ev.score >= 80 ? "🏆" : ev.score >= 55 ? "👏" : "📚";

  return (
    <div className="scr-wrap">
      {/* Score hero */}
      <div style={{ background: "linear-gradient(145deg,#0c4a6e,#0e7490)", borderRadius: 22, padding: "24px 20px",
        marginBottom: 20, color: "white", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>{scoreEmoji}</div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, opacity: .7, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Writing Score</div>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{ev.score}</div>
        <div style={{ fontSize: "var(--text-sm)", opacity: .7 }}>
          Level demonstrated: <strong style={{ opacity: 1 }}>{ev.level_demonstrated}</strong>
        </div>
      </div>

      {/* Encouragement */}
      {ev.encouragement && (
        <div onClick={() => speak(ev.encouragement)}
          style={{ background: "var(--success-bg)", border: "1.5px solid var(--success-b)", borderRadius: 16, padding: "16px 18px",
            marginBottom: 16, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>💬</span>
          <div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--success)", fontFamily: "'Playfair Display',serif",
              fontStyle: "italic", lineHeight: 1.55, marginBottom: 4 }}>"{ev.encouragement}"</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--success)", fontWeight: 600 }}>Tap to hear <span aria-hidden="true">🔊</span></div>
          </div>
        </div>
      )}

      {/* Corrected text */}
      {ev.corrected_text && (
        <div style={{ background: "var(--card)", border: "1.5px solid var(--card-b)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--info)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
            ✅ Corrected Version
          </div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--heading)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{ev.corrected_text}</div>
        </div>
      )}

      {/* Individual changes */}
      {ev.changes?.length > 0 && (
        <div style={{ background: "var(--card)", border: "1.5px solid var(--card-b)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--error)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
            📝 Corrections ({ev.changes.length})
          </div>
          {ev.changes.map((c, i) => (
            <div key={i} style={{ marginBottom: i < ev.changes.length - 1 ? 14 : 0,
              paddingBottom: i < ev.changes.length - 1 ? 14 : 0,
              borderBottom: i < ev.changes.length - 1 ? "1px solid var(--card-b)" : "none" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--error)", textDecoration: "line-through", fontWeight: 600 }}>{c.original}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--subtext)" }}>→</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--success)", fontWeight: 800 }}>{c.corrected}</span>
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--subtext)", lineHeight: 1.45 }}>{c.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {ev.strengths?.length > 0 && (
        <div style={{ background: "var(--card)", border: "1.5px solid var(--card-b)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--success)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
            ✅ Strengths
          </div>
          {ev.strengths.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: "var(--success)", fontWeight: 900, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: "var(--text-base)", color: "var(--heading)", lineHeight: 1.55 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Improvements */}
      {ev.improvements?.length > 0 && (
        <div style={{ background: "var(--card)", border: "1.5px solid var(--card-b)", borderRadius: 18, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--lavender)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
            🎯 Areas to Improve
          </div>
          {ev.improvements.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: "var(--lavender)", fontWeight: 900, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: "var(--text-base)", color: "var(--heading)", lineHeight: 1.55 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        <button className="b bg" onClick={onBackToWriting}>← Edit & Resubmit</button>
        <button className="b bp" onClick={onReset}>New Prompt</button>
      </div>
    </div>
  );
}
