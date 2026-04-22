// ── GrammarConstellation — Done/results mode ──────────────────
import React from 'react';
import { CASES, getDoneMessage } from './ConstellationData.js';

interface Props {
  finalScore: number;
  onReviewCases: () => void;
  goBack: () => void;
}
export default function ConstellationDoneMode({ finalScore, onReviewCases, goBack }: Props) {
  return (
    <>
      {/* Score card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: '36px 24px',
          textAlign: 'center',
          marginBottom: 20,
          marginTop: 16,
        }}
      >
        {/* Stars display */}
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              style={{
                color: i < finalScore ? '#facc15' : '#334155',
                filter: i < finalScore ? 'drop-shadow(0 0 6px #facc15)' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>

        <div
          style={{
            color: '#f1f5f9',
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {finalScore}
          <span style={{ fontSize: 24, color: '#64748b', fontWeight: 400 }}>/7</span>
        </div>

        <div style={{ color: '#cbd5e1', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
          {getDoneMessage(finalScore)}
        </div>

        <div style={{ color: '#64748b', fontSize: 13 }}>+{finalScore * 10} points earned</div>
      </div>

      {/* Case summary — quick reminder */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Quick Reference
        </div>
        {CASES.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span
              style={{
                background: c.color,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 10,
                minWidth: 32,
                textAlign: 'center',
              }}
            >
              {c.abbr}
            </span>
            <span style={{ color: '#cbd5e1', fontSize: 13, flex: 1 }}>{c.name}</span>
            <span style={{ color: '#475569', fontSize: 11 }}>
              {(c.question.split('(')[0] ?? '').trim()}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onReviewCases}
          style={{
            flex: 1,
            padding: '13px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            color: '#e2e8f0',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Review Cases
        </button>
        <button
          onClick={goBack}
          style={{
            flex: 1,
            padding: '13px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}
        >
          Done
        </button>
      </div>
    </>
  );
}
