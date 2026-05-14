/**
 * znamGame.contract.test.tsx — Pattern X (behavioral)
 *
 * ZnamGame shows sections. We click section 0, answer all its sentences
 * (clicking the first .ob button = correct answer with identity shuffle),
 * then click "See Results" on the last question.
 *
 * Tag: 'znam'
 * markQuest('vocab')
 * award(5, false, 'vocabulary') per correct answer
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

import ZnamGame from '../components/practice/ZnamGame';

describe('ZnamGame contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires markQuest(vocab), setStats gc+1/vs:znam, writeDelta on completion', async () => {
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    const { container } = render(
      <StatsProvider value={value}>
        <ZnamGame goBack={goBack} award={award} />
      </StatsProvider>,
    );

    // Click first section tile to start quiz
    const sectionTiles = container.querySelectorAll('.tc');
    expect(sectionTiles.length).toBeGreaterThan(0);
    fireEvent.click(sectionTiles[0]!);

    // Drive all questions: click first answer button, then Next/See Results
    for (let i = 0; i < 300; i++) {
      if (markQuestMock.mock.calls.length > 0) break;

      // Check for Next/See Results button first
      const advanceBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
        continue;
      }

      // Otherwise click first .ob button (answer option)
      const optBtn = container.querySelector('button.ob');
      if (optBtn) {
        fireEvent.click(optBtn);
        continue;
      }

      break;
    }

    await waitFor(() => expect(markQuestMock).toHaveBeenCalled(), { timeout: 5000 });

    expect(markQuestMock).toHaveBeenCalledWith('vocab');

    expect(setStats).toHaveBeenCalled();
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const prev = { ...value.stats, gc: 5, vs: ['other'] };
    const result = updater(prev);
    expect(result.gc).toBe(6);
    expect(result.vs).toContain('znam');

    expect(writeDelta).toHaveBeenCalledWith({ gc: 1, vs: ['znam'] });
  });

  it('does NOT double-increment when vs already contains "znam"', async () => {
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
      vs: ['znam'],
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

    const { container } = render(
      <StatsProvider value={value}>
        <ZnamGame goBack={goBack} award={award} />
      </StatsProvider>,
    );

    const sectionTiles = container.querySelectorAll('.tc');
    fireEvent.click(sectionTiles[0]!);

    for (let i = 0; i < 300; i++) {
      const advanceBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
        continue;
      }
      const optBtn = container.querySelector('button.ob');
      if (optBtn) {
        fireEvent.click(optBtn);
        continue;
      }
      break;
    }

    // Give time for any completion logic
    await new Promise((r) => setTimeout(r, 200));

    const matchDeltas = writeDelta.mock.calls.filter(
      (c) => Array.isArray(c[0]?.vs) && c[0].vs.includes('znam'),
    );
    expect(matchDeltas.length).toBe(0);
  });
});
