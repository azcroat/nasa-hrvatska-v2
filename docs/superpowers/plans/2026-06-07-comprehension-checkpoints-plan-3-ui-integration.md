# Comprehension Checkpoints — Plan 3: UI + integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the checkpoint exam in the app — the 5-active-day popup invite, the shared exam runner (MCQ + productive speaking), and the pass/focus/grace/demote result — wired into the App on a `syncReady`-gated, never-mid-lesson trigger, with the existing equivalency test refactored onto the same runner. Flip the feature on.

**Architecture:** A `useCheckpoint` hook owns the flow state machine (`idle → invite → running → result`). It builds a concrete exam from the Plan 1 composer + real `cefrEquivalencyItems`, runs it through a generic `ExamRunner` (which buckets MCQ answers by skill and delegates speaking to `SpeakingTaskScreen` + the Plan 2 `whisperClaudeScorer`), then records the outcome via `recordCheckpointResult`. The invite mounts at the App level (in `AppModals`) gated on `_syncReady` + a safe, non-exercise screen — matching the goal-modal discipline but App-scoped so it fires on foreground. `recordActiveDayNow()` is called on app open to drive the cadence.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, Playwright (E2E with stubbed audio).

**Spec:** `docs/superpowers/specs/2026-06-07-comprehension-checkpoints-design.md` §5.4–5.8, §9. **Depends on:** Plan 1 (logic/data) + Plan 2 (`SpeakingScorer`, `whisperClaudeScorer`).

---

## File structure (this plan)

| File | Responsibility |
|---|---|
| `src/lib/checkpointConfig.ts` (create) | `CHECKPOINTS_ENABLED` flag + `CHECKPOINT_CORE_COUNT`. |
| `src/lib/checkpointSchedule.ts` (modify) | Add `shouldShowCheckpoint` App-gate helper (pure). |
| `src/lib/checkpointExam.ts` (create) | `RunnerQuestion` type + `buildCheckpointExam` (composer → real items). |
| `src/components/exam/SpeakingTaskScreen.tsx` (create) | Record → assess (injected `SpeakingScorer`) → score; null⇒retry. |
| `src/components/exam/ExamRunner.tsx` (create) | Generic MCQ + speaking runner → `SkillScores`. |
| `src/components/exam/CheckpointInviteModal.tsx` (create) | 5-active-day invite (Start / Remind me tonight). |
| `src/components/exam/CheckpointResultScreen.tsx` (create) | pass / pass_focus / grace / demote result. |
| `src/hooks/useCheckpoint.ts` (create) | Flow state machine + record outcome. |
| `src/App.tsx` (modify) | `recordActiveDayNow()` on open; mount checkpoint flow via `useCheckpoint`. |
| `src/components/shared/AppModals.tsx` (modify) | Render `CheckpointInviteModal`/runner/result gated on `_syncReady` + safe screen. |
| `src/components/profile/EquivalencyTestScreen.tsx` (modify) | Refactor question phase onto `ExamRunner` (no behaviour change). |
| `e2e/checkpoints.spec.ts` (create) | Invite/defer, full pass, fail→grace→fail→demote (audio stubbed). |

**Types (locked):**
```ts
interface RunnerQuestion { id: string; skill: SkillKey; prompt: string; options: string[]; correctIndex: number; passage?: string; level: CefrLevel; }
```

---

## Task 1: Feature flag + App-gate helper

**Files:**
- Create: `src/lib/checkpointConfig.ts`
- Modify: `src/lib/checkpointSchedule.ts`
- Test: `src/lib/__tests__/checkpointGate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/checkpointGate.test.ts
import { describe, it, expect } from 'vitest';
import { shouldShowCheckpoint } from '../checkpointSchedule.js';

const base = { syncReady: true, authScreen: 'app', currentScreen: 'dashboard', due: true };

describe('shouldShowCheckpoint', () => {
  it('shows when synced, in-app, on a safe screen, and due', () => {
    expect(shouldShowCheckpoint(base)).toBe(true);
  });
  it('never shows before syncReady (cross-device safety)', () => {
    expect(shouldShowCheckpoint({ ...base, syncReady: false })).toBe(false);
  });
  it('never shows mid-exercise (only safe screens)', () => {
    expect(shouldShowCheckpoint({ ...base, currentScreen: 'lesson' })).toBe(false);
  });
  it('never shows outside the app shell', () => {
    expect(shouldShowCheckpoint({ ...base, authScreen: 'welcome' })).toBe(false);
  });
  it('does not show when not due', () => {
    expect(shouldShowCheckpoint({ ...base, due: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checkpointGate.test.ts`
Expected: FAIL — `shouldShowCheckpoint` not exported.

- [ ] **Step 3: Implement**

Create `src/lib/checkpointConfig.ts`:

```ts
// src/lib/checkpointConfig.ts
/**
 * Master switch for the Comprehension Checkpoints feature. Stays FALSE until
 * the speaking item banks + /api/assess-speaking are validated in prod
 * (see Plan 3 rollout). Flip to true to activate for all users.
 */
export const CHECKPOINTS_ENABLED = false;

/** Number of current-level MCQ items in a checkpoint (plus 2 retention + speaking). */
export const CHECKPOINT_CORE_COUNT = 3;
```

Append to `src/lib/checkpointSchedule.ts`:

