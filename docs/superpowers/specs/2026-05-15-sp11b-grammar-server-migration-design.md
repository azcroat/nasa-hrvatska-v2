# SP11b — Grammar Module Server-Side Migration — Design

**Date:** 2026-05-15
**Status:** Approved — ready for implementation plan
**Scope:** Phase 2 of curriculum migration, first slice. Moves `src/data/grammar.js` server-side. Follow-ups SP11c (`lessons.js`) and SP11d (`content.tsx` LEARN_PATH + IP exports) are separate efforts.

---

## Goal

Remove `src/data/grammar.js` (3,347 lines, 13 named exports: PADEZI, GRAM, CONJ, MODAL, TENSES, ASPECT, ASPECT_PAIRS, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, PHONOLOGY, PITCH_ACCENT, PADEZI_FULL) from the client JS bundle. Serve via Firebase Bearer-gated Cloudflare Pages Function. React hook `useGrammar()` exposes the data to ~25 consumer components.

After this ships, an AI crawler pulling `dist/assets/*.js` gets zero A1/A2/B1 grammar curriculum content. Combined with SP11 (graded stories + advanced grammar units), nearly all instructional Croatian-language IP has moved server-side.

## Non-Goals

- `lessons.js` migration (SP11c).
- `content.tsx` LEARN_PATH and IP-bearing exports (V, PROVERBS, BASKETBALL, GYM, CROATIAN_CITIES, COUNTRIES, etc.) — SP11d.
- The `src/data.tsx` → `content.tsx` barrel itself. It still exists and still re-exports remaining non-grammar items.
- WAF rules, Turnstile, or any new defense layer beyond Bearer + rate-limit (deferred).

## Architecture

```
Consumer component (AspectDrill / CaseDrill / TenseScreen / etc.)
   |
   v
useGrammar() hook  ── reads IDB cache (if fresh) ──> return synchronously
   |  (first call this session)
   v
contentClient.getGrammar() ── auth + If-None-Match ──> /api/content/grammar
   |
   v
Cloudflare Function ── _verifyToken + _authedRead.js ──> 401/304/429/200
   |
   v
Client writes IDB, returns Grammar object
   |
   v
Hook updates all subscribing components via state
```

**One bulk endpoint:** `GET /api/content/grammar` returns all 13 named exports in one JSON payload (~80KB minified, ~15KB gzipped). One ETag for the whole module.

**Hook contract:**
```ts
interface UseGrammarResult {
  grammar: Grammar | null;     // null while loading or on error
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useGrammar(): UseGrammarResult;
```

Internally the hook uses module-level memoization (`_grammar`, `_inflight`, `_listeners`) plus `useSyncExternalStore` so all subscribing components share one fetch and re-render together when the data resolves.

## File Layout

### Server-side

```
functions/api/content/
├── _data/
│   ├── grammar.js                  (moved verbatim from src/data/grammar.js)
│   ├── gradedStories.js            (existing, SP11)
│   ├── grammarAdvanced.js          (existing, SP11)
│   └── _etags.js                   (auto-gen; extended with ETAGS.grammar)
├── grammar.js                      (NEW — GET /api/content/grammar handler)
├── _authedRead.js                  (existing, SP11 — unchanged)
├── catalog.js                      (existing — unchanged; grammar is its own endpoint, not in catalog)
├── stories/[id].js                 (existing)
└── grammar-units/[id].js           (existing)
```

`scripts/generate-content-etags.mjs` extended to hash the 13 grammar exports as a single resource and write `ETAGS.grammar` (40-char hex).

### Client-side

```
src/lib/
├── contentClient.ts                (extend: add getGrammar(): Promise<Grammar>)
└── contentCache.ts                 (existing, no change — generic key/value)

src/hooks/
└── useGrammar.ts                   (NEW — React hook + module-level dedupe)

src/types/
└── content.ts                      (extend: add Grammar interface)
```

`useSyncExternalStore` is the React 18 primitive for external mutable state with multiple component subscribers. Module-level `_inflight` promise dedupes concurrent fetches across components.

### Consumer migration

~25 unique files across `src/components/`, `src/hooks/`, `src/lib/`. Each currently imports one or more grammar constants via the `src/data.tsx` barrel:

```ts
// Before
import { H, Bar, sh, ASPECT_PAIRS } from '../../data';
function AspectDrill() {
  return <div>{ASPECT_PAIRS[idx].imperfective}</div>;
}

// After
import { H, Bar, sh } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
function AspectDrill() {
  const { grammar, loading, error } = useGrammar();
  if (loading || !grammar) return <DrillSkeleton />;
  if (error) return <DrillError />;
  return <div>{grammar.ASPECT_PAIRS[idx].imperfective}</div>;
}
```

The implementation plan splits the ~25 files into 5 batches of ~5 files each. Each batch is one commit + tests.

### Barrel cleanup (closure step)

