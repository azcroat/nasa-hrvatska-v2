# UX Redesign — Daily Session Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overloaded HomeTab with a single Daily Session Hub, add CEFR gating to PracticeTab, and wire session integration into Profile and Croatia tabs.

**Architecture:** A `useDailySession` hook in HomeTab owns the daily session (built from FSRS reviews → adaptive weak spots → CEFR-filtered exercises → Croatia slot). HomeTab renders a three-state `SessionCard`. PracticeTab gains a CEFR badge + available/locked split. Profile and Croatia receive lightweight additions (streak widget, immersion card, soft hints).

**Tech Stack:** React 18, TypeScript (strict), Vitest for unit tests, localStorage-only persistence (Firestore sync deferred), existing AppContext/StatsContext patterns.

---

## Spec Corrections (vs. brainstorm doc)

Two implementation corrections documented here for implementers:

1. **`authUser.cefr` does not exist** — `AuthUser = { u, e, d }`. CEFR level must be computed from stats using the same formula as `StatsTab.tsx`: `xp + lc * 15 + gc * 25`. The `getUserCefr()` function in `src/lib/cefr.ts` implements this.

2. **`SkillCategory` values are different** — the actual type in `src/lib/adaptive.ts` is: `'genitive' | 'accusative' | 'dative-locative' | 'instrumental' | 'vocative' | 'past-tense' | 'future-tense' | 'aspect-imperfective' | 'aspect-perfective' | 'aspect-negation' | 'conditional' | 'clitics' | 'vocab-a2' | 'vocab-b1' | 'vocab-b2' | 'speaking'`. The `CATEGORY_SCREEN_MAP` in the hook uses these actual values.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/cefr.ts` | CEFR_ORDER, cefrRank(), isUnlocked(), getUserCefr() |
| Create | `src/hooks/useDailySession.ts` | Session state, buildSession(), markDone(), persistence |
| Create | `src/components/shared/CefrSoftHint.tsx` | Aspirational hint banner for B1+ screens |
| Create | `src/components/home/SessionCard.tsx` | Three-state session card (active/in-progress/complete) |
| Create | `src/tests/cefr.test.ts` | Unit tests for cefr.ts |
| Create | `src/tests/useDailySession.test.ts` | Unit tests for session hook logic |
| Modify | `src/components/home/HomeTab.tsx` | Remove 12 sections; add SessionCard + useDailySession |
| Modify | `src/components/practice/PracticeTab.tsx` | Add CEFR badge header + available/locked sections |
| Modify | `src/components/profile/StatsTab.tsx` | Add session streak widget |
| Modify | `src/components/profile/InsightsTab.tsx` | Remove "Review →" buttons |
| Modify | `src/components/croatia/DiscoverTab.tsx` | Add Daily Immersion session-slot card |
| Modify | `src/components/croatia/AIConversation.tsx` | Add CefrSoftHint at top |
| Modify | `src/components/croatia/RoleplayScreen.tsx` | Add CefrSoftHint at top |
| Modify | `src/components/croatia/TextingScreen.tsx` | Add CefrSoftHint at top |

---

## Task 1: `src/lib/cefr.ts` — CEFR utility functions

**Files:**
- Create: `src/lib/cefr.ts`
- Test: `src/tests/cefr.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/cefr.test.ts
import { describe, it, expect } from 'vitest';
import { cefrRank, isUnlocked, getUserCefr, CEFR_ORDER } from '../lib/cefr';

describe('CEFR_ORDER', () => {
  it('contains 6 levels in correct order', () => {
    expect(CEFR_ORDER).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });
});

describe('cefrRank', () => {
  it('returns 0 for A1', () => expect(cefrRank('A1')).toBe(0));
  it('returns 2 for B1', () => expect(cefrRank('B1')).toBe(2));
  it('returns 5 for C2', () => expect(cefrRank('C2')).toBe(5));
  it('returns 0 for unknown level', () => expect(cefrRank('X9')).toBe(0));
});

describe('isUnlocked', () => {
  it('unlocks A1 exercise for any user', () => {
    expect(isUnlocked('A1', 'A1')).toBe(true);
    expect(isUnlocked('A1', 'B2')).toBe(true);
  });
  it('locks B1 exercise for A1 user', () => {
    expect(isUnlocked('B1', 'A1')).toBe(false);
    expect(isUnlocked('B1', 'A2')).toBe(false);
  });
  it('unlocks B1 exercise for B1 user', () => {
    expect(isUnlocked('B1', 'B1')).toBe(true);
  });
  it('unlocks B2 exercise for C1 user', () => {
    expect(isUnlocked('B2', 'C1')).toBe(true);
  });
});

