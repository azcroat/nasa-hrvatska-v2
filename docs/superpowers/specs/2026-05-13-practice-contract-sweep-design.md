# Practice Contract Sweep — Sub-Project 2 Design

**Date:** 2026-05-13
**Author:** Claude Opus 4.7 (1M context), with jschr direction
**Status:** Pending user spec review

## Problem statement

Phase 1 of the Exercise Contract initiative (commits `0a19d93` through `9f01e84`) enforced an 8-clause contract on 13 grammar drills. The contract is documented in `docs/exercise-contract.md` and enforced by `src/tests/exerciseContract.test.tsx`.

The gold-standard audit (2026-05-13) revealed: of ~83 components in `src/components/practice/`, only 13 fully follow the contract (16%). The remaining 70 are inconsistent — some award XP per-click, some never award XP, some skip `markQuest`, some don't sync `vs:[]` to Firestore. This makes the practice module's quality uneven across the user experience.

Per user direction, this sub-project applies the contract to the ~30 most-trafficked non-grammar practice exercises (those reachable from the daily session pool or the Practice tab's main grid). Audit-rare or sub-component helpers stay out of scope.

## Goals

1. Apply the Exercise Contract (or its non-grammar variant per Phase 2's P2-1) to the 30 most-trafficked practice exercises.
2. Add each to the contract test suite where structurally feasible. Skip with documented reason where the structure prevents fitting the contract test helper (e.g., AspectDrill-style infinite-question patterns — already handled via the partial-completion test).
3. Establish a frozen list of "non-trafficked" exercises that explicitly do NOT need contract compliance (deep helper components, sub-panels of larger drills, debug screens).

## Success criteria

1. The list of 30 in-scope exercises is documented (this spec, §B).
2. Each in-scope exercise meets the 8-clause contract (or its non-grammar variant if not a graded MC drill).
3. The contract test suite (`src/tests/exerciseContract.test.tsx`) now references at least 25 of the 30 (the other 5 may be skipped with documented reason — same pattern as AspectDrill).
4. A `docs/exercise-contract.md` addition lists "explicitly out of scope" components so future contributors don't try to force the contract on them.

## Out of scope (Sub-Project 2)

- Grammar drills already covered in Phase 1 (DativeDrill, Instrumental, Passive, Clitic, Imperative, NegationGen, Preposition, Conjugation, Aspect, Genitive, Nominative, Locative, Accusative)
- The Phase 2 non-grammar fixes (Flashcards, Story, Listening, SRS Review, Speaking, Writing) — already done
- Authoring new exercises (only existing ones)
- UX redesign of any exercise (contract enforcement only, no behavior changes beyond completion semantics)

## A. The Exercise Contract — what's enforced

From `docs/exercise-contract.md`:

1. **Active testing** — N MC questions, graded; no "click to reveal"
2. **Single XP award on completion** — `award(score × MULTIPLIER, 'grammar')` once, idempotent
3. **`finishFired` guard**
4. **`markQuest('grammar')` or appropriate quest name**
5. **`setStats` with `gc++` and `vs:[caseName]` (or appropriate counter and tag)**
6. **`writeDelta({ gc: 1, vs: [tag] })` mirroring setStats**
7. **Final results screen**
8. **`markDone` integration via `goBack`**

For non-grammar exercises (per Phase 2 P2-1), the variant is:
- Replace `gc` with the appropriate counter (`lc` for reading/listening, `sc` for speaking, `rc` for review, none for writing)
- Replace `markQuest('grammar')` with the exercise's natural quest (`markQuest('review')`, `'speak'`, `'write'`, `'reading'`, `'listening'`)
- Replace `vs:['grammar-tag']` with the exercise type's tag (`vs:['srsreview']`, `'speaking'`, `'writing'`, etc.)

## B. The list of 30 in-scope exercises

Categorized by current contract compliance state.

### Tier 1 — currently no XP fire at all (highest priority — 8 exercises)

These exercises let users interact for minutes but award zero XP, breaking the completion psychology.

| # | File | Current state | Target |
|---|---|---|---|
| 1 | `ClozeEngine.tsx` | No award/markQuest; embedded in multiple parent drills | Add award + markQuest('grammar') + vs:['cloze'] on completion |
| 2 | `ProductionDrillScreen.tsx` | No award/markQuest visible | Add award + markQuest + vs:['production'] |
| 3 | `TranslateDrillsScreen.tsx` | No award visible | Add award + markQuest('translate') + vs:['translate'] |
| 4 | `SentenceTileScreen.tsx` | award guarded but no markQuest/vs | Add markQuest + writeDelta + vs:['sentence-tile'] |
| 5 | `Unjumble.tsx` | Per audit, finishFired exists but no markQuest/vs | Verify; add missing clauses |
| 6 | `DictationScreen.tsx` | Has finishFired (per remediation memory) but no vs:[]/writeDelta | Add markQuest + vs:['dictation'] + writeDelta |
| 7 | `NumTime.tsx` | Audit unclear; verify and add full contract | Full contract |
| 8 | `WordSprint.tsx` | Audit unclear; verify | Full contract or document as already-compliant |

### Tier 2 — partial compliance, missing 1-2 clauses (10 exercises)

| # | File | Likely missing | Action |
|---|---|---|---|
| 9 | `MatchGame.tsx` | Likely missing vs:[] or writeDelta | Audit + fix |
| 10 | `ZnamGame.tsx` | Same | Audit + fix |
| 11 | `BojeGame.tsx` | Per remediation memory had finishFired added; verify vs:[] + writeDelta | Audit + fix |
| 12 | `TypingScreen.tsx` | Per remediation memory: finishFired added; verify other clauses | Audit + fix |
| 13 | `CollocationsGame.tsx` | Per remediation memory: finishFired added | Audit + fix |
| 14 | `PitchAccentScreen.tsx` | Per remediation memory: finishFired added | Audit + fix |
| 15 | `WordFamilies.tsx` | Per remediation memory: finishFired added | Audit + fix |
| 16 | `PronunciationContrast.tsx` | Per remediation memory: finishFired added | Audit + fix |
| 17 | `ShadowingScreen.tsx` | Per remediation memory: finishFired added | Audit + fix |
| 18 | `NumbersCasesDrill.tsx` | Per remediation memory: award() was JSX-rendered bug fixed | Re-verify, add to contract test |

### Tier 3 — exercises in `practice/exercises/` subdirectory (12 exercises)

These were the parallel-implementation sub-set when contract wasn't yet a thing. Most likely partially compliant.

| # | File | Action |
|---|---|---|
| 19 | `exercises/GenderDrillScreen.tsx` | Audit; per audit was YES for award + gc but PARTIAL for quiz pattern |
| 20 | `exercises/VerbDrillScreen.tsx` | Audit; per audit was YES across board |
| 21 | `exercises/NegationScreen.tsx` | Audit; per audit award + markQuest YES but no vs:[] |
| 22 | `exercises/FutureTenseScreen.tsx` | Audit; per audit gc + markQuest YES |
| 23 | `exercises/CityLocativeScreen.tsx` | Audit; per audit YES across board |
| 24 | `exercises/ReflexiveScreen.tsx` | Audit |
| 25 | `exercises/FillStoryScreen.tsx` | Audit |
| 26 | `exercises/ConvMatchScreen.tsx` | Audit |
| 27 | `exercises/PronounsScreen.tsx` | Audit |
| 28 | `exercises/SentenceBuilderScreen.tsx` | Audit |
| 29 | `exercises/PossessivesScreen.tsx` | Audit |
| 30 | `exercises/ComparativesScreen.tsx` | Audit |

(Two more exist in `exercises/`: ColorAgreement, QuestionWords, Sibilarization, Restaurant, ProfessionGender, EmotionGender, RelativePronouns, Opposites, TenseFlip, Riddles, LogicQuiz, Ordinals, Scenes. They round out the directory but may not be in heavy daily-session rotation. Audit will reveal which 5-7 are most-trafficked.)

The 30 above are first-pass; during execution, the implementer may swap items if audit reveals (e.g.) MatchGame is fully compliant and Riddles is heavily used. The principle: cover the exercises that users actually hit, in priority order.

## C. The "explicitly out of scope" list (documentation)

Add this to `docs/exercise-contract.md` so future contributors don't waste time:

```markdown
## Components that do NOT need contract compliance

The following are sub-components, helper panels, or rarely-trafficked screens. Contract clauses do not apply.

### Drill sub-components (rendered inside parent drills)
- AspectPhaseBar, AspectQuestionPanel, AspectRuleCard, AspectTimeline
- DialogueAvatar, DialogueResultsScreen, DialogueTipContent
- DialogueGuidedMode, DialogueScenarioMenu, DialogueAiMode
- FlashcardCardBack, FlashcardCardFront, FlashcardEmptyState, FlashcardResultScreen, FlashcardRecallQuiz (the parent Flashcards.tsx is contract-compliant)
- McGameOver, McQuestionArea, McResult (parent McGame.tsx is contract-compliant)
- SprintCountdownScreen, SprintFeedbackPhase, SprintModelPhase, SprintSetupScreen, SprintSpeakingPhase (parent SpeakingSprintScreen is contract-compliant)
- SlangAgeGate, SlangEntryCard, SlangQuizPanel (parent SlangScreen wraps these)
- SpeakingPracticePanel, SpeakingSummaryScreen (parents handle contract)
- StoryScreens (parent GradedInputScreen is contract-compliant per Phase 2 P2-3)
- ListeningComprehensionScreen, ListeningPath (parent ListeningScreen is contract-compliant per Phase 2 P2-4)

### Debug / settings / non-exercise screens
- ReviewScreen → handled separately under P2-1
- AdaptiveReviewScreen → review mode, contract via parent
- MyWordsScreen, MistakesScreen → list views, not exercises
- PracticeTab → tab container, not an exercise
```

## D. Execution workflow

For each exercise (in tier order):

1. **Read the file** to determine current compliance state. Look for: `award()` call site and conditions; `markQuest()`; `setStats()` with `vs:[]`; `writeDelta()`; `finishFired` ref.
2. **Classify**: fully compliant / partially compliant / non-compliant.
3. **If non-compliant**: apply the canonical pattern from `DativeDrill.tsx:188-199` or the non-grammar variant from `bb3db8d` (SRS/Speaking/Writing fixes).
4. **Add to contract test** (`src/tests/exerciseContract.test.tsx`) if structurally feasible (drill has a clear completion path that the `completeDrill` helper can drive). Otherwise document why skipped and verify manually.
5. **Run the contract test** to confirm.
6. **Move to next exercise.**

Batch in commits: ~5-7 exercises per commit, grouped by similarity (e.g., one commit for sub-directory exercises tier 3, separate commit for the tier 1 zero-XP exercises).

## E. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Some exercises don't fit the MC contract (e.g., card games, drag-drop) | Apply non-grammar variant (counter + vs + markQuest + award), skip contract test, document why |
| Existing tests assume no setStats/writeDelta and break | Per-exercise test updates are part of each commit (pattern from Phase 1 prep-drill hotfix `3b15655`) |
| Subagent loses track of which exercises remain | Maintain a checklist in the plan file; cross off each as it lands |
| Multiple subagents in parallel cause conflicts | Sequential per subagent-driven-development rules; one exercise commit at a time |

## F. Acceptance checklist

- [ ] ~30 in-scope exercises audited and made contract-compliant (tier-by-tier)
- [ ] Contract test (`exerciseContract.test.tsx`) references 25+ exercises
- [ ] `docs/exercise-contract.md` updated with the "out of scope" list
- [ ] All existing tests pass; new per-exercise tests added where contract clauses changed
- [ ] CI green on each commit
- [ ] No regression in daily session activity routing
- [ ] No regression in XP awards for compliant exercises

## G. References

- Phase 1 spec: `docs/superpowers/specs/2026-05-13-exercise-contract-phase1-design.md`
- Phase 1 plan: `docs/superpowers/plans/2026-05-13-exercise-contract-phase1.md`
- Canonical compliance pattern: `src/components/practice/DativeDrill.tsx:188-199`
- Non-grammar variant: SHA `bb3db8d` (SRS/Speaking/Writing) and `c2d65dc` (Story comprehension)
- Memory: `feedback_root_cause_first.md` (don't patch screen-by-screen — but here we deliberately are, because the root cause is "no contract enforced across the directory"; we're fixing the symptoms because the contract itself IS the root-cause fix and Phase 1 only applied it to a slice)
