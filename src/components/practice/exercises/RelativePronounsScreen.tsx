import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { RELPRON } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function RelativePronounsScreen({ goBack, award }: Props) {
  const questions = shMemo('rp', RELPRON.quiz, undefined);
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
      {H('🔗 Koji, Koja, Koje', 'Relative pronouns — which/that/who', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          fontSize: 12,
          background: 'rgba(14,116,144,.06)',
        }}
      >
        {RELPRON.intro}
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['', 'NOM', 'GEN', 'DAT', 'AKU', 'LOK'].map(function (h, i) {
                return (
                  <th
                    key={i}
                    style={{
                      padding: '6px',
                      background: '#0e7490',
                      color: 'white',
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(['m', 'f', 'n'] as const).map(function (g, gi) {
              const r = RELPRON.table[g];
              return (
                <tr key={gi} style={{ background: gi % 2 ? '#f0fdfa' : 'white' }}>
                  <td style={{ padding: '6px', fontWeight: 800, color: '#0e7490' }}>
                    {g === 'm' ? '♂ M' : g === 'f' ? '♀ F' : '⚧ N'}
                  </td>
                  {[r.nom, r.gen, r.dat, r.aku, r.lok].map(function (v, vi) {
                    return (
                      <td
                        key={vi}
                        style={{ padding: '6px', cursor: 'pointer' }}
                        onClick={function () {
                          speak(v);
                        }}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default RelativePronounsScreen;
