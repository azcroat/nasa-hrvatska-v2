# Croatia/Discover Section P0 & P1 Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs found in a full Croatia/Discover section audit — 2 P0s (render-time option shuffle breaks UI during feedback window) and 3 P1s (missing `useRef` guards allowing double-fire of `markQuest` + `award`).

**Architecture:** All 5 bugs follow two known patterns. P0: `sh()` called directly inside JSX `.map()` reshuffles answer options on every React state update, causing visible option-jumping during the 1.4s feedback window. P1: `markQuest()` and `award()` fire without a `useRef(false)` guard, enabling double-fire on rapid user action or concurrent API responses. Fix for P0 = freeze options with `useMemo` keyed on the region data. Fix for P1 = add `useRef(false)` guard wrapping both calls together.

**Tech Stack:** TypeScript/React (frontend), no backend changes.

---

## File Map

- Modify: `src/components/croatia/RegionScreen.tsx` — P0: add `useMemo` to freeze quiz options (no reward calls in this file)
- Modify: `src/components/croatia/RegionScreens.tsx` — P0: same useMemo fix; P1: add `quizFinishFired` ref guard in `handleQuizAnswer` setTimeout
- Modify: `src/components/croatia/TextingScreen.tsx` — P1: add `finishFired` ref guard in `next()`
- Modify: `src/components/croatia/LiveTutorScreen.tsx` — P1: add `milestone10Fired` ref guard on turn-10 milestone

---

### Task 1: Fix RegionScreen.tsx — P0 render-time shuffle

**Files:**
- Modify: `src/components/croatia/RegionScreen.tsx`

**Context:** `RegionScreen.tsx` (the default-export version, 15K) is a read-only content quiz with no XP/quest calls. At line 354, `sh([r.quiz[quizI]!.a, ...r.quiz[quizI]!.al])` is called directly inside the JSX `.map()`. Every time React re-renders (e.g., `setQuizSel(opt)` runs after the user answers), `sh()` re-runs and returns a newly shuffled array. Options physically jump to new positions while the green/red feedback is displayed, confusing the user. Fix: compute a stable `frozenOpts` array once per region load using `useMemo`.

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/croatia/RegionScreen.tsx` lines 1–20 (imports + state declarations) and lines 350–360 (the shuffle call in JSX) to confirm current structure before editing.

- [ ] **Step 2: Add `useMemo` to the React import**

At line 1, find:
```typescript
import React, { useState } from 'react';
```

Replace with:
```typescript
import React, { useState, useMemo } from 'react';
```

- [ ] **Step 3: Add `frozenOpts` after state declarations**

After the last `useState` call (line 16: `const [expandedPerson, setExpandedPerson] = useState<number | null>(null);`), find:
```typescript
  const r = (REGIONS as Record<string, (typeof REGIONS)[keyof typeof REGIONS]>)[regionKey]!;
```

Replace with:
```typescript
  const r = (REGIONS as Record<string, (typeof REGIONS)[keyof typeof REGIONS]>)[regionKey]!;
  const frozenOpts = useMemo(() => r.quiz.map((q) => sh([q.a, ...q.al])), [r]);
