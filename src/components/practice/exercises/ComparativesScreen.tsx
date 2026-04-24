import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { COMPARE, COMPQUIZ } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean) => void;
}

function ComparativesScreen({ goBack, award }: Props) {
  const questions = shMemo('cq', COMPQUIZ, undefined);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e: React.MouseEvent<HTMLButtonElement>, isCorrect: boolean) {
    (e.target as HTMLButtonElement).style.background = isCorrect ? '#dcfce7' : '#fee2e2';
    (e.target as HTMLButtonElement).style.borderColor = isCorrect ? '#16a34a' : '#dc2626';
    if (isCorrect) {
      if (typeof award === 'function') award(3);
    }
    const btn = e.target as HTMLButtonElement;
    if (btn.closest && btn.closest('div'))
      (btn.closest('div') as HTMLElement).style.pointerEvents = 'none';
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= questions.length && !done) {
      markQuest('grammar');
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
            <div style={{ display: 'flex', gap: 6 }}>
              {sh(q.opts).map(function (o, oi) {
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '6px 14px',
                      border: '2px solid #d6d3d1',
                      borderRadius: 10,
                      background: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={function (e) {
                      handleAnswer(e, o === q.a);
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
            {correctRef.current / questions.length >= 0.8
              ? '🏆'
              : correctRef.current / questions.length >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctRef.current}/{questions.length} correct
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
