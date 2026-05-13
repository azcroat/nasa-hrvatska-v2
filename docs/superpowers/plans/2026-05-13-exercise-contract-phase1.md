# Exercise Contract & Padež Coverage — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a single Exercise Contract across all grammar/case/tense drills, fix the four drills that violate it (Accusative full-replace, PrepDrill, ConjugationDrill, AspectDrillScreen), add three missing case drills (Genitive, Nominative, Locative), and fix the category-tagging that causes Genitive to dominate the daily session.

**Architecture:** Six existing drills (DativeDrill, InstrumentalDrill, PassiveDrill, CliticDrill, ImperativeDrill, NegationGenDrill) already follow the contract perfectly — they are the canonical reference. A new contract test (`tests/exerciseContract.test.tsx`) renders each grammar drill and asserts the contract holds; the test is the enforcement mechanism. Croatian Q&A content is drafted by Claude from in-memory linguistic knowledge and reviewed by jschr in chat before commit.

**Tech Stack:** React 18 + TypeScript (strict), Vitest, React Testing Library, Vite, Capacitor (Android). Tests run via `npm test`; typecheck via `npx tsc --noEmit`; lint via `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-05-13-exercise-contract-phase1-design.md`

---

## File Structure

**Files to create:**
- `docs/exercise-contract.md` — the contract spec (developer-facing doc)
- `src/tests/exerciseContract.test.tsx` — contract enforcement test
- `src/components/practice/GenitiveDrill.tsx` — new
- `src/components/practice/NominativeDrill.tsx` — new
- `src/components/practice/LocativeDrill.tsx` — new
- `src/components/practice/AccusativeDrill.tsx` — replaces broken file
- `src/tests/GenitiveDrill.test.tsx` — per-drill smoke
- `src/tests/NominativeDrill.test.tsx` — per-drill smoke
- `src/tests/LocativeDrill.test.tsx` — per-drill smoke
- `src/tests/AccusativeDrill.test.tsx` — per-drill smoke

**Files to delete:**
- `src/components/practice/exercises/AccusativeDrillScreen.tsx` (broken, replaced)

**Files to modify:**
- `src/hooks/useDailySession.ts` — re-tag pool, update CATEGORY_SCREEN_MAP, add new pool entries
- `src/components/AppRouter.tsx` — register new drill screen IDs
- `src/components/practice/PrepDrill.tsx` — add contract compliance
- `src/components/practice/ConjugationDrill.tsx` — audit + align
- `src/components/practice/AspectDrillScreen.tsx` — audit + align

---

### Task 1: Write the Exercise Contract doc

**Files:**
- Create: `docs/exercise-contract.md`

- [ ] **Step 1: Write the doc**

Create `docs/exercise-contract.md` with this exact content:

````markdown
# Exercise Contract

Every grammar/case/tense/aspect/clitic/preposition/conjugation drill in this codebase MUST follow the contract below. The contract is enforced by `src/tests/exerciseContract.test.tsx`. A drill that does not comply will fail CI.

## The 8 clauses

1. **Active testing.** N multiple-choice questions where the user selects an answer that is graded right/wrong. "Click to reveal" is not testing. Default N = 20.
2. **Single XP award on completion.** Drill calls `award(score × MULTIPLIER, 'grammar')` exactly once on completion. MULTIPLIER defaults to 5 (perfect 20/20 = 100 XP). Per-question XP is forbidden.
3. **Idempotency guard.** A `finishFired = useRef(false)` guards the completion block. Re-mounts MUST NOT double-award.
4. **Quest marker.** `markQuest('grammar')` called inside the completion block.
5. **`gc` + `vs:[]` tag.** `setStats` increments `gc` and appends the case/topic identifier to `vs[]`, guarded by `!prev.vs?.includes(tag)`.
6. **`writeDelta` sync.** Completion also calls `writeDelta({ gc: 1, vs: [tag] })` to push the delta into the Firestore sync layer.
7. **Final results screen.** "Done" state shows score (N/total), encouraging message keyed to percentage, back button.
8. **`markDone` integration.** Drill triggers daily-session `markDone(curEx)` on completion. The existing `goBack()` flow in HomeTab handles this if the drill calls `goBack()` after `award()`; new drills MAY rely on that flow and SHOULD NOT call `markDone` directly unless the screen is not part of the daily session.

## Canonical reference

`src/components/practice/DativeDrill.tsx` — copy its structure for new drills. Lines 165–305 show the complete state-machine + completion-block pattern.

## Adding a new drill

