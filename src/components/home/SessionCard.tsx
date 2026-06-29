// src/components/home/SessionCard.tsx
import React from 'react';
import type { DailySession, SessionActivity } from '../../hooks/useDailySession';

// Croatian identity palette — single source of truth for brand colors used in this card
const CROATIAN_RED = '#CC0000';
const CROATIAN_BLUE = '#002868';

/** Minimal shape needed by SessionCard — avoids importing the full LearnPathItem type */
interface LearnPathChipItem {
  id?: string;
  name?: string;
  go?: string;
  topic?: string;
  [key: string]: unknown;
}

interface SessionCardProps {
  session: DailySession;
  isComplete: boolean;
  progress: number; // 0.0–1.0
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
  onStart: () => void; // launches nextActivity.screen
  onKeepPracticing: () => void; // routes to Practice tab
  /** Opens the SRS review screen. Wired to the "Reviews Due" stat pill (when wordsdue > 0). */
  onReviewClick?: () => void;
  streak: number;
  xpThisWeek: number;
  wordsdue: number;
  /** Next incomplete LearnPath item. When null/undefined the chip is not rendered. */
  nextLearnPathItem?: LearnPathChipItem | null;
  /** Called when user clicks the LearnPath chip. Receives the item. */
  onLearnPathStart?: (item: LearnPathChipItem) => void;
  /** Whether the current next LearnPath item has already been completed (greyed chip). */
  learnPathItemDone?: boolean;
  /**
   * Extra activities surfaced when isComplete=true. Each item launches the
   * corresponding exercise screen on click, so users have specific next
   * steps instead of a generic "come back tomorrow" dead-end.
   */
  bonusActivities?: SessionActivity[];
  /** Click handler for a bonus activity — receives the activity, parent decides routing. */
  onBonusStart?: (activity: SessionActivity) => void;
  /**
   * Discards the completed session and builds a fresh one for today. Lets a
   * motivated learner keep going instead of waiting for tomorrow's rebuild.
   */
  onStartFresh?: () => void;
}

// ── Šahovnica Croatian coat of arms crest ──
const SahovnicaCrest = React.memo(function SahovnicaCrest() {
  const cells = Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    return (row + col) % 2 === 0 ? 'w' : 'r';
  });
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 13,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        boxShadow:
          '0 0 0 1.5px rgba(255,255,255,.15), 0 0 0 3px rgba(185,148,62,.45), 0 6px 20px rgba(0,0,0,.45)',
      }}
    >
      {cells.map((type, i) => (
        <div key={i} style={{ background: type === 'w' ? '#f8f8f8' : CROATIAN_RED }} />
      ))}
    </div>
  );
});

// ── Stat pill ──
interface StatPillProps {
  icon: string;
  value: number | string;
  label: string;
  accentColor: string;
  badgeGradient: string;
  /** When provided, the pill becomes a tappable button (e.g. Reviews Due → /review). */
  onClick?: () => void;
  testId?: string;
}

