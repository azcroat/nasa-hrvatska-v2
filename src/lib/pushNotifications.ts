// pushNotifications.ts — Web Push Notifications

import { localDateStr } from './dateUtils';

// ── Notification timer tracking ───────────────────────────────────────────────
const _notifTimers = new Set<ReturnType<typeof setTimeout>>();

export function cancelAllNotificationTimers(): void {
  for (const id of _notifTimers) clearTimeout(id);
  _notifTimers.clear();
}

function _scheduleTimeout(fn: () => void, delayMs: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    _notifTimers.delete(id);
    fn();
  }, delayMs);
  _notifTimers.add(id);
  return id;
}

const NOTIF_KEY = 'nh_notifications_enabled';
const SUB_KEY = 'nh_push_subscription';

export const VAPID_PUBLIC_KEY =
  'BAFN-xEz0NYzDK8Pn9cdKTuTFYNd_cpQQxM_nKRVwz65tzBB--dPawvo59OPkoUlh8GuvIjd1phITqLmJFpnirc';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(val: boolean): void {
  try {
    localStorage.setItem(NOTIF_KEY, String(val));
  } catch {}
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function initPushNotifications(): Promise<{ subscription: PushSubscription | null }> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { subscription: null };
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    try {
      localStorage.setItem(SUB_KEY, JSON.stringify(subscription.toJSON()));
    } catch {}

    if ('periodicSync' in registration) {
      try {
        // @ts-expect-error — Periodic Background Sync API not yet in TS DOM lib
        await registration.periodicSync.register('nh-daily-reminder', {
          minInterval: 24 * 60 * 60 * 1000,
        });
      } catch (_) {}
    }

    scheduleReEngagementReminder();

    return { subscription };
  } catch (e: unknown) {
    console.warn('Push notifications not available:', (e as Error).message);
    return { subscription: null };
  }
}

