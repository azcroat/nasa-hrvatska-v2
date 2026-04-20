/**
 * pitchAccentContent.js — rich pitch accent lesson data for PitchAccentMastery.
 *
 * 6 lessons: intro, short_falling, short_rising, long_falling, long_rising, practice.
 * Each lesson has: theory (paragraph), keyPoints[], examples[], minimalPairs[], drill[].
 * Linguistically reviewed against Barić et al. Hrvatska gramatika (2003).
 */

export const PITCH_ACCENT_LESSONS = [
  {
    id: 'intro',
    title: 'What Is Pitch Accent?',
    subtitle: 'Why Croatian sounds like music',
    icon: '🎵',
    color: '#7c3aed',
    theory: `English uses stress — one syllable in a word gets louder and more prominent than the others. Croatian does something more: not only does one syllable carry the accent, but the pitch of your voice — whether it rises or falls — is part of the word itself. Change the pitch pattern and you change the meaning. This makes Croatian a pitch-accent language, in the same family as Japanese, Swedish, and Ancient Greek.

Croatian has exactly four pitch accents, distinguished by two features: vowel length (short or long) and pitch direction (falling or rising). A short-falling accent sounds quick and heavy, dropping in pitch. A short-rising accent is quick but lighter, with an upward movement. A long-falling accent sustains the drop over a longer vowel. A long-rising accent sustains the rise, giving Croatian much of its famously melodic quality.

The good news: you do not need perfect pitch accent production to be understood in Croatia. Native speakers vary considerably by region, and most are forgiving. What matters most is that you develop an ear for it — so that when two words sound nearly identical, you can catch the difference. Think of it as tuning into the music of the language rather than mastering a performance skill.`,
    keyPoints: [
      'Croatian is a pitch-accent language: the direction of pitch (rise or fall) is part of word meaning',
      'There are 4 accents: short-falling, short-rising, long-falling, and long-rising',
      'Vowel length (short vs long) is a separate, equally important contrast — long vowels last roughly twice as long',
      'In standard Neo-Štokavian, the accent almost always falls on the first syllable — with one crucial exception: the short-falling accent cannot appear on the first syllable of a polysyllabic word',
      'Passive recognition matters more than perfect production: hear the difference before worrying about making it',
    ],
    examples: [
      {
        hr: 'grâd',
        en: 'city',
        audio: 'grad',
        note: 'Long-falling on the only syllable — city. Pitch drops on a long vowel.',
      },
      {
        hr: 'grȁd',
        en: 'hail (weather)',
        audio: 'grad',
        note: 'Short-falling — same spelling, entirely different word. Short, dropping pitch.',
      },
      {
        hr: 'lûk',
        en: 'onion',
        audio: 'luk',
        note: 'Long-falling — the vowel is held then falls.',
      },
      {
        hr: 'lúk',
        en: 'arc / bow',
        audio: 'luk',
        note: 'Long-rising — same consonants, different pitch pattern, different meaning.',
      },
      { hr: 'pȁs', en: 'dog', audio: 'pas', note: 'Short-falling on this single syllable.' },
      {
        hr: 'pás',
        en: 'belt / sash',
        audio: 'pas',
        note: 'Short-rising — lighter upward movement. Two completely different meanings.',
      },
      {
        hr: 'mȋr',
        en: 'peace',
        audio: 'mir',
        note: 'Long-falling — sustained, weighty, falling on the long vowel.',
      },
      {
        hr: 'míra',
        en: 'measure (genitive)',
        audio: 'mira',
        note: 'Short-rising on the first syllable — a completely different word form.',
      },
    ],
  },
  {
    id: 'short_falling',
    title: 'Short-Falling Accent (`)',
    subtitle: 'The heavy, quick drop',
    icon: '⬇️',
    color: '#dc2626',
    theory: `The short-falling accent (kratkosilazni naglasak in Croatian) is the most immediately noticeable of the four accents. Your pitch drops sharply and quickly on a short vowel — think of it as a quick, heavy thud. It is often described as the most "weighted" or "dark" of the four accents, and many learners find it the easiest to imitate precisely because the drop is so distinct.

The defining rule in standard Neo-Štokavian: the short-falling accent cannot stand on the first syllable of a word that has more than one syllable. If you find a short-falling accent in a dictionary on a polysyllabic word, it will be on the second syllable or later. This is a historical development — older stages of Croatian had this accent freely on initial syllables, and it remains there in many regional dialects. But in the standard language taught in schools and heard on national media, it has retreated.

In everyday speech you will hear the short-falling accent constantly — it appears in verb forms, noun cases, and common everyday words. The notation used in dictionaries and linguistic texts is a grave-like mark over the vowel: ȁ, ȅ, ȉ, ȍ, ȕ.`,
    keyPoints: [
      'Short vowel + falling pitch = kratkosilazni (short-falling)',
      'Cannot occur on the first syllable in standard Croatian when the word has two or more syllables',
      'The most "heavy" or "dark" sounding of the four accents',
      'Marked with a double grave diacritic in linguistic notation: ȁ ȅ ȉ ȍ ȕ',
      'Very common in verb forms and oblique cases of nouns',
    ],
    examples: [
      {
        hr: 'žèna',
        en: 'woman (genitive plural)',
        audio: 'žena',
        note: 'Short-falling on second syllable — the standard position for polysyllabic words.',
      },
      {
        hr: 'vòda',
        en: 'water (genitive plural)',
        audio: 'voda',
        note: 'Short-falling shifts to second syllable in this case form.',
      },
      {
        hr: 'prȍzor',
        en: 'window',
        audio: 'prozor',
        note: 'Short-falling on the second syllable — dictionary form.',
      },
      { hr: 'kȍrak', en: 'step, pace', audio: 'korak', note: 'Short-falling on second syllable.' },
      {
        hr: 'pȁs',
        en: 'dog',
        audio: 'pas',
        note: 'Monosyllabic — short-falling is permitted here on the single syllable.',
      },
      {
        hr: 'grȁd',
        en: 'hail (weather)',
        audio: 'grad',
        note: 'Monosyllabic short-falling. Contrast with grâd (city) — long-falling.',
      },
      {
        hr: 'nȍć',
        en: 'night',
        audio: 'noć',
        note: 'Monosyllabic, short-falling on the single syllable.',
      },
      {
        hr: 'sȅlo',
        en: 'village (genitive plural)',
        audio: 'selo',
        note: 'Short-falling in oblique case — compare sélo (nominative, short-rising).',
      },
    ],
    minimalPairs: [
      {
        word1: { hr: 'grȁd', en: 'hail (weather)', accent: '`' },
        word2: { hr: 'grâd', en: 'city', accent: '¯' },
        note: 'Same consonants, different accent: short-falling vs long-falling. The vowel length difference is audible — grȁd is short and clipped, grâd holds the vowel before falling.',
      },
      {
        word1: { hr: 'pȁs', en: 'dog', accent: '`' },
        word2: { hr: 'pás', en: 'belt, sash', accent: '´' },
        note: 'Short-falling vs short-rising on the same monosyllable. The drop versus the lift is the only difference.',
      },
      {
        word1: { hr: 'sȅlo', en: 'village (genitive plural)', accent: '`' },
        word2: { hr: 'sélo', en: 'village (nominative)', accent: '´' },
        note: 'The same noun in different cases has different accents — short-falling in gen. pl., short-rising in nominative. Croatian accent is grammatically active.',
      },
      {
        word1: { hr: 'vòda', en: 'water (genitive plural)', accent: '`' },
        word2: { hr: 'vóda', en: 'water (nominative)', accent: '´' },
        note: 'Another case-driven accent alternation. Short-falling in oblique, short-rising in the base form.',
      },
    ],
    drill: [
      { q: 'Which Croatian word means "dog"?', opts: ['pȁs', 'pás', 'pâs', 'pàs'], correct: 'pȁs' },
      {
        q: 'Which word carries a short-falling accent?',
        opts: ['sélo', 'sȅlo', 'sêlo', 'séla'],
        correct: 'sȅlo',
      },
      {
        q: 'In standard Croatian, where can a short-falling accent NOT appear?',
        opts: [
          'On the first syllable of a multi-syllable word',
          'On the last syllable',
          'On a long vowel',
          'On monosyllables',
        ],
        correct: 'On the first syllable of a multi-syllable word',
      },
      {
        q: 'Which word means "hail" (weather)?',
        opts: ['grâd', 'grȁd', 'grád', 'grád'],
        correct: 'grȁd',
      },
    ],
  },
  {
    id: 'short_rising',
    title: 'Short-Rising Accent (´)',
    subtitle: 'The quick, bright lift',
    icon: '⬆️',
    color: '#16a34a',
    theory: `The short-rising accent (kratkouzlazni naglasak) is the most frequently encountered accent in everyday standard Croatian. Your pitch rises quickly on a short vowel — it sounds lighter, brighter, and more energetic than the short-falling. Many linguists describe it as the most "neutral" or "default" sounding of the four accents to a Croatian ear.

Unlike the short-falling, the short-rising can stand on the first syllable of any word — and in the standard language, it most commonly does exactly that. The vast majority of Croatian nouns, verbs, and adjectives you learn will have their accent at the beginning of the word, often a short-rising. This makes it the foundational accent for learners to internalize first.

In the standard IPA-based linguistic notation, the short-rising is marked with an acute accent over the vowel: á, é, í, ó, ú. The short-rising accent is the one that most resembles what English speakers think of as "normal" word stress — which makes it simultaneously the easiest and the trickiest, because learners may hear it without registering that pitch is also moving upward.`,
    keyPoints: [
      'Short vowel + rising pitch = kratkouzlazni (short-rising)',
      'The most common accent in standard Croatian speech',
      'Can appear on any syllable, including the first — unlike short-falling',
      'Sounds brighter and lighter than short-falling',
      'Marked with an acute diacritic: á é í ó ú',
    ],
    examples: [
      {
        hr: 'sélo',
        en: 'village',
        audio: 'selo',
        note: 'Short-rising on the first syllable — the standard nominative form.',
      },
      {
        hr: 'vóda',
        en: 'water',
        audio: 'voda',
        note: 'Short-rising on vó- in the nominative. Compare vòda (genitive plural, short-falling).',
      },
      {
        hr: 'žéna',
        en: 'woman',
        audio: 'žena',
        note: 'Short-rising on žé- in the nominative singular.',
      },
      {
        hr: 'lípa',
        en: 'linden tree',
        audio: 'lipa',
        note: 'Short-rising on lí- — a key word in Croatian culture.',
      },
      {
        hr: 'ríba',
        en: 'fish',
        audio: 'riba',
        note: 'Short-rising on rí-. Common everyday vocabulary.',
      },
      {
        hr: 'kúća',
        en: 'house',
        audio: 'kuća',
        note: 'Short-rising on kú- in the standard nominative form.',
      },
      {
        hr: 'pás',
        en: 'belt, sash',
        audio: 'pas',
        note: 'Short-rising monosyllable — contrasts with pȁs (dog, short-falling).',
      },
      {
        hr: 'gláva',
        en: 'head',
        audio: 'glava',
        note: 'Short-rising on glá- — very common body-part vocabulary.',
      },
    ],
    minimalPairs: [
      {
        word1: { hr: 'pás', en: 'belt, sash', accent: '´' },
        word2: { hr: 'pȁs', en: 'dog', accent: '`' },
        note: 'Short-rising (bright lift) vs short-falling (heavy drop) on the same monosyllable. The pitch direction is everything.',
      },
      {
        word1: { hr: 'sélo', en: 'village (nominative)', accent: '´' },
        word2: { hr: 'sȅlo', en: 'village (genitive plural)', accent: '`' },
        note: 'The same word in different grammatical cases — short-rising nominative vs short-falling genitive plural. Accent marks grammar here.',
      },
      {
        word1: { hr: 'góra', en: 'mountain, upland', accent: '´' },
        word2: { hr: 'gȍra', en: 'worse (archaic/dialectal)', accent: '`' },
        note: 'Short-rising on góra (mountain) vs short-falling on gȍra. The same sound sequence, entirely different meanings.',
      },
      {
        word1: { hr: 'lípa', en: 'linden tree', accent: '´' },
        word2: { hr: 'lîpa', en: 'linden tree (dialectal variant)', accent: 'ˆ' },
        note: 'Short-rising vs long-rising — the length difference is audible even before the pitch direction.',
      },
    ],
    drill: [
      {
        q: 'Which word means "water" in nominative (standard) form?',
        opts: ['vòda', 'vóda', 'vôda', 'vȍda'],
        correct: 'vóda',
      },
      {
        q: 'The short-rising accent is marked with which diacritic?',
        opts: ['Grave (`)', 'Acute (´)', 'Circumflex (ˆ)', 'Macron (¯)'],
        correct: 'Acute (´)',
      },
      {
        q: 'Which word means "house" (nominative singular)?',
        opts: ['kȕća', 'kúća', 'kûća', 'kùća'],
        correct: 'kúća',
      },
      {
        q: 'Which statement about the short-rising accent is TRUE?',
        opts: [
          'It cannot appear on the first syllable',
          'It is the most common accent in standard Croatian',
          'It only occurs on long vowels',
          'It always appears on the last syllable',
        ],
        correct: 'It is the most common accent in standard Croatian',
      },
    ],
  },
  {
    id: 'long_falling',
    title: 'Long-Falling Accent (¯)',
    subtitle: 'The sustained drop',
    icon: '📉',
    color: '#d97706',
    theory: `The long-falling accent (dugosilazni naglasak) combines length with gravity. The vowel is held for roughly twice as long as a short vowel, and the pitch falls across that extended duration. The result sounds weighty, definitive, even solemn — like a pronouncement. Linguists sometimes describe it as the most "authoritative" of the four accents.

In the standard Neo-Štokavian system, the long-falling accent is restricted to the first syllable of a word, just as long-rising is. This means in any word longer than one syllable, if you hear a long falling pitch, it is on the opening syllable. In monosyllabic words, the accent can only be long-falling or long-rising (the "short" accents also appear in monosyllables, but long accents are particularly common there).

You will encounter the long-falling accent in many extremely common Croatian words — numbers, body parts, kinship terms, and place names. The notation in linguistic and dictionary texts uses a circumflex-like mark: â, ê, î, ô, û.`,
    keyPoints: [
      'Long vowel + falling pitch = dugosilazni (long-falling)',
      'Sounds weighty, definitive, and sustained — the vowel is held then drops',
      'In standard Croatian, occurs only on the first syllable of multi-syllable words',
      'Very common in monosyllabic everyday vocabulary — numbers, body parts, kinship terms',
      'Vowel length alone (even without the pitch direction) is audible to native speakers',
    ],
    examples: [
      {
        hr: 'grâd',
        en: 'city',
        audio: 'grad',
        note: 'Long-falling on the single syllable — hold the vowel, then drop.',
      },
      {
        hr: 'mîr',
        en: 'peace',
        audio: 'mir',
        note: 'Long-falling, monosyllabic. A foundational cultural word.',
      },
      {
        hr: 'lûk',
        en: 'onion',
        audio: 'luk',
        note: 'Long-falling — contrast with lúk (arc/bow, long-rising).',
      },
      {
        hr: 'brât',
        en: 'brother',
        audio: 'brat',
        note: 'Long-falling on the single syllable. Kinship term.',
      },
      { hr: 'nôs', en: 'nose', audio: 'nos', note: 'Long-falling, body-part vocabulary.' },
      { hr: 'dȃn', en: 'day', audio: 'dan', note: 'Long-falling — extremely high frequency word.' },
      {
        hr: 'pȇt',
        en: 'five',
        audio: 'pet',
        note: 'Long-falling in the number — Croatian numerals are great for practicing long accents.',
      },
      {
        hr: 'kȃd',
        en: 'when (conjunction)',
        audio: 'kad',
        note: 'Long-falling on this common function word.',
      },
    ],
    minimalPairs: [
      {
        word1: { hr: 'grâd', en: 'city', accent: '¯' },
        word2: { hr: 'grȁd', en: 'hail (weather)', accent: '`' },
        note: 'Long-falling vs short-falling. The vowel in grâd is noticeably longer — hold it, then let the pitch drop. In grȁd, it is quick and abrupt.',
      },
      {
        word1: { hr: 'lûk', en: 'onion', accent: '¯' },
        word2: { hr: 'lúk', en: 'arc, bow', accent: '´' },
        note: 'Long-falling (onion) vs short-rising (arc). Two differences at once: length and direction. Lûk holds longer and drops; lúk is shorter and rises.',
      },
      {
        word1: { hr: 'mîr', en: 'peace', accent: '¯' },
        word2: { hr: 'míra', en: 'measure (feminine noun)', accent: '´' },
        note: 'Long-falling monosyllable (peace) vs a different word with short-rising. Very different sounds despite surface similarity.',
      },
      {
        word1: { hr: 'brât', en: 'brother', accent: '¯' },
        word2: { hr: 'bràt', en: 'brother (regional short form)', accent: '`' },
        note: 'Long-falling (standard) vs short-falling (regional). The length contrast is primary — standard Croatian uses the long form.',
      },
    ],
    drill: [
      { q: 'Which word means "city"?', opts: ['grȁd', 'grâd', 'grád', 'gràd'], correct: 'grâd' },
      {
        q: 'The long-falling accent in multi-syllable words appears on which syllable in standard Croatian?',
        opts: ['First syllable only', 'Last syllable only', 'Any syllable', 'Second syllable only'],
        correct: 'First syllable only',
      },
      { q: 'Which word means "peace"?', opts: ['mír', 'mîr', 'mȉr', 'mìr'], correct: 'mîr' },
      {
        q: 'What two features define the long-falling accent?',
        opts: [
          'Short vowel + rising pitch',
          'Long vowel + falling pitch',
          'Long vowel + rising pitch',
          'Short vowel + falling pitch',
        ],
        correct: 'Long vowel + falling pitch',
      },
    ],
  },
  {
    id: 'long_rising',
    title: 'Long-Rising Accent (ˆ)',
    subtitle: 'The sustained lift',
    icon: '📈',
    color: '#0e7490',
    theory: `The long-rising accent (dugouzlazni naglasak) is often described as the most musical of the four. The vowel is held for an extended duration while the pitch rises — producing a sustained, melodic quality that gives standard Croatian much of its reputation for sounding lyrical and expressive. To English-speaking ears it can sometimes sound slightly questioning or tentative, though in Croatian it carries no such connotation — it is simply one of four normal accent patterns.

Like the long-falling, the long-rising accent appears on the first syllable in standard Croatian (when the word has more than one syllable). The difference between the two long accents is entirely in pitch direction: long-falling drops, long-rising rises. Because both accents involve a long vowel, learners first need to master hearing vowel length, and then tune into the direction of pitch movement on that extended vowel.

The long-rising accent is particularly characteristic of the standard broadcasting language — the formal register you will hear on HRT news and official speeches. It is also strongly associated with the Slavonian speech community and gives Zagreb broadcast standard much of its melodic quality.`,
    keyPoints: [
      'Long vowel + rising pitch = dugouzlazni (long-rising)',
      'The most melodic and musical of the four accents',
      'Appears on the first syllable in standard Croatian multi-syllable words',
      'Sounds lyrical — rises over the duration of the long vowel',
      'Particularly prominent in formal broadcast Croatian (HRT news register)',
    ],
    examples: [
      {
        hr: 'lúk',
        en: 'arc, bow',
        audio: 'luk',
        note: 'Long-rising — rise over the long vowel. Contrast with lûk (onion, long-falling).',
      },
      {
        hr: 'rúka',
        en: 'hand, arm',
        audio: 'ruka',
        note: 'Long-rising on rú-. A very common body-part word.',
      },
      {
        hr: 'nóga',
        en: 'leg, foot',
        audio: 'noga',
        note: 'Long-rising on nó-. Another body-part with this accent.',
      },
      {
        hr: 'zélen',
        en: 'green',
        audio: 'zelen',
        note: 'Long-rising on zé- — common color adjective.',
      },
      {
        hr: 'líjepa',
        en: 'beautiful (feminine)',
        audio: 'lijepa',
        note: 'Long-rising on lí-. From "Lijepa naša domovino" — the national anthem.',
      },
      {
        hr: 'Zádar',
        en: 'Zadar (city)',
        audio: 'Zadar',
        note: 'Long-rising on Zá-. Croatian place names are a practical way to learn accent patterns.',
      },
      {
        hr: 'júnak',
        en: 'hero, brave man',
        audio: 'junak',
        note: 'Long-rising on jú-. A culturally significant word in Croatian heroic tradition.',
      },
      {
        hr: 'lípa',
        en: 'linden tree (long form)',
        audio: 'lipa',
        note: 'Long-rising variant — compare short-rising lípa. Context and register determine which is used.',
      },
    ],
    minimalPairs: [
      {
        word1: { hr: 'lúk', en: 'arc, bow', accent: 'ˆ' },
        word2: { hr: 'lûk', en: 'onion', accent: '¯' },
        note: 'Long-rising vs long-falling. Both have a long vowel — the only difference is whether pitch rises or falls. Listen carefully to the direction of pitch movement.',
      },
      {
        word1: { hr: 'rúka', en: 'hand, arm', accent: 'ˆ' },
        word2: { hr: 'rȕka', en: 'hand (dialectal/archaic)', accent: '`' },
        note: 'Long-rising (standard nominative) vs short-falling (dialectal form). Length is audible alongside direction.',
      },
      {
        word1: { hr: 'nóga', en: 'leg (nominative)', accent: 'ˆ' },
        word2: { hr: 'nȍga', en: 'leg (genitive plural)', accent: '`' },
        note: 'Case-driven accent alternation: long-rising in nominative, short-falling in genitive plural. The same noun, two very different accents.',
      },
      {
        word1: { hr: 'zélen', en: 'green (standard)', accent: 'ˆ' },
        word2: { hr: 'zèlen', en: 'green (regional variant)', accent: '`' },
        note: 'Long-rising (standard) vs short-falling (regional). The standard language consistently uses the long-rising here.',
      },
    ],
    drill: [
      {
        q: 'Which word means "hand" or "arm"?',
        opts: ['rûka', 'rúka', 'rȕka', 'rùka'],
        correct: 'rúka',
      },
      { q: 'Which word means "arc" or "bow"?', opts: ['lûk', 'lúk', 'lȕk', 'lùk'], correct: 'lúk' },
      {
        q: 'The word "lijepa" (beautiful, feminine) has which accent?',
        opts: ['Short-falling', 'Short-rising', 'Long-rising', 'Long-falling'],
        correct: 'Long-rising',
      },
      {
        q: 'What distinguishes a long-rising from a long-falling accent?',
        opts: [
          'Vowel length',
          'Pitch direction (up vs down)',
          'Which syllable carries the accent',
          'Number of syllables',
        ],
        correct: 'Pitch direction (up vs down)',
      },
    ],
  },
  {
    id: 'practice',
    title: 'Pitch Accent in Real Speech',
    subtitle: 'How native speakers actually use it',
    icon: '🗣️',
    color: '#7c3aed',
    theory: `Here is an honest, encouraging truth about Croatian pitch accent: most native Croatian speakers — including educated, highly articulate ones — do not consciously think about it. If you ask a Croatian friend whether kúća has a short-rising or long-rising accent, they may pause and look uncertain, even though they produce it perfectly. Accent is below conscious awareness for native speakers. This means your goal as a learner is not to be a phonetics professor; it is to build the same kind of intuitive sensitivity they have.

Regional variation is significant. The pitch accent system described in this course — Neo-Štokavian, the basis of the standard language — is what you hear on HRT (Hrvatska radiotelevizija), in formal speeches, and in educated Zagreb speech. But Dalmatian Croatian sounds markedly different, with its own accent patterns heavily influenced by Čakavian history. Zagreb vernacular (kajkavski-influenced) often flattens the pitch contrasts. You will encounter all of these in real life — none of them are "wrong," they are authentic regional Croatian.

For production, focus your energy first on vowel length. The short/long distinction (e.g., pȁs vs pâs, grȁd vs grâd) is more consistently noticed and commented on by native speakers than the pitch direction. Get the length right and you are already most of the way there. Then, gradually, the pitch direction will begin to feel natural through exposure — listening to Croatian music, podcasts, HRT news, and conversation.`,
    keyPoints: [
      'Native speakers do not consciously monitor their pitch accent — it is fully automatic for them',
      'Regional Croatian speech (Dalmatian, Kajkavian, Čakavian) differs significantly from standard Neo-Štokavian accent patterns',
      'Vowel length (short vs long) is more perceptually salient to native ears than pitch direction alone — master length first',
      'Passive recognition matters most: knowing pitch can change meaning prevents comprehension errors',
      'HRT (Croatian Radio-Television) broadcasts use the closest thing to a standard accent — excellent listening material',
    ],
    examples: [
      {
        hr: 'kúća',
        en: 'house',
        audio: 'kuća',
        note: 'Short-rising on kú- — one of the first words learners encounter. Standard form.',
      },
      {
        hr: 'Hvála!',
        en: 'Thank you!',
        audio: 'Hvala',
        note: 'Short-rising on Hvá- — you will say this hundreds of times. Get the rising lilt right.',
      },
      {
        hr: 'dôbar dân',
        en: 'good day / hello',
        audio: 'dobar dan',
        note: 'Long-falling on dô- and dâ- — the classic greeting. Both words carry long-falling accents.',
      },
      {
        hr: 'móžemo',
        en: 'we can',
        audio: 'možemo',
        note: 'Short-rising on mó- — very common modal verb form in everyday conversation.',
      },
      {
        hr: 'líjepo',
        en: 'beautifully, nicely',
        audio: 'lijepo',
        note: 'Long-rising on lí- — used constantly as a positive response ("lijepo, lijepo").',
      },
      {
        hr: 'nȅ znam',
        en: 'I do not know',
        audio: 'ne znam',
        note: 'Short-falling on nȅ- (the negative particle). A phrase you will use and hear constantly.',
      },
    ],
    drill: [
      {
        q: 'Which accent is typically restricted from the first syllable of a multi-syllable word in standard Croatian?',
        opts: ['Short-rising', 'Long-rising', 'Short-falling', 'Long-falling'],
        correct: 'Short-falling',
      },
      {
        q: 'For a beginner, which feature of Croatian accent is MOST important to master first?',
        opts: [
          'Exact pitch direction',
          'Vowel length (short vs long)',
          'Which syllable carries stress',
          'Regional variation',
        ],
        correct: 'Vowel length (short vs long)',
      },
      {
        q: 'The word "hvala" (thank you) has which accent?',
        opts: ['Short-falling', 'Short-rising', 'Long-falling', 'Long-rising'],
        correct: 'Short-rising',
      },
      {
        q: 'Which is the best long-term strategy for mastering Croatian pitch accent?',
        opts: [
          'Memorizing accent marks for every word',
          'Extensive listening to native Croatian speech (HRT, podcasts, music)',
          'Avoiding words until accent is perfected',
          'Speaking only to accent coaches',
        ],
        correct: 'Extensive listening to native Croatian speech (HRT, podcasts, music)',
      },
    ],
  },
];

