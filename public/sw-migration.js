// One-time SW/cache migration for users on legacy service workers.
// Bumped to v12: deletes ALL v11 and older caches so users get a clean slate.
// v12 adds a cacheWillUpdate Content-Type check to the JS chunk handlers so that
// Cloudflare's SPA catch-all (/* /index.html 200, MIME text/html) is never cached
// as a JS chunk — fully closing the MIME-type crash that v11 only partially addressed
// by removing opaque responses (status 0) while still allowing status-200 HTML.
if ('serviceWorker' in navigator) {
  var CURRENT_CACHE_PREFIX = 'nasa-hrvatska-v12';
  caches.keys().then(function(keys) {
    // Only treat as legacy if ANY cache does NOT start with v12 prefix
    var hasLegacy = keys.some(function(k) { return !k.startsWith(CURRENT_CACHE_PREFIX); });
    if (hasLegacy) {
      // Unregister old SW so the new v12 SW takes over cleanly
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      });
      // Delete all non-v12 caches (covers v11 + all older versions)
      keys.forEach(function(k) {
        if (!k.startsWith(CURRENT_CACHE_PREFIX)) caches.delete(k);
      });
    }
  });
}
