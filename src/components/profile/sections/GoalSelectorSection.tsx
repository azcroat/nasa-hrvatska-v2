import React, { useState } from 'react';

/**
 * Learning-goal picker + goal-description tip — extracted from SettingsTab as
 * part of the 1a decomposition. `currentGoal` is SHARED with GoalFocusSection
 * (a sibling that renders the active goal's shortcuts), so it stays lifted in
 * SettingsTab and flows in here as props; this component only owns the
 * open/closed dropdown UI state. The GOALS list lives here as its sole consumer.
 * Behavior-identical to the prior inline block.
 */
const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Speak with family' },
  { id: 'travel', icon: '✈️', label: 'Travel to Croatia' },
  { id: 'culture', icon: '📖', label: 'Love the culture' },
  { id: 'fluent', icon: '🗣️', label: 'Become fluent' },
];

export default function GoalSelectorSection({
  currentGoal,
  setCurrentGoal,
}: {
  currentGoal: string;
  setCurrentGoal: (goal: string) => void;
}) {
  const [goalOpen, setGoalOpen] = useState(false);
  return (
    <React.Fragment>
      {/* Goal selector */}
      <div className="tc" style={{ marginBottom: 10, overflow: 'hidden' }}>
        <button
          onClick={() => setGoalOpen((o) => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'var(--info-bg)',
              border: '1px solid var(--info-b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xl)',
              flexShrink: 0,
            }}
          >
            {GOALS.find((g) => g.id === currentGoal)?.icon || '🎯'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
              My Learning Goal
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              {currentGoal
                ? GOALS.find((g) => g.id === currentGoal)?.label
                : 'Not set — tap to choose'}
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--subtext)',
              opacity: 0.85,
              transition: 'transform .2s',
              transform: goalOpen ? 'rotate(180deg)' : 'none',
            }}
          >
            ⌄
          </div>
        </button>
        {goalOpen && (
          <div style={{ borderTop: '1px solid var(--card-b)', padding: '10px 12px 12px' }}>
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  localStorage.setItem('nh_goal', g.id);
                  setCurrentGoal(g.id);
                  setGoalOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: currentGoal === g.id ? 'var(--info-bg)' : 'transparent',
                  fontFamily: "'Outfit',sans-serif",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 'var(--text-xl)' }}>{g.icon}</span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: currentGoal === g.id ? 800 : 600,
                    color: currentGoal === g.id ? 'var(--info)' : 'var(--heading)',
                  }}
                >
                  {g.label}
                </span>
                {currentGoal === g.id && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: 'var(--info)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {currentGoal && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            marginTop: 8,
            padding: '8px 12px',
            background: 'var(--bar-bg)',
            borderRadius: 8,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {currentGoal === 'heritage'
            ? '🇭🇷 Focuses on family vocabulary, traditions, and diaspora-specific phrases'
            : currentGoal === 'family'
              ? '👨‍👩‍👧 Emphasizes family conversations, customs, and emotional vocabulary'
              : currentGoal === 'partner'
                ? "💑 Tailored for learning your partner's language and cultural context"
                : currentGoal === 'travel'
                  ? '✈️ Prioritizes practical phrases, transportation, dining, and navigation'
                  : currentGoal === 'culture'
                    ? '📖 Focuses on history, art, music, literature, and cultural depth'
                    : currentGoal === 'fluent'
                      ? '🗣️ Full curriculum from A1 to B2+ with all grammar and vocabulary'
                      : 'Select a goal to personalize your learning path'}
        </div>
      )}
    </React.Fragment>
  );
}
