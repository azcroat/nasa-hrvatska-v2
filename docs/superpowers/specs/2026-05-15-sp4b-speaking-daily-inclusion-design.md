# SP4b — Speaking & Production Daily Inclusion (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (5/5 sections approved by jschr in chat)
**Predecessor:** SP4a (Microphone Reliability, complete)
**Successor:** SP5 (AI Personalization)

## Why this exists

After SP4a shipped the shared `useRecorder` hook and `MicPermissionDeniedExplainer`, the mic infrastructure is solid — but **production exercises (speaking, writing, dictation, shadowing, production drill) still only appear in the daily session by random chance.** A user can go days without seeing one. That's pedagogically wrong: research is clear that active output (speaking, writing) is the highest-leverage activity for fluency, and gold-standard learning apps (Duolingo, Babbel) guarantee at least one production task per session.

User's stated SP4 goal (2026-05-14):
> "Speaking & Production daily inclusion — make speaking/production exercises appear in the daily session reliably and pull weight toward fluency."

User-approved high-level decisions (during SP4a brainstorm):
- Guaranteed 1 production slot per daily session
- Recent-exclusion rotation across the production pool
- Writing-substitute fallback for mic-blocked users

SP4b implements those decisions.

## Success criteria

A user opening the daily session sees **exactly one** production exercise on the home screen card, every day, regardless of:
- CEFR level (graceful fall-back to 4 activities when pool is empty for A1)
- Mic permission state (mic-denied users get keyboard-only Writing/Dictation)
- Recent history (rotation avoids back-to-back-to-back same screen)
- localStorage state (corruption / private-browsing modes degrade gracefully)

## Architecture

Today `buildSessionActivities(userCefr)` in `src/hooks/useDailySession.ts` assembles the daily list via four priorities:

1. **P1 — SRS reviews** (`getDueReviews()`)
2. **P2 — Adaptive top-due category** (`getDueCategoryQueue(6)[0]` + `CATEGORY_SCREEN_MAP`)
3. **P3 — CEFR random fill** to `fillTarget=4`
4. **P4 — Croatia immersion** (always 1 slot)

Production exercises sit in P3's CEFR pool and only appear when randomly selected.

**SP4b inserts P2.5 — Production** between P2 and P3:

```
P1 SRS  →  P2 Adaptive  →  P2.5 PRODUCTION (NEW)  →  P3 CEFR fill  →  P4 Croatia
```

A new pure helper `selectProductionExercise()` returns one `SessionActivity` from a 5-member production pool, applying CEFR gating, recent-exclusion, and mic-availability substitution. The selected activity is appended at position 3. The existing P3 `usedScreens` dedup logic transparently prevents the random fill from re-picking the same screen.

**Why this works**: zero net change to P1, P2, P3, P4. The new helper is pure, unit-testable, and matches the `getDueReviews()` / `getDueCategoryQueue()` module convention.

**Why this is small**: ~40 lines added to `useDailySession.ts` + a 5-line addition to `useRecorder.ts` (writes the mic state flag SP4b reads). SP4a's `useRecorder` and `MicPermissionDeniedExplainer` are otherwise unchanged.

## Components

### 1. `PRODUCTION_POOL` constant (new, in `useDailySession.ts`)

```ts
const PRODUCTION_POOL: Array<{
  id: string;
  label: string;
  screen: string;
  cefr: string;
  category: SkillCategory;
  micRequired: boolean;
}> = [
  { id: 'speaking_sprint',  label: 'Speaking Sprint', screen: 'speaking_sprint', cefr: 'A2', category: 'speaking', micRequired: true  },
  { id: 'shadowing',        label: 'Shadowing',       screen: 'shadowing',       cefr: 'A2', category: 'speaking', micRequired: true  },
  { id: 'production_drill', label: 'Production',      screen: 'productiondrill', cefr: 'B1', category: 'speaking', micRequired: true  },
  { id: 'writing',          label: 'Free Writing',    screen: 'writing',         cefr: 'B1', category: 'speaking', micRequired: false },
  { id: 'dictation',        label: 'Dictation',       screen: 'dictation',       cefr: 'B1', category: 'speaking', micRequired: false },
];
```

### 2. `selectProductionExercise()` pure helper (new, exported from `useDailySession.ts`)

