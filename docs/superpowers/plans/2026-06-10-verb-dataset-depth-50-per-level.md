# Verb Dataset Depth (50+/level) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `VERBS` to ~50 verbs anchored per CEFR level (~200 total), each with Present+Past+Future (B1/B2 also Imperative+Conditional), with a build-time morphology validator guaranteeing correctness, shipped phased A1→B2.

**Architecture:** A pure `morphology.ts` derives expected regular Croatian forms from each verb's class + infinitive; a test asserts authored forms match (except cells flagged irregular). `cellsForCategory` is decoupled from curriculum unit lists to drill the full level pool. Content is authored per level via a generate-then-validate workflow.

**Tech Stack:** TypeScript, Vitest, Node ESM data module (`functions/api/content/_data/grammar.js`).

---

## Design reference

Spec: `docs/superpowers/specs/2026-06-10-verb-dataset-depth-50-per-level-design.md`. Read it first.

## Conventions

- Branch: `feat/verb-dataset-depth` (already created off master).
- Test one file: `npx vitest run <path>`. All: `npm test`. Typecheck: `npm run typecheck`. Lint: `npm run lint`. Build: `npm run build` (if `EPERM` on dist — Dropbox lock — `rm -rf dist` then rebuild). E2E build is `npm run preview` on :4173 — irrelevant here.
- Pre-commit husky runs eslint (max 0 warnings) + prettier. Avoid inline `import()` type annotations in tests (`@typescript-eslint/consistent-type-imports`) — use top-level `import type * as X`.
- `VERBS` lives in `functions/api/content/_data/grammar.js` (ESM, literal UTF-8 Croatian OK). After changing it, regenerate etags: `node scripts/generate-content-etags.mjs`.
- Existing 17 verbs (for Phase 0): a-am = čitati,kuhati,imati,znati,spavati; a-em(non-irr) = pisati,napisati; i-im = govoriti,raditi,učiti,voljeti; irr(flagged) = biti,htjeti,moći,ići,jesti,piti.

## File structure

**Create:**
- `src/lib/conjugation/morphology.ts` — pure `expectedForms(verb, formType)` + helpers.
- `src/lib/conjugation/__tests__/morphology.test.ts` — unit tests for the rules.
- `scripts/generate-regular-forms.mjs` — dev authoring aid (emits regular forms for metadata stubs).

**Modify:**
- `src/lib/conjugation/types.ts` — add `presentStem?`, `irregularForms?` to `ConjVerb`.
- `src/lib/conjugation/__tests__/verbsData.test.ts` — add the morphology-equality + coverage assertions.
- `src/lib/conjugation/category.ts` — `cellsForCategory` drills the full pool (decouple from UNITS).
- `src/lib/conjugation/__tests__/category.test.ts` — update for full-pool sourcing.
- `functions/api/content/_data/grammar.js` — back-fill 17 verbs (Phase 0) + author content (Phases 1–4).
- `functions/api/content/_data/_etags.js` — regenerated after each content batch.

---

## PHASE 0 — Foundation (validator + decouple; no new content)

### Task 1: Schema fields

**Files:** Modify `src/lib/conjugation/types.ts`

- [ ] **Step 1: Add the fields to `ConjVerb`** (after `conditional?`):

```ts
  conditional?: string[]; // 6 (masculine baseline; gender handled by note + past data)
  // e-present stem for the 'a-em' class (e.g. pisati → 'piš'); enables present derivation.
  presentStem?: string;
  // Per-form exemptions from the morphology validator's equality check (still shape-checked).
  // Use for verbs regular except one form; for wholly irregular verbs prefer `irregular: true`.
  irregularForms?: FormType[];
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/conjugation/types.ts
git commit -m "feat(conjugation): add presentStem + irregularForms to ConjVerb"
```

---

### Task 2: Morphology validator

