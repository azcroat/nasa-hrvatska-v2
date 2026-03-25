// Push notification permission + local streak reminders
// Uses the Notifications API — no push server required.
// A daily reminder fires when the user opens the app and hasn't practiced today.

import { useEffect } from 'react';
import { rnd } from '../lib/random.js';

// Croatian name days (imendan) — month-day → [names]
const NAME_DAYS = {
  '01-01':['Ana','Ivan'],'01-07':['Stjepan'],'01-17':['Anton'],'01-20':['Sebastijan'],
  '02-03':['Blaž'],'02-05':['Agata'],'02-14':['Valentin'],'02-22':['Petar'],
  '03-08':['Ivana'],'03-17':['Patricija'],'03-19':['Josip'],'03-25':['Marija'],
  '04-04':['Isidor'],'04-23':['Juraj'],'04-24':['Fide'],'04-29':['Katarina'],
  '05-03':['Filip','Jakov'],'05-12':['Pankracij'],'05-15':['Sofija'],'05-25':['Grgur'],
  '06-13':['Antun'],'06-24':['Ivan'],'06-29':['Petar','Pavao'],
  '07-04':['Elizabeta'],'07-12':['Ivan'],'07-25':['Jakov'],'07-26':['Ana','Joakim'],
  '08-10':['Lovro'],'08-15':['Marija'],'08-24':['Bartol'],'08-28':['Augustin'],
  '09-08':['Marija'],'09-21':['Matej'],'09-29':['Mihael','Rafael','Gabrijel'],
  '10-04':['Franjo'],'10-15':['Terezija'],'10-28':['Šimun','Juda'],
  '11-01':['Svi sveti'],'11-03':['Hubert'],'11-11':['Martin'],'11-25':['Katarina'],
  '12-06':['Nikola'],'12-13':['Lucija'],'12-25':['Božić — Isus'],'12-26':['Stjepan'],
};

const LAST_PRACTICE_KEY = 'nh_last_practice';
const REMINDER_DISMISSED_KEY = 'nh_reminder_dismissed_today';

export function markPracticed() {
  localStorage.setItem(LAST_PRACTICE_KEY, Date.now().toString());
}

export function checkNameDay(userName) {
  if (!userName || !('Notification' in window) || Notification.permission !== 'granted') return;
  const today = new Date();
  const key = String(today.getMonth() + 1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const names = NAME_DAYS[key] || [];
  const firstName = userName.split(' ')[0];
  if (!names.some(n => n.toLowerCase() === firstName.toLowerCase())) return;
  const dismissed = localStorage.getItem('nh_nameday_dismissed');
  if (dismissed === today.toDateString()) return;
  localStorage.setItem('nh_nameday_dismissed', today.toDateString());
  try {
    new Notification(`Sretan imendan, ${firstName}! 🎉`, {
      body: `Danas je tvoj imendan (${names.join('/')}). Čestitamo! Today is your Croatian name day!`,
      icon: '/icon-192.png', tag: 'name-day',
    });
  } catch (_) {}
}

export function useNotifications() {
  useEffect(() => {
    if (!('Notification' in window)) return undefined;

    const todayStr = new Date().toDateString();
    const dismissedOn = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (dismissedOn === todayStr) return undefined; // already shown/dismissed today

    const lastPractice = parseInt(localStorage.getItem(LAST_PRACTICE_KEY) || '0', 10);
    const hoursSince = (Date.now() - lastPractice) / 3600000;

    // Only prompt if user has practiced before (has a history) and it's been > 20 hours
    if (lastPractice === 0 || hoursSince < 20) return undefined;

    if (Notification.permission === 'granted') {
      showReminder();
      localStorage.setItem(REMINDER_DISMISSED_KEY, todayStr);
      return undefined;
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
    return undefined;
  }, []);
}

// Stores the setTimeout ID for the 8 PM streak reminder so it can be cleared
// when the user completes a lesson.
let _streakReminderTimer = null;

export function scheduleStreakReminder(streakDays) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // Clear any previously scheduled reminder
  if (_streakReminderTimer !== null) { clearTimeout(_streakReminderTimer); _streakReminderTimer = null; }
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0); // 8 PM local time
  let delay = target.getTime() - now.getTime();
  if (delay <= 0) return; // already past 8 PM today — skip
  _streakReminderTimer = setTimeout(() => {
    _streakReminderTimer = null;
    // Check if user has practiced today before firing
    const lastPractice = parseInt(localStorage.getItem(LAST_PRACTICE_KEY) || '0', 10);
    const hoursSince = (Date.now() - lastPractice) / 3600000;
    if (lastPractice > 0 && hoursSince < 20) return; // already practiced today
    try {
      new Notification('🔥 Don\'t lose your ' + (streakDays || 1) + '-day streak!', {
        body: 'Complete a lesson to keep your streak alive.',
        icon: '/icon-192.png',
        tag: 'streak-reminder',
      });
    } catch (_) {}
  }, delay);
}

function showReminder() {
  const messages = [
    { body: "You're on a streak — don't break it! 🔥 A quick review keeps your Croatian sharp.", title: 'Naša Hrvatska' },
    { body: 'Just 5 minutes of Croatian today? Your vocabulary is waiting. 🇭🇷', title: 'Vježbaj danas!' },
    { body: 'Your review queue has words waiting. Come back and keep learning! 📚', title: 'Naša Hrvatska' },
  ];
  const msg = messages[Math.floor(rnd() * messages.length)];
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder', // replaces any previous reminder notification
    });
  } catch (_) {}
}
