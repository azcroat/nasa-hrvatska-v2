import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from './CroatianKnight';

// ─── Utility ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _todayKey(base) {
  const d = new Date();
  return base + '_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ─── Typewriter component ─────────────────────────────────────────────────────
function TypewriterText({ text, speed = 13 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text]);
  const done = shown.length >= (text?.length || 0);
  return (
    <>
      {shown}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '0.85em',
          background: 'currentColor', verticalAlign: 'text-bottom', marginLeft: 1,
          animation: 'lk-blink .65s step-end infinite',
        }} />
      )}
    </>
  );
}

// ─── Celebration particle burst ───────────────────────────────────────────────
const PARTY_COLORS = ['#CC0022', '#F4F0E2', '#D4A400', '#EE3042', '#FFDC3C'];
function CelebrationBurst({ active }) {
  const [particles, setParticles] = useState([]);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    setRunKey(k => k + 1);
    setParticles(Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: (i / 10) * 360 + (Math.random() * 24 - 12),
      dist: 32 + Math.random() * 22,
      color: PARTY_COLORS[i % PARTY_COLORS.length],
      size: 4 + Math.random() * 4,
    })));
  }, [active]);
  if (!particles.length) return null;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 5 }}>
      {particles.map(p => (
        <motion.div
          key={`${runKey}-${p.id}`}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle * Math.PI / 180) * p.dist,
            y: Math.sin(p.angle * Math.PI / 180) * p.dist - 8,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: p.id * 0.04 }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', background: p.color, marginLeft: -p.size/2, marginTop: -p.size/2 }}
        />
      ))}
    </div>
  );
}

// ─── Quick-reply message pools ────────────────────────────────────────────────
const QUICK_GRAMMAR = [
  { mood: 'thinking', text: 'Verb aspect: "piti" (drink, ongoing) vs "popiti" (drink, finished). This one distinction is the heart of Croatian. Master it and you\'ll sound native. 📐' },
  { mood: 'thinking', text: 'Seven cases — but three do most of the work. Nominative (subject), Accusative (object), Dative (giving to someone). Start there. 📐' },
  { mood: 'thinking', text: 'Clitic pronouns always land in second position. "Volim te" — never "Te volim." Your brain resists at first. Repetition wins. 🎓' },
  { mood: 'thinking', text: '"Grad" is masculine, "zemlja" is feminine, "more" is neuter. Adjectives change form to match. The patterns click faster than you think. 📐' },
  { mood: 'thinking', text: 'Infinitives end in -ti or -ći. "Ići" (go), "raditi" (work), "moći" (be able). These three roots unlock hundreds of verb forms. 📖' },
];

const QUICK_CULTURE = [
  { mood: 'happy', text: '"Cravat" comes from "Hrvat" — Croatian soldiers introduced the necktie to Europe in the 17th century. Croatia gave the world fashion. 👔' },
  { mood: 'happy', text: 'The Pula Arena is one of the six largest Roman amphitheatres still standing — built in 27 BC. Concerts happen inside it every summer. ⚔️' },
  { mood: 'happy', text: 'Hvar gets 2,726 sunshine hours per year — more than Barcelona. The lavender fields bloom in June. Smell it once and you\'ll never forget it. 🌿' },
  { mood: 'happy', text: 'Nikola Tesla was born in Smiljan, Croatia. He rewired how the entire world uses electricity. ⚡' },
  { mood: 'happy', text: 'The Za Križen procession in Hvar has run every year for 500 years — torchlight, 8 villages, all night. One of Europe\'s oldest living traditions. 🕯️' },
];

const QUICK_MOTIVATE = [
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. Every session compounds. You\'re not where you started. 💪' },
  { mood: 'victory',    text: 'Luka Modrić grew up in a refugee hotel during the war and won the Ballon d\'Or. Grit beats talent every time. ⚽' },
  { mood: 'ready',      text: 'Janica Kostelić broke her leg twice and still won four Olympic golds. A setback doesn\'t end the story. 🎿' },
  { mood: 'happy',      text: '5 million Croatian speakers worldwide. With every session you get measurably closer to joining them. 🇭🇷' },
  { mood: 'encouraged', text: 'Svaki dan po malo — a little every day. Fluency isn\'t a single moment. It\'s an accumulation. Today just added to yours. 🔥' },
];

