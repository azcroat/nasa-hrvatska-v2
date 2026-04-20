import React from 'react';
import { H, speak } from '../../data';
import { TRANSPORT } from '../../data';

function TransportScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H('🚌 Getting Around', 'Bus, tram, taxi phrases', goBack)}
      {TRANSPORT.map(function (t, i) {
        return (
          <button
            key={i}
            aria-label={`Play audio for ${t.hr}`}
            className="c"
            style={{
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 14px',
            }}
            onClick={function () {
              speak(t.hr);
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {t.hr} <span aria-hidden="true">🔊</span>
            </span>
            <span style={{ color: 'var(--subtext)', fontSize: 13 }}>{t.en}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TransportScreen;
