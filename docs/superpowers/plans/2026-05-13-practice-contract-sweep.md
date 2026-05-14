# Practice Contract Sweep — Sub-Project 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Exercise Contract from Phase 1 to ~30 most-trafficked practice exercises currently non-compliant or partially compliant. Achieve 25+ exercises actively enforced by the contract test.

**Architecture:** Iterative audit + fix loop. Each exercise: read source, classify (compliant/partial/non-compliant), apply canonical pattern from `DativeDrill.tsx:188-199` (grammar drills) or the non-grammar variant from commit `bb3db8d` (SRS/Speaking/Writing pattern). Add to contract test where structurally feasible. Document "out-of-scope" sub-components in `docs/exercise-contract.md`.

**Tech Stack:** React 18 + TypeScript strict, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-13-practice-contract-sweep-design.md`

---

## Canonical fix patterns

### Pattern A — Grammar/case drill (use for MC drills)

Adapt this template into the exercise. Substitute `<tag>` with the exercise's `vs:[]` tag (e.g., `'cloze'`, `'unjumble'`).

```tsx
// At top of file
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { useRef } from 'react';

// Inside component body, before any useState
const { stats, setStats, writeDelta } = useStats();
const finishFired = useRef(false);

// Inside completion onClick (e.g., the "Done" or "Finish" button)
if (!finishFired.current) {
  finishFired.current = true;
  if (typeof award === 'function') award(score * 5, false, 'grammar');
  markQuest('grammar');
  if (!stats.vs?.includes('<tag>')) {
    setStats((prev) => {
      if (prev.vs?.includes('<tag>')) return prev;
      return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), '<tag>'] };
    });
    if (writeDelta) writeDelta({ gc: 1, vs: ['<tag>'] });
  }
}
```

### Pattern B — Non-grammar exercise (use for reading/listening/speaking/writing)

Same as A, but substitute:
- `markQuest('grammar')` → appropriate quest name (`'reading'`, `'listening'`, `'speak'`, `'write'`)
- `gc` → appropriate counter (`lc` for reading/listening/cultural, `sp` for speaking, none for writing if no counter exists)
- `'grammar'` (in award call) → `'reading'`, `'listening'`, `'speaking'`, or `'writing'`

Reference: commit `bb3db8d` (SRS Review, Speaking, Writing). The exact field combinations are case-by-case; investigate each exercise's natural category.

---

## Task 1: Audit + fix Tier 1 exercises (8 zero-XP exercises)

These currently let users complete an exercise without awarding XP at all.

**Files (in audit order):**
- `src/components/practice/ClozeEngine.tsx`
- `src/components/practice/ProductionDrillScreen.tsx`
- `src/components/practice/TranslateDrillsScreen.tsx`
- `src/components/practice/SentenceTileScreen.tsx`
- `src/components/practice/Unjumble.tsx`
- `src/components/practice/DictationScreen.tsx`
- `src/components/practice/NumTime.tsx`
- `src/components/practice/WordSprint.tsx`

### Task 1a: Fix ClozeEngine + ProductionDrillScreen + TranslateDrillsScreen + SentenceTileScreen (commit 1 of 2)

- [ ] **Step 1: Audit each**

For each file:
- Read the source
- Locate the "exercise complete" trigger (the button or auto-trigger that ends the session)
- Check: is `award()` called? `markQuest()`? `setStats`? `writeDelta`? `finishFired`?

Document findings in your scratch notes.

- [ ] **Step 2: Apply Pattern A to ClozeEngine**

`ClozeEngine.tsx` is used by multiple parent drills as a sub-component. Verify:
- Does it have its own completion path or does the parent call `award`?
- If it has its own path: apply Pattern A with `<tag>` = `'cloze'`
- If the parent owns completion: skip ClozeEngine (it's a sub-component, document in out-of-scope list)

If applied, the change is roughly the canonical pattern shown above with `'cloze'` substituted.

- [ ] **Step 3: Apply Pattern A to ProductionDrillScreen**

Tag: `'production'`. Apply canonical pattern in the completion block.

- [ ] **Step 4: Apply Pattern B to TranslateDrillsScreen**

Tag: `'translate'`. Quest: `'translate'` (or `'grammar'` if no `translate` quest exists — verify with `grep -rn "markQuest" src/`). Counter: `gc` (translation tests grammar).

- [ ] **Step 5: Apply Pattern A to SentenceTileScreen**

Per audit, has `finishFired` guard but missing `markQuest`/`vs:[]`/`writeDelta`. Add only the missing pieces.

Tag: `'sentence-tile'`. Quest: `'grammar'` (it tests sentence structure).

- [ ] **Step 6: Run tests + typecheck + lint**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- --run 2>&1 | tail -10 && \
  npx tsc --noEmit && npm run lint 2>&1 | tail -5 ; popd
```

