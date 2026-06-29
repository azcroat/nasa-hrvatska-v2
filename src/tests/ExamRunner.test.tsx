// src/tests/ExamRunner.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Stub the speaking screen so this test isolates ExamRunner's MCQ + scoring logic.
vi.mock('../components/exam/SpeakingTaskScreen.js', () => ({
  default: ({ onScore }: { onScore: (n: number) => void }) => (
    <button data-testid="stub-speak" onClick={() => onScore(0.9)}>
      speak
    </button>
  ),
}));

import ExamRunner from '../components/exam/ExamRunner.js';
import type { RunnerQuestion } from '../lib/checkpointExam.js';

const questions: RunnerQuestion[] = [
  {
    id: 'q1',
    skill: 'vocab',
    prompt: 'V?',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    level: 'B1',
  },
  {
    id: 'q2',
    skill: 'grammar',
    prompt: 'G?',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 1,
    level: 'B1',
  },
];

describe('ExamRunner', () => {
  it('buckets MCQ by skill and folds in the speaking score, then completes', async () => {
    const onComplete = vi.fn();
    render(
      <ExamRunner
        questions={questions}
        speaking={{
          level: 'B1',
          tasks: [{ id: 's1', prompt: 'p', promptEn: 'p', seconds: 45 }],
          scorer: { assess: vi.fn() },
        }}
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

  it('lets a mic-unable learner skip the speaking task — completes with NO speaking score', async () => {
    // Regression guard: the speaking phase must never trap a learner without a
    // mic. Skipping records no speaking score (scores.speaking stays absent),
    // which in shadow mode never affects the result.
    const onComplete = vi.fn();
    render(
      <ExamRunner
        questions={questions}
        speaking={{
          level: 'B1',
          tasks: [{ id: 's1', prompt: 'p', promptEn: 'p', seconds: 45 }],
          scorer: { assess: vi.fn() },
        }}
        onComplete={onComplete}
      />,
    );
    fireEvent.click(screen.getByTestId('answer-0'));
    fireEvent.click(screen.getByTestId('exam-next'));
    fireEvent.click(screen.getByTestId('answer-1'));
    fireEvent.click(screen.getByTestId('exam-next'));
    // Skip instead of speaking.
    fireEvent.click(screen.getByTestId('speak-skip'));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0]![0]).toEqual({ vocab: 1, grammar: 1 });
    expect(onComplete.mock.calls[0]![0].speaking).toBeUndefined();
  });
});