```ts
/** Screens during which an exam popup is acceptable (never mid-lesson). */
const SAFE_SCREENS = new Set(['dashboard', 'home', 'profile', 'stats']);

/**
 * App-layer gate for showing the checkpoint invite. Combines the `due` result
 * with runtime conditions: only after cross-device sync resolves, only inside
 * the app shell, and only on a non-exercise screen. Mirrors the goal-modal
 * discipline (PRs #12/#13) but is App-scoped so it fires on foreground.
 */
export function shouldShowCheckpoint(args: {
  syncReady: boolean;
  authScreen: string;
  currentScreen: string;
  due: boolean;
}): boolean {
  return args.syncReady && args.authScreen === 'app' && SAFE_SCREENS.has(args.currentScreen) && args.due;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checkpointGate.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkpointConfig.ts src/lib/checkpointSchedule.ts src/lib/__tests__/checkpointGate.test.ts
git commit -m "feat(checkpoints): feature flag + App-layer show gate"
```

---

## Task 2: `buildCheckpointExam` — composer → real renderable questions

**Files:**
- Create: `src/lib/checkpointExam.ts`
- Test: `src/lib/__tests__/checkpointExam.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/checkpointExam.test.ts
import { describe, it, expect } from 'vitest';
import { buildCheckpointExam } from '../checkpointExam.js';
import { getCertificationState } from '../cefrCertification.js';

function seededRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length]!;
}

describe('buildCheckpointExam (B1)', () => {
  it('produces renderable B1 questions + 2 retention from below + a speaking section', () => {
    const exam = buildCheckpointExam('B1', getCertificationState(), [], seededRng([0, 0.3, 0.6, 0.1, 0.5, 0.2]));
    // 3 core (B1) + 2 retention (below B1)
    expect(exam.questions.length).toBe(5);
    expect(exam.questions.every((q) => q.options.length === 4 && q.prompt.length > 0)).toBe(true);
    expect(exam.questions.filter((q) => q.level === 'B1').length).toBe(3);
    expect(exam.questions.filter((q) => q.level !== 'B1').length).toBe(2);
    expect(exam.speaking.tasks.length).toBeGreaterThanOrEqual(1);
    expect(exam.speaking.level).toBe('B1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checkpointExam.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/checkpointExam.ts
import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER, cefrRank } from './cefr.js';
import type { SkillKey, CertificationState } from './cefrCertification.js';
import { buildCheckpointBlueprint } from './examBlueprint.js';
import { composeExam, type ComposerBanks, type ExamItem, type Rng } from './examComposer.js';
import { getNextTestFor } from '../data/cefrEquivalencyItems.js';
import { getSpeakingTasks, type SpeakingTask } from '../data/speakingTasks.js';
import { CHECKPOINT_CORE_COUNT } from './checkpointConfig.js';

export interface RunnerQuestion {
  id: string;
  skill: SkillKey;
  prompt: string;
  options: string[];
  correctIndex: number;
  passage?: string;
  level: CefrLevel;
}

export interface CheckpointExam {
  level: CefrLevel;
  questions: RunnerQuestion[];
  speaking: { level: CefrLevel; tasks: SpeakingTask[] };
}

/** Map the equivalency item bank for `level` into renderable questions. */
function questionsForLevel(level: CefrLevel): RunnerQuestion[] {
  const set = getNextTestFor(level); // set.levelFrom === level tests `level` competency
  if (!set) return [];
  return set.items.map((it, i) => ({
    id: `${level}#${i}`,
    skill: it.skill,
    prompt: it.q,
    options: it.options,
    correctIndex: it.c,
    passage: it.passage,
    level,
  }));
}

function sample<T>(arr: T[], n: number, rng: Rng): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length) % pool.length, 1)[0]!);
  }
  return out;
}

/**
 * Builds a concrete checkpoint exam: CHECKPOINT_CORE_COUNT current-level
 * questions, 2 retention questions from below (weak-skill-weighted, via the
 * Plan 1 composer), and the speaking section (2 tasks if speaking was flagged,
 * else 1). Retention questions keep their lower level so the runner folds them
 * into the right skill bucket — retention counts toward the gate.
 */
