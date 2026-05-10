import React, { useRef, useState } from 'react';
import { H, speak, shMemo } from '../../../data';
import { TENSEFLIP } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';
import { useStats } from '../../../context/StatsContext';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

function TenseFlipScreen({ goBack, award }: Props) {
  const { setStats, writeDelta } = useStats();
  const items = shMemo('tf', TENSEFLIP, 10);
  const total = items.length * 2; // each item has perfekt + negative
  const handledRef = useRef(new Set<string>());
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [done, setDone] = useState(false);

  function handleReveal(key: string, spoken: string) {
    if (handledRef.current.has(key)) return;
    handledRef.current.add(key);
    setRevealed((prev) => new Set([...prev, key]));
    speak(spoken);
    recordTopicResult('past_tense', true);
    if (typeof award === 'function') award(3, false, 'grammar');
    if (handledRef.current.size >= total) {
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
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
        const perfKey = `${ti}-perf`;
        const negKey = `${ti}-neg`;
        const perfRevealed = revealed.has(perfKey);
        const negRevealed = revealed.has(negKey);
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
                  border: `2px solid ${perfRevealed ? '#16a34a' : '#d6d3d1'}`,
                  borderRadius: 10,
                  background: perfRevealed ? '#dcfce7' : 'white',
                  fontSize: 12,
                  cursor: perfRevealed ? 'default' : 'pointer',
                  pointerEvents: perfRevealed ? 'none' : 'auto',
                  textAlign: 'left',
                }}
                onClick={() => handleReveal(perfKey, t.perf)}
              >
                {perfRevealed ? '✅ ' + t.perf : '🔵 Perfekt?'}
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  border: `2px solid ${negRevealed ? '#dc2626' : '#d6d3d1'}`,
                  borderRadius: 10,
                  background: negRevealed ? '#fee2e2' : 'white',
                  fontSize: 12,
                  cursor: negRevealed ? 'default' : 'pointer',
                  pointerEvents: negRevealed ? 'none' : 'auto',
                  textAlign: 'left',
                }}
                onClick={() => handleReveal(negKey, t.neg)}
              >
                {negRevealed ? '❌ ' + t.neg : '🔴 Negative?'}
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
