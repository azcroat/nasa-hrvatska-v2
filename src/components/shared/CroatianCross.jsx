import { useMemo } from 'react';

/**
 * CroatianCross — pre-Romanesque Croatian medieval cross (starohrvatski križ)
 * Greek cross, double-ribbon arms, circular centre medallion with 8-pointed star.
 * Based on 9th–11th century Croatian stone carving tradition (pleter/interlace style).
 * Usage: <CroatianCross size={148} />
 */
export default function CroatianCross({ size = 148, style = {}, className = '' }) {
  const id = useMemo(() => 'mc' + Math.random().toString(36).slice(2, 7), []);

  // Arms span: 82–118 (36px wide), full 200×200 viewBox
  // Inner rails at 91 and 109 create two ribbon channels per arm
  const C = 'rgba(255,235,155,';  // warm ivory-gold colour prefix

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible', ...style }}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Starohrvatski križ"
      role="img"
    >
      <defs>
        {/* Glow for primary strokes */}
        <filter id={`${id}g`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        {/* Softer glow for medallion */}
        <filter id={`${id}s`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* ── OUTER CROSS SHAPE ── */}
      <path
        d="M2,82 L82,82 L82,2 L118,2 L118,82 L198,82 L198,118 L118,118 L118,198 L82,198 L82,118 L2,118 Z"
        fill={`${C}0.07)`}
        stroke={`${C}0.90)`}
        strokeWidth="2.5"
        strokeLinejoin="miter"
        filter={`url(#${id}g)`}
      />

      {/* ── INNER RAILS — horizontal arm ── */}
      {/* Left segment */}
      <line x1="2"   y1="91"  x2="82"  y2="91"  stroke={`${C}0.55)`} strokeWidth="1.2"/>
      <line x1="2"   y1="109" x2="82"  y2="109" stroke={`${C}0.55)`} strokeWidth="1.2"/>
      {/* Right segment */}
      <line x1="118" y1="91"  x2="198" y2="91"  stroke={`${C}0.55)`} strokeWidth="1.2"/>
      <line x1="118" y1="109" x2="198" y2="109" stroke={`${C}0.55)`} strokeWidth="1.2"/>

      {/* ── INNER RAILS — vertical arm ── */}
      {/* Top segment */}
      <line x1="91"  y1="2"   x2="91"  y2="82"  stroke={`${C}0.55)`} strokeWidth="1.2"/>
      <line x1="109" y1="2"   x2="109" y2="82"  stroke={`${C}0.55)`} strokeWidth="1.2"/>
      {/* Bottom segment */}
      <line x1="91"  y1="118" x2="91"  y2="198" stroke={`${C}0.55)`} strokeWidth="1.2"/>
      <line x1="109" y1="118" x2="109" y2="198" stroke={`${C}0.55)`} strokeWidth="1.2"/>

      {/* ── RAILS THROUGH CENTRE SQUARE (faded) ── */}
      <line x1="82"  y1="91"  x2="118" y2="91"  stroke={`${C}0.38)`} strokeWidth="1.2"/>
      <line x1="82"  y1="109" x2="118" y2="109" stroke={`${C}0.38)`} strokeWidth="1.2"/>
      <line x1="91"  y1="82"  x2="91"  y2="118" stroke={`${C}0.38)`} strokeWidth="1.2"/>
      <line x1="109" y1="82"  x2="109" y2="118" stroke={`${C}0.38)`} strokeWidth="1.2"/>

      {/* ── RAIL–BOUNDARY JUNCTION NODES ── */}
      {/* Small circles where inner rails meet the cross outer boundary */}
      {[
        [82,91],[82,109],[118,91],[118,109],
        [91,82],[109,82],[91,118],[109,118],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3"
          fill={`${C}0.30)`}
          stroke={`${C}0.82)`}
          strokeWidth="1.2"
        />
      ))}

      {/* ── CENTRE MEDALLION ── */}
      {/* Outer ring */}
      <circle cx="100" cy="100" r="28"
        fill={`${C}0.06)`}
        stroke={`${C}0.90)`}
        strokeWidth="2.5"
        filter={`url(#${id}s)`}
      />
      {/* Inner ring */}
      <circle cx="100" cy="100" r="17"
        fill="none"
        stroke={`${C}0.50)`}
        strokeWidth="1.2"
      />

      {/* ── 8-POINTED STAR inside medallion ── */}
      {/* Cardinal spokes (0°, 90°, 180°, 270°) */}
      <line x1="83"  y1="100" x2="117" y2="100" stroke={`${C}0.50)`} strokeWidth="1.2"/>
      <line x1="100" y1="83"  x2="100" y2="117" stroke={`${C}0.50)`} strokeWidth="1.2"/>
      {/* Diagonal spokes (45°) — slightly fainter */}
      <line x1="88"  y1="88"  x2="112" y2="112" stroke={`${C}0.35)`} strokeWidth="1.1"/>
      <line x1="112" y1="88"  x2="88"  y2="112" stroke={`${C}0.35)`} strokeWidth="1.1"/>

      {/* ── CENTRE DOT ── */}
      <circle cx="100" cy="100" r="4.5"
        fill={`${C}0.50)`}
        stroke={`${C}0.92)`}
        strokeWidth="1.5"
      />

      {/* ── ARM TERMINAL NODES ── */}
      {/* Small ornamental circles at each arm tip */}
      {[
        [100, 2], [100, 198], [2, 100], [198, 100],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5"
          fill={`${C}0.22)`}
          stroke={`${C}0.90)`}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
