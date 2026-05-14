/**
 * VerbDrillScreen — direct contract test (Pattern X)
 *
 * Flow:
 *   1. Click "✏️ Test Your Conjugation →" to enter quiz mode
 *   2. Click first option button per question (correct answer with rnd=0.9999)
 *   3. Click "Next →" / "See Results"
 *   Contract fires automatically when all questions are answered.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

// Block the real TTS pipeline — under parallel test load, real fetch() calls
// from speak() starve the event loop and the polling driver times out.
vi.mock('../data', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, speak: vi.fn() };
});

vi.mock('../lib/srs.js', () => ({ addWordToSRS: vi.fn() }));
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));

const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

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

describe('VerbDrillScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it(
    'fires award, markQuest(grammar), setStats gc+1/vs:verb-drill, writeDelta',
    { timeout: 60000 },
    async () => {
      const { default: VerbDrillScreen } =
        await import('../components/practice/exercises/VerbDrillScreen');
      const { value, setStats, writeDelta, award } = makeCtx();
      const goBack = vi.fn();

      render(
        <StatsProvider value={value}>
          <VerbDrillScreen goBack={goBack} award={award} />
        </StatsProvider>,
      );

      // Step 1: enter quiz mode from reference screen
      const startBtn = screen
        .queryAllByRole('button')
        .find((b) => /conjugation/i.test((b as HTMLElement).textContent || ''));
      if (startBtn) fireEvent.click(startBtn);

      for (let i = 0; i < 300; i++) {
        if (award.mock.calls.length > 0) break;

        const allBtns = screen.queryAllByRole('button');

        // Priority 1: Next / See Results
        const advanceBtn = allBtns.find((b) =>
          /next →|see results/i.test((b as HTMLElement).textContent || ''),
        );
        if (advanceBtn) {
          fireEvent.click(advanceBtn);
          continue;
        }

        // Priority 2: verb conjugation option (short Croatian word form)
        // Skip Back/Reference navigation buttons
        const optionBtn = allBtns.find((b) => {
          const text = (b as HTMLElement).textContent?.trim() ?? '';
          return text.length > 0 && !/back|reference|←|→|conjugation/i.test(text);
        });
        if (optionBtn) {
          fireEvent.click(optionBtn);
          continue;
        }

        break;
      }

      expect(award).toHaveBeenCalledOnce();
      const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
      expect(xp).toBeGreaterThan(0);
      expect(activityType).toBe('grammar');

      expect(markQuestMock).toHaveBeenCalledWith('grammar');

      expect(setStats).toHaveBeenCalledWith(expect.any(Function));
      const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
      const next = updater({ ...value.stats });
      expect(next.gc).toBe(1);
      expect(next.vs).toContain('verb-drill');

      expect(writeDelta).toHaveBeenCalledWith(
        expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['verb-drill']) }),
      );
    },
  );
});
