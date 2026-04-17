import React from 'react';
import { speak } from '../../data';

export default function AIWordTooltip({ tooltip, onClose, onSave }) {
  if (!tooltip) return null;

  return (
    <div
      data-tooltip="1"
      style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
        background: "var(--card)", borderRadius: 18, padding: "16px 18px",
        boxShadow: "0 10px 40px rgba(0,0,0,.18)", border: "1.5px solid var(--card-b)",
        zIndex: 9300, minWidth: 240, maxWidth: "calc(100vw - 48px)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--info)", fontFamily: "'Playfair Display',serif", flex: 1 }}>
          {tooltip.word}
        </span>
        <button onClick={() => speak(tooltip.word)}
          aria-label={`Play audio for ${tooltip.word}`}
          style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", opacity: .65, padding: "0 4px" }}>
          <span aria-hidden="true">🔊</span>
        </button>
        <button onClick={onClose}
          aria-label="Close tooltip"
          style={{ background: "none", border: "none", fontSize: "var(--text-xl)", cursor: "pointer", color: "var(--subtext)", lineHeight: 1, padding: "0 2px" }}>
          ×
        </button>
      </div>
      {tooltip.loading ? (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--subtext)", textAlign: "center", padding: "8px 0" }}>Translating…</div>
      ) : (
        <>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--heading)", marginBottom: 4 }}>
            {tooltip.translation}
          </div>
          {tooltip.note && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--subtext)", marginBottom: 12, lineHeight: 1.4 }}>{tooltip.note}</div>
          )}
          <button
            onClick={onSave}
            style={{ fontSize: "var(--text-sm)", fontWeight: 700, padding: "8px 0", borderRadius: 12, border: "none",
              background: tooltip.saved ? "var(--success-bg)" : "var(--info)",
              color: tooltip.saved ? "var(--success)" : "var(--card)",
              cursor: tooltip.saved ? "default" : "pointer",
              fontFamily: "'Outfit',sans-serif", width: "100%", transition: "all .2s" }}
          >
            {tooltip.saved ? "✓ Saved to Journal" : "+ Save to Journal"}
          </button>
        </>
      )}
    </div>
  );
}
