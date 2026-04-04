import React, { useState } from 'react';

const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'Connect with my heritage', sub: 'Rediscover my Croatian roots' },
  { id: 'fluent',   icon: '🗣️', label: 'Become fluent',            sub: 'Hold real conversations' },
  { id: 'travel',   icon: '✈️', label: 'Travel to Croatia',         sub: 'Navigate & explore confidently' },
  { id: 'culture',  icon: '🎵', label: 'Explore Croatian culture',  sub: 'Music, history, traditions' },
];

const COMMITMENTS = [
  { id: 10,  icon: '🌱', label: '5 minutes/day',  sub: 'Casual · 10 XP daily goal',  xp: 10 },
  { id: 30,  icon: '⚡', label: '15 minutes/day', sub: 'Regular · 30 XP daily goal',  xp: 30 },
  { id: 60,  icon: '🔥', label: '30 minutes/day', sub: 'Serious · 60 XP daily goal',  xp: 60 },
];

const CONNECTIONS = [
  { id: 'diaspora', icon: '🌍', label: 'I have Croatian heritage', sub: 'Family roots in Croatia' },
  { id: 'family',   icon: '❤️', label: 'Partner or family member', sub: 'Learning for someone I love' },
  { id: 'curious',  icon: '🌟', label: 'Just curious & passionate', sub: 'Fell in love with Croatia' },
];

export default function GoalSetterModal({ onComplete }) {
  const [step, setStep] = useState(0); // 0=goal, 1=commitment, 2=connection
  const [goal, setGoal] = useState(null);
  const [xp, setXp] = useState(null);
  const [connection, setConnection] = useState(null);

  const steps = [
    {
      q: "What's your main goal?",
      sub: "We'll personalize your learning path",
      options: GOALS,
      selected: goal,
      onSelect: setGoal,
    },
    {
      q: "How much time can you commit daily?",
      sub: "We'll set your daily XP target",
      options: COMMITMENTS,
      selected: xp,
      onSelect: setXp,
    },
    {
      q: "What's your connection to Croatia?",
      sub: "Helps us tailor your cultural content",
      options: CONNECTIONS,
      selected: connection,
      onSelect: setConnection,
    },
  ];

  const cur = steps[step];
  const canNext = cur.selected !== null;

  const handleNext = () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      // Save to localStorage
      localStorage.setItem('nh_goal', goal);
      localStorage.setItem('nh_daily_goal_xp', String(xp));
      localStorage.setItem('nh_connection', connection);
      localStorage.setItem('nh_goal_set', '1');
      onComplete({ goal, xp, connection });
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fade-in .25s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--app-bg)',
        borderRadius: '24px 24px 0 0',
        padding: '28px 20px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        animation: 'slide-up .35s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--info)' : 'var(--bar-bg)',
              transition: 'width .25s ease, background .25s ease',
            }} />
          ))}
        </div>

        {/* Question */}
        <div style={{ marginBottom: 6, fontSize: 20, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display', serif", lineHeight: 1.25 }}>
          {cur.q}
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 500, marginBottom: 20 }}>
          {cur.sub}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {cur.options.map(opt => {
            const isSelected = cur.selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => cur.onSelect(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? 'rgba(14,116,144,0.1)' : 'var(--card)',
                  border: isSelected ? '2px solid var(--info)' : '1.5px solid var(--card-b)',
                  transition: 'border-color .15s, background .15s',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.2 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>{opt.sub}</div>
                </div>
                {isSelected && <span style={{ color: 'var(--info)', fontSize: 18, flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!canNext}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: canNext ? 'pointer' : 'default',
            background: canNext ? 'var(--info)' : 'var(--bar-bg)',
            color: canNext ? '#fff' : 'var(--subtext)',
            fontSize: 16, fontWeight: 800, fontFamily: "'Outfit', sans-serif",
            transition: 'background .2s, color .2s',
            letterSpacing: '.01em',
          }}
        >
          {step < 2 ? 'Continue →' : "Let's Start Learning! 🇭🇷"}
        </button>
      </div>
    </div>
  );
}
