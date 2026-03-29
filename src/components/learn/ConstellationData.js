// ── GrammarConstellation — shared data & helpers ──────────────

export const CASES = [
  {
    id: 'nominativ', name: 'Nominativ', abbr: 'NOM', color: '#0e7490',
    question: 'WHO? WHAT? (subject)',
    shortDesc: 'The subject of the sentence — who does the action',
    pattern: 'Base form: žena, muž, dijete',
    examples: [
      { hr: 'Žena čita.', en: 'The woman reads.' },
      { hr: 'Muž spava.', en: 'The husband sleeps.' },
    ],
    tip: 'This is the dictionary form. No change needed.',
    endings: { m: '-', f: '-a', n: '-o/-e' },
  },
  {
    id: 'genitiv', name: 'Genitiv', abbr: 'GEN', color: '#7c3aed',
    question: 'OF WHO? OF WHAT? (possession, quantity)',
    shortDesc: 'Possession, negation, quantity — "of" in English',
    pattern: 'M/N: +-a, F: -e',
    examples: [
      { hr: 'Kuća prijatelja.', en: "The friend's house." },
      { hr: 'Čaša vode.', en: 'A glass of water.' },
    ],
    tip: 'After nema (there is no), bez (without), od (from/of)',
    endings: { m: '-a', f: '-e', n: '-a' },
  },
  {
    id: 'dativ', name: 'Dativ', abbr: 'DAT', color: '#b45309',
    question: 'TO WHO? FOR WHO? (recipient)',
    shortDesc: 'The recipient of an action — giving, sending, saying TO someone',
    pattern: 'M/N: +-u, F: -i',
    examples: [
      { hr: 'Dajem prijatelju.', en: 'I give to the friend.' },
      { hr: 'Kažem majci.', en: 'I say to (my) mother.' },
    ],
    tip: 'After k/ka (towards), nasuprot (opposite), zahvaljujući (thanks to)',
    endings: { m: '-u', f: '-i', n: '-u' },
  },
  {
    id: 'akuzativ', name: 'Akuzativ', abbr: 'ACC', color: '#dc2626',
    question: 'WHO? WHAT? (direct object)',
    shortDesc: 'The direct object — what the action is done TO',
    pattern: 'M animate: -a, F: -u, N: same as NOM',
    examples: [
      { hr: 'Vidim muža.', en: 'I see the husband.' },
      { hr: 'Čitam knjigu.', en: 'I read a book.' },
    ],
    tip: 'Most common case after verbs. Also after: u, na, kroz, za (movement)',
    endings: { m: '-a (anim)', f: '-u', n: '= NOM' },
  },
  {
    id: 'vokativ', name: 'Vokativ', abbr: 'VOC', color: '#16a34a',
    question: 'ADDRESSING someone directly',
    shortDesc: 'Calling someone by name or title — direct address',
    pattern: 'M: -e/-u, F: -o/-e',
    examples: [
      { hr: 'Marko! Dođi!', en: 'Marko! Come here!' },
      { hr: 'Mama, jesi li tu?', en: 'Mum, are you there?' },
    ],
    tip: 'Used when calling out to someone. Often same as nominative in speech.',
    endings: { m: '-e/-u', f: '-o/-e', n: '= NOM' },
  },
  {
    id: 'lokativ', name: 'Lokativ', abbr: 'LOC', color: '#0284c7',
    question: 'WHERE? ABOUT WHAT? (location, topic)',
    shortDesc: 'Location and topic — always used WITH a preposition',
    pattern: 'M/N: +-u, F: -i',
    examples: [
      { hr: 'U gradu.', en: 'In the city.' },
      { hr: 'Govorim o prijatelju.', en: 'I speak about the friend.' },
    ],
    tip: 'ALWAYS with: u (in), na (on/at), o (about), po (around), pri (by)',
    endings: { m: '-u', f: '-i', n: '-u' },
  },
  {
    id: 'instrumental', name: 'Instrumental', abbr: 'INS', color: '#78716c',
    question: 'WITH WHAT? BY WHAT MEANS?',
    shortDesc: 'The instrument or companion — doing something WITH something',
    pattern: 'M/N: +-om/-em, F: +-om/-om',
    examples: [
      { hr: 'Pišem olovkom.', en: 'I write with a pencil.' },
      { hr: 'Idem s prijateljem.', en: 'I go with a friend.' },
    ],
    tip: 'After s/sa (with), pred (in front of), između (between), nad (above)',
    endings: { m: '-om', f: '-om', n: '-om' },
  },
];

export const QUIZ = [
  { q: 'Tko spava? (Who sleeps?) — Which case?', answer: 'nominativ', options: ['nominativ', 'akuzativ', 'dativ', 'genitiv'] },
  { q: 'Čaša ___. (A glass of water) — Which case is "water" in?', answer: 'genitiv', options: ['genitiv', 'lokativ', 'instrumental', 'akuzativ'] },
  { q: 'Dajem ___. (I give to my friend) — Which case?', answer: 'dativ', options: ['dativ', 'nominativ', 'akuzativ', 'vokativ'] },
  { q: 'Vidim ___. (I see him) — Which case?', answer: 'akuzativ', options: ['akuzativ', 'nominativ', 'genitiv', 'instrumental'] },
  { q: 'Zdravo, ___! (Hello, [friend name]!) — Which case?', answer: 'vokativ', options: ['vokativ', 'nominativ', 'dativ', 'lokativ'] },
  { q: 'U ___. (In the city) — Which case?', answer: 'lokativ', options: ['lokativ', 'akuzativ', 'dativ', 'instrumental'] },
  { q: 'Pišem ___. (I write with a pencil) — Which case?', answer: 'instrumental', options: ['instrumental', 'lokativ', 'genitiv', 'nominativ'] },
];

export function getDoneMessage(score) {
  if (score === 7) return 'Perfect! You know all 7 cases!';
  if (score >= 5) return 'Great work! Almost there!';
  if (score >= 3) return 'Good start — keep practising!';
  return 'Keep exploring the cases and try again!';
}
