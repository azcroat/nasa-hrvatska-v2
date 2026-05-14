/**
 * AspectDrillScreen contract test — isolated file.
 *
 * Isolation strategy: vi.mock('../data') replaces the data barrel so that
 * ASPECT_PAIRS contains exactly 1 pair. AspectDrillScreen completes after
 * 4 questions (1 pair × 4 phases) instead of 100 (25 pairs × 4 phases).
 * Because this mock lives in its own file, it never affects other test files.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

// ─── Freeze shuffle so opts[0] is always the answer ──────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

// ─── 1-pair fixture via data barrel mock ─────────────────────────────────────
// We re-export everything else verbatim so sub-components (H, Bar, sh, …) work.
vi.mock('../data', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const real = (await importOriginal()) as any;
  return {
    ...real,
    ASPECT_PAIRS: [
      {
        impf: 'pisati',
        pf: 'napisati',
        en: 'to write',
        rule: 'na- prefix marks completion',
        ctx: 'Svaki dan pišem pisma. / Napisao sam pismo majci.',
        cefr: 'B1',
      },
    ],
  };
});

// ─── Quest mock ──────────────────────────────────────────────────────────────
const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx() {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const dispatch = vi.fn();
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
  const value: StatsContextValue = { stats, setStats, writeDelta, dispatch, award, level: 1 };
  return { value, setStats, writeDelta, award };
}

/**
 * Drive AspectDrillScreen to completion.
 *
 * AspectDrillScreen option buttons use inline styles (no .ob class), so the
 * generic completeDrill helper from exerciseContract.test.tsx cannot click them.
 * This override clicks:
 *   1. Advance/finish buttons ("Next", "See results", "Finish") when visible.
 *   2. The first non-nav answer button otherwise (excludes "Back", "6 Rules",
 *      "Mistakes", "Back to Drill").
 */
function driveAspectDrill(awardMock: ReturnType<typeof vi.fn>) {
  for (let i = 0; i < 300; i++) {
    if (awardMock.mock.calls.length > 0) break;

    const allButtons = screen.queryAllByRole('button');

    // Priority 1: advance / finish buttons.
    const advanceBtn = allButtons.find((b) =>
      /next|see results|done|finish/i.test((b as HTMLElement).textContent || ''),
    );
    if (advanceBtn) {
      fireEvent.click(advanceBtn);
      continue;
    }

    // Priority 2: first non-nav, non-reference answer button.
    const answerBtn = allButtons.find((b) => {
      const text = ((b as HTMLElement).textContent || '').trim();
      return (
        !/^back$|6 rules|mistakes|back to drill|show.*rule|hide.*rule/i.test(text) &&
        !(b as HTMLButtonElement).disabled
      );
    });
    if (answerBtn) {
      fireEvent.click(answerBtn);
      continue;
    }

    break; // safety — no recognisable button found
  }
}

// ─── Contract test ────────────────────────────────────────────────────────────

describe('AspectDrillScreen contract', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('AspectDrillScreen follows the contract', async () => {
    const { default: AspectDrillScreen } = await import('../components/practice/AspectDrillScreen');

    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <AspectDrillScreen goBack={goBack} award={award} />
      </StatsProvider>,
    );

    driveAspectDrill(award);

    // award(xp: number, celebrate: boolean, activityType: string)
    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
    expect(award.mock.calls[0]![2]).toBe('grammar');

    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    // Verify the setStats updater correctly increments gc and appends 'aspect'.
    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const setStatsUpdater = setStats.mock.calls[0]![0] as (
      prev: StatsContextValue['stats'],
    ) => StatsContextValue['stats'];
    const updatedStats = setStatsUpdater(value.stats);
    expect(updatedStats.gc).toBe(1);
    expect(updatedStats.vs).toContain('aspect');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['aspect']) }),
    );
  });
});
