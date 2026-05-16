# SP11b - Grammar Module Server-Side Migration Acceptance

**Date:** 2026-05-15
**Spec:** docs/superpowers/specs/2026-05-15-sp11b-grammar-server-migration-design.md
**Plan:** docs/superpowers/plans/2026-05-15-sp11b-grammar-server-migration-plan.md

## Goal Achieved

Removed `src/data/grammar.js` (3,347 lines, 13 named exports: PADEZI, GRAM, CONJ, MODAL, TENSES, ASPECT, ASPECT_PAIRS, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, PHONOLOGY, PITCH_ACCENT, PADEZI_FULL) from the client JS bundle. Grammar curriculum now served via Bearer-gated `GET /api/content/grammar`. 18 React components consume via `useGrammar()` hook; 2 non-component files (`useScreenLauncher.ts`, `appData.ts`) use `contentClient.getGrammar()` directly.

Combined with SP11, nearly all A1-C1 instructional curriculum has moved server-side. Remaining still-bundled curriculum: `src/data/lessons.js` (SP11c) and `src/data/content.tsx` LEARN_PATH + IP exports (SP11d).

## Acceptance Criteria

- [x] `dist/assets/*.js` after `npm run build` contains zero distinctive grammar.js needles (3 new needles in e2e bundle audit, all absent - verified via direct grep on dist).
- [x] All 18 consumer screens render via `useGrammar()` with mocked hook in test.
- [x] Anonymous `fetch('/api/content/grammar')` returns 401 (covered by `functions/api/content/__tests__/grammar.test.js` 4/4).
- [x] `useGrammar()` hook passes all dedupe + cache + error tests (6/6).
- [x] Existing SP11 endpoints (catalog, stories, grammar-units) continue to work unchanged.
- [x] Full Vitest suite remains at or above 2942 tests, zero failures (latest measured: 2955 / 25 skipped / 0 failed).
- [x] `src/data/grammar.js` deleted; `src/data/content.tsx` no longer imports or re-exports grammar constants.
- [ ] CF logs show no 5xx on `/api/content/grammar` over the first 24h post-deploy (verify at +24h from this acceptance).
- [x] Acceptance record committed.

## What Shipped

### New endpoint (Bearer-gated)

- `GET /api/content/grammar` - returns all 13 named exports as one JSON payload (~80KB minified, ~15KB gzipped). One ETag for the whole module. Reuses `_authedRead.js` from SP11 for auth + ETag + per-UID rate-limit (shared cap with SP11 content endpoints).

### New client modules

- `src/hooks/useGrammar.ts` - React hook with module-level dedupe via `useSyncExternalStore` + shared `_inflight` promise. Multiple components mounting simultaneously share one fetch.
- Extended `src/lib/contentClient.ts` with `getGrammar(): Promise<Grammar>`.
- Extended `src/types/content.ts` with `Grammar` interface (loose `Record<string, unknown>` fields - consumers narrow locally).

### ETag generator

- Extended `scripts/generate-content-etags.mjs` to walk the third resource (`functions/api/content/_data/grammar.js`) and emit `ETAGS.grammar` (40-char SHA-1).

### Data file

- Moved: `src/data/grammar.js` -> `functions/api/content/_data/grammar.js` (verbatim).
- Deleted: `src/data/grammar.js` at closure (Task 7). `src/data/content.tsx` no longer imports or re-exports the 13 grammar identifiers.

### Refactored consumers (20 files)

18 React component files now use `useGrammar()`:
- `src/components/learn/AspectScreen.tsx`, `BrowseContentModal.tsx`, `ConditionalScreen.tsx`, `FormalRegisterScreen.tsx`, `GrammarRef.tsx`, `ImpersonalScreen.tsx`, `LessonScreen.tsx`, `ModalScreen.tsx`, `NewLessons.tsx`, `PadezifullScreen.tsx`, `PadeziScreen.tsx`, `PhonologyScreen.tsx`, `PronunciationCourse.tsx`, `TensesScreen.tsx`, `VocabScreens.tsx`
- `src/components/practice/AspectDrillScreen.tsx`, `ConjugationDrill.tsx`, `PitchAccentScreen.tsx`

