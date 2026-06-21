# Relational Progress (Host-Voiced) — Design Spec

> Express progress relationally — a family member comments on where you stand — instead of bare metrics, completing the "welcomed into a family" feel on the one surface still purely numeric. Approved direction (2026-06-20): **(B) host-voiced aggregate**, **metric-themed host**.

**Goal:** Add a single, compact **host-voiced progress line** (the thematically-right family member speaking) and reframe the existing "reviews due" copy into that voice — **without** per-item data attribution and **without** re-cluttering the just-split Home.

**Architecture:** A pure `progressVoice(stats, fallbackHost)` helper maps the user's most salient aggregate signal → `{ host, icon, hr, en }`. `SessionCard` renders one small line beneath the existing stat pills using it, and its complete-state "reviews due" copy/CTA adopt Kovač's voice. The 3 stat pills stay as the clean data layer. No new card, no new data layer (uses the `streak` / `xpThisWeek` / `wordsdue` props SessionCard already receives).

**Tech stack:** React 18 + TS; plain CSS + tokens; `CharacterPortrait` (locked cast); Vitest.

## Global Constraints
- No per-item attribution (that's a possible future "A"); aggregate only.
- No new Home card — one slim line inside `SessionCard` (respect the #20 split that reduced density). Stat pills unchanged.
- Locked cast; metric→host mapping is fixed copy + a helper; no event/data-model changes.
- WCAG AA on any new text. Branch `feat/uxui-relational-progress`; ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## Section 1 — `progressVoice` helper
`src/components/home/progressVoice.ts` (new, pure, unit-tested):
```ts
export interface ProgressVoice { host: CharacterName; icon: string; hr: string; en: string }
export function progressVoice(
  s: { streak: number; wordsdue: number; xpThisWeek: number },
  fallbackHost: CharacterName,
): ProgressVoice
```
Priority ladder (first match wins):
1. **`wordsdue > 0` → Kovač** (reviews are the tutor's domain): `icon:'📚'`, hr `"{n} fraza čeka ponavljanje."`, en `"{n} phrase(s) waiting for review."`
2. **`streak >= 3` → Baka** (warmth/pride): `icon:'🔥'`, hr `"{streak}. jutro zaredom — ponosna sam na tebe!"`, en `"{streak} mornings in a row — I'm proud of you!"`
3. **`xpThisWeek >= 150` → Marko** (encouragement): `icon:'⭐'`, hr `"Snažan tjedan — samo tako nastavi!"`, en `"Strong week — keep it up!"`
4. **else → `fallbackHost`** (host-of-day) generic warm nudge: `icon:'👋'`, hr `"Drago mi je što si tu. Idemo."`, en `"Good to have you here. Let's go."`

(Pluralization handled in the helper; copy is final, reviewable here.)

## Section 2 — Placement in SessionCard
- Render a single line directly **below the 3 stat pills**: a small `CharacterPortrait name={voice.host} size={28}` + the icon + the `hr` line (Playfair, with the `en` as a muted sub or title). `data-testid="progress-voice"`. Compact (~one row), clearly secondary.
- `voice = progressVoice({ streak, wordsdue, xpThisWeek }, host)` — `host` is the existing host-of-day prop (used only as the generic fallback).
- **Complete-state reviews copy** (the "X words still due for review" line + the "📚 Review X →" CTA): reword into Kovač's voice (e.g. "prof. Kovač: još {n} fraza za ponavljanje" / CTA "📚 Ponovi {n} →"), keeping the same `onKeepPracticing` behaviour and `wordsdue` gating.
- Nothing else changes; the host-of-day greeting header (passive, from #20) and pills stay.

## Section 3 — Testing
- `progressVoice.test.ts`: each ladder branch returns the right host + icon (Kovač/Baka/Marko/fallback); fallback used only when nothing salient; pluralization (1 vs 2); ordering (wordsdue beats streak).
- `SessionCard` test: with `wordsdue>0` the `progress-voice` line shows `portrait-kovac`; with `wordsdue=0, streak=5` shows `portrait-baka`; line is present and carries the count.
- e2e: `home.spec` assert a `progress-voice` element is visible on Home (the seed has wordsdue/streak so it renders).

## Non-goals / open items
- No per-host item attribution (future "A"); no SRS schema change.
- Copy is in-scope/reviewable here; tweak during spec review if desired.
- Grad place stats stay numeric for now (could adopt the same helper later — out of scope).
