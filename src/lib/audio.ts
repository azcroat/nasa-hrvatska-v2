// ═══════════════════════════════════════════════════════════
// Audio Engine — Native Croatian Pronunciation
// ═══════════════════════════════════════════════════════════
import { getVoicePreference, getSpeechRate } from './soundSettings';
import { isNative, isIos } from './platform';
import { dbgInfo, dbgWarn, dbgError } from './debugLog';

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

// In Capacitor native builds, relative URLs resolve to the bundled WebView server
// (https://localhost), not to the live domain. We try each endpoint in order and
// use the first one that returns a successful response.
// Two entries guard against the custom domain not being configured in Cloudflare Pages:
//   1. nasahrvatska.com  — production custom domain (primary)
//   2. nasa-hrvatska-v2.pages.dev — Cloudflare Pages default (always works)
const _NATIVE_ENDPOINTS = ['https://nasahrvatska.com', 'https://nasa-hrvatska-v2.pages.dev'];

// Decode a data: URL to an ArrayBuffer without using fetch() — fetch(data:) is
// unreliable on some Android WebView versions and may throw or return an empty body.
function _dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma + 1);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// POST to /api/tts, trying each native endpoint in sequence until one succeeds.
// On web, a single relative URL is used (no fallback needed).
//
// NATIVE PATH: uses CapacitorHttp (Android OkHttp) instead of WebView fetch().
// On some Android tablets the WebView's fetch() fails silently — SSL cert chain
// issues, WebView network policy, or OEM browser restrictions. CapacitorHttp
// bypasses the WebView entirely and uses Android's own HTTP client + CA bundle.
async function _ttsPost(
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response | null> {
  const endpoints = isNative() ? _NATIVE_ENDPOINTS : [''];

  // Attach Firebase Bearer token so the server-side auth gate passes.
  // Without this, /api/tts returns 401 and TTS silently falls through to
  // Web Speech — which fails on devices without a Croatian voice.
  const bearer = await _getFirebaseBearer();
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer) {
    authHeaders.Authorization = `Bearer ${bearer}`;
  } else {
    dbgWarn('[TTS] no Firebase user signed in — request will be unauthenticated');
  }

  if (isNative()) {
    // Try CapacitorHttp (native Android HTTP — bypasses WebView fetch() failures)
    type _CapHttp = {
      post: (
        o: Record<string, unknown>,
      ) => Promise<{ status: number; data: unknown; headers: Record<string, string> }>;
    };
    let capHttp: _CapHttp | null = null;
    try {
      // Dynamic import keeps @capacitor/core out of the web bundle's main chunk.
      const capacitorModule = (await import('@capacitor/core')) as unknown as {
        CapacitorHttp?: _CapHttp;
      };
      capHttp = capacitorModule.CapacitorHttp ?? null;
      if (capHttp) dbgInfo('[TTS] CapacitorHttp available — using native HTTP');
    } catch {
      dbgWarn('[TTS] CapacitorHttp import failed — falling back to fetch()');
    }

    if (capHttp) {
      for (const base of endpoints) {
        const url = `${base}/api/tts`;
        try {
          dbgInfo(`[TTS] CapacitorHttp POST → "${url}"`);
          const resp = await capHttp.post({
            url,
            headers: authHeaders,
            data: body,
            responseType: 'blob',
          });
          dbgInfo(`[TTS] CapacitorHttp status=${resp.status} data-type=${typeof resp.data}`);
          if (resp.status >= 200 && resp.status < 300) {
            const backends =
              resp.headers['x-tts-backends'] || resp.headers['X-TTS-Backends'] || 'capacitor';
            // Native bridge returns binary blob as base64 string; convert to Blob
            let blob: Blob;
            if (resp.data instanceof Blob) {
              blob = resp.data;
            } else if (typeof resp.data === 'string' && resp.data.length > 0) {
              const ab = _dataUrlToArrayBuffer(`data:audio/mpeg;base64,${resp.data}`);
              blob = new Blob([ab], { type: 'audio/mpeg' });
            } else {
              dbgWarn(
                `[TTS] CapacitorHttp unexpected data type "${typeof resp.data}" len=${String(resp.data).length} — trying next`,
              );
              continue;
            }
            return new Response(blob, {
              status: 200,
              headers: new Headers({ 'Content-Type': 'audio/mpeg', 'X-TTS-Backends': backends }),
            });
          }
          if (resp.status >= 400 && resp.status < 500) {
            // 4xx — bad request, don't retry other endpoints
            return new Response('', {
              status: resp.status,
              headers: new Headers({ 'X-TTS-Backends': resp.headers['x-tts-backends'] || '' }),
            });
          }
          // 5xx: try next endpoint
        } catch (e: unknown) {
          const err = e as Error;
          dbgWarn(
            `[TTS] CapacitorHttp → "${url}" error: ${err?.name} — ${err?.message?.slice(0, 100)} — trying next`,
          );
        }
      }
      dbgWarn('[TTS] CapacitorHttp: all endpoints failed');
      return null;
    }
    // CapacitorHttp unavailable — fall through to fetch()
  }

  // Web (and native fallback): standard fetch()
  for (const base of endpoints) {
    const url = `${base}/api/tts`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
        signal,
      });
      dbgInfo(`[TTS] fetch POST → "${url}" status=${r.status}`);
      if (r.ok) return r;
      // 4xx from server: bad request — don't retry other endpoints
      if (r.status >= 400 && r.status < 500) return r;
      // 5xx or other: try next endpoint
    } catch (e: unknown) {
      const err = e as Error;
      if (err?.name === 'AbortError') throw e; // propagate abort immediately
      dbgWarn(
        `[TTS] fetch → "${url}" error: ${err?.name} — ${err?.message?.slice(0, 80)} — trying next`,
      );
    }
  }
  return null; // all endpoints failed
}

