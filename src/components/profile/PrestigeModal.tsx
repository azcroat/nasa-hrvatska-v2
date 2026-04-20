import React from 'react';

export default function PrestigeModal({ onClose, onConfirm }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 24,
          padding: '32px 24px',
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 12 }}>✦</div>
        <div
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 900,
            color: 'var(--heading)',
            marginBottom: 8,
          }}
        >
          Prestige?
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--subtext)',
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          Your XP will reset to 0, but you'll earn a permanent ✦ Prestige badge. Your lessons,
          streak, and vocabulary remain. This is a mark of honour.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1.5px solid var(--inp-b)',
              background: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--subtext)',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg,var(--lavender, #7c3aed),#4c1d95)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              color: 'var(--card)',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            ✦ Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
