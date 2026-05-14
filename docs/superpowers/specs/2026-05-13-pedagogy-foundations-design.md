# Pedagogy Foundations — Sub-Project 1 Design

**Date:** 2026-05-13
**Author:** Claude Opus 4.7 (1M context), with jschr direction
**Status:** Pending user spec review

## Problem statement

The gold-standard pedagogy audit (2026-05-13) flagged three foundational gaps that prevent the app from claiming best-in-class language pedagogy:

- **L-01 (P0):** No mastery gates between curriculum levels. Learners advance to harder grammar (cases, aspect, clitics) without proving competency on prerequisites. Skill debt accumulates silently.
- **L-02 (P1):** Aspect pedagogy is correctly introduced at B1 (imperfective first, perfective second) — but A2 learners have no exposure to high-frequency perfective-only verbs (`moći`, `trebati`, `postati`, `doći`, `htjeti`, `dobiti`). When aspect theory hits at B1, the perfective half feels novel rather than familiar.
- **L-04 (P1):** Lessons are presentation-only. Active retrieval testing happens only after the lesson via separate practice. Cognitive psychology (Roediger & Karpicke 2006, Karpicke & Blunt 2011) is unambiguous: retrieval *during* learning produces dramatically better long-term retention than restudy.

All three are pedagogy-level (what we teach + how) not implementation-level. They require both code changes AND curriculum content additions.

## Goals

1. Block premature progression. Learners cannot advance to a level until they demonstrate ≥80% mastery of the prior level's items AND pass a level-end retention quiz.
2. Introduce 6 high-frequency perfective verbs at A2 as plain vocabulary (no aspect theory yet) so B1 aspect lessons land on familiar ground.
3. Embed micro-quizzes during lesson flow so retrieval practice happens in-session.

## Success criteria

A Sub-Project 1 implementation is complete when:

