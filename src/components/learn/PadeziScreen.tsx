import React, { useState, useRef } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar, speak, sh, PREPS } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { recordTopicResult } from '../../lib/adaptive.js';
import { completeExercise } from '../../hooks/useExerciseCompletion';

interface PadeziQuizQ {
  q: string;
  a: string;
  al: string[];
}

interface PadeziCase {
  name: string;
  q: string;
  en: string;
  use: string;
  exs: string[];
  tip: string;
}

interface PadeziShape {
  cases: PadeziCase[];
  quiz: PadeziQuizQ[];
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

export default function PadeziScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const { grammar, loading, error } = useGrammar();
  const finishFired = useRef(false);
  const [czMode, sCzMode] = useState('learn');
  const [czQ, sCzQ] = useState<PadeziQuizQ[]>([]);
  const [czI, sCzI] = useState(0);
  const [czS, sCzS] = useState(0);
  const [czA, sCzA] = useState(false);
  const [czSl, sCzSl] = useState(-1);
  const [czO, sCzO] = useState<string[]>([]);

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const PADEZI = grammar.PADEZI as unknown as PadeziShape;

  function startQuiz(): void {
    const q = sh(PADEZI.quiz) as PadeziQuizQ[];
    sCzQ(q);
    sCzI(0);
    sCzS(0);
    sCzA(false);
    sCzSl(-1);
    sCzO(sh([q[0]!.a].concat(q[0]!.al)) as string[]);
  }

  return (
    <div className="scr-wrap">
      {H('📚 Padeži — 7 Croatian Cases', 'Master noun endings for every situation', goBack)}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['learn', 'quiz'].map((m) => (
          <button
            key={m}
            className={'b ' + (czMode === m ? 'bp' : 'bg')}
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={() => {
              sCzMode(m);
              sCzI(0);
              sCzS(0);
              sCzA(false);
              sCzSl(-1);
              if (m === 'quiz') {
                const q = sh(PADEZI.quiz) as PadeziQuizQ[];
                sCzQ(q);
                sCzO(sh([q[0]!.a].concat(q[0]!.al)) as string[]);
              }
            }}
          >
            {m === 'learn' ? '📖 Learn' : '✏️ Quiz'}
          </button>
        ))}
      </div>

      {czMode === 'learn' && (
        <React.Fragment>
          {PADEZI.cases.map((c, i) => (
            <div
              key={i}
              className="c"
              style={{
                marginBottom: 12,
                borderLeft: '4px solid ' + (i < 2 ? '#0e7490' : i < 4 ? '#b45309' : '#7c3aed'),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 800, color: '#164e63' }}>
                  {i + 1}. {c.name}
                </div>
                <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 700 }}>{c.q}</div>
              </div>
              <div style={{ fontSize: 13, color: '#78716c', marginBottom: 4 }}>
                {c.en} — {c.use}
              </div>
              {c.exs.map((e, ei) => (
                <button
                  key={ei}
                  aria-label={`Play audio for ${e}`}
                  style={{
                    fontSize: 14,
                    padding: '4px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => speak(e)}
                >
                  <span aria-hidden="true">🔊</span> {e}
                </button>
              ))}
              <div style={{ fontSize: 12, color: '#b45309', marginTop: 6, fontStyle: 'italic' }}>
                💡 {c.tip}
              </div>
            </div>
          ))}
          <div className="c" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490', marginBottom: 10 }}>
              📌 Prepositions & Their Cases
            </div>
            {PREPS.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(0,0,0,.04)',
                  fontSize: 13,
                }}
              >
                <div style={{ minWidth: 60, fontWeight: 800, color: '#164e63' }}>{p.prep}</div>
                <div style={{ minWidth: 90, color: '#b45309', fontWeight: 600 }}>
                  {p.cases.join(', ')}
                </div>
                <div style={{ color: '#78716c' }}>{p.en}</div>
              </div>
            ))}
          </div>
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              sCzMode('quiz');
              startQuiz();
            }}
          >
            Start Quiz →
          </button>
        </React.Fragment>
      )}

      {czMode === 'quiz' &&
        (() => {
          if (!czQ.length) return null;
          const total = czQ.length;
          if (czI >= total) {
            const pct = Math.round((czS / total) * 100);
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : '👍'}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#164e63' }}>
                  Cases Quiz Complete!
                </h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490' }}>
                  {czS} / {total}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                  <button className="b bg" onClick={() => sCzMode('learn')}>
                    📖 Review
                  </button>
                  <button
                    className="b bp"
                    onClick={() => {
                      if (finishFired.current) return;
                      finishFired.current = true;
                      // Gate completion on the comprehension pass (>=75%) — no
                      // credit, XP or quest mark on a failed cases quiz.
                      completeExercise({
                        key: 'padezi',
                        score: czS,
                        total,
                        xp: czS * 3 + 15,
                        stats,
                        setStats,
                        writeDelta,
                        award,
                      });
                      goBack();
                    }}
                  >
                    🏠 Finish!
                  </button>
                </div>
              </div>
            );
          }
          const q = czQ[czI]!;
          const ci = czO.indexOf(q.a);
          return (
            <React.Fragment>
              <Bar v={czI + 1} mx={total} h={6} />
              <div className="c" style={{ marginTop: 16 }}>
                <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6 }}>{q.q}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {czO.map((o, oi) => (
                  <button
                    key={oi}
                    className={'ob ' + (czA ? (oi === ci ? 'ok' : czSl === oi ? 'no' : '') : '')}
                    onClick={() => {
                      if (!czA) {
                        sCzSl(oi);
                        sCzA(true);
                        const correct = oi === ci;
                        if (correct) {
                          sCzS((s) => s + 1);
                          if (typeof award === 'function') award(4, false, 'grammar');
                        }
                        recordTopicResult('cases', correct);
                      }
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {czA && (
                <button
                  className="b bp"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => {
                    if (czI < total - 1) {
                      const n = czQ[czI + 1]!;
                      sCzO(sh([n.a].concat(n.al)) as string[]);
                      sCzI((i) => i + 1);
                      sCzA(false);
                      sCzSl(-1);
                    } else {
                      sCzI(total);
                    }
                  }}
                >
                  {czI < total - 1 ? 'Next →' : 'See Results'}
                </button>
              )}
            </React.Fragment>
          );
        })()}
    </div>
  );
}
