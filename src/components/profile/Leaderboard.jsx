import React, { useEffect, useRef, useState, useCallback } from 'react';
import { H, fbGetFamilyMembers, fbWatchFamilyMembers, fbCreateFamily, fbJoinFamily, fbLeaveFamily } from '../../data.jsx';

function getCEFRLevel(weekXP) {
  // Rough weekly XP → CEFR for leaderboard display
  if (weekXP < 50) return null;
  if (weekXP < 150) return 'A1';
  if (weekXP < 300) return 'A2';
  if (weekXP < 600) return 'B1';
  if (weekXP < 1000) return 'B2';
  return 'C1+';
}

const CEFR_COLORS = { 'A1':'#16a34a','A2':'#65a30d','B1':'#ca8a04','B2':'#b45309','C1+':'#0e7490' };

function getRecentAchievements() {
  try { return JSON.parse(localStorage.getItem('nh_journey') || '[]').slice(-10).reverse(); } catch(_) { return []; }
}

const ACHIEVEMENT_ICONS = {
  first_lesson:'📚', first_speaking:'🎤',
  streak_7:'🔥', streak_30:'🌟', streak_50:'💎', streak_100:'🏆', streak_365:'👑',
  name_day:'🎉',
};
const REACTION_EMOJIS = ['🔥','❤️','🇭🇷','👏','💪'];

