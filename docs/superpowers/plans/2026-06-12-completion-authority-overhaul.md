# Completion-Authority Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every screen's completion write through one registry-backed helper, gate score-bearing drills at ≥75%, document productive/passive policies, and lock the result with a guardrail test.

**Architecture:** A pure `EXERCISE_COMPLETION` registry (one row per `vs` key) + a `completeExercise()` helper that owns the pass check, idempotent `vs` write, counter, XP, and quest mark. `completeLesson` becomes a thin wrapper. Screens replace their inline finish-write with one helper call. A guardrail test forbids raw `vs` writes outside the helper.

**Tech Stack:** React+TS (Vite), Vitest, Playwright. Strict TS (`noUncheckedIndexedAccess`). husky pre-commit (eslint max-warnings=0 + prettier).

**Spec:** `docs/superpowers/specs/2026-06-12-completion-authority-audit-design.md`

**Execution rule (per product owner):** inline execution; **merge each phase on green CI** before starting the next. Each phase is independently shippable and preserves all existing `vs` keys (no progress loss).

---

## Phase 0 — Completion authority core

**Files:**
- Create: `src/lib/completion/exerciseRegistry.ts`
- Create: `src/lib/completion/__tests__/exerciseRegistry.test.ts`
- Create: `src/hooks/useExerciseCompletion.ts`
- Create: `src/hooks/__tests__/useExerciseCompletion.test.ts`
- Modify: `src/hooks/useLessonCompletion.ts` (re-export as wrapper)

- [ ] **Step 1: Write failing registry test**

```ts
// exerciseRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { EXERCISE_COMPLETION } from '../exerciseRegistry';
describe('EXERCISE_COMPLETION', () => {
  it('every entry has a non-empty vsKey and valid policy', () => {
    for (const [key, e] of Object.entries(EXERCISE_COMPLETION)) {
      expect(e.vsKey, key).toBeTruthy();
      expect(['gated', 'effort', 'passive']).toContain(e.policy.kind);
      expect(['lc', 'gc', 'sp', 'rc']).toContain(e.policy.statKind);
    }
  });
  it('no two keys map to the same vsKey with conflicting policy kinds', () => {
    const byVs = new Map<string, Set<string>>();
    for (const e of Object.values(EXERCISE_COMPLETION)) {
      const s = byVs.get(e.vsKey) ?? new Set(); s.add(e.policy.kind); byVs.set(e.vsKey, s);
    }
    for (const [vs, kinds] of byVs) expect(kinds.size, `${vs} has conflicting policies`).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npx vitest run src/lib/completion` → module not found)

- [ ] **Step 3: Create the registry** — one row per key from the spec's classification table. (Full key list verified from the audit: accusative, animateacc, aspect, boje, city-locative, clitic, cloze, collocations, comparatives, conjugation, conv-match, dative, dictation, fill-story, fleetinga, flashcards-quiz, future-tense, gender, genitive, grammarmap, imperative, instrumental, listening, locative, match, modal, negation, negationgen, nominative, numbers-cases, numtime, padezi, padezifull, passive, pitch-accent, possessives, preposition, production, pronouns, pronunciation-contrast, reflexive, sentence-builder, sentence-tile, shadowing, speaking, srsreview, story-comprehension, svojmoj, techvoc, translate, typing, unjumble, verb-drill, vocative, word-families, wordsprint, writing, znam, alphabet, dialects, falsefr, conjugation, conjpractice.)

