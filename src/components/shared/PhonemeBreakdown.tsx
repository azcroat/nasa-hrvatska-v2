import React, { useState } from 'react';
import { PHONEME_GUIDES, PHONEME_HINTS, scoreColor } from './pronunciationUtils.js';
import PhonemeGuideCard from './PhonemeGuideCard';

// ── Phoneme breakdown panel (Azure-mode only) ─────────────────────────────────
export default function PhonemeBreakdown({ phonemes }) {
  const [open, setOpen] = useState(false);
  if (!phonemes || phonemes.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide phoneme breakdown' : 'Show phoneme breakdown'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, color: 'var(--subtext,#94a3b8)', fontWeight: 600,
          padding: '2px 0', fontFamily: "'Outfit',sans-serif",
        }}
      >
        {open ? '▲ hide phonemes' : '▼ show phonemes'}
      </button>
      {open && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {phonemes.map((p, i) => {
              const hint = PHONEME_HINTS[p.phoneme.toLowerCase()] || PHONEME_HINTS[p.phoneme] || null;
              return (
                <span
                  key={i}
                  title={hint || undefined}
                  style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    background: `${scoreColor(p.score)}18`,
                    border: `1.5px solid ${scoreColor(p.score)}55`,
                    borderRadius: 6, padding: '2px 7px',
                    cursor: hint ? 'help' : 'default',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(p.score) }}>{p.phoneme}</span>
                  <span style={{ fontSize: 10, color: 'var(--subtext,#94a3b8)' }}>{p.score}%</span>
                </span>
              );
            })}
          </div>
          {/* Show articulation guide for any low-scoring Croatian-specific phoneme */}
          {phonemes.filter(p => p.score < 70 && PHONEME_GUIDES[p.phoneme.toLowerCase()]).slice(0, 1).map(p => (
            <PhonemeGuideCard key={p.phoneme} phoneme={p.phoneme.toLowerCase()} />
          ))}
        </div>
      )}
    </div>
  );
}