let _au = false;
let _voices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;
let _currentAudio: { pause: () => void; currentTime: number } | null = null;
// Persistent HTMLAudio element — created once during uA() and reused for all TTS.
// Android WebView enforces autoplay policy per-element on some OEM builds (Samsung,
// HCL, Huawei). Unlocking a throw-away silent Audio element does NOT propagate sticky
// activation to subsequent new Audio() instances. By keeping and reusing the same
// element, we guarantee the activation transfer survives async network fetches.
let _htmlAudio: HTMLAudioElement | null = null;
let _ctx: AudioContext | null = null;
let _speakGen = 0;
let _ttsAbort: AbortController | null = null;

// Client-side TTS rate guard
const _ttsTimestamps: number[] = [];
function _ttsAllowed(): boolean {
  const now = Date.now();
  while (_ttsTimestamps.length && _ttsTimestamps[0]! < now - 60000) _ttsTimestamps.shift();
  if (_ttsTimestamps.length >= 55) return false;
  _ttsTimestamps.push(now);
  return true;
}

// Session-level audio cache
interface CacheEntry {
  url: string;
  expires: number;
}
const _ttsCache = new Map<string, CacheEntry>();
function _cacheGet(key: string): string | null {
  const e = _ttsCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    URL.revokeObjectURL(e.url);
    _ttsCache.delete(key);
    return null;
  }
  return e.url;
}
const _TTS_CACHE_MAX = 100;
function _cacheSet(key: string, url: string): void {
  if (_ttsCache.size >= _TTS_CACHE_MAX) {
    let evicted = 0;
    for (const [k, v] of _ttsCache) {
      URL.revokeObjectURL(v.url);
      _ttsCache.delete(k);
      if (++evicted >= 20) break;
    }
  }
  _ttsCache.set(key, { url, expires: Date.now() + 3_600_000 });
}

// Shortest valid silent WAV (44 bytes) as a base64 data URL.
// Used to unlock HTMLAudio on Android WebView during the first user gesture.
const _SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Use the shared isIos() helper — covers native Capacitor, iOS Safari PWA, and iOS Safari browser.
// The inline UA check was left here in previous versions but isIos() now handles all cases.
const _iOS = isIos();

dbgInfo(
  `[Audio] module loaded | isNative=${isNative()} | iOS=${_iOS} | UA="${navigator.userAgent.slice(0, 80)}"`,
);

