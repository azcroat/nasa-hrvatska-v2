import React, { useRef, useState } from 'react';
import { H, speak, sh } from '../../../data';
import { EMOGENDER } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function EmotionGenderScreen({ goBack, award }: Props) {
  const total = EMOGENDER.reduce(function (sum, eg) {
    return sum + eg.pairs.length;
  }, 0);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const pairOffsets = React.useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    EMOGENDER.forEach((eg) => {
      offsets.push(offset);
      offset += (eg.pairs as unknown[]).length;
    });
    return offsets;
  }, []);
  const shuffledOpts = React.useMemo(() => {
    const result: string[][] = [];
    EMOGENDER.forEach((eg) => {
      (eg.pairs as { m: string; f: string }[]).forEach((p) => {
        const correct = eg.gender === 'm' ? p.m : p.f;
        const wrong = eg.gender === 'm' ? p.f : p.m;
        result.push(sh([correct, wrong]));
      });
    });
    return result;
  }, []);

  function handleAnswer(
    flatIdx: number,
    chosenOption: string,
    correctAnswer: string,
    spoken: string,
  ) {
    if (handledRef.current.has(flatIdx)) return;
    handledRef.current.add(flatIdx);
    setChoices((prev) => ({ ...prev, [flatIdx]: chosenOption }));
    const isCorrect = chosenOption === correctAnswer;
    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(2, false, 'grammar');
      speak(spoken);
    }
    if (handledRef.current.size >= total) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('😀 How Are You Feeling?', 'Pick the right gender form for emotions', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 Croatian adjectives change based on gender. 👨 = masculine ending, 👩 = feminine ending.
        Tap the correct form!
      </div>
      {EMOGENDER.map(function (eg, ei) {
        return (
          <div key={ei} className="c" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 10 }}>
              {eg.subj}
              {' ('}
              {eg.gender === 'm' ? '👨' : '👩'})
            </div>
            {eg.pairs.map(function (p, pi) {
              const correct = eg.gender === 'm' ? p.m : p.f;
              const flatIdx = (pairOffsets[ei] ?? 0) + pi;
              const chosen = choices[flatIdx];
              return (
                <div
                  key={pi}
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 6,
                    pointerEvents: chosen !== undefined ? 'none' : 'auto',
                  }}
                >
                  {(shuffledOpts[flatIdx] ?? []).map(function (o, oi) {
                    return (
                      <button
                        key={oi}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: `2px solid ${chosen === undefined ? '#d6d3d1' : chosen === o ? (o === correct ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                          borderRadius: 10,
                          background:
                            chosen === undefined
                              ? 'white'
                              : chosen === o
                                ? o === correct
                                  ? '#dcfce7'
                                  : '#fee2e2'
                                : 'white',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: chosen !== undefined ? 'default' : 'pointer',
                          pointerEvents: chosen !== undefined ? 'none' : 'auto',
                        }}
                        onClick={function () {
                          handleAnswer(
                            flatIdx,
                            o,
                            correct,
                            eg.subj.split('...')[0] + ' ' + correct,
                          );
                        }}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {correctCountRef.current / total >= 0.8
              ? '🏆'
              : correctCountRef.current / total >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctCountRef.current}/{total} correct
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default EmotionGenderScreen;
