/**
 * NominativeDrill.test.tsx — Smoke tests for the NominativeDrill component.
 *
 * Uses the mock pattern from prep-drill.test.tsx (canonical).
 * Full contract compliance is verified in exerciseContract.test.tsx.
 *
 * With rnd()=0.99, shuffle is identity — DATA[0].opts[0] === DATA[0].answer.
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

// ── rnd mock — 0.99 makes shLocal() identity ─────────────────────────────────
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

import NominativeDrill from '../components/practice/NominativeDrill';

describe('NominativeDrill — smoke tests', () => {
  it('renders without crashing', () => {
    render(<NominativeDrill goBack={vi.fn()} award={vi.fn()} />);
  });

  it('shows the title "Nominative Case"', () => {
    render(<NominativeDrill goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText('🏷️ Nominative Case')).toBeTruthy();
  });

  it('shows progress 1 / 20', () => {
    render(<NominativeDrill goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText(/1 \/ 20/)).toBeTruthy();
  });

  it('advances to 2 / 20 after clicking the correct answer and Next', () => {
    const { container } = render(<NominativeDrill goBack={vi.fn()} award={vi.fn()} />);
    // With rnd()=0.99, shuffle is identity — opts[0] === answer
    const firstOpt = container.querySelector('button.ob');
    expect(firstOpt).toBeTruthy();
    fireEvent.click(firstOpt!);
    const nextBtn = container.querySelector('button.b.bp');
    expect(nextBtn).toBeTruthy();
    fireEvent.click(nextBtn!);
    expect(screen.getByText(/2 \/ 20/)).toBeTruthy();
  });
});
