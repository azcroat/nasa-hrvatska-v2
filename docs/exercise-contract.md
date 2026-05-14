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

## Components that do NOT need contract compliance

The following are sub-components, helper panels, or rarely-trafficked screens. Contract clauses do not apply.

### Drill sub-components (rendered inside parent drills)
- AspectPhaseBar, AspectQuestionPanel, AspectRuleCard, AspectTimeline
- DialogueAvatar, DialogueResultsScreen, DialogueTipContent, DialogueGuidedMode, DialogueScenarioMenu, DialogueAiMode
- FlashcardCardBack, FlashcardCardFront, FlashcardEmptyState, FlashcardResultScreen, FlashcardRecallQuiz (parent `Flashcards.tsx` compliant)
- McGameOver, McQuestionArea, McResult (parent `McGame.tsx` compliant)
- SprintCountdownScreen, SprintFeedbackPhase, SprintModelPhase, SprintSetupScreen, SprintSpeakingPhase (parent `SpeakingSprintScreen` compliant)
- SlangAgeGate, SlangEntryCard, SlangQuizPanel (parent `SlangScreen` wraps these)
- SpeakingPracticePanel, SpeakingSummaryScreen (parents handle contract)
- StoryScreens (parent `GradedInputScreen` compliant per Phase 2 P2-3)
- ListeningComprehensionScreen, ListeningPath (parent `ListeningScreen` compliant per Phase 2 P2-4)

### Debug, list-view, tab containers, placement
- AdaptiveReviewScreen (review-mode wrapper, contract via parent)
- MyWordsScreen, MistakesScreen (list views, not exercises)
- PracticeTab (tab container, not an exercise)
- CefrTest (placement test — distinct flow; contract not applicable)

### Other modules
- All `learn/` screens — those are lessons, not exercises (see Pedagogy Foundations sub-project; `LevelQuiz` is a curriculum quiz with bespoke completion semantics, not a practice drill)
- `croatia/` AI conversation screens — covered in AI module sub-project

### Why this list matters

The Exercise Contract enforced by `src/tests/exerciseContract.test.tsx` covers ~30 practice exercises after SP2. Components listed above have valid reasons to not implement the contract:

- They're rendered inside a parent that owns completion semantics (sub-panels).
- They're list views or settings screens, not graded interactions.
- They're a distinct architectural surface (placement test, AI conversation, curriculum quiz).

If you add a new file under `src/components/practice/` (top-level OR `exercises/` subdir) that IS a standalone graded interaction, it MUST follow the contract. The contract test enforces this.

## vs-tag style convention

**New tags:** kebab-case, lowercase, descriptive. Examples: `dative`, `genitive`, `pronunciation-contrast`, `future-tense`.

**Legacy tags (do NOT rename):** The 10 tags below predate the kebab-case style convention. Several are dual-use as screen-IDs (renaming breaks `AppRouter.tsx` routing); all are persisted in user Firestore `vs:[]` arrays (renaming would orphan existing user progress). Leave them exactly as-is in all new code:

| Tag | Reason locked |
|---|---|
| `animateacc` | Dual-use: also the screen-ID for `AnimateAccDrill` |
| `falsefr` | Dual-use: also a screen-ID |
| `fleetinga` | Dual-use: also the screen-ID for `FleetingADrill` |
| `formalregister` | Dual-use: also a screen-ID |
| `grammarmap` | Dual-use: also a screen-ID |
| `padezifull` | Dual-use: also a screen-ID |
| `techvoc` | Dual-use: also a screen-ID |
| `srsreview` | Persisted in user data; rename would orphan `vs:['srsreview']` entries |
| `numtime` | Used in `FULL_CONTRACT_DRILLS`; rename would break contract test references and user data |
| `wordsprint` | Same as `numtime` |

Other pre-Phase-1 single-word tags also preserved as-is: `dative`, `clitic`, `passive`, `imperative`, `instrumental`, `negationgen`.

**If you must rename a legacy tag in a future migration:** add an explicit old → new mapping in `applyRemoteProgress.ts` that rewrites the value on first sync. Without that migration, returning users lose their progress for that tag permanently.
