import React, { useEffect, useRef, useState, memo } from 'react';
import confetti from 'canvas-confetti';
import { rnd } from '../../lib/random.js';
import { useHaptic } from '../../hooks/useHaptic';

// ── CEFR mapping ──────────────────────────────────────────────────────────────
// lvl() returns 1-10; map to CEFR bands + Croatian level name
const LEVEL_META = {
  1: {
    cefr: 'A1',
    band: 'Beginner',
    hrName: 'Početnik',
    color: 'linear-gradient(135deg,#16a34a,#15803d)',
    emoji: '🌱',
    tip: 'You know your first Croatian words. The journey starts here!',
  },
  2: {
    cefr: 'A1',
    band: 'Elementary',
    hrName: 'Osnovno A1',
    color: 'linear-gradient(135deg,#0e7490,#164e63)',
    emoji: '🌿',
    tip: 'Solid A1 foundations. Everyday greetings and numbers — dobro!',
  },
  3: {
    cefr: 'A2',
    band: 'Pre-Intermediate',
    hrName: 'Osnovno A2',
    color: 'linear-gradient(135deg,#2563eb,#1e3a8a)',
    emoji: '💬',
    tip: 'A2 unlocked! You can now introduce yourself and talk about daily life.',
  },
  4: {
    cefr: 'A2',
    band: 'Elementary+',
    hrName: 'Napredni A2',
    color: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    emoji: '⚡',
    tip: 'Strong A2! Short conversations in Croatian are within your reach.',
  },
  5: {
    cefr: 'B1',
    band: 'Intermediate',
    hrName: 'Srednji B1',
    color: 'linear-gradient(135deg,#d97706,#b45309)',
    emoji: '🔥',
    tip: 'B1 — the tipping point! You can now hold real conversations in Croatian.',
  },
  6: {
    cefr: 'B1',
    band: 'Intermediate+',
    hrName: 'Napredni B1',
    color: 'linear-gradient(135deg,#dc2626,#991b1b)',
    emoji: '🏅',
    tip: 'Upper B1! Reading Croatian news and watching TV are becoming possible.',
  },
  7: {
    cefr: 'B2',
    band: 'Upper-Intermediate',
    hrName: 'Srednji B2',
    color: 'linear-gradient(135deg,#b61800,#7f1d1d)',
    emoji: '🦅',
    tip: 'B2 achieved — you understand most of what you hear and read in Croatian!',
  },
  8: {
    cefr: 'B2',
    band: 'Advanced B2',
    hrName: 'Napredni B2',
    color: 'linear-gradient(135deg,#92400e,#78350f)',
    emoji: '🏆',
    tip: 'Near-fluency. Croatian speakers notice your confidence — impressive!',
  },
  9: {
    cefr: 'C1',
    band: 'Advanced',
    hrName: 'Napredni C1',
    color: 'linear-gradient(135deg,#1e40af,#1e3a8a)',
    emoji: '👑',
    tip: 'C1 — you speak Croatian with nuance and precision. Bravo!',
  },
  10: {
    cefr: 'C1',
    band: 'Mastery',
    hrName: 'Majstor',
    color: 'linear-gradient(135deg,#b61800,#003087)',
    emoji: '🇭🇷',
    tip: 'Mastery! You have learned Croatian. Naša Hrvatska — our Croatia.',
  },
};

const CROATIAN_COLORS = ['#b61800', '#ffffff', '#003087', '#f59e0b', '#16a34a'];

// ── Fanfare sound — ascending triumphant chord ────────────────────────────────
function playLevelUpSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Three-wave chord: root + fifth + octave, staggered for drama
    const waves = [
      { freq: 261.63, t: 0, dur: 0.8 }, // C4
      { freq: 392.0, t: 0.08, dur: 0.8 }, // G4
      { freq: 523.25, t: 0.16, dur: 0.9 }, // C5
      { freq: 783.99, t: 0.28, dur: 0.7 }, // G5
      { freq: 1046.5, t: 0.44, dur: 0.6 }, // C6 — final peak
    ];
    waves.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur + 0.05);
    });
    // Close context after all waves finish to prevent AudioContext leak
    const lastWave = waves[waves.length - 1];
    const lastEnd = lastWave ? lastWave.t + lastWave.dur + 0.1 : 1;
    setTimeout(() => ctx.close().catch(() => {}), lastEnd * 1000);
  } catch (_) {}
}

// ── Orbit particles ───────────────────────────────────────────────────────────
function makeOrbitParticles(n = 16) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    angle: (i / n) * 360,
    dist: 100 + rnd() * 50,
    size: 10 + rnd() * 14,
    delay: rnd() * 0.5,
    emoji: ['⭐', '✨', '🌟', '💫'][Math.floor(rnd() * 4)],
  }));
}

