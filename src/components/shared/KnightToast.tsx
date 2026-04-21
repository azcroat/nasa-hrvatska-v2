/**
 * KnightToast — listens for the `knight:celebrate` custom event fired by
 * useAward whenever significant XP is earned, then shows a spring-animated
 * celebration toast with particle burst, glow ring, and staggered children.
 *
 * Uses Framer Motion AnimatePresence for a proper spring entrance and
 * a graceful exit — no hard-cut CSS transitions.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import CroatianKnight from './CroatianKnight';

// 8 confetti particles that burst outward on entrance
const PARTICLES = [
  { dx: -52, dy: -28, color: '#dc2626', size: 8, rot: 35 },
  { dx: 52, dy: -28, color: '#d97706', size: 7, rot: -40 },
  { dx: -38, dy: -52, color: '#7c3aed', size: 6, rot: 60 },
  { dx: 38, dy: -52, color: '#16a34a', size: 9, rot: -25 },
  { dx: -60, dy: 8, color: '#0ea5e9', size: 6, rot: 80 },
  { dx: 60, dy: 8, color: '#dc2626', size: 7, rot: -70 },
  { dx: -28, dy: -64, color: '#d97706', size: 5, rot: 45 },
  { dx: 28, dy: -64, color: '#a78bfa', size: 8, rot: -55 },
];

// Framer Motion variants
const toastVariants: Variants = {
  hidden: { opacity: 0, y: 56, scale: 0.82 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 20, mass: 0.85 },
  },
  exit: {
    opacity: 0,
    y: 32,
    scale: 0.9,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

const containerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

interface ParticleData {
  dx: number;
  dy: number;
  color: string;
  size: number;
  rot: number;
}
const particleVariants: Variants = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
  visible: (p: ParticleData) => ({
    opacity: [1, 1, 0],
    x: p.dx,
    y: p.dy,
    scale: [1, 1.3, 0.6],
    rotate: p.rot,
    transition: { duration: 0.7, ease: [0.2, 0.8, 0.4, 1], times: [0, 0.45, 1], delay: 0.05 },
  }),
};

export default function KnightToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState('celebrating');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((detail: { text?: string; mood?: string } | null | undefined) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setMessage(detail?.text || 'Sjajno!');
    setMood(detail?.mood || 'celebrating');
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      show((e as CustomEvent).detail);
    }
    window.addEventListener('knight:celebrate', handler);
    return () => {
      window.removeEventListener('knight:celebrate', handler);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          onClick={() => setVisible(false)}
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            bottom: 88,
            left: '50%',
            x: '-50%', // Framer Motion handles the centering offset
            zIndex: 9800,
            cursor: 'pointer',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          {/* Glow ring — pulses behind the whole card */}
          <motion.div
            aria-hidden="true"
            animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.2, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: 30,
              background:
                'radial-gradient(ellipse at center, rgba(14,116,144,0.45) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Particle burst — positioned relative to knight side */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: 28, top: 24, pointerEvents: 'none', zIndex: 2 }}
          >
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                custom={p}
                variants={particleVariants}
                initial="hidden"
                animate="visible"
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size * 0.55,
                  borderRadius: 2,
                  background: p.color,
                  top: 0,
                  left: 0,
                }}
              />
            ))}
          </div>

          {/* Card */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'linear-gradient(135deg, #0c4a6e, #0e7490)',
              border: '1.5px solid rgba(255,255,255,.18)',
              borderRadius: 22,
              padding: '12px 20px 12px 14px',
              boxShadow: '0 16px 48px rgba(0,0,0,.4), 0 2px 8px rgba(14,116,144,.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
          >
            {/* Inner shimmer stripe */}
            <motion.div
              aria-hidden="true"
              animate={{ x: ['-120%', '220%'] }}
              transition={{ duration: 1.1, delay: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '45%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Knight — enters first, before text */}
            <motion.div
              variants={childVariants}
              style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}
            >
              <CroatianKnight size={54} mood={mood} />
            </motion.div>

            {/* Text */}
            <motion.div variants={childVariants} style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: 'white',
                  fontFamily: "'Outfit', sans-serif",
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {message}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,.55)',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                Tap to dismiss
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
