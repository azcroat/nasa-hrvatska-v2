# SP11e — Content Migration Final Closure — Design

**Date:** 2026-05-16
**Status:** Approved — ready for implementation plan
**Scope:** Phase 2 final slice. Closes the residue from SP11d partial closure (3 bundled names) and migrates the 2 function-valued exports (LEARN_PATH, SEASONAL_CAMPAIGNS) via a JSON DSL for predicates. End state: zero curriculum IP from `src/data/{cultural,scenarios,vocabulary}.js` survives tree-shake into the production bundle.

---

## Goal

Finish what SP11d started. After this SP, `src/data/content.tsx` carries only React display components (H, Bar, Spk) and small drill data; all curriculum content lives behind the existing `/api/content/core` Bearer gate.

### The 5 names

| Name | Current location | Migration shape |
|------|------------------|-----------------|
| `V` | `src/data/vocabulary.js` + content.tsx body composition | Server returns V already-composed (aliases applied) |
| `PROVERBS` | `src/data/cultural.js` (still imported by content.tsx) | Already in `/api/content/core`; refactor consumers + helper |
| `CROATIAN_CITIES` | `src/data/cultural.js` (still imported by content.tsx) | Already in `/api/content/core`; refactor consumers + helper |
| `LEARN_PATH` | content.tsx body, lines 999–1280 | Server payload + JSON DSL for `ck` predicates |
| `SEASONAL_CAMPAIGNS` | `src/lib/appUtils.ts` | Server payload + `windowKind` flag for Easter's dynamic window |

## Non-Goals

- H/Bar/Spk React display components in content.tsx — stay client-side, no IP.
- The ~50 small drill exports (RIDDLES, QWORDS, NEGATION, COLORAGREE, etc.) — stay client-side, not high-IP curriculum.
- V_B2 / V_C1 advanced-vocab tiers — orphan from SP11d, separate future SP.
- DAILY_QUESTS in content.tsx body — stays client-side (game mechanics, not curriculum).
- New defense layers (already covered: Turnstile + Firebase auth + rate-limit).

---

## Architecture

### Endpoint extension

`/api/content/core` grows from 25 → 27 fields. Same Bearer gate (`_authedRead.js`), same single ETag, same daily-cap budget. Adding two top-level fields:

```ts
interface Content {
  // ... existing 25 fields from SP11d
  LEARN_PATH: LearnPathLevel[];
  SEASONAL_CAMPAIGNS: SeasonalCampaign[];
}
```

Total payload growth: ~10KB before gzip; ~3KB after. Acceptable.

### Function-data split — LEARN_PATH

Every existing `ck` predicate matches one of three shapes:

```js
// Shape A — completed-topic check
function (s) { return (s.ct && s.ct.includes('greetings')) || s.lc >= 1; }
// Shape B — visited-screen check (used by lp_listen_basics)
function (s) { return (s.vs && s.vs.includes('listening')) || s.lc >= 2; }
// Shape C — pure lesson-count threshold (a few items have no topic)
function (s) { return s.lc >= 12; }
```

JSON DSL:

```ts
type CkLeaf =
  | { ctIncludes: string }
  | { vsIncludes: string }
  | { lcAtLeast: number };

type CkRule = { anyOf: CkLeaf[] };

interface LearnPathItem {
  id: string;
  name: string;
  go: string;        // route key: 'lesson' | 'listening' | etc.
  topic?: string;    // payload for the route (existing field)
  diff: number;
  dur: string;
  cat?: string;      // existing optional category
  icon?: string;     // existing optional icon
  desc?: string;     // existing optional desc
  ckRule: CkRule;    // replaces ck: function
}
```

Client interpreter (`src/lib/learnPathRules.ts`):

```ts
export function evalCk(rule: CkRule | undefined, stats: Stats): boolean {
  if (!rule) return false;
  return rule.anyOf.some(leaf => evalLeaf(leaf, stats));
}

function evalLeaf(leaf: CkLeaf, s: Stats): boolean {
  if ('ctIncludes' in leaf) return Array.isArray(s.ct) && s.ct.includes(leaf.ctIncludes);
  if ('vsIncludes' in leaf) return Array.isArray(s.vs) && s.vs.includes(leaf.vsIncludes);
  if ('lcAtLeast' in leaf) return typeof s.lc === 'number' && s.lc >= leaf.lcAtLeast;
  return false; // forward-compat: unknown leaf kinds evaluate false
}
```

