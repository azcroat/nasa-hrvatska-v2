// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  deleteUser,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  doc as fsDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  increment,
  type Firestore,
} from 'firebase/firestore';
import {
  getAnalytics,
  logEvent as _fbLogEvent,
  isSupported as analyticsIsSupported,
} from 'firebase/analytics';
import { toDocId } from './userKey.js';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export let _fbReady = false;
let _fbAuth: Auth | null = null;
let _fbDb: Firestore | null = null;
let _fbAnalytics: ReturnType<typeof getAnalytics> | null = null;

export function initFirebase(): boolean {
  if (_fbReady) return false;
  if (!FIREBASE_CONFIG.apiKey) {
    console.error('Firebase: VITE_FIREBASE_API_KEY is missing. Auth will not work.');
    return false;
  }
  try {
    const app = getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG);
    try {
      _fbAuth = initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
        ],
      });
    } catch (_authErr) {
      // auth/already-initialized — app was already set up, just retrieve the existing instance
      _fbAuth = getAuth(app);
    }
    try {
      _fbDb = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch (_e1) {
      try {
        _fbDb = initializeFirestore(app, { localCache: persistentLocalCache() });
      } catch (_e2) {
        try {
          _fbDb = initializeFirestore(app, { localCache: memoryLocalCache() });
        } catch (_e3) {
          _fbDb = getFirestore(app);
        }
      }
    }
    _fbReady = true;
    if (FIREBASE_CONFIG.measurementId) {
      analyticsIsSupported()
        .then(function (ok) {
          if (ok) _fbAnalytics = getAnalytics(app);
        })
        .catch(function () {});
    }
    return true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error('Firebase init failed:', err?.code || err?.message || 'unknown');
    return false;
  }
}
initFirebase();

export function fbLogEvent(eventName: string, params?: Record<string, unknown>): void {
  try {
    if (_fbAnalytics) _fbLogEvent(_fbAnalytics, eventName, params || {});
  } catch {}
}
export function getDb(): Firestore | null {
  return _fbDb;
}

// ═══ LOCAL PROGRESS & SESSION STORAGE ═══
export function gP(u: string): unknown {
  try {
    return JSON.parse(localStorage.getItem('uP_' + u) || 'null');
  } catch {
    return null;
  }
}
export function sP(u: string, p: unknown): void {
  localStorage.setItem('uP_' + u, JSON.stringify(p));
  fbSaveProgress(u, p as Record<string, unknown>).catch(() => {});
}
export function lP(u: string, p: unknown): void {
  localStorage.setItem('uP_' + u, JSON.stringify(p));
}
export function gS(): unknown {
  try {
    return JSON.parse(localStorage.getItem('uS') || 'null');
  } catch {
    return null;
  }
}
export function sS(s: Record<string, unknown>): void {
  localStorage.setItem('uS', JSON.stringify({ ...s, lastActive: Date.now() }));
}
export function cS(): void {
  localStorage.removeItem('uS');
}
export function touchSession(): void {
  const s = gS() as Record<string, unknown> | null;
  if (s) localStorage.setItem('uS', JSON.stringify({ ...s, lastActive: Date.now() }));
}
export function isSessionExpired(): boolean {
  const s = gS() as { lastActive?: number } | null;
  if (!s || !s.lastActive) return true;
  return Date.now() - s.lastActive > 30 * 60 * 1000;
}
export function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ═══ FIREBASE SYNC ═══

/**
 * Reconcile atomic stats.vs / stats.ct / stats.badges with the full arrays
 * from the current progress snapshot. Uses arrayUnion (idempotent) so it is
 * safe to call on every save. Fire-and-forget — failures are silently swallowed.
 *
 * Why this exists: writeDelta only fires for individual completions at the
 * moment they happen. If the device was offline, or the user was in guest mode,
 * writeDelta is skipped and stats.vs never receives those completions. When the
 * progress blob is later overwritten by another device, the completions would
 * disappear from the load-side union (blob.vs ∪ stats.vs). Reconciling on every
 * fbSaveProgress call guarantees stats.vs is always a superset of the blob.
 */
