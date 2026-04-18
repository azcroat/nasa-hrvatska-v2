/**
 * mistakes-screen.test.tsx — Behavioral tests for MistakesScreen.
 *
 * Critical behaviors tested:
 *   - Empty state: "No Mistakes!" shown when getMistakes() returns []
 *   - List mode: "{N} Word(s) to Review" heading, confidence badge, list items
 *   - Confidence badge: Math.max(10, 100 - count * 12) — count=1 → 88%, count=8 → 10%
 *   - "🃏 Start Flashcard Review" enters review mode
 *   - Review mode: "Card 1 of N" subtitle via H(), Croatian word shown
 *   - FlipCard: both faces always in DOM (CSS backfaceVisibility not enforced in jsdom)
 *   - "✅ Got It!": clearMistake(hr) called, mastered incremented
 *   - "✅ Got It!" on last card: award(mastered*5, mastered>=3) + markQuest('master') + mode='done'
 *   - "📚 Study Again" on last card: mode='done' (without awarding mastered)
 *   - "← Back to List" in review → returns to list mode
 *   - Clear one: × button → clearMistake(hr) called
 *   - Clear All: confirm=false → nothing; confirm=true → clearAllMistakes() called
 *   - Done mode: "Session Complete!", "+{N} XP" shown
 *   - Audio: 🔊 button in list calls speak(hr); 🔊 in review FlipCard calls speak(hr)
 *
 * Shuffle note: MistakesScreen uses Math.random() (not rnd from random.js).
 * Single-item mistake arrays avoid any shuffle ordering concern.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ── data mock: override mistake helpers + speak; keep H from real module ──────
const mockGetMistakes = vi.hoisted(() => vi.fn());
const mockClearMistake = vi.hoisted(() => vi.fn());
const mockClearAllMistakes = vi.hoisted(() => vi.fn());
const mockSpeak = vi.hoisted(() => vi.fn());

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getMistakes: mockGetMistakes,
    clearMistake: mockClearMistake,
    clearAllMistakes: mockClearAllMistakes,
    speak: mockSpeak,
  };
});

import MistakesScreen from '../components/practice/MistakesScreen';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** count=1 → 88% ready, category=verb, has q */
const MISTAKE_A = { hr: 'pisati', en: 'to write', q: 'How do you say "write"?', category: 'verb', count: 1 };

/** count=5 → 40% ready, no q */
const MISTAKE_B = { hr: 'jesti', en: 'to eat', category: 'verb', count: 5 };

/** count=8 → clamped to 10% ready */
const MISTAKE_C = { hr: 'spavati', en: 'to sleep', count: 8 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<MistakesScreen {...props} />);
  return { ...utils, props };
}

function clickStartReview() {
  const btn = screen.getAllByRole('button').find(b => b.textContent?.includes('Start Flashcard Review'));
  if (!btn) throw new Error('Start Flashcard Review button not found');
  fireEvent.click(btn);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('MistakesScreen — empty state', () => {
  beforeEach(() => { mockGetMistakes.mockReturnValue([]); });
  afterEach(() => { vi.clearAllMocks(); });

  it('shows "No Mistakes!" heading', () => {
    renderScreen();
    expect(screen.getByText('No Mistakes!')).toBeTruthy();
  });

  it('does not show "Start Flashcard Review" button', () => {
    renderScreen();
    const btn = screen.queryAllByRole('button').find(b => b.textContent?.includes('Start Flashcard Review'));
    expect(btn).toBeFalsy();
  });

  it('shows back button', () => {
    renderScreen();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Back'))).toBeTruthy();
  });
});

// ─── List mode ────────────────────────────────────────────────────────────────

describe('MistakesScreen — list mode', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('shows "1 Word to Review" for a single mistake', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getByText(/1 Word to Review/)).toBeTruthy();
  });

  it('shows plural "2 Words to Review" for two mistakes', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_B, MISTAKE_A]);
    renderScreen();
    expect(screen.getByText(/2 Words to Review/)).toBeTruthy();
  });

  it('shows Croatian word in list', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getByText('pisati')).toBeTruthy();
  });

  it('shows English translation in list', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getByText('to write')).toBeTruthy();
  });

  it('shows "🃏 Start Flashcard Review" button', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Start Flashcard Review'))).toBeTruthy();
  });

  it('shows "Clear All" button', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Clear All'))).toBeTruthy();
  });
});

// ─── Confidence badge ─────────────────────────────────────────────────────────

describe('MistakesScreen — confidence badge', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('count=1 → "88% ready" badge', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    expect(screen.getByText(/88% ready/)).toBeTruthy();
  });

  it('count=5 → "40% ready" badge', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_B]);
    renderScreen();
    expect(screen.getByText(/40% ready/)).toBeTruthy();
  });

  it('count=8 → clamped "10% ready" badge', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_C]);
    renderScreen();
    expect(screen.getByText(/10% ready/)).toBeTruthy();
  });
});

// ─── Audio in list mode ───────────────────────────────────────────────────────

describe('MistakesScreen — audio', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('clicking 🔊 in list calls speak with mistake.hr', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    const audioBtn = screen.getAllByRole('button').find(
      b => b.getAttribute('aria-label')?.includes('pisati'),
    );
    if (!audioBtn) throw new Error('audio button not found');
    fireEvent.click(audioBtn);
    expect(mockSpeak).toHaveBeenCalledWith('pisati');
  });
});

// ─── Clear actions ────────────────────────────────────────────────────────────

describe('MistakesScreen — clear one (×)', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('clicking × calls clearMistake with the word\'s hr', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])  // useState init
      .mockReturnValue([]);              // after clearMistake re-fetch
    renderScreen();
    const removeBtn = screen.getByRole('button', { name: /Remove pisati/ });
    fireEvent.click(removeBtn);
    expect(mockClearMistake).toHaveBeenCalledWith('pisati');
  });
});