**Files:** Create `src/lib/conjugation/morphology.ts`, `src/lib/conjugation/__tests__/morphology.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conjugation/__tests__/morphology.test.ts
import { describe, it, expect } from 'vitest';
import { expectedForms } from '../morphology';
import type { ConjVerb } from '../types';

const base = { en: '', aspect: 'impf' as const, pair: null, cefr: 'A1' as const, irregular: false };

const citati: ConjVerb = { ...base, inf: 'čitati', klass: 'a-am' };
const govoriti: ConjVerb = { ...base, inf: 'govoriti', klass: 'i-im' };
const pisati: ConjVerb = { ...base, inf: 'pisati', klass: 'a-em', presentStem: 'piš' };
const biti: ConjVerb = { ...base, inf: 'biti', klass: 'irr', irregular: true };

describe('expectedForms — present', () => {
  it('a-am', () => {
    expect(expectedForms(citati, 'present')).toEqual(['čitam','čitaš','čita','čitamo','čitate','čitaju']);
  });
  it('i-im', () => {
    expect(expectedForms(govoriti, 'present')).toEqual(['govorim','govoriš','govori','govorimo','govorite','govore']);
  });
  it('a-em uses presentStem', () => {
    expect(expectedForms(pisati, 'present')).toEqual(['pišem','pišeš','piše','pišemo','pišete','pišu']);
  });
  it('a-em without presentStem → null', () => {
    expect(expectedForms({ ...pisati, presentStem: undefined }, 'present')).toBeNull();
  });
  it('irr → null', () => {
    expect(expectedForms(biti, 'present')).toBeNull();
  });
});

describe('expectedForms — future1', () => {
  it('-ti elision', () => {
    expect(expectedForms(citati, 'future1')).toEqual(['čitat ću','čitat ćeš','čitat će','čitat ćemo','čitat ćete','čitat će']);
  });
});

describe('expectedForms — past (gendered)', () => {
  it('regular -ati participle', () => {
    expect(expectedForms(citati, 'past')).toEqual({
      m: ['čitao sam','čitao si','čitao je','čitali smo','čitali ste','čitali su'],
      f: ['čitala sam','čitala si','čitala je','čitale smo','čitale ste','čitale su'],
      n: ['čitalo sam','čitalo si','čitalo je','čitala smo','čitala ste','čitala su'],
    });
  });
  it('regular -iti participle', () => {
    expect((expectedForms(govoriti, 'past') as any).m[0]).toBe('govorio sam');
  });
});

describe('expectedForms — imperative', () => {
  it('a-am', () => { expect(expectedForms(citati, 'imperative')).toEqual(['čitaj','čitajmo','čitajte']); });
  it('i-im', () => { expect(expectedForms(govoriti, 'imperative')).toEqual(['govori','govorimo','govorite']); });
  it('a-em', () => { expect(expectedForms(pisati, 'imperative')).toEqual(['piši','pišimo','pišite']); });
});

describe('expectedForms — conditional', () => {
  it('participle + bih', () => {
    expect(expectedForms(citati, 'conditional')).toEqual(['čitao bih','čitao bi','čitao bi','čitali bismo','čitali biste','čitali bi']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/morphology.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/conjugation/morphology.ts`**

