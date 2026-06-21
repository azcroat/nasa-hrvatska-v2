import React, { useState, useRef } from 'react';
import { H, speak } from '../../data';
import { SVOJMOJ } from '../../data';
import { useStats } from '../../context/StatsContext';
import { completeExercise } from '../../hooks/useExerciseCompletion';

interface QuizAnswer {
  chosen: string;
  note: string;
}

function SvojMojScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const [quizAnswers, setQuizAnswers] = useState<Record<number, QuizAnswer>>({});
  const finishFired = useRef(false);

  function handleQuiz(qi: number, o: string, correct: string, note: string): void {
    if (quizAnswers[qi] !== undefined) return;
    const next = { ...quizAnswers, [qi]: { chosen: o, note } };
    setQuizAnswers(next);
    if (o === correct && award) award(5, false, 'grammar');
    // When every quiz question has been answered, gate-complete the lesson via
    // the single completion authority — credited (gc/vs/quest) only on a >=75%
    // pass, idempotently. Per-answer XP is already awarded above, so xp: 0 here.
    if (
      !finishFired.current &&
      SVOJMOJ.quiz.length > 0 &&
      Object.keys(next).length === SVOJMOJ.quiz.length
    ) {
      finishFired.current = true;
      const score = SVOJMOJ.quiz.filter((q, i) => next[i]?.chosen === q.a).length;
      completeExercise({
        key: 'svojmoj',
        score,
        total: SVOJMOJ.quiz.length,
        xp: 0,
        stats,
        setStats,
        writeDelta,
      });
    }
  }

  return (
    <div className="scr-wrap">
      {H('🪞 ' + SVOJMOJ.title, 'Reflexive possessive — the native-speaker tell', goBack)}

      <div
        style={{
          marginBottom: 16,
          padding: '14px 16px',
          background: 'rgba(124,58,237,.06)',
          borderRadius: 12,
          borderLeft: '3px solid #7c3aed',
        }}
      >
        <div style={{ fontSize: 13, color: '#4c1d95', lineHeight: 1.7 }}>{SVOJMOJ.intro}</div>
      </div>

      {/* The Core Rule */}
      <div
        style={{
          marginBottom: 20,
          padding: '16px',
          background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          borderRadius: 14,
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            opacity: 0.8,
            marginBottom: 6,
            letterSpacing: '0.08em',
          }}
        >
          THE RULE
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>{SVOJMOJ.rule}</div>
      </div>

      {/* Wrong vs Right pairs */}
      <h3 className="sh">Common Mistakes — Fixed</h3>
      {SVOJMOJ.pairs.map(function (p, pi) {
        return (
          <div
            key={pi}
            style={{
              marginBottom: 12,
              background: 'white',
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,.07)',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}
          >
            <div style={{ display: 'flex', gap: 8, padding: '12px 14px' }}>
              <div
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#fee2e2',
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                  ✗ SOUNDS FOREIGN
                </div>
                <div style={{ color: '#7f1d1d', fontStyle: 'italic' }}>{p.wrong}</div>
              </div>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#dcfce7',
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  border: 'none',
                }}
                onClick={function () {
                  speak(p.right);
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                  ✓ NATIVE <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ color: '#14532d', fontWeight: 700 }}>{p.right}</div>
              </button>
            </div>
            <div
              style={{ padding: '0 14px 12px', fontSize: 11, color: '#78716c', lineHeight: 1.5 }}
            >
              {p.note}
            </div>
          </div>
        );
      })}

      {/* Declension table */}
      <h3 className="sh" style={{ marginTop: 4 }}>
        Svoj — All Forms
      </h3>
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Case', 'Masc', 'Fem', 'Neut', 'Plural'].map(function (h) {
                return (
                  <th
                    key={h}
                    style={{
                      padding: '6px 8px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#44403c',
                      fontSize: 11,
                    }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SVOJMOJ.forms.map(function (row, ri) {
              return (
                <tr
                  key={ri}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: ri % 2 === 0 ? 'white' : '#fafaf9',
                  }}
                >
                  <td
                    style={{ padding: '6px 8px', fontWeight: 700, color: '#7c3aed', fontSize: 11 }}
                  >
                    {row.case}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#1c1917' }}>{row.m}</td>
                  <td style={{ padding: '6px 8px', color: '#1c1917' }}>{row.f}</td>
                  <td style={{ padding: '6px 8px', color: '#1c1917' }}>{row.n}</td>
                  <td style={{ padding: '6px 8px', color: '#1c1917' }}>{row.pl}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Exceptions */}
      <h3 className="sh">Good to Know</h3>
      {SVOJMOJ.exceptions.map(function (e, ei) {
        return (
          <div
            key={ei}
            style={{
              marginBottom: 8,
              padding: '10px 14px',
              background: '#fef3c7',
              borderRadius: 10,
              borderLeft: '3px solid #ca8a04',
              fontSize: 12,
              color: '#92400e',
              lineHeight: 1.6,
              display: 'flex',
              gap: 8,
            }}
          >
            <span>{e.icon}</span>
            <span>{e.text}</span>
          </div>
        );
      })}

      {/* Quiz */}
      <h3 className="sh" style={{ marginTop: 4 }}>
        🎯 Quick Quiz
      </h3>
      <div
        style={{
          marginBottom: 8,
          padding: '10px 14px',
          background: 'rgba(124,58,237,.06)',
          borderRadius: 10,
          fontSize: 12,
          color: '#4c1d95',
        }}
      >
        Choose <strong>svoj/svoja/svoje/svoje</strong> or the possessive that fits the sentence.
      </div>
      {SVOJMOJ.quiz.map(function (q, qi) {
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1c1917' }}>
              {'🇬🇧 '}
              {q.q}
            </div>
            {q.opts.map(function (o, oi) {
              const ans = quizAnswers[qi];
              let bg = 'white',
                bc = '#e7e5e4',
                col = '#1c1917';
              if (ans) {
                if (o === q.a) {
                  bg = '#dcfce7';
                  bc = '#16a34a';
                  col = '#14532d';
                } else if (o === ans.chosen) {
                  bg = '#fee2e2';
                  bc = '#dc2626';
                  col = '#7f1d1d';
                }
              }
              return (
                <button
                  key={oi}
                  onClick={function () {
                    handleQuiz(qi, o, q.a, q.note);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginBottom: 6,
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '2px solid ' + bc,
                    background: bg,
                    color: col,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {o}
                </button>
              );
            })}
            {quizAnswers[qi] && (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginTop: 4,
                  padding: '6px 10px',
                  background: 'rgba(124,58,237,.05)',
                  borderRadius: 8,
                  color: '#4c1d95',
                }}
              >
                {quizAnswers[qi].chosen === q.a ? '✓ Correct! ' : '✗ Answer: ' + q.a + ' — '}
                {q.note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SvojMojScreen;
