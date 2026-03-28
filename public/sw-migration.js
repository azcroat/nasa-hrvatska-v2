// One-time SW/cache migration for users on legacy service workers.
// Runs only when an old cache key is detected, not on every load.
if ('serviceWorker' in navigator) {
  var CURRENT_CACHE_PREFIX = 'nasa-hrvatska-v9';
  caches.keys().then(function(keys) {
    var hasLegacy = keys.some(function(k) { return !k.startsWith(CURRENT_CACHE_PREFIX); });
    if (hasLegacy) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      });
      keys.forEach(function(k) {
        if (!k.startsWith(CURRENT_CACHE_PREFIX)) caches.delete(k);
      });
    }
  });
}
