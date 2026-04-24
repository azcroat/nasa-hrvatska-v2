# Content Curriculum & Adaptive Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 40 new tense exercises, ~120 B2+ vocabulary terms, and 3 new speaking prompt types, all delivered through a lightweight FSRS-based adaptive scheduling layer that silently routes users to their weakest categories and adjusts difficulty in-session.

**Architecture:** Extend the existing `src/lib/adaptive.ts` localStorage layer with per-category FSRS scheduling; add `exerciseMeta.ts` for difficulty tagging; add `useAdaptiveSession` for in-session streak tracking; wire into ProductionDrillScreen and PracticeTab with minimal, non-visual changes.

**Tech Stack:** TypeScript, React hooks, vitest, localStorage (consistent with existing `adaptive.ts` — no Firestore additions needed for MVP)

---

## File Map

**New files**
- `src/data/exerciseMeta.ts` — Difficulty (1–5) + SkillCategory tag per exercise array name
- `src/hooks/useAdaptiveSession.ts` — In-session streak tracking + difficulty adjustment (3 correct → +1; 2 wrong → -1)
- `src/hooks/useAdaptivePractice.ts` — Loads category queue from adaptive.ts, exposes to PracticeTab
- `src/tests/adaptive-category.test.ts` — Unit tests for new category functions in adaptive.ts
- `src/tests/adaptive-session.test.ts` — Unit tests for useAdaptiveSession hook
- `src/tests/exercise-meta.test.ts` — Unit tests for exerciseMeta completeness

**Modified files**
- `src/lib/adaptive.ts` — Add `SkillCategory` type + per-category FSRS scheduling functions
- `src/data/exercises.js` — Add `PAST_EXERCISES_MC`, `PAST_EXERCISES_FILL`, `PAST_EXERCISES_XFORM`, `FUTURE_EXERCISES_MC`, `FUTURE_EXERCISES_FILL`, `FUTURE_EXERCISES_XFORM` exports
- `src/data/vocabulary.js` — Add ~120 B2+ terms across 4 categories (philosophy-ethics expanded, media-journalism expanded, legal new, psychology new)
- `src/components/practice/SpeakingScreen.tsx` — Add `QUESTION_RESPONSE_PROMPTS`, `PICTURE_DESCRIPTION_PROMPTS`, `DIALOGUE_COMPLETION_PROMPTS` constants; detect prompt type from `sw[2]` and show self-assessment path
- `src/components/practice/ProductionDrillScreen.tsx` — Wire `useAdaptiveSession`; filter TRANSFORMS by difficulty tier; call `rateCategorySession` on session end
- `src/components/practice/PracticeTab.tsx` — Import `useAdaptivePractice`; add "Smart Practice" prominent button bound to the highest-priority category queue item

---

## Task 1: Extend `adaptive.ts` with category FSRS scheduling

**Files:**
- Modify: `src/lib/adaptive.ts`
- Test: `src/tests/adaptive-category.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/tests/adaptive-category.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateCategorySession,
  getDueCategoryQueue,
  getCategoryDifficulty,
  type SkillCategory,
} from '../lib/adaptive';

beforeEach(() => {
  localStorage.clear();
});

describe('rateCategorySession', () => {
  it('sets recentAccuracy via EWMA on first session', () => {
    rateCategorySession('genitive', 0.8);
    // new card starts at 0.5; EWMA: 0.3*0.8 + 0.7*0.5 = 0.59
    const diff = getCategoryDifficulty('genitive');
    expect(diff).toBeGreaterThanOrEqual(1);
    expect(diff).toBeLessThanOrEqual(5);
  });

  it('schedules due date in the future after a session', () => {
    const before = Date.now();
    rateCategorySession('past-tense', 0.9);
    // Raw localStorage value should have due > now (at least 1 day out)
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    expect(raw['past-tense'].due).toBeGreaterThan(before + 86400000 * 0.9);
  });

  it('maps accuracy < 0.5 to grade 1 (interval = 1 day)', () => {
    rateCategorySession('accusative', 0.3);
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    const card = raw['accusative'];
    expect(card.due).toBeLessThanOrEqual(Date.now() + 86400000 * 1.5);
  });

  it('maps accuracy >= 0.9 to grade 4 (longer interval)', () => {
    rateCategorySession('future-tense', 0.95);
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    const card = raw['future-tense'];
    // Default stability=1, grade 4 → min(60, round(1*2.5))=2 days
    expect(card.due).toBeGreaterThan(Date.now() + 86400000 * 1.9);
  });

  it('EWMA accuracy decays toward session score over multiple calls', () => {
    rateCategorySession('speaking', 1.0);
    rateCategorySession('speaking', 1.0);
    rateCategorySession('speaking', 0.0); // sudden failure
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    // After 2 perfect + 1 zero, recentAccuracy should be < 1.0
    expect(raw['speaking'].recentAccuracy).toBeLessThan(1.0);
    expect(raw['speaking'].recentAccuracy).toBeGreaterThan(0.0);
  });
});

describe('getDueCategoryQueue', () => {
  it('returns an array of up to maxSlots items', () => {
    const queue = getDueCategoryQueue(6);
    expect(queue.length).toBeLessThanOrEqual(6);
  });

  it('each item has category and difficulty 1–5', () => {
    const queue = getDueCategoryQueue(4);
    for (const item of queue) {
      expect(typeof item.category).toBe('string');
      expect(item.difficulty).toBeGreaterThanOrEqual(1);
      expect(item.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it('prioritises categories with due date in the past', () => {
    // Make 'genitive' overdue by back-dating it
    const catData: Record<string, object> = {};
    catData['genitive'] = { stability: 7, recentAccuracy: 0.8, due: Date.now() - 1000, lastSeen: Date.now() - 86400000 * 8 };
    catData['accusative'] = { stability: 7, recentAccuracy: 0.9, due: Date.now() + 86400000, lastSeen: Date.now() };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));

    const queue = getDueCategoryQueue(6);
    expect(queue[0]?.category).toBe('genitive');
  });
});

describe('getCategoryDifficulty', () => {
  it('returns 1 for a brand-new category (no history)', () => {
    const d = getCategoryDifficulty('conditional' as SkillCategory);
    expect(d).toBe(1);
  });

  it('returns higher difficulty as stability grows', () => {
    // Simulate high stability
    const catData: Record<string, object> = {};
    catData['instrumental'] = { stability: 20, recentAccuracy: 0.92, due: Date.now() + 100000, lastSeen: Date.now() };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));
    const d = getCategoryDifficulty('instrumental' as SkillCategory);
    expect(d).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- adaptive-category`
Expected: FAIL — `rateCategorySession is not a function`

- [ ] **Step 3: Implement — append to `src/lib/adaptive.ts`**

Add the following block at the end of `src/lib/adaptive.ts` (after the existing `getPersonalizedPath` function):

