import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { SENTBUILD } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function SentenceBuilderScreen({ goBack, award }: Props) {
  const questions = shMemo('sb', SENTBUILD, 15);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () => (questions as { en: string; hr: string; opts: string[] }[]).map((s) => sh([...s.opts])),
    [questions],
  );

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    recordTopicResult('grammar', isCorrect);

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(5, false, 'grammar');
      speak(correctAnswer);
    }

    if (handledRef.current.size >= questions.length) {
      markQuest('grammar');
      setDone(true);
    }
  }

  const answeredCount = Object.keys(choices).length;

  return (
    <div className="scr-wrap">
      {H('🏗️ Build the Sentence', 'Translate English to Croatian', goBack)}
      {answeredCount > 0 && !done && (
        <div
          style={{
            height: 5,
            borderRadius: 99,
            background: 'rgba(14,116,144,.12)',
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.round((answeredCount / questions.length) * 100)}%`,
              borderRadius: 99,
              background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
              transition: 'width .3s',
            }}
          />
        </div>
      )}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
          color: '#164e63',
        }}
      >
        🇬🇧 Read the English sentence, then pick the correct Croatian translation.
      </div>
      {questions.map(function (s: { en: string; hr: string; opts: string[] }, i: number) {
        return (
          <div key={i} className="c" style={{ marginBottom: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#164e63', marginBottom: 6 }}>
              {'🇬🇧 '}
              {s.en}
            </div>
            {(shuffledOpts[i] ?? []).map(function (o, oi) {
              return (
                <button
                  key={oi}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: 4,
                    border: `2px solid ${choices[i] === undefined ? '#e7e5e4' : choices[i] === o ? (o === s.hr ? '#16a34a' : '#dc2626') : '#e7e5e4'}`,
                    borderRadius: 10,
                    background:
                      choices[i] === undefined
                        ? 'white'
                        : choices[i] === o
                          ? o === s.hr
                            ? '#dcfce7'
                            : '#fee2e2'
                          : 'white',
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: choices[i] !== undefined ? 'default' : 'pointer',
                    pointerEvents: choices[i] !== undefined ? 'none' : 'auto',
                  }}
                  onClick={function () {
                    handleAnswer(i, o, s.hr);
                  }}
                >
                  {'🇭🇷 '}
                  {o}
                </button>
              );
            })}
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

export default SentenceBuilderScreen;
