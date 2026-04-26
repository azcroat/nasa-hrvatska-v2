import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getVoicePreference,
  setVoicePreference,
  isSoundEnabled,
  setSoundEnabled,
  isHapticEnabled,
  setHapticEnabled,
  playTone,
  playCorrect,
  playWrong,
  playFanfare,
  playLevelUp,
  playStreak,
  haptic,
} from '../lib/soundSettings.js';

// Set up AudioContext mock for all tests
function makeMockAudioCtx() {
  const mockOscillator = {
    connect: vi.fn(),
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    start: vi.fn(),
    stop: vi.fn(),
  };
  const mockGain = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  return {
    currentTime: 0,
    state: 'running',
    createOscillator: vi.fn(() => mockOscillator),
    createGain: vi.fn(() => mockGain),
    destination: {},
  };
}

const mockAudioCtxInstance = makeMockAudioCtx();
const MockAudioContext = vi.fn(() => mockAudioCtxInstance);

function setupAudioContextMock() {
  // Reset the internal _audioCtx cache by marking it closed
  mockAudioCtxInstance.state = 'closed';
  vi.stubGlobal('AudioContext', MockAudioContext);
}
function teardownAudioContextMock() {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  mockAudioCtxInstance.state = 'running';
}

function clearLS() {
  localStorage.clear();
}