export function buildCheckpointExam(
  level: CefrLevel,
  certState: CertificationState,
  weakSkills: SkillKey[],
  rng: Rng,
): CheckpointExam {
  // Lookup of every below-level + current-level question by composer id.
  const levels = CEFR_ORDER.filter((l) => cefrRank(l) <= cefrRank(level));
  const lookup = new Map<string, RunnerQuestion>();
  const itemsByLevel: ComposerBanks['itemsByLevel'] = {};
  for (const lvl of levels) {
    const qs = questionsForLevel(lvl);
    qs.forEach((q) => lookup.set(q.id, q));
    itemsByLevel[lvl] = qs.map<ExamItem>((q) => ({ id: q.id, skill: q.skill, level: q.level }));
  }

  const speakingFlagged = (certState.checkpoints.focusSkills[level] ?? []).includes('speaking');
  const bp = buildCheckpointBlueprint(level, { speakingFlagged });
  const banks: ComposerBanks = { itemsByLevel, speakingTasksByLevel: { [level]: getSpeakingTasks(level).map((t) => ({ id: t.id })) } };
  const composed = composeExam(bp, banks, { weakTopics: weakSkills }, rng);

  // Core: composer returns ALL current-level items → sample CHECKPOINT_CORE_COUNT.
  const core = sample(composed.coreItems, CHECKPOINT_CORE_COUNT, rng)
    .map((it) => lookup.get(it.id)!)
    .filter(Boolean);
  const retention = composed.retentionItems.map((it) => lookup.get(it.id)!).filter(Boolean);

  const tasksById = new Map(getSpeakingTasks(level).map((t) => [t.id, t]));
  const speakingTasks = composed.speakingTasks.map((s) => tasksById.get(s.id)!).filter(Boolean);

  return { level, questions: [...core, ...retention], speaking: { level, tasks: speakingTasks } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checkpointExam.test.ts`
Expected: PASS (1 test). (If `getNextTestFor` returns null for a level, that level contributes no items — the test uses B1, which has a bank.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkpointExam.ts src/lib/__tests__/checkpointExam.test.ts
git commit -m "feat(checkpoints): buildCheckpointExam bridges composer to real items"
```

---

## Task 3: `SpeakingTaskScreen` component

**Files:**
- Create: `src/components/exam/SpeakingTaskScreen.tsx`
- Test: `src/tests/SpeakingTaskScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/SpeakingTaskScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpeakingTaskScreen from '../components/exam/SpeakingTaskScreen.js';
import type { SpeakingScorer } from '../lib/speaking/SpeakingScorer.js';

const task = { id: 'b1-trip', prompt: 'Opišite putovanje.', promptEn: 'Describe a trip.', seconds: 45 };
const capture = async () => new Blob([new Uint8Array([1])], { type: 'audio/webm' });

function scorerReturning(value: number | null): SpeakingScorer {
  return {
    assess: vi.fn(async () =>
      value === null ? null : { transcript: 't', scores: { range: value, accuracy: value, fluency: value, task: value }, overall: value, confidence: 0.9 },
    ),
  };
}

describe('SpeakingTaskScreen', () => {
  it('records, assesses, and reports the overall score', async () => {
    const onScore = vi.fn();
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorerReturning(0.82)} onScore={onScore} captureAudio={capture} />);
    fireEvent.click(screen.getByTestId('speak-record'));
    await waitFor(() => expect(onScore).toHaveBeenCalledWith(0.82));
  });

  it('on a null assessment shows retry and never reports a (failing) score', async () => {
    const onScore = vi.fn();
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorerReturning(null)} onScore={onScore} captureAudio={capture} />);
    fireEvent.click(screen.getByTestId('speak-record'));
    await waitFor(() => expect(screen.getByTestId('speak-retry')).toBeTruthy());
    expect(onScore).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/SpeakingTaskScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/components/exam/SpeakingTaskScreen.tsx
import { useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SpeakingScorer } from '../../lib/speaking/SpeakingScorer.js';
import type { SpeakingTask } from '../../data/speakingTasks.js';

type Phase = 'idle' | 'recording' | 'assessing' | 'retry';

export interface SpeakingTaskScreenProps {
  task: SpeakingTask;
  level: CefrLevel;
  scorer: SpeakingScorer;
  /** Called with the overall speaking score (0..1) once assessed. */
  onScore: (overall: number) => void;
  /** Capture audio for the task. Default uses MediaRecorder; tests inject a stub. */
  captureAudio?: (seconds: number) => Promise<Blob>;
}

/** Default mic capture via MediaRecorder; resolves a Blob after `seconds`. */
async function defaultCapture(seconds: number): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  return new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    };
    rec.start();
    setTimeout(() => rec.stop(), seconds * 1000);
  });
}

export default function SpeakingTaskScreen({ task, level, scorer, onScore, captureAudio = defaultCapture }: SpeakingTaskScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');

  async function run() {
    setPhase('recording');
    let blob: Blob;
    try {
      blob = await captureAudio(task.seconds);
    } catch {
      setPhase('retry'); // mic denied → retry, never a fail
      return;
    }
    setPhase('assessing');
    const result = await scorer.assess(blob, { level, prompt: task.prompt });
    if (result === null) {
      setPhase('retry');
      return;
    }
    onScore(result.overall);
  }

  return (
    <div className="speaking-task" data-testid="speaking-task">
      <span className="pill pill-violet">Speaking</span>
      <p className="task-hr" lang="hr">{task.prompt}</p>
      <p className="task-en">{task.promptEn}</p>
      {phase === 'idle' && (
        <button className="btn btn-primary" data-testid="speak-record" onClick={run}>🎙️ Tap to record</button>
      )}
      {phase === 'recording' && <p data-testid="speak-recording">● Recording… (~{task.seconds}s)</p>}
      {phase === 'assessing' && <p data-testid="speak-assessing">Assessing your Croatian…</p>}
      {phase === 'retry' && (
        <div>
          <p data-testid="speak-retry">We couldn’t score that clearly. Let’s try once more.</p>
          <button className="btn btn-primary" onClick={run}>Try again</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/SpeakingTaskScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/exam/SpeakingTaskScreen.tsx src/tests/SpeakingTaskScreen.test.tsx
git commit -m "feat(checkpoints): SpeakingTaskScreen (record→assess, null⇒retry)"
```

---

## Task 4: `ExamRunner` component

**Files:**
- Create: `src/components/exam/ExamRunner.tsx`
- Test: `src/tests/ExamRunner.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/ExamRunner.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Stub the speaking screen so this test isolates ExamRunner's MCQ + scoring logic.
vi.mock('../components/exam/SpeakingTaskScreen.js', () => ({
  default: ({ onScore }: { onScore: (n: number) => void }) => (
    <button data-testid="stub-speak" onClick={() => onScore(0.9)}>speak</button>
  ),
}));

import ExamRunner from '../components/exam/ExamRunner.js';
import type { RunnerQuestion } from '../lib/checkpointExam.js';

const questions: RunnerQuestion[] = [
  { id: 'q1', skill: 'vocab', prompt: 'V?', options: ['a', 'b', 'c', 'd'], correctIndex: 0, level: 'B1' },
  { id: 'q2', skill: 'grammar', prompt: 'G?', options: ['a', 'b', 'c', 'd'], correctIndex: 1, level: 'B1' },
];

describe('ExamRunner', () => {
  it('buckets MCQ by skill and folds in the speaking score, then completes', async () => {
    const onComplete = vi.fn();
    render(
      <ExamRunner
        questions={questions}
        speaking={{ level: 'B1', tasks: [{ id: 's1', prompt: 'p', promptEn: 'p', seconds: 45 }], scorer: { assess: vi.fn() } }}
        onComplete={onComplete}
      />,
    );
    // Q1 correct (index 0)
    fireEvent.click(screen.getByTestId('answer-0'));
    fireEvent.click(screen.getByTestId('exam-next'));
    // Q2 correct (index 1)
    fireEvent.click(screen.getByTestId('answer-1'));
    fireEvent.click(screen.getByTestId('exam-next'));
    // Speaking (stubbed) → 0.9
    fireEvent.click(screen.getByTestId('stub-speak'));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0]![0]).toEqual({ vocab: 1, grammar: 1, speaking: 0.9 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/ExamRunner.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/components/exam/ExamRunner.tsx
import { useRef, useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SkillScores, SkillKey } from '../../lib/cefrCertification.js';
import type { SpeakingScorer } from '../../lib/speaking/SpeakingScorer.js';
import type { SpeakingTask } from '../../data/speakingTasks.js';
import type { RunnerQuestion } from '../../lib/checkpointExam.js';
import SpeakingTaskScreen from './SpeakingTaskScreen.js';

export interface ExamRunnerProps {
  questions: RunnerQuestion[];
  speaking?: { level: CefrLevel; tasks: SpeakingTask[]; scorer: SpeakingScorer };
  onComplete: (scores: SkillScores) => void;
}

type Acc = Partial<Record<SkillKey, { total: number; correct: number }>>;

function finalize(acc: Acc, speakingScores: number[]): SkillScores {
  const out: Record<string, number> = {};
  for (const k of Object.keys(acc) as SkillKey[]) {
    const a = acc[k]!;
    if (a.total > 0) out[k] = a.correct / a.total;
  }
  if (speakingScores.length > 0) {
    out.speaking = speakingScores.reduce((s, n) => s + n, 0) / speakingScores.length;
  }
  return out as SkillScores;
}

export default function ExamRunner({ questions, speaking, onComplete }: ExamRunnerProps) {
  const total = questions.length + (speaking?.tasks.length ?? 0);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [acc, setAcc] = useState<Acc>({});
  const [speakIdx, setSpeakIdx] = useState(0);
  const speakScores = useRef<number[]>([]); // accumulated across speaking tasks

  const inMcq = idx < questions.length;
  const q = inMcq ? questions[idx]! : null;

  function next() {
    if (selected === null || !q) return;
    const correct = selected === q.correctIndex ? 1 : 0;
    const prev = acc[q.skill] ?? { total: 0, correct: 0 };
    const nextAcc: Acc = { ...acc, [q.skill]: { total: prev.total + 1, correct: prev.correct + correct } };
    setAcc(nextAcc);
    setSelected(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else if (speaking && speaking.tasks.length > 0) {
      setIdx(questions.length); // enter speaking phase
    } else {
      onComplete(finalize(nextAcc, speakScores.current));
    }
  }

  function onSpeakingScore(score: number) {
    speakScores.current.push(score);
    if (speakIdx + 1 < (speaking?.tasks.length ?? 0)) {
      setSpeakIdx(speakIdx + 1);
      setIdx(idx + 1);
    } else {
      onComplete(finalize(acc, speakScores.current));
    }
  }

  return (
    <div className="exam-runner" data-testid="exam-runner">
      <div className="q-top">
        <span className="q-num" data-testid="exam-progress">{Math.min(idx + 1, total)} / {total}</span>
      </div>

      {inMcq && q && (
        <div>
          <span className="pill pill-blue">{q.skill}</span>
          {q.passage && <div className="q-passage" lang="hr">{q.passage}</div>}
          <div className="q-stem" lang="hr">{q.prompt}</div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              data-testid={`answer-${i}`}
              className={`ans${selected === i ? ' sel' : ''}`}
              onClick={() => setSelected(i)}
            >
              <span className="k">{String.fromCharCode(65 + i)}</span> {opt}
            </button>
          ))}
          <button className="btn btn-primary" data-testid="exam-next" disabled={selected === null} onClick={next}>
            Continue
          </button>
        </div>
      )}

      {!inMcq && speaking && (
        <SpeakingTaskScreen
          key={speakIdx}
          task={speaking.tasks[speakIdx]!}
          level={speaking.level}
          scorer={speaking.scorer}
          onScore={onSpeakingScore}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/ExamRunner.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/exam/ExamRunner.tsx src/tests/ExamRunner.test.tsx
git commit -m "feat(checkpoints): generic ExamRunner (MCQ buckets + speaking fold-in)"
```

---

## Task 5: `CheckpointInviteModal` component

**Files:**
- Create: `src/components/exam/CheckpointInviteModal.tsx`
- Test: `src/tests/CheckpointInviteModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/CheckpointInviteModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckpointInviteModal from '../components/exam/CheckpointInviteModal.js';

describe('CheckpointInviteModal', () => {
  it('shows the level and fires onStart / onSnooze', () => {
    const onStart = vi.fn();
    const onSnooze = vi.fn();
    render(<CheckpointInviteModal level="B1" onStart={onStart} onSnooze={onSnooze} />);
    expect(screen.getByTestId('checkpoint-invite').textContent).toContain('B1');
    fireEvent.click(screen.getByTestId('checkpoint-start'));
    fireEvent.click(screen.getByTestId('checkpoint-snooze'));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/CheckpointInviteModal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/components/exam/CheckpointInviteModal.tsx
import type { CefrLevel } from '../../lib/cefr.js';

export interface CheckpointInviteModalProps {
  level: CefrLevel;
  onStart: () => void;
  onSnooze: () => void;
}

/** The 5-active-day check-in invite (approved mockup screen 1). */
export default function CheckpointInviteModal({ level, onStart, onSnooze }: CheckpointInviteModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="checkpoint-invite">
      <div className="modal-card checkpoint-invite">
        <div className="knight" aria-hidden>🛡️</div>
        <h2 lang="hr">Spreman za provjeru?</h2>
        <p className="subtitle">Ready for a quick check?</p>
        <p>
          You’ve been learning at <b>{level}</b>. Let’s make sure it’s truly yours — a few questions
          plus a short speaking task, about 3 minutes.
        </p>
        <ul className="checkpoint-bullets">
          <li>Covers reading, grammar &amp; vocab</li>
          <li>Plus speaking and 2 retention items from earlier levels</li>
          <li>Pass 80%+ to keep your {level} badge</li>
        </ul>
        <button className="btn btn-primary" data-testid="checkpoint-start" onClick={onStart}>
          Start the check →
        </button>
        <button className="btn btn-ghost" data-testid="checkpoint-snooze" onClick={onSnooze}>
          Remind me tonight
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/CheckpointInviteModal.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/exam/CheckpointInviteModal.tsx src/tests/CheckpointInviteModal.test.tsx
git commit -m "feat(checkpoints): CheckpointInviteModal (start / remind me tonight)"
```

---

## Task 6: `CheckpointResultScreen` component

**Files:**
- Create: `src/components/exam/CheckpointResultScreen.tsx`
- Test: `src/tests/CheckpointResultScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/CheckpointResultScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckpointResultScreen from '../components/exam/CheckpointResultScreen.js';
import type { CheckpointOutcome } from '../lib/checkpointPolicy.js';

const cont = () => vi.fn();

function out(kind: CheckpointOutcome['kind'], extra: Partial<CheckpointOutcome> = {}): CheckpointOutcome {
  return { kind, overall: 80, failedSkills: [], focusSkills: [], demotion: null, ...extra };
}

describe('CheckpointResultScreen', () => {
  it('clean pass shows confirmation', () => {
    render(<CheckpointResultScreen level="B1" outcome={out('pass')} onContinue={cont()} />);
    expect(screen.getByTestId('result-pass')).toBeTruthy();
  });

  it('demote shows the level drop and reassurance', () => {
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('demote', { failedSkills: ['vocab'], focusSkills: ['vocab'], demotion: { from: 'B1', to: 'A2' } })}
        onContinue={cont()}
      />,
    );
    const node = screen.getByTestId('result-demote');
    expect(node.textContent).toContain('A2');
    expect(node.textContent!.toLowerCase()).toContain('streak');
  });

  it('grace offers an immediate retry', () => {
    const onRetry = vi.fn();
    render(<CheckpointResultScreen level="B1" outcome={out('grace', { failedSkills: ['speaking'] })} onContinue={cont()} onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId('result-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/CheckpointResultScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/components/exam/CheckpointResultScreen.tsx
import type { CefrLevel } from '../../lib/cefr.js';
import type { CheckpointOutcome } from '../../lib/checkpointPolicy.js';

export interface CheckpointResultScreenProps {
  level: CefrLevel;
  outcome: CheckpointOutcome;
  onContinue: () => void;
  /** Required for the grace variant (immediate targeted retry). */
  onRetry?: () => void;
}

const skillLabel: Record<string, string> = {
  vocab: 'Vocabulary', grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking',
};

export default function CheckpointResultScreen({ level, outcome, onContinue, onRetry }: CheckpointResultScreenProps) {
  if (outcome.kind === 'pass' || outcome.kind === 'pass_focus') {
    return (
      <div className="checkpoint-result center-col" data-testid="result-pass">
        <div className="badge-ring"><div className="core">✓</div></div>
        <h2>{level} confirmed! 🎉</h2>
        <p className="subtitle">Your {level} is the real deal. Badge kept, streak intact.</p>
        {outcome.kind === 'pass_focus' && outcome.focusSkills.length > 0 && (
          <p className="focus-note" data-testid="result-focus">
            Strong overall — we’ll weave extra {outcome.focusSkills.map((s) => skillLabel[s] ?? s).join(', ')} practice into your {level} lessons.
          </p>
        )}
        <button className="btn btn-primary" onClick={onContinue}>Keep going →</button>
      </div>
    );
  }

  if (outcome.kind === 'grace') {
    return (
      <div className="checkpoint-result center-col" data-testid="result-grace">
        <div className="badge-ring warn"><div className="core">↻</div></div>
        <h2>Almost — let’s shore this up</h2>
        <p className="subtitle">
          A couple of {outcome.failedSkills.map((s) => skillLabel[s] ?? s).join(', ')} answers slipped.
          Try a quick focused round now — your {level} stays put.
        </p>
        <button className="btn btn-primary" data-testid="result-retry" onClick={onRetry}>Focused retry →</button>
        <button className="btn btn-ghost" onClick={onContinue}>Later</button>
      </div>
    );
  }

  // demote
  const to = outcome.demotion?.to ?? level;
  return (
    <div className="checkpoint-result center-col" data-testid="result-demote">
      <div className="badge-ring warn"><div className="core">↻</div></div>
      <h2>Let’s lock in {level}</h2>
      <div className="lvl-move">
        <span className="lvl-chip from">{level}</span> → <span className="lvl-chip to">{to}</span>
      </div>
      <p className="reassure">
        A few {level} ideas aren’t solid yet — totally normal. We’ll strengthen them, then you re-earn {level}.
        <b> Your XP &amp; streak stay untouched.</b>
      </p>
      <div className="focus-lab">Your focus</div>
      <ul>
        {outcome.failedSkills.map((s) => <li key={s}>{skillLabel[s] ?? s}</li>)}
      </ul>
      <button className="btn btn-primary" onClick={onContinue}>Start focused practice →</button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/CheckpointResultScreen.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/exam/CheckpointResultScreen.tsx src/tests/CheckpointResultScreen.test.tsx
git commit -m "feat(checkpoints): CheckpointResultScreen (pass/focus/grace/demote)"
```

---

## Task 7: `useCheckpoint` flow hook

**Files:**
- Create: `src/hooks/useCheckpoint.ts`
- Test: `src/tests/useCheckpoint.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/useCheckpoint.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckpoint } from '../hooks/useCheckpoint.js';

vi.mock('../lib/speaking/whisperClaudeScorer.js', () => ({ whisperClaudeScorer: { assess: vi.fn() } }));

describe('useCheckpoint', () => {
  beforeEach(() => localStorage.clear());

  it('starts idle, advances to running on start(), and to result after complete()', () => {
    const { result } = renderHook(() => useCheckpoint({ certifiedLevel: 'B1', weakSkills: [], activeDayCount: 10 }));
    expect(result.current.phase).toBe('idle');
    act(() => result.current.start());
    expect(result.current.phase).toBe('running');
    expect(result.current.exam?.questions.length).toBeGreaterThan(0);
    act(() => result.current.complete({ vocab: 0.95, grammar: 0.9, speaking: 0.92 }));
    expect(result.current.phase).toBe('result');
    expect(result.current.outcome?.kind).toBe('pass');
  });

  it('snooze() sets phase to idle and persists snoozedUntil', () => {
    const { result } = renderHook(() => useCheckpoint({ certifiedLevel: 'B1', weakSkills: [], activeDayCount: 10 }));
    act(() => result.current.snooze(999999));
    expect(result.current.phase).toBe('idle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/useCheckpoint.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/hooks/useCheckpoint.ts
import { useState, useCallback } from 'react';
import type { CefrLevel } from '../lib/cefr.js';
import type { SkillScores, SkillKey } from '../lib/cefrCertification.js';
import { getCertificationState, writeCertificationState } from '../lib/cefrCertification.js';
import { recordCheckpointResult } from '../lib/checkpointStore.js';
import { buildCheckpointExam, type CheckpointExam } from '../lib/checkpointExam.js';
import type { CheckpointOutcome } from '../lib/checkpointPolicy.js';
import { whisperClaudeScorer } from '../lib/speaking/whisperClaudeScorer.js';

type Phase = 'idle' | 'running' | 'result';

export interface UseCheckpointArgs {
  certifiedLevel: CefrLevel;
  weakSkills: SkillKey[];
  activeDayCount: number;
}

/** Seeded-free RNG is fine at runtime (determinism only matters in tests). */
function rng() {
  return Math.random();
}

export function useCheckpoint({ certifiedLevel, weakSkills, activeDayCount }: UseCheckpointArgs) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [exam, setExam] = useState<CheckpointExam | null>(null);
  const [outcome, setOutcome] = useState<CheckpointOutcome | null>(null);

  const start = useCallback(() => {
    const built = buildCheckpointExam(certifiedLevel, getCertificationState(), weakSkills, rng);
    // Attach the production scorer to the speaking section.
    setExam(built);
    setPhase('running');
  }, [certifiedLevel, weakSkills]);

  const complete = useCallback(
    (scores: SkillScores) => {
      const o = recordCheckpointResult({ level: certifiedLevel, scores, activeDayCount });
      setOutcome(o);
      setPhase('result');
    },
    [certifiedLevel, activeDayCount],
  );

  const snooze = useCallback((until: number) => {
    const s = getCertificationState();
    s.checkpoints.snoozedUntil = until;
    writeCertificationState(s);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setExam(null);
    setOutcome(null);
  }, []);

  return { phase, exam, outcome, scorer: whisperClaudeScorer, start, complete, snooze, reset };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/useCheckpoint.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCheckpoint.ts src/tests/useCheckpoint.test.tsx
git commit -m "feat(checkpoints): useCheckpoint flow hook (build/run/record)"
```

---

## Task 8: Wire active-day tracking + checkpoint flow into the App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/shared/AppModals.tsx`

- [ ] **Step 1: Record an active day on app open (`src/App.tsx`)**

Add the import near the other lib imports:

```ts
import { recordActiveDayNow, getActiveDayCount } from './lib/activeDayTracker.js';
```

Add an effect that runs once the user is in the app (place beside the existing post-auth effects, after `_syncReady` is established):

```ts
  // Count today as an active day (drives the checkpoint cadence).
  useEffect(() => {
    if (authScreen === 'app') recordActiveDayNow();
  }, [authScreen]);
```

- [ ] **Step 2: Compute due + mount the flow in `AppModals`**

In `src/App.tsx`, where `<AppModals ... />` is rendered, add the props it needs (these already exist as state in App): pass `_syncReady`, `authScreen`, `currentScreen`, and the user's certified level + weak skills + active-day count. Add:

```tsx
  // near other derived values
  const certifiedLevel = getEffectiveLevelForUnlock(getUserCefr(stats.xp, stats.lc, stats.gc));
```

(Import `getEffectiveLevelForUnlock` from `./lib/cefrCertification.js` and `getUserCefr` from `./lib/cefr.js` if not already imported.)

Pass to `<AppModals>`:

```tsx
        checkpointCertifiedLevel={certifiedLevel}
        checkpointActiveDayCount={getActiveDayCount()}
```

- [ ] **Step 3: Render the checkpoint flow inside `AppModals` (`src/components/shared/AppModals.tsx`)**

Add imports:

```tsx
import { useCheckpoint } from '../../hooks/useCheckpoint.js';
import { isCheckpointDue, shouldShowCheckpoint } from '../../lib/checkpointSchedule.js';
import { CHECKPOINTS_ENABLED } from '../../lib/checkpointConfig.js';
import { getCertificationState } from '../../lib/cefrCertification.js';
import CheckpointInviteModal from '../exam/CheckpointInviteModal.js';
import ExamRunner from '../exam/ExamRunner.js';
import CheckpointResultScreen from '../exam/CheckpointResultScreen.js';
import type { CefrLevel } from '../../lib/cefr.js';
```

Add the props to the `AppModals` props type:

```tsx
  checkpointCertifiedLevel: CefrLevel;
  checkpointActiveDayCount: number;
```

Inside the component body, before the return:

```tsx
  const cp = useCheckpoint({
    certifiedLevel: checkpointCertifiedLevel,
    weakSkills: [], // weak-skill weighting of retention items = v2 enhancement
    activeDayCount: checkpointActiveDayCount,
  });

  const due = isCheckpointDue({
    enabled: CHECKPOINTS_ENABLED,
    certified: checkpointCertifiedLevel,
    activeDayCount: checkpointActiveDayCount,
    checkpoints: getCertificationState().checkpoints,
    now: Date.now(),
  }).due;

  const showCheckpointInvite =
    cp.phase === 'idle' &&
    shouldShowCheckpoint({ syncReady: !!_syncReady, authScreen, currentScreen, due });
```

Add to the JSX (alongside the other modals):

```tsx
      {showCheckpointInvite && (
        <CheckpointInviteModal
          level={checkpointCertifiedLevel}
          onStart={cp.start}
          onSnooze={() => cp.snooze(endOfLocalDayMs())}
        />
      )}
      {cp.phase === 'running' && cp.exam && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <ExamRunner
              questions={cp.exam.questions}
              speaking={{ level: cp.exam.speaking.level, tasks: cp.exam.speaking.tasks, scorer: cp.scorer }}
              onComplete={cp.complete}
            />
          </div>
        </div>
      )}
      {cp.phase === 'result' && cp.outcome && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <CheckpointResultScreen
              level={checkpointCertifiedLevel}
              outcome={cp.outcome}
              onContinue={() => { cp.reset(); setTab('learn'); }}
              onRetry={cp.start}
            />
          </div>
        </div>
      )}
```

Add the small helper at the bottom of the file (module scope):

```tsx
/** Epoch ms at the end of the user's local day — used for "remind me tonight". */
function endOfLocalDayMs(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (resolve any prop-type mismatches surfaced here).

- [ ] **Step 5: Run the full unit suite**

Run: `npm test`
Expected: PASS (existing + new). Since `CHECKPOINTS_ENABLED` is `false`, `due` is always `false`, so no checkpoint UI renders — existing App/AppModals tests are unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/shared/AppModals.tsx
git commit -m "feat(checkpoints): wire active-day tracking + checkpoint flow into App (flag off)"
```

---

## Task 9: Refactor `EquivalencyTestScreen` onto `ExamRunner`

**Files:**
- Modify: `src/components/profile/EquivalencyTestScreen.tsx`
- Test: existing `src/tests/cefr-test.test.tsx` + `src/tests/hooksExtra.test.ts` (must stay green)

- [ ] **Step 1: Replace the bespoke question phase with `ExamRunner`**

In `EquivalencyTestScreen.tsx`, map the test set's items to `RunnerQuestion[]` and delegate the `'question'` phase to `ExamRunner`, keeping the existing `intro` / `cooldown` / `result` phases and the `recordEquivalencyAttempt` call. Replace the per-question state (`questionIndex`, `selectedIndex`, `answered`, `acc`, `handleSelect`, `handleNext`) with:

```tsx
import ExamRunner from '../exam/ExamRunner.js';
import type { RunnerQuestion } from '../../lib/checkpointExam.js';

// ...inside the component, after `testSet` is resolved:
const runnerQuestions: RunnerQuestion[] = useMemo(
  () =>
    (testSet?.items ?? []).map((it, i) => ({
      id: `${testSet!.levelFrom}#${i}`,
      skill: it.skill,
      prompt: it.q,
      options: it.options,
      correctIndex: it.c,
      passage: it.passage,
      level: testSet!.levelFrom,
    })),
  [testSet],
);

