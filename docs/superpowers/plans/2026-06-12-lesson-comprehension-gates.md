# Lesson Comprehension Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A grammar lesson counts as complete only when the learner scores ≥75% on an end-of-lesson check (with retry), replacing the "20s dwell = complete" LEARN_PATH fallback for those lessons.

**Architecture:** One pure pass-rule module (`lessonGate.ts`) + a `completeLesson` helper that writes the completion flag/credit only when passed; existing lesson quizzes route their completion through it; the 4 passive grammar lessons get a reusable `<LessonQuiz>`; gated screen ids are removed from `BLACK_HOLE_SCREENS`.

**Tech Stack:** React + TypeScript (Vite), Vitest. Behind no flag (additive; existing completions preserved).

---

## Design reference
Spec: `docs/superpowers/specs/2026-06-12-lesson-comprehension-gates-design.md`. Read it first.

## Conventions
- Branch: `feat/lesson-comprehension-gates` (already created off master).
- Tests: `npx vitest run <path>`; all: `npm test`; typecheck: `npm run typecheck`; lint: `npm run lint`; build: `npm run build` (`rm -rf dist` first if EPERM on Dropbox).
- Husky pre-commit lints staged files (eslint max-warnings=0) + prettier. No inline `import()` type annotations in tests — use top-level `import type * as X`.
- Stats come from `useStats()` → `{ stats, setStats, writeDelta }`. Completion gate `ck()` (LEARN_PATH) treats a lesson done when its screen id is in `stats.vs`. `award(xp, celebrate?, activityType?)` is passed as a prop to screens. `markQuest(kind)` from `'../../lib/quests'`.
- The dwell-credit list is `BLACK_HOLE_SCREENS` in `src/hooks/useScreenLauncher.ts:65-135`; the dwell timer is in `launchPathItem` (~635-668).

## File structure
**Create:** `src/lib/lessonGate.ts`, `src/lib/__tests__/lessonGate.test.ts`, `src/hooks/useLessonCompletion.ts`, `src/components/learn/LessonQuiz.tsx`, `src/tests/lessonQuiz.test.tsx`, `src/lib/lessonQuizBanks.ts` (authored questions for passive lessons), `src/lib/__tests__/lessonQuizBanks.test.ts`.
**Modify:** `DeclensionScreen.tsx`, `TensesScreen.tsx`, `ConditionalScreen.tsx`, `ImpersonalScreen.tsx`, `FormalRegisterScreen.tsx`, `FutureTenseLessonScreen.tsx` (route completion through gate); `AspectScreen.tsx`, `WordFormScreen.tsx`, `DiminutivesScreen.tsx`, `PhonologyScreen.tsx` (add `<LessonQuiz>`); `src/hooks/useScreenLauncher.ts` (remove gated ids from `BLACK_HOLE_SCREENS`); `src/tests/<screenLauncher test>` (assert removal).

---

## PHASE 0 — Foundation

### Task 1: Pass-rule module

**Files:** Create `src/lib/lessonGate.ts`, `src/lib/__tests__/lessonGate.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/__tests__/lessonGate.test.ts
import { describe, it, expect } from 'vitest';
import { LESSON_PASS_THRESHOLD, passedLesson, lessonScorePct } from '../lessonGate';

describe('lessonGate', () => {
  it('threshold is 0.75', () => {
    expect(LESSON_PASS_THRESHOLD).toBe(0.75);
  });
  it('passes at or above 75%', () => {
    expect(passedLesson(6, 8)).toBe(true); // 0.75
    expect(passedLesson(8, 8)).toBe(true);
  });
  it('fails below 75%', () => {
    expect(passedLesson(5, 8)).toBe(false); // 0.625
    expect(passedLesson(0, 5)).toBe(false);
  });
  it('zero-total never passes', () => {
    expect(passedLesson(0, 0)).toBe(false);
    expect(lessonScorePct(0, 0)).toBe(0);
  });
  it('lessonScorePct returns the ratio', () => {
    expect(lessonScorePct(3, 4)).toBe(0.75);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/__tests__/lessonGate.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
// src/lib/lessonGate.ts
// Single source of the lesson "comprehension gate" pass rule. Pure; no React/storage.
export const LESSON_PASS_THRESHOLD = 0.75;

export function lessonScorePct(score: number, total: number): number {
  return total > 0 ? score / total : 0;
}

export function passedLesson(score: number, total: number): boolean {
  return total > 0 && score / total >= LESSON_PASS_THRESHOLD;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/__tests__/lessonGate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/lessonGate.ts src/lib/__tests__/lessonGate.test.ts
git commit -m "feat(lessons): lessonGate pass-rule module (75% threshold)"
```

