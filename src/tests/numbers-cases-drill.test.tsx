/**
 * numbers-cases-drill.test.tsx — Behavioral tests for the NumbersCasesDrill component.
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
 * DATA[0] = { q:"___ auto (2)", opts:["dva auta","dva auto","dva auti","dva automobila"], answer:"dva auta" }.
 * DATA[2] opts[0]="tri djece" ≠ answer="tri djeteta" → 1 wrong → score=23, award(115).
 *
 * Fixed source: 4 DATA entries previously had duplicate opts (DATA[1/7/18/21]).
 * These caused React key warnings and silent button omission — fixed before this test was written.
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

import NumbersCasesDrill from '../components/practice/NumbersCasesDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderNumbersCasesDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<NumbersCasesDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 24 questions by clicking the first .ob option each time.
 * With rnd=0.99 (identity shuffle), DATA order is preserved.
 * DATA[2] opts[0]="tri djece" ≠ answer="tri djeteta" → score=23, award(115).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderNumbersCasesDrill({ award });
  for (let i = 0; i < 24; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('NumbersCasesDrill — rendering', () => {
  it('renders without crashing', () => {
    renderNumbersCasesDrill();
  });

  it('shows the Numbers + Cases title', () => {
    renderNumbersCasesDrill();
    expect(screen.getByText('🔢 Numbers + Cases')).toBeTruthy();
  });

  it('shows the first question text (DATA[0] with identity shuffle)', () => {
    renderNumbersCasesDrill();
    expect(screen.getByText('___ auto (2)')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderNumbersCasesDrill();
    expect(screen.getByText('2 cars')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderNumbersCasesDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderNumbersCasesDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('NumbersCasesDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderNumbersCasesDrill();
    // DATA[0] answer = "dva auta" = opts[0] with identity shuffle
    fireEvent.click(screen.getByText('dva auta'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderNumbersCasesDrill();
    // "dva auto" is wrong for DATA[0]
    fireEvent.click(screen.getByText('dva auto'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderNumbersCasesDrill();
    fireEvent.click(screen.getByText('dva auta'));
    // DATA[0].tip = "2/3/4 + Genitive singular: 'auto' → 'auta'"
    // Use "Genitive singular" — unique to tip, not in question or english text
    expect(screen.getByText(/Genitive singular/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderNumbersCasesDrill();
    fireEvent.click(screen.getByText('dva auta'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('options are locked after answering — guard prevents double-count', () => {
    const { container } = renderNumbersCasesDrill();
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    // Feedback shown — answered state is true
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
    // Clicking again should do nothing (answered guard returns early)
    fireEvent.click(optBtn);
    // Still only one feedback visible — not a second ✅
    expect(screen.getAllByText(/✅ Correct!/).length).toBe(1);
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderNumbersCasesDrill();
    for (let i = 0; i < 23; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Now on question 24 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('NumbersCasesDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 24/)).toBeTruthy();
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

  it('award() receives XP = score * 5 (23 correct → 115 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    // DATA[2] opts[0]="tri djece" ≠ answer="tri djeteta" → 1 wrong; 24-1=23 correct → XP=115
    expect(award).toHaveBeenCalledWith(115);
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

describe('NumbersCasesDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<NumbersCasesDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 24; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen: click "← Back" button
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
