# Gamification G1b — Map of Croatia Design Spec

**Date:** 2026-05-31
**Status:** Approved (design confirmed with user)
**Parent:** `docs/superpowers/specs/2026-05-30-gamification-arcade-design.md` (§3)

## Goal
The persistent **solo collection layer**: a Map of the user's heritage regions that visibly grows as they learn — the "always a reason to open it" hook that doesn't depend on a sibling. Restored regions accumulate; nothing ever resets.

## Decisions (locked)
- **Regions:** reuse the existing 10 keys in `src/data/cultural/regions.js` `REGIONS` (labin, bibinje, hercegovina, vukovar, vinkovci, zagreb, split, mostar, tomislavgrad, knin). Each already has `title`, `sub`, `icon`, `color`. No new data.
- **Restore trigger:** **cumulative total XP milestones.** Regions restore in a fixed order as `stats.xp` crosses thresholds. Region 1 (Labin — "Your New Home") is restored from the start. XP comes from *any* activity (lessons, drills, Alka rides), so the map advances no matter what the user plays. Reuses the already-synced `stats.xp` — no new tracking, inherently progress-protected (XP only grows).
- **Visual (v1):** a stylized **region-tile grid** in the premium navy/gold register — restored tiles show icon + title (full colour), locked tiles dimmed with 🔒 and their XP requirement. A "N / 10 regions restored" progress bar and a "Next: <region> in <X> XP" hint.
- **Placement:** a prominent **"Your Croatia" card at the top of the Arcade hub** (shows N/10) that opens the Map screen — not buried. (A Home-tab hook is deferred to a later phase.)
- **Out of scope (v1):** a geographic SVG map, per-region detail/drill-in, Home-tab hook, tying restoration to specific region content (that was the rejected "master region content" option).

## Architecture
- **Pure module** `src/lib/gamification/mapRegions.ts` — the ordered region→XP-threshold table + pure functions (`regionStatuses(xp)`, `restoredCount(xp)`, `nextRegion(xp)`). Zero UI/data deps beyond the threshold table → fully unit-testable.
- **Component** `src/components/practice/MapScreen.tsx` — reads `stats.xp` (StatsContext) + `REGIONS` (static import for title/icon/color), renders the grid from `regionStatuses(xp)`. Premium register.
- **Routing** — new `currentScreen === 'map'` route in `AppRouter.tsx`.
- **Entry** — `ArcadeHub.tsx` gains a top "Your Croatia" card → `onLaunch('map')`.
- **Guard** — extend `src/tests/arcade-routes.test.ts` to assert `'map'` resolves to a real route (dead-lesson protection).

## XP thresholds (ordered)
labin 0 · split 400 · zagreb 1000 · bibinje 1800 · vukovar 3000 · vinkovci 4500 · knin 6500 · mostar 9500 · tomislavgrad 13000 · hercegovina 18000. (Spread across the A1→C2 XP curve; final region aligns with C2.)

## Testing
- Pure-module unit tests (thresholds monotonic; xp=0 → exactly Labin; xp≥18000 → all 10; `restoredCount`/`nextRegion` boundaries).
- MapScreen render test (restored vs locked tiles, progress count) with mocked stats.
- Route-guard test asserts `'map'` routes.
- Full local gate (tsc + vitest + lint + build) + browser smoke before any push.

## Constraints carried
Premium heritage register (no kiddy skin), no paywall, never destroy progress, prominent placement.
