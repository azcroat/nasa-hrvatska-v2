import React, { useState, useMemo } from 'react';
import SearchModal from './SearchModal';

const TABS = [
  { id: "home",     label: "Today" },
  { id: "learn",    label: "Learn" },
  { id: "practice", label: "Practice" },
  { id: "croatia",  label: "Culture" },
  { id: "profile",  label: "Me" },
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

// Tab content transitions: TabBar only renders the bottom nav bar — it does not
// wrap or render any tab content. To animate tab switches, apply the `.tab-enter`
// CSS class (defined in index.css) to the content wrapper in App.jsx whenever the
// active tab changes (e.g. via a `key={tab}` prop or a className toggle).
const TAB_SUBTITLES = {
  learn:    'Lessons',
  practice: 'Drills',
  croatia:  'Culture',
};

export default function TabBar({ tab, setTab, setScr, badges }) {
  const [showSearch, setShowSearch] = useState(false);

  // Local SRS due-count fallback — used only if the badges prop doesn't carry a practice count
  const localDueCount = useMemo(() => {
    try {
      const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
      const now = Date.now();
      return Object.values(sr).filter(v => v.due && v.due <= now).length;
    } catch { return 0; }
  }, []);

  const croatiaHasNew = (() => {
    const lastVisit = localStorage.getItem('nh_croatia_last_visit');
    if (!lastVisit) return true; // never visited = definitely new
    const today = new Date().toISOString().slice(0, 10);
    return lastVisit < today; // visited before today = new content available
  })();

  const activeIdx = TABS.findIndex(t => t.id === tab);
  const tabCount = TABS.length;
  const indicatorLeft = `${(activeIdx / tabCount) * 100}%`;
  const indicatorWidth = `${(1 / tabCount) * 100}%`;

  // Croatia tab uses Croatian red; all others use teal
  const _activeColor = tab === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)';
  const indicatorGradient = tab === 'croatia'
    ? 'linear-gradient(90deg,var(--color-croatian,#b61800),#e53e3e)'
    : 'linear-gradient(90deg,#0e7490,#06b6d4)';

  return (
    <>
      {showSearch && <SearchModal setTab={setTab} onClose={() => setShowSearch(false)} />}
    <nav
      className="nav-bar"
      role="navigation"
      aria-label="Main navigation"
      style={{ position: 'relative' }}
    >
      {/* Sliding indicator — color follows active tab */}
      <div style={{
        position: 'absolute',
        top: 6,
        height: 3,
        background: indicatorGradient,
        borderRadius: 3,
        left: indicatorLeft,
        width: indicatorWidth,
        transition: 'left .3s cubic-bezier(0.25, 0.46, 0.45, 0.94), background .25s',
        willChange: 'left',
        pointerEvents: 'none',
      }} />

      {/* Tab buttons — paddingRight reserves space for the absolute-positioned search button */}
      <div style={{ display:'flex', width:'100%', paddingRight: 56 }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              className={"nav-btn" + (isActive ? " active" : "")}
              onClick={() => {
                if (t.id === 'croatia') {
                  localStorage.setItem('nh_croatia_last_visit', new Date().toISOString().slice(0, 10));
                }
                setScr("dashboard"); setTab(t.id);
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={t.label}
              style={{
                position: 'relative',
                flex: 1,
                padding: '10px 4px 8px',
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
                  transition: 'transform .3s cubic-bezier(0.25, 0.46, 0.45, 0.94), color .18s',
                  transform: isActive ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                }}
              >
                <NavIcon id={t.id} active={isActive} />
              </span>
              <span
                className="nav-label"
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? (t.id === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)') : 'var(--nav-lbl)',
                  display: 'block',
                  marginTop: 3,
                  transition: 'color .18s, font-weight .18s, letter-spacing .18s ease',
                  letterSpacing: isActive ? '.02em' : '.01em',
                  lineHeight: TAB_SUBTITLES[t.id] ? 1.15 : undefined,
                }}
              >
                {t.label}
                {TAB_SUBTITLES[t.id] && (
                  <span style={{
                    fontSize: 9,
                    display: 'block',
                    color: 'inherit',
                    opacity: 0.7,
                    lineHeight: 1,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '.01em',
                  }}>
                    {TAB_SUBTITLES[t.id]}
                  </span>
                )}
              </span>
              {t.id === 'croatia' && croatiaHasNew && tab !== 'croatia' && (
                <div style={{
                  position: 'absolute', top: 2, right: '50%',
                  transform: 'translateX(10px)',
                  width: 8, height: 8,
                  background: '#dc2626',
                  borderRadius: '50%',
                  border: '1.5px solid var(--bg, #fff)',
                  pointerEvents: 'none',
                }} />
              )}
              {/* AI sparkle badge — always shown on Culture tab when not active */}
              {t.id === 'croatia' && tab !== 'croatia' && (
                <div aria-hidden="true" style={{
                  position: 'absolute', bottom: 2, left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 8, fontWeight: 900, color: '#b61800',
                  letterSpacing: '.04em', lineHeight: 1,
                  animation: 'pulse 2.4s ease-in-out infinite',
                  pointerEvents: 'none',
                }}>✦AI</div>
              )}
              {badges && badges[t.id] > 0 && (
                <span aria-label={`${badges[t.id]} new items`} style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  minWidth: 16, height: 16,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', lineHeight: 1,
                  boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
                  border: '1.5px solid #fff',
                }}>
                  <span aria-hidden="true">✦</span>{badges[t.id]}
                </span>
              )}
              {/* Local SRS fallback badge — shown on Practice when badges prop has no count */}
              {t.id === 'practice' && !(badges && badges.practice > 0) && localDueCount > 0 && (
                <div style={{
                  position: 'absolute', top: 2, right: '50%', transform: 'translateX(12px)',
                  minWidth: 16, height: 16, padding: '0 4px',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8,
                  fontSize: 9, fontWeight: 900, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid var(--bg, #fff)',
                  pointerEvents: 'none',
                }}>
                  ✦{localDueCount > 9 ? '9+' : localDueCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowSearch(true)}
        aria-label="Search"
        style={{
          position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
          background:'var(--bar-bg)',
          border:'1.5px solid var(--bar-bg)',
          borderRadius:20,
          minWidth:44, minHeight:44,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, cursor:'pointer',
          color:'var(--subtext)',
          flexShrink:0,
          zIndex: 1,
        }}
      ><span aria-hidden="true">🔍</span></button>

    </nav>
    </>
  );
}
