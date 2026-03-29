// ─── LessonSlides.jsx ─────────────────────────────────────────────────────────
// All slide-type sub-components for AnimatedLesson.
// Each receives only the props it needs — no shared state.

import React, { useEffect, useRef } from 'react';
import { speak } from '../../lib/audio.js';

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ current, total, color }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        flex: 1, height: 6, background: 'var(--bar-bg)',
        borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: pct + '%', background: color,
          borderRadius: 99, transition: 'width .3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 'var(--text-xs)', fontWeight: 700,
        color: 'var(--subtext)', whiteSpace: 'nowrap',
      }}>
        {current} / {total}
      </span>
    </div>
  );
}

// ── Intro slide ───────────────────────────────────────────────────────────────

export function IntroSlide({ slide, lesson }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      {/* Color accent strip */}
      <div style={{
        height: 4, background: lesson.color, borderRadius: 99,
        marginBottom: 32, opacity: 0.7,
      }} />
      <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 20 }}>{slide.icon}</div>
      <h2 style={{
        fontSize: 'var(--text-2xl)', fontWeight: 900,
        color: 'var(--heading)', marginBottom: 14,
        fontFamily: "'Playfair Display', serif",
        lineHeight: 1.2,
      }}>{slide.title}</h2>
      <p style={{
        fontSize: 'var(--text-base)', color: 'var(--subtext)',
        lineHeight: 1.7, maxWidth: 480, margin: '0 auto',
      }}>{slide.body}</p>
    </div>
  );
}

// ── Rule slide ────────────────────────────────────────────────────────────────

export function RuleSlide({ slide, lesson }) {
  function highlightedBody() {
    if (!slide.highlight) {
      return <p style={{ fontSize: 'var(--text-base)', color: 'var(--subtext)', lineHeight: 1.7 }}>{slide.body}</p>;
    }
    const parts = slide.body.split(slide.highlight);
    return (
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--subtext)', lineHeight: 1.7 }}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark style={{
                background: lesson.bg, color: lesson.color,
                fontWeight: 800, borderRadius: 4, padding: '1px 4px',
              }}>
                {slide.highlight}
              </mark>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return (
    <div style={{
      background: 'var(--card)', borderRadius: 14,
      border: '1px solid var(--card-b)',
      borderLeft: '4px solid ' + lesson.color,
      padding: '18px 20px',
      boxShadow: 'var(--card-shadow)',
    }}>
      <h3 style={{
        fontSize: 'var(--text-xl)', fontWeight: 900,
        color: 'var(--heading)', marginBottom: 12,
        fontFamily: "'Outfit', sans-serif",
      }}>{slide.title}</h3>
      {highlightedBody()}
    </div>
  );
}

// ── Example slide ─────────────────────────────────────────────────────────────

