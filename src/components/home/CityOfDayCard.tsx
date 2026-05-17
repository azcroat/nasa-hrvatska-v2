// src/components/home/CityOfDayCard.tsx
//
// Compact City-of-the-Day card for HomeTab. Picks a city deterministically
// per calendar day (server-shipped CROATIAN_CITIES via useContent + the
// dailyPickers.getCityOfDay helper). Visual language mirrors WordOfDayCard
// (red Croatian accent bar, Playfair display name, Outfit overlines).
//
// Tap → navigates to the full CityOfDayScreen via setScr('cityofday'),
// which shows the deeper profile (history, vocab, fast facts).

import React from 'react';
import { useContent } from '../../hooks/useContent';
import { getCityOfDay } from '../../lib/dailyPickers';

const CROATIAN_RED = '#CC0000';

interface CityOfDayCardProps {
  setScr: (screen: string) => void;
}

interface CityLike {
  name?: string;
  region?: string;
  tagline?: string;
  intro?: string;
  icon?: string;
}

export default function CityOfDayCard({ setScr }: CityOfDayCardProps) {
  const { content } = useContent();
  const city = getCityOfDay((content?.CROATIAN_CITIES ?? []) as CityLike[]);

  // Hidden during initial hydration — card pops in as soon as content lands.
  if (!city || !city.name) return null;

  const cityName = city.name;
  const region = city.region || 'Croatia';
  const tagline = city.tagline || city.intro || `Explore ${cityName} — a city in ${region}.`;
  // Trim tagline to a single sentence / ~140 chars so the home card stays compact.
  const taglineShort =
    tagline.length > 140 ? tagline.slice(0, 137).replace(/[,;:]?\s+\S*$/, '') + '…' : tagline;
  const icon = city.icon || '🏙️';

  return (
    <button
      type="button"
      onClick={() => setScr('cityofday')}
      aria-label={`Open ${cityName} — City of the Day`}
      data-testid="city-of-day-card"
      style={{
        all: 'unset',
        display: 'block',
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 14,
        background: 'var(--card)',
        border: '1.5px solid #e8ecf2',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        marginBottom: 12,
        overflow: 'hidden',
        transition: 'transform .12s ease, box-shadow .12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)';
      }}
    >
      <div style={{ padding: '11px 13px 12px', display: 'flex', alignItems: 'stretch', gap: 11 }}>
        {/* 3px red left accent bar — matches WordOfDayCard / PhraseOfDayCard */}
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
          {/* Overline: label + region */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              gap: 8,
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
              City of the Day
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: '#5f6b7a',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                fontFamily: "'Outfit', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '60%',
              }}
            >
              {icon} {region}
            </span>
          </div>

          {/* City name — 22px/900 Playfair upright */}
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
              lineHeight: 1.15,
              letterSpacing: '-.02em',
              marginBottom: 6,
            }}
          >
            {cityName}
          </div>

          {/* Tagline / intro snippet — italic, single line truncated */}
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 13,
              fontWeight: 600,
              fontStyle: 'italic',
              color: 'var(--subtext)',
              lineHeight: 1.4,
              marginBottom: 10,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {taglineShort}
          </div>

          {/* Compact "Explore →" pill — matches Slušaj button on WordOfDayCard */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(204,0,0,.05)',
              border: '1px solid rgba(204,0,0,.2)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 9,
              fontWeight: 900,
              color: CROATIAN_RED,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: 11 }}>🗺️</span>
            Explore →
          </div>
        </div>
      </div>
    </button>
  );
}
