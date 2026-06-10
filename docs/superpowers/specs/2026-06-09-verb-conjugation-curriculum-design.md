# Verb Conjugation Curriculum — Design Spec

**Date:** 2026-06-09
**Status:** Approved design, pre-implementation
**Author:** Claude (brainstormed with jschr)

## Problem

Croatian verb conjugation is under-taught and under-drilled across A1–B2. The app
has verb material, but it is structurally weak in three ways:

1. **Recognition-only, shallow drills.** `ConjugationDrill.tsx` (`conjdrill`) and
   `VerbDrillScreen.tsx` are tap-to-pick MCQ with random same-verb distractors —
   they train recognition of a form, not the conjugation *system*.
2. **Tiny, lopsided dataset.** `CONJ` in `functions/api/content/_data/grammar.js`
   has 15 present-tense verbs but only **3 past** and **3 future** verbs, and past
   tense stores **only the masculine-singular l-participle** (`čitao sam`) — never
   `čitala/čitalo/čitali`. No imperative, conditional, or aspect data.
3. **No repetition machinery.** Conjugation is a one-off optional drill. It is never
   fed into the FSRS-4.5 spaced-repetition engine (`src/lib/srs.js`) that already
   powers vocabulary, so nothing is "hammered."

The structured grammar-units system (`grammarAdvanced.js`) is rich but entirely
**B2/C1** (passive, participles, kondicional II, etc.) — there is no A1–B2
conjugation *foundation* curriculum.

## Goals

- Teach the conjugation **system** (verb classes, agreement, aspect), not 37
  memorized cells.
- Deep coverage A1→B2: present (3 classes), biti, irregulars, negation, past
  (perfekt with gender agreement), future I, modals, imperative, conditional I,
  reflexives, and aspect (pairs, aspect×tense interaction, motion+prefixes).
- **Hammer it in**: every conjugation cell becomes a spaced-repetition card, and a
  mandatory daily conjugation set surfaces on Home / in the daily challenge.
- Keep the answer interaction **multiple-choice**, but make distractors
  morphologically intelligent so the wrong answers *are* the lesson.

## Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Answer mode | **Multiple-choice** (deeper, smart distractors) | Lowest friction on mobile; reuses existing MCQ infra; smart distractors deliver real teaching without typing/diacritic-validation complexity. |
| Scope | **Full conjugation curriculum** | 16 units, ~45–55 verbs, explainers + drills + mastery tracking. |
| Repetition | **Daily set + FSRS spaced-repetition backbone** | Forced daily reps drawn from the adaptive due-queue. |
| Aspect | **Integrated** | Aspect is central to Croatian; conjugate pairs and teach aspect×tense. |

## Non-Goals (YAGNI)

- **No typed/production answers** in v1 (explicitly deferred — MCQ chosen).
- **No automatic form generation** at runtime. All forms are stored explicitly so
  nothing displayed is ever wrong (matches the project's zero-tolerance-for-errors
  standard). A generation script may be used as an *authoring aid* only, with every
  output verified before commit.
- **No new explainer screens** where one already exists — reuse `TensesScreen`,
  `PastTenseLessonScreen`, `FutureTenseLessonScreen`, `AspectScreen`,
  `ConditionalScreen`, `ModalScreen`.
- **No C1/C2 conjugation** — that tier is already covered by `grammarAdvanced.js`.

## Architecture

Chosen approach: **"Conjugation Lab"** — a unified hub backed by a single reusable
drill engine, a rich verb dataset, a distractor generator, and an SR/daily-set
layer. Clean separation of concerns; each unit independently testable.

```
ConjugationLab.tsx                 ← hub: curriculum map (16 units) + per-verb mastery
  ├─ (explainer)                   ← reuse existing screens per unit; link out
  └─ ConjugationDrillEngine.tsx    ← reusable MCQ engine (one prompt → 4 options → why)
        ├─ lib/conjugation/distractors.ts   ← morphological confusion model
        ├─ lib/conjugation/dailySet.ts      ← selects daily items (due SR first, top up new)
        ├─ lib/conjugation/cardKey.ts        ← stable SR card-key scheme
        └─ lib/srs.js (existing FSRS-4.5)    ← getSRScore / due queue
```

