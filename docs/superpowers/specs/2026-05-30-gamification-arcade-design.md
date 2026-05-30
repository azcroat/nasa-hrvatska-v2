# Gamification: the Arcade, the Map, and the Duel — Design Spec

**Date:** 2026-05-30
**Status:** Draft for user review
**Author:** brainstorming session (jschr + Claude)

---

## 1. Problem & Goal

Two children (12 and 15) treat the app as a chore. The goal is to make Naša Hrvatska feel
like a **video game** so they open it **multiple times a day**, while:

- **No awards/badges, no leaderboards.** (Explicit constraint.)
- **Not "kiddy."** Adults must still enjoy it. Premium heritage register only.
- **No paywall / monetization gating.** (Explicit, ongoing.)
- **Never destroy user progress.** No decay, no losing the map.
- Built **on existing Croatian exercise content**, not new curriculum.

The kids are competitive but **competition alone is not durable** — it collapses when one
sibling loses repeatedly or isn't online. So the design layers four motivators, with
competition as one of four, not the whole thing.

### The four motivation pillars

| Pillar | "Open it" trigger | Works when sibling absent? |
|---|---|---|
| **Competence** | beat your own best / land *u sridu* / clear today | ✓ always |
| **Collection** | one region from completing the Map | ✓ always |
| **Rivalry** | sibling challenged me / I want the lead back | needs sibling |
| **Co-op** | we're both close to a shared goal | needs sibling (no loser) |

The **individual spine** (Competence + Collection) carries daily engagement solo; the
**social layer** (Rivalry + Co-op) rides on top as the spike.

---

## 2. Core Idea: learning tasks rendered as game *modes*

The practice surface becomes an **Arcade** — a hub of five game modes. Each mode is a
different genre built on the **same existing exercises** (vocabulary, conjugation, case,
listening, etc.), wrapped by a shared scoring engine. Four of the five are fully playable
**solo**.

| Mode | Genre | Solo loop | Signature? |
|---|---|---|---|
| 🐎 **Alka** | precision / skill | chase a flawless 9/9 | **Flagship** |
| ⚔️ **Boss Battle** | folklore combat | defeat the creature, add it to collection | |
| ♾️ **Survival Run** | roguelike | 3 hearts, endless, beat your furthest | |
| 🧩 **Sentence Forge** | tile puzzle | 3-star a sentence (teaches the case system) | |
| 🛡️ **Sibling Duel** | async PvP | — (social spike) | |

### 2.1 Alka (flagship)

Themed on the **Sinjska alka** (Sinj, commemorating the 1715 victory over the Ottomans;
UNESCO Intangible Cultural Heritage 2010). The player rides as an **alkar** down the
*trkalište* and aims a lance at the **alka** ring.

- The ring has the real 3 scoring zones: center **u sridu = 3**, upper field **= 2**,
  the two lower fields **= 1** each.
- **Skill → aim mapping:** answering fast + correct + on a combo **tightens the aim
  reticle toward the 3-point center**; slow or wrong answers **drift it outward** to the
  1-point field (or a miss).
- **Three runs** per ride → max **9 points** (the authentic format).
- A perfect center strike triggers *"U sridu!"* and the *mačkule* (cannon) flourish.
- Led thematically by the *Alkarski vojvoda*; presentation respects the heritage (no
  cartoon treatment).

This is the headline because it is the most distinctly Croatian, the most adult-prestige,
and gives the cleanest skill ceiling — mastery is *visibly* rewarded by landing *u sridu*.

### 2.2 Boss Battle
Fight a Croatian-folklore creature (e.g. *Vila od Velebita*) with a Ward/HP bar. Right
answers strike; slow/wrong lets it strike you (hearts). Defeat it → the creature joins
your collection. Themed as culture, not a cartoon monster.

### 2.3 Survival Run
Roguelike. 3 hearts, escalating difficulty, randomized question order, "how far can you
get?" You race your own ghost (furthest question reached). Infinitely replayable solo.

### 2.4 Sentence Forge
Tile puzzle. Drag word-tiles **with case endings** to assemble a correct Croatian
sentence. Turns the hardest part of Croatian — the case system — into a tactile puzzle.
Star rating (1–3) by accuracy/efficiency. High pedagogical value.

