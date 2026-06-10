# Conjugation Session Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make verb conjugation surface inside Today's Session as an adaptive grammar subject (like Genitive/Nominative), drilled by the existing conjugation engine, CEFR-gated A1→B2, with the loop closed via `rateCategorySession`; keep the Conjugation Lab as the browse surface and remove the Home-tab card.

**Architecture:** Add a `present-tense` adaptive category + a `CATEGORY_MIN_CEFR` gate (`adaptive.ts`). Re-point the tense/aspect categories to a new `conjpractice` session-drill screen (flag-gated) in `useDailySession.ts`. A pure `cellsForCategory` helper turns a surfaced category into a level-gated, SR-prioritized cell queue. A thin `ConjugationSessionDrill` screen renders the existing `ConjugationDrillEngine` and calls `rateCategorySession` on completion. Remove the Home card.

**Tech Stack:** React + TypeScript (Vite), Vitest (unit/component), Playwright (E2E). All additive and behind `CONJ_LAB_ENABLED`.

---

## Design reference

Spec: `docs/superpowers/specs/2026-06-10-conjugation-session-integration-design.md`. Read it first. The prior conjugation engine/data/curriculum/Lab spec (`2026-06-09-...`) still stands; only the Home-card surfacing is replaced.

## Conventions (read before starting)

