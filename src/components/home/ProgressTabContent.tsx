import React, { useMemo } from 'react';
import StatsWidget from './StatsWidget';
import WeakWordsPanel from './WeakWordsPanel';
import type { Stats } from '../../types';

interface CEFRLevel {
  code: string;
  label: string;
  minLessons: number;
  maxLessons: number;
  color: string;
  bg: string;
  border: string;
  desc: string;
}

interface ProgressTabContentProps {
  streak: { count: number };
  st: Stats;
  ws: { strong: number };
  weekXP: number;
  nudgeDismissed?: boolean;
  setNudgeDismissed?: (v: boolean) => void;
  setScr?: (screen: string) => void;
}

// CEFR milestones mapped to lesson counts (approximate thresholds based on content)
const CEFR_LEVELS = [
  {
    code: 'A1',
    label: 'Beginner',
    minLessons: 0,
    maxLessons: 8,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    desc: 'Basic greetings & survival phrases',
  },
  {
    code: 'A2',
    label: 'Elementary',
    minLessons: 8,
    maxLessons: 20,
    color: '#0e7490',
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'Everyday conversations & simple needs',
  },
  {
    code: 'B1',
    label: 'Intermediate',
    minLessons: 20,
    maxLessons: 45,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    desc: 'Travel, opinions & familiar topics',
  },
  {
    code: 'B1+',
    label: 'Upper-Inter',
    minLessons: 45,
    maxLessons: 80,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
    desc: 'Complex sentences & abstract ideas',
  },
  {
    code: 'B2',
    label: 'Upper-Inter+',
    minLessons: 80,
    maxLessons: 9999,
    color: '#D40030',
    bg: '#fff0f2',
    border: '#fca5a5',
    desc: 'Fluent conversations with native speakers',
  },
];

function getCurrentCEFR(lc: number): { level: CEFRLevel; idx: number } {
  for (let i = CEFR_LEVELS.length - 1; i >= 0; i--) {
    const lvl = CEFR_LEVELS[i]!;
    if (lc >= lvl.minLessons) return { level: lvl, idx: i };
  }
  return { level: CEFR_LEVELS[0]!, idx: 0 };
}

function getCEFRProgress(lc: number): number {
  const { level, idx } = getCurrentCEFR(lc);
  if (idx >= CEFR_LEVELS.length - 1) return 100;
  const range = level.maxLessons - level.minLessons;
  const done = lc - level.minLessons;
  return Math.min(Math.round((done / range) * 100), 100);
}

// Estimate vocab mastered from SRS data
function getVocabStats() {
  try {
    const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}') as Record<
      string,
      { r?: number; w?: number }
    >;
    const all = Object.values(sr);
    const mastered = all.filter((v) => (v.r ?? 0) >= 3).length;
    return { mastered, seen: all.length };
  } catch {
    return { mastered: 0, seen: 0 };
  }
}

