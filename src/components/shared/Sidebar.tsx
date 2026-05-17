import React from 'react';
import { lXP, nXP, getStreak } from '../../lib/appUtils.js';
import CroatianGrb from './CroatianGrb';

const TABS = [
  { id: 'home', label: 'Today' },
  { id: 'learn', label: 'Learn' },
  { id: 'practice', label: 'Practice' },
  { id: 'croatia', label: 'Croatia' },
  { id: 'profile', label: 'Me' },
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

export default function Sidebar({
  tab,
  setTab,
  setScr,
  name,
  level,
  st,
  darkMode,
  setDarkMode,
  badges,
  srchQ,
  setSrchQ,
  onSearch,
  doOut,
}: {
  tab: string;
  setTab: (tab: string) => void;
  setScr: (scr: string) => void;
  name?: string;
  level: number;
  st: { xp: number; lc?: number };
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  badges?: Record<string, number>;
  srchQ?: string;
  setSrchQ?: (q: string) => void;
  onSearch?: () => void;
  doOut?: () => void;
}) {
  const streak = getStreak();
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  const nameInitial = (name || 'U')[0]!.toUpperCase();
  const LEVEL_PALETTE = ['#b45309', '#059669', '#1d4ed8', '#6d28d9', '#dc2626'];
  const levelColor = LEVEL_PALETTE[(level - 1) % LEVEL_PALETTE.length] ?? '#0e7490';

  // Sidebar is visible only on viewports >=768px (see src/index.css:1365 .nav-bar
  // {display:none} media query). TabBar renders the same data-testid="nav-<id>"
  // values for its buttons. Both components stay in the DOM at all viewports
  // (visibility is purely CSS). Emitting nav-* testids on both causes Playwright's
  // strict-mode getByTestId('nav-practice') to resolve to 2 elements and fail.
  // Gate the testid on the matching viewport so exactly one element owns it.
  const emitNavTestids =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  // setScr, darkMode, setDarkMode kept in interface for parent API compatibility;
  // dark mode toggle + bug report moved to SettingsTab.
  void setScr;
  void darkMode;
  void setDarkMode;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--nav-b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 44,
              flexShrink: 0,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
            }}
          >
            <CroatianGrb size={36} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'Playfair Display',serif",
                color: 'var(--heading)',
                lineHeight: 1,
              }}
            >
              Naša Hrvatska
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--subtext)',
                fontWeight: 600,
                marginTop: 2,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              Learn Croatian
            </div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid var(--nav-b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: `linear-gradient(135deg,${levelColor}cc,${levelColor})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {nameInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--heading)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name || 'Learner'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
              Level {level} · {st.xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        {/* XP progress bar */}
        <div style={{ marginBottom: 6 }}>
          <div
            className="prog-track"
            role="progressbar"
            aria-valuenow={xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to level ${level + 1}: ${xpPct}%`}
            style={{ height: 5 }}
          >
            <div
              className="prog-fill"
              style={{
                width: xpPct + '%',
                background: `linear-gradient(90deg,${levelColor},${levelColor}99)`,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'var(--subtext)',
              marginTop: 3,
              textAlign: 'right',
              fontWeight: 600,
            }}
          >
            {xpPct}% to Level {level + 1}
          </div>
        </div>
        {/* Streak + lessons — inline stat line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'var(--subtext)',
              fontWeight: 600,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e85d04"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0C18 10 12 8 12 2z" />
            </svg>
            <span style={{ color: 'var(--heading)', fontWeight: 800 }}>{streak.count}</span>
            <span>day streak</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'var(--card-b)', flexShrink: 0 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'var(--subtext)',
              fontWeight: 600,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#002868"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            <span style={{ color: 'var(--heading)', fontWeight: 800 }}>{st.lc ?? 0}</span>
            <span>lessons</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--nav-b)' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="search"
            aria-label="Search lessons"
            value={srchQ ?? ''}
            onChange={(e) => setSrchQ?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch?.();
            }}
            placeholder="Search lessons…"
            style={{
              paddingLeft: 32,
              fontSize: 13,
              padding: '9px 12px 9px 32px',
              borderRadius: 10,
            }}
          />
        </div>
      </div>

      {/* Nav items — accessible name is owned by the outer <nav aria-label="Main navigation">.
          We render this inner container as a plain <div> on purpose: a nested <nav> with the
          same aria-label produces TWO landmarks with the same accessible name, which makes
          Playwright's getByRole('navigation', {name:'Main navigation'}) match >1 element and
          fail in strict mode. */}
      <div style={{ padding: '6px 12px', flex: 1 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={emitNavTestids ? 'nav-' + t.id : undefined}
            className={
              'sb-btn' +
              (tab === t.id ? ' active' : '') +
              (t.id === 'croatia' ? ' croatia-tab' : '')
            }
            onClick={() => {
              setTab(t.id);
            }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                color:
                  tab === t.id ? (t.id === 'croatia' ? '#D40030' : '#002868') : 'var(--nav-lbl)',
                flexShrink: 0,
              }}
            >
              <NavIcon id={t.id} active={tab === t.id} />
            </span>
            <span style={{ flex: 1 }}>{t.label}</span>
            {badges && (badges[t.id] ?? 0) > 0 && <span className="sb-badge">{badges[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* Bottom: sign out only — dark mode + bug report live in Settings */}
      {doOut && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--nav-b)',
          }}
        >
          <button
            onClick={doOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(194,65,12,.25)',
              background: 'rgba(194,65,12,.04)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b45309"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span
              style={{ fontSize: 12, fontWeight: 700, color: '#b45309', letterSpacing: '.01em' }}
            >
              Sign Out
            </span>
          </button>
        </div>
      )}
    </nav>
  );
}
