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
  localStorage.setItem('nh_last_practice_time', new Date().getHours().toString());
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

// Optional userId param: pass the Firebase UID so server-push subscriptions are
// stored under the right KV key. Falls back to anonymous registration if omitted.
export function useNotifications({ userId = '' } = {}) {
  useEffect(() => {
    if (!('Notification' in window)) return undefined;

    const todayStr = new Date().toDateString();
    const dismissedOn = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (dismissedOn === todayStr) return undefined; // already shown/dismissed today

    const lastPractice = parseInt(localStorage.getItem(LAST_PRACTICE_KEY) || '0', 10);
    const hoursSince = (Date.now() - lastPractice) / 3600000;

    // Only prompt if user has practiced before (has a history) and it's been > 6 hours
    if (lastPractice === 0 || hoursSince < 6) return undefined;

    if (Notification.permission === 'granted') {
      showReminder();
      localStorage.setItem(REMINDER_DISMISSED_KEY, todayStr);
      // Register for server-sent Web Push (85-day guard prevents redundant calls)
      import('../lib/pushNotifications.js').then(({ subscribeToPush, registerPushWithServer }) => {
        // subscribeToPush handles permission + PushManager subscription + server registration
        // in one call. Fall back to the legacy registerPushWithServer if something fails.
        subscribeToPush(userId).catch(() => registerPushWithServer().catch(() => {}));
      });
      return undefined;
    } else if (Notification.permission === 'default') {
      // Delay the permission prompt slightly so it doesn't fire on first load
      const t = setTimeout(async () => {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          showReminder();
          localStorage.setItem(REMINDER_DISMISSED_KEY, todayStr);
          // Register with server now that permission is granted
          import('../lib/pushNotifications.js').then(({ subscribeToPush, registerPushWithServer }) => {
            subscribeToPush(userId).catch(() => registerPushWithServer().catch(() => {}));
          });
        }
      }, 8000);
      return () => clearTimeout(t);
    }
    return undefined;
   
  }, [userId]);
}

// Stores the setTimeout ID for the 8 PM streak reminder so it can be cleared
// when the user completes a lesson.
let _streakReminderTimer = null;

export function scheduleStreakReminder(streakDays) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // Clear any previously scheduled reminder
  if (_streakReminderTimer !== null) { clearTimeout(_streakReminderTimer); _streakReminderTimer = null; }
  // Read user's preferred reminder time (default 8pm). Format: "HH:MM"
  let reminderHour = 20;
  try {
    const pref = localStorage.getItem('nh_reminder_time') || '20:00';
    reminderHour = parseInt(pref.split(':')[0], 10);
    if (!Number.isFinite(reminderHour) || reminderHour < 0 || reminderHour > 23) reminderHour = 20;
  } catch (_) { reminderHour = 20; }
  const now = new Date();
  const target = new Date(now);
  target.setHours(reminderHour, 0, 0, 0);
  const delay = target.getTime() - now.getTime();
  if (delay <= 0) return; // already past reminder time today — skip
  _streakReminderTimer = setTimeout(() => {
    _streakReminderTimer = null;
    // Check if user has practiced today before firing
    const lastPractice = parseInt(localStorage.getItem(LAST_PRACTICE_KEY) || '0', 10);
    const hoursSince = (Date.now() - lastPractice) / 3600000;
    if (lastPractice > 0 && hoursSince < 20) return; // already practiced today

    // Pull user name for personalization
    let firstName = '';
    try {
      const profile = JSON.parse(localStorage.getItem('nh_profile') || '{}');
      firstName = (profile.name || profile.displayName || '').split(' ')[0].trim();
    } catch (_) {}
    const nameTag = firstName ? `, ${firstName}` : '';
    const days = streakDays || 1;

    const titleVariants = [
      `🔥 ${firstName ? firstName + ', your' : 'Your'} streak is at risk!`,
      `⏰ ${firstName || 'Hey'} — study time!`,
      `🇭🇷 Croatian is waiting${nameTag}`,
      `📅 Don't forget your Croatian today${nameTag}`,
      `🔥 ${days} days strong — keep it up${nameTag}!`,
    ];
    const bodyVariants = [
      `Complete a lesson to keep your ${days}-day streak alive.`,
      `Maja is waiting. Just 5 minutes and your streak is safe 🔥`,
      `Your ${days}-day streak ends tonight — one quick review saves it.`,
      `Don't let ${days} days of hard work slip away. 5 minutes, right now.`,
      `Quick session? ~5 minutes. Streak stays alive 🔥`,
    ];
    try {
      new Notification(pickVariant(titleVariants, 'nh_8pm_title_idx'), {
        body:   pickVariant(bodyVariants, 'nh_8pm_body_idx'),
        icon:   '/icons/icon-192x192.png',
        badge:  '/icons/badge-72.png',
        tag:    'streak-reminder',
        renotify: true,
        data:   { url: '/', action: 'open_lesson' },
      });
    } catch (_) {}
  }, delay);
}

