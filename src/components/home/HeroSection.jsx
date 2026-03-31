import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { lXP, nXP, earnFreeze, getStreakFreezes, LEVEL_NARRATIVE } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';
import CroatianKnight from '../shared/CroatianKnight';

const LEVEL_PALETTE = [
  { grad: 'linear-gradient(135deg,#92400e,#b45309)', light: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  { grad: 'linear-gradient(135deg,#065f46,#059669)', light: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  { grad: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', light: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  { grad: 'linear-gradient(135deg,#4c1d95,#6d28d9)', light: '#ede9fe', text: '#4c1d95', border: '#c4b5fd' },
  { grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)', light: '#fee2e2', text: '#7f1d1d', border: '#fca5a5' },
];

function getMascotMessage({ streak, level, st, comebackBonus, allQuestsDone }) {
  const h = new Date().getHours();
  const lc = st?.lc || 0;

  if (lc === 0) return {
    mood: 'happy',
    text: 'Dobrodošli! Ready to start your Croatian journey?',
    sub: 'Your first lesson awaits 🇭🇷',
  };
  if (comebackBonus) return {
    mood: 'celebrating',
    text: 'Welcome back! +50 bonus XP on your first lesson!',
    sub: 'Your Croatian is still here waiting for you 💪',
  };
  if (allQuestsDone) return {
    mood: 'celebrating',
    text: 'Sve misije završene! All quests done today!',
    sub: "You're a Croatian champion today 🏆",
  };
  if (streak >= 100) return { mood: 'celebrating', text: `${streak}-day streak! Legendarno! 🔥`, sub: 'You are an inspiration.' };
  if (streak >= 30)  return { mood: 'celebrating', text: `${streak} dana zaredom — unstoppable! 🔥`, sub: 'True dedication to the language 🇭🇷' };
  if (streak >= 14)  return { mood: 'celebrating', text: `${streak}-day streak — keep the fire burning! 🔥`, sub: 'Sjajno ide!' };
  if (streak >= 7)   return { mood: 'encouraged',  text: `${streak} days in a row — the habit is forming! 💪`, sub: 'Bravo, hajde dalje!' };
  if (streak >= 3)   return { mood: 'encouraged',  text: `${streak}-day streak — don't break the chain! 🔥`, sub: 'Svaki dan si bolji!' };
  if (level >= 10)   return { mood: 'celebrating', text: `Level ${level} — advanced learner! 🎓`, sub: 'Napredak je vidljiv!' };
  if (level >= 5)    return { mood: 'happy',       text: `Level ${level} — halfway to fluency! 🌟`, sub: "Keep pushing, you've got this!" };
  if (level >= 3)    return { mood: 'happy',       text: `Level ${level} — real momentum building!`, sub: 'Odlično!' };
  if (h < 12)  return { mood: 'happy',    text: 'Morning practice is the best practice!', sub: 'Ready for today? Hajde! ☀️' };
  if (h >= 20) return { mood: 'thinking', text: 'Evening session — great way to end the day!', sub: 'Even 5 minutes counts 💪' };
  const msgs = [
    { mood: 'happy',       text: 'Every word you learn brings Croatia closer!',       sub: 'Hajde! 🇭🇷' },
    { mood: 'thinking',    text: "Croatian has 7 cases — let's master them together!", sub: 'Your ancestors spoke this language' },
    { mood: 'happy',       text: 'Your ancestors spoke this language. Carry it forward! 💙', sub: null },
    { mood: 'celebrating', text: 'Language is the soul of culture!',                  sub: 'Naša Hrvatska čeka! 🌟' },
    { mood: 'happy',       text: "Ima li tko tko voli učiti? Ja volim! Let's go! 🎉", sub: null },
    { mood: 'thinking',    text: 'Small steps every day — you\'re building something beautiful 🏛️', sub: null },
    { mood: 'happy',       text: 'Naša Hrvatska čeka! Croatia is waiting for you! 🇭🇷', sub: null },
  ];
  return msgs[new Date().getDay() % msgs.length];
}

function getCEFR(lvl) {
  if (lvl <= 2) return { current: 'A1', next: 'A2', pctInLevel: Math.round(((lvl - 1) / 2) * 100) };
  if (lvl <= 4) return { current: 'A2', next: 'B1', pctInLevel: Math.round(((lvl - 3) / 2) * 100) };
  if (lvl <= 6) return { current: 'B1', next: 'B2', pctInLevel: Math.round(((lvl - 5) / 2) * 100) };
  if (lvl <= 8) return { current: 'B2', next: 'C1', pctInLevel: Math.round(((lvl - 7) / 2) * 100) };
  return { current: 'C1', next: 'C2', pctInLevel: Math.min(Math.round(((lvl - 9) / 2) * 100), 100) };
}

export default function HeroSection({
  streak, pathData, allQuestsDone, userGoal,
  comebackBonus, lastActivity, sCurEx, onSyncNow,
  wsMastered,
}) {
  const { name, setScr } = useApp();
  const { level, stats: st, award } = useStats();

  const [freezes, setFreezes] = useState(getStreakFreezes);
  const [freezeMsg, setFreezeMsg] = useState('');
  const [streakRestored, setStreakRestored] = useState(false);
  const [streakRestoreMsg, setStreakRestoreMsg] = useState('');

  // Hero is always expanded by default — users can still collapse it manually
  const [heroExpanded, setHeroExpanded] = useState(() => {
    const saved = localStorage.getItem('nh_hero_expanded');
    if (saved !== null) return saved === '1';
    return true; // default expanded for all users
  });
  const toggleHero = () => {
    const next = !heroExpanded;
    setHeroExpanded(next);
    localStorage.setItem('nh_hero_expanded', next ? '1' : '0');
  };

  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);
  const cefr = getCEFR(level);

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];

  const _td = new Date();
  const today = _td.getFullYear() + '-' + String(_td.getMonth() + 1).padStart(2, '0') + '-' + String(_td.getDate()).padStart(2, '0');

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Dobro jutro';
    if (h < 18) return 'Dobar dan';
    return 'Dobra večer';
  };

  const mascot = getMascotMessage({ streak: streak.count, level, st, comebackBonus, allQuestsDone });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}>
      <div style={{
        background: "linear-gradient(160deg,rgba(6,14,30,0.91) 0%,rgba(10,35,72,0.82) 40%,rgba(12,56,104,0.77) 100%), url('/images/scenes/dubrovnik-hero.webp') center 35% / cover no-repeat",
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        borderRadius: '22px 22px 0 0',
        borderBottom: '1px solid rgba(200,152,10,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Croatian identity stripe — gold line */}
        <div style={{ position:'relative' }}>
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, transparent 0%, var(--gold, #C8980A) 20%, var(--harvest, #FFE070) 50%, var(--gold, #C8980A) 80%, transparent 100%)',
          }}/>
        </div>

        {/* ── COMPACT STRIP (returning users, collapsed state) ── */}
        {!heroExpanded && (
          <button
            onClick={toggleHero}
            aria-label="Expand hero section"
            style={{
              width: '100%', padding: '12px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <CroatianGrb size={36} />
            <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '4px 10px' }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{streak.count}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginLeft: 2 }}>day streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '4px 10px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Lv {level}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>{pathData.activeLv.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '4px 10px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{st.xp.toLocaleString()}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>XP</span>
              </div>
            </div>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,.6)' }}>⌄</span>
          </button>
        )}

        {heroExpanded && (
        <div style={{padding:'16px 20px 20px'}}>

          {/* Top row: brand — grb + logotype */}
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
            <div style={{flexShrink:0,filter:'drop-shadow(0 4px 14px rgba(0,0,0,.6))'}}>
              <CroatianGrb size={64} />
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:'.01em',lineHeight:1,color:'white',fontFamily:"'Playfair Display',serif",textShadow:'0 2px 12px rgba(0,0,0,.5)'}}>Naša Hrvatska</div>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(200,152,10,0.90)',letterSpacing:'.12em',textTransform:'uppercase',marginTop:5}}>Learn Croatian</div>
            </div>
          </div>

          {/* ── Knight mascot hero ─────────────────────────────────────── */}
          <motion.div
            key={mascot.mood}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}
          >
            {/* Knight — the mascot */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.1 }}
              style={{ flexShrink: 0 }}
            >
              <CroatianKnight size={92} mood={mascot.mood} />
            </motion.div>

            {/* Speech bubble — pointer on left side */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* left-pointing triangle */}
              <div style={{
                position: 'absolute', left: -9, top: 18,
                width: 0, height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '8px solid rgba(255,255,255,0.18)',
              }} />
              <div style={{
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderRadius: '4px 16px 16px 16px',
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: 'rgba(200,152,10,0.95)',
                  marginBottom: 5,
                }}>
                  {greetingByTime()}, {name || 'Učenik'}!
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  lineHeight: 1.45, textShadow: '0 1px 6px rgba(0,0,0,0.3)',
                }}>
                  {mascot.text}
                </div>
                {mascot.sub && (
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.72)',
                    marginTop: 5, lineHeight: 1.4, fontWeight: 500,
                  }}>
                    {mascot.sub}
                  </div>
                )}
                {/* goal tagline as a small pill */}
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  fontSize: 10, fontWeight: 700,
                  color: 'rgba(255,255,255,0.65)',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '2px 8px',
                  letterSpacing: '.04em',
                }}>
                  {userGoal === 'heritage' ? '🇭🇷 Reconnecting with your roots'
                   : userGoal === 'family'  ? '👨‍👩‍👧 Learning for family'
                   : userGoal === 'partner' ? '💙 Learning for love'
                   : userGoal === 'travel'  ? '✈️ Croatia is waiting'
                   : userGoal === 'culture' ? '🎵 Immersed in Croatian culture'
                   : '🗣️ On the path to fluency'}
                </div>
              </div>
            </div>
          </motion.div>

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
          <div style={{display:'inline-flex',alignItems:'center',marginBottom:16}}>
            <span style={{
              background: activePalette.grad,
              borderRadius:20,
              padding:'5px 14px',
              fontSize:11,fontWeight:800,
              color:'white',
              letterSpacing:'.06em',
              textTransform:'uppercase',
              boxShadow:'0 4px 14px rgba(0,0,0,.3)',
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
              {icon:'💪', value:wsMastered, label:'mastered'},
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
                  // Sync with streak.js repair key so canRepairStreak() returns false this session
                  try {
                    const rd = JSON.parse(localStorage.getItem('nh_streak_repair') || '{}');
                    rd.lastRepair = today;
                    localStorage.setItem('nh_streak_repair', JSON.stringify(rd));
                  } catch (_) {}
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
          {/* Collapse button — bottom of full hero */}
          <button
            onClick={toggleHero}
            aria-label="Collapse hero section"
            style={{
              width: '100%', marginTop: 14, padding: '6px 0',
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,.5)',
              fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>Hide details</span><span style={{ fontSize: 10 }}>⌃</span>
          </button>

        </div>
        )}
      </div>
    </motion.div>
  );
}
