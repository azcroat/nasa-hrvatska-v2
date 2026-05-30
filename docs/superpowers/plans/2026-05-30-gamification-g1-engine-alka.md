# Gamification G1 — Scoring Engine + Alka Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a complete, playable solo **Alka** game mode (the flagship Sinjska-alka precision game) reachable from a new prominent **Arcade** entry, built on a pure, unit-tested scoring engine that reuses existing Croatian exercises.

**Architecture:** Three pure logic modules (`scoring`, `alkaRules`, `exerciseSource`) under `src/lib/gamification/` carry all the game math and content selection with zero UI/Firebase dependencies, so they are fully unit-testable. The `Alka` screen (under `src/components/practice/alka/`) is a thin React orchestrator over those modules: it runs three "runs" of questions, maps answer quality to a ring zone (1/2/3 / miss), and shows a result. An `ArcadeHub` screen is the entry point; `Alka` is live, the other four modes show "coming soon". A new route-guard test (`arcade-routes.test.ts`) mirrors the existing dead-lesson guard so no Arcade screen can ship as an empty page.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest, Framer Motion, existing `StatsContext.award()`, `getUserCefr()`, `ScreenHeader`. The GameShell/ModeAdapter generalization in the spec (§5.2) is deliberately deferred to G2 — we build Alka directly on the pure engine now and extract the shared shell when the second mode (Boss Battle) arrives as the second consumer (YAGNI).

**Scope note:** The Map of Croatia (spec §3) is a separate follow-on plan (G1b). This plan delivers a self-contained playable game. Map granularity will use the existing 10 `REGIONS` keys.

**Design constraints carried from the spec (must honor):**
- Premium heritage register only (navy `#0a2348` / gold `#C8980A`,`#FFE070`, Playfair Display). No cartoon/candy/Comic-Sans skin.
- No awards/badges wall, no leaderboards, no paywall, no lives-gating between sessions.
- Never destroy progress (personal best only ever increases).
- Prominent placement — Arcade entry goes at the **top** of the Practice tab, not buried.

---

## File Structure

**Create:**
- `src/lib/gamification/scoring.ts` — pure scoring engine (combo, speed bonus, performance tier).
- `src/lib/gamification/alkaRules.ts` — pure Alka rules (tier→ring-zone, run/ride aggregation, u-sridu).
- `src/lib/gamification/exerciseSource.ts` — pure selection of existing exercises into game questions, CEFR-gated.
- `src/lib/gamification/alkaBest.ts` — read/write the Alka personal best (localStorage), with a sync-snapshot key.
- `src/components/practice/alka/AlkaRing.tsx` — the alka target ring visual (zones + reticle).
- `src/components/practice/alka/AlkaResult.tsx` — result card (points/9, u sridu, personal best).
- `src/components/practice/alka/useAlkaRide.ts` — ride state machine hook.
- `src/components/practice/alka/AlkaScreen.tsx` — the mode screen orchestrator.
- `src/components/practice/ArcadeHub.tsx` — the Arcade entry hub (mode tiles).
- `src/tests/scoring.test.ts`, `src/tests/alkaRules.test.ts`, `src/tests/exerciseSource.test.ts`, `src/tests/useAlkaRide.test.ts`, `src/tests/arcade-routes.test.ts`.

**Modify:**
- `src/components/AppRouter.tsx` — register `arcade` + `alka` lazy screens and routes; add `award`-passing.
- `src/components/practice/PracticeTab.tsx` — add a prominent top Arcade entry card.
- `src/lib/progressSnapshot.ts` — include the Alka-best key so it syncs across devices.

---

## Shared type & constant contract (used across tasks — defined in Task 1/2/3)

```typescript
// scoring.ts
export type PerformanceTier = 'miss' | 'weak' | 'solid' | 'perfect';
export interface AnswerInput { correct: boolean; responseMs: number; combo: number; }
export interface AnswerResult { points: number; combo: number; speedBonus: number; tier: PerformanceTier; }

// alkaRules.ts
export type RingZone = 0 | 1 | 2 | 3; // 0 miss, 1 lower field, 2 upper field, 3 u sridu

// exerciseSource.ts
export interface GameQuestion { id: string; prompt: string; options: string[]; correctIndex: number; }
```

---

## Task 1: Scoring engine (pure)

