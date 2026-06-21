/**
 * futureTense.contract.test.tsx — Pattern X
 *
 * FutureTenseScreen fires the contract when all 20 quiz questions are answered.
 * We snapshot all unanswered (gray-border) option buttons upfront, then click
 * one per question by stepping through every Nth button.
 * handledRef prevents double-counting on re-clicks.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

// Controllable rnd so the freshness regression test can vary the shuffle.
// Defaults to 0.9999 (identity shuffle) so the existing contract tests are
// unaffected — they don't depend on order.
const rndCtl = vi.hoisted(() => ({ v: 0.9999 }));
vi.mock('../lib/random.js', () => ({ rnd: () => rndCtl.v }));

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

/**
 * Click all option buttons with the initial gray border.
 * Snapshot them BEFORE clicking so later color changes don't interfere.
 * handledRef inside the component prevents double-counting per question.
 */
function clickAllGrayOptionButtons(): void {
  const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
  const grayBtns = btns.filter((b) =>
    (b.getAttribute('style') ?? '').includes('rgb(214, 211, 209)'),
  );
  grayBtns.forEach((b) => fireEvent.click(b));
}

describe('FutureTenseScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
    rndCtl.v = 0.9999; // identity shuffle by default
  });

  it('fires award, markQuest(grammar), setStats gc+1/vs:future-tense, writeDelta', async () => {
    const { default: FutureTenseScreen } =
      await import('../components/practice/exercises/FutureTenseScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <FutureTenseScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    clickAllGrayOptionButtons();

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
    expect(next.vs).toContain('future-tense');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['future-tense']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has future-tense', async () => {
    const { default: FutureTenseScreen } =
      await import('../components/practice/exercises/FutureTenseScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['future-tense']);

    render(
      <StatsProvider value={value}>
        <FutureTenseScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    clickAllGrayOptionButtons();

    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });

  it('REGRESSION: shuffles question order fresh per mount (was frozen by shMemo cache)', async () => {
    const { default: FutureTenseScreen } =
      await import('../components/practice/exercises/FutureTenseScreen');
    const { value } = makeCtx();
    const orderNow = () =>
      Array.from(document.querySelectorAll('[data-testid="ftq-prompt"]')).map((e) => e.textContent);

    rndCtl.v = 0.12;
    const first = render(
      <StatsProvider value={value}>
        <FutureTenseScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    const order1 = orderNow();
    first.unmount();

    rndCtl.v = 0.87;
    render(
      <StatsProvider value={value}>
        <FutureTenseScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    const order2 = orderNow();

    expect(order1.length).toBeGreaterThan(2);
    expect(order2.length).toBe(order1.length);
    // Different rnd regimes must yield different orders. The old shMemo('fq')
    // module cache froze the order identically regardless of rnd — that bug
    // would make these arrays equal.
    expect(order2).not.toEqual(order1);
  });
});