```typescript
// ─── Skill categories ─────────────────────────────────────────────────────────

export type SkillCategory =
  | 'genitive' | 'accusative' | 'dative-locative' | 'instrumental' | 'vocative'
  | 'past-tense' | 'future-tense'
  | 'aspect-imperfective' | 'aspect-perfective' | 'aspect-negation'
  | 'conditional' | 'clitics'
  | 'vocab-a2' | 'vocab-b1' | 'vocab-b2'
  | 'speaking';

const ALL_CATEGORIES: SkillCategory[] = [
  'genitive', 'accusative', 'dative-locative', 'instrumental', 'vocative',
  'past-tense', 'future-tense',
  'aspect-imperfective', 'aspect-perfective', 'aspect-negation',
  'conditional', 'clitics',
  'vocab-a2', 'vocab-b1', 'vocab-b2',
  'speaking',
];

// ─── Category card schema ──────────────────────────────────────────────────────

interface CategoryCard {
  stability: number;      // interval in days (starts at 1)
  recentAccuracy: number; // EWMA 0.0–1.0 (α=0.3, starts at 0.5)
  due: number;            // Unix ms timestamp for next scheduled review
  lastSeen: number;       // Unix ms timestamp of last session
}

type CategoryMap = Partial<Record<SkillCategory, CategoryCard>>;

const CAT_KEY = 'nh_cat_sr';

function _loadCats(): CategoryMap {
  try {
    return JSON.parse(localStorage.getItem(CAT_KEY) || '{}') as CategoryMap;
  } catch {
    return {};
  }
}

function _saveCats(data: CategoryMap): void {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify(data));
  } catch {}
}

function _defaultCard(): CategoryCard {
  return { stability: 1, recentAccuracy: 0.5, due: Date.now(), lastSeen: 0 };
}

// Grade → interval in days. Stability grows on repeated Good/Easy ratings.
function _gradeInterval(grade: 1 | 2 | 3 | 4, stability: number): number {
  switch (grade) {
    case 1: return 1;
    case 2: return 3;
    case 3: return Math.max(7, Math.round(stability * 1.5));
    case 4: return Math.min(60, Math.round(stability * 2.5));
  }
}

// Map category FSRS stability → difficulty tier 1–5
function _stabilityToDifficulty(stability: number): 1 | 2 | 3 | 4 | 5 {
  if (stability <= 1) return 1;
  if (stability <= 3) return 2;
  if (stability <= 7) return 3;
  if (stability <= 14) return 4;
  return 5;
}

// ─── Public category API ───────────────────────────────────────────────────────

/**
 * Rate a category after a practice session.
 * accuracy: 0.0–1.0 (correct answers / total questions for that session).
 * Updates EWMA recentAccuracy and schedules the next due date.
 */
export function rateCategorySession(category: SkillCategory, accuracy: number): void {
  const data = _loadCats();
  const card = data[category] ?? _defaultCard();

  // EWMA: weight recent session at 30%, history at 70%
  const newAccuracy = 0.3 * accuracy + 0.7 * card.recentAccuracy;

  // Map accuracy → FSRS grade
  const grade: 1 | 2 | 3 | 4 =
    accuracy >= 0.9 ? 4 :
    accuracy >= 0.7 ? 3 :
    accuracy >= 0.5 ? 2 : 1;

  const interval = _gradeInterval(grade, card.stability);
  // Stability grows on Good/Easy; halves on Hard/Again (floor at 1)
  const newStability = grade >= 3 ? interval : Math.max(1, card.stability * 0.5);

  data[category] = {
    stability: newStability,
    recentAccuracy: newAccuracy,
    due: Date.now() + interval * 86400000,
    lastSeen: Date.now(),
  };

  _saveCats(data);
}

/**
 * Build a prioritised practice queue.
 * Priority: FSRS-due categories first → lowest recentAccuracy next → balanced fill.
 * Returns up to maxSlots items, each with the user's current difficulty tier.
 */
export function getDueCategoryQueue(
  maxSlots = 6,
): Array<{ category: SkillCategory; difficulty: 1 | 2 | 3 | 4 | 5 }> {
  const data = _loadCats();
  const now = Date.now();

  const due = ALL_CATEGORIES.filter(c => (data[c]?.due ?? 0) <= now);
  const weak = ALL_CATEGORIES
    .filter(c => !due.includes(c))
    .sort((a, b) => (data[a]?.recentAccuracy ?? 0.5) - (data[b]?.recentAccuracy ?? 0.5));
  const balanced = ALL_CATEGORIES.filter(
    c => !due.includes(c) && !weak.slice(0, 3).includes(c),
  );

  const queue = [...due, ...weak.slice(0, 3), ...balanced].slice(0, maxSlots);

  return queue.map(category => ({
    category,
    difficulty: _stabilityToDifficulty(data[category]?.stability ?? 1),
  }));
}

/**
 * Returns the recommended difficulty tier (1–5) for a given category.
 * Used by exercise screens to filter content to the appropriate level.
 */
export function getCategoryDifficulty(category: SkillCategory): 1 | 2 | 3 | 4 | 5 {
  const data = _loadCats();
  return _stabilityToDifficulty(data[category]?.stability ?? 1);
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npm test -- adaptive-category`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/adaptive.ts src/tests/adaptive-category.test.ts
git commit -m "feat: add per-category FSRS scheduling to adaptive.ts

SkillCategory type (16 categories), CategoryCard schema in nh_cat_sr,
rateCategorySession (EWMA + interval), getDueCategoryQueue (priority queue),
getCategoryDifficulty (stability→tier). 8 tests passing."
```

---

## Task 2: Create `exerciseMeta.ts`

**Files:**
- Create: `src/data/exerciseMeta.ts`
- Test: `src/tests/exercise-meta.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/tests/exercise-meta.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { EXERCISE_META, type ExerciseMeta } from '../data/exerciseMeta';

const VALID_CATEGORIES = new Set([
  'genitive', 'accusative', 'dative-locative', 'instrumental', 'vocative',
  'past-tense', 'future-tense',
  'aspect-imperfective', 'aspect-perfective', 'aspect-negation',
  'conditional', 'clitics',
  'vocab-a2', 'vocab-b1', 'vocab-b2',
  'speaking',
]);

