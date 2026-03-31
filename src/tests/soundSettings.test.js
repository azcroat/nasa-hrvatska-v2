import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getVoicePreference,
  setVoicePreference,
  isSoundEnabled,
  setSoundEnabled,
  isHapticEnabled,
  setHapticEnabled,
} from '../lib/soundSettings.js';

// playTone / playCorrect / playWrong / haptic use browser AudioContext + navigator.vibrate
// — those are excluded from coverage (browser-only, not testable in jsdom without
//   complex mocking that would couple tests to implementation details).

function clearLS() { localStorage.clear(); }

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
