# SP11c — Lessons Module Server-Side Migration — Design

**Date:** 2026-05-16
**Status:** Approved — ready for implementation plan
**Scope:** Phase 2 second slice. Moves `src/data/lessons.js` server-side. Follow-up SP11d handles `content.tsx` LEARN_PATH + IP exports.

---

## Goal

Remove `src/data/lessons.js` (4,796 lines, 35 lessons, single `LESSONS` array, ~177KB JSON) from the client JS bundle. Serve via one Bearer-gated CF Pages Function. `useScreenLauncher.ts` calls `contentClient.getLessons()` directly — no React hook needed since no component imports `LESSONS`.

After this ships, combined with SP11 + SP11b, all stories, grammar, advanced grammar units, and animated lesson slides are server-side. Only `content.tsx` LEARN_PATH + IP exports remain in-bundle (SP11d).

## Non-Goals

- `content.tsx` LEARN_PATH and IP-bearing exports (V, PROVERBS, BASKETBALL, GYM, etc.) — SP11d.
- The `src/data.tsx` → `content.tsx` barrel itself.
- New defense layers (Turnstile, WAF rules) — deferred.

## Architecture

```
useScreenLauncher (item.go === 'animlesson' or launchAnimLesson)
   |
   v
contentClient.getLessons()  ── reads IDB cache (if fresh) ──> return cached array
   |  (first call this session)
   v
fetchAuthed('/api/content/lessons')  ── Bearer + If-None-Match ──> 401/304/429/200
   |
   v
Client writes IDB ('uid_<uid>:lessons:all'), returns lessons[]
   |
   v
useScreenLauncher does lessons.find(l => l.id === lessonId), setAnimLesson(l)
```

**One bulk endpoint:** `GET /api/content/lessons` returns all 35 lessons as one JSON payload (~177KB raw, ~35KB gzipped). One ETag for the whole array.

**Auth, cache, rate-limit:** Identical to SP11/SP11b. Bearer hard-gate via `_authedRead.js`, IDB + ETag (24h staleness, 30d serve-stale), `AI_QUOTA_DB` KV shared 500/day cap.

## File Layout

### Server-side

```
functions/api/content/
├── _data/
│   ├── lessons.js                  (NEW — moved verbatim from src/data/lessons.js)
│   ├── grammar.js                  (existing, SP11b)
│   ├── gradedStories.js            (existing, SP11)
│   ├── grammarAdvanced.js          (existing, SP11)
│   └── _etags.js                   (auto-gen; extended with ETAGS.lessons)
├── lessons.js                      (NEW — GET /api/content/lessons handler)
├── grammar.js                      (existing, SP11b)
├── _authedRead.js                  (existing, SP11)
├── catalog.js                      (existing)
├── stories/[id].js                 (existing)
└── grammar-units/[id].js           (existing)
```

### Client-side

```
src/lib/
├── contentClient.ts                (extend: add getLessons(): Promise<Lesson[]>)
└── contentCache.ts                 (existing, no change)

src/types/
└── content.ts                      (extend: add Lesson + LessonSlide interfaces)
```

### Consumer refactor (2 call sites only)

`src/hooks/useScreenLauncher.ts` has exactly 2 places where `LESSONS` is dynamically imported and searched by id (lines ~304 and ~594 today). Both refactor identically:

```ts
// Before:
const { LESSONS } = (await import('../data/lessons.js')) as { LESSONS: { id: string }[] };
const l = LESSONS.find((x) => x.id === lessonId);

// After:
const { getLessons } = await import('../lib/contentClient');
const lessons = await getLessons();
const l = lessons.find((x) => x.id === lessonId);
```

No React component imports `LESSONS` directly. The lesson object flows from `useScreenLauncher` through `setAnimLesson(l)` into router state, where `AnimatedLesson.tsx` reads it. AnimatedLesson does not need refactoring.

### appData.ts cleanup

`src/lib/appData.ts` re-exports `LESSONS` from `../data` (the barrel). At closure (Task 6), remove the `LESSONS` entry from the re-export block. After SP11c, appData no longer references `LESSONS`.

