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
  const handledRef = useRef(new Set<number>());
  const [done, setDone] = useState(false);
  const [questionChoices, setQuestionChoices] = useState<Record<number, string>>({});
  const shuffledOpts = React.useMemo(
    () =>
      (questions as { q: string; right: string[]; wrong: string[] }[]).map((lq) =>
        sh([...lq.right, ...lq.wrong]),
      ),
    [questions],
  );

  function handleOptionClick(li: number, o: string, isRight: boolean) {
    if (handledRef.current.has(li)) return;
    handledRef.current.add(li);
    setQuestionChoices((prev) => ({ ...prev, [li]: o }));
    if (isRight) {
      if (typeof award === 'function') award(3, false, 'grammar');
      speak(o);
    }
    if (handledRef.current.size >= questions.length) {
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
        💡 Read the Croatian situation and tap the best answer. After answering, all correct options
        are revealed in green!
      </div>
      {questions.map(function (lq: { q: string; right: string[]; wrong: string[] }, li: number) {
        const allOpts = shuffledOpts[li] ?? [];
        const answered = questionChoices[li] !== undefined;
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
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                pointerEvents: answered ? 'none' : 'auto',
              }}
            >
              {allOpts.map(function (o, oi) {
                const isRight = lq.right.indexOf(o) >= 0;
                const wasChosen = questionChoices[li] === o;
                return (
                  <button
                    key={oi}
                    style={{
                      padding: '8px 14px',
                      border: `2px solid ${!answered ? '#d6d3d1' : isRight ? '#16a34a' : wasChosen ? '#dc2626' : '#d6d3d1'}`,
                      borderRadius: 10,
                      background: !answered
                        ? 'white'
                        : isRight
                          ? '#dcfce7'
                          : wasChosen
                            ? '#fee2e2'
                            : 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: answered ? 'default' : 'pointer',
                      pointerEvents: answered ? 'none' : 'auto',
                    }}
                    onClick={function () {
                      handleOptionClick(li, o, isRight);
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
