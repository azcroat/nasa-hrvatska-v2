import React, { useState, useRef, useMemo } from 'react';
import { getStreak, getSR } from '../../data.jsx';

export default function ProfileTab({ name, au, level, st, favs, darkMode, setDarkMode, setScr, doOut, syncReady, onSyncNow }) {
  const [confirmOut, setConfirmOut] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const doneTimerRef = useRef(null);

  // Memoized so it doesn't re-parse localStorage on every render
  const lastSaved = useMemo(() => {
    if (!au || !au.u) return null;
    try {
      const p = JSON.parse(localStorage.getItem('uP_' + au.u) || 'null');
      return p && p.savedAt ? new Date(p.savedAt) : null;
    } catch { return null; }
  }, [au, syncDone]); // refresh after a successful sync

  async function handleSyncNow() {
    if (syncing) return; // prevent overlapping calls
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    setSyncing(true); setSyncDone(false); setSyncErr(false);
    try {
      const ok = onSyncNow ? await onSyncNow() : true;
      setSyncDone(ok !== false);
      setSyncErr(ok === false);
    } catch {
      setSyncDone(false); setSyncErr(true);
    }
    setSyncing(false);
    doneTimerRef.current = setTimeout(() => { setSyncDone(false); setSyncErr(false); }, 4000);
  }
  const streak = getStreak();
  const sr = getSR();
  const mastered = Object.values(sr).filter(v => v.r > v.w && v.r >= 2).length;

  const stats = [
    { icon: "⭐", value: st.xp.toLocaleString(), label: "Total XP",   color: "#0e7490", bg: "#f0f9ff", border: "#bae6fd" },
    { icon: "🔥", value: streak.count,            label: "Day Streak", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { icon: "📚", value: st.lc,                   label: "Lessons",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { icon: "📝", value: st.gc,                   label: "Grammar",    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    { icon: "💪", value: mastered,                label: "Mastered",   color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
    { icon: "🏆", value: (st.badges||[]).length,  label: "Badges",     color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  ];

  return (
    <React.Fragment>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        background: "linear-gradient(145deg,#0c4a6e 0%,#0e7490 55%,#0369a1 100%)",
        borderRadius: 24, padding: "28px 20px 24px", marginBottom: 16,
        textAlign: "center", color: "white", position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(14,116,144,.3)"
      }}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:100,height:100,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: "rgba(255,255,255,.18)", backdropFilter: "blur(10px)",
          border: "3px solid rgba(255,255,255,.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", fontSize: 38, fontWeight: 900, color: "#fff",
          position: "relative"
        }}>
          {name ? name.charAt(0).toUpperCase() : "👤"}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:800,letterSpacing:"-.01em"}}>
          {name || au?.d}
        </h2>
        <div style={{fontSize:13,opacity:.7,marginBottom:2,fontWeight:600}}>Level {level} Learner</div>
        {au?.e && <div style={{fontSize:12,opacity:.5,marginTop:2}}>{au.e}</div>}
      </div>

      {/* ── CLOUD SYNC STATUS ── */}
      <div style={{
        background: syncErr ? "linear-gradient(135deg,#fff1f2,#fee2e2)" : syncReady ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
        border: `1.5px solid ${syncErr ? "#fca5a5" : syncReady ? "#86efac" : "#cbd5e1"}`,
        borderRadius: 16, padding: "14px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: syncErr ? "linear-gradient(135deg,#dc2626,#b91c1c)" : syncReady ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#94a3b8,#64748b)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {syncing ? "⏳" : syncErr ? "⚠️" : syncDone ? "✅" : syncReady ? "☁️" : "📵"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: syncErr ? "#dc2626" : syncReady ? "#15803d" : "#64748b" }}>
            {syncing ? "Saving to cloud…" : syncErr ? "Sync failed — check connection" : syncDone ? "Saved to cloud!" : syncReady ? "Cloud backup active" : "Connecting…"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : "No local save found"}
          </div>
        </div>
        {syncReady && (
          <button onClick={handleSyncNow} disabled={syncing} style={{
            padding: "8px 14px", borderRadius: 10, border: "none", cursor: syncing ? "default" : "pointer",
            background: syncing ? "#e2e8f0" : syncErr ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "linear-gradient(135deg,#16a34a,#15803d)",
            color: syncing ? "#94a3b8" : "#fff", fontSize: 12, fontWeight: 800,
            fontFamily: "'Outfit',sans-serif", flexShrink: 0,
          }}>
            {syncing ? "…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* ── STATS GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:24}}>
        {stats.map((s, i) => (
          <div key={i} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
            <div style={{fontSize:17,fontWeight:900,color:s.color,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ACHIEVEMENTS ── */}
      <h3 className="sh">Achievements</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("badges")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏆</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Badges</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{(st.badges||[]).length} earned</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("leaderboard")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏅</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Leaderboard</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>View rankings</div>
          </div>
        </button>
        <button className="tc" style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:14,padding:"16px"}} onClick={() => setScr("certificate")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#f0f9ff,#bae6fd)",border:"1px solid #7dd3fc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📜</div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>My Certificate</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Download your progress certificate</div>
          </div>
          <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
        </button>
      </div>

      {/* ── MY COLLECTION ── */}
      <h3 className="sh">My Collection</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("favorites")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#fef9c3,#fef08a)",border:"1px solid #fde047",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⭐</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Favorites</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{favs.length} saved</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("journal")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"1px solid #ddd6fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📓</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Vocabulary</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Personal journal</div>
          </div>
        </button>
      </div>

      {/* ── SETTINGS ── */}
      <h3 className="sh">Settings</h3>
      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}}
        onClick={() => { const nv = !darkMode; setDarkMode(nv); localStorage.setItem("darkMode", nv.toString()); }}>
        <div style={{
          width:44,height:44,borderRadius:13,
          background: darkMode ? "linear-gradient(135deg,#fef9c3,#fef08a)" : "linear-gradient(135deg,#1e293b,#334155)",
          border: darkMode ? "1px solid #fde047" : "1px solid #475569",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0
        }}>
          {darkMode ? "☀️" : "🌙"}
        </div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>{darkMode ? "Light Mode" : "Dark Mode"}</div>
          <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Switch appearance</div>
        </div>
        <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
      </button>
      <button className="tc" style={{width:"100%",textAlign:"center",padding:"14px",marginBottom:24}} onClick={() => setScr("privacy")}>
        <div style={{fontSize:13,color:"var(--subtext)",fontWeight:600}}>Privacy Policy & Terms</div>
      </button>

      {/* ── SIGN OUT ── */}
      {confirmOut ? (
        <div style={{border:"2px solid rgba(194,65,12,.2)",borderRadius:16,padding:"20px",background:"rgba(194,65,12,.04)"}}>
          <p style={{fontSize:15,fontWeight:700,color:"#c2410c",textAlign:"center",marginBottom:16}}>Sign out of Naša Hrvatska?</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmOut(false)} style={{flex:1,padding:"13px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={doOut} style={{flex:1,padding:"13px",border:"none",borderRadius:12,background:"#c2410c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmOut(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"#c2410c",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🚪 Sign Out
        </button>
      )}

    </React.Fragment>
  );
}
