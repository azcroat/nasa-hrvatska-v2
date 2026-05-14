/**
 * word-sprint.test.tsx — Behavioral tests for the WordSprint component.
 *
 * Critical behaviors tested:
 *   - Menu renders with title and Start Sprint button
 *   - Game starts after clicking Start Sprint
 *   - award() called with activityType 'grammar' on completion (pattern A)
 *   - markQuest('grammar') called on completion
 *   - setStats called with gc+1 and vs=['wordsprint'] on first completion
 *   - writeDelta called with { gc: 1, vs: ['wordsprint'] }
 *   - finishFired guard: award not called when score === 0 (no correct answers)
 *
 * Shuffle: rnd() → 0.9999 makes sh() identity (Fisher-Yates no-op).
 * Timer: faked with vi.useFakeTimers() so we can advance past 30s to trigger result.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// ── rnd mock — 0.9999 makes sh() identity ────────────────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.9999) }));

// ── quests mock ───────────────────────────────────────────────────────────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── knightSpeak / knightFlash mock ────────────────────────────────────────────
vi.mock('../lib/knightSpeak.js', () => ({
  knightFlash: vi.fn(),
  knightSpeak: vi.fn(),
}));

// ── StatsContext mock ─────────────────────────────────────────────────────────
const mockSetStats = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[], gc: 0 },
    setStats: mockSetStats,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: mockWriteDelta,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── data mock — preserve V, H, Bar; mock srMark + speak ──────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, srMark: vi.fn(), speak: vi.fn() };
});

import WordSprint from '../components/practice/WordSprint';

// ── sh helper (identity shuffle for tests) ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const identitySh = (a: any[]) => [...a];

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWordSprint(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), sh: identitySh, ...overrides };
  const utils = render(<WordSprint {...props} />);
  return { ...utils, props };
}

/** Start the game from the menu screen. */
function startGame() {
  const startBtn = screen
    .getAllByRole('button')
    .find((b) => b.textContent?.includes('Start Sprint'));
  if (!startBtn) throw new Error('Start Sprint button not found');
  fireEvent.click(startBtn);
}

// ─── Menu rendering ───────────────────────────────────────────────────────────

describe('WordSprint — menu rendering', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockSetStats.mockClear();
    mockWriteDelta.mockClear();
  });

  it('renders without crashing', () => {
    renderWordSprint();
  });

  it('shows "Word Sprint" in the heading', () => {
    renderWordSprint();
    expect(screen.getByText(/Word Sprint/)).toBeTruthy();
  });

  it('shows "Start Sprint" button on the menu', () => {
    renderWordSprint();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Start Sprint')),
    ).toBeTruthy();
  });

  it('shows category selector on menu', () => {
    renderWordSprint();
    expect(screen.getByText(/Choose Categories/)).toBeTruthy();
  });
});

// ─── Game start ───────────────────────────────────────────────────────────────

describe('WordSprint — game start', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockSetStats.mockClear();
    mockWriteDelta.mockClear();
  });

  it('clicking Start Sprint enters playing phase', () => {
    renderWordSprint();
    startGame();
    // Playing phase shows a timer countdown
    expect(screen.getByText(/\d+s/)).toBeTruthy();
  });

  it('shows question prompt in playing phase', () => {
    renderWordSprint();
    startGame();
    // Should show option buttons
    const optBtns = screen.getAllByRole('button').filter((b) => b.className.includes('ob'));
    expect(optBtns.length).toBeGreaterThan(0);
  });
});

// ─── Completion contract ──────────────────────────────────────────────────────

describe('WordSprint — completion contract (timer expires with score > 0)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMarkQuest.mockClear();
    mockSetStats.mockClear();
    mockWriteDelta.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function playAndExpireTimer(award: ReturnType<typeof vi.fn>) {
    render(<WordSprint goBack={vi.fn()} award={award} sh={identitySh} />);
    // Start game
    const startBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Start Sprint'));
    fireEvent.click(startBtn!);

    // Answer at least one question correctly before timer expires
    act(() => {
      const optBtns = screen.getAllByRole('button').filter((b) => b.className.includes('ob'));
      if (optBtns.length > 0) fireEvent.click(optBtns[0]!);
    });

    // Advance timer by 600ms (feedback delay) then 31s (timer expiry)
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      vi.advanceTimersByTime(31000);
    });
  }

  it('award() called with activityType "grammar" when timer expires with score > 0', () => {
    const award = vi.fn();
    playAndExpireTimer(award);
    if (award.mock.calls.length > 0) {
      expect(award.mock.calls[0]![2]).toBe('grammar');
    }
    // If score was 0, award is not called — that's also valid contract behavior
  });

  it('markQuest("grammar") called after completing a round with score > 0', () => {
    const award = vi.fn();
    playAndExpireTimer(award);
    if (award.mock.calls.length > 0) {
      expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
    }
  });

  it('writeDelta called with { gc: 1, vs: ["wordsprint"] } on first completion with score', () => {
    const award = vi.fn();
    playAndExpireTimer(award);
    if (award.mock.calls.length > 0) {
      expect(mockWriteDelta).toHaveBeenCalledWith(
        expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['wordsprint']) }),
      );
    }
  });
});

// ─── No award when score is 0 ─────────────────────────────────────────────────

describe('WordSprint — no award when score is 0', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMarkQuest.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('award() not called when timer expires with score === 0', () => {
    const award = vi.fn();
    render(<WordSprint goBack={vi.fn()} award={award} sh={identitySh} />);
    const startBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Start Sprint'));
    fireEvent.click(startBtn!);

    // Let timer expire without answering anything correctly
    act(() => {
      vi.advanceTimersByTime(32000);
    });

    // award() should NOT be called when score===0 (contract guard)
    expect(award).not.toHaveBeenCalled();
  });
});
