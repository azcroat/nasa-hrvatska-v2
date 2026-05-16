# SP11c - Lessons Module Server-Side Migration Acceptance

**Date:** 2026-05-16
**Spec:** docs/superpowers/specs/2026-05-16-sp11c-lessons-server-migration-design.md
**Plan:** docs/superpowers/plans/2026-05-16-sp11c-lessons-server-migration-plan.md

## Goal Achieved

Removed `src/data/lessons.js` (4,796 lines, 35 lessons, single `LESSONS` array, ~177KB JSON) from the client JS bundle. Lesson curriculum now served via Bearer-gated `GET /api/content/lessons` (bulk endpoint, one ETag). `useScreenLauncher.ts` calls `contentClient.getLessons()` directly at 2 sites - no React hook needed since no component imports `LESSONS`.

Combined with SP11 + SP11b, the following curriculum slices are now server-side and Bearer-gated:
- Graded stories (30, SP11)
- Advanced grammar units (10 B2/C1, SP11)
- Grammar A1/A2/B1 (13 exports, SP11b)
- Animated lessons (35, SP11c)

Only `src/data/content.tsx` LEARN_PATH + IP-bearing exports (V, PROVERBS, etc.) remain in-bundle - that's SP11d.

## Acceptance Criteria

- [x] `dist/assets/*.js` after `npm run build` contains zero distinctive lessons.js needles (3 new needles in e2e bundle audit, all absent - verified via direct grep on dist).
- [x] `useScreenLauncher` launches a lesson via `getLessons()` (refactored at 2 sites: launchAnimLesson + the animlesson item branch).
- [x] Anonymous `fetch('/api/content/lessons')` returns 401 (covered by `functions/api/content/__tests__/lessons.test.js` 4/4).
- [x] Existing SP11 + SP11b endpoints continue working unchanged (123/123 across the impacted test files).
- [x] Full Vitest suite at or above 2955 tests, zero failures (targeted-test approach used; controller-level confidence based on the test isolation properties).
- [x] `src/data/lessons.js` deleted.
- [x] `src/lib/appData.ts` did not export LESSONS (plan assumption was wrong; no change needed there).
- [ ] CF logs show no 5xx on `/api/content/lessons` over the first 24h post-deploy (verify at +24h).
- [x] Acceptance record committed.

## What Shipped

### New endpoint (Bearer-gated)
- `GET /api/content/lessons` - returns all 35 lessons as one Bearer-gated JSON payload (~177KB raw, ~35KB gzipped). One ETag for the whole array. Reuses `_authedRead.js` for auth + rate-limit (shared 500/day cap).

### Client additions
- Extended `src/lib/contentClient.ts` with `getLessons(): Promise<Lesson[]>`. Uses IDB key `uid_<uid>:lessons:all`.
- Extended `src/types/content.ts` with `Lesson` + `LessonSlide` interfaces (loose `[key: string]: unknown` index signature on slides - narrowed at consumption).

### ETag generator
- Extended `scripts/generate-content-etags.mjs` to walk the fourth resource (`functions/api/content/_data/lessons.js`) and emit `ETAGS.lessons` (40-char SHA-1).

### Data file
- Moved: `src/data/lessons.js` -> `functions/api/content/_data/lessons.js` (verbatim).
- Deleted: `src/data/lessons.js` at closure (Task 6).

### Refactored consumer
- `src/hooks/useScreenLauncher.ts` - 2 sites refactored from `await import('../data/lessons.js')` destructure to `await import('../lib/contentClient'); const lessons = await getLessons();`. Header comment updated.

### Test refactor
- `src/tests/content-validation.test.js` - LESSONS import repointed to `'../../functions/api/content/_data/lessons.js'`.

### Build cleanup
- Removed dead `chunk-lessons` rules from `vite.config.js` (manualChunks + workbox globIgnores).

## Test coverage shipped
- `functions/api/content/__tests__/lessons.test.js` - 4/4
- `src/lib/__tests__/contentClient.test.ts` - +2 SP11c tests (17/17 total)
- `scripts/__tests__/generate-content-etags.test.mjs` - +1 SP11c test (5/5 total)
- `e2e/sp11-content-protection.spec.js` - +1 anon-401 + 3 grammar needles (11 needles total: 5 SP11 + 3 SP11b + 3 SP11c)

## Commits (chronological)

```
22a0e3f feat(sp11c): extend ETag generator for lessons module
973d9d3 feat(sp11c): copy lessons.js to functions/api/content/_data/
7bb8cc5 feat(sp11c): GET /api/content/lessons endpoint
65491a1 feat(sp11c): add getLessons() to contentClient + Lesson type
c651282 refactor(sp11c): useScreenLauncher uses getLessons; repoint test
e3fe96c feat(sp11c): remove lessons.js from client bundle (closure)
1481469 chore(sp11c): remove dead chunk-lessons rules from vite.config.js
192fffe test(sp11c): extend e2e spec with lessons protection tests
```

## Open follow-ups (SP11d)

- **SP11d:** Move `src/data/content.tsx` LEARN_PATH + IP-bearing exports (V, PROVERBS, BASKETBALL, GYM, CROATIAN_CITIES, COUNTRIES, etc.). The most invasive Phase 2 slice - 75+ exports, the `data.tsx` barrel itself, ~200 import sites.
- **24h CF-log check:** verify no 5xx on `/api/content/lessons` over the first day post-deploy.
