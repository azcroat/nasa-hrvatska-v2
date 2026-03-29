import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from './CroatianKnight';

// ── Utility ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _todayKey(base) {
  const d = new Date();
  return base + '_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ── Message engine — Vitez Hrvoje has real personality ────────────────────────
//
// Priority order (first match wins):
//   first visit → streak broken → evening danger → streak milestones →
//   XP milestones → lesson milestones → grammar specialist → morning →
//   late night → weekend/day-specific → general rotating pool
//
function getGreeting(st, streakCount, level) {
  const hour  = new Date().getHours();
  const day   = new Date().getDay(); // 0 = Sun
  const xp    = st?.xp  || 0;
  const lc    = st?.lc  || 0;  // lessons completed
  const gc    = st?.gc  || 0;  // grammar sessions
  const lc0   = lc === 0;
  const streakBroken = lc > 0 && streakCount === 0;

  // ── 1. First ever visit ───────────────────────────────────────────────────
  if (lc0) return pick([
    { mood: 'ready',     text: `Živjeli! I'm Vitez Hrvoje, your Croatian knight. Croatia has 1,200 years of history and one of Europe's most precise languages. Let's start writing yours. 🇭🇷` },
    { mood: 'happy',     text: `Dobro došli! Whether you have Croatian roots or just fell in love with this corner of Europe — you're in the right place. First lesson awaits. ⚔️` },
    { mood: 'encouraged',text: `Seven cases, tricky verbs, verb aspects — Croatian sounds hard. Here's the secret: it's perfectly phonetic. One letter, one sound, always. Let's go!` },
  ]);

  // ── 2. Streak broken — highest psychological leverage ─────────────────────
  if (streakBroken) return pick([
    { mood: 'sad',       text: `Nije dobro... Streak broken. But Nikola Tesla failed a thousand times before his breakthrough. One session and you're back. 💪` },
    { mood: 'sad',       text: `Streak gone. I've watched Hajduk Split fans rebuild hope after worse. Five minutes — the comeback starts now. ⚽` },
    { mood: 'encouraged',text: `Janica Kostelić broke her leg twice and still won four Olympic golds. Your streak broke. Come back and earn it again. 🎿` },
    { mood: 'encouraged',text: `Nema veze. Every serious learner has gaps. The difference is: they showed back up. Your Croatian is still in there. 🔥` },
    { mood: 'sad',       text: `Streak lost. This is the exact moment most people quit. Don't be most people. Jedno lekcija — one lesson. Start now.` },
  ]);

  // ── 3. Evening streak danger (hour ≥ 21, streak alive) ───────────────────
  if (hour >= 21 && streakCount > 0) return pick([
    { mood: 'encouraged',text: `Pazi! Your streak expires at midnight. One lesson — even five minutes — keeps the fire alive. Don't let it die tonight. 🕛` },
    { mood: 'ready',     text: `Late night in Zagreb, the kafići are still full — and so is your next lesson. Don't lose the streak. ☕` },
    { mood: 'encouraged',text: `Almost midnight. The Dalmatian coast doesn't sleep and neither should your Croatian practice. Hajdemo! 🌊` },
    { mood: 'ready',     text: `One lesson before bed. That's all it takes. ${streakCount} days — too valuable to lose while you were just sitting here. ⚔️` },
  ]);

  // ── 4. Streak milestones ──────────────────────────────────────────────────
  if (streakCount >= 100) return { mood: 'victory',    text: `${streakCount} days. You're not learning Croatian anymore — you ARE Croatian. Svaka čast, majstore. 🏆` };
  if (streakCount >= 50)  return { mood: 'celebrating',text: `${streakCount}-day streak! Fifty days of showing up. The Adriatic has been waiting for someone with your dedication. 🌊` };
  if (streakCount >= 30)  return { mood: 'celebrating',text: `Trideset dana — 30 days straight! Most people quit long before now. Croatia noticed. 🇭🇷` };
  if (streakCount >= 21)  return { mood: 'celebrating',text: `Tri tjedna — 21 days. Habit science says this is when it sticks. I can confirm: it's sticking. 🔥` };
  if (streakCount >= 14)  return { mood: 'happy',      text: `Dva tjedna! Two weeks of Croatian. You've learned more than most diaspora kids will ever try. Keep going. 💙` };
  if (streakCount >= 7)   return { mood: 'happy',      text: `${streakCount}-day streak — a full week. Your brain is forming real Croatian pathways now. Sjajno! 💪` };
  if (streakCount >= 3)   return { mood: 'happy',      text: `${streakCount} days straight. Consistency beats intensity — you're proving it every single day. Hajde! ⚔️` };

  // ── 5. XP milestones ─────────────────────────────────────────────────────
  if (xp >= 5000) return { mood: 'victory',    text: `${xp.toLocaleString()} XP! You've crossed into territory where Croatian conversations start happening by accident. 🗣️` };
  if (xp >= 2500) return { mood: 'celebrating',text: `${xp.toLocaleString()} XP — you could order food, argue about football, and apologize in Croatian. Not bad at all. 🍽️` };
  if (xp >= 1000) return { mood: 'happy',      text: `${xp.toLocaleString()} XP. At this pace, a Croatian grandmother would understand you. That's a high bar. 👵` };
  if (xp >= 500)  return { mood: 'happy',      text: `500+ XP! You've moved past tourist Croatian into something real. A local would actually be impressed. 🇭🇷` };
  if (xp >= 100)  return { mood: 'encouraged', text: `Over 100 XP already. The momentum is real — now keep it going. 🔥` };

  // ── 6. Grammar specialist ─────────────────────────────────────────────────
  if (gc >= 10) return { mood: 'thinking', text: `${gc} grammar sessions. You're building the skeleton of Croatian — cases, aspect, everything. Most learners skip this. You didn't. 📐` };
  if (gc >= 5)  return { mood: 'thinking', text: `Five grammar sessions in. You've faced Croatian cases and survived. That earns respect, učenik. 📐` };

  // ── 7. Lesson count milestones ────────────────────────────────────────────
  if (lc >= 50) return { mood: 'celebrating',text: `${lc} lessons complete! The Pula Arena has stood 2,000 years — built stone by stone. So is your Croatian. 🏛️` };
  if (lc >= 25) return { mood: 'happy',      text: `${lc} lessons! Tesla, Ivanišević, Modrić — they all spoke Croatian. Progress report: so do you, increasingly. 🎾` };
  if (lc >= 10) return { mood: 'happy',      text: `${lc} lessons in. You've crossed from complete beginner to actual learner. That's the hardest crossing. 💙` };

  // ── 8. Morning (before 9am) ───────────────────────────────────────────────
  if (hour < 9) return pick([
    { mood: 'ready',     text: `Dobro jutro! Morning practice before the world wakes — this is how fluency is built. Your brain retains more now than any other time. 🌅` },
    { mood: 'happy',     text: `Early start. In Dubrovnik, fishermen are out before dawn. You're building something at the same hour. Hajdemo! 🌊` },
    { mood: 'encouraged',text: `Jutarnja kava i lekcija — morning coffee and a lesson. The Croatian way to start a day right. ☕` },
  ]);

  // ── 9. Late night (after 11pm) ────────────────────────────────────────────
  if (hour >= 23) return pick([
    { mood: 'neutral',  text: `Po noći — by night. A quiet mind absorbs language differently. Late learners often go the deepest. 🌙` },
    { mood: 'thinking', text: `Still at it past midnight. Most people are asleep. Most people also don't speak Croatian. 🌙` },
  ]);

  // ── 10. Weekend / day-specific ────────────────────────────────────────────
  if (day === 0) return pick([
    { mood: 'happy',     text: `Nedjelja — Sunday. No better day to learn something that lasts a lifetime. Croatia on Sundays smells like roasting lamb. 🥩` },
    { mood: 'neutral',   text: `Sunday session. In Dalmatia they call this "polako" time — slow down and do one thing well. Let's do that. ☀️` },
  ]);
  if (day === 6) return pick([
    { mood: 'celebrating',text: `Subota — Saturday! Weekend warriors are the unsung heroes of language learning. Hajde! 🎉` },
    { mood: 'happy',      text: `Saturday in Croatia = markets, coffee, sea. Learn the words, then go live them. 🛶` },
  ]);
  if (day === 1) return pick([
    { mood: 'encouraged', text: `Ponedjeljak — Monday. Fresh week, clean slate. The learners who study on Mondays are the ones who end up fluent. ⚔️` },
    { mood: 'ready',      text: `Monday. Set the tone now. Everything else this week will feel easier after this one session. 🛡️` },
  ]);
  if (day === 5) return pick([
    { mood: 'happy',      text: `Petak — Friday! End the week strong. Future-you at a Dalmatian wedding will be very grateful. 💃` },
    { mood: 'celebrating',text: `Friday session locked in. The Adriatic is calling and now you'll know what to say when you get there. 🌊` },
  ]);

  // ── 11. General rotating pool — 20+ messages with cultural texture ────────
  const pool = [
    { mood: 'happy',      text: `"Cravat" — the necktie — comes from "Hrvat" (Croatian). You already gave the world something. Now take the language back. 👔` },
    { mood: 'thinking',   text: `Croatian verb aspect — piti vs popiti, učiti vs naučiti. The same action, a different lens. Master this and you sound native. 📐` },
    { mood: 'happy',      text: `Split, Dubrovnik, Rovinj, Zadar — every city sounds more magical when you understand what the name means. Add vocabulary today. 🏛️` },
    { mood: 'encouraged', text: `"Lijepa naša" — Our beautiful homeland. First line of the Croatian anthem. Learn enough and you'll mean it when you sing it. 🎵` },
    { mood: 'happy',      text: `Marco Polo was (probably) born on Korčula. Adventure has always run through Croatian veins. Today, set sail. ⛵` },
    { mood: 'happy',      text: `The Dalmatian dog is named after Dalmatia. One small region. It named a breed the whole world knows. Small nation, big footprint. 🐾` },
    { mood: 'thinking',   text: `Clitic pronouns cluster in a precise order: auxiliary → dative → accusative → se. It's one of the trickiest things in Croatian — and one of the most satisfying to master. 🎓` },
    { mood: 'encouraged', text: `Polako, ali sigurno — slowly but surely. The Croatian phrase for exactly what language learning requires. No shortcuts. Just today's session. 🛡️` },
    { mood: 'ready',      text: `5 million Croatian speakers worldwide. With every session, you get measurably closer to joining them. Ready? ⚔️` },
    { mood: 'happy',      text: `Rakija flows in Dalmatia. Your sessions flow here. Both burn a little at first and get smoother with time. 🥃` },
    { mood: 'celebrating',text: `Hajduk Split's fans are called Torcida — most passionate supporters in the Balkans. Channel that energy into today's lesson. ⚽` },
    { mood: 'happy',      text: `Summer in Croatia: lavender from Hvar, rosemary from the stone walls, salt from the Adriatic. Learn enough and you'll experience it fully. 🌿` },
    { mood: 'encouraged', text: `Croatian diaspora spans six continents. Wherever you are, you're part of something bigger than one small country on the Adriatic. 🌍` },
    { mood: 'thinking',   text: `Croatian has been written in the same script since Gaj's 1830 reform. One alphabet, perfectly logical. No exceptions, no surprises. 📜` },
    { mood: 'happy',      text: `Diocletian's Palace in Split — built in 305 AD and people still live inside it. Croatians don't abandon things that work. Learn the language the same way. 🏰` },
    { mood: 'encouraged', text: `Ima tko tko voli učiti? Ja volim! The moment learning stops feeling like work is right around the corner. You're almost there. 🎯` },
    { mood: 'happy',      text: `Luka Modrić grew up in a hotel for refugees during the war. Won the Ballon d'Or. Croatian grit is real. Channel some today. ⚽` },
    { mood: 'thinking',   text: `7 cases. 2 verb aspects. 3 genders. This is Croatian grammar. It sounds like a lot — and it is. But it also means you can say exactly what you mean, always. 📐` },
    { mood: 'happy',      text: `Oliver Dragojević sang "Cesarica" and half of Yugoslavia cried. Music is the fastest way into a language. Learn the words. 🎶` },
    { mood: 'encouraged', text: `Svaki dan po malo — a little every day. That's all it takes. Today's little bit is right here. Hajde! 🔥` },
  ];

  return pool[(new Date().getDate() + day) % pool.length];
}

