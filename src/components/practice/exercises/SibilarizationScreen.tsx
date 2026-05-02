import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { SIBIL } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function SibilarizationScreen({ goBack, award }: Props) {
  const questions = shMemo('sq', SIBIL.quiz, undefined);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () => (questions as { q: string; opts: string[]; a: string }[]).map((q) => sh([...q.opts])),
    [questions],
  );

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string, spoken: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(spoken);
    }

    if (handledRef.current.size >= questions.length) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🔄 Sibilarizacija', 'k→c, g→z, h→s before -i', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          background: 'rgba(245,158,11,.06)',
          fontSize: 13,
        }}
      >
        {SIBIL.intro}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {SIBIL.examples.map(function (ex, i) {
          return (
            <button
              key={i}
              className="c"
              style={{ padding: '8px 12px', textAlign: 'center' }}
              onClick={function () {
                speak(ex.lok);
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
                {ex.nom}
                {' → '}
                {ex.lok}
              </div>
              <div style={{ fontSize: 11, color: '#b45309' }}>{ex.rule}</div>
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
              {(shuffledOpts[qi] ?? []).map(function (o, oi) {
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
                      handleAnswer(qi, o, q.a, q.q.replace('_____', q.a).split('(')[0] ?? q.q);
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

export default SibilarizationScreen;
