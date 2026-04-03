// useAndroidBackButton.js
// Handles the Android hardware back button via @capacitor/app.
// When the user presses Back, we call goBack() if a screen is open,
// or exit the app if we're on the root tab view (no back-stack).
//
// This hook is a no-op in browser and iOS — safe to call unconditionally.

import { useEffect } from 'react';
import { isAndroid } from '../lib/platform.js';

/**
 * @param {() => boolean} canGoBack  — returns true if there's a screen to pop
 * @param {() => void}    goBack     — pops the current screen
 */
export function useAndroidBackButton(canGoBack, goBack) {
  useEffect(() => {
    if (!isAndroid()) return;

    let removeListener = null;

    async function register() {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack: nativeCanGoBack }) => {
          if (canGoBack()) {
            goBack();
          } else if (!nativeCanGoBack) {
            // No more history — minimise the app (standard Android behaviour)
            App.minimizeApp();
          }
        });
        removeListener = () => handle.remove();
      } catch (_) {
        // Plugin not available in this environment — safe to ignore
      }
    }

    register();
    return () => { if (removeListener) removeListener(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // goBack/canGoBack are stable refs — intentionally not in deps
}
