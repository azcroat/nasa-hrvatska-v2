/**
 * TypingScreen — behavioral contract test (Pattern X)
 *
 * Flow: with a 1-word vocabulary pool, click Skip → See Results → 🏠 Done.
 * The Done button is what fires the contract (award, markQuest, setStats, writeDelta).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  H: () => null,
  Bar: () => null,
  V: { test: [['bok', 'hi']] },
  sh: <T,>(arr: T[]): T[] => arr,
  srMark: vi.fn(),
  speak: vi.fn(),
  getDueReviews: () => [],
}));

// SP11d: TypingScreen now reads V via useContent().
vi.mock('../hooks/useContent', () => ({
  useContent: () => ({
    content: {
      V: { test: [['bok', 'hi']] },
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
      SHADOWING: [],
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));
vi.mock('../lib/knightSpeak.js', () => ({ knightFlash: vi.fn(), knightSpeak: vi.fn() }));

vi.mock('../components/shared/CroatianKeyboard', () => ({
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

describe('TypingScreen contract (Pattern X) — gated completion', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  // Mocked pool has one word: ['bok', 'hi']. Typing 'bok' = a perfect 1/1 = 100% pass.
  function finishCorrectly() {
    fireEvent.change(screen.getByPlaceholderText('Type Croatian…'), {
      target: { value: 'bok' },
    });
    fireEvent.click(screen.getByText('Check Answer'));
    fireEvent.click(screen.getByText(/See Results/));
    fireEvent.click(screen.getByText(/Done/));
  }

  it('on a PASS, credits via completeExercise: award(vocabulary), markQuest(vocab), gc+1/vs:typing, writeDelta', async () => {
    const { default: TypingScreen } = await import('../components/practice/TypingScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <TypingScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    finishCorrectly();

    expect(award).toHaveBeenCalledOnce();
    const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
    expect(xp).toBe(5); // 1 correct * 5
    expect(activityType).toBe('vocabulary');

    expect(markQuestMock).toHaveBeenCalledWith('vocab');

    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('typing');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['typing']) }),
    );
  });

  it('on a FAIL (skipped → 0%), the gate withholds ALL credit', async () => {
    const { default: TypingScreen } = await import('../components/practice/TypingScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <TypingScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByText(/See Results/));
    fireEvent.click(screen.getByText(/Done/));

    expect(award).not.toHaveBeenCalled();
    expect(markQuestMock).not.toHaveBeenCalled();
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });

  it('is idempotent — no re-credit when vs already has typing', async () => {
    const { default: TypingScreen } = await import('../components/practice/TypingScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['typing']);

    render(
      <StatsProvider value={value}>
        <TypingScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    finishCorrectly();

    // Already credited → completeExercise short-circuits before any write/award.
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
    expect(award).not.toHaveBeenCalled();
  });
});
