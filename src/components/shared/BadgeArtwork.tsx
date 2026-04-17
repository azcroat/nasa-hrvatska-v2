import React from 'react';

// Badge shape categories mapped to actual badge IDs from data.jsx
const BADGE_SHAPES = {
  // Streak badges → FLAME shield
  str3: 'flame', str7: 'flame', str30: 'flame',
  // Lesson badges → SCROLL (open book)
  first: 'scroll', ded: 'scroll', lc20: 'scroll', lc50: 'scroll', lc100: 'scroll',
  // XP badges → STAR burst
  x100: 'star', x500: 'star', x1k: 'star', x2k: 'star', x5k: 'star', x10k: 'star',
  // Mastery / perfection → CROWN
  perf: 'crown', perf5: 'crown',
  // Cultural badges → CROSS (Croatian cross)
  baka1: 'cross', baka5: 'cross', city5: 'cross', city15: 'cross',
  media5: 'cross', media20: 'cross', region5: 'cross', proverb: 'cross',
  amb: 'cross',
  // Speaking / practice / grammar → LIGHTNING bolt
  spk: 'lightning', gram: 'lightning', mod: 'lightning', fix5: 'lightning',
  // Reading / SRS → SCROLL (reuse)
  srs10: 'scroll', srs50: 'scroll', read3: 'scroll', hist: 'scroll',
};

// Color themes per shape
const SHAPE_COLORS = {
  flame:     { bg: ['#7f1d1d', '#dc2626'], border: '#f87171', glow: '#ef4444', accent: '#fbbf24' },
  scroll:    { bg: ['#1e3a5f', '#0e7490'], border: '#38bdf8', glow: '#0ea5e9', accent: '#ffffff' },
  star:      { bg: ['#78350f', '#d97706'], border: '#fbbf24', glow: '#f59e0b', accent: '#ffffff' },
  crown:     { bg: ['#4c1d95', '#7c3aed'], border: '#a78bfa', glow: '#8b5cf6', accent: '#fde68a' },
  cross:     { bg: ['#0f172a', '#1e3a5f'], border: '#6b7280', glow: '#9ca3af', accent: '#FFE070' },
  lightning: { bg: ['#0c4a6e', '#0369a1'], border: '#38bdf8', glow: '#0ea5e9', accent: '#fde68a' },
  heart:     { bg: ['#881337', '#be123c'], border: '#fb7185', glow: '#f43f5e', accent: '#ffffff' },
};

// ── Shape renderers ──────────────────────────────────────────────────────────

function FlameShape({ c, earned: _earned = false }) {
  return (
    <>
      {/* Shield outline */}
      <path
        d="M 30 4 L 54 12 L 54 36 Q 54 52 30 58 Q 6 52 6 36 L 6 12 Z"
        fill={`url(#bg_flame)`}
        stroke={c.border}
        strokeWidth="1.5"
      />
      {/* Flame body */}
      <path
        d="M 30 16 Q 22 24 24 34 Q 26 40 30 42 Q 34 40 36 34 Q 38 24 30 16 Z"
        fill={c.accent}
        opacity="0.9"
      />
      {/* Flame inner highlight */}
      <path
        d="M 30 22 Q 26 28 27 34 Q 28 38 30 39 Q 32 38 33 34 Q 34 28 30 22 Z"
        fill="white"
        opacity="0.6"
      />
    </>
  );
}

function ScrollShape({ c, earned: _earned = false }) {
  return (
    <>
      {/* Circular background */}
      <circle cx="30" cy="30" r="26" fill={`url(#bg_scroll)`} stroke={c.border} strokeWidth="1.5" />
      {/* Book spine */}
      <line x1="30" y1="18" x2="30" y2="42" stroke={c.border} strokeWidth="1.5" />
      {/* Book left page */}
      <rect x="14" y="18" width="15" height="24" rx="1" fill="white" opacity="0.85" />
      {/* Book right page */}
      <rect x="31" y="18" width="15" height="24" rx="1" fill="white" opacity="0.85" />
      {/* Lines on left page */}
      <line x1="17" y1="24" x2="26" y2="24" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="17" y1="28" x2="26" y2="28" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="17" y1="32" x2="26" y2="32" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="17" y1="36" x2="26" y2="36" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      {/* Lines on right page */}
      <line x1="34" y1="24" x2="43" y2="24" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="34" y1="28" x2="43" y2="28" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="34" y1="32" x2="43" y2="32" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
      <line x1="34" y1="36" x2="43" y2="36" stroke={c.bg[0]} strokeWidth="1" opacity="0.5" />
    </>
  );
}

function StarShape({ c, earned: _earned = false }) {
  const pts = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * 45 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? 24 : 14;
    return `${30 + r * Math.cos(angle)},${30 + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <>
      <circle cx="30" cy="30" r="28" fill={`url(#bg_star)`} stroke={c.border} strokeWidth="1" />
      <polygon points={pts} fill={c.accent} opacity="0.9" />
      <circle cx="30" cy="30" r="8" fill="white" opacity="0.7" />
    </>
  );
}

