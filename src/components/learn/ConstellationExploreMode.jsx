// ── GrammarConstellation — Explore mode ───────────────────────
import React from 'react';
import { CASES } from './ConstellationData.js';
import { CaseCard } from './ConstellationPieces.jsx';

export default function ConstellationExploreMode({ goBack, expandedCase, onToggleCase, onStartQuiz }) {
  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button
          onClick={goBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: 20,
            width: 38,
            height: 38,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 20, fontWeight: 800 }}>
          ⭐ Grammar Constellation
        </h1>
      </div>

      <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 18px 50px', lineHeight: 1.5 }}>
        Croatian has 7 cases. Each one answers a different question.
        Tap a card to explore it.
      </p>

      {/* Case grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {CASES.map(c => (
          <CaseCard
            key={c.id}
            caseData={c}
            expanded={expandedCase === c.id}
            onToggle={() => onToggleCase(c.id)}
          />
        ))}
      </div>

      {/* Start quiz button */}
      <button
        onClick={onStartQuiz}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          letterSpacing: '0.02em',
        }}
      >
        Start Quiz →
      </button>
    </>
  );
}