Address any test failures (most likely existing per-component tests need StatsProvider mock — mirror `prep-drill.test.tsx` mock pattern from commit `3b15655`).

- [ ] **Step 7: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/practice/ClozeEngine.tsx \
        src/components/practice/ProductionDrillScreen.tsx \
        src/components/practice/TranslateDrillsScreen.tsx \
        src/components/practice/SentenceTileScreen.tsx \
        src/tests/ && \
git commit -m "$(cat <<'EOF'
feat(contract): apply Exercise Contract to 4 zero-XP exercises

ClozeEngine, ProductionDrillScreen, TranslateDrillsScreen, and
SentenceTileScreen now follow the contract: single XP award on
completion, markQuest, setStats(gc/vs), writeDelta sync.

Per-exercise vs tags: cloze, production, translate, sentence-tile.
Existing tests for each updated to mock StatsContext per the
prep-drill pattern (commit 3b15655).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

### Task 1b: Fix Unjumble + DictationScreen + NumTime + WordSprint (commit 2 of 2)

Same workflow as Task 1a but for the 4 remaining Tier 1 exercises.

Tags:
- Unjumble: `'unjumble'`, Pattern A (grammar — tests word order)
- DictationScreen: `'dictation'`, Pattern B (listening — counter `lc`, quest `'listening'`)
- NumTime: `'numtime'`, Pattern A (grammar — numbers/time forms)
- WordSprint: `'wordsprint'`, Pattern A (grammar/vocab — sprint format)

- [ ] **Step 1: Audit each** (see Tier 1a guidance)
- [ ] **Step 2: Apply patterns**
- [ ] **Step 3: Run tests + typecheck + lint**
- [ ] **Step 4: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/practice/Unjumble.tsx \
        src/components/practice/DictationScreen.tsx \
        src/components/practice/NumTime.tsx \
        src/components/practice/WordSprint.tsx \
        src/tests/ && \
git commit -m "$(cat <<'EOF'
feat(contract): apply Exercise Contract to 4 more exercises

Unjumble, DictationScreen, NumTime, WordSprint now follow contract.
Tags: unjumble (grammar), dictation (listening, lc counter),
numtime (grammar), wordsprint (vocab/grammar).

Tier 1 (zero-XP exercises) complete — 8 exercises now compliant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 2: Audit + fix Tier 2 exercises (10 partial-compliance)

**Files:**
- `src/components/practice/MatchGame.tsx`
- `src/components/practice/ZnamGame.tsx`
- `src/components/practice/BojeGame.tsx`
- `src/components/practice/TypingScreen.tsx`
- `src/components/practice/CollocationsGame.tsx`
- `src/components/practice/PitchAccentScreen.tsx`
- `src/components/practice/WordFamilies.tsx`
- `src/components/practice/PronunciationContrast.tsx`
- `src/components/practice/ShadowingScreen.tsx`
- `src/components/practice/NumbersCasesDrill.tsx`

### Task 2a: Fix first 5 (MatchGame, ZnamGame, BojeGame, TypingScreen, CollocationsGame)

For each:

- [ ] **Step 1: Read the file**, identify missing contract clauses
- [ ] **Step 2: Apply Pattern A or B** as appropriate
- [ ] **Step 3: Update existing tests** if they break (StatsProvider mock pattern)
- [ ] **Step 4: Run tests + typecheck + lint**
- [ ] **Step 5: Commit**

Tags (Pattern A unless noted):
- MatchGame: `'match'`
- ZnamGame: `'znam'`
- BojeGame: `'boje'` (colors)
- TypingScreen: `'typing'`
- CollocationsGame: `'collocations'`

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/practice/MatchGame.tsx src/components/practice/ZnamGame.tsx \
        src/components/practice/BojeGame.tsx src/components/practice/TypingScreen.tsx \
        src/components/practice/CollocationsGame.tsx src/tests/ && \