### Test cleanup

`src/tests/content-validation.test.js` currently imports `LESSONS` from `'../lib/appData.js'`. Repoint to `'../../functions/api/content/_data/lessons.js'` (matches the SP11b pattern for grammar-imports).

## Endpoint

```js
// functions/api/content/lessons.js
import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import { LESSONS } from './_data/lessons.js';

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.lessons,
    buildBody: () => ({ data: LESSONS }),
  });
}
export const onRequestOptions = onRequestGet;
```

## Types

```ts
// src/types/content.ts additions
export interface LessonSlide {
  type: string;
  title?: string;
  body?: string;
  icon?: string;
  // Slide-type-specific fields are read by AnimatedLesson via discriminated-union
  // narrowing on `type`. Keep this interface loose.
  [key: string]: unknown;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  level: string;
  duration?: number;
  color?: string;
  bg?: string;
  slides: LessonSlide[];
}
```

## Testing Strategy

### Unit tests (Vitest)

| File | Coverage |
|------|----------|
| `scripts/__tests__/generate-content-etags.test.mjs` | Existing tests still pass; `ETAGS.lessons` field is present |
| `functions/api/content/__tests__/lessons.test.js` | NEW. 401 no Bearer; 200 returns 35 lessons; ETag matches `_etags.js`; 304 on If-None-Match |
| `src/lib/__tests__/contentClient.test.ts` | Extend with `getLessons` 200 (cache write) + 304 (cached body) |

### E2E

Extend `e2e/sp11-content-protection.spec.js` (do NOT create a new spec):
- Add 1 test: anon `GET /api/content/lessons` → 401
- Add 3 distinctive Croatian needles from lesson slide bodies to the NEEDLES array (total 11 after SP11c)

### No new hook tests
No `useLessons` hook; `useScreenLauncher` is itself a hook and isn't unit-tested at the hook level.

## Rollout (8 commits)

1. Extend ETag generator for `lessons.js` + test.
2. Move `src/data/lessons.js` → `functions/api/content/_data/lessons.js`.
3. Build `GET /api/content/lessons` endpoint + 4 unit tests.
4. Extend `contentClient.ts` with `getLessons()` + `Lesson`/`LessonSlide` types + 2 unit tests.
5. Refactor the 2 call sites in `useScreenLauncher.ts`. Repoint `content-validation.test.js` import to the server-side `_data/lessons.js` path.
6. **Closure:** Drop `LESSONS` from `appData.ts` re-export. Delete `src/data/lessons.js`. Verify no remaining imports.
7. Extend e2e spec with 3 needles + 1 anon-401 test.
8. Acceptance record.

## Risks

| Risk | Mitigation |
|------|-----------|
| Function payload ~177KB raw | Gzip → ~35KB on wire. CF Function response limit is 25MB. Negligible. |
| First lesson launch waits on network | Existing screen-transition skeleton covers it. IDB cache makes all subsequent launches instant. |
| `content-validation.test.js` touched 3rd time | Single-line import repoint. Low conflict surface. |
| AnimatedLesson depends on loose `Lesson` shape | Same loose-but-typed approach as SP11b's `Grammar`. AnimatedLesson narrows on `slide.type` at consumption. |

## Acceptance Criteria

- [ ] `dist/assets/*.js` after `npm run build` contains zero distinctive lessons.js needles (3 new needles in e2e bundle audit, all absent).
- [ ] `useScreenLauncher` launches a lesson via `getLessons()` (manual smoke since no automated path).
- [ ] Anonymous `fetch('/api/content/lessons')` returns 401.
- [ ] Existing SP11 + SP11b endpoints continue working unchanged.
- [ ] Full Vitest suite at or above 2955 tests, zero failures.
- [ ] `src/data/lessons.js` deleted; `src/lib/appData.ts` no longer re-exports `LESSONS`.
- [ ] CF logs show no 5xx on `/api/content/lessons` over the first 24h post-deploy.
- [ ] Acceptance record committed.