`src/data/content.tsx` currently imports PADEZI, GRAM, CONJ, MODAL, TENSES, ASPECT, ASPECT_PAIRS, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, PHONOLOGY, PITCH_ACCENT, PADEZI_FULL from `./grammar.js` and re-exports them in the `export { ... }` block (lines ~3318-3424).

At Task 7:
1. Delete the import line(s) referencing `./grammar.js`.
2. Delete the 13 grammar identifiers from the re-export block.
3. Delete `src/data/grammar.js`.

After Task 7, `src/data/content.tsx` has no grammar references.

## Endpoint

```js
// functions/api/content/grammar.js
import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import * as GRAMMAR from './_data/grammar.js';

function buildBody() {
  return {
    data: {
      PADEZI: GRAMMAR.PADEZI,
      GRAM: GRAMMAR.GRAM,
      CONJ: GRAMMAR.CONJ,
      MODAL: GRAMMAR.MODAL,
      TENSES: GRAMMAR.TENSES,
      ASPECT: GRAMMAR.ASPECT,
      ASPECT_PAIRS: GRAMMAR.ASPECT_PAIRS,
      CONDITIONAL: GRAMMAR.CONDITIONAL,
      FORMAL_REGISTER: GRAMMAR.FORMAL_REGISTER,
      IMPERSONAL: GRAMMAR.IMPERSONAL,
      PHONOLOGY: GRAMMAR.PHONOLOGY,
      PITCH_ACCENT: GRAMMAR.PITCH_ACCENT,
      PADEZI_FULL: GRAMMAR.PADEZI_FULL,
    },
  };
}

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.grammar,
    buildBody,
  });
}
export const onRequestOptions = onRequestGet;
```

## Auth, Rate Limit, Cache

Identical to SP11:

- Firebase Bearer hard-gate via `getFirebaseUid()` in `_authedRead.js`.
- Rate limit via `AI_QUOTA_DB` KV, 500 reads/day per UID, shared cap across all content endpoints. Grammar is one read per user per 24h in steady state (well below cap).
- IDB cache key: `uid_<uid>:grammar:all`. 24h staleness window with ETag revalidation, 30d serve-stale fallback.

## Error Contract

Same shape as SP11 (200/304/401/404/429/500). Inherits `_authedRead.js` behavior unchanged. The 5 existing client error classes (`ContentAuthError`, `ContentNotFoundError`, `ContentRateLimitError`, `ContentOfflineError`, `ContentFetchError`) cover all paths — no new error types needed.

### Hook-level error behavior

| Scenario | Hook returns | Component sees |
|----------|--------------|----------------|
| First call, fetch in-flight | `{ grammar: null, loading: true, error: null }` | Skeleton |
| Fetch resolves 200 | `{ grammar: <obj>, loading: false, error: null }` | Renders content |
| Cache hit (fresh) | Same as above, instant | Renders immediately |
| 304 + stale-but-cached | Returns cached body | Renders content |
| 401 (no Bearer / invalid) | `{ grammar: null, loading: false, error: ContentAuthError }` | Auth error UI |
| 429 + cached body | Returns cached body | Renders content |
| 429 + no cache | `{ grammar: null, loading: false, error: ContentRateLimitError }` | Rate-limit error UI |
| 5xx + cached body | Returns cached body | Renders content |
| 5xx + no cache | `{ grammar: null, loading: false, error: ContentFetchError }` | Generic error + retry |
| Offline + cached | Returns cached body | Renders content |
| Offline + no cache | `{ grammar: null, loading: false, error: ContentOfflineError }` | Offline message + retry |

### UX policies

- **Loading skeleton:** per-screen, inline. Each drill has its own visual language; no shared `<GrammarLoading />` component.
- **Error fallback:** thin per-screen message + Retry button. Errors are exceedingly rare given the 30d serve-stale window.

## Hook Dedupe Pattern

```ts
let _grammar: Grammar | null = null;
let _loading = false;
let _error: Error | null = null;
let _inflight: Promise<Grammar> | null = null;
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach((fn) => fn()); }
function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}
function getSnapshot() {
  return { grammar: _grammar, loading: _loading, error: _error };
}

async function startFetch(): Promise<Grammar> {
  if (_inflight) return _inflight;
  _loading = true;
  _error = null;
  notify();
  _inflight = getGrammar()
    .then((g) => {
      _grammar = g;
      _loading = false;
      _inflight = null;
      notify();
      return g;
    })
    .catch((e) => {
      _error = e as Error;
      _loading = false;
      _inflight = null;
      notify();
      throw e;
    });
  return _inflight;
}

export function useGrammar(): UseGrammarResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (state.grammar || _inflight) return;
    void startFetch().catch(() => {});
  }, [state.grammar]);
  return {
    grammar: state.grammar,
    loading: state.loading,
    error: state.error,
    reload: () => {
      _grammar = null;
      void startFetch().catch(() => {});
    },
  };
}

// Test-only — reset module state between cases
export function _resetGrammarHookForTests() {
  _grammar = null; _loading = false; _error = null; _inflight = null;
  _listeners.clear();
}
```

