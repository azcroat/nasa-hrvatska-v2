import React from 'react';
import StatsWidget from './StatsWidget.jsx';

export default function ProgressTabContent({ streak, st, ws, weekXP, nudgeDismissed, setNudgeDismissed }) {
  return (
    <React.Fragment>

      {/* ── TRACK PROGRESS HEADER ── */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:8}}>
        <div style={{width:3, height:20, background:'var(--harvest, #d97706)', borderRadius:2}}/>
        <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Track Progress</span>
      </div>

      {/* ── NEXT ACHIEVEMENT ── */}
      <div className="c" style={{padding:'12px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:12}}>
        <span style={{fontSize:24}}>🔓</span>
        <div style={{flex:1}}>
          <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.08em'}}>Next Achievement</div>
          <div style={{fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)', marginTop:2}}>
            {streak.count < 7 ? `🔥 Streak Starter — reach a 7-day streak (${7 - streak.count} days away)` :
             streak.count < 30 ? `🌟 Streak Master — reach a 30-day streak (${30 - streak.count} days away)` :
             st.lc < 25 ? `📚 Dedicated Learner — complete 25 lessons (${25 - st.lc} to go)` :
             '🏆 Keep going — you\'re on a great path!'}
          </div>
        </div>
      </div>

      {/* ── MILESTONES ── */}
      <StatsWidget streak={streak} st={st} ws={ws} weekXP={weekXP} />

      {/* ── ADAPTIVE DAILY GOAL NUDGE ── */}
      {(() => {
        const dailyMin = parseInt(localStorage.getItem('nh_daily_min') || '0', 10);
        if (!dailyMin || dailyMin >= 20) return null;
        // XP threshold per daily-minute tier (rough mapping)
        const thresholds = { 5: 40, 10: 80, 15: 120 };
        const xpTarget = thresholds[dailyMin] || 0;
        if (!xpTarget) return null;
        // Only nudge if enough days elapsed this week and they're clearly exceeding goal
        const dayOfWeek = new Date().getDay() || 7; // 1=Mon … 7=Sun
        if (dayOfWeek < 3) return null; // wait until Wed to have meaningful data
        const dailyAvg = weekXP / dayOfWeek;
        if (dailyAvg < xpTarget * 1.5) return null; // must be 50% over target
        const nextMin = dailyMin === 5 ? 10 : dailyMin === 10 ? 15 : 20;
        const dismissed = nudgeDismissed || localStorage.getItem('nh_goal_nudge_dismissed') === String(dailyMin);
        if (dismissed) return null;
        return (
          <div style={{
            background:'var(--success-bg)', border:'1.5px solid var(--success-b)',
            borderRadius:16, padding:'14px 16px', marginBottom:16,
            display:'flex', alignItems:'flex-start', gap:12,
          }}>
            <span style={{fontSize:22, flexShrink:0}}>🚀</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13, fontWeight:800, color:'var(--success)', marginBottom:3}}>You're crushing your goal!</div>
              <div style={{fontSize:12, color:'var(--success)', fontWeight:500, lineHeight:1.5}}>
                You're averaging {Math.round(dailyAvg)} XP/day — well above your {dailyMin}-min target.
                Ready to bump it up to {nextMin} min?
              </div>
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <button
                  onClick={() => { localStorage.setItem('nh_daily_min', String(nextMin)); localStorage.removeItem('nh_goal_nudge_dismissed'); setNudgeDismissed(true); }}
                  style={{
                    background:'var(--success)', color:'#fff', border:'none', borderRadius:10,
                    padding:'8px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                    fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  Yes, {nextMin} min/day →
                </button>
                <button
                  onClick={() => { localStorage.setItem('nh_goal_nudge_dismissed', String(dailyMin)); setNudgeDismissed(true); }}
                  style={{
                    background:'none', color:'var(--success)', border:'1.5px solid var(--success-b)', borderRadius:10,
                    padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                    fontFamily:"'Outfit',sans-serif",
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
