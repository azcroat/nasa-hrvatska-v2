// firebase-messaging-sw.js — SELF-UNREGISTERING STUB
//
// This file previously registered a competing service worker at scope '/'
// that conflicted with the Vite PWA sw.js. All push notification, FCM, and
// periodic sync functionality has been merged into sw.js (the single combined
// service worker for this app).
//
// This stub immediately takes control and unregisters itself so that any
// browser that previously registered this SW can clean up. After unregistering,
// the main sw.js will take back full control of scope '/' on the next page load.
//
// DO NOT add any feature code here. This file exists solely for the migration
// period while users still have the old SW cached.

self.addEventListener('install', event => {
  // event.waitUntil ensures the browser waits for skipWaiting() before
  // considering the install complete. Omitting waitUntil is unreliable on
  // some browsers — the SW may not advance to activate without it.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.unregister().catch(() => {
      // If unregistration fails (race condition, permissions), do nothing.
      // The main sw.js will take over naturally on the next page load.
    })
  );
  // Note: we deliberately do NOT call client.navigate() here.
  // After unregistering, this SW no longer controls any clients, so
  // navigate() would be unreliable. The main sw.js (registered via
  // registerSW({ immediate: true }) in main.jsx) will claim control
  // on the user's next page interaction or navigation.
});
