import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from './CroatianKnight';

// Returns a contextual greeting based on time, streak, stats.
// Includes loss-aversion messaging when streak is broken (lc>0, streak=0).
function getGreeting(st) {
  const hour = new Date().getHours();
  const streak = st?.ss || st?.streak?.count || 0;
  const xp = st?.xp || 0;
  const lc = st?.lc || 0;

  const timeGreeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobra večer';

  if (lc > 0 && streak === 0) {
    return { mood: 'sad', variant: 0, text: `${timeGreeting}... Your streak is broken. But every champion has setbacks — come back and rebuild it! 💪` };
  }
  if (lc > 0 && streak === 1 && hour >= 20) {
    return { mood: 'encouraged', variant: 0, text: `Don't let your streak slip! One quick lesson keeps the fire going. 🔥` };
  }
  if (streak >= 30) {
    return { mood: 'celebrating', variant: 0, text: `${streak} days strong — you're a true Hrvat! Keep the flame alive today. 🔥` };
  }
  if (streak >= 7) {
    return { mood: 'happy', variant: 1, text: `${streak}-day streak — you're building real momentum. Keep going! 💪` };
  }
  if (xp >= 1000 && lc >= 10) {
    return { mood: 'happy', variant: 2, text: `${xp.toLocaleString()} XP earned — impressive dedication. Today's lesson awaits! 🎓` };
  }
  if (lc === 0) {
    return { mood: 'happy', variant: 0, text: `Ready to start your Croatian journey? Your first lesson awaits! 🇭🇷` };
  }
  if (hour < 12) {
    return { mood: 'thinking', variant: 0, text: `${timeGreeting}! Morning practice sticks better — your brain is fresh. Let's go!` };
  }
  if (hour >= 20) {
    return { mood: 'happy', variant: 2, text: `${timeGreeting}! Evening session — great way to end the day. Hajde! 💪` };
  }
  const day = new Date().getDay();
  const messages = [
    { mood: 'happy',       variant: 0, text: `Every word you learn brings Croatia closer. Hajde! 🇭🇷` },
    { mood: 'thinking',    variant: 1, text: `Did you know? Croatian has 7 grammatical cases — let's master them!` },
    { mood: 'happy',       variant: 1, text: `Your ancestors spoke this language. Today, you carry it forward. 💙` },
    { mood: 'celebrating', variant: 1, text: `Language is the soul of culture. Let's learn some today! 🌟` },
    { mood: 'encouraged',  variant: 0, text: `Ima li tko tko voli učiti? Ja volim! Let's go! 🎉` },
    { mood: 'thinking',    variant: 2, text: `Small steps every day. You're building something beautiful. 🏛️` },
    { mood: 'happy',       variant: 2, text: `Naša Hrvatska čeka! Croatia is waiting — let's learn! 🇭🇷` },
  ];
  return messages[day % messages.length];
}

// Mood → accent color
const MOOD_COLOR = {
  happy:       '#0e7490',
  thinking:    '#7c3aed',
  celebrating: '#d97706',
  sad:         '#dc2626',
  encouraged:  '#16a34a',
  confused:    '#78716c',
  neutral:     '#64748b',
};

function _todayKey(base) {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return base + '_' + today;
}

