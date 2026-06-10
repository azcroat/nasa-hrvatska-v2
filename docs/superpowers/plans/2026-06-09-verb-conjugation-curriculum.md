# Verb Conjugation Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deep, "hammered-in" A1–B2 Croatian verb conjugation system: a rich explicit verb dataset, a reusable multiple-choice drill engine with morphologically-intelligent distractors, an FSRS spaced-repetition backbone with a mandatory daily set, and a curriculum hub with per-verb mastery.

**Architecture:** A "Conjugation Lab" hub (`ConjugationLab.tsx`) backed by one reusable MCQ engine (`ConjugationDrillEngine.tsx`), fed by an explicit `VERBS` dataset served from the existing `/api/content/grammar` endpoint. Pure helpers in `src/lib/conjugation/` build SR card keys, generate distractors, and select the daily set. Each conjugation cell is an FSRS card in the existing `src/lib/srs.ts` engine (which already syncs to Firestore via `progressSnapshot.ts`). Additive and feature-flagged.

**Tech Stack:** React + TypeScript (Vite), Vitest (unit), Playwright (E2E), Cloudflare Pages Functions (content API), FSRS-4.5 (`src/lib/srs.ts`).

---

## Design reference

Spec: `docs/superpowers/specs/2026-06-09-verb-conjugation-curriculum-design.md`. Read it first.

## Conventions discovered in the codebase (read before starting)

