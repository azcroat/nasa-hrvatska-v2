// @ts-nocheck
import React, { useMemo } from 'react';
import { H, getMistakes, getDueReviews, BADGES } from '../../data';

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function MiniBar({ label, value, max, color, icon }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          {icon} {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width .6s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────────
function StatTile({ icon, value, label, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        borderRadius: 16,
        padding: '16px 12px',
        textAlign: 'center',
        border: '1.5px solid #e2e8f0',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Badge row ──────────────────────────────────────────────────────────────────
function BadgeRow({ badge, earned }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 14,
        marginBottom: 8,
        background: earned ? 'linear-gradient(135deg,#fefce8,#fef9c3)' : '#f8fafc',
        border: earned ? '1.5px solid #fde047' : '1.5px solid #e2e8f0',
        opacity: earned ? 1 : 0.55,
      }}
    >
      <div style={{ fontSize: 24, flexShrink: 0 }}>{badge.i}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: earned ? '#78350f' : '#9ca3af' }}>
          {badge.n}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{badge.d}</div>
      </div>
      {earned && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#d97706',
            background: '#fef3c7',
            borderRadius: 20,
            padding: '2px 8px',
          }}
        >
          ✓ Earned
        </div>
      )}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function AnalyticsScreen({ goBack, stats, name }) {
  const s = stats || {};
  // Not memoised — reads localStorage; must reflect current data when stats prop updates
  const mistakes = getMistakes();
  const dueWords = getDueReviews();

  const earnedBadges = useMemo(() => {
    if (!s) return new Set();
    const earned = new Set();
    BADGES.forEach((b) => {
      try {
        if (b.r(s)) earned.add(b.id);
      } catch {}
    });
    return earned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  // XP breakdown by category (derived from stats flags)
  const categoryBreakdown = [
    { label: 'Grammar', icon: '📝', value: s.gc || 0, color: '#6366f1' },
    { label: 'Vocabulary', icon: '📖', value: s.vc || 0, color: '#0ea5e9' },
    { label: 'Speaking', icon: '🎤', value: s.sp || 0, color: '#10b981' },
    { label: 'Reading', icon: '📰', value: s.readingDone || 0, color: '#f59e0b' },
    { label: 'History', icon: '🏛️', value: s.hi || 0, color: '#8b5cf6' },
    { label: 'Modal Verbs', icon: '🔮', value: s.mv || 0, color: '#ec4899' },
  ];
  const maxCat = Math.max(...categoryBreakdown.map((c) => c.value), 1);

  // Streak info
  const streak = s.streak || 0;
  const longestStreak = s.longestStreak || streak;

  return (
    <div className="scr-wrap">
      {H('📊 My Analytics', `Keep pushing, ${name || 'learner'}!`, goBack)}

      {/* Top stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <StatTile icon="⭐" value={s.xp || 0} label="Total XP" color="#f59e0b" />
        <StatTile icon="📚" value={s.lc || 0} label="Lessons" color="#3b82f6" />
        <StatTile icon="🔥" value={streak} label="Day Streak" color="#ef4444" />
      </div>

      {/* SRS / Vocabulary mastery */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 14 }}>
          🧠 Vocabulary Mastery
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: '#f0fdf4',
              borderRadius: 12,
              padding: '12px 8px',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{s.srsTotal || 0}</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>REVIEWED</div>
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: '#eff6ff',
              borderRadius: 12,
              padding: '12px 8px',
              border: '1px solid #bfdbfe',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{dueWords.length}</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>DUE TODAY</div>
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: '#fff7ed',
              borderRadius: 12,
              padding: '12px 8px',
              border: '1px solid #fed7aa',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ea580c' }}>{mistakes.length}</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>MISTAKES</div>
          </div>
        </div>
        {dueWords.length > 0 && (
          <div
            style={{
              background: '#eff6ff',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#1d4ed8',
              fontWeight: 600,
            }}
          >
            💡 {dueWords.length} word{dueWords.length !== 1 ? 's' : ''} ready for SRS review today!
          </div>
        )}
      </div>

      {/* Streak stats */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 14 }}>
          🔥 Streaks
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg,#fff7ed,#fed7aa)',
              borderRadius: 12,
              padding: '14px 8px',
              border: '1px solid #fdba74',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: '#c2410c' }}>{streak} 🔥</div>
            <div style={{ fontSize: 11, color: '#78716c', fontWeight: 600 }}>CURRENT STREAK</div>
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg,#fefce8,#fef9c3)',
              borderRadius: 12,
              padding: '14px 8px',
              border: '1px solid #fde047',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309' }}>
              {longestStreak} 🏆
            </div>
            <div style={{ fontSize: 11, color: '#78716c', fontWeight: 600 }}>BEST STREAK</div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 14 }}>
          📈 Lessons by Category
        </div>
        {categoryBreakdown.map((cat) => (
          <MiniBar
            key={cat.label}
            label={cat.label}
            value={cat.value}
            max={maxCat}
            color={cat.color}
            icon={cat.icon}
          />
        ))}
      </div>

      {/* Badges */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>🏅 Badges</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>
            {earnedBadges.size}/{BADGES.length} earned
          </div>
        </div>
        {/* Earned first */}
        {BADGES.filter((b) => earnedBadges.has(b.id)).map((b) => (
          <BadgeRow key={b.id} badge={b} earned />
        ))}
        {BADGES.filter((b) => !earnedBadges.has(b.id)).map((b) => (
          <BadgeRow key={b.id} badge={b} earned={false} />
        ))}
      </div>

      {/* Top mistakes */}
      {mistakes.length > 0 && (
        <div className="c" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>
            ⚠️ Most Missed Words
          </div>
          {mistakes.slice(0, 5).map((m) => (
            <div
              key={m.hr}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e40af' }}>{m.hr}</span>
                {m.en && (
                  <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>— {m.en}</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#dc2626',
                  background: '#fee2e2',
                  borderRadius: 20,
                  padding: '2px 8px',
                }}
              >
                ×{m.count}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="b bg" style={{ width: '100%', marginTop: 8 }} onClick={goBack}>
        ← Back
      </button>
    </div>
  );
}
