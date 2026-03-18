import React, { useRef, useEffect, useState } from 'react';

const TABS = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "learn",    emoji: "🗺️",  label: "Path" },
  { id: "practice", emoji: "🎮", label: "Practice" },
  { id: "croatia",  emoji: "🇭🇷", label: "Croatia" },
  { id: "profile",  emoji: "👤", label: "Me" },
];

export default function TabBar({ tab, setTab, setScr, badges }) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const btnRefs = useRef([]);
  const navRef = useRef(null);

  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === tab);
    const btn = btnRefs.current[idx];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const bRect = btn.getBoundingClientRect();
    const nRect = nav.getBoundingClientRect();
    setIndicatorStyle({
      left: bRect.left - nRect.left + bRect.width / 2 - 22,
      width: 44,
    });
  }, [tab]);

  return (
    <nav
      ref={navRef}
      className="nav-bar"
      role="navigation"
      aria-label="Main navigation"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'saturate(200%) blur(28px)',
        WebkitBackdropFilter: 'saturate(200%) blur(28px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Sliding indicator */}
      <div style={{
        position: 'absolute',
        top: 6,
        height: 3,
        background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
        borderRadius: 3,
        transition: 'left .3s cubic-bezier(.34,1.56,.64,1), width .3s',
        ...indicatorStyle,
        pointerEvents: 'none',
      }} />

      {TABS.map((t, i) => {
        const isActive = tab === t.id;
        return (
          <button
            key={t.id}
            ref={el => btnRefs.current[i] = el}
            className={"nav-btn" + (isActive ? " active" : "")}
            onClick={() => { setTab(t.id); setScr("dashboard"); }}
            aria-current={isActive ? "page" : undefined}
            aria-label={t.label}
            style={{
              position: 'relative',
              flex: 1,
              padding: '8px 4px 6px',
              minWidth: 0,
              transition: 'background .18s',
            }}
          >
            <span
              className="nav-icon"
              aria-hidden="true"
              style={{
                fontSize: 22,
                display: 'block',
                lineHeight: 1,
                transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
                transform: isActive ? 'scale(1.18) translateY(-2px)' : 'scale(1)',
                filter: isActive ? 'none' : 'grayscale(0.2) opacity(0.7)',
              }}
            >
              {t.emoji}
            </span>
            <span
              className="nav-label"
              style={{
                fontSize: 10,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0e7490' : 'var(--nav-lbl)',
                display: 'block',
                marginTop: 3,
                transition: 'color .18s, font-weight .18s',
                letterSpacing: isActive ? '.02em' : 0,
              }}
            >
              {t.label}
            </span>
            {badges && badges[t.id] > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: '18%',
                background: 'linear-gradient(135deg,#e11d48,#be123c)',
                color: '#fff',
                fontSize: 9, fontWeight: 800,
                minWidth: 16, height: 16,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', lineHeight: 1,
                boxShadow: '0 2px 8px rgba(225,29,72,0.4)',
                border: '1.5px solid #fff',
                animation: 'heartbeat 2s ease-in-out infinite',
              }}>
                {badges[t.id]}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