// Compute a simple streak history array for the last 14 days
function getStreakHistory() {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    const practiced =
      localStorage.getItem('nh_practiced_' + key) === '1' ||
      parseInt(localStorage.getItem('nh_daily_xp_' + key) || '0', 10) > 0;
    result.push({ date: d, key, practiced, isToday: i === 0 });
  }
  return result;
}

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ProgressTabContent({
  streak,
  st,
  ws,
  weekXP,
  nudgeDismissed,
  setNudgeDismissed,
  setScr,
}: ProgressTabContentProps) {
  const { level: cefrLevel, idx: cefrIdx } = useMemo(() => getCurrentCEFR(st.lc), [st.lc]);
  const cefrProgress = useMemo(() => getCEFRProgress(st.lc), [st.lc]);
  const { mastered: vocabMastered, seen: vocabSeen } = useMemo(getVocabStats, [st.lc]);
  const nextCEFR = CEFR_LEVELS[cefrIdx + 1];
  const lessonsToNextCEFR = nextCEFR ? nextCEFR.minLessons - st.lc : 0;
  const streakHistory = useMemo(getStreakHistory, [streak.count]);

  return (
    <React.Fragment>
      {/* ── TRACK PROGRESS HEADER ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 }}
      >
        <div
          style={{ width: 3, height: 20, background: 'var(--harvest, #d97706)', borderRadius: 2 }}
        />
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            color: 'var(--heading)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Your Progress
        </span>
      </div>

      {/* ── CEFR LANGUAGE LEVEL ── */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 20,
          marginBottom: 12,
          overflow: 'hidden',
          border: `1.5px solid ${cefrLevel.border}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${cefrLevel.color}22, ${cefrLevel.color}0a)`,
            borderBottom: `1px solid ${cefrLevel.border}`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: cefrLevel.color,
                color: '#fff',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '.04em',
              }}
            >
              {cefrLevel.code}
            </div>
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.1 }}
              >
                {cefrLevel.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
                {cefrLevel.desc}
              </div>
            </div>
          </div>
          {nextCEFR && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 700 }}>
                Next level
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: cefrLevel.color }}>
                {nextCEFR.code}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar + path */}
        <div style={{ padding: '12px 16px 14px' }}>
          {/* CEFR stage markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            {CEFR_LEVELS.slice(0, -1).map((l, i) => (
              <div
                key={l.code}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems:
                    i === 0 ? 'flex-start' : i === CEFR_LEVELS.length - 2 ? 'flex-end' : 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: i <= cefrIdx ? l.color : 'var(--subtext)',
                    opacity: i <= cefrIdx ? 1 : 0.45,
                    letterSpacing: '.03em',
                  }}
                >
                  {l.code}
                </div>
              </div>
            ))}
          </div>

          {/* Main progress track */}
          <div
            style={{
              position: 'relative',
              height: 10,
              background: 'var(--bar-bg)',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            {/* Completed segments */}
            {CEFR_LEVELS.slice(0, cefrIdx).map((l, i) => (
              <div
                key={l.code}
                style={{
                  position: 'absolute',
                  left: `${(i / (CEFR_LEVELS.length - 1)) * 100}%`,
                  width: `${(1 / (CEFR_LEVELS.length - 1)) * 100}%`,
                  height: '100%',
                  background: l.color,
                }}
              />
            ))}
            {/* Active segment */}
            <div
              style={{
                position: 'absolute',
                left: `${(cefrIdx / (CEFR_LEVELS.length - 1)) * 100}%`,
                width: `${(cefrProgress / 100) * (1 / (CEFR_LEVELS.length - 1)) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${cefrLevel.color}, ${cefrLevel.color}cc)`,
                borderRadius: '0 4px 4px 0',
                transition: 'width .5s ease',
              }}
            />
          </div>

          {nextCEFR ? (
            <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>
              <span style={{ fontWeight: 800, color: cefrLevel.color }}>{cefrProgress}%</span>{' '}
              through {cefrLevel.code}
              {lessonsToNextCEFR > 0 && (
                <span style={{ opacity: 0.75 }}>
                  {' '}
                  · {lessonsToNextCEFR} lesson{lessonsToNextCEFR !== 1 ? 's' : ''} to{' '}
                  {nextCEFR.code}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 800, color: cefrLevel.color }}>
              🎓 Upper Intermediate — near-fluent level!
            </div>
          )}
        </div>
      </div>

      {/* ── VOCABULARY MASTERY ── */}
      {vocabSeen > 0 && (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 16,
            marginBottom: 12,
            padding: '14px 16px',
            border: '1.5px solid var(--card-b)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--heading)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🧠</span> Vocabulary Mastered
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>
              {vocabMastered}
              <span style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>
                /{vocabSeen}
              </span>
            </div>
          </div>

          {/* Stacked bar: mastered vs seen vs total */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'stretch' }}>
            {[
              {
                label: 'Mastered',
                value: vocabMastered,
                total: vocabSeen,
                color: '#7c3aed',
                emoji: '✅',
              },
              {
                label: 'Learning',
                value: vocabSeen - vocabMastered,
                total: vocabSeen,
                color: '#0e7490',
                emoji: '📖',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  background: `${item.color}0f`,
                  borderRadius: 10,
                  padding: '8px 10px',
                  border: `1px solid ${item.color}22`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    marginBottom: 3,
                  }}
                >
                  {item.emoji} {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, lineHeight: 1 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{ height: 6, background: 'var(--bar-bg)', borderRadius: 4, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round((vocabMastered / vocabSeen) * 100)}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                borderRadius: 4,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 6, fontWeight: 600 }}>
            {Math.round((vocabMastered / vocabSeen) * 100)}% retention rate · review 3+ times to
            master
          </div>
        </div>
      )}

      {/* ── 14-DAY ACTIVITY HEATMAP ── */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 16,
          marginBottom: 12,
          padding: '14px 16px',
          border: '1.5px solid var(--card-b)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>📅</span> Last 14 Days
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {streakHistory.map(({ key, practiced, isToday, date }) => (
            <div
              key={key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 5,
                  background: practiced
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : isToday
                      ? 'rgba(14,116,144,0.15)'
                      : 'var(--bar-bg)',
                  border: isToday ? '1.5px solid var(--info)' : '1px solid transparent',
                  transition: 'background .2s',
                }}
              />
              <div style={{ fontSize: 8, color: 'var(--subtext)', fontWeight: 600, lineHeight: 1 }}>
                {DAYS_SHORT[date.getDay()]}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'linear-gradient(135deg,#16a34a,#22c55e)',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
              Practiced
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--bar-bg)',
                border: '1px solid var(--card-b)',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>Missed</span>
          </div>
          {streak.count > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#f97316' }}>
              🔥 {streak.count} day streak
            </div>
          )}
        </div>
      </div>

      {/* ── NEXT ACHIEVEMENT ── */}
      <div
        className="c"
        style={{
          padding: '12px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🔓</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Next Achievement
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--heading)',
              marginTop: 2,
            }}
          >
            {streak.count < 7
              ? `🔥 Streak Starter — reach a 7-day streak (${7 - streak.count} days away)`
              : streak.count < 30
                ? `🌟 Streak Master — reach a 30-day streak (${30 - streak.count} days away)`
                : st.lc < 25
                  ? `📚 Dedicated Learner — complete 25 lessons (${25 - st.lc} to go)`
                  : "🏆 Keep going — you're on a great path!"}
          </div>
        </div>
      </div>

      {/* ── MILESTONES ── */}
      <StatsWidget streak={streak} st={st} ws={ws} weekXP={weekXP} />

      {/* ── WEAK AREAS ANALYTICS ── */}
      {st.lc >= 1 && <WeakWordsPanel setScr={setScr} />}

      {/* ── ADAPTIVE DAILY GOAL NUDGE ── */}
      {(() => {
        const dailyMin = parseInt(localStorage.getItem('nh_daily_min') || '0', 10);
        if (!dailyMin || dailyMin >= 20) return null;
        const thresholds: Record<number, number> = { 5: 40, 10: 80, 15: 120 };
        const xpTarget = thresholds[dailyMin] ?? 0;
        if (!xpTarget) return null;
        const dayOfWeek = new Date().getDay() || 7;
        if (dayOfWeek < 3) return null;
        const dailyAvg = weekXP / dayOfWeek;
        if (dailyAvg < xpTarget * 1.5) return null;
        const nextMin = dailyMin === 5 ? 10 : dailyMin === 10 ? 15 : 20;
        const dismissed =
          nudgeDismissed || localStorage.getItem('nh_goal_nudge_dismissed') === String(dailyMin);
        if (dismissed) return null;
        return (
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1.5px solid var(--success-b)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>🚀</span>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', marginBottom: 3 }}
              >
                You're crushing your goal!
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500, lineHeight: 1.5 }}
              >
                You're averaging {Math.round(dailyAvg)} XP/day — well above your {dailyMin}-min
                target. Ready to bump it up to {nextMin} min?
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => {
                    localStorage.setItem('nh_daily_min', String(nextMin));
                    localStorage.removeItem('nh_goal_nudge_dismissed');
                    if (setNudgeDismissed) setNudgeDismissed(true);
                  }}
                  style={{
                    background: 'var(--success)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Yes, {nextMin} min/day →
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('nh_goal_nudge_dismissed', String(dailyMin));
                    if (setNudgeDismissed) setNudgeDismissed(true);
                  }}
                  style={{
                    background: 'none',
                    color: 'var(--success)',
                    border: '1.5px solid var(--success-b)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  I'm happy at {dailyMin} min
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </React.Fragment>
  );
}
