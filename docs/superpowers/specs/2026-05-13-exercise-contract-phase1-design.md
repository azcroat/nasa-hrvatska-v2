# Exercise Contract & Padež Coverage — Phase 1 Design

**Date:** 2026-05-13
**Author:** Claude Opus 4.7 (1M context), with jschr direction
**Status:** Approved verbally; pending written-spec review before implementation plan

## Problem statement

The user reports two concrete symptoms in `Dnevna Vježba` (Daily Exercise):

1. The "Genitive" session has repeated 5–6 times in recent days.
2. The Accusative exercise has no quiz, never captures XP cleanly, never registers completion.

Root-cause investigation found:

- **Genitive repeat** is a *category-tagging bug*, not a content shortage. Six entries in `useDailySession.ts CEFR_EXERCISE_POOL` are tagged `category: 'genitive'`, but only one (`prepdrill`) is genuinely genitive-focused. The adaptive engine therefore ranks "genitive" as the user's weakest area forever (the bucket is too broad to ever empty) and keeps recommending it as Priority 2.
- **Accusative gap** is a *contract violation*. `practice/exercises/AccusativeDrillScreen.tsx` is a passive "click to reveal" exercise: it awards 2 XP per click (not on completion), never sets `vs:['accusative']`, never marks an end state. By contrast, six other case/grammar drills (DativeDrill, InstrumentalDrill, PassiveDrill, CliticDrill, ImperativeDrill, NegationGenDrill) follow a consistent quiz pattern.

The bug is not "one screen was lazy" — it's "no enforced contract." Drills were built ad-hoc, six landed correctly, others drifted.

## Goals

User's stated long-term goal:

> "All exercises have quizzes, all those quizzes are capturing XP points and registering completed when done."

Phase 1 delivers this for **grammar/case/tense/aspect/clitic/preposition/conjugation drills** only (~15 screens). Non-grammar exercises (Flashcards, Speaking, Story, Listening, Writing, SRS Review) deferred to Phase 2. LearnPath integration into Today's Session deferred to Phase 3.

## Success criteria

A Phase 1 implementation is complete when:

1. Every grammar/case/tense drill listed in §D below follows the Exercise Contract (§A).
2. A new contract test (`tests/exerciseContract.test.tsx`) renders each grammar drill, simulates a full completion, and asserts the contract holds.
3. The Genitive bucket in `CEFR_EXERCISE_POOL` is honest: only entries that genuinely teach genitive carry that category tag.
4. Three new drills exist (GenitiveDrill, NominativeDrill, LocativeDrill), each with 20 reviewed Croatian Q&A.
5. `AccusativeDrillScreen` is fully replaced with a quiz-pattern drill.
6. Manual smoke test: start a fresh daily session, observe that the same category is not assigned in 5 consecutive runs once stats are reasonable.

## Out of scope (Phase 1)

- Refactoring the six gold-standard drills into a shared `QuizScaffold` component (Phase 2 candidate).
- Adding quiz checkpoints to Flashcards / Speaking / Story / Listening / Writing / SRS Review (Phase 2).
- Integrating LearnPath items as chips in the Today's Session card (Phase 3).
- Improving grammar *content* outside the drills (Padežifull screen, GrammarTrack lessons).

---

## A. The Exercise Contract

Every grammar/case/tense/aspect/clitic/preposition/conjugation drill MUST implement this contract. The contract is documented in `docs/exercise-contract.md` (a new file) and enforced by `tests/exerciseContract.test.tsx`.

**Contract clauses:**

1. **Active testing.** The drill MUST present N multiple-choice questions where the user selects an answer that is graded right/wrong. "Click to reveal" is not testing. Default N = 20.
2. **Single XP award on completion.** When the user reaches the final question and submits an answer (or clicks "See results"), the drill calls `award(score × MULTIPLIER, 'grammar')` exactly once. Per-question XP is forbidden. MULTIPLIER defaults to 5 (so a perfect 20/20 = 100 XP).
3. **Idempotency guard.** A `finishFired = useRef(false)` guards the completion block. Re-renders or re-mounts MUST NOT double-award.
4. **Quest marker.** `markQuest('grammar')` is called inside the same completion block.
5. **`gc` increment + `vs:[]` tag.** Inside the completion block, the drill calls `setStats` to bump `gc` and append the case/topic identifier to `vs[]` — guarded by `!prev.vs?.includes(tag)` so re-doing the drill the same day doesn't double-count.
6. **`writeDelta` sync.** The completion block also calls `writeDelta({ gc: 1, vs: [tag] })` to push the delta into the Firestore sync layer.
7. **Final results screen.** A "done" state shows: score (N/total), encouraging message keyed to score percentage, and a back button (or "Next Lesson" CTA where the drill is part of LearnPath).
8. **`markDone` integration.** On completion, the drill calls `useDailySession.markDone(curEx)` exactly once, passing its registered screen id. This is the explicit hook that flips the session chip to done state. The drill MUST NOT rely on `markQuest` to indirectly trigger session completion — `markQuest` and `markDone` are separate concerns.