function uA(): void {
  if (_au) {
    dbgInfo('[Audio] uA() called — already unlocked, skip');
    return;
  }
  _au = true; // optimistically set; reset below if silent play fails
  dbgInfo('[Audio] uA() — unlocking audio pipeline');
  // Unlock Web AudioContext (desktop / iOS primary path)
  try {
    _ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const b = _ctx.createBuffer(1, 1, 22050);
    const s = _ctx.createBufferSource();
    s.buffer = b;
    s.connect(_ctx.destination);
    s.start(0);
    _ctx.resume();
    dbgInfo(`[Audio] AudioContext created — state="${_ctx.state}"`);
  } catch (e) {
    dbgError('[Audio] AudioContext creation FAILED:', e);
  }
  // Unlock HTMLAudio independently — required on Android WebView where AudioContext
  // unlock does NOT always propagate to the HTML5 Media pipeline.
  // CRITICAL design: we create the PERSISTENT _htmlAudio element here and play a
  // silent WAV to activate it. All subsequent TTS playback REUSES this same element
  // (just changes .src). This works around the Android WebView per-element autoplay
  // restriction where new Audio() instances don't inherit activation from prior plays.
  // Must use volume = 1.0: some Android WebViews treat very low volume as "muted"
  // and block the play() call under autoplay policy.
  try {
    _htmlAudio = new Audio(_SILENT_WAV);
    _htmlAudio.volume = 1.0;
    _htmlAudio
      .play()
      .then(() => {
        dbgInfo('[Audio] HTMLAudio persistent element unlocked — sticky activation established');
        _htmlAudio!.pause();
        _htmlAudio!.currentTime = 0;
      })
      .catch((e) => {
        dbgError('[Audio] HTMLAudio persistent unlock FAILED — resetting _au for retry:', e);
        _au = false;
        _htmlAudio = null;
      });
  } catch (e) {
    dbgError('[Audio] HTMLAudio persistent new Audio() FAILED — resetting _au:', e);
    _au = false;
    _htmlAudio = null;
  }
}
['touchstart', 'click'].forEach((e) => {
  document.addEventListener(
    e,
    function h() {
      dbgInfo(`[Audio] first user gesture (${e}) — calling uA()`);
      uA();
      document.removeEventListener(e, h);
    },
    { passive: true, once: true },
  );
});

// iOS Safari suspends the AudioContext whenever the page goes to background (phone call,
// home button press, switching apps, screen lock). Without this listener, the context
// stays 'suspended' indefinitely and all subsequent TTS fails silently.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _ctx && _ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
    dbgInfo('[Audio] visibilitychange — resumed suspended AudioContext');
  }
});

/** Call this synchronously at the entry of every async audio handler (before any await).
 *  iOS/Android WebView require the user-gesture activation to be in the same call stack.
 *  This is idempotent — safe to call multiple times. */
export function unlockAudio(): void {
  uA();
}

