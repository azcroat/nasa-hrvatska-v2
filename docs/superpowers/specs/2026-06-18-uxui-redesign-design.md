# Naša Hrvatska — UX/UI Redesign: "A Place, Not an App"

**Date:** 2026-06-18
**Status:** Design approved (visual mockups + host-family cast locked). No app code changed yet.
**Author:** brainstorm with jschr (visual-companion mockups)

---

## 1. Problem

The app overwhelms users on every surface **except Home**. Measured from the live code:

| Tab | Approx. interactive elements | Verdict |
|---|---|---|
| Today (Home) | ~15–20 | Calm — the gold standard |
| AI Tutor | ~12 | Clean catalog |
| Me | ~30–50 (sub-tabbed) | Manageable |
| Learn | ~30–40 (nested lists) | Heavy |
| Discover Croatia | ~40–60 (2000px+ scroll) | Dense |
| **Practice** | **~150+** | Severely overloaded |

There are ~150 distinct exercise screens behind 6 tabs. Practice alone stacks an Arcade button, hero, quests, speed challenge, listening card, weak-words CTA, three mutually-exclusive panels, and a flat grid of **70+ exercise tiles** — textbook decision paralysis.

Two root causes:
1. **Information architecture presents everything at once** instead of guiding to one next action (the thing Home gets right).
2. **The Croatian cultural identity is present but used as decoration**, not as the organizing spine, and is undercut by carnival gamification ("corny awards").

### Why Home works (the principle to propagate)
- A single locus of attention (the SessionCard says "do this next").
- Progressive disclosure (discoveries tabbed, not stacked).
- Gamification kept off the canvas (celebrations are modal, not persistent).

## 2. Vision

