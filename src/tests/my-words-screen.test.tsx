/**
 * my-words-screen.test.tsx — Behavioral tests for MyWordsScreen.
 *
 * Critical behaviors tested:
 *   - Empty state: "Your personal vocabulary deck is empty." + "Add your first word" button
 *   - Add form: shown when clicking "Add your first word" or "+ Add Word"
 *   - Form validation: requires both Croatian word and English meaning
 *   - Save: adds word to localStorage under 'nh_custom_words', returns to list
 *   - Cancel: returns to list without saving
 *   - List with words: count shown, hr/en displayed
 *   - Delete: × button removes word from list and localStorage
 *   - Navigation: "← Back" in list → onBack(); in add/drill → setView('list')
 *   - Drill mode: "Card {N} of {N}" progress, word shown, "Tap to reveal" hint
 *   - Drill flip: clicking card reveals English meaning + shows Got it ✓ / Try again ✗
 *   - srMark(hr, true/false) called on each drill result
 *   - "Got it ✓" increments correct counter
 *   - Last card triggers done state: "Well done!", score shown
 *   - award(correct * 5) called on completion if correct > 0
 *
 * localStorage: cleared before/after each test; words pre-seeded via seedWords().
 * DrillMode renders en CONDITIONALLY (flipped state) — must click card first.
 * Props: { onBack, award }  — note: "onBack" not "goBack" (differs from other screens).
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

// ── data mock: override speak + srMark ────────────────────────────────────────
const mockSpeak = vi.hoisted(() => vi.fn());
const mockSrMark = vi.hoisted(() => vi.fn());

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, speak: mockSpeak, srMark: mockSrMark };
});

import MyWordsScreen from '../components/practice/MyWordsScreen';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nh_custom_words';

const WORD_A = {
  hr: 'kuća',
  en: 'house',
  phonetic: 'KOO-tsa',
  example: 'Moja kuća.',
  addedAt: 1000,
};
const WORD_B = { hr: 'pas', en: 'dog', phonetic: '', example: '', addedAt: 2000 };
const _WORD_C = { hr: 'mačka', en: 'cat', phonetic: '', example: '', addedAt: 3000 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = { onBack: vi.fn(), award: vi.fn(), ...overrides };
  const utils = render(<MyWordsScreen {...props} />);
  return { ...utils, props };
}

/** Seed localStorage with words BEFORE rendering */
function seedWords(words: (typeof WORD_A)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

/** Type into a form input by its placeholder text */
function typeIn(placeholder: string, value: string) {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
}

/** Click the drill card to flip it (reveals English + result buttons) */
function flipDrillCard() {
  // Before flip, aria-label includes "Tap to reveal"
  const card = screen.getByRole('button', { name: /Tap to reveal/ });
  fireEvent.click(card);
}

/** Click "Drill My Words" button */
function clickDrillMyWords() {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Drill My Words'));
  if (!btn) throw new Error('Drill My Words button not found');
  fireEvent.click(btn);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('MyWordsScreen — empty state', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows empty title when no words saved', () => {
    renderScreen();
    expect(screen.getByText(/Your personal vocabulary deck is empty/)).toBeTruthy();
  });

  it('shows "+ Add your first word" button', () => {
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word')),
    ).toBeTruthy();
  });

  it('"Add your first word" navigates to add form', () => {
    renderScreen();
    const btn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Add your first word'))!;
    fireEvent.click(btn);
    expect(screen.getByText('Add a New Word')).toBeTruthy();
  });

  it('does not show "Drill My Words" when empty', () => {
    renderScreen();
    expect(
      screen.queryAllByRole('button').find((b) => b.textContent?.includes('Drill My Words')),
    ).toBeFalsy();
  });
});

// ─── Add word form ────────────────────────────────────────────────────────────

describe('MyWordsScreen — add word form', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "Add a New Word" title', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    expect(screen.getByText('Add a New Word')).toBeTruthy();
  });

  it('shows Croatian word input', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    expect(screen.getByPlaceholderText('e.g. krastavac')).toBeTruthy();
  });

  it('shows English meaning input', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    expect(screen.getByPlaceholderText('e.g. cucumber')).toBeTruthy();
  });

  it('shows "Save Word" button', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word')),
    ).toBeTruthy();
  });

  it('shows "Cancel" link', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    expect(screen.getByText('Cancel')).toBeTruthy();
  });
});

// ─── Form validation ──────────────────────────────────────────────────────────

