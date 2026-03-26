// pushNotifications.js — Web Push Notifications
// Uses the Web Push API directly with a generated VAPID key pair.
// No Firebase Console setup required.
//
// To send server-side pushes, use the `web-push` npm package with:
//   VAPID_PUBLIC_KEY  = (see VAPID_PUBLIC_KEY constant below)
//   VAPID_PRIVATE_KEY = (stored in Cloudflare env var VAPID_PRIVATE_KEY)
//   Contact email     = mailto:jschreiner75@gmail.com

const NOTIF_KEY = 'nh_notifications_enabled';
const SUB_KEY   = 'nh_push_subscription';

// ECDH P-256 VAPID key pair generated for this project.
// Public key is safe to include in client code.
// Private key is stored as Cloudflare Pages env var VAPID_PRIVATE_KEY.
export const VAPID_PUBLIC_KEY =
  'BAFN-xEz0NYzDK8Pn9cdKTuTFYNd_cpQQxM_nKRVwz65tzBB--dPawvo59OPkoUlh8GuvIjd1phITqLmJFpnirc';

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

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
  return Notification.requestPermission();
}

// Register for Web Push using our generated VAPID key.
// Stores the subscription in localStorage for server-side access.
// Also registers Periodic Background Sync for daily reminders (Chrome/Edge).
export async function initPushNotifications() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { subscription: null };
    }

    const registration = await navigator.serviceWorker.ready;

    // Reuse existing subscription if it already exists
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    localStorage.setItem(SUB_KEY, JSON.stringify(subscription.toJSON()));

    // Register Periodic Background Sync for daily reminders (no server needed)
    if ('periodicSync' in registration) {
      try {
        await registration.periodicSync.register('nh-daily-reminder', {
          minInterval: 24 * 60 * 60 * 1000,
        });
      } catch (_) { /* permission not granted or API unavailable */ }
    }

    return { subscription };
  } catch (e) {
    console.warn('Push notifications not available:', e.message);
    return { subscription: null };
  }
}

export function getPushSubscription() {
  const raw = localStorage.getItem(SUB_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Schedule a local notification for today at 7pm (or tomorrow if past 7pm).
// Falls back gracefully — works whenever browser tab is open.
export function scheduleLocalReminder(streakDays = 0) {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const lastPractice = localStorage.getItem('nh_last_practice_date');
  const today = new Date().toISOString().slice(0, 10);
  if (lastPractice === today) return;

  const now    = new Date();
  const target = new Date();
  target.setHours(19, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);

  const messages = [
    { title: "🔥 Don't break your streak!", body: `You're on a ${streakDays}-day streak — keep it going!` },
    { title: '🇭🇷 Croatian practice time!',  body: 'Just 5 minutes keeps your skills sharp.'            },
    { title: `⚡ ${streakDays} days strong!`, body: 'Come practice and protect your streak.'             },
  ];
  const msg = messages[streakDays % messages.length];

  setTimeout(() => {
    if (isNotificationsEnabled() && Notification.permission === 'granted') {
      new Notification(msg.title, {
        body:     msg.body,
        icon:     '/icons/icon-192x192.png',
        tag:      'nh-daily-reminder',
        renotify: true,
      });
    }
  }, target - now);
}

// Register the service worker (same file handles both FCM background messages
// and direct Web Push events).
export async function registerMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  } catch (e) {
    console.warn('Service worker registration failed:', e.message);
    return null;
  }
}
