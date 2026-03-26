import React, { useRef, useEffect, useState } from 'react';

const TABS = [
  { id: "home",     label: "Home" },
  { id: "learn",    label: "Learn" },
  { id: "practice", label: "Practice" },
  { id: "croatia",  label: "Croatia" },
  { id: "profile",  label: "Profile" },
];

function NavIcon({ id, active }) {
  const sw = 1.9;
  if (id === 'home') return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(14,116,144,.1)' : 'none'}/>
    </svg>
  );
  if (id === 'learn') return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(14,116,144,.1)' : 'none'}/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === 'practice') return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(14,116,144,.1)' : 'none'}/>
    </svg>
  );
  if (id === 'croatia') return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Top-left: red (filled) */}
      <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="1.5" fill={active ? '#D40030' : 'currentColor'} opacity={active ? 1 : 0.75}/>
      {/* Top-right: white (outline) */}
      <rect x="13" y="2.5" width="8.5" height="8.5" rx="1.5" fill={active ? '#F8F6F2' : 'transparent'} stroke={active ? '#D40030' : 'currentColor'} strokeWidth={active ? 1 : 1.5} opacity={active ? 1 : 0.4}/>
      {/* Bottom-left: white (outline) */}
      <rect x="2.5" y="13" width="8.5" height="8.5" rx="1.5" fill={active ? '#F8F6F2' : 'transparent'} stroke={active ? '#D40030' : 'currentColor'} strokeWidth={active ? 1 : 1.5} opacity={active ? 1 : 0.4}/>
      {/* Bottom-right: red (filled) */}
      <rect x="13" y="13" width="8.5" height="8.5" rx="1.5" fill={active ? '#D40030' : 'currentColor'} opacity={active ? 1 : 0.75}/>
    </svg>
  );
  if (id === 'profile') return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={sw} fill={active ? 'rgba(14,116,144,.1)' : 'none'}/>
      <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
  return null;
}

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

  // Croatia tab uses Croatian red; all others use teal
  const activeColor = tab === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)';
  const indicatorGradient = tab === 'croatia'
    ? 'linear-gradient(90deg,#b61800,#e53e3e)'
    : 'linear-gradient(90deg,#0e7490,#06b6d4)';

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
      {/* Sliding indicator — color follows active tab */}
      <div style={{
        position: 'absolute',
        top: 6,
        height: 3,
        background: indicatorGradient,
        borderRadius: 3,
        transition: 'left .3s cubic-bezier(.34,1.56,.64,1), width .3s, background .25s',
        ...indicatorStyle,
        pointerEvents: 'none',
      }} />

      {TABS.map((t, i) => {
        const isActive = tab === t.id;
        return (
          <button
            key={t.id}
            ref={el => { btnRefs.current[i] = el; }}
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
              style={{
                display: 'block',
                lineHeight: 1,
                color: isActive ? (t.id === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)') : 'var(--nav-lbl)',
                transition: 'transform .3s cubic-bezier(.34,1.56,.64,1), color .18s',
                transform: isActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
              }}
            >
              <NavIcon id={t.id} active={isActive} />
            </span>
            <span
              className="nav-label"
              style={{
                fontSize: 10,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? (t.id === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)') : 'var(--nav-lbl)',
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
