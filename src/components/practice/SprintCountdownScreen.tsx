// @ts-nocheck
import React from 'react';

export default function SprintCountdownScreen({ countdown }) {
  return (
    <div
      className="scr-wrap"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <div
        style={
          /** @type {any} */ {
            fontSize: 100,
            fontWeight: 900,
            color: '#d4002d',
            animation: 'sprint-countdown 0.5s ease-out',
            key: countdown,
          }
        }
      >
        {countdown}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--subtext)', marginTop: 16 }}>
        Pripremi se!
      </p>
    </div>
  );
}