1. Create `src/components/practice/<Case>Drill.tsx` mirroring `DativeDrill.tsx`.
2. Author 20 multiple-choice Q&A in the `DATA` const at top of file.
3. Use a unique tag in `vs:['<case-name>']`.
4. Register in `src/components/AppRouter.tsx` (lazy import + screen-id case).
5. Add to `src/hooks/useDailySession.ts` `CEFR_EXERCISE_POOL` with appropriate category.
6. Add to `src/tests/exerciseContract.test.tsx` GRAMMAR_DRILLS list.

## Adding a new drill — content authoring

Claude drafts Q&A from in-memory Croatian linguistic knowledge. jschr reviews in chat before commit. Do not commit Q&A that has not been reviewed.
````

- [ ] **Step 2: Commit**

```bash
git add docs/exercise-contract.md
git commit -m "docs: add Exercise Contract spec for grammar drills"
```

Expected: 1 file changed, 1 insertion.

---

### Task 2: Scaffold contract test against DativeDrill

**Files:**
- Create: `src/tests/exerciseContract.test.tsx`

The test will:
1. Mock `award`, `markQuest`, `setStats`, `writeDelta`.
2. Render the drill component.
3. Walk through all questions clicking the first answer button each time.
4. Click "See results" / "Next" to advance to completion.
5. Assert: `award` called exactly once with `(any number > 0, 'grammar')`; `markQuest` called with `'grammar'`; `setStats` invoked at least once with a function returning `{ gc: prev.gc + 1 }`.

- [ ] **Step 1: Write the test file**

Create `src/tests/exerciseContract.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { StatsContext } from '../context/StatsContext';
import type { Stats } from '../types';

// Mock markQuest so we can spy on it
const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

// Helper: provide a minimal StatsContext with spies
function makeStatsCtx() {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const stats: Stats = {
    xp: 0,
    lc: 0,
    gc: 0,
    sc: 0,
    vs: [],
  } as Stats;
  return {
    value: { stats, setStats, writeDelta },
    setStats,
    writeDelta,
  };
}

function renderWithCtx(node: React.ReactElement, ctxValue: unknown) {
  return render(
    <StatsContext.Provider value={ctxValue as never}>{node}</StatsContext.Provider>,
  );
}

// Helper: complete a drill by clicking the first option then the next button N times.
async function completeDrill(awardMock: ReturnType<typeof vi.fn>) {
  // Loop until "Done" or "See results" appears AND we've clicked it.
  // Cap iterations at 50 to prevent runaway test.
  for (let i = 0; i < 50; i++) {
    const buttons = screen.queryAllByRole('button');
    // Try result CTA first — "See results", "Done", "🏠 Done", "← Back"
    const resultBtn = buttons.find((b) =>
      /see results|🏠 done|^done$/i.test(b.textContent || ''),
    );
    if (resultBtn) {
      fireEvent.click(resultBtn);
      // After clicking result CTA, drill is done.
      // Some drills then need a final back-button click; not required for contract assertions.
      break;
    }
    // Click first option button (matches the 'ob' or similar class — all drills use a 2x2 grid of MC options)
    const optionBtn = buttons.find(
      (b) => b.className.includes('ob') || /^(\w+)$/.test((b.textContent || '').trim()),
    );
    if (optionBtn && !optionBtn.disabled) {
      fireEvent.click(optionBtn);
    }
    // After answering, click "Next →" to advance
    const nextBtn = buttons.find((b) => /next/i.test(b.textContent || ''));
    if (nextBtn) {
      fireEvent.click(nextBtn);
    }
    if (awardMock.mock.calls.length > 0) break; // drill awarded XP — completion fired
  }
}

interface DrillCase {
  name: string;
  Component: React.LazyExoticComponent<React.ComponentType<{
    goBack: () => void;
    award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  }>>;
  expectedVsTag: string;
}

describe('Exercise Contract — gold-pattern drills', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('DativeDrill follows the contract', async () => {
    const { default: DativeDrill } = await import('../components/practice/DativeDrill');
    const { value, setStats, writeDelta } = makeStatsCtx();
    const award = vi.fn();
    const goBack = vi.fn();
    renderWithCtx(<DativeDrill goBack={goBack} award={award} />, value);

    await completeDrill(award);

    // Clause 2: award called once with grammar type and > 0 XP
    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0][0]).toBeGreaterThan(0);
    expect(award.mock.calls[0][2]).toBe('grammar');

    // Clause 4: markQuest('grammar') called
    expect(markQuestMock).toHaveBeenCalledWith('grammar');

    // Clause 5: setStats called with a fn that increments gc + appends 'dative' to vs
    expect(setStats).toHaveBeenCalled();
    // writeDelta should include { gc: 1, vs: ['dative'] }
    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['dative']) }),
    );
  });
});
```

