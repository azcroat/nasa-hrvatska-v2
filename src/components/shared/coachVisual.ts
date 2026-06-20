// Maps a coaching "mood" (dispatched via knight:speak / knight:flash) to the
// visual treatment of the Kovač coaching companion. The portrait is static, so
// state is shown by RING colour + a corner GLYPH, not a facial expression.
export type CoachClass = 'positive' | 'negative' | 'thinking' | 'idle';

export interface CoachVisual {
  ring: string; // CSS linear-gradient
  glyph: string | null; // corner status glyph, or null when idle
  klass: CoachClass;
}

const GOLD = new Set(['celebrating', 'victory', 'levelup', 'onfire', 'tearsofjoy']);
const POSITIVE = new Set(['encouraged', 'proud', 'happy', 'winking']);
const NEGATIVE = new Set(['oops', 'sad', 'struggling', 'worried', 'droop']);

const RING = {
  teal: 'linear-gradient(135deg,#0e7490,#164e63)',
  green: 'linear-gradient(135deg,#16a34a,#15803d)',
  gold: 'linear-gradient(135deg,#FFE070,#C8980A)',
  red: 'linear-gradient(135deg,#dc2626,#991b1b)',
  purple: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
};

export function coachVisual(mood: string): CoachVisual {
  if (GOLD.has(mood)) return { ring: RING.gold, glyph: '★', klass: 'positive' };
  if (POSITIVE.has(mood)) return { ring: RING.green, glyph: '✓', klass: 'positive' };
  if (NEGATIVE.has(mood)) return { ring: RING.red, glyph: '✗', klass: 'negative' };
  if (mood === 'thinking') return { ring: RING.purple, glyph: '💭', klass: 'thinking' };
  return { ring: RING.teal, glyph: null, klass: 'idle' };
}