function LevelUpModal({ level, onClose }: { level: number; onClose?: () => void }) {
  const meta =
    (LEVEL_META as Record<number, (typeof LEVEL_META)[keyof typeof LEVEL_META] | undefined>)[
      level
    ] || LEVEL_META[10];
  const particles = useRef(makeOrbitParticles(16)).current;
  const [_phase, setPhase] = useState('burst'); // burst → reveal
  const [copied, setCopied] = useState(false);
  const haptic = useHaptic();
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    modal.addEventListener('keydown', handleKeyDown);
    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shareText = `🇭🇷 Just reached Level ${level} (${meta.cefr} — ${meta.band}) in Croatian! ${meta.emoji} Learning with Naša Hrvatska — Croatian for the diaspora. https://nasahrvatska.com?ref=level`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Naša Hrvatska',
          text: shareText,
          url: 'https://nasahrvatska.com?ref=level',
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareText).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  useEffect(() => {
    playLevelUpSound();
    haptic.award();

    // Heavy confetti burst — more dramatic than lesson complete
    const end = Date.now() + 3000;
    const burst = () => {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors: CROATIAN_COLORS,
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors: CROATIAN_COLORS,
      });
      confetti({
        particleCount: 6,
        angle: 90,
        spread: 50,
        origin: { x: 0.5, y: 0.3 },
        colors: CROATIAN_COLORS,
      });
      if (Date.now() < end) requestAnimationFrame(burst);
    };
    requestAnimationFrame(burst);

    const t1 = setTimeout(() => setPhase('reveal'), 150);
    // Auto-close after 6 s so it never traps the user
    const t2 = setTimeout(() => onClose?.(), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      onClick={() => onClose?.()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center, rgba(182,24,0,0.22) 0%, rgba(0,0,0,0.72) 100%)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* ── Orbit particle ring ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `rotate(${p.angle}deg) translateX(${p.dist}px) rotate(-${p.angle}deg)`,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              width: p.size,
              height: p.size,
              fontSize: p.size,
              lineHeight: 1,
              animation: `starBurst 1s ${p.delay}s cubic-bezier(.4,0,.2,1) forwards`,
              opacity: 0,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* ── Main card ───────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--card)',
          borderRadius: 32,
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow:
            '0 48px 100px rgba(0,0,0,.5), 0 20px 50px rgba(182,24,0,.25), 0 0 0 1px var(--card-b) inset',
          animation: 'celebPop .55s cubic-bezier(.34,1.56,.64,1) forwards',
          minWidth: 290,
          maxWidth: 360,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,.25)',
            border: 'none',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 8,
            zIndex: 2,
          }}
        >
          ×
        </button>

        {/* ── Coloured header band ──────────────────────────────────────── */}
        <div style={{ background: meta.color, padding: '36px 28px 28px' }}>
          {/* Big level emoji */}
          <div
            style={{
              fontSize: 72,
              lineHeight: 1,
              marginBottom: 8,
              animation: 'float 2s ease-in-out infinite',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.4))',
            }}
          >
            {meta.emoji}
          </div>

          {/* "LEVEL UP" label */}
          <div
            id="levelup-title"
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.75)',
              marginBottom: 6,
            }}
          >
            Level Up!
          </div>

          {/* Level number */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              marginBottom: 4,
              fontFamily: "'Outfit', sans-serif",
              textShadow: '0 4px 16px rgba(0,0,0,.35)',
              animation: 'heartbeat .6s ease .3s 1',
            }}
          >
            {level}
          </div>

          {/* Croatian level name */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'rgba(255,255,255,.9)',
              marginBottom: 12,
            }}
          >
            {meta.hrName}
          </div>

          {/* CEFR badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,.22)',
              borderRadius: 20,
              padding: '6px 18px',
              border: '1.5px solid rgba(255,255,255,.35)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '.06em' }}>
              CEFR
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '.04em',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {meta.cefr}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>
              {meta.band}
            </span>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Motivational tip */}
          <div
            style={{
              fontSize: 15,
              color: 'var(--heading)',
              lineHeight: 1.55,
              marginBottom: 20,
              fontWeight: 500,
            }}
          >
            {meta.tip}
          </div>

          {/* CEFR progress bar — shows where this level sits on A1→C1 scale */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--subtext)',
                marginBottom: 6,
                letterSpacing: '.06em',
              }}
            >
              {['A1', 'A2', 'B1', 'B2', 'C1'].map((band) => (
                <span
                  key={band}
                  style={{
                    color: meta.cefr === band ? 'var(--info)' : 'var(--subtext)',
                    fontWeight: meta.cefr === band ? 900 : 600,
                  }}
                >
                  {band}
                </span>
              ))}
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--bar-bg)',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid var(--card-b)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((level - 1) / 9) * 100}%`,
                  background: meta.color,
                  borderRadius: 6,
                  transition: 'width 1s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <div
              style={{
                textAlign: 'right',
                fontSize: 11,
                color: 'var(--subtext)',
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Level {level} of 10
            </div>
          </div>

          {/* CTA button */}
          <button
            className="b bp"
            onClick={onClose}
            style={{ width: '100%', fontSize: 15, padding: '14px', marginBottom: 10 }}
          >
            Nastavi učiti →
          </button>

          {/* Share achievement */}
          <button
            onClick={handleShare}
            className="b"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 13,
              fontWeight: 800,
              background: 'linear-gradient(135deg,#0e7490,#164e63)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied!' : '📤 Share your level up'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(LevelUpModal);
