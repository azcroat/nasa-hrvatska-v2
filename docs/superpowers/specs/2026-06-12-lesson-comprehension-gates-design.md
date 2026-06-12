# Lesson Comprehension Gates — Design

**Date:** 2026-06-12
**Status:** Approved (brainstorming → spec)

## Goal

Make a grammar **lesson** count as "complete" only when the learner demonstrates comprehension — passing an end-of-lesson check at **≥ 75%** — instead of being credited merely for staying on the screen ~20s (the LEARN_PATH dwell-credit fallback). Most grammar lessons already have a quiz; the defect is that they're *also* in the dwell-credit list, so completion can be earned without the quiz. A few grammar lessons have no quiz at all.

## Background (verified)

- LEARN_PATH credits screens listed in `BLACK_HOLE_SCREENS` (`src/hooks/useScreenLauncher.ts:65–135`) after **20s dwell**: it writes `vs:[screenId]` immediately (satisfies the `ck()` completion gate) and after 20s grants `lc`/`gc` +1 and `award(15,'lesson')` — **no assessment** (`launchPathItem`, lines 635–668).
- Most grammar lessons already render a scored quiz + results screen and, on finish, write `vs:[screenId]` + `award()` (e.g. `DeclensionScreen.tsx:223–267`, `score/questions` shown as an emoji band) — **but with no pass threshold**: finishing at any score marks complete.
- Verified **has-quiz** grammar lessons: declension, tenses, conditional, impersonal, formalregister, future_tense_lesson.
- Verified **passive** (no quiz, no award) grammar lessons: aspect, wordform, diminutives, phonology.

## Decisions

1. **Scope:** (a) make existing lesson quizzes the *required* gate (threshold + remove dwell-credit); (b) add a quiz gate to the truly-passive grammar lessons. **Leave** reference/culture/vocab/audio screens (idioms, proverbs, weather, kings, top100, shadowing, listening, …) on dwell-credit — a comprehension quiz there is out of scope.
2. **Pass rule:** complete only at **score/total ≥ 0.75**; below → lesson stays incomplete, learner can **retry**. (`LESSON_PASS_THRESHOLD = 0.75`.)
3. **Question count:** authored passive-lesson gates have **≥ 5** MCQs each.
4. **No regression:** never *remove* an already-earned completion; only change how *new* completions are earned.

## Architecture (Approach A — shared gate + reusable quiz)

### Unit 1 — `src/lib/lessonGate.ts` (pure, the single source of the pass rule)
```ts
export const LESSON_PASS_THRESHOLD = 0.75;
export function passedLesson(score: number, total: number): boolean {
  return total > 0 && score / total >= LESSON_PASS_THRESHOLD;
}
export function lessonScorePct(score: number, total: number): number {
  return total > 0 ? score / total : 0;
}
```
Pure, unit-tested. No React/storage.

### Unit 2 — `useLessonCompletion` helper (`src/hooks/useLessonCompletion.ts`)
A small hook/function that, given `(screenId, score, total, statKind: 'lc'|'gc', award)`, performs the completion write **only when `passedLesson`**: idempotently add `screenId` to `stats.vs` (the `ck()` gate), increment `lc`/`gc`, `writeDelta`, `award(xp,'lesson')`, `markQuest(...)`. Below threshold → returns `{passed:false}` and writes nothing. This centralizes what the existing lesson screens currently inline, so the threshold lives in one place.

### Unit 3 — Existing-quiz lessons: route completion through the gate
For declension, tenses, conditional, impersonal, formalregister, future_tense_lesson: replace the results-screen completion branch (the `vs:[screenId]` + `award` write) with a call to `useLessonCompletion(...)`, so it fires only at ≥75%. Add a **Retry** action on the results screen when not passed (re-roll the quiz). The score UI already exists; this is a localized change to the completion branch.

### Unit 4 — Reusable `<LessonQuiz>` (`src/components/learn/LessonQuiz.tsx`)
A small MCQ runner: props `{ screenId, statKind, questions: {prompt, options, correctIdx, note?}[], award, goBack }`. Renders one question at a time, tallies score, shows a results screen, and calls `useLessonCompletion` on finish (Retry on fail). Used by the passive lessons. Mirrors the existing drill UI conventions (`H`, option buttons, `data-testid="lessonquiz-option"`, results `data-testid="lessonquiz-result"`).

### Unit 5 — Passive grammar lessons: append the gate
Add `<LessonQuiz>` (≥5 authored MCQs from the lesson's own content) to aspect, wordform, diminutives, phonology. Questions authored from existing lesson data; a data-shape test guards them (exactly one `correctIdx` in range, ≥5 questions, no empty strings).

### Unit 6 — Remove dwell-bypass for gated screens (`BLACK_HOLE_SCREENS`)
Delete the gated screen ids (declension, tenses, conditional, impersonal, formalregister, future_tense_lesson, aspect, wordform, diminutives, phonology) from `BLACK_HOLE_SCREENS`. Because each now self-reports completion via Unit 2/3/5, LEARN_PATH completion still works — it just requires passing. Reference/culture/vocab/drill entries are left as-is. (Interactive **drills** mistakenly in the list — conjdrill/conjlab/conjpractice/aspectdrill/vocative/negation/clitic/padezi — are out of scope here; flagged as a separate follow-up.)

### Plan-time verification (not a placeholder — explicit task)
The remaining ambiguous grammar-lesson `BLACK_HOLE_SCREENS` entries (modal, reflexive, past_tense_lesson, padezifull, svojmoj, negation, grammarreader, colorquirk, pitchaccent, grammarmap, padezi) will each be classified during planning as: has-quiz → gate it (Unit 3); passive → add quiz (Unit 5); already-self-reporting drill → just remove from list; reference → leave. The plan enumerates the final per-screen disposition.

## Data flow
LEARN_PATH launches lesson → learner reads + takes end-check → `<LessonQuiz>`/existing quiz tallies score → `useLessonCompletion` → if `≥75%`: write `vs[screenId]` + `lc/gc` + `award` + `markQuest` (lesson marked complete in `ck()`); else: Retry, nothing written. Dwell timer no longer fires for these (removed from `BLACK_HOLE_SCREENS`).

## Error handling
- Below threshold: explicit "Not passed — X% (need 75%) · Try again"; no completion/credit.
- Missing/short question data: the data-shape test fails the build; at runtime a lesson with <1 question falls back to its prior behavior (no crash).
- Idempotent `vs` write (arrayUnion-style) — retries/repeat passes don't double-credit (`award` daily cooldown already guards XP).

## Testing
- Unit: `passedLesson` (boundary 74/75/76%), `lessonScorePct`.
- Hook/component: `useLessonCompletion` writes vs+award only on pass; `<LessonQuiz>` below 75% → no completion, ≥75% → completion + award once.
- Guard: gated ids are absent from `BLACK_HOLE_SCREENS`; authored question banks pass the data-shape test (≥5 Qs, valid correctIdx).
- Regression: existing lesson tests still pass; a pre-existing `vs` completion is never removed.

## Out of scope (YAGNI)
- Reference/culture/vocab/audio screens keep dwell-credit.
- The interactive-drills-in-dwell-list bug (separate follow-up).
- No spaced-repetition of lesson-quiz items; no per-question analytics.
