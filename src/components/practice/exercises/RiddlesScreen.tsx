import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { RIDDLES } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function RiddlesScreen({ goBack, award }: Props) {
  const riddles = shMemo('rid', RIDDLES, 8);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () =>
      (riddles as { clue: string; opts: string[]; answer: string; en: string }[]).map((r) =>
        sh([...r.opts]),
      ),
    [riddles],
  );

  function handleAnswer(ri: number, chosenOption: string, correctAnswer: string) {
    if (handledRef.current.has(ri)) return;
    handledRef.current.add(ri);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [ri]: chosenOption }));

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(5, false, 'grammar');
      speak(correctAnswer);
    }

    if (handledRef.current.size >= riddles.length) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🧩 Što je to?', 'Read the clues in Croatian, guess the answer!', goBack)}
      {riddles.map(function (
        r: { clue: string; opts: string[]; answer: string; en: string },
        ri: number,
      ) {
        return (
          <div key={ri} className="c" style={{ marginBottom: 14, padding: '14px 16px' }}>
            <button
              aria-label={`Play audio clue: ${r.clue}`}
              style={{
                fontSize: 14,
                fontStyle: 'italic',
                color: '#44403c',
                marginBottom: 10,
                lineHeight: 1.5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                padding: 0,
              }}
              onClick={function () {
                speak(r.clue);
              }}
            >
              <span aria-hidden="true">🔊</span> "{r.clue}"
            </button>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                pointerEvents: choices[ri] !== undefined ? 'none' : 'auto',
              }}
            >
              {(shuffledOpts[ri] ?? []).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${choices[ri] === undefined ? '#d6d3d1' : choices[ri] === o ? (o === r.answer ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                      borderRadius: 12,
                      background:
                        choices[ri] === undefined
                          ? 'white'
                          : choices[ri] === o
                            ? o === r.answer
                              ? '#dcfce7'
                              : '#fee2e2'
                            : 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: choices[ri] !== undefined ? 'default' : 'pointer',
                      pointerEvents: choices[ri] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleAnswer(ri, o, r.answer);
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: '#a8a29e', marginTop: 6 }}>
              {'🇬🇧 '}
              {r.en}
            </div>
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {correctCountRef.current / riddles.length >= 0.8
              ? '🏆'
              : correctCountRef.current / riddles.length >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctCountRef.current}/{riddles.length} correct
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default RiddlesScreen;