### Data model

New canonical verb record. Stored **explicitly** for every cell; aspect-aware.

```ts
interface ConjVerb {
  inf: string;            // 'pisati'
  en: string;             // 'to write'
  aspect: 'impf' | 'pf' | 'bi';   // imperfective / perfective / biaspectual
  pair: string | null;   // aspect partner infinitive: 'napisati' (or null)
  klass: string;         // present-class teaching label: 'a-am' | 'a-em' | 'i-im' | 'irr'
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  irregular: boolean;
  note?: string;         // e.g. 'present stem palatalizes s→š'

  present?: string[];    // [ja, ti, on/ona, mi, vi, oni] — 6
  past?: {               // perfekt: l-participle + auxiliary, gender/number aware
    m: string[];         // pisao sam, pisao si, pisao je, pisali smo, pisali ste, pisali su
    f: string[];         // pisala …, pisale …
    n: string[];         // pisalo … (sg); plural neut pisala …
  };
  future1?: string[];    // futur I: pisat ću, …
  imperative?: string[]; // [2sg, 1pl, 2pl]: piši, pišimo, pišite
  conditional?: string[];// pisao bih, … (gender handled like past; store masc baseline + note)
}
```

Notes:
- **Past tense** is the auxiliary (sam/si/je/smo/ste/su) + the l-participle, which
  agrees in gender & number. We store the m/f/n form sets explicitly rather than
  generating, because irregulars (išao/išla — note the dropped `o`) make generation
  unsafe. With ~50 verbs the data is small and auditable.
- **Backward compatibility:** the legacy `CONJ` export (shape `{verbs:[{inf,en,tense,forms[6]}], persons[6]}`)
  must keep working — `ConjugationDrill.tsx` and existing tests depend on it, and old
  `curEx` values must not be orphaned. The new dataset is a **new export**
  (working name `VERBS`) served via the same `/api/content/grammar` endpoint; the old
  `CONJ` is either left as-is or derived from `VERBS` by a compat shim. Do not remove `CONJ`.

### Drill engine (MCQ with morphological distractors)

For a target cell `(verb, form-type, person[, gender])`:

- **Prompt** shows: infinitive + English + pronoun + a tense/mood badge, e.g.
  `pisati (to write) — JA — PAST (m)`.
- **Correct answer** = the stored form for that cell.
- **Distractors** (3) drawn by priority from a confusion model, never random:
  1. wrong **person**, same verb+form-type (pišeš for *ja*)
  2. wrong **class ending** (pišam — applying `-am` to an `-em` verb) — the classic error
  3. wrong **tense/mood** (pišem vs pisao sam vs pisat ću)
  4. wrong **gender** participle (pisala for a male subject) — past/conditional only
  5. wrong **aspect** partner (napišem vs pišem) — when a pair exists
  The generator fills 3 slots from the highest-priority applicable categories and
  guarantees uniqueness and no accidental duplicate of the correct form.
- **Feedback**: on answer, show a one-line *why* (`✗ pišeš is ti; ja → pišem`).
- **Scoring** records the result into FSRS (correct/incorrect + response time) and into
  the existing `recordTopicResult('grammar', correct)` adaptive signal + `markQuest('grammar')`.

### Spaced-repetition backbone

- Each conjugation cell is an FSRS card. **Card key** (stable, parseable):
  `conj⟦<inf>⟧<formType>⟧<person>[⟧<gender>]` — e.g. `conj⟦pisati⟧past⟧ja⟧m`.
  `cardKey.ts` owns construction/parsing; `srs.js` already accepts arbitrary string keys
  via `getSRScore(word, correct, timeMs)`.
- **Granularity:** card per (verb × formType × person), gender folded into the past/
  conditional key only where it changes the form. This keeps the deck bounded
  (~50 verbs × ~4 form-types × 6 persons is too many to *force*, so the **daily set**
  caps exposure — see below — while the full deck remains the long-tail review pool).

### Daily conjugation set

- `dailySet.ts` builds a ~15-item set each day: **due conjugation SR cards first**,
  then topped up with new cells from the user's current (lowest-unmastered) unit.
