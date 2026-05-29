/**
 * fbSaveProgress-write-amplification.test.ts — Regression guard for commit 44e45e1.
 *
 * Bug (2026-05-28): fbSaveProgress wrote the hot document users/{id} TWICE per
 * save — the writeBatch, then _reconcileAtomicStats as a SEPARATE immediate
 * updateDoc. Two back-to-back writes to one document blew past Firestore's
 * ~1 write/sec/document soft limit during bursts, backing up the SDK mutation
 * queue until it logged "Write stream exhausted maximum allowed queued writes".
 *
 * Fix: fold the atomic-array reconciliation (stats.vs / ct / badges arrayUnion)
 * INTO the existing batch via set({ merge: true }). One write per save.
 *
 * These tests lock that in: if anyone re-introduces a separate reconcile write,
 * `updateDoc` will be called during a plain save and the first test fails.
 *
 * Unlike sync-integrity.test.ts (which mocks firebase.js wholesale to test pure
 * helpers), this suite imports the REAL firebase.ts and mocks only the Firestore
 * SDK, so it exercises the actual fbSaveProgress write path.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Spies shared between the hoisted vi.mock factory and the test body.
const m = vi.hoisted(() => {
  const batchSet = vi.fn();
  const batchCommit = vi.fn(() => Promise.resolve());
  return {
    batchSet,
    batchCommit,
    writeBatch: vi.fn(() => ({ set: batchSet, commit: batchCommit })),
    updateDoc: vi.fn(() => Promise.resolve()),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
    doc: vi.fn((_db: unknown, coll: string, id: string) => ({ coll, id })),
    arrayUnion: vi.fn((...args: unknown[]) => ({ __op: 'arrayUnion', values: args })),
    serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
    increment: vi.fn((n: number) => ({ __op: 'increment', n })),
  };
});

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  initializeAuth: vi.fn(() => ({})),
  getAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  browserSessionPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  memoryLocalCache: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
  deleteDoc: vi.fn(),
  doc: m.doc,
  getDoc: m.getDoc,
  setDoc: m.setDoc,
  updateDoc: m.updateDoc,
  writeBatch: m.writeBatch,
  arrayUnion: m.arrayUnion,
  serverTimestamp: m.serverTimestamp,
  increment: m.increment,
}));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));
// Identity-ish doc-id mapping so we can find the users/{id} set call by collection.
vi.mock('../lib/userKey.js', () => ({ toDocId: (s: string) => 'doc_' + s }));

type SaveProgress = (
  uid: string,
  data: Record<string, unknown>,
) => Promise<{ ok: boolean; code?: string }>;

let fbSaveProgress: SaveProgress;

/** Find the batch.set(...) call that targeted the users collection. */
function usersSetCall(): unknown[] | undefined {
  return m.batchSet.mock.calls.find((c) => (c[0] as { coll?: string })?.coll === 'users');
}

beforeAll(async () => {
  // initFirebase() runs at module load and bails unless VITE_FIREBASE_API_KEY is set.
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
  ({ fbSaveProgress } = (await import('../lib/firebase.js')) as unknown as {
    fbSaveProgress: SaveProgress;
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('fbSaveProgress — single write to users/{id} (no reconcile double-write)', () => {
  it('commits the batch once and issues NO separate updateDoc', async () => {
    const res = await fbSaveProgress('user@example.com', {
      name: 'Test',
      stats: { xp: 10, lc: 2, vs: ['a', 'b'], ct: ['A1'], badges: ['first'] },
    });
    expect(res.ok).toBe(true);
    expect(m.batchCommit).toHaveBeenCalledTimes(1);
    // The regression: _reconcileAtomicStats used to fire updateDoc here.
    expect(m.updateDoc).not.toHaveBeenCalled();
  });

  it('folds stats.vs / ct / badges arrayUnion into the batched users write', async () => {
    await fbSaveProgress('user@example.com', {
      name: 'Test',
      stats: { xp: 10, vs: ['a', 'b'], ct: ['A1'], badges: ['first'] },
    });
    const call = usersSetCall();
    expect(call).toBeTruthy();
    const userEntry = call![1] as { stats?: Record<string, unknown> };
    const options = call![2] as { merge?: boolean };
    // merge:true is required for the nested-stats deep-merge to preserve xp/lc.
    expect(options).toEqual({ merge: true });
    expect(userEntry.stats).toBeDefined();
    expect(userEntry.stats!.vs).toEqual({ __op: 'arrayUnion', values: ['a', 'b'] });
    expect(userEntry.stats!.ct).toEqual({ __op: 'arrayUnion', values: ['A1'] });
    expect(userEntry.stats!.badges).toEqual({ __op: 'arrayUnion', values: ['first'] });
  });

  it('omits the stats union entirely when there are no arrays to reconcile', async () => {
    const res = await fbSaveProgress('user@example.com', { name: 'T', stats: { xp: 5 } });
    expect(res.ok).toBe(true);
    expect(m.updateDoc).not.toHaveBeenCalled();
    const userEntry = usersSetCall()![1] as { stats?: unknown };
    // No empty-arrayUnion write — nothing to union means no stats key at all.
    expect(userEntry.stats).toBeUndefined();
  });

  it('filters non-string members out of the reconciled arrays', async () => {
    await fbSaveProgress('user@example.com', {
      stats: { vs: ['a', 123, null, 'b'] },
    });
    expect(m.arrayUnion).toHaveBeenCalledWith('a', 'b');
  });

  it('still writes both the users and profiles docs in the batch', async () => {
    await fbSaveProgress('user@example.com', { name: 'Test', stats: { xp: 1 } });
    const colls = m.batchSet.mock.calls.map((c) => (c[0] as { coll?: string })?.coll);
    expect(colls).toContain('users');
    expect(colls).toContain('profiles');
  });
});
