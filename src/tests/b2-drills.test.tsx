/**
 * b2-drills.test.tsx — Behavioral smoke tests for the three net-new B2 drills
 * (ParticipleDrill, SubordinationDrill, ConditionalDrill) authored to clear the
 * content-coverage B2 floor. Each follows the shared MC-drill pattern, so one
 * parameterized suite covers them: render, correct-answer feedback, single
 * award on completion, and back-navigation.
 *
 * rnd() → 0.99 makes shLocal() an identity shuffle, so DATA[0] (and its option
 * order) is deterministic and the first answer below is the correct one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  onAuthStateChanged: vi.fn(() => () => {}),
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
// rnd → 0.99 makes shLocal() identity (each element swaps with itself).
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));
vi.mock('../data', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
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
    level: 1,
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import ParticipleDrill from '../components/practice/ParticipleDrill';
import SubordinationDrill from '../components/practice/SubordinationDrill';
import ConditionalDrill from '../components/practice/ConditionalDrill';

const DRILLS = [
  {
    name: 'ParticipleDrill',
    Comp: ParticipleDrill,
    title: '🍂 Participles',
    firstQ: '___ knjigu, zaspao je. (čitati — while reading)',
    firstAnswer: 'Čitajući',
    total: 12,
  },
  {
    name: 'SubordinationDrill',
    Comp: SubordinationDrill,
    title: '🔗 Subordinate Clauses',
    firstQ: 'Došao je ___ je padala kiša. (although)',
    firstAnswer: 'iako',
    total: 12,
  },
  {
    name: 'ConditionalDrill',
    Comp: ConditionalDrill,
    title: '🤔 Conditional',
    firstQ: 'Da imam vremena, ___ ti pomogao. (I would help)',
    firstAnswer: 'bih',
    total: 12,
  },
] as const;

describe.each(DRILLS)('$name', ({ Comp, title, firstQ, firstAnswer, total }) => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the title, first question, and 4 options', () => {
    const { container } = render(<Comp goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(firstQ)).toBeTruthy();
    expect(container.querySelectorAll('button.ob').length).toBe(4);
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows ✅ Correct! when the correct first answer is chosen', () => {
    render(<Comp goBack={vi.fn()} award={vi.fn()} />);
    fireEvent.click(screen.getByText(firstAnswer));
    expect(screen.getByText(/✅ Correct!/)).toBeTruthy();
  });

  it('awards exactly once on completion and reaches the results screen', () => {
    const award = vi.fn();
    const { container } = render(<Comp goBack={vi.fn()} award={award} />);
    for (let i = 0; i < total; i++) {
      const opt = container.querySelector('button.ob');
      if (!opt) break;
      fireEvent.click(opt);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    expect(screen.getByText(new RegExp(`\\d+ / ${total}`))).toBeTruthy();
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('calls goBack from the results screen', () => {
    const goBack = vi.fn();
    const { container } = render(<Comp goBack={goBack} award={vi.fn()} />);
    for (let i = 0; i < total; i++) {
      const opt = container.querySelector('button.ob');
      if (!opt) break;
      fireEvent.click(opt);
      const nextBtn = container.querySelector('button.b.bp');
      if (nextBtn) fireEvent.click(nextBtn);
    }
    const backBtn = container.querySelector('button.b.bp');
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
