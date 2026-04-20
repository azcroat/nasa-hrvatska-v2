// @ts-nocheck
import React from 'react';
import { H, speak } from '../../data';
import { COLORQUIRK } from '../../data';

function ColorQuirkScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H('🎨 Color Quirks', 'Colors mean different things in Croatian!', goBack)}
      {COLORQUIRK.map(function (q, i) {
        return (
          <button
            key={i}
            aria-label={`Play audio for ${q.hr}`}
            className="c"
            style={{ marginBottom: 10 }}
            onClick={function () {
              speak(q.hr);
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--heading)' }}>
              {q.hr} <span aria-hidden="true">🔊</span>
            </div>
            <div style={{ fontSize: 14, color: '#0e7490', marginTop: 2 }}>
              {'Literal: '}
              {q.literal}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', marginTop: 2 }}>
              {'Means: '}
              {q.means}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ColorQuirkScreen;
