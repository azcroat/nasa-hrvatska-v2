import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { lXP, nXP, earnFreeze, getStreakFreezes, LEVEL_NARRATIVE, speak } from '../../data.jsx';
import { useTranslator } from '../../hooks/useTranslator.js';
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

// ─── Knight speech helpers (merged from KnightSpeech) ────────────────────────
function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function TypewriterText({ text, speed = 13 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  const done = shown.length >= (text?.length || 0);
  return (
    <>
      {shown}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '0.85em',
          background: 'rgba(255,255,255,0.85)', verticalAlign: 'text-bottom', marginLeft: 1,
          animation: 'lk-blink .65s step-end infinite',
        }} />
      )}
    </>
  );
}

const QUICK_GRAMMAR = [
  { mood: 'thinking', text: 'Verb aspect: "piti" (drink, ongoing) vs "popiti" (drink, finished). This one distinction is the heart of Croatian. Master it and you\'ll sound native.' },
  { mood: 'thinking', text: 'Seven cases — but three do most of the work. Nominative (subject), Accusative (object), Dative (giving to someone). Start there.' },
  { mood: 'thinking', text: 'Clitic pronouns always land in second position. "Volim te" — never "Te volim." Your brain resists at first. Repetition wins.' },
  { mood: 'thinking', text: '"Grad" is masculine, "zemlja" is feminine, "more" is neuter. Adjectives change form to match. The patterns click faster than you think.' },
  { mood: 'thinking', text: 'Infinitives end in -ti or -ći. "Ići" (go), "raditi" (work), "moći" (be able). These three roots unlock hundreds of verb forms.' },
];
const QUICK_CULTURE = [
  { mood: 'happy', text: '"Cravat" comes from "Hrvat" — Croatian soldiers introduced the necktie to Europe in the 17th century. Croatia gave the world fashion.' },
  { mood: 'happy', text: 'The Pula Arena is one of the six largest Roman amphitheatres still standing — built in 27 BC. Concerts happen inside it every summer.' },
  { mood: 'happy', text: 'Hvar gets 2,726 sunshine hours per year — more than Barcelona. The lavender fields bloom in June.' },
  { mood: 'happy', text: 'Nikola Tesla was born in Smiljan, Croatia. He rewired how the entire world uses electricity.' },
  { mood: 'happy', text: 'The Za Križen procession in Hvar has run every year for 500 years — torchlight, 8 villages, all night. One of Europe\'s oldest living traditions.' },
];
const QUICK_MOTIVATE = [
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. Every session compounds. You\'re not where you started.' },
  { mood: 'victory',    text: 'Luka Modrić grew up in a refugee hotel during the war and won the Ballon d\'Or. Grit beats talent every time.' },
  { mood: 'ready',      text: 'Janica Kostelić broke her leg twice and still won four Olympic golds. A setback doesn\'t end the story.' },
  { mood: 'happy',      text: '5 million Croatian speakers worldwide. With every session you get measurably closer to joining them.' },
  { mood: 'encouraged', text: 'Svaki dan po malo — a little every day. Fluency isn\'t a single moment. It\'s an accumulation. Today just added to yours.' },
];
const CONTEXTUAL_POOL = [
  { mood: 'happy',      text: '"Cravat" — the necktie — comes from "Hrvat" (Croatian). You already gave the world something. Now take the language back.' },
  { mood: 'thinking',   text: 'Croatian verb aspect — piti vs popiti, učiti vs naučiti. Same action, different lens. Master this and you sound native.' },
  { mood: 'happy',      text: 'Split, Dubrovnik, Rovinj, Zadar — every city sounds more magical when you understand what the name means.' },
  { mood: 'encouraged', text: '"Lijepa naša" — Our beautiful homeland. First line of the Croatian anthem. Learn enough and you\'ll mean it when you sing it.' },
  { mood: 'happy',      text: 'Marco Polo was (probably) born on Korčula. Adventure has always run through Croatian veins. Today, set sail.' },
  { mood: 'happy',      text: 'The Dalmatian dog is named after Dalmatia. One small region — a breed the whole world knows. Small nation, big footprint.' },
  { mood: 'thinking',   text: 'Clitic pronouns cluster in a precise order: auxiliary → dative → accusative → se. Tricky to learn, immensely satisfying to master.' },
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. The Croatian phrase for exactly what language learning requires.' },
  { mood: 'ready',      text: '5 million Croatian speakers worldwide. With every session, you get measurably closer to joining them.' },
  { mood: 'happy',      text: 'Rakija flows in Dalmatia. Your sessions flow here. Both burn a little at first and get smoother with time.' },
  { mood: 'celebrating',text: 'Hajduk Split\'s fans are called Torcida — most passionate supporters in the Balkans. Channel that energy into today\'s lesson.' },
  { mood: 'encouraged', text: 'Croatian diaspora spans six continents. Wherever you are, you\'re part of something bigger than one small country.' },
  { mood: 'thinking',   text: 'Croatian has been written in the same script since Gaj\'s 1830 reform. One alphabet, perfectly logical. No exceptions.' },
  { mood: 'happy',      text: 'Diocletian\'s Palace in Split was built in 305 AD — and people still live inside it. Croatians don\'t abandon things that work. Neither should you.' },
  { mood: 'happy',      text: 'Luka Modrić grew up in a hotel for refugees during the war. Won the Ballon d\'Or. Croatian grit is real. Channel some today.' },
  { mood: 'thinking',   text: '7 cases. 2 verb aspects. 3 genders. It sounds like a lot — and it is. But it means you can say exactly what you mean. Always.' },
  { mood: 'encouraged', text: 'Svaki dan po malo — a little every day. That\'s all it takes. Today\'s little bit is right here.' },
  { mood: 'happy',      text: 'Summer in Croatia: lavender from Hvar, rosemary from stone walls, salt from the Adriatic. Learn the words. Then go live them.' },
  { mood: 'happy',      text: '"Koliko jezika znaš, toliko vrijediš." You\'re worth as many people as languages you speak.' },
  { mood: 'thinking',   text: 'The word "cravat" is Croatian. So is the concept of the necktie. So is Nikola Tesla\'s birthplace. Small country, enormous legacy.' },
];

