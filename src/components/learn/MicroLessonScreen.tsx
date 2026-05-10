import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { H, speak, getMistakes } from '../../data';
import { useStats } from '../../context/StatsContext';
import { markQuest } from '../../lib/quests.js';
import { apiFetch } from '../../lib/apiFetch.js';

interface LessonExample {
  hr: string;
  en: string;
  highlight?: string;
  note?: string;
}

interface LessonQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface MicroLesson {
  focus: string;
  title: string;
  intro: string;
  examples: LessonExample[];
  quiz: LessonQuestion[];
  tip?: string;
}

interface WeakWord {
  hr: string;
  en: string;
  missCount: number;
}

// Render a Croatian sentence with one word bolded in the brand teal
function HighlightedSentence({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#0e7490', fontWeight: 800 }}>
        {text.slice(idx, idx + highlight.length)}
      </span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

// Inline spinner used during fetch
function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3.5px solid rgba(14,116,144,.18)',
        borderTopColor: '#0e7490',
        animation: 'spin 0.75s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

// Progress bar: filled fraction v/mx
function MicroBar({ v, mx }: { v: number; mx: number }) {
  const pct = mx > 0 ? Math.round((v / mx) * 100) : 0;
  return (
    <div
      style={{
        height: 6,
        borderRadius: 99,
        overflow: 'hidden',
        background: 'rgba(14,116,144,.12)',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 99,
          background: 'linear-gradient(90deg,#0e7490,#0891b2)',
          transition: 'width .35s ease',
        }}
      />
    </div>
  );
}

export default function MicroLessonScreen({
  goBack,
  award,
  goFlashcards,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
  goFlashcards?: () => void;
}) {
  const { level, setStats, writeDelta } = useStats();
  const [phase, setPhase] = useState('loading'); // loading | error | intro | quiz | results
  const [lesson, setLesson] = useState<MicroLesson | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [noWords, setNoWords] = useState(false);

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // XP awarded once per results view
  const xpFiredRef = useRef(false);

  const awardFn = useMemo(() => (typeof award === 'function' ? award : () => {}), [award]);

  // Award XP exactly once when results phase is reached
  useEffect(() => {
    if (phase === 'results' && lesson && !xpFiredRef.current) {
      xpFiredRef.current = true;
      const total = (lesson.quiz || []).length;
      const xpEarned = 10 + correctCount * 5;
      awardFn(xpEarned);
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      void total; // suppress unused warning
    }
  }, [phase, lesson, correctCount, awardFn, setStats, writeDelta]);

  // ── Fetch lesson ─────────────────────────────────────────────────────────────
  const fetchLesson = useCallback(async () => {
    setPhase('loading');
    setLesson(null);
    setErrorMsg('');
    setNoWords(false);
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    xpFiredRef.current = false;

    // Build weak words from the enriched mistakes store (has English meanings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mistakes: any[] = getMistakes();
    const sorted: WeakWord[] = [...mistakes]
      .filter((m) => (m.count || 0) >= 2 && m.hr && m.en)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 5)
      .map((m) => ({
        hr: m.hr as string,
        en: m.en as string,
        missCount: (m.count || 0) as number,
      }));

    if (sorted.length < 2) {
      setNoWords(true);
      setPhase('error');
      return;
    }

    setWeakWords(sorted);

    const goal = (() => {
      try {
        return localStorage.getItem('nh_goal') || 'fluent';
      } catch {
        return 'fluent';
      }
    })();
    const userLevel = level || 'A2';

    try {
      const res = await apiFetch('/api/micro-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weakWords: sorted, level: userLevel, goal }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }
      const data = (await res.json()) as MicroLesson;
      setLesson(data);
      setPhase('intro');
    } catch (e) {
      setErrorMsg((e as Error).message || 'Could not generate lesson. Please try again.');
      setPhase('error');
    }
  }, [level]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // ── Preview words visible during loading ─────────────────────────────────────
  const loadingPreview = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getMistakes() as any[])
        .filter((m) => (m.count || 0) >= 2 && m.hr)
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 5);
    } catch {
      return [];
    }
  })();

  // ── PHASE: loading ───────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="scr-wrap">
        {H('🎯 Personalized Lesson', 'Analyzing your weak spots...', goBack)}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: '32px 0 24px',
          }}
        >
          <Spinner />
          <div
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)', textAlign: 'center' }}
          >
            Building a lesson just for you...
          </div>
        </div>

        {loadingPreview.length > 0 && (
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 16,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 12,
              }}
            >
              Words being analyzed
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {loadingPreview.map((m: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--heading)' }}>
                    {m.hr}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#dc2626',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 99,
                      padding: '2px 9px',
                    }}
                  >
                    ✗ {m.count}×
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PHASE: error ─────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="scr-wrap">
        {H('🎯 Personalized Lesson', '', goBack)}
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{noWords ? '📚' : '⚠️'}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--heading)', marginBottom: 10 }}>
            {noWords ? 'Keep Practicing!' : 'Something went wrong'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 24 }}>
            {noWords
              ? 'You need at least a few SRS reviews with missed answers to generate a personalized lesson. Keep practicing flashcards and come back!'
              : errorMsg}
          </div>
          {noWords ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--subtext)',
                  background: 'var(--app-bg)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  lineHeight: 1.6,
                }}
              >
                💡 <strong>Tip:</strong> Complete a few flashcard reviews, answer some wrong, then
                come back — your micro-lesson will be ready.
              </div>
              <button
                className="b bp"
                style={{ width: '100%', padding: 14 }}
                onClick={() => {
                  if (goFlashcards) goFlashcards();
                  else goBack();
                }}
              >
                📚 Go to Flashcards
              </button>
              <button
                onClick={goBack}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'none',
                  border: '1.5px solid var(--card-b)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--subtext)',
                }}
              >
                ← Back
              </button>
            </div>
          ) : (
            <>
              <button
                className="b bp"
                style={{ width: '100%', padding: 14, marginBottom: 10 }}
                onClick={fetchLesson}
              >
                Try Again
              </button>
              <button
                onClick={goBack}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'none',
                  border: '1.5px solid var(--card-b)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--subtext)',
                }}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: intro (lesson intro + examples) ────────────────────────────────────
  if (phase === 'intro' && lesson) {
    return (
      <div className="scr-wrap">
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--subtext)',
            fontSize: 14,
            fontWeight: 700,
            padding: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back
        </button>

        {/* Title block */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(14,116,144,.1)',
              border: '1px solid rgba(14,116,144,.2)',
              borderRadius: 99,
              padding: '4px 12px',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#0e7490',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              {lesson.focus}
            </span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            {lesson.title}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--subtext)',
              lineHeight: 1.65,
              padding: '14px 16px',
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 14,
            }}
          >
            {lesson.intro}
          </div>
        </div>

        {/* Examples */}
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 12,
            }}
          >
            Examples
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(lesson.examples || []).map((ex: LessonExample, i: number) => (
              <div
                key={i}
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid var(--card-b)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  borderLeft: '4px solid #0e7490',
                  animation: `fade-up .35s ease ${i * 0.07}s both`,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}
                >
                  <button
                    onClick={() => speak(ex.hr)}
                    aria-label="Hear Croatian pronunciation"
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(14,116,144,.1)',
                      border: '1px solid rgba(14,116,144,.2)',
                      cursor: 'pointer',
                      fontSize: 15,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0e7490',
                      marginTop: 1,
                    }}
                  >
                    <span aria-hidden="true">🔊</span>
                  </button>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--heading)',
                        lineHeight: 1.4,
                        marginBottom: 4,
                        fontFamily: "'Playfair Display',serif",
                      }}
                    >
                      <HighlightedSentence text={ex.hr} highlight={ex.highlight} />
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--subtext)',
                        fontStyle: 'italic',
                        marginBottom: ex.note ? 6 : 0,
                      }}
                    >
                      {ex.en}
                    </div>
                  </div>
                </div>
                {ex.note && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#b45309',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 99,
                      padding: '3px 10px',
                    }}
                  >
                    {ex.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="b bp"
          style={{ width: '100%', padding: 14, marginTop: 20 }}
          onClick={() => {
            setQIdx(0);
            setSelected(null);
            setAnswered(false);
            setPhase('quiz');
          }}
        >
          Start Quiz →
        </button>
      </div>
    );
  }

  // ── PHASE: quiz ───────────────────────────────────────────────────────────────
  if (phase === 'quiz' && lesson) {
    const questions = lesson.quiz || [];
    const q = questions[qIdx];

    if (!q) return null;

    const isLast = qIdx >= questions.length - 1;
    const isCorrect = answered && selected === q.answer;

    function handleSelect(i: number): void {
      if (answered) return;
      setSelected(i);
      setAnswered(true);
      if (i === q!.answer) setCorrectCount((c) => c + 1);
    }

    function handleNext(): void {
      if (isLast) {
        setPhase('results');
      } else {
        setQIdx((i) => i + 1);
        setSelected(null);
        setAnswered(false);
      }
    }

    return (
      <div className="scr-wrap">
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
            Question {qIdx + 1} of {questions.length}
          </span>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#0e7490',
              background: 'rgba(14,116,144,.1)',
              border: '1px solid rgba(14,116,144,.2)',
              borderRadius: 99,
              padding: '3px 12px',
              maxWidth: 160,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lesson.focus}
          </div>
        </div>

        <MicroBar v={qIdx + (answered ? 1 : 0)} mx={questions.length} />

        {/* Question card */}
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 10,
            }}
          >
            Fill in the blank
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.4,
            }}
          >
            {q.question}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {(q.options || []).map((opt: string, i: number) => {
            let bg = 'var(--card)';
            let borderColor = 'var(--card-b)';
            let textColor = 'var(--heading)';
            let icon: string | null = null;

            if (answered) {
              if (i === q.answer) {
                bg = '#f0fdf4';
                borderColor = '#86efac';
                textColor = '#166534';
                icon = '✓';
              } else if (i === selected && i !== q.answer) {
                bg = '#fef2f2';
                borderColor = '#fca5a5';
                textColor = '#dc2626';
                icon = '✗';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 14,
                  cursor: answered ? 'default' : 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'background .15s, border-color .15s',
                  fontFamily: "'Playfair Display',serif",
                  animation: answered && i === q.answer ? 'spring-in .3s ease' : undefined,
                }}
              >
                {icon ? (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: i === q.answer ? '#16a34a' : '#dc2626',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {icon}
                  </span>
                ) : (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      flexShrink: 0,
                      border: '2px solid var(--card-b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--subtext)',
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                )}
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation banner */}
        {answered && (
          <div
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 14,
              background: isCorrect ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`,
              animation: 'spring-in .3s ease',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                marginBottom: 4,
                color: isCorrect ? '#16a34a' : '#dc2626',
              }}
            >
              {isCorrect ? 'Točno! · Correct!' : 'Netočno · Incorrect'}
            </div>
            {q.explanation && (
              <div
                style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6, fontWeight: 600 }}
              >
                {q.explanation}
              </div>
            )}
          </div>
        )}

        {answered && (
          <button className="b bp" style={{ width: '100%', padding: 14 }} onClick={handleNext}>
            {isLast ? 'See Results' : 'Next →'}
          </button>
        )}
      </div>
    );
  }

  // ── PHASE: results ────────────────────────────────────────────────────────────
  if (phase === 'results' && lesson) {
    const total = (lesson.quiz || []).length;
    const xpEarned = 10 + correctCount * 5;
    const pct = total > 0 ? correctCount / total : 0;
    const headingText = pct === 1 ? 'Savršeno!' : pct >= 0.67 ? 'Odlično!' : 'Bravo!';
    const subText = pct === 1 ? 'Perfect score!' : pct >= 0.5 ? 'Great work!' : 'Every rep counts.';

    return (
      <div className="scr-wrap">
        {/* Score hero */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
            borderRadius: 20,
            padding: '28px 20px',
            textAlign: 'center',
            marginBottom: 16,
            color: 'white',
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 8, animation: 'bounce-in .5s ease' }}>
            {pct === 1 ? '⭐' : pct >= 0.67 ? '🎉' : '💪'}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              animation: 'fade-up .4s ease .1s both',
            }}
          >
            {headingText}
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.75,
              fontWeight: 600,
              marginTop: 4,
              marginBottom: 20,
              animation: 'fade-up .4s ease .18s both',
            }}
          >
            {subText}
          </div>

          {/* Score dots */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginBottom: 20,
              animation: 'fade-up .4s ease .24s both',
            }}
          >
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: i < correctCount ? '#4ade80' : 'rgba(255,255,255,.22)',
                  boxShadow: i < correctCount ? '0 0 8px rgba(74,222,128,.6)' : 'none',
                }}
              />
            ))}
          </div>

          {/* XP card */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 14,
              padding: '10px 28px',
              animation: 'fade-up .4s ease .3s both',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
              }}
            >
              XP Earned
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: '#fbbf24',
                fontFamily: "'Outfit',sans-serif",
                lineHeight: 1.1,
              }}
            >
              +{xpEarned}
            </div>
            <div style={{ fontSize: 13, opacity: 0.65, fontWeight: 600 }}>
              {correctCount}/{total} correct
            </div>
          </div>
        </div>

        {/* Mnemonic tip */}
        {lesson.tip && (
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 14,
              borderLeft: '4px solid #b45309',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#b45309',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 6,
              }}
            >
              💡 Memory Tip
            </div>
            <div
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.55 }}
            >
              {lesson.tip}
            </div>
          </div>
        )}

        {/* Weak words reviewed */}
        {weakWords.length > 0 && (
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 16,
              padding: '14px 18px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 10,
              }}
            >
              Words Reviewed
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {weakWords.map((w: WeakWord, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(14,116,144,.07)',
                    border: '1px solid rgba(14,116,144,.15)',
                    borderRadius: 99,
                    padding: '5px 12px',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0e7490' }}>{w.hr}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#dc2626',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 99,
                      padding: '1px 6px',
                    }}
                  >
                    ✗{w.missCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <button
          className="b bp"
          style={{ width: '100%', padding: 14, marginBottom: 10 }}
          onClick={fetchLesson}
        >
          Try Another Lesson
        </button>
        <button
          onClick={goBack}
          style={{
            width: '100%',
            padding: 12,
            background: 'none',
            border: '1.5px solid var(--card-b)',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--subtext)',
          }}
        >
          ← Back to Learn
        </button>
      </div>
    );
  }

  return null;
}
