# Phase 6 — Grad (Practice) Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-present the Practice tab as **Grad** — six host-led places led by an adaptive "Today" card, with a list⇄map toggle and drill-in-place — without changing any exercise's behaviour and without orphaning any exercise.

**Architecture:** A re-presentation layer in a new `src/components/grad/` module. A `places.ts` registry + a central `PLACE_ASSIGNMENTS` map (every catalog exercise → a place) + `GRAD_EXTRAS` (non-catalog launches: Quick Games, Arcade, Speed) are the single source of truth. `gradModel.ts` computes per-place items/stats and the recommended visit from the *existing* adaptive signals. `GradTab`/`GradMap`/`PlaceScreen` render the approved mockups. A no-orphan unit test proves coverage. `GradTab` replaces `PracticeTab` in `AppRouter`; exercise screens are untouched.

**Tech Stack:** React 18 + Vite + TypeScript; plain CSS + tokens in `src/index.css` (no Tailwind); Outfit + Playfair fonts; Vitest + @testing-library/react (jsdom, globals, `src/tests/setup.js`); Playwright e2e; Cloudflare Pages.

## Global Constraints
- Plain CSS + tokens. Palette: teal `#0e7490`/`#164e63`, red `#D40030`, terracotta `#c2410c`, stone `#f5f0e8`, gold `#C8980A`. Fonts Outfit (UI) + Playfair (headings).
- ASCII-only commit messages, ending `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Branch `feat/uxui-grad-phase6` (exists, spec committed). Never push to master. Merging deploys.
- **No orphaned exercises** — enforced by the Task 1 unit test, not inspection.
- **Exercise behaviour untouched** — Grad only changes navigation/presentation. The 66 exercise screens, Arcade, adaptive hooks, SRS, CEFR gating are reused as-is.
- Character art = locked flat cast (`src/components/family/CharacterPortrait`, `CharacterName='baka'|'ana'|'kovac'|'ivo'|'marko'`).
- CI gates **desktop** e2e only.

**Approved visual mockups (the markup/CSS source of truth — port these to React):**
- Default surface: `.superpowers/brainstorm/9047-1781874795/content/grad-list.html`
- Karta map: `.superpowers/brainstorm/9047-1781874795/content/grad-map-v2.html`
- Place interior: `.superpowers/brainstorm/9047-1781874795/content/place-interior-v2.html`

**Mapping to the spec's 7 tasks:** spec tasks "registry+model+no-orphan test" and "catalog tagging" are realized here as **Task 1** (registry + `PLACE_ASSIGNMENTS` map + no-orphan test — a central map instead of editing 66 catalog entries; lower churn, the test gives the same guarantee) and **Task 2** (`gradModel`). Tasks 3–7 match the spec.

---

### Task 1: Place registry + assignments + the no-orphan gate

**Files:**
- Create: `src/components/grad/places.ts`
- Create: `src/components/grad/grad.test.ts`

**Interfaces produced (used by all later tasks):**
- `type PlaceId = 'kavana'|'trznica'|'soba'|'kuhinja'|'ulica'|'trg'`
- `type BucketId = PlaceId | 'today'`
- `interface Place { id: PlaceId; name: string; nameEn: string; host: CharacterName | null; icon: string; blurb: string; tint: string; mapPos: {x:number;y:number}; subgroups?: {key:string;label:string}[] }`
- `const PLACES: Place[]` (6, in display order)
- `interface ExtraItem { id: string; label: string; icon: string; place: PlaceId; cefr: string; kind: 'quiz'|'flash'|'match'|'listen'|'speaking'|'scr'; scr?: string }`
- `const GRAD_EXTRAS: ExtraItem[]`
- `const PLACE_ASSIGNMENTS: Record<string, { place: BucketId; subgroup?: string }>` (keyed by catalog exercise id)

- [ ] **Step 1: Write the failing no-orphan + integrity test**

Create `src/components/grad/grad.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildExercises } from '../practice/exerciseCatalog';
import { PLACES, GRAD_EXTRAS, PLACE_ASSIGNMENTS } from './places';

const noop = () => {};
const goNoop = () => () => {};
// Stub deps so buildExercises runs without app context.
const exercises = buildExercises({
  go: goNoop, setScr: noop, sCurEx: noop,
  startPitchAccent: noop, startShadowing: noop, startReview: noop, startAspectDrill: noop,
});
const catalogIds = exercises.map((e) => e.id);
const PLACE_IDS = PLACES.map((p) => p.id);
const BUCKETS = [...PLACE_IDS, 'today'];

