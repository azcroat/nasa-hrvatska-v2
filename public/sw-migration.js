// One-time SW/cache migration for users on legacy service workers.
// Bumped to v10: deletes ALL v9 and older caches so users get a clean slate.
// v9 had a bug where runtime caches (js-cache, data-chunk-cache, etc.) were
// not prefixed with 'nasa-hrvatska-v9', causing the migration to run on every
// visit and unregister the SW in a loop. v10 prefixes all runtime caches
// correctly, so this migration runs only once per user (when v9 caches exist).
if ('serviceWorker' in navigator) {
  var CURRENT_CACHE_PREFIX = 'nasa-hrvatska-v10';
  caches.keys().then(function(keys) {
    // Only treat as legacy if ANY cache does NOT start with v10 prefix
    var hasLegacy = keys.some(function(k) { return !k.startsWith(CURRENT_CACHE_PREFIX); });
    if (hasLegacy) {
      // Unregister old SW so the new v10 SW takes over cleanly
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      });
      // Delete all non-v10 caches (covers v9 runtime caches + all older versions)
      keys.forEach(function(k) {
        if (!k.startsWith(CURRENT_CACHE_PREFIX)) caches.delete(k);
      });
    }
  });
}
