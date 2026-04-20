/**
 * usePwaInstall — PWA install prompt state for iOS and Android/Chrome.
 *
 * Install prompts are disabled until the app is listed in the Google Play
 * Store and Apple App Store. Re-enable by removing the early return below.
 */
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  preventDefault(): void;
}

interface UsePwaInstallParams {
  authScreen: string;
}

interface UsePwaInstallResult {
  showPwaInstall: boolean;
  setShowPwaInstall: React.Dispatch<React.SetStateAction<boolean>>;
  showAndroidInstall: boolean;
  setShowAndroidInstall: React.Dispatch<React.SetStateAction<boolean>>;
  deferredInstallPrompt: BeforeInstallPromptEvent | null;
  setDeferredInstallPrompt: React.Dispatch<React.SetStateAction<BeforeInstallPromptEvent | null>>;
}

export function usePwaInstall({
  authScreen: _authScreen,
}: UsePwaInstallParams): UsePwaInstallResult {
  const [showPwaInstall, setShowPwaInstall] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // DISABLED: suppress the browser's default mini-infobar even while prompts are off
  useEffect(() => {
    const handler = (e: Event): void => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return {
    showPwaInstall,
    setShowPwaInstall,
    showAndroidInstall,
    setShowAndroidInstall,
    deferredInstallPrompt,
    setDeferredInstallPrompt,
  };
}
