# Hrvoje the Knight — Full Retirement Design Spec

> Fully retire the medieval-knight mascot ("Vitez Hrvoje", `CroatianKnight`) from the app and complete the host-family redesign. The knight's one functional role — in-exercise coaching — moves to **prof. Kovač**; its ~20 decorative appearances are resolved per-site (replace with the context-appropriate host, or remove the illustration). Approved direction (2026-06-20): coach = Kovač; decorative policy = **hybrid** (replace where the character adds warmth, remove where it's filler).

**Goal:** Remove every `CroatianKnight` render and the "Hrvoje" identity from the product, with each of the ~30 call sites given a deliberate disposition, and delete the knight components once no site references them — without silently dropping any functionality (notably the load-bearing in-exercise coaching channel).

**Architecture:** A re-presentation program. The coaching channel is event-based (`knightSpeak`/`knightFlash` → `knight:speak`/`knight:flash`, plus `knight:celebrate`/`knight:quest-done`); `KnightCompanion` is its **sole listener** on non-home screens. We keep the event channel and all ~20 dispatchers unchanged (internal event names stay `knight:*` — renaming them is cosmetic churn with real regression risk); we change only the **renderers** (the components that draw the knight) and the **voice/identity**. Delivered in four independently-shippable phases.

**Tech stack:** React 18 + TS; plain CSS + tokens; Framer Motion (web) with the existing `_isNative` plain-element fallback (Capacitor opacity bug); `CharacterPortrait` (locked flat cast: baka/ana/kovac/ivo/marko); Vitest + Playwright.

## Global Constraints
- Locked flat cast only (`CharacterPortrait`); no new mascot art. Portraits are **static** (no facial moods) — coaching/feedback state is conveyed by ring colour + corner glyph + bubble, not a changing face.
- **Do NOT rename or remove** `knightSpeak`/`knightFlash` (`src/lib/knightSpeak.ts`) or any of the ~20 dispatch sites; the internal `knight:*` event names stay. Only renderers + visible identity change.
- Preserve native-safety (`_isNative` plain-element path) wherever a knight renderer is replaced.
- WCAG AA on any new text/glyph (white glyph on saturated ring fills — verify ≥4.5:1).
- Branch per phase off `master`; never push to master; ASCII commit messages + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Merging deploys (CF Pages).
- No-silent-regression rule: before deleting any knight renderer, confirm it is not the sole listener/renderer for an event (the Phase-3 lesson). `KnightCompanion` IS the sole `knight:speak`/`knight:flash` listener — its replacement must carry those listeners over.

---

## Disposition map (all render sites)

| Site | Role | Disposition |
|---|---|---|
| `KnightCompanion.tsx` | **Load-bearing** global in-exercise coaching companion | **Replace → prof. Kovač** (keeps all 4 event listeners). Phase 1. |
| `KnightBubble.tsx` (92px home hero), `KnightSpeech.tsx` (42px), `useKnightSpeech.ts`, `heroData.ts`/`heroHelpers.ts` | Home greeting + quick-replies | **Replace → host greeter.** Phase 2. |
| `WelcomeScreen.tsx` (×3), `PlacementTest.tsx` (×3) | Onboarding / placement | **Replace → host** (warmth matters at first run). Phase 3. |
| `AIStoryScreen.tsx`, `StoriesTab.tsx`, `HeritagePathScreen.tsx` | Story / heritage accents | **Replace → Baka** (stories/heritage). Phase 3. |
| `LessonScreen.tsx`, `PitchAccentMastery.tsx` | In-lesson accent | **Replace → Kovač** (teaching). Phase 3. |
| `FlashcardResultScreen.tsx`, `McResult.tsx`, `ReviewScreen.tsx`, `EmptyState.tsx`, `FlashcardEmptyState.tsx` | Result / empty states | **Replace → Kovač** (coach acknowledges results/empties). Phase 3. |
| `WelcomeBackBanners.tsx` | Comeback banner | **Replace → host-of-day**. Phase 3. |
| `ScreenErrorBoundary.tsx` (mood "droop"), `LearnPathWidget.tsx` (×4 tiny marchers), `StatsWidget.tsx`, `ProfileHeader.tsx` | Filler / chrome | **Remove the illustration** (plain error; the path widget keeps text/markers; stats & profile are about the user, not a mascot). Phase 3. |
| `KnightToast.tsx` | Celebration toast — **not rendered anywhere** | **Delete** (dead code). Phase 4. |
| `CroatianKnight.tsx` (1,310 lines) | The mascot SVG | **Delete** once zero importers. Phase 4. |
| `src/tests/components.test.tsx` (knight mood test), `src/tests/knightSpeak.test.ts` | Tests | Update: drop the CroatianKnight render test; keep `knightSpeak` dispatch test (channel stays). Phase 4. |

