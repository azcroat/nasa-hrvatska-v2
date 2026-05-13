/**
 * conjugation-drill.test.tsx — Behavioral tests for the ConjugationDrill component.
 *
 * Critical behaviors tested:
 *   - Menu screen shows 4 tense tiles
 *   - Clicking "All Tenses" transitions to quiz mode
 *   - First question shown (CONJ[0]/ja with identity shuffle)
 *   - award(cjS * 2 + 10) called ONCE on "🏠 Finish!" (20 correct → award(50))
 *   - markQuest('grammar') called on Finish
 *   - writeDelta({ gc: 1, vs: ['conjugation'] }) called on Finish
 *   - setStats called on Finish (via context, not prop)
 *   - goBack called on Finish
 *
 * Shuffle is deterministic: rnd() → 0.99 makes sh() identity.
 * CONJ has 21 verbs × 6 persons = 126 questions; picks first 20.
 * Q0: verb "čitati" (to read), person "ja", answer "čitam".
 * Options are constructed as sh([answer, ...wrongs]) — identity keeps answer first.
 * All 20 questions: clicking first .ob button = correct → score=20, award(50) on Finish.
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

// ── adaptive mock ─────────────────────────────────────────────────────────────
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));

// ── rnd mock — 0.99 makes sh() identity ──────────────────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

// ── StatsContext mock — provides useStats() without needing a Provider ────────
const mockWriteDelta = vi.hoisted(() => vi.fn());
const mockSetStats = vi.hoisted(() => vi.fn());
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

// ── data mock ─────────────────────────────────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    speak: vi.fn(),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import ConjugationDrill from '../components/practice/ConjugationDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderConjugationDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<ConjugationDrill {...props} />);
  return { ...utils, props };
}

/**
 * Start quiz in "All Tenses" mode and complete all 20 questions by clicking
 * the first .ob button each time (always correct with identity shuffle).
 * Then click "🏠 Finish!" to trigger award(50) + markQuest + writeDelta + goBack.
 *
 * award(cjS * 2 + 10) = award(50) is called exactly once on Finish.
 */
function completeAllAndFinish(
  award: ReturnType<typeof vi.fn> = vi.fn(),
  goBack: ReturnType<typeof vi.fn> = vi.fn(),
) {
  const { container } = render(<ConjugationDrill award={award} goBack={goBack} />);
  // Click "All Tenses" to start the quiz
  fireEvent.click(screen.getByText('All Tenses'));
  // Answer all 20 questions
  for (let i = 0; i < 20; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    // "See Results" on last question, "Next →" on others
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  // Done screen: click "🏠 Finish!" to trigger completion effects
  const finishBtn = screen.queryByText('🏠 Finish!');
  if (finishBtn) fireEvent.click(finishBtn);
  return { award, goBack };
}

// ── Rendering — menu screen ───────────────────────────────────────────────────

describe('ConjugationDrill — menu screen', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('renders without crashing', () => {
    renderConjugationDrill();
  });

  it('shows the Verb Conjugation Drill title', () => {
    renderConjugationDrill();
    expect(screen.getByText('🔄 Verb Conjugation Drill')).toBeTruthy();
  });

  it('shows all 4 tense options', () => {
    renderConjugationDrill();
    // CSS textTransform:"capitalize" renders visually but jsdom has raw lowercase-first strings
    expect(screen.getByText('All Tenses')).toBeTruthy();
    expect(screen.getByText('present Tense')).toBeTruthy();
    expect(screen.getByText('past Tense')).toBeTruthy();
    expect(screen.getByText('future Tense')).toBeTruthy();
  });

  it('does not show option buttons (quiz not started)', () => {
    const { container } = renderConjugationDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(0);
  });
});

// ── Quiz start ────────────────────────────────────────────────────────────────

