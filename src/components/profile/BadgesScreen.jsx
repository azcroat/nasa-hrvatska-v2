import React from 'react';
import { H, BADGES, getStreak, getSR } from '../../data.jsx';

// Returns { cur, total } for badges that have trackable numeric progress.
// Returns null for one-shot badges (gram, spk, hist, etc.)
function getBadgeProgress(b, stats) {
  const streak = getStreak().count || 0;
  const sr = getSR();
  const mastered = Object.values(sr).filter(v => v.r > v.w && v.r >= 2).length;

  const map = {
    // XP
    x100:  { cur: stats.xp,               total: 100   },
    x500:  { cur: stats.xp,               total: 500   },
    x1k:   { cur: stats.xp,               total: 1000  },
    x2k:   { cur: stats.xp,               total: 2000  },
    x5k:   { cur: stats.xp,               total: 5000  },
    x10k:  { cur: stats.xp,               total: 10000 },
    // Lessons
    first: { cur: stats.lc,               total: 1     },
    ded:   { cur: stats.lc,               total: 5     },
    lc20:  { cur: stats.lc,               total: 20    },
    lc50:  { cur: stats.lc,               total: 50    },
    lc100: { cur: stats.lc,               total: 100   },
    // Perfection
    perf:  { cur: stats.pf || 0,          total: 1     },
    perf5: { cur: stats.pf || 0,          total: 5     },
    // Streak
    str3:  { cur: streak,                 total: 3     },
    str7:  { cur: streak,                 total: 7     },
    str30: { cur: streak,                 total: 30    },
    // SRS
    srs10: { cur: stats.srsTotal || 0,    total: 10    },
    srs50: { cur: stats.srsTotal || 0,    total: 50    },
    // Mistakes mastered
    fix5:  { cur: stats.mistakesMastered || 0, total: 5 },
    // Reading
    read3: { cur: stats.readingDone || 0, total: 3     },
  };
  if (!map[b.id]) return null;
  const { cur, total } = map[b.id];
  return { cur: Math.min(cur, total), total };
}

export default function BadgesScreen({ badges, stats, goBack }) {
  const earned = badges || [];
  const st = stats || {};

  return (
    <div className="scr-wrap">
      {H("🏆 Achievements")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {BADGES.map(b => {
          const u = earned.includes(b.id);
          const prog = !u ? getBadgeProgress(b, st) : null;
          return (
            <div key={b.id} className="c" style={{textAlign:"center",opacity:u?1:.6,border:u?"2px solid #fbbf24":"1.5px dashed #e2e8f0"}}>
              <div style={{fontSize:36}}>{b.i}</div>
              <div style={{fontSize:14,fontWeight:700}}>{b.n}</div>
              <div style={{fontSize:11,color:"#78716c",marginTop:4}}>{b.d}</div>
              {u
                ? <div style={{fontSize:11,color:"#b45309",marginTop:6,fontWeight:700}}>✓ Earned</div>
                : prog
                  ? (
                    <div style={{marginTop:8}}>
                      <div style={{height:4,background:"var(--bar-bg)",borderRadius:2,overflow:"hidden",marginBottom:4}}>
                        <div style={{height:"100%",width:`${Math.round(prog.cur/prog.total*100)}%`,background:"linear-gradient(90deg,#0e7490,#06b6d4)",borderRadius:2,transition:"width .4s"}}/>
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:700}}>🔒 {prog.cur.toLocaleString()} / {prog.total.toLocaleString()}</div>
                    </div>
                  )
                  : <div style={{fontSize:10,color:"#94a3b8",marginTop:6,fontWeight:600}}>🔒 {b.d}</div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