describe('MistakesScreen — Clear All', () => {
  afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it('confirm=false → clearAllMistakes NOT called', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderScreen();
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent?.includes('Clear All'))!);
    expect(mockClearAllMistakes).not.toHaveBeenCalled();
  });

  it('confirm=true → clearAllMistakes called', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderScreen();
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent?.includes('Clear All'))!);
    expect(mockClearAllMistakes).toHaveBeenCalled();
  });

  it('confirm=true → list clears (shows empty state)', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderScreen();
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent?.includes('Clear All'))!);
    expect(screen.getByText('No Mistakes!')).toBeTruthy();
  });
});

// ─── Review mode — entering ───────────────────────────────────────────────────

describe('MistakesScreen — review mode rendering', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('entering review shows "Review Mistakes" heading', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    expect(screen.getByText(/Review Mistakes/)).toBeTruthy();
  });

  it('entering review shows "Card 1 of 1" subtitle for single mistake', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    expect(screen.getByText(/Card 1 of 1/)).toBeTruthy();
  });

  it('review shows Croatian word from FlipCard front', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    // Both faces always in DOM (CSS backfaceVisibility not enforced in jsdom)
    expect(screen.getByText('pisati')).toBeTruthy();
  });

  it('review shows English translation (always in DOM on back face)', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    expect(screen.getByText('to write')).toBeTruthy();
  });

  it('review shows "Mastered: 0" initially', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    expect(screen.getByText(/Mastered: 0/)).toBeTruthy();
  });

  it('review shows "← Back to List" button', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Back to List'))).toBeTruthy();
  });
});

// ─── Review mode — Got It! ────────────────────────────────────────────────────

describe('MistakesScreen — "✅ Got It!" behavior', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('"✅ Got It!" calls clearMistake(hr)', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(mockClearMistake).toHaveBeenCalledWith('pisati');
  });

  it('"✅ Got It!" on last card calls award(5, false) (1 mastered, 1<3)', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    const award = vi.fn();
    renderScreen({ award });
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(award).toHaveBeenCalledWith(5, false);
  });

  it('"✅ Got It!" on last of 3 cards calls award(15, true) (3 mastered, 3>=3)', () => {
    const THREE = [MISTAKE_A, MISTAKE_B, MISTAKE_C];
    mockGetMistakes
      .mockReturnValueOnce(THREE)
      .mockReturnValue([]);
    const award = vi.fn();
    renderScreen({ award });
    clickStartReview();
    // Click Got It 3 times (deck is shuffled but buttons are always in DOM)
    fireEvent.click(screen.getAllByText(/✅ Got It!/)[0]);
    fireEvent.click(screen.getAllByText(/✅ Got It!/)[0]);
    fireEvent.click(screen.getAllByText(/✅ Got It!/)[0]);
    expect(award).toHaveBeenCalledWith(15, true);
  });

  it('"✅ Got It!" on last card calls markQuest("master")', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(mockMarkQuest).toHaveBeenCalledWith('master');
  });

  it('"✅ Got It!" on last card transitions to done mode', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(screen.getByText('Session Complete!')).toBeTruthy();
  });

  it('"✅ Got It!" on non-last card advances counter', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A, MISTAKE_B])
      .mockReturnValue([MISTAKE_B]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getAllByText(/✅ Got It!/)[0]);
    expect(screen.getByText(/Card 2 of 2/)).toBeTruthy();
  });
});

// ─── Review mode — Study Again ────────────────────────────────────────────────

describe('MistakesScreen — "📚 Study Again" behavior', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('"📚 Study Again" on last card transitions to done mode', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/📚 Study Again/));
    expect(screen.getByText('Session Complete!')).toBeTruthy();
  });

  it('"📚 Study Again" on non-last card advances counter', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A, MISTAKE_B])
      .mockReturnValue([MISTAKE_B]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getAllByText(/📚 Study Again/)[0]);
    expect(screen.getByText(/Card 2 of 2/)).toBeTruthy();
  });

  it('"📚 Study Again" does NOT call award', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    const award = vi.fn();
    renderScreen({ award });
    clickStartReview();
    fireEvent.click(screen.getByText(/📚 Study Again/));
    // mastered=0, so award(0*5, 0>=3) = award(0, false); but component guards: `if (award && newMastered > 0)`
    expect(award).not.toHaveBeenCalled();
  });
});

// ─── Review mode — back to list ───────────────────────────────────────────────

describe('MistakesScreen — back to list from review', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('"← Back to List" returns to list mode', () => {
    mockGetMistakes.mockReturnValue([MISTAKE_A]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent?.includes('Back to List'))!);
    // Back in list mode — "Start Flashcard Review" visible again
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Start Flashcard Review'))).toBeTruthy();
  });
});

// ─── Done mode ────────────────────────────────────────────────────────────────

describe('MistakesScreen — done mode', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('shows "Session Complete!" heading', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(screen.getByText('Session Complete!')).toBeTruthy();
  });

  it('shows "+5 XP" for 1 mastered word', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    expect(screen.getByText(/\+5 XP/)).toBeTruthy();
  });

  it('shows "You mastered 1 word" message', () => {
    mockGetMistakes
      .mockReturnValueOnce([MISTAKE_A])
      .mockReturnValue([]);
    renderScreen();
    clickStartReview();
    fireEvent.click(screen.getByText(/✅ Got It!/));
    // <p> contains mixed text/"1"/<strong> nodes — body textContent collapses cleanly
    const bodyText = (document.body.textContent || '').replace(/\s+/g, ' ');
    expect(bodyText).toContain('You mastered');
    expect(bodyText).toContain('1 word');
  });
});