function _reconcileAtomicStats(docId: string, st: Record<string, unknown>): void {
  if (!_fbDb) return;
  // Cooldown gate — same write queue, same back-off. Skip silently; the
  // next fbSaveProgress after cooldown will run reconciliation then.
  if (_resourceExhaustedAt && Date.now() - _resourceExhaustedAt < FB_COOLDOWN_MS) return;
  try {
    const _rv = (st.vs as string[] | undefined)?.filter((s) => typeof s === 'string') ?? [];
    const _rc = (st.ct as string[] | undefined)?.filter((s) => typeof s === 'string') ?? [];
    const _rb = (st.badges as string[] | undefined)?.filter((s) => typeof s === 'string') ?? [];
    const _rec: Record<string, unknown> = {};
    if (_rv.length) _rec['stats.vs'] = arrayUnion(..._rv);
    if (_rc.length) _rec['stats.ct'] = arrayUnion(..._rc);
    if (_rb.length) _rec['stats.badges'] = arrayUnion(..._rb);
    if (Object.keys(_rec).length) {
      updateDoc(fsDoc(_fbDb, 'users', docId), _rec).catch((e: unknown) => {
        // If the SDK queue saturates here too, engage the global cooldown
        // so subsequent writes back off rather than piling on.
        if ((e as { code?: string })?.code === 'resource-exhausted') {
          _resourceExhaustedAt = Date.now();
        }
      });
    }
  } catch (_) {}
}

// ─── Retry infrastructure ──────────────────────────────────────────────────
// Transient Firestore error codes that are safe to retry. All other codes
// (permission-denied, not-found, unauthenticated, invalid-argument, etc.)
// are non-transient and are thrown immediately after a single attempt.
//
// Note: 'resource-exhausted' is intentionally NOT in this set. When the
// Firestore SDK's client-side write queue is full (typical message:
// "Write stream exhausted maximum allowed queued writes"), retrying
// adds MORE writes to the queue and worsens the saturation. The right
// response is to back off entirely and let the SDK drain — handled via
// the cooldown gate at the top of fbSaveProgress.
const _RETRYABLE_CODES = new Set([
  'unavailable', // Service temporarily unavailable (most common)
  'deadline-exceeded', // Operation timed out
  'internal', // Unexpected server error
]);

// Cooldown gate. When fbSaveProgress sees `resource-exhausted` from the
// Firestore SDK, we record the timestamp and refuse to enqueue further
// writes for FB_COOLDOWN_MS. localStorage remains authoritative; the
// next save attempt after the cooldown re-enables Firestore sync. The
// SDK's own max-backoff (it logs "Using maximum backoff delay …") drains
// the queue in the background during the cooldown.
const FB_COOLDOWN_MS = 30_000;
let _resourceExhaustedAt = 0;

/**
 * Retry an async operation with exponential backoff for transient Firestore errors.
 * Non-retryable errors are re-thrown immediately. Each retry and terminal failure
 * is recorded via Firebase Analytics (sync_retry / sync_error events) for
 * server-side observability without exposing PII.
 *
 * Delays (base ±30% jitter): 600 ms → 1.2 s → 2.4 s
 */
