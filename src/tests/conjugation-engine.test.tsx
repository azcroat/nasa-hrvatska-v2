// src/tests/conjugation-engine.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Importing the component transitively pulls in '../../data' (which loads Firebase).
// Mock Firebase the same way the other component tests do.
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
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

import ConjugationDrillEngine from '../components/practice/ConjugationDrillEngine';
import type { ConjVerb, ConjCell } from '../lib/conjugation/types';

const pisati: ConjVerb = {
  inf: 'pisati',
  en: 'to write',
  aspect: 'impf',
  pair: null,
  klass: 'a-em',
  cefr: 'A1',
  irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};
const cells: ConjCell[] = [{ inf: 'pisati', formType: 'present', personIdx: 0 }];

describe('ConjugationDrillEngine', () => {
  it('shows the prompt and 4 options, scores a correct answer', () => {
    const onComplete = vi.fn();
    render(
      <ConjugationDrillEngine
        verbs={[pisati]}
        cells={cells}
        onComplete={onComplete}
        award={vi.fn()}
        goBack={vi.fn()}
      />,
    );
    // prompt shows infinitive + person
    expect(screen.getByText(/pisati/)).toBeTruthy();
    // 4 options rendered
    const opts = screen.getAllByTestId('conj-option');
    expect(opts).toHaveLength(4);
    // click the correct one
    const correct = opts.find((o) => o.textContent?.trim() === 'pišem')!;
    fireEvent.click(correct);
    expect(screen.getByTestId('conj-feedback').textContent).toMatch(/✓|Correct|Točno/);
  });
});