### 2.5 Sibling Duel
Async PvP over an existing mode (default: Alka or a verbs set). One sibling plays and
records a score; the other gets a challenge to beat it. **No real-time server** — it is a
score exchange (see §5.3). Includes a **rivalry tracker** (1v1 head-to-head tally, e.g.
"You lead 4–3") and a **co-op variant** (combined points toward a shared town goal — no
loser). Handicapping (§4) keeps the 12-vs-15 matchup fair.

---

## 3. The Map of Croatia (collection / persistent solo world)

A visual map of Croatia is the **persistent individual goal**. Mastering a region's
content (in *any* mode) **restores / lights up** that region. It only ever grows — no
decay (progress-protection constraint).

- Backed by the existing `src/data/cultural/regions.js` `REGIONS` data (each region
  already has title, color, icon, cultural content).
- Target granularity: Croatia's **20 counties + City of Zagreb = 21 regions** (or the
  existing REGIONS set, mapped to map positions — to confirm during planning).
- "Restored" = the player has reached a mastery threshold on that region's associated
  content. Thresholds read from existing mastery/XP signals; no new grading.
- Map doubles as the **collection display**: regions restored, folklore creatures
  defeated, Alka rings won (cosmetic trophies only — no badges/awards surfaced as a
  ranked wall).

This is the layer that makes the app worth opening when no sibling is around: "I'm one
region from finishing the coast."

---

## 4. Scoring engine (shared core)

A single reusable engine all modes call. Inputs per answer: **correct?**, **response
time**, **current combo**. Outputs: points, combo state, and a normalized **performance
tier** (used by Alka to pick the ring zone, by Boss Battle for damage, etc.).

- **Combo:** consecutive correct answers multiply score; a wrong answer resets combo.
- **Speed bonus:** faster correct answers score more (bounded, so it rewards fluency
  without punishing thoughtful adult learners too harshly — tunable).
- **Performance tier:** maps the run's quality to mode-specific outcomes (Alka zone 1/2/3,
  Boss damage, Survival distance, Forge stars).
- **Handicap (for duels):** scoring can normalize to the player's own CEFR baseline so a
  12-year-old at A1 can genuinely out-ride a 15-year-old at B1 ("% above your own level"),
  keeping sibling duels fair and non-discouraging.

The engine is **pure/Testable in isolation** (no UI, no Firebase) — given a sequence of
(correct, ms, combo) it returns deterministic scores. This is the first thing built and
unit-tested.

---

## 5. Architecture & integration

### 5.1 Where it plugs in
- New screens routed via `AppRouter.tsx` (`currentScreen === 'arcade'`, `'alka'`,
  `'boss'`, `'survival'`, `'forge'`, `'duel'`, `'map'`). Each new id must be covered by
  the existing `session-routes` / dead-lesson guard pattern.
- Exercises are **sourced from existing pools** (`src/data/exercises.js`,
  `daily-content.js`, the CEFR pools used by `useDailySession`) via a thin **content
  adapter** so modes never hard-code questions.
- XP/streak continue to flow through `StatsContext`; game play awards XP through the
  existing path (no parallel currency).

### 5.2 The GameShell + ModeAdapter pattern
- **GameShell** — a single component that runs a timed sequence of questions, owns the
  scoring engine, the combo/speed HUD, and the result screen.
- **ModeAdapter** — per mode: how to source questions, the win/lose rule, how performance
  tier maps to the mode's visuals (ring zone, HP, hearts, stars), and the themed skin.
- Adding a mode = adding an adapter, not rewriting the loop. This keeps each mode small
  and independently testable.

### 5.3 Async sibling duels (no real-time server)
- Reuses **Firebase/Firestore** (already in the app). A duel is a small shared document:
  challenger writes `{mode, setId, score, ts}`; the opponent reads it, plays the same set,
  writes their score; the rivalry tally updates.
- Fits existing sync semantics (`set({merge:true})` deep-merge + `arrayUnion`); writes are
  coalesced like existing progress writes. **Two accounts, two devices** (confirmed).