Forward-extensible: future leaf types (e.g. `{ xpAtLeast: 1000 }`, `{ badgeOwned: 'streak30' }`) add new branches without breaking older clients.

### Function-data split — SEASONAL_CAMPAIGNS

Only Easter has a function (`dynamicWindow: (year) => {...}`). Three of four campaigns use fixed `start/end` month-day tuples that already serialize cleanly.

Replace the function with a discriminator:

```ts
interface SeasonalCampaign {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  multiplier: number;
  blurb: string;
  windowKind: 'fixed' | 'easterRelative';
  start?: [number, number];           // when windowKind === 'fixed'
  end?: [number, number];             // when windowKind === 'fixed'
  windowOffsets?: [number, number];   // when windowKind === 'easterRelative'; days from Easter Sunday
  quests: SeasonalQuest[];
}
```

Easter becomes:

```json
{
  "id": "easter",
  "windowKind": "easterRelative",
  "windowOffsets": [-7, 1],
  // ...rest
}
```

Client utility (`src/lib/seasonalCampaign.ts`):

```ts
export function easterSunday(year: number): { month: number; day: number } {
  // Anonymous Gregorian — unchanged 8-line algorithm from appUtils.ts
}

export function resolveCampaignWindow(c: SeasonalCampaign, year: number):
  { start: [number, number]; end: [number, number] } {
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

export function getActiveCampaign(
  campaigns: SeasonalCampaign[],
): SeasonalCampaign | null {
  const now = new Date();
  const year = now.getFullYear();
  const m = now.getMonth() + 1, d = now.getDate();
  return campaigns.find(c => {
    const win = resolveCampaignWindow(c, year);
    // Same active-window check as the current appUtils.ts version
    return isWithinWindow(m, d, win.start, win.end);
  }) ?? null;
}
```

The 8-line `easterSunday()` math is a pure algorithm with zero IP — keeping it client-side is correct.

### V composition — server-side

The 30 lines in content.tsx body that mutate V:

```js
// TOP100 spread
Object.keys(TOP100).forEach(k => { V[k] = TOP100[k]; });
// B2 vocab aliases
V['journalism'] = (V_B2 && V_B2['media & journalism']) || [];
V['philosophy'] = (V_B2 && V_B2['philosophy & ethics']) || [];
V['literature'] = (V_B2 && V_B2['academic language']) || [];
V['politics'] = V['civic'] || [];
// LEARN_PATH topic aliases
V['Order Food'] = [].concat(FOODORDER.bakery.items, /* ... */);
V['Getting Around'] = TRANSPORT.map(t => [t.hr, t.en]);
V['School Kit'] = [].concat(SCHOOL.classroom, SCHOOL.phrases);
V['Making Friends'] = FRIENDS.map(f => [f.hr, f.en]);
V['Grocery Shopping'] = [].concat(GROCERY.vocab, GROCERY.phrases);
V['Alphabet'] = ALPHA.map(a => [a[0], a[1] + ' — ' + a[2] + ' (' + a[3] + ')']);
V['Emergency'] = [].concat(EMERGENCY.phrases, EMERGENCY.bodyParts);
```

Moves into `functions/api/content/_data/core.js` aggregator. Composition runs once when the function module loads (cold start). Client receives V already-composed via `/api/content/core`. Cache key (ETag) covers the composed V — any change to the source files or composition logic invalidates the ETag.

### Daily pickers — refactor to parameter-passing

`getProverbOfDay()` and `getCityOfDay()` are pure date-seeded shuffles. They become array-taking utilities:

```ts
// src/lib/dailyPickers.ts (new file)
export function getProverbOfDay(proverbs: Proverb[]): Proverb {
  const dk = todayDateKey();
  const h = djb2('prov:' + dk);
  return proverbs[h % proverbs.length];
}

export function getCityOfDay(cities: City[]): City {
  // Existing date-seeded LCG-shuffle picker, parameter-passed
}

export function getHistFact(facts: HistFact[]): HistFact {
  const dk = todayDateKey();
  const h = djb2('fact:' + dk);
  return facts[h % facts.length];
}
```

Callers:
- `DiscoverTab.tsx` — already uses useContent (SP11d); change `getProverbOfDay()` to `getProverbOfDay(content.PROVERBS)`
- `CityOfDayScreen.tsx` — same pattern with `content.CROATIAN_CITIES`
- `content.tsx` body uses of `getHistFact()` — move call sites to consumers
- `src/tests/utils.test.js` — pass test array directly

---

## Data flow

