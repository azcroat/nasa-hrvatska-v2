import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { COMPARE, COMPQUIZ } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { useStats } from '../../../context/StatsContext';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function ComparativesScreen({ goBack, award }: Props) {
  const { setStats, writeDelta } = useStats();
  const questions = shMemo('cq', COMPQUIZ, undefined);
  const shuffledOpts = React.useMemo(
    () => (questions as { q: string; opts: string[]; a: string }[]).map((q) => sh([...q.opts])),
    [questions],
  );
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
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
      {H('📈 Lijep, Ljepši, Najljepši', 'Adjective → Comparative → Superlative', goBack)}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 20 }}
      >
        <div
          style={{
            padding: '6px',
            background: '#0e7490',
            color: 'white',
            fontWeight: 700,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Base
        </div>
        <div
          style={{
            padding: '6px',
            background: '#b45309',
            color: 'white',
            fontWeight: 700,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Comparative
        </div>
        <div
          style={{
            padding: '6px',
            background: '#7c3aed',
            color: 'white',
            fontWeight: 700,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Superlative
        </div>
        {COMPARE.map(function (cm) {
          return [
            <button
              key={cm.base + 'b'}
              style={{
                padding: '6px',
                fontSize: 12,
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #e7e5e4',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
              onClick={function () {
                speak(cm.base);
              }}
            >
              {cm.base}
              {' ('}
              {cm.en})
            </button>,
            <button
              key={cm.base + 'c'}
              style={{
                padding: '6px',
                fontSize: 12,
                fontWeight: 700,
                color: '#b45309',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #e7e5e4',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
              onClick={function () {
                speak(cm.comp);
              }}
            >
              {cm.comp}
            </button>,
            <button
              key={cm.base + 's'}
              style={{
                padding: '6px',
                fontSize: 12,
                fontWeight: 700,
                color: '#7c3aed',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #e7e5e4',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
              onClick={function () {
                speak(cm.super);
              }}
            >
              {cm.super}
            </button>,
          ];
        }).flat()}
      </div>
      <h3 className="sh">🎯 Pick the right form</h3>
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
                      handleAnswer(qi, o, q.a);
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

export default ComparativesScreen;
