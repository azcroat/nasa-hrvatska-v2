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
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from './CroatianKnight';
import { useApp } from '../../context/AppContext.jsx';

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
  const [bubble, setBubble]       = useState(null); // { mood, text }
  const [showBubble, setShowBubble] = useState(false);
  const [celebBurst, setCelebBurst] = useState(false);
  const timerRef = useRef(null);

  // Hide on screens where KnightSpeech in HomeTab is active
  const isHome = !currentScreen
    || currentScreen === 'dashboard'
    || currentScreen === 'welcome'
    || currentScreen === 'placement'
    || currentScreen === 'new-placement';

  // Listen for knight:speak events dispatched by screens
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

  if (isHome) return null;

  const accentColor = bubble ? (MOOD_COLOR[bubble.mood] || MOOD_COLOR.happy) : MOOD_COLOR.happy;

  const handleTap = () => {
    const msg = TAP_POOL[_tapIdx % TAP_POOL.length];
    _tapIdx++;
    setBubble(msg);
    setShowBubble(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowBubble(false), 3800);
  };

  return (
    <>
      {/* ── Floating speech bubble ── */}
      <AnimatePresence>
        {showBubble && bubble && (
          <motion.div
            key="companion-bubble"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 150,   // above mini button (80px tab bar + 60px button + 10px gap)
              left: 14,
              zIndex: 101,
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

      {/* ── Mini knight button ── */}
      <button
        onClick={handleTap}
        aria-label="Chat with Vitez Hrvoje, your Croatian coach"
        title="Vitez Hrvoje — tap for a message"
        style={{
          position: 'fixed', bottom: 80, left: 16,
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--card)',
          border: `2.5px solid ${accentColor}55`,
          boxShadow: `0 4px 18px ${accentColor}28, 0 2px 6px rgba(0,0,0,.10)`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, zIndex: 100,
          animation: 'spring-in .35s cubic-bezier(0.34,1.56,0.64,1) both',
          transition: 'transform .15s ease, box-shadow .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <CroatianKnight size={42} mood={bubble?.mood || 'ready'} variant={0} />
        <CelebrationBurst active={celebBurst} />
      </button>
    </>
  );
}
