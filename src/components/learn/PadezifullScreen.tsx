import React, { useState, useRef } from 'react';
import { H, Bar, speak, sh, PADEZI_FULL } from '../../data';
import { useStats } from '../../context/StatsContext.tsx';

interface PfQuizQuestion {
  base: string;
  sentence: string;
  en: string;
  answer: string;
  caseName: string;
  opts: string[];
}

export default function PadezifullScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [pfTab, sPfTab] = useState('sing');
  const [pfMode, sPfMode] = useState('learn');
  const [pfGender, sPfGender] = useState('f');
  const [pfQ, sPfQ] = useState<PfQuizQuestion[]>([]);
  const [pfI, sPfI] = useState(0);
  const [pfS, sPfS] = useState(0);
  const [pfA, sPfA] = useState(false);
  const [pfSl, sPfSl] = useState(-1);
  const [pfO, sPfO] = useState<string[]>([]);
  const [pfCaseA, sPfCaseA] = useState(false);
  const [_pfCaseSl, sPfCaseSl] = useState(-1);

  function startQuiz(): void {
    const q = sh(PADEZI_FULL.quiz) as PfQuizQuestion[];
    sPfQ(q);
    sPfI(0);
    sPfS(0);
    sPfA(false);
    sPfSl(-1);
    sPfO(q[0]!.opts);
    sPfCaseA(false);
    sPfCaseSl(-1);
  }

  const genderBg = (g: string): string =>
    g === 'f'
      ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
      : g === 'n'
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0e7490,#164e63)';
  const genderBorder = (g: string): string =>
    g === 'f' ? '#dc2626' : g === 'n' ? '#16a34a' : '#0e7490';

  return (
    <div className="scr-wrap">
      {H('📚 ' + PADEZI_FULL.title, PADEZI_FULL.subtitle, goBack)}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['sing', 'plur', 'quiz'].map((t) => (
          <button
            key={t}
            className={'b ' + (pfTab === t || (pfMode === 'quiz' && t === 'quiz') ? 'bp' : 'bg')}
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={() => {
              sPfTab(t);
              if (t !== 'quiz') sPfMode('learn');
              if (t === 'quiz') {
                sPfMode('quiz');
                startQuiz();
              }
            }}
          >
            {t === 'sing' ? 'Jednina' : t === 'plur' ? 'Množina' : '🏆 Quiz'}
          </button>
        ))}
      </div>

      {pfTab === 'sing' &&
        pfMode === 'learn' &&
        (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (PADEZI_FULL.singEndings as Record<string, any>)[pfGender];
          return (
            <React.Fragment>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['f', 'n', 'm'].map((g) => (
                  <button
                    key={g}
                    className={'b ' + (pfGender === g ? 'bw' : 'bg')}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={() => sPfGender(g)}
                  >
                    {g === 'f' ? '🔴 Ženski' : g === 'n' ? '🟢 Srednji' : '🔵 Muški'}
                  </button>
                ))}
              </div>
              <div
                className="c"
                style={{ marginBottom: 12, borderLeft: '4px solid ' + genderBorder(pfGender) }}
              >
                <div style={{ fontSize: 15, fontWeight: 800 }}>{data.label}</div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>
                  Endings: {data.endings.join(' / ')}
                </div>
                {data.note && (
                  <div style={{ fontSize: 12, color: '#b45309', marginTop: 6, fontWeight: 600 }}>
                    ⚠️ {data.note}
                  </div>
                )}
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.words.map((w: any, wi: number) => (
                <div
                  key={wi}
                  className="c"
                  style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      background: genderBg(pfGender),
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {w.nom} ({w.en})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {PADEZI_FULL.caseNames.map((cn, ci) => (
                        <tr
                          key={ci}
                          role="button"
                          tabIndex={0}
                          aria-label={`Play audio for ${w.forms[ci]}`}
                          style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                          onClick={() => speak(w.forms[ci])}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              speak(w.forms[ci]);
                            }
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontWeight: 700, width: '30%' }}>
                            {cn}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              fontSize: 11,
                              color: '#78716c',
                              width: '25%',
                            }}
                          >
                            {PADEZI_FULL.caseQs[ci]}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            {w.forms[ci]} <span aria-hidden="true">🔊</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </React.Fragment>
          );
        })()}

      {pfTab === 'plur' &&
        pfMode === 'learn' &&
        (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (PADEZI_FULL.plurEndings as Record<string, any>)[pfGender];
          return (
            <React.Fragment>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['f', 'n', 'm'].map((g) => (
                  <button
                    key={g}
                    className={'b ' + (pfGender === g ? 'bw' : 'bg')}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={() => sPfGender(g)}
                  >
                    {g === 'f' ? '🔴 Ženski' : g === 'n' ? '🟢 Srednji' : '🔵 Muški'}
                  </button>
                ))}
              </div>
              <div
                className="c"
                style={{ marginBottom: 12, borderLeft: '4px solid ' + genderBorder(pfGender) }}
              >
                <div style={{ fontSize: 15, fontWeight: 800 }}>{data.label}</div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>
                  Noun: {data.endings.join(' / ')}
                </div>
                <div style={{ fontSize: 13, color: '#7c3aed', marginTop: 2 }}>
                  Adj: {data.adjEnd.join(' / ')}
                </div>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.words.map((w: any, wi: number) => (
                <div
                  key={wi}
                  className="c"
                  style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      background: genderBg(pfGender),
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {w.adj} {w.nom} ({w.en})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {PADEZI_FULL.caseNames.map((cn, ci) => (
                        <tr
                          key={ci}
                          role="button"
                          tabIndex={0}
                          aria-label={`Play audio for ${w.forms[ci]}`}
                          style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                          onClick={() => speak(w.forms[ci])}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              speak(w.forms[ci]);
                            }
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontWeight: 700, width: '30%' }}>
                            {cn}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            {w.forms[ci]} <span aria-hidden="true">🔊</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </React.Fragment>
          );
        })()}

      {pfMode === 'quiz' &&
        (() => {
          if (!pfQ.length) return null;
          const total = pfQ.length;
          if (pfI >= total) {
            const pct = Math.round((pfS / total) * 100);
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : '📚'}</div>
                <h2>
                  {pfS} / {total}
                </h2>
                <button
                  className="b bp"
                  onClick={() => {
                    if (finishFired.current) return;
                    finishFired.current = true;
                    if (typeof award === 'function') award(pfS * 5);
                    if (!stats.vs?.includes('padezifull')) {
                      setStats((prev) => {
                        if (prev.vs?.includes('padezifull')) return prev;
                        return {
                          ...prev,
                          gc: (prev.gc || 0) + 1,
                          vs: [...(prev.vs || []), 'padezifull'],
                        };
                      });
                      if (writeDelta) writeDelta({ gc: 1, vs: ['padezifull'] });
                    }
                    goBack();
                  }}
                >
                  🏠 Finish
                </button>
              </div>
            );
          }
          const q = pfQ[pfI]!;
          if (!pfA)
            return (
              <React.Fragment>
                <Bar v={pfI + 1} mx={total} />
                <div className="c" style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
                    Base: {q.base}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 8 }}>{q.sentence}</div>
                  <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>{q.en}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {pfO.map((o, oi) => (
                    <button
                      key={oi}
                      className="ob"
                      onClick={() => {
                        sPfSl(oi);
                        sPfA(true);
                        if (o === q.answer) sPfS((s) => s + 1);
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </React.Fragment>
            );
          if (pfA && !pfCaseA)
            return (
              <React.Fragment>
                <div className="c" style={{ textAlign: 'center', marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: pfO[pfSl] === q.answer ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {pfO[pfSl] === q.answer ? '✅ ' + q.answer : '❌ ' + q.answer}
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 8 }}>Which case?</div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 16,
                    justifyContent: 'center',
                  }}
                >
                  {PADEZI_FULL.caseNames.map((cn, ci) => (
                    <button
                      key={ci}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border:
                          '2px solid ' +
                          (pfCaseA ? (cn === q.caseName ? '#16a34a' : '#e7e5e4') : '#d6d3d1'),
                        background: pfCaseA ? (cn === q.caseName ? '#dcfce7' : 'white') : 'white',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (!pfCaseA) {
                          sPfCaseSl(ci);
                          sPfCaseA(true);
                          if (cn === q.caseName && pfO[pfSl] === q.answer) sPfS((s) => s + 0.5);
                        }
                      }}
                    >
                      {cn}
                    </button>
                  ))}
                </div>
              </React.Fragment>
            );
          return (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {q.answer} ({q.caseName})
              </div>
              <button
                className="b bp"
                style={{ marginTop: 16 }}
                onClick={() => {
                  if (pfI < total - 1) {
                    const n = pfQ[pfI + 1]!;
                    sPfO(n.opts);
                    sPfI(pfI + 1);
                    sPfA(false);
                    sPfSl(-1);
                    sPfCaseA(false);
                    sPfCaseSl(-1);
                  } else {
                    sPfI(total);
                  }
                }}
              >
                Next →
              </button>
            </div>
          );
        })()}
    </div>
  );
}
