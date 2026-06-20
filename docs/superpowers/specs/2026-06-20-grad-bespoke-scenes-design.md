# Bespoke Grad Place Hero Scenes — Design

**Date:** 2026-06-20
**Status:** Approved (design); pending spec review → implementation plan
**Task:** Backlog #15 — bespoke flat-illustration hero scenes for every Grad place

## Problem

`PlaceScreen` renders a 150px hero banner at the top of each Grad place. Only
`kavana` has a bespoke scene (`public/images/grad-kavana.svg`); the other five
places (`trznica`, `soba`, `kuhinja`, `ulica`, `trg`) fall back to a flat
tinted-gradient banner (`PlaceScreen.tsx` ~line 161). The result is one polished
place and five placeholders — the town reads as half-finished.

This delivers the five missing scenes in a single cohesive visual system so all
six places read as one illustrated town, with `kavana` as the locked reference.

## Decisions (locked with the user)

1. **Art direction:** flat vector illustration + host portrait overlay — the same
   locked language as the family portraits, authored in-repo as SVG. No AI/photo
   assets; no host drawn into the scene (the existing gold-ringed portrait sits on
   top of an environment scene).
2. **Scope:** `kavana` is the reference and stays untouched. Build the five missing
   scenes to match it. `trg` gets a host-less town-square scene (no portrait
   overlay, since `place.host === null`).

## Locked visual system (derived from `grad-kavana.svg`)

The reference is `viewBox="0 0 392 158"` (~2.48:1), 2582 bytes, built from flat
primitives (14 `rect`, 8 `polygon`, 5 `ellipse`, 2 `path`, 2 two-stop
`linearGradient`, 2 `line`). Every new scene MUST conform to:

- **Format:** hand-authored flat SVG, `viewBox="0 0 392 158"`, primitives only
  (`rect`/`polygon`/`ellipse`/`path`/`line`). At most simple two-stop linear
  gradients for the background wash — no filters, no embedded raster, no external
  fonts, no script. Rendered into the hero via `objectFit: cover`.
- **Composition bands:** a soft gradient wash across the top (~0–120 of the 158
  height) reading as sky/wall, and a grounded band across the bottom (~120–158)
  reading as counter/floor/cobbles — mirroring kavana's 392×120 + 392×38 split.
- **Two overlay safe zones** (the hero composites these on top — see
  `PlaceScreen.tsx` ~lines 153–210):
  - **Bottom-left portrait zone:** the gold-ringed 56px host portrait sits at
    `padding: 12px 14px`, `align-items: flex-end`. Keep the lower-left ~90×90
    region visually quiet — no key prop there.
  - **Bottom scrim:** `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,30,40,.5))`
    darkens the lower third for the white Playfair title. Keep focal interest in
    the **upper / center-right**; the bottom may be simple/dark.
- **Palette:** warm neutral base + the place's own `tint` (from `places.ts`) as the
  dominant accent, with Croatian red `#D40030` + white as recurring spot accents
  (kavana uses 5 red touches). This red/white thread is what unifies the town.

## The five scene briefs

Each scene: warm base + the listed accent, focal props upper/center-right, quiet
bottom-left, themed to the place's existing `icon`/`blurb`/`host` in `places.ts`.

| Place | id | Host | Scene | Key flat props | Accent |
|---|---|---|---|---|---|
| Markova tržnica | `trznica` | marko (🐟) | Open-air Adriatic market | striped awning, fish on ice, produce crates, thin sea/horizon sliver | green `#5d8c62` + red/white awning |
| Kovačeva soba | `soba` | kovac (📚) | Quiet scholar's study | bookshelf, desk + warm lamp glow, globe, window | violet `#7c3aed` spines/lamp |
| Bakina kuhinja | `kuhinja` | baka (🍲) | Warm hearth kitchen | stove, hanging pots, herb bunches, steaming pot | terracotta `#c2410c` + red gingham |
| Ivina ulica | `ulica` | ivo (🚕) | City street corner | taxi, storefronts, lamppost, tram line | blue `#2563eb` + red taxi sign |
| Trg | `trg` | — (🎪) | Festival town square | clock tower, fountain, šahovnica bunting, market tents | red `#D40030`; **no portrait overlay** |

`trg` is the games/arcade hub and has no host: it must be legible as a *place*
(not a person's room) and must not leave an awkward empty portrait gap — its
composition fills the bottom-left that the other five reserve for the portrait.

## Production & wiring

- **Pipeline:** a `build_grad_scenes.py` script (sibling to the existing flat-art
  builders) emits the five SVGs to `public/images/grad-{id}.svg`. Keeping a builder
  (rather than free-hand SVG) makes the shared viewBox, palette constants, band
  geometry, and safe zones a single source of truth across all five — the same
  reason the portraits are script-generated. `grad-kavana.svg` is NOT regenerated.
- **Wiring:** extend the `SCENES` map in `PlaceScreen.tsx` with all five ids. Once
  every `PlaceId` resolves to a scene, remove the tinted-gradient fallback branch
  in the hero `background` (no dead path left behind). The same `SCENES` map should
  also be reused by `GradTab.tsx` if/where it renders place thumbnails (verify
  during implementation; out of scope if it does not).

## Verification

- **Unit (new):** `SCENES` covers every `PlaceId` (no place omitted), and
  `PlaceScreen` renders an `<img>` hero — never the gradient fallback — for all six
  place ids, with the portrait overlay present for the five host places and absent
  for `trg`.
- **Asset sanity:** each emitted SVG parses, uses `viewBox="0 0 392 158"`, and
  contains no `<script>`/`<image>`/filter elements (matches kavana's primitive-only
  constraint).
- **Gate:** tsc, eslint, build all clean; full unit suite green.

## Out of scope

- The richer explorable Karta map (backlog #16) — separate spec.
- Animation/parallax on the scenes — static SVG only for now (YAGNI).
- Regenerating or restyling `grad-kavana.svg`.
