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

export function progressVoice(
  s: { streak: number; wordsdue: number; xpThisWeek: number },
  fallbackHost: CharacterName,
): ProgressVoice {
  // wordsdue is intentionally NOT surfaced here — the "Reviews Due" stat pill
  // already shows the count, so a second "N phrases waiting for review" line was
  // redundant clutter on the home page (removed 2026-06-21).
  const { streak, xpThisWeek } = s;

  // 1. Streak → Baka (warmth / pride).
  if (streak >= 3) {
    return {
      host: 'baka',
      icon: '🔥',
      hr: `${streak}. jutro zaredom — ponosna sam na tebe!`,
      en: `${streak} mornings in a row — I'm proud of you!`,
    };
  }

  // 2. Strong week → Marko (encouragement).
  if (xpThisWeek >= 150) {
    return {
      host: 'marko',
      icon: '⭐',
      hr: 'Snažan tjedan — samo tako nastavi!',
      en: 'Strong week — keep it up!',
    };
  }

  // 3. Fallback → host-of-day, generic warm nudge.
  return {
    host: fallbackHost,
    icon: '👋',
    hr: 'Drago mi je što si tu. Idemo.',
    en: "Good to have you here. Let's go.",
  };
}
