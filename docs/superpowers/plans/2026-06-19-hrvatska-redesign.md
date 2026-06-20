# Phase 7b — Hrvatska (Discover) Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overloaded `CroatiaTab` (~40 stacked entry points + sticky anchor strip) with a calm theme-doors surface — a "Danas u Hrvatskoj" daily card + five host-voiced doors (Priče/baka, Krajevi/marko, Život/ana, Povijest i jezik/kovač, Mediji/ivo) — without orphaning any entry point and without changing any content screen.

**Architecture:** A re-presentation layer that mirrors the shipped Razgovor (Phase 7a) pattern: a `doors.ts` registry (`DOORS` + `DOOR_ITEMS` + `launchDoorItem`), a `HrvatskaTab` (Danas + door rows), and a `DoorScreen` (host hero + that door's item cards). Door cards launch the same `setScr` screen ids the old cards launched. Priče embeds the existing `StoriesTab`; Mediji embeds the existing `MediaTab`. A `hrvatska.test.ts` no-orphan unit gate proves every id is covered.

**Tech Stack:** React 18 + Vite + TypeScript; plain CSS + tokens (no Tailwind); Outfit + Playfair fonts; Vitest + @testing-library/react (jsdom); Playwright e2e (Desktop Chrome gated).

## Global Constraints

- Plain CSS + inline styles + tokens. NO Tailwind. Fonts: Outfit (UI), Playfair Display (headings).
- Palette: Adriatic teal `#0e7490`/`#164e63`, Croatian red `#D40030`, terracotta `#c2410c`, Korčula stone `#f5f0e8`, gold `#C8980A`. For small bold text on a gold-tint background use dark gold `#6b4e0a` (≥6.8:1), never `#9a7407` (3.81:1 — fails WCAG AA).
- Character art = locked flat cast via `CharacterPortrait` with `name: CharacterName = 'baka'|'ana'|'kovac'|'ivo'|'marko'`.
- Branch `feat/uxui-hrvatska-phase7b` (already checked out; spec already committed). Never push to master. Merging deploys to prod (CF Pages auto-deploy).
- ASCII-only commit messages, each ending with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- No orphaned entry points — enforced by the Task 1 unit gate.
- Behaviour untouched — only navigation/presentation changes; reuse `StoriesTab` + `MediaTab` unchanged; launch the same screen ids.
- The `easter` card keeps its seasonal date gate (March 20 – April 30) and its completion gate.
- CI gates the Desktop Chrome e2e project only. `*-audit.spec.js`, `heavy-user-*.spec.js`, `offline.spec.js`, `smoke.spec.js` are `testIgnore`d.

---

## File Structure

- `src/components/hrvatska/doors.ts` — **new.** Registry: `DoorId`, `Door`, `DoorItem` types; `DOORS` (5); `DOOR_ITEMS` (40); `MUST_NOT_ORPHAN`; `itemsForDoor`; `recommendedDaily`; `launchDoorItem`. Pure data + pure functions, no React.
- `src/components/hrvatska/hrvatska.test.ts` — **new.** No-orphan + registry-integrity unit gate.
- `src/components/hrvatska/DoorScreen.tsx` — **new.** Door interior: back bar + host hero + recommended item + item cards; embeds `StoriesTab` (price) / `MediaTab` (mediji).
- `src/components/hrvatska/DoorScreen.test.tsx` — **new.** Component tests (embeds mocked).
- `src/components/hrvatska/HrvatskaTab.tsx` — **new.** Default surface: hero + Danas card + 5 door rows; opens `DoorScreen`.
- `src/components/hrvatska/HrvatskaTab.test.tsx` — **new.** Component tests.
- `src/components/AppRouter.tsx` — **modify.** Swap the `tab === 'croatia'` branch + lazy import from `CroatiaTab` to `HrvatskaTab`.
- `src/components/croatia/CroatiaTab.tsx` — **delete.** Replaced.
- `src/components/croatia/CultureTab.tsx` — **delete.** All cards re-presented via `doors.ts`.
- `src/components/croatia/DiscoverTab.tsx` — **delete.** `dialect_awareness` card re-presented in Povijest; rotating Hrvoje tip dropped (redundant with family voice lines); featured-letter preview superseded by the Priče door.
- `src/components/croatia/StoriesTab.tsx` — **keep, unchanged.** Reused by `DoorScreen` (price).
- `src/components/croatia/MediaTab.tsx` — **keep, unchanged.** Reused by `DoorScreen` (mediji).
- `e2e/fixtures/seed-auth.js` — **modify.** Add `openDoor(page, name)` helper.
- `e2e/croatia.spec.js` — **rewrite** for the doors surface.
- `e2e/navigation.spec.js` — **modify** one test's heading assertion.
- `e2e/accessibility.spec.js` — **modify** one `waitFor` heading.
- `e2e/pronunciation.spec.js` — **modify** the stale "Discover/Culture sub-tab" tests.

---

## Task 1: Doors registry + no-orphan gate

**Files:**
- Create: `src/components/hrvatska/doors.ts`
- Test: `src/components/hrvatska/hrvatska.test.ts`

**Interfaces:**
- Consumes: `CharacterName` from `../family/portraits`.
- Produces:
  - `type DoorId = 'price' | 'krajevi' | 'zivot' | 'povijest' | 'mediji'`
  - `interface Door { id: DoorId; title: string; host: CharacterName; icon: string; tint: string; voiceLine: { hr: string; en: string }; embeds?: 'stories' | 'media' }`
  - `interface DoorItem { id: string; doorId: DoorId; icon: string; title: string; sub: string; color: string; seasonal?: 'easter' }`
  - `const DOORS: Door[]` (length 5)
  - `const DOOR_ITEMS: DoorItem[]` (length 40)
  - `const MUST_NOT_ORPHAN: string[]`
  - `function itemsForDoor(id: DoorId): DoorItem[]`
  - `function recommendedDaily(dayIdx: number): DoorItem`
  - `function launchDoorItem(item: { id: string }, nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void }): void`

- [ ] **Step 1: Write the failing test**

Create `src/components/hrvatska/hrvatska.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  DOORS,
  DOOR_ITEMS,
  MUST_NOT_ORPHAN,
  itemsForDoor,
  recommendedDaily,
  launchDoorItem,
} from './doors';

const VALID_HOSTS = ['baka', 'ana', 'kovac', 'ivo', 'marko'];
const DOOR_IDS = DOORS.map((d) => d.id);

describe('Hrvatska doors registry', () => {
  it('has five doors with valid hosts and a voice line', () => {
    expect(DOORS).toHaveLength(5);
    for (const d of DOORS) {
      expect(VALID_HOSTS).toContain(d.host);
      expect(d.voiceLine.hr.length).toBeGreaterThan(0);
      expect(d.voiceLine.en.length).toBeGreaterThan(0);
    }
  });

  it('every item belongs to a real door', () => {
    for (const it of DOOR_ITEMS) expect(DOOR_IDS).toContain(it.doorId);
  });

  it('covers every must-not-orphan entry point', () => {
    const ids = new Set(DOOR_ITEMS.map((i) => i.id));
    const missing = MUST_NOT_ORPHAN.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('has no stale items (every item id is a must-not-orphan id)', () => {
    const required = new Set(MUST_NOT_ORPHAN);
    const stale = DOOR_ITEMS.filter((i) => !required.has(i.id)).map((i) => i.id);
    expect(stale).toEqual([]);
  });

  it('has no duplicate item ids', () => {
    const ids = DOOR_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('itemsForDoor returns only that door’s items', () => {
    const krajevi = itemsForDoor('krajevi');
    expect(krajevi.length).toBeGreaterThan(0);
    expect(krajevi.every((i) => i.doorId === 'krajevi')).toBe(true);
    expect(krajevi.map((i) => i.id)).toContain('crmap');
  });

  it('recommendedDaily wraps and never returns a seasonal item', () => {
    for (let d = 0; d < 12; d++) {
      const item = recommendedDaily(d);
      expect(item).toBeTruthy();
      expect(item.seasonal).toBeUndefined();
      expect(DOOR_ITEMS.find((i) => i.id === item.id)).toBeTruthy();
    }
    expect(recommendedDaily(0).id).toBe(recommendedDaily(4).id); // pool of 4 wraps
    expect(recommendedDaily(-1).id).toBe(recommendedDaily(3).id); // negative-safe
  });

  it('launchDoorItem sets curEx then navigates to the screen id', () => {
    const calls: string[] = [];
    launchDoorItem(
      { id: 'crmap' },
      { setScr: (s) => calls.push('scr:' + s), sCurEx: (e) => calls.push('ex:' + e) },
    );
    expect(calls).toEqual(['ex:crmap', 'scr:crmap']);
  });

  it('the two embed doors are declared', () => {
    expect(DOORS.find((d) => d.id === 'price')?.embeds).toBe('stories');
    expect(DOORS.find((d) => d.id === 'mediji')?.embeds).toBe('media');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/hrvatska/hrvatska.test.ts`
Expected: FAIL — `Cannot find module './doors'`.

- [ ] **Step 3: Write the registry**

Create `src/components/hrvatska/doors.ts`:

```ts
import type { CharacterName } from '../family/portraits';

export type DoorId = 'price' | 'krajevi' | 'zivot' | 'povijest' | 'mediji';

export interface Door {
  id: DoorId;
  title: string;
  host: CharacterName;
  icon: string;
  tint: string; // rgba seed for the hero gradient
  voiceLine: { hr: string; en: string };
  embeds?: 'stories' | 'media'; // reuse an existing sub-component inside the door
}

export interface DoorItem {
  id: string; // the screen id handed to setScr (unchanged from the old cards)
  doorId: DoorId;
  icon: string;
  title: string;
  sub: string;
  color: string;
  seasonal?: 'easter'; // rendered only during the Easter window
}

export const DOORS: Door[] = [
  {
    id: 'price',
    title: 'Priče',
    host: 'baka',
    icon: '📖',
    tint: 'rgba(194,65,12,.14)',
    voiceLine: {
      hr: 'Dođi, sjedni — ispričat ću ti priču.',
      en: 'Come, sit — let me tell you a story.',
    },
    embeds: 'stories',
  },
  {
    id: 'krajevi',
    title: 'Krajevi',
    host: 'marko',
    icon: '🗺️',
    tint: 'rgba(5,150,105,.14)',
    voiceLine: {
      hr: 'Idemo putovati — od mora do Slavonije.',
      en: "Let's travel — from the sea to Slavonia.",
    },
  },
  {
    id: 'zivot',
    title: 'Život',
    host: 'ana',
    icon: '🏡',
    tint: 'rgba(14,116,144,.14)',
    voiceLine: {
      hr: 'Svakodnevni život — trgovina, kafić, prijatelji.',
      en: 'Everyday life — shops, cafés, friends.',
    },
  },
  {
    id: 'povijest',
    title: 'Povijest i jezik',
    host: 'kovac',
    icon: '🏛️',
    tint: 'rgba(124,58,237,.14)',
    voiceLine: {
      hr: 'Povijest i jezik — odakle dolazimo.',
      en: 'History and language — where we come from.',
    },
  },
  {
    id: 'mediji',
    title: 'Mediji',
    host: 'ivo',
    icon: '🎬',
    tint: 'rgba(37,99,235,.14)',
    voiceLine: {
      hr: 'TV, glazba, vijesti — kako se stvarno priča.',
      en: 'TV, music, news — how people really talk.',
    },
    embeds: 'media',
  },
];

export const DOOR_ITEMS: DoorItem[] = [
  // ── PRIČE (baka) ──
  { id: 'baka_summer', doorId: 'price', icon: '📖', title: "Baka's Summer", sub: '16-chapter story', color: '#b45309' },
  { id: 'survival_dinner', doorId: 'price', icon: '🍽️', title: 'At the Table', sub: 'Navigate any dinner', color: '#16a34a' },
  { id: 'storymode', doorId: 'price', icon: '📖', title: 'Immersive Stories', sub: 'AI stories set in Croatia', color: '#0e7490' },
  { id: 'heritage', doorId: 'price', icon: '🧬', title: 'Your Heritage', sub: 'Discover your Croatian roots', color: '#b45309' },
  { id: 'postcard', doorId: 'price', icon: '📮', title: 'Postcard', sub: 'Write & share in Croatian', color: '#7c3aed' },
  { id: 'diaspora', doorId: 'price', icon: '💙', title: 'Diaspora Croatian', sub: 'Code-switching & heritage language', color: '#0e7490' },
  { id: 'lifeevents', doorId: 'price', icon: '🎊', title: 'Life Events', sub: 'Weddings, funerals, baptisms', color: '#7c3aed' },
  { id: 'easter', doorId: 'price', icon: '🥚', title: 'Uskrs u Hrvatskoj', sub: 'Easter traditions & phrases', color: '#166534', seasonal: 'easter' },

  // ── KRAJEVI (marko) ──
  { id: 'crmap', doorId: 'krajevi', icon: '🗺️', title: 'Interaktivna karta', sub: 'Cities, parks, beaches & islands', color: '#0e7490' },
  { id: 'region_vukovar', doorId: 'krajevi', icon: '🕯️', title: 'Vukovar', sub: 'Hero city — a deep dive', color: '#dc2626' },
  { id: 'region_zagreb', doorId: 'krajevi', icon: '🏛️', title: 'Zagreb', sub: "Croatia's capital", color: '#0e7490' },
  { id: 'region_split', doorId: 'krajevi', icon: '🌊', title: 'Split', sub: 'Rome on the Adriatic', color: '#0284c7' },
  { id: 'region_mostar', doorId: 'krajevi', icon: '🌉', title: 'Mostar', sub: 'The bridge reborn', color: '#7c3aed' },
  { id: 'region_tomislavgrad', doorId: 'krajevi', icon: '👑', title: 'Tomislavgrad', sub: 'Where the kingdom was born', color: '#b45309' },
  { id: 'region_knin', doorId: 'krajevi', icon: '🏰', title: 'Knin', sub: 'Liberated August 5, 1995', color: '#dc2626' },
  { id: 'region_labin', doorId: 'krajevi', icon: '⛵', title: 'Labin & Rabac', sub: 'Our home in Istria', color: '#0e7490' },
  { id: 'region_bibinje', doorId: 'krajevi', icon: '🏖️', title: 'Bibinje & Zadar', sub: 'Dalmatian gateway', color: '#0284c7' },
  { id: 'region_hercegovina', doorId: 'krajevi', icon: '⚔️', title: 'Hercegovina', sub: 'Croatian heritage', color: '#b45309' },
  { id: 'region_vinkovci', doorId: 'krajevi', icon: '🏛️', title: 'Vinkovci', sub: '8,300 years of history', color: '#78716c' },

  // ── ŽIVOT (ana) ──
  { id: 'grocery', doorId: 'zivot', icon: '🛒', title: 'Grocery Shopping', sub: 'Supermarket vocab', color: '#16a34a' },
  { id: 'recipes', doorId: 'zivot', icon: '🍳', title: 'Croatian Recipes', sub: 'Traditional dishes', color: '#b45309' },
  { id: 'roleplay', doorId: 'zivot', icon: '🎭', title: 'Role-Play', sub: 'Real-life conversations', color: '#7c3aed' },
  { id: 'school', doorId: 'zivot', icon: '🏫', title: 'School Kit', sub: 'For parents & students', color: '#0e7490' },
  { id: 'friends', doorId: 'zivot', icon: '🤝', title: 'Making Friends', sub: 'Social life', color: '#16a34a' },
  { id: 'foodorder', doorId: 'zivot', icon: '🍕', title: 'Ordering Food', sub: 'Restaurants & cafés', color: '#b45309' },
  { id: 'transport', doorId: 'zivot', icon: '🚌', title: 'Transport', sub: 'Buses, taxis & trams', color: '#0284c7' },
  { id: 'emergency', doorId: 'zivot', icon: '🚨', title: 'Emergency', sub: 'Essential phrases', color: '#dc2626' },
  { id: 'practical', doorId: 'zivot', icon: '💼', title: 'Practical Life', sub: 'Banks, doctors, admin', color: '#78716c' },
  { id: 'basketball', doorId: 'zivot', icon: '🏀', title: 'At Basketball', sub: 'Croatian basketball', color: '#b45309' },
  { id: 'gym', doorId: 'zivot', icon: '🏋️', title: 'At the Gym', sub: 'Fitness vocabulary', color: '#16a34a' },
  { id: 'kafic', doorId: 'zivot', icon: '☕', title: 'U Kafiću', sub: 'The art of Croatian coffee culture', color: '#c2410c' },

  // ── POVIJEST I JEZIK (kovac) ──
  { id: 'history', doorId: 'povijest', icon: '🇭🇷', title: 'Domovinski Rat', sub: '1991–1995 Homeland War', color: '#dc2626' },
  { id: 'kings', doorId: 'povijest', icon: '👑', title: 'Croatian Kings', sub: 'Medieval dynasty', color: '#b45309' },
  { id: 'civic', doorId: 'povijest', icon: '🏛️', title: 'Civic Croatian', sub: 'Vocabulary to read the news', color: '#16a34a' },
  { id: 'dialect_awareness', doorId: 'povijest', icon: '🗣️', title: 'Dialect Explorer', sub: 'Što vs Ča vs Kaj', color: '#2563eb' },
  { id: 'immersion', doorId: 'povijest', icon: '🌊', title: 'Immersion Hub', sub: 'A1 → C2 pathway', color: '#0e7490' },

  // ── MEDIJI (ivo) ──
  { id: 'texting', doorId: 'mediji', icon: '📱', title: 'Texting & Slang', sub: 'How Croatians text', color: '#7c3aed' },
  { id: 'croatia_today', doorId: 'mediji', icon: '📰', title: 'Croatia Today', sub: 'Daily Croatian news', color: '#0e7490' },
  { id: 'croatianews', doorId: 'mediji', icon: '🗞️', title: 'Croatian News', sub: 'Real news at your level', color: '#0369a1' },
  { id: 'phraseofday', doorId: 'mediji', icon: '💬', title: 'Phrase of the Day', sub: 'Daily cultural expressions', color: '#db2777' },
];

// Every entry point that must remain reachable. Equal to the set of DOOR_ITEMS
// ids; the unit gate asserts coverage in both directions. The StoriesTab letters
// (price) and the MediaTab carousels (mediji) stay reachable via the door embeds,
// asserted separately in DoorScreen.test.tsx.
export const MUST_NOT_ORPHAN: string[] = DOOR_ITEMS.map((i) => i.id);

export function itemsForDoor(id: DoorId): DoorItem[] {
  return DOOR_ITEMS.filter((i) => i.doorId === id);
}

// Non-seasonal daily rotation surfaced on the "Danas u Hrvatskoj" card.
const DANAS_POOL = ['phraseofday', 'croatia_today', 'croatianews', 'postcard'];

export function recommendedDaily(dayIdx: number): DoorItem {
  const n = DANAS_POOL.length;
  const idx = ((dayIdx % n) + n) % n;
  const id = DANAS_POOL[idx]!;
  return DOOR_ITEMS.find((i) => i.id === id)!;
}

/** Shared launcher: key the activity by the screen id, then navigate. */
export function launchDoorItem(
  item: { id: string },
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void },
): void {
  nav.sCurEx?.(item.id);
  nav.setScr(item.id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/hrvatska/hrvatska.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/hrvatska/doors.ts src/components/hrvatska/hrvatska.test.ts
git commit -m "feat(hrvatska): doors registry + no-orphan gate

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: DoorScreen

**Files:**
- Create: `src/components/hrvatska/DoorScreen.tsx`
- Test: `src/components/hrvatska/DoorScreen.test.tsx`

**Interfaces:**
- Consumes: `DOORS`, `itemsForDoor`, `launchDoorItem`, `type DoorId`, `type DoorItem` from `./doors`; `CharacterPortrait` from `../family/CharacterPortrait`; `StoriesTab` from `../croatia/StoriesTab`; `MediaTab` from `../croatia/MediaTab`.
- Produces: `export default function DoorScreen(props: { doorId: DoorId; setScr: (s: string) => void; sCurEx?: (e: string) => void; onBack: () => void }): JSX.Element` — root element has `data-testid="door-screen"`; back button text is `← Hrvatska`.

- [ ] **Step 1: Write the failing test**

Create `src/components/hrvatska/DoorScreen.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Embeds use AppContext internally — stub them so DoorScreen renders in isolation.
vi.mock('../croatia/StoriesTab', () => ({ default: () => <div data-testid="stories-embed" /> }));
vi.mock('../croatia/MediaTab', () => ({ default: () => <div data-testid="media-embed" /> }));

import DoorScreen from './DoorScreen';

describe('DoorScreen', () => {
  beforeEach(() => localStorage.clear());

  it('renders back bar, host portrait, and Krajevi region cards', () => {
    render(<DoorScreen doorId="krajevi" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('← Hrvatska')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-marko')).toBeInTheDocument();
    expect(screen.getByText('Zagreb')).toBeInTheDocument();
    expect(screen.getByText('Interaktivna karta')).toBeInTheDocument();
  });

  it('launches a card via setScr + sCurEx', () => {
    const setScr = vi.fn();
    const sCurEx = vi.fn();
    render(<DoorScreen doorId="krajevi" setScr={setScr} sCurEx={sCurEx} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Zagreb'));
    expect(sCurEx).toHaveBeenCalledWith('region_zagreb');
    expect(setScr).toHaveBeenCalledWith('region_zagreb');
  });

  it('embeds the Stories sub-tab inside the Priče door', () => {
    render(<DoorScreen doorId="price" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('portrait-baka')).toBeInTheDocument();
    expect(screen.getByText("Baka's Summer")).toBeInTheDocument();
    expect(screen.getByTestId('stories-embed')).toBeInTheDocument();
  });

  it('embeds the Media sub-tab inside the Mediji door', () => {
    render(<DoorScreen doorId="mediji" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('media-embed')).toBeInTheDocument();
  });

  it('hides the seasonal Easter card outside the Easter window', () => {
    // System clock in CI is outside Mar 20 – Apr 30 for most of the year; assert the
    // card is gated by checking it is absent when the date is mocked to June.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1)); // June 1
    render(<DoorScreen doorId="price" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Uskrs u Hrvatskoj')).toBeNull();
    vi.useRealTimers();
  });

  it('back button calls onBack', () => {
    const onBack = vi.fn();
    render(<DoorScreen doorId="zivot" setScr={vi.fn()} sCurEx={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('← Hrvatska'));
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/hrvatska/DoorScreen.test.tsx`
Expected: FAIL — `Cannot find module './DoorScreen'`.

- [ ] **Step 3: Implement DoorScreen**

Create `src/components/hrvatska/DoorScreen.tsx`:

```tsx
import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import StoriesTab from '../croatia/StoriesTab';
import MediaTab from '../croatia/MediaTab';
import { DOORS, itemsForDoor, launchDoorItem, type DoorId, type DoorItem } from './doors';

function isEasterSeason(): boolean {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return (m === 3 && d >= 20) || (m === 4 && d <= 30);
}

function ItemCard({
  item,
  nav,
}: {
  item: DoorItem;
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void };
}) {
  return (
    <button
      onClick={() => launchDoorItem(item, nav)}
      className="exercise-card"
      style={{ borderLeftColor: item.color, border: `1.5px solid ${item.color}25`, borderLeftWidth: 3 }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${item.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--heading)',
            lineHeight: 1.2,
            marginBottom: 2,
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', lineHeight: 1.3 }}>
          {item.sub}
        </div>
      </div>
    </button>
  );
}

export default function DoorScreen({
  doorId,
  setScr,
  sCurEx,
  onBack,
}: {
  doorId: DoorId;
  setScr: (s: string) => void;
  sCurEx?: (e: string) => void;
  onBack: () => void;
}) {
  const door = DOORS.find((d) => d.id === doorId)!;
  const nav = { setScr, sCurEx };
  const easter = isEasterSeason();
  const items = itemsForDoor(doorId).filter((i) => (i.seasonal === 'easter' ? easter : true));
  const recommended = items[0];
  const rest = items.slice(1);

  return (
    <div data-testid="door-screen">
      {/* back bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bar-bg)',
            border: '1px solid var(--card-b)',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            color: '#0e7490',
            padding: '6px 11px',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          ← Hrvatska
        </button>
        <span
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--heading)',
          }}
        >
          {door.title}
        </span>
      </div>

      {/* host hero */}
      <div
        style={{
          position: 'relative',
          minHeight: 132,
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 16,
          background: `linear-gradient(135deg,${door.tint},rgba(14,116,144,.28))`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          padding: 14,
        }}
      >
        <span
          style={{
            flex: 'none',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg,#C8980A,#e0b84a)',
            display: 'flex',
          }}
        >
          <CharacterPortrait name={door.host} size={64} />
        </span>
        <span style={{ flex: 1, color: 'var(--heading)' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'Playfair Display',serif",
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {door.voiceLine.hr}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 3 }}>
            {door.voiceLine.en}
          </span>
        </span>
      </div>

      {/* recommended */}
      {recommended && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--subtext)',
              margin: '2px 2px 8px',
            }}
          >
            Za početak
          </div>
          <div style={{ marginBottom: 16 }}>
            <ItemCard item={recommended} nav={nav} />
          </div>
        </>
      )}

      {/* the rest of the door's cards */}
      {rest.length > 0 && (
        <div className="g2" style={{ gap: 8 }}>
          {rest.map((item) => (
            <ItemCard key={item.id} item={item} nav={nav} />
          ))}
        </div>
      )}

      {/* embedded sub-tab (Stories for Priče, Media for Mediji) */}
      {door.embeds === 'stories' && (
        <div style={{ marginTop: 18 }}>
          <StoriesTab />
        </div>
      )}
      {door.embeds === 'media' && (
        <div style={{ marginTop: 18 }}>
          <MediaTab />
        </div>
      )}
    </div>
  );
}
```

> Note on the `← Hrvatska` literal: write the actual back-arrow character `← Hrvatska` in the source (the test uses the same literal via its `←` escape). Same for the Croatian diacritics shown as `\u....` above — type the real characters (`Priče`, `Za početak`, `Što`, `U Kafiću`, etc.) in the `.tsx`/`.ts` source; the escapes here are only so this Markdown file stays ASCII per the commit-message rule.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/hrvatska/DoorScreen.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/hrvatska/DoorScreen.tsx src/components/hrvatska/DoorScreen.test.tsx
git commit -m "feat(hrvatska): DoorScreen interior with host hero + embeds

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: HrvatskaTab (default surface)

**Files:**
- Create: `src/components/hrvatska/HrvatskaTab.tsx`
- Test: `src/components/hrvatska/HrvatskaTab.test.tsx`

**Interfaces:**
- Consumes: `DOORS`, `recommendedDaily`, `launchDoorItem`, `type DoorId` from `./doors`; `CharacterPortrait` from `../family/CharacterPortrait`; `DoorScreen` from `./DoorScreen`.
- Produces: `export default function HrvatskaTab(props: { setScr: (s: string) => void; sCurEx?: (e: string) => void }): JSX.Element`. Renders an element containing the text `Danas u Hrvatskoj`, the title `Hrvatska`, and all five door titles. Manages local `openDoor` state and renders `DoorScreen` when a door is open.

- [ ] **Step 1: Write the failing test**

Create `src/components/hrvatska/HrvatskaTab.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../croatia/StoriesTab', () => ({ default: () => <div data-testid="stories-embed" /> }));
vi.mock('../croatia/MediaTab', () => ({ default: () => <div data-testid="media-embed" /> }));

import HrvatskaTab from './HrvatskaTab';

const props = { setScr: vi.fn(), sCurEx: vi.fn() };

describe('HrvatskaTab', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Danas card + five door rows', () => {
    render(<HrvatskaTab {...props} />);
    expect(screen.getByText('Danas u Hrvatskoj')).toBeInTheDocument();
    for (const title of ['Priče', 'Krajevi', 'Život', 'Povijest i jezik', 'Mediji']) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
  });

  it('opens a door interior on tap and shows the back bar', () => {
    render(<HrvatskaTab {...props} />);
    fireEvent.click(screen.getByText('Krajevi'));
    expect(screen.getByTestId('door-screen')).toBeInTheDocument();
    expect(screen.getByText('← Hrvatska')).toBeInTheDocument();
  });

  it('the Danas card launches a screen directly', () => {
    const setScr = vi.fn();
    render(<HrvatskaTab setScr={setScr} sCurEx={vi.fn()} />);
    fireEvent.click(screen.getByText('Danas u Hrvatskoj').closest('button')!);
    expect(setScr).toHaveBeenCalled();
  });

  it('back from a door returns to the door list', () => {
    render(<HrvatskaTab {...props} />);
    fireEvent.click(screen.getByText('Krajevi'));
    fireEvent.click(screen.getByText('← Hrvatska'));
    expect(screen.queryByTestId('door-screen')).toBeNull();
    expect(screen.getByText('Danas u Hrvatskoj')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/hrvatska/HrvatskaTab.test.tsx`
Expected: FAIL — `Cannot find module './HrvatskaTab'`.

- [ ] **Step 3: Implement HrvatskaTab**

Create `src/components/hrvatska/HrvatskaTab.tsx`:

```tsx
import React, { useState } from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import DoorScreen from './DoorScreen';
import { DOORS, recommendedDaily, launchDoorItem, type DoorId } from './doors';

interface HrvatskaTabProps {
  setScr: (screen: string) => void;
  sCurEx?: (ex: string) => void;
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export default function HrvatskaTab({ setScr, sCurEx }: HrvatskaTabProps) {
  const [openDoor, setOpenDoor] = useState<DoorId | null>(null);
  const nav = { setScr, sCurEx };

  if (openDoor) {
    return (
      <DoorScreen
        doorId={openDoor}
        setScr={setScr}
        sCurEx={sCurEx}
        onBack={() => setOpenDoor(null)}
      />
    );
  }

  const daily = recommendedDaily(dayOfYear());
  const dailyDoor = DOORS.find((d) => d.id === daily.doorId)!;

  return (
    <div>
      {/* HERO */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: '#c2410c',
            }}
          >
            istraži
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
            }}
          >
            Hrvatska
          </span>
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            marginTop: 10,
            background: 'linear-gradient(90deg,#D40030 0 33%,#fff 33% 66%,#0e7490 66%)',
          }}
        />
      </div>

      {/* DANAS U HRVATSKOJ */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '4px 2px 10px',
        }}
      >
        Danas
      </div>
      <button
        onClick={() => launchDoorItem(daily, nav)}
        style={{
          width: '100%',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          background: 'linear-gradient(145deg,#0e7490 0%,#155e75 55%,#164e63 100%)',
          borderRadius: 20,
          padding: 16,
          color: '#fff',
          boxShadow: '0 10px 28px rgba(14,116,144,.32)',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            flex: 'none',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg,#C8980A,#e0b84a)',
            display: 'flex',
          }}
        >
          <CharacterPortrait name={dailyDoor.host} size={52} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.7)',
            }}
          >
            Danas u Hrvatskoj
          </span>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginTop: 2 }}>
            {daily.title}
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.72)', marginTop: 3 }}>
            {daily.sub}
          </span>
        </span>
        <span
          style={{
            flex: 'none',
            background: 'rgba(255,255,255,.2)',
            border: '1px solid rgba(255,255,255,.3)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Otvori →
        </span>
      </button>

      {/* DOORS */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '4px 2px 10px',
        }}
      >
        Istraži Hrvatsku
      </div>
      {DOORS.map((d) => {
        const recommended = d.id === daily.doorId;
        return (
          <button
            key={d.id}
            onClick={() => setOpenDoor(d.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              background: 'var(--card)',
              border: recommended ? '1.5px solid #C8980A' : '1px solid var(--card-b)',
              borderRadius: 16,
              padding: '11px 13px',
              marginBottom: 10,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              boxShadow: recommended
                ? '0 2px 10px rgba(200,152,10,.18)'
                : '0 1px 3px rgba(0,0,0,.05)',
            }}
          >
            <span style={{ flex: 'none', display: 'flex' }}>
              <CharacterPortrait name={d.host} size={46} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--heading)',
                  lineHeight: 1.15,
                }}
              >
                {d.icon} {d.title}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 2 }}>
                {d.voiceLine.en}
              </span>
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--subtext)', fontSize: 18 }}>›</span>
          </button>
        );
      })}
    </div>
  );
}
```

> Same source-character note as Task 2: type real characters (`istraži`, `Istraži Hrvatsku`, `Otvori →`, `›`, `Priče`, `Život`) in the `.tsx`; the `\u....` forms above keep this plan ASCII.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/hrvatska/HrvatskaTab.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/hrvatska/HrvatskaTab.tsx src/components/hrvatska/HrvatskaTab.test.tsx
git commit -m "feat(hrvatska): HrvatskaTab surface with Danas card + door rows

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire into AppRouter; retire CroatiaTab/CultureTab/DiscoverTab

**Files:**
- Modify: `src/components/AppRouter.tsx:52` (lazy import) and `src/components/AppRouter.tsx:850-858` (the `tab === 'croatia'` branch)
- Delete: `src/components/croatia/CroatiaTab.tsx`, `src/components/croatia/CultureTab.tsx`, `src/components/croatia/DiscoverTab.tsx`

**Interfaces:**
- Consumes: `HrvatskaTab` from `./hrvatska/HrvatskaTab`. `setScr` and `sCurEx` are already in scope at that point in `AppRouter` (the `tab === 'ai'` branch passes both to `RazgovorTab`).

- [ ] **Step 1: Swap the lazy import**

In `src/components/AppRouter.tsx`, replace line 52:

```tsx
const CroatiaTab = lazyWithReload(() => import('./croatia/CroatiaTab'));
```

with:

```tsx
const HrvatskaTab = lazyWithReload(() => import('./hrvatska/HrvatskaTab'));
```

- [ ] **Step 2: Swap the tab branch**

Replace the `tab === 'croatia'` block (lines ~850-858):

```tsx
              {
                // ═══ TAB: CROATIA ═══
                tab === 'croatia' && (
                  <div key="tab-croatia" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="CroatiaTab">
                        <CroatiaTab sCurEx={sCurEx} />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
```

with:

```tsx
              {
                // ═══ TAB: CROATIA (Hrvatska — Phase 7b doors redesign) ═══
                tab === 'croatia' && (
                  <div key="tab-croatia" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="HrvatskaTab">
                        <HrvatskaTab setScr={setScr} sCurEx={sCurEx} />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
```

- [ ] **Step 3: Verify no other importers of the retired files**

Run: `grep -rn "CroatiaTab\|CultureTab\|DiscoverTab" src --include=*.ts --include=*.tsx`
Expected: only the now-self-contained references inside the three files about to be deleted (CroatiaTab imports CultureTab + DiscoverTab). No other file should import them. (StoriesTab/MediaTab are imported by the new DoorScreen — that is expected and correct.)

- [ ] **Step 4: Delete the retired files**

```bash
git rm src/components/croatia/CroatiaTab.tsx src/components/croatia/CultureTab.tsx src/components/croatia/DiscoverTab.tsx
```

- [ ] **Step 5: Typecheck + full unit suite + build**

Run: `npm run typecheck`
Expected: no errors (no dangling imports of the deleted files).

Run: `npm run test -- src/components/hrvatska`
Expected: PASS (all 3 hrvatska specs).

Run: `npm run build`
Expected: build succeeds (Vite emits the new `HrvatskaTab` chunk; no unresolved imports).

- [ ] **Step 6: Commit**

```bash
git add src/components/AppRouter.tsx
git commit -m "feat(hrvatska): mount HrvatskaTab and retire CroatiaTab/CultureTab/DiscoverTab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: E2E migration

**Files:**
- Modify: `e2e/fixtures/seed-auth.js` (add `openDoor`)
- Rewrite: `e2e/croatia.spec.js`
- Modify: `e2e/navigation.spec.js:66-76` (one test)
- Modify: `e2e/accessibility.spec.js:191` (one `waitFor`)
- Modify: `e2e/pronunciation.spec.js:1114-1135` (two stale sub-tab tests)

**Interfaces:**
- Produces: `export async function openDoor(page, name): Promise<void>` in `seed-auth.js` — navigates to `/croatia`, waits for the Danas card, clicks the door whose visible title matches `name` (exact).

- [ ] **Step 1: Add the openDoor fixture**

In `e2e/fixtures/seed-auth.js`, after `openAlat` (around line 140), add:

```js
/**
 * Hrvatska (Phase 7b): the Croatia tab became a doors surface — a "Danas u
 * Hrvatskoj" card + five host-voiced doors (Priče/Krajevi/Život/Povijest i
 * jezik/Mediji). Tab route key is still /croatia. Opens a door by its visible
 * title (exact match so "Život" doesn't collide with substrings).
 */
export async function openDoor(page, name) {
  await page.goto('/croatia');
  await page.getByText('Danas u Hrvatskoj').waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByText(name, { exact: true }).first().click();
}
```

- [ ] **Step 2: Rewrite croatia.spec.js**

Replace the entire contents of `e2e/croatia.spec.js` with:

```js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent, openDoor } from './fixtures/seed-auth.js';

test.describe('Hrvatska tab (doors)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 20_000 });
  });

  test('renders the Danas card + five doors', async ({ page }) => {
    for (const title of ['Priče', 'Krajevi', 'Život', 'Povijest i jezik', 'Mediji']) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }
  });

  test('opening Krajevi shows region cards', async ({ page }) => {
    await openDoor(page, 'Krajevi');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Zagreb').first()).toBeVisible();
    await expect(page.getByText('Interaktivna karta')).toBeVisible();
  });

  test('a region card opens its region screen', async ({ page }) => {
    await openDoor(page, 'Krajevi');
    await page.getByText('Zagreb').first().click();
    // RegionScreen is lazy-loaded; tabs appear after the chunk loads.
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Priče embeds the Stories letters', async ({ page }) => {
    await openDoor(page, 'Priče');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Baka's Summer")).toBeVisible();
  });

  test('Povijest i jezik shows the Domovinski Rat card and opens history', async ({ page }) => {
    await openDoor(page, 'Povijest i jezik');
    const btn = page.locator('button.exercise-card').filter({ hasText: 'Domovinski Rat' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 15_000 });
  });

  test('back from a door returns to the door list', async ({ page }) => {
    await openDoor(page, 'Mediji');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await page.getByText('← Hrvatska').click();
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 3: Fix navigation.spec.js**

In `e2e/navigation.spec.js`, replace the test at lines ~66-76:

```js
  test('navigates to Culture tab and shows History & Regions heading', async ({ page }) => {
    await clickTab(page, 'Croatia');
    // Confirm URL changed then check content first, active class last
    await page.waitForURL('/croatia', { timeout: 20_000 });
    // Heading check with generous timeout for lazy-chunk load on Firefox/WebKit
    await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 20_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });
```

with:

```js
  test('navigates to Croatia tab and shows the Hrvatska doors surface', async ({ page }) => {
    await clickTab(page, 'Croatia');
    // Confirm URL changed then check content first, active class last
    await page.waitForURL('/croatia', { timeout: 20_000 });
    // Danas card with generous timeout for lazy-chunk load on Firefox/WebKit
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 20_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });
```

- [ ] **Step 4: Fix accessibility.spec.js**

In `e2e/accessibility.spec.js` (around line 191), replace:

```js
    // Wait for the Croatia tab heading to confirm content has loaded
    await page.getByRole('heading', { name: /History.*Regions/i }).waitFor({ timeout: 10_000 }).catch(() => {});
```

with:

```js
    // Wait for the Danas card to confirm the Hrvatska doors surface has loaded
    await page.getByText('Danas u Hrvatskoj').waitFor({ timeout: 10_000 }).catch(() => {});
```

- [ ] **Step 5: Fix the stale sub-tab tests in pronunciation.spec.js**

In `e2e/pronunciation.spec.js`, inside the `test.describe('Croatia tab', ...)` block (around lines 1114-1135), replace the two tests `'Discover sub-tab accessible'` and `'Culture sub-tab accessible'` with a single doors test:

```js
  test('doors surface accessible', async ({ page }) => {
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Krajevi', { exact: true }).first().click();
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    const body = await page.locator('body').textContent();
    expect(body.trim().length).toBeGreaterThan(50);
  });
```

Leave the `'Croatia tab loads without error'` and `'no seasonal banner for past holidays (Easter fix)'` tests unchanged — both still hold (the Easter card is seasonally gated inside `DoorScreen`, and it lives inside the Priče door, not as a top-level banner).

- [ ] **Step 6: Rebuild dist, then run the migrated specs**

E2E runs against `npm run preview` serving pre-built `dist` — rebuild first or you test stale code.

Run: `npm run build`
Expected: success.

Run: `npx playwright test e2e/croatia.spec.js e2e/navigation.spec.js --project="Desktop Chrome"`
Expected: PASS.

- [ ] **Step 7: Run the remaining touched gated specs**

Run: `npx playwright test e2e/accessibility.spec.js e2e/pronunciation.spec.js e2e/error-boundary.spec.js e2e/mic-recording.spec.js --project="Desktop Chrome"`
Expected: PASS (error-boundary + mic-recording only assert the nav is visible and no errors fire — unchanged behaviour; accessibility + pronunciation updated above).

- [ ] **Step 8: Commit**

```bash
git add e2e/fixtures/seed-auth.js e2e/croatia.spec.js e2e/navigation.spec.js e2e/accessibility.spec.js e2e/pronunciation.spec.js
git commit -m "test(hrvatska): migrate e2e to the doors surface (openDoor fixture)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (before opening the PR)

- [ ] **Full unit suite:** `npm run test` → all pass (new hrvatska specs included; no regressions from deleting CroatiaTab/CultureTab/DiscoverTab).
- [ ] **Typecheck:** `npm run typecheck` → clean.
- [ ] **Lint:** `npm run lint` → clean (no unused imports left by the deletions).
- [ ] **Build:** `npm run build` → succeeds.
- [ ] **Full gated e2e (or at least the Croatia/navigation/accessibility set):** `npx playwright test --project="Desktop Chrome"` → green. Space out reruns; CI cancels in-progress E2E on rapid pushes.
- [ ] **No-orphan proof:** confirm `hrvatska.test.ts` "covers every must-not-orphan entry point" and "no stale items" both pass — this is the contract that nothing was dropped from the old tab.
- [ ] Open PR `feat/uxui-hrvatska-phase7b` → `master`; one code-reviewer (opus) pass scaled to risk; address findings; merge on user authorization (merge = prod deploy).

---

## Self-Review (against the spec)

**1. Spec coverage:**
- Five doors + Danas card → Task 1 (`DOORS`, `recommendedDaily`), Task 3 (surface). ✓
- Full ~39-entry-point → door mapping → Task 1 `DOOR_ITEMS` (40 ids, every CultureTab + DiscoverTab card). ✓
- texting→Mediji, immersion→Povijest, diaspora→Priče, civic→Povijest, kafic→Život, dialect_awareness→Povijest → encoded in `DOOR_ITEMS`. ✓
- Re-presentation only; reuse StoriesTab/MediaTab unchanged → Task 2 embeds. ✓
- HrvatskaTab/DoorScreen replace CroatiaTab; retire shell + anchor strip + IntersectionObserver → Task 4 (deletes CroatiaTab/CultureTab/DiscoverTab). ✓
- No-orphan gate `hrvatska.test.ts` → Task 1. ✓
- e2e via `openDoor` + `croatia.spec` rewrite → Task 5. ✓
- WCAG dark-gold rule → Global Constraints (no small bold gold-on-gold text is introduced; door "recommended" gold border is a 1.5px border, not text). ✓
- Seasonal `easter` gate preserved → Task 2 `isEasterSeason()`. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". Every code step contains full code. ✓

**3. Type consistency:** `DoorId`, `Door`, `DoorItem`, `itemsForDoor`, `recommendedDaily`, `launchDoorItem` are defined identically in Task 1 and consumed with the same signatures in Tasks 2-3. `launchDoorItem(item, nav)` argument shape matches across registry test, DoorScreen, and HrvatskaTab. ✓

**Note on the `survival_dinner`/`croatia_today` home doors:** the spec's Danas table listed `croatia_today` and `survival_dinner` among rotating/Priče candidates; this plan fixes their canonical home door (`croatia_today`→Mediji as daily news, `survival_dinner`→Priče as a dinner story) so each appears exactly once. Consistent with the spec's rule "items in the Danas rotation also live in a door."
