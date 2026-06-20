# Phase 7b — Hrvatska (Discover Croatia) Redesign — Design Spec

> Final tab of the Naša Hrvatska UX/UI redesign. Collapses the app's most overloaded tab (~39 entry points across ~22 regions) into a calm **theme-doors** model — a "Danas u Hrvatskoj" daily card + five thematic doors, each voiced by a family member — consistent with Dom/Učenje/Grad/Razgovor. Theme-doors direction approved in brainstorm (2026-06-19); mockups approved.

**Goal:** Re-present the Hrvatska tab as a Danas card + five doors (Priče, Krajevi, Život, Povijest i jezik, Mediji) — each opening to a host-voiced interior that reuses the existing content sub-components — **without orphaning any of the ~39 entry points and without changing any content screen's behaviour.**

**Architecture:** A re-presentation layer. A new `src/components/hrvatska/` module (doors registry + tab + door screen) replaces the stacked-all-sections `CroatiaTab` shell + anchor strip. A `doors.ts` registry + `CARD_ASSIGNMENTS` map route every entry point to one door. Door interiors reuse the existing `StoriesTab`/`MediaTab`/region/life/history cards unchanged. A no-orphan unit test proves coverage.

**Tech stack:** React 18 + Vite + TS; plain CSS + tokens (no Tailwind); Outfit + Playfair; Vitest + @testing-library/react; Playwright e2e; Cloudflare Pages.

## Global Constraints
- Plain CSS + tokens. Palette teal `#0e7490`/`#164e63`, red `#D40030`, terracotta `#c2410c`, stone `#f5f0e8`, gold `#C8980A`; dark gold `#6b4e0a` for small bold text on gold-tint (WCAG AA — Phase 6 lesson). Fonts Outfit (UI) + Playfair (headings). Inline styles, matching the other tabs.
- ASCII commit messages + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Branch `feat/uxui-hrvatska-phase7b`; never push to master. Merging deploys.
- **No orphaned entry points** — enforced by the Task-1 unit test.
- **Behaviour untouched** — only navigation/presentation changes; reuse all content screens + the Stories/Media sub-tabs.
- Character art = locked flat cast (`CharacterPortrait`, `CharacterName='baka'|'ana'|'kovac'|'ivo'|'marko'`).
- CI gates desktop e2e only. Preserve the seasonal `easter` gate + first-visit badge behaviour where it still applies.

## Inventory baseline (the must-not-orphan list)
`CroatiaTab` (tab `croatia`) renders a hero + sticky anchor strip + `DiscoverTab` + `CultureTab` (History&Regions 12 + Croatian Life 12) + `StoriesTab` + `MediaTab` — **~39 entry points**. Children: `DiscoverTab.tsx`, `CultureTab.tsx`, `StoriesTab.tsx`, `MediaTab.tsx`. Props: `CroatiaTab` takes `sCurEx`; children use `useApp().setScr`.

---

## Section 1 — Doors & mapping

Five thematic doors + a "Danas u Hrvatskoj" rotating card. Each door is voiced by a family member; the Danas card surfaces one daily discovery and links into a door (items also live in their door).

| Door id | Title | Voice (host) | Holds (entry points) |
|---|---|---|---|
| `today` | Danas u Hrvatskoj (card) | rotating | `phraseofday` · `croatia_today` · `croatianews` · `postcard` · seasonal `easter` |
| `price` | Priče | baka | StoriesTab letters · `baka_summer` · `storymode` · `heritage` · `survival_dinner` · `lifeevents` · `diaspora` · `postcard` |
| `krajevi` | Krajevi | marko | `crmap` (map, centerpiece) · `region_vukovar` · `region_zagreb` · `region_split` · `region_mostar` · `region_tomislavgrad` · `region_knin` · `region_labin` · `region_bibinje` · `region_hercegovina` · `region_vinkovci` |
| `zivot` | Život | ana | `grocery` · `recipes` · `roleplay` · `school` · `friends` · `foodorder` · `transport` · `emergency` · `practical` · `basketball` · `gym` · `kafic` |
| `povijest` | Povijest i jezik | kovac | `history` · `kings` · `civic` · `dialect_awareness` · `immersion` |
| `mediji` | Mediji | ivo | MediaTab (~60 carousel items) · `texting` · (`croatianews`/`phraseofday` also surface) |

**Coverage:** every inventoried entry point + the Media/Stories sections maps to one door. Items in the Danas rotation also live in a door (so Danas is a surface, not an owner).

