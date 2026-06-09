// ═══════════════════════════════════════════════════════════
// Audio Engine — Native Croatian Pronunciation
// ═══════════════════════════════════════════════════════════
import { getVoicePreference, getSpeechRate } from './soundSettings';
import { isNative, isIos } from './platform';
import { dbgInfo, dbgWarn, dbgError } from './debugLog';
import { _nativePost } from './nativePost.js';
// Transport primitives now live in ./nativeTransport (extracted to break the
// audio.ts ↔ nativePost.ts import cycle). Imported here for internal use and
// re-exported below to preserve audio.ts's public API for existing importers.
import { _dataUrlToArrayBuffer } from './nativeTransport.js';

// Preserve audio.ts's public API: other modules import these FROM './audio'.
// They now originate in ./nativeTransport — pure re-export, no behavior change.
export { getFirebaseBearer, _dataUrlToArrayBuffer } from './nativeTransport.js';
export { isNative } from './nativeTransport.js';

/**
 * Encode a Blob's bytes as base64 (chunked to avoid call-stack limits on large inputs).
 * Safe for audio blobs of any size — processes in 8 KiB chunks rather than byte-by-byte.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// POST to /api/tts — thin delegate to `_nativePost` in ./nativePost.
//
// The ~90-line body that previously lived here (CapacitorHttp loop + fetch loop +
// bearer attachment) is now fully covered by `_nativePost`, which was built to
// mirror it exactly (Task 7 added blob support + passthroughHeaders).
//
// The audio.ts ↔ nativePost.ts cycle is gone: both now import their shared
// transport primitives from ./nativeTransport, so this can be a plain static
// import of `_nativePost`.
async function _ttsPost(
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response | null> {
  return _nativePost('/api/tts', body, {
    signal,
    responseType: 'blob',
    passthroughHeaders: ['X-TTS-Backends'],
  });
}

/**
 * Native-safe POST to /api/tts. Use this from components instead of
 * apiFetch('/api/tts', ...) — apiFetch sends a relative URL that resolves to
 * https://localhost on Capacitor native and silently fails. Returns the audio
 * Response, or null on total transport failure (caller should fall through).
 */
export async function ttsFetch(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response | null> {
  return _ttsPost(body, signal ?? new AbortController().signal);
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
