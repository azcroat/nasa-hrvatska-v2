# Bespoke Grad Place Hero Scenes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Grad place a bespoke flat-illustration hero scene so all six places read as one illustrated town (kavana is the locked reference).

**Architecture:** Hand-author five committed flat SVGs in `public/images/` (matching the two existing ones, `grad-kavana.svg` and `grad-town.svg`), then wire them into `PlaceScreen`'s `SCENES` map and remove the tinted-gradient fallback. No build tooling.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, plain committed SVG assets.

## Reconciliation with the spec

The approved design (`docs/superpowers/specs/2026-06-20-grad-bespoke-scenes-design.md`) proposed a `build_grad_scenes.py` pipeline "sibling to existing flat-art builders." **There are no committed Python build scripts in this repo** — `grad-kavana.svg` and `grad-town.svg` are hand-authored committed assets. This plan therefore hand-authors the five SVGs directly (repo-consistent, no new toolchain). The **visual system and the five scene briefs are unchanged** — only the production method differs. `grad-town.svg` is the Karta map backdrop (viewBox 392×690, used by `GradMap.tsx`), NOT a place hero, so Trg still needs its own hero scene.

## Global Constraints

Every new scene asset MUST satisfy (copied from the spec's locked visual system):

- Flat SVG, root `viewBox="0 0 392 158"` and `preserveAspectRatio="xMidYMid slice"` (exactly matching `grad-kavana.svg`).
- Primitives only: `rect`/`polygon`/`ellipse`/`path`/`line`/`circle`, plus `<defs>` with at most simple 2-stop `linearGradient` washes. **No** `<script>`, `<image>`, `<foreignObject>`, `<filter>`, `<use href>` to external, or embedded raster/base64.
- Composition: gradient wash top band (y ≈ 0–120) + grounded bottom band (y ≈ 120–158).
- Overlay safe zones: keep the **bottom-left ~90×90** (x < 100, y > 110) visually quiet (portrait sits there); keep focal interest **upper / center-right**; the bottom third is darkened by the hero scrim so it may be simple/dark.
- Palette: warm neutral base + the place's `tint` (from `places.ts`) as dominant accent + Croatian red `#D40030` and white as recurring spot accents.
- Files are committed to `public/images/grad-{id}.svg`. `grad-kavana.svg` and `grad-town.svg` are NOT modified.
- Per-place scene content is defined by the brief table in the spec (trznica/soba/kuhinja/ulica/trg). `trg` has no host → its composition fills the bottom-left (no portrait overlay there).

---

### Task 1: Author the five hero SVGs + asset-sanity net

**Files:**
- Create: `public/images/grad-trznica.svg`, `public/images/grad-soba.svg`, `public/images/grad-kuhinja.svg`, `public/images/grad-ulica.svg`, `public/images/grad-trg.svg`
- Test: `src/components/grad/gradScenes.assets.test.ts`
- Reference (read, do not modify): `public/images/grad-kavana.svg`

**Interfaces:**
- Produces: five static assets at URLs `${BASE_URL}images/grad-{id}.svg` consumed by Task 2.

- [ ] **Step 1: Write the asset-sanity test (fails first — files absent)**

```ts
// src/components/grad/gradScenes.assets.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Every place that should have a bespoke hero scene. kavana already shipped.
const PLACE_IDS = ['kavana', 'trznica', 'soba', 'kuhinja', 'ulica', 'trg'] as const;
const FORBIDDEN = /<(script|image|foreignObject|filter)\b/i;

describe('Grad hero scene assets', () => {
  for (const id of PLACE_IDS) {
    const file = resolve(process.cwd(), `public/images/grad-${id}.svg`);

    it(`grad-${id}.svg exists`, () => {
      expect(existsSync(file)).toBe(true);
    });

    it(`grad-${id}.svg uses the locked viewBox and no raster/script/filter`, () => {
      const svg = readFileSync(file, 'utf8');
      expect(svg).toContain('viewBox="0 0 392 158"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
      expect(FORBIDDEN.test(svg)).toBe(false);
      // no embedded raster data
      expect(/data:image\//i.test(svg)).toBe(false);
    });
  }
});
```

- [ ] **Step 2: Run the test — verify it fails for the 5 new ids**

Run: `npx vitest run src/components/grad/gradScenes.assets.test.ts`
Expected: `kavana` passes; the 5 new ids FAIL on "exists".

- [ ] **Step 3: Author each of the five SVGs to the locked template + its brief**

Use this header/skeleton (identical root + band structure to `grad-kavana.svg`), then draw the per-place props from the spec brief into the focal zone. Replace `{wash-top}`/`{wash-bottom}`/`{ground}` with the place's warm base + tint:

```xml
<svg viewBox="0 0 392 158" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{wash-top}"/><stop offset="1" stop-color="{wash-bottom}"/>
    </linearGradient>
  </defs>
  <!-- top wash band (sky/wall) -->
  <rect x="0" y="0" width="392" height="120" fill="url(#bg)"/>
  <!-- grounded band (counter/floor/cobbles) -->
  <rect x="0" y="120" width="392" height="38" fill="{ground}"/>
  <!-- FOCAL PROPS: draw upper/center-right per brief; keep x<100,y>110 quiet -->
  <!-- ...flat primitives, place tint accent, 3-5 #D40030/white spot accents... -->
</svg>
```

Per-place content (from the spec brief table — accent = place `tint`):
- `grad-trznica.svg` — open-air Adriatic market: striped awning (red/white), fish on ice, produce crates, thin sea/horizon sliver. Green `#5d8c62` base accent.
- `grad-soba.svg` — scholar's study: bookshelf, desk + warm lamp glow, globe, window. Violet `#7c3aed` spines/lamp.
- `grad-kuhinja.svg` — hearth kitchen: stove, hanging pots, herb bunches, steaming pot. Terracotta `#c2410c` + red gingham.
- `grad-ulica.svg` — city street corner: taxi, storefronts, lamppost, tram line. Blue `#2563eb` + red taxi sign.
- `grad-trg.svg` — festival town square (no host): clock tower, fountain, šahovnica bunting, market tents. Red `#D40030` accents; **fill the bottom-left** (no portrait reserved there).

- [ ] **Step 4: Run the asset-sanity test — verify all six pass**

Run: `npx vitest run src/components/grad/gradScenes.assets.test.ts`
Expected: PASS (12 assertions — exists + structure for all six).

- [ ] **Step 5: Visually confirm each scene in the running app**

Run: `npm run build && npm run preview` (port 4173); open Grad → each place; confirm the hero shows the scene, the gold-ringed host portrait sits cleanly in the bottom-left over a quiet area, and the white title is legible over the scrim. Adjust shape coords if a prop collides with either safe zone.

- [ ] **Step 6: Commit**

```bash
git add public/images/grad-trznica.svg public/images/grad-soba.svg public/images/grad-kuhinja.svg public/images/grad-ulica.svg public/images/grad-trg.svg src/components/grad/gradScenes.assets.test.ts
git commit -m "feat(grad): bespoke flat hero scenes for the 5 remaining places"
```

---

### Task 2: Wire `SCENES`, prove every place renders a scene, remove the gradient fallback

**Files:**
- Modify: `src/components/grad/PlaceScreen.tsx` (the `SCENES` map at lines ~14–18; the hero `background` fallback at lines ~161–163)
- Test: `src/components/grad/PlaceScreen.test.tsx` (add a describe block)

**Interfaces:**
- Consumes: the five assets from Task 1.
- Produces: `SCENES` is a total `Record<PlaceId, string>` — every place resolves to a scene `<img>`.

- [ ] **Step 1: Write the failing render test**

Append to `src/components/grad/PlaceScreen.test.tsx` (reuses the existing `ctx` helper):

```tsx
import { PLACES } from './places';

describe('PlaceScreen — every place has a bespoke hero scene', () => {
  for (const place of PLACES) {
    it(`renders an <img> hero (not the gradient fallback) for ${place.id}`, () => {
      const { container } = render(
        <PlaceScreen placeId={place.id} ctx={ctx('B2')} onBack={vi.fn()} />,
      );
      const hero = screen.getByAltText(place.nameEn) as HTMLImageElement;
      expect(hero.tagName).toBe('IMG');
      expect(hero.getAttribute('src')).toContain(`images/grad-${place.id}.svg`);
    });

    it(`${place.id}: host portrait ${place.host ? 'present' : 'absent'} in hero`, () => {
      render(<PlaceScreen placeId={place.id} ctx={ctx('B2')} onBack={vi.fn()} />);
      if (place.host) {
        expect(screen.getByTestId(`portrait-${place.host}`)).toBeInTheDocument();
      } else {
        // trg has no host → no portrait overlay
        expect(screen.queryByTestId('portrait-baka')).toBeNull();
        expect(document.querySelector('[data-testid^="portrait-"]')).toBeNull();
      }
    });
  }
});
```

- [ ] **Step 2: Run it — verify the 5 new places fail**

Run: `npx vitest run src/components/grad/PlaceScreen.test.tsx`
Expected: `kavana` passes; the other five FAIL `getByAltText` (no `<img>`, gradient branch still active).

- [ ] **Step 3: Make `SCENES` total and drop the follow-up comment**

In `src/components/grad/PlaceScreen.tsx` replace lines ~14–18:

```ts
// Per-place hero scene assets — one bespoke flat illustration per place.
const SCENES: Record<PlaceId, string> = {
  kavana: `${import.meta.env.BASE_URL}images/grad-kavana.svg`,
  trznica: `${import.meta.env.BASE_URL}images/grad-trznica.svg`,
  soba: `${import.meta.env.BASE_URL}images/grad-soba.svg`,
  kuhinja: `${import.meta.env.BASE_URL}images/grad-kuhinja.svg`,
  ulica: `${import.meta.env.BASE_URL}images/grad-ulica.svg`,
  trg: `${import.meta.env.BASE_URL}images/grad-trg.svg`,
};
```

- [ ] **Step 4: Remove the now-dead gradient fallback**

`SCENES[placeId]` is now always defined, so `scene` is always truthy. In the hero block (lines ~153–178), simplify the `background` (remove the `scene ? undefined : linear-gradient(...)` ternary so it is just unset) and drop the `{scene && (...)}` guard around the `<img>` (render it unconditionally). Keep the scrim/portrait/title overlay unchanged.

- [ ] **Step 5: Run the test — verify all twelve pass**

Run: `npx vitest run src/components/grad/PlaceScreen.test.tsx`
Expected: PASS (existing 4 + new 12).

- [ ] **Step 6: Full gate**

Run: `npx tsc --noEmit` (expect 0) ; `npx eslint src/components/grad/PlaceScreen.tsx src/components/grad/PlaceScreen.test.tsx` (expect 0) ; `npm run build` (expect success) ; `npx vitest run` (expect full suite green).

- [ ] **Step 7: Commit**

```bash
git add src/components/grad/PlaceScreen.tsx src/components/grad/PlaceScreen.test.tsx
git commit -m "feat(grad): wire bespoke hero scenes for all places, drop gradient fallback"
```

---

## Self-Review

- **Spec coverage:** art direction (flat SVG + overlay) → Task 1; five scenes incl. host-less Trg → Task 1 Step 3; SCENES wiring + fallback removal → Task 2; verification (SCENES total, `<img>` per place, portrait present/absent, asset sanity, gate) → Task 1 test + Task 2 test + Task 2 Step 6. The spec's `build_grad_scenes.py` is reconciled above (hand-authored instead). All covered.
- **Placeholder scan:** none — all test/edit code is concrete; SVG art content is specified by the locked template + per-place brief (inherently authored, not code).
- **Type consistency:** `SCENES` goes from `Partial<Record<PlaceId,string>>` to `Record<PlaceId,string>`; `place.nameEn`/`place.host`/`portrait-{host}` testids match `places.ts` and `CharacterPortrait` (`data-testid={`portrait-${name}`}`).
