import React, { useRef, useState } from 'react';
import { H, speak, shMemo } from '../../../data';
import { FUTURE } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';
import { useStats } from '../../../context/StatsContext';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function FutureTenseScreen({ goBack, award }: Props) {
  const { setStats, writeDelta } = useStats();
  const questions = shMemo('fq', FUTURE.quiz, undefined);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string, spoken: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    recordTopicResult('future_tense', isCorrect);

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(spoken);
    }

    if (handledRef.current.size >= questions.length) {
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🚀 Future Tense', 'ću, ćeš, će, ćemo, ćete, će + infinitive', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 13,
        }}
      >
        {FUTURE.intro}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {['ja ću', 'ti ćeš', 'on/ona će', 'mi ćemo', 'vi ćete', 'oni/one će'].map(function (f, i) {
          return (
            <button
              key={i}
              className="c"
              style={{ textAlign: 'center', padding: '8px' }}
              onClick={function () {
                speak(f);
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0e7490' }}>{f}</div>
            </button>
          );
        })}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {questions.map(function (q: { q: string; opts: string[]; a: string }, qi: number) {
        return (
          <div key={qi} className="c" style={{ marginBottom: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{q.q}</div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                pointerEvents: choices[qi] !== undefined ? 'none' : 'auto',
              }}
            >
              {shMemo('fq_o' + qi, q.opts, undefined).map(function (o: string, oi: number) {
                const spoken = q.q.replace('_____', q.a).split('(')[0] ?? q.q;
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '6px 14px',
                      border: `2px solid ${choices[qi] === undefined ? '#d6d3d1' : choices[qi] === o ? (o === q.a ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                      borderRadius: 10,
                      background:
                        choices[qi] === undefined
                          ? 'white'
                          : choices[qi] === o
                            ? o === q.a
                              ? '#dcfce7'
                              : '#fee2e2'
                            : 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: choices[qi] !== undefined ? 'default' : 'pointer',
                      pointerEvents: choices[qi] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleAnswer(qi, o, q.a, spoken);
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {correctCountRef.current / questions.length >= 0.8
              ? '🏆'
              : correctCountRef.current / questions.length >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctCountRef.current}/{questions.length} correct
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default FutureTenseScreen;
