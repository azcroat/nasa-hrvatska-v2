/**
 * clozeEngine.topic.test.tsx — guards the topic-aware cloze drill.
 *
 * "Today's Session" routes the adaptive grammar categories dative-locative,
 * instrumental, and vocative to the generic ClozeEngine (no dedicated drill
 * exists for them). The session chip advertises that exact topic, so the drill
 * must serve sentences for THAT topic — otherwise the chip says "Instrumental"
 * but the user gets a random all-cases mix ("not going to the lessons stated").
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  clozeHintTopic,
  selectClozeBank,
  type ClozeTopic,
} from '../components/practice/ClozeEngine';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: vi.fn(() => Promise.resolve({ ok: false })) }));

const TOPICS: ClozeTopic[] = ['dative-locative', 'instrumental', 'vocative'];

describe('clozeHintTopic — classifies hints to a session topic', () => {
  it('maps leading case names to their topic', () => {
    expect(clozeHintTopic('Instrumental — means of transport')).toBe('instrumental');
    expect(clozeHintTopic('Vocative — direct address')).toBe('vocative');
    expect(clozeHintTopic('Dative — indirect object')).toBe('dative-locative');
    expect(clozeHintTopic("Locative after 'na'")).toBe('dative-locative');
  });

  it('treats unrelated hints as "other" (only the three routed topics narrow)', () => {
    expect(clozeHintTopic('Nominative — subject of sentence')).toBe('other');
    expect(clozeHintTopic('Accusative — direct object')).toBe('other');
    expect(clozeHintTopic('Genitive after negation / quantity')).toBe('other');
    expect(clozeHintTopic('Preposition + genitive (in front of)')).toBe('other');
    expect(clozeHintTopic('')).toBe('other');
  });
});

describe('selectClozeBank — topic narrowing with full-bank fallback', () => {
  it.each(TOPICS)('serves only %s sentences and has enough for a real drill', (topic) => {
    const bank = selectClozeBank(topic);
    // Every served sentence must actually be of the requested topic.
    for (const s of bank) {
      expect(clozeHintTopic(s.hint)).toBe(topic);
    }
    // Guard against content drift silently re-introducing the generic mislabel:
    // each routed topic must have a full set (>= TOPIC_MIN = 6).
    expect(bank.length).toBeGreaterThanOrEqual(6);
  });

  it('falls back to the full mixed bank for null / non-routed categories', () => {
    const full = selectClozeBank(null);
    // Full bank is a superset of any single topic and contains mixed topics.
    expect(full.length).toBeGreaterThan(selectClozeBank('instrumental').length);
    expect(full.some((s) => clozeHintTopic(s.hint) === 'other')).toBe(true);
    // A category that isn't one of the three routed topics is NOT narrowed.
    expect(selectClozeBank('vocab-a2').length).toBe(full.length);
  });
});

describe('ClozeEngine — consumes the session topic on mount', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reads and clears nh_cloze_topic so a later generic launch is not narrowed', async () => {
    const { StatsProvider } = await import('../context/StatsContext');
    const { default: ClozeEngine } = await import('../components/practice/ClozeEngine');
    const value = {
      stats: {
        xp: 0,
        lc: 0,
        gc: 0,
        sp: 0,
        de: 0,
        rc: 0,
        pf: 0,
        mv: 0,
        hi: 0,
        str: 0,
        authLoading: 0,
        diff: 'beginner',
        ct: [],
        vs: [],
        rs: [],
        badges: [],
      },
      setStats: vi.fn(),
      writeDelta: vi.fn(),
      dispatch: vi.fn(),
      award: vi.fn(),
      level: 1,
    } as unknown as React.ComponentProps<typeof StatsProvider>['value'];

    sessionStorage.setItem('nh_cloze_topic', 'vocative');
    render(
      <StatsProvider value={value}>
        <ClozeEngine goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    // The mount effect consumes the key — no stale topic can leak into the next
    // (e.g. Practice-tab) cloze launch.
    expect(sessionStorage.getItem('nh_cloze_topic')).toBeNull();
  });
});