function KnightSpeech({ st, sessionKey = 'nh_knight_greeted', onDismiss = undefined, nextItem = null, onLaunchNext = null, streak = 0, level = 1 }) {
  const [mode, setMode] = useState('hidden');
  const [animOut, setAnimOut] = useState(false);
  const [celebGreeting, setCelebGreeting] = useState(null);

  useEffect(() => {
    const dayKey = _todayKey(sessionKey);
    if (!localStorage.getItem(dayKey)) {
      const t = setTimeout(() => setMode('full'), 500);
      return () => clearTimeout(t);
    } else {
      setMode('mini');
    }
    return undefined;
  }, [sessionKey]);

  useEffect(() => {
    let celebTimer = null;
    const onCelebrate = (e) => {
      const detail = e.detail || {};
      if (detail.text) setCelebGreeting({ mood: detail.mood || 'celebrating', variant: 1, text: detail.text });
      setAnimOut(false);
      setMode('full');
      clearTimeout(celebTimer);
      celebTimer = setTimeout(() => {
        setCelebGreeting(null);
        setMode('mini');
      }, 5000);
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => {
      window.removeEventListener('knight:celebrate', onCelebrate);
      clearTimeout(celebTimer);
    };
  }, []);

  const dismiss = () => {
    setAnimOut(true);
    localStorage.setItem(_todayKey(sessionKey), '1');
    setTimeout(() => {
      setAnimOut(false);
      setMode('mini');
      if (onDismiss) onDismiss();
    }, 280);
  };

  const expandFromMini = () => setMode('full');

  if (mode === 'hidden') return null;

  const greeting = celebGreeting || getGreeting(st);
  const { mood, variant, text } = greeting;
  const lc = st?.lc || 0;
  const isStreakBroken = lc > 0 && streak === 0;
  const accentColor = MOOD_COLOR[mood] || MOOD_COLOR.happy;

  // ── Mini mode — floating button above tab bar ──────────────────────────────
  if (mode === 'mini') {
    return (
      <button
        onClick={expandFromMini}
        aria-label="Chat with your knight companion"
        title="Vitez Hrvoje — your Croatian coach"
        style={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--card)',
          border: isStreakBroken ? '2.5px solid rgba(220,38,38,0.5)' : `2.5px solid ${accentColor}55`,
          boxShadow: isStreakBroken
            ? '0 4px 16px rgba(220,38,38,0.25), 0 2px 6px rgba(0,0,0,0.12)'
            : `0 4px 16px ${accentColor}30, 0 2px 6px rgba(0,0,0,0.12)`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          zIndex: 100,
          animation: 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <CroatianKnight size={42} mood={isStreakBroken ? 'sad' : 'happy'} variant={0} />
      </button>
    );
  }

  // ── Full mode — action-forward coaching card ───────────────────────────────
  return (
    <motion.div
      key="knight-full"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: animOut ? 0 : 1, y: animOut ? -8 : 0, scale: animOut ? 0.97 : 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      style={{
        position: 'relative',
        background: 'var(--card)',
        borderRadius: 18,
        border: '1.5px solid var(--card-b)',
        marginBottom: 14,
        overflow: 'hidden',
        boxShadow: `0 2px 12px ${accentColor}18, 0 1px 3px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Colour accent bar on left edge */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`,
        borderRadius: '18px 0 0 18px',
      }} />

      <div style={{ padding: '14px 16px 14px 20px' }}>

        {/* ── Top row: knight + identity + dismiss ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

          {/* Knight avatar */}
          <div style={{ flexShrink: 0, marginTop: -4 }}>
            <CroatianKnight size={72} mood={mood} variant={variant} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Name + level badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Outfit',sans-serif" }}>
                Vitez Hrvoje
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800, color: accentColor,
                background: `${accentColor}14`, border: `1px solid ${accentColor}33`,
                borderRadius: 10, padding: '1px 7px', letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}>
                Lv {level}
              </span>
              {streak > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: isStreakBroken ? '#dc2626' : '#d97706',
                  background: isStreakBroken ? 'rgba(220,38,38,.08)' : 'rgba(217,119,6,.08)',
                  border: `1px solid ${isStreakBroken ? 'rgba(220,38,38,.2)' : 'rgba(217,119,6,.2)'}`,
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {isStreakBroken ? '💔' : '🔥'} {streak}d
                </span>
              )}
            </div>

            {/* Speech text */}
            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--subtext)',
              lineHeight: 1.55,
              fontWeight: 500,
            }}>
              {text}
            </p>

          </div>

          {/* Dismiss × */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              flexShrink: 0, alignSelf: 'flex-start',
              background: 'none', border: 'none',
              color: 'var(--subtext)', fontSize: 16,
              cursor: 'pointer', lineHeight: 1,
              padding: '2px 2px', borderRadius: 4,
              opacity: 0.6,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Action button: launch next lesson ── */}
        {nextItem && onLaunchNext && (
          <button
            onClick={() => { onLaunchNext(nextItem); dismiss(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', marginTop: 12,
              padding: '10px 14px',
              background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}0a)`,
              border: `1.5px solid ${accentColor}33`,
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Outfit',sans-serif",
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}22`; e.currentTarget.style.borderColor = `${accentColor}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${accentColor}18, ${accentColor}0a)`; e.currentTarget.style.borderColor = `${accentColor}33`; }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: accentColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#fff',
            }}>▶</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
                Next Up
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextItem.name}
              </div>
            </div>
            {nextItem.dur && (
              <span style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600, flexShrink: 0 }}>
                {nextItem.dur}
              </span>
            )}
          </button>
        )}

      </div>
    </motion.div>
  );
}

export default React.memo(KnightSpeech, (prev, next) =>
  prev.st === next.st &&
  prev.sessionKey === next.sessionKey &&
  prev.nextItem === next.nextItem &&
  prev.streak === next.streak &&
  prev.level === next.level
);
