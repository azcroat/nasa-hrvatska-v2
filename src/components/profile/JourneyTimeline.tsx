// @ts-nocheck
import React from 'react';
import { getJourneyMilestones } from '../../data';

const MILESTONE_ICONS = {
  first_lesson: { icon: '📚', label: 'First Lesson', msg: 'Your Croatian journey begins!' },
  first_speaking: {
    icon: '🎤',
    label: 'First Speaking',
    msg: 'You spoke Croatian for the first time!',
  },
  streak_7: { icon: '🔥', label: '7-Day Streak', msg: 'One full week of Croatian!' },
  streak_30: { icon: '🌟', label: '30-Day Streak', msg: '30 days of dedication!' },
  streak_50: { icon: '💎', label: '50-Day Streak', msg: 'Incredible consistency!' },
  streak_100: { icon: '🏆', label: '100-Day Streak', msg: 'Champion-level commitment!' },
  streak_365: { icon: '👑', label: '365-Day Streak', msg: 'One full year — Čestitamo!' },
  name_day: { icon: '🎉', label: 'Name Day', msg: 'Sretan imendan!' },
  default: { icon: '🌟', label: 'Milestone', msg: 'A new achievement!' },
};

export default function JourneyTimeline() {
  const milestones = getJourneyMilestones().reverse(); // newest first

  if (milestones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--subtext)' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🇭🇷</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Your journey starts with your first lesson.
        </div>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          Milestones will appear here as you progress.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'var(--bar-bg)',
          borderRadius: 1,
        }}
      />

      {milestones.map((m, i) => {
        const def = MILESTONE_ICONS[m.type] || MILESTONE_ICONS.default;
        const date = new Date(m.date);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return (
          <div key={i} style={{ position: 'relative', marginBottom: 16, paddingLeft: 20 }}>
            {/* Dot */}
            <div
              style={{
                position: 'absolute',
                left: -4,
                top: 4,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#0e7490,#164e63)',
                border: '2px solid var(--card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                color: '#fff',
                fontWeight: 900,
              }}
            >
              ✓
            </div>

            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 12,
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 18 }}>{def.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                    {def.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
                    {dateStr}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>
                {def.msg}
              </div>
            </div>
          </div>
        );
      })}

      {/* Journey start */}
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--bar-bg)',
            border: '2px solid var(--card)',
          }}
        />
        <div
          style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', padding: '8px 0' }}
        >
          Your journey begins here 🇭🇷
        </div>
      </div>
    </div>
  );
}
