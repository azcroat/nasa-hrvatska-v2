import type { CharacterName } from '../family/portraits';

/**
 * Host-voiced aggregate progress (relational progress, design 2026-06-20).
 * Maps the user's most salient aggregate signal to a family member's one-line
 * comment — no per-item attribution, aggregate only. The thematically-right host
 * speaks: Kovač for reviews, Baka for a streak, Marko for a strong week,
 * otherwise the host-of-day gives a warm nudge.
 */
export interface ProgressVoice {
  host: CharacterName;
  icon: string;
  hr: string;
  en: string;
}

// Croatian count agreement for "fraza" (phrase): 1 → fraza čeka,
// 2–4 → fraze čekaju, else (0,5+, and the teens 11–14) → fraza čeka (gen. pl.).
function frazaHr(n: number): string {
  const d = n % 10;
  const t = n % 100;
  if (d === 1 && t !== 11) return `${n} fraza čeka ponavljanje.`;
  if (d >= 2 && d <= 4 && !(t >= 12 && t <= 14)) return `${n} fraze čekaju ponavljanje.`;
  return `${n} fraza čeka ponavljanje.`;
}

export function progressVoice(
  s: { streak: number; wordsdue: number; xpThisWeek: number },
  fallbackHost: CharacterName,
): ProgressVoice {
  const { streak, wordsdue, xpThisWeek } = s;

  // 1. Reviews due → Kovač (the tutor's domain).
  if (wordsdue > 0) {
    return {
      host: 'kovac',
      icon: '📚',
      hr: frazaHr(wordsdue),
      en: `${wordsdue} ${wordsdue === 1 ? 'phrase' : 'phrases'} waiting for review.`,
    };
  }

  // 2. Streak → Baka (warmth / pride).
  if (streak >= 3) {
    return {
      host: 'baka',
      icon: '🔥',
      hr: `${streak}. jutro zaredom — ponosna sam na tebe!`,
      en: `${streak} mornings in a row — I'm proud of you!`,
    };
  }

  // 3. Strong week → Marko (encouragement).
  if (xpThisWeek >= 150) {
    return {
      host: 'marko',
      icon: '⭐',
      hr: 'Snažan tjedan — samo tako nastavi!',
      en: 'Strong week — keep it up!',
    };
  }

  // 4. Fallback → host-of-day, generic warm nudge.
  return {
    host: fallbackHost,
    icon: '👋',
    hr: 'Drago mi je što si tu. Idemo.',
    en: "Good to have you here. Let's go.",
  };
}