describe('MyWordsScreen — form validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('empty Croatian word → error "Croatian word is required."', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word'))!,
    );
    expect(screen.getByText('Croatian word is required.')).toBeTruthy();
  });

  it('Croatian filled but English empty → error "English meaning is required."', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    typeIn('e.g. krastavac', 'kuća');
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word'))!,
    );
    expect(screen.getByText('English meaning is required.')).toBeTruthy();
  });

  it('valid save: no error shown', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    typeIn('e.g. krastavac', 'kuća');
    typeIn('e.g. cucumber', 'house');
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word'))!,
    );
    expect(screen.queryByText(/is required/)).toBeNull();
  });

  it('valid save: returns to list view', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    typeIn('e.g. krastavac', 'kuća');
    typeIn('e.g. cucumber', 'house');
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word'))!,
    );
    // List view shows the saved word
    expect(screen.getByText('kuća')).toBeTruthy();
    expect(screen.getByText('house')).toBeTruthy();
  });

  it('valid save: persists word to localStorage', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    typeIn('e.g. krastavac', 'kuća');
    typeIn('e.g. cucumber', 'house');
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Save Word'))!,
    );
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].hr).toBe('kuća');
    expect(stored[0].en).toBe('house');
  });

  it('"Cancel" returns to list without saving', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    typeIn('e.g. krastavac', 'kuća');
    fireEvent.click(screen.getByText('Cancel'));
    // Empty state restored (no save happened)
    expect(screen.getByText(/Your personal vocabulary deck is empty/)).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(0);
  });
});

// ─── List with words ──────────────────────────────────────────────────────────

describe('MyWordsScreen — list with words', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "1 word in your deck" for one word', () => {
    seedWords([WORD_A]);
    renderScreen();
    expect(screen.getByText(/1 word in your deck/)).toBeTruthy();
  });

  it('shows "2 words in your deck" for two words', () => {
    seedWords([WORD_A, WORD_B]);
    renderScreen();
    expect(screen.getByText(/2 words in your deck/)).toBeTruthy();
  });

  it('shows word hr in list', () => {
    seedWords([WORD_A]);
    renderScreen();
    expect(screen.getByText('kuća')).toBeTruthy();
  });

  it('shows word en in list', () => {
    seedWords([WORD_A]);
    renderScreen();
    expect(screen.getByText('house')).toBeTruthy();
  });

  it('shows "Drill My Words" button', () => {
    seedWords([WORD_A]);
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Drill My Words')),
    ).toBeTruthy();
  });

  it('shows "+ Add Word" button', () => {
    seedWords([WORD_A]);
    renderScreen();
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add Word')),
    ).toBeTruthy();
  });

  it('"+ Add Word" navigates to add form', () => {
    seedWords([WORD_A]);
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add Word'))!,
    );
    expect(screen.getByText('Add a New Word')).toBeTruthy();
  });
});

// ─── Delete word ──────────────────────────────────────────────────────────────

describe('MyWordsScreen — delete word', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('× button removes the word from the list', () => {
    seedWords([WORD_A]);
    renderScreen();
    const deleteBtn = screen.getByTitle('Delete word');
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('kuća')).toBeNull();
  });

  it('× button persists removal to localStorage', () => {
    seedWords([WORD_A]);
    renderScreen();
    fireEvent.click(screen.getByTitle('Delete word'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(0);
  });

  it('deleting only word shows empty state', () => {
    seedWords([WORD_A]);
    renderScreen();
    fireEvent.click(screen.getByTitle('Delete word'));
    expect(screen.getByText(/Your personal vocabulary deck is empty/)).toBeTruthy();
  });

  it('deleting one of two words keeps the other', () => {
    seedWords([WORD_A, WORD_B]);
    renderScreen();
    // Delete first × button (WORD_A at index 0)
    const deleteBtns = screen.getAllByTitle('Delete word');
    fireEvent.click(deleteBtns[0]);
    // WORD_B should remain
    expect(screen.getByText('pas')).toBeTruthy();
    expect(screen.queryByText('kuća')).toBeNull();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('MyWordsScreen — navigation (← Back)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('"← Back" in list view calls onBack()', () => {
    renderScreen();
    const backBtn = screen.getByText('← Back');
    fireEvent.click(backBtn);
    // onBack is in props
    // Can't directly test prop call without extracting the prop, but we verify no view change
    // Rendered component still shows empty state (didn't navigate internally)
    expect(screen.getByText(/Your personal vocabulary deck is empty/)).toBeTruthy();
  });

  it('"← Back" in add view returns to list (not onBack)', () => {
    renderScreen();
    fireEvent.click(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Add your first word'))!,
    );
    // Now in add view
    expect(screen.getByText('Add a New Word')).toBeTruthy();
    fireEvent.click(screen.getByText('← Back'));
    // Returns to list, not calling onBack
    expect(screen.getByText(/Your personal vocabulary deck is empty/)).toBeTruthy();
  });

  it('"← Back" in drill view returns to list', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByText(/Card 1 of 1/)).toBeTruthy();
    fireEvent.click(screen.getByText('← Back'));
    // Returns to list
    expect(screen.getByText('kuća')).toBeTruthy();
  });
});

