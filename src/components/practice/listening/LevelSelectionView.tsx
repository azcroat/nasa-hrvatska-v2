import React from 'react';
import { EXERCISES } from './exercises';
import type { ListeningQuiz } from './useListeningQuiz';

/** Level-selection landing — the CEFR level cards. */
export default function LevelSelectionView({
  quiz,
  goBack,
}: {
  quiz: ListeningQuiz;
  goBack: () => void;
}) {
  const {
    levelIds,
    getLevelCompletionCount,
    getLevelTotalCount,
    isLevelComplete,
    setSelectedLevel,
  } = quiz;
  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={goBack}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
          borderRadius: 18,
          padding: '18px 18px 16px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 4,
          }}
        >
          LISTENING
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: 'white',
            fontFamily: "'Playfair Display',serif",
            marginBottom: 6,
          }}
        >
          Comprehension Track
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>
          Hear Croatian sentences, choose the correct English meaning · A1 → B2
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {levelIds.map((lid) => {
          const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[lid]!;
          const completed = getLevelCompletionCount(lid);
          const total = getLevelTotalCount(lid);
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const complete = isLevelComplete(lid);
          return (
            <button
              key={lid}
              onClick={() => setSelectedLevel(lid)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 16,
                background: ld.bg,
                border: `1.5px solid ${complete ? ld.color : ld.border}`,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  flexShrink: 0,
                  background: ld.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'white',
                  position: 'relative',
                }}
              >
                {lid}
                {complete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fbbf24',
                      fontSize: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--heading)',
                    marginBottom: 3,
                  }}
                >
                  {ld.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--subtext)',
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {ld.desc}
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: 'rgba(0,0,0,.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: pct + '%',
                      height: '100%',
                      background: ld.color,
                      borderRadius: 2,
                      transition: 'width .4s',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: ld.color, fontWeight: 700 }}>
                  {ld.sets.length} sets · {completed}/{total} questions
                  {complete && ' · Complete 🏆'}
                </div>
              </div>
              <div style={{ fontSize: 20, color: ld.color }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
