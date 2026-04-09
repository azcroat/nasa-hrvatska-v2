// ═══════════════════════════════════════════════════════════
// Audio Engine — Native Croatian Pronunciation
// ═══════════════════════════════════════════════════════════
import { getVoicePreference } from './soundSettings';

let _au = false;
let _voices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;
let _currentAudio: { pause: () => void; currentTime: number } | null = null;
let _ctx: AudioContext | null = null;
let _speakGen = 0;
let _ttsAbort: AbortController | null = null;

// Client-side TTS rate guard
const _ttsTimestamps: number[] = [];
function _ttsAllowed(): boolean {
  const now = Date.now();
  while (_ttsTimestamps.length && _ttsTimestamps[0] < now - 60000) _ttsTimestamps.shift();
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
  if (Date.now() > e.expires) { URL.revokeObjectURL(e.url); _ttsCache.delete(key); return null; }
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

const _iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function uA(): void {
  if (_au) return; _au = true;
  try {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const b = _ctx.createBuffer(1, 1, 22050);
    const s = _ctx.createBufferSource();
    s.buffer = b; s.connect(_ctx.destination); s.start(0); _ctx.resume();
  } catch (e) {}
}
['touchstart', 'click'].forEach(e => {
  document.addEventListener(e, function h() { uA(); document.removeEventListener(e, h); }, { passive: true, once: true });
});

export function loadVoices(): void {
  if (window.speechSynthesis) { _voices = window.speechSynthesis.getVoices(); _voicesLoaded = _voices.length > 0; }
}
if (window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }

export function getBestVoice(): SpeechSynthesisVoice | null {
  if (!_voicesLoaded) loadVoices();
  const v = _voices;
  const hr = v.filter(x => x.lang.startsWith('hr'));
  if (hr.length > 0) return hr.find(x => !x.localService) || hr[0];
  const bs = v.filter(x => x.lang.startsWith('bs'));
  if (bs.length > 0) return bs[0];
  const sr = v.filter(x => x.lang.startsWith('sr'));
  if (sr.length > 0) return sr[0];
  return null;
}

export function stopAudio(): void {
  if (_ttsAbort) { try { _ttsAbort.abort(); } catch (e) {} _ttsAbort = null; }
  if (_preloadAbort) { try { _preloadAbort.abort(); } catch (e) {} _preloadAbort = null; }
  if (_currentAudio) { try { _currentAudio.pause(); _currentAudio.currentTime = 0; } catch (e) {} _currentAudio = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export async function speakAzure(text: string, slow?: boolean): Promise<boolean> {
  if (!text || !text.trim()) return false;
  stopAudio();
  const myGen = ++_speakGen;
  const voicePref = getVoicePreference();
  const cacheKey = text + '|' + (slow ? '1' : '0') + '|' + voicePref;
  const cached = _cacheGet(cacheKey);

  try {
    let url: string;
    if (cached) {
      url = cached;
    } else {
      if (!_ttsAllowed()) return false;
      const body: Record<string, unknown> = { text, slow: !!slow };
      if (voicePref !== 'auto') body.voice = voicePref;
      _ttsAbort = new AbortController();
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
          ? (AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }).any([_ttsAbort.signal, AbortSignal.timeout(15000)])
          : _ttsAbort.signal,
      });
      _ttsAbort = null;
      if (_speakGen !== myGen) return false;
      if (!r.ok) {
        const rb = await r.text().catch(() => '');
        console.error('[TTS] HTTP ' + r.status + ' body:' + rb);
        return false;
      }
      const blob = await r.blob();
      if (_speakGen !== myGen) return false;
      url = URL.createObjectURL(blob);
      _cacheSet(cacheKey, url);
    }

    // Prefer AudioContext for all browsers — once unlocked by the first user gesture
    // it bypasses Chrome/Safari autoplay restrictions and the "play interrupted by
    // new load request" AbortError that Chrome throws when a.load() precedes a.play().
    if (_ctx) {
      try {
        await _ctx.resume();
        if (_speakGen !== myGen) return false;
        const ab = await fetch(url).then(r2 => r2.arrayBuffer());
        if (_speakGen !== myGen) return false;
        const decoded = await _ctx.decodeAudioData(ab);
        if (_speakGen !== myGen) return false;
        const src = _ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(_ctx.destination);
        _currentAudio = { pause: () => { try { src.stop(); } catch {} }, currentTime: 0 };
        src.start(0);
        await new Promise<void>(resolve => { src.onended = () => resolve(); });
        return true;
      } catch (e) {
        console.error('[TTS AudioContext] failed:', e);
        if (_speakGen !== myGen) return false;
        // Fall through to HTMLAudio fallback
      }
    }

    // HTMLAudio fallback (first-ever click before AudioContext is initialised).
    // Do NOT call a.load() — it triggers a second resource load that Chrome
    // interrupts the pending play() with an AbortError.
    if (_speakGen !== myGen) return false;
    const a = new Audio(); a.volume = 1.0; _currentAudio = a;
    a.src = url;
    await a.play();
    await new Promise<void>(resolve => {
      a.addEventListener('ended', () => resolve(), { once: true });
      a.addEventListener('error', () => resolve(), { once: true });
      a.addEventListener('pause', () => resolve(), { once: true });
      a.addEventListener('abort', () => resolve(), { once: true });
    });
    return true;
  } catch (e) {
    console.error('[TTS] error:', e);
    return false;
  }
}

export function speakSynth(text: string, rate: number): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve();
  stopAudio();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hr-HR'; u.rate = rate; u.pitch = 1.0; u.volume = 1.0;
    const best = getBestVoice(); if (best) u.voice = best;
    u.onerror = () => { window.dispatchEvent(new CustomEvent('nh:tts-failed')); resolve(); };
    u.onend = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function prepTTS(text: string): string {
  if (!text) return text;
  const t = text.trim();
  if (t.includes('/') && t.length > 4) {
    return t.split('/')[0].trim();
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
  if (_preloadAbort) { try { _preloadAbort.abort(); } catch {} }
  const abortCtrl = new AbortController();
  _preloadAbort = abortCtrl;
  const signal = abortCtrl.signal;
  try {
    const body: Record<string, unknown> = { text: t, slow: false };
    if (voicePref !== 'auto') body.voice = voicePref;
    const r = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    _cacheSet(cacheKey, url);
  } catch (e: unknown) {
    if ((e as Error)?.name !== 'AbortError') { /* silently ignore — preload is best-effort */ }
  } finally {
    if (_preloadAbort === abortCtrl) _preloadAbort = null;
  }
}

export async function speak(text: string): Promise<string> {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, false).catch(() => false);
  if (!ok) {
    // Only use Web Speech fallback when a Croatian/South-Slavic voice is available.
    // Playing English TTS for Croatian text actively teaches wrong pronunciation — never acceptable.
    const hasCroatianVoice = window.speechSynthesis && getBestVoice();
    if (hasCroatianVoice) {
      await speakSynth(t, 0.85);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

export async function speakSlow(text: string): Promise<string> {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, true).catch(() => false);
  if (!ok) {
    // Same guard: only fall back to Web Speech when a Croatian voice is confirmed available.
    const hasCroatianVoice = window.speechSynthesis && getBestVoice();
    if (hasCroatianVoice) {
      await speakSynth(t, 0.65);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

export function getAudioContext(): AudioContext | null { return _ctx; }

export function speakEN(text: string): void {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
