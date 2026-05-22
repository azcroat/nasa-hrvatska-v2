// src/components/home/TodaysDiscoveries.tsx
//
// Single fixed-height widget that consolidates the four "of the day" cards
// (Word / Phrase / City / Story) into one tabbed container. Replaces four
// stacked cards on the Today tab.
//
// 2026-05-22 visual treatment (Option A+C combined):
//   - Color-coded per tab: word=orange, phrase=red, city=teal, story=purple.
//   - Croatian-flag accent stripe (red/white/blue) along left edge.
//   - Active tab gets a tinted background + colored label + scaled icon.
//   - Sliding 4px indicator bar with colour/glow that morphs to match the
//     active tab's accent on switch.
//   - Pane fade+slide-in animation on tab switch (CSS @keyframes).
//   - Card has soft outer shadow for depth.
import React, { useState } from 'react';
import WordOfDayCard from './WordOfDayCard';
import PhraseOfDayCard from './PhraseOfDayCard';
import CityOfDayCard from './CityOfDayCard';
import { StoryOfTheDayCard } from './StoryOfTheDayCard';
import type { WordOfDay, PhraseOfDay } from '../../lib/wordOfDay';

type Tab = 'word' | 'phrase' | 'city' | 'story';

interface Props {
  wod: WordOfDay | null;
  pod: PhraseOfDay | null;
  setScr: (scr: unknown, ...args: unknown[]) => void;
  launchStory?: (storyId: string) => void;
}

interface TabSpec {
  id: Tab;
  icon: string;
  label: string;
  /** rgb triple as comma string — used for both the indicator colour and
   *  for the tinted active-tab background (rgba(${color},0.08)). */
  color: string;
}

const TABS: TabSpec[] = [
  { id: 'word', icon: '📝', label: 'Word', color: '217,119,6' },
  { id: 'phrase', icon: '💬', label: 'Phrase', color: '204,0,0' },
  { id: 'city', icon: '🏙️', label: 'City', color: '14,116,144' },
  { id: 'story', icon: '📖', label: 'Story', color: '124,58,237' },
];

export default function TodaysDiscoveries({ wod, pod, setScr, launchStory }: Props) {
  const [active, setActive] = useState<Tab>('word');
  const activeIdx = TABS.findIndex((t) => t.id === active);
  const activeSpec = TABS[activeIdx]!;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0 6px 24px rgba(15,23,42,.07), 0 1px 3px rgba(0,0,0,.04)',
        position: 'relative',
      }}
    >
      {/* Inline keyframes for pane fade+slide-in. Scoped via :where() not
          needed — animation name is namespaced enough. */}
      <style>{`
        @keyframes nh-td-slide-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Croatian flag accent stripe — red/white/blue vertically along left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background:
            'linear-gradient(180deg,#D40030 0%,#D40030 33.3%,#ffffff 33.3%,#ffffff 66.6%,#003DA5 66.6%,#003DA5 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Section label */}
      <div
        style={{
          padding: '13px 18px 9px 22px',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
        }}
      >
        Today's Discoveries
      </div>

      {/* Tab strip + sliding indicator */}
      <div
        role="tablist"
        aria-label="Today's discoveries"
        style={{
          display: 'flex',
          borderBottom: '1.5px solid var(--card-b)',
          paddingLeft: 4,
          position: 'relative',
        }}
      >
        {TABS.map((t) => {
          const isActive = active === t.id;
          const accent = `rgb(${t.color})`;
          const tintBg = `rgba(${t.color},0.08)`;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              style={{
                flex: 1,
                background: isActive ? tintBg : 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 4px 11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                zIndex: 1,
                fontFamily: "'Outfit', sans-serif",
                transition: 'background-color .18s ease, color .18s ease',
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform .25s ease',
                }}
              >
                {t.icon}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isActive ? accent : 'var(--subtext)',
                  letterSpacing: '.02em',
                  transition: 'color .2s ease',
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}

        {/* Sliding indicator — width matches 1/N tabs, transforms across by
            activeIdx * 100% on selection change. Background+glow morph to the
            active tab's accent colour. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -1.5,
            left: 4, // matches paddingLeft so it aligns with the tab row
            height: 4,
            width: 'calc((100% - 4px) / 4)',
            background: `rgb(${activeSpec.color})`,
            borderRadius: 2,
            transform: `translateX(${activeIdx * 100}%)`,
            boxShadow: `0 0 12px rgba(${activeSpec.color},0.5)`,
            transition:
              'transform .35s cubic-bezier(.5,.05,.2,1), background-color .25s ease, box-shadow .25s ease',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Body — render the active tab's card with fade+slide-in animation.
          Each card is responsible for its own data fetch and click handling;
          we just give them a slot. marginBottom: -16 cancels the inner
          card's own marginBottom so this container's padding controls
          spacing. */}
      <div
        // keyed by active so the pane remounts and re-runs the slide-in
        // animation on every tab switch.
        key={active}
        style={{
          padding: 12,
          animation: 'nh-td-slide-in .28s cubic-bezier(.5,.05,.2,1)',
        }}
      >
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
