# SP11e — Content Migration Final Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the residue from SP11d by migrating the last 5 high-IP names (V composition, PROVERBS, CROATIAN_CITIES, LEARN_PATH, SEASONAL_CAMPAIGNS) from the client bundle to `/api/content/core`. End state: `dist/assets/*.js` contains zero needles for any of these.

**Architecture:** Extend the existing 25-field `/api/content/core` endpoint to 27 fields (add `LEARN_PATH` + `SEASONAL_CAMPAIGNS`). The two function-valued exports get a function/data split: `LEARN_PATH` predicates become a JSON DSL (`{anyOf: [{ctIncludes}|{vsIncludes}|{lcAtLeast}]}`) interpreted by a small client utility; Easter's `dynamicWindow` becomes a `windowKind: 'easterRelative'` discriminator with offsets, resolved client-side by an 8-line algorithm (zero IP). V composition (TOP100 spread + B2 aliases + LEARN_PATH topic aliases) runs once at server cold-start.

**Tech Stack:** Cloudflare Pages Functions (server endpoint), Vite + React 18 + TypeScript strict (client), Vitest (unit), Playwright (e2e). Existing `_authedRead.js` Bearer gate is reused unchanged.

---

## File Structure

### New server-side data files
- `functions/api/content/_data/learnPath.js` — single named export `LEARN_PATH` (array of `LearnPathLevel` objects; each item has `ckRule: { anyOf: CkLeaf[] }` instead of `ck: function`).
- `functions/api/content/_data/seasonalCampaigns.js` — single named export `SEASONAL_CAMPAIGNS` (array with `windowKind` discriminator).

### Modified server files
- `functions/api/content/_data/core.js` — extend re-exports with the 2 new names; add V composition block (TOP100 spread + B2 aliases + LEARN_PATH topic aliases). Composition runs at module-load.
- `scripts/generate-content-etags.mjs` — pick up the 2 new fields in `CORE_KEYS` (or equivalent) so ETag invalidates on changes.

### New client utility files
- `src/lib/learnPathRules.ts` — DSL types (`CkLeaf`, `CkRule`, `LearnPathItem`, `LearnPathLevel`, `Stats`) + `evalCk(rule, stats): boolean` pure function.
- `src/lib/seasonalCampaign.ts` — `easterSunday(year)` (Meeus/Jones/Butcher — same 8-line algorithm currently in appUtils.ts, unchanged) + `resolveCampaignWindow(campaign, year)` + `getActiveCampaign(campaigns)`. Takes campaigns as a parameter (array, not module-level).
- `src/lib/dailyPickers.ts` — `getProverbOfDay(proverbs)`, `getCityOfDay(cities)`, `getHistFact(facts)`. All three accept their data as a parameter (parameter-passing refactor of the current closure-style pickers).

### Modified client files
- `src/types/content.ts` — extend `Content` interface with `LEARN_PATH` and `SEASONAL_CAMPAIGNS` shapes (loose typing per existing SP11d convention).
- `src/data/content.tsx`:
  - DELETE destructure of `V, TOP100, ALPHA, V_B2` from `_vocab` (lines 93)
  - DELETE destructure of `HIST_FACTS, PROVERBS, CROATIAN_CITIES` from `_cultural` (line 94)
  - DELETE destructure of `TRANSPORT, FOODORDER, GROCERY` from `_scenarios` (lines 151-153)
  - DELETE destructure of `SCHOOL, FRIENDS, EMERGENCY` from `_scenarios` (the ones only used in V composition)
  - DELETE TOP100 spread + B2 aliases (lines 169-179)
  - DELETE LEARN_PATH V composition (lines 962-979)
  - DELETE `getProverbOfDay` (lines 405-419)
  - DELETE `getCityOfDay` and `_cotdCache` closure (lines ~920-955)
  - DELETE `getHistFact` (lines 983-997)
  - DELETE `LEARN_PATH` array (lines 999-~1280)
  - DROP from barrel export (lines 3420-3438): `getProverbOfDay`, `getCityOfDay`, `getHistFact`, `getActiveCampaign`
- `src/lib/appUtils.ts` — DELETE `SEASONAL_CAMPAIGNS` array (lines 100-258), `getActiveCampaign` function (lines 260-277), `easterSunday` helper (lines 82-98), and `SeasonalCampaign` interface (lines 55-72 area). Keep `lvl`, `lXP`, `nXP`, `lXPgain`, etc.
- `src/lib/appData.ts` — drop `LEARN_PATH` (line 88) and `SEASONAL_CAMPAIGNS` (line 91) from re-exports.
- LEARN_PATH consumers — switch from `import { LEARN_PATH } from '...appData'` to `const { LEARN_PATH } = useContent()`, replace `item.ck(stats)` with `evalCk(item.ckRule, stats)`:
  - `src/components/learn/LearnTab.tsx`
  - `src/components/profile/LearnPath.tsx`
  - `src/components/home/HomeTab.tsx`
  - `src/hooks/useScreenLauncher.ts`
  - `src/hooks/usePlacement.ts`
- Daily-picker consumers — switch from `getProverbOfDay()` etc. to `getProverbOfDay(content.PROVERBS)`:
  - `src/components/croatia/DiscoverTab.tsx`
  - `src/components/croatia/CityOfDayScreen.tsx`
- SEASONAL_CAMPAIGNS consumers — switch from `getActiveCampaign()` to `getActiveCampaign(content.SEASONAL_CAMPAIGNS)`:
  - All callers (use grep at Task 11)

### Deleted files
- `src/data/cultural.js` — all consumers now use `useContent()` after Task 12
- `src/data/scenarios.js` — same
- `src/data/vocabulary.js` — same

### New test files
- `src/lib/__tests__/learnPathRules.test.ts` (~10 tests)
- `src/lib/__tests__/seasonalCampaign.test.ts` (~8 tests)
- `src/lib/__tests__/dailyPickers.test.ts` (~6 tests)

### Modified test files
- `functions/api/content/__tests__/core.test.js` — assert 27 fields present, ckRule shape, windowKind discriminator, V composition applied
- `scripts/__tests__/generate-content-etags.test.mjs` — assert ETag covers 2 new fields
- `e2e/sp11-content-protection.spec.js` — +5 needles for the 5 eliminated content names

---

## Phase 1: Server-Side Data Migration (Tasks 1–5)

### Task 1: Create `learnPath.js` server-side data module

**Files:**
- Create: `functions/api/content/_data/learnPath.js`
- Read first: `src/data/content.tsx` lines 999–1280 (the LEARN_PATH array with all 30 items and their `ck` functions)

**Translation rule for each item:** Every `ck` function matches one of three shapes. Translate as follows:

| Source pattern | Becomes |
|---|---|
| `function (s) { return (s.ct && s.ct.includes('X')) \|\| s.lc >= N; }` | `ckRule: { anyOf: [{ ctIncludes: 'X' }, { lcAtLeast: N }] }` |
| `function (s) { return (s.vs && s.vs.includes('X')) \|\| s.lc >= N; }` | `ckRule: { anyOf: [{ vsIncludes: 'X' }, { lcAtLeast: N }] }` |
| `function (s) { return s.lc >= N; }` | `ckRule: { anyOf: [{ lcAtLeast: N }] }` |

- [ ] **Step 1: Read the LEARN_PATH array**

Run: open `src/data/content.tsx`, navigate to line 999, copy the entire array (level objects + items) through `]` closing on line ~1280.

- [ ] **Step 2: Author `functions/api/content/_data/learnPath.js`**