function onExamComplete(scores: SkillScores) {
  const { passed } = computePassed(scores);
  recordEquivalencyAttempt({ level: testSet!.levelFrom, scores, currentLessonCount: userLessonCount });
  setResultPassed(passed);
  setResultScores(scores);
  setPhase('result');
}
```

And in the `phase === 'question'` branch of the JSX, render:

```tsx
<ExamRunner questions={runnerQuestions} onComplete={onExamComplete} />
```

(No `speaking` prop here — the equivalency/advancement test keeps its existing skill set; speaking is a checkpoint concern. This is a pure refactor: same items, same scoring, same recording.)

- [ ] **Step 2: Run the equivalency tests**

Run: `npx vitest run src/tests/cefr-test.test.tsx src/tests/hooksExtra.test.ts`
Expected: PASS — behaviour unchanged. (If a test asserted on internal markup that `ExamRunner` renders differently, update the test's locators to the `ExamRunner` `data-testid`s — `answer-N`, `exam-next` — per `feedback_verify_before_commit`.)

- [ ] **Step 3: Typecheck + full suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean + PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/EquivalencyTestScreen.tsx src/tests/cefr-test.test.tsx
git commit -m "refactor(cefr): equivalency test reuses shared ExamRunner"
```

---

## Task 10: End-to-end test (audio stubbed)

