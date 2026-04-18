/**
 * dictation.test.tsx — Behavioral tests for DictationScreen.
 *
 * Critical behaviors tested:
 *   - Heading, progress counter "1 / 20", level badge "A1" shown on first question
 *   - Play button (▶) calls speak(q.text)
 *   - Diacritic buttons: clicking "Č" appends to input
 *   - "Check ✓" disabled when input is empty; enabled after typing
 *   - Exact match → "✓ Correct!" + score increments + "Next →" button appears
 *   - Close match (without diacritics) → "✓ Close! Watch your diacritics ✍️"
 *   - Wrong answer → "Your answer:" + "Correct answer:" shown
 *   - Wrong answer: "🧠 Explain this sentence" button visible
 *   - Enter key triggers check
 *   - "Next →" clears input + advances to question 2
 *   - Input locked (no change) after checking
 *   - recordTopicResult('listening', true/false) called on check
 *
 * Data: DATA is module-internal (20 items). rnd()→0.99 makes shLocal identity.
 * qs[0] = { text:"Dobar dan, kako ste?", level:"A1" }  (no diacritics, easy exact)
 * qs[1] = { text:"Gdje je najbliža ljekarna?", level:"A1" }  (has ž → close-match)
 *
 * Completion: requires 20 question cycles — not tested here (E2E scope).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ── rnd mock — 0.99 makes shLocal() identity ──────────────────────────────────
vi.mock('../lib/random.js', () => ({ rnd: vi.fn(() => 0.99) }));

// ── quests mock ───────────────────────────────────────────────────────────────
const mockMarkQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── adaptive mock ─────────────────────────────────────────────────────────────
const mockRecordTopicResult = vi.hoisted(() => vi.fn());
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: mockRecordTopicResult }));

// ── apiFetch mock ─────────────────────────────────────────────────────────────
const mockApiFetch = vi.hoisted(() => vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ explanation: 'Test explanation', rule: 'Verb agreement', tip: 'Watch endings', example: '' }) })));
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: mockApiFetch }));

// ── data mock — preserve H, Bar; mock speak ───────────────────────────────────
const mockSpeak = vi.hoisted(() => vi.fn());
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, speak: mockSpeak };
});

import DictationScreen from '../components/practice/DictationScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<DictationScreen {...props} />);
  return { ...utils, props };
}

/** Type text into the dictation input */
function typeInInput(text: string) {
  const input = screen.getByPlaceholderText('Type what you heard...');
  fireEvent.change(input, { target: { value: text } });
}

/** Click the Check ✓ button */
function clickCheck() {
  const checkBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Check'));
  if (!checkBtn) throw new Error('Check button not found');
  fireEvent.click(checkBtn);
}

/** Click the Next → button */
function clickNext() {
  const nextBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Next'));
  if (!nextBtn) throw new Error('Next button not found');
  fireEvent.click(nextBtn);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('DictationScreen — rendering', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('shows "Dictation" in the heading', () => {
    renderScreen();
    expect(screen.getByText(/Dictation/)).toBeTruthy();
  });

  it('shows progress counter "1 / 20" for first question', () => {
    renderScreen();
    expect(screen.getByText('1 / 20')).toBeTruthy();
  });

  it('shows level badge "A1" for first question', () => {
    renderScreen();
    expect(screen.getByText('A1')).toBeTruthy();
  });

  it('shows play button ▶', () => {
    renderScreen();
    expect(screen.getByTitle('Play audio')).toBeTruthy();
  });

  it('shows diacritic buttons (Č, Ć, Š, Ž, Đ and lowercase)', () => {
    renderScreen();
    expect(screen.getByText('Č')).toBeTruthy();
    expect(screen.getByText('Ć')).toBeTruthy();
    expect(screen.getByText('Š')).toBeTruthy();
    expect(screen.getByText('Ž')).toBeTruthy();
    expect(screen.getByText('Đ')).toBeTruthy();
  });

  it('shows input placeholder "Type what you heard..."', () => {
    renderScreen();
    expect(screen.getByPlaceholderText('Type what you heard...')).toBeTruthy();
  });

  it('"Check ✓" button is disabled when input is empty', () => {
    renderScreen();
    const checkBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Check'));
    expect(checkBtn).toBeTruthy();
    expect((checkBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Check ✓" button enabled after typing', () => {
    renderScreen();
    typeInInput('Dobar dan');
    const checkBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Check'));
    expect((checkBtn as HTMLButtonElement).disabled).toBe(false);
  });
});

// ─── Audio ───────────────────────────────────────────────────────────────────

describe('DictationScreen — audio', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('clicking ▶ calls speak with first question text', () => {
    renderScreen();
    fireEvent.click(screen.getByTitle('Play audio'));
    expect(mockSpeak).toHaveBeenCalledWith('Dobar dan, kako ste?');
  });
});

// ─── Diacritic insertion ─────────────────────────────────────────────────────

describe('DictationScreen — diacritic insertion', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('clicking "Č" appends the character to the input', () => {
    renderScreen();
    typeInInput('Dobro');
    fireEvent.click(screen.getByText('Č'));
    const input = screen.getByPlaceholderText('Type what you heard...') as HTMLInputElement;
    expect(input.value).toBe('DobroČ');
  });

  it('clicking "š" appends lowercase diacritic', () => {
    renderScreen();
    typeInInput('baka');
    fireEvent.click(screen.getByText('š'));
    const input = screen.getByPlaceholderText('Type what you heard...') as HTMLInputElement;
    expect(input.value).toBe('bakaš');
  });
});