// Rotating pool used when user taps the bubble body
const CONTEXTUAL_POOL = [
  { mood: 'happy',     text: '"Cravat" — the necktie — comes from "Hrvat" (Croatian). You already gave the world something. Now take the language back. 👔' },
  { mood: 'thinking',  text: 'Croatian verb aspect — piti vs popiti, učiti vs naučiti. Same action, different lens. Master this and you sound native. 📐' },
  { mood: 'happy',     text: 'Split, Dubrovnik, Rovinj, Zadar — every city sounds more magical when you understand what the name means. 🏛️' },
  { mood: 'encouraged',text: '"Lijepa naša" — Our beautiful homeland. First line of the Croatian anthem. Learn enough and you\'ll mean it when you sing it. 🎵' },
  { mood: 'happy',     text: 'Marco Polo was (probably) born on Korčula. Adventure has always run through Croatian veins. Today, set sail. ⛵' },
  { mood: 'happy',     text: 'The Dalmatian dog is named after Dalmatia. One small region — a breed the whole world knows. Small nation, big footprint. 🐾' },
  { mood: 'thinking',  text: 'Clitic pronouns cluster in a precise order: auxiliary → dative → accusative → se. Tricky to learn, immensely satisfying to master. 🎓' },
  { mood: 'encouraged',text: 'Polako, ali sigurno — slowly but surely. The Croatian phrase for exactly what language learning requires. 🛡️' },
  { mood: 'ready',     text: '5 million Croatian speakers worldwide. With every session, you get measurably closer to joining them. ⚔️' },
  { mood: 'happy',     text: 'Rakija flows in Dalmatia. Your sessions flow here. Both burn a little at first and get smoother with time. 🥃' },
  { mood: 'celebrating',text: 'Hajduk Split\'s fans are called Torcida — most passionate supporters in the Balkans. Channel that energy into today\'s lesson. ⚽' },
  { mood: 'encouraged',text: 'Croatian diaspora spans six continents. Wherever you are, you\'re part of something bigger than one small country. 🌍' },
  { mood: 'thinking',  text: 'Croatian has been written in the same script since Gaj\'s 1830 reform. One alphabet, perfectly logical. No exceptions. 📜' },
  { mood: 'happy',     text: 'Diocletian\'s Palace in Split was built in 305 AD — and people still live inside it. Croatians don\'t abandon things that work. Neither should you. 🏰' },
  { mood: 'happy',     text: 'Luka Modrić grew up in a hotel for refugees during the war. Won the Ballon d\'Or. Croatian grit is real. Channel some today. ⚽' },
  { mood: 'thinking',  text: '7 cases. 2 verb aspects. 3 genders. It sounds like a lot — and it is. But it means you can say exactly what you mean. Always. 📐' },
  { mood: 'encouraged',text: 'Svaki dan po malo — a little every day. That\'s all it takes. Today\'s little bit is right here. 🔥' },
  { mood: 'happy',     text: 'Summer in Croatia: lavender from Hvar, rosemary from stone walls, salt from the Adriatic. Learn the words. Then go live them. 🌿' },
  { mood: 'happy',     text: '"Koliko jezika znaš, toliko vrijediš." You\'re worth as many people as languages you speak. 🌐' },
  { mood: 'thinking',  text: 'The word "cravat" is Croatian. So is the concept of the necktie. So is Nikola Tesla\'s birthplace. Small country, enormous legacy. ⚡' },
];

