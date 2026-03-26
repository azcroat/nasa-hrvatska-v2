// pushNotifications.js — Web Push Notifications using Firebase Cloud Messaging
// Handles permission requests, token management, and local notification scheduling

const NOTIF_KEY = 'nh_notifications_enabled';
const TOKEN_KEY = 'nh_fcm_token';

export function isNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

export function setNotificationsEnabled(val) {
  localStorage.setItem(NOTIF_KEY, String(val));
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export async function initPushNotifications(firebaseApp) {
  try {
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const messaging = getMessaging(firebaseApp);

    // VAPID key — replace with your actual VAPID key from Firebase Console
    // Go to: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
    const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
    });

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      return { token, messaging };
    }
    return { token: null, messaging };
  } catch (e) {
    console.warn('Push notifications not available:', e.message);
    return { token: null, messaging: null };
  }
}

export function getFCMToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Schedule a local notification (fallback when FCM backend not set up)
// Shows a local notification after a delay if user hasn't practiced today
export function scheduleLocalReminder(streakDays = 0) {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const lastPractice = localStorage.getItem('nh_last_practice_date');
  const today = new Date().toISOString().slice(0, 10);

  if (lastPractice === today) return; // already practiced today

  // Schedule for 7pm if it's before 7pm, otherwise tomorrow
  const now = new Date();
  const target = new Date();
  target.setHours(19, 0, 0, 0);
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  const delayMs = target - now;
  const messages = [
    { title: "🔥 Don't break your streak!", body: `You're on a ${streakDays}-day streak — keep it going!` },
    { title: '🇭🇷 Croatian practice time!', body: 'Just 5 minutes keeps your skills sharp.' },
    { title: `⚡ ${streakDays} days strong!`, body: 'Come practice and protect your streak.' },
  ];

  const msg = messages[streakDays % messages.length];

  setTimeout(() => {
    if (isNotificationsEnabled() && Notification.permission === 'granted') {
      new Notification(msg.title, {
        body: msg.body,
        icon: '/icons/icon-192x192.png',
        tag: 'nh-daily-reminder',
        renotify: true,
      });
    }
  }, delayMs);
}

// Register the Firebase messaging service worker
export async function registerMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    return reg;
  } catch (e) {
    console.warn('FCM service worker registration failed:', e.message);
    return null;
  }
}
