/**
 * boje-game.test.tsx — Behavioral tests for the BojeGame component.
 *
 * Critical behaviors tested:
 *   - Learn screen shows colors grid and mode tabs
 *   - Quiz starts (Start Quiz → / ✏️ Quiz button)
 *   - First question loaded lazily via setTimeout (awaited with async act)
 *   - award(5) called per correct answer during quiz
 *   - award(bjSc * 2) called when "See Results" clicked on last question
 *   - "🏠 Done" on results screen calls goBack() only (NOT award())
 *   - "📖 Review" on results screen returns to learn mode
 *
 * Shuffle is deterministic: rnd() → 0.99 makes sh() identity.
 * BOJE.quiz has 15 items. Q0: {noun:"Ruža", answer:"crvena", g:"f"}.
 * Options for Q0 (g="f"): sh(["crvena", "žuta", "plava", "zelena"]) = identity.
 * opts[0] = "crvena" = answer → clicking first .ob button is always correct.
 * 15 correct → award(30) fired on "See Results" click (bjSc * 2 = 15 * 2 = 30).
 *
 * Lazy load pattern: first render shows "Loading...", setTimeout(fn, 0) fires.
 * Tests use waitFor() to poll until Loading... disappears — each waitFor attempt
 * is wrapped in act(), which flushes the sBjOpts state update when it fires.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    speak: vi.fn(),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import BojeGame from '../components/practice/BojeGame';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBojeGame(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<BojeGame {...props} />);
  return { ...utils, props };
}

/**
 * Start the quiz and wait for the initial setTimeout(fn, 0) to fire.
 * fireEvent triggers a synchronous re-render showing "Loading..." while
 * BojeGame schedules setTimeout(() => sBjOpts(...), 0). waitFor polls
 * (with automatic act wrapping each attempt) until Loading... disappears,
 * allowing the macrotask to fire and React to flush the sBjOpts state update.
 */
async function startQuizAndWait() {
  fireEvent.click(screen.getByText('Start Quiz →'));
  // Poll until the 0ms setTimeout fires and sBjOpts state update is flushed
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).toBeNull();
  });
}

/**
 * Complete all 15 BOJE quiz questions and click "🏠 Done".
 * With identity shuffle, opts[0] = answer always → all 15 correct.
 * award(5) fired per question; award(bjSc*2) fired on "See Results" click.
 * "🏠 Done" → goBack() only.
 *
 * NOTE: BojeGame keeps mode tabs ("✏️ Quiz" = class "b bp") visible during
 * quiz mode, so container.querySelector('button.b.bp') hits the tab instead
 * of "Next →". Use text-based selectors to target the correct button.
 */
async function completeQuizAndClickDone(
  award: ReturnType<typeof vi.fn> = vi.fn(),
  goBack: ReturnType<typeof vi.fn> = vi.fn()
) {
  const { container } = render(<BojeGame award={award} goBack={goBack} />);
  await startQuizAndWait();
  for (let i = 0; i < 15; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    // Use text to avoid hitting the "✏️ Quiz" tab (also class "b bp")
    const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
    if (nextText) fireEvent.click(nextText);
  }
  const doneBtn = screen.queryByText('🏠 Done');
  if (doneBtn) fireEvent.click(doneBtn);
  return { award, goBack };
}

// ── Rendering — learn screen ──────────────────────────────────────────────────

describe('BojeGame — learn screen', () => {
  it('renders without crashing', () => {
    renderBojeGame();
  });

  it('shows the Colors & Gender title', () => {
    renderBojeGame();
    expect(screen.getByText('🎨 Boje i Rod — Colors & Gender')).toBeTruthy();
  });

  it('shows Learn and Quiz mode tabs', () => {
    renderBojeGame();
    expect(screen.getByText('📖 Learn')).toBeTruthy();
    expect(screen.getByText('✏️ Quiz')).toBeTruthy();
  });

  it('shows Start Quiz → button on learn screen', () => {
    renderBojeGame();
    expect(screen.getByText('Start Quiz →')).toBeTruthy();
  });

  it('shows color gender explanation text', () => {
    renderBojeGame();
    expect(screen.getByText(/How Colors Change by Gender/)).toBeTruthy();
  });

  it('shows color entries in learn grid', () => {
    renderBojeGame();
    expect(screen.getByText('red')).toBeTruthy();
  });
});

// ── Quiz start ────────────────────────────────────────────────────────────────

