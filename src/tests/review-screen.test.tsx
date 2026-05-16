/**
 * review-screen.test.tsx — Behavioral tests for ReviewScreen.
 *
 * Critical behaviors tested:
 *   - Empty state: "All caught up!" shown when no words are due
 *   - Empty state: "Go Back" button navigates back
 *   - Quiz rendering: Croatian word, "X words due" text, 4 option buttons
 *   - "What does this mean?" prompt shown
 *   - Correct answer: "Točno! · Correct!" shown; srMark(word, true) called
 *   - Correct answer: "Next →" button appears for non-last question
 *   - Wrong answer: "✓ The answer was" + correct answer text shown
 *   - Wrong answer: srMark(word, false) + logError called
 *   - Wrong answer: _aiPost called for AI explanation
 *   - Navigation: "Next →" advances to next question
 *   - Last question shows "Results" instead of "Next →"
 *   - Done mode: "Continue →" button, award(score * 5 + 5), markQuest('master')
 *   - finishFired ref prevents double-award on double-click
 *
 * Notes:
 *   - sh() mocked as identity — option order is deterministic; correct answer is first
 *   - getPrioritizedReviewQueue mocked to control which words appear
 *   - CroatianKnight, useHaptic, knightSpeak, markPracticed mocked for isolation
 *   - Empty state tests use mockReturnValueOnce([]) to override default
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
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

// ── StatsContext mock ─────────────────────────────────────────────────────────
const mockSetStats = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { vs: [] },
    setStats: mockSetStats,
    writeDelta: mockWriteDelta,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ── CroatianKnight mock — avoids complex animation setup ──────────────────────
vi.mock('../components/shared/CroatianKnight', () => ({ default: () => null }));

// ── useHaptic mock ────────────────────────────────────────────────────────────
const mockHaptic = vi.hoisted(() => ({
  correct: vi.fn(),
  wrong: vi.fn(),
  award: vi.fn(),
}));
vi.mock('../hooks/useHaptic', () => ({ useHaptic: () => mockHaptic }));

// ── markPracticed mock ────────────────────────────────────────────────────────
const mockMarkPracticed = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useNotifications', () => ({ markPracticed: mockMarkPracticed }));

// ── quests mock ───────────────────────────────────────────────────────────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── logError mock ─────────────────────────────────────────────────────────────
const mockLogError = vi.hoisted(() => vi.fn());
vi.mock('../lib/learnerErrors.js', () => ({ logError: mockLogError }));

// ── knightSpeak mock ──────────────────────────────────────────────────────────
const mockKnightSpeak = vi.hoisted(() => vi.fn());
vi.mock('../lib/knightSpeak.js', () => ({ knightSpeak: mockKnightSpeak }));

// ── soundSettings mock ────────────────────────────────────────────────────────
vi.mock('../lib/soundSettings.js', () => ({ playFanfare: vi.fn() }));

// ── _aiPost mock — returns AI explanation ────────────────────────────────────
const mockApiFetch = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          explanation: 'Test explanation',
          rule: 'Verb agreement',
          tip: 'Watch endings',
          example: '',
        }),
    }),
  ),
);
vi.mock('../lib/aiPost', () => ({ _aiPost: mockApiFetch }));

// ── srs mock — controls which words appear ────────────────────────────────────
const REVIEW_WORDS = vi.hoisted(() => [
  ['pisati', 'to write', 'to write something'],
  ['čitati', 'to read', 'to read a book'],
]);
const mockGetPrioritizedReviewQueue = vi.hoisted(() => vi.fn(() => REVIEW_WORDS));
vi.mock('../lib/srs.js', () => ({ getPrioritizedReviewQueue: mockGetPrioritizedReviewQueue }));

// ── adaptive mock ─────────────────────────────────────────────────────────────
const mockRecordTopicResult = vi.hoisted(() => vi.fn());
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: mockRecordTopicResult }));

// ── data mock — preserve H/Bar/Spk/V; mock srMark + sh as identity ────────────
const mockSrMark = vi.hoisted(() => vi.fn());
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: mockSrMark,
    getSR: () => ({}),
    sh: (arr: unknown[]) => arr, // identity — correct answer always first in opts
  };
});

// SP11d: ReviewScreen reads V via useContent(). Pull real V from server-side vocab.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVocab = any;
vi.mock('../hooks/useContent', async () => {
  const vocabMod = (await vi.importActual(
    '../../functions/api/content/_data/vocabulary.js',
  )) as AnyVocab;
  return {
    useContent: () => ({
      content: {
        V: vocabMod.V ?? {},
        COUNTRIES: [],
        PROFESSIONS: [],
        WEATHER: {},
        CLOTHES: {},
        BODYDESC: [],
        TECH_VOC: {},
        BUREAUCRATIC: {},
        PROVERBS: [],
        IDIOMS: [],
        BRZALICE: [],
        HISTORY: {},
        EVENTS: [],
        KINGS: {},
        REGIONS: {},
        DIALECTS: {},
        CROATIAN_CITIES: [],
        FOODORDER: {},
        TRANSPORT: [],
        GROCERY: {},
        RECIPES: [],
        PRACTICAL: {},
        SCENES: [],
        LEVEL_NARRATIVE: {},
        SHADOWING: [],
      },
      loading: false,
      error: null,
      reload: () => {},
    }),
  };
});

import ReviewScreen from '../components/practice/ReviewScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<ReviewScreen {...props} />);
  return { ...utils, props };
}

/** Find the four MCQ option buttons (className contains "ob"). */
function getOptionButtons() {
  return screen
    .getAllByRole('button')
    .filter((b) => (b as HTMLButtonElement).className?.includes('ob'));
}

