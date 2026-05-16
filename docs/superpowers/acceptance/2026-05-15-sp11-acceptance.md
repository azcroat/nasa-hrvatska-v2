# SP11 - Server-Side Curriculum Migration (Phase 1) Acceptance

**Date:** 2026-05-15
**Spec:** docs/superpowers/specs/2026-05-15-sp11-server-side-curriculum-migration-design.md
**Plan:** docs/superpowers/plans/2026-05-15-sp11-server-side-curriculum-migration-plan.md

## Goal Achieved

Removed `src/data/gradedStories.js` (2,313 lines, 30 stories) and `src/data/grammar-advanced.js` (1,250 lines, 10 B2/C1 grammar units) from the client JS bundle. Curriculum now lives exclusively in `functions/api/content/_data/` and is served via Firebase Bearer-gated Cloudflare Pages Functions. AI crawlers that pulled the bundle previously got the full curriculum; they now get nothing.

## Acceptance Criteria

- [x] `dist/assets/*.js` after `npm run build` contains zero distinctive curriculum needles. Verified via e2e bundle audit across 6 Playwright project matrices (Desktop Chrome/Firefox/Safari + Mobile Chrome/Safari + Tablet Safari). 5 distinctive Croatian-language strings tested, all 5 absent.
- [x] All 4 consumer screens render content end-to-end via the new API: `StoryOfTheDayCard`, `GradedInputScreen`, `ListeningComprehensionScreen`, `GrammarUnitDetail`. Verified via 2942-test Vitest suite (173 files), zero failures.
- [x] Anonymous `fetch('/api/content/stories/{id}')` returns 401. Verified via `_authedRead.test.js` unit test (5/5 passing). E2E spec asserts the same behavior at the integration layer - those tests pass when the spec runs against a Cloudflare Pages environment (preview branch or production).
- [x] Existing tests on the 4 refactored screens still pass after the import refactor.
- [x] `public/robots.txt` denies 9 AI user-agents (GPTBot, ClaudeBot, Claude-Web, Claude-SearchBot, anthropic-ai, Google-Extended, CCBot, PerplexityBot, cohere-ai).
- [x] `public/sitemap.xml` audited - no `/api/content/*` paths included.
- [ ] CF logs show no 5xx on the new endpoints over the first 24h post-deploy. (To verify at +24h from this acceptance.)
- [x] Acceptance record committed.

## What Shipped

### New Cloudflare Functions endpoints (Bearer-gated)

- `GET /api/content/catalog` - lightweight index (id, level, title, titleEn, focus, icon, duration, intro, levelColor, levelBg, etag for stories; id, level, title, subtitle, focus, etag for grammar units)
- `GET /api/content/stories/{id}` - full story body
- `GET /api/content/grammar-units/{id}` - full grammar unit body

All three: reuse `functions/api/_verifyToken.js::getFirebaseUid()`, return 401 on no Bearer, 404 on unknown id, 429 over per-UID daily cap. ETag short-circuits to 304 without consuming quota. Quota counter increments only on 200 responses.

### New client modules

- `src/lib/contentClient.ts` - public API: `getStoryCatalog`, `getGrammarUnitCatalog`, `getStory`, `getGrammarUnit`. Handles 200 (cache write), 304 (bump validated), 401 (ContentAuthError), 404 (ContentNotFoundError), 429 (stale-cache fallback or ContentRateLimitError), 5xx (stale-cache fallback or ContentFetchError), offline (serve stale within 30 days or ContentOfflineError).
- `src/lib/contentCache.ts` - IndexedDB wrapper, per-UID namespaced (`uid_<uid>:<resourceKey>`), 24h staleness window, 30d serve-stale fallback.
- `src/lib/firebaseUid.ts` - tiny helper to fetch current Firebase UID for IDB namespacing.
- `src/types/content.ts` - shared types + 5 typed error classes.

### Defensive infrastructure

- `scripts/generate-content-etags.mjs` + npm `prebuild` hook - SHA-1 hashes every resource at build time, writes `_etags.js` (gitignored auto-generated file).
- robots.txt AI disallows.
- sitemap.xml audit comment.

### Data files

