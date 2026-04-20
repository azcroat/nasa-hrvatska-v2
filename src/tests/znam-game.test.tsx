/**
 * znam-game.test.tsx — Behavioral tests for the ZnamGame component.
 *
 * Critical behaviors tested:
 *   - Section list rendered from ZNAM data
 *   - Clicking section enters quiz mode with correct question structure
 *   - award(5) called on each CORRECT answer (never on wrong answer)
 *   - srMark called for every answer (correct or wrong)
 *   - Options locked after answering (no double-scoring)
 *   - Navigation: Next → advances, See Results → done mode
 *   - Done screen shows section name + XP earned
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// ── vi.hoisted — any refs used inside vi.mock factories must be hoisted ────────
const mockSrMark = vi.hoisted(() => vi.fn());

// ── data mock — MOCK_ZNAM defined inside factory to avoid hoisting issues ─────
// sh: identity so options appear in predictable order: [correct, ...alts]
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  // Two sentences in one section: full quiz flow (Next → + See Results)
  const MOCK_ZNAM = {
    title: 'Znam – ne znam!',
    sections: [
      {
        name: 'Test Section',
        sentences: [
          { en: 'Hello', hr: 'Zdravo', alts: ['Dobar dan', 'Hvala', 'Doviđenja'] },
          { en: 'Goodbye', hr: 'Doviđenja', alts: ['Zdravo', 'Hvala', 'Molim'] },
        ],
      },
    ],
  };
  return {
    ...actual,
    srMark: mockSrMark,
    sh: (arr: unknown[]) => [...arr],
    ZNAM: MOCK_ZNAM,
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import ZnamGame from '../components/practice/ZnamGame';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderZnamGame(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<ZnamGame {...props} />);
  return { ...utils, props };
}

/**
 * Enter quiz mode by clicking "Test Section" from the menu.
 * With sh = identity, options for Q1 are: ['Zdravo', 'Dobar dan', 'Hvala', 'Doviđenja'].
 * 'Zdravo' is the correct answer for Q1.
 * 'Doviđenja' is the correct answer for Q2.
 */
function enterQuizMode(award: ReturnType<typeof vi.fn> = vi.fn()) {
  render(<ZnamGame goBack={vi.fn()} award={award} />);
  fireEvent.click(screen.getByText('Test Section'));
  return { award };
}

/** Answer both questions correctly and reach the done screen. */
function completeSection(award: ReturnType<typeof vi.fn> = vi.fn()) {
  enterQuizMode(award);
  // Q1: click correct answer 'Zdravo'
  fireEvent.click(screen.getByText('Zdravo'));
  // Advance to Q2
  fireEvent.click(screen.getByText('Next →'));
  // Q2: click correct answer 'Doviđenja'
  fireEvent.click(screen.getByText('Doviđenja'));
  // Go to done screen
  fireEvent.click(screen.getByText('See Results'));
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ZnamGame — rendering', () => {
  it('renders without crashing', () => {
    renderZnamGame();
  });

  it('shows the ZNAM title', () => {
    renderZnamGame();
    // H() renders the title: '🇭🇷 Znam – ne znam!'
    expect(screen.getByText(/Znam/)).toBeTruthy();
  });

  it('shows section names in the menu', () => {
    renderZnamGame();
    expect(screen.getByText('Test Section')).toBeTruthy();
  });

  it('shows sentence count for each section', () => {
    renderZnamGame();
    expect(screen.getByText(/2 sentences/)).toBeTruthy();
  });
});

// ── Quiz mechanics ────────────────────────────────────────────────────────────

describe('ZnamGame — quiz mechanics', () => {
  beforeEach(() => {
    mockSrMark.mockClear();
  });

  it('clicking a section enters quiz mode and shows the English prompt', () => {
    renderZnamGame();
    fireEvent.click(screen.getByText('Test Section'));
    expect(screen.getByText(/"Hello"/)).toBeTruthy();
  });

  it('renders 4 option buttons in quiz mode', () => {
    const { award: _award } = enterQuizMode();
    // Four Croatian option buttons should appear
    const opts = screen
      .getAllByRole('button')
      .filter((b) => ['Zdravo', 'Dobar dan', 'Hvala', 'Doviđenja'].includes(b.textContent ?? ''));
    expect(opts.length).toBe(4);
  });

  it('clicking the correct answer calls award(5)', () => {
    const award = vi.fn();
    enterQuizMode(award);
    fireEvent.click(screen.getByText('Zdravo')); // correct for Q1
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(5);
  });

  it('clicking a wrong answer does NOT call award', () => {
    const award = vi.fn();
    enterQuizMode(award);
    fireEvent.click(screen.getByText('Dobar dan')); // wrong answer
    expect(award).not.toHaveBeenCalled();
  });

  it('srMark is called for every answer (correct or wrong)', () => {
    enterQuizMode();
    // Correct answer
    fireEvent.click(screen.getByText('Zdravo'));
    expect(mockSrMark).toHaveBeenCalledTimes(1);
    expect(mockSrMark).toHaveBeenCalledWith('Zdravo', true);
  });

  it('srMark records wrong answers with isCorrect=false', () => {
    enterQuizMode();
    fireEvent.click(screen.getByText('Dobar dan')); // wrong
    expect(mockSrMark).toHaveBeenCalledWith('Zdravo', false);
  });

  it('options are locked after answering (clicking again does not re-award)', () => {
    const award = vi.fn();
    enterQuizMode(award);
    fireEvent.click(screen.getByText('Zdravo')); // answer
    fireEvent.click(screen.getByText('Zdravo')); // second click — locked
    fireEvent.click(screen.getByText('Zdravo')); // third click — locked
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('shows Next → after answering a non-final question', () => {
    enterQuizMode();
    fireEvent.click(screen.getByText('Zdravo'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows See Results instead of Next → on the last question', () => {
    enterQuizMode();
    // Answer Q1 and advance
    fireEvent.click(screen.getByText('Zdravo'));
    fireEvent.click(screen.getByText('Next →'));
    // Now on Q2 (last)
    fireEvent.click(screen.getByText('Doviđenja'));
    expect(screen.getByText('See Results')).toBeTruthy();
  });
});

// ── Completion / done screen ──────────────────────────────────────────────────

describe('ZnamGame — completion + done screen', () => {
  it('shows done screen after clicking See Results', () => {
    completeSection();
    expect(screen.getByText('Test Section Complete!')).toBeTruthy();
  });

  it('shows correct score in done screen', () => {
    completeSection();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('shows XP earned in done screen (score * 5)', () => {
    completeSection();
    // 2 correct × 5 = 10 XP
    expect(screen.getByText('+10 XP')).toBeTruthy();
  });

  it('shows Retry button in done screen', () => {
    completeSection();
    expect(screen.getByText('🔄 Retry')).toBeTruthy();
  });

  it('award(5) called once per correct answer across full section', () => {
    const award = vi.fn();
    completeSection(award);
    // 2 correct answers → award(5) called twice
    expect(award).toHaveBeenCalledTimes(2);
    expect(award).toHaveBeenCalledWith(5);
  });
});