**Files:**
- Create: `e2e/checkpoints.spec.ts`

> Follow `skill_playwright_e2e_patterns`: `colorScheme:'light'`, `darkMode:false`, `data-testid` locators, audio stubbed. The E2E temporarily enables the feature via a test-only flag injection (see Step 1) so it can run before the prod flag flip.

- [ ] **Step 1: Write the E2E spec**

```ts
// e2e/checkpoints.spec.ts
import { test, expect } from '@playwright/test';

// Force the feature on + force a checkpoint "due" for a seeded B1 user, and
// stub the speaking endpoint so no mic/Whisper/Claude is needed.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Seed certified B1 with the cadence overdue.
    localStorage.setItem(
      'nh_cefr_certifications',
      JSON.stringify({
        passes: { A2: { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 }, B1: { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 } },
        attempts: [], lastFailedAt: {},
        checkpoints: { lastCheckpointAt: null, activeDaysAtLastCheckpoint: 0, consecutiveFails: {}, focusSkills: {}, demotions: [], snoozedUntil: null },
        v: 2,
      }),
    );
    localStorage.setItem('nh_active_days', JSON.stringify({ lastDay: '2000-01-01', count: 99 }));
    (window as unknown as { __NH_CHECKPOINTS_FORCE__: boolean }).__NH_CHECKPOINTS_FORCE__ = true;
  });
  // Stub the speaking assessment endpoint.
  await page.route('**/api/assess-speaking', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ transcript: 'Putovao sam u Zagreb.', scores: { range: 0.9, accuracy: 0.9, fluency: 0.9, task: 0.9 }, confidence: 0.9 }) }),
  );
});

test('checkpoint invite can be deferred', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('checkpoint-invite')).toBeVisible();
  await page.getByTestId('checkpoint-snooze').click();
  await expect(page.getByTestId('checkpoint-invite')).toBeHidden();
});

test('full pass keeps the level', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('checkpoint-start').click();
  // Answer every MCQ with option A, then run the stubbed speaking task.
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('answer-0').click();
    await page.getByTestId('exam-next').click();
  }
  await page.getByTestId('speak-record').click();
  // Result appears (pass or grace depending on the stubbed answers); assert one shows.
  await expect(page.locator('[data-testid^="result-"]')).toBeVisible();
});
```

