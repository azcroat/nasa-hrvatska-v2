# SP11e — Content Migration Final Closure Acceptance

**Date:** 2026-05-16
**Spec:** `docs/superpowers/specs/2026-05-16-sp11e-final-closure-design.md`
**Plan:** `docs/superpowers/plans/2026-05-16-sp11e-final-closure-plan.md`

## Goal Achieved

Yes. SP11e closes the final IP-exfiltration slice. All 5 remaining names (V composition, PROVERBS, CROATIAN_CITIES, LEARN_PATH, SEASONAL_CAMPAIGNS) now ship from `/api/content/core` instead of the client bundle. The function-valued exports survived JSON serialization via a JSON DSL: `LEARN_PATH` item predicates collapsed to `{ anyOf: [{ ctIncludes | vsIncludes | lcAtLeast | gcAtLeast | xpAtLeast | spAtLeast }] }` (with nested `allOf` for the `lp66` case), and `SEASONAL_CAMPAIGNS` Easter's `dynamicWindow` became `{ windowKind: 'easterRelative', windowOffsets: [-7, 1] }` resolved client-side by an 8-line pure-algorithm `easterSunday()`.

Net result: `dist/assets/*.js` contains zero hits for any of the 5 SP11e needles after `npm run build`. Combined with SP11d, **27 high-IP-density names** now live behind the Bearer-gated single endpoint.

## Acceptance Criteria

- [x] `/api/content/core` returns 27 fields (existing 25 + LEARN_PATH + SEASONAL_CAMPAIGNS).
- [x] `LEARN_PATH[*].ckRule` is well-formed; `evalCk()` snapshot-matches the deleted `ck` functions for representative stats objects (17 unit tests cover all 6 leaf kinds + anyOf/allOf combinators + lp66/lp70 real-shape cases + 5 edge cases).
- [x] `SEASONAL_CAMPAIGNS[easter].windowKind === 'easterRelative'`; `resolveCampaignWindow()` produces the same date range as the deleted `dynamicWindow(year)` for years 2024–2028 (13 unit tests cover Easter math + windowKind branches + active-window edge cases).
- [x] `dist/assets/*.js` contains **zero** matches for the 5 SP11e needles:
  - `lp_listen_basics`
  - `Train your ear — listen to basic Croatian phrases`
  - `Learn Easter traditions — pisanice, lamb, holiday greetings`
  - `Celebrate Midsummer with bonfire traditions and Croatian folklore`
  - `dynamicWindow`
- [⚠️] `src/data/{cultural,scenarios,vocabulary}.js` **retained** — scope corrected from the original spec. `V_B2` / `V_C1` (advanced-vocab tiers) are still consumed by `AdvancedVocabScreen.tsx`, and the spec's own non-goals list defers V_B2/V_C1 to "a separate future SP". Deleting those files would break the consumer; future SP can migrate the advanced tiers.
- [x] All 5 LEARN_PATH consumers refactored: `LearnTab.tsx`, `profile/LearnPath.tsx`, `HomeTab.tsx`, `useScreenLauncher.ts` (no usage — comments only), `usePlacement.ts` (lazy `contentClient.getContent()`). `App.tsx` self-healing also switched.
- [x] Daily-picker consumers refactored: `CityOfDayScreen.tsx`, `DiscoverTab.tsx` (use `getCityOfDay(content.CROATIAN_CITIES)`). `useAward.ts` consumes `getActiveCampaign(content.SEASONAL_CAMPAIGNS)` and passes the multiplier into `lXPgain`.
- [x] **38 new unit tests** pass (was planned 24): 17 `learnPathRules` + 13 `seasonalCampaign` + 8 `dailyPickers`. Server-side `core.test.js` extended with 4 SP11e cases (+2 ETag generator cases).
- [x] Existing tests unchanged; `hooksExtra.test.ts` mock updated to use `contentClient` instead of the deleted `data` import.
- [x] Anonymous `GET /api/content/core` still returns 401.
- [ ] **24h CF logs check** for `/api/content/core` 5xx — verify at T+24h (2026-05-17 ~18:30 CDT).
- [x] Acceptance record committed.

