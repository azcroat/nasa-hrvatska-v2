# Conjugation as an Adaptive Grammar Subject — Design

**Date:** 2026-06-10
**Status:** Approved (brainstorming → spec)
**Supersedes the surfacing approach in:** `2026-06-09-verb-conjugation-curriculum-design.md` (the data model, engine, curriculum, daily-set, mastery, and Conjugation Lab hub from that spec all stand; only the **Home-tab daily card** surfacing is replaced by this spec).

## Goal

Make verb conjugation behave like the app's other adaptive grammar subjects (Genitive, Nominative Case, etc.): **surfaced by Today's Session** based on the learner's CEFR level and which topics they're weakest on, **drilled by the purpose-built conjugation engine**, and **housed in the Practice grammar catalog**. Remove the standalone Home-tab "Daily Conjugation" card.

## Background / current state

The conjugation engine, dataset, curriculum, daily-set selection, mastery, and the `ConjugationLab` hub are already built and committed on branch `feat/verb-conjugation-curriculum` (commits `a0265f38`…`ebbe723a`; PR #25). The just-shipped surfacing was a flag-gated **Home-tab card** (`HomeTab.tsx` ~lines 462–495, `data-testid="home-daily-conjugation"`) that launched the `conjlab` hub directly. That card is being removed in favor of session integration.

Key existing mechanics (verified 2026-06-10):

- **Today's Session** is built by `buildSessionActivities(userCefr, poolWords)` in `src/hooks/useDailySession.ts` (~lines 171–272). Its Priority-2 tier picks the top adaptive grammar topic from `getDueCategoryQueue(6)` and maps it to a drill screen via `CATEGORY_SCREEN_MAP` (~lines 55–74). Each session activity has shape `{ id, label, screen, category }`.
- **Adaptive categories** live in `src/lib/adaptive.ts`: the `SkillCategory` union (~line 239) and `ALL_CATEGORIES` array (~line 257). Per-category spaced-repetition state (`stability`, `recentAccuracy`, `due`, `lastSeen`) is persisted under `localStorage` key `nh_cat_sr`.
- The tense/aspect categories **already exist**: `past-tense`, `future-tense`, `conditional`, `aspect-imperfective`, `aspect-perfective`, `aspect-negation`. They currently map to *generic* drills (`cloze`, `future`, `aspectdrill`). There is **no** `present-tense` category.
- A drill **closes the adaptive loop** by calling `rateCategorySession(category, accuracy)` (`adaptive.ts:337`) on completion — confirmed pattern in `ProductionDrillScreen.tsx:1307`. This updates the category's `recentAccuracy` + `due` so it re-schedules.
- `getDueCategoryQueue(maxSlots)` is **not CEFR-gated** — it returns categories purely by due/weak/balanced. (Pre-existing gap; this spec adds gating for the conjugation categories.)
- `CONJ_LAB_ENABLED` (`src/lib/conjugation/conjugationConfig.ts`) is the kill switch.

## Decisions (from brainstorming)

1. **Adaptive model** — conjugation enters the session via the adaptive grammar queue (like Genitive/Nominative), not a hardcoded card and not a plain rotation fill.
2. **Replace, don't duplicate** — the conjugation drill becomes THE drill for the tense/aspect categories (re-point `CATEGORY_SCREEN_MAP`); add a new `present-tense` category for A1. Old `cloze`/`future`/`aspectdrill` remain reachable via the Practice catalog.
3. **Keep the Lab hub** — `ConjugationLab` (16-unit curriculum map + mastery rings) stays as the browsable surface, reached from the Practice grammar catalog.
4. **Aspect drilling** — aspect categories drill **present-tense forms over aspect-pair verbs** (e.g. `pisati`/`napisati`), not past/future contrasts.
5. **Two screens, one engine** — the session drill (`conjpractice`) and the hub (`conjlab`) are separate screens that both render the shared `ConjugationDrillEngine`.

## Architecture

### Unit 1 — Adaptive category additions (`src/lib/adaptive.ts`)

- Add `'present-tense'` to the `SkillCategory` union and `ALL_CATEGORIES`.
- Add an exported `CATEGORY_MIN_CEFR: Partial<Record<SkillCategory, 'A1'|'A2'|'B1'|'B2'>>` for the conjugation categories:
  - `present-tense` → `A1`
  - `past-tense`, `future-tense` → `A2`
  - `conditional`, `aspect-imperfective`, `aspect-perfective`, `aspect-negation` → `B1` (aspect-* may be `B2`; see Open-questions-resolved)
- Existing per-category SR storage handles the new category automatically (defaults via `_defaultCard()`).

**Depends on:** nothing new. **Used by:** the session builder (Unit 2) and the session drill (Unit 4).

### Unit 2 — Re-point topic → drill, CEFR-gated (`src/hooks/useDailySession.ts`)

- In `CATEGORY_SCREEN_MAP`, re-point the conjugation categories to the new session-drill screen id `conjpractice`:
  - `present-tense`, `past-tense`, `future-tense`, `conditional`, `aspect-imperfective`, `aspect-perfective`, `aspect-negation` → `'conjpractice'`
- Gate the Priority-2 pick by CEFR: when the chosen category is a conjugation category whose `CATEGORY_MIN_CEFR` exceeds `userCefr`, skip it (fall through to the next queue entry / lower tiers). Implemented as a small filter over `getDueCategoryQueue(...)` results before mapping to a screen.
- **Flag behavior:** the re-point + present-tense gating apply only when `CONJ_LAB_ENABLED` is true. When false, `CATEGORY_SCREEN_MAP` resolves the old screens (`past-tense`→`cloze`, `future-tense`→`future`, `aspect-*`→`aspectdrill`, `conditional`→`cloze`) and `present-tense` is absent from the queue. Implement by computing the effective map from the flag (e.g. a base map + a flag-gated override), keeping a single source of truth.

**Depends on:** Unit 1 (`CATEGORY_MIN_CEFR`, `present-tense`), the flag. **Used by:** session rendering.

### Unit 3 — Category → cells helper (`src/lib/conjugation/category.ts`, new)

Pure, fully unit-testable. No React, no storage writes.

```ts
import type { FormType } from './types';
import type { SkillCategory } from '../adaptive';

// Which conjugation form-type a session category drills.
export function categoryToFormType(category: SkillCategory): FormType | null;
//  present-tense → 'present'
//  past-tense    → 'past'
//  future-tense  → 'future1'
//  conditional   → 'conditional'
//  aspect-*      → 'present'   (drilled over aspect-pair verbs)
//  (any non-conjugation category) → null

// Build the ordered cell queue for a surfaced category, gated to the learner's level
// and prioritized by spaced-repetition due-ness.
export function cellsForCategory(
  category: SkillCategory,
  verbs: ConjVerb[],
  userCefr: 'A1'|'A2'|'B1'|'B2',
  opts?: { size?: number; daySeed?: number; sr?: SRMap },
): ConjCell[];
```

`cellsForCategory` logic:
1. `formType = categoryToFormType(category)`; if null → `[]`.
2. Select curriculum `UNITS` where the unit's `formTypes` include `formType` **and** `cefrRank(unit.cefr) <= cefrRank(userCefr)`. For aspect categories, additionally restrict to units that reference aspect-pair verbs (units `aspect-*` in `curriculum.ts`).
3. Expand the selected units via the existing `cellsForUnit(unit, verbs)`.
4. De-duplicate and run the existing `selectDailySet({ candidates, dueKeys, size, daySeed })` (SR-due-first; default `size` ≈ 12, `daySeed` = today) to produce the final ordered queue.

**Depends on:** existing `curriculum.ts` (`UNITS`), `cells.ts` (`cellsForUnit`, `dueConjKeys`), `dailySet.ts` (`selectDailySet`), `types.ts`. **Used by:** Unit 4.

### Unit 4 — Session conjugation drill screen (`src/components/practice/ConjugationSessionDrill.tsx`, new; screen id `conjpractice`)

A thin screen wrapper around the existing `ConjugationDrillEngine`.

- **Receives the target category** via the launch param. Carried the same way other session drills carry context — through the `curEx` value the launcher sets. Encode as `conjpractice:<category>` (e.g. `conjpractice:past-tense`); the screen parses the suffix. If no/invalid category, default to the lowest unlocked conjugation category for the user's CEFR (so a bare launch still works).
- Loads `VERBS` via `useGrammar()`; computes `cells = cellsForCategory(category, verbs, userCefr)`.
- Renders `<ConjugationDrillEngine verbs={verbs} cells={cells} award={award} goBack={goBack} onComplete={...} />`.
- **`onComplete(score, total)`** →
  - `rateCategorySession(category, total ? score/total : 0)` — closes the adaptive loop.
  - (XP + `markQuest('grammar')` are already fired inside the engine; do not double-count. The engine currently also calls `recordTopicResult('grammar', …)` per item — keep that; it is additive telemetry.)
  - `goBack()` returns to the dashboard so session progression (`nh_session_completed`) advances as for any other activity.
- Empty-cells guard: if `cells.length === 0` (e.g. data gap), render a graceful "nothing to drill" state and `goBack` — never crash.

**Registration (3 edits, per the architecture skill):**
1. `src/hooks/useScreenLauncher.ts` — add `conjpractice: 'gc'` to the screen→category map, and handle it in `launchSessionActivity` (direct navigation; no pool init).
2. `src/components/AppRouter.tsx` — lazy import + a `currentScreen === 'conjpractice'` render block inside a `ScreenErrorBoundary`, passing the parsed category through.
3. No new catalog entry (the session launches it; the browsable entry remains `conjlab`).

**Depends on:** Units 1 & 3, existing engine, `useGrammar`, `rateCategorySession`. **Used by:** the session runner.

### Unit 5 — Remove the Home card; keep the browse surface

- Delete `HomeTab.tsx` ~lines 462–495 (the `home-daily-conjugation` button) and the now-unused `CONJ_LAB_ENABLED` import in that file. Verify no other reference in `HomeTab.tsx` depends on it.
- Keep `ConjugationLab` and its Practice catalog entry (`exerciseCatalog.ts`, `id: 'conjlab'`, `category: 'grammar'`, `action: go('conjlab')`), still flag-gated.

### Unit 6 — Flag + PR reconciliation

- `CONJ_LAB_ENABLED` remains the single kill switch governing: the catalog `conjlab` entry, the `ConjugationLab` hub, and the Unit-2 re-point + `present-tense` gating. With the flag **false**, the app reverts exactly to today's behavior (tense/aspect → generic drills; no present-tense topic; no conjugation surfaces).
- Continue on `feat/verb-conjugation-curriculum`. New commits update **PR #25**; revise its title/description to reflect adaptive integration (no Home card). The home-card E2E (`e2e/conjugation.spec.js`, currently rewritten in the working tree but **uncommitted**) is replaced by the Unit-7 session E2E.

## Data flow

```
Today's Session build (useDailySession)
  → getDueCategoryQueue() → filter by CONJ category + CEFR (Unit 2)
  → CATEGORY_SCREEN_MAP[cat] = 'conjpractice'  (flag on)
  → activity { id:'cat_past-tense', label:'Past Tense', screen:'conjpractice', category:'past-tense' }

Begin Session → launchSessionActivity('conjpractice', curEx='conjpractice:past-tense')
  → AppRouter renders ConjugationSessionDrill(category='past-tense')
  → cellsForCategory('past-tense', VERBS, userCefr)  [units≤CEFR, form='past', SR-due-first]
  → ConjugationDrillEngine(cells)
  → onComplete(score,total) → rateCategorySession('past-tense', score/total)  [loop closed]
  → goBack() → dashboard advances session
```

## Error handling

- Unknown/empty category or zero cells → graceful empty state + `goBack`; never throw (matches "unknown screen → go home" rule).
- `useGrammar` error/loading → existing patterns (retry / loading states), mirroring `ConjugationLab`.
- Flag off → no conjugation screens reachable from session; old drills intact.

## Testing strategy

- **Unit (`src/lib/conjugation/__tests__/category.test.ts`)**: `categoryToFormType` mapping incl. aspect→present and non-conj→null; `cellsForCategory` gates units to `≤ userCefr`, returns only the right form-type, is SR-due-first and deterministic per day-seed, and returns `[]` for non-conjugation categories.
- **Unit (`adaptive`)**: `present-tense` present in `ALL_CATEGORIES`; `rateCategorySession('present-tense', …)` schedules; `CATEGORY_MIN_CEFR` values correct.
- **Unit (`useDailySession` map)**: with flag on, conjugation categories map to `conjpractice` and are CEFR-gated (A1 user never gets `aspect-*`); with flag off, the original mapping is restored and `present-tense` is absent.
- **Component (`ConjugationSessionDrill`)**: renders 4 options for a seeded category and calls `rateCategorySession` once with `score/total` on completion (spy).
- **E2E (`e2e/conjugation.spec.js`, rewritten)**: seed a conjugation category as due + flag on; Begin Session; when the conjugation activity is next, assert `conj-option` ×4 and `conj-feedback`. **Verify every locator against the running app before un-skipping** (PR #24 lesson). Keep skipped if a locator can't be verified live; never commit an unverified hard-failing spec.

## Out of scope (YAGNI)

- No new "Grammar hub" screen (grammar lives in the Practice catalog as today).
- No retirement of `cloze`/`future`/`aspectdrill` (kept as catalog entries).
- No change to the `ConjugationLab` hub internals or the verb dataset.
- No per-form-type Home cards or notifications.

## Open questions — resolved

- **Aspect form-type** → present-tense over aspect-pair verbs (user-confirmed).
- **Two screens vs unified** → keep two screens sharing one engine (user-confirmed).
- **Aspect category min-CEFR** → `B1` for `aspect-imperfective`/`aspect-negation`, `B2` for `aspect-perfective` pairs, matching `curriculum.ts` unit CEFR (`aspect-intro` A2, `aspect-tenses` B1, `aspect-pairs`/`aspect-matrix` B2). Finalize exact per-category values against `curriculum.ts` during planning; the principle (gate to the unit CEFR that owns the forms) is fixed.
