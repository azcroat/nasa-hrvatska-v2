# SP11d — content.tsx Core Migration — Design

**Date:** 2026-05-16
**Status:** Approved — ready for implementation plan
**Scope:** Phase 2 third slice. Moves 27 high-IP-density exports from `src/data/content.tsx` server-side. Remaining ~50 small drill exports + H/Bar/Spk components stay client-side (SP11e+).

---

## Goal

Remove 27 high-IP-density exports from `src/data/content.tsx` to a Bearer-gated CF Pages Function. Combined with SP11/SP11b/SP11c, this protects the largest remaining curriculum IP: vocab pools, cultural content, situational scenarios, and LEARN_PATH (the curriculum sequence).

### The 27 exports

| Category | Names |
|----------|-------|
| Vocab pools (8) | V, COUNTRIES, PROFESSIONS, WEATHER, CLOTHES, BODYDESC, TECH_VOC, BUREAUCRATIC |
| Cultural (9) | PROVERBS, IDIOMS, BRZALICE, HISTORY, EVENTS, KINGS, REGIONS, DIALECTS, CROATIAN_CITIES |
| Situational (6) | FOODORDER, TRANSPORT, GROCERY, RECIPES, PRACTICAL, SCENES |
| Curriculum structure (4) | LEARN_PATH, LEVEL_NARRATIVE, SEASONAL_CAMPAIGNS, SHADOWING |

## Non-Goals

- The remaining ~50 small drill exports in content.tsx (RIDDLES, QWORDS, NEGATION, COMPARE, GENDERDRILL, COLORAGREE, etc.). SP11e+.
- H/Bar/Spk React components — stay in content.tsx and remain barrel-exported.
- The `src/data.tsx` → `content.tsx` barrel itself.
- New defense layers (Turnstile, WAF rules).

## Architecture

One bulk endpoint: `GET /api/content/core` returns all 27 as one JSON object (~100–200KB raw, ~30–50KB gzipped). One ETag. IDB cache key `uid_<uid>:core:all`, 24h staleness, 30d serve-stale.

```
Consumer component (HomeTab / LearnTab / VocabScreens / dozens more)
   |
   v
useContent() hook  ── reads IDB cache (if fresh) ──> return synchronously
   |  (first call this session)
   v
contentClient.getContent() ── Bearer + If-None-Match ──> /api/content/core
   |
   v
Cloudflare Function ── _authedRead.js ──> 401/304/429/200
   |
   v
Client writes IDB, returns Content object
   |
   v
Hook updates all subscribers via useSyncExternalStore
```

Hook contract identical to `useGrammar` from SP11b (module-level `_inflight` dedupe, memoized snapshot, `_resetContentHookForTests`).

## File Layout

### Server-side

```
functions/api/content/
├── _data/
│   ├── core.js                     (NEW — extracted 27 exports from content.tsx)
│   ├── lessons.js                  (existing, SP11c)
│   ├── grammar.js                  (existing, SP11b)
│   ├── gradedStories.js            (existing, SP11)
│   ├── grammarAdvanced.js          (existing, SP11)
│   └── _etags.js                   (auto-gen; extended with ETAGS.core)
├── core.js                         (NEW — GET /api/content/core handler)
├── _authedRead.js                  (existing)
└── ... (existing endpoints)
```

ETag generator walks the 27-export composite, writes `ETAGS.core` (40-char SHA-1).

### Client-side

```
src/lib/
├── contentClient.ts                (extend: add getContent(): Promise<Content>)
└── contentCache.ts                 (existing, no change)

src/hooks/
└── useContent.ts                   (NEW — React hook, mirrors useGrammar)

src/types/
└── content.ts                      (extend: add Content interface)
```

### Consumer migration

Sites that import any of the 27 names from the barrel must switch to `useContent()` (components) or `contentClient.getContent()` (non-components like usePlacement, useScreenLauncher, appData). Estimated 40–60 files, batched into ~5 commits of ~10 files each.

**Pattern (SP11b-proven):**
```tsx
// Before
import { H, Bar, sh, LEARN_PATH } from '../../data';
function Component() { return <div>{LEARN_PATH.map(...)}</div>; }

// After
import { H, Bar, sh } from '../../data';
import { useContent } from '../../hooks/useContent';
function Component() {
  const { content, loading, error } = useContent();
  if (error) return <ErrorState />;
  if (loading || !content) return <LoadingState />;
  const { LEARN_PATH } = content;
  return <div>{(LEARN_PATH as unknown as PathItem[]).map(...)}</div>;
}
```

## Endpoint

```js
import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import * as CORE from './_data/core.js';

const KEYS = [
  'V','COUNTRIES','PROFESSIONS','WEATHER','CLOTHES','BODYDESC','TECH_VOC','BUREAUCRATIC',
  'PROVERBS','IDIOMS','BRZALICE','HISTORY','EVENTS','KINGS','REGIONS','DIALECTS','CROATIAN_CITIES',
  'FOODORDER','TRANSPORT','GROCERY','RECIPES','PRACTICAL','SCENES',
  'LEARN_PATH','LEVEL_NARRATIVE','SEASONAL_CAMPAIGNS','SHADOWING',
];

function buildBody() {
  const data = {};
  for (const k of KEYS) data[k] = CORE[k];
  return { data };
}

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.core,
    buildBody,
  });
}
export const onRequestOptions = onRequestGet;
```

## Types

