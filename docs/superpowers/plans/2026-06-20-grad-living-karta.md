# Living Grad Karta Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static Karta into a living map of progress: each marker shows a completion ring + due badge + lock state, the recommended place's own host stands beside it, and the town animates subtly (reduced-motion aware).

**Architecture:** Enhance `GradMap` (single screen). Widen the per-place stats it receives to the full `placeStats` shape, derive the recommended host in `GradMap`, and replace the static `<img>` town with an inline SVG component so layers can animate via CSS.

**Tech Stack:** React + TypeScript, plain CSS keyframes (no Framer), Vitest + @testing-library/react.

## Reconciliation with the spec

The spec listed example ambient animations as "sea shimmer, flag flutter, chimney smoke." The actual `grad-town.svg` contains a **wave group**, **two sailboats**, and a **harbour-glint group** — not flags/chimneys. This plan animates those real layers (sea shimmer + boat bob + glint pulse). Design intent — subtle ambient life, CSS-only, reduced-motion static — is unchanged.

## Global Constraints

- CSS animations only; no Framer (avoids the known Android WebView freeze). All ambient motion gated by `@media (prefers-reduced-motion: reduce)` → fully static.
- No `dangerouslySetInnerHTML`: the town SVG is inlined as JSX via a typed component.
- Markers stay positioned by each place's `mapPos` percentages; the town keeps `viewBox="0 0 392 690"` and its current static appearance.
- Place-state derivation (per place, from `placeStats` → `{ total, done, due, lockedCount }`):
  - `available = total - lockedCount`
  - `completion = available > 0 ? Math.min(1, done / available) : 0`
  - `isLocked = total > 0 && lockedCount === total`
  - `isMastered = available > 0 && done >= available && due === 0`

---

### Task 1: Marker progress ring + due badge + lock state (with data plumbing)

**Files:**
- Modify: `src/components/grad/GradTab.tsx` (the `statsByPlace` builder, lines ~210-215)
- Modify: `src/components/grad/GradMap.tsx` (props type; per-marker render)
- Test: `src/components/grad/GradMap.test.tsx`

**Interfaces:**
- Produces: `GradMap` accepts `statsByPlace: Record<string, { done: number; total: number; due: number; lockedCount: number }>`.

- [ ] **Step 1: Widen the stats passed from GradTab**

In `GradTab.tsx` replace the `statsByPlace` builder (lines ~210-215):

```tsx
  const statsByPlace = Object.fromEntries(
    PLACES.map((p) => {
      const s = placeStats(p.id, ctx);
      return [p.id, { done: s.done, total: s.total, due: s.due, lockedCount: s.lockedCount }];
    }),
  ) as Record<string, { done: number; total: number; due: number; lockedCount: number }>;
```

(The list-view consumer at line ~427 reads `s.due`/`s.total` — still valid as a superset.)

- [ ] **Step 2: Write failing marker-state tests**

Replace the `statsByPlace` fixture in `GradMap.test.tsx` and add a describe block:

```tsx
const statsByPlace = Object.fromEntries(
  ['kavana', 'trznica', 'soba', 'kuhinja', 'ulica', 'trg'].map((id) => [
    id,
    { done: 0, total: 5, due: 0, lockedCount: 0 },
  ]),
);

describe('GradMap — living markers', () => {
  function statsWith(over: Record<string, object>) {
    return { ...statsByPlace, ...over };
  }

  it('shows a due badge only when due > 0', () => {
    render(
      <GradMap
        rec={rec}
        onOpenPlace={vi.fn()}
        statsByPlace={statsWith({ trznica: { done: 1, total: 5, due: 3, lockedCount: 0 } })}
      />,
    );
    expect(screen.getByTestId('due-badge-trznica')).toHaveTextContent('3');
    expect(screen.queryByTestId('due-badge-soba')).toBeNull();
  });

  it('renders a completion ring whose fill reflects done/available', () => {
    render(
      <GradMap
        rec={rec}
        onOpenPlace={vi.fn()}
        statsByPlace={statsWith({ soba: { done: 3, total: 4, due: 0, lockedCount: 0 } })}
      />,
    );
    const ring = screen.getByTestId('ring-soba');
    // data-completion is the 0..1 fraction the ring renders
    expect(ring.getAttribute('data-completion')).toBe('0.75');
  });

  it('marks a fully-locked place: dimmed + lock, no due badge, still clickable', () => {
    const onOpen = vi.fn();
    render(
      <GradMap
        rec={rec}
        onOpenPlace={onOpen}
        statsByPlace={statsWith({ ulica: { done: 0, total: 5, due: 2, lockedCount: 5 } })}
      />,
    );
    expect(screen.getByTestId('marker-locked-ulica')).toBeInTheDocument();
    expect(screen.queryByTestId('due-badge-ulica')).toBeNull(); // locked suppresses due
    fireEvent.click(screen.getByRole('button', { name: 'Ivina ulica' }));
    expect(onOpen).toHaveBeenCalledWith('ulica');
  });
});
```

