import React from 'react';

export default function HeartsBar({ hearts = 5, max = 5 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }} aria-label={`${hearts} of ${max} hearts remaining`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 18,
            filter: i < hearts ? 'none' : 'grayscale(1) opacity(0.35)',
            transition: 'filter 0.3s ease',
            animation: i === hearts ? 'fade-out-quick 0.4s ease both' : 'none',
          }}
          aria-hidden="true"
        >
          ❤️
        </span>
      ))}
    </div>
  );
}
