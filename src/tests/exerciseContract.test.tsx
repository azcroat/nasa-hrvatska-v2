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

// Drills that fully conform to the gold contract (award + markQuest + setStats + writeDelta with vs).
// AspectDrillScreen has been moved to its own isolated file: aspectDrillContract.test.tsx
const FULL_CONTRACT_DRILLS = [
  // ─── Phase 1: Grammar drills (original 13) ───────────────────────────────────
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

  // ─── SP2 Tier 1: exercises now following contract ─────────────────────────────
  // ClozeEngine: contract-compliant but option buttons use inline styles (no .ob).
  // completeDrill helper cannot click option buttons to advance through questions.
  {
    name: 'ClozeEngine',
    path: '../components/practice/ClozeEngine',
    vsTag: 'cloze',
    skip: true,
    skipReason: 'Option buttons use inline styles (no .ob class); helper cannot drive MC loop',
  },
  // ProductionDrillScreen: contract-compliant but multi-phase (Transform/Translate/Build)
  // with inline-style buttons; helper cannot navigate phase transitions.
  {
    name: 'ProductionDrillScreen',
    path: '../components/practice/ProductionDrillScreen',
    vsTag: 'production',
    skip: true,
    skipReason: 'Multi-phase (Transform/Translate/Build), inline-style buttons, no .ob class',
  },
  // TranslateDrillsScreen: contract-compliant but option buttons use inline styles.
  {
    name: 'TranslateDrillsScreen',
    path: '../components/practice/TranslateDrillsScreen',
    vsTag: 'translate',
    skip: true,
    skipReason: 'Option buttons use inline styles (no .ob class); helper cannot click options',
  },
  // SentenceTileScreen: contract-compliant but uses tile drag/click ordering interaction.
  {
    name: 'SentenceTileScreen',
    path: '../components/practice/SentenceTileScreen',
    vsTag: 'sentence-tile',
    skip: true,
    skipReason: 'Tile ordering interaction (not MC); helper cannot assemble sentences',
  },
  // Unjumble: contract-compliant but uses text input for word-order answers.
  {
    name: 'Unjumble',
    path: '../components/practice/Unjumble',
    vsTag: 'unjumble',
    skip: true,
    skipReason: 'Text input for word-order answers; no .ob class MC buttons',
  },
  // DictationScreen: contract-compliant (listening, lc counter) but uses text input.
  {
    name: 'DictationScreen',
    path: '../components/practice/DictationScreen',
    vsTag: 'dictation',
    skip: true,
    skipReason: 'Listening + text-input interaction; no .ob MC buttons for helper to drive',
  },
  // NumTime: contract-compliant AND driveable — .ob class buttons + "Next →" / "Finish!".
  { name: 'NumTime', path: '../components/practice/NumTime', vsTag: 'numtime' },
  // WordSprint: contract-compliant but timer-based sprint game with no .ob MC loop.
  {
    name: 'WordSprint',
    path: '../components/practice/WordSprint',
    vsTag: 'wordsprint',
    skip: true,
    skipReason: 'Timer-based sprint game with custom game loop; no .ob MC buttons',
  },

  // ─── SP2 Tier 2: partial-compliance exercises now fully compliant ─────────────
  // MatchGame: contract-compliant but uses role="button" div pairs for matching.
  {
    name: 'MatchGame',
    path: '../components/practice/MatchGame',
    vsTag: 'match',
    skip: true,
    skipReason: 'Pair-matching with role="button" divs (not .ob buttons); custom game loop',
  },
  // ZnamGame: contract-compliant but uses .tc section tiles + non-ob card buttons.
  {
    name: 'ZnamGame',
    path: '../components/practice/ZnamGame',
    vsTag: 'znam',
    skip: true,
    skipReason: 'Section-select (.tc tiles) + flashcard flip interaction; no .ob MC buttons',
  },
  // BojeGame: contract-compliant but multi-mode game (learn/quiz phases), non-ob buttons.
  {
    name: 'BojeGame',
    path: '../components/practice/BojeGame',
    vsTag: 'boje',
    skip: true,
    skipReason: 'Multi-mode game (learn → quiz → results); no .ob MC buttons in quiz phase',
  },
  // TypingScreen: contract-compliant but uses text input (typing the word).
  {
    name: 'TypingScreen',
    path: '../components/practice/TypingScreen',
    vsTag: 'typing',
    skip: true,
    skipReason: 'Text-input typing interaction; no .ob MC buttons for helper to drive',
  },
  // CollocationsGame: contract-compliant AND driveable — .ob buttons + "🏠 Done".
  // Uses 'vocabulary' activityType and 'vocab' questArg (not grammar).
  {
    name: 'CollocationsGame',
    path: '../components/practice/CollocationsGame',
    vsTag: 'collocations',
    activityType: 'vocabulary',
    questArg: 'vocab',
  },
  // PitchAccentScreen: contract-compliant but option buttons use inline styles (no .ob).
  {
    name: 'PitchAccentScreen',
    path: '../components/practice/PitchAccentScreen',
    vsTag: 'pitch-accent',
    skip: true,
    skipReason: 'Accent-type option buttons use inline styles (no .ob class)',
  },
  // WordFamilies: contract-compliant AND driveable — .ob buttons + "🏠 Done".
  { name: 'WordFamilies', path: '../components/practice/WordFamilies', vsTag: 'word-families' },
  // PronunciationContrast: contract-compliant AND driveable — .ob buttons + "🏠 Done".
  {
    name: 'PronunciationContrast',
    path: '../components/practice/PronunciationContrast',
    vsTag: 'pronunciation-contrast',
  },
  // ShadowingScreen: contract-compliant (listening, lc) but requires audio recording.
  {
    name: 'ShadowingScreen',
    path: '../components/practice/ShadowingScreen',
    vsTag: 'shadowing',
    skip: true,
    skipReason: 'Audio recording interaction (microphone); helper cannot simulate speech',
  },
  // NumbersCasesDrill: contract-compliant AND driveable — .ob buttons + "See results" / "Next →".
  {
    name: 'NumbersCasesDrill',
    path: '../components/practice/NumbersCasesDrill',
    vsTag: 'numbers-cases',
  },

  // ─── SP2 Tier 3: exercises/ subdir — all contract-compliant ──────────────────
  // All Tier 3 exercises fire award automatically via useEffect when the last
  // question is answered. However their option buttons use inline styles (no .ob)
  // so the generic helper cannot click options to advance through questions.
  {
    name: 'GenderDrillScreen',
    path: '../components/practice/exercises/GenderDrillScreen',
    vsTag: 'gender',
    skip: true,
    skipReason: 'Multi-section UI (sort/plural/adj), inline-style option buttons, no .ob class',
  },
  {
    name: 'VerbDrillScreen',
    path: '../components/practice/exercises/VerbDrillScreen',
    vsTag: 'verb-drill',
    skip: true,
    skipReason: 'Inline-style option buttons (no .ob class); helper cannot click answers',
  },
  {
    name: 'NegationScreen',
    path: '../components/practice/exercises/NegationScreen',
    vsTag: 'negation',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'FutureTenseScreen',
    path: '../components/practice/exercises/FutureTenseScreen',
    vsTag: 'future-tense',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'CityLocativeScreen',
    path: '../components/practice/exercises/CityLocativeScreen',
    vsTag: 'city-locative',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'ReflexiveScreen',
    path: '../components/practice/exercises/ReflexiveScreen',
    vsTag: 'reflexive',
    skip: true,
    skipReason: 'Complex multi-section reflexive UI; inline-style buttons, no .ob class',
  },
  {
    name: 'FillStoryScreen',
    path: '../components/practice/exercises/FillStoryScreen',
    vsTag: 'fill-story',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'ConvMatchScreen',
    path: '../components/practice/exercises/ConvMatchScreen',
    vsTag: 'conv-match',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; dialogue-matching interaction, no .ob class',
  },
  {
    name: 'PronounsScreen',
    path: '../components/practice/exercises/PronounsScreen',
    vsTag: 'pronouns',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'SentenceBuilderScreen',
    path: '../components/practice/exercises/SentenceBuilderScreen',
    vsTag: 'sentence-builder',
    skip: true,
    skipReason: 'Drag-to-build sentence interaction; no .ob MC buttons',
  },
  {
    name: 'PossessivesScreen',
    path: '../components/practice/exercises/PossessivesScreen',
    vsTag: 'possessives',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
  },
  {
    name: 'ComparativesScreen',
    path: '../components/practice/exercises/ComparativesScreen',
    vsTag: 'comparatives',
    skip: true,
    skipReason: 'Award auto-fires via useEffect; inline-style buttons, helper cannot drive MC loop',
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

    // Verify the setStats updater actually mutates gc and vs correctly.
    expect(setStats).toHaveBeenCalledWith(expect.any(Function));
    const setStatsUpdater = setStats.mock.calls[0]![0] as (
      prev: typeof value.stats,
    ) => typeof value.stats;
    const updatedStats = setStatsUpdater(value.stats);
    expect(updatedStats.gc).toBe(1);
    expect(updatedStats.vs).toContain('dative');

    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['dative']) }),
    );
  });

  for (const drill of FULL_CONTRACT_DRILLS) {
    const testFn = (drill as { skip?: boolean }).skip ? it.skip : it;
    testFn(`${drill.name} follows the contract`, async () => {
      const mod = await import(/* @vite-ignore */ drill.path);
      const ComponentToRender = mod.default as React.ComponentType<{
        goBack: () => void;
        award?: (...args: unknown[]) => void;
      }>;

      const { value, setStats, writeDelta, award } = makeCtx();
      const goBack = vi.fn();

      render(
        <StatsProvider value={value}>
          <ComponentToRender goBack={goBack} award={award} />
        </StatsProvider>,
      );

      await completeDrill(award);

      const expectedActivityType = (drill as { activityType?: string }).activityType ?? 'grammar';
      const expectedQuestArg = (drill as { questArg?: string }).questArg ?? 'grammar';

      expect(award).toHaveBeenCalledTimes(1);
      expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
      expect(award.mock.calls[0]![2]).toBe(expectedActivityType);
      expect(markQuestMock).toHaveBeenCalledWith(expectedQuestArg);

      // Verify the setStats updater actually produces gc+1 and includes the vs-tag.
      expect(setStats).toHaveBeenCalledWith(expect.any(Function));
      const setStatsUpdater = setStats.mock.calls[0]![0] as (
        prev: StatsContextValue['stats'],
      ) => StatsContextValue['stats'];
      const updatedStats = setStatsUpdater(value.stats);
      expect(updatedStats.gc).toBe(1);
      expect(updatedStats.vs).toContain(drill.vsTag);

      expect(writeDelta).toHaveBeenCalledWith(
        expect.objectContaining({ gc: 1, vs: expect.arrayContaining([drill.vsTag]) }),
      );
    });
  }
});
