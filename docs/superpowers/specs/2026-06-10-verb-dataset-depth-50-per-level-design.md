# Verb Dataset Depth — 50+ Verbs per Level — Design

**Date:** 2026-06-10
**Status:** Approved (brainstorming → spec)
**Builds on:** the conjugation engine + adaptive-session integration (`2026-06-09-*` and `2026-06-10-conjugation-session-integration-design.md`). This spec only grows the `VERBS` dataset and adds a correctness validator; it does not change the drill engine or the adaptive wiring, except one decoupling change to `cellsForCategory` (Unit 3).

## Goal

Grow `VERBS` to **~50 verbs anchored per CEFR level (~200 distinct total)**, each carrying the everyday-speaking tenses, so Today's Session drills a broad, level-appropriate verb set and learners integrate verbs into daily speech. Correctness is guarded by a **build-time morphology validator**. Ship **one level at a time, A1 first**.

## Decisions (from brainstorming)

1. **Form depth:** every verb gets **Present + Past + Future**; **B1/B2** verbs additionally get **Imperative + Conditional**.
2. **Correctness:** a **build-time morphology validator** derives expected regular forms from each verb's class + standard rules and fails the build on mismatch, except cells explicitly flagged irregular.
3. **Drill pool:** **decouple** `cellsForCategory` from curriculum unit verb-lists — drill from the full `VERBS` pool filtered by `cefr ≤ userCefr` + form-type. Curriculum units stay as the Lab teaching map.
4. **Verb count:** **50 anchored per level** (a verb lives at one level); **lower-level verbs remain drillable at higher levels** (cumulative availability). ≈200 distinct.
5. **Rollout:** **phased per level** (A1 → A2 → B1 → B2), each its own verified, shippable batch behind the live `CONJ_LAB_ENABLED` flag.
6. **`presentStem` field** added for the `a-em` (e-present) class.

## Current state (2026-06-10)

`functions/api/content/_data/grammar.js` `VERBS`: 17 total — A1:14 (all present; 4 with past/future/imperative, 3 conditional), A2:2 (`htjeti`,`moći`, present only), B1:0, B2:1 (`napisati`, present). Forms are explicitly stored; the data-integrity test (`verbsData.test.ts`) checks only **shape** (arrays of 6, no empty strings, valid `klass`/`aspect`/`cefr`), not correctness.

## Architecture

### Unit 1 — Schema additions (`src/lib/conjugation/types.ts`)

Add two optional fields to `ConjVerb`:
- `presentStem?: string` — the e-present stem for `a-em` verbs (e.g. `pisati` → `'piš'`). Used by the validator to derive present forms; required for `a-em` verbs, ignored otherwise.
- `irregularForms?: FormType[]` — per-form exemption list: form-types whose authored values are hand-trusted and **exempt from the validator's equality check** (still shape-checked). For wholly irregular verbs, prefer the existing `irregular: true` (exempts all forms). Use `irregularForms` when a verb is regular except one form (e.g. regular present but suppletive past participle).

No change to stored-forms shape; additive only. `CONJ` and existing records untouched.

### Unit 2 — Morphology validator (`src/lib/conjugation/morphology.ts` + `__tests__/morphology.test.ts`)

Pure, dependency-free. Exposes `expectedForms(verb, formType): string[] | null` returning the **derived regular forms**, or `null` when the form is not regularly derivable for that verb (so the test skips equality and relies on shape + hand-authoring).

Croatian rules to encode (regular cases):

- **Present:**
  - `a-am`: stem = inf − `ti`; endings `-m,-š,'',-mo,-te,-ju` (čitati → čitam/čitaš/čita/čitamo/čitate/čitaju).
  - `i-im`: stem = inf − `iti`/`jeti` root; endings `-im,-iš,-i,-imo,-ite,-e` (govoriti → govorim…govore; voljeti → volim…vole).
  - `a-em`: requires `presentStem`; endings `-em,-eš,-e,-emo,-ete,-u` (`piš` → pišem…pišu). If `presentStem` missing → return `null` (must be hand-authored).
  - `irr`: return `null` (hand-authored).
- **Past (perfekt):** l-participle + clitic aux. Regular l-participle: `-ati`→`-ao/-ala/-alo`, `-iti`/`-jeti`→`-io/-ila/-ilo`. Forms: `m=[ptcp_m+' '+aux]` with aux `sam,si,je` (sing) and `smo,ste,su` (pl); plural participle `-li/-le/-la` for m/f/n. (e.g. čitao sam … čitali su; čitala sam … čitale su; čitalo sam … čitala su.) Suppletive participles (išao, jeo, pio) → mark `irregularForms:['past']` (and conditional, which reuses the participle).
- **Future I:** `(inf endsWith 'ti' ? inf.slice(0,-1) : inf) + ' ' + clitic`, clitics `ću,ćeš,će,ćemo,ćete,će` (čitati → čitat ću; ići → ići ću). Regularly derivable for all.
- **Imperative** (`[2sg,1pl,2pl]`): derived from the present stem — `a-am`→`-aj/-ajmo/-ajte`; `i-im`→`-i/-imo/-ite`; `a-em`→ from `presentStem`+`-i/-imo/-ite` (piši/pišimo/pišite). Exceptions → `irregularForms:['imperative']`.
- **Conditional** (`[6]`, masculine baseline as stored): masculine l-participle + `bih,bi,bi,bismo,biste,bi`. Derived from the same participle as past; if past is irregular, mark conditional irregular too.

