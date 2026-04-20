/**
 * adaptive-review.test.tsx — Behavioral tests for AdaptiveReviewScreen.
 *
 * Critical behaviors tested:
 *   - Empty state: no SRS data + no mistakes → shows "Još nema podataka!"
 *   - Dashboard: shows "Smart Review" heading, session composition, top missed words
 *   - Dashboard: "▶ Počni sesiju" transitions to session view
 *   - Session — mistake card: "Otkrij značenje" → reveals answer → correct/wrong
 *   - Session — SRS card: "Otkrij ↓" → reveals answer → correct/wrong
 *   - Wrong answer on SRS: calls recordMistake(id, '', id, 'adaptive')
 *   - Wrong answer on mistake: calls recordMistake(hr, en, q, 'adaptive')
 *   - Last item correct: calls markQuest('master') + award(correct * 2)
 *   - Results screen: shows Sesija završena, score %, XP earned = correct * 2
 *   - Results screen: goBack() called when "✓ Završi" clicked
 *   - Empty state back button: goBack() called
 *
 * Data strategy:
 *   - getMistakes: 1 high-mistake item {hr:'pisati', en:'to write', count:3, category:'verb'}
 *   - getSR: {} (empty) for mistake-only session → totalItems = 1
 *   - For SRS session: getSR returns 1 due-soon card with due in future (avoids overdue/dueSoon dup)
 *
 * Session composition with getSR={} + 1 mistake (count≥2):
 *   overdue = [] (empty SR)
 *   highMistake = [{type:'mistake', item:{hr:'pisati',count:3}, priority:'frequent'}]
 *   dueSoon = [] (empty SR, 15-1=14 slots but nothing available)
 *   totalItems = 1
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ── StatsContext mock ─────────────────────────────────────────────────────────
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

// ── SRS mock ─────────────────────────────────────────────────────────────────
const mockGetSR = vi.hoisted(() => vi.fn(() => ({})));
vi.mock('../lib/srs.js', () => ({ getSR: mockGetSR, saveSR: vi.fn() }));

// ── data mock — speak, getMistakes, recordMistake ────────────────────────────
const mockSpeak = vi.hoisted(() => vi.fn());
const mockGetMistakes = vi.hoisted(() => vi.fn(() => []));
const mockRecordMistake = vi.hoisted(() => vi.fn());
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    speak: mockSpeak,
    getMistakes: mockGetMistakes,
    recordMistake: mockRecordMistake,
  };
});

import AdaptiveReviewScreen from '../components/practice/AdaptiveReviewScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Single high-mistake item for tests. count≥2 → included in session as 'mistake' type. */
const MISTAKE = {
  hr: 'pisati',
  en: 'to write',
  q: 'Select the correct form',
  category: 'verb',
  count: 3,
};

/** Single SRS card (due-soon, NOT overdue) so we get exactly 1 item in session. */
function makeSRCard(nowMs: number) {
  return {
    pisati: { due: nowMs + 60_000, w: 0, en: 'to write' },
  };
}

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<AdaptiveReviewScreen {...props} />);
  return { ...utils, props };
}

// ─── Empty state ─────────────────────────────────────────────────────────────

describe('AdaptiveReviewScreen — empty state', () => {
  beforeEach(() => {
    mockGetSR.mockReturnValue({});
    mockGetMistakes.mockReturnValue([]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Još nema podataka!" when no SRS data and no mistakes', () => {
    renderScreen();
    expect(screen.getByText('Još nema podataka!')).toBeTruthy();
  });

  it('shows Smart Review heading in empty state', () => {
    renderScreen();
    expect(screen.getByText('Smart Review')).toBeTruthy();
  });

  it('calls goBack when back button pressed in empty state', () => {
    const { props } = renderScreen();
    // Back button in empty state header
    const backBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('←'));
    if (!backBtn) throw new Error('Back button not found in empty state');
    fireEvent.click(backBtn);
    expect(props.goBack).toHaveBeenCalledTimes(1);
  });

  it('"Idi na vježbe" button calls goBack', () => {
    const { props } = renderScreen();
    fireEvent.click(screen.getByText('Idi na vježbe'));
    expect(props.goBack).toHaveBeenCalledTimes(1);
  });
});

// ─── Dashboard with mistake data ─────────────────────────────────────────────