- No presence/realtime channel needed — it is turn-based by nature ("he played at lunch,
  you play after school").
- Write-volume must be checked against the 0b write-inventory budget during planning
  (duels add writes per ride; confirm it stays well under the Spark cap).

### 5.4 Visual register (hard constraint)
- Reuse the existing premium identity: deep navy + gold (`#C8980A`/`#FFE070`), the grb,
  Playfair Display headings, heritage scene photography. Restrained "juice" (subtle damage
  numbers, quiet combo labels) — satisfying but never Comic-Sans/candy-cartoon.
- Folklore and heritage (Alka, vile, Velebit, Sinj 1715) are treated as **culture**, which
  is what keeps it adult-appropriate.
- Respect existing platform constraints: Framer-motion native-WebView guard, TTS auth via
  `audio.ts._ttsPost` (never raw `/api/tts`), šahovnica rendering rule if used.

---

## 6. Placement & home-screen hooks (the multiple-sessions-per-day engine)

**Prominence is a hard constraint: do not bury the game at the bottom of any page.**
The Arcade and its hooks are **primary, above-the-fold destinations** — a top-level
navigation entry and the first thing a returning learner sees, not a card appended below
existing practice/lessons content. If the kids have to scroll to find it, the feature
fails. Specifically:

- The **Arcade** is a primary navigation destination (top-level tab / hero-adjacent
  entry), reachable in one tap from launch.
- The **Daily Alka** ride and any **pending duel / map-proximity** hook appear at the
  **top** of the home surface, not beneath the existing lesson/quest stack.
- These hooks must survive the existing collapsible-hero behavior — they are not hidden
  inside a collapsed section.

Engagement comes from **several independent "open it" triggers**, so there is always a
reason even on a day a sibling is offline:

1. **Daily Alka** — one signature ride that resets daily; chase today's best.
2. **Map proximity nudge** — "1 region from completing Dalmatia."
3. **Pending duel** — "Marko beat your Alka score — ride again?" (push/in-app).
4. **Streak** — existing streak, now also fed by any Arcade play.
5. **Survival ghost** — "your record is Q-37 — beat it?"

No energy meter / no lives-gating between sessions (that reads as a paywall-shaped gate and
risks the progress-protection principle). Play is unlimited; the *hooks* are
informational, not restrictive.

---

## 7. Build order (phased — each phase = its own implementation plan)

This is large; it decomposes into three shippable phases, biggest-risk-first:

- **Phase G1 — Engine + Alka + Map (solo MVP).**
  Scoring engine (pure, unit-tested) → GameShell + ModeAdapter → Alka mode end-to-end →
  Arcade hub entry → Map of Croatia progression. Ships a complete, satisfying **solo**
  experience and de-risks the engine + content-adapter + routing + the dead-lesson guard.

- **Phase G2 — More solo modes.**
  Boss Battle, Survival Run, Sentence Forge as additional ModeAdapters on the same engine.
  Each is small because the loop already exists.

- **Phase G3 — Sibling Duels (async social).**
  Firestore challenge exchange, rivalry tracker, co-op variant, handicap scoring, home
  notifications. Most infra-heavy, so last.

Each phase goes through its own writing-plans → implementation cycle.

---

## 8. Testing strategy

- **Scoring engine:** pure unit tests (vitest), parametrized over (correct, ms, combo)
  sequences and tier boundaries.
- **ModeAdapters:** unit-test the question-sourcing + tier→outcome mapping per mode.
- **Routing:** every new screen id added to the `session-routes`/dead-lesson guard so no
  Arcade mode can ship as an empty page.
- **Duels:** emulator test (`npm run test:emulator`) for the Firestore challenge doc
  round-trip + merge semantics; write-count assertion vs the 0b budget.
- **E2E:** Playwright happy-path for the flagship Alka ride (light theme, audio stubbed,
  data-testids) per existing patterns.
- **Lint/size:** new components stay under the `max-lines` budget (no new grandfathered
  files); each mode/adapter is its own focused file.

---

## 9. Out of scope (YAGNI)

- Real-time multiplayer / live duels.
- Energy/lives gating, paywalls, purchasable cosmetics.
- Global leaderboards or public ranking walls.
- A full open-ended "Build-a-Croatia" sandbox beyond the Map progression.
- New curriculum content (modes reuse existing exercises).

---

## 10. Open questions to confirm during planning

1. Map granularity: the 21 administrative regions vs. the existing `REGIONS` set — which
   maps cleanest to a recognizable Croatia map image?
2. Speed-bonus tuning: how aggressive before it discourages adult/thoughtful play?
3. Duel default mode: Alka vs. a quick verbs set for the first social loop.
4. Handicap formula specifics (CEFR-relative normalization).
