# Pedagogy Foundations — Sub-Project 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add mastery gates between curriculum levels (item-completion + level-quiz threshold), introduce 6 high-frequency perfective verbs at A2 as plain vocabulary, and embed retrieval-practice micro-quizzes during lesson flow.

**Architecture:** Three independent additions wired into the existing curriculum. New `LevelQuiz` and `MicroQuiz` components mirror the canonical `DativeDrill.tsx` MC pattern. A new `levelQuizPasses` field on Stats persists pass state and syncs through `buildProgressSnapshot`. LearnPath gains a lock-state visual + Level Quiz CTA. LessonScreen interrupts every 3 items with a non-punishing 2-Q recall check.

**Tech Stack:** React 18 + TypeScript strict, Vitest, React Testing Library, Firestore.

**Spec:** `docs/superpowers/specs/2026-05-13-pedagogy-foundations-design.md`

---

## File Structure

**Create:**
- `src/components/learn/LevelQuiz.tsx` — 10-Q level-end quiz
- `src/components/learn/MicroQuiz.tsx` — 2-Q inline retrieval check
- `src/tests/LevelQuiz.test.tsx`
- `src/tests/MicroQuiz.test.tsx`

**Modify:**
- `src/types/index.ts` — extend `Stats` with `levelQuizPasses: Record<number, { score: number; passedAt: number }>`
- `src/lib/progressSnapshot.ts` — include `levelQuizPasses` in snapshot
- `firestore.rules` — allow `levelQuizPasses` writes with type validation
- `src/components/profile/LearnPath.tsx` — render lock state, Level Quiz CTA
- `src/data/vocabulary.js` — add `perfective_verbs_a2` entries
- Wherever `LEARN_PATH` is defined (search `src/data/` and `src/components/profile/LearnPath.tsx`) — insert `lp_perfective_verbs_a2`
- `src/components/learn/LessonScreen.tsx` — trigger MicroQuiz every 3 items
- `src/components/profile/SettingsTab.tsx` (or wherever Settings live) — micro-quiz toggle
- `src/components/AppRouter.tsx` — wire `LevelQuiz` if it has its own screen ID

---

## Task 1: Add `levelQuizPasses` to Stats type and snapshot

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/progressSnapshot.ts`

- [ ] **Step 1: Find current Stats shape**

Read `src/types/index.ts`. Locate the `Stats` interface (or type). Identify where to add a new field.

- [ ] **Step 2: Add the field**

Add to the `Stats` interface:

```ts
levelQuizPasses?: Record<number, { score: number; passedAt: number }>;
```

Mark as optional (`?`) so existing users (whose Firestore docs lack the field) don't fail type-checks.

- [ ] **Step 3: Find progressSnapshot.ts buildProgressSnapshot**

Read `src/lib/progressSnapshot.ts`. Locate the function that assembles the Firestore document.

- [ ] **Step 4: Include levelQuizPasses in snapshot**

Inside `buildProgressSnapshot` (or wherever the snapshot is assembled), add:

```ts
levelQuizPasses: stats.levelQuizPasses ?? {},
```

Place it alongside other Stats fields that get persisted.

- [ ] **Step 5: Add to applyRemoteProgress merge logic**

Read `src/lib/applyRemoteProgress.ts`. Find where remote fields are merged into local state. Add a clause for `levelQuizPasses`: merge by per-key latest-wins (compare `passedAt` timestamps).

```ts
if (remote.levelQuizPasses) {
  const local = stats.levelQuizPasses ?? {};
  const merged: Record<number, { score: number; passedAt: number }> = { ...local };
  for (const [key, val] of Object.entries(remote.levelQuizPasses)) {
    const k = Number(key);
    const existing = merged[k];
    if (!existing || (val as { passedAt: number }).passedAt > existing.passedAt) {
      merged[k] = val as { score: number; passedAt: number };
    }
  }
  stats.levelQuizPasses = merged;
}
```

- [ ] **Step 6: Update Firestore rules**

Read `firestore.rules`. Find the section validating progress doc shape. Add a clause permitting `levelQuizPasses` as a map of int→map.

```
allow update: if isOwner(uid)
  && request.resource.data.size() <= 209715
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['cefr'])
      || request.resource.data.cefr is int)
  && (!('levelQuizPasses' in request.resource.data)
      || request.resource.data.levelQuizPasses is map);
