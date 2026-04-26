// src/components/home/PhraseOfDayCard.tsx
import React, { useState } from 'react';
import { speak } from '../../data';
import type { PhraseOfDay } from '../../lib/wordOfDay';

const CROATIAN_BLUE = '#002868';

// Šahovnica micro-pattern — alternating white squares, subtle overlay
const SAHOVNICA_PATTERN = `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='5' height='5' fill='rgba(255,255,255,0.05)'/%3E%3Crect x='5' y='5' width='5' height='5' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E")`;

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
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        border: '1px solid var(--card-b)',
        boxShadow: '0 12px 40px rgba(0,40,104,.14), 0 2px 8px rgba(0,0,0,.07)',
      }}
    >
      {/* ── NAVY HERO PANEL ── */}
      <div
        style={{
          background: `${SAHOVNICA_PATTERN}, linear-gradient(148deg, #002868 0%, #001a4f 55%, #000e2e 100%)`,
          padding: '15px 18px 22px',
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
            Phrase of the Day
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

        {/* Oversized decorative quotation mark — editorial character */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 64,
            fontWeight: 900,
            color: 'rgba(255,255,255,.12)',
            lineHeight: 0.7,
            marginBottom: 2,
            userSelect: 'none',
            letterSpacing: '-.02em',
          }}
          aria-hidden="true"
        >
          &ldquo;
        </div>

        {/* Croatian phrase — italic Playfair hero */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#fff',
            lineHeight: 1.38,
            letterSpacing: '-.01em',
            textShadow: '0 2px 12px rgba(0,0,0,.2)',
            paddingRight: 8,
          }}
        >
          {phrase.hr}
        </div>

        {/* Šahovnica watermark — bottom right corner */}
        <SahovnicaWatermark opacity={0.18} />
      </div>

      {/* ── GOLD EDITORIAL RULE ── */}
      <div
        style={{
          height: 2,
          background:
            'linear-gradient(90deg, rgba(185,148,62,.7) 0%, rgba(185,148,62,.35) 50%, transparent 100%)',
        }}
      />

      {/* ── TRANSLATION PANEL ── */}
      <div
        style={{
          background: 'var(--card)',
          padding: '14px 18px 16px',
        }}
      >
        {/* English translation */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--heading)',
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {phrase.en}
        </div>

        {/* Usage / context note */}
        {phrase.note && (
          <div
            style={{
              background: 'rgba(0,40,104,.05)',
              borderLeft: `3px solid rgba(0,40,104,.35)`,
              borderRadius: '0 8px 8px 0',
              padding: '7px 10px',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--subtext)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {phrase.note}
          </div>
        )}

        {/* Slušaj — full-width CTA */}
        <button
          onClick={handleSpeak}
          aria-label={`Pronounce ${phrase.hr}`}
          style={{
            width: '100%',
            background: playing
              ? `linear-gradient(135deg, ${CROATIAN_BLUE}, #001a4f)`
              : 'transparent',
            border: `2px solid ${playing ? 'transparent' : 'rgba(0,40,104,.25)'}`,
            borderRadius: 12,
            padding: '11px 0',
            fontSize: 12,
            fontWeight: 900,
            color: playing ? '#fff' : CROATIAN_BLUE,
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            transition: 'all .18s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: playing ? '0 4px 18px rgba(0,40,104,.28)' : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>{playing ? '▶' : '🔊'}</span>
          {playing ? 'Playing…' : 'Slušaj'}
        </button>
      </div>
    </div>
  );
}
