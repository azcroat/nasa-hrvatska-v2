# SP9 — Advanced Grammar Units (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (4/4 sections approved by jschr in chat)
**Predecessor:** SP8 (Phoneme Heat Map, complete)
**Successor:** SP10 (Infrastructure Hardening + Observability)
**Sibling slices for later:** SP9b (Dedicated practice screens per unit), SP9c (TTS audio for examples), SP9d (SP5 user-context integration for B2/C1 weak topics), SP9e (HR-localized tips), SP9f (C2-level units), SP9g (AI-generated drill expansion)

## Why this exists

The curriculum has 65 grammar units total: 6 at A1, 8 at A2, **51 at B1, and zero at B2 or C1**. A learner who reaches B2 runs out of grammar content. The GrammarTrackScreen surfaces no advanced material at all. SP9 closes that hole by authoring 10 new units — 5 at B2 and 5 at C1 — covering the canonical advanced topics in Croatian grammar.

User's stated SP9 goal (chat 2026-05-15):
> "Curriculum Polish — improve the A1→C1 progression."

User-approved scope decisions during this brainstorm:
- Fill the B2 + C1 grammar gap (not LEARN_PATH rebalancing, content audit, or MicroLessonScreen redesign)
- 10 units total, standard depth (matching existing B1 unit shape)
- Approved 10-topic curriculum (5 B2 + 5 C1, listed below)
- New file `src/data/grammar-advanced.js` (not in-place edit to grammar.js)

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Slice | B2 + C1 grammar authoring | Closes a real curriculum hole: 51 B1 units vs 0 advanced |
| Volume / depth | 10 units (5 B2 + 5 C1) at standard depth | Each unit ≈ existing ASPECT_PAIRS shape; covers canonical advanced topics |
| Topics | 5 B2 + 5 C1, curated list (see below) | Canonical advanced-Croatian topics that complete A1→C1 progression |
| File strategy | New `src/data/grammar-advanced.js` | Easier review, cleaner rollback, keeps grammar.js stable |
| Routing | Generic `GrammarUnitDetail.tsx` for all 10 (no per-unit practice screen) | Per-unit screens are SP9b; v1 ships content + a single shared renderer |

### Approved topic curriculum

**B2 (5 units) — Upper-Intermediate**
1. `futur-ii` — **Futur II / Future Perfect**: `budem/budeš/bude` + past participle for time clauses and uncertainty about past
2. `relative-clauses` — **Relativne rečenice (koji)**: `koji/koja/koje` + cases — the biggest B1→B2 leap
3. `passive-voice` — **Trpni / Passive Voice**: `Knjiga je napisana`, `Auto je prodan` patterns
4. `participles` — **Glagolski pridjevi**: past + passive participle (radni / trpni), declension, agreement
5. `reported-speech` — **Indirektni govor**: `Rekao je da...`, tense agreement, embedded questions

**C1 (5 units) — Advanced**
6. `kondicional-ii` — **Kondicional II / Conditional Perfect**: `bio bih došao`, counterfactuals
7. `formal-register` — **Formalni jezik**: `gospodin/gospodja`, polite imperatives, business correspondence
8. `verbal-nouns` — **Glagolske imenice**: `pisanje, čitanje, putovanje` with case + preposition combinations
9. `reflexive-constructions` — **Povratni glagoli**: `se` vs `sebe` distinction, mutual/reciprocal actions
10. `word-order` — **Red riječi**: clitic placement, fronted objects, topicalization for emphasis

## Architecture

A new file `src/data/grammar-advanced.js` houses 10 new grammar units. Each follows the existing `grammar.js` schema. The 10 units are aggregated into an `ADVANCED_UNITS` array which is included in `grammar.js`'s `ALL_GRAMMAR_UNITS` registry. `GrammarTrackScreen` reads from that registry and renders B2 + C1 sections automatically once units with those CEFR levels exist. Tapping a B2/C1 unit routes to a new shared `GrammarUnitDetail.tsx` renderer that takes a `unitId` prop and renders the unit's intro, forms, examples, tips, and inline drills.