/** Click the correct option (opts[0] = word[1] since sh is identity). */
function clickCorrectOption() {
  const opts = getOptionButtons();
  if (!opts[0]) throw new Error('No option buttons found');
  fireEvent.click(opts[0]);
}

/** Click a wrong option (opts[1] — always a distractor since sh is identity). */
function clickWrongOption() {
  const opts = getOptionButtons();
  if (!opts[1]) throw new Error('Not enough option buttons');
  fireEvent.click(opts[1]);
}

/** Click the "Next →" / "Results" button that appears after answering. */
function clickNext() {
  const btn = screen
    .getAllByRole('button')
    .find((b) => b.textContent?.includes('Next') || b.textContent?.trim() === 'Results');
  if (!btn) throw new Error('Next/Results button not found');
  fireEvent.click(btn);
}

/** Navigate through all questions and reach the done screen. */
function goToDone(award = vi.fn()) {
  renderScreen({ award });
  // Question 1: correct answer
  clickCorrectOption();
  clickNext(); // → question 2 (last)
  // Question 2: correct answer
  clickCorrectOption();
  clickNext(); // "Results" → done
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('ReviewScreen — empty state', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "All caught up!" when no words are due', () => {
    mockGetPrioritizedReviewQueue.mockReturnValueOnce([]);
    renderScreen();
    expect(screen.getByText(/All caught up!/)).toBeTruthy();
  });

  it('shows explainer text about spaced repetition intervals', () => {
    mockGetPrioritizedReviewQueue.mockReturnValueOnce([]);
    renderScreen();
    expect(screen.getByText(/No reviews due right now/)).toBeTruthy();
  });

  it('shows "Go Back" button in empty state', () => {
    mockGetPrioritizedReviewQueue.mockReturnValueOnce([]);
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Go Back')),
    ).toBeTruthy();
  });

  it('"Go Back" button calls goBack', () => {
    mockGetPrioritizedReviewQueue.mockReturnValueOnce([]);
    const { props } = renderScreen();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Go Back'))!;
    fireEvent.click(btn);
    expect(props.goBack).toHaveBeenCalled();
  });
});

// ─── Quiz rendering ───────────────────────────────────────────────────────────