**Emotional anchor (user's choice): "welcomed into a Croatian family."** Reframe the app from *a course with a scoreboard* into *people who are glad you're here*.

**Direction: "a place, not an app."** Reimagine the information architecture around a host family. The 150 screens stop being a *menu* (overload) and become a *place full of people* (richness, discovery). The content does not shrink; the way the user meets it changes.

## 3. Navigation

Replace the 6-tab bar with **5 warm, Croatian-named destinations** (Croatian label + English subtitle for orientation):

| Order | Croatian | English | Was |
|---|---|---|---|
| 1 | **Dom** | Home | Today |
| 2 | **Učenje** | Learn | Learn |
| 3 | **Grad** | Practice ("into town") | Practice |
| 4 | **Razgovor** | Talk | (new — absorbs AI) |
| 5 | **Hrvatska** | Discover | Discover Croatia |

- The cold **"AI Tutor" tab dissolves** — the AI partners *become the family you talk to*, living in **Razgovor** (and surfacing inside Dom/Grad in context).
- **"Me"** moves off the main bar to a top-corner affordance (it's a settings/stats surface, not a daily destination).
- Tab icons become small šahovnica / pleter / Adriatic marks in the brand palette (not emoji).

**File:** `src/components/shared/TabBar.tsx` (+ `Sidebar.tsx` for desktop) is the single place this changes.

## 4. The host family (the organizing principle)

Different family members host different contexts. This is the IA, not decoration: content is reached by *visiting a person/place*.

| Character | Role | Hosts (content domain) |
|---|---|---|
| **Baka Marija** | grandmother | kitchen — stories, idioms, culture, food |
| **Ana** | barista | café — practical dialogue, ordering, small talk |
| **Marko** | fisherman | market / coast — food, numbers, shopping, everyday vocab |
| **prof. Kovač** | tutor | the tutor's table — grammar (cases, tenses) |
| **Ivo** | cabbie | getting around — directions, city navigation |

Progress is expressed **relationally** ("3 phrases due with Ana") rather than via badges.

### Character art (locked)
- **Flat illustration** style (no painterly shading, no AI-photo). Solid colours, simple shapes, crisp SVG.
- Shared construction: skin head oval, **hair/headwear on the head with a real hairline**, **eyebrows directly over the eyes**, head sized with margin (a *portrait*, never filling the circle), small backdrop circle tinted per character.
- All five are designed and approved. Reference build scripts (kept outside the repo at `C:\dev\nasa-hrvatska-v2\`): `build_baba_flat.py`, `build_cast_full.py` (Kovač), `build_men2.py` (Ivo), `build_marko3.py` (Marko); the locked SVGs are to be ported into reusable React components.
- **To implement:** one `<CharacterPortrait name=… size=…/>` component family under `src/components/family/`, replacing the ad-hoc avatars and the existing `CroatianKnight` mascot usage on these surfaces.

## 5. Screen designs

### 5.1 Dom (Home) — "Transported" welcome
- **Photographic hero** using a real Croatian scene asset (e.g. `public/images/scenes/dubrovnik-ai.webp`), flag stripe on top.
- **Family member of the day** greets and *remembers* the user — a natural Croatian line + English echo (e.g. Baka: „Sjedni, dijete — skuhala sam kavu.").
- **Quiet progress** — small gold dots ("4th morning in a row"), never a flame counter or badge.
- **One clear next thing** — a single primary card ("Continue: Past tense, with Marija") with one CTA (`Počni →`).
- **A small daily gift** — a compact tabbed strip (Riječ / Razglednica / Grad): word, postcard, city — not a vertical stack.

### 5.2 Učenje (Learn) — the guided path
- **One "Continue" card** led by prof. Kovač → the current lesson, single CTA (`Nastavi →`).
- **Tvoj put (your path)** — a clean vertical journey A1→C1: completed lessons checked, current highlighted, upcoming locked; grouped by CEFR stage. No wall of nested lists.
- **Browse-all** demoted to a quiet link.
- Preserves the existing sequential LearnPath design intent (A1→C1, Next-only).

### 5.3 Grad (Practice) — "into town" (hybrid)
- Default view is a **calm list of places**, led by **one recommended visit** ("Ana saved you a table — 3 phrases due") then a short list of places (café, market, kitchen, tutor's table, getting around), each showing host + what's practiced + a quiet "due" count.
- A **`🗺️ Karta` toggle** opens an **explorable illustrated town/coast map** (immersion on demand) — the same places as pins.
- **Every existing exercise lives inside a place** (grammar at the tutor's table, slang on the pitch, ordering at the café). The 70+ flat tiles are reorganized by who/where; nothing is deleted.
- Retires the gold-shimmer Arcade button and on-canvas quest clutter here.

### 5.4 A drill *inside* a place (the payoff pattern)
Example: tapping "go to Ana" lands in her café. The dialogue exercise becomes a **real exchange** — Ana speaks (Croatian + English), the user **orders by tapping an option or speaking aloud** (🎤 "Reci svojim riječima"). Same underlying exercise engine, wrapped in a person + place. Quiet progress dots, no badges. This pattern generalizes to all place-hosted drills.

### 5.5 Razgovor (Talk)
AI conversation partners are the family members (existing persona portraits map to the cast). This is where "AI Tutor" content moves. *Detailed screen design deferred — see §9.*

### 5.6 Hrvatska (Discover)
Keep the content; apply the same decluttering (one entry, progressive disclosure, place/person framing). *Detailed screen design deferred — see §9.*

## 6. Removing the "corny awards"
Remove the carnival gamification the user explicitly dislikes; replace with quiet, relational feedback.

**Remove / retire:** `BadgeToast` ("🏅 Achievement Unlocked" shimmer + sparkles), `StreakMilestoneToast` (theatrical knight speeches), `CelebrationModal` / `CeremonyModal` / `LevelUpModal`, Prestige, confetti, and the always-on knight companion on these surfaces.
**Keep (quiet):** a subtle XP tick and a plain streak/“mornings in a row” indicator.

## 7. Visual system (reuse what exists)
- **Palette:** Adriatic teal `#0e7490`, Croatian red `#D40030`/`#c0392b`, terracotta `#c2410c`, Korčula stone `#f5f0e8`, gold `#C8980A`.
- **Type:** Outfit (UI) + Playfair Display (editorial headings).
- **Cultural motifs (already in app):** `CroatianGrb` (šahovnica), `CroatianCross` (pleter), `CipkaPattern` (Pag lace), scene photography in `public/images/scenes/`. Use as the quiet spine (dividers, tab marks, hero accents), not loud decoration.
- Plain CSS + design tokens in `src/index.css` (no Tailwind).

## 8. Units / components affected (high level)
This is a design spec; the implementation plan (writing-plans) will sequence the work. Major units:
- `TabBar.tsx` / `Sidebar.tsx` — 5-place navigation, new icons, "Me" to corner.
- New `src/components/family/CharacterPortrait.*` — the locked cast as components.
- `HomeTab` (Dom) — restructure to the family-host welcome + one-next-thing + tabbed daily gift.
- `LearnTab` (Učenje) — continue-card + vertical path; demote BrowseContentModal.
- `PracticeTab` (Grad) — replace with recommended-visit + places list + map toggle; reorganize `exerciseCatalog.ts` by place.
- New `Razgovor` surface absorbing `AITab` content.
- Remove/retire badge & ceremony components (§6).
- Each exercise screen gains an optional "place wrapper" (host + context) — the drill engine itself is unchanged.

## 9. Out of scope / deferred / open questions
- **Razgovor and Hrvatska** detailed screen designs (next brainstorm pass).
- **Full mapping of all ~150 exercises to the 5 places** — needs a content-audit pass.
- **Map-view illustration** (the CSS sketch is a placeholder; final is hand-illustrated art).
- **Migration for existing users:** muscle-memory change on navigation; ship behind a feature flag and consider an onboarding hint.
- Respect existing constraints: no paywall/monetization gating; never destroy user progress; keep CEFR-as-int sync rules.

## 10. Success criteria
- Practice ("Grad") drops from ~150 on-screen elements to **one recommended visit + a short list of places**.
- Every primary surface obeys the Home discipline (one locus of attention, progressive disclosure, no on-canvas carnival).
- The cast appears consistently across Dom, Učenje, Grad, and drills, so the app reads as one Croatian family.
- No "corny award" surfaces remain on the daily path.
