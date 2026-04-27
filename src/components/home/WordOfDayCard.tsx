// src/components/home/WordOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { WordOfDay } from '../../lib/wordOfDay';

const CROATIAN_RED = '#CC0000';

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

/** ph format: "KAH-koh YOO-troh" — space=word boundary, hyphen=syllable, UPPERCASE=stressed */
function parsePh(ph: string): string[][] {
  return ph.split(' ').map((group) => group.split('-'));
}

function isStressed(syl: string): boolean {
  return syl === syl.toUpperCase() && /[A-Z]/.test(syl);
}

function PronunciationChips({ ph }: { ph: string }) {
  const groups = parsePh(ph);
  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 10 }}
    >
      {groups.map((syls, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <span style={{ color: '#cbd5e1', fontSize: 8, userSelect: 'none' }}>·</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {syls.map((syl, si) => {
              const stressed = isStressed(syl);
              return (
                <span
                  key={si}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 9,
                    fontWeight: stressed ? 800 : 600,
                    padding: '2px 5px',
                    borderRadius: 5,
                    background: stressed ? 'rgba(204,0,0,.08)' : '#f1f5f9',
                    color: stressed ? CROATIAN_RED : '#5f6b7a',
                    border: stressed ? '1px solid rgba(204,0,0,.2)' : '1px solid #e2e8f0',
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {syl}
                </span>
              );
            })}
          </div>
        </React.Fragment>
      ))}
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
        borderRadius: 14,
        background: 'var(--card)',
        border: '1.5px solid #e8ecf2',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '11px 13px 12px', display: 'flex', alignItems: 'stretch', gap: 11 }}>
        {/* 3px red left accent bar */}
        <div
          style={{
            width: 3,
            borderRadius: 3,
            background: `linear-gradient(to bottom, ${CROATIAN_RED}, #991a00)`,
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Overline: label + category */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 900,
                color: CROATIAN_RED,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Word of the Day
            </span>
            {catLabel && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#5f6b7a',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {catEmoji} {catLabel}
              </span>
            )}
          </div>

          {/* Croatian word — 22px/900 Playfair upright */}
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
              lineHeight: 1.15,
              letterSpacing: '-.02em',
              marginBottom: 4,
            }}
          >
            {word.hr}
          </div>

          {/* English translation — italic */}
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 13,
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'var(--subtext)',
              lineHeight: 1.3,
              marginBottom: word.ph ? 8 : 10,
            }}
          >
            {word.en}
          </div>

          {/* Pronunciation chips — shown only when ph data is present */}
          {word.ph && <PronunciationChips ph={word.ph} />}

          {/* Compact Slušaj button */}
          <button
            onClick={handleSpeak}
            aria-label={`Pronounce ${word.hr}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: playing
                ? `linear-gradient(135deg, ${CROATIAN_RED}, #991a00)`
                : 'rgba(204,0,0,.05)',
              border: `1px solid ${playing ? 'transparent' : 'rgba(204,0,0,.2)'}`,
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 9,
              fontWeight: 900,
              color: playing ? '#fff' : CROATIAN_RED,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              transition: 'all .18s ease',
              boxShadow: playing ? '0 2px 10px rgba(204,0,0,.25)' : 'none',
            }}
          >
            <span style={{ fontSize: 11 }}>{playing ? '▶' : '🔊'}</span>
            {playing ? 'Playing…' : 'Slušaj'}
          </button>
        </div>
      </div>
    </div>
  );
}
