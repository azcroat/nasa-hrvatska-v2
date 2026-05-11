/**
 * dative-drill.test.tsx — Behavioral tests for the DativeDrill component.
 *
 * DATA[0] = { q:"Dajem poklon ___.", answer:"bratu" }.
 * All 20 DATA entries have opts[0] === answer → score=20, award(100).
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

import DativeDrill from '../components/practice/DativeDrill';

function renderDativeDrill(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<DativeDrill {...props} />);
  return { ...utils, props };
}

function completeAllQuestions(award: ReturnType<typeof vi.fn> = vi.fn()) {
  const { container } = renderDativeDrill({ award });
  for (let i = 0; i < 20; i++) {
    const optBtn = container.querySelector('button.ob');
    if (!optBtn) break;
    fireEvent.click(optBtn);
    const nextBtn = container.querySelector('button.b.bp');
    if (nextBtn) fireEvent.click(nextBtn);
  }
  return { award };
}

describe('DativeDrill — rendering', () => {
  it('renders without crashing', () => {
    renderDativeDrill();
  });

  it('shows the Dative Case title', () => {
    renderDativeDrill();
    expect(screen.getByText('🤝 Dative Case')).toBeTruthy();
  });

  it('shows the first question text (DATA[0] with identity shuffle)', () => {
    renderDativeDrill();
    expect(screen.getByText('Dajem poklon ___.')).toBeTruthy();
  });

  it('shows the English translation for the first question', () => {
    renderDativeDrill();
    expect(screen.getByText('I give a gift to my brother.')).toBeTruthy();
  });

  it('shows 4 option buttons for the first question', () => {
    const { container } = renderDativeDrill();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
  });

  it('shows progress bar', () => {
    renderDativeDrill();
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

describe('DativeDrill — answer mechanics', () => {
  it('correct answer shows ✅ Correct! feedback', () => {
    renderDativeDrill();
    fireEvent.click(screen.getByText('bratu'));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('wrong answer shows ❌ Incorrect. feedback', () => {
    renderDativeDrill();
    fireEvent.click(screen.getByText('brata'));
    expect(screen.getByText(/❌ Incorrect\./)).toBeTruthy();
  });

  it('shows a grammar tip after answering', () => {
    renderDativeDrill();
    fireEvent.click(screen.getByText('bratu'));
    expect(screen.getByText(/dative/)).toBeTruthy();
  });

  it('shows Next → after answering a non-final question', () => {
    renderDativeDrill();
    fireEvent.click(screen.getByText('bratu'));
    expect(screen.getByText('Next →')).toBeTruthy();
  });

  it('shows See results on the last question after answering', () => {
    const { container } = renderDativeDrill();
    for (let i = 0; i < 19; i++) {
      fireEvent.click(container.querySelector('button.ob')!);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    fireEvent.click(container.querySelector('button.ob')!);
    expect(screen.getByText('See results')).toBeTruthy();
  });
});

describe('DativeDrill — completion + award guard', () => {
  beforeEach(() => {
    mockMarkQuest.mockClear();
  });

  it('shows done screen after all questions answered', () => {
    completeAllQuestions();
    expect(screen.getByText(/\d+ \/ 20/)).toBeTruthy();
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

  it('award() receives XP = score * 5 (all 20 correct → 100 XP)', () => {
    const award = vi.fn();
    completeAllQuestions(award);
    expect(award).toHaveBeenCalledWith(100, false, 'grammar');
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

describe('DativeDrill — navigation', () => {
  it('goBack is called when ← Back is clicked on the done screen', () => {
    const goBack = vi.fn();
    const { container } = render(<DativeDrill goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < 20; i++) {
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