- [ ] **Step 3: Run the tests — verify they fail**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: the three new tests FAIL (no `ring-*`/`due-badge-*`/`marker-locked-*` testids yet).

- [ ] **Step 4: Implement marker state in GradMap**

Update the props type and the per-marker render in `GradMap.tsx`:
- Change `statsByPlace` type to `Record<string, { done: number; total: number; due: number; lockedCount: number }>`.
- Per place, compute `available`/`completion`/`isLocked`/`isMastered` (Global Constraints formulas).
- Render a completion ring as an inline SVG around the icon disc — two `<circle>` (track + progress) using `stroke-dasharray`, with `data-testid={`ring-${p.id}`}` and `data-completion={String(completion)}` on the ring's wrapper; gold stroke when `isMastered`.
- Generalize the count badge: render `<span data-testid={`due-badge-${p.id}`}>` with the due count whenever `due > 0 && !isLocked` (drop the `recommended &&` gate; keep gold styling for the recommended one, red otherwise).
- When `isLocked`: wrap the marker content with reduced opacity, render a 🔒 glyph and `data-testid={`marker-locked-${p.id}`}`, skip glow/ring-fill/due badge. Keep the `<button onClick={onOpenPlace}>` so it stays clickable.

- [ ] **Step 5: Run the tests — verify all pass**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: PASS (existing 2 + new 3).

- [ ] **Step 6: Commit**

```bash
git add src/components/grad/GradMap.tsx src/components/grad/GradTab.tsx src/components/grad/GradMap.test.tsx
git commit -m "feat(grad): living Karta markers — completion ring, due badge, lock state"
```

---

### Task 2: Host of the recommended place stands beside its marker

**Files:**
- Modify: `src/components/grad/GradMap.tsx`
- Test: `src/components/grad/GradMap.test.tsx`