```js
// SP11e: LEARN_PATH server-side. Function ck predicates replaced by JSON DSL
// (ckRule.anyOf) interpreted by src/lib/learnPathRules.ts on the client.
//
// CkLeaf shapes (interpreted by evalCk):
//   { ctIncludes: 'topic' }  → stats.ct includes topic
//   { vsIncludes: 'screen' } → stats.vs includes screen
//   { lcAtLeast: N }         → stats.lc >= N
//
// Unknown leaf kinds evaluate false (forward-compat).

export const LEARN_PATH = [
  {
    level: 1,
    title: 'Survivor',
    desc: 'First 48 hours',
    items: [
      {
        id: 'lp1',
        name: 'Basic Greetings',
        diff: 1,
        dur: '~5 min',
        ckRule: { anyOf: [{ ctIncludes: 'greetings' }, { lcAtLeast: 1 }] },
        go: 'lesson',
        topic: 'greetings',
      },
      {
        id: 'lp2',
        name: 'Numbers',
        diff: 1,
        dur: '~5 min',
        ckRule: { anyOf: [{ ctIncludes: 'numbers' }, { lcAtLeast: 2 }] },
        go: 'lesson',
        topic: 'numbers',
      },
      {
        id: 'lp_listen_basics',
        name: 'Hear Croatian',
        cat: 'listening',
        icon: '🎧',
        desc: 'Train your ear — listen to basic Croatian phrases',
        dur: '~5 min',
        diff: 1,
        go: 'listening',
        ckRule: { anyOf: [{ vsIncludes: 'listening' }, { lcAtLeast: 2 }] },
      },
      // ... continue for every remaining item in content.tsx LEARN_PATH array.
      // Preserve EVERY field exactly: id, name, diff, dur, go, topic, cat, icon, desc.
      // Replace `ck: function (s) {...}` with `ckRule: { anyOf: [...] }` per the
      // translation rule above.
    ],
  },
  // ... continue for every remaining level (Level 2 through Level 7).
];
```

- [ ] **Step 3: Verify translation by structural check**

Run from project root:

```powershell
node -e "import('./functions/api/content/_data/learnPath.js').then(m => { const items = m.LEARN_PATH.flatMap(l => l.items); console.log('items:', items.length); console.log('with ckRule:', items.filter(i => i.ckRule && i.ckRule.anyOf).length); console.log('with old ck:', items.filter(i => typeof i.ck === 'function').length); })"
```

Expected: `items: <30 or whatever the source count>`, `with ckRule: <same>`, `with old ck: 0`.

- [ ] **Step 4: Commit**

```powershell
git add functions/api/content/_data/learnPath.js
git commit -m "feat(sp11e): server-side LEARN_PATH with ckRule JSON DSL"
```

---

### Task 2: Create `seasonalCampaigns.js` server-side data module

**Files:**
- Create: `functions/api/content/_data/seasonalCampaigns.js`
- Read first: `src/lib/appUtils.ts` lines 100–258 (the SEASONAL_CAMPAIGNS array)

**Translation rule:** All 4 campaigns translate as below. Easter is the only one with a dynamic window.

- [ ] **Step 1: Author the file**

```js
// SP11e: SEASONAL_CAMPAIGNS server-side. Easter's dynamicWindow function is
// replaced by a discriminator (`windowKind: 'easterRelative'`) plus offsets
// from Easter Sunday (`windowOffsets: [-7, 1]` for Palm Sunday → Easter Monday).
// Client-side resolveCampaignWindow() in src/lib/seasonalCampaign.ts handles
// the math using the pure Meeus/Jones/Butcher easterSunday() algorithm
// (8 lines, zero IP — stays client-side).

export const SEASONAL_CAMPAIGNS = [
  {
    id: 'easter',
    name: 'Uskrs u Hrvatskoj',
    icon: '🥚',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    windowKind: 'easterRelative',
    windowOffsets: [-7, 1],
    multiplier: 1.5,
    blurb: 'Learn Easter traditions — pisanice, lamb, holiday greetings',
    quests: [
      { id: 'uskrs_q1', label: 'Learn 5 Easter words', desc: 'Browse the Easter vocabulary', xp: 30, screen: 'easter' },
      { id: 'uskrs_q2', label: 'Practice family vocab', desc: 'Family flashcards', xp: 25, screen: 'flashcards' },
      { id: 'uskrs_q3', label: 'Easter challenge', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ],
  },
  {
    id: 'midsummer',
    name: 'Ivanjdan',
    icon: '🔥',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
    windowKind: 'fixed',
    start: [6, 20],
    end: [6, 25],
    multiplier: 1.5,
    blurb: 'Celebrate Midsummer with bonfire traditions and Croatian folklore',
    quests: [
      { id: 'ivanjdan_q1', label: 'Learn bonfire words', desc: 'Complete the culture lesson', xp: 30, screen: 'lesson' },
      { id: 'ivanjdan_q2', label: 'Explore Croatian folklore', desc: 'Read a Croatian story', xp: 25, screen: 'readlist' },
      { id: 'ivanjdan_q3', label: 'Midsummer quiz', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ],
  },
  {
    id: 'domovina',
    name: 'Dan domovine',
    icon: '🇭🇷',
    color: '#b61800',
    bg: '#fff1f0',
    border: '#fca5a5',
    windowKind: 'fixed',
    start: [7, 25],
    end: [8, 6],
    multiplier: 2.0,
    blurb: "Honor Croatia's liberation — learn history, heroes, and homeland pride",
    quests: [
      { id: 'domovina_q1', label: 'Learn 5 history words', desc: 'Complete the Domovinski Rat lesson', xp: 40, screen: 'history' },
      { id: 'domovina_q2', label: 'Read about Operation Storm', desc: 'Complete a history reading passage', xp: 35, screen: 'readlist' },
      { id: 'domovina_q3', label: 'Homeland pride quiz', desc: 'Score 80%+ on the history quiz', xp: 60, screen: 'mcgame' },
    ],
  },
  {
    id: 'bozic',
    name: 'Božić',
    icon: '🎄',
    color: '#0e7490',
    bg: '#f0f9ff',
    border: '#bae6fd',
    windowKind: 'fixed',
    start: [12, 1],
    end: [12, 31],
    multiplier: 2.0,
    blurb: 'Croatian Christmas — fritule, pokloni, carols, and family traditions',
    quests: [
      { id: 'bozic_q1', label: 'Learn Christmas vocab', desc: 'Complete the greetings lesson', xp: 30, screen: 'lesson' },
      { id: 'bozic_q2', label: 'Practice holiday phrases', desc: 'Complete a speaking exercise', xp: 25, screen: 'speaking' },
      { id: 'bozic_q3', label: 'Christmas challenge', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ],
  },
];
```

- [ ] **Step 2: Verify structure**

```powershell
node -e "import('./functions/api/content/_data/seasonalCampaigns.js').then(m => { console.log('campaigns:', m.SEASONAL_CAMPAIGNS.length); console.log('easterRelative:', m.SEASONAL_CAMPAIGNS.filter(c => c.windowKind === 'easterRelative').length); console.log('fixed:', m.SEASONAL_CAMPAIGNS.filter(c => c.windowKind === 'fixed').length); })"
```

Expected: `campaigns: 4`, `easterRelative: 1`, `fixed: 3`.

- [ ] **Step 3: Commit**

```powershell
git add functions/api/content/_data/seasonalCampaigns.js
git commit -m "feat(sp11e): server-side SEASONAL_CAMPAIGNS with windowKind discriminator"
```

---

### Task 3: Extend `core.js` aggregator with V composition + new exports

**Files:**
- Modify: `functions/api/content/_data/core.js`

- [ ] **Step 1: Replace `core.js` with this content**