> **Implementation note for Task 8 wiring:** OR-in the test flag where `due` is computed in `AppModals` so the E2E can force it without flipping the prod flag:
> ```tsx
> const forced = typeof window !== 'undefined' && (window as unknown as { __NH_CHECKPOINTS_FORCE__?: boolean }).__NH_CHECKPOINTS_FORCE__ === true;
> const enabled = CHECKPOINTS_ENABLED || forced;
> // use `enabled` for isCheckpointDue({ enabled, ... })
> ```
> Add this line in Task 8 Step 3 when computing `due`.

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e -- checkpoints`
Expected: PASS (2 specs). Space the run from other pushes (see `feedback_ci_rapid_push_cancellation`).

- [ ] **Step 3: Commit**

```bash
git add e2e/checkpoints.spec.ts src/components/shared/AppModals.tsx
git commit -m "test(checkpoints): e2e invite/defer + full pass (audio stubbed)"
```

---

## Task 11: Rollout — enable the feature

**Files:**
- Modify: `src/lib/checkpointConfig.ts`

- [ ] **Step 1: Pre-flight checklist (do NOT flip until all true)**

- [ ] Workers AI is enabled for the Pages project in the Cloudflare dashboard with binding name `AI` (Plan 2 Task 1).
- [ ] `ANTHROPIC_API_KEY` and `FIREBASE_PROJECT_ID` are set in Pages env.
- [ ] A manual smoke of `/api/assess-speaking` with a real Firebase token returns sane rubric scores for 2–3 known-level audio samples (calibrate the rubric prompt if scores skew high/low).
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run test:e2e -- checkpoints` all green.

