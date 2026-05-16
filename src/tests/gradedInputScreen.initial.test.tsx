// src/tests/gradedInputScreen.initial.test.tsx
// SP7 Task 4: Verify initialStoryId prop routes directly to the reader view
// for matching IDs, and falls through to the catalog list for unknown IDs.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock contentClient with two known stories so we can verify initialStoryId routing
const STORY_A_HOISTED = vi.hoisted(() => ({
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
}));
const STORY_B_HOISTED = vi.hoisted(() => ({
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
}));

vi.mock('../lib/contentClient', () => {
  const FIXTURES: Record<string, unknown> = {
    gs_test_a: STORY_A_HOISTED,
    gs_test_b: STORY_B_HOISTED,
  };
  return {
    getStoryCatalog: vi.fn(async () => [
      {
        id: STORY_A_HOISTED.id,
        level: STORY_A_HOISTED.level,
        title: STORY_A_HOISTED.title,
        titleEn: STORY_A_HOISTED.titleEn,
        focus: STORY_A_HOISTED.focus,
        icon: STORY_A_HOISTED.icon,
        duration: STORY_A_HOISTED.duration,
        levelColor: STORY_A_HOISTED.levelColor,
        levelBg: STORY_A_HOISTED.levelBg,
        etag: 'e1',
      },
      {
        id: STORY_B_HOISTED.id,
        level: STORY_B_HOISTED.level,
        title: STORY_B_HOISTED.title,
        titleEn: STORY_B_HOISTED.titleEn,
        focus: STORY_B_HOISTED.focus,
        icon: STORY_B_HOISTED.icon,
        duration: STORY_B_HOISTED.duration,
        levelColor: STORY_B_HOISTED.levelColor,
        levelBg: STORY_B_HOISTED.levelBg,
        etag: 'e2',
      },
    ]),
    getStory: vi.fn(async (id: string) => {
      const fixture = FIXTURES[id];
      if (!fixture) throw new Error('not_found');
      return fixture;
    }),
  };
});

import GradedInputScreen from '../components/learn/GradedInputScreen';

describe('GradedInputScreen — initialStoryId prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('with initialStoryId, auto-opens the matching story (skips the list view)', async () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="gs_test_b" />);
    await waitFor(() => {
      expect(screen.getByText(/Story B intro/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Story A intro/i)).not.toBeInTheDocument();
  });

  it('with initialStoryId pointing to a missing ID, falls through to the catalog list', async () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="does-not-exist" />);
    // Each story title renders twice (hr title + English subtitle) — use getAllByText.
    await waitFor(() => {
      expect(screen.getAllByText(/Test Story A/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Test Story B/i).length).toBeGreaterThan(0);
    // And the reader's intro text must NOT be visible (we're on the list view).
    expect(screen.queryByText(/Story A intro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Story B intro/i)).not.toBeInTheDocument();
  });
});