**The test** (`morphology.test.ts` + extension to `verbsData.test.ts`): iterate `VERBS`; for each authored form-type not exempt (`irregular:true` or in `irregularForms`), assert `verb[formType]` deep-equals `expectedForms(verb, formType)`. On mismatch → fail with `${inf}.${formType}` so the bad cell is named. Additionally **log coverage**: count of forms machine-verified vs hand-trusted, asserting hand-trusted stays a small minority (a guard against over-flagging to dodge the validator).

**Authoring aid (dev-only, not runtime):** `scripts/generate-regular-forms.mjs` uses `morphology.ts` to emit regular forms for a list of `{inf,en,klass,aspect,cefr,presentStem?}` stubs, so authoring a batch = write metadata → generate regular forms → paste into `VERBS` → hand-fix the flagged irregulars → validator confirms. Keeps forms explicitly stored (no runtime generation) while removing most manual cell typing.

### Unit 3 — Decouple session drill from curriculum units (`src/lib/conjugation/category.ts`)

Change `cellsForCategory` to build candidates from the **full `verbs` array** (already passed in) filtered by:
- `cefrRank(verb.cefr) <= cefrRank(userCefr)`,
- the target `formType` is authored on the verb (`formFor` non-null),
- for aspect categories: only verbs with a non-null `pair` (aspect pairs).

Expand to cells (6 persons; past/conditional × 3 genders), dedupe, then `selectDailySet` as today. Remove the dependency on `UNITS`/`cellsForUnit` inside `cellsForCategory` (UNITS stays for the Lab hub). Update `category.test.ts` accordingly. Net effect: any verb added to `VERBS` with the right `cefr` + forms auto-surfaces in the daily drill.

### Unit 4 — Content: ~50 verbs per level (`functions/api/content/_data/grammar.js`)

Per phase, author ~50 frequency-ranked, level-appropriate verbs (A1 highest-frequency everyday verbs; A2/B1/B2 progressively less frequent/more abstract), each anchored to its level, no cross-level duplication. Forms per depth decision (Present/Past/Future all; +Imperative/Conditional for B1/B2). Regenerate `_etags.js` after each batch. Verb lists drafted from in-memory Croatian frequency knowledge (per the user's skip-external-review preference); the morphology validator is the correctness net.

## Data flow (unchanged downstream)

`VERBS` (bigger) → grammar endpoint → `useGrammar` → `ConjugationSessionDrill` → `cellsForCategory` (now full-pool, level-filtered) → `ConjugationDrillEngine`. Adaptive surfacing, CEFR gating, and `rateCategorySession` loop are unchanged.

## Testing & gates

- `verbsData.test.ts` (shape) — extended to also run the morphology equality check, or a sibling `morphology.test.ts` does. Both run under `npm test`.
- `morphology.test.ts` — unit tests for `expectedForms` against known verbs (regular per class + a couple irregulars returning null/exempt).
- `category.test.ts` — updated for full-pool sourcing (level gating, form-type filter, aspect-pair restriction, SR-due-first, deterministic).
- Per-phase: validator green + full suite + build before ship.

## Rollout (phases = the implementation plan's phases)

1. **Foundation:** schema fields (Unit 1) + morphology validator + authoring script (Unit 2) + decouple drill (Unit 3). No new content yet; existing 17 verbs must pass the validator (fix/flag any that don't). Ship.
2. **A1 → ~50 verbs** (present; + past/future for the everyday core). Validator green. Ship.
3. **A2 → ~50 verbs** (present + past + future). Ship.
4. **B1 → ~50 verbs** (+ imperative + conditional). Ship.
5. **B2 → ~50 verbs** (+ imperative + conditional + aspect pairs). Ship.

Each phase is independently shippable behind `CONJ_LAB_ENABLED` (already live).

## Out of scope (YAGNI)

- No runtime form generation (forms stay explicitly stored; generation is a dev authoring aid only).
- No change to the drill engine UI, mastery, or adaptive wiring.
- No English-gloss/audio overhaul; reuse existing `speak()` + `en` field.
- No reflexive/passive/aorist/imperfect tenses (not part of the speaking trio).

## Open questions — resolved

- `presentStem` schema addition — approved.
- "50 per level" = 50 anchored per level, lower levels carry forward — confirmed.
- Correctness approach — build-time morphology validator — confirmed.
- Rollout — phased per level, A1 first — confirmed.
