# Home Split (Today's Session + Razgovor card) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Keep the host-led Today's Session card as the prominent lead but make its host header a passive greeting (drop the in-card Razgovor button/portrait-tap added in #60), and add a compact `RazgovorHomeCard` beneath the stat pills that opens the host-of-day partner.

**Architecture:** Small additive change in `HomeTab`. `SessionCard` loses its `onTalkToHost` affordances; a new `RazgovorHomeCard` reuses HomeTab's existing `host` (`hostOfDay`) + `goTalkToHost` (sets `nh_open_partner` + `setTab('ai')`) — the handoff `RazgovorTab` already consumes on mount (built in #60).

**Tech Stack:** React 18 + TS; plain CSS + tokens; `CharacterPortrait`; `PARTNERS` registry (greeting copy); Vitest + Playwright.

## Global Constraints
- Locked cast; palette/tokens; WCAG AA.
- Preserve `home.spec` contracts: literal **"Today's Session"**, `session-begin-cta`, **Streak/Week XP/Due** pills, user **name** (stays in the Session greeting).
- Streak once (Session pills). Razgovor card = conversation entry, not a greeting hero.
- Reuse `nh_open_partner` handoff + `hostOfDay`; do NOT modify `RazgovorTab` or `partners.ts`.
- Branch `feat/uxui-home-split` (spec committed there). ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Never push to master.

## File Structure
- `src/components/home/SessionCard.tsx` — **modify:** make `HostHeader` passive; drop `onTalkToHost` prop + the `host-talk` button + portrait button.
- `src/tests/SessionCard.test.tsx` — **modify:** drop the onTalkToHost/host-talk assertions; keep greeting/name/portrait/label/pills/legacy.
- `src/components/home/RazgovorHomeCard.tsx` — **new.**
- `src/components/home/RazgovorHomeCard.test.tsx` — **new.**
- `src/components/home/HomeTab.tsx` — **modify:** drop `onTalkToHost` prop on `SessionCard`; render `<RazgovorHomeCard>` after it.
- `e2e/home.spec.js` — **modify:** add Razgovor-card assertions.

---

## Task 1: SessionCard host header → passive greeting

**Files:** Modify `src/components/home/SessionCard.tsx`; Test `src/tests/SessionCard.test.tsx`.

- [ ] **Step 1: Update the failing test expectations**

In `src/tests/SessionCard.test.tsx`, in the `describe('SessionCard — host-of-day header …')` block:
- DELETE the test `'portrait and Razgovor button both invoke onTalkToHost'` entirely.
- In remaining host tests, remove the `onTalkToHost={vi.fn()}` prop from the renders (the prop no longer exists). Keep assertions for `session-host`, the greeting/name (`Ivana`, `Baka Marija`), `portrait-baka`, absence of `Dnevna Vježba` in host mode, the "TODAY'S SESSION" label, the complete-state host, and the legacy-fallback test.
- Add one assertion to the first host test: `expect(screen.queryByTestId('host-talk')).toBeNull();` (the Razgovor button is gone).

- [ ] **Step 2: Run — verify it fails**

Run: `npm run test -- src/tests/SessionCard.test.tsx`
Expected: FAIL (component still renders `host-talk` / accepts `onTalkToHost`).

- [ ] **Step 3: Make HostHeader passive**

In `src/components/home/SessionCard.tsx`:

(a) Replace the portrait `<button>` (lines ~74-100) with a plain non-interactive span:

```tsx
        <span
          style={{
            flex: 'none',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg,#FFE070,#C8980A)',
            boxShadow: '0 4px 14px rgba(0,0,0,.35)',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 56,
              height: 56,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,.9)',
              background: '#fbf6ec',
            }}
          >
            <CharacterPortrait name={host} title={hostName} size={52} />
          </span>
        </span>
```

(b) DELETE the entire `{onTalkToHost && ( <button … data-testid="host-talk" … >💬 Razgovor →</button> )}` block (lines ~124-146).

