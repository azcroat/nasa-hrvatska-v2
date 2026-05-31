# Gamification G1b — Map of Croatia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A solo "Map of Croatia" collection screen whose 10 heritage regions restore as the user's total XP crosses thresholds, reached from a prominent "Your Croatia" card at the top of the Arcade.

**Architecture:** A pure, unit-tested `mapRegions.ts` holds the ordered region→XP-threshold table and status functions (no UI deps). `MapScreen.tsx` reads `stats.xp` (StatsContext) + `REGIONS` (static cultural data for title/icon/sub) and renders the tile grid from `regionStatuses(xp)`. Routed as `currentScreen === 'map'`; entered from `ArcadeHub`. A route-guard test keeps it from becoming a dead lesson.

**Tech Stack:** React + TS, Vitest, @testing-library/react, existing StatsContext + `src/data/cultural/regions.js`.

**Design constraints:** premium navy/gold register, restored regions only ever increase (progress protection), prominent placement (top of Arcade), no paywall.

**Spec:** `docs/superpowers/specs/2026-05-31-gamification-g1b-map-design.md`.

---

## File Structure
- Create: `src/lib/gamification/mapRegions.ts` + `src/tests/mapRegions.test.ts`
- Create: `src/components/practice/MapScreen.tsx` + `src/tests/MapScreen.test.tsx`
- Modify: `src/components/AppRouter.tsx` (route `map`)
- Modify: `src/components/practice/ArcadeHub.tsx` (Your Croatia card)
- Modify: `src/tests/arcade-routes.test.ts` (assert `map` routes)

---

## Task 1: Pure region→XP table + status functions

**Files:** Create `src/lib/gamification/mapRegions.ts`; Test `src/tests/mapRegions.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/mapRegions.test.ts
import { describe, it, expect } from 'vitest';
import {
  MAP_REGIONS, regionStatuses, restoredCount, nextRegion,
} from '../lib/gamification/mapRegions';

describe('MAP_REGIONS', () => {
  it('has 10 regions in strictly ascending threshold order, first at 0', () => {
    expect(MAP_REGIONS).toHaveLength(10);
    expect(MAP_REGIONS[0]!.xpThreshold).toBe(0);
    for (let i = 1; i < MAP_REGIONS.length; i++) {
      expect(MAP_REGIONS[i]!.xpThreshold).toBeGreaterThan(MAP_REGIONS[i - 1]!.xpThreshold);
    }
  });
});

describe('regionStatuses / restoredCount', () => {
  it('xp=0 restores exactly the first region (Labin)', () => {
    expect(restoredCount(0)).toBe(1);
    const s = regionStatuses(0);
    expect(s[0]!.restored).toBe(true);
    expect(s[1]!.restored).toBe(false);
  });
  it('high xp restores all 10', () => {
    expect(restoredCount(999999)).toBe(10);
    expect(regionStatuses(999999).every((r) => r.restored)).toBe(true);
  });
  it('restored exactly when xp >= threshold', () => {
    const t = MAP_REGIONS[3]!.xpThreshold;
    expect(regionStatuses(t)[3]!.restored).toBe(true);
    expect(regionStatuses(t - 1)[3]!.restored).toBe(false);
  });
  it('negative/NaN xp restores only the free first region', () => {
    expect(restoredCount(-5)).toBe(1);
    expect(restoredCount(Number.NaN)).toBe(1);
  });
});

describe('nextRegion', () => {
  it('returns the next locked region and XP remaining', () => {
    const n = nextRegion(0);
    expect(n).not.toBeNull();
    expect(n!.key).toBe(MAP_REGIONS[1]!.key);
    expect(n!.xpToGo).toBe(MAP_REGIONS[1]!.xpThreshold);
  });
  it('returns null when all regions are restored', () => {
    expect(nextRegion(999999)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** — `npx vitest run src/tests/mapRegions.test.ts`

- [ ] **Step 3: Implement `src/lib/gamification/mapRegions.ts`**

```typescript
// Ordered Map-of-Croatia regions and the cumulative total-XP threshold at which
// each "restores". Region 0 is free (restored from the start). Keys match
// src/data/cultural/regions.js REGIONS. Thresholds span the A1→C2 XP curve.
export interface MapRegionDef {
  key: string;
  xpThreshold: number;
}

