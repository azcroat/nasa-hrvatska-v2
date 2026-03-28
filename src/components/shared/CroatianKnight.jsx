import React, { useState, useEffect, useRef } from 'react';

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
// Full SVG fallback — the original hand-crafted knight, kept intact
// ---------------------------------------------------------------------------
function KnightSVG({ size, mood, className, style }) {
  const isCelebrating = mood === 'celebrating';
  const isConfused    = mood === 'confused';
  const isSad         = mood === 'sad';
  const isHappy       = mood === 'happy';
  const isThinking    = mood === 'thinking';
  const isEncouraged  = mood === 'encouraged';

  const confetti = [
    { x:8,  y:20, w:6, h:3.5, c:'#D40030', r:22  },
    { x:24, y:10, w:4, h:6,   c:'#FFE070', r:-16 },
    { x:75, y:14, w:6, h:3.5, c:'#38bdf8', r:32  },
    { x:92, y:26, w:3.5,h:6,  c:'#16a34a', r:-12 },
    { x:12, y:42, w:5, h:3,   c:'#38bdf8', r:48  },
    { x:96, y:44, w:3.5,h:5,  c:'#D40030', r:-38 },
    { x:5,  y:65, w:5, h:3,   c:'#FFE070', r:12  },
    { x:100,y:68, w:3.5,h:5,  c:'#16a34a', r:28  },
    { x:20, y:80, w:4, h:4,   c:'#a78bfa', r:-22 },
    { x:88, y:82, w:4, h:4,   c:'#f59e0b', r:18  },
  ];

  const renderEyes = () => {
    const ly = 36, ry = 36, lx = 50, rx = 66;
    switch (mood) {
      case 'happy':
        return (<>
          <path d={`M ${lx-4} ${ly} Q ${lx} ${ly-4} ${lx+4} ${ly}`} stroke="#1e3a5f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d={`M ${rx-4} ${ry} Q ${rx} ${ry-4} ${rx+4} ${ry}`} stroke="#1e3a5f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <circle cx={lx-2} cy={ly+2} r="1.5" fill="#f87171" opacity="0.45"/>
          <circle cx={rx+2} cy={ry+2} r="1.5" fill="#f87171" opacity="0.45"/>
        </>);
      case 'celebrating':
        return (<>
          <circle cx={lx} cy={ly} r="4" fill="#1e3a5f"/>
          <circle cx={rx} cy={ry} r="4" fill="#1e3a5f"/>
          <circle cx={lx+1.2} cy={ly-1.2} r="1.4" fill="white"/>
          <circle cx={rx+1.2} cy={ry-1.2} r="1.4" fill="white"/>
          <text x={lx-8} y={ly-4} fontSize="5" fill="#FFE070">★</text>
          <text x={rx+3} y={ry-4} fontSize="5" fill="#FFE070">★</text>
          <circle cx={lx-6} cy={ly+4} r="3" fill="#f87171" opacity="0.4"/>
          <circle cx={rx+6} cy={ry+4} r="3" fill="#f87171" opacity="0.4"/>
        </>);
      case 'sad':
        return (<>
          <path d={`M ${lx-4} ${ly-1} Q ${lx} ${ly+2} ${lx+4} ${ly+3}`} stroke="#1e3a5f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d={`M ${rx-4} ${ry+3} Q ${rx} ${ry+2} ${rx+4} ${ry-1}`} stroke="#1e3a5f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <ellipse cx={lx-1} cy={ly+6} rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.75"/>
        </>);
      case 'thinking':
        return (<>
          <circle cx={lx}   cy={ly} r="3.2" fill="#1e3a5f"/>
          <circle cx={rx}   cy={ry} r="4"   fill="#1e3a5f"/>
          <circle cx={lx+1} cy={ly-1.2} r="1.1" fill="white"/>
          <circle cx={rx+1.2} cy={ry-1.2} r="1.3" fill="white"/>
          <text x="72" y="30" fontSize="7" fill="#FFE070" fontWeight="900">?</text>
        </>);
      case 'encouraged':
        return (<>
          <circle cx={lx} cy={ly} r="3.2" fill="#1e3a5f"/>
          <circle cx={rx} cy={ry} r="3.2" fill="#1e3a5f"/>
          <circle cx={lx+1} cy={ly-1} r="1.1" fill="white"/>
          <circle cx={rx+1} cy={ry-1} r="1.1" fill="white"/>
          <rect x={lx-5} y={ly-8} width="9" height="2" rx="1" fill="#1e3a5f"/>
          <rect x={rx-5} y={ry-8} width="9" height="2" rx="1" fill="#1e3a5f"/>
          <path d={`M ${lx-4} ${ly+7} Q ${lx+8} ${ly+11} ${rx+4} ${ry+7}`} stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </>);
      case 'confused':
        return (<>
          <circle cx={lx}   cy={ly} r="2.5" fill="#1e3a5f"/>
          <circle cx={rx}   cy={ry} r="4"   fill="#1e3a5f"/>
          <circle cx={lx+0.8} cy={ly-0.8} r="0.9" fill="white"/>
          <circle cx={rx+1.2} cy={ry-1.2} r="1.4" fill="white"/>
          <path d={`M ${lx-3} ${ly+7} Q ${lx+4} ${ly+10} ${lx+8} ${ly+7} Q ${rx} ${ly+4} ${rx+4} ${ry+7}`} stroke="#1e3a5f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <text x="76" y="22" fontSize="8" fill="#FFE070" fontWeight="900">?</text>
        </>);
      default:
        return (<>
          <circle cx={lx}   cy={ly}   r="3.2" fill="#1e3a5f"/>
          <circle cx={rx}   cy={ry}   r="3.2" fill="#1e3a5f"/>
          <circle cx={lx+1} cy={ly-1} r="1.1" fill="white"/>
          <circle cx={rx+1} cy={ry-1} r="1.1" fill="white"/>
        </>);
    }
  };

  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
      transform={isConfused ? 'rotate(-5)' : undefined}
    >
      <defs>
        <linearGradient id="ck2-armor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c8d8ee"/>
          <stop offset="35%"  stopColor="#94b2cc"/>
          <stop offset="100%" stopColor="#5a7898"/>
        </linearGradient>
        <linearGradient id="ck2-armorDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#546880"/>
          <stop offset="100%" stopColor="#2a3848"/>
        </linearGradient>
        <linearGradient id="ck2-armorSheen" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%"   stopColor="#dceaf8" stopOpacity="0.8"/>
          <stop offset="60%"  stopColor="#a0bcd0" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#6080a0" stopOpacity="0.1"/>
        </linearGradient>
        <linearGradient id="ck2-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFE682"/>
          <stop offset="50%"  stopColor="#F4C430"/>
          <stop offset="100%" stopColor="#C8920A"/>
        </linearGradient>
        <linearGradient id="ck2-goldV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#FFE682"/>
          <stop offset="100%" stopColor="#B87800"/>
        </linearGradient>
        <linearGradient id="ck2-skin" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%"   stopColor="#ffd9b0"/>
          <stop offset="60%"  stopColor="#f0b880"/>
          <stop offset="100%" stopColor="#d89060"/>
        </linearGradient>
        <linearGradient id="ck2-plume" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ff4444"/>
          <stop offset="40%"  stopColor="#dc1414"/>
          <stop offset="100%" stopColor="#7f0000"/>
        </linearGradient>
        <linearGradient id="ck2-cape" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%"   stopColor="#8c1c1c"/>
          <stop offset="60%"  stopColor="#5c0c0c"/>
          <stop offset="100%" stopColor="#380808"/>
        </linearGradient>
        <linearGradient id="ck2-sword" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#d0d8e0"/>
          <stop offset="40%"  stopColor="#e8f0f8"/>
          <stop offset="100%" stopColor="#a0b0c0"/>
        </linearGradient>
        <linearGradient id="ck2-boot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2a2a3e"/>
          <stop offset="100%" stopColor="#14141e"/>
        </linearGradient>
        <clipPath id="ck2-shieldClip">
          <path d="M 5 64 L 5 92 Q 5 108 18 116 L 26 110 L 26 64 Z"/>
        </clipPath>
        <filter id="ck2-swordGlow" x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="ck2-drop" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>

      <ellipse cx="60" cy="156" rx="34" ry="4" fill="rgba(0,0,0,0.18)"/>

      {isCelebrating && confetti.map((p,i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="0.6"
          fill={p.c} opacity="0.9"
          transform={`rotate(${p.r} ${p.x+p.w/2} ${p.y+p.h/2})`}/>
      ))}

      <g filter="url(#ck2-drop)">
        <path d="M 32 58 Q 20 72 22 112 L 34 108 L 34 96 L 32 58" fill="url(#ck2-cape)"/>
        <path d="M 32 58 Q 21 72 22 112" stroke="url(#ck2-gold)" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M 88 58 Q 100 72 98 112 L 86 108 L 86 96 L 88 58" fill="url(#ck2-cape)"/>
        <path d="M 88 58 Q 99 72 98 112" stroke="url(#ck2-gold)" strokeWidth="1.5" fill="none" opacity="0.7"/>

        <rect x="34" y="104" width="18" height="36" rx="4" fill="url(#ck2-armor)"/>
        <rect x="36" y="104" width="7" height="36" rx="3.5" fill="url(#ck2-armorSheen)" opacity="0.6"/>
        <rect x="42.5" y="106" width="2.5" height="26" rx="1.2" fill="url(#ck2-gold)" opacity="0.65"/>
        <ellipse cx="43" cy="116" rx="10" ry="5" fill="url(#ck2-armorDark)"/>
        <circle cx="43" cy="116" r="2.5" fill="url(#ck2-gold)"/>
        <rect x="33" y="136" width="20" height="12" rx="3" fill="url(#ck2-boot)"/>
        <rect x="35" y="137" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
        <rect x="32" y="146" width="22" height="3" rx="1.5" fill="#0a0a14"/>

        <rect x="68" y="104" width="18" height="36" rx="4" fill="url(#ck2-armor)"/>
        <rect x="70" y="104" width="7" height="36" rx="3.5" fill="url(#ck2-armorSheen)" opacity="0.6"/>
        <rect x="76.5" y="106" width="2.5" height="26" rx="1.2" fill="url(#ck2-gold)" opacity="0.65"/>
        <ellipse cx="77" cy="116" rx="10" ry="5" fill="url(#ck2-armorDark)"/>
        <circle cx="77" cy="116" r="2.5" fill="url(#ck2-gold)"/>
        <rect x="67" y="136" width="20" height="12" rx="3" fill="url(#ck2-boot)"/>
        <rect x="69" y="137" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
        <rect x="66" y="146" width="22" height="3" rx="1.5" fill="#0a0a14"/>

        <path d="M 30 56 L 90 56 L 85 100 L 35 100 Z" fill="url(#ck2-armor)"/>
        <path d="M 32 56 L 62 56 L 58 100 L 36 100 Z" fill="url(#ck2-armorSheen)" opacity="0.5"/>
        <rect x="58.5" y="56" width="3" height="44" rx="1.5" fill="url(#ck2-goldV)" opacity="0.8"/>
        {[64,72,80,88,96].map((y,i) => (
          <line key={i} x1={30+i*1.2} y1={y} x2={90-i*1.2} y2={y} stroke="#4a6888" strokeWidth="0.9" opacity="0.45"/>
        ))}
        <circle cx="44" cy="68" r="1.8" fill="url(#ck2-gold)" opacity="0.8"/>
        <circle cx="44" cy="80" r="1.8" fill="url(#ck2-gold)" opacity="0.8"/>
        <circle cx="76" cy="68" r="1.8" fill="url(#ck2-gold)" opacity="0.8"/>
        <circle cx="76" cy="80" r="1.8" fill="url(#ck2-gold)" opacity="0.8"/>
        <g opacity="0.35">
          {[0,1,2].map(col=>[0,1,2].map(row=>(
            <rect key={`${col}-${row}`} x={53+col*5} y={68+row*5} width={5} height={5}
              fill={(col+row)%2===0?'#D40030':'white'} rx="0.3"/>
          )))}
        </g>

        <path d="M 22 52 Q 16 50 18 66 Q 20 72 30 70 L 30 52 Z" fill="url(#ck2-armor)"/>
        <path d="M 22 52 Q 16 50 18 66" stroke="url(#ck2-gold)" strokeWidth="1.5" fill="none"/>
        <ellipse cx="22" cy="60" rx="6" ry="3.5" fill="url(#ck2-armorSheen)" opacity="0.5"/>
        <path d="M 22 64 Q 16 64 18 72 Q 20 76 30 74" fill="url(#ck2-armorDark)" opacity="0.7"/>
        <path d="M 22 64 Q 16 64 18 72" stroke="url(#ck2-gold)" strokeWidth="1" fill="none" opacity="0.6"/>

        <path d="M 98 52 Q 104 50 102 66 Q 100 72 90 70 L 90 52 Z" fill="url(#ck2-armor)"/>
        <path d="M 98 52 Q 104 50 102 66" stroke="url(#ck2-gold)" strokeWidth="1.5" fill="none"/>
        <ellipse cx="98" cy="60" rx="6" ry="3.5" fill="url(#ck2-armorSheen)" opacity="0.5"/>
        <path d="M 98 64 Q 104 64 102 72 Q 100 76 90 74" fill="url(#ck2-armorDark)" opacity="0.7"/>
        <path d="M 98 64 Q 104 64 102 72" stroke="url(#ck2-gold)" strokeWidth="1" fill="none" opacity="0.6"/>

        <rect x="33" y="98" width="54" height="8" rx="2.5" fill="url(#ck2-armorDark)"/>
        <rect x="55" y="98" width="10" height="8" rx="2" fill="url(#ck2-armor)"/>
        <rect x="57.5" y="99.5" width="5" height="5" rx="1" fill="url(#ck2-gold)"/>
        <rect x="59" y="100.5" width="2" height="3" rx="0.5" fill="rgba(0,0,0,0.4)"/>
        <path d="M 33 104 Q 28 108 30 120 L 38 118 L 36 104 Z" fill="url(#ck2-armorDark)" opacity="0.8"/>
        <path d="M 87 104 Q 92 108 90 120 L 82 118 L 84 104 Z" fill="url(#ck2-armorDark)" opacity="0.8"/>

        <rect x="28" y="68" width="10" height="32" rx="4" fill="url(#ck2-armor)"/>
        <rect x="30" y="68" width="4" height="32" rx="2" fill="url(#ck2-armorSheen)" opacity="0.6"/>
        <path d="M 5 64 L 5 92 Q 5 108 18 116 L 26 110 L 26 64 Z"
          fill="#cc0020" stroke="url(#ck2-gold)" strokeWidth="2"/>
        <g clipPath="url(#ck2-shieldClip)">
          {[0,1].map(col=>[0,1,2,3].map(row=>(
            <rect key={`s-${col}-${row}`} x={5+col*10.5} y={66+row*11.5} width={10.5} height={11.5}
              fill={(col+row)%2===0?'#cc0020':'white'}/>
          )))}
        </g>
        <path d="M 5 64 L 5 92 Q 5 108 18 116 L 26 110 L 26 64 Z"
          fill="none" stroke="url(#ck2-gold)" strokeWidth="2"/>
        <circle cx="15.5" cy="88" r="5" fill="url(#ck2-gold)"/>
        <circle cx="15.5" cy="88" r="3" fill="#c8900a"/>
        <path d="M 8 66 Q 6 80 8 90" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none"/>

        <rect x="82" y="68" width="10" height="26" rx="4" fill="url(#ck2-armor)"/>
        <rect x="84" y="68" width="4" height="26" rx="2" fill="url(#ck2-armorSheen)" opacity="0.6"/>
        <path d="M 89 18 L 91 88 L 90 88 L 88 18 Z" fill="url(#ck2-sword)" filter="url(#ck2-swordGlow)"/>
        <line x1="89.8" y1="20" x2="89.8" y2="85" stroke="rgba(200,220,240,0.6)" strokeWidth="0.8"/>
        <path d="M 88 18 L 90.5 18 L 90.5 88 L 88 88 Z" fill="rgba(255,255,255,0.55)" opacity="0.7"/>
        <polygon points="88,18 91,18 89.5,8" fill="url(#ck2-sword)"/>
        <polygon points="89.3,8 90.2,8 89.5,4" fill="#c8d4e0"/>
        <rect x="80" y="76" width="20" height="6" rx="3" fill="url(#ck2-gold)"/>
        <rect x="80" y="76" width="20" height="2.5" rx="1.2" fill="#FFE682" opacity="0.5"/>
        <rect x="88" y="82" width="5" height="14" rx="2.5" fill="#7a3a10"/>
        {[84,87,90,93].map((y,i) => (
          <rect key={i} x="88" y={y} width="5" height="1.5" rx="0.75" fill="#5a2a08" opacity="0.6"/>
        ))}
        <ellipse cx="90.5" cy="98" rx="5.5" ry="4" fill="url(#ck2-gold)"/>
        <ellipse cx="90.5" cy="97.5" rx="3" ry="2" fill="#FFE682" opacity="0.5"/>

        <rect x="54" y="46" width="12" height="8" rx="2.5" fill="url(#ck2-skin)"/>
        <rect x="46" y="50" width="28" height="10" rx="4" fill="url(#ck2-armor)"/>
        <line x1="46" y1="54" x2="74" y2="54" stroke="#4a6888" strokeWidth="1" opacity="0.5"/>
        <rect x="46" y="50" width="28" height="2.5" rx="1.2" fill="url(#ck2-gold)" opacity="0.85"/>
        <rect x="46" y="58" width="28" height="2" rx="1" fill="url(#ck2-gold)" opacity="0.65"/>

        <ellipse cx="60" cy="34" rx="15" ry="16" fill="url(#ck2-skin)"/>
        <path d="M 44 34 Q 42 14 60 12 Q 78 14 76 34" fill="url(#ck2-armor)"/>
        <path d="M 46 34 Q 45 16 60 14 Q 70 15 73 28" fill="url(#ck2-armorSheen)" opacity="0.55"/>

        <rect x="40" y="28" width="9" height="16" rx="4" fill="url(#ck2-armor)"/>
        <rect x="71" y="28" width="9" height="16" rx="4" fill="url(#ck2-armor)"/>
        <circle cx="44" cy="32" r="1.2" fill="url(#ck2-gold)" opacity="0.7"/>
        <circle cx="76" cy="32" r="1.2" fill="url(#ck2-gold)" opacity="0.7"/>

        <rect x="40" y="27" width="40" height="4" rx="2" fill="url(#ck2-gold)"/>
        <rect x="40" y="27" width="40" height="1.5" rx="0.75" fill="#FFE682" opacity="0.6"/>
        <rect x="58.5" y="28" width="3" height="16" rx="1.5" fill="url(#ck2-armorDark)" opacity="0.8"/>

        <rect x="41" y="28" width="38" height="13" rx="4" fill="url(#ck2-armorDark)"/>
        <rect x="42" y="29" width="16" height="5" rx="2.5" fill="rgba(255,255,255,0.07)"/>
        <rect x="42" y="33" width="13" height="4" rx="2" fill="rgba(0,0,0,0.82)"/>
        <rect x="59" y="33" width="13" height="4" rx="2" fill="rgba(0,0,0,0.82)"/>
        {[44.5,47,49.5,52].map((x,i) => (
          <line key={i} x1={x} y1={33} x2={x} y2={37} stroke="rgba(80,100,120,0.5)" strokeWidth="0.6"/>
        ))}
        {[61.5,64,66.5,69].map((x,i) => (
          <line key={i} x1={x} y1={33} x2={x} y2={37} stroke="rgba(80,100,120,0.5)" strokeWidth="0.6"/>
        ))}

        {renderEyes()}

        {[46,50,54,58,62,66,70].map((x,i) => (
          <circle key={i} cx={x} cy="40" r="0.9" fill="rgba(0,0,0,0.6)"/>
        ))}

        <rect x="57" y="10" width="6" height="5" rx="1.5" fill="url(#ck2-armorDark)"/>
        <path d="M 63 14 Q 80 8 84 3 Q 80 0 74 4 Q 78 6 68 14" fill="url(#ck2-plume)" stroke="#7f0000" strokeWidth="0.6"/>
        <path d="M 62 15 Q 78 10 83 5 Q 79 3 73 6 Q 77 8 66 15" fill="#ff3333" opacity="0.45"/>
        <rect x="57.5" y="10" width="5" height="18" rx="2.5" fill="url(#ck2-armor)"/>
        <rect x="58.5" y="10" width="2" height="18" rx="1" fill="url(#ck2-armorSheen)" opacity="0.7"/>
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
// Main export — tries AI image first, falls back to SVG
// ---------------------------------------------------------------------------
export default function CroatianKnight({ size = 80, mood = 'neutral', className = '', style = {} }) {
  const [useAI, setUseAI] = useState(true);

  // Check if any knight images have been generated
  useEffect(() => {
    const img = new Image();
    img.onload  = () => setUseAI(true);
    img.onerror = () => setUseAI(false);
    img.src = '/images/knights/knight-neutral.webp';
  }, []);

  if (useAI) {
    return <KnightImage size={size} mood={mood} className={className} style={style} />;
  }
  return <KnightSVG size={size} mood={mood} className={className} style={style} />;
}
