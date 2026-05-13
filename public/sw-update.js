// SW update interceptor — runs before React mounts.
// If a new SW is already waiting, activate it and reload before
// the app renders stale cached content. Zero user action required.
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
    // Case 2: new SW installs while page is loading
    reg.addEventListener('updatefound', function () {
      var sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', function () {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          activate(sw);
        }
      });
    });
  });
})();