**Interfaces:**
- Consumes: `rec.placeId`; `PLACES` (for the place's own `host`); `CharacterPortrait`.

- [ ] **Step 1: Write failing host tests**

Add to `GradMap.test.tsx`:

```tsx
import { PLACES } from './places';

describe('GradMap — host at the recommended place', () => {
  it("renders the recommended place's own host portrait", () => {
    // rec.placeId = 'kavana' → host 'ana'
    render(<GradMap rec={rec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
    expect(screen.getByTestId('portrait-ana')).toBeInTheDocument();
  });

  it('renders no host portrait when the recommended place has no host (trg)', () => {
    const trgRec = { ...rec, placeId: 'trg' as const, host: null };
    render(<GradMap rec={trgRec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
    expect(document.querySelector('[data-testid^="portrait-"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify the first test fails** (no portrait rendered yet)

Run: `npx vitest run src/components/grad/GradMap.test.tsx -t "host at the recommended"`
Expected: the "own host portrait" test FAILS; the "no host" test passes vacuously.

- [ ] **Step 3: Implement the host figure**

In `GradMap.tsx`: derive `const recHost = PLACES.find((p) => p.id === rec.placeId)?.host ?? null;`. At the recommended marker (where `recommended` is true), if `recHost`, render a small (~34px) gold-ringed `CharacterPortrait name={recHost}` beside the pill (absolute-positioned so it doesn't shift the marker). Import `CharacterPortrait` from `../family/CharacterPortrait`.

- [ ] **Step 4: Run — verify both pass**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/grad/GradMap.tsx src/components/grad/GradMap.test.tsx
git commit -m "feat(grad): recommended place's own host stands on the Karta"
```

---

### Task 3: Ambient life — inline town SVG + CSS animation (reduced-motion aware)

**Files:**
- Create: `src/components/grad/GradTownArt.tsx`
- Modify: `src/components/grad/GradMap.tsx` (replace `<img>` with `<GradTownArt/>`; add keyframes to the existing inline `<style>`)
- Delete (if unused elsewhere): `public/images/grad-town.svg`
- Test: `src/components/grad/GradMap.test.tsx`

**Interfaces:**
- Produces: `GradTownArt` — a typed component rendering the town as inline `<svg viewBox="0 0 392 690">` with `id`s `km-waves`, `km-boat-1`, `km-boat-2`, `km-glint` on the animatable layers, and `data-testid="grad-town-art"`.

- [ ] **Step 1: Create GradTownArt.tsx from grad-town.svg**

Convert the markup in `public/images/grad-town.svg` to JSX (self-close tags, `stroke-width`→`strokeWidth`, etc.) inside a default-export component. Add `id="km-waves"` to the wave group (`<g stroke="#ffffff" ... opacity="0.30">`), `id="km-boat-1"` / `id="km-boat-2"` to the two `<g transform="translate(...)">` sailboats, and `id="km-glint"` to the `<g fill="#ffe9b0" opacity="0.5">` glint group. Root `<svg>` gets `data-testid="grad-town-art"` and `style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}` with `preserveAspectRatio="xMidYMid slice"`.

- [ ] **Step 2: Swap the town image + add ambient keyframes in GradMap**

In `GradMap.tsx`: replace the `<img src={SCENE}>` (and remove the now-unused `SCENE` const) with `<GradTownArt />`. Extend the existing inline `<style>` block (which already holds `gradPulse`) with:

```css
@keyframes kmWaves{0%,100%{opacity:.30}50%{opacity:.5}}
@keyframes kmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
@keyframes kmGlint{0%,100%{opacity:.5}50%{opacity:.25}}
#km-waves{animation:kmWaves 5s ease-in-out infinite}
#km-boat-1{animation:kmBob 6s ease-in-out infinite}
#km-boat-2{animation:kmBob 7s ease-in-out infinite}
#km-glint{animation:kmGlint 4s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){
  #km-waves,#km-boat-1,#km-boat-2,#km-glint{animation:none}
}
```

(Boat `<g transform="translate(...)">` already has a transform; apply `transform-box:fill-box; transform-origin:center` and use a wrapper or `translate` that composes — verify the bob doesn't reset the translate; if it conflicts, wrap each boat's inner art in a `<g id="km-boat-N">` so the animation transform is separate from the positioning transform.)

- [ ] **Step 3: Write/extend the town-render test**

Add to `GradMap.test.tsx`:

```tsx
it('renders the inline town art (animatable, not an <img>)', () => {
  render(<GradMap rec={rec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
  expect(screen.getByTestId('grad-town-art')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: PASS (town art present).

- [ ] **Step 5: Remove the now-unused town asset (if confirmed unused)**

Run: `git grep -n "grad-town" -- src` — if `GradMap` was the only reference and now uses `GradTownArt`, delete `public/images/grad-town.svg`. If any other reference exists, keep it.

- [ ] **Step 6: Full gate**

Run: `npx tsc --noEmit` (0) ; `npx eslint src/components/grad/GradMap.tsx src/components/grad/GradTownArt.tsx src/components/grad/GradTab.tsx src/components/grad/GradMap.test.tsx` (0) ; `npm run build` (success) ; `npx vitest run` (full suite green).

- [ ] **Step 7: Commit**

```bash
git add src/components/grad/GradTownArt.tsx src/components/grad/GradMap.tsx src/components/grad/GradMap.test.tsx
git add -u public/images/grad-town.svg
git commit -m "feat(grad): living town — inline animatable SVG with reduced-motion-safe ambient motion"
```

---

## Self-Review

- **Spec coverage:** ring + due badge + lock → Task 1; recommended place's own host → Task 2; ambient CSS animation + reduced-motion + inlined SVG → Task 3; data plumbing (full placeStats) → Task 1 Step 1; verification (ring fill, due gating, lock dim, host present/absent, town art) → tests across all tasks + final gate. Covered.
- **Placeholder scan:** none — all test/edit code concrete; the SVG→JSX conversion is a mechanical transform of an existing committed file with named ids.
- **Type consistency:** `statsByPlace` widened to `{ done, total, due, lockedCount }` in both `GradTab` (producer) and `GradMap` (consumer); `recHost` derived from `PLACES`/`rec.placeId`; testids (`ring-`, `due-badge-`, `marker-locked-`, `portrait-`, `grad-town-art`) match assertions.
- **Reconciliation:** ambient layers (waves/boats/glint) substitute the spec's flags/smoke example — same intent; noted above.