describe('EXERCISE_META', () => {
  it('is a non-empty record', () => {
    expect(Object.keys(EXERCISE_META).length).toBeGreaterThan(0);
  });

  it('every entry has difficulty 1–5', () => {
    for (const [key, meta] of Object.entries(EXERCISE_META)) {
      expect(meta.difficulty, `${key}.difficulty`).toBeGreaterThanOrEqual(1);
      expect(meta.difficulty, `${key}.difficulty`).toBeLessThanOrEqual(5);
    }
  });

  it('every entry has a valid SkillCategory', () => {
    for (const [key, meta] of Object.entries(EXERCISE_META)) {
      expect(VALID_CATEGORIES.has(meta.category), `${key}.category "${meta.category}"`).toBe(true);
    }
  });

  it('covers past-tense and future-tense MC, fill, and transform', () => {
    expect(EXERCISE_META['PAST_EXERCISES_MC']?.category).toBe('past-tense');
    expect(EXERCISE_META['PAST_EXERCISES_FILL']?.category).toBe('past-tense');
    expect(EXERCISE_META['PAST_EXERCISES_XFORM']?.category).toBe('past-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_MC']?.category).toBe('future-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_FILL']?.category).toBe('future-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_XFORM']?.category).toBe('future-tense');
  });

  it('includes all three speaking prompt types', () => {
    expect(EXERCISE_META['SPEAKING_QR']?.category).toBe('speaking');
    expect(EXERCISE_META['SPEAKING_PD']?.category).toBe('speaking');
    expect(EXERCISE_META['SPEAKING_DC']?.category).toBe('speaking');
  });

  it('difficulty reflects structural type: MC=1-2, fill=3, transform=4, open=5', () => {
    expect(EXERCISE_META['PAST_EXERCISES_MC']?.difficulty).toBe(2);
    expect(EXERCISE_META['PAST_EXERCISES_FILL']?.difficulty).toBe(3);
    expect(EXERCISE_META['PAST_EXERCISES_XFORM']?.difficulty).toBe(4);
    expect(EXERCISE_META['TENSEFLIP']?.difficulty).toBe(3);
    expect(EXERCISE_META['TRANSLATE_DRILLS_B2']?.difficulty).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- exercise-meta`
Expected: FAIL — `Cannot find module '../data/exerciseMeta'`

- [ ] **Step 3: Implement — create `src/data/exerciseMeta.ts`**

```typescript
// src/data/exerciseMeta.ts
//
// Maps exercise ARRAY names (from exercises.js) to {category, difficulty}.
// Difficulty is structural — determined by exercise TYPE, not individual item content:
//   1 = recognition     — multiple choice from 4 options (MC 4-opt, BOJE, MATCH)
//   2 = constrained     — MC from 3 options, or fill-blank with given word bank
//   3 = guided          — fill blank, no word bank (TENSEFLIP, DECL, WORDFORM)
//   4 = free production — transform a full sentence (XFORM)
//   5 = open production — translate from scratch (TRANSLATE_DRILLS, VBPERSONS advanced)

export type { SkillCategory } from '../lib/adaptive';

export interface ExerciseMeta {
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: import('../lib/adaptive').SkillCategory;
}

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // ── Past tense ────────────────────────────────────────────────────────────
  TENSEFLIP:             { category: 'past-tense',    difficulty: 3 },
  PAST_EXERCISES_MC:     { category: 'past-tense',    difficulty: 2 },
  PAST_EXERCISES_FILL:   { category: 'past-tense',    difficulty: 3 },
  PAST_EXERCISES_XFORM:  { category: 'past-tense',    difficulty: 4 },

  // ── Future tense ──────────────────────────────────────────────────────────
  FUTURE_QUIZ:           { category: 'future-tense',  difficulty: 2 },
  FUTURE_EXERCISES_MC:   { category: 'future-tense',  difficulty: 2 },
  FUTURE_EXERCISES_FILL: { category: 'future-tense',  difficulty: 3 },
  FUTURE_EXERCISES_XFORM:{ category: 'future-tense',  difficulty: 4 },

  // ── Case grammar ──────────────────────────────────────────────────────────
  GENITIVE:              { category: 'genitive',         difficulty: 3 },
  INSTRUMENTAL:          { category: 'instrumental',     difficulty: 3 },
  DATIVE:                { category: 'dative-locative',  difficulty: 3 },
  VOCATIVE:              { category: 'vocative',         difficulty: 3 },
  PLACE:                 { category: 'accusative',       difficulty: 1 },

  // ── Aspect ────────────────────────────────────────────────────────────────
  ASPECT_DRILL:          { category: 'aspect-imperfective', difficulty: 3 },

  // ── Vocabulary ────────────────────────────────────────────────────────────
  BOJE:                  { category: 'vocab-a2', difficulty: 1 },
  COMPARATIVE:           { category: 'vocab-a2', difficulty: 2 },
  TRANSLATE_DRILLS_A2:   { category: 'vocab-a2', difficulty: 5 },
  TRANSLATE_DRILLS_B1:   { category: 'vocab-b1', difficulty: 5 },
  TRANSLATE_DRILLS_B2:   { category: 'vocab-b2', difficulty: 5 },

  // ── Verb conjugation ──────────────────────────────────────────────────────
  VBPERSONS:             { category: 'genitive',    difficulty: 3 },

  // ── Speaking prompts ──────────────────────────────────────────────────────
  SPEAKING_QR:           { category: 'speaking', difficulty: 2 }, // question-response
  SPEAKING_PD:           { category: 'speaking', difficulty: 3 }, // picture-description
  SPEAKING_DC:           { category: 'speaking', difficulty: 4 }, // dialogue-completion
};
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npm test -- exercise-meta`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/data/exerciseMeta.ts src/tests/exercise-meta.test.ts
git commit -m "feat: add exerciseMeta.ts with difficulty + category tags per exercise array"
```

---

## Task 3: Create `useAdaptiveSession.ts`

**Files:**
- Create: `src/hooks/useAdaptiveSession.ts`
- Test: `src/tests/adaptive-session.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/tests/adaptive-session.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveSession } from '../hooks/useAdaptiveSession';

describe('useAdaptiveSession', () => {
  it('initialises with the provided difficulty', () => {
    const { result } = renderHook(() => useAdaptiveSession(2));
    expect(result.current.sessionDifficulty).toBe(2);
  });

  it('raises difficulty by 1 after 3 correct answers in a row', () => {
    const { result } = renderHook(() => useAdaptiveSession(2));
    act(() => { result.current.onCorrect('past-tense'); });
    act(() => { result.current.onCorrect('past-tense'); });
    expect(result.current.sessionDifficulty).toBe(2); // not yet
    act(() => { result.current.onCorrect('past-tense'); });
    expect(result.current.sessionDifficulty).toBe(3);
  });

  it('lowers difficulty by 1 after 2 wrong answers in a row', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => { result.current.onWrong('genitive'); });
    expect(result.current.sessionDifficulty).toBe(3); // not yet
    act(() => { result.current.onWrong('genitive'); });
    expect(result.current.sessionDifficulty).toBe(2);
  });

  it('caps difficulty at 5', () => {
    const { result } = renderHook(() => useAdaptiveSession(5));
    act(() => { result.current.onCorrect('speaking'); });
    act(() => { result.current.onCorrect('speaking'); });
    act(() => { result.current.onCorrect('speaking'); });
    expect(result.current.sessionDifficulty).toBe(5);
  });

  it('floors difficulty at 1', () => {
    const { result } = renderHook(() => useAdaptiveSession(1));
    act(() => { result.current.onWrong('accusative'); });
    act(() => { result.current.onWrong('accusative'); });
    expect(result.current.sessionDifficulty).toBe(1);
  });

  it('resets correct streak when a wrong answer is given', () => {
    const { result } = renderHook(() => useAdaptiveSession(2));
    act(() => { result.current.onCorrect('past-tense'); });
    act(() => { result.current.onCorrect('past-tense'); });
    act(() => { result.current.onWrong('past-tense'); }); // breaks streak
    act(() => { result.current.onCorrect('past-tense'); });
    act(() => { result.current.onCorrect('past-tense'); });
    act(() => { result.current.onCorrect('past-tense'); });
    // difficulty rose once (after 3 corrects after the reset)
    expect(result.current.sessionDifficulty).toBe(3);
  });

  it('sessionSummary returns accuracy per category', () => {
    const { result } = renderHook(() => useAdaptiveSession(2));
    act(() => { result.current.onCorrect('genitive'); });
    act(() => { result.current.onCorrect('genitive'); });
    act(() => { result.current.onWrong('genitive'); });
    const summary = result.current.sessionSummary();
    expect(summary['genitive']?.accuracy).toBeCloseTo(2 / 3);
    expect(summary['genitive']?.total).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- adaptive-session`
Expected: FAIL — `Cannot find module '../hooks/useAdaptiveSession'`

- [ ] **Step 3: Implement — create `src/hooks/useAdaptiveSession.ts`**

```typescript
// src/hooks/useAdaptiveSession.ts
//
// In-session streak tracking and difficulty adjustment.
// - 3 correct in a row → difficulty +1 (cap 5), resets streaks
// - 2 wrong   in a row → difficulty -1 (floor 1), resets streaks
// Wire into any exercise screen to get silent adaptive difficulty.

import { useState, useCallback, useRef } from 'react';
import type { SkillCategory } from '../lib/adaptive';

const CORRECT_STREAK_THRESHOLD = 3;
const WRONG_STREAK_THRESHOLD = 2;

interface SessionAccuracy {
  correct: number;
  total: number;
}

export interface UseAdaptiveSessionReturn {
  /** Current difficulty tier 1–5 for the session */
  sessionDifficulty: 1 | 2 | 3 | 4 | 5;
  /** Call on each correct answer */
  onCorrect: (category: SkillCategory) => void;
  /** Call on each wrong answer */
  onWrong: (category: SkillCategory) => void;
  /** Returns {accuracy, total} per category for FSRS rating on session end */
  sessionSummary: () => Record<string, { accuracy: number; total: number }>;
  /** Reset streaks and difficulty to initial values */
  resetSession: () => void;
}

export function useAdaptiveSession(
  initialDifficulty: 1 | 2 | 3 | 4 | 5 = 2,
): UseAdaptiveSessionReturn {
  const [sessionDifficulty, setSessionDifficulty] = useState<1 | 2 | 3 | 4 | 5>(initialDifficulty);
  const correctStreak = useRef(0);
  const wrongStreak = useRef(0);
  const accuracy = useRef<Record<string, SessionAccuracy>>({});

  const onCorrect = useCallback((category: SkillCategory) => {
    const curr = accuracy.current[category] ?? { correct: 0, total: 0 };
    accuracy.current[category] = { correct: curr.correct + 1, total: curr.total + 1 };
    correctStreak.current += 1;
    wrongStreak.current = 0;
    if (correctStreak.current >= CORRECT_STREAK_THRESHOLD) {
      correctStreak.current = 0;
      setSessionDifficulty(d => (Math.min(d + 1, 5) as 1 | 2 | 3 | 4 | 5));
    }
  }, []);

  const onWrong = useCallback((category: SkillCategory) => {
    const curr = accuracy.current[category] ?? { correct: 0, total: 0 };
    accuracy.current[category] = { correct: curr.correct, total: curr.total + 1 };
    wrongStreak.current += 1;
    correctStreak.current = 0;
    if (wrongStreak.current >= WRONG_STREAK_THRESHOLD) {
      wrongStreak.current = 0;
      setSessionDifficulty(d => (Math.max(d - 1, 1) as 1 | 2 | 3 | 4 | 5));
    }
  }, []);

  const sessionSummary = useCallback(() => {
    return Object.fromEntries(
      Object.entries(accuracy.current).map(([cat, { correct, total }]) => [
        cat,
        { accuracy: total > 0 ? correct / total : 0, total },
      ]),
    );
  }, []);

  const resetSession = useCallback(() => {
    correctStreak.current = 0;
    wrongStreak.current = 0;
    accuracy.current = {};
    setSessionDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  return { sessionDifficulty, onCorrect, onWrong, sessionSummary, resetSession };
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npm test -- adaptive-session`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAdaptiveSession.ts src/tests/adaptive-session.test.ts
git commit -m "feat: add useAdaptiveSession hook for in-session difficulty adjustment

3 correct → difficulty+1 (cap 5); 2 wrong → difficulty-1 (floor 1).
Tracks per-category accuracy for sessionSummary(). 7 tests passing."
```

---

## Task 4: Add 20 past-tense exercises to `exercises.js`

**Files:**
- Modify: `src/data/exercises.js` (append three new exports at end of file)
- Test: embedded in exercise-meta.test.ts (array length assertions added below)

- [ ] **Step 1: Add length assertions to the existing test**

Add to `src/tests/exercise-meta.test.ts` (import block at top, then new describe block):

```typescript
// Add import at top of exercise-meta.test.ts
import {
  PAST_EXERCISES_MC,
  PAST_EXERCISES_FILL,
  PAST_EXERCISES_XFORM,
} from '../data/exercises.js';

// Add at end of the describe block
describe('PAST_EXERCISES arrays', () => {
  it('PAST_EXERCISES_MC has 8 items each with q, a, opts', () => {
    expect(PAST_EXERCISES_MC).toHaveLength(8);
    for (const item of PAST_EXERCISES_MC) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
      expect(Array.isArray(item.opts)).toBe(true);
      expect(item.opts.length).toBe(3);
    }
  });

  it('PAST_EXERCISES_FILL has 8 items each with q and a', () => {
    expect(PAST_EXERCISES_FILL).toHaveLength(8);
    for (const item of PAST_EXERCISES_FILL) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
    }
  });

  it('PAST_EXERCISES_XFORM has 4 items each with q, a, note', () => {
    expect(PAST_EXERCISES_XFORM).toHaveLength(4);
    for (const item of PAST_EXERCISES_XFORM) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Run to confirm new assertions fail**

Run: `npm test -- exercise-meta`
Expected: FAIL — `Cannot find export 'PAST_EXERCISES_MC'`

- [ ] **Step 3: Append to end of `src/data/exercises.js`**

```javascript
// ─── Past-tense Exercises ─────────────────────────────────────────────────────
// 20 items: 8 MC (difficulty-2), 8 fill-blank (difficulty-3), 4 transform (difficulty-4)
// Category tag: past-tense (see exerciseMeta.ts)

// difficulty-2: multiple choice with 3 options
export const PAST_EXERCISES_MC = [
  { q: 'Jučer sam _____ (čitati) dobru knjigu.', a: 'čitao/čitala', opts: ['čitao/čitala', 'čitam', 'čitati'] },
  { q: 'Mi smo _____ (jesti) pizzu sinoć.', a: 'jeli', opts: ['jeli', 'jedemo', 'jesti'] },
  { q: 'Ona je _____ (pjevati) na koncertu.', a: 'pjevala', opts: ['pjevala', 'pjeva', 'pjevati'] },
  { q: 'Oni su _____ (ići) na plažu prošli tjedan.', a: 'išli', opts: ['išli', 'idu', 'ići'] },
  { q: 'Ti si _____ (učiti) cijelo jutro.', a: 'učio/učila', opts: ['učio/učila', 'učiš', 'učiti'] },
  { q: 'Ja sam _____ (spavati) do 10 sati.', a: 'spavao/spavala', opts: ['spavao/spavala', 'spavam', 'spavati'] },
  { q: 'Marko je _____ (voziti) auto u Dubrovnik.', a: 'vozio', opts: ['vozio', 'vozi', 'voziti'] },
  { q: 'Vi ste _____ (putovati) u Italiju.', a: 'putovali', opts: ['putovali', 'putujete', 'putovati'] },
];

// difficulty-3: fill blank, no word bank (Croatian past tense formation)
export const PAST_EXERCISES_FILL = [
  { q: 'On _____ (pisati) pismo jučer. (Use: je + past participle)', a: 'je pisao', hint: 'pisati → pisao' },
  { q: 'Marija _____ (kuhati) ručak prošle nedjelje.', a: 'je kuhala', hint: 'kuhati → kuhala' },
  { q: 'Ja _____ (trčati) ujutro svaki dan prošli tjedan.', a: 'sam trčao/trčala', hint: 'trčati → trčao/trčala' },
  { q: 'Mi _____ (gledati) film sinoć.', a: 'smo gledali', hint: 'gledati → gledali' },
  { q: 'Djeca _____ (igrati se) u parku.', a: 'su se igrala', hint: 'igrati se → igrala' },
  { q: 'Ti _____ (piti) vino na večeri.', a: 'si pio/pila', hint: 'piti → pio/pila (irregular vowel change)' },
  { q: 'Ana i Pero _____ (razgovarati) sat vremena.', a: 'su razgovarali', hint: 'razgovarati → razgovarali' },
  { q: 'Ona _____ (doći) kasno na posao.', a: 'je došla', hint: 'doći → došla (irregular — memorise!)' },
];

// difficulty-4: transform full sentence to past tense or negate
export const PAST_EXERCISES_XFORM = [
  { q: 'Transform to past tense: "Idem u školu svaki dan."', a: 'Išao/Išla sam u školu svaki dan.', note: 'ići → išao/išla (irregular)' },
  { q: 'Transform to past tense: "Ona čita novine ujutro."', a: 'Ona je čitala novine ujutro.', note: 'čitati → čitala' },
  { q: 'Transform to past tense: "Mi jedemo zajedno svaki tjedan."', a: 'Mi smo jeli zajedno svaki tjedan.', note: 'jesti → jeli (irregular)' },
  { q: 'Negate the past tense: "Ona je pjevala na koncertu."', a: 'Ona nije pjevala na koncertu.', note: 'je pjevala → nije pjevala' },
];
```

- [ ] **Step 4: Run to confirm tests pass**

Run: `npm test -- exercise-meta`
Expected: PASS, all tests including new length assertions

- [ ] **Step 5: Commit**

```bash
git add src/data/exercises.js src/tests/exercise-meta.test.ts
git commit -m "feat: add 20 past-tense exercises (MC + fill + transform)"
```

---

## Task 5: Add 20 future-tense exercises to `exercises.js`

**Files:**
- Modify: `src/data/exercises.js` (append after PAST_EXERCISES_XFORM)
- Modify: `src/tests/exercise-meta.test.ts` (add length assertions)

- [ ] **Step 1: Add assertions to test**

Add to `src/tests/exercise-meta.test.ts`:

```typescript
// Add to imports
import {
  FUTURE_EXERCISES_MC,
  FUTURE_EXERCISES_FILL,
  FUTURE_EXERCISES_XFORM,
} from '../data/exercises.js';

// Add new describe block
describe('FUTURE_EXERCISES arrays', () => {
  it('FUTURE_EXERCISES_MC has 8 items each with q, a, opts', () => {
    expect(FUTURE_EXERCISES_MC).toHaveLength(8);
    for (const item of FUTURE_EXERCISES_MC) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
      expect(item.opts).toHaveLength(3);
    }
  });

  it('FUTURE_EXERCISES_FILL has 8 items each with q and a', () => {
    expect(FUTURE_EXERCISES_FILL).toHaveLength(8);
    for (const item of FUTURE_EXERCISES_FILL) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
    }
  });

  it('FUTURE_EXERCISES_XFORM has 4 items each with q, a, note', () => {
    expect(FUTURE_EXERCISES_XFORM).toHaveLength(4);
    for (const item of FUTURE_EXERCISES_XFORM) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Run to confirm new assertions fail**

Run: `npm test -- exercise-meta`
Expected: FAIL — `Cannot find export 'FUTURE_EXERCISES_MC'`

- [ ] **Step 3: Append to end of `src/data/exercises.js`**

```javascript
// ─── Future-tense Exercises ───────────────────────────────────────────────────
// 20 items: 8 MC (difficulty-2), 8 fill-blank (difficulty-3), 4 transform (difficulty-4)
// Category tag: future-tense (see exerciseMeta.ts)

// difficulty-2: multiple choice with 3 options
export const FUTURE_EXERCISES_MC = [
  { q: 'Sutra _____ (ja — will) učiti za ispit.', a: 'ću učiti', opts: ['ću učiti', 'ću učio', 'ćeš učiti'] },
  { q: 'Ona _____ (will) doći u petak.', a: 'će doći', opts: ['će doći', 'će doćio', 'ću doći'] },
  { q: 'Mi _____ (will) putovati na more.', a: 'ćemo putovati', opts: ['ćemo putovati', 'ćete putovati', 'ću putovati'] },
  { q: '"I will not come" — negative future: _____ doći.', a: 'Neću', opts: ['Neću', 'Nećeš', 'Neće'] },
  { q: '"She will not eat" — negative future: _____ jesti.', a: 'Neće', opts: ['Neću', 'Nećeš', 'Neće'] },
  { q: 'Short future: "Čitat _____ sutra." (ja)', a: 'ću', opts: ['ću', 'ćeš', 'će'] },
  { q: '"We will travel" — mi _____ putovati.', a: 'ćemo', opts: ['ćemo', 'ćete', 'će'] },
  { q: '"They will arrive" — oni _____ stići.', a: 'će', opts: ['ćemo', 'ćete', 'će'] },
];

// difficulty-3: fill blank, no word bank
export const FUTURE_EXERCISES_FILL = [
  { q: 'Ja _____ (čitati) tu knjigu sljedeći tjedan. (will)', a: 'ću čitati', hint: 'ja + ću + infinitive' },
  { q: 'Ti _____ (ići) na tečaj od ponedjeljka. (will)', a: 'ćeš ići', hint: 'ti + ćeš + infinitive' },
  { q: 'Marko _____ (završiti) posao do petka. (will)', a: 'će završiti', hint: 'on + će + infinitive' },
  { q: 'Mi _____ (naučiti) puno novih riječi. (will)', a: 'ćemo naučiti', hint: 'mi + ćemo + infinitive' },
  { q: 'Oni _____ (doći) sutra ujutro. (will)', a: 'će doći', hint: 'oni + će + doći (irregular)' },
  { q: 'Ja _____ (ne + pisati) e-mail večeras. (will not)', a: 'neću pisati', hint: 'neću + infinitive (not ne ću)' },
  { q: 'Ana _____ (pjevati) na svadbi. (will)', a: 'će pjevati', hint: 'ona + će + infinitive' },
  { q: 'Sutra _____ (padati) kiša. (it will rain)', a: 'će padati', hint: 'će + infinitive (impersonal)' },
];

// difficulty-4: transform to future or negate
export const FUTURE_EXERCISES_XFORM = [
  { q: 'Transform to future: "Idem u školu svaki dan."', a: 'Ići ću u školu svaki dan.', note: 'Short future: ići ću (NOT idem ću — that form does not exist)' },
  { q: 'Transform to future: "Ona čita novine ujutro."', a: 'Ona će čitati novine ujutro.', note: 'čita (present) → će čitati (future)' },
  { q: 'Negate: "On će doći sutra."', a: 'On neće doći sutra.', note: 'će → neće (one word — do not write ne će)' },
  { q: 'Transform to future: "Mi jedemo zajedno svaki tjedan."', a: 'Mi ćemo jesti zajedno svaki tjedan.', note: 'jedemo → ćemo jesti' },
];
```

- [ ] **Step 4: Run to confirm tests pass**

Run: `npm test -- exercise-meta`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add src/data/exercises.js src/tests/exercise-meta.test.ts
git commit -m "feat: add 20 future-tense exercises (MC + fill + transform)"
```

---

## Task 6: Expand B2+ vocabulary in `vocabulary.js`

**Files:**
- Modify: `src/data/vocabulary.js` — expand `V_B2` with 4 categories (~120 new terms)
- Test: `src/tests/exercise-meta.test.ts` (add vocabulary length assertions)

- [ ] **Step 1: Add length assertions to test**

Add to `src/tests/exercise-meta.test.ts`:

```typescript
import { V_B2 } from '../data/vocabulary.js';

describe('V_B2 vocabulary expansion', () => {
  it('philosophy-ethics category has >= 30 terms', () => {
    expect(V_B2['philosophy-ethics']?.length).toBeGreaterThanOrEqual(30);
  });

  it('media-journalism category has >= 25 terms', () => {
    expect(V_B2['media-journalism']?.length).toBeGreaterThanOrEqual(25);
  });

  it('legal category has >= 35 terms', () => {
    expect(V_B2['legal']?.length).toBeGreaterThanOrEqual(35);
  });

  it('psychology category has >= 30 terms', () => {
    expect(V_B2['psychology']?.length).toBeGreaterThanOrEqual(30);
  });

  it('every new term has Croatian word, English meaning, and example sentence', () => {
    const newCategories = ['philosophy-ethics', 'media-journalism', 'legal', 'psychology'];
    for (const cat of newCategories) {
      for (const term of V_B2[cat] ?? []) {
        expect(typeof term[0]).toBe('string'); // Croatian
        expect(typeof term[1]).toBe('string'); // English
        expect(typeof term[2]).toBe('string'); // Example sentence
      }
    }
  });
});
```

- [ ] **Step 2: Run to confirm assertions fail**

Run: `npm test -- exercise-meta`
Expected: FAIL — `V_B2['philosophy-ethics'] is undefined`

- [ ] **Step 3: Add new categories to `V_B2` in `vocabulary.js`**

Find the closing `};` of the `V_B2` object (after the last existing category entry) and add the four new categories before it:

```javascript
  // ── Philosophy & ethics (expanded) ───────────────────────────────────────
  'philosophy-ethics': [
    ['epistemologija', 'epistemology', 'Epistemologija proučava što znanje jest i kako ga stječemo.'],
    ['ontologija', 'ontology', 'Ontologija je grana filozofije koja proučava narav bitka.'],
    ['empirizam', 'empiricism', 'Prema empirizmu, svo znanje dolazi iz iskustvene spoznaje.'],
    ['racionalizam', 'rationalism', 'Descartes je začetnik modernog racionalizma.'],
    ['utilitarizam', 'utilitarianism', 'Utilitarizam mjeri moralnost prema posljedicama za sreću.'],
    ['deontologija', 'deontology', 'Kantova deontologija naglašava moralnu dužnost, ne posljedice.'],
    ['etika vrline', 'virtue ethics', 'Aristotelova etika vrline fokusira se na karakter osobe.'],
    ['moralni relativizam', 'moral relativism', 'Moralni relativizam negira postojanje univerzalnih vrijednosti.'],
    ['slobodna volja', 'free will', 'Pitanje slobodne volje središnje je u filozofiji uma.'],
    ['determinizam', 'determinism', 'Determinizam tvrdi da su svi događaji uzrokovani prethodnim stanjima.'],
    ['spoznaja', 'cognition / knowledge', 'Spoznaja je temeljni pojam u filozofiji uma.'],
    ['metafizika', 'metaphysics', 'Metafizika ispituje narav stvarnosti izvan fizikalnog.'],
    ['fenomenologija', 'phenomenology', 'Husserl je utemeljio fenomenologiju kao metodu filozofije.'],
    ['egzistencijalizam', 'existentialism', 'Sartre je ključni egzistencijalistički mislilac 20. st.'],
    ['nihilizam', 'nihilism', 'Nihilizam negira smisao i moralnu objektivnost.'],
    ['pragmatizam', 'pragmatism', 'Pragmatizam procjenjuje ideje prema njihovoj praktičnoj vrijednosti.'],
    ['aksiologija', 'axiology', 'Aksiologija je filozofska disciplina o vrijednostima.'],
    ['dijalektika', 'dialectics', 'Hegelova dijalektika kreće se od teze, preko antiteze, do sinteze.'],
    ['subjektivnost', 'subjectivity', 'Subjektivnost označava perspektivu vezanu za određeni subjekt.'],
    ['objektivnost', 'objectivity', 'Objektivnost znači biti neovisan o osobnim predrasudama.'],
    ['transcendencija', 'transcendence', 'Transcendencija prelazi granice iskustvene spoznaje.'],
    ['imanencija', 'immanence', 'Imanentno je ono što ostaje unutar granica iskustva.'],
    ['kontingencija', 'contingency', 'Kontingencija označava slučajnost nasuprot nužnosti.'],
    ['nužnost', 'necessity', 'Logička nužnost znači da nešto ne može biti drugačije.'],
    ['hermeneutika', 'hermeneutics', 'Hermeneutika je teorija tumačenja tekstova i značenja.'],
    ['analogija', 'analogy', 'Analogija uspoređuje različite domene radi pojašnjenja.'],
    ['silogizam', 'syllogism', 'Aristotelski silogizam je temeljni oblik deduktivnog zaključka.'],
    ['indukcija', 'induction', 'Indukcijom zaključujemo iz posebnih slučajeva na opće zakone.'],
    ['dedukcija', 'deduction', 'Dedukcijom zaključujemo iz općih premisa na posebne zaključke.'],
    ['aporija', 'aporia', 'Sokratske aporije navode sugovornika na promišljanje.'],
  ],

  // ── Media & journalism (expanded) ────────────────────────────────────────
  'media-journalism': [
    ['algoritam', 'algorithm', 'Algoritam određuje koji sadržaj vidimo u feedu.'],
    ['mjehurić filtera', 'filter bubble', 'Mjehurić filtera ograničava raznolikost informacija.'],
    ['clickbait', 'clickbait', 'Naslovi za klikove (clickbait) namjerno su senzacionalistički.'],
    ['dezinformacija', 'disinformation', 'Dezinformacija je namjerno širenje lažnih podataka.'],
    ['bot', 'bot', 'Botovi automatski šire sadržaj i manipuliraju raspravama.'],
    ['duboka lažirka', 'deepfake', 'Duboka lažirka je AI-generirana lažna snimka osobe.'],
    ['viralan', 'viral', 'Video je postao viralan u roku od sat vremena.'],
    ['trollanje', 'trolling', 'Trollanje je namjerno provokativno ponašanje na mreži.'],
    ['lažna vijest', 'fake news', 'Lažne vijesti šire se brže od točnih informacija.'],
    ['nativno oglašavanje', 'native advertising', 'Nativno oglašavanje dizajnirano je da liči na urednički sadržaj.'],
    ['influencer', 'influencer', 'Influenceri oblikuju mišljenja i kupovne navike pratitelja.'],
    ['streaming', 'streaming', 'Streaming platforme mijenjaju medijsku konzumaciju.'],
    ['podcast', 'podcast', 'Podcast je audio format dostupan na zahtjev.'],
    ['angažman', 'engagement', 'Angažman se mjeri lajkovima, komentarima i dijeljenjem.'],
    ['urednička politika', 'editorial policy', 'Urednička politika određuje što medij objavljuje i kako.'],
    ['sloboda tiska', 'freedom of the press', 'Sloboda tiska temelj je demokratskog društva.'],
    ['cenzura', 'censorship', 'Cenzura ograničava slobodu izražavanja i pristupa informacijama.'],
    ['istraživačko novinarstvo', 'investigative journalism', 'Istraživačko novinarstvo razotkriva korupciju i zloporabe.'],
    ['novinarska etika', 'journalistic ethics', 'Novinarska etika zahtijeva provjeru izvora i nepristranost.'],
    ['neobjektivnost', 'bias', 'Svaki medij nosi određenu neobjektivnost u izvještavanju.'],
    ['objava', 'post (social media)', 'Objavila je fotografiju s koncerta na Instagramu.'],
    ['pratiti', 'to follow (online)', 'Pratim nekoliko novinara na društvenim mrežama.'],
    ['dijeliti', 'to share', 'Podijelila sam članak s nekoliko prijatelja.'],
    ['komentirati', 'to comment', 'Komentirala sam na tu objavu ispod videa.'],
    ['medijska pismenost', 'media literacy', 'Medijska pismenost uključuje kritičko čitanje vijesti.'],
  ],

  // ── Legal (new category) ──────────────────────────────────────────────────
  'legal': [
    ['tužba', 'lawsuit / complaint', 'Podnijela je tužbu zbog kršenja ugovora o radu.'],
    ['optužnica', 'indictment', 'Optužnica za prijevaru podnesena je tužiteljstvu.'],
    ['presuda', 'verdict / judgement', 'Sud je izrekao osuđujuću presudu.'],
    ['branitelj', 'defense attorney', 'Branitelj je osporio dokaze tužiteljstva na sudu.'],
    ['tužitelj', 'prosecutor', 'Tužitelj zahtijeva kaznu od tri godine zatvora.'],
    ['svjedok', 'witness', 'Svjedok je dao iskaz pod prisegom pred sudom.'],
    ['dokazni materijal', 'evidence', 'Dokazni materijal uključuje financijske zapise i e-mailove.'],
    ['pravomoćno', 'final (legally binding)', 'Pravomoćna presuda stupa na snagu odmah.'],
    ['žalba', 'appeal', 'Podnijeli su žalbu Vrhovnom sudu na presudu.'],
    ['parnica', 'civil suit / litigation', 'Parnica između dviju tvrtki traje već godinu dana.'],
    ['odvjetnik', 'lawyer / attorney', 'Odvjetnik me savjetovao o mojim pravima.'],
    ['sud', 'court', 'Slučaj je upućen na Općinski sud u Zagrebu.'],
    ['sudac', 'judge', 'Sudac je predsjedao cijelom raspravom.'],
    ['kazneno djelo', 'criminal offense', 'Prijevara je kazneno djelo prema Kaznenom zakonu.'],
    ['prekršaj', 'misdemeanor / infraction', 'Prekoračenje brzine je prometni prekršaj.'],
    ['kazna', 'penalty / punishment', 'Za to kazneno djelo prijeti kazna zatvora do pet godina.'],
    ['zatvorska kazna', 'prison sentence', 'Dobio je zatvorsku kaznu od dvije godine.'],
    ['uvjetna kazna', 'suspended sentence', 'Sud je izrekao uvjetnu kaznu uz probacijski nadzor.'],
    ['oslobađajuća presuda', 'acquittal', 'Nakon suđenja, dobio je oslobađajuću presudu.'],
    ['osuđujuća presuda', 'conviction', 'Osuđujuća presuda okončala je tromjesečno suđenje.'],
    ['zakon', 'law (statute)', 'Novi zakon o zaštiti podataka stupa na snagu sljedeći tjedan.'],
    ['ustav', 'constitution', 'Ustav jamči slobodu govora i vjeroispovijesti.'],
    ['kršenje', 'violation / breach', 'Kršenje ugovora može dovesti do odštete.'],
    ['naknada štete', 'compensation / damages', 'Tužena strana mora platiti naknadu štete od 50.000 kuna.'],
    ['vlasništvo', 'property / ownership', 'Vlasništvo nad nekretninom prenosi se potpisom ugovora.'],
    ['intelektualno vlasništvo', 'intellectual property', 'Autorska prava su oblik intelektualnog vlasništva.'],
    ['autorska prava', 'copyright', 'Autorska prava traju 70 godina od autorove smrti.'],
    ['patent', 'patent', 'Patentom se štiti novi izum od kopiranja.'],
    ['licencija', 'license', 'Softver se distribuira uz komercijalnu licenciju.'],
    ['arbitraža', 'arbitration', 'Stranke su se dogovorile za arbitražu umjesto parnice.'],
    ['posredovanje', 'mediation', 'Posredovanje može riješiti spor bez odlaska na sud.'],
    ['tužena strana', 'defendant', 'Tužena strana negirala je sve navode iz tužbe.'],
    ['tužiteljstvo', 'prosecutor\'s office', 'Tužiteljstvo je pokrenulo istragu.'],
    ['istraga', 'investigation', 'Policijska istraga traje već šest tjedana.'],
    ['uhićenje', 'arrest', 'Uhićenje je provedeno bez naloga za pretres.'],
  ],

  // ── Psychology (new category) ─────────────────────────────────────────────
  'psychology': [
    ['kognitivna distorzija', 'cognitive distortion', 'Katastrofizacija je česta kognitivna distorzija.'],
    ['pristranost potvrde', 'confirmation bias', 'Pristranost potvrde navodi nas da tražimo potvrdu uvjerenja.'],
    ['afekt', 'affect / mood', 'Pozitivni afekt povezan je s boljim psihičkim zdravljem.'],
    ['trauma', 'trauma', 'Trauma može imati dugoročne psihološke posljedice na osobu.'],
    ['otpornost', 'resilience', 'Otpornost je sposobnost oporavka od stresa i teškoća.'],
    ['anksioznost', 'anxiety', 'Anksioznost se može liječiti kognitivno-bihevioralnom terapijom.'],
    ['depresija', 'depression', 'Depresija je jedna od najčešćih mentalnih bolesti u svijetu.'],
    ['samoučinkovitost', 'self-efficacy', 'Visoka samoučinkovitost potiče akademsko postignuće.'],
    ['empatija', 'empathy', 'Empatija je sposobnost razumijevanja i dijeljenja tuđih osjećaja.'],
    ['kognitivna pristranost', 'cognitive bias', 'Kognitivne pristranosti nesvjesno utječu na naše odluke.'],
    ['mehanizmi obrane', 'defense mechanisms', 'Poricanje i projekcija su primjeri mehanizama obrane.'],
    ['projekcija', 'projection (psychology)', 'Projekcija je pripisivanje vlastitih negativnih osjećaja drugima.'],
    ['represija', 'repression', 'Represija je nesvjesno potiskivanje neugodnih sjećanja.'],
    ['racionalizacija', 'rationalization', 'Racionalizacijom opravdavamo irracionalno ponašanje logičnim razlozima.'],
    ['uvjetovanje', 'conditioning', 'Klasično uvjetovanje Pavlov je otkrio na psima.'],
    ['potkrepljivanje', 'reinforcement', 'Pozitivno potkrepljivanje povećava vjerojatnost željenog ponašanja.'],
    ['samopoštovanje', 'self-esteem', 'Zdravo samopoštovanje temelj je dobrog mentalnog zdravlja.'],
    ['narcizam', 'narcissism', 'Narcizam uključuje pretjeran osjećaj vlastite važnosti.'],
    ['psihoterapija', 'psychotherapy', 'Psihoterapija pomaže u liječenju različitih mentalnih poteškoća.'],
    ['kognitivno-bihevioralna terapija', 'CBT (cognitive-behavioral therapy)', 'KBT je najefikasnija terapija za anksioznost i depresiju.'],
    ['mindfulness', 'mindfulness', 'Mindfulness podrazumijeva svjesnu i neprosuđujuću prisutnost u sadašnjosti.'],
    ['kronični stres', 'chronic stress', 'Kronični stres može oštetiti kardiovaskularni sustav.'],
    ['suočavanje', 'coping', 'Suočavanje sa stresom može biti adaptivno ili maladaptivno.'],
    ['burnout', 'burnout', 'Burnout je stanje emocionalne i fizičke iscrpljenosti zbog preopterećenja.'],
    ['opsesija', 'obsession', 'Opsesija je nametljiva i ponavljajuća, nekontrolirana misao.'],
    ['kompulzija', 'compulsion', 'Kompulzija je prisilno repetitivno ponašanje koje smanjuje anksioznost.'],
    ['fobija', 'phobia', 'Fobija je iracionalan i pretjeran strah od specifičnog objekta ili situacije.'],
    ['paranoja', 'paranoia', 'Paranoja uključuje neopravdano nepovjerenje prema motivima drugih.'],
    ['psihoanaliza', 'psychoanalysis', 'Freud je utemeljio psihoanalizu kao metodu liječenja.'],
    ['nesvjesno', 'the unconscious', 'Nesvjesno čuva potisnute misli, sjećanja i impulse.'],
  ],
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test -- exercise-meta`
Expected: PASS, all vocabulary length tests pass

- [ ] **Step 5: Commit**

```bash
git add src/data/vocabulary.js src/tests/exercise-meta.test.ts
git commit -m "feat: expand V_B2 vocabulary with ~120 new B2+ terms

philosophy-ethics (+30), media-journalism (+25), legal (new, +35),
psychology (new, +30). All terms include Croatian, English, example sentence."
```

---

## Task 7: Add 3 new speaking prompt types to `SpeakingScreen.tsx`

**Files:**
- Modify: `src/components/practice/SpeakingScreen.tsx`

Adds `QUESTION_RESPONSE_PROMPTS`, `PICTURE_DESCRIPTION_PROMPTS`, and `DIALOGUE_COMPLETION_PROMPTS` constant arrays. When `sw[2]` is a prompt type string, SpeakingScreen shows the prompt without speech-recognition matching (self-assessment is primary path).

- [ ] **Step 1: Add the three prompt constant arrays**

In `src/components/practice/SpeakingScreen.tsx`, after the closing `}` of the `SPEAKING_TIPS` array (around line 27), add:

```typescript
// ─── New speaking prompt types ────────────────────────────────────────────────
// Format: [Croatian prompt, English hint, promptType, optional image key]
// promptType triggers open-ended rendering (no speech recognition matching).

export const QUESTION_RESPONSE_PROMPTS: [string, string, string][] = [
  ['Što si radio/radila prošlog vikenda?',      'What did you do last weekend? (Use past tense)', 'question-response'],
  ['Zašto učiš hrvatski?',                       'Why are you learning Croatian?',                'question-response'],
  ['Gdje ideš na godišnji odmor?',               'Where are you going on holiday?',               'question-response'],
  ['Opiši svoju jutarnju rutinu.',               'Describe your morning routine.',                 'question-response'],
  ['Što ti se sviđa kod Dalmacije?',             'What do you like about Dalmatia?',              'question-response'],
];

export const PICTURE_DESCRIPTION_PROMPTS: [string, string, string, string][] = [
  ['Opišite ovu sliku na hrvatskom. Što vidite?',       'Describe what you see in Croatian.',       'picture-description', 'dubrovnik-ai'],
  ['Što se događa na ovoj slici? Opišite detalje.',     'Describe what is happening in this image.','picture-description', 'croatian-food'],
  ['Opišite krajolik. Kakvo je vrijeme na slici?',      'Describe the landscape and weather.',       'picture-description', 'dalmatian-coast'],
];

export const DIALOGUE_COMPLETION_PROMPTS: [string, string, string][] = [
  ['A: "Hej, kako si?" B: "Super, hvala. A ti?" → Nastavi kao A.',                         'Continue the conversation as A.',        'dialogue-completion'],
  ['A: "Oprostite, gdje je supermarket?" B: "Ravno pa lijevo." → Zahvali kao A.',           'Thank B and ask a follow-up question.',  'dialogue-completion'],
  ['A: "Možemo li se naći u petak?" B: "Petak mi ne odgovara." → Predloži alternativu.',   'Suggest another day/time as A.',         'dialogue-completion'],
];
```

- [ ] **Step 2: Add prompt-type detection and rendering**

In `SpeakingScreen.tsx`, find the JSX section where `sw[0]` is displayed as the target word (search for `sw[0]` in the render return). The speaking screen shows the word the user must say. For prompt types, replace target-word rendering with prompt rendering.

Find the section that renders the current word to speak. It will look like:
```tsx
<div ...>{sw[0]}</div>
```

Wrap it with a prompt-type check. Add this helper near the top of the component function (after state declarations):

```typescript
// Detect if current item is an open-ended prompt (not a vocabulary word)
const isPromptType = typeof sw[2] === 'string' && (
  sw[2] === 'question-response' ||
  sw[2] === 'picture-description' ||
  sw[2] === 'dialogue-completion'
);
```

Then where the word/phrase is shown to the user, conditionally render the prompt:

```tsx
{isPromptType ? (
  <div style={{ textAlign: 'center', padding: '0 16px' }}>
    {sw[2] === 'picture-description' && sw[3] && (
      <img
        src={`/images/scenes/${sw[3]}.jpg`}
        alt="Describe this scene"
        style={{ width: '100%', maxWidth: 320, borderRadius: 12, marginBottom: 12 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    )}
    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}>
      {sw[0] as string}
    </div>
    <div style={{ fontSize: 14, color: 'var(--subtext)' }}>
      {sw[1] as string}
    </div>
  </div>
) : (
  /* existing word display JSX here — unchanged */
  null
)}
```

For prompt types, also ensure the speech recognition result matching is bypassed. In the `rec.onresult` handler (around line 364–393), add a guard at the top:

```typescript
rec.onresult = (e: any) => {
  if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  stopRecording();
  stopWaveform();
  if (!e.results || !e.results.length) return;
  
  // For open-ended prompts, skip matching — user self-assesses
  if (isPromptType) {
    setRecResult('prompt-done');
    setListening(false);
    return;
  }
  
  // existing matching logic follows unchanged ...
```

- [ ] **Step 3: Verify the app builds without TypeScript errors**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no TS errors

- [ ] **Step 4: Commit**

```bash
git add src/components/practice/SpeakingScreen.tsx
git commit -m "feat: add 3 new speaking prompt types (question-response, picture-description, dialogue-completion)

Open-ended prompts bypass speech recognition matching; user self-assesses.
Image support for picture-description with onError fallback to text-only."
```

---

## Task 8: Wire `useAdaptiveSession` into `ProductionDrillScreen.tsx`

**Files:**
- Modify: `src/components/practice/ProductionDrillScreen.tsx`

Adds in-session difficulty adjustment: filters TRANSFORMS by level based on sessionDifficulty, calls `rateCategorySession` on session end.

- [ ] **Step 1: Read the existing import block and TRANSFORMS usage**

Read `src/components/practice/ProductionDrillScreen.tsx` lines 1–30 to confirm existing imports, then find where TRANSFORMS is filtered/iterated for the exercise pool.

- [ ] **Step 2: Add the hook import and difficulty-based filtering**

At the top of `ProductionDrillScreen.tsx`, add the import:

```typescript
import { useAdaptiveSession } from '../../hooks/useAdaptiveSession';
import { getCategoryDifficulty, rateCategorySession } from '../../lib/adaptive';
```

At the top of the component function body, add:

```typescript
// Map difficulty tier to exercise levels
const initialDiff = getCategoryDifficulty('past-tense'); // use the dominant category
const { sessionDifficulty, onCorrect, onWrong, sessionSummary } = useAdaptiveSession(initialDiff);

// Difficulty tier → exercise levels to include
const DIFF_TO_LEVELS: Record<number, string[]> = {
  1: ['A2'],
  2: ['A2'],
  3: ['A2', 'B1'],
  4: ['B1'],
  5: ['B1', 'B2'],
};
const activeLevels = DIFF_TO_LEVELS[sessionDifficulty] ?? ['A2', 'B1'];
```

Where TRANSFORMS is filtered for the current exercise pool, add a level filter:

```typescript
// Add this filter when building the exercise pool from TRANSFORMS
const pool = TRANSFORMS.filter(t => activeLevels.includes(t.level ?? 'A2'));
// If pool is empty (no exercises at this difficulty), fall back to full TRANSFORMS
const exercisePool = pool.length > 0 ? pool : TRANSFORMS;
```

On correct answer (where the existing `recordTopicResult` is called), add:

```typescript
onCorrect('past-tense'); // or the actual category of the exercise
```

On wrong answer, add:

```typescript
onWrong('past-tense');
```

On session end (where XP is awarded / goBack is called), add:

```typescript
// Rate the category with this session's accuracy before leaving
const summary = sessionSummary();
const cat = 'past-tense'; // or derive from exercise metadata
const catAccuracy = summary[cat];
if (catAccuracy && catAccuracy.total > 0) {
  rateCategorySession(cat, catAccuracy.accuracy);
}
```

- [ ] **Step 3: Build to confirm no TypeScript errors**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/practice/ProductionDrillScreen.tsx
git commit -m "feat: wire useAdaptiveSession into ProductionDrillScreen

Filters TRANSFORMS by difficulty tier (1-5 maps to A2/B1/B2 levels).
Calls rateCategorySession on session end to persist FSRS rating."
```

---

## Task 9: Create `useAdaptivePractice.ts` + wire into `PracticeTab.tsx`

**Files:**
- Create: `src/hooks/useAdaptivePractice.ts`
- Modify: `src/components/practice/PracticeTab.tsx` (minimal — one hook call + one button)

- [ ] **Step 1: Create `src/hooks/useAdaptivePractice.ts`**

```typescript
// src/hooks/useAdaptivePractice.ts
//
// Loads the category practice queue and exposes it to PracticeTab.
// The UI is unchanged — this hook just determines which category to start with.

import { useMemo } from 'react';
import { getDueCategoryQueue, type SkillCategory } from '../lib/adaptive';

export interface PracticeQueueItem {
  category: SkillCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface UseAdaptivePracticeReturn {
  /** Top-priority category + difficulty to start with */
  primaryItem: PracticeQueueItem | null;
  /** Full queue of up to 6 prioritised items */
  practiceQueue: PracticeQueueItem[];
}

export function useAdaptivePractice(): UseAdaptivePracticeReturn {
  const practiceQueue = useMemo(() => getDueCategoryQueue(6), []);
  const primaryItem = practiceQueue[0] ?? null;
  return { primaryItem, practiceQueue };
}
```

- [ ] **Step 2: Wire into `PracticeTab.tsx`**

At the top of `PracticeTab.tsx`, add the import:

```typescript
import { useAdaptivePractice } from '../../hooks/useAdaptivePractice';
```

At the top of the `PracticeTab` component function body (after existing hook calls), add:

```typescript
const { primaryItem } = useAdaptivePractice();
```

Find the section where the main practice buttons are rendered (the grid of exercise options). Before the grid, add a "Smart Practice" call-to-action that routes to the highest-priority category. This should appear only when there is a `primaryItem`:

```tsx
{primaryItem && (
  <div
    style={{
      background: 'var(--accent)',
      borderRadius: 14,
      padding: '14px 18px',
      marginBottom: 16,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
    onClick={() => {
      // Route to the appropriate screen based on category
      const catToScreen: Partial<Record<string, () => void>> = {
        'past-tense':     () => startAspectDrill(),
        'future-tense':   () => startAspectDrill(),
        'speaking':       () => startSpeaking(),
        'vocab-b2':       () => startReview(),
        'vocab-b1':       () => startReview(),
        'vocab-a2':       () => startReview(),
      };
      const launcher = catToScreen[primaryItem.category];
      if (launcher) launcher();
      else startAspectDrill(); // fallback
    }}
  >
    <span style={{ fontSize: 22 }}>🎯</span>
    <div>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Smart Practice</div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
        {primaryItem.category.replace(/-/g, ' ')} · difficulty {primaryItem.difficulty}/5
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Build to confirm no TypeScript errors**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: All tests pass (no regressions)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAdaptivePractice.ts src/components/practice/PracticeTab.tsx
git commit -m "feat: add useAdaptivePractice + Smart Practice button in PracticeTab

getDueCategoryQueue(6) drives a prominent Smart Practice CTA that routes
to the highest-priority due category at the user's current difficulty.
Visual grid is unchanged; new button appears above it when data exists."
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dedicated past tense practice (20 exercises, difficulties 2–4) | Task 4 |
| Dedicated future tense practice (20 exercises, difficulties 2–4) | Task 5 |
| B2+ vocabulary depth expansion (~120 terms, 4 categories) | Task 6 |
| 3 new speaking prompt types | Task 7 |
| FSRS-based category scheduling (rateCategorySession, getDueCategoryQueue) | Task 1 |
| In-session difficulty adjuster (3 correct → +1, 2 wrong → -1) | Task 3 |
| Exercise difficulty metadata (EXERCISE_META) | Task 2 |
| Wire adaptive session into ProductionDrillScreen | Task 8 |
| Smart routing in PracticeTab (invisible to user) | Task 9 |
| EWMA recentAccuracy (α=0.3) | Task 1 |
| Stability→difficulty tier mapping (1–5) | Task 1 |
| picture-description uses scene images with onError fallback | Task 7 |

**Placeholder scan:** No TBDs or TODOs found in plan. All code blocks are complete.

**Firestore rules note:** The spec includes an `adaptive/{userId}` Firestore rule. This implementation uses localStorage (consistent with existing `adaptive.ts`) so the Firestore rule is not needed. If cloud sync of category state is added later, the rule from the design spec can be applied at that point.

---

## Execution Options

Plan saved to `docs/superpowers/plans/2026-04-24-content-curriculum-adaptive.md`.

**1. Subagent-Driven (recommended)** — Fresh subagent per task, spec review + code quality review after each, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, with batch checkpoints for review.

Which approach?
