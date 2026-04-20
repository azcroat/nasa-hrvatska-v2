// @ts-nocheck
import React from 'react';
import { H, speak } from '../../data';
import { WORDFORM } from '../../data';

function WordFormScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H('🧩 Word Formation', 'How prefixes build Croatian vocabulary', goBack)}

      {/* Primary base: ići and its prefixed forms */}
      <div className="c" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 10 }}>
          Base: {WORDFORM.base}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {WORDFORM.prefixes.map(function (p, pi) {
            return (
              <button
                key={pi}
                aria-label={`Play audio for ${p.verb}`}
                style={{
                  padding: '8px 4px',
                  fontSize: 14,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                }}
                onClick={function () {
                  speak(p.verb);
                }}
              >
                <span style={{ fontWeight: 700, color: '#0e7490' }}>{p.prefix}</span>
                <span style={{ fontWeight: 700, color: '#164e63' }}>{p.verb}</span>{' '}
                <span aria-hidden="true">🔊</span>
                <br />
                <span style={{ color: 'var(--subtext)', fontSize: 12 }}>{p.en}</span>
              </button>
            );
          })}
        </div>
        {/* Example sentences */}
        <div style={{ marginTop: 12 }}>
          {WORDFORM.prefixes.map(function (p, pi) {
            return (
              <div
                key={pi}
                style={{
                  fontSize: 12,
                  color: 'var(--subtext)',
                  marginBottom: 4,
                  paddingLeft: 8,
                  borderLeft: '2px solid #e0f2fe',
                }}
              >
                <span style={{ color: '#0e7490', fontWeight: 700 }}>{p.verb}:</span> {p.ex}
              </div>
            );
          })}
        </div>
      </div>

      {/* Other base verbs */}
      {WORDFORM.otherBases.map(function (b, bi) {
        return (
          <div key={bi} className="c" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 10 }}>
              Base: {b.base}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {b.pairs.map(function (p, pi) {
                return (
                  <button
                    key={pi}
                    aria-label={`Play audio for ${p[0]}`}
                    style={{
                      padding: '6px 0',
                      fontSize: 14,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Outfit',sans-serif",
                    }}
                    onClick={function () {
                      speak(p[0]);
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#0e7490' }}>{p[0]}</span>{' '}
                    <span aria-hidden="true">🔊</span>
                    {' — '}
                    <span style={{ color: 'var(--subtext)', fontSize: 12 }}>{p[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WordFormScreen;