```ts
export function selectProductionExercise(opts: {
  cefr: string;
  micState: 'available' | 'denied' | 'unsupported' | 'unknown';
  recentScreens: string[];
}): SessionActivity | null
```

Flow:
1. Filter `PRODUCTION_POOL` by `isUnlocked(item.cefr, opts.cefr)`.
2. If `micState === 'denied' || micState === 'unsupported'`, further filter to `!item.micRequired`.
3. Exclude items whose `screen` is in `opts.recentScreens`. If filter leaves empty, fall back to the unfiltered (post-mic) pool — better to repeat than skip.
4. Random uniform pick using `rnd()` from `src/lib/random.js`.
5. Return `{ id, label, screen, category }` (omits `cefr` and `micRequired`).
6. Returns `null` only when the post-mic-filter pool is empty (e.g., A1 user with all 5 exercises locked).

### 3. `getRecentProduction()` + `recordProductionExercise()` + `readMicState()` helpers (new, exported)

```ts
const PRODUCTION_RECENT_KEY = 'nh_recent_production';
const PRODUCTION_RECENT_WINDOW_DAYS = 3;
const MIC_STATE_KEY = 'nh_mic_state';
type MicState = 'available' | 'denied' | 'unsupported' | 'unknown';

export function getRecentProduction(): string[];
export function recordProductionExercise(screen: string): void;
export function readMicState(): MicState;
```

`getRecentProduction()` reads localStorage, prunes entries older than 3 days on every read, returns the screen-id list.

`recordProductionExercise(screen)` appends `{screen, date: today}` to the localStorage array. Called from the existing `markDone(curEx)` flow when the exercise's screen matches any `PRODUCTION_POOL.screen`. No new wiring in the screens themselves.

### 4. `buildSessionActivities()` modification

Insert a single block between P2 and P3:

```ts
// Priority 2.5: Production — guarantee one speaking/writing slot
const micState = readMicState();
const recentProd = getRecentProduction();
const prod = selectProductionExercise({ cefr: userCefr, micState, recentScreens: recentProd });
if (prod && !usedScreens.has(prod.screen)) {
  activities.push(prod);
  usedScreens.add(prod.screen);
}
```

### 5. `useRecorder.ts` mic-state persistence (new, 5 LOC)

```ts
useEffect(() => {
  if (state === 'denied' || state === 'unsupported' || state === 'available') {
    try { localStorage.setItem('nh_mic_state', state); } catch (_) { /* ignore */ }
  }
}, [state]);
```

A side effect inside the existing hook. When `useRecorder.state` transitions to `denied`, `unsupported`, or transitions out of `requesting` into a working state (`countdown`/`recording`/`done` → write `'available'`), the flag updates. Idempotent. No new hook, no Firestore round-trip.

## Data flow

### Read side — building today's session

```
HomeTab mounts
  ↓
useDailySession() fires
  ↓
buildSessionActivities(userCefr)
  ├─ P1: getDueReviews() → push SRS if any
  ├─ P2: getDueCategoryQueue(6)[0] → push adaptive top-due if mapped
  ├─ P2.5 (NEW): selectProductionExercise({cefr, micState, recentScreens})
  │      ├─ Read localStorage['nh_mic_state'] ('available' | 'denied' | 'unsupported' | 'unknown')
  │      ├─ Read localStorage[PRODUCTION_RECENT_KEY] → prune entries >3 days old
  │      ├─ Filter PRODUCTION_POOL by CEFR + micRequired + recentScreens
  │      ├─ Random uniform pick via rnd()
  │      └─ Return SessionActivity or null
  │      ↓
  │   if not null and not duplicate → push to activities (target index 3)
  ├─ P3: CEFR random fill to fillTarget=4 (usedScreens dedup prevents production from being re-picked)
  └─ P4: Croatia rotation slot
       ↓
SessionCard renders the 5 activities in order
```

### Write side — recording completion

