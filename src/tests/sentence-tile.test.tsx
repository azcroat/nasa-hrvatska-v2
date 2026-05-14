/**
 * sentence-tile.test.tsx — Behavioral tests for the SentenceTileScreen component.
 *
 * Critical behaviors tested:
 *   - Tile tap moves word to tray; Clear returns all tiles to bank
 *   - Correct order → "Next →" (no wrong indicator)
 *   - Partial order → "Correct:" wrong indicator shown
 *   - award(score*4+5, true) called when "🏆 See Results" clicked on final question
 *   - markQuest('grammar') called on completion
 *   - goBack called when "✓ Done" clicked in done screen
 *
 * Shuffle is made deterministic by mocking Math.random → 0 for the entire file.
 * With Math.random=0 and MOCK_SENTBUILD = [Zdravo!, Ja-idem.]:
 *   questions[0] = { en: 'I go.', hr: 'Ja idem.' }  — bank rendered ["idem","Ja"]
 *   questions[1] = { en: 'Hello!', hr: 'Zdravo!' }  — bank rendered ["Zdravo"]
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
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

// ── lib mocks ─────────────────────────────────────────────────────────────────
vi.mock('../hooks/useHaptic', () => ({
  useHaptic: vi.fn(() => ({ correct: vi.fn(), wrong: vi.fn() })),
}));
vi.mock('../lib/soundSettings.js', () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
}));
vi.mock('../lib/knightSpeak.js', () => ({ knightSpeak: vi.fn() }));

// ── data mock — MOCK_SENTBUILD defined inside factory ─────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  // Two items: with Math.random=0, shuffle swaps them → Q0=Ja idem., Q1=Zdravo!
  const MOCK_SENTBUILD = [
    { en: 'Hello!', hr: 'Zdravo!', opts: [] }, // single tile "Zdravo" — ends up Q1
    { en: 'I go.', hr: 'Ja idem.', opts: [] }, // two tiles ["idem","Ja"] — ends up Q0
  ];
  return {
    ...actual,
    srMark: vi.fn(),
    sh: (arr: unknown[]) => [...arr],
    SENTBUILD: MOCK_SENTBUILD,
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

// ── StatsContext mock ─────────────────────────────────────────────────────────
const mockSetStats = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext.tsx', () => ({
  useStats: vi.fn(() => ({
    stats: { xp: 0, lc: 0, gc: 0, sp: 0, vs: [] as string[] },
    setStats: mockSetStats,
    writeDelta: mockWriteDelta,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import SentenceTileScreen from '../components/practice/SentenceTileScreen';

// ── Math.random pinned to 0 for deterministic Fisher-Yates shuffle ────────────
// shuffle([Q0=Zdravo!, Q1=Ja-idem.]):  i=1, j=0 → swap → [Ja-idem., Zdravo!]
// buildBank(Ja-idem.): tiles [{id:0,word:"Ja"},{id:1,word:"idem"}]
//   shuffle: i=1, j=0 → swap → [{id:1,word:"idem"},{id:0,word:"Ja"}]  (DOM order: idem, Ja)
// buildBank(Zdravo!): tiles [{id:0,word:"Zdravo"}] — single element, no swap
beforeAll(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterAll(() => {
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSentenceTile(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<SentenceTileScreen {...props} />);
  return { ...utils, props };
}

/**
 * Complete both questions correctly and reach the done screen.
 * Q0 (Ja idem.): click "Ja" then "idem" in correct order → score++
 * Q1 (Zdravo!): click "Zdravo" → score++
 * Clicking "🏆 See Results" triggers award + markQuest.
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  renderSentenceTile({ award });
  // Q0: "I go." — need to click "Ja" first, then "idem" for correct word order
  fireEvent.click(screen.getByText('Ja'));
  fireEvent.click(screen.getByText('idem'));
  fireEvent.click(screen.getByText('Check →'));
  fireEvent.click(screen.getByText('Next →'));
  // Q1: "Hello!" — single tile "Zdravo"
  fireEvent.click(screen.getByText('Zdravo'));
  fireEvent.click(screen.getByText('Check →'));
  fireEvent.click(screen.getByText('🏆 See Results')); // ← award + markQuest called here
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('SentenceTileScreen — rendering', () => {
  it('renders without crashing', () => {
    renderSentenceTile();
  });

  it('shows the Sentence Assembly title', () => {
    renderSentenceTile();
    expect(screen.getByText('🧩 Sentence Assembly')).toBeTruthy();
  });

  it('shows the English prompt for the first question', () => {
    renderSentenceTile();
    // Q0 is "I go." — rendered as '"I go."' inside the prompt div
    expect(screen.getByText('"I go."')).toBeTruthy();
  });

  it('shows tile buttons in the bank for the first question', () => {
    renderSentenceTile();
    // Q0 tiles: "Ja" and "idem" in bank
    expect(screen.getByText('Ja')).toBeTruthy();
    expect(screen.getByText('idem')).toBeTruthy();
  });

  it('shows placeholder text before any tile is tapped', () => {
    renderSentenceTile();
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
  });

  it('shows progress bar', () => {
    renderSentenceTile();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Interaction mechanics ─────────────────────────────────────────────────────

describe('SentenceTileScreen — interaction', () => {
  it('clicking a bank tile removes the placeholder', () => {
    renderSentenceTile();
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
    fireEvent.click(screen.getByText('idem')); // first tile in bank
    expect(screen.queryByText('← Tap words to build sentence')).toBeNull();
  });

  it('Clear button resets tray back to bank', () => {
    renderSentenceTile();
    fireEvent.click(screen.getByText('idem'));
    // Placeholder gone after click
    expect(screen.queryByText('← Tap words to build sentence')).toBeNull();
    fireEvent.click(screen.getByText('🗑 Clear'));
    // Placeholder reappears
    expect(screen.getByText('← Tap words to build sentence')).toBeTruthy();
  });

  it('correct word order hides wrong indicator and shows Next →', () => {
    renderSentenceTile();
    // Correct order: "Ja" then "idem"
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('idem'));
    fireEvent.click(screen.getByText('Check →'));
    // No wrong indicator
    expect(screen.queryByText(/Correct:/)).toBeNull();
    // Next button appears
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('partial/wrong word order shows Correct: indicator with expected sentence', () => {
    renderSentenceTile();
    // Click only "Ja" (partial answer — missing "idem")
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('Check →'));
    // Wrong indicator shows the correct sentence
    expect(screen.getByText(/Correct:/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderSentenceTile();
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('idem'));
    fireEvent.click(screen.getByText('Check →'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows 🏆 See Results on the last question after answering', () => {
    renderSentenceTile();
    // Complete Q0 and advance to Q1
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('idem'));
    fireEvent.click(screen.getByText('Check →'));
    fireEvent.click(screen.getByText('Next →'));
    // Q1: Zdravo! — single tile, tap and check
    fireEvent.click(screen.getByText('Zdravo'));
    fireEvent.click(screen.getByText('Check →'));
    // Last question → See Results button
    expect(screen.getByText('🏆 See Results')).toBeTruthy();
  });
});

// ── Completion / XP award ─────────────────────────────────────────────────────

describe('SentenceTileScreen — completion + award', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after completing all questions', () => {
    completeAllQuestions();
    expect(screen.getByText('2 / 2 correct')).toBeTruthy();
  });

  it('shows ✓ Done button on the done screen', () => {
    completeAllQuestions();
    expect(screen.getByText('✓ Done')).toBeTruthy();
  });

  it('award() is called once when See Results is clicked', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 4 + 5 (2 correct → 13 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    // 2 correct × 4 + 5 = 13, plus true for "show celebratory banner" flag
    expect(award).toHaveBeenCalledWith(13, true, 'grammar');
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

describe('SentenceTileScreen — navigation', () => {
  it('✓ Done button calls goBack', () => {
    const goBack = vi.fn();
    renderSentenceTile({ goBack });
    // Complete both questions
    fireEvent.click(screen.getByText('Ja'));
    fireEvent.click(screen.getByText('idem'));
    fireEvent.click(screen.getByText('Check →'));
    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('Zdravo'));
    fireEvent.click(screen.getByText('Check →'));
    fireEvent.click(screen.getByText('🏆 See Results'));
    // Done screen — click ✓ Done
    fireEvent.click(screen.getByText('✓ Done'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
