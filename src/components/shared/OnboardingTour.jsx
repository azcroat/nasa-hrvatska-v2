import React, { useState } from 'react';

const STEPS = [
  {
    icon: '👋',
    title: 'Dobrodošli! Welcome!',
    body: 'Naša Hrvatska helps you reach Croatian fluency through vocabulary, grammar, reading, and immersive practice.',
  },
  {
    icon: '📚',
    title: 'Learn at your pace',
    body: 'Start with vocabulary basics, then move through Foundation → Intermediate → Advanced grammar lessons at your own speed.',
  },
  {
    icon: '🎮',
    title: 'Practice every day',
    body: 'Flashcards, quizzes, speaking drills, and daily challenges keep your skills sharp. Earn XP to level up!',
  },
  {
    icon: '🔥',
    title: 'Build your streak',
    body: 'Come back daily to maintain your streak. Set a weekly XP goal in the sidebar and track your progress.',
  },
];

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function finish() {
    localStorage.setItem('onboarded', 'true');
    onDone();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99990,
      background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--card, #fff)',
        borderRadius: 24,
        padding: '36px 32px 28px',
        maxWidth: 360,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        animation: 'tooltipIn .3s ease',
      }}>
        {/* step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 7, height: 7, borderRadius: 4,
              background: i === step ? '#0e7490' : 'var(--bar-bg, #e2e8f0)',
              transition: 'all .25s',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>{cur.icon}</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--heading, #0f172a)', marginBottom: 10 }}>
          {cur.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--subtext, #64748b)', lineHeight: 1.65, fontWeight: 500, marginBottom: 28 }}>
          {cur.body}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--inp-b, #e2e8f0)',
                background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                color: 'var(--subtext, #64748b)', fontFamily: "'Outfit',sans-serif",
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(s => s + 1)}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#0e7490,#164e63)',
              cursor: 'pointer', fontSize: 14, fontWeight: 800,
              color: '#fff', fontFamily: "'Outfit',sans-serif",
              boxShadow: '0 3px 12px rgba(14,116,144,.28)',
            }}
          >
            {isLast ? "Let's go! 🚀" : 'Next →'}
          </button>
        </div>

        <button
          onClick={finish}
          style={{
            marginTop: 14, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--subtext, #94a3b8)', fontFamily: "'Outfit',sans-serif",
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
