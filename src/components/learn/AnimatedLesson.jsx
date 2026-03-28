// ═══════════════════════════════════════════════════════════
// AnimatedLesson — Animated Grammar Lesson Player
// The app's equivalent of pre-produced video lessons,
// built entirely in React with animations and live TTS.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { speak } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';

// ── Inline keyframes injected once ──────────────────────────
const SLIDE_ANIM_ID = 'nh-slide-anim';
if (typeof document !== 'undefined' && !document.getElementById(SLIDE_ANIM_ID)) {
  const style = document.createElement('style');
  style.id = SLIDE_ANIM_ID;
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────
function LS_GET(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function LS_SET(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Sub-components ────────────────────────────────────────────

/** Progress bar */
function ProgressBar({ current, total, color }) {
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

/** Intro slide */
function IntroSlide({ slide, lesson }) {
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

/** Rule slide */
function RuleSlide({ slide, lesson }) {
  // Highlight key term in body text
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

/** Example slide */
function ExampleSlide({ slide, lesson, autoTTS, ttsAvailable }) {
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
                  title="Hear pronunciation"
                >
                  🔊
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

/** Table slide */
function TableSlide({ slide, lesson }) {
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

/** Quiz slide */
function QuizSlide({ slide, slideIndex, lesson, quizAnswers, quizResults, onAnswer, onCheck }) {
  const selected = quizAnswers[slideIndex];
  const revealed = quizResults[slideIndex] !== undefined;
  const isCorrect = quizResults[slideIndex] === true;
  const hasSelected = selected !== undefined;

  function optionStyle(i) {
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
        return {
          ...base,
          background: lesson.bg,
          border: '2px solid ' + lesson.color,
          color: lesson.color,
        };
      }
      return {
        ...base,
        background: 'var(--card)',
        border: '2px solid var(--card-b)',
        color: 'var(--heading)',
      };
    }

    // After reveal
    if (i === slide.correct) {
      return {
        ...base,
        background: '#f0fdf4',
        border: '2px solid #16a34a',
        color: '#16a34a',
      };
    }
    if (selected === i && i !== slide.correct) {
      return {
        ...base,
        background: '#fef2f2',
        border: '2px solid #dc2626',
        color: '#dc2626',
      };
    }
    return {
      ...base,
      background: 'var(--card)',
      border: '2px solid var(--card-b)',
      color: 'var(--subtext)',
      opacity: 0.6,
    };
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

/** Summary slide */
function SummarySlide({ slide, lesson, score, quizTotal, xpAwarded }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Header */}
      <div style={{
        fontSize: 64, lineHeight: 1, marginBottom: 16,
      }}>{lesson.icon}</div>
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
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center',
      }}>
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

// ── Main Component ─────────────────────────────────────────────
export default function AnimatedLesson({ lesson, goBack, award }) {
  const [slide, setSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [autoTTS, setAutoTTS] = useState(() => LS_GET('nh_autotts', true));
  const [ttsAvailable] = useState(() => typeof window !== 'undefined');
  const [xpAwarded, setXpAwarded] = useState(false);

  const slides = lesson.slides;
  const totalSlides = slides.length;
  const currentSlide = slides[slide];

  // Count quiz slides for score display
  const quizSlides = slides.reduce((acc, s, i) => {
    if (s.type === 'quiz') acc.push(i);
    return acc;
  }, []);
  const quizTotal = quizSlides.length;

  // Auto-TTS on slide change
  useEffect(() => {
    if (!autoTTS || !ttsAvailable) return;
    if (currentSlide.type === 'example' && currentSlide.items && currentSlide.items.length > 0) {
      const timer = setTimeout(() => {
        speak(currentSlide.items[0].hr);
      }, 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  // Award XP when summary slide reached
  useEffect(() => {
    if (currentSlide.type === 'summary' && !xpAwarded) {
      setXpAwarded(true);
      if (typeof award === 'function') {
        award(25);
        markQuest('grammar');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  function handleToggleTTS() {
    setAutoTTS(prev => {
      const next = !prev;
      LS_SET('nh_autotts', next);
      return next;
    });
  }

  function handleAnswer(slideIndex, optionIndex) {
    setQuizAnswers(prev => ({ ...prev, [slideIndex]: optionIndex }));
  }

  function handleCheck(slideIndex) {
    const s = slides[slideIndex];
    const chosen = quizAnswers[slideIndex];
    if (chosen === undefined) return;
    const correct = chosen === s.correct;
    setQuizResults(prev => ({ ...prev, [slideIndex]: correct }));
    if (correct) setScore(sc => sc + 1);
  }

  function goNext() {
    if (slide < totalSlides - 1) {
      setSlide(s => s + 1);
    } else {
      setDone(true);
      goBack();
    }
  }

  function goPrev() {
    if (slide > 0) setSlide(s => s - 1);
  }

  // Can we go next? For quiz slides, require answer checked before advancing
  const isQuiz = currentSlide.type === 'quiz';
  const quizRevealed = quizResults[slide] !== undefined;
  const canGoNext = !isQuiz || quizRevealed;
  const isLastSlide = slide === totalSlides - 1;

  // ── Render slide content ─────────────────────────────────
  function renderSlide() {
    switch (currentSlide.type) {
      case 'intro':
        return <IntroSlide slide={currentSlide} lesson={lesson} />;

      case 'rule':
        return <RuleSlide slide={currentSlide} lesson={lesson} />;

      case 'example':
        return (
          <ExampleSlide
            slide={currentSlide}
            lesson={lesson}
            autoTTS={autoTTS}
            ttsAvailable={ttsAvailable}
          />
        );

      case 'table':
        return <TableSlide slide={currentSlide} lesson={lesson} />;

      case 'quiz':
        return (
          <QuizSlide
            slide={currentSlide}
            slideIndex={slide}
            lesson={lesson}
            quizAnswers={quizAnswers}
            quizResults={quizResults}
            onAnswer={handleAnswer}
            onCheck={handleCheck}
          />
        );

      case 'summary':
        return (
          <SummarySlide
            slide={currentSlide}
            lesson={lesson}
            score={score}
            quizTotal={quizTotal}
            xpAwarded={xpAwarded}
          />
        );

      default:
        return (
          <div style={{ color: 'var(--subtext)', padding: 24 }}>
            Unknown slide type: {currentSlide.type}
          </div>
        );
    }
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      maxWidth: 600, margin: '0 auto',
      padding: '0 0 80px',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12, padding: '0 2px',
      }}>
        {/* Back button */}
        <button
          onClick={goBack}
          aria-label="Back to lesson list"
          style={{
            background: 'none', border: '1px solid var(--card-b)',
            borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
            fontSize: 16, color: 'var(--subtext)', flexShrink: 0,
            fontFamily: 'inherit', transition: 'background .15s',
          }}
        >
          ←
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 900,
            color: 'var(--heading)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{lesson.title}</div>
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 600,
          }}>{lesson.level} · {lesson.duration}</div>
        </div>

        {/* TTS toggle */}
        {ttsAvailable && (
          <button
            onClick={handleToggleTTS}
            aria-label={autoTTS ? 'Disable auto-speak' : 'Enable auto-speak'}
            title={autoTTS ? 'Auto-speak ON' : 'Auto-speak OFF'}
            style={{
              background: autoTTS ? lesson.bg : 'var(--bar-bg)',
              border: '1px solid ' + (autoTTS ? lesson.color + '55' : 'var(--card-b)'),
              borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
              fontSize: 15, color: autoTTS ? lesson.color : 'var(--subtext)',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              gap: 4, flexShrink: 0, transition: 'all .15s',
            }}
          >
            🔊
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              {autoTTS ? 'Auto' : 'Off'}
            </span>
          </button>
        )}
      </div>

      {/* ── Progress Bar ── */}
      <ProgressBar current={slide + 1} total={totalSlides} color={lesson.color} />

      {/* ── Slide Content (animated) ── */}
      <div
        key={slide}
        style={{ animation: 'slideIn 0.3s ease forwards' }}
      >
        {renderSlide()}
      </div>

      {/* ── Navigation ── */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 24, alignItems: 'center',
      }}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={slide === 0}
          aria-label="Previous slide"
          style={{
            flex: 1, padding: '13px 16px',
            borderRadius: 12, border: '1px solid var(--card-b)',
            background: slide === 0 ? 'var(--bar-bg)' : 'var(--card)',
            color: slide === 0 ? 'var(--subtext)' : 'var(--heading)',
            cursor: slide === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--text-base)',
            fontWeight: 700, opacity: slide === 0 ? 0.4 : 1,
            transition: 'all .15s',
          }}
        >
          ← Prev
        </button>

        {/* Slide type indicator dots */}
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0,
        }}>
          {slides.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 16 : 6,
                height: 6, borderRadius: 99,
                background: i === slide ? lesson.color : (i < slide ? lesson.color + '66' : 'var(--bar-bg)'),
                transition: 'all .25s ease',
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={!canGoNext}
          aria-label={isLastSlide ? 'Finish lesson' : 'Next slide'}
          style={{
            flex: 1, padding: '13px 16px',
            borderRadius: 12, border: 'none',
            background: canGoNext ? lesson.color : 'var(--bar-bg)',
            color: canGoNext ? '#fff' : 'var(--subtext)',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: 'var(--text-base)',
            fontWeight: 800, transition: 'all .15s',
            opacity: canGoNext ? 1 : 0.5,
          }}
        >
          {isLastSlide ? 'Finish ✓' : 'Next →'}
        </button>
      </div>

      {/* ── Quiz: check reminder ── */}
      {isQuiz && !quizRevealed && quizAnswers[slide] !== undefined && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: lesson.bg, borderRadius: 10,
          border: '1px solid ' + lesson.color + '33',
          fontSize: 'var(--text-xs)', color: lesson.color,
          fontWeight: 700, textAlign: 'center',
          animation: 'slideIn .25s ease forwards',
        }}>
          Tap "Check Answer" before continuing
        </div>
      )}
    </div>
  );
}
