/**
 * clitic-drill.test.tsx — Behavioral tests for the CliticDrill component.
 *
 * Critical behaviors tested:
 *   - First question shown (DATA[0] with identity shuffle)
 *   - Correct answer shows "✅ Correct!" feedback
 *   - Wrong answer shows "❌ Incorrect." feedback
 *   - award(score * 5) called once on completion
 *   - markQuest('grammar') called on completion
 *   - writeDelta({ gc: 1, vs: ['clitic'] }) called when 'clitic' not yet in stats.vs
 *   - goBack called when "← Back" clicked on done screen
 *
 * Shuffle is deterministic: rnd() → 0.99 makes shLocal() identity.
 * DATA[0] = { sentence:"Dao ___ ga je.", opts:["mu ga je","ga mu je","je ga mu","mu je ga"], answer:"mu ga je" }.
 * 22 questions; with identity shuffle, 3 have opts[0] ≠ answer (DATA[6/7/9]) → score=19, award(95).
 *
 * StatsContext is mocked so useStats() returns { stats: { vs: [] }, setStats, writeDelta }.
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

// ── StatsContext mock — provides useStats() without needing a Provider ────────
const mockSetStats = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[] },
    setStats: mockSetStats,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: mockWriteDelta,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
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

import CliticDrill from '../components/practice/CliticDrill';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderCliticDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<CliticDrill {...props} />);
  return { ...utils, props };
}

/**
 * Complete all 22 questions by clicking the first .ob option each time.
 * With rnd=0.99 (identity shuffle), DATA order is preserved.
 * DATA[6] opts[0]="mi se" ≠ answer="mi je"  → wrong
 * DATA[7] opts[0]="mu"    ≠ answer="joj"     → wrong
 * DATA[9] opts[0]="se ti" ≠ answer="ti se"   → wrong
 * All others: opts[0] === answer → score = 22 - 3 = 19, award(95).
 */
function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderCliticDrill({ award });
  for (let i = 0; i < 22; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('CliticDrill — rendering', () => {
  it('renders without crashing', () => {
    renderCliticDrill();
  });

  it('shows the Clitic Drill title', () => {
    renderCliticDrill();
    expect(screen.getByText('🔗 Clitic Drill')).toBeTruthy();
  });

  it('shows the first question sentence (DATA[0] with identity shuffle)', () => {
    renderCliticDrill();
    expect(screen.getByText('Dao ___ ga je.')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderCliticDrill();
    expect(screen.getByText('He gave it to him.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderCliticDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderCliticDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('CliticDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderCliticDrill();
    // DATA[0] answer = "mu ga je" = opts[0] with identity shuffle
    fireEvent.click(screen.getByText('mu ga je'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderCliticDrill();
    // "ga mu je" is wrong for DATA[0]
    fireEvent.click(screen.getByText('ga mu je'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderCliticDrill();
    fireEvent.click(screen.getByText('mu ga je'));
    // DATA[0].tip = "Clitic order: dative (mu) → accusative (ga) → auxiliary (je)"
    expect(screen.getByText(/Clitic order/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderCliticDrill();
    fireEvent.click(screen.getByText('mu ga je'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('options are locked after answering — guard prevents double-count', () => {
    const { container } = renderCliticDrill();
    const optBtn = container.querySelector('button.ob')!;
    fireEvent.click(optBtn);
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
    // Clicking again should not produce a second feedback element
    fireEvent.click(optBtn);
    expect(screen.getAllByText(/✅ Correct!/).length).toBe(1);
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderCliticDrill();
    for (let i = 0; i < 21; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Now on question 22 (last)
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Completion / XP award guard ───────────────────────────────────────────────

describe('CliticDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
    mockWriteDelta.mockClear();
    mockSetStats.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 22/)).toBeTruthy();
  });

  it('shows ← Back button on done screen', () => {
    completeAllQuestions();
    expect(screen.getByText('← Back')).toBeTruthy();
  });

  it('award() is called exactly once on completion', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('award() receives XP = score * 5 (19 correct → 95 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    // DATA[6/7/9] opts[0] ≠ answer → 3 wrong; 22 - 3 = 19 correct → XP = 95
    expect(award).toHaveBeenCalledWith(95);
  });

  it('markQuest("grammar") is called on completion', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once (not per question)', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('writeDelta called with { gc: 1, vs: ["clitic"] } on first completion', () => {
    completeAllQuestions();
    // stats.vs = [] (mock) → 'clitic' not included → writeDelta branch executes
    expect(mockWriteDelta).toHaveBeenCalledWith({ gc: 1, vs: ['clitic'] });
  });

  it('setStats is called to append "clitic" to vs on first completion', () => {
    completeAllQuestions();
    expect(mockSetStats).toHaveBeenCalledTimes(1);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('CliticDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<CliticDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 22; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    // Done screen: click "← Back" button
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
