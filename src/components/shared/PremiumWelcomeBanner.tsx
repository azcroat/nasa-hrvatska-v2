import React, { useState } from 'react';

const FEATURES = [
  { icon: '🤖', label: 'AI Conversation Tutor' },
  { icon: '🎙️', label: 'Live 1-on-1 Tutor (Marija)' },
  { icon: '📊', label: 'Personalized Grammar Diagnosis' },
  { icon: '📷', label: 'Photo Vocabulary Scanner' },
  { icon: '💡', label: 'Adaptive Learning Insights' },
  { icon: '📚', label: 'Full lesson library + SRS review' },
];

/**
 * One-time post-sign-in banner that surfaces the value of their free Premium access.
 * Users who don't understand what they have, don't use it.
 * Shown once per device, guarded by localStorage.
 */
export default function PremiumWelcomeBanner({ onClose }) {
  const [visible, setVisible] = useState(true);

  function dismiss() {
    setVisible(false);
    localStorage.setItem('nh_premium_welcome_shown', '1');
    if (onClose) onClose();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome — your Premium access is active"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99995,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: 24,
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,.3)',
          overflow: 'hidden',
          animation: 'celebPop .4s cubic-bezier(.34,1.56,.64,1) forwards',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
            padding: '28px 24px 20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,.2)',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              width: 28,
              height: 28,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🇭🇷</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
            You have full Premium access — free!
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>
            Every feature is unlocked for you. Here's what you get:
          </div>
        </div>

        {/* Features list */}
        <div style={{ padding: '16px 24px' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'var(--bar-bg)',
                  border: '1px solid var(--card-b)',
                }}
              >
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--heading)',
                    lineHeight: 1.3,
                  }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--subtext)',
              textAlign: 'center',
              padding: '8px 12px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 8,
              marginBottom: 14,
              fontWeight: 500,
            }}
          >
            Your access renews automatically each year. No credit card required.
          </div>

          <button
            onClick={dismiss}
            className="b bp"
            style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 800 }}
          >
            Start Exploring →
          </button>
        </div>
      </div>
    </div>
  );
}