- **Branch:** continue on `feat/verb-conjugation-curriculum` (PR #25). Do NOT branch anew.
- **Test runner:** `npx vitest run <path>` (one file), `npm test` (all). Typecheck: `npm run typecheck`. Lint: `npm run lint`. Build: `npm run build`.
- **Croatian chars:** literal UTF-8 is fine (repo is UTF-8); match the surrounding file.
- **Adding a screen = 3 edits** (or it won't launch): (1) screen→category map in `src/hooks/useScreenLauncher.ts`; (2) lazy import + render block in `src/components/AppRouter.tsx`; (3) launch path. Unknown `currentScreen` → go home, never crash.
- **Adaptive loop:** a drill closes its category by calling `rateCategorySession(category, accuracy)` (`src/lib/adaptive.ts:337`); pattern confirmed in `ProductionDrillScreen.tsx:1307`.
- **Flag:** `CONJ_LAB_ENABLED` in `src/lib/conjugation/conjugationConfig.ts`. With it false, the app must behave exactly as before this plan.
- **Working-tree note:** `e2e/conjugation.spec.js` currently holds an UNCOMMITTED home-card rewrite — it is replaced in Task 9. `public/version.json` may show a local edit; leave it (content-derived).

## File structure

**Create:**
- `src/lib/conjugation/category.ts` — `categoryToFormType`, `cellsForCategory`, `cefrRank` (pure).
- `src/lib/conjugation/__tests__/category.test.ts` — unit tests for the above.
- `src/components/practice/ConjugationSessionDrill.tsx` — session-drill screen (wraps the engine).
- `src/tests/conjugation-session-drill.test.tsx` — component test.

**Modify:**
- `src/lib/adaptive.ts` — add `present-tense`; export `CATEGORY_MIN_CEFR`, `CONJ_CATEGORIES`.
- `src/hooks/useDailySession.ts` — flag-gated re-point + CEFR-gated Priority-2 pick.
- `src/hooks/useScreenLauncher.ts` — `launchSessionActivity(screen, category?)`; register `conjpractice`.
- `src/components/AppRouter.tsx` — lazy import + `conjpractice` render block parsing `curEx`.
- `src/components/home/HomeTab.tsx` — pass `category` to `launchActivity`; REMOVE the daily-conjugation card + its flag import.
- `e2e/conjugation.spec.js` — rewrite for the session flow.

---

## PHASE A — Pure helpers + adaptive category (no UI)

### Task 1: Add `present-tense` category + CEFR gate metadata

**Files:**
- Modify: `src/lib/adaptive.ts` (union ~line 239, `ALL_CATEGORIES` ~line 257; add exports after)
- Test: `src/tests/adaptive-category.test.ts` (existing file — append)

- [ ] **Step 1: Write the failing test** (append to `src/tests/adaptive-category.test.ts`)

```ts
import { ALL_CATEGORIES, CATEGORY_MIN_CEFR, CONJ_CATEGORIES } from '../lib/adaptive.ts';

describe('conjugation category metadata', () => {
  it('present-tense is a registered category', () => {
    expect(ALL_CATEGORIES).toContain('present-tense');
  });
  it('CONJ_CATEGORIES are the 7 tense/aspect categories', () => {
    expect([...CONJ_CATEGORIES].sort()).toEqual(
      [
        'aspect-imperfective', 'aspect-negation', 'aspect-perfective',
        'conditional', 'future-tense', 'past-tense', 'present-tense',
      ].sort(),
    );
  });
  it('min CEFR ascends present→aspect', () => {
    expect(CATEGORY_MIN_CEFR['present-tense']).toBe('A1');
    expect(CATEGORY_MIN_CEFR['past-tense']).toBe('A2');
    expect(CATEGORY_MIN_CEFR['future-tense']).toBe('A2');
    expect(CATEGORY_MIN_CEFR['conditional']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-imperfective']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-negation']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-perfective']).toBe('B2');
  });
  it('rateCategorySession schedules present-tense', () => {
    rateCategorySession('present-tense', 0.8);
    // no throw + category persists; smoke only
    expect(ALL_CATEGORIES).toContain('present-tense');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/adaptive-category.test.ts`
Expected: FAIL (`CATEGORY_MIN_CEFR`/`CONJ_CATEGORIES` not exported; `present-tense` not in `ALL_CATEGORIES`).

- [ ] **Step 3: Implement in `src/lib/adaptive.ts`**

Add `'present-tense'` to the `SkillCategory` union (after `'vocative'`, before `'past-tense'`):

```ts
  | 'vocative'
  | 'present-tense'
  | 'past-tense'
```

Add `'present-tense'` to `ALL_CATEGORIES` (same position):

```ts
  'vocative',
  'present-tense',
  'past-tense',
```

Add these exports immediately AFTER the `ALL_CATEGORIES` declaration:

```ts
// Conjugation categories: drilled by the conjugation engine (flag-gated).
export const CONJ_CATEGORIES: ReadonlySet<SkillCategory> = new Set([
  'present-tense', 'past-tense', 'future-tense', 'conditional',
  'aspect-imperfective', 'aspect-perfective', 'aspect-negation',
]);

// Minimum CEFR at which each conjugation category may surface in the session.
// Mirrors the owning curriculum unit's CEFR (see src/lib/conjugation/curriculum.ts).
export const CATEGORY_MIN_CEFR: Partial<Record<SkillCategory, 'A1' | 'A2' | 'B1' | 'B2'>> = {
  'present-tense': 'A1',
  'past-tense': 'A2',
  'future-tense': 'A2',
  'conditional': 'B1',
  'aspect-imperfective': 'B1',
  'aspect-negation': 'B1',
  'aspect-perfective': 'B2',
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/tests/adaptive-category.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/adaptive.ts src/tests/adaptive-category.test.ts
git commit -m "feat(conjugation): add present-tense adaptive category + CEFR gate metadata"
```

---

### Task 2: `categoryToFormType` + `cefrRank` (pure)

**Files:**
- Create: `src/lib/conjugation/category.ts`
- Create: `src/lib/conjugation/__tests__/category.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/category.test.ts
import { describe, it, expect } from 'vitest';
import { categoryToFormType, cefrRank } from '../category';

describe('categoryToFormType', () => {
  it('maps tense categories to form types', () => {
    expect(categoryToFormType('present-tense')).toBe('present');
    expect(categoryToFormType('past-tense')).toBe('past');
    expect(categoryToFormType('future-tense')).toBe('future1');
    expect(categoryToFormType('conditional')).toBe('conditional');
  });
  it('maps all aspect categories to present (drilled over pair verbs)', () => {
    expect(categoryToFormType('aspect-imperfective')).toBe('present');
    expect(categoryToFormType('aspect-perfective')).toBe('present');
    expect(categoryToFormType('aspect-negation')).toBe('present');
  });
  it('returns null for non-conjugation categories', () => {
    expect(categoryToFormType('genitive')).toBeNull();
    expect(categoryToFormType('vocab-a2')).toBeNull();
  });
});

describe('cefrRank', () => {
  it('orders A1 < A2 < B1 < B2', () => {
    expect(cefrRank('A1')).toBeLessThan(cefrRank('A2'));
    expect(cefrRank('A2')).toBeLessThan(cefrRank('B1'));
    expect(cefrRank('B1')).toBeLessThan(cefrRank('B2'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/conjugation/category.ts`** (helpers only; `cellsForCategory` added in Task 3)

```ts
// src/lib/conjugation/category.ts
// Pure mapping from an adaptive SkillCategory to conjugation drill content.
import type { SkillCategory } from '../adaptive';
import type { FormType } from './types';

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2';

const ORDER: Cefr[] = ['A1', 'A2', 'B1', 'B2'];
export function cefrRank(c: Cefr): number {
  return ORDER.indexOf(c);
}

const CATEGORY_FORM: Partial<Record<SkillCategory, FormType>> = {
  'present-tense': 'present',
  'past-tense': 'past',
  'future-tense': 'future1',
  'conditional': 'conditional',
  // Aspect is drilled via present-tense forms over aspect-pair verbs.
  'aspect-imperfective': 'present',
  'aspect-perfective': 'present',
  'aspect-negation': 'present',
};

export function categoryToFormType(category: SkillCategory): FormType | null {
  return CATEGORY_FORM[category] ?? null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/category.ts src/lib/conjugation/__tests__/category.test.ts
git commit -m "feat(conjugation): categoryToFormType + cefrRank pure helpers"
```

---

### Task 3: `cellsForCategory` (level-gated, SR-due-first)

**Files:**
- Modify: `src/lib/conjugation/category.ts`
- Modify: `src/lib/conjugation/__tests__/category.test.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { cellsForCategory } from '../category';
import type { ConjVerb } from '../types';

const pisati: ConjVerb = {
  inf: 'pisati', en: 'to write', aspect: 'impf', pair: 'napisati', klass: 'a-em',
  cefr: 'A1', irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};
const govoriti: ConjVerb = {
  inf: 'govoriti', en: 'to speak', aspect: 'impf', pair: null, klass: 'i-im',
  cefr: 'A1', irregular: false,
  present: ['govorim', 'govoriš', 'govori', 'govorimo', 'govorite', 'govore'],
  past: {
    m: ['govorio sam','govorio si','govorio je','govorili smo','govorili ste','govorili su'],
    f: ['govorila sam','govorila si','govorila je','govorile smo','govorile ste','govorile su'],
    n: ['govorilo sam','govorilo si','govorilo je','govorila smo','govorila ste','govorila su'],
  },
};

describe('cellsForCategory', () => {
  const verbs = [pisati, govoriti];

  it('returns only present-tense cells for present-tense at A1', () => {
    const cells = cellsForCategory('present-tense', verbs, 'A1', { size: 50, daySeed: 1, dueKeys: new Set() });
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.formType === 'present')).toBe(true);
  });

  it('gates out higher-CEFR forms: past-tense yields nothing for an A1 user', () => {
    // past units are A2; an A1 learner must not be drilled on them.
    const cells = cellsForCategory('past-tense', verbs, 'A1', { size: 50, daySeed: 1, dueKeys: new Set() });
    expect(cells).toHaveLength(0);
  });

  it('returns past cells for past-tense at A2+', () => {
    const cells = cellsForCategory('past-tense', verbs, 'A2', { size: 50, daySeed: 1, dueKeys: new Set() });
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.formType === 'past')).toBe(true);
  });

  it('caps at size and is deterministic per day-seed', () => {
    const a = cellsForCategory('present-tense', verbs, 'A1', { size: 3, daySeed: 42, dueKeys: new Set() });
    const b = cellsForCategory('present-tense', verbs, 'A1', { size: 3, daySeed: 42, dueKeys: new Set() });
    expect(a.length).toBeLessThanOrEqual(3);
    expect(a).toEqual(b);
  });

  it('returns [] for a non-conjugation category', () => {
    expect(cellsForCategory('genitive', verbs, 'B2', { dueKeys: new Set() })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: FAIL (`cellsForCategory` not exported).

- [ ] **Step 3: Implement — append to `src/lib/conjugation/category.ts`**

```ts
import type { ConjVerb, ConjCell } from './types';
import { UNITS } from './curriculum';
import { cellsForUnit } from './cells';
import { selectDailySet } from './dailySet';
import { buildCardKey } from './cardKey';

const ASPECT_CATEGORIES: ReadonlySet<SkillCategory> = new Set([
  'aspect-imperfective', 'aspect-perfective', 'aspect-negation',
]);

interface CellsOpts {
  size?: number;
  daySeed?: number;
  dueKeys?: Set<string>;
}

// Build the ordered drill queue for a surfaced session category, gated to the
// learner's CEFR and prioritized by spaced-repetition due-ness.
export function cellsForCategory(
  category: SkillCategory,
  verbs: ConjVerb[],
  userCefr: Cefr,
  opts: CellsOpts = {},
): ConjCell[] {
  const formType = categoryToFormType(category);
  if (!formType) return [];
  const { size = 12, daySeed = 0, dueKeys = new Set<string>() } = opts;

  const isAspect = ASPECT_CATEGORIES.has(category);
  const units = UNITS.filter((u) => {
    if (!u.formTypes.includes(formType)) return false;
    if (cefrRank(u.cefr as Cefr) > cefrRank(userCefr)) return false;
    // Aspect categories drill only the aspect-themed units (their ids start with 'aspect').
    if (isAspect && !u.id.startsWith('aspect')) return false;
    return true;
  });

  const candidates: ConjCell[] = [];
  const seen = new Set<string>();
  for (const u of units) {
    for (const cell of cellsForUnit(u, verbs)) {
      if (cell.formType !== formType) continue; // unit may declare multiple form types
      const k = buildCardKey(cell);
      if (seen.has(k)) continue;
      seen.add(k);
      candidates.push(cell);
    }
  }

  return selectDailySet({ candidates, dueKeys, size, daySeed });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/lib/conjugation/category.ts src/lib/conjugation/__tests__/category.test.ts
git commit -m "feat(conjugation): cellsForCategory — level-gated, SR-prioritized cell queue"
```

---

## PHASE B — Session wiring

### Task 4: Flag-gated re-point + CEFR-gated Priority-2 pick

**Files:**
- Modify: `src/hooks/useDailySession.ts` (imports near top; `CATEGORY_SCREEN_MAP` ~lines 55–74; Priority-2 block ~lines 192–205)
- Test: `src/hooks/__tests__/useDailySession.conj.test.ts` (create)

> Note: this changes the Priority-2 pick from "top category only" to "first ELIGIBLE category in the queue" so CEFR-gated conjugation categories can be skipped. Non-conjugation behavior is unchanged when the top category is eligible (the common case).

- [ ] **Step 1: Write the failing test** (create `src/hooks/__tests__/useDailySession.conj.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Flag is read at module-eval; force it on for these cases.
vi.mock('../../lib/conjugation/conjugationConfig', () => ({
  CONJ_LAB_ENABLED: true,
  DAILY_CONJ_SET_SIZE: 15,
}));
// Keep real CATEGORY_MIN_CEFR / CONJ_CATEGORIES; make the queue mockable per-test.
vi.mock('../../lib/adaptive', async (orig) => {
  const actual = await orig<typeof import('../../lib/adaptive')>();
  return { ...actual, getDueCategoryQueue: vi.fn() };
});

import { getDueCategoryQueue } from '../../lib/adaptive';
import { resolveAdaptiveActivity } from '../useDailySession';

const ASPECT_THEN_PAST = [
  { category: 'aspect-perfective' as const, difficulty: 3 as const }, // B2
  { category: 'past-tense' as const, difficulty: 2 as const },        // A2
];

describe('adaptive conjugation pick (flag on)', () => {
  beforeEach(() => vi.mocked(getDueCategoryQueue).mockReset());

  it('skips a category above the user CEFR and picks the first eligible conj category', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue(ASPECT_THEN_PAST);
    const act = resolveAdaptiveActivity('A2', new Set<string>());
    expect(act).not.toBeNull();
    expect(act!.category).toBe('past-tense');
    expect(act!.screen).toBe('conjpractice');
  });

  it('an A1 user gets nothing when only above-level conj categories are due', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue(ASPECT_THEN_PAST);
    expect(resolveAdaptiveActivity('A1', new Set<string>())).toBeNull();
  });

  it('an A1 user gets present-tense routed to conjpractice', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue([
      { category: 'present-tense' as const, difficulty: 1 as const },
    ]);
    const act = resolveAdaptiveActivity('A1', new Set<string>());
    expect(act!.category).toBe('present-tense');
    expect(act!.screen).toBe('conjpractice');
  });
});
```

> The test imports a small exported pure helper `resolveAdaptiveActivity(userCefr, usedScreens)` that Step 3 extracts from the Priority-2 block so it is unit-testable. (Extracting pure decision logic from the hook is the established pattern — `selectProductionExercise` is exported the same way.)

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/hooks/__tests__/useDailySession.conj.test.ts`
Expected: FAIL (`resolveAdaptiveActivity` not exported).

