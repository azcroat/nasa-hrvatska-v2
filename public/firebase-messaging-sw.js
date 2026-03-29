// firebase-messaging-sw.js
// Firebase Cloud Messaging service worker for push notifications
//
// NOTE: Service workers cannot access import.meta.env (Vite build-time variables).
// The Firebase config values below must be hardcoded here manually.
// Your actual values are stored as Cloudflare Pages environment variables:
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
//   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
// Find them in: Cloudflare Dashboard → Pages → nasa-hrvatska-v2 → Settings → Environment variables
// Or in Firebase Console → Project Settings → General → Your apps → Firebase SDK snippet

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCD4ul4KCILkufNMk5qCr-C5JiN9D7ogn0",
  authDomain: "ucimohrvatski-488f9.firebaseapp.com",
  projectId: "ucimohrvatski-488f9",
  storageBucket: "ucimohrvatski-488f9.firebasestorage.app",
  messagingSenderId: "675614569794",
  appId: "1:675614569794:web:d19f7defeac55b0b4b04db",
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background tab)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Naša Hrvatska', {
    body: body || 'Time to practice your Croatian! 🇭🇷',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'nh-daily-reminder',
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Practice Now →' },
      { action: 'dismiss', title: 'Later' },
    ],
  });
});

// Handle direct Web Push events (no FCM — signed with our own VAPID private key)
self.addEventListener('push', (event) => {
  let data = { title: 'Naša Hrvatska', body: 'Time to practice your Croatian! 🇭🇷' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}
  // Merge data.data (nested payload from streak-push.js) into top-level for convenience
  const notifData = Object.assign({ url: '/' }, data.data || {});
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon    || '/icons/icon-192x192.png',
      badge:    data.badge   || '/icons/badge-72.png',
      tag:      data.tag     || 'streak-reminder',
      renotify: true,
      data:     notifData,
      actions:  data.actions || [
        { action: 'study',   title: '📚 Study Now' },
        { action: 'dismiss', title: 'Later'         },
      ],
    })
  );
});

// Periodic Background Sync — daily reminder without a push server (Chrome/Edge)
// Rotates through 5 message pairs using the current day as a seed.
const _PERIODIC_MESSAGES = [
  { title: '🇭🇷 Naša Hrvatska',          body: 'Time to practice your Croatian today!' },
  { title: '📚 Review time!',             body: 'Your Croatian words are waiting — 5 minutes keeps the momentum going.' },
  { title: '🔥 Keep your streak alive!',  body: 'Dobar dan! Complete today\'s lesson to stay on track.' },
  { title: '🧠 Memory check!',            body: 'Croatian words fade without practice — a quick review locks them in.' },
  { title: '⚡ Just 5 minutes!',          body: 'Quick quiz? Your future self will thank you. Hajde! 🇭🇷' },
];
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'nh-daily-reminder') {
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
  }
});

// Handle notification click
// Actions: 'study' or 'open' → open/focus the app; 'dismiss' → close only.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // 'dismiss' action: just close
  if (event.action === 'dismiss') return;
  // 'study', 'open', or default tap → navigate to app
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open app window if one exists
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window at the target URL
      return clients.openWindow(url);
    })
  );
});