```
[server: functions/api/content/_data/]
  vocabulary.js → V_RAW + TOP100 + V_B2 + ALPHA
  scenarios.js  → FOODORDER + TRANSPORT + GROCERY + SCHOOL + FRIENDS + EMERGENCY + ...
  cultural/*    → PROVERBS + CROATIAN_CITIES + HIST_FACTS + ...
  ↓
  core.js aggregator runs V composition once at module load
  ↓
  composes LEARN_PATH array with ckRule DSL (translated from JS predicates)
  composes SEASONAL_CAMPAIGNS array with windowKind discriminator
  ↓
  /api/content/core handler returns Content { 27 fields }

[client]
  useContent() → fetches once + caches in IDB
  ↓
  React consumers read content.V (composed), content.LEARN_PATH (DSL), etc.
  ↓
  evalCk(item.ckRule, stats) for unlock checks
  resolveCampaignWindow(c, year) for active-campaign math
  getProverbOfDay(content.PROVERBS) for daily pick
```

---

## Components — file inventory

### New files (server)
None. `functions/api/content/_data/core.js` is extended; no new endpoint module.

### New files (client)
- `src/lib/learnPathRules.ts` — DSL types + `evalCk()` interpreter
- `src/lib/seasonalCampaign.ts` — `easterSunday()` + `resolveCampaignWindow()` + `getActiveCampaign()`
- `src/lib/dailyPickers.ts` — `getProverbOfDay`, `getCityOfDay`, `getHistFact` (array-taking)

### Modified server files
- `functions/api/content/_data/core.js` — extend aggregator with V composition, LEARN_PATH DSL, SEASONAL_CAMPAIGNS DSL
- `scripts/generate-content-etags.mjs` — pick up the 2 new fields when hashing

### Modified client files
- `src/types/content.ts` — Content interface +2 fields
- `src/hooks/useContent.ts` — no changes (fields ride existing payload)
- `src/lib/contentClient.ts` — no changes (getContent return type widens)
- `src/components/learn/LearnTab.tsx` — read LEARN_PATH from useContent, use evalCk
- `src/components/profile/LearnPath.tsx` — same
- `src/components/home/HomeTab.tsx` — same
- `src/hooks/useScreenLauncher.ts` — same
- `src/hooks/usePlacement.ts` — same
- `src/components/croatia/DiscoverTab.tsx` — call `getProverbOfDay(content.PROVERBS)` from dailyPickers
- `src/components/croatia/CityOfDayScreen.tsx` — call `getCityOfDay(content.CROATIAN_CITIES)`
- `src/lib/appUtils.ts` — DELETE SEASONAL_CAMPAIGNS + getActiveCampaign (now in seasonalCampaign.ts); keep `easterSunday()` callers happy by re-exporting from new location
- `src/data/content.tsx` — DELETE: destructure block (lines 93–154), V composition (lines 169–179, 962–979), `getProverbOfDay`/`getCityOfDay`/`getHistFact` body helpers, LEARN_PATH array (lines 999–~1280)
- `src/lib/appData.ts` — drop LEARN_PATH + SEASONAL_CAMPAIGNS from re-exports

### Deleted files
- `src/data/cultural.js` — no remaining client consumers
- `src/data/scenarios.js` — no remaining client consumers
- `src/data/vocabulary.js` — no remaining client consumers

The corresponding server-side copies in `functions/api/content/_data/` are the canonical sources.

---

## Tests

### New unit tests
- `src/lib/__tests__/learnPathRules.test.ts` (~10 tests)
  - Each leaf type: ctIncludes / vsIncludes / lcAtLeast — true + false cases
  - anyOf combinator with mixed truth values
  - Empty/missing rule returns false
  - Unknown leaf kind → false (forward-compat)
  - Stats with missing arrays handled gracefully
- `src/lib/__tests__/seasonalCampaign.test.ts` (~8 tests)
  - easterSunday for 5 known years (2024–2028) against published reference
  - resolveCampaignWindow fixed kind returns input unchanged
  - resolveCampaignWindow easterRelative computes [-7, +1] correctly
  - getActiveCampaign returns null outside any window
  - getActiveCampaign returns easter during Palm Sunday window
  - getActiveCampaign respects fixed-window campaigns
- `src/lib/__tests__/dailyPickers.test.ts` (~6 tests)
  - getProverbOfDay deterministic per date
  - Different date → different pick (with high probability over a 30-day sample)
  - Empty array returns undefined safely
  - Same for getCityOfDay + getHistFact