function StatPill({
  icon,
  value,
  label,
  accentColor,
  badgeGradient,
  onClick,
  testId,
}: StatPillProps) {
  const interactive = typeof onClick === 'function';
  const containerStyle: React.CSSProperties = {
    flex: 1,
    width: '100%',
    background: 'var(--card)',
    borderRadius: 14,
    padding: '11px 8px 10px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    border: interactive ? `1.5px solid ${accentColor}` : '1.5px solid var(--card-b)',
    position: 'relative',
    overflow: 'hidden',
    cursor: interactive ? 'pointer' : 'default',
    fontFamily: "'Outfit',sans-serif",
    ...(interactive ? { boxShadow: `0 2px 10px ${accentColor}22` } : null),
  };
  const inner = (
    <>
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: '14px 14px 0 0',
        }}
      />
      {/* Icon badge */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: badgeGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          boxShadow: '0 2px 8px rgba(0,0,0,.15)',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: 'var(--heading)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--subtext)',
          lineHeight: 1,
          letterSpacing: '.01em',
        }}
      >
        {label}
      </div>
    </>
  );
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        aria-label={`${value} ${label} — open review`}
        style={containerStyle}
      >
        {inner}
      </button>
    );
  }
  return (
    <div data-testid={testId} style={containerStyle}>
      {inner}
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
  onReviewClick,
  streak,
  xpThisWeek,
  wordsdue,
  nextLearnPathItem = null,
  onLearnPathStart,
  learnPathItemDone = false,
  bonusActivities = [],
  onBonusStart,
  onStartFresh,
}: SessionCardProps) {
  const completedCount = session.completedIds.length;
  const totalCount = session.activities.length;
  const inProgress = completedCount > 0 && !isComplete;

  return (
    <div data-testid="session-card">
      {/* ── SESSION CARD ── */}
      {isComplete ? (
        /* ── STATE C: COMPLETE ── */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22,163,74,.12), rgba(22,163,74,.05))',
            border: '1.5px solid rgba(22,163,74,.25)',
            borderRadius: 20,
            padding: '20px 18px',
            marginBottom: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,.08)',
            textAlign: 'center',
          }}
        >
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
            {wordsdue > 0 && (
              <span
                style={{ display: 'block', marginTop: 4, color: CROATIAN_BLUE, fontWeight: 700 }}
              >
                prof. Kovač: {wordsdue} phrase{wordsdue !== 1 ? 's' : ''} to review
              </span>
            )}
          </div>
          <button
            onClick={onKeepPracticing}
            style={{
              background:
                wordsdue > 0 ? `linear-gradient(135deg, ${CROATIAN_BLUE}, #0052cc)` : 'none',
              border: wordsdue > 0 ? 'none' : '1.5px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: wordsdue > 0 ? '#fff' : 'var(--subtext)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'block',
              width: '100%',
              marginBottom: bonusActivities.length > 0 ? 16 : 8,
            }}
          >
            {wordsdue > 0 ? `📚 Review ${wordsdue} with prof. Kovač →` : 'Practice more →'}
          </button>
          {bonusActivities.length > 0 && onBonusStart && (
            <div data-testid="bonus-activities" style={{ textAlign: 'left', marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: CROATIAN_RED,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  textAlign: 'center',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                Keep going →
              </div>
              {bonusActivities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => onBonusStart(act)}
                  data-testid={'bonus-' + act.id}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'var(--card)',
                    border: '1.5px solid #e8ecf2',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--heading)',
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  ▶ {act.label}
                </button>
              ))}
            </div>
          )}
          {onStartFresh && (
            <button
              onClick={onStartFresh}
              data-testid="start-fresh-session"
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: '1.5px solid rgba(22,163,74,.4)',
                borderRadius: 10,
                padding: '10px 20px',
                marginBottom: 10,
                fontSize: 13,
                fontWeight: 800,
                color: '#15803d',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              🔄 Start a fresh session →
            </button>
          )}
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
            {tomorrowLabel}
          </div>
        </div>
      ) : (
        /* ── STATE A (fresh) + STATE B (in-progress) ── */
        <div
          style={{
            position: 'relative',
            borderRadius: 20,
            marginBottom: 12,
            background:
              'linear-gradient(148deg, #001640 0%, #002868 45%, #003fa0 80%, #0052cc 100%)',
            boxShadow:
              '0 16px 48px rgba(0,24,80,.5), 0 4px 16px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)',
            overflow: 'hidden',
          }}
        >
          {/* Radial ambient glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 18% 18%, rgba(100,160,255,.12) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          {/* Inner content: crest header + chips */}
          <div style={{ padding: '18px 18px 0', position: 'relative' }}>
            {/* Card header — šahovnica crest + title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 15 }}>
              <SahovnicaCrest />

              {/* Title block */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.5)',
                    marginBottom: 4,
                  }}
                >
                  TODAY&apos;S SESSION
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.1,
                    marginBottom: 4,
                  }}
                >
                  Dnevna Vježba
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,.48)',
                  }}
                >
                  ~{session.estimatedMinutes} min · {totalCount} activities
                </div>
              </div>
            </div>

            {/* Activity chips — always shown in States A and B */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {session.activities.map((act) => {
                const isDone = session.completedIds.includes(act.id);
                const isNext = act.id === nextActivity?.id;

                let chipStyle: React.CSSProperties;
                let chipLabel: string;

                if (!inProgress) {
                  // State A: all future chips
                  chipStyle = {
                    background: 'transparent',
                    color: 'rgba(255,255,255,.3)',
                    border: '1px solid rgba(255,255,255,.1)',
                  };
                  chipLabel = `○ ${act.label}`;
                } else if (isDone) {
                  // Done chip
                  chipStyle = {
                    background: 'rgba(255,255,255,.14)',
                    color: 'rgba(255,255,255,.65)',
                    border: '1px solid rgba(255,255,255,.1)',
                  };
                  chipLabel = `✓ ${act.label}`;
                } else if (isNext) {
                  // Next chip (Croatian red)
                  chipStyle = {
                    background: CROATIAN_RED,
                    color: '#fff',
                    border: '1px solid transparent',
                    fontWeight: 900,
                  };
                  chipLabel = `▶ ${act.label}`;
                } else {
                  // Future chip
                  chipStyle = {
                    background: 'transparent',
                    color: 'rgba(255,255,255,.3)',
                    border: '1px solid rgba(255,255,255,.1)',
                  };
                  chipLabel = `○ ${act.label}`;
                }

                return (
                  <div
                    key={act.id}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.01em',
                      ...chipStyle,
                    }}
                  >
                    {chipLabel}
                  </div>
                );
              })}

              {/* LearnPath chip — 6th chip, additive, does not affect the session counter */}
              {nextLearnPathItem && (
                <div
                  data-testid="learnpath-chip"
                  onClick={() => {
                    if (!learnPathItemDone && onLearnPathStart) {
                      onLearnPathStart(nextLearnPathItem);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.01em',
                    cursor: learnPathItemDone ? 'default' : 'pointer',
                    ...(learnPathItemDone
                      ? {
                          background: 'rgba(255,255,255,.10)',
                          color: 'rgba(255,255,255,.45)',
                          border: `1px solid rgba(255,255,255,.12)`,
                        }
                      : {
                          background: CROATIAN_BLUE,
                          color: '#fff',
                          border: `1px solid rgba(100,160,255,.4)`,
                          boxShadow: '0 2px 8px rgba(0,40,104,.45)',
                        }),
                  }}
                >
                  {learnPathItemDone
                    ? `✓ ${(nextLearnPathItem.name || 'Path Lesson').slice(0, 20)}`
                    : `★ ${(nextLearnPathItem.name || 'Path Lesson').slice(0, 20)}`}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar — full-width flush, only in-progress */}
          {inProgress && (
            <div
              style={{
                height: 4,
                background: 'rgba(0,0,0,.25)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(progress * 100)}%`,
                  background: 'linear-gradient(90deg, rgba(255,255,255,.4), rgba(255,255,255,.75))',
                  borderRadius: '0 2px 2px 0',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          )}

          {/* CTA button wrapper */}
          <div style={{ padding: '14px 18px 18px', position: 'relative' }}>
            <button
              data-testid="session-begin-cta"
              onClick={onStart}
              disabled={!nextActivity}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 13,
                border: 'none',
                background: nextActivity ? CROATIAN_RED : 'rgba(204,0,0,.4)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'Outfit',sans-serif",
                cursor: nextActivity ? 'pointer' : 'not-allowed',
                letterSpacing: '.025em',
                boxShadow: nextActivity
                  ? '0 4px 16px rgba(204,0,0,.45), inset 0 1px 0 rgba(255,255,255,.15)'
                  : 'none',
              }}
            >
              {inProgress ? 'Continue Session →' : '▶ Begin Session →'}
            </button>
          </div>
        </div>
      )}

      {/* ── 3 STAT PILLS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatPill
          icon="🔥"
          value={streak}
          label="Day Streak"
          accentColor={CROATIAN_RED}
          badgeGradient={`linear-gradient(135deg,${CROATIAN_RED},#991a00)`}
        />
        <StatPill
          icon="⭐"
          value={xpThisWeek}
          label="Week XP"
          accentColor="#b45309"
          badgeGradient="linear-gradient(135deg,#d97706,#92400e)"
        />
        <StatPill
          icon="📚"
          value={wordsdue}
          label={wordsdue > 0 ? 'Reviews Due →' : 'Reviews Due'}
          accentColor={CROATIAN_BLUE}
          badgeGradient={`linear-gradient(135deg,${CROATIAN_BLUE},#0052cc)`}
          onClick={wordsdue > 0 && onReviewClick ? onReviewClick : undefined}
          testId="reviews-due-pill"
        />
      </div>
    </div>
  );
}