**Locked judgment calls (from brainstorm):**
1. `texting` (Texting & Slang) → Mediji/Ivo (pop/street register).
2. `immersion` (A1→C2 pathway) → Povijest i jezik (closest fit; no cross-tab move).
3. Danas is a rotating surface linking into doors; the no-orphan guarantee holds via the doors.
4. `crmap` (real Croatia map) anchors Krajevi — distinct from Grad's stylized town Karta.

---

## Section 2 — Default surface
1. **Slim hero** — eyebrow "istraži" + title "Hrvatska" + red/white/teal stripe.
2. **"Danas u Hrvatskoj" card** — `recommendedDaily()` picks one discovery (phrase/news/postcard/seasonal), one CTA that opens it directly.
3. **Five door rows** — host `CharacterPortrait` + door title (icon) + voice line. The door matching the Danas topic gets a thin gold edge.

Tapping a door opens its interior (Section 3) — full screen, so the page never re-explodes. The sticky anchor strip + all-sections stack are removed.

---

## Section 3 — Inside a door
1. **`← Hrvatska` back bar** + door title.
2. **Host hero** — door host `CharacterPortrait` in a gold ring + a voice line (hr + en).
3. **One recommended item** (e.g. Priče → today's letter).
4. **The door's content**, reusing existing sub-components so behaviour is untouched:
   - **Priče** → `StoriesTab` (Baka letters) + the story cards.
   - **Krajevi** → `crmap` map + region cards.
   - **Život** → the Croatian-Life how-to cards.
   - **Povijest i jezik** → history/kings/civic/dialect/immersion cards.
   - **Mediji** → `MediaTab` (carousels) as-is.

---

## Section 4 — Data model, no-orphan, testing
**`src/components/hrvatska/doors.ts`:**
```ts
export type DoorId = 'price' | 'krajevi' | 'zivot' | 'povijest' | 'mediji';
export interface Door {
  id: DoorId; title: string; host: CharacterName; voiceLine: { hr: string; en: string };
  icon: string; tint: string;
}
export const DOORS: Door[];                                  // 5
// Card/screen-id -> door (regions, life, history, story, culture cards).
export const CARD_ASSIGNMENTS: Record<string, DoorId>;
// Rotating daily surface.
export function recommendedDaily(dayIdx: number): { id: string; doorId: DoorId; hr: string; en: string; launch };
export const MUST_NOT_ORPHAN: string[];                      // the ~39 ids + 'media'/'stories' section markers
```
- **Components:** `HrvatskaTab.tsx` (Danas + door rows) replaces `CroatiaTab`; `DoorScreen.tsx` (host hero + the door's cards/section). `DiscoverTab`/`CultureTab`/`StoriesTab`/`MediaTab` are **reused inside doors** — `CultureTab`'s cards are re-bucketed across Krajevi/Život/Povijest via `CARD_ASSIGNMENTS` (the plan reads `CultureTab` to split its card arrays per door). Retire the `CroatiaTab` shell + anchor strip + IntersectionObserver.
- **Launch:** door cards use the existing `useApp().setScr` (+ `sCurEx`) exactly as today.

**No-orphan gate — `hrvatska.test.ts`:** every must-not-orphan id maps to exactly one door (via `CARD_ASSIGNMENTS` or a door's explicit section); no stale ids; each door `host` is a valid `CharacterName`; `recommendedDaily` returns a launchable item for all inputs.

**Component tests:** `HrvatskaTab` renders Danas + 5 door rows; `DoorScreen` renders host hero + the door's cards (e.g. Priče shows the story cards; Krajevi shows region cards; Mediji renders MediaTab).

**E2E:** audit `e2e/` for CroatiaTab/anchor-strip assertions (inventory flagged `croatia.spec` + audit specs; the `month-audit`/`heavy-user-*` are testIgnored) → migrate via an `openDoor(page, name)` fixture; new `hrvatska.spec` (Danas + 5 doors → open a door → host hero + a card launches, no console error → back). Rebuild dist before running; full desktop run before PR.

## Non-goals / open items
- No change to any content screen, the map, the letters corpus, or media data.
- No new content — Danas/`recommendedDaily` is a rotation over existing daily features.
- Seasonal `easter` keeps its date gate; first-visit "NEW" badges may be dropped or kept as a quiet per-door dot (plan decides).
- Exact CultureTab card arrays + the `DiscoverTab` content (Hrvoje knight, dialect card) reconciled at implementation by reading those files; the knight companion stays as-is (it's app-wide).