**Canonical reference:** `src/components/practice/DativeDrill.tsx`. New and fixed drills MAY copy its structure verbatim — content array + state machine.

## B. Category re-tagging (the Genitive fix)

`src/hooks/useDailySession.ts` `CEFR_EXERCISE_POOL` changes:

| Exercise | From | To | Reason |
|---|---|---|---|
| `cloze` | `genitive` | `vocab-a2` | General sentence-completion drill |
| `unjumble` | `genitive` | `vocab-a2` | Word-order drill, no case focus |
| `sentbuild` | `genitive` | `vocab-a2` | General sentence construction |
| `sentencetiles` | `genitive` | `vocab-a2` | Tile-assembly, neutral |
| `negation` | `genitive` | `genitive` (KEEP) | Croatian negation genuinely requires genitive (`Nemam knjige`) — pedagogically correct |
| `prepdrill` | `genitive` | `genitive` (KEEP) | Genitive prepositions iz/od/do/bez — correct |

Add three new pool entries (matching new drills in §C):

```ts
{ id: 'genitivedrill', label: 'Genitive Case', screen: 'genitivedrill', cefr: 'A2', category: 'genitive' },
{ id: 'nomdrill', label: 'Nominative Case', screen: 'nomdrill', cefr: 'A1', category: 'vocab-a2' },
{ id: 'locdrill', label: 'Locative Case', screen: 'locdrill', cefr: 'B1', category: 'dative-locative' },
```

`CATEGORY_SCREEN_MAP` change:

```ts
genitive: 'genitivedrill',  // was: 'prepdrill'
accusative: 'accusativedrill',  // was: 'akudrill' — confirm screen id during impl
```

Side-effect / acceptable consequence: an existing user's adaptive "genitive" score will now reflect performance on dedicated genitive content only, not on five unrelated drills. This is the desired correction; the previous score was the bug.

## C. Three new drills

Each new drill is a `.tsx` file under `src/components/practice/`, follows the Exercise Contract verbatim from `DativeDrill.tsx`, and ships with **20 Croatian Q&A** authored by Claude from the linguistic knowledge in `~/.claude/projects/C--Windows-system32/memory/croatian_linguistics_expertise.md` and `croatian_pedagogy_expertise.md`, then reviewed by the user before commit.

### C1. GenitiveDrill (`src/components/practice/GenitiveDrill.tsx`, screen `genitivedrill`, CEFR A2)

