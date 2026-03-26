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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
