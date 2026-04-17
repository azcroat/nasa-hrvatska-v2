// @ts-nocheck
/**
 * KnightCompanion — global ambient knight for all non-home screens.
 *
 * Rendered once in App.jsx. On home/dashboard it returns null (KnightSpeech
 * in HomeTab handles that screen). On every other screen it:
 *   • Shows a fixed-position mini knight button (bottom-left, same spot as
 *     KnightSpeech mini — HomeTab unmounts KnightSpeech when leaving home).
 *   • Listens for `knight:speak` custom events (dispatched by key screens via
 *     knightSpeak()) and pops up a floating speech bubble above the button.
 *   • Also shows a bubble on tap with a rotating pool of motivational messages.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from './CroatianKnight';
// On Android WebView (Capacitor), Framer Motion entry animations with opacity:0
// can stall permanently. Skip entry animation on native.
const _isNative = typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' && !window.location.port;
import { useApp } from '../../context/AppContext';
import { getStreak } from '../../data';
import { dbgInfo } from '../../lib/debugLog';

// ── Mood → accent colour ──────────────────────────────────────────────────────
const MOOD_COLOR = {
  happy:       '#0e7490',
  thinking:    '#7c3aed',
  celebrating: '#d97706',
  victory:     '#b45309',
  sad:         '#dc2626',
  encouraged:  '#16a34a',
  ready:       '#1d4ed8',
  neutral:     '#64748b',
};

// ── Screen → appropriate knight mood ─────────────────────────────────────────
// Hrvoje picks up on context: quiz = ready/thinking, reading = happy, etc.
const SCREEN_MOOD_MAP = {
  // Learning
  lesson:               'thinking',
  grammar:              'thinking',
  grammar_track:        'thinking',
  padezi:               'thinking',
  padezifull:           'thinking',
  tenses:               'thinking',
  aspect:               'thinking',
  modal:                'thinking',
  declension:           'thinking',
  conditional:          'thinking',
  impersonal:           'thinking',
  clitic:               'thinking',
  formalregister:       'thinking',
  past_tense_lesson:    'thinking',
  future_tense_lesson:  'thinking',
  alphabet:             'thinking',
  phonology:            'thinking',
  // Practice
  flashcards:           'thinking',
  mcgame:               'ready',
  mcresult:             'happy',
  typing:               'ready',
  listening:            'thinking',
  speaking:             'ready',
  review:               'encouraged',
  wordsprint:           'marching',
  cefrtest:             'ready',
  dictation:            'thinking',
  dialogue:             'ready',
  shadowing:            'thinking',
  adaptive_review:      'encouraged',
  production_drill:     'ready',
  listeningpath:        'thinking',
  // Croatia / culture
  storymode:            'happy',
  readlist:             'happy',
  reading:              'happy',
  history:              'thinking',
  immersion:            'happy',
  roleplay:             'ready',
  idioms:               'happy',
  proverbs:             'happy',
  advanced_vocab:       'happy',
  // Path
  learnpath:            'marching',
  learnpath_widget:     'marching',
};

// ── Mood escalation based on current streak ───────────────────────────────────
// Long streaks earn a more enthusiastic knight baseline.
function getStreakMood(count) {
  if (count >= 30) return 'celebrating';
  if (count >= 14) return 'victory';
  if (count >= 7)  return 'marching';
  if (count >= 3)  return 'happy';
  return null;
}

// ── Messages shown when user taps the mini button ────────────────────────────
const TAP_POOL = [
  { mood: 'ready',      text: 'Hajdemo! Vitez Hrvoje rides with you. ⚔️' },
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. You\'re doing it. 💪' },
  { mood: 'thinking',   text: 'Fun fact: Croatian is perfectly phonetic. Every letter, one sound, always. 📐' },
  { mood: 'happy',      text: '"Koliko jezika znaš, toliko vrijediš." You\'re worth as many people as languages you speak. 🇭🇷' },
  { mood: 'encouraged', text: 'Svaki dan po malo — a little every day. Fluency is an accumulation, not a moment. 🔥' },
  { mood: 'happy',      text: 'Croatia: 1,200 years of history, one of Europe\'s most precise languages. You chose well. 🏛️' },
];

// ─── Celebration particle burst ───────────────────────────────────────────────
const PARTY_COLORS = ['#CC0022', '#F4F0E2', '#D4A400', '#EE3042', '#FFDC3C'];
function CelebrationBurst({ active }) {
  const [particles, setParticles] = React.useState([]);
  const [runKey, setRunKey] = React.useState(0);
  React.useEffect(() => {
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

let _tapIdx = 0; // persists across re-renders; rotates through TAP_POOL

export default function KnightCompanion() {
  const { currentScreen } = useApp();

  // ── Debug: log on mount ───────────────────────────────────────────────────
  useEffect(() => {
    dbgInfo(
      `[Knight] mounted | _isNative=${_isNative}` +
      ` | hostname="${window.location.hostname}"` +
      ` | port="${window.location.port}"` +
      ` | screen="${currentScreen}"`
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [bubble, setBubble]         = useState(null); // { mood, text }
  const [showBubble, setShowBubble] = useState(false);
  const [celebBurst, setCelebBurst] = useState(false);
  // glancing: temporarily override mood for attention-getter animation
  const [glancing, setGlancing]     = useState(false);
  // introPlayed: first-time walk-in from left
  const [introPlayed, setIntroPlayed] = useState(
    () => !!localStorage.getItem('nh_companion_intro')
  );
  const timerRef      = useRef(null);
  const idleTimerRef  = useRef(null);
  const glanceTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Hide on screens where KnightSpeech in HomeTab is active
  const isHome = !currentScreen
    || currentScreen === 'dashboard'
    || currentScreen === 'welcome'
    || currentScreen === 'placement'
    || currentScreen === 'new-placement';

  // ── Screen-aware mood ─────────────────────────────────────────────────────
  const screenMood = SCREEN_MOOD_MAP[currentScreen] || null;

  // ── Streak-based mood escalation ──────────────────────────────────────────
  const streakCount = getStreak()?.count || 0;
  const streakMood = getStreakMood(streakCount);

  // Final mood priority: glancing > bubble mood > screen mood > streak mood > 'ready'
  const displayMood = glancing
    ? 'glancing'
    : bubble?.mood || screenMood || streakMood || 'ready';

  // ── Listen for knight:speak events dispatched by screens ─────────────────
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      setBubble({ mood: d.mood || 'happy', text: d.text || 'Sjajno!' });
      setShowBubble(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowBubble(false), 4000);
    };
    window.addEventListener('knight:speak', handler);
    return () => {
      window.removeEventListener('knight:speak', handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const onCelebrate = () => {
      setCelebBurst(false);
      requestAnimationFrame(() => setCelebBurst(true));
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
  }, []);

  // ── Attention-getter: after 30s of inactivity, do a curiosity glance ─────
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      // Don't interrupt an active bubble or celebration
      if (!showBubble) {
        setGlancing(true);
        clearTimeout(glanceTimerRef.current);
        // Glance animation runs once (~3.6s), then reset
        glanceTimerRef.current = setTimeout(() => setGlancing(false), 3800);
      }
    }, 30_000);
  }, [showBubble]);

  useEffect(() => {
    const events = ['mousemove', 'touchstart', 'keydown', 'scroll', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // start the timer on mount
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      clearTimeout(idleTimerRef.current);
      clearTimeout(glanceTimerRef.current);
    };
  }, [resetIdleTimer]);

  // ── First-time walk-in intro animation ───────────────────────────────────
  useEffect(() => {
    if (introPlayed || isHome) return;
    // Short delay so the component has fully mounted before animating
    const t = setTimeout(() => {
      localStorage.setItem('nh_companion_intro', '1');
      setIntroPlayed(true);
    }, 50);
    return () => clearTimeout(t);
  }, [introPlayed, isHome]);

  // ── Debug: log every render with current visibility decision ────────────
  dbgInfo(`[Knight] render | screen="${currentScreen}" isHome=${isHome} displayMood="${displayMood}" introPlayed=${introPlayed}`);

  if (isHome) return null;

  const accentColor = MOOD_COLOR[displayMood] || MOOD_COLOR.ready;

  // On Android WebView, motion.button / motion.div with animate={{ scale, opacity }}
  // applies CSS transforms that create a GPU compositing layer — the button and bubble
  // become transparent/invisible. Same root cause as CroatianKnight.jsx SVG fix.
  // Use plain HTML elements on native: no Framer Motion, no compositing layer.
  const MotionBtn = _isNative ? 'button' : motion.button;
  const btnMotionProps = _isNative ? {} : {
    initial: introPlayed ? { scale: 0.6, opacity: 0 } : { x: -80, opacity: 0, scale: 0.8 },
    animate: { x: 0, scale: 1, opacity: 1 },
    transition: introPlayed
      ? { type: 'spring', stiffness: 420, damping: 22 }
      : { type: 'spring', stiffness: 280, damping: 18, delay: 0.2 },
    whileHover: { scale: 1.13 },
    whileTap: { scale: 0.93 },
  };

  const handleTap = () => {
    const msg = TAP_POOL[_tapIdx % TAP_POOL.length];
    _tapIdx++;
    setBubble(msg);
    setShowBubble(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowBubble(false);
      setBubble(null);
    }, 3800);
  };

  return (
    <>
      {/* ── Floating speech bubble ── */}
      <AnimatePresence>
        {showBubble && bubble && (
          <motion.div
            key="companion-bubble"
            initial={_isNative ? false : { opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={_isNative ? {} : { opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 'calc(152px + env(safe-area-inset-bottom, 0px))', // above mini button (72px nav + 70px button + 10px gap)
              left: 14,
              zIndex: 9501,
              maxWidth: 230,
              cursor: 'pointer',
            }}
            onClick={() => setShowBubble(false)}
          >
            <div style={{
              position: 'relative',
              background: 'var(--card)',
              border: `1.5px solid ${accentColor}44`,
              borderRadius: 14,
              padding: '10px 13px 9px',
              boxShadow: `0 6px 24px ${accentColor}22, 0 2px 8px rgba(0,0,0,.14)`,
            }}>
              {/* Down-pointing tail toward mini button */}
              <div style={{
                position: 'absolute', bottom: -9, left: 24,
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `9px solid ${accentColor}44`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: -7, left: 25,
                width: 0, height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '8px solid var(--card)',
                pointerEvents: 'none',
              }} />

              <p style={{
                margin: 0,
                fontSize: 12.5,
                color: 'var(--subtext)',
                lineHeight: 1.58,
                fontWeight: 500,
              }}>
                {bubble.text}
              </p>
              <div style={{
                fontSize: 9, color: `${accentColor}77`,
                fontWeight: 600, marginTop: 5, textAlign: 'right',
              }}>
                tap to close
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini knight button — walk-in intro on first appearance ── */}
      <MotionBtn
        onClick={handleTap}
        aria-label="Chat with Vitez Hrvoje, your Croatian coach"
        title="Vitez Hrvoje — tap for a message"
        {...btnMotionProps}
        style={{
          position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', left: 14,
          width: 70, height: 70, borderRadius: '50%',
          background: 'var(--card)',
          border: `2.5px solid ${accentColor}55`,
          boxShadow: `0 4px 18px ${accentColor}28, 0 2px 6px rgba(0,0,0,.10)`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, zIndex: 9500,
          // Pulse ring on streak milestones to draw attention
          outline: streakMood === 'celebrating' ? `2px solid ${accentColor}` : 'none',
          outlineOffset: 3,
          transition: 'border-color .3s ease, box-shadow .3s ease',
        }}
      >
        <CroatianKnight size={52} mood={displayMood} />
        <CelebrationBurst active={celebBurst} />
      </MotionBtn>
    </>
  );
}
