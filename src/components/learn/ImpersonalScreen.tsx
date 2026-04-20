// @ts-nocheck
import React, { useState } from 'react';
import { H, speak } from '../../data';
import { IMPERSONAL } from '../../data';
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
      if (award) {
        award(pts * 5);
        markQuest('grammar');
      }
      if (!stats.vs?.includes('impersonal')) {
        setStats((prev) => {
          if (prev.vs?.includes('impersonal')) return prev;
          return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'impersonal'] };
        });
        if (writeDelta) writeDelta({ gc: 1, vs: ['impersonal'] });
      }
    }
  }

  return (
    <div>
      <h3 className="sh" style={{ marginTop: 4 }}>
        🎯 Quick Quiz
      </h3>
      {questions.map(function (q, qi) {
        const ans = answers[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--heading)' }}
            >
              {qi + 1}. {q.q}
            </div>
            {q.opts.map(function (opt, oi) {
              let bg = 'white',
                bc = '#e7e5e4',
                col = '#1c1917';
              if (ans) {
                if (opt === q.a) {
                  bg = '#dcfce7';
                  bc = '#16a34a';
                  col = '#14532d';
                } else if (opt === ans) {
                  bg = '#fee2e2';
                  bc = '#dc2626';
                  col = '#7f1d1d';
                }
              }
              return (
                <button
                  key={oi}
                  onClick={function () {
                    handleAnswer(qi, opt, q.a);
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
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {ans && (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginTop: 4,
                  padding: '6px 10px',
                  background: 'rgba(14,116,144,.07)',
                  borderRadius: 8,
                  color: '#0e7490',
                }}
              >
                {ans === q.a ? '✓ Correct!' : '✗ Correct answer: ' + q.a}
              </div>
            )}
          </div>
        );
      })}
      {score !== null && (
        <div
          style={{
            margin: '16px 0',
            padding: '14px 18px',
            background: score >= questions.length * 0.8 ? '#dcfce7' : '#fef3c7',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: score >= questions.length * 0.8 ? '#14532d' : '#92400e',
          }}
        >
          {score >= questions.length * 0.8 ? '🌟 ' : '💪 '}
          {score}/{questions.length} —{' '}
          {score >= questions.length * 0.8 ? 'Excellent!' : 'Keep practising!'}
        </div>
      )}
    </div>
  );
}

function ImpersonalScreen({ goBack, award }) {
  const [tab, setTab] = useState('constructions');
  const tabs = [
    { k: 'constructions', l: 'Constructions' },
    { k: 'signs', l: 'Signs' },
    { k: 'quiz', l: 'Quiz' },
  ];

  return (
    <div className="scr-wrap">
      {H('🔁 ' + IMPERSONAL.title, IMPERSONAL.intro)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            className={'b ' + (tab === t.k ? 'bp' : 'bg')}
            style={{ fontSize: 13 }}
            onClick={() => setTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'constructions' && (
        <div>
          {IMPERSONAL.constructions.map(function (c, i) {
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,.07)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                }}
              >
                <button
                  aria-label={`Play audio for ${c.hr}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => speak(c.hr)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 800, color: '#0e7490' }}>
                      {c.hr} <span aria-hidden="true">🔊</span>
                    </span>
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{c.en}</span>
                  </div>
                </button>
                <div
                  style={{ padding: '0 16px 12px', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}
                >
                  <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, marginBottom: 6 }}>
                    {c.note}
                  </div>
                  <button
                    aria-label={`Play audio for ${c.example}`}
                    style={{
                      background: 'rgba(14,116,144,.07)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0e7490',
                      cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                    }}
                    onClick={() => speak(c.example)}
                  >
                    {c.example} <span aria-hidden="true">🔊</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'signs' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 10,
              fontSize: 12,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            These signs appear on buildings, shops, and public spaces across Croatia. Recognising
            them instantly will save you a lot of confusion.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {IMPERSONAL.signs.map(function (s, i) {
              return (
                <button
                  key={i}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                  }}
                  onClick={() => speak(s.sign)}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#0e7490',
                      letterSpacing: '.03em',
                    }}
                  >
                    {s.sign}
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 4 }}>{s.en}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={IMPERSONAL.quiz} award={award} />}
    </div>
  );
}

export default ImpersonalScreen;