export const MAP_REGIONS: readonly MapRegionDef[] = [
  { key: 'labin', xpThreshold: 0 },
  { key: 'split', xpThreshold: 400 },
  { key: 'zagreb', xpThreshold: 1000 },
  { key: 'bibinje', xpThreshold: 1800 },
  { key: 'vukovar', xpThreshold: 3000 },
  { key: 'vinkovci', xpThreshold: 4500 },
  { key: 'knin', xpThreshold: 6500 },
  { key: 'mostar', xpThreshold: 9500 },
  { key: 'tomislavgrad', xpThreshold: 13000 },
  { key: 'hercegovina', xpThreshold: 18000 },
];

export interface RegionStatus {
  key: string;
  xpThreshold: number;
  restored: boolean;
}

function safeXp(xp: number): number {
  return Number.isFinite(xp) && xp > 0 ? xp : 0;
}

export function regionStatuses(xp: number): RegionStatus[] {
  const x = safeXp(xp);
  return MAP_REGIONS.map((r) => ({
    key: r.key,
    xpThreshold: r.xpThreshold,
    restored: x >= r.xpThreshold,
  }));
}

export function restoredCount(xp: number): number {
  return regionStatuses(xp).filter((r) => r.restored).length;
}

export function nextRegion(xp: number): { key: string; xpThreshold: number; xpToGo: number } | null {
  const x = safeXp(xp);
  const next = MAP_REGIONS.find((r) => x < r.xpThreshold);
  if (!next) return null;
  return { key: next.key, xpThreshold: next.xpThreshold, xpToGo: next.xpThreshold - x };
}
```

- [ ] **Step 4: Run — expect PASS** — `npx vitest run src/tests/mapRegions.test.ts`
- [ ] **Step 5: tsc** — `npx tsc -p tsconfig.json --noEmit` (no new errors)
- [ ] **Step 6: Commit**
```bash
git add src/lib/gamification/mapRegions.ts src/tests/mapRegions.test.ts
git commit -m "feat(gamification): pure Map-of-Croatia region/XP threshold table"
```

---

## Task 2: MapScreen component

**Files:** Create `src/components/practice/MapScreen.tsx`; Test `src/tests/MapScreen.test.tsx`

REGIONS shape (from `src/data/cultural/regions.js`): each key → `{ title, sub, icon, color, ... }`. Read defensively (fallbacks) since not every key is guaranteed identical.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/MapScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { xp: 2400 } }),
}));
import MapScreen from '../components/practice/MapScreen';
import { restoredCount } from '../lib/gamification/mapRegions';

describe('MapScreen', () => {
  it('shows the restored count out of 10 for the given XP', () => {
    render(<MapScreen goBack={() => {}} />);
    expect(screen.getByText(`${restoredCount(2400)} / 10`)).toBeTruthy();
  });
  it('renders a tile per region (10) and a Next hint', () => {
    render(<MapScreen goBack={() => {}} />);
    expect(screen.getAllByTestId(/^map-region-/)).toHaveLength(10);
    expect(screen.getByText(/Next:/)).toBeTruthy();
  });
  it('fires goBack from the header', () => {
    const goBack = vi.fn();
    render(<MapScreen goBack={goBack} />);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** — `npx vitest run src/tests/MapScreen.test.tsx`

- [ ] **Step 3: Implement `src/components/practice/MapScreen.tsx`**

```tsx
import React from 'react';
import ScreenHeader from '../shared/ScreenHeader';
import { useStats } from '../../context/StatsContext';
import { regionStatuses, restoredCount, nextRegion, MAP_REGIONS } from '../../lib/gamification/mapRegions';
// REGIONS is untyped JS cultural data: key -> { title, sub, icon, color }
import { REGIONS } from '../../data/cultural/regions.js';

type RegionMeta = { title?: string; sub?: string; icon?: string };
const META = REGIONS as Record<string, RegionMeta>;

