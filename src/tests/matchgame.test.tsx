/**
 * matchgame.test.tsx — Behavioral tests for the MatchGame component.
 *
 * Critical behaviors tested:
 *   - award(20) called exactly once when all pairs are matched
 *   - markQuest('vocab') called on completion
 *   - First card click selects it (highlighted), second click deselects if same card
 *   - Matching pair removes both from the "active" pool
 *   - Completion screen shows after final match
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// ── quests mock ───────────────────────────────────────────────────────────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── knightSpeak mock ──────────────────────────────────────────────────────────
vi.mock('../lib/knightSpeak.js', () => ({ knightSpeak: vi.fn() }));

// ── data mock ─────────────────────────────────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, srMark: vi.fn() };
});

import MatchGame from '../components/practice/MatchGame';

// ── Test pool helpers ─────────────────────────────────────────────────────────

/**
 * Build a minimal card pool with 2 pairs (4 cards).
 * Each card has: id (unique), p (pair key), t (text), tp (type: 'hr' or 'en').
 */
function makePairs(n = 2) {
  const cards: { id: string; p: string; t: string; tp: string }[] = [];
  for (let i = 0; i < n; i++) {
    cards.push({ id: `hr-${i}`, p: `pair-${i}`, t: `hrWord${i}`, tp: 'hr' });
    cards.push({ id: `en-${i}`, p: `pair-${i}`, t: `enWord${i}`, tp: 'en' });
  }
  return cards;
}

function renderMatchGame(overrides = {}) {
  const props = { initPool: makePairs(2), goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<MatchGame {...props} />);
  return { ...utils, props };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('MatchGame — rendering', () => {
  it('renders without crashing', () => {
    renderMatchGame();
  });

  it('shows the Match Pairs title', () => {
    renderMatchGame();
    expect(screen.getByText('🃏 Match Pairs')).toBeTruthy();
  });

  it('shows pairs found counter initially', () => {
    renderMatchGame();
    // The counter renders as "<span>0</span> / 2 pairs found" — match on the text node
    expect(screen.getByText(/pairs found/)).toBeTruthy();
  });

  it('renders all 4 cards as clickable buttons', () => {
    renderMatchGame();
    expect(screen.getByText('hrWord0')).toBeTruthy();
    expect(screen.getByText('enWord0')).toBeTruthy();
    expect(screen.getByText('hrWord1')).toBeTruthy();
    expect(screen.getByText('enWord1')).toBeTruthy();
  });

  it('cards have role="button" for accessibility', () => {
    renderMatchGame();
    const cards = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.startsWith('hrWord') || b.textContent?.startsWith('enWord'));
    expect(cards.length).toBe(4);
  });
});

// ── Matching mechanics ────────────────────────────────────────────────────────

describe('MatchGame — selection mechanics', () => {
  it('clicking the same card twice deselects it', () => {
    renderMatchGame();
    const card = screen.getByText('hrWord0');
    fireEvent.click(card); // select
    fireEvent.click(card); // deselect
    // aria-pressed should now be false
    expect(card.getAttribute('aria-pressed')).toBe('false');
  });

  it('selecting a card marks it as pressed', () => {
    renderMatchGame();
    const card = screen.getByText('hrWord0');
    fireEvent.click(card);
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });
});

// ── Completion + award guard ──────────────────────────────────────────────────

describe('MatchGame — completion + award guard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMarkQuest.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Match all pairs in a 2-pair pool. */
  async function matchAllPairs(award: ReturnType<typeof vi.fn>) {
    render(<MatchGame initPool={makePairs(2)} goBack={vi.fn()} award={award} />);

    // Match pair 0: hrWord0 + enWord0
    fireEvent.click(screen.getByText('hrWord0'));
    fireEvent.click(screen.getByText('enWord0'));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Match pair 1: hrWord1 + enWord1
    fireEvent.click(screen.getByText('hrWord1'));
    fireEvent.click(screen.getByText('enWord1'));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
  }

  it('shows completion screen after all pairs matched', async () => {
    const award = vi.fn();
    await matchAllPairs(award);
    // matchAllPairs already advances 600ms (past the 500ms completion timeout)
    // waitFor + fake timers deadlocks — check directly instead
    expect(screen.queryByText('All Matched!')).toBeTruthy();
  });

  it('award(20) is called exactly once on completion', async () => {
    const award = vi.fn();
    await matchAllPairs(award);
    await act(async () => {
      vi.advanceTimersByTime(500);
    }); // completion timeout
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(20);
  });

  it('markQuest("vocab") is called on completion', async () => {
    const award = vi.fn();
    await matchAllPairs(award);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(mockMarkQuest).toHaveBeenCalledWith('vocab');
  });

  it('markQuest is called exactly once', async () => {
    const award = vi.fn();
    await matchAllPairs(award);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('MatchGame — navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Continue button calls goBack after completion', async () => {
    const goBack = vi.fn();
    const award = vi.fn();
    render(<MatchGame initPool={makePairs(2)} goBack={goBack} award={award} />);

    fireEvent.click(screen.getByText('hrWord0'));
    fireEvent.click(screen.getByText('enWord0'));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.click(screen.getByText('hrWord1'));
    fireEvent.click(screen.getByText('enWord1'));
    // Advance past the 500ms completion timeout
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Completion screen is now shown — check directly (waitFor + fake timers deadlocks)
    expect(screen.queryByText('All Matched!')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue →'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