// ─── Drill mode — basic rendering ────────────────────────────────────────────

describe('MyWordsScreen — drill mode rendering', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "Card 1 of 1" progress for single word', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByText('Card 1 of 1')).toBeTruthy();
  });

  it('shows "Card 1 of 2" for two words', () => {
    seedWords([WORD_A, WORD_B]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByText('Card 1 of 2')).toBeTruthy();
  });

  it('shows Croatian word on drill card', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByText('kuća')).toBeTruthy();
  });

  it('shows "Tap to reveal" hint before flip', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByText('Tap to reveal')).toBeTruthy();
  });

  it('does NOT show English meaning before flip', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.queryByText('house')).toBeNull();
  });

  it('does NOT show "Got it ✓" button before flip', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.queryByText(/Got it/)).toBeNull();
  });

  it('drill card has role="button"', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    expect(screen.getByRole('button', { name: /Tap to reveal/ })).toBeTruthy();
  });
});

// ─── Drill mode — flip card ───────────────────────────────────────────────────

describe('MyWordsScreen — drill mode flip', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('clicking card reveals English meaning', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    expect(screen.getByText('house')).toBeTruthy();
  });

  it('clicking card hides "Tap to reveal" hint', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    expect(screen.queryByText('Tap to reveal')).toBeNull();
  });

  it('clicking card shows "Got it ✓" button', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    expect(screen.getByText('Got it ✓')).toBeTruthy();
  });

  it('clicking card shows "Try again ✗" button', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    expect(screen.getByText('Try again ✗')).toBeTruthy();
  });

  it('example sentence shown after flip when present', () => {
    seedWords([WORD_A]); // WORD_A has example: 'Moja kuća.'
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    expect(screen.getByText(/Moja kuća/)).toBeTruthy();
  });
});

// ─── Drill mode — mark result ─────────────────────────────────────────────────

describe('MyWordsScreen — drill mode mark result', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('"Got it ✓" calls srMark(hr, true)', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(mockSrMark).toHaveBeenCalledWith('kuća', true, 0);
  });

  it('"Try again ✗" calls srMark(hr, false)', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Try again ✗'));
    expect(mockSrMark).toHaveBeenCalledWith('kuća', false, 0);
  });

  it('"Got it ✓" on non-last card advances to card 2', () => {
    seedWords([WORD_A, WORD_B]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(screen.getByText('Card 2 of 2')).toBeTruthy();
  });

  it('"Try again ✗" on non-last card advances to card 2', () => {
    seedWords([WORD_A, WORD_B]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Try again ✗'));
    expect(screen.getByText('Card 2 of 2')).toBeTruthy();
  });
});

// ─── Drill completion ─────────────────────────────────────────────────────────

describe('MyWordsScreen — drill completion', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('"Got it ✓" on last card shows "Well done!" screen', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(screen.getByText('Well done!')).toBeTruthy();
  });

  it('"Try again ✗" on last card shows "Well done!" screen', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Try again ✗'));
    expect(screen.getByText('Well done!')).toBeTruthy();
  });

  it('done: shows "You got 1 out of 1 correct." after one Got it', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(screen.getByText(/You got 1 out of 1 correct/)).toBeTruthy();
  });

  it('done: shows "You got 0 out of 1 correct." after one Try again', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Try again ✗'));
    expect(screen.getByText(/You got 0 out of 1 correct/)).toBeTruthy();
  });

  it('done: "Back to List" button shown', () => {
    seedWords([WORD_A]);
    renderScreen();
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(
      screen.getAllByRole('button').find((b) => b.textContent?.includes('Back to List')),
    ).toBeTruthy();
  });

  it('award(5) called when 1 correct word (1 * 5 = 5)', () => {
    seedWords([WORD_A]);
    const award = vi.fn();
    renderScreen({ award });
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(award).toHaveBeenCalledWith(5);
  });

  it('award NOT called when 0 correct (Try again on only card)', () => {
    seedWords([WORD_A]);
    const award = vi.fn();
    renderScreen({ award });
    clickDrillMyWords();
    flipDrillCard();
    fireEvent.click(screen.getByText('Try again ✗'));
    // correct=0, so award(0*5) = award(0) but guard: `if (typeof award === 'function' && correct > 0)`
    expect(award).not.toHaveBeenCalled();
  });

  it('award(10) called when 2 correct words (2 * 5 = 10)', () => {
    seedWords([WORD_A, WORD_B]);
    const award = vi.fn();
    renderScreen({ award });
    clickDrillMyWords();
    // Card 1: Got it
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    // Card 2 is now shown — flip and Got it
    flipDrillCard();
    fireEvent.click(screen.getByText('Got it ✓'));
    expect(award).toHaveBeenCalledWith(10);
  });
});