- [ ] **Step 3: Implement in `src/hooks/useDailySession.ts`**

(a) Add imports near the other lib imports at the top:

```ts
import { getDueCategoryQueue, CONJ_CATEGORIES, CATEGORY_MIN_CEFR } from '../lib/adaptive';
import { CONJ_LAB_ENABLED } from '../lib/conjugation/conjugationConfig';
import { cefrRank, type Cefr } from '../lib/conjugation/category';
```
(If `getDueCategoryQueue` is already imported, merge — do not duplicate.)

(b) Add this exported helper just ABOVE `buildSessionActivities`:

```ts
// Pure: choose the adaptive grammar activity for this session, CEFR-gating and
// re-pointing conjugation categories to the conjugation drill when the flag is on.
// Returns null when no eligible category maps to an unused screen.
export function resolveAdaptiveActivity(
  userCefr: string,
  usedScreens: Set<string>,
): SessionActivity | null {
  const queue = getDueCategoryQueue(6);
  for (const { category } of queue) {
    const isConj = CONJ_LAB_ENABLED && CONJ_CATEGORIES.has(category);
    if (isConj) {
      const min = CATEGORY_MIN_CEFR[category];
      if (min && cefrRank(userCefr as Cefr) < cefrRank(min)) continue; // not yet unlocked
    }
    const screen = isConj ? 'conjpractice' : CATEGORY_SCREEN_MAP[category];
    if (!screen || usedScreens.has(screen)) continue;
    const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { id: `cat_${category}`, label, screen, category };
  }
  return null;
}
```

