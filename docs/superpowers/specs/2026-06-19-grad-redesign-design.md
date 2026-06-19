# Phase 6 — Grad (Practice) Redesign — Design Spec

> Sixth phase of the Naša Hrvatska "welcomed into a family / a place, not an app" UX/UI redesign. Collapses the app's most overloaded tab (Practice, ~150+ elements / 66 catalog exercises + games + adaptive layer) into a calm, host-led **Grad** ("into town") where every exercise lives inside a place. Visual design approved screen-by-screen via the brainstorm visual companion (2026-06-19).

**Goal:** Re-present Practice as a town of six host-led places led by one adaptive "Today" card, with a list⇄map (`Popis`/`Karta`) toggle, **without changing any exercise's behaviour and without orphaning any exercise**.

**Architecture:** A re-presentation layer over the existing exercise screens. A new `src/components/grad/` module (registry + model + tab + map + place screen) replaces `PracticeTab` and its panels. Every catalog exercise gains a required `place` field; non-catalog launches (Quick Games, Arcade, Speed Challenge) are registered as `GRAD_EXTRAS`. The adaptive engine that already exists drives a "recommended visit." A structural unit test proves nothing is orphaned.

**Tech stack:** React 18 + Vite + TypeScript; plain CSS + design tokens in `src/index.css` (no Tailwind); Outfit + Playfair fonts; Vitest + @testing-library/react; Playwright e2e; Cloudflare Pages (auto-deploys on master push).