---

### Task 2: `completeLesson` helper

**Files:** Create `src/hooks/useLessonCompletion.ts`, `src/tests/useLessonCompletion.test.ts`

The helper centralizes the completion write. It is a pure function taking the stats accessors + award as args (not a hook) so it is trivially testable and callable from any screen's button handler.

- [ ] **Step 1: Write the failing test**
```ts
// src/tests/useLessonCompletion.test.ts
import { describe, it, expect, vi } from 'vitest';
import { completeLesson } from '../hooks/useLessonCompletion';

function harness(initialVs: string[] = []) {
  let stats = { vs: [...initialVs], lc: 0, gc: 0 };
  return {
    getStats: () => stats,
    setStats: (fn: (p: typeof stats) => typeof stats) => { stats = fn(stats); },
    writeDelta: vi.fn(),
    award: vi.fn(),
  };
}

describe('completeLesson', () => {
  it('writes completion + awards only when passed (>=75%)', () => {
    const h = harness();
    const res = completeLesson({
      screenId: 'declension', statKind: 'gc', score: 8, total: 8, xp: 30,
      questKind: 'grammar', stats: h.getStats(), setStats: h.setStats, writeDelta: h.writeDelta, award: h.award,
    });
    expect(res.passed).toBe(true);
    expect(h.getStats().vs).toContain('declension');
    expect(h.getStats().gc).toBe(1);
    expect(h.writeDelta).toHaveBeenCalledWith({ gc: 1, vs: ['declension'] });
    expect(h.award).toHaveBeenCalledWith(30, false, 'lesson');
  });

  it('writes nothing when failed (<75%)', () => {
    const h = harness();
    const res = completeLesson({
      screenId: 'declension', statKind: 'gc', score: 4, total: 8, xp: 30,
      questKind: 'grammar', stats: h.getStats(), setStats: h.setStats, writeDelta: h.writeDelta, award: h.award,
    });
    expect(res.passed).toBe(false);
    expect(h.getStats().vs).not.toContain('declension');
    expect(h.getStats().gc).toBe(0);
    expect(h.writeDelta).not.toHaveBeenCalled();
    expect(h.award).not.toHaveBeenCalled();
  });

  it('is idempotent — no double credit if already completed', () => {
    const h = harness(['declension']);
    completeLesson({
      screenId: 'declension', statKind: 'gc', score: 8, total: 8, xp: 30,
      questKind: 'grammar', stats: h.getStats(), setStats: h.setStats, writeDelta: h.writeDelta, award: h.award,
    });
    expect(h.getStats().gc).toBe(0); // already in vs → no increment
    expect(h.writeDelta).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/useLessonCompletion.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
// src/hooks/useLessonCompletion.ts
import { passedLesson } from '../lib/lessonGate';
import { markQuest } from '../lib/quests';

interface LessonStats {
  vs?: string[];
  lc?: number;
  gc?: number;
}
interface CompleteArgs {
  screenId: string;
  statKind: 'lc' | 'gc';
  score: number;
  total: number;
  xp: number;
  questKind?: string;
  stats: LessonStats;
  setStats: (fn: (prev: LessonStats) => LessonStats) => void;
  writeDelta?: (delta: Record<string, unknown>) => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

// Marks a lesson complete (vs flag + lc/gc + XP + quest) ONLY when the learner
// passed (>=75%). Idempotent: no double credit if screenId already in vs. Returns
// { passed } so the caller can show pass/fail + Retry UI.
export function completeLesson(args: CompleteArgs): { passed: boolean } {
  const { screenId, statKind, score, total, xp, questKind, stats, setStats, writeDelta, award } = args;
  const passed = passedLesson(score, total);
  if (!passed) return { passed: false };
  if (stats.vs?.includes(screenId)) return { passed: true }; // already credited
  setStats((prev) => {
    if (prev.vs?.includes(screenId)) return prev;
    return {
      ...prev,
      [statKind]: (prev[statKind] || 0) + 1,
      vs: [...(prev.vs || []), screenId],
    };
  });
  if (writeDelta) writeDelta({ [statKind]: 1, vs: [screenId] });
  if (award) award(xp, false, 'lesson');
  if (questKind) markQuest(questKind);
  return { passed: true };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/tests/useLessonCompletion.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add src/hooks/useLessonCompletion.ts src/tests/useLessonCompletion.test.ts
git commit -m "feat(lessons): completeLesson gate helper (pass-only credit, idempotent)"
```

