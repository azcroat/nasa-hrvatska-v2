import React, { useState, useEffect, useMemo } from 'react';
import CroatianKnight from './CroatianKnight';

// Returns a contextual greeting message based on time, streak, stats.
// Each entry now includes a `variant` (0–2) so the knight's animation has
// a specific, purposeful meaning rather than random selection.
//
// Variant semantics per mood:
//   happy:       0=float(serene), 1=strut+wave(active), 2=glide+wave(relaxed)
//   thinking:    0=tilt+think(pondering), 1=sway+think(weighing), 2=rock+think(deep focus)
//   celebrating: 0=bounce+arms-up(milestone), 1=cheer+pump(fresh win), 2=pulse+wave(sustained joy)
//   encouraged:  0=float+encourage, 1=nod+up, 2=march+encourage
function getGreeting(st) {
  const hour = new Date().getHours();
  const streak = st?.ss || st?.streak?.count || 0;
  const xp = st?.xp || 0;
  const lc = st?.lc || 0;

  const timeGreeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobra večer';

  // Long streak — bounce with both arms raised (milestone achievement)
  if (streak >= 30) {
    return { mood: 'celebrating', variant: 0, text: `${timeGreeting}! 🔥 ${streak} days strong — you're a true Hrvat!` };
  }
  // Weekly streak — strut with arm wave (active, motivated)
  if (streak >= 7) {
    return { mood: 'happy', variant: 1, text: `${timeGreeting}! 💪 ${streak}-day streak — keep it going!` };
  }
  // Experienced learner — glide with wave (relaxed confidence)
  if (xp >= 1000 && lc >= 10) {
    return { mood: 'happy', variant: 2, text: `${timeGreeting}! You've earned ${xp} XP — impressive dedication! 🎓` };
  }
  // Brand new user — float (welcoming, gentle)
  if (lc === 0) {
    return { mood: 'happy', variant: 0, text: `${timeGreeting}! Ready to start your Croatian journey? Your first lesson awaits! 🇭🇷` };
  }
  // Morning — thinking/tilt (contemplative, ready to focus)
  if (hour < 12) {
    return { mood: 'thinking', variant: 0, text: `${timeGreeting}! Morning practice is the best practice. Ready to learn?` };
  }
  // Late evening — glide (relaxed, wind-down energy)
  if (hour >= 20) {
    return { mood: 'happy', variant: 2, text: `${timeGreeting}! Evening session — great way to end the day. Hajde! 💪` };
  }

  // Afternoon — day-of-week purposeful rotation
  const day = new Date().getDay();
  const messages = [
    { mood: 'happy',      variant: 0, text: `${timeGreeting}! Every word you learn brings Croatia closer. Hajde! 🇭🇷` },       // Sun — float, calm start
    { mood: 'thinking',   variant: 1, text: `${timeGreeting}! Did you know? Croatian has 7 grammatical cases — let's master them together!` }, // Mon — sway, curious
    { mood: 'happy',      variant: 1, text: `${timeGreeting}! Your ancestors spoke this language. Today, you carry it forward. 💙` }, // Tue — strut, purposeful
    { mood: 'celebrating',variant: 1, text: `${timeGreeting}! Language is the soul of culture. Let's learn some today! 🌟` },  // Wed — cheer, mid-week energy
    { mood: 'encouraged', variant: 0, text: `${timeGreeting}! Ima li tko tko voli učiti? Ja volim! Let's go! 🎉` },            // Thu — encourage, momentum
    { mood: 'thinking',   variant: 2, text: `${timeGreeting}! Small steps every day. You're building something beautiful. 🏛️` }, // Fri — deep focus, reflect
    { mood: 'happy',      variant: 2, text: `${timeGreeting}! Naša Hrvatska čeka! Croatia is waiting — let's learn! 🇭🇷` },    // Sat — glide, relaxed
  ];
  return messages[day % messages.length];
}

