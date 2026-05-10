import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { COLORAGREE } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { useStats } from '../../../context/StatsContext';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function ColorAgreementScreen({ goBack, award }: Props) {
  const { setStats, writeDelta } = useStats();
  const singQuestions = shMemo('cs', COLORAGREE.singQuiz, undefined);
  const plurQuestions = shMemo('cp', COLORAGREE.plurQuiz, undefined);
  const total = singQuestions.length + plurQuestions.length;
  const handledRef = useRef(new Set<number>());
  const correctCountRef = useRef(0);
  const [done, setDone] = useState(false);
  const [singChoices, setSingChoices] = useState<Record<number, string>>({});
  const [plurChoices, setPlurChoices] = useState<Record<number, string>>({});
  const shuffledSingOpts = React.useMemo(
    () =>
      (singQuestions as { noun: string; en: string; opts: string[]; color: string }[]).map((q) =>
        sh([...q.opts]),
      ),
    [singQuestions],
  );
  const shuffledPlurOpts = React.useMemo(
    () =>
      (plurQuestions as { noun: string; en: string; opts: string[]; color: string }[]).map((q) =>
        sh([...q.opts]),
      ),
    [plurQuestions],
  );

  function handleSingAnswer(qi: number, chosen: string, correct: string, spoken: string) {
    if (handledRef.current.has(qi)) return;
    handledRef.current.add(qi);
    setSingChoices((prev) => ({ ...prev, [qi]: chosen }));
    const isCorrect = chosen === correct;
    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(spoken);
    }
    if (handledRef.current.size >= total) {
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      setDone(true);
    }
  }

  function handlePlurAnswer(qi: number, chosen: string, correct: string, spoken: string) {
    const plurFlatIdx = singQuestions.length + qi;
    if (handledRef.current.has(plurFlatIdx)) return;
    handledRef.current.add(plurFlatIdx);
    setPlurChoices((prev) => ({ ...prev, [qi]: chosen }));
    const isCorrect = chosen === correct;
    if (isCorrect) {
      correctCountRef.current++;
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(spoken);
    }
    if (handledRef.current.size >= total) {
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H(
        '🎨 Color + Gender Agreement',
        'Colors change endings by noun gender — singular AND plural',
        goBack,
      )}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Color', 'M', 'F', 'N', 'M pl', 'F pl', 'N pl'].map(function (h, i) {
                return (
                  <th key={i} style={{ padding: '6px 4px', background: '#0e7490', color: 'white' }}>
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COLORAGREE.colors.map(function (c2, ci) {
              return (
                <tr key={ci} style={{ background: ci % 2 ? '#f0fdfa' : 'white' }}>
                  <td style={{ padding: '4px', fontWeight: 700, color: '#164e63' }}>{c2.en}</td>
                  {[c2.m, c2.f, c2.n, c2.mpl, c2.fpl, c2.npl].map(function (v, vi) {
                    return (
                      <td
                        key={vi}
                        style={{ padding: '4px', cursor: 'pointer' }}
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
      <h3 className="sh">🎯 Singular: Pick the right color form</h3>
      {singQuestions.map(function (
        q: { noun: string; en: string; opts: string[]; color: string },
        qi: number,
      ) {
        return (
          <div key={qi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{q.noun}</span>
              {' ('}
              {q.en}
              {') je _____'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                pointerEvents: singChoices[qi] !== undefined ? 'none' : 'auto',
              }}
            >
              {(shuffledSingOpts[qi] ?? []).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
                      border: `2px solid ${singChoices[qi] === undefined ? '#d6d3d1' : singChoices[qi] === o ? (o === q.color ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                      borderRadius: 10,
                      background:
                        singChoices[qi] === undefined
                          ? 'white'
                          : singChoices[qi] === o
                            ? o === q.color
                              ? '#dcfce7'
                              : '#fee2e2'
                            : 'white',
                      fontSize: 11,
                      cursor: singChoices[qi] !== undefined ? 'default' : 'pointer',
                      pointerEvents: singChoices[qi] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleSingAnswer(qi, o, q.color, q.noun + ' je ' + q.color);
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
      <h3 className="sh" style={{ marginTop: 16 }}>
        🎯 Plural: Pick the right color form
      </h3>
      {plurQuestions.map(function (
        q: { noun: string; en: string; opts: string[]; color: string },
        qi: number,
      ) {
        return (
          <div key={qi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{q.noun}</span>
              {' ('}
              {q.en}
              {') su _____'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                pointerEvents: plurChoices[qi] !== undefined ? 'none' : 'auto',
              }}
            >
              {(shuffledPlurOpts[qi] ?? []).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
                      border: `2px solid ${plurChoices[qi] === undefined ? '#d6d3d1' : plurChoices[qi] === o ? (o === q.color ? '#16a34a' : '#dc2626') : '#d6d3d1'}`,
                      borderRadius: 10,
                      background:
                        plurChoices[qi] === undefined
                          ? 'white'
                          : plurChoices[qi] === o
                            ? o === q.color
                              ? '#dcfce7'
                              : '#fee2e2'
                            : 'white',
                      fontSize: 11,
                      cursor: plurChoices[qi] !== undefined ? 'default' : 'pointer',
                      pointerEvents: plurChoices[qi] !== undefined ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handlePlurAnswer(qi, o, q.color, q.noun + ' su ' + q.color);
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

export default ColorAgreementScreen;
