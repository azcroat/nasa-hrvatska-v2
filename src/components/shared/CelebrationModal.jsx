import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { rnd } from '../../lib/random.js';

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

// ── Confetti particle generator ───────────────────────────────────────────────
const COLORS = [
  '#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#facc15',
];
const SHAPES = ['circle', 'rect', 'triangle', 'star'];

function makeParticles(n = 80) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: rnd() * 100,
    delay: rnd() * 1.4,
    duration: 2.0 + rnd() * 1.6,
    size: 5 + rnd() * 10,
    shape: SHAPES[Math.floor(rnd() * SHAPES.length)],
    rotSpeed: (rnd() > 0.5 ? 1 : -1) * (360 + rnd() * 720),
    drift: (rnd() - 0.5) * 80,
  }));
}

// ── Star sparkle generator ────────────────────────────────────────────────────
function makeStars(n = 12) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    angle: (i / n) * 360,
    dist: 80 + rnd() * 60,
    size: 8 + rnd() * 16,
    delay: rnd() * 0.4,
    color: ['#f59e0b', '#fcd34d', '#fbbf24', '#facc15'][i % 4],
  }));
}

export default function CelebrationModal({ xp, onClose }) {
  const particles = useRef(makeParticles(80)).current;
  const stars = useRef(makeStars(12)).current;
  const [displayXP, setDisplayXP] = useState(0);
  const [phase, setPhase] = useState('burst'); // burst → reveal → done

  useEffect(() => {
    playSuccessSound();

    // canvas-confetti burst — performant canvas-based particles
    const end = Date.now() + 1800;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#0e7490','#f59e0b','#e11d48','#10b981'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6','#8b5cf6','#f97316','#facc15'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    // Count up XP
    const target = xp || 0;
    const dur = 800;
    const step = 16;
    const steps = dur / step;
    let current = 0;
    const iv = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        setDisplayXP(target);
        clearInterval(iv);
      } else {
        setDisplayXP(Math.round(current));
      }
    }, step);

    // Phases
    const t1 = setTimeout(() => setPhase('reveal'), 200);
    const t2 = setTimeout(onClose, 4000);

    return () => {
      clearInterval(iv);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onClose, xp]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lesson complete — Odlično!"
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
      {/* ── Confetti layer ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left + '%',
              top: -20,
              width: p.size,
              height:
                p.shape === 'circle'
                  ? p.size
                  : p.shape === 'rect'
                  ? p.size * 0.55
                  : p.size,
              borderRadius:
                p.shape === 'circle'
                  ? '50%'
                  : p.shape === 'rect'
                  ? 2
                  : 0,
              background: p.color,
              clipPath:
                p.shape === 'triangle'
                  ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                  : p.shape === 'star'
                  ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
                  : undefined,
              animation: `confettiDrop ${p.duration}s ${p.delay}s cubic-bezier(.3,1,.7,1) forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

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
          background:
            'linear-gradient(145deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%)',
          borderRadius: 28,
          padding: '40px 44px 36px',
          textAlign: 'center',
          boxShadow:
            '0 32px 80px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.8) inset, 0 4px 0 rgba(14,116,144,.15)',
          animation:
            'celebPop .5s cubic-bezier(.34,1.56,.64,1) forwards',
          minWidth: 280,
          maxWidth: 340,
          border: '2px solid rgba(14,116,144,.12)',
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
            background: 'linear-gradient(135deg,#0e7490,#06b6d4)',
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
            fontSize: 14,
            color: '#64748b',
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
              '0 4px 16px rgba(245,158,11,.25), 0 1px 0 rgba(255,255,255,.6) inset',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>⭐</span>
          <span
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#92400e',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 70,
              textAlign: 'center',
            }}
          >
            +{displayXP} XP
          </span>
        </div>

        {/* Streak reminder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 13,
            color: '#64748b',
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
            fontSize: 11,
            color: '#94a3b8',
            marginTop: 14,
            fontWeight: 500,
          }}
        >
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
}
