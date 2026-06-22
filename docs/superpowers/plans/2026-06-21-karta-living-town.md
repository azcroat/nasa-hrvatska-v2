# Karta Living Town — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Grad `Karta` view into a calm animated living-town hero banner above a roomy, scannable place list led by one recommended card.

**Architecture:** Pure state helpers in `gradModel` derive each place's "life" level (dormant/partial/full) and display state (locked/quiet/inprogress/mastered) from existing `placeStats`. `GradTownArt` becomes the animated hero vista whose per-district life is gated by a `lifeByPlace` prop. `GradMap` is restructured to render the hero + a "Danas" recommended card + a place list (the absolute marker overlay is removed); its props are unchanged so `GradTab` is untouched.

**Tech Stack:** React 18 + TypeScript, plain CSS (inline `<style>` keyframes, no Tailwind), Vitest + Testing Library, Playwright e2e. SVG hand-built, code-animated.

## Global Constraints

- Motion: CSS `@keyframes` only; gate ALL animation under `@media (prefers-reduced-motion: reduce)`. No Framer Motion `initial:{opacity:0}` (Android WebView freeze). Animate `opacity`/`transform` only.
- Palette: teal `#0e7490`, terracotta `#c2410c`, stone `#f5f0e8`/`#f6efe0`, Croatian red `#D40030`, gold `#C8980A`. Fonts: Playfair Display (headings), Outfit (UI).
- `GradMap` public props stay exactly `{ rec: Recommendation; onOpenPlace: (id: PlaceId) => void; statsByPlace: Record<string, { done; total; due; lockedCount }> }` — do NOT change `GradTab`.
- Croatian copy uses proper diacritics. No data/model exercise-mapping changes; preserve the no-orphan place-mapping gate (`grad.test.ts`).
- Art for the hero SVG is ported from the approved mockup `C:\dev\nasa-hrvatska-v2\.superpowers\brainstorm\132993-1782070216\content\karta-hero-list-v5.html` (the `<svg viewBox="0 0 400 275">` block). The mockup is the source of truth for the illustration; this plan adds the React wiring + per-district gating + tests.
- Gate before every push: `npx tsc --noEmit` (0), `npx eslint src` (0), `npm run build` (0), full `npx vitest run` (green), `node scripts/lintCroatianText.mjs` (clean). Grep all test files for old marker/count couplings before pushing.

---

### Task 1: State helpers in gradModel

**Files:**
- Modify: `src/components/grad/gradModel.ts` (append exported helpers after `placeStats`)
- Test: `src/components/grad/grad.test.ts` (add a describe block)

**Interfaces:**
- Consumes: nothing new (operates on the `placeStats` return shape).
- Produces:
  - `type PlaceLife = 'dormant' | 'partial' | 'full'`
  - `type PlaceDisplay = 'locked' | 'quiet' | 'inprogress' | 'mastered'`
  - `interface PlaceStat { total: number; done: number; due: number; lockedCount: number }`
  - `placeCompletion(s: PlaceStat): number` (0..1)
  - `placeLife(s: PlaceStat): PlaceLife`
  - `placeDisplay(s: PlaceStat): PlaceDisplay`
  - `aliveCount(byId: Record<string, PlaceStat>): number`

- [ ] **Step 1: Write the failing test**

Add to `src/components/grad/grad.test.ts`:

```ts
import { placeCompletion, placeLife, placeDisplay, aliveCount } from './gradModel';

describe('grad place state helpers', () => {
  const S = (o: Partial<{ total: number; done: number; due: number; lockedCount: number }>) =>
    ({ total: 0, done: 0, due: 0, lockedCount: 0, ...o });

  it('locked when every item is locked', () => {
    expect(placeLife(S({ total: 4, lockedCount: 4 }))).toBe('dormant');
    expect(placeDisplay(S({ total: 4, lockedCount: 4 }))).toBe('locked');
  });
  it('quiet/dormant when nothing done', () => {
    expect(placeLife(S({ total: 5, done: 0 }))).toBe('dormant');
    expect(placeDisplay(S({ total: 5, done: 0 }))).toBe('quiet');
  });
  it('partial/inprogress when some done', () => {
    expect(placeLife(S({ total: 5, done: 2, due: 1 }))).toBe('partial');
    expect(placeDisplay(S({ total: 5, done: 2, due: 1 }))).toBe('inprogress');
  });
  it('full/mastered when all available done and none due', () => {
    expect(placeLife(S({ total: 5, done: 5, due: 0 }))).toBe('full');
    expect(placeDisplay(S({ total: 5, done: 5, due: 0 }))).toBe('mastered');
  });
  it('not mastered while reviews are due', () => {
    expect(placeDisplay(S({ total: 5, done: 5, due: 2 }))).toBe('inprogress');
  });
  it('completion ignores locked items', () => {
    expect(placeCompletion(S({ total: 6, done: 2, lockedCount: 2 }))).toBeCloseTo(0.5);
  });
  it('aliveCount counts fully-alive places', () => {
    expect(aliveCount({
      a: S({ total: 4, done: 4 }), b: S({ total: 4, done: 1 }), c: S({ total: 4, lockedCount: 4 }),
    })).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/grad/grad.test.ts -t "place state helpers"`