```
src/data/grammar.js          (existing, 3347 lines, A1+A2+B1)
src/data/grammar-advanced.js (NEW, ~2500 lines, B2+C1)
                                          │
                                          ▼
                            grammar.js exports ALL_GRAMMAR_UNITS = [...existing, ...ADVANCED_UNITS]
                                          │
                                          ▼
                            GrammarTrackScreen reads ALL_GRAMMAR_UNITS,
                            groups by cefr, renders sections A1 / A2 / B1 / B2 / C1
                                          │
                                          ▼
                            Tap B2/C1 unit → routes to GrammarUnitDetail with unitId prop
                            Tap A1/A2/B1 unit → routes to existing per-unit screens (unchanged)
```

### Key invariants

- The new file **mirrors the existing `grammar.js` schema exactly** — no new keys, no new patterns.
- `GrammarTrackScreen` adds B2 + C1 group rendering. The A1/A2/B1 sections are untouched.
- The 10 units are **content-only**. No new API, no new AI integration, no new mic features.
- Each unit meets a **quality floor**: 6+ forms, 5+ examples, 3+ tips, 5+ drills.
- All Croatian content is **authoritative** — authored from in-memory expertise per locked feedback "Skip linguistic review for Croatian content drafts; use in-memory expertise and ship."
- Existing per-unit B1 practice screens (AspectDrillScreen, AccusativeDrillScreen, etc.) are **untouched**. They keep their dedicated routes.

## Unit schema

Mirrors the existing `ASPECT` / `ASPECT_PAIRS` shape from `grammar.js`.

```ts
interface GrammarUnit {
  id: string;          // unique kebab-case slug, e.g. 'futur-ii'
  cefr: 'B2' | 'C1';
  title: string;       // Croatian title
  subtitle: string;    // English subtitle / what this unit teaches
  focus: string;       // Comma-separated key concepts (used by recommender keyword match)
  intro: string;       // 2-3 sentence prose intro
  forms: Array<{
    label: string;     // row label (e.g. 'ja', 'masc anim acc')
    hr: string;        // Croatian form
    en?: string;       // optional English gloss
  }>;
  examples: Array<{
    hr: string;
    en: string;
    note?: string;     // optional grammar callout
  }>;
  tips: string[];      // common mistakes, mnemonics
  drills: Array<{
    q: string;
    qEn?: string;
    opts?: string[];   // multiple-choice options (4 typical)
    correct: number | string;  // index into opts OR free-form answer string
    explain?: string;
  }>;
}
```

### Quality floor (enforced by schema tests)

Each unit must meet:
- **6+ forms** (conjugation/declension table rows)
- **5+ examples** with HR + EN
- **3+ tips** (common mistakes, mnemonics)
- **5+ drills** with 4 MCQ options each
- All Croatian-accurate
- At least one example showing the topic in "real-life" Croatian (not just isolated grammar)
- Drills include ≥ 2 case-trap distractors per question

### Concrete example — `FUTUR_II` (illustrative; remaining 9 units follow same shape)

```js
export const FUTUR_II = {
  id: 'futur-ii',
  cefr: 'B2',
  title: 'Futur II — Future Perfect',
  subtitle: 'Used in time clauses ("when/if I have done X") and uncertainty about past',
  focus: 'futur ii, future perfect, conditional time clauses, kad ako future',
  intro: 'Futur II is formed with the future of "biti" (budem, budeš, bude, budemo, budete, budu) plus the past participle...',
  forms: [
    { label: 'ja', hr: 'budem došao / došla', en: 'I will have come' },
    // ... 6 total rows for all persons
  ],
  examples: [
    { hr: 'Kad budem završio posao, nazvat ću te.', en: 'When I have finished work, I will call you.', note: 'Time clause: Futur II + Futur I.' },
    // ... 5+ total
  ],
  tips: [
    'Always uses a past participle (radni glagolski pridjev) — same form used in Past Tense.',
    'Almost never appears in a main clause — look for ako / kad / čim / dok triggers.',
    // ... 3+ total
  ],
  drills: [
    { q: 'Kad ____ vremena, javit ću se.', opts: ['budem imati','budem imao','bit ću imao','imam'], correct: 1, explain: '`budem imao` — Futur II requires past participle after `budem`.' },
    // ... 5+ total
  ],
};
```

