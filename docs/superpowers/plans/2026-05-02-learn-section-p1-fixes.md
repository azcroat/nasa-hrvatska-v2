# Learn Section P1 Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 2 P1 bugs found in the learn section deep-dive audit: one split trigger (AlphabetScreen) and one missing double-tap guard (GradedInputScreen).

**Architecture:** Both bugs follow the same pattern seen in Phase 3 (ListeningScreen). `markQuest()` and `award()` must always fire together inside the same `useRef` guard — never split across separate event handlers.

**Tech Stack:** TypeScript/React (frontend), no backend changes.

---

## File Map

- Modify: `src/components/learn/AlphabetScreen.tsx` — move `markQuest('grammar')` from `next()` into the "Done" button's `awardFired.current` guard
- Modify: `src/components/learn/GradedInputScreen.tsx` — add `completeFired = useRef(false)` guard to `complete()`

---

### Task 1: Fix AlphabetScreen — Split markQuest/award trigger

**Files:**
- Modify: `src/components/learn/AlphabetScreen.tsx`

**Context:** `markQuest('grammar')` fires inside `next()` when the user answers the last alphabet quiz question (line 76). `award(20, false, 'vocabulary')` fires later in the separate "Done" button click (lines 202–209), guarded by `awardFired.current`. These two calls are split across different event handlers — if the user navigates away from the quiz-done screen before tapping "Done", the quest marks permanently but XP = 0.

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/learn/AlphabetScreen.tsx` lines 70–85 (the `next()` function) and lines 198–226 (the "Done" button onClick block) to confirm current structure before editing.

- [ ] **Step 2: Remove markQuest from next()**

In the `next()` function, find:
```typescript
    } else {
      markQuest('grammar');
      setQuizDone(true);
    }
```

Replace with:
```typescript
    } else {
      setQuizDone(true);
    }
```

The `markQuest('grammar')` line is deleted entirely. `setQuizDone(true)` stays unchanged.

- [ ] **Step 3: Add markQuest inside the Done button guard**

In the "Done" button onClick, find:
```typescript
              onClick={() => {
                if (!awardFired.current) {
                  awardFired.current = true;
                  if (typeof award === 'function') award(20, false, 'vocabulary');
                }
```

Replace with:
```typescript
              onClick={() => {
                if (!awardFired.current) {
                  awardFired.current = true;
                  if (typeof award === 'function') award(20, false, 'vocabulary');
                  markQuest('grammar');
                }
```

`markQuest('grammar')` is now co-located with `award()` inside the same `awardFired.current` guard — both fire together or not at all.

- [ ] **Step 4: Verify**

```
grep -n "markQuest" src/components/learn/AlphabetScreen.tsx
```

Expected: Exactly 1 match, inside the Done button onClick block (NOT inside `next()`).

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/learn/AlphabetScreen.tsx
git commit -m "fix(AlphabetScreen): co-locate markQuest with award in Done button guard

markQuest('grammar') was firing in next() on last quiz answer, while
award(20) fired later in the separate Done button (guarded by awardFired).
If user backed out between the two events, quest marked but XP = 0.
Both now fire atomically inside the same awardFired.current guard.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix GradedInputScreen — Add double-tap guard to complete()

**Files:**
- Modify: `src/components/learn/GradedInputScreen.tsx`

**Context:** The `complete(xp)` function at line 887 fires both `award(xp, false, 'reading')` and `markQuest('reading')` with no ref guard. It is called from the "Continue →" button inside `StoryQuiz` (line 754), which calls `onComplete(xp)` → `complete(xp)`. A double-tap before React re-renders fires both calls twice, potentially double-awarding XP and double-marking the quest (which can auto-promote tier-2 quests).

- [ ] **Step 1: Read the exact lines to change**

Read `src/components/learn/GradedInputScreen.tsx` lines 860–905 to confirm the exact current structure: where `GradedInputScreen` component starts, where `completeFired` should be declared, and the exact current `complete()` function body.

- [ ] **Step 2: Add the useRef declaration**

Near the top of the `GradedInputScreen` component (with the other `useRef`/`useState` declarations), add:

```typescript
  const completeFired = useRef(false);
```

Place it immediately after the `const [view, setView]` or `const [story, setStory]` declarations — wherever the other refs live in the component.

- [ ] **Step 3: Wrap complete() with the guard**

Find the current `complete()` function:
```typescript
  function complete(xp: number) {
    if (story) markDone(story.id);
    if (typeof award === 'function') award(xp, false, 'reading');
    markQuest('reading');
    goBack();
  }
```

Replace with:
```typescript
  function complete(xp: number) {
    if (completeFired.current) return;
    completeFired.current = true;
    if (story) markDone(story.id);
    if (typeof award === 'function') award(xp, false, 'reading');
    markQuest('reading');
    goBack();
  }
```

The only additions are the two-line guard at the top. All existing logic is unchanged.

- [ ] **Step 4: Verify**

```
grep -n "completeFired\|markQuest" src/components/learn/GradedInputScreen.tsx
```

Expected:
- `completeFired`: 2 matches (declaration and guard check) + 1 match (`completeFired.current = true`)
- `markQuest`: 1 match, inside `complete()`, after the guard

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/learn/GradedInputScreen.tsx
git commit -m "fix(GradedInputScreen): add completeFired guard to complete()

complete() fired award() + markQuest('reading') with no guard.
A double-tap on 'Continue →' before navigation could fire both twice,
double-awarding XP and double-marking the quest.
Added completeFired useRef guard — identical pattern to other screens.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Push and verify

**Files:** None (git / deployment)

- [ ] **Step 1: Push to master**

```
git push origin master
```

Expected: success. Cloudflare deploys on push.

- [ ] **Step 2: Audit checks**

```
echo "=== AlphabetScreen: markQuest must be in Done button only ===" && grep -n "markQuest" src/components/learn/AlphabetScreen.tsx

echo "=== GradedInputScreen: completeFired guard present ===" && grep -n "completeFired" src/components/learn/GradedInputScreen.tsx

echo "=== GradedInputScreen: markQuest inside complete only ===" && grep -n "markQuest" src/components/learn/GradedInputScreen.tsx
```

Expected:
- `AlphabetScreen.tsx markQuest`: 1 match, line inside Done button block (not inside `next()`)
- `GradedInputScreen.tsx completeFired`: 3 matches (declaration, guard check, setter)
- `GradedInputScreen.tsx markQuest`: 1 match, inside `complete()`

- [ ] **Step 3: Full typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.
