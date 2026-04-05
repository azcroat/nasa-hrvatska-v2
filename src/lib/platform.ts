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
