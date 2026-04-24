import React, { useRef, useState } from 'react';
import { H, speak, shMemo } from '../../../data';
import { AKUFOOD, AKUCLOTHES } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean) => void;
}

function AccusativeDrillScreen({ goBack, award }: Props) {
  const foodItems = shMemo('af', AKUFOOD, undefined);
  const clothesItems = shMemo('ac', AKUCLOTHES, undefined);
  const total = foodItems.length + clothesItems.length;
  const revealedRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleReveal(
    e: React.MouseEvent<HTMLButtonElement>,
    f: { aku: string; q: string; nom: string },
  ) {
    (e.target as HTMLButtonElement).textContent = f.aku;
    (e.target as HTMLButtonElement).style.background = '#dcfce7';
    (e.target as HTMLButtonElement).style.borderColor = '#16a34a';
    speak(f.q.replace('_____', f.aku));
    recordTopicResult('cases', true);
    if (typeof award === 'function') award(2);
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
      {H('🍽️ Accusative Case', 'How nouns change after Voliš li / Nosiš li / Jedeš li', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 12,
          padding: '10px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 Feminine nouns ending in -a change to -u in accusative. Masculine/neuter nouns usually
        stay the same.
      </div>
      <h3 className="sh">🍔 Hrana (Food)</h3>
      {foodItems.map(function (f: { q: string; nom: string; aku: string }, i: number) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 12 }}>
              <span style={{ color: '#78716c' }}>{f.q.replace('_____', '')}</span>{' '}
              <span style={{ fontWeight: 700, color: '#164e63' }}>{f.nom}</span>
              {' → ?'}
            </div>
            <button
              style={{
                padding: '8px 14px',
                border: '2px solid #d6d3d1',
                borderRadius: 10,
                background: 'white',
                fontSize: 12,
                cursor: 'pointer',
              }}
              onClick={function (e) {
                handleReveal(e, f);
              }}
            >
              Show
            </button>
          </div>
        );
      })}
      <h3 className="sh" style={{ marginTop: 16 }}>
        👚 Odjeća (Clothes)
      </h3>
      {clothesItems.map(function (cl: { q: string; nom: string; aku: string }, i: number) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 12 }}>
              <span style={{ color: '#78716c' }}>{cl.q.replace('_____', '')}</span>{' '}
              <span style={{ fontWeight: 700, color: '#164e63' }}>{cl.nom}</span>
              {' → ?'}
            </div>
            <button
              style={{
                padding: '8px 14px',
                border: '2px solid #d6d3d1',
                borderRadius: 10,
                background: 'white',
                fontSize: 12,
                cursor: 'pointer',
              }}
              onClick={function (e) {
                handleReveal(e, cl);
              }}
            >
              Show
            </button>
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            All {total} forms revealed!
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default AccusativeDrillScreen;
