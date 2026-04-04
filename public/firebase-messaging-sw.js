// firebase-messaging-sw.js — SELF-UNREGISTERING STUB
//
// This file previously registered a competing service worker at scope '/'
// that conflicted with the Vite PWA sw.js. All push notification, FCM, and
// periodic sync functionality has been merged into sw.js (the single combined
// service worker for this app).
//
// This stub immediately takes control and unregisters itself so that any
// browser that previously registered this SW can clean up. After unregistering,
// the main sw.js will take back full control of scope '/'.
//
// DO NOT add any feature code here. This file exists solely for the migration
// period while users still have the old SW cached.

self.addEventListener('install', () => {
  // Skip waiting so this stub activates immediately, even in tabs that have
  // the old firebase-messaging-sw.js active. Without skipWaiting, browsers
  // that already have this SW as the controller would keep it indefinitely.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.unregister()
      .then(() => {
        // After unregistering, force all controlled clients to reload so the
        // main sw.js can take back control. Without this, clients would
        // continue running under a now-unregistered SW until next navigation.
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      })
      .then(clients => {
        // Only reload clients that are not in the process of navigating.
        // Reloading mid-navigation would discard the user's current state.
        for (const client of clients) {
          client.navigate(client.url).catch(() => {});
        }
      })
      .catch(() => {
        // If unregistration fails (permissions, race condition), do nothing.
        // The main sw.js will eventually take over on the next page load.
      })
  );
});
