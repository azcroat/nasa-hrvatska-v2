/**
 * aspect-drill.test.tsx — Behavioral tests for AspectDrillScreen.
 *
 * Critical behaviors tested:
 *   - Title + subtitle rendered in drill mode
 *   - Progress counter "Pair 1/1" shown (1 mocked pair)
 *   - Phase 0 (recognition): imperfective prompt, 2 option buttons
 *   - Correct answer → "✓ Correct!" feedback + "Next phase (Fill-In) →" button
 *   - Wrong answer  → "✗ Not quite" feedback + Next button
 *   - Options locked after answering (second click is no-op)
 *   - Phase 1 (fillin): gap sentence rendered; correct answer → "Next phase (Why?) →"
 *   - Phase 2 (why):   3 rule options; correct rule → "Next phase (Compare) →"
 *   - Phase 3 (compare): 2 sentences; correct (pf) → "See results" button
 *   - "📖 6 Rules" button → reference mode; "← Back to Drill" returns to drill
 *   - Reference mode shows all 6 rule labels
 *   - Done screen: shows score; Finish calls award() + markQuest('grammar')
 *   - Done screen: Retry resets to Pair 1
 *
 * Data: ASPECT_PAIRS is mocked to 1 entry (pisati/napisati) for feasibility.
 * Shuffle: rnd() → 0.99 makes sh() identity — opts preserve insertion order.
 *
 * Phase 0 details with 1 pair, identity shuffle:
 *   idx=0, idx%2===0 → asking IMPERFECTIVE
 *   opts = sh([impf, pf]) = ["pisati", "napisati"]  → opts[0]="pisati"=correct
 *
 * Phase 1 details:
 *   (idx+1)%2===0 → 1%2=0→false → useImpf=false → pf
 *   targetVerb = "napisati" → gapped = "___ sam pismo majci."
 *   opts = sh(["napisati","pisati"]) → opts[0]="napisati"=correct
 *
 * Phase 2 details:
 *   ctx includes "svaki" → guessRule→"habitual"
 *   opts = sh([habitual, completed, ongoing]) → opts[0]=habitual=correct
 *   button text = "🔄 Repeated or habitual → imperfective"
 *
 * Phase 3 details:
 *   opts = sh([{impf}, {pf}]) → opts[1] = pfSentence = correct
 *   correct = "Napisao sam pismo majci."
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

// ── StatsContext mock — provides useStats() without a Provider ────────────────
const mockSetStats = vi.hoisted(() => vi.fn());
const mockWriteDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: { vs: [] as string[], gc: 0 },
    setStats: mockSetStats,
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 1,
    writeDelta: mockWriteDelta,
  })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── data mock — 1 ASPECT_PAIR for feasible testing ───────────────────────────
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    ASPECT_PAIRS: [
      {
        impf: 'pisati',
        pf: 'napisati',
        en: 'to write',
        rule: 'na- prefix marks completion',
        ctx: 'Svaki dan pišem pisma. / Napisao sam pismo majci.',
      },
    ],
  };
});

import AspectDrillScreen from '../components/practice/AspectDrillScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAspectDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<AspectDrillScreen {...props} />);
  return { ...utils, props };
}

/** Returns option buttons — filtering out navigation, control, and feedback buttons. */
function _getOptionButtons() {
  return screen.queryAllByRole('button').filter(btn => {
    const t = btn.textContent ?? '';
    return !['Back', '← Back to Drill', '6 Rules', 'Mistakes only', 'Retry', 'Finish', 'Drill Mistakes'].some(k => t.includes(k))
      && !t.startsWith('Next') && !t.startsWith('▸') && !t.startsWith('▾')
      && !t.includes('See results') && !t.includes('Show full rule');
  });
}

/** Click the option button whose text matches the predicate. */
function clickOptionByText(text: string | RegExp) {
  const btn = screen.getAllByRole('button').find(b => {
    const t = b.textContent?.trim() ?? '';
    return typeof text === 'string' ? t === text : text.test(t);
  });
  if (!btn) throw new Error(`Option button not found: ${text}`);
  fireEvent.click(btn);
}