export function loadVoices(): void {
  if (window.speechSynthesis) {
    _voices = window.speechSynthesis.getVoices();
    _voicesLoaded = _voices.length > 0;
  }
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function getBestVoice(): SpeechSynthesisVoice | null {
  if (!_voicesLoaded) loadVoices();
  const v = _voices;
  const hr = v.filter((x) => x.lang.startsWith('hr'));
  if (hr.length > 0) return hr.find((x) => !x.localService) ?? hr[0] ?? null;
  const bs = v.filter((x) => x.lang.startsWith('bs'));
  if (bs.length > 0) return bs[0] ?? null;
  const sr = v.filter((x) => x.lang.startsWith('sr'));
  if (sr.length > 0) return sr[0] ?? null;
  return null;
}

export function stopAudio(): void {
  if (_ttsAbort) {
    try {
      _ttsAbort.abort();
    } catch (e) {}
    _ttsAbort = null;
  }
  if (_preloadAbort) {
    try {
      _preloadAbort.abort();
    } catch (e) {}
    _preloadAbort = null;
  }
  if (_currentAudio) {
    try {
      _currentAudio.pause();
      _currentAudio.currentTime = 0;
    } catch (e) {}
    _currentAudio = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export async function speakAzure(text: string, slow?: boolean): Promise<boolean> {
  if (!text || !text.trim()) return false;
  dbgInfo(
    `[TTS] speakAzure called | text="${text.slice(0, 40)}" slow=${!!slow} isNative=${isNative()}`,
  );
  // Ensure audio pipeline is unlocked on THIS gesture call, not just on the first-ever touch.
  // On Android WebView, user activation survives async operations only if audio was already
  // unlocked via a prior synchronous play(). uA() is idempotent — safe to call every time.
  uA();
  stopAudio();
  const myGen = ++_speakGen;
  const voicePref = getVoicePreference();
  const cacheKey = text + '|' + (slow ? '1' : '0') + '|' + voicePref;
  const cached = _cacheGet(cacheKey);

  try {
    let url: string;
    let freshBlob: Blob | null = null; // retained for in-memory arrayBuffer decode
    if (cached) {
      dbgInfo('[TTS] cache HIT — skipping fetch');
      url = cached;
    } else {
      if (!_ttsAllowed()) {
        dbgWarn('[TTS] rate limit — request blocked');
        return false;
      }
      const body: Record<string, unknown> = { text, slow: !!slow };
      if (voicePref !== 'auto') body.voice = voicePref;
      _ttsAbort = new AbortController();
      // Use timeout-aware abort signal when supported; fall back to plain abort signal.
      const timeoutSignal = (
        AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }
      ).timeout?.(15000);
      const abortSignal = timeoutSignal
        ? ((AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any?.([
            _ttsAbort.signal,
            timeoutSignal,
          ]) ?? _ttsAbort.signal)
        : _ttsAbort.signal;
      const r = await _ttsPost(body, abortSignal);
      _ttsAbort = null;
      if (_speakGen !== myGen) {
        dbgWarn('[TTS] generation mismatch after fetch — aborting');
        return false;
      }
      if (!r || !r.ok) {
        const backends = r?.headers.get('x-tts-backends') || 'none';
        const rb = r ? await r.text().catch(() => '') : 'no response (all endpoints failed)';
        dbgError(`[TTS] HTTP ${r?.status ?? 'N/A'} backends=${backends} — ${rb.slice(0, 200)}`);
        return false;
      }
      const backends = r.headers.get('x-tts-backends') || 'unknown';
      freshBlob = await r.blob();
      dbgInfo(
        `[TTS] blob received size=${freshBlob.size} type="${freshBlob.type}" backends=${backends}`,
      );
      if (_speakGen !== myGen) return false;
      // Always use base64 data URLs — universally supported across all browsers and
      // native WebView implementations (blob: URLs fail on some Android OEM builds).
      // AudioContext path uses freshBlob.arrayBuffer() directly for the fresh case.
      const reader = new FileReader();
      url = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(freshBlob!);
      });
      dbgInfo(`[TTS] data URL ready (length=${url.length})`);
      _cacheSet(cacheKey, url);
    }

    // On iOS (Safari, PWA, Capacitor), skip AudioContext for TTS playback and go straight to
    // HTMLAudio. iOS WebKit's AudioContext is unreliable for streaming TTS:
    //   1. decodeAudioData() fails when AudioContext is in 'interrupted' or 'suspended' state
    //      (e.g., after a phone call, screen lock, or background transition)
    //   2. The HTMLAudio element plays data: URLs natively and is the more stable path
    //   3. iOS AudioContext needs to be created AND resumed within the SAME user-gesture
    //      call stack, which is not always guaranteed across async boundaries
    // AudioContext IS still created for iOS in uA() — for unlock purposes only. Playback uses HTMLAudio.
    if (_ctx && !_iOS) {
      dbgInfo(`[TTS] trying AudioContext path — state="${_ctx.state}"`);
      try {
        await _ctx.resume();
        dbgInfo(`[TTS] AudioContext resumed — state="${_ctx.state}"`);
        // Some Android WebViews resume() returns without actually transitioning to "running".
        // If state is still "suspended" or "interrupted", skip to HTMLAudio immediately.
        if (_ctx.state !== 'running') {
          throw new Error(`AudioContext not running after resume (state="${_ctx.state}")`);
        }
        if (_speakGen !== myGen) return false;
        // For fresh blobs: read arrayBuffer() directly from the in-memory Blob.
        // For cached plays: decode the data: URL ourselves using atob() — do NOT use
        // fetch(data: URL) because that API is unreliable on some Android WebView versions
        // and may return an empty body or throw a TypeError.
        const ab = freshBlob ? await freshBlob.arrayBuffer() : _dataUrlToArrayBuffer(url);
        if (_speakGen !== myGen) return false;
        const decoded = await _ctx.decodeAudioData(ab);
        if (_speakGen !== myGen) return false;
        const src = _ctx.createBufferSource();
        src.buffer = decoded;
        // SP8e: apply user's playback-rate preference (default 1.0).
        src.playbackRate.value = getSpeechRate();
        src.connect(_ctx.destination);
        _currentAudio = {
          pause: () => {
            try {
              src.stop();
            } catch {}
          },
          currentTime: 0,
        };
        src.start(0);
        dbgInfo('[TTS] AudioContext playback started');
        await new Promise<void>((resolve) => {
          src.onended = () => resolve();
        });
        dbgInfo('[TTS] AudioContext playback ended — success');
        return true;
      } catch (e) {
        dbgError('[TTS] AudioContext path FAILED — falling through to HTMLAudio:', e);
        if (_speakGen !== myGen) return false;
        // Fall through to HTMLAudio fallback
      }
    } else {
      dbgWarn('[TTS] _ctx is null — AudioContext not available, going straight to HTMLAudio');
    }

    // HTMLAudio path — primary on Android WebView; fallback elsewhere.
    // Do NOT call a.load() — it triggers a second resource load that Chrome
    // interrupts the pending play() with an AbortError.
    if (_speakGen !== myGen) return false;
    dbgInfo(`[TTS] trying HTMLAudio path — persistent=${_htmlAudio !== null}`);
    // Reuse the persistent element unlocked in uA() to avoid the Android WebView
    // per-element autoplay restriction. new Audio() instances don't inherit activation
    // from prior unlocks on some OEM builds — only the exact same element stays activated.
    const a: HTMLAudioElement = _htmlAudio ?? new Audio();
    if (_htmlAudio) {
      try {
        _htmlAudio.pause();
      } catch {}
      _htmlAudio.currentTime = 0;
    }
    a.volume = 1.0;
    // SP8e: apply user's playback-rate preference (default 1.0).
    a.playbackRate = getSpeechRate();
    _currentAudio = a;
    a.src = url;
    try {
      await a.play();
      dbgInfo('[TTS] HTMLAudio play() started');
    } catch (playErr) {
      dbgError('[TTS] HTMLAudio play() FAILED:', playErr);
      return false;
    }
    await new Promise<void>((resolve) => {
      a.addEventListener(
        'ended',
        () => {
          dbgInfo('[TTS] HTMLAudio ended — success');
          resolve();
        },
        { once: true },
      );
      a.addEventListener(
        'error',
        (ev) => {
          dbgError('[TTS] HTMLAudio error event:', (ev as ErrorEvent).message || ev);
          resolve();
        },
        { once: true },
      );
      a.addEventListener('pause', () => resolve(), { once: true });
      a.addEventListener('abort', () => resolve(), { once: true });
    });
    return true;
  } catch (e) {
    dbgError('[TTS] speakAzure unhandled error:', e);
    return false;
  }
}

export function speakSynth(text: string, rate: number): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve();
  stopAudio();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hr-HR';
    // SP8e: multiply by user's playback-rate preference (default 1.0).
    u.rate = rate * getSpeechRate();
    u.pitch = 1.0;
    u.volume = 1.0;
    const best = getBestVoice();
    if (best) u.voice = best;
    u.onerror = () => {
      window.dispatchEvent(new CustomEvent('nh:tts-failed'));
      resolve();
    };
    u.onend = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function prepTTS(text: string): string {
  if (!text) return text;
  const t = text.trim();
  if (t.includes('/') && t.length > 4) {
    return t.split('/')[0]!.trim();
  }
  return t;
}

let _preloadAbort: AbortController | null = null;

export async function preloadAudio(text: string): Promise<void> {
  if (!text) return;
  if (_ttsAbort) return;
  const t = prepTTS(text);
  if (!t) return;
  const voicePref = getVoicePreference();
  const cacheKey = t + '|0|' + voicePref;
  if (_cacheGet(cacheKey)) return;
  if (!_ttsAllowed()) return;
  if (_preloadAbort) {
    try {
      _preloadAbort.abort();
    } catch {}
  }
  const abortCtrl = new AbortController();
  _preloadAbort = abortCtrl;
  const signal = abortCtrl.signal;
  try {
    const body: Record<string, unknown> = { text: t, slow: false };
    if (voicePref !== 'auto') body.voice = voicePref;
    const r = await _ttsPost(body, signal);
    if (!r || !r.ok) return;
    const blob = await r.blob();
    const preloadReader = new FileReader();
    const url = await new Promise<string>((resolve) => {
      preloadReader.onload = () => resolve(preloadReader.result as string);
      preloadReader.readAsDataURL(blob);
    });
    _cacheSet(cacheKey, url);
  } catch (e: unknown) {
    if ((e as Error)?.name !== 'AbortError') {
      /* silently ignore — preload is best-effort */
    }
  } finally {
    if (_preloadAbort === abortCtrl) _preloadAbort = null;
  }
}

// Wait up to 1.5 s for speechSynthesis voices to load (needed on Android WebView
// where getVoices() returns [] on module load and populates asynchronously).
async function _awaitVoices(): Promise<SpeechSynthesisVoice | null> {
  if (!window.speechSynthesis) return null;
  loadVoices();
  const best = getBestVoice();
  if (best) return best;
  // Voices not ready yet — wait for the onvoiceschanged event (max 1.5 s)
  return new Promise<SpeechSynthesisVoice | null>((resolve) => {
    const timer = setTimeout(() => {
      loadVoices();
      resolve(getBestVoice());
    }, 1500);
    const prev = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      window.speechSynthesis.onvoiceschanged = prev ?? null;
      loadVoices();
      resolve(getBestVoice());
    };
  });
}