1. A new user at Level 1 (Survivor) cannot click into Level 2 (Pathfinder) content until they've completed ≥80% of Level 1 items AND passed a 10-question level quiz at ≥70%.
2. The Level 2 unlock screen shows a clear progress indicator ("12 of 15 items completed, 1 quiz remaining") and a "Take Level Quiz" CTA when prerequisites are met.
3. A new A2 lesson titled "Useful Perfective Verbs" exists in the LEARN_PATH curriculum at the appropriate position. It introduces `moći`, `trebati`, `postati`, `doći`, `otići`, `htjeti`, `dobiti` as ordinary vocabulary with example sentences. NO aspect theory is taught here.
4. Every LessonScreen presentation, after every 3 new vocabulary items, interrupts with a 2-question micro-quiz testing recall of the items just shown. Wrong answers show the correct answer without XP loss; correct answers award +2 XP.
5. The level quiz (success-criterion #1) is a new component; the micro-quiz (success-criterion #4) is also new.
6. All new code follows the existing Exercise Contract where applicable.

## Out of scope (Sub-Project 1)

- Aspect theory rewrite at B1 (deferred to a future curriculum-polish sub-project)
- Reordering of case lessons by frequency (deferred — L-05)
- Register awareness tags (deferred — L-07)
- Dialect markers in vocabulary (deferred — L-09)
- Pitch accent discovery path (deferred — L-10)

## A. Mastery gates (L-01)

### Data model

Add to `Stats` type at `src/types/index.ts`:

```ts
levelQuizPasses: Record<number, { score: number; passedAt: number }>;
```

This persists per-level quiz pass state. Indexed by the level number (1-7 corresponding to LEARN_PATH's 7 levels). `score` is 0-10 (questions correct out of 10). `passedAt` is ms since epoch.

Firestore sync: include `levelQuizPasses` in `buildProgressSnapshot()`. Merge rule: latest-wins per level (a re-attempt with higher score should replace).

### Mastery threshold

For each level $n$ to unlock level $n+1$:

1. **Item completion threshold:** ≥80% of LEARN_PATH items within level $n$ must be marked complete (per existing `ck(stats)` logic — `stats.vs.includes(item.id)` or the `lc/gc` counter fallback).
2. **Level quiz pass:** `stats.levelQuizPasses[n]?.score >= 7` (i.e., ≥70% on the 10-Q level quiz).

Both conditions must hold. If only condition 1 is met, the UI shows "Take the Level Quiz to unlock Level N+1." If only condition 2 is met (unlikely but possible via direct quiz attempt), the UI shows "Complete N more items to unlock Level N+1."

### UX

`LearnPath.tsx` (or wherever level boundaries render):

- Levels the user has completed (both conditions met): unlocked, fully interactive.
- Current level: unlocked.
- Locked future levels: greyed out with a 🔒 icon, click shows "Complete Level N to unlock" toast.
- Just below the current level's last item, render a **Level Quiz CTA panel**:
  - Shows when item completion threshold is met
  - Format: "🎓 Level N Quiz — 10 questions, mixed from items you've studied"
  - Click → opens LevelQuiz screen

### Level quiz component

New screen: `src/components/learn/LevelQuiz.tsx`.

Structure mirrors the existing grammar drill pattern (DativeDrill canonical reference): 10 multiple-choice questions, score-based, with a final results screen.

Question sourcing: pull 10 items at random from the level's vocabulary + grammar concepts. Each item produces 1 MC question by pairing with 3 distractors from elsewhere in the level. Reuses existing `_buildAdaptivePool` patterns where applicable.

On completion:
- Update `stats.levelQuizPasses[n]` with score + passedAt
- Award XP per existing Exercise Contract: `award(score × 5, 'grammar')` (so 70/100 minimum, 50 XP)
- If passed (score ≥ 7): show celebration + "Level N+1 unlocked"
- If failed (score < 7): show encouragement + "Try again — review weak items first"

### Edge cases

- **Existing users with old data:** users may have `lc/gc` counts indicating completion but no `levelQuizPasses` entry. Grandfather them: any level whose item-completion-condition is met treats the quiz as auto-pass for that level only. They can take quizzes voluntarily but aren't blocked. This avoids regression on returning users.
- **Quiz attempts limit:** none. Repeated attempts allowed; latest score wins (overwrite).
- **Quiz item shortage:** if a level has fewer than 10 distinct vocab/grammar items, generate a shorter quiz (minimum 5 Qs) and use a proportionally lower pass bar (still 70%).

## B. A2 perfective verbs lesson (L-02)

### Curriculum position

Insert a new LEARN_PATH item at Level 2 (Pathfinder) immediately after `lp_present_tense` (verbs in the present tense) and before `lp_questions_a2` (question words). This places perfective verbs alongside basic verbs without disrupting the existing flow.

ID: `lp_perfective_verbs_a2`
Title: "Useful Perfective Verbs"
go: 'lesson' (uses the existing LessonScreen)
topic: 'perfective_verbs_a2' (new key in the vocabulary system)

### Vocabulary

Add to `src/data/vocabulary.js` under key `perfective_verbs_a2`:

```js
['moći', 'to be able to / can', 'MOH-chee', 'Mogu ti pomoći. (I can help you.)'],
['trebati', 'to need to', 'TREH-bah-tee', 'Trebam vode. (I need water.)'],
['postati', 'to become', 'POH-stah-tee', 'Postao je liječnik. (He became a doctor.)'],
['doći', 'to come / arrive', 'DOH-chee', 'Doći ću sutra. (I will come tomorrow.)'],
['otići', 'to leave / go away', 'OH-tee-chee', 'Otići ćemo u 5. (We will leave at 5.)'],
['htjeti', 'to want to', 'HTYEH-tee', 'Hoću kavu. (I want coffee.)'],
['dobiti', 'to receive / get', 'DOH-bee-tee', 'Dobio sam poklon. (I got a gift.)'],
```

(Exact phoneticization to confirm; format matches existing vocabulary entries.)

### Lesson framing

The lesson explicitly does NOT teach aspect. It teaches each verb as ordinary vocabulary with one form (the perfective infinitive) and example sentences using future/past where the perfective is natural.

Lesson intro line (rendered as the first slide or H1 of the screen): "These 7 verbs are super useful. You'll learn more about how Croatian verbs work later — for now, just learn what each one means and try them in sentences."

This intentionally pre-empts the question "wait, what about the imperfective?" by deferring the answer.

## C. Test-while-learning micro-quizzes (L-04)

### Trigger

Modify `LessonScreen.tsx`. After every 3 vocabulary items presented, automatically transition to a **MicroQuiz** screen showing 2 questions testing recall of the items just shown.

Specifically: if `lessonItems.length` is 12, the user sees 4 micro-quizzes (after items 3, 6, 9, 12). The last micro-quiz precedes the existing lesson summary.

### MicroQuiz component

New component: `src/components/learn/MicroQuiz.tsx`.

Structure:
- 2 questions drawn from the just-shown items
- Each question: show Croatian word, 4 English options (1 correct + 3 distractors from elsewhere in lesson)
- No timer, no streaks, no failure state
- Correct answer: +2 XP, brief positive feedback (e.g., "✓ Good!"), auto-advance
- Wrong answer: show the correct one in green, no XP loss, click-to-continue
- After 2 questions, return to LessonScreen at the next item

### XP and contract

MicroQuiz does NOT follow the full Exercise Contract — it's a sub-component within a lesson, not a standalone exercise.

It does NOT call `markQuest`, `setStats(vs)`, or `writeDelta`. It only awards XP via the existing `award` prop. The lesson's normal completion (already contract-compliant) handles the broader bookkeeping.

### Cognitive load constraint

Per audit L-08, lessons should cap new items at 7-9. If a lesson has fewer than 6 items, skip the micro-quiz entirely (not enough material). Trigger only when ≥6 new items in the lesson.

### Off switch

Add a setting in Profile → Settings: "Micro-quizzes during lessons" toggle (default ON). Users who find the interruption annoying can disable. Stored in `localStorage` under `nh_microquiz_enabled`.

## D. Data flow

```
User completes Level 1 items (vs[], lc/gc track this)
  ↓
LearnPath.tsx renders Level 1 with 80%+ progress
  ↓
Level Quiz CTA appears
  ↓
User clicks → LevelQuiz screen
  ↓
10 MC questions, score recorded
  ↓
On pass (≥7/10):
  - setStats({ levelQuizPasses: { 1: { score, passedAt } } })
  - writeDelta({ levelQuizPasses: { 1: { score, passedAt } } })
  - award(score × 5, 'grammar')
  - Celebration + "Level 2 unlocked"
  ↓
Firestore sync persists levelQuizPasses
  ↓
LearnPath.tsx now treats Level 2 as unlocked
```

For micro-quizzes:

```
User starts Lesson with N items
  ↓
After every 3 items presented:
  - LessonScreen yields to MicroQuiz with 2 questions
  - User answers
  - Returns to LessonScreen
  ↓
At lesson end:
  - Existing lesson-completion logic fires (unchanged)
```

## E. Testing strategy

### Unit tests

- `LevelQuiz.test.tsx`: renders with 10 Qs, walking through scores updates `levelQuizPasses` correctly, passes when ≥7, fails when <7
- `MicroQuiz.test.tsx`: renders 2 Qs, correct answer awards 2 XP, wrong answer reveals correct
- `LearnPath.test.tsx`: locked levels show 🔒 icon, unlock CTA appears when threshold met, level quiz cleared lets user advance

### Integration tests

- Existing `useDailySession.test.ts` to verify level-quiz progression doesn't break daily session
- E2E test: complete Level 1 items → click quiz → pass → Level 2 unlocks (Playwright)

### Manual smoke

- Run dev server, create fresh user account, verify Level 1 → quiz → Level 2 flow end-to-end

## F. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Existing users hit level locks unexpectedly | Grandfather rule: existing item-completion auto-passes the quiz for that level |
| Quiz CTA never appears (item-completion threshold buggy) | Add a debug/dev "Force unlock" button visible only in DEV mode |
| MicroQuiz feels punishing | Off-switch toggle in Profile → Settings; defaults to ON but easy to disable |
| Aspect-A2 lesson misleads users about aspect | Lesson intro line explicitly defers aspect discussion to B1 |
| Quiz item shortage for low-content levels | Minimum 5 Qs; if level has <5 items, mastery requires only completion (no quiz) |

## G. Acceptance checklist

- [ ] `Stats` type extended with `levelQuizPasses`
- [ ] `buildProgressSnapshot()` includes `levelQuizPasses`
- [ ] Firestore security rules allow `levelQuizPasses` writes with proper type validation
- [ ] `LevelQuiz.tsx` component created, follows MC question structure
- [ ] `MicroQuiz.tsx` component created
- [ ] `LearnPath.tsx` shows lock state + Level Quiz CTA per the spec
- [ ] New A2 lesson `lp_perfective_verbs_a2` added to LEARN_PATH at correct position
- [ ] Vocabulary key `perfective_verbs_a2` populated with 7 verbs
- [ ] `LessonScreen.tsx` triggers MicroQuiz after every 3 items (≥6-item lessons only)
- [ ] Profile → Settings: micro-quiz toggle, defaults ON
- [ ] All new code follows Exercise Contract clauses where applicable
- [ ] Tests pass (unit + integration + manual smoke)
- [ ] Lint + typecheck clean

## H. References

- Audit: in-conversation results (this session, 2026-05-13)
- Memory: `croatian_pedagogy_expertise.md` (CEFR acquisition, aspect order)
- Memory: `expert_ux_learning_science.md` (retrieval practice, cognitive load)
- Existing canonical: `src/components/practice/DativeDrill.tsx` (Exercise Contract reference)
- LearnPath integration: `feedback_learnpath_launch.md` (use `launchPathItem`, never `setScr`)