// ─── Contextual greeting engine ───────────────────────────────────────────────
function getGreeting(st, streakCount, level) {
  const hour = new Date().getHours();
  const day  = new Date().getDay();
  const xp   = st?.xp || 0;
  const lc   = st?.lc || 0;
  const gc   = st?.gc || 0;
  const lc0  = lc === 0;
  const streakBroken = lc > 0 && streakCount === 0;

  if (lc0) return pick([
    { mood: 'ready',      text: 'Živjeli! I\'m Vitez Hrvoje, your Croatian knight. Croatia has 1,200 years of history and one of Europe\'s most precise languages. Let\'s start writing yours. 🇭🇷' },
    { mood: 'happy',      text: 'Dobro došli! Whether you have Croatian roots or just fell in love with this corner of Europe — you\'re in the right place. First lesson awaits. ⚔️' },
    { mood: 'encouraged', text: 'Seven cases, tricky verbs, verb aspects — Croatian sounds hard. Here\'s the secret: it\'s perfectly phonetic. One letter, one sound, always. Let\'s go!' },
  ]);

  if (streakBroken) return pick([
    { mood: 'sad',        text: 'Nije dobro... Streak broken. But Nikola Tesla failed a thousand times before his breakthrough. One session and you\'re back. 💪' },
    { mood: 'sad',        text: 'Streak gone. I\'ve watched Hajduk Split fans rebuild hope after worse. Five minutes — the comeback starts now. ⚽' },
    { mood: 'encouraged', text: 'Janica Kostelić broke her leg twice and still won four Olympic golds. Your streak broke. Come back and earn it again. 🎿' },
    { mood: 'encouraged', text: 'Nema veze. Every serious learner has gaps. The difference is: they showed back up. Your Croatian is still in there. 🔥' },
  ]);

  if (hour >= 21 && streakCount > 0) {
    // Only warn if the user hasn't already practiced today — no need to nag after they've done their session.
    const lastPractice = parseInt(localStorage.getItem('nh_last_practice') || '0', 10);
    const practicedToday = !isNaN(lastPractice) && lastPractice > 0 &&
      new Date(lastPractice).toDateString() === new Date().toDateString();
    if (!practicedToday) return pick([
      { mood: 'encouraged', text: `Pazi! Your streak expires at midnight. One lesson — even five minutes — keeps the fire alive. Don't let it die tonight. 🕛` },
      { mood: 'ready',      text: 'Late night in Zagreb, the kafići are still full — and so is your next lesson. Don\'t lose the streak. ☕' },
      { mood: 'ready',      text: `One lesson before bed. That's all it takes. ${streakCount} days — too valuable to lose tonight. ⚔️` },
    ]);
  }

  if (streakCount >= 100) return { mood: 'victory',     text: `${streakCount} days. You're not learning Croatian anymore — you ARE Croatian. Svaka čast, majstore. 🏆` };
  if (streakCount >= 50)  return { mood: 'celebrating', text: `${streakCount}-day streak! Fifty days of showing up. The Adriatic has been waiting for someone with your dedication. 🌊` };
  if (streakCount >= 30)  return { mood: 'celebrating', text: `Trideset dana — 30 days straight! Most people quit long before now. Croatia noticed. 🇭🇷` };
  if (streakCount >= 21)  return { mood: 'celebrating', text: `Tri tjedna — 21 days. Habit science says this is when it sticks. I can confirm: it's sticking. 🔥` };
  if (streakCount >= 14)  return { mood: 'happy',       text: `Dva tjedna! Two weeks of Croatian. You've learned more than most diaspora kids will ever try. 💙` };
  if (streakCount >= 7)   return { mood: 'happy',       text: `${streakCount}-day streak — a full week. Your brain is forming real Croatian pathways now. Sjajno! 💪` };
  if (streakCount >= 3)   return { mood: 'happy',       text: `${streakCount} days straight. Consistency beats intensity — you're proving it every day. Hajde! ⚔️` };

  if (xp >= 5000) return { mood: 'victory',     text: `${xp.toLocaleString()} XP! You've crossed into territory where Croatian conversations start happening by accident. 🗣️` };
  if (xp >= 2500) return { mood: 'celebrating', text: `${xp.toLocaleString()} XP — you could order food, argue about football, and apologize in Croatian. Not bad at all. 🍽️` };
  if (xp >= 1000) return { mood: 'happy',       text: `${xp.toLocaleString()} XP. At this pace, a Croatian grandmother would understand you. That's a high bar. 👵` };
  if (xp >= 500)  return { mood: 'happy',       text: `500+ XP! You've moved past tourist Croatian into something real. A local would actually be impressed. 🇭🇷` };
  if (xp >= 100)  return { mood: 'encouraged',  text: `Over 100 XP already. The momentum is real — now keep it going. 🔥` };

  if (gc >= 10) return { mood: 'thinking', text: `${gc} grammar sessions. You're building the skeleton of Croatian — cases, aspect, everything. Most learners skip this. You didn't. 📐` };
  if (gc >= 5)  return { mood: 'thinking', text: `Five grammar sessions in. You've faced Croatian cases and survived. That earns respect, učenik. 📐` };

  if (lc >= 50) return { mood: 'celebrating', text: `${lc} lessons complete! The Pula Arena has stood 2,000 years — built stone by stone. So is your Croatian. 🏛️` };
  if (lc >= 25) return { mood: 'happy',       text: `${lc} lessons! Tesla, Ivanišević, Modrić — they all spoke Croatian. Progress report: so do you, increasingly. 🎾` };
  if (lc >= 10) return { mood: 'happy',       text: `${lc} lessons in. You've crossed from complete beginner to actual learner. That's the hardest crossing. 💙` };

  if (hour < 9) return pick([
    { mood: 'ready',      text: 'Dobro jutro! Morning practice before the world wakes — this is how fluency is built. Your brain retains more now than any other time. 🌅' },
    { mood: 'happy',      text: 'Early start. In Dubrovnik, fishermen are out before dawn. You\'re building something at the same hour. Hajdemo! 🌊' },
    { mood: 'encouraged', text: 'Jutarnja kava i lekcija — morning coffee and a lesson. The Croatian way to start a day right. ☕' },
  ]);

  if (hour >= 23) return pick([
    { mood: 'neutral',  text: 'Po noći — by night. A quiet mind absorbs language differently. Late learners often go the deepest. 🌙' },
    { mood: 'thinking', text: 'Still at it past midnight. Most people are asleep. Most people also don\'t speak Croatian. 🌙' },
  ]);

  if (day === 0) return pick([
    { mood: 'happy',   text: 'Nedjelja — Sunday. No better day to learn something that lasts a lifetime. Croatia on Sundays smells like roasting lamb. 🥩' },
    { mood: 'neutral', text: 'Sunday session. In Dalmatia they call this "polako" time — slow down and do one thing well. Let\'s do that. ☀️' },
  ]);
  if (day === 6) return pick([
    { mood: 'celebrating', text: 'Subota — Saturday! Weekend warriors are the unsung heroes of language learning. Hajde! 🎉' },
    { mood: 'happy',       text: 'Saturday in Croatia = markets, coffee, sea. Learn the words, then go live them. 🛶' },
  ]);
  if (day === 1) return pick([
    { mood: 'encouraged', text: 'Ponedjeljak — Monday. Fresh week, clean slate. The learners who study on Mondays are the ones who end up fluent. ⚔️' },
    { mood: 'ready',      text: 'Monday. Set the tone now. Everything else this week will feel easier after this one session. 🛡️' },
  ]);
  if (day === 5) return pick([
    { mood: 'happy',       text: 'Petak — Friday! End the week strong. Future-you at a Dalmatian wedding will be very grateful. 💃' },
    { mood: 'celebrating', text: 'Friday session locked in. The Adriatic is calling — now you\'ll know what to say when you get there. 🌊' },
  ]);

  return CONTEXTUAL_POOL[(new Date().getDate() + day) % CONTEXTUAL_POOL.length];
}

