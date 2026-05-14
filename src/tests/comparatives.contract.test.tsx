/**
 * comparatives.contract.test.tsx — Pattern X
 *
 * ComparativesScreen fires the contract when all comparative quiz questions are answered.
 * The reference table buttons use border:none+borderBottom; quiz options use
 * #d6d3d1 = rgb(214,211,209) for the unanswered border. We click only quiz options.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

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

function clickAllGrayOptionButtons(): void {
  // Quiz option buttons have border: 2px solid rgb(214,211,209) when unanswered
  // Reference table buttons have border: none; borderBottom: ... (no rgb(214,211,209))
  const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
  const grayBtns = btns.filter((b) =>
    (b.getAttribute('style') ?? '').includes('rgb(214, 211, 209)'),
  );
  grayBtns.forEach((b) => fireEvent.click(b));
}

describe('ComparativesScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest(grammar), setStats gc+1/vs:comparatives, writeDelta', async () => {
    const { default: ComparativesScreen } =
      await import('../components/practice/exercises/ComparativesScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <ComparativesScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    clickAllGrayOptionButtons();

    expect(award).toHaveBeenCalled();
    const calls = award.mock.calls as [number, boolean, string][];
    const grammarCall = calls.find((c) => c[2] === 'grammar');
    expect(grammarCall).toBeDefined();

    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    expect(setStats).toHaveBeenCalled();
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('comparatives');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['comparatives']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has comparatives', async () => {
    const { default: ComparativesScreen } =
      await import('../components/practice/exercises/ComparativesScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['comparatives']);

    render(
      <StatsProvider value={value}>
        <ComparativesScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    clickAllGrayOptionButtons();

    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