## Testing Strategy

### Unit tests (Vitest)

| File | Coverage |
|------|----------|
| `scripts/__tests__/generate-content-etags.test.mjs` | Extended: assert `ETAGS.grammar` is present + 40-char hex |
| `functions/api/content/__tests__/grammar.test.js` | NEW. 401 with no Bearer; 200 with valid Bearer returns all 13 named exports; ETag header matches `_etags.js`; 304 short-circuit |
| `src/hooks/__tests__/useGrammar.test.tsx` | NEW. Initial render → loading; resolves to grammar; multi-component dedupe; cache hit → instant; error surfaces; `reload()` re-triggers |
| `src/lib/__tests__/contentClient.test.ts` | Extend SP11 file: `getGrammar` 200 + cache write; `getGrammar` 304 + bumpValidated |

### Component tests

Every ~25 consumer test file that mocks the barrel `'../../data'` needs to mock `useGrammar()` instead. Pattern:

```ts
vi.mock('../../hooks/useGrammar', () => ({
  useGrammar: () => ({
    grammar: TEST_FIXTURE,
    loading: false,
    error: null,
    reload: () => {},
  }),
}));
```

No new component tests added — only existing tests updated to keep them green.

### E2E

Extend the existing `e2e/sp11-content-protection.spec.js` (do NOT create a new spec file):

1. `GET /api/content/grammar` anon → 401
2. Bundle audit: 3 additional needles from grammar.js (distinctive case-ending row, pitch-accent example, formal-register phrase) added to the existing NEEDLES array. After SP11b closure, total = 8 needles, all absent from `dist/assets/*.js`
3. Mocked-route render: navigate to an AspectDrill, mock `/api/content/grammar`, assert a known aspect pair renders

### Regression coverage

- SP11 endpoints (catalog, stories, grammar-units) untouched and continue to pass
- Full Vitest suite stays at or above 2942 tests, zero failures throughout the rollout

## Rollout (16-18 commits expected)

Each task is one commit + `git push origin master`. CF auto-deploys on push.

1. Extend ETag generator + test for `ETAGS.grammar` field.
2. Move `src/data/grammar.js` → `functions/api/content/_data/grammar.js` (verbatim copy).
3. Build `GET /api/content/grammar` endpoint + 4 unit tests.
4. Extend `contentClient.ts` with `getGrammar()` + extend `Grammar` types in `src/types/content.ts`.
5. Build `src/hooks/useGrammar.ts` + 6 unit tests.
6. Consumer refactor in 5 batches of ~5 files each (Tasks 6a-6e). Each batch updates components + their test files, keeps full suite green.
7. **Closure:** delete `src/data/grammar.js`; delete grammar imports + re-exports from `content.tsx`; verify no remaining references.
8. Extend `e2e/sp11-content-protection.spec.js` with 3 grammar needles + 1 anon-401 + 1 mocked-render test.
9. Acceptance record at `docs/superpowers/acceptance/2026-05-15-sp11b-acceptance.md`.

Steps 6a-6e keep the bundle copy of `grammar.js` as fallback. Step 7 is the real closure.

## Risks

| Risk | Mitigation |
|------|-----------|
| React strict-mode double-render triggers duplicate fetches | `_inflight` promise dedupe at module level; second mount sees existing promise |
| ~25-file refactor introduces inconsistencies between consumers | Batched into 5 commits of ~5 files each, each batch verified independently before next starts |
| Consumer accidentally still imports PADEZI from barrel after Task 7 | Build fails fast (export doesn't exist). Bundle audit catches as belt-and-suspenders |
| Function payload (~80KB) on slow networks | Gzip → ~15KB. IDB cache after first load |
| Cold-start latency on first grammar fetch | Per-screen skeleton; subsequent loads instant from cache |
| LEARN_PATH or other code still references grammar via barrel | Step 7 verification phase greps for any remaining usage |

## Acceptance Criteria

- [ ] `dist/assets/*.js` after `npm run build` contains zero distinctive grammar.js needles (3 new e2e bundle-audit needles).
- [ ] All ~25 consumer screens render via `useGrammar()` with mocked hook in test.
- [ ] Anonymous `fetch('/api/content/grammar')` returns 401.
- [ ] `useGrammar()` hook passes all dedupe + cache + error tests.
- [ ] Existing SP11 endpoints (catalog, stories, grammar-units) continue to work unchanged.
- [ ] Full Vitest suite remains at or above 2942 tests, zero failures.
- [ ] `src/data/grammar.js` deleted; `src/data/content.tsx` no longer re-exports grammar constants.
- [ ] CF logs show no 5xx on `/api/content/grammar` over the first 24h post-deploy.
- [ ] Acceptance record committed.