```

Exact syntax depends on existing rule structure; mirror existing pattern.

- [ ] **Step 7: Run tests**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npx tsc --noEmit && npm test -- --run 2>&1 | tail -10 ; popd
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/types/index.ts src/lib/progressSnapshot.ts src/lib/applyRemoteProgress.ts firestore.rules && \
git commit -m "$(cat <<'EOF'
feat(pedagogy): add levelQuizPasses to Stats + sync

Stats.levelQuizPasses persists per-level quiz pass state. Indexed by
level number (1-7); each value is { score, passedAt }. Syncs through
buildProgressSnapshot. Merge rule: per-key latest-wins by passedAt.
Firestore rules allow the field.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 2: Create LevelQuiz component + tests

**Files:**
- Create: `src/components/learn/LevelQuiz.tsx`
- Create: `src/tests/LevelQuiz.test.tsx`

Canonical reference: `src/components/practice/DativeDrill.tsx`. Mirror its structure.

- [ ] **Step 1: Create LevelQuiz.tsx**

Component signature:

```tsx
import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { rnd } from '../../lib/random.js';

interface LevelQuizQuestion {
  q: string;
  opts: string[];
  answer: string;
  en?: string;
  tip?: string;
}

interface Props {
  levelNumber: number;
  questions: LevelQuizQuestion[];
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  onPass?: () => void;
}

function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

