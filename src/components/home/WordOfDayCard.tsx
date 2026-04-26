// src/components/home/WordOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { WordOfDay } from '../../lib/wordOfDay';

// Croatian identity palette
const CROATIAN_RED = '#CC0000';

// Category → emoji mapping for the badge
const CAT_EMOJI: Record<string, string> = {
  food: '🍽️',
  family: '👨‍👩‍👧',
  nature: '🌿',
  travel: '✈️',
  body: '🫀',
  home: '🏠',
  work: '💼',
  time: '🕐',
  numbers: '🔢',
  colours: '🎨',
  colors: '🎨',
  emotions: '❤️',
  places: '📍',
  animals: '🐾',
  sports: '⚽',
  weather: '🌤️',
  clothing: '👗',
  health: '🏥',
  school: '📚',
  city: '🏙️',
  sea: '🌊',
};

interface WordOfDayCardProps {
  word: WordOfDay;
}

function todayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
}

export default function WordOfDayCard({ word }: WordOfDayCardProps) {
  const [playing, setPlaying] = useState(false);
  const catEmoji = CAT_EMOJI[word.cat.toLowerCase()] ?? '📖';
  const catLabel = word.cat ? word.cat.charAt(0).toUpperCase() + word.cat.slice(1) : '';

  function handleSpeak() {
    setPlaying(true);
    speak(word.hr);
    setTimeout(() => setPlaying(false), 1500);
  }

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        marginBottom: 10,
        display: 'flex',
      }}
    >
      {/* Left bookmark strip — Croatian red */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${CROATIAN_RED}, #991a00)`,
        }}
      />

      <div style={{ flex: 1, padding: '14px 15px 14px 15px' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: CROATIAN_RED,
                textTransform: 'uppercase',
                letterSpacing: '.14em',
              }}
            >
              📖 Word of the Day
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'var(--subtext)',
                letterSpacing: '.02em',
              }}
            >
              {todayLabel()}
            </span>
          </div>

          {/* Audio button */}
          <button
            onClick={handleSpeak}
            aria-label={`Pronounce ${word.hr}`}
            style={{
              background: playing ? CROATIAN_RED : `${CROATIAN_RED}12`,
              border: `1px solid ${playing ? CROATIAN_RED : `${CROATIAN_RED}30`}`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: playing ? '#fff' : CROATIAN_RED,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'background .18s, color .18s, border-color .18s',
              flexShrink: 0,
            }}
          >
            {playing ? '▶ Playing…' : '🔊 Hear it'}
          </button>
        </div>

        {/* Croatian word — star of the show */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: 'var(--heading)',
            fontFamily: "'Playfair Display', serif",
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          {word.hr}
        </div>

        {/* Phonetic + category row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          {word.ph && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#92400e',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 20,
                padding: '2px 9px',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '.02em',
              }}
            >
              {word.ph}
            </span>
          )}
          {catLabel && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#475569',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: '2px 9px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {catEmoji} {catLabel}
            </span>
          )}
        </div>

        {/* English translation */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--subtext)',
            lineHeight: 1.4,
          }}
        >
          {word.en}
        </div>
      </div>
    </div>
  );
}