- [ ] **Step 2: Run test, verify it passes**

```bash
npm test -- exerciseContract --run
```

Expected: 1 test passes. If it fails, the test helper `completeDrill` may need tuning for DativeDrill's button text. Inspect output and adjust the regex selectors until DativeDrill passes.

- [ ] **Step 3: Commit**

```bash
git add src/tests/exerciseContract.test.tsx
git commit -m "test: scaffold Exercise Contract test against DativeDrill"
```

---

### Task 3: Extend contract test to the 5 other gold drills

**Files:**
- Modify: `src/tests/exerciseContract.test.tsx`

- [ ] **Step 1: Add 5 more test cases**

Add after the existing `DativeDrill` test, inside the same `describe` block:

```tsx
const ADDITIONAL_GOLD_DRILLS = [
  { name: 'ImperativeDrill', path: 'ImperativeDrill', vsTag: 'imperative' },
  { name: 'InstrumentalDrill', path: 'InstrumentalDrill', vsTag: 'instrumental' },
  { name: 'PassiveDrill', path: 'PassiveDrill', vsTag: 'passive' },
  { name: 'CliticDrill', path: 'CliticDrill', vsTag: 'clitic' },
  { name: 'NegationGenDrill', path: 'NegationGenDrill', vsTag: 'negationgen' },
];

for (const drill of ADDITIONAL_GOLD_DRILLS) {
  it(`${drill.name} follows the contract`, async () => {
    const mod = await import(`../components/practice/${drill.path}`);
    const Component = mod.default;
    const { value, setStats, writeDelta } = makeStatsCtx();
    const award = vi.fn();
    const goBack = vi.fn();
    renderWithCtx(<Component goBack={goBack} award={award} />, value);

    await completeDrill(award);

    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0][0]).toBeGreaterThan(0);
    expect(award.mock.calls[0][2]).toBe('grammar');
    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(setStats).toHaveBeenCalled();
    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining([drill.vsTag]) }),
    );
  });
}
```

- [ ] **Step 2: Run tests**

```bash
npm test -- exerciseContract --run
```

Expected: 6 tests pass (DativeDrill + 5 others). If any fail, that drill is **already broken** and may need to be added to Task 6/7/8 fix scope. Document any unexpected failures inline as a comment in the test, do not fix them in this task.

- [ ] **Step 3: Commit**

```bash
git add src/tests/exerciseContract.test.tsx
git commit -m "test: extend Exercise Contract test to 5 more gold drills"
```

---

### Task 4: Re-tag CEFR_EXERCISE_POOL to fix Genitive bucket bloat

**Files:**
- Modify: `src/hooks/useDailySession.ts:81-98`

- [ ] **Step 1: Edit the four mislabeled entries**

In `src/hooks/useDailySession.ts`, change these four entries inside `CEFR_EXERCISE_POOL`:

```ts
// Replace lines 81-98 (4 of the 6 genitive-tagged entries):
{ id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', cefr: 'A2', category: 'vocab-a2' },
{ id: 'unjumble', label: 'Word Order', screen: 'unjumble', cefr: 'A2', category: 'vocab-a2' },
{ id: 'prepdrill', label: 'Prepositions', screen: 'prepdrill', cefr: 'A2', category: 'genitive' },
{ id: 'negation', label: 'Negation', screen: 'negation', cefr: 'A2', category: 'genitive' },
{ id: 'sentbuild', label: 'Build Sentences', screen: 'sentbuild', cefr: 'A2', category: 'vocab-a2' },
{ id: 'sentencetiles', label: 'Tile Assembly', screen: 'sentencetiles', cefr: 'A2', category: 'vocab-a2' },
```

Only the `category` field changes on `cloze`, `unjumble`, `sentbuild`, `sentencetiles`. `prepdrill` and `negation` keep `category: 'genitive'` (genuinely correct — Croatian negation requires genitive).

- [ ] **Step 2: Run existing useDailySession tests**

```bash
npm test -- useDailySession --run
```

