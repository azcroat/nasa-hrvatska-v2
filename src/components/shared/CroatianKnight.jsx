import React, { useState } from 'react';

/**
 * CroatianKnight — AI-powered mascot with SVG fallback
 *
 * Tries to load `/images/knights/knight-{mood}.webp` (AI-generated via Stable Horde).
 * Falls back to the full hand-crafted SVG if the image hasn't been generated yet.
 *
 * Mood → image mapping:
 *   neutral, encouraged → knight-neutral.webp
 *   happy               → knight-happy.webp
 *   celebrating         → knight-celebrating.webp
 *   sad                 → knight-sad.webp
 *   thinking, confused  → knight-thinking.webp
 *
 * Mood → CSS animation:
 *   celebrating  → knightBounce (1.2s infinite)
 *   happy        → knightFloat  (2.5s infinite)
 *   encouraged   → knightPulse  (2s infinite)
 *   thinking     → knightTilt   (3s infinite)
 *   confused     → knightWobble (0.8s)
 *   sad          → knightDroop  (3s infinite)
 *   neutral      → none
 */

// Maps mood → knight image file stem
const MOOD_IMAGE = {
  neutral:     'knight-neutral',
  happy:       'knight-happy',
  celebrating: 'knight-celebrating',
  sad:         'knight-sad',
  thinking:    'knight-thinking',
  encouraged:  'knight-neutral',
  confused:    'knight-thinking',
};

// Maps mood → CSS animation shorthand
const MOOD_ANIM = {
  celebrating: 'knightBounce 1.2s ease-in-out infinite',
  happy:       'knightFloat  2.5s ease-in-out infinite',
  encouraged:  'knightPulse  2s   ease-in-out infinite',
  thinking:    'knightTilt   3s   ease-in-out infinite',
  confused:    'knightWobble 0.8s ease-in-out infinite',
  sad:         'knightDroop  3s   ease-in-out infinite',
  neutral:     'none',
};