> The hybrid calls above are the working defaults; each phase's plan confirms them per-site as it's written.

---

## Phase 1 — Coaching companion → prof. Kovač  (detailed; first to ship)
The only load-bearing surface; smallest, highest-value cut.

- **Renderer:** rewrite `KnightCompanion.tsx` to render `CharacterPortrait name="kovac" size={52}` inside a coloured ring, keeping the fixed bottom-left mini button, the speech bubble (auto-hide ~4s, tap-to-close, "prof. Kovač" eyebrow), the `knight:celebrate` burst, `knight:quest-done` handler, tap-to-message, hidden-on-home logic, and the `_isNative` path. Remove the `<CroatianKnight>` usage here.
- **State without a face** — a pure exported `coachVisual(mood: string): { ring: string; glyph: string | null; klass: 'positive'|'negative'|'thinking'|'idle' }`:

  | Class | Moods | Ring | Glyph |
  |---|---|---|---|
  | positive | encouraged, proud, happy, celebrating, victory, onfire, tearsofjoy, levelup, winking | green `#16a34a`→`#15803d` (gold `#C8980A` for celebrating/victory/levelup) | ✓ (★ for the gold set) |
  | negative | oops, sad, struggling, worried, droop | red `#dc2626`→`#991b1b` | ✗ |
  | thinking | thinking | purple `#7c3aed`→`#5b21b6` | 💭 |
  | idle | ready, neutral, marching, glancing, unknown | teal `#0e7490`→`#164e63` | none |

  The glyph (26px white-on-fill, white-bordered, top-right of the button) shows during a `knight:flash` for its `durationMs` and alongside a `knight:speak` bubble; idle shows the teal ring, no glyph.
- **Voice:** keep dispatcher `text` verbatim (attributed via the "prof. Kovač" bubble label). Rewrite the in-file `TAP_POOL` to Kovač's tutor voice; keep the `knight:quest-done` line; update `aria-label`/`title` to "prof. Kovač, your Croatian coach".
- **Idle:** drop the 30s "glancing" facial attention-getter (static portrait can't glance); optional subtle ring pulse (drop if it complicates native — YAGNI).
- **Tests:** `coachVisual` table (all 18 moods + unknown→idle + gold→★); `KnightCompanion.test.tsx` — renders `portrait-kovac` off-home, hidden on dashboard, `knight:speak` shows bubble+label, `knight:flash` negative→✗/red & positive→✓/green.
- **E2E:** audit for knight aria-label/"Vitez Hrvoje" assertions (likely `testids.smoke`) and update.

## Phase 2 — Home greeting → host family
Replace the home hero knight (`KnightBubble` 92px + `KnightSpeech` + `useKnightSpeech` + `heroData`/`heroHelpers`) with a host greeter. **Open decision (resolve at Phase 2 design):** host-of-day (matches the Dom `dayOfYear()%5` rotation — most consistent) vs fixed Baka. Keep the quick-reply pills + translator; swap portrait + greeting voice; keep `_isNative`. Note the Dom SessionCard host header already greets — reconcile so home doesn't double-greet.

## Phase 3 — Decorative / onboarding / states sweep (hybrid)
Apply the disposition map: replace knights with the listed host (onboarding, stories→Baka, lessons/results→Kovač, comeback→host-of-day); remove the filler ones (error boundary, path-widget marchers, stats, profile). Batch by area; each replacement uses `CharacterPortrait`; each removal simplifies the surface to text/icon. No event-channel changes.

## Phase 4 — Delete + sweep
Once Phases 1–3 leave zero importers of `CroatianKnight`: delete `CroatianKnight.tsx` and `KnightToast.tsx` (dead); update `components.test.tsx`/`knightSpeak.test.ts`; full-text sweep for "Hrvoje"/"knight"/"Vitez" in src (strings, comments, aria-labels) → zero; keep the `knightSpeak`/`knight:*` channel (internal) unless a later cleanup renames it under its own task.

---

## Decomposition / sequencing
This is a program; each phase is its own plan + PR (working software at each step). **Phase 1 ships first** (load-bearing, approved, self-contained). Phases 2–4 follow in order; Phase 4 only after 1–3 remove all importers. Each later phase gets its detailed plan when reached.

## Non-goals / open items
- Not renaming the internal `knight:*` event channel or `knightSpeak`/`knightFlash` helpers (separate optional cleanup).
- Phase 2 greeter identity (host-of-day vs Baka) decided at Phase 2 design.
- `CroatianKnight.tsx` stays until Phase 4 (still imported through Phase 3).
- Per-site hybrid calls are defaults; confirmed in each phase's plan.
