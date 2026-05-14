/**
 * LevelQuiz.test.tsx — Smoke tests for the LevelQuiz component.
 *
 * Uses the mock pattern from GenitiveDrill.test.tsx (canonical).
 * With rnd()=0.99, shuffle is identity — opts[0] === answer.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
}));

// ── StatsContext mock ─────────────────────────────────────────────────────────
const mockSetStats = vi.fn();
const mockWriteDelta = vi.fn();

vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: {
      xp: 0,
      lc: 0,
      gc: 0,
      sp: 0,
      de: 0,
      rc: 0,
      pf: 0,
      mv: 0,
      hi: 0,
      str: 0,
      authLoading: 0,
      diff: 'beginner',
      ct: [] as string[],
      vs: [] as string[],
      rs: [] as string[],
      badges: [] as string[],
      levelQuizPasses: {},
    },
    setStats: mockSetStats,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: mockWriteDelta,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── rnd mock — 0.99 makes shLocal() identity ─────────────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));

// ── data mock ─────────────────────────────────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import LevelQuiz from '../components/learn/LevelQuiz';

const SAMPLE_QS = [
  { q: 'Q1', opts: ['a', 'b', 'c', 'd'], answer: 'a' },
  { q: 'Q2', opts: ['x', 'y', 'z', 'w'], answer: 'x' },
];

describe('LevelQuiz', () => {
  it('renders the first question with progress 1 / N', () => {
    render(<LevelQuiz levelNumber={1} questions={SAMPLE_QS} goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/1 \/ 2/)).toBeTruthy();
  });

  it('shows empty-state when given 0 questions', () => {
    render(<LevelQuiz levelNumber={1} questions={[]} goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/Not enough items/)).toBeTruthy();
  });

  it('records levelQuizPasses on completion', () => {
    mockSetStats.mockClear();
    mockWriteDelta.mockClear();
    const award = vi.fn();
    render(<LevelQuiz levelNumber={3} questions={SAMPLE_QS} goBack={vi.fn()} award={award} />);
    // With rnd()=0.99, shuffle is identity — opts[0] === answer
    // Q1: click correct answer (first .ob button)
    const opt1 = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(opt1!);
    fireEvent.click(screen.getByText(/Next/));
    // Q2: click correct answer
    const opt2 = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(opt2!);
    fireEvent.click(screen.getByText(/See results/));
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(10, false, 'grammar'); // 2 correct * 5 XP
    expect(mockWriteDelta).toHaveBeenCalledWith(
      expect.objectContaining({
        levelQuizPasses: expect.objectContaining({ 3: expect.any(Object) }),
      }),
    );
  });
});
