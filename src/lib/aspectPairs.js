// aspectPairs.js — Croatian verb aspect pairs
// Format: { imperfective: { pair: perfective, rule: string }, ... }
// Rule: use imperfective for ongoing/repeated actions, perfective for completed single events

export const ASPECT_PAIRS = {
  // Core verbs every learner needs
  'pisati': { pair: 'napisati', rule: 'ongoing writing vs. finished writing something' },
  'čitati': { pair: 'pročitati', rule: 'reading (activity) vs. reading (finishing something)' },
  'jesti': { pair: 'pojesti', rule: 'eating (activity) vs. eating up/finishing' },
  'piti': { pair: 'popiti', rule: 'drinking (activity) vs. drinking up/finishing' },
  'učiti': { pair: 'naučiti', rule: 'studying (process) vs. having learned/mastered' },
  'gledati': { pair: 'pogledati', rule: 'watching (ongoing) vs. taking a look (once)' },
  'slušati': { pair: 'poslušati', rule: 'listening (ongoing) vs. listen to (one time)' },
  'govoriti': { pair: 'reći', rule: 'speaking/talking (in general) vs. to say (one thing)' },
  'raditi': { pair: 'uraditi', rule: 'working/doing (activity) vs. to do/complete something' },
  'kupovati': { pair: 'kupiti', rule: 'shopping/buying (habit) vs. to buy (one purchase)' },
  'dolaziti': { pair: 'doći', rule: 'coming (repeatedly/in progress) vs. to arrive (once)' },
  'odlaziti': { pair: 'otići', rule: 'leaving (repeatedly) vs. to leave (once, completed)' },
  'uzimati': { pair: 'uzeti', rule: 'taking (habit/ongoing) vs. to take (one time)' },
  'davati': { pair: 'dati', rule: 'giving (habit/ongoing) vs. to give (one time)' },
  'pitati': { pair: 'upitati', rule: 'asking (repeatedly) vs. to ask (once)' },
  'plaćati': { pair: 'platiti', rule: 'paying (activity) vs. to pay (one payment)' },
  'otvarati': { pair: 'otvoriti', rule: 'opening (repeatedly) vs. to open (once)' },
  'zatvarati': { pair: 'zatvoriti', rule: 'closing (repeatedly) vs. to close (once)' },
  'čekati': { pair: 'pričekati', rule: 'waiting (ongoing) vs. to wait briefly (once)' },
  'tražiti': { pair: 'naći', rule: 'looking for (ongoing process) vs. to find (result)' },
  'spavati': { pair: 'zaspati', rule: 'sleeping (state/ongoing) vs. to fall asleep (moment)' },
  'vidjeti': { pair: 'ugledati', rule: 'seeing (ongoing/general) vs. to catch sight of (once)' },
  'slati': { pair: 'poslati', rule: 'sending (repeatedly) vs. to send (one item)' },
  'zvati': { pair: 'nazvati', rule: 'calling (in general) vs. to call (one call)' },
  'sjesti': { pair: 'sjediti', rule: 'sitting (state) vs. to sit down (action)' },
  'stati': { pair: 'stajati', rule: 'to stop/stand (momentary) vs. standing (state)' },
  'početi': { pair: 'počinjati', rule: 'to begin (once) vs. beginning (repeatedly)' },
  'završiti': { pair: 'završavati', rule: 'to finish (once) vs. finishing (repeatedly)' },
  'htjeti': { pair: null, rule: 'no aspect pair — modal verb' },
  'moći': { pair: null, rule: 'no aspect pair — modal verb' },
  'trebati': { pair: null, rule: 'no aspect pair — modal verb' },
  // Travel & daily life
  'putovati': { pair: 'otputovati', rule: 'traveling (ongoing journey) vs. to set off/complete journey' },
  'rezervirati': { pair: 'rezervirati', rule: 'same form both aspects (loanword pattern)' },
  'javljati se': { pair: 'javiti se', rule: 'checking in (habit) vs. to check in (once)' },
  // Emotions & states
  'voljeti': { pair: null, rule: 'state verb — no perfective pair' },
  'znati': { pair: null, rule: 'state verb — no perfective pair' },
  'misliti': { pair: 'pomisliti', rule: 'thinking (ongoing) vs. to think/realize (one thought)' },
  'pamtiti': { pair: 'zapamtiti', rule: 'remembering (ongoing) vs. to memorize/remember (once)' },
  'zaboravljati': { pair: 'zaboraviti', rule: 'forgetting (habit) vs. to forget (one instance)' },
};

// Get aspect info for a Croatian word (checks if it's a known verb)
export function getAspectInfo(hrWord) {
  if (!hrWord) return null;
  const lower = hrWord.toLowerCase();
  if (ASPECT_PAIRS[lower]) return { imperfective: lower, ...ASPECT_PAIRS[lower] };
  // Check if this word IS a perfective pair
  for (const [imp, data] of Object.entries(ASPECT_PAIRS)) {
    if (data.pair && data.pair.toLowerCase() === lower) {
      return { imperfective: imp, pair: lower, rule: data.rule, isPerfective: true };
    }
  }
  return null;
}