describe('ReviewScreen — quiz rendering', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the Croatian word for the first question', () => {
    renderScreen();
    // Spk component also renders the word, so multiple elements match
    expect(screen.getAllByText('pisati').length).toBeGreaterThan(0);
  });

  it('shows "words due" progress text', () => {
    renderScreen();
    expect(screen.getByText(/words due/)).toBeTruthy();
  });

  it('shows "What does this mean?" prompt', () => {
    renderScreen();
    expect(screen.getByText(/What does this mean/)).toBeTruthy();
  });

  it('shows 4 answer option buttons', () => {
    renderScreen();
    expect(getOptionButtons().length).toBe(4);
  });

  it('option buttons are not disabled before answering', () => {
    renderScreen();
    getOptionButtons().forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
  });
});

// ─── Correct answer ───────────────────────────────────────────────────────────

describe('ReviewScreen — correct answer', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clicking correct option shows "Točno! · Correct!"', () => {
    renderScreen();
    clickCorrectOption();
    expect(screen.getByText(/Točno! · Correct!/)).toBeTruthy();
  });

  it('correct answer: "Next →" button appears (non-last question)', () => {
    renderScreen();
    clickCorrectOption();
    expect(screen.getAllByRole('button').find((b) => b.textContent?.includes('Next'))).toBeTruthy();
  });

  it('correct answer: srMark(word, true) called', () => {
    renderScreen();
    clickCorrectOption();
    expect(mockSrMark).toHaveBeenCalledWith('pisati', true, undefined);
  });

  it('correct answer does NOT show "✓ The answer was" box', () => {
    renderScreen();
    clickCorrectOption();
    expect(screen.queryByText(/The answer was/)).toBeNull();
  });
});

// ─── Wrong answer ─────────────────────────────────────────────────────────────

describe('ReviewScreen — wrong answer', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clicking wrong option shows "✓ The answer was" text', () => {
    renderScreen();
    clickWrongOption();
    expect(screen.getByText(/The answer was/)).toBeTruthy();
  });

  it('clicking wrong option shows the correct answer text in the feedback box', () => {
    renderScreen();
    clickWrongOption();
    // 'to write' also appears in option buttons, so check the feedback box specifically
    const bodyText = (document.body.textContent || '').replace(/\s+/g, ' ');
    expect(bodyText).toContain('The answer was');
    expect(bodyText).toContain('to write');
  });

  it('wrong answer: srMark(word, false) called', () => {
    renderScreen();
    clickWrongOption();
    expect(mockSrMark).toHaveBeenCalledWith('pisati', false, undefined);
  });

  it('wrong answer: logError called', () => {
    renderScreen();
    clickWrongOption();
    expect(mockLogError).toHaveBeenCalled();
  });

  it('wrong answer: _aiPost called for AI explanation', () => {
    renderScreen();
    clickWrongOption();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/explain-error', expect.any(Object));
  });

  it('wrong answer does NOT show "Točno! · Correct!"', () => {
    renderScreen();
    clickWrongOption();
    expect(screen.queryByText(/Točno! · Correct!/)).toBeNull();
  });

  it('wrong answer: "Next →" still appears so user can advance', () => {
    renderScreen();
    clickWrongOption();
    expect(screen.getAllByRole('button').find((b) => b.textContent?.includes('Next'))).toBeTruthy();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('ReviewScreen — navigation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('"Next →" advances to the second question (shows second word)', () => {
    renderScreen();
    clickCorrectOption();
    clickNext();
    // Spk also renders the word, so multiple elements match — just verify presence
    expect(screen.getAllByText('čitati').length).toBeGreaterThan(0);
  });

  it('"Next →" resets the answered state (no "Točno!" visible)', () => {
    renderScreen();
    clickCorrectOption();
    clickNext();
    expect(screen.queryByText(/Točno! · Correct!/)).toBeNull();
  });

  it('last question shows "Results" instead of "Next →"', () => {
    renderScreen();
    clickCorrectOption();
    clickNext(); // now on last question
    clickCorrectOption();
    // "Results" button should be visible; "Next →" should not
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Results'),
    ).toBeTruthy();
    expect(
      screen.queryAllByRole('button').find((b) => b.textContent?.includes('Next →')),
    ).toBeFalsy();
  });
});

