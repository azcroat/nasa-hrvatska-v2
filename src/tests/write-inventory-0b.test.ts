/**
 * write-inventory-0b.test.ts — Roadmap item 0b: quantify the write inventory to
 * the hot document users/{id}.
 *
 * Phase 2 (Firestore hot-doc sharding, HIGH risk) is GATED on this measurement:
 * we only pay for sharding if the real write rate to users/{id} warrants it.
 * The acute "resource-exhausted / write stream exhausted" symptom was already
 * fixed in 44e45e1 (single-write fbSaveProgress + COALESCE_MS coalescing +
 * removal of the 3-min pull). 0b confirms whether that fix is sufficient.
 *
 * Approach: import the REAL firebase.ts and mock only the Firestore SDK (same
 * pattern as fbSaveProgress-write-amplification.test.ts), then COUNT the writes
 * that actually hit the users collection for each entry point. Per-action costs
 * are exact (counted from the SDK mock); the heavy-session total is those costs
 * applied to a documented, pessimistic activity profile. Deterministic and
 * CI-repeatable — a regression that re-inflates the hot path fails here.
 *
 * Limits we compare against:
 *   - Firestore soft limit: ~1 sustained write/sec/document.
 *   - Firebase Spark plan: 20,000 document writes/day (ALL docs, not per-doc).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

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
vi.mock('../lib/userKey.js', () => ({ toDocId: (s: string) => 'doc_' + s }));

type SaveProgress = (
  uid: string,
  data: Record<string, unknown>,
) => Promise<{ ok: boolean; code?: string }>;
type ApplyDelta = (uid: string, delta: Record<string, unknown>) => Promise<void>;
type FlushDelta = () => Promise<void>;
type ToggleFav = (uid: string, favsList: unknown[]) => Promise<void>;

let fbSaveProgress: SaveProgress;
let fbApplyDelta: ApplyDelta;
let fbFlushPendingDelta: FlushDelta;
let fbToggleFavorite: ToggleFav;

const UID = 'user@example.com';

/** Count writes that actually hit the users/{id} document across all SDK paths. */
function usersWrites(): number {
  const isUsers = (c: unknown[]) => (c[0] as { coll?: string })?.coll === 'users';
  return (
    m.batchSet.mock.calls.filter(isUsers).length +
    m.updateDoc.mock.calls.filter(isUsers).length +
    m.setDoc.mock.calls.filter(isUsers).length
  );
}

beforeAll(async () => {
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
  ({ fbSaveProgress, fbApplyDelta, fbFlushPendingDelta, fbToggleFavorite } =
    (await import('../lib/firebase.js')) as unknown as {
      fbSaveProgress: SaveProgress;
      fbApplyDelta: ApplyDelta;
      fbFlushPendingDelta: FlushDelta;
      fbToggleFavorite: ToggleFav;
    });
});

afterAll(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── Per-action write costs (exact, counted from the SDK mock) ─────────────────
describe('0b write inventory — per-action cost to users/{id}', () => {
  it('fbApplyDelta: a DENSE burst (gaps < COALESCE_MS) coalesces to 1 write', async () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 30; i++) {
        void fbApplyDelta(UID, { xp: 1 });
        await vi.advanceTimersByTimeAsync(500); // 500ms < 3000ms window → keeps coalescing
      }
      expect(usersWrites()).toBe(0); // still pending
      await vi.advanceTimersByTimeAsync(3000);
      expect(usersWrites()).toBe(1); // 30 awards → ONE write
    } finally {
      await fbFlushPendingDelta().catch(() => {});
      vi.useRealTimers();
    }
  });

  it('fbApplyDelta: SPACED awards (gaps > COALESCE_MS) write 1:1 (coalescing does NOT help)', async () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 5; i++) {
        void fbApplyDelta(UID, { xp: 1 });
        await vi.advanceTimersByTimeAsync(3001); // each gap exceeds the window → each flushes
      }
      // 5 spaced awards → 5 writes. This is the Phase-2-relevant worst case: the
      // coalesce timer RESETS per award, so only dense bursts collapse.
      expect(usersWrites()).toBe(5);
    } finally {
      await fbFlushPendingDelta().catch(() => {});
      vi.useRealTimers();
    }
  });

  it('fbSaveProgress (no pending delta): exactly 1 write to users/{id}', async () => {
    await fbSaveProgress(UID, { name: 'T', stats: { xp: 5 } });
    expect(usersWrites()).toBe(1); // batch.set(users) only; profiles/{id} is a different doc
  });

  it('fbSaveProgress (with a pending delta): 2 writes — flush + batch', async () => {
    void fbApplyDelta(UID, { xp: 3 }); // queue a delta
    await fbSaveProgress(UID, { name: 'T', stats: { xp: 8 } }); // awaits _flushPendingDelta first
    expect(usersWrites()).toBe(2); // 1 updateDoc (flush) + 1 batch.set(users)
  });

  it('fbToggleFavorite: 1 write each, UNCOALESCED (the one un-throttled hot path)', async () => {
    await fbToggleFavorite(UID, ['a']);
    await fbToggleFavorite(UID, ['a', 'b']);
    await fbToggleFavorite(UID, ['a', 'b', 'c']);
    expect(usersWrites()).toBe(3); // no coalescing — 3 toggles → 3 writes
  });
});

