// src/tests/gradedInputScreen.initial.test.tsx
// SP7 Task 4: Verify initialStoryId prop routes directly to the reader view
// for matching IDs, and falls through to the catalog list for unknown IDs.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Firebase mocks — defensive in case any indirect import pulls them in.
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}));

// StatsContext mock — provides useStats() without a Provider
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { xp: 1500, vs: [] as string[], lc: 0, gc: 0 },
    setStats: vi.fn(),
    writeDelta: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// quests + data + audio + soundSettings + apiFetch mocks
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../data', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, speak: vi.fn(), H: () => '', markDone: vi.fn() };
});
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: false })),
}));
vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));
vi.mock('../lib/soundSettings.js', () => ({
  getVoicePreference: vi.fn(() => 'hr-HR-GabrijelaNeural'),
}));
vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => ({
    state: 'idle',
    audioBlob: null,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    permissionDenied: false,
  }),
}));
vi.mock('../lib/recentReads', () => ({
  recordStoryRead: vi.fn(),
  getRecentReads: vi.fn(() => []),
  getRecentReadsExtended: vi.fn(() => []),
}));

// Mock GRADED_STORIES with two known stories so we can verify initialStoryId routing
vi.mock('../data/gradedStories.js', () => ({
  GRADED_STORIES: [
    {
      id: 'gs_test_a',
      level: 'A1',
      title: 'Test Story A',
      titleEn: 'Test Story A',
      focus: 'Present tense',
      icon: '🅰️',
      duration: 3,
      levelBg: '#dcfce7',
      levelColor: '#166534',
      intro: 'Story A intro.',
      paragraphs: [{ hr: 'Hello A', en: 'Hello A' }],
      vocabulary: [],
      quiz: [{ q: 'A?', qEn: 'A?', opts: ['x', 'y'], correct: 0 }],
    },
    {
      id: 'gs_test_b',
      level: 'A1',
      title: 'Test Story B',
      titleEn: 'Test Story B',
      focus: 'Numbers',
      icon: '🅱️',
      duration: 4,
      levelBg: '#dcfce7',
      levelColor: '#166534',
      intro: 'Story B intro.',
      paragraphs: [{ hr: 'Hello B', en: 'Hello B' }],
      vocabulary: [],
      quiz: [],
    },
  ],
}));

import GradedInputScreen from '../components/learn/GradedInputScreen';

describe('GradedInputScreen — initialStoryId prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('with initialStoryId, auto-opens the matching story (skips the list view)', () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="gs_test_b" />);
    expect(screen.getByText(/Story B intro/i)).toBeInTheDocument();
    expect(screen.queryByText(/Story A intro/i)).not.toBeInTheDocument();
  });

  it('with initialStoryId pointing to a missing ID, falls through to the catalog list', () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="does-not-exist" />);
    // Each story title renders twice (hr title + English subtitle) — use getAllByText.
    expect(screen.getAllByText(/Test Story A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Test Story B/i).length).toBeGreaterThan(0);
    // And the reader's intro text must NOT be visible (we're on the list view).
    expect(screen.queryByText(/Story A intro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Story B intro/i)).not.toBeInTheDocument();
  });
});