async function _withRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
  // Global cooldown gate. If a previous write surfaced resource-exhausted,
  // refuse to issue further reads/writes until the SDK's internal queue has
  // had FB_COOLDOWN_MS to drain. Throws a synthetic 'cooldown' error so
  // callers' catch blocks handle it without retry pressure.
  if (_resourceExhaustedAt && Date.now() - _resourceExhaustedAt < FB_COOLDOWN_MS) {
    const err = new Error('Firestore queue cooldown') as Error & { code: string };
    err.code = 'cooldown';
    throw err;
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastErr = e;
      const code = (e as { code?: string })?.code ?? 'unknown';
      // Any write path that surfaces resource-exhausted engages the global
      // cooldown — not just fbSaveProgress. This stops fbApplyDelta /
      // fbSaveSRS from continuing to enqueue writes into a saturated SDK
      // queue while the cooldown set by another caller drains.
      if (code === 'resource-exhausted') {
        _resourceExhaustedAt = Date.now();
        console.warn(
          `[sync] ${label}: SDK write queue saturated — entering ` +
            FB_COOLDOWN_MS / 1000 +
            's cooldown. localStorage is authoritative; sync will resume after cooldown.',
        );
      }
      if (!_RETRYABLE_CODES.has(code) || attempt === maxAttempts - 1) {
        fbLogEvent('sync_error', { fn: label, code, attempt });
        throw e;
      }
      const baseMs = 600 * Math.pow(2, attempt); // 600 → 1200 → 2400
      const delayMs = Math.round(baseMs * (0.7 + 0.6 * Math.random())); // ±30% jitter
      fbLogEvent('sync_retry', { fn: label, code, attempt, delay_ms: delayMs });
      console.warn(
        `[sync] ${label} attempt ${attempt + 1}/${maxAttempts} failed (${code}), retrying in ${delayMs}ms`,
      );
      await new Promise<void>((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr; // unreachable — satisfies TypeScript
}

export async function fbSaveProgress(
  uid: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; err?: string; code?: string }> {
  if (!_fbReady || !_fbDb) return { ok: false, err: 'Firebase not initialized' };
  // Cooldown gate — if a previous call hit resource-exhausted, skip this
  // attempt to avoid piling further writes on a saturated SDK queue.
  // localStorage remains authoritative (sP writes there first), so no data
  // is lost — just deferred sync. The cooldown expires after FB_COOLDOWN_MS.
  if (_resourceExhaustedAt && Date.now() - _resourceExhaustedAt < FB_COOLDOWN_MS) {
    return { ok: false, err: 'Firestore queue cooldown', code: 'cooldown' };
  }
  // Flush any pending coalesced fbApplyDelta writes before the full snapshot
  // save. Both writes target the same user document, and the snapshot blob
  // includes the incremented stats already — so without a flush, the next
  // periodic-save can land BEFORE the queued delta and lose the increment's
  // cross-device atomicity. Awaiting the flush keeps the write order sane.
  await _flushPendingDelta();
  const id = toDocId(uid);
  const _st = (data.stats || data.st || {}) as Record<string, unknown>;
  const _strk =
    data.streak && typeof (data.streak as Record<string, unknown>).count === 'number'
      ? (data.streak as Record<string, number>).count
      : typeof _st.str === 'number'
        ? _st.str
        : 0;
  // Prefer data.nh_level (present in buildProgressSnapshot output) over data.level,
  // then fall back to localStorage (browser only). Avoids 'A1' regression in Worker context
  // where localStorage is undefined and the beacon payload is used server-side.
  const _lvlRaw =
    data.nh_level ||
    data.level ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nh_level') || 'A1' : 'A1');
  const _CEFR_NUM: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
  const _lvl =
    typeof _lvlRaw === 'number' && _lvlRaw >= 1 ? _lvlRaw : _CEFR_NUM[_lvlRaw as string] || 1;
  const _nowMs = Date.now();
  // useSyncManager and doSyncNow write with the raw uid key ('uP_' + uid).
  // Try raw uid first, fall back to toDocId key for legacy snapshots.
  const _cachedP = (gP(uid) || gP(id)) as Record<string, unknown> | null;
  const _cachedSt =
    (_cachedP && ((_cachedP.stats || _cachedP.st) as Record<string, unknown>)) || {};
  const _bestXP = Math.max((_st.xp as number) || 0, (_cachedSt.xp as number) || 0);
  const _bestLC = Math.max((_st.lc as number) || 0, (_cachedSt.lc as number) || 0);
  const _cachedStrk =
    _cachedP && typeof (_cachedP.streak as Record<string, unknown>)?.count === 'number'
      ? (_cachedP.streak as Record<string, number>).count!
      : (_cachedSt.str as number) || 0;
  const _bestStrk = Math.max(_strk as number, _cachedStrk);
  const _cachedLvlRaw = _cachedP && _cachedP.level;
  const _cachedLvl =
    typeof _cachedLvlRaw === 'number' ? _cachedLvlRaw : _CEFR_NUM[_cachedLvlRaw as string] || 1;
  const _bestLvl = Math.max(_lvl, _cachedLvl);
  // Save SRS data separately to avoid the 200KB progress blob limit.
  // Fire-and-forget — SRS sync failure is non-critical (localStorage is authoritative).
  if (data.sr && typeof data.sr === 'object') {
    fbSaveSRS(uid, data.sr as Record<string, unknown>).catch(() => {});
  }
  // Exclude SRS from the progress blob (it now lives in srs/{id})
  const { sr: _sr, ...dataWithoutSRS } = data;
  const _progressJson = JSON.stringify(dataWithoutSRS);
  const profileEntry = {
    name: (data.name as string) || '',
    xp: _bestXP,
    lc: _bestLC,
    streak: _bestStrk,
    level: _bestLvl,
    lastActive: _nowMs,
  };
  // Note: xp and lessonsCompleted are intentionally excluded from userEntry.
  // fbApplyDelta owns both top-level fields via atomic increments (increment(v)).
  // Writing absolute values here would race with another device's fbApplyDelta:
  //   - If device B has already incremented Firestore xp/lessonsCompleted above
  //     _bestXP/_bestLC, writing the local snapshot regresses the Firestore value.
  //   - For xp: the monotonic validXpUpdate() rule would also cause permission-denied,
  //     failing the entire batch and losing the progress blob write.
  //   - For lessonsCompleted: no rule enforces monotonicity, so the regression is
  //     silent — Firestore accepts the lower value without error.
  // fbApplyDelta's increment() is idempotent-safe: if fbApplyDelta was skipped
  // (offline/guest), stats.lc in the progress blob is the authoritative fallback
  // loaded by fbLoadProgress via the Math.max merge at read time.
  const userEntry = {
    progress: _progressJson,
    updated: serverTimestamp(),
    level: _bestLvl,
    streak: _bestStrk,
    lastActive: serverTimestamp(),
  };

  // ── WriteBatch is recreated on each attempt — the SDK batch object is not
  // guaranteed to be re-committable after a failed commit, so we build a fresh
  // batch inside the _withRetry closure to make each attempt fully independent.
  try {
    await _withRetry(async () => {
      const b = writeBatch(_fbDb!);
      b.set(fsDoc(_fbDb!, 'users', id), userEntry, { merge: true });
      b.set(fsDoc(_fbDb!, 'profiles', id), profileEntry, { merge: true });
      await b.commit();
    }, 'fbSaveProgress');
    // ── Atomic reconciliation ─────────────────────────────────────────────────
    // Ensure stats.vs / stats.ct / stats.badges are a strict superset of the
    // progress blob. This rescues completions that were done offline (when
    // writeDelta was a no-op) before they can be lost by another device
    // overwriting the progress blob. arrayUnion is idempotent — safe to call
    // on every save. Fire-and-forget: non-critical since the main save succeeded.
    _reconcileAtomicStats(id, _st);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    // resource-exhausted and cooldown are already logged by _withRetry; only
    // log unexpected failures here to avoid duplicate console noise.
    if (err?.code !== 'resource-exhausted' && err?.code !== 'cooldown') {
      console.error('[sync] fbSaveProgress failed:', err?.code, err?.message);
    }
    return {
      ok: false,
      err: err?.message || 'Progress could not be saved. Check your connection.',
      code: err?.code,
    };
  }
}

// 2026-05-21 BUG FIX: fbApplyDelta was firing one Firestore write per call,
// which meant every XP grant from useAward (potentially many per session)
// translated 1:1 into a write to the user document. Combined with the 60 s
// periodic fbSaveProgress, SRS saves, and family doc writes, a single power-
// user day could exceed Firebase Spark plan's 20 000 writes/day cap → all
// subsequent saves return code=resource-exhausted with exponential backoff
// and sync is silently broken until midnight PT.
//
// Fix: coalesce calls in a short window. Multiple fbApplyDelta calls within
// COALESCE_MS sum their numeric deltas and union their array deltas, then
// flush as ONE write. Writes still use Firestore increment()/arrayUnion(),
// so cross-device atomicity is preserved (no client-side race possible —
// the merged write sums client-local accumulator before the increment).
const _DELTA_NUMERIC = ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'pf', 'mv', 'hi'];
const _DELTA_ARRAYS = ['ct', 'vs', 'badges'];
// 2026-05-22: reduced from 4 s → 1.2 s as defense against pending-delta loss
// on hard tab close. fbSaveProgress flushes pending deltas via
// _flushPendingDelta(), and the unload/visibilitychange/pagehide handlers in
// useSyncManager call fbSaveProgress — but the async chain may not complete
// before the browser kills the page on close. A smaller window narrows the
// loss exposure to ~1 s. Still ~5x fewer writes than no batching, so we keep
// most of the quota benefit while reducing the worst-case data loss.
const COALESCE_MS = 1200;

let _pendingDelta: Record<string, unknown> = {};
let _pendingUid: string | null = null;
let _coalesceTimer: ReturnType<typeof setTimeout> | null = null;

function _mergeDelta(into: Record<string, unknown>, from: Record<string, unknown>): void {
  for (const k of _DELTA_NUMERIC) {
    const v = from[k];
    if (typeof v === 'number' && v > 0) {
      into[k] = ((into[k] as number) || 0) + v;
    }
  }
  for (const k of _DELTA_ARRAYS) {
    const arr = from[k];
    if (Array.isArray(arr) && arr.length > 0) {
      const existing = (into[k] as unknown[]) || [];
      into[k] = [...new Set([...existing, ...arr])];
    }
  }
}

async function _flushPendingDelta(): Promise<void> {
  if (_coalesceTimer !== null) {
    clearTimeout(_coalesceTimer);
    _coalesceTimer = null;
  }
  const uid = _pendingUid;
  const delta = _pendingDelta;
  _pendingUid = null;
  _pendingDelta = {};
  if (!uid || Object.keys(delta).length === 0) return;
  await _fbApplyDeltaImmediate(uid, delta);
}

export async function fbApplyDelta(uid: string, delta: Record<string, unknown>): Promise<void> {
  if (!_fbReady || !_fbDb || !uid || !delta) return;
  // If a different user, flush the old user's pending write before queuing
  // the new one — never merge across user contexts.
  if (_pendingUid && _pendingUid !== uid) {
    await _flushPendingDelta();
  }
  _pendingUid = uid;
  _mergeDelta(_pendingDelta, delta);
  if (_coalesceTimer !== null) clearTimeout(_coalesceTimer);
  _coalesceTimer = setTimeout(() => {
    void _flushPendingDelta();
  }, COALESCE_MS);
}

/** Force-flush any pending delta — call from beforeunload / hidden / sign-out paths. */
export async function fbFlushPendingDelta(): Promise<void> {
  await _flushPendingDelta();
}

async function _fbApplyDeltaImmediate(uid: string, delta: Record<string, unknown>): Promise<void> {
  if (!_fbReady || !_fbDb || !uid || !delta) return;
  const _NUMERIC = _DELTA_NUMERIC;
  const _ARRAYS = _DELTA_ARRAYS;
  const id = toDocId(uid);
  const update: Record<string, unknown> = {};
  let hasUpdate = false;
  for (const k of _NUMERIC) {
    const v = delta[k];
    if (typeof v === 'number' && v > 0) {
      update['stats.' + k] = increment(v);
      if (k === 'xp') update.xp = increment(v);
      if (k === 'lc') update.lessonsCompleted = increment(v);
      hasUpdate = true;
    }
  }
  for (const k of _ARRAYS) {
    const arr = delta[k];
    if (Array.isArray(arr) && arr.length > 0) {
      update['stats.' + k] = arrayUnion(...arr);
      hasUpdate = true;
    }
  }
  if (!hasUpdate) return;
  try {
    await _withRetry(() => updateDoc(fsDoc(_fbDb!, 'users', id), update), 'fbApplyDelta');
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'not-found') {
      // User doc doesn't exist yet — seed it with the stats payload (no increment needed).
      try {
        const seed: Record<string, unknown> = {};
        for (const k of _NUMERIC) {
          if (typeof delta[k] === 'number' && (delta[k] as number) > 0) seed[k] = delta[k];
        }
        for (const k of _ARRAYS) {
          if (Array.isArray(delta[k]) && (delta[k] as unknown[]).length > 0) seed[k] = delta[k];
        }
        await setDoc(fsDoc(_fbDb!, 'users', id), { stats: seed }, { merge: true });
      } catch (e2: unknown) {
        console.warn(
          '[sync] fbApplyDelta setDoc fallback failed:',
          (e2 as { code?: string })?.code,
        );
      }
    }
    // Transient errors are already logged + retried by _withRetry; no additional log needed.
  }
}

