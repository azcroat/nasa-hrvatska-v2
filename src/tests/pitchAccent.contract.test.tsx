/**
 * PitchAccentScreen — behavioral contract test (Pattern X)
 *
 * With a 1-item PITCH_ACCENT pool, click any accent type button → click
 * "See Results" → click "Finish" to fire the contract.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  H: () => null,
  Bar: () => null,
  Spk: () => null,
}));

vi.mock('../hooks/useGrammar', () => ({
  useGrammar: () => ({
    grammar: {
      PADEZI: {},
      GRAM: {},
      CONJ: {},
      MODAL: {},
      TENSES: {},
      ASPECT: {},
      ASPECT_PAIRS: [],
      CONDITIONAL: {},
      FORMAL_REGISTER: {},
      IMPERSONAL: {},
      PHONOLOGY: {},
      PITCH_ACCENT: [
        { hr: 'ja', en: 'I', type: 'kratkosilazni', mark: 'jȁ', tip: 'short falling on a' },
      ],
      PADEZI_FULL: {},
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

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

describe('PitchAccentScreen contract (Pattern X)', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award(grammar), markQuest(grammar), gc+1/vs:pitch-accent, writeDelta on Finish', async () => {
    const { default: PitchAccentScreen } = await import('../components/practice/PitchAccentScreen');
    const { value, setStats, writeDelta, award } = makeCtx();

    render(
      <StatsProvider value={value}>
        <PitchAccentScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('Short Falling'));
    fireEvent.click(screen.getByText(/See Results/));
    fireEvent.click(screen.getByText('Finish'));

    expect(award).toHaveBeenCalledOnce();
    const [xp, , activityType] = award.mock.calls[0] as [number, boolean, string];
    expect(xp).toBeGreaterThan(0);
    expect(activityType).toBe('grammar');

    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const updater = setStats.mock.calls[0]![0] as (prev: Stats) => Stats;
    const next = updater({ ...value.stats });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('pitch-accent');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['pitch-accent']) }),
    );
  });

  it('is idempotent — skips setStats/writeDelta when vs already has pitch-accent', async () => {
    const { default: PitchAccentScreen } = await import('../components/practice/PitchAccentScreen');
    const { value, setStats, writeDelta, award } = makeCtx(['pitch-accent']);

    render(
      <StatsProvider value={value}>
        <PitchAccentScreen goBack={vi.fn()} award={award} />
      </StatsProvider>,
    );

    fireEvent.click(screen.getByText('Short Falling'));
    fireEvent.click(screen.getByText(/See Results/));
    fireEvent.click(screen.getByText('Finish'));

    expect(award).toHaveBeenCalled();
    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });
});