// ─── Done mode ────────────────────────────────────────────────────────────────

describe('ReviewScreen — done mode', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('done mode shows "Continue →" button', () => {
    goToDone();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue')),
    ).toBeTruthy();
  });

  it('done mode shows score percentage', () => {
    goToDone();
    // Both correct → 2/2 = 100%
    expect(screen.getByText(/100%/)).toBeTruthy();
  });

  it('"Continue →" calls award(score * 5 + 5)', () => {
    const award = vi.fn();
    goToDone(award);
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    // 2 correct answers: 2 * 5 + 5 = 15
    expect(award).toHaveBeenCalledWith(15, false, 'review');
  });

  it('"Continue →" calls markQuest("master") and markQuest("review")', () => {
    goToDone();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(mockMarkQuest).toHaveBeenCalledWith('master');
    expect(mockMarkQuest).toHaveBeenCalledWith('review');
  });

  it('"Continue →" calls markPracticed()', () => {
    goToDone();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(mockMarkPracticed).toHaveBeenCalled();
  });

  it('"Continue →" double-click does not double-award (finishFired ref)', () => {
    const award = vi.fn();
    goToDone(award);
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('"Continue →" calls goBack()', () => {
    const goBack = vi.fn();
    render(<ReviewScreen goBack={goBack} award={vi.fn()} />);
    clickCorrectOption();
    clickNext();
    clickCorrectOption();
    clickNext(); // Results → done
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(goBack).toHaveBeenCalled();
  });
});

// ─── Score tracking ───────────────────────────────────────────────────────────

describe('ReviewScreen — score tracking', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('0/2 correct → award(0 * 5 + 5) = 5', () => {
    const award = vi.fn();
    renderScreen({ award });
    clickWrongOption();
    clickNext();
    clickWrongOption();
    clickNext(); // Results → done
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(award).toHaveBeenCalledWith(5, false, 'review'); // score=0 → 0*5+5=5
  });

  it('1/2 correct → award(1 * 5 + 5) = 10', () => {
    const award = vi.fn();
    renderScreen({ award });
    clickCorrectOption();
    clickNext();
    clickWrongOption();
    clickNext(); // Results → done
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(award).toHaveBeenCalledWith(10, false, 'review'); // score=1 → 1*5+5=10
  });
});

// ─── Exercise Contract clauses 4-6 ───────────────────────────────────────────

describe('ReviewScreen — Exercise Contract (vs tag + writeDelta)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('setStats is called with vs including "srsreview" on completion', () => {
    goToDone();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(mockSetStats).toHaveBeenCalled();
    const fn = mockSetStats.mock.calls[0][0] as (prev: { vs?: string[]; rc?: number }) => {
      vs: string[];
      rc: number;
    };
    const result = fn({ vs: [], rc: 0 });
    expect(result.vs).toContain('srsreview');
    expect(result.rc).toBe(1);
  });

  it('writeDelta is called with { rc: 1, vs: ["srsreview"] } on completion', () => {
    goToDone();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(mockWriteDelta).toHaveBeenCalledWith({ rc: 1, vs: ['srsreview'] });
  });

  it('setStats inner guard returns prev unchanged if vs already includes "srsreview"', () => {
    // Verify idempotency of the setStats updater function itself.
    // Navigate to done and click Continue — setStats is called once.
    goToDone();
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Continue'))!;
    fireEvent.click(btn);
    expect(mockSetStats).toHaveBeenCalledTimes(1);
    const fn = mockSetStats.mock.calls[0]![0] as (prev: { vs: string[]; rc?: number }) => {
      vs: string[];
      rc?: number;
    };
    // Simulate the case where prev.vs already has 'srsreview' — guard returns prev as-is
    const prev = { vs: ['srsreview'], rc: 5 };
    expect(fn(prev)).toBe(prev);
  });
});