## Global Constraints
- Plain CSS + tokens. Palette: Adriatic teal `#0e7490`/`#164e63`, Croatian red `#D40030`, terracotta `#c2410c`, Korčula stone `#f5f0e8`, gold `#C8980A`. Fonts Outfit (UI) + Playfair (headings).
- ASCII-only commit messages, ending `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Work on a `feat/uxui-grad-phase6` branch; never push to master. Merging deploys.
- **No orphaned exercises:** every launch reachable from the old Practice surface must remain reachable in Grad. Enforced by a unit test (Section 6), not by inspection.
- **Exercise behaviour is untouched:** Grad only changes navigation/presentation. The 66 exercise screens, Arcade, adaptive hooks, SRS, and CEFR gating are reused as-is.
- Character art is the **locked flat-illustration cast** (`src/components/family/`): ana, marko, kovac, baka, ivo. Map/scene art is hand-crafted SVG (flat, on-brand), a single swappable layer.
- CI gates **desktop** e2e only; mobile e2e specs are non-blocking follow-ups.

---

## Section 1 — Place taxonomy (the mapping)

**Six town places + a logical "Today" bucket.** All five family hosts are used; the Trg (Square) is hosted by the town. The "Today" bucket is not a map place — it is what the Today card surfaces.

| Place id | Name | Host | Icon | Holds (theme) |
|---|---|---|---|---|
| `kavana` | Anina kavana | ana | ☕ | practical conversation |
| `trznica` | Markova tržnica | marko | 🐟 | vocabulary + vocab games |
| `soba` | Kovačeva soba | kovac | 📚 | grammar + pronunciation (heavy → subgroups) |
| `kuhinja` | Bakina kuhinja | baka | 🍲 | stories, wordplay, culture |
| `ulica` | Ivina ulica | ivo | 🚕 | slang + getting around (heavy → subgroups) |
| `trg` | Trg | town (null host) | 🎪 | games hub: Arcade/Alka, Speed, Word Sprint |
| `today` | Danas u gradu | rotating | ☀️ | adaptive layer (not a map place) |

**Authoritative exercise → place mapping.** (Exercise ids from `exerciseCatalog.ts`. The catalog's exact membership is whatever `buildExercises()` returns at implementation time — the inventory observed a 66-vs-71 count discrepancy likely from flag-gated entries such as `conjlab`; the no-orphan test enforces completeness regardless of the precise count.)

- **kavana** (Ana): `restaurant`, `convmatch`, `scenes`, `dialogue` + extra `speaking`
- **trznica** (Marko): `znam`, `possess`, `opposites`, `ordinals`, `emogender`, `verbdrill`, `pronouns`, `collocations`, `wordfamilies`, `numtime` + extras `quiz`, `flash`, `match`
- **soba** (Kovač) — subgroups:
  - `padezi` (cases): `grammarmap`, `prepdrill`, `genderdrill`, `profgender`, `sibil`, `accusativedrill`, `numcases`, `neggen`, `animateacc`, `instrumental`, `dative`
  - `glagoli` (verbs): `future`, `reflexive`, `imperative`, `passive`, `fleetinga`, `conjlab`, `aspectdrill`, `tenseflip`
  - `recenice` (sentences): `cloze`, `unjumble`, `qwords`, `negation`, `comparatives`, `coloragree`, `relpron`, `sentbuild`, `sentencetiles`, `clitic`, `translate_drills`, `production_drill`
  - `izgovor` (pronunciation): `pitchaccent`, `shadowing`, `dictation`, `proncontrast`, `pronunciation_assess`
- **kuhinja** (Baka): `storyselect`, `fillstory`, `riddles`, `logicquiz`, `brzalice`
- **ulica** (Ivo) — subgroups:
  - `snalazenje` (getting around): `cityloc`
  - `svakodnevni` (everyday): `slang_everyday`, `slang_slang`, `slang_genz`, `slang_football`
  - `regionalni` (regional/dialect): `slang_dalmatian`, `slang_zagreb`, `slang_regional`, `slang_satrovski`
  - `kultura` (culture/adult): `slang_classics`, `slang_people`, `slang_pijani`, `slang_art`
- **trg** (town): extras `arcade`, `typing`, `listening`, `wordsprint`, `speedchallenge`
- **today** (adaptive bucket): `srsreview`, `adaptive_review`, `cefrtest` + the adaptive panels (weak words, daily listening, daily quests, adaptive practice queue) which are signals/components, not catalog exercises.

> The plan finalizes any borderline subgroup placement, but the place-level home of each exercise above is locked. Re-bucketing within `soba`/`ulica` subgroups is allowed; moving an exercise to a different *place* is a design change.

---

## Section 2 — Default surface (`Popis`)

When the user opens Grad they see, top to bottom:
1. **Slim hero** — eyebrow "u grad" + title "Grad" + the `📋 Popis | 🗺️ Karta` view toggle + the red/white/teal stripe.
2. **"Danas u gradu" Today card** — the single recommended visit, chosen by `recommendedVisit()` and phrased **relationally through a host** ("Ana ti je spremila 6 fraza"). One primary CTA that **launches that exercise in one tap**. Beneath it, a quiet 4-dot daily-quest row. No XP bars, no flame.
3. **Places list** — one calm row per place: host `CharacterPortrait`/tinted disc + Croatian name (Playfair) + one-line blurb + a quiet right-side signal (a count like "2 due" / "8 riječi"). The recommended place carries a thin **gold edge** (matching the Today card). No exercise tiles at this level.

**Behaviour locked:** Today card launches the exercise directly (1 tap); right-side signal is a quiet count; list order is recommended-place-first then a fixed warm order (kavana → trznica → soba → kuhinja → ulica → trg). Big adaptive blocks (QuestTracker, SpeedChallenge) move *inside* their place (Today/Trg), not the front page. Tapping a row opens that place.

---

## Section 3 — Karta (map)

The same six places as an **explorable flat-vector Adriatic town** (Rovinj-style promontory: gradient sky + sun glitter, layered hills, island, bell tower, cascading terracotta roofs, cypresses, stone quay, sailboats). Places are landmarks placed geographically (café on the square, market at the harbour, study uphill). The recommended place **pulses gold with a count badge**; a slim "Today" bar floats at the bottom so the recommended visit is one tap away in either view.

**Behaviour locked:** fit-to-view (all six visible on one screen — no large pannable world), landmarks placed geographically, recommended pulse + badge. Tapping a landmark opens the same place interior as its list row. View choice persists (`nh_grad_view`). Map art is hand-crafted SVG, one swappable layer (a richer/AI-generated illustration can replace it later without structural change).

---

## Section 4 — Inside a place (drill-in-place)

Tapping a place opens its interior:
1. **`← Grad` back bar** + place name.
2. **Place hero** — a crafted flat scene for that place (e.g. café: terracotta wall, shuttered window, red/white scalloped awning [eight identical pennants aligned to the stripes], bistro table, plant) with the host's `CharacterPortrait` in a gold ring and a **contextual greeting** (hr + en) reflecting the user's state.
3. **Quiet progress line** ("3 od 5 · 2 za ponavljanje").
4. **One "Nastavi · preporučeno" card** — the recommended exercise within this place.
5. **Exercise list** — inviting cards: icon + Croatian name + meta (type · CEFR · duration) + status (done ✓ / gold "due" / **locked teaser** with the unlock level, still in the DOM). Tapping launches the existing exercise screen unchanged.

**Heavy places** (`soba` ~36, `ulica` 13) render **subgroup headers** (collapsible accordions) instead of a flat list, with the recommended item surfaced at the top. Small places render flat.

---

## Section 5 — Data model

**`src/components/grad/places.ts` — registry (single source of truth):**
```ts
export type PlaceId = 'kavana' | 'trznica' | 'soba' | 'kuhinja' | 'ulica' | 'trg';
export interface Place {
  id: PlaceId;
  name: string; nameEn: string;
  host: CharacterName | null;      // null for trg
  icon: string; blurb: string; tint: string;
  mapPos: { x: number; y: number };          // % on the Karta
  subgroups?: { key: string; label: string }[]; // heavy places only
  greeting: (ctx: GreetCtx) => { hr: string; en: string };
}
export const PLACES: Place[];   // 6 entries (today is a logical bucket, not in this array)
```

**Tagging exercises.** Each `buildExercises()` entry in `exerciseCatalog.ts` gains:
```ts
place: PlaceId | 'today';
subgroup?: string;   // required iff the place declares subgroups
```
Non-catalog launches (Quick Games, Arcade, Speed Challenge) are declared in `GRAD_EXTRAS: Array<{ id; label; icon; place; cefr?; launch(props) }>` in the registry; their launches use the props `GradTab` already receives (`onLaunchQuiz`, `onLaunchFlash`, `onLaunchMatch`, `onLaunchListen`, `onLaunchSpeaking`, `setScr('arcade')`, `setScr('wordsprint')`).

**`src/components/grad/gradModel.ts` — assembles + computes:**
- `itemsForPlace(placeId)` → tagged catalog entries + extras, ordered and grouped by `subgroup` when present.
- `placeStats(placeId, stats, sr)` → `{ total, done, due, lockedCount, recommendedItem }`.
- `recommendedVisit(stats, recs, queue)` → **the Today engine**, reusing existing signals only. Priority ladder: (1) SRS-due (`nh_sr`) → (2) weak words (`recs.weakCount`) → (3) smart review / adaptive queue → (4) today's unfinished daily quest → (5) goal-based rec → (6) free-day fallback (new content / Trg). Returns `{ exerciseId, placeId, host, hr, en, count, durationMin, launch }`.

**Components:**
- `src/components/grad/GradTab.tsx` — replaces `PracticeTab`; Today card + places list + view toggle.
- `src/components/grad/GradMap.tsx` — the SVG town + markers + floating Today bar.
- `src/components/grad/PlaceScreen.tsx` — place interior (hero + greeting + Nastavi card + exercise list + subgroups).
- `src/components/grad/places.ts`, `gradModel.ts` — registry + model.

**Reused untouched:** all exercise screens, Arcade, `useAdaptivePractice`, `useSmartRecommendations`, SRS, `isUnlocked`/CEFR. **Replaced/removed:** `PracticeTab.tsx` + `ReviewPanel`/`DrillPanel`/`ChallengePanel`/`AllPanel`/intent strip/`ExerciseCard` wall. View choice persists in `localStorage` (`nh_grad_view`).

---

## Section 6 — Testing & the no-orphan guarantee

**1. No-orphan gate — `gradModel.test.ts` (keystone):**
- Every `buildExercises()` entry has a `place` (or `'today'`) that exists; every `GRAD_EXTRAS` entry too.
- `union(itemsForPlace(p) for p in PLACES) ∪ todayItems` **equals** `catalog ids ∪ GRAD_EXTRAS ids` — no duplicates, no missing items.
- **Coverage-parity snapshot:** the set of launch targets reachable from Grad equals the inventory's "must-not-orphan" list (66 catalog targets + 7 Quick Games + Arcade) captured in this brainstorm. A future edit dropping one fails the build.
- Every `subgroup` referenced exists in that place's declared subgroups; places without subgroups carry only flat items.

**2. Registry integrity (unit):** every `PlaceId` has a `Place`; each non-null `host` is a valid `CharacterName`; `recommendedVisit()` returns a launchable item for all inputs incl. new-user and "nothing due" (free-day fallback).

**3. Component tests (Vitest + RTL):** `GradTab` renders Today card + `PLACES.length` rows, recommended row has the gold edge, toggle swaps + persists `nh_grad_view`. `PlaceScreen` renders greeting + Nastavi card + statuses; a CEFR-locked exercise shows the lock pill **but stays in the DOM**. Heavy place renders subgroup headers; flat place does not.

**4. E2E — audit first, then write (Phase-5 lesson):** *Before building*, grep `e2e/` for everything touching the Practice surface (intent panels, "Quick Games", Arcade button, exercise launches via Practice) and list specs to migrate. New `e2e/grad.spec.js`: open Grad → Today card → tap place → interior (host greeting) → launch exercise → no console error → back; Karta toggle → marker → same interior. Migrate audited specs via a shared `enterPlace(page, name)` fixture (mirroring Phase 5's `startVocabLesson`). Rebuild dist before running. Run the **full** desktop suite locally before PR (exercise-launch specs may reach exercises previously on the Practice surface).

**5. Decomposition.** This phase is large; the implementation plan will split it into independently-verifiable, committable tasks:
1. `places.ts` registry + `gradModel.ts` + the **no-orphan test** (gate first).
2. `exerciseCatalog.ts` `place`/`subgroup` tagging + `GRAD_EXTRAS`.
3. `GradTab` — Today card + places list + toggle (+ component tests).
4. `GradMap` — SVG town + markers.
5. `PlaceScreen` — interior + subgroups (+ component tests).
6. Wire `GradTab` into the tab in place of `PracticeTab`; retire Practice panels.
7. E2E migration + full local desktop run → PR → review → merge.

---

## Non-goals / open items
- No change to exercise content, scoring, SRS, or CEFR thresholds.
- No new adaptive logic — `recommendedVisit` only re-orders existing signals.
- Mobile e2e migration is a non-blocking follow-up (CI gates desktop only).
- The map illustration may later be replaced by a richer/commissioned asset; it is intentionally a single swappable layer.
- Exact catalog count (66 vs 71) reconciled at implementation by reading `buildExercises()`; the no-orphan test is authoritative.
