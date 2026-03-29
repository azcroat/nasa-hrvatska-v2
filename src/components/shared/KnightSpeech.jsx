import React, { useState, useEffect, useMemo } from 'react';
import CroatianKnight from './CroatianKnight';

// Returns a contextual greeting based on time, streak, stats.
// Includes loss-aversion messaging when streak is broken (lc>0, streak=0).
function getGreeting(st) {
  const hour = new Date().getHours();
  const streak = st?.ss || st?.streak?.count || 0;
  const xp = st?.xp || 0;
  const lc = st?.lc || 0;

  const timeGreeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobra večer';

  // Broken streak — sad knight, loss aversion
  if (lc > 0 && streak === 0) {
    return { mood: 'sad', variant: 0, text: `${timeGreeting}... Your streak is broken. But every champion has setbacks — come back and rebuild it! 💪` };
  }
  // Streak at risk (only practiced very recently, encourage)
  if (lc > 0 && streak === 1 && hour >= 20) {
    return { mood: 'encouraged', variant: 0, text: `Don't let your streak slip! One quick lesson keeps the fire going. 🔥` };
  }
  // Long streak
  if (streak >= 30) {
    return { mood: 'celebrating', variant: 0, text: `${timeGreeting}! 🔥 ${streak} days strong — you're a true Hrvat!` };
  }
  // Weekly streak
  if (streak >= 7) {
    return { mood: 'happy', variant: 1, text: `${timeGreeting}! 💪 ${streak}-day streak — keep it going!` };
  }
  // Experienced learner
  if (xp >= 1000 && lc >= 10) {
    return { mood: 'happy', variant: 2, text: `${timeGreeting}! You've earned ${xp} XP — impressive dedication! 🎓` };
  }
  // Brand new user
  if (lc === 0) {
    return { mood: 'happy', variant: 0, text: `${timeGreeting}! Ready to start your Croatian journey? Your first lesson awaits! 🇭🇷` };
  }
  // Morning
  if (hour < 12) {
    return { mood: 'thinking', variant: 0, text: `${timeGreeting}! Morning practice is the best practice. Ready to learn?` };
  }
  // Late evening
  if (hour >= 20) {
    return { mood: 'happy', variant: 2, text: `${timeGreeting}! Evening session — great way to end the day. Hajde! 💪` };
  }

  // Afternoon — day-of-week rotation
  const day = new Date().getDay();
  const messages = [
    { mood: 'happy',       variant: 0, text: `${timeGreeting}! Every word you learn brings Croatia closer. Hajde! 🇭🇷` },
    { mood: 'thinking',    variant: 1, text: `${timeGreeting}! Did you know? Croatian has 7 grammatical cases — let's master them!` },
    { mood: 'happy',       variant: 1, text: `${timeGreeting}! Your ancestors spoke this language. Today, you carry it forward. 💙` },
    { mood: 'celebrating', variant: 1, text: `${timeGreeting}! Language is the soul of culture. Let's learn some today! 🌟` },
    { mood: 'encouraged',  variant: 0, text: `${timeGreeting}! Ima li tko tko voli učiti? Ja volim! Let's go! 🎉` },
    { mood: 'thinking',    variant: 2, text: `${timeGreeting}! Small steps every day. You're building something beautiful. 🏛️` },
    { mood: 'happy',       variant: 2, text: `${timeGreeting}! Naša Hrvatska čeka! Croatia is waiting — let's learn! 🇭🇷` },
  ];
  return messages[day % messages.length];
}

// Build a date-keyed storage key so the knight greets fresh every calendar day.
function _todayKey(base) {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return base + '_' + today;
}