```js
// SP11d + SP11e: aggregator for 27 high-IP-density "core" content exports.
// 8 vocab + 9 cultural + 5 situational + 1 scenes + 1 misc (LEVEL_NARRATIVE)
// + 1 LEARN_PATH (SP11e) + 1 SEASONAL_CAMPAIGNS (SP11e) + 2 composed names = 27.
//
// SP11e composition: V is mutated at module load with TOP100 spread + B2
// aliases + LEARN_PATH topic aliases. Composition runs once at function cold
// start. Result: a single bulk payload, same ETag, same Bearer gate.

import {
  V as V_RAW,
  COUNTRIES,
  PROFESSIONS,
  WEATHER,
  CLOTHES,
  BODYDESC,
  TECH_VOC,
  BUREAUCRATIC,
  TOP100,
  V_B2,
  ALPHA,
} from './vocabulary.js';
import { PROVERBS } from './cultural/proverbs.js';
import { HISTORY, KINGS } from './cultural/history.js';
import { EVENTS } from './cultural/events.js';
import { REGIONS } from './cultural/regions.js';
import { DIALECTS, SHADOWING } from './cultural/language.js';
import { CROATIAN_CITIES } from './cultural/geography.js';
import { IDIOMS, BRZALICE } from './exercises.js';
import { FOODORDER, TRANSPORT, GROCERY, RECIPES, PRACTICAL } from './scenarios.js';
import { SCENES } from './vocabScenes.js';
import { LEARN_PATH } from './learnPath.js';
import { SEASONAL_CAMPAIGNS } from './seasonalCampaigns.js';

// SP11e: V composition. Mutates V_RAW in place at module load — runs once at
// cold start. Composition logic moved verbatim from src/data/content.tsx
// (lines 169-179 + 962-979). LEARN_PATH topic aliases require knowledge of
// FOODORDER/TRANSPORT/GROCERY/SCHOOL/FRIENDS/EMERGENCY/ALPHA shapes — those
// imports above and below cover everything needed.
import { SCHOOL, FRIENDS, EMERGENCY } from './scenarios.js';

const V = { ...V_RAW };

// TOP 100 WORDS BY SITUATION — quizzable
Object.keys(TOP100).forEach((k) => {
  V[k] = TOP100[k];
});

// LEARN_PATH vocabulary aliases — B2 topics + civic→politics
V['journalism'] = (V_B2 && V_B2['media & journalism']) || []; // lp68
V['philosophy'] = (V_B2 && V_B2['philosophy & ethics']) || []; // lp67
V['literature'] = (V_B2 && V_B2['academic language']) || []; // lp64
V['politics'] = V['civic'] || []; // lp58

// LEARN_PATH topic aliases — wire scenarios into V for lesson+quiz support
V['Order Food'] = [].concat(
  FOODORDER.bakery.items,
  FOODORDER.fastfood.items,
  FOODORDER.icecream.items,
  FOODORDER.restaurant.phrases,
);
V['Getting Around'] = TRANSPORT.map((t) => [t.hr, t.en]);
V['School Kit'] = [].concat(SCHOOL.classroom, SCHOOL.phrases);
V['Making Friends'] = FRIENDS.map((f) => [f.hr, f.en]);
V['Grocery Shopping'] = [].concat(GROCERY.vocab, GROCERY.phrases);
V['Alphabet'] = ALPHA.map((a) => [a[0], a[1] + ' — ' + a[2] + ' (' + a[3] + ')']);
V['Emergency'] = [].concat(EMERGENCY.phrases, EMERGENCY.bodyParts);

// === The 27 exports ===
export {
  V,
  COUNTRIES,
  PROFESSIONS,
  WEATHER,
  CLOTHES,
  BODYDESC,
  TECH_VOC,
  BUREAUCRATIC,
  PROVERBS,
  HISTORY,
  KINGS,
  EVENTS,
  REGIONS,
  DIALECTS,
  SHADOWING,
  CROATIAN_CITIES,
  IDIOMS,
  BRZALICE,
  FOODORDER,
  TRANSPORT,
  GROCERY,
  RECIPES,
  PRACTICAL,
  SCENES,
  LEARN_PATH,
  SEASONAL_CAMPAIGNS,
};

export const LEVEL_NARRATIVE = {
  heritage: ['First Words', 'Finding Your Voice', 'Reconnecting', 'Bridging Worlds', 'Coming Home', 'Naš Čovjek', 'Naš Čovjek'],
  family: ['Hello Family', 'Family Stories', 'Conversations', 'Deep Talks', 'Native Flow', 'Naš Čovjek', 'Naš Čovjek'],
  travel: ['Survival Mode', 'Getting Around', "Local's Path", 'Off the Map', 'Croatian Soul', 'Naš Čovjek', 'Naš Čovjek'],
  culture: ['First Steps', 'Culture Seeker', 'Insider', 'Deep Diver', 'Living Croatia', 'Naš Čovjek', 'Naš Čovjek'],
  fluent: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Int', 'Advanced', 'Fluent', 'Fluent'],
  partner: ['Curious Spouse', 'Family Observer', 'Dinner Table Survivor', 'Welcome Addition', 'Part of the Family'],
};
```

- [ ] **Step 2: Smoke test the aggregator**

```powershell
node -e "import('./functions/api/content/_data/core.js').then(m => { console.log('V keys:', Object.keys(m.V).length); console.log('V[Order Food]:', Array.isArray(m.V['Order Food']) && m.V['Order Food'].length > 0); console.log('LEARN_PATH:', Array.isArray(m.LEARN_PATH)); console.log('SEASONAL_CAMPAIGNS:', m.SEASONAL_CAMPAIGNS.length === 4); console.log('LEVEL_NARRATIVE:', Object.keys(m.LEVEL_NARRATIVE).length === 6); })"
```

Expected: all four lines pass.

- [ ] **Step 3: Commit**

```powershell
git add functions/api/content/_data/core.js
git commit -m "feat(sp11e): extend core.js aggregator with V composition + LEARN_PATH + SEASONAL_CAMPAIGNS"
```

---

### Task 4: Extend ETag generator for the 2 new fields

**Files:**
- Modify: `scripts/generate-content-etags.mjs`
- Test: `scripts/__tests__/generate-content-etags.test.mjs`

- [ ] **Step 1: Read the generator + find CORE_KEYS list**

Run: `grep -n "CORE_KEYS\|LEARN_PATH\|SEASONAL_CAMPAIGNS" scripts/generate-content-etags.mjs`

- [ ] **Step 2: Write failing test**

Append to `scripts/__tests__/generate-content-etags.test.mjs`:

```js
it('SP11e: ETag covers LEARN_PATH and SEASONAL_CAMPAIGNS', async () => {
  const before = computeCoreEtag({ LEARN_PATH: [{ id: 'x' }], SEASONAL_CAMPAIGNS: [{ id: 'easter' }] });
  const afterLP = computeCoreEtag({ LEARN_PATH: [{ id: 'y' }], SEASONAL_CAMPAIGNS: [{ id: 'easter' }] });
  const afterSC = computeCoreEtag({ LEARN_PATH: [{ id: 'x' }], SEASONAL_CAMPAIGNS: [{ id: 'midsummer' }] });
  expect(before).not.toBe(afterLP);
  expect(before).not.toBe(afterSC);
});
```

(Adapt the call signature to whatever `computeCoreEtag` actually exports; if it walks the `core.js` aggregator at filesystem level rather than taking data in, write the test by stubbing the file contents in a temp dir.)

- [ ] **Step 3: Run test, verify FAIL**

```powershell
npx vitest run scripts/__tests__/generate-content-etags.test.mjs
```

Expected: new test FAILS (LEARN_PATH/SEASONAL_CAMPAIGNS not in hash).

- [ ] **Step 4: Modify the generator**

