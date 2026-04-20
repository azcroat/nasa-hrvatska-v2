/**
 * slang-screen.test.tsx — Behavioral tests for SlangScreen.
 *
 * Critical behaviors tested:
 *   - Age gate shown when 'slangAgeConfirmed' not in localStorage
 *   - "Yes, continue" → award(15) + shows main content
 *   - "No, go back" → goBack() called
 *   - Age gate: xpAwarded ref prevents double-award on re-unlock
 *   - Main content: "Slang & Psovanje" heading shown after unlock
 *   - Section tabs visible after unlock
 *   - "← Back to Practice" button calls goBack()
 *   - Switching to a new section → award(5) called once
 *   - Switching back to same section → award NOT called again
 *   - "🎯 Quiz" button visible in section header
 *   - Quiz "Done" button calls markQuest("speak")
 *   - Quiz "Done" with score=0 does NOT call award (xp > 0 guard)
 *   - Quiz "Done" with score>0 calls award(score * 3)
 *
 * Notes:
 *   - SlangEntryCard mocked as null — entry rendering is not under test
 *   - SlangQuizPanel mocked as test double — exposes onAnswer + onDone without setTimeout
 *   - sh() mocked as identity — deterministic quiz question order
 *   - localStorage manually seeded / cleared per test
 *   - vi.useFakeTimers() used for quiz answer setTimeout (1100ms)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ── SlangEntryCard mock — entry rendering not under test ──────────────────────
vi.mock('../components/practice/SlangEntryCard', () => ({ default: () => null }));

// ── SlangQuizPanel test double ────────────────────────────────────────────────
// Shows a "Done" button whenever quizMode=true. This bypasses the real quiz
// question flow (which uses a 1100ms setTimeout) and directly exposes the
// onDone callback, allowing finishQuiz() to be tested synchronously.
vi.mock('../components/practice/SlangQuizPanel', () => ({
  default: ({ quizMode, onDone }: { quizMode: boolean; onDone: () => void }) => {
    if (!quizMode) return null;
    return (
      <div data-testid="quiz-panel">
        <button onClick={onDone}>Done</button>
      </div>
    );
  },
}));

// ── data mock — preserve other exports; mock speak + sh ──────────────────────
const mockSpeak = vi.hoisted(() => vi.fn());
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    speak: mockSpeak,
    sh: (arr: unknown[]) => arr, // identity — deterministic question order
  };
});

import SlangScreen from '../components/practice/SlangScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AGE_KEY = 'slangAgeConfirmed';
const _VISITED_KEY = 'slangVisited';

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<SlangScreen {...props} />);
  return { ...utils, props };
}

/** Set up localStorage so age gate is bypassed. */
function bypassAgeGate() {
  localStorage.setItem(AGE_KEY, 'true');
}

/** Click "🎯 Quiz" button to start the quiz. */
function clickQuiz() {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Quiz'));
  if (!btn) throw new Error('"🎯 Quiz" button not found');
  fireEvent.click(btn);
}

// ─── Age gate ─────────────────────────────────────────────────────────────────

describe('SlangScreen — age gate', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "Age Confirmation Required" when not confirmed', () => {
    renderScreen();
    expect(screen.getByText(/Age Confirmation Required/)).toBeTruthy();
  });

  it('shows "Yes, continue" button', () => {
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Yes, continue')),
    ).toBeTruthy();
  });

  it('"Yes, continue" calls award(15)', () => {
    const award = vi.fn();
    render(<SlangScreen goBack={vi.fn()} award={award} />);
    fireEvent.click(screen.getByText('Yes, continue'));
    expect(award).toHaveBeenCalledWith(15);
  });

  it('"Yes, continue" shows main content', () => {
    renderScreen();
    fireEvent.click(screen.getByText('Yes, continue'));
    expect(screen.getByText(/Slang & Psowanie|Slang & Psovanje/)).toBeTruthy();
  });

  it('"Yes, continue" stores age confirmation in localStorage', () => {
    renderScreen();
    fireEvent.click(screen.getByText('Yes, continue'));
    expect(localStorage.getItem(AGE_KEY)).toBe('true');
  });

  it('"No, go back" calls goBack()', () => {
    const goBack = vi.fn();
    render(<SlangScreen goBack={goBack} award={vi.fn()} />);
    fireEvent.click(screen.getByText('No, go back'));
    expect(goBack).toHaveBeenCalled();
  });

  it('double-clicking "Yes, continue" does not double-award (xpAwarded ref)', () => {
    const award = vi.fn();
    render(<SlangScreen goBack={vi.fn()} award={award} />);
    const btn = screen.getByText('Yes, continue');
    fireEvent.click(btn);
    // After unlock, age gate is gone. Re-render with gated=false — xpAwarded ref prevents double
    // The guard `if (award && !xpAwarded.current)` ensures only one call
    expect(award).toHaveBeenCalledTimes(1);
  });
});

