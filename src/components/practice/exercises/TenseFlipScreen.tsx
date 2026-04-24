import React, { useRef, useState } from 'react';
import { H, speak, shMemo } from '../../../data';
import { TENSEFLIP } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function TenseFlipScreen({ goBack, award }: Props) {
  const items = shMemo('tf', TENSEFLIP, 10);
  const total = items.length * 2; // each item has perfekt + negative
  const revealedRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleReveal(e: React.MouseEvent<HTMLButtonElement>, spoken: string) {
    speak(spoken);
    recordTopicResult('past_tense', true);
    if (typeof award === 'function') award(3, false, 'grammar');
    const btn = e.target as HTMLButtonElement;
    if (btn.closest && btn.closest('div'))
      (btn.closest('div') as HTMLElement).style.pointerEvents = 'none';
    revealedRef.current++;
    if (revealedRef.current >= total && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('⏳ Present → Past', 'Convert prezent to perfekt and negative', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 See the present tense, then tap to reveal the past (perfekt) and negative past forms.
      </div>
      {items.map(function (t: { prez: string; perf: string; neg: string }, ti: number) {
        return (
          <div key={ti} className="c" style={{ marginBottom: 10, padding: '10px 14px' }}>
            <button
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
                speak(t.prez);
              }}
            >
              {'🔵 '}
              {t.prez}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '2px solid #d6d3d1',
                  borderRadius: 10,
                  background: 'white',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onClick={function (e) {
                  const btn = e.target as HTMLButtonElement;
                  btn.textContent = '✅ ' + t.perf;
                  btn.style.background = '#dcfce7';
                  btn.style.borderColor = '#16a34a';
                  handleReveal(e, t.perf);
                }}
              >
                🔵 Perfekt?
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '2px solid #d6d3d1',
                  borderRadius: 10,
                  background: 'white',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onClick={function (e) {
                  const btn = e.target as HTMLButtonElement;
                  btn.textContent = '❌ ' + t.neg;
                  btn.style.background = '#fee2e2';
                  btn.style.borderColor = '#dc2626';
                  handleReveal(e, t.neg);
                }}
              >
                🔴 Negative?
              </button>
            </div>
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            All {items.length} tenses revealed!
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default TenseFlipScreen;
