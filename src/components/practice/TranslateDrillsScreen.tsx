// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { sh } from '../../data';
import { TRANSLATE_DRILLS } from '../../data/exercises.js';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';

const CEFR_COLORS = { A2: '#16a34a', B1: '#d97706', B2: '#7c3aed' };
const CEFR_BG = {
  A2: 'rgba(22,163,74,.12)',
  B1: 'rgba(217,119,6,.12)',
  B2: 'rgba(124,58,237,.12)',
};

export default function TranslateDrillsScreen({ goBack, award }) {
  const drills = useMemo(() => sh([...TRANSLATE_DRILLS]), []);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null); // option string user tapped
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const drill = drills[idx];
  const isCorrect = chosen === drill?.hr;

  function pick(opt) {
    if (chosen) return;
    setChosen(opt);
    const correct = opt === drill.hr;
    recordTopicResult('vocabulary', correct);
    if (correct) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= drills.length) {
      const xp = Math.round((score / drills.length) * 20);
      if (xp > 0 && typeof award === 'function') award(xp);
      markQuest('vocab');
      setDone(true);
    } else {
      setChosen(null);
      setIdx((i) => i + 1);
    }
  }

  if (done) {
    const pct = Math.round((score / drills.length) * 100);
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#f1f5f9',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {score}/{drills.length} correct
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 32 }}>
          {pct >= 80
            ? 'Excellent production!'
            : pct >= 60
              ? 'Solid work — keep going.'
              : 'Review the sentences and try again.'}
        </p>
        <button
          onClick={goBack}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Practice
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        color: '#f1f5f9',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: 'rgba(255,255,255,.08)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#f1f5f9',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Translate Production</p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>English → Croatian</p>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {idx + 1}/{drills.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,.08)' }}>
        <div
          style={{
            height: '100%',
            width: `${(idx / drills.length) * 100}%`,
            background: '#7c3aed',
            transition: 'width .3s',
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 20px',
          maxWidth: 540,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* CEFR badge */}
        <span
          style={{
            background: CEFR_BG[drill.level],
            color: CEFR_COLORS[drill.level],
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            marginBottom: 20,
            letterSpacing: '0.05em',
          }}
        >
          {drill.level}
        </span>

        {/* English prompt */}
        <div
          style={{
            background: 'rgba(255,255,255,.06)',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 32,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#94a3b8',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Translate to Croatian
          </p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{drill.en}</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {drill.opts.map((opt) => {
            const isSelected = chosen === opt;
            const correct = opt === drill.hr;
            let bg = 'rgba(255,255,255,.06)';
            let border = '1px solid rgba(255,255,255,.1)';
            if (chosen) {
              if (correct) {
                bg = 'rgba(22,163,74,.18)';
                border = '1px solid #16a34a';
              } else if (isSelected) {
                bg = 'rgba(220,38,38,.18)';
                border = '1px solid #dc2626';
              }
            }
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                style={{
                  background: bg,
                  border,
                  borderRadius: 12,
                  padding: '16px 20px',
                  color: '#f1f5f9',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: chosen ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'background .15s, border .15s',
                  lineHeight: 1.4,
                }}
              >
                {opt}
                {chosen && correct && (
                  <span style={{ float: 'right', color: '#16a34a', fontWeight: 700 }}>✓</span>
                )}
                {chosen && isSelected && !correct && (
                  <span style={{ float: 'right', color: '#dc2626', fontWeight: 700 }}>✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {chosen && (
          <div style={{ marginTop: 24, textAlign: 'center', width: '100%' }}>
            {!isCorrect && (
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
                Correct: <strong style={{ color: '#f1f5f9' }}>{drill.hr}</strong>
              </p>
            )}
            <button
              onClick={next}
              style={{
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 0',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {idx + 1 >= drills.length ? 'See Results' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
