import React, { useState, useRef, useMemo } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { PROFGENDER } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface ProfItem {
  en: string;
  m: string;
  f: string;
}
interface QuizItem {
  en: string;
  gender: string;
  a: string;
  opts: string[];
}

// Multiple-choice quiz: given the English + gender hint, choose the correct Croatian form
function buildQuiz(profList: ProfItem[]): QuizItem[] {
  const items: QuizItem[] = [];
  profList.forEach((p) => {
    // Masculine form question
    const mWrong = sh(
      profList.filter((x: ProfItem) => x.m !== p.m).map((x: ProfItem) => x.m),
    ).slice(0, 3);
    items.push({ en: p.en, gender: 'm', a: p.m, opts: sh([p.m, ...mWrong.slice(0, 2)]) });
    // Feminine form question
    const fWrong = sh(
      profList.filter((x: ProfItem) => x.f !== p.f).map((x: ProfItem) => x.f),
    ).slice(0, 3);
    items.push({ en: p.en, gender: 'f', a: p.f, opts: sh([p.f, ...fWrong.slice(0, 2)]) });
  });
  return sh(items).slice(0, 16) as QuizItem[];
}

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function ProfessionGenderScreen({ goBack, award }: Props) {
  const [tab, setTab] = useState('learn');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questFiredRef = useRef(false);
  const quiz = useMemo(() => buildQuiz(PROFGENDER), []);

  const correctCount = Object.entries(answers).filter(
    ([qi, chosen]) => chosen === quiz[Number(qi)]?.a,
  ).length;
  const allDone = Object.keys(answers).length === quiz.length;

  function handleAnswer(qi: number, opt: string, correct: string) {
    if (answers[qi] !== undefined) return;
    const isCorrect = opt === correct;
    setAnswers((prev) => ({ ...prev, [qi]: opt }));
    if (isCorrect) {
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(opt);
    }
    if (Object.keys(answers).length + 1 >= quiz.length && !questFiredRef.current) {
      questFiredRef.current = true;
      markQuest('grammar');
    }
  }

  return (
    <div className="scr-wrap">
      {H('👨‍⚖️👩‍⚖️ Job Gender Forms', 'Učitelj vs učiteljica — every job has M & F forms', goBack)}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { id: 'learn', label: '📖 Learn' },
          { id: 'quiz', label: '🎯 Quiz' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 20,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              background: tab === t.id ? '#0e7490' : 'var(--bar-bg)',
              color: tab === t.id ? 'white' : 'var(--subtext)',
              transition: 'all .2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.06)',
              borderRadius: 10,
              fontSize: 12,
              color: '#164e63',
            }}
          >
            💡 In Croatian, every profession has both a masculine and feminine form. Common
            patterns: -ač → -ačica, -nik → -nica, -ar → -arka, -ac → -ka.
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 4,
              marginBottom: 8,
              padding: '6px 10px',
              background: '#0e7490',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>
              ENGLISH
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#93c5fd', textAlign: 'center' }}>
              👨 MALE
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f9a8d4', textAlign: 'center' }}>
              👩 FEMALE
            </div>
          </div>
          {shMemo('pg', PROFGENDER, undefined).map((p: ProfItem, i: number) => (
            <div
              key={i}
              className="c"
              style={{
                marginBottom: 6,
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>{p.en}</div>
              <button
                style={{
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  padding: 0,
                }}
                onClick={() => speak(p.m)}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
                  {'👨 '}
                  {p.m}
                </div>
              </button>
              <button
                style={{
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  padding: 0,
                }}
                onClick={() => speak(p.f)}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
                  {'👩 '}
                  {p.f}
                </div>
              </button>
            </div>
          ))}
        </>
      )}

      {tab === 'quiz' && (
        <>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.06)',
              borderRadius: 10,
              fontSize: 12,
              color: '#164e63',
            }}
          >
            Choose the correct Croatian form for the given profession and gender.
          </div>
          {quiz.map((q, qi) => {
            const chosen = answers[qi];
            return (
              <div key={qi} className="c" style={{ marginBottom: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#1c1917' }}>
                  {q.gender === 'm' ? '👨' : '👩'} {q.gender === 'm' ? 'Male' : 'Female'} form of:{' '}
                  <span style={{ color: '#0e7490' }}>{q.en}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {q.opts.map((opt, oi) => {
                    let bg = 'white',
                      bc = '#e7e5e4',
                      col = '#1c1917';
                    if (chosen !== undefined) {
                      if (opt === q.a) {
                        bg = '#dcfce7';
                        bc = '#16a34a';
                        col = '#14532d';
                      } else if (opt === chosen && opt !== q.a) {
                        bg = '#fee2e2';
                        bc = '#dc2626';
                        col = '#7f1d1d';
                      }
                    }
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, opt, q.a)}
                        style={{
                          padding: '7px 16px',
                          border: `2px solid ${bc}`,
                          borderRadius: 10,
                          background: bg,
                          color: col,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <div style={{ fontSize: 11, marginTop: 5, fontWeight: 700, color: '#16a34a' }}>
                    ✓ {q.a}
                  </div>
                )}
              </div>
            );
          })}
          {allDone && (
            <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>
                {correctCount / quiz.length >= 0.8
                  ? '🏆'
                  : correctCount / quiz.length >= 0.6
                    ? '⭐'
                    : '💪'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
                {correctCount}/{quiz.length} correct
              </div>
              <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
                ✓ Done
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProfessionGenderScreen;