export default function LevelQuiz({ levelNumber, questions, goBack, award, onPass }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [q] = useState(() =>
    shLocal(questions.slice(0, 10)).map((item) => ({ ...item, opts: shLocal([...item.opts]) })),
  );
  const total = q.length;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (total === 0) {
    return (
      <div className="scr-wrap">
        {H(`🎓 Level ${levelNumber} Quiz`, 'Not enough items to build a quiz', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <p>This level needs more items to generate a quiz. Continue practicing.</p>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const cur = q[idx]!;
  const answered = chosen !== null;
  const passed = score >= Math.ceil(total * 0.7);

  function pick(opt: string) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      if (!finishFired.current) {
        finishFired.current = true;
        const xpAward = score * 5;
        award(xpAward, false, 'grammar');
        markQuest('grammar');
        const now = Date.now();
        setStats((prev) => {
          const prevPasses = prev.levelQuizPasses ?? {};
          const existing = prevPasses[levelNumber];
          // Only overwrite if better OR no existing entry
          if (existing && existing.score >= score) {
            return prev;
          }
          return {
            ...prev,
            levelQuizPasses: { ...prevPasses, [levelNumber]: { score, passedAt: now } },
          };
        });
        if (writeDelta) writeDelta({ levelQuizPasses: { [levelNumber]: { score, passedAt: now } } });
        if (passed && onPass) onPass();
      }
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H(`🎓 Level ${levelNumber} Quiz`, '', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🏆' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {passed
              ? `Level ${levelNumber + 1} unlocked!`
              : `Need 70% to pass. Review weak items and try again.`}
          </div>
          <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H(`🎓 Level ${levelNumber} Quiz`, `Show what you've learned`, goBack)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7490', lineHeight: 1.4 }}>
          {cur.q}
        </div>
        {cur.en && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{cur.en}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          {cur.opts.map((opt) => {
            let bg = 'white';
            let bc = 'rgba(14,116,144,.12)';
            if (answered) {
              if (opt === cur.answer) {
                bg = '#dcfce7';
                bc = '#16a34a';
              } else if (opt === chosen) {
                bg = '#fee2e2';
                bc = '#dc2626';
              }
            }
            return (
              <button
                key={opt}
                className="ob"
                style={{ background: bg, borderColor: bc }}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && cur.tip && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#f0f9ff',
              borderRadius: 10,
              border: '1px solid #bae6fd',
              fontSize: 14,
              color: '#0369a1',
            }}
          >
            <strong>{chosen === cur.answer ? '✅ Correct!' : '❌ Incorrect.'}</strong> {cur.tip}
          </div>
        )}
        {answered && (
          <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
            {idx + 1 >= total ? 'See results' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LevelQuiz.test.tsx**

Mirror `src/tests/GenitiveDrill.test.tsx` pattern (mock `useStats`). Sample tests:

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LevelQuiz from '../components/learn/LevelQuiz';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
const mockSetStats = vi.fn();
const mockWriteDelta = vi.fn();
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { xp: 0, lc: 0, gc: 0, sp: 0, vs: [], levelQuizPasses: {} },
    setStats: mockSetStats,
    writeDelta: mockWriteDelta,
  }),
}));

const SAMPLE_QS = [
  { q: 'Q1', opts: ['a', 'b', 'c', 'd'], answer: 'a' },
  { q: 'Q2', opts: ['x', 'y', 'z', 'w'], answer: 'x' },
];

describe('LevelQuiz', () => {
  it('renders the first question with progress 1 / N', () => {
    render(<LevelQuiz levelNumber={1} questions={SAMPLE_QS} goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
  });

  it('shows empty-state when given 0 questions', () => {
    render(<LevelQuiz levelNumber={1} questions={[]} goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/Not enough items/)).toBeInTheDocument();
  });

  it('records levelQuizPasses on completion', () => {
    mockSetStats.mockClear();
    mockWriteDelta.mockClear();
    const award = vi.fn();
    render(
      <LevelQuiz
        levelNumber={3}
        questions={SAMPLE_QS}
        goBack={vi.fn()}
        award={award}
      />,
    );
    // Click correct (index 0) twice
    const opt1 = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(opt1!);
    fireEvent.click(screen.getByText(/Next/));
    const opt2 = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(opt2!);
    fireEvent.click(screen.getByText(/See results/));
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(10, false, 'grammar'); // 2 * 5
    expect(mockWriteDelta).toHaveBeenCalledWith(
      expect.objectContaining({ levelQuizPasses: expect.objectContaining({ 3: expect.any(Object) }) }),
    );
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- LevelQuiz --run 2>&1 | tail -15 ; popd
```

Expected: 3 tests pass.

- [ ] **Step 4: Typecheck + lint**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npx tsc --noEmit && npm run lint 2>&1 | tail -5 ; popd
```

- [ ] **Step 5: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/learn/LevelQuiz.tsx src/tests/LevelQuiz.test.tsx && \
git commit -m "$(cat <<'EOF'
feat(pedagogy): add LevelQuiz component

10-question multiple-choice quiz used to gate level progression.
Pass threshold: 70% (score >= 7). On pass, records to Stats.
levelQuizPasses[level] = { score, passedAt } and fires standard
contract clauses (award score*5 'grammar', markQuest, writeDelta).

Empty-state for levels with <1 question. Re-attempts only overwrite
if score improves.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 3: Integrate LevelQuiz into LearnPath (lock state + CTA)

**Files:**
- Modify: `src/components/profile/LearnPath.tsx`
- Modify: `src/components/AppRouter.tsx` (register `'levelquiz'` screen)
- Modify: `src/hooks/useScreenLauncher.ts` if needed

- [ ] **Step 1: Read LearnPath.tsx**

Read the file to understand its current structure — how levels render, where the `pathData.nextItem` logic computes the next incomplete item, where item lists per level render.

- [ ] **Step 2: Add canUnlockLevel helper**

In LearnPath.tsx (or a co-located helper file), add:

```ts
function canUnlockLevel(targetLevel: number, prevLevelItems: { id: string }[], stats: Stats): boolean {
  if (targetLevel === 1) return true;
  const prevLevel = targetLevel - 1;
  // Condition 1: >= 80% items in prev level completed
  const completed = prevLevelItems.filter((it) => stats.vs?.includes(it.id)).length;
  const threshold = Math.ceil(prevLevelItems.length * 0.8);
  if (completed < threshold) return false;
  // Condition 2: prev level's quiz passed (>= 7/10) OR grandfather (existing user with no quiz record but full completion)
  const quizPass = stats.levelQuizPasses?.[prevLevel];
  if (quizPass && quizPass.score >= 7) return true;
  // Grandfather: if completion is 100% and no quiz record exists, treat as auto-pass
  if (!quizPass && completed >= prevLevelItems.length) return true;
  return false;
}
```

- [ ] **Step 3: Render lock state on levels**

For each level in `LEARN_PATH`, compute `unlocked = canUnlockLevel(level.number, prevLevelItems, stats)`. If `!unlocked`, render the level heading with a 🔒 prefix and reduced opacity (e.g. `opacity: 0.5`). Click on a locked level item shows a tooltip/toast: `"Complete Level ${prev} first."`

- [ ] **Step 4: Render Level Quiz CTA**

For the current level, when item-completion threshold (≥80%) is met, render below the last level item:

```tsx
{levelCompletionMet && !levelQuizPassed && (
  <div className="c" style={{ marginTop: 16, padding: '16px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '2px solid #0e7490', borderRadius: 12 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', marginBottom: 6 }}>
      🎓 Level {currentLevel} Quiz
    </div>
    <div style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>
      10 questions mixed from items you've studied. Pass 70% to unlock Level {currentLevel + 1}.
    </div>
    <button
      className="b bp"
      onClick={() => launchLevelQuiz(currentLevel)}
      style={{ width: '100%' }}
    >
      Take Level Quiz →
    </button>
  </div>
)}
```

- [ ] **Step 5: Add launchLevelQuiz function**

```ts
async function launchLevelQuiz(levelNumber: number) {
  // Build 10 questions from items in this level
  const levelItems = LEARN_PATH[levelNumber - 1]?.items ?? [];
  const completedItems = levelItems.filter((it) => stats.vs?.includes(it.id));
  const questions = await buildLevelQuizQuestions(completedItems);
  // Store via session or use launchPathItem? For now, use a sessionStorage pattern.
  sessionStorage.setItem('nh_level_quiz', JSON.stringify({ levelNumber, questions }));
  setScr('levelquiz');
  sCurEx('levelquiz');
}
```

You'll need `buildLevelQuizQuestions` — write a helper that picks vocab+grammar from completed items and builds 4-option MC. Pattern:

```ts
async function buildLevelQuizQuestions(items: PathItem[]): Promise<LevelQuizQuestion[]> {
  const { V } = await import('../../data');
  const pool: { hr: string; en: string }[] = [];
  for (const item of items) {
    if (!item.topic) continue;
    const vocab = V[item.topic] ?? [];
    pool.push(...vocab.slice(0, 5).map(([hr, en]) => ({ hr, en })));
  }
  if (pool.length < 4) return [];
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((word) => {
    const distractors = pool
      .filter((p) => p.en !== word.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.en);
    return {
      q: word.hr,
      opts: [word.en, ...distractors],
      answer: word.en,
      en: '',
    };
  });
}
```

- [ ] **Step 6: Register LevelQuiz screen in AppRouter**

In `src/components/AppRouter.tsx`:

```tsx
const LevelQuiz = lazyWithReload(() => import('./learn/LevelQuiz'));
```

Then add a case in the screen switch:

```tsx
case 'levelquiz': {
  const data = JSON.parse(sessionStorage.getItem('nh_level_quiz') || '{}');
  return <LevelQuiz levelNumber={data.levelNumber ?? 1} questions={data.questions ?? []} goBack={goBack} award={award} />;
}
```

- [ ] **Step 7: Run tests + typecheck + lint**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- --run 2>&1 | tail -10 && \
  npx tsc --noEmit && npm run lint 2>&1 | tail -5 ; popd
```

- [ ] **Step 8: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/profile/LearnPath.tsx src/components/AppRouter.tsx && \
git commit -m "$(cat <<'EOF'
feat(pedagogy): mastery gates + Level Quiz CTA in LearnPath

Locks future levels until prerequisites met:
- >=80% items completed in prev level
- Prev level's quiz passed (score >= 7/10) OR grandfather rule
  (full completion + no quiz record = auto-pass)

Renders Level Quiz CTA panel below current level when item threshold
met but quiz not yet passed. Click launches LevelQuiz screen with
10 MC questions sampled from completed items.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 4: Add A2 perfective verbs vocabulary + LEARN_PATH item

**Files:**
- Modify: `src/data/vocabulary.js`
- Modify: wherever `LEARN_PATH` is defined (search with `grep -rn "LEARN_PATH " src/`)

- [ ] **Step 1: Add vocabulary entries**

In `src/data/vocabulary.js`, locate the `V` object (or equivalent map of `topic → wordArray`). Add a new key:

```js
perfective_verbs_a2: [
  ['moći', 'to be able to / can', 'MOH-chee', 'Mogu ti pomoći. (I can help you.)'],
  ['trebati', 'to need to', 'TREH-bah-tee', 'Trebam vode. (I need water.)'],
  ['postati', 'to become', 'POH-stah-tee', 'Postao je liječnik. (He became a doctor.)'],
  ['doći', 'to come / arrive', 'DOH-chee', 'Doći ću sutra. (I will come tomorrow.)'],
  ['otići', 'to leave / go away', 'OH-tee-chee', 'Otići ćemo u 5. (We will leave at 5.)'],
  ['htjeti', 'to want to', 'HTYEH-tee', 'Hoću kavu. (I want coffee.)'],
  ['dobiti', 'to receive / get', 'DOH-bee-tee', 'Dobio sam poklon. (I got a gift.)'],
],
```

Match the existing vocabulary format exactly (number of array elements per entry, phoneticization style).

- [ ] **Step 2: Locate LEARN_PATH constant**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  grep -rn "LEARN_PATH" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>&1 | head -20 ; popd
```

Find the file where `LEARN_PATH` is defined (not just imported). Typically `src/data/content.tsx`, `src/data/learnPath.ts`, or similar.

- [ ] **Step 3: Insert new path item**

Add after `lp_present_tense` (verbs in present tense, around A2 position) and before `lp_questions_a2`:

```js
{
  id: 'lp_perfective_verbs_a2',
  title: 'Useful Perfective Verbs',
  desc: '7 super-useful verbs. Aspect theory comes later — for now, just learn the meanings.',
  go: 'lesson',
  topic: 'perfective_verbs_a2',
  cefr: 'A2',
  ck: (s) => (s.ct ?? []).includes('perfective_verbs_a2') || (s.lc ?? 0) >= /* prev item lc */ X,
},
```

Set `X` to match the LC count of the item BEFORE this one in the path (i.e., position in the LEARN_PATH topic order). Mirror the pattern of neighboring items.

- [ ] **Step 4: Run tests**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- --run 2>&1 | tail -10 && \
  npx tsc --noEmit ; popd
```

Expected: all pass. `useDailySession.test.ts` should still work — the new item adds a vocab topic, doesn't change pool structure.

- [ ] **Step 5: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/data/vocabulary.js [LEARN_PATH file] && \
git commit -m "$(cat <<'EOF'
feat(curriculum): introduce 7 high-frequency perfective verbs at A2

Adds 'perfective_verbs_a2' vocabulary topic with moći, trebati,
postati, doći, otići, htjeti, dobiti — taught as plain verbs at A2,
deliberately deferring aspect theory to B1 lp_aspect_intro.

LEARN_PATH item lp_perfective_verbs_a2 placed between
lp_present_tense and lp_questions_a2. Lesson framing tells learners
'aspect theory comes later' to pre-empt confusion.

Pedagogical rationale: when B1 aspect theory hits, the perfective
half feels familiar (not novel) because users have already been
using these forms in context.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 5: Create MicroQuiz component + tests

**Files:**
- Create: `src/components/learn/MicroQuiz.tsx`
- Create: `src/tests/MicroQuiz.test.tsx`

- [ ] **Step 1: Create MicroQuiz.tsx**

```tsx
import React, { useState } from 'react';
import { rnd } from '../../lib/random.js';

interface VocabItem {
  hr: string;
  en: string;
}

interface Props {
  items: VocabItem[]; // items shown so far in the lesson; quiz samples 2 from here
  distractors: VocabItem[]; // pool to draw distractors from
  onComplete: () => void; // returns to lesson flow
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

function buildQuestions(items: VocabItem[], distractors: VocabItem[]) {
  const sampled = shLocal(items).slice(0, 2);
  return sampled.map((item) => {
    const wrongOpts = shLocal(distractors.filter((d) => d.en !== item.en))
      .slice(0, 3)
      .map((d) => d.en);
    return {
      q: item.hr,
      answer: item.en,
      opts: shLocal([item.en, ...wrongOpts]),
    };
  });
}

export default function MicroQuiz({ items, distractors, onComplete, award }: Props) {
  const [questions] = useState(() => buildQuestions(items, distractors));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  if (questions.length === 0) {
    // Not enough items — skip the micro-quiz entirely
    React.useEffect(() => onComplete(), []);
    return null;
  }

  const cur = questions[idx]!;
  const answered = chosen !== null;
  const correct = chosen === cur.answer;

  function pick(opt: string) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) award(2, false, 'lesson');
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  return (
    <div className="scr-wrap" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="c" style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 4 }}>
          Quick check {idx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 16 }}>
          What does this mean?
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0e7490',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {cur.q}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {cur.opts.map((opt) => {
            let bg = 'white';
            let bc = 'rgba(14,116,144,.12)';
            if (answered) {
              if (opt === cur.answer) {
                bg = '#dcfce7';
                bc = '#16a34a';
              } else if (opt === chosen) {
                bg = '#fee2e2';
                bc = '#dc2626';
              }
            }
            return (
              <button
                key={opt}
                className="ob"
                style={{ background: bg, borderColor: bc }}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: correct ? '#16a34a' : '#64748b' }}>
              {correct ? '✓ Good!' : `Correct answer: ${cur.answer}`}
            </div>
            <button className="b bp" style={{ width: '100%', marginTop: 12 }} onClick={next}>
              {idx + 1 >= questions.length ? 'Continue lesson →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MicroQuiz.test.tsx**

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MicroQuiz from '../components/learn/MicroQuiz';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

const ITEMS = [
  { hr: 'pas', en: 'dog' },
  { hr: 'mačka', en: 'cat' },
  { hr: 'ptica', en: 'bird' },
];
const DISTRACTORS = [
  { hr: 'riba', en: 'fish' },
  { hr: 'krava', en: 'cow' },
];

describe('MicroQuiz', () => {
  it('renders the first question with the Croatian word visible', () => {
    render(<MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/Quick check/)).toBeInTheDocument();
  });

  it('awards +2 XP on correct answer', () => {
    const award = vi.fn();
    render(<MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={award} />);
    // With rnd=0.9999 the answer stays at opts[0]
    const firstOpt = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(firstOpt!);
    expect(award).toHaveBeenCalledWith(2, false, 'lesson');
  });

  it('does NOT award XP on wrong answer', () => {
    const award = vi.fn();
    render(<MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={award} />);
    // Click an option that is NOT opts[0]
    const opts = screen.getAllByRole('button').filter((b) => b.className.includes('ob'));
    fireEvent.click(opts[1]!);
    expect(award).not.toHaveBeenCalled();
  });

  it('calls onComplete after 2 questions', () => {
    const onComplete = vi.fn();
    render(<MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={onComplete} award={vi.fn()} />);
    // First Q
    fireEvent.click(screen.getAllByRole('button').find((b) => b.className.includes('ob'))!);
    fireEvent.click(screen.getByText(/Next/));
    // Second Q
    fireEvent.click(screen.getAllByRole('button').find((b) => b.className.includes('ob'))!);
    fireEvent.click(screen.getByText(/Continue lesson/));
    expect(onComplete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests + typecheck**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- MicroQuiz --run 2>&1 | tail -15 && \
  npx tsc --noEmit ; popd
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/learn/MicroQuiz.tsx src/tests/MicroQuiz.test.tsx && \
git commit -m "$(cat <<'EOF'
feat(pedagogy): add MicroQuiz inline retrieval check

2-question recall test injected into lesson flow. Tests items the
user has just seen, with distractors from elsewhere in the lesson.

UX: non-punishing. Correct answer = +2 XP and brief 'Good!' feedback.
Wrong answer = shows correct word, no XP loss. No streak/heart penalty.

If <2 items provided (lesson too short), renders nothing and calls
onComplete immediately so lesson flow proceeds without interruption.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 6: Wire MicroQuiz into LessonScreen

**Files:**
- Modify: `src/components/learn/LessonScreen.tsx`

- [ ] **Step 1: Read LessonScreen.tsx**

Understand the current state machine. Identify:
- Where vocab items are presented (the index counter, e.g. `lx`)
- Where the lesson reaches "next item" — the trigger point for MicroQuiz interruption
- How the lesson reads its items list (`lessonItems` prop or state)

- [ ] **Step 2: Add MicroQuiz state**

Inside LessonScreen, add state:

```tsx
const [showMicroQuiz, setShowMicroQuiz] = useState(false);
const [microQuizItemsSeen, setMicroQuizItemsSeen] = useState<VocabItem[]>([]);
```

Plus check user preference:

```tsx
const microQuizEnabled = typeof window !== 'undefined' &&
  localStorage.getItem('nh_microquiz_enabled') !== 'false';
```

- [ ] **Step 3: Trigger MicroQuiz every 3 items**

Wherever the lesson advances to the next item (e.g. `setLx(lx + 1)`), wrap:

```tsx
function advanceItem() {
  const newIdx = lx + 1;
  const itemsSeenCount = newIdx;
  // Trigger every 3 items, but only if total lesson has >= 6 items
  if (
    microQuizEnabled &&
    items.length >= 6 &&
    itemsSeenCount > 0 &&
    itemsSeenCount % 3 === 0 &&
    itemsSeenCount < items.length
  ) {
    setMicroQuizItemsSeen(items.slice(0, itemsSeenCount).map((it) => ({ hr: it[0], en: it[1] })));
    setShowMicroQuiz(true);
    return; // Don't advance lx yet; do it after micro-quiz completes
  }
  setLx(newIdx);
}
```

- [ ] **Step 4: Render MicroQuiz when triggered**

In the main render:

```tsx
if (showMicroQuiz) {
  return (
    <MicroQuiz
      items={microQuizItemsSeen}
      distractors={items.slice(microQuizItemsSeen.length).map((it) => ({ hr: it[0], en: it[1] }))}
      onComplete={() => {
        setShowMicroQuiz(false);
        setLx(lx + 1); // Now advance past the item we were on
      }}
      award={award}
    />
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- LessonScreen MicroQuiz --run 2>&1 | tail -15 && \
  npx tsc --noEmit && npm run lint 2>&1 | tail -5 ; popd
```

If existing LessonScreen tests fail due to micro-quiz state, add a setup that sets `localStorage.setItem('nh_microquiz_enabled', 'false')` in those tests OR pass a small (<6) items array to bypass triggering.

- [ ] **Step 6: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/learn/LessonScreen.tsx && \
git commit -m "$(cat <<'EOF'
feat(pedagogy): integrate MicroQuiz into LessonScreen flow

Every 3 items presented in a lesson with >=6 items, the screen
interrupts with a 2-question MicroQuiz testing recall of items
just seen. After the MicroQuiz returns, lesson resumes at the next
item.

Off-switch: localStorage 'nh_microquiz_enabled' = 'false' bypasses
the interruption entirely. Default ON (key absent treated as 'true').

Lessons with <6 items don't trigger (not enough material).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 7: Add MicroQuiz toggle to Settings

**Files:**
- Modify: `src/components/profile/SettingsTab.tsx` (or wherever Settings live — search for `nh_dark_mode` setting for a pattern)

- [ ] **Step 1: Find Settings component**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  grep -rn "nh_dark_mode\|nh_haptics\|nh_audio" src/components/profile/ 2>&1 | head -10 ; popd
```

Identify the Settings file and the toggle pattern in use.

- [ ] **Step 2: Add the toggle**

Mirror the existing pattern. Sample:

```tsx
const [microQuizEnabled, setMicroQuizEnabled] = useState(
  () => localStorage.getItem('nh_microquiz_enabled') !== 'false',
);

function toggleMicroQuiz() {
  const next = !microQuizEnabled;
  setMicroQuizEnabled(next);
  localStorage.setItem('nh_microquiz_enabled', next ? 'true' : 'false');
}
```

Render alongside other settings:

```tsx
<div className="setting-row">
  <div>
    <div className="setting-label">Quick checks during lessons</div>
    <div className="setting-desc">
      Brief 2-question recall checks every 3 items. Helps retention. No XP penalty for wrong.
    </div>
  </div>
  <Toggle on={microQuizEnabled} onChange={toggleMicroQuiz} />
</div>
```

- [ ] **Step 3: Run tests**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
  npm test -- --run 2>&1 | tail -10 && \
  npx tsc --noEmit && npm run lint 2>&1 | tail -5 ; popd
```

- [ ] **Step 4: Commit**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && \
git add src/components/profile/SettingsTab.tsx && \
git commit -m "$(cat <<'EOF'
feat(settings): add Quick Checks during lessons toggle

Profile > Settings > "Quick checks during lessons" controls the
in-lesson MicroQuiz interruption. Default ON. Stored in localStorage
as 'nh_microquiz_enabled'.

Users who prefer uninterrupted lesson flow can disable; retention
research recommends keeping it on.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" && git push origin master ; popd
```

---

## Task 8: Manual smoke test + final verification

**Files:** (none modified — verification only)

- [ ] **Step 1: Local dev server**

```bash
pushd "/c/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2" && npm run dev ; popd
```

- [ ] **Step 2: Verify mastery gate**

Open `http://localhost:5173`. Sign in (or use Guest mode). Navigate to LearnPath. Verify:
- Levels beyond current are 🔒 with reduced opacity
- Click on a locked-level item shows the "Complete Level N first" message
- Current level renders normally

- [ ] **Step 3: Verify Level Quiz CTA**

Manually edit `localStorage` to simulate 80%+ completion of Level 1:

```js
// In DevTools console:
const stats = JSON.parse(localStorage.getItem('nh_stats') || '{}');
// Add the L1 item ids to vs[] — get them from LEARN_PATH
stats.vs = ['lp_alphabet', 'lp_greetings', /* etc — all L1 items */];
stats.lc = 25;
stats.gc = 6;
localStorage.setItem('nh_stats', JSON.stringify(stats));
location.reload();
```

Then verify the Level Quiz CTA panel appears below Level 1's items.

- [ ] **Step 4: Run Level Quiz**

Click "Take Level Quiz →". Complete 10 questions. Verify on pass (≥7/10):
- "Level 2 unlocked!" message
- `localStorage.nh_stats.levelQuizPasses[1]` updated
- Returning to LearnPath: Level 2 is now unlocked

- [ ] **Step 5: Verify MicroQuiz in a lesson**

Navigate to any A1 or A2 lesson with ≥6 items. Progress through items. After item 3, verify MicroQuiz appears. Answer correctly → +2 XP. Continue. After item 6, verify another MicroQuiz.

- [ ] **Step 6: Verify MicroQuiz toggle**

Go to Profile > Settings. Toggle "Quick checks during lessons" OFF. Return to a lesson. Verify MicroQuiz does NOT trigger.

- [ ] **Step 7: Verify A2 perfective verbs lesson**

Navigate to Level 2 (Pathfinder). Verify "Useful Perfective Verbs" appears in the path. Click → vocabulary lesson with 7 verbs (moći, trebati, postati, doći, otići, htjeti, dobiti). Verify lesson intro mentions "aspect theory comes later".

- [ ] **Step 8: Report results**

Surface findings in chat. If any verification fails, file a follow-up task.

---

## Acceptance summary

- [ ] `levelQuizPasses` field in Stats type + buildProgressSnapshot + Firestore rules
- [ ] `LevelQuiz.tsx` component created with tests
- [ ] LearnPath renders lock state for future levels, CTA for level quizzes
- [ ] AppRouter wires `'levelquiz'` screen
- [ ] `perfective_verbs_a2` vocabulary entries (7 verbs)
- [ ] `lp_perfective_verbs_a2` item in LEARN_PATH at correct position
- [ ] `MicroQuiz.tsx` component created with tests
- [ ] LessonScreen triggers MicroQuiz every 3 items (≥6-item lessons only)
- [ ] Profile Settings: "Quick checks during lessons" toggle
- [ ] Manual smoke test passes all 7 verification points
- [ ] Full test suite green, lint clean, typecheck clean
- [ ] All commits pushed to master, CF Pages auto-deploys
