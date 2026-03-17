import React, { useEffect, useRef } from 'react';

const COLORS = ['#e11d48','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316'];
const PIECE_COUNT = 60;

function makeConfetti() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 1.8 + Math.random() * 1.2,
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
}

export default function CelebrationModal({ xp, onClose }) {
  const pieces = useRef(makeConfetti()).current;

  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        pointerEvents: 'all',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* confetti layer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {pieces.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.left + '%',
            top: -20,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            borderRadius: p.shape === 'circle' ? '50%' : 3,
            background: p.color,
            animation: `confettiDrop ${p.duration}s ${p.delay}s ease-in forwards`,
          }} />
        ))}
      </div>

      {/* card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--card, #fff)',
          borderRadius: 24,
          padding: '36px 40px',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          animation: 'celebPop .45s cubic-bezier(.34,1.56,.64,1) forwards',
          minWidth: 260,
        }}
      >
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading, #0f172a)', marginBottom: 4 }}>
          Odlično!
        </div>
        <div style={{ fontSize: 14, color: 'var(--subtext, #64748b)', marginBottom: 16, fontWeight: 500 }}>
          Lesson complete!
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
          border: '1.5px solid #f59e0b',
          borderRadius: 12, padding: '10px 20px',
        }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#92400e' }}>+{xp} XP</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext, #64748b)', marginTop: 14, fontWeight: 500 }}>
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
}
