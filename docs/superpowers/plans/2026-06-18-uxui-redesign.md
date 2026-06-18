# UX/UI Redesign ("A Place, Not an App") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app's experience around a Croatian host family ("a place, not an app"): a calm 5-place navigation, a cohesive illustrated cast, and decluttered Dom/Učenje/Grad surfaces, replacing carnival gamification with quiet, relational feedback.

**Architecture:** React + Vite SPA, plain CSS with design tokens (no Tailwind). The redesign is delivered in ordered phases, each shippable on its own. Phase 1 (this document, fully detailed) introduces the reusable character cast as components. Phases 2–7 (roadmapped here) each become their own detailed plan when reached.

**Tech Stack:** React 18, Vite, TypeScript/JSX, plain CSS (`src/index.css` tokens), Vitest + @testing-library/react (unit), Playwright (E2E), Firebase/Firestore (sync), Cloudflare Pages (deploy).

## Global Constraints

- **Styling:** plain CSS + CSS custom properties in `src/index.css`. NO Tailwind, NO CSS modules, NO styled-components.
- **Fonts:** `Outfit` (UI/body), `Playfair Display` (editorial headings) — already loaded via `public/fonts/fonts.css`.
- **Palette (verbatim):** Adriatic teal `#0e7490`; Croatian red `#D40030` / `#c0392b`; terracotta `#c2410c`; Korčula stone `#f5f0e8`; gold `#C8980A`.
- **Character art is LOCKED.** Do not redesign. The canonical source of each portrait's SVG is the build script under `C:\dev\nasa-hrvatska-v2\` (outside the repo): `build_baba_flat.py` (Baka), `build_cast_full.py` (Kovač), `build_men2.py` (Ivo), `build_marko3.py` (Marko); Ana is in `build_cast_full.py`. Port the exact `<svg>…</svg>` inner markup verbatim.
- **Commits:** ASCII-only commit messages (Cloudflare Pages rejects non-BMP/emoji). End every commit message with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Do NOT push.** Push to `master` auto-deploys via Cloudflare Pages; only the user pushes. Work on branch `feat/uxui-family-redesign`.
- **Never destroy user progress** (localStorage `nh_*` / Firestore). No paywall/monetization gating. CEFR is stored as an int in Firestore.
- **Verify any visual component** with a Playwright screenshot at large size before marking a task done — a thumbnail hides defects (this cost real rework during design).
- **TDD:** write the failing test first; run it red; implement minimally; run it green; commit.

---

## Phase roadmap (each becomes its own plan when reached)

1. **Foundation — the character cast as components** *(detailed below).* A `CharacterPortrait` component family rendering the 5 locked portraits. No other surface changes. Ships a reusable, tested unit.
2. **5-place navigation.** Rewrite `TabBar.tsx` + `Sidebar.tsx` to `Dom · Učenje · Grad · Razgovor · Hrvatska` (Croatian + English subtitle), new icons, move "Me" to a top-corner affordance; remap routing in `App.jsx`/`AppRouter` (`ai`→`razgovor`, etc.); update `src/tests/testids.smoke.test.tsx` and Playwright nav specs. Keep existing tab *content* temporarily.
3. **Retire the corny awards.** Remove `BadgeToast`, `StreakMilestoneToast`, `CelebrationModal`, `CeremonyModal`, `LevelUpModal`, Prestige, confetti, and the always-on knight on daily surfaces; replace with a quiet XP tick + plain streak indicator. Touch `useAward` triggers and `AppToasts`/`AppModals`.
4. **Dom (Home) redesign.** Rebuild `HomeTab` to the family-host welcome (photo hero + host-of-the-day + quiet gold-dot progress + one next thing + tabbed daily gift).
5. **Učenje (Learn) redesign.** Rebuild `LearnTab` to continue-card (host: prof. Kovač) + vertical A1→C1 path; demote `BrowseContentModal` to a link.
6. **Grad (Practice) redesign + place model.** Replace `PracticeTab` with recommended-visit + places list + `🗺️ Karta` map toggle; introduce a place model and reorganize `exerciseCatalog.ts` so each exercise belongs to a place; add the drill-in-a-place wrapper (host + context around the unchanged drill engine).
7. **Razgovor + Hrvatska.** Detailed designs first (separate brainstorm), then implementation.

---

## File Structure (Phase 1)

- Create `src/components/family/portraits.ts` — canonical SVG markup for each character as raw strings; one responsibility: hold the locked art.
- Create `src/components/family/CharacterPortrait.tsx` — render a named portrait at a given size; one responsibility: the presentational component.
- Create `src/components/family/index.ts` — barrel export of the component + the `CharacterName` type.
- Create `src/components/family/CharacterPortrait.test.tsx` — unit tests (render + names + size + a11y).

