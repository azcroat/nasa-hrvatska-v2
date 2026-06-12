# Completion-Authority Audit & Overhaul — Design

**Date:** 2026-06-12
**Status:** Draft for review
**Author:** Lead dev (audit triggered by lesson-comprehension-gates follow-up)

## Problem

Lesson/exercise completion in Naša Hrvatska is written through **two uncoordinated mechanisms**, and most writes are **ungated** (a screen counts as "complete" without the learner demonstrating comprehension):

1. **Dwell-credit** — `BLACK_HOLE_SCREENS` in `src/hooks/useScreenLauncher.ts` writes `stats.vs[screenId]` after 20s/30s on screen, regardless of any interaction. (Largely closed for 13 screens in the lesson-gates work, PRs #36–#38.)
2. **In-component finish writes** — ~58 components write their own completion key on a "finish" event, e.g.:

   ```js
   finishFired.current = true;
   if (award) award(score * 5, false, 'grammar');
   markQuest('grammar');
   if (!stats.vs?.includes('genitive')) {
     setStats((prev) => prev.vs?.includes('genitive') ? prev
       : { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'genitive'] });
     if (writeDelta) writeDelta({ gc: 1, vs: ['genitive'] });
   }
   ```

   This fires on *reaching* the finish state — **not** on passing. A learner can finish a drill at any score (or, for `padezifull`-type screens, simply tap "finish" on a reading with no quiz at all) and the LEARN_PATH item is marked complete.

### Concrete consequences
- **Our own gate is back-doored.** `AspectDrillScreen` writes `vs:['aspect']` — the same key `AspectScreen` (gated to 75% in PR #37) uses. The gated lesson can be completed ungated via the drill.
- **No single source of truth.** Completion logic is copy-pasted across ~58 files with subtle variations (`gc`/`lc`/`sp`/`rc` counters, idempotency guards, key names), so a policy change (e.g. "75% to pass") cannot be made in one place, and regressions can't be prevented.
- **Key collisions** exist (`aspect` ×2, `speaking` ×2) — benign today but undocumented.

## Decisions (confirmed with product owner 2026-06-12)
- **Scope:** Full systemic overhaul — single completion authority + 75% gate on interactive drills + completion registry + guardrail test.
- **Threshold:** Interactive drills grant LEARN_PATH completion credit only at **≥75% correct**; below that the learner retries. (`LESSON_PASS_THRESHOLD = 0.75`, reused from lesson-gates.)
- **Passive lessons:** unchanged — gated via the existing `completeLesson` quiz path (≥75%, ≥5 questions).

## Goal

Converge every screen on **exactly one completion authority** so that:
- completion is granted only on demonstrated comprehension (score-bearing screens) or genuine task completion (productive/reference screens), per an explicit per-screen policy;
- the policy lives in one registry and one helper;
- a guardrail test makes it impossible for a new screen to silently regain the ungated bypass.

## Architecture

### 1. Single completion authority — `completeExercise()`
Generalize the existing `src/hooks/useLessonCompletion.ts::completeLesson` into one helper that every score-bearing screen calls. It owns: the pass check, the idempotent `vs` write, the counter increment, the XP award, and the quest mark.

```ts
// src/lib/completion/exerciseRegistry.ts  (new — pure data, unit-testable)
export type StatKind = 'lc' | 'gc' | 'sp' | 'rc';
export type CompletionPolicy =
  | { kind: 'gated'; statKind: StatKind }     // score-bearing: requires >=75%
  | { kind: 'effort'; statKind: StatKind }    // productive: complete on genuine finish
  | { kind: 'passive'; statKind: StatKind };  // reference: complete on read/dwell

export interface ExerciseEntry { vsKey: string; policy: CompletionPolicy; questKind?: QuestKind; }

// One row per completion key. THIS is the source of truth.
export const EXERCISE_COMPLETION: Record<string, ExerciseEntry> = {
  genitive:   { vsKey: 'genitive',   policy: { kind: 'gated',  statKind: 'gc' }, questKind: 'grammar' },
  aspect:     { vsKey: 'aspect',     policy: { kind: 'gated',  statKind: 'gc' }, questKind: 'grammar' },
  speaking:   { vsKey: 'speaking',   policy: { kind: 'effort', statKind: 'sp' }, questKind: 'speaking' },
  alphabet:   { vsKey: 'alphabet',   policy: { kind: 'passive', statKind: 'lc' } },
  // …all ~58 keys…
};
```

```ts
// src/hooks/useExerciseCompletion.ts  (generalizes useLessonCompletion)
// gated  → writes only if passedLesson(score, total)  (score/total >= 0.75)
// effort → writes if the learner reached a genuine finish (component decides; total may be 0)
// passive→ unchanged dwell/read semantics
export function completeExercise(args: {
  key: string; score?: number; total?: number; xp: number;
  stats; setStats; writeDelta; award;
}): { passed: boolean };
```

`completeLesson` is kept as a thin wrapper over `completeExercise({kind:'gated'})` so PRs #36–#38 are unaffected.

### 2. Per-screen classification (the registry rows)

| Policy | Screens (vsKey) | Completion rule |
|---|---|---|
| **gated** (≥75%) — score-bearing grammar drills | accusative, animateacc, aspect, clitic, cloze, conjugation, collocations, comparatives, conv-match, dative, fill-story, fleetinga, future-tense, gender, genitive, imperative, instrumental, locative, negation, negationgen, nominative, numbers-cases, numtime, passive, possessives, preposition, production, pronouns, reflexive, sentence-builder, sentence-tile, translate, typing, unjumble, verb-drill, city-locative, word-families, wordsprint, match, boje, znam | Credit only at score/total ≥ 0.75; else Retry |
| **gated** — Tier-1 lessons needing a quiz (currently ungated finish/dwell) | padezifull, padezi, svojmoj, modal, vocative, conjpractice | Add/observe a ≥5-Q check; credit only at ≥75% |
| **effort** — productive tasks (no MCQ correctness) | speaking (×2 screens), shadowing, writing, dictation, listening, pitch-accent, pronunciation-contrast, srsreview, flashcards-quiz, story-comprehension | Credit on genuine completion of the attempt (already required); documented as intentionally not threshold-gated |
| **passive** — reference reading | alphabet, techvoc, dialects, falsefr, grammarmap, grammarreader, colorquirk, conjlab | Dwell/read credit is correct; no change beyond routing through registry |

*Note on `effort`:* productive speaking/writing have no 0–100 correctness comparable to an MCQ. Forcing 75% there is wrong; the Comprehension Checkpoints system (PR #16) already re-verifies productive ability separately. These complete on finishing the attempt, and the registry records that as a deliberate `effort` policy — not an oversight.

### 3. Collisions resolved
- `aspect`: `AspectScreen` (lesson) and `AspectDrillScreen` (drill) both legitimately demonstrate aspect mastery. Once **both are gated**, sharing the key is benign and intentional — documented in the registry as a multi-source key.
- `speaking`: `SpeakingScreen` + `SpeakingSprintScreen` both `effort`; benign.

### 4. Dwell-credit reconciliation
After a screen routes completion through the registry, its `BLACK_HOLE_SCREENS` entry is removed (the screen now self-reports). `passive` screens with no internal finish event keep their dwell entry. The `blackHoleScreens.test.ts` guard is extended to assert this invariant.

### 5. Guardrail — no raw completion writes
A new test (`src/tests/completionAuthority.test.ts`) greps the component tree and **fails** if any file outside `src/hooks/useExerciseCompletion.ts` / `useLessonCompletion.ts` contains a raw `vs: [...(prev.vs` or `writeDelta({ … vs: [` completion write. New screens must use the registry. This is the regression lock.

## Data flow
```
Screen finish event
  → completeExercise({ key, score, total, xp, … })
      → look up EXERCISE_COMPLETION[key]
      → gated:  passedLesson(score,total) ? write vs+counter+award+quest : no-op (caller shows Retry)
      → effort: finished ? write vs+counter+award+quest
      → passive: write vs+counter (read credit)
  → (dwell-credit no longer needed; BLACK_HOLE entry removed)
```

## Error handling / migration safety
- **No progress loss.** Existing `vs` keys are preserved verbatim (same strings); idempotency (`includes(key)`) is retained inside the helper. A user who already completed `genitive` stays complete. (Per standing rule: never wipe user progress.)
- **Retry UX.** `gated` screens that previously wrote on finish now show the existing Retry affordance (LessonQuiz pattern) when score < 75%. Verified per-screen during execution.
- **Backward compatible.** `completeLesson` callers (PRs #36–#38) are untouched.

## Testing strategy
- Unit: `exerciseRegistry.test.ts` (every key well-formed; statKind valid; no duplicate vsKey with conflicting policy), `useExerciseCompletion.test.ts` (gated/effort/passive branches; idempotency; sub-75% no-op).
- Guard: `completionAuthority.test.ts` (no raw writes outside helper), extended `blackHoleScreens.test.ts`.
- Component: representative gated drill renders Retry < 75% and credits ≥ 75%.
- E2E (existing): rebuild `dist` then `npm run preview`; LEARN_PATH progression unaffected for already-complete keys.

## Scope / YAGNI
- We do **not** rewrite drill internals or scoring — only route the *completion write* through the registry.
- We do **not** change passive-reference or productive-task semantics beyond registry routing + documentation.
- We do **not** rename existing `vs` keys (avoids progress migration risk).

## Out of scope
- New content authoring beyond the ≤4 Tier-1 screens that lack any quiz (`padezifull`, `padezi`, `svojmoj`, `modal` — confirmed at execution).
- Gamification, checkpoints, sync (untouched).