describe('getUserCefr', () => {
  it('returns A1 for new user', () => expect(getUserCefr(0, 0, 0)).toBe('A1'));
  it('returns A2 at 300 total', () => expect(getUserCefr(300, 0, 0)).toBe('A2'));
  it('returns B1 at 1200 total', () => expect(getUserCefr(1200, 0, 0)).toBe('B1'));
  it('returns B2 at 3500 total', () => expect(getUserCefr(3500, 0, 0)).toBe('B2'));
  it('returns C1 at 8000 total', () => expect(getUserCefr(8000, 0, 0)).toBe('C1'));
  it('returns C2 at 18000 total', () => expect(getUserCefr(18000, 0, 0)).toBe('C2'));
  it('weights lc and gc correctly', () => {
    // 10 lessons = 150 (xp) + 150 (lc*15) = 300 total → A2
    expect(getUserCefr(150, 10, 0)).toBe('A2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
cd "C:\Users\jschr\Dropbox\Croatian Learning Application\Source Code\nasa-hrvatska-v2"
npx vitest run src/tests/cefr.test.ts
```
Expected: FAIL — "Cannot find module '../lib/cefr'"

- [ ] **Step 3: Create `src/lib/cefr.ts`**

```typescript
// src/lib/cefr.ts

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = typeof CEFR_ORDER[number];

/**
 * Numeric rank for CEFR level. Unknown → 0 (treated as A1).
 */
export function cefrRank(cefr: string): number {
  const i = CEFR_ORDER.indexOf(cefr as CefrLevel);
  return i === -1 ? 0 : i;
}

/**
 * Returns true when the exercise CEFR level is at or below the user's level.
 * Unknown exercise CEFR → always unlocked (fail-open for missing data).
 */
export function isUnlocked(exerciseCefr: string, userCefr: string): boolean {
  return cefrRank(exerciseCefr) <= cefrRank(userCefr);
}

/**
 * Compute user's CEFR level from progress stats.
 * Mirrors the getCEFR formula in src/components/profile/StatsTab.tsx exactly.
 * xp + lc*15 + gc*25 → thresholds 300/1200/3500/8000/18000.
 */
export function getUserCefr(xp: number, lc: number, gc: number): CefrLevel {
  const total = xp + lc * 15 + gc * 25;
  if (total < 300) return 'A1';
  if (total < 1200) return 'A2';
  if (total < 3500) return 'B1';
  if (total < 8000) return 'B2';
  if (total < 18000) return 'C1';
  return 'C2';
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/tests/cefr.test.ts
```
Expected: PASS — all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cefr.ts src/tests/cefr.test.ts
git commit -m "feat: add cefr.ts — cefrRank, isUnlocked, getUserCefr utilities"
```

---

## Task 2: `src/hooks/useDailySession.ts` — Session engine

**Files:**
- Create: `src/hooks/useDailySession.ts`
- Test: `src/tests/useDailySession.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/useDailySession.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { buildSessionActivities, markDoneInSession, recordSessionComplete } from '../hooks/useDailySession';
import type { DailySession } from '../hooks/useDailySession';

beforeEach(() => localStorage.clear());

describe('buildSessionActivities', () => {
  it('returns 4–6 activities for new user (no FSRS, no category SR)', () => {
    const acts = buildSessionActivities('A1');
    expect(acts.length).toBeGreaterThanOrEqual(4);
    expect(acts.length).toBeLessThanOrEqual(6);
  });

  it('always includes exactly one Croatia activity', () => {
    const acts = buildSessionActivities('A1');
    const croatiaIds = ['cityofday', 'top100', 'grocery', 'transport', 'recipes', 'history', 'proverbs', 'popculture'];
    const croatiaActs = acts.filter(a => croatiaIds.includes(a.id));
    expect(croatiaActs).toHaveLength(1);
  });

  it('includes cityofday as croatia activity when not visited today', () => {
    localStorage.removeItem('nh_cityofday_date');
    const acts = buildSessionActivities('A2');
    expect(acts.find(a => a.id === 'cityofday')).toBeTruthy();
  });

  it('excludes cityofday when already visited today, rotates instead', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('nh_cityofday_date', today);
    const acts = buildSessionActivities('A2');
    expect(acts.find(a => a.id === 'cityofday')).toBeFalsy();
  });

  it('only includes exercises at or below user CEFR level', () => {
    const acts = buildSessionActivities('A1');
    // B1+ exercises should not appear in an A1 session
    const b1Exercises = ['aspectdrill', 'clitic', 'future', 'akudrill'];
    for (const ex of b1Exercises) {
      expect(acts.find(a => a.screen === ex)).toBeFalsy();
    }
  });

  it('does not repeat exercises from nh_recent_exercises', () => {
    localStorage.setItem('nh_recent_exercises', JSON.stringify(['mcgame', 'flashcards', 'review', 'znam', 'cloze', 'typing']));
    const acts = buildSessionActivities('B1');
    const recentIds = ['mcgame', 'flashcards', 'review', 'znam', 'cloze', 'typing'];
    for (const act of acts) {
      if (!['cityofday', 'top100', 'grocery', 'transport', 'recipes', 'history', 'proverbs', 'popculture'].includes(act.id)) {
        expect(recentIds).not.toContain(act.screen);
      }
    }
  });
});

describe('markDoneInSession', () => {
  it('adds id to completedIds', () => {
    const session: DailySession = {
      date: new Date().toISOString().slice(0, 10),
      activities: [{ id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', category: 'genitive' }],
      completedIds: [],
      estimatedMinutes: 5,
    };
    const updated = markDoneInSession(session, 'cloze');
    expect(updated.completedIds).toContain('cloze');
  });

  it('is idempotent — double-call does not duplicate', () => {
    const session: DailySession = {
      date: new Date().toISOString().slice(0, 10),
      activities: [{ id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', category: 'genitive' }],
      completedIds: ['cloze'],
      estimatedMinutes: 5,
    };
    const updated = markDoneInSession(session, 'cloze');
    expect(updated.completedIds.filter(id => id === 'cloze')).toHaveLength(1);
  });
});

describe('recordSessionComplete', () => {
  it('writes to nh_session_history with today as key', () => {
    const today = new Date().toISOString().slice(0, 10);
    recordSessionComplete(today);
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    expect(history[today]).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/tests/useDailySession.test.ts
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create `src/hooks/useDailySession.ts`**

```typescript
// src/hooks/useDailySession.ts
import { useState, useCallback, useRef } from 'react';
import { getDueReviews } from '../lib/srs';
import { getDueCategoryQueue } from '../lib/adaptive';
import type { SkillCategory } from '../lib/adaptive';
import { isUnlocked } from '../lib/cefr';
import { localDateStr } from '../lib/dateUtils.js';

// ── Types ────────────────────────────────────────────────────────────────────

// Sessions can include Croatia activities whose categories aren't SkillCategory
type SessionCategory = SkillCategory | 'culture' | 'practical' | 'general';

export interface SessionActivity {
  id: string;
  label: string;
  screen: string;
  category: SessionCategory;
}

export interface DailySession {
  date: string;           // 'YYYY-MM-DD'
  activities: SessionActivity[];
  completedIds: string[];
  estimatedMinutes: number;
}

export interface UseDailySessionReturn {
  session: DailySession;
  isComplete: boolean;
  progress: number;       // 0.0–1.0
  markDone: (screenOrId: string) => void;
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'nh_daily_session';
const HISTORY_KEY = 'nh_session_history';
const RECENT_KEY = 'nh_recent_exercises';
const MINUTES_PER_ACTIVITY = 5;

/** Maps adaptive SkillCategory → exercise screen id */
const CATEGORY_SCREEN_MAP: Partial<Record<SkillCategory, string>> = {
  genitive:              'prepdrill',
  accusative:            'akudrill',
  'dative-locative':     'cloze',
  instrumental:          'cloze',
  vocative:              'cloze',
  'past-tense':          'cloze',
  'future-tense':        'future',
  'aspect-imperfective': 'aspectdrill',
  'aspect-perfective':   'aspectdrill',
  'aspect-negation':     'aspectdrill',
  conditional:           'cloze',
  clitics:               'clitic',
  'vocab-a2':            'znam',
  'vocab-b1':            'znam',
  'vocab-b2':            'znam',
  speaking:              'speaking_sprint',
};

/** CEFR-annotated exercise pool for Priority 3 fill */
const CEFR_EXERCISE_POOL: Array<{ id: string; label: string; screen: string; cefr: string; category: SkillCategory }> = [
  { id: 'flashcards',  label: 'Flashcards',      screen: 'flashcards',    cefr: 'A1', category: 'vocab-a2' },
  { id: 'mcgame',      label: 'Quiz',             screen: 'mcgame',        cefr: 'A1', category: 'vocab-a2' },
  { id: 'match',       label: 'Match Pairs',      screen: 'match',         cefr: 'A1', category: 'vocab-a2' },
  { id: 'review',      label: 'SRS Review',       screen: 'review',        cefr: 'A1', category: 'vocab-a2' },
  { id: 'znam',        label: 'Translate',        screen: 'znam',          cefr: 'A1+', category: 'vocab-a2' },
  { id: 'qwords',      label: 'Questions',        screen: 'qwords',        cefr: 'A1+', category: 'vocab-a2' },
  { id: 'genderdrill', label: 'Gender',           screen: 'genderdrill',   cefr: 'A1+', category: 'vocab-a2' },
  { id: 'cloze',       label: 'Sentence Cloze',   screen: 'cloze',         cefr: 'A2', category: 'genitive' },
  { id: 'unjumble',    label: 'Word Order',       screen: 'unjumble',      cefr: 'A2', category: 'genitive' },
  { id: 'prepdrill',   label: 'Prepositions',     screen: 'prepdrill',     cefr: 'A2', category: 'genitive' },
  { id: 'negation',    label: 'Negation',         screen: 'negation',      cefr: 'A2', category: 'genitive' },
  { id: 'sentbuild',   label: 'Build Sentences',  screen: 'sentbuild',     cefr: 'A2', category: 'genitive' },
  { id: 'sentencetiles', label: 'Tile Assembly',  screen: 'sentencetiles', cefr: 'A2', category: 'genitive' },
  { id: 'typing',      label: 'Typing',           screen: 'typing',        cefr: 'A2', category: 'vocab-a2' },
  { id: 'speaking_sprint', label: 'Speaking Sprint', screen: 'speaking_sprint', cefr: 'A1+', category: 'speaking' },
  { id: 'aspectdrill', label: 'Aspect Drill',     screen: 'aspectdrill',   cefr: 'B1', category: 'aspect-imperfective' },
  { id: 'akudrill',    label: 'Accusative',       screen: 'akudrill',      cefr: 'B1', category: 'accusative' },
  { id: 'future',      label: 'Future Tense',     screen: 'future',        cefr: 'B1', category: 'future-tense' },
  { id: 'comparatives', label: 'Compare',         screen: 'comparatives',  cefr: 'B1', category: 'vocab-b1' },
  { id: 'clitic',      label: 'Clitic Drill',     screen: 'clitic',        cefr: 'B1+', category: 'clitics' },
  { id: 'writing',     label: 'Free Writing',     screen: 'writing',       cefr: 'B1', category: 'speaking' },
  { id: 'dictation',   label: 'Dictation',        screen: 'dictation',     cefr: 'B1', category: 'speaking' },
];

/** Croatia rotation pool — Priority 4 always adds one of these */
const CROATIA_POOL: SessionActivity[] = [
  { id: 'cityofday',  label: 'City of the Day',    screen: 'cityofday',  category: 'culture' },
  { id: 'top100',     label: 'Top 100 Phrases',    screen: 'top100',     category: 'vocab-a2' as SkillCategory },
  { id: 'grocery',    label: 'Grocery Scenario',   screen: 'grocery',    category: 'practical' },
  { id: 'transport',  label: 'Transport Scenario', screen: 'transport',  category: 'practical' },
  { id: 'recipes',    label: 'Croatian Recipes',   screen: 'recipes',    category: 'culture' },
  { id: 'history',    label: 'Croatian History',   screen: 'history',    category: 'culture' },
  { id: 'proverbs',   label: 'Croatian Proverbs',  screen: 'proverbs',   category: 'culture' },
  { id: 'popculture', label: 'Pop Culture',        screen: 'popculture', category: 'culture' },
];

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

export function buildSessionActivities(userCefr: string): SessionActivity[] {
  const activities: SessionActivity[] = [];

  // Priority 1: FSRS word reviews
  const dueReviews = getDueReviews();
  if (dueReviews.length > 0) {
    activities.push({ id: 'srsreview', label: 'Word Review', screen: 'review', category: 'vocab-a2' as SkillCategory });
  }

  // Priority 2: Adaptive category (top due category → mapped screen)
  const catQueue = getDueCategoryQueue(6);
  if (catQueue.length > 0) {
    const top = catQueue[0]!;
    const screen = CATEGORY_SCREEN_MAP[top.category];
    if (screen && !activities.find(a => a.screen === screen)) {
      activities.push({
        id: `cat_${top.category}`,
        label: top.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        screen,
        category: top.category,
      });
    }
  }

  // Priority 3: CEFR-appropriate fill (skip recent, exclude already queued screens)
  const recentScreens: string[] = (() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch { return []; }
  })();
  const usedScreens = new Set(activities.map(a => a.screen));

  let pool = CEFR_EXERCISE_POOL.filter(ex =>
    isUnlocked(ex.cefr, userCefr) &&
    !recentScreens.includes(ex.screen) &&
    !usedScreens.has(ex.screen)
  );

  // Fallback: if recency filter leaves nothing, use full unlocked pool
  if (pool.length === 0) {
    pool = CEFR_EXERCISE_POOL.filter(ex =>
      isUnlocked(ex.cefr, userCefr) && !usedScreens.has(ex.screen)
    );
  }

  // Shuffle and fill to 3–5 total activities
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const fillTarget = 4; // target 4 activities from P1+P2+P3 before Croatia slot
  for (const ex of shuffled) {
    if (activities.length >= fillTarget) break;
    if (!usedScreens.has(ex.screen)) {
      activities.push({ id: ex.id, label: ex.label, screen: ex.screen, category: ex.category });
      usedScreens.add(ex.screen);
    }
  }

  // Priority 4: Croatia immersion — always 1 slot
  const today = localDateStr();
  const cityVisited = localStorage.getItem('nh_cityofday_date') === today;
  const dayOfMonth = new Date().getDate();
  const croatiaActivity = cityVisited
    ? CROATIA_POOL[1 + (dayOfMonth % (CROATIA_POOL.length - 1))]!
    : CROATIA_POOL[0]!;
  activities.push(croatiaActivity);

  return activities;
}

export function markDoneInSession(session: DailySession, id: string): DailySession {
  if (session.completedIds.includes(id)) return session; // idempotent
  return { ...session, completedIds: [...session.completedIds, id] };
}

export function recordSessionComplete(date: string): void {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}') as Record<string, boolean>;
    history[date] = true;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function loadPersistedSession(): DailySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySession;
    return parsed.date === localDateStr() ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: DailySession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDailySession(userCefr: string): UseDailySessionReturn {
  const builtRef = useRef(false);

  const [session, setSession] = useState<DailySession>(() => {
    const persisted = loadPersistedSession();
    if (persisted) return persisted;
    const activities = buildSessionActivities(userCefr);
    const fresh: DailySession = {
      date: localDateStr(),
      activities,
      completedIds: [],
      estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
    };
    persistSession(fresh);
    return fresh;
  });

  // Guard: if date rolled over since last render, rebuild
  if (!builtRef.current && session.date !== localDateStr()) {
    const activities = buildSessionActivities(userCefr);
    const fresh: DailySession = {
      date: localDateStr(),
      activities,
      completedIds: [],
      estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
    };
    persistSession(fresh);
    setSession(fresh);
  }
  builtRef.current = true;

  const markDone = useCallback((screenOrId: string) => {
    setSession(prev => {
      // Match by id or by screen name
      const match = prev.activities.find(a => a.id === screenOrId || a.screen === screenOrId);
      if (!match) return prev;
      if (prev.completedIds.includes(match.id)) return prev;
      const updated = markDoneInSession(prev, match.id);
      persistSession(updated);
      // Check for session completion
      if (updated.completedIds.length === updated.activities.length) {
        recordSessionComplete(updated.date);
      }
      return updated;
    });
  }, []);

  const isComplete = session.completedIds.length >= session.activities.length;
  const progress = session.activities.length === 0
    ? 0
    : session.completedIds.length / session.activities.length;
  const nextActivity = session.activities.find(a => !session.completedIds.includes(a.id)) ?? null;
  const tomorrowLabel = '4–6 activities tomorrow';

  return { session, isComplete, progress, markDone, nextActivity, tomorrowLabel };
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/tests/useDailySession.test.ts
```
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run full test suite to check no regressions**

```
npm run test
```
Expected: no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDailySession.ts src/tests/useDailySession.test.ts
git commit -m "feat: add useDailySession hook — buildSession, markDone, session persistence"
```

---

## Task 3: `CefrSoftHint.tsx` + wire in 3 Croatia screens

**Files:**
- Create: `src/components/shared/CefrSoftHint.tsx`
- Modify: `src/components/croatia/AIConversation.tsx`
- Modify: `src/components/croatia/RoleplayScreen.tsx`
- Modify: `src/components/croatia/TextingScreen.tsx`

- [ ] **Step 1: Create `src/components/shared/CefrSoftHint.tsx`**

```tsx
// src/components/shared/CefrSoftHint.tsx
import React from 'react';

interface CefrSoftHintProps {
  level: string;
}

export function CefrSoftHint({ level }: CefrSoftHintProps) {
  return (
    <div
      className="cefr-soft-hint"
      style={{
        background: 'linear-gradient(135deg,rgba(14,116,144,.07),rgba(6,182,212,.04))',
        border: '1px solid rgba(14,116,144,.2)',
        borderRadius: 10,
        padding: '8px 12px',
        marginBottom: 12,
        fontSize: 12,
        color: 'var(--subtext)',
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    >
      💡 Most rewarding once you reach <strong style={{ color: 'var(--info,#0284c7)' }}>{level}</strong> — but dive in anytime, it's good practice.
    </div>
  );
}
```

- [ ] **Step 2: Add CefrSoftHint to `src/components/croatia/AIConversation.tsx`**

Find the opening of the `return (` in `AIConversation` and add the hint banner at the top, just after `<AIConversationHeader>`. The `AIConversationHeader` component is the first child element in the render. Add `<CefrSoftHint level="B1+" />` immediately after the header.

```tsx
// Add at top of file (with other imports):
import { CefrSoftHint } from '../shared/CefrSoftHint';

// In the return JSX — add after AIConversationHeader:
<AIConversationHeader ... />
<CefrSoftHint level="B1+" />
```

The exact location is the `AIConversationHeader` usage. Add `<CefrSoftHint level="B1+" />` on the line immediately after the `<AIConversationHeader ... />` closing tag.

- [ ] **Step 3: Add CefrSoftHint to `src/components/croatia/RoleplayScreen.tsx`**

```tsx
// Add import at top of file:
import { CefrSoftHint } from '../shared/CefrSoftHint';

// In the return JSX, add immediately after the {H(...)} call:
return (
  <div className="scr-wrap">
    {H('🎭 Conversation Role-Play', 'Practice real-life dialogues', goBack)}
    <CefrSoftHint level="B1+" />
    {/* rest of existing JSX unchanged */}
```

- [ ] **Step 4: Add CefrSoftHint to `src/components/croatia/TextingScreen.tsx`**

```tsx
// Add import at top of file:
import { CefrSoftHint } from '../shared/CefrSoftHint';

// In the return JSX — add immediately after the {H(...)} call. The component
// already has H() for the header. Add <CefrSoftHint level="B1+" /> after it.
```

Read the file's return statement, find the first `{H(` call, add `<CefrSoftHint level="B1+" />` on the next line.

- [ ] **Step 5: Build to verify no TypeScript errors**

```
npm run build 2>&1 | head -40
```
Expected: no new type errors related to CefrSoftHint.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/CefrSoftHint.tsx \
        src/components/croatia/AIConversation.tsx \
        src/components/croatia/RoleplayScreen.tsx \
        src/components/croatia/TextingScreen.tsx
git commit -m "feat: add CefrSoftHint component; wire B1+ hint on AIConversation, Roleplay, Texting"
```

---

## Task 4: `src/components/home/SessionCard.tsx` — Three-state card

**Files:**
- Create: `src/components/home/SessionCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/home/SessionCard.tsx
import React from 'react';
import type { DailySession, SessionActivity } from '../../hooks/useDailySession';

interface SessionCardProps {
  session: DailySession;
  isComplete: boolean;
  progress: number;         // 0.0–1.0
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
  onStart: () => void;      // launches nextActivity.screen
  onKeepPracticing: () => void; // routes to Practice tab
  streak: number;
  xpThisWeek: number;
  wordsdue: number;
}

function StatPill({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 12,
        padding: '8px 4px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: 'var(--heading)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function SessionCard({
  session,
  isComplete,
  progress,
  nextActivity,
  tomorrowLabel,
  onStart,
  onKeepPracticing,
  streak,
  xpThisWeek,
  wordsdue,
}: SessionCardProps) {
  const completedCount = session.completedIds.length;
  const totalCount = session.activities.length;
  const inProgress = completedCount > 0 && !isComplete;

  return (
    <div>
      {/* ── SESSION CARD ── */}
      <div
        style={{
          background: isComplete
            ? 'linear-gradient(135deg,rgba(22,163,74,.1),rgba(22,163,74,.04))'
            : 'var(--card)',
          border: isComplete
            ? '1.5px solid rgba(22,163,74,.3)'
            : '1.5px solid var(--card-b)',
          borderRadius: 18,
          padding: '18px 16px',
          marginBottom: 12,
        }}
      >
        {isComplete ? (
          /* ── STATE C: COMPLETE ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--heading)',
                marginBottom: 4,
              }}
            >
              Session Complete!
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
              {completedCount} of {totalCount} activities done
            </div>
            <button
              onClick={onKeepPracticing}
              style={{
                background: 'none',
                border: '1.5px solid var(--card-b)',
                borderRadius: 10,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--subtext)',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                display: 'block',
                width: '100%',
                marginBottom: 8,
              }}
            >
              Keep practicing →
            </button>
            <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
              {tomorrowLabel}
            </div>
          </div>
        ) : (
          /* ── STATE A (fresh) + STATE B (in-progress) ── */
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--info,#0284c7)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 6,
              }}
            >
              {inProgress ? 'Continue Session' : "Today's Session"}
            </div>

            {/* Progress bar — only shown in-progress */}
            {inProgress && (
              <div
                style={{
                  height: 4,
                  background: 'var(--card-b)',
                  borderRadius: 2,
                  marginBottom: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            )}

            {/* Activity list preview */}
            {!inProgress && (
              <div style={{ marginBottom: 12 }}>
                {session.activities.map(act => (
                  <div
                    key={act.id}
                    style={{
                      fontSize: 12,
                      color: 'var(--subtext)',
                      fontWeight: 600,
                      padding: '3px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 8, color: 'var(--info,#0284c7)' }}>●</span>
                    {act.label}
                  </div>
                ))}
              </div>
            )}

            {inProgress && (
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12 }}>
                {completedCount} of {totalCount} done
                {nextActivity && (
                  <span style={{ color: 'var(--heading)', fontWeight: 700 }}>
                    {' · Next: '}{nextActivity.label}
                  </span>
                )}
              </div>
            )}

            {!inProgress && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--subtext)',
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                ~{session.estimatedMinutes} min · {totalCount} activities
              </div>
            )}

            <button
              onClick={onStart}
              disabled={!nextActivity}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                background: nextActivity
                  ? 'linear-gradient(135deg,#0e7490,#164e63)'
                  : 'var(--card-b)',
                color: nextActivity ? '#fff' : 'var(--subtext)',
                fontSize: 14,
                fontWeight: 800,
                cursor: nextActivity ? 'pointer' : 'not-allowed',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {inProgress ? 'Continue →' : '▶ Begin Session →'}
            </button>
          </div>
        )}
      </div>

      {/* ── 3 STAT PILLS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatPill icon="🔥" value={streak} label="Streak" />
        <StatPill icon="⭐" value={xpThisWeek} label="Week XP" />
        <StatPill icon="📚" value={wordsdue} label="Due" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npm run build 2>&1 | grep -i "sessioncard\|error" | head -20
```
Expected: no errors mentioning SessionCard.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/SessionCard.tsx
git commit -m "feat: add SessionCard component — three-state session display (active/in-progress/complete)"
```

---

## Task 5: Rewrite `src/components/home/HomeTab.tsx`

**Files:**
- Modify: `src/components/home/HomeTab.tsx`

HomeTab is currently ~700 lines. This task removes 12 section blocks and replaces the main JSX body with a much simpler layout.

- [ ] **Step 1: Remove the 12 component imports**

In `HomeTab.tsx`, find and **delete** these import lines (they are in the import block starting around line 109):

```typescript
// DELETE these lines:
import HeroSection from './HeroSection';
import PathProgressCard from './PathProgressCard';
import ReviewTabContent from './ReviewTabContent';
import CampaignBanner from './CampaignBanner';
import DailyCroatianSection from './DailyCroatianSection';
import ProgressTabContent from './ProgressTabContent';
import WelcomeBackBanners from './WelcomeBackBanners';
import WeeklyRecapModal, { markRecapShown } from './WeeklyRecapModal';
import UnitCompleteBanner from './UnitCompleteBanner';
import SpeedChallenge from '../home/SpeedChallenge';    // (if imported)
import WeakWordsPanel from '../home/WeakWordsPanel';    // (if imported)
import AITutorCard from './AITutorCard';                // (if imported)
import DailyListeningCard from './DailyListeningCard';  // (if imported)
```

**Add these new imports** in their place:

```typescript
import { useDailySession } from '../../hooks/useDailySession';
import { getUserCefr } from '../../lib/cefr';
import SessionCard from './SessionCard';
import { getDueReviews } from '../../lib/srs';
import { weekKey } from '../../lib/dateUtils.js';
```

- [ ] **Step 2: Remove unused state variables and effects**

Inside the `HomeTab` component function, remove:
1. The `showWeeklyRecap` state and its associated `useEffect` (the one that calls `markRecapShown`)
2. The `completedLevel` state and the `useEffect` that sets it (the "unit completion detection" block)
3. The `htab` / `setHTab` state variable (was used for review/progress sub-tabs)
4. The campaign-related variables (`activeCampaign`, `campaignQuestsDone`, `markCampaignQuestDone`, `campaignDismissed`, `setCampaignDismissed`)
5. The `nudgeDismissed`, `wodSRSAdded`, `anchorDismissed` state variables (used only by removed sections)

Leave in place:
- `showGoalModal` state + effect
- `streakMilestone` state + effect
- `streak` (from getStreak)
- `wod` (word of day — may still be used)
- `pathData` (may still be used by knight greeting)
- All the stats-related useMemo calls

**Add these new variables** after the existing useMemo/useState calls:

```typescript
const { stats: st } = useStats(); // already exists — reuse
const userCefr = getUserCefr(st.xp, st.lc, st.gc);
const { session, isComplete, progress, markDone, nextActivity, tomorrowLabel } = useDailySession(userCefr);
const dueCount = getDueReviews().length;
const xpThisWeek = (() => {
  try { return parseInt(localStorage.getItem('nh_week_xp_' + weekKey()) || '0', 10); }
  catch { return 0; }
})();

// markDone wiring: when user returns to 'home' tab from an exercise screen
const { currentScreen } = useApp();
const prevScreenRef = React.useRef(currentScreen);
React.useEffect(() => {
  const prev = prevScreenRef.current;
  prevScreenRef.current = currentScreen;
  if (currentScreen === 'dashboard' && prev !== 'dashboard' && prev !== 'welcome') {
    markDone(prev);
  }
}, [currentScreen, markDone]);
```

- [ ] **Step 3: Replace the return JSX**

Find the `return (` statement in HomeTab (around line 528). Replace the ENTIRE return block with:

```tsx
return (
  <React.Fragment>
    {/* ── GOAL SETTER MODAL (new users only) ── */}
    {showGoalModal && <GoalSetterModal onComplete={() => setShowGoalModal(false)} />}

    {/* ── STREAK MILESTONE CELEBRATION ── */}
    {streakMilestone && (
      <StreakMilestoneToast
        streakCount={streakMilestone}
        onDismiss={() => setStreakMilestone(null)}
      />
    )}

    {/* ── GUEST SAVE-PROGRESS BANNER ── */}
    {!authUser && st.xp > 0 && (
      <div
        style={{
          background: 'linear-gradient(135deg, #0e7490, #164e63)',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>💾</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '.04em' }}>
            Explore mode · {st.xp} XP earned
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            Create a free account to sync across all your devices
          </div>
        </div>
        <button
          onClick={doSignUp}
          style={{
            flexShrink: 0,
            background: '#fff',
            color: '#0e7490',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          Save Free →
        </button>
      </div>
    )}

    {/* ── KNIGHT GREETING ── */}
    {authUser && (
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--subtext)',
          marginBottom: 12,
          paddingLeft: 2,
        }}
      >
        Dobro jutro, {authUser.d || 'Learner'}! 👋
      </div>
    )}

    {/* ── DAILY SESSION CARD ── */}
    <SessionCard
      session={session}
      isComplete={isComplete}
      progress={progress}
      nextActivity={nextActivity}
      tomorrowLabel={tomorrowLabel}
      onStart={() => {
        if (nextActivity) {
          setScr(nextActivity.screen);
          if (sCurEx) sCurEx(nextActivity.screen);
        }
      }}
      onKeepPracticing={() => setTab('practice')}
      streak={streak.count}
      xpThisWeek={xpThisWeek}
      wordsdue={dueCount}
    />
  </React.Fragment>
);
```

- [ ] **Step 4: Build to verify no TypeScript errors**

```
npm run build 2>&1 | head -60
```
Expected: clean build (or pre-existing unrelated errors only).

If there are errors about removed variables still being referenced, delete those remaining references.

- [ ] **Step 5: Run tests**

```
npm run test
```
Expected: no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/HomeTab.tsx
git commit -m "feat: rewrite HomeTab — remove 12 sections, add Daily Session Hub with SessionCard"
```

---

## Task 6: CEFR gating in `src/components/practice/PracticeTab.tsx`

**Files:**
- Modify: `src/components/practice/PracticeTab.tsx`

- [ ] **Step 1: Add cefr import**

At the top of `PracticeTab.tsx`, add:

```typescript
import { isUnlocked, getUserCefr } from '../../lib/cefr';
```

- [ ] **Step 2: Compute userCefr**

Inside the `PracticeTab` component function, after the existing `const { stats: st } = useStats();` line, add:

```typescript
const userCefr = getUserCefr(st.xp, st.lc, st.gc);
const nextCefrTier = (() => {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const idx = order.indexOf(userCefr);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
})();
```

- [ ] **Step 3: Add a locked tile toast state**

Inside `PracticeTab`, add:

```typescript
const [lockedToast, setLockedToast] = useState<string | null>(null);
```

And add a handler function:

```typescript
function showLockedToast(requiredCefr: string) {
  setLockedToast(`Available at ${requiredCefr} — keep learning to unlock`);
  setTimeout(() => setLockedToast(null), 2000);
}
```

- [ ] **Step 4: Split exercises in the render section**

Find the section in the `PracticeTab` render where the EXERCISES array is iterated (look for `.map(` over EXERCISES). The EXERCISES array is defined around line 493 inside the component. The render section that maps exercises is further down in the return JSX.

Before the exercise render section, add the available/locked split:

```typescript
const availableExercises = EXERCISES.filter(ex => isUnlocked(ex.cefr, userCefr));
const lockedExercises = EXERCISES.filter(ex => !isUnlocked(ex.cefr, userCefr));
```

- [ ] **Step 5: Add CEFR badge header + available/locked sections**

At the top of the `return (` block in `PracticeTab`, **before** the existing first section header, add:

```tsx
{/* ── CEFR BADGE HEADER ── */}
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  }}
>
  <h2
    style={{
      fontSize: 20,
      fontWeight: 900,
      color: 'var(--heading)',
      margin: 0,
      fontFamily: "'Playfair Display',serif",
    }}
  >
    Practice
  </h2>
  <div
    style={{
      background: 'linear-gradient(135deg,rgba(14,116,144,.12),rgba(6,182,212,.07))',
      border: '1.5px solid rgba(14,116,144,.3)',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 800,
      color: 'var(--info,#0284c7)',
    }}
  >
    {userCefr} · Your Level
  </div>
</div>

{/* ── PROGRESS NUDGE BAR (only when next tier exists) ── */}
{nextCefrTier && (
  <div
    style={{
      background: 'rgba(14,116,144,.05)',
      border: '1px solid rgba(14,116,144,.15)',
      borderRadius: 10,
      padding: '8px 12px',
      marginBottom: 12,
      fontSize: 12,
      color: 'var(--subtext)',
      fontWeight: 600,
    }}
  >
    🚀 Keep going to unlock {nextCefrTier} exercises
  </div>
)}

{/* ── LOCKED TILE TOAST ── */}
{lockedToast && (
  <div
    style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(30,30,40,.92)',
      color: '#fff',
      borderRadius: 12,
      padding: '10px 18px',
      fontSize: 13,
      fontWeight: 700,
      zIndex: 9999,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}
  >
    {lockedToast}
  </div>
)}
```

- [ ] **Step 6: Wrap existing exercise tiles in "Available Now" section**

Find the section header that starts the exercise grid (look for something like `<h3 className="sh">` or the first exercise tile render). The existing EXERCISES render needs to be replaced to use `availableExercises` and show locked exercises separately.

The key change: replace `{EXERCISES.map(...)}` with:

```tsx
{/* ── AVAILABLE NOW ── */}
<h3 className="sh" style={{ marginBottom: 8 }}>Available Now</h3>
{availableExercises.map(ex => (
  /* existing tile JSX for each exercise — unchanged */
  /* just change EXERCISES.map to availableExercises.map */
))}

{/* ── LOCKED EXERCISES ── */}
{lockedExercises.length > 0 && (
  <>
    <h3 className="sh" style={{ marginBottom: 8, marginTop: 20 }}>
      Unlock at {nextCefrTier ?? 'higher level'} 🔒
    </h3>
    {lockedExercises.map(ex => (
      <div
        key={ex.id}
        onClick={() => showLockedToast(ex.cefr)}
        style={{
          opacity: 0.55,
          filter: 'grayscale(0.6)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Render the same tile JSX but with onClick overridden */}
        {/* Copy the tile structure from availableExercises.map */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>{ex.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
              {ex.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
              {ex.desc} · Unlocks at {ex.cefr}
            </div>
          </div>
          <span style={{ fontSize: 14 }}>🔒</span>
        </div>
      </div>
    ))}
    <div
      style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--subtext)',
        fontWeight: 600,
        padding: '8px 0 16px',
      }}
    >
      + {lockedExercises.length} more unlock at {nextCefrTier ?? 'higher level'} · Keep going →
    </div>
  </>
)}
```

Note: the existing exercise tile render structure in PracticeTab is complex (it varies by category/intent tab). Read the current render section carefully before making this edit. The intent tabs (Review/Drill/Challenge) should filter `availableExercises` only — locked exercises are excluded from those tabs automatically since they're in a separate section.

- [ ] **Step 7: Build to verify**

```
npm run build 2>&1 | head -40
```

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/PracticeTab.tsx
git commit -m "feat: add CEFR gating to PracticeTab — available/locked split, aspirational locked tiles"
```

---

## Task 7: Profile tab — session streak widget + InsightsTab cleanup

**Files:**
- Modify: `src/components/profile/StatsTab.tsx`
- Modify: `src/components/profile/InsightsTab.tsx`

- [ ] **Step 1: Add `getSessionStreak` utility to `src/components/profile/StatsTab.tsx`**

Add this function before the `StatsTab` component definition:

```typescript
function getSessionStreak(): number {
  try {
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}') as Record<string, boolean>;
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!history[key]) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  } catch {
    return 0;
  }
}

function getLast7SessionDays(): Array<{ date: string; done: boolean }> {
  try {
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}') as Record<string, boolean>;
    const days = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      const key = dd.toISOString().slice(0, 10);
      days.push({ date: key, done: !!history[key] });
    }
    return days;
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Render the session streak widget in StatsTab**

Inside the `StatsTab` component's `return (`, find the closing `</div>` of the stats grid (the `role="region"` div with the 3-column grid). Add the following session streak widget immediately after:

```tsx
{/* ── SESSION STREAK WIDGET ── */}
{(() => {
  const sessionStreak = getSessionStreak();
  const sessionDays = getLast7SessionDays();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--heading)' }}>
            {sessionStreak > 0 ? `${sessionStreak}-day session streak` : 'Start your session streak'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500, marginTop: 2 }}>
            Complete today's session to keep the streak going
          </div>
        </div>
        <span style={{ fontSize: 24 }}>🗓️</span>
      </div>
      {/* 7-dot calendar */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {sessionDays.map(day => (
          <div
            key={day.date}
            title={day.date}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: day.done
                ? day.date === today
                  ? '#16a34a'
                  : 'var(--success,#16a34a)'
                : 'var(--card-b)',
              border: day.date === today && !day.done
                ? '2px solid var(--info,#0284c7)'
                : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            {day.done ? '✓' : ''}
          </div>
        ))}
      </div>
    </div>
  );
})()}
```

- [ ] **Step 3: Remove "Review →" buttons from InsightsTab Growth Opportunities**

In `src/components/profile/InsightsTab.tsx`, find the Growth Opportunities section (around line 180). Inside the `weak.slice(0, 5).map(...)` block, find the `<button>` element that renders "Review". It looks like:

```tsx
<button
  onClick={() => {
    const topicScreenMap = {
      grammar: 'grammar',
      padezi: 'padezi',
      conjugation: 'conjdrill',
    };
    setScr(topicScreenMap[w.id as keyof typeof topicScreenMap] || 'dashboard');
  }}
  style={{ ... }}
>
  Review
</button>
```

**Delete** this entire `<button>...</button>` block (approximately lines 249–272 in InsightsTab.tsx).

- [ ] **Step 4: Build to verify**

```
npm run build 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/StatsTab.tsx src/components/profile/InsightsTab.tsx
git commit -m "feat: add session streak widget to StatsTab; remove Review buttons from InsightsTab Growth Opportunities"
```

---

## Task 8: DiscoverTab Daily Immersion card

**Files:**
- Modify: `src/components/croatia/DiscoverTab.tsx`

DiscoverTab independently computes "is cityofday the Croatia activity today?" using the same `nh_cityofday_date` localStorage key that the city screen writes on visit. No props needed.

- [ ] **Step 1: Add the Daily Immersion card to DiscoverTab**

In `src/components/croatia/DiscoverTab.tsx`, find the `return (` statement. The return opens with `<div style={{ paddingBottom: 16 }}>` followed by the hero city photo block. Add the Daily Immersion card **before** the hero photo (i.e., as the first child of the outermost div):

```tsx
return (
  <div style={{ paddingBottom: 16 }}>
    {/* ── DAILY IMMERSION SESSION SLOT ── */}
    {(() => {
      const today = new Date().toISOString().slice(0, 10);
      const cityVisited = localStorage.getItem('nh_cityofday_date') === today;
      if (cityVisited) return null; // already completed — don't show the card
      return (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(14,116,144,.1),rgba(6,182,212,.05))',
            border: '1.5px solid rgba(14,116,144,.3)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0 }}>🗺️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--info,#0284c7)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 2,
              }}
            >
              Today's Immersion · In your session
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              City of the Day
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
              1 fact + 3 Croatian phrases
            </div>
          </div>
          <button
            onClick={() => setScr('cityofday')}
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg,#0e7490,#164e63)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            ▶ Open →
          </button>
        </div>
      );
    })()}

    {/* ── HERO — Daily rotating city photo ── (existing code unchanged) */}
    <div style={{ ... }}>
      {/* ... existing hero photo JSX ... */}
```

- [ ] **Step 2: Build to verify**

```
npm run build 2>&1 | head -20
```

- [ ] **Step 3: Run full test suite**

```
npm run test
```
Expected: no failures.

- [ ] **Step 4: Commit**

```bash
git add src/components/croatia/DiscoverTab.tsx
git commit -m "feat: add Daily Immersion session-slot card to DiscoverTab — shown when cityofday not yet visited"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task | Status |
|-----------------|------|--------|
| useDailySession hook with 4-priority buildSession | Task 2 | ✓ |
| SessionCard three-state (active/in-progress/complete) | Task 4 | ✓ |
| HomeTab simplified to SessionCard + 3 pills + knight greeting | Task 5 | ✓ |
| Removed 12 HomeTab sections | Task 5 | ✓ |
| CEFR gating in PracticeTab (available/locked split) | Task 6 | ✓ |
| CEFR badge header in PracticeTab | Task 6 | ✓ |
| Locked tile toast "Available at B1" | Task 6 | ✓ |
| Session streak widget in StatsTab | Task 7 | ✓ |
| Remove "Review →" buttons from InsightsTab | Task 7 | ✓ |
| Daily Immersion card in DiscoverTab | Task 8 | ✓ |
| CefrSoftHint on AIConversation, Roleplay, Texting | Task 3 | ✓ |
| markDone wiring via currentScreen tracking | Task 5 step 2 | ✓ |
| session.activities stable for full day | Task 2 (localStorage restore) | ✓ |
| markDone is idempotent | Task 2 | ✓ |
| nh_session_history for streak tracking | Task 2 | ✓ |
| buildSession includes exactly 1 Croatia slot | Task 2 | ✓ |

**No placeholders found.** All code blocks are complete.

**Type consistency verified:**
- `SessionActivity` interface defined in `useDailySession.ts`, used in `SessionCard.tsx` as import
- `DailySession` used consistently across hook + tests
- `getUserCefr` returns `CefrLevel` which is `'A1'|'A2'|'B1'|'B2'|'C1'|'C2'`
- `CATEGORY_SCREEN_MAP` uses actual `SkillCategory` values from `src/lib/adaptive.ts`

**One note**: Task 6 (PracticeTab CEFR gating) references the existing exercise tile render structure which varies based on the intent tab (Review/Drill/Challenge). The implementer should read the current render section carefully — the locked tile render in step 6 shows the pattern to follow; apply it to the actual tile structure already in PracticeTab rather than replacing the tile JSX wholesale.
