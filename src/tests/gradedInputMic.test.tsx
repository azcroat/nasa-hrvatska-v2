/**
 * gradedInputMic.test.tsx — verifies the StoryReader subcomponent inside
 * GradedInputScreen renders correct mic-state UI. The mic flow lives in
 * StoryReader (not the outer list/quiz router).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../data', () => ({ speak: vi.fn() }));
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: vi.fn() }));
vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));
vi.mock('../lib/soundSettings.js', () => ({ getVoicePreference: () => 'female' }));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/platform', () => ({
  getMicPermissionPlatform: () => 'desktop',
}));
vi.mock('../data/gradedStories.js', () => ({
  GRADED_STORIES: [],
}));

const recorderMock = vi.fn();
vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => recorderMock(),
}));

function recorderState(overrides: Record<string, unknown> = {}) {
  return {
    state: 'idle' as const,
    micAvailable: null,
    audioBlob: null,
    audioUrl: null,
    countdown: 0,
    error: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    playback: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

const sampleStory = {
  id: 'demo',
  title: 'Demo Story',
  titleEn: 'Demo',
  level: 'A1' as const,
  focus: 'Test focus',
  icon: '📖',
  paragraphs: [{ hr: 'Bok!', en: 'Hi!' }],
  vocab: [],
  quiz: [],
};

describe('StoryReader mic states', () => {
  beforeEach(() => {
    recorderMock.mockReset();
  });

  it('does NOT render the explainer when recorder state is idle', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'idle' }));
    const { StoryReader } = await import('../components/learn/GradedInputScreen');
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <StoryReader story={sampleStory as any} onStartQuiz={vi.fn()} goBack={vi.fn()} />,
    );
    expect(screen.queryByText(/Microphone access is blocked/i)).toBeNull();
  });

  it('renders MicPermissionDeniedExplainer when recorder state is denied', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'denied' }));
    const { StoryReader } = await import('../components/learn/GradedInputScreen');
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <StoryReader story={sampleStory as any} onStartQuiz={vi.fn()} goBack={vi.fn()} />,
    );
    expect(screen.getByText(/Microphone access is blocked/i)).toBeInTheDocument();
  });
});