// ── Daily rotating hero backgrounds ──────────────────────────────────────────
const HERO_SCENES = [
  { img: 'dubrovnik-hero',   label: 'Dubrovnik, Hrvatska',  position: '35%' },
  { img: 'zagreb',           label: 'Zagreb, Hrvatska',     position: '40%' },
  { img: 'plitvice',         label: 'Plitvička jezera',     position: '50%' },
  { img: 'dalmatian-coast',  label: 'Dalmatinska obala',    position: '40%' },
  { img: 'labin',            label: 'Labin, Istra',         position: '45%' },
  { img: 'croatian-food',    label: 'Hrvatska kuhinja',     position: '40%' },
  { img: 'dubrovnik-ai',     label: 'Dubrovnik, Hrvatska',  position: '35%' },
];

function getDailyScene() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d - start) / 86400000);
  return HERO_SCENES[dayOfYear % HERO_SCENES.length];
}

function getKnightGreeting(st, streakCount, level) {
  const hour = new Date().getHours();
  const day  = new Date().getDay();
  const xp   = st?.xp || 0;
  const lc   = st?.lc || 0;
  const gc   = st?.gc || 0;
  const streakBroken = lc > 0 && streakCount === 0;

  if (lc === 0) return _pick([
    { mood: 'ready',      text: 'Živjeli! I\'m Vitez Hrvoje, your Croatian knight. Croatia has 1,200 years of history and one of Europe\'s most precise languages. Let\'s start writing yours.' },
    { mood: 'happy',      text: 'Dobro došli! Whether you have Croatian roots or just fell in love with this corner of Europe — you\'re in the right place. First lesson awaits.' },
    { mood: 'encouraged', text: 'Seven cases, tricky verbs, verb aspects — Croatian sounds hard. Here\'s the secret: it\'s perfectly phonetic. One letter, one sound, always. Let\'s go!' },
  ]);
  if (streakBroken) return _pick([
    { mood: 'encouraged', text: 'Nema veze. Every serious learner has gaps. The difference is: they showed back up. Your Croatian is still in there.' },
    { mood: 'encouraged', text: 'Janica Kostelić broke her leg twice and still won four Olympic golds. Your streak broke. Come back and earn it again.' },
  ]);
  if (hour >= 21 && streakCount > 0) return _pick([
    { mood: 'encouraged', text: `Pazi! Your streak expires at midnight. One lesson — even five minutes — keeps the fire alive. Don't let it die tonight.` },
    { mood: 'ready',      text: `One lesson before bed. That's all it takes. ${streakCount} days — too valuable to lose tonight.` },
  ]);
  if (streakCount >= 100) return { mood: 'victory',     text: `${streakCount} days. You're not learning Croatian anymore — you ARE Croatian. Svaka čast, majstore.` };
  if (streakCount >= 50)  return { mood: 'celebrating', text: `${streakCount}-day streak! Fifty days of showing up. The Adriatic has been waiting for someone with your dedication.` };
  if (streakCount >= 30)  return { mood: 'celebrating', text: `Trideset dana — 30 days straight! Most people quit long before now. Croatia noticed.` };
  if (streakCount >= 14)  return { mood: 'happy',       text: `Dva tjedna! Two weeks of Croatian. You've learned more than most diaspora kids will ever try.` };
  if (streakCount >= 7)   return { mood: 'happy',       text: `${streakCount}-day streak — a full week. Your brain is forming real Croatian pathways now. Sjajno!` };
  if (streakCount >= 3)   return { mood: 'happy',       text: `${streakCount} days straight. Consistency beats intensity — you're proving it every day. Hajde!` };
  if (xp >= 5000) return { mood: 'victory',     text: `${xp.toLocaleString()} XP! You've crossed into territory where Croatian conversations start happening by accident.` };
  if (xp >= 1000) return { mood: 'happy',       text: `${xp.toLocaleString()} XP. At this pace, a Croatian grandmother would understand you. That's a high bar.` };
  if (xp >= 100)  return { mood: 'encouraged',  text: `Over 100 XP already. The momentum is real — now keep it going.` };
  if (gc >= 5)    return { mood: 'thinking',    text: `Five grammar sessions in. You've faced Croatian cases and survived. That earns respect, učenik.` };
  if (lc >= 10)   return { mood: 'happy',       text: `${lc} lessons in. You've crossed from complete beginner to actual learner. That's the hardest crossing.` };
  if (hour < 9)   return _pick([
    { mood: 'ready',      text: 'Dobro jutro! Morning practice before the world wakes — this is how fluency is built. Your brain retains more now than any other time.' },
    { mood: 'encouraged', text: 'Jutarnja kava i lekcija — morning coffee and a lesson. The Croatian way to start a day right.' },
  ]);
  if (hour >= 23) return { mood: 'thinking', text: 'Still at it past midnight. Most people are asleep. Most people also don\'t speak Croatian.' };
  if (day === 0)  return { mood: 'happy',   text: 'Nedjelja — Sunday. No better day to learn something that lasts a lifetime.' };
  if (day === 6)  return { mood: 'celebrating', text: 'Subota — Saturday! Weekend warriors are the unsung heroes of language learning. Hajde!' };
  if (day === 1)  return { mood: 'encouraged', text: 'Ponedjeljak — Monday. Fresh week, clean slate. The learners who study on Mondays are the ones who end up fluent.' };
  return CONTEXTUAL_POOL[(new Date().getDate() + day) % CONTEXTUAL_POOL.length];
}

