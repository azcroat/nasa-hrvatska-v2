// soundSettings.ts — persists user sound and haptic preferences
const SOUND_KEY  = 'nh_sound_enabled';
const HAPTIC_KEY = 'nh_haptic_enabled';
const VOICE_KEY  = 'nh_voice_pref';

// Voice preference options:
//   'gabrijela' — Azure hr-HR-GabrijelaNeural (native Croatian, phonemically accurate) [DEFAULT]
//   'charlotte' — ElevenLabs Charlotte (natural/modern, slight non-native accent on Croatian)
//   'auto'      — legacy: Azure for Croatian diacritics, Charlotte otherwise
export function getVoicePreference(): string {
  try {
    const v = localStorage.getItem(VOICE_KEY);
    // 'charlotte' is an explicit opt-in; everything else (including 'auto' and unset) → gabrijela
    return v === 'charlotte' ? 'charlotte' : 'gabrijela';
  } catch { return 'gabrijela'; }
}

export function setVoicePreference(val: string): void {
  try {
    if (val === 'charlotte') {
      localStorage.setItem(VOICE_KEY, val);
    } else {
      // gabrijela is the default — no need to store it
      localStorage.removeItem(VOICE_KEY);
    }
  } catch {}
}

export function isSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === 'true';
  } catch { return true; }
}

export function setSoundEnabled(val: boolean): void {
  try { localStorage.setItem(SOUND_KEY, String(val)); } catch {}
}

export function isHapticEnabled(): boolean {
  try {
    const v = localStorage.getItem(HAPTIC_KEY);
    return v === null ? true : v === 'true';
  } catch { return true; }
}

export function setHapticEnabled(val: boolean): void {
  try { localStorage.setItem(HAPTIC_KEY, String(val)); } catch {}
}

interface AudioWindow {
  webkitAudioContext?: typeof AudioContext;
}

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as AudioWindow).webkitAudioContext!;
    _audioCtx = new AudioCtx();
  }
  return _audioCtx;
}

interface PlayToneOptions {
  freq?: number;
  type?: OscillatorType;
  duration?: number;
  gain?: number;
  rampTo?: number;
}

// Play a synthesized tone if sound is enabled
export function playTone({ freq = 440, type = 'sine' as OscillatorType, duration = 0.3, gain = 0.18, rampTo }: PlayToneOptions = {}): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (rampTo) osc.frequency.exponentialRampToValueAtTime(rampTo, ctx.currentTime + duration);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) { /* audio not supported */ }
}

export function playCorrect(): void {
  playTone({ freq: 880, rampTo: 1100, duration: 0.35, gain: 0.15 });
}

export function playWrong(): void {
  playTone({ freq: 220, type: 'sawtooth', rampTo: 150, duration: 0.3, gain: 0.12 });
}

// Three-note ascending fanfare — lesson / review completion
export function playFanfare(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    const t0 = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      const t = t0 + i * 0.14;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.5);
    });
  } catch (_) {}
}

// Five-note ascending scale — badge / level-up reward
export function playLevelUp(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    const notes = [392, 494, 587, 740, 988]; // G4 B4 D5 F#5 B5
    const t0 = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'triangle';
      const t = t0 + i * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t); osc.stop(t + 0.42);
    });
  } catch (_) {}
}

// Bright double-ding — streak continuation or correct streak
export function playStreak(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.18;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.35);
    });
  } catch (_) {}
}

export function haptic(pattern: number | number[]): void {
  if (!isHapticEnabled()) return;
  try { navigator.vibrate?.(pattern); } catch (_) {}
}
