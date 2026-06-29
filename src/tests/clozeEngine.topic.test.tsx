/**
 * clozeEngine.topic.test.tsx — guards the topic-aware cloze drill.
 *
 * "Today's Session" routes the adaptive grammar categories dative-locative,
 * instrumental, and vocative to the generic ClozeEngine (no dedicated drill
 * exists for them). The session chip advertises that exact topic, so the drill
 * must serve sentences for THAT topic, not a random all-cases mix ("not going to
 * the lessons stated"). Topic membership is an EXPLICIT `cat` on each sentence —
 * never inferred from the human-readable hint copy.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  selectClozeBank,
  isRoutedTopic,
  type ClozeTopic,
} from '../components/practice/ClozeEngine';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/aiPost', () => ({ _aiPost: vi.fn(() => Promise.resolve({ ok: false })) }));

const TOPICS: ClozeTopic[] = ['dative-locative', 'instrumental', 'vocative'];

describe('isRoutedTopic', () => {
  it('accepts only the three session-routed topics', () => {
    for (const t of TOPICS) expect(isRoutedTopic(t)).toBe(true);
    expect(isRoutedTopic('vocab-a2')).toBe(false);
    expect(isRoutedTopic('genitive')).toBe(false);
    expect(isRoutedTopic(null)).toBe(false);
    expect(isRoutedTopic(undefined)).toBe(false);
    expect(isRoutedTopic('')).toBe(false);
  });
});

describe('selectClozeBank — explicit-cat narrowing with full-bank fallback', () => {
  it.each(TOPICS)('serves only %s sentences (by explicit cat) and a full set', (topic) => {
    const bank = selectClozeBank(topic);
    // Every served sentence is EXPLICITLY tagged with the requested topic.
    for (const s of bank) {
      expect(s.cat).toBe(topic);
    }
    // Guard against content drift silently re-introducing the generic mislabel:
    // each routed topic must keep a full set (>= TOPIC_MIN = 6).
    expect(bank.length).toBeGreaterThanOrEqual(6);
  });

  it('falls back to the full mixed bank for null / non-routed categories', () => {
    const full = selectClozeBank(null);
    // Full bank is a superset of any single topic and contains untagged sentences.
    expect(full.length).toBeGreaterThan(selectClozeBank('instrumental').length);
    expect(full.some((s) => s.cat === undefined)).toBe(true);
    // A category that isn't one of the three routed topics is NOT narrowed.
    expect(selectClozeBank('vocab-a2').length).toBe(full.length);
  });

  it('every tagged sentence in the full bank uses a valid routed topic', () => {
    for (const s of selectClozeBank(null)) {
      if (s.cat !== undefined) expect(TOPICS).toContain(s.cat);
    }
  });
});

describe('ClozeEngine — consumes the session topic atomically on mount', () => {
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
    // The atomic consume removes the key on first render — no stale topic can
    // leak into the next (e.g. Practice-tab) cloze launch.
    expect(sessionStorage.getItem('nh_cloze_topic')).toBeNull();
  });
});