---

### Task 3: Reusable `<LessonQuiz>`

**Files:** Create `src/components/learn/LessonQuiz.tsx`, `src/tests/lessonQuiz.test.tsx`

- [ ] **Step 1: Write the failing test**
```tsx
// src/tests/lessonQuiz.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonQuiz from '../components/learn/LessonQuiz';

vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { vs: [], lc: 0, gc: 0 }, setStats: vi.fn(), writeDelta: vi.fn() }),
}));

const questions = [
  { prompt: 'Q1', options: ['a', 'b'], correctIdx: 0 },
  { prompt: 'Q2', options: ['a', 'b'], correctIdx: 1 },
  { prompt: 'Q3', options: ['a', 'b'], correctIdx: 0 },
  { prompt: 'Q4', options: ['a', 'b'], correctIdx: 1 },
];

function answerAll(pick: (i: number) => number) {
  for (let i = 0; i < questions.length; i++) {
    const opts = screen.getAllByTestId('lessonquiz-option');
    fireEvent.click(opts[pick(i)]!);
    const next = screen.queryByTestId('lessonquiz-next');
    if (next) fireEvent.click(next);
  }
}

describe('LessonQuiz', () => {
  it('does NOT complete below 75% (Retry shown, award not called)', () => {
    const award = vi.fn();
    render(<LessonQuiz screenId="aspect" statKind="gc" questions={questions} xp={20} award={award} goBack={vi.fn()} />);
    answerAll(() => 0); // always pick option 0 → 2/4 = 50%
    expect(screen.getByTestId('lessonquiz-retry')).toBeTruthy();
    expect(award).not.toHaveBeenCalled();
  });

  it('completes at 100% (award called once)', () => {
    const award = vi.fn();
    render(<LessonQuiz screenId="aspect" statKind="gc" questions={questions} xp={20} award={award} goBack={vi.fn()} />);
    answerAll((i) => questions[i]!.correctIdx); // all correct
    expect(award).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('lessonquiz-retry')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/lessonQuiz.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```tsx
// src/components/learn/LessonQuiz.tsx
import React, { useMemo, useState } from 'react';
import { H, sh } from '../../data';
import { useStats } from '../../context/StatsContext';
import { completeLesson } from '../../hooks/useLessonCompletion';
import { LESSON_PASS_THRESHOLD, lessonScorePct } from '../../lib/lessonGate';

export interface LessonQuizQuestion {
  prompt: string;
  options: string[];
  correctIdx: number;
  note?: string;
}
interface Props {
  screenId: string;
  statKind: 'lc' | 'gc';
  questions: LessonQuizQuestion[];
  xp: number;
  questKind?: string;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  goBack: () => void;
  title?: string;
}

