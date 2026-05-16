# SP11 — Server-Side Curriculum Migration (Phase 1) — Design

**Date:** 2026-05-15
**Status:** Approved — ready for implementation plan
**Scope:** Phase 1 of a multi-phase content protection effort. Phase 2 (`grammar.js`, `lessons.js`, `content.tsx` LEARN_PATH topics) is tracked as SP11b.

---

## Goal

Remove the highest-IP-density curriculum files — `src/data/gradedStories.js` (2,313 lines, 30 stories) and `src/data/grammar-advanced.js` (~700 lines, 10 B2/C1 grammar units) — from the client JS bundle. Serve their content from Firebase Bearer–gated Cloudflare Pages Functions. Cache per-user in IndexedDB with ETag revalidation.

After this ships, an AI crawler that pulls the JS bundle gets zero curriculum content. The only way to read a story or advanced grammar unit is to authenticate (anonymous Firebase auth works) and call an endpoint that counts against a per-UID daily cap.

## Non-Goals (Phase 1)

- Moving `grammar.js` (A1/A2/B1 units), `lessons.js`, or `content.tsx` LEARN_PATH lesson topics — those are SP11b.
- Cloudflare Turnstile or signed short-TTL URLs.
- WAF rule scoped to `/api/content/*` — Bearer gate is sufficient first defense; WAF deferred.
- Migrating `daily-content.js` word/phrase pools — low IP density, low ROI.
- AI-tab consolidation or paywall — separate work, tracked elsewhere.

## Architecture

```
Client component (StoryOfTheDayCard / GradedInputScreen / ListeningComprehensionScreen / GrammarUnitDetail)
   |
   v
src/lib/contentClient.ts  ── reads IDB cache (if fresh) ──> return cached
   |  (cache miss or stale)
   v
_contentFetch(path) ── _getFirebaseBearer() + If-None-Match ──> /api/content/...
   |
   v
Cloudflare Pages Function ── _verifyToken.getFirebaseUid() ──> 401 if no UID
   |  (authed)
   v
read from bundled _data/ ── compare ETag ──> 304 or 200 + body
   |
   v
Client writes to IDB (etag, body, ts), returns body
```

## Endpoints

| Endpoint | Method | Returns | Caching |
|----------|--------|---------|---------|
| `/api/content/catalog` | GET | `{ stories: StoryCatalogEntry[], grammarUnits: GrammarCatalogEntry[] }` | ETag (1h client TTL) |
| `/api/content/stories/{id}` | GET | `Story` (paragraphs, vocab, quizzes) | ETag (24h client TTL) |
| `/api/content/grammar-units/{id}` | GET | `GrammarUnit` (forms, examples, drills) | ETag (24h client TTL) |

All three require valid Firebase Bearer; return 401 otherwise.

## File Layout

### Server-side (Cloudflare Pages Functions)

```
functions/api/content/
├── _data/
│   ├── gradedStories.js       (moved from src/data/gradedStories.js — verbatim)
│   ├── grammarAdvanced.js     (moved from src/data/grammar-advanced.js — verbatim)
│   └── _etags.js              (auto-generated SHA-1 per resource at prebuild time)
├── _authedRead.js             (shared: getFirebaseUid + ETag + rate-limit + JSON response)
├── catalog.js                 (GET /api/content/catalog)
├── stories/[id].js            (GET /api/content/stories/{id})
└── grammar-units/[id].js      (GET /api/content/grammar-units/{id})
```

### Client-side

```
src/lib/
├── contentClient.ts           (NEW — public API surface; only consumer-facing module)
├── contentCache.ts            (NEW — IndexedDB wrapper)
└── aiPost.ts                  (existing — extract _getFirebaseBearer into shared helper)

src/types/
└── content.ts                 (NEW — Story, StoryCatalogEntry, GrammarUnit, GrammarCatalogEntry)

scripts/
└── generate-content-etags.mjs (NEW — walks _data/, hashes each resource, writes _etags.js)
```

### Component refactors (5 files)

| File | Change |
|------|--------|
| `src/components/home/StoryOfTheDayCard.tsx` | Direct `GRADED_STORIES` import → `getStoryCatalog()` + lazy `getStory(id)` on click; skeleton state |
| `src/components/learn/GradedInputScreen.tsx` | Same pattern; extend existing AI-feedback loading state |
| `src/components/learn/GrammarUnitDetail.tsx` | `GRAMMAR_UNIT_BY_ID` import → `getGrammarUnit(id)` |
| `src/components/practice/ListeningComprehensionScreen.tsx` | `GRADED_STORIES` import → `getStory(id)` |
| `src/data/gradedStories.js`, `src/data/grammar-advanced.js` | **DELETED** at step 6 of rollout |

## Auth and Bundle Hygiene