---

## Task 1: CharacterPortrait component + first character (Baka)

**Files:**
- Create: `src/components/family/portraits.ts`
- Create: `src/components/family/CharacterPortrait.tsx`
- Test: `src/components/family/CharacterPortrait.test.tsx`

**Interfaces:**
- Produces: `type CharacterName = 'baka' | 'ana' | 'kovac' | 'ivo' | 'marko'`; `PORTRAITS: Record<CharacterName, string>` (raw `<svg>` markup); `<CharacterPortrait name: CharacterName, size?: number, title?: string, className?: string />` rendering a `role="img"` wrapper with `aria-label` and the inline SVG.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/family/CharacterPortrait.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CharacterPortrait from './CharacterPortrait';

describe('CharacterPortrait', () => {
  it('renders Baka as an accessible image containing an SVG', () => {
    const { container } = render(<CharacterPortrait name="baka" title="Baka Marija" />);
    const img = screen.getByRole('img', { name: 'Baka Marija' });
    expect(img).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies the requested pixel size to the wrapper', () => {
    const { container } = render(<CharacterPortrait name="baka" size={120} title="Baka" />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.style.width).toBe('120px');
    expect(wrap.style.height).toBe('120px');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/family/CharacterPortrait.test.tsx`
Expected: FAIL — cannot resolve `./CharacterPortrait`.

- [ ] **Step 3: Create the portraits data module (Baka only for now)**

Create `src/components/family/portraits.ts`. Paste Baka's **exact** locked SVG (the `BAKA` constant from `build_baba_flat.py`) as the `baka` value. (Other characters are added in Tasks 2–5.)

```ts
// src/components/family/portraits.ts
export type CharacterName = 'baka' | 'ana' | 'kovac' | 'ivo' | 'marko';

// LOCKED art — ported verbatim from the canonical build scripts (see Global Constraints).
export const PORTRAITS: Partial<Record<CharacterName, string>> = {
  baka: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
 <rect width="200" height="200" fill="#efe5d3"/><circle cx="100" cy="92" r="66" fill="#e7d8be"/>
 <!-- ...paste the full BAKA inner markup from build_baba_flat.py here, unchanged... -->
</svg>`,
};
```

- [ ] **Step 4: Create the component**

```tsx
// src/components/family/CharacterPortrait.tsx
import React from 'react';
import { PORTRAITS, type CharacterName } from './portraits';

export default function CharacterPortrait({
  name,
  size = 64,
  title,
  className,
}: {
  name: CharacterName;
  size?: number;
  title?: string;
  className?: string;
}) {
  const svg = PORTRAITS[name];
  return (
    <span
      role="img"
      aria-label={title ?? name}
      data-testid={`portrait-${name}`}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, display: 'inline-block', borderRadius: '50%', overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  );
}
```

(The SVG is our own static, trusted asset — `dangerouslySetInnerHTML` is safe here; no user input is interpolated.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/family/CharacterPortrait.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/family/portraits.ts src/components/family/CharacterPortrait.tsx src/components/family/CharacterPortrait.test.tsx
git commit -m "feat(family): add CharacterPortrait component with Baka Marija

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add Ana

**Files:** Modify: `src/components/family/portraits.ts`; Test: `src/components/family/CharacterPortrait.test.tsx`

**Interfaces:** Consumes `PORTRAITS`/`CharacterName` from Task 1. Produces: `PORTRAITS.ana` populated.

- [ ] **Step 1: Add a failing test for Ana**

```tsx
it('renders Ana with an SVG', () => {
  const { container } = render(<CharacterPortrait name="ana" title="Ana" />);
  expect(screen.getByRole('img', { name: 'Ana' })).toBeInTheDocument();
  expect(container.querySelector('svg')).toBeTruthy();
});
```

- [ ] **Step 2: Run it red**

Run: `npx vitest run src/components/family/CharacterPortrait.test.tsx -t Ana`
Expected: FAIL — `PORTRAITS.ana` is undefined → no `<svg>` rendered.

- [ ] **Step 3: Add Ana's locked SVG**

In `portraits.ts`, add `ana: \`<svg ...>...</svg>\`` using the **exact** `ANA` markup from `build_cast_full.py` (the locked version: brown hair cap, no marama, soft teal backdrop).

- [ ] **Step 4: Run it green**

Run: `npx vitest run src/components/family/CharacterPortrait.test.tsx -t Ana`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/family/portraits.ts src/components/family/CharacterPortrait.test.tsx
git commit -m "feat(family): add Ana the barista portrait

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add prof. Kovač

Same shape as Task 2. Test name `kovac` / label "prof. Kovac"; SVG from `build_cast_full.py` `KOVAC`. Commit: `feat(family): add prof. Kovac the tutor portrait`.

## Task 4: Add Ivo

Same shape. Test `ivo` / "Ivo"; SVG from `build_men2.py` `IVO` (short salt-pepper hair, moustache, no hat). Commit: `feat(family): add Ivo the cabbie portrait`.

## Task 5: Add Marko

Same shape. Test `marko` / "Marko"; SVG from `build_marko3.py` `MARKO` (tanned, full connected beard, single slit mouth). Commit: `feat(family): add Marko the fisherman portrait`.

> Tasks 3–5 repeat Task 2's five steps exactly (failing test → red → add SVG → green → commit). They are listed compactly because the procedure is identical; the only differences are the name, label, and which build-script constant supplies the SVG.

---

## Task 6: Registry, barrel export, and render-all guard

**Files:**
- Create: `src/components/family/index.ts`
- Modify: `src/components/family/portraits.ts` (tighten the type to a full `Record`)
- Test: `src/components/family/CharacterPortrait.test.tsx`

**Interfaces:** Produces: `ALL_CHARACTERS: CharacterName[]`; barrel `export { default as CharacterPortrait } from './CharacterPortrait'; export type { CharacterName } from './portraits';`.

- [ ] **Step 1: Write the failing test (every character renders an SVG)**

```tsx
import { ALL_CHARACTERS } from './portraits';

it('renders every character in the cast without crashing', () => {
  for (const name of ALL_CHARACTERS) {
    const { container, unmount } = render(<CharacterPortrait name={name} title={name} />);
    expect(container.querySelector('svg'), `missing svg for ${name}`).toBeTruthy();
    unmount();
  }
});
```

- [ ] **Step 2: Run it red**

Run: `npx vitest run src/components/family/CharacterPortrait.test.tsx -t "every character"`
Expected: FAIL — `ALL_CHARACTERS` not exported.

- [ ] **Step 3: Add the registry + barrel; make PORTRAITS a full Record**

In `portraits.ts`: change `Partial<Record<...>>` to `Record<CharacterName, string>` and add:

```ts
export const ALL_CHARACTERS: CharacterName[] = ['baka', 'ana', 'kovac', 'ivo', 'marko'];
```

Create `src/components/family/index.ts`:

```ts
export { default as CharacterPortrait } from './CharacterPortrait';
export { ALL_CHARACTERS, type CharacterName } from './portraits';
```

- [ ] **Step 4: Run the full family test file green + typecheck**

Run: `npx vitest run src/components/family/ && npm run typecheck`
Expected: all tests PASS; tsc reports no errors (the full `Record` now requires all 5 keys present — they are, from Tasks 1–5).

- [ ] **Step 5: Visual verification (mandatory)**

Create a throwaway HTML that imports nothing — instead, build the app dev server and view: `npm run dev`, open the app, and temporarily render `<CharacterPortrait>` for all five at `size={180}` on any dev surface (or add a temporary `/__cast` dev-only route). Use Playwright to screenshot at ~180px each and confirm each matches the locked design (face, hair on head, brows over eyes, single mouth). Remove the temporary surface before committing.

- [ ] **Step 6: Commit**

```bash
git add src/components/family/index.ts src/components/family/portraits.ts src/components/family/CharacterPortrait.test.tsx
git commit -m "feat(family): add cast registry and render-all guard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (Phase 1 vs spec §4 "host family")

- **Spec coverage:** §4 requires the 5 locked characters as reusable components in `src/components/family/` — covered by Tasks 1–6. Later phases consume `<CharacterPortrait>` (Dom host greeting, Grad places, drill-in-place); the produced interface (`name`, `size`, `title`) supports those call sites.
- **Placeholder scan:** The only non-inlined code is the locked SVG markup, intentionally sourced verbatim from the named canonical build scripts (large static art assets with a single source of truth) — this is a sourcing instruction, not a "TODO". Tasks 3–5 reference Task 2's identical procedure by design, with their distinct inputs spelled out.
- **Type consistency:** `CharacterName`, `PORTRAITS`, `ALL_CHARACTERS`, and the `CharacterPortrait` props are used identically across all tasks; `PORTRAITS` widens from `Partial<Record>` (Task 1, mid-build) to `Record` (Task 6, once all keys exist) — deliberate and called out.