export function ExampleSlide({ slide, lesson, autoTTS, ttsAvailable }) {
  const didAutoSpeak = useRef(false);

  useEffect(() => {
    didAutoSpeak.current = false;
  }, [slide]);

  useEffect(() => {
    if (autoTTS && ttsAvailable && slide.items && slide.items.length > 0 && !didAutoSpeak.current) {
      didAutoSpeak.current = true;
      const timer = setTimeout(() => {
        speak(slide.items[0].hr);
      }, 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [slide, autoTTS, ttsAvailable]);

  return (
    <div>
      <h3 style={{
        fontSize: 'var(--text-xl)', fontWeight: 900,
        color: 'var(--heading)', marginBottom: 14,
        fontFamily: "'Outfit', sans-serif",
      }}>{slide.title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slide.items.map((item, i) => (
          <div key={i} style={{
            background: 'var(--card)', borderRadius: 12,
            border: '1px solid var(--card-b)',
            padding: '14px 16px',
            boxShadow: 'var(--card-shadow)',
          }}>
            {/* Croatian text row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                flex: 1,
                fontSize: 'var(--text-lg)', fontWeight: 800,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display', serif",
              }}>{item.hr}</span>
              {ttsAvailable && (
                <button
                  onClick={() => speak(item.hr)}
                  aria-label={'Hear: ' + item.hr}
                  style={{
                    background: lesson.bg, border: '1px solid ' + lesson.color + '44',
                    borderRadius: 8, padding: '5px 9px', cursor: 'pointer',
                    fontSize: 16, color: lesson.color, flexShrink: 0,
                    fontFamily: 'inherit', lineHeight: 1,
                    transition: 'background .15s',
                  }}
                >
                  <span aria-hidden="true">🔊</span>
                </button>
              )}
            </div>
            {/* English translation */}
            <div style={{
              fontSize: 'var(--text-sm)', color: 'var(--subtext)',
              fontStyle: 'italic', marginBottom: item.note ? 8 : 0,
            }}>{item.en}</div>
            {/* Grammar note pill */}
            {item.note && (
              <span style={{
                display: 'inline-block',
                fontSize: 'var(--text-xs)', fontWeight: 700,
                color: lesson.color, background: lesson.bg,
                borderRadius: 20, padding: '2px 9px',
                border: '1px solid ' + lesson.color + '33',
              }}>{item.note}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Table slide ───────────────────────────────────────────────────────────────

export function TableSlide({ slide, lesson }) {
  return (
    <div>
      <h3 style={{
        fontSize: 'var(--text-xl)', fontWeight: 900,
        color: 'var(--heading)', marginBottom: 14,
        fontFamily: "'Outfit', sans-serif",
      }}>{slide.title}</h3>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-b)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr>
              {slide.headers.map((h, i) => (
                <th key={i} style={{
                  background: lesson.color, color: '#fff',
                  fontWeight: 800, fontSize: 'var(--text-xs)',
                  padding: '8px 10px', textAlign: 'left',
                  border: '1px solid ' + lesson.color,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slide.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '8px 10px',
                    background: ri % 2 === 0 ? 'var(--card)' : 'var(--bar-bg)',
                    border: '1px solid var(--card-b)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--heading)',
                    verticalAlign: 'top',
                    lineHeight: 1.5,
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quiz slide ────────────────────────────────────────────────────────────────

export function QuizSlide({ slide, slideIndex, lesson, quizAnswers, quizResults, onAnswer, onCheck }) {
  const selected = quizAnswers[slideIndex];
  const revealed = quizResults[slideIndex] !== undefined;
  const isCorrect = quizResults[slideIndex] === true;
  const hasSelected = selected !== undefined;

  function optionStyle(i) {
    /** @type {import('react').CSSProperties} */
    const base = {
      width: '100%', padding: '12px 16px', marginBottom: 8,
      borderRadius: 12, cursor: revealed ? 'default' : 'pointer',
      textAlign: 'left', fontFamily: 'inherit',
      fontSize: 'var(--text-base)', fontWeight: 600,
      transition: 'all .15s', display: 'block',
      lineHeight: 1.4,
    };

    if (!revealed) {
      if (selected === i) {
        return { ...base, background: lesson.bg, border: '2px solid ' + lesson.color, color: lesson.color };
      }
      return { ...base, background: 'var(--card)', border: '2px solid var(--card-b)', color: 'var(--heading)' };
    }

    // After reveal
    if (i === slide.correct) {
      return { ...base, background: '#f0fdf4', border: '2px solid #16a34a', color: '#16a34a' };
    }
    if (selected === i && i !== slide.correct) {
      return { ...base, background: '#fef2f2', border: '2px solid #dc2626', color: '#dc2626' };
    }
    return { ...base, background: 'var(--card)', border: '2px solid var(--card-b)', color: 'var(--subtext)', opacity: 0.6 };
  }

  return (
    <div>
      {/* Question */}
      <div style={{
        background: 'var(--card)', borderRadius: 14,
        border: '1px solid var(--card-b)',
        padding: '18px 20px', marginBottom: 16,
        textAlign: 'center',
        boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '.08em',
          color: lesson.color, textTransform: 'uppercase', marginBottom: 8,
        }}>Question</div>
        <p style={{
          fontSize: 'var(--text-md)', fontWeight: 800,
          color: 'var(--heading)', lineHeight: 1.4, margin: 0,
        }}>{slide.q}</p>
      </div>

      {/* Options */}
      <div>
        {slide.options.map((opt, i) => (
          <button
            key={i}
            style={optionStyle(i)}
            disabled={revealed}
            onClick={() => !revealed && onAnswer(slideIndex, i)}
            aria-label={'Option ' + (i + 1) + ': ' + opt}
          >
            <span style={{
              display: 'inline-block', width: 22, height: 22,
              borderRadius: '50%', textAlign: 'center', lineHeight: '22px',
              fontSize: 11, fontWeight: 900, marginRight: 10,
              background: 'currentColor', color: 'currentColor',
              flexShrink: 0, verticalAlign: 'middle',
              outline: '2px solid currentColor', backgroundColor: 'transparent',
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {/* Check Answer button */}
      {!revealed && (
        <button
          disabled={!hasSelected}
          onClick={() => onCheck(slideIndex)}
          style={{
            width: '100%', padding: '14px', marginTop: 4,
            borderRadius: 12, border: 'none',
            background: hasSelected ? lesson.color : 'var(--bar-bg)',
            color: hasSelected ? '#fff' : 'var(--subtext)',
            fontFamily: 'inherit', fontSize: 'var(--text-base)',
            fontWeight: 800, cursor: hasSelected ? 'pointer' : 'not-allowed',
            transition: 'all .15s',
          }}
        >
          Check Answer
        </button>
      )}

      {/* Explanation box */}
      {revealed && (
        <div style={{
          marginTop: 12, borderRadius: 12, padding: '14px 16px',
          background: isCorrect ? '#f0fdf4' : '#fffbeb',
          border: '1.5px solid ' + (isCorrect ? '#86efac' : '#fcd34d'),
          animation: 'slideIn .3s ease forwards',
        }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 900,
            color: isCorrect ? '#16a34a' : '#b45309',
            marginBottom: 4,
          }}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </div>
          <p style={{
            fontSize: 'var(--text-sm)', color: 'var(--subtext)',
            lineHeight: 1.6, margin: 0,
          }}>{slide.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ── Summary slide ─────────────────────────────────────────────────────────────

export function SummarySlide({ slide, lesson, score, quizTotal, xpAwarded }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Header */}
      <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>{lesson.icon}</div>
      <h2 style={{
        fontSize: 'var(--text-2xl)', fontWeight: 900,
        color: lesson.color, marginBottom: 6,
        fontFamily: "'Playfair Display', serif",
      }}>Lesson Complete!</h2>
      <p style={{
        fontSize: 'var(--text-base)', color: 'var(--subtext)',
        marginBottom: 24, fontWeight: 600,
      }}>{lesson.title}</p>

      {/* Key points */}
      <div style={{
        background: 'var(--card)', borderRadius: 14,
        border: '1px solid var(--card-b)',
        padding: '16px 18px', marginBottom: 16,
        textAlign: 'left',
        boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, color: lesson.color,
          textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10,
        }}>Key Takeaways</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slide.points.map((pt, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              fontSize: 'var(--text-sm)', color: 'var(--heading)',
              lineHeight: 1.5,
            }}>
              <span style={{ color: lesson.color, fontWeight: 900, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* Scores */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center' }}>
        {quizTotal > 0 && (
          <div style={{
            flex: 1, background: lesson.bg, borderRadius: 12,
            border: '1px solid ' + lesson.color + '44',
            padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: lesson.color }}>{score}/{quizTotal}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 700, textTransform: 'uppercase' }}>Quiz Score</div>
          </div>
        )}
        <div style={{
          flex: 1, background: '#fffbeb', borderRadius: 12,
          border: '1px solid #fcd34d',
          padding: '12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: '#d97706' }}>+25</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 700, textTransform: 'uppercase' }}>XP Earned</div>
        </div>
      </div>
    </div>
  );
}
