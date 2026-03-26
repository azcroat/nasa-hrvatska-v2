import React from 'react';

export default function DalmatianCoast({ width = 320, height = 180, className = '', style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style} role="img" aria-label="Dalmatian coast illustration">

      <style>{`
        @keyframes dcBob {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-4px) rotate(0.5deg); }
        }
        @keyframes dcWave {
          0%, 100% { transform: scaleX(1) translateX(0px); }
          50% { transform: scaleX(1.015) translateX(-1px); }
        }
      `}</style>

      <defs>
        <linearGradient id="dc-skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB"/>
          <stop offset="100%" stopColor="#B0E2FF"/>
        </linearGradient>
        <linearGradient id="dc-seaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284c7"/>
          <stop offset="100%" stopColor="#164e63"/>
        </linearGradient>
        <radialGradient id="dc-sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF3B0" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#FFF3B0" stopOpacity="0"/>
        </radialGradient>
        <filter id="dc-boatBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
        <filter id="dc-shadowBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5"/>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="320" height="90" fill="url(#dc-skyGrad)"/>

      {/* Sun glow */}
      <circle cx="260" cy="35" r="34" fill="url(#dc-sunGlow)"/>
      {/* Sun */}
      <circle cx="260" cy="35" r="22" fill="#FDB813" opacity="0.9"/>
      {/* Sun rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
        <line key={i}
          x1={260 + Math.cos(angle * Math.PI / 180) * 26}
          y1={35 + Math.sin(angle * Math.PI / 180) * 26}
          x2={260 + Math.cos(angle * Math.PI / 180) * 36}
          y2={35 + Math.sin(angle * Math.PI / 180) * 36}
          stroke="#FDB813" strokeWidth="2" opacity="0.6"
        />
      ))}

      {/* Sea */}
      <rect y="90" width="320" height="90" fill="url(#dc-seaGrad)"/>

      {/* Wave patterns — slightly varied amplitude */}
      <g style={{ animation: 'dcWave 5s ease-in-out infinite' }}>
        <path d="M 0 100 Q 30 94 80 100 Q 120 106 160 100 Q 205 94 240 100 Q 285 107 320 100"
          stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
        <path d="M 0 115 Q 55 109 100 115 Q 148 122 200 115 Q 255 109 320 115"
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none"/>
        <path d="M 0 130 Q 65 124 120 130 Q 182 137 240 130 Q 275 126 320 130"
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/>
        <path d="M 0 143 Q 70 139 140 143 Q 200 148 260 143 Q 290 140 320 143"
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"/>
      </g>

      {/* Distant island/headland */}
      <ellipse cx="240" cy="90" rx="40" ry="12" fill="#6b8f3a" opacity="0.7"/>
      <ellipse cx="240" cy="90" rx="38" ry="10" fill="#5a7a30"/>

      {/* Shoreline / promenade */}
      <path d="M 0 90 L 60 85 L 120 88 L 160 82 L 200 86 L 240 80 L 260 84 L 280 82 L 320 85 L 320 100 L 0 100 Z"
        fill="#f5f0e8"/>

      {/* Stone wall / promenade edge — with mortar lines for block texture */}
      <rect x="0" y="97" width="320" height="8" fill="#d4c9b0" rx="2"/>
      {/* Horizontal mortar lines */}
      <line x1="0" y1="99.5" x2="320" y2="99.5" stroke="#c0b49a" strokeWidth="0.6" opacity="0.7"/>
      <line x1="0" y1="101.5" x2="320" y2="101.5" stroke="#c0b49a" strokeWidth="0.6" opacity="0.6"/>
      <line x1="0" y1="103.5" x2="320" y2="103.5" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      {/* Vertical joints — staggered to suggest stone blocks */}
      <line x1="45" y1="97" x2="45" y2="105" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      <line x1="90" y1="99" x2="90" y2="105" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      <line x1="135" y1="97" x2="135" y2="101" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      <line x1="180" y1="99" x2="180" y2="105" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      <line x1="225" y1="97" x2="225" y2="103" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>
      <line x1="270" y1="99" x2="270" y2="105" stroke="#c0b49a" strokeWidth="0.6" opacity="0.5"/>

      {/* ── Building cluster 1 ── */}

      {/* Drop shadow — building 1 */}
      <ellipse cx="25" cy="91" rx="13" ry="3" fill="rgba(60,40,20,0.18)" filter="url(#dc-shadowBlur)"/>
      {/* Building 1 */}
      <rect x="10" y="55" width="25" height="35" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      {/* Roof 3D edge (right side parallelogram sliver) */}
      <polygon points="35,55 38,52 38,55" fill="#9a2f08" opacity="0.7"/>
      {/* Roof */}
      <polygon points="10,55 22.5,42 35,55" fill="#c2410c"/>
      {/* Window with sill */}
      <rect x="18" y="68" width="8" height="12" fill="#87CEEB" opacity="0.7"/>
      <rect x="17" y="80" width="10" height="1.5" fill="#c4b89f"/>
      {/* Chimney pot */}
      <rect x="27" y="47" width="3" height="4" fill="#b84a20" rx="0.5"/>
      <rect x="26.5" y="45.5" width="4" height="1.5" fill="#c2410c" rx="0.5"/>

      {/* Drop shadow — building 2 */}
      <ellipse cx="49" cy="91" rx="12" ry="2.5" fill="rgba(60,40,20,0.15)" filter="url(#dc-shadowBlur)"/>
      {/* Building 2 */}
      <rect x="38" y="60" width="22" height="30" fill="#fff8f0" stroke="#d4c9b0" strokeWidth="0.5"/>
      {/* Roof 3D edge */}
      <polygon points="60,60 63,57 63,60" fill="#8a1200" opacity="0.7"/>
      {/* Roof */}
      <polygon points="38,60 49,48 60,60" fill="#b61800"/>
      {/* Window with sill */}
      <rect x="45" y="72" width="8" height="10" fill="#87CEEB" opacity="0.7"/>
      <rect x="44" y="82" width="10" height="1.5" fill="#c4b89f"/>

      {/* Drop shadow — building 3 */}
      <ellipse cx="78" cy="91" rx="16" ry="3" fill="rgba(60,40,20,0.18)" filter="url(#dc-shadowBlur)"/>
      {/* Building 3 */}
      <rect x="63" y="52" width="30" height="38" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      {/* Roof 3D edge */}
      <polygon points="93,52 96,49 96,52" fill="#9a2f08" opacity="0.7"/>
      {/* Roof */}
      <polygon points="63,52 78,38 93,52" fill="#c2410c"/>
      {/* Windows with sills */}
      <rect x="70" y="65" width="10" height="14" fill="#87CEEB" opacity="0.6"/>
      <rect x="69" y="79" width="12" height="1.5" fill="#c4b89f"/>
      <rect x="83" y="68" width="6" height="10" fill="#87CEEB" opacity="0.6"/>
      <rect x="82" y="78" width="8" height="1.5" fill="#c4b89f"/>
      {/* Chimney pots */}
      <rect x="69" y="43" width="3" height="5" fill="#b84a20" rx="0.5"/>
      <rect x="68.5" y="41.5" width="4" height="1.5" fill="#c2410c" rx="0.5"/>
      <rect x="82" y="44" width="3" height="4" fill="#b84a20" rx="0.5"/>
      <rect x="81.5" y="42.5" width="4" height="1.5" fill="#c2410c" rx="0.5"/>

      {/* ── Bell tower ── */}

      {/* Ground shadow for bell tower */}
      <polygon points="95,97 111,97 118,100 88,100" fill="rgba(40,20,10,0.18)" filter="url(#dc-shadowBlur)"/>
      {/* Drop shadow ellipse */}
      <ellipse cx="103" cy="92" rx="12" ry="2.5" fill="rgba(60,40,20,0.2)" filter="url(#dc-shadowBlur)"/>

      <rect x="95" y="40" width="16" height="50" fill="#fff8f0" stroke="#d4c9b0" strokeWidth="0.5"/>
      <rect x="93" y="36" width="20" height="8" fill="#d4c9b0"/>
      {/* Roof 3D edge */}
      <polygon points="113,36 116,33 116,36" fill="#8a1200" opacity="0.7"/>
      <polygon points="93,36 103,24 113,36" fill="#c2410c"/>

      {/* Clock face — proper with tick marks and hands */}
      <circle cx="103" cy="52" r="5" fill="white" stroke="#c4b89f" strokeWidth="0.8" opacity="0.95"/>
      {/* 4 tick marks at 12/3/6/9 */}
      <line x1="103" y1="47.4" x2="103" y2="48.8" stroke="#555" strokeWidth="0.8"/> {/* 12 */}
      <line x1="107.6" y1="52" x2="106.2" y2="52" stroke="#555" strokeWidth="0.8"/> {/* 3 */}
      <line x1="103" y1="56.6" x2="103" y2="55.2" stroke="#555" strokeWidth="0.8"/> {/* 6 */}
      <line x1="98.4" y1="52" x2="99.8" y2="52" stroke="#555" strokeWidth="0.8"/> {/* 9 */}
      {/* Hour hand pointing ~10 o'clock */}
      <line x1="103" y1="52" x2="101.2" y2="49.2" stroke="#333" strokeWidth="0.9" strokeLinecap="round"/>
      {/* Minute hand pointing ~2 o'clock */}
      <line x1="103" y1="52" x2="105.4" y2="49.6" stroke="#333" strokeWidth="0.6" strokeLinecap="round"/>

      {/* ── Building cluster 2 ── */}

      <ellipse cx="125" cy="91" rx="11" ry="2.5" fill="rgba(60,40,20,0.15)" filter="url(#dc-shadowBlur)"/>
      <rect x="115" y="62" width="20" height="28" fill="#fff0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="115,62 125,52 135,62" fill="#b61800"/>
      <polygon points="135,62 138,59 138,62" fill="#8a1200" opacity="0.7"/>

      <ellipse cx="150" cy="91" rx="13" ry="2.5" fill="rgba(60,40,20,0.15)" filter="url(#dc-shadowBlur)"/>
      <rect x="138" y="58" width="24" height="32" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="138,58 150,46 162,58" fill="#c2410c"/>
      <polygon points="162,58 165,55 165,58" fill="#9a2f08" opacity="0.7"/>

      {/* ── Cypress trees — varied width, 2-layer volume ── */}

      {/* Cypress 1 */}
      <ellipse cx="170" cy="70" rx="5" ry="18" fill="#1a4d38"/>
      <ellipse cx="170" cy="68" rx="3.5" ry="14" fill="#2d6a4f" opacity="0.9"/>

      {/* Cypress 2 — slightly narrower, shorter */}
      <ellipse cx="183" cy="72" rx="4.2" ry="16" fill="#1a4d38"/>
      <ellipse cx="183" cy="70" rx="3" ry="12" fill="#3a7a5e" opacity="0.85"/>

      {/* Cypress 3 — a bit taller and wider */}
      <ellipse cx="176" cy="66" rx="4.8" ry="19" fill="#1e5540"/>
      <ellipse cx="176" cy="64" rx="3.2" ry="14.5" fill="#2d6a4f" opacity="0.8"/>

      {/* ── Olive trees — cloud-like multi-circle canopy ── */}

      {/* Olive tree 1 */}
      {/* Trunk */}
      <polygon points="193,89 195,82 197,82 198,89" fill="#6b4c2a"/>
      {/* Canopy — 4 overlapping circles */}
      <circle cx="195" cy="78" r="7.5" fill="#5a7a30"/>
      <circle cx="190" cy="76" r="6" fill="#6b8f3a"/>
      <circle cx="200" cy="76" r="5.5" fill="#6b8f3a"/>
      <circle cx="195" cy="73" r="5" fill="#7ba040"/>

      {/* Olive tree 2 */}
      <polygon points="209,89 211,84 213,84 214,89" fill="#6b4c2a"/>
      <circle cx="211" cy="80" r="6.5" fill="#5a7a30"/>
      <circle cx="207" cy="78" r="5" fill="#6b8f3a"/>
      <circle cx="215" cy="78" r="5" fill="#6b8f3a"/>
      <circle cx="211" cy="76" r="4.5" fill="#7ba040"/>

      {/* ── Sailboat — with curved sail, Croatian flag ── */}
      <g style={{ animation: 'dcBob 3.5s ease-in-out infinite', transformOrigin: 'center 70%' }}>

        {/* Water reflection — boat shape flipped, low opacity, blurred */}
        <g opacity="0.22" filter="url(#dc-boatBlur)" transform="translate(0, 234) scale(1, -1)">
          <path d="M 270 108 L 265 92 L 280 108 Z" fill="white"/>
          <path d="M 270 108 L 275 93 L 285 108 Z" fill="#b61800"/>
          <path d="M 258 116 Q 272 112 286 116 L 283 120 Q 270 118 257 120 Z" fill="white"/>
        </g>

        {/* Mast */}
        <rect x="268" y="92" width="2" height="24" fill="#5c4033"/>

        {/* Main sail — curved trailing edge (billowing effect) */}
        <path d="M 270 108 Q 268 100 265 92 Q 275 97 280 108 Z"
          fill="white" stroke="#d4c9b0" strokeWidth="0.5"/>

        {/* Jib / secondary sail */}
        <path d="M 270 108 Q 277 100 275 93 Q 282 99 285 108 Z"
          fill="#b61800" opacity="0.85" stroke="#7f1d1d" strokeWidth="0.5"/>

        {/* Hull */}
        <path d="M 258 116 Q 272 112 286 116 L 283 120 Q 270 118 257 120 Z"
          fill="white" stroke="#c4b89f" strokeWidth="0.5"/>

        {/* Croatian flag on mast top — 3 stripe mini rect */}
        <rect x="270" y="91" width="9" height="2.1" fill="#D40030"/>
        <rect x="270" y="93.1" width="9" height="2.1" fill="white"/>
        <rect x="270" y="95.2" width="9" height="2.1" fill="#003087"/>
      </g>

      {/* Water reflections near boat */}
      <path d="M 265 122 Q 272 120 280 122" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
      <path d="M 260 128 Q 270 126 282 128" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>

      {/* Foreground flowers/lavender */}
      {[5, 20, 305, 315].map((x, i) => (
        <g key={i}>
          <rect x={x} y={86} width={1.5} height={8} fill="#5a7a30"/>
          <circle cx={x + 0.75} cy={83} r={3} fill="#7c3aed" opacity={0.8}/>
        </g>
      ))}

      {/* Seagulls */}
      <path d="M 220 45 Q 225 42 230 45" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 235 38 Q 239 35 243 38" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 248 50 Q 252 47 256 50" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