Find the CORE_KEYS array (or equivalent) and add `'LEARN_PATH'`, `'SEASONAL_CAMPAIGNS'`. If the generator walks the aggregator file directly via dynamic import + Object.keys, it should already pick up the new exports — verify by running with `--verbose` or `console.log` and inspecting the produced ETag changes.

- [ ] **Step 5: Run test, verify PASS**

```powershell
npx vitest run scripts/__tests__/generate-content-etags.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Run the generator and commit the updated ETag**

```powershell
node scripts/generate-content-etags.mjs
git diff src/lib/etags.ts
```

Expected: `src/lib/etags.ts` (or equivalent generated file) shows a new `core` ETag.

- [ ] **Step 7: Commit**

```powershell
git add scripts/generate-content-etags.mjs scripts/__tests__/generate-content-etags.test.mjs src/lib/etags.ts
git commit -m "feat(sp11e): extend ETag generator for LEARN_PATH + SEASONAL_CAMPAIGNS"
```

---

### Task 5: Extend server-side test for `/api/content/core`

**Files:**
- Modify: `functions/api/content/__tests__/core.test.js`

- [ ] **Step 1: Add 4 new assertions to the existing test file**

Insert into the existing `describe('GET /api/content/core', ...)` block:

```js
it('SP11e: response includes LEARN_PATH with ckRule shape', async () => {
  const res = await authenticatedGet('/api/content/core');
  const body = await res.json();
  expect(Array.isArray(body.LEARN_PATH)).toBe(true);
  expect(body.LEARN_PATH.length).toBeGreaterThan(0);
  const firstItem = body.LEARN_PATH[0].items[0];
  expect(firstItem.ckRule).toBeDefined();
  expect(Array.isArray(firstItem.ckRule.anyOf)).toBe(true);
  expect(typeof firstItem.ck).toBe('undefined'); // old function field gone
});

it('SP11e: response includes SEASONAL_CAMPAIGNS with windowKind discriminator', async () => {
  const res = await authenticatedGet('/api/content/core');
  const body = await res.json();
  expect(Array.isArray(body.SEASONAL_CAMPAIGNS)).toBe(true);
  expect(body.SEASONAL_CAMPAIGNS.length).toBe(4);
  const easter = body.SEASONAL_CAMPAIGNS.find((c) => c.id === 'easter');
  expect(easter.windowKind).toBe('easterRelative');
  expect(easter.windowOffsets).toEqual([-7, 1]);
  const fixed = body.SEASONAL_CAMPAIGNS.filter((c) => c.windowKind === 'fixed');
  expect(fixed.length).toBe(3);
});

it('SP11e: V composition applied — Order Food has items', async () => {
  const res = await authenticatedGet('/api/content/core');
  const body = await res.json();
  expect(Array.isArray(body.V['Order Food'])).toBe(true);
  expect(body.V['Order Food'].length).toBeGreaterThan(0);
  expect(Array.isArray(body.V['Alphabet'])).toBe(true);
  expect(body.V['Alphabet'].length).toBe(30); // ALPHA has 30 letters
});

it('SP11e: V B2 aliases resolved server-side', async () => {
  const res = await authenticatedGet('/api/content/core');
  const body = await res.json();
  expect(Array.isArray(body.V['journalism'])).toBe(true);
  expect(Array.isArray(body.V['philosophy'])).toBe(true);
  expect(Array.isArray(body.V['literature'])).toBe(true);
});
```

- [ ] **Step 2: Run tests, verify all PASS**

```powershell
npx vitest run functions/api/content/__tests__/core.test.js
```

Expected: 4 new tests + existing tests all pass.

- [ ] **Step 3: Commit**

```powershell
git add functions/api/content/__tests__/core.test.js
git commit -m "test(sp11e): extend core endpoint tests for LEARN_PATH + SEASONAL_CAMPAIGNS + V composition"
```

---

## Phase 2: Client Utility Modules (TDD, Tasks 6–8)

### Task 6: TDD `learnPathRules.ts` — DSL types + `evalCk()` interpreter

**Files:**
- Create: `src/lib/learnPathRules.ts`
- Create: `src/lib/__tests__/learnPathRules.test.ts`

- [ ] **Step 1: Write the failing test file**

```typescript
import { describe, it, expect } from 'vitest';
import { evalCk, type CkRule, type Stats } from '../learnPathRules';

const emptyStats: Stats = { ct: [], vs: [], lc: 0 };

