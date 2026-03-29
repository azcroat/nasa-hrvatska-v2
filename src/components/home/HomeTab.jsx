import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, V, LEARN_PATH, getStreak, getStreakFreezes, earnFreeze, getDailyChallenge, lXP, nXP, speak, getSR, getDueReviews, getMistakes, DAILY_QUESTS, LEVEL_NARRATIVE, getActiveCampaign } from '../../data.jsx';
import { getWordOfDay } from '../../lib/wordOfDay.js';
import { useApp } from '../../context/AppContext.jsx';

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
import DailyPlanCard from './DailyPlanCard.jsx';
import AdaptiveInsightsCard from '../profile/AdaptiveInsightsCard.jsx';
import VideoBackground from '../shared/VideoBackground.jsx';
// DalmatianCoast SVG replaced with real AI/CC photography
// import { DalmatianCoast } from '../illustrations';

const DAILY_PHRASES = [
  { hr: "Dobar dan!", en: "Good day!", cat: "Greetings" },
  { hr: "Kako ste?", en: "How are you?", cat: "Greetings" },
  { hr: "Hvala lijepo.", en: "Thank you very much.", cat: "Courtesy" },
  { hr: "Molim vas.", en: "Please / You're welcome.", cat: "Courtesy" },
  { hr: "Gdje je plaža?", en: "Where is the beach?", cat: "Travel" },
  { hr: "Koliko košta?", en: "How much does it cost?", cat: "Shopping" },
  { hr: "Govorite li engleski?", en: "Do you speak English?", cat: "Communication" },
  { hr: "Jedno kava, molim.", en: "One coffee, please.", cat: "Food & Drink" },
  { hr: "Uživam u Hrvatskoj.", en: "I'm enjoying Croatia.", cat: "Travel" },
  { hr: "Sretan put!", en: "Have a good trip!", cat: "Farewells" },
  { hr: "Vidimo se!", en: "See you!", cat: "Farewells" },
  { hr: "Ne razumijem.", en: "I don't understand.", cat: "Communication" },
  { hr: "Možete li ponoviti?", en: "Can you repeat that?", cat: "Communication" },
  { hr: "Gdje je WC?", en: "Where is the bathroom?", cat: "Travel" },
  { hr: "Volim Hrvatsku!", en: "I love Croatia!", cat: "Feelings" },
  { hr: "Lijepo jutro!", en: "Beautiful morning!", cat: "Greetings" },
  { hr: "Što imate za jesti?", en: "What do you have to eat?", cat: "Food & Drink" },
  { hr: "Račun, molim.", en: "The bill, please.", cat: "Food & Drink" },
  { hr: "Živjeli!", en: "Cheers!", cat: "Social" },
  { hr: "Sretno!", en: "Good luck!", cat: "Social" },
  { hr: "Sve je u redu.", en: "Everything is fine.", cat: "Feelings" },
  { hr: "Volim te.", en: "I love you.", cat: "Feelings" },
  { hr: "Oprostite.", en: "Excuse me / Sorry.", cat: "Courtesy" },
  { hr: "Gdje je hotel?", en: "Where is the hotel?", cat: "Travel" },
  { hr: "Trebam pomoć.", en: "I need help.", cat: "Communication" },
  { hr: "Lijepo je ovdje.", en: "It's beautiful here.", cat: "Appreciation" },
  { hr: "Kakvo je vrijeme?", en: "What's the weather like?", cat: "Small Talk" },
  { hr: "Govorim malo hrvatski.", en: "I speak a little Croatian.", cat: "Communication" },
];

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
function getCEFR(lvl) {
  if (lvl <= 2) return { current: 'A1', next: 'A2', pctInLevel: Math.round(((lvl - 1) / 2) * 100) };
  if (lvl <= 4) return { current: 'A2', next: 'B1', pctInLevel: Math.round(((lvl - 3) / 2) * 100) };
  if (lvl <= 6) return { current: 'B1', next: 'B2', pctInLevel: Math.round(((lvl - 5) / 2) * 100) };
  if (lvl <= 8) return { current: 'B2', next: 'C1', pctInLevel: Math.round(((lvl - 7) / 2) * 100) };
  return { current: 'C1', next: 'C2', pctInLevel: Math.min(Math.round(((lvl - 9) / 2) * 100), 100) };
}

