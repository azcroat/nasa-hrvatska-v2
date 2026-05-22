// src/components/home/StoryOfTheDayCard.tsx
// SP7 + SP11: home-screen card that surfaces the highest-scoring story for this
// learner. SP11 moved story content server-side; this card now fetches lightweight
// catalog metadata via contentClient and only loads full story bodies on user action
// (via parent's launchStory handler).
import React, { useEffect, useState } from 'react';
import { getStoryCatalog } from '../../lib/contentClient';
import { buildUserContext } from '../../lib/userContext';
import { getRecentReads } from '../../lib/recentReads';
import { recommendStory } from '../../lib/storyRecommendation';
import type { RankedStory } from '../../lib/storyRecommendation';

export interface StoryOfTheDayCardProps {
  launchStory: (storyId: string) => void;
}

const STYLES = {
  // Card is now a full-width button: tapping anywhere on it launches the
  // story. Previously only the small "Read this story →" CTA at the bottom
  // was clickable, which users reported as non-obvious — the card looked
  // informational. all:'unset' resets default button styling so the visual
  // matches the existing card design exactly.
  card: {
    all: 'unset' as const,
    boxSizing: 'border-box' as const,
    display: 'block' as const,
    width: '100%',
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    cursor: 'pointer' as const,
    textAlign: 'left' as const,
    fontFamily: 'inherit',
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: '0.08em',
    fontWeight: 700 as const,
    color: 'var(--subtext)',
    textTransform: 'uppercase' as const,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: 700 as const,
    padding: '2px 8px',
    borderRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: 'var(--heading)',
    margin: '4px 0',
  },
  titleEn: {
    fontSize: 13,
    color: 'var(--subtext)',
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  rationale: {
    fontSize: 13,
    color: 'var(--info)',
    margin: '8px 0 12px',
    fontWeight: 500 as const,
  },
  meta: {
    display: 'flex' as const,
    gap: 12,
    fontSize: 12,
    color: 'var(--subtext)',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  cta: {
    width: '100%',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px',
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
};

export function StoryOfTheDayCard({
  launchStory,
}: StoryOfTheDayCardProps): React.ReactElement | null {
  const [recommendation, setRecommendation] = useState<RankedStory | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await getStoryCatalog();
        if (cancelled) return;
        const ctx = buildUserContext();
        const rec = recommendStory(ctx, catalog, getRecentReads());
        setRecommendation(rec);
      } catch {
        // Decorative widget — silently hide on error (auth, offline, rate limit)
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null; // skeleton-free render — card just doesn't appear yet
  if (!recommendation) return null;

  const { story, rationale } = recommendation;

  return (
    <button
      data-testid="story-of-the-day-card"
      style={STYLES.card}
      onClick={() => launchStory(story.id)}
      aria-label={`Read story: ${story.title}`}
    >
      <div style={STYLES.header}>
        <span style={STYLES.label}>📖 Story of the Day · TAP TO READ →</span>
        <span
          style={{
            ...STYLES.levelBadge,
            background: story.levelBg,
            color: story.levelColor,
          }}
        >
          {story.level}
        </span>
      </div>
      <div style={STYLES.title}>
        {story.icon} {story.title}
      </div>
      <div style={STYLES.titleEn}>{story.titleEn}</div>
      <div style={STYLES.rationale}>💡 {rationale}</div>
      <div style={STYLES.meta}>
        <span>⏱ ~{story.duration} min</span>
        <span>·</span>
        <span>{story.focus}</span>
      </div>
    </button>
  );
}
