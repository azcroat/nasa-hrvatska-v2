// src/tests/SpeakingTaskScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpeakingTaskScreen from '../components/exam/SpeakingTaskScreen.js';
import type { SpeakingScorer } from '../lib/speaking/SpeakingScorer.js';

const task = {
  id: 'b1-trip',
  prompt: 'Opišite putovanje.',
  promptEn: 'Describe a trip.',
  seconds: 45,
};
const capture = async () => new Blob([new Uint8Array([1])], { type: 'audio/webm' });

function scorerReturning(value: number | null): SpeakingScorer {
  return {
    assess: vi.fn(async () =>
      value === null
        ? null
        : {
            transcript: 't',
            scores: { range: value, accuracy: value, fluency: value, task: value },
            overall: value,
            confidence: 0.9,
          },
    ),
  };
}

describe('SpeakingTaskScreen', () => {
  it('records, assesses, and reports the overall score', async () => {
    const onScore = vi.fn();
    render(
      <SpeakingTaskScreen
        task={task}
        level="B1"
        scorer={scorerReturning(0.82)}
        onScore={onScore}
        captureAudio={capture}
      />,
    );
    fireEvent.click(screen.getByTestId('speak-record'));
    await waitFor(() => expect(onScore).toHaveBeenCalledWith(0.82));
  });

  it('on a null assessment shows retry and never reports a (failing) score', async () => {
    const onScore = vi.fn();
    render(
      <SpeakingTaskScreen
        task={task}
        level="B1"
        scorer={scorerReturning(null)}
        onScore={onScore}
        captureAudio={capture}
      />,
    );
    fireEvent.click(screen.getByTestId('speak-record'));
    await waitFor(() => expect(screen.getByTestId('speak-retry')).toBeTruthy());
    expect(onScore).not.toHaveBeenCalled();
  });
});
