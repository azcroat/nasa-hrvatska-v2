// SW/cache migration script — cleans up pre-v12 legacy caches.
// Uses 'nasa-hrvatska-v' as the current prefix so ALL versioned caches
// (v12, v13, v14, v15, ...) are treated as current and never nuked.
// Only caches with a completely different naming scheme are removed.
// NOTE: SW unregister removed — it was killing v13+ SWs and causing a
// blank-white-screen infinite reload loop for all users.
// Skip in Capacitor native shell — SW and Cache API are unavailable in WebView.
if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
  var CURRENT_CACHE_PREFIX = 'nasa-hrvatska-v';
  caches.keys().then(function(keys) {
    keys.forEach(function(k) {
      if (!k.startsWith(CURRENT_CACHE_PREFIX)) caches.delete(k);
    });
  });
}
