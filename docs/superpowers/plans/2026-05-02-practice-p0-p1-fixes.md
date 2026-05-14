# Practice Layer P0/P1 Bug Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 confirmed bugs in the practice screens: 2 P0 (render-time shuffles that destroy feedback and break UX) and 4 P1 (broken answer display, double award/quest fire, misaligned quest+XP triggers).

**Architecture:** React functional components with `useState`/`useRef`/`useMemo`. All screens live under `src/components/practice/`. Bugs are isolated to individual files — no cross-file dependencies between fixes. Fixes use React's built-in memoisation hooks; no new dependencies required.

**Tech Stack:** TypeScript/React, Vite, `src/lib/quests.ts` for `markQuest()`, `src/lib/audio.js` for `speak()`.

---

## File Map

- Modify: `src/components/practice/Unjumble.tsx` — P0-1: stable shuffled word tiles
- Modify: `src/components/practice/VocativeScreen.tsx` — P0-2: stable shuffled quiz options
- Modify: `src/components/practice/exercises/ProfessionGenderScreen.tsx` — P1-1: store chosen string, fix red-highlight logic
- Modify: `src/components/practice/MatchGame.tsx` — P1-2: shared handler + completionFiredRef guard
- Modify: `src/components/practice/AdaptiveReviewScreen.tsx` — P1-3: shared questFiredRef guard
- Modify: `src/components/practice/ListeningScreen.tsx` — P1-4: align markQuest + award in same button handler

---

### Task 1: Fix Unjumble.tsx — P0: Word tiles reshuffle on every tap

**Files:**
- Modify: `src/components/practice/Unjumble.tsx`

**Context:** `sh(q.words)` is called inline at line 71 inside the JSX `.map()`:
```tsx
{sh(q.words).map((w, wi) => (
```
`sh()` calls `Math.random()` each time. Every state update (tap a word, tap Clear, tap Check) triggers a re-render and reshuffles all word tiles. The user's composition in `ujIn` is built from labels that change position — the visible tiles no longer match the words already typed. The fix: `React.useMemo` to compute one stable shuffled array per question index at mount time.

- [ ] **Step 1: Read the current file to confirm exact line**

Read `src/components/practice/Unjumble.tsx` lines 1–30 to confirm imports include `React` (for `useMemo`) and lines 65–90 to confirm the exact `sh(q.words).map(...)` call.

- [ ] **Step 2: Add the memoised shuffled words array**

After line 19 (`const total = ujQ.length;`), insert:

```tsx
  const shuffledWords = React.useMemo(
    () => ujQ.map((q) => sh([...q.words])),
    [ujQ],
  );
```

This computes one shuffled copy of each question's word array once, indexed by question order.

- [ ] **Step 3: Replace the inline shuffle in JSX**

Find line 71:
```tsx
          {sh(q.words).map((w, wi) => (
```

Replace with:
```tsx
          {(shuffledWords[ujI] ?? []).map((w, wi) => (
```

- [ ] **Step 4: Verify**

```
grep -n "sh(q.words)" src/components/practice/Unjumble.tsx
```
Expected: NO matches.

```
grep -n "shuffledWords" src/components/practice/Unjumble.tsx
```
Expected: 2 matches (the useMemo declaration and the `.map()` call).

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/Unjumble.tsx
git commit -m "fix(Unjumble): memoize shuffled word tiles to prevent reshuffle on every tap

sh(q.words) inside JSX .map() called Math.random() on every render.
Tapping a word, Clear, or Check re-shuffled all tiles, scrambling the
layout while the user was composing their answer. Replaced with a
React.useMemo array computed once per question set at mount.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix VocativeScreen.tsx — P0: Quiz options reshuffle after answering, breaking feedback

**Files:**
- Modify: `src/components/practice/VocativeScreen.tsx`

**Context:** Inside `if (phase === 'quiz')` at line 248, quiz options are computed in the render body:
```tsx
    const opts = sh([q.a, ...q.al]);
```
`selected` state stores an integer index (`useState(-1)`). After the user picks an option, `setAnswered(true)` triggers a re-render, `opts` reshuffles, and the check `opts.indexOf(o) === selected` finds a different option at index `selected`. The wrong item lights up green/red. Fix: `React.useMemo` to compute stable shuffled options for all quiz questions at mount, keyed by question index `qi`.

- [ ] **Step 1: Read the file**

Read `src/components/practice/VocativeScreen.tsx` lines 1–35 to confirm the `sh` helper definition (it is defined locally, not imported) and the state declarations. Read lines 237–310 to confirm the `const opts = sh([q.a, ...q.al])` line and the `opts.indexOf(o) === selected` check.

