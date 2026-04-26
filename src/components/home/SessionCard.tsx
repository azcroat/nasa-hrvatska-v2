// src/components/home/SessionCard.tsx
import React from 'react';
import type { DailySession, SessionActivity } from '../../hooks/useDailySession';

// Croatian identity palette — single source of truth for brand colors used in this card
const CROATIAN_RED = '#CC0000';
const CROATIAN_BLUE = '#002868';

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
}

function StatPill({ icon, value, label, accentColor, badgeGradient }: StatPillProps) {
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        borderRadius: 14,
        padding: '11px 8px 10px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        border: '1.5px solid #e8edf2',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
          color: '#0f172a',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: '#64748b',
          lineHeight: 1,
          letterSpacing: '.01em',
        }}
      >
        {label}
      </div>
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
              color: '#0f172a',
              marginBottom: 4,
            }}
          >
            Session Complete!
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
            {completedCount} of {totalCount} activities done
          </div>
          <button
            onClick={onKeepPracticing}
            style={{
              background: 'none',
              border: '1.5px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'block',
              width: '100%',
              marginBottom: 8,
            }}
          >
            Keep practicing →
          </button>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{tomorrowLabel}</div>
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

          {/* Inner content: header + chips */}
          <div style={{ padding: '18px 18px 0', position: 'relative' }}>
            {/* Card header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 13,
                marginBottom: 15,
              }}
            >
              <SahovnicaCrest />

              {/* Title block */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: '.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.45)',
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

              {/* Count badge */}
              <div
                style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 8,
                  padding: '5px 9px',
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,.8)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {totalCount} acts
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
              onClick={onStart}
              disabled={!nextActivity}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 13,
                border: '1px solid rgba(255,255,255,.2)',
                background: 'rgba(255,255,255,.1)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'Outfit',sans-serif",
                cursor: nextActivity ? 'pointer' : 'not-allowed',
                letterSpacing: '.025em',
                opacity: nextActivity ? 1 : 0.5,
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
          label="Words Due"
          accentColor={CROATIAN_BLUE}
          badgeGradient={`linear-gradient(135deg,${CROATIAN_BLUE},#0052cc)`}
        />
      </div>
    </div>
  );
}
