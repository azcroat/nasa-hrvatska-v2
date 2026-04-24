import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { LOGICQUIZ } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function LogicQuizScreen({ goBack, award }: Props) {
  const questions = shMemo('lq', LOGICQUIZ, undefined);
  const answeredRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleOptionClick(
    e: React.MouseEvent<HTMLButtonElement>,
    isRight: boolean,
    o: string,
    onQuestionDone: () => void,
  ) {
    (e.target as HTMLButtonElement).style.background = isRight ? '#dcfce7' : '#fee2e2';
    (e.target as HTMLButtonElement).style.borderColor = isRight ? '#16a34a' : '#dc2626';
    if (isRight) {
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(o);
    }
    const btn = e.target as HTMLButtonElement;
    if (btn.closest && btn.closest('div'))
      (btn.closest('div') as HTMLElement).style.pointerEvents = 'none';
    onQuestionDone();
  }

  function onQuestionDone() {
    answeredRef.current++;
    if (answeredRef.current >= questions.length && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🧠 Think in Croatian', 'Pick the answers that make sense', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 Read the Croatian situation and pick ALL correct answers. Some questions have 2 right
        answers!
      </div>
      {questions.map(function (lq: { q: string; right: string[]; wrong: string[] }, li: number) {
        const allOpts = sh(lq.right.concat(lq.wrong));
        return (
          <div key={li} className="c" style={{ marginBottom: 12, padding: '12px 14px' }}>
            <button
              aria-label={`Play audio for ${lq.q}`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--heading)',
                marginBottom: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                padding: 0,
              }}
              onClick={function () {
                speak(lq.q);
              }}
            >
              <span aria-hidden="true">🔊</span> {lq.q}
            </button>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allOpts.map(function (o, oi) {
                const isRight = lq.right.indexOf(o) >= 0;
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
                      border: '2px solid #d6d3d1',
                      borderRadius: 10,
                      background: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={function (e) {
                      handleOptionClick(e, isRight, o, onQuestionDone);
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
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            All {questions.length} scenarios complete!
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default LogicQuizScreen;
