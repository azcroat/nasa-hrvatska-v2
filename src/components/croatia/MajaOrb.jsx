import React from 'react';
import CroatianGrb from '../shared/CroatianGrb.jsx';

export default function MajaOrb({ phase, waveform, liveTranscript, personaCfg }) {
  const cfg = personaCfg || { orbColor: '#D4002D', thinkingColor: '#F59E0B', speakingColor: '#D4002D', listenColor: '#0e7490', accentColor: '#D4002D' };
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    margin: '4px 0 8px',
  };

  const orbWrapStyle = {
    position: 'relative',
    width: 200,
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // ── idle ──────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={containerStyle}>
        <div style={orbWrapStyle}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #D4002D 0%, #D4002D 33.3%, #ffffff 33.3%, #ffffff 66.6%, #003DA5 66.6%, #003DA5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(212,0,45,0.35), inset 0 0 0 3px rgba(255,255,255,0.2)',
              animation: 'maja-float 3s ease-in-out infinite',
            }}
          >
            <CroatianGrb size={58} />
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--subtext)', letterSpacing: 0.3 }}>
          Klikni za početak
        </span>
      </div>
    );
  }

  // ── thinking ──────────────────────────────
  if (phase === 'thinking') {
    return (
      <div style={containerStyle}>
        <div style={orbWrapStyle}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #F59E0B 0%, #d97706 100%)',
              boxShadow: '0 0 30px rgba(245,158,11,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {[0, 0.2, 0.4].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: `maja-dot 0.9s ease-in-out ${delay}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
        <span style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>
          {cfg.name.split(' ')[0]} razmišlja...
        </span>
      </div>
    );
  }

  // ── maja-speaking ─────────────────────────
  if (phase === 'maja-speaking') {
    const speakColor = cfg.speakingColor;
    const speakColorRgb = speakColor === '#D4002D' ? '212,0,45'
      : speakColor === '#0284c7' ? '2,132,199'
      : speakColor === '#7c3aed' ? '124,58,237'
      : '180,83,9';
    const pulseBase = {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: '50%',
      border: `2px solid rgba(${speakColorRgb},0.5)`,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
    return (
      <div style={containerStyle}>
        <div style={orbWrapStyle}>
          {[0, 0.5, 1].map((delay, i) => (
            <div
              key={i}
              style={{
                ...pulseBase,
                animation: `maja-pulse 1.8s ease-out ${delay}s infinite`,
              }}
            />
          ))}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${speakColor} 0%, ${speakColor}cc 100%)`,
              boxShadow: `0 0 40px rgba(${speakColorRgb},0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 24, userSelect: 'none' }}>🎙️</span>
          </div>
        </div>
        <span style={{ fontSize: 13, color: speakColor, fontWeight: 600 }}>
          {cfg.name.split(' ')[0]} govori...
        </span>
      </div>
    );
  }

  // ── listening ─────────────────────────────
  if (phase === 'listening') {
    const listenColor = cfg.listenColor;
    const listenColorRgb = listenColor === '#0e7490' ? '14,116,144'
      : listenColor === '#0ea5e9' ? '14,165,233'
      : listenColor === '#8b5cf6' ? '139,92,246'
      : '217,119,6';
    return (
      <div style={containerStyle}>
        <div style={orbWrapStyle}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${listenColor} 0%, ${listenColor}cc 100%)`,
              boxShadow: `0 0 40px rgba(${listenColorRgb},0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 30, userSelect: 'none' }}>🎤</span>
          </div>
        </div>

        {/* Waveform bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            height: 60,
            padding: '0 4px',
          }}
        >
          {waveform.map((h, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 2,
                background: listenColor,
                transition: 'height 0.08s ease',
                animation: 'maja-bar-pulse 1.2s ease-in-out infinite',
                animationDelay: `${(i * 0.04).toFixed(2)}s`,
              }}
            />
          ))}
        </div>

        <span style={{ fontSize: 13, color: listenColor, fontWeight: 600 }}>
          Tvoj red... Govori!
        </span>

        {liveTranscript && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--subtext)',
              fontStyle: 'italic',
              margin: '0 16px',
              textAlign: 'center',
              maxHeight: '2.8em',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {liveTranscript}
          </p>
        )}
      </div>
    );
  }

  // ── error ─────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={containerStyle}>
        <div style={orbWrapStyle}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: '#dc2626',
              boxShadow: '0 0 30px rgba(220,38,38,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 36 }}>⚠️</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
