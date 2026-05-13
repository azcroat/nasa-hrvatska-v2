/**
 * graded-input-screen.test.tsx — Contract tests for GradedInputScreen.
 *
 * Critical behaviors tested:
 *   - Story list renders
 *   - Clicking a story enters reader view
 *   - "Comprehension Quiz ->" button transitions to quiz view
 *   - Answering all questions fires onComplete
 *   - award(xp, false, 'reading') called on completion (single fire)
 *   - markQuest('reading') called on completion
 *   - writeDelta({ lc: 1, vs: ['story-comprehension'] }) called on completion
 *   - setStats called to add 'story-comprehension' to vs (when not already present)
 *   - completeFired guard: completion cannot fire twice
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

// ── Firebase mock ─────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  increment: vi.fn(),
}));

// ── vi.hoisted — refs used inside vi.mock factories must be hoisted ───────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
const mockSetStats = vi.hoisted(() => vi.fn());
const MOCK_STORY_HOISTED = vi.hoisted(() => ({
  id: 'gs_test_1',
  level: 'A1',
  levelColor: '#166534',
  levelBg: '#dcfce7',
  icon: '📖',
  title: 'Testna Prica',
  titleEn: 'Test Story',
  duration: 3,
  focus: 'Present tense',
  intro: 'A test story.',
  vocabulary: [{ hr: 'test', en: 'test', ex: 'test' }],
  paragraphs: [{ hr: 'Ana ide na tržnicu.', en: 'Ana goes to the market.' }],
  quiz: [
    {
      q: 'Pitanje 1?',
      qEn: 'Question 1?',
      opts: ['Odgovor A', 'Odgovor B', 'Odgovor C', 'Odgovor D'],
      correct: 0,
    },
    {
      q: 'Pitanje 2?',
      qEn: 'Question 2?',
      opts: ['Odgovor A', 'Odgovor B', 'Odgovor C', 'Odgovor D'],
      correct: 0,
    },
    {
      q: 'Pitanje 3?',
      qEn: 'Question 3?',
      opts: ['Odgovor A', 'Odgovor B', 'Odgovor C', 'Odgovor D'],
      correct: 0,
    },
  ],
}));

// ── quests mock ───────────────────────────────────────────────────────────────
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── apiFetch mock — TTS returns failure so audio is skipped ──────────────────
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: false })),
}));

// ── audio mock ────────────────────────────────────────────────────────────────
vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));
vi.mock('../lib/soundSettings.js', () => ({
  getVoicePreference: vi.fn(() => 'hr-HR-GabrijelaNeural'),
}));

// ── StatsContext mock — provides useStats() without a Provider ────────────────
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[], lc: 0, gc: 0, xp: 0 },
    setStats: mockSetStats,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: mockWriteDelta,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── data mock — speak() must be stubbed ──────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, speak: vi.fn() };
});

// ── gradedStories mock — single story with 3-question quiz ───────────────────
vi.mock('../data/gradedStories.js', () => ({
  GRADED_STORIES: [MOCK_STORY_HOISTED],
}));

import GradedInputScreen from '../components/learn/GradedInputScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(
    <GradedInputScreen {...(props as Parameters<typeof GradedInputScreen>[0])} />,
  );
  return { ...utils, props };
}

/** Enter story, click to start quiz, answer all 3 Qs correctly, then click Continue. */
async function completeFullFlow(award = vi.fn()) {
  await act(async () => {
    render(<GradedInputScreen goBack={vi.fn()} award={award} />);
  });

  // Enter the story
  await act(async () => {
    fireEvent.click(screen.getByText('Testna Prica'));
  });

  // Start quiz
  await act(async () => {
    fireEvent.click(screen.getByText('Comprehension Quiz →'));
  });

  // Answer all 3 questions by clicking the correct option each time
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      // 'Odgovor A' is correct (index 0) for all Qs in mock data
      const opts = screen.getAllByText('Odgovor A');
      fireEvent.click(opts[0]!);
    });
    // Click Next / See Results
    await act(async () => {
      const nextBtn = screen.queryByText('Next Question →') ?? screen.queryByText('See Results →');
      if (nextBtn) fireEvent.click(nextBtn);
    });
  }

  // Click Continue on results screen
  await waitFor(() => screen.getByText('Continue →'));
  await act(async () => {
    fireEvent.click(screen.getByText('Continue →'));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GradedInputScreen — rendering', () => {
  it('renders story list without crashing', async () => {
    await act(async () => {
      renderScreen();
    });
    expect(screen.getByText('Graded Stories')).toBeTruthy();
  });

  it('shows mock story in the list', async () => {
    await act(async () => {
      renderScreen();
    });
    expect(screen.getByText('Testna Prica')).toBeTruthy();
  });
});

describe('GradedInputScreen — navigation', () => {
  it('clicking a story enters reader view with paragraph text', async () => {
    await act(async () => {
      renderScreen();
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Testna Prica'));
    });
    expect(screen.getByText('Ana ide na tržnicu.')).toBeTruthy();
  });

  it('clicking Comprehension Quiz button enters quiz view', async () => {
    await act(async () => {
      renderScreen();
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Testna Prica'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Comprehension Quiz →'));
    });
    expect(screen.getByText('Pitanje 1?')).toBeTruthy();
  });
});

describe('GradedInputScreen — completion contract', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('award(xp, false, "reading") is called on quiz completion', async () => {
    const award = vi.fn();
    await completeFullFlow(award);
    expect(award).toHaveBeenCalledTimes(1);
    const [, celebrate, actType] = award.mock.calls[0] as [number, boolean, string];
    expect(celebrate).toBe(false);
    expect(actType).toBe('reading');
  });

  it('markQuest("reading") is called on completion', async () => {
    await completeFullFlow();
    expect(mockMarkQuest).toHaveBeenCalledWith('reading');
  });

  it('markQuest is called exactly once', async () => {
    await completeFullFlow();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('writeDelta is called with lc:1 and vs:["story-comprehension"]', async () => {
    await completeFullFlow();
    expect(mockWriteDelta).toHaveBeenCalledTimes(1);
    expect(mockWriteDelta).toHaveBeenCalledWith({ lc: 1, vs: ['story-comprehension'] });
  });

  it('setStats is called to add story-comprehension to vs when not present', async () => {
    await completeFullFlow();
    expect(mockSetStats).toHaveBeenCalledTimes(1);
    // The updater function adds story-comprehension to vs
    const updater = mockSetStats.mock.calls[0]![0] as (prev: { vs: string[] }) => { vs: string[] };
    const result = updater({ vs: [] });
    expect(result.vs).toContain('story-comprehension');
  });
});