describe('evalCk', () => {
  it('ctIncludes — true when stats.ct has the topic', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    expect(evalCk(rule, { ct: ['greetings'], vs: [], lc: 0 })).toBe(true);
  });

  it('ctIncludes — false when stats.ct is missing the topic', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    expect(evalCk(rule, { ct: ['numbers'], vs: [], lc: 0 })).toBe(false);
  });

  it('vsIncludes — true when stats.vs has the screen', () => {
    const rule: CkRule = { anyOf: [{ vsIncludes: 'listening' }] };
    expect(evalCk(rule, { ct: [], vs: ['listening'], lc: 0 })).toBe(true);
  });

  it('lcAtLeast — true when stats.lc meets threshold', () => {
    const rule: CkRule = { anyOf: [{ lcAtLeast: 5 }] };
    expect(evalCk(rule, { ct: [], vs: [], lc: 5 })).toBe(true);
    expect(evalCk(rule, { ct: [], vs: [], lc: 6 })).toBe(true);
  });

  it('lcAtLeast — false when stats.lc below threshold', () => {
    const rule: CkRule = { anyOf: [{ lcAtLeast: 5 }] };
    expect(evalCk(rule, { ct: [], vs: [], lc: 4 })).toBe(false);
  });

  it('anyOf — true if any leaf matches', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }, { lcAtLeast: 5 }] };
    expect(evalCk(rule, { ct: [], vs: [], lc: 10 })).toBe(true);
    expect(evalCk(rule, { ct: ['greetings'], vs: [], lc: 0 })).toBe(true);
  });

  it('anyOf — false if no leaf matches', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }, { lcAtLeast: 5 }] };
    expect(evalCk(rule, emptyStats)).toBe(false);
  });

  it('undefined rule → false', () => {
    expect(evalCk(undefined, emptyStats)).toBe(false);
  });

  it('unknown leaf kind → false (forward-compat)', () => {
    const rule = { anyOf: [{ unknownKind: 'x' }] } as unknown as CkRule;
    expect(evalCk(rule, emptyStats)).toBe(false);
  });

  it('missing stats arrays handled — stats.ct undefined', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    const stats = { lc: 0 } as unknown as Stats;
    expect(evalCk(rule, stats)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify FAIL**

```powershell
npx vitest run src/lib/__tests__/learnPathRules.test.ts
```

Expected: file not found / module not exported.

- [ ] **Step 3: Implement `learnPathRules.ts`**

```typescript
// SP11e: client-side interpreter for LEARN_PATH ckRule DSL.
// The DSL replaces JavaScript predicate functions that used to live in
// src/data/content.tsx; data now ships from /api/content/core. Forward-extensible:
// unknown leaf kinds evaluate false so a server can add new leaves (e.g.
// { xpAtLeast: 1000 }) without breaking older clients.

export type CkLeaf =
  | { ctIncludes: string }
  | { vsIncludes: string }
  | { lcAtLeast: number };

export type CkRule = { anyOf: CkLeaf[] };

export interface Stats {
  ct?: string[];
  vs?: string[];
  lc?: number;
  [key: string]: unknown;
}

export interface LearnPathItem {
  id: string;
  name: string;
  go: string;
  topic?: string;
  diff: number;
  dur: string;
  cat?: string;
  icon?: string;
  desc?: string;
  ckRule?: CkRule;
}

export interface LearnPathLevel {
  level: number;
  title: string;
  desc: string;
  items: LearnPathItem[];
}

function evalLeaf(leaf: CkLeaf, s: Stats): boolean {
  if ('ctIncludes' in leaf) return Array.isArray(s.ct) && s.ct.includes(leaf.ctIncludes);
  if ('vsIncludes' in leaf) return Array.isArray(s.vs) && s.vs.includes(leaf.vsIncludes);
  if ('lcAtLeast' in leaf) return typeof s.lc === 'number' && s.lc >= leaf.lcAtLeast;
  return false; // forward-compat
}

export function evalCk(rule: CkRule | undefined, stats: Stats): boolean {
  if (!rule || !Array.isArray(rule.anyOf)) return false;
  return rule.anyOf.some((leaf) => evalLeaf(leaf, stats));
}
```

- [ ] **Step 4: Run test, verify PASS**

```powershell
npx vitest run src/lib/__tests__/learnPathRules.test.ts
```

Expected: 10/10 pass.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/learnPathRules.ts src/lib/__tests__/learnPathRules.test.ts
git commit -m "feat(sp11e): client interpreter for LEARN_PATH ckRule DSL + 10 tests"
```

---

### Task 7: TDD `seasonalCampaign.ts` — Easter math + active-window resolver

**Files:**
- Create: `src/lib/seasonalCampaign.ts`
- Create: `src/lib/__tests__/seasonalCampaign.test.ts`

**Note:** The `easterSunday()` algorithm is Meeus/Jones/Butcher and stays client-side unchanged — it's a pure 8-line algorithm with zero IP. Copy it from `src/lib/appUtils.ts` lines 82–98.

- [ ] **Step 1: Write the failing test file**

```typescript
import { describe, it, expect } from 'vitest';
import {
  easterSunday,
  resolveCampaignWindow,
  getActiveCampaign,
  type SeasonalCampaign,
} from '../seasonalCampaign';

const easterCampaign: SeasonalCampaign = {
  id: 'easter',
  name: 'Easter',
  icon: '🥚',
  color: '#16a34a',
  bg: '#f0fdf4',
  border: '#86efac',
  windowKind: 'easterRelative',
  windowOffsets: [-7, 1],
  multiplier: 1.5,
  blurb: '',
  quests: [],
};

const midsummerCampaign: SeasonalCampaign = {
  id: 'midsummer',
  name: 'Midsummer',
  icon: '🔥',
  color: '#ea580c',
  bg: '#fff7ed',
  border: '#fed7aa',
  windowKind: 'fixed',
  start: [6, 20],
  end: [6, 25],
  multiplier: 1.5,
  blurb: '',
  quests: [],
};

describe('easterSunday', () => {
  // Reference: https://en.wikipedia.org/wiki/Computus
  it.each([
    [2024, { month: 3, day: 31 }],
    [2025, { month: 4, day: 20 }],
    [2026, { month: 4, day: 5 }],
    [2027, { month: 3, day: 28 }],
    [2028, { month: 4, day: 16 }],
  ])('year %i → Easter on %s', (year, expected) => {
    expect(easterSunday(year)).toEqual(expected);
  });
});

describe('resolveCampaignWindow', () => {
  it('fixed kind returns the input start/end unchanged', () => {
    const win = resolveCampaignWindow(midsummerCampaign, 2026);
    expect(win.start).toEqual([6, 20]);
    expect(win.end).toEqual([6, 25]);
  });

  it('easterRelative for 2026 → Palm Sunday → Easter Monday', () => {
    // Easter 2026 = April 5; Palm Sunday = March 29; Easter Monday = April 6
    const win = resolveCampaignWindow(easterCampaign, 2026);
    expect(win.start).toEqual([3, 29]);
    expect(win.end).toEqual([4, 6]);
  });
});

describe('getActiveCampaign', () => {
  it('returns null when no campaign is currently active', () => {
    // Force "today" via Date mock to Feb 1, 2026 — outside every window
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 1));
    expect(getActiveCampaign([easterCampaign, midsummerCampaign])).toBeNull();
    vi.useRealTimers();
  });

  it('returns midsummer during June 20–25', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 22)); // June 22 2026
    expect(getActiveCampaign([easterCampaign, midsummerCampaign])?.id).toBe('midsummer');
    vi.useRealTimers();
  });

  it('returns easter during Palm Sunday window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30)); // March 30 2026 — inside [3,29]–[4,6]
    expect(getActiveCampaign([easterCampaign, midsummerCampaign])?.id).toBe('easter');
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL**

```powershell
npx vitest run src/lib/__tests__/seasonalCampaign.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `seasonalCampaign.ts`**

```typescript
// SP11e: client-side Easter math + active-campaign resolver.
// SEASONAL_CAMPAIGNS data ships from /api/content/core; the easterSunday()
// algorithm (Meeus/Jones/Butcher) is a pure 8-line algorithm with zero IP and
// stays client-side. Replaces the previous closure-based getActiveCampaign()
// in src/lib/appUtils.ts (deleted as part of SP11e).

export interface SeasonalQuest {
  id: string;
  label: string;
  desc: string;
  xp: number;
  screen: string;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  multiplier: number;
  blurb: string;
  quests: SeasonalQuest[];
  windowKind: 'fixed' | 'easterRelative';
  start?: [number, number];
  end?: [number, number];
  windowOffsets?: [number, number];
}

/**
 * Meeus/Jones/Butcher algorithm — returns the month (1-based) and day of
 * Easter Sunday for any Gregorian year.
 */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function resolveCampaignWindow(
  c: SeasonalCampaign,
  year: number,
): { start: [number, number]; end: [number, number] } {
  if (c.windowKind === 'easterRelative' && c.windowOffsets) {
    const { month, day } = easterSunday(year);
    const easter = new Date(year, month - 1, day);
    const s = new Date(easter.getTime() + c.windowOffsets[0] * 86_400_000);
    const e = new Date(easter.getTime() + c.windowOffsets[1] * 86_400_000);
    return {
      start: [s.getMonth() + 1, s.getDate()],
      end: [e.getMonth() + 1, e.getDate()],
    };
  }
  return { start: c.start!, end: c.end! };
}

export function getActiveCampaign(campaigns: SeasonalCampaign[]): SeasonalCampaign | null {
  const now = new Date();
  const year = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  return (
    campaigns.find((c) => {
      const win = resolveCampaignWindow(c, year);
      const [sm, sd] = win.start;
      const [em, ed] = win.end;
      if (sm === em) return m === sm && d >= sd && d <= ed;
      if (m === sm) return d >= sd;
      if (m === em) return d <= ed;
      return m > sm && m < em;
    }) ?? null
  );
}
```

- [ ] **Step 4: Add `vi` import to test file**

Update the top of `src/lib/__tests__/seasonalCampaign.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
```

- [ ] **Step 5: Run test, verify PASS**

```powershell
npx vitest run src/lib/__tests__/seasonalCampaign.test.ts
```

Expected: all 10 tests pass (5 easterSunday + 2 resolveCampaignWindow + 3 getActiveCampaign).

- [ ] **Step 6: Commit**

```powershell
git add src/lib/seasonalCampaign.ts src/lib/__tests__/seasonalCampaign.test.ts
git commit -m "feat(sp11e): client easterSunday + resolveCampaignWindow + getActiveCampaign + 10 tests"
```

---

### Task 8: TDD `dailyPickers.ts` — parameter-passing daily picks

**Files:**
- Create: `src/lib/dailyPickers.ts`
- Create: `src/lib/__tests__/dailyPickers.test.ts`

**Source for the algorithms:** `src/data/content.tsx` `getProverbOfDay` (lines 405–419), `getHistFact` (lines 983–997), `getCityOfDay` (lines 928+). The hash function (`djb2` on a date+salt string) is identical for proverb and fact; cityOfDay uses a Fisher-Yates shuffle seeded by year. Refactor all three to accept their data as a parameter.

- [ ] **Step 1: Write the failing test file**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getProverbOfDay, getCityOfDay, getHistFact } from '../dailyPickers';

const proverbs = ['p1', 'p2', 'p3', 'p4', 'p5'];
const facts = ['f1', 'f2', 'f3', 'f4', 'f5'];
const cities = ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Pula'];

describe('getProverbOfDay', () => {
  it('returns deterministic value for a given date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    const a = getProverbOfDay(proverbs);
    const b = getProverbOfDay(proverbs);
    expect(a).toBe(b);
    expect(proverbs).toContain(a);
    vi.useRealTimers();
  });

  it('different dates yield different picks across a 30-day sample', () => {
    vi.useFakeTimers();
    const picks = new Set<string>();
    for (let i = 0; i < 30; i++) {
      vi.setSystemTime(new Date(2026, 0, i + 1));
      picks.add(getProverbOfDay(proverbs));
    }
    expect(picks.size).toBeGreaterThan(1);
    vi.useRealTimers();
  });

  it('empty array returns undefined', () => {
    expect(getProverbOfDay([])).toBeUndefined();
  });
});

describe('getCityOfDay', () => {
  it('returns deterministic value for a given date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getCityOfDay(cities)).toBe(getCityOfDay(cities));
    vi.useRealTimers();
  });
});

describe('getHistFact', () => {
  it('returns deterministic value for a given date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getHistFact(facts)).toBe(getHistFact(facts));
    vi.useRealTimers();
  });

  it('different salt from getProverbOfDay (different picks for same data + date)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    // Use same array — different salts should yield different indexes (with high probability)
    const same: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const tries = 30;
    let mismatches = 0;
    for (let i = 0; i < tries; i++) {
      vi.setSystemTime(new Date(2026, 0, i + 1));
      if (getProverbOfDay(same) !== getHistFact(same)) mismatches++;
    }
    expect(mismatches).toBeGreaterThan(15);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL**

```powershell
npx vitest run src/lib/__tests__/dailyPickers.test.ts
```

- [ ] **Step 3: Implement `dailyPickers.ts`**

```typescript
// SP11e: parameter-passing daily pickers. Algorithms are identical to the
// closure-style helpers previously in src/data/content.tsx (getProverbOfDay,
// getCityOfDay, getHistFact) — the only change is data is now passed in by
// the caller (typically from useContent()) instead of closed over.

function todayDateKey(): string {
  const n = new Date();
  return (
    n.getFullYear() +
    '-' +
    String(n.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(n.getDate()).padStart(2, '0')
  );
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function getProverbOfDay<T>(proverbs: T[]): T | undefined {
  if (proverbs.length === 0) return undefined;
  return proverbs[djb2('prov:' + todayDateKey()) % proverbs.length];
}

export function getHistFact<T>(facts: T[]): T | undefined {
  if (facts.length === 0) return undefined;
  return facts[djb2('fact:' + todayDateKey()) % facts.length];
}

// City of day uses a year-seeded Fisher-Yates shuffle so every city appears
// once before any repeats. The slot for "today" is dayOfYear into the shuffle.
let _cotdCache: { key: string; city: unknown } = { key: '', city: undefined };

export function getCityOfDay<T>(cities: T[]): T | undefined {
  if (cities.length === 0) return undefined;
  const n = new Date();
  const dateKey = todayDateKey();
  if (_cotdCache.key === dateKey) return _cotdCache.city as T;

  const year = n.getFullYear();
  const dayOfYear = Math.floor((Number(n) - Number(new Date(year, 0, 1))) / 86_400_000);

  // Fisher-Yates shuffle seeded by year
  const idx = cities.map((_, i) => i);
  let seed = (year * 2654435761) >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const city = cities[idx[dayOfYear % cities.length]];
  _cotdCache = { key: dateKey, city };
  return city;
}
```

- [ ] **Step 4: Run test, verify PASS**

```powershell
npx vitest run src/lib/__tests__/dailyPickers.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/dailyPickers.ts src/lib/__tests__/dailyPickers.test.ts
git commit -m "feat(sp11e): parameter-passing daily pickers (proverb/city/histFact) + 6 tests"
```

---

## Phase 3: Client Refactor (Tasks 9–13)

### Task 9: Extend `Content` interface with 2 new fields

**Files:**
- Modify: `src/types/content.ts`

- [ ] **Step 1: Edit `Content` interface**

Append before the closing brace of the `Content` interface (after `SHADOWING`):

```typescript
  LEARN_PATH: import('../lib/learnPathRules').LearnPathLevel[];
  SEASONAL_CAMPAIGNS: import('../lib/seasonalCampaign').SeasonalCampaign[];
```

Also update the doc comment above the interface to say "27 fields" and drop the "LEARN_PATH and SEASONAL_CAMPAIGNS deferred to SP11e" note.

- [ ] **Step 2: Run tsc, verify 0 type errors**

```powershell
npx tsc --noEmit
```

Expected: no errors related to Content interface.

- [ ] **Step 3: Commit**

```powershell
git add src/types/content.ts
git commit -m "types(sp11e): extend Content interface with LEARN_PATH + SEASONAL_CAMPAIGNS"
```

---

### Task 10: Refactor LEARN_PATH consumers (5 files)

**Files:**
- Modify: `src/components/learn/LearnTab.tsx`
- Modify: `src/components/profile/LearnPath.tsx`
- Modify: `src/components/home/HomeTab.tsx`
- Modify: `src/hooks/useScreenLauncher.ts`
- Modify: `src/hooks/usePlacement.ts`

**Refactor pattern per file:**
1. Add `import { evalCk } from '../lib/learnPathRules'` (or correct relative path).
2. Replace `import { LEARN_PATH } from '...appData'` with `const { LEARN_PATH } = useContent();`. For hooks (non-React-components), use `contentClient.getContent()` instead — see how SP11d refactored hooks (`grep -l "contentClient.getContent" src/hooks/`).
3. Replace any `item.ck(stats)` call with `evalCk(item.ckRule, stats)`.

- [ ] **Step 1: Grep all LEARN_PATH usages to confirm the 5 files**

```powershell
git grep -ln "LEARN_PATH\|item\.ck(" src/
```

Expected: 5 files listed above (plus the new `learnPathRules.ts` and its test).

- [ ] **Step 2: Refactor `src/components/learn/LearnTab.tsx`**

Find the import of `LEARN_PATH` and the `item.ck(stats)` call sites. Replace as below (adapt to exact local naming):

```typescript
// BEFORE:
// import { LEARN_PATH } from '../../lib/appData';
// ...
// if (item.ck(stats)) { ... }

// AFTER:
import { useContent } from '../../hooks/useContent';
import { evalCk } from '../../lib/learnPathRules';
// ...inside the component:
const { LEARN_PATH } = useContent();
// ...
if (evalCk(item.ckRule, stats)) { ... }
```

- [ ] **Step 3: Apply the same pattern to the other 4 files**

For hooks (`useScreenLauncher.ts`, `usePlacement.ts`), use `contentClient.getContent()`:

```typescript
import { getContent } from '../lib/contentClient';
import { evalCk } from '../lib/learnPathRules';
// ...
const { LEARN_PATH } = await getContent();
```

- [ ] **Step 4: Run typecheck**

```powershell
npx tsc --noEmit
```

Expected: 0 errors. If consumers depend on a `Stats` type with required fields (`ct`, `vs`, `lc`), make sure they're now compatible with the optional-fields `Stats` interface in `learnPathRules.ts`.

- [ ] **Step 5: Run unit tests for consumer files (if any)**

```powershell
npx vitest run src/components/learn src/components/profile src/components/home src/hooks
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/learn/LearnTab.tsx src/components/profile/LearnPath.tsx src/components/home/HomeTab.tsx src/hooks/useScreenLauncher.ts src/hooks/usePlacement.ts
git commit -m "refactor(sp11e): LEARN_PATH consumers use useContent + evalCk"
```

---

### Task 11: Refactor daily-picker + SEASONAL_CAMPAIGNS consumers

**Files:**
- Modify: `src/components/croatia/DiscoverTab.tsx`
- Modify: `src/components/croatia/CityOfDayScreen.tsx`
- Modify: any consumer of `getActiveCampaign` from appUtils (grep finds them in Step 1)

- [ ] **Step 1: Grep for the legacy call sites**

```powershell
git grep -ln "getProverbOfDay\|getCityOfDay\|getHistFact\|getActiveCampaign" src/
```

- [ ] **Step 2: Refactor `DiscoverTab.tsx`**

```typescript
// BEFORE:
// import { getProverbOfDay } from '../../data/content';
// const proverb = getProverbOfDay();

// AFTER:
import { useContent } from '../../hooks/useContent';
import { getProverbOfDay } from '../../lib/dailyPickers';
// ...inside the component:
const content = useContent();
const proverb = getProverbOfDay(content.PROVERBS as unknown[]);
```

- [ ] **Step 3: Refactor `CityOfDayScreen.tsx`**

```typescript
// BEFORE:
// import { getCityOfDay } from '../../data/content';
// const city = getCityOfDay();

// AFTER:
import { useContent } from '../../hooks/useContent';
import { getCityOfDay } from '../../lib/dailyPickers';
const content = useContent();
const city = getCityOfDay(content.CROATIAN_CITIES as unknown[]);
```

- [ ] **Step 4: Refactor `getActiveCampaign` call sites**

For every file that currently does `import { getActiveCampaign } from '../lib/appUtils'`:

```typescript
// BEFORE:
// import { getActiveCampaign } from '../../lib/appUtils';
// const campaign = getActiveCampaign();

// AFTER:
import { useContent } from '../../hooks/useContent';
import { getActiveCampaign } from '../../lib/seasonalCampaign';
const content = useContent();
const campaign = getActiveCampaign(content.SEASONAL_CAMPAIGNS);
```

For non-React callers (utility modules), use `contentClient.getContent()` instead of `useContent()`.

- [ ] **Step 5: Refactor `getHistFact` call sites the same way**

- [ ] **Step 6: Run typecheck + relevant unit tests**

```powershell
npx tsc --noEmit
npx vitest run src/components/croatia
```

- [ ] **Step 7: Commit**

```powershell
git add src/components/croatia src/  # plus any other consumers found in Step 4
git commit -m "refactor(sp11e): daily-picker + SEASONAL_CAMPAIGNS consumers use server-sourced data"
```

---

### Task 12: Strip legacy code from `content.tsx`, `appUtils.ts`, `appData.ts`

**Files:**
- Modify: `src/data/content.tsx`
- Modify: `src/lib/appUtils.ts`
- Modify: `src/lib/appData.ts`

- [ ] **Step 1: Delete from `src/data/content.tsx`**

In order, with `grep -n` first to confirm line numbers, delete each block:

1. The `V, TOP100, ALPHA, V_B2` destructure on line 93 (keep `BOJE, ZNAM` if still used). Run `git grep "_vocab\." src/data/content.tsx` to confirm what else is read from `_vocab` after the delete.
2. The `HIST_FACTS, PROVERBS, CROATIAN_CITIES` destructure on line 94 (keep `MAPPLACES, MEDIA, POPCULTURE` if still used).
3. The `TRANSPORT, FOODORDER, GROCERY, SCHOOL, FRIENDS, EMERGENCY` from `_scenarios` destructure block (lines 133–154).
4. The TOP100 spread + B2 aliases (lines 169–179).
5. `getProverbOfDay` function (lines 405–419).
6. `getCityOfDay` function and `_cotdCache` variable (lines ~920–955).
7. V composition for LEARN_PATH topic aliases (lines 962–979).
8. `getHistFact` function (lines 983–997).
9. The `LEARN_PATH` array (lines 999–1280).
10. From the barrel export at the end (lines 3420+), drop `getProverbOfDay`, `getCityOfDay`, `getHistFact`, `getActiveCampaign`, and `LEARN_PATH` if exported there.

- [ ] **Step 2: Verify content.tsx no longer references deleted names**

```powershell
git grep -n "LEARN_PATH\|getProverbOfDay\|getCityOfDay\|getHistFact" src/data/content.tsx
```

Expected: zero matches inside `src/data/content.tsx`.

- [ ] **Step 3: Delete from `src/lib/appUtils.ts`**

Delete:
- The `SeasonalCampaign` and `SeasonalQuest` interfaces (lines 55–72)
- `easterSunday` function (lines 82–98)
- `SEASONAL_CAMPAIGNS` array (lines 100–258)
- `getActiveCampaign` function (lines 260–277)

Keep everything else (`lvl`, `lXP`, `nXP`, `lXPgain`, etc.).

- [ ] **Step 4: Delete from `src/lib/appData.ts`**

Drop these lines from the re-export block:

```diff
- LEARN_PATH,
  BADGES,
  DAILY_QUESTS,
- SEASONAL_CAMPAIGNS,
  PLACE,
```

- [ ] **Step 5: Delete legacy data files**

```powershell
git rm src/data/cultural.js src/data/scenarios.js src/data/vocabulary.js
```

(If `content.tsx` still imports from any of these via `_cultural/_scenarios/_vocab` aliases that resolve to `src/data/*.js`, follow the import chain and update the alias source to a placeholder or remove the now-unused imports.)

- [ ] **Step 6: Run typecheck + build + lint**

```powershell
npx tsc --noEmit
npx eslint src/
```

Expected: 0 errors. Any new errors will be import resolution failures — fix by removing the broken import.

- [ ] **Step 7: Run full unit test suite**

```powershell
npx vitest run
```

Expected: all green (with the new tests from Tasks 5–8 included).

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "refactor(sp11e): delete legacy V composition, daily pickers, LEARN_PATH from content.tsx + SEASONAL_CAMPAIGNS from appUtils + data files"
```

---

## Phase 4: Verification & Acceptance (Tasks 13–16)

### Task 13: Extend E2E spec with 5 new content-protection needles

**Files:**
- Modify: `e2e/sp11-content-protection.spec.js`

- [ ] **Step 1: Locate the existing NEEDLES array**

```powershell
git grep -n "NEEDLES\|needle" e2e/sp11-content-protection.spec.js
```

- [ ] **Step 2: Add 5 new needles**

Add these to the existing array (or wherever it asserts the bundle):

```js
// SP11e: ensure 5 final IP names are not present in client bundle
'V_B2 && V_B2',                 // V composition: tells us TOP100 spread / B2 aliases are absent
'PROVERBS[h % PROVERBS.length]', // getProverbOfDay closure
'lp_listen_basics',              // LEARN_PATH item id (canary)
'dynamicWindow',                 // SEASONAL_CAMPAIGNS Easter function
"V['Order Food']",               // LEARN_PATH topic-alias composition
```

- [ ] **Step 3: Run the spec**

```powershell
npx playwright test e2e/sp11-content-protection.spec.js
```

Expected: all needles return zero matches against `dist/assets/*.js`. If the spec needs a build first, run `npm run build` before the playwright command.

- [ ] **Step 4: Commit**

```powershell
git add e2e/sp11-content-protection.spec.js
git commit -m "test(sp11e): add 5 needles for V composition / LEARN_PATH / SEASONAL_CAMPAIGNS / daily pickers"
```

---

### Task 14: Bundle verification — manual grep on production build

**Files:**
- (Verification only — no edits)

- [ ] **Step 1: Produce a fresh production build**

```powershell
npm run build
```

Expected: build completes; `dist/` populated.

- [ ] **Step 2: Grep for the 5 IP names**

```powershell
Get-ChildItem dist/assets/*.js | Select-String -Pattern "V_B2|lp_listen_basics|dynamicWindow|Order Food|PROVERBS\["
```

Expected: **zero matches**. Any match is a bundling regression — find the offending import and remove it.

- [ ] **Step 3: Spot-check the API endpoint returns 401 for anon**

```powershell
curl -i https://nasahrvatska.com/api/content/core
```

Expected: HTTP 401.

(Only run this step after deploy. For pre-deploy verification, use `wrangler pages dev` locally and curl `http://localhost:8788/api/content/core`.)

---

### Task 15: Commit, push, deploy, and write acceptance record

**Files:**
- Create: `docs/superpowers/acceptance/2026-05-16-sp11e-acceptance.md`

- [ ] **Step 1: Push to master (auto-deploys on Cloudflare Pages)**

```powershell
git push origin master
```

- [ ] **Step 2: Wait for CF Pages deploy + watch logs for 5xx on `/api/content/core`**

Open Cloudflare dashboard → Pages → nasa-hrvatska-v2 → Latest deployment. Wait for "Deployment ready". Then check Functions logs for any 500 errors over the next 5 minutes.

- [ ] **Step 3: Spot-check production**

```powershell
curl -i https://nasahrvatska.com/api/content/core
```

Expected: HTTP 401 (auth required). With a valid token (if you have one), confirm the JSON body includes 27 fields.

- [ ] **Step 4: Write `docs/superpowers/acceptance/2026-05-16-sp11e-acceptance.md`**

Use the SP11d acceptance file as the template. Sections to fill:

```markdown
# SP11e — Content Migration Final Closure Acceptance

**Date:** 2026-05-16
**Spec:** docs/superpowers/specs/2026-05-16-sp11e-final-closure-design.md
**Plan:** docs/superpowers/plans/2026-05-16-sp11e-final-closure-plan.md

## Goal Achieved

[Yes/No + 1-paragraph summary]

## Acceptance Criteria

- [x/⚠️] `/api/content/core` returns 27 fields (existing 25 + LEARN_PATH + SEASONAL_CAMPAIGNS).
- [x/⚠️] LEARN_PATH[*].ckRule is well-formed; evalCk() snapshot-matches deleted ck functions.
- [x/⚠️] SEASONAL_CAMPAIGNS[easter].windowKind === 'easterRelative'; resolveCampaignWindow() matches dynamicWindow(year) for 2024–2028.
- [x/⚠️] dist/assets/*.js contains zero needles for V_B2 / lp_listen_basics / dynamicWindow / Order Food / PROVERBS[ .
- [x/⚠️] src/data/{cultural,scenarios,vocabulary}.js deleted.
- [x/⚠️] LEARN_PATH consumers (5 files) + daily-picker consumers (2 files) + getActiveCampaign callers render correctly via useContent.
- [x/⚠️] All new unit tests pass (10+8+6 = 24 tests across 3 files).
- [x/⚠️] Existing tests unchanged; no regressions.
- [x/⚠️] Anon GET /api/content/core still 401.
- [ ] No 5xx on /api/content/core over 24h post-deploy — verify at T+24h.
- [x/⚠️] Acceptance record committed.

## Commits (chronological)

[Paste git log --oneline since SP11d acceptance commit]

## Open Follow-ups

- 24h post-deploy CF 5xx check for /api/content/core
- V_B2 / V_C1 orphans — still in client bundle as part of vocabulary.js's V_B2 / V_C1 exports. These are advanced-vocab tiers not migrated by SP11e because they're consumed by separate B2/C1 advanced-vocab screens, not by LEARN_PATH. Separate sub-project.
```

- [ ] **Step 5: Commit the acceptance record**

```powershell
git add docs/superpowers/acceptance/2026-05-16-sp11e-acceptance.md
git commit -m "docs(sp11e): acceptance record"
git push origin master
```

---

### Task 16: Update memory + close out

**Files:**
- Modify: `~/.claude/projects/C--Windows-system32/memory/project_nasa_hrvatska_sp11e.md`
- Modify: `~/.claude/projects/C--Windows-system32/memory/MEMORY.md`

- [ ] **Step 1: Replace the sp11e memory file with the shipped-state version**

Replace the "Status: Not started" content with the "Status: Shipped on 2026-05-16, NN commits, NN new unit tests, dist bundle clean" + reference to acceptance file.

- [ ] **Step 2: Update MEMORY.md**

Change the one-line entry under "Naša Hrvatska App — Core" for SP11e from "Design approved, not yet implemented" to "Shipped 2026-05-16 — see acceptance doc".

- [ ] **Step 3: Done.**

---

## Self-Review Checklist

**Spec coverage:**
- ✅ 27-field endpoint (Task 3 + 5)
- ✅ LEARN_PATH ckRule DSL with 3 leaf shapes (Tasks 1, 6)
- ✅ SEASONAL_CAMPAIGNS windowKind discriminator (Tasks 2, 7)
- ✅ V composition server-side (Task 3)
- ✅ 3 new client utility files (Tasks 6, 7, 8)
- ✅ 5 LEARN_PATH consumers refactored (Task 10)
- ✅ 2 daily-picker consumers refactored (Task 11)
- ✅ SEASONAL_CAMPAIGNS callers refactored (Task 11)
- ✅ 3 legacy `src/data/*.js` files deleted (Task 12)
- ✅ ETag generator extended (Task 4)
- ✅ Server-side core.test.js extended (Task 5)
- ✅ 24 new unit tests (Tasks 6, 7, 8)
- ✅ E2E spec extended with 5 needles (Task 13)
- ✅ Build + bundle verification (Task 14)
- ✅ Push + deploy + acceptance + 24h monitoring placeholder (Task 15)

**Placeholder scan:** No "TBD" / "implement later" / "add appropriate error handling" anywhere.

**Type consistency:** `LearnPathLevel`, `LearnPathItem`, `CkRule`, `CkLeaf`, `Stats`, `SeasonalCampaign`, `SeasonalQuest` are defined once each (Tasks 6, 7) and referenced consistently in Tasks 9 (Content interface) and 10–11 (consumer refactors).

**Spec items not covered:**
- The spec's "**Performance**" section lists payload growth (~10KB raw / ~3KB gzip) — implicit; no task needed.
- The spec's "**Rollback**" section describes two-phase rollback — operational, no task; documented in the SP11e design doc for reference if needed.

**Risk callouts for the implementer:**
- The `Stats` interface in `learnPathRules.ts` uses optional fields (`ct?`, `vs?`, `lc?`); existing consumers may have a stricter local `Stats` type. If type errors appear in Task 10, the fix is to import this `Stats` from `learnPathRules.ts` rather than re-defining locally.
- `content.tsx` line numbers in this plan are based on the file at SP11e start (3,438 lines). The implementer should run `grep -n` to confirm before deleting, since prior edits may have shifted line numbers.
- The `_vocab`, `_cultural`, `_scenarios`, `_exercises` aliases in `content.tsx` may resolve to either the legacy `src/data/*.js` (about to be deleted) or to a re-export module. Follow the import chain in Task 12 before deleting.