// ── Mood → accent color ───────────────────────────────────────────────────────
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

export default function KnightSpeech({
  st,
  sessionKey = 'nh_knight_greeted',
  onDismiss,
  streak = 0,
  level = 1,
}) {
  const [mode, setMode]           = useState('hidden');
  const [animOut, setAnimOut]     = useState(false);
  const [celebGreeting, setCelebGreeting] = useState(null);

  // ── Initial show: full once per day, mini thereafter ─────────────────────
  useEffect(() => {
    const dayKey = _todayKey(sessionKey);
    const t = setTimeout(() => {
      setMode(localStorage.getItem(dayKey) ? 'mini' : 'full');
    }, 600);
    return () => clearTimeout(t);
  }, [sessionKey]);

  // ── knight:celebrate custom event (fired by useAward on XP milestones) ───
  useEffect(() => {
    let timer = null;
    const onCelebrate = (e) => {
      const d = e.detail || {};
      if (d.text) setCelebGreeting({ mood: d.mood || 'celebrating', text: d.text });
      setAnimOut(false);
      setMode('full');
      clearTimeout(timer);
      timer = setTimeout(() => { setCelebGreeting(null); setMode('mini'); }, 5500);
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => { window.removeEventListener('knight:celebrate', onCelebrate); clearTimeout(timer); };
  }, []);

  const dismiss = () => {
    setAnimOut(true);
    localStorage.setItem(_todayKey(sessionKey), '1');
    setTimeout(() => { setAnimOut(false); setMode('mini'); if (onDismiss) onDismiss(); }, 280);
  };

  if (mode === 'hidden') return null;

  const greeting     = celebGreeting || getGreeting(st, streak, level);
  const { mood, text } = greeting;
  const lc           = st?.lc || 0;
  const isStreakRisk = lc > 0 && streak === 0;
  const isEveningRisk = lc > 0 && streak > 0 && new Date().getHours() >= 21;
  const showUrgency  = isStreakRisk || isEveningRisk;
  const accentColor  = MOOD_COLOR[mood] || MOOD_COLOR.happy;

  // ── Mini mode — floating button, bottom-left ──────────────────────────────
  if (mode === 'mini') {
    return (
      <button
        onClick={() => setMode('full')}
        aria-label="Chat with Vitez Hrvoje, your Croatian coach"
        title="Vitez Hrvoje — your Croatian coach"
        style={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--card)',
          border: showUrgency
            ? '2.5px solid rgba(220,38,38,0.6)'
            : `2.5px solid ${accentColor}55`,
          boxShadow: showUrgency
            ? '0 4px 18px rgba(220,38,38,0.3), 0 2px 6px rgba(0,0,0,0.12)'
            : `0 4px 18px ${accentColor}28, 0 2px 6px rgba(0,0,0,0.10)`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          zIndex: 100,
          animation: showUrgency
            ? 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both, lk-pulse 1.8s ease-in-out infinite'
            : 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <CroatianKnight size={42} mood={isStreakRisk ? 'sad' : mood} variant={0} />
        {/* Urgency dot */}
        {showUrgency && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: '#dc2626',
            border: '2px solid var(--card)',
            boxShadow: '0 0 6px rgba(220,38,38,0.6)',
          }} />
        )}
      </button>
    );
  }

  // ── Full mode — coaching card ─────────────────────────────────────────────
  return (
    <motion.div
      key="knight-full"
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: animOut ? 0 : 1, y: animOut ? -10 : 0, scale: animOut ? 0.96 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      style={{
        position: 'relative',
        background: 'var(--card)',
        borderRadius: 18,
        border: '1.5px solid var(--card-b)',
        marginBottom: 14,
        overflow: 'hidden',
        boxShadow: `0 2px 14px ${accentColor}1a, 0 1px 3px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${accentColor}, ${accentColor}77)`,
        borderRadius: '18px 0 0 18px',
      }} />

      <div style={{ padding: '14px 16px 14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

          {/* Knight */}
          <div style={{ flexShrink: 0, marginTop: -4 }}>
            <CroatianKnight size={72} mood={mood} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
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
                  fontSize: 10, fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217,119,6,.08)',
                  border: '1px solid rgba(217,119,6,.22)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  🔥 {streak}d
                </span>
              )}
              {isStreakRisk && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: '#dc2626',
                  background: 'rgba(220,38,38,.08)',
                  border: '1px solid rgba(220,38,38,.22)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  💔 streak lost
                </span>
              )}
            </div>

            {/* Speech */}
            <p style={{ margin: 0, fontSize: 13, color: 'var(--subtext)', lineHeight: 1.58, fontWeight: 500 }}>
              {text}
            </p>

          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              flexShrink: 0, alignSelf: 'flex-start',
              background: 'none', border: 'none',
              color: 'var(--subtext)', fontSize: 17,
              cursor: 'pointer', lineHeight: 1,
              padding: '2px 4px', borderRadius: 4, opacity: 0.5,
            }}
          >×</button>
        </div>
      </div>
    </motion.div>
  );
}