```ts
// exerciseRegistry.ts
import type { QuestKind } from '../../hooks/useQuests'; // existing quest kinds
export type StatKind = 'lc' | 'gc' | 'sp' | 'rc';
export type CompletionPolicy =
  | { kind: 'gated'; statKind: StatKind }
  | { kind: 'effort'; statKind: StatKind }
  | { kind: 'passive'; statKind: StatKind };
export interface ExerciseEntry { vsKey: string; policy: CompletionPolicy; questKind?: QuestKind }
const g = (statKind: StatKind, questKind?: QuestKind): ExerciseEntry => ({ vsKey: '', policy: { kind: 'gated', statKind }, questKind });
const e = (statKind: StatKind, questKind?: QuestKind): ExerciseEntry => ({ vsKey: '', policy: { kind: 'effort', statKind }, questKind });
const p = (statKind: StatKind): ExerciseEntry => ({ vsKey: '', policy: { kind: 'passive', statKind } });
const RAW: Record<string, ExerciseEntry> = {
  genitive: g('gc','grammar'), dative: g('gc','grammar'), accusative: g('gc','grammar'),
  // …all gated grammar drills…
  speaking: e('sp','speaking'), shadowing: e('lc','speaking'), writing: e('lc','grammar'),
  // …all effort tasks…
  alphabet: p('lc'), techvoc: p('lc'), dialects: p('lc'), falsefr: p('lc'),
  // …all passive…
};
// vsKey defaults to the map key (no renames — preserves existing progress)
export const EXERCISE_COMPLETION: Record<string, ExerciseEntry> =
  Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, { ...v, vsKey: v.vsKey || k }]));
```

- [ ] **Step 4: Run registry test — expect PASS**

- [ ] **Step 5: Write failing helper test**

```ts
// useExerciseCompletion.test.ts — gated branch
it('gated: writes vs + counter only at >=75%', () => {
  const base = { vs: [], gc: 0 } as any; let saved = base;
  const setStats = (fn:any) => { saved = fn(saved); };
  const r1 = completeExercise({ key:'genitive', score:7, total:10, xp:35, stats:saved, setStats, writeDelta:()=>{}, award:()=>{} });
  expect(r1.passed).toBe(false); expect(saved.vs).not.toContain('genitive');  // 70% < 75%
  const r2 = completeExercise({ key:'genitive', score:8, total:10, xp:40, stats:saved, setStats, writeDelta:()=>{}, award:()=>{} });
  expect(r2.passed).toBe(true);  expect(saved.vs).toContain('genitive');      // 80% >= 75%
});
it('effort: writes on finish regardless of score', () => {
  let saved = { vs: [], sp: 0 } as any; const setStats = (fn:any)=>{ saved = fn(saved); };
  const r = completeExercise({ key:'speaking', xp:20, stats:saved, setStats, writeDelta:()=>{}, award:()=>{} });
  expect(r.passed).toBe(true); expect(saved.vs).toContain('speaking');
});
it('idempotent: second call is a no-op', () => {
  let saved = { vs:['genitive'], gc:1 } as any; const setStats=(fn:any)=>{saved=fn(saved);};
  completeExercise({ key:'genitive', score:10, total:10, xp:50, stats:saved, setStats, writeDelta:()=>{}, award:()=>{} });
  expect(saved.gc).toBe(1);
});
```

- [ ] **Step 6: Run — expect FAIL**

- [ ] **Step 7: Implement `completeExercise`** (reuse `passedLesson` from `src/lib/lessonGate.ts`). gated → write iff `passedLesson(score,total)`; effort/passive → write on call; always idempotent on `vsKey`; increment `policy.statKind`; `award(xp,false,activityType)`; `markQuest(questKind)` when present.

- [ ] **Step 8: Make `completeLesson` a wrapper** — `completeLesson(a) => completeExercise({ key: a.screenId, score: a.score, total: a.total, xp: a.xp, … })` after registering its 10 keys as `gated`. Run the existing PR#36–#38 tests — expect PASS (no behavior change).

- [ ] **Step 9: Run full unit suite + typecheck + lint**

- [ ] **Step 10: Commit** — `feat(completion): registry + completeExercise authority (no behavior change)`

---

## Phase 1 — Migrate score-bearing case/grammar drills (batch A)

**Files (Modify):** `AccusativeDrill`, `AnimateAccDrill`, `DativeDrill`, `GenitiveDrill`, `InstrumentalDrill`, `LocativeDrill`, `NominativeDrill`, `PrepDrill`, `NegationGenDrill`, `NumbersCasesDrill`, `PassiveDrill`, `ImperativeDrill` (all in `src/components/practice/`).

