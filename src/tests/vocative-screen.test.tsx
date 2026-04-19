/**
 * vocative-screen.test.tsx — Behavioral tests for VocativeScreen component.
 *
 * Critical behaviors tested:
 *   - Rules phase shown on initial render
 *   - "Practice with dialogues →" advances to dialogues phase
 *   - Dialogue navigation (Next example → / Start Quiz →)
 *   - Quiz: correct answer increments score
 *   - Done screen: award(score * 8) called, markQuest('grammar') called, goBack called
 *   - finishFired guard prevents double-award
 *
 * Shuffle: Math.random spy returning 0.99 makes local sh() identity
 * (j = Math.floor(0.99*(i+1)) = i → no swap).
 * VOCATIVE.quiz has 10 questions; sh([q.a, ...q.al]) keeps q.a first → opts[0] always correct.
 * 10/10 correct → xpEarned = 10*8 = 80 → award(80).
 * VOCATIVE.dialogues has 4 dialogues → click "Next example →" 3×, then "Start Quiz →".
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
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

// ── audio mock ────────────────────────────────────────────────────────────────
vi.mock('../lib/audio.js', () => ({
  speak: vi.fn(() => Promise.resolve()),
}));

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

// ── Math.random pinned to 0.99 — makes local sh() an identity function ────────
// j = Math.floor(0.99*(i+1)) = i for all i → swap arr[i] with arr[i] → no change
// sh([q.a, ...q.al]) keeps q.a first → clicking first .ob button is always correct
beforeAll(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
});
afterAll(() => {
  vi.restoreAllMocks();
});

import VocativeScreen from '../components/practice/VocativeScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderVocativeScreen(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<VocativeScreen {...props} />);
  return { ...utils, props };
}

/**
 * Advance through all 4 dialogue cards to reach the quiz phase.
 */
function advanceToQuiz() {
  renderVocativeScreen();
  // Rules → dialogues
  fireEvent.click(screen.getByText('Practice with dialogues →'));
  // 4 dialogues: d0→Next, d1→Next, d2→Next, d3→Start Quiz
  fireEvent.click(screen.getByText('Next example →')); // d0→d1
  fireEvent.click(screen.getByText('Next example →')); // d1→d2
  fireEvent.click(screen.getByText('Next example →')); // d2→d3
  fireEvent.click(screen.getByText('Start Quiz →'));    // d3→quiz
}