describe('BojeGame — quiz start', () => {
  it('does not show Loading... after Start Quiz → click — opts are pre-computed', async () => {
    renderBojeGame();
    // opts are pre-computed in startQuiz() so Loading... is never shown
    fireEvent.click(screen.getByText('Start Quiz →'));
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('transitions to quiz mode and loads first question', async () => {
    renderBojeGame();
    await startQuizAndWait();
    expect(screen.queryByText('Start Quiz →')).toBeNull();
    expect(screen.getByText('Ruža')).toBeTruthy();
  });

  it('shows 4 option buttons after lazy load completes', async () => {
    const { container } = renderBojeGame();
    await startQuizAndWait();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress counter 1 / 15', async () => {
    renderBojeGame();
    await startQuizAndWait();
    expect(screen.getByText(/1 \/ 15/)).toBeTruthy();
  });

  it('shows progress bar', async () => {
    renderBojeGame();
    await startQuizAndWait();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('clicking ✏️ Quiz tab also starts the quiz', async () => {
    renderBojeGame();
    fireEvent.click(screen.getByText('✏️ Quiz'));
    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    expect(screen.getByText('Ruža')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('BojeGame — answer mechanics', () => {
  it('shows Next → after answering first question', async () => {
    const { container } = renderBojeGame();
    await startQuizAndWait();
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('does not show Next → before answering', async () => {
    renderBojeGame();
    await startQuizAndWait();
    expect(screen.queryByText('Next →')).toBeNull();
  });

  it('award(5) called when correct answer is given', async () => {
    const award = vi.fn();
    const { container } = render(<BojeGame award={award} goBack={vi.fn()} />);
    await startQuizAndWait();
    fireEvent.click(container.querySelector('button.ob')!);
    expect(award).toHaveBeenCalledWith(5);
  });

  it('options are locked after answering', async () => {
    const award = vi.fn();
    const { container } = render(<BojeGame award={award} goBack={vi.fn()} />);
    await startQuizAndWait();
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    const callsAfterFirst = award.mock.calls.length;
    fireEvent.click(optBtn);
    expect(award.mock.calls.length).toBe(callsAfterFirst);
  });

  it('advances to next question after clicking Next →', async () => {
    const { container } = renderBojeGame();
    await startQuizAndWait();
    fireEvent.click(container.querySelector('button.ob')!);
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('Žaba')).toBeTruthy();
  });

  it('shows See Results on the last question after answering', async () => {
    const { container } = renderBojeGame();
    await startQuizAndWait();
    for (let i = 0; i < 14; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      fireEvent.click(screen.getByText('Next →'));
    }
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See Results')).toBeTruthy();
  });
});

// ── Completion / XP award ─────────────────────────────────────────────────────

describe('BojeGame — completion + award guard', () => {
  it('shows Colors Quiz Complete! after all questions answered', async () => {
    const { container } = render(<BojeGame award={vi.fn()} goBack={vi.fn()} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    expect(screen.getByText('Colors Quiz Complete!')).toBeTruthy();
  });

  it('shows score 15 / 15 on done screen', async () => {
    const { container } = render(<BojeGame award={vi.fn()} goBack={vi.fn()} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    expect(screen.getByText(/15 \/ 15/)).toBeTruthy();
  });

  it('award(5) called 15 times (once per correct answer)', async () => {
    const award = vi.fn();
    const { container } = render(<BojeGame award={award} goBack={vi.fn()} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    expect(award.mock.calls.filter(c => c[0] === 5).length).toBe(15);
  });

  it('award(bjSc * 2) fired on See Results (15 correct → award(30))', async () => {
    const award = vi.fn();
    const { container } = render(<BojeGame award={award} goBack={vi.fn()} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    expect(award).toHaveBeenCalledWith(30);
  });

  it('🏠 Done does NOT call award — only goBack', async () => {
    const award = vi.fn();
    const goBack = vi.fn();
    const { container } = render(<BojeGame award={award} goBack={goBack} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    const callsBefore = award.mock.calls.length;
    const doneBtn = screen.queryByText('🏠 Done');
    if (doneBtn) fireEvent.click(doneBtn);
    expect(award.mock.calls.length).toBe(callsBefore);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('BojeGame — navigation', () => {
  it('goBack is called when 🏠 Done is clicked on results screen', async () => {
    const goBack = vi.fn();
    await completeQuizAndClickDone(vi.fn(), goBack);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('📖 Review returns to learn mode from results screen', async () => {
    const { container } = render(<BojeGame award={vi.fn()} goBack={vi.fn()} />);
    await startQuizAndWait();
    for (let i = 0; i < 15; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextText = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextText) fireEvent.click(nextText);
    }
    fireEvent.click(screen.getByText('📖 Review'));
    expect(screen.getByText(/How Colors Change by Gender/)).toBeTruthy();
  });
});
