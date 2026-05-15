import React, { useState, useMemo, useEffect, useRef } from 'react';
import { H, Bar, Spk, srMark, getSR, sh, V } from '../../data';
import { getPrioritizedReviewQueue } from '../../lib/srs.js';
import { useHaptic } from '../../hooks/useHaptic';
import { markPracticed } from '../../hooks/useNotifications';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { logError } from '../../lib/learnerErrors.js';
import { _aiPost } from '../../lib/aiPost';
import { playFanfare as _playFanfare } from '../../lib/soundSettings.js';
import CroatianKnight from '../shared/CroatianKnight';
import { knightSpeak } from '../../lib/knightSpeak.js';

interface AiExplanation {
  rule?: string;
  tip?: string;
  explanation?: string;
  example?: string;
}

interface ReviewScreenProps {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
  allCats?: string[];
}

interface ReviewStateRef {
  answered: boolean;
  idx: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questions: any[];
  score: number;
}

export default function ReviewScreen({ goBack, award, allCats }: ReviewScreenProps) {
  const haptic = useHaptic();
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const _cats = allCats || Object.keys(V);
  const pool = useMemo(
    () => _cats.flatMap((t: string) => (V as Record<string, string[][]>)[t] || []),
    [_cats],
  );

  const dueWords = useMemo(() => {
    return getPrioritizedReviewQueue(pool);
  }, [pool]);

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [aiExplain, setAiExplain] = useState<null | 'loading' | AiExplanation>(null);

  // Knight reacts when the review session ends
  useEffect(() => {
    if (!done || questions.length === 0) return;
    const pct = Math.round((score / questions.length) * 100);
    knightSpeak(
      pct >= 80 ? 'victory' : pct >= 50 ? 'encouraged' : 'thinking',
      pct >= 80
        ? `Review nailed! ${pct}% — your memory is getting sharper. 🧠`
        : pct >= 50
          ? `${score}/${questions.length} correct. The words you missed today won't beat you twice. 💪`
          : 'Review done. Spaced repetition takes time — show up tomorrow and watch the numbers climb. 📈',
      600,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const questions = useMemo(() => {
    if (dueWords.length === 0) return [];
    return (dueWords as string[][]).slice(0, 20).map((w: string[]) => {
      // Filter to words with a different English meaning, then deduplicate
      // meanings — prevents synonyms from making the correct answer appear twice.
      const seen = new Set([w[1]]);
      const distractors = sh(pool.filter((x: string[]) => x[1] !== w[1]))
        .filter((x: string[]) => {
          if (seen.has(x[1])) return false;
          seen.add(x[1]);
          return true;
        })
        .slice(0, 3)
        .map((x: string[]) => x[1]!);
      const opts: string[] = sh([w[1]!, ...distractors]);
      return { word: w, opts, correct: w[1]! };
    });
  }, [dueWords, pool]);

  // Use a ref to hold current values so the keyboard handler never goes stale
  const stateRef = useRef<ReviewStateRef>({ answered: false, idx: 0, questions: [], score: 0 });
  stateRef.current = { answered, idx, questions, score };

  // Keyboard shortcuts: 1-4 to pick answer, Space/Enter to advance
  // Hooks must be unconditional — placed before all early returns
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const { answered: ans, idx: i, questions: qs } = stateRef.current;
      if (e.key === ' ' || e.key === 'Enter') {
        if (ans) {
          setAiExplain(null);
          if (i < qs.length - 1) {
            setIdx((n) => n + 1);
            setAnswered(false);
            setSelected(-1);
          } else setDone(true);
        }
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const qi = parseInt(e.key, 10) - 1;
        const q = qs[i];
        if (!ans && q && q.opts[qi] !== undefined) {
          setSelected(qi);
          setAnswered(true);
          const ok = q.opts[qi] === q.correct;
          if (ok) {
            setScore((s) => s + 1);
            haptic.correct();
          } else {
            haptic.wrong();
            logError(q.word[0], 'vocabulary', {
              wrong: q.opts[qi],
              correct: q.correct,
              source: 'srs_review',
            });
          }
          srMark(q.word[0], ok, undefined);
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [haptic]); // haptic is stable; stateRef.current is read inside, no stale closure

  const nextReviewETA = useMemo(() => {
    const sr = getSR();
    const now = Date.now();
    let earliest = Infinity;
    for (const entry of Object.values(sr)) {
      if (entry.nextDue && entry.nextDue > now && entry.nextDue < earliest) {
        earliest = entry.nextDue;
      }
    }
    return earliest === Infinity ? null : new Date(earliest);
  }, []);

  if (dueWords.length === 0) {
    return (
      <div className="scr-wrap">
        {H('🔁 Review Due', 'Your spaced repetition cards', goBack)}
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 24,
              color: '#164e63',
              marginTop: 12,
            }}
          >
            All caught up!
          </h2>
          <p style={{ color: '#78716c', marginTop: 8, lineHeight: 1.6 }}>
            No reviews due right now.
            <br />
            Words you&apos;ve practiced will appear here when it&apos;s time to review them.
          </p>
          {nextReviewETA && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1.5px solid #bae6fd',
                borderRadius: 12,
                padding: '12px 16px',
                marginTop: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>⏰</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
                Next review:{' '}
                {nextReviewETA.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at {nextReviewETA.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 14,
              padding: '16px',
              marginTop: 24,
              textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 6 }}>
              💡 How spaced repetition works:
            </p>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              Words you practice are scheduled for review at increasing intervals: 1 day → 3 days →
              7 days → 14 days → 30 days. Come back tomorrow to review today&apos;s words!
            </p>
          </div>
          <button className="b bp" style={{ marginTop: 24 }} onClick={goBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const mood = pct >= 80 ? 'victory' : pct >= 50 ? 'encouraged' : 'thinking';
    return (
      <div
        style={{
          minHeight: '70vh',
          background: 'linear-gradient(160deg, #060e1e 0%, #0a1f3a 50%, #0c3060 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px 52px',
          borderRadius: 20,
          margin: '0 -16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, transparent 25%, rgba(255,255,255,.03) 50%, transparent 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s linear infinite',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <CroatianKnight
            size={90}
            mood={mood}
            style={{ marginBottom: 8, animation: 'bounce-in .5s ease' }}
          />

          <div style={{ fontSize: 56, marginBottom: 8, animation: 'bounce-in .5s ease .1s both' }}>
            {pct >= 80 ? '🌟' : pct >= 50 ? '🎉' : '💪'}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'white',
              fontFamily: "'Playfair Display', serif",
              marginBottom: 6,
              animation: 'fade-up .5s ease .2s both',
            }}
          >
            {pct >= 80 ? 'Sjajno!' : pct >= 50 ? 'Bravo!' : 'Nastavi!'}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,.7)',
              marginBottom: 4,
              animation: 'fade-up .5s ease .28s both',
            }}
          >
            {score}/{questions.length} correct · {pct}%
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,.45)',
              marginBottom: 28,
              animation: 'fade-up .5s ease .34s both',
            }}
          >
            Spaced repetition intervals updated
          </div>

          <button
            className="b bp"
            style={{ animation: 'fade-up .5s ease .42s both' }}
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              markPracticed();
              haptic.award();
              if (typeof award === 'function') award(score * 5 + 5, false, 'review');
              markQuest('master');
              markQuest('review');
              if (!stats.vs?.includes('srsreview')) {
                setStats((prev) => {
                  if (prev.vs?.includes('srsreview')) return prev;
                  return { ...prev, rc: (prev.rc || 0) + 1, vs: [...(prev.vs || []), 'srsreview'] };
                });
                if (writeDelta) writeDelta({ rc: 1, vs: ['srsreview'] });
              }
              goBack();
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="scr-wrap">
      {H('🔁 Review Due', 'Your spaced repetition cards', goBack)}
      <p style={{ fontSize: 12, color: '#78716c', marginBottom: 8, fontWeight: 500 }}>
        {dueWords.length} words due ·{' '}
        <span style={{ opacity: 0.6 }}>keys 1-4 to answer, Space to continue</span>
      </p>
      <Bar v={idx + 1} mx={questions.length} color="#7c3aed" h={6} />
      <div className="c" style={{ marginTop: 16, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Spk text={q.word[0]} label={q.word[0]} />
          <p
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "'Playfair Display',serif",
              margin: 0,
            }}
          >
            {q.word[0]}
          </p>
        </div>
        <p style={{ fontSize: 13, color: '#78716c', marginBottom: 16 }}>What does this mean?</p>
        {q.opts.map((opt, i) => {
          let cls = 'ob';
          if (answered) {
            if (opt === q.correct) cls += ' ok';
            else if (i === selected) cls += ' no';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => {
                if (answered) return;
                setSelected(i);
                setAnswered(true);
                const ok = opt === q.correct;
                if (ok) {
                  setScore((s) => s + 1);
                  haptic.correct();
                  setAiExplain(null);
                } else {
                  haptic.wrong();
                  logError(q.word[0]!, 'vocabulary', {
                    wrong: opt,
                    correct: q.correct,
                    source: 'srs_review',
                  });
                  // Fetch AI explanation for wrong answers (fire-and-forget, non-blocking)
                  setAiExplain('loading' as const);
                  _aiPost('/api/explain-error', {
                    wrong: opt,
                    correct: q.correct,
                    context: q.word[0],
                    type: 'flashcard',
                    level: 'B1',
                  })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((d) => {
                      setAiExplain(d?.explanation ? d : null);
                    })
                    .catch(() => {
                      setAiExplain(null);
                    });
                }
                srMark(q.word[0], ok, undefined);
              }}
            >
              <span style={{ opacity: 0.4, fontSize: 11, marginRight: 6 }}>{i + 1}</span>
              {opt}
            </button>
          );
        })}
        {answered && selected !== -1 && q.opts[selected] !== q.correct && (
          <>
            <div
              style={{
                background: 'var(--info-bg)',
                border: '1.5px solid var(--info-b)',
                borderRadius: 14,
                padding: '14px 16px',
                marginTop: 14,
                marginBottom: 4,
                animation: 'spring-in .3s ease',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--info)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 8,
                }}
              >
                ✓ The answer was
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: 'var(--success)',
                  fontFamily: "'Playfair Display',serif",
                  marginBottom: 6,
                }}
              >
                {q.correct}
              </div>
              {q.word[2] && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--subtext)',
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {q.word[2]}
                </div>
              )}
              <Spk text={q.word[0]} label="Tip: hear it again" />
            </div>
            {/* AI grammar explanation */}
            {aiExplain === 'loading' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 12,
                  marginTop: 8,
                  background: 'var(--bar-bg)',
                  border: '1px solid var(--card-b)',
                  fontSize: 12,
                  color: 'var(--subtext)',
                  fontWeight: 600,
                  animation: 'fadeIn .3s ease',
                }}
              >
                <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>🤖</span>
                <span>Getting AI explanation…</span>
              </div>
            )}
            {aiExplain && aiExplain !== 'loading' && typeof aiExplain === 'object' && (
              <div
                style={{
                  background: 'linear-gradient(135deg,rgba(124,58,237,.06),rgba(124,58,237,.03))',
                  border: '1.5px solid rgba(124,58,237,.22)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginTop: 8,
                  animation: 'spring-in .3s ease .1s both',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#7c3aed',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                  }}
                >
                  <span>🤖</span>
                  <span>AI Explanation · {(aiExplain as AiExplanation).rule}</span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--heading)',
                    lineHeight: 1.6,
                    marginBottom: (aiExplain as AiExplanation).tip ? 8 : 0,
                  }}
                >
                  {(aiExplain as AiExplanation).explanation}
                </div>
                {(aiExplain as AiExplanation).tip && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--subtext)',
                      fontStyle: 'italic',
                      padding: '6px 10px',
                      borderRadius: 8,
                      marginTop: 4,
                      background: 'rgba(124,58,237,.06)',
                      borderLeft: '3px solid rgba(124,58,237,.4)',
                    }}
                  >
                    💡 {(aiExplain as AiExplanation).tip}
                  </div>
                )}
                {(aiExplain as AiExplanation).example && (
                  <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, marginTop: 6 }}>
                    e.g. {(aiExplain as AiExplanation).example}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {answered && selected !== -1 && q.opts[selected] === q.correct && (
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1.5px solid var(--success-b)',
              borderRadius: 12,
              padding: '10px 14px',
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'spring-in .3s ease',
            }}
          >
            <span style={{ fontSize: 18 }}>✓</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>
              Točno! · Correct!
            </span>
          </div>
        )}
        {answered && (
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              setAiExplain(null);
              if (idx < questions.length - 1) {
                setIdx((i) => i + 1);
                setAnswered(false);
                setSelected(-1);
              } else setDone(true);
            }}
          >
            {idx < questions.length - 1 ? 'Next →' : 'Results'}
          </button>
        )}
      </div>
    </div>
  );
}
