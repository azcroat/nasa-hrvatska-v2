import React from 'react';
import { weekKey } from '../../lib/dateUtils.js';
import { getStreak } from '../../lib/appUtils.js';
import { useStats } from '../../context/StatsContext.tsx';

// Returns the week key for 7 days ago (previous week)
function prevWeekKey() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return weekKey(d);
}

// Storage key that ensures recap only shows once per week
function recapShownKey() {
  return 'nh_weekly_recap_shown_' + weekKey();
}

export function shouldShowWeeklyRecap() {
  // Show on Monday (day 1) only, and only once per week
  const today = new Date();
  if (today.getDay() !== 1) return false;
  if (localStorage.getItem(recapShownKey())) return false;
  // Only show if user has practiced at least once (has XP)
  try {
    const prevXP = parseInt(localStorage.getItem('nh_week_xp_' + prevWeekKey()) || '0', 10);
    return prevXP > 0;
  } catch { return false; }
}

export function markRecapShown() {
  try { localStorage.setItem(recapShownKey(), '1'); } catch {}
}

export default function WeeklyRecapModal({ onClose, onMount }) {
  const { stats: st } = useStats();
  const streak = getStreak();
  // Mark as shown on first render so tab-switching before close doesn't re-trigger it
  React.useEffect(() => { if (onMount) onMount(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const prevXP = (() => {
    try { return parseInt(localStorage.getItem('nh_week_xp_' + prevWeekKey()) || '0', 10); } catch { return 0; }
  })();
  const WEEKLY_GOAL = 350; // 50 XP/day × 7
  const goalPct = Math.min(Math.round((prevXP / WEEKLY_GOAL) * 100), 100);
  const goalMet = prevXP >= WEEKLY_GOAL;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--card)', borderRadius: 24, padding: '28px 24px',
        maxWidth: 360, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid var(--card-b)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{goalMet ? '🏆' : '📊'}</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 900,
            color: 'var(--heading)', margin: 0, marginBottom: 6,
          }}>
            Your Weekly Report
          </h2>
          <p style={{ fontSize: 13, color: 'var(--subtext)', margin: 0 }}>
            {goalMet
              ? "You crushed last week's goal! 🎉"
              : "Here's how last week went. Keep pushing!"}
          </p>
        </div>

        {/* XP stat */}
        <div style={{
          background: goalMet ? 'var(--success-bg)' : 'var(--info-bg)',
          border: `1.5px solid ${goalMet ? 'var(--success-b)' : 'var(--info-b)'}`,
          borderRadius: 16, padding: '16px 20px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: goalMet ? 'var(--success)' : 'var(--info)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
              ⚡ Weekly XP
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}>
              {prevXP} / {WEEKLY_GOAL}
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: goalPct + '%',
              background: goalMet ? 'var(--success)' : 'linear-gradient(90deg, var(--info), var(--info-light, #38bdf8))',
              borderRadius: 6, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 6, fontWeight: 600 }}>
            {goalPct}% of weekly goal · 50 XP/day × 7 days
          </div>
        </div>

        {/* Streak stat */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 20,
        }}>
          <div style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', lineHeight: 1 }}>
                {streak.count}
              </div>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                day streak
              </div>
            </div>
          </div>
          <div style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>⭐</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', lineHeight: 1 }}>
                {(st.xp || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                total XP
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="b bp"
          style={{ width: '100%', fontSize: 15, padding: '16px' }}
          onClick={onClose}
        >
          {goalMet ? '🚀 Keep the streak going!' : '💪 Let\'s hit this week\'s goal →'}
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--subtext)', fontSize: 12, marginTop: 12,
            display: 'block', width: '100%', textAlign: 'center',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