(c) Remove `onTalkToHost` from `HostHeader`'s params + its prop type (lines ~30, ~38), from `SessionCardProps` (line ~211), from the destructure (line ~345), and from BOTH `<HostHeader … onTalkToHost={onTalkToHost} />` call-sites (lines ~365, ~502). `showHost` keeps requiring `host && hostName && userName && hostQuote && sceneUrl` (unchanged).

- [ ] **Step 4: Run — verify it passes**

Run: `npm run test -- src/tests/SessionCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck` → clean (no remaining `onTalkToHost` references anywhere; `grep -rn "onTalkToHost" src` returns nothing).

- [ ] **Step 6: Commit**

```bash
git add src/components/home/SessionCard.tsx src/tests/SessionCard.test.tsx
git commit -m "feat(home): make SessionCard host header a passive greeting

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: RazgovorHomeCard component

**Files:** Create `src/components/home/RazgovorHomeCard.tsx`; Test `src/components/home/RazgovorHomeCard.test.tsx`.

**Interfaces:**
- Consumes: `CharacterPortrait`, `type CharacterName` from `../family/portraits`; `PARTNERS` from `../razgovor/partners`.
- Produces: `export default function RazgovorHomeCard(props: { host: CharacterName; onOpen: () => void }): JSX.Element` — root `data-testid="home-razgovor-card"`, the whole card is a button calling `onOpen`.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/RazgovorHomeCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RazgovorHomeCard from './RazgovorHomeCard';

describe('RazgovorHomeCard', () => {
  it('renders the host portrait, name, and a Razgovor CTA', () => {
    render(<RazgovorHomeCard host="ana" onOpen={vi.fn()} />);
    expect(screen.getByTestId('home-razgovor-card')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-ana')).toBeInTheDocument();
    expect(screen.getByText(/Ana te čeka/)).toBeInTheDocument();
    expect(screen.getByText(/Razgovor/)).toBeInTheDocument();
  });

  it('calls onOpen when the card is clicked', () => {
    const onOpen = vi.fn();
    render(<RazgovorHomeCard host="baka" onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('home-razgovor-card'));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npm run test -- src/components/home/RazgovorHomeCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement RazgovorHomeCard**

Create `src/components/home/RazgovorHomeCard.tsx`:

```tsx
import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import type { CharacterName } from '../family/portraits';
import { PARTNERS } from '../razgovor/partners';

/**
 * Compact Home card beneath the Session card: the host-of-day invites the user
 * to converse. Tapping it opens Razgovor with that partner (via the parent's
 * onOpen → nh_open_partner handoff). A conversation entry, not a greeting hero.
 */
export default function RazgovorHomeCard({
  host,
  onOpen,
}: {
  host: CharacterName;
  onOpen: () => void;
}) {
  const partner = PARTNERS.find((p) => p.id === host) ?? PARTNERS[0]!;

  return (
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
        Razgovor
      </div>
      <button
        data-testid="home-razgovor-card"
        onClick={onOpen}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 18,
          padding: 13,
          marginBottom: 16,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 2px 10px rgba(0,0,0,.05)',
        }}
      >
        <span
          style={{
            flex: 'none',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 50,
              height: 50,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #fff',
              background: '#fbf6ec',
            }}
          >
            <CharacterPortrait name={host} title={partner.name} size={50} />
          </span>
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
            {partner.name} te čeka
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 2 }}>
            „{partner.greeting.hr}”
          </span>
        </span>
        <span
          style={{
            marginLeft: 'auto',
            flex: 'none',
            background: 'linear-gradient(140deg,#0e7490,#155e75)',
            color: '#fff',
            borderRadius: 11,
            padding: '9px 13px',
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          💬 Razgovor →
        </span>
      </button>
    </>
  );
}
```

> Source-character note: type the real diacritics (`te čeka`, `pričati`, `„…"`) in the `.tsx`.

- [ ] **Step 4: Run — verify it passes**