// Static style objects — defined outside component to avoid re-creation on every render
const MINI_BUTTON_STYLE = {
  position: 'fixed',
  bottom: 80,
  left: 16,
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'var(--card)',
  border: '2.5px solid var(--info-b)',
  boxShadow: '0 4px 16px rgba(14,116,144,0.25), 0 2px 6px rgba(0,0,0,0.12)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  zIndex: 100,
  animation: 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const DISMISS_BTN_STYLE = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'none',
  border: 'none',
  color: 'var(--subtext)',
  fontSize: 16,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '2px 4px',
  borderRadius: 4,
};

// Build a date-keyed storage key so the knight greets fresh every calendar day.
// sessionKey prop overrides the base name (e.g. for placement screens).
function _todayKey(base) {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return base + '_' + today;
}

// Three-state mode machine:
//   'hidden'  → 'full'  (800ms after mount, once per calendar day)
//   'full'    → 'mini'  (on user dismiss — knight persists as floating button)
//   'mini'    → 'full'  (on mini-button tap, or on knight:celebrate CustomEvent)
function KnightSpeech({ st, sessionKey = 'nh_knight_greeted', onDismiss = undefined }) {
  const [mode, setMode] = useState('hidden'); // 'hidden' | 'full' | 'mini'
  const [animOut, setAnimOut] = useState(false);
  const [celebGreeting, setCelebGreeting] = useState(null); // override text during celebrations

  // Greet the user once per calendar day. After dismissal: mini for the rest of today.
  useEffect(() => {
    const dayKey = _todayKey(sessionKey);
    if (!localStorage.getItem(dayKey)) {
      const t = setTimeout(() => setMode('full'), 600);
      return () => clearTimeout(t);
    } else {
      // Already greeted today — go directly to mini so knight stays accessible
      setMode('mini');
    }
    return undefined;
  }, [sessionKey]);

  // Listen for knight:celebrate events from useAward (significant XP earn)
  useEffect(() => {
    const onCelebrate = (e) => {
      const detail = e.detail || {};
      if (detail.text) setCelebGreeting({ mood: detail.mood || 'celebrating', variant: 1, text: detail.text });
      setAnimOut(false);
      setMode('full');
      // Auto-dismiss back to mini after 5 seconds
      const t = setTimeout(() => {
        setCelebGreeting(null);
        setMode('mini');
      }, 5000);
      return () => clearTimeout(t);
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
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

  const expandFromMini = () => {
    setMode('full');
  };

  // Must be called before any conditional returns (Rules of Hooks)
  // Only changes when animOut changes — prevents new object on every render
  const fullModeStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    padding: '12px 16px',
    background: 'var(--card)',
    borderRadius: 16,
    border: '1.5px solid var(--card-b)',
    marginBottom: 14,
    boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
    animation: animOut ? 'fade-down .3s ease forwards' : 'spring-in .45s cubic-bezier(0.34,1.56,0.64,1) both',
    position: 'relative',
  }), [animOut]);

  if (mode === 'hidden') return null;

  const greeting = celebGreeting || getGreeting(st);
  const { mood, variant, text } = greeting;

  // ── Mini mode — floating button above tab bar ──────────────────────────────
  if (mode === 'mini') {
    return (
      <button
        onClick={expandFromMini}
        aria-label="Chat with your knight companion"
        title="Your Croatian knight companion"
        style={MINI_BUTTON_STYLE}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,116,144,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,116,144,0.25), 0 2px 6px rgba(0,0,0,0.12)'; }}
      >
        <CroatianKnight size={38} mood="happy" variant={0} />
      </button>
    );
  }

  // ── Full mode — speech bubble ──────────────────────────────────────────────
  return (
    <div style={fullModeStyle}>
      {/* Knight */}
      <div style={{ flexShrink: 0 }}>
        <CroatianKnight size={56} mood={mood} variant={variant} />
      </div>

      {/* Speech bubble */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--info)',
          marginBottom: 3,
        }}>
          Vitez govori · Your Knight
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--heading)',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          {text}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss greeting"
        style={DISMISS_BTN_STYLE}
      >
        ×
      </button>
    </div>
  );
}

// Memoize: KnightSpeech re-renders only when stats (xp/lc/streak) change.
// Prevents the CroatianKnight SVG animation from restarting on every parent render.
export default React.memo(KnightSpeech, (prev, next) =>
  prev.st === next.st && prev.sessionKey === next.sessionKey
);