// ─── Exact match ─────────────────────────────────────────────────────────────

describe('DictationScreen — exact answer', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('exact answer shows "✓ Correct!"', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
  });

  it('exact answer: "Next →" button appears', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Next'))).toBeTruthy();
  });

  it('exact answer: recordTopicResult("listening", true) called', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    expect(mockRecordTopicResult).toHaveBeenCalledWith('listening', true);
  });

  it('exact answer: score counter shows "Score: 1"', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    expect(screen.getByText(/Score: 1/)).toBeTruthy();
  });

  it('exact answer (case-insensitive, no trailing punct): lowercase also correct', () => {
    renderScreen();
    // normalise() lowercases and strips trailing punctuation
    typeInInput('dobar dan, kako ste');
    clickCheck();
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
  });
});

// ─── Close match (diacritics stripped) ───────────────────────────────────────

describe('DictationScreen — close match (missing diacritics)', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('missing diacritics shows "✓ Close! Watch your diacritics ✍️"', () => {
    renderScreen();
    // Advance to question 2: "Gdje je najbliža ljekarna?" (has ž)
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    clickNext();

    // Type without diacritics: "najbliza" instead of "najbliža"
    typeInInput('Gdje je najbliza ljekarna?');
    clickCheck();
    expect(screen.getByText(/Close! Watch your diacritics/)).toBeTruthy();
  });

  it('close match also counts as correct (+1 score)', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    clickNext();

    typeInInput('Gdje je najbliza ljekarna?');
    clickCheck();
    // Score was 1 after question 1, now 2
    expect(screen.getByText(/Score: 2/)).toBeTruthy();
  });
});

// ─── Wrong answer ─────────────────────────────────────────────────────────────

describe('DictationScreen — wrong answer', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('wrong answer shows "Your answer:" line', () => {
    renderScreen();
    typeInInput('Krivi odgovor');
    clickCheck();
    expect(screen.getByText(/Your answer:/)).toBeTruthy();
  });

  it('wrong answer shows "Correct answer:" line', () => {
    renderScreen();
    typeInInput('Krivi odgovor');
    clickCheck();
    expect(screen.getByText(/Correct answer:/)).toBeTruthy();
  });

  it('wrong answer shows "🧠 Explain this sentence" button', () => {
    renderScreen();
    typeInInput('Krivi odgovor');
    clickCheck();
    expect(screen.getByText(/Explain this sentence/)).toBeTruthy();
  });

  it('wrong answer: score stays at 0', () => {
    renderScreen();
    typeInInput('Krivi odgovor');
    clickCheck();
    expect(screen.getByText(/Score: 0/)).toBeTruthy();
  });

  it('wrong answer: recordTopicResult("listening", false) called', () => {
    renderScreen();
    typeInInput('Krivi odgovor');
    clickCheck();
    expect(mockRecordTopicResult).toHaveBeenCalledWith('listening', false);
  });
});

// ─── Input locking ───────────────────────────────────────────────────────────

describe('DictationScreen — input locked after check', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('input cannot be changed after checking', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    // After check, onChange is a no-op due to `if (!checked)` guard
    const input = screen.getByPlaceholderText('Type what you heard...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'NEW VALUE' } });
    expect(input.value).toBe('Dobar dan, kako ste?'); // unchanged
  });
});

// ─── Enter key ───────────────────────────────────────────────────────────────

describe('DictationScreen — Enter key triggers check', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('pressing Enter when input has content triggers check', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    const input = screen.getByPlaceholderText('Type what you heard...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText(/✓ Correct!/)).toBeTruthy();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('DictationScreen — question navigation', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('"Next →" advances progress counter to "2 / 20"', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    clickNext();
    expect(screen.getByText('2 / 20')).toBeTruthy();
  });

  it('"Next →" clears the input field', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    clickNext();
    const input = screen.getByPlaceholderText('Type what you heard...') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('"Next →" shows "Check ✓" button again (not "Next →")', () => {
    renderScreen();
    typeInInput('Dobar dan, kako ste?');
    clickCheck();
    clickNext();
    expect(screen.getAllByRole('button').find(b => b.textContent?.includes('Check'))).toBeTruthy();
    expect(screen.queryByText(/Next →/)).toBeNull();
  });
});