git commit -m "$(cat <<'EOF'
feat(contract): apply Contract to 5 partial-compliance exercises

MatchGame, ZnamGame, BojeGame, TypingScreen, CollocationsGame —
all already had award() and finishFired but were missing markQuest
or vs:[] / writeDelta. Completed the contract on each.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

### Task 2b: Fix remaining 5 (PitchAccent, WordFamilies, PronunciationContrast, Shadowing, NumbersCasesDrill)

Same workflow.

Tags:
- PitchAccentScreen: `'pitch-accent'` (Pattern A — tests pitch perception)
- WordFamilies: `'word-families'` (Pattern A — vocabulary)
- PronunciationContrast: `'pronunciation-contrast'` (Pattern A — tests phonemic perception)
- ShadowingScreen: `'shadowing'` (Pattern B — listening; lc counter; quest `'shadowing'` if exists else `'listening'`)
- NumbersCasesDrill: `'numbers-cases'` (Pattern A — grammar)

- [ ] **Steps 1-5: Same per-exercise workflow**
- [ ] **Commit:**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/practice/PitchAccentScreen.tsx \
        src/components/practice/WordFamilies.tsx \
        src/components/practice/PronunciationContrast.tsx \
        src/components/practice/ShadowingScreen.tsx \
        src/components/practice/NumbersCasesDrill.tsx \
        src/tests/ && \
git commit -m "$(cat <<'EOF'
feat(contract): apply Contract to 5 final Tier 2 exercises

PitchAccent, WordFamilies, PronunciationContrast, Shadowing,
NumbersCasesDrill — full contract enforcement. Shadowing uses
Pattern B (listening lc counter). Others Pattern A (grammar gc).

Tier 2 (partial-compliance) complete — 10 exercises now compliant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 3: Audit + fix Tier 3 exercises (12 in `exercises/` subdirectory)

**Files:**
- `src/components/practice/exercises/GenderDrillScreen.tsx`
- `src/components/practice/exercises/VerbDrillScreen.tsx`
- `src/components/practice/exercises/NegationScreen.tsx`
- `src/components/practice/exercises/FutureTenseScreen.tsx`
- `src/components/practice/exercises/CityLocativeScreen.tsx`
- `src/components/practice/exercises/ReflexiveScreen.tsx`
- `src/components/practice/exercises/FillStoryScreen.tsx`
- `src/components/practice/exercises/ConvMatchScreen.tsx`
- `src/components/practice/exercises/PronounsScreen.tsx`
- `src/components/practice/exercises/SentenceBuilderScreen.tsx`
- `src/components/practice/exercises/PossessivesScreen.tsx`
- `src/components/practice/exercises/ComparativesScreen.tsx`

### Task 3a: First 4

Tags: gender, verb-drill, negation, future-tense

### Task 3b: Middle 4

Tags: city-locative, reflexive, fill-story, conv-match

### Task 3c: Last 4

Tags: pronouns, sentence-builder, possessives, comparatives

Each batch: audit → apply pattern → tests → commit.

Commit message template for each batch:

```
feat(contract): apply Contract to 4 exercises/ subdir items

[List the 4 file names], with tags [list 4 tags].
Pattern A (grammar) applied to all unless noted.
```

---

## Task 4: Update contract test to cover new compliant exercises

**Files:**
- Modify: `src/tests/exerciseContract.test.tsx`

For each exercise made compliant in Tasks 1-3 that's structurally feasible (mirrors DativeDrill MC pattern with single completion button), add a row to the `FULL_CONTRACT_DRILLS` array:

```ts
{ name: '<ExerciseName>', path: '../components/practice/<ExerciseName>', vsTag: '<tag>' },
```

Skip exercises that:
- Don't fit the MC contract (drag-drop, infinite-loop, multi-phase like AspectDrill — though AspectDrill is already partial-completion mocked)
- Have specific quirks the helper can't drive

Document each skip in a comment.

Target: 25+ entries in `FULL_CONTRACT_DRILLS`. Currently 13 (per Phase 1).

- [ ] **Step 1: Audit which new exercises fit the helper**