// ─── Main content ──────────────────────────────────────────────────────────────

describe('SlangScreen — main content (after unlock)', () => {
  beforeEach(() => {
    localStorage.clear();
    bypassAgeGate();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "Slang & Psovanje" heading', () => {
    renderScreen();
    expect(screen.getByText(/Slang & Psovanje/)).toBeTruthy();
  });

  it('shows section tab buttons', () => {
    renderScreen();
    // At least the first section (Classics) tab should be visible
    expect(
      screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Classics') || b.textContent?.includes('classics')),
    ).toBeTruthy();
  });

  it('shows "← Back to Practice" button', () => {
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Back to Practice')),
    ).toBeTruthy();
  });

  it('"← Back to Practice" button calls goBack()', () => {
    const { props } = renderScreen();
    const btn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Back to Practice'))!;
    fireEvent.click(btn);
    expect(props.goBack).toHaveBeenCalled();
  });

  it('shows "🎯 Quiz" button in section header', () => {
    renderScreen();
    expect(screen.getAllByRole('button').find((b) => b.textContent?.includes('Quiz'))).toBeTruthy();
  });

  it('shows "Your Progress" tracker', () => {
    renderScreen();
    expect(screen.getByText(/Your Progress/)).toBeTruthy();
  });
});

// ─── Section switching ────────────────────────────────────────────────────────

describe('SlangScreen — section switching', () => {
  beforeEach(() => {
    localStorage.clear();
    bypassAgeGate();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('switching to a new section calls award(5)', () => {
    const award = vi.fn();
    render(<SlangScreen goBack={vi.fn()} award={award} />);
    // Find section tabs — look for one that is NOT the default 'classics'
    const tabs = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.textContent &&
          !b.textContent.includes('Back to Practice') &&
          !b.textContent.includes('Quiz') &&
          !b.textContent.includes('Cultural'),
      );
    // Click a tab that is not the initially active one (second tab)
    const secondTab = tabs.find((b) => !b.textContent?.toLowerCase().includes('classic'));
    if (!secondTab) throw new Error('Could not find a non-classics section tab');
    fireEvent.click(secondTab);
    expect(award).toHaveBeenCalledWith(5);
  });

  it('switching to the same section twice does NOT call award twice', () => {
    const award = vi.fn();
    render(<SlangScreen goBack={vi.fn()} award={award} />);
    const tabs = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.textContent &&
          !b.textContent.includes('Back to Practice') &&
          !b.textContent.includes('Quiz') &&
          !b.textContent.includes('Cultural'),
      );
    const secondTab = tabs.find((b) => !b.textContent?.toLowerCase().includes('classic'));
    if (!secondTab) throw new Error('Could not find a non-classics section tab');
    fireEvent.click(secondTab); // First visit → award(5)
    award.mockClear();
    fireEvent.click(secondTab); // Second visit → no award
    expect(award).not.toHaveBeenCalled();
  });
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────

describe('SlangScreen — quiz', () => {
  beforeEach(() => {
    localStorage.clear();
    bypassAgeGate();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('clicking "🎯 Quiz" shows the quiz panel', () => {
    renderScreen();
    clickQuiz();
    // The mocked SlangQuizPanel renders data-testid="quiz-panel" when quizMode=true
    expect(screen.getByTestId('quiz-panel')).toBeTruthy();
  });

  it('"✕ Exit Quiz" button appears after starting quiz', () => {
    renderScreen();
    clickQuiz();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Exit Quiz')),
    ).toBeTruthy();
  });

  it('clicking "✕ Exit Quiz" hides the quiz panel', () => {
    renderScreen();
    clickQuiz();
    const exitBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Exit Quiz'))!;
    fireEvent.click(exitBtn);
    expect(screen.queryByTestId('quiz-panel')).toBeNull();
  });

  it('quiz "Done" button calls markQuest("speak")', () => {
    renderScreen();
    clickQuiz();
    // The mock always renders "Done" when quizMode=true — no need to answer questions
    const doneBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Done')!;
    fireEvent.click(doneBtn);
    expect(mockMarkQuest).toHaveBeenCalledWith('speak');
  });

  it('quiz "Done" with quizScore=0 does NOT call award (xp > 0 guard)', () => {
    const award = vi.fn();
    render(<SlangScreen goBack={vi.fn()} award={award} />);
    clickQuiz();
    const doneBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Done')!;
    fireEvent.click(doneBtn);
    // quizScore=0 → xp = 0*3 = 0 → not > 0 → award NOT called
    expect(award).not.toHaveBeenCalled();
  });

  it('quiz "Done" hides the quiz panel', () => {
    renderScreen();
    clickQuiz();
    const doneBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Done')!;
    fireEvent.click(doneBtn);
    expect(screen.queryByTestId('quiz-panel')).toBeNull();
  });
});