```ts
// src/types/content.ts additions
export interface Content {
  V: Record<string, unknown>;
  COUNTRIES: unknown[];
  PROFESSIONS: unknown[];
  WEATHER: Record<string, unknown>;
  CLOTHES: Record<string, unknown>;
  BODYDESC: unknown[];
  TECH_VOC: Record<string, unknown>;
  BUREAUCRATIC: Record<string, unknown>;
  PROVERBS: unknown[];
  IDIOMS: unknown[];
  BRZALICE: unknown[];
  HISTORY: unknown[];
  EVENTS: unknown[];
  KINGS: unknown[];
  REGIONS: unknown[];
  DIALECTS: Record<string, unknown>;
  CROATIAN_CITIES: unknown[];
  FOODORDER: unknown[];
  TRANSPORT: unknown[];
  GROCERY: unknown[];
  RECIPES: unknown[];
  PRACTICAL: unknown[];
  SCENES: Record<string, unknown>;
  LEARN_PATH: unknown[];
  LEVEL_NARRATIVE: Record<string, unknown>;
  SEASONAL_CAMPAIGNS: unknown[];
  SHADOWING: unknown[];
}
```

Exact `Record` vs `unknown[]` per-field is verified against actual source during Task 2; implementers narrow at consumption.

## Critical Edge Cases

**1. LEARN_PATH on app boot.** HomeTab/LearnTab/LearnPath render the sequence on first paint. Per-component skeleton handles the async gap (~150–300ms cold cache, instant after). Same pattern as SP11b grammar drill screens. No boot preloader needed.

**2. `usePlacement.ts`** consumes LEARN_PATH to decide next-item navigation. Refactor: `const { content } = useContent(); if (!content) return null;`. Callers (App.tsx) already handle null returns.

**3. content.tsx body usage** — Task 2 verifies via grep that the 27 names appear ONLY in import/export blocks of content.tsx, not in body code. Likely zero usage (content.tsx is an aggregator), but verified.

**4. `appData.ts` re-exports** — drop the 27 names. `content-validation.test.js` repoints to import from `functions/api/content/_data/core.js`.

## Testing Strategy

### Unit tests (Vitest)

| File | Coverage |
|------|----------|
| `scripts/__tests__/generate-content-etags.test.mjs` | Existing 5 pass; `ETAGS.core` field present |
| `functions/api/content/__tests__/core.test.js` | NEW. 401 no Bearer; 200 returns all 27 keys; ETag matches; 304 on If-None-Match. 4 tests |
| `src/hooks/__tests__/useContent.test.tsx` | NEW. Loading → resolves; dedupe; cache instant; error surfaces; reload re-triggers; reset clears. 6 tests mirroring useGrammar |
| `src/lib/__tests__/contentClient.test.ts` | +2 tests: `getContent` 200 + 304 |

### Component tests
Every consumer test that mocked `'../data'` to provide LEARN_PATH/V/etc. switches to `useContent()` mock. Pattern from SP11b.

### E2E
Extend `e2e/sp11-content-protection.spec.js`:
- Add 1 test: anon `GET /api/content/core` → 401
- Add 3 distinctive needles from PROVERBS/HISTORY/KINGS or a vocab pool entry. Total = 14.

## Rollout (estimated 11 commits)

1. Extend ETag generator for `core.js` + test.
2. Extract 27 exports from `src/data/content.tsx` to `functions/api/content/_data/core.js` (pure addition, nothing deleted from content.tsx yet).
3. Build `GET /api/content/core` endpoint + 4 tests.
4. Extend `contentClient.ts` with `getContent()` + `Content` type + 2 tests.
5. Build `src/hooks/useContent.ts` + 6 tests.
6a–6e. Consumer refactor in ~5 batches of ~10 files each. List enumerated by grep in Task 6a.
7. **Closure:** drop the 27 names from `content.tsx` export block; drop from `appData.ts` re-exports. Bundle audit.
8. Extend e2e spec.
9. Acceptance record.

## Risks

| Risk | Mitigation |
|------|-----------|
| `core.js` extraction missing a transitive reference inside content.tsx body | Task 2 verifies via grep; hoist or adjust scope if found |
| LEARN_PATH async-fetch breaks usePlacement's caller contract | usePlacement returns null while loading; callers already handle null |
| Payload size (~100–200KB) | Gzip ~30–50KB on wire. Well under CF Function 25MB limit |
| 40–60 file consumer refactor sprawl | 5 batches × ~10 files; each verified independently |
| Consumer accidentally still imports a moved name after Task 7 | Build fails on unresolved import; bundle audit belt-and-suspenders |
| Hook-state shared across React strict-mode double renders | `_inflight` dedupe at module level; second mount shares promise (proven in SP11b) |

## Acceptance Criteria

- [ ] `dist/assets/*.js` contains zero needles from the 27 moved exports (3 new e2e needles, all absent)
- [ ] All ~40–60 consumer screens render via `useContent()` with mocked hook in test
- [ ] Anonymous `fetch('/api/content/core')` returns 401
- [ ] `useContent()` passes all 6 hook tests
- [ ] Existing SP11 + SP11b + SP11c endpoints unchanged
- [ ] Full Vitest suite at or above 2955 tests, zero failures
- [ ] 27 names removed from `content.tsx` export block + `appData.ts` re-exports
- [ ] CF logs show no 5xx on `/api/content/core` over the first 24h post-deploy
- [ ] Acceptance record committed
