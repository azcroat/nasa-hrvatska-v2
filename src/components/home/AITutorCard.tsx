// @ts-nocheck
import React from 'react';
import { useApp } from '../../context/AppContext';

export default function AITutorCard() {
  const { setScr } = useApp();

  return (
    <button
      onClick={() => setScr('live_tutor')}
      style={{
        width: '100%',
        padding: 0,
        marginBottom: 20,
        borderRadius: 20,
        cursor: 'pointer',
        textAlign: 'left',
        border: '2px solid rgba(212,0,45,.35)',
        background: 'linear-gradient(135deg,#1c0a0e 0%,#2d0d18 45%,#0f172a 100%)',
        fontFamily: "'Outfit',sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(212,0,45,.22),0 2px 8px rgba(0,0,0,.28)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 85% 50%,rgba(212,0,45,.3) 0%,transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          padding: '18px 18px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#D4002D,#ff3d5a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 6px 20px rgba(212,0,45,.5)',
          }}
        >
          🎙️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'rgba(255,130,130,.9)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 4,
            }}
          >
            AI-POWERED · LIVE SESSIONS
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Croatian AI Tutor
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>
            Speak live — adapts to your level in real time
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: '#fff',
            background: 'linear-gradient(135deg,#D4002D,#ff3d5a)',
            borderRadius: 12,
            padding: '8px 14px',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(212,0,45,.45)',
          }}
        >
          Start →
        </div>
      </div>
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(255,255,255,.07)',
          background: 'rgba(255,255,255,.04)',
          display: 'flex',
          gap: 18,
          position: 'relative',
        }}
      >
        {[
          ['🎯', 'Adapts to you'],
          ['🗣️', 'Real conversation'],
          ['🏆', '+XP rewards'],
        ].map(([icon, label]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'rgba(255,255,255,.5)',
              fontWeight: 600,
            }}
          >
            <span>{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </button>
  );
}