/**
 * Complete all 10 quiz questions by clicking first .ob button each time.
 * With Math.random=0.99, sh() is identity → opts[0] = q.a (correct) for all questions.
 * score=10, xpEarned=80, award(80).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const props = { goBack: vi.fn(), award };
  const { container } = render(<VocativeScreen {...props} />);
  // Rules → dialogues → quiz
  fireEvent.click(screen.getByText('Practice with dialogues →'));
  fireEvent.click(screen.getByText('Next example →'));
  fireEvent.click(screen.getByText('Next example →'));
  fireEvent.click(screen.getByText('Next example →'));
  fireEvent.click(screen.getByText('Start Quiz →'));
  // Answer all 10 quiz questions
  for (let i = 0; i < 10; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = screen.queryByText('Next →') ?? screen.queryByText('See results →');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award, goBack: props.goBack };
}

// ── Rendering — rules phase ───────────────────────────────────────────────────

describe('VocativeScreen — rules phase', () => {
  it('renders without crashing', () => {
    renderVocativeScreen();
  });

  it('shows the Vocative Case title', () => {
    renderVocativeScreen();
    expect(screen.getByText('📣 Vocative Case')).toBeTruthy();
  });

  it('shows intro text from VOCATIVE data', () => {
    renderVocativeScreen();
    // Use case-sensitive regex: "vocative case" (lowercase) only appears in the intro paragraph,
    // not in the h2 title "📣 Vocative Case" (capital V and C)
    expect(screen.getByText(/Croatian has a vocative case/)).toBeTruthy();
  });

  it('shows "Practice with dialogues →" button', () => {
    renderVocativeScreen();
    expect(screen.getByText('Practice with dialogues →')).toBeTruthy();
  });
});

// ── Dialogues phase ───────────────────────────────────────────────────────────

describe('VocativeScreen — dialogues phase', () => {
  it('advances to dialogues phase when button clicked', () => {
    renderVocativeScreen();
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    // Shows dialogue header and context
    expect(screen.getByText(/Dialogue 1 of/)).toBeTruthy();
  });

  it('shows correct Croatian form in dialogue', () => {
    renderVocativeScreen();
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    // VOCATIVE.dialogues[0].correct = "Petre, dođi!"
    expect(screen.getByText('Petre, dođi!')).toBeTruthy();
  });

  it('shows wrong form with ✗ marker', () => {
    renderVocativeScreen();
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    // VOCATIVE.dialogues[0].wrong = "Petar, dođi!"
    expect(screen.getByText('Petar, dođi!')).toBeTruthy();
  });

  it('shows "Next example →" on non-final dialogues', () => {
    renderVocativeScreen();
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    expect(screen.getByText('Next example →')).toBeTruthy();
  });

  it('shows "Start Quiz →" on the last dialogue', () => {
    renderVocativeScreen();
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    fireEvent.click(screen.getByText('Next example →')); // d1
    fireEvent.click(screen.getByText('Next example →')); // d2
    fireEvent.click(screen.getByText('Next example →')); // d3 (last)
    expect(screen.getByText('Start Quiz →')).toBeTruthy();
  });
});

// ── Quiz phase ────────────────────────────────────────────────────────────────

describe('VocativeScreen — quiz phase', () => {
  it('shows the first quiz question after "Start Quiz →"', () => {
    advanceToQuiz();
    // VOCATIVE.quiz[0].q with identity shuffle
    expect(screen.getByText("Calling your friend Marija — what form?")).toBeTruthy();
  });

  it('shows quiz progress bar', () => {
    advanceToQuiz();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('clicking correct answer shows ✓ checkmark on the button', () => {
    const { container } = render(<VocativeScreen goBack={vi.fn()} award={vi.fn()} />);
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Start Quiz →'));
    // First .ob = "Marijo!" (correct answer, opts[0] with identity shuffle)
    const optBtn = container.querySelector('button.ob');
    if (optBtn) fireEvent.click(optBtn);
    // Correct answer gets " ✓" appended
    expect(screen.getByText(/Marijo! ✓/)).toBeTruthy();
  });

  it('clicking wrong answer shows ✗ on the selected button', () => {
    advanceToQuiz();
    // VOCATIVE.quiz[0]: a="Marijo!", al=["Marija!","Marijam!","Marijeu!"]
    // With identity: opts = ["Marijo!","Marija!","Marijam!","Marijeu!"]
    // Click "Marija!" (wrong, at index 1)
    fireEvent.click(screen.getByText('Marija!'));
    expect(screen.getByText(/Marija! ✗/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    const { container } = render(<VocativeScreen goBack={vi.fn()} award={vi.fn()} />);
    fireEvent.click(screen.getByText('Practice with dialogues →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Next example →'));
    fireEvent.click(screen.getByText('Start Quiz →'));
    const optBtn = container.querySelector('button.ob');
    if (optBtn) fireEvent.click(optBtn);
    expect(screen.getByText('Next →')).toBeTruthy();
  });
});

// ── Done screen / award guard ─────────────────────────────────────────────────

describe('VocativeScreen — done screen + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    // Done screen: "✓ Vocative mastered" (all 10 correct → pct=100 ≥ 70)
    expect(screen.getByText('✓ Vocative mastered')).toBeTruthy();
  });

  it('shows XP earned on done screen (score * 8)', () => {
    completeAllQuestions();
    // 10 correct × 8 = 80 XP
    expect(screen.getByText('+80 XP')).toBeTruthy();
  });

  it('shows score / total on done screen', () => {
    completeAllQuestions();
    expect(screen.getByText('10 / 10')).toBeTruthy();
  });

  it('shows ✓ Done button when score ≥ 70%', () => {
    completeAllQuestions();
    expect(screen.getByText('✓ Done')).toBeTruthy();
  });

  it('award() is called exactly once when ✓ Done is clicked', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('✓ Done'));
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 8 (10 correct → 80 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('✓ Done'));
    expect(award).toHaveBeenCalledWith(80);
  });

  it('award() is NOT called again on rapid double-click (finishFired guard)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    const doneBtn = screen.getByText('✓ Done');
    fireEvent.click(doneBtn);
    fireEvent.click(doneBtn);
    fireEvent.click(doneBtn);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('markQuest("grammar") is called on completion', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('✓ Done'));
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    fireEvent.click(screen.getByText('✓ Done'));
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('VocativeScreen — navigation', () => {
  it('goBack is called when ✓ Done is clicked on completion screen', () => {
    const { award: _award, goBack } = completeAllQuestions();
    fireEvent.click(screen.getByText('✓ Done'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