## What Shipped

### Server-side (commits 6ca98e2, 2e1341b, 986123e, 03e3bf3, 0bbbfed)
- New data modules:
  - `functions/api/content/_data/learnPath.js` — 97 items, 7 levels, ckRule JSON DSL
  - `functions/api/content/_data/seasonalCampaigns.js` — 4 campaigns, windowKind discriminator
- Extended aggregator:
  - `functions/api/content/_data/core.js` — switched from re-export-only to import-then-compose, V composition runs at module load
- Endpoint handler:
  - `functions/api/content/core.js` — KEYS extended from 25 → 27 (critical bug catch: handler still capped at 25 even after aggregator was extended)
- ETag generator:
  - `scripts/generate-content-etags.mjs` — CORE_KEYS includes LEARN_PATH + SEASONAL_CAMPAIGNS
- Server-side tests:
  - `functions/api/content/__tests__/core.test.js` — +4 SP11e tests (ckRule shape, windowKind discriminator, V composition applied, V B2 aliases resolved)
  - `scripts/__tests__/generate-content-etags.test.mjs` — +2 SP11e tests (LEARN_PATH-bytes-change → ETag-change; SEASONAL_CAMPAIGNS-bytes-change → ETag-change)

### Client utility modules (commits dc0e3d3, 2ba883e, d092e43)
- `src/lib/learnPathRules.ts` — `evalCk(rule, stats)` interpreter for the 6-leaf DSL + `anyOf`/`allOf` recursion. Forward-compat: unknown leaf kinds → false.
- `src/lib/seasonalCampaign.ts` — `easterSunday` (Meeus/Jones/Butcher, unchanged), `resolveCampaignWindow`, `getActiveCampaign(campaigns)`
- `src/lib/dailyPickers.ts` — `getProverbOfDay`, `getCityOfDay`, `getHistFact` parameter-passing refactor (year-seeded Fisher-Yates preserved for getCityOfDay)
- 38 unit tests (17 + 13 + 8) covering all leaf kinds, combinators, real predicate shapes (lp66, lp70), and edge cases (undefined, null, missing arrays).

### Type layer (commit 1e79681)
- `src/types/content.ts` — `Content` interface extended with `LEARN_PATH: LearnPathLevel[]` and `SEASONAL_CAMPAIGNS: SeasonalCampaign[]`. Top-level `import type` per project ESLint config.

### Client consumer refactor (commits 8887131, 48ceabe)
- LEARN_PATH consumers: 5 files now read via `useContent` + `evalCk(item.ckRule, stats)`.
- Daily-picker consumers: 2 screens now call `getCityOfDay(content.CROATIAN_CITIES)`.
- `useAward.ts`: campaign multiplier resolved via `useContent + getActiveCampaign` and passed to `lXPgain(amt, activeMultiplier)`. `lXPgain` itself no longer reads the deleted module-level SEASONAL_CAMPAIGNS.
- `usePlacement.ts` + `App.tsx` self-healing: lazy-load `contentClient.getContent()` instead of `import('./data')`.
- `hooksExtra.test.ts` mock pivoted to `contentClient`.

### Client deletions + E2E (commit 7a07ebc)
- `content.tsx`: deleted V composition (TOP100 spread + B2 aliases + 7 topic aliases), 3 daily-picker helpers, LEARN_PATH array, 6 barrel exports, unused destructures. **3438 → 2162 lines (-1277).**
- `appUtils.ts`: deleted SeasonalQuest/SeasonalCampaign interfaces, easterSunday, SEASONAL_CAMPAIGNS array, getActiveCampaign. **850 → 716 lines (-134).**
- `appData.ts`: dropped 2 re-exports.
- `e2e/sp11-content-protection.spec.js`: +5 SP11e needles. All 18 NEEDLES verified zero hits.

## Production Incident (resolved)