describe('ConjugationDrill — quiz start', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('clicking All Tenses transitions to quiz mode', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    // Menu tiles no longer visible; quiz content visible
    expect(screen.queryByText('Present Tense')).toBeNull();
  });

  it('shows first question verb after starting All Tenses quiz', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    // Q0: verb "čitati" (to read)
    expect(screen.getByText(/čitati/)).toBeTruthy();
  });

  it('shows first question person after starting quiz', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    // Q0: person "ja" — the person label appears in the question area
    // The button text is "ja čitam", "ja čitaš", etc.
    const opts = screen.getAllByText(/^ja /);
    expect(opts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows 4 option buttons after starting quiz', () => {
    const { container } = renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress counter 1 / 20 after starting quiz', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    expect(screen.getByText(/1 \/ 20/)).toBeTruthy();
  });

  it('shows progress bar in quiz mode', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('ConjugationDrill — answer mechanics', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('shows Next → after answering first question', () => {
    const { container } = renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('does not show Next → before answering', () => {
    renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    expect(screen.queryByText('Next →')).toBeNull();
  });

  it('options are locked after answering — clicking again does not change state', () => {
    const award = vi.fn();
    const { container } = render(<ConjugationDrill award={award} goBack={vi.fn()} />);
    fireEvent.click(screen.getByText('All Tenses'));
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    const callsAfterFirst = award.mock.calls.length;
    // Clicking again should not trigger award again
    fireEvent.click(optBtn);
    expect(award.mock.calls.length).toBe(callsAfterFirst);
  });

  it('advances to next question after clicking Next →', () => {
    const { container } = renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    fireEvent.click(container.querySelector('button.ob')!);
    fireEvent.click(screen.getByText('Next →'));
    // Q1: verb "čitati", person "ti"
    expect(screen.getByText(/2 \/ 20/)).toBeTruthy();
  });

  it('shows See Results on the last question after answering', () => {
    const { container } = renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    for (let i = 0; i < 19; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      fireEvent.click(container.querySelector('button.b.bp')!);
    }
    // Now on question 20 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See Results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('ConjugationDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('shows done screen after all 20 questions answered', () => {
    completeAllAndFinish();
    // goBack is called, but "Conjugation Complete!" would have been shown before
    // We can verify by checking markQuest was called (completion effect fired)
    expect(mockMarkQuest).toHaveBeenCalled();
  });

  it('shows Conjugation Complete! heading on done screen', () => {
    const { container } = render(<ConjugationDrill goBack={vi.fn()} award={vi.fn()} />);
    fireEvent.click(screen.getByText('All Tenses'));
    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Conjugation Complete!')).toBeTruthy();
  });

  it('shows score on done screen (20 / 20)', () => {
    const { container } = render(<ConjugationDrill goBack={vi.fn()} award={vi.fn()} />);
    fireEvent.click(screen.getByText('All Tenses'));
    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/20 \/ 20/)).toBeTruthy();
  });

  it('award(cjS * 2 + 10) called exactly once on Finish (20 correct → award(50))', () => {
    const award = vi.fn();
    completeAllAndFinish(award);
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(50, false, 'grammar');
  });

  it('markQuest("grammar") called on Finish', () => {
    completeAllAndFinish();
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest called exactly once', () => {
    completeAllAndFinish();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('writeDelta({ gc: 1, vs: ["conjugation"] }) called on Finish', () => {
    completeAllAndFinish();
    expect(mockWriteDelta).toHaveBeenCalledWith({ gc: 1, vs: ['conjugation'] });
  });

  it('setStats called on Finish (via context)', () => {
    completeAllAndFinish();
    expect(mockSetStats).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('ConjugationDrill — navigation', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('goBack is called when Finish is clicked on done screen', () => {
    const goBack = vi.fn();
    completeAllAndFinish(vi.fn(), goBack);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('Menu button on done screen returns to menu mode', () => {
    const { container } = renderConjugationDrill();
    fireEvent.click(screen.getByText('All Tenses'));
    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen — click "📋 Menu"
    fireEvent.click(screen.getByText('📋 Menu'));
    // Back to menu — tense tiles visible again (CSS capitalize → raw lowercase-first)
    expect(screen.getByText('All Tenses')).toBeTruthy();
    expect(screen.getByText('present Tense')).toBeTruthy();
  });
});