Expected: all existing tests pass. The session-build tests verify counts and order, not specific category tags — re-tagging should not break them. If a test fails because it asserted on a specific category tag, update that assertion to the new tag.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDailySession.ts
git commit -m "fix(daily-session): retag cloze/unjumble/sentbuild/sentencetiles away from genitive"
```

---

### Task 5: Fix PrepDrill to follow the contract

**Files:**
- Modify: `src/components/practice/PrepDrill.tsx`

The current PrepDrill has `finishFired` and calls `award` correctly, but it lacks `markQuest`, `setStats`/`vs:[]`, and `writeDelta`. Add them.

- [ ] **Step 1: Replace the completion handler**

In `src/components/practice/PrepDrill.tsx`, find the `if (ppI >= total)` block (lines 24–50). Replace the entire block with:

```tsx
if (ppI >= total) {
  return (
    <div className="scr-wrap">
      {H('📍 Preposition Drills', 'Fill in the correct preposition', goBack)}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>{ppS >= total * 0.8 ? '🏆' : '📚'}</div>
        <h2>
          {ppS} / {total}
        </h2>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '8px 0 16px' }}>
          +{ppS * 5} XP
        </div>
        <button
          className="b bp"
          onClick={() => {
            if (finishFired.current) return;
            finishFired.current = true;
            if (typeof award === 'function') award(ppS * 5, false, 'grammar');
            markQuest('grammar');
            if (!stats.vs?.includes('preposition')) {
              setStats((prev) => {
                if (prev.vs?.includes('preposition')) return prev;
                return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'preposition'] };
              });
              if (writeDelta) writeDelta({ gc: 1, vs: ['preposition'] });
            }
            goBack();
          }}
        >
          🏠 Done
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add imports and useStats hook**

At top of file, replace:

```tsx
import React, { useState, useRef } from 'react';
import { H, Bar, sh, PREPDRILL } from '../../data';
```

with:

```tsx
import React, { useState, useRef } from 'react';
import { H, Bar, sh, PREPDRILL } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
```

Then immediately inside the default export function body (after the destructure `goBack, award`), add:

```tsx
const { stats, setStats, writeDelta } = useStats();
```

- [ ] **Step 3: Add PrepDrill to contract test**

In `src/tests/exerciseContract.test.tsx`, add to `ADDITIONAL_GOLD_DRILLS`:

```tsx
{ name: 'PrepDrill', path: 'PrepDrill', vsTag: 'preposition' },
```

- [ ] **Step 4: Run contract test**

```bash
npm test -- exerciseContract --run
```

Expected: all 7 tests pass (including new PrepDrill).

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/PrepDrill.tsx src/tests/exerciseContract.test.tsx
git commit -m "fix(prepdrill): conform to Exercise Contract (vs/gc/markQuest/writeDelta)"
```

---

### Task 6: Audit + fix ConjugationDrill

**Files:**
- Modify: `src/components/practice/ConjugationDrill.tsx`

- [ ] **Step 1: Read the file and identify gaps**

Read `src/components/practice/ConjugationDrill.tsx`. Identify which contract clauses are violated. Common violations expected (per audit report):
- Missing `vs:['conjugation']` tag
- Missing `markQuest('grammar')` on completion
- Missing `setStats({ gc: prev.gc + 1 })` on completion
- Missing `writeDelta({ gc: 1, vs: ['conjugation'] })`

- [ ] **Step 2: Apply the same completion-block pattern as PrepDrill (Task 5)**

Use the gold pattern from `DativeDrill.tsx` lines 188–199 as a guide. Wrap in `if (!stats.vs?.includes('conjugation')) { ... }` guard, increment `gc`, append `'conjugation'` to `vs[]`, call `markQuest('grammar')`, call `writeDelta`.

If `useStats` isn't imported, add: `import { useStats } from '../../context/StatsContext';` and `const { stats, setStats, writeDelta } = useStats();` at the top of the component body.

If `markQuest` isn't imported, add: `import { markQuest } from '../../lib/quests.js';`.

Keep the existing question state machine and rendering — only modify the completion block.

- [ ] **Step 3: Add to contract test**

In `src/tests/exerciseContract.test.tsx`, add:

```tsx
{ name: 'ConjugationDrill', path: 'ConjugationDrill', vsTag: 'conjugation' },
```

- [ ] **Step 4: Run contract test**

```bash
npm test -- exerciseContract --run
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/ConjugationDrill.tsx src/tests/exerciseContract.test.tsx
git commit -m "fix(conjugationdrill): conform to Exercise Contract"
```

---

### Task 7: Audit + fix AspectDrillScreen

**Files:**
- Modify: `src/components/practice/AspectDrillScreen.tsx`

Note: per the audit report, AspectDrillScreen has a deeply different structure (rule cards + embedded questions). If the structure cannot accommodate the contract without major rewrite, **stop and ask jschr in chat** before continuing. Do not attempt a contortion fit.

- [ ] **Step 1: Read the file, decide go/no-go**

Read `src/components/practice/AspectDrillScreen.tsx`. Determine:
- (a) The screen IS testable end-to-end and just needs the completion block aligned → proceed to Step 2.
- (b) The screen is so different that aligning would require major rewrite → escalate. Write a note in chat: "AspectDrillScreen architecture does not fit the 20-MC pattern. Recommend deferring to Phase 1.5 or rewriting separately. Reason: <list specifics>." Mark this task BLOCKED in subagent driver; skip to Task 8.

- [ ] **Step 2 (only if (a)): Apply the completion-block pattern**

Same as Task 6 Step 2, using `vs:['aspect']` as the tag.

- [ ] **Step 3: Add to contract test**

```tsx
{ name: 'AspectDrillScreen', path: 'AspectDrillScreen', vsTag: 'aspect' },
```

- [ ] **Step 4: Run contract test**

```bash
npm test -- exerciseContract --run
```

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/AspectDrillScreen.tsx src/tests/exerciseContract.test.tsx
git commit -m "fix(aspectdrill): conform to Exercise Contract"
```

