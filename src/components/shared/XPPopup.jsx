import React, { useState, useEffect } from 'react';

function XPPopup({ showXP, xpA }) {
  const alreadyEarned = xpA === 0;

  const [displayAmt, setDisplayAmt] = useState(0);

  useEffect(() => {
    if (!showXP || xpA <= 0) return;
    let start = null;
    const duration = 600;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2); // ease-out quad
      setDisplayAmt(Math.floor(eased * xpA));
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayAmt(xpA);
    };
    requestAnimationFrame(animate);
  }, [showXP, xpA]);

  if (!showXP) return null;

  if (alreadyEarned) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Already earned XP today"
        style={{
          position: 'fixed',
          top: 72,
          right: 16,
          zIndex: 99000,
          background: 'rgba(71,85,105,0.92)',
          backdropFilter: 'blur(12px)',
          color: '#e2e8f0',
          padding: '10px 16px',
          borderRadius: 14,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideIn .3s cubic-bezier(.34,1.56,.64,1)',
          pointerEvents: 'none',
          maxWidth: 200,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        ✅ Max XP earned today
      </div>
    );
  }

  // 6 sparkle positions at 45° increments around the badge (starting top-right)
  const sparkleAngles = [45, 90, 135, 180, 225, 270];
  const sparkleRadius = 38;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Earned ${xpA} XP`}
      style={{
        position: 'fixed',
        top: 64,
        right: 16,
        zIndex: 99000,
        pointerEvents: 'none',
      }}
    >
      {/* Main XP badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, var(--medal-gold, #f59e0b), var(--warning, #d97706))',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 40,
          fontSize: 18,
          fontWeight: 900,
          boxShadow:
            '0 12px 36px rgba(245,158,11,.55), 0 4px 16px rgba(245,158,11,.3), 0 2px 0 rgba(255,255,255,.35) inset',
          animation: 'slideIn .35s cubic-bezier(.34,1.56,.64,1)',
          letterSpacing: '-.01em',
          border: '2px solid rgba(255,255,255,.3)',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontSize: 20,
            animation: 'coinSpin .6s ease',
            display: 'inline-block',
          }}
        >
          ⭐
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>+{displayAmt} XP</span>
      </div>

      {/* Floating sparkle particles — 6 at diverse angles */}
      {sparkleAngles.map((angleDeg, i) => {
        const rad = (angleDeg * Math.PI) / 180;
        const offsetX = Math.cos(rad) * sparkleRadius;
        const offsetY = Math.sin(rad) * sparkleRadius;
        const gradId = `spk${i}`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 14,
              height: 14,
              animation: `xpFloat .7s ${(i * 0.08).toFixed(2)}s ease forwards`,
              transform: `translate(${offsetX}px, ${offsetY}px)`,
              opacity: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill={`url(#${gradId})`} />
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(XPPopup);