(c) Replace the Priority-2 block (currently ~lines 192–205) with:

```ts
  // Priority 2: Adaptive grammar topic (CEFR-gated; conjugation categories route
  // to the conjugation drill when CONJ_LAB_ENABLED).
  const adaptiveActivity = resolveAdaptiveActivity(
    userCefr,
    new Set(activities.map((a) => a.screen)),
  );
  if (adaptiveActivity) activities.push(adaptiveActivity);
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/hooks/__tests__/useDailySession.conj.test.ts`
Expected: PASS.

- [ ] **Step 5: Guard against regressions + typecheck**

Run: `npx vitest run src/hooks/ && npm run typecheck`
Expected: PASS (existing session tests still green).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDailySession.ts src/hooks/__tests__/useDailySession.conj.test.ts
git commit -m "feat(conjugation): CEFR-gated adaptive pick routes tense/aspect to conjpractice"
```

---

### Task 5: Thread `category` through `launchSessionActivity` + HomeTab

**Files:**
- Modify: `src/hooks/useScreenLauncher.ts` (`launchSessionActivity` ~lines 720–792; screen→category map)
- Modify: `src/components/home/HomeTab.tsx` (prop type line 56; calls lines ~593 and ~617)

- [ ] **Step 1: Register the screen→category mapping** in `src/hooks/useScreenLauncher.ts`

Find the screen→category object that contains `conjlab: 'gc'` and add:

```ts
  conjpractice: 'gc',
