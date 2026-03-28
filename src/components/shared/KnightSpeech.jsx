import React, { useState, useEffect } from 'react';
import CroatianKnight from './CroatianKnight';

// Returns a contextual greeting message based on time, streak, stats
function getGreeting(st) {
  const hour = new Date().getHours();
  const streak = st?.ss || st?.streak?.count || 0;
  const xp = st?.xp || 0;
  const lc = st?.lc || 0;

  const timeGreeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobra večer';

  // Context-aware messages
  if (streak >= 30) {
    return { mood: 'celebrating', text: `${timeGreeting}! 🔥 ${streak} days strong — you're a true Hrvat!` };
  }
  if (streak >= 7) {
    return { mood: 'happy', text: `${timeGreeting}! 💪 ${streak}-day streak — keep it going!` };
  }
  if (xp >= 1000 && lc >= 10) {
    return { mood: 'happy', text: `${timeGreeting}! You've earned ${xp} XP — impressive dedication! 🎓` };
  }
  if (lc === 0) {
    return { mood: 'happy', text: `${timeGreeting}! Ready to start your Croatian journey? Your first lesson awaits! 🇭🇷` };
  }
  if (hour < 12) {
    return { mood: 'thinking', text: `${timeGreeting}! Morning practice is the best practice. Ready to learn?` };
  }
  if (hour >= 20) {
    return { mood: 'happy', text: `${timeGreeting}! Evening session — great way to end the day. Hajde! 💪` };
  }

  // Rotating daily messages based on day of week
  const day = new Date().getDay();
  const messages = [
    { mood: 'happy',      text: `${timeGreeting}! Every word you learn brings Croatia closer. Hajde! 🇭🇷` },
    { mood: 'thinking',   text: `${timeGreeting}! Did you know? Croatian has 7 grammatical cases — let's master them together!` },
    { mood: 'happy',      text: `${timeGreeting}! Your ancestors spoke this language. Today, you carry it forward. 💙` },
    { mood: 'celebrating',text: `${timeGreeting}! Language is the soul of culture. Let's learn some today! 🌟` },
    { mood: 'happy',      text: `${timeGreeting}! Ima li tko tko voli učiti? Ja volim! Let's go! 🎉` },
    { mood: 'thinking',   text: `${timeGreeting}! Small steps every day. You're building something beautiful. 🏛️` },
    { mood: 'happy',      text: `${timeGreeting}! Naša Hrvatska čeka! Croatia is waiting — let's learn! 🇭🇷` },
  ];
  return messages[day % messages.length];
}

export default function KnightSpeech({ st, sessionKey = 'nh_knight_greeted', onDismiss = undefined }) {
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (!sessionStorage.getItem(sessionKey)) {
      // Small delay so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [sessionKey]);

  if (!visible) return null;

  const { mood, text } = getGreeting(st);

  const dismiss = () => {
    setAnimOut(true);
    sessionStorage.setItem(sessionKey, '1');
    setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '12px 16px',
        background: 'var(--card)',
        borderRadius: 16,
        border: '1.5px solid var(--card-b)',
        marginBottom: 14,
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
        animation: animOut ? 'fade-down .3s ease forwards' : 'spring-in .45s cubic-bezier(0.34,1.56,0.64,1) both',
        position: 'relative',
      }}
    >
      {/* Knight */}
      <div style={{ flexShrink: 0 }}>
        <CroatianKnight size={56} mood={mood} />
      </div>

      {/* Speech bubble */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--info)',
          marginBottom: 3,
        }}>
          Vitez govori · Your Knight
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--heading)',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          {text}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss greeting"
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          background: 'none',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 16,
          cursor: 'pointer',
          lineHeight: 1,
          padding: '2px 4px',
          borderRadius: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
