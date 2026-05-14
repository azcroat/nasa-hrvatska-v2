import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { POSSESS } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { useStats } from '../../../context/StatsContext';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function PossessivesScreen({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const questions = shMemo('pq', POSSESS.quiz, 10);
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const finishFired = useRef(false);
  const [done, setDone] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () =>
      (questions as { person: string; noun: string; opts: string[]; a: string }[]).map((q) =>
        sh([...q.opts]),
      ),
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
      if (!finishFired.current) {
        finishFired.current = true;
        markQuest('grammar');
        if (!stats.vs?.includes('possessives')) {
          setStats((prev) => {
            if (prev.vs?.includes('possessives')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'possessives'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['possessives'] });
        }
      }
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('👤 Possessive Pronouns', 'moj/moja/moje — changes by noun gender', goBack)}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Person', 'M', 'F', 'N', 'English'].map(function (h, i) {
                return (
                  <th key={i} style={{ padding: '6px', background: '#0e7490', color: 'white' }}>
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {POSSESS.table.map(function (r, ri) {
              return (
                <tr key={ri} style={{ background: ri % 2 ? '#f0fdfa' : 'white' }}>
                  <td style={{ padding: '6px', fontWeight: 800, color: '#0e7490' }}>{r.person}</td>
                  {[r.m, r.f, r.n, r.en].map(function (v, vi) {
                    return (
                      <td
                        key={vi}
                        style={{ padding: '6px', cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onClick={function () {
                          speak(v);
                        }}
                        onKeyDown={function (e) {
                          if (e.key === 'Enter' || e.key === ' ') speak(v);
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
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '10px',
          background: 'rgba(245,158,11,.06)',
          fontSize: 12,
        }}
      >
        💡 Rule: -a noun = -a pronoun (moja kuća), -o/-e noun = -e pronoun (moje selo), consonant
        noun = no ending (moj stan)
      </div>
      <h3 className="sh">🎯 Ovo je _____ ...</h3>
      {questions.map(function (
        q: { person: string; noun: string; opts: string[]; a: string },
        qi: number,
      ) {
        return (
          <div key={qi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>
              {'('}
              {q.person}
              {') Ovo je _____ '}
              <span style={{ fontWeight: 700 }}>{q.noun}</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                pointerEvents: choices[qi] !== undefined ? 'none' : 'auto',
              }}
            >
              {(shuffledOpts[qi] ?? []).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
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
                      fontSize: 11,
                      cursor: choices[qi] !== undefined ? 'default' : 'pointer',
                      pointerEvents: choices[qi] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleAnswer(qi, o, q.a, 'Ovo je ' + q.a + ' ' + q.noun);
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

export default PossessivesScreen;
