/**
 * KnightCompanion — global in-exercise coaching companion for non-home screens.
 *
 * Despite the legacy filename, it renders prof. Kovač (host-family tutor), not
 * the retired knight. Mounted once in App.tsx. On home it returns null (the home
 * greeter owns that screen). Elsewhere it shows a fixed bottom-left mini portrait
 * and listens for the coaching events:
 *   - knight:speak  → speech bubble (mood drives ring colour + glyph)
 *   - knight:flash  → silent ring colour + corner glyph for durationMs
 *   - knight:quest-done → a proud bubble
 *   - knight:celebrate  → particle burst
 * The static portrait can't emote, so state is shown via ring + glyph + bubble
 * (see coachVisual). The internal knight:* event names are intentionally kept —
 * the ~20 dispatchers are unchanged.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterPortrait from '../family/CharacterPortrait';
import { useApp } from '../../context/AppContext';
import { dbgInfo } from '../../lib/debugLog';
import { knightSpeak } from '../../lib/knightSpeak';
import { coachVisual } from './coachVisual';

// On Android WebView (Capacitor), Framer Motion entry animations with opacity:0
// can stall permanently. Skip entry animation on native.
const _isNative =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  !window.location.port;

// Messages shown when the user taps the companion — prof. Kovač's tutor voice.
const TAP_POOL: { mood: string; text: string }[] = [
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. Solid progress. 💪' },
  { mood: 'happy', text: 'Svaki dan po malo — a little every day. Fluency is an accumulation. 🔥' },
  {
    mood: 'thinking',
    text: 'Croatian is perfectly phonetic — every letter, one sound, always. 📐',
  },
  {
    mood: 'proud',
    text: '„Koliko jezika znaš, toliko vrijediš." The more languages you know, the more you are worth. 🇭🇷',
  },
  {
    mood: 'encouraged',
    text: 'Greške su dio učenja — mistakes are part of learning. Keep going. ✍️',
  },
];

// ─── Celebration particle burst ───────────────────────────────────────────────
const PARTY_COLORS = ['#CC0022', '#F4F0E2', '#D4A400', '#EE3042', '#FFDC3C'];
interface Particle {
  id: number;
  angle: number;
  dist: number;
  color: string;
  size: number;
}
function CelebrationBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    setRunKey((k) => k + 1);
    setParticles(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        angle: (i / 10) * 360 + (i * 7 - 12),
        dist: 34 + (i % 4) * 6,
        color: PARTY_COLORS[i % PARTY_COLORS.length] ?? '#CC0022',
        size: 5 + (i % 3) * 2,
      })),
    );
  }, [active]);
  if (!particles.length) return null;
  return (
    <div
      style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 5 }}
    >
      {particles.map((p) => (
        <motion.div
          key={`${runKey}-${p.id}`}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
            y: Math.sin((p.angle * Math.PI) / 180) * p.dist - 8,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: p.id * 0.04 }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

let _tapIdx = 0; // rotates through TAP_POOL across renders

export default function KnightCompanion() {
  const { currentScreen } = useApp();

  const [flashMood, setFlashMood] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bubble, setBubble] = useState<{ mood: string; text: string } | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [celebBurst, setCelebBurst] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHome =
    !currentScreen ||
    currentScreen === 'dashboard' ||
    currentScreen === 'welcome' ||
    currentScreen === 'placement' ||
    currentScreen === 'new-placement';

  // knight:speak → bubble (text + mood)
  useEffect(() => {
    const handler = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { mood?: string; text?: string };
      setBubble({ mood: d.mood || 'happy', text: d.text || 'Sjajno!' });
      setShowBubble(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowBubble(false), 4000);
    };
    window.addEventListener('knight:speak', handler);
    return () => {
      window.removeEventListener('knight:speak', handler);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // knight:flash → silent ring + glyph for durationMs
  useEffect(() => {
    const handle = (e: Event) => {
      const { mood, durationMs } = (e as CustomEvent).detail as {
        mood: string;
        durationMs: number;
      };
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashMood(mood);
      flashTimerRef.current = setTimeout(() => setFlashMood(null), durationMs);
    };
    window.addEventListener('knight:flash', handle);
    return () => {
      window.removeEventListener('knight:flash', handle);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // knight:quest-done → proud bubble
  useEffect(() => {
    const handle = () => knightSpeak('proud', 'Ponosan sam na tebe! 🏅');
    window.addEventListener('knight:quest-done', handle);
    return () => window.removeEventListener('knight:quest-done', handle);
  }, []);

  // knight:celebrate → particle burst
  useEffect(() => {
    const onCelebrate = () => {
      setCelebBurst(false);
      requestAnimationFrame(() => setCelebBurst(true));
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
  }, []);

  dbgInfo(`[Coach] render | screen="${currentScreen}" isHome=${isHome} flash="${flashMood}"`);

  if (isHome) return null;

  // Priority: flash (silent feedback) > active bubble mood > idle.
  const displayMood = flashMood ?? bubble?.mood ?? 'ready';
  const cv = coachVisual(displayMood);
  const glyphVisible = flashMood !== null || (showBubble && bubble !== null);
  const glyph = glyphVisible ? cv.glyph : null;

  const handleTap = () => {
    const msg = TAP_POOL[_tapIdx % TAP_POOL.length] ?? TAP_POOL[0]!;
    _tapIdx++;
    setBubble(msg);
    setShowBubble(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowBubble(false);
      setBubble(null);
    }, 3800);
  };

  const ringBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    left: 14,
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: cv.ring,
    padding: 4,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9500,
    boxShadow: '0 4px 18px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.10)',
    transition: 'background .3s ease',
  };
  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#fbf6ec',
    border: '2px solid rgba(255,255,255,.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const glyphStyle: React.CSSProperties = {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 900,
    color: '#fff',
    border: '2.5px solid #fff',
    boxShadow: '0 2px 6px rgba(0,0,0,.25)',
    background:
      cv.klass === 'negative'
        ? '#dc2626'
        : cv.klass === 'thinking'
          ? '#7c3aed'
          : glyph === '★'
            ? '#C8980A'
            : '#16a34a',
  };

  const buttonInner = (
    <>
      <span style={innerStyle}>
        <CharacterPortrait name="kovac" title="prof. Kovač" size={58} />
      </span>
      {glyph && (
        <span data-testid="coach-glyph" style={glyphStyle}>
          {glyph}
        </span>
      )}
      <CelebrationBurst active={celebBurst} />
    </>
  );

  return (
    <div data-testid="coach-companion">
      {/* speech bubble */}
      <AnimatePresence>
        {showBubble && bubble && !flashMood && (
          <motion.div
            key="coach-bubble"
            initial={_isNative ? false : { opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={_isNative ? {} : { opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 'calc(152px + env(safe-area-inset-bottom, 0px))',
              left: 14,
              zIndex: 9501,
              maxWidth: 230,
              cursor: 'pointer',
            }}
            onClick={() => setShowBubble(false)}
          >
            <div
              style={{
                position: 'relative',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                padding: '10px 13px 9px',
                boxShadow: '0 6px 24px rgba(0,0,0,.16)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#7c3aed',
                  marginBottom: 4,
                }}
              >
                prof. Kovač
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  color: 'var(--subtext)',
                  lineHeight: 1.58,
                  fontWeight: 500,
                }}
              >
                {bubble.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mini portrait button */}
      {_isNative ? (
        <button
          onClick={handleTap}
          aria-label="prof. Kovač, your Croatian coach"
          title="prof. Kovač — tap for a tip"
          style={ringBtnStyle}
        >
          {buttonInner}
        </button>
      ) : (
        <motion.button
          onClick={handleTap}
          aria-label="prof. Kovač, your Croatian coach"
          title="prof. Kovač — tap for a tip"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          style={ringBtnStyle}
        >
          {buttonInner}
        </motion.button>
      )}
    </div>
  );
}
