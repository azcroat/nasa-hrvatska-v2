import React, { useState, useMemo } from 'react';

export default function XPActivityCalendar({ st }) {
  const [tooltip, setTooltip] = useState(null);

  // Collect all active days from every available localStorage source
  const activeDays = useMemo(() => {
    const result = {}; // dateStr → xp (or 1 if unknown)
    try {
      // Source 1: nh_activity_log — most precise, stores dateStr → xp
      const log = JSON.parse(localStorage.getItem('nh_activity_log') || '{}');
      Object.entries(log).forEach(([d, xp]) => {
        result[d] = (result[d] || 0) + (typeof xp === 'number' ? xp : 1);
      });
      // Source 2: xpCooldown — { exerciseId: 'YYYY-MM-DD' } — proves activity on that date
      const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
      Object.values(cd).forEach(dateStr => {
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          if (!result[dateStr]) result[dateStr] = 1;
        }
      });
      // Source 3: uStreak — { last: 'YYYY-MM-DD' } — at minimum today counts if active
      const strData = JSON.parse(localStorage.getItem('uStreak') || '{}');
      if (strData.last && typeof strData.last === 'string') {
        if (!result[strData.last]) result[strData.last] = 1;
      }
      // Source 4: quest/daily keys — presence of any key for a date means activity
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const m = k.match(/nh_(?:quest|daily)_\w+_(\d{4}-\d{2}-\d{2})$/);
        if (m) { if (!result[m[1]]) result[m[1]] = 1; }
      }
    } catch { /* ignore parse errors */ }
    return result;
  }, [st]);  

  // todayStr computed at render time (local date) so it's never stale after midnight
  const todayStr = (() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })();

  // Build 12 weeks × 7 days grid (84 days ending today) — keyed by day index so it
  // rebuilds automatically when the calendar date changes (handles long-running PWA sessions)
  const dayIndex = Math.floor(Date.now() / 86400000);
  const weeks = useMemo(() => {
    const today = new Date();
    const allDays = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      allDays.push(ds);
    }
    // Pad front so week 0 starts on Sunday (align with grid)
    const firstDow = new Date(allDays[0]).getDay(); // 0=Sun
    const padded = Array(firstDow).fill(null).concat(allDays);
    // Chunk into weeks of 7
    const wks = [];
    for (let w = 0; w < Math.ceil(padded.length / 7); w++) {
      wks.push(padded.slice(w * 7, (w + 1) * 7));
    }
    return wks;
  }, [dayIndex]);  

  function cellColor(dateStr) {
    if (!dateStr) return 'transparent';
    const xp = activeDays[dateStr] || 0;
    if (xp === 0) return 'var(--bar-bg)';
    if (xp < 50) return 'rgba(14,116,144,0.35)';
    if (xp < 150) return 'rgba(14,116,144,0.6)';
    return '#0e7490';
  }

  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Month labels: find first cell in each month
  const monthMarkers = useMemo(() => {
    const seen = new Set();
    const markers = [];
    weeks.forEach((week, wi) => {
      week.forEach((dateStr) => {
        if (!dateStr) return;
        const month = dateStr.slice(5, 7);
        if (!seen.has(month)) {
          seen.add(month);
          markers.push({ wi, label: MONTH_LABELS[parseInt(month, 10) - 1] });
        }
      });
    });
    return markers;
  }, [weeks]);  

  const activeDayCount = useMemo(
    () => Object.keys(activeDays).filter(d => d >= weeks[0]?.[0] && d <= todayStr).length,
    [activeDays, weeks, todayStr]
  );

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-b)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          📅 12-Week Activity
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)' }}>
          {activeDayCount} day{activeDayCount !== 1 ? 's' : ''} active
        </div>
      </div>

      {/* Day-of-week row labels on left */}
      <div style={{ display: 'flex', gap: 2 }}>
        {/* DOW labels column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 2, justifyContent: 'flex-start' }}>
          {DOW_LABELS.map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: 8, fontWeight: 700, color: 'var(--subtext)', lineHeight: '11px', width: 10 }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>
        {/* Week columns */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 3, minWidth: weeks.length * 13 }}>
            {weeks.map((_, wi) => {
              const marker = monthMarkers.find(m => m.wi === wi);
              return (
                <div key={wi} style={{ width: 11, fontSize: 8, fontWeight: 700, color: 'var(--subtext)', whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {marker ? marker.label : ''}
                </div>
              );
            })}
          </div>
          {/* Grid: 7 rows × N week columns */}
          <div style={{ display: 'flex', gap: 2, minWidth: weeks.length * 13 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((dateStr, di) => {
                  const isToday = dateStr === todayStr;
                  const isFuture = dateStr && dateStr > todayStr;
                  const label = dateStr
                    ? `${dateStr}${activeDays[dateStr] ? ` · ${activeDays[dateStr] > 1 ? activeDays[dateStr] + ' XP' : 'Studied'} ✓` : ''}`
                    : '';
                  return (
                    <div
                      key={di}
                      title={label}
                      onMouseEnter={e => dateStr && setTooltip({ label, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      onTouchStart={() => dateStr && setTooltip({ label, x: 0, y: 0 })}
                      onTouchEnd={() => setTooltip(null)}
                      style={{
                        width: 11, height: 11, borderRadius: 2,
                        background: isFuture ? 'transparent' : cellColor(dateStr),
                        border: isToday ? '1.5px solid #0e7490' : 'none',
                        opacity: isFuture ? 0 : 1,
                        flexShrink: 0,
                        cursor: dateStr ? 'default' : 'default',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bar-bg)', border: '1px solid var(--card-b)' }} />
          <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>No activity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(14,116,144,0.35)' }} />
          <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>Light</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(14,116,144,0.6)' }} />
          <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>Good</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0e7490' }} />
          <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>Strong</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid #0e7490', background: 'var(--bar-bg)' }} />
          <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>Today</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 36, left: Math.max(8, tooltip.x - 70),
          background: 'var(--heading)', color: 'var(--card)',
          fontSize: 11, fontWeight: 700, borderRadius: 8,
          padding: '4px 10px', pointerEvents: 'none', zIndex: 9999,
          whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.25)',
        }}>
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
