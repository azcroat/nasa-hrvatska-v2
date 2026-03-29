import React, { useState } from 'react';
import { initPostHog } from '../../main.jsx';

const COOKIE_KEY = 'cookie_consent_v1';

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(COOKIE_KEY));

  if (!visible) return null;

  function acceptAll() {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    localStorage.setItem('cookieConsent', 'accepted');
    initPostHog();
    setVisible(false);
  }

  function essentialOnly() {
    localStorage.setItem(COOKIE_KEY, 'essential');
    localStorage.setItem('cookieConsent', 'essential');
    // PostHog is NOT initialized — analytics cookies declined
    setVisible(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0f172a', color: '#e2e8f0',
      padding: '16px 20px', display: 'flex', alignItems: 'center',
      gap: 16, flexWrap: 'wrap',
      boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
      fontFamily: "'Outfit', sans-serif",
    }} role="dialog" aria-label="Cookie consent">
      <div style={{ flex: 1, minWidth: 240, fontSize: 14, lineHeight: 1.5 }}>
        🍪 We use essential cookies for authentication and local progress saving.
        We also use PostHog analytics cookies to understand how the app is used.
        You can decline analytics while keeping essential functionality.{' '}
        <button
          onClick={() => window.open('/privacy', '_blank')}
          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: 14, padding: 0, textDecoration: 'underline' }}
        >
          Privacy Policy
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={essentialOnly} style={{
          padding: '8px 18px', borderRadius: 8, border: '1px solid #475569',
          background: 'transparent', color: '#94a3b8', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
        }}>Essential only</button>
        <button onClick={acceptAll} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none',
          background: '#0e7490', color: '#fff', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
        }}>Accept all</button>
      </div>
    </div>
  );
}
