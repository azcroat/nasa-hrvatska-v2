import React, { useState, useMemo, useRef } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { QWORDS } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean) => void;
}

function QuestionWordsScreen({ goBack, award }: Props) {
  const questions = useMemo(() => shMemo('qw', QWORDS, undefined), []);
  const shuffledOpts = useMemo(
    () =>
      questions.map((q: { q: string; en: string; opts: string[]; a: string }) => sh([...q.opts])),
    [questions],
  );
  const total = questions.length;
  const [answers, setAnswers] = useState(() => new Array(total).fill(null));
  const [selected, setSelected] = useState(() => new Array(total).fill(null));

  const questFiredRef = useRef(false);
  const correctCount = answers.filter((a) => a === 'correct').length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const allDone = answeredCount === total;
  const xpEarned = correctCount * 3;
  if (allDone && !questFiredRef.current) {
    questFiredRef.current = true;
    markQuest('grammar');
  }

  function handleAnswer(
    qi: number,
    o: string,
    q: { q: string; en: string; opts: string[]; a: string },
  ) {
    if (answers[qi] !== null) return;
    const isCorrect = o === q.a;
    setAnswers((prev) => {
      const n = [...prev];
      n[qi] = isCorrect ? 'correct' : 'wrong';
      return n;
    });
    setSelected((prev) => {
      const n = [...prev];
      n[qi] = o;
      return n;
    });
    if (isCorrect) {
      if (typeof award === 'function') award(3);
      speak(q.q.replace('_____', q.a));
    }
  }

  return (
    <div className="scr-wrap">
      {H('❓ Question Words', 'Tko? Što? Gdje? Kad? Koliko? Kako? Zašto?', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 Croatian has specific question words for each type of information. Gender matters for
        'what kind of' — Kakav (m), Kakva (f), Kakvo (n).
      </div>

      {/* Progress bar */}
      {answeredCount > 0 && !allDone && (
        <div
          style={{
            marginBottom: 12,
            background: 'rgba(0,0,0,.06)',
            borderRadius: 8,
            height: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(answeredCount / total) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
              borderRadius: 8,
              transition: 'width .3s',
            }}
          />
        </div>
      )}

      {questions.map(function (
        q: { q: string; en: string; opts: string[]; a: string },
        qi: number,
      ) {
        const state = answers[qi];
        const sel = selected[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {q.q}
              {' — '}
              <span style={{ color: '#78716c', fontStyle: 'italic' }}>{q.en}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {(shuffledOpts[qi] ?? []).map(function (o: string, oi: number) {
                let bg = 'white',
                  border = '#d6d3d1';
                if (state !== null) {
                  if (o === q.a) {
                    bg = '#dcfce7';
                    border = '#16a34a';
                  } else if (o === sel) {
                    bg = '#fee2e2';
                    border = '#dc2626';
                  }
                }
                return (
                  <button
                    key={oi}
                    disabled={state !== null}
                    style={{
                      padding: '6px 14px',
                      border: `2px solid ${border}`,
                      borderRadius: 10,
                      background: bg,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: state !== null ? 'default' : 'pointer',
                      transition: 'background .15s,border-color .15s',
                    }}
                    onClick={() => handleAnswer(qi, o, q)}
                  >
                    {o}
                  </button>
                );
              })}
              {state === 'correct' && <span style={{ fontSize: 14 }}>✅</span>}
              {state === 'wrong' && (
                <span style={{ fontSize: 13, color: '#0e7490', fontWeight: 700 }}>→ {q.a}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Completion card */}
      {allDone && (
        <div
          className="c"
          style={{
            marginTop: 16,
            padding: '20px 16px',
            background: 'linear-gradient(135deg,rgba(14,116,144,.09),rgba(6,182,212,.06))',
            textAlign: 'center',
            border: '1.5px solid rgba(14,116,144,.22)',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>
            {correctCount === total ? '🏆' : correctCount >= Math.ceil(total * 0.7) ? '⭐' : '💪'}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}>
            {correctCount}/{total} correct
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12 }}>
            {correctCount === total
              ? 'Perfect! All question words mastered.'
              : correctCount >= Math.ceil(total * 0.7)
                ? 'Great job! Review the missed ones and try again.'
                : 'Good start — review the highlighted answers above.'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', marginBottom: 16 }}>
            +{xpEarned} XP
          </div>
          <button
            onClick={goBack}
            style={{
              padding: '10px 28px',
              background: 'linear-gradient(135deg,#0e7490,#0891b2)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default QuestionWordsScreen;
