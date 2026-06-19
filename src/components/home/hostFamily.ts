import { ALL_CHARACTERS, type CharacterName } from '../family/portraits';

/**
 * Host-of-the-day: deterministic pick from the cast by day index.
 * Wraps and tolerates negative indices.
 */
export function hostOfDay(dayIdx: number): CharacterName {
  const n = ALL_CHARACTERS.length;
  return ALL_CHARACTERS[((dayIdx % n) + n) % n]!;
}

/** Display name shown in the welcome. */
export const HOST_NAME: Record<CharacterName, string> = {
  baka: 'Baka Marija',
  ana: 'Ana',
  kovac: 'prof. Kovač',
  marko: 'Marko',
  ivo: 'Ivo',
};

/**
 * Per-host welcome: a warm in-character Croatian line + English echo, and the
 * Adriatic scene used for the hero (filename under public/images/scenes/).
 */
export const HOST_WELCOME: Record<CharacterName, { hr: string; en: string; scene: string }> = {
  baka: {
    hr: 'Sjedni, dijete — skuhala sam kavu.',
    en: 'Sit, child — I’ve made coffee.',
    scene: 'dubrovnik-ai.webp',
  },
  ana: {
    hr: 'Bok! Tvoja kava te čeka.',
    en: 'Hi! Your coffee’s waiting.',
    scene: 'mostar.webp',
  },
  kovac: {
    hr: 'Spremni za današnju lekciju?',
    en: 'Ready for today’s lesson?',
    scene: 'plitvice.webp',
  },
  marko: {
    hr: 'More je mirno — idemo učiti.',
    en: 'The sea’s calm — let’s learn.',
    scene: 'dalmatian-coast.webp',
  },
  ivo: {
    hr: 'Uskači, vozimo se kroz hrvatski!',
    en: 'Hop in — let’s cruise through Croatian!',
    scene: 'zagreb.webp',
  },
};