The full FUTUR_II text appears in the brainstorm record. The other 9 units follow the identical template with topic-appropriate content.

## Aggregator + GrammarTrackScreen integration

### `grammar-advanced.js` exports

The new file exports 10 named constants plus an aggregated array:

```js
export const FUTUR_II = { /* unit data */ };
export const RELATIVE_CLAUSES = { /* unit data */ };
// ... 8 more
export const ADVANCED_UNITS = [
  FUTUR_II,
  RELATIVE_CLAUSES,
  PASSIVE_VOICE,
  PARTICIPLES,
  REPORTED_SPEECH,
  KONDICIONAL_II,
  FORMAL_REGISTER,
  VERBAL_NOUNS,
  REFLEXIVE_CONSTRUCTIONS,
  WORD_ORDER,
];
```

### `grammar.js` extension

At the bottom of `grammar.js`, add:

```js
import { ADVANCED_UNITS } from './grammar-advanced.js';

export const ALL_GRAMMAR_UNITS = [
  ...GRAM.units,        // existing A1/A2/B1 units
  ...ASPECT_PAIRS,      // existing B1 aspect pairs
  ...ADVANCED_UNITS,    // NEW — B2 + C1 units
];
```

If `grammar.js` does not currently expose an aggregated registry, the plan-writing step creates one based on actually-existing exports. The pattern is whichever requires the least disruption to existing consumers.

### `GrammarTrackScreen` extension

Today the screen groups units by CEFR into A1/A2/B1 sections. SP9 adds B2 + C1 section rendering. The change is mechanical: extend whatever filter loop produces the section blocks to include B2 and C1.

Tapping a unit:
- **A1/A2/B1 units:** route to their existing per-unit practice screen (unchanged)
- **B2/C1 units:** route to the new generic `GrammarUnitDetail` screen with the unit ID

### `GrammarUnitDetail.tsx` — new generic unit renderer

Takes a `unitId` prop. Looks up the unit in `ALL_GRAMMAR_UNITS`. Renders top-to-bottom:
1. Title + subtitle header
2. Intro prose
3. Forms table (label / hr / en columns)
4. Examples list (hr → en, optional note callout)
5. Tips bullets
6. Inline MCQ drill flow (one question at a time with feedback)

The MCQ drill flow is a minimal ~60-line inline component within `GrammarUnitDetail` (not extracted to a shared component — refactoring is SP9b cleanup if duplication becomes painful).

### Unlock progression

Existing A1/A2/B1 units use `ck(stats)` predicates for unlock gating. The new B2/C1 units use a **simpler CEFR-based unlock**: a unit is unlocked iff the user's computed CEFR is `>= unit.cefr` (via existing `cefrRank` helper). Conservative and predictable; no new unlock predicates to author.

## File summary

**Created:**
- `src/data/grammar-advanced.js` — 10 unit constants + `ADVANCED_UNITS` aggregated export (~2,500 lines content)
- `src/components/learn/GrammarUnitDetail.tsx` — generic unit detail renderer (~150 lines)
- `src/tests/grammarAdvanced.schema.test.js` — 12 schema-validation tests
- `src/tests/grammarUnitDetail.test.tsx` — 6 component tests
- `src/tests/grammarAdvanced.aggregation.test.js` — 3 aggregator tests
- `src/tests/grammarTrackScreen.advanced.test.tsx` — 2 integration tests

**Modified:**
- `src/data/grammar.js` — add `ADVANCED_UNITS` import + extend the aggregated registry
- `src/components/learn/GrammarTrackScreen.tsx` — add B2 + C1 group rendering that routes into `GrammarUnitDetail`
- `src/components/AppRouter.tsx` — register the new `grammar_unit_detail` screen ID + plumb `unitId` state through

## Testing strategy

### Layer 1 — Schema-validation tests (Vitest)

`src/tests/grammarAdvanced.schema.test.js` — 12 tests covering the 10 units:

- All 10 units have id, cefr, title, subtitle, focus, intro, forms, examples, tips, drills
- Each unit `id` is a non-empty kebab-case slug, unique across the set
- Every `cefr` is exactly 'B2' or 'C1'
- Each unit has 6+ forms, 5+ examples, 3+ tips, 5+ drills (quality floor)
- Every form has `label` + `hr` (en optional)
- Every example has `hr` + `en`
- Every tip is a non-empty string
- Every drill has `q`, `opts` (length 4), `correct` (number index 0-3 OR string)
- When `correct` is a number index, it points to a valid index in `opts`
- `ADVANCED_UNITS` array exports exactly 10 entries
- Exactly 5 entries have `cefr: 'B2'` and 5 have `cefr: 'C1'`
- No drill option string is empty

### Layer 2 — `GrammarUnitDetail` component tests

`src/tests/grammarUnitDetail.test.tsx` — 6 tests:

- Renders unit title, subtitle, intro for a given `unitId`
- Renders all forms in a table-like layout
- Renders all examples with HR + EN
- Renders all tips as a list
- Renders the first drill as a question + 4 options; selecting correct option shows positive feedback
- Falls through to "Unit not found" state when `unitId` is unknown (defensive)

### Layer 3 — Aggregator + GrammarTrackScreen integration

`src/tests/grammarAdvanced.aggregation.test.js` — 3 tests:
- `ALL_GRAMMAR_UNITS` registry includes the 10 advanced units
- B2 + C1 units appear in the registry with correct cefr fields
- No duplicate unit IDs across the aggregated registry

`src/tests/grammarTrackScreen.advanced.test.tsx` — 2 tests:
- GrammarTrackScreen renders B2 and C1 section headers when advanced units exist
- Tapping a B2/C1 unit routes into GrammarUnitDetail with the right unitId

### No e2e

Pure content + small renderer. Unit + integration coverage (23 tests total) is sufficient. CI gains nothing from clicking through 10 curriculum cards in Playwright; e2e remains a manual smoke if needed.

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. Schema correctness | All 12 schema tests green for all 10 units | `grammarAdvanced.schema.test.js` |
| 2. Component renderer | All 6 GrammarUnitDetail tests green | `grammarUnitDetail.test.tsx` |
| 3. Aggregation | 3 aggregator tests green; no duplicate unit IDs | `grammarAdvanced.aggregation.test.js` |
| 4. GrammarTrackScreen integration | 2 integration tests green; B2 + C1 sections appear | `grammarTrackScreen.advanced.test.tsx` |
| 5. Quality floor | Every unit meets the 6/5/3/5 minimums (forms/examples/tips/drills) | schema test #4 |
| 6. CEFR distribution | Exactly 5 B2 + 5 C1 entries | schema test #11 |
| 7. No regression | Existing GrammarTrackScreen tests pass unchanged; full vitest suite green | full suite run |
| 8. Drill correctness | Every correct-index points to a real option in `opts`; every correct-string is non-empty | schema tests #8, #9 |
| 9. Croatian-accurate content | Hand-verified against `croatian_linguistics_expertise.md` memory during authoring | manual + memory |
| 10. Bundle size | `grammar-advanced.js` + `GrammarUnitDetail.tsx` add < 30 KB to the curriculum chunk (content-heavy by design) | `npm run build` |

## Out of scope for SP9

- Dedicated practice screens per advanced unit (SP9b)
- Azure TTS audio for example sentences (SP9c)
- SP5 user-context integration for B2/C1 weak-topic tracking (SP9d)
- HR-as-target-language tip translations (SP9e)
- C2-level grammar units (SP9f — needs C2 reading content first)
- AI-generated additional drills (SP9g)

## Follow-up slices to track

- **SP9b:** Dedicated practice screens for each of the 10 new units (AspectDrillScreen-style, with adaptive difficulty)
- **SP9c:** TTS audio for every example sentence in the new units (Azure TTS, cached server-side)
- **SP9d:** Extend SP5's `TOPIC_KEYWORDS` map to recognize the new advanced grammar topics in `userContext.weakTopics`
- **SP9e:** Translate tip strings to HR for advanced learners (currently EN-only)
- **SP9f:** Author C2-level grammar units (needs C2 reading content as predecessor)
- **SP9g:** AI-generated drill expansion — let Claude produce additional drills given the unit's intro + tips
