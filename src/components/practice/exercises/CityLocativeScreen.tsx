import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { CITYLOC } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function CityLocativeScreen({ goBack, award }: Props) {
  const quizCities = shMemo('cl', CITYLOC.cities, 8);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () =>
      (quizCities as { nom: string; lok: string }[]).map((c2, i) => {
        const wrong = (CITYLOC.cities[(i + 3) % CITYLOC.cities.length] ?? CITYLOC.cities[0]!).lok;
        return sh([c2.lok, wrong]);
      }),
    [quizCities],
  );

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
    }

    if (handledRef.current.size >= quizCities.length) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🏙️ Where Do You Live?', 'City & country names in locative case', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 "Gdje živiš?" uses the locative case. Zagreb → u Zagrebu, Hrvatska → u Hrvatskoj.
      </div>
      <h3 className="sh">🏙️ Gradovi (Cities)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {CITYLOC.cities.map(function (c2, i) {
          return (
            <div
              key={i}
              className="c"
              style={{ padding: '8px 12px', cursor: 'pointer', textAlign: 'center' }}
              onClick={function () {
                speak('Živim u ' + c2.lok);
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#164e63' }}>{c2.nom}</div>
              <div style={{ fontSize: 12, color: '#0e7490' }}>
                {'→ u '}
                {c2.lok}
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="sh">🌍 Države (Countries)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {CITYLOC.countries.map(function (c2, i) {
          return (
            <div
              key={i}
              className="c"
              style={{ padding: '8px 12px', cursor: 'pointer', textAlign: 'center' }}
              onClick={function () {
                speak(c2.nom + ' - u ' + c2.lok);
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#164e63' }}>{c2.nom}</div>
              <div style={{ fontSize: 12, color: '#b45309' }}>
                {'→ u '}
                {c2.lok}
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="sh">🎯 Quick Quiz</h3>
      {quizCities.map(function (c2: { nom: string; lok: string }, i: number) {
        return (
          <div
            key={i}
            className="c"
            style={{
              marginBottom: 6,
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 13 }}>
              {c2.nom}
              {' → u _____'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                pointerEvents: choices[i] !== undefined ? 'none' : 'auto',
              }}
            >
              {(shuffledOpts[i] ?? []).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
                      border: `2px solid ${choices[i] === undefined ? '#d6d3d1' : choices[i] === o ? (o === c2.lok ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                      borderRadius: 10,
                      background:
                        choices[i] === undefined
                          ? 'white'
                          : choices[i] === o
                            ? o === c2.lok
                              ? '#dcfce7'
                              : '#fee2e2'
                            : 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: choices[i] !== undefined ? 'default' : 'pointer',
                      pointerEvents: choices[i] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleAnswer(i, o, c2.lok);
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
            {correctCountRef.current / quizCities.length >= 0.8
              ? '🏆'
              : correctCountRef.current / quizCities.length >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctCountRef.current}/{quizCities.length} correct
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default CityLocativeScreen;
