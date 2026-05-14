/**
 * matchGame.contract.test.tsx — Pattern X (behavioral)
 *
 * MatchGame fires its contract after ALL pairs are matched. The cards are
 * role="button" divs in pairs (hr/en). With rnd()=0.9999 sh() is identity, so
 * initPool order is stable. We pair each card by its `p` property (pair ID).
 *
 * Driving: click card[0] (hr), then card[1] (en) → pair matched. Repeat for all
 * mp.length/2 pairs. After the last pair, award/markQuest fire inside a 500ms
 * setTimeout — we wait with waitFor.
 *
 * MatchGame tag: 'match'
 * markQuest('vocab')
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

vi.mock('../lib/knightSpeak.js', () => ({
  knightSpeak: vi.fn(),
  knightFlash: vi.fn(),
}));

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    speak: vi.fn(),
    H: (_t: string, _s: string, goBack: () => void) =>
      React.createElement('button', { onClick: goBack, 'data-testid': 'back-btn' }, '←'),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'bar', 'data-v': v, 'data-mx': mx }),
  };
});

function makeCtx() {
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
    vs: [],
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

/** Minimal pool: 2 pairs → 4 cards. pair id p=0: hr "pas"/en "dog"; p=1: hr "mačka"/en "cat" */
const POOL = [
  { id: 0, p: 0, tp: 'hr', t: 'pas' },
  { id: 1, p: 0, tp: 'en', t: 'dog' },
  { id: 2, p: 1, tp: 'hr', t: 'mačka' },
  { id: 3, p: 1, tp: 'en', t: 'cat' },
];

import MatchGame from '../components/practice/MatchGame';

describe('MatchGame contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest(vocab), setStats gc+1/vs:match, writeDelta on completion', async () => {
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <MatchGame initPool={POOL} goBack={goBack} award={award} />
      </StatsProvider>,
    );

    // Match pair 0: click hr card "pas", then en card "dog"
    fireEvent.click(screen.getByText('pas'));
    fireEvent.click(screen.getByText('dog'));

    // Match pair 1: click hr card "mačka", then en card "cat"
    fireEvent.click(screen.getByText('mačka'));
    fireEvent.click(screen.getByText('cat'));

    // Award fires in a 500ms setTimeout — wait for it
    await waitFor(() => expect(award).toHaveBeenCalled(), { timeout: 5000 });

    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
    expect(award.mock.calls[0]![2]).toBe('vocabulary');

    expect(markQuestMock).toHaveBeenCalledWith('vocab');

    expect(setStats).toHaveBeenCalled();
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const prev = { ...value.stats, gc: 5, vs: ['other'] };
    const result = updater(prev);
    expect(result.gc).toBe(6);
    expect(result.vs).toContain('match');

    expect(writeDelta).toHaveBeenCalledWith({ gc: 1, vs: ['match'] });
  });

  it('does NOT double-increment when vs already contains "match"', async () => {
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
      vs: ['match'],
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
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <MatchGame initPool={POOL} goBack={goBack} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('pas'));
    fireEvent.click(screen.getByText('dog'));
    fireEvent.click(screen.getByText('mačka'));
    fireEvent.click(screen.getByText('cat'));

    await waitFor(() => expect(award).toHaveBeenCalled(), { timeout: 5000 });

    // writeDelta should NOT be called with 'match' again when vs already contains it
    const matchDeltas = writeDelta.mock.calls.filter(
      (c) => Array.isArray(c[0]?.vs) && c[0].vs.includes('match'),
    );
    expect(matchDeltas.length).toBe(0);
  });
});
