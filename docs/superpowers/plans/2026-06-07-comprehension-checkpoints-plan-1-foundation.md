# Comprehension Checkpoints — Plan 1: Foundation (pure logic + data model)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure, fully unit-tested logic + data model that the Comprehension Checkpoints feature stands on — active-day tracking, the 5-active-day scheduler, the grace/demotion/focus result policy, exam composition, the `v:2` certification migration, the `speaking` skill, demotion, and cross-device sync of the new state — all behind `CHECKPOINTS_ENABLED = false` so there is **zero UX change** until Plans 2–3 land.

**Architecture:** Extends the existing `src/lib/cefrCertification.ts` (certified-vs-eligible level, `localStorage['nh_cefr_certifications']`, cross-device sync) with a `checkpoints` state block (schema bump `v:1 → v:2`) and a one-way demotion primitive. New pure modules sit beside it: `activeDayTracker`, `checkpointSchedule`, `checkpointPolicy`, `examBlueprint`, `examComposer`. All logic is side-effect-free (storage/clock injected or passed as args) so it tests without a DOM or network. The UI (Plan 3) and speaking backend (Plan 2) consume these.

**Tech Stack:** TypeScript, Vitest (`npx vitest run`), React app on Cloudflare Pages. Existing deps only — no new packages in this plan.

**Spec:** `docs/superpowers/specs/2026-06-07-comprehension-checkpoints-design.md` (§2, §4, §5.2–5.6 + Resolved decisions §11).

---

## File structure (this plan)

| File | Responsibility |
|---|---|
| `src/lib/cefrCertification.ts` (modify) | Add `speaking` to `SkillScores`; `SkillKey` union; `v:2` `CheckpointState` block + migration in `getCertificationState`; `demoteOneLevel`; **export** `writeCertificationState`; extend `snapshotCertifications`/`mergeRemoteCertifications`. |
| `src/lib/checkpointStore.ts` (create) | `recordCheckpointResult` — applies a `CheckpointOutcome` to certification state. Lives here (not in `cefrCertification`) to keep imports acyclic: `checkpointStore → {cefrCertification, checkpointPolicy}`. |
| `src/lib/activeDayTracker.ts` (create) | Count distinct active days (pure core + `localStorage` wrapper). |
| `src/lib/checkpointSchedule.ts` (create) | `isCheckpointDue()` — pure due/snooze/A1 logic. |
| `src/lib/checkpointPolicy.ts` (create) | `interpretCheckpoint()` — pure bands → pass / pass_focus / grace / demote. |
| `src/lib/examBlueprint.ts` (create) | `buildCheckpointBlueprint()` — pure description of an exam's sections. |
| `src/lib/examComposer.ts` (create) | `composeExam()` — blueprint + item banks → concrete items (seeded RNG). |
| `src/data/speakingTasks.ts` (create) | Per-level productive speaking prompts (A1→C1). |
| Tests in `src/lib/__tests__/` and `src/tests/` | One spec file per module. |

**Naming locked (used across tasks):**
- `SkillKey = 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking'`
- `CefrLevel` (existing) = `'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`, ordered by existing `CEFR_ORDER` / `cefrRank`.
- Focus band: `[0.80, 0.875)` = pass-with-focus; `>= 0.875` = clean; `< 0.80` = fail. Pass needs every present skill `>= 0.80` **and** overall `>= 0.80` (reuses existing `computePassed`).

---

## Task 1: Add `speaking` skill + `SkillKey` union (no behaviour change)

**Files:**
- Modify: `src/lib/cefrCertification.ts` (the `SkillScores` interface, ~line 74)
- Test: `src/lib/__tests__/cefrCertification.skillkey.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cefrCertification.skillkey.test.ts
import { describe, it, expect } from 'vitest';
import { computePassed } from '../cefrCertification.js';
import type { SkillScores, SkillKey } from '../cefrCertification.js';

describe('SkillScores.speaking', () => {
  it('computePassed ignores speaking when only vocab/grammar present (legacy equivalency unaffected)', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.85 };
    expect(computePassed(scores).passed).toBe(true);
  });

  it('computePassed treats a present low speaking score as a failing skill', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, speaking: 0.5 };
    expect(computePassed(scores).passed).toBe(false);
  });

  it('SkillKey union includes the five skills', () => {
    const keys: SkillKey[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];
    expect(keys).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cefrCertification.skillkey.test.ts`
Expected: FAIL — `speaking` not assignable to `SkillScores`; `SkillKey` not exported.

- [ ] **Step 3: Implement the change**

In `src/lib/cefrCertification.ts`, replace the `SkillScores` interface (around line 74) with:

```ts
export interface SkillScores {
  vocab: SkillScore;
  grammar: SkillScore;
  /** Optional — only present if the test had a reading section. */
  reading?: SkillScore;
  /** Optional — only present if the test had a listening section. */
  listening?: SkillScore;
  /** Optional in the type (legacy equivalency tests have none); REQUIRED by
   *  checkpoint composition (a speaking task is always included — see Plan 1
   *  examComposer). */
  speaking?: SkillScore;
}

/** Every skill a test can score. */
export type SkillKey = 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking';
```

Then extend `computePassed` (around line 248) to count `speaking` when present, immediately after the `listening` push:

```ts
  if (scores.reading !== undefined) skillValues.push(scores.reading);
  if (scores.listening !== undefined) skillValues.push(scores.listening);
  if (scores.speaking !== undefined) skillValues.push(scores.speaking); // NEW
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/cefrCertification.skillkey.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the existing certification suite for no regression**

Run: `npx vitest run src/lib/__tests__/cefrCertification.test.ts`
Expected: PASS (all existing tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/cefrCertification.ts src/lib/__tests__/cefrCertification.skillkey.test.ts
git commit -m "feat(cefr): add speaking skill + SkillKey union to certification scores"
```

---

## Task 2: Bump certification state to `v:2` with a `checkpoints` block + migration

