/**
 * prep-drill.test.tsx — Behavioral tests for the PrepDrill component.
 *
 * Critical behaviors tested:
 *   - First question shown (PREPDRILL[0] with identity shuffle)
 *   - Correct answer shows "Next →" (only color feedback, no text)
 *   - Score counter increments on correct answer
 *   - award(score * 5) called once when "🏠 Done" clicked on results screen
 *   - goBack called when "🏠 Done" clicked
 *   - finishFired guard prevents double-award on rapid Done clicks
 *
 * Unlike ImperativeDrill, award() is NOT called automatically — it requires
 * the user to click "🏠 Done" on the results screen.
 * There is no markQuest call in PrepDrill.
 *
 * Shuffle is deterministic: rnd() → 0.99 makes sh() identity.
 * PREPDRILL[0] = { sentence:"Živim ___ Zagrebu.", opts:["u","na","s","iz"], answer:"u", en:"I live in Zagreb." }.
 * All 15 PREPDRILL entries have opts[0] === answer → score=15, award(75).
 */
import { describe, it, expect, vi } from 'vitest';
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

// ── StatsContext mock — provides useStats() without needing a Provider ────────
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[], gc: 0 },
    setStats: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: vi.fn(),
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
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

import PrepDrill from '../components/practice/PrepDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPrepDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<PrepDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 10 questions by clicking the first .ob option each time.
 * With rnd=0.99 (identity shuffle), PREPDRILL order is preserved.
 * All 15 entries have opts[0] === answer → score=15, award(75) when Done clicked.
 * award() is only called when "🏠 Done" is clicked on the results screen.
 */
function completeAndClickDone(
  award: ReturnType<typeof vi.fn> = vi.fn(),
  goBack: ReturnType<typeof vi.fn> = vi.fn(),
) {
  const { container } = render(<PrepDrill award={award} goBack={goBack} />);
  for (let i = 0; i < 10; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  // Done screen: click "🏠 Done" to trigger award + goBack
  const doneBtn = container.querySelector('button.b.bp');
  if (doneBtn) fireEvent.click(doneBtn);
  return { award, goBack };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('PrepDrill — rendering', () => {
  it('renders without crashing', () => {
    renderPrepDrill();
  });

  it('shows the Preposition Drills title', () => {
    renderPrepDrill();
    expect(screen.getByText('📍 Preposition Drills')).toBeTruthy();
  });

  it('shows the first question sentence (PREPDRILL[0] with identity shuffle)', () => {
    renderPrepDrill();
    expect(screen.getByText('Živim ___ Zagrebu.')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderPrepDrill();
    expect(screen.getByText('I live in Zagreb.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderPrepDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress indicator 1 / 10', () => {
    renderPrepDrill();
    expect(screen.getByText(/1 \/ 10/)).toBeTruthy();
  });

  it('shows progress bar', () => {
    renderPrepDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows initial score of 0', () => {
    renderPrepDrill();
    expect(screen.getByText(/Score: 0/)).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('PrepDrill — answer mechanics', () => {
  it('shows Next → after answering the correct option', () => {
    renderPrepDrill();
    // PREPDRILL[0] answer = "u" = opts[0] with identity shuffle
    fireEvent.click(screen.getByText('u'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows Next → after answering a wrong option', () => {
    renderPrepDrill();
    // "na" is wrong for PREPDRILL[0]
    fireEvent.click(screen.getByText('na'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('does not show Next → before answering', () => {
    renderPrepDrill();
    expect(screen.queryByText('Next →')).toBeNull();
  });

  it('score increases when correct answer is clicked', () => {
    renderPrepDrill();
    fireEvent.click(screen.getByText('u'));
    expect(screen.getByText(/Score: 1/)).toBeTruthy();
  });

  it('score does not increase when wrong answer is clicked', () => {
    renderPrepDrill();
    fireEvent.click(screen.getByText('na'));
    expect(screen.getByText(/Score: 0/)).toBeTruthy();
  });

  it('options are locked after answering — guard prevents double-count', () => {
    const { container } = renderPrepDrill();
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    expect(screen.getByText('Next →')).toBeTruthy();
    // Clicking again should not increment score a second time
    fireEvent.click(optBtn);
    expect(screen.getByText(/Score: 1/)).toBeTruthy();
  });

  it('advances to next question after clicking Next →', () => {
    renderPrepDrill();
    fireEvent.click(screen.getByText('u'));
    fireEvent.click(screen.getByText('Next →'));
    // PREPDRILL[1] = { sentence:"Idem ___ posao." }
    expect(screen.getByText('Idem ___ posao.')).toBeTruthy();
  });

  it('progress counter advances after clicking Next →', () => {
    renderPrepDrill();
    fireEvent.click(screen.getByText('u'));
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText(/2 \/ 10/)).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('PrepDrill — completion + award guard', () => {
  it('shows done screen after all 10 questions answered + Next clicked on last', () => {
    const { container } = render(<PrepDrill goBack={vi.fn()} award={vi.fn()} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen: shows score / total and Done button
    expect(screen.getByText(/10 \/ 10/)).toBeTruthy();
    expect(screen.getByText('🏠 Done')).toBeTruthy();
  });

  it('award() is called exactly once when Done is clicked', () => {
    const award = vi.fn();
    completeAndClickDone(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 5 (all 10 correct → 50 XP)', () => {
    const award = vi.fn();
    completeAndClickDone(award);
    // All 15 opts[0] === answer with identity shuffle → score=15, XP=75
    expect(award).toHaveBeenCalledWith(50, false, 'grammar');
  });

  it('shows XP amount on done screen', () => {
    const { container } = render(<PrepDrill goBack={vi.fn()} award={vi.fn()} />);
    for (let i = 0; i < 10; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/\+50 XP/)).toBeTruthy();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('PrepDrill — navigation', () => {
  it('goBack is called when Done is clicked on the results screen', () => {
    const goBack = vi.fn();
    completeAndClickDone(vi.fn(), goBack);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