export async function fbLoadProgress(uid: string): Promise<Record<string, unknown> | null> {
  if (!_fbReady || !_fbDb) return null;
  const id = toDocId(uid);
  // Use _withRetry for the Firestore read — retries only on transient errors (unavailable,
  // deadline-exceeded, etc.), not on permission-denied or not-found. The old fixed-2s loop
  // would retry even non-transient errors uselessly; _withRetry fails fast on those.
  let snap: Awaited<ReturnType<typeof getDoc>>;
  try {
    snap = await _withRetry(() => getDoc(fsDoc(_fbDb!, 'users', id)), 'fbLoadProgress');
  } catch (e) {
    console.warn('[sync] fbLoadProgress failed:', (e as { code?: string })?.code);
    return null;
  }
  if (!snap.exists()) return null;
  const _sd = snap.data({ serverTimestamps: 'estimate' }) as Record<string, unknown>;
  if (!_sd.progress) return null;
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(_sd.progress as string);
  } catch (pe) {
    console.warn('fbLoadProgress: corrupted progress JSON', pe);
    return null;
  }
  const _upd = _sd.updated as { toMillis?: () => number } | number | null;
  if (_upd)
    p._fbUpdated = typeof _upd === 'object' && _upd.toMillis ? _upd.toMillis() : Number(_upd);
  if (_sd.stats) {
    const _as = _sd.stats as Record<string, unknown>;
    const _bs = (p.stats || p.st || {}) as Record<string, unknown>;
    p.stats = {
      ..._bs,
      ..._as,
      xp: Math.max((_bs.xp as number) || 0, (_as.xp as number) || 0),
      lc: Math.max((_bs.lc as number) || 0, (_as.lc as number) || 0),
      gc: Math.max((_bs.gc as number) || 0, (_as.gc as number) || 0),
      sp: Math.max((_bs.sp as number) || 0, (_as.sp as number) || 0),
      de: Math.max((_bs.de as number) || 0, (_as.de as number) || 0),
      rc: Math.max((_bs.rc as number) || 0, (_as.rc as number) || 0),
      pf: Math.max((_bs.pf as number) || 0, (_as.pf as number) || 0),
      mv: Math.max((_bs.mv as number) || 0, (_as.mv as number) || 0),
      hi: Math.max((_bs.hi as number) || 0, (_as.hi as number) || 0),
      ct: [...new Set([...((_bs.ct as string[]) || []), ...((_as.ct as string[]) || [])])],
      vs: [...new Set([...((_bs.vs as string[]) || []), ...((_as.vs as string[]) || [])])],
      badges: [
        ...new Set([...((_bs.badges as string[]) || []), ...((_as.badges as string[]) || [])]),
      ],
      // rs: ordered score history — keep the longer array (more entries = more complete)
      rs:
        ((_bs.rs as string[]) || []).length >= ((_as.rs as string[]) || []).length
          ? (_bs.rs as string[]) || []
          : (_as.rs as string[]) || [],
    };
  }
  // Load SRS from its dedicated document and merge back (non-blocking if it fails)
  try {
    const srsSnap = await getDoc(fsDoc(_fbDb, 'srs', id));
    if (srsSnap.exists()) {
      const srsData = srsSnap.data() as { cards?: Record<string, unknown> };
      if (srsData.cards && Object.keys(srsData.cards).length > 0) {
        p.sr = srsData.cards;
      }
    }
  } catch (srsErr) {
    console.warn(
      '[srs] Could not load SRS from subcollection:',
      (srsErr as { code?: string })?.code,
    );
  }
  return p;
}

