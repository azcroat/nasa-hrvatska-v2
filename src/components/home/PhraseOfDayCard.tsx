// src/components/home/PhraseOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { PhraseOfDay } from '../../lib/wordOfDay';

const CROATIAN_BLUE = '#002868';

interface PhraseOfDayCardProps {
  phrase: PhraseOfDay;
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
                    background: stressed ? 'rgba(0,40,104,.08)' : '#f1f5f9',
                    color: stressed ? CROATIAN_BLUE : '#94a3b8',
                    border: stressed ? '1px solid rgba(0,40,104,.2)' : '1px solid #e2e8f0',
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
        borderRadius: 14,
        background: 'var(--card)',
        border: '1.5px solid #e8ecf2',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '11px 13px 12px', display: 'flex', alignItems: 'stretch', gap: 11 }}>
        {/* 3px navy left accent bar */}
        <div
          style={{
            width: 3,
            borderRadius: 3,
            background: `linear-gradient(to bottom, ${CROATIAN_BLUE}, #001a4f)`,
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Overline: label */}
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontSize: 8,
                fontWeight: 900,
                color: CROATIAN_BLUE,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                fontFamily: "'Outfit', sans-serif",
                opacity: 0.75,
              }}
            >
              Phrase of the Day
            </span>
          </div>

          {/* Croatian phrase — 22px/900 Playfair upright, matching WoD exactly */}
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
            {phrase.hr}
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
              marginBottom: phrase.ph ? 8 : phrase.note ? 8 : 10,
            }}
          >
            {phrase.en}
          </div>

          {/* Pronunciation chips — shown only when ph data is present */}
          {phrase.ph && <PronunciationChips ph={phrase.ph} />}

          {/* Usage / context note */}
          {phrase.note && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#94a3b8',
                fontStyle: 'italic',
                lineHeight: 1.4,
                marginBottom: 10,
              }}
            >
              {phrase.note}
            </div>
          )}

          {/* Compact Slušaj button */}
          <button
            onClick={handleSpeak}
            aria-label={`Pronounce ${phrase.hr}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: playing
                ? `linear-gradient(135deg, ${CROATIAN_BLUE}, #001a4f)`
                : 'rgba(0,40,104,.05)',
              border: `1px solid ${playing ? 'transparent' : 'rgba(0,40,104,.2)'}`,
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 9,
              fontWeight: 900,
              color: playing ? '#fff' : CROATIAN_BLUE,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              transition: 'all .18s ease',
              boxShadow: playing ? '0 2px 10px rgba(0,40,104,.25)' : 'none',
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
