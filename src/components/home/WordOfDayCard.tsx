// src/components/home/WordOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { WordOfDay } from '../../lib/wordOfDay';

const CROATIAN_RED = '#CC0000';

// Šahovnica micro-pattern — alternating white squares, very subtle
const SAHOVNICA_PATTERN = `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='5' height='5' fill='rgba(255,255,255,0.07)'/%3E%3Crect x='5' y='5' width='5' height='5' fill='rgba(255,255,255,0.07)'/%3E%3C/svg%3E")`;

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

// Decorative 4×4 šahovnica grid — watermark in corner
function SahovnicaWatermark({ opacity = 0.2 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 2.5,
        width: 38,
        height: 38,
        opacity,
      }}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return (
          <div
            key={i}
            style={{
              background: (r + c) % 2 === 0 ? '#fff' : 'transparent',
              borderRadius: 1.5,
            }}
          />
        );
      })}
    </div>
  );
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
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        border: '1px solid var(--card-b)',
        boxShadow: '0 12px 40px rgba(204,0,0,.14), 0 2px 8px rgba(0,0,0,.07)',
      }}
    >
      {/* ── RED HERO PANEL ── */}
      <div
        style={{
          background: `${SAHOVNICA_PATTERN}, linear-gradient(148deg, #CC0000 0%, #991a00 55%, #7a1400 100%)`,
          padding: '15px 18px 20px',
          position: 'relative',
        }}
      >
        {/* Overline row: label + date */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 900,
              color: 'rgba(255,255,255,.5)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Word of the Day
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: 'rgba(255,255,255,.32)',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.05em',
            }}
          >
            {todayLabel()}
          </span>
        </div>

        {/* Category label — small, above the word */}
        {catLabel && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,.48)',
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 5,
            }}
          >
            {catEmoji} {catLabel}
          </div>
        )}

        {/* Croatian word — the hero */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 44,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '-.02em',
            textShadow: '0 2px 24px rgba(0,0,0,.22)',
            marginBottom: 11,
          }}
        >
          {word.hr}
        </div>

        {/* Phonetic pill — frosted-glass style */}
        {word.ph && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,.13)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 100,
              padding: '4px 12px',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,.85)',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.06em',
            }}
          >
            {word.ph}
          </div>
        )}

        {/* Šahovnica watermark — bottom right corner */}
        <SahovnicaWatermark opacity={0.18} />
      </div>

      {/* ── GOLD EDITORIAL RULE ── */}
      <div
        style={{
          height: 2,
          background:
            'linear-gradient(90deg, rgba(185,148,62,.9) 0%, rgba(185,148,62,.5) 50%, transparent 100%)',
        }}
      />

      {/* ── TRANSLATION PANEL ── */}
      <div
        style={{
          background: 'var(--card)',
          padding: '14px 18px 16px',
        }}
      >
        {/* English — Playfair italic with typographic quotes */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 16,
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--heading)',
            lineHeight: 1.35,
            marginBottom: 13,
          }}
        >
          &ldquo;{word.en}&rdquo;
        </div>

        {/* Slušaj — full-width CTA */}
        <button
          onClick={handleSpeak}
          aria-label={`Pronounce ${word.hr}`}
          style={{
            width: '100%',
            background: playing ? 'linear-gradient(135deg, #CC0000, #991a00)' : 'transparent',
            border: `2px solid ${playing ? 'transparent' : 'rgba(204,0,0,.28)'}`,
            borderRadius: 12,
            padding: '11px 0',
            fontSize: 12,
            fontWeight: 900,
            color: playing ? '#fff' : CROATIAN_RED,
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            transition: 'all .18s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: playing ? '0 4px 18px rgba(204,0,0,.28)' : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>{playing ? '▶' : '🔊'}</span>
          {playing ? 'Playing…' : 'Slušaj'}
        </button>
      </div>
    </div>
  );
}
