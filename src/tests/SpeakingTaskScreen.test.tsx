// src/tests/SpeakingTaskScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { UseRecorderResult, RecorderState } from '../hooks/useRecorder.js';
import type { SpeakingScorer } from '../lib/speaking/SpeakingScorer.js';

// --- Controllable useRecorder mock -----------------------------------------
// The mock lets each test drive the recorder's state/blob and re-render the
// screen to simulate the lifecycle (idle → recording → done | denied).
const recorderState: { current: UseRecorderResult } = {
  current: undefined as unknown as UseRecorderResult,
};
const startRecording = vi.fn();
const stopRecording = vi.fn();
const reset = vi.fn();

function makeRecorder(overrides: Partial<UseRecorderResult> = {}): UseRecorderResult {
  return {
    state: 'idle',
    micAvailable: null,
    audioBlob: null,
    audioUrl: null,
    countdown: 0,
    error: null,
    startRecording,
    stopRecording,
    playback: vi.fn(async () => {}),
    reset,
    ...overrides,
  };
}

vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => recorderState.current,
}));

import SpeakingTaskScreen from '../components/exam/SpeakingTaskScreen.js';

const task = {
  id: 'b1-trip',
  prompt: 'Opišite putovanje.',
  promptEn: 'Describe a trip.',
  seconds: 45,
};
const fakeBlob = new Blob([new Uint8Array([1])], { type: 'audio/webm' });

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

function setRecorder(state: RecorderState, extra: Partial<UseRecorderResult> = {}) {
  recorderState.current = makeRecorder({ state, ...extra });
}

describe('SpeakingTaskScreen', () => {
  beforeEach(() => {
    startRecording.mockReset();
    stopRecording.mockReset();
    reset.mockReset();
    setRecorder('idle');
  });

  it('starts recording via useRecorder when the record button is tapped', () => {
    const scorer = scorerReturning(0.82);
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={vi.fn()} />);
    fireEvent.click(screen.getByTestId('speak-record'));
    expect(startRecording).toHaveBeenCalledTimes(1);
    // No prep countdown for this screen; cap duration at task length.
    expect(startRecording).toHaveBeenCalledWith(
      expect.objectContaining({ countdown: 0, maxDurationMs: task.seconds * 1000 }),
    );
  });

  it('on a completed recording assesses the blob and reports the overall score', async () => {
    const scorer = scorerReturning(0.82);
    const onScore = vi.fn();
    const { rerender } = render(
      <SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />,
    );
    // Recorder finishes with a blob.
    setRecorder('done', { audioBlob: fakeBlob });
    rerender(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />);
    await waitFor(() => expect(onScore).toHaveBeenCalledWith(0.82));
    expect(scorer.assess).toHaveBeenCalledTimes(1);
    expect(scorer.assess).toHaveBeenCalledWith(fakeBlob, { level: 'B1', prompt: task.prompt });
  });

  it('assesses only once per recording even across re-renders', async () => {
    const scorer = scorerReturning(0.7);
    const onScore = vi.fn();
    const { rerender } = render(
      <SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />,
    );
    setRecorder('done', { audioBlob: fakeBlob });
    rerender(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />);
    await waitFor(() => expect(onScore).toHaveBeenCalled());
    // An unrelated re-render with the SAME blob must NOT re-assess.
    rerender(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />);
    await waitFor(() => expect(scorer.assess).toHaveBeenCalledTimes(1));
  });

  it('on a null assessment shows retry and never reports a (failing) score', async () => {
    const scorer = scorerReturning(null);
    const onScore = vi.fn();
    const { rerender } = render(
      <SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />,
    );
    setRecorder('done', { audioBlob: fakeBlob });
    rerender(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={onScore} />);
    await waitFor(() => expect(screen.getByTestId('speak-retry')).toBeTruthy());
    expect(onScore).not.toHaveBeenCalled();
  });

  it('on mic-denied renders the explainer and does NOT call the scorer', () => {
    const scorer = scorerReturning(0.9);
    setRecorder('denied');
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={vi.fn()} />);
    expect(screen.getByTestId('mic-denied')).toBeTruthy();
    expect(scorer.assess).not.toHaveBeenCalled();
  });

  it('on unsupported renders the explainer and does NOT call the scorer', () => {
    const scorer = scorerReturning(0.9);
    setRecorder('unsupported');
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={vi.fn()} />);
    expect(screen.getByTestId('mic-denied')).toBeTruthy();
    expect(scorer.assess).not.toHaveBeenCalled();
  });

  it('the denied explainer Retry button resets the recorder and re-records', () => {
    const scorer = scorerReturning(0.9);
    setRecorder('denied');
    render(<SpeakingTaskScreen task={task} level="B1" scorer={scorer} onScore={vi.fn()} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(startRecording).toHaveBeenCalledTimes(1);
  });
});
