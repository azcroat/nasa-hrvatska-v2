// Hero pure helpers — daily scene, knight greeting, mascot message, CEFR label.
// Extracted from HeroSection as part of the 1c decomposition (pure functions,
// no React). _pick stays internal.

import type { Stats } from '../../types';
import { HERO_SCENES, CONTEXTUAL_POOL } from './heroData';

export interface HeroScene {
  img: string;
  label: string;
  position: string;
}
export interface KnightGreeting {
  mood: string;
  text: string;
  sub?: string | null;
}

function _pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getDailyScene(): HeroScene {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return HERO_SCENES[dayOfYear % HERO_SCENES.length]!;
}

export function getKnightGreeting(
  st: Stats,
  streakCount: number,
  level: number,
  practicedToday = false,
): KnightGreeting {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const xp = st?.xp || 0;
  const lc = st?.lc || 0;
  const gc = st?.gc || 0;
  const streakBroken = lc > 0 && streakCount === 0;

  if (lc === 0)
    return _pick([
      {
        mood: 'ready',
        text: "Živjeli! I'm Vitez Hrvoje, your Croatian knight. Croatia has 1,200 years of history and one of Europe's most precise languages. Let's start writing yours.",
      },
      {
        mood: 'happy',
        text: "Dobro došli! Whether you have Croatian roots or just fell in love with this corner of Europe — you're in the right place. First lesson awaits.",
      },
      {
        mood: 'encouraged',
        text: "Seven cases, tricky verbs, verb aspects — Croatian sounds hard. Here's the secret: it's perfectly phonetic. One letter, one sound, always. Let's go!",
      },
    ]);
  if (streakBroken)
    return _pick([
      {
        mood: 'encouraged',
        text: 'Nema veze. Every serious learner has gaps. The difference is: they showed back up. Your Croatian is still in there.',
      },
      {
        mood: 'encouraged',
        text: 'Janica Kostelić broke her leg twice and still won four Olympic golds. Your streak broke. Come back and earn it again.',
      },
    ]);
  // Only nag about streak expiry if the user hasn't already practiced today
  if (hour >= 21 && streakCount > 0 && !practicedToday)
    return _pick([
      {
        mood: 'encouraged',
        text: `Pazi! Your streak expires at midnight. One lesson — even five minutes — keeps the fire alive. Don't let it die tonight.`,
      },
      {
        mood: 'ready',
        text: `One lesson before bed. That's all it takes. ${streakCount} days — too valuable to lose tonight.`,
      },
    ]);
  if (streakCount >= 100)
    return {
      mood: 'victory',
      text: `${streakCount} days. You're not learning Croatian anymore — you ARE Croatian. Svaka čast, majstore.`,
    };
  if (streakCount >= 50)
    return {
      mood: 'celebrating',
      text: `${streakCount}-day streak! Fifty days of showing up. The Adriatic has been waiting for someone with your dedication.`,
    };
  if (streakCount >= 30)
    return {
      mood: 'celebrating',
      text: `Trideset dana — 30 days straight! Most people quit long before now. Croatia noticed.`,
    };
  if (streakCount >= 14)
    return {
      mood: 'happy',
      text: `Dva tjedna! Two weeks of Croatian. You've learned more than most diaspora kids will ever try.`,
    };
  if (streakCount >= 7)
    return {
      mood: 'happy',
      text: `${streakCount}-day streak — a full week. Your brain is forming real Croatian pathways now. Sjajno!`,
    };
  if (streakCount >= 3)
    return {
      mood: 'happy',
      text: `${streakCount} days straight. Consistency beats intensity — you're proving it every day. Hajde!`,
    };
  if (xp >= 5000)
    return {
      mood: 'victory',
      text: `${xp.toLocaleString()} XP! You've crossed into territory where Croatian conversations start happening by accident.`,
    };
  if (xp >= 1000)
    return {
      mood: 'happy',
      text: `${xp.toLocaleString()} XP. At this pace, a Croatian grandmother would understand you. That's a high bar.`,
    };
  if (xp >= 100)
    return {
      mood: 'encouraged',
      text: `Over 100 XP already. The momentum is real — now keep it going.`,
    };
  if (gc >= 5)
    return {
      mood: 'thinking',
      text: `Five grammar sessions in. You've faced Croatian cases and survived. That earns respect, učenik.`,
    };
  if (lc >= 10)
    return {
      mood: 'happy',
      text: `${lc} lessons in. You've crossed from complete beginner to actual learner. That's the hardest crossing.`,
    };
  if (hour < 9)
    return _pick([
      {
        mood: 'ready',
        text: 'Dobro jutro! Morning practice before the world wakes — this is how fluency is built. Your brain retains more now than any other time.',
      },
      {
        mood: 'encouraged',
        text: 'Jutarnja kava i lekcija — morning coffee and a lesson. The Croatian way to start a day right.',
      },
    ]);
  if (hour >= 23)
    return {
      mood: 'thinking',
      text: "Still at it past midnight. Most people are asleep. Most people also don't speak Croatian.",
    };
  if (day === 0)
    return {
      mood: 'happy',
      text: 'Nedjelja — Sunday. No better day to learn something that lasts a lifetime.',
    };
  if (day === 6)
    return {
      mood: 'celebrating',
      text: 'Subota — Saturday! Weekend warriors are the unsung heroes of language learning. Hajde!',
    };
  if (day === 1)
    return {
      mood: 'encouraged',
      text: 'Ponedjeljak — Monday. Fresh week, clean slate. The learners who study on Mondays are the ones who end up fluent.',
    };
  return CONTEXTUAL_POOL[(new Date().getDate() + day) % CONTEXTUAL_POOL.length]!;
}

