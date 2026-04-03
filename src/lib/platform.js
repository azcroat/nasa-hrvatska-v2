// platform.js — Capacitor / native platform detection helpers.
// Safe to call in browser; all checks guard against undefined.

/**
 * Returns true when running inside a Capacitor native shell (Android or iOS).
 * This is the canonical check — use it before calling any Capacitor plugin.
 */
export function isNative() {
  return typeof window !== 'undefined' &&
    !!(window.Capacitor && window.Capacitor.isNativePlatform?.());
}

/** True when running in the Android Capacitor shell. */
export function isAndroid() {
  return isNative() &&
    window.Capacitor?.getPlatform?.() === 'android';
}

/** True when running in the iOS Capacitor shell. */
export function isIos() {
  return isNative() &&
    window.Capacitor?.getPlatform?.() === 'ios';
}

/**
 * True when the Web Speech API (SpeechRecognition) is available.
 * Android WebView does NOT support it — only Chrome desktop and Safari do.
 * We check the constructors rather than UserAgent to stay forward-compatible.
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
