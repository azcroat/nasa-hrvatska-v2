import React, { useEffect } from 'react';
import { useHaptic } from '../../hooks/useHaptic.js';

export default function BadgeToast({ show, badge }) {
  const haptic = useHaptic();
  useEffect(() => { haptic.award(); }, []);
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={show && badge ? `Achievement unlocked: ${badge.n}` : undefined}
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: show && badge
          ? 'translateX(-50%) scale(1) translateY(0)'
          : 'translateX(-50%) scale(0.5) translateY(-20px)',
        opacity: show && badge ? 1 : 0,
        zIndex: 99990,
        pointerEvents: 'none',
        transition: 'transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s ease',
        minWidth: 240,
        maxWidth: 320,
        textAlign: 'center',
      }}
    >
      {show && badge && (
        <div style={{
          background: 'linear-gradient(145deg, #fefce8 0%, #fef9c3 40%, #fef3c7 100%)',
          border: '2.5px solid #fbbf24',
          borderTop: '4px solid #f59e0b',
          borderRadius: 20,
          padding: '18px 28px 16px',
          boxShadow: [
            '0 24px 64px rgba(0,0,0,.22)',
            '0 8px 24px rgba(245,158,11,.3)',
            '0 2px 0 rgba(255,255,255,.8) inset',
          ].join(','),
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Shimmer overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease .2s 1',
            pointerEvents: 'none',
            borderRadius: 18,
          }} />

          {/* Unlock label */}
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#92400e',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <span style={{ fontSize: 12 }}>🏅</span>
            Achievement Unlocked!
          </div>

          {/* Badge emoji — large, with glow */}
          <div
            aria-hidden="true"
            style={{
              fontSize: 52,
              lineHeight: 1,
              marginBottom: 10,
              filter: 'drop-shadow(0 4px 12px rgba(245,158,11,.5))',
              animation: 'heartbeat .5s ease',
              display: 'block',
            }}
          >
            {badge.i}
          </div>

          {/* Badge name */}
          <div style={{
            fontSize: 19,
            fontWeight: 900,
            color: '#78350f',
            marginBottom: 4,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-.01em',
          }}>
            {badge.n}
          </div>

          {/* Badge description */}
          <div style={{
            fontSize: 12,
            color: '#a16207',
            fontWeight: 600,
            lineHeight: 1.4,
          }}>
            {badge.d}
          </div>

          {/* Bottom sparkle row */}
          <div style={{
            marginTop: 12,
            fontSize: 14,
            letterSpacing: 4,
            color: '#f59e0b',
            animation: 'pulse 1.4s ease infinite',
          }}>
            ✨ ✨ ✨
          </div>
        </div>
      )}
    </div>
  );
}