**Auth:** Firebase Bearer hard-gate, identical to existing `/api/correct`. Reuses `functions/api/_verifyToken.js::getFirebaseUid()`. Anonymous Firebase auth runs on first paint, so legitimate users get a UID before mounting any content consumer. AI crawlers (don't run JS) cannot obtain a UID and are blocked.

**Bundle hygiene:** Files in `functions/api/content/_data/` MUST NOT be imported by any code in `src/`. An e2e bundle-audit test scans the built `dist/assets/*.js` for 5 distinctive needles (story openers, character names, grammar-unit headings) and fails CI if any are found.

## IndexedDB Schema

```
DB:    nh-content-cache
Store: resources
Key:   `uid_${uid}:${type}:${id}`
       Examples: "uid_abc123:story:gs_a1_1", "uid_abc123:grammar:futur_ii", "uid_abc123:catalog:all"
Value: { etag: string, body: any, fetchedAt: number, lastValidatedAt: number }
```

- TTL: revalidate via If-None-Match when `lastValidatedAt > 24h` old.
- Serve-stale-while-revalidate: if revalidation fails (network/429/5xx) and `fetchedAt < 30d`, return cached body.
- Eviction: best-effort cleanup of orphaned `uid_*` namespaces on app start.
- Namespacing by UID protects multi-account devices (sign out + sign in different account = cold cache).

## ETag Generation

`scripts/generate-content-etags.mjs` runs as `prebuild` in `package.json`:

1. Walk `functions/api/content/_data/`.
2. For each story and grammar unit, compute SHA-1 of `JSON.stringify(resource)`.
3. Write `functions/api/content/_data/_etags.js`:

```js
export const ETAGS = {
  stories: { 'gs_a1_1': 'a3f...', 'gs_a1_2': 'b71...', /* ... */ },
  grammarUnits: { 'futur_ii': '4cd...', /* ... */ },
  catalog: 'aggregate-hash'
};
```

Deploy without etags is impossible — prebuild step blocks the build.

## Per-UID Rate Limit

Reuses existing `AI_QUOTA_DB` KV namespace.

```
Key:    content:{uid}:{YYYY-MM-DD}
Value:  { count: number }
TTL:    86_400 seconds
Cap:    CONTENT_DAILY_CAP env var, default 500
```

- Only 200 responses increment the counter (304s and 401s are not billable).
- All rate-limit logic lives in `_authedRead.js` — single source of truth.
- A heavy-use day for a real user is ~80 reads (open every story + every advanced grammar unit + a few revalidations). 500 leaves comfortable headroom and chokes a credentialed scraper.

## Error Contract

| Status | When | Body |
|--------|------|------|
| 200 | Authed + valid ID + ETag mismatch or no If-None-Match | `{ data, etag }` |
| 304 | If-None-Match matches current ETag | empty body, `ETag` header echoed |
| 401 | No Bearer or invalid token | `{ error: "unauthorized" }` |
| 404 | Resource ID not in `_data` | `{ error: "not_found" }` |
| 429 | Daily cap exceeded for UID | `{ error: "rate_limited", retryAt }` |
| 500 | Unexpected | `{ error: "server_error" }` (no stack leakage) |

## Client Error Handling

| Server response | `contentClient.ts` behavior |
|-----------------|------------------------------|
| 200 | Write IDB; return body |
| 304 | Bump cache `lastValidatedAt`; return cached body |
| 401 | Throw `ContentAuthError` — caller shows "Please sign in" toast |
| 404 | Throw `ContentNotFoundError` — caller shows "Story unavailable"; log to Sentry |
| 429 | Return cached body if any (graceful degrade); else throw `ContentRateLimitError` with `retryAt` |
| 500 / network | Return cached body if any; else throw `ContentFetchError`; UI shows retry button |
| Offline (`navigator.onLine === false` OR fetch rejects) | Return cached IDB body without revalidation; if no cache, throw `ContentOfflineError` |

## Anti-Crawler Additions

Append to `public/robots.txt`:

```
# AI scraping disallows (added SP11)
User-agent: GPTBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: Claude-Web
Disallow: /
User-agent: Claude-SearchBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: PerplexityBot
Disallow: /
User-agent: cohere-ai
Disallow: /
```

Add audit comment to `public/sitemap.xml`:

```
<!-- AUDIT 2026-05-15: no /api/content/* paths included (those would 401 anyway) -->
```

## Testing Strategy

### Unit tests (Vitest)

| File | Coverage |
|------|----------|
| `src/lib/__tests__/contentCache.test.ts` | IDB read/write/stale/eviction, UID namespacing, serve-stale-while-revalidate window |
| `src/lib/__tests__/contentClient.test.ts` | 200→cache write, 304→ts bump, 401→ContentAuthError, 429→stale cache fallback, 500→stale cache fallback, offline→stale cache |
| `functions/api/content/__tests__/authedRead.test.ts` | 401 with no Bearer; 200 with valid Bearer; 304 on ETag match; 429 over cap; KV counter increment on 200 only |
| `functions/api/content/__tests__/catalog.test.ts` | Catalog includes every story ID + every grammar unit ID with non-empty ETag |
| `functions/api/content/__tests__/stories.test.ts` | 404 for unknown ID; full body for known ID; ETag header matches `_etags.js` |
| `functions/api/content/__tests__/grammar-units.test.ts` | Same shape as stories test |
| `scripts/__tests__/generate-content-etags.test.mjs` | Deterministic output across runs |

### Component tests (Vitest + Testing Library)

| File | Coverage |
|------|----------|
| `src/components/home/__tests__/StoryOfTheDayCard.test.tsx` | Skeleton while loading; renders on resolve; retry on error; hidden on offline+no-cache |
| `src/components/learn/__tests__/GradedInputScreen.test.tsx` | Loading state; story renders; quiz flow still works |
| `src/components/learn/__tests__/GrammarUnitDetail.test.tsx` | Loading state; unit renders; drill flow still works |
| `src/components/practice/__tests__/ListeningComprehensionScreen.test.tsx` | Loading state; audio flow unchanged |

### E2E (Playwright — new spec `e2e/sp11-content-protection.spec.js`)

1. `GET /api/content/stories/gs_a1_1` with no auth → expect 401.
2. Same request with seeded Bearer (existing `seedAuth` helper) → expect 200 + JSON shape.
3. Story-of-the-Day card on home screen → expect story title visible.
4. `GrammarUnitDetail` for `futur_ii` → expect unit heading visible.
5. **Bundle-source audit:** regex-scan `dist/assets/*.js` for 5 distinctive content needles. Expect zero matches.

### Regression coverage

- SP10's `e2e/sp10-priority-screens.spec.js` (which exercises GradedInputScreen) must still pass.
- All existing component tests on the 4 refactored screens must still pass after import refactor.

## Rollout

Each step is one commit + push. Cloudflare auto-deploys on push to master.

1. Add `functions/api/content/_data/` (verbatim copies) + `_etags.js` generator + prebuild hook. Endpoints exist but nothing calls them.
2. Add `contentClient.ts` + `contentCache.ts` + their unit tests.
3. Refactor `StoryOfTheDayCard` → fetch-based. Validate on prod; watch CF logs for 401/429.
4. Refactor `GradedInputScreen` + `ListeningComprehensionScreen`.
5. Refactor `GrammarUnitDetail`.
6. **DELETE `src/data/gradedStories.js` + `src/data/grammar-advanced.js`.** Bundle-audit test goes green.
7. Append `robots.txt` AI disallows + sitemap audit comment.
8. Acceptance record committed to `docs/superpowers/acceptance/`.

Steps 3–5 ship the wire-up but keep bundle copies as fallback. Step 6 is the real closure. Any prod issue between 3 and 5 reverts cleanly without stranded users or DB rollback.

## Risks

| Risk | Mitigation |
|------|-----------|
| CF Function cold-start latency (~200ms) on first story fetch | Skeleton loading state in all 4 consumers; ETag 304s after first hit are ~30ms |
| Function bundle exceeds CF size limit | ~150KB minified; well under CF's 25MB limit |
| ETag drift between client cache and server | Server is source of truth; client revalidates via If-None-Match; mismatch → 200 with fresh body |
| Firebase anon-auth race on first paint | `_getFirebaseBearer()` already awaits auth-ready promise |
| Increased CF Function invocation cost | Default 500/day per UID cap; IDB cache + ETag 304s minimize billable reads |
| AI crawler runs Chromium + anon-auth | Anon-auth users still rate-limited; if abuse detected, drop cap or add Turnstile (SP11b) |
| Bundle needle test misses content in nested objects | Needles are picked from distinctive prose (story openers, character names), not common words |
| User mid-read when CF deploys a content change | In-flight story in memory; next navigation revalidates and gets new ETag |

## Acceptance Criteria

- [ ] `dist/assets/*.js` after `npm run build` contains zero distinctive story text and zero distinctive grammar-advanced text (e2e bundle audit passes).
- [ ] All 4 consumer screens render content end-to-end with seeded Bearer auth.
- [ ] Anonymous `fetch('/api/content/stories/gs_a1_1')` returns 401.
- [ ] Existing tests on the 4 refactored screens still pass.
- [ ] `public/robots.txt` denies the 9 AI user-agents.
- [ ] CF logs show no 5xx on the new endpoints over the first 24h post-deploy.
- [ ] Acceptance record committed at `docs/superpowers/acceptance/2026-05-15-sp11-acceptance.md`.