**Mechanical recipe (identical per file).** Replace the finish block:

```js
// BEFORE
if (award) award(score * 5, false, 'grammar');
markQuest('grammar');
if (!stats.vs?.includes('genitive')) {
  setStats((prev) => prev.vs?.includes('genitive') ? prev
    : { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'genitive'] });
  if (writeDelta) writeDelta({ gc: 1, vs: ['genitive'] });
}
// AFTER
const { passed } = completeExercise({
  key: 'genitive', score, total: questions.length, xp: score * 5,
  stats, setStats, writeDelta, award,
});
setDrillPassed(passed); // drive existing results UI: show Retry when !passed
```

- [ ] **Step 1: Write/extend component test for one representative drill (GenitiveDrill)** — asserts: finishing at <75% does NOT add `genitive` to `vs` and shows Retry; ≥75% adds it. (Use existing testing-library setup; stub `useStats`.)
- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Apply recipe to GenitiveDrill**, wire Retry to the existing results view.
- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Apply the identical recipe to the other 11 drills in batch A.** Each: locate `finishFired.current = true` block, swap to `completeExercise`, add Retry on `!passed`.
- [ ] **Step 6: Remove any now-redundant `BLACK_HOLE_SCREENS` entries for these keys** in `src/hooks/useScreenLauncher.ts`; update `src/tests/blackHoleScreens.test.ts` removed-list.
- [ ] **Step 7: typecheck + lint + full unit suite**
- [ ] **Step 8: `npm run build`** (E2E serves dist)
- [ ] **Step 9: Commit + push + open PR; merge on green.** `feat(completion): gate case/grammar drills at 75% (batch A)`

---

## Phase 2 — Migrate remaining grammar drills + games + collision keys (batch B)

**Files (Modify):** `AspectDrillScreen` (key `aspect` — now gated, closing the lesson back-door), `CliticDrill`, `ClozeEngine`, `ConjugationDrill`, `CollocationsGame`, `FleetingADrill`, `SentenceTileScreen`, `TranslateDrillsScreen`, `TypingScreen`, `Unjumble`, `WordSprint`, `WordFamilies`, `BojeGame`, `ZnamGame`, `MatchGame`, and `src/components/practice/exercises/`: `CityLocativeScreen`, `ComparativesScreen`, `ConvMatchScreen`, `FillStoryScreen`, `FutureTenseScreen`, `GenderDrillScreen`, `NegationScreen`, `PossessivesScreen`, `PronounsScreen`, `ReflexiveScreen`, `SentenceBuilderScreen`, `VerbDrillScreen`, `NumTime`.

