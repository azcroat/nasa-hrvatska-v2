import React, { useState, useMemo } from 'react';
import { Bar, V, LEARN_PATH, getStreak, getStreakFreezes, earnFreeze, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak, getSR, getDueReviews, getMistakes, DAILY_QUESTS, LEVEL_NARRATIVE, getActiveCampaign } from '../../data.jsx';

// Read last activity saved by App.jsx when exercises are launched
function getLastActivity() {
  const ex = localStorage.getItem('nh_last_ex');
  const label = localStorage.getItem('nh_last_ex_label');
  return ex && label ? { ex, label } : null;
}
import CroatianGrb from '../shared/CroatianGrb.jsx';
import CipkaPattern from '../shared/CipkaPattern.jsx';

const LEVEL_PALETTE = [
  { grad: "linear-gradient(135deg,#92400e,#b45309)", light: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  { grad: "linear-gradient(135deg,#065f46,#059669)", light: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { grad: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", light: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
  { grad: "linear-gradient(135deg,#4c1d95,#6d28d9)", light: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  { grad: "linear-gradient(135deg,#7f1d1d,#dc2626)", light: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" },
];

function getWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2,'0')}`;
}
function getWeekXP() {
  return parseInt(localStorage.getItem('nh_week_xp_' + getWeekKey()) || '0', 10);
}

export default function HomeTab({
  name, level, st,
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats, award,
  setTab, setScr, sCurEx,
  allCats, sh,
  launchPathItem,
  syncReady, onSyncNow, authUser,
  comebackBonus,
  goal,
}) {
  const dc = useMemo(getDailyChallenge, []);
  const ws = useMemo(() => getWeekStats(), [getWeekStats]);
  const weekXP = useMemo(getWeekXP, []);
  const streak = useMemo(getStreak, []);
  const lastActivity = useMemo(getLastActivity, []);
  const [freezes, setFreezes] = useState(getStreakFreezes);
  const [freezeMsg, setFreezeMsg] = useState('');
  const proverb = useMemo(getProverbOfDay, []);
  const fact = useMemo(getHistFact, []);
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  const userGoal = goal || localStorage.getItem('nh_goal') || 'fluent';
  const activeCampaign = useMemo(getActiveCampaign, []);

  const questsDone = useMemo(() => {
    const d = new Date().toISOString().slice(0,10);
    return {
      speak:   localStorage.getItem('nh_quest_speak_'+d) === '1',
      grammar: localStorage.getItem('nh_quest_grammar_'+d) === '1',
      master:  localStorage.getItem('nh_quest_master_'+d) === '1',
      reading: localStorage.getItem('nh_quest_reading_'+d) === '1',
      streak:  streak.count > 0,
    };
  }, [streak]);
  const allQuestsDone = Object.values(questsDone).every(Boolean);
  const questXP = DAILY_QUESTS.filter(q => questsDone[q.id]).reduce((s,q) => s + q.xp, 0);

  // Award Daily Mastery +50 XP bonus the first time all quests are done today
  const today = new Date().toISOString().slice(0,10);
  const masteryKey = `nh_daily_mastery_${today}`;
  if (allQuestsDone && !localStorage.getItem(masteryKey)) {
    localStorage.setItem(masteryKey, '1');
    award && award(50);
  }

  const allOpts = dc.challenges.map(ch => ch.opts || [ch.a]);
  const doneCount = dchlA.filter(Boolean).length;
  const allDone = doneCount === 3;

  const [dcOpen, setDcOpen] = useState(doneCount === 0);
  const [campaignDismissed, setCampaignDismissed] = useState(false);

  const longAbsence = useMemo(() => {
    const ls = localStorage.getItem('nh_last_seen');
    if (!ls) return false;
    const diff = Date.now() - parseInt(ls);
    return diff > 7 * 86400000; // more than 7 days
  }, []);

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Dobro jutro";
    if (h < 18) return "Dobar dan";
    return "Dobra večer";
  };

  const pathData = useMemo(() => {
    let totalDone = 0, totalItems = 0;
    let activeLv = null, activeLvDone = 0, nextItem = null;
    for (const lv of LEARN_PATH) {
      let lvd = 0;
      for (const it of lv.items) {
        totalItems++;
        if (it.ck(st)) { totalDone++; lvd++; }
        else if (!nextItem) nextItem = { ...it, levelTitle: lv.title };
      }
      if (!activeLv && lvd < lv.items.length) { activeLv = lv; activeLvDone = lvd; }
    }
    if (!activeLv) { activeLv = LEARN_PATH[LEARN_PATH.length - 1]; activeLvDone = activeLv.items.length; }
    return { totalDone, totalItems, pct: Math.round(totalDone / totalItems * 100), activeLv, activeLvDone, nextItem };
  }, [st]);

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];
  const nameInitial = (name || "U")[0].toUpperCase();

  return (
    <React.Fragment>

      {comebackBonus && (
        <div style={{
          background:'linear-gradient(135deg,#fef3c7,#fde68a)',
          border:'1.5px solid #f59e0b',
          borderRadius:16, padding:'16px 18px', marginBottom:16,
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 4px 16px rgba(245,158,11,.2)',
          animation:'rise .5s',
        }}>
          <span style={{fontSize:32}}>🎉</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:900,color:'#92400e'}}>Dobrodošli natrag! Welcome back!</div>
            <div style={{fontSize:12,color:'#b45309',marginTop:2,fontWeight:600}}>
              You've been away — pick up where you left off. +50 bonus XP on your first lesson today!
            </div>
          </div>
        </div>
      )}

      {longAbsence && !comebackBonus && (
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{fontSize: 26}}>🌟</span>
          <div style={{flex: 1}}>
            <div style={{fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2}}>
              Dobrodošli natrag!
            </div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5}}>
              It's been a while — Croatia is still here waiting for you. Every day you practice is a day you're closer to your family.
            </div>
            <div style={{marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
              No judgment. Just start again. 💪
            </div>
          </div>
        </div>
      )}

      {activeCampaign && !campaignDismissed && localStorage.getItem('nh_campaign_dismissed_'+activeCampaign.id) !== '1' && (
        <div style={{
          background: activeCampaign.bg, border: `1.5px solid ${activeCampaign.border}`,
          borderRadius:16, padding:'14px 16px', marginBottom:16,
          display:'flex', alignItems:'flex-start', gap:12, animation:'rise .4s',
        }}>
          <span style={{fontSize:26, flexShrink:0}}>{activeCampaign.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13, fontWeight:900, color: activeCampaign.color, marginBottom:2}}>{activeCampaign.name}</div>
            <div style={{fontSize:11, color:'var(--subtext)', fontWeight:500, lineHeight:1.5, marginBottom:6}}>{activeCampaign.blurb}</div>
            <div style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:4}}>
              <div style={{display:'inline-flex', alignItems:'center', gap:4, background: activeCampaign.color, color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:800}}>
                🚀 {activeCampaign.multiplier}x XP this season!
              </div>
              <button
                onClick={() => setTab && setTab(activeCampaign.id)}
                style={{
                  background: activeCampaign.color, color: '#fff',
                  border: 'none', borderRadius: 8, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 8
                }}
              >
                Start →
              </button>
            </div>
          </div>
          <button
            onClick={() => { setCampaignDismissed(true); localStorage.setItem('nh_campaign_dismissed_'+activeCampaign.id,'1'); }}
            style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--subtext)',padding:4,flexShrink:0}}
            aria-label="Dismiss campaign"
          >×</button>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(160deg,#060e1e 0%,#0a2348 40%,#0c3868 100%)",
        position: "relative",
        overflow: "hidden",
        color: "white",
        borderRadius: "22px 22px 0 0",
        borderBottom: "1px solid rgba(200,152,10,0.35)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>
        {/* Gold accent line — top */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, transparent 0%, #C8980A 20%, #FFE070 50%, #C8980A 80%, transparent 100%)",
        }}/>
        {/* Subtle radial glow behind content */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"radial-gradient(ellipse 70% 60% at 30% 40%, rgba(14,116,144,0.22) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>
        {/* Animated diagonal shimmer — hero polish */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"linear-gradient(105deg, transparent 25%, rgba(255,255,255,.045) 50%, transparent 75%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 4s linear infinite",
          pointerEvents:"none",
          borderRadius:"inherit",
        }}/>

        <div style={{padding:"22px 24px 44px"}}>

        {/* Top row: brand — grb + logotype */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
          <div style={{flexShrink:0,filter:"drop-shadow(0 4px 14px rgba(0,0,0,.6))"}}>
            <CroatianGrb size={64} />
          </div>
          <div>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:".01em",lineHeight:1,color:"white",fontFamily:"'Playfair Display',serif",textShadow:"0 2px 12px rgba(0,0,0,.5)"}}>Naša Hrvatska</div>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(200,152,10,0.90)",letterSpacing:".12em",textTransform:"uppercase",marginTop:5}}>Learn Croatian</div>
          </div>
        </div>

        {/* Greeting — centred, large, prominent */}
        <div style={{textAlign:"center",marginBottom:6}}>
          <div style={{
            fontSize:13,fontWeight:700,
            color:"rgba(255,255,255,.65)",
            letterSpacing:".12em",
            textTransform:"uppercase",
            marginBottom:4,
          }}>
            {greetingByTime()}
          </div>
          <div style={{
            fontSize:32,fontWeight:900,
            fontFamily:"'Playfair Display',serif",
            letterSpacing:"-.01em",lineHeight:1.1,
            textShadow:"0 2px 24px rgba(0,0,0,.5)",
          }}>
            {name || "Učenik"} 👋
          </div>
          {name && (
            <p style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.7)",marginTop:6,marginBottom:0,lineHeight:1.4}}>
              {userGoal === 'heritage' ? "Reconnecting with your roots 🇭🇷"
               : userGoal === 'family'  ? "Learning for the people you love 👨‍👩‍👧"
               : userGoal === 'partner' ? "Learning for the people you love 💙"
               : userGoal === 'travel'  ? "Croatia is waiting for you ✈️"
               : userGoal === 'culture' ? "Immerse yourself in Croatian culture 🎵"
               : "On the path to fluency 🗣️"}
            </p>
          )}
        </div>

        {/* Level badge pill */}
        <div style={{display:"inline-flex",alignItems:"center",marginBottom:16}}>
          <span style={{
            background: activePalette.grad,
            borderRadius:20,
            padding:"5px 14px",
            fontSize:11,fontWeight:800,
            color:"white",
            letterSpacing:".06em",
            textTransform:"uppercase",
            boxShadow:`0 4px 14px rgba(0,0,0,.3)`,
          }}>
            <span>Level {level}</span><span style={{opacity:.65,fontWeight:600}}> · {pathData.activeLv.title}</span>
            <span style={{marginLeft:8,background:'rgba(255,255,255,.2)',borderRadius:10,padding:'2px 7px',fontSize:10,fontWeight:700,letterSpacing:'.02em'}}>
              {LEVEL_NARRATIVE[userGoal]?.[level-1] || 'Learning'}
            </span>
          </span>
        </div>

        {/* XP bar */}
        <div style={{marginBottom:8}}>
          <div style={{
            background:"rgba(255,255,255,.15)",
            borderRadius:10,height:10,overflow:"hidden",
            boxShadow:"inset 0 1px 3px rgba(0,0,0,.2)",
          }}>
            <div className="bar-animated" style={{
              height:"100%",
              background:"linear-gradient(90deg,var(--info),#06b6d4)",
              borderRadius:10,
              width:xpPct+"%",
              transition:"width .9s cubic-bezier(.4,0,.2,1)",
              boxShadow:"0 0 18px rgba(56,189,248,.85), 0 0 36px rgba(56,189,248,.3)",
            }}/>
          </div>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:500,marginBottom:18,letterSpacing:".01em"}}>
          {xpCur.toLocaleString()} XP · Level {level + 1} in {(nXP(level) - st.xp).toLocaleString()} more XP
        </div>

        {/* Stat chips — right-side fade signals scrollability */}
        <div style={{position:"relative"}}>
        <div style={{display:"flex",gap:8,overflowX:"auto",msOverflowStyle:"none",scrollbarWidth:"none",paddingRight:24}}>
          {[
            {icon:"🔥",value:streak.count,label:"streak"},
            {icon:"⭐",value:st.xp.toLocaleString(),label:"XP total"},
            {icon:"📚",value:st.lc,label:"lessons"},
            {icon:"💪",value:ws.strong,label:"mastered"},
          ].map((s,i) => {
            const statsLoaded = st !== null && st !== undefined && st.xp !== undefined;
            return (
            <div key={i} style={{
              display:"inline-flex",alignItems:"center",gap:5,
              padding:"7px 12px",
              borderRadius:20,
              border:"1.5px solid rgba(255,255,255,.3)",
              background:"rgba(255,255,255,.14)",
              whiteSpace:"nowrap",flexShrink:0,
              backdropFilter:"blur(12px)",
              boxShadow:"0 2px 8px rgba(0,0,0,.15), 0 1px 0 rgba(255,255,255,.15) inset",
            }}>
              {s.label === "streak"
                ? <span className="anim-streak" style={{fontSize:28}}>🔥</span>
                : <span style={{fontSize:13}}>{s.icon}</span>}
              {statsLoaded
                ? <span style={{fontSize:13,fontWeight:900,color:"white",fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
                : <div className="skeleton" style={{width:36,height:16,borderRadius:6,opacity:.5}} />}
              <span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,.65)"}} title={s.label==="mastered" ? "Words with 2+ correct reviews" : undefined}>{s.label}</span>
              {s.label === "streak" && streak.count > 0 && (
                <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.75)",marginLeft:2,whiteSpace:"nowrap"}}>
                  {streak.count >= 30 ? "Ne odustaješ! 🇭🇷" : streak.count >= 7 ? "Odlično!" : "Svaki dan!"}
                </span>
              )}
            </div>
            );
          })}
        </div>{/* end scroll row */}
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:32,background:"linear-gradient(to left,rgba(10,35,72,0.85),transparent)",pointerEvents:"none",borderRadius:"0 10px 10px 0"}}/>
        </div>{/* end position:relative wrapper */}
        {/* Streak freeze */}
        <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
          {freezes>0?(
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.15)',borderRadius:20,padding:'5px 12px'}}>
              <span style={{fontSize:14}}>🛡️</span>
              <span style={{fontSize:12,color:'white',fontWeight:700}}>{freezes} streak freeze{freezes>1?'s':''}</span>
            </div>
          ):(
            <div>
              <button onClick={()=>{
                if(st.xp>=200){earnFreeze();setFreezes(f=>f+1);setFreezeMsg('✓ Streak freeze earned! Your streak is protected for one missed day.');}
                else setFreezeMsg('You need 200 XP to earn a streak freeze. Keep going!');
              }}
                style={{background:'rgba(255,255,255,.22)',border:'1.5px solid rgba(255,255,255,.6)',borderRadius:20,padding:'12px 16px',fontSize:12,color:'white',fontWeight:700,cursor:'pointer',minHeight:44,display:'flex',alignItems:'center',gap:6}}>
                <span>🛡️</span><span>Earn Streak Freeze (200 XP)</span><span style={{opacity:.7,fontSize:14}}>›</span>
              </button>
              {freezeMsg&&<div style={{fontSize:11,color:'rgba(255,255,255,.85)',marginTop:6,fontWeight:600}}>{freezeMsg}</div>}
            </div>
          )}
        </div>
        </div>{/* end padding wrapper */}
      </div>

      {/* ── CONTINUE LEARNING ── */}
      <div style={{
        background: activePalette.grad,
        borderRadius: "0 0 22px 22px",
        padding: "20px 20px 22px",
        marginBottom: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,.2)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,background:"rgba(255,255,255,.07)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,background:"rgba(0,0,0,.1)",borderRadius:"50%",pointerEvents:"none"}}/>

        <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.7)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>
          Your Next Lesson
        </div>
        <div style={{
          fontSize:20,fontWeight:900,
          fontFamily:"'Playfair Display',serif",
          color:"white",lineHeight:1.2,marginBottom:4,
          textShadow:"0 2px 8px rgba(0,0,0,.2)",
        }}>
          {!syncReady
            ? <span style={{opacity:.6,fontStyle:"italic"}}>Syncing progress…</span>
            : (pathData.nextItem?.name || "Learning Path Complete")}
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:600,marginBottom:14}}>
          Level {pathData.activeLv.level} · {pathData.activeLv.title}
        </div>

        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,.25)",borderRadius:6,height:6,overflow:"hidden",marginBottom:6}}>
          <div style={{
            height:"100%",background:"white",borderRadius:6,
            width: (pathData.activeLvDone / pathData.activeLv.items.length * 100) + "%",
            transition:"width .7s cubic-bezier(.4,0,.2,1)",
          }}/>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:500,marginBottom:16}}>
          This stage: {pathData.activeLvDone} of {pathData.activeLv.items.length} lessons
        </div>

        {/* Start Now button */}
        <button
          onClick={() => { if (!syncReady) return; if (pathData.nextItem) { launchPathItem(pathData.nextItem); } else setScr("learnpath"); }}
          style={{
            width:"100%",height:52,
            background:"white",
            color: activePalette.text,
            fontSize:16,fontWeight:800,
            border:"none",borderRadius:14,cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",
            letterSpacing:".01em",
            boxShadow:"0 4px 20px rgba(0,0,0,.25)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            transition:"transform .15s, box-shadow .15s",
            opacity: !syncReady ? 0.6 : 1,
          }}>
          <span style={{fontSize:18}}>{!syncReady ? "⏳" : "▶"}</span>
          <span>{!syncReady ? "Syncing…" : st.lc > 0 ? "Continue Learning" : "Start Learning"}</span>
        </button>

        {/* Resume last activity */}
        {lastActivity && st.lc > 0 && (
          <button
            onClick={() => { setScr(lastActivity.ex); sCurEx(lastActivity.ex); }}
            style={{
              width:"100%", marginTop:10, height:44,
              background:"rgba(255,255,255,.12)", border:"1.5px solid rgba(255,255,255,.3)",
              borderRadius:12, cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              color:"rgba(255,255,255,.9)", fontSize:13, fontWeight:700,
            }}>
            <span style={{fontSize:14}}>↩️</span>
            <span>Resume: {lastActivity.label} →</span>
          </button>
        )}
      </div>

      {/* ── CLOUD SYNC STATUS ── */}
      {(() => {
        const lastSaved = authUser && authUser.u ? (() => {
          try { const p = JSON.parse(localStorage.getItem('uP_' + authUser.u) || 'null'); return p && p.savedAt ? new Date(p.savedAt) : null; } catch { return null; }
        })() : null;
        return (
          <div style={{
            background: syncReady ? "var(--success-bg)" : "var(--bar-bg)",
            border: `1.5px solid ${syncReady ? "var(--success-b)" : "var(--card-b)"}`,
            borderRadius: 16, padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: syncReady ? "linear-gradient(135deg,var(--success),#15803d)" : "linear-gradient(135deg,#94a3b8,#64748b)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              {syncReady ? "☁️" : "⏳"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: syncReady ? "var(--success)" : "var(--subtext)", lineHeight: 1.2 }}>
                {syncReady ? "✓ Progress backed up to cloud" : "Connecting to cloud…"}
              </div>
              <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2, fontWeight: 500 }}>
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${lastSaved.toLocaleDateString()}` : syncReady ? "Saving now…" : "Please wait"}
              </div>
            </div>
            {syncReady && onSyncNow && (
              <button onClick={onSyncNow} style={{
                padding: "12px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,var(--success),#15803d)",
                color: "#fff", fontSize: 11, fontWeight: 800,
                fontFamily: "'Outfit',sans-serif", flexShrink: 0, minHeight: 44,
              }}>
                Sync Now
              </button>
            )}
          </div>
        );
      })()}

      <CipkaPattern
        color="var(--nav-active)"
        opacity={0.12}
        height={20}
        style={{ marginBottom: 16 }}
      />

      {/* ── DAILY QUESTS ── */}
      <h3 className="sh">Daily Quests</h3>
      <div className="anim-children-fade" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
        {DAILY_QUESTS.map(q => {
          const done = questsDone[q.id];
          return (
            <div key={q.id} style={{
              background: done ? 'var(--success-bg)' : 'var(--card)',
              border: `1.5px solid ${done ? 'var(--success-b)' : 'var(--inp-b,#e2e8f0)'}`,
              borderRadius:14, padding:'12px 10px', textAlign:'center',
            }}>
              <div style={{fontSize:22, marginBottom:4}}>{q.icon}</div>
              <div style={{fontSize:11, fontWeight:900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight:1.2, marginBottom:3}}>{q.name}</div>
              <div style={{fontSize:10, color:'var(--subtext)', fontWeight:600, marginBottom:6, lineHeight:1.3}}>{q.desc}</div>
              {done
                ? <div style={{fontSize:11, color:'var(--success)', fontWeight:800}}>✓ +{q.xp} XP</div>
                : <div style={{fontSize:11, color:'var(--subtext)'}}>{q.xp} XP</div>
              }
            </div>
          );
        })}
      </div>
      {allQuestsDone && (
        <div style={{background:'var(--success-bg)',border:'1.5px solid var(--success-b)',borderRadius:14,padding:'14px 16px',marginBottom:16,textAlign:'center',animation:'rise .4s'}}>
          <div style={{fontSize:20,marginBottom:4}}>🏆</div>
          <div style={{fontSize:14,fontWeight:900,color:'var(--success)'}}>Daily Mastery!</div>
          <div style={{fontSize:12,color:'var(--success)',fontWeight:600}}>+50 XP bonus · All 5 quests complete</div>
        </div>
      )}

      {/* ── PROGRESS SNAPSHOT ── */}
      <div style={{
        background:"var(--card)",
        border:`1.5px solid ${activePalette.border}`,
        borderRadius:18,padding:"14px 18px",
        marginBottom:16,
        display:"flex",alignItems:"center",gap:16,
        boxShadow:`0 4px 16px ${activePalette.border}33`,
      }}>
        <div style={{
          width:56,height:56,borderRadius:14,flexShrink:0,
          background:activePalette.grad,
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"white",fontWeight:900,fontSize:17,
          boxShadow:`0 4px 14px ${activePalette.border}55`,
        }}>
          {pathData.pct}%
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--subtext)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Overall Progress — All Stages</div>
          <div style={{fontSize:15,fontWeight:900,color:"var(--heading)"}}>
            {pathData.activeLv.title}
            <span style={{fontSize:11,fontWeight:600,color:"var(--subtext)",marginLeft:6}}>Stage {pathData.activeLv.level}</span>
          </div>
          <div style={{height:5,background:"var(--bar-bg)",borderRadius:3,overflow:"hidden",marginTop:6}}>
            <div style={{height:"100%",width:pathData.pct+"%",background:activePalette.grad,borderRadius:3,transition:"width .6s ease"}}/>
          </div>
          <div style={{fontSize:10,color:"var(--subtext)",marginTop:4,fontWeight:500}}>
            {pathData.totalDone} of {pathData.totalItems} lessons complete
          </div>
        </div>
        <button
          onClick={() => setScr("learnpath")}
          style={{
            fontSize:11,fontWeight:800,
            background:"none",border:`1.5px solid ${activePalette.border}`,
            borderRadius:10,padding:"8px 12px",cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",flexShrink:0,
            whiteSpace:"nowrap",color:activePalette.text,
          }}>
          Full Path →
        </button>
      </div>

      {/* ── SRS REVIEW NUDGE ── */}
      {(() => {
        const due = getDueReviews();
        if (due.length === 0) return null;
        return (
          <div
            onClick={() => setScr("review")}
            style={{
              background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
              border: "1.5px solid #93c5fd",
              borderRadius: 18, padding: "14px 18px", marginBottom: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 4px 16px rgba(59,130,246,.12)",
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(37,99,235,.35)",
            }}>🧠</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1e40af" }}>
                {due.length} Word{due.length !== 1 ? "s" : ""} Ready to Review
              </div>
              <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginTop: 2 }}>
                Spaced Repetition · Tap to review now →
              </div>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color: "#2563eb",
              background: "white", borderRadius: 12, width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.08)",
            }}>{due.length}</div>
          </div>
        );
      })()}

      {/* ── MISTAKES REVIEW NUDGE ── */}
      {(() => {
        const mistakes = getMistakes();
        if (mistakes.length === 0) return null;
        const topMistake = mistakes.sort((a, b) => b.count - a.count)[0];
        return (
          <div
            onClick={() => setScr("mistakes")}
            style={{
              background: "linear-gradient(135deg,#fff7ed,#fed7aa)",
              border: "1.5px solid #fdba74",
              borderRadius: 18, padding: "14px 18px", marginBottom: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 4px 16px rgba(249,115,22,.12)",
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,#ea580c,#c2410c)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(234,88,12,.35)",
            }}>📚</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#9a3412" }}>
                {mistakes.length} Mistake{mistakes.length !== 1 ? "s" : ""} to Master
              </div>
              <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginTop: 2 }}>
                Most missed: <strong>{topMistake?.hr}</strong> · Tap to review →
              </div>
            </div>
            <div style={{ fontSize: 20, color: "#ea580c", flexShrink: 0 }}>›</div>
          </div>
        );
      })()}

      {/* ── WEEKLY CHALLENGES ── */}
      {(() => {
        // Progressive milestone challenges — next tier unlocks when current is complete
        const streakGoal = streak.count >= 30 ? 100 : streak.count >= 7 ? 30 : 7;
        const lessonsGoal = st.lc >= 25 ? 50 : st.lc >= 10 ? 25 : 10;
        const masteredGoal = ws.strong >= 50 ? 100 : ws.strong >= 20 ? 50 : 20;
        const challenges = [
          { icon:'🔥', label:'Day Streak', cur: Math.min(streak.count, streakGoal), goal: streakGoal, color:'#ea580c', bg:'#fff7ed', border:'#fed7aa' },
          { icon:'📚', label:'Lessons', cur: Math.min(st.lc, lessonsGoal), goal: lessonsGoal, color:'#0e7490', bg:'#f0f9ff', border:'#bae6fd' },
          { icon:'💪', label:'Words Mastered', cur: Math.min(ws.strong, masteredGoal), goal: masteredGoal, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
          { icon:'⚡', label:'XP This Week', cur: Math.min(weekXP, 100), goal: 100, color:'#7c3aed', bg:'#faf5ff', border:'#ddd6fe' },
        ];
        return (
          <React.Fragment>
            <h3 className="sh">Milestones</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10, marginBottom:20 }}>
              {challenges.map((c, i) => {
                const pct = Math.round(c.cur / c.goal * 100);
                const done = c.cur >= c.goal;
                return (
                  <div key={i} style={{ background:c.bg, border:`1.5px solid ${done ? c.color : c.border}`, borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{c.icon}</div>
                    <div style={{ fontSize:11, fontWeight:900, color:c.color, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                      {done ? '✓' : `${c.cur}/${c.goal}`}
                    </div>
                    <div style={{ fontSize:9, color:'var(--subtext)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginTop:3 }}>{c.label}</div>
                    <div style={{ height:4, background:'var(--bar-bg)', borderRadius:3, overflow:'hidden', marginTop:6 }}>
                      <div style={{ height:'100%', width:pct+'%', background:c.color, borderRadius:3, transition:'width .6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })()}

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
        const dismissed = localStorage.getItem('nh_goal_nudge_dismissed') === String(dailyMin);
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
                  onClick={() => { localStorage.setItem('nh_daily_min', String(nextMin)); localStorage.removeItem('nh_goal_nudge_dismissed'); window.location.reload(); }}
                  style={{
                    background:'var(--success)', color:'#fff', border:'none', borderRadius:10,
                    padding:'8px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                    fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  Yes, {nextMin} min/day →
                </button>
                <button
                  onClick={() => { localStorage.setItem('nh_goal_nudge_dismissed', String(dailyMin)); window.location.reload(); }}
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

      {/* ── TODAY'S CROATIAN ── */}
      <h3 className="sh">Today's Croatian</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:14,fontWeight:500}}>
        Tap any phrase to hear it spoken aloud
      </p>

      {/* Proverb */}
      <button
        style={{
          width:"100%",
          background:"linear-gradient(135deg,#fefce8,#fef9c3)",
          border:"1.5px solid #fde047",
          borderRadius:20,
          padding:"18px",marginBottom:12,
          cursor:"pointer",textAlign:"left",
          boxShadow:"0 4px 16px rgba(234,179,8,.12)",
          fontFamily:"'Outfit',sans-serif",
          transition:"transform .15s, box-shadow .15s",
        }}
        onClick={() => speak(proverb.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#a16207",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🌟 Poslovica dana · Proverb of the Day
        </div>
        <div style={{
          fontSize:16,fontWeight:700,color:"#78350f",fontStyle:"italic",
          marginBottom:8,lineHeight:1.6,
          fontFamily:"'Playfair Display',serif",
        }}>
          "{proverb.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#92400e",fontWeight:500,lineHeight:1.4,flex:1,marginRight:12}}>{proverb.en}</span>
          <span style={{
            fontSize:11,color:"#a16207",
            background:"rgba(161,98,7,.1)",
            borderRadius:20,padding:"4px 10px",
            fontWeight:600,flexShrink:0,
          }}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* Historical Fact */}
      <button
        style={{
          width:"100%",
          background:"linear-gradient(135deg,#faf5ff,#ede9fe)",
          border:"1.5px solid #c4b5fd",
          borderRadius:20,
          padding:"18px",marginBottom:20,
          cursor:"pointer",textAlign:"left",
          boxShadow:"0 4px 16px rgba(124,58,237,.1)",
          fontFamily:"'Outfit',sans-serif",
          transition:"transform .15s, box-shadow .15s",
        }}
        onClick={() => speak(fact.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#6d28d9",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🏛️ Povijesna činjenica · Historical Fact
        </div>
        <div style={{
          fontSize:16,fontWeight:700,color:"#3b0764",fontStyle:"italic",
          marginBottom:8,lineHeight:1.6,
          fontFamily:"'Playfair Display',serif",
        }}>
          "{fact.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#5b21b6",fontWeight:500,lineHeight:1.4,flex:1,marginRight:12}}>{fact.en}</span>
          <span style={{
            fontSize:11,color:"#6d28d9",
            background:"rgba(109,40,217,.1)",
            borderRadius:20,padding:"4px 10px",
            fontWeight:600,flexShrink:0,
          }}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* ── QUICK TRANSLATE ── */}
      <h3 className="sh">Quick Translate</h3>
      <div style={{
        background:"var(--card)",
        border:"1.5px solid var(--card-b)",
        borderRadius:20,padding:"18px",
        marginBottom:24,
        boxShadow:"0 4px 16px rgba(0,0,0,.05)",
      }}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button
            style={{
              background:"var(--bar-bg)",
              border:"1.5px solid var(--card-b)",
              borderRadius:10,padding:"6px 14px",
              fontSize:12,fontWeight:700,color:"var(--body)",
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",
              transition:"background .15s",
            }}
            onClick={() => sTDir(tDir==="en-hr"?"hr-en":"en-hr")}>
            {tDir==="en-hr"?"EN → HR ⇄":"HR → EN ⇄"}
          </button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            type="text"
            value={tIn}
            onChange={e=>sTIn(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")doTr()}}
            placeholder={tDir==="en-hr"?"Type English…":"Unesite hrvatski…"}
            style={{flex:1,fontSize:14,padding:"12px 14px"}}
          />
          <button className="b bp" style={{fontSize:14,padding:"12px 20px",whiteSpace:"nowrap"}} onClick={doTr} disabled={tL}>
            {tL ? "⏳" : "Go"}
          </button>
        </div>
        {tOut && (
          <button
            style={{
              width:"100%",marginTop:12,padding:"14px 16px",
              background:"var(--bar-bg)",borderRadius:14,
              border:"1.5px solid var(--card-b)",
              fontSize:16,fontWeight:700,color:"var(--heading)",
              cursor:"pointer",textAlign:"left",
              fontFamily:"'Outfit',sans-serif",
              display:"flex",justifyContent:"space-between",alignItems:"center",
              boxShadow:"0 2px 8px rgba(14,116,144,.08)",
            }}
            onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
            <span>{tOut}</span>
            <span style={{fontSize:20}}>🔊</span>
          </button>
        )}
      </div>

    </React.Fragment>
  );
}