---

### Task 8: Draft GenitiveDrill content for review

**Files:**
- (none modified in this task — chat-only review gate)

- [ ] **Step 1: Draft 20 Q&A**

Draft 20 multiple-choice questions covering:
- 6 possession (`knjiga moga brata`)
- 4 partitive (`čaša vode`)
- 4 negation (`nemam vremena`)
- 4 prepositions (iz, od, do, bez, kod)
- 2 quantity (`puno ljudi`, `malo novca`)

Each entry shape (TypeScript object literal):

```ts
{
  q: 'Pijem čašu ___.',
  opts: ['vode', 'voda', 'vodi', 'vodom'],
  answer: 'vode',
  en: 'I drink a glass of water.',
  tip: "Partitive after a measure noun ('čašu') takes genitive: voda → vode",
},
```

- [ ] **Step 2: Post all 20 Q&A in chat for jschr review**

Format: a single code block with all 20 entries.

- [ ] **Step 3: Wait for jschr review**

jschr will respond with one of:
- "Approved" — proceed to Task 9.
- "Approved with edits: <list>" — apply edits, post revised version, wait for re-approval.
- "Rework: <reason>" — redraft and re-post.

Do NOT proceed to Task 9 without explicit approval text in chat.

---

### Task 9: Build GenitiveDrill component + register

**Files:**
- Create: `src/components/practice/GenitiveDrill.tsx`
- Modify: `src/components/AppRouter.tsx` (add lazy import + screen case)
- Modify: `src/hooks/useDailySession.ts` (add pool entry, update CATEGORY_SCREEN_MAP)
- Modify: `src/tests/exerciseContract.test.tsx`
- Create: `src/tests/GenitiveDrill.test.tsx`

- [ ] **Step 1: Copy DativeDrill structure to new file**

Copy `src/components/practice/DativeDrill.tsx` to `src/components/practice/GenitiveDrill.tsx`. Then in the new file:

1. Replace the `DATA` const array with the 20 approved Q&A from Task 8.
2. Replace every occurrence of the string `'dative'` with `'genitive'` (the `vs:[]` tag).
3. Replace the header text: `H('🤝 Dative Case', 'Indirect objects, giving, helping, liking', goBack)` → `H('📖 Genitive Case', 'Possession, partitive, negation, prepositions', goBack)`.
4. Replace the function declaration: `export default function DativeDrill(...)` → `export default function GenitiveDrill(...)`.

- [ ] **Step 2: Write per-drill smoke test**

Create `src/tests/GenitiveDrill.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsContext } from '../context/StatsContext';
import type { Stats } from '../types';
import GenitiveDrill from '../components/practice/GenitiveDrill';

vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));

function makeCtx() {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const stats: Stats = { xp: 0, lc: 0, gc: 0, sc: 0, vs: [] } as Stats;
  return { value: { stats, setStats, writeDelta } };
}

describe('GenitiveDrill', () => {
  it('renders the first question', () => {
    const { value } = makeCtx();
    render(
      <StatsContext.Provider value={value as never}>
        <GenitiveDrill goBack={vi.fn()} award={vi.fn()} />
      </StatsContext.Provider>,
    );
    // First question shows progress "1 / 20"
    expect(screen.getByText(/1 \/ 20/)).toBeInTheDocument();
  });

  it('advances to question 2 after selecting an option and clicking Next', () => {
    const { value } = makeCtx();
    render(
      <StatsContext.Provider value={value as never}>
        <GenitiveDrill goBack={vi.fn()} award={vi.fn()} />
      </StatsContext.Provider>,
    );
    // Click first option (any button NOT matching Next/Back)
    const optionBtn = screen
      .getAllByRole('button')
      .find((b) => b.className.includes('ob'));
    expect(optionBtn).toBeTruthy();
    fireEvent.click(optionBtn!);
    fireEvent.click(screen.getByText(/Next/));
    expect(screen.getByText(/2 \/ 20/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Add to contract test**

In `src/tests/exerciseContract.test.tsx`, add:

```tsx
{ name: 'GenitiveDrill', path: 'GenitiveDrill', vsTag: 'genitive' },
```

- [ ] **Step 4: Register in AppRouter**

In `src/components/AppRouter.tsx`, near the existing `const DativeDrill = lazyWithReload(...)` line (~186), add:

```tsx
const GenitiveDrill = lazyWithReload(() => import('./practice/GenitiveDrill'));
```

Then find the section that maps the `screen` state value to the component (search for `'dativedrill'` or `case 'instrumental'`). Add a new case:

```tsx
case 'genitivedrill':
  return <GenitiveDrill goBack={goBack} award={award} />;
