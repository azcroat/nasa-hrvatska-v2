import React, { useEffect, useRef, useState, memo } from 'react';
import confetti from 'canvas-confetti';
import { rnd } from '../../lib/random.js';
import { useHaptic } from '../../hooks/useHaptic.js';
import CroatianKnight from './CroatianKnight.jsx';

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

function CelebrationModal({ xp, onClose, streak = 0, onNext = null, lessonTopic = '' }) {
  // DOM particle layer removed — canvas-confetti handles all particles (better perf)
  const stars = useRef(makeStars(12)).current;
  const [displayXP, setDisplayXP] = useState(0);
  const [phase, setPhase] = useState('burst'); // burst → reveal → done
  const [showMomentum, setShowMomentum] = useState(false);
  const [difficulty, setDifficulty] = useState(null); // 'easy' | 'right' | 'hard'
  const haptic = useHaptic();
  const modalRef = useRef(null);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    modal.addEventListener('keydown', handleKeyDown);
    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      else { haptic.award(); }
    };
    rafId = requestAnimationFrame(tick);

    // Phases
    const t1 = setTimeout(() => setPhase('reveal'), 200);
    // Extend auto-close to 7s to give time for difficulty rating interaction
    const t2 = setTimeout(() => {
      setShowMomentum(true);
      onClose();
    }, 7000);
    const t3 = setTimeout(() => setShowMomentum(false), 10000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onClose, xp]);

  function rateDifficulty(rating) {
    setDifficulty(rating);
    // Save per-topic difficulty feedback
    try {
      const key = 'nh_difficulty';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      if (lessonTopic) existing[lessonTopic] = rating;
      existing._last = { topic: lessonTopic, rating, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}
  }

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
      aria-labelledby="celebration-title"
      className="anim-bounce-in"
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
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
        ref={modalRef}
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
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
            color: 'var(--subtext)',
            padding: 4,
          }}
        >
          ×
        </button>

        {/* LEGO Knight mascot — celebrating mood */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
          <CroatianKnight size={88} mood="celebrating" />
        </div>

        {/* Title */}
        <div
          id="celebration-title"
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

        {/* Difficulty rating */}
        <div style={{ marginTop: 18, marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            How was this lesson?
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[
              { key: 'easy', label: 'Too Easy', emoji: '😴' },
              { key: 'right', label: 'Just Right', emoji: '✅' },
              { key: 'hard', label: 'Too Hard', emoji: '😅' },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => rateDifficulty(key)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: 11, fontWeight: 800, border: '2px solid',
                  borderColor: difficulty === key ? '#0e7490' : 'var(--card-b)',
                  background: difficulty === key ? 'rgba(14,116,144,.12)' : 'var(--bar-bg)',
                  color: difficulty === key ? '#0e7490' : 'var(--subtext)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* What next CTA */}
        {onNext && (
          <button
            data-modal-focus
            onClick={() => { onClose(); onNext(); }}
            style={{
              width: '100%', marginTop: 14, padding: '13px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#0e7490,#164e63)', color: '#fff',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 16px rgba(14,116,144,.3)',
            }}
          >
            Continue Learning →
          </button>
        )}

        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--subtext)',
            marginTop: 12,
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

export default memo(CelebrationModal);
