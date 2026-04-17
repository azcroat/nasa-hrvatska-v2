import React from 'react';

// Renders tip text, turning "📚 See: Topic Name" into a styled pill badge
export default function TipContent({ tip }) {
  if (!tip) return null;
  const parts = tip.split(/(📚 See:[^.!?]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('📚 See:')) {
          const label = part.replace('📚 See:', '').trim();
          return (
            <span
              key={i}
              title={`Grammar reference: ${label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(14,116,144,0.10)',
                border: '1px solid rgba(14,116,144,0.28)',
                borderRadius: 20,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#0e7490',
                marginLeft: 4,
                verticalAlign: 'middle',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              📚 {label}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
