/**
 * reflexive.contract.test.tsx — Pattern X
 *
 * ReflexiveScreen has a tabbed interface. The contract fires on the Quiz tab.
 * We navigate to "Quiz" tab first, then snapshot all unanswered (gray-border)
 * option buttons and click them; handledRef prevents double-counting.
 * Quiz options use #e7e5e4 = rgb(231,229,228) as the unanswered border color.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
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

function clickAllGrayOptionButtons(grayColor: string): void {
  const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
  const grayBtns = btns.filter((b) => (b.getAttribute('style') ?? '').includes(grayColor));
  grayBtns.forEach((b) => fireEvent.click(b));
}

describe('ReflexiveScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest(grammar), setStats gc+1/vs:reflexive, writeDelta', async () => {
    const { default: ReflexiveScreen } =
      await import('../components/practice/exercises/ReflexiveScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <ReflexiveScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    // Navigate to Quiz tab
    const quizTab = screen
      .queryAllByRole('button')
      .find((b) => /^Quiz$/i.test((b as HTMLElement).textContent?.trim() ?? ''));
    if (quizTab) fireEvent.click(quizTab);

    // Quiz options use #e7e5e4 for unanswered border
    clickAllGrayOptionButtons('rgb(231, 229, 228)');

    expect(award).toHaveBeenCalled();
    const calls = award.mock.calls as [number, boolean, string][];
    const grammarCall = calls.find((c) => c[2] === 'grammar');
    expect(grammarCall).toBeDefined();
    expect(grammarCall![0]).toBeGreaterThan(0);

    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    expect(setStats).toHaveBeenCalled();
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('reflexive');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['reflexive']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has reflexive', async () => {
    const { default: ReflexiveScreen } =
      await import('../components/practice/exercises/ReflexiveScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['reflexive']);

    render(
      <StatsProvider value={value}>
        <ReflexiveScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    const quizTab = screen
      .queryAllByRole('button')
      .find((b) => /^Quiz$/i.test((b as HTMLElement).textContent?.trim() ?? ''));
    if (quizTab) fireEvent.click(quizTab);

    clickAllGrayOptionButtons('rgb(231, 229, 228)');

    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