describe('AdaptiveReviewScreen — dashboard view', () => {
  beforeEach(() => {
    mockGetSR.mockReturnValue({});
    mockGetMistakes.mockReturnValue([MISTAKE]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Smart Review" heading on dashboard', () => {
    renderScreen();
    expect(screen.getByText('Smart Review')).toBeTruthy();
  });

  it('shows subtitle "Prilagođeno tvojim slabostima"', () => {
    renderScreen();
    expect(screen.getByText('Prilagođeno tvojim slabostima')).toBeTruthy();
  });

  it('shows total session item count (1 mistake → "1 stavki")', () => {
    renderScreen();
    expect(screen.getByText(/1 stavki/)).toBeTruthy();
  });

  it('shows top missed word as a pill (pisati ×3)', () => {
    renderScreen();
    expect(screen.getByText(/pisati.*×3/)).toBeTruthy();
  });

  it('shows "Počni sesiju" button', () => {
    renderScreen();
    expect(screen.getByText(/Počni sesiju/)).toBeTruthy();
  });

  it('shows mistake count badge in session composition', () => {
    renderScreen();
    // "🎯 1 greška" badge in session composition panel
    expect(screen.getByText(/1 greška/)).toBeTruthy();
  });
});

// ─── Dashboard with SRS data ──────────────────────────────────────────────────

describe('AdaptiveReviewScreen — dashboard with SRS overdue count', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00Z'));
    // 1 overdue card (due in the past, w>0)
    mockGetSR.mockReturnValue({
      trčati: { due: Date.now() - 3_600_000, w: 1, en: 'to run' },
    });
    mockGetMistakes.mockReturnValue([]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows overdue card count on dashboard', () => {
    renderScreen();
    // "1 kartica čeka na ponavljanje" displayed when overdueCount > 0
    expect(screen.getByText(/kartica.*čeka na ponavljanje/)).toBeTruthy();
  });

  it('shows SRS count badge in session composition', () => {
    renderScreen();
    // "🔁 N SRS" badge visible (overdue card + itself in due-soon = 2 items)
    expect(screen.getByText(/SRS/)).toBeTruthy();
  });
});

// ─── Mistake card session flow ────────────────────────────────────────────────

describe('AdaptiveReviewScreen — mistake card session', () => {
  beforeEach(() => {
    mockGetSR.mockReturnValue({});
    mockGetMistakes.mockReturnValue([MISTAKE]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clicking "Počni sesiju" transitions to session view', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    // Session view shows "1 / 1" progress counter
    expect(screen.getByText('1 / 1')).toBeTruthy();
  });

  it('session shows mistake word "pisati" in mistake card', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    expect(screen.getByText('pisati')).toBeTruthy();
  });

  it('session shows "Otkrij značenje" button on mistake card', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    expect(screen.getByText('Otkrij značenje')).toBeTruthy();
  });

  it('clicking "Otkrij značenje" reveals answer and shows Znam/Ne znam buttons', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    expect(screen.getByText(/✓ Znam/)).toBeTruthy();
    expect(screen.getByText(/✗ Ne znam/)).toBeTruthy();
  });

  it('clicking "✓ Znam" on last item completes session and shows results', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✓ Znam/));
    expect(screen.getByText('Sesija završena')).toBeTruthy();
  });

  it('correct answer: award(2) called (1 correct × 2)', () => {
    const { props } = renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✓ Znam/));
    expect(props.award).toHaveBeenCalledWith(2);
  });

  it('correct answer: markQuest("master") called on completion', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✓ Znam/));
    expect(mockMarkQuest).toHaveBeenCalledWith('master');
  });

  it('"✗ Ne znam" calls recordMistake with mistake fields', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✗ Ne znam/));
    // Wrong mistake card: recordMistake(m.hr, m.en || '', m.q || '', 'adaptive')
    expect(mockRecordMistake).toHaveBeenCalledWith(
      'pisati',
      'to write',
      'Select the correct form',
      'adaptive',
    );
  });

  it('"✗ Ne znam" on last item still completes session (results shown)', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✗ Ne znam/));
    expect(screen.getByText('Sesija završena')).toBeTruthy();
  });

  it('wrong answer: award(0) called (0 correct × 2)', () => {
    const { props } = renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✗ Ne znam/));
    expect(props.award).toHaveBeenCalledWith(0);
  });

  it('back button in session view returns to dashboard', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    // Session view has ← button that goes back to dashboard
    const backBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '←');
    if (!backBtn) throw new Error('Session back button not found');
    fireEvent.click(backBtn);
    // Dashboard is shown again
    expect(screen.getByText(/Počni sesiju/)).toBeTruthy();
  });
});

// ─── SRS card session flow ────────────────────────────────────────────────────

