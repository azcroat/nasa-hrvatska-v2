// @ts-nocheck
import React, { useState } from 'react';
import { H, speak } from '../../data';
import { FORMAL_REGISTER } from '../../data';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';

function QuizBlock({ questions, award }) {
  const { stats, setStats, writeDelta } = useStats();
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  function handleAnswer(qi, opt, correct) {
    if (answers[qi] !== undefined) return;
    const updated = { ...answers, [qi]: opt };
    setAnswers(updated);
    if (Object.keys(updated).length === questions.length) {
      const pts = Object.entries(updated).filter(([i, v]) => v === questions[i].a).length;
      setScore(pts);
      if (award) { award(pts * 5); markQuest('grammar'); }
      if (!stats.vs?.includes('formalregister')) {
        setStats(prev => {
          if (prev.vs?.includes('formalregister')) return prev;
          return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'formalregister'] };
        });
        if (writeDelta) writeDelta({ gc: 1, vs: ['formalregister'] });
      }
    }
  }

  return (
    <div>
      <h3 className="sh" style={{ marginTop: 4 }}>🎯 Quick Quiz</h3>
      {questions.map(function (q, qi) {
        const ans = answers[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--heading)' }}>{qi + 1}. {q.q}</div>
            {q.opts.map(function (opt, oi) {
              let bg = 'white', bc = '#e7e5e4', col = '#1c1917';
              if (ans) {
                if (opt === q.a) { bg = '#dcfce7'; bc = '#16a34a'; col = '#14532d'; }
                else if (opt === ans) { bg = '#fee2e2'; bc = '#dc2626'; col = '#7f1d1d'; }
              }
              return (
                <button key={oi} onClick={function () { handleAnswer(qi, opt, q.a); }}
                  style={{ display: 'block', width: '100%', marginBottom: 6, textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: '2px solid ' + bc, background: bg, color: col, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: "'Outfit',sans-serif" }}>
                  {opt}
                </button>
              );
            })}
            {ans && (
              <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4, padding: '6px 10px', background: 'rgba(14,116,144,.07)', borderRadius: 8, color: '#0e7490' }}>
                {ans === q.a ? '✓ Correct!' : '✗ Correct answer: ' + q.a}
              </div>
            )}
          </div>
        );
      })}
      {score !== null && (
        <div style={{ margin: '16px 0', padding: '14px 18px', background: score >= questions.length * 0.8 ? '#dcfce7' : '#fef3c7', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 16, color: score >= questions.length * 0.8 ? '#14532d' : '#92400e' }}>
          {score >= questions.length * 0.8 ? '🌟 ' : '💪 '}{score}/{questions.length} — {score >= questions.length * 0.8 ? 'Excellent!' : 'Keep practising!'}
        </div>
      )}
    </div>
  );
}

function FormalRegisterScreen({ goBack, award }) {
  const [tab, setTab] = useState('rules');
  const tabs = [{ k: 'rules', l: 'Rules' }, { k: 'compare', l: 'Compare' }, { k: 'verbs', l: 'Verb Forms' }, { k: 'email', l: 'Email' }, { k: 'quiz', l: 'Quiz' }];

  return (
    <div className="scr-wrap">
      {H('🤝 ' + FORMAL_REGISTER.title, FORMAL_REGISTER.intro)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.k} className={'b ' + (tab === t.k ? 'bp' : 'bg')} style={{ fontSize: 13 }} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {tab === 'rules' && (
        <div>
          {FORMAL_REGISTER.rules.map(function (r, i) {
            const colors = ['#0e7490', '#7c3aed', '#ca8a04'];
            const bgs = ['rgba(14,116,144,.06)', 'rgba(124,58,237,.06)', 'rgba(202,138,68,.06)'];
            return (
              <div key={i} style={{ marginBottom: 14, padding: '14px 16px', background: bgs[i], borderRadius: 14, borderLeft: '4px solid ' + colors[i] }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors[i], marginBottom: 8 }}>{r.icon} {r.rule}</div>
                {r.examples.map(function (ex, ei) {
                  return (
                    <div key={ei} style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid ' + colors[i] + '44', marginBottom: 4 }}>{ex}</div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Situation', 'ti (informal)', 'Vi (formal)'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#44403c', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMAL_REGISTER.comparison.map(function (row, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
                      <td style={{ padding: '8px 10px', color: '#78716c', fontSize: 12 }}>{row.situation}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {row.ti !== '—' ? (
                          <button aria-label={`Play audio for ${row.ti}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: '#0e7490', fontSize: 13, padding: 0, textAlign: 'left' }} onClick={() => speak(row.ti)}>{row.ti} <span aria-hidden="true">🔊</span></button>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <button aria-label={`Play audio for ${row.vi}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: '#7c3aed', fontSize: 13, padding: 0, textAlign: 'left' }} onClick={() => speak(row.vi)}>{row.vi} <span aria-hidden="true">🔊</span></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'verbs' && (
        <div>
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(124,58,237,.06)', borderRadius: 10, fontSize: 12, color: '#4c1d95', lineHeight: 1.6 }}>
            Vi uses the same conjugation as the 2nd person plural (oni/vi). It always takes a capital V in writing.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['', 'biti', 'imati', 'ići', 'moći', 'htjeti', 'govoriti'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontWeight: 700, color: '#44403c', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMAL_REGISTER.verbForms.map(function (row, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f8f4ff' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: i === 0 ? '#0e7490' : '#7c3aed', fontSize: 14 }}>{row.pronoun}</td>
                      {[row.biti, row.imati, row.ići, row.moći, row.htjeti, row.govoriti].map(function (v, vi) {
                        return (
                          <td key={vi} style={{ padding: '10px 8px', fontWeight: 600 }}>
                            <button aria-label={`Play audio for ${v}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13 }} onClick={() => speak(v)}>{v} <span aria-hidden="true">🔊</span></button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div>
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(14,116,144,.07)', borderRadius: 10, fontSize: 12, color: '#0e7490', lineHeight: 1.6 }}>
            Croatian formal emails use Vi throughout. Starting with just "Zdravo" to an official is considered unprofessional.
          </div>
          {FORMAL_REGISTER.emailPhrases.map(function (p, i) {
            return (
              <button key={i} aria-label={`Play audio for ${p.hr}`} className="c" style={{ marginBottom: 10, display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => speak(p.hr)}>
                <div style={{ fontSize: 11, color: '#78716c', marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>{p.hr} <span aria-hidden="true">🔊</span></div>
                <div style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={FORMAL_REGISTER.quiz} award={award} />}
    </div>
  );
}

export default FormalRegisterScreen;