// ─── Mood → accent color ──────────────────────────────────────────────────────
const MOOD_COLOR = {
  happy:       '#0e7490',
  thinking:    '#7c3aed',
  celebrating: '#d97706',
  victory:     '#b45309',
  sad:         '#dc2626',
  encouraged:  '#16a34a',
  ready:       '#1d4ed8',
  confused:    '#78716c',
  neutral:     '#64748b',
};

// ─── Speech bubble tail (points left toward the knight) ───────────────────────
function BubbleTail({ color }) {
  return (
    <>
      {/* Outer — acts as border */}
      <div style={{
        position: 'absolute', left: -9, top: 16, pointerEvents: 'none',
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: `9px solid ${color}`,
      }} />
      {/* Inner — matches bubble background, creates hollow border effect */}
      <div style={{
        position: 'absolute', left: -7, top: 17, pointerEvents: 'none',
        width: 0, height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        borderRight: '8px solid var(--card)',
      }} />
    </>
  );
}

// ─── Quick-reply pill button ──────────────────────────────────────────────────
function QuickReply({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}12`,
        border: `1px solid ${color}35`,
        borderRadius: 20,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 700,
        color,
        cursor: 'pointer',
        fontFamily: "'Outfit', sans-serif",
        transition: 'background .15s ease, transform .1s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function KnightSpeech({
  st,
  sessionKey = 'nh_knight_greeted',
  onDismiss,
  streak = 0,
  level = 1,
}) {
  const [mode, setMode]         = useState('hidden');
  const [animOut, setAnimOut]   = useState(false);
  const [greeting, setGreeting] = useState(() => getGreeting(st, streak, level));
  const [celebBurst, setCelebBurst] = useState(false);
  const poolIdxRef              = useRef(-1);
  const lastPickRef             = useRef({ grammar: -1, culture: -1, motivate: -1 });
  const celebTimerRef           = useRef(null);

  // Show full once per day, then mini
  useEffect(() => {
    const dayKey = _todayKey(sessionKey);
    const t = setTimeout(() => {
      setMode(localStorage.getItem(dayKey) ? 'mini' : 'full');
      setGreeting(getGreeting(st, streak, level));
    }, 600);
    return () => clearTimeout(t);
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for celebration events from useAward
  useEffect(() => {
    const onCelebrate = (e) => {
      const d = e.detail || {};
      if (d.text) setGreeting({ mood: d.mood || 'celebrating', text: d.text });
      setAnimOut(false);
      setCelebBurst(false);
      requestAnimationFrame(() => setCelebBurst(true));
      setMode('full');
      clearTimeout(celebTimerRef.current);
      celebTimerRef.current = setTimeout(() => setMode('mini'), 5500);
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => { window.removeEventListener('knight:celebrate', onCelebrate); clearTimeout(celebTimerRef.current); };
  }, []);

  const dismiss = () => {
    setAnimOut(true);
    localStorage.setItem(_todayKey(sessionKey), '1');
    setTimeout(() => { setAnimOut(false); setMode('mini'); if (onDismiss) onDismiss(); }, 260);
  };

  // Pick next from a pool without immediate repetition
  function pickPool(pool, category) {
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); }
    while (idx === lastPickRef.current[category] && pool.length > 1);
    lastPickRef.current[category] = idx;
    return pool[idx];
  }

  // Cycle through contextual pool on bubble tap
  const cycleBubble = () => {
    poolIdxRef.current = (poolIdxRef.current + 1) % CONTEXTUAL_POOL.length;
    setGreeting(CONTEXTUAL_POOL[poolIdxRef.current]);
  };

  if (mode === 'hidden') return null;

  const { mood, text } = greeting;
  const lc = st?.lc || 0;
  const isStreakRisk   = lc > 0 && streak === 0;
  const isEveningRisk  = lc > 0 && streak > 0 && new Date().getHours() >= 21;
  const showUrgency    = isStreakRisk || isEveningRisk;
  const accentColor    = MOOD_COLOR[mood] || MOOD_COLOR.happy;

  // ── Mini mode — floating knigh button ─────────────────────────────────────
  if (mode === 'mini') {
    return (
      <button
        onClick={() => { setGreeting(getGreeting(st, streak, level)); setMode('full'); }}
        aria-label="Chat with Vitez Hrvoje, your Croatian coach"
        title="Vitez Hrvoje — tap to chat"
        style={{
          position: 'fixed', bottom: 80, left: 16,
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--card)',
          border: showUrgency ? '2.5px solid rgba(220,38,38,.6)' : `2.5px solid ${accentColor}55`,
          boxShadow: showUrgency
            ? '0 4px 18px rgba(220,38,38,.3), 0 2px 6px rgba(0,0,0,.12)'
            : `0 4px 18px ${accentColor}28, 0 2px 6px rgba(0,0,0,.10)`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, zIndex: 100,
          animation: showUrgency
            ? 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both, lk-pulse 1.8s ease-in-out infinite'
            : 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
          transition: 'transform .15s ease, box-shadow .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <CroatianKnight size={42} mood={isStreakRisk ? 'sad' : mood} variant={0} />
        {showUrgency && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: '#dc2626', border: '2px solid var(--card)',
            boxShadow: '0 0 6px rgba(220,38,38,.6)',
          }} />
        )}
      </button>
    );
  }

  // ── Full mode — speech bubble card ────────────────────────────────────────
  return (
    <motion.div
      key="knight-full"
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: animOut ? 0 : 1, y: animOut ? -8 : 0, scale: animOut ? 0.96 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      style={{
        position: 'relative',
        background: 'var(--card)',
        borderRadius: 18,
        border: '1.5px solid var(--card-b)',
        marginBottom: 14,
        overflow: 'visible',
        boxShadow: `0 2px 14px ${accentColor}18, 0 1px 3px rgba(0,0,0,.06)`,
      }}
    >
      <CelebrationBurst active={celebBurst} />
      <div style={{ padding: '12px 14px' }}>

        {/* ── Header row: name + badges + dismiss ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Outfit',sans-serif" }}>
            Vitez Hrvoje
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, color: accentColor,
            background: `${accentColor}14`, border: `1px solid ${accentColor}30`,
            borderRadius: 10, padding: '1px 7px', letterSpacing: '.04em', textTransform: 'uppercase',
          }}>
            Lv {level}
          </span>
          {streak > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#d97706',
              background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.22)',
              borderRadius: 10, padding: '1px 7px',
            }}>
              🔥 {streak}d
            </span>
          )}
          {isStreakRisk && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#dc2626',
              background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.22)',
              borderRadius: 10, padding: '1px 7px',
            }}>
              💔 streak lost
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: 'none', border: 'none', color: 'var(--subtext)',
              fontSize: 17, cursor: 'pointer', lineHeight: 1,
              padding: '2px 4px', borderRadius: 4, opacity: .5,
            }}
          >×</button>
        </div>

        {/* ── Speech bubble (full-width — knight is already in the hero banner above) ── */}
        <div
          role="button"
          tabIndex={0}
          onClick={cycleBubble}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') cycleBubble(); }}
          title="Tap to hear something new"
          style={{
            position: 'relative',
            background: 'var(--card)',
            border: `1.5px solid ${accentColor}33`,
            borderRadius: 14,
            padding: '10px 14px 8px',
            cursor: 'pointer',
            boxShadow: `0 2px 10px ${accentColor}14`,
            transition: 'border-color .2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${accentColor}66`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${accentColor}33`; }}
        >
          {/* Message text with typewriter */}
          <p style={{
            margin: 0, fontSize: 13, color: 'var(--subtext)',
            lineHeight: 1.6, fontWeight: 500, minHeight: 36,
          }}>
            <TypewriterText text={text} />
          </p>

          {/* Tap hint */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 3, marginTop: 6,
          }}>
            <span style={{ fontSize: 9, color: `${accentColor}77`, fontWeight: 600, letterSpacing: '.04em' }}>
              tap for more
            </span>
            <span style={{ fontSize: 11, color: `${accentColor}77` }}>↺</span>
          </div>
        </div>

        {/* ── Quick-reply buttons ── */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap',
          animation: 'spring-in .4s .15s ease both',
        }}>
          <QuickReply
            label="🏛️ Culture"
            color="#d97706"
            onClick={() => setGreeting(pickPool(QUICK_CULTURE, 'culture'))}
          />
          <QuickReply
            label="📐 Grammar"
            color="#7c3aed"
            onClick={() => setGreeting(pickPool(QUICK_GRAMMAR, 'grammar'))}
          />
          <QuickReply
            label="💪 Krenimo!"
            color="#16a34a"
            onClick={() => setGreeting(pickPool(QUICK_MOTIVATE, 'motivate'))}
          />
        </div>
      </div>
    </motion.div>
  );
}
