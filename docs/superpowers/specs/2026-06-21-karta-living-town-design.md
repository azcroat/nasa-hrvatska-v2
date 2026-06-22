# Karta — Living Town: calm map hero + roomy place list

**Date:** 2026-06-21
**Status:** Approved (mockups v3 look + v5 layout approved). Ready for implementation plan.
**Context:** Grad (Practice) has a `Popis`/`Karta` toggle. The current `Karta` (`GradMap.tsx`) overlays 6 labeled place markers on a flat town SVG (`GradTownArt.tsx`). The user wants it improved + far more animated, and **rejected a marker-dense composition (v4) as "too compact / not user-friendly."** Approved direction is a calm animated map *hero* over a spacious place *list*.

## Goal

Redesign the `Karta` view into a calm, legible, big-tap-target screen that still expresses "a place, not an app" and tells progress as a story: an **animated living-town hero banner** (the town visibly comes to life as you master places) above a **roomy, scannable list** of the 6 places, led by one clear recommended next step. No crammed markers.

## Locked decisions (brainstorm + mockups)

1. **Layout = map hero + place list** (v5). The map is atmosphere/story, not the tap surface; the list is the navigation. Big rows, calm spacing, matches the Home "calm = gold standard."
2. **Living town / progress as story.** The hero reflects progress: each district's life turns on with that place's mastery (café umbrellas ← Kavana mastered; chimney smoke ← Kuhinja in progress; harbour boats; lit windows). Ambient life (waves, clouds, gulls, ferry, sun-glint, swaying cypress, twinkling windows, waving flag) is always on so the town is never dead.
3. **Motion is the detail.** Richness comes from layered CSS animation, not crammed static elements. The approved v3 golden-hour harbour vista is the art floor.
4. **Hand-built, code-animated SVG**, in-repo. No imported asset. App palette (teal `#0e7490`, terracotta `#c2410c`, stone `#f5f0e8`/`#f6efe0`, red `#D40030`, gold `#C8980A`); Playfair Display + Outfit.
5. **Reduced-motion + Android-safe.** All motion is CSS `@keyframes` under `@media (prefers-reduced-motion: reduce)`. No Framer Motion `initial:{opacity:0}` (Android WebView freeze — see android-webview-gotchas); animate `opacity`/`transform` only.

## The screen (top → bottom, portrait, scrollable)

1. **Hero banner** (~16:11) — the animated golden-hour harbour. No place markers/labels. Slim overlay: title `Naš grad na moru` + a progress line `Tvoj grad oživljava · N / 6 mjesta` ("your town is coming alive — N of 6 places"). A soft top/bottom gradient keeps the overlay text legible.
2. **"Danas" recommended card** — gold-accented: host portrait + recommended line (e.g. `Baka te čeka na Trgu`) + `M fraza · ~K min` + `Idemo →`. The one unambiguous next step; launches `rec.launch()`.
3. **Place list** (`Sva mjesta · all places`) — 6 roomy tap-rows. Each row: tinted place icon, name (Croatian) + English subtitle + host name, a slim progress bar, and a right-side state (due badge `N` / `★` mastered / `🔒` locked) + a chevron. Tapping a row calls `onOpenPlace(id)` → existing PlaceScreen.

## Per-place state (drives both hero life + row state)

From existing `statsByPlace[id] = { done, total, due, lockedCount }` (computed in `gradModel`):

- `available = total - lockedCount`; `completion = available>0 ? done/available : 0`.
- **locked** — `total>0 && lockedCount===total` → row greyed + 🔒; hero district dormant.
- **quiet/new** — `available>0 && done===0` → row, empty bar; hero district dormant.
- **in-progress** — `0<done<available` → row teal bar + due badge; hero district **partial** life.
- **mastered** — `done>=available && due===0` → row gold bar + `★`; hero district **full** life.
- **recommended** — `rec.placeId===id && !locked` → surfaced as the "Danas" card (host + CTA). (Not a map marker.)

Hero life level per place: `dormant` (locked/quiet) → `partial` (in-progress) → `full` (mastered).

## Place ↔ district ↔ host