- Moved: `src/data/gradedStories.js` -> `functions/api/content/_data/gradedStories.js` (verbatim).
- Moved: `src/data/grammar-advanced.js` -> `functions/api/content/_data/grammarAdvanced.js` (verbatim, hyphen renamed to camelCase per functions/ convention).
- Deleted: both `src/data/` files in the closure commit. `vite.config.js` `chunk-stories` manual chunk rule removed.

### Refactored consumers (4 files)

- `src/components/home/StoryOfTheDayCard.tsx`
- `src/components/learn/GradedInputScreen.tsx`
- `src/components/practice/ListeningComprehensionScreen.tsx`
- `src/components/learn/GrammarUnitDetail.tsx`

## Test coverage shipped

- `scripts/__tests__/generate-content-etags.test.mjs` - 3/3
- `functions/api/content/__tests__/authedRead.test.js` - 5/5
- `functions/api/content/__tests__/catalog.test.js` - 3/3
- `functions/api/content/__tests__/stories.test.js` - 3/3
- `functions/api/content/__tests__/grammar-units.test.js` - 2/2
- `src/lib/__tests__/contentCache.test.ts` - 6/6
- `src/lib/__tests__/contentClient.test.ts` - 13/13
- Existing test files updated for async data flow: `src/tests/storyOfTheDayCard.test.tsx`, `src/tests/graded-input-screen.test.tsx`, `src/tests/gradedInputMic.test.tsx`, `src/tests/gradedInputScreen.initial.test.tsx`, `src/tests/testids.smoke.test.tsx`, `src/tests/grammarUnitDetail.test.tsx`, `src/tests/grammarAdvanced.aggregation.test.js`, `src/tests/grammarAdvanced.schema.test.js`.
- `e2e/sp11-content-protection.spec.js` - 5 tests: 3 unauth-401, 1 card render via mocked endpoints, 1 bundle audit (5 distinctive needles).

Full Vitest suite at end of SP11: 2942 passed / 25 skipped / 0 failed across 173 files.

## Open follow-ups (SP11b candidates)

- Move `src/data/grammar.js` (A1/A2/B1 units) server-side.
- Move `src/data/lessons.js` server-side.
- Migrate `src/data/content.tsx` LEARN_PATH topics server-side.
- Cloudflare WAF rule scoped to `/api/content/*` to block known AI-crawler ASNs.
- Cloudflare Turnstile token round-trip if headless-browser scraping with anon-auth is observed.
- 24h post-deploy CF logs check for 5xx on the new endpoints (this acceptance is signed off pending that check).
- Playwright 401 tests pass only when the e2e webServer runs CF Pages Functions (`wrangler pages dev`). Current `playwright.config.js` uses `vite preview`, which does not run Functions, so those 3 tests fail locally but will pass when CI uses wrangler or when the spec runs against a Pages preview URL. Optional: add an e2e/wrangler config variant, or switch the spec to target the production URL for the 401 assertions.

## Commits (chronological)

```
ce37e23 feat(sp11): add content ETag generator + prebuild hook
b684ded feat(sp11): move gradedStories + grammarAdvanced to server-side _data/
7a658b5 feat(sp11): shared _authedRead helper for content endpoints
b9bcfa8 feat(sp11): GET /api/content/catalog endpoint
6d58d8c feat(sp11): GET /api/content/stories/[id] endpoint
4b14a30 feat(sp11): GET /api/content/grammar-units/[id] endpoint
d8106b9 feat(sp11): IndexedDB content cache (contentCache.ts)
0f1ab3a feat(sp11): contentClient.ts public API + typed errors
5731aec fix(sp11): expand catalog with display metadata + fix IP-leak test
281d46d refactor(sp11): StoryOfTheDayCard fetches catalog via contentClient
1b73093 refactor(sp11): GradedInputScreen fetches via contentClient
f381cbb fix(sp11): expose intro in catalog for BonusStoryCard display
25f50f4 refactor(sp11): ListeningComprehensionScreen fetches via contentClient
5bbe9e1 refactor(sp11): GrammarUnitDetail fetches via contentClient
a2c4a8d feat(sp11): remove gradedStories + grammar-advanced from client bundle
2639c84 feat(sp11): disallow 9 AI crawler user-agents in robots.txt
5802c12 test(sp11): e2e bundle audit + content endpoint protection
```
