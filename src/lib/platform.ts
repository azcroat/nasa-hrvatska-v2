// platform.ts — Capacitor / native platform detection helpers.

interface CapacitorWindow {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
}

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  // Primary: hostname-based detection is synchronous and race-condition-free.
  // Capacitor Android serves from https://localhost (no port).
  // Dev/CI servers always have a port (e.g. localhost:4173).
  if (window.location.hostname === 'localhost' && !window.location.port) return true;
  // Fallback: Capacitor bridge API (may not be injected at module load time)
  return !!(window as unknown as CapacitorWindow).Capacitor?.isNativePlatform?.();
}

export function isAndroid(): boolean {
  if (!isNative()) return false;
  // Primary: user-agent is synchronous and always available
  if (/android/i.test(navigator.userAgent)) return true;
  // Fallback: Capacitor bridge
  return (window as unknown as CapacitorWindow).Capacitor?.getPlatform?.() === 'android';
}

export function isIos(): boolean {
  // Detect iOS on ALL contexts: native Capacitor, iOS Safari PWA, and iOS Safari browser.
  // Do NOT gate on isNative() — iOS Safari is not a "native" Capacitor app but still
  // needs iOS-specific audio workarounds.
  if (/ipad|iphone|ipod/i.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports as 'MacIntel' but has touch support
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  // Capacitor native bridge — checked last as it may not be injected at module load
  return isNative() && (window as unknown as CapacitorWindow).Capacitor?.getPlatform?.() === 'ios';
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(
      (window as unknown as CapacitorWindow).SpeechRecognition ||
      (window as unknown as CapacitorWindow).webkitSpeechRecognition
    )
  );
}

/**
 * Open an external URL safely on all platforms.
 *
 * On native (Android/iOS): uses @capacitor/browser which opens Chrome Custom
 * Tabs (Android) or SFSafariViewController (iOS) — a full browser engine that
 * handles YouTube, HRT, news sites etc. without escaping the app.
 *
 * On web: falls back to window.open with noopener.
 */
export async function openUrl(url: string): Promise<void> {
  if (!url) return;
  if (isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url, presentationStyle: 'popover' });
      return;
    } catch {
      // fallthrough to window.open if plugin unavailable
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Absolute API base for native — relative URLs resolve to https://localhost
 * inside Capacitor WebView, not nasahrvatska.com.
 * Note: for TTS, prefer _ttsPost() in audio.ts which tries multiple endpoints.
 */
export const API_BASE: string = isNative() ? 'https://nasahrvatska.com' : '';

/**
 * Ordered list of API base URLs to try for native builds.
 * Falls back to nasa-hrvatska-v2.pages.dev if the custom domain is unreachable.
 */
export const NATIVE_API_ENDPOINTS: string[] = isNative()
  ? ['https://nasahrvatska.com', 'https://nasa-hrvatska-v2.pages.dev']
  : [''];