/** Complete all 4 phases of the single mocked pair, clicking correct answers each time. */
function completeAllPhases(award = vi.fn(), goBack = vi.fn()) {
  render(<AspectDrillScreen award={award} goBack={goBack} />);

  // Phase 0 (recognition): opts[0]="pisati"=imperfective=correct
  clickOptionByText('pisati');
  fireEvent.click(screen.getByText(/Next phase/));

  // Phase 1 (fillin): opts[0]="napisati"=pf=correct
  clickOptionByText('napisati');
  fireEvent.click(screen.getByText(/Next phase/));

  // Phase 2 (why): opts[0] = habitual rule label button
  const habitualBtn = screen.queryAllByRole('button').find(
    btn => (btn.textContent ?? '').includes('Repeated or habitual')
  );
  if (habitualBtn) fireEvent.click(habitualBtn);
  fireEvent.click(screen.getByText(/Next phase/));

  // Phase 3 (compare): click the pf sentence button = "Napisao sam pismo majci."
  clickOptionByText(/Napisao sam pismo majci/);
  fireEvent.click(screen.getByText('See results'));
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('AspectDrillScreen — rendering', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); mockSetStats.mockClear(); mockWriteDelta.mockClear(); });

  it('renders without crashing', () => {
    renderAspectDrill();
  });

  it('shows the "Verb Aspect Drill" title', () => {
    renderAspectDrill();
    expect(screen.getByText(/Verb Aspect Drill/)).toBeTruthy();
  });

  it('shows the subtitle "Perfective vs imperfective"', () => {
    renderAspectDrill();
    expect(screen.getByText(/Perfective vs imperfective/)).toBeTruthy();
  });

  it('shows progress counter "Pair 1/1" with 1 mocked pair', () => {
    renderAspectDrill();
    expect(screen.getByText(/Pair 1\/1/)).toBeTruthy();
  });

  it('shows Phase 0 recognition prompt asking for IMPERFECTIVE or PERFECTIVE form', () => {
    renderAspectDrill();
    // The recognition question prompt always contains the word form "to write"
    expect(screen.getByText(/Which is the.*form of "to write"/)).toBeTruthy();
  });

  it('shows two option buttons for Phase 0 (pisati and napisati as buttons)', () => {
    renderAspectDrill();
    // Both verb forms appear as clickable buttons (not just static pair-header text)
    const btns = screen.getAllByRole('button');
    const hasImpf = btns.some(b => b.textContent?.trim() === 'pisati');
    const hasPf   = btns.some(b => b.textContent?.trim() === 'napisati');
    expect(hasImpf).toBe(true);
    expect(hasPf).toBe(true);
  });

  it('shows the "📖 6 Rules" control button', () => {
    renderAspectDrill();
    const btn = screen.queryAllByRole('button').find(b => (b.textContent ?? '').includes('6 Rules'));
    expect(btn).toBeTruthy();
  });

  it('does not show Next → before answering', () => {
    renderAspectDrill();
    expect(screen.queryByText(/Next phase/)).toBeNull();
  });
});

// ── Answer mechanics ──────────────────────────────────────────────────────────

