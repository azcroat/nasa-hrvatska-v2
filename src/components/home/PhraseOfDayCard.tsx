// src/components/home/PhraseOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { PhraseOfDay } from '../../lib/wordOfDay';

// Croatian identity palette
const CROATIAN_BLUE = '#002868';

interface PhraseOfDayCardProps {
  phrase: PhraseOfDay;
}

export default function PhraseOfDayCard({ phrase }: PhraseOfDayCardProps) {
  const [playing, setPlaying] = useState(false);

  function handleSpeak() {
    setPlaying(true);
    speak(phrase.hr);
    setTimeout(() => setPlaying(false), 1500);
  }

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        border: '1.5px solid #e8edf2',
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        marginBottom: 10,
        display: 'flex',
      }}
    >
      {/* Left bookmark strip — Croatian blue */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${CROATIAN_BLUE}, #001444)`,
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
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: CROATIAN_BLUE,
              textTransform: 'uppercase',
              letterSpacing: '.14em',
            }}
          >
            💬 Phrase of the Day
          </span>

          {/* Audio button */}
          <button
            onClick={handleSpeak}
            aria-label={`Pronounce ${phrase.hr}`}
            style={{
              background: playing ? CROATIAN_BLUE : `${CROATIAN_BLUE}12`,
              border: `1px solid ${playing ? CROATIAN_BLUE : `${CROATIAN_BLUE}30`}`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: playing ? '#fff' : CROATIAN_BLUE,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'background .18s, color .18s, border-color .18s',
              flexShrink: 0,
            }}
          >
            {playing ? '▶ Playing…' : '🔊 Hear it'}
          </button>
        </div>

        {/* Croatian phrase — in Playfair italic */}
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: '#0f172a',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            lineHeight: 1.25,
            marginBottom: 8,
          }}
        >
          {phrase.hr}
        </div>

        {/* English translation */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            lineHeight: 1.4,
            marginBottom: phrase.note ? 10 : 0,
          }}
        >
          {phrase.en}
        </div>

        {/* Usage / context note */}
        {phrase.note && (
          <div
            style={{
              borderLeft: `3px solid ${CROATIAN_BLUE}40`,
              paddingLeft: 10,
              fontSize: 11,
              fontWeight: 500,
              color: '#64748b',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {phrase.note}
          </div>
        )}
      </div>
    </div>
  );
}
