// Capacitor native detection — applied synchronously before React mounts so CSS
// overrides take effect from the very first paint.
// Detection uses window.location.hostname === 'localhost' with no port — set by
// the OS before any JS runs (Capacitor androidScheme:'https' -> origin https://localhost).
// This is 100% race-condition-free; window.Capacitor bridge injection is async
// and unreliable at this point.
try {
  // Capacitor Android: https://localhost (no port).
  // Dev/CI server: http://localhost:4173 (has a port).
  if (window.location.hostname === 'localhost' && !window.location.port) {
    document.documentElement.classList.add('capacitor-native');
  }
} catch (e) {}
