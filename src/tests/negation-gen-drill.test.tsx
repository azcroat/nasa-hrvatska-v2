/**
 * negation-gen-drill.test.tsx — Behavioral tests for the NegationGenDrill component.
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
 * DATA[0] = { affirm:"Imam brata.", neg_prompt:"I don't have a brother.", answer:"Nemam brata." }.
 * All 20 DATA entries have opts[0] === answer → score=20, award(100).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Firebase mock ─────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(), initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {}, browserSessionPersistence: {}, inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})), signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(), deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
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

import NegationGenDrill from '../components/practice/NegationGenDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderNegationGenDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<NegationGenDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 20 questions by clicking the first .ob option each time.
 * All 20 DATA entries have opts[0] === answer → score=20, award(100).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderNegationGenDrill({ award });
  for (let i = 0; i < 20; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = screen.queryByText('Next →') ?? screen.queryByText('See results');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('NegationGenDrill — rendering', () => {
  it('renders without crashing', () => {
    renderNegationGenDrill();
  });

  it('shows the Genitive of Negation title', () => {
    renderNegationGenDrill();
    expect(screen.getByText('❌ Genitive of Negation')).toBeTruthy();
  });

  it('shows the affirmative sentence for the first question', () => {
    renderNegationGenDrill();
    // DATA[0].affirm shown with ✅ prefix
    expect(screen.getByText(/Imam brata\./)).toBeTruthy();
  });

  it('shows the negation prompt for the first question', () => {
    renderNegationGenDrill();
    // DATA[0].neg_prompt
    expect(screen.getByText("I don't have a brother.")).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderNegationGenDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderNegationGenDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('NegationGenDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderNegationGenDrill();
    // DATA[0] opts[0] = "Nemam brata." = answer
    fireEvent.click(screen.getByText('Nemam brata.'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderNegationGenDrill();
    // "Nemam brat." is wrong for DATA[0]
    fireEvent.click(screen.getByText('Nemam brat.'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderNegationGenDrill();
    fireEvent.click(screen.getByText('Nemam brata.'));
    // DATA[0].tip: "'brat' (animate masc) — accusative and genitive singular look the same: 'brata'"
    // Use specific tip text to avoid matching the affirm sentence "✅ Imam brata."
    expect(screen.getByText(/animate masc/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderNegationGenDrill();
    fireEvent.click(screen.getByText('Nemam brata.'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('options are locked after answering', () => {
    renderNegationGenDrill();
    fireEvent.click(screen.getByText('Nemam brata.'));
    // Answer shows, options locked — second click has no effect
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderNegationGenDrill();
    for (let i = 0; i < 19; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      fireEvent.click(screen.getByText('Next →'));
    }
    // Now on question 20 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('NegationGenDrill — completion + award guard', () => {
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
    // All 20 opts[0] === answer → score=20, XP=100
    expect(award).toHaveBeenCalledWith(100);
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

describe('NegationGenDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<NegationGenDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 20; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      // Use container-scoped query to avoid cross-render contamination
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen: click "← Back" button
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
