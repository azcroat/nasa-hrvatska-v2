import { useMemo } from 'react';
import { rnd } from '../../lib/random.js';

/**
 * CroatianGrb — Croatian šahovnica shield
 * Heater shield, 5×5 checkerboard, white top-left, red/white, gold border.
 * Usage: <CroatianGrb size={120} />
 */
export default function CroatianGrb({ size = 120, style = {}, className = '' }) {
  // Unique ID per instance so clipPath never clashes when used multiple times
  const id = useMemo(() => 'g' + rnd().toString(36).slice(2, 7), []);

  // viewBox 100×124 — shield fully inside with 4px padding all round
  // Shield outer: x=4–96, y=4–120 (bottom curves to point at y=120)
  const shield = `M4,4 L96,4 L96,78 Q96,120 50,122 Q4,120 4,78 Z`;
  const inner  = `M7,4 L93,4 L93,77 Q93,117 50,119 Q7,117 7,77 Z`;

  const cW = 86 / 5;   // cell width  (x: 7–93 = 86px)
  const cH = 115 / 5;  // cell height (y: 4–119 = 115px)

  return (
    <svg
      viewBox="0 0 100 124"
      width={size}
      height={Math.round(size * 124 / 100)}
      style={{ display: 'block', overflow: 'visible', ...style }}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Grb Hrvatske"
      role="img"
    >
      <defs>
        <clipPath id={`${id}c`}>
          <path d={inner} />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE070" />
          <stop offset="50%"  stopColor="#C8980A" />
          <stop offset="100%" stopColor="#7A5800" />
        </linearGradient>
      </defs>

      {/* Gold border */}
      <path d={shield} fill={`url(#${id}g)`} />

      {/* 5×5 šahovnica clipped to inner shield — white top-left */}
      <g clipPath={`url(#${id}c)`}>
        {[0,1,2,3,4].flatMap(r =>
          [0,1,2,3,4].map(c => (
            <rect
              key={`${r}-${c}`}
              x={7 + c * cW}
              y={4 + r * cH}
              width={cW + 0.5}
              height={cH + 0.5}
              fill={(r + c) % 2 === 0 ? '#F8F6F2' : '#D40030'}
            />
          ))
        )}
      </g>

      {/* Gold outline on top */}
      <path d={shield} fill="none" stroke={`url(#${id}g)`} strokeWidth="2" />
    </svg>
  );
}
