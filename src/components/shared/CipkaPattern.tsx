import React from 'react';

/**
 * CipkaPattern — Croatian lace-inspired SVG decorative divider
 * Based on the geometric patterns of Pag lace (UNESCO Intangible Heritage)
 */
export default function CipkaPattern({
  color = 'currentColor',
  opacity = 0.15,
  height = 24,
  style = {}
}) {
  return (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, ...style }}>
      <svg
        viewBox="0 0 400 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height, display: 'block' }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Lace border line */}
        <line x1="0" y1="12" x2="400" y2="12" stroke={color} strokeWidth="0.5" opacity={opacity} />

        {/* Repeating geometric lace pattern — diamond shapes */}
        {Array.from({length: 20}).map((_, i) => {
          const x = i * 20 + 10;
          return (
            <g key={i} transform={`translate(${x}, 12)`} opacity={opacity}>
              {/* Diamond */}
              <polygon
                points="0,-6 5,0 0,6 -5,0"
                fill="none"
                stroke={color}
                strokeWidth="0.8"
              />
              {/* Inner diamond */}
              <polygon
                points="0,-3 2.5,0 0,3 -2.5,0"
                fill={color}
                opacity="0.6"
              />
              {/* Corner dots */}
              <circle cx="0" cy="-8" r="0.8" fill={color} />
              <circle cx="0" cy="8" r="0.8" fill={color} />
            </g>
          );
        })}

        {/* Connecting threads between diamonds */}
        {Array.from({length: 19}).map((_, i) => {
          const x1 = i * 20 + 15;
          const x2 = i * 20 + 25;
          return (
            <line key={`t${i}`} x1={x1} y1="12" x2={x2} y2="12"
              stroke={color} strokeWidth="0.4" opacity={opacity * 0.7} />
          );
        })}
      </svg>
    </div>
  );
}