/** Save SRS card state to a dedicated Firestore document (avoids the 200KB progress blob limit). */
export async function fbSaveSRS(uid: string, srData: Record<string, unknown>): Promise<void> {
  if (!_fbReady || !_fbDb || !srData || Object.keys(srData).length === 0) return;
  const id = toDocId(uid);
  try {
    await _withRetry(
      () =>
        setDoc(
          fsDoc(_fbDb!, 'srs', id),
          { cards: srData, updated: serverTimestamp() },
          { merge: true },
        ),
      'fbSaveSRS',
    );
  } catch (e: unknown) {
    // Transient errors logged by _withRetry; log non-transient codes here for local debugging.
    console.warn('[srs] fbSaveSRS failed:', (e as { code?: string })?.code);
  }
}

/** Load SRS card state from its dedicated Firestore document. */
export async function fbLoadSRS(uid: string): Promise<Record<string, unknown> | null> {
  if (!_fbReady || !_fbDb) return null;
  const id = toDocId(uid);
  try {
    const snap = await getDoc(fsDoc(_fbDb, 'srs', id));
    if (snap.exists()) {
      const data = snap.data() as { cards?: Record<string, unknown> };
      return data.cards || null;
    }
    return null;
  } catch (e: unknown) {
    console.warn('[srs] fbLoadSRS failed:', (e as { code?: string })?.code);
    return null;
  }
}

