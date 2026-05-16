import React, { useState } from 'react';
import { H, speak } from '../../data';
import { useContent } from '../../hooks/useContent';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';

interface TechQuizQ {
  q: string;
  opts: string[];
  a: string;
}

function QuizBlock({
  questions,
  award,
}: {
  questions: TechQuizQ[];
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  function handleAnswer(qi: number, opt: string, correct: string): void {
    void correct;
    if (answers[qi] !== undefined) return;
    const updated = { ...answers, [qi]: opt };
    setAnswers(updated);
    if (Object.keys(updated).length === questions.length) {
      const pts = Object.entries(updated).filter(
        ([i, v]) => v === (questions[Number(i)] as TechQuizQ).a,
      ).length;
      setScore(pts);
      if (award) {
        award(pts * 5, false, 'vocabulary');
        markQuest('vocab');
      }
      if (!stats.vs?.includes('techvoc')) {
        setStats((prev) => {
          if (prev.vs?.includes('techvoc')) return prev;
          return { ...prev, lc: (prev.lc || 0) + 1, vs: [...(prev.vs || []), 'techvoc'] };
        });
        if (writeDelta) writeDelta({ lc: 1, vs: ['techvoc'] });
      }
    }
  }

  return (
    <div>
      <h3 className="sh" style={{ marginTop: 4 }}>
        🎯 Quick Quiz
      </h3>
      {questions.map(function (q: TechQuizQ, qi: number) {
        const ans = answers[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--heading)' }}
            >
              {qi + 1}. {q.q}
            </div>
            {q.opts.map(function (opt: string, oi: number) {
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

function TechVocScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { content, loading, error } = useContent();
  const [catIdx, setCatIdx] = useState(0);
  const [tab, setTab] = useState('vocab');
  if (error)
    return (
      <div className="scr-wrap">
        {H('💻 Tech Vocabulary', "Couldn't load — please retry.", goBack)}
      </div>
    );
  if (loading || !content)
    return <div className="scr-wrap">{H('💻 Tech Vocabulary', 'Loading…', goBack)}</div>;
  const TECH_VOC = content.TECH_VOC as {
    title: string;
    intro: string;
    categories: any[];
    phrases: any[];
    quiz: any[];
  };
  const cat = TECH_VOC.categories[catIdx]!;

  return (
    <div className="scr-wrap">
      {H('💻 ' + TECH_VOC.title, TECH_VOC.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className={'b ' + (tab === 'vocab' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('vocab')}
        >
          Vocabulary
        </button>
        <button
          className={'b ' + (tab === 'phrases' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('phrases')}
        >
          Phrases
        </button>
        <button
          className={'b ' + (tab === 'quiz' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('quiz')}
        >
          Quiz
        </button>
      </div>

      {tab === 'vocab' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {TECH_VOC.categories.map(function (c: any, i: number) {
              return (
                <button
                  key={i}
                  className={'b ' + (catIdx === i ? 'bp' : 'bg')}
                  style={{ fontSize: 12 }}
                  onClick={() => setCatIdx(i)}
                >
                  {c.icon} {c.name.split(' —')[0]}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0e7490', marginBottom: 10 }}>
            {cat.icon} {cat.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(cat.words as any[]).map(function (w: any, i: number) {
              return (
                <button
                  key={i}
                  aria-label={`Play audio for ${w.hr}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: '0 1px 2px rgba(0,0,0,.04)',
                  }}
                  onClick={() => speak(w.hr)}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                    {w.hr} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{w.en}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'phrases' && (
        <div>
          {TECH_VOC.phrases.map(function (p: any, i: number) {
            return (
              <button
                key={i}
                aria-label={`Play audio for ${p.hr}`}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => speak(p.hr)}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>
                  {p.hr} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={TECH_VOC.quiz} award={award} />}
    </div>
  );
}

export default TechVocScreen;
