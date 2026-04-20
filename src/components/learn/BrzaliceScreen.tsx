// @ts-nocheck
import React from 'react';
import { H, speak, shMemo } from '../../data';
import { BRZALICE } from '../../data';

function BrzaliceScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H('😝 Brzalice', 'Croatian Tongue Twisters', goBack)}
      {shMemo('bz', BRZALICE).map(function (b, i) {
        return (
          <div key={i} className="c" style={{ marginBottom: 12 }}>
            <button
              aria-label={`Play audio for ${b.hr}`}
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--heading)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                padding: 0,
                textAlign: 'left',
              }}
              onClick={function () {
                speak(b.hr);
              }}
            >
              {b.hr} <span aria-hidden="true">🔊</span>
            </button>
            <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>{b.en}</div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
              {'Target: '}
              {b.focus}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BrzaliceScreen;