```
User taps the production card on home screen
  ↓
launchPathItem(productionActivity)  [unchanged from SP4a]
  ↓
ShadowingScreen / WritingScreen / etc. mounts
  ↓
[user completes the exercise — Exercise Contract flow]
  ↓
markDone(curEx)  [existing flow in HomeTab]
  ├─ updates daily-quest tracker (existing)
  └─ NEW: if curEx.screen is in PRODUCTION_POOL.map(p => p.screen):
           recordProductionExercise(curEx.screen)
              ↓
           localStorage[PRODUCTION_RECENT_KEY] now contains:
           [..., {screen: 'shadowing', date: '2026-05-15'}]
```

### Write side — mic state transitions (in `useRecorder.ts`)

```
useRecorder.state changes
  ↓
useEffect checks state value
  ↓
if state ∈ {'denied','unsupported','available'} → localStorage.setItem('nh_mic_state', state)
```

### Cross-device behavior — none by design

Both `nh_mic_state` and `PRODUCTION_RECENT_KEY` are device-local. A user with mic granted on phone but denied on a borrowed laptop sees different fallback behavior on each — correct. Recent-exclusion is per-device too — acceptable tradeoff for marginal user-facing benefit.

## Error handling

The bar: every read/write degrades gracefully. Failures NEVER throw out of `buildSessionActivities()` and NEVER block the daily session from rendering.

| Failure | Detection | Behavior |
|---|---|---|
| `localStorage` unavailable (iOS private browsing throws on `getItem`) | `try/catch` in `getRecentProduction()` and `readMicState()` | Return `[]` and `'unknown'`. Production picks from full pool. |
| Corrupt `nh_recent_production` JSON | `try/catch` around `JSON.parse` + array shape check | Fall back to `[]`. No exception bubbles up. |
| Corrupt `nh_mic_state` value | Allowlist check against `['available','denied','unsupported']` | Anything else → `'unknown'` → fail-open (assume available). Self-heals via explainer next time mic is needed. |
| Production pool filtered to empty (A1 with all 5 locked) | `pool.length === 0` after CEFR filter | `selectProductionExercise()` returns `null`. `buildSessionActivities()` skips P2.5. Daily session has 4 activities. |
| Recent-exclusion filter empties pool (user did all 5 in last 3 days) | `pool.length === 0` after recent filter | Fall back to pre-recent-filter pool. Better to repeat than skip — pedagogically correct. |
| `rnd()` returns out-of-bounds value (defensive) | `Math.min(idx, pool.length - 1)` clamp | Always valid index. |
| `recordProductionExercise(screen)` non-string/empty | Type guard at top | No-op. |
| Storage quota exceeded on write | `try/catch` around `setItem` | `dbgWarn` log, continue. Tomorrow re-pick same screen — acceptable. |
| `markDone(curEx)` called before `curEx` populated | Guard `if (!curEx || !curEx.screen) return` | No write. |

**Logging:**
- Every safe-default fallback emits one `dbgWarn` with short reason.
- Successful selections emit no log.

**This design refuses to:**
- Silently catch errors with no log.
- Bubble exceptions out of `buildSessionActivities()`.
- Persist mic state to Firestore as a cross-device sync.
- Implement a "force re-show" debug toggle (YAGNI).

## Testing

Three tiers, same rigor as SP4a.

### Tier 1 — Unit tests

**`src/tests/selectProductionExercise.test.ts`** (new) — pure helper in isolation:

| Test | Setup | Asserts |
|---|---|---|
| Happy path A2 user, mic available, no recent | `cefr: 'A2'`, `micState: 'available'`, `recentScreens: []` | Returns activity whose screen is in `PRODUCTION_POOL`, CEFR-unlocked |
| A1 user → empty pool | `cefr: 'A1'` (all 5 require A2+) | Returns `null` |
| Mic denied → keyboard-only | `micState: 'denied'` | Returns Writing or Dictation; never SpeakingSprint/Shadowing/ProductionDrill |
| Mic unsupported → same | `micState: 'unsupported'` | Same as above |
| Mic unknown → full pool | `micState: 'unknown'` | Any of the 5 (fail-open) |
| Recent-exclusion respected | `recentScreens: ['shadowing','writing','dictation']` | Returns `speaking_sprint` or `productiondrill` only |
| All-recent → fall back to full pool | `recentScreens: ['speaking_sprint','shadowing','writing','dictation','productiondrill']` | Returns any (better repeat than skip) |
| Mic denied + recent eliminates keyboard | `micState: 'denied'`, `recentScreens: ['writing','dictation']` | Returns Writing or Dictation anyway (fallback) |
| Determinism with mocked rnd() | `vi.mock('../lib/random.js', () => ({ rnd: () => 0.0 }))` | First eligible item returned every call |
| B1 user gets full pool | `cefr: 'B1'`, mic available | All 5 unlocked, picks any |

