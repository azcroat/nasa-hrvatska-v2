import React, { useState } from 'react';
import HighlightedTranscript from './HighlightedTranscript';

export default function TranscriptToggle({
  text,
  keyWords,
  accentColor,
}: {
  text: string;
  keyWords: string[];
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'transparent',
          border: `1.5px solid var(--card-b)`,
          borderRadius: 10,
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--subtext)',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        {open ? '🙈 Hide transcript' : '📝 Show transcript'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 10,
            padding: '14px 16px',
            background: 'var(--bar-bg)',
            borderRadius: 12,
            border: '1.5px solid var(--card-b)',
            animation: 'fadeIn .2s ease',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 8,
            }}
          >
            Croatian transcript
          </div>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
            }}
          >
            <HighlightedTranscript text={text} keyWords={keyWords} />
          </div>
          {keyWords.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keyWords.map((w) => (
                <span
                  key={w}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(251,191,36,.2)',
                    border: '1px solid rgba(251,191,36,.5)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