export async function fbRegister(
  email: string,
  password: string,
  displayName: string,
): Promise<{ ok: boolean; err?: string; user?: User }> {
  if (!_fbReady || !_fbAuth)
    return { ok: false, err: 'Firebase not configured. Account created locally only.' };
  try {
    const cred = await createUserWithEmailAndPassword(_fbAuth, email, password);
    try {
      await updateProfile(cred.user, { displayName });
    } catch (pe) {
      console.warn('Profile update failed:', pe);
    }
    try {
      await sendEmailVerification(cred.user);
    } catch (ve) {
      console.warn('Email verification send failed:', ve);
    }
    try {
      const id = toDocId(email);
      await setDoc(
        fsDoc(_fbDb!, 'users', id),
        { displayName, email, created: Date.now() },
        { merge: true },
      );
    } catch (fe) {
      console.warn('Firestore profile write failed:', fe);
    }
    fbLogEvent('sign_up', { method: 'email' });
    return { ok: true, user: cred.user };
  } catch (e: unknown) {
    return { ok: false, err: friendlyError((e as Error).message) };
  }
}

export async function fbLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; err?: string; user?: User }> {
  if (!_fbReady || !_fbAuth) return { ok: false, err: 'Firebase not configured.' };
  try {
    const cred = await signInWithEmailAndPassword(_fbAuth, email, password);
    fbLogEvent('login', { method: 'email' });
    return { ok: true, user: cred.user };
  } catch (e: unknown) {
    return { ok: false, err: friendlyError((e as Error).message) };
  }
}

export async function fbLogout(): Promise<void> {
  if (_fbReady && _fbAuth)
    try {
      await fbSignOut(_fbAuth);
    } catch (e) {}
  import('./pushNotifications')
    .then(({ cancelAllNotificationTimers }) => {
      try {
        cancelAllNotificationTimers();
      } catch (_) {}
    })
    .catch(() => {});
}

export async function fbLoginGoogle(): Promise<{ ok: boolean; err?: string; user?: User }> {
  if (!_fbReady || !_fbAuth) return { ok: false, err: 'Firebase not configured.' };
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(_fbAuth, provider);
    fbLogEvent('login', { method: 'google' });
    return { ok: true, user: cred.user };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request')
      return { ok: false, err: '' };
    return { ok: false, err: friendlyError(err.message || '') };
  }
}

export async function fbResetPassword(email: string): Promise<{ ok: boolean; err?: string }> {
  if (!_fbReady || !_fbAuth) return { ok: false, err: 'Firebase not configured.' };
  try {
    await sendPasswordResetEmail(_fbAuth, email);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, err: friendlyError((e as Error).message) };
  }
}

