import React from 'react';

export default function HighlightedTranscript({
  text,
  keyWords,
}: {
  text: string;
  keyWords: string[];
}) {
  if (!keyWords || keyWords.length === 0) {
    return <span>{text}</span>;
  }
  // Build regex from keyWords (case-insensitive, whole word-ish)
  const escaped = keyWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <span>
      {parts.map((part, i) => {
        const isKey = keyWords.some((w) => w.toLowerCase() === part.toLowerCase());
        return isKey ? (
          <mark
            key={i}
            style={{
              background: 'rgba(251,191,36,.35)',
              borderRadius: 3,
              padding: '0 2px',
              fontWeight: 700,
              color: 'inherit',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}
