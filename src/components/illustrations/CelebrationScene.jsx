import React from 'react';

export default function CelebrationScene({ width = 280, height = 160, message = 'Odlično!', className = '', style = {} }) {
  const w = width, h = height;
  const cx = w * 0.5;
  const cy = h * 0.42;

  const confetti = [
    // Original 15 — updated colors and added diamond shapes
    { x: w*0.05,  y: h*0.15, r: -15, color: '#D40030', shape: 'rect' },
    { x: w*0.12,  y: h*0.08, r: 30,  color: '#f59e0b', shape: 'circle' },
    { x: w*0.22,  y: h*0.22, r: -25, color: '#003087', shape: 'rect' },
    { x: w*0.32,  y: h*0.06, r: 45,  color: '#a78bfa', shape: 'diamond' },
    { x: w*0.42,  y: h*0.12, r: -10, color: '#16a34a', shape: 'circle' },
    { x: w*0.52,  y: h*0.04, r: 20,  color: '#D40030', shape: 'rect' },
    { x: w*0.62,  y: h*0.18, r: -35, color: '#f59e0b', shape: 'diamond' },
    { x: w*0.72,  y: h*0.08, r: 15,  color: '#38bdf8', shape: 'circle' },
    { x: w*0.82,  y: h*0.22, r: -20, color: '#a78bfa', shape: 'rect' },
    { x: w*0.92,  y: h*0.1,  r: 10,  color: '#16a34a', shape: 'rect' },
    { x: w*0.88,  y: h*0.35, r: -15, color: '#D40030', shape: 'circle' },
    { x: w*0.95,  y: h*0.28, r: 25,  color: '#f59e0b', shape: 'diamond' },
    { x: w*0.18,  y: h*0.45, r: -30, color: '#38bdf8', shape: 'rect' },
    { x: w*0.78,  y: h*0.42, r: 40,  color: '#003087', shape: 'circle' },
    { x: w*0.48,  y: h*0.48, r: -5,  color: '#16a34a', shape: 'rect' },
    // 10 additional pieces for 25 total
    { x: w*0.02,  y: h*0.35, r: 55,  color: '#FFFFFF', shape: 'diamond' },
    { x: w*0.08,  y: h*0.52, r: -40, color: '#38bdf8', shape: 'rect' },
    { x: w*0.28,  y: h*0.55, r: 20,  color: '#D40030', shape: 'circle' },
    { x: w*0.38,  y: h*0.02, r: -60, color: '#003087', shape: 'diamond' },
    { x: w*0.58,  y: h*0.5,  r: 35,  color: '#a78bfa', shape: 'rect' },
    { x: w*0.68,  y: h*0.55, r: -25, color: '#f59e0b', shape: 'circle' },
    { x: w*0.75,  y: h*0.03, r: 50,  color: '#16a34a', shape: 'diamond' },
    { x: w*0.85,  y: h*0.5,  r: -45, color: '#FFFFFF', shape: 'rect' },
    { x: w*0.97,  y: h*0.45, r: 15,  color: '#38bdf8', shape: 'diamond' },
    { x: w*0.15,  y: h*0.02, r: -20, color: '#D40030', shape: 'circle' },
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
        <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE070" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#C8980A" />
        </linearGradient>
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
        if (c.shape === 'circle') {
          return (
            <g key={i} style={{ animation: `csDrop ${duration}s ${delay}s ease-in infinite` }}>
              <circle cx={c.x} cy={c.y} r={4} fill={c.color} opacity={0.85}/>
            </g>
          );
        } else if (c.shape === 'diamond') {
          return (
            <g key={i} style={{ animation: `csDrop ${duration}s ${delay}s ease-in infinite` }}>
              <rect
                x={c.x - 2.5} y={c.y - 2.5}
                width={5} height={5}
                fill={c.color} opacity={0.85}
                transform={`translate(${c.x},${c.y}) rotate(45) translate(${-c.x},${-c.y})`}
              />
            </g>
          );
        } else {
          return (
            <g key={i} style={{ animation: `csDrop ${duration}s ${delay}s ease-in infinite` }}>
              <rect
                x={c.x - 5} y={c.y - 3}
                width={10} height={6}
                fill={c.color}
                transform={`rotate(${c.r} ${c.x} ${c.y})`}
                opacity={0.85}
              />
            </g>
          );
        }
      })}

      {/* Trophy group */}
      <g style={{ animation: 'csTrophy 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>

        {/* Star burst rays behind trophy */}
        {Array.from({length: 10}).map((_, i) => {
          const angle = (i * 36) * Math.PI / 180;
          return <line key={i}
            x1={cx} y1={cy - 15}
            x2={cx + Math.cos(angle) * 58} y2={(cy - 15) + Math.sin(angle) * 58}
            stroke="rgba(251,191,36,0.38)" strokeWidth={3}
            style={{ animation: `csBurst 1.2s ease ${(i * 0.05).toFixed(2)}s both` }}
          />;
        })}

        {/* Trophy cup body — wider, more shaped */}
        <path d={`M ${cx-22} ${cy+10} Q ${cx-28} ${cy-15} ${cx-18} ${cy-28} L ${cx+18} ${cy-28} Q ${cx+28} ${cy-15} ${cx+22} ${cy+10} Z`}
          fill="url(#trophyGold)" stroke="#C8980A" strokeWidth="1.5" />
        {/* Trophy handles */}
        <path d={`M ${cx-22} ${cy} Q ${cx-36} ${cy} ${cx-34} ${cy+8} Q ${cx-32} ${cy+14} ${cx-20} ${cy+12}`}
          fill="none" stroke="#C8980A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${cx+22} ${cy} Q ${cx+36} ${cy} ${cx+34} ${cy+8} Q ${cx+32} ${cy+14} ${cx+20} ${cy+12}`}
          fill="none" stroke="#C8980A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Trophy base */}
        <rect x={cx-14} y={cy+10} width={28} height={6} rx={2} fill="url(#trophyGold)" />
        <rect x={cx-10} y={cy+16} width={20} height={4} rx={2} fill="#C8980A" />
        {/* Star inside trophy */}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize={14}>⭐</text>
      </g>

      {/* Message text */}
      <text x={w*0.5} y={h*0.9} fontSize={Math.max(16, h*0.13)} fontWeight="900" textAnchor="middle"
        fill="#0f172a" fontFamily="Playfair Display,serif">{message}</text>

      {/* Firework bursts */}
      {[{cx:w*0.15,cy:h*0.6},{cx:w*0.85,cy:h*0.65}].map((fw, i) => (
        <g key={i} style={{ animation: `csBurst 0.6s ${i === 0 ? '0s' : '0.2s'} ease-out forwards` }}>
          {[0,45,90,135,180,225,270,315].map((angle, j) => (
            <line key={j}
              x1={fw.cx} y1={fw.cy}
              x2={fw.cx + Math.cos(angle * Math.PI / 180) * h * 0.08}
              y2={fw.cy + Math.sin(angle * Math.PI / 180) * h * 0.08}
              stroke={['#fbbf24','#D40030','#003087','#a78bfa'][j % 4]}
              strokeWidth="1.5" strokeLinecap="round"
            />
          ))}
          <circle cx={fw.cx} cy={fw.cy} r="3" fill="#fbbf24"/>
        </g>
      ))}
    </svg>
  );
}
