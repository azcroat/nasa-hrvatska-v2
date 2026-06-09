// src/lib/nativeTransport.ts
// ═══════════════════════════════════════════════════════════
// Shared native transport primitives
// ═══════════════════════════════════════════════════════════
// Neutral module holding the low-level transport primitives shared by both
// `audio.ts` (TTS playback) and `nativePost.ts` (generic native-safe POST).
// Extracting them here breaks the `audio.ts ↔ nativePost.ts` import cycle:
// both modules import these primitives from here, and this module imports
// NOTHING from audio.ts or nativePost.ts.
//
// Contents (moved verbatim from audio.ts to preserve behavior):
//   - getFirebaseBearer / _getFirebaseBearer — Firebase ID-token bearer fetcher
//   - _dataUrlToArrayBuffer — fetch-free data: URL decoder
//   - isNative — re-exported from ./platform (canonical implementation)
import { isNative } from './platform';
import { dbgWarn } from './debugLog';

// R3: re-export the platform `isNative` so the shared native-safe POST helper
// (`_nativePost` in ./nativePost), audio.ts, and their tests can import both
// transport primitives (`getFirebaseBearer` + `isNative`) from a single module.
// Behavior is the canonical `./platform` implementation — pure re-export.
export { isNative };

// Server-side /api/tts and /api/content/* require Firebase auth (security
// audit 406d772). Returns the current Firebase user's ID token as a bearer,
// or null if there is no signed-in user.
//
// 2026-05-21 BUG FIX: previously checked auth.currentUser synchronously.
// Firebase restores the user from IndexedDB asynchronously after page load
// — calls during that ~tick window saw currentUser === null and returned
// null. Authenticated endpoints then 401'd, polluting console with
// "Failed to load resource: 401" on every cold start. Now: if the auth
// state has not yet settled, we subscribe to onAuthStateChanged and resolve
// as soon as Firebase decides. Concurrent callers share one promise.
let _bearerPromise: Promise<string | null> | null = null;
let _bearerCachedFor: string | null = null;

async function _getFirebaseBearer(forceRefresh = false): Promise<string | null> {
  try {
    const { getAuth, onAuthStateChanged } = await import('firebase/auth');
    const auth = getAuth();

    // Hot path: auth restored, user known. When forceRefresh, bypass the
    // cached promise — long-running tabs can sit on a stale 1-hour token
    // and a 401 retry needs a guaranteed-fresh mint.
    if (auth.currentUser) {
      if (forceRefresh || _bearerCachedFor !== auth.currentUser.uid) {
        _bearerCachedFor = auth.currentUser.uid;
        _bearerPromise = auth.currentUser.getIdToken(forceRefresh).then((t) => t || null);
      }
      return (await _bearerPromise) ?? null;
    }

    // Cold path: wait for onAuthStateChanged to fire with a NON-NULL user,
    // then mint. Cache the in-flight promise so a burst of fetches shares
    // one observer.
    //
    // 2026-05-21 SECOND BUG FIX: my first attempt unsubscribed on the very
    // first onAuthStateChanged callback, but Firebase fires that callback
    // IMMEDIATELY with user === null on cold load (before IndexedDB
    // restoration completes). The previous logic accepted that null and
    // returned, then content fetches fired unauthenticated. Now we stay
    // subscribed until either:
    //   - a non-null user arrives (the real "auth restored" signal), or
    //   - the 3 s failsafe trips (genuinely unauthenticated / offline).
    if (!_bearerPromise || _bearerCachedFor !== '__pending__') {
      _bearerCachedFor = '__pending__';
      _bearerPromise = new Promise<string | null>((resolve) => {
        let settled = false;
        let unsub: (() => void) | null = null;
        const finish = (t: string | null) => {
          if (settled) return;
          settled = true;
          if (unsub) unsub();
          resolve(t);
        };
        unsub = onAuthStateChanged(auth, async (user) => {
          // Ignore the synchronous null fire — keep waiting for a real user.
          if (!user) return;
          try {
            const token = await user.getIdToken(false);
            _bearerCachedFor = user.uid;
            finish(token || null);
          } catch {
            finish(null);
          }
        });
        // Failsafe: if no user ever arrives (genuinely anonymous, or auth
        // bootstrap failed), resolve null after 6 s so callers don't hang.
        // Bumped from 3 s to 6 s 2026-05-22 — slow devices with large
        // IndexedDB stores or slow disk can take 3-5 s to complete the
        // initial auth restore; 3 s was tripping the timeout on authenticated
        // users and leaking null bearers (→ sporadic 401s on cold load).
        setTimeout(() => finish(null), 6000);
      });
    }
    return await _bearerPromise;
  } catch (e) {
    dbgWarn('[TTS] could not get Firebase ID token:', (e as Error)?.message ?? e);
    return null;
  }
}

// SP5: expose Firebase Bearer fetcher for AI POST wrapper (`_aiPost`).
// Wraps the internal `_getFirebaseBearer` without renaming it (preserves internal call sites).
export async function getFirebaseBearer(forceRefresh = false): Promise<string | null> {
  return _getFirebaseBearer(forceRefresh);
}

// Decode a data: URL to an ArrayBuffer without using fetch() — fetch(data:) is
// unreliable on some Android WebView versions and may throw or return an empty body.
export function _dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma + 1);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