// ---------------------------------------------------------------------------
// Lego-style SVG knight — blocky, plastic, Croatian colours
// ---------------------------------------------------------------------------
function KnightSVG({ size, mood, className, style }) {
  const isCelebrating = mood === 'celebrating';

  const confetti = [
    { x:5,  y:18, w:6,   h:3.5, c:'#D40030', r:22  },
    { x:22, y:8,  w:4,   h:6,   c:'#FFE070', r:-16 },
    { x:78, y:12, w:6,   h:3.5, c:'#38bdf8', r:32  },
    { x:94, y:24, w:3.5, h:6,   c:'#D40030', r:-12 },
    { x:10, y:40, w:5,   h:3,   c:'#38bdf8', r:48  },
    { x:96, y:42, w:3.5, h:5,   c:'#D40030', r:-38 },
    { x:3,  y:62, w:5,   h:3,   c:'#FFE070', r:12  },
    { x:102,y:66, w:3.5, h:5,   c:'#16a34a', r:28  },
  ];

  // Lego-style printed face expressions
  const renderFace = () => {
    switch (mood) {
      case 'happy':
        return (<>
          <path d="M 51 35 Q 53.5 32 56 35" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 64 35 Q 66.5 32 69 35" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 51 42 Q 60 49 69 42" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>);
      case 'celebrating':
        return (<>
          <text x="53.5" y="39" fontSize="8" fill="#1C1C1C" textAnchor="middle">★</text>
          <text x="66.5" y="39" fontSize="8" fill="#1C1C1C" textAnchor="middle">★</text>
          <path d="M 51 43 Q 60 50 69 43" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>);
      case 'sad':
        return (<>
          <circle cx="53.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <circle cx="66.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <path d="M 52 45 Q 60 40 68 45" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <ellipse cx="52" cy="41" rx="1.3" ry="2.2" fill="#93c5fd" opacity="0.85"/>
        </>);
      case 'thinking':
        return (<>
          <circle cx="53.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <circle cx="67.5" cy="35" r="3.1" fill="#1C1C1C"/>
          <path d="M 52 43 Q 56 41 60 43 Q 64 45 68 43" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </>);
      case 'confused':
        return (<>
          <circle cx="53.5" cy="35" r="1.9" fill="#1C1C1C"/>
          <circle cx="67.5" cy="35" r="3.1" fill="#1C1C1C"/>
          <path d="M 52 43 L 57 40 L 62 44 L 67 41" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </>);
      case 'encouraged':
        return (<>
          <circle cx="53.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <circle cx="66.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <line x1="50" y1="30" x2="57" y2="29" stroke="#1C1C1C" strokeWidth="2" strokeLinecap="round"/>
          <line x1="63" y1="29" x2="70" y2="30" stroke="#1C1C1C" strokeWidth="2" strokeLinecap="round"/>
          <path d="M 51 42 Q 60 47 69 42" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>);
      default:
        return (<>
          <circle cx="53.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <circle cx="66.5" cy="35" r="2.3" fill="#1C1C1C"/>
          <path d="M 52 43 Q 60 46 68 43" stroke="#1C1C1C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>);
    }
  };

  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 160" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} style={style}
      role="img" aria-label={`Croatian knight mascot, ${mood} expression`}>
      <defs>
        {/* Steel-blue armor — Lego dark bluish-gray */}
        <linearGradient id="lg-armor" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#6B7D96"/>
          <stop offset="50%"  stopColor="#485A70"/>
          <stop offset="100%" stopColor="#2E3D50"/>
        </linearGradient>
        <linearGradient id="lg-armorLt" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%"   stopColor="#8A9DB4"/>
          <stop offset="100%" stopColor="#5C7088"/>
        </linearGradient>
        <linearGradient id="lg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFE888"/>
          <stop offset="50%"  stopColor="#F4C430"/>
          <stop offset="100%" stopColor="#C0920A"/>
        </linearGradient>
        <linearGradient id="lg-skin" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%"   stopColor="#FFD49E"/>
          <stop offset="100%" stopColor="#FFC070"/>
        </linearGradient>
        <linearGradient id="lg-cape" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%"   stopColor="#D40030"/>
          <stop offset="100%" stopColor="#7A0010"/>
        </linearGradient>
        <linearGradient id="lg-sword" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#A8BDD0"/>
          <stop offset="50%"  stopColor="#E0EAF4"/>
          <stop offset="100%" stopColor="#7890A4"/>
        </linearGradient>
        <clipPath id="lg-shieldClip">
          <path d="M 3 86 L 21 86 L 21 106 Q 21 116 12 120 Q 3 116 3 106 Z"/>
        </clipPath>
        <filter id="lg-drop" x="-25%" y="-10%" width="150%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="157" rx="28" ry="3.5" fill="rgba(0,0,0,0.18)"/>

      {/* Confetti (celebrating mood) */}
      {isCelebrating && confetti.map((p,i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="0.6"
          fill={p.c} opacity="0.9" transform={`rotate(${p.r} ${p.x+p.w/2} ${p.y+p.h/2})`}/>
      ))}

      <g filter="url(#lg-drop)">

        {/* ── CAPE (behind everything) ── */}
        <path d="M 38 62 Q 22 80 24 134 Q 28 150 38 152 L 40 102 Z" fill="url(#lg-cape)"/>
        <path d="M 82 62 Q 98 80 96 134 Q 92 150 82 152 L 80 102 Z" fill="url(#lg-cape)"/>
        <path d="M 38 62 Q 22 80 24 134" stroke="#F4C430" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M 82 62 Q 98 80 96 134" stroke="#F4C430" strokeWidth="1.5" fill="none" opacity="0.6"/>

        {/* ── LEGS ── */}
        <rect x="35" y="108" width="23" height="40" rx="5" fill="url(#lg-armor)"/>
        <rect x="37" y="109" width="9"  height="9"  rx="2.5" fill="rgba(255,255,255,0.17)"/>
        <rect x="62" y="108" width="23" height="40" rx="5" fill="url(#lg-armor)"/>
        <rect x="64" y="109" width="9"  height="9"  rx="2.5" fill="rgba(255,255,255,0.17)"/>
        {/* Leg gap */}
        <rect x="57.5" y="106" width="5" height="42" rx="1.5" fill="#1E2A38"/>
        {/* Feet */}
        <rect x="32" y="144" width="27" height="11" rx="5.5" fill="url(#lg-armorLt)"/>
        <rect x="34" y="145" width="11" height="4"  rx="2"   fill="rgba(255,255,255,0.2)"/>
        <rect x="61" y="144" width="27" height="11" rx="5.5" fill="url(#lg-armorLt)"/>
        <rect x="63" y="145" width="11" height="4"  rx="2"   fill="rgba(255,255,255,0.2)"/>

        {/* ── BELT / HIP PIECE ── */}
        <rect x="35" y="101" width="50" height="9" rx="4.5" fill="url(#lg-armorLt)"/>
        <rect x="56" y="101" width="8"  height="9" rx="3"   fill="url(#lg-armor)"/>
        <circle cx="60" cy="105.5" r="3" fill="url(#lg-gold)"/>
        <rect x="35" y="101" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.14)"/>

        {/* ── TORSO ── */}
        <rect x="36" y="62" width="48" height="40" rx="6" fill="#F0F4F8"/>
        {/* Šahovnica chest print — 4×4 grid of 9 px squares */}
        {[0,1,2,3].map(col => [0,1,2,3].map(row => (
          <rect key={`t-${col}-${row}`}
            x={38+col*9} y={66+row*9} width={9} height={9}
            fill={(col+row)%2===0 ? '#CC001E' : '#F8F8F8'}/>
        )))}
        {/* Chest-plate top (armored collar zone) */}
        <rect x="36" y="62" width="48" height="14" rx="5" fill="url(#lg-armor)"/>
        <rect x="38" y="63" width="20" height="6"  rx="2" fill="rgba(255,255,255,0.17)"/>
        {/* Gold gorget */}
        <rect x="36" y="73" width="48" height="5" rx="2.5" fill="url(#lg-gold)"/>
        <rect x="36" y="73" width="48" height="2" rx="1"   fill="rgba(255,255,255,0.28)"/>
        {/* Shoulder round caps */}
        <ellipse cx="36" cy="68" rx="7" ry="5.5" fill="url(#lg-armor)"/>
        <ellipse cx="84" cy="68" rx="7" ry="5.5" fill="url(#lg-armor)"/>
        <ellipse cx="35" cy="66" rx="4" ry="2.5" fill="rgba(255,255,255,0.19)"/>
        <ellipse cx="83" cy="66" rx="4" ry="2.5" fill="rgba(255,255,255,0.19)"/>

        {/* ── LEFT ARM ── */}
        <rect x="20" y="66" width="16" height="32" rx="7" fill="url(#lg-armor)"/>
        <rect x="22" y="67" width="7"  height="12" rx="3" fill="rgba(255,255,255,0.17)"/>

        {/* ── SHIELD (left hand) ── */}
        <rect x="17" y="90" width="16" height="8" rx="4" fill="url(#lg-armorLt)"/>
        <path d="M 3 86 L 21 86 L 21 106 Q 21 116 12 120 Q 3 116 3 106 Z"
          fill="#CC001E" stroke="#F4C430" strokeWidth="2"/>
        <g clipPath="url(#lg-shieldClip)">
          {[0,1].map(col => [0,1,2,3].map(row => (
            <rect key={`s-${col}-${row}`}
              x={3+col*9} y={87+row*9} width={9} height={9}
              fill={(col+row)%2===0 ? '#CC001E' : '#F8F8F8'}/>
          )))}
        </g>
        <path d="M 3 86 L 21 86 L 21 106 Q 21 116 12 120 Q 3 116 3 106 Z"
          fill="none" stroke="#F4C430" strokeWidth="2"/>
        <circle cx="12" cy="102" r="4.5" fill="url(#lg-gold)"/>
        <circle cx="12" cy="102" r="2.5" fill="#B88000"/>
        <path d="M 5 88 Q 4 96 5 103" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" fill="none"/>

        {/* ── RIGHT ARM ── */}
        <rect x="84" y="66" width="16" height="32" rx="7" fill="url(#lg-armor)"/>
        <rect x="86" y="67" width="7"  height="12" rx="3" fill="rgba(255,255,255,0.17)"/>

        {/* ── SWORD (right hand) ── */}
        {/* Blade */}
        <rect x="88" y="6" width="6" height="76" rx="3" fill="url(#lg-sword)"/>
        <rect x="89.5" y="8" width="1.5" height="72" rx="0.75" fill="rgba(220,240,255,0.7)"/>
        <polygon points="88,6 94,6 91,1" fill="url(#lg-sword)"/>
        {/* Crossguard */}
        <rect x="82" y="82" width="18" height="5.5" rx="2.8" fill="url(#lg-gold)"/>
        <rect x="82" y="82" width="18" height="2"   rx="1"   fill="rgba(255,255,255,0.25)"/>
        {/* Grip */}
        <rect x="87.5" y="87.5" width="7" height="14" rx="3.5" fill="#5A3010"/>
        {[89,92,95,98].map((y,i) => (
          <rect key={i} x="87.5" y={y} width="7" height="1.5" rx="0.7" fill="#3A1800" opacity="0.45"/>
        ))}
        {/* Pommel */}
        <ellipse cx="91" cy="103" rx="5.5" ry="4.5" fill="url(#lg-gold)"/>
        <ellipse cx="91" cy="102" rx="3"   ry="2"   fill="rgba(255,255,255,0.24)"/>

        {/* ── HELMET ── */}
        <rect x="37" y="16" width="46" height="40" rx="23" fill="url(#lg-armor)"/>
        <path d="M 42 18 Q 60 13 78 18" stroke="rgba(255,255,255,0.26)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Cheek guards */}
        <rect x="35" y="28" width="12" height="22" rx="5" fill="url(#lg-armor)"/>
        <rect x="36" y="30" width="5"  height="9"  rx="2.5" fill="rgba(255,255,255,0.17)"/>
        <rect x="73" y="28" width="12" height="22" rx="5" fill="url(#lg-armor)"/>
        <rect x="74" y="30" width="5"  height="9"  rx="2.5" fill="rgba(255,255,255,0.17)"/>
        {/* Gold crown band (bottom) */}
        <rect x="35" y="46" width="50" height="5" rx="2.5" fill="url(#lg-gold)"/>
        <rect x="35" y="46" width="50" height="2" rx="1"   fill="rgba(255,255,255,0.26)"/>
        {/* Gold top band */}
        <rect x="37" y="15" width="46" height="4.5" rx="2.25" fill="url(#lg-gold)"/>
        <rect x="37" y="15" width="46" height="2"   rx="1"    fill="rgba(255,255,255,0.26)"/>
        {/* Visor opening — skin-coloured face window */}
        <rect x="45" y="25" width="30" height="24" rx="9" fill="url(#lg-skin)"/>
        {/* ── FACE ── */}
        {renderFace()}
        {/* Visor frame */}
        <rect x="45" y="25" width="30" height="24" rx="9" fill="none" stroke="#2D3A4A" strokeWidth="2.5"/>

        {/* ── PLUME ── */}
        <path d="M 62 14 Q 78 5 83 1 Q 78 -1 72 4 Q 76 7 64 14" fill="url(#lg-cape)"/>
        <path d="M 62 15 Q 77 7 82 3 Q 77 1 71 5 Q 75 8 63 15"  fill="#FF4444" opacity="0.4"/>

        {/* ── LEGO STUD (classic round bump on top of head) ── */}
        <ellipse cx="60" cy="15" rx="9.5" ry="6"   fill="url(#lg-armor)"/>
        <ellipse cx="60" cy="13.5" rx="7" ry="3.5" fill="rgba(255,255,255,0.21)"/>

        {/* ── NECK ── */}
        <rect x="52" y="52" width="16" height="12" rx="5" fill="url(#lg-skin)"/>
        <rect x="54" y="53" width="6"  height="5"  rx="2.5" fill="rgba(255,255,255,0.21)"/>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AI Image Knight — photorealistic with CSS mood animation
// ---------------------------------------------------------------------------
function KnightImage({ size, mood, className, style }) {
  const [imgErr, setImgErr] = useState(false);
  const stem = MOOD_IMAGE[mood] || 'knight-neutral';
  const src  = `/images/knights/${stem}.webp`;
  const anim = MOOD_ANIM[mood] || 'none';

  // confetti overlay for celebrating
  const showConfetti = mood === 'celebrating';
  const confettiColors = ['#D40030','#FFE070','#38bdf8','#16a34a','#a78bfa','#f59e0b'];

  if (imgErr) {
    // Image not generated yet — fall back to SVG
    return <KnightSVG size={size} mood={mood} className={className} style={style} />;
  }

  const imgW = size;
  const imgH = Math.round(size * 1.5);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: imgW,
        height: imgH,
        display: 'inline-block',
        animation: anim,
        transformOrigin: 'bottom center',
        ...style,
      }}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
    >
      <img
        src={src}
        alt={`Vitez — ${mood}`}
        onError={() => setImgErr(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          borderRadius: imgW < 60 ? '50%' : 12,
          display: 'block',
          filter: mood === 'sad'
            ? 'saturate(0.6) brightness(0.9)'
            : mood === 'celebrating'
            ? 'brightness(1.1) saturate(1.2)'
            : 'none',
        }}
      />

      {/* Celebrating: confetti overlay */}
      {showConfetti && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
          {confettiColors.map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${10 + (i * 13) % 60}%`,
              left: `${(i * 17) % 90}%`,
              width: 6, height: 4,
              background: c,
              borderRadius: 1,
              opacity: 0.85,
              transform: `rotate(${i * 37}deg)`,
              animation: `knightBounce ${0.8 + i * 0.15}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Thinking: question mark bubble */}
      {mood === 'thinking' && (
        <div style={{
          position: 'absolute', top: -4, right: -6,
          background: '#FFE070', color: '#1e3a5f',
          width: Math.max(16, imgW * 0.22), height: Math.max(16, imgW * 0.22),
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.max(10, imgW * 0.13), fontWeight: 900,
          boxShadow: '0 2px 6px rgba(0,0,0,.2)',
        }}>?</div>
      )}

      {/* Confused: double question mark */}
      {mood === 'confused' && (
        <div style={{
          position: 'absolute', top: -4, right: -6,
          background: '#f59e0b', color: 'white',
          width: Math.max(18, imgW * 0.25), height: Math.max(18, imgW * 0.25),
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.max(8, imgW * 0.11), fontWeight: 900,
          boxShadow: '0 2px 6px rgba(0,0,0,.2)',
        }}>??</div>
      )}

      {/* Ground shadow */}
      <div style={{
        position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: 6, borderRadius: '50%',
        background: 'rgba(0,0,0,0.18)', filter: 'blur(3px)',
      }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — Lego-style SVG knight
// ---------------------------------------------------------------------------
export default function CroatianKnight({ size = 80, mood = 'neutral', className = '', style = {} }) {
  return <KnightSVG size={size} mood={mood} className={className} style={style} />;
}