export async function speak(text: string): Promise<string> {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, false).catch(() => false);
  if (!ok) {
    // Only use Web Speech fallback when a Croatian/South-Slavic voice is available.
    // Playing English TTS for Croatian text actively teaches wrong pronunciation — never acceptable.
    // Wait for voices to load (Android WebView loads them asynchronously after startup).
    const voice = await _awaitVoices();
    if (window.speechSynthesis && voice) {
      await speakSynth(t, 0.85);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

/** POST to /api/tts with an explicit prosody descriptor (pitch, contour, rate).
 *  Uses the same `_ttsPost` path as `speakAzure` — native-safe (Capacitor endpoint
 *  fallback included). The prosody object is included in the cache key so different
 *  contours never collide with each other or with the plain speakAzure cache. */
export async function speakProsody(
  text: string,
  prosody: { pitch?: string; contour?: string; rate?: string },
): Promise<boolean> {
  if (!text || !text.trim()) return false;
  dbgInfo(
    `[TTS] speakProsody called | text="${text.slice(0, 40)}" prosody=${JSON.stringify(prosody)} isNative=${isNative()}`,
  );
  uA();
  stopAudio();
  const myGen = ++_speakGen;
  const voicePref = getVoicePreference();
  const prosodyKey = JSON.stringify(prosody);
  const cacheKey = text + '|prosody:' + prosodyKey + '|' + voicePref;
  const cached = _cacheGet(cacheKey);

  try {
    let url: string;
    let freshBlob: Blob | null = null;
    if (cached) {
      dbgInfo('[TTS] speakProsody cache HIT — skipping fetch');
      url = cached;
    } else {
      if (!_ttsAllowed()) {
        dbgWarn('[TTS] rate limit — speakProsody request blocked');
        return false;
      }
      const body: Record<string, unknown> = { text, prosody };
      if (voicePref !== 'auto') body.voice = voicePref;
      _ttsAbort = new AbortController();
      const timeoutSignal = (
        AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }
      ).timeout?.(15000);
      const abortSignal = timeoutSignal
        ? ((AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any?.([
            _ttsAbort.signal,
            timeoutSignal,
          ]) ?? _ttsAbort.signal)
        : _ttsAbort.signal;
      const r = await _ttsPost(body, abortSignal);
      _ttsAbort = null;
      if (_speakGen !== myGen) {
        dbgWarn('[TTS] speakProsody generation mismatch after fetch — aborting');
        return false;
      }
      if (!r || !r.ok) {
        const backends = r?.headers.get('x-tts-backends') || 'none';
        const rb = r ? await r.text().catch(() => '') : 'no response (all endpoints failed)';
        dbgError(
          `[TTS] speakProsody HTTP ${r?.status ?? 'N/A'} backends=${backends} — ${rb.slice(0, 200)}`,
        );
        return false;
      }
      const backends = r.headers.get('x-tts-backends') || 'unknown';
      freshBlob = await r.blob();
      dbgInfo(
        `[TTS] speakProsody blob received size=${freshBlob.size} type="${freshBlob.type}" backends=${backends}`,
      );
      if (_speakGen !== myGen) return false;
      const reader = new FileReader();
      url = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(freshBlob!);
      });
      dbgInfo(`[TTS] speakProsody data URL ready (length=${url.length})`);
      _cacheSet(cacheKey, url);
    }

    // iOS: use HTMLAudio directly (same reason as speakAzure)
    if (_ctx && !_iOS) {
      dbgInfo(`[TTS] speakProsody trying AudioContext path — state="${_ctx.state}"`);
      try {
        await _ctx.resume();
        if (_ctx.state !== 'running') {
          throw new Error(`AudioContext not running after resume (state="${_ctx.state}")`);
        }
        if (_speakGen !== myGen) return false;
        const ab = freshBlob ? await freshBlob.arrayBuffer() : _dataUrlToArrayBuffer(url);
        if (_speakGen !== myGen) return false;
        const decoded = await _ctx.decodeAudioData(ab);
        if (_speakGen !== myGen) return false;
        const src = _ctx.createBufferSource();
        src.buffer = decoded;
        src.playbackRate.value = getSpeechRate();
        src.connect(_ctx.destination);
        _currentAudio = {
          pause: () => {
            try {
              src.stop();
            } catch {}
          },
          currentTime: 0,
        };
        src.start(0);
        dbgInfo('[TTS] speakProsody AudioContext playback started');
        await new Promise<void>((resolve) => {
          src.onended = () => resolve();
        });
        dbgInfo('[TTS] speakProsody AudioContext playback ended — success');
        return true;
      } catch (e) {
        dbgError('[TTS] speakProsody AudioContext path FAILED — falling through to HTMLAudio:', e);
        if (_speakGen !== myGen) return false;
      }
    }

    // HTMLAudio path
    if (_speakGen !== myGen) return false;
    const a: HTMLAudioElement = _htmlAudio ?? new Audio();
    if (_htmlAudio) {
      try {
        _htmlAudio.pause();
      } catch {}
      _htmlAudio.currentTime = 0;
    }
    a.volume = 1.0;
    a.playbackRate = getSpeechRate();
    _currentAudio = a;
    a.src = url;
    try {
      await a.play();
      dbgInfo('[TTS] speakProsody HTMLAudio play() started');
    } catch (playErr) {
      dbgError('[TTS] speakProsody HTMLAudio play() FAILED:', playErr);
      return false;
    }
    await new Promise<void>((resolve) => {
      a.addEventListener('ended', () => resolve(), { once: true });
      a.addEventListener(
        'error',
        (ev) => {
          dbgError('[TTS] speakProsody HTMLAudio error event:', (ev as ErrorEvent).message || ev);
          resolve();
        },
        { once: true },
      );
      a.addEventListener('pause', () => resolve(), { once: true });
      a.addEventListener('abort', () => resolve(), { once: true });
    });
    return true;
  } catch (e) {
    dbgError('[TTS] speakProsody unhandled error:', e);
    return false;
  }
}