```ts
// src/lib/conjugation/morphology.ts
// Pure derivation of REGULAR Croatian conjugation forms from a verb's class +
// infinitive. Returns null when a form is not regularly derivable (irregular /
// missing presentStem) so the validator falls back to shape-checking only.
import type { ConjVerb, FormType, PastForms } from './types';

const PRES_AM = ['m', 'š', '', 'mo', 'te', 'ju'];
const PRES_IM = ['im', 'iš', 'i', 'imo', 'ite', 'e'];
const PRES_EM = ['em', 'eš', 'e', 'emo', 'ete', 'u'];
const FUT_CLITICS = ['ću', 'ćeš', 'će', 'ćemo', 'ćete', 'će'];
const COND_CLITICS = ['bih', 'bi', 'bi', 'bismo', 'biste', 'bi'];
const PAST_AUX = ['sam', 'si', 'je', 'smo', 'ste', 'su'];

// l-participle stem from a regular infinitive: drop -ti, keep the theme vowel.
// čitati→čita, govoriti→govori, voljeti→volje, pisati→pisa. Returns null for -ći etc.
function participleStem(inf: string): string | null {
  if (inf.endsWith('ti')) return inf.slice(0, -2);
  return null; // -ći and others are irregular → caller flags
}

// Present-tense root for derivable classes.
function presentRoot(verb: ConjVerb): string | null {
  if (verb.klass === 'a-am') return verb.inf.endsWith('ati') ? verb.inf.slice(0, -3) + 'a' : null; // čita
  if (verb.klass === 'i-im') {
    if (verb.inf.endsWith('iti')) return verb.inf.slice(0, -3); // govor
    if (verb.inf.endsWith('jeti')) return verb.inf.slice(0, -4); // vol
    return null;
  }
  if (verb.klass === 'a-em') return verb.presentStem ?? null; // piš
  return null; // irr
}

function present(verb: ConjVerb): string[] | null {
  const root = presentRoot(verb);
  if (root == null) return null;
  if (verb.klass === 'a-am') return PRES_AM.map((e) => root + (e === '' ? '' : (e === 'ju' ? 'ju' : e))).map((s, i) => (PRES_AM[i] === '' ? root : root + PRES_AM[i]));
  if (verb.klass === 'i-im') return PRES_IM.map((e) => root + e);
  if (verb.klass === 'a-em') return PRES_EM.map((e) => root + e);
  return null;
}

function future1(verb: ConjVerb): string[] | null {
  const base = verb.inf.endsWith('ti') ? verb.inf.slice(0, -1) : verb.inf; // čitat / ići
  if (!verb.inf.endsWith('ti') && !verb.inf.endsWith('ći')) return null;
  return FUT_CLITICS.map((c) => `${base} ${c}`);
}

function past(verb: ConjVerb): PastForms | null {
  const stem = participleStem(verb.inf);
  if (stem == null) return null;
  const mk = (sg: string, pl: string) =>
    [0, 1, 2].map((i) => `${stem}${sg} ${PAST_AUX[i]}`).concat([3, 4, 5].map((i) => `${stem}${pl} ${PAST_AUX[i]}`));
  return {
    m: mk('o', 'li'),
    f: mk('la', 'le'),
    n: mk('lo', 'la'),
  };
}

function conditional(verb: ConjVerb): string[] | null {
  const stem = participleStem(verb.inf);
  if (stem == null) return null;
  return COND_CLITICS.map((c, i) => `${stem}${i < 3 ? 'o' : 'li'} ${c}`);
}

function imperative(verb: ConjVerb): string[] | null {
  // [2sg, 1pl, 2pl] from the present root.
  const root = presentRoot(verb);
  if (root == null) return null;
  if (verb.klass === 'a-am') return [root + 'j', root + 'jmo', root + 'jte']; // čitaj
  // i-im and a-em → root + i / imo / ite (govori, piši)
  return [root + 'i', root + 'imo', root + 'ite'];
}

export function expectedForms(verb: ConjVerb, formType: FormType): string[] | PastForms | null {
  if (verb.irregular) return null;
  switch (formType) {
    case 'present': return present(verb);
    case 'future1': return future1(verb);
    case 'past': return past(verb);
    case 'conditional': return conditional(verb);
    case 'imperative': return imperative(verb);
    default: return null;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/morphology.test.ts`
Expected: PASS. (If the `present` a-am mapping reads awkwardly, simplify the body to `return PRES_AM.map((e) => root + e)` — note `PRES_AM[2]` is `''` so 3sg = root, which is correct.)

- [ ] **Step 5: Simplify present() and re-run**

Replace the `a-am` branch in `present()` with the clean form:

```ts
  if (verb.klass === 'a-am') return PRES_AM.map((e) => root + e);
```

Run: `npx vitest run src/lib/conjugation/__tests__/morphology.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/lib/conjugation/morphology.ts src/lib/conjugation/__tests__/morphology.test.ts
git commit -m "feat(conjugation): morphology validator — derive expected regular forms"
```

---

### Task 3: Wire validator into the data test + back-fill the existing 17 verbs

**Files:** Modify `src/lib/conjugation/__tests__/verbsData.test.ts`, `functions/api/content/_data/grammar.js`

- [ ] **Step 1: Add the morphology-equality + coverage block to `verbsData.test.ts`**