describe('AspectDrillScreen — answer mechanics', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('shows "✓ Correct!" when correct answer selected (Phase 0)', () => {
    renderAspectDrill();
    clickOptionByText('pisati'); // imperfective = correct for idx%2===0
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
  });

  it('shows "✗ Not quite" when wrong answer selected (Phase 0)', () => {
    renderAspectDrill();
    clickOptionByText('napisati'); // perfective = wrong for IMPERFECTIVE question
    expect(screen.getByText(/✗ Not quite/)).toBeTruthy();
  });

  it('shows "Next phase (Fill-In) →" button after answering Phase 0', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    expect(screen.getByText(/Next phase.*Fill-In/)).toBeTruthy();
  });

  it('options are locked after answering — clicking another option is no-op', () => {
    renderAspectDrill();
    clickOptionByText('pisati'); // answer
    // "✓ Correct!" is visible
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
    // Clicking the wrong option now should not change feedback
    clickOptionByText('napisati');
    // Still shows Correct! — not reset
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
    expect(screen.queryByText(/✗ Not quite/)).toBeNull();
  });

  it('advances to Phase 1 (fill-in) after Next → in Phase 0', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    // Phase 1 shows "Choose the correct form to complete the sentence"
    expect(screen.getByText(/Choose the correct form to complete the sentence/)).toBeTruthy();
  });

  it('Phase 1 shows a gap sentence with "___"', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    // Gap sentence should contain "___"
    expect(screen.getByText(/___/)).toBeTruthy();
  });

  it('Phase 1 correct answer shows "Next phase (Why?) →"', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    clickOptionByText('napisati'); // pf = correct for Phase 1
    expect(screen.getByText(/Next phase.*Why\?/)).toBeTruthy();
  });

  it('Phase 2 shows rule option buttons', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    clickOptionByText('napisati');
    fireEvent.click(screen.getByText(/Next phase/));
    // Should show the "Repeated or habitual" rule label
    expect(screen.getByText(/Repeated or habitual/)).toBeTruthy();
  });

  it('Phase 2 correct answer shows "Next phase (Compare) →"', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    clickOptionByText('napisati');
    fireEvent.click(screen.getByText(/Next phase/));
    const habitualBtn = screen.queryAllByRole('button').find(
      btn => (btn.textContent ?? '').includes('Repeated or habitual')
    );
    if (habitualBtn) fireEvent.click(habitualBtn);
    expect(screen.getByText(/Next phase.*Compare/)).toBeTruthy();
  });

  it('Phase 3 shows the comparison prompt', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    clickOptionByText('napisati');
    fireEvent.click(screen.getByText(/Next phase/));
    const habitualBtn = screen.queryAllByRole('button').find(
      btn => (btn.textContent ?? '').includes('Repeated or habitual')
    );
    if (habitualBtn) fireEvent.click(habitualBtn);
    fireEvent.click(screen.getByText(/Next phase/));
    expect(screen.getByText(/Which sentence describes a COMPLETED/)).toBeTruthy();
  });

  it('Phase 3 correct answer (pf sentence) shows "See results"', () => {
    renderAspectDrill();
    clickOptionByText('pisati');
    fireEvent.click(screen.getByText(/Next phase/));
    clickOptionByText('napisati');
    fireEvent.click(screen.getByText(/Next phase/));
    const habitualBtn = screen.queryAllByRole('button').find(
      btn => (btn.textContent ?? '').includes('Repeated or habitual')
    );
    if (habitualBtn) fireEvent.click(habitualBtn);
    fireEvent.click(screen.getByText(/Next phase/));
    // pfSentence = "Napisao sam pismo majci." — click it as a button
    clickOptionByText(/Napisao sam pismo majci/);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

// ── Reference mode ────────────────────────────────────────────────────────────

describe('AspectDrillScreen — reference mode', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('"6 Rules" button switches to reference mode', () => {
    renderAspectDrill();
    const rulesBtn = screen.queryAllByRole('button').find(b => (b.textContent ?? '').includes('6 Rules'));
    if (rulesBtn) fireEvent.click(rulesBtn);
    expect(screen.getByText(/Aspect Rules/)).toBeTruthy();
  });

  it('reference mode shows all 6 rule labels', () => {
    renderAspectDrill();
    const rulesBtn = screen.queryAllByRole('button').find(b => (b.textContent ?? '').includes('6 Rules'));
    if (rulesBtn) fireEvent.click(rulesBtn);
    // Each ASPECT_RULE has a label — check a few key ones
    expect(screen.getByText(/Habitual \/ Repeated/)).toBeTruthy();
    expect(screen.getByText(/Single Completed Event/)).toBeTruthy();
    expect(screen.getByText(/Negation/)).toBeTruthy();
    expect(screen.getByText(/Narrative Sequence/)).toBeTruthy();
    expect(screen.getByText(/Simultaneous \/ While/)).toBeTruthy();
  });

  it('"← Back to Drill" button returns to drill mode', () => {
    renderAspectDrill();
    const rulesBtn = screen.queryAllByRole('button').find(b => (b.textContent ?? '').includes('6 Rules'));
    if (rulesBtn) fireEvent.click(rulesBtn);
    // Should be in reference mode
    expect(screen.getByText(/Aspect Rules/)).toBeTruthy();
    // Click back to drill
    fireEvent.click(screen.getByText(/← Back to Drill/));
    // Should be back in drill mode showing the title
    expect(screen.getByText(/Verb Aspect Drill/)).toBeTruthy();
    // And the pair counter is visible again
    expect(screen.getByText(/Pair 1\/1/)).toBeTruthy();
  });
});

// ── Completion ────────────────────────────────────────────────────────────────

describe('AspectDrillScreen — completion + award', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); mockSetStats.mockClear(); mockWriteDelta.mockClear(); });

  it('done screen shows score after completing all 4 phases', () => {
    completeAllPhases();
    // Done screen shows points (score/total)
    expect(screen.getByText(/points/)).toBeTruthy();
  });

  it('done screen shows "Finish" button', () => {
    completeAllPhases();
    expect(screen.getByText('Finish')).toBeTruthy();
  });

  it('award() called with correct value when Finish clicked', () => {
    const award = vi.fn();
    completeAllPhases(award, vi.fn());
    fireEvent.click(screen.getByText('Finish'));
    expect(award).toHaveBeenCalledTimes(1);
    // award(score * 4 + 10); score=4 (all correct) → award(4*4+10) = award(26)
    expect(award).toHaveBeenCalledWith(26);
  });

  it('markQuest("grammar") called when Finish clicked', () => {
    completeAllPhases();
    fireEvent.click(screen.getByText('Finish'));
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('Finish is idempotent — calling twice only fires award once', () => {
    const award = vi.fn();
    completeAllPhases(award, vi.fn());
    fireEvent.click(screen.getByText('Finish'));
    fireEvent.click(screen.getByText('Finish'));
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('"Retry" button returns to Pair 1', () => {
    completeAllPhases();
    fireEvent.click(screen.getByText('Retry'));
    // Should be back at Pair 1/1 and show the phase 0 recognition question prompt
    expect(screen.getByText(/Pair 1\/1/)).toBeTruthy();
    expect(screen.getByText(/Which is the.*form of "to write"/)).toBeTruthy();
  });
});