export async function speakSlow(text: string): Promise<string> {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, true).catch(() => false);
  if (!ok) {
    // Same guard: only fall back to Web Speech when a Croatian voice is confirmed available.
    const voice = await _awaitVoices();
    if (window.speechSynthesis && voice) {
      await speakSynth(t, 0.65);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

export function getAudioContext(): AudioContext | null {
  return _ctx;
}

export function speakEN(text: string): void {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

/** Returns a snapshot of audio engine state — used by the in-app debug overlay. */
export function getAudioDebugState(): Record<string, string | number | boolean> {
  return {
    unlocked: _au,
    ctxState: _ctx?.state ?? 'null',
    htmlAudioReady: _htmlAudio !== null && !_htmlAudio.error,
    htmlAudioError: _htmlAudio?.error ? String(_htmlAudio.error.code) : 'none',
    cacheSize: _ttsCache.size,
    isNative: isNative(),
  };
}

// SP5: expose Firebase Bearer fetcher for AI POST wrapper (`_aiPost`).
// Wraps the internal `_getFirebaseBearer` without renaming it (preserves internal call sites).
export async function getFirebaseBearer(forceRefresh = false): Promise<string | null> {
  return _getFirebaseBearer(forceRefresh);
}

// R3: re-export the platform `isNative` from audio so the shared native-safe POST
// helper (`_nativePost` in ./nativePost) and its tests can import both transport
// primitives (`getFirebaseBearer` + `isNative`) from a single module. Behavior is
// the canonical `./platform` implementation — this is a pure re-export, no change.
export { isNative } from './platform';
