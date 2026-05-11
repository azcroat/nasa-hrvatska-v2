/**
 * cefr-test.test.tsx — Behavioral tests for the CefrTest component.
 *
 * Critical behaviors tested:
 *   - Level select screen shows 4 CEFR level buttons
 *   - Clicking A1 shows the first A1 question
 *   - Correct answer shows "✅ Correct!" feedback + tip
 *   - Wrong answer shows red styling + tip
 *   - award(finalScore * 7) called on completion
 *   - markQuest('grammar') called on completion
 *   - "Try Another Level" returns to level select
 *
 * Note: CefrTest has no goBack prop — it manages its own internal navigation.
 * Shuffle is deterministic: rnd() → 0.99 makes shLocal() identity.
 * All A1 questions have answer:0, so opts[0] is always correct after identity shuffle.
 * 15 A1 questions all correct → award(15 * 7) = award(105).
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

import CefrTest from '../components/practice/CefrTest';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderCefrTest(overrides = {}) {
  const props = { award: vi.fn(), ...overrides };
  const utils = render(<CefrTest {...props} />);
  return { ...utils, props };
}

function startA1Level() {
  renderCefrTest();
  fireEvent.click(screen.getByText('A1 — Beginner'));
}

/**
 * Complete all 15 A1 questions by clicking the first option button each time.
 * With rnd=0.99, all options stay in original order (answer:0 for all A1 questions).
 * Clicks "See Results →" on the last question.
 * award(15 * 7) = award(105).
 */
function completeA1(award: ReturnType<typeof vi.fn> = vi.fn()) {
  renderCefrTest({ award });
  fireEvent.click(screen.getByText('A1 — Beginner'));
  for (let i = 0; i < 15; i++) {
    // Click first option button (always correct with identity shuffle + answer:0)
    const opts = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          !b.textContent?.includes('Change level') &&
          !b.textContent?.includes('Next') &&
          !b.textContent?.includes('See Results') &&
          !b.textContent?.includes('Try Another'),
      );
    fireEvent.click(opts[0]);
    const nextBtn = screen.queryByText('Next Question →') ?? screen.queryByText('See Results →');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering — level select screen ──────────────────────────────────────────

describe('CefrTest — level select', () => {
  it('renders the level select screen', () => {
    renderCefrTest();
    expect(screen.getByText('🎓 CEFR Assessment')).toBeTruthy();
  });

  it('shows all 4 level buttons', () => {
    renderCefrTest();
    expect(screen.getByText('A1 — Beginner')).toBeTruthy();
    expect(screen.getByText('A2 — Elementary')).toBeTruthy();
    expect(screen.getByText('B1 — Intermediate')).toBeTruthy();
    expect(screen.getByText('B2 — Upper Intermediate')).toBeTruthy();
  });

  it('shows question count for A1 level', () => {
    renderCefrTest();
    // All 4 CEFR levels each have 15 questions — verify the count label renders for each
    expect(screen.getAllByText('15 questions').length).toBe(4);
  });
});

// ── Rendering — test screen ───────────────────────────────────────────────────

describe('CefrTest — test screen', () => {
  it('shows the first A1 question after clicking A1', () => {
    startA1Level();
    // A1.questions[0].q with identity shuffle
    expect(screen.getByText("What does 'hvala' mean?")).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    startA1Level();
    // Options: Thank you, Hello, Goodbye, Please
    expect(screen.getByText('Thank you')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('Goodbye')).toBeTruthy();
    expect(screen.getByText('Please')).toBeTruthy();
  });

  it('shows progress bar', () => {
    startA1Level();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows a ← Change level link', () => {
    startA1Level();
    expect(screen.getByText('← Change level')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('CefrTest — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    startA1Level();
    // A1[0] answer=0 → opts[0]="Thank you" is correct
    fireEvent.click(screen.getByText('Thank you'));
    expect(screen.getByText('✅ Correct!')).toBeTruthy();
  });

  it('correct answer shows grammar tip', () => {
    startA1Level();
    fireEvent.click(screen.getByText('Thank you'));
    // A1[0].tip mentions 'Hvala'
    expect(screen.getByText(/Hvala/)).toBeTruthy();
  });

  it('wrong answer shows 💡 Grammar tip: heading', () => {
    startA1Level();
    // "Hello" is wrong for "What does 'hvala' mean?"
    fireEvent.click(screen.getByText('Hello'));
    expect(screen.getByText('💡 Grammar tip:')).toBeTruthy();
  });

  it('shows Next Question → after answering a non-final question', () => {
    startA1Level();
    fireEvent.click(screen.getByText('Thank you'));
    expect(screen.getByText('Next Question →')).toBeTruthy();
  });

  it('options are locked after answering — disabled attribute set', () => {
    startA1Level();
    // CefrTest option buttons render as <button><span>A</span><span>Thank you</span></button>
    // so textContent = "AThank you" — use includes() not exact equality
    const opts = screen
      .getAllByRole('button')
      .filter((b) =>
        ['Thank you', 'Hello', 'Goodbye', 'Please'].some((text) => b.textContent?.includes(text)),
      );
    expect(opts.length).toBe(4);
    fireEvent.click(opts[0]);
    // After answering, all option buttons should be disabled
    opts.forEach((btn) => expect((btn as HTMLButtonElement).disabled).toBe(true));
  });

  it('shows See Results → on the last question after answering', () => {
    renderCefrTest();
    fireEvent.click(screen.getByText('A1 — Beginner'));
    for (let i = 0; i < 14; i++) {
      const opts = screen
        .getAllByRole('button')
        .filter(
          (b) =>
            !b.textContent?.includes('Change level') &&
            !b.textContent?.includes('Next') &&
            !b.textContent?.includes('See Results') &&
            !b.textContent?.includes('Try Another'),
        );
      fireEvent.click(opts[0]);
      fireEvent.click(screen.getByText('Next Question →'));
    }
    // Last question (idx=14)
    const opts = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          !b.textContent?.includes('Change level') &&
          !b.textContent?.includes('See Results') &&
          !b.textContent?.includes('Try Another'),
      );
    fireEvent.click(opts[0]);
    expect(screen.getByText('See Results →')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('CefrTest — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows results screen after all A1 questions answered', () => {
    completeA1();
    // Results screen shows score / total
    expect(screen.getByText(/15/)).toBeTruthy();
    expect(screen.getByText('Try Another Level')).toBeTruthy();
  });

  it('shows percentage correct on results screen', () => {
    completeA1();
    expect(screen.getByText('100% correct')).toBeTruthy();
  });

  it('award() is called exactly once on completion', () => {
    const award = vi.fn();
    completeA1(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = finalScore * 7 (15 correct → 105 XP)', () => {
    const award = vi.fn();
    completeA1(award);
    expect(award).toHaveBeenCalledWith(105, false, 'default');
  });

  it('markQuest("grammar") is called on completion', () => {
    completeA1();
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once', () => {
    completeA1();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('CefrTest — navigation', () => {
  it('← Change level link returns to level select', () => {
    startA1Level();
    fireEvent.click(screen.getByText('← Change level'));
    // Back to level select — all 4 level buttons visible again
    expect(screen.getByText('A1 — Beginner')).toBeTruthy();
    expect(screen.getByText('B2 — Upper Intermediate')).toBeTruthy();
  });

  it('Try Another Level button returns to level select after completion', () => {
    completeA1();
    fireEvent.click(screen.getByText('Try Another Level'));
    expect(screen.getByText('A1 — Beginner')).toBeTruthy();
  });
});
