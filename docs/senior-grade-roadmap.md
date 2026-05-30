# Naša Hrvatska — Raise-to-Senior-Grade Roadmap

_Last updated: 2026-05-28_

## Why this exists

An evidence-based audit (2026-05-28) found the codebase has **senior-level
engineering discipline** but **concentrated architectural/maintainability debt**.
This roadmap sequences the work to close that gap. It is not a rewrite — the
fixes are specific and behavior-preserving except where noted.

## Audit snapshot (objective signals)

| Dimension | Evidence | Grade |
|---|---|---|
| Dependency graph | 0 circular deps across 721 files | Senior+ |
| Type safety | `strict` + `strictNullChecks` + `noUncheckedIndexedAccess`; 2 `@ts-nocheck`, 8 `@ts-ignore` | Senior+ |
| Lint / security | `eslint --max-warnings=0` clean; 0 npm vulnerabilities; 0 TODO/FIXME | Senior |
| Tests | 3083 tests / 187 files; ~23% test-to-code; 80% coverage thresholds enforced; Playwright E2E | Senior |
| Sync/persistence craft | refs vs stale closures, retry+backoff, serial snapshot queue, monotonic merge | Senior craft / mid design |
| **Modularity** | **6 files >2000 lines, 33 >1000** | **Below bar** |
| **`any`/casting** | **329 `: any`/`as any`, 164 `eslint-disable`** (heavy in data + sync) | **Mid** |
| **Hot-path architecture** | all progress writes funnel to one `users/{id}` doc | **Below bar** |

**Verdict:** ~80% of the way to "what a senior lead would have built." Discipline
is there; architecture/maintainability in three named spots is not.

## Scales

- **Effort:** S (<½ day) · M (½–2 d) · L (3–5+ d)
- **Risk:** blast radius if it goes wrong.

---

## Phase 0 — Safety net + measurement (do first)

| # | Item | Effort | Risk | Status |
|---|---|---|---|---|
| 0a | Wire emulator tests into CI (new `emulator` job: `test:emulator` + `test:rules`) | S | Low | **DONE 2026-05-28** |
| 0b | Quantify write inventory to `users/{id}` (instrument `fbApplyDelta`/`fbSaveProgress`/`fbToggleFavorite`) — gates Phase 2 | S | Low | **DONE 2026-05-30** |

0b's data decides whether Phase 2 is urgent or deferrable. Measure before the expensive, risky change.

### 0b findings (2026-05-30) — measured via `src/tests/write-inventory-0b.test.ts`

Per-action writes to `users/{id}` (exact, counted from a mocked Firestore SDK against the real `firebase.ts`):

| Entry point | Writes to `users/{id}` | Notes |
|---|---|---|
| `fbApplyDelta` (dense burst, gaps < `COALESCE_MS`=3000ms) | **1** | burst coalesces into one `updateDoc` |
| `fbApplyDelta` (spaced, gaps > 3000ms) | **1 per award** | timer resets per call → coalescing only helps *dense* bursts |
| `fbSaveProgress` (no pending delta) | **1** | batched `set(users)`; `profiles/{id}` is a separate doc |
| `fbSaveProgress` (pending delta) | **2** | flush `updateDoc` + batched `set` |
| `fbToggleFavorite` | **1 each, uncoalesced** | the only un-throttled hot path |

**Pessimistic power-user-day projection** (2 h active play, 1 XP item / 5 s, 40 favorites, 5-min periodic save): **≈1,504 writes/day to `users/{id}` = 7.5 % of the Spark 20,000/day cap.** Peak sustained rate: **0.33 writes/s** (dense, coalesced) / **0.20 writes/s** (spaced) — both under the ~1 write/s/doc soft limit.

**Decision: Phase 2 (sharding) is NOT urgent → DEFER.** The 44e45e1 fix (single-write `fbSaveProgress` + 3 s coalescing + removed 3-min pull) keeps the hot doc well under both Firestore limits for realistic heavy usage. Re-evaluate only if (a) a paid plan / much larger DAU changes the cap math, or (b) telemetry shows real `resource-exhausted` recurrence.

