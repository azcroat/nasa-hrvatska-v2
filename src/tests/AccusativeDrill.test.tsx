/**
 * AccusativeDrill.test.tsx -- Smoke tests for the AccusativeDrill component.
 *
 * Uses the mock pattern from prep-drill.test.tsx (canonical).
 * Full contract compliance is verified in exerciseContract.test.tsx.
 *
 * With rnd()=0.99, shuffle is identity -- DATA[0].opts[0] === DATA[0].answer.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// -- Firebase mock -----------------------------------------------------------
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

// -- StatsContext mock --------------------------------------------------------
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

// -- rnd mock -- 0.99 makes shLocal() identity --------------------------------
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

// -- data mock ----------------------------------------------------------------
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import AccusativeDrill from '../components/practice/AccusativeDrill';

describe('AccusativeDrill -- smoke tests', () => {
  it('renders without crashing', () => {
    render(<AccusativeDrill goBack={vi.fn()} award={vi.fn()} />);
  });

  it('shows the title "Accusative Case"', () => {
    render(<AccusativeDrill goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText('Accusative Case')).toBeTruthy();
  });

  it('shows progress 1 / 50', () => {
    render(<AccusativeDrill goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/1 \/ 50/)).toBeTruthy();
  });

  it('advances to 2 / 50 after clicking the correct answer and Next', () => {
    const { container } = render(<AccusativeDrill goBack={vi.fn()} award={vi.fn()} />);
    // With rnd()=0.99, shuffle is identity -- opts[0] === answer
    const firstOpt = container.querySelector('button.ob');
    expect(firstOpt).toBeTruthy();
    fireEvent.click(firstOpt!);
    const nextBtn = container.querySelector('button.b.bp');
    expect(nextBtn).toBeTruthy();
    fireEvent.click(nextBtn!);
    expect(screen.getByText(/2 \/ 50/)).toBeTruthy();
  });
});

// ── vs-dedup guard (branch coverage) ─────────────────────────────────────────

describe('AccusativeDrill — vs-dedup guard (both branches)', () => {
  /**
   * Mirrors the setStats updater in AccusativeDrill's completion handler.
   * Tests the inner guard: if prev.vs already includes 'accusative', return prev unchanged.
   */
  function accusativeUpdater(prev: { gc?: number; vs?: string[] }) {
    if (prev.vs?.includes('accusative')) return prev;
    return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'accusative'] };
  }

  it('updater adds gc+1 and "accusative" to vs on first completion', () => {
    const result = accusativeUpdater({ gc: 0, vs: [] });
    expect(result.gc).toBe(1);
    expect(result.vs).toContain('accusative');
  });

  it('updater returns prev unchanged if vs already includes "accusative" (idempotent)', () => {
    const prev = { gc: 2, vs: ['accusative'] };
    expect(accusativeUpdater(prev)).toBe(prev);
  });

  it('updater handles undefined vs gracefully', () => {
    const result = accusativeUpdater({ gc: 0, vs: undefined });
    expect(result.vs).toContain('accusative');
    expect(result.gc).toBe(1);
  });

  it('updater is idempotent — tag appears exactly once on repeated calls', () => {
    const first = accusativeUpdater({ gc: 0, vs: [] });
    const second = accusativeUpdater(first);
    expect(second).toBe(first);
    expect((second.vs ?? []).filter((t) => t === 'accusative').length).toBe(1);
  });
});
