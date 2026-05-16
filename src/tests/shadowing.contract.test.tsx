/**
 * ShadowingScreen — behavioral contract test (Pattern X)
 *
 * With a 1-item SHADOWING pool and the mic-fallback path: click "🎤 I Said It!"
 * → click "Finish" (advances to done=true) → click "Finish" again on the
 * results screen to fire the contract.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  H: () => null,
  Bar: () => null,
  Spk: () => null,
  speakSlow: vi.fn(),
  SHADOWING: [{ hr: 'Dobar dan', en: 'Good day', tip: 'Listen for the d sounds' }],
}));

// SP11d: ShadowingScreen fetches SHADOWING via useContent().
vi.mock('../hooks/useContent', () => ({
  useContent: () => ({
    content: {
      V: {},
      COUNTRIES: [],
      PROFESSIONS: [],
      WEATHER: {},
      CLOTHES: {},
      BODYDESC: [],
      TECH_VOC: {},
      BUREAUCRATIC: {},
      PROVERBS: [],
      IDIOMS: [],
      BRZALICE: [],
      HISTORY: {},
      EVENTS: [],
      KINGS: {},
      REGIONS: {},
      DIALECTS: {},
      CROATIAN_CITIES: [],
      FOODORDER: {},
      TRANSPORT: [],
      GROCERY: {},
      RECIPES: [],
      PRACTICAL: {},
      SCENES: [],
      LEVEL_NARRATIVE: {},
      SHADOWING: [{ hr: 'Dobar dan', en: 'Good day', tip: 'Listen for the d sounds' }],
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));
vi.mock('../components/shared/PronunciationScorer', () => ({
  default: () => null,
}));

const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

function makeCtx(vsOverride?: string[]) {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const award = vi.fn();
  const stats: Stats = {
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
    vs: vsOverride ?? [],
    rs: [],
    badges: [],
  };
  const value: StatsContextValue = {
    stats,
    setStats,
    writeDelta,
    dispatch: vi.fn(),
    award,
    level: 1,
  };
  return { value, setStats, writeDelta, award };
}

describe('ShadowingScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award(listening), markQuest(listening), lc+1/vs:shadowing, writeDelta on Finish', async () => {
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText(/I Said It/));
    fireEvent.click(screen.getByText('Finish'));
    fireEvent.click(screen.getByText('Finish'));

    expect(award).toHaveBeenCalledOnce();
    const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
    expect(xp).toBeGreaterThan(0);
    expect(activityType).toBe('listening');

    expect(markQuestMock).toHaveBeenCalledWith('listening');

    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.lc).toBe(1);
    expect(next.vs).toContain('shadowing');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ lc: 1, vs: expect.arrayContaining(['shadowing']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has shadowing', async () => {
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['shadowing']);

    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText(/I Said It/));
    fireEvent.click(screen.getByText('Finish'));
    fireEvent.click(screen.getByText('Finish'));

    expect(award).toHaveBeenCalled();
    expect(markQuestMock).toHaveBeenCalledWith('listening');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
