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

async function completeDrill(awardMock: ReturnType<typeof vi.fn>, completionOverride?: () => void) {
  for (let i = 0; i < 300; i++) {
    // Award fired means we reached the done screen and the contract was executed.
    if (awardMock.mock.calls.length > 0) break;

    // If a per-drill override is supplied, delegate to it each iteration.
    if (completionOverride) {
      completionOverride();
      continue;
    }

    // Priority 0: click a menu tile (div.tc) for drills that start with a mode-select screen
    // e.g. ConjugationDrill shows tense tiles before the quiz begins.
    const menuTile = document.querySelector('.tc') as HTMLElement | null;
    if (menuTile) {
      fireEvent.click(menuTile);
      continue;
    }

    const allButtons = screen.queryAllByRole('button');

    // Priority 1: click "Next ->", "See results", "done", or "finish" when visible.
    // "Finish!" is the completion CTA on ConjugationDrill's results screen.
    const advanceBtn = allButtons.find((b) =>
      /next|see results|done|finish/i.test((b as HTMLElement).textContent || ''),
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

// AspectDrillScreen: option buttons use inline styles only (no .ob class).
// completionOverride clicks the first non-advance button to answer, then advances.
function makeAspectOverride(awardMock: ReturnType<typeof vi.fn>) {
  return () => {
    if (awardMock.mock.calls.length > 0) return;
    const allButtons = screen.queryAllByRole('button');
    // Priority 1: advance / finish buttons.
    const advanceBtn = allButtons.find((b) =>
      /next|see results|done|finish/i.test((b as HTMLElement).textContent || ''),
    );
    if (advanceBtn) {
      fireEvent.click(advanceBtn);
      return;
    }
    // Priority 2: first non-nav, non-reference button (the answer options).
    // Exclude: the H() back button ("Back"), "6 Rules", "Mistakes", "Back to Drill".
    const answerBtn = allButtons.find((b) => {
      const text = ((b as HTMLElement).textContent || '').trim();
      return (
        !/^back$|6 rules|mistakes|back to drill|show.*rule|hide.*rule/i.test(text) &&
        !(b as HTMLButtonElement).disabled
      );
    });
    if (answerBtn) {
      fireEvent.click(answerBtn);
    }
  };
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
  { name: 'GenitiveDrill', path: '../components/practice/GenitiveDrill', vsTag: 'genitive' },
  { name: 'NominativeDrill', path: '../components/practice/NominativeDrill', vsTag: 'nominative' },
  { name: 'LocativeDrill', path: '../components/practice/LocativeDrill', vsTag: 'locative' },
  { name: 'AccusativeDrill', path: '../components/practice/AccusativeDrill', vsTag: 'accusative' },
  {
    name: 'ConjugationDrill',
    path: '../components/practice/ConjugationDrill',
    vsTag: 'conjugation',
  },
  {
    // Partial-completion pattern: vi.doMock overrides ASPECT_PAIRS with a 1-pair
    // fixture so the drill completes after 4 questions (1 pair x 4 phases) instead
    // of 100 (25 pairs x 4 phases). The real completion code path still executes.
    // Override needed: answer buttons use inline styles (no .ob class).
    name: 'AspectDrillScreen',
    path: '../components/practice/AspectDrillScreen',
    vsTag: 'aspect',
    useOverride: true,
    aspectMock: true,
  },
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
    const testFn = (drill as { skip?: boolean }).skip ? it.skip : it;
    testFn(`${drill.name} follows the contract`, async () => {
      // AspectDrillScreen: mock grammar module to inject 1-pair fixture so the
      // drill completes after 4 questions instead of 100 (CI timeout fix).
      // vi.resetModules() busts the module cache so doMock takes effect; we
      // then re-import StatsProvider from the fresh registry to avoid the
      // "useStats must be within StatsProvider" mismatch (different context objects).
      let ComponentToRender: React.ComponentType<{
        goBack: () => void;
        award?: (...args: unknown[]) => void;
      }>;
      let ProviderToRender: React.ComponentType<{
        value: StatsContextValue;
        children: React.ReactNode;
      }>;
      if ((drill as { aspectMock?: boolean }).aspectMock) {
        const ONE_PAIR_FIXTURE = [
          {
            impf: 'pisati',
            pf: 'napisati',
            en: 'to write',
            rule: 'na- prefix marks completion',
            ctx: 'Svaki dan pišem pisma. / Napisao sam pismo majci.',
            cefr: 'B1',
          },
        ];
        vi.resetModules();
        vi.doMock('../data/grammar.js', async () => {
          const actual = await vi.importActual<Record<string, unknown>>('../data/grammar.js');
          return { ...actual, ASPECT_PAIRS: ONE_PAIR_FIXTURE };
        });
        const [compMod, ctxMod] = await Promise.all([
          import(/* @vite-ignore */ drill.path),
          import('../context/StatsContext'),
        ]);
        ComponentToRender = compMod.default;
        ProviderToRender = ctxMod.StatsProvider as React.ComponentType<{
          value: StatsContextValue;
          children: React.ReactNode;
        }>;
      } else {
        const mod = await import(/* @vite-ignore */ drill.path);
        ComponentToRender = mod.default;
        ProviderToRender = StatsProvider;
      }

      const { value, setStats, writeDelta, award } = makeCtx();
      const goBack = vi.fn();

      render(
        <ProviderToRender value={value}>
          <ComponentToRender goBack={goBack} award={award} />
        </ProviderToRender>,
      );

      const override = (drill as { useOverride?: boolean }).useOverride
        ? makeAspectOverride(award)
        : undefined;
      await completeDrill(award, override);

      if ((drill as { aspectMock?: boolean }).aspectMock) {
        vi.doUnmock('../data/grammar.js');
        vi.resetModules();
      }

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
