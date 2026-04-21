import React from 'react';
import CroatianKnight from '../shared/CroatianKnight';
import type { Stats } from '../../types';

interface StatsWidgetProps {
  streak: { count: number };
  st: Stats;
  ws: { strong: number };
  weekXP: number;
}

export default function StatsWidget({ streak, st, ws, weekXP }: StatsWidgetProps) {
  if (st.lc === 0) {
    return (
      <div className="c" style={{ padding: 16, marginBottom: 8 }}>
        <CroatianKnight
          size={80}
          mood="happy"
          style={{ margin: '0 auto 12px', display: 'block' }}
        />
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 8,
          }}
        >
          🗺️ Your Croatian Journey
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', lineHeight: 1.5 }}>
          Start with <strong>Basic Greetings</strong> → <strong>Numbers</strong> →{' '}
          <strong>Family Vocabulary</strong>. Each lesson takes 5–10 minutes.
        </div>
      </div>
    );
  }

  // Progressive milestone challenges — next tier unlocks when current is complete
  const streakGoal = streak.count >= 30 ? 100 : streak.count >= 7 ? 30 : 7;
  const lessonsGoal = st.lc >= 25 ? 50 : st.lc >= 10 ? 25 : 10;
  const masteredGoal = ws.strong >= 50 ? 100 : ws.strong >= 20 ? 50 : 20;
  const challenges = [
    {
      icon: '🔥',
      label: 'Day Streak',
      cur: Math.min(streak.count, streakGoal),
      goal: streakGoal,
      color: '#ea580c',
    },
    {
      icon: '📚',
      label: 'Lessons',
      cur: Math.min(st.lc, lessonsGoal),
      goal: lessonsGoal,
      color: '#0e7490',
    },
    {
      icon: '💪',
      label: 'Words Mastered',
      cur: Math.min(ws.strong, masteredGoal),
      goal: masteredGoal,
      color: '#16a34a',
    },
    { icon: '⚡', label: 'XP This Week', cur: Math.min(weekXP, 100), goal: 100, color: '#7c3aed' },
  ];

  return (
    <React.Fragment>
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{ background: 'rgba(245,158,11,.12)' }}>
          🏆
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Milestones</div>
          <div className="section-hdr-sub">Track your streaks, lessons & XP goals</div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {challenges.map((c, i) => {
          const pct = Math.round((c.cur / c.goal) * 100);
          const done = c.cur >= c.goal;
          return (
            <div
              key={i}
              style={{
                background: c.color + '15',
                border: `1.5px solid ${done ? c.color : c.color + '40'}`,
                borderRadius: 14,
                padding: '12px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: c.color,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {done ? '✓' : `${c.cur}/${c.goal}`}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--subtext)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  marginTop: 3,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  height: 4,
                  background: 'var(--bar-bg)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: pct + '%',
                    background: c.color,
                    borderRadius: 3,
                    transition: 'width .6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}
