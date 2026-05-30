import React from 'react';

export default function QuickReplyBanner({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 20,
        padding: '5px 12px',
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.88)',
        cursor: 'pointer',
        fontFamily: "'Outfit', sans-serif",
        transition: 'background .15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
      }}
    >
      {label}
    </button>
  );
}