describe('AdaptiveReviewScreen — SRS card session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00Z'));
    // Due-soon card (not overdue) → exactly 1 item in session, priority:'due'
    mockGetSR.mockReturnValue(makeSRCard(Date.now()));
    mockGetMistakes.mockReturnValue([]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('SRS card shows the word "pisati"', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    expect(screen.getByText('pisati')).toBeTruthy();
  });

  it('SRS card shows "Otkrij ↓" button', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    expect(screen.getByText(/Otkrij/)).toBeTruthy();
  });

  it('clicking "Otkrij ↓" flips the SRS card and shows Znam/Ne znam', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText(/Otkrij/));
    expect(screen.getByText(/✓ Znam/)).toBeTruthy();
    expect(screen.getByText(/✗ Ne znam/)).toBeTruthy();
  });

  it('SRS card flipped: shows English hint "to write"', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText(/Otkrij/));
    expect(screen.getByText('to write')).toBeTruthy();
  });

  it('correct SRS answer: results shown, award(2) called', () => {
    const { props } = renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText(/Otkrij/));
    fireEvent.click(screen.getByText(/✓ Znam/));
    expect(screen.getByText('Sesija završena')).toBeTruthy();
    expect(props.award).toHaveBeenCalledWith(2);
  });

  it('wrong SRS answer: calls recordMistake(id, empty, id, adaptive)', () => {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText(/Otkrij/));
    fireEvent.click(screen.getByText(/✗ Ne znam/));
    // Wrong SRS: recordMistake(current.id, '', current.id, 'adaptive')
    expect(mockRecordMistake).toHaveBeenCalledWith('pisati', '', 'pisati', 'adaptive');
  });
});

// ─── Results screen ───────────────────────────────────────────────────────────

describe('AdaptiveReviewScreen — results screen', () => {
  beforeEach(() => {
    mockGetSR.mockReturnValue({});
    mockGetMistakes.mockReturnValue([MISTAKE]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  function goToResults(correct: boolean) {
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(correct ? /✓ Znam/ : /✗ Ne znam/));
  }

  it('shows "Sesija završena" heading', () => {
    goToResults(true);
    expect(screen.getByText('Sesija završena')).toBeTruthy();
  });

  it('shows correct/total ratio "1/1 točno" for correct answer', () => {
    goToResults(true);
    expect(screen.getByText(/1\/1 točno/)).toBeTruthy();
  });

  it('shows XP earned "+2" for 1 correct answer', () => {
    goToResults(true);
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('shows 100% for all correct', () => {
    goToResults(true);
    // Two elements show pct: the big headline and the "Točnost" stats card
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
  });

  it('shows 0% for all wrong', () => {
    goToResults(false);
    // Two elements show pct: the big headline and the "Točnost" stats card
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "+0" XP for 0 correct answers', () => {
    goToResults(false);
    expect(screen.getByText('+0')).toBeTruthy();
  });

  it('"✓ Završi" button calls goBack()', () => {
    const { props } = renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✓ Znam/));
    fireEvent.click(screen.getByText(/✓ Završi/));
    expect(props.goBack).toHaveBeenCalledTimes(1);
  });

  it('shows "Focus on: verb" recommendation when grammar weakness detected', () => {
    goToResults(true);
    // MISTAKE has category:'verb' → weakestGrammarCat='verb' → "Focus on: verb"
    expect(screen.getByText(/Focus on: verb/)).toBeTruthy();
  });

  it('shows "Great session!" recommendation when correct and no grammar weakness', () => {
    // Override with no-category mistake so weakestGrammarCat is undefined
    mockGetMistakes.mockReturnValue([{ hr: 'pisati', en: 'to write', count: 3 }]);
    const { props } = renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✓ Znam/));
    expect(screen.getByText(/Great session!/)).toBeTruthy();
    expect(props.award).toHaveBeenCalledWith(2);
  });

  it('shows "Review missed words" when wrong and no grammar weakness', () => {
    // Override with no-category mistake so weakestGrammarCat is undefined
    mockGetMistakes.mockReturnValue([{ hr: 'pisati', en: 'to write', count: 3 }]);
    renderScreen();
    fireEvent.click(screen.getByText(/Počni sesiju/));
    fireEvent.click(screen.getByText('Otkrij značenje'));
    fireEvent.click(screen.getByText(/✗ Ne znam/));
    // wrong > 0, no weakestGrammarCat → 'Review missed words in Flashcards'
    expect(screen.getByText(/Review missed words/)).toBeTruthy();
  });
});
