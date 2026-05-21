// SW update interceptor — runs before React mounts.
// Two responsibilities:
//   1. If a new SW is already waiting or installing, activate it and reload
//      before the app renders stale cached content.
//   2. ACTIVELY check for an update on every load by calling reg.update(),
//      so users don't sit on a stale bundle until the browser's lazy 24-hour
//      heartbeat decides to look. Without this, a fresh deploy can stay
//      unseen by a returning user for hours — they keep seeing old bugs
//      (e.g. /api/content 401s, missing fixes) until they manually
//      unregister the SW. Zero user action required.
(function () {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then(function (reg) {
    if (!reg) return;
    function activate(sw) {
      sw.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        window.location.reload();
      }, { once: true });
    }
    // Case 1: new SW already waiting before this page rendered
    if (reg.waiting) { activate(reg.waiting); return; }
    // Case 2: new SW installs while page is loading (either pre-existing or
    // triggered by the reg.update() call below).
    reg.addEventListener('updatefound', function () {
      var sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', function () {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          activate(sw);
        }
      });
    });
    // Case 3: nothing waiting yet — actively ask the browser to re-fetch
    // sw.js and check for changes. If the bytes differ from the cached SW,
    // the browser fires updatefound (handled above) and the new SW installs.
    // Errors here are non-fatal (offline, network blocked) — we just keep
    // running on the current cached SW until the next opportunity.
    try { reg.update(); } catch (_) {}
  });
})();