### Extended tests
- `functions/api/content/__tests__/core.test.js`
  - Asserts response includes `LEARN_PATH` (array of objects with `ckRule.anyOf`)
  - Asserts response includes `SEASONAL_CAMPAIGNS` (array with at least one `windowKind: 'easterRelative'`)
  - V composition is applied: `data.V['Order Food']` is a populated array
- `scripts/__tests__/generate-content-etags.test.mjs`
  - ETag hashes include LEARN_PATH + SEASONAL_CAMPAIGNS bytes
- `e2e/sp11-content-protection.spec.js`
  - +5 needles for now-eliminated bundled content (V_B2 sample, PROVERBS sample, LEARN_PATH item id `lp1`, SEASONAL_CAMPAIGNS id `easter`, dynamicWindow function source)

### Bundle verification
Acceptance step runs `npm run build` then greps `dist/assets/*.js` for the 5 needles. Must return zero matches.

---

## Error handling

**Missing ckRule on a LEARN_PATH item:** treat as locked (evalCk returns false for `undefined`). No throw — client renders the item as not-yet-unlocked.

**Unknown leaf kind:** forward-compat reserved. evalLeaf returns false for unrecognized shape. Logged once via Sentry if Sentry is wired.

**Easter computation outside reasonable range** (e.g. year 1582): not a real case; `easterSunday` handles all years ≥ 1583 correctly per Anonymous Gregorian. No guard.

**Server composition error during V composition** (e.g. TOP100 missing a key): fail loudly at function cold-start with a thrown error → 5xx → CF Pages alert. Composition is deterministic; failing fast surfaces data drift early.

**ETag invalidation:** ETag generator already runs in CI prebuild and is committed. Same flow.

---

## Rollback

Two-phase rollback if SP11e introduces a regression in production:

**Phase 1 (immediate, no deploy):** revert client to the prior bundled version via Cloudflare Pages' deployment rollback (one click). Old bundle still has V/PROVERBS/CROATIAN_CITIES + LEARN_PATH + SEASONAL_CAMPAIGNS local. Server endpoint can continue returning new fields without breaking old client (it ignores unknown fields).

**Phase 2 (clean revert):** `git revert` the SP11e commits, re-deploy. The `/api/content/core` endpoint reverts to 25 fields. Bundle returns to SP11d state.

No data migration. No schema changes. No user-visible state to preserve.

---

## Performance

- `/api/content/core` payload before SP11e: ~180KB. After: ~190KB (+5%). One-time per session via useContent cache.
- Composition cost on server: O(1) — fixed-size mutations on V. Runs once at function cold start (~1ms).
- evalCk cost: ~5 string comparisons per LEARN_PATH item per render. LEARN_PATH has ~30 items. Negligible.
- Bundle size: -8–12KB removed from prod bundle (cultural.js + scenarios.js + vocabulary.js content). Trade is ~2KB of new client utilities (learnPathRules + seasonalCampaign + dailyPickers).

Net bundle: smaller, despite the new utility files. Net round-trips: unchanged (LEARN_PATH and SEASONAL_CAMPAIGNS ride existing useContent fetch).

---

## Open questions

None at design time. The DSL is a closed system over the existing predicate shapes. The `easterSunday` math is a fixed algorithm. The V composition is mechanical mutation.

---

## Acceptance criteria

- [ ] `/api/content/core` returns 27 fields (existing 25 + LEARN_PATH + SEASONAL_CAMPAIGNS).
- [ ] `LEARN_PATH[*].ckRule` is well-formed; `evalCk()` produces the same boolean output as the deleted `ck` functions for representative stats objects (snapshot test).
- [ ] `SEASONAL_CAMPAIGNS[easter].windowKind === 'easterRelative'`; `resolveCampaignWindow()` produces the same date range as the deleted `dynamicWindow(year)` for years 2024–2028 (snapshot test).
- [ ] `dist/assets/*.js` contains zero needles for the 5 named exports (V/PROVERBS/CROATIAN_CITIES/LEARN_PATH/SEASONAL_CAMPAIGNS source content).
- [ ] `src/data/{cultural,scenarios,vocabulary}.js` deleted from working tree.
- [ ] All 5 LEARN_PATH consumers + 2 daily-picker consumers render correctly via useContent.
- [ ] All new unit tests pass (~24 tests across 3 files).
- [ ] Existing tests unchanged; no regressions.
- [ ] Anon `GET /api/content/core` still 401.
- [ ] No 5xx on `/api/content/core` over 24h post-deploy (verify at T+24h).
- [ ] Acceptance record committed.