```

- [ ] **Step 4: Replace the render-time shuffle call in JSX**

At line 354, find:
```typescript
              {sh([r.quiz[quizI]!.a, ...r.quiz[quizI]!.al]).map(function (opt, i) {
```

Replace with:
```typescript
              {(frozenOpts[quizI] ?? []).map(function (opt, i) {
```

- [ ] **Step 5: Verify**

```
grep -n "sh(" src/components/croatia/RegionScreen.tsx
```

Expected: matches only inside the `frozenOpts` useMemo — NOT inside any `.map()` call in JSX.

- [ ] **Step 6: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/croatia/RegionScreen.tsx
git commit -m "fix(RegionScreen): freeze quiz options with useMemo to stop render-time reshuffle

sh() was called inside the JSX .map() on every render. After the user
answered, setQuizSel triggered a re-render and options reshuffled, making
the green/red feedback appear on a different option. frozenOpts useMemo
computes the shuffled order once per region load.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix RegionScreens.tsx — P0 render-time shuffle + P1 missing guard

**Files:**
- Modify: `src/components/croatia/RegionScreens.tsx`

**Context:** `RegionScreens.tsx` (the named-export version used from the full Croatia router, 25K) has the same P0 render-time shuffle at line 362: `sh([r.quiz[quizI]!.a, ...r.quiz[quizI]!.al]).map(...)`. It also has a P1 bug in `handleQuizAnswer` (lines 37–52): `markQuest('culture')` and `award()` fire inside a `setTimeout(..., 1400)` callback with no ref guard. A double-tap on the last-question answer button (before `setQuizSel` state updates) fires two `setTimeout` callbacks — both fire after 1.4s and both call `markQuest` + `award`. Fix: add `frozenOpts` useMemo (same as Task 1) AND add `quizFinishFired = useRef(false)` guard around the reward calls.

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/croatia/RegionScreens.tsx` lines 1–55 (imports, state declarations, `handleQuizAnswer`) and lines 358–368 (the shuffle call in JSX) to confirm current structure before editing.

- [ ] **Step 2: Add `useRef` and `useMemo` to the React import**

At line 1, find:
```typescript
import React, { useState } from 'react';
```

Replace with:
```typescript
import React, { useState, useRef, useMemo } from 'react';
```

- [ ] **Step 3: Add `quizFinishFired` ref and `frozenOpts` after state declarations**

After line 20 (`const r = ...`), find:
```typescript
  const TABS = [
```

Replace with:
```typescript
  const quizFinishFired = useRef(false);
  const frozenOpts = useMemo(() => r.quiz.map((q) => sh([q.a, ...q.al])), [r]);

  const TABS = [
```

- [ ] **Step 4: Add the guard to `handleQuizAnswer`'s setTimeout else branch**

In `handleQuizAnswer`, find:
```typescript
    } else {
        const finalScore = correct ? quizScore + 1 : quizScore;
        markQuest('culture');
        if (typeof award === 'function') award(finalScore * 5 + 10, false, 'culture');
        setQuizDone(true);
      }
```

Replace with:
```typescript
    } else {
        if (!quizFinishFired.current) {
          quizFinishFired.current = true;
          const finalScore = correct ? quizScore + 1 : quizScore;
          markQuest('culture');
          if (typeof award === 'function') award(finalScore * 5 + 10, false, 'culture');
        }
        setQuizDone(true);
      }
```

- [ ] **Step 5: Replace the render-time shuffle call in JSX**

Find:
```typescript
              {sh([r.quiz[quizI]!.a, ...r.quiz[quizI]!.al]).map(function (opt, i) {
```

Replace with:
```typescript
              {(frozenOpts[quizI] ?? []).map(function (opt, i) {
```

- [ ] **Step 6: Verify**

```
grep -n "sh(" src/components/croatia/RegionScreens.tsx
```

Expected: the only `sh(` matches are inside the `frozenOpts` useMemo — NOT inside any JSX `.map()`.

```
grep -n "quizFinishFired\|markQuest" src/components/croatia/RegionScreens.tsx
```

Expected:
- `quizFinishFired`: 2 matches (declaration, guard check) + 1 match (setter)
- `markQuest`: 1 match, inside the `handleQuizAnswer` else block after the guard

- [ ] **Step 7: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/croatia/RegionScreens.tsx
git commit -m "fix(RegionScreens): freeze quiz options + add quizFinishFired guard

P0: sh() in JSX .map() reshuffled options on every render, causing
option-jump during the 1.4s answer-feedback window. frozenOpts useMemo
fixes this (same pattern as Task 1).

P1: handleQuizAnswer setTimeout else-branch fired markQuest+award with
no ref guard. A double-tap before setQuizSel state update spawned two
setTimeout callbacks, both firing rewards after 1.4s. quizFinishFired
useRef guard ensures both calls fire at most once.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Fix TextingScreen.tsx — P1 missing guard in next()

**Files:**
- Modify: `src/components/croatia/TextingScreen.tsx`

**Context:** `TextingScreen.tsx` line 56: the `next()` function. When the user is on the last question and taps the "Next →" button, the else branch fires `award(xp, false, 'culture')` and `markQuest('culture')` with no guard. A double-tap before React re-renders (which would set `done = true` and remove the button) fires both calls twice. Fix: add `finishFired = useRef(false)` and wrap both calls inside the guard.

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/croatia/TextingScreen.tsx` lines 1–68 to confirm the current import line and the exact current `next()` function body.

- [ ] **Step 2: Add `useRef` to the React import**

At line 1, find:
```typescript
import React, { useState, useMemo } from 'react';
```

Replace with:
```typescript
import React, { useState, useMemo, useRef } from 'react';
```

- [ ] **Step 3: Add `finishFired` ref after `questions`**

After line 36 (`const questions = useMemo(() => buildQuiz(TEXTING), []);`), find:
```typescript
  function startQuiz() {
```

Replace with:
```typescript
  const finishFired = useRef(false);

  function startQuiz() {
```

- [ ] **Step 4: Wrap the reward calls in `next()` with the guard**

Find the else branch of `next()`:
```typescript
  } else {
      const xp = Math.round((score / questions.length) * 20) + 5;
      if (award) award(xp, false, 'culture');
      markQuest('culture');
      setDone(true);
    }
```

Replace with:
```typescript
  } else {
      if (!finishFired.current) {
        finishFired.current = true;
        const xp = Math.round((score / questions.length) * 20) + 5;
        if (award) award(xp, false, 'culture');
        markQuest('culture');
      }
      setDone(true);
    }
```

`setDone(true)` stays outside the guard so the UI always transitions to done even if the guard fires.

- [ ] **Step 5: Verify**

```
grep -n "finishFired\|markQuest" src/components/croatia/TextingScreen.tsx
```

Expected:
- `finishFired`: 2 matches (declaration, guard check) + 1 match (setter)
- `markQuest`: 1 match, inside `next()` after the guard

- [ ] **Step 6: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/croatia/TextingScreen.tsx
git commit -m "fix(TextingScreen): add finishFired guard to next() on last question

award() and markQuest('culture') fired with no guard in the else branch
of next(). A double-tap before React re-rendered (removing the button)
could fire both twice. finishFired useRef guard ensures they fire once.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Fix LiveTutorScreen.tsx — P1 missing guard on turn-10 milestone

**Files:**
- Modify: `src/components/croatia/LiveTutorScreen.tsx`

**Context:** In `sendToTutor` (a `useCallback` with deps `[level, topic, turnCount, award]`), line 332: `if (newTurn === 10)` fires `award(20, false, 'speaking')` and `markQuest('speak')` with no guard. `newTurn` is computed as `turnCount + 1` from the current React state. If two API responses arrive before `setTurnCount` propagates (e.g., user sends message 9 while an earlier response is in flight, or a network retry delivers two responses), both see `turnCount = 9`, both compute `newTurn = 10`, and both fire the milestone. Fix: add `milestone10Fired = useRef<boolean>(false)` and short-circuit the milestone block if it has already fired.

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/croatia/LiveTutorScreen.tsx` lines 138–150 (the Refs section, to find the right insertion point) and lines 326–336 (the Award XP block in `sendToTutor`).

- [ ] **Step 2: Add `milestone10Fired` ref in the Refs section**

After line 149 (`const recordingStreamRef = useRef<MediaStream | null>(null);`), find:
```typescript
  // ── Check mic permission on mount ─────────
```

Replace with:
```typescript
  const milestone10Fired = useRef<boolean>(false);

  // ── Check mic permission on mount ─────────
```

- [ ] **Step 3: Wrap the turn-10 milestone block**

In `sendToTutor`, find:
```typescript
        if (newTurn === 10) {
            award(20, false, 'speaking');
            markQuest('speak');
          }
```

Replace with:
```typescript
        if (newTurn === 10 && !milestone10Fired.current) {
            milestone10Fired.current = true;
            award(20, false, 'speaking');
            markQuest('speak');
          }
```

- [ ] **Step 4: Verify**

```
grep -n "milestone10Fired\|markQuest" src/components/croatia/LiveTutorScreen.tsx
```

Expected:
- `milestone10Fired`: 2 matches (declaration, guard check) + 1 match (setter)
- `markQuest`: 1 match, inside the `newTurn === 10` block after the guard

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/croatia/LiveTutorScreen.tsx
git commit -m "fix(LiveTutorScreen): add milestone10Fired guard to turn-10 XP milestone

markQuest('speak') + award(20) fired when newTurn === 10 with no ref guard.
sendToTutor reads turnCount state (stale closure); concurrent API responses
while turnCount = 9 both compute newTurn = 10 and both fire the milestone.
milestone10Fired useRef guard ensures the bonus fires at most once per session.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Push and verify

**Files:** None (git / deployment)

- [ ] **Step 1: Push to master**

```
git push origin master
```

Expected: success. Cloudflare deploys on push.

- [ ] **Step 2: Audit checks**

```
echo "=== RegionScreen: sh() must only appear in frozenOpts useMemo ===" && grep -n "sh(" src/components/croatia/RegionScreen.tsx

echo "=== RegionScreens: sh() must only appear in frozenOpts useMemo ===" && grep -n "sh(" src/components/croatia/RegionScreens.tsx

echo "=== RegionScreens: quizFinishFired guard present ===" && grep -n "quizFinishFired" src/components/croatia/RegionScreens.tsx

echo "=== TextingScreen: finishFired guard present ===" && grep -n "finishFired\|markQuest" src/components/croatia/TextingScreen.tsx

echo "=== LiveTutorScreen: milestone10Fired guard present ===" && grep -n "milestone10Fired\|markQuest" src/components/croatia/LiveTutorScreen.tsx
```

Expected:
- `RegionScreen.tsx sh(`: 1 match, only inside `frozenOpts` useMemo — no JSX `.map()` match
- `RegionScreens.tsx sh(`: matches only inside `frozenOpts` useMemo — no JSX `.map()` match
- `RegionScreens.tsx quizFinishFired`: 3 matches (declaration, guard check, setter)
- `TextingScreen.tsx finishFired`: 3 matches; `markQuest`: 1 match inside guard
- `LiveTutorScreen.tsx milestone10Fired`: 3 matches; `markQuest`: 1 match inside guard

- [ ] **Step 3: Full typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.
