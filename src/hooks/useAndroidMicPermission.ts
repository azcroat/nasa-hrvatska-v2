// useAndroidMicPermission.ts
// Shows an in-app microphone rationale on Android before the system dialog fires.
//
// On the first mic request on Android, the system dialog appears with no context.
// This hook checks permission state via navigator.permissions and sets a flag
// so the calling component can show an explanation banner before calling getUserMedia.
//
// Usage:
//   const { needsRationale, dismissRationale } = useAndroidMicPermission();
//   if (needsRationale) return <MicRationaleDialog onAccept={dismissRationale} />;

import { useState, useEffect } from 'react';
import { isAndroid } from '../lib/platform.js';

const RATIONALE_KEY = 'nh_mic_rationale_shown';

/**
 * Returns:
 *   needsRationale — true when on Android and rationale has not yet been shown
 *   dismissRationale — call this when the user taps "Got it" on your rationale UI
 *   micGranted — null=unknown, true=granted, false=denied/prompt
 */
export function useAndroidMicPermission(): {
  needsRationale: boolean;
  dismissRationale: () => void;
  micGranted: boolean | null;
} {
  const [needsRationale, setNeedsRationale] = useState(false);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAndroid()) return; // no rationale needed on browser/iOS

    const alreadyShown = localStorage.getItem(RATIONALE_KEY) === '1';
    if (alreadyShown) return; // user has seen it before

    // Check current mic permission state
    if (typeof navigator.permissions?.query === 'function') {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            // Already granted — no rationale or dialog needed
            setMicGranted(true);
            localStorage.setItem(RATIONALE_KEY, '1');
          } else if (result.state === 'prompt') {
            // System will show a dialog — show our rationale first
            setNeedsRationale(true);
          } else {
            // Denied — let the calling component surface the error
            setMicGranted(false);
          }
        })
        .catch(() => {
          // permissions API unavailable — proceed without rationale
        });
    } else {
      // Permissions API not available — show rationale as a safe default
      setNeedsRationale(true);
    }
  }, []);

  function dismissRationale(): void {
    localStorage.setItem(RATIONALE_KEY, '1');
    setNeedsRationale(false);
  }

  return { needsRationale, dismissRationale, micGranted };
}
