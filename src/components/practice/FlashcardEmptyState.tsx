// @ts-nocheck
import React from 'react';
import CroatianKnight from '../shared/CroatianKnight';

export default function FlashcardEmptyState({ onGoBack }) {
  return (
    <div className="scr-wrap">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <CroatianKnight
          size={90}
          mood="celebrating"
          style={{ margin: '0 auto 16px', display: 'block' }}
        />
        <div style={{ fontSize: 52 }}>🎉</div>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 22,
            color: 'var(--heading)',
            marginTop: 12,
          }}
        >
          All caught up!
        </h3>
        <p
          style={{
            color: 'var(--subtext)',
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          No more cards due right now.
          <br />
          Come back tomorrow for your next review session.
        </p>
        <button className="b bp" style={{ marginTop: 20, width: '100%' }} onClick={onGoBack}>
          Continue →
        </button>
      </div>
    </div>
  );
}