- [ ] **Step 1:** Apply the Phase-1 recipe to each (same before/after shape; key = its existing `vs` string; `statKind` per registry; xp formula unchanged).
- [ ] **Step 2:** For `AspectDrillScreen`, add a regression test asserting the `aspect` key is written only at ≥75% (proves the lesson gate from PR #37 is no longer back-doored).
- [ ] **Step 3:** Remove redundant `BLACK_HOLE_SCREENS` entries; update guard test.
- [ ] **Step 4:** typecheck + lint + unit + `npm run build`
- [ ] **Step 5:** Commit + push + PR; merge on green. `feat(completion): gate remaining drills + games; close aspect back-door (batch B)`

---

## Phase 3 — Tier-1 true-bypass screens (need a quiz or proper gate)

**Files (Modify):** `PadezifullScreen`, `PadeziScreen`, `SvojMojScreen`, `ModalScreen`, `VocativeScreen`, `ConjugationSessionDrill` (conjpractice). **Create:** `LESSON_QUIZ_BANKS` entries for screens lacking any quiz (confirmed at task start: `padezifull`, `modal`, plus any of `padezi`/`svojmoj` without a scorable check).

- [ ] **Step 1:** For each screen, determine at task start whether it already has a scorable check (grep its source for `score`/`correct`/quiz state).
  - **Has a check** (`vocative` quiz phase, `svojmoj`, `padezi`): wire its existing score into `completeExercise({ key, score, total, … , kind gated })`; show Retry < 75%.
  - **No check** (`padezifull`, `modal`): add ≥5-Q bank to `src/lib/lessonQuizBanks.ts` and render the existing `LessonQuiz` runner (Phase-2-of-lesson-gates pattern), gating on its result.
- [ ] **Step 2:** Add/extend a component test per screen (Retry < 75%, credit ≥ 75%).
- [ ] **Step 3:** Remove these from `BLACK_HOLE_SCREENS`; update guard test.
- [ ] **Step 4:** typecheck + lint + unit + `npm run build`
- [ ] **Step 5:** Commit + push + PR; merge on green. `feat(completion): gate Tier-1 bypass screens (modal/vocative/padezi/…)`

---

## Phase 4 — Productive/effort tasks + passive reference (route + document)

**Files (Modify):** effort — `SpeakingScreen`, `SpeakingSprintScreen`, `ShadowingScreen`, `WritingScreen`, `DictationScreen`, `ListeningScreen`, `PitchAccentScreen`, `PronunciationContrast`, `ReviewScreen` (srsreview), `FlashcardRecallQuiz`, `GradedInputScreen` (story-comprehension). passive — `AlphabetScreen`, `TechVocScreen`, `DialectAwarenessScreen`, `FalseFriendsScreen`, `GrammarConstellation`, `ConjugationLab`.

- [ ] **Step 1:** Replace each finish-write with `completeExercise({ key, xp, … })` (no `score`/`total` → registry's `effort`/`passive` policy writes on genuine finish, preserving current UX). This removes the last raw `vs` writes.
- [ ] **Step 2:** Add a one-line code comment at each `effort` site referencing the registry rationale (no MCQ correctness; Checkpoints re-verify productive ability).
- [ ] **Step 3:** typecheck + lint + unit + `npm run build`
- [ ] **Step 4:** Commit + push + PR; merge on green. `feat(completion): route productive/passive screens through registry`

---

## Phase 5 — Guardrail lock + reconcile

**Files:** Create `src/tests/completionAuthority.test.ts`; Modify `src/tests/blackHoleScreens.test.ts`.

- [ ] **Step 1: Write the guardrail test** — fails if any file under `src/components` contains a raw completion write (`vs: [...(prev.vs` or `writeDelta(\{[^}]*vs:`) **outside** `useExerciseCompletion.ts`/`useLessonCompletion.ts`.

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
const RAW = /vs:\s*\[\s*\.\.\.\(?prev\.vs|writeDelta\(\s*\{[^}]*\bvs:\s*\[/;
describe('completion authority', () => {
  it('no raw vs-completion writes outside the helper', () => {
    const offenders = globSync('src/components/**/*.tsx')
      .filter((f) => RAW.test(readFileSync(f, 'utf8')));
    expect(offenders, `route these through completeExercise:\n${offenders.join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect PASS** (all sites migrated in Phases 1–4). If any offender remains, migrate it before proceeding.
- [ ] **Step 3:** Extend `blackHoleScreens.test.ts` to assert every `award`-taking interactive screen is registry-gated, and only `passive` keys may remain in `BLACK_HOLE_SCREENS`.
- [ ] **Step 4:** Full unit + E2E locally (`npm run build` then `npm run test:e2e` representative LEARN_PATH spec) to confirm already-complete keys stay complete (no progress loss).
- [ ] **Step 5:** Commit + push + PR; merge on green. `test(completion): lock single completion authority + reconcile dwell map`

---

## Self-review notes
- **Spec coverage:** Phases 1–4 cover all ~58 audited keys; Phase 0 builds the authority; Phase 5 locks it. ✓
- **No progress loss:** every `vsKey` equals its existing string; idempotency retained. ✓
- **Type consistency:** `completeExercise` args identical across all call sites; `completeLesson` preserved as wrapper. ✓
- **Risk ordering:** lowest-risk uniform drills first (1–2), bespoke screens next (3), productive/passive last (4), guardrail last (5) so the lock only flips green once everything is migrated.
