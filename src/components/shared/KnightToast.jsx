/**
 * KnightToast — listens for the `knight:celebrate` custom event fired by
 * useAward whenever significant XP is earned, then shows an animated
 * full-screen overlay with the celebrating knight + message for 2.5 seconds.
 *
 * Fully self-contained: no props, no parent state needed.
 */
import React, { useState, useEffect, useCallback } from 'react';
import CroatianKnight from './CroatianKnight.jsx';

export default function KnightToast() {
  const [visible, setVisible]   = useState(false);
  const [message, setMessage]   = useState('');
  const [mood,    setMood]      = useState('celebrating');
  const timerRef = React.useRef(null);

  const show = useCallback((detail) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(detail?.text || 'Sjajno!');
    setMood(detail?.mood || 'celebrating');
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  useEffect(() => {
    function handler(e) { show(e.detail); }
    window.addEventListener('knight:celebrate', handler);
    return () => {
      window.removeEventListener('knight:celebrate', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed',
        bottom: 80,              // above tab bar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9800,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'linear-gradient(135deg, #0c4a6e, #0e7490)',
        border: '1.5px solid rgba(255,255,255,.2)',
        borderRadius: 22,
        padding: '12px 20px 12px 14px',
        boxShadow: '0 12px 40px rgba(0,0,0,.35)',
        animation: 'slideUp .35s cubic-bezier(.22,.68,0,1.3)',
        cursor: 'pointer',
        maxWidth: 'calc(100vw - 48px)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <CroatianKnight size={54} mood={mood} style={{ flexShrink: 0 }} />
      <div>
        <div style={{
          fontSize: 15, fontWeight: 900, color: 'white',
          fontFamily: "'Outfit', sans-serif",
          whiteSpace: 'nowrap',
        }}>{message}</div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,.6)',
          fontWeight: 600, marginTop: 1,
        }}>Tap to dismiss</div>
      </div>
    </div>
  );
}
