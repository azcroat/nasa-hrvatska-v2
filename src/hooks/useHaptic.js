// Haptic feedback via the Vibration API (free, browser-native, zero KB)
// Works on Android Chrome/Firefox. No-ops silently on iOS/desktop.

export function useHaptic() {
  function buzz(pattern) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }
  return {
    correct: () => buzz(40),                  // short single pulse — success
    wrong:   () => buzz([40, 30, 40]),        // double pulse — try again
    tap:     () => buzz(15),                  // micro tap for navigation
    award:   () => buzz([30, 20, 30, 20, 80]),// pattern for badge/XP award
  };
}
