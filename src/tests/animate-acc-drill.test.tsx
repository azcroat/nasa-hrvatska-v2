/**
 * animate-acc-drill.test.tsx — Behavioral tests for the AnimateAccDrill component.
 *
 * Critical behaviors tested:
 *   - First question shown (DATA[0] with identity shuffle)
 *   - Correct answer shows "✅ Correct!" feedback
 *   - Wrong answer shows "❌ Incorrect." feedback
 *   - award(score * 5) called once on completion
 *   - markQuest('grammar') called on completion
 *   - goBack called when "← Back" clicked on done screen
 *
 * Shuffle is deterministic: rnd() → 0.99 makes shLocal() identity.
 * DATA[0] = { q:"Vidim svog ___ na ulici.", nom:"brat (brother)", answer:"brata" }.
 * All 20 DATA entries have opts[0] === answer → score=20, award(100).
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

// ── StatsContext mock ─────────────────────────────────────────────────────────
vi.mock('../context/StatsContext.tsx', () => ({
  useStats: () => ({
    writeDelta: vi.fn(),
    stats: {},
    setStats: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import AnimateAccDrill from '../components/practice/AnimateAccDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAnimateAccDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<AnimateAccDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 20 questions by clicking the first .ob option each time.
 * All 20 DATA entries have opts[0] === answer → score=20, award(100).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderAnimateAccDrill({ award });
  for (let i = 0; i < 20; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('AnimateAccDrill — rendering', () => {
  it('renders without crashing', () => {
    renderAnimateAccDrill();
  });

  it('shows the Animate Accusative title', () => {
    renderAnimateAccDrill();
    expect(screen.getByText('🎯 Animate Accusative')).toBeTruthy();
  });

  it('shows the first question text (DATA[0] with identity shuffle)', () => {
    renderAnimateAccDrill();
    expect(screen.getByText('Vidim svog ___ na ulici.')).toBeTruthy();
  });

  it('shows the nominative hint for the first question', () => {
    renderAnimateAccDrill();
    expect(screen.getByText('brat (brother)')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderAnimateAccDrill();
    expect(screen.getByText('I see my brother on the street.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderAnimateAccDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderAnimateAccDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('AnimateAccDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderAnimateAccDrill();
    // DATA[0] answer = "brata" = opts[0] with identity shuffle
    fireEvent.click(screen.getByText('brata'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderAnimateAccDrill();
    // "brat" is the nominative (wrong for accusative animate)
    fireEvent.click(screen.getByText('brat'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderAnimateAccDrill();
    fireEvent.click(screen.getByText('brata'));
    // DATA[0].tip contains "ANIMATE"
    expect(screen.getByText(/ANIMATE/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderAnimateAccDrill();
    fireEvent.click(screen.getByText('brata'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('options are locked after answering — no double-submit', () => {
    renderAnimateAccDrill();
    fireEvent.click(screen.getByText('brata'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
    expect(screen.queryByText('Check Answer')).toBeNull();
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderAnimateAccDrill();
    for (let i = 0; i < 19; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('AnimateAccDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 20/)).toBeTruthy();
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

  it('award() receives XP = score * 5 (all 20 correct → 100 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledWith(100, false, 'grammar');
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

describe('AnimateAccDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<AnimateAccDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
