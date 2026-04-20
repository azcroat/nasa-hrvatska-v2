/**
 * imperative-drill.test.tsx — Behavioral tests for the ImperativeDrill component.
 *
 * Critical behaviors tested:
 *   - First question shown (DATA[0] with identity shuffle)
 *   - Correct answer shows "✅ Correct!" feedback
 *   - Wrong answer shows "❌ Incorrect." feedback
 *   - award(score * 5) called once on completion
 *   - markQuest('grammar') called on completion
 *   - goBack called when "← Back" clicked on done screen
 *
 * Shuffle is deterministic: rnd() → 0.99 makes shLocal() identity
 * (j = Math.floor(0.99 * (i+1)) = i, swap arr[i] with itself → no-op).
 * DATA[0] = { q:"'Speak!' (informal, govoriti)", answer:"Govori!" }.
 * 21/22 first options match the answer (DATA[5] is the exception) → award(105).
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

// ── rnd mock — 0.99 makes shLocal() identity ─────────────────────────────────
// j = Math.floor(0.99*(i+1)) = i for all i → arr[i] swaps with itself → no change
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

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

import ImperativeDrill from '../components/practice/ImperativeDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderImperativeDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<ImperativeDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 22 questions by clicking the first .ob option each time.
 * With rnd=0.99 (identity shuffle), DATA order is preserved.
 * 21/22 questions have opts[0] === answer → score=21, award(105).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderImperativeDrill({ award });
  for (let i = 0; i < 22; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break; // reached done screen
    fireEvent.click(optBtn);
    // Use container-scoped query to avoid cross-render contamination.
    // button.b.bp = "Next →" or "See results" after answering; "← Back" on done screen.
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ImperativeDrill — rendering', () => {
  it('renders without crashing', () => {
    renderImperativeDrill();
  });

  it('shows the Imperative Drill title', () => {
    renderImperativeDrill();
    expect(screen.getByText('⚡ Imperative Drill')).toBeTruthy();
  });

  it('shows the first question text (DATA[0] with identity shuffle)', () => {
    renderImperativeDrill();
    expect(screen.getByText("'Speak!' (informal, govoriti)")).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderImperativeDrill();
    expect(screen.getByText('Speak! (to one person)')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderImperativeDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderImperativeDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('ImperativeDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderImperativeDrill();
    // DATA[0] answer = "Govori!" = opts[0] with identity shuffle
    fireEvent.click(screen.getByText('Govori!'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderImperativeDrill();
    // "Govorite!" is wrong for DATA[0]
    fireEvent.click(screen.getByText('Govorite!'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderImperativeDrill();
    fireEvent.click(screen.getByText('Govori!'));
    // DATA[0].tip = "govoriti → stem 'govor' + i → 'govori'"
    // Use "stem 'govor'" — unique to tip, not in DATA[0].q "'Speak!' (informal, govoriti)"
    expect(screen.getByText(/stem 'govor'/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderImperativeDrill();
    fireEvent.click(screen.getByText('Govori!'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('options are locked after answering — no double-submit', () => {
    renderImperativeDrill();
    fireEvent.click(screen.getByText('Govori!'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
    // After answering, Check Answer is replaced by Next →
    expect(screen.queryByText('Check Answer')).toBeNull();
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderImperativeDrill();
    for (let i = 0; i < 21; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      // container-scoped to avoid cross-render contamination
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Now on question 22 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('ImperativeDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 22/)).toBeTruthy();
  });

  it('shows ← Back button on done screen', () => {
    completeAllQuestions();
    expect(screen.getByText('← Back')).toBeTruthy();
  });

  it('award() is called exactly once on completion', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 5 (21 correct → 105 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    // 21/22 opts[0] === answer; DATA[5] is the exception → score=21, XP=105
    expect(award).toHaveBeenCalledWith(105);
  });

  it('markQuest("grammar") is called on completion', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once (not per question)', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('ImperativeDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<ImperativeDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 22; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      // Use container-scoped query to avoid cross-render contamination
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen: click "← Back" button (only .b.bp button on done screen)
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