// ── Heavy-session projection ──────────────────────────────────────────────────
// Per-action costs above are exact. The daily total applies them to a documented,
// deliberately PESSIMISTIC "power user" profile so the Phase 2 decision errs safe.
describe('0b write inventory — heavy-session projection vs limits', () => {
  it('a pessimistic power-user day stays well under the Spark 20k/day cap', () => {
    const SPARK_DAILY_CAP = 20_000;

    // Profile (pessimistic):
    const ACTIVE_HOURS = 2; // sustained active play
    const SECONDS_PER_ITEM = 5; // an XP-awarding item every ~5s → > 3s, so ~1:1 (no coalesce help)
    const FAVORITES_PER_DAY = 40; // uncoalesced toggles
    const PERIODIC_MS = 5 * 60 * 1000; // fbSaveProgress periodic tick (signature-gated)

    const activeSeconds = ACTIVE_HOURS * 3600;
    const applyDeltaWrites = Math.floor(activeSeconds / SECONDS_PER_ITEM); // worst case 1:1
    const favoriteWrites = FAVORITES_PER_DAY;
    // Periodic batch writes (the pending-delta flush each carries is already
    // counted in applyDeltaWrites, so count only the batch's users write here).
    const periodicWrites = Math.floor((ACTIVE_HOURS * 3600 * 1000) / PERIODIC_MS);

    const usersDocWritesPerDay = applyDeltaWrites + favoriteWrites + periodicWrites;

    // Peak sustained rate to users/{id}:
    //   - dense burst: coalesced to 1 write / 3s   = 0.33/s
    //   - spaced play: 1 write / 5s                = 0.20/s
    // Both under the ~1 write/sec/doc soft limit.
    const peakDenseRatePerSec = 1 / 3;
    const peakSpacedRatePerSec = 1 / SECONDS_PER_ITEM;

    console.log(
      '[0b] users/{id} write inventory (pessimistic power-user day):\n' +
        `  fbApplyDelta (spaced, ~1:1):  ${applyDeltaWrites}\n` +
        `  fbToggleFavorite:             ${favoriteWrites}\n` +
        `  fbSaveProgress (periodic 5m): ${periodicWrites}\n` +
        `  TOTAL users/{id} writes/day:  ${usersDocWritesPerDay}  (${(
          (usersDocWritesPerDay / SPARK_DAILY_CAP) *
          100
        ).toFixed(1)}% of Spark 20k cap)\n` +
        `  peak rate: dense ${peakDenseRatePerSec.toFixed(2)}/s, spaced ${peakSpacedRatePerSec.toFixed(
          2,
        )}/s (soft limit 1/s)`,
    );

    expect(usersDocWritesPerDay).toBeLessThan(SPARK_DAILY_CAP);
    // Headroom assertion: even this pessimistic day uses < 25% of the cap.
    expect(usersDocWritesPerDay).toBeLessThan(SPARK_DAILY_CAP * 0.25);
    // Sustained rate stays under the per-doc soft limit.
    expect(peakDenseRatePerSec).toBeLessThan(1);
    expect(peakSpacedRatePerSec).toBeLessThan(1);
  });
});
