/**
 * DictationScreen — behavioral contract test (Pattern X)
 *
 * DATA is hard-coded inside the component (20 sentences). We loop through all
 * of them: type any value → Check → Next → repeat → ✓ Done fires the contract.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  H: () => null,
  Bar: () => null,
  speak: vi.fn(),
}));

vi.mock('../lib/random.js', () => ({ rnd: () => 0.5 }));
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: vi.fn() }));
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

function driveToDone(): void {
  for (let i = 0; i < 80; i++) {
    const doneBtn = screen.queryByText(/Done/);
    if (doneBtn) return;
    const checkBtn = screen.queryByText(/Check/);
    if (checkBtn) {
      const input = screen.getByPlaceholderText(/Type what you heard/);
      fireEvent.change(input, { target: { value: 'x' } });
      fireEvent.click(checkBtn);
      continue;
    }
    const nextBtn = screen.queryByText(/Next/);
    if (nextBtn) {
      fireEvent.click(nextBtn);
      continue;
    }
    break;
  }
}

describe('DictationScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award(listening), markQuest(listening), lc+1/vs:dictation, writeDelta on Done', async () => {
    const { default: DictationScreen } = await import('../components/practice/DictationScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <DictationScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    driveToDone();
    fireEvent.click(screen.getByText(/Done/));

    expect(award).toHaveBeenCalledOnce();
    const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
    expect(xp).toBeGreaterThanOrEqual(0);
    expect(activityType).toBe('listening');

    expect(markQuestMock).toHaveBeenCalledWith('listening');

    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.lc).toBe(1);
    expect(next.vs).toContain('dictation');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ lc: 1, vs: expect.arrayContaining(['dictation']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has dictation', async () => {
    const { default: DictationScreen } = await import('../components/practice/DictationScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['dictation']);

    render(
      <StatsProvider value={value}>
        <DictationScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    driveToDone();
    fireEvent.click(screen.getByText(/Done/));

    expect(award).toHaveBeenCalled();
    expect(markQuestMock).toHaveBeenCalledWith('listening');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