Expected: FAIL — `placeCompletion is not a function` (not yet exported).

- [ ] **Step 3: Write minimal implementation**

Append to `src/components/grad/gradModel.ts`:

```ts
export type PlaceLife = 'dormant' | 'partial' | 'full';
export type PlaceDisplay = 'locked' | 'quiet' | 'inprogress' | 'mastered';
export interface PlaceStat {
  total: number;
  done: number;
  due: number;
  lockedCount: number;
}

const avail = (s: PlaceStat) => s.total - s.lockedCount;

export function placeCompletion(s: PlaceStat): number {
  const a = avail(s);
  return a > 0 ? Math.min(1, s.done / a) : 0;
}

export function placeDisplay(s: PlaceStat): PlaceDisplay {
  if (s.total > 0 && s.lockedCount === s.total) return 'locked';
  const a = avail(s);
  if (a > 0 && s.done >= a && s.due === 0) return 'mastered';
  if (a > 0 && s.done === 0) return 'quiet';
  return 'inprogress';
}

export function placeLife(s: PlaceStat): PlaceLife {
  const d = placeDisplay(s);
  if (d === 'mastered') return 'full';
  if (d === 'inprogress') return 'partial';
  return 'dormant';
}

export function aliveCount(byId: Record<string, PlaceStat>): number {
  return Object.values(byId).filter((s) => placeLife(s) === 'full').length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/grad/grad.test.ts -t "place state helpers"`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/grad/gradModel.ts src/components/grad/grad.test.ts
git commit -m "feat(grad): place life/display state helpers for the living Karta"
```

---

### Task 2: GradTownArt — animated hero with per-district life

**Files:**
- Modify: `src/components/grad/GradTownArt.tsx` (rewrite)
- Test: `src/components/grad/GradTownArt.test.tsx` (create)

**Interfaces:**
- Consumes: `PlaceLife`, `PlaceId` (from `gradModel` / `places`).
- Produces: `export default function GradTownArt({ lifeByPlace }: { lifeByPlace: Record<PlaceId, PlaceLife> }): JSX.Element`. Renders an `<svg data-testid="grad-town-art">`; each district life group is `<g data-place="<id>" data-life="dormant|partial|full">`; ambient groups keep ids `#km-waves`, `#km-glint`, `#km-boat-1`, plus new `#km-clouds`, `#km-ferry`, `#km-gulls`.

- [ ] **Step 1: Write the failing test**

Create `src/components/grad/GradTownArt.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import GradTownArt from './GradTownArt';

const life = (o: Record<string, 'dormant' | 'partial' | 'full'> = {}) => ({
  kavana: 'dormant', trznica: 'dormant', soba: 'dormant',
  kuhinja: 'dormant', ulica: 'dormant', trg: 'dormant', ...o,
}) as any;

describe('GradTownArt', () => {
  it('renders the town art svg', () => {
    const { getByTestId } = render(<GradTownArt lifeByPlace={life()} />);
    expect(getByTestId('grad-town-art')).toBeTruthy();
  });
  it('sets data-life per district from lifeByPlace', () => {
    const { container } = render(<GradTownArt lifeByPlace={life({ kavana: 'full', kuhinja: 'partial' })} />);
    expect(container.querySelector('[data-place="kavana"]')?.getAttribute('data-life')).toBe('full');
    expect(container.querySelector('[data-place="kuhinja"]')?.getAttribute('data-life')).toBe('partial');
    expect(container.querySelector('[data-place="ulica"]')?.getAttribute('data-life')).toBe('dormant');
  });
  it('keeps ambient layers present', () => {
    const { container } = render(<GradTownArt lifeByPlace={life()} />);
    expect(container.querySelector('#km-waves')).toBeTruthy();
    expect(container.querySelector('#km-boat-1')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/grad/GradTownArt.test.tsx`
