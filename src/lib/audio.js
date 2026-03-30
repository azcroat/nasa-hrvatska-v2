// ═══════════════════════════════════════════════════════════
// Audio Engine — Native Croatian Pronunciation
// ═══════════════════════════════════════════════════════════
import { getVoicePreference } from './soundSettings.js';

let _au=false;let _voices=[];let _voicesLoaded=false;let _currentAudio=null;let _ctx=null;

// Client-side TTS rate guard: tracks requests in the last 60 seconds.
// Mirrors the server limit (60/min) so rapid sequences shed locally before hitting the API.
const _ttsTimestamps = [];
function _ttsAllowed() {
  const now = Date.now();
  // Drop timestamps older than 60 seconds
  while (_ttsTimestamps.length && _ttsTimestamps[0] < now - 60000) _ttsTimestamps.shift();
  if (_ttsTimestamps.length >= 55) return false; // 55 client-side = buffer before server 429
  _ttsTimestamps.push(now);
  return true;
}

// Session-level audio cache: avoids repeat API calls for the same word
// Key: "text|0" or "text|1" (text + slow flag). Expires after 1 hour.
const _ttsCache = new Map();
function _cacheGet(key) {
  const e = _ttsCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) { URL.revokeObjectURL(e.url); _ttsCache.delete(key); return null; }
  return e.url;
}
function _cacheSet(key, url) {
  _ttsCache.set(key, { url, expires: Date.now() + 3_600_000 });
}

const _iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function uA(){if(_au)return;_au=true;try{_ctx=new(window.AudioContext||window.webkitAudioContext)();const b=_ctx.createBuffer(1,1,22050);const s=_ctx.createBufferSource();s.buffer=b;s.connect(_ctx.destination);s.start(0);_ctx.resume()}catch(e){}}
["touchstart","click"].forEach(e=>{document.addEventListener(e,function h(){uA();document.removeEventListener(e,h)},{passive:true,once:true})});

export function loadVoices(){if(window.speechSynthesis){_voices=window.speechSynthesis.getVoices();_voicesLoaded=_voices.length>0}}
if(window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices}

export function getBestVoice(){
  if(!_voicesLoaded)loadVoices();
  const v=_voices;
  const hr=v.filter(x=>x.lang.startsWith("hr"));
  if(hr.length>0)return hr.find(x=>!x.localService)||hr[0];
  const bs=v.filter(x=>x.lang.startsWith("bs"));
  if(bs.length>0)return bs[0];
  const sr=v.filter(x=>x.lang.startsWith("sr"));
  if(sr.length>0)return sr[0];
  return null;
}

export function stopAudio(){
  if(_currentAudio){try{_currentAudio.pause();_currentAudio.currentTime=0}catch(e){}_currentAudio=null}
  if(window.speechSynthesis)window.speechSynthesis.cancel();
}

export async function speakAzure(text, slow) {
  stopAudio();
  const voicePref = getVoicePreference();
  const cacheKey = text + '|' + (slow ? '1' : '0') + '|' + voicePref;
  const cached = _cacheGet(cacheKey);

  try {
    let url;
    if (cached) {
      url = cached;
    } else {
      if (!_ttsAllowed()) return false; // client-side rate guard — shed before hitting server 429
      const body = { text, slow: !!slow };
      if (voicePref !== 'auto') body.voice = voicePref;
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const rb = await r.text().catch(() => '');
        console.error('[TTS] HTTP ' + r.status + ' body:' + rb);
        return false;
      }
      const blob = await r.blob();
      url = URL.createObjectURL(blob);
      _cacheSet(cacheKey, url);
    }

    // iOS: HTMLAudioElement.play() is blocked after async gaps (user gesture context lost).
    // Use the pre-unlocked AudioContext (activated on first touch via uA()) to decode and
    // play the MP3 buffer instead — AudioContext ignores autoplay policy once unlocked.
    if (_iOS && _ctx) {
      try {
        await _ctx.resume();
        const ab = await fetch(url).then(r2 => r2.arrayBuffer());
        const decoded = await _ctx.decodeAudioData(ab);
        const src = _ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(_ctx.destination);
        // Shim so stopAudio() can cancel mid-playback
        _currentAudio = { pause: () => { try { src.stop(); } catch {} }, currentTime: 0 };
        src.start(0);
        await new Promise(resolve => { src.onended = resolve; });
        return true;
      } catch (e) {
        console.error('[TTS iOS] AudioContext fallback failed:', e);
        // fall through to HTMLAudioElement path
      }
    }

    const a = new Audio(); a.volume = 1.0; _currentAudio = a;
    a.src = url; a.load();
    await a.play();
    return true;
  } catch (e) {
    console.error('[TTS] error:', e);
    return false;
  }
}

export function speakSynth(text, rate) {
  if (!window.speechSynthesis) return;
  stopAudio();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hr-HR'; u.rate = rate; u.pitch = 1.0; u.volume = 1.0;
  const best = getBestVoice(); if (best) u.voice = best;
  window.speechSynthesis.speak(u);
}

// Preprocess text before TTS.
// When a word has multiple forms separated by " / " (e.g. "Brate / Buraz"),
// we speak ONLY the first form — the primary Croatian word. Speaking alternatives
// with "ili" in between sounded unnatural and confused learners.
// Exception: if the full entry is very short (≤4 chars), keep it as-is since
// slashes in that context are usually pronunciation variants, not synonyms.
function prepTTS(text) {
  if (!text) return text;
  // Strip leading/trailing whitespace
  const t = text.trim();
  // If a slash is present and the text is longer than a short abbreviation,
  // take only the part before the first slash and trim it.
  if (t.includes('/') && t.length > 4) {
    return t.split('/')[0].trim();
  }
  return t;
}

// Fetch and cache TTS audio without playing it — eliminates first-tap delay
// for words shown on screen before the user taps the speaker button.
export async function preloadAudio(text) {
  if (!text) return;
  const t = prepTTS(text);
  if (!t) return;
  const voicePref = getVoicePreference();
  const cacheKey = t + '|0|' + voicePref;
  if (_cacheGet(cacheKey)) return; // already cached
  if (!_ttsAllowed()) return; // client-side rate guard — preload is best-effort, skip if near limit
  try {
    const body = { text: t, slow: false };
    if (voicePref !== 'auto') body.voice = voicePref;
    const r = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    _cacheSet(cacheKey, url);
  } catch { /* silently ignore — preload is best-effort */ }
}

export async function speak(text) {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, false).catch(() => false);
  if (!ok) {
    // Fall back to browser speech synthesis (works in Chrome even when TTS API fails)
    if (window.speechSynthesis) {
      speakSynth(t, 0.85);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

export async function speakSlow(text) {
  if (!text) return 'none';
  const t = prepTTS(text);
  const ok = await speakAzure(t, true).catch(() => false);
  if (!ok) {
    if (window.speechSynthesis) {
      speakSynth(t, 0.65);
      return 'synth';
    }
    window.dispatchEvent(new CustomEvent('nh:tts-failed'));
    return 'failed';
  }
  return 'azure';
}

// Returns the pre-unlocked AudioContext (null if user hasn't interacted yet).
// Other modules (e.g. LiveTutorScreen) can use this to play audio on iOS
// without HTMLAudioElement autoplay restrictions.
export function getAudioContext() { return _ctx; }

export function speakEN(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
