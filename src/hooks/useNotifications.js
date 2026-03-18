// Push notification permission + local streak reminders
// Uses the Notifications API — no push server required.
// A daily reminder fires when the user opens the app and hasn't practiced today.

import { useEffect } from 'react';

const LAST_PRACTICE_KEY = 'nh_last_practice';
const REMINDER_DISMISSED_KEY = 'nh_reminder_dismissed_today';

export function markPracticed() {
  localStorage.setItem(LAST_PRACTICE_KEY, Date.now().toString());
}

export function useNotifications() {
  useEffect(() => {
    if (!('Notification' in window)) return;

    const todayStr = new Date().toDateString();
    const dismissedOn = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (dismissedOn === todayStr) return; // already shown/dismissed today

    const lastPractice = parseInt(localStorage.getItem(LAST_PRACTICE_KEY) || '0', 10);
    const hoursSince = (Date.now() - lastPractice) / 3600000;

    // Only prompt if user has practiced before (has a history) and it's been > 20 hours
    if (lastPractice === 0 || hoursSince < 20) return;

    if (Notification.permission === 'granted') {
      showReminder();
      localStorage.setItem(REMINDER_DISMISSED_KEY, todayStr);
    } else if (Notification.permission === 'default') {
      // Delay the permission prompt slightly so it doesn't fire on first load
      const t = setTimeout(async () => {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          showReminder();
          localStorage.setItem(REMINDER_DISMISSED_KEY, todayStr);
        }
      }, 8000);
      return () => clearTimeout(t);
    }
  }, []);
}

function showReminder() {
  const messages = [
    { body: "You're on a streak — don't break it! 🔥 A quick review keeps your Croatian sharp.", title: 'Naša Hrvatska' },
    { body: 'Just 5 minutes of Croatian today? Your vocabulary is waiting. 🇭🇷', title: 'Vježbaj danas!' },
    { body: 'Your review queue has words waiting. Come back and keep learning! 📚', title: 'Naša Hrvatska' },
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder', // replaces any previous reminder notification
    });
  } catch (_) {}
}