```ts
import { expectedForms } from '../morphology';
import type { FormType, ConjVerb } from '../types';

describe('VERBS morphology correctness', () => {
  const verbs = VERBS as ConjVerb[];
  const FORMS: FormType[] = ['present', 'past', 'future1', 'imperative', 'conditional'];

  it('every non-exempt authored form matches the derived regular form', () => {
    for (const v of verbs) {
      for (const ft of FORMS) {
        if (!v[ft]) continue;
        if (v.irregular || v.irregularForms?.includes(ft)) continue; // exempt → shape test covers it
        const exp = expectedForms(v, ft);
        expect(exp, `${v.inf}.${ft}: no derivation but not flagged irregular`).not.toBeNull();
        expect(v[ft], `${v.inf}.${ft} mismatch vs morphology rule`).toEqual(exp);
      }
    }
  });

  it('hand-trusted (irregular) forms stay a minority of authored forms', () => {
    let total = 0, exempt = 0;
    for (const v of verbs) for (const ft of FORMS) {
      if (!v[ft]) continue;
      total++;
      if (v.irregular || v.irregularForms?.includes(ft)) exempt++;
    }
    // Guard against dodging the validator by over-flagging. Allow generous headroom
    // for early phases where irregular A1 verbs dominate.
    expect(exempt / total, `exempt ratio ${exempt}/${total}`).toBeLessThanOrEqual(0.6);
  });
});
```

- [ ] **Step 2: Run to see which existing verbs fail**

Run: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts`
Expected: FAIL — `pisati`/`napisati` (a-em) lack `presentStem`; possibly imperative/past mismatches on regulars; irregular verbs (ići/jesti/piti) have authored forms but aren't exempt per-form where their derivations differ.

- [ ] **Step 3: Back-fill `grammar.js` so the 17 verbs pass**

For each existing verb, apply:
- a-em non-irr (`pisati`, `napisati`): add `presentStem: 'piš'` / `'napiš'`.
- a-am (`čitati`,`kuhati`,`imati`,`znati`,`spavati`), i-im (`govoriti`,`raditi`,`učiti`,`voljeti`): no change needed for present; for any authored past/future/imperative/conditional, confirm they equal the derived rule — if a regular verb's authored form differs, FIX THE DATA to match the rule (the rule is the canonical regular form).
- irr verbs already `irregular: true` (`biti`,`htjeti`,`moći`,`ići`,`jesti`,`piti`) → exempt automatically; no change.

Run after edits: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts`
Expected: PASS. Iterate: each failure names `${inf}.${formType}` — fix that cell or add `presentStem`. Do NOT weaken the test.

- [ ] **Step 4: Full conjugation test sweep + typecheck**

Run: `npx vitest run src/lib/conjugation/ && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/conjugation/__tests__/verbsData.test.ts functions/api/content/_data/grammar.js
git commit -m "feat(conjugation): validate VERBS against morphology rules; back-fill 17 verbs"
```

---

### Task 4: Authoring aid script

**Files:** Create `scripts/generate-regular-forms.mjs`

- [ ] **Step 1: Implement the script**

```js
// scripts/generate-regular-forms.mjs
// Dev aid (NOT runtime): given verb metadata stubs, print regular forms to paste
// into VERBS. Forms remain explicitly stored; the morphology test re-derives to confirm.
// Usage: node scripts/generate-regular-forms.mjs '[{"inf":"kuhati","en":"to cook","klass":"a-am","aspect":"impf","pair":"skuhati","cefr":"A1","forms":["present","past","future1"]}]'
import { expectedForms } from '../src/lib/conjugation/morphology.ts';

const stubs = JSON.parse(process.argv[2] || '[]');
for (const s of stubs) {
  const v = { irregular: false, pair: null, ...s };
  const out = { inf: v.inf, en: v.en, aspect: v.aspect, pair: v.pair, klass: v.klass, cefr: v.cefr, irregular: false };
  if (v.presentStem) out.presentStem = v.presentStem;
  for (const ft of (v.forms || ['present'])) {
    const f = expectedForms(v, ft);
    if (f == null) { console.error(`! ${v.inf}.${ft}: not derivable — author by hand + flag`); continue; }
    out[ft] = f;
  }
  console.log(JSON.stringify(out, null, 2) + ',');
}
```