Target: 10+ tests, ≥ 90% branch coverage.

**`src/tests/recentProduction.test.ts`** (new) — `getRecentProduction()` + `recordProductionExercise()`:

| Test | Asserts |
|---|---|
| Empty localStorage → `[]` | — |
| `recordProductionExercise('shadowing')` writes one entry | localStorage value matches `[{screen:'shadowing',date:today}]` |
| Old entries (>3 days) pruned on read | Entry with date `today - 4 days` filtered out |
| Corrupt JSON → `[]`, no throw | `localStorage.setItem(KEY, 'not-json')` then read |
| Wrong shape (non-array) → `[]` | `localStorage.setItem(KEY, '{"foo":"bar"}')` |
| Storage quota error on write → no throw, warn logged | Mock `setItem` to throw `QuotaExceededError` |
| Same-day re-record doesn't duplicate | Twice with same screen → one entry |
| Empty/falsy input no-op | `''`, `null` |

### Tier 2 — Integration test

**`src/tests/useDailySession.production.test.ts`** (new):

| Test | Asserts |
|---|---|
| `buildSessionActivities('A2')` includes a production-pool screen | Result has exactly one item whose screen is in `PRODUCTION_POOL` |
| `buildSessionActivities('A1')` gracefully returns 4 activities | Array length 4, no production-pool item |
| Mic-denied → keyboard-only | Set `localStorage['nh_mic_state']='denied'`; chosen production is Writing or Dictation |
| Production slot at index 2 (0-indexed) with all priorities | When SRS + adaptive both fire, production lands at index 2 of 5 |
| Recent-exclusion: yesterday's not repeated | Pre-seed `recentProduction`; assert that screen isn't chosen across 100 builds with shuffled rnd |

### Tier 3 — Playwright e2e

**`e2e/sp4b-production-slot.spec.js`** (new):

| Test | How |
|---|---|
| Daily session card lists a production exercise | `seedAuth(page)` with A2; navigate `/`; verify card text matches Writing\|Dictation\|Speaking\|Shadowing\|Production |
| Mic-denied user sees keyboard-only production | `addInitScript` sets `localStorage['nh_mic_state']='denied'`; card shows Writing or Dictation only |
| Tapping production card opens the exercise | Click production card; screen header matches |

Runs across all 5 Playwright projects (Desktop Chrome/Firefox/WebKit/Pixel 5/iPhone 14/iPad Pro).

### Refused (same discipline as SP4a)

- No source-regex Pattern Y tests.
- No coverage threshold drops; global branches stay at 80; `selectProductionExercise.ts` lands at ≥ 90%.
- No skipped tests as debt.

## Out of scope (deferred)

- Refactoring `category: 'speaking'` tags on existing CEFR pool entries (cosmetic, no functional impact).
- Cross-device mic-state sync via Firestore (different devices = different mics; sync is anti-pattern).
- Pronunciation-quality gating (entering SP8 territory).
- "Force re-show this exercise" debug toggle.

## Acceptance gate

SP4b is complete when:

1. `selectProductionExercise()` exists, exported, with ≥ 90% branch coverage.
2. `buildSessionActivities()` calls it as P2.5, between P2 and P3.
3. Every daily session for an A2+ user contains exactly one production exercise (verified by integration test).
4. A1 users gracefully get 4 activities, no error (verified by integration test).
5. Mic-denied users get Writing or Dictation only (verified by integration test + e2e).
6. Recent-exclusion functions across a 3-day window (verified by unit + integration test).
7. `useRecorder.ts` writes `nh_mic_state` on terminal state transitions (5 LOC, verified by hook unit test extension).
8. `recordProductionExercise()` is called from `markDone(curEx)` when curEx.screen is in the pool (verified by integration test).
9. Playwright `sp4b-production-slot.spec.js` passes on all 5 projects.
10. Global vitest branches coverage threshold remains 80.