Run: `npm run test -- src/components/home/RazgovorHomeCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/RazgovorHomeCard.tsx src/components/home/RazgovorHomeCard.test.tsx
git commit -m "feat(home): add RazgovorHomeCard (host-of-day conversation entry)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wire RazgovorHomeCard into HomeTab

**Files:** Modify `src/components/home/HomeTab.tsx`.

- [ ] **Step 1: Import the card**

Add near the other home imports: `import RazgovorHomeCard from './RazgovorHomeCard';`

- [ ] **Step 2: Drop `onTalkToHost` from SessionCard + render the new card**

(a) In the `<SessionCard …>` props, remove the line `onTalkToHost={goTalkToHost}` (line ~523). Keep `host`, `hostName`, `userName`, `hostQuote`, `sceneUrl`.

(b) Immediately AFTER the `<SessionCard … />` closing tag and BEFORE `<TodaysDiscoveries …/>`, add:

```tsx
      {/* ── RAZGOVOR — host-of-day conversation entry (Phase: Home split) ── */}
      <RazgovorHomeCard host={host} onOpen={goTalkToHost} />
```

(`host` and `goTalkToHost` already exist in scope.)

- [ ] **Step 3: Typecheck + unit**

Run: `npm run typecheck` → clean.
Run: `npm run test -- src/components/home src/tests/SessionCard.test.tsx` → green.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomeTab.tsx
git commit -m "feat(home): split Home into Today's Session lead + Razgovor card

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: E2E — Razgovor card on Home

**Files:** Modify `e2e/home.spec.js`.

- [ ] **Step 1: Audit + add**

Read `e2e/home.spec.js`. Confirm no assertion depends on the removed in-card `host-talk` button (it was a #60 unit-only affordance; if any exists, remove it). Add a test inside the `Home tab` describe:

```js
  test('shows the Razgovor card and opens that partner', async ({ page }) => {
    const card = page.getByTestId('home-razgovor-card');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card).toContainText(/te čeka/);
    await card.click();
    await page.waitForURL('/ai', { timeout: 20_000 });
    // RazgovorTab opens the handed-off partner: its back bar appears.
    await expect(page.getByText('← Razgovor')).toBeVisible({ timeout: 10_000 });
  });
```

- [ ] **Step 2: Build + run**

Run: `npm run build`
Run: `npx playwright test e2e/home.spec.js --project="Desktop Chrome"`
Expected: PASS (Session card contracts intact + the new Razgovor card test).

- [ ] **Step 3: Commit**

```bash
git add e2e/home.spec.js
git commit -m "test(home): assert Razgovor card opens its partner from Home

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (before PR)
- [ ] `grep -rn "onTalkToHost" src` → no matches (fully removed).
- [ ] `npm run test` → full suite green.
- [ ] `npm run typecheck` + `npm run lint` → clean.
- [ ] `npm run build` → succeeds.
- [ ] `npx playwright test e2e/home.spec.js e2e/navigation.spec.js --project="Desktop Chrome"` → green.
- [ ] Manual sanity: Home shows the prominent Today's Session card (host greets, Begin CTA, pills) then a compact "Razgovor" card; tapping it lands on /ai with that partner open; streak shown only once.
- [ ] PR `feat/uxui-home-split` → master; one code-reviewer pass; merge on your authorization.

## Self-Review (against spec)
- Session card lead, passive greeting (no in-card Razgovor) → Task 1. ✓
- Dedicated Razgovor card beneath, host-of-day, opens partner via existing handoff → Tasks 2-3. ✓
- Streak once; name + "Today's Session" preserved → Task 1 keeps pills + greeting; home.spec contracts kept → Task 4. ✓
- Reuses `host`/`goTalkToHost`/`nh_open_partner`; no RazgovorTab/partners change → Task 3. ✓
- Types: `RazgovorHomeCard({host: CharacterName; onOpen: () => void})` defined Task 2, consumed identically Task 3. ✓
