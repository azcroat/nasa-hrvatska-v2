import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#16a34a', border: '#15803d' },
    error:   { bg: '#dc2626', border: '#b91c1c' },
    info:    { bg: '#0e7490', border: '#0c6780' },
  };
  const c = colors[type] || colors.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={onClose}
      style={{
        position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
        zIndex: 99990, background: c.bg, color: '#fff',
        borderRadius: 'var(--radius-xl)', padding: '12px 20px',
        fontSize: 'var(--text-sm)', fontWeight: 700,
        boxShadow: '0 8px 32px rgba(0,0,0,.3)',
        animation: 'slideUp .35s cubic-bezier(.34,1.56,.64,1) both',
        whiteSpace: 'nowrap', cursor: 'pointer', maxWidth: 'calc(100vw - 32px)',
        border: `1px solid ${c.border}`,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : 'ℹ '}{message}
    </div>
  );
}
