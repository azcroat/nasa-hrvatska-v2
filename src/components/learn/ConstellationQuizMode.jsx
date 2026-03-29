// ── GrammarConstellation — Quiz mode ──────────────────────────
import React, { useMemo } from 'react';
import { CASES, QUIZ } from './ConstellationData.js';
import { sh } from '../../data.jsx';

export default function ConstellationQuizMode({
  quizIdx,
  quizScore,
  selected,
  answered,
  onBackToExplore,
  onAnswer,
  onNext,
}) {
  const currentQ = QUIZ[quizIdx];
  const shuffledOptions = useMemo(() => sh([...currentQ.options]), [quizIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBackToExplore}
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
        <div>
          <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 800 }}>
            Case Quiz
          </h1>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            Question {quizIdx + 1} of 7
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((quizIdx) / 7) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Question card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#f1f5f9',
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          {currentQ.q}
        </p>
      </div>

      {/* Answer options — 2x2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {shuffledOptions.map(opt => {
          const isCorrect = opt === currentQ.answer;
          const isSelected = opt === selected;

          let bg = 'rgba(255,255,255,0.07)';
          let border = '1px solid rgba(255,255,255,0.12)';
          let textColor = '#e2e8f0';

          if (answered) {
            if (isCorrect) {
              bg = '#14532d';
              border = '2px solid #22c55e';
              textColor = '#bbf7d0';
            } else if (isSelected && !isCorrect) {
              bg = '#450a0a';
              border = '2px solid #ef4444';
              textColor = '#fecaca';
            }
          } else if (isSelected) {
            bg = 'rgba(99,102,241,0.2)';
            border = '2px solid #6366f1';
          }

          // Find the case color for the dot
          const caseInfo = CASES.find(c => c.id === opt);
          const dotColor = caseInfo ? caseInfo.color : '#94a3b8';

          return (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              disabled={answered}
              style={{
                background: bg,
                border,
                borderRadius: 12,
                padding: '12px 10px',
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: textColor,
                  textTransform: 'capitalize',
                }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {answered && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: selected === currentQ.answer
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${selected === currentQ.answer ? '#22c55e' : '#ef4444'}`,
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: selected === currentQ.answer ? '#22c55e' : '#ef4444',
              }}
            >
              {selected === currentQ.answer ? '✓ Correct!' : '✗ Not quite'}
            </div>
            {selected !== currentQ.answer && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Answer: <span style={{ color: '#f1f5f9', fontWeight: 600, textTransform: 'capitalize' }}>{currentQ.answer}</span>
              </div>
            )}
          </div>
          <button
            onClick={onNext}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            {quizIdx < QUIZ.length - 1 ? 'Next →' : 'Finish'}
          </button>
        </div>
      )}
    </>
  );
}