- Surfaced on **HomeTab** and/or as a segment of the daily challenge; completion counts
  toward streak + quests (same award path as other exercises via `award()` / `markQuest`).
- The set is deterministic per day (seeded) so it survives reloads without reshuffling.

### Mastery & progression

- Per-verb, per-form-type mastery derived from FSRS stability (e.g. ✓ mastered / ◐
  learning / ✗ new) shown as rings in the hub.
- A unit unlocks the next when its cells cross a mastery threshold (exact threshold TBD
  in the plan; default proposal: 80% of the unit's cells at "learning" or better).
- **Mastery is user progress → Firestore** via `useSyncManager` (must survive device
  change, per the app's state-location rules). FSRS card state already syncs through the
  existing SR persistence path; verify conjugation cards ride that same path and add any
  mastery summary to `buildProgressSnapshot` if a derived summary is persisted.

### Integration points (existing code)

- `functions/api/content/_data/grammar.js` — add `VERBS` export (+ keep `CONJ`). Update
  `/api/content/grammar` payload + `src/types/content.ts` `Grammar` type + the etag in
  `functions/api/content/_data/_etags.js`.
- `src/lib/contentClient.ts` / `useGrammar` — expose the new `VERBS` field (no behavior
  change to existing consumers).
- New `curEx` values (e.g. `conjlab`, `conjdaily`) registered in **all three** required
  places per the architecture skill: the `curEx` value, `useScreenLauncher` rendering,
  and every enumeration of known exercises (search for an existing value like `'flash'`/
  `'conjdrill'`). Treat unknown `curEx` as "go home" (don't crash returning users).
- New components (Tier-2, additive): `src/components/practice/ConjugationLab.tsx`,
  `src/components/practice/ConjugationDrillEngine.tsx`.
- New libs: `src/lib/conjugation/{distractors,dailySet,cardKey}.ts` (no sync/auth coupling).
- Entry points: surface the Lab in PracticeTab and the daily set on HomeTab; respect
  `feedback_no_bottom_burial` (primary entry above the fold).

## Testing strategy

- **Data integrity test**: every `VERBS` record has the form arrays its `formType`s
  require, correct array lengths (present/past/future = 6, imperative = 3), no empty
  strings, valid `aspect`/`klass`, and `pair` (if set) resolves to another record.
- **Distractor generator unit tests**: returns exactly 3 unique distractors, never equal
  to the correct answer, prefers the high-priority confusion categories, and degrades
  gracefully when a category is inapplicable (e.g. no aspect pair).
- **Card-key round-trip test**: `parse(build(cell)) === cell`.
- **Daily-set tests**: caps at the configured size, prioritizes due cards, is
  deterministic for a given day-seed, tops up with current-unit cells.
- **Engine component test** (Playwright + existing patterns): render a drill, answer
  correct/incorrect, assert feedback + that a score/SR write fired. Follow
  `playwright-e2e-patterns` (colorScheme light, data-testid, audio stub) and verify
  every locator against real rendered output (avoid the flake-from-wrong-locator trap).
- **Backward-compat test**: legacy `CONJ` shape still loads and `ConjugationDrill.tsx`
  still works.

## Content accuracy

Croatian forms authored from in-memory expertise (per `feedback_skip_croatian_review`),
but conjugation is error-prone, so: forms are stored explicitly, covered by the data
integrity test, and spot-checked against the confusion-category logic. Any uncertain
form is flagged in `note` and resolved before commit — no fabricated or guessed cells.

## Open questions for the implementation plan

- Exact verb list (~45–55) and their unit assignments.
- Mastery threshold + the ✓/◐/✗ stability cutoffs.
- Whether the daily set is its own Home card or folded into the existing daily challenge.
- Whether `CONJ` is kept verbatim or derived from `VERBS` via a compat shim.

## Rollout

Additive and feature-flaggable. The Lab and daily set can ship behind a flag (mirroring
the checkpoint `CHECKPOINTS_ENABLED` pattern) so they can be enabled/disabled with a
one-line switch, and rolled out per CEFR tier (A1–A2 first, then B1, then B2).
