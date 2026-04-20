// @ts-nocheck
import React from 'react';

// Helper to get SRS data
function getSRData() {
  try {
    return JSON.parse(localStorage.getItem('nh_sr') || '{}');
  } catch {
    return {};
  }
}

// Helper to get last 7 days of XP and study time from real daily keys
function getDailyActivity() {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const xp = parseInt(localStorage.getItem(`nh_daily_xp_${key}`) || '0', 10);
    const mins = parseInt(localStorage.getItem(`nh_daily_time_${key}`) || '0', 10);
    result.push({
      label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      xp,
      mins,
      isToday: i === 0,
    });
  }
  return result;
}

// Analyze SRS vocabulary data
function analyzeVocab() {
  const sr = getSRData();
  const words = Object.entries(sr);
  if (words.length === 0)
    return { total: 0, mastered: 0, learning: 0, avgAccuracy: 0, weakWords: [] };

  let mastered = 0,
    learning = 0,
    totalRight = 0,
    totalWrong = 0;
  const weakWords = [];

  words.forEach(([word, data]) => {
    const right = data.r || 0;
    const wrong = data.w || 0;
    totalRight += right;
    totalWrong += wrong;
    // FSRS: stability ≥ 21 days = mastered; legacy SM-2 fallback: rep ≥ 4 && ef ≥ 2.0
    if (data.s != null ? data.s >= 21 : data.rep >= 4 && (data.ef || 0) >= 2.0) mastered++;
    else learning++;
    if (wrong > right && right + wrong >= 3) weakWords.push({ word, right, wrong });
  });

  const avgAccuracy =
    totalRight + totalWrong > 0 ? Math.round((totalRight / (totalRight + totalWrong)) * 100) : 0;

  return {
    total: words.length,
    mastered,
    learning,
    avgAccuracy,
    weakWords: weakWords.sort((a, b) => b.wrong - b.right - (a.wrong - a.right)).slice(0, 5),
  };
}

// Get journey milestones
function getJourney() {
  try {
    return JSON.parse(localStorage.getItem('nh_journey') || '[]');
  } catch {
    return [];
  }
}

export default function LearningInsights({ st }) {
  // Not memoised — these read localStorage so they must re-run when st changes to stay current
  const vocab = analyzeVocab();
  const dailyActivity = getDailyActivity();
  const _journey = getJourney().slice(-5).reverse(); // last 5 milestones

  const streak = st?.ss || 0;
  const totalXP = st?.xp || 0;
  const lessonsCompleted = st?.lc || 0;
  const perfectScores = st?.pf || 0;

  const maxXP = Math.max(...dailyActivity.map((d) => d.xp), 1);
  const totalMinsThisWeek = dailyActivity.reduce((s, d) => s + d.mins, 0);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--heading)' }}>
            Learning Insights
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>Your progress at a glance</div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}
      >
        {[
          { label: 'Words Tracked', value: vocab.total, icon: '📝', color: 'var(--info)' },
          { label: 'Mastered', value: vocab.mastered, icon: '✅', color: 'var(--success)' },
          { label: 'Accuracy', value: `${vocab.avgAccuracy}%`, icon: '🎯', color: '#f59e0b' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--card)',
              borderRadius: 12,
              padding: '10px 8px',
              textAlign: 'center',
              border: '1px solid var(--card-b)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP + Time Sparkline (last 7 days — real daily data) */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 10,
          border: '1px solid var(--card-b)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            7-Day Activity
          </div>
          {totalMinsThisWeek > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)' }}>
              ⏱ {totalMinsThisWeek}m this week
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
          {dailyActivity.map((day, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {day.xp > 0 && (
                <div
                  style={{ fontSize: 8, color: 'var(--subtext)', fontWeight: 700, lineHeight: 1 }}
                >
                  {day.xp}
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  height: Math.max(4, Math.round((day.xp / maxXP) * 40)),
                  background: day.isToday
                    ? 'var(--info)'
                    : day.xp > 0
                      ? 'var(--info-b, rgba(14,116,144,0.45))'
                      : 'var(--bar-bg, rgba(14,116,144,0.15))',
                  borderRadius: 3,
                  transition: 'height 0.4s ease',
                }}
              />
              <div
                style={{
                  fontSize: 9,
                  color: day.isToday ? 'var(--info)' : 'var(--subtext)',
                  fontWeight: day.isToday ? 800 : 600,
                }}
              >
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vocab Mastery Bar */}
      {vocab.total > 0 && (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            border: '1px solid var(--card-b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              Vocabulary Mastery
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
              {vocab.mastered}/{vocab.total}
            </span>
          </div>
          <div
            style={{ height: 8, background: 'var(--bar-bg)', borderRadius: 4, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round((vocab.mastered / vocab.total) * 100)}%`,
                background: 'linear-gradient(90deg, var(--success), #4ade80)',
                borderRadius: 4,
                transition: 'width 0.8s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--success)' }}>
              ✅ {vocab.mastered} mastered
            </span>
            <span style={{ fontSize: 11, color: '#f59e0b' }}>📖 {vocab.learning} learning</span>
          </div>
        </div>
      )}

      {/* Weak Words */}
      {vocab.weakWords.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            border: '1px solid var(--card-b)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--subtext)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            📈 Words to Focus On
          </div>
          {vocab.weakWords.map((w) => (
            <div
              key={w.word}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
                borderBottom: '1px solid var(--card-b)',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {w.word}
              </span>
              <span style={{ fontSize: 11, color: 'var(--error)' }}>
                {w.wrong}× missed · {w.right}× right
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1px solid var(--card-b)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--subtext)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Session Stats
        </div>
        {[
          { label: 'Lessons completed', value: lessonsCompleted, icon: '📚' },
          { label: 'Perfect scores', value: perfectScores, icon: '💎' },
          { label: 'Current streak', value: `${streak} days`, icon: '🔥' },
          { label: 'Total XP earned', value: totalXP.toLocaleString(), icon: '⭐' },
          {
            label: 'Studied this week',
            value: totalMinsThisWeek > 0 ? `${totalMinsThisWeek} min` : '—',
            icon: '⏱',
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid var(--card-b)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--subtext)' }}>
              {item.icon} {item.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
