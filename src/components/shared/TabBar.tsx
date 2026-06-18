import React, { useState } from 'react';
import SearchModal from './SearchModal';

// `label` is the ACCESSIBLE NAME (aria-label) and is kept stable on purpose:
// several e2e specs and a11y checks select tabs by these names. `cro` is the
// visible Croatian primary; `sub` is the visible English subtitle. Renaming the
// visible text without touching the accessible name = visible rebrand, zero test churn.
const TABS = [
  { id: 'home', label: 'Today', cro: 'Dom', sub: 'Home' },
  { id: 'learn', label: 'Learn', cro: 'Učenje', sub: 'Learn' },
  { id: 'practice', label: 'Practice', cro: 'Grad', sub: 'Practice' },
  { id: 'ai', label: 'AI Tutor', cro: 'Razgovor', sub: 'Talk' },
  { id: 'croatia', label: 'Discover Croatia', cro: 'Hrvatska', sub: 'Discover' },
  { id: 'profile', label: 'Me', cro: 'Ja', sub: 'Me' },
];

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const sw = 1.9;
  if (id === 'home')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 11.5L12 4l9 7.5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(14,116,144,.1)' : 'none'}
        />
      </svg>
    );
  if (id === 'learn')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L2 8l10 5 10-5-10-5z"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(14,116,144,.1)' : 'none'}
        />
        <path
          d="M2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (id === 'practice')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 2L4 14h7l-1 8 10-12h-7l1-8z"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(14,116,144,.1)' : 'none'}
        />
      </svg>
    );
  if (id === 'ai')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded speech bubble — conversation/tutoring */}
        <path
          d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v8a2.5 2.5 0 01-2.5 2.5H10l-4 3v-3H6.5A2.5 2.5 0 014 14.5v-8z"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(14,116,144,.1)' : 'none'}
        />
        {/* Four-point sparkle — AI/intelligence marker */}
        <path
          d="M12 8v4M10 10h4M12 13.5v.7M11.65 13.85h.7"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (id === 'croatia')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-left: red (filled) */}
        <rect
          x="2.5"
          y="2.5"
          width="8.5"
          height="8.5"
          rx="1.5"
          fill={active ? '#D40030' : 'currentColor'}
          opacity={active ? 1 : 0.75}
        />
        {/* Top-right: white (outline) */}
        <rect
          x="13"
          y="2.5"
          width="8.5"
          height="8.5"
          rx="1.5"
          fill={active ? '#F8F6F2' : 'transparent'}
          stroke={active ? '#D40030' : 'currentColor'}
          strokeWidth={active ? 1 : 1.5}
          opacity={active ? 1 : 0.4}
        />
        {/* Bottom-left: white (outline) */}
        <rect
          x="2.5"
          y="13"
          width="8.5"
          height="8.5"
          rx="1.5"
          fill={active ? '#F8F6F2' : 'transparent'}
          stroke={active ? '#D40030' : 'currentColor'}
          strokeWidth={active ? 1 : 1.5}
          opacity={active ? 1 : 0.4}
        />
        {/* Bottom-right: red (filled) */}
        <rect
          x="13"
          y="13"
          width="8.5"
          height="8.5"
          rx="1.5"
          fill={active ? '#D40030' : 'currentColor'}
          opacity={active ? 1 : 0.75}
        />
      </svg>
    );
  if (id === 'profile')
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth={sw}
          fill={active ? 'rgba(14,116,144,.1)' : 'none'}
        />
        <path
          d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </svg>
    );
  return null;
}

// Tab content transitions: TabBar only renders the bottom nav bar — it does not
// wrap or render any tab content. To animate tab switches, apply the `.tab-enter`
// CSS class (defined in index.css) to the content wrapper in App.jsx whenever the
// active tab changes (e.g. via a `key={tab}` prop or a className toggle).

