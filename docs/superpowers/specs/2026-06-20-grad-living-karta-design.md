# Living Grad Karta Map — Design

**Date:** 2026-06-20
**Status:** Approved (design); pending spec review → implementation plan
**Task:** Backlog #16 — richer, "explorable" Grad Karta map

## Problem

The Karta (`GradMap.tsx`) is a static `grad-town.svg` image with marker pills
positioned by each place's `mapPos`, a gold glow + count badge on the
recommended place, and a floating "Today" bar. It is a pretty menu, not a
living surface — it tells you nothing about how you're doing per place, and the
town doesn't move.

## Decisions (locked with the user)

1. **Direction: a living map of your progress.** Single screen, same town (no
   pan/zoom, no new screen). The town animates subtly and every marker mirrors
   your standing per place.
2. **Marker progress UI: completion ring + due badge + lock state.**
3. **Host on map: the recommended place's *own* host** stands beside it (Ana at
   her kavana, not an independent rotating host-of-day). If the recommended
   place has no host (`trg`), it glows only — no portrait.

## Data (already available)

`gradModel.placeStats(placeId, ctx)` returns `{ total, done, due, lockedCount }`
per place. `GradMap` currently receives only `{ due, total }` and drops `done`
and `lockedCount`. Derived per place:

- `available = total - lockedCount`
- `completion = available > 0 ? done / available : 0` (clamp 0..1)
- `isLocked = total > 0 && lockedCount === total` (nothing at the user's level yet)
- `isMastered = available > 0 && done >= available && due === 0`

`recommendedVisit(ctx)` returns the `Recommendation` (`placeId`, copy, `count`,
`launch`). The recommended place's own host is `PLACES.find(p => p.id ===
rec.placeId)?.host` (may be `null` for `trg`), rendered via `CharacterPortrait`.

## Design

### 1. Marker: completion ring + due badge + lock

Each place marker (the existing white pill with icon disc + name + stem/dot)
gains:

- **Completion ring:** a thin circular ring around the 28px icon disc, filled
  proportionally to `completion` (an SVG `<circle>` with `stroke-dasharray`).
  Empty ring = not started; full ring = all available items done. When
  `isMastered`, the ring is gold and a small ✓ replaces/overlays nothing
  destructive (ring full + gold is the mastery signal).
- **Due badge:** the existing count badge generalizes — show a red `●N` badge
  (top-right of the disc) whenever `due > 0` for that place, not only on the
  recommended one. The recommended place keeps its gold glow.
- **Locked state:** when `isLocked`, the marker is dimmed (reduced opacity) with
  a 🔒 and no glow/ring fill. It stays tappable — opening it shows PlaceScreen's
  locked teasers (consistent with how locked items already render). It never
  shows a due badge.

Precedence on a marker: locked overrides all; otherwise show ring + (due badge
if any) + (recommended glow if recommended).

### 2. Host at the recommended place

The recommended place additionally renders a small (~34px) gold-ringed
`CharacterPortrait` of that place's own host, positioned beside the marker,
reinforcing the gold glow and the Today bar. Absent when `rec` place has no
host (`trg`) or no recommendation exists.

### 3. Ambient life (animation)

To animate parts of the town, **inline `grad-town.svg` into the component**
(today it is an `<img>`, which cannot animate its internals). Add stable `id`s
to the animatable layers in `grad-town.svg` and drive them with **CSS only**:

- gentle **sea shimmer** (slow opacity/translate on a wave layer),
- **flag flutter** (small skew/rotate on flag shapes),
- **chimney smoke** (slow rise + fade),
- keep the existing recommended-place gold pulse.

Constraints: **CSS animations only** (no Framer — avoids the known Android
WebView freeze); **`@media (prefers-reduced-motion: reduce)` disables all
ambient motion** (town fully static); animations are lightweight and pure
transform/opacity. The inlined SVG keeps `viewBox="0 0 392 690"` and the
markers stay positioned by `mapPos` percentages as today.

### 4. Plumbing

- Extend `GradMap`'s `statsByPlace` to carry the full per-place shape
  `{ done, total, due, lockedCount }` (superset of today's `{ due, total }`),
  and pass the recommended place's host (derived in `GradMap` from `rec.placeId`
  + `PLACES`, so the caller contract barely changes).
- Update the `GradTab` caller to provide the richer `statsByPlace` (it already
  computes `placeStats` per place; pass the full result instead of a subset).
- `grad-town.svg` gains `id`s on its sea / flag / smoke layers; no visual change
  to its static appearance.

## Verification

- **Unit (`GradMap.test.tsx`, extended):**
  - completion ring reflects `done/available` (e.g., a place with done=3,
    total=4, locked=0 renders a partially-filled ring; done=available renders
    full/mastered);
  - a due badge appears only when `due > 0`;
  - a fully-locked place (`lockedCount === total`) renders dimmed with 🔒, no
    glow, no due badge, but is still a clickable button;
  - the recommended place renders its own host portrait
    (`portrait-{host}`); a host-less recommended place (`trg`) renders none;
  - reduced-motion: ambient animation classes are gated by the media query
    (assert the static structure renders without requiring motion).
- **Existing `GradMap.test.tsx`** assertions stay green.
- **Gate:** tsc, eslint, build, full unit suite green.

## Out of scope

- Pan/zoom or a larger-than-screen canvas (rejected — living, not explorable-canvas).
- Discoverable easter-egg landmarks beyond the 6 places.
- Changing `recommendedVisit` logic or the Today bar copy.
- New bespoke map art beyond adding `id`s to existing `grad-town.svg` layers.