// ── Rotation helper — cycles through an array without immediate repeats ──────
// Stores the last-used index in localStorage under `storageKey`.
function pickVariant(arr, storageKey) {
  if (arr.length === 1) return arr[0];
  let last = -1;
  try { last = parseInt(localStorage.getItem(storageKey) || '-1', 10); } catch (_) {}
  let next = Math.floor(rnd() * arr.length);
  // If we land on the same one, shift forward one slot
  if (next === last) next = (next + 1) % arr.length;
  try { localStorage.setItem(storageKey, String(next)); } catch (_) {}
  return arr[next];
}

// ── Build a personalized notification from the user's actual learning state ──
function buildPersonalizedMessage() {
  try {
    // Pull user name
    let userName = '';
    try {
      const profile = JSON.parse(localStorage.getItem('nh_profile') || '{}');
      userName = (profile.name || profile.displayName || '').split(' ')[0].trim();
    } catch (_) {}
    const nameTag = userName ? `, ${userName}` : '';
    const namePrefix = userName ? `${userName}, ` : '';

    // Pull SRS vocab — find words the user recently learned
    const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
    const srWords = Object.entries(sr);
    const recentWord = srWords
      .filter(([, v]) => v && v.r > 0)
      .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0))[0];

    // Pull streak
    const streakData = JSON.parse(localStorage.getItem('nh_streak') || '{}');
    const streakCount = streakData.count || streakData.days || 0;

    // Pull SRS due count
    const dueCount = srWords.filter(([, v]) => {
      if (!v || !v.due) return false;
      return new Date(v.due) <= new Date();
    }).length;

    // Pull lesson count for context
    const progressKeys = Object.keys(localStorage).filter(k => k.startsWith('uP_'));
    let lessonsCompleted = 0;
    if (progressKeys.length) {
      try {
        const p = JSON.parse(localStorage.getItem(progressKeys[0]) || '{}');
        lessonsCompleted = (p.stats || p.st || {}).lc || 0;
      } catch (_) {}
    }

    // ── Messages when SRS words are due ──────────────────────────────────────
    if (dueCount > 0) {
      const streakAtRisk = streakCount >= 3;
      const titleVariants = streakAtRisk
        ? [
            `🔥 ${namePrefix}your ${streakCount}-day streak is at risk!`,
            `⏰ ${namePrefix}review time!`,
            `🇭🇷 Croatian is waiting${nameTag}`,
            `📅 Don't forget your Croatian today${nameTag}`,
            `🔥 ${streakCount} days strong — keep it up${nameTag}!`,
          ]
        : [
            `📚 Review time${nameTag}!`,
            `🇭🇷 ${namePrefix}words are due!`,
            `⏰ ${namePrefix}don't let words fade`,
            `Naša Hrvatska — review time${nameTag}`,
            `🧠 ${namePrefix}your memory needs a refresh`,
          ];
      const bodyVariants = [
        `You have ${dueCount} word${dueCount > 1 ? 's' : ''} to review. 5 minutes keeps your streak alive.`,
        `Maja is waiting to practice with you. ${dueCount} word${dueCount > 1 ? 's' : ''} due today.`,
        `Your ${streakCount > 0 ? `${streakCount}-day` : ''} streak ends tonight without a quick review.`.trim(),
        `${dueCount} Croatian word${dueCount > 1 ? 's are' : ' is'} fading from memory — review now to lock ${dueCount > 1 ? 'them' : 'it'} in.`,
        `Quick quiz? ${dueCount} word${dueCount > 1 ? 's' : ''}, ~5 minutes. Streak stays alive 🔥`,
      ];
      return {
        title: pickVariant(titleVariants, 'nh_notif_title_idx'),
        body:  pickVariant(bodyVariants,  'nh_notif_body_idx'),
      };
    }

    // ── Messages for a specific recently-studied word ────────────────────────
    if (recentWord) {
      const [word] = recentWord;
      const wordVariants = [
        { title: `🇭🇷 Vježbaj danas${nameTag}!`,       body: `Remember "${word}"? Use it in a sentence today to lock it in. ✨` },
        { title: `Naša Hrvatska${nameTag}`,              body: `"${word}" — can you use it today? One sentence keeps it sharp.` },
        { title: `📚 Time to reinforce${nameTag}`,       body: `You learned "${word}" recently. Review now before it fades!` },
      ];
      return pickVariant(wordVariants, 'nh_notif_word_idx');
    }

    // ── Streak-aware messages (no words due) ─────────────────────────────────
    if (streakCount >= 3) {
      const streakVariants = [
        { title: `🔥 ${streakCount}-day streak${nameTag}!`,    body: `Keep the momentum going — just 5 minutes of Croatian today.` },
        { title: `⭐ ${namePrefix}${streakCount} days strong!`, body: `Even 5 minutes of Croatian today keeps your brain sharp.` },
        { title: `🇭🇷 ${streakCount} days and counting${nameTag}`, body: `Dobar dan! Time for today's Croatian lesson.` },
        { title: `🔥 Keep it going${nameTag}!`,                body: `Your Croatian skills are growing — ${streakCount} days running!` },
        { title: `Naša Hrvatska${nameTag}`,                    body: `Your Croatian skills are waiting. New words added this week.` },
      ];
      return pickVariant(streakVariants, 'nh_notif_streak_idx');
    }

    // ── Progress-based messages ───────────────────────────────────────────────
    if (lessonsCompleted > 0) {
      return {
        title: `Naša Hrvatska${nameTag}`,
        body:  `${lessonsCompleted} lessons in — you're making real progress. Practice today? 🇭🇷`,
      };
    }
  } catch (_) {}

  // ── Fallback generic messages (10 variants, rotated) ────────────────────────
  const fallbacks = [
    { title: 'Naša Hrvatska',       body: "Your Croatian is waiting. 5 minutes keeps the momentum alive. 🇭🇷" },
    { title: 'Vježbaj danas!',       body: "A little Croatian every day adds up fast. Continue your journey! ✨" },
    { title: 'Naša Hrvatska',        body: "Your review queue has words waiting. Come back and keep learning! 📚" },
    { title: '🇭🇷 Croatian time!',  body: "Dobar dan! Time for today's Croatian lesson." },
    { title: '📚 Keep learning!',    body: "Even 5 minutes of Croatian today keeps your brain sharp." },
    { title: 'Naša Hrvatska',        body: "Your Croatian skills are waiting. New words added this week." },
    { title: '⚡ Just 5 minutes!',   body: "Quick quiz? ~5 minutes. Your future self will thank you." },
    { title: 'Vježbaj danas! 🇭🇷',  body: "Language builds one day at a time — today's your day." },
    { title: 'Naša Hrvatska',        body: "Open the app and see how much you remember. You might surprise yourself!" },
    { title: '🧠 Memory check!',     body: "Croatian words fade without practice — a quick review locks them in." },
  ];
  return pickVariant(fallbacks, 'nh_notif_fallback_idx');
}

function showReminder() {
  const msg = buildPersonalizedMessage();
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder', // replaces any previous reminder notification
    });
  } catch (_) {}
}
