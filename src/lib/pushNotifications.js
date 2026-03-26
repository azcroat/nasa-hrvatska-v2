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

    // Fire re-engagement reminder if user has been absent
    scheduleReEngagementReminder();

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

// Goal-specific reminder message pools
const GOAL_MESSAGES = {
  heritage: [
    { title: "🇭🇷 Your heritage is calling!",          body: "Take 5 minutes to honor your roots today." },
    { title: "Tvoji preci bi bili ponosni",             body: "Practice today — your ancestors would be proud!" },
    { title: "Connect with your roots",                 body: "5 minutes of Croatian keeps your heritage alive." },
  ],
  family: [
    { title: "👨‍👩‍👧 Your family is waiting!",             body: "Practice so they can hear you speak Croatian!" },
    { title: "Practice for the people you love 💙",    body: "5 minutes today brings you closer to them." },
    { title: "Impress them next time",                  body: "Keep going — they'll love hearing your Croatian!" },
  ],
  travel: [
    { title: "✈️ Croatia is closer than you think!",   body: "Practice today for an unforgettable trip!" },
    { title: "Your trip will be unforgettable 🌊",     body: "Better Croatian = a better Croatia experience." },
    { title: "Order coffee like a local",               body: "Just 5 minutes! Jedna kava, molim. ☕" },
  ],
  culture: [
    { title: "🎵 Croatian culture awaits!",            body: "Practice today and dive deeper into the culture." },
    { title: "Music, food, language — dive in 🎭",     body: "5 minutes keeps you connected to it all." },
    { title: "Immerse yourself in Croatian today!",    body: "Language is the key to culture. Keep going!" },
  ],
  fluent: [
    { title: "🗣️ Fluency is built one day at a time",  body: "You're on the path — don't stop now!" },
    { title: "You're on the path",                     body: "Don't stop now — every day counts!" },
    { title: "5 minutes today = fluency tomorrow",     body: "One small session keeps the momentum alive." },
  ],
};

const DEFAULT_MESSAGES = [
  { title: "🔥 Don't break your streak!",   body: "Come practice and protect your streak." },
  { title: "🇭🇷 Croatian practice time!",   body: "Just 5 minutes keeps your skills sharp." },
  { title: "⚡ Keep it going!",              body: "Your Croatian skills are waiting for you." },
];

function getGoalMessages(streakDays) {
  const goal = localStorage.getItem('nh_goal') || '';
  const pool = GOAL_MESSAGES[goal] || DEFAULT_MESSAGES;
  return pool[streakDays % pool.length];
}

// Schedule a local notification using smart timing and goal-aware messaging.
// Checks nh_last_practice_time (hour as string) to schedule 30 min before that hour.
// Falls back to 7pm. If that time is already past today, schedules for tomorrow.
export function scheduleLocalReminder(streakDays = 0) {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const lastPractice = localStorage.getItem('nh_last_practice_date');
  const today = new Date().toISOString().slice(0, 10);
  if (lastPractice === today) return;

  const now = new Date();
  const target = new Date();

  // Smart timing: use last practice hour if valid (6–22), schedule 30 min before
  const lastHourRaw = localStorage.getItem('nh_last_practice_time');
  const lastHour = lastHourRaw !== null ? parseInt(lastHourRaw, 10) : NaN;

  if (!isNaN(lastHour) && lastHour >= 6 && lastHour <= 22) {
    const reminderHour = lastHour;
    const reminderMinute = 30; // 30 min before the hour they usually practice
    // Actually: schedule reminder 30 minutes BEFORE lastHour
    const adjustedHour = lastHour === 0 ? 0 : lastHour;
    // Set to (lastHour - 1) hours and 30 minutes as "30 min before lastHour"
    const beforeHour = adjustedHour > 0 ? adjustedHour - 1 : 0;
    const beforeMin  = adjustedHour > 0 ? 30 : 0;
    target.setHours(beforeHour, beforeMin, 0, 0);
    // If that time is already past today, schedule for tomorrow at the same time
    if (now >= target) target.setDate(target.getDate() + 1);
  } else {
    // Default: 7pm
    target.setHours(19, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
  }

  const msg = getGoalMessages(streakDays);

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

// Goal-specific call-to-action suffix for re-engagement messages
function getGoalCTA() {
  const goal = localStorage.getItem('nh_goal') || '';
  const ctas = {
    heritage: ' Honor your roots — 5 minutes today! 🇭🇷',
    family:   ' Do it for the people you love 💙',
    travel:   " Your trip's success starts now ✈️",
    culture:  ' Dive back into Croatian culture 🎭',
    fluent:   " Fluency doesn't build itself — let's go! 🗣️",
  };
  return ctas[goal] || ' Open the app and get back on track!';
}

// Schedule a re-engagement notification if the user has been absent.
// - 3+ days absent: immediate notification (5s delay) with miss message
// - 7+ days absent: adds +50 XP bonus copy to the message
// - Fires at most once per 48 hours (tracked via nh_reengagement_sent)
export function scheduleReEngagementReminder() {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  // Rate-limit: only once per 48 hours
  const sentRaw = localStorage.getItem('nh_reengagement_sent');
  if (sentRaw) {
    const sentAt = parseInt(sentRaw, 10);
    if (Date.now() - sentAt < 48 * 60 * 60 * 1000) return;
  }

  const lastSeenRaw = localStorage.getItem('nh_last_seen');
  if (!lastSeenRaw) return;

  const lastSeen = parseInt(lastSeenRaw, 10);
  const diffMs   = Date.now() - lastSeen;
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (diffMs < threeDays) return;

  let body = "We miss you! 💙 Your Croatian is waiting — just 5 minutes to get back on track.";
  body += getGoalCTA();

  if (diffMs >= sevenDays) {
    body += " +50 XP bonus when you return today!";
  }

  localStorage.setItem('nh_reengagement_sent', String(Date.now()));

  setTimeout(() => {
    if (isNotificationsEnabled() && Notification.permission === 'granted') {
      new Notification("We miss you! 💙", {
        body,
        icon:     '/icons/icon-192x192.png',
        tag:      'nh-reengagement',
        renotify: true,
      });
    }
  }, 5000);
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