function QuickReplyBanner({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 20,
        padding: '5px 12px',
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.88)',
        cursor: 'pointer',
        fontFamily: "'Outfit', sans-serif",
        transition: 'background .15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
    >
      {label}
    </button>
  );
}

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
  const heroScene = getDailyScene();

  const _td = new Date();
  const today = _td.getFullYear() + '-' + String(_td.getMonth() + 1).padStart(2, '0') + '-' + String(_td.getDate()).padStart(2, '0');

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Dobro jutro';
    if (h < 18) return 'Dobar dan';
    return 'Dobra večer';
  };

  const mascot = getMascotMessage({ streak: streak.count, level, st, comebackBonus, allQuestsDone });

  // ── Knight speech state ───────────────────────────────────────────────────
  const [greeting, setGreeting] = useState(() => getKnightGreeting(st, streak.count, level));
  const [showTranslate, setShowTranslate] = useState(false);
  const { tDir, setTDir, tIn, setTIn, tOut, setTOut, tL, doTr } = useTranslator();
  const poolIdxRef  = useRef(-1);
  const lastPickRef = useRef({ grammar: -1, culture: -1, motivate: -1 });

  // Listen for knight:celebrate events (big XP awards from anywhere in the app)
  useEffect(() => {
    const onCelebrate = (e) => {
      const d = e.detail || {};
      if (d.text) setGreeting({ mood: d.mood || 'celebrating', text: d.text });
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
  }, []);

  function pickPool(pool, category) {
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); }
    while (idx === lastPickRef.current[category] && pool.length > 1);
    lastPickRef.current[category] = idx;
    return pool[idx];
  }

  const cycleBubble = () => {
    poolIdxRef.current = (poolIdxRef.current + 1) % CONTEXTUAL_POOL.length;
    setGreeting(CONTEXTUAL_POOL[poolIdxRef.current]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}>
      <div style={{
        background: `linear-gradient(160deg,rgba(6,14,30,0.91) 0%,rgba(10,35,72,0.82) 40%,rgba(12,56,104,0.77) 100%), url('/images/scenes/${heroScene.img}.webp') center ${heroScene.position} / cover no-repeat`,
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

          {/* ── Knight mascot hero — interactive speech bubble ──────── */}
          <motion.div
            key={greeting.mood}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}
          >
            {/* Knight — primary communicator */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.1 }}
              style={{ flexShrink: 0 }}
            >
              <CroatianKnight size={92} mood={greeting.mood} />
            </motion.div>

            {/* Interactive speech bubble — tap to cycle messages */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* left-pointing triangle toward knight */}
              <div style={{
                position: 'absolute', left: -9, top: 18,
                width: 0, height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '8px solid rgba(255,255,255,0.18)',
              }} />
              <div
                role="button"
                tabIndex={0}
                onClick={cycleBubble}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') cycleBubble(); }}
                title="Tap to hear something new"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '12px 14px 10px',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'background .15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: 'rgba(200,152,10,0.95)',
                  marginBottom: 5,
                }}>
                  {greetingByTime()}, {name || 'Učenik'}!
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)',
                  lineHeight: 1.5,
                }}>
                  <TypewriterText text={greeting.text} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                  gap: 3, marginTop: 6,
                }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontWeight: 600, letterSpacing: '.04em' }}>
                    tap for more
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>↺</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick-reply pills — Culture / Grammar / Krenimo / Translate */}
          <div style={{ display: 'flex', gap: 8, marginBottom: showTranslate ? 10 : 16, flexWrap: 'wrap' }}>
            <QuickReplyBanner label="🏛️ Culture"  onClick={() => { setShowTranslate(false); setGreeting(pickPool(QUICK_CULTURE,  'culture')); }} />
            <QuickReplyBanner label="📐 Grammar"  onClick={() => { setShowTranslate(false); setGreeting(pickPool(QUICK_GRAMMAR,  'grammar')); }} />
            <QuickReplyBanner label="💪 Krenimo!" onClick={() => { setShowTranslate(false); setGreeting(pickPool(QUICK_MOTIVATE, 'motivate')); }} />
            <QuickReplyBanner label="⇄ Translate" onClick={() => { setShowTranslate(t => !t); setTOut(''); }} />
          </div>

          {/* ── Inline Translate Panel ── */}
          {showTranslate && (
            <div style={{
              background: 'rgba(0,0,0,0.28)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 16,
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => { setTDir(d => d === 'en-hr' ? 'hr-en' : 'en-hr'); setTOut(''); }}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 10, padding: '5px 13px',
                    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  {tDir === 'en-hr' ? 'EN → HR ⇄' : 'HR → EN ⇄'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tIn}
                  onChange={e => setTIn(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doTr(); }}
                  placeholder={tDir === 'en-hr' ? 'Type English…' : 'Unesite hrvatski…'}
                  style={{
                    flex: 1, fontSize: 13, padding: '10px 12px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: 10, color: 'white',
                    fontFamily: "'Outfit',sans-serif",
                    outline: 'none',
                  }}
                />
                <button
                  onClick={doTr}
                  disabled={tL}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 10, padding: '10px 18px',
                    fontSize: 13, fontWeight: 700, color: 'white',
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  {tL ? '⏳' : 'Go'}
                </button>
              </div>
              {tOut && (
                <button
                  onClick={() => speak(tDir === 'en-hr' ? tOut : tIn)}
                  style={{
                    width: '100%', marginTop: 10,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: 12,
                    fontSize: 14, fontWeight: 700, color: 'white',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'Outfit',sans-serif",
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  aria-label={`Play audio for ${tOut}`}
                >
                  <span>{tOut}</span>
                  <span aria-hidden="true" style={{ fontSize: 18 }}>🔊</span>
                </button>
              )}
            </div>
          )}

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
