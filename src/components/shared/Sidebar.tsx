// @ts-nocheck
import React, { useState } from 'react';
import { lXP, nXP, getStreak } from '../../lib/appUtils.js';
import CroatianGrb from './CroatianGrb';
import CroatianKnight from './CroatianKnight';

const TABS = [
  { id: 'home', label: 'Today' },
  { id: 'learn', label: 'Learn' },
  { id: 'practice', label: 'Practice' },
  { id: 'croatia', label: 'Croatia' },
  { id: 'profile', label: 'Me' },
];

function NavIcon({ id, active }) {
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

const WEEKLY_OPTIONS = [
  { xp: 50, label: 'Light', desc: '50 XP / week' },
  { xp: 150, label: 'Regular', desc: '150 XP / week' },
  { xp: 300, label: 'Serious', desc: '300 XP / week' },
  { xp: 600, label: 'Intense', desc: '600 XP / week' },
];

function getWeeklyGoal() {
  return parseInt(localStorage.getItem('wkGoal') || '0');
}
function saveWeeklyGoal(v) {
  localStorage.setItem('wkGoal', String(v));
}

function getWeeklyXP(currentXP) {
  try {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem('wkXP') || '{"key":"","base":0}');
    if (stored.key !== weekKey) {
      localStorage.setItem('wkXP', JSON.stringify({ key: weekKey, base: currentXP }));
      return 0;
    }
    return Math.max(0, currentXP - stored.base);
  } catch {
    return 0;
  }
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
}) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoalState] = useState(getWeeklyGoal());

  const streak = getStreak();
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);
  const weeklyXP = getWeeklyXP(st.xp);
  const weeklyGoal = goal;
  const weeklyPct = weeklyGoal > 0 ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100) : 0;

  const nameInitial = (name || 'U')[0].toUpperCase();
  const LEVEL_PALETTE = ['#b45309', '#059669', '#1d4ed8', '#6d28d9', '#dc2626'];
  const levelColor = LEVEL_PALETTE[(level - 1) % LEVEL_PALETTE.length];

  function handleGoalPick(xp) {
    setGoalState(xp);
    saveWeeklyGoal(xp);
    setGoalOpen(false);
  }

  const _isDark = darkMode;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--nav-b)' }}>
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
          <CroatianKnight
            size={48}
            mood={
              streak.count >= 30
                ? 'victory'
                : streak.count >= 14
                  ? 'celebrating'
                  : streak.count >= 7
                    ? 'encouraged'
                    : streak.count >= 3
                      ? 'happy'
                      : 'ready'
            }
            key={tab}
            style={{ flexShrink: 0 }}
          />
        </div>
      </div>

      {/* User card */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--nav-b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
              Level {level + 1}
            </span>
            <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>{xpPct}%</span>
          </div>
          <div
            className="prog-track"
            role="progressbar"
            aria-valuenow={xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to level ${level + 1}: ${xpPct}%`}
            style={{ height: 6 }}
          >
            <div
              className="prog-fill"
              style={{
                width: xpPct + '%',
                background: `linear-gradient(90deg,${levelColor},${levelColor}99)`,
              }}
            />
          </div>
        </div>
        {/* Streak + stat row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[
            { icon: '🔥', val: streak.count, label: 'streak' },
            { icon: '📚', val: st.lc, label: 'lessons' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bar-bg)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--heading)' }}>
                {s.icon} {s.val}
              </div>
              <div style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Goal */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--nav-b)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--subtext)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            Weekly Goal
          </span>
          <button
            onClick={() => setGoalOpen((o) => !o)}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#0e7490',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              padding: 0,
            }}
          >
            {goalOpen ? 'Done' : 'Set'}
          </button>
        </div>
        {goalOpen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {WEEKLY_OPTIONS.map((o) => (
              <button
                key={o.xp}
                onClick={() => handleGoalPick(o.xp)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 9,
                  border: `1.5px solid ${goal === o.xp ? '#0e7490' : 'var(--inp-b)'}`,
                  background: goal === o.xp ? 'rgba(14,116,144,.1)' : 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--heading)' }}>
                  {o.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--subtext)' }}>{o.desc}</span>
              </button>
            ))}
          </div>
        ) : weeklyGoal > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--heading)', fontWeight: 700 }}>
                {weeklyXP} / {weeklyGoal} XP
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: weeklyPct >= 100 ? '#16a34a' : '#0e7490',
                  fontWeight: 700,
                }}
              >
                {weeklyPct}%
              </span>
            </div>
            <div
              className="prog-track"
              role="progressbar"
              aria-valuenow={weeklyPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Weekly XP goal: ${weeklyXP} of ${weeklyGoal} XP (${weeklyPct}%)`}
              style={{ height: 6 }}
            >
              <div
                className="prog-fill"
                style={{
                  width: weeklyPct + '%',
                  background:
                    weeklyPct >= 100
                      ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                      : 'linear-gradient(90deg,#0e7490,#38bdf8)',
                }}
              />
            </div>
            {weeklyPct >= 100 && (
              <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                🏆 Goal reached!
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setGoalOpen(true)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 9,
              border: '1.5px dashed rgba(14,116,144,.45)',
              background: 'rgba(14,116,144,.06)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span style={{ fontSize: 14 }}>🎯</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490' }}>
              Set a weekly XP goal
            </span>
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--nav-b)' }}>
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
            value={srchQ}
            onChange={(e) => setSrchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
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

      {/* Nav items */}
      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'sb-btn' + (tab === t.id ? ' active' : '')}
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
                  tab === t.id ? (t.id === 'croatia' ? '#D40030' : '#0e7490') : 'var(--nav-lbl)',
                flexShrink: 0,
              }}
            >
              <NavIcon id={t.id} active={tab === t.id} />
            </span>
            <span style={{ flex: 1 }}>{t.label}</span>
            {badges && badges[t.id] > 0 && <span className="sb-badge">{badges[t.id]}</span>}
          </button>
        ))}
      </nav>

      {/* Quick shortcuts */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--nav-b)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setScr('analytics')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 10,
              border: '1.5px solid var(--inp-b)',
              background: 'var(--bar-bg)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 16 }}>📊</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              Analytics
            </span>
          </button>
          <button
            onClick={() => setScr('mistakes')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 10,
              border: '1.5px solid var(--inp-b)',
              background: 'var(--bar-bg)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 16 }}>📚</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              Mistakes
            </span>
          </button>
          <button
            onClick={() => setScr('leaderboard')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 10,
              border: '1.5px solid var(--inp-b)',
              background: 'var(--bar-bg)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 16 }}>🏆</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              Family
            </span>
          </button>
        </div>
      </div>

      {/* Bottom: report bug + dark mode toggle + sign out */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--nav-b)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          onClick={() => setScr('contact')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 10px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--bar-bg)',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <span style={{ fontSize: 16 }}>🐛</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--subtext)' }}>
            Report a Bug
          </span>
        </button>
        <button
          onClick={() => setDarkMode((d) => !d)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 10px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--bar-bg)',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <span style={{ fontSize: 16 }}>{darkMode ? '☀️' : '🌙'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--subtext)' }}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
        {doOut && (
          <button
            onClick={doOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 10px',
              borderRadius: 10,
              border: '1px solid rgba(194,65,12,.2)',
              background: 'rgba(194,65,12,.05)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
}