**Files:**
- Modify: `src/lib/cefrCertification.ts` (`CertificationState`, `emptyState`, `getCertificationState`)
- Test: `src/lib/__tests__/cefrCertification.v2migration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cefrCertification.v2migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getCertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';

function emptyCheckpoints() {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
  };
}

describe('v1 -> v2 migration', () => {
  beforeEach(() => localStorage.clear());

  it('returns a v2 empty state with a checkpoints block when storage is empty', () => {
    const s = getCertificationState();
    expect(s.v).toBe(2);
    expect(s.checkpoints).toEqual(emptyCheckpoints());
  });

  it('migrates a stored v1 state, preserving passes/attempts and adding checkpoints', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        passes: { A2: { passedAt: 111, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 } },
        attempts: [{ level: 'A2', passed: true, takenAt: 111, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 }],
        lastFailedAt: {},
        v: 1,
      }),
    );
    const s = getCertificationState();
    expect(s.v).toBe(2);
    expect(s.passes.A2?.overall).toBe(90);
    expect(s.attempts).toHaveLength(1);
    expect(s.checkpoints).toEqual(emptyCheckpoints());
  });

  it('normalises a partial/corrupt checkpoints block to defaults', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ passes: {}, attempts: [], lastFailedAt: {}, checkpoints: { snoozedUntil: 999 }, v: 2 }),
    );
    const s = getCertificationState();
    expect(s.checkpoints.snoozedUntil).toBe(999);
    expect(s.checkpoints.consecutiveFails).toEqual({});
    expect(Array.isArray(s.checkpoints.demotions)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cefrCertification.v2migration.test.ts`
Expected: FAIL — `s.v` is `1`, `s.checkpoints` undefined.

- [ ] **Step 3: Implement the change**

In `src/lib/cefrCertification.ts`:

(a) Add the new interface above `CertificationState`:

```ts
export interface CheckpointState {
  /** Epoch ms of the last COMPLETED checkpoint that reset the cadence. */
  lastCheckpointAt: number | null;
  /** Active-day count snapshot at that checkpoint (see activeDayTracker). */
  activeDaysAtLastCheckpoint: number;
  /** Grace counter per level: 0 = none, 1 = one fail pending (next fail demotes). */
  consecutiveFails: Partial<Record<CefrLevel, number>>;
  /** Carry-forward focus skills, keyed by the level they apply to. */
  focusSkills: Partial<Record<CefrLevel, SkillKey[]>>;
  /** Demotion history. */
  demotions: Array<{ from: CefrLevel; to: CefrLevel; at: number; reason: 'checkpoint_fail' }>;
  /** "Remind me tonight" — checkpoint suppressed until this epoch ms. */
  snoozedUntil: number | null;
}
```

(b) Change `CertificationState` to add the block and bump the version:

```ts
export interface CertificationState {
  passes: Partial<Record<CefrLevel, CertificationPass>>;
  attempts: CertificationAttempt[];
  lastFailedAt: Partial<Record<CefrLevel, number>>;
  checkpoints: CheckpointState; // NEW
  v: 2;                          // bumped
}
```

(c) Add a factory and update `emptyState`:

```ts
function emptyCheckpointState(): CheckpointState {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
  };
}

function emptyState(): CertificationState {
  return { passes: {}, attempts: [], lastFailedAt: {}, checkpoints: emptyCheckpointState(), v: 2 };
}
```

(d) Rewrite the version guard + normalisation inside `getCertificationState`. Replace the block that currently reads `if (state.v !== 1) return emptyState();` and the field normalisation with:

```ts
    const state = parsed as Partial<CertificationState> & { v?: number };
    // Accept v1 (migrate up) and v2. Anything else → empty.
    if (state.v !== 1 && state.v !== 2) return emptyState();
    if (!state.passes || typeof state.passes !== 'object') state.passes = {};
    if (!Array.isArray(state.attempts)) state.attempts = [];
    if (!state.lastFailedAt || typeof state.lastFailedAt !== 'object') {
      state.lastFailedAt = {};
    }
    // Migrate / normalise the checkpoints block.
    const def = emptyCheckpointState();
    const cp = (state.checkpoints && typeof state.checkpoints === 'object'
      ? state.checkpoints
      : {}) as Partial<CheckpointState>;
    state.checkpoints = {
      lastCheckpointAt: typeof cp.lastCheckpointAt === 'number' ? cp.lastCheckpointAt : def.lastCheckpointAt,
      activeDaysAtLastCheckpoint:
        typeof cp.activeDaysAtLastCheckpoint === 'number' ? cp.activeDaysAtLastCheckpoint : def.activeDaysAtLastCheckpoint,
      consecutiveFails: cp.consecutiveFails && typeof cp.consecutiveFails === 'object' ? cp.consecutiveFails : {},
      focusSkills: cp.focusSkills && typeof cp.focusSkills === 'object' ? cp.focusSkills : {},
      demotions: Array.isArray(cp.demotions) ? cp.demotions : [],
      snoozedUntil: typeof cp.snoozedUntil === 'number' ? cp.snoozedUntil : def.snoozedUntil,
    };
    state.v = 2;
    return state as CertificationState;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/cefrCertification.v2migration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run existing certification + sync suites for no regression**

Run: `npx vitest run src/lib/__tests__/cefrCertification.test.ts src/tests/progressSnapshot.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cefrCertification.ts src/lib/__tests__/cefrCertification.v2migration.test.ts
git commit -m "feat(cefr): v2 certification state with checkpoints block + v1 migration"
```

---

## Task 3: `activeDayTracker` — count distinct active days

**Files:**
- Create: `src/lib/activeDayTracker.ts`
- Test: `src/lib/__tests__/activeDayTracker.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/activeDayTracker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { applyActiveDay, getActiveDayCount, recordActiveDayNow, localDayString } from '../activeDayTracker.js';

describe('activeDayTracker (pure core)', () => {
  it('increments count only on a new day', () => {
    let st = { lastDay: '', count: 0 };
    st = applyActiveDay(st, '2026-06-07');
    expect(st).toEqual({ lastDay: '2026-06-07', count: 1 });
    st = applyActiveDay(st, '2026-06-07'); // same day → no change
    expect(st).toEqual({ lastDay: '2026-06-07', count: 1 });
    st = applyActiveDay(st, '2026-06-08'); // new day → +1
    expect(st).toEqual({ lastDay: '2026-06-08', count: 2 });
  });

  it('localDayString formats a Date as YYYY-MM-DD (local)', () => {
    expect(localDayString(new Date(2026, 5, 7))).toBe('2026-06-07');
  });
});