```

(Use the exact prop shape the existing `DativeDrill` case uses — copy that case verbatim and just swap component + screen ID.)

- [ ] **Step 5: Register in useDailySession**

In `src/hooks/useDailySession.ts`:

1. In `CATEGORY_SCREEN_MAP`, change:
   ```ts
   genitive: 'prepdrill',
   ```
   to:
   ```ts
   genitive: 'genitivedrill',
   ```

2. In `CEFR_EXERCISE_POOL`, add a new entry after the existing `genitive`-tagged ones (around line 84):
   ```ts
   { id: 'genitivedrill', label: 'Genitive Case', screen: 'genitivedrill', cefr: 'A2', category: 'genitive' },
   ```

- [ ] **Step 6: Run all relevant tests**

```bash
npm test -- GenitiveDrill exerciseContract useDailySession --run
```

Expected: GenitiveDrill smoke (2 tests) passes, contract test for GenitiveDrill passes, useDailySession tests still pass.

- [ ] **Step 7: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/GenitiveDrill.tsx \
        src/components/AppRouter.tsx \
        src/hooks/useDailySession.ts \
        src/tests/exerciseContract.test.tsx \
        src/tests/GenitiveDrill.test.tsx
git commit -m "feat(drill): add GenitiveDrill conforming to Exercise Contract"
```

---

### Task 10: Draft NominativeDrill content for review

**Files:**
- (none modified — chat-only review gate)

- [ ] **Step 1: Draft 20 Q&A**

Cover: 6 subject ID, 5 predicate nominative, 4 plural subjects, 5 gender recognition (masc/fem/neut endings).

- [ ] **Step 2: Post in chat for jschr review**

- [ ] **Step 3: Wait for explicit approval**

---

### Task 11: Build NominativeDrill component + register

**Files:**
- Create: `src/components/practice/NominativeDrill.tsx`
- Modify: `src/components/AppRouter.tsx`
- Modify: `src/hooks/useDailySession.ts`
- Modify: `src/tests/exerciseContract.test.tsx`
- Create: `src/tests/NominativeDrill.test.tsx`

- [ ] **Step 1: Mirror Task 9 steps 1-3**

Use `'nominative'` as the `vs:` tag. Use header `H('🏷️ Nominative Case', 'Subjects and identity statements', goBack)`. Screen ID: `nomdrill`.

- [ ] **Step 2: Register in AppRouter**

Add lazy import and screen case for `'nomdrill'` → `<NominativeDrill ... />`.

- [ ] **Step 3: Register in useDailySession**

In `CEFR_EXERCISE_POOL`, add:

```ts
{ id: 'nomdrill', label: 'Nominative Case', screen: 'nomdrill', cefr: 'A1', category: 'vocab-a2' },
```

