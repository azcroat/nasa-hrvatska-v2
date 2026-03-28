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
// High-quality Lego-style Croatian knight SVG
// ---------------------------------------------------------------------------
function KnightSVG({ size, mood, className, style }) {
  const isCelebrating = mood === 'celebrating';
  const anim = MOOD_ANIM[mood] || 'none';

  const confetti = [
    { x:4,  y:16, w:7,   h:3.5, c:'#D40030', r:22  },
    { x:20, y:7,  w:4.5, h:7,   c:'#FFE070', r:-16 },
    { x:78, y:10, w:7,   h:3.5, c:'#38bdf8', r:32  },
    { x:96, y:22, w:3.5, h:7,   c:'#D40030', r:-12 },
    { x:8,  y:38, w:6,   h:3,   c:'#38bdf8', r:48  },
    { x:97, y:40, w:3.5, h:6,   c:'#D40030', r:-38 },
    { x:2,  y:60, w:6,   h:3,   c:'#FFE070', r:12  },
    { x:103,y:64, w:3.5, h:6,   c:'#16a34a', r:28  },
    { x:14, y:78, w:5,   h:3,   c:'#a78bfa', r:-22 },
    { x:99, y:80, w:4,   h:5,   c:'#f59e0b', r:36  },
  ];

  // Lego-style face expressions — printed face visible through visor
  const renderFace = () => {
    switch (mood) {
      case 'happy':
        return (<>
          <ellipse cx="52" cy="34" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="68" cy="34" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="52.8" cy="33.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="68.8" cy="33.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <path d="M 48 40 Q 60 48 72 40" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 48 39.5 Q 60 47.5 72 39.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" strokeLinecap="round"/>
        </>);
      case 'celebrating':
        return (<>
          <text x="52" y="38" fontSize="9" fill="#1C1C1C" textAnchor="middle" fontWeight="bold">★</text>
          <text x="68" y="38" fontSize="9" fill="#1C1C1C" textAnchor="middle" fontWeight="bold">★</text>
          <path d="M 48 42 Q 60 50 72 42" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 54 28 Q 60 25 66 28" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </>);
      case 'sad':
        return (<>
          <ellipse cx="52" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="68" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <path d="M 48.5 43 Q 60 38 71.5 43" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 47 31 Q 53 28 55 31" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 65 31 Q 67 28 73 31" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <ellipse cx="50" cy="39.5" rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.8"/>
        </>);
      case 'thinking':
        return (<>
          <ellipse cx="52" cy="35" rx="2.5" ry="2.8" fill="#1C1C1C"/>
          <ellipse cx="68.5" cy="34.5" rx="3.2" ry="3.5" fill="#1C1C1C"/>
          <ellipse cx="53" cy="34.2" rx="1" ry="1.1" fill="rgba(255,255,255,0.5)"/>
          <path d="M 48 42 L 54 40 L 60 43 L 66 41 L 72 43" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="80" y="26" fontSize="8" fill="#1C1C1C" fontWeight="bold">?</text>
        </>);
      case 'confused':
        return (<>
          <ellipse cx="52" cy="35" rx="2" ry="2.2" fill="#1C1C1C"/>
          <ellipse cx="68.5" cy="34.5" rx="3.2" ry="3.5" fill="#1C1C1C"/>
          <path d="M 48 42 L 55 39 L 62 43 L 68 40 L 72 43" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="79" y="24" fontSize="7" fill="#1C1C1C" fontWeight="bold">??</text>
        </>);
      case 'encouraged':
        return (<>
          <ellipse cx="52" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="68" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="52.8" cy="34.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="68.8" cy="34.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <path d="M 47 30 Q 52 27 55 31" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 65 31 Q 68 27 73 30" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 49 41 Q 60 48 71 41" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>);
      default: // neutral
        return (<>
          <ellipse cx="52" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="68" cy="35" rx="2.8" ry="3" fill="#1C1C1C"/>
          <ellipse cx="52.8" cy="34.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="68.8" cy="34.2" rx="1.1" ry="1.2" fill="rgba(255,255,255,0.55)"/>
          <path d="M 50 43 Q 60 47 70 43" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>);
    }
  };

  return (
    <svg
      width={size} height={size * 1.5}
      viewBox="0 0 120 160" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ animation: anim, transformOrigin: 'bottom center', display: 'block', ...style }}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
    >
      <defs>
        {/* ── Armor gradients — layered metallic steel ── */}
        <linearGradient id="lg-armor" x1="0%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%"   stopColor="#8096B0"/>
          <stop offset="30%"  stopColor="#506070"/>
          <stop offset="70%"  stopColor="#384858"/>
          <stop offset="100%" stopColor="#1E2A38"/>
        </linearGradient>
        <linearGradient id="lg-armorLt" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%"   stopColor="#A0B8D0"/>
          <stop offset="50%"  stopColor="#7090A8"/>
          <stop offset="100%" stopColor="#4A6278"/>
        </linearGradient>
        <linearGradient id="lg-armorDeep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2C3C50"/>
          <stop offset="100%" stopColor="#0E1820"/>
        </linearGradient>
        {/* ── Face area — warm Lego yellow skin ── */}
        <radialGradient id="lg-skin" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFE8A8"/>
          <stop offset="60%"  stopColor="#FFCC6A"/>
          <stop offset="100%" stopColor="#E8A830"/>
        </radialGradient>
        {/* ── Gold trim ── */}
        <linearGradient id="lg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFF4B0"/>
          <stop offset="35%"  stopColor="#F4C830"/>
          <stop offset="70%"  stopColor="#D4A010"/>
          <stop offset="100%" stopColor="#A07800"/>
        </linearGradient>
        {/* ── Cape & plume — Croatian red ── */}
        <linearGradient id="lg-cape" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%"   stopColor="#E82040"/>
          <stop offset="50%"  stopColor="#C01020"/>
          <stop offset="100%" stopColor="#6A0010"/>
        </linearGradient>
        <linearGradient id="lg-plumeBase" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%"   stopColor="#FF5060"/>
          <stop offset="100%" stopColor="#C01020"/>
        </linearGradient>
        {/* ── Sword blade — polished mirror steel ── */}
        <linearGradient id="lg-sword" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#88A8C0"/>
          <stop offset="30%"  stopColor="#D8EEF8"/>
          <stop offset="55%"  stopColor="#FFFFFF"/>
          <stop offset="75%"  stopColor="#C0D8E8"/>
          <stop offset="100%" stopColor="#607888"/>
        </linearGradient>
        {/* ── Grip ── */}
        <linearGradient id="lg-grip" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7A4420"/>
          <stop offset="50%"  stopColor="#9A6038"/>
          <stop offset="100%" stopColor="#5A3010"/>
        </linearGradient>
        {/* ── Shield body ── */}
        <linearGradient id="lg-shield" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="#E02030"/>
          <stop offset="50%"  stopColor="#B01020"/>
          <stop offset="100%" stopColor="#700010"/>
        </linearGradient>
        {/* ── Plastic sheen overlay — top-left lit ── */}
        <radialGradient id="lg-sheen" cx="28%" cy="22%" r="62%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.42)"/>
          <stop offset="55%"  stopColor="rgba(255,255,255,0.10)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        {/* ── Shield clip ── */}
        <clipPath id="lg-shieldClip">
          <path d="M 2 85 L 22 85 L 22 107 Q 22 118 12 122 Q 2 118 2 107 Z"/>
        </clipPath>
        {/* ── Helm clip (rounds the top) ── */}
        <clipPath id="lg-helmClip">
          <rect x="34" y="10" width="52" height="48"/>
        </clipPath>
        {/* ── Drop shadow — main figure ── */}
        <filter id="lg-drop" x="-20%" y="-8%" width="145%" height="125%">
          <feDropShadow dx="2" dy="5" stdDeviation="4.5" floodColor="rgba(0,0,0,0.38)"/>
        </filter>
        {/* ── Sword glow ── */}
        <filter id="lg-swordGlow" x="-30%" y="-5%" width="160%" height="110%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* ── Visor inner-shadow ── */}
        <filter id="lg-visorInner" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(0,0,0,0.4)" in="SourceGraphic"/>
        </filter>
      </defs>

      {/* ── Ground shadow ── */}
      <ellipse cx="60" cy="157" rx="30" ry="3.5" fill="rgba(0,0,0,0.22)"/>

      {/* ── Celebratory confetti ── */}
      {isCelebrating && confetti.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="0.8"
          fill={p.c} opacity="0.92"
          transform={`rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})`}/>
      ))}

      {/* ══ MAIN FIGURE — in drop-shadow filter group ══ */}
      <g filter="url(#lg-drop)">

        {/* ── CAPE (behind body, painted in draw order first) ── */}
        <path d="M 40 60 Q 22 78 22 132 Q 26 150 38 153 L 40 100 Z"
          fill="url(#lg-cape)"/>
        <path d="M 80 60 Q 98 78 98 132 Q 94 150 82 153 L 80 100 Z"
          fill="url(#lg-cape)"/>
        {/* Cape edge trim */}
        <path d="M 40 60 Q 22 78 22 132" stroke="#F4C830" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M 80 60 Q 98 78 98 132" stroke="#F4C830" strokeWidth="1.5" fill="none" opacity="0.7"/>
        {/* Cape inner fold lines */}
        <path d="M 36 75 Q 26 96 28 122" stroke="rgba(0,0,0,0.22)" strokeWidth="1.2" fill="none"/>
        <path d="M 84 75 Q 94 96 92 122" stroke="rgba(0,0,0,0.22)" strokeWidth="1.2" fill="none"/>

        {/* ── LEGS ── */}
        {/* Left leg */}
        <rect x="34" y="107" width="24" height="42" rx="5.5" fill="url(#lg-armor)"/>
        <rect x="36" y="108" width="11" height="10" rx="3" fill="rgba(255,255,255,0.18)"/>
        {/* Knee guard left */}
        <rect x="34" y="122" width="24" height="7" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="35" y="122" width="22" height="2.5" rx="1" fill="rgba(255,255,255,0.22)"/>
        {/* Right leg */}
        <rect x="62" y="107" width="24" height="42" rx="5.5" fill="url(#lg-armor)"/>
        <rect x="64" y="108" width="11" height="10" rx="3" fill="rgba(255,255,255,0.18)"/>
        {/* Knee guard right */}
        <rect x="62" y="122" width="24" height="7" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="63" y="122" width="22" height="2.5" rx="1" fill="rgba(255,255,255,0.22)"/>
        {/* Leg gap / center divide */}
        <rect x="57" y="105" width="6" height="44" rx="1.5" fill="#121C28"/>
        {/* Feet */}
        <rect x="31" y="144" width="28" height="12" rx="6" fill="url(#lg-armorLt)"/>
        <rect x="33" y="145" width="13" height="4.5" rx="2" fill="rgba(255,255,255,0.22)"/>
        <rect x="61" y="144" width="28" height="12" rx="6" fill="url(#lg-armorLt)"/>
        <rect x="63" y="145" width="13" height="4.5" rx="2" fill="rgba(255,255,255,0.22)"/>
        {/* Foot rivet dots */}
        <circle cx="45" cy="153" r="1.5" fill="rgba(0,0,0,0.25)"/>
        <circle cx="75" cy="153" r="1.5" fill="rgba(0,0,0,0.25)"/>

        {/* ── BELT / HIP ARMOR ── */}
        <rect x="34" y="100" width="52" height="10" rx="5" fill="url(#lg-armorLt)"/>
        {/* Belt centre buckle */}
        <rect x="54" y="100" width="12" height="10" rx="3.5" fill="url(#lg-armor)"/>
        <circle cx="60" cy="105" r="3.5" fill="url(#lg-gold)"/>
        <circle cx="60" cy="104.5" r="1.5" fill="rgba(255,255,255,0.4)"/>
        {/* Belt highlight */}
        <rect x="34" y="100" width="52" height="3.5" rx="2" fill="rgba(255,255,255,0.16)"/>
        {/* Belt rivet dots */}
        <circle cx="41" cy="105" r="1.8" fill="url(#lg-gold)"/>
        <circle cx="79" cy="105" r="1.8" fill="url(#lg-gold)"/>

        {/* ── TORSO ── */}
        {/* White base layer */}
        <rect x="35" y="60" width="50" height="42" rx="6.5" fill="#EAEFF5"/>
        {/* Šahovnica chest print — clean 4×4 grid */}
        {[0,1,2,3].map(col => [0,1,2,3].map(row => (
          <rect key={`tc-${col}-${row}`}
            x={37 + col * 9} y={64 + row * 9} width={9} height={9}
            fill={(col + row) % 2 === 0 ? '#CC001E' : '#F5F5F5'}/>
        )))}
        {/* Šahovnica grid lines */}
        <rect x="37" y="64" width="36" height="36" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"/>
        {/* Chest armor collar */}
        <rect x="35" y="60" width="50" height="16" rx="6" fill="url(#lg-armor)"/>
        <rect x="37" y="61" width="22" height="7" rx="3" fill="rgba(255,255,255,0.19)"/>
        {/* Gold gorget band */}
        <rect x="35" y="73" width="50" height="5.5" rx="2.8" fill="url(#lg-gold)"/>
        <rect x="35" y="73" width="50" height="2.5" rx="1.2" fill="rgba(255,255,255,0.3)"/>
        {/* Gorget rivets */}
        <circle cx="43" cy="75.5" r="1.5" fill="#8B6000"/>
        <circle cx="77" cy="75.5" r="1.5" fill="#8B6000"/>
        {/* Chest pauldron edges */}
        <ellipse cx="35" cy="65" rx="8" ry="6" fill="url(#lg-armor)"/>
        <ellipse cx="85" cy="65" rx="8" ry="6" fill="url(#lg-armor)"/>
        <ellipse cx="34" cy="63" rx="5" ry="3" fill="rgba(255,255,255,0.2)"/>
        <ellipse cx="84" cy="63" rx="5" ry="3" fill="rgba(255,255,255,0.2)"/>
        {/* Pauldron rivets */}
        <circle cx="35" cy="69" r="1.3" fill="url(#lg-gold)"/>
        <circle cx="85" cy="69" r="1.3" fill="url(#lg-gold)"/>
        {/* Torso sheen */}
        <rect x="35" y="60" width="50" height="42" rx="6.5" fill="url(#lg-sheen)" opacity="0.6"/>

        {/* ── LEFT ARM ── */}
        <rect x="18" y="64" width="18" height="34" rx="7.5" fill="url(#lg-armor)"/>
        <rect x="20" y="65" width="8" height="13" rx="3.5" fill="rgba(255,255,255,0.18)"/>
        {/* Elbow guard */}
        <rect x="18" y="82" width="18" height="6" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="19" y="82" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.22)"/>

        {/* ── SHIELD (left hand) ── */}
        {/* Shield arm connector */}
        <rect x="15" y="90" width="18" height="8" rx="4" fill="url(#lg-armorLt)"/>
        {/* Shield body */}
        <path d="M 2 85 L 22 85 L 22 107 Q 22 118 12 122 Q 2 118 2 107 Z"
          fill="url(#lg-shield)"/>
        {/* Shield šahovnica */}
        <g clipPath="url(#lg-shieldClip)">
          {[0,1].map(col => [0,1,2,3].map(row => (
            <rect key={`sc-${col}-${row}`}
              x={2 + col * 10} y={86 + row * 9} width={10} height={9}
              fill={(col + row) % 2 === 0 ? '#CC001E' : '#F5F5F5'}/>
          )))}
        </g>
        {/* Shield border */}
        <path d="M 2 85 L 22 85 L 22 107 Q 22 118 12 122 Q 2 118 2 107 Z"
          fill="none" stroke="#F4C830" strokeWidth="2.2"/>
        {/* Shield boss */}
        <circle cx="12" cy="103" r="5.5" fill="url(#lg-gold)"/>
        <circle cx="12" cy="102" r="3" fill="#C09000"/>
        <circle cx="11" cy="101.5" r="1.2" fill="rgba(255,255,255,0.5)"/>
        {/* Shield highlight */}
        <path d="M 5 87 Q 4 97 5 104" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round"/>

        {/* ── RIGHT ARM ── */}
        <rect x="84" y="64" width="18" height="34" rx="7.5" fill="url(#lg-armor)"/>
        <rect x="86" y="65" width="8" height="13" rx="3.5" fill="rgba(255,255,255,0.18)"/>
        {/* Elbow guard */}
        <rect x="84" y="82" width="18" height="6" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="85" y="82" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.22)"/>

        {/* ── SWORD (right hand, blade pointing up) ── */}
        <g filter="url(#lg-swordGlow)">
          {/* Blade */}
          <rect x="88.5" y="5" width="6.5" height="80" rx="3.25" fill="url(#lg-sword)"/>
          {/* Blade edge highlight */}
          <rect x="90" y="7" width="2" height="75" rx="1" fill="rgba(255,255,255,0.65)"/>
          {/* Blade tip */}
          <polygon points="88.5,5 95,5 91.75,0" fill="url(#lg-sword)"/>
          {/* Tip sparkle */}
          <circle cx="91.75" cy="1" r="1.5" fill="rgba(255,255,255,0.9)"/>
        </g>
        {/* Crossguard */}
        <rect x="81" y="83" width="21" height="6.5" rx="3.25" fill="url(#lg-gold)"/>
        <rect x="81" y="83" width="21" height="2.8" rx="1.4" fill="rgba(255,255,255,0.28)"/>
        <circle cx="81.5" cy="86.25" r="3" fill="url(#lg-gold)"/>
        <circle cx="101.5" cy="86.25" r="3" fill="url(#lg-gold)"/>
        {/* Grip */}
        <rect x="88.5" y="89.5" width="6.5" height="15" rx="3.25" fill="url(#lg-grip)"/>
        {[91, 94, 97, 100].map((y, i) => (
          <rect key={i} x="88.5" y={y} width="6.5" height="1.8" rx="0.9" fill="#3A1800" opacity="0.5"/>
        ))}
        {/* Pommel */}
        <ellipse cx="91.75" cy="106" rx="6" ry="5" fill="url(#lg-gold)"/>
        <ellipse cx="91.75" cy="104.8" rx="3.5" ry="2.3" fill="rgba(255,255,255,0.28)"/>

        {/* ── HELMET ── */}
        {/* Helmet dome — main body */}
        <rect x="35" y="14" width="50" height="46" rx="25" fill="url(#lg-armor)"/>
        {/* Dome highlight */}
        <ellipse cx="53" cy="22" rx="13" ry="7" fill="rgba(255,255,255,0.18)"/>
        {/* Dome top edge band (gold) */}
        <rect x="36" y="13" width="48" height="5" rx="2.5" fill="url(#lg-gold)"/>
        <rect x="36" y="13" width="48" height="2.2" rx="1.1" fill="rgba(255,255,255,0.3)"/>
        {/* Cheek guards — plate armor side pieces */}
        <rect x="33" y="26" width="15" height="28" rx="6" fill="url(#lg-armor)"/>
        <rect x="34.5" y="28" width="6" height="10" rx="3" fill="rgba(255,255,255,0.17)"/>
        {/* Cheek rivet left */}
        <circle cx="40" cy="47" r="1.8" fill="url(#lg-gold)"/>
        <rect x="72" y="26" width="15" height="28" rx="6" fill="url(#lg-armor)"/>
        <rect x="73.5" y="28" width="6" height="10" rx="3" fill="rgba(255,255,255,0.17)"/>
        {/* Cheek rivet right */}
        <circle cx="80" cy="47" r="1.8" fill="url(#lg-gold)"/>
        {/* Visor brow band */}
        <rect x="33" y="46" width="54" height="6.5" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="33" y="46" width="54" height="2.8" rx="1.4" fill="rgba(255,255,255,0.25)"/>
        {/* Visor brow rivets */}
        <circle cx="40" cy="49.5" r="1.5" fill="url(#lg-gold)"/>
        <circle cx="80" cy="49.5" r="1.5" fill="url(#lg-gold)"/>
        <circle cx="60" cy="49.5" r="1.5" fill="url(#lg-gold)"/>
        {/* ── VISOR OPENING — face window ── */}
        <rect x="43" y="24" width="34" height="25" rx="10" fill="url(#lg-skin)" filter="url(#lg-visorInner)"/>
        {/* ── FACE ── */}
        {renderFace()}
        {/* Visor frame inner edge (depth) */}
        <rect x="43" y="24" width="34" height="25" rx="10" fill="none" stroke="#1A2530" strokeWidth="3"/>
        {/* Visor frame outer highlight */}
        <rect x="43" y="24" width="34" height="25" rx="10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
        {/* Helmet plastic sheen */}
        <rect x="35" y="14" width="50" height="46" rx="25" fill="url(#lg-sheen)" opacity="0.7"/>

        {/* ── PLUME — dramatic swept feathers ── */}
        {/* Back feathers (darker) */}
        <path d="M 64 13 Q 85 3 95 -2 Q 88 -4 80 2 Q 86 6 70 13"
          fill="#8B0010" opacity="0.7"/>
        {/* Mid feathers */}
        <path d="M 63 13 Q 82 2 90 -1 Q 84 -3 76 3 Q 81 7 67 13"
          fill="url(#lg-plumeBase)"/>
        {/* Main swept plume */}
        <path d="M 62 12 Q 79 3 87 0 Q 81 -2 73 4 Q 78 7 65 13"
          fill="url(#lg-cape)"/>
        {/* Front feather highlight */}
        <path d="M 62 13 Q 75 6 81 4 Q 77 3 72 6 Q 75 9 64 13"
          fill="#FF6080" opacity="0.5"/>
        {/* Plume tip sparkle */}
        <circle cx="88" cy="0" r="2" fill="#FF8090" opacity="0.7"/>

        {/* ── LEGO STUD — classic cylinder top ── */}
        {/* Stud shadow */}
        <ellipse cx="60" cy="16" rx="11" ry="7" fill="rgba(0,0,0,0.18)"/>
        {/* Stud body */}
        <ellipse cx="60" cy="13.5" rx="10" ry="6.5" fill="url(#lg-armor)"/>
        {/* Stud side wall */}
        <path d="M 50 13.5 L 50 16 Q 50 19 60 19 Q 70 19 70 16 L 70 13.5" fill="url(#lg-armorDeep)"/>
        {/* Stud top highlight */}
        <ellipse cx="57" cy="11.5" rx="5.5" ry="3" fill="rgba(255,255,255,0.28)"/>

        {/* ── NECK PEG (Lego-style connector below head) ── */}
        <rect x="50" y="53" width="20" height="10" rx="5" fill="url(#lg-skin)"/>
        <rect x="52" y="54" width="8" height="5" rx="2.5" fill="rgba(255,255,255,0.22)"/>
        {/* Gorget (neck guard) */}
        <rect x="38" y="58" width="44" height="6" rx="3" fill="url(#lg-armorLt)"/>
        <rect x="38" y="58" width="44" height="2.5" rx="1.2" fill="rgba(255,255,255,0.22)"/>

      </g>{/* end main figure group */}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main export — always renders the Lego SVG knight
// ---------------------------------------------------------------------------
export default function CroatianKnight({ size = 80, mood = 'neutral', className = '', style = {} }) {
  return <KnightSVG size={size} mood={mood} className={className} style={style} />;
}