describe('activeDayTracker (localStorage wrapper)', () => {
  beforeEach(() => localStorage.clear());
  it('persists and reads the count across calls', () => {
    recordActiveDayNow('2026-06-07');
    recordActiveDayNow('2026-06-08');
    recordActiveDayNow('2026-06-08');
    expect(getActiveDayCount()).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/activeDayTracker.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
// src/lib/activeDayTracker.ts
/**
 * Counts the number of DISTINCT local calendar days the app was used.
 * Drives the "every 5 active days" checkpoint cadence so a user returning
 * from a break is never ambushed (calendar timers fire mid-vacation).
 *
 * Pure core (`applyActiveDay`) + thin localStorage wrapper so it tests
 * without a DOM clock.
 */
export interface ActiveDayState {
  /** Last local day we counted, 'YYYY-MM-DD'. */
  lastDay: string;
  /** Cumulative count of distinct active days. */
  count: number;
}

const KEY = 'nh_active_days';

/** YYYY-MM-DD in LOCAL time (not UTC) — the user's day boundary. */
export function localDayString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Pure: returns the next state given today's local day string. */
export function applyActiveDay(state: ActiveDayState, today: string): ActiveDayState {
  if (state.lastDay === today) return state;
  return { lastDay: today, count: state.count + 1 };
}

function read(): ActiveDayState {
  if (typeof localStorage === 'undefined') return { lastDay: '', count: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lastDay: '', count: 0 };
    const p = JSON.parse(raw) as Partial<ActiveDayState>;
    return {
      lastDay: typeof p.lastDay === 'string' ? p.lastDay : '',
      count: typeof p.count === 'number' ? p.count : 0,
    };
  } catch {
    return { lastDay: '', count: 0 };
  }
}

function write(state: ActiveDayState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota/disabled — retry next call */
  }
}

/** Records today (defaults to now) as an active day; persists. */
export function recordActiveDayNow(today: string = localDayString()): void {
  write(applyActiveDay(read(), today));
}

/** Current cumulative distinct-active-day count. */
export function getActiveDayCount(): number {
  return read().count;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/activeDayTracker.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/activeDayTracker.ts src/lib/__tests__/activeDayTracker.test.ts
git commit -m "feat(checkpoints): active-day tracker for humane 5-active-day cadence"
```

---

## Task 4: `checkpointSchedule` — is a checkpoint due?

**Files:**
- Create: `src/lib/checkpointSchedule.ts`
- Test: `src/lib/__tests__/checkpointSchedule.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/checkpointSchedule.test.ts
import { describe, it, expect } from 'vitest';
import { isCheckpointDue, ACTIVE_DAYS_PER_CHECKPOINT } from '../checkpointSchedule.js';
import type { CheckpointState } from '../cefrCertification.js';

function cp(partial: Partial<CheckpointState> = {}): CheckpointState {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
    ...partial,
  };
}

describe('isCheckpointDue', () => {
  const base = { enabled: true, certified: 'B1' as const, activeDayCount: 5, now: 1000 };

  it('not due when the feature flag is off', () => {
    expect(isCheckpointDue({ ...base, enabled: false, checkpoints: cp() }).due).toBe(false);
  });

  it('due at A1 (non-demoting floor still runs)', () => {
    expect(isCheckpointDue({ ...base, certified: 'A1', checkpoints: cp() }).due).toBe(true);
  });

  it('due once 5 active days have elapsed since the last checkpoint', () => {
    expect(isCheckpointDue({ ...base, activeDayCount: 5, checkpoints: cp({ activeDaysAtLastCheckpoint: 0 }) }).due).toBe(true);
    expect(isCheckpointDue({ ...base, activeDayCount: 4, checkpoints: cp({ activeDaysAtLastCheckpoint: 0 }) }).due).toBe(false);
  });

  it('not due while snoozed; due again after snooze expires', () => {
    expect(isCheckpointDue({ ...base, now: 500, checkpoints: cp({ snoozedUntil: 1000 }) }).due).toBe(false);
    expect(isCheckpointDue({ ...base, now: 1001, checkpoints: cp({ snoozedUntil: 1000 }) }).due).toBe(true);
  });

  it('uses the 5-active-day constant', () => {
    expect(ACTIVE_DAYS_PER_CHECKPOINT).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checkpointSchedule.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
// src/lib/checkpointSchedule.ts
import type { CefrLevel } from './cefr.js';
import type { CheckpointState } from './cefrCertification.js';

export const ACTIVE_DAYS_PER_CHECKPOINT = 5;

export interface DueInput {
  enabled: boolean;          // CHECKPOINTS_ENABLED flag
  certified: CefrLevel;      // current certified level
  activeDayCount: number;    // from activeDayTracker.getActiveDayCount()
  checkpoints: CheckpointState;
  now: number;               // epoch ms (injected for tests)
}

export interface DueResult {
  due: boolean;
  reason: 'disabled' | 'snoozed' | 'not_enough_active_days' | 'due';
}

/**
 * A checkpoint is due when the feature is enabled, the user is not snoozed,
 * and at least ACTIVE_DAYS_PER_CHECKPOINT active days have passed since the
 * last completed checkpoint. A1 is included (non-demoting floor). The App
 * layer additionally gates on `syncReady` and "not mid-lesson" before
 * calling this — those are runtime concerns, not scheduling logic.
 */
export function isCheckpointDue(input: DueInput): DueResult {
  if (!input.enabled) return { due: false, reason: 'disabled' };
  const { snoozedUntil } = input.checkpoints;
  if (snoozedUntil != null && input.now < snoozedUntil) {
    return { due: false, reason: 'snoozed' };
  }
  const elapsed = input.activeDayCount - input.checkpoints.activeDaysAtLastCheckpoint;
  if (elapsed < ACTIVE_DAYS_PER_CHECKPOINT) {
    return { due: false, reason: 'not_enough_active_days' };
  }
  return { due: true, reason: 'due' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checkpointSchedule.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkpointSchedule.ts src/lib/__tests__/checkpointSchedule.test.ts
git commit -m "feat(checkpoints): 5-active-day scheduler with snooze + A1 floor"
```

---

## Task 5: `demoteOneLevel` primitive

**Files:**
- Modify: `src/lib/cefrCertification.ts` (add export)
- Test: `src/lib/__tests__/cefrCertification.demote.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cefrCertification.demote.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { demoteOneLevel, getCertifiedLevel, getCertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function seed(passes: Record<string, number>) {
  const p: Record<string, unknown> = {};
  for (const [lvl, overall] of Object.entries(passes)) {
    p[lvl] = { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall };
  }
  localStorage.setItem(KEY, JSON.stringify({ passes: p, attempts: [], lastFailedAt: {}, v: 1 }));
}

describe('demoteOneLevel', () => {
  beforeEach(() => localStorage.clear());

  it('drops the certified level by one rank and records the demotion', () => {
    seed({ A2: 90, B1: 85 }); // certified = B1
    expect(getCertifiedLevel()).toBe('B1');
    const res = demoteOneLevel('checkpoint_fail');
    expect(res).toEqual({ from: 'B1', to: 'A2' });
    expect(getCertifiedLevel()).toBe('A2');
    const s = getCertificationState();
    expect(s.checkpoints.demotions.at(-1)).toMatchObject({ from: 'B1', to: 'A2', reason: 'checkpoint_fail' });
    expect(s.checkpoints.consecutiveFails.B1).toBe(0);
  });

  it('returns null and is a no-op at the A1 floor', () => {
    seed({}); // certified = A1
    expect(demoteOneLevel('checkpoint_fail')).toBeNull();
    expect(getCertifiedLevel()).toBe('A1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cefrCertification.demote.test.ts`
Expected: FAIL — `demoteOneLevel` not exported.

- [ ] **Step 3: Implement the function**

In `src/lib/cefrCertification.ts`, add after `getCertifiedLevel`:

```ts
/** The level one rank below `level`, or null if `level` is the floor (A1). */
function levelBelow(level: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(level);
  if (idx <= 0) return null;
  return CEFR_ORDER[idx - 1]!;
}

/**
 * Lowers the certified level by exactly one rank by removing the top pass,
 * so `getCertifiedLevel()` returns the level below. Records the demotion and
 * clears the grace counter for the demoted level. No-op (returns null) at A1
 * — A1 is the floor. Does NOT touch XP, streak, or eligible level.
 */
export function demoteOneLevel(
  reason: 'checkpoint_fail',
): { from: CefrLevel; to: CefrLevel } | null {
  const current = getCertifiedLevel();
  const to = levelBelow(current);
  if (to === null) return null; // A1 floor
  const state = getCertificationState();
  delete state.passes[current];
  state.checkpoints.demotions.push({ from: current, to, at: Date.now(), reason });
  state.checkpoints.consecutiveFails[current] = 0;
  writeCertificationState(state);
  return { from: current, to };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/cefrCertification.demote.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cefrCertification.ts src/lib/__tests__/cefrCertification.demote.test.ts
git commit -m "feat(cefr): one-way demoteOneLevel primitive (A1 floor, XP untouched)"
```

---

## Task 6: `checkpointPolicy.interpretCheckpoint` — the result state machine (pure)

**Files:**
- Create: `src/lib/checkpointPolicy.ts`
- Test: `src/lib/__tests__/checkpointPolicy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/checkpointPolicy.test.ts
import { describe, it, expect } from 'vitest';
import { interpretCheckpoint } from '../checkpointPolicy.js';
import type { SkillScores, CheckpointState } from '../cefrCertification.js';

function cp(consecutive: Record<string, number> = {}): CheckpointState {
  return {
    lastCheckpointAt: null, activeDaysAtLastCheckpoint: 0,
    consecutiveFails: consecutive, focusSkills: {}, demotions: [], snoozedUntil: null,
  };
}

describe('interpretCheckpoint', () => {
  it('clean pass when every skill >= 0.88', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, reading: 0.9, speaking: 0.92 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp() });
    expect(o.kind).toBe('pass');
    expect(o.focusSkills).toEqual([]);
  });

  it('pass-with-focus when a skill is in the borderline band [0.80,0.875)', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, speaking: 0.82 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp() });
    expect(o.kind).toBe('pass_focus');
    expect(o.focusSkills).toContain('speaking');
  });

  it('grace on first fail (no prior fail), listing the failed skills', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, speaking: 0.5 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp({ B1: 0 }) });
    expect(o.kind).toBe('grace');
    expect(o.failedSkills).toEqual(['speaking']);
    expect(o.demotion).toBeNull();
  });

  it('demote on second consecutive fail (A2+), previewing the drop', () => {
    const scores: SkillScores = { vocab: 0.5, grammar: 0.9, speaking: 0.9 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp({ B1: 1 }) });
    expect(o.kind).toBe('demote');
    expect(o.demotion).toEqual({ from: 'B1', to: 'A2' });
    expect(o.failedSkills).toEqual(['vocab']);
  });

  it('A1 never demotes — repeated fails stay grace', () => {
    const scores: SkillScores = { vocab: 0.4, grammar: 0.9, speaking: 0.9 };
    const o = interpretCheckpoint({ level: 'A1', scores, checkpoints: cp({ A1: 5 }) });
    expect(o.kind).toBe('grace');
    expect(o.demotion).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checkpointPolicy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
// src/lib/checkpointPolicy.ts
import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER } from './cefr.js';
import { computePassed } from './cefrCertification.js';
import type { SkillScores, SkillKey, CheckpointState } from './cefrCertification.js';

const PASS = 0.8;
const CLEAN = 0.875; // >= CLEAN = clean; [PASS, CLEAN) = focus band

export type CheckpointKind = 'pass' | 'pass_focus' | 'grace' | 'demote';

export interface CheckpointOutcome {
  kind: CheckpointKind;
  overall: number;            // 0..100 (matches computePassed.overall)
  /** Present skills scoring < 0.80. */
  failedSkills: SkillKey[];
  /** Skills to focus on next: borderline-band skills (on pass) or failed skills (on grace/demote). */
  focusSkills: SkillKey[];
  /** Non-null only when kind === 'demote'. */
  demotion: { from: CefrLevel; to: CefrLevel } | null;
}

const ORDER: SkillKey[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];

function presentSkills(scores: SkillScores): Array<[SkillKey, number]> {
  return ORDER
    .filter((k) => scores[k] !== undefined)
    .map((k) => [k, scores[k] as number]);
}

function levelBelow(level: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(level);
  return idx <= 0 ? null : CEFR_ORDER[idx - 1]!;
}

export interface InterpretInput {
  level: CefrLevel;          // the certified level being checked
  scores: SkillScores;       // per-skill scores (retention items already folded into their skill bucket)
  checkpoints: CheckpointState;
}

/**
 * Pure decision: given the scored exam and the current grace state, decide
 * pass / pass_focus / grace / demote. Reuses `computePassed` for the pass
 * gate (every present skill >= 0.80 AND overall >= 0.80). Retention items are
 * expected to be folded into their skill buckets by the composer, so a
 * forgotten earlier-level item lowers the relevant skill and can fail it —
 * the locked "retention counts toward demotion" decision.
 */
export function interpretCheckpoint(input: InterpretInput): CheckpointOutcome {
  const { level, scores, checkpoints } = input;
  const { passed, overall } = computePassed(scores);
  const present = presentSkills(scores);
  const failedSkills = present.filter(([, v]) => v < PASS).map(([k]) => k);

  if (passed) {
    const focusSkills = present.filter(([, v]) => v >= PASS && v < CLEAN).map(([k]) => k);
    return {
      kind: focusSkills.length > 0 ? 'pass_focus' : 'pass',
      overall,
      failedSkills: [],
      focusSkills,
      demotion: null,
    };
  }

  // Failed. A1 is the floor → always grace (never demote).
  const isFloor = levelBelow(level) === null;
  const prior = checkpoints.consecutiveFails[level] ?? 0;
  if (isFloor || prior < 1) {
    return { kind: 'grace', overall, failedSkills, focusSkills: failedSkills, demotion: null };
  }
  const to = levelBelow(level)!;
  return { kind: 'demote', overall, failedSkills, focusSkills: failedSkills, demotion: { from: level, to } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checkpointPolicy.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkpointPolicy.ts src/lib/__tests__/checkpointPolicy.test.ts
git commit -m "feat(checkpoints): interpretCheckpoint pass/focus/grace/demote policy"
```

---

## Task 7: `recordCheckpointResult` — apply an outcome to certification state

**Files:**
- Create: `src/lib/checkpointStore.ts` (`recordCheckpointResult`)
- Modify: `src/lib/cefrCertification.ts` (export `writeCertificationState` so the store can persist)
- Test: `src/lib/__tests__/checkpointStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/checkpointStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordCheckpointResult } from '../checkpointStore.js';
import { getCertificationState, getCertifiedLevel } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function seed(passes: string[]) {
  const p: Record<string, unknown> = {};
  for (const lvl of passes) p[lvl] = { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 };
  localStorage.setItem(KEY, JSON.stringify({ passes: p, attempts: [], lastFailedAt: {}, v: 1 }));
}

describe('recordCheckpointResult', () => {
  beforeEach(() => localStorage.clear());

  it('clean pass resets grace, refreshes cadence, records no demotion', () => {
    seed(['A2', 'B1']);
    const o = recordCheckpointResult({
      level: 'B1', scores: { vocab: 0.95, grammar: 0.9, speaking: 0.92 }, activeDayCount: 10, now: 555,
    });
    expect(o.kind).toBe('pass');
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(555);
    expect(s.checkpoints.activeDaysAtLastCheckpoint).toBe(10);
    expect(s.checkpoints.consecutiveFails.B1 ?? 0).toBe(0);
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('first fail sets grace=1 and does NOT reset cadence (immediate retry)', () => {
    seed(['A2', 'B1']);
    const o = recordCheckpointResult({
      level: 'B1', scores: { vocab: 0.95, grammar: 0.9, speaking: 0.4 }, activeDayCount: 10, now: 555,
    });
    expect(o.kind).toBe('grace');
    const s = getCertificationState();
    expect(s.checkpoints.consecutiveFails.B1).toBe(1);
    expect(s.checkpoints.lastCheckpointAt).toBeNull(); // cadence NOT refreshed on grace
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('second consecutive fail demotes and refreshes cadence', () => {
    seed(['A2', 'B1']);
    const s0 = getCertificationState();
    s0.checkpoints.consecutiveFails.B1 = 1;
    localStorage.setItem(KEY, JSON.stringify(s0));
    const o = recordCheckpointResult({
      level: 'B1', scores: { vocab: 0.4, grammar: 0.9, speaking: 0.9 }, activeDayCount: 12, now: 777,
    });
    expect(o.kind).toBe('demote');
    expect(getCertifiedLevel()).toBe('A2');
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(777);
    expect(s.checkpoints.focusSkills.B1).toContain('vocab');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checkpointStore.test.ts`
Expected: FAIL — `../checkpointStore.js` not found.

- [ ] **Step 3: Implement the function**

(a) In `src/lib/cefrCertification.ts`, export the existing writer — change its declaration from `function writeCertificationState(` to `export function writeCertificationState(`.

(b) Create `src/lib/checkpointStore.ts`:

```ts
// src/lib/checkpointStore.ts
import {
  getCertificationState,
  writeCertificationState,
  demoteOneLevel,
  type SkillScores,
  type CertificationAttempt,
} from './cefrCertification.js';
import { interpretCheckpoint, type CheckpointOutcome } from './checkpointPolicy.js';
import type { CefrLevel } from './cefr.js';

/**
 * Applies a completed checkpoint exam to certification state and returns the
 * outcome for the UI. Cadence (lastCheckpointAt / activeDaysAtLastCheckpoint)
 * is refreshed on pass / pass_focus / demote, but NOT on grace — a grace
 * result offers an immediate retry within the same cycle.
 */
export function recordCheckpointResult(opts: {
  level: CefrLevel;
  scores: SkillScores;
  activeDayCount: number;
  now?: number;
}): CheckpointOutcome {
  const now = opts.now ?? Date.now();
  const state = getCertificationState();
  const outcome = interpretCheckpoint({
    level: opts.level,
    scores: opts.scores,
    checkpoints: state.checkpoints,
  });

  // Record an attempt for history/analytics (reuse existing shape).
  const attempt: CertificationAttempt = {
    level: opts.level,
    passed: outcome.kind === 'pass' || outcome.kind === 'pass_focus',
    takenAt: now,
    scores: opts.scores,
    overall: outcome.overall,
  };
  state.attempts.push(attempt);
  if (state.attempts.length > 100) state.attempts = state.attempts.slice(-100);

  if (outcome.focusSkills.length > 0) {
    state.checkpoints.focusSkills[opts.level] = outcome.focusSkills;
  }

  if (outcome.kind === 'pass' || outcome.kind === 'pass_focus') {
    state.checkpoints.consecutiveFails[opts.level] = 0;
    state.checkpoints.lastCheckpointAt = now;
    state.checkpoints.activeDaysAtLastCheckpoint = opts.activeDayCount;
    writeCertificationState(state);
  } else if (outcome.kind === 'grace') {
    state.checkpoints.consecutiveFails[opts.level] = (state.checkpoints.consecutiveFails[opts.level] ?? 0) + 1;
    writeCertificationState(state); // cadence NOT refreshed
  } else {
    // demote: persist attempt+focus first, then demote (demoteOneLevel writes again).
    state.checkpoints.lastCheckpointAt = now;
    state.checkpoints.activeDaysAtLastCheckpoint = opts.activeDayCount;
    writeCertificationState(state);
    demoteOneLevel('checkpoint_fail');
  }
  return outcome;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checkpointStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cefrCertification.ts src/lib/checkpointStore.ts src/lib/__tests__/checkpointStore.test.ts
git commit -m "feat(checkpoints): recordCheckpointResult applies outcome to cert state"
```

---

## Task 8: Extend cross-device sync for the `checkpoints` block

**Files:**
- Modify: `src/lib/cefrCertification.ts` (`mergeRemoteCertifications`)
- Test: `src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mergeRemoteCertifications, getCertificationState } from '../cefrCertification.js';
import type { CertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function local(cp: Partial<CertificationState['checkpoints']>) {
  const base = {
    passes: {}, attempts: [], lastFailedAt: {}, v: 2,
    checkpoints: { lastCheckpointAt: 100, activeDaysAtLastCheckpoint: 2, consecutiveFails: { B1: 0 }, focusSkills: {}, demotions: [], snoozedUntil: null, ...cp },
  };
  localStorage.setItem(KEY, JSON.stringify(base));
}

describe('mergeRemoteCertifications — checkpoints', () => {
  beforeEach(() => localStorage.clear());

  it('takes the MAX lastCheckpointAt and activeDaysAtLastCheckpoint', () => {
    local({ lastCheckpointAt: 100, activeDaysAtLastCheckpoint: 2 });
    mergeRemoteCertifications({
      passes: {}, attempts: [], lastFailedAt: {}, v: 2,
      checkpoints: { lastCheckpointAt: 200, activeDaysAtLastCheckpoint: 5, consecutiveFails: {}, focusSkills: {}, demotions: [], snoozedUntil: null },
    } as CertificationState);
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(200);
    expect(s.checkpoints.activeDaysAtLastCheckpoint).toBe(5);
  });

  it('takes the MAX consecutiveFails per level (do not erase a pending grace)', () => {
    local({ consecutiveFails: { B1: 1 } });
    mergeRemoteCertifications({
      passes: {}, attempts: [], lastFailedAt: {}, v: 2,
      checkpoints: { lastCheckpointAt: null, activeDaysAtLastCheckpoint: 0, consecutiveFails: { B1: 0, A2: 1 }, focusSkills: {}, demotions: [], snoozedUntil: null },
    } as CertificationState);
    const s = getCertificationState();
    expect(s.checkpoints.consecutiveFails.B1).toBe(1);
    expect(s.checkpoints.consecutiveFails.A2).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts`
Expected: FAIL — merge ignores `checkpoints` (values stay local).

- [ ] **Step 3: Implement the change**

In `mergeRemoteCertifications`, just before the final `writeCertificationState(local);`, add:

```ts
  // checkpoints — most-recent cadence wins; grace counters take MAX so a
  // stale device cannot erase a pending demotion. snoozedUntil takes MAX.
  if (remote.checkpoints && typeof remote.checkpoints === 'object') {
    const rc = remote.checkpoints;
    const lc = local.checkpoints;
    if (typeof rc.lastCheckpointAt === 'number') {
      lc.lastCheckpointAt = lc.lastCheckpointAt == null ? rc.lastCheckpointAt : Math.max(lc.lastCheckpointAt, rc.lastCheckpointAt);
    }
    if (typeof rc.activeDaysAtLastCheckpoint === 'number') {
      lc.activeDaysAtLastCheckpoint = Math.max(lc.activeDaysAtLastCheckpoint, rc.activeDaysAtLastCheckpoint);
    }
    if (rc.consecutiveFails && typeof rc.consecutiveFails === 'object') {
      for (const k of Object.keys(rc.consecutiveFails) as CefrLevel[]) {
        const r = rc.consecutiveFails[k] ?? 0;
        const l = lc.consecutiveFails[k] ?? 0;
        lc.consecutiveFails[k] = Math.max(l, r);
      }
    }
    if (rc.focusSkills && typeof rc.focusSkills === 'object') {
      for (const k of Object.keys(rc.focusSkills) as CefrLevel[]) {
        if (!lc.focusSkills[k] && rc.focusSkills[k]) lc.focusSkills[k] = rc.focusSkills[k];
      }
    }
    if (Array.isArray(rc.demotions)) {
      const seen = new Set(lc.demotions.map((d) => d.at));
      for (const d of rc.demotions) if (d && !seen.has(d.at)) lc.demotions.push(d);
      lc.demotions.sort((a, b) => a.at - b.at);
    }
    if (typeof rc.snoozedUntil === 'number') {
      lc.snoozedUntil = lc.snoozedUntil == null ? rc.snoozedUntil : Math.max(lc.snoozedUntil, rc.snoozedUntil);
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full certification + sync suites**

Run: `npx vitest run src/lib/__tests__/cefrCertification.test.ts src/tests/progressSnapshot.test.ts src/tests/applyRemoteProgress.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cefrCertification.ts src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts
git commit -m "feat(checkpoints): cross-device merge for checkpoints state block"
```

---

## Task 9: Speaking task content (`speakingTasks.ts`)

**Files:**
- Create: `src/data/speakingTasks.ts`
- Test: `src/tests/speakingTasks.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/speakingTasks.test.ts
import { describe, it, expect } from 'vitest';
import { SPEAKING_TASKS, getSpeakingTasks } from '../data/speakingTasks.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

describe('speakingTasks', () => {
  it('every gating level A1..C1 has at least 2 prompts', () => {
    for (const lvl of LEVELS) {
      expect(SPEAKING_TASKS[lvl]?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('each task has a non-empty Croatian prompt, English gloss, and seconds target', () => {
    for (const lvl of LEVELS) {
      for (const t of getSpeakingTasks(lvl)) {
        expect(t.prompt.trim().length).toBeGreaterThan(0);
        expect(t.promptEn.trim().length).toBeGreaterThan(0);
        expect(t.seconds).toBeGreaterThanOrEqual(20);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/speakingTasks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the data module**

```ts
// src/data/speakingTasks.ts
import type { CefrLevel } from '../lib/cefr.js';

export interface SpeakingTask {
  id: string;
  /** Spoken prompt shown in Croatian. */
  prompt: string;
  /** English gloss under the prompt. */
  promptEn: string;
  /** Suggested speaking duration (seconds). */
  seconds: number;
}

/**
 * Productive speaking prompts per CEFR level. The learner records an open
 * spoken answer; Plan 2 transcribes (Whisper) and scores it (Claude rubric:
 * range / accuracy / fluency / task). Prompts escalate in cognitive demand
 * per the CEFR speaking descriptors (A1 concrete/personal → C1 abstract/argued).
 */
export const SPEAKING_TASKS: Partial<Record<CefrLevel, SpeakingTask[]>> = {
  A1: [
    { id: 'a1-intro', prompt: 'Predstavite se: kako se zovete, odakle ste i koliko imate godina.', promptEn: 'Introduce yourself: your name, where you are from, and your age.', seconds: 30 },
    { id: 'a1-family', prompt: 'Opišite svoju obitelj. Tko su članovi vaše obitelji?', promptEn: 'Describe your family. Who are its members?', seconds: 30 },
  ],
  A2: [
    { id: 'a2-day', prompt: 'Opišite svoj uobičajeni dan, od jutra do večeri.', promptEn: 'Describe your typical day, from morning to evening.', seconds: 40 },
    { id: 'a2-weekend', prompt: 'Što ste radili prošli vikend? Ispričajte ukratko.', promptEn: 'What did you do last weekend? Tell it briefly.', seconds: 40 },
  ],
  B1: [
    { id: 'b1-trip', prompt: 'Opišite putovanje koje ste nedavno doživjeli — kamo, s kim i što se dogodilo.', promptEn: 'Describe a recent trip — where, with whom, and what happened.', seconds: 45 },
    { id: 'b1-opinion', prompt: 'Mislite li da je bolje živjeti u gradu ili na selu? Obrazložite.', promptEn: 'Do you think it is better to live in the city or the countryside? Give reasons.', seconds: 45 },
  ],
  B2: [
    { id: 'b2-tech', prompt: 'Kako je tehnologija promijenila način na koji ljudi komuniciraju? Iznesite argumente.', promptEn: 'How has technology changed the way people communicate? Make your case.', seconds: 60 },
    { id: 'b2-problem', prompt: 'Opišite jedan problem u svojoj zajednici i predložite rješenje.', promptEn: 'Describe a problem in your community and propose a solution.', seconds: 60 },
  ],
  C1: [
    { id: 'c1-abstract', prompt: 'Treba li umjetnost imati društvenu svrhu ili postojati radi sebe same? Razložite svoje stajalište.', promptEn: 'Should art serve a social purpose or exist for its own sake? Argue your position.', seconds: 60 },
    { id: 'c1-media', prompt: 'Kakvu ulogu mediji imaju u oblikovanju javnog mnijenja? Kritički procijenite.', promptEn: 'What role do the media play in shaping public opinion? Evaluate critically.', seconds: 60 },
  ],
};

export function getSpeakingTasks(level: CefrLevel): SpeakingTask[] {
  return SPEAKING_TASKS[level] ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/speakingTasks.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/speakingTasks.ts src/tests/speakingTasks.test.ts
git commit -m "feat(checkpoints): per-level productive speaking task prompts A1-C1"
```

---

## Task 10: `examBlueprint` + `examComposer` — describe and build a checkpoint exam

**Files:**
- Create: `src/lib/examBlueprint.ts`
- Create: `src/lib/examComposer.ts`
- Test: `src/lib/__tests__/examComposer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/examComposer.test.ts
import { describe, it, expect } from 'vitest';
import { buildCheckpointBlueprint } from '../examBlueprint.js';
import { composeExam } from '../examComposer.js';
import type { ComposerBanks } from '../examComposer.js';

// Minimal fake item banks keyed by level. Each item carries its skill + level.
const banks: ComposerBanks = {
  itemsByLevel: {
    A1: [{ id: 'a1-v1', skill: 'vocab', level: 'A1' }, { id: 'a1-g1', skill: 'grammar', level: 'A1' }],
    A2: [{ id: 'a2-v1', skill: 'vocab', level: 'A2' }, { id: 'a2-g1', skill: 'grammar', level: 'A2' }, { id: 'a2-r1', skill: 'reading', level: 'A2' }],
    B1: [
      { id: 'b1-v1', skill: 'vocab', level: 'B1' }, { id: 'b1-v2', skill: 'vocab', level: 'B1' },
      { id: 'b1-g1', skill: 'grammar', level: 'B1' }, { id: 'b1-g2', skill: 'grammar', level: 'B1' },
      { id: 'b1-r1', skill: 'reading', level: 'B1' },
    ],
  },
  speakingTasksByLevel: { B1: [{ id: 'b1-spk1' }, { id: 'b1-spk2' }] },
};

function seededRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length]!;
}

describe('composeExam (B1 checkpoint)', () => {
  it('includes core B1 items, 2 retention items from below B1, and 1 speaking task by default', () => {
    const bp = buildCheckpointBlueprint('B1', { speakingFlagged: false });
    const exam = composeExam(bp, banks, { weakTopics: [] }, seededRng([0, 0, 0, 0, 0]));
    expect(exam.coreItems.every((it) => it.level === 'B1')).toBe(true);
    expect(exam.retentionItems).toHaveLength(2);
    expect(exam.retentionItems.every((it) => it.level !== 'B1')).toBe(true);
    expect(exam.speakingTasks).toHaveLength(1);
  });

  it('starts with 2 speaking tasks when speaking was previously flagged', () => {
    const bp = buildCheckpointBlueprint('B1', { speakingFlagged: true });
    const exam = composeExam(bp, banks, { weakTopics: [] }, seededRng([0, 0, 0, 0, 0]));
    expect(exam.speakingTasks).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/examComposer.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `examBlueprint.ts`**

```ts
// src/lib/examBlueprint.ts
import type { CefrLevel } from './cefr.js';

export interface CheckpointBlueprint {
  level: CefrLevel;
  /** How many retention items to pull from levels below `level`. */
  retentionCount: number;
  /** How many speaking tasks to start with (a 2nd may be added at runtime if borderline). */
  speakingCount: number;
}

/**
 * Describes a checkpoint exam for `level`. Speaking starts at 1 task, or 2 if
 * the previous checkpoint flagged speaking (the runtime adds a 2nd task on a
 * borderline single-task score — that escalation lives in Plan 3's runner).
 */
export function buildCheckpointBlueprint(
  level: CefrLevel,
  opts: { speakingFlagged: boolean },
): CheckpointBlueprint {
  return {
    level,
    retentionCount: 2,
    speakingCount: opts.speakingFlagged ? 2 : 1,
  };
}
```

- [ ] **Step 4: Implement `examComposer.ts`**

```ts
// src/lib/examComposer.ts
import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER, cefrRank } from './cefr.js';
import type { SkillKey } from './cefrCertification.js';
import type { CheckpointBlueprint } from './examBlueprint.js';

export interface ExamItem {
  id: string;
  skill: SkillKey;
  level: CefrLevel;
}
export interface SpeakingTaskRef {
  id: string;
}
export interface ComposerBanks {
  itemsByLevel: Partial<Record<CefrLevel, ExamItem[]>>;
  speakingTasksByLevel: Partial<Record<CefrLevel, SpeakingTaskRef[]>>;
}
export interface ComposedExam {
  level: CefrLevel;
  coreItems: ExamItem[];
  retentionItems: ExamItem[];
  speakingTasks: SpeakingTaskRef[];
}

/** Injected RNG returning [0,1); pass a seeded fn in tests (no Math.random in pure code). */
export type Rng = () => number;

function pick<T>(arr: T[], n: number, rng: Rng): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

/**
 * Turns a blueprint into concrete items:
 *  - core: all items at `level`.
 *  - retention: `retentionCount` items from levels BELOW `level`, preferring
 *    items whose skill is in the learner's weak-topic list, then random.
 *    Retention items keep their original (lower) `level` so the scorer/UI can
 *    fold them into the right skill bucket (retention counts toward the gate).
 *  - speaking: `speakingCount` tasks at `level`.
 */
export function composeExam(
  bp: CheckpointBlueprint,
  banks: ComposerBanks,
  adaptive: { weakTopics: SkillKey[] },
  rng: Rng,
): ComposedExam {
  const coreItems = banks.itemsByLevel[bp.level] ?? [];

  const belowLevels = CEFR_ORDER.filter((l) => cefrRank(l) < cefrRank(bp.level));
  const belowPool: ExamItem[] = belowLevels.flatMap((l) => banks.itemsByLevel[l] ?? []);
  const weak = new Set(adaptive.weakTopics);
  const weakFirst = belowPool.filter((it) => weak.has(it.skill));
  const rest = belowPool.filter((it) => !weak.has(it.skill));
  const retentionItems = [
    ...pick(weakFirst, bp.retentionCount, rng),
    ...pick(rest, Math.max(0, bp.retentionCount - Math.min(weakFirst.length, bp.retentionCount)), rng),
  ].slice(0, bp.retentionCount);

  const speakingTasks = pick(banks.speakingTasksByLevel[bp.level] ?? [], bp.speakingCount, rng);

  return { level: bp.level, coreItems, retentionItems, speakingTasks };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/examComposer.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/examBlueprint.ts src/lib/examComposer.ts src/lib/__tests__/examComposer.test.ts
git commit -m "feat(checkpoints): exam blueprint + composer (core + retention + speaking)"
```

---

## Task 11: Full-suite green + typecheck gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: PASS — all existing tests plus the new ones from Tasks 1–10.

- [ ] **Step 2: Typecheck + lint (the CI gate)**

Run: `npx tsc --noEmit && npm run lint`
Expected: no type errors, no lint errors.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore(checkpoints): foundation green — full unit suite + typecheck pass"
```

---

## Done criteria for Plan 1

- `npm test` green; `tsc --noEmit` and `lint` clean.
- Certification state migrates `v1 → v2` and round-trips the `checkpoints` block cross-device.
- Pure modules (`activeDayTracker`, `checkpointSchedule`, `checkpointPolicy`, `examBlueprint`, `examComposer`) are fully unit-tested and have **no imports from React or the network**.
- `CHECKPOINTS_ENABLED` does not yet exist as a wired flag and **no UI path calls any of this** — zero user-visible change. (The flag is introduced and consumed in Plan 3.)

## Hand-off to Plan 2 / Plan 3

- **Plan 2 (Speaking subsystem):** `SpeakingScorer` interface + `whisperClaudeScorer` + `functions/api/assess-speaking.ts` (Firebase-auth'd, clip-capped, rate-limited). Produces a `speaking` score (0..1) the runner folds into `SkillScores`.
- **Plan 3 (UI + integration):** `ExamRunner` (consumes `composeExam` output + `SpeakingScorer`), `CheckpointInviteModal`, `SpeakingTaskScreen`, `CheckpointResultScreen`; App-layer due-check (`isCheckpointDue`, gated on `syncReady`, foreground/HomeTab only, never mid-lesson); `recordActiveDayNow()` wired into app open; introduce + flip `CHECKPOINTS_ENABLED`; refactor `EquivalencyTestScreen` onto the shared runner; E2E with stubbed audio.
