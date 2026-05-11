/**
 * fleeting-a-drill.test.tsx — Behavioral tests for the FleetingADrill component.
 *
 * DATA[0] = { q:"On ___ cijelu noć. (pisati = to write)", answer:"pisao" }.
 * All 18 DATA entries have opts[0] === answer → score=18, award(90).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

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

const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

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

import FleetingADrill from '../components/practice/FleetingADrill';

function renderFleetingADrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<FleetingADrill {...props} />);
  return { ...utils, props };
}

function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderFleetingADrill({ award });
  for (let i = 0; i < 18; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

describe('FleetingADrill — rendering', () => {
  it('renders without crashing', () => {
    renderFleetingADrill();
  });

  it('shows the Fleeting-A title', () => {
    renderFleetingADrill();
    expect(screen.getByText('✨ Fleeting-A & L→O')).toBeTruthy();
  });

  it('shows the first question text (DATA[0] with identity shuffle)', () => {
    renderFleetingADrill();
    expect(screen.getByText('On ___ cijelu noć. (pisati = to write)')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderFleetingADrill();
    expect(screen.getByText('He wrote all night.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderFleetingADrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderFleetingADrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

describe('FleetingADrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderFleetingADrill();
    fireEvent.click(screen.getByText('pisao'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderFleetingADrill();
    fireEvent.click(screen.getByText('pišao'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderFleetingADrill();
    fireEvent.click(screen.getByText('pisao'));
    expect(screen.getByText(/pisa-l/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderFleetingADrill();
    fireEvent.click(screen.getByText('pisao'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderFleetingADrill();
    for (let i = 0; i < 17; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

describe('FleetingADrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 18/)).toBeTruthy();
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

  it('award() receives XP = score * 5 (all 18 correct → 90 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledWith(90, false, 'grammar');
  });

  it('markQuest("grammar") is called on completion', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledWith('grammar');
  });

  it('markQuest is called exactly once', () => {
    completeAllQuestions();
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });
});

describe('FleetingADrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<FleetingADrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 18; i++) {
      const optBtn = container.querySelector('button.ob');
      if (!optBtn) break;
      fireEvent.click(optBtn);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