Expected: FAIL — props/`data-place` not present (current GradTownArt takes no props).

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/components/grad/GradTownArt.tsx`. Port the `<svg viewBox="0 0 400 275">` art verbatim from the approved mockup `…/content/karta-hero-list-v5.html` (sky/sun/clouds/headland/town tiers/church/zvonik+flag/cypress/waterfront/sea/waves/glint/ferry/boat/gulls), converting HTML attrs to JSX (`class`→`className`, `stop-color`→`stopColor`, `stroke-width`→`strokeWidth`, etc.), and wrap each district's life element in a gated group. Skeleton (fill ambient art from the mockup where marked):

```tsx
import React from 'react';
import type { PlaceId } from './places';
import type { PlaceLife } from './gradModel';

/**
 * GradTownArt — animated golden-hour harbour hero for the Karta.
 * Ambient layers (#km-waves/#km-glint/#km-boat-1/#km-clouds/#km-ferry/#km-gulls,
 * cypress sway, twinkling windows, flag) are always on. Per-district life groups
 * (<g data-place data-life>) reveal each place's life as it is mastered.
 * All motion is CSS-keyframe driven + reduced-motion gated by GradMap's <style>.
 */
export default function GradTownArt({
  lifeByPlace,
}: {
  lifeByPlace: Record<PlaceId, PlaceLife>;
}) {
  return (
    <svg
      data-testid="grad-town-art"
      viewBox="0 0 400 275"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {/* <defs>, sky, sun, #km-clouds, headland, town tiers, church, zvonik+flag,
          cypress, twinkling windows, waterfront, sea, #km-waves, #km-glint,
          #km-ferry, #km-boat-1, #km-gulls — ported from karta-hero-list-v5.html */}

      {/* Per-district life — gated groups (CSS in GradMap hides/animates by data-life) */}
      <g data-place="kavana" data-life={lifeByPlace.kavana}>
        {/* café umbrellas on the waterfront (from mockup) */}
      </g>
      <g data-place="kuhinja" data-life={lifeByPlace.kuhinja}>
        {/* chimney smoke (#km-smoke style) */}
      </g>
      <g data-place="trznica" data-life={lifeByPlace.trznica}>
        {/* market stall awning */}
      </g>
      <g data-place="trg" data-life={lifeByPlace.trg}>
        {/* square figures + lit church/tower windows */}
      </g>
      <g data-place="ulica" data-life={lifeByPlace.ulica}>
        {/* little taxi on the street */}
      </g>
      <g data-place="soba" data-life={lifeByPlace.soba}>
        {/* one warm lit window */}
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/grad/GradTownArt.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/grad/GradTownArt.tsx src/components/grad/GradTownArt.test.tsx
git commit -m "feat(grad): GradTownArt hero with per-district life gating"
```

---

### Task 3: GradMap — hero + Danas card + roomy place list

**Files:**
- Modify: `src/components/grad/GradMap.tsx` (restructure; remove marker overlay)
- Test: `src/components/grad/GradMap.test.tsx` (rewrite assertions)

**Interfaces:**
- Consumes: `GradTownArt`, `placeLife`/`placeDisplay`/`placeCompletion`/`aliveCount` (Task 1), `PLACES`/`Place`/`PlaceId` (places), `Recommendation` (gradModel), `CharacterPortrait` (family).
- Produces: unchanged default export `GradMap({ rec, onOpenPlace, statsByPlace })`. Test hooks: root `data-testid="grad-map"`; hero `grad-town-art`; recommended card `grad-map-today` (calls `rec.launch()`); per place a row `data-testid="place-row-<id>"` calling `onOpenPlace(<id>)`; locked row carries `data-testid="marker-locked-<id>"`; due rows carry `data-testid="due-badge-<id>"`; mastered row carries `data-testid="ring-<id>" data-completion="1"`; progress line `data-testid="karta-progress"` with text `N / 6`.

- [ ] **Step 1: Write the failing test**

Rewrite `src/components/grad/GradMap.test.tsx` (keep its existing mocks of `../family/CharacterPortrait` if present; otherwise mock it to a stub):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import GradMap from './GradMap';
import type { Recommendation } from './gradModel';

vi.mock('../family/CharacterPortrait', () => ({
  default: ({ name }: { name: string }) => React.createElement('span', { 'data-portrait': name }),
}));

const rec: Recommendation = {
  exerciseId: 'srsreview', placeId: 'kavana', host: 'ana',
  hr: 'Ana ti je spremila 6 fraza', en: '6 reviews waiting',
  count: 6, durationMin: 6, launch: vi.fn(),
};
const stats = {
  kavana: { total: 5, done: 5, due: 0, lockedCount: 0 },     // mastered
  kuhinja: { total: 5, done: 2, due: 2, lockedCount: 0 },    // in progress
  trznica: { total: 5, done: 1, due: 3, lockedCount: 0 },    // in progress
  trg: { total: 5, done: 1, due: 0, lockedCount: 0 },        // in progress
  ulica: { total: 5, done: 0, due: 0, lockedCount: 0 },      // quiet
  soba: { total: 4, done: 0, due: 0, lockedCount: 4 },       // locked
};

function setup(extra = {}) {
  const onOpenPlace = vi.fn();
  const utils = render(<GradMap rec={rec} statsByPlace={stats as any} onOpenPlace={onOpenPlace} {...extra} />);
  return { ...utils, onOpenPlace };
}

describe('GradMap — hero + list', () => {
  it('renders the hero town art', () => {
    expect(setup().getByTestId('grad-town-art')).toBeTruthy();
  });
  it('progress line shows alive count out of 6', () => {
    expect(setup().getByTestId('karta-progress').textContent).toMatch(/1 \/ 6/);
  });
  it('Danas card launches the recommendation', () => {
    const { getByTestId } = setup();
    fireEvent.click(getByTestId('grad-map-today'));
    expect(rec.launch).toHaveBeenCalledTimes(1);
  });
  it('mastered place shows full ring', () => {
    expect(setup().getByTestId('ring-kavana').getAttribute('data-completion')).toBe('1');
  });
  it('in-progress place shows a due badge', () => {
    expect(setup().getByTestId('due-badge-trznica').textContent).toBe('3');
  });
  it('locked place is marked locked', () => {
    expect(setup().getByTestId('marker-locked-soba')).toBeTruthy();
  });
  it('tapping a place row opens it', () => {
    const { getByTestId, onOpenPlace } = setup();
    fireEvent.click(getByTestId('place-row-kuhinja'));
    expect(onOpenPlace).toHaveBeenCalledWith('kuhinja');
  });
  it('disables animation under reduced motion (style guard present)', () => {
    expect(setup().container.innerHTML).toContain('prefers-reduced-motion');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: FAIL — new testids (`karta-progress`, `place-row-*`) absent (current GradMap renders markers).

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/components/grad/GradMap.tsx`:

```tsx
import React from 'react';
import { PLACES, type PlaceId } from './places';
import {
  placeCompletion, placeDisplay, placeLife, aliveCount,
  type Recommendation, type PlaceLife,
} from './gradModel';
import CharacterPortrait from '../family/CharacterPortrait';
import GradTownArt from './GradTownArt';

const TEAL = '#0e7490';
const GOLD = '#C8980A';

export default function GradMap({
  rec,
  onOpenPlace,
  statsByPlace,
}: {
  rec: Recommendation;
  onOpenPlace: (id: PlaceId) => void;
  statsByPlace: Record<string, { done: number; total: number; due: number; lockedCount: number }>;
}) {
  const stat = (id: PlaceId) => statsByPlace[id] ?? { total: 0, done: 0, due: 0, lockedCount: 0 };
  const lifeByPlace = Object.fromEntries(
    PLACES.map((p) => [p.id, placeLife(stat(p.id))]),
  ) as Record<PlaceId, PlaceLife>;
  const aliveN = aliveCount(statsByPlace);

  return (
    <div data-testid="grad-map" style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @keyframes kmWaves{0%,100%{opacity:.30}50%{opacity:.55}}
        @keyframes kmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
        @keyframes kmGlint{0%,100%{opacity:.5}50%{opacity:.22}}
        @keyframes kmDrift{from{transform:translateX(-40px)}to{transform:translateX(440px)}}
        @keyframes kmFerry{from{transform:translateX(0)}to{transform:translateX(380px)}}
        @keyframes kmGull{0%{transform:translate(-30px,6px)}100%{transform:translate(440px,-14px)}}
        @keyframes kmSmoke{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:.5}100%{opacity:0;transform:translateY(-26px) scale(1.6)}}
        @keyframes kmFlag{0%,100%{transform:skewX(0)}50%{transform:skewX(-14deg)}}
        @keyframes kmTwk{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes kmSway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
        @keyframes recoGlow{0%,100%{box-shadow:0 6px 18px rgba(200,152,10,.18)}50%{box-shadow:0 6px 24px rgba(200,152,10,.42)}}
        #km-waves{animation:kmWaves 5s ease-in-out infinite}
        #km-glint{animation:kmGlint 4s ease-in-out infinite}
        #km-boat-1{animation:kmBob 6s ease-in-out infinite;transform-origin:center bottom}
        #km-clouds{animation:kmDrift 60s linear infinite}
        #km-ferry{animation:kmFerry 36s linear infinite}
        #km-gulls path{animation:kmGull 13s linear infinite}
        #km-flag{animation:kmFlag 2.4s ease-in-out infinite;transform-origin:left center}
        .km-cyp{transform-box:fill-box;transform-origin:bottom center;animation:kmSway 7s ease-in-out infinite}
        .km-twk{animation:kmTwk 5s ease-in-out infinite}
        /* per-district life: hidden when dormant, animated when partial/full */
        [data-life="dormant"]{opacity:0}
        [data-life="partial"]{opacity:.85}
        [data-life="full"]{opacity:1}
        [data-place="kuhinja"][data-life="partial"] .km-smoke,
        [data-place="kuhinja"][data-life="full"] .km-smoke{animation:kmSmoke 4.4s ease-in-out infinite}
        .km-reco{animation:recoGlow 3.4s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          #km-waves,#km-glint,#km-boat-1,#km-clouds,#km-ferry,#km-gulls path,#km-flag,
          .km-cyp,.km-twk,.km-smoke,.km-reco{animation:none}
        }
      `}</style>

      {/* HERO */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 11', borderRadius: 18, overflow: 'hidden' }}>
        <GradTownArt lifeByPlace={lifeByPlace} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,.18),transparent 34%,transparent 60%,rgba(0,40,60,.30))' }} />
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,.5)' }}>
            Naš grad na moru
          </div>
          <div data-testid="karta-progress" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.92)', textShadow: '0 1px 4px rgba(0,0,0,.5)', marginTop: 3 }}>
            TVOJ GRAD OŽIVLJAVA · {aliveN} / {PLACES.length} MJESTA
          </div>
        </div>
      </div>

      {/* DANAS recommended card */}
      <button
        data-testid="grad-map-today"
        onClick={() => rec.launch()}
        className="km-reco"
        style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
          background: 'var(--card)', border: `1.5px solid #e6cf94`, borderRadius: 18, padding: '11px 12px',
          margin: '14px 0 18px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
      >
        <span style={{ width: 46, height: 46, borderRadius: '50%', flex: 'none', background: `linear-gradient(135deg,${GOLD},#e6c463)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 9px rgba(0,0,0,.18)' }}>
          {rec.host ? <CharacterPortrait name={rec.host} size={40} /> : <span style={{ fontSize: 22 }}>☀️</span>}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', color: GOLD }}>Danas</span>
          <span style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>{rec.hr}</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--subtext)' }}>{rec.en} · ~{rec.durationMin} min</span>
        </span>
        <span style={{ flex: 'none', background: TEAL, color: '#fff', fontWeight: 800, fontSize: 13, padding: '10px 15px', borderRadius: 12 }}>Idemo →</span>
      </button>

      {/* PLACE LIST */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--subtext)', margin: '0 4px 9px' }}>
        Sva mjesta · all places
      </div>
      {PLACES.map((p) => {
        const s = stat(p.id);
        const disp = placeDisplay(s);
        const completion = placeCompletion(s);
        const locked = disp === 'locked';
        const mastered = disp === 'mastered';
        return (
          <button
            key={p.id}
            data-testid={`place-row-${p.id}`}
            onClick={() => onOpenPlace(p.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              background: 'var(--card)', border: '1px solid var(--card-b)', borderRadius: 16, padding: '11px 12px',
              marginBottom: 10, cursor: 'pointer', opacity: locked ? 0.62 : 1, fontFamily: "'Outfit',sans-serif" }}
          >
            <span {...(locked ? { 'data-testid': `marker-locked-${p.id}` } : {})}
              style={{ width: 44, height: 44, borderRadius: 13, flex: 'none', background: p.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>
              {locked ? '🔒' : p.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
                {p.name} {mastered ? <span style={{ color: GOLD }}>★</span> : null}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--subtext)' }}>{p.nameEn}</span>
              {!locked && (
                <span data-testid={`ring-${p.id}`} data-completion={String(completion)}
                  style={{ display: 'block', height: 6, borderRadius: 3, background: '#eee6d6', marginTop: 7, maxWidth: 150, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${completion * 100}%`, background: mastered ? GOLD : TEAL }} />
                </span>
              )}
            </span>
            <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.due > 0 && !locked && (
                <span data-testid={`due-badge-${p.id}`} style={{ background: '#D40030', color: '#fff', fontSize: 11, fontWeight: 900, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{s.due}</span>
              )}
              {p.host && !locked && <CharacterPortrait name={p.host} size={22} />}
              <span style={{ color: '#cbd5e1', fontSize: 20 }}>›</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/grad/GradMap.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck + the grad suite + commit**

Run: `npx tsc --noEmit` (expect 0), then `npx vitest run src/components/grad/` (expect green).

```bash
git add src/components/grad/GradMap.tsx src/components/grad/GradMap.test.tsx
git commit -m "feat(grad): restructure Karta to hero + Danas card + roomy place list"
```

---

### Task 4: Update e2e map-smoke + final gate

**Files:**
- Modify: `e2e/map-smoke.spec.js`
- Verify: whole repo

**Interfaces:**
- Consumes: the new testids (`grad-map`, `grad-town-art`, `grad-map-today`, `place-row-<id>`, `karta-progress`).

- [ ] **Step 1: Read the current spec + run it to see what breaks**

Run: `npm run build && npx playwright test e2e/map-smoke.spec.js --project="Desktop Chrome"`
Expected: FAIL where it asserts the removed absolute markers (old marker pills) / map layout.

- [ ] **Step 2: Update assertions to the new structure**

In `e2e/map-smoke.spec.js`, replace marker-overlay assertions with: open Grad → toggle `Karta` → expect `grad-map` + `grad-town-art` visible; expect a `place-row-*` to be clickable and open a place (existing `enterPlace`/place-name flow); expect `grad-map-today` present. Keep the existing navigation fixtures and exact place-name matching ("Trg" vs "…na Trgu"). Show the concrete edited locators inline when editing (no placeholders).

- [ ] **Step 3: Re-run the e2e spec**

Run: `npm run build && npx playwright test e2e/map-smoke.spec.js --project="Desktop Chrome"`
Expected: PASS.

- [ ] **Step 4: Full gate**

Run each, expect clean:
- `npx tsc --noEmit`
- `npx eslint src`
- `node scripts/lintCroatianText.mjs`
- `npm run build`
- `npx vitest run` (full suite green)

Also grep for stale couplings: `grep -rn "due-badge-\|ring-\|marker-locked-\|grad-map" src e2e` — confirm every reference matches the new testids.

- [ ] **Step 5: Commit + push + PR**

```bash
git add e2e/map-smoke.spec.js
git commit -m "test(e2e): update map-smoke for the hero+list Karta"
git push -u origin feat/karta-living-town
gh pr create --title "feat(grad): living-town Karta — animated hero + roomy place list" --base master --head feat/karta-living-town --body "..."
```

---

## Self-Review

**Spec coverage:** hero (Task 2) ✓; per-district life gated by mastery (Task 1 helpers + Task 2 groups + Task 3 CSS) ✓; Danas card (Task 3) ✓; roomy list with states (Task 3) ✓; progress line N/6 (Task 3) ✓; same GradMap props / GradTab untouched (Task 3 signature) ✓; reduced-motion + Android-safe CSS (Task 3 `<style>`) ✓; tests + e2e (Tasks 1-4) ✓; no-orphan gate preserved (untouched `grad.test.ts` block) ✓; Popis/toggle unchanged (out of scope, not touched) ✓.

**Placeholder scan:** the only deferred content is the ported hero SVG art (explicitly sourced from the approved mockup `karta-hero-list-v5.html`) and the e2e locator edits (shown inline at edit time) — both are real, located artifacts, not invented logic.

**Type consistency:** `PlaceStat`/`PlaceLife`/`PlaceDisplay` defined in Task 1 and consumed by Tasks 2-3 with matching names; `GradTownArt` prop `lifeByPlace: Record<PlaceId, PlaceLife>` matches GradMap's computed value; testids (`grad-town-art`, `grad-map-today`, `place-row-*`, `due-badge-*`, `ring-*`, `marker-locked-*`, `karta-progress`) are consistent across Tasks 2-4.
