/**
 * TranslateDrillsScreen — behavioral contract test (Pattern X)
 *
 * With a 1-drill mocked pool, click any option then "See Results" to fire the
 * completion block (award/markQuest/setStats/writeDelta).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  sh: <T,>(arr: T[]): T[] => arr,
}));

vi.mock('../data/exercises.js', () => ({
  TRANSLATE_DRILLS: [{ en: 'Hello', hr: 'Bok', opts: ['Bok', 'Zdravo'], level: 'A2' }],
  C1_DRILLS: [],
}));

vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));

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

describe('TranslateDrillsScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award(grammar), markQuest(vocab), gc+1/vs:translate, writeDelta on See Results', async () => {
    const { default: TranslateDrillsScreen } =
      await import('../components/practice/TranslateDrillsScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <TranslateDrillsScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('Bok'));
    fireEvent.click(screen.getByText(/See Results/));

    expect(award).toHaveBeenCalledOnce();
    const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
    expect(xp).toBeGreaterThanOrEqual(0);
    expect(activityType).toBe('grammar');

    expect(markQuestMock).toHaveBeenCalledWith('vocab');

    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('translate');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['translate']) }),
    );
  });

  it('is idempotent — already-completed re-run writes nothing and does not re-award', async () => {
    // completeExercise short-circuits when vs already has the key (no XP farming):
    // no award, no markQuest, no setStats, no writeDelta on a repeat completion.
    const { default: TranslateDrillsScreen } =
      await import('../components/practice/TranslateDrillsScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['translate']);

    render(
      <StatsProvider value={value}>
        <TranslateDrillsScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('Bok'));
    fireEvent.click(screen.getByText(/See Results/));

    expect(award).not.toHaveBeenCalled();
    expect(markQuestMock).not.toHaveBeenCalled();
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
