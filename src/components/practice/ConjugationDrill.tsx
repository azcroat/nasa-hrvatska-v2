import React, { useState, useRef } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar, speak, sh } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';

interface ConjVerb {
  inf: string;
  en: string;
  tense: string;
  forms: string[];
}
interface ConjShape {
  verbs: ConjVerb[];
  persons: string[];
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function ConjugationDrill({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const { grammar, loading, error } = useGrammar();
  const finishFired = useRef(false);
  const [cjMode, sCjMode] = useState('menu');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cjQ, sCjQ] = useState<any[]>([]);
  const [cjI, sCjI] = useState(0);
  const [cjS, sCjS] = useState(0);
  const [cjA, sCjA] = useState(false);
  const [cjSl, sCjSl] = useState(-1);
  const [cjO, sCjO] = useState<string[]>([]);

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const CONJ = grammar.CONJ as unknown as ConjShape;

  function startQuiz(tense: string) {
    const pool = tense === 'all' ? CONJ.verbs : CONJ.verbs.filter((v) => v.tense === tense);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qs: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pool.forEach((v: any) => {
      CONJ.persons.forEach((p, pi) => {
        qs.push({ verb: v.inf, en: v.en, tense: v.tense, person: p, pi, answer: v.forms[pi] });
      });
    });
    const picked = sh(qs).slice(0, 20);
    const first = picked[0]!;
    const wrongs = sh(CONJ.verbs.flatMap((v) => v.forms).filter((f) => f !== first.answer)).slice(
      0,
      3,
    );
    sCjQ(picked);
    sCjI(0);
    sCjS(0);
    sCjA(false);
    sCjSl(-1);
    sCjO(sh([first.answer].concat(wrongs)));
    sCjMode('quiz');
  }

  return (
    <div className="scr-wrap">
      {H('🔄 Verb Conjugation Drill', 'Present, past & future tense', goBack)}

      {cjMode === 'menu' && (
        <React.Fragment>
          <div className="c" style={{ marginBottom: 20 }}>
            Choose a tense to practice. Conjugate verbs for all 6 persons.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['all', 'present', 'past', 'future'].map((t) => (
              <div
                key={t}
                className="tc"
                style={{ textAlign: 'center', cursor: 'pointer', padding: '20px 14px' }}
                onClick={() => startQuiz(t)}
              >
                <div style={{ fontSize: 32 }}>
                  {t === 'all' ? '🎲' : t === 'present' ? '📍' : t === 'past' ? '⏮' : '⏭'}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginTop: 6,
                    textTransform: 'capitalize',
                  }}
                >
                  {t === 'all' ? 'All Tenses' : t + ' Tense'}
                </div>
                <div style={{ fontSize: 12, color: '#78716c' }}>
                  {t === 'all'
                    ? CONJ.verbs.length + ' verbs'
                    : CONJ.verbs.filter((v) => v.tense === t).length + ' verbs'}
                </div>
              </div>
            ))}
          </div>
          <div className="c" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490', marginBottom: 10 }}>
              📖 Verb Reference
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {CONJ.verbs
                .filter((v) => v.tense === 'present')
                .map((v, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px',
                      background: 'rgba(14,116,144,.04)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                    onClick={() => speak(v.forms[0] ?? '')}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#164e63' }}>{v.inf}</div>
                    <div style={{ fontSize: 11, color: '#78716c' }}>{v.en}</div>
                  </div>
                ))}
            </div>
          </div>
        </React.Fragment>
      )}

      {cjMode === 'quiz' &&
        (() => {
          const total = cjQ.length;
          if (cjI >= total) {
            const pct = Math.round((cjS / total) * 100);
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : '👍'}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#164e63' }}>
                  Conjugation Complete!
                </h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490' }}>
                  {cjS} / {total}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                  <button className="b bg" onClick={() => sCjMode('menu')}>
                    📋 Menu
                  </button>
                  <button
                    className="b bp"
                    onClick={() => {
                      if (finishFired.current) return;
                      finishFired.current = true;
                      if (typeof award === 'function') award(cjS * 2 + 10, false, 'grammar');
                      markQuest('grammar');
                      if (!stats.vs?.includes('conjugation')) {
                        setStats((prev) => {
                          if (prev.vs?.includes('conjugation')) return prev;
                          return {
                            ...prev,
                            gc: (prev.gc || 0) + 1,
                            vs: [...(prev.vs || []), 'conjugation'],
                          };
                        });
                        if (writeDelta) writeDelta({ gc: 1, vs: ['conjugation'] });
                      }
                      goBack();
                    }}
                  >
                    🏠 Finish!
                  </button>
                </div>
              </div>
            );
          }
          const q = cjQ[cjI]!;
          const ci = cjO.indexOf(q.answer);
          const tC = q.tense === 'present' ? '#0e7490' : q.tense === 'past' ? '#b45309' : '#7c3aed';
          const tL = q.tense.toUpperCase();
          return (
            <React.Fragment>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {cjI + 1} / {total}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>Score: {cjS}</div>
              </div>
              <Bar v={cjI + 1} mx={total} color={tC} h={6} />
              <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fff',
                    background: tC,
                    marginBottom: 8,
                  }}
                >
                  {tL}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#164e63' }}>
                  {q.verb} ({q.en})
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: tC, marginTop: 8 }}>
                  {q.person} ___?
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {cjO.map((o, oi) => (
                  <button
                    key={oi}
                    className={'ob ' + (cjA ? (oi === ci ? 'ok' : cjSl === oi ? 'no' : '') : '')}
                    onClick={() => {
                      if (!cjA) {
                        sCjSl(oi);
                        sCjA(true);
                        const correct = oi === ci;
                        if (correct) {
                          sCjS((s) => s + 1);
                        }
                        recordTopicResult('grammar', correct);
                      }
                    }}
                  >
                    {q.person} {o}
                  </button>
                ))}
              </div>
              {cjA && (
                <button
                  className="b bp"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => {
                    if (cjI < total - 1) {
                      const next = cjQ[cjI + 1]!;
                      const wrongs = sh(
                        CONJ.verbs.flatMap((v) => v.forms).filter((f) => f !== next.answer),
                      ).slice(0, 3);
                      sCjO(sh([next.answer].concat(wrongs)));
                      sCjI((i) => i + 1);
                      sCjA(false);
                      sCjSl(-1);
                    } else {
                      sCjI(total);
                    }
                  }}
                >
                  {cjI < total - 1 ? 'Next →' : 'See Results'}
                </button>
              )}
            </React.Fragment>
          );
        })()}
    </div>
  );
}