export const PITCH_ACCENT_QUICK_REFERENCE = {
  accents: [
    {
      symbol: '`',
      name: 'Kratkosilazni',
      nameEn: 'Short-Falling',
      color: '#dc2626',
      desc: 'Short vowel, pitch falls. Cannot be on the first syllable of a polysyllabic word in standard Croatian.',
    },
    {
      symbol: '´',
      name: 'Kratkouzlazni',
      nameEn: 'Short-Rising',
      color: '#16a34a',
      desc: 'Short vowel, pitch rises. Most common accent in standard Croatian. Can appear on any syllable.',
    },
    {
      symbol: '¯',
      name: 'Dugosilazni',
      nameEn: 'Long-Falling',
      color: '#d97706',
      desc: 'Long vowel, pitch falls. Sounds weighty and definitive. Restricted to first syllable in polysyllabic words.',
    },
    {
      symbol: 'ˆ',
      name: 'Dugouzlazni',
      nameEn: 'Long-Rising',
      color: '#0e7490',
      desc: 'Long vowel, pitch rises. Sounds musical and lyrical. Restricted to first syllable in polysyllabic words.',
    },
  ],
  commonWords: [
    { word: 'kúća', meaning: 'house', accent: 'short-rising' },
    { word: 'grâd', meaning: 'city', accent: 'long-falling' },
    { word: 'grȁd', meaning: 'hail (weather)', accent: 'short-falling' },
    { word: 'vóda', meaning: 'water', accent: 'short-rising' },
    { word: 'rúka', meaning: 'hand, arm', accent: 'long-rising' },
    { word: 'nóga', meaning: 'leg, foot', accent: 'long-rising' },
    { word: 'mîr', meaning: 'peace', accent: 'long-falling' },
    { word: 'žéna', meaning: 'woman', accent: 'short-rising' },
    { word: 'dȃn', meaning: 'day', accent: 'long-falling' },
    { word: 'pȁs', meaning: 'dog', accent: 'short-falling' },
    { word: 'pás', meaning: 'belt, sash', accent: 'short-rising' },
    { word: 'lûk', meaning: 'onion', accent: 'long-falling' },
    { word: 'lúk', meaning: 'arc, bow', accent: 'long-rising' },
    { word: 'brât', meaning: 'brother', accent: 'long-falling' },
    { word: 'sélo', meaning: 'village', accent: 'short-rising' },
    { word: 'líjepa', meaning: 'beautiful (feminine)', accent: 'long-rising' },
    { word: 'júnak', meaning: 'hero, brave man', accent: 'long-rising' },
    { word: 'prȍzor', meaning: 'window', accent: 'short-falling' },
    { word: 'gláva', meaning: 'head', accent: 'short-rising' },
    { word: 'nôs', meaning: 'nose', accent: 'long-falling' },
  ],
};
