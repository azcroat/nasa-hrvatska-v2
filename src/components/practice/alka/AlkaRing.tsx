import React from 'react';
import type { RingZone } from '../../../lib/gamification/alkaRules';

// Aim tightens toward centre as `aim` (0..1) approaches 1.
// When `landed` is set, the reticle snaps to that zone's radius.
export default function AlkaRing({
  aim,
  landed,
  size = 120,
}: {
  aim: number; // 0 (wide) .. 1 (dead centre)
  landed?: RingZone | null;
  size?: number;
}) {
  // Reticle offset from centre, in px. Tighter aim → smaller offset.
  const maxOffset = size * 0.32;
  const offset =
    landed == null
      ? maxOffset * (1 - Math.max(0, Math.min(1, aim)))
      : landed === 3
        ? 0
        : landed === 2
          ? size * 0.16
          : landed === 1
            ? size * 0.3
            : size * 0.45;
  const reticleColor = landed === 3 ? '#FFE070' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <div style={ring(size, 'rgba(56,189,248,.10)', 'rgba(56,189,248,.45)')} />
      <div style={ring(size * 0.65, 'rgba(56,189,248,.18)', 'rgba(56,189,248,.6)')} />
      <div
        style={{
          ...ring(size * 0.32, 'radial-gradient(circle,#FFE070,#C8980A)', '#fff'),
          boxShadow: '0 0 16px rgba(255,224,112,.7)',
          color: '#3a2a00',
          fontWeight: 900,
          fontSize: 13,
        }}
      >
        3
      </div>
      <div
        aria-label="lance aim"
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% - ${offset}px)`,
          transform: 'translate(-50%,-50%)',
          width: 20,
          height: 20,
          border: `2px solid ${reticleColor}`,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${reticleColor}`,
          transition: 'top .35s ease, border-color .2s',
        }}
      />
    </div>
  );
}

function ring(d: number, bg: string, border: string): React.CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%,-50%)',
    width: d,
    height: d,
    borderRadius: '50%',
    background: bg,
    border: `2px solid ${border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
