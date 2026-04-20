// @ts-nocheck
import React from 'react';
import { H, speak } from '../../../data';
import { RESTCONV } from '../../../data';

function RestaurantScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H('🍽️ At the Restaurant', 'Practice ordering food in Croatian', goBack)}
      <div
        className="c"
        style={{
          marginBottom: 16,
          padding: '12px',
          background: 'rgba(14,116,144,.06)',
          fontSize: 12,
        }}
      >
        💡 Tap any line to hear it spoken. Practice the waiter-customer dialogue until it feels
        natural.
      </div>
      {RESTCONV.map(function (r, ri) {
        return (
          <div key={ri} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'white',
                  background: '#0e7490',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                K
              </div>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#f0fdfa',
                  borderRadius: '4px 12px 12px 12px',
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                }}
                onClick={function () {
                  speak(r.waiter);
                }}
              >
                {r.waiter}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#eff6ff',
                  borderRadius: '12px 4px 12px 12px',
                  fontSize: 13,
                  textAlign: 'right',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}
                onClick={function () {
                  speak(r.you);
                }}
              >
                {r.you}
              </button>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'white',
                  background: '#1e40af',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                Ti
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RestaurantScreen;
