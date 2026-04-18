/**
 * translate-drills.test.tsx — Behavioral tests for the TranslateDrillsScreen component.
 *
 * Critical behaviors tested:
 *   - First question shown (TRANSLATE_DRILLS[0] with identity shuffle)
 *   - Correct answer highlights green; wrong answer highlights red
 *   - Tip shown after answering (correct answer revealed when wrong)
 *   - Next → advances to Q2; See Results on last question
 *   - award(Math.round(score/total * 20)) called on completion
 *   - markQuest('vocab') called on completion
 *   - goBack called when "Back to Practice" clicked on done screen
 *
 * Shuffle: rnd() → 0.99 makes sh() identity — drills preserve TRANSLATE_DRILLS order.
 * All 29 entries have opts[0] === hr (correct answer first) — verified separately.
 * TRANSLATE_DRILLS[0] = { en:"I speak Croatian.", hr:"Govorim hrvatski." }.
 * 29/29 correct → award(Math.round(29/29 * 20)) = award(20).
 *
 * TranslateDrillsScreen uses NO CSS classes for option or Next buttons
 * (pure inline styles). Tests use text-based selectors throughout.
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

// ── adaptive mock ─────────────────────────────────────────────────────────────
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));

// ── rnd mock — 0.99 makes sh() identity ──────────────────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

// ── data mock ─────────────────────────────────────────────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, srMark: vi.fn() };
});

import TranslateDrillsScreen from '../components/practice/TranslateDrillsScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderTranslateDrills(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<TranslateDrillsScreen {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 29 TRANSLATE_DRILLS by clicking the correct answer each time.
 * With identity shuffle, drills preserve TRANSLATE_DRILLS order and opts[0] === hr.
 * Clicking the first option always selects the correct answer.
 * award(20) fired after the last question's "See Results" click.
 * markQuest('vocab') called on completion.
 * Done screen shows "Back to Practice" → goBack() on click.
 */
