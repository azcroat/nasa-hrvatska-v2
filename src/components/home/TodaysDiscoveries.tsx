// src/components/home/TodaysDiscoveries.tsx
//
// Single fixed-height widget that consolidates the four "of the day" cards
// (Word / Phrase / City / Story) into one tabbed container. Replaces four
// stacked cards on the Today tab, each ~150-180px tall, which together
// pushed Story of the Day below the fold so users didn't know it existed.
// Now: ~250px fixed height, all four labels visible in the tab strip,
// user controls which item to view. Equally discoverable, no scroll.
import React, { useState } from 'react';
import WordOfDayCard from './WordOfDayCard';
import PhraseOfDayCard from './PhraseOfDayCard';
import CityOfDayCard from './CityOfDayCard';
import { StoryOfTheDayCard } from './StoryOfTheDayCard';

type Tab = 'word' | 'phrase' | 'city' | 'story';

interface Props {
  wod: unknown;
  pod: unknown;
  setScr: (scr: unknown, ...args: unknown[]) => void;
  launchStory?: (storyId: string) => void;
}

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'word', icon: '📝', label: 'Word' },
  { id: 'phrase', icon: '💬', label: 'Phrase' },
  { id: 'city', icon: '🏙️', label: 'City' },
  { id: 'story', icon: '📖', label: 'Story' },
];

export default function TodaysDiscoveries({ wod, pod, setScr, launchStory }: Props) {
  const [active, setActive] = useState<Tab>('word');

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: '12px 16px 8px',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
        }}
      >
        Today's Discoveries
      </div>

      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Today's discoveries"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1.5px solid var(--card-b)',
          padding: '0 4px',
        }}
      >
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                borderBottom: isActive ? '3px solid #B80020' : '3px solid transparent',
                marginBottom: -1.5,
                fontFamily: "'Outfit', sans-serif",
                transition: 'color .15s, border-color .15s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isActive ? '#B80020' : 'var(--subtext)',
                  letterSpacing: '.02em',
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body — render the active tab's card. Each card is responsible for
          its own data fetch and click handling; we just give them a slot.
          Reset marginBottom of inner cards by wrapping in a div that
          neutralizes their own outer margin. */}
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: -16 }}>
          {active === 'word' && wod ? (
            <WordOfDayCard word={wod} />
          ) : active === 'word' ? (
            <EmptyState text="Loading today's word…" />
          ) : null}
          {active === 'phrase' && pod ? (
            <PhraseOfDayCard phrase={pod} />
          ) : active === 'phrase' ? (
            <EmptyState text="Loading today's phrase…" />
          ) : null}
          {active === 'city' ? <CityOfDayCard setScr={setScr} /> : null}
          {active === 'story' && launchStory ? (
            <StoryOfTheDayCard launchStory={launchStory} />
          ) : active === 'story' ? (
            <EmptyState text="Story of the day will appear here." />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '32px 16px',
        textAlign: 'center',
        color: 'var(--subtext)',
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}