Content focus:
- **Possession** (`knjiga moga brata` — my brother's book)
- **Partitive** (`čaša vode` — a glass of water)
- **Negation** (`nemam vremena` — I don't have time)
- **Prepositions** (iz, od, do, bez, kod, blizu, oko)
- **Quantity** (`puno ljudi`, `malo novca`)
- **Dates / time** (`drugog svibnja`)

20 Q split: 6 possession, 4 partitive, 4 negation, 4 prepositions, 2 quantity.

### C2. NominativeDrill (`src/components/practice/NominativeDrill.tsx`, screen `nomdrill`, CEFR A1)

Content focus:
- **Subject identification** (`Ana čita` — Ana reads)
- **Predicate nominative** (`On je liječnik` — he is a doctor)
- **Identity statements with `to je / ovo je`**
- **Plural subjects** (`djeca trče`)
- **Gender recognition** (masc/fem/neut nominative endings)

20 Q split: 6 subject ID, 5 predicate nom, 4 plural, 5 gender recognition.

### C3. LocativeDrill (`src/components/practice/LocativeDrill.tsx`, screen `locdrill`, CEFR B1)

Content focus:
- **Location** (`u kući`, `na stolu`, `pri kraju`)
- **Topic/about** (`govorim o knjizi`, `pišem o tebi`)
- **Time periods** (`u prosincu`, `u petak`)
- **Prepositions** (u, na, o, po, pri)
- **Beyond cities** — existing `CityLocativeScreen` only covers location with cities; this drill covers all 5 locative prepositions

20 Q split: 6 location, 4 topic, 3 time, 7 mixed prepositions.

### Sample Q&A format (for one Genitive question)

```ts
{
  q: 'Pijem čašu ___.',
  opts: ['vode', 'voda', 'vodi', 'vodom'],
  answer: 'vode',
  en: 'I drink a glass of water.',
  tip: "Partitive after a measure noun ('čašu') takes genitive: voda → vode",
},
```

Same shape as `DativeDrill.tsx` lines 17–158 — drop-in compatible.

## D. Broken drill fixes

### D1. AccusativeDrillScreen — full replace

Path: `src/components/practice/exercises/AccusativeDrillScreen.tsx`.
Action: **delete file**, replace with a new `AccusativeDrill.tsx` at `src/components/practice/AccusativeDrill.tsx` following the contract.

Content focus (20 Q):
- **Animate vs inanimate masculine** (`vidim brata` vs `vidim stol`)
- **Feminine -a → -u** (`jedem juhu`)
- **Verbs governing accusative** (`voljeti`, `imati`, `čitati`, `kupiti`, `gledati`)
- **Accusative after prepositions of motion** (`u školu`, `na posao`, `kroz park`)
- **Pronouns** (`mene/me`, `tebe/te`, `njega/ga`)

20 Q split: 5 animate/inanimate, 6 fem -a → -u, 5 verb governance, 4 prepositions/pronouns.

**Screen-id rename:** The existing `CATEGORY_SCREEN_MAP` maps `accusative → 'akudrill'`. As part of the rewrite, rename the screen identifier to `accusativedrill` so the codebase reads honestly:
- `useDailySession.ts`: `CATEGORY_SCREEN_MAP.accusative = 'accusativedrill'`, `CEFR_EXERCISE_POOL` entry `screen: 'accusativedrill'`, `id: 'accusativedrill'`.
- `useScreenLauncher.ts`: register `'accusativedrill'` to the new component.
- Grep the codebase for `'akudrill'` (quoted), `akudrill`, `'aku'` and update all references (tests, e2e specs, quest definitions).
- This is a breaking change for any user whose `localStorage.getItem('nh_recent_exercises')` contains `'akudrill'` — acceptable, since the old screen was broken anyway. The recent-exercises filter degrades gracefully (an unknown id just doesn't match anything).

### D2. PrepDrill — add `vs:` + fix XP

File: `src/components/practice/PrepDrill.tsx`.
Changes:
- Replace conditional-threshold XP with `award(score × 5, 'grammar')` on completion.
- Add `vs:['preposition']` guard pattern matching DativeDrill lines 188–199.
- Verify `markQuest('grammar')` is called.

### D3. ConjugationDrill — align

File: `src/components/practice/ConjugationDrill.tsx`.
Action: full audit during implementation. Confirm:
- `award` is called once on completion with non-zero amount.
- `markQuest('grammar')` is called.
- `vs:['conjugation']` is appended.
- `gc++` happens once.

Fix anything that drifts.

### D4. AspectDrillScreen — align

File: `src/components/practice/AspectDrillScreen.tsx`.
Action: full audit; same checklist as D3 with `vs:['aspect']`.

## E. Content authoring flow

1. Claude drafts Croatian Q&A for the three new drills + the Accusative replacement (~80 Q total).
2. Before commit, Claude pastes the drafted Q&A in chat for jschr review.
3. jschr reviews for Croatian accuracy and pedagogical relevance, makes corrections inline.
4. Claude commits the reviewed content only.

This satisfies the user's hard rule: "verify before committing, ask before shipping uncertain code" (`feedback_no_apologies_do_it_right.md`).

## F. Testing strategy

### F1. Contract test (new)

`src/tests/exerciseContract.test.tsx` — a single Vitest file that imports every grammar drill, renders it, drives it through full completion via React Testing Library, and asserts:

```ts
expect(awardMock).toHaveBeenCalledTimes(1);
expect(awardMock).toHaveBeenCalledWith(expect.any(Number), 'grammar');
expect(awardMock.mock.calls[0][0]).toBeGreaterThan(0);
expect(markQuestMock).toHaveBeenCalledWith('grammar');
expect(setStatsMock).toHaveBeenCalledWith(expect.objectContaining({ gc: expect.any(Number) }));
// vs[] check via spy on writeDelta
```

Drills covered: DativeDrill, InstrumentalDrill, PassiveDrill, CliticDrill, ImperativeDrill, NegationGenDrill, NEW GenitiveDrill, NEW NominativeDrill, NEW LocativeDrill, NEW AccusativeDrill, fixed PrepDrill, fixed ConjugationDrill, fixed AspectDrillScreen. ~13 drills.

If any drill fails the contract test, the test fails the CI gate. The contract is no longer informal.

### F2. Per-drill smoke

A short unit test per new drill that walks through 3 questions and asserts the state machine advances correctly. Existing pattern in `src/tests/` is sufficient; mirror it.

### F3. Manual verification

After implementation, run the daily session driver locally with mock CEFR levels (A1, A2, B1) and inspect:

- The Genitive bucket in CEFR_EXERCISE_POOL filtered to genitive-tagged entries contains only `prepdrill`, `negation`, `genitivedrill`.
- A simulated user with high genitive error count gets `cat_genitive` activity routed to `genitivedrill` (not `prepdrill`).
- Each new drill launches cleanly from the daily session, completes, awards XP, and the session's `completedIds` includes its `id`.

## G. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Re-tagging changes adaptive scores in a way that confuses returning users | Acceptable; the previous score was the bug. Surface a one-line note in changelog. |
| `akudrill → accusativedrill` rename breaks deep links / quest tracking | Grep all references; update tests, routing, quest definitions in same commit. |
| Croatian content errors despite linguistic memory | The pre-commit review by jschr is the gate. No content commits without paste-review. |
| Contract test is brittle (state machines vary slightly per drill) | Use a thin helper `completeDrillVia(component)` that finds buttons and clicks through; keep per-drill assertions identical. |
| AspectDrillScreen has a deeply different structure that doesn't fit the contract | If discovered, scope out of Phase 1 and document why; do not contort the contract. |

## H. Phase 2 / Phase 3 placeholders (not implemented here)

**Phase 2** — non-grammar exercise checkpoints:
- Flashcards: 5-Q recall quiz at end of deck.
- Speaking: graded prompt completion (count attempts hitting target word count).
- Story: 3-Q comprehension at end.
- Listening: 3-Q comprehension at end.
- Writing: rubric-based completion (word count threshold + tense usage check).
- SRS Review: already has graded responses — formalize as contract-compliant.

**Phase 3** — LearnPath in Today's Session:
- Add a 6th chip ("Lesson") to SessionCard showing the next LearnPath item.
- Click → `launchPathItem()` (per `feedback_learnpath_launch.md`, never `setScr()`).
- Mark the chip done when the LearnPath item completes, contributing to session progress.

## I. Acceptance checklist (Phase 1 ship gate)

- [ ] `docs/exercise-contract.md` exists and documents clauses 1–8.
- [ ] `tests/exerciseContract.test.tsx` passes for all 13 drills.
- [ ] `useDailySession.ts` `CEFR_EXERCISE_POOL` re-tagged per §B.
- [ ] `CATEGORY_SCREEN_MAP` updated per §B.
- [ ] `GenitiveDrill.tsx`, `NominativeDrill.tsx`, `LocativeDrill.tsx`, `AccusativeDrill.tsx` exist and follow contract.
- [ ] `AccusativeDrillScreen.tsx` (old file in `exercises/`) deleted.
- [ ] `akudrill` references replaced with `accusativedrill` throughout the codebase.
- [ ] `PrepDrill.tsx`, `ConjugationDrill.tsx`, `AspectDrillScreen.tsx` updated to contract.
- [ ] All Croatian Q&A reviewed by jschr in chat before commit.
- [ ] `npm test` green, `npx tsc --noEmit` green, `npm run lint` green.
- [ ] Manual: daily session smoke test on local dev server.

## J. References

- Canonical pattern: `src/components/practice/DativeDrill.tsx`
- Memory: `croatian_linguistics_expertise.md`, `croatian_pedagogy_expertise.md` (paradigms, pedagogical sequencing)
- Memory: `feedback_learnpath_launch.md`, `feedback_learnpath_design_intent.md`, `feedback_no_apologies_do_it_right.md`, `feedback_root_cause_first.md`
- Skill: `skill_nasa_hrvatska_architecture.md` (curEx system, state location)