- [ ] **Step 2: Flip the flag**

In `src/lib/checkpointConfig.ts`:

```ts
export const CHECKPOINTS_ENABLED = true;
```

- [ ] **Step 3: Full gate**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 4: Commit + deploy**

```bash
git add src/lib/checkpointConfig.ts
git commit -m "feat(checkpoints): enable Comprehension Checkpoints in production"
git push origin <branch>
```

Watch the deploy land (poll `version.json`), then verify on a real device that a due user sees the invite and the full flow works. Monitor Sentry/telemetry for `checkpoint_outcome` and the demote rate; if the demote rate is implausibly high, re-check the speaking rubric calibration before assuming a logic bug.

---

## Done criteria for Plan 3

- `npm test`, `tsc --noEmit`, `lint`, and `npm run test:e2e -- checkpoints` all green.
- With the flag **on**, a due B1 user (post-`syncReady`, on a safe screen) sees the invite; can defer ("remind me tonight") or take the exam; the speaking section records → scores; the result screen shows the correct pass/focus/grace/demote variant; a demote drops the certified level by one with XP/streak untouched.
- The equivalency test renders through the same `ExamRunner` with unchanged behaviour.
- Speaking technical failures (`null`) never produce a failing score or a demotion.

## Cross-plan completeness

Plans 1–3 together implement the full spec: 5-active-day cadence, mandatory productive speaking (Whisper→Claude behind a swappable interface; Azure pronunciation = v2), retention counting toward demotion, one-level demotion with a grace attempt, the A1 non-demoting floor, cross-device-safe state, and top-tier popup UX matching the approved mockups.