> Note: this script imports a `.ts` file; run with `npx tsx scripts/generate-regular-forms.mjs '...'` (tsx is available via npx) or via `node --experimental-strip-types` on Node 22+. If neither runs cleanly in the environment, author forms directly and rely on the morphology test — the script is a convenience, not a gate.

- [ ] **Step 2: Smoke-test the script**

Run: `npx tsx scripts/generate-regular-forms.mjs '[{"inf":"kuhati","en":"to cook","klass":"a-am","aspect":"impf","pair":"skuhati","cefr":"A1","forms":["present","past","future1"]}]'`
Expected: prints a JSON verb object with present/past/future1 filled (kuham…, kuhao sam…, kuhat ću…).

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-regular-forms.mjs
git commit -m "chore(conjugation): dev script to generate regular forms from metadata"
```

---

### Task 5: Decouple the session drill from curriculum unit lists

**Files:** Modify `src/lib/conjugation/category.ts`, `src/lib/conjugation/__tests__/category.test.ts`

- [ ] **Step 1: Update the test for full-pool sourcing**

Replace the `cellsForCategory` describe block's expectations so candidates come from the full `verbs` array (not curriculum units). Add a verb NOT in any curriculum unit and assert it still appears:

```ts
  it('drills any level-appropriate verb in the pool, regardless of curriculum units', () => {
    const orphan: ConjVerb = {
      inf: 'kuhati', en: 'to cook', aspect: 'impf', pair: null, klass: 'a-am',
      cefr: 'A1', irregular: false, present: ['kuham','kuhaš','kuha','kuhamo','kuhate','kuhaju'],
    };
    const cells = cellsForCategory('present-tense', [orphan], 'A1', { size: 50, daySeed: 1, dueKeys: new Set() });
    expect(cells.some((c) => c.inf === 'kuhati' && c.formType === 'present')).toBe(true);
  });

  it('excludes verbs above the user CEFR', () => {
    const b2: ConjVerb = { inf: 'razmišljati', en: 'to ponder', aspect: 'impf', pair: null, klass: 'a-am',
      cefr: 'B2', irregular: false, present: ['razmišljam','razmišljaš','razmišlja','razmišljamo','razmišljate','razmišljaju'] };
    const cells = cellsForCategory('present-tense', [b2], 'A1', { size: 50, daySeed: 1, dueKeys: new Set() });
    expect(cells).toHaveLength(0);
  });
```

(Keep the existing aspect/empty-category/determinism tests; they still hold.)

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: FAIL (orphan verb not drilled — current code requires curriculum-unit membership).

- [ ] **Step 3: Rewrite `cellsForCategory` to use the full pool**

Replace the UNITS-based candidate build (the `const units = UNITS.filter(...)` block through the candidate loop) with:

```ts
  const isAspect = ASPECT_CATEGORIES.has(category);
  const GENDERS: Array<'m' | 'f' | 'n'> = ['m', 'f', 'n'];
  const candidates: ConjCell[] = [];
  const seen = new Set<string>();
  for (const v of verbs) {
    if (cefrRank(v.cefr as Cefr) > cefrRank(userCefr)) continue;
    if (isAspect && !v.pair) continue; // aspect categories drill aspect-pair verbs only
    const persons = formType === 'imperative' ? 3 : 6;
    for (let p = 0; p < persons; p++) {
      if (formType === 'past' || formType === 'conditional') {
        for (const g of GENDERS) {
          const cell: ConjCell = { inf: v.inf, formType, personIdx: p, gender: g };
          if (formFor(v, cell) == null) continue;
          const k = buildCardKey(cell);
          if (seen.has(k)) continue;
          seen.add(k); candidates.push(cell);
        }
      } else {
        const cell: ConjCell = { inf: v.inf, formType, personIdx: p };
        if (formFor(v, cell) == null) continue;
        const k = buildCardKey(cell);
        if (seen.has(k)) continue;
        seen.add(k); candidates.push(cell);
      }
    }
  }