(Category is `vocab-a2`, not a new `nominative` category — adaptive engine doesn't have a `nominative` SkillCategory, and nominative is foundational/A1.)

- [ ] **Step 4: Run tests, typecheck, lint**

```bash
npm test -- NominativeDrill exerciseContract useDailySession --run
npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/NominativeDrill.tsx \
        src/components/AppRouter.tsx \
        src/hooks/useDailySession.ts \
        src/tests/exerciseContract.test.tsx \
        src/tests/NominativeDrill.test.tsx
git commit -m "feat(drill): add NominativeDrill conforming to Exercise Contract"
```

---

### Task 12: Draft LocativeDrill content for review

**Files:** (chat-only)

- [ ] **Step 1: Draft 20 Q&A**

Cover: 6 location (`u kući`), 4 topic (`o knjizi`), 3 time (`u prosincu`), 7 mixed prepositions (u, na, o, po, pri).

- [ ] **Step 2: Post in chat for jschr review**

- [ ] **Step 3: Wait for approval**

---

### Task 13: Build LocativeDrill component + register

**Files:**
- Create: `src/components/practice/LocativeDrill.tsx`
- Modify: `src/components/AppRouter.tsx`
- Modify: `src/hooks/useDailySession.ts`
- Modify: `src/tests/exerciseContract.test.tsx`
- Create: `src/tests/LocativeDrill.test.tsx`

- [ ] **Step 1: Mirror Task 9 steps 1-3**

`vs:` tag: `'locative'`. Header: `H('📍 Locative Case', 'Location, topic, time, prepositions u/na/o/po/pri', goBack)`. Screen ID: `locdrill`.

- [ ] **Step 2: Register in AppRouter**

Add lazy import + screen case for `'locdrill'`.

- [ ] **Step 3: Register in useDailySession**

In `CEFR_EXERCISE_POOL`:

```ts
{ id: 'locdrill', label: 'Locative Case', screen: 'locdrill', cefr: 'B1', category: 'dative-locative' },
```

- [ ] **Step 4: Run tests, typecheck, lint**

```bash
npm test -- LocativeDrill exerciseContract useDailySession --run
npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/LocativeDrill.tsx \
        src/components/AppRouter.tsx \
        src/hooks/useDailySession.ts \
        src/tests/exerciseContract.test.tsx \
        src/tests/LocativeDrill.test.tsx
git commit -m "feat(drill): add LocativeDrill conforming to Exercise Contract"
```

---

### Task 14: Draft Accusative replacement content for review

**Files:** (chat-only)

- [ ] **Step 1: Draft 20 Q&A**

Cover: 5 animate/inanimate masc (`vidim brata` vs `vidim stol`), 6 fem -a → -u (`jedem juhu`), 5 verb governance (voljeti/imati/čitati/kupiti/gledati), 4 prepositions of motion + pronouns (`u školu`, `kroz park`, `mene/me`).

- [ ] **Step 2: Post in chat for jschr review**

- [ ] **Step 3: Wait for approval**

---

### Task 15: Replace AccusativeDrillScreen with quiz-pattern AccusativeDrill

**Files:**
- Delete: `src/components/practice/exercises/AccusativeDrillScreen.tsx`
- Create: `src/components/practice/AccusativeDrill.tsx`
- Modify: `src/components/AppRouter.tsx` (remove old import, add new)
- Modify: `src/hooks/useDailySession.ts` (rename `akudrill` → `accusativedrill`)
- Modify: `src/tests/exerciseContract.test.tsx`
- Create: `src/tests/AccusativeDrill.test.tsx`

- [ ] **Step 1: Create new AccusativeDrill.tsx**

Copy `DativeDrill.tsx` structure to `src/components/practice/AccusativeDrill.tsx`. Use:
- `vs:` tag: `'accusative'`
- Header: `H('🍽️ Accusative Case', 'Direct objects, animate/inanimate, motion prepositions', goBack)`
- DATA: 20 approved Q&A from Task 14
- Function name: `AccusativeDrill`

- [ ] **Step 2: Delete the old file**

```bash
git rm src/components/practice/exercises/AccusativeDrillScreen.tsx
```

- [ ] **Step 3: Update AppRouter**

Remove this line (around line 142):
```tsx
const AccusativeDrillScreen = lazyWithReload(
  () => import('./practice/exercises/AccusativeDrillScreen'),
);
```

Add:
```tsx
const AccusativeDrill = lazyWithReload(() => import('./practice/AccusativeDrill'));
```

Find the existing screen-id case for `'akudrill'` (or `'accusativedrill'`) in the screen switch. Update to:

```tsx
case 'accusativedrill':
  return <AccusativeDrill goBack={goBack} award={award} />;
```

Delete any `case 'akudrill':` block if present.

- [ ] **Step 4: Update useDailySession**

In `CATEGORY_SCREEN_MAP`, change:
```ts
accusative: 'akudrill',
```
to:
```ts
accusative: 'accusativedrill',
```

In `CEFR_EXERCISE_POOL`, change:
```ts
{ id: 'akudrill', label: 'Accusative', screen: 'akudrill', cefr: 'B1', category: 'accusative' },
```
to:
```ts
{ id: 'accusativedrill', label: 'Accusative Case', screen: 'accusativedrill', cefr: 'B1', category: 'accusative' },
```

CEFR stays at B1 to preserve existing unlock behavior. Phase 1.5 or Phase 2 may revisit whether accusative belongs at A2 (it is taught earlier in Croatian pedagogy), but changing it now would alter which exercises appear in low-level users' daily sessions — out of scope for this phase.

- [ ] **Step 5: Grep + replace `akudrill` references elsewhere**

```bash
grep -rn "akudrill" src/ e2e/ functions/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

For every match found, update to `accusativedrill`. Common locations: test files, quest definitions, e2e specs.

- [ ] **Step 6: Write per-drill smoke + add to contract test**

Same shape as Tasks 9/11/13 smoke tests. Add to contract test:

```tsx
{ name: 'AccusativeDrill', path: 'AccusativeDrill', vsTag: 'accusative' },
```

- [ ] **Step 7: Run full test suite, typecheck, lint**

```bash
npm test -- --run
npx tsc --noEmit && npm run lint
```

Expected: everything passes. Pay attention to e2e specs that may reference `akudrill` — update them.

- [ ] **Step 8: Commit**

```bash
git add -A  # captures the deletion too
git commit -m "feat(drill): replace passive AccusativeDrillScreen with quiz-pattern AccusativeDrill"
```

---

### Task 16: Manual smoke test of daily session

**Files:** (none modified — verification only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the app, sign in with a test account**

Browser: http://localhost:5173 (or whatever port Vite reports).

- [ ] **Step 3: Inspect today's session card**

Verify:
- Session has 4-5 activities.
- If "Genitive" appears, the chip routes to the new `GenitiveDrill` (20 Q quiz), NOT `prepdrill`.
- No more than one chip is labeled with "Genitive" or routes to genitive content per session.

- [ ] **Step 4: Complete the Accusative activity (if it appears)**

Verify: 20-Q quiz, final score screen, XP awarded, daily session chip turns to ✓.

- [ ] **Step 5: Force-refresh tomorrow's session**

In DevTools console:
```js
localStorage.removeItem('nh_daily_session');
localStorage.removeItem('nh_session_history');
location.reload();
```

Verify the new session does not heavily lean on Genitive again.

- [ ] **Step 6: Report findings in chat**

Post a brief summary: "Session smoke test: <pass/fail with details>." If fail, surface the specific symptom and stop — do not push to master.

---

### Task 17: Push to master

**Files:** (none modified)

- [ ] **Step 1: Verify clean state**

```bash
npm run lint && npx tsc --noEmit && npm test -- --run
```

Expected: all green.

- [ ] **Step 2: Push**

```bash
git push origin master
```

Cloudflare Pages auto-deploys on push. Wait ~3 minutes, then visit https://nasahrvatska.com to verify production smoke.

- [ ] **Step 3: Update memory**

Write a memory file at `~/.claude/projects/C--Windows-system32/memory/project_nasa_hrvatska_session_2026_05_13.md` summarizing:
- Phase 1 complete: contract enforced, 4 drills fixed, 3 drills added, Accusative replaced, category re-tagged.
- Commit range.
- Phase 2 (non-grammar checkpoints) and Phase 3 (LearnPath in Today's Session) still pending.

Add to MEMORY.md index.

- [ ] **Step 4: Final commit (memory only)**

Memory files are in user home, not the project — no commit needed in the project repo. End of Phase 1.

---

## Acceptance summary

Phase 1 is complete when:

- [x] `docs/exercise-contract.md` exists (Task 1)
- [x] `tests/exerciseContract.test.tsx` enforces contract on all 13 grammar drills (Tasks 2, 3, 5, 6, 7, 9, 11, 13, 15)
- [x] Genitive bucket in CEFR_EXERCISE_POOL contains only `prepdrill`, `negation`, `genitivedrill` (Tasks 4, 9)
- [x] CATEGORY_SCREEN_MAP routes `genitive → genitivedrill`, `accusative → accusativedrill` (Tasks 9, 15)
- [x] 3 new drills exist with reviewed Croatian content (Tasks 8–13)
- [x] AccusativeDrillScreen replaced (Task 15)
- [x] `akudrill` removed from codebase (Task 15 step 5)
- [x] PrepDrill, ConjugationDrill, AspectDrillScreen (if feasible) conform to contract (Tasks 5–7)
- [x] Manual smoke test passes (Task 16)
- [x] Pushed to master, deployed via Cloudflare Pages (Task 17)

## Phase 2 & 3 placeholders

Phase 2 (non-grammar quiz checkpoints): Flashcards / Speaking / Story / Listening / Writing / SRS Review — separate spec + plan to be written after Phase 1 ships.

Phase 3 (LearnPath integration into Today's Session): add LearnPath next-item chip to SessionCard — separate spec + plan to be written after Phase 2 ships.
