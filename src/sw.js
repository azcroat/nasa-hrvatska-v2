// ═══════════════════════════════════════════════════════════════════════════
// Naša Hrvatska — Combined Service Worker
// Merges: Workbox precaching/routing + Firebase Cloud Messaging + VAPID Web Push
//
// This is the SINGLE service worker for the entire app, eliminating the
// previous conflict between sw.js (Vite PWA) and firebase-messaging-sw.js
// competing for scope '/'. Two SWs at the same scope cause:
//   - Unexpected page reloads (controllerchange fires for Firebase SW takeover)
//   - Offline mode broken (Firebase SW has no fetch handler)
//   - Push notifications unreliable (race between two SWs)
// ═══════════════════════════════════════════════════════════════════════════

import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// ── Lifecycle ────────────────────────────────────────────────────────────────

// Take control immediately on install/update — no waiting for old tabs to close.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Snapshot existing clients BEFORE claim() — these are tabs running old code.
      const existingClients = await self.clients.matchAll({ type: 'window' });
      const isUpdate = existingClients.length > 0;

      // Take control of all open tabs immediately.
      await self.clients.claim();

      // After claiming, if this is a genuine update (not first install),
      // tell every tab to reload so they pick up new assets.
      // Loop-safe: after reload the new SW is already active — activate will
      // not fire again for those pages, so no second SW_UPDATED message is sent.
      if (isUpdate) {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
      }
    })()
  );
});

// Allow the app to trigger activation of a waiting SW (Path 3 in main.jsx).
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Workbox precache ─────────────────────────────────────────────────────────
// vite-plugin-pwa injectManifest injects __WB_MANIFEST at build time.
// Contains app shell: index.html, CSS, fonts, icons, offline.html.

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── Runtime caching ──────────────────────────────────────────────────────────

// __BUILD_ID__ is injected by Vite at build time — unique timestamp per deploy.
// No manual version bumping ever needed.
// eslint-disable-next-line no-undef
const CACHE_VER = 'nasa-hrvatska-v' + __BUILD_ID__;

// 1. Data chunks (vocab, grammar, exercises, lessons, scenarios, cultural, geo,
//    stories, pitch-data, daily, songs) — StaleWhileRevalidate.
//    Plugin guards: reject HTML responses (Cloudflare SPA fallback confusion).
registerRoute(
  /\/assets\/chunk-(data|vocabulary|grammar|exercises|lessons|scenarios|cultural|geo|stories|pitch-data|daily|songs)[^/]*\.js$/,
  new StaleWhileRevalidate({
    cacheName: `${CACHE_VER}-data`,
    plugins: [
      new ExpirationPlugin({ maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [200] }),
      {
        cacheWillUpdate: async ({ response }) => {
          const ct = response?.headers?.get('content-type');
          return ct?.startsWith('text/html') ? null : response;
        },
      },
    ],
  })
);

// 2. All other JS chunks — NetworkFirst (network, then cache fallback).
//    Always fetches latest JS from network; cache only used when offline.
//    This prevents stale JS being served immediately after a deploy.
//    fetchDidSucceed: throw on HTML response so lazyWithReload catches MIME error.
//    cacheWillUpdate: never store HTML in JS cache.
registerRoute(
  /\.js$/,
  new NetworkFirst({
    cacheName: `${CACHE_VER}-js`,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [200] }),
      {
        fetchDidSucceed: async ({ response }) => {
          const ct = response?.headers?.get('content-type');
          if (ct?.startsWith('text/html')) throw new Error('Failed to fetch');
          return response;
        },
        cacheWillUpdate: async ({ response }) => {
          const ct = response?.headers?.get('content-type');
          return ct?.startsWith('text/html') ? null : response;
        },
      },
    ],
  })
);

// 3. Images (SVG, PNG, WebP, JPG) — CacheFirst, 1-year TTL.
registerRoute(
  /\.(svg|png|webp|jpg|jpeg)$/,
  new CacheFirst({
    cacheName: `${CACHE_VER}-images`,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// 4. SPA navigation — three-level fallback:
//    (a) network (10s timeout) → fresh content
//    (b) runtime cache hit    → last-seen version
//    (c) precached index.html → offline SPA shell (React Router handles route client-side)
//
//    This ensures the app is fully usable offline even on the very first offline visit,
//    before the runtime cache has been warmed up from a previous online navigation.
//
//    NavigationRoute is used instead of a request-mode matcher so Workbox correctly
//    applies same-origin navigation semantics. API routes are excluded via denylist
//    so /api/* calls are never intercepted as page navigations.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: `${CACHE_VER}-html`,
      networkTimeoutSeconds: 10,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        {
          // When both network AND runtime cache fail (e.g. offline with cold cache),
          // serve the Workbox-precached index.html so the SPA shell always loads.
          // React Router then handles the deep-link URL client-side without a server round-trip.
          handlerDidError: async () => matchPrecache('index.html'),
        },
      ],
    }),
    { denylist: [/^\/api\//] } // never intercept API requests as page navigations
  )
);