```

Update imports at the top of `category.ts`: remove the now-unused `UNITS` and `cellsForUnit` imports; add `formFor` from `'./forms'` and `ConjCell` (already imported). Keep `buildCardKey`, `selectDailySet`, `cefrRank`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/conjugation/__tests__/category.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npm run typecheck && npx eslint src/lib/conjugation/category.ts`
Expected: PASS, no warnings (remove unused imports if eslint flags them).

```bash
git add src/lib/conjugation/category.ts src/lib/conjugation/__tests__/category.test.ts
git commit -m "feat(conjugation): drill full level-appropriate verb pool, not just curriculum units"
```

---

### Task 6: Phase-0 gate

- [ ] **Step 1: Full gate**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all PASS (0 failed). Build not required (no content/runtime-bundle change beyond logic already covered).

- [ ] **Step 2: Push + PR (foundation ships independently)**

```bash
git push -u origin feat/verb-dataset-depth
gh pr create --base master --title "Verb dataset depth — foundation (morphology validator + full-pool drill)" --body "Adds the build-time morphology validator, presentStem/irregularForms schema, dev authoring script, and decouples the session drill from curriculum unit lists. No new verbs yet (content lands in follow-up phases). Behind CONJ_LAB_ENABLED."
```

- [ ] **Step 3: STOP for review.** Report gate results; let the user decide to merge foundation before content phases (recommended — it de-risks the validator against real data).

---

## PHASE 1 — A1 content (~50 verbs: present + past + future)

### Task 7: Author the A1 verb set

**Files:** Modify `functions/api/content/_data/grammar.js`

**A1 target set (~50 high-frequency everyday verbs).** Already present (14): čitati, kuhati, imati, znati, spavati, pisati, govoriti, raditi, učiti, voljeti, biti, ići, jesti, piti. **Add ~36 to reach ≥50:**

`a-am` (regular, derivable): gledati(watch), slušati(listen), igrati(play), pjevati(sing), plivati(swim), čekati(wait), pitati(ask), odgovarati(answer), pomagati(help)→a-em? use `pomoći` irr separately; putovati→a-em; kupovati→a-em; razgovarati(converse), ručati(lunch), večerati(dine), doručkovati→a-em; započinjati skip; spremati(tidy), zvati→a-em; nositi→i-im.
`i-im` (regular): raditi✓, učiti✓, voljeti✓, govoriti✓, misliti(think), nositi(carry), voziti(drive), vidjeti(see; -jeti→vidim, but past vidio — regular), sjediti(sit), stajati→a-em, hodati(a-am, walk), trčati(run; -ati but i-im: trčim — flag klass i-im w/ presentStem? actually trčati→trčim is i-im-irregular; mark irregularForms or klass), živjeti(live; živim/živio), htjeti(irr✓), željeti(wish; želim/želio i-im).
`a-em` (need presentStem): zvati('zov' → zovem), prati('per'→perem), brati('ber'), slati('šalj'→šaljem), putovati('putuj'→putujem), kupovati('kupuj'), doručkovati('doručkuj'), pomoći→irr, brinuti('brin'→brinem).
`irr` (flag): jesti✓, piti✓, ići✓, biti✓, htjeti✓, moći✓, doći(come; irr), reći(say; irr), dati(give; a-am-ish: dam/daš — irregular, flag).

> Authoring procedure (per verb): (1) write metadata `{inf,en,aspect,pair,klass,cefr:'A1',irregular,presentStem?}`; (2) run `npx tsx scripts/generate-regular-forms.mjs '[{...}]'` for `forms:['present','past','future1']`; (3) paste output into `VERBS`; (4) for verbs the script reports non-derivable (irr, or i-im verbs with -ati infinitives like trčati), author present by hand and set `irregularForms` or `irregular` appropriately; (5) keep going until the count test (Task 8) passes.

- [ ] **Step 1: Add the A1 verbs to `VERBS`** using the procedure above (present + past + future1 for each; irregulars flagged). Do NOT hand-type regular forms — generate them.

- [ ] **Step 2: Run the morphology + shape tests**