export default function MapScreen({ goBack }: { goBack: () => void }) {
  const { stats } = useStats();
  const xp = stats?.xp ?? 0;
  const statuses = regionStatuses(xp);
  const done = restoredCount(xp);
  const next = nextRegion(xp);
  const nextTitle = next ? META[next.key]?.title || next.key : null;
  const pct = Math.round((done / MAP_REGIONS.length) * 100);

  return (
    <div style={shell}>
      <ScreenHeader title="Vaša Hrvatska" goBack={goBack} />
      <div style={{ padding: 14 }}>
        <div style={progBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <span style={progLabel}>Regions restored</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FFE070', fontVariantNumeric: 'tabular-nums' }}>
              {done} / {MAP_REGIONS.length}
            </span>
          </div>
          <div style={meter}><div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 6 }} /></div>
          {next && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 8, textAlign: 'center' }}>
              Next: <b style={{ color: '#FFE070' }}>{nextTitle}</b> — {next.xpToGo.toLocaleString()} XP to go
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {statuses.map((r) => {
            const meta = META[r.key] || {};
            const isNext = next?.key === r.key;
            return (
              <div
                key={r.key}
                data-testid={`map-region-${r.key}`}
                style={r.restored ? tileOn : isNext ? tileNext : tileOff}
              >
                <div style={{ fontSize: 20 }}>{meta.icon || '📍'}</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 3 }}>{meta.title || r.key}</div>
                {r.restored ? (
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>{meta.sub || ''}</div>
                ) : isNext ? (
                  <div style={{ fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7dd3fc', fontWeight: 800, marginTop: 2 }}>
                    ▶ next · {r.xpThreshold.toLocaleString()} XP
                  </div>
                ) : (
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>🔒 {r.xpThreshold.toLocaleString()} XP</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
  color: '#fff',
};
const progBox: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '11px 13px', marginBottom: 14 };
const progLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(200,152,10,.9)', fontWeight: 800 };
const meter: React.CSSProperties = { height: 7, background: 'rgba(255,255,255,.12)', borderRadius: 6, overflow: 'hidden' };
const tileBase: React.CSSProperties = { borderRadius: 13, padding: '11px 10px', minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const tileOn: React.CSSProperties = { ...tileBase, background: 'linear-gradient(150deg,rgba(200,152,10,.22),rgba(10,35,72,.5))', border: '1px solid rgba(200,152,10,.55)' };
const tileOff: React.CSSProperties = { ...tileBase, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.16)', opacity: 0.6 };
const tileNext: React.CSSProperties = { ...tileBase, background: 'rgba(56,189,248,.10)', border: '1px solid rgba(56,189,248,.6)' };
```

- [ ] **Step 4: Run — expect PASS** — `npx vitest run src/tests/MapScreen.test.tsx`
- [ ] **Step 5: tsc + vitest** — `npx tsc -p tsconfig.json --noEmit` then `npx vitest run` (no regressions)
- [ ] **Step 6: Commit**
```bash
git add src/components/practice/MapScreen.tsx src/tests/MapScreen.test.tsx
git commit -m "feat(gamification): Map-of-Croatia screen (region grid + progress)"
```

---

## Task 3: Route the Map screen

**Files:** Modify `src/components/AppRouter.tsx`

- [ ] **Step 1: Add the lazy import** beside `ArcadeHub`/`AlkaScreen` declarations:
```typescript
const MapScreen = lazyWithReload(() => import('./practice/MapScreen'));
```
- [ ] **Step 2: Add the route block** beside the `arcade`/`alka` blocks (use the exact `currentScreen === 'map'` text for the guard regex):
```tsx
{currentScreen === 'map' && (
  <ScreenErrorBoundary key="map" name="map">
    <MapScreen goBack={goBack} />
  </ScreenErrorBoundary>
)}
```
- [ ] **Step 3: Verify** — `npx tsc -p tsconfig.json --noEmit`; `grep -n "currentScreen === 'map'" src/components/AppRouter.tsx`
- [ ] **Step 4: Commit**
```bash
git add src/components/AppRouter.tsx
git commit -m "feat(gamification): route the Map screen"
```

---

## Task 4: "Your Croatia" entry card in the Arcade hub

**Files:** Modify `src/components/practice/ArcadeHub.tsx`

The hub currently takes `{ goBack, onLaunch }` and renders `MODES`. Add a prominent "Your Croatia" card ABOVE the modes list (showing restored count), which calls `onLaunch('map')`. Read the XP from StatsContext for the count.

- [ ] **Step 1: Add imports** at the top of `ArcadeHub.tsx`:
```tsx
import { useStats } from '../../context/StatsContext';
import { restoredCount, MAP_REGIONS } from '../../lib/gamification/mapRegions';
```
- [ ] **Step 2: Inside the component**, before the modes list (after `ScreenHeader`), compute the count and render the card. Add at the start of the component body:
```tsx
  const { stats } = useStats();
  const restored = restoredCount(stats?.xp ?? 0);
```
And render this as the FIRST child inside the `<div style={{ padding: 16 }}>` (before the `{MODES.map(...)}`):
```tsx
        <button
          data-testid="arcade-your-croatia"
          onClick={() => onLaunch('map')}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
            background: 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(10,35,72,.45))',
            border: '1px solid rgba(74,222,128,.45)', borderRadius: 15, padding: 13, marginBottom: 14,
            color: '#fff', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 26 }}>🗺️</span>
          <span>
            <span style={{ display: 'block', fontWeight: 900, fontSize: 15 }}>Your Croatia</span>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.65)' }}>Restore your heritage map</span>
          </span>
          <span style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <b style={{ display: 'block', fontSize: 18, fontWeight: 900, color: '#4ade80' }}>{restored}/{MAP_REGIONS.length}</b>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>regions</span>
          </span>
        </button>
```
- [ ] **Step 3: Verify** — `npx tsc -p tsconfig.json --noEmit`; existing `ArcadeHub.test.tsx` still passes (it renders without a StatsContext provider — since `useStats` is the real hook now, the test may need a stub). Run `npx vitest run src/tests/ArcadeHub.test.tsx`. If it fails because `useStats` has no provider, add `vi.mock('../context/StatsContext', () => ({ useStats: () => ({ stats: { xp: 0 } }) }));` at the top of `ArcadeHub.test.tsx` and re-run. Also add an assertion: `expect(screen.getByTestId('arcade-your-croatia')).toBeTruthy()` and that clicking it calls `onLaunch('map')`.
- [ ] **Step 4: Commit**
```bash
git add src/components/practice/ArcadeHub.tsx src/tests/ArcadeHub.test.tsx
git commit -m "feat(gamification): Your Croatia entry card at top of Arcade"
```

---

## Task 5: Extend the route guard for `map`

**Files:** Modify `src/tests/arcade-routes.test.ts`

- [ ] **Step 1: Add a test** asserting the Map route exists (the Your-Croatia card launches `'map'`):
```typescript
  it('the Map screen (Your Croatia) is routed', () => {
    expect(ROUTED.has('map')).toBe(true);
  });
```
(Insert inside the existing `describe('Arcade — no dead modes', ...)` block; `ROUTED` is already defined at module scope.)
- [ ] **Step 2: Run** — `npx vitest run src/tests/arcade-routes.test.ts` (expect PASS — Task 3 added the route)
- [ ] **Step 3: Commit**
```bash
git add src/tests/arcade-routes.test.ts
git commit -m "test(gamification): guard the Map route against dead-lesson regression"
```

---

## Task 6: Final verification gate
- [ ] **Step 1:** `npx tsc -p tsconfig.json --noEmit`
- [ ] **Step 2:** `npx vitest run` (all pass)
- [ ] **Step 3:** `npx eslint src functions --max-warnings=0`
- [ ] **Step 4:** `npx vite build` (succeeds; MapScreen chunk emitted)
- [ ] **Step 5:** Confirm no new file trips `max-lines` (all well under 800).

---

## Self-Review (against spec)
- §Regions (10 REGIONS keys) → Task 1 MAP_REGIONS. ✓
- §Restore trigger (cumulative XP milestones) → Task 1 regionStatuses/restoredCount. ✓
- §Visual (tile grid, restored/locked/next, progress bar, next hint, premium register) → Task 2. ✓
- §Placement (Your Croatia card top of Arcade) → Task 4. ✓
- §Routing + dead-lesson guard → Tasks 3, 5. ✓
- §Progress protection (only increases — XP only grows, statuses derived) → Task 1. ✓
- Out-of-scope (SVG map, region detail, Home hook, content-linked restore) → not built. ✓

**Type consistency:** `MapRegionDef`, `RegionStatus`, `regionStatuses/restoredCount/nextRegion`, `MAP_REGIONS` defined in Task 1 and consumed unchanged in Tasks 2 & 4. `map-region-${key}` + `arcade-your-croatia` testids used in Tasks 2 & 4 tests.
**Placeholders:** none — every code step is complete.
