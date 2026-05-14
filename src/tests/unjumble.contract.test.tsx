/**
 * Unjumble — direct contract test (Pattern X)
 *
 * With rnd()=0.9999, sh() preserves original word order. Each question's
 * shuffled words are in their original order, so clicking all word buttons
 * in sequence builds the correct sentence. Flow per question:
 *   1. Click all word tile buttons (builds ujIn string)
 *   2. Click "Check ✅"
 *   3. Click "Next →" or "Finish!"
 * After the last question the completion screen shows "Continue →" which fires
 * the contract.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

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

describe('Unjumble contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest(grammar), setStats gc+1/vs:unjumble, writeDelta', async () => {
    const { default: Unjumble } = await import('../components/practice/Unjumble');
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <Unjumble goBack={goBack} award={award} />
      </StatsProvider>,
    );

    for (let i = 0; i < 500; i++) {
      if (award.mock.calls.length > 0) break;

      const allBtns = screen.queryAllByRole('button');

      // Priority 1: "Continue →" on completion screen (fires contract)
      const continueBtn = allBtns.find((b) =>
        /continue/i.test((b as HTMLElement).textContent || ''),
      );
      if (continueBtn) {
        fireEvent.click(continueBtn);
        break;
      }

      // Priority 2: "Finish!" or "Next →" advance buttons
      const advanceBtn = allBtns.find((b) =>
        /finish!|next →/i.test((b as HTMLElement).textContent || ''),
      );
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
        continue;
      }

      // Priority 3: "Check ✅" button
      const checkBtn = allBtns.find((b) => /check/i.test((b as HTMLElement).textContent || ''));
      if (checkBtn) {
        fireEvent.click(checkBtn);
        continue;
      }

      // Priority 4: word tile buttons (short Croatian words in the word bank)
      // Filter out navigation/action buttons
      const wordBtn = allBtns.find((b) => {
        const text = (b as HTMLElement).textContent?.trim() ?? '';
        return text.length > 0 && !/^(back|clear|check|←|→|word order)/i.test(text);
      });
      if (wordBtn) {
        fireEvent.click(wordBtn);
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
    expect(next.vs).toContain('unjumble');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['unjumble']) }),
    );
  });
});
