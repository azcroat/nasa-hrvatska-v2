/**
 * ClozeEngine — direct contract test (Pattern X)
 *
 * With rnd()=0.9999 Fisher-Yates produces no swaps, so the option buttons
 * appear in their original order and opts[0] is always the correct blank word.
 * We drive all 12 questions: click "Next →" or "See Results →" when visible,
 * otherwise click the first non-navigation button (the answer option).
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

vi.mock('../lib/apiFetch.js', () => ({ apiFetch: vi.fn(() => Promise.resolve({ ok: false })) }));

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

// Known non-option button texts (full or prefix match)
const NAV_TEXTS = /^(Back|←|🔘|💡|🔊|Play|Listen|Explain|Retry|Play Again|←\s*Back|See Results)/i;

describe('ClozeEngine contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest(grammar), setStats gc+1/vs:cloze, writeDelta', async () => {
    const { default: ClozeEngine } = await import('../components/practice/ClozeEngine');
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <ClozeEngine goBack={goBack} award={award} />
      </StatsProvider>,
    );

    for (let i = 0; i < 300; i++) {
      if (award.mock.calls.length > 0) break;

      const allBtns = screen.queryAllByRole('button');

      // Priority 1: advance buttons (Next / See Results)
      const advanceBtn = allBtns.find((b) =>
        /next →|see results/i.test((b as HTMLElement).textContent || ''),
      );
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
        continue;
      }

      // Priority 2: first option button (not a navigation/utility button)
      const optionBtn = allBtns.find((b) => {
        const text = (b as HTMLElement).textContent?.trim() ?? '';
        return text.length > 0 && !NAV_TEXTS.test(text);
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
    expect(next.vs).toContain('cloze');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['cloze']) }),
    );
  });
});
