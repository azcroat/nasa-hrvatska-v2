import React, { useState, useEffect } from 'react';
import { knightSpeak } from '../../lib/knightSpeak.js';

interface Props {
  score: number;
  total: number;
  xp: number;
  onDone: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const CIRC = 282.74; // 2π × r(45)

export default function CompletionCard({
  score,
  total,
  xp,
  onDone,
  secondaryLabel,
  onSecondary,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const ringOffset = CIRC * (1 - pct / 100);
  const isGreat = pct >= 80;
  const isGood = pct >= 60;

  // Animate ring fill on mount
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFilled(true), 80);
    return () => clearTimeout(id);
  }, []);

  // Knight reaction fires once on mount
  useEffect(() => {
    const mood = isGreat ? 'victory' : isGood ? 'happy' : 'encouraging';
    const msg = isGreat
      ? `${score}/${total} — outstanding Croatian! ⚔️`
      : isGood
        ? `${score}/${total} — solid work, keep building! 💪`
        : `${score}/${total} — every attempt builds fluency. Hajde! 🎯`;
    knightSpeak(mood, msg, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringColor = isGreat ? '#f59e0b' : isGood ? '#0e7490' : '#7c3aed';
  const emoji = isGreat ? '🏆' : isGood ? '⭐' : '💪';

  return (
    <div style={{ textAlign: 'center', padding: '28px 20px' }}>
      {/* Score ring */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          marginBottom: 16,
          animation: 'bounce-in .5s cubic-bezier(.34,1.56,.64,1) both',
        }}
      >
        <svg width={120} height={120} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx={50} cy={50} r={45} fill="none" stroke="var(--bar-bg)" strokeWidth={8} />
          <circle
            cx={50}
            cy={50}
            r={45}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            style={{
              strokeDashoffset: filled ? ringOffset : CIRC,
              transform: 'rotate(-90deg)',
              transformOrigin: '50px 50px',
              transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--heading)', lineHeight: 1 }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* Score text */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: 'var(--heading)',
          marginBottom: 6,
          animation: 'fade-up .4s ease-out .3s both',
        }}
      >
        {score} / {total} correct
      </div>

      {/* Performance message */}
      <div
        style={{
          fontSize: 14,
          color: 'var(--subtext)',
          marginBottom: 20,
          lineHeight: 1.45,
          animation: 'fade-up .4s ease-out .45s both',
        }}
      >
        {isGreat
          ? 'Outstanding! Your Croatian is growing fast.'
          : isGood
            ? "Good progress! You're building solid foundations."
            : 'Keep practising — consistency is everything.'}
      </div>

      {/* XP badge */}
      {xp > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            color: 'white',
            fontWeight: 900,
            fontSize: 17,
            borderRadius: 20,
            padding: '9px 22px',
            marginBottom: 24,
            boxShadow: '0 4px 14px rgba(245,158,11,.35)',
            animation: 'bounce-in .5s cubic-bezier(.34,1.56,.64,1) .6s both',
          }}
        >
          ⭐ +{xp} XP
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          animation: 'fade-up .4s ease-out .75s both',
        }}
      >
        {onSecondary && secondaryLabel && (
          <button className="b bg" style={{ flex: 1 }} onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
        <button
          className="b bp"
          style={{ flex: onSecondary ? 1 : undefined, width: !onSecondary ? '100%' : undefined }}
          onClick={onDone}
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
}
