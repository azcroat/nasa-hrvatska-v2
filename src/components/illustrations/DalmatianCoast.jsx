import React from 'react';

export default function DalmatianCoast({ width = 320, height = 180, className = '', style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style} role="img" aria-label="Dalmatian coast illustration">

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

      {/* Wave patterns */}
      <path d="M 0 100 Q 40 95 80 100 Q 120 105 160 100 Q 200 95 240 100 Q 280 105 320 100"
        stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
      <path d="M 0 115 Q 50 110 100 115 Q 150 120 200 115 Q 250 110 320 115"
        stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none"/>
      <path d="M 0 130 Q 60 125 120 130 Q 180 135 240 130 Q 280 127 320 130"
        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/>

      {/* Distant island/headland */}
      <ellipse cx="240" cy="90" rx="40" ry="12" fill="#6b8f3a" opacity="0.7"/>
      <ellipse cx="240" cy="90" rx="38" ry="10" fill="#5a7a30"/>

      {/* Shoreline / promenade */}
      <path d="M 0 90 L 60 85 L 120 88 L 160 82 L 200 86 L 240 80 L 260 84 L 280 82 L 320 85 L 320 100 L 0 100 Z"
        fill="#f5f0e8"/>

      {/* Stone wall / promenade edge */}
      <rect x="0" y="97" width="320" height="8" fill="#d4c9b0" rx="2"/>
      <path d="M 0 98 Q 80 96 160 98 Q 240 100 320 98" stroke="#c4b89f" strokeWidth="1" fill="none"/>

      {/* Building cluster 1 */}
      <rect x="10" y="55" width="25" height="35" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="10,55 22.5,42 35,55" fill="#c2410c"/>
      <rect x="18" y="68" width="8" height="12" fill="#87CEEB" opacity="0.7"/>

      <rect x="38" y="60" width="22" height="30" fill="#fff8f0" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="38,60 49,48 60,60" fill="#b61800"/>
      <rect x="45" y="72" width="8" height="10" fill="#87CEEB" opacity="0.7"/>

      <rect x="63" y="52" width="30" height="38" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="63,52 78,38 93,52" fill="#c2410c"/>
      <rect x="70" y="65" width="10" height="14" fill="#87CEEB" opacity="0.6"/>
      <rect x="83" y="68" width="6" height="10" fill="#87CEEB" opacity="0.6"/>

      {/* Bell tower */}
      <rect x="95" y="40" width="16" height="50" fill="#fff8f0" stroke="#d4c9b0" strokeWidth="0.5"/>
      <rect x="93" y="36" width="20" height="8" fill="#d4c9b0"/>
      <polygon points="93,36 103,24 113,36" fill="#c2410c"/>
      <circle cx="103" cy="52" r="3" fill="#FDB813" opacity="0.8"/>

      {/* Building cluster 2 */}
      <rect x="115" y="62" width="20" height="28" fill="#fff0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="115,62 125,52 135,62" fill="#b61800"/>
      <rect x="138" y="58" width="24" height="32" fill="#f5f0e8" stroke="#d4c9b0" strokeWidth="0.5"/>
      <polygon points="138,58 150,46 162,58" fill="#c2410c"/>

      {/* Cypress trees */}
      <ellipse cx="170" cy="70" rx="5" ry="18" fill="#2d6a4f"/>
      <ellipse cx="183" cy="72" rx="4" ry="16" fill="#2d6a4f" opacity="0.9"/>

      {/* Olive trees */}
      <circle cx="195" cy="77" r="10" fill="#6b8f3a"/>
      <circle cx="193" cy="75" r="8" fill="#5a7a30"/>
      <rect x="194" y="82" width="3" height="8" fill="#5c4033"/>

      <circle cx="210" cy="79" r="8" fill="#6b8f3a"/>
      <rect x="209" y="84" width="3" height="6" fill="#5c4033"/>

      {/* Sailboat on water */}
      <path d="M 270 108 L 265 92 L 280 108 Z" fill="white" stroke="#d4c9b0" strokeWidth="0.5"/>
      <path d="M 270 108 L 275 93 L 285 108 Z" fill="#b61800" opacity="0.85" stroke="#7f1d1d" strokeWidth="0.5"/>
      <rect x="268" y="92" width="2" height="24" fill="#5c4033"/>
      <path d="M 258 116 Q 272 112 286 116 L 283 120 Q 270 118 257 120 Z" fill="white" stroke="#c4b89f" strokeWidth="0.5"/>

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