export function getMascotMessage({
  streak,
  level,
  lc,
  comebackBonus,
  allQuestsDone,
  practicedToday,
}: {
  streak: number;
  level: number;
  lc?: number;
  comebackBonus?: boolean;
  allQuestsDone?: boolean;
  practicedToday?: boolean;
}): KnightGreeting {
  const h = new Date().getHours();
  const _lc = lc ?? 0;

  if (_lc === 0)
    return {
      mood: 'ready',
      text: 'Dobrodošli! Ready to start your Croatian journey?',
      sub: 'Your first lesson awaits 🇭🇷',
    };
  if (comebackBonus)
    return {
      mood: 'celebrating',
      text: 'Welcome back! +50 bonus XP on your first lesson!',
      sub: 'Your Croatian is still here waiting for you 💪',
    };
  if (allQuestsDone)
    return {
      mood: 'victory',
      text: 'Sve misije završene! All quests done today!',
      sub: "You're a Croatian champion today 🏆",
    };
  // Streak at risk: late evening + active streak + not yet practiced today
  if (h >= 21 && streak > 0 && !practicedToday)
    return {
      mood: 'sad',
      text: `Pazi! Your ${streak}-day streak expires at midnight.`,
      sub: 'One lesson — even 5 minutes — saves it 🕯️',
    };
  if (streak >= 100)
    return {
      mood: 'celebrating',
      text: `${streak}-day streak! Legendarno! 🔥`,
      sub: 'You are an inspiration.',
    };
  if (streak >= 30)
    return {
      mood: 'celebrating',
      text: `${streak} dana zaredom — unstoppable! 🔥`,
      sub: 'True dedication to the language 🇭🇷',
    };
  if (streak >= 14)
    return {
      mood: 'celebrating',
      text: `${streak}-day streak — keep the fire burning! 🔥`,
      sub: 'Sjajno ide!',
    };
  if (streak >= 7)
    return {
      mood: 'happy',
      text: `${streak} days in a row — the habit is forming! 💪`,
      sub: 'Bravo, hajde dalje!',
    };
  if (streak >= 3)
    return {
      mood: 'encouraged',
      text: `${streak}-day streak — don't break the chain! 🔥`,
      sub: 'Svaki dan si bolji!',
    };
  if (level >= 10)
    return {
      mood: 'celebrating',
      text: `Level ${level} — advanced learner! 🎓`,
      sub: 'Napredak je vidljiv!',
    };
  if (level >= 5)
    return {
      mood: 'happy',
      text: `Level ${level} — halfway to fluency! 🌟`,
      sub: "Keep pushing, you've got this!",
    };
  if (level >= 3)
    return {
      mood: 'encouraged',
      text: `Level ${level} — real momentum building!`,
      sub: 'Odlično!',
    };
  if (h < 9)
    return {
      mood: 'ready',
      text: 'Dobro jutro! Morning sessions build the fastest fluency.',
      sub: 'Hajde! ☀️',
    };
  if (h < 12)
    return {
      mood: 'happy',
      text: 'Morning practice is the best practice!',
      sub: 'Ready for today? 🇭🇷',
    };
  if (h >= 20)
    return {
      mood: 'thinking',
      text: 'Evening session — great way to end the day!',
      sub: 'Even 5 minutes counts 💪',
    };
  const msgs = [
    { mood: 'happy', text: 'Every word you learn brings Croatia closer!', sub: 'Hajde! 🇭🇷' },
    {
      mood: 'thinking',
      text: "Croatian has 7 cases — let's master them together!",
      sub: 'Your ancestors spoke this language',
    },
    { mood: 'happy', text: 'Your ancestors spoke this language. Carry it forward! 💙', sub: null },
    {
      mood: 'celebrating',
      text: 'Language is the soul of culture!',
      sub: 'Naša Hrvatska čeka! 🌟',
    },
    { mood: 'marching', text: "Ima li tko voli učiti? Ja volim! Let's go! 🎉", sub: null },
    {
      mood: 'thinking',
      text: "Small steps every day — you're building something beautiful 🏛️",
      sub: null,
    },
    { mood: 'happy', text: 'Naša Hrvatska čeka! Croatia is waiting for you! 🇭🇷', sub: null },
  ];
  return msgs[new Date().getDay() % msgs.length]!;
}

// CEFR derived from the same formula as StatsTab so both screens always agree.

export function getCEFR(xp: number, lc: number, gc: number) {
  const total = (xp || 0) + (lc || 0) * 15 + (gc || 0) * 25;
  const BANDS = [
    { current: 'A1', next: 'A2', threshold: 300 },
    { current: 'A2', next: 'B1', threshold: 1200 },
    { current: 'B1', next: 'B2', threshold: 3500 },
    { current: 'B2', next: 'C1', threshold: 8000 },
    { current: 'C1', next: 'C2', threshold: 18000 },
  ];
  for (let i = 0; i < BANDS.length; i++) {
    const band = BANDS[i]!;
    if (total < band.threshold) {
      const prev = i === 0 ? 0 : BANDS[i - 1]!.threshold;
      return {
        current: band.current,
        next: band.next,
        pctInLevel: Math.min(Math.round(((total - prev) / (band.threshold - prev)) * 100), 99),
      };
    }
  }
  return {
    current: 'C1',
    next: 'C2',
    pctInLevel: Math.min(Math.round(((total - 8000) / 10000) * 100), 100),
  };
}
