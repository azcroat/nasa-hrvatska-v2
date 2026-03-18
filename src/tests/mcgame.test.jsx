/**
 * mcgame.test.jsx
 *
 * Tests the Multiple Choice game component — specifically the bugs that caused
 * silent XP farming and double-award on rapid button tapping:
 *   - resultFired guard prevents award() being called more than once
 *   - Score increments only on correct answers
 *   - Streak resets on wrong answer
 *   - onComplete receives correct final score
 *   - goBack is callable without crashing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Firebase mock (required by data.jsx import chain) ─────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
}));

vi.mock('../data.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, srMark: vi.fn() };
});

import McGame from '../components/practice/McGame.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeQuestions(n = 3) {
  return Array.from({ length: n }, (_, i) => ({
    hr: `word${i}`,
    correct: `answer${i}`,
    opts: [`answer${i}`, `wrong${i}a`, `wrong${i}b`, `wrong${i}c`],
  }));
}

function renderGame(overrides = {}) {
  const props = {
    questions: makeQuestions(3),
    onComplete: vi.fn(),
    goBack: vi.fn(),
    award: vi.fn(),
    ...overrides,
  };
  const utils = render(<McGame {...props} />);
  return { ...utils, props };
}

// Answer the current question (correct or wrong)
function answerCurrent(correct = true, questionIndex = 0) {
  const questions = makeQuestions(3);
  const target = correct
    ? questions[questionIndex].correct
    : questions[questionIndex].opts[1]; // first wrong option
  fireEvent.click(screen.getByText(target));
}

// ── Rendering ─────────────────────────────────────────────────────────────────
describe('McGame — rendering', () => {
  it('renders without crashing', () => {
    renderGame();
  });

  it('shows the first Croatian word', () => {
    renderGame();
    expect(screen.getByText('word0')).toBeTruthy();
  });

  it('shows question counter "Question 1 of 3"', () => {
    renderGame();
    expect(screen.getByText(/Question 1 of 3/i)).toBeTruthy();
  });

  it('renders all 4 answer options', () => {
    renderGame();
    expect(screen.getByText('answer0')).toBeTruthy();
    expect(screen.getByText('wrong0a')).toBeTruthy();
    expect(screen.getByText('wrong0b')).toBeTruthy();
    expect(screen.getByText('wrong0c')).toBeTruthy();
  });

  it('does not show Next button before answering', () => {
    renderGame();
    expect(screen.queryByText(/Next/i)).toBeNull();
  });

  it('returns null when questions array is empty', () => {
    const { container } = render(
      <McGame questions={[]} onComplete={vi.fn()} goBack={vi.fn()} award={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────
describe('McGame — answer mechanics', () => {
  it('shows Next button after answering', () => {
    renderGame();
    answerCurrent(true);
    expect(screen.getByText(/Next/i)).toBeTruthy();
  });

  it('correct answer shows score incremented', () => {
    renderGame();
    answerCurrent(true);
    expect(screen.getByText(/1 correct/i)).toBeTruthy();
  });

  it('wrong answer does not increment score', () => {
    renderGame();
    answerCurrent(false);
    expect(screen.getByText(/0 correct/i)).toBeTruthy();
  });

  it('clicking an option twice does not double-count', () => {
    renderGame();
    const correctBtn = screen.getByText('answer0');
    fireEvent.click(correctBtn);
    fireEvent.click(correctBtn); // second click should be ignored
    expect(screen.getByText(/1 correct/i)).toBeTruthy();
  });

  it('advances to next question after clicking Next', () => {
    renderGame();
    answerCurrent(true);
    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByText('word1')).toBeTruthy();
    expect(screen.getByText(/Question 2 of 3/i)).toBeTruthy();
  });
});

// ── XP double-award guard (the bug that burned us) ────────────────────────────
describe('McGame — XP double-award prevention', () => {
  it('award() is called exactly once when See Results is clicked', () => {
    const questions = makeQuestions(1);
    const award = vi.fn();
    const onComplete = vi.fn();
    render(<McGame questions={questions} onComplete={onComplete} goBack={vi.fn()} award={award} />);

    // Answer the only question
    fireEvent.click(screen.getByText('answer0'));
    // Click See Results
    const resultsBtn = screen.getByText(/See Results/i);
    fireEvent.click(resultsBtn);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() is NOT called a second time if See Results is clicked twice', () => {
    const questions = makeQuestions(1);
    const award = vi.fn();
    const onComplete = vi.fn();
    render(<McGame questions={questions} onComplete={onComplete} goBack={vi.fn()} award={award} />);

    fireEvent.click(screen.getByText('answer0'));
    const resultsBtn = screen.getByText(/See Results/i);
    fireEvent.click(resultsBtn);
    fireEvent.click(resultsBtn); // rapid second tap
    fireEvent.click(resultsBtn); // third tap
    // Must still be exactly 1 — the resultFired guard
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('onComplete() is called exactly once even on rapid clicks', () => {
    const questions = makeQuestions(1);
    const onComplete = vi.fn();
    render(<McGame questions={questions} onComplete={onComplete} goBack={vi.fn()} award={vi.fn()} />);

    fireEvent.click(screen.getByText('answer0'));
    const resultsBtn = screen.getByText(/See Results/i);
    fireEvent.click(resultsBtn);
    fireEvent.click(resultsBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('onComplete receives the correct final score', () => {
    const questions = makeQuestions(1);
    const onComplete = vi.fn();
    render(<McGame questions={questions} onComplete={onComplete} goBack={vi.fn()} award={vi.fn()} />);

    fireEvent.click(screen.getByText('answer0')); // correct answer
    fireEvent.click(screen.getByText(/See Results/i));
    // onComplete(questions, score)
    expect(onComplete).toHaveBeenCalledWith(questions, 1);
  });

  it('award receives XP including completion bonus', () => {
    const questions = makeQuestions(1);
    const award = vi.fn();
    render(<McGame questions={questions} onComplete={vi.fn()} goBack={vi.fn()} award={award} />);

    fireEvent.click(screen.getByText('answer0')); // correct — 3 XP
    fireEvent.click(screen.getByText(/See Results/i));
    // XP_PER_CORRECT(3) * 1 correct + XP_COMPLETION_BONUS(5) = 8
    expect(award).toHaveBeenCalledWith(8, true);
  });
});

// ── Streak ────────────────────────────────────────────────────────────────────
describe('McGame — streak', () => {
  it('streak badge appears after 2 consecutive correct answers', () => {
    const questions = makeQuestions(3);
    const { props } = renderGame({ questions });

    answerCurrent(true, 0);
    fireEvent.click(screen.getByText(/Next/i));
    answerCurrent(true, 1);
    // Streak >= 2 — badge should appear
    expect(screen.getByText('2')).toBeTruthy(); // streak count
  });

  it('streak resets to 0 after a wrong answer', () => {
    const questions = makeQuestions(3);
    renderGame({ questions });

    answerCurrent(true, 0);
    fireEvent.click(screen.getByText(/Next/i));
    answerCurrent(false, 1); // wrong
    // Streak badge should be gone (streak < 2)
    expect(screen.queryByText('🔥')).toBeNull();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────
describe('McGame — navigation', () => {
  it('goBack is called when × button is clicked', () => {
    const { props } = renderGame();
    fireEvent.click(screen.getByLabelText(/Go back/i));
    expect(props.goBack).toHaveBeenCalledTimes(1);
  });
});