- [ ] **Step 2: Add the memoised shuffled options array**

After line 34 (`const total = quizQ.length;`), insert:

```tsx
  const shuffledOpts = React.useMemo(
    () => quizQ.map((q) => sh([q.a, ...q.al])),
    [quizQ],
  );
```

- [ ] **Step 3: Replace the per-render shuffle inside the quiz phase**

Find:
```tsx
    const q = quizQ[qi]!;
    const opts = sh([q.a, ...q.al]);
```

Replace with:
```tsx
    const q = quizQ[qi]!;
    const opts = shuffledOpts[qi] ?? [];
```

The rest of the component (`opts.map(...)`, `opts.indexOf(o) === selected`) is unchanged — now correct because `opts` is stable across renders.

- [ ] **Step 4: Verify**

```
grep -n "sh(\[q\.a" src/components/practice/VocativeScreen.tsx
```
Expected: NO matches.

```
grep -n "shuffledOpts" src/components/practice/VocativeScreen.tsx
```
Expected: 2 matches (useMemo declaration and `shuffledOpts[qi]` usage).

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/VocativeScreen.tsx
git commit -m "fix(VocativeScreen): memoize quiz options to prevent reshuffle after answering

sh([q.a, ...q.al]) was called in the render body for each quiz question.
After the user tapped an answer, setAnswered(true) triggered a re-render
which reshuffled opts. The index stored in 'selected' then pointed at a
different option, causing wrong-answer feedback to highlight the wrong button.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Fix ProfessionGenderScreen.tsx — P1: All wrong options turn red instead of only the chosen one

**Files:**
- Modify: `src/components/practice/exercises/ProfessionGenderScreen.tsx`

**Context:** `answers` state is `Record<number, boolean>` (stores whether the answer was correct, not which option was chosen). The rendering condition at line 214:
```tsx
} else if (!chosen && oi === q.opts.indexOf(opt)) {
```
When the user answers incorrectly, `chosen = false`, so `!chosen = true`. `oi === q.opts.indexOf(opt)` is always true for every unique option string in the array (since `indexOf` finds the first occurrence, which equals the loop index for unique values). Every non-correct option turns red.

Fix: store the chosen option string (`Record<number, string>`) and simplify the condition to `opt === chosen && opt !== q.a`.

- [ ] **Step 1: Read the file**

Read `src/components/practice/exercises/ProfessionGenderScreen.tsx` lines 41–65 to confirm the `answers` state type and `handleAnswer` implementation. Read lines 196–250 to confirm the `chosen` variable and the flawed `else if` condition.

- [ ] **Step 2: Change the answers state type**

Find:
```tsx
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
```

Replace with:
```tsx
  const [answers, setAnswers] = useState<Record<number, string>>({});
```

- [ ] **Step 3: Fix the handleAnswer setter**

Find:
```tsx
    const isCorrect = opt === correct;
    setAnswers((prev) => ({ ...prev, [qi]: isCorrect }));
    if (isCorrect) {
```

Replace with:
```tsx
    const isCorrect = opt === correct;
    setAnswers((prev) => ({ ...prev, [qi]: opt }));
    if (isCorrect) {
```

- [ ] **Step 4: Fix the correctCount calculation**

Find:
```tsx
  const correctCount = Object.values(answers).filter(Boolean).length;
```

Replace with:
```tsx
  const correctCount = Object.entries(answers).filter(
    ([qi, chosen]) => chosen === quiz[Number(qi)]?.a,
  ).length;
```

- [ ] **Step 5: Fix the red-highlight condition in JSX**

Find:
```tsx
                      } else if (!chosen && oi === q.opts.indexOf(opt)) {
```

Replace with:
```tsx
                      } else if (opt === chosen && opt !== q.a) {
```

Now only the specific option the user tapped (which was wrong) turns red. All other non-correct options remain neutral.

- [ ] **Step 6: Verify**

```
grep -n "Record<number, boolean>" src/components/practice/exercises/ProfessionGenderScreen.tsx
```
Expected: NO matches.

```
grep -n "Record<number, string>" src/components/practice/exercises/ProfessionGenderScreen.tsx
```
Expected: 1 match.

```
grep -n "oi === q.opts.indexOf" src/components/practice/exercises/ProfessionGenderScreen.tsx
```
Expected: NO matches.

- [ ] **Step 7: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/exercises/ProfessionGenderScreen.tsx
git commit -m "fix(ProfessionGenderScreen): store chosen option string, fix red-highlight logic

