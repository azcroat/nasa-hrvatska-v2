import React from 'react';
import CroatianGrb from '../shared/CroatianGrb';

/**
 * Collapsed hero strip — the compact bar shown to returning users when the hero
 * is collapsed (streak / level / XP chips + an expand affordance). Presentational;
 * extracted from HeroSection as part of the 1c decomposition.
 */
export default function CompactStrip({
  streakCount,
  level,
  levelTitle,
  xp,
  onExpand,
}: {
  streakCount: number;
  level: number;
  levelTitle: string;
  xp: number;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      aria-label="Expand hero section"
      style={{
        width: '100%',
        padding: '12px 20px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <CroatianGrb size={36} />
      <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,255,255,.12)',
            borderRadius: 10,
            padding: '4px 10px',
          }}
        >
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{streakCount}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginLeft: 2 }}>
            day streak
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,255,255,.12)',
            borderRadius: 10,
            padding: '4px 10px',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Lv {level}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>{levelTitle}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,255,255,.12)',
            borderRadius: 10,
            padding: '4px 10px',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
            {xp.toLocaleString()}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>XP</span>
        </div>
      </div>
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,.6)' }}>⌄</span>
    </button>
  );
}