After Tasks 1-3, ~22 exercises will be newly compliant. Of those, estimate which can be driven through `completeDrill` helper without override:
- Definitely fits: any with MC question→answer→Next loop (most grammar drills)
- Probably needs override: complex state machines (Sprint, MatchGame, BojeGame), drag-drop (SentenceBuilder, Unjumble)

- [ ] **Step 2: Add to FULL_CONTRACT_DRILLS**

Append rows. Run contract test:

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- exerciseContract --run 2>&1 | tail -40 ; popd
```

For any failures, either:
- Add `useOverride: true` with a tailored completion helper (mirror `makeAspectOverride()` pattern)
- OR add `skip: true` with documented reason

- [ ] **Step 3: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/tests/exerciseContract.test.tsx && \
git commit -m "$(cat <<'EOF'
test(contract): extend contract test to 25+ newly-compliant exercises

After SP2 sweep, ~22 practice exercises follow the Exercise Contract.
This commit adds them to FULL_CONTRACT_DRILLS so CI continues to
enforce the contract on each.

Exercises that don't fit the generic completeDrill helper get
useOverride: true with a tailored helper OR skip: true with reason.
[List which.]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 5: Document the out-of-scope list

**Files:**
- Modify: `docs/exercise-contract.md`

- [ ] **Step 1: Append the out-of-scope section**

Add to the end of `docs/exercise-contract.md`:

```markdown
## Components that do NOT need contract compliance

The following are sub-components, helper panels, or screens that aren't standalone exercises. Contract clauses do not apply.

### Drill sub-components (rendered inside parent drills)
- AspectPhaseBar, AspectQuestionPanel, AspectRuleCard, AspectTimeline
- DialogueAvatar, DialogueResultsScreen, DialogueTipContent, DialogueGuidedMode, DialogueScenarioMenu, DialogueAiMode
- FlashcardCardBack, FlashcardCardFront, FlashcardEmptyState, FlashcardResultScreen, FlashcardRecallQuiz (parent Flashcards.tsx compliant)
- McGameOver, McQuestionArea, McResult (parent McGame.tsx compliant)
- SprintCountdownScreen, SprintFeedbackPhase, SprintModelPhase, SprintSetupScreen, SprintSpeakingPhase (parent SpeakingSprintScreen compliant)
- SlangAgeGate, SlangEntryCard, SlangQuizPanel (parent SlangScreen wraps these)
- SpeakingPracticePanel, SpeakingSummaryScreen (parents handle contract)
- StoryScreens (parent GradedInputScreen compliant per P2-3)
- ListeningComprehensionScreen, ListeningPath (parent ListeningScreen compliant per P2-4)

### Debug, list-view, and non-exercise screens
- AdaptiveReviewScreen (review-mode wrapper, contract via parent)
- MyWordsScreen, MistakesScreen (list views, not exercises)
- PracticeTab (tab container)
- CefrTest (placement test — flows distinct from a drill; contract not directly applicable)

### Newer additions (out of scope of SP2)
- All `learn/` screens — those are lessons, not exercises (see Pedagogy Foundations sub-project)
- `croatia/` AI conversation screens — covered in AI module sub-project
```

- [ ] **Step 2: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add docs/exercise-contract.md && \
git commit -m "$(cat <<'EOF'
docs(contract): list components explicitly out of scope

After SP2 sweep, the contract is enforced on ~30 trafficked
exercises. Documenting which components do NOT need compliance
so future contributors don't waste time:
- Sub-panels of parent drills (Aspect*, Dialogue*, Flashcard*,
  Mc*, Sprint*, Slang*, Speaking*)
- List views (MyWords, Mistakes), tab containers, placement test
- learn/ and croatia/ AI screens (handled by separate sub-projects)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Acceptance summary

- [ ] Tier 1 (8 zero-XP exercises) — all compliant
- [ ] Tier 2 (10 partial-compliance) — all compliant
- [ ] Tier 3 (12 `exercises/` subdir) — all compliant
- [ ] Contract test (`exerciseContract.test.tsx`) references 25+ exercises
- [ ] `docs/exercise-contract.md` updated with out-of-scope list
- [ ] Full test suite green on every commit
- [ ] Lint + typecheck clean on every commit
- [ ] All commits pushed to master
- [ ] No regressions in daily session activity routing or XP awards