export default function TabBar({
  tab,
  setTab,
  setScr,
  badges,
}: {
  tab: string;
  setTab: (tab: string) => void;
  setScr?: (scr: string) => void;
  badges?: Record<string, number>;
}) {
  const [showSearch, setShowSearch] = useState(false);

  const croatiaHasNew = (() => {
    const lastVisit = localStorage.getItem('nh_croatia_last_visit');
    if (!lastVisit) return true; // never visited = definitely new
    const today = new Date().toISOString().slice(0, 10);
    return lastVisit < today; // visited before today = new content available
  })();

  const activeIdx = TABS.findIndex((t) => t.id === tab);
  const tabCount = TABS.length;
  const indicatorLeft = `${(activeIdx / tabCount) * 100}%`;

  // TabBar is the mobile bottom nav (visible <768px); Sidebar is the desktop nav
  // (visible >=768px). Both render the same data-testid="nav-<id>" buttons and
  // both stay in DOM at all viewports — visibility is purely CSS. Emitting the
  // testid on both causes Playwright getByTestId('nav-practice') strict-mode to
  // resolve to 2 elements. Gate on the matching viewport so exactly one owns it.
  // Test-env bypass: JSDOM's matchMedia always returns matches:false regardless
  // of query, which would suppress all testids and break testids.smoke.test.tsx
  // (which renders TabBar in isolation). Vite sets import.meta.env.MODE === 'test'
  // under Vitest, so emit unconditionally there.
  const emitNavTestids =
    import.meta.env.MODE === 'test' ||
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const indicatorWidth = `${(1 / tabCount) * 100}%`;

  // Croatia tab uses Croatian red; all others use teal
  const _activeColor =
    tab === 'croatia' ? 'var(--color-croatian, #b61800)' : 'var(--info, #0e7490)';
  const indicatorGradient =
    tab === 'croatia'
      ? 'linear-gradient(90deg,var(--color-croatian,#b61800),#e53e3e)'
      : 'linear-gradient(90deg,#0e7490,#06b6d4)';

  return (
    <>
      {showSearch && <SearchModal setTab={setTab} onClose={() => setShowSearch(false)} />}
      <nav className="nav-bar" role="navigation" aria-label="Main navigation">
        {/* Sliding indicator — color follows active tab */}
        <div
          style={{
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
          }}
        />

        {/* Tab buttons — paddingRight reserves space for the absolute-positioned search button */}
        <div style={{ display: 'flex', width: '100%', paddingRight: 56 }}>
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={emitNavTestids ? 'nav-' + t.id : undefined}
                className={'nav-btn' + (isActive ? ' active' : '')}
                onClick={() => {
                  if (t.id === 'croatia') {
                    localStorage.setItem(
                      'nh_croatia_last_visit',
                      new Date().toISOString().slice(0, 10),
                    );
                  }
                  setTab(t.id);
                }}
                aria-current={isActive ? 'page' : undefined}
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
                    color: isActive
                      ? t.id === 'croatia'
                        ? 'var(--color-croatian, #b61800)'
                        : 'var(--info, #0e7490)'
                      : 'var(--nav-lbl)',
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
                    color: isActive
                      ? t.id === 'croatia'
                        ? 'var(--color-croatian, #b61800)'
                        : 'var(--info, #0e7490)'
                      : 'var(--nav-lbl)',
                    display: 'block',
                    marginTop: 3,
                    transition: 'color .18s, font-weight .18s, letter-spacing .18s ease',
                    letterSpacing: isActive ? '.02em' : '.01em',
                    lineHeight: 1.15,
                  }}
                >
                  {t.cro}
                  <span
                    style={{
                      fontSize: 9,
                      display: 'block',
                      color: 'inherit',
                      opacity: 0.7,
                      lineHeight: 1,
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '.01em',
                    }}
                  >
                    {t.sub}
                  </span>
                </span>
                {t.id === 'croatia' && croatiaHasNew && tab !== 'croatia' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: '50%',
                      transform: 'translateX(10px)',
                      width: 8,
                      height: 8,
                      background: '#dc2626',
                      borderRadius: '50%',
                      border: '1.5px solid var(--bg, #fff)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {badges && t.id !== 'practice' && (badges[t.id] ?? 0) > 0 && (
                  <span
                    aria-label={`${badges[t.id]} new items`}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 800,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      lineHeight: 1,
                      boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
                      border: '1.5px solid #fff',
                    }}
                  >
                    <span aria-hidden="true">✦</span>
                    {badges[t.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSearch(true)}
          aria-label="Search"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--bar-bg)',
            border: '1.5px solid var(--bar-bg)',
            borderRadius: 20,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            cursor: 'pointer',
            color: 'var(--subtext)',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <span aria-hidden="true">🔍</span>
        </button>
      </nav>
    </>
  );
}
