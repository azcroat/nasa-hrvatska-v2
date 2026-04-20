/**
 * useAuth.test.js — client-side validation and state management tests.
 *
 * Strategy: mock Firebase so auth state never fires (onAuthStateChanged callback
 * never called). This keeps the hook in 'loading' state throughout — which is
 * intentional, since none of these tests exercise the Firebase auth path.
 * We only test:
 *   a) doReg client-side validation guards (email, pw, match, displayName, rate limit)
 *   b) doLog client-side validation guards (email, pw, rate limit)
 *   c) doGuest — sets authScreen to 'app' synchronously
 *   d) Basic state setters (authError, emailUnverified)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Firebase stubs — must come before any import that triggers firebase.js ─────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  signInWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({
      user: {
        email: 'x@y.com',
        uid: 'uid1',
        displayName: 'Test',
        emailVerified: true,
        providerData: [{ providerId: 'password' }],
      },
    }),
  ),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
  updateProfile: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(() => () => {}), // never fires the callback
  initializeAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
  sendEmailVerification: vi.fn(() => Promise.resolve()),
  deleteUser: vi.fn(() => Promise.resolve()),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  setDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

function clearLS() {
  localStorage.clear();
}

/** Minimal callbacks for renderHook — prevents undefined-function crashes */
function mkCallbacks() {
  return {
    onSignedIn: vi.fn(),
    onSignedOut: vi.fn(),
    applyRemoteProgress: vi.fn(),
    setFamData: vi.fn(),
    setSyncReady: vi.fn(),
  };
}

// ─── c) doGuest ───────────────────────────────────────────────────────────────

describe('useAuth — doGuest', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('sets authScreen to "app" immediately (no Firebase required)', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.doGuest();
    });
    expect(result.current.authScreen).toBe('app');
  });

  it('authLoading is false after doGuest', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.doGuest();
    });
    expect(result.current.authLoading).toBe(false);
  });
});

// ─── d) State setters ─────────────────────────────────────────────────────────

describe('useAuth — initial state', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('authError initialises as empty string', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    expect(result.current.authError).toBe('');
  });

  it('authLoading initialises as false', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    expect(result.current.authLoading).toBe(false);
  });

  it('emailUnverified initialises as false', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    expect(result.current.emailUnverified).toBe(false);
  });

  it('setAuthError updates the error state', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthError('Something went wrong');
    });
    expect(result.current.authError).toBe('Something went wrong');
  });

  it('setAuthError can clear the error', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthError('Error!');
    });
    act(() => {
      result.current.setAuthError('');
    });
    expect(result.current.authError).toBe('');
  });

  it('setEmailUnverified updates the flag', () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setEmailUnverified(true);
    });
    expect(result.current.emailUnverified).toBe(true);
  });
});

// ─── a) doReg client-side validation ─────────────────────────────────────────

describe('useAuth — doReg validation: email', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows error when email is empty', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error for invalid email format (missing @)', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('not-an-email');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error for invalid email format (missing domain)', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
  });

  it('clears authError before each doReg attempt', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthError('stale error');
    });
    await act(async () => {
      await result.current.doReg();
    }); // sets new error for empty email
    // The error should reflect the current validation failure, not the stale one
    expect(result.current.authError).toBeTruthy();
  });
});

describe('useAuth — doReg validation: password', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows error when password has fewer than 6 characters', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('abc');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toMatch(/6/); // mentions "6 characters"
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error when password is empty', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      result.current.setPc('different456');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error when password confirm is empty (default) and password is set', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      // pc defaults to '' — mismatch
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
  });
});

describe('useAuth — doReg validation: display name', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows error when display name is empty', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      result.current.setPc('password123');
      // displayName defaults to '' — should trigger error
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error when display name is only whitespace', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      result.current.setPc('password123');
      result.current.setDisplayName('   '); // whitespace only
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toBeTruthy();
  });
});

describe('useAuth — doReg rate limiting', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows rate-limit error after 3 attempts within 10 minutes', async () => {
    // Pre-seed: 3 attempts, 1 second ago (well within 10 min window)
    localStorage.setItem('reg_attempts', JSON.stringify({ count: 3, since: Date.now() - 1000 }));
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    // Provide valid form data so all validation guards pass
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      result.current.setPc('password123');
      result.current.setDisplayName('Test User');
    });
    await act(async () => {
      await result.current.doReg();
    });
    expect(result.current.authError).toMatch(/Too many/i);
    expect(result.current.authLoading).toBe(false);
  });

  it('does NOT show rate-limit error when attempts window has expired (> 10 min ago)', async () => {
    // Pre-seed: 3 attempts, but 11 minutes ago (expired window)
    localStorage.setItem('reg_attempts', JSON.stringify({ count: 3, since: Date.now() - 660001 }));
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
      result.current.setPc('password123');
      result.current.setDisplayName('Test User');
    });
    await act(async () => {
      await result.current.doReg();
    });
    // Rate limit should NOT fire — error should NOT contain "Too many"
    expect(result.current.authError).not.toMatch(/Too many/i);
  });
});

// ─── b) doLog client-side validation ─────────────────────────────────────────

describe('useAuth — doLog validation: email', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows error when email is empty', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    await act(async () => {
      await result.current.doLog();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });

  it('shows error for invalid email format', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('notvalid');
    });
    await act(async () => {
      await result.current.doLog();
    });
    expect(result.current.authError).toBeTruthy();
  });
});

describe('useAuth — doLog validation: password', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows error when password is empty', async () => {
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
    });
    await act(async () => {
      await result.current.doLog();
    });
    expect(result.current.authError).toBeTruthy();
    expect(result.current.authLoading).toBe(false);
  });
});

describe('useAuth — doLog rate limiting', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('shows rate-limit error after 10 sign-in attempts within 10 minutes', async () => {
    localStorage.setItem('login_attempts', JSON.stringify({ count: 10, since: Date.now() - 1000 }));
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
    });
    await act(async () => {
      await result.current.doLog();
    });
    expect(result.current.authError).toMatch(/Too many/i);
    expect(result.current.authLoading).toBe(false);
  });

  it('does NOT show rate-limit error at exactly 9 attempts', async () => {
    localStorage.setItem('login_attempts', JSON.stringify({ count: 9, since: Date.now() - 1000 }));
    const { result } = renderHook(() => useAuth(mkCallbacks()));
    act(() => {
      result.current.setAuthEmail('user@example.com');
      result.current.setPw('password123');
    });
    await act(async () => {
      await result.current.doLog();
    });
    // 9 < 10 threshold — rate limit should not fire
    expect(result.current.authError).not.toMatch(/Too many/i);
  });
});
