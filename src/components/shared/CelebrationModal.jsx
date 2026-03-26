import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { rnd } from '../../lib/random.js';

const CROATIAN_COLORS = ['#b61800', '#ffffff', '#003087', '#f59e0b', '#16a34a'];

// ── Sound synthesis ──────────────────────────────────────────────────────────
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.45);
    });
  } catch (e) {}
}

// ── Star sparkle generator ────────────────────────────────────────────────────
function makeStars(n = 12) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    angle: (i / n) * 360,
    dist: 80 + rnd() * 60,
    size: 8 + rnd() * 16,
    delay: rnd() * 0.4,
  }));
}

export default function CelebrationModal({ xp, onClose, streak = 0 }) {
  // DOM particle layer removed — canvas-confetti handles all particles (better perf)
  const stars = useRef(makeStars(12)).current;
  const [displayXP, setDisplayXP] = useState(0);
  const [phase, setPhase] = useState('burst'); // burst → reveal → done
  const [showMomentum, setShowMomentum] = useState(false);

  useEffect(() => {
    playSuccessSound();

    // canvas-confetti burst — performant canvas-based particles
    const end = Date.now() + 1800;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: CROATIAN_COLORS });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: CROATIAN_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    // Count up XP with eased requestAnimationFrame
    const target = xp || 0;
    const duration = 800;
    const start = Date.now();
    let rafId;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(eased * target));
      if (progress < 1) { rafId = requestAnimationFrame(tick); }
    };
    rafId = requestAnimationFrame(tick);

    // Phases
    const t1 = setTimeout(() => setPhase('reveal'), 200);
    const t2 = setTimeout(() => {
      setShowMomentum(true);
      onClose();
    }, 4000);
    const t3 = setTimeout(() => setShowMomentum(false), 7000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onClose, xp]);

  return (
    <>
    {showMomentum && (
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998,
          background: 'var(--brand)',
          color: '#fff',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-md) var(--space-2xl)',
          fontSize: 'var(--text-md)',
          fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,.35)',
          animation: 'slideUp .4s cubic-bezier(.34,1.56,.64,1) forwards',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {streak > 0
          ? `🔥 ${streak}-day streak — keep going!`
          : "You're on a roll! Keep it up!"}
      </div>
    )}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lesson complete — Odlično!"
      className="anim-bounce-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center, rgba(14,116,144,0.18) 0%, rgba(0,0,0,0.55) 100%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* ── Star burst ring ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
      >
        {stars.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `rotate(${s.angle}deg) translateX(${s.dist}px) rotate(-${s.angle}deg)`,
              marginLeft: -s.size / 2,
              marginTop: -s.size / 2,
              width: s.size,
              height: s.size,
              fontSize: s.size,
              lineHeight: 1,
              animation: `starBurst .8s ${s.delay}s cubic-bezier(.4,0,.2,1) forwards`,
              opacity: 0,
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* ── Main card ─────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--card)',
          borderRadius: 28,
          padding: '40px 44px 36px',
          textAlign: 'center',
          boxShadow:
            '0 40px 90px rgba(0,0,0,.35), 0 16px 40px rgba(14,116,144,.2), 0 0 0 1px var(--card-b) inset, 0 4px 0 rgba(14,116,144,.2)',
          animation:
            'celebPop .5s cubic-bezier(.34,1.56,.64,1) forwards',
          minWidth: 280,
          maxWidth: 340,
          border: '2px solid var(--info-b)',
        }}
      >
        {/* Trophy */}
        <div
          style={{
            fontSize: 72,
            lineHeight: 1,
            marginBottom: 4,
            animation: 'float 2s ease-in-out infinite',
            display: 'block',
            filter: 'drop-shadow(0 8px 16px rgba(245,158,11,.3))',
          }}
        >
          🏆
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            background: 'linear-gradient(135deg,var(--info),#06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 4,
            letterSpacing: '-.01em',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Odlično!
        </div>

        <div
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--subtext)',
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          Lesson complete — keep it up! 🔥
        </div>

        {/* XP counter */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '2px solid #f59e0b',
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow:
              '0 8px 28px rgba(245,158,11,.4), 0 2px 0 rgba(255,255,255,.7) inset',
          animation: 'heartbeat .6s ease .4s 1',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>⭐</span>
          <span
            className="anim-count-up-pop"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#92400e',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 70,
              textAlign: 'center',
            }}
          >
            {displayXP > 0 ? `+${displayXP}` : '+0'} XP
          </span>
        </div>

        {/* Streak reminder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 'var(--text-sm)',
            color: 'var(--subtext)',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontSize: 18,
              animation: 'flameDance 1.2s ease-in-out infinite',
              display: 'inline-block',
            }}
          >
            🔥
          </span>
          Keep your streak alive!
        </div>

        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--subtext)',
            marginTop: 14,
            fontWeight: 500,
            opacity: .7,
          }}
        >
          Tap anywhere to continue
        </div>
      </div>
    </div>
    </>
  );
}