describe('soundSettings — preferences persistence', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  // ── getVoicePreference / setVoicePreference ───────────────────────────────

  it('returns gabrijela when nothing stored', () => {
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('returns gabrijela for unrecognised stored value', () => {
    localStorage.setItem('nh_voice_pref', 'unknown_value');
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('returns gabrijela after setVoicePreference("gabrijela")', () => {
    setVoicePreference('gabrijela');
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('returns charlotte after setVoicePreference("charlotte")', () => {
    setVoicePreference('charlotte');
    expect(getVoicePreference()).toBe('charlotte');
  });

  it('reverts to gabrijela when setVoicePreference called with auto', () => {
    setVoicePreference('charlotte');
    setVoicePreference('auto');
    // 'auto' removes the key — getVoicePreference returns 'gabrijela' as default
    expect(getVoicePreference()).toBe('gabrijela');
    expect(localStorage.getItem('nh_voice_pref')).toBeNull();
  });

  it('reverts to gabrijela when setVoicePreference called with invalid value', () => {
    setVoicePreference('charlotte');
    setVoicePreference('invalid');
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('persists gabrijela across get calls', () => {
    setVoicePreference('gabrijela');
    expect(getVoicePreference()).toBe('gabrijela');
    expect(getVoicePreference()).toBe('gabrijela');
  });

  // ── isSoundEnabled / setSoundEnabled ─────────────────────────────────────

  it('defaults to true (sound on) when nothing stored', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('returns false after setSoundEnabled(false)', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it('returns true after setSoundEnabled(true)', () => {
    setSoundEnabled(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('persists sound preference across reads', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it('stores as string in localStorage', () => {
    setSoundEnabled(false);
    expect(localStorage.getItem('nh_sound_enabled')).toBe('false');
  });

  // ── isHapticEnabled / setHapticEnabled ────────────────────────────────────

  it('defaults to true (haptic on) when nothing stored', () => {
    expect(isHapticEnabled()).toBe(true);
  });

  it('returns false after setHapticEnabled(false)', () => {
    setHapticEnabled(false);
    expect(isHapticEnabled()).toBe(false);
  });

  it('returns true after setHapticEnabled(true)', () => {
    setHapticEnabled(false);
    setHapticEnabled(true);
    expect(isHapticEnabled()).toBe(true);
  });

  it('persists haptic preference across reads', () => {
    setHapticEnabled(false);
    expect(isHapticEnabled()).toBe(false);
    expect(isHapticEnabled()).toBe(false);
  });

  it('stores as string in localStorage', () => {
    setHapticEnabled(false);
    expect(localStorage.getItem('nh_haptic_enabled')).toBe('false');
  });

  // ── cross-preference isolation ────────────────────────────────────────────

  it('sound and haptic preferences are independent', () => {
    setSoundEnabled(false);
    setHapticEnabled(true);
    expect(isSoundEnabled()).toBe(false);
    expect(isHapticEnabled()).toBe(true);
  });

  it('voice and sound preferences are independent', () => {
    setVoicePreference('charlotte');
    setSoundEnabled(false);
    expect(getVoicePreference()).toBe('charlotte');
    expect(isSoundEnabled()).toBe(false);
  });

  it('clearLS resets all preferences to defaults', () => {
    setSoundEnabled(false);
    setHapticEnabled(false);
    setVoicePreference('charlotte');
    clearLS();
    expect(isSoundEnabled()).toBe(true);
    expect(isHapticEnabled()).toBe(true);
    expect(getVoicePreference()).toBe('gabrijela');
  });
});

// ── Audio functions (smoke tests — AudioContext is not available in jsdom) ─────

describe('soundSettings — audio functions (smoke tests)', () => {
  beforeEach(() => {
    clearLS();
    // Provide a minimal AudioContext stub
    setupAudioContextMock();
  });
  afterEach(() => {
    clearLS();
    teardownAudioContextMock();
  });

  it('playTone does not throw when sound is disabled', () => {
    setSoundEnabled(false);
    expect(() => playTone({ freq: 440 })).not.toThrow();
  });

  it('playTone does not throw when sound is enabled (AudioContext stubbed)', () => {
    setSoundEnabled(true);
    expect(() => playTone({ freq: 440, type: 'sine', duration: 0.3 })).not.toThrow();
  });

  it('playTone with rampTo does not throw', () => {
    setSoundEnabled(true);
    expect(() => playTone({ freq: 440, rampTo: 880, duration: 0.5 })).not.toThrow();
  });

  it('playCorrect does not throw', () => {
    setSoundEnabled(true);
    expect(() => playCorrect()).not.toThrow();
  });

  it('playWrong does not throw', () => {
    setSoundEnabled(true);
    expect(() => playWrong()).not.toThrow();
  });

  it('playFanfare does not throw when sound is disabled', () => {
    setSoundEnabled(false);
    expect(() => playFanfare()).not.toThrow();
  });

  it('playFanfare does not throw when sound is enabled', () => {
    setSoundEnabled(true);
    expect(() => playFanfare()).not.toThrow();
  });

  it('playLevelUp does not throw when sound is disabled', () => {
    setSoundEnabled(false);
    expect(() => playLevelUp()).not.toThrow();
  });

  it('playLevelUp does not throw when sound is enabled', () => {
    setSoundEnabled(true);
    expect(() => playLevelUp()).not.toThrow();
  });

  it('playStreak does not throw when sound is disabled', () => {
    setSoundEnabled(false);
    expect(() => playStreak()).not.toThrow();
  });

  it('playStreak does not throw when sound is enabled', () => {
    setSoundEnabled(true);
    expect(() => playStreak()).not.toThrow();
  });
});

// ── haptic ─────────────────────────────────────────────────────────────────────

describe('soundSettings — haptic', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('does nothing when haptic is disabled', () => {
    setHapticEnabled(false);
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrateSpy, configurable: true });
    haptic(100);
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it('calls navigator.vibrate when haptic is enabled', () => {
    setHapticEnabled(true);
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });
    haptic([100, 50, 100]);
    expect(vibrateSpy).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('does not throw when navigator.vibrate is not available', () => {
    setHapticEnabled(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => haptic(100)).not.toThrow();
  });
});

// ── localStorage error resilience (getter catch blocks) ──────────────────────

describe('soundSettings — localStorage error resilience (getters)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('getVoicePreference returns gabrijela when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('isSoundEnabled returns true when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(isSoundEnabled()).toBe(true);
  });

  it('isHapticEnabled returns true when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(isHapticEnabled()).toBe(true);
  });
});

// ── localStorage error resilience (setter catch blocks) ──────────────────────

describe('soundSettings — localStorage error resilience (setters)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('setVoicePreference does not throw when localStorage.setItem throws (charlotte path)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // 'charlotte' path calls localStorage.setItem — must be swallowed
    expect(() => setVoicePreference('charlotte')).not.toThrow();
  });

  it('setVoicePreference does not throw when localStorage.removeItem throws (gabrijela path)', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // non-charlotte path calls localStorage.removeItem — must be swallowed
    expect(() => setVoicePreference('gabrijela')).not.toThrow();
  });

  it('setSoundEnabled does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setSoundEnabled(false)).not.toThrow();
  });

  it('setHapticEnabled does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setHapticEnabled(false)).not.toThrow();
  });
});
