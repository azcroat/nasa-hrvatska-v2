# Home — Split into Today's Session (lead) + Razgovor card — Design Spec

> The #60 unification packed greeting + session + stats into one dense card and left Razgovor off Home entirely. Split Home into a clear hierarchy: a prominent host-led **Today's Session** card (the lead "do this next"), then a compact **Razgovor** card directly beneath it (talk to the family). Approved via before/after mock (2026-06-20); host greeting **stays** in the Session card.

**Goal:** Keep the host-led Today's Session card as the unmistakable lead, move the conversation entry out of it into a dedicated Razgovor card below the stat pills, with no duplicated streak and no second greeting hero.

**Architecture:** A small re-presentation change in `HomeTab`. The host-of-day greeting **remains** the header of `SessionCard`, but `SessionCard` loses its in-card Razgovor affordances (the `host-talk` button + portrait-as-tap-target from #60) — its host header is now a **passive greeting**. A new compact `RazgovorHomeCard` renders between `SessionCard` and `TodaysDiscoveries`, carrying the conversation CTA. It reuses the existing host-of-day (`hostOfDay`) and the existing `nh_open_partner` sessionStorage handoff that `RazgovorTab` already consumes on mount (built in #60) to open the right partner.

**Tech stack:** React 18 + TS; plain CSS + tokens; `CharacterPortrait`; Vitest + @testing-library/react; Playwright.

## Global Constraints
- Locked cast (`CharacterPortrait`). Palette/tokens as elsewhere; WCAG AA.
- Preserve `home.spec` contracts: the literal **"Today's Session"** text, `session-begin-cta`, the **Streak / Week XP / Due** stat pills, and the user **name** visible (it stays in the Session greeting).
- Streak appears **once** (Session pills). No duplicated streak; the Razgovor card is a conversation entry, not a greeting hero.
- Reuse the existing `nh_open_partner` handoff + `hostOfDay` (`dayOfYear()%5`); the Dom host and Razgovor partner are the same cast, so the greeter and the person you tap to chat with are the same family member (intentional through-line).
- Branch `feat/uxui-home-split`; ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`; never push to master; merge = prod deploy.

## Section 1 — Today's Session card (lead)
Unchanged from the live #60 card **except** it becomes greeting-only at the top:
- **Keep:** host-of-day greeting header (portrait + "Dobro jutro, <name>!" + host name over the scene), the eyebrow "Today's Session · ~N min · M activities", activity chips, `Begin Session` CTA (`session-begin-cta`), and the 3 stat pills (🔥 Day Streak / ⭐ Week XP / 📚 Reviews Due).
- **Remove:** the in-card Razgovor affordances added in #60 — the `data-testid="host-talk"` "💬 Razgovor →" button and the portrait-wrapped `aria-label="Razgovor s …"` tap button. The portrait becomes a plain (non-interactive) `<img>`/span; the `onTalkToHost` prop is removed from `SessionCard`.
- Net: the Session card is the focused, prominent lead — host greets you, you Begin. Nothing in it competes with the CTA.

## Section 2 — Razgovor card (new, beneath the pills)
A compact card rendered in `HomeTab` after `<SessionCard>` and before `<TodaysDiscoveries>`:
- A small section label "Razgovor".
- `CharacterPortrait name={host}` (host-of-day, in a teal ring) + "<Host> te čeka" (Playfair) + the host's greeting line (e.g. "Bok! O čemu ćemo danas pričati?") + a teal "💬 Razgovor →" pill.
- Tapping anywhere on the card calls the existing handoff: `sessionStorage.setItem('nh_open_partner', host)` then `setTab('ai')` — `RazgovorTab` opens that partner on mount (already implemented).
- `data-testid="home-razgovor-card"`. Compact (~one row), clearly secondary to the Session card.
- Host = `hostOfDay(currentDayIdx)` — the same family member who greets in the Session card above (continuity: they greet you, then you tap to talk to them). Greeting copy comes from the Razgovor `PARTNERS` registry (or `HOST_WELCOME`), keyed by host.

## Section 3 — Components, data flow, testing
- **`SessionCard.tsx`** — drop the `host-talk` button + portrait button + `onTalkToHost` prop (and its passive use); keep the greeting header otherwise intact.
- **`RazgovorHomeCard.tsx`** (new) — props `{ host: CharacterName; onOpen: () => void }` (or compute greeting internally from host); pure presentational; renders the portrait + copy + CTA; whole card is the button.
- **`HomeTab.tsx`** — stop passing `onTalkToHost` to `SessionCard`; render `<RazgovorHomeCard host={host} onOpen={goTalkToHost} />` between `SessionCard` and `TodaysDiscoveries`. `host` + `goTalkToHost` already exist in `HomeTab` (from #60).
- **Tests:**
  - `RazgovorHomeCard.test.tsx` (new): renders the host portrait + "te čeka" + CTA; clicking it calls `onOpen`.
  - `SessionCard.test.tsx`: update the #60 host-header tests — the greeting/name/portrait still render, but `host-talk` and the Razgovor-launch behaviour are gone (remove those assertions; keep greeting + "Today's Session" + pills + legacy-fallback tests).
  - `HomeTab` (if covered) / `home.spec` e2e: assert the Session card is the lead (Today's Session + Begin CTA + pills + name) AND a `home-razgovor-card` is present beneath; tapping it routes to `/ai` and opens the partner. Audit `home.spec` for any assertion tied to the in-card Razgovor button (from #60) and move it to the new card.

## Non-goals / open items
- No change to `RazgovorTab` (the `nh_open_partner` handoff already exists), the Razgovor partners, or `TodaysDiscoveries`.
- The same host portrait appears in both the Session greeting and the Razgovor card (intentional continuity); if it later reads as repetitive, a follow-up can vary the Razgovor host — out of scope here.
- Combined height stays ~similar to today's blended hero (Session card is marginally shorter without the in-card Razgovor button; the new card adds one compact row).