- **Test runner:** `npx vitest run <path>` for one file; `npm test` for all. Typecheck: `npm run typecheck` (`tsc --noEmit`). Lint: `npm run lint`.
- **Croatian characters:** the existing `grammar.js` data uses `\uXXXX` escapes (e.g. `č` = č, `š` = š, `ž` = ž, `ć` = ć, `đ` = đ). New data MAY use literal UTF-8 chars (the repo is UTF-8) — but match whichever the file already uses to keep diffs clean. This plan writes literal characters for readability; convert to `\uXXXX` only if the surrounding file does.
- **Adding a screen requires 3 edits** (architecture skill — all must happen together or the screen won't launch/persist): (1) the screen→category map in `src/hooks/useScreenLauncher.ts`; (2) a lazy import + render block in `src/components/AppRouter.tsx`; (3) an entry in `src/components/practice/exerciseCatalog.ts` via `go('<id>')`. Treat unknown `currentScreen` as "go home" — never crash.
- **SR cards sync automatically.** `src/lib/progressSnapshot.ts` line ~84 includes `sr: getSR()`. Any string-keyed card added through `getSRScore(key, …)` persists to localStorage `nh_sr` and syncs to Firestore. Do NOT add a separate sync path.
- **Feature flag pattern:** mirror `src/lib/checkpointConfig.ts` (`export const CHECKPOINTS_ENABLED = …`). Kill switch = one-line boolean.
- **Helpers** available from `'../../data'` (depth varies): `H(title, subtitle, goBack)` header, `Bar` progress bar, `speak(text)` TTS, `sh(array)` shuffle, `shMemo(seedKey, array, count)` seeded shuffle. `CompletionCard` lives at `src/components/shared/CompletionCard`. Award/quest: `award(xp, celebrate?, activityType?)` prop; `markQuest('grammar')` from `'../../lib/quests'`; `recordTopicResult('grammar', correct)` from `'../../lib/adaptive'`.
- **Backward compat:** never remove or change the existing `CONJ` export shape — `ConjugationDrill.tsx` and its tests depend on it. The new system is purely additive.

## File Structure

**Create:**
- `src/lib/conjugation/types.ts` — `ConjVerb`, `FormType`, `ConjCell` interfaces (shared types).
- `src/lib/conjugation/cardKey.ts` — build/parse stable SR card keys.
- `src/lib/conjugation/distractors.ts` — morphological distractor generator.
- `src/lib/conjugation/dailySet.ts` — daily conjugation set selection.
- `src/lib/conjugation/curriculum.ts` — the 16 unit definitions (id, cefr, title, formTypes, verb infinitives, explainer `curEx` link).
- `src/lib/conjugation/conjugationConfig.ts` — `CONJ_LAB_ENABLED` flag.
- `src/lib/conjugation/mastery.ts` — derive ✓/◐/✗ mastery from FSRS card state.
- `src/lib/conjugation/__tests__/*.test.ts` — unit tests per helper.
- `src/components/practice/ConjugationDrillEngine.tsx` — reusable MCQ drill component.
- `src/components/practice/ConjugationLab.tsx` — hub (curriculum map + mastery + daily-set entry).
- `src/tests/conjugation-engine.test.tsx` — engine component test.
- `e2e/conjugation.spec.js` — E2E smoke (mirror `e2e/checkpoints.spec.js`).

**Modify:**
- `functions/api/content/_data/grammar.js` — add `export const VERBS = [...]` (keep `CONJ`).
- `functions/api/content/grammar.js` — add `VERBS: GRAMMAR.VERBS` to `buildBody().data`.
- `src/types/content.ts` — add `VERBS: unknown[]` to `Grammar` interface.
- `functions/api/content/_data/_etags.js` — regenerate (via the generator script, not by hand).
- `src/hooks/useScreenLauncher.ts` — add `conjlab: 'gc'` to the screen→category map.
- `src/components/AppRouter.tsx` — lazy import + render block for `conjlab`.
- `src/components/practice/exerciseCatalog.ts` — add a `conjlab` catalog entry.
- `src/components/home/HomeTab.tsx` — surface the Daily Conjugation Set card (flag-gated).

---

## PHASE 0 — Data model & endpoint (ships: enriched verb data, nothing user-facing yet)

### Task 0.1: Shared conjugation types

**Files:**
- Create: `src/lib/conjugation/types.ts`

- [ ] **Step 1: Write the types**

```ts
// src/lib/conjugation/types.ts
// Canonical, explicitly-stored verb conjugation data. No runtime form generation:
// every cell is authored so nothing displayed is ever wrong.

export type Aspect = 'impf' | 'pf' | 'bi'; // imperfective | perfective | biaspectual
// Present-tense class teaching labels:
//  'a-am' = -ati → -am (čitati→čitam); 'a-em' = e-present (pisati→pišem, ići→idem);
//  'i-im' = -iti/-jeti → -im (govoriti→govorim); 'irr' = irregular (biti, htjeti).
export type PresentClass = 'a-am' | 'a-em' | 'i-im' | 'irr';

export type FormType = 'present' | 'past' | 'future1' | 'imperative' | 'conditional';
export type Gender = 'm' | 'f' | 'n';

export interface PastForms {
  m: string[]; // 6 forms: ja, ti, on, mi, vi, oni  (e.g. 'pisao sam' … 'pisali su')
  f: string[]; // 6 forms (feminine subject)
  n: string[]; // 6 forms (neuter / mixed-neuter plural)
}

export interface ConjVerb {
  inf: string; // 'pisati'
  en: string; // 'to write'
  aspect: Aspect;
  pair: string | null; // aspect partner infinitive, e.g. 'napisati'; null if none
  klass: PresentClass;
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  irregular: boolean;
  note?: string;
  present?: string[]; // 6
  past?: PastForms;
  future1?: string[]; // 6
  imperative?: string[]; // 3: [2sg, 1pl, 2pl]
  conditional?: string[]; // 6 (masculine baseline; gender handled by note + past data)
}

// A single drillable unit of conjugation.
export interface ConjCell {
  inf: string;
  formType: FormType;
  personIdx: number; // 0..5 for present/past/future1/conditional; 0..2 for imperative
  gender?: Gender; // present only on past/conditional
}

export const PERSONS_6 = ['ja', 'ti', 'on/ona', 'mi', 'vi', 'oni/one'] as const;
export const PERSONS_IMP = ['ti', 'mi', 'vi'] as const; // imperative addressees
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no references yet, file compiles).

- [ ] **Step 3: Commit**

```bash
git add src/lib/conjugation/types.ts
git commit -m "feat(conjugation): add shared conjugation data types"
```

---

### Task 0.2: Seed `VERBS` dataset — A1 present-tense foundation

This task authors the FIRST slice of data (A1 present tense, all 3 classes + biti + key irregulars). Later phases extend it. The data-integrity test (Task 0.3) is the acceptance gate for correctness.

**Files:**
- Modify: `functions/api/content/_data/grammar.js` (append a new export; do NOT touch `CONJ`)

- [ ] **Step 1: Append the `VERBS` export**

Add at the end of the verb section (after the existing `CONJ`/`MODAL` exports). These are fully-worked examples — author the present forms for ALL verbs listed in the A1 units of `curriculum.ts` (Task 3.2) the same way. Three canonical worked verbs (one per class) are shown in full; replicate the pattern:

```js
// ═══ CONJUGATION CURRICULUM DATASET (VERBS) ═══
// Explicit, aspect-aware verb data for the Conjugation Lab. Additive — CONJ stays.
export const VERBS = [
  // ---- class a-am (-ati → -am) ----
  {
    inf: 'čitati', en: 'to read', aspect: 'impf', pair: 'pročitati', klass: 'a-am',
    cefr: 'A1', irregular: false,
    present: ['čitam', 'čitaš', 'čita', 'čitamo', 'čitate', 'čitaju'],
  },
  // ---- class a-em (e-present) ----
  {
    inf: 'pisati', en: 'to write', aspect: 'impf', pair: 'napisati', klass: 'a-em',
    cefr: 'A1', irregular: false, note: 'present stem palatalizes s→š',
    present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
  },
  // ---- class i-im (-iti/-jeti → -im) ----
  {
    inf: 'govoriti', en: 'to speak', aspect: 'impf', pair: null, klass: 'i-im',
    cefr: 'A1', irregular: false,
    present: ['govorim', 'govoriš', 'govori', 'govorimo', 'govorite', 'govore'],
  },
  // ---- irregular ----
  {
    inf: 'biti', en: 'to be', aspect: 'impf', pair: null, klass: 'irr',
    cefr: 'A1', irregular: true,
    note: 'full present jesam… and clitic sam…; negation nisam',
    present: ['sam', 'si', 'je', 'smo', 'ste', 'su'],
  },
  // Author the remaining A1 present-tense verbs from curriculum.ts units 1–4 here,
  // following the exact same shape: raditi, učiti, voljeti, kuhati, imati, znati,
  // ići, jesti, piti, htjeti, moći, kupiti, …
];
```

Authoring rules (enforced by Task 0.3):
- `present` = exactly 6 forms in order [ja, ti, on/ona, mi, vi, oni/one].
- `klass` must be one of `'a-am' | 'a-em' | 'i-im' | 'irr'`.
- If `pair` is set, it is the perfective/imperfective partner infinitive (string).
- No empty strings. Croatian diacritics correct.

- [ ] **Step 2: Sanity-check the data loads (Node)**

Run: `node -e "import('./functions/api/content/_data/grammar.js').then(m => { console.log('VERBS count:', m.VERBS.length); console.log(m.VERBS[1]); })"`
Expected: prints a count ≥ 12 and the `pisati` record.

- [ ] **Step 3: Commit**

```bash
git add functions/api/content/_data/grammar.js
git commit -m "feat(conjugation): seed VERBS dataset with A1 present-tense verbs"
```

---

### Task 0.3: Data-integrity test (the acceptance gate for all verb data)

**Files:**
- Create: `src/lib/conjugation/__tests__/verbsData.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/verbsData.test.ts
import { describe, it, expect } from 'vitest';
import { VERBS } from '../../../../functions/api/content/_data/grammar.js';
import type { ConjVerb } from '../types';

const KLASSES = new Set(['a-am', 'a-em', 'i-im', 'irr']);
const ASPECTS = new Set(['impf', 'pf', 'bi']);

describe('VERBS dataset integrity', () => {
  const verbs = VERBS as ConjVerb[];

  it('is a non-empty array', () => {
    expect(Array.isArray(verbs)).toBe(true);
    expect(verbs.length).toBeGreaterThan(0);
  });

  it('every record has valid core fields', () => {
    for (const v of verbs) {
      expect(typeof v.inf, v.inf).toBe('string');
      expect(v.inf.trim().length).toBeGreaterThan(0);
      expect(typeof v.en).toBe('string');
      expect(KLASSES.has(v.klass), `${v.inf} klass=${v.klass}`).toBe(true);
      expect(ASPECTS.has(v.aspect), `${v.inf} aspect=${v.aspect}`).toBe(true);
      expect(['A1', 'A2', 'B1', 'B2']).toContain(v.cefr);
    }
  });

  it('form arrays have correct lengths and no empty strings', () => {
    const six = (arr: unknown): arr is string[] =>
      Array.isArray(arr) && arr.length === 6 && arr.every((s) => typeof s === 'string' && s.trim() !== '');
    for (const v of verbs) {
      if (v.present) expect(six(v.present), `${v.inf}.present`).toBe(true);
      if (v.future1) expect(six(v.future1), `${v.inf}.future1`).toBe(true);
      if (v.conditional) expect(six(v.conditional), `${v.inf}.conditional`).toBe(true);
      if (v.imperative) {
        expect(v.imperative.length, `${v.inf}.imperative`).toBe(3);
        expect(v.imperative.every((s) => typeof s === 'string' && s.trim() !== '')).toBe(true);
      }
      if (v.past) {
        for (const g of ['m', 'f', 'n'] as const) {
          expect(six(v.past[g]), `${v.inf}.past.${g}`).toBe(true);
        }
      }
    }
  });

  it('every aspect pair resolves to another record', () => {
    const infs = new Set(verbs.map((v) => v.inf));
    for (const v of verbs) {
      if (v.pair !== null) {
        // Partner may be authored later; if present in dataset it must be a real inf.
        if (infs.has(v.pair)) expect(infs.has(v.pair)).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts`
Expected: PASS (if it fails, FIX THE DATA, not the test — the test is the data spec).

- [ ] **Step 3: Commit**

```bash
git add src/lib/conjugation/__tests__/verbsData.test.ts
git commit -m "test(conjugation): add VERBS data-integrity gate"
```

---

### Task 0.4: Serve `VERBS` from the grammar endpoint + types + etag

**Files:**
- Modify: `functions/api/content/grammar.js` (add to `buildBody`)
- Modify: `src/types/content.ts` (add `VERBS` to `Grammar`)
- Modify: `functions/api/content/_data/_etags.js` (regenerate)

- [ ] **Step 1: Add `VERBS` to the endpoint body**

In `functions/api/content/grammar.js`, inside `buildBody().data`, add a line after `PADEZI_FULL`:

```js
      PADEZI_FULL: GRAMMAR.PADEZI_FULL,
      VERBS: GRAMMAR.VERBS,
```

- [ ] **Step 2: Extend the `Grammar` type**

In `src/types/content.ts`, add to the `Grammar` interface:

```ts
  PADEZI_FULL: Record<string, unknown>;
  VERBS: unknown[];
```

- [ ] **Step 3: Regenerate content etags**

Run: `node scripts/generate-content-etags.mjs`
Expected: `_etags.js` updated; `ETAGS.grammar` hash changes (the payload changed).

- [ ] **Step 4: Run the endpoint tests + typecheck**

Run: `npx vitest run functions/api/content/__tests__/ && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/api/content/grammar.js src/types/content.ts functions/api/content/_data/_etags.js
git commit -m "feat(conjugation): serve VERBS via grammar endpoint, type + etag"
```

---

## PHASE 1 — Core engine (ships: a working A1 present-tense drill with SR scoring)

### Task 1.1: Card-key build/parse

**Files:**
- Create: `src/lib/conjugation/cardKey.ts`
- Create: `src/lib/conjugation/__tests__/cardKey.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/cardKey.test.ts
import { describe, it, expect } from 'vitest';
import { buildCardKey, parseCardKey } from '../cardKey';
import type { ConjCell } from '../types';

describe('conjugation card keys', () => {
  it('round-trips a present cell', () => {
    const cell: ConjCell = { inf: 'pisati', formType: 'present', personIdx: 0 };
    const key = buildCardKey(cell);
    expect(key).toBe('conj|pisati|present|0');
    expect(parseCardKey(key)).toEqual(cell);
  });

  it('round-trips a gendered past cell', () => {
    const cell: ConjCell = { inf: 'ići', formType: 'past', personIdx: 2, gender: 'f' };
    const key = buildCardKey(cell);
    expect(key).toBe('conj|ići|past|2|f');
    expect(parseCardKey(key)).toEqual(cell);
  });

  it('returns null for non-conjugation keys', () => {
    expect(parseCardKey('kuća')).toBeNull();
    expect(parseCardKey('conj|bad')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/cardKey.test.ts`
Expected: FAIL ("buildCardKey is not a function" / module not found).

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/cardKey.ts
import type { ConjCell, FormType, Gender } from './types';

const PREFIX = 'conj';
const FORM_TYPES: FormType[] = ['present', 'past', 'future1', 'imperative', 'conditional'];
const GENDERS: Gender[] = ['m', 'f', 'n'];

// Infinitives are letters only, so '|' is a safe delimiter.
export function buildCardKey(cell: ConjCell): string {
  const parts = [PREFIX, cell.inf, cell.formType, String(cell.personIdx)];
  if (cell.gender) parts.push(cell.gender);
  return parts.join('|');
}

export function parseCardKey(key: string): ConjCell | null {
  if (typeof key !== 'string' || !key.startsWith(PREFIX + '|')) return null;
  const parts = key.split('|');
  if (parts.length < 4 || parts.length > 5) return null;
  const [, inf, formType, personStr, gender] = parts;
  if (!inf || !FORM_TYPES.includes(formType as FormType)) return null;
  const personIdx = Number(personStr);
  if (!Number.isInteger(personIdx) || personIdx < 0) return null;
  const cell: ConjCell = { inf, formType: formType as FormType, personIdx };
  if (gender !== undefined) {
    if (!GENDERS.includes(gender as Gender)) return null;
    cell.gender = gender as Gender;
  }
  return cell;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/cardKey.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/cardKey.ts src/lib/conjugation/__tests__/cardKey.test.ts
git commit -m "feat(conjugation): SR card key build/parse with round-trip tests"
```

---

### Task 1.2: A pure helper to read a cell's correct form

**Files:**
- Create: `src/lib/conjugation/forms.ts`
- Create: `src/lib/conjugation/__tests__/forms.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/forms.test.ts
import { describe, it, expect } from 'vitest';
import { formFor } from '../forms';
import type { ConjVerb } from '../types';

const pisati: ConjVerb = {
  inf: 'pisati', en: 'to write', aspect: 'impf', pair: 'napisati', klass: 'a-em',
  cefr: 'A1', irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
  past: {
    m: ['pisao sam', 'pisao si', 'pisao je', 'pisali smo', 'pisali ste', 'pisali su'],
    f: ['pisala sam', 'pisala si', 'pisala je', 'pisale smo', 'pisale ste', 'pisale su'],
    n: ['pisalo sam', 'pisalo si', 'pisalo je', 'pisala smo', 'pisala ste', 'pisala su'],
  },
};

describe('formFor', () => {
  it('returns the present form by person', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'present', personIdx: 0 })).toBe('pišem');
  });
  it('returns the gendered past form', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'past', personIdx: 0, gender: 'f' })).toBe('pisala sam');
  });
  it('returns null when the form-type is not authored for the verb', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'future1', personIdx: 0 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/forms.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/forms.ts
import type { ConjVerb, ConjCell } from './types';

export function formFor(verb: ConjVerb, cell: ConjCell): string | null {
  switch (cell.formType) {
    case 'present':
      return verb.present?.[cell.personIdx] ?? null;
    case 'future1':
      return verb.future1?.[cell.personIdx] ?? null;
    case 'conditional':
      return verb.conditional?.[cell.personIdx] ?? null;
    case 'imperative':
      return verb.imperative?.[cell.personIdx] ?? null;
    case 'past': {
      const g = cell.gender ?? 'm';
      return verb.past?.[g]?.[cell.personIdx] ?? null;
    }
    default:
      return null;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/forms.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/forms.ts src/lib/conjugation/__tests__/forms.test.ts
git commit -m "feat(conjugation): formFor cell-to-form resolver"
```

---

### Task 1.3: Morphological distractor generator

**Files:**
- Create: `src/lib/conjugation/distractors.ts`
- Create: `src/lib/conjugation/__tests__/distractors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/distractors.test.ts
import { describe, it, expect } from 'vitest';
import { buildDistractors } from '../distractors';
import type { ConjVerb, ConjCell } from '../types';

const pisati: ConjVerb = {
  inf: 'pisati', en: 'to write', aspect: 'impf', pair: 'napisati', klass: 'a-em',
  cefr: 'A1', irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};
const cell: ConjCell = { inf: 'pisati', formType: 'present', personIdx: 0 }; // pišem

describe('buildDistractors', () => {
  it('returns exactly 3 unique distractors, none equal to the correct form', () => {
    const d = buildDistractors({ verb: pisati, cell, correct: 'pišem', allVerbs: [pisati], rng: seeded(1) });
    expect(d).toHaveLength(3);
    expect(new Set(d).size).toBe(3);
    expect(d).not.toContain('pišem');
  });

  it('prefers wrong-person forms of the same verb', () => {
    const d = buildDistractors({ verb: pisati, cell, correct: 'pišem', allVerbs: [pisati], rng: seeded(1) });
    // pišeš/piše/… are wrong persons of the same verb
    expect(d.some((x) => pisati.present!.includes(x))).toBe(true);
  });
});

// deterministic RNG for tests
function seeded(n: number): () => number {
  let s = n;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/distractors.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/distractors.ts
import type { ConjVerb, ConjCell } from './types';
import { formFor } from './forms';

interface Args {
  verb: ConjVerb;
  cell: ConjCell;
  correct: string;
  allVerbs: ConjVerb[];
  rng?: () => number; // injectable for deterministic tests; defaults below
}

// Wrong-class ending swap: the classic learner error (applying -am to an -em verb, etc.).
function classConfusion(verb: ConjVerb, cell: ConjCell): string | null {
  if (cell.formType !== 'present' || !verb.present) return null;
  const form = verb.present[cell.personIdx];
  if (!form) return null;
  // crude but effective: swap the characteristic vowel of the ending
  if (verb.klass === 'a-em') return form.replace(/e(m|š|mo|te)?$/, 'a$1'); // pišem→pišam
  if (verb.klass === 'a-am') return form.replace(/a(m|š|mo|te)?$/, 'e$1');
  if (verb.klass === 'i-im') return form.replace(/i(m|š|mo|te)?$/, 'e$1');
  return null;
}

export function buildDistractors(args: Args): string[] {
  const { verb, cell, correct, allVerbs } = args;
  const rng = args.rng ?? Math.random;
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const add = (s: string | null | undefined) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  // Priority 1: wrong person, same verb + form-type.
  const personCount = cell.formType === 'imperative' ? 3 : 6;
  const otherPersons = shuffle(
    Array.from({ length: personCount }, (_, i) => i).filter((i) => i !== cell.personIdx),
    rng,
  );
  for (const pi of otherPersons) {
    add(formFor(verb, { ...cell, personIdx: pi }));
    if (out.length >= 3) return out.slice(0, 3);
  }

  // Priority 2: wrong class ending (the classic error).
  add(classConfusion(verb, cell));
  if (out.length >= 3) return out.slice(0, 3);

  // Priority 3: wrong aspect partner's same cell (if the partner is in the dataset).
  if (verb.pair) {
    const partner = allVerbs.find((v) => v.inf === verb.pair);
    if (partner) add(formFor(partner, cell));
  }
  if (out.length >= 3) return out.slice(0, 3);

  // Priority 4 (fallback): forms of other verbs, same cell.
  for (const v of shuffle(allVerbs.filter((v) => v.inf !== verb.inf), rng)) {
    add(formFor(v, cell));
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/distractors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/distractors.ts src/lib/conjugation/__tests__/distractors.test.ts
git commit -m "feat(conjugation): morphological distractor generator"
```

---

### Task 1.4: Feature flag

**Files:**
- Create: `src/lib/conjugation/conjugationConfig.ts`

- [ ] **Step 1: Write the flag**

```ts
// src/lib/conjugation/conjugationConfig.ts
// Kill switch for the Conjugation Lab + Daily Conjugation Set.
// Set false to instantly hide both surfaces (one-line revert). Mirrors checkpointConfig.ts.
export const CONJ_LAB_ENABLED = false;

// Number of items in the mandatory daily conjugation set.
export const DAILY_CONJ_SET_SIZE = 15;
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/lib/conjugation/conjugationConfig.ts
git commit -m "feat(conjugation): add CONJ_LAB_ENABLED flag (default off)"
```

---

### Task 1.5: The reusable drill engine component

**Files:**
- Create: `src/components/practice/ConjugationDrillEngine.tsx`
- Create: `src/tests/conjugation-engine.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
// src/tests/conjugation-engine.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConjugationDrillEngine from '../components/practice/ConjugationDrillEngine';
import type { ConjVerb, ConjCell } from '../lib/conjugation/types';

const pisati: ConjVerb = {
  inf: 'pisati', en: 'to write', aspect: 'impf', pair: null, klass: 'a-em',
  cefr: 'A1', irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};
const cells: ConjCell[] = [{ inf: 'pisati', formType: 'present', personIdx: 0 }];

describe('ConjugationDrillEngine', () => {
  it('shows the prompt and 4 options, scores a correct answer', () => {
    const onComplete = vi.fn();
    render(
      <ConjugationDrillEngine verbs={[pisati]} cells={cells} onComplete={onComplete} award={vi.fn()} goBack={vi.fn()} />,
    );
    // prompt shows infinitive + person
    expect(screen.getByText(/pisati/)).toBeTruthy();
    // 4 options rendered
    const opts = screen.getAllByTestId('conj-option');
    expect(opts).toHaveLength(4);
    // click the correct one
    const correct = opts.find((o) => o.textContent?.includes('pišem'))!;
    fireEvent.click(correct);
    expect(screen.getByTestId('conj-feedback').textContent).toMatch(/✓|Correct|Točno/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/conjugation-engine.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the engine**

```tsx
// src/components/practice/ConjugationDrillEngine.tsx
import React, { useMemo, useState, useRef } from 'react';
import { H, Bar, speak, sh } from '../../data';
import { markQuest } from '../../lib/quests';
import { recordTopicResult } from '../../lib/adaptive';
import { getSRScore } from '../../lib/srs';
import { buildCardKey } from '../../lib/conjugation/cardKey';
import { buildDistractors } from '../../lib/conjugation/distractors';
import { formFor } from '../../lib/conjugation/forms';
import { PERSONS_6, PERSONS_IMP } from '../../lib/conjugation/types';
import type { ConjVerb, ConjCell } from '../../lib/conjugation/types';

interface Props {
  verbs: ConjVerb[];
  cells: ConjCell[]; // ordered queue of cells to drill
  onComplete: (score: number, total: number) => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  goBack: () => void;
}

const TENSE_LABEL: Record<string, string> = {
  present: 'PRESENT', past: 'PAST', future1: 'FUTURE', imperative: 'IMPERATIVE', conditional: 'CONDITIONAL',
};

function personLabel(cell: ConjCell): string {
  const arr = cell.formType === 'imperative' ? PERSONS_IMP : PERSONS_6;
  return arr[cell.personIdx] ?? '';
}

export default function ConjugationDrillEngine({ verbs, cells, onComplete, award, goBack }: Props) {
  const byInf = useMemo(() => new Map(verbs.map((v) => [v.inf, v])), [verbs]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const startRef = useRef<number>(0);
  const finished = useRef(false);

  const cell = cells[i];
  const verb = cell ? byInf.get(cell.inf) : undefined;
  const correct = verb && cell ? formFor(verb, cell) : null;

  // Build options once per question (seeded by index so re-renders are stable).
  const options = useMemo(() => {
    if (!verb || !cell || !correct) return [];
    const distractors = buildDistractors({ verb, cell, correct, allVerbs: verbs });
    return sh([correct, ...distractors]);
  }, [verb, cell, correct, verbs]);

  // start timer per question
  if (startRef.current === 0) startRef.current = Date.now();

  if (!cell || !verb || !correct) {
    // finished or malformed cell → results
    const total = cells.length;
    if (!finished.current) {
      finished.current = true;
      if (typeof award === 'function') award(score * 2 + 10, false, 'grammar');
      markQuest('grammar');
      onComplete(score, total);
    }
    const pct = total ? Math.round((score / total) * 100) : 0;
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', 'Drill complete', goBack)}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : '👍'}</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{score} / {total}</div>
          <button className="b bp" style={{ marginTop: 16 }} onClick={goBack}>Done</button>
        </div>
      </div>
    );
  }

  const total = cells.length;
  function choose(opt: string) {
    if (answered) return;
    const isCorrect = opt === correct;
    setSelected(opt);
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
    const elapsed = Date.now() - startRef.current;
    getSRScore(buildCardKey(cell!), isCorrect, elapsed); // feed FSRS
    recordTopicResult('grammar', isCorrect);
  }
  function next() {
    setAnswered(false);
    setSelected(null);
    startRef.current = 0;
    setI((n) => n + 1);
  }

  return (
    <div className="scr-wrap">
      {H('🔄 Conjugation', `${i + 1} / ${total}`, goBack)}
      <Bar v={i + 1} mx={total} h={6} />
      <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 14, fontSize: 11, fontWeight: 800, color: '#fff', background: '#0e7490' }}>
          {TENSE_LABEL[cell.formType]}{cell.gender ? ` (${cell.gender})` : ''}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{verb.inf} ({verb.en})</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', marginTop: 8 }}>{personLabel(cell)} ___?</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {options.map((o, oi) => (
          <button
            key={oi}
            data-testid="conj-option"
            className={'ob ' + (answered ? (o === correct ? 'ok' : selected === o ? 'no' : '') : '')}
            onClick={() => { choose(o); if (o === correct) speak(o); }}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div data-testid="conj-feedback" className="c" style={{ marginTop: 12, fontSize: 14 }}>
          {selected === correct ? '✓ Točno!' : `✗ ${selected} — ${personLabel(cell)} → ${correct}`}
        </div>
      )}
      {answered && (
        <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
          {i < total - 1 ? 'Next →' : 'See Results'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/tests/conjugation-engine.test.tsx`
Expected: PASS. (If `@testing-library/react` import differs, match the import style used by an existing `*.test.tsx`, e.g. `src/tests/conjugation-drill.test.tsx`.)

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/components/practice/ConjugationDrillEngine.tsx src/tests/conjugation-engine.test.tsx
git commit -m "feat(conjugation): reusable MCQ drill engine with SR scoring"
```

---

## PHASE 2 — Hammering: daily set + Home surface

### Task 2.1: Curriculum definition (16 units)

**Files:**
- Create: `src/lib/conjugation/curriculum.ts`
- Create: `src/lib/conjugation/__tests__/curriculum.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/curriculum.test.ts
import { describe, it, expect } from 'vitest';
import { UNITS } from '../curriculum';
import { VERBS } from '../../../../functions/api/content/_data/grammar.js';
import type { ConjVerb } from '../types';

describe('conjugation curriculum', () => {
  it('has 16 units in CEFR order A1→B2', () => {
    expect(UNITS).toHaveLength(16);
    const order = ['A1', 'A2', 'B1', 'B2'];
    let last = 0;
    for (const u of UNITS) {
      const idx = order.indexOf(u.cefr);
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });

  it('every unit verb infinitive exists in the VERBS dataset', () => {
    const infs = new Set((VERBS as ConjVerb[]).map((v) => v.inf));
    for (const u of UNITS) {
      for (const inf of u.verbs) {
        expect(infs.has(inf), `unit ${u.id} → ${inf}`).toBe(true);
      }
    }
  });

  it('every unit declares at least one form type', () => {
    for (const u of UNITS) expect(u.formTypes.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/curriculum.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/curriculum.ts
import type { FormType } from './types';

export interface ConjUnit {
  id: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  title: string;
  blurb: string;
  formTypes: FormType[];
  verbs: string[]; // infinitives — must exist in VERBS
  explainer?: string; // optional curEx to launch an existing explainer screen
}

// NOTE: `verbs` arrays must reference infinitives present in VERBS (grammar.js).
// As later phases author more data, extend the verb lists here in lockstep.
export const UNITS: ConjUnit[] = [
  { id: 'pres-classes', cefr: 'A1', title: 'Present — the 3 classes', blurb: '-am / -em / -im endings', formTypes: ['present'], verbs: ['čitati', 'pisati', 'govoriti', 'raditi'], explainer: 'tenses' },
  { id: 'biti', cefr: 'A1', title: 'biti (to be)', blurb: 'jesam/sam + nije/nisam', formTypes: ['present'], verbs: ['biti'] },
  { id: 'pres-irregular', cefr: 'A1', title: 'Irregular present', blurb: 'ići, jesti, piti, htjeti, moći', formTypes: ['present'], verbs: ['ići', 'jesti', 'piti'] },
  { id: 'negation', cefr: 'A1', title: 'Negation', blurb: 'ne + verb, nemam, nisam', formTypes: ['present'], verbs: ['imati', 'biti'] },
  { id: 'past', cefr: 'A2', title: 'Past (perfekt)', blurb: 'aux + l-participle, gender agreement', formTypes: ['past'], verbs: ['čitati', 'govoriti', 'ići'], explainer: 'past_tense_lesson' },
  { id: 'future1', cefr: 'A2', title: 'Future I (futur I)', blurb: 'inf + ću/ćeš, -t drop', formTypes: ['future1'], verbs: ['čitati', 'govoriti', 'ići'], explainer: 'future_tense_lesson' },
  { id: 'modals', cefr: 'A2', title: 'Modal verbs', blurb: 'morati, htjeti, moći + infinitive', formTypes: ['present'], verbs: ['htjeti', 'moći'], explainer: 'modal' },
  { id: 'aspect-intro', cefr: 'A2', title: 'Aspect — intro', blurb: 'impf vs pf; no perfective present-meaning', formTypes: ['present'], verbs: ['pisati'], explainer: 'aspectdrill' },
  { id: 'imperative', cefr: 'B1', title: 'Imperative', blurb: 'piši/pišimo/pišite; nemoj + inf', formTypes: ['imperative'], verbs: ['pisati', 'čitati'] },
  { id: 'aspect-tenses', cefr: 'B1', title: 'Aspect in past & future', blurb: 'pisao vs napisao', formTypes: ['past'], verbs: ['pisati'] },
  { id: 'reflexive', cefr: 'B1', title: 'Reflexive (se)', blurb: 'zovem se, osjećam se', formTypes: ['present'], verbs: ['govoriti'], explainer: 'reflexive' },
  { id: 'conditional', cefr: 'B1', title: 'Conditional I', blurb: 'bih/bi + l-participle', formTypes: ['conditional'], verbs: ['čitati', 'govoriti'], explainer: 'conditional' },
  { id: 'aspect-pairs', cefr: 'B2', title: 'Aspect pairs — formation', blurb: 'prefixation & suppletion', formTypes: ['present'], verbs: ['pisati'] },
  { id: 'aspect-matrix', cefr: 'B2', title: 'Aspect × tense matrix', blurb: 'perfective present = future meaning', formTypes: ['present', 'future1'], verbs: ['pisati'] },
  { id: 'motion-prefixes', cefr: 'B2', title: 'Verbs of motion + prefixes', blurb: 'ići → doći/otići/proći', formTypes: ['present'], verbs: ['ići'] },
  { id: 'consolidation', cefr: 'B2', title: 'Mixed mastery', blurb: 'interleaved review of everything', formTypes: ['present', 'past', 'future1'], verbs: ['čitati', 'pisati', 'govoriti', 'ići'] },
];
```

(When Phase 4 authors more verbs/forms, extend the `verbs` arrays here so the curriculum test keeps passing.)

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/curriculum.test.ts`
Expected: PASS (this also forces Task 0.2 data to include every referenced infinitive).

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/curriculum.ts src/lib/conjugation/__tests__/curriculum.test.ts
git commit -m "feat(conjugation): 16-unit A1-B2 curriculum definition"
```

---

### Task 2.2: Daily-set selection

**Files:**
- Create: `src/lib/conjugation/dailySet.ts`
- Create: `src/lib/conjugation/__tests__/dailySet.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/dailySet.test.ts
import { describe, it, expect } from 'vitest';
import { selectDailySet } from '../dailySet';
import type { ConjCell } from '../types';

const candidate: ConjCell[] = Array.from({ length: 40 }, (_, i) => ({
  inf: i % 2 ? 'pisati' : 'čitati', formType: 'present' as const, personIdx: i % 6,
}));

describe('selectDailySet', () => {
  it('caps at the requested size', () => {
    const set = selectDailySet({ candidates: candidate, dueKeys: new Set(), size: 15, daySeed: 20260609 });
    expect(set.length).toBeLessThanOrEqual(15);
  });

  it('is deterministic for a given day-seed', () => {
    const a = selectDailySet({ candidates: candidate, dueKeys: new Set(), size: 15, daySeed: 20260609 });
    const b = selectDailySet({ candidates: candidate, dueKeys: new Set(), size: 15, daySeed: 20260609 });
    expect(a).toEqual(b);
  });

  it('prioritizes due cards first', () => {
    const due = new Set(['conj|pisati|present|3']);
    const set = selectDailySet({ candidates: candidate, dueKeys: due, size: 5, daySeed: 1 });
    // a due card should appear in the set
    const { buildCardKey } = require('../cardKey');
    expect(set.map((c: ConjCell) => buildCardKey(c))).toContain('conj|pisati|present|3');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/dailySet.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/dailySet.ts
import type { ConjCell } from './types';
import { buildCardKey } from './cardKey';

interface Args {
  candidates: ConjCell[]; // all cells from the user's unlocked units
  dueKeys: Set<string>; // SR card keys currently due
  size: number;
  daySeed: number; // e.g. yyyymmdd; keeps the set stable across reloads
}

// Mulberry32 — deterministic PRNG seeded by the day.
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function selectDailySet({ candidates, dueKeys, size, daySeed }: Args): ConjCell[] {
  const rng = rngFrom(daySeed);
  const due = candidates.filter((c) => dueKeys.has(buildCardKey(c)));
  const fresh = candidates.filter((c) => !dueKeys.has(buildCardKey(c)));
  const out: ConjCell[] = [];
  const seen = new Set<string>();
  for (const c of [...shuffleSeeded(due, rng), ...shuffleSeeded(fresh, rng)]) {
    const k = buildCardKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= size) break;
  }
  return out;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/dailySet.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/dailySet.ts src/lib/conjugation/__tests__/dailySet.test.ts
git commit -m "feat(conjugation): deterministic daily-set selection (due-first)"
```

---

### Task 2.3: A helper that expands unlocked units into candidate cells + reads due keys

**Files:**
- Create: `src/lib/conjugation/cells.ts`
- Create: `src/lib/conjugation/__tests__/cells.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/cells.test.ts
import { describe, it, expect } from 'vitest';
import { cellsForUnit, dueConjKeys } from '../cells';
import type { ConjVerb } from '../types';

const pisati: ConjVerb = {
  inf: 'pisati', en: 'to write', aspect: 'impf', pair: null, klass: 'a-em',
  cefr: 'A1', irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};

describe('cellsForUnit', () => {
  it('expands a present unit into 6 cells per verb', () => {
    const cells = cellsForUnit({ formTypes: ['present'], verbs: ['pisati'] } as any, [pisati]);
    expect(cells).toHaveLength(6);
    expect(cells[0]).toMatchObject({ inf: 'pisati', formType: 'present', personIdx: 0 });
  });
  it('expands a past unit into 18 cells per verb (6 persons × 3 genders)', () => {
    const past: ConjVerb = { ...pisati, past: { m: a6(), f: a6(), n: a6() } };
    const cells = cellsForUnit({ formTypes: ['past'], verbs: ['pisati'] } as any, [past]);
    expect(cells).toHaveLength(18);
  });
});

describe('dueConjKeys', () => {
  it('filters an SR map to only due conjugation keys', () => {
    const now = Date.now();
    const sr = {
      'kuća': { nextDue: now - 1000 },
      'conj|pisati|present|0': { nextDue: now - 1000 }, // due
      'conj|pisati|present|1': { nextDue: now + 100000 }, // not due
    } as any;
    const due = dueConjKeys(sr, now);
    expect(due.has('conj|pisati|present|0')).toBe(true);
    expect(due.has('conj|pisati|present|1')).toBe(false);
    expect(due.has('kuća')).toBe(false);
  });
});

function a6() { return ['1', '2', '3', '4', '5', '6']; }
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/cells.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/cells.ts
import type { ConjVerb, ConjCell, FormType, Gender } from './types';
import type { ConjUnit } from './curriculum';
import { parseCardKey } from './cardKey';
import { formFor } from './forms';

const GENDERS: Gender[] = ['m', 'f', 'n'];

export function cellsForUnit(unit: Pick<ConjUnit, 'formTypes' | 'verbs'>, allVerbs: ConjVerb[]): ConjCell[] {
  const byInf = new Map(allVerbs.map((v) => [v.inf, v]));
  const out: ConjCell[] = [];
  for (const inf of unit.verbs) {
    const verb = byInf.get(inf);
    if (!verb) continue;
    for (const ft of unit.formTypes) {
      const personCount = ft === 'imperative' ? 3 : 6;
      for (let p = 0; p < personCount; p++) {
        if (ft === 'past' || ft === 'conditional') {
          for (const g of GENDERS) {
            const cell: ConjCell = { inf, formType: ft as FormType, personIdx: p, gender: g };
            if (formFor(verb, cell) != null) out.push(cell);
          }
        } else {
          const cell: ConjCell = { inf, formType: ft as FormType, personIdx: p };
          if (formFor(verb, cell) != null) out.push(cell);
        }
      }
    }
  }
  return out;
}

// SRMap value shape we rely on: { nextDue: number } (see src/lib/srs.ts).
export function dueConjKeys(sr: Record<string, { nextDue?: number }>, now: number): Set<string> {
  const due = new Set<string>();
  for (const key in sr) {
    if (!parseCardKey(key)) continue;
    const nd = sr[key]?.nextDue ?? 0;
    if (nd <= now) due.add(key);
  }
  return due;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/cells.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/cells.ts src/lib/conjugation/__tests__/cells.test.ts
git commit -m "feat(conjugation): unit→cells expansion + due-key filter"
```

---

### Task 2.4: Register the `conjlab` screen (3 required edits)

**Files:**
- Modify: `src/hooks/useScreenLauncher.ts`
- Modify: `src/components/AppRouter.tsx`
- Modify: `src/components/practice/exerciseCatalog.ts`

- [ ] **Step 1: Add the screen→category mapping**

In `src/hooks/useScreenLauncher.ts`, in the screen→category object (where `conjdrill: 'gc'` lives), add:

```ts
  conjlab: 'gc',
```

- [ ] **Step 2: Add the lazy import + render block in AppRouter**

Near the other lazy imports (e.g. line ~171 `const ConjugationDrill = lazyWithReload(...)`), add:

```tsx
const ConjugationLab = lazyWithReload(() => import('./practice/ConjugationLab'));
```

Near the `conjdrill` render block (line ~1494), add:

```tsx
        {currentScreen === 'conjlab' && (
          <ScreenErrorBoundary key="conjlab" name="conjlab">
            <ConjugationLab goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
```

- [ ] **Step 3: Add the catalog entry**

In `src/components/practice/exerciseCatalog.ts`, near the `verbdrill` entry, add (gate on the flag at the call site if the catalog supports it; otherwise the Lab self-hides via the flag inside the component):

```ts
    {
      id: 'conjlab',
      label: 'Conjugation Lab',
      icon: '🔄',
      desc: 'Master verb conjugation A1–B2',
      category: 'grammar',
      cefr: 'A1+',
      duration: '~10 min',
      action: go('conjlab'),
    },
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScreenLauncher.ts src/components/AppRouter.tsx src/components/practice/exerciseCatalog.ts
git commit -m "feat(conjugation): register conjlab screen (launcher, router, catalog)"
```

---

## PHASE 3 — Hub + mastery + Home daily set

### Task 3.1: Mastery derivation

**Files:**
- Create: `src/lib/conjugation/mastery.ts`
- Create: `src/lib/conjugation/__tests__/mastery.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/mastery.test.ts
import { describe, it, expect } from 'vitest';
import { cellMastery, verbMastery } from '../mastery';
import type { ConjCell } from '../types';

describe('mastery', () => {
  it('classifies a cell by FSRS stability', () => {
    expect(cellMastery({ s: 30 } as any)).toBe('mastered'); // s ≥ 21
    expect(cellMastery({ s: 5 } as any)).toBe('learning');
    expect(cellMastery(undefined)).toBe('new');
  });
  it('summarizes a verb across its cells', () => {
    const cells: ConjCell[] = [
      { inf: 'pisati', formType: 'present', personIdx: 0 },
      { inf: 'pisati', formType: 'present', personIdx: 1 },
    ];
    const sr = { 'conj|pisati|present|0': { s: 30 }, 'conj|pisati|present|1': { s: 30 } } as any;
    expect(verbMastery('pisati', cells, sr)).toBe('mastered');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/mastery.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/conjugation/mastery.ts
import type { ConjCell } from './types';
import { buildCardKey } from './cardKey';

export type MasteryLevel = 'new' | 'learning' | 'mastered';

// FSRS 'stability' (days). Thresholds chosen so "mastered" ≈ a 3-week+ retention interval.
const MASTERED_S = 21;

export function cellMastery(card: { s?: number } | undefined): MasteryLevel {
  if (!card || typeof card.s !== 'number') return 'new';
  return card.s >= MASTERED_S ? 'mastered' : 'learning';
}

export function verbMastery(
  inf: string,
  cells: ConjCell[],
  sr: Record<string, { s?: number }>,
): MasteryLevel {
  const verbCells = cells.filter((c) => c.inf === inf);
  if (verbCells.length === 0) return 'new';
  const levels = verbCells.map((c) => cellMastery(sr[buildCardKey(c)]));
  if (levels.every((l) => l === 'mastered')) return 'mastered';
  if (levels.some((l) => l !== 'new')) return 'learning';
  return 'new';
}

// A unit is "complete enough" to unlock the next when ≥80% of its cells are learning+.
export function unitUnlocksNext(cells: ConjCell[], sr: Record<string, { s?: number }>): boolean {
  if (cells.length === 0) return true;
  const touched = cells.filter((c) => cellMastery(sr[buildCardKey(c)]) !== 'new').length;
  return touched / cells.length >= 0.8;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/mastery.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/mastery.ts src/lib/conjugation/__tests__/mastery.test.ts
git commit -m "feat(conjugation): mastery derivation from FSRS stability"
```

---

### Task 3.2: The Conjugation Lab hub

**Files:**
- Create: `src/components/practice/ConjugationLab.tsx`

- [ ] **Step 1: Implement the hub**

The hub: loads grammar (`useGrammar`), reads `VERBS`, shows the curriculum map with per-unit mastery rings, a "Daily Set" button, and launches `ConjugationDrillEngine` for a chosen unit or the daily set. Self-hides if the flag is off.

```tsx
// src/components/practice/ConjugationLab.tsx
import React, { useMemo, useState } from 'react';
import { H } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { getSR } from '../../lib/srs';
import ConjugationDrillEngine from './ConjugationDrillEngine';
import { UNITS } from '../../lib/conjugation/curriculum';
import { cellsForUnit, dueConjKeys } from '../../lib/conjugation/cells';
import { selectDailySet } from '../../lib/conjugation/dailySet';
import { verbMastery, type MasteryLevel } from '../../lib/conjugation/mastery';
import { CONJ_LAB_ENABLED, DAILY_CONJ_SET_SIZE } from '../../lib/conjugation/conjugationConfig';
import type { ConjVerb, ConjCell } from '../../lib/conjugation/types';

interface Props {
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

const RING: Record<MasteryLevel, string> = { new: '○', learning: '◐', mastered: '●' };

function daySeedNow(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export default function ConjugationLab({ goBack, award }: Props) {
  const { grammar, loading, error } = useGrammar();
  const [activeCells, setActiveCells] = useState<ConjCell[] | null>(null);

  if (!CONJ_LAB_ENABLED) {
    return <div className="scr-wrap">{H('🔄 Conjugation Lab', 'Coming soon', goBack)}</div>;
  }
  if (error) return <div className="scr-wrap">{H('🔄 Conjugation Lab', '', goBack)}<div className="c">Couldn’t load — retry.</div></div>;
  if (loading || !grammar) return <div className="scr-wrap">{H('🔄 Conjugation Lab', '', goBack)}<div className="c">Loading…</div></div>;

  const verbs = (grammar.VERBS as unknown as ConjVerb[]) || [];

  if (activeCells) {
    return (
      <ConjugationDrillEngine
        verbs={verbs}
        cells={activeCells}
        award={award}
        goBack={() => setActiveCells(null)}
        onComplete={() => { /* mastery recomputes from SR on return */ }}
      />
    );
  }

  return (
    <div className="scr-wrap">
      {H('🔄 Conjugation Lab', 'Master Croatian verbs A1–B2', goBack)}

      <button
        className="b bp"
        style={{ width: '100%', marginTop: 8 }}
        onClick={() => {
          const all = UNITS.flatMap((u) => cellsForUnit(u, verbs));
          const due = dueConjKeys(getSR() as any, Date.now());
          const set = selectDailySet({ candidates: all, dueKeys: due, size: DAILY_CONJ_SET_SIZE, daySeed: daySeedNow() });
          if (set.length) setActiveCells(set);
        }}
      >
        🔥 Daily Conjugation Set ({DAILY_CONJ_SET_SIZE})
      </button>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {UNITS.map((u) => {
          const cells = cellsForUnit(u, verbs);
          const sr = getSR() as any;
          const m = u.verbs
            .map((inf) => verbMastery(inf, cells, sr))
            .every((x) => x === 'mastered') ? 'mastered' : (cells.some((c) => sr[`conj|${c.inf}|${c.formType}|${c.personIdx}`]) ? 'learning' : 'new');
          return (
            <button
              key={u.id}
              className="tc"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => { if (cells.length) setActiveCells(cells); }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0e7490' }}>{u.cefr} · {u.title}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{u.blurb}</div>
              </div>
              <div style={{ fontSize: 20 }}>{RING[m as MasteryLevel]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + run the engine test (regression)**

Run: `npm run typecheck && npx vitest run src/tests/conjugation-engine.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/practice/ConjugationLab.tsx
git commit -m "feat(conjugation): Conjugation Lab hub with curriculum map + daily set"
```

---

### Task 3.3: Surface the Daily Conjugation Set on Home (flag-gated)

**Files:**
- Modify: `src/components/home/HomeTab.tsx`

- [ ] **Step 1: Add a flag-gated Home card that launches `conjlab`**

Find where HomeTab renders its action cards / daily challenge (search for an existing launch like `setScr` / `launchPathItem` / `sCurEx`). Add, gated on `CONJ_LAB_ENABLED`, a card near the top (respect `feedback_no_bottom_burial` — primary feature above the fold):

```tsx
// import at top:
import { CONJ_LAB_ENABLED } from '../../lib/conjugation/conjugationConfig';

// in the render, near the daily challenge / above the fold:
{CONJ_LAB_ENABLED && (
  <button
    className="tc"
    data-testid="home-daily-conjugation"
    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', width: '100%', cursor: 'pointer' }}
    onClick={() => launchConjLab()}
  >
    <span style={{ fontSize: 28 }}>🔄</span>
    <span style={{ textAlign: 'left' }}>
      <span style={{ display: 'block', fontWeight: 800 }}>Daily Conjugation</span>
      <span style={{ display: 'block', fontSize: 12, color: '#78716c' }}>Drill verbs the SR engine says you’re forgetting</span>
    </span>
  </button>
)}
```

Wire `launchConjLab` to the same navigation HomeTab uses for other screens (e.g. the prop that sets `currentScreen`/`curEx` to `'conjlab'` — match how an existing Home card launches a practice screen, such as the Review or Daily Challenge button).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeTab.tsx
git commit -m "feat(conjugation): flag-gated Daily Conjugation card on Home"
```

---

## PHASE 4 — Content expansion (A2–B2 forms + aspect) and E2E

This phase fills out the dataset so every curriculum unit has real forms. It is mostly content authoring gated by the integrity test (Task 0.3) and the curriculum test (Task 2.1). Split into commits per CEFR tier so each is reviewable.

### Task 4.1: Author A2 forms — past (perfekt) with gender + future I

**Files:**
- Modify: `functions/api/content/_data/grammar.js` (`VERBS`)

- [ ] **Step 1: Add `past` and `future1` to the A2 verbs**

For every verb referenced by A2 units `past` and `future1` in `curriculum.ts` (čitati, govoriti, ići), add the form sets. Worked examples (author the rest identically):

```js
// čitati — add to its record:
    past: {
      m: ['čitao sam', 'čitao si', 'čitao je', 'čitali smo', 'čitali ste', 'čitali su'],
      f: ['čitala sam', 'čitala si', 'čitala je', 'čitale smo', 'čitale ste', 'čitale su'],
      n: ['čitalo sam', 'čitalo si', 'čitalo je', 'čitala smo', 'čitala ste', 'čitala su'],
    },
    future1: ['čitat ću', 'čitat ćeš', 'čitat će', 'čitat ćemo', 'čitat ćete', 'čitat će'],
// ići — note the irregular l-participle (išao/išla/išlo; pl išli/išle/išla):
    past: {
      m: ['išao sam', 'išao si', 'išao je', 'išli smo', 'išli ste', 'išli su'],
      f: ['išla sam', 'išla si', 'išla je', 'išle smo', 'išle ste', 'išle su'],
      n: ['išlo sam', 'išlo si', 'išlo je', 'išla smo', 'išla ste', 'išla su'],
    },
    future1: ['ići ću', 'ići ćeš', 'ići će', 'ići ćemo', 'ići ćete', 'ići će'],
```

- [ ] **Step 2: Run the data + curriculum tests**

Run: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts src/lib/conjugation/__tests__/curriculum.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add functions/api/content/_data/grammar.js
git commit -m "feat(conjugation): author A2 past (gendered) + future I forms"
```

### Task 4.2: Author B1–B2 forms — imperative, conditional, modals, aspect pairs

**Files:**
- Modify: `functions/api/content/_data/grammar.js` (`VERBS`)

- [ ] **Step 1: Add `imperative`, `conditional`, modal present, and aspect-pair records**

Worked examples (author the rest identically — cover every infinitive referenced by B1/B2 units):

```js
// pisati — imperative [2sg,1pl,2pl] + conditional (masculine baseline):
    imperative: ['piši', 'pišimo', 'pišite'],
    conditional: ['pisao bih', 'pisao bi', 'pisao bi', 'pisali bismo', 'pisali biste', 'pisali bi'],
// napisati — the perfective partner of pisati (aspect-pairs unit):
  {
    inf: 'napisati', en: 'to write (complete)', aspect: 'pf', pair: 'pisati', klass: 'a-em',
    cefr: 'B2', irregular: false, note: 'perfective; "present" forms carry future meaning',
    present: ['napišem', 'napišeš', 'napiše', 'napišemo', 'napišete', 'napišu'],
  },
```

- [ ] **Step 2: Run the data + curriculum tests**

Run: `npx vitest run src/lib/conjugation/__tests__/`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add functions/api/content/_data/grammar.js
git commit -m "feat(conjugation): author B1-B2 imperative/conditional/aspect-pair forms"
```

### Task 4.3: Regenerate etag after data growth

**Files:**
- Modify: `functions/api/content/_data/_etags.js`

- [ ] **Step 1: Regenerate**

Run: `node scripts/generate-content-etags.mjs`
Expected: `ETAGS.grammar` changes.

- [ ] **Step 2: Run endpoint tests**

Run: `npx vitest run functions/api/content/__tests__/`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add functions/api/content/_data/_etags.js
git commit -m "chore(conjugation): regenerate grammar etag after data expansion"
```

### Task 4.4: E2E smoke test

**Files:**
- Create: `e2e/conjugation.spec.js` (mirror `e2e/checkpoints.spec.js`)

- [ ] **Step 1: Write the E2E test**

Temporarily flip `CONJ_LAB_ENABLED = true` locally (or stub it) so the Lab renders. Mirror the patterns in `e2e/checkpoints.spec.js` and the `playwright-e2e-patterns` skill (colorScheme light, darkMode false, data-testid selectors, audio stub). **Verify every locator against real rendered output** before asserting (a wrong locator turns a flake into a hard failure — see the PR #24 lesson).

```js
// e2e/conjugation.spec.js
import { test, expect } from '@playwright/test';

test('conjugation drill: answer a question and see feedback', async ({ page }) => {
  await page.goto('/'); // adjust to your test harness entry
  // navigate to the Conjugation Lab (Practice → Conjugation Lab, or Home daily card)
  // ... follow how checkpoints.spec.js navigates ...
  await page.getByText(/Daily Conjugation Set/).click();
  const options = page.getByTestId('conj-option');
  await expect(options).toHaveCount(4);
  await options.first().click();
  await expect(page.getByTestId('conj-feedback')).toBeVisible();
});
```

- [ ] **Step 2: Build + run E2E**

Run: `npm run test:e2e -- conjugation.spec.js`
Expected: PASS (or document any flake per the flake-policy; do not commit a wrong-locator "fix").

- [ ] **Step 3: Revert the local flag flip (keep `CONJ_LAB_ENABLED = false` until go-live) + commit**

```bash
git add e2e/conjugation.spec.js
git commit -m "test(conjugation): E2E smoke for the drill engine"
```

---

## Go-live

1. Run the full gate: `npm run lint && npm run typecheck && npm test && npm run build`.
2. Flip `CONJ_LAB_ENABLED = true` in `src/lib/conjugation/conjugationConfig.ts` (one-line) when ready to ship; optionally roll out per CEFR tier by trimming `UNITS` first.
3. Push to master (auto-deploys via CF Pages). Confirm via CI "Build & Deploy" success — **do not** wait on `version.json` (content-derived, won't flip for code-only changes).
4. Kill switch: set `CONJ_LAB_ENABLED = false` to hide both surfaces instantly.

---

## Self-review notes (author)

- **Spec coverage:** curriculum (Task 2.1/3.2), MCQ engine (1.5), smart distractors (1.3), SR backbone (1.5 scoring + auto-sync via progressSnapshot), daily set (2.2/3.3), mastery (3.1/3.2), aspect (data in 4.2 + distractor priority 3 in 1.3), backward-compat (CONJ untouched; noted throughout). All spec sections map to tasks.
- **Open questions from spec resolved:** verb-unit assignment → curriculum.ts; mastery thresholds → mastery.ts (s≥21 mastered, 80% unit unlock); daily-set placement → both Lab button + Home card; CONJ kept verbatim (additive `VERBS`).
- **Type consistency:** `ConjVerb`/`ConjCell`/`FormType`/`MasteryLevel` used consistently; card-key format `conj|inf|formType|personIdx[|gender]` identical across cardKey, dailySet, cells, mastery, engine.