export default function Leaderboard({
  goBack, authUser: au, name, stats,
  famData, setFamData,
  famMembers, setFamMembers,
  famLoading, setFamLoading,
  famName, setFamName,
  famCode, setFamCode,
  famErr, setFamErr,
  famTab, setFamTab,
}) {
  const watchRef = useRef(null);
  const [liveStatus, setLiveStatus] = useState(null); // null | 'connecting' | 'live' | 'offline'
  const [view, setView] = useState('total'); // 'total' or 'week'
  const [generation, setGeneration] = useState(() => localStorage.getItem('nh_generation') || '');
  const [reactionTick, setReactionTick] = useState(0);

  function getWeekKey() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const year = d.getFullYear();
    const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${String(week).padStart(2,'0')}`;
  }
  const myWeekXP = parseInt(localStorage.getItem('nh_week_xp_' + getWeekKey()) || '0', 10);

  function getLeagueTier(weekXP) {
    if (weekXP >= 600) return { id:'platinum', name:'Platinum', icon:'💎', color:'#7c3aed', bg:'rgba(124,58,237,.08)', border:'#c4b5fd', mult:'2.0x XP' };
    if (weekXP >= 300) return { id:'gold',     name:'Gold',     icon:'🥇', color:'#d97706', bg:'rgba(217,119,6,.08)',  border:'#fcd34d', mult:'1.5x XP' };
    if (weekXP >= 100) return { id:'silver',   name:'Silver',   icon:'🥈', color:'#6b7280', bg:'rgba(107,114,128,.08)',border:'#d1d5db', mult:'1.25x XP' };
    return                     { id:'bronze',   name:'Bronze',   icon:'🥉', color:'#b45309', bg:'rgba(180,83,9,.08)',   border:'#fcd34d', mult:'1.0x XP' };
  }

  const GENERATION_LABELS = {
    grandparent: { label: 'Baka/Djed', emoji: '👴', color: '#d97706' },
    parent:      { label: 'Parent',    emoji: '👨', color: '#0e7490' },
    adult:       { label: 'Adult',     emoji: '🧑', color: '#7c3aed' },
    teen:        { label: 'Teen',      emoji: '🧒', color: '#16a34a' },
  };

  // ── Global leaderboard pagination ─────────────────────────────────────────
  const [globalUsers, setGlobalUsers] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 20;

  const loadGlobal = useCallback(async (after) => {
    setGlobalLoading(true); setGlobalError('');
    try {
      const { getFirestore, collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
      const db = getFirestore();
      const col = collection(db, 'leaderboard');
      const q = after
        ? query(col, orderBy('xp', 'desc'), limit(PAGE_SIZE), startAfter(after))
        : query(col, orderBy('xp', 'desc'), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (after) {
        setGlobalUsers(prev => [...prev, ...docs]);
      } else {
        setGlobalUsers(docs);
      }
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch(e) {
      setGlobalError('Could not load global leaderboard. Check your connection.');
    }
    setGlobalLoading(false);
  }, []);

  // Load global leaderboard when that tab is selected
  useEffect(() => {
    if (famTab === 'global' && globalUsers.length === 0 && !globalLoading) {
      loadGlobal(null);
    }
  }, [famTab]); // eslint-disable-line

  // Real-time listener — starts when user is in a family and on the main tab,
  // fires immediately with current data and then on every remote change.
  useEffect(() => {
    // Stop any existing watcher when tab changes or famData clears
    if (watchRef.current) { watchRef.current(); watchRef.current = null; }
    if (!famData || famTab !== "main") { setLiveStatus(null); return undefined; }

    setFamLoading(true);
    setLiveStatus('connecting');

    watchRef.current = fbWatchFamilyMembers(famData.code, function(members) {
      setFamMembers(members);
      setFamLoading(false);
      setLiveStatus('live');
      try { localStorage.setItem("famCache_" + famData.code, JSON.stringify({ m: members, ts: Date.now() })); } catch {}
    });

    // If watcher returns a no-op (Firebase not ready), fall back to a one-shot read
    if (!watchRef.current || watchRef.current.toString() === 'function(){}') {
      fbGetFamilyMembers(famData.code)
        .then(m => { setFamMembers(m); setFamLoading(false); setLiveStatus('live'); })
        .catch(() => {
          setFamLoading(false); setLiveStatus('offline');
          try {
            const raw = JSON.parse(localStorage.getItem("famCache_" + famData.code) || "null");
            // Support new {m, ts} format and legacy plain array format.
            // Reject cached data older than 5 minutes to prevent stale XP scores.
            const cached = raw && raw.m && (Date.now() - (raw.ts || 0) < 300_000) ? raw.m
              : Array.isArray(raw) ? raw : null;
            if (cached && cached.length > 0) { setFamMembers(cached); setFamErr("⚠️ Showing cached results — offline"); }
          } catch {}
        });
    }

    return () => { if (watchRef.current) { watchRef.current(); watchRef.current = null; } };
  }, [famData, famTab]); // eslint-disable-line

  // Merge live local stats for the current user so their XP is always up-to-date
  const displayMembers = famMembers.map(m => {
    if (au && m.email === au.e && stats) {
      return { ...m, xp: Math.max(m.xp, stats.xp || 0), lc: Math.max(m.lc, stats.lc || 0), name: name || m.name };
    }
    return m;
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div className="scr-wrap">
      
      {H("🏆 Family Leaderboard","Compete with your family!")}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {["main","global","create","join"].map(t => (
          <button
            key={t}
            className={"b " + (famTab === t ? "bp" : "bg")}
            style={{fontSize:12,padding:"8px 14px"}}
            onClick={() => { setFamTab(t); setFamErr(""); }}>
            {t === "main" ? "🏆 Family" : t === "global" ? "🌍 Global" : t === "create" ? "➕ Create Family" : "🔗 Join Family"}
          </button>
        ))}
      </div>

      {famTab === "main" && (
        <React.Fragment>
          {famData ? (
            <React.Fragment>
              <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"linear-gradient(135deg,#fffbeb,#fef3c7)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#92400e"}}>👨‍👩‍👧‍👦 {famData.name}</div>
                    <div style={{fontSize:12,color:"#78716c",marginBottom:6}}>
                      Code: <span style={{fontWeight:800,color:"#0e7490",letterSpacing:2,fontSize:14}}>{famData.code}</span>
                    </div>
                    <button onClick={async()=>{
                      const link=`https://nasahrvatska.com/?join=${famData.code}`;
                      if(navigator.share){try{await navigator.share({title:'Join my family on Naša Hrvatska 🇭🇷',text:'Click to join and learn Croatian together!',url:link});}catch(_){}}
                      else{await navigator.clipboard.writeText(link);setFamErr("✅ Invite link copied!");setTimeout(()=>setFamErr(""),3000);}
                    }} style={{background:'linear-gradient(135deg,#0e7490,#164e63)',color:'#fff',border:'none',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                      🔗 Share Invite Link
                    </button>
                  </div>
                  <div style={{fontSize:11,padding:"3px 8px",background:famData.role === "admin" ? "#dbeafe" : "#e7e5e4",borderRadius:12,color:famData.role === "admin" ? "#1e40af" : "#78716c",fontWeight:600}}>
                    {famData.role}
                  </div>
                </div>
              </div>
              {/* ── SET GENERATION ── */}
              <div style={{marginBottom:16,background:'var(--card)',border:'1px solid var(--card-b)',borderRadius:14,padding:'14px 16px'}}>
                <div style={{fontSize:11,fontWeight:800,color:'var(--subtext)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>
                  🧬 Your Generation
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {Object.entries(GENERATION_LABELS).map(([id, g]) => (
                    <button key={id}
                      onClick={() => { localStorage.setItem('nh_generation', id); setGeneration(id); }}
                      style={{
                        padding:'10px 8px', borderRadius:10, border:`2px solid ${generation===id ? g.color : 'var(--card-b)'}`,
                        background: generation===id ? g.color+'18' : 'var(--bar-bg)',
                        color: generation===id ? g.color : 'var(--subtext)',
                        fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                      }}>
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>
              {famData && (() => {
                const tier = getLeagueTier(myWeekXP);
                return (
                  <div style={{
                    background: tier.bg, border: `1.5px solid ${tier.border}`,
                    borderRadius:14, padding:'12px 14px', marginBottom:14,
                    display:'flex', alignItems:'center', gap:12,
                  }}>
                    <span style={{fontSize:28}}>{tier.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14, fontWeight:900, color: tier.color}}>{tier.name} Division</div>
                      <div style={{fontSize:11, color:'var(--subtext)', fontWeight:600}}>
                        Your family · {tier.mult} active this week
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:18, fontWeight:900, color: tier.color}}>{myWeekXP}</div>
                      <div style={{fontSize:9, color:'var(--subtext)', fontWeight:700, textTransform:'uppercase'}}>XP this week</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button
                  className="b bp"
                  style={{flex:1,fontSize:14}}
                  onClick={() => {
                    setFamLoading(true); setFamErr(""); setLiveStatus('connecting');
                    fbGetFamilyMembers(famData.code)
                      .then(m => {
                        setFamMembers(m); setFamLoading(false); setLiveStatus('live');
                        try { localStorage.setItem("famCache_" + famData.code, JSON.stringify({ m, ts: Date.now() })); } catch {}
                      })
                      .catch(() => { setFamLoading(false); setLiveStatus('offline'); setFamErr("Could not refresh. Check your connection."); });
                  }}
                  disabled={famLoading}>
                  {famLoading ? "⏳ Loading..." : "🔄 Refresh"}
                </button>
                <div style={{fontSize:12,fontWeight:700,padding:"8px 12px",borderRadius:10,
                  background: liveStatus==='live' ? "#f0fdf4" : liveStatus==='connecting' ? "#fefce8" : liveStatus==='offline' ? "#fff1f2" : "#f8fafc",
                  color: liveStatus==='live' ? "#16a34a" : liveStatus==='connecting' ? "#a16207" : liveStatus==='offline' ? "#dc2626" : "#78716c",
                  border: "1.5px solid",
                  borderColor: liveStatus==='live' ? "#bbf7d0" : liveStatus==='connecting' ? "#fde68a" : liveStatus==='offline' ? "#fecaca" : "#e2e8f0",
                  whiteSpace:"nowrap",
                }}>
                  {liveStatus==='live' ? "● Live" : liveStatus==='connecting' ? "◌ Connecting" : liveStatus==='offline' ? "⚠ Offline" : "—"}
                </div>
              </div>
              {famErr && <div style={{color:famErr.startsWith("✅")?"#16a34a":"#dc2626",fontSize:13,marginBottom:12}}>{famErr}</div>}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {['total','week'].map(v => (
                  <button key={v}
                    onClick={() => setView(v)}
                    style={{
                      flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
                      background: view===v ? 'linear-gradient(135deg,#0e7490,#164e63)' : 'var(--bar-bg)',
                      color: view===v ? '#fff' : 'var(--subtext)',
                      fontSize:12, fontWeight:800, fontFamily:"'Outfit',sans-serif",
                    }}>
                    {v === 'total' ? '⭐ All Time' : '⚡ This Week'}
                  </button>
                ))}
              </div>
              {displayMembers.length > 0 ? displayMembers.map((u, i) => (
                <div
                  key={u.email}
                  className="c"
                  style={{display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:i === 0 ? "4px solid #f59e0b" : i === 1 ? "4px solid #9ca3af" : "4px solid #d97706"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:i === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : i === 1 ? "linear-gradient(135deg,#9ca3af,#6b7280)" : "linear-gradient(135deg,#d97706,#92400e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:20}}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700,display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
                      {u.name}{u.role === "admin" ? " 👑" : ""}
                      {au && u.email === au.e && localStorage.getItem('nh_generation') && (() => {
                        const gen = GENERATION_LABELS[localStorage.getItem('nh_generation')];
                        return gen ? (
                          <span style={{ fontSize:10, fontWeight:700, color:gen.color, background:'var(--bar-bg)', borderRadius:6, padding:'2px 6px', marginLeft:4 }}>
                            {gen.emoji} {gen.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div style={{fontSize:12,color:"#78716c"}}>{u.lc} lessons · Joined {new Date(u.joined).toLocaleDateString()}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:view==='week'?14:20,fontWeight:800,color:"#b45309",display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,flexWrap:'wrap'}}>
                      {view === 'week'
                        ? (au && u.email === au.e ? myWeekXP + ' XP this week' : '– XP this week')
                        : (u.xp.toLocaleString() + ' XP')}
                      {view === 'week' && au && u.email === au.e && getCEFRLevel(myWeekXP) && (
                        <span style={{ fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4, background: CEFR_COLORS[getCEFRLevel(myWeekXP)], color:'#fff', marginLeft:4 }}>
                          {getCEFRLevel(myWeekXP)}
                        </span>
                      )}
                    </div>
                    {view === 'total' && <div style={{fontSize:11,color:"#78716c"}}>total</div>}
                  </div>
                </div>
              )) : (
                <div className="c" style={{textAlign:"center",color:"#78716c"}}>
                  Tap 'Refresh Leaderboard' to load family scores.
                </div>
              )}
              {famData && (
                <div style={{marginTop:16}}>
                  <div style={{fontSize:11, fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10}}>
                    🎯 This Week's Family Challenges
                  </div>
                  {[
                    { name: 'Streak Champions', desc: 'Everyone on 3+ day streak', icon: '🔥', progress: Math.min(famMembers.filter(m => (m.streak||0) >= 3).length, famMembers.length), total: Math.max(famMembers.length, 1), reward: '+100 family XP' },
                    { name: 'XP Milestone', desc: 'Earn 200+ XP as a family this week', icon: '⚡', progress: Math.min(myWeekXP, 200), total: 200, reward: '1.5x XP next week' },
                    { name: 'Active Family', desc: 'All members practice this week', icon: '👨‍👩‍👧', progress: Math.min(famMembers.filter(m => (m.xp||0) > 0).length, famMembers.length), total: Math.max(famMembers.length, 1), reward: 'Unlock bonus content' },
                  ].map((ch, i) => {
                    const pct = Math.round(ch.progress / ch.total * 100);
                    const done = ch.progress >= ch.total;
                    return (
                      <div key={i} style={{background:'var(--card)', border:`1px solid ${done?'#86efac':'var(--card-b)'}`, borderRadius:12, padding:'12px 14px', marginBottom:10}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                          <span style={{fontSize:16}}>{ch.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12, fontWeight:800, color:'var(--heading)'}}>{ch.name}</div>
                            <div style={{fontSize:10, color:'var(--subtext)'}}>{ch.desc}</div>
                          </div>
                          {done && <span style={{fontSize:12, color:'#16a34a', fontWeight:800}}>✓</span>}
                        </div>
                        <div style={{height:5, background:'var(--bar-bg)', borderRadius:3, overflow:'hidden', marginBottom:4}}>
                          <div style={{height:'100%', width:pct+'%', background: done?'#16a34a':'#0e7490', borderRadius:3, transition:'width .4s'}} />
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <span style={{fontSize:10, color:'var(--subtext)', fontWeight:600}}>{pct}% complete</span>
                          <span style={{fontSize:10, color:'#0e7490', fontWeight:700}}>{ch.reward}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                style={{marginTop:20,width:"100%",padding:"12px",border:"2px solid rgba(220,38,38,.15)",borderRadius:14,background:"rgba(220,38,38,.03)",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={() => {
                  if (confirm("Leave this family group? You can rejoin with the code later.")) {
                    fbLeaveFamily(famData.code, au.e).then(r => {
                      if (r.ok) { setFamData(null); setFamMembers([]); localStorage.removeItem("uFamily"); }
                      else setFamErr("Could not leave family. Check your connection and try again.");
                    });
                  }
                }}>
                🚪 Leave Family
              </button>
            </React.Fragment>
          ) : (
            <div className="c" style={{textAlign:"center",padding:"32px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>👨‍👩‍👧‍👦</div>
              <h3 style={{color:"#164e63",marginBottom:8}}>No Family Group Yet</h3>
              <p style={{color:"#78716c",fontSize:14,marginBottom:16}}>
                Create a family group and share the code with your family members. Everyone who joins can see each other's progress and compete for the top spot!
              </p>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="b bp" onClick={() => setFamTab("create")}>➕ Create Family</button>
                <button className="b bg" onClick={() => setFamTab("join")}>🔗 Join Family</button>
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      {famTab === "global" && (
        <React.Fragment>
          <div style={{fontSize:13,color:"var(--subtext)",marginBottom:12,fontWeight:600}}>Top learners globally (first 20 shown)</div>
          {globalError && <div style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{globalError}</div>}
          {globalUsers.length > 0 && globalUsers.map((u, i) => (
            <div key={u.id} className="c" style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"10px 16px"}}>
              <div style={{fontSize:15,fontWeight:900,color:"var(--subtext)",width:28,flexShrink:0}}>#{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--heading)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name||u.id}</div>
                <div style={{fontSize:11,color:"var(--subtext)"}}>{u.lc||0} lessons</div>
              </div>
              <div style={{fontSize:15,fontWeight:800,color:"#0e7490",flexShrink:0}}>{(u.xp||0).toLocaleString()} XP</div>
            </div>
          ))}
          {globalUsers.length === 0 && !globalLoading && !globalError && (
            <div className="c" style={{textAlign:"center",color:"var(--subtext)",padding:"24px"}}>No data yet.</div>
          )}
          {globalLoading && <div style={{textAlign:"center",color:"var(--subtext)",padding:"16px"}}>⏳ Loading…</div>}
          {hasMore && !globalLoading && (
            <button className="b bg" style={{width:"100%",marginTop:12}} onClick={() => loadGlobal(lastDoc)}>
              Load More
            </button>
          )}
        </React.Fragment>
      )}

      {famTab === "create" && (
        <div className="c" style={{padding:24}}>
          <div style={{fontSize:14,color:"#44403c",marginBottom:12}}>
            Create a family group. You'll get a 6-character code to share with your family members.
          </div>
          <div style={{fontSize:12,color:"#78716c",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",marginBottom:16,lineHeight:1.6}}>
            <strong style={{color:"#0f172a"}}>Parent/guardian notice:</strong> By creating a family group you confirm you are the parent or legal guardian of any minor members you invite, and consent to their display name and XP being visible within the group. <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{color:"#0e7490"}}>Privacy Policy</a>
          </div>
          {famErr && (
            <div style={{background:famErr.startsWith("✅") ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("✅") ? "rgba(22,163,74,.2)" : "rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("✅") ? "#16a34a" : "#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>
          )}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>FAMILY NAME</label>
          <input
            type="text"
            placeholder={'e.g. "The Horvat Family"'}
            value={famName}
            onChange={e => { setFamName(e.target.value); setFamErr(""); }}
            style={{marginBottom:16}} />
          <button
            className="b bp"
            style={{width:"100%",fontSize:16}}
            disabled={famLoading}
            onClick={() => {
              if (!famName.trim()) { setFamErr("Please enter a family name."); return; }
              if (!au || !au.e) { setFamErr("You must be logged in."); return; }
              setFamLoading(true);
              fbCreateFamily(famName.trim(), au.u, au.e, name || au.d).then(r => {
                setFamLoading(false);
                if (r.ok) { setFamData(r.family); setFamTab("main"); setFamName(""); setFamErr(""); }
                else setFamErr(r.err);
              });
            }}>
            {famLoading ? "Creating..." : "👨‍👩‍👧‍👦 Create Family Group"}
          </button>
        </div>
      )}

      {famTab === "join" && (
        <div className="c" style={{padding:24}}>
          <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>
            Enter the 6-character family code that was shared with you.
          </div>
          {famErr && (
            <div style={{background:famErr.startsWith("✅") ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("✅") ? "rgba(22,163,74,.2)" : "rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("✅") ? "#16a34a" : "#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>
          )}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>FAMILY CODE</label>
          <input
            type="text"
            placeholder="e.g. AB3X7K"
            value={famCode}
            onChange={e => { setFamCode(e.target.value.toUpperCase()); setFamErr(""); }}
            maxLength={6}
            style={{marginBottom:16,textAlign:"center",letterSpacing:6,fontSize:24,fontWeight:800,textTransform:"uppercase"}} />
          <button
            className="b bp"
            style={{width:"100%",fontSize:16}}
            disabled={famLoading}
            onClick={() => {
              if (famCode.trim().length !== 6) { setFamErr("Code must be 6 characters."); return; }
              if (!au || !au.e) { setFamErr("You must be logged in."); return; }
              setFamLoading(true);
              fbJoinFamily(famCode.trim(), au.u, au.e, name || au.d).then(r => {
                setFamLoading(false);
                if (r.ok) { setFamData(r.family); setFamTab("main"); setFamCode(""); setFamErr(""); }
                else setFamErr(r.err);
              });
            }}>
            {famLoading ? "Joining..." : "🔗 Join Family"}
          </button>
        </div>
      )}

      {/* ── RECENT ACHIEVEMENTS ── */}
      {(() => {
        const achievements = getRecentAchievements();
        if (achievements.length === 0) return null;
        return (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase' }}>
                🏅 My Achievements
              </div>
              <div style={{ flex:1, height:1, background:'var(--card-b)' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {achievements.slice(0, 5).map((a, i) => {
                const icon = ACHIEVEMENT_ICONS[a.type] || '🌟';
                const date = new Date(a.date).toLocaleDateString('en-US', { month:'short', day:'numeric' });
                const reactionKey = `nh_react_${a.type}_${a.date}`;
                const reactions = JSON.parse(localStorage.getItem(reactionKey) || '{}');
                return (
                  <div key={i} style={{ background:'var(--card)', border:'1px solid var(--card-b)', borderRadius:14, padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:22 }}>{icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:'var(--heading)' }}>
                          {a.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                        </div>
                        <div style={{ fontSize:10, color:'var(--subtext)', fontWeight:600 }}>{date}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {REACTION_EMOJIS.map(emoji => {
                        const count = reactions[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            onClick={() => {
                              const updated = { ...reactions, [emoji]: (reactions[emoji] || 0) + 1 };
                              localStorage.setItem(reactionKey, JSON.stringify(updated));
                              // Force re-render by triggering a state update
                              setReactionTick(t => t + 1);
                            }}
                            style={{ padding:'4px 8px', borderRadius:8, border:'1px solid var(--card-b)', background:'var(--bar-bg)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--heading)', fontFamily:"'Outfit',sans-serif" }}
                          >
                            {emoji}{count > 0 ? ` ${count}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