// Three-state mode machine:
//   'hidden' → 'full'  (600ms after mount, once per calendar day)
//   'full'   → 'mini'  (on user dismiss — knight persists as floating button)
//   'mini'   → 'full'  (on mini-button tap, or on knight:celebrate CustomEvent)
function KnightSpeech({ st, sessionKey = 'nh_knight_greeted', onDismiss = undefined }) {
  const [mode, setMode] = useState('hidden');
  const [animOut, setAnimOut] = useState(false);
  const [celebGreeting, setCelebGreeting] = useState(null);

  useEffect(() => {
    const dayKey = _todayKey(sessionKey);
    if (!localStorage.getItem(dayKey)) {
      const t = setTimeout(() => setMode('full'), 600);
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
      clearTimeout(celebTimer); // cancel any previous pending collapse
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
    }, 300);
  };

  const expandFromMini = () => setMode('full');

  // Only recalculate container style when animOut changes
  const containerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 16px 16px',
    background: 'var(--card)',
    borderRadius: 20,
    border: '1.5px solid var(--card-b)',
    marginBottom: 14,
    boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
    animation: animOut ? 'fade-down .3s ease forwards' : 'spring-in .45s cubic-bezier(0.34,1.56,0.64,1) both',
    position: 'relative',
    textAlign: 'center',
    gap: 0,
  }), [animOut]);

  if (mode === 'hidden') return null;

  const greeting = celebGreeting || getGreeting(st);
  const { mood, variant, text } = greeting;
  const streak = st?.ss || st?.streak?.count || 0;
  const lc = st?.lc || 0;
  const isStreakBroken = lc > 0 && streak === 0;

  // ── Mini mode — floating button above tab bar ──────────────────────────────
  if (mode === 'mini') {
    return (
      <button
        onClick={expandFromMini}
        aria-label="Chat with your knight companion"
        title="Your Croatian knight companion"
        style={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--card)',
          border: isStreakBroken ? '2.5px solid rgba(220,38,38,0.5)' : '2.5px solid var(--info-b)',
          boxShadow: isStreakBroken
            ? '0 4px 16px rgba(220,38,38,0.25), 0 2px 6px rgba(0,0,0,0.12)'
            : '0 4px 16px rgba(14,116,144,0.25), 0 2px 6px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          zIndex: 100,
          animation: 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <CroatianKnight size={42} mood={isStreakBroken ? 'sad' : 'happy'} variant={0} />
      </button>
    );
  }

  // ── Full mode — mascot-forward card ───────────────────────────────────────
  // Knight is the visual hero; name + title below; speech bubble below that.
  return (
    <div style={containerStyle}>
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss greeting"
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          background: 'none',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 18,
          cursor: 'pointer',
          lineHeight: 1,
          padding: '2px 4px',
          borderRadius: 4,
        }}
      >
        ×
      </button>

      {/* Knight — large and centered */}
      <div style={{ marginBottom: 6 }}>
        <CroatianKnight size={96} mood={mood} variant={variant} />
      </div>

      {/* Identity */}
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 1 }}>
        Vitez Hrvoje
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--info)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 12,
      }}>
        Your Croatian Companion
      </div>

      {/* Speech bubble */}
      <div style={{
        background: isStreakBroken ? 'rgba(220,38,38,0.06)' : 'var(--app-bg)',
        border: isStreakBroken ? '1px solid rgba(220,38,38,0.2)' : '1px solid var(--card-b)',
        borderRadius: 14,
        padding: '12px 16px',
        fontSize: 14,
        color: 'var(--heading)',
        lineHeight: 1.55,
        fontWeight: 500,
        maxWidth: 280,
        position: 'relative',
      }}>
        {/* Speech bubble tail pointing up */}
        <div style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: isStreakBroken ? '8px solid rgba(220,38,38,0.2)' : '8px solid var(--card-b)',
        }} />
        <div style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: isStreakBroken ? '7px solid rgba(220,38,38,0.06)' : '7px solid var(--app-bg)',
        }} />
        {text}
      </div>
    </div>
  );
}

export default React.memo(KnightSpeech, (prev, next) =>
  prev.st === next.st && prev.sessionKey === next.sessionKey
);
