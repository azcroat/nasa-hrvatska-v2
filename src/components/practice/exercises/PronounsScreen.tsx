import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { PRONOUNCASE } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function PronounsScreen({ goBack, award }: Props) {
  const questions = shMemo('pc', PRONOUNCASE.quiz, 10);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () => (questions as { q: string; opts: string[]; a: string }[]).map((q) => sh([...q.opts])),
    [questions],
  );

  function handleAnswer(qi: number, chosenOption: string, correctAnswer: string, sentence: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);

    const isCorrect = chosenOption === correctAnswer;
    setChoices((prev) => ({ ...prev, [qi]: chosenOption }));

    recordTopicResult('grammar', isCorrect);

    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(sentence);
    }

    if (handledRef.current.size >= questions.length) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🎯 Pronoun Cases', 'How ja/ti/on/ona change with prepositions', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          fontSize: 12,
          background: 'rgba(14,116,144,.06)',
        }}
      >
        {PRONOUNCASE.intro}
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['NOM', 'GEN', 'DAT', 'AKU', 'INST', 'LOK'].map(function (h, i) {
                return (
                  <th
                    key={i}
                    style={{
                      padding: '6px 4px',
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
            {PRONOUNCASE.table.map(function (r, ri) {
              return (
                <tr key={ri} style={{ background: ri % 2 ? '#f0fdfa' : 'white' }}>
                  {[r.nom, r.gen, r.dat, r.aku, r.inst, r.lok].map(function (v, vi) {
                    return (
                      <td
                        key={vi}
                        style={{
                          padding: '6px 4px',
                          borderBottom: '1px solid #e7e5e4',
                          cursor: 'pointer',
                          fontWeight: vi === 0 ? 700 : 400,
                          color: vi === 0 ? '#0e7490' : '#44403c',
                        }}
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
      <h3 className="sh">🧠 Fill the Blank</h3>
      {questions.map(function (q: { q: string; opts: string[]; a: string }, qi: number) {
        return (
          <div key={qi} className="c" style={{ marginBottom: 10, padding: '10px 14px' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Play audio for ${q.q}`}
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, cursor: 'pointer' }}
              onClick={function () {
                speak(q.q.replace('_____', q.a));
              }}
              onKeyDown={function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  speak(q.q.replace('_____', q.a));
                }
              }}
            >
              <span aria-hidden="true">🔊</span> {q.q}
            </div>
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
                      handleAnswer(qi, o, q.a, q.q.replace('_____', q.a));
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

export default PronounsScreen;
