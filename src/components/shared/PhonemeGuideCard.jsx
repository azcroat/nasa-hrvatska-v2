import React from 'react';
import { PHONEME_GUIDES } from './pronunciationUtils.js';

// ── Full phoneme guide card (shown for Croatian-specific sounds) ──────────────
export default function PhonemeGuideCard({ phoneme }) {
  const [open, setOpen] = React.useState(false);
  const guide = PHONEME_GUIDES[phoneme] || PHONEME_GUIDES[phoneme?.toLowerCase()];
  if (!guide) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0',
          fontSize: 11, color: '#0e7490', fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span>{open ? '▲' : '▼'}</span>
        {open ? 'Hide articulation guide' : `How to pronounce "${phoneme}"`}
      </button>
      {open && (
        <div style={{
          marginTop: 6, padding: '12px 14px', borderRadius: 10,
          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          border: '1.5px solid #bae6fd', fontSize: 12, lineHeight: 1.55,
        }}>
          {/* IPA + approximation */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 15, fontWeight: 900,
              color: '#0c4a6e', background: '#e0f2fe', borderRadius: 6,
              padding: '2px 8px', border: '1px solid #7dd3fc',
            }}>{guide.ipa}</span>
            <span style={{ color: '#0369a1', fontWeight: 700 }}>{guide.approx}</span>
          </div>
          {/* Articulation */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#0c4a6e' }}>Articulation: </span>
            <span style={{ color: '#1e293b' }}>{guide.articulate}</span>
          </div>
          {/* Contrast note */}
          {guide.contrast && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 800, color: '#7c3aed' }}>vs. similar sounds: </span>
              <span style={{ color: '#3730a3' }}>{guide.contrast}</span>
            </div>
          )}
          {/* Example words */}
          <div style={{ marginTop: 4 }}>
            <span style={{ fontWeight: 800, color: '#065f46' }}>Examples: </span>
            <span style={{
              fontFamily: 'serif', fontSize: 13, fontWeight: 700, color: '#064e3b',
              fontStyle: 'italic',
            }}>{guide.example}</span>
          </div>
          {/* Lip/tongue position indicator */}
          <div style={{
            marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Lips', value: guide.lips },
              { label: 'Tongue', value: guide.tongue },
            ].map(({ label, value }) => value && (
              <span key={label} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 20, background: '#f0fdf4', border: '1px solid #86efac',
                color: '#166534',
              }}>{label}: {value}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