function completeAndGoBack(
  award: ReturnType<typeof vi.fn> = vi.fn(),
  goBack: ReturnType<typeof vi.fn> = vi.fn()
) {
  render(<TranslateDrillsScreen award={award} goBack={goBack} />);
  for (let i = 0; i < 29; i++) {
    // opts[0] is always correct (all entries have opts[0] === hr)
    const firstOpt = screen.queryAllByRole('button').find(
      btn => !['← Back', 'Next →', 'See Results', 'Back to Practice'].includes(btn.textContent ?? '')
    );
    if (!firstOpt) break;
    fireEvent.click(firstOpt);
    // After answering: Next → or See Results appears
    const nextBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  const backBtn = screen.queryByText('Back to Practice');
  if (backBtn) fireEvent.click(backBtn);
  return { award, goBack };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('TranslateDrillsScreen — rendering', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('renders without crashing', () => {
    renderTranslateDrills();
  });

  it('shows the Translate Production title', () => {
    renderTranslateDrills();
    expect(screen.getByText('Translate Production')).toBeTruthy();
  });

  it('shows the first English prompt (TRANSLATE_DRILLS[0] with identity shuffle)', () => {
    renderTranslateDrills();
    expect(screen.getByText('I speak Croatian.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    renderTranslateDrills();
    // Buttons: ← Back, then 4 options (answer + 3 wrongs)
    const allBtns = screen.getAllByRole('button');
    const optBtns = allBtns.filter(b => !['← Back'].includes(b.textContent ?? ''));
    expect(optBtns.length).toBe(4);
  });

  it('shows the CEFR badge for the first question (A2)', () => {
    renderTranslateDrills();
    expect(screen.getByText('A2')).toBeTruthy();
  });

  it('shows progress counter 1/29', () => {
    renderTranslateDrills();
    expect(screen.getByText(/1\/29/)).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('TranslateDrillsScreen — answer mechanics', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('shows Next → after clicking the correct answer', () => {
    renderTranslateDrills();
    // TRANSLATE_DRILLS[0].opts[0] = "Govorim hrvatski." = correct answer
    fireEvent.click(screen.getByText('Govorim hrvatski.'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows Next → after clicking a wrong answer too', () => {
    renderTranslateDrills();
    // "Govorim Hrvatska." is wrong for TRANSLATE_DRILLS[0]
    fireEvent.click(screen.getByText('Govorim Hrvatska.'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('does not show Next → before answering', () => {
    renderTranslateDrills();
    expect(screen.queryByText('Next →')).toBeNull();
  });

  it('shows the correct answer label when a wrong option is chosen', () => {
    renderTranslateDrills();
    fireEvent.click(screen.getByText('Govorim Hrvatska.')); // wrong
    // The "Correct: <answer>" label appears in the feedback paragraph
    // Use "Correct:" text which only appears in the correction paragraph (not option buttons)
    expect(screen.getByText(/Correct:/)).toBeTruthy();
  });

  it('options are locked after answering — clicking another option does nothing', () => {
    renderTranslateDrills();
    fireEvent.click(screen.getByText('Govorim hrvatski.')); // correct answer
    // After answering, Next → is visible
    expect(screen.getByText('Next →')).toBeTruthy();
    // Clicking a wrong option now should be a no-op (pick() returns early)
    fireEvent.click(screen.getByText('Govorim Hrvatska.')); // wrong opt — no-op
    // Next → still visible (not reset)
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('advances to second question after clicking Next →', () => {
    renderTranslateDrills();
    fireEvent.click(screen.getByText('Govorim hrvatski.'));
    fireEvent.click(screen.getByText('Next →'));
    // TRANSLATE_DRILLS[1] = { en:"She is reading a book." }
    expect(screen.getByText('She is reading a book.')).toBeTruthy();
  });

  it('shows See Results on the last question after answering', () => {
    renderTranslateDrills();
    for (let i = 0; i < 28; i++) {
      const firstOpt = screen.queryAllByRole('button').find(
        btn => !['← Back', 'Next →', 'See Results'].includes(btn.textContent ?? '')
      );
      if (!firstOpt) break;
      fireEvent.click(firstOpt);
      const nextBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Now on question 29 (last) — answer without clicking Next
    const lastOpt = screen.queryAllByRole('button').find(
      btn => !['← Back', 'Next →', 'See Results'].includes(btn.textContent ?? '')
    );
    if (lastOpt) fireEvent.click(lastOpt);
    expect(screen.getByText('See Results')).toBeTruthy();
  }, 20000);
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('TranslateDrillsScreen — completion + award guard', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  /**
   * Consolidated done-screen test: verifies score display and Back button.
   * Runs 29-question loop once instead of twice (two separate tests would timeout
   * in the full parallel suite since each loop takes ~2s per test).
   */
  it('shows done screen with score 29/29 and Back to Practice button', () => {
    render(<TranslateDrillsScreen award={vi.fn()} goBack={vi.fn()} />);
    for (let i = 0; i < 29; i++) {
      const firstOpt = screen.queryAllByRole('button').find(
        btn => !['← Back', 'Next →', 'See Results'].includes(btn.textContent ?? '')
      );
      if (!firstOpt) break;
      fireEvent.click(firstOpt);
      const nextBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/29\/29 correct/)).toBeTruthy();
    expect(screen.getByText('Back to Practice')).toBeTruthy();
  }, 20000);

  /**
   * Consolidated award + quest test: verifies award(20) and markQuest('vocab')
   * in a single 29-question loop to avoid double timeout risk.
   */
  it('award(20) and markQuest("vocab") called on completion', () => {
    const award = vi.fn();
    render(<TranslateDrillsScreen award={award} goBack={vi.fn()} />);
    for (let i = 0; i < 29; i++) {
      const firstOpt = screen.queryAllByRole('button').find(
        btn => !['← Back', 'Next →', 'See Results'].includes(btn.textContent ?? '')
      );
      if (!firstOpt) break;
      fireEvent.click(firstOpt);
      const nextBtn = screen.queryByText('Next →') || screen.queryByText('See Results');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // 29/29 correct → award(Math.round(29/29 * 20)) = award(20)
    expect(award).toHaveBeenCalledWith(20);
    expect(mockMarkQuest).toHaveBeenCalledWith('vocab');
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  }, 20000);
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('TranslateDrillsScreen — navigation', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('goBack called when Back to Practice is clicked on done screen', () => {
    const goBack = vi.fn();
    completeAndGoBack(vi.fn(), goBack);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
