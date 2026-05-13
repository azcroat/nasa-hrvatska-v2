import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

// Freeze Fisher-Yates shuffle so opts[0] stays in place (no swaps occur).
// In every DATA item, answer === opts[0]. With rnd() returning 0.9999,
// Math.floor(0.9999 * (i+1)) === i for every i, so each swap is a no-op.
vi.mock('../lib/random.js', () => ({
  rnd: () => 0.9999,
}));

const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

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

async function completeDrill(awardMock: ReturnType<typeof vi.fn>) {
  for (let i = 0; i < 100; i++) {
    // Award fired means we reached the done screen and the contract was executed.
    if (awardMock.mock.calls.length > 0) break;

    const allButtons = screen.queryAllByRole('button');

    // Priority 1: click "Next ->" or "See results" when visible (post-answer state).
    const advanceBtn = allButtons.find((b) =>
      /next|see results|done/i.test((b as HTMLElement).textContent || ''),
    );
    if (advanceBtn) {
      fireEvent.click(advanceBtn);
      continue;
    }

    // Priority 2: click the first option button (className "ob") — with rnd()===0
    // Fisher-Yates doesn't swap, so opts[0] === answer for every question.
    const optionBtn = allButtons.find(
      (b) => (b as HTMLElement).className.includes('ob') && !(b as HTMLButtonElement).disabled,
    );
    if (optionBtn) {
      fireEvent.click(optionBtn);
      continue;
    }

    // Safety: no recognised button found — break to avoid infinite loop.
    break;
  }
}

// Drills that fully conform to the gold contract (award + markQuest + setStats + writeDelta with vs).
const FULL_CONTRACT_DRILLS = [
  {
    name: 'InstrumentalDrill',
    path: '../components/practice/InstrumentalDrill',
    vsTag: 'instrumental',
  },
  { name: 'PassiveDrill', path: '../components/practice/PassiveDrill', vsTag: 'passive' },
  { name: 'CliticDrill', path: '../components/practice/CliticDrill', vsTag: 'clitic' },
  { name: 'ImperativeDrill', path: '../components/practice/ImperativeDrill', vsTag: 'imperative' },
  {
    name: 'NegationGenDrill',
    path: '../components/practice/NegationGenDrill',
    vsTag: 'negationgen',
  },
  { name: 'PrepDrill', path: '../components/practice/PrepDrill', vsTag: 'preposition' },
];

describe('Exercise Contract -- gold-pattern drills', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('DativeDrill follows the contract', async () => {
    const { default: DativeDrill } = await import('../components/practice/DativeDrill');
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <DativeDrill goBack={goBack} award={award} />
      </StatsProvider>,
    );

    await completeDrill(award);

    // award(xp: number, celebrate: boolean, activityType: string)
    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
    expect(award.mock.calls[0]![2]).toBe('grammar');

    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    expect(setStats).toHaveBeenCalled();

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['dative']) }),
    );
  });

  for (const drill of FULL_CONTRACT_DRILLS) {
    it(`${drill.name} follows the contract`, async () => {
      const mod = await import(/* @vite-ignore */ drill.path);
      const Component = mod.default;
      const { value, setStats, writeDelta, award } = makeCtx();
      const goBack = vi.fn();

      render(
        <StatsProvider value={value}>
          <Component goBack={goBack} award={award} />
        </StatsProvider>,
      );

      await completeDrill(award);

      expect(award).toHaveBeenCalledTimes(1);
      expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
      expect(award.mock.calls[0]![2]).toBe('grammar');
      expect(markQuestMock).toHaveBeenCalledWith('grammar');
      expect(setStats).toHaveBeenCalled();
      expect(writeDelta).toHaveBeenCalledWith(
        expect.objectContaining({ gc: 1, vs: expect.arrayContaining([drill.vsTag]) }),
      );
    });
  }
});
