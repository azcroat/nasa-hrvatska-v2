// @ts-nocheck
import React, { useMemo } from 'react';

export default function MemoryChips({ knownFacts }) {
  const entries = useMemo(() => Object.entries(knownFacts || {}), [knownFacts]);
  if (!entries.length) return null;

  const iconMap = {
    city: '📍',
    location: '📍',
    hometown: '📍',
    lives: '📍',
    hobby: '❤️',
    hobbies: '❤️',
    interest: '❤️',
    loves: '❤️',
    food: '🍽️',
    family: '👨‍👩‍👧',
    children: '👶',
    spouse: '💑',
    partner: '💑',
    work: '💼',
    job: '💼',
    profession: '💼',
    sport: '⚽',
    team: '🏆',
    language: '🗣️',
    name: '👤',
  };

  function getIcon(key) {
    const lk = key.toLowerCase();
    for (const [k, v] of Object.entries(iconMap)) {
      if (lk.includes(k)) return v;
    }
    return '💡';
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        padding: '4px 0 8px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {entries.map(([key, val]) => (
        <span
          key={key}
          style={{
            flexShrink: 0,
            fontSize: 11,
            padding: '3px 9px',
            borderRadius: 20,
            background: 'rgba(212,0,45,0.08)',
            border: '1px solid rgba(212,0,45,0.2)',
            color: 'var(--subtext)',
            whiteSpace: 'nowrap',
          }}
        >
          {getIcon(key)} {String(val)}
        </span>
      ))}
    </div>
  );
}