answers state stored boolean (isCorrect) instead of the chosen option.
The red-highlight condition '!chosen && oi === q.opts.indexOf(opt)' was
always true for every non-correct option when the user answered wrong,
turning ALL options red. Now stores the chosen string and checks
'opt === chosen && opt !== q.a' so only the tapped wrong option turns red.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Fix MatchGame.tsx — P1: Duplicate completion handler fires award + quest twice on Enter/Space

**Files:**
- Modify: `src/components/practice/MatchGame.tsx`

**Context:** The completion logic is duplicated verbatim in both the `onClick` and `onKeyDown` handlers (lines 97–107 and 135–145). When a keyboard user presses Enter or Space on the last pair card, the browser fires the synthetic click event AND the keydown event for the same element. Both handlers check `mm.length + 1 === mp.length / 2` — both pass (because `mm` hasn't updated yet in either closure) — and two `setTimeout` callbacks are scheduled. Result: `award(20)` fires twice and `markQuest('vocab')` fires twice. Per `quests.ts`, the second `markQuest('vocab')` call on the same day auto-promotes the tier-2 quest `vocab2`.

Fix: extract the shared logic into a `handleCardClick` function, add a `completionFiredRef = useRef(false)` guard, call from both handlers.

- [ ] **Step 1: Read the file**

Read `src/components/practice/MatchGame.tsx` lines 1–30 to confirm imports (need `useRef` added) and lines 79–160 to confirm the exact duplicate blocks.

- [ ] **Step 2: Add useRef to the import**

Find:
```tsx
import React, { useState } from 'react';
```

Replace with:
```tsx
import React, { useState, useRef } from 'react';
```

- [ ] **Step 3: Declare completionFiredRef**

After:
```tsx
  const [gsc, sGsc] = useState(0);
```

Add:
```tsx
  const completionFiredRef = useRef(false);
```

- [ ] **Step 4: Extract the shared card handler**

After the `completionFiredRef` declaration, insert the shared handler function:

```tsx
  function handleCardClick(c: any) {
    if (mm.includes(c.p)) return;
    if (msl.length === 0) {
      sMsl([c]);
      return;
    }
    const f = msl[0];
    if (!f) return;
    if (f.id === c.id) {
      sMsl([]);
      return;
    }
    if (f.p === c.p && f.tp !== c.tp) {
      const hrWord = f.tp === 'hr' ? f.t : c.t;
      srMark(hrWord, true, 0);
      sMm((m: any[]) => [...m, c.p]);
      sGsc((s) => s + 1);
      sMsl([]);
      if (mm.length + 1 === mp.length / 2 && !completionFiredRef.current) {
        completionFiredRef.current = true;
        setTimeout(() => {
          if (typeof award === 'function') award(20, false, 'vocabulary');
          markQuest('vocab');
          sGph('done');
          knightSpeak(
            'celebrating',
            'Sve upareno! You just matched every word. Neural pathways reinforced. 🧠⚔️',
            800,
          );
        }, 500);
      }
    } else {
      const hrWord = f.tp === 'hr' ? f.t : c.tp === 'hr' ? c.t : null;
      if (hrWord) srMark(hrWord, false, 0);
      sMsl([f, c]);
      setTimeout(() => sMsl([]), 800);
    }
  }
```

- [ ] **Step 5: Replace onClick and onKeyDown bodies**

Find the entire `onClick` handler (the arrow function starting with `onClick={() => {` through its closing `}}`). Replace it with:

```tsx
              onClick={() => handleCardClick(c)}
```

Find the entire `onKeyDown` handler. Replace it with:

```tsx
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(c);
                }
              }}
```

- [ ] **Step 6: Verify**

```
grep -n "markQuest" src/components/practice/MatchGame.tsx
```
Expected: 1 match (inside `handleCardClick`).

```
grep -n "award(20" src/components/practice/MatchGame.tsx
```
Expected: 1 match (inside `handleCardClick`).

```
grep -n "completionFiredRef" src/components/practice/MatchGame.tsx
```
Expected: 2 matches (declaration and guard check).

- [ ] **Step 7: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/MatchGame.tsx
git commit -m "fix(MatchGame): extract shared handler + add completionFiredRef guard

onClick and onKeyDown duplicated the full card-match logic. Pressing
Enter/Space on the last pair card fires both events in the same frame —
both saw mm.length + 1 === mp.length/2 before state updated, scheduling
two completion timeouts. Result: award(20) and markQuest('vocab') each
fired twice; the double markQuest auto-promoted tier-2 vocab2 quest.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Fix AdaptiveReviewScreen.tsx — P1: Dual markQuest call sites with no shared guard

**Files:**
- Modify: `src/components/practice/AdaptiveReviewScreen.tsx`

**Context:** `markQuest('master')` can fire from two places with no shared guard:
1. **Defensive `useEffect`** (lines 356–362): fires when `view === 'session'` and `sessionIdx >= session.length` — a safety net for off-by-one navigation
2. **`handleResult` handler** (lines 612–616): fires when `sessionIdx + 1 >= session.length` (normal completion path)

In normal flow, `handleResult` fires first (calling `markQuest` + `setView('results')`), then React's `useEffect` runs after the state update — at that point `view` is already `'results'`, so the effect's condition `view === 'session'` is false and it doesn't fire again. This looks safe. However, there is an XP discrepancy: the effect uses `correct` (stale — does NOT include the last answer), while `handleResult` uses `newCorrect = isCorrect ? correct + 1 : correct` (correct). If the effect were ever to fire as the completion path, the XP would be off by 1.

The safe fix: add a `questFiredRef = useRef(false)` shared guard to both sites. This guarantees exactly-once semantics regardless of React batching or edge-case navigation, and documents the intent clearly.

- [ ] **Step 1: Read the two call sites**

Read `src/components/practice/AdaptiveReviewScreen.tsx` lines 340–365 to confirm the `useEffect` block. Read lines 594–620 to confirm the `handleResult` block.

- [ ] **Step 2: Add questFiredRef declaration**

Find the line:
```tsx
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'session' | 'results'
```

After it, add:
```tsx
  const questFiredRef = useRef(false);
```

- [ ] **Step 3: Confirm `useRef` is already imported**

```
grep -n "useRef" src/components/practice/AdaptiveReviewScreen.tsx
```
Expected: at least 1 match from existing code. If `useRef` is not in the React import, add it.

- [ ] **Step 4: Guard the defensive useEffect call site**

Find:
```tsx
  useEffect(() => {
    if (view === 'session' && session.length > 0 && sessionIdx >= session.length) {
      markQuest('master');
      if (award) award(correct * 2, false, 'review');
      setView('results');
    }
  }, [view, sessionIdx, session.length, correct, award]);
```

Replace with:
```tsx
  useEffect(() => {
    if (view === 'session' && session.length > 0 && sessionIdx >= session.length) {
      if (!questFiredRef.current) {
        questFiredRef.current = true;
        markQuest('master');
      }
      if (award) award(correct * 2, false, 'review');
      setView('results');
    }
  }, [view, sessionIdx, session.length, correct, award]);
```

- [ ] **Step 5: Guard the handleResult call site**

Find:
```tsx
      if (sessionIdx + 1 >= session.length) {
        const newCorrect = isCorrect ? correct + 1 : correct;
        markQuest('master');
        if (award) award(newCorrect * 2, false, 'review');
        setView('results');
```

Replace with:
```tsx
      if (sessionIdx + 1 >= session.length) {
        const newCorrect = isCorrect ? correct + 1 : correct;
        if (!questFiredRef.current) {
          questFiredRef.current = true;
          markQuest('master');
        }
        if (award) award(newCorrect * 2, false, 'review');
        setView('results');
```

- [ ] **Step 6: Verify**

```
grep -n "markQuest" src/components/practice/AdaptiveReviewScreen.tsx
```
Expected: 2 matches (one in useEffect, one in handleResult), both now guarded by `questFiredRef.current`.

```
grep -n "questFiredRef" src/components/practice/AdaptiveReviewScreen.tsx
```
Expected: 3 matches (declaration, useEffect guard, handleResult guard).

- [ ] **Step 7: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/AdaptiveReviewScreen.tsx
git commit -m "fix(AdaptiveReviewScreen): add shared questFiredRef guard for markQuest

Two call sites could fire markQuest('master') — the defensive useEffect
and the main handleResult handler. Added questFiredRef to guarantee
exactly-once semantics. Also prevents edge-case tier-2 auto-promotion
that would occur if both sites fired in the same session.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Fix ListeningScreen.tsx — P1: markQuest fires in next() but award fires in "Finish!" button

**Files:**
- Modify: `src/components/practice/ListeningScreen.tsx`

**Context:** The quest and XP triggers are split across two different user actions:
- `markQuest('speak')` fires inside `next()` (lines 128–131) when the user advances past the last question — before the results screen is shown
- `award(score * 4 + 10)` fires inside the "Finish!" button `onClick` (lines 83–86), guarded by `finishFired.current`

If the user sees the results screen but taps the back button (or navigates away) instead of tapping "Finish!", `markQuest` has already fired but `award` never does. The quest is permanently marked for the day, and the user receives 0 XP.

Fix: move `markQuest('speak')` into the "Finish!" button handler alongside `award`, where `finishFired.current` already provides a once-only guard. Remove the `questFired` ref (no longer needed).

- [ ] **Step 1: Read the relevant sections**

Read `src/components/practice/ListeningScreen.tsx` lines 38–45 to confirm `questFired = useRef(false)` declaration. Read lines 119–135 to confirm the `next()` function and the markQuest block. Read lines 80–100 to confirm the "Finish!" button handler.

- [ ] **Step 2: Remove the questFired ref declaration**

Find:
```tsx
  const questFired = useRef(false);
```

Delete this line entirely.

- [ ] **Step 3: Remove the markQuest block from next()**

Find:
```tsx
    } else {
      if (!questFired.current) {
        questFired.current = true;
        markQuest('speak');
      }
      setIdx(total);
    }
```

Replace with:
```tsx
    } else {
      setIdx(total);
    }
```

- [ ] **Step 4: Add markQuest to the "Finish!" button handler**

Find:
```tsx
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(score * 4 + 10, false, 'listening');
```

Replace with:
```tsx
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              markQuest('speak');
              if (typeof award === 'function') award(score * 4 + 10, false, 'listening');
```

`markQuest('speak')` now fires in the same guarded handler as `award`, so both always fire together or neither fires.

- [ ] **Step 5: Verify**

```
grep -n "questFired" src/components/practice/ListeningScreen.tsx
```
Expected: NO matches.

```
grep -n "markQuest" src/components/practice/ListeningScreen.tsx
```
Expected: 1 match (in the "Finish!" button onClick).

- [ ] **Step 6: Typecheck and lint**

```
npm run typecheck 2>&1 | head -20
npm run lint 2>&1 | head -20
```
Expected: 0 errors each.

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/ListeningScreen.tsx
git commit -m "fix(ListeningScreen): move markQuest('speak') to Finish button handler

markQuest fired in next() when the last question was answered, but
award fired in the Finish button. If the user navigated away from the
results screen without tapping Finish, the quest was marked permanently
but XP was never awarded. Both now fire together in the Finish handler,
guarded by finishFired.current. Removed the now-redundant questFired ref.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Push and verify

**Files:** None (git / deployment)

- [ ] **Step 1: Push to master**

```
git push origin master
```
Expected: success.

- [ ] **Step 2: Full test suite**

```
npm test 2>&1 | tail -20
```
Expected: 0 failures.

- [ ] **Step 3: Audit checks**

```
echo "=== P0-1: No inline sh() in Unjumble ===" && grep -n "sh(q\.words)" src/components/practice/Unjumble.tsx
echo "=== P0-1: shuffledWords memoized ===" && grep -n "shuffledWords" src/components/practice/Unjumble.tsx

echo "=== P0-2: No inline sh([q.a in quiz render ===" && grep -n "const opts = sh" src/components/practice/VocativeScreen.tsx
echo "=== P0-2: shuffledOpts memoized ===" && grep -n "shuffledOpts" src/components/practice/VocativeScreen.tsx

echo "=== P1-1: answers is string record ===" && grep -n "Record<number, string>" src/components/practice/exercises/ProfessionGenderScreen.tsx
echo "=== P1-1: no boolean indexOf condition ===" && grep -n "oi === q.opts.indexOf" src/components/practice/exercises/ProfessionGenderScreen.tsx

echo "=== P1-2: single markQuest in MatchGame ===" && grep -n "markQuest" src/components/practice/MatchGame.tsx
echo "=== P1-2: completionFiredRef guard ===" && grep -n "completionFiredRef" src/components/practice/MatchGame.tsx

echo "=== P1-3: questFiredRef in AdaptiveReview ===" && grep -n "questFiredRef" src/components/practice/AdaptiveReviewScreen.tsx

echo "=== P1-4: no questFired ref in Listening ===" && grep -n "questFired" src/components/practice/ListeningScreen.tsx
echo "=== P1-4: markQuest in Finish button ===" && grep -n "markQuest" src/components/practice/ListeningScreen.tsx
```

Expected:
- `sh(q.words)` in Unjumble: no matches
- `shuffledWords` in Unjumble: 2 matches
- `const opts = sh` in VocativeScreen: no matches
- `shuffledOpts` in VocativeScreen: 2 matches
- `Record<number, string>` in ProfessionGenderScreen: 1 match
- `oi === q.opts.indexOf` in ProfessionGenderScreen: no matches
- `markQuest` in MatchGame: 1 match
- `completionFiredRef` in MatchGame: 2 matches
- `questFiredRef` in AdaptiveReviewScreen: 3 matches
- `questFired` in ListeningScreen: no matches
- `markQuest` in ListeningScreen: 1 match
