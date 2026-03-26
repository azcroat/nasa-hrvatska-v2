/**
 * components.test.jsx — render tests for shared and practice components.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Mock Firebase ─────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
}));

// ── XPPopup ───────────────────────────────────────────────────────────────────
import XPPopup from '../components/shared/XPPopup.jsx';

describe('XPPopup', () => {
  it('renders without crashing', () => {
    render(<XPPopup showXP={false} xpA={0} />);
  });
  it('has role="status" for screen readers', () => {
    render(<XPPopup showXP={true} xpA={10} />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('shows +XP text when visible with positive amount', () => {
    const { container } = render(<XPPopup showXP={true} xpA={25} />);
    // XP amount animates from 0; verify the component communicates 25 XP via aria-label
    expect(container.firstChild.getAttribute('aria-label')).toMatch(/25/);
  });
  it('shows already-earned message when xpA is 0', () => {
    render(<XPPopup showXP={true} xpA={0} />);
    expect(screen.getByRole('status').textContent).toMatch(/max xp earned today|already earned/i);
  });
  it('has aria-live="polite"', () => {
    const { container } = render(<XPPopup showXP={true} xpA={5} />);
    expect(container.firstChild.getAttribute('aria-live')).toBe('polite');
  });
  it('has aria-atomic="true"', () => {
    const { container } = render(<XPPopup showXP={true} xpA={5} />);
    expect(container.firstChild.getAttribute('aria-atomic')).toBe('true');
  });
  it('provides aria-label when visible', () => {
    const { container } = render(<XPPopup showXP={true} xpA={10} />);
    expect(container.firstChild.getAttribute('aria-label')).toMatch(/10 xp/i);
  });
});

// ── Flashcards ────────────────────────────────────────────────────────────────
// Needs data.jsx mocks for srMark
vi.mock('../data.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    H: (title, sub) => React.createElement('div', null,
      React.createElement('h2', null, title),
      React.createElement('p', null, sub)
    ),
    Bar: ({ v, mx }) => React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import Flashcards from '../components/practice/Flashcards.jsx';

const SAMPLE_POOL = [
  ['kuća', 'house', 'KOO-cha'],
  ['pas', 'dog', 'pas'],
  ['mačka', 'cat', 'MACH-ka'],
];

describe('Flashcards', () => {
  const goBack = vi.fn();
  const award = vi.fn();

  it('renders without crashing', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
  });
  it('shows the first Croatian word', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    expect(screen.getByText('kuća')).toBeTruthy();
  });
  it('shows card index counter', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    expect(screen.getByText(`1 / ${SAMPLE_POOL.length}`)).toBeTruthy();
  });
  it('flip buttons are not visible before card is flipped', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    expect(screen.queryByText(/How well did you know it/i)).toBeNull();
    expect(screen.queryByText(/Perfect/i)).toBeNull();
  });
  it('shows flip buttons after clicking the card', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    const card = screen.getByRole('button', { name: /tap to see English/i });
    fireEvent.click(card);
    expect(screen.getByText(/How well did you know it/i)).toBeTruthy();
    expect(screen.getByText(/Perfect/i)).toBeTruthy();
  });
  it('card has role="button" and tabIndex=0 for keyboard access', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    const card = screen.getByRole('button', { name: /tap to see English/i });
    expect(card.tabIndex).toBe(0);
  });
  it('Enter key flips the card', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    const card = screen.getByRole('button', { name: /tap to see English/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByText(/How well did you know it/i)).toBeTruthy();
  });
  it('Space key flips the card', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    const card = screen.getByRole('button', { name: /tap to see English/i });
    fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByText(/How well did you know it/i)).toBeTruthy();
  });
  it('shows completion screen when pool is empty', () => {
    render(<Flashcards pool={[]} goBack={goBack} award={award} />);
    expect(screen.getByText(/All caught up/i)).toBeTruthy();
    expect(screen.getByText(/Continue/i)).toBeTruthy();
  });
  it('shows phonetic hint when provided', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    expect(screen.getByText('/KOO-cha/')).toBeTruthy();
  });
  it('progress bar is present', () => {
    render(<Flashcards pool={SAMPLE_POOL} goBack={goBack} award={award} />);
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});