// 5. Audio assets — StaleWhileRevalidate with range-request support.
registerRoute(
  /\/audio\/.*\.(mp3|ogg|wav)$/i,
  new StaleWhileRevalidate({
    cacheName: `${CACHE_VER}-audio`,
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new RangeRequestsPlugin(),
      new CacheableResponsePlugin({ statuses: [0, 200, 206] }),
    ],
  })
);

// 6. Google Fonts — CacheFirst, 1-year TTL.
registerRoute(
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: `${CACHE_VER}-fonts`,
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// 7. Firebase realtime / Firestore — always network, never cached.
registerRoute(/^https:\/\/[a-z0-9-]+\.firebaseio\.com\/.*/i, new NetworkOnly());
registerRoute(/^https:\/\/firestore\.googleapis\.com\/.*/i, new NetworkOnly());

// ── Firebase Cloud Messaging ─────────────────────────────────────────────────
// FCM background messages (app in background / closed tab).
// Firebase config is loaded from Vite build-time env vars (import.meta.env).
// This works because vite-plugin-pwa uses the injectManifest strategy, which
// processes sw.js through Vite's Rollup pipeline — import.meta.env is available
// just like in any other source file. Values must be set in .env / Cloudflare
// Pages dashboard (same VITE_FIREBASE_* vars used by src/lib/firebase.ts).

const _firebaseApp = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
});

const _messaging = getMessaging(_firebaseApp);

onBackgroundMessage(_messaging, (payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Naša Hrvatska', {
    body:     body  || 'Time to practice your Croatian! 🇭🇷',
    icon:     icon  || '/icons/icon-192x192.png',
    badge:    '/icons/badge-72.png',
    tag:      'nh-daily-reminder',
    renotify: true,
    data:     payload.data || {},
    actions: [
      { action: 'study',   title: '📚 Study Now' },
      { action: 'dismiss', title: 'Later'         },
    ],
  });
});

// ── VAPID Web Push ───────────────────────────────────────────────────────────
// Direct Web Push events signed with our own VAPID private key
// (not routed through FCM). Fired when server calls /api/push-send.

self.addEventListener('push', (event) => {
  let data = { title: 'Naša Hrvatska', body: 'Time to practice your Croatian! 🇭🇷' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}
  const notifData = Object.assign({ url: '/' }, data.data || {});
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon  || '/icons/icon-192x192.png',
      badge:    data.badge || '/icons/badge-72.png',
      tag:      data.tag   || 'streak-reminder',
      renotify: true,
      data:     notifData,
      actions:  data.actions || [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    })
  );
});

// ── Periodic Background Sync ─────────────────────────────────────────────────
// Daily reminder without a push server (Chrome/Edge).
// Rotates through 5 message pairs seeded by current day-of-epoch.

const _PERIODIC_MESSAGES = [
  { title: '🇭🇷 Naša Hrvatska',         body: 'Time to practice your Croatian today!' },
  { title: '📚 Review time!',            body: "Your Croatian words are waiting — 5 minutes keeps the momentum going." },
  { title: '🔥 Keep your streak alive!', body: "Dobar dan! Complete today's lesson to stay on track." },
  { title: '🧠 Memory check!',           body: 'Croatian words fade without practice — a quick review locks them in.' },
  { title: '⚡ Just 5 minutes!',         body: 'Quick quiz? Your future self will thank you. Hajde! 🇭🇷' },
];

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'nh-daily-reminder') return;
  const msg = _PERIODIC_MESSAGES[Math.floor(Date.now() / 86400000) % _PERIODIC_MESSAGES.length];
  event.waitUntil(
    self.registration.showNotification(msg.title, {
      body:     msg.body,
      icon:     '/icons/icon-192x192.png',
      badge:    '/icons/badge-72.png',
      tag:      'nh-daily-reminder',
      renotify: true,
      data:     { url: '/', action: 'open_lesson' },
      actions: [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    })
  );
});

// ── Notification click ───────────────────────────────────────────────────────
// 'study' / 'open' / default tap → navigate to app.
// 'dismiss' → close only.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
