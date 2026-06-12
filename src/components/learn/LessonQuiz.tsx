// src/components/learn/LessonQuiz.tsx
import React, { useMemo, useState } from 'react';
import { H, sh } from '../../data';
import { useStats } from '../../context/StatsContext';
import { completeLesson } from '../../hooks/useLessonCompletion';
import { LESSON_PASS_THRESHOLD, lessonScorePct } from '../../lib/lessonGate';

export interface LessonQuizQuestion {
  prompt: string;
  options: string[];
  correctIdx: number;
  note?: string;
}
interface Props {
  screenId: string;
  statKind: 'lc' | 'gc';
  questions: LessonQuizQuestion[];
  xp: number;
  questKind?: string;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  goBack: () => void;
  title?: string;
}

export default function LessonQuiz({
  screenId,
  statKind,
  questions,
  xp,
  questKind,
  award,
  goBack,
  title,
}: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const q = questions[i];

  // Hooks must run before any early return. Shuffle option order per question,
  // tracking which shuffled slot is correct.
  const opts = useMemo(() => {
    if (!q) return [] as Array<{ text: string; correct: boolean }>;
    const order = sh(q.options.map((_, k) => k)) as number[];
    return order.map((k) => ({ text: q.options[k]!, correct: k === q.correctIdx }));
  }, [q]);

  if (done || !q) {
    const passed = lessonScorePct(score, total) >= LESSON_PASS_THRESHOLD;
    if (done) {
      // Fire the gated completion (pass-only, idempotent) when results render.
      completeLesson({
        screenId,
        statKind,
        score,
        total,
        xp,
        questKind,
        stats,
        setStats,
        writeDelta,
        award,
      });
    }
    const pct = Math.round(lessonScorePct(score, total) * 100);
    return (
      <div className="scr-wrap">
        {H(title || '📝 Check', '', goBack)}
        <div style={{ textAlign: 'center', padding: '32px 16px' }} data-testid="lessonquiz-result">
          <div style={{ fontSize: 48 }}>{passed ? '🏆' : '💪'}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {score}/{total} · {pct}%
          </div>
          <div style={{ fontSize: 13, color: '#78716c', margin: '8px 0 20px' }}>
            {passed
              ? 'Passed — lesson complete!'
              : `Not passed — need ${Math.round(LESSON_PASS_THRESHOLD * 100)}%. Review and try again.`}
          </div>
          {passed ? (
            <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
              ✓ Done
            </button>
          ) : (
            <button
              className="b bp"
              style={{ width: '100%' }}
              data-testid="lessonquiz-retry"
              onClick={() => {
                setI(0);
                setScore(0);
                setAnswered(null);
                setDone(false);
              }}
            >
              ↻ Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  function choose(k: number) {
    if (answered !== null) return;
    setAnswered(k);
    if (opts[k]!.correct) setScore((s) => s + 1);
  }
  function next() {
    setAnswered(null);
    if (i < total - 1) setI(i + 1);
    else setDone(true);
  }

  return (
    <div className="scr-wrap">
      {H(title || '📝 Check', `${i + 1} / ${total}`, goBack)}
      <div className="c" style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>
        {q.prompt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {opts.map((o, k) => (
          <button
            key={k}
            data-testid="lessonquiz-option"
            className={
              'ob ' + (answered !== null ? (o.correct ? 'ok' : answered === k ? 'no' : '') : '')
            }
            onClick={() => choose(k)}
          >
            {o.text}
          </button>
        ))}
      </div>
      {answered !== null && (
        <button
          className="b bp"
          style={{ width: '100%', marginTop: 16 }}
          data-testid="lessonquiz-next"
          onClick={next}
        >
          {i < total - 1 ? 'Next →' : 'See result'}
        </button>
      )}
    </div>
  );
}