**Crash:** HomeTab `Cannot read properties of undefined (reading 'items')` — Sentry, 2026-05-16 17:44 CDT.

**Root cause:** After commit 8887131 (Task 10 — LEARN_PATH consumer refactor), HomeTab's `pathData` useMemo read `LEARN_PATH[LEARN_PATH.length - 1]!.items` to derive the fallback active level. When `useContent` hadn't hydrated yet, `LEARN_PATH` was `[]`, and `LEARN_PATH[-1]!` evaluates to `undefined`. Reading `.items` on undefined crashed render.

**Fix:** Commit 48ceabe added a placeholder-level fallback (`{ level: 1, title: '', items: [] }`) and guarded the pct division against zero. Production fix went live ~30 minutes after the crash.

**Lesson:** When a hydration boundary moves from synchronous module-import (legacy) to async hook (`useContent`), defensive guards have to come with the refactor. Should have been caught in spec compliance review for Task 10. Recorded as a controller note for similar future migrations.

## Commits (chronological)

```
6ca98e2 feat(sp11e): server-side LEARN_PATH with ckRule JSON DSL (97 items, 7 levels)
2e1341b feat(sp11e): server-side SEASONAL_CAMPAIGNS with windowKind discriminator
986123e feat(sp11e): extend core.js aggregator with V composition + LEARN_PATH + SEASONAL_CAMPAIGNS
03e3bf3 feat(sp11e): extend ETag generator for LEARN_PATH + SEASONAL_CAMPAIGNS
0bbbfed feat(sp11e): /api/content/core returns 27 fields + 4 new tests
dc0e3d3 feat(sp11e): client interpreter for LEARN_PATH ckRule DSL + 17 tests
2ba883e feat(sp11e): client easterSunday + resolveCampaignWindow + getActiveCampaign + 13 tests
d092e43 feat(sp11e): parameter-passing daily pickers (proverb/city/histFact) + 8 tests
1e79681 types(sp11e): extend Content interface with LEARN_PATH + SEASONAL_CAMPAIGNS
8887131 refactor(sp11e): 5 LEARN_PATH consumers use useContent + evalCk
48ceabe fix(sp11e): HomeTab crash on empty LEARN_PATH + Task 11 daily-picker refactor
7a07ebc feat(sp11e): strip legacy LEARN_PATH + SEASONAL_CAMPAIGNS from client
```

12 commits, all on master, all pushed.

## Open Follow-ups

- **24h CF 5xx check** for `/api/content/core` (verify 2026-05-17 ~18:30 CDT). Same monitoring task carried forward from SP11/11b/11c/11d.
- **V_B2 / V_C1 orphans** — still bundled via `AdvancedVocabScreen.tsx`. Per SP11e design, this is an explicit non-goal (separate future SP). The relevant `src/data/{cultural,scenarios,vocabulary}.js` files were intentionally retained.
- **E2E flakes** — SP6 CorrectionDiff a11y, AIConversation back-nav, Croatia History nav. Pre-existing, not from SP11e. Tracked in the consolidated follow-up backlog.
- **Plan staleness lesson** — the original plan estimated 75 LEARN_PATH items with 3 DSL leaf shapes. Actual was 97 items requiring 6 leaf shapes + `allOf` nesting. The implementer correctly halted at Task 1 and surfaced the gap, allowing the controller to expand the DSL before writing the interpreter. The plan should always include a pre-flight verification step.

## What's now possible (and what isn't)

A legitimate signed-in user can still inspect Network → `/api/content/core` and see the full curriculum payload — that's the inherent limit of a public-facing language-learning app. SP11e closes the **bundle leakage**: someone who's never registered cannot pull the curriculum just by reading the public JS. They have to register (Turnstile-gated as of 2026-05-16), authenticate via Firebase, and accept rate-limit + per-user quota. Combined with AI Labyrinth and the perimeter defenses in `knowledge_nh_cf_security_posture.md`, this raises the cost of competitive content theft from "trivial" to "real engineering work with a paper trail."