export function friendlyError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('email-already-in-use'))
    return 'This email already has an account. Try signing in instead!';
  if (msg.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (msg.includes('invalid-email')) return 'Please enter a valid email address.';
  if (
    msg.includes('user-not-found') ||
    msg.includes('wrong-password') ||
    msg.includes('invalid-credential')
  )
    return 'Invalid email or password.';
  if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes.';
  if (msg.includes('network-request-failed')) return 'No internet connection. Check your WiFi.';
  if (msg.includes('unauthorized-domain'))
    return 'Authentication blocked. Please try again or contact support.';
  if (msg.includes('permission-denied') || msg.includes('permission'))
    return 'Permission error — please try again or contact support.';
  if (msg.includes('user-disabled')) return 'This account has been disabled. Contact support.';
  if (msg.includes('account-exists-with-different-credential'))
    return 'An account already exists with this email using a different sign-in method.';
  if (msg.includes('requires-recent-login'))
    return 'Please sign out and sign in again to complete this action.';
  if (msg.includes('popup-closed-by-user')) return 'Sign-in was cancelled. Please try again.';
  if (msg.includes('internal-error')) return 'A server error occurred. Please try again.';
  if (msg.includes('quota-exceeded'))
    return 'Service temporarily unavailable. Please try again later.';
  if (msg.includes('app-not-authorized')) return 'App not authorized. Please contact support.';
  if (msg.includes('expired-action-code'))
    return 'This link has expired. Please request a new one.';
  if (msg.includes('invalid-action-code')) return 'This link is invalid or has already been used.';
  if (msg.includes('missing-email')) return 'Please enter your email address.';
  return (
    msg
      .replace(/Firebase:\s*/i, '')
      .replace(/\([^)]+\)\.?/, '')
      .trim() || 'Something went wrong.'
  );
}

export function fbOnAuthStateChanged(cb: (user: User | null) => void): () => void {
  if (!_fbReady || !_fbAuth) {
    // Firebase not ready (e.g. missing config) — signal "no user" so auth flow completes
    // rather than leaving syncReady permanently false on the caller side.
    setTimeout(() => cb(null), 0);
    return () => {};
  }
  return onAuthStateChanged(_fbAuth, cb);
}

export async function fbDeleteAccount(userId: string): Promise<{ ok: boolean; err?: string }> {
  if (!_fbReady) return { ok: false, err: 'Firebase not ready.' };
  try {
    const id = toDocId(userId);
    await Promise.allSettled([
      deleteDoc(fsDoc(_fbDb!, 'users', id)),
      deleteDoc(fsDoc(_fbDb!, 'profiles', id)),
      deleteDoc(fsDoc(_fbDb!, 'srs', id)),
    ]);
    if (_fbAuth && _fbAuth.currentUser) await deleteUser(_fbAuth.currentUser);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, err: friendlyError((e as Error).message) };
  }
}

export async function fbExportUserData(uid: string): Promise<Record<string, unknown>> {
  try {
    const id = toDocId(uid);
    const [userDoc, profileDoc] = await Promise.all([
      getDoc(fsDoc(_fbDb!, 'users', id)),
      getDoc(fsDoc(_fbDb!, 'profiles', id)),
    ]);
    const localData: Record<string, unknown> = {};
    const keysToExport = [
      'nh_sr',
      'xpCooldown',
      'uStreak',
      'nh_streak_repair',
      'nh_placement_done',
      'nh_level',
      'nh_goal',
      'nh_onboarded',
      'nh_favorites',
      'nh_dark',
      'nh_sound',
      'topic_accuracy',
      'nh_journey',
      'nh_install_date',
      'nh_letter_to_self',
      'nh_font_size',
      'nh_reduce_motion',
      'nh_prestige',
      'cookie_consent_v1',
      'cookieConsent',
      'uS',
    ];
    keysToExport.forEach(function (key) {
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      try {
        localData[key] = JSON.parse(raw);
      } catch {
        localData[key] = raw;
      }
    });
    const progressRaw = localStorage.getItem('uP_' + id);
    if (progressRaw) {
      try {
        localData['uP_' + id] = JSON.parse(progressRaw);
      } catch {
        localData['uP_' + id] = progressRaw;
      }
    }
    const fsProgress = userDoc.exists()
      ? (userDoc.data({ serverTimestamps: 'estimate' }) as Record<string, unknown>)
      : null;
    const fsProfile = profileDoc.exists() ? profileDoc.data() : null;
    if (fsProgress) delete fsProgress.password;
    return {
      exportDate: new Date().toISOString(),
      account: { uid: id },
      firestore: { progress: fsProgress, profile: fsProfile },
      localStorage: localData,
    };
  } catch (err) {
    console.error('fbExportUserData failed:', err);
    throw err;
  }
}

