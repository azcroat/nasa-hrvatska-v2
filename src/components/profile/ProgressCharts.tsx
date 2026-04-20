// @ts-nocheck
import React, { useMemo } from 'react';

function SVGBarChart({ data, color = '#0e7490', height = 80 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 4);
        return (
          <g key={i}>
            <rect
              x={i * w + w * 0.1}
              y={height - barH - 2}
              width={w * 0.8}
              height={Math.max(barH, 1)}
              fill={d.today ? '#f59e0b' : color}
              rx={2}
              opacity={d.value === 0 ? 0.2 : 0.85}
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * @param {{ stats: { xp: number, lc: number, gc: number } }} props
 */
const ProgressCharts = React.memo(
  /** @param {{ stats: any }} props */ function ProgressCharts({ stats }) {
    const history = useMemo(() => {
      let raw = [];
      try {
        raw = JSON.parse(localStorage.getItem('progress_history') || '[]');
      } catch (_) {}
      const today = new Date().toISOString().slice(0, 10);
      // Get last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().slice(0, 10);
        const entry = raw.find((/** @type {any} */ e) => e.date === date);
        days.push({ date, xp: entry?.xp || 0, today: date === today, delta: 0 });
      }
      // Convert to daily deltas
      for (let i = days.length - 1; i > 0; i--) {
        days[i].delta = Math.max(0, days[i].xp - days[i - 1].xp);
      }
      days[0].delta = 0;
      return days;
    }, []);

    const thisWeek = history.slice(-7).reduce((s, d) => s + d.delta, 0);
    const lastWeek = history.slice(-14, -7).reduce((s, d) => s + d.delta, 0);
    const trend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

    const isNewUser = stats.xp === 0 && stats.lc === 0;

    if (isNewUser)
      return (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
            No data yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
            Complete your first lesson to start tracking your progress here.
          </div>
        </div>
      );

    return (
      <div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}
        >
          {[
            { label: 'Total XP', value: stats.xp?.toLocaleString() || '0' },
            { label: 'This Week', value: `+${thisWeek.toLocaleString()} XP` },
            {
              label: 'vs Last Week',
              value: trend >= 0 ? `▲ ${trend}%` : `▼ ${Math.abs(trend)}%`,
              color: trend >= 0 ? '#16a34a' : '#dc2626',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="c" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: color || 'var(--heading)' }}>
                {value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, marginTop: 3 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="c" style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--subtext)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            XP — Last 30 Days
          </div>
          <SVGBarChart data={history.map((d) => ({ value: d.delta || 0, today: d.today }))} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 10,
              color: 'var(--subtext)',
            }}
          >
            <span>30 days ago</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>● Today</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    );
  },
);

export default ProgressCharts;