| Place (id) | Host | District in hero | Life element at mastery |
|---|---|---|---|
| Kavana (`kavana`) | Ana | café terrace on the waterfront | striped café umbrellas appear |
| Tržnica (`trznica`) | Marko | market by the quay | market stall awnings fill in |
| Kuhinja (`kuhinja`) | Baka | upper-tier house | chimney smoke rises |
| Trg (`trg`) | host-of-day | central square / church + zvonik | square figures + lit church/tower windows |
| Ulica (`ulica`) | Ivo | the street | a little taxi appears |
| Soba (`soba`) | — | a quiet house | warm lit window |

(Hosts from `places.ts`; the hero's bell-tower flag, boats, ferry, gulls, clouds, sun-glint, cypress sway are always-on ambient.)

## Architecture / components

- **`GradTownArt.tsx`** — rewritten to the eye-level golden-hour harbour hero. Always-on ambient groups (`#km-waves`, `#km-glint`, boats, `#km-clouds`, `#km-ferry`, `#km-gulls`, `#km-cypress`, flag, twinkle) + **per-district life groups** id'd by place (`#karta-kavana` … `#karta-soba`), each shown at `dormant|partial|full`. New prop `lifeByPlace: Record<PlaceId,'dormant'|'partial'|'full'>`. Pure presentational.
- **`GradMap.tsx`** (the Karta view) — **restructured**: renders the hero (`GradTownArt`) + progress line + the `Danas` card + the place list. **Removes the absolute-positioned marker overlay.** Computes `lifeByPlace`, the recommended card, and per-row state from `statsByPlace`/`rec`. Same props (`rec`, `statsByPlace`, `onOpenPlace`).
- **`places.ts`** — `mapPos` is no longer used by the Karta (district life is authored into the hero art); leave it unless unused elsewhere, then remove in cleanup. Everything else unchanged.
- **Animation** stays in an inline `<style>` (CSS keyframes), reduced-motion-gated, extended with the ambient + per-district keyframes + the `recoGlow` pulse on the Danas card.

## Data flow

`GradTab` → `GradMap({ rec, statsByPlace, onOpenPlace })` (unchanged) → derives `lifeByPlace` (hero) + recommended (Danas card) + per-row state (list) → renders hero + card + list. Row tap → `onOpenPlace(id)`; card → `rec.launch()`. No model/data-layer change.

## Popis / toggle relationship

The redesigned `Karta` now contains a place list, so it overlaps the plain `Popis`. **In scope:** keep the existing `Popis`/`Karta` toggle as-is; `Karta` becomes this hero+list. **Out of scope (flag as follow-up):** whether to simplify/merge the toggle later — not decided here.

## Testing

- **Unit:** keep the no-orphan place-mapping gate (`grad.test.ts`). New `GradMap`/`GradTownArt` tests: given `statsByPlace`, hero `lifeByPlace` levels are correct; each place row renders correct state (mastered `★` + full bar; in-progress bar+due; `marker-locked`/🔒 for locked); the `Danas` card shows the recommended host + launches `rec.launch()`; progress line shows `N / 6`.
- **Reduced-motion:** assert the media query disables animation.
- **E2E (`map-smoke`):** update for the new structure — `grad-map` renders, the Danas CTA launches, place rows are tappable (`onOpenPlace`). Keep fixtures (`enterPlace`/`openArcade`; exact place-name match — "Trg" vs "…na Trgu").
- **Gate:** tsc 0, eslint 0, build 0, full `npx vitest run` green, `lint:croatian` clean. Run the FULL suite + grep all test files for count/marker couplings before pushing.

## Scope

**In scope:** rewrite `GradTownArt` to the animated living hero; restructure `GradMap` to hero + Danas card + roomy list (remove marker overlay); per-district life gated by mastery; ambient motion; tests; e2e update. **Out of scope:** Popis list internals; PlaceScreen; any data/model/exercise-mapping change; a Map-of-Croatia country map; imported illustrator assets; merging the Popis/Karta toggle.

## Non-goals / risks

- Don't regress the no-orphan mapping or break `map-smoke` (it asserts marker testids today → must be updated, not deleted).
- Keep markup lean for mobile; cap concurrent animations; everything no-ops under reduced-motion.
- Preserve the existing `GradMap` props so `GradTab` is untouched.
