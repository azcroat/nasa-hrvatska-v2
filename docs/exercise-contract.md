# Exercise Contract

Every grammar/case/tense/aspect/clitic/preposition/conjugation drill in this codebase MUST follow the contract below. The contract is enforced by `src/tests/exerciseContract.test.tsx`. A drill that does not comply will fail CI.

## The 8 clauses

1. **Active testing.** N multiple-choice questions where the user selects an answer that is graded right/wrong. "Click to reveal" is not testing. Default N = 20.
2. **Single XP award on completion.** Drill calls `award(score × MULTIPLIER, 'grammar')` exactly once on completion. MULTIPLIER defaults to 5 (perfect 20/20 = 100 XP). Per-question XP is forbidden.
3. **Idempotency guard.** A `finishFired = useRef(false)` guards the completion block. Re-mounts MUST NOT double-award.
4. **Quest marker.** `markQuest('grammar')` called inside the completion block.
5. **`gc` + `vs:[]` tag.** `setStats` increments `gc` and appends the case/topic identifier to `vs[]`, guarded by `!prev.vs?.includes(tag)`.
6. **`writeDelta` sync.** Completion also calls `writeDelta({ gc: 1, vs: [tag] })` to push the delta into the Firestore sync layer.
7. **Final results screen.** "Done" state shows score (N/total), encouraging message keyed to percentage, back button.
8. **`markDone` integration.** Drill triggers daily-session `markDone(curEx)` on completion. The existing `goBack()` flow in HomeTab handles this if the drill calls `goBack()` after `award()`; new drills MAY rely on that flow and SHOULD NOT call `markDone` directly unless the screen is not part of the daily session.

## Canonical reference

`src/components/practice/DativeDrill.tsx` — copy its structure for new drills. Lines 165–305 show the complete state-machine + completion-block pattern.

## Adding a new drill

1. Create `src/components/practice/<Case>Drill.tsx` mirroring `DativeDrill.tsx`.
2. Author 20 multiple-choice Q&A in the `DATA` const at top of file.
3. Use a unique tag in `vs:['<case-name>']`.
4. Register in `src/components/AppRouter.tsx` (lazy import + screen-id case).
5. Add to `src/hooks/useDailySession.ts` `CEFR_EXERCISE_POOL` with appropriate category.
6. Add to `src/tests/exerciseContract.test.tsx` GRAMMAR_DRILLS list.

## Adding a new drill — content authoring

Claude drafts Q&A from in-memory Croatian linguistic knowledge. jschr reviews in chat before commit. Do not commit Q&A that has not been reviewed.
