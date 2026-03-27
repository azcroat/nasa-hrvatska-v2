import React, { useState, useMemo } from 'react';
import { Bar, V, LEARN_PATH, getStreak, getStreakFreezes, earnFreeze, getDailyChallenge, lXP, nXP, speak, getSR, getDueReviews, getMistakes, DAILY_QUESTS, LEVEL_NARRATIVE, getActiveCampaign } from '../../data.jsx';

// Read last activity saved by App.jsx when exercises are launched
function getLastActivity() {
  const ex = localStorage.getItem('nh_last_ex');
  const label = localStorage.getItem('nh_last_ex_label');
  return ex && label ? { ex, label } : null;
}
import CroatianGrb from '../shared/CroatianGrb.jsx';
import CipkaPattern from '../shared/CipkaPattern.jsx';
import CroatianKnight from '../shared/CroatianKnight';
import KnightSpeech from '../shared/KnightSpeech';
import { DalmatianCoast } from '../illustrations';

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
  const [streakRestored, setStreakRestored] = useState(false);
  const [streakRestoreMsg, setStreakRestoreMsg] = useState('');
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  const userGoal = goal || localStorage.getItem('nh_goal') || 'fluent';
  const activeCampaign = useMemo(getActiveCampaign, []);

  const [htab, setHTab] = useState('today');

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

  const campaignQuestsDone = useMemo(() => {
    if (!activeCampaign || !activeCampaign.quests || activeCampaign.quests.length === 0) return {};
    const result = {};
    for (const q of activeCampaign.quests) {
      result[q.id] = localStorage.getItem(`nh_cq_${activeCampaign.id}_${q.id}`) === '1';
    }
    return result;
  }, [activeCampaign]);

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

  const SkeletonBar = ({ w = '100%', h = 16, r = 8, mt = 0 }) => (
    <div style={{width:w, height:h, borderRadius:r, marginTop:mt,
      background:'linear-gradient(90deg, var(--bar-bg) 25%, var(--card-b) 50%, var(--bar-bg) 75%)',
      backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite'}} />
  );

  return (
    <React.Fragment>

      {comebackBonus && (
        <div style={{
          background:'var(--warning-bg)',
          border:'1.5px solid var(--warning-b)',
          borderRadius:16, padding:'16px 18px', marginBottom:16,
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 4px 16px rgba(245,158,11,.2)',
          animation:'rise .5s',
        }}>
          <span style={{fontSize:32}}>🎉</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:900,color:'var(--warning)'}}>Dobrodošli natrag! Welcome back!</div>
            <div style={{fontSize:12,color:'var(--warning)',marginTop:2,fontWeight:600,opacity:.85}}>
              You've been away — pick up where you left off. +50 bonus XP on your first lesson today!
            </div>
          </div>
        </div>
      )}

      {longAbsence && !comebackBonus && (
        <div style={{
          background: 'linear-gradient(135deg, var(--lavender, #7c3aed), #4f46e5)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{fontSize: 26}}>🌟</span>
          <div style={{flex: 1}}>
          <CroatianKnight size={60} mood="thinking" style={{float:'right', marginLeft:12}} />
            <div style={{fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2}}>
              Great to have you back!
            </div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5}}>
              Let's pick up right where you left off. Your Croatian is still here waiting for you.
            </div>
            <div style={{marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
              Your streak is waiting to be rebuilt. One lesson is all it takes. 💪
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(160deg,var(--grad-start,#060e1e) 0%,var(--grad-mid,#0a2348) 40%,var(--grad-end,#0c3868) 100%)",
        position: "relative",
        overflow: "hidden",
        color: "white",
        borderRadius: "22px 22px 0 0",
        borderBottom: "1px solid rgba(200,152,10,0.35)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>
        {/* Croatian identity stripe — gold line */}
        <div style={{ position:'relative' }}>
          <div style={{
            height: 3,
            background: "linear-gradient(90deg, transparent 0%, var(--gold, #C8980A) 20%, var(--harvest, #FFE070) 50%, var(--gold, #C8980A) 80%, transparent 100%)",
          }}/>
        </div>

        <div style={{padding:"16px 20px 20px"}}>

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
            fontSize:24,fontWeight:900,
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

        {/* ── PREMIUM STATS: Streak card + XP ring ── */}
        <div style={{display:'flex',gap:10,marginBottom:12,marginTop:8}}>

          {/* Streak card */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
            background:'rgba(255,255,255,.09)',borderRadius:20,padding:'18px 10px 14px',
            border:'1px solid rgba(255,255,255,.14)',backdropFilter:'blur(12px)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,.12)'}}>
            <span className="anim-streak" style={{fontSize:34,lineHeight:1,marginBottom:2}}>🔥</span>
            <div style={{fontSize:46,fontWeight:900,color:'white',lineHeight:1,fontVariantNumeric:'tabular-nums',
              fontFamily:"'Outfit',sans-serif",textShadow:'0 0 28px rgba(251,146,60,.75)',marginTop:3}}>
              {streak.count}
            </div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:6}}>
              day streak
            </div>
            {streak.count === 0 ? (
              <div style={{fontSize:10,fontWeight:800,color:'rgba(253,186,116,.95)',marginTop:5}}>
                Start your streak! Complete a lesson today 🔥
              </div>
            ) : (
              <div style={{fontSize:10,fontWeight:800,color:'rgba(253,186,116,.95)',marginTop:5}}>
                {streak.count >= 30 ? '🇭🇷 Legend!' : streak.count >= 7 ? '⚡ Odlično!' : '✓ Keep going!'}
              </div>
            )}
            {streak.count >= 25 && streak.count < 30 && <div style={{fontSize:10, color:'#d97706', fontWeight:700, marginTop:2}}>5 more days to legendary status! ⭐</div>}
            {streak.count >= 7 && streak.count < 25 && <div style={{fontSize:10, color:'rgba(255,255,255,.6)', marginTop:2}}>{30 - streak.count} days to Legend status</div>}
            {freezes > 0 && (
              <div title="Zaštita niza — Streak shield" style={{marginTop:8,display:'flex',alignItems:'center',gap:3,
                background:'rgba(59,130,246,.18)',border:'1px solid rgba(59,130,246,.35)',borderRadius:10,padding:'4px 9px'}}>
                <span style={{fontSize:12}}>🛡️</span>
                <span style={{fontSize:9,color:'rgba(147,197,253,.95)',fontWeight:800}}>×{freezes} Zaštita niza</span>
              </div>
            )}
          </div>

          {/* XP progress ring */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
            background:'rgba(255,255,255,.09)',borderRadius:20,padding:'14px 10px 12px',
            border:'1px solid rgba(255,255,255,.14)',backdropFilter:'blur(12px)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,.12)'}}>
            <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
              <defs>
                <linearGradient id="xpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8"/>
                  <stop offset="100%" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
              {/* Glow halo */}
              <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(56,189,248,.1)" strokeWidth="14"/>
              {/* Track */}
              <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8"/>
              {/* Fill */}
              <circle cx="48" cy="48" r="38" fill="none"
                stroke="url(#xpRingGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray="238.76"
                strokeDashoffset={238.76 * (1 - xpPct / 100)}
                style={{
                  transform:'rotate(-90deg)',transformOrigin:'48px 48px',
                  transition:'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)',
                  filter:'drop-shadow(0 0 5px rgba(56,189,248,.9))',
                }}
              />
              {/* Level number */}
              <text x="48" y="45" textAnchor="middle" fontSize="26" fontWeight="900" fill="white"
                fontFamily="Outfit,sans-serif" style={{fontVariantNumeric:'tabular-nums'}}>{level}</text>
              <text x="48" y="60" textAnchor="middle" fontSize="9" fontWeight="800"
                fill="rgba(255,255,255,.55)" fontFamily="Outfit,sans-serif" letterSpacing="2">LEVEL</text>
            </svg>
            <div style={{fontSize:10,fontWeight:800,color:'rgba(96,205,250,.95)',marginTop:1,letterSpacing:'.04em'}}>
              {xpPct}% → Lv {level+1}
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.45)',marginTop:3,fontWeight:600}}>
              {(nXP(level)-st.xp).toLocaleString()} XP to go
            </div>
          </div>
        </div>

        {/* Mini stat row */}
        <div style={{display:'flex',gap:7,marginBottom:freezes===0?11:14}}>
          {[
            {icon:'📚', value:st.lc, label:'lessons'},
            {icon:'💪', value:ws.strong, label:'mastered'},
            {icon:'⭐', value:st.xp.toLocaleString(), label:'total XP'},
          ].map((s,i) => (
            <div key={i} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              background:'rgba(255,255,255,.07)',borderRadius:12,padding:'8px 4px',
              border:'1px solid rgba(255,255,255,.09)'}}>
              <span style={{fontSize:15}}>{s.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:900,color:'white',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{s.value}</div>
                <div style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.05em'}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Streak freeze — compact */}
        {freezes===0 && (
          <div>
            <button onClick={()=>{
              if(st.xp>=200){earnFreeze();setFreezes(f=>f+1);setFreezeMsg('✓ Streak freeze earned! Your streak is protected for one missed day.');}
              else setFreezeMsg('You need 200 XP to earn a streak freeze. Keep going!');
            }}
              style={{background:'rgba(255,255,255,.09)',border:'1.5px solid rgba(255,255,255,.25)',borderRadius:12,
                padding:'9px 14px',fontSize:11,color:'rgba(255,255,255,.75)',fontWeight:700,
                cursor:'pointer',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                gap:6,minHeight:40,fontFamily:"'Outfit',sans-serif"}}>
              <span>🛡️</span><span>Earn Streak Freeze · 200 XP</span>
            </button>
            {freezeMsg&&<div style={{fontSize:10,color:'rgba(255,255,255,.8)',marginTop:5,fontWeight:600,textAlign:'center'}}>{freezeMsg}</div>}
          </div>
        )}

        {/* Streak Recovery — show when streak is 0, user has 200 XP, and hasn't restored today */}
        {streak.count === 0 && st.xp >= 200 && !streakRestored && !localStorage.getItem('nh_streak_restored_' + today) && (
          <div style={{marginTop:8}}>
            <button
              onClick={() => {
                award && award(-200, false);
                localStorage.setItem('nh_streak_restored_' + today, '1');
                // Write streak back to 1 using the uStreak key (same format as getStreak in data.jsx)
                localStorage.setItem('uStreak', JSON.stringify({ count: 1, last: today }));
                setStreakRestored(true);
                setStreakRestoreMsg('✓ Streak restored! Keep it alive today 🔥');
                if (onSyncNow) onSyncNow();
              }}
              style={{
                background:'transparent',
                border:'1.5px solid rgba(255,255,255,.4)',
                borderRadius:12,
                padding:'9px 14px',
                fontSize:11,
                color:'rgba(255,255,255,.85)',
                fontWeight:700,
                cursor:'pointer',
                width:'100%',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:6,
                minHeight:40,
                fontFamily:"'Outfit',sans-serif",
              }}>
              <span>🔄</span><span>Restore streak — 200 XP</span>
            </button>
            {streakRestoreMsg && (
              <div style={{fontSize:10,color:'rgba(253,186,116,.95)',marginTop:5,fontWeight:700,textAlign:'center'}}>
                {streakRestoreMsg}
              </div>
            )}
          </div>
        )}
        {streakRestored && streakRestoreMsg && (
          <div style={{fontSize:10,color:'rgba(253,186,116,.95)',marginTop:5,fontWeight:700,textAlign:'center'}}>
            {streakRestoreMsg}
          </div>
        )}
        </div>{/* end padding wrapper */}
      </div>

      {/* Daily Goal Progress */}
      {(() => {
        const dailyTarget = parseInt(localStorage.getItem('nh_daily_goal_xp') || '50', 10);
        const todayKey = 'nh_day_xp_' + new Date().toISOString().slice(0,10);
        const todayXp = parseInt(localStorage.getItem(todayKey) || '0', 10);
        const pct = Math.min(1, todayXp / dailyTarget);
        const done = pct >= 1;
        return (
          <div style={{margin:'12px 0 8px', padding:'12px 16px', background:'var(--card)',
            borderRadius:14, border:'1px solid var(--card-b)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--subtext)',textTransform:'uppercase',letterSpacing:'.08em'}}>
                Daily Goal
              </span>
              <span style={{fontSize:'var(--text-xs)',fontWeight:700,color: done ? 'var(--success)' : 'var(--info)'}}>
                {done ? '✅ Complete!' : `${todayXp} / ${dailyTarget} XP`}
              </span>
            </div>
            <div style={{height:8,borderRadius:4,background:'var(--bar-bg)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,width:`${pct*100}%`,
                background: done ? 'var(--success)' : 'linear-gradient(90deg,var(--info),#38bdf8)',
                transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)'}} />
            </div>
            {done && <div style={{fontSize:'var(--text-xs)',color:'var(--success)',marginTop:6,fontWeight:600}}>
              🎉 Goal reached! Every extra XP builds your lead.
            </div>}
          </div>
        );
      })()}

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div style={{ display:'flex', gap:8, padding:'12px 0 4px', borderBottom:'1px solid var(--bar-bg)', marginBottom:16 }}>
        {[
          { id:'today',    label:'⚡ Today' },
          { id:'progress', label:'📈 Progress' },
          { id:'review',   label:'🔄 Review' },
        ].map(t => (
          <button key={t.id} onClick={() => setHTab(t.id)} style={{
            flex:1, padding:'8px 4px', borderRadius:20, border:'none',
            background: htab === t.id ? 'var(--info)' : 'var(--bar-bg)',
            color: htab === t.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer',
            transition:'background 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          ⚡ TODAY TAB
      ══════════════════════════════════════════ */}
      {htab === 'today' && (
        <React.Fragment>

          {/* Campaign banner */}
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
                {activeCampaign.quests && activeCampaign.quests.length > 0 && (() => {
                  const allCampaignDone = activeCampaign.quests.every(q => campaignQuestsDone[q.id]);
                  const earnedXP = activeCampaign.quests.filter(q => campaignQuestsDone[q.id]).reduce((s, q) => s + q.xp, 0);
                  const totalXP = activeCampaign.quests.reduce((s, q) => s + q.xp, 0);
                  return (
                    <div style={{marginTop:10}}>
                      {allCampaignDone ? (
                        <div style={{fontSize:12, fontWeight:800, color: activeCampaign.color}}>
                          🏆 Campaign complete! All quests done.
                        </div>
                      ) : (
                        <>
                          <div style={{fontSize:10, fontWeight:800, color: activeCampaign.color, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4}}>
                            Quests
                          </div>
                          {activeCampaign.quests.map(q => {
                            const done = campaignQuestsDone[q.id];
                            return (
                              <div
                                key={q.id}
                                onClick={() => !done && (setScr ? setScr(q.screen) : setTab && setTab(q.screen))}
                                style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0', cursor: done ? 'default' : 'pointer'}}
                              >
                                <span style={{fontSize:14, color: done ? activeCampaign.color : 'var(--subtext)', flexShrink:0}}>
                                  {done ? '✓' : '○'}
                                </span>
                                <span style={{
                                  fontSize:11, fontWeight:500, flex:1,
                                  color: done ? activeCampaign.color : 'var(--rt-c)',
                                  opacity: done ? 1 : 0.85,
                                  textDecoration: done ? 'line-through' : 'none',
                                }}>
                                  {q.label}
                                </span>
                                <span style={{
                                  fontSize:10, fontWeight:800,
                                  background: done ? activeCampaign.color : 'var(--bar-bg)',
                                  color: done ? '#fff' : 'var(--subtext)',
                                  borderRadius:6, padding:'2px 6px', flexShrink:0,
                                }}>
                                  +{q.xp} XP
                                </span>
                              </div>
                            );
                          })}
                          <div style={{fontSize:10, fontWeight:700, color:'var(--subtext)', marginTop:6}}>
                            Campaign XP: {earnedXP} / {totalXP}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => { setCampaignDismissed(true); localStorage.setItem('nh_campaign_dismissed_'+activeCampaign.id,'1'); }}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--subtext)',padding:4,flexShrink:0}}
                aria-label="Dismiss campaign"
              >×</button>
            </div>
          )}

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

            {!syncReady ? (
              <div style={{padding:'16px 0'}}>
                <SkeletonBar h={20} w="60%" r={10} />
                <SkeletonBar h={14} w="80%" r={8} mt={10} />
                <SkeletonBar h={48} r={14} mt={14} />
              </div>
            ) : (
              <>
                <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.7)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>
                  Your Next Lesson
                </div>
                <div style={{
                  fontSize:20,fontWeight:900,
                  fontFamily:"'Playfair Display',serif",
                  color:"white",lineHeight:1.2,marginBottom:4,
                  textShadow:"0 2px 8px rgba(0,0,0,.2)",
                }}>
                  {pathData.nextItem?.name || "Learning Path Complete"}
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
                  onClick={() => { if (pathData.nextItem) { launchPathItem(pathData.nextItem); } else setScr("learnpath"); }}
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
                  }}>
                  <span style={{fontSize:18}}>▶</span>
                  <span>{st.lc > 0 ? "Continue Learning" : "Start Learning"}</span>
                </button>

                {/* Practice Now — always visible for returning users */}
                {st.lc > 0 && (
                  <button
                    onClick={() => setTab && setTab('practice')}
                    style={{
                      width:"100%", marginTop:10, height:44,
                      background:"rgba(255,255,255,.12)", border:"1.5px solid rgba(255,255,255,.3)",
                      borderRadius:12, cursor:"pointer",
                      fontFamily:"'Outfit',sans-serif",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      color:"rgba(255,255,255,.9)", fontSize:13, fontWeight:700,
                    }}>
                    <span style={{fontSize:14}}>🎮</span>
                    <span>Start Practicing →</span>
                  </button>
                )}

                {/* Resume last activity */}
                {lastActivity && st.lc > 0 && (
                  <button
                    onClick={() => { setScr(lastActivity.ex); sCurEx(lastActivity.ex); }}
                    style={{
                      width:"100%", marginTop:8, height:44,
                      background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)",
                      borderRadius:12, cursor:"pointer",
                      fontFamily:"'Outfit',sans-serif",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      color:"rgba(255,255,255,.9)", fontSize:13, fontWeight:700,
                    }}>
                    <span style={{fontSize:14}}>↩️</span>
                    <span>Resume: {lastActivity.label} →</span>
                  </button>
                )}
              </>
            )}
          </div>

          <KnightSpeech st={st} />

          {/* ── TODAY'S FOCUS HEADER ── */}
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:24}}>
            <div style={{width:3, height:20, background:'var(--info)', borderRadius:2}}/>
            <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Today's Focus</span>
          </div>

          {/* ── DAILY QUESTS ── */}
          {(() => {
            const questScreenMap = { speak:'speaking', grammar:'grammar-screen', master:'flashcards', reading:'reading-list', streak:'learnpath' };
            const questBtnLabel = { speak:'Start →', grammar:'Start →', master:'Start →', reading:'Start →', streak:'Do a lesson →' };
            const questsDoneCount = DAILY_QUESTS.filter(q => questsDone[q.id]).length;
            return (<>
              <div className="section-hdr">
                <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🎯</div>
                <div className="section-hdr-text">
                  <div className="section-hdr-title">Daily Quests</div>
                  <div className="section-hdr-sub">Complete quests to earn bonus XP</div>
                </div>
                <div className="section-hdr-badge">{questsDoneCount}/5</div>
              </div>
              <div className="anim-children-fade" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
                {DAILY_QUESTS.map(q => {
                  const done = questsDone[q.id];
                  return (
                    <div key={q.id} style={{
                      background: done ? 'var(--success-bg)' : 'var(--card)',
                      border: `1.5px solid ${done ? 'var(--success-b)' : 'var(--inp-b,#e2e8f0)'}`,
                      borderRadius:14, padding:'16px 12px', textAlign:'center',
                      display:'flex', flexDirection:'column', alignItems:'center',
                    }}>
                      <div style={{fontSize:30, marginBottom:5}}>{q.icon}</div>
                      <div style={{fontSize:11, fontWeight:900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight:1.2, marginBottom:3}}>{q.name}</div>
                      <div style={{fontSize:10, color:'var(--subtext)', fontWeight:600, marginBottom:8, lineHeight:1.3}}>{q.desc}</div>
                      {done
                        ? <div style={{fontSize:18, color:'var(--success)', fontWeight:900, animation:'bounce-in .4s', lineHeight:1}}>✓</div>
                        : <button
                            onClick={() => setScr(questScreenMap[q.id])}
                            style={{
                              marginTop:'auto', fontSize:11, fontWeight:800,
                              color:'#ffffff',
                              background:'linear-gradient(135deg,var(--accent,#0e7490),#0284c7)',
                              border:'none',
                              borderRadius:8, padding:'5px 12px', cursor:'pointer',
                              lineHeight:1.4,
                              boxShadow:'0 2px 8px rgba(14,116,144,.35)',
                            }}
                          >
                            {questBtnLabel[q.id]}
                          </button>
                      }
                      {done && <div style={{fontSize:10, color:'var(--success)', fontWeight:700, marginTop:3}}>+{q.xp} XP</div>}
                      {!done && <div style={{fontSize:10, color:'var(--subtext)', marginTop:4}}>{q.xp} XP</div>}
                    </div>
                  );
                })}
              </div>
            </>);
          })()}
          {allQuestsDone && (
            <div style={{background:'var(--success-bg)',border:'1.5px solid var(--success-b)',borderRadius:14,padding:'14px 16px',marginBottom:16,textAlign:'center',animation:'rise .4s'}}>
              <div style={{fontSize:20,marginBottom:4}}>🏆</div>
              <div style={{fontSize:14,fontWeight:900,color:'var(--success)'}}>Daily Mastery!</div>
              <div style={{fontSize:12,color:'var(--success)',fontWeight:600}}>+50 XP bonus · All 5 quests complete</div>
            </div>
          )}

          {/* ── DISCOVER CROATIAN HEADER ── */}
          <DalmatianCoast width="100%" height={140} style={{borderRadius:16, marginBottom:12, maxWidth:'100%'}}/>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:24}}>
            <div style={{width:3, height:20, background:'var(--color-croatian, #b61800)', borderRadius:2}}/>
            <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Discover Croatian</span>
          </div>

          {/* ── TODAY'S CROATIAN ── */}
          <div className="section-hdr">
            <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🇭🇷</div>
            <div className="section-hdr-text">
              <div className="section-hdr-title">Today's Croatian</div>
              <div className="section-hdr-sub">Tap any phrase to hear it spoken aloud</div>
            </div>
          </div>

          {/* ── QUICK TRANSLATE ── */}
          <div className="section-hdr">
            <div className="section-hdr-icon" style={{background:'rgba(14,116,144,.12)'}}>⇄</div>
            <div className="section-hdr-text">
              <div className="section-hdr-title">Quick Translate</div>
              <div className="section-hdr-sub">English ↔ Croatian instant lookup</div>
            </div>
          </div>
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
      )}

      {/* ══════════════════════════════════════════
          📈 PROGRESS TAB
      ══════════════════════════════════════════ */}
      {htab === 'progress' && (
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

          {/* ── MILESTONES (conditional on lc > 0) ── */}
          {st.lc === 0 ? (
            <div className="c" style={{padding:16, marginBottom:8}}>
              <CroatianKnight size={80} mood="happy" style={{margin:'0 auto 12px', display:'block'}} />
              <div style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', marginBottom:8}}>🗺️ Your Croatian Journey</div>
              <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', lineHeight:1.5}}>
                Start with <strong>Basic Greetings</strong> → <strong>Numbers</strong> → <strong>Family Vocabulary</strong>. Each lesson takes 5–10 minutes.
              </div>
            </div>
          ) : (
            <>
              {(() => {
                // Progressive milestone challenges — next tier unlocks when current is complete
                const streakGoal = streak.count >= 30 ? 100 : streak.count >= 7 ? 30 : 7;
                const lessonsGoal = st.lc >= 25 ? 50 : st.lc >= 10 ? 25 : 10;
                const masteredGoal = ws.strong >= 50 ? 100 : ws.strong >= 20 ? 50 : 20;
                const challenges = [
                  { icon:'🔥', label:'Day Streak', cur: Math.min(streak.count, streakGoal), goal: streakGoal, color:'#ea580c' },
                  { icon:'📚', label:'Lessons', cur: Math.min(st.lc, lessonsGoal), goal: lessonsGoal, color:'#0e7490' },
                  { icon:'💪', label:'Words Mastered', cur: Math.min(ws.strong, masteredGoal), goal: masteredGoal, color:'#16a34a' },
                  { icon:'⚡', label:'XP This Week', cur: Math.min(weekXP, 100), goal: 100, color:'#7c3aed' },
                ];
                return (
                  <React.Fragment>
                    <div className="section-hdr">
                      <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>🏆</div>
                      <div className="section-hdr-text">
                        <div className="section-hdr-title">Milestones</div>
                        <div className="section-hdr-sub">Track your streaks, lessons & XP goals</div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10, marginBottom:20 }}>
                      {challenges.map((c, i) => {
                        const pct = Math.round(c.cur / c.goal * 100);
                        const done = c.cur >= c.goal;
                        return (
                          <div key={i} style={{ background:c.color+'15', border:`1.5px solid ${done ? c.color : c.color+'40'}`, borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
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
            </>
          )}

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

        </React.Fragment>
      )}

      {/* ══════════════════════════════════════════
          🔄 REVIEW TAB
      ══════════════════════════════════════════ */}
      {htab === 'review' && (
        <React.Fragment>

          {/* ── REVIEW & REINFORCE HEADER ── */}
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:8}}>
            <div style={{width:3, height:20, background:'var(--lavender, #7c3aed)', borderRadius:2}}/>
            <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Review & Reinforce</span>
          </div>

          {/* ── SRS REVIEW NUDGE ── */}
          {(() => {
            const due = getDueReviews();
            if (due.length === 0) return null;
            return (
              <div
                onClick={() => setScr("review")}
                style={{
                  background: "linear-gradient(135deg,var(--info-bg),rgba(14,116,144,.1))",
                  border: "1.5px solid var(--info-b)",
                  borderRadius: 18, padding: "14px 18px", marginBottom: 16,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 4px 16px rgba(14,116,144,.15)",
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: "linear-gradient(135deg,#0e7490,#0284c7)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  boxShadow: "0 4px 12px rgba(14,116,144,.35)",
                }}>🧠</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--info)" }}>
                    {due.length} Word{due.length !== 1 ? "s" : ""} Ready to Review
                  </div>
                  <div style={{ fontSize: 11, color: "var(--info)", fontWeight: 600, marginTop: 2, opacity: .75 }}>
                    Spaced Repetition · Tap to review now →
                  </div>
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: "var(--info)",
                  background: "var(--card)", borderRadius: 12, width: 40, height: 40,
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
                  background: "linear-gradient(135deg,var(--warning-bg),rgba(217,119,6,.1))",
                  border: "1.5px solid var(--warning-b)",
                  borderRadius: 18, padding: "14px 18px", marginBottom: 16,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 4px 16px rgba(217,119,6,.15)",
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: "linear-gradient(135deg,#d97706,#b45309)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  boxShadow: "0 4px 12px rgba(217,119,6,.35)",
                }}>📚</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--warning)" }}>
                    {mistakes.length} Mistake{mistakes.length !== 1 ? "s" : ""} to Master
                  </div>
                  <div style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600, marginTop: 2, opacity: .8 }}>
                    Most missed: <strong>{topMistake?.hr}</strong> · Tap to review →
                  </div>
                </div>
                <div style={{ fontSize: 20, color: "var(--warning)", fontWeight: 700, flexShrink: 0 }}>›</div>
              </div>
            );
          })()}

          {/* Empty state when nothing to review */}
          {(() => {
            const due = getDueReviews();
            const mistakes = getMistakes();
            if (due.length > 0 || mistakes.length > 0) return null;
            return (
              <div className="c" style={{padding:'24px 16px', textAlign:'center', marginBottom:16}}>
                <div style={{fontSize:40, marginBottom:12}}>✨</div>
                <div style={{fontSize:14, fontWeight:800, color:'var(--heading)', marginBottom:6}}>All caught up!</div>
                <div style={{fontSize:12, color:'var(--subtext)', lineHeight:1.5}}>
                  No words due for review right now. Keep learning to build your review queue.
                </div>
              </div>
            );
          })()}

        </React.Fragment>
      )}

    </React.Fragment>
  );
}
