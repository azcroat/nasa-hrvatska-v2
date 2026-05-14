/**
 * speakingSprintMic.test.tsx — verifies SpeakingSprintScreen renders the
 * shared MicPermissionDeniedExplainer when SpeechRecognition denies the mic.
 *
 * SpeakingSprintScreen does NOT consume useRecorder — it uses
 * SpeechRecognition (Web Speech API). The mic-permission UX layer is what
 * standardises across surfaces. This test focuses there.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SprintSpeakingPhase from '../components/practice/SprintSpeakingPhase';

vi.mock('../lib/platform', () => ({
  isSpeechRecognitionSupported: () => true,
  getMicPermissionPlatform: () => 'desktop',
}));
vi.mock('../lib/platform.js', () => ({
  isSpeechRecognitionSupported: () => true,
  getMicPermissionPlatform: () => 'desktop',
}));

const baseProps = {
  rounds: 5,
  level: 'A2',
  currentPrompt: { hr: 'Bok', en: 'Hi', model_response: 'Bok!' },
  micDenied: false,
  isRecording: false,
  liveTranscript: '',
  textInput: '',
  onTextInputChange: vi.fn(),
  onStartListening: vi.fn(),
  onDoneSpeaking: vi.fn(),
  onSkip: vi.fn(),
};

describe('SprintSpeakingPhase mic permission UX', () => {
  it('renders MicPermissionDeniedExplainer when micDenied is true', () => {
    render(<SprintSpeakingPhase {...baseProps} micDenied={true} />);
    expect(screen.getByText(/Microphone access is blocked/i)).toBeInTheDocument();
  });

  it('does NOT render the explainer when micDenied is false', () => {
    render(<SprintSpeakingPhase {...baseProps} micDenied={false} />);
    expect(screen.queryByText(/Microphone access is blocked/i)).toBeNull();
  });

  it('Try Again button invokes onStartListening when present', () => {
    const onStartListening = vi.fn();
    render(
      <SprintSpeakingPhase {...baseProps} micDenied={true} onStartListening={onStartListening} />,
    );
    const tryAgain = screen.getByText(/Try Again/i);
    tryAgain.click();
    expect(onStartListening).toHaveBeenCalled();
  });
});
