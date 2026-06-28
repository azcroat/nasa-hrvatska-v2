// src/tests/RoleplayScreen.test.tsx
//
// Guards the role-play fix: the scripted scenarios must be PLAYED, not just read.
// Regression being prevented: every line — including the learner's own — used to
// be pre-printed and merely displayed ("did nothing but vocabulary"). Now, on the
// learner's turn the model Croatian is hidden behind a reveal and there is a mic
// "Speak" control, so the learner actually produces their line.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UseRecorderResult } from '../hooks/useRecorder';

const startRecording = vi.fn();
const stopRecording = vi.fn();
const reset = vi.fn();
const recorderState: { current: UseRecorderResult } = {
  current: {
    state: 'idle',
    micAvailable: null,
    audioBlob: null,
    audioUrl: null,
    mimeType: null,
    countdown: 0,
    error: null,
    startRecording,
    stopRecording,
    playback: vi.fn(async () => {}),
    reset,
  },
};

vi.mock('../hooks/useRecorder', () => ({ useRecorder: () => recorderState.current }));

const speak = vi.fn();
vi.mock('../data', () => ({
  speak: (...a: unknown[]) => speak(...a),
  H: (title: string) => <div>{title}</div>,
  ROLEPLAY: [
    {
      title: 'Test Scene',
      en: 'A test scene',
      lines: [
        { speaker: 'Partner', text: 'Bok!', en: 'Hi!' },
        { speaker: 'Ti', text: 'Bok, kako si?', en: 'Hi, how are you?', you: true },
      ],
    },
  ],
}));

vi.mock('../components/shared/CefrSoftHint', () => ({ CefrSoftHint: () => null }));

import RoleplayScreen from '../components/croatia/RoleplayScreen';

describe('RoleplayScreen — interactive scripted role-play', () => {
  beforeEach(() => {
    startRecording.mockReset();
    stopRecording.mockReset();
    reset.mockReset();
  });

  it("shows the partner's opening line and advances to the learner's turn", () => {
    render(<RoleplayScreen goBack={vi.fn()} />);
    // Partner line is shown (it is read/heard, not produced).
    expect(screen.getByText(/Bok!/)).toBeTruthy();
    fireEvent.click(screen.getByText('Next Line →'));
    expect(screen.getByTestId('roleplay-your-turn')).toBeTruthy();
  });

  it("hides the model answer on the learner's turn and reveals it on demand", () => {
    render(<RoleplayScreen goBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Next Line →'));
    // English cue is shown so the learner knows what to say...
    expect(screen.getByText(/how are you/i)).toBeTruthy();
    // ...but the Croatian model line is NOT pre-printed (the whole point of the fix).
    expect(screen.queryByTestId('roleplay-answer')).toBeNull();
    fireEvent.click(screen.getByTestId('roleplay-reveal'));
    const answer = screen.getByTestId('roleplay-answer');
    expect(answer.textContent).toContain('Bok, kako si?');
  });

  it("offers a mic Speak control on the learner's turn and records when tapped", () => {
    render(<RoleplayScreen goBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Next Line →'));
    fireEvent.click(screen.getByTestId('roleplay-speak'));
    expect(startRecording).toHaveBeenCalledTimes(1);
    expect(startRecording).toHaveBeenCalledWith(
      expect.objectContaining({ countdown: 0, maxDurationMs: 15_000 }),
    );
  });
});
