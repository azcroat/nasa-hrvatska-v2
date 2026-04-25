// src/components/home/SessionCard.tsx
import React from 'react';
import type { DailySession, SessionActivity } from '../../hooks/useDailySession';

interface SessionCardProps {
  session: DailySession;
  isComplete: boolean;
  progress: number; // 0.0–1.0
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
  onStart: () => void; // launches nextActivity.screen
  onKeepPracticing: () => void; // routes to Practice tab
  streak: number;
  xpThisWeek: number;
  wordsdue: number;
}

function StatPill({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 12,
        padding: '8px 4px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: 'var(--heading)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function SessionCard({
  session,
  isComplete,
  progress,
  nextActivity,
  tomorrowLabel,
  onStart,
  onKeepPracticing,
  streak,
  xpThisWeek,
  wordsdue,
}: SessionCardProps) {
  const completedCount = session.completedIds.length;
  const totalCount = session.activities.length;
  const inProgress = completedCount > 0 && !isComplete;

  return (
    <div>
      {/* ── SESSION CARD ── */}
      <div
        style={{
          background: isComplete
            ? 'linear-gradient(135deg,rgba(22,163,74,.1),rgba(22,163,74,.04))'
            : 'var(--card)',
          border: isComplete ? '1.5px solid rgba(22,163,74,.3)' : '1.5px solid var(--card-b)',
          borderRadius: 18,
          padding: '18px 16px',
          marginBottom: 12,
        }}
      >
        {isComplete ? (
          /* ── STATE C: COMPLETE ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--heading)',
                marginBottom: 4,
              }}
            >
              Session Complete!
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
              {completedCount} of {totalCount} activities done
            </div>
            <button
              onClick={onKeepPracticing}
              style={{
                background: 'none',
                border: '1.5px solid var(--card-b)',
                borderRadius: 10,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--subtext)',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                display: 'block',
                width: '100%',
                marginBottom: 8,
              }}
            >
              Keep practicing →
            </button>
            <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
              {tomorrowLabel}
            </div>
          </div>
        ) : (
          /* ── STATE A (fresh) + STATE B (in-progress) ── */
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--info,#0284c7)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 6,
              }}
            >
              {inProgress ? 'Continue Session' : "Today's Session"}
            </div>

            {/* Progress bar — only shown in-progress */}
            {inProgress && (
              <div
                style={{
                  height: 4,
                  background: 'var(--card-b)',
                  borderRadius: 2,
                  marginBottom: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            )}

            {/* Activity list preview — only shown fresh */}
            {!inProgress && (
              <div style={{ marginBottom: 12 }}>
                {session.activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      fontSize: 12,
                      color: 'var(--subtext)',
                      fontWeight: 600,
                      padding: '3px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 8, color: 'var(--info,#0284c7)' }}>●</span>
                    {act.label}
                  </div>
                ))}
              </div>
            )}

            {inProgress && (
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12 }}>
                {completedCount} of {totalCount} done
                {nextActivity && (
                  <span style={{ color: 'var(--heading)', fontWeight: 700 }}>
                    {' · Next: '}
                    {nextActivity.label}
                  </span>
                )}
              </div>
            )}

            {!inProgress && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--subtext)',
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                ~{session.estimatedMinutes} min · {totalCount} activities
              </div>
            )}

            <button
              onClick={onStart}
              disabled={!nextActivity}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                background: nextActivity
                  ? 'linear-gradient(135deg,#0e7490,#164e63)'
                  : 'var(--card-b)',
                color: nextActivity ? '#fff' : 'var(--subtext)',
                fontSize: 14,
                fontWeight: 800,
                cursor: nextActivity ? 'pointer' : 'not-allowed',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {inProgress ? 'Continue →' : '▶ Begin Session →'}
            </button>
          </div>
        )}
      </div>

      {/* ── 3 STAT PILLS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatPill icon="🔥" value={streak} label="Streak" />
        <StatPill icon="⭐" value={xpThisWeek} label="Week XP" />
        <StatPill icon="📚" value={wordsdue} label="Due" />
      </div>
    </div>
  );
}