Run: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts`
Expected: PASS (fix data per any `${inf}.${formType}` failure; never weaken the test).

- [ ] **Step 3: Commit**

```bash
git add functions/api/content/_data/grammar.js
git commit -m "feat(conjugation): author ~50 A1 verbs (present + past + future)"
```

### Task 8: A1 count gate + etag + ship

**Files:** Modify `src/lib/conjugation/__tests__/verbsData.test.ts`, `functions/api/content/_data/_etags.js`

- [ ] **Step 1: Add a per-level count assertion**

```ts
  it('has at least 50 A1 verbs', () => {
    expect((VERBS as ConjVerb[]).filter((v) => v.cefr === 'A1').length).toBeGreaterThanOrEqual(50);
  });
  it('no infinitive appears at two levels', () => {
    const seen = new Map<string, string>();
    for (const v of VERBS as ConjVerb[]) {
      expect(seen.has(v.inf), `${v.inf} duplicated across levels`).toBe(false);
      seen.set(v.inf, v.cefr);
    }
  });
```

- [ ] **Step 2: Run**

Run: `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts`
Expected: PASS (if A1 < 50, author more in Task 7 until green).

- [ ] **Step 3: Regenerate etags + gate + commit + push**

Run: `node scripts/generate-content-etags.mjs && npm run lint && npm run typecheck && npm test`
Expected: PASS.

```bash
git add functions/api/content/_data/_etags.js src/lib/conjugation/__tests__/verbsData.test.ts
git commit -m "test(conjugation): enforce >=50 A1 verbs + no cross-level dupes; regen etags"
git push
```

- [ ] **Step 4: STOP for review** before A2.

---

## PHASE 2 — A2 content (~50 verbs: present + past + future)

### Task 9: Author the A2 verb set (≥50, cefr 'A2')

**Files:** Modify `functions/api/content/_data/grammar.js`

A2 = next frequency tier / slightly more abstract everyday verbs. Anchor list (extend to ≥50 via the Task-7 procedure; no cross-level dupes): počinjati, završavati, otvarati, zatvarati, prodavati(a-em prodaj), plaćati, koštati, naručivati(a-em naručuj), preporučivati, objašnjavati, ponavljati, vježbati, odmarati, šetati, vraćati(se), sastajati(se), dogovarati(se), žuriti, kasniti, stizati(a-em stiž), nadati(se), bojati(se), smijati(se → a-em smij), plakati(a-em plač), vikati(a-em vič), skakati(a-em skač), pokazivati(a-em pokazuj), zaboravljati, sjećati(se), brinuti(se), odlučivati, dozvoljavati, zahvaljivati, pozdravljati, predstavljati, + htjeti/moći already A2 (keep).

- [ ] **Step 1: Author with the generate-then-validate procedure** (present + past + future1).
- [ ] **Step 2:** `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts` → PASS.
- [ ] **Step 3: Add A2 count assertion** (mirror Task 8 Step 1): `expect(... v.cefr==='A2' ...).toBeGreaterThanOrEqual(50)`.
- [ ] **Step 4:** regen etags + `npm test` + commit + push:

```bash
node scripts/generate-content-etags.mjs
git add functions/api/content/_data/grammar.js functions/api/content/_data/_etags.js src/lib/conjugation/__tests__/verbsData.test.ts
git commit -m "feat(conjugation): author ~50 A2 verbs (present+past+future) + count gate"
git push
```

- [ ] **Step 5: STOP for review** before B1.

---

## PHASE 3 — B1 content (~50 verbs: + imperative + conditional)

### Task 10: Author the B1 verb set (≥50, cefr 'B1', forms present/past/future1/imperative/conditional)

**Files:** Modify `functions/api/content/_data/grammar.js`

B1 = mid-frequency / abstract / aspectual verbs. Anchor list (extend to ≥50): razvijati(se), pojavljivati(se), nestajati, ostvarivati, omogućavati, sudjelovati(a-em sudjeluj), surađivati, raspravljati, predlagati(a-em predlaž), zaključivati, opisivati(a-em opisuj), prevoditi, prevodi… nastavljati, prekidati, izbjegavati, zahtijevati, obećavati, priznavati(a-em priznaj), dogadati(se→događati), procjenjivati, uspoređivati, naglašavati, podsjećati, ohrabrivati, iznenađivati, oduševljavati, prilagođavati, + others to ≥50.

- [ ] **Step 1: Author** present+past+future1+imperative+conditional via the procedure (imperative/conditional are derivable for regulars; flag exceptions).
- [ ] **Step 2:** `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts` → PASS.
- [ ] **Step 3: Add B1 count assertion** (≥50).
- [ ] **Step 4:** regen etags + `npm test` + commit + push:

```bash
node scripts/generate-content-etags.mjs
git add functions/api/content/_data/grammar.js functions/api/content/_data/_etags.js src/lib/conjugation/__tests__/verbsData.test.ts
git commit -m "feat(conjugation): author ~50 B1 verbs (full incl. imperative+conditional) + gate"
git push
```

- [ ] **Step 5: STOP for review** before B2.

---

## PHASE 4 — B2 content (~50 verbs: full + aspect pairs)

### Task 11: Author the B2 verb set (≥50, cefr 'B2', full forms; emphasize aspect pairs)

**Files:** Modify `functions/api/content/_data/grammar.js`

B2 = advanced/abstract + aspect-pair members (set `pair` so aspect categories surface them). Anchor list (extend to ≥50): napisati✓(move to B2 already there), pretpostavljati, podrazumijevati, obuhvaćati, ostvarivati(if not B1), uvjeravati, sumnjati, težiti, nastojati, poduzimati, provoditi, sprovesti, razmatrati, utvrđivati, ublažavati, pogoršavati, unaprjeđivati, suočavati(se), pridonositi, doprinositi, obilježavati, naglasiti(pf)/naglašavati(impf) pair, riješiti/rješavati pair, postići/postizati pair, etc.

- [ ] **Step 1: Author** full forms; ensure many have `pair` set so the aspect categories (aspect-imperfective/perfective/negation) have content.
- [ ] **Step 2:** `npx vitest run src/lib/conjugation/__tests__/verbsData.test.ts` → PASS.
- [ ] **Step 3: Add B2 count assertion** (≥50) AND an aspect-coverage assertion:

```ts
  it('has aspect-pair verbs for the aspect drills (>=10 with a pair)', () => {
    expect((VERBS as ConjVerb[]).filter((v) => v.pair).length).toBeGreaterThanOrEqual(10);
  });
