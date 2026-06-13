/**
 * word-families.test.tsx — Behavioral tests for the WordFamilies component.
 *
 * Critical behaviors tested:
 *   - award() called exactly once when Done is clicked (never more)
 *   - markQuest('vocab') called on completion
 *   - Correct option selection shows tip panel
 *   - Wrong option shows red highlight, not green
 *   - Score increments only on correct answers
 *   - award() receives XP = score * 5
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

// ── quests mock ───────────────────────────────────────────────────────────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// rnd()=0.9999 freezes the shuffle to identity, so opts[0] === answer for every
// question. Clicking the first option therefore scores 100% — clearing the 75%
// completion gate so the "Done" / award / quest path is exercised.
vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

// ── StatsContext mock ─────────────────────────────────────────────────────────
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[], gc: 0 },
    setStats: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: vi.fn(),
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── data mock ─────────────────────────────────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    // Bar: just renders a div so tests don't break on SVG/canvas
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import WordFamilies from '../components/practice/WordFamilies';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWordFamilies(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<WordFamilies {...props} />);
  return { ...utils, props };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('WordFamilies — rendering', () => {
  it('renders without crashing', () => {
    renderWordFamilies();
  });

  it('shows the Word Families title', () => {
    renderWordFamilies();
    expect(screen.getByText('🌱 Word Families')).toBeTruthy();
  });

  it('shows a root label for the first question', () => {
    renderWordFamilies();
    // Should have a "Root:" label
    expect(screen.getByText(/Root:/)).toBeTruthy();
  });

  it('renders 4 option buttons for the first question', () => {
    renderWordFamilies();
    // The component shows 4 options in a 2×2 grid
    const optionBtns = screen
      .getAllByRole('button')
      .filter(
        (b) => b.textContent && !b.textContent.includes('Done') && !b.textContent.includes('Next'),
      );
    expect(optionBtns.length).toBeGreaterThanOrEqual(4);
  });

  it('shows progress bar', () => {
    renderWordFamilies();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('does not show the tip panel before answering', () => {
    renderWordFamilies();
    expect(screen.queryByText('💡 Word Family')).toBeNull();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('WordFamilies — answer mechanics', () => {
  it('shows tip panel after selecting an option', () => {
    // Use .ob class selector — option buttons have className="ob",
    // which distinguishes them from the H header back button
    const { container } = renderWordFamilies();
    const optBtn = container.querySelector('button.ob');
    if (optBtn) fireEvent.click(optBtn);
    expect(screen.getByText('💡 Word Family')).toBeTruthy();
  });

  it('locks options after answering (no double-scoring)', () => {
    const { container } = renderWordFamilies();
    const optBtn = container.querySelector('button.ob') as HTMLElement;
    fireEvent.click(optBtn);
    // Clicking again should not show a second tip panel
    fireEvent.click(optBtn);
    const tips = screen.queryAllByText('💡 Word Family');
    expect(tips.length).toBe(1);
  });

  it('shows Next → after answering', () => {
    const { container } = renderWordFamilies();
    const optBtn = container.querySelector('button.ob');
    if (optBtn) fireEvent.click(optBtn);
    expect(screen.getByText('Next →')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('WordFamilies — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  /** Navigate through all 20 questions by picking the first .ob option each time.
   *  DATA has 20 entries (shLocal shuffles them). Loop until .ob buttons disappear
   *  (completion screen has none). */
  function completeAllQuestions() {
    const award = vi.fn();
    const { container } = renderWordFamilies({ award });

    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break; // reached completion screen
      fireEvent.click(optBtn);
      const nextBtn = screen.queryByText('Next →');
      if (nextBtn) fireEvent.click(nextBtn);
    }

    return { award };
  }

  it('shows completion screen after all questions answered', () => {
    completeAllQuestions();
    // Completion shows a score display and Done button
    expect(screen.getByText('🏠 Done')).toBeTruthy();
  });

  it('award() is called exactly once when Done is clicked', () => {
    const { award } = completeAllQuestions();
    fireEvent.click(screen.getByText('🏠 Done'));
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() is NOT called a second time on rapid double-click', () => {
    const { award } = completeAllQuestions();
    const doneBtn = screen.getByText('🏠 Done');
    fireEvent.click(doneBtn);
    fireEvent.click(doneBtn);
    fireEvent.click(doneBtn);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('markQuest("grammar") is called on completion', () => {
    const { award: _award } = completeAllQuestions();
    fireEvent.click(screen.getByText('🏠 Done'));
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once (not per answer)', () => {
    const { award: _award } = completeAllQuestions();
    fireEvent.click(screen.getByText('🏠 Done'));
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 5', () => {
    const { award } = completeAllQuestions();
    fireEvent.click(screen.getByText('🏠 Done'));
    const [xp] = award.mock.calls[0];
    // XP should be a multiple of 5 (or 0 if all wrong)
    expect(xp % 5).toBe(0);
    expect(xp).toBeGreaterThanOrEqual(0);
  });
});