export function fbWatchProgress(
  uid: string,
  callback: (progress: Record<string, unknown>, updatedAt: number) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!_fbReady || !_fbDb) return () => {};
  const id = toDocId(uid);
  return onSnapshot(
    fsDoc(_fbDb, 'users', id),
    function (snap) {
      if (!snap.exists()) return;
      const _wd = snap.data({ serverTimestamps: 'estimate' }) as Record<string, unknown>;
      if (!_wd.progress) return;
      try {
        const p = JSON.parse(_wd.progress as string) as Record<string, unknown>;
        const _wu = _wd.updated as { toMillis?: () => number } | number | null;
        p._fbUpdated = _wu
          ? typeof _wu === 'object' && _wu.toMillis
            ? _wu.toMillis()
            : Number(_wu)
          : 0;
        if (_wd.stats) {
          const _as = _wd.stats as Record<string, unknown>;
          const _bs = (p.stats || p.st || {}) as Record<string, unknown>;
          p.stats = {
            ..._bs,
            ..._as,
            xp: Math.max((_bs.xp as number) || 0, (_as.xp as number) || 0),
            lc: Math.max((_bs.lc as number) || 0, (_as.lc as number) || 0),
            gc: Math.max((_bs.gc as number) || 0, (_as.gc as number) || 0),
            sp: Math.max((_bs.sp as number) || 0, (_as.sp as number) || 0),
            de: Math.max((_bs.de as number) || 0, (_as.de as number) || 0),
            rc: Math.max((_bs.rc as number) || 0, (_as.rc as number) || 0),
            pf: Math.max((_bs.pf as number) || 0, (_as.pf as number) || 0),
            mv: Math.max((_bs.mv as number) || 0, (_as.mv as number) || 0),
            hi: Math.max((_bs.hi as number) || 0, (_as.hi as number) || 0),
            // str (streak count) is not written by fbApplyDelta, so it only lives in the
            // progress blob. A stale blob overwrite (e.g. Desktop pushing xp=old data)
            // would silently drop Mobile's streak. Math.max here prevents that regression.
            str: Math.max((_bs.str as number) || 0, (_as.str as number) || 0),
            ct: [...new Set([...((_bs.ct as string[]) || []), ...((_as.ct as string[]) || [])])],
            vs: [...new Set([...((_bs.vs as string[]) || []), ...((_as.vs as string[]) || [])])],
            badges: [
              ...new Set([
                ...((_bs.badges as string[]) || []),
                ...((_as.badges as string[]) || []),
              ]),
            ],
            // rs: score history — keep the longer array (more entries = more complete history)
            rs:
              ((_bs.rs as string[]) || []).length >= ((_as.rs as string[]) || []).length
                ? (_bs.rs as string[]) || []
                : (_as.rs as string[]) || [],
          };
        }
        if (_wd.favs_live) {
          try {
            const _lf = JSON.parse(_wd.favs_live as string) as Array<Record<string, string>>;
            const _lts = _wd.favs_live_ts
              ? typeof (_wd.favs_live_ts as { toMillis?: () => number }).toMillis === 'function'
                ? (_wd.favs_live_ts as { toMillis: () => number }).toMillis()
                : Number(_wd.favs_live_ts)
              : 0;
            const _bts = (p._fbUpdated as number) || 0;
            const _bk = new Set(
              ((p.favs as Array<Record<string, string>>) || []).map(function (f) {
                return f.hr || f.name;
              }),
            );
            for (const _f of _lf) {
              if (!_bk.has(_f.hr || _f.name)) {
                (p.favs = (p.favs as unknown[]) || []).push(_f);
                _bk.add(_f.hr || _f.name);
              }
            }
            // NOTE: Previously this block used intersection (filter) to prune favs based on
            // favs_live timestamp. This silently dropped offline-added favourites when
            // another device's toggle was more recent. Removed: favourites are additive-only
            // via the union above; explicit removal requires fbToggleFavorite (tombstoning).
          } catch (_) {}
        }
        callback(p, p._fbUpdated as number);
      } catch (e) {
        console.warn('fbWatchProgress parse error:', e);
      }
    },
    function (err) {
      console.warn('fbWatchProgress error:', err);
      if (onError) onError(err as Error);
    },
  );
}

export async function fbToggleFavorite(uid: string, favsList: unknown[]): Promise<void> {
  if (!_fbReady || !_fbDb || !uid) return;
  const id = toDocId(uid);
  try {
    await setDoc(
      fsDoc(_fbDb, 'users', id),
      { favs_live: JSON.stringify(favsList), favs_live_ts: serverTimestamp() },
      { merge: true },
    );
  } catch (e) {
    console.warn('fbToggleFavorite error:', e);
  }
}

export async function fbGetIdToken(): Promise<string> {
  if (!_fbAuth || !_fbAuth.currentUser) return '';
  try {
    return await _fbAuth.currentUser.getIdToken(false);
  } catch {
    return '';
  }
}
