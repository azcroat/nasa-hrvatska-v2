import React, { useState, useEffect, useRef } from 'react';

const GENERIC_STEPS = [
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
    body: 'Come back daily to maintain your streak. Set a weekly XP goal in the Profile tab and track your progress.',
  },
];

const DIASPORA_STEPS = [
  {
    icon: '🇭🇷',
    title: 'Dobrodošli! Welcome home.',
    body: 'Naša Hrvatska is built for the diaspora — for those of us who grew up between two worlds. Every lesson connects you to the language your family carries.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Learn the language your family speaks',
    body: 'Start with family words, greetings, and the phrases your grandparents use. The Learn tab follows your goal, starting with what matters most to you.',
  },
  {
    icon: '🌊',
    title: 'Explore Croatia from anywhere',
    body: 'The Croatia tab is your cultural home — songs, history, recipes, cities, and live Croatian radio. Language and culture, together.',
  },
  {
    icon: '🔥',
    title: 'Your family is learning too',
    body: "Add family members to your leaderboard. When Baka sees you learning Croatian, she'll want to join. Build a streak together.",
  },
];

export default function OnboardingTour({ onDone, onLaunchLesson }) {
  const userGoal = localStorage.getItem('nh_goal');
  const isDiaspora = userGoal === 'heritage' || userGoal === 'family';
  const STEPS = isDiaspora ? DIASPORA_STEPS : GENERIC_STEPS;
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const modalRef = useRef(null);

  // Focus trap (also handles Escape)
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
      if (e.key === 'Escape') { onDone(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    modal.addEventListener('keydown', handleKeyDown);
    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [onDone, step]);

  function finish() {
    localStorage.setItem('onboarded', 'true');
    onDone();
    // Launch the first lesson immediately — convert the "Let's go!" moment into action
    if (onLaunchLesson) onLaunchLesson();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99990,
      background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome tour"
        style={{
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
              aria-label="Previous step"
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
            aria-label="Next step"
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#0e7490,#164e63)',
              cursor: 'pointer', fontSize: 14, fontWeight: 800,
              color: '#fff', fontFamily: "'Outfit',sans-serif",
              boxShadow: '0 3px 12px rgba(14,116,144,.28)',
            }}
          >
            {isLast ? "Start Learning! 🚀" : 'Next →'}
          </button>
        </div>

        <button
          onClick={finish}
          aria-label="Skip introduction"
          style={{
            marginTop: 14, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--subtext, #94a3b8)', fontFamily: "'Outfit',sans-serif",
            padding: '10px 20px', minHeight: 44, display: 'block', width: '100%',
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