export function getPushSubscription(): unknown {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface GoalMessage {
  title: string;
  body: string;
}

const GOAL_MESSAGES: Record<string, GoalMessage[]> = {
  heritage: [
    { title: '🇭🇷 Your heritage is calling!', body: 'Take 5 minutes to honor your roots today.' },
    {
      title: 'Tvoji preci bi bili ponosni',
      body: 'Practice today — your ancestors would be proud!',
    },
    { title: 'Connect with your roots', body: '5 minutes of Croatian keeps your heritage alive.' },
  ],
  family: [
    { title: '👨‍👩‍👧 Your family is waiting!', body: 'Practice so they can hear you speak Croatian!' },
    {
      title: 'Practice for the people you love 💙',
      body: '5 minutes today brings you closer to them.',
    },
    { title: 'Impress them next time', body: "Keep going — they'll love hearing your Croatian!" },
  ],
  travel: [
    {
      title: '✈️ Croatia is closer than you think!',
      body: 'Practice today for an unforgettable trip!',
    },
    {
      title: 'Your trip will be unforgettable 🌊',
      body: 'Better Croatian = a better Croatia experience.',
    },
    { title: 'Order coffee like a local', body: 'Just 5 minutes! Jedna kava, molim. ☕' },
  ],
  culture: [
    {
      title: '🎵 Croatian culture awaits!',
      body: 'Practice today and dive deeper into the culture.',
    },
    {
      title: 'Music, food, language — dive in 🎭',
      body: '5 minutes keeps you connected to it all.',
    },
    {
      title: 'Immerse yourself in Croatian today!',
      body: 'Language is the key to culture. Keep going!',
    },
  ],
  fluent: [
    {
      title: '🗣️ Fluency is built one day at a time',
      body: "You're on the path — don't stop now!",
    },
    { title: "You're on the path", body: "Don't stop now — every day counts!" },
    {
      title: '5 minutes today = fluency tomorrow',
      body: 'One small session keeps the momentum alive.',
    },
  ],
};

const DEFAULT_MESSAGES: GoalMessage[] = [
  { title: "🔥 Don't break your streak!", body: 'Come practice and protect your streak.' },
  { title: '🇭🇷 Croatian practice time!', body: 'Just 5 minutes keeps your skills sharp.' },
  { title: '⚡ Keep it going!', body: 'Your Croatian skills are waiting for you.' },
];

function getGoalMessages(streakDays: number): GoalMessage {
  try {
    const goal = localStorage.getItem('nh_goal') || '';
    const pool = GOAL_MESSAGES[goal] || DEFAULT_MESSAGES;
    return pool[streakDays % pool.length]!;
  } catch {
    return DEFAULT_MESSAGES[0]!;
  }
}

export function scheduleLocalReminder(streakDays = 0): void {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  let lastPractice: string | null = null;
  try {
    lastPractice = localStorage.getItem('nh_last_practice_date');
  } catch {}
  const today = localDateStr();
  if (lastPractice === today) return;

  const now = new Date();
  const target = new Date();

  let lastHourRaw: string | null = null;
  try {
    lastHourRaw = localStorage.getItem('nh_last_practice_time');
  } catch {}
  const lastHour = lastHourRaw !== null ? parseInt(lastHourRaw, 10) : NaN;

  if (!isNaN(lastHour) && lastHour >= 6 && lastHour <= 22) {
    const beforeHour = lastHour > 0 ? lastHour - 1 : 0;
    const beforeMin = lastHour > 0 ? 30 : 0;
    target.setHours(beforeHour, beforeMin, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
  } else {
    target.setHours(19, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
  }

  const msg = getGoalMessages(streakDays);

  _scheduleTimeout(() => {
    if (isNotificationsEnabled() && Notification.permission === 'granted') {
      new Notification(msg.title, {
        body: msg.body,
        icon: '/icons/icon-192x192.png',
        tag: 'nh-daily-reminder',
        // @ts-expect-error — renotify is valid but missing from TS DOM lib
        renotify: true,
      });
    }
  }, target.getTime() - now.getTime());
}

function getGoalCTA(): string {
  let goal = '';
  try {
    goal = localStorage.getItem('nh_goal') || '';
  } catch {}
  const ctas: Record<string, string> = {
    heritage: ' Honor your roots — 5 minutes today! 🇭🇷',
    family: ' Do it for the people you love 💙',
    travel: " Your trip's success starts now ✈️",
    culture: ' Dive back into Croatian culture 🎭',
    fluent: " Fluency doesn't build itself — let's go! 🗣️",
  };
  return ctas[goal] || ' Open the app and get back on track!';
}

export function scheduleReEngagementReminder(): void {
  if (!isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  let sentRaw: string | null = null;
  try {
    sentRaw = localStorage.getItem('nh_reengagement_sent');
  } catch {}
  if (sentRaw) {
    const sentAt = parseInt(sentRaw, 10);
    if (Date.now() - sentAt < 48 * 60 * 60 * 1000) return;
  }

  let lastSeenRaw: string | null = null;
  try {
    lastSeenRaw = localStorage.getItem('nh_last_seen');
  } catch {}
  if (!lastSeenRaw) return;

  const lastSeen = parseInt(lastSeenRaw, 10);
  const diffMs = Date.now() - lastSeen;
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  if (diffMs < threeDays) return;

  let title = 'We miss you! 💙';
  let body = 'Your Croatian is waiting — just 5 minutes to get back on track.';
  body += getGoalCTA();

  if (diffMs >= fourteenDays) {
    title = 'Your progress is safe 🇭🇷';
    body =
      "It's been 2 weeks, but your Croatian is preserved and ready. " +
      'Come back today — complete 2 lessons and restore your streak! +100 XP waiting.';
    body += getGoalCTA();
  } else if (diffMs >= sevenDays) {
    body += ' +50 XP bonus when you return today!';
  }

  try {
    localStorage.setItem('nh_reengagement_sent', String(Date.now()));
  } catch {}

  _scheduleTimeout(() => {
    if (isNotificationsEnabled() && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        tag: 'nh-reengagement',
        // @ts-expect-error — renotify is valid but missing from TS DOM lib
        renotify: true,
      });
    }
  }, 5000);
}

const _REG_TS_KEY = 'nh_push_reg_ts';

export async function subscribeToPush(userId = ''): Promise<{ ok: boolean; reason?: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return { ok: false, reason: permission };

  const { subscription } = await initPushNotifications();
  if (!subscription) return { ok: false, reason: 'subscription_failed' };

  try {
    const { apiFetch } = await import('./apiFetch');
    const res = await apiFetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        userId: String(userId || '').slice(0, 64),
      }),
    });
    if (res.ok) {
      try {
        localStorage.setItem(_REG_TS_KEY, String(Date.now()));
      } catch {}
      return { ok: true };
    }
    return { ok: false, reason: `server_${res.status}` };
  } catch (e: unknown) {
    console.warn('[Push] subscribeToPush failed:', (e as Error).message);
    return { ok: false, reason: (e as Error).message };
  }
}

export async function sendTestPush(userId = ''): Promise<unknown> {
  if (!userId) {
    console.warn('[Push] sendTestPush: userId required');
    return { ok: false };
  }
  try {
    const { apiFetch } = await import('./apiFetch');
    const res = await apiFetch('/api/push-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: '🇭🇷 Test push — Naša Hrvatska',
        body: 'If you see this, Web Push is working! Bravo! 🎉',
        url: '/',
      }),
    });
    const data = await res.json().catch(() => ({}));
    console.warn('[Push] sendTestPush result:', data);
    return data;
  } catch (e: unknown) {
    console.warn('[Push] sendTestPush error:', (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}

export async function registerPushWithServer({ streak = 0, name = '' } = {}): Promise<{
  ok: boolean;
  cached?: boolean;
}> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false };
  if (Notification.permission !== 'granted') return { ok: false };

  try {
    const ts = parseInt(localStorage.getItem(_REG_TS_KEY) || '0', 10);
    if (ts && Date.now() - ts < 85 * 24 * 60 * 60 * 1000) return { ok: true, cached: true };
  } catch {}

  const { subscription } = await initPushNotifications();
  if (!subscription) return { ok: false };

  try {
    const { apiFetch } = await import('./apiFetch');
    const res = await apiFetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        streak: Math.max(0, Math.floor(Number(streak) || 0)),
        name: String(name || '').slice(0, 50),
      }),
    });
    if (res.ok) {
      try {
        localStorage.setItem(_REG_TS_KEY, String(Date.now()));
      } catch {}
      return { ok: true };
    }
    return { ok: false };
  } catch (e: unknown) {
    console.warn('[Push] Server registration failed:', (e as Error).message);
    return { ok: false };
  }
}
