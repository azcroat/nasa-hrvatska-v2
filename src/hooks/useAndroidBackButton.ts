// useAndroidBackButton.ts
// Handles the Android hardware back button via @capacitor/app.
// When the user presses Back, we call goBack() if a screen is open,
// or exit the app if we're on the root tab view (no back-stack).
//
// This hook is a no-op in browser and iOS — safe to call unconditionally.

import { useEffect, useRef } from 'react';
import { isAndroid } from '../lib/platform.js';

/**
 * @param canGoBack — returns true if there's a screen to pop
 * @param goBack    — pops the current screen
 */
export function useAndroidBackButton(canGoBack: () => boolean, goBack: () => void): void {
  // Refs hold the latest callback values so the Capacitor listener (registered once
  // on mount) always calls the current version without needing to re-register.
  // Previously the empty dep-array caused a stale closure: canGoBack/goBack captured
  // the initial render values and never saw subsequent navigation state changes.
  const canGoBackRef = useRef<() => boolean>(canGoBack);
  const goBackRef    = useRef<() => void>(goBack);

  // Keep refs current on every render — no re-registration needed.
  useEffect(() => {
    canGoBackRef.current = canGoBack;
    goBackRef.current    = goBack;
  });

  useEffect(() => {
    if (!isAndroid()) return;

    let removeListener: (() => void) | null = null;

    async function register(): Promise<void> {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack: nativeCanGoBack }: { canGoBack: boolean }) => {
          if (canGoBackRef.current()) {
            goBackRef.current();
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
  }, []); // Listener registered once — refs stay current via the effect above
}
