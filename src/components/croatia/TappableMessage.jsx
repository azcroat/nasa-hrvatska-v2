import React from 'react';

// ── TappableMessage — defined outside to prevent remount on every parent render ─
// Each word in an AI message is a span; tapping calls onWordClick and stops
// event propagation so the outer "tap to speak" div is not also triggered.
export default function TappableMessage({ text, onWordClick }) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const stripped = token.replace(/[.,!?;:…«»"'""''()\[\]]/g, "").trim();
        if (stripped.length < 2) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            data-word="1"
            onClick={e => { e.stopPropagation(); onWordClick(token); }}
            style={{ cursor: "pointer", borderBottom: "1px dotted rgba(14,116,144,.4)",
              borderRadius: 2, transition: "background .1s" }}
            title="Tap to translate"
          >
            {token}
          </span>
        );
      })}
    </>
  );
}