**Files:**
- Create: `src/lib/gamification/scoring.ts`
- Test: `src/tests/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { scoreAnswer, BASE_POINTS, MAX_SPEED_BONUS, FAST_MS, SLOW_MS } from '../lib/gamification/scoring';

describe('scoreAnswer', () => {
  it('wrong answer: zero points, combo reset, tier miss', () => {
    const r = scoreAnswer({ correct: false, responseMs: 800, combo: 5 });
    expect(r.points).toBe(0);
    expect(r.combo).toBe(0);
    expect(r.tier).toBe('miss');
  });

  it('fast correct answer: full speed bonus and perfect tier at combo 0', () => {
    const r = scoreAnswer({ correct: true, responseMs: FAST_MS, combo: 0 });
    expect(r.speedBonus).toBe(MAX_SPEED_BONUS);
    expect(r.points).toBe(BASE_POINTS + MAX_SPEED_BONUS); // combo 0 → x1.0
    expect(r.combo).toBe(1);
    expect(r.tier).toBe('perfect');
  });

  it('slow correct answer: no speed bonus, weak tier', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 0 });
    expect(r.speedBonus).toBe(0);
    expect(r.points).toBe(BASE_POINTS);
    expect(r.tier).toBe('weak');
  });

  it('combo multiplies points: combo 5 adds +50% before rounding', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 5 });
    // (100 + 0) * (1 + 5*0.1) = 150
    expect(r.points).toBe(150);
    expect(r.combo).toBe(6);
  });

  it('combo multiplier is capped at x2.0 (combo >= 10)', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 20 });
    expect(r.points).toBe(200); // 100 * 2.0
  });

  it('mid-speed correct answer interpolates speed bonus and is solid tier', () => {
    const mid = (FAST_MS + SLOW_MS) / 2;
    const r = scoreAnswer({ correct: true, responseMs: mid, combo: 0 });
    expect(r.speedBonus).toBe(Math.round(MAX_SPEED_BONUS / 2));
    expect(r.tier).toBe('solid');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/scoring.test.ts`
Expected: FAIL — cannot resolve `../lib/gamification/scoring`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/gamification/scoring.ts
export type PerformanceTier = 'miss' | 'weak' | 'solid' | 'perfect';

export interface AnswerInput {
  correct: boolean;
  responseMs: number;
  combo: number; // combo BEFORE this answer
}

export interface AnswerResult {
  points: number;
  combo: number; // combo AFTER this answer
  speedBonus: number;
  tier: PerformanceTier;
}

export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
export const FAST_MS = 1500; // at/under → full speed bonus
export const SLOW_MS = 6000; // at/over → no speed bonus

// Linear speed bonus between FAST_MS (full) and SLOW_MS (none).
function speedBonusFor(responseMs: number): number {
  if (responseMs <= FAST_MS) return MAX_SPEED_BONUS;
  if (responseMs >= SLOW_MS) return 0;
  const frac = (SLOW_MS - responseMs) / (SLOW_MS - FAST_MS);
  return Math.round(MAX_SPEED_BONUS * frac);
}

// Tier for a CORRECT answer, by speed.
function correctTier(responseMs: number): Exclude<PerformanceTier, 'miss'> {
  if (responseMs <= FAST_MS) return 'perfect';
  if (responseMs >= SLOW_MS) return 'weak';
  return 'solid';
}