function CrownShape({ c, earned: _earned = false }) {
  return (
    <>
      <circle cx="30" cy="30" r="26" fill={`url(#bg_crown)`} stroke={c.border} strokeWidth="1.5" />
      {/* Crown body */}
      <polygon
        points="12,43 12,26 20,34 30,17 40,34 48,26 48,43"
        fill={c.accent}
        opacity="0.9"
      />
      {/* Crown base band */}
      <rect x="12" y="43" width="36" height="5" rx="2" fill={c.accent} opacity="0.9" />
      {/* Gem at left point */}
      <circle cx="20" cy="34" r="3" fill={c.bg[0]} />
      {/* Gem at top */}
      <circle cx="30" cy="21" r="3.5" fill={c.bg[0]} />
      {/* Gem at right point */}
      <circle cx="40" cy="34" r="3" fill={c.bg[0]} />
    </>
  );
}

function CrossShape({ c, earned: _earned = false }) {
  return (
    <>
      <circle cx="30" cy="30" r="26" fill={`url(#bg_cross)`} stroke={c.border} strokeWidth="1.5" />
      {/* Vertical bar */}
      <rect x="26" y="12" width="8" height="36" rx="2" fill={c.accent} opacity="0.9" />
      {/* Horizontal bar */}
      <rect x="12" y="26" width="36" height="8" rx="2" fill={c.accent} opacity="0.9" />
      {/* Center medallion outer */}
      <circle cx="30" cy="30" r="6" fill={c.bg[0]} />
      {/* Center medallion inner */}
      <circle cx="30" cy="30" r="4" fill={c.accent} opacity="0.8" />
      {/* Four corner accent dots */}
      <circle cx="19" cy="19" r="2.5" fill={c.accent} opacity="0.6" />
      <circle cx="41" cy="19" r="2.5" fill={c.accent} opacity="0.6" />
      <circle cx="19" cy="41" r="2.5" fill={c.accent} opacity="0.6" />
      <circle cx="41" cy="41" r="2.5" fill={c.accent} opacity="0.6" />
    </>
  );
}

function LightningShape({ c, earned: _earned = false }) {
  return (
    <>
      <circle cx="30" cy="30" r="26" fill={`url(#bg_lightning)`} stroke={c.border} strokeWidth="1.5" />
      {/* Lightning bolt: top-right → center-left → tip */}
      <polygon
        points="34,12 22,32 30,32 26,50 40,28 32,28"
        fill={c.accent}
        opacity="0.9"
      />
    </>
  );
}

function HeartShape({ c, earned: _earned = false }) {
  return (
    <>
      <circle cx="30" cy="30" r="26" fill={`url(#bg_heart)`} stroke={c.border} strokeWidth="1.5" />
      {/* Heart */}
      <path
        d="M 30 42 Q 12 30 12 22 Q 12 14 20 14 Q 26 14 30 20 Q 34 14 40 14 Q 48 14 48 22 Q 48 30 30 42 Z"
        fill={c.accent}
        opacity="0.9"
      />
    </>
  );
}

// ── Gradient defs for all seven shapes ──────────────────────────────────────

function AllGradients() {
  return (
    <defs>
      <linearGradient id="bg_flame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.flame.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.flame.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_scroll" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.scroll.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.scroll.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_star" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.star.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.star.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_crown" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.crown.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.crown.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_cross" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.cross.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.cross.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_lightning" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.lightning.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.lightning.bg[1]} />
      </linearGradient>
      <linearGradient id="bg_heart" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SHAPE_COLORS.heart.bg[0]} />
        <stop offset="100%" stopColor={SHAPE_COLORS.heart.bg[1]} />
      </linearGradient>
    </defs>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BadgeArtwork({ badgeId, size = 52, earned = true }) {
  const shape = BADGE_SHAPES[badgeId] || 'star';
  const c = SHAPE_COLORS[shape] || SHAPE_COLORS.star;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      aria-hidden="true"
      style={{
        opacity: earned ? 1 : 0.35,
        filter: earned ? `drop-shadow(0 2px 6px ${c.glow}88)` : 'none',
        flexShrink: 0,
      }}
    >
      <AllGradients />
      {shape === 'flame'     && <FlameShape     c={c} earned={earned} />}
      {shape === 'scroll'    && <ScrollShape    c={c} earned={earned} />}
      {shape === 'star'      && <StarShape      c={c} earned={earned} />}
      {shape === 'crown'     && <CrownShape     c={c} earned={earned} />}
      {shape === 'cross'     && <CrossShape     c={c} earned={earned} />}
      {shape === 'lightning' && <LightningShape c={c} earned={earned} />}
      {shape === 'heart'     && <HeartShape     c={c} earned={earned} />}
    </svg>
  );
}