**One cheap follow-up (not Phase 2):** `fbToggleFavorite` is the only uncoalesced writer — pathological rapid-favoriting (e.g., 50 toggles in 30 s ≈ 1.6/s) could briefly exceed the 1/s soft limit. If that ever shows up, give it the same `COALESCE_MS` debounce as `fbApplyDelta` (S effort, Low risk). Low total volume today, so it's a watch-item, not a task.

## Phase 1 — Decompose the tangled god-components

Targets are the **stateful** god-files. Composition recon:

| File | Lines | Shape | Action |
|---|---|---|---|
| `components/profile/SettingsTab.tsx` | 2021 | 1 component, **27 hook-calls** | 1a — extract setting sections + `useSettingsX` hooks |
| `components/practice/ListeningComprehensionScreen.tsx` | 2607 | **7 inline components**, 23 hooks | 1b — split the 7 into files (mechanical) |
| `components/home/HeroSection.tsx` | 2009 | 3 components, 14 hooks | 1c — extract subviews + `useHero*` hook |
| `components/practice/PracticeTab.tsx` | 2577 | activity router, 8 hooks | 1d — split per-activity behind the tab switch |

| # | Item | Effort | Risk |
|---|---|---|---|
| 1a | SettingsTab decompose (highest hook-density = worst) | M | Med |
| 1b | ListeningComprehensionScreen split | M | Low–Med |
| 1c | HeroSection decompose | M | Med |
| 1d | PracticeTab split | M–L | Med |

**Do NOT decompose** `AppRouter.tsx` (2149L — a lazy-route *manifest*, 2 hooks) or
`data/content.tsx` (2135L — a *data* file, 0 hooks). Large is appropriate there;
splitting is churn with no payoff.

Target: no stateful component >~600 lines. One file per PR. Tests + E2E are the net.

## Phase 2 — Firestore hot-document sharding (GATED on 0b)

| # | Item | Effort | Risk |
|---|---|---|---|
| 2 | Move high-frequency counters (XP via `fbApplyDelta`) and/or the progress blob off the single `users/{id}` doc — e.g. `users/{id}/state/*` subcollection or a counters doc; update merge logic, **security rules**, and a **backward-compat migration** | L | **HIGH** |

Only item that can corrupt/lose live data. Requires its own design doc, emulator
coverage (now CI-gated via 0a), and a **staged rollout** (dual-write → backfill →
cutover). The acute symptom was already fixed 2026-05-28 (commit 44e45e1), so this
is "prevent recurrence under heavy load," not an emergency. **0b (2026-05-30)
measured ~1,504 users/{id} writes on a pessimistic power-user day = 7.5 % of the
Spark cap, peak 0.33/s < 1/s soft limit → DEFERRED.** Do not start unless the cap
math changes (paid plan / much larger DAU) or telemetry shows real
`resource-exhausted` recurrence. See [[reference_firestore_merge_semantics]] and
the 0b findings under Phase 0.

## Phase 3 — Type discipline (continuous; weave into Phases 1–2)

| # | Item | Effort | Risk |
|---|---|---|---|
| 3 | Drive down the 329 `any`/`as` (concentrated in sync + data layers): model `Stats`, progress-snapshot, and Firestore payload types so `firebase.ts`/`useSyncManager.ts` stop casting `Record<string, unknown>` | M–L (incremental) | Low (types only; `tsc` catches breaks) |

---

## Recommended order

`0a ✅ → 0b ✅ → 1a ✅ → 1b → 1c → 1d → (2 DEFERRED per 0b) → 3 woven throughout`

- Phase 0: cheap, closes the CI guard gap, produces the data to make Phase 2 a decision not a guess.
- Phase 1: low-risk, high-velocity-ROI, behavior-preserving — build momentum on a cleaner base.
- Phase 2: the sharp knife — last, gated, staged.
- Phase 3: free-rides on Phases 1–2 (model types while already in the file).

**If you only do three things:** 0a (done), 1a (worst god-file), 0b→decide on 2.
~2–3 days captures most of the gap.

**Rough total:** Phase 0 ≈ 1d · Phase 1 ≈ 4–7d · Phase 2 ≈ 3–5d (if warranted) · Phase 3 ≈ ongoing.

## Follow-up wired but not yet blocking

The `emulator` CI job runs on every push/PR but is **not** yet in `build-deploy`'s
`needs:` — so a flaky first run won't block deploys. Once it has a stable green
history, add `emulator` to `build-deploy.needs` to make it gate deploys.
