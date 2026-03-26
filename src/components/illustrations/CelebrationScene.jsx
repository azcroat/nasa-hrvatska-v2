import React from 'react';

export default function CelebrationScene({ width = 280, height = 160, message = 'Odlično!', className = '', style = {} }) {
  const w = width, h = height;

  const confetti = [
    { x: w*0.1,  y: h*0.2,  r: -15, color: '#b61800', shape: 'rect' },
    { x: w*0.2,  y: h*0.1,  r: 30,  color: '#fbbf24', shape: 'circle' },
    { x: w*0.3,  y: h*0.25, r: -25, color: '#0e7490', shape: 'rect' },
    { x: w*0.4,  y: h*0.08, r: 45,  color: '#7c3aed', shape: 'rect' },
    { x: w*0.5,  y: h*0.15, r: -10, color: '#16a34a', shape: 'circle' },
    { x: w*0.6,  y: h*0.05, r: 20,  color: '#b61800', shape: 'rect' },
    { x: w*0.7,  y: h*0.2,  r: -35, color: '#fbbf24', shape: 'rect' },
    { x: w*0.8,  y: h*0.12, r: 15,  color: '#0e7490', shape: 'circle' },
    { x: w*0.9,  y: h*0.25, r: -20, color: '#7c3aed', shape: 'rect' },
    { x: w*0.15, y: h*0.4,  r: 10,  color: '#16a34a', shape: 'rect' },
    { x: w*0.85, y: h*0.35, r: -15, color: '#b61800', shape: 'circle' },
    { x: w*0.45, y: h*0.35, r: 25,  color: '#fbbf24', shape: 'rect' },
    { x: w*0.25, y: h*0.5,  r: -30, color: '#0e7490', shape: 'rect' },
    { x: w*0.75, y: h*0.45, r: 40,  color: '#7c3aed', shape: 'circle' },
    { x: w*0.55, y: h*0.5,  r: -5,  color: '#16a34a', shape: 'rect' },
  ];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} style={style}
      role="img" aria-label="Celebration illustration">

      <style>{`
        @keyframes csDrop {
          0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(${Math.round(h * 0.7)}px) rotate(720deg); opacity: 0; }
        }
        @keyframes csTrophy {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes csBurst {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 0.85; transform: scale(1); }
        }
      `}</style>

      <defs>
        <radialGradient id="cs-celebGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Background glow */}
      <ellipse cx={w*0.5} cy={h*0.5} rx={w*0.45} ry={h*0.4} fill="url(#cs-celebGlow)"/>

      {/* Stars */}
      {[{x:w*0.08,y:h*0.6,s:16},{x:w*0.92,y:h*0.55,s:20},{x:w*0.5,y:h*0.88,s:18}].map((star, i) => (
        <text key={i} x={star.x} y={star.y} fontSize={star.s} textAnchor="middle">⭐</text>
      ))}

      {/* Confetti */}
      {confetti.map((c, i) => {
        const delay = (i * 0.07).toFixed(2);
        const duration = (1.6 + (i % 7) * 0.1).toFixed(1);
        return c.shape === 'rect' ? (
          <g key={i} style={{ animation: `csDrop ${duration}s ${delay}s ease-in infinite` }}>
            <rect
              x={c.x - 5} y={c.y - 3}
              width={10} height={6}
              fill={c.color}
              transform={`rotate(${c.r} ${c.x} ${c.y})`}
              opacity={0.85}
            />
          </g>
        ) : (
          <g key={i} style={{ animation: `csDrop ${duration}s ${delay}s ease-in infinite` }}>
            <circle cx={c.x} cy={c.y} r={4} fill={c.color} opacity={0.85}/>
          </g>
        );
      })}

      {/* Trophy cup */}
      <g style={{ animation: 'csTrophy 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <path d={`M ${w*0.4} ${h*0.35} L ${w*0.38} ${h*0.2} L ${w*0.62} ${h*0.2} L ${w*0.6} ${h*0.35}`} fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
        <ellipse cx={w*0.5} cy={h*0.35} rx={w*0.1} ry={h*0.06} fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
        {/* Trophy handles */}
        <path d={`M ${w*0.38} ${h*0.23} Q ${w*0.32} ${h*0.23} ${w*0.32} ${h*0.3} Q ${w*0.32} ${h*0.37} ${w*0.38} ${h*0.35}`}
          stroke="#d97706" strokeWidth="2" fill="none"/>
        <path d={`M ${w*0.62} ${h*0.23} Q ${w*0.68} ${h*0.23} ${w*0.68} ${h*0.3} Q ${w*0.68} ${h*0.37} ${w*0.62} ${h*0.35}`}
          stroke="#d97706" strokeWidth="2" fill="none"/>
        {/* Trophy stem */}
        <rect x={w*0.47} y={h*0.41} width={w*0.06} height={h*0.12} fill="#d97706"/>
        <rect x={w*0.41} y={h*0.53} width={w*0.18} height={h*0.04} rx="3" fill="#d97706"/>
        {/* Star on trophy */}
        <text x={w*0.5} y={h*0.31} fontSize={h*0.09} textAnchor="middle">⭐</text>
      </g>

      {/* Message text */}
      <text x={w*0.5} y={h*0.75} fontSize={Math.max(16, h*0.13)} fontWeight="900" textAnchor="middle"
        fill="#0f172a" fontFamily="Playfair Display,serif">{message}</text>

      {/* Firework bursts */}
      {[{cx:w*0.15,cy:h*0.6},{cx:w*0.85,cy:h*0.65}].map((fw, i) => (
        <g key={i} style={{ animation: `csBurst 0.6s ${i === 0 ? '0s' : '0.2s'} ease-out forwards` }}>
          {[0,45,90,135,180,225,270,315].map((angle, j) => (
            <line key={j}
              x1={fw.cx} y1={fw.cy}
              x2={fw.cx + Math.cos(angle * Math.PI / 180) * h * 0.08}
              y2={fw.cy + Math.sin(angle * Math.PI / 180) * h * 0.08}
              stroke={['#fbbf24','#b61800','#0e7490','#7c3aed'][j % 4]}
              strokeWidth="1.5" strokeLinecap="round"
            />
          ))}
          <circle cx={fw.cx} cy={fw.cy} r="3" fill="#fbbf24"/>
        </g>
      ))}
    </svg>
  );
}
