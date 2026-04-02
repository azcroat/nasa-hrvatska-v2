/**
 * usePwaInstall — PWA install prompt state for iOS and Android/Chrome.
 *
 * Install prompts are disabled until the app is listed in the Google Play
 * Store and Apple App Store. Re-enable by removing the early return below.
 *
 * @param {{ authScreen: string }} params
 */
import { useState, useEffect } from 'react';

export function usePwaInstall({ authScreen: _authScreen }) {
  const [showPwaInstall, setShowPwaInstall] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  // DISABLED: suppress the browser's default mini-infobar even while prompts are off
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return {
    showPwaInstall, setShowPwaInstall,
    showAndroidInstall, setShowAndroidInstall,
    deferredInstallPrompt, setDeferredInstallPrompt,
  };
}