export default function HomeTab({
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats,
  setTab, sCurEx,
  allCats, sh,
  launchPathItem,
  syncReady, onSyncNow, authUser,
  comebackBonus,
  goal,
  isNewUserWindow = false,
  daysSinceJoin = null,
  resumeLesson = null,
}) {
  const { name, level, st, award, setScr } = useApp();
  const dc = useMemo(() => getDailyChallenge(), []);
  const ws = useMemo(() => getWeekStats(), [st]);
  const weekXP = useMemo(() => getWeekXP(), []);
  const streak = useMemo(() => getStreak(), []);
  const lastActivity = useMemo(() => getLastActivity(), []);
  const wod = useMemo(() => getWordOfDay(), []);

  // Dynamic Croatia Today — AI-generated daily content (lazy-fetched, 6h edge cache)
  const [dailyCulture, setDailyCulture] = useState(null);
  const [dailyCultureLoading, setDailyCultureLoading] = useState(false);
  useEffect(() => {
    // Check in-memory session cache (keyed by date) to avoid re-fetching on re-render
    const today = new Date().toISOString().slice(0, 10);
    const cached = sessionStorage.getItem('nh_daily_culture');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) { setDailyCulture(parsed); return; }
      } catch {}
    }
    setDailyCultureLoading(true);
    fetch('/api/daily-culture')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDailyCulture(data);
          try { sessionStorage.setItem('nh_daily_culture', JSON.stringify(data)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setDailyCultureLoading(false));
  }, []);
  // Scene video — fetched from Pexels via /api/scene-video (KV-cached 7 days)
  // Keyed by today's scene index so it re-fetches only when the scene changes
  const [sceneVideoUrl, setSceneVideoUrl] = useState(null);
  useEffect(() => {
    const SCENE_KEYS = ['dubrovnik','dalmatian','plitvice','zagreb','labin','mostar','food'];
    const dayIdx = Math.floor(Date.now() / 86400000);
    const sceneKey = SCENE_KEYS[dayIdx % SCENE_KEYS.length];
    const storageKey = `nh_scene_video_${sceneKey}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached) { setSceneVideoUrl(cached); return; }
    fetch(`/api/scene-video?scene=${sceneKey}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok && data.url) {
          setSceneVideoUrl(data.url);
          try { sessionStorage.setItem(storageKey, data.url); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const [freezes, setFreezes] = useState(getStreakFreezes);
  const [freezeMsg, setFreezeMsg] = useState('');
  const [streakRestored, setStreakRestored] = useState(false);
  const [streakRestoreMsg, setStreakRestoreMsg] = useState('');
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);
  const cefr = getCEFR(level);

  const userGoal = goal || localStorage.getItem('nh_goal') || 'fluent';
  const activeCampaign = useMemo(() => getActiveCampaign(), []);

  const [htab, setHTab] = useState('today');

  const questsDone = useMemo(() => {
    const d = new Date().toISOString().slice(0,10);
    const q = (id) => localStorage.getItem('nh_quest_' + id + '_' + d) === '1';
    const hasStreak = streak.count > 0;
    return {
      speak:        q('speak'),
      speak2:       q('speak2'),
      grammar:      q('grammar'),
      grammar2:     q('grammar2'),
      master:       q('master'),
      master2:      q('master2'),
      reading:      q('reading'),
      reading2:     q('reading2'),
      streak:       hasStreak,
      streak_alive: hasStreak,
      perfect:      q('perfect'),
    };
  }, [streak]);
  const allQuestsDone = Object.values(questsDone).every(Boolean);
  const questXP = DAILY_QUESTS.filter(q => questsDone[q.id]).reduce((s,q) => s + q.xp, 0);

  // Award Daily Mastery +50 XP bonus the first time all quests are done today
  const today = new Date().toISOString().slice(0,10);
  const masteryKey = `nh_daily_mastery_${today}`;
  useEffect(() => {
    if (allQuestsDone && !localStorage.getItem(masteryKey)) {
      localStorage.setItem(masteryKey, '1');
      if (award) award(50);
    }
  }, [allQuestsDone, masteryKey, award]);

  const allOpts = useMemo(() => dc.challenges?.map(ch => ch.opts || [ch.a]) || [], [dc.challenges]);
  const doneCount = dchlA.filter(Boolean).length;
  const allDone = doneCount === 3;

  const [dcOpen, setDcOpen] = useState(doneCount === 0);
  const [campaignDismissed, setCampaignDismissed] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

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

  // Daily rotating phrases — 4 new phrases per day, cycles through the full pool
  const todayPhrases = useMemo(() => {
    const dayIdx = Math.floor(Date.now() / 86400000);
    const start = (dayIdx * 4) % DAILY_PHRASES.length;
    return [0, 1, 2, 3].map(i => DAILY_PHRASES[(start + i) % DAILY_PHRASES.length]);
  }, []);

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

      {/* Day 2-10 retention nudge — shown when new user hasn't built habit yet */}
      {isNewUserWindow && daysSinceJoin >= 1 && (
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{fontSize: 28}}>
            {daysSinceJoin <= 3 ? '🌱' : daysSinceJoin <= 7 ? '🔥' : '⭐'}
          </span>
          <div style={{flex: 1}}>
            <div style={{fontSize: 13, fontWeight: 800, color: '#fff'}}>
              {daysSinceJoin === 1 ? 'Day 2 — Build the habit!' :
               daysSinceJoin <= 3 ? `Day ${daysSinceJoin + 1} — You're just getting started` :
               daysSinceJoin <= 7 ? `Day ${daysSinceJoin + 1} — Keep the momentum going` :
               `Day ${daysSinceJoin + 1} — Almost at your first milestone!`}
            </div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2}}>
              {daysSinceJoin <= 3
                ? 'Learners who practice 3 days in a row are 5× more likely to reach fluency.'
                : daysSinceJoin <= 7
                ? 'One more week and Croatian will feel natural. Stay consistent.'
                : 'Day 10 is the breakthrough point. You\'re almost there — don\'t stop now.'}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}>
      <div style={{
        background: "linear-gradient(160deg,rgba(6,14,30,0.91) 0%,rgba(10,35,72,0.82) 40%,rgba(12,56,104,0.77) 100%), url('/images/scenes/dubrovnik-hero.webp') center 35% / cover no-repeat",
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

        {/* ── Continue Learning CTA ── */}
        {lastActivity && (
          <button
            onClick={() => { setScr(lastActivity.ex); if (sCurEx) sCurEx(lastActivity.ex); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 18px', marginBottom: 16, marginTop: 12,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none', borderRadius: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
            }}
          >
            <div style={{textAlign: 'left'}}>
              <div style={{fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '.06em', textTransform: 'uppercase'}}>Continue</div>
              <div style={{fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 1}}>{lastActivity.label}</div>
            </div>
            <span style={{fontSize: 24, color: '#fff'}}>▶</span>
          </button>
        )}

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
            {streak.count === 0 && (
              <div style={{fontSize:11, color:'var(--warning)', fontWeight:600, marginTop:4, textAlign:'center'}}>
                Complete any lesson today to start your streak! 🔥
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

        {/* CEFR progression bar */}
        <div style={{marginTop: 12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
            <span style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:'.05em'}}>CEFR LEVEL</span>
            <span style={{fontSize:11, fontWeight:900, color:'var(--gold, #C8980A)'}}>
              {cefr.current} → {cefr.next} &nbsp;·&nbsp; {cefr.pctInLevel}%
            </span>
          </div>
          <div style={{height:6, background:'rgba(255,255,255,0.15)', borderRadius:6, overflow:'hidden'}}>
            <div style={{
              height:'100%',
              width: cefr.pctInLevel + '%',
              background:'linear-gradient(90deg, var(--gold,#C8980A), #FFE070)',
              borderRadius:6,
              transition:'width 0.6s ease',
            }} />
          </div>
          <div style={{marginTop:4, fontSize:10, color:'rgba(255,255,255,0.5)', fontStyle:'italic'}}>
            {xpCur} / {xpNeeded} XP this level
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
      </motion.div>

      {/* Daily Goal Progress */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.06 }}>
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
      </motion.div>

      {/* ── WORD OF THE DAY ── */}
      {wod && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.08 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,116,144,0.08) 0%, rgba(8,145,178,0.06) 100%)',
            border: '1px solid rgba(14,116,144,0.2)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
              📅 Word of the Day
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>
                  {wod[0]}
                </div>
                {wod[2] && (
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2, fontStyle: 'italic' }}>{wod[2]}</div>
                )}
                <div style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 4 }}>{wod[1]}</div>
              </div>
              <button
                onClick={() => speak(wod[0])}
                aria-label="Hear pronunciation"
                style={{
                  background: 'rgba(14,116,144,0.1)', border: '1px solid rgba(14,116,144,0.2)',
                  borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >🔊</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── CROATIA POSTCARD — daily scene + phrase (video-first) ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.12 }}>
      {(() => {
        const SCENE_POOL = [
          { img:'/images/scenes/dubrovnik-hero.webp',  video:'/videos/scenes/dubrovnik.mp4',   city:'Dubrovnik',        label:'Adriatic Pearl' },
          { img:'/images/scenes/dalmatian-coast.webp', video:'/videos/scenes/dalmatian.mp4',   city:'Dalmatian Coast',  label:'The Adriatic Sea' },
          { img:'/images/scenes/plitvice.webp',        video:'/videos/scenes/plitvice.mp4',    city:'Plitvice Lakes',   label:'UNESCO World Heritage' },
          { img:'/images/scenes/zagreb.webp',          video:'/videos/scenes/zagreb.mp4',      city:'Zagreb',           label:'The Capital' },
          { img:'/images/scenes/labin.webp',           video:'/videos/scenes/labin.mp4',       city:'Labin, Istria',    label:'Medieval Hilltop Town' },
          { img:'/images/scenes/mostar.webp',          video:'/videos/scenes/mostar.mp4',      city:'Mostar',           label:'Stari Most Bridge' },
          { img:'/images/scenes/croatian-food.webp',   video:'/videos/scenes/food.mp4',        city:'Croatian Cuisine', label:'Taste of Croatia' },
        ];
        const dayIdx = Math.floor(Date.now() / 86400000);
        const scene = SCENE_POOL[dayIdx % SCENE_POOL.length];
        const phrase = todayPhrases[0];
        return (
          <VideoBackground
            videoSrc={sceneVideoUrl}
            imageSrc={scene.img}
            overlay="linear-gradient(160deg,rgba(0,0,0,.68) 0%,rgba(0,0,0,.3) 60%,rgba(0,0,0,.58) 100%)"
            style={{ borderRadius: 18, marginBottom: 16, minHeight: dailyCulture ? 190 : 145, boxShadow: '0 4px 24px rgba(0,0,0,.22)', transition: 'min-height .4s ease' }}
          >
            <div style={{ padding:'18px 18px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.65)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:3 }}>
                    Croatia Today · {dailyCulture ? dailyCulture.region || scene.label : scene.label}
                  </div>
                  <div style={{ fontSize:17, fontWeight:900, color:'#fff', fontFamily:"'Playfair Display',serif", textShadow:'0 1px 6px rgba(0,0,0,.5)' }}>
                    {dailyCulture ? `${dailyCulture.locationEmoji || '🇭🇷'} ${dailyCulture.city}` : scene.city}
                  </div>
                </div>
                <span style={{ fontSize:22 }}>🇭🇷</span>
              </div>

              {/* AI-generated phrase — replaces static when loaded */}
              <div style={{
                background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)',
                borderRadius:12, padding:'10px 13px',
                border:'1px solid rgba(255,255,255,.2)',
                marginBottom: dailyCulture?.culturalFact ? 8 : 0,
              }}>
                {dailyCultureLoading && !dailyCulture ? (
                  <div style={{ display:'flex', gap:4, justifyContent:'center', padding:'4px 0' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,.6)', animation:`dot-bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:16, fontWeight:900, color:'#fff', marginBottom:3, fontFamily:"'Playfair Display',serif", fontStyle:'italic' }}>
                      "{dailyCulture ? dailyCulture.phrase : phrase.hr}"
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:600 }}>
                      {dailyCulture ? dailyCulture.translation : phrase.en}
                      {dailyCulture?.pronunciation && (
                        <span style={{ opacity:.6, marginLeft:4 }}>· /{dailyCulture.pronunciation}/</span>
                      )}
                      <span style={{ opacity:.55, marginLeft:4 }}>· {dailyCulture?.category || phrase.cat}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Cultural fact — AI only */}
              {dailyCulture?.culturalFact && (
                <div style={{
                  background:'rgba(0,0,0,.28)', backdropFilter:'blur(6px)',
                  borderRadius:10, padding:'8px 11px',
                  border:'1px solid rgba(255,255,255,.1)',
                }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:3 }}>
                    ✦ Today's Insight
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.82)', lineHeight:1.55, fontWeight:500 }}>
                    {dailyCulture.culturalFact}
                  </div>
                  {dailyCulture.tip && (
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:5, fontStyle:'italic', fontWeight:500 }}>
                      💡 {dailyCulture.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          </VideoBackground>
        );
      })()}
      </motion.div>

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

                {/* Resume interrupted lesson */}
                {(() => {
                  try {
                    const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null');
                    // Only show if the lesson was interrupted recently (within 24h)
                    if (r && r.topic && r.ts && (Date.now() - r.ts) < 86400000 && resumeLesson) {
                      return (
                        <button
                          onClick={resumeLesson}
                          style={{
                            width:"100%", marginTop:8, height:44,
                            background:"rgba(212,0,45,.15)", border:"1px solid rgba(212,0,45,.35)",
                            borderRadius:12, cursor:"pointer",
                            fontFamily:"'Outfit',sans-serif",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                            color:"#fff", fontSize:13, fontWeight:800,
                          }}>
                          <span style={{fontSize:14}}>▶️</span>
                          <span>Resume: {r.topic} lesson →</span>
                        </button>
                      );
                    }
                  } catch (_) {}
                  return null;
                })()}

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

          {/* ── AI DAILY PLAN ── */}
          <DailyPlanCard level={level} goal={goal} streak={streak} setScr={setScr} />

          {/* ── ADAPTIVE AI INSIGHTS ── */}
          {authUser?.u && st.lc >= 2 && (
            <AdaptiveInsightsCard
              uid={authUser.u}
              level={level}
              lessonsCompleted={st.lc}
              goToScreen={setScr}
            />
          )}

          {/* ── AI LIVE TUTOR HERO CARD ── */}
          <button
            onClick={() => setScr("live_tutor")}
            style={{
              width:'100%', padding:0, marginBottom:20,
              borderRadius:20, cursor:'pointer', textAlign:'left',
              border:'2px solid rgba(212,0,45,.35)',
              background:'linear-gradient(135deg,#1c0a0e 0%,#2d0d18 45%,#0f172a 100%)',
              fontFamily:"'Outfit',sans-serif",
              display:'flex', flexDirection:'column',
              overflow:'hidden',
              boxShadow:'0 8px 32px rgba(212,0,45,.22),0 2px 8px rgba(0,0,0,.28)',
              position:'relative',
            }}
          >
            <div style={{
              position:'absolute',inset:0,
              background:'radial-gradient(ellipse at 85% 50%,rgba(212,0,45,.3) 0%,transparent 65%)',
              pointerEvents:'none',
            }}/>
            <div style={{padding:'18px 18px 14px',display:'flex',alignItems:'center',gap:14,position:'relative'}}>
              <div style={{
                width:60,height:60,borderRadius:16,flexShrink:0,
                background:'linear-gradient(135deg,#D4002D,#ff3d5a)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:28,
                boxShadow:'0 6px 20px rgba(212,0,45,.5)',
              }}>🎙️</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:800,color:'rgba(255,130,130,.9)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>AI-POWERED · LIVE SESSIONS</div>
                <div style={{fontSize:17,fontWeight:900,color:'#fff',lineHeight:1.2,marginBottom:4}}>Croatian AI Tutor</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.6)',lineHeight:1.4}}>Speak live — adapts to your level in real time</div>
              </div>
              <div style={{
                fontSize:12,fontWeight:900,color:'#fff',
                background:'linear-gradient(135deg,#D4002D,#ff3d5a)',
                borderRadius:12,padding:'8px 14px',flexShrink:0,
                boxShadow:'0 4px 14px rgba(212,0,45,.45)',
              }}>Start →</div>
            </div>
            <div style={{
              padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,.07)',
              background:'rgba(255,255,255,.04)',display:'flex',gap:18,position:'relative',
            }}>
              {[['🎯','Adapts to you'],['🗣️','Real conversation'],['🏆','+XP rewards']].map(([icon,label])=>(
                <div key={label} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'rgba(255,255,255,.5)',fontWeight:600}}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
          </button>

          {/* ── DAILY QUESTS ── */}
          {(() => {
            const QUEST_COLORS = {
              speak:       { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
              speak2:      { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
              grammar:     { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
              grammar2:    { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
              master:      { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
              master2:     { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
              reading:     { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
              reading2:    { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
              streak:      { bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
              streak_alive:{ bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
              perfect:     { bg:'#ca8a04', shadow:'rgba(202,138,4,.35)',  border:'rgba(202,138,4,.3)'  },
            };
            const questScreenMap = {
              speak:'speaking',     speak2:'speaking',
              grammar:'grammar',    grammar2:'grammar',
              master:'review',      master2:'review',
              reading:'readlist',   reading2:'readlist',
              streak:'learnpath',   streak_alive:'learnpath',
              perfect:'flashcards',
            };
            const questsDoneCount = DAILY_QUESTS.filter(q => questsDone[q.id]).length;
            return (<>
              <div className="section-hdr">
                <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🎯</div>
                <div className="section-hdr-text">
                  <div className="section-hdr-title">Daily Quests</div>
                  <div className="section-hdr-sub">Complete quests to earn bonus XP</div>
                </div>
                <div className="section-hdr-badge">{questsDoneCount}/{DAILY_QUESTS.length}</div>
              </div>
              <div className="anim-children-fade" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
                {DAILY_QUESTS.map(q => {
                  const done = questsDone[q.id];
                  const qc = QUEST_COLORS[q.id] || QUEST_COLORS.master;
                  return (
                    <div key={q.id} style={{
                      background: done ? 'var(--success-bg)' : 'var(--card)',
                      border: `1.5px solid ${done ? 'var(--success-b)' : qc.border}`,
                      borderRadius:16, padding:'14px 12px', textAlign:'center',
                      display:'flex', flexDirection:'column', alignItems:'center',
                      boxShadow: done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35','.12')}`,
                    }}>
                      <div style={{
                        width:48, height:48, borderRadius:14, marginBottom:8,
                        background: done ? 'var(--success)' : qc.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:24,
                        boxShadow: done ? 'none' : `0 4px 14px ${qc.shadow}`,
                      }}>
                        {done ? '✓' : q.icon}
                      </div>
                      <div style={{fontSize:12, fontWeight:900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight:1.2, marginBottom:3}}>{q.name}</div>
                      <div style={{fontSize:10, color:'var(--subtext)', fontWeight:500, marginBottom:8, lineHeight:1.3}}>{q.desc}</div>
                      {done
                        ? <div style={{fontSize:11, color:'var(--success)', fontWeight:800, lineHeight:1}}>+{q.xp} XP earned</div>
                        : <>
                            <button
                              onClick={() => setScr(questScreenMap[q.id])}
                              style={{
                                marginTop:'auto', fontSize:11, fontWeight:800,
                                color:'#fff',
                                background: qc.bg,
                                border:'none',
                                borderRadius:10, padding:'6px 14px', cursor:'pointer',
                                lineHeight:1.4,
                                boxShadow: `0 3px 10px ${qc.shadow}`,
                              }}
                            >
                              Start →
                            </button>
                            <div style={{fontSize:10, color:'var(--subtext)', marginTop:5}}>{q.xp} XP</div>
                          </>
                      }
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

          {/* ── DISCOVER CROATIAN HEADER — Real Croatia Photography ── */}
          <div style={{
            borderRadius:18, marginBottom:12, maxWidth:'100%',
            height:160, overflow:'hidden', position:'relative',
            boxShadow:'0 4px 24px rgba(0,0,0,.18)',
          }}>
            <picture>
              <source srcSet="/images/scenes/dubrovnik-ai.webp" type="image/webp" />
              <img
                src="/images/scenes/dubrovnik-ai.jpg"
                alt="Dubrovnik, Croatia"
                style={{
                  width:'100%', height:'100%', objectFit:'cover',
                  objectPosition:'center 60%',
                  filter:'brightness(1.05) saturate(1.1)',
                }}
              />
            </picture>
            {/* Animated shimmer overlay — golden hour light sweep */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(105deg, transparent 30%, rgba(255,200,60,.07) 50%, transparent 70%)',
              backgroundSize:'200% 100%',
              animation:'heroShimmer 4s ease-in-out infinite',
              pointerEvents:'none',
            }} />
            {/* Vignette */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(to bottom, rgba(0,0,0,.08) 0%, transparent 40%, rgba(0,0,0,.35) 100%)',
              pointerEvents:'none',
            }} />
            {/* Location badge */}
            <div style={{
              position:'absolute', bottom:10, left:12,
              background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)',
              borderRadius:20, padding:'4px 12px',
              fontSize:11, fontWeight:700, color:'rgba(255,255,255,.95)',
              letterSpacing:'.04em', display:'flex', alignItems:'center', gap:5,
            }}>
              <span>📍</span> Dubrovnik, Hrvatska
            </div>
          </div>
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
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24}}>
            {todayPhrases.map((p, i) => (
              <button
                key={i}
                aria-label={`Play audio for ${p.hr} — ${p.en}`}
                onClick={() => speak(p.hr)}
                style={{
                  background:'var(--card)',
                  border:'1.5px solid var(--card-b)',
                  borderRadius:16,
                  padding:'14px 12px',
                  textAlign:'left',
                  cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(0,0,0,.05)',
                  fontFamily:"'Outfit',sans-serif",
                  transition:'transform .12s, box-shadow .12s',
                  WebkitTapHighlightColor:'transparent',
                  display:'flex',
                  flexDirection:'column',
                  gap:4,
                }}
                onPointerDown={e => e.currentTarget.style.transform='scale(0.97)'}
                onPointerUp={e => e.currentTarget.style.transform=''}
                onPointerLeave={e => e.currentTarget.style.transform=''}
              >
                <span style={{fontSize:11, fontWeight:800, color:'var(--color-croatian,#b61800)', textTransform:'uppercase', letterSpacing:'.05em'}}>{p.cat}</span>
                <span style={{fontSize:15, fontWeight:800, color:'var(--heading)', lineHeight:1.3}}>{p.hr}</span>
                <span style={{fontSize:12, color:'var(--subtext)', fontWeight:500}}>{p.en}</span>
                <span aria-hidden="true" style={{marginTop:4, fontSize:16}}>🔊</span>
              </button>
            ))}
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
                aria-label={`Play audio for ${tOut}`}
                onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
                <span>{tOut}</span>
                <span aria-hidden="true" style={{fontSize:20}}>🔊</span>
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
            if (due.length === 0) return (
              <div style={{fontSize:11, color:'var(--text-2)', fontStyle:'italic', textAlign:'center', padding:'4px 0'}}>
                No reviews due — keep completing lessons to build your deck
              </div>
            );
            const sr = getSR(); const allR = Object.values(sr);
            const masteryPct = allR.length > 0
              ? Math.round(allR.reduce((s,v) => s + (v.r||0)/Math.max((v.r||0)+v.w,1), 0) / allR.length * 100)
              : 0;
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
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--info)", lineHeight: 1 }}>{due.length}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 20, padding: '2px 7px', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                    ✦ {masteryPct}% mastered
                  </div>
                </div>
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
                {(() => {
                  const worst = mistakes[0];
                  const conf = Math.max(10, 100 - worst.count * 12);
                  const chipBg = conf > 60 ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,#dc2626,#b91c1c)';
                  return (
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: chipBg, borderRadius: 20, padding: '3px 8px', flexShrink: 0, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                      ✦ {conf}% ready
                    </div>
                  );
                })()}
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
