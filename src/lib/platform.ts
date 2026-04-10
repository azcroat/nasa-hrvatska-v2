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
  return typeof window !== 'undefined' &&
    !!((window as unknown as CapacitorWindow).Capacitor?.isNativePlatform?.());
}

export function isAndroid(): boolean {
  return isNative() &&
    (window as unknown as CapacitorWindow).Capacitor?.getPlatform?.() === 'android';
}

export function isIos(): boolean {
  return isNative() &&
    (window as unknown as CapacitorWindow).Capacitor?.getPlatform?.() === 'ios';
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!((window as unknown as CapacitorWindow).SpeechRecognition || (window as unknown as CapacitorWindow).webkitSpeechRecognition);
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
 */
export const API_BASE: string = isNative() ? 'https://nasahrvatska.com' : '';
