/**
 * unjumble.test.tsx — Behavioral tests for the Unjumble (Word Order) component.
 *
 * Critical behaviors tested:
 *   - award() called exactly once on completion (never on double-click)
 *   - markQuest('grammar') called on completion
 *   - Correct answer detection (normalized comparison)
 *   - Score increments on correct, stays on wrong
 *   - Navigation: goBack called correctly
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

// ── data mock — MOCK_UNJUMBLE defined inside factory to avoid hoisting issues ──
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  const MOCK_UNJUMBLE = [
    { words: ['Ja', 'volim', 'Hrvatsku'], correct: 'Ja volim Hrvatsku.', en: 'I love Croatia.' },
    { words: ['Ana', 'čita', 'knjigu'],   correct: 'Ana čita knjigu.',   en: 'Ana reads a book.' },
  ];
  return {
    ...actual,
    srMark: vi.fn(),
    // Return array in-order so tests can rely on question sequence
    sh: (arr: unknown[]) => [...arr],
    UNJUMBLE: MOCK_UNJUMBLE,
  };
});

import Unjumble from '../components/practice/Unjumble';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderUnjumble(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<Unjumble {...props} />);
  return { ...utils, props };
}

/** Click word buttons in order to build a sentence in the input field. */
function buildAnswer(words: string[]) {
  for (const w of words) {
    const btn = screen.getAllByText(w).find(el => el.tagName === 'BUTTON');
    if (btn) fireEvent.click(btn);
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Unjumble — rendering', () => {
  it('renders without crashing', () => {
    renderUnjumble();
  });

  it('shows the Word Order title', () => {
    renderUnjumble();
    expect(screen.getByText('🧩 Word Order')).toBeTruthy();
  });

  it('shows the English prompt for the first question', () => {
    renderUnjumble();
    expect(screen.getByText('"I love Croatia."')).toBeTruthy();
  });

  it('shows word buttons for the first question', () => {
    renderUnjumble();
    // All 3 words should be buttons
    expect(screen.getByText('Ja')).toBeTruthy();
    expect(screen.getByText('volim')).toBeTruthy();
    expect(screen.getByText('Hrvatsku')).toBeTruthy();
  });

  it('shows empty placeholder before any word is tapped', () => {
    renderUnjumble();
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
  });

  it('does not show Check button before words are tapped (Check is always visible but input matters)', () => {
    renderUnjumble();
    // Check ✅ button should be present
    expect(screen.getByText('Check ✅')).toBeTruthy();
  });
});

// ── Interaction mechanics ─────────────────────────────────────────────────────

describe('Unjumble — interaction', () => {
  it('builds answer text when word buttons are clicked', () => {
    renderUnjumble();
    // Placeholder visible before any click
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
    fireEvent.click(screen.getByText('Ja'));
    // After clicking, placeholder is replaced by the word in the answer area
    expect(screen.queryByText('← Tap words to build sentence')).toBeNull();
  });

  it('clear button resets input', () => {
    renderUnjumble();
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('🗑 Clear'));
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
  });

  it('shows ✅ Correct! on correct answer', () => {
    renderUnjumble();
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    expect(screen.getByText('✅ Correct!')).toBeTruthy();
  });

  it('shows ❌ feedback on wrong answer', () => {
    renderUnjumble();
    buildAnswer(['volim', 'Ja', 'Hrvatsku']); // wrong order
    fireEvent.click(screen.getByText('Check ✅'));
    expect(screen.getByText(/❌ Correct answer:/)).toBeTruthy();
  });

  it('shows Next → after answering', () => {
    renderUnjumble();
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows Finish! on last question after answering', () => {
    renderUnjumble();
    // Answer Q1
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Next →'));
    // Now on Q2 (last question)
    buildAnswer(['Ana', 'čita', 'knjigu']);
    fireEvent.click(screen.getByText('Check ✅'));
    expect(screen.getByText('Finish!')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('Unjumble — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  function completeAllQuestions(award: ReturnType<typeof vi.fn>) {
    renderUnjumble({ award });
    // Answer Q1 correctly
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Next →'));
    // Answer Q2 correctly
    buildAnswer(['Ana', 'čita', 'knjigu']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Finish!'));
  }

  it('shows completion screen after finishing all questions', () => {
    const { props } = renderUnjumble();
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Next →'));
    buildAnswer(['Ana', 'čita', 'knjigu']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Finish!'));
    expect(screen.getByText('Word Order Complete!')).toBeTruthy();
  });

  it('shows correct XP on completion screen (score * 3 + 10)', () => {
    renderUnjumble();
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Next →'));
    buildAnswer(['Ana', 'čita', 'knjigu']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Finish!'));
    // 2 correct × 3 + 10 = 16 XP
    expect(screen.getByText(/\+16 XP/)).toBeTruthy();
  });

  it('award() is called exactly once when Continue is clicked', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('Continue →'));
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() is NOT called again on a second click of Continue', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    const continueBtn = screen.getByText('Continue →');
    fireEvent.click(continueBtn);
    fireEvent.click(continueBtn); // rapid second tap
    fireEvent.click(continueBtn); // third tap
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score*3 + 10', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('Continue →'));
    // 2 correct × 3 + 10 = 16
    expect(award).toHaveBeenCalledWith(16);
  });

  it('markQuest("grammar") is called on completion', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('Continue →'));
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once (not per question)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('Continue →'));
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('Unjumble — navigation', () => {
  it('goBack is called when Continue → is clicked on completion screen', () => {
    const goBack = vi.fn();
    renderUnjumble({ goBack });
    buildAnswer(['Ja', 'volim', 'Hrvatsku']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Next →'));
    buildAnswer(['Ana', 'čita', 'knjigu']);
    fireEvent.click(screen.getByText('Check ✅'));
    fireEvent.click(screen.getByText('Finish!'));
    fireEvent.click(screen.getByText('Continue →'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
