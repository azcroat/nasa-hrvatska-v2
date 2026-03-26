import React from 'react';

// Topic-specific scene illustrations
function FoodScene({ w, h }) {
  return (
    <>
      {/* Table */}
      <rect x={w*0.1} y={h*0.55} width={w*0.8} height={h*0.08} rx="4" fill="#8B4513"/>
      <rect x={w*0.15} y={h*0.63} width={w*0.1} height={h*0.25} fill="#6B3310"/>
      <rect x={w*0.75} y={h*0.63} width={w*0.1} height={h*0.25} fill="#6B3310"/>
      {/* Tablecloth */}
      <rect x={w*0.12} y={h*0.5} width={w*0.76} height={h*0.06} rx="3" fill="#fff" opacity="0.9"/>
      {/* Plate */}
      <ellipse cx={w*0.5} cy={h*0.48} rx={w*0.15} ry={h*0.08} fill="white" stroke="#ddd" strokeWidth="1"/>
      <ellipse cx={w*0.5} cy={h*0.46} rx={w*0.12} ry={h*0.06} fill="#fde68a"/>
      {/* Peka (Croatian baking dish) */}
      <ellipse cx={w*0.5} cy={h*0.46} rx={w*0.1} ry={h*0.05} fill="#c2410c" opacity="0.9"/>
      {/* Steam wisps */}
      <path d={`M ${w*0.45} ${h*0.38} Q ${w*0.43} ${h*0.3} ${w*0.45} ${h*0.22}`} stroke="rgba(200,200,200,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.5} ${h*0.36} Q ${w*0.52} ${h*0.28} ${w*0.5} ${h*0.2}`} stroke="rgba(200,200,200,0.6)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.55} ${h*0.38} Q ${w*0.57} ${h*0.3} ${w*0.55} ${h*0.22}`} stroke="rgba(200,200,200,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Wine glass */}
      <path d={`M ${w*0.28} ${h*0.38} L ${w*0.25} ${h*0.5} L ${w*0.31} ${h*0.5} Z`} fill="#b61800" opacity="0.8"/>
      <rect x={w*0.277} y={h*0.5} width={w*0.006} height={h*0.1} fill="#999"/>
      <ellipse cx={w*0.28} cy={h*0.6} rx={w*0.025} ry={h*0.008} fill="#ccc"/>
      {/* Bread */}
      <ellipse cx={w*0.72} cy={h*0.49} rx={w*0.08} ry={h*0.04} fill="#D4A055"/>
      <path d={`M ${w*0.65} ${h*0.49} Q ${w*0.72} ${h*0.43} ${w*0.79} ${h*0.49}`} stroke="#b8860b" strokeWidth="1.5" fill="none"/>
      {/* Olive branch decoration */}
      <path d={`M ${w*0.1} ${h*0.15} Q ${w*0.2} ${h*0.1} ${w*0.3} ${h*0.18}`} stroke="#5a7a30" strokeWidth="2" fill="none"/>
      {[0.12, 0.18, 0.24].map((x, i) => (
        <ellipse key={i} cx={w*x} cy={h*(0.13 + i*0.02)} rx={w*0.025} ry={h*0.018} fill="#5a7a30"
          transform={`rotate(${-20 + i*10} ${w*x} ${h*(0.13+i*0.02)})`}/>
      ))}
      {[0.14, 0.2, 0.27].map((x, i) => (
        <circle key={i} cx={w*x} cy={h*(0.12 + i*0.015)} r={w*0.008} fill="#2d6a4f"/>
      ))}
    </>
  );
}

function FamilyScene({ w, h }) {
  const people = [
    { x: w*0.2,  scale: 0.7, color: '#8B6914' },
    { x: w*0.38, scale: 0.9, color: '#1e3a5f' },
    { x: w*0.55, scale: 0.85, color: '#9b2335' },
    { x: w*0.72, scale: 0.6, color: '#0e7490' },
  ];
  return (
    <>
      {/* Ground/floor */}
      <rect x={0} y={h*0.75} width={w} height={h*0.25} fill="#f5f0e8"/>
      <path d={`M 0 ${h*0.75} Q ${w*0.5} ${h*0.72} ${w} ${h*0.75}`} fill="#e8dfd0"/>
      {/* People silhouettes */}
      {people.map((p, i) => {
        const hs = p.scale;
        const bodyH = h * 0.35 * hs;
        const headR = w * 0.04 * hs;
        const bodyY = h * 0.75 - bodyH;
        const headY = bodyY - headR * 2.2;
        return (
          <g key={i}>
            <rect x={p.x - w*0.04*hs} y={bodyY} width={w*0.08*hs} height={bodyH} rx={w*0.03*hs} fill={p.color}/>
            <circle cx={p.x} cy={headY + headR} r={headR} fill="#d4a574"/>
            <line x1={p.x - w*0.04*hs} y1={bodyY + bodyH*0.25} x2={p.x - w*0.07*hs} y2={bodyY + bodyH*0.15}
              stroke={p.color} strokeWidth={w*0.012*hs} strokeLinecap="round"/>
            <line x1={p.x + w*0.04*hs} y1={bodyY + bodyH*0.25} x2={p.x + w*0.07*hs} y2={bodyY + bodyH*0.15}
              stroke={p.color} strokeWidth={w*0.012*hs} strokeLinecap="round"/>
          </g>
        );
      })}
      {/* Croatian flag */}
      <rect x={w*0.82} y={h*0.15} width={w*0.14} height={h*0.09} fill="#b61800"/>
      <rect x={w*0.82} y={h*0.18} width={w*0.14} height={h*0.03} fill="white"/>
      <rect x={w*0.82} y={h*0.21} width={w*0.14} height={h*0.03} fill="#0284c7"/>
      <rect x={w*0.815} y={h*0.14} width={w*0.004} height={h*0.45} fill="#5c4033"/>
      {/* Hearts */}
      {[w*0.3, w*0.5, w*0.65].map((x, i) => (
        <text key={i} x={x} y={h*0.2} fontSize={h*0.06} textAnchor="middle" opacity={0.6 + i*0.1}>❤️</text>
      ))}
    </>
  );
}

function TravelScene({ w, h }) {
  return (
    <>
      {/* Sky */}
      <rect width={w} height={h*0.6} fill="#87CEEB"/>
      {/* Clouds */}
      <ellipse cx={w*0.25} cy={h*0.15} rx={w*0.12} ry={h*0.06} fill="white" opacity="0.9"/>
      <ellipse cx={w*0.35} cy={h*0.12} rx={w*0.1} ry={h*0.05} fill="white"/>
      {/* Road */}
      <path d={`M ${w*0.4} ${h} L ${w*0.45} ${h*0.55} L ${w*0.6} ${h*0.55} L ${w*0.65} ${h}`} fill="#888"/>
      <path d={`M ${w*0.5} ${h} L ${w*0.52} ${h*0.6} L ${w*0.53} ${h*0.6} L ${w*0.51} ${h}`} fill="#fbbf24" opacity="0.8"/>
      {/* Mountains */}
      <polygon points={`0,${h*0.6} ${w*0.2},${h*0.25} ${w*0.4},${h*0.6}`} fill="#4a7c59"/>
      <polygon points={`${w*0.25},${h*0.6} ${w*0.5},${h*0.2} ${w*0.75},${h*0.6}`} fill="#5a8f6a"/>
      <polygon points={`${w*0.6},${h*0.6} ${w*0.8},${h*0.3} ${w},${h*0.6}`} fill="#4a7c59"/>
      {/* Snow caps */}
      <polygon points={`${w*0.17},${h*0.32} ${w*0.2},${h*0.25} ${w*0.23},${h*0.32}`} fill="white" opacity="0.9"/>
      <polygon points={`${w*0.46},${h*0.27} ${w*0.5},${h*0.2} ${w*0.54},${h*0.27}`} fill="white" opacity="0.9"/>
      {/* Ground */}
      <rect x={0} y={h*0.6} width={w} height={h*0.4} fill="#c8e6c9"/>
      {/* Suitcase */}
      <rect x={w*0.1} y={h*0.65} width={w*0.15} height={h*0.2} rx="4" fill="#c2410c"/>
      <rect x={w*0.155} y={h*0.62} width={w*0.04} height={h*0.04} rx="2" fill="#a33510" stroke="#fbbf24" strokeWidth="1.5"/>
      <rect x={w*0.11} y={h*0.74} width={w*0.13} height={h*0.02} fill="#a33510"/>
      <circle cx={w*0.125} cy={h*0.87} r={w*0.015} fill="#333"/>
      <circle cx={w*0.225} cy={h*0.87} r={w*0.015} fill="#333"/>
      {/* Map */}
      <rect x={w*0.65} y={h*0.65} width={w*0.2} height={h*0.15} rx="3" fill="#fde68a" stroke="#d4a055" strokeWidth="1"/>
      <path d={`M ${w*0.7} ${h*0.7} Q ${w*0.75} ${h*0.67} ${w*0.8} ${h*0.72}`} stroke="#b61800" strokeWidth="1.5" fill="none"/>
      <circle cx={w*0.76} cy={h*0.73} r={w*0.012} fill="#b61800"/>
    </>
  );
}

function GreetingScene({ w, h }) {
  return (
    <>
      <style>{`
        @keyframes gsPopIn {
          0% { transform: scale(0); opacity: 0; transform-origin: bottom left; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gsFade {
          0% { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Background - café terrace */}
      <rect width={w} height={h} fill="#fff8f0"/>
      <rect x={0} y={h*0.7} width={w} height={h*0.3} fill="#f5f0e8"/>
      {/* Café table */}
      <ellipse cx={w*0.5} cy={h*0.65} rx={w*0.2} ry={h*0.05} fill="#8B4513"/>
      <rect x={w*0.48} y={h*0.65} width={w*0.04} height={h*0.25} fill="#6B3310"/>
      {/* Coffee cups */}
      <ellipse cx={w*0.4} cy={h*0.61} rx={w*0.055} ry={h*0.04} fill="white" stroke="#ddd" strokeWidth="1"/>
      <ellipse cx={w*0.4} cy={h*0.59} rx={w*0.04} ry={h*0.027} fill="#8B4513"/>
      <ellipse cx={w*0.6} cy={h*0.61} rx={w*0.055} ry={h*0.04} fill="white" stroke="#ddd" strokeWidth="1"/>
      <ellipse cx={w*0.6} cy={h*0.59} rx={w*0.04} ry={h*0.027} fill="#8B4513"/>
      {/* Speech bubbles */}
      <g style={{ animation: 'gsPopIn 0.35s 0.15s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <rect x={w*0.05} y={h*0.1} width={w*0.35} height={h*0.18} rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <path d={`M ${w*0.15} ${h*0.28} L ${w*0.12} ${h*0.35} L ${w*0.22} ${h*0.28}`} fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <text x={w*0.22} y={h*0.2} textAnchor="middle" fontSize={h*0.07} fontWeight="700" fill="#0e7490" fontFamily="Playfair Display,serif">Bog!</text>
        <text x={w*0.22} y={h*0.27} textAnchor="middle" fontSize={h*0.042} fill="#5c6370">Hello / Goodbye</text>
      </g>
      <g style={{ animation: 'gsPopIn 0.35s 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <rect x={w*0.6} y={h*0.1} width={w*0.35} height={h*0.18} rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <path d={`M ${w*0.85} ${h*0.28} L ${w*0.88} ${h*0.35} L ${w*0.78} ${h*0.28}`} fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <text x={w*0.775} y={h*0.2} textAnchor="middle" fontSize={h*0.055} fontWeight="700" fill="#b61800" fontFamily="Playfair Display,serif">Hvala!</text>
        <text x={w*0.775} y={h*0.27} textAnchor="middle" fontSize={h*0.042} fill="#5c6370">Thank you</text>
      </g>
    </>
  );
}

const SCENE_MAP = {
  food: FoodScene,
  family: FamilyScene,
  travel: TravelScene,
  greetings: GreetingScene,
  default: GreetingScene,
};

export default function VocabScene({ topic = 'default', width = 280, height = 180, className = '', style = {} }) {
  const Scene = SCENE_MAP[topic] || SCENE_MAP.default;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style}
      role="img" aria-label={`${topic} vocabulary illustration`}>
      <Scene w={width} h={height} />
    </svg>
  );
}
