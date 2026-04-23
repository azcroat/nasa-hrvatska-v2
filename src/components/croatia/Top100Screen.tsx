import React, { useState } from 'react';
import { H, speak } from '../../data';
import { TOP100 } from '../../data';

interface Props {
  goBack: () => void;
}

function Top100Screen({ goBack }: Props) {
  const [t1k, sT1k] = useState<string | null>(null);
  return (
    <div className="scr-wrap">
      {H('💯 Top 100 Words', 'Essential words for real-world situations', goBack)}
      {!t1k ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.keys(TOP100).map(function (k) {
            return (
              <button
                key={k}
                className="tc"
                style={{ textAlign: 'center' }}
                onClick={function () {
                  sT1k(k);
                }}
              >
                <div style={{ fontSize: 28 }}>
                  {k.includes('Airport')
                    ? '✈️'
                    : k.includes('Restaurant')
                      ? '🍽️'
                      : k.includes('Doctor')
                        ? '🏥'
                        : k.includes('Beach')
                          ? '🏖️'
                          : k.includes('Market')
                            ? '🛒'
                            : k.includes('Meeting')
                              ? '🤝'
                              : k.includes('Emergency')
                                ? '🚨'
                                : '📋'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{k}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <React.Fragment>
          <button
            className="b bg"
            style={{ marginBottom: 16 }}
            onClick={function () {
              sT1k(null);
            }}
          >
            ← All Categories
          </button>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 16 }}>
            {t1k}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(TOP100 as unknown as Record<string, [string, string][]>)[t1k!]!.map(function (w, i) {
              return (
                <button
                  key={i}
                  aria-label={`Play audio for ${w[0]!}`}
                  className="c"
                  style={{ padding: '10px 14px' }}
                  onClick={function () {
                    speak(w[0]!);
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>
                    {w[0]!} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{w[1]!}</div>
                </button>
              );
            })}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default Top100Screen;