export default function LessonQuiz({ screenId, statKind, questions, xp, questKind, award, goBack, title }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to reshuffle on retry

  const q = questions[i];
  const total = questions.length;

  if (done || !q) {
    const passed = score / total >= LESSON_PASS_THRESHOLD;
    // Fire the gated completion exactly once when the results screen renders.
    if (done) {
      completeLesson({ screenId, statKind, score, total, xp, questKind, stats, setStats, writeDelta, award });
    }
    const pct = Math.round(lessonScorePct(score, total) * 100);
    return (
      <div className="scr-wrap">
        {H(title || '📝 Check', '', goBack)}
        <div style={{ textAlign: 'center', padding: '32px 16px' }} data-testid="lessonquiz-result">
          <div style={{ fontSize: 48 }}>{passed ? '🏆' : '💪'}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{score}/{total} · {pct}%</div>
          <div style={{ fontSize: 13, color: '#78716c', margin: '8px 0 20px' }}>
            {passed ? 'Passed — lesson complete!' : `Not passed — need ${Math.round(LESSON_PASS_THRESHOLD * 100)}%. Review and try again.`}
          </div>
          {passed ? (
            <button className="b bp" style={{ width: '100%' }} onClick={goBack}>✓ Done</button>
          ) : (
            <button
              className="b bp"
              style={{ width: '100%' }}
              data-testid="lessonquiz-retry"
              onClick={() => { setI(0); setScore(0); setAnswered(null); setDone(false); setAttempt((a) => a + 1); }}
            >
              ↻ Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Shuffle option order per question per attempt while tracking the correct one.
  const opts = useMemo(() => {
    const idx = q.options.map((_, k) => k);
    const order = sh(idx) as number[];
    return order.map((k) => ({ text: q.options[k]!, correct: k === q.correctIdx }));
  }, [q, attempt]);

  function choose(k: number) {
    if (answered !== null) return;
    setAnswered(k);
    if (opts[k]!.correct) setScore((s) => s + 1);
  }
  function next() {
    setAnswered(null);
    if (i < total - 1) setI(i + 1);
    else setDone(true);
  }

  return (
    <div className="scr-wrap">
      {H(title || '📝 Check', `${i + 1} / ${total}`, goBack)}
      <div className="c" style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>{q.prompt}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {opts.map((o, k) => (
          <button
            key={k}
            data-testid="lessonquiz-option"
            className={'ob ' + (answered !== null ? (o.correct ? 'ok' : answered === k ? 'no' : '') : '')}
            onClick={() => choose(k)}
          >
            {o.text}
          </button>
        ))}
      </div>
      {answered !== null && (
        <button className="b bp" style={{ width: '100%', marginTop: 16 }} data-testid="lessonquiz-next" onClick={next}>
          {i < total - 1 ? 'Next →' : 'See result'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/tests/lessonQuiz.test.tsx`
Expected: PASS. (If the `useMemo`-after-early-return lint/hook-order complains, move the `opts` useMemo above the `if (done)` block and guard on `q`.)

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npm run typecheck && npx eslint src/components/learn/LessonQuiz.tsx`
Expected: PASS, 0 warnings.
```bash
git add src/components/learn/LessonQuiz.tsx src/tests/lessonQuiz.test.tsx
git commit -m "feat(lessons): reusable LessonQuiz with 75% completion gate + retry"
```

> Note on hook order: React requires hooks before any early return. In Step 3 the `opts` useMemo sits after the `if (done || !q)` return — MOVE it above that block during implementation (compute `q` first, then the memo guarded by `if (!q) return []`), then render. Verify the component test passes after the move.

---

## PHASE 1 — Gate existing-quiz lessons

### Task 4: Gate DeclensionScreen (exemplar — full before/after)

**Files:** Modify `src/components/learn/DeclensionScreen.tsx`

- [ ] **Step 1: Gate the completion write + award; add Retry.** In the `if (quizDone)` results block (~lines 221-277), replace the unconditional `award` (currently fired earlier, ~line 98-99) and the `✓ Done` button's `setStats/writeDelta` with the helper, gated on pass.

Replace the `✓ Done` button (lines ~254-273) with:
```tsx
            {(() => {
              const passed = score / questions.length >= LESSON_PASS_THRESHOLD;
              return passed ? (
                <button
                  className="b bp"
                  style={{ flex: 1 }}
                  onClick={() => {
                    completeLesson({
                      screenId: 'declension', statKind: 'gc',
                      score, total: questions.length, xp: score * 4 + 10, questKind: 'grammar',
                      stats, setStats, writeDelta, award,
                    });
                    goBack();
                  }}
                >
                  ✓ Done
                </button>
              ) : (
                <button
                  className="b bp"
                  style={{ flex: 1 }}
                  onClick={() => { setMode('reference'); }}
                >
                  ↻ Review &amp; retry
                </button>
              );
            })()}
```
And REMOVE the unconditional `award(score * 4 + 10, …)` at ~line 99 (the helper now awards on pass only). Add imports:
```ts
import { completeLesson } from '../../hooks/useLessonCompletion';
import { LESSON_PASS_THRESHOLD } from '../../lib/lessonGate';
```
Update the results message/XP line to only promise XP when `pct >= 0.75`.

- [ ] **Step 2: Typecheck + manual check**

Run: `npm run typecheck`
Expected: PASS. Confirm: below 75% the `vs:['declension']` write no longer happens (grep the file — the only `vs: [...'declension']` write is inside `completeLesson`).

- [ ] **Step 3: Commit**
```bash
git add src/components/learn/DeclensionScreen.tsx
git commit -m "feat(lessons): gate DeclensionScreen completion at 75% (retry on fail)"
```

### Task 5: Gate the other existing-quiz lessons

**Files:** Modify `TensesScreen.tsx`, `ConditionalScreen.tsx`, `ImpersonalScreen.tsx`, `FormalRegisterScreen.tsx`, `FutureTenseLessonScreen.tsx`

Each of these has the SAME pattern as DeclensionScreen: a quiz-done results screen that (a) awards XP unconditionally and (b) writes `vs:['<screenId>']` + a stat increment on a Done button. Apply the identical transform from Task 4 to each, using these exact parameters (preserve each screen's existing XP formula and stat kind — do NOT invent new ones; read the file's current `award(...)` call and `vs:[...]`/`lc|gc` write to get them):

| Screen file | screenId | statKind (its existing vs/stat) |
|---|---|---|
| TensesScreen.tsx | `tenses` | `gc` |
| ConditionalScreen.tsx | `conditional` | `gc` |
| ImpersonalScreen.tsx | `impersonal` | `gc` |
| FormalRegisterScreen.tsx | `formalregister` | `gc` |
| FutureTenseLessonScreen.tsx | `future_tense_lesson` | `gc` |

- [ ] **Step 1: For EACH screen:** add the two imports (`completeLesson`, `LESSON_PASS_THRESHOLD`); replace the results-screen completion (`vs` write + stat increment) and the unconditional `award` with a `completeLesson({ screenId, statKind, score, total, xp: <existing formula>, questKind: 'grammar', stats, setStats, writeDelta, award })` call gated behind `score/total >= LESSON_PASS_THRESHOLD`, and show a Review/Retry button otherwise. Verify each screenId/statKind against the file's existing `vs:[...]` write before editing (if a screen uses `lc`, use `lc`).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify no ungated completion remains**

Run: `grep -nE "vs: \[.*'(tenses|conditional|impersonal|formalregister|future_tense_lesson)'" src/components/learn/*.tsx`
Expected: every match is inside a `completeLesson` call (no raw ungated `vs` writes left).

- [ ] **Step 4: Commit**
```bash
git add src/components/learn/TensesScreen.tsx src/components/learn/ConditionalScreen.tsx src/components/learn/ImpersonalScreen.tsx src/components/learn/FormalRegisterScreen.tsx src/components/learn/FutureTenseLessonScreen.tsx
git commit -m "feat(lessons): gate tenses/conditional/impersonal/formalregister/future-tense at 75%"
```

---

## PHASE 2 — Passive grammar lessons get a gate

### Task 6: Author question banks (≥5 each)

**Files:** Create `src/lib/lessonQuizBanks.ts`, `src/lib/__tests__/lessonQuizBanks.test.ts`

- [ ] **Step 1: Write the data-shape test**
```ts
// src/lib/__tests__/lessonQuizBanks.test.ts
import { describe, it, expect } from 'vitest';
import { LESSON_QUIZ_BANKS } from '../lessonQuizBanks';

describe('LESSON_QUIZ_BANKS', () => {
  const ids = ['aspect', 'wordform', 'diminutives', 'phonology'];
  it('has a bank of >=5 questions for each passive lesson', () => {
    for (const id of ids) {
      const bank = LESSON_QUIZ_BANKS[id];
      expect(bank, id).toBeDefined();
      expect(bank.length, id).toBeGreaterThanOrEqual(5);
    }
  });
  it('every question is well-formed (>=2 options, exactly one valid correctIdx, no empties)', () => {
    for (const id of ids) {
      for (const q of LESSON_QUIZ_BANKS[id]!) {
        expect(q.prompt.trim(), id).not.toBe('');
        expect(q.options.length, `${id}: ${q.prompt}`).toBeGreaterThanOrEqual(2);
        expect(q.options.every((o) => o.trim() !== ''), `${id}: ${q.prompt}`).toBe(true);
        expect(q.correctIdx, `${id}: ${q.prompt}`).toBeGreaterThanOrEqual(0);
        expect(q.correctIdx, `${id}: ${q.prompt}`).toBeLessThan(q.options.length);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/__tests__/lessonQuizBanks.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement — author the banks.** Read each lesson screen's content (`AspectScreen.tsx`, `WordFormScreen.tsx`, `DiminutivesScreen.tsx`, `PhonologyScreen.tsx`) and write ≥5 MCQs drawn from that content. Use literal Croatian (UTF-8). Example shape (aspect shown in full; author wordform/diminutives/phonology the same way from their screens' content):
```ts
// src/lib/lessonQuizBanks.ts
import type { LessonQuizQuestion } from '../components/learn/LessonQuiz';

export const LESSON_QUIZ_BANKS: Record<string, LessonQuizQuestion[]> = {
  aspect: [
    { prompt: 'Which aspect describes a completed, one-off action?', options: ['Imperfective', 'Perfective'], correctIdx: 1 },
    { prompt: '“pisati → napisati” — what does the prefix na- mark?', options: ['Perfective (completion)', 'Plural', 'Past tense'], correctIdx: 0 },
    { prompt: 'A perfective verb’s present-tense form usually carries which meaning?', options: ['Future', 'Habitual present'], correctIdx: 0 },
    { prompt: 'Which is imperfective?', options: ['čitati', 'pročitati'], correctIdx: 0 },
    { prompt: 'For an ongoing/repeated action you use the…', options: ['imperfective', 'perfective'], correctIdx: 0 },
    { prompt: '“Svaki dan ___ kavu.” (every day) takes which aspect?', options: ['pijem (impf)', 'popijem (pf)'], correctIdx: 0 },
  ],
  // wordform: [...≥5...], diminutives: [...≥5...], phonology: [...≥5...]  ← author from each screen's content
};
```
Author the remaining three banks (`wordform`, `diminutives`, `phonology`) to the same shape, ≥5 questions each, from their screens' content.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/__tests__/lessonQuizBanks.test.ts`
Expected: PASS (fix data until green — never weaken the test).

- [ ] **Step 5: Commit**
```bash
git add src/lib/lessonQuizBanks.ts src/lib/__tests__/lessonQuizBanks.test.ts
git commit -m "feat(lessons): authored quiz banks for aspect/wordform/diminutives/phonology"
```

### Task 7: Wire `<LessonQuiz>` into the passive screens

**Files:** Modify `AspectScreen.tsx`, `WordFormScreen.tsx`, `DiminutivesScreen.tsx`, `PhonologyScreen.tsx`

These screens are passive (no quiz). Add a "Take the check" button at the end of the content that switches to a quiz view rendering `<LessonQuiz>` with the screen's bank. Each screen receives `goBack` and `award` props already (verify; they're routed from AppRouter like other learn screens).

- [ ] **Step 1: For EACH passive screen**, add a local `const [quiz, setQuiz] = useState(false);`, a button at the bottom of the content (`<button className="b bp" onClick={() => setQuiz(true)}>📝 Take the comprehension check</button>`), and at the top of render:
```tsx
if (quiz) {
  return (
    <LessonQuiz
      screenId="<id>" statKind="gc"
      questions={LESSON_QUIZ_BANKS['<id>']!}
      xp={20} questKind="grammar"
      award={award} goBack={goBack} title="📝 <Lesson> check"
    />
  );
}
```
with imports `import LessonQuiz from './LessonQuiz';` and `import { LESSON_QUIZ_BANKS } from '../../lib/lessonQuizBanks';`. Use the screen's id: aspect→`aspect` (gc), wordform→`wordform` (lc — verify its black-hole stat: `wordform: 'lc'`), diminutives→`diminutives` (lc), phonology→`phonology` (lc). **Match statKind to the screen's `BLACK_HOLE_SCREENS` value** (wordform/diminutives/phonology are `lc`; aspect is `gc`).

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npx eslint src/components/learn/AspectScreen.tsx src/components/learn/WordFormScreen.tsx src/components/learn/DiminutivesScreen.tsx src/components/learn/PhonologyScreen.tsx`
Expected: PASS, 0 warnings.

- [ ] **Step 3: Commit**
```bash
git add src/components/learn/AspectScreen.tsx src/components/learn/WordFormScreen.tsx src/components/learn/DiminutivesScreen.tsx src/components/learn/PhonologyScreen.tsx
git commit -m "feat(lessons): add comprehension-check quiz to aspect/wordform/diminutives/phonology"
```

---

## PHASE 3 — Remove dwell-bypass + classify remainder

### Task 8: Remove gated ids from BLACK_HOLE_SCREENS

**Files:** Modify `src/hooks/useScreenLauncher.ts`; create `src/tests/blackHoleScreens.test.ts`

- [ ] **Step 1: Write the failing test** (assert gated ids are NOT dwell-credited)
```ts
// src/tests/blackHoleScreens.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/hooks/useScreenLauncher.ts', 'utf8');
const block = src.slice(src.indexOf('BLACK_HOLE_SCREENS'), src.indexOf('};', src.indexOf('BLACK_HOLE_SCREENS')));

describe('gated lessons are no longer dwell-credited', () => {
  const gated = ['declension', 'tenses', 'conditional', 'impersonal', 'formalregister', 'future_tense_lesson', 'aspect', 'wordform', 'diminutives', 'phonology'];
  it('none of the gated lesson ids appear in BLACK_HOLE_SCREENS', () => {
    for (const id of gated) {
      expect(block.includes(`${id}:`), `${id} still dwell-credited`).toBe(false);
    }
  });
  it('reference screens still ARE dwell-credited (sanity: not over-removed)', () => {
    for (const id of ['weather', 'kings', 'top100', 'idioms']) {
      expect(block.includes(`${id}:`), id).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/tests/blackHoleScreens.test.ts`
Expected: FAIL (gated ids still present).

- [ ] **Step 3: Remove the 10 gated entries** from `BLACK_HOLE_SCREENS` (lines 65-135): delete `aspect`, `declension`, `tenses`, `formalregister`, `conditional`, `impersonal`, `wordform`, `diminutives`, `phonology`, and `future_tense_lesson`. Leave all others.

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `npx vitest run src/tests/blackHoleScreens.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useScreenLauncher.ts src/tests/blackHoleScreens.test.ts
git commit -m "feat(lessons): stop dwell-crediting gated lessons (completion now requires 75%)"
```

### Task 9: Classify the remaining ambiguous grammar-lesson entries

**Files:** none (investigation) → may add follow-up tasks.

- [ ] **Step 1: For each remaining grammar-ish `BLACK_HOLE_SCREENS` id** — `modal`, `reflexive`, `past_tense_lesson`, `padezifull`, `svojmoj`, `negation`, `grammarreader`, `colorquirk`, `pitchaccent`, `pitch_accent`, `grammarmap`, `padezi`, `aspectdrill`, `clitic`, `vocative`, `conjdrill`, `conjlab`, `conjpractice` — open its component and classify: (A) has a scored quiz + writes `vs` on finish → gate it (apply Task 4 transform, remove from list); (B) passive grammar lesson → add `<LessonQuiz>` (Task 7 pattern) + a bank (Task 6 pattern) + remove from list; (C) already a self-reporting interactive drill → just remove from list; (D) pure reference → leave in list.

- [ ] **Step 2: Record the disposition** as a short table in the PR description, and either apply (A)/(B)/(C) inline (small) or create follow-up tasks for any that are large. The interactive drills (conjdrill/conjlab/conjpractice/aspectdrill/vocative/negation/clitic/padezi) are case (C) — removing them from the list is a one-line-each safe change; do it here with a test extension asserting they're gone.

- [ ] **Step 3: Commit** any changes made.
```bash
git add -A && git commit -m "feat(lessons): classify + fix remaining dwell-credit grammar entries"
```

---

## PHASE 4 — Gate

### Task 10: Full gate + PR

- [ ] **Step 1: Run the full gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all PASS (`rm -rf dist` first if EPERM).

- [ ] **Step 2: Push + PR**
```bash
git push -u origin feat/lesson-comprehension-gates
gh pr create --base master --title "Lesson comprehension gates (75% pass replaces dwell-credit)" --body "Lessons now complete only on >=75% on an end-check (retry on fail), not 20s dwell. Shared lessonGate + completeLesson helper; existing lesson quizzes gated; aspect/wordform/diminutives/phonology get a LessonQuiz; gated ids removed from BLACK_HOLE_SCREENS. Existing completions preserved. See docs/superpowers/specs/2026-06-12-lesson-comprehension-gates-design.md."
```

- [ ] **Step 3: STOP** — report gate results; let the user merge on green per the established rhythm.

---

## Self-review notes (author)
- **Spec coverage:** Unit 1 → Task 1; Unit 2 → Task 2; Unit 3 (existing quizzes) → Tasks 4–5; Unit 4 (LessonQuiz) → Task 3; Unit 5 (passive lessons) → Tasks 6–7; Unit 6 (remove dwell) → Task 8; plan-time classification → Task 9; testing → embedded per task + Task 10; no-regression (existing vs preserved) → completeLesson idempotency (Task 2) + Task 8 sanity test.
- **Type consistency:** `completeLesson(args)` signature identical in Task 2 (def) and Tasks 3/4/5/7 (calls); `LessonQuizQuestion` defined in Task 3, imported in Task 6/7; `LESSON_PASS_THRESHOLD`/`passedLesson` from Task 1 used in 2/3/4/5; `statKind: 'lc'|'gc'` consistent (Task 7 matches each screen's BLACK_HOLE stat).
- **No placeholders:** all new modules/components/tests are full code; existing-screen edits give exact transform + exact params (screenId/statKind/xp = preserve existing). Authored questions: one full bank + shape-test gate (content produced at execution, verified by the data-shape test) — same pattern used for the verb-dataset plan.
- **Known judgement point:** Task 3's `opts` useMemo must move above the early return (hook-order) — flagged explicitly in the task.
