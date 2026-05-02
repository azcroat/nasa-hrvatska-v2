import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { ORDINALS, ORDQUIZ } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function OrdinalsScreen({ goBack, award }: Props) {
  const questions = shMemo('oq', ORDQUIZ, undefined);
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
      {H('🏢 Ordinal Numbers', 'prvi, drugi, treći... + locative (na ___om katu)', goBack)}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}
      >
        {ORDINALS.map(function (o, i) {
          return (
            <div
              key={i}
              className="c"
              style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }}
              onClick={function () {
                speak(o.hr);
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0e7490' }}>{o.num}.</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{o.hr}</div>
              <div style={{ fontSize: 11, color: '#78716c' }}>{o.en}</div>
              <div style={{ fontSize: 10, color: '#b45309', marginTop: 2 }}>
                {'na '}
                {o.loc}om
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="sh">🏢 Na kojem katu?</h3>
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
                      handleAnswer(qi, o, q.a, 'na ' + q.a + ' katu');
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

export default OrdinalsScreen;
