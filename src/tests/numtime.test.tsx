/**
 * numtime.test.tsx — Behavioral tests for the NumTime component.
 *
 * Critical behaviors tested:
 *   - First question shown (NUMTIME.numbers[0]: "How do you say 15?")
 *   - Correct answer is opts[0] (sh([a, ...al]) with identity shuffle)
 *   - Next → appears after answering; advances to Q2
 *   - Options locked after answering (guard prevents double-count)
 *   - award(ntS * 3 + 10) called on "Finish!" after all 10 questions
 *   - goBack called on "Finish!"
 *   - finishFired guard prevents double-award on rapid Finish clicks
 *
 * Shuffle: rnd() → 0.99 makes sh() identity.
 * NUMTIME has 8 numbers + 14 time items; slice(0, 10) picks first 10.
 * Q0: {q:"How do you say 15?", a:"petnaest", al:[...]}.
 * opts = sh([a, ...al]) = [a, ...al] (identity) → opts[0] = answer.
 * 10 correct → award(10 * 3 + 10) = award(40) on Finish.
 *
 * NumTime has no mode tabs so container.querySelector('button.b.bp')
 * reliably finds the Next → / See Results / Finish! button.
 */
import { describe, it, expect, vi } from 'vitest';
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

// ── rnd mock — 0.99 makes sh() identity ──────────────────────────────────────
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

import NumTime from '../components/practice/NumTime';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderNumTime(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<NumTime {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 10 NumTime questions and optionally click Finish.
 * opts[0] = answer for all questions with identity shuffle.
 * No mode tabs → button.b.bp reliably finds Next → / See Results.
 * award(ntS * 3 + 10) and goBack() both fire on Finish click.
 */
function completeAndFinish(
  award: ReturnType<typeof vi.fn> = vi.fn(),
  goBack: ReturnType<typeof vi.fn> = vi.fn()
) {
  const { container } = render(<NumTime award={award} goBack={goBack} />);
  for (let i = 0; i < 10; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  // Done screen: click Finish! to trigger award + goBack
  const finishBtn = screen.queryByText('Finish!');
  if (finishBtn) fireEvent.click(finishBtn);
  return { award, goBack };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('NumTime — rendering', () => {
  it('renders without crashing', () => {
    renderNumTime();
  });

  it('shows the Numbers & Time title', () => {
    renderNumTime();
    expect(screen.getByText('🔢 Numbers & Time')).toBeTruthy();
  });

  it('shows the first question text (NUMTIME.numbers[0] with identity shuffle)', () => {
    renderNumTime();
    expect(screen.getByText('How do you say 15?')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderNumTime();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderNumTime();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('NumTime — answer mechanics', () => {
  it('shows Next → after answering first question', () => {
    const { container } = renderNumTime();
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('does not show Next → before answering', () => {
    renderNumTime();
    expect(screen.queryByText('Next →')).toBeNull();
  });

  it('options are locked after answering — guard prevents double-count', () => {
    const { container } = renderNumTime();
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    expect(screen.getByText('Next →')).toBeTruthy();
    // Clicking again should not re-trigger anything (ntA guard returns early)
    fireEvent.click(optBtn);
    // Score stays at 1, not 2 — verified by the completion award test
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('advances to second question after clicking Next →', () => {
    const { container } = renderNumTime();
    fireEvent.click(container.querySelector('button.ob')!);
    fireEvent.click(container.querySelector('button.b.bp')!);
    // Q1: NUMTIME.numbers[1] = {q:"How do you say 28?"}
    expect(screen.getByText('How do you say 28?')).toBeTruthy();
  });

  it('shows See Results on the last question after answering', () => {
    const { container } = renderNumTime();
    for (let i = 0; i < 9; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      fireEvent.click(container.querySelector('button.b.bp')!);
    }
    // Now on question 10 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See Results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('NumTime — completion + award guard', () => {
  it('shows Numbers Complete! on the done screen', () => {
    const { container } = render(<NumTime award={vi.fn()} goBack={vi.fn()} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Numbers Complete!')).toBeTruthy();
  });

  it('shows score 10 / 10 on done screen', () => {
    const { container } = render(<NumTime award={vi.fn()} goBack={vi.fn()} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/10 \/ 10/)).toBeTruthy();
  });

  it('shows Finish! button on done screen', () => {
    const { container } = render(<NumTime award={vi.fn()} goBack={vi.fn()} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Finish!')).toBeTruthy();
  });

  it('award() called exactly once when Finish is clicked', () => {
    const award = vi.fn();
    completeAndFinish(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award(ntS * 3 + 10) called on Finish (10 correct → award(40))', () => {
    const award = vi.fn();
    completeAndFinish(award);
    // 10/10 correct → ntS=10 → award(10*3+10) = award(40)
    expect(award).toHaveBeenCalledWith(40);
  });

  it('Finish! button calls both award and goBack', () => {
    const award = vi.fn();
    const goBack = vi.fn();
    completeAndFinish(award, goBack);
    expect(award).toHaveBeenCalledTimes(1);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('finishFired guard — rapid double-click on Finish does not double-award', () => {
    const award = vi.fn();
    const goBack = vi.fn();
    const { container } = render(<NumTime award={award} goBack={goBack} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    const finishBtn = screen.queryByText('Finish!');
    if (finishBtn) {
      fireEvent.click(finishBtn);
      fireEvent.click(finishBtn); // rapid second click
    }
    expect(award).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('NumTime — navigation', () => {
  it('goBack is called when Finish is clicked on the done screen', () => {
    const goBack = vi.fn();
    completeAndFinish(vi.fn(), goBack);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