```

- [ ] **Step 2: Extend `launchSessionActivity` to carry the category**

Change the signature and the final `else` branch. Current:

```ts
  const launchSessionActivity = useCallback(
    async (screen: string): Promise<void> => {
```
to:
```ts
  const launchSessionActivity = useCallback(
    async (screen: string, category?: string): Promise<void> => {
```

In the terminal `else` branch (currently `sCurEx(screen); … setScr(screen);`), replace with:

```ts
      } else {
        // Conjugation drill carries its target category in curEx so the screen
        // can pick the right form-type; screen id stays 'conjpractice' for routing.
        const ex = screen === 'conjpractice' && category ? `conjpractice:${category}` : screen;
        sCurEx(ex);
        sessionStorage.setItem('nh_ex_start', Date.now().toString());
        setScr(screen);
      }
```

Add `sCurEx` is already in the dep array — no change needed.

- [ ] **Step 3: Pass the category from HomeTab**

In `src/components/home/HomeTab.tsx`:

Line 56 — widen the prop type:
```ts
  launchActivity?: (screen: string, category?: string) => void | Promise<void>;
```

Line ~593 (session `onStart`):
```ts
              void launchActivity(nextActivity.screen, nextActivity.category);
```

Line ~617 (bonus activity handler — find `void launchActivity(act.screen);`):
```ts
          void launchActivity(act.screen, act.category);
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScreenLauncher.ts src/components/home/HomeTab.tsx
git commit -m "feat(conjugation): carry adaptive category into the conjpractice launch"
```

---

## PHASE C — The session drill screen

### Task 6: `ConjugationSessionDrill` component + registration

**Files:**
- Create: `src/components/practice/ConjugationSessionDrill.tsx`
- Create: `src/tests/conjugation-session-drill.test.tsx`
- Modify: `src/components/AppRouter.tsx` (lazy import near other practice imports ~line 172; render block near the `conjlab` block ~line 1500)

- [ ] **Step 1: Write the failing component test**

```tsx
// src/tests/conjugation-session-drill.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConjugationSessionDrill from '../components/practice/ConjugationSessionDrill';

const VERBS = [
  { inf: 'pisati', en: 'to write', aspect: 'impf', pair: null, klass: 'a-em',
    cefr: 'A1', irregular: false,
    present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'] },
  { inf: 'govoriti', en: 'to speak', aspect: 'impf', pair: null, klass: 'i-im',
    cefr: 'A1', irregular: false,
    present: ['govorim','govoriš','govori','govorimo','govorite','govore'] },
];

// Stub the grammar hook so no network: return our VERBS.
vi.mock('../hooks/useGrammar', () => ({
  useGrammar: () => ({ grammar: { VERBS }, loading: false, error: null }),
}));
const rateSpy = vi.fn();
vi.mock('../lib/adaptive', async (orig) => {
  const actual = await orig<typeof import('../lib/adaptive')>();
  return { ...actual, rateCategorySession: (...a: unknown[]) => rateSpy(...a) };
});

describe('ConjugationSessionDrill', () => {
  it('drills the surfaced category and closes the adaptive loop on completion', () => {
    const goBack = vi.fn();
    render(
      <ConjugationSessionDrill category="present-tense" cefr="A1" goBack={goBack} award={vi.fn()} />,
    );
    // 4 options render for the first present-tense question.
    expect(screen.getAllByTestId('conj-option')).toHaveLength(4);
    // Answer every question to reach completion (small A1 present set).
    for (let guard = 0; guard < 60; guard++) {
      const opts = screen.queryAllByTestId('conj-option');
      if (opts.length === 0) break;
      fireEvent.click(opts[0]!);
      const next = screen.queryByText(/Next →|See Results/);
      if (next) fireEvent.click(next);
    }
    expect(rateSpy).toHaveBeenCalledTimes(1);
    expect(rateSpy.mock.calls[0]![0]).toBe('present-tense');
    expect(typeof rateSpy.mock.calls[0]![1]).toBe('number');
  });

  it('renders a graceful empty state when no cells are available', () => {
    const goBack = vi.fn();
    render(
      // past-tense at A1 → gated out → zero cells
      <ConjugationSessionDrill category="past-tense" cefr="A1" goBack={goBack} award={vi.fn()} />,
    );
    expect(screen.getByTestId('conj-empty')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/conjugation-session-drill.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/practice/ConjugationSessionDrill.tsx`**

```tsx
// src/components/practice/ConjugationSessionDrill.tsx
// Session-launched conjugation drill: turns a surfaced adaptive category into a
// level-gated, SR-prioritized drill and closes the adaptive loop on completion.
import React, { useMemo } from 'react';
import { H } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { getSR } from '../../lib/srs';
import { rateCategorySession } from '../../lib/adaptive';
import type { SkillCategory } from '../../lib/adaptive';
import ConjugationDrillEngine from './ConjugationDrillEngine';
import { cellsForCategory, type Cefr } from '../../lib/conjugation/category';
import { dueConjKeys } from '../../lib/conjugation/cells';
import { DAILY_CONJ_SET_SIZE } from '../../lib/conjugation/conjugationConfig';
import type { ConjVerb } from '../../lib/conjugation/types';

interface Props {
  category: SkillCategory;
  cefr: Cefr;
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

function daySeedNow(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export default function ConjugationSessionDrill({ category, cefr, goBack, award }: Props) {
  const { grammar, loading, error } = useGrammar();

  const verbs = (grammar?.VERBS as unknown as ConjVerb[]) || [];
  const cells = useMemo(() => {
    if (!verbs.length) return [];
    const dueKeys = dueConjKeys(getSR() as Record<string, { nextDue?: number }>, Date.now());
    return cellsForCategory(category, verbs, cefr, { size: DAILY_CONJ_SET_SIZE, daySeed: daySeedNow(), dueKeys });
  }, [verbs, category, cefr]);

  if (error) {
    return <div className="scr-wrap">{H('🔄 Conjugation', '', goBack)}<div className="c">Couldn’t load — retry.</div></div>;
  }
  if (loading || !grammar) {
    return <div className="scr-wrap">{H('🔄 Conjugation', '', goBack)}<div className="c">Loading…</div></div>;
  }
  if (cells.length === 0) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', '', goBack)}
        <div className="c" data-testid="conj-empty" style={{ textAlign: 'center', marginTop: 24 }}>
          Nothing to drill here yet.
          <button className="b bp" style={{ marginTop: 16 }} onClick={goBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <ConjugationDrillEngine
      verbs={verbs}
      cells={cells}
      award={award}
      goBack={goBack}
      onComplete={(score, total) => {
        rateCategorySession(category, total ? score / total : 0);
        goBack();
      }}
    />
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/tests/conjugation-session-drill.test.tsx`
Expected: PASS.

- [ ] **Step 5: Register the screen in `src/components/AppRouter.tsx`**

(a) Lazy import near the `ConjugationLab` import (~line 172):
```tsx
const ConjugationSessionDrill = lazyWithReload(() => import('./practice/ConjugationSessionDrill'));
```

(b) Render block immediately after the `conjlab` block (~line 1503). `_curEx` is already destructured (line 467); `getUserCefr` is already imported (line 5):
```tsx
        {currentScreen === 'conjpractice' && (
          <ScreenErrorBoundary key="conjpractice" name="conjpractice">
            <ConjugationSessionDrill
              category={
                (typeof _curEx === 'string' && _curEx.startsWith('conjpractice:')
                  ? _curEx.slice('conjpractice:'.length)
                  : 'present-tense') as React.ComponentProps<typeof ConjugationSessionDrill>['category']
              }
              cefr={getUserCefr(stats.xp || 0, stats.lc || 0, stats.gc || 0) as 'A1' | 'A2' | 'B1' | 'B2'}
              goBack={goBack}
              award={award}
            />
          </ScreenErrorBoundary>
        )}
```

- [ ] **Step 6: Typecheck + regression**

Run: `npm run typecheck && npx vitest run src/tests/conjugation-engine.test.tsx src/tests/conjugation-session-drill.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/ConjugationSessionDrill.tsx src/tests/conjugation-session-drill.test.tsx src/components/AppRouter.tsx
git commit -m "feat(conjugation): ConjugationSessionDrill screen + conjpractice route"
```

---

## PHASE D — Remove the Home card

### Task 7: Remove the Home-tab daily-conjugation card

**Files:**
- Modify: `src/components/home/HomeTab.tsx` (card block ~lines 462–495; `CONJ_LAB_ENABLED` import line 3)

- [ ] **Step 1: Delete the card block** (~lines 462–495), i.e. the entire:

```tsx
      {/* ── DAILY CONJUGATION SET (flag-gated; CONJ_LAB_ENABLED) ── */}
      {CONJ_LAB_ENABLED && (
        <button
          data-testid="home-daily-conjugation"
          ...
        </button>
      )}
```

- [ ] **Step 2: Remove the now-unused import** (line 3):

```ts
import { CONJ_LAB_ENABLED } from '../../lib/conjugation/conjugationConfig';
```

- [ ] **Step 3: Confirm no other use of the symbol in this file**

Run: `npx vitest run src/tests/ -t HomeTab 2>/dev/null; grep -n "CONJ_LAB_ENABLED\|home-daily-conjugation" src/components/home/HomeTab.tsx`
Expected: grep prints NOTHING (symbol fully removed).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no "declared but never used", no missing symbol).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HomeTab.tsx
git commit -m "feat(conjugation): remove Home-tab daily-conjugation card (now in Today's Session)"
```

---

## PHASE E — E2E + go-live gate

### Task 8: Rewrite the E2E for the session flow

**Files:**
- Modify: `e2e/conjugation.spec.js` (replace the uncommitted home-card version)

> Verify EVERY locator against the running app before un-skipping. A wrong locator turns a flake into a hard failure (PR #24 lesson). The drill render+scoring is already covered by the component tests; this is the navigation smoke.

- [ ] **Step 1: Write the spec** — drive the session into a conjugation drill by forcing a conjugation category to be due before load.

```js
// e2e/conjugation.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Conjugation in Today\'s Session', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);            // A2 user → present-tense + past/future unlocked
    await blockFirebase(page);
    await mockTTS(page);
    // Force the present-tense category overdue so the adaptive pick selects it.
    await page.addInitScript(() => {
      localStorage.setItem('nh_cat_sr', JSON.stringify({
        'present-tense': { stability: 1, recentAccuracy: 0.2, due: 1, lastSeen: 1 },
      }));
    });
  });

  test('Begin Session can reach a conjugation drill', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-daily-conjugation')).toHaveCount(0); // card removed
    const begin = page.getByRole('button', { name: /Begin Session/ });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    // Click through session activities until the conjugation drill renders (or bail).
    for (let i = 0; i < 6; i++) {
      const opts = page.getByTestId('conj-option');
      if (await opts.count() === 4) break;
      // not on conjugation yet — advance via the session's primary CTA if present
      const cta = page.getByRole('button', { name: /Begin Session|Continue|Next/ }).first();
      if (await cta.isVisible().catch(() => false)) { await cta.click(); await page.waitForTimeout(300); }
      else break;
    }
    const options = page.getByTestId('conj-option');
    await expect(options).toHaveCount(4, { timeout: 10_000 });
    await options.first().click();
    await expect(page.getByTestId('conj-feedback')).toBeVisible({ timeout: 5_000 });
  });
});
```

- [ ] **Step 2: Run against the app and VERIFY it passes**

Run: `npx playwright test e2e/conjugation.spec.js --project=chromium --reporter=line`
Expected: PASS. If a locator/nav step is wrong, FIX THE SPEC against the real rendered output (read `test-results/**/error-context.md`). If the session can't be deterministically driven to the conjugation drill, mark the test `test.describe.skip` with a comment explaining why and rely on the component tests — do NOT commit a hard-failing spec.

- [ ] **Step 3: Commit**

```bash
git add e2e/conjugation.spec.js
git commit -m "test(conjugation): E2E — Today's Session reaches the conjugation drill"
```

---

### Task 9: Full go-live gate + PR reconciliation

**Files:** none (verification + PR metadata)

- [ ] **Step 1: Run the full gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all PASS, 0 failed tests. (If `npm run build` hits an `EPERM` on `dist/` — Windows+Dropbox lock — re-run `rm -rf dist` then `npm run build`.)

- [ ] **Step 2: Confirm flag-off parity (manual reasoning + grep)**

Run: `grep -n "CONJ_LAB_ENABLED" src/hooks/useDailySession.ts src/lib/conjugation/category.ts`
Confirm: with `CONJ_LAB_ENABLED=false`, `resolveAdaptiveActivity` never routes to `conjpractice` (the `isConj` guard is false), so tense/aspect fall back to `CATEGORY_SCREEN_MAP` (cloze/future/aspectdrill) and `present-tense`, though in `ALL_CATEGORIES`, maps to no screen → skipped. Behavior reverts cleanly.

- [ ] **Step 3: Update PR #25 metadata**

Run:
```bash
gh pr edit 25 --title "Verb Conjugation — adaptive Today's Session integration (A1–B2)" --body "Conjugation now surfaces as an adaptive grammar subject inside Today's Session (like Genitive/Nominative), CEFR-gated A1→B2, drilled by the conjugation engine, loop closed via rateCategorySession. Conjugation Lab kept as the Practice browse surface. Home-tab card removed. Behind CONJ_LAB_ENABLED. See docs/superpowers/specs/2026-06-10-conjugation-session-integration-design.md."
```

- [ ] **Step 4: Push the branch**

Run: `git push origin feat/verb-conjugation-curriculum`
Expected: PR #25 updates; CI "Build & Deploy" runs.

- [ ] **Step 5: STOP — hand back to the user for the merge decision**

Do not squash-merge automatically. Report gate results + the open PR and let the user choose to merge (go-live) per their earlier go-live preference.

---

## Self-review notes (author)

- **Spec coverage:** Unit 1 adaptive category → Task 1; Unit 2 re-point+gate → Task 4; Unit 3 cellsForCategory → Tasks 2–3; Unit 4 session screen+registration → Tasks 5–6; Unit 5 remove card → Task 7 (browse surface untouched = kept); Unit 6 flag/PR → Tasks 4/7/9; Unit 7 testing → Tasks 1–3,4,6,8. All spec sections mapped.
- **Type consistency:** `Cefr` defined in `category.ts`, reused in `useDailySession.ts` and `ConjugationSessionDrill.tsx`. `cellsForCategory(category, verbs, userCefr, opts)` signature identical across Task 3 (def), Task 6 (call). `categoryToFormType` returns `FormType | null` consistently. `resolveAdaptiveActivity(userCefr, usedScreens): SessionActivity | null` consistent Task 4. `rateCategorySession(category, accuracy)` matches `adaptive.ts:337`.
- **Flag parity:** verified in Task 9 Step 2 — flag off ⇒ no `conjpractice` routing, `present-tense` inert.
- **No placeholders:** every code step shows complete code; commands have expected output.
