import React, { useEffect, useRef } from 'react';

const LEVEL_PALETTES = [
  { grad: 'linear-gradient(135deg,#92400e,#b45309)', accent: '#fcd34d', text: '#92400e' },
  { grad: 'linear-gradient(135deg,#065f46,#059669)', accent: '#6ee7b7', text: '#065f46' },
  { grad: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', accent: '#93c5fd', text: '#1e3a8a' },
  { grad: 'linear-gradient(135deg,#4c1d95,#6d28d9)', accent: '#c4b5fd', text: '#4c1d95' },
  { grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)', accent: '#fca5a5', text: '#7f1d1d' },
  { grad: 'linear-gradient(135deg,#0c4a6e,#0e7490)', accent: '#67e8f9', text: '#0c4a6e' },
  { grad: 'linear-gradient(135deg,#312e81,#4338ca)', accent: '#a5b4fc', text: '#312e81' },
];
const UNIT_EMOJIS = ['🛡️', '🏰', '🗺️', '⚔️', '🦅', '🎭', '🌟'];
const UNIT_BONUS_XP = 100;

interface CompletedLevel {
  level: number;
  title: string;
  desc?: string;
}

export default function UnitCompleteBanner({
  completedLevel,
  onClose,
  award,
}: {
  completedLevel: CompletedLevel;
  onClose: () => void;
  award?: (xp: number, celebrate?: boolean) => void;
}) {
  const awardFiredRef = useRef(false);
  const pal = LEVEL_PALETTES[(completedLevel.level - 1) % LEVEL_PALETTES.length]!;
  const emoji = UNIT_EMOJIS[(completedLevel.level - 1) % UNIT_EMOJIS.length]!;

  useEffect(() => {
    if (awardFiredRef.current) return;
    awardFiredRef.current = true;
    if (award) setTimeout(() => award(UNIT_BONUS_XP, true), 400);
  }, [award]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes ucb-in {
          from { transform: scale(0.72) translateY(40px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }
        @keyframes ucb-star {
          0%,100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1.18) rotate(12deg); }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
          animation: 'ucb-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* ── Gradient header ── */}
        <div
          style={{
            background: pal.grad,
            padding: '36px 28px 28px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.07)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'rgba(0,0,0,.10)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              fontSize: 68,
              marginBottom: 14,
              lineHeight: 1,
              filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.4))',
              animation: 'ucb-star 2.4s ease-in-out infinite',
              display: 'inline-block',
            }}
          >
            {emoji}
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: pal.accent,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            UNIT {completedLevel.level} COMPLETE
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.1,
              marginBottom: 6,
              textShadow: '0 2px 14px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
          >
            {completedLevel.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
            {completedLevel.desc}
          </div>
        </div>

        {/* ── Card body ── */}
        <div style={{ background: 'var(--card)', padding: '24px 24px 22px' }}>
          {/* XP bonus row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              background: 'linear-gradient(135deg,rgba(251,191,36,.14),rgba(245,158,11,.09))',
              border: '1.5px solid rgba(251,191,36,.32)',
              borderRadius: 16,
              padding: '14px 20px',
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 28 }}>⭐</span>
            <div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#b45309',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                +{UNIT_BONUS_XP} XP
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', marginTop: 3 }}>
                Unit completion bonus awarded
              </div>
            </div>
          </div>

          {/* Flavour line */}
          <p
            style={{
              fontSize: 13,
              color: 'var(--subtext)',
              textAlign: 'center',
              lineHeight: 1.55,
              margin: '0 0 20px',
            }}
          >
            You've mastered the{' '}
            <strong style={{ color: 'var(--heading)', fontWeight: 800 }}>
              {completedLevel.title}
            </strong>{' '}
            stage.
            {completedLevel.level < 7
              ? ` Unit ${completedLevel.level + 1} unlocked!`
              : ' The journey continues.'}
          </p>

          <button
            className="b bp"
            style={{ width: '100%', fontSize: 15, padding: '16px', letterSpacing: '.01em' }}
            onClick={onClose}
          >
            {completedLevel.level < 7
              ? `Continue to Unit ${completedLevel.level + 1} →`
              : '🏆 Svaka čast! Continue →'}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--subtext)',
              fontSize: 12,
              marginTop: 12,
              display: 'block',
              width: '100%',
              textAlign: 'center',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