2 non-component files use `contentClient.getGrammar()`:
- `src/hooks/useScreenLauncher.ts` (dynamic GRAM destructure replaced)
- `src/lib/appData.ts` (re-export shim trimmed)

Plus stale comment cleanup in `src/components/AppRouter.tsx`.

## Test coverage shipped

- `functions/api/content/__tests__/grammar.test.js` - 4/4
- `src/hooks/__tests__/useGrammar.test.tsx` - 6/6
- `src/lib/__tests__/contentClient.test.ts` - +2 SP11b tests (15/15 total)
- `scripts/__tests__/generate-content-etags.test.mjs` - +1 SP11b test (4/4 total)
- Test files updated for the hook-mock pattern: `pitchAccent.contract.test.tsx`, `aspect-drill.test.tsx`, `aspectDrillContract.test.tsx`, `conjugation-drill.test.tsx`, `lesson.test.tsx`, `content-validation.test.js`
- `e2e/sp11-content-protection.spec.js` extended with 3 grammar needles (total 8) + anon-401 + mocked AspectDrill render

Full Vitest suite at SP11b end: 2955 passed / 25 skipped / 0 failed across 175 files.

## Commits (chronological)

```
93c2cea docs(sp11b): implementation plan (13 tasks, TDD)
04f22d1 feat(sp11b): extend ETag generator for grammar module
e2f4ba5 feat(sp11b): copy grammar.js to functions/api/content/_data/
1c06119 feat(sp11b): GET /api/content/grammar endpoint
c04c050 feat(sp11b): add getGrammar() to contentClient + Grammar type
9dc0148 feat(sp11b): useGrammar React hook with module-level dedupe
b1ccc0d refactor(sp11b): batch 1 - single-export grammar screens use useGrammar()
15dbe42 refactor(sp11b): batch 2 - more single-export grammar screens
e3a722f refactor(sp11b): batch 3 - practice + reference grammar screens
ed0e9d6 refactor(sp11b): batch 4 - multi-export + complex grammar screens
c2da3f2 refactor(sp11b): batch 5 - useScreenLauncher uses getGrammar, trim appData
bd3c68c feat(sp11b): remove grammar.js from client bundle (closure)
68587fb test(sp11b): extend e2e spec with grammar protection tests
```

## Open follow-ups (SP11c / SP11d)

- **SP11c:** Move `src/data/lessons.js` (4,796 lines, single `LESSONS` array) server-side. Same architecture extends - one bulk endpoint, useLessons hook, IDB cache. ~10-12 tasks expected.
- **SP11d:** Move `src/data/content.tsx` LEARN_PATH + IP-bearing exports (V, PROVERBS, BASKETBALL, GYM, CROATIAN_CITIES, COUNTRIES, etc.). Larger effort - 75+ exports, the barrel itself, ~200 import sites. The most invasive of the Phase 2 efforts.
- **24h CF-log check:** verify no 5xx on `/api/content/grammar` over the first day post-deploy.
- **Task 8 quirk:** the e2e spec's anon-401 + mocked-render tests require the Playwright webServer to run Cloudflare Pages Functions (e.g., `wrangler pages dev`). Current `playwright.config.js` uses `vite preview` which serves static dist only. Same limitation flagged in SP11 acceptance - both specs work when the server emulates CF Functions, fail gracefully otherwise. Bundle audit (the highest-value assertion) is unaffected.
- **Closure-commit oddity:** Task 8's implementer agent hung on Playwright runtime and exited without committing. Controller verified bundle audit needles manually via direct `grep` on dist (all 8 absent) and committed the spec edit on the agent's behalf (commit `68587fb`).
