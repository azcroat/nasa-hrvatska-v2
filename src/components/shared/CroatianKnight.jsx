import React from 'react';

// Maps mood → CSS animation
const MOOD_ANIM = {
  celebrating: 'knightBounce 1.2s ease-in-out infinite',
  happy:       'knightFloat  2.5s ease-in-out infinite',
  encouraged:  'knightPulse  2s   ease-in-out infinite',
  thinking:    'knightTilt   3s   ease-in-out infinite',
  confused:    'knightWobble 0.8s ease-in-out',
  sad:         'knightDroop  3s   ease-in-out infinite',
  neutral:     'none',
};

// ---------------------------------------------------------------------------
// Medieval Croatian Knight — high-quality illustrated SVG mascot
// Full plate armour, šahovnica heraldry, Croatian red cape & plume
// ---------------------------------------------------------------------------
function KnightSVG({ size, mood, className, style }) {
  const anim = MOOD_ANIM[mood] || 'none';
  const isCelebrating = mood === 'celebrating';

  // Confetti for celebrating state
  const confetti = [
    { x:2,  y:18, w:7,   h:3,   c:'#D40030', r:22  },
    { x:18, y:8,  w:4,   h:7,   c:'#FFE070', r:-16 },
    { x:78, y:12, w:7,   h:3,   c:'#38bdf8', r:32  },
    { x:95, y:24, w:3,   h:7,   c:'#D40030', r:-12 },
    { x:6,  y:40, w:6,   h:3,   c:'#38bdf8', r:48  },
    { x:96, y:42, w:3,   h:6,   c:'#D40030', r:-38 },
    { x:0,  y:62, w:6,   h:3,   c:'#FFE070', r:12  },
    { x:102,y:66, w:3,   h:6,   c:'#16a34a', r:28  },
    { x:12, y:80, w:5,   h:3,   c:'#a78bfa', r:-22 },
    { x:98, y:82, w:4,   h:5,   c:'#f59e0b', r:36  },
  ];

  return (
    <svg
      width={size}
      height={size * 1.55}
      viewBox="0 0 110 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ animation: anim, transformOrigin: 'bottom center', display: 'block', ...style }}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
    >
      <defs>
        {/* ── Polished steel plate armour ── */}
        <linearGradient id="mk-steel" x1="15%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#CDD8E4"/>
          <stop offset="28%"  stopColor="#8EA4B8"/>
          <stop offset="62%"  stopColor="#566878"/>
          <stop offset="100%" stopColor="#1E2C3A"/>
        </linearGradient>
        <linearGradient id="mk-steelLt" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#E8EEF6"/>
          <stop offset="45%"  stopColor="#A8BCCC"/>
          <stop offset="100%" stopColor="#4A6070"/>
        </linearGradient>
        <linearGradient id="mk-steelDk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3A4E60"/>
          <stop offset="100%" stopColor="#0E1820"/>
        </linearGradient>
        <linearGradient id="mk-steelV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D0DCE8"/>
          <stop offset="40%"  stopColor="#8CA0B0"/>
          <stop offset="100%" stopColor="#2A3A4A"/>
        </linearGradient>
        {/* ── Croatian red ── */}
        <linearGradient id="mk-red" x1="0%" y1="0%" x2="35%" y2="100%">
          <stop offset="0%"   stopColor="#E83040"/>
          <stop offset="55%"  stopColor="#B01825"/>
          <stop offset="100%" stopColor="#680010"/>
        </linearGradient>
        <linearGradient id="mk-redLt" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="#F04050"/>
          <stop offset="100%" stopColor="#901020"/>
        </linearGradient>
        {/* ── Gold trim ── */}
        <linearGradient id="mk-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFF8B0"/>
          <stop offset="38%"  stopColor="#E8C020"/>
          <stop offset="72%"  stopColor="#C09000"/>
          <stop offset="100%" stopColor="#806000"/>
        </linearGradient>
        <linearGradient id="mk-goldV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#FFEC90"/>
          <stop offset="100%" stopColor="#906800"/>
        </linearGradient>
        {/* ── Shield parchment-white ── */}
        <linearGradient id="mk-white" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="#F6F4EE"/>
          <stop offset="100%" stopColor="#C8C4B8"/>
        </linearGradient>
        {/* ── Sword blade ── */}
        <linearGradient id="mk-blade" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#607888"/>
          <stop offset="30%"  stopColor="#C8DCE8"/>
          <stop offset="55%"  stopColor="#FFFFFF"/>
          <stop offset="78%"  stopColor="#B0C8D8"/>
          <stop offset="100%" stopColor="#506070"/>
        </linearGradient>
        {/* ── Brown leather ── */}
        <linearGradient id="mk-leather" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#8A5028"/>
          <stop offset="55%"  stopColor="#6A3818"/>
          <stop offset="100%" stopColor="#3A1808"/>
        </linearGradient>
        {/* ── Plume ── */}
        <linearGradient id="mk-plume" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#C01020"/>
          <stop offset="50%"  stopColor="#E83040"/>
          <stop offset="100%" stopColor="#FF6070"/>
        </linearGradient>
        {/* ── Drop shadow filter ── */}
        <filter id="mk-drop" x="-18%" y="-6%" width="145%" height="130%">
          <feDropShadow dx="1.5" dy="5" stdDeviation="4" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
        {/* ── Sword glow ── */}
        <filter id="mk-sglow" x="-25%" y="-5%" width="150%" height="110%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* ── Helmet visor inner shadow ── */}
        <filter id="mk-visor" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="rgba(0,0,0,0.6)"/>
        </filter>
        {/* ── Shield clip path (heater shape) ── */}
        <clipPath id="mk-shieldClip">
          <path d="M 2 82 L 24 82 L 24 112 Q 24 126 13 131 Q 2 126 2 112 Z"/>
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="58" cy="167" rx="28" ry="3.5" fill="rgba(0,0,0,0.22)"/>

      {/* Confetti (celebrating mood) */}
      {isCelebrating && confetti.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="0.7"
          fill={p.c} opacity="0.9"
          transform={`rotate(${p.r} ${p.x + p.w/2} ${p.y + p.h/2})`}/>
      ))}

      {/* ══ MAIN FIGURE — drop shadow group ══ */}
      <g filter="url(#mk-drop)">

        {/* ── CAPE — flowing behind figure, drawn first ── */}
        <path d="M 42 68 Q 22 92 24 142 Q 26 158 40 162 L 42 112 Z"
          fill="url(#mk-red)" opacity="0.95"/>
        <path d="M 68 68 Q 88 92 86 142 Q 84 158 70 162 L 68 112 Z"
          fill="url(#mk-red)" opacity="0.95"/>
        {/* Cape inner fold lines */}
        <path d="M 38 80 Q 27 108 28 136" stroke="#8B0010" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M 72 80 Q 83 108 82 136" stroke="#8B0010" strokeWidth="1.5" fill="none" opacity="0.5"/>
        {/* Cape hem gold trim */}
        <path d="M 42 68 Q 22 92 24 142 Q 26 158 40 162"
          stroke="#C89018" strokeWidth="2" fill="none" opacity="0.75"/>
        <path d="M 68 68 Q 88 92 86 142 Q 84 158 70 162"
          stroke="#C89018" strokeWidth="2" fill="none" opacity="0.75"/>

        {/* ── LEGS ── */}
        {/* Left thigh / cuisse */}
        <rect x="36" y="112" width="20" height="34" rx="5.5" fill="url(#mk-steelV)"/>
        <rect x="38" y="113" width="8"  height="13" rx="3"   fill="rgba(255,255,255,0.2)"/>
        {/* Left poleyne (knee plate) */}
        <ellipse cx="46" cy="133" rx="11" ry="7" fill="url(#mk-steelLt)"/>
        <ellipse cx="44" cy="131.5" rx="5.5" ry="3.2" fill="rgba(255,255,255,0.28)"/>
        <ellipse cx="46" cy="133" rx="11" ry="7" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none"/>
        {/* Left greave */}
        <rect x="37" y="138" width="18" height="24" rx="4.5" fill="url(#mk-steelV)"/>
        <rect x="39" y="139" width="7"  height="10" rx="2.5" fill="rgba(255,255,255,0.18)"/>
        {/* Left sabaton */}
        <path d="M 34 160 L 56 160 Q 60 162 58 165 L 34 165 Q 30 163 34 160 Z"
          fill="url(#mk-steelLt)"/>
        <path d="M 36 161 L 50 161 Q 54 162.5 52 164 L 36 164"
          fill="rgba(255,255,255,0.2)"/>

        {/* Right thigh / cuisse */}
        <rect x="54" y="112" width="20" height="34" rx="5.5" fill="url(#mk-steelV)"/>
        <rect x="56" y="113" width="8"  height="13" rx="3"   fill="rgba(255,255,255,0.18)"/>
        {/* Right poleyne */}
        <ellipse cx="64" cy="133" rx="11" ry="7" fill="url(#mk-steelLt)"/>
        <ellipse cx="62" cy="131.5" rx="5.5" ry="3.2" fill="rgba(255,255,255,0.28)"/>
        {/* Right greave */}
        <rect x="53" y="138" width="18" height="24" rx="4.5" fill="url(#mk-steelV)"/>
        <rect x="55" y="139" width="7"  height="10" rx="2.5" fill="rgba(255,255,255,0.18)"/>
        {/* Right sabaton */}
        <path d="M 54 160 L 76 160 Q 80 163 76 165 L 54 165 Q 50 162 54 160 Z"
          fill="url(#mk-steelLt)"/>
        <path d="M 56 161 L 70 161 Q 73 162.5 71 164 L 56 164"
          fill="rgba(255,255,255,0.2)"/>

        {/* Leg gap shadow */}
        <rect x="54" y="110" width="2" height="56" rx="1" fill="rgba(0,0,0,0.4)"/>

        {/* ── TORSO — breastplate with surcoat/tabard ── */}
        {/* Backplate edge (darker) */}
        <rect x="31" y="64" width="48" height="52" rx="7"   fill="url(#mk-steelDk)" opacity="0.4"/>
        {/* Main breastplate */}
        <rect x="32" y="62" width="46" height="54" rx="7"   fill="url(#mk-steel)"/>
        {/* Breastplate central ridge */}
        <path d="M 55 62 L 55 116" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" fill="none"/>
        {/* Breastplate upper highlight */}
        <ellipse cx="46" cy="74" rx="14" ry="9"
          fill="rgba(255,255,255,0.22)" transform="rotate(-18 46 74)"/>

        {/* ŠAHOVNICA SURCOAT — tabard over lower breastplate */}
        {/* Red section (left half) */}
        <rect x="32" y="85" width="23" height="31" rx="0" fill="url(#mk-red)"/>
        {/* White section (right half) */}
        <rect x="55" y="85" width="23" height="31" rx="0" fill="url(#mk-white)"/>
        {/* Šahovnica grid lines — 5 columns × 4 rows creating the checkerboard */}
        {/* Row 0 (y=85–92): L=red, so col 0=red,1=white,2=red,3=white,4=red */}
        <rect x="32" y="85" width="9"  height="8" fill="#D40030"/>
        <rect x="41" y="85" width="9"  height="8" fill="#F0EEE8"/>
        <rect x="50" y="85" width="9"  height="8" fill="#D40030"/>
        <rect x="59" y="85" width="9"  height="8" fill="#F0EEE8"/>
        <rect x="68" y="85" width="9"  height="8" fill="#D40030"/>
        {/* Row 1 (y=93–100) */}
        <rect x="32" y="93" width="9"  height="8" fill="#F0EEE8"/>
        <rect x="41" y="93" width="9"  height="8" fill="#D40030"/>
        <rect x="50" y="93" width="9"  height="8" fill="#F0EEE8"/>
        <rect x="59" y="93" width="9"  height="8" fill="#D40030"/>
        <rect x="68" y="93" width="9"  height="8" fill="#F0EEE8"/>
        {/* Row 2 (y=101–108) */}
        <rect x="32" y="101" width="9" height="8" fill="#D40030"/>
        <rect x="41" y="101" width="9" height="8" fill="#F0EEE8"/>
        <rect x="50" y="101" width="9" height="8" fill="#D40030"/>
        <rect x="59" y="101" width="9" height="8" fill="#F0EEE8"/>
        <rect x="68" y="101" width="9" height="8" fill="#D40030"/>
        {/* Row 3 (y=109–116) */}
        <rect x="32" y="109" width="9" height="7" fill="#F0EEE8"/>
        <rect x="41" y="109" width="9" height="7" fill="#D40030"/>
        <rect x="50" y="109" width="9" height="7" fill="#F0EEE8"/>
        <rect x="59" y="109" width="9" height="7" fill="#D40030"/>
        <rect x="68" y="109" width="9" height="7" fill="#F0EEE8"/>
        {/* Surcoat border (matches breastplate edge) */}
        <rect x="32" y="85" width="46" height="31" rx="0"
          stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none"/>
        {/* Gold belt over surcoat */}
        <rect x="30" y="112" width="50" height="7" rx="2.5" fill="url(#mk-steelDk)"/>
        <rect x="31" y="113" width="48" height="3" rx="1"   fill="rgba(255,255,255,0.15)"/>
        {/* Belt buckle */}
        <rect x="51" y="112" width="8"  height="7" rx="2"   fill="url(#mk-gold)"/>
        <rect x="52" y="113" width="6"  height="3" rx="1"   fill="rgba(255,255,255,0.4)"/>

        {/* ── LEFT ARM — shield side ── */}
        {/* Pauldron left */}
        <ellipse cx="31" cy="72" rx="10" ry="8"  fill="url(#mk-steelLt)"/>
        <ellipse cx="29" cy="70" rx="5.5" ry="3.5" fill="rgba(255,255,255,0.28)"/>
        {/* Pauldron lames */}
        <path d="M 21 72 Q 21 80 24 84"   stroke="#8090A0" strokeWidth="2" fill="none"/>
        {/* Upper arm */}
        <rect x="16" y="73" width="16" height="30" rx="7"   fill="url(#mk-steel)"/>
        <rect x="18" y="74" width="6"  height="12" rx="3"   fill="rgba(255,255,255,0.2)"/>
        {/* Couter (elbow) */}
        <ellipse cx="24" cy="103" rx="9.5" ry="6" fill="url(#mk-steelLt)"/>
        <ellipse cx="22" cy="101.5" rx="4.5" ry="2.8" fill="rgba(255,255,255,0.28)"/>
        {/* Lower arm / vambrace */}
        <rect x="16" y="105" width="16" height="22" rx="6"  fill="url(#mk-steel)"/>
        <rect x="18" y="106" width="6"  height="9"  rx="3"  fill="rgba(255,255,255,0.18)"/>
        {/* Gauntlet */}
        <rect x="15" y="124" width="18" height="10" rx="5"  fill="url(#mk-steelLt)"/>
        <rect x="16" y="125" width="9"  height="4"  rx="2"  fill="rgba(255,255,255,0.22)"/>
        {/* Finger plates */}
        <rect x="15" y="131" width="4" height="5"  rx="2"  fill="url(#mk-steel)"/>
        <rect x="20" y="131" width="4" height="5"  rx="2"  fill="url(#mk-steel)"/>
        <rect x="25" y="131" width="4" height="5"  rx="2"  fill="url(#mk-steel)"/>

        {/* ── HEATER SHIELD — Croatian šahovnica ── */}
        {/* Shield boss/backing */}
        <path d="M 2 82 L 24 82 L 24 112 Q 24 126 13 131 Q 2 126 2 112 Z"
          fill="url(#mk-steelDk)" opacity="0.4"/>
        {/* Shield body */}
        <path d="M 2 82 L 24 82 L 24 112 Q 24 126 13 131 Q 2 126 2 112 Z"
          fill="url(#mk-white)"/>
        {/* Shield šahovnica — 5 columns × 5 rows, clipped to shield shape */}
        <g clipPath="url(#mk-shieldClip)">
          {/* Row 0 (y=82): R W R W R */}
          <rect x="2"  y="82" width="5" height="5" fill="#D40030"/>
          <rect x="7"  y="82" width="5" height="5" fill="#F0EEE8"/>
          <rect x="12" y="82" width="5" height="5" fill="#D40030"/>
          <rect x="17" y="82" width="5" height="5" fill="#F0EEE8"/>
          <rect x="22" y="82" width="5" height="5" fill="#D40030"/>
          {/* Row 1 (y=87): W R W R W */}
          <rect x="2"  y="87" width="5" height="5" fill="#F0EEE8"/>
          <rect x="7"  y="87" width="5" height="5" fill="#D40030"/>
          <rect x="12" y="87" width="5" height="5" fill="#F0EEE8"/>
          <rect x="17" y="87" width="5" height="5" fill="#D40030"/>
          <rect x="22" y="87" width="5" height="5" fill="#F0EEE8"/>
          {/* Row 2 (y=92): R W R W R */}
          <rect x="2"  y="92" width="5" height="5" fill="#D40030"/>
          <rect x="7"  y="92" width="5" height="5" fill="#F0EEE8"/>
          <rect x="12" y="92" width="5" height="5" fill="#D40030"/>
          <rect x="17" y="92" width="5" height="5" fill="#F0EEE8"/>
          <rect x="22" y="92" width="5" height="5" fill="#D40030"/>
          {/* Row 3 (y=97): W R W R W */}
          <rect x="2"  y="97" width="5" height="5" fill="#F0EEE8"/>
          <rect x="7"  y="97" width="5" height="5" fill="#D40030"/>
          <rect x="12" y="97" width="5" height="5" fill="#F0EEE8"/>
          <rect x="17" y="97" width="5" height="5" fill="#D40030"/>
          <rect x="22" y="97" width="5" height="5" fill="#F0EEE8"/>
          {/* Row 4 (y=102): R W R W R */}
          <rect x="2"  y="102" width="5" height="5" fill="#D40030"/>
          <rect x="7"  y="102" width="5" height="5" fill="#F0EEE8"/>
          <rect x="12" y="102" width="5" height="5" fill="#D40030"/>
          <rect x="17" y="102" width="5" height="5" fill="#F0EEE8"/>
          <rect x="22" y="102" width="5" height="5" fill="#D40030"/>
          {/* Row 5 (y=107): W R W R W */}
          <rect x="2"  y="107" width="5" height="5" fill="#F0EEE8"/>
          <rect x="7"  y="107" width="5" height="5" fill="#D40030"/>
          <rect x="12" y="107" width="5" height="5" fill="#F0EEE8"/>
          <rect x="17" y="107" width="5" height="5" fill="#D40030"/>
          <rect x="22" y="107" width="5" height="5" fill="#F0EEE8"/>
          {/* Rows 6–8 (fill remaining shield area) */}
          <rect x="2"  y="112" width="5" height="5" fill="#D40030"/>
          <rect x="7"  y="112" width="5" height="5" fill="#F0EEE8"/>
          <rect x="12" y="112" width="5" height="5" fill="#D40030"/>
          <rect x="17" y="112" width="5" height="5" fill="#F0EEE8"/>
          <rect x="2"  y="117" width="5" height="5" fill="#F0EEE8"/>
          <rect x="7"  y="117" width="5" height="5" fill="#D40030"/>
          <rect x="12" y="117" width="5" height="5" fill="#F0EEE8"/>
          <rect x="2"  y="122" width="5" height="5" fill="#D40030"/>
          <rect x="7"  y="122" width="5" height="5" fill="#F0EEE8"/>
          <rect x="12" y="122" width="5" height="5" fill="#D40030"/>
        </g>
        {/* Shield border */}
        <path d="M 2 82 L 24 82 L 24 112 Q 24 126 13 131 Q 2 126 2 112 Z"
          stroke="#1E2A38" strokeWidth="1.5" fill="none"/>
        {/* Shield gold rim */}
        <path d="M 2 82 L 24 82 L 24 112 Q 24 126 13 131 Q 2 126 2 112 Z"
          stroke="#C89018" strokeWidth="0.8" fill="none" opacity="0.7"/>
        {/* Shield highlight (top-left catch light) */}
        <path d="M 4 84 L 13 84 L 13 100" stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* ── RIGHT ARM — sword side ── */}
        {/* Pauldron right */}
        <ellipse cx="79" cy="72" rx="10" ry="8"  fill="url(#mk-steelLt)"/>
        <ellipse cx="77" cy="70" rx="5.5" ry="3.5" fill="rgba(255,255,255,0.28)"/>
        {/* Upper arm */}
        <rect x="78" y="73" width="16" height="30" rx="7"   fill="url(#mk-steel)"/>
        <rect x="80" y="74" width="6"  height="12" rx="3"   fill="rgba(255,255,255,0.18)"/>
        {/* Couter right */}
        <ellipse cx="86" cy="103" rx="9.5" ry="6" fill="url(#mk-steelLt)"/>
        <ellipse cx="84" cy="101.5" rx="4.5" ry="2.8" fill="rgba(255,255,255,0.28)"/>
        {/* Lower arm */}
        <rect x="78" y="105" width="16" height="22" rx="6"  fill="url(#mk-steel)"/>
        <rect x="80" y="106" width="6"  height="9"  rx="3"  fill="rgba(255,255,255,0.18)"/>
        {/* Gauntlet right */}
        <rect x="77" y="124" width="18" height="10" rx="5"  fill="url(#mk-steelLt)"/>
        <rect x="78" y="125" width="9"  height="4"  rx="2"  fill="rgba(255,255,255,0.22)"/>

        {/* ── LONGSWORD — raised in right hand ── */}
        {/* Sword glow (mystical aura) */}
        <path d="M 92 40 L 93 115 L 95 115 L 96 40 Z"
          fill="rgba(180,220,255,0.25)" filter="url(#mk-sglow)"/>
        {/* Blade */}
        <path d="M 92 115 L 90.5 58 L 94 28 L 97.5 58 L 96 115 Z"
          fill="url(#mk-blade)" filter="url(#mk-sglow)"/>
        {/* Blade centre fuller (groove) */}
        <path d="M 94 112 L 94 38" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none"/>
        {/* Blade edge highlight */}
        <path d="M 92 112 L 91 62 L 94 28" stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        {/* Crossguard */}
        <rect x="84" y="112" width="20" height="5" rx="2.5" fill="url(#mk-gold)"/>
        <rect x="85" y="112" width="18" height="2" rx="1"   fill="rgba(255,255,255,0.45)"/>
        {/* Grip */}
        <rect x="90" y="117" width="8"  height="22" rx="3"  fill="url(#mk-leather)"/>
        <path d="M 91 119 L 91 136 M 93 119 L 93 136 M 95 119 L 95 136 M 97 119 L 97 136"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" fill="none"/>
        {/* Wire wrap accent */}
        <rect x="90" y="124" width="8" height="3" rx="1"    fill="url(#mk-gold)" opacity="0.7"/>
        <rect x="90" y="130" width="8" height="3" rx="1"    fill="url(#mk-gold)" opacity="0.7"/>
        {/* Pommel */}
        <ellipse cx="94" cy="141" rx="6"   ry="4.5" fill="url(#mk-gold)"/>
        <ellipse cx="92" cy="139.5" rx="2.5" ry="1.8" fill="rgba(255,255,255,0.45)"/>

        {/* ── GORGET (neck/throat armour) ── */}
        <rect x="40" y="57" width="30" height="10" rx="4"   fill="url(#mk-steelLt)"/>
        <rect x="42" y="58" width="26" height="4"  rx="2"   fill="rgba(255,255,255,0.28)"/>
        {/* Gorget gold trim */}
        <rect x="39" y="64" width="32" height="3"  rx="1.5" fill="url(#mk-goldV)"/>
        <rect x="40" y="64" width="30" height="1.2" rx="0.6" fill="rgba(255,255,255,0.4)"/>

        {/* ── HELMET — sallet style (sleek visor, swept back) ── */}
        {/* Aventail — chain mail draping from helm */}
        <path d="M 34 52 Q 32 60 34 66 L 40 68 Q 55 72 65 68 L 76 66 Q 78 60 76 52 Z"
          fill="#4A5A6A"/>
        {/* Aventail texture rings */}
        <path d="M 35 54 Q 33 62 36 66" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.7"/>
        <path d="M 40 53 Q 38 63 40 67" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.5"/>
        <path d="M 50 52 Q 48 63 50 67" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.5"/>
        <path d="M 60 52 Q 58 63 60 67" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.5"/>
        <path d="M 70 53 Q 68 63 70 67" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.5"/>
        <path d="M 74 54 Q 72 62 74 66" stroke="#607888" strokeWidth="0.6" fill="none" opacity="0.7"/>

        {/* Helmet bowl — sallet silhouette */}
        <path d="M 33 50 Q 33 20 55 17 Q 77 20 77 50 L 74 55 Q 65 60 55 60 Q 45 60 36 55 Z"
          fill="url(#mk-steel)"/>
        {/* Helmet ridge (central crest) */}
        <path d="M 55 17 L 55 56" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none"/>
        {/* Swept-back tail of sallet */}
        <path d="M 74 50 Q 80 52 82 55 Q 82 58 76 57 L 74 55 Z" fill="url(#mk-steelDk)"/>
        <path d="M 74 50 Q 80 52 82 55 Q 82 58 76 57"
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"/>
        {/* Helmet dome primary highlight */}
        <ellipse cx="47" cy="32" rx="14" ry="11"
          fill="rgba(255,255,255,0.24)" transform="rotate(-20 47 32)"/>
        {/* Secondary catch-light */}
        <ellipse cx="62" cy="24" rx="5" ry="3.5"
          fill="rgba(255,255,255,0.14)" transform="rotate(-10 62 24)"/>

        {/* Visor — T-shaped opening */}
        {/* Eye slit (horizontal) */}
        <rect x="40" y="36" width="30" height="5.5" rx="2.8" fill="#0E1820" filter="url(#mk-visor)"/>
        {/* Vertical nasal bar */}
        <rect x="53" y="36" width="4"  height="16" rx="2" fill="url(#mk-steelLt)"/>
        <rect x="54" y="37" width="1.5" height="6" rx="0.7" fill="rgba(255,255,255,0.3)"/>
        {/* Eye slit inner gleam — eyes visible inside */}
        {mood === 'happy' || mood === 'celebrating' || mood === 'encouraged' ? (
          <>
            <ellipse cx="46" cy="38.5" rx="3" ry="1.5" fill="#30C860" opacity="0.7"/>
            <ellipse cx="64" cy="38.5" rx="3" ry="1.5" fill="#30C860" opacity="0.7"/>
          </>
        ) : mood === 'sad' ? (
          <>
            <ellipse cx="46" cy="38.5" rx="3" ry="1.5" fill="#6090C0" opacity="0.5"/>
            <ellipse cx="64" cy="38.5" rx="3" ry="1.5" fill="#6090C0" opacity="0.5"/>
          </>
        ) : mood === 'thinking' || mood === 'confused' ? (
          <>
            <ellipse cx="46" cy="38.5" rx="2.5" ry="1.2" fill="#FFCC40" opacity="0.55"/>
            <ellipse cx="64" cy="38.5" rx="2.5" ry="1.2" fill="#FFCC40" opacity="0.55"/>
          </>
        ) : (
          <>
            <ellipse cx="46" cy="38.5" rx="3" ry="1.5" fill="rgba(255,255,255,0.18)"/>
            <ellipse cx="64" cy="38.5" rx="3" ry="1.5" fill="rgba(255,255,255,0.18)"/>
          </>
        )}
        {/* Visor slit top edge highlight */}
        <rect x="41" y="36.5" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.2)"/>
        <rect x="57" y="36.5" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.2)"/>
        {/* Cheek guards / lower helm */}
        <path d="M 33 50 Q 34 55 36 58 Q 38 62 40 63" stroke="#507090" strokeWidth="3.5"
          fill="none" strokeLinecap="round"/>
        <path d="M 77 50 Q 76 55 74 58 Q 72 62 70 63" stroke="#507090" strokeWidth="3.5"
          fill="none" strokeLinecap="round"/>
        {/* Lower helm gold trim */}
        <path d="M 38 57 Q 55 64 72 57" stroke="url(#mk-goldV)" strokeWidth="2.5" fill="none"/>
        <path d="M 38 57 Q 55 64 72 57" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none"/>

        {/* ── CREST & PLUME — atop helmet ── */}
        {/* Crest holder / torse (twisted rope at helm top) */}
        <rect x="51" y="12" width="8" height="6" rx="2.5" fill="url(#mk-goldV)"/>
        <rect x="52" y="13" width="6" height="2.5" rx="1"   fill="rgba(255,255,255,0.35)"/>
        {/* Plume — swept back, layered feathers */}
        <path d="M 55 12 Q 76 0 86 -4 Q 79 -7 70 0 Q 75 4 60 12"
          fill="url(#mk-plume)"/>
        <path d="M 55 12 Q 73 2 82 -1 Q 76 -3 67 3 Q 72 6 60 12"
          fill="url(#mk-redLt)"/>
        <path d="M 55 12 Q 70 5 77 2 Q 72 1 65 6 Q 68 8 59 12"
          fill="#FF5060" opacity="0.65"/>
        <path d="M 55 12 Q 65 7 70 5 Q 66 5 61 8 Q 63 10 58 12"
          fill="#FF7880" opacity="0.45"/>
        {/* Plume tip sparkle */}
        <circle cx="86" cy="-4" r="1.8" fill="#FF8090" opacity="0.75"/>
        <circle cx="84" cy="-6" r="1"   fill="#FFAAB0" opacity="0.55"/>

      </g>{/* end drop-shadow group */}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function CroatianKnight({ size = 80, mood = 'neutral', className = '', style = {} }) {
  return <KnightSVG size={size} mood={mood} className={className} style={style} />;
}