```

- [ ] **Step 4:** regen etags + `npm test` + build + commit + push:

```bash
node scripts/generate-content-etags.mjs
npm run build  # confirm the larger payload bundles; rm -rf dist first if EPERM
git add functions/api/content/_data/grammar.js functions/api/content/_data/_etags.js src/lib/conjugation/__tests__/verbsData.test.ts
git commit -m "feat(conjugation): author ~50 B2 verbs (full + aspect pairs) + gates"
git push
```

- [ ] **Step 5: Final gate + merge decision.** Run `npm run lint && npm run typecheck && npm test && npm run build`; report; hand merge to the user.

---

## Self-review notes (author)

- **Spec coverage:** Unit 1 schema → Task 1; Unit 2 validator+script → Tasks 2,3,4; Unit 3 decouple → Task 5; Unit 4 content (phased) → Tasks 7–11; testing/gates → Tasks 3,6,8,9,10,11; rollout phases → Phases 0–4. All mapped.
- **Type consistency:** `expectedForms(verb, formType)` returns `string[] | PastForms | null` (past returns the `PastForms` object) — the data test compares `v.past` (a `PastForms`) to it via `toEqual`, consistent. `presentStem`/`irregularForms` used identically in types, morphology, data test. `cellsForCategory` signature unchanged (Task 5 only changes internals).
- **No placeholders:** validator + decouple + script are full code. Content tasks specify exact procedure + concrete anchor verb lists + hard gates (≥50 count, no-cross-level-dupes, morphology equality, aspect coverage) that make "author ~50" verifiable rather than vague.
- **Risk:** the morphology rules for irregular i-im-with-`-ati` verbs (trčati→trčim) and consonant-mutation a-em stems are the main authoring-judgement points; the validator forces each to be either rule-correct or explicitly flagged, so nothing wrong ships silently.
```
