import React, { useState } from 'react';
import { getStory } from '../../../lib/contentClient';
import type { StoryCatalogEntry } from '../../../types/content';

/** Find the graded story closest to the given CEFR level (from async-loaded catalog) */
function getBonusStoryFromCatalog(
  catalog: StoryCatalogEntry[],
  levelId: string,
): StoryCatalogEntry | null {
  const stories = catalog.filter((s) => s.level === levelId);
  if (stories.length > 0) {
    const idx = Math.floor(Math.random() * stories.length);
    return stories[idx] ?? null;
  }
  if (catalog.length > 0) return catalog[0] ?? null;
  return null;
}

export default function BonusStoryCard({
  catalog,
  levelId,
  accentColor: _accentColor,
  onOpen,
}: {
  catalog: StoryCatalogEntry[];
  levelId: string;
  accentColor: string;
  onOpen: (story: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const story = getBonusStoryFromCatalog(catalog, levelId);
  if (!story) return null;

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const full = await getStory(story!.id);
      onOpen(full);
    } catch {
      // Silent — user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 18px',
        background: 'linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.03))',
        border: '1.5px solid rgba(124,58,237,.25)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#7c3aed',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          marginBottom: 8,
        }}
      >
        🎁 Bonus: Extended Listening
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 30 }}>{story.icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
            {story.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
            {story.titleEn} · {story.duration} min · {story.level}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 14, lineHeight: 1.5 }}>
        {story.intro}
      </div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: '#7c3aed',
          color: 'white',
          fontSize: 14,
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: "'Outfit',sans-serif",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Loading…' : 'Listen to story →'}
      </button>
    </div>
  );
}