export function scoreAnswer(input: AnswerInput): AnswerResult {
  if (!input.correct) {
    return { points: 0, combo: 0, speedBonus: 0, tier: 'miss' };
  }
  const speedBonus = speedBonusFor(input.responseMs);
  const multiplier = Math.min(2.0, 1 + input.combo * 0.1);
  const points = Math.round((BASE_POINTS + speedBonus) * multiplier);
  return { points, combo: input.combo + 1, speedBonus, tier: correctTier(input.responseMs) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/scoring.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gamification/scoring.ts src/tests/scoring.test.ts
git commit -m "feat(gamification): pure scoring engine (combo, speed bonus, tier)"
```

---

## Task 2: Alka rules (pure)

**Files:**
- Create: `src/lib/gamification/alkaRules.ts`
- Test: `src/tests/alkaRules.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/alkaRules.test.ts
import { describe, it, expect } from 'vitest';
import {
  runToZone, rideTotal, isUSridu, QUESTIONS_PER_RUN, RUNS_PER_RIDE, MAX_RIDE_POINTS,
} from '../lib/gamification/alkaRules';
import type { PerformanceTier } from '../lib/gamification/scoring';

const tiers = (...t: PerformanceTier[]) => t;

describe('runToZone', () => {
  it('all perfect → u sridu (3)', () => {
    expect(runToZone(tiers('perfect', 'perfect', 'perfect'))).toBe(3);
  });
  it('perfect + solid, no miss → upper field (2)', () => {
    expect(runToZone(tiers('perfect', 'solid', 'solid'))).toBe(2);
  });
  it('one miss → at most lower field (1)', () => {
    expect(runToZone(tiers('perfect', 'perfect', 'miss'))).toBe(1);
  });
  it('all miss → miss (0)', () => {
    expect(runToZone(tiers('miss', 'miss', 'miss'))).toBe(0);
  });
});

describe('rideTotal', () => {
  it('sums three runs and caps at 9', () => {
    expect(rideTotal([3, 3, 3])).toBe(9);
    expect(rideTotal([1, 2, 3])).toBe(6);
  });
  it('MAX_RIDE_POINTS is 9', () => {
    expect(MAX_RIDE_POINTS).toBe(9);
    expect(RUNS_PER_RIDE * 3).toBe(MAX_RIDE_POINTS);
  });
});

describe('isUSridu', () => {
  it('true only for zone 3', () => {
    expect(isUSridu(3)).toBe(true);
    expect(isUSridu(2)).toBe(false);
    expect(isUSridu(0)).toBe(false);
  });
});

describe('config', () => {
  it('a run has 3 questions', () => {
    expect(QUESTIONS_PER_RUN).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/alkaRules.test.ts`
Expected: FAIL — cannot resolve `../lib/gamification/alkaRules`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/gamification/alkaRules.ts
import type { PerformanceTier } from './scoring';

export type RingZone = 0 | 1 | 2 | 3; // 0 miss, 1 lower field, 2 upper field, 3 u sridu

export const QUESTIONS_PER_RUN = 3;
export const RUNS_PER_RIDE = 3;
export const MAX_RIDE_POINTS = RUNS_PER_RIDE * 3; // 9

// A run's lance lands by how cleanly its questions were answered.
// Any miss caps the lance at the lower field (1). With no misses, the
// proportion of "perfect" answers decides upper (2) vs centre (3).
export function runToZone(tiers: PerformanceTier[]): RingZone {
  if (tiers.length === 0) return 0;
  const misses = tiers.filter((t) => t === 'miss').length;
  if (misses === tiers.length) return 0;
  if (misses > 0) return 1;
  const perfects = tiers.filter((t) => t === 'perfect').length;
  return perfects === tiers.length ? 3 : 2;
}

export function rideTotal(runs: RingZone[]): number {
  return Math.min(MAX_RIDE_POINTS, runs.reduce((sum, z) => sum + z, 0));
}

export function isUSridu(zone: RingZone): boolean {
  return zone === 3;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/alkaRules.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gamification/alkaRules.ts src/tests/alkaRules.test.ts
git commit -m "feat(gamification): pure Alka ring rules (zone, ride total, u sridu)"
```

---

## Task 3: Exercise source (pure)

**Files:**
- Create: `src/lib/gamification/exerciseSource.ts`
- Test: `src/tests/exerciseSource.test.ts`

Note: `src/data/exercises.js` entries are `{ q, o, c, d, skill }` (q=prompt, o=options[], c=correctIndex, d=difficulty 1|2). We map to `GameQuestion` and gate by CEFR via difficulty: difficulty 1 = available to all; difficulty 2 = B1+.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/exerciseSource.test.ts
import { describe, it, expect } from 'vitest';
import { selectQuestions, toGameQuestion } from '../lib/gamification/exerciseSource';

describe('toGameQuestion', () => {
  it('maps {q,o,c} raw exercise to GameQuestion shape', () => {
    const g = toGameQuestion({ q: "What does 'Bog' mean?", o: ['Goodbye', 'Hello', 'Thank you'], c: 1, d: 1, skill: 'culture' }, 0);
    expect(g).toEqual({
      id: 'ex-0',
      prompt: "What does 'Bog' mean?",
      options: ['Goodbye', 'Hello', 'Thank you'],
      correctIndex: 1,
    });
  });
});

describe('selectQuestions', () => {
  it('returns exactly the requested count of valid questions', () => {
    const qs = selectQuestions({ xp: 0, lc: 0, gc: 0, count: 9 });
    expect(qs).toHaveLength(9);
    for (const q of qs) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('beginner user (A1) gets only difficulty-1 questions', () => {
    const qs = selectQuestions({ xp: 0, lc: 0, gc: 0, count: 9, _debugReturnRaw: true });
    expect(qs.every((q) => q._d === 1)).toBe(true);
  });

  it('advanced user (B1+) may include difficulty-2 questions', () => {
    // 5000 xp → B1 per getUserCefr
    const qs = selectQuestions({ xp: 5000, lc: 0, gc: 0, count: 50, _debugReturnRaw: true });
    expect(qs.some((q) => q._d === 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/exerciseSource.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/gamification/exerciseSource.ts
import { getUserCefr, cefrRank } from '../cefr';
// @ts-expect-error — exercises.js is untyped JS data
import { PLACE } from '../../data/exercises.js';

// PLACE is the MC vocab pool (~206 entries, {q,o,c,d,skill}, incl. some d:2).

export interface GameQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface RawExercise { q: string; o: string[]; c: number; d?: number; skill?: string; }

export function toGameQuestion(raw: RawExercise, index: number): GameQuestion {
  return { id: `ex-${index}`, prompt: raw.q, options: raw.o, correctIndex: raw.c };
}

function isValid(raw: RawExercise): boolean {
  return (
    !!raw &&
    typeof raw.q === 'string' &&
    Array.isArray(raw.o) &&
    raw.o.length >= 2 &&
    typeof raw.c === 'number' &&
    raw.c >= 0 &&
    raw.c < raw.o.length
  );
}

// Fisher-Yates (caller-seedable position not needed for G1; randomness is fine).
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

interface SelectOpts {
  xp: number; lc: number; gc: number; count: number;
  _debugReturnRaw?: boolean;
}

export function selectQuestions(opts: SelectOpts): GameQuestion[] {
  const userCefr = getUserCefr(opts.xp, opts.lc, opts.gc);
  const allowDifficulty2 = cefrRank(userCefr) >= cefrRank('B1');
  const pool = (PLACE as RawExercise[])
    .filter(isValid)
    .filter((e) => (e.d ?? 1) <= (allowDifficulty2 ? 2 : 1));
  const picked = shuffle(pool).slice(0, opts.count);
  const mapped = picked.map((raw, i) =>
    opts._debugReturnRaw
      ? ({ ...toGameQuestion(raw, i), _d: raw.d ?? 1 } as GameQuestion & { _d: number })
      : toGameQuestion(raw, i),
  );
  return mapped;
}
```

> `PLACE` is confirmed (206 MC entries, `{q,o,c,d,skill}`). If you want a larger pool later you can also fold in other MC-shaped exports (e.g. `FALSEFR`, `NEGATION`), but `PLACE` alone is sufficient for G1. Verify with: `npx vitest run src/tests/exerciseSource.test.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/exerciseSource.test.ts`
Expected: PASS. If the advanced-difficulty test fails because the dataset has no `d:2` items, change that test to assert the pool size for B1 is `>=` the A1 pool size instead, and note it in the commit.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gamification/exerciseSource.ts src/tests/exerciseSource.test.ts
git commit -m "feat(gamification): CEFR-gated exercise selection for game modes"
```

---

## Task 4: Alka personal best (storage)

**Files:**
- Create: `src/lib/gamification/alkaBest.ts`
- Modify: `src/lib/progressSnapshot.ts` (add the best key so it syncs)
- Test: (covered via `useAlkaRide` test in Task 7; this module is a thin localStorage wrapper)

- [ ] **Step 1: Write the implementation**

```typescript
// src/lib/gamification/alkaBest.ts
// Persistent best Alka score (0-9). Only ever increases (progress protection).
export const ALKA_BEST_KEY = 'nh_alka_best';

export function getAlkaBest(): number {
  try {
    const raw = localStorage.getItem(ALKA_BEST_KEY);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(9, n) : 0;
  } catch {
    return 0;
  }
}

// Returns true if this score set a new best.
export function recordAlkaBest(score: number): boolean {
  const prev = getAlkaBest();
  if (score > prev) {
    try {
      localStorage.setItem(ALKA_BEST_KEY, String(Math.min(9, score)));
    } catch {
      /* storage unavailable — non-fatal */
    }
    return true;
  }
  return false;
}
```

- [ ] **Step 2: Wire the best key into cross-device sync**

Open `src/lib/progressSnapshot.ts`, find where device-local `nh_*` keys are collected into the snapshot (the `localStorage.getItem('nh_...')` reads). Add `nh_alka_best` alongside the existing keys so it round-trips like the others. Show the existing pattern first:

Run: `npx grep -n "nh_hero_expanded\|localStorage.getItem('nh" src/lib/progressSnapshot.ts` (or use the Grep tool). Add a sibling line for `ALKA_BEST_KEY`/`'nh_alka_best'` following that exact pattern.

- [ ] **Step 3: Verify build still type-checks**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/gamification/alkaBest.ts src/lib/progressSnapshot.ts
git commit -m "feat(gamification): persistent Alka best with cross-device sync"
```

---

## Task 5: Alka ring visual (component)

**Files:**
- Create: `src/components/practice/alka/AlkaRing.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/practice/alka/AlkaRing.tsx
import React from 'react';
import type { RingZone } from '../../../lib/gamification/alkaRules';

// Aim tightens toward centre as `aim` (0..1) approaches 1.
// When `landed` is set, the reticle snaps to that zone's radius.
export default function AlkaRing({
  aim,
  landed,
  size = 120,
}: {
  aim: number; // 0 (wide) .. 1 (dead centre)
  landed?: RingZone | null;
  size?: number;
}) {
  // Reticle offset from centre, in px. Tighter aim → smaller offset.
  const maxOffset = size * 0.32;
  const offset =
    landed == null
      ? maxOffset * (1 - Math.max(0, Math.min(1, aim)))
      : landed === 3
        ? 0
        : landed === 2
          ? size * 0.16
          : landed === 1
            ? size * 0.3
            : size * 0.45;
  const reticleColor = landed === 3 ? '#FFE070' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <div style={ring(size, 'rgba(56,189,248,.10)', 'rgba(56,189,248,.45)')} />
      <div style={ring(size * 0.65, 'rgba(56,189,248,.18)', 'rgba(56,189,248,.6)')} />
      <div
        style={{
          ...ring(size * 0.32, 'radial-gradient(circle,#FFE070,#C8980A)', '#fff'),
          boxShadow: '0 0 16px rgba(255,224,112,.7)',
          color: '#3a2a00',
          fontWeight: 900,
          fontSize: 13,
        }}
      >
        3
      </div>
      <div
        aria-label="lance aim"
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% - ${offset}px)`,
          transform: 'translate(-50%,-50%)',
          width: 20,
          height: 20,
          border: `2px solid ${reticleColor}`,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${reticleColor}`,
          transition: 'top .35s ease, border-color .2s',
        }}
      />
    </div>
  );
}

function ring(d: number, bg: string, border: string): React.CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%,-50%)',
    width: d,
    height: d,
    borderRadius: '50%',
    background: bg,
    border: `2px solid ${border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/practice/alka/AlkaRing.tsx
git commit -m "feat(gamification): Alka ring visual with aim reticle"
```

---

## Task 6: Alka result card (component)

**Files:**
- Create: `src/components/practice/alka/AlkaResult.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/practice/alka/AlkaResult.tsx
import React from 'react';
import { MAX_RIDE_POINTS } from '../../../lib/gamification/alkaRules';

export default function AlkaResult({
  total,
  isNewBest,
  previousBest,
  onPlayAgain,
  onExit,
}: {
  total: number;
  isNewBest: boolean;
  previousBest: number;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  const perfect = total === MAX_RIDE_POINTS;
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#fff' }}>
      {perfect && (
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 26,
            fontWeight: 900,
            color: '#FFE070',
            textShadow: '0 0 18px rgba(255,224,112,.6)',
          }}
        >
          U SRIDU!
        </div>
      )}
      <div style={{ fontSize: 48, fontWeight: 900, color: '#FFE070', lineHeight: 1, marginTop: 8 }}>
        {total}
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,.5)' }}> / {MAX_RIDE_POINTS}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>
        {isNewBest ? `New personal best! (was ${previousBest})` : `Your best: ${previousBest}`}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
        <button onClick={onPlayAgain} style={btn('#C8980A')}>
          Ride again
        </button>
        <button onClick={onExit} style={btn('rgba(255,255,255,.12)')}>
          Done
        </button>
      </div>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: '1px solid rgba(255,255,255,.2)',
    borderRadius: 12,
    padding: '10px 18px',
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/practice/alka/AlkaResult.tsx
git commit -m "feat(gamification): Alka result card"
```

---

## Task 7: Alka ride state machine (hook)

**Files:**
- Create: `src/components/practice/alka/useAlkaRide.ts`
- Test: `src/tests/useAlkaRide.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/useAlkaRide.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlkaRide } from '../components/practice/alka/useAlkaRide';
import type { GameQuestion } from '../lib/gamification/exerciseSource';

const Q = (i: number): GameQuestion => ({
  id: `q${i}`,
  prompt: `prompt ${i}`,
  options: ['a', 'b', 'c'],
  correctIndex: 1,
});
const nineQuestions = Array.from({ length: 9 }, (_, i) => Q(i));

describe('useAlkaRide', () => {
  beforeEach(() => localStorage.clear());

  it('starts on run 1, question 0, status playing', () => {
    const { result } = renderHook(() => useAlkaRide({ questions: nineQuestions, onXp: () => {} }));
    expect(result.current.status).toBe('playing');
    expect(result.current.runIndex).toBe(0);
    expect(result.current.current.id).toBe('q0');
  });

  it('all-correct-and-fast ride scores 9/9 and ends in result', () => {
    let awarded = 0;
    const { result } = renderHook(() =>
      useAlkaRide({ questions: nineQuestions, onXp: (n) => (awarded += n) }),
    );
    act(() => {
      for (let i = 0; i < 9; i++) result.current.answer(1, 500); // correct, fast
    });
    expect(result.current.status).toBe('result');
    expect(result.current.total).toBe(9);
    expect(result.current.isNewBest).toBe(true);
    expect(awarded).toBeGreaterThan(0);
  });

  it('one wrong answer caps that run at the lower field', () => {
    const { result } = renderHook(() => useAlkaRide({ questions: nineQuestions, onXp: () => {} }));
    act(() => {
      result.current.answer(0, 500); // wrong (correctIndex is 1)
      result.current.answer(1, 500);
      result.current.answer(1, 500);
      for (let i = 0; i < 6; i++) result.current.answer(1, 500);
    });
    expect(result.current.runZones[0]).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/useAlkaRide.test.ts`
Expected: FAIL — cannot resolve hook module.

> If `@testing-library/react`'s `renderHook` is not installed, check `package.json` devDependencies. If absent, rewrite the hook as a pure reducer `alkaRideReducer(state, action)` in the same file and test the reducer directly (no React renderer needed). Prefer the reducer approach if unsure — it is simpler to test.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/components/practice/alka/useAlkaRide.ts
import { useMemo, useState, useCallback } from 'react';
import { scoreAnswer, type PerformanceTier } from '../../../lib/gamification/scoring';
import {
  runToZone, rideTotal, QUESTIONS_PER_RUN, type RingZone,
} from '../../../lib/gamification/alkaRules';
import { getAlkaBest, recordAlkaBest } from '../../../lib/gamification/alkaBest';
import type { GameQuestion } from '../../../lib/gamification/exerciseSource';

export interface UseAlkaRide {
  status: 'playing' | 'result';
  runIndex: number;
  questionInRun: number;
  current: GameQuestion;
  combo: number;
  score: number; // running point score
  aim: number; // 0..1 for the ring reticle
  runZones: RingZone[];
  total: number;
  isNewBest: boolean;
  previousBest: number;
  answer: (optionIndex: number, responseMs: number) => void;
  reset: () => void;
}

export function useAlkaRide({
  questions,
  onXp,
}: {
  questions: GameQuestion[];
  onXp: (xp: number) => void;
}): UseAlkaRide {
  const previousBest = useMemo(() => getAlkaBest(), []);
  const [idx, setIdx] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [aim, setAim] = useState(0);
  const [runTiers, setRunTiers] = useState<PerformanceTier[]>([]);
  const [runZones, setRunZones] = useState<RingZone[]>([]);
  const [status, setStatus] = useState<'playing' | 'result'>('playing');
  const [total, setTotal] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const answer = useCallback(
    (optionIndex: number, responseMs: number) => {
      if (status === 'result') return;
      const q = questions[idx]!;
      const correct = optionIndex === q.correctIndex;
      const r = scoreAnswer({ correct, responseMs, combo });
      setCombo(r.combo);
      setScore((s) => s + r.points);
      setAim((a) => (correct ? Math.min(1, a + 0.34) : 0));

      const nextTiers = [...runTiers, r.tier];
      const finishedRun = nextTiers.length >= QUESTIONS_PER_RUN;

      if (finishedRun) {
        const zone = runToZone(nextTiers);
        const nextZones = [...runZones, zone];
        setRunZones(nextZones);
        setRunTiers([]);
        setAim(0);
        const isLastRun = nextZones.length >= 3;
        if (isLastRun) {
          const t = rideTotal(nextZones);
          setTotal(t);
          setIsNewBest(recordAlkaBest(t));
          onXp(score + r.points); // award accumulated points as XP
          setStatus('result');
          return;
        }
      } else {
        setRunTiers(nextTiers);
      }
      setIdx((i) => i + 1);
    },
    [status, questions, idx, combo, runTiers, runZones, score, onXp],
  );

  const reset = useCallback(() => {
    setIdx(0); setCombo(0); setScore(0); setAim(0);
    setRunTiers([]); setRunZones([]); setTotal(0); setIsNewBest(false);
    setStatus('playing');
  }, []);

  return {
    status,
    runIndex: runZones.length,
    questionInRun: runTiers.length,
    current: questions[Math.min(idx, questions.length - 1)]!,
    combo,
    score,
    aim,
    runZones,
    total,
    isNewBest,
    previousBest,
    answer,
    reset,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/useAlkaRide.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/alka/useAlkaRide.ts src/tests/useAlkaRide.test.ts
git commit -m "feat(gamification): Alka ride state machine hook"
```

---

## Task 8: Alka screen (orchestrator)

**Files:**
- Create: `src/components/practice/alka/AlkaScreen.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/practice/alka/AlkaScreen.tsx
import React, { useMemo, useRef, useState } from 'react';
import ScreenHeader from '../../shared/ScreenHeader';
import AlkaRing from './AlkaRing';
import AlkaResult from './AlkaResult';
import { useAlkaRide } from './useAlkaRide';
import { selectQuestions } from '../../../lib/gamification/exerciseSource';
import { useStats } from '../../../context/StatsContext';

export default function AlkaScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats } = useStats();
  const questions = useMemo(
    () => selectQuestions({ xp: stats.xp, lc: stats.lc, gc: stats.gc, count: 9 }),
    [stats.xp, stats.lc, stats.gc],
  );
  const ride = useAlkaRide({
    questions,
    onXp: (xp) => award?.(xp, true, 'alka_ride'),
  });
  const startedAt = useRef<number>(performance.now());
  const [picked, setPicked] = useState<number | null>(null);

  if (questions.length < 9) {
    return (
      <div style={shell}>
        <ScreenHeader title="Alka" goBack={goBack} />
        <p style={{ color: '#fff', padding: 20, textAlign: 'center' }}>
          Not enough exercises available right now. Try again later.
        </p>
      </div>
    );
  }

  if (ride.status === 'result') {
    return (
      <div style={shell}>
        <ScreenHeader title="Sinjska Alka" goBack={goBack} />
        <AlkaResult
          total={ride.total}
          isNewBest={ride.isNewBest}
          previousBest={ride.previousBest}
          onPlayAgain={() => {
            ride.reset();
            startedAt.current = performance.now();
          }}
          onExit={goBack}
        />
      </div>
    );
  }

  const q = ride.current;
  const onPick = (i: number) => {
    setPicked(i);
    const ms = performance.now() - startedAt.current;
    // brief pause so the reticle animates, then advance
    window.setTimeout(() => {
      ride.answer(i, ms);
      setPicked(null);
      startedAt.current = performance.now();
    }, 400);
  };

  return (
    <div style={shell}>
      <ScreenHeader title="Sinjska Alka" goBack={goBack} pill={`Run ${ride.runIndex + 1}/3`} />
      <div style={{ padding: 16, color: '#fff' }}>
        <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(200,152,10,.9)', fontWeight: 800 }}>
          Nišani — Take aim · Sinj, 1715
        </div>
        <AlkaRing aim={ride.aim} />
        <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 900, color: '#FFE070', fontVariantNumeric: 'tabular-nums' }}>
          {ride.score} {ride.combo > 1 ? `· 🔥×${ride.combo}` : ''}
        </div>
        <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 14, marginTop: 8 }}>
          <div style={{ color: '#FFE070', fontWeight: 800, fontSize: 16 }}>{q.prompt}</div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={picked !== null}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: picked === i ? 'rgba(34,197,94,.22)' : 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 9,
                padding: '9px 12px',
                marginTop: 8,
                color: '#fff',
                fontSize: 14,
                cursor: picked === null ? 'pointer' : 'default',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
};
```

> Verify the `useStats` import path and that `stats.xp/lc/gc` exist (confirmed in StatsContext). Verify `ScreenHeader` accepts `pill`.

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/practice/alka/AlkaScreen.tsx
git commit -m "feat(gamification): Alka mode screen orchestrator"
```

---

## Task 9: Arcade hub (entry screen)

**Files:**
- Create: `src/components/practice/ArcadeHub.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/practice/ArcadeHub.tsx
import React from 'react';
import ScreenHeader from '../shared/ScreenHeader';

interface ModeTile {
  id: string;
  icon: string;
  title: string;
  sub: string;
  live: boolean;
}

const MODES: ModeTile[] = [
  { id: 'alka', icon: '🐎', title: 'Alka', sub: 'Lance & ring · chase 9/9', live: true },
  { id: 'boss', icon: '⚔️', title: 'Boss Battle', sub: 'Folklore combat', live: false },
  { id: 'survival', icon: '♾️', title: 'Survival Run', sub: '3 hearts, endless', live: false },
  { id: 'forge', icon: '🧩', title: 'Sentence Forge', sub: 'Case puzzle', live: false },
  { id: 'duel', icon: '🛡️', title: 'Sibling Duel', sub: 'Coming soon', live: false },
];

export default function ArcadeHub({
  goBack,
  onLaunch,
}: {
  goBack: () => void;
  onLaunch: (modeId: string) => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
      }}
    >
      <ScreenHeader title="Arcade" goBack={goBack} />
      <div style={{ padding: 16 }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => m.live && onLaunch(m.id)}
            disabled={!m.live}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              background: m.live ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${m.live ? 'rgba(200,152,10,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              color: '#fff',
              opacity: m.live ? 1 : 0.55,
              cursor: m.live ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 24 }}>{m.icon}</span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>{m.title}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.55)' }}>
                {m.live ? m.sub : 'Coming soon'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/practice/ArcadeHub.tsx
git commit -m "feat(gamification): Arcade hub entry screen"
```

---

## Task 10: Route the Arcade + Alka screens in AppRouter

**Files:**
- Modify: `src/components/AppRouter.tsx`

- [ ] **Step 1: Add lazy imports**

Near the other `lazyWithReload` screen declarations (around line 72-76, by the other practice screens), add:

```typescript
const ArcadeHub = lazyWithReload(() => import('./practice/ArcadeHub'));
const AlkaScreen = lazyWithReload(() => import('./practice/alka/AlkaScreen'));
```

- [ ] **Step 2: Add the route blocks**

Find an existing practice route block (e.g. the `currentScreen === 'mcgame'` block around line 900). Add alongside it (inside the same render region) — note `setScr` and `goBack` and `award` are already in scope there (used by McGame):

```tsx
{currentScreen === 'arcade' && (
  <ScreenErrorBoundary key="arcade" name="arcade">
    <ArcadeHub goBack={goBack} onLaunch={(modeId) => setScr(modeId)} />
  </ScreenErrorBoundary>
)}
{currentScreen === 'alka' && (
  <ScreenErrorBoundary key="alka" name="alka">
    <AlkaScreen goBack={goBack} award={award} />
  </ScreenErrorBoundary>
)}
```

> Confirm `setScr`, `goBack`, and `award` are in scope in this file (they are — `award` is passed to McGame, `goBack`/`setScr` drive navigation). If `setScr` is named differently, use the actual setter that assigns `currentScreen`.

- [ ] **Step 3: Verify type-check and build**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppRouter.tsx
git commit -m "feat(gamification): route Arcade and Alka screens"
```

---

## Task 11: Route guard test (no dead Arcade lessons)

**Files:**
- Create: `src/tests/arcade-routes.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/tests/arcade-routes.test.ts
/**
 * Guards Arcade game modes against the dead-lesson class (see session-routes.test.ts):
 * every Arcade screen id that ArcadeHub can launch MUST resolve to a real
 * AppRouter route, or the player lands on an empty page.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const routerSrc = readFileSync('src/components/AppRouter.tsx', 'utf8');
const ROUTED = new Set(
  [...routerSrc.matchAll(/currentScreen === '([^']+)'/g)].map((m) => m[1] as string),
);

// Every mode marked live:true in ArcadeHub must be routed.
const hubSrc = readFileSync('src/components/practice/ArcadeHub.tsx', 'utf8');
const LIVE_MODE_IDS = [...hubSrc.matchAll(/id:\s*'([^']+)'[^}]*live:\s*true/g)].map(
  (m) => m[1] as string,
);

describe('Arcade — no dead modes', () => {
  it('the Arcade hub itself is routed', () => {
    expect(ROUTED.has('arcade')).toBe(true);
  });

  it('found at least one live mode in the hub', () => {
    expect(LIVE_MODE_IDS.length).toBeGreaterThan(0);
    expect(LIVE_MODE_IDS).toContain('alka');
  });

  it('every live Arcade mode resolves to a real AppRouter route', () => {
    const dead = LIVE_MODE_IDS.filter((id) => !ROUTED.has(id));
    expect(dead, `dead Arcade mode(s) with no route: ${dead.join(', ')}`).toEqual([]);
  });
});
```

> Note: the regex in step 1 expects each MODES entry to have `id` before `live` on nearby lines. The MODES literal in Task 9 is written `{ id: 'alka', ..., live: true }` on one line, so this matches. If you reformat MODES multi-line, update the regex to be multiline (`/id:\s*'([^']+)'[\s\S]*?live:\s*true/g`) and re-run.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/tests/arcade-routes.test.ts`
Expected: PASS (arcade + alka are routed from Task 10).

- [ ] **Step 3: Commit**

```bash
git add src/tests/arcade-routes.test.ts
git commit -m "test(gamification): guard Arcade modes against dead routes"
```

---

## Task 12: Prominent Arcade entry on the Practice tab

**Files:**
- Modify: `src/components/practice/PracticeTab.tsx`

- [ ] **Step 1: Find the top of the tab's rendered content**

Open `src/components/practice/PracticeTab.tsx`. Identify the component's return JSX and the **first** child inside the main scroll container (the very top of the tab). The Arcade card must render ABOVE the existing practice content (constraint: not buried).

Confirm how navigation is triggered in this file — find the existing prop/callback used to change screens (look for `setScr`, `sCurEx`, or an `onSelect`/`launch` prop in the component's props). Use that same mechanism.

- [ ] **Step 2: Add the entry card as the first child**

Insert at the very top of the tab's content (replace `setScr` below with the actual navigation function found in Step 1):

```tsx
{/* Arcade — prominent top entry (gamification G1). Not buried. */}
<button
  onClick={() => setScr('arcade')}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    textAlign: 'left',
    background:
      'linear-gradient(135deg, rgba(200,152,10,.22), rgba(10,35,72,.4))',
    border: '1px solid rgba(200,152,10,.5)',
    borderRadius: 16,
    padding: '14px 16px',
    marginBottom: 16,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,.3)',
  }}
>
  <span style={{ fontSize: 28 }}>🐎</span>
  <span>
    <span style={{ display: 'block', fontWeight: 900, fontSize: 16 }}>Arcade</span>
    <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
      Play Croatian as a game — ride the Alka
    </span>
  </span>
</button>
```

- [ ] **Step 3: Verify type-check + run the full unit suite**

Run: `npx tsc -p tsconfig.json --noEmit`
Run: `npx vitest run`
Expected: type-check clean; all tests pass (including the new gamification + guard tests).

- [ ] **Step 4: Commit**

```bash
git add src/components/practice/PracticeTab.tsx
git commit -m "feat(gamification): prominent Arcade entry at top of Practice tab"
```

---

## Task 13: Final verification gate

- [ ] **Step 1: Full local gate**

```bash
npx tsc -p tsconfig.json --noEmit
npx vitest run
npx eslint . --max-warnings=0
```
Expected: all clean. In particular confirm no new file trips `max-lines` (all new files are well under 800 lines).

- [ ] **Step 2: Manual smoke (dev server)**

```bash
npm run dev
```
Open the app → Practice tab → confirm the **Arcade** card is at the top → tap it → tap **Alka** → play a 9-question ride → confirm the ring reticle tightens on correct/fast answers, the score/combo update, the result shows `N / 9`, "U sridu!" appears on a 9, and a new personal best is recorded (replay shows the higher "Your best").

- [ ] **Step 3: Confirm no regressions to the existing dead-lesson guard**

Run: `npx vitest run src/tests/session-routes.test.ts src/tests/arcade-routes.test.ts`
Expected: PASS.

- [ ] **Step 4: Push (only after CI-safe spacing per project discipline)**

```bash
git push origin master
```
Then confirm green: `gh run list --limit 1` → `gh run view <id> --json conclusion`.

---

## Self-Review (against the spec)

**Spec coverage (this plan's scope = G1 minus Map):**
- §2 game modes / Arcade hub → Tasks 9, 12 (hub + prominent entry; 4 modes shown "coming soon").
- §2.1 Alka (3 runs → 9, u-sridu, skill→aim) → Tasks 2, 5, 7, 8.
- §4 scoring engine (combo, speed, tier, pure/testable) → Task 1.
- §5.1 routing + reuse existing exercises + XP via `award()` → Tasks 3, 8, 10.
- §5.4 premium register / no kiddy skin → enforced in Tasks 5,6,8,9,12 styles.
- §6 prominent placement (not buried) → Task 12 (top of Practice tab).
- §8 testing (pure unit tests, route guard, full gate) → Tasks 1-3, 7, 11, 13.
- Progress protection (best only increases) → Task 4.
- **Deferred (own plans):** Map of Croatia §3 → G1b. GameShell/ModeAdapter §5.2 → G2. Async duels §5.3 → G3. These are explicitly out of this plan's scope.

**Placeholder scan:** No TBD/TODO; every code step has full code. Two flagged verification points (the `EXERCISES` export name in Task 3; `renderHook` availability in Task 7) include explicit fallback instructions, not placeholders.

**Type consistency:** `PerformanceTier`, `AnswerInput/Result`, `RingZone`, `GameQuestion` defined once (Tasks 1-3) and imported consistently in Tasks 5-8. `recordAlkaBest`/`getAlkaBest` (Task 4) used in Task 7. `selectQuestions` signature (Task 3) matches its call in Task 8. `award(xp, celebrate?, activityType?)` matches the StatsContext signature from the codebase analysis.
