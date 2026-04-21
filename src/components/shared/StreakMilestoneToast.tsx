import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// On Android WebView (Capacitor), Framer Motion entry animations with opacity:0
// can stall permanently. Skip entry animation on native.
const _isNative =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  !window.location.port;
import confetti from 'canvas-confetti';
import { playStreak, playFanfare, playLevelUp } from '../../lib/soundSettings.js';

// Streak milestones that deserve a special celebration
const MILESTONES = [
  {
    days: 3,
    icon: '🔥',
    title: '3-Day Streak!',
    subtitle: "You're building a habit. Keep going!",
    color: '#f97316',
    confettiColors: ['#f97316', '#fb923c', '#fdba74'],
  },
  {
    days: 7,
    icon: '⚡',
    title: 'Week Warrior!',
    subtitle: '7 days straight. Your brain is rewiring.',
    color: '#eab308',
    confettiColors: ['#eab308', '#facc15', '#fde047'],
  },
  {
    days: 14,
    icon: '🌟',
    title: 'Two Weeks!',
    subtitle: 'Dva tjedna — Croatian is settling in.',
    color: '#22c55e',
    confettiColors: ['#22c55e', '#4ade80', '#86efac'],
  },
  {
    days: 30,
    icon: '🏆',
    title: 'Trideset Dana!',
    subtitle: "30 days. You're no longer a beginner.",
    color: '#6366f1',
    confettiColors: ['#6366f1', '#818cf8', '#a5b4fc', '#D40030', '#ffffff'],
  },
  {
    days: 50,
    icon: '💎',
    title: 'Fifty Days!',
    subtitle: 'The Adriatic has been waiting for you.',
    color: '#0e7490',
    confettiColors: ['#0e7490', '#38bdf8', '#7dd3fc', '#D40030'],
  },
  {
    days: 100,
    icon: '👑',
    title: 'Sto Dana!',
    subtitle: '100 days. Svaka čast, majstore!',
    color: '#D40030',
    confettiColors: ['#D40030', '#ffffff', '#0e7490', '#f59e0b', '#ffffff'],
  },
  {
    days: 365,
    icon: '🇭🇷',
    title: 'Godišnjica!',
    subtitle: 'One year. You ARE Croatian now.',
    color: '#D40030',
    confettiColors: ['#D40030', '#ffffff', '#1e3a8a', '#f59e0b'],
  },
];

function getMilestone(streak: number) {
  // Find the highest milestone that exactly matches — only fire once per level
  return MILESTONES.find((m) => m.days === streak) || null;
}

function getStorageKey(days: number) {
  return `nh_streak_milestone_${days}`;
}

export function checkAndMarkMilestone(streakCount: number) {
  const m = getMilestone(streakCount);
  if (!m) return false;
  const key = getStorageKey(m.days);
  if (localStorage.getItem(key)) return false; // already shown
  localStorage.setItem(key, '1');
  return true;
}

export default function StreakMilestoneToast({
  streakCount,
  onDismiss,
}: {
  streakCount: number;
  onDismiss?: () => void;
}) {
  const m = getMilestone(streakCount);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!m || firedRef.current) return;
    firedRef.current = true;

    // Sound — bigger milestones get the level-up fanfare
    if (m.days >= 30) {
      playLevelUp();
    } else if (m.days >= 7) {
      playFanfare();
    } else {
      playStreak();
    }

    // Confetti burst — scale with milestone importance
    const count = m.days >= 100 ? 180 : m.days >= 30 ? 120 : m.days >= 7 ? 80 : 50;
    confetti({
      particleCount: count,
      spread: 70,
      origin: { y: 0.35 },
      colors: m.confettiColors,
      ticks: 280,
    });
    if (m.days >= 30) {
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.5 },
            colors: m.confettiColors,
          }),
        250,
      );
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.5 },
            colors: m.confettiColors,
          }),
        400,
      );
    }
  }, [m]);

  if (!m) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="streak-milestone"
        initial={_isNative ? false : { opacity: 0, scale: 0.85, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={_isNative ? undefined : { opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal, 9000)',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          padding: '0 24px',
        }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.75 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.05 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card, #ffffff)',
            borderRadius: 28,
            padding: '36px 32px 28px',
            maxWidth: 340,
            width: '100%',
            textAlign: 'center',
            boxShadow: `0 24px 80px rgba(0,0,0,0.3), 0 0 0 2px ${m.color}40`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top color accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${m.color}, ${m.color}aa)`,
            }}
          />

          {/* Icon with pulse ring */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${m.color}55 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{ fontSize: 64, lineHeight: 1 }}>{m.icon}</div>
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Playfair Display', serif",
              color: 'var(--heading, #0f172a)',
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            {m.title}
          </div>

          {/* Streak count badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: `linear-gradient(135deg, ${m.color}22, ${m.color}11)`,
              border: `1.5px solid ${m.color}55`,
              borderRadius: 20,
              padding: '4px 16px',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{streakCount}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext, #555e6e)' }}>
              day streak
            </span>
          </div>

          <p
            style={{
              fontSize: 15,
              color: 'var(--subtext, #555e6e)',
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            {m.subtitle}
          </p>

          <button
            onClick={onDismiss}
            style={{
              width: '100%',
              height: 48,
              background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.02em',
              boxShadow: `0 4px 16px ${m.color}55`,
            }}
          >
            Hajde! Keep going →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
