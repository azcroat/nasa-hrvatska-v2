/**
 * CroatianGrb — Croatian coat of arms (šahovnica)
 *
 * Heater shield shape, 5×5 checkerboard white-first (standard grb orientation),
 * Croatian red (#D40030) and white, gold border, drop shadow.
 *
 * Usage: <CroatianGrb size={120} />
 * Height is auto-proportioned (size = width).
 */
export default function CroatianGrb({ size = 120, style = {}, className = '' }) {
  // viewBox: 100 wide × 118 tall (heater shield proportions)
  const VW = 100, VH = 118;

  // Shield paths (all coordinates within viewBox)
  // Outer gold border
  const outer = "M2,2 L98,2 L98,76 Q98,116 50,118 Q2,116 2,76 Z";
  // Inner white field (inset 3px)
  const inner = "M5,2 L95,2 L95,75 Q95,113 50,115 Q5,113 5,75 Z";

  // Checkerboard: 5 columns × 5 rows, clipped to inner shield
  // x: 5–95 (90px wide), y: 2–115 (113px tall)
  const cW = 90 / 5;   // 18
  const cH = 113 / 5;  // 22.6

  const height = Math.round(size * VH / VW);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={size}
      height={height}
      style={{ display: 'block', ...style }}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Grb Hrvatske — Croatian coat of arms"
      role="img"
    >
      <defs>
        <clipPath id="grb-clip">
          <path d={inner} />
        </clipPath>
        <linearGradient id="grb-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE070" />
          <stop offset="50%"  stopColor="#C8980A" />
          <stop offset="100%" stopColor="#7A5800" />
        </linearGradient>
      </defs>

      {/* Drop shadow */}
      <path d={outer} fill="rgba(0,0,0,0.35)" transform="translate(3,5)" />

      {/* Gold border */}
      <path d={outer} fill="url(#grb-gold)" />

      {/* White field */}
      <path d={inner} fill="#F8F6F2" />

      {/* 5×5 šahovnica clipped to shield — white top-left */}
      <g clipPath="url(#grb-clip)">
        {[0,1,2,3,4].flatMap(r =>
          [0,1,2,3,4].map(c => (
            <rect
              key={`${r}-${c}`}
              x={5 + c * cW}
              y={2 + r * cH}
              width={cW + 0.4}
              height={cH + 0.4}
              fill={(r + c) % 2 === 0 ? '#F8F6F2' : '#D40030'}
            />
          ))
        )}
      </g>

      {/* Gold outline */}
      <path d={outer} fill="none" stroke="url(#grb-gold)" strokeWidth="2" />
      {/* Inner highlight */}
      <path d={inner} fill="none" stroke="rgba(255,240,120,0.4)" strokeWidth="1" />
    </svg>
  );
}
