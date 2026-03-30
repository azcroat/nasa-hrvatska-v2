// One-time SW/cache migration for users on legacy service workers.
// Bumped to v11: deletes ALL v10 and older caches so users get a clean slate.
// v11 fixes a bug where the SPA catch-all redirect (index.html, MIME text/html)
// could be cached as a JS chunk response, causing "MIME type text/html" errors
// for users present during a deploy when old hash JS files disappear from the CDN.
if ('serviceWorker' in navigator) {
  var CURRENT_CACHE_PREFIX = 'nasa-hrvatska-v11';
  caches.keys().then(function(keys) {
    // Only treat as legacy if ANY cache does NOT start with v11 prefix
    var hasLegacy = keys.some(function(k) { return !k.startsWith(CURRENT_CACHE_PREFIX); });
    if (hasLegacy) {
      // Unregister old SW so the new v11 SW takes over cleanly
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      });
      // Delete all non-v11 caches (covers v10 runtime caches + all older versions)
      keys.forEach(function(k) {
        if (!k.startsWith(CURRENT_CACHE_PREFIX)) caches.delete(k);
      });
    }
  });
}
