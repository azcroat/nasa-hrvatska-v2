/**
 * shadowing-screen.test.tsx — Behavioral tests for ShadowingScreen.
 *
 * Critical behaviors tested:
 *   - First item's hr text and en text shown on screen
 *   - Item tip shown in info box
 *   - "🎤 I Said It!" button available initially (fallback, no mic in jsdom)
 *   - Clicking "🎤 I Said It!" → said=true → "✓ Keep going — repetition builds fluency!" shown
 *   - After said: "Next →" shown on non-last item
 *   - After said: "🔁 Say Again" shown
 *   - "🔁 Say Again" resets to initial state (shows "I Said It!" again)
 *   - "Next →" advances to next item (shows item 2's hr text)
 *   - On last item, after said: "Finish" instead of "Next →"
 *   - "Finish" button (in said state) → done mode "Session Complete!"
 *   - Done mode: award(items.length * 3 + 5) called, markQuest('speak') called
 *   - "🐢 Listen Slow" → speakSlow(item.hr) called
 *   - "Listen Slow" increments plays counter (shows "Listened 1 time")
 *   - finishFired ref prevents double-award on double-click
 *
 * Mic note: jsdom has no navigator.mediaDevices — useRecorder keeps micAvailable=null
 * and recordingState='idle', so RecordingPanel renders "🎤 Record My Attempt" alongside
 * the fallback "🎤 I Said It!" button. Tests target the I Said It! button specifically.
 *
 * PronunciationScorer is mocked to null (uses Web Speech API unavailable in jsdom).
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

// ── PronunciationScorer mock — uses Web Speech API unavailable in jsdom ───────
vi.mock('../components/shared/PronunciationScorer', () => ({ default: () => null }));

// ── adaptive + quests mocks ───────────────────────────────────────────────────
const mockRecordTopicResult = vi.hoisted(() => vi.fn());
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: mockRecordTopicResult }));

const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── data mock: SHADOWING, speakSlow + keep H/Bar/Spk from real module ─────────
const mockSpeakSlow = vi.hoisted(() => vi.fn());

const MOCK_SHADOWING = vi.hoisted(() => [
  { hr: 'Dobar dan.', en: 'Good day.', tip: 'Focus on the melody of the greeting' },
  { hr: 'Hvala lijepa.', en: 'Thank you very much.', tip: 'Short phrase — great for beginners' },
]);

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, speakSlow: mockSpeakSlow, SHADOWING: MOCK_SHADOWING };
});

import ShadowingScreen from '../components/practice/ShadowingScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<ShadowingScreen {...props} />);
  return { ...utils, props };
}

function clickISaidIt() {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('I Said It'));
  if (!btn) throw new Error('I Said It! button not found');
  fireEvent.click(btn);
}

function clickNext() {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Next'));
  if (!btn) throw new Error('Next button not found');
  fireEvent.click(btn);
}

function clickFinish() {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Finish');
  if (!btn) throw new Error('Finish button not found');
  fireEvent.click(btn);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ShadowingScreen — initial rendering', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Shadowing Practice" heading', () => {
    renderScreen();
    expect(screen.getByText(/Shadowing Practice/)).toBeTruthy();
  });

  it('shows first item Croatian text', () => {
    renderScreen();
    expect(screen.getByText('Dobar dan.')).toBeTruthy();
  });

  it('shows first item English translation', () => {
    renderScreen();
    expect(screen.getByText('Good day.')).toBeTruthy();
  });

  it('shows first item tip in info box', () => {
    renderScreen();
    expect(screen.getByText(/Focus on the melody/)).toBeTruthy();
  });

  it('shows "🎤 I Said It!" fallback button initially', () => {
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('I Said It')),
    ).toBeTruthy();
  });

  it('does NOT show "Next →" before saying the phrase', () => {
    renderScreen();
    expect(
      screen.queryAllByRole('button').find((b) => b.textContent?.includes('Next')),
    ).toBeFalsy();
  });
});

// ─── Audio ────────────────────────────────────────────────────────────────────

describe('ShadowingScreen — audio', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('"🐢 Listen Slow" calls speakSlow with item.hr', () => {
    renderScreen();
    const slowBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Listen Slow'));
    if (!slowBtn) throw new Error('Listen Slow button not found');
    fireEvent.click(slowBtn);
    expect(mockSpeakSlow).toHaveBeenCalledWith('Dobar dan.');
  });

  it('"🐢 Listen Slow" shows plays counter after click', () => {
    renderScreen();
    const slowBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Listen Slow'))!;
    fireEvent.click(slowBtn);
    expect(screen.getByText(/Listened 1 time/)).toBeTruthy();
  });

  it('"🐢 Listen Slow" twice shows "2 times"', () => {
    renderScreen();
    const slowBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Listen Slow'))!;
    fireEvent.click(slowBtn);
    fireEvent.click(slowBtn);
    expect(screen.getByText(/Listened 2 times/)).toBeTruthy();
  });
});

// ─── I Said It! flow ──────────────────────────────────────────────────────────

describe('ShadowingScreen — "🎤 I Said It!" flow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clicking "I Said It!" shows keep-going message', () => {
    renderScreen();
    clickISaidIt();
    expect(screen.getByText(/Keep going — repetition builds fluency/)).toBeTruthy();
  });

  it('clicking "I Said It!" shows "Next →" button for non-last item', () => {
    renderScreen();
    clickISaidIt();
    expect(screen.getAllByRole('button').find((b) => b.textContent?.includes('Next'))).toBeTruthy();
  });

  it('clicking "I Said It!" shows "🔁 Say Again" button', () => {
    renderScreen();
    clickISaidIt();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Say Again')),
    ).toBeTruthy();
  });

  it('"🔁 Say Again" resets to initial state (shows "I Said It!" again)', () => {
    renderScreen();
    clickISaidIt();
    const sayAgainBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Say Again'))!;
    fireEvent.click(sayAgainBtn);
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('I Said It')),
    ).toBeTruthy();
  });

  it('"🔁 Say Again" hides keep-going message', () => {
    renderScreen();
    clickISaidIt();
    const sayAgainBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Say Again'))!;
    fireEvent.click(sayAgainBtn);
    expect(screen.queryByText(/Keep going/)).toBeNull();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('ShadowingScreen — navigation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('"Next →" shows second item Croatian text', () => {
    renderScreen();
    clickISaidIt();
    clickNext();
    expect(screen.getByText('Hvala lijepa.')).toBeTruthy();
  });

  it('"Next →" shows second item English text', () => {
    renderScreen();
    clickISaidIt();
    clickNext();
    expect(screen.getByText('Thank you very much.')).toBeTruthy();
  });

  it('"Next →" resets said state (shows "I Said It!" again)', () => {
    renderScreen();
    clickISaidIt();
    clickNext();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('I Said It')),
    ).toBeTruthy();
  });

  it('on last item, "I Said It!" shows "Finish" instead of "Next →"', () => {
    renderScreen();
    // Advance to item 2 (last)
    clickISaidIt();
    clickNext();
    // Now on item 2 (last)
    clickISaidIt();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Finish'),
    ).toBeTruthy();
    expect(
      screen.queryAllByRole('button').find((b) => b.textContent?.includes('Next')),
    ).toBeFalsy();
  });

  it('"Next →" calls recordTopicResult("speaking", true)', () => {
    renderScreen();
    clickISaidIt();
    clickNext();
    expect(mockRecordTopicResult).toHaveBeenCalledWith('speaking', true);
  });
});

// ─── Done mode ────────────────────────────────────────────────────────────────

describe('ShadowingScreen — done mode', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function goToDone() {
    renderScreen();
    clickISaidIt();
    clickNext(); // item 2 now shown
    clickISaidIt();
    clickFinish(); // "Finish" button in said state
  }

  it('done mode shows "Session Complete!"', () => {
    goToDone();
    expect(screen.getByText('Session Complete!')).toBeTruthy();
  });

  it('done mode shows number of sentences shadowed', () => {
    goToDone();
    expect(
      screen.getByText(new RegExp(`${MOCK_SHADOWING.length} Croatian sentences`)),
    ).toBeTruthy();
  });

  it('"Finish" button in done mode calls award(items.length * 3 + 5)', () => {
    const award = vi.fn();
    render(<ShadowingScreen goBack={vi.fn()} award={award} />);
    clickISaidIt();
    clickNext();
    clickISaidIt();
    clickFinish();
    // items.length=2: 2*3+5=11
    const finishBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.trim() === 'Finish')!;
    fireEvent.click(finishBtn);
    expect(award).toHaveBeenCalledWith(2 * 3 + 5, false, 'speaking');
  });

  it('"Finish" button in done mode calls markQuest("speak")', () => {
    const award = vi.fn();
    render(<ShadowingScreen goBack={vi.fn()} award={award} />);
    clickISaidIt();
    clickNext();
    clickISaidIt();
    clickFinish();
    const finishBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.trim() === 'Finish')!;
    fireEvent.click(finishBtn);
    expect(mockMarkQuest).toHaveBeenCalledWith('speak');
  });

  it('"Finish" button double-click does not double-award (finishFired ref)', () => {
    const award = vi.fn();
    render(<ShadowingScreen goBack={vi.fn()} award={award} />);
    clickISaidIt();
    clickNext();
    clickISaidIt();
    clickFinish();
    const finishBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.trim() === 'Finish')!;
    fireEvent.click(finishBtn);
    fireEvent.click(finishBtn);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('done mode shows "Retry" button', () => {
    goToDone();
    const finishBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.trim() === 'Finish')!;
    fireEvent.click(finishBtn);
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Retry')),
    ).toBeTruthy();
  });
});
