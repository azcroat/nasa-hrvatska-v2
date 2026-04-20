import React from 'react';
import { speak } from '../../data';

export default function SlangQuizPanel({
  section,
  quizMode,
  quizDone,
  quizQuestions,
  quizIdx,
  quizSelected,
  quizScore,
  onAnswer,
  onTryAgain,
  onDone,
}) {
  if (!quizMode) return null;

  if (quizDone) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: `2px solid ${section.color}`,
          borderRadius: 20,
          padding: '28px 20px',
          marginBottom: 14,
          textAlign: 'center',
          boxShadow: `0 4px 24px ${section.color}22`,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 12 }}>
          {quizScore >= quizQuestions.length * 0.8
            ? '🏆'
            : quizScore >= quizQuestions.length * 0.5
              ? '💪'
              : '📚'}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: section.color,
            fontFamily: "'Playfair Display',serif",
            marginBottom: 6,
          }}
        >
          {quizScore} / {quizQuestions.length} correct
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
          {quizScore >= quizQuestions.length * 0.8
            ? "Odlično! You're a natural!"
            : quizScore >= quizQuestions.length * 0.5
              ? 'Dobro! Keep practicing.'
              : "Keep studying — you'll get there!"}
        </div>
        <div
          style={{
            background: section.light,
            border: `1px solid ${section.border}`,
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 800,
            color: section.color,
          }}
        >
          +{quizScore * 3} XP earned
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onTryAgain}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: section.color,
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onDone}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: `1.5px solid ${section.border}`,
              background: 'var(--card)',
              color: section.color,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (quizQuestions.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `2px solid ${section.color}`,
        borderRadius: 20,
        padding: '20px',
        marginBottom: 14,
        boxShadow: `0 4px 24px ${section.color}22`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          Question {quizIdx + 1} of {quizQuestions.length}
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: section.color }}>
          {quizScore} / {quizIdx} ✓
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--bar-bg)', borderRadius: 4, marginBottom: 20 }}>
        <div
          style={{
            height: '100%',
            width: `${(quizIdx / quizQuestions.length) * 100}%`,
            background: section.color,
            borderRadius: 4,
            transition: 'width .3s',
          }}
        />
      </div>
      {/* Question */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px 16px',
          background: `linear-gradient(135deg,${section.light},var(--card))`,
          borderRadius: 14,
          marginBottom: 16,
          border: `1px solid ${section.border}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--subtext)',
            fontWeight: 700,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          What does this mean?
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: section.color,
            fontFamily: "'Playfair Display',serif",
            lineHeight: 1.3,
          }}
        >
          {quizQuestions[quizIdx].hr}
        </div>
        <button
          aria-label={`Play audio for ${quizQuestions[quizIdx].hr}`}
          onClick={() => speak(quizQuestions[quizIdx].hr)}
          style={{
            marginTop: 10,
            padding: '4px 12px',
            borderRadius: 8,
            border: 'none',
            background: section.color,
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <span aria-hidden="true">🔊</span> Hear it
        </button>
      </div>
      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {quizQuestions[quizIdx].opts.map((opt, oi) => {
          const isCorrect = opt === quizQuestions[quizIdx].correct;
          const isSelected = quizSelected === opt;
          let bg = 'var(--card)';
          let borderC = 'var(--card-b)';
          let txtC = 'var(--rt-c)';
          if (quizSelected !== null) {
            if (isCorrect) {
              bg = '#dcfce7';
              borderC = '#16a34a';
              txtC = '#15803d';
            } else if (isSelected) {
              bg = '#fee2e2';
              borderC = '#dc2626';
              txtC = '#dc2626';
            }
          }
          return (
            <button
              key={oi}
              onClick={() => onAnswer(opt)}
              disabled={quizSelected !== null}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${borderC}`,
                background: bg,
                color: txtC,
                fontSize: 13,
                fontWeight: 700,
                cursor: quizSelected ? 'default' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
                textAlign: 'left',
                transition: 'all .2s',
              }}
            >
              {quizSelected !== null && isCorrect
                ? '✓ '
                : quizSelected !== null && isSelected
                  ? '✗ '
                  : ''}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