describe('Grad place registry', () => {
  it('has six places, each with a valid host or null', () => {
    expect(PLACES).toHaveLength(6);
    const valid = ['baka', 'ana', 'kovac', 'ivo', 'marko', null];
    for (const p of PLACES) expect(valid).toContain(p.host);
  });

  it('every catalog exercise is assigned to exactly one bucket', () => {
    const missing = catalogIds.filter((id) => !PLACE_ASSIGNMENTS[id]);
    expect(missing).toEqual([]); // no orphans
  });

  it('has no stale assignment keys (every key is a real catalog id)', () => {
    const stale = Object.keys(PLACE_ASSIGNMENTS).filter((id) => !catalogIds.includes(id));
    expect(stale).toEqual([]);
  });

  it('assigns every exercise to a known bucket and valid subgroup', () => {
    for (const [id, a] of Object.entries(PLACE_ASSIGNMENTS)) {
      expect(BUCKETS).toContain(a.place);
      const place = PLACES.find((p) => p.id === a.place);
      if (a.subgroup) {
        expect(place?.subgroups?.map((s) => s.key)).toContain(a.subgroup);
      }
    }
  });

  it('extras are non-catalog ids assigned to real places', () => {
    for (const x of GRAD_EXTRAS) {
      expect(catalogIds).not.toContain(x.id);
      expect(PLACE_IDS).toContain(x.place);
    }
  });

  it('coverage parity: assignments + extras cover the full known surface', () => {
    const covered = new Set([...Object.keys(PLACE_ASSIGNMENTS), ...GRAD_EXTRAS.map((x) => x.id)]);
    // Every catalog id covered (redundant with no-orphan, kept as explicit parity guard).
    for (const id of catalogIds) expect(covered.has(id)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it red**

Run: `npx vitest run src/components/grad/grad.test.ts`
Expected: FAIL — `places.ts` does not exist / imports unresolved.

- [ ] **Step 3: Create `src/components/grad/places.ts`**

```ts
import type { CharacterName } from '../family/portraits';

export type PlaceId = 'kavana' | 'trznica' | 'soba' | 'kuhinja' | 'ulica' | 'trg';
export type BucketId = PlaceId | 'today';

export interface Place {
  id: PlaceId;
  name: string;        // Croatian
  nameEn: string;      // English subtitle
  host: CharacterName | null;
  icon: string;
  blurb: string;
  tint: string;        // rgba disc/marker tint
  mapPos: { x: number; y: number };          // % position on the Karta
  subgroups?: { key: string; label: string }[];
}

export const PLACES: Place[] = [
  { id: 'kavana', name: 'Anina kavana', nameEn: "Ana's café", host: 'ana', icon: '☕',
    blurb: 'Naruči, razgovaraj, snađi se', tint: 'rgba(14,116,144,.12)', mapPos: { x: 62, y: 54 } },
  { id: 'trznica', name: 'Markova tržnica', nameEn: "Marko's market", host: 'marko', icon: '🐟',
    blurb: 'Riječi za svaki dan', tint: 'rgba(5,150,105,.12)', mapPos: { x: 33, y: 66 } },
  { id: 'soba', name: 'Kovačeva soba', nameEn: "Kovač's study", host: 'kovac', icon: '📚',
    blurb: 'Gramatika i izgovor', tint: 'rgba(124,58,237,.12)', mapPos: { x: 49, y: 30 },
    subgroups: [
      { key: 'padezi', label: 'Padeži' },
      { key: 'glagoli', label: 'Glagoli' },
      { key: 'recenice', label: 'Rečenice' },
      { key: 'izgovor', label: 'Izgovor' },
    ] },
  { id: 'kuhinja', name: 'Bakina kuhinja', nameEn: "Baka's kitchen", host: 'baka', icon: '🍲',
    blurb: 'Priče, zagonetke, brzalice', tint: 'rgba(194,65,12,.12)', mapPos: { x: 80, y: 40 } },
  { id: 'ulica', name: 'Ivina ulica', nameEn: "Ivo's street", host: 'ivo', icon: '🚕',
    blurb: 'Ulični govor i snalaženje', tint: 'rgba(37,99,235,.12)', mapPos: { x: 84, y: 62 },
    subgroups: [
      { key: 'snalazenje', label: 'Snalaženje' },
      { key: 'svakodnevni', label: 'Svakodnevni sleng' },
      { key: 'regionalni', label: 'Regionalni' },
      { key: 'kultura', label: 'Kultura' },
    ] },
  { id: 'trg', name: 'Trg', nameEn: 'The Square', host: null, icon: '🎪',
    blurb: 'Alka, brze igre, izazovi', tint: 'rgba(212,0,48,.10)', mapPos: { x: 30, y: 46 } },
];

export interface ExtraItem {
  id: string; label: string; icon: string; place: PlaceId; cefr: string;
  kind: 'quiz' | 'flash' | 'match' | 'listen' | 'speaking' | 'scr';
  scr?: string;   // for kind 'scr'
}

// Non-catalog launches. quiz/flash/match/listen/speaking use the props GradTab
// receives; 'scr' uses setScr(scr).
export const GRAD_EXTRAS: ExtraItem[] = [
  { id: 'quiz', label: 'Kviz', icon: '❓', place: 'trznica', cefr: 'A1+', kind: 'quiz' },
  { id: 'flash', label: 'Kartice', icon: '🃏', place: 'trznica', cefr: 'A1+', kind: 'flash' },
  { id: 'match', label: 'Spoji parove', icon: '🔗', place: 'trznica', cefr: 'A1+', kind: 'match' },
  { id: 'speaking', label: 'Govori', icon: '🗣️', place: 'kavana', cefr: 'A1+', kind: 'speaking' },
  { id: 'listening', label: 'Slušanje', icon: '👂', place: 'trg', cefr: 'A1+', kind: 'listen' },
  { id: 'typing', label: 'Tipkanje', icon: '⌨️', place: 'trg', cefr: 'A1+', kind: 'scr', scr: 'typing' },
  { id: 'wordsprint', label: 'Brzina riječi', icon: '⚡', place: 'trg', cefr: 'A1+', kind: 'scr', scr: 'wordsprint' },
  { id: 'arcade', label: 'Arkada · Alka', icon: '🎪', place: 'trg', cefr: 'A1+', kind: 'scr', scr: 'arcade' },
];

// Authoritative exercise -> bucket map (catalog ids). See the design spec §1.
export const PLACE_ASSIGNMENTS: Record<string, { place: BucketId; subgroup?: string }> = {
  // kavana
  restaurant: { place: 'kavana' }, convmatch: { place: 'kavana' }, scenes: { place: 'kavana' },
  dialogue: { place: 'kavana' },
  // trznica
  znam: { place: 'trznica' }, possess: { place: 'trznica' }, opposites: { place: 'trznica' },
  ordinals: { place: 'trznica' }, emogender: { place: 'trznica' }, verbdrill: { place: 'trznica' },
  pronouns: { place: 'trznica' }, collocations: { place: 'trznica' }, wordfamilies: { place: 'trznica' },
  numtime: { place: 'trznica' },
  // soba / padezi
  grammarmap: { place: 'soba', subgroup: 'padezi' }, prepdrill: { place: 'soba', subgroup: 'padezi' },
  genderdrill: { place: 'soba', subgroup: 'padezi' }, profgender: { place: 'soba', subgroup: 'padezi' },
  sibil: { place: 'soba', subgroup: 'padezi' }, accusativedrill: { place: 'soba', subgroup: 'padezi' },
  numcases: { place: 'soba', subgroup: 'padezi' }, neggen: { place: 'soba', subgroup: 'padezi' },
  animateacc: { place: 'soba', subgroup: 'padezi' }, instrumental: { place: 'soba', subgroup: 'padezi' },
  dative: { place: 'soba', subgroup: 'padezi' },
  // soba / glagoli
  future: { place: 'soba', subgroup: 'glagoli' }, reflexive: { place: 'soba', subgroup: 'glagoli' },
  imperative: { place: 'soba', subgroup: 'glagoli' }, passive: { place: 'soba', subgroup: 'glagoli' },
  fleetinga: { place: 'soba', subgroup: 'glagoli' }, conjlab: { place: 'soba', subgroup: 'glagoli' },
  aspectdrill: { place: 'soba', subgroup: 'glagoli' }, tenseflip: { place: 'soba', subgroup: 'glagoli' },
  // soba / recenice
  cloze: { place: 'soba', subgroup: 'recenice' }, unjumble: { place: 'soba', subgroup: 'recenice' },
  qwords: { place: 'soba', subgroup: 'recenice' }, negation: { place: 'soba', subgroup: 'recenice' },
  comparatives: { place: 'soba', subgroup: 'recenice' }, coloragree: { place: 'soba', subgroup: 'recenice' },
  relpron: { place: 'soba', subgroup: 'recenice' }, sentbuild: { place: 'soba', subgroup: 'recenice' },
  sentencetiles: { place: 'soba', subgroup: 'recenice' }, clitic: { place: 'soba', subgroup: 'recenice' },
  translate_drills: { place: 'soba', subgroup: 'recenice' }, production_drill: { place: 'soba', subgroup: 'recenice' },
  // soba / izgovor
  pitchaccent: { place: 'soba', subgroup: 'izgovor' }, shadowing: { place: 'soba', subgroup: 'izgovor' },
  dictation: { place: 'soba', subgroup: 'izgovor' }, proncontrast: { place: 'soba', subgroup: 'izgovor' },
  pronunciation_assess: { place: 'soba', subgroup: 'izgovor' },
  // kuhinja
  storyselect: { place: 'kuhinja' }, fillstory: { place: 'kuhinja' }, riddles: { place: 'kuhinja' },
  logicquiz: { place: 'kuhinja' }, brzalice: { place: 'kuhinja' },
  // ulica
  cityloc: { place: 'ulica', subgroup: 'snalazenje' },
  slang_everyday: { place: 'ulica', subgroup: 'svakodnevni' }, slang_slang: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_genz: { place: 'ulica', subgroup: 'svakodnevni' }, slang_football: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_dalmatian: { place: 'ulica', subgroup: 'regionalni' }, slang_zagreb: { place: 'ulica', subgroup: 'regionalni' },
  slang_regional: { place: 'ulica', subgroup: 'regionalni' }, slang_satrovski: { place: 'ulica', subgroup: 'regionalni' },
  slang_classics: { place: 'ulica', subgroup: 'kultura' }, slang_people: { place: 'ulica', subgroup: 'kultura' },
  slang_pijani: { place: 'ulica', subgroup: 'kultura' }, slang_art: { place: 'ulica', subgroup: 'kultura' },
  // today (adaptive bucket)
  srsreview: { place: 'today' }, adaptive_review: { place: 'today' }, cefrtest: { place: 'today' },
};
```

- [ ] **Step 4: Run it green**

Run: `npx vitest run src/components/grad/grad.test.ts`
Expected: PASS. **If "no orphans" fails**, the printed `missing` array lists catalog ids absent from `PLACE_ASSIGNMENTS` — add each to the correct bucket (do not delete the assertion). If "no stale keys" fails, a key here isn't a real catalog id (typo) — fix the key.

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (expect exit 0).
```bash
git add src/components/grad/places.ts src/components/grad/grad.test.ts
git commit -m "feat(grad): place registry + assignments + no-orphan gate"
```

---

### Task 2: gradModel — items, stats, recommended visit

**Files:**
- Create: `src/components/grad/gradModel.ts`
- Modify: `src/components/grad/grad.test.ts` (append model tests)

**Interfaces:**
- Consumes: `PLACES`, `GRAD_EXTRAS`, `PLACE_ASSIGNMENTS`, `buildExercises`, `isUnlocked`/`getUserCefr` (`../../lib/cefr`), `getSR`/`getDueReviews` (`../../data`).
- Produces:
  - `interface GradItem { id: string; label: string; icon: string; desc: string; cefr: string; placeId: PlaceId; subgroup?: string; locked: boolean; launch: () => void }`
  - `function itemsForPlace(placeId: PlaceId, ctx: ModelCtx): GradItem[]`
  - `function placeStats(placeId: PlaceId, ctx: ModelCtx): { total: number; done: number; due: number; lockedCount: number }`
  - `interface Recommendation { exerciseId: string; placeId: PlaceId; host: CharacterName | null; hr: string; en: string; count: number; durationMin: number; launch: () => void }`
  - `function recommendedVisit(ctx: ModelCtx): Recommendation`
  - `type ModelCtx` = `{ exercises: ReturnType<typeof buildExercises>; extras: ExtraLaunchers; userCefr: string; recs: SmartRecs; queue: unknown[] }` where `ExtraLaunchers` carries the bound launchers for `GRAD_EXTRAS` (quiz/flash/match/listen/speaking + setScr) and `SmartRecs` is the `useSmartRecommendations` return (`{ dueReviews, weakCount, isNewUser, userGoal, ... }`).

- [ ] **Step 1: Write failing model tests** (append to `grad.test.ts`)
```ts
import { itemsForPlace, placeStats, recommendedVisit } from './gradModel';

function ctx(overrides = {}) {
  const exercises = buildExercises({ go: goNoop, setScr: noop, sCurEx: noop,
    startPitchAccent: noop, startShadowing: noop, startReview: noop, startAspectDrill: noop });
  return {
    exercises,
    extras: { quiz: noop, flash: noop, match: noop, listen: noop, speaking: noop, scr: () => noop },
    userCefr: 'B2',
    recs: { dueReviews: 0, weakCount: 0, isNewUser: false, userGoal: null },
    queue: [],
    ...overrides,
  };
}

describe('gradModel', () => {
  it('itemsForPlace returns only that place\'s items (catalog + extras)', () => {
    const kavana = itemsForPlace('kavana', ctx());
    const ids = kavana.map((i) => i.id);
    expect(ids).toContain('restaurant');   // catalog
    expect(ids).toContain('speaking');     // extra
    expect(ids).not.toContain('grammarmap'); // belongs to soba
  });

  it('marks CEFR-locked items locked but still includes them', () => {
    const soba = itemsForPlace('soba', ctx({ userCefr: 'A1' }));
    const clitic = soba.find((i) => i.id === 'clitic'); // cefr B1+
    expect(clitic).toBeDefined();
    expect(clitic!.locked).toBe(true);
  });

  it('placeStats counts totals and locked', () => {
    const s = placeStats('kuhinja', ctx({ userCefr: 'A1' }));
    expect(s.total).toBeGreaterThan(0);
    expect(s.lockedCount).toBeGreaterThanOrEqual(0);
  });

  it('recommendedVisit prefers SRS-due, else falls back to a free-day visit', () => {
    const due = recommendedVisit(ctx({ recs: { dueReviews: 6, weakCount: 0, isNewUser: false, userGoal: null } }));
    expect(due.exerciseId).toBe('srsreview');
    expect(due.placeId).toBeDefined();
    const free = recommendedVisit(ctx()); // nothing due
    expect(free.exerciseId).toBeTruthy();  // always returns a launchable visit
    expect(typeof free.launch).toBe('function');
  });
});
```

- [ ] **Step 2: Run red** — `npx vitest run src/components/grad/grad.test.ts` → FAIL (gradModel missing).

- [ ] **Step 3: Implement `src/components/grad/gradModel.ts`**
```ts
import { isUnlocked } from '../../lib/cefr';
import { getDueReviews, getSR } from '../../data';
import { PLACES, GRAD_EXTRAS, PLACE_ASSIGNMENTS, type PlaceId, type CharacterName } from './places';

type Catalog = Array<{ id: string; label: string; icon: string; desc: string; cefr: string; action: () => void }>;
export interface ExtraLaunchers {
  quiz: () => void; flash: () => void; match: () => void; listen: () => void; speaking: () => void;
  scr: (id: string) => () => void;
}
export interface SmartRecs { dueReviews: number; weakCount: number; isNewUser: boolean; userGoal: string | null }
export interface ModelCtx { exercises: Catalog; extras: ExtraLaunchers; userCefr: string; recs: SmartRecs; queue: unknown[] }

export interface GradItem {
  id: string; label: string; icon: string; desc: string; cefr: string;
  placeId: PlaceId; subgroup?: string; locked: boolean; launch: () => void;
}

function extraLaunch(x: (typeof GRAD_EXTRAS)[number], ex: ExtraLaunchers): () => void {
  switch (x.kind) {
    case 'quiz': return ex.quiz; case 'flash': return ex.flash; case 'match': return ex.match;
    case 'listen': return ex.listen; case 'speaking': return ex.speaking;
    case 'scr': return ex.scr(x.scr!);
  }
}

export function itemsForPlace(placeId: PlaceId, ctx: ModelCtx): GradItem[] {
  const out: GradItem[] = [];
  for (const e of ctx.exercises) {
    const a = PLACE_ASSIGNMENTS[e.id];
    if (!a || a.place !== placeId) continue;
    out.push({ id: e.id, label: e.label, icon: e.icon, desc: e.desc, cefr: e.cefr,
      placeId, subgroup: a.subgroup, locked: !isUnlocked(e.cefr, ctx.userCefr), launch: e.action });
  }
  for (const x of GRAD_EXTRAS) {
    if (x.place !== placeId) continue;
    out.push({ id: x.id, label: x.label, icon: x.icon, desc: '', cefr: x.cefr,
      placeId, locked: !isUnlocked(x.cefr, ctx.userCefr), launch: extraLaunch(x, ctx.extras) });
  }
  return out;
}

export function placeStats(placeId: PlaceId, ctx: ModelCtx) {
  const items = itemsForPlace(placeId, ctx);
  const sr = getSR();
  const due = getDueReviews();
  const lockedCount = items.filter((i) => i.locked).length;
  // "done" approximated by SR presence; refine if a per-exercise completion store lands.
  const done = items.filter((i) => sr[i.id] && (sr[i.id].r || 0) > 0).length;
  return { total: items.length, done, due: placeId === 'today' ? due : 0, lockedCount };
}

const PLACE_OF = (id: string): PlaceId | 'today' | undefined => PLACE_ASSIGNMENTS[id]?.place;
const HOST_OF = (placeId: PlaceId): CharacterName | null => PLACES.find((p) => p.id === placeId)?.host ?? null;

export interface Recommendation {
  exerciseId: string; placeId: PlaceId; host: CharacterName | null;
  hr: string; en: string; count: number; durationMin: number; launch: () => void;
}

export function recommendedVisit(ctx: ModelCtx): Recommendation {
  const launchOf = (id: string): (() => void) =>
    ctx.exercises.find((e) => e.id === id)?.action ?? (() => {});
  // Priority ladder over EXISTING signals (no new adaptive logic).
  if (ctx.recs.dueReviews > 0) {
    return { exerciseId: 'srsreview', placeId: 'today' as unknown as PlaceId, host: 'ana',
      hr: `Ana ti je spremila ${ctx.recs.dueReviews} fraza`, en: `${ctx.recs.dueReviews} reviews waiting`,
      count: ctx.recs.dueReviews, durationMin: 6, launch: launchOf('srsreview') };
  }
  if (ctx.recs.weakCount > 0) {
    return { exerciseId: 'adaptive_review', placeId: 'kavana', host: HOST_OF('kavana'),
      hr: `Kovač je označio ${ctx.recs.weakCount} slabih točaka`, en: `${ctx.recs.weakCount} weak spots to review`,
      count: ctx.recs.weakCount, durationMin: 7, launch: launchOf('adaptive_review') };
  }
  if (ctx.queue.length > 0) {
    return { exerciseId: 'adaptive_review', placeId: 'kavana', host: HOST_OF('kavana'),
      hr: 'Pametno ponavljanje za tebe', en: 'A smart review built for you',
      count: ctx.queue.length, durationMin: 6, launch: launchOf('adaptive_review') };
  }
  // free-day fallback — visit the Square / new content.
  return { exerciseId: 'arcade', placeId: 'trg', host: null,
    hr: 'Slobodan dan — zaigraj na Trgu', en: 'Free day — play on the Square',
    count: 0, durationMin: 5, launch: ctx.extras.scr('arcade') };
}
```
> Note `placeId: 'today'` is surfaced by the Today card only; the Today card resolves it without needing a map place. `done` is approximate (no per-exercise completion store exists today); the count is cosmetic and may be refined later — it is not part of the no-orphan guarantee.

- [ ] **Step 4: Run green** — `npx vitest run src/components/grad/grad.test.ts` (PASS) + `npx tsc --noEmit` (exit 0).

- [ ] **Step 5: Commit**
```bash
git add src/components/grad/gradModel.ts src/components/grad/grad.test.ts
git commit -m "feat(grad): gradModel items, stats, recommendedVisit"
```

---

### Task 3: GradTab — Today card + places list + view toggle

**Files:**
- Create: `src/components/grad/GradTab.tsx`
- Create: `src/components/grad/GradTab.test.tsx`
- Add CSS: `src/index.css` (append a `/* ── GRAD ── */` block; port classes from the mockups)

**Visual source of truth:** `.superpowers/brainstorm/9047-1781874795/content/grad-list.html`. Port its markup/CSS faithfully (slim hero + `📋 Popis | 🗺️ Karta` toggle + Today card + places list). Use design tokens (`var(--teal)` etc.), not the mockup's hardcoded hex, where a token exists.

**Interfaces:**
- Consumes: `gradModel` (`itemsForPlace`, `placeStats`, `recommendedVisit`), `PLACES`, `GRAD_EXTRAS`, `useApp().setScr`, `useStats().stats`, `useContent().content.V`, `useSmartRecommendations`, `useAdaptivePractice`, `getUserCefr`, `CharacterPortrait`.
- Props (same shape PracticeTab receives — see `AppRouter.tsx:821`):
```ts
interface GradTabProps {
  allCats: string[];
  sh: <T>(a: T[]) => T[];
  sCurEx: (id: string) => void;
  onLaunchQuiz: (items: unknown[]) => void;
  onLaunchFlash: (items: unknown[]) => void;
  onLaunchListen: (items: unknown[]) => void;
  onLaunchMatch: (items: unknown[]) => void;
  onLaunchSpeaking: (items?: unknown[]) => void;
  award: (amt: number, celebrate?: boolean, t?: string) => void;
  launchPathItem: (item: unknown) => void;
}
```
- Produces: default export `GradTab`. Builds `ModelCtx` from props/hooks: `exercises = buildExercises({ go, setScr, sCurEx, startPitchAccent, startShadowing, startReview, startAspectDrill })` (reuse the same handler wiring PracticeTab used — copy those small handlers from `PracticeTab.tsx`), and `extras` bound to the prop launchers (`quiz: () => onLaunchQuiz(sh(vocabItems))`, etc., mirroring PracticeTab's `startQuiz/startFlashcards/...`). View state: `const [view, setView] = useState<'list'|'map'>(() => (localStorage.getItem('nh_grad_view') as 'list'|'map') || 'list')`; persist on toggle.

- [ ] **Step 1: Write failing component test** `GradTab.test.tsx`
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GradTab from './GradTab';
// Reuse existing test providers/mocks pattern from src/tests (AppContext/StatsContext/useContent).
// See an existing tab test (e.g. HomeTab.test or LearnTab area) for the provider wrapper helper.

const props = {
  allCats: ['greetings'], sh: <T,>(a: T[]) => a, sCurEx: vi.fn(),
  onLaunchQuiz: vi.fn(), onLaunchFlash: vi.fn(), onLaunchListen: vi.fn(),
  onLaunchMatch: vi.fn(), onLaunchSpeaking: vi.fn(), award: vi.fn(), launchPathItem: vi.fn(),
};

describe('GradTab', () => {
  it('renders the Today card and one row per place', () => {
    renderWithProviders(<GradTab {...props} />);
    expect(screen.getByText(/Danas u gradu/i)).toBeInTheDocument();
    // 6 place names
    expect(screen.getByText('Anina kavana')).toBeInTheDocument();
    expect(screen.getByText('Kovačeva soba')).toBeInTheDocument();
    expect(screen.getByText('Trg')).toBeInTheDocument();
  });

  it('toggles to map and persists the choice', () => {
    renderWithProviders(<GradTab {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Karta/i }));
    expect(localStorage.getItem('nh_grad_view')).toBe('map');
  });
});
```
> `renderWithProviders` = the existing context-wrapper helper used by other tab tests; locate it in `src/tests/` and import it (do not invent a new provider).

- [ ] **Step 2: Run red** — `npx vitest run src/components/grad/GradTab.test.tsx` → FAIL.

- [ ] **Step 3: Implement `GradTab.tsx`.** Port `grad-list.html`. Structure:
  - Slim hero: eyebrow "u grad" + title "Grad" + toggle (`nav`-safe buttons, not `.nav-btn`) → `setView` + `localStorage.setItem('nh_grad_view', v)`.
  - When `view==='map'` render `<GradMap … />` (Task 4) and return early below the hero; else render list.
  - Today card: `const rec = recommendedVisit(ctx)`; render host `CharacterPortrait` (`rec.host && <CharacterPortrait name={rec.host} size={52} />`, else the place icon), `rec.hr`, sub, `Idemo →` → `rec.launch()`. Quiet 4-dot quest row (reuse the existing daily-quest count source the old QuestTracker used).
  - Places list: `PLACES.map((p) => { const s = placeStats(p.id, ctx); … })` → row with `CharacterPortrait`/disc, `p.name`, `p.blurb`, a quiet signal (`s.due` ? `${s.due} due` : `${s.total} ...`), gold edge when `p.id === rec.placeId`. Row onClick → open place (`setPlace(p.id)` local state OR navigate; see Task 5 for the interior — GradTab owns an `openPlace` state and renders `<PlaceScreen>` as an overlay/screen when set).
- [ ] **Step 4: Append the GRAD CSS block** to `src/index.css` (port the mockup's classes: `.grad-hero`, `.grad-toggle`, `.grad-today`, `.grad-place`, etc.), mobile-first, using tokens.
- [ ] **Step 5: Run green** — component test PASS; `npx tsc --noEmit` exit 0; `npm run build` succeeds.
- [ ] **Step 6: Commit** `feat(grad): GradTab — Today card + places list + view toggle`.

---

### Task 4: GradMap — explorable Karta

**Files:**
- Create: `src/components/grad/GradMap.tsx`
- Create: `src/components/grad/GradMap.test.tsx`

**Visual source of truth:** `.superpowers/brainstorm/9047-1781874795/content/grad-map-v2.html` (the crafted SVG town). Port the SVG scene verbatim into the component; render markers from `PLACES` using each place's `mapPos` (`style={{ left: p.mapPos.x+'%', top: p.mapPos.y+'%' }}`), recommended place gets the gold pulse + badge, and a floating Today bar.

**Interfaces:**
- Consumes: `PLACES`, `recommendedVisit` result (passed from GradTab), `CharacterPortrait` (optional in markers), `placeStats` for badges.
- Props: `{ rec: Recommendation; onOpenPlace: (id: PlaceId) => void; statsByPlace: Record<PlaceId, {due:number;total:number}> }`.

- [ ] **Step 1: Failing test** `GradMap.test.tsx`: renders 6 markers (`getByText('Anina kavana')` … ) and the floating Today bar (`getByText(/Idemo/i)`); clicking a marker calls `onOpenPlace('kavana')`.
- [ ] **Step 2: Run red.**
- [ ] **Step 3: Implement** — paste the SVG scene; map markers from `PLACES`; recommended (`p.id===rec.placeId`) → `.rec` class + badge `rec.count`. Today bar → `rec.launch()` / shows `rec.hr`.
- [ ] **Step 4: Run green** + `tsc --noEmit` + build.
- [ ] **Step 5: Commit** `feat(grad): GradMap — explorable Karta view`.

---

### Task 5: PlaceScreen — inside a place (+ subgroups)

**Files:**
- Create: `src/components/grad/PlaceScreen.tsx`
- Create: `src/components/grad/PlaceScreen.test.tsx`

**Visual source of truth:** `.superpowers/brainstorm/9047-1781874795/content/place-interior-v2.html` (café interior; awning = 8 identical pennants). The hero scene is per-place; ship the café scene for `kavana` and a simple tinted-banner fallback for the others in this task (richer per-place scenes are a follow-up — the structure is identical).

**Interfaces:**
- Consumes: `PLACES` (find by id), `itemsForPlace`, `placeStats`, `recommendedVisit` (for the in-place Nastavi card — or compute the place's own recommended = first due/unlocked item), `CharacterPortrait`, the place's `greeting`. Greeting: add a `greeting(ctx)` field per place OR a `greetingFor(placeId, state)` helper in `places.ts` returning `{hr,en}` (add in this task if not present).
- Props: `{ placeId: PlaceId; ctx: ModelCtx; onBack: () => void }`.

- [ ] **Step 1: Failing test** `PlaceScreen.test.tsx`:
  - `kavana`: renders the back button (`← Grad`), Ana host greeting, a "Nastavi" card, exercise rows incl. `U restoranu`/`restaurant`, and a CEFR-locked row still present with a lock pill when `userCefr='A1'`.
  - `soba`: renders subgroup headers `Padeži`, `Glagoli`, `Rečenice`, `Izgovor`.
  - `kavana` (no subgroups): renders no subgroup headers.
- [ ] **Step 2: Run red.**
- [ ] **Step 3: Implement.** Back bar → `onBack()`. Hero: place scene (café SVG for kavana, tinted banner otherwise) + `place.host && <CharacterPortrait name={place.host} size={56}/>` + greeting hr/en. Progress line from `placeStats`. Nastavi card = the place's recommended item (first non-locked due item, else first non-locked). Items: `itemsForPlace(placeId, ctx)`; if `place.subgroups`, group items by `item.subgroup` under each subgroup header (collapsible `<details>`); else flat. Each row: icon + label + meta (`cefr · duration`) + status; locked rows render the lock pill (`🔒 {cefr}`) but stay in the DOM; onClick (non-locked) → `item.launch()`.
- [ ] **Step 4: Run green** + `tsc --noEmit` + build.
- [ ] **Step 5: Commit** `feat(grad): PlaceScreen interior with subgroups + locked teasers`.

---

### Task 6: Wire GradTab into the app; retire PracticeTab

**Files:**
- Modify: `src/components/AppRouter.tsx:60` (lazy import) and `:820-833` (render).
- Remove: `src/components/practice/PracticeTab.tsx` + its panels (`ReviewPanel.tsx`, `DrillPanel.tsx`, `ChallengePanel.tsx`, `AllPanel.tsx`, `ExerciseCard.tsx`) **only after** confirming GradTab covers them. Keep `exerciseCatalog.ts`, `alka/`, `SpeedChallenge`, `QuestTracker`, `WeakWordsPanel`, `DailyListeningCard` (reused by Grad/Today).
- Modify: `src/tests/testids.smoke.test.tsx` if it asserts Practice-tab structure.

- [ ] **Step 1:** Change `AppRouter.tsx:60` to `const GradTab = lazyWithReload(() => import('./grad/GradTab'));` and the `tab === 'practice'` block (`:820`) to render `<GradTab {...sameProps} />` inside `<ScreenErrorBoundary name="GradTab">`. The tab key stays `'practice'` (nav already labels it "Grad").
- [ ] **Step 2:** Run the full unit suite — `npx vitest run` — expect green (the known `live-tutor-screen` flake aside; confirm it passes in isolation if it appears).
- [ ] **Step 3:** Delete `PracticeTab.tsx` + the four panels + `ExerciseCard.tsx`; run `npx tsc --noEmit` to catch any dangling import; fix references (e.g., remove the `lazyWithReload` PracticeTab line if duplicated). Use small (<20-line) deletions to satisfy the bulk-delete hook.
- [ ] **Step 4:** `npm run build` (exit 0). Visual check: build + `npm run preview`, screenshot `/` → Grad tab (Today card + places).
- [ ] **Step 5: Commit** `feat(grad): mount GradTab in place of PracticeTab; retire Practice panels`.

---

### Task 7: E2E — audit, write grad.spec, migrate dependents

**Files:**
- Create: `e2e/grad.spec.js`
- Modify: `e2e/fixtures/seed-auth.js` (add `enterPlace` helper)
- Modify: audited specs that drove the Practice surface.

- [ ] **Step 1: Audit first.** Grep `e2e/` for Practice-surface dependencies BEFORE writing:
  `grep -rnE "activeIntent|Quick Games|Arcade|Speed Challenge|Weakest|intent|practice" e2e/` and `grep -rn "setScr\\('arcade'\\)|wordsprint|Quiz Me" e2e/`. List every spec that navigates Practice to reach an exercise. (Phase-5 lesson: do this before, not after CI.)
- [ ] **Step 2: Add the fixture** to `e2e/fixtures/seed-auth.js`:
```js
/** Open a Grad place by its visible Croatian name (Grad replaced Practice in Phase 6). */
export async function enterPlace(page, name) {
  await page.goto('/practice'); // tab route key unchanged
  await page.getByText('Danas u gradu').waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByText(name, { exact: false }).click();
}
```
- [ ] **Step 3: Write `e2e/grad.spec.js`**: seed/block/mockTTS/mockContent → `/practice` → Today card visible → tap "Anina kavana" → interior shows Ana greeting + an exercise → launch an exercise → assert no console `pageerror` (filter firebase/fetch) → `← Grad` returns to the list. Then toggle `🗺️ Karta` → a marker visible → click → same interior.
- [ ] **Step 4: Migrate audited specs** to reach exercises via `enterPlace`/launch (mirroring Phase 5's `startVocabLesson`). Rebuild dist (`npm run build`) before running (stale-dist gotcha).
- [ ] **Step 5: Run the FULL desktop suite locally** — `npx playwright test --project="Desktop Chrome" --reporter=line` — fix real failures (not flakes; verify a failure reproduces in isolation before treating as real).
- [ ] **Step 6: Commit** `test(e2e): grad.spec + migrate Practice-surface specs to places`.

---

## Self-Review
- **Spec coverage:** §1 taxonomy → Task 1 (`PLACES`+`PLACE_ASSIGNMENTS`); §2 default surface → Task 3; §3 Karta → Task 4; §4 place interior → Task 5; §5 data model → Tasks 1–2 + GradTab ctx; §6 testing/no-orphan → Task 1 gate + Tasks 3/4/5 component tests + Task 7 e2e. Wire-in/retire → Task 6.
- **No-orphan guarantee:** Task 1's `grad.test.ts` proves every `buildExercises()` id ∈ `PLACE_ASSIGNMENTS`, no stale keys, extras cover games/arcade. Fails build if a future edit drops one.
- **Type consistency:** `PlaceId`/`BucketId`/`GradItem`/`Recommendation`/`ModelCtx`/`ExtraLaunchers` defined in Tasks 1–2 and consumed unchanged in 3–5. `CharacterName` imported from `family/portraits`. Prop shape in Task 3 matches `AppRouter.tsx:821` verbatim.
- **Behaviour untouched:** Grad reuses `e.action` launchers + prop launchers; no exercise screen edited.
- **Known deviation from spec:** exercise→place mapping lives in a central `PLACE_ASSIGNMENTS` map (Task 1) rather than per-entry catalog fields — same guarantee via the test, far less churn in the 767-line catalog. `placeStats.done` is approximate (no completion store) and cosmetic only.
