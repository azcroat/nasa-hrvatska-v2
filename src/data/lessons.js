// ═══════════════════════════════════════════════════════════
// Animated Grammar Lesson Scripts — Naša Hrvatska
// Pre-written lesson content for the AnimatedLesson player
// ═══════════════════════════════════════════════════════════

export const LESSONS = [
  // ─────────────────────────────────────────────────────────
  // LESSON 1: Croatian Alphabet & Pronunciation
  // ─────────────────────────────────────────────────────────
  {
    id: 'alphabet',
    title: 'Croatian Alphabet & Pronunciation',
    subtitle: 'Master all 30 letters, special characters, and digraphs',
    icon: '🔤',
    level: 'A1',
    duration: '~5 min',
    color: '#0891b2',
    bg: '#ecfeff',
    slides: [
      {
        type: 'intro',
        title: 'Croatian Alphabet',
        body: 'Croatian uses the Latin alphabet with 30 letters. The great news: Croatian is almost perfectly phonetic — every letter always makes the same sound. Once you learn the letters, you can read anything.',
        icon: '🔤',
      },
      {
        type: 'rule',
        title: 'The 30-Letter Alphabet',
        body: 'Croatian has 30 letters: A B C Č Ć D Dž Đ E F G H I J K L Lj M N Nj O P R S Š T U V Z Ž. The digraphs Dž, Lj, and Nj each count as a single letter. There is no Q, W, X, or Y in native Croatian words.',
        highlight: 'phonetic',
      },
      {
        type: 'table',
        title: 'Special Characters',
        headers: ['Letter', 'Sound', 'Like in English', 'Example Word'],
        rows: [
          ['Č č', '/tʃ/', 'ch as in church', 'čaj (tea)'],
          ['Ć ć', '/tɕ/', 'softer ch — between ch and ty', 'ćao (bye)'],
          ['Đ đ', '/dʑ/', 'j as in jump (soft)', 'đon (sole of shoe)'],
          ['Š š', '/ʃ/', 'sh as in ship', 'šuma (forest)'],
          ['Ž ž', '/ʒ/', 's as in treasure', 'život (life)'],
          ['Lj lj', '/ʎ/', 'ly as in million', 'ljubav (love)'],
          ['Nj nj', '/ɲ/', 'ny as in canyon', 'njiva (field)'],
          ['Dž dž', '/dʒ/', 'j as in judge (hard)', 'džem (jam)'],
        ],
      },
      {
        type: 'rule',
        title: 'The Rolled-R and the Vowel R',
        body: "In Croatian, R is always rolled (trilled). More unusually, R can act as a vowel — forming the nucleus of a syllable with no adjacent vowel. The word 'prst' (finger) has no written vowel at all, yet R carries the syllable.",
        highlight: 'prst',
      },
      {
        type: 'example',
        title: 'R as a Vowel — Listen',
        items: [
          { hr: 'prst', en: 'finger', note: 'R is the only vowel' },
          { hr: 'crv', en: 'worm', note: 'R carries the syllable' },
          { hr: 'trg', en: 'square / market', note: 'R between consonants' },
          { hr: 'Krk', en: 'Krk (island)', note: 'Famous Croatian island — pure consonants!' },
        ],
      },
      {
        type: 'rule',
        title: 'Č vs Ć — The Classic Challenge',
        body: "Č (hard) and Ć (soft) are the most confusing pair for learners. Č sounds like 'ch' in 'church' — the tongue is against the hard palate. Ć is softer — the tongue is positioned further forward, near the teeth ridge, producing a 'ty'-like sound (think the English 'tune' said quickly as 'tyoon'). Native speakers always distinguish them.",
        highlight: 'Č vs Ć',
      },
      {
        type: 'example',
        title: 'Minimal Pairs — Hear the Difference',
        items: [
          { hr: 'čaj', en: 'tea', note: 'Hard č — like church' },
          { hr: 'ćao', en: 'bye (informal)', note: 'Soft ć — softer than č' },
          { hr: 'džem', en: 'jam', note: 'Hard dž — like judge' },
          { hr: 'đon', en: 'sole (of a shoe)', note: 'Soft đ — softer than dž' },
          { hr: 'šuma', en: 'forest', note: 'š = sh as in ship' },
          { hr: 'život', en: 'life', note: 'ž = s as in treasure' },
        ],
      },
      {
        type: 'rule',
        title: 'Key Pronunciation Rules',
        body: "1. Every letter is always pronounced — no silent letters. 2. Stress is free but tends to fall on the first or second syllable. 3. Vowels are pure and never diphthongs. 4. C = 'ts' as in 'cats', not 'k'. 5. J = 'y' as in 'yes', never 'j' as in 'jam'.",
        highlight: 'no silent letters',
      },
      {
        type: 'example',
        title: 'Common Words — Full Pronunciation',
        items: [
          { hr: 'hvala', en: 'thank you', note: 'h is breathy; v-a-l-a — 4 clear sounds' },
          {
            hr: 'molim',
            en: "please / you're welcome",
            note: 'm-o-l-i-m — each letter pronounced',
          },
          { hr: 'dobar dan', en: 'good day', note: 'd-o-b-a-r d-a-n — no silent letters' },
          { hr: 'jutro', en: 'morning', note: "j = 'y'; u-t-r-o" },
        ],
      },
      {
        type: 'quiz',
        q: 'The Croatian letter J is pronounced like which English sound?',
        options: ['j as in jump', 'y as in yes', 'zh as in treasure', 'h as in hat'],
        correct: 1,
        explanation:
          "Croatian J always sounds like 'y' in 'yes'. The word 'ja' (I) sounds like 'ya'. This trips up English speakers who expect J to sound like 'jump'.",
      },
      {
        type: 'quiz',
        q: 'Which word uses R as a vowel (syllabic R)?',
        options: ['ljubav', 'prst', 'čaj', 'more'],
        correct: 1,
        explanation:
          "'Prst' (finger) has no written vowel — R serves as the syllable nucleus. This is one of Croatian's most distinctive features, also found in Czech and Slovak.",
      },
      {
        type: 'summary',
        title: 'Croatian Alphabet — Complete!',
        points: [
          'Croatian has 30 letters — 3 digraphs (Lj, Nj, Dž) count as single letters',
          'It is perfectly phonetic: one letter = one sound, always',
          'The hardest pairs: Č (hard) vs Ć (soft), Dž (hard) vs Đ (soft)',
          'R can be a vowel — prst (finger), trg (square), Krk (island)',
          "J = 'y' as in yes; C = 'ts' as in cats; H = breathy as in loch",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 2: Noun Gender
  // ─────────────────────────────────────────────────────────
  {
    id: 'gender',
    title: 'Noun Gender',
    subtitle: 'Learn masculine, feminine, and neuter nouns',
    icon: '⚖️',
    level: 'A1',
    duration: '~5 min',
    color: '#16a34a',
    bg: '#f0fdf4',
    slides: [
      {
        type: 'intro',
        title: 'Noun Gender in Croatian',
        body: 'Every Croatian noun has a grammatical gender: masculine, feminine, or neuter. Gender controls how adjectives, pronouns, and verbs agree with the noun. The good news: the ending of most nouns tells you the gender immediately.',
        icon: '⚖️',
      },
      {
        type: 'rule',
        title: 'Rule 1 — Feminine Nouns',
        body: 'Most nouns ending in -A are feminine. This is the most reliable rule in Croatian grammar. Almost every noun ending in -a is feminine, regardless of biological sex. Exceptions exist for male names and a few loanwords.',
        highlight: '-A = feminine',
      },
      {
        type: 'rule',
        title: 'Rule 2 — Neuter Nouns',
        body: 'Nouns ending in -O or -E are neuter. This is also very reliable. Neuter nouns behave differently from masculine and feminine nouns in all cases.',
        highlight: '-O / -E = neuter',
      },
      {
        type: 'rule',
        title: 'Rule 3 — Masculine Nouns',
        body: "Nouns ending in a consonant are masculine. This is the default category. Note: some masculine nouns end in -o (loanwords like 'auto', 'radio') and a few neuter nouns end in a consonant — but these are rare exceptions.",
        highlight: 'consonant = masculine',
      },
      {
        type: 'table',
        title: 'Gender Endings at a Glance',
        headers: ['Gender', 'Typical Endings', 'Examples'],
        rows: [
          ['Masculine', 'consonant, -o (loanwords)', 'stol (table), brat (brother), auto (car)'],
          ['Feminine', '-a', 'žena (woman), knjiga (book), ruka (hand)'],
          ['Neuter', '-o, -e', 'selo (village), more (sea), dijete (child)'],
        ],
      },
      {
        type: 'rule',
        title: 'Natural Gender Exceptions',
        body: "Biological sex can override grammatical gender. Male names ending in -a are masculine despite the -a ending: Luka, Nikola, Matija all take masculine adjective agreement (mali Luka — little Luka). Occupational words ending in -a like 'kolega' (colleague) and 'vojvoda' (duke/warlord) can refer to males and take masculine agreement in practice: 'dobar kolega' (good colleague, male).",
        highlight: 'biological sex overrides',
      },
      {
        type: 'rule',
        title: 'Adjective Agreement',
        body: 'Adjectives must agree with the noun in gender, number, and case. A big table: veliki stol (masc). A big book: velika knjiga (fem). A big village: veliko selo (neut). The adjective changes its ending to match the noun.',
        highlight: 'adjectives must agree',
      },
      {
        type: 'example',
        title: 'Gender in Sentences',
        items: [
          {
            hr: 'Gdje je stol?',
            en: 'Where is the table?',
            note: 'stol = masculine (ends in consonant)',
          },
          {
            hr: 'Knjiga je na stolu.',
            en: 'The book is on the table.',
            note: 'knjiga = feminine (ends in -a)',
          },
          {
            hr: 'More je lijepo.',
            en: 'The sea is beautiful.',
            note: 'more = neuter (ends in -e)',
          },
          {
            hr: 'Grad je velik.',
            en: 'The city is big.',
            note: 'grad = masculine (ends in consonant)',
          },
          { hr: 'Soba je mala.', en: 'The room is small.', note: 'soba = feminine (ends in -a)' },
        ],
      },
      {
        type: 'example',
        title: 'Adjective Agreement — Watch It Change',
        items: [
          { hr: 'veliki brat', en: 'big brother', note: 'veliki = masc. adj. form' },
          { hr: 'velika sestra', en: 'big sister', note: 'velika = fem. adj. form' },
          { hr: 'veliko dijete', en: 'big child', note: 'veliko = neut. adj. form' },
        ],
      },
      {
        type: 'quiz',
        q: "What gender is the noun 'planina' (mountain)?",
        options: ['Masculine', 'Feminine', 'Neuter', 'Cannot tell'],
        correct: 1,
        explanation:
          "'Planina' ends in -a, so it is feminine. This is the most reliable rule: almost all nouns ending in -a are feminine in Croatian.",
      },
      {
        type: 'quiz',
        q: 'Which ending indicates a neuter noun?',
        options: ['-a', 'consonant', '-o or -e', '-i'],
        correct: 2,
        explanation:
          "Neuter nouns end in -o (like 'selo', village) or -e (like 'more', sea). Nouns ending in -a are feminine, and consonant endings indicate masculine.",
      },
      {
        type: 'summary',
        title: 'Noun Gender — Complete!',
        points: [
          'Three genders: masculine, feminine, neuter',
          'Ending -A = feminine (knjiga, žena, soba)',
          'Ending -O or -E = neuter (selo, more, dijete)',
          'Consonant ending = masculine (stol, brat, grad)',
          "Adjectives must match the noun's gender — the ending changes",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 3: Present Tense Conjugation
  // ─────────────────────────────────────────────────────────
  {
    id: 'present',
    title: 'Present Tense Conjugation',
    subtitle: 'Three verb classes plus essential irregular verbs',
    icon: '🔄',
    level: 'A2',
    duration: '~6 min',
    color: '#7c3aed',
    bg: '#faf5ff',
    slides: [
      {
        type: 'intro',
        title: 'Present Tense in Croatian',
        body: 'Croatian verbs conjugate for person (1st, 2nd, 3rd) and number (singular, plural). There are three main conjugation classes, each with a characteristic ending pattern. Learn these three patterns and you can conjugate hundreds of verbs.',
        icon: '🔄',
      },
      {
        type: 'rule',
        title: 'Subject Pronouns',
        body: "In Croatian, subject pronouns (ja, ti, on/ona/ono...) are often dropped because the verb ending itself shows who is performing the action. You say 'Govorim' (I speak) without needing 'ja'. Pronouns are added for emphasis or contrast.",
        highlight: 'pronouns are optional',
      },
      {
        type: 'table',
        title: 'Subject Pronouns',
        headers: ['Person', 'Singular', 'Plural'],
        rows: [
          ['1st', 'ja (I)', 'mi (we)'],
          ['2nd', 'ti (you)', 'vi (you all / formal you)'],
          ['3rd', 'on/ona/ono (he/she/it)', 'oni/one/ona (they)'],
        ],
      },
      {
        type: 'rule',
        title: 'Three Conjugation Classes',
        body: "Class 1 (-AM pattern): infinitives often ending in -ati → gledam, gledaš... Class 2 (-IM pattern): infinitives often ending in -iti, -ati → govorim, govoriš... Class 3 (-EM pattern): infinitives often ending in -ati, -eti, -uti → pišem, pišeš... The infinitive ending doesn't always predict the class — you must learn each verb's class.",
        highlight: 'three classes',
      },
      {
        type: 'table',
        title: 'Class 1 (-AM) — gledati (to watch)',
        headers: ['Person', 'Singular', 'Plural'],
        rows: [
          ['1st', 'gledam', 'gledamo'],
          ['2nd', 'gledaš', 'gledate'],
          ['3rd', 'gleda', 'gledaju'],
        ],
      },
      {
        type: 'table',
        title: 'Class 2 (-IM) — govoriti (to speak)',
        headers: ['Person', 'Singular', 'Plural'],
        rows: [
          ['1st', 'govorim', 'govorimo'],
          ['2nd', 'govoriš', 'govorite'],
          ['3rd', 'govori', 'govore'],
        ],
      },
      {
        type: 'table',
        title: 'Class 3 (-EM) — pisati (to write)',
        headers: ['Person', 'Singular', 'Plural'],
        rows: [
          ['1st', 'pišem', 'pišemo'],
          ['2nd', 'pišeš', 'pišete'],
          ['3rd', 'piše', 'pišu'],
        ],
      },
      {
        type: 'table',
        title: 'Irregular — biti (to be)',
        headers: ['Person', 'Singular', 'Plural'],
        rows: [
          ['1st', 'jesam / sam', 'jesmo / smo'],
          ['2nd', 'jesi / si', 'jeste / ste'],
          ['3rd', 'jest / je', 'jesu / su'],
        ],
      },
      {
        type: 'rule',
        title: 'Other Key Irregular Verbs',
        body: 'Imati (to have): imam, imaš, ima, imamo, imate, imaju. Ići (to go): idem, ideš, ide, idemo, idete, idu. Htjeti (to want/will): hoću/ću, hoćeš/ćeš, hoće/će, hoćemo/ćemo, hoćete/ćete, hoće/će. These are used constantly — memorise them first.',
        highlight: 'imati · ići · htjeti',
      },
      {
        type: 'example',
        title: 'Present Tense in Action',
        items: [
          {
            hr: 'Govorim hrvatski svaki dan.',
            en: 'I speak Croatian every day.',
            note: 'Class 2: govoriti → govorim',
          },
          {
            hr: 'Ona gleda film.',
            en: 'She is watching a film.',
            note: 'Class 1: gledati → gleda',
          },
          {
            hr: 'Idemo na plažu.',
            en: 'We are going to the beach.',
            note: 'Irregular: ići → idemo',
          },
          { hr: 'Imam pitanje.', en: 'I have a question.', note: 'Irregular: imati → imam' },
          {
            hr: 'Što piše u knjizi?',
            en: 'What is written in the book?',
            note: 'Class 3: pisati → piše',
          },
        ],
      },
      {
        type: 'quiz',
        q: "How do you say 'She speaks' using govoriti (Class 2)?",
        options: ['govora', 'govorim', 'govori', 'govorite'],
        correct: 2,
        explanation:
          'Class 2 (-IM) 3rd person singular is formed by dropping the -im ending and adding -i. Govoriti → govori (she/he/it speaks). The pattern is: govorim, govoriš, govori, govorimo, govorite, govore.',
      },
      {
        type: 'summary',
        title: 'Present Tense — Complete!',
        points: [
          'Three conjugation classes: -AM (gledati), -IM (govoriti), -EM (pisati)',
          'Subject pronouns (ja, ti, on...) are usually dropped — the verb ending is enough',
          'Key irregulars: biti (to be), imati (to have), ići (to go), htjeti (to want)',
          'biti has both long (jesam) and short (sam) forms — short forms are clitics',
          "Learn each verb's class when you first encounter it",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 4: The 7 Cases (Padeži Overview)
  // ─────────────────────────────────────────────────────────
  {
    id: 'cases',
    title: 'The 7 Cases (Padeži)',
    subtitle: 'How and why Croatian changes noun endings',
    icon: '🏛️',
    level: 'B1',
    duration: '~7 min',
    color: '#b45309',
    bg: '#fffbeb',
    slides: [
      {
        type: 'intro',
        title: 'Croatian Has 7 Cases',
        body: "In Croatian, nouns, pronouns, and adjectives change their endings depending on their role in the sentence. These different forms are called cases (padeži). Instead of using separate words like 'of', 'to', 'by', Croatian changes the noun's ending. It sounds daunting — but once you understand the logic, it becomes elegant.",
        icon: '🏛️',
      },
      {
        type: 'rule',
        title: 'What Cases Do',
        body: "Cases replace prepositions and word order to show meaning. 'I see the man' vs 'The man sees me' — in Croatian this is shown by changing 'čovjek' (man) to 'čovjeka'. You cannot move words around freely without changing meaning; instead, you change the noun's form.",
        highlight: 'endings show meaning',
      },
      {
        type: 'table',
        title: 'The 7 Cases — Overview',
        headers: ['Case', 'Croatian', 'Answers', 'Example'],
        rows: [
          ['Nominative', 'Nominativ', 'Who/What? (subject)', 'Stol je velik. (The table is big.)'],
          [
            'Accusative',
            'Akuzativ',
            'Whom/What? (direct object)',
            'Vidim stol. (I see the table.)',
          ],
          [
            'Genitive',
            'Genitiv',
            'Of whom/what? (possession, absence)',
            'Nema stola. (There is no table.)',
          ],
          ['Dative', 'Dativ', 'To/for whom?', 'Dajem Ani. (I give to Ana.)'],
          [
            'Locative',
            'Lokativ',
            'About/at/in (location, topic)',
            'Govori o stolu. (He speaks about the table.)',
          ],
          [
            'Instrumental',
            'Instrumental',
            'With/by means of',
            'Piše olovkom. (He writes with a pen.)',
          ],
          ['Vocative', 'Vokativ', 'Direct address', 'Stole moj! (My table! — archaic/poetic)'],
        ],
      },
      {
        type: 'rule',
        title: 'Nominative — The Subject Case',
        body: 'The nominative is the base form — what you find in dictionaries. It marks the subject of the sentence: the one doing the action. Stol je velik (The table is big). Žena čita (The woman reads). Adjectives in nominative: veliki (masc), velika (fem), veliko (neut).',
        highlight: 'Nominative = subject, dictionary form',
      },
      {
        type: 'rule',
        title: 'Accusative — The Object Case',
        body: "The accusative marks the direct object — the thing being acted upon. Vidim stol (I see the table — stol doesn't change, it's inanimate masculine). But animate masculine nouns DO change: Vidim muškarca (I see a man — muškarac → muškarca). Also used after motion verbs with 'u' and 'na'.",
        highlight: 'Accusative = direct object',
      },
      {
        type: 'rule',
        title: 'Genitive — Possession and Negation',
        body: "The genitive shows possession ('of'), quantity, and negation. Nema kruha (There is no bread). Auto mog brata (My brother's car). After nema (there is no), all nouns go into genitive. Also used after numbers 2-4 (genitive singular) and 5+ (genitive plural).",
        highlight: 'Genitive = of, nema + genitive',
      },
      {
        type: 'rule',
        title: 'Locative — Always With a Preposition',
        body: 'The locative ALWAYS requires a preposition — it never appears alone. Common prepositions: u (in), na (on/at), o (about), pri (at/near). Živim u Zagrebu (I live in Zagreb). Govori o knjizi (She speaks about the book). Key contrast: u Zagreb (accusative, going TO) vs u Zagrebu (locative, IN).',
        highlight: 'always needs a preposition',
      },
      {
        type: 'example',
        title: 'Cases in Real Sentences',
        items: [
          {
            hr: 'Vidim muškarca.',
            en: 'I see a man.',
            note: 'Accusative: muškarac → muškarca (masc. animate)',
          },
          { hr: 'Nema kruha.', en: 'There is no bread.', note: 'Genitive negation: kruh → kruha' },
          {
            hr: 'Idem u Zagreb.',
            en: 'I am going to Zagreb.',
            note: "Accusative after 'u' (motion toward)",
          },
          {
            hr: 'Živim u Zagrebu.',
            en: 'I live in Zagreb.',
            note: "Locative after 'u' (static location)",
          },
          { hr: 'Dajem knjizi.', en: 'I give to the book.', note: 'Dative: knjiga → knjizi' },
          {
            hr: 'Pišem olovkom.',
            en: 'I write with a pencil.',
            note: 'Instrumental: olovka → olovkom',
          },
        ],
      },
      {
        type: 'rule',
        title: 'The u Zagreb / u Zagrebu Contrast',
        body: "This pair is the most important case contrast for beginners. MOTION uses accusative: Idem u Zagreb (I'm going to Zagreb). LOCATION uses locative: Živim u Zagrebu (I live in Zagreb). The same preposition 'u' triggers different cases depending on whether there is movement involved.",
        highlight: 'motion = accusative, location = locative',
      },
      {
        type: 'quiz',
        q: "Which case do you use after 'nema' (there is no)?",
        options: ['Nominative', 'Accusative', 'Genitive', 'Locative'],
        correct: 2,
        explanation:
          "'Nema' (there is no) always triggers the genitive case. 'Nema kruha' = there is no bread (kruh → kruha). 'Nema vremena' = there is no time (vrijeme → vremena). This is one of the most useful rules to memorise first.",
      },
      {
        type: 'summary',
        title: 'The 7 Cases — Complete!',
        points: [
          'Nominative = subject (dictionary form) — Stol je velik',
          'Accusative = direct object, motion toward — Vidim stol / Idem u Zagreb',
          'Genitive = possession, negation — Nema kruha / auto mog brata',
          'Locative = static location/topic, always with a preposition — Živim u Zagrebu',
          'The u/na contrast: accusative for motion, locative for being there',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 5: Verb Aspect
  // ─────────────────────────────────────────────────────────
  {
    id: 'aspect',
    title: 'Verb Aspect',
    subtitle: 'The most important concept in Croatian grammar',
    icon: '⏳',
    level: 'B1',
    duration: '~7 min',
    color: '#0f766e',
    bg: '#f0fdfa',
    slides: [
      {
        type: 'intro',
        title: 'Verb Aspect — The Most Important Croatian Concept',
        body: 'Almost every Croatian verb comes in two versions: imperfective (describes process, duration, habit) and perfective (describes completion, result). This is called verb aspect (glagolski vid). There is no direct equivalent in English — English uses tense to hint at aspect, but Croatian makes it mandatory and explicit.',
        icon: '⏳',
      },
      {
        type: 'rule',
        title: 'What Aspect Means',
        body: 'Imperfective aspect focuses on the action itself — the process, the duration, the repetition. Perfective aspect focuses on the completion — the result, the moment it finished. You must choose every time you use a verb. There is no neutral option.',
        highlight: 'process vs completion',
      },
      {
        type: 'rule',
        title: 'Imperfective — When to Use It',
        body: "Use the imperfective when: (1) describing a habit or routine — 'I read every day'; (2) describing an ongoing action — 'I was reading when he called'; (3) describing the activity without caring about completion — 'I was writing' (whether or not finished); (4) in questions about whether something happened at all.",
        highlight: 'habit, process, duration',
      },
      {
        type: 'rule',
        title: 'Perfective — When to Use It',
        body: "Use the perfective when: (1) the action was completed — 'I read the whole book'; (2) the action happened once, suddenly — 'He jumped up'; (3) the result matters — 'I wrote the letter' (it's now written); (4) sequential actions — 'He came in, sat down, and opened his book'. Each step is a completed event.",
        highlight: 'completion, result, single event',
      },
      {
        type: 'table',
        title: 'Aspect Pairs',
        headers: ['Imperfective (process)', 'Perfective (completion)', 'Meaning'],
        rows: [
          ['pisati', 'napisati', 'to write'],
          ['čitati', 'pročitati', 'to read'],
          ['učiti', 'naučiti', 'to learn'],
          ['jesti', 'pojesti', 'to eat'],
          ['gledati', 'pogledati', 'to watch / look'],
          ['dolaziti', 'doći', 'to come / arrive'],
          ['odlaziti', 'otići', 'to leave / go away'],
          ['kupovati', 'kupiti', 'to buy'],
        ],
      },
      {
        type: 'example',
        title: 'The Same Verb — Two Meanings',
        items: [
          {
            hr: 'Jučer sam pisao pismo.',
            en: 'Yesterday I was writing a letter. (process, unfinished)',
            note: 'Imperfective — the writing was in progress',
          },
          {
            hr: 'Jučer sam napisao pismo.',
            en: 'Yesterday I wrote a letter. (completed)',
            note: 'Perfective — the letter is done',
          },
          {
            hr: 'Svaki dan čitam novine.',
            en: 'Every day I read the newspaper. (habit)',
            note: 'Imperfective for habitual actions',
          },
          {
            hr: 'Pročitao sam cijelu knjigu.',
            en: 'I read the whole book. (finished)',
            note: 'Perfective — completed from start to finish',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Aspect in the Future Tense',
        body: "In the future tense, the difference becomes even more important. 'Čitat ću' (I will be reading / I will read — imperfective, process or habit). 'Pročitat ću' (I will have read / I will finish reading — perfective, completion). 'Kad dođeš' (When you arrive — perfective in time clauses, not 'kad dolaziš').",
        highlight: 'future aspect is critical',
      },
      {
        type: 'rule',
        title: 'Aspect Pairs — Patterns',
        body: 'Many perfective verbs are formed by adding a prefix to the imperfective: pisati → napisati (na-), čitati → pročitati (pro-), učiti → naučiti (na-), jesti → pojesti (po-). But some pairs are completely different words: dolaziti (imperf.) / doći (perf.) — to come. You must learn each pair.',
        highlight: 'prefixes often form perfectives',
      },
      {
        type: 'example',
        title: 'Aspect Contrast — Future and Time Clauses',
        items: [
          {
            hr: 'Kad dođeš, nazovi me.',
            en: 'When you arrive, call me.',
            note: "Perfective 'dođeš' — the arrival must be complete",
          },
          {
            hr: 'Sutra ću kupiti kruh.',
            en: 'Tomorrow I will buy bread.',
            note: 'Perfective — the purchase will be completed',
          },
          {
            hr: 'Svako jutro ću učiti sat vremena.',
            en: 'Every morning I will study for an hour.',
            note: 'Imperfective — repeated habit in the future',
          },
        ],
      },
      {
        type: 'quiz',
        q: "You want to say 'I read the whole book' (it's finished). Which verb do you use?",
        options: ['čitao sam', 'pročitao sam', 'bit ću čitao', 'čitat ću'],
        correct: 1,
        explanation:
          "'Pročitao sam' uses the perfective 'pročitati' — the reading is completed, the whole book is done. 'Čitao sam' (imperfective) would mean 'I was reading' — the process, not the completion. The word 'cijelu' (whole) also signals perfective meaning.",
      },
      {
        type: 'summary',
        title: 'Verb Aspect — Complete!',
        points: [
          'Every Croatian verb has two aspect versions: imperfective and perfective',
          'Imperfective = process, habit, duration, repetition (čitati, pisati)',
          'Perfective = completion, result, single event (pročitati, napisati)',
          'Many perfectives are formed with a prefix: pisati → na-pisati',
          'Some pairs are different words: dolaziti (imperf.) / doći (perf.)',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 6: Clitic Pronouns & Word Order
  // ─────────────────────────────────────────────────────────
  {
    id: 'clitics',
    title: 'Clitic Pronouns & Word Order',
    subtitle: 'The second-position rule and the clitic chain',
    icon: '🔗',
    level: 'B2',
    duration: '~8 min',
    color: '#6d28d9',
    bg: '#faf5ff',
    slides: [
      {
        type: 'intro',
        title: 'Clitics — The Hardest Part of Croatian',
        body: 'Croatian has a set of short, unstressed words called clitics (klitike) that must appear in a specific position in the sentence — always second — and always in a fixed internal order when multiple clitics cluster together. Native speakers use these automatically; learners find this the single hardest feature of Croatian.',
        icon: '🔗',
      },
      {
        type: 'rule',
        title: 'What Are Clitics?',
        body: "Clitics are short, unstressed forms of pronouns and the verb 'biti'. They cannot stand alone — they need to lean on surrounding words. Croatian clitics include: biti forms (sam, si, je, smo, ste, su), dative pronouns (mi, ti, mu, joj, nam, vam, im), accusative pronouns (me, te, ga, je, nas, vas, ih), and the reflexive se.",
        highlight: 'short, unstressed, second position',
      },
      {
        type: 'rule',
        title: 'The Second-Position Rule',
        body: 'Clitics must come SECOND in the clause — after the first stressed phrase (not necessarily the first word). The first phrase can be any constituent: a noun, a pronoun, an adverb, a prepositional phrase. Everything after that first phrase: clitics come immediately.',
        highlight: 'clitics go SECOND',
      },
      {
        type: 'rule',
        title: 'First Phrase, Not First Word',
        body: "This is the key subtlety: 'second position' means after the first PHRASE, not the first word. 'Moj brat' is one phrase — two words but one unit. So: 'Moj brat ga je vidio' (My brother saw him) — 'Moj brat' is the first phrase, then 'ga je' are the clitics in position two.",
        highlight: 'after the first phrase',
      },
      {
        type: 'table',
        title: 'The Clitic Chain — Fixed Order',
        headers: ['Position', 'Clitics'],
        rows: [
          ['1', 'bi (conditional auxiliary)'],
          ['2', 'sam, si, je, smo, ste, su (biti — past-tense auxiliary)'],
          ['3', 'mi, ti, mu, joj, nam, vam, im (dative pronouns)'],
          ['4', 'me, te, ga, je, nas, vas, ih (accusative pronouns)'],
          ['5', 'se (reflexive)'],
        ],
      },
      {
        type: 'rule',
        title: 'The Chain in Practice',
        body: "When multiple clitics appear together, they must follow the 5-slot order. You never say 'ga sam mu' — you must say 'sam mu ga' (biti → dative → accusative). The chain 'sam mu ga' is perfectly grammatical; reversing any element is not. Most sentences use only 2-3 clitics at once.",
        highlight: 'sam mu ga — never ga sam mu',
      },
      {
        type: 'example',
        title: 'Clitic Chains — Correct Placement',
        items: [
          {
            hr: 'Dao sam mu ga.',
            en: 'I gave it to him.',
            note: 'sam (biti) → mu (dative) → ga (accusative)',
          },
          {
            hr: 'Večeras ću mu ga dati.',
            en: 'Tonight I will give it to him.',
            note: "First phrase = 'Večeras', clitics follow immediately",
          },
          {
            hr: 'Sjećam se toga.',
            en: 'I remember that.',
            note: 'se is reflexive — always after biti clitics',
          },
          {
            hr: 'Nije mi ga dala.',
            en: "She didn't give it to me.",
            note: 'Negation: nije + mi + ga',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Negation and Clitics',
        body: "With negation, the negative form of 'biti' replaces the clitic 'biti' form. 'Je' becomes 'nije'. The other clitics stay in their positions after it: 'Nije mi ga rekao' (He didn't tell it to me). Notice: nije is stressed and is NOT a clitic — it is a full word, so it can appear in position one if needed.",
        highlight: 'nije replaces je in negation',
      },
      {
        type: 'rule',
        title: 'Questions and Clitics',
        body: "In questions with 'li', the pattern shifts. 'Je li ti rekao?' (Did he tell you?) — 'Je' stays at the front when followed by 'li'. This is an exception to the second-position rule. In questions with question words (što, gdje, kada), normal second-position applies: 'Što ti je rekao?' (What did he tell you?).",
        highlight: 'je li — special question pattern',
      },
      {
        type: 'example',
        title: 'More Clitic Examples',
        items: [
          {
            hr: 'Rekao mi je.',
            en: 'He told me.',
            note: "'Je' (3rd sg only) may appear sentence-finally after other clitics — 'Rekao mi je' is standard. Other biti forms (sam/si/smo/ste/su) always precede dative: 'Dao sam ti ga'",
          },
          {
            hr: 'Ona mi se sviđa.',
            en: 'I like her. (lit. She pleases me)',
            note: 'mi (dative) → se (reflexive) — in that order',
          },
          {
            hr: 'Kupio sam ga.',
            en: 'I bought it.',
            note: 'sam (biti position 2) → ga (accusative position 4)',
          },
          {
            hr: 'Jeste li ga vidjeli?',
            en: 'Did you (all) see him?',
            note: 'li follows the biti clitic in yes/no questions',
          },
        ],
      },
      {
        type: 'quiz',
        q: "In the sentence 'I gave it to him' (Dao ___ ___ ___ .), what is the correct clitic order?",
        options: ['ga mu sam', 'sam ga mu', 'sam mu ga', 'mu ga sam'],
        correct: 2,
        explanation:
          "The correct order is 'sam mu ga': biti forms (sam) come first in the chain, then dative pronouns (mu = to him), then accusative pronouns (ga = it). 'Dao sam mu ga.' The chain order is fixed: bi → biti → dative → accusative → se.",
      },
      {
        type: 'summary',
        title: 'Clitic Pronouns — Complete!',
        points: [
          'Clitics are short unstressed words that must appear in second position',
          'Second position means after the first PHRASE (not just first word)',
          'The chain order is fixed: bi → sam/si/je → dative (mu/mi) → accusative (ga/me) → se',
          "Negation: 'nije' replaces 'je'; other clitics keep their positions",
          "Questions: 'Je li' is a special pattern; question-word questions use normal order",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 7: Kondicionalni način (Conditional Mood)
  // ─────────────────────────────────────────────────────────
  {
    id: 'conditional',
    title: 'Kondicionalni način',
    subtitle: 'Conditional mood — wishes, hypotheticals, and polite requests',
    icon: '🔮',
    level: 'B2',
    duration: '~6 min',
    color: '#b45309',
    bg: '#fffbeb',
    slides: [
      {
        type: 'intro',
        title: 'The Conditional Mood',
        body: "The conditional mood expresses wishes, hypotheticals, and polite requests. It uses the auxiliary 'bi' + past active participle.",
        icon: '🔮',
      },
      {
        type: 'table',
        title: 'Formation — bi + Participle',
        headers: ['Person', 'Masculine', 'Feminine'],
        rows: [
          ['ja (I)', 'ja bih radio', 'ja bih radila'],
          ['ti (you sg.)', 'ti bi radio', 'ti bi radila'],
          ['on/ona (he/she)', 'on/ona bi radio/radila', 'on/ona bi radio/radila'],
          ['mi (we)', 'mi bismo radili', 'mi bismo radile'],
          ['vi (you pl.)', 'vi biste radili', 'vi biste radile'],
          ['oni/one (they)', 'oni/one bi radili', 'oni/one bi radile'],
        ],
      },
      {
        type: 'rule',
        title: 'Three Core Uses',
        body: "The conditional has three main uses: (1) Hypotheticals — 'Kad bih imao vremena, učio bih više.' (If I had time, I would study more.) (2) Polite requests — 'Biste li mi mogli pomoći?' (Could you help me?) (3) Wishes — 'Volio bih posjetiti Dubrovnik.' (I would love to visit Dubrovnik.)",
        highlight: 'hypotheticals, requests, wishes',
      },
      {
        type: 'rule',
        title: 'Past Conditional — bio/bila + bi',
        body: "The past conditional expresses what would have happened but didn't. It adds 'bio/bila' (past of biti) before the main participle: 'Bio bih došao, ali nisam mogao.' (I would have come, but I couldn't.) The 'bio/bila' agrees in gender with the subject.",
        highlight: 'bio bih + participle',
      },
      {
        type: 'example',
        title: 'Conditional in Context',
        items: [
          {
            hr: 'Htio/Htjela bih kavu, molim.',
            en: 'I would like a coffee, please.',
            note: 'Most natural polite way to order',
          },
          {
            hr: 'Biste li mogli govoriti sporije?',
            en: 'Could you speak more slowly?',
            note: 'Polite request with biste li',
          },
          {
            hr: 'Kad bih živio u Zagrebu, svaki dan bih šetao Gornjim gradom.',
            en: 'If I lived in Zagreb, I would walk Upper Town every day.',
            note: 'Hypothetical present condition',
          },
          {
            hr: 'Bila bih kupila kartu, ali nije ih bilo.',
            en: 'I would have bought a ticket, but there were none.',
            note: 'Past conditional — feminine subject',
          },
        ],
      },
      {
        type: 'quiz',
        q: "How do you say 'I would like a coffee' politely?",
        options: ['Htio/Htjela bih kavu, molim.', 'Ja hoću kavu.', 'Mogu kavu.', 'Kava, molim.'],
        correct: 0,
        explanation:
          "'Htio/Htjela bih kavu, molim.' uses the conditional 'bih' with the participle 'htio/htjela' — this is the standard polite way to order or request in Croatian. 'Ja hoću kavu' is too blunt. 'Mogu kavu' is ungrammatical in this context.",
      },
      {
        type: 'summary',
        title: 'Conditional Mood — Complete!',
        points: [
          'Conditional = bi + past active participle (radio/radila)',
          'Forms: ja bih, ti bi, on/ona bi, mi bismo, vi biste, oni/one bi',
          "Use 1 — hypotheticals: 'Kad bih imao vremena, učio bih više.'",
          "Use 2 — polite requests: 'Biste li mi mogli pomoći?'",
          "Use 3 — wishes: 'Volio bih posjetiti Dubrovnik.'",
          "Past conditional adds bio/bila: 'Bio bih došao, ali nisam mogao.'",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 8: Složene rečenice (Complex Sentences)
  // ─────────────────────────────────────────────────────────
  {
    id: 'complex-sentences',
    title: 'Složene rečenice',
    subtitle: 'Complex sentences — subordinating conjunctions and relative clauses',
    icon: '🔗',
    level: 'B2',
    duration: '~8 min',
    color: '#0f766e',
    bg: '#f0fdfa',
    slides: [
      {
        type: 'intro',
        title: 'Complex Sentences',
        body: 'Complex sentences connect ideas using subordinating conjunctions. Mastering these moves you from basic communication to natural conversation.',
        icon: '🔗',
      },
      {
        type: 'rule',
        title: 'Temporal Clauses — When, While, As Soon As',
        body: "Key temporal conjunctions: kad/kada (when), dok (while), čim (as soon as), prije nego što (before), nakon što (after). Examples: 'Kad dođeš, nazovi me.' (When you arrive, call me.) 'Dok sam učio, slušao sam glazbu.' (While I was studying, I was listening to music.) 'Čim završim, idem.' (As soon as I finish, I'm going.) Key rule: use a perfective verb after 'kad' for future events.",
        highlight: "perfective after 'kad' for future",
      },
      {
        type: 'table',
        title: 'Temporal Conjunctions',
        headers: ['Croatian', 'English', 'Example'],
        rows: [
          ['kad / kada', 'when', 'Kad dođeš, nazovi me.'],
          ['dok', 'while', 'Dok sam učio, slušao sam glazbu.'],
          ['čim', 'as soon as', 'Čim završim, idem.'],
          ['prije nego što', 'before', 'Jedi prije nego što odeš.'],
          ['nakon što', 'after', 'Nakon što sam jeo, odmarao sam.'],
        ],
      },
      {
        type: 'rule',
        title: 'Causal and Concessive Clauses',
        body: "jer (because), iako (although), premda (even though), budući da (since/given that). Examples: 'Učim hrvatski jer volim Hrvatsku.' (I study Croatian because I love Croatia.) 'Iako je teško, ne odustajem.' (Although it's hard, I'm not giving up.) 'Budući da imaš iskustva, možeš voditi tim.' (Since you have experience, you can lead the team.)",
        highlight: 'jer, iako, premda, budući da',
      },
      {
        type: 'rule',
        title: 'Relative Clauses — koji/koja/koje',
        body: "Relative clauses use koji (who/which/that). Koji must agree in gender with the noun it refers to (its antecedent): 'Čovjek koji govori hrvatski.' (The man who speaks Croatian — koji = masculine.) 'Žena koja govori hrvatski.' (The woman who speaks Croatian — koja = feminine.) 'Dijete koje govori hrvatski.' (The child who speaks Croatian — koje = neuter.) Koji also declines for case within the relative clause.",
        highlight: 'koji agrees in gender with antecedent',
      },
      {
        type: 'rule',
        title: 'Indirect Speech — da + Present/Past',
        body: "Indirect speech uses 'da' + the appropriate tense: 'Rekao je da uči hrvatski.' (He said that he is studying Croatian.) 'Mislim da je to točno.' (I think that's correct.) Common pitfall: do NOT use 'što' where 'da' is needed. 'Rekao je da dolazi.' ✓ 'Rekao je što dolazi.' ✗ — 'što' in this position means 'what', creating a different meaning.",
        highlight: 'da for indirect speech — not što',
      },
      {
        type: 'example',
        title: 'Complex Sentences in Context',
        items: [
          {
            hr: 'Kad završiš posao, dođi k meni.',
            en: 'When you finish work, come to me.',
            note: "Perfective 'završiš' — completion triggers the main clause",
          },
          {
            hr: 'Iako nisam Hrvat, govorim jezik.',
            en: "Although I'm not Croatian, I speak the language.",
            note: 'Concessive iako — surprising contrast',
          },
          {
            hr: 'Knjiga koju čitam je odlična.',
            en: "The book that I'm reading is excellent.",
            note: 'koju = accusative of koja (fem.) — relative clause with case',
          },
          {
            hr: 'Rekli su da će doći.',
            en: 'They said they would come.',
            note: 'da + future — indirect speech',
          },
        ],
      },
      {
        type: 'quiz',
        q: "Complete: 'Volio bih posjetiti Dubrovnik, ___ sam čuo da je predivno.'",
        options: ['jer', 'iako', 'čim', 'dok'],
        correct: 0,
        explanation:
          "'jer' (because) is correct — 'Volio bih posjetiti Dubrovnik, jer sam čuo da je predivno.' (I would love to visit Dubrovnik, because I've heard it's beautiful.) 'iako' would mean 'although', which contradicts the positive intent. 'čim' means 'as soon as' and 'dok' means 'while' — neither fits here.",
      },
      {
        type: 'summary',
        title: 'Complex Sentences — Complete!',
        points: [
          'Temporal: kad/kada (when), dok (while), čim (as soon as), prije nego što (before), nakon što (after)',
          "Use perfective verb after 'kad' for future events: 'Kad dođeš...'",
          'Causal/concessive: jer (because), iako (although), premda (even though), budući da (since)',
          'Relative clauses: koji/koja/koje agrees in gender with its antecedent',
          "Indirect speech: da + tense — NOT 'što' where 'da' is needed",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON: Formalno obraćanje: Vi i ti
  // ─────────────────────────────────────────────────────────
  {
    id: 'vi-vs-ti',
    title: 'Formalno obraćanje: Vi i ti',
    subtitle: 'Formal and informal address — when to use which',
    icon: '🤝',
    level: 'A2',
    duration: '~4 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'Vi i ti — Formal vs Informal Address',
        body: "Croatian, like most European languages, has two ways to say 'you': Vi (formal, capitalized) and ti (informal). Choosing correctly is one of the most important social skills in Croatian — more so than grammar. Getting it wrong with elders is a noticeable social misstep.",
        icon: '🤝',
      },
      {
        type: 'rule',
        title: 'When to Use Vi (Formal)',
        body: "Use Vi (always capitalized in writing) with: elders and grandparents you are meeting for the first time, your partner's parents until they explicitly invite you to use ti, strangers over roughly 40 in formal situations, teachers, doctors, and officials. Vi is the safe default — when in doubt, start here.",
        highlight: 'when in doubt, use Vi',
      },
      {
        type: 'rule',
        title: 'When to Use ti (Informal)',
        body: "Use ti with peers your own age, children, close friends and family, and anyone who has explicitly said 'možemo prijeći na ti' (we can switch to ti). Among younger Croatians (under ~30) and in casual settings, ti is often used right away — but with older acquaintances, always wait for the invitation.",
        highlight: 'wait for the invitation',
      },
      {
        type: 'table',
        title: 'Vi vs ti — Quick Reference',
        headers: ['Situation', 'Use'],
        rows: [
          ["Partner's parents, first meeting", 'Vi'],
          ['Elders / grandparents (strangers)', 'Vi'],
          ['Doctors, teachers, officials', 'Vi'],
          ['Strangers over ~40 (formal)', 'Vi'],
          ['Peers your age', 'ti'],
          ['Children', 'ti'],
          ['Close friends and family', 'ti'],
          ["After 'možemo prijeći na ti'", 'ti'],
        ],
      },
      {
        type: 'rule',
        title: 'The Switch Offer — Prijelaz na ti',
        body: "When someone says 'Možemo li prijeći na ti?' (Can we switch to ti?), always accept warmly. The natural reply is 'Naravno, s veseljem!' (Of course, with pleasure!) or 'Naravno, s radošću!' Refusing is considered awkward and cold. The offer itself signals you have been accepted.",
        highlight: 'always accept warmly',
      },
      {
        type: 'example',
        title: 'Vi vs ti in Sentences',
        items: [
          {
            hr: 'Kako ste Vi?',
            en: 'How are you? (formal)',
            note: 'Vi — formal singular or plural',
          },
          { hr: 'Kako si ti?', en: 'How are you? (informal)', note: 'ti — informal, with a peer' },
          {
            hr: 'Možete li mi pomoći?',
            en: 'Can you help me? (formal)',
            note: 'Možete — Vi verb form',
          },
          {
            hr: 'Možeš li mi pomoći?',
            en: 'Can you help me? (informal)',
            note: 'Možeš — ti verb form',
          },
          {
            hr: 'Možemo li prijeći na ti?',
            en: 'Can we switch to ti?',
            note: 'The classic switch offer',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Cultural Note — Why This Matters',
        body: "Croatians notice when foreigners use Vi correctly with elders — it earns immediate respect. Using ti too early with someone's grandmother or with a doctor signals carelessness. Most Croatians will gently correct you if ti is appropriate, but switching to ti too soon with elders is harder to recover from. The effort to use Vi shows cultural awareness.",
        highlight: 'Croatians will correct you kindly',
      },
      {
        type: 'quiz',
        q: "You are meeting your Croatian partner's mother for the first time. Which form do you use?",
        options: [
          'ti — to seem friendly',
          'Vi — she is an elder you are meeting formally',
          'Either is fine',
          'Use first name only',
        ],
        correct: 1,
        explanation:
          "Always start with Vi when meeting a partner's parents. Wait until they explicitly offer to switch to ti. Starting with ti signals a lack of respect for Croatian social norms, even if you mean to be warm.",
      },
      {
        type: 'quiz',
        q: "A Croatian peer says: 'Možemo li prijeći na ti?' What do you do?",
        options: [
          'Politely decline to keep it formal',
          "Accept warmly — 'Naravno, s veseljem!'",
          'Ignore it and keep using Vi',
          'Ask why they want to switch',
        ],
        correct: 1,
        explanation:
          'When someone offers to switch to ti, always accept warmly. The offer is a sign of welcome and acceptance. Refusing is considered awkward and cold in Croatian culture.',
      },
      {
        type: 'summary',
        title: 'Formalno obraćanje — Complete!',
        points: [
          "Vi (capitalized) = formal: elders, officials, partner's parents, strangers over ~40",
          'ti = informal: peers, children, friends, family',
          'When in doubt, use Vi — Croatians will invite you to switch if ti is appropriate',
          "When offered 'Možemo li prijeći na ti?' always accept warmly",
          'Getting Vi right with elders earns immediate respect as a foreigner',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON: Croatian Past Tense (A2)
  // ─────────────────────────────────────────────────────────
  {
    id: 'past-tense',
    title: 'Croatian Past Tense',
    subtitle: 'Talk about yesterday — the L-participle + auxiliary system',
    icon: '⏮️',
    level: 'A2',
    duration: '~6 min',
    color: '#0369a1',
    bg: '#f0f9ff',
    slides: [
      {
        type: 'intro',
        title: 'Croatian Past Tense',
        body: "The Croatian past tense has two moving parts: (1) a past participle that changes based on the subject's gender, and (2) a short form of 'biti' (to be) as an auxiliary. The logic is consistent — once you learn the pattern, it applies to every verb. You cannot speak Croatian without this.",
        icon: '⏮️',
      },
      {
        type: 'rule',
        title: 'The Two Parts: Participle + Auxiliary',
        body: "Past tense = L-PARTICIPLE + AUXILIARY (sam/si/je/smo/ste/su). The L-participle is named for its masculine singular ending in '-o' or '-ao/-io'. The auxiliary 'je' is clitic — in standard word order the participle comes first: 'Radio sam' (I worked), not 'Sam radio'.",
        highlight: 'participle + sam/si/je/smo/ste/su',
      },
      {
        type: 'rule',
        title: 'Gender Endings of the L-Participle',
        body: "The participle agrees with the SUBJECT in gender and number. Masculine singular: -o / -ao / -io (radio, išao, bio). Feminine singular: -la / -ala / -ila (radila, išla, bila). Masculine/mixed plural: -li (radili, išli, bili). All-female plural: -le (radile, išle, bile). The 'li' form is default for mixed or unknown groups.",
        highlight: '-o (m.sg) · -la (f.sg) · -li (m.pl) · -le (f.pl)',
      },
      {
        type: 'table',
        title: "'Raditi' (to work) — Full Past Tense",
        headers: ['Person', 'Masculine', 'Feminine'],
        rows: [
          ['ja (I)', 'radio sam', 'radila sam'],
          ['ti (you)', 'radio si', 'radila si'],
          ['on (he)', 'radio je', '—'],
          ['ona (she)', '—', 'radila je'],
          ['mi (we)', 'radili smo', 'radile smo'],
          ['vi (you pl.)', 'radili ste', 'radile ste'],
          ['oni (they m.)', 'radili su', '—'],
          ['one (they f.)', '—', 'radile su'],
        ],
      },
      {
        type: 'example',
        title: 'Core Verbs — Past Tense',
        items: [
          {
            hr: 'Išao sam u Zagreb.',
            en: 'I (m) went to Zagreb.',
            note: 'ići → išao (m) / išla (f) — irregular',
          },
          { hr: 'Jela je pizzu.', en: 'She ate pizza.', note: 'jesti → jeo (m) / jela (f)' },
          { hr: 'Bili smo kod kuće.', en: 'We were at home.', note: 'biti → bio/bila/bili/bile' },
          {
            hr: 'Govorili su hrvatski.',
            en: 'They (m.) spoke Croatian.',
            note: 'govoriti → govorio/govorila/govorili/govorile',
          },
          {
            hr: 'Mogla je doći.',
            en: 'She was able to come.',
            note: 'moći → mogao (m) / mogla (f) — irregular',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Negative Past: Nisam / Nije / Nisu',
        body: "To negate the past tense, replace the positive auxiliary with its negative: nisam, nisi, nije, nismo, niste, nisu. The participle is unchanged. Standard word order: negative auxiliary AFTER the participle. 'Nisam radio' (I didn't work). 'Ona nije išla' (She didn't go). 'Nisu mogli doći' (They couldn't come).",
        highlight: 'nisam · nisi · nije · nismo · niste · nisu',
      },
      {
        type: 'rule',
        title: 'The Two Key Irregulars: ići and biti',
        body: "'Ići' (to go): past participle išao (m.sg), išla (f.sg), išli (m.pl), išle (f.pl). The 'š' appears in the past but not in the infinitive — memorize it separately. 'Biti' (to be): bio (m.sg), bila (f.sg), bili (m.pl), bile (f.pl). These two verbs appear in almost every Croatian sentence — learn them first.",
        highlight: 'ići → išao/išla | biti → bio/bila',
      },
      {
        type: 'quiz',
        q: "'She worked yesterday' — which is correct?",
        options: ['Radila je jučer.', 'Radio je jučer.', 'Radili smo jučer.', 'Radila sam jučer.'],
        correct: 0,
        explanation:
          "The subject is 'she' (ona) — feminine singular. Participle: 'radila' (f.sg). Auxiliary: 'je' (3rd person singular). Standard word order: 'Radila je jučer.' Answer B uses the masculine 'radio', C is 'we worked', D is 'I (f.) worked'.",
      },
      {
        type: 'quiz',
        q: "How do you say 'They (m.) didn't eat'?",
        options: ['Nisu jeli.', 'Nisu jele.', 'Nisu jeo.', 'Nisu jela.'],
        correct: 0,
        explanation:
          "'Nisu' = 3rd person plural negative auxiliary. 'Jeli' = masculine/mixed plural L-participle of 'jesti' (to eat). Together: 'Nisu jeli.' — 'They (m./mixed) didn't eat.' 'Jele' would be all-female group. 'Jeo/jela' are singular forms.",
      },
      {
        type: 'summary',
        title: "Past Tense — You've Got It!",
        points: [
          'Past tense = L-participle + short auxiliary (sam/si/je/smo/ste/su)',
          'Masculine singular: -o / -ao / -io · Feminine singular: -la / -ala / -ila',
          'Mixed/masculine plural: -li · All-female plural: -le',
          'Negative: nisam/nisi/nije/nismo/niste/nisu — participle unchanged',
          'Key irregulars: ići → išao/išla | biti → bio/bila | moći → mogao/mogla',
          "Word order: 'Radio sam' (standard) — participle before auxiliary",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON: Croatian Future Tense (B1)
  // ─────────────────────────────────────────────────────────
  {
    id: 'future-tense',
    title: 'Croatian Future Tense',
    subtitle: 'Plans and predictions — the ću/ćeš/će system',
    icon: '🚀',
    level: 'B1',
    duration: '~6 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'Croatian Future Tense',
        body: 'Croatian future tense is formed with a short set of auxiliaries (ću, ćeš, će, ćemo, ćete, će) combined with the infinitive. Unlike the past tense, gender plays NO role — the same form is used by men and women. This makes the future one of the simpler Croatian tenses to master.',
        icon: '🚀',
      },
      {
        type: 'rule',
        title: 'Future = Infinitive Stem + ću/ćeš/će...',
        body: "The short (enclitic) future form clips the infinitive: 'raditi' → 'radit ću' (I will work). The final vowel is dropped and the auxiliary is written as a separate word. The long form — 'ja ću raditi' — keeps the full infinitive and places the auxiliary first. Both forms are correct; the short form is more common in writing.",
        highlight: 'ću · ćeš · će · ćemo · ćete · će',
      },
      {
        type: 'table',
        title: 'Future Auxiliaries — Full Table',
        headers: ['Person', 'Auxiliary', 'Short form (ići)', 'Long form'],
        rows: [
          ['ja', 'ću', 'ić ću', 'ja ću ići'],
          ['ti', 'ćeš', 'ić ćeš', 'ti ćeš ići'],
          ['on / ona', 'će', 'ić će', 'on/ona će ići'],
          ['mi', 'ćemo', 'ić ćemo', 'mi ćemo ići'],
          ['vi', 'ćete', 'ić ćete', 'vi ćete ići'],
          ['oni / one', 'će', 'ić će', 'oni/one će ići'],
        ],
      },
      {
        type: 'rule',
        title: 'No Gender Difference — Ever',
        body: "In the past tense, 'radio sam' (m.) vs 'radila sam' (f.) differ. In the future, 'radit ću' is identical for male and female speakers. A man says 'ić ću' and a woman says 'ić ću' — no change. This gender-neutrality applies to every verb in every person. Memorize the six auxiliaries and you're done.",
        highlight: 'No gender distinction in future tense',
      },
      {
        type: 'example',
        title: 'Future Tense — Real Sentences',
        items: [
          {
            hr: 'Sutra ću ići na more.',
            en: 'Tomorrow I will go to the sea.',
            note: 'Short: ić ću | Long: ću ići',
          },
          {
            hr: 'Što ćeš raditi vikend?',
            en: 'What will you do this weekend?',
            note: 'Most common future question',
          },
          {
            hr: 'Bit će lijepo.',
            en: 'It will be nice.',
            note: 'biti → bit će — very high-frequency phrase',
          },
          {
            hr: 'Nećemo zaboraviti.',
            en: 'We will not forget.',
            note: 'Negative: nećemo (1st pl. neg. future)',
          },
          { hr: 'Hoće li doći?', en: 'Will he/she come?', note: 'Question: Hoće li + infinitive?' },
        ],
      },
      {
        type: 'rule',
        title: 'Negative Future: Neću / Neće / Nećemo',
        body: "Negative future replaces the positive auxiliary with: neću, nećeš, neće, nećemo, nećete, neće. The infinitive follows unchanged. 'Neću ići' (I will not go). 'Neće doći' (He/she will not come). 'Nećemo zaboraviti' (We will not forget). The negative form is one word — never separate.",
        highlight: 'neću · nećeš · neće · nećemo · nećete · neće',
      },
      {
        type: 'rule',
        title: 'Aspect Matters in the Future',
        body: "Imperfective future describes an ongoing or habitual future action: 'Ću čitati' (I will be reading / I'll read — no defined endpoint). Perfective future describes a completed, bounded action: 'Ću pročitati' (I will have read / I'll finish reading). For promises and plans with a clear outcome, always use perfective. Imperfective future is for ongoing states or habits.",
        highlight: 'Perfective = completion · Imperfective = ongoing/habitual',
      },
      {
        type: 'quiz',
        q: "'We will eat lunch' in Croatian?",
        options: ['Ručat ćemo.', 'Ručamo.', 'Ručali smo.', 'Ručaće.'],
        correct: 0,
        explanation:
          "'Ručati' → short stem 'ručat' + 'ćemo' (1st person plural future). 'Ručamo' = we eat (present). 'Ručali smo' = we ate (past). 'Ručaće' = they will eat (3rd person plural). Answer: 'Ručat ćemo.'",
      },
      {
        type: 'quiz',
        q: "'I will not come' — which is correct?",
        options: ['Neću doći.', 'Nisam došao.', 'Neće doći.', 'Ne dolazim.'],
        correct: 0,
        explanation:
          "'Neću' = 1st person singular negative future auxiliary. 'Doći' = perfective infinitive (to come, as completed arrival). Together: 'Neću doći.' 'Nisam došao' = past negative. 'Neće doći' = he/she will not come. 'Ne dolazim' = I am not coming (present imperfective).",
      },
      {
        type: 'summary',
        title: 'Future Tense — Ready for Tomorrow!',
        points: [
          'Future = infinitive stem + ću/ćeš/će/ćemo/ćete/će',
          "Short form (common): 'radit ću' · Long form: 'ja ću raditi' — both correct",
          "No gender difference — 'bit ću' is the same for men and women",
          'Question: Hoće li + infinitive? (Will...?)',
          'Negative: neću/nećeš/neće/nećemo/nećete/neće + infinitive',
          'Aspect matters: perfective = plan with clear end · imperfective = ongoing',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 12: Verbal Aspect 2 — When to Use Imperfective
  // ─────────────────────────────────────────────────────────
  {
    id: 'aspect-imperfective',
    title: 'Verbal Aspect 2: The Imperfective',
    subtitle: 'Habitual actions, ongoing processes, and general truths',
    icon: '🔄',
    level: 'B1',
    duration: '~6 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'When to Use Imperfective',
        body: "The imperfective aspect views an action as a process — ongoing, repeated, or simply described without reference to its completion. If you can add 'every day', 'always', or 'was doing' in English, you almost certainly need the imperfective in Croatian.",
        icon: '🔄',
      },
      {
        type: 'rule',
        title: 'Rule 1: Habitual & Repeated Actions',
        body: "When an action happens regularly — every day, often, sometimes — use the imperfective. The key words (uvijek, često, ponekad, svaki dan, obično) almost always demand imperfective. Think: if you could say 'used to' or 'would always', it's imperfective.",
        highlight: 'uvijek, često, ponekad',
      },
      {
        type: 'example',
        title: 'Habitual Actions — Listen',
        items: [
          {
            hr: 'Svaki dan pijem kavu.',
            en: 'Every day I drink coffee.',
            note: 'piti (impf.) — repeated habit',
          },
          {
            hr: 'Uvijek čitam prije spavanja.',
            en: 'I always read before sleep.',
            note: 'čitati (impf.) — always',
          },
          {
            hr: 'Često smo šetali po obali.',
            en: 'We often walked along the shore.',
            note: 'šetati (impf.) — often in past',
          },
          {
            hr: 'Obično jem u podne.',
            en: 'I usually eat at noon.',
            note: 'jesti (impf.) — usual routine',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 2: Ongoing Action at a Point in Time',
        body: "Use the imperfective when describing what was happening at a specific moment — the action was in progress when something else occurred. This is the 'background' of a story. In English: 'I was reading when...' The action is a scene-setter, not a plot event.",
        highlight: 'was + -ing',
      },
      {
        type: 'example',
        title: 'Ongoing Actions — Listen',
        items: [
          {
            hr: 'Čitao sam kada je zazvonio telefon.',
            en: 'I was reading when the phone rang.',
            note: 'čitao sam (impf.) = background; zazvonio (pf.) = event',
          },
          {
            hr: 'Ona je spavala dok smo mi razgovarali.',
            en: 'She was sleeping while we were talking.',
            note: 'spavala (impf.) + razgovarali (impf.) — parallel processes',
          },
          {
            hr: 'Sunce je sjalo dok smo plivali.',
            en: 'The sun was shining while we swam.',
            note: 'sjalo (impf.) — scenic background',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 3: General Truths & Definitions',
        body: "When stating a fact about how something generally works — not a specific event — use the imperfective. 'Water boils at 100°C.' 'Croatians greet with three kisses.' These aren't one-time events; they're general truths. Imperfective is the only option here.",
        highlight: 'general truth',
      },
      {
        type: 'table',
        title: 'Key Imperfective Trigger Words',
        headers: ['Croatian', 'English', 'Example'],
        rows: [
          ['uvijek', 'always', 'Uvijek čitam. (I always read.)'],
          ['često', 'often', 'Često pjevamo. (We often sing.)'],
          ['ponekad', 'sometimes', 'Ponekad trčim. (I sometimes run.)'],
          ['svaki dan', 'every day', 'Svaki dan učim. (I study every day.)'],
          ['obično', 'usually', 'Obično pijem čaj. (I usually drink tea.)'],
          ['rijetko', 'rarely', 'Rijetko kasnim. (I rarely arrive late.)'],
          ['nikad', 'never', 'Nikad ne pušim. (I never smoke.)'],
        ],
      },
      {
        type: 'rule',
        title: 'Rule 4: Attempted or Unfinished Actions',
        body: "When an action was tried but not completed, or when the outcome is irrelevant, use the imperfective. 'I was reading the book' (didn't necessarily finish it) vs. 'I read the book' (finished, perfective). The imperfective describes the activity; the perfective asserts the result.",
        highlight: 'attempt / process',
      },
      {
        type: 'example',
        title: 'Process vs Result — The Key Contrast',
        items: [
          {
            hr: 'Pisao sam pismo.',
            en: 'I was writing a letter. (process, not necessarily finished)',
            note: 'pisao (impf.) — focus on activity',
          },
          {
            hr: 'Napisao sam pismo.',
            en: 'I wrote a letter. (finished — it exists now)',
            note: 'napisao (pf.) — result assured',
          },
          {
            hr: 'Učio sam za ispit.',
            en: 'I was studying for the exam.',
            note: 'učio (impf.) — process, outcome open',
          },
          {
            hr: 'Naučio sam lekciju.',
            en: 'I learned the lesson. (mastered it)',
            note: 'naučio (pf.) — successful completion',
          },
        ],
      },
      {
        type: 'quiz',
        q: 'Which sentence requires the IMPERFECTIVE aspect?',
        options: [
          'She finished (completed) her coffee.',
          'She was drinking coffee when I arrived.',
          'She drank her coffee in one sip.',
          'She will drink the coffee tomorrow.',
        ],
        correct: 1,
        explanation:
          "'She was drinking coffee when I arrived' — the ongoing background action needs imperfective (pila je kavu kada sam stigao). The first three options that reference completion or a quick single event use perfective (popiti). Imperfective = process / scene-setting.",
      },
      {
        type: 'quiz',
        q: 'Svaki dan _____ (to walk) uz more. Which verb form?',
        options: ['prohodati', 'hodati', 'prohodavam', 'hodao sam jednom'],
        correct: 1,
        explanation:
          "'Svaki dan' (every day) is a classic imperfective trigger. 'Hodati' is the imperfective of 'to walk'. 'Prohodati' is perfective (to learn to walk / walk for the first time). The daily habit demands imperfective.",
      },
      {
        type: 'summary',
        title: 'Imperfective — When to Use It',
        points: [
          'Habits & repetition: uvijek, često, svaki dan → always imperfective',
          "Background / ongoing: 'was doing X when Y happened' → imperfective for X",
          'General truths & definitions → imperfective only',
          "Process without confirmed result: 'I was writing' → imperfective",
          "Key test: Can you add 'every day' or 'used to'? → imperfective",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 13: Verbal Aspect 3 — When to Use Perfective
  // ─────────────────────────────────────────────────────────
  {
    id: 'aspect-perfective',
    title: 'Verbal Aspect 3: The Perfective',
    subtitle: 'Completed events, narrative past, and result states',
    icon: '✅',
    level: 'B1',
    duration: '~6 min',
    color: '#059669',
    bg: '#ecfdf5',
    slides: [
      {
        type: 'intro',
        title: 'When to Use Perfective',
        body: "The perfective aspect views an action as a complete, bounded event — it happened, it ended, it's done. In a story, every time the plot advances ('then he called, then she left, then they arrived'), that's the perfective. Think: checkmarks. Each perfective verb is a completed step.",
        icon: '✅',
      },
      {
        type: 'rule',
        title: 'Rule 1: Single Completed Events',
        body: "When a specific event happened once and is fully complete, use perfective. The event has a definite beginning and end. English past simple usually maps to perfective when it means 'did X and finished it': 'I wrote the email' (and sent it), 'She called' (one specific call), 'He left' (and is gone).",
        highlight: 'once, done, complete',
      },
      {
        type: 'example',
        title: 'Completed Single Events — Listen',
        items: [
          {
            hr: 'Napisao sam email.',
            en: "I wrote the email. (it's done)",
            note: 'napisati (pf.) — email exists, complete',
          },
          {
            hr: 'Ona je otišla.',
            en: 'She left. (she is gone)',
            note: 'otići (pf.) — departure completed',
          },
          {
            hr: 'Pojeli smo cijeli kolač.',
            en: 'We ate the whole cake.',
            note: 'pojesti (pf.) — cake finished',
          },
          {
            hr: 'Pročitao je cijelu knjigu.',
            en: 'He read the whole book.',
            note: 'pročitati (pf.) — book done',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 2: Narrative Sequence — Advancing the Story',
        body: "This is the most important use of perfective: in storytelling and narration, every verb that moves the story forward is perfective. The plot events — 'he entered, looked around, picked up the letter, read it, and called her' — each of these is a perfective verb. Imperfective is the stage setting; perfective is the action.",
        highlight: 'plot events = perfective',
      },
      {
        type: 'example',
        title: 'Narrative Chain — A Story in Perfective',
        items: [
          {
            hr: 'Ušao je, pogledao okolo i sjeo.',
            en: 'He entered, looked around, and sat down.',
            note: 'ući/pogledati/sjesti — 3 plot events, all pf.',
          },
          {
            hr: 'Uzela je kaput i izašla.',
            en: 'She took her coat and left.',
            note: 'uzeti/izaći — sequential events, both pf.',
          },
          {
            hr: 'Popio je kavu, platio i otišao.',
            en: 'He drank his coffee, paid, and left.',
            note: 'popiti/platiti/otići — classic narrative chain',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 3: Result States',
        body: "The perfective is used when the focus is on the result — the new state created by the completed action. 'The door opened' (it is now open), 'I learned Croatian' (I now know it), 'She fell asleep' (she is now asleep). The perfective captures the moment of change and its lasting result.",
        highlight: 'result / new state',
      },
      {
        type: 'table',
        title: 'Common Imperfective → Perfective Pairs',
        headers: ['Imperfective', 'Perfective', 'English'],
        rows: [
          ['pisati', 'napisati', 'to write'],
          ['čitati', 'pročitati', 'to read'],
          ['jesti', 'pojesti', 'to eat'],
          ['piti', 'popiti', 'to drink'],
          ['gledati', 'pogledati', 'to look/watch'],
          ['govoriti', 'reći', 'to say/speak'],
          ['uzimati', 'uzeti', 'to take'],
          ['dolaziti', 'doći', 'to come'],
          ['odlaziti', 'otići', 'to leave'],
          ['učiti', 'naučiti', 'to learn'],
          ['kupovati', 'kupiti', 'to buy'],
          ['zvati', 'nazvati', 'to call'],
        ],
      },
      {
        type: 'rule',
        title: 'Rule 4: Future Events with a Clear End',
        body: "In future tense, the perfective is used for planned, bounded events — things that will happen and be done. 'I will call you' (one specific call), 'We will eat and then go' (chain of complete events). Imperfective future means ongoing or habitual future: 'I will be working all day'.",
        highlight: 'planned, bounded future event',
      },
      {
        type: 'example',
        title: 'Perfective vs Imperfective in Future',
        items: [
          {
            hr: 'Nazvat ću te sutra.',
            en: 'I will call you tomorrow. (one call, done)',
            note: 'nazvati (pf.) — specific planned event',
          },
          {
            hr: 'Zvat ću te cijelo ljeto.',
            en: 'I will be calling you all summer.',
            note: 'zvati (impf.) — ongoing/repeated future',
          },
          {
            hr: 'Pročitat ću tu knjigu za tjedan dana.',
            en: "I'll finish reading that book in a week.",
            note: 'pročitati (pf.) — completion implied',
          },
          {
            hr: 'Čitat ću svaki dan.',
            en: 'I will read every day.',
            note: 'čitati (impf.) — habitual future',
          },
        ],
      },
      {
        type: 'quiz',
        q: "In the sentence 'He entered the room, sat down, and opened his laptop' — what aspect are ALL the verbs?",
        options: [
          'All imperfective — ongoing background',
          'All perfective — sequential plot events',
          'Mixed: first two imperfective, last perfective',
          'It depends on whether he finished',
        ],
        correct: 1,
        explanation:
          'Sequential narrative events that advance the story are ALWAYS perfective: ušao je (pf.), sjeo je (pf.), otvorio je (pf.). This is the rule of narrative: imperfective sets the scene, perfective drives the plot.',
      },
      {
        type: 'quiz',
        q: 'Which sentence uses perfective correctly?',
        options: [
          'Svaki dan sam napisao pismo. (I wrote a letter every day.)',
          'Napisao sam pismo i poslao ga. (I wrote the letter and sent it.)',
          'Napisao sam kad je zvonilo. (I was writing when it rang.)',
          'Uvijek napisao kasno. (I always wrote late.)',
        ],
        correct: 1,
        explanation:
          "'Napisao sam pismo i poslao ga' — perfective 'napisati' (write to completion) + 'poslati' (send) form a narrative chain of completed events. Option A is wrong: 'svaki dan' requires imperfective. Option C's situation requires imperfective for the background action.",
      },
      {
        type: 'summary',
        title: 'Perfective — When to Use It',
        points: [
          "Single completed events: 'I called' (once, it's done) → perfective",
          'Narrative sequence: every plot-advancing verb in a story → perfective',
          "Result states: 'she fell asleep / he left' (new state created) → perfective",
          "Bounded future event: 'I will call you tomorrow' → perfective",
          "Key test: Could you say 'finished' or 'completed'? → probably perfective",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 14: Verbal Aspect 4 — Negation, Commands & Traps
  // ─────────────────────────────────────────────────────────
  {
    id: 'aspect-negation',
    title: 'Verbal Aspect 4: Negation & Commands',
    subtitle: 'Aspect in negative sentences, imperatives, and advanced contexts',
    icon: '🚫',
    level: 'B2',
    duration: '~6 min',
    color: '#dc2626',
    bg: '#fef2f2',
    slides: [
      {
        type: 'intro',
        title: 'The Advanced Aspect Rules',
        body: "You know the basics: imperfective = process, perfective = completion. Now for the rules that native speakers follow automatically — but that cause the most errors for B2 learners: aspect in negation, aspect in imperatives (commands), and the subtle 'asking vs doing' distinction.",
        icon: '🚫',
      },
      {
        type: 'rule',
        title: 'Rule 1: Negation Strongly Prefers Imperfective',
        body: "When you negate an action in the past, the imperfective is almost always required — because negation cancels the action entirely, making completeness irrelevant. 'I didn't read' (nisam čitao — impf.) — the reading simply didn't happen. The perfective negative 'nisam pročitao' implies 'I didn't manage to finish reading' — a very specific meaning.",
        highlight: 'nisam + imperfective = typical negation',
      },
      {
        type: 'example',
        title: 'Negation — Imperfective vs Perfective',
        items: [
          {
            hr: 'Nisam čitao tu knjigu.',
            en: "I didn't read that book. (at all)",
            note: 'čitati (impf.) — standard negation; reading never happened',
          },
          {
            hr: 'Nisam pročitao tu knjigu.',
            en: "I didn't finish reading that book.",
            note: "pročitati (pf.) — implies I started but didn't complete it",
          },
          {
            hr: 'Nije jela ništa.',
            en: "She didn't eat anything.",
            note: 'jesti (impf.) — no eating occurred at all',
          },
          {
            hr: 'Nije pojela sve.',
            en: "She didn't eat everything.",
            note: 'pojesti (pf.) — she ate some, not all (not complete)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 2: Imperatives — General vs One-Time Commands',
        body: "Commands use aspect very specifically. An imperfective imperative gives a general instruction or policy: 'Speak Croatian!' (in general — do it as a habit). A perfective imperative gives a one-time order for a specific action: 'Say your name!' (do it now, once). Using the wrong aspect can sound rude or confused.",
        highlight: 'general policy = impf.; specific action = pf.',
      },
      {
        type: 'example',
        title: 'Imperative Aspect — Commands',
        items: [
          {
            hr: 'Govori sporije! (impf.)',
            en: 'Speak more slowly! (general instruction — do it as a habit from now on)',
            note: 'general instruction',
          },
          {
            hr: 'Reci mi svoju adresu! (pf.)',
            en: 'Tell me your address! (do it now, once)',
            note: 'specific, one-time request',
          },
          {
            hr: 'Pij više vode! (impf.)',
            en: 'Drink more water! (general lifestyle advice)',
            note: 'repeated habit instruction',
          },
          {
            hr: 'Popij ovu tabletu! (pf.)',
            en: 'Take this tablet! (now, this specific one)',
            note: 'one specific action now',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 3: Asking Permission vs Requesting Action',
        body: "When asking for permission to do something ('May I open the window?') — use imperfective. When making a specific request for someone else to do something ('Could you open the window?') — use perfective. This distinction is subtle but immediately audible to native speakers.",
        highlight: 'permission = impf.; request = pf.',
      },
      {
        type: 'example',
        title: 'Permission & Request',
        items: [
          {
            hr: 'Mogu li otvarati prozor? (impf.)',
            en: 'May I open the window? (asking permission)',
            note: 'impf. — requesting right to do the action',
          },
          {
            hr: 'Možeš li otvoriti prozor? (pf.)',
            en: 'Can you open the window? (asking them to do it)',
            note: 'pf. — specific one-time request',
          },
          {
            hr: 'Smijem li pušiti ovdje? (impf.)',
            en: 'May I smoke here? (permission)',
            note: 'impf. — seeking permission for habit',
          },
          {
            hr: 'Možeš li zatvoriti vrata? (pf.)',
            en: 'Can you close the door? (please do it once)',
            note: 'pf. — requesting a specific action',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Rule 4: After Modal Verbs — Context Decides',
        body: "After modal verbs (moći = can, htjeti = want, morati = must, smjeti = may), both aspects are possible but with very different meanings. Imperfective implies an ongoing or repeated action; perfective implies a specific, bounded goal. 'I want to read' (impf.) = I want to be a reader. 'I want to read this book' (pf.) = I want to finish this book.",
        highlight: 'modal + impf. = activity | modal + pf. = goal',
      },
      {
        type: 'table',
        title: 'Modal + Aspect Pairs — Meaning Shift',
        headers: ['Croatian', 'Aspect', 'English Meaning'],
        rows: [
          ['Hoću čitati.', 'impf.', 'I want to read. (as an activity / generally)'],
          ['Hoću pročitati ovu knjigu.', 'pf.', 'I want to finish reading this book. (goal)'],
          ['Moram pisati svaki dan.', 'impf.', 'I must write every day. (habitual)'],
          ['Moram napisati izvješće.', 'pf.', 'I must write the report. (specific task, done)'],
          ['Mogu plivati.', 'impf.', 'I can swim. (I know how to)'],
          ['Mogu preplivati kanal.', 'pf.', 'I can swim across the canal. (bounded achievement)'],
        ],
      },
      {
        type: 'quiz',
        q: "A friend gives you general lifestyle advice: 'Vježbaj svaki dan i _____ zdravo!' What goes in the blank?",
        options: ['pojedi (pf.)', 'jedi (impf.)', 'sjedi (impf.)', 'pojedi (pf.)'],
        correct: 1,
        explanation:
          "'Jedi zdravo!' — general lifestyle imperative requires imperfective. 'Eat healthy!' is ongoing advice about a habit, not a one-time request to eat a specific meal. 'Pojedi' (pf.) would mean 'finish eating that specific thing right now' — very different!",
      },
      {
        type: 'quiz',
        q: "She studied all year but didn't pass the exam. How does she say 'I didn't pass'?",
        options: [
          "Nisam položila ispit. (impf. — didn't pass at all)",
          "Nisam polagala ispit. (impf. — didn't take the exam at all)",
          "Nisam položila ispit. (pf. — tried but didn't complete/pass)",
          "There's no difference",
        ],
        correct: 2,
        explanation:
          "She DID take (polagala) the exam — she just didn't pass (položiti = to pass, perfective). 'Nisam položila' (pf. negative) means 'I tried/took it but didn't successfully complete it.' 'Nisam polagala' would mean she never sat the exam at all — which contradicts the situation.",
      },
      {
        type: 'summary',
        title: 'Aspect in Negation & Commands',
        points: [
          "Negation default: imperfective (action simply didn't happen)",
          "Perfective negative: 'tried but failed to complete' — specific meaning",
          'General imperative (advice/policy): imperfective',
          'Specific one-time command: perfective',
          'Permission (May I?): imperfective | Request (Please do it): perfective',
          'Modal + impf. = activity/ability | Modal + pf. = specific goal',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 15: Accusative Case Deep Dive
  // ─────────────────────────────────────────────────────────
  {
    id: 'accusative-deep',
    title: 'Accusative Case: Motion & Direct Objects',
    subtitle: 'Animate vs inanimate, directional motion, and time expressions',
    icon: '➡️',
    level: 'A2',
    duration: '~6 min',
    color: '#d97706',
    bg: '#fffbeb',
    slides: [
      {
        type: 'intro',
        title: 'Accusative — Your Most-Used Case',
        body: "The accusative is the case of direct objects and direction. After learning nominative ('what is it?'), accusative ('what do I do it to?') is the next case to master — you will use it in almost every sentence. It also marks movement toward a place: 'into the city', 'onto the table', 'to Zagreb'.",
        icon: '➡️',
      },
      {
        type: 'rule',
        title: 'Accusative: Direct Object',
        body: 'The direct object of a verb goes into the accusative. For feminine nouns (-a endings), -a changes to -u. For inanimate masculine nouns and neuter nouns, the accusative equals the nominative (no change). For animate masculine nouns (people and animals), the accusative equals the genitive (adds -a).',
        highlight: 'fem: -a → -u | inanim. masc./neut.: no change | anim. masc.: + -a',
      },
      {
        type: 'table',
        title: 'Accusative Endings — The Full Picture',
        headers: ['Gender', 'Nom.', 'Acc.', 'Example'],
        rows: [
          ['Feminine', '-a', '-u', 'žena → ženu (woman)'],
          ['Feminine', '-a', '-u', 'knjiga → knjigu (book)'],
          ['Masc. inanimate', '-∅ or cons.', 'same', 'grad → grad (city)'],
          ['Masc. inanimate', '-∅', 'same', 'stol → stol (table)'],
          ['Masc. animate', '-∅ or cons.', '-a', 'brat → brata (brother)'],
          ['Masc. animate', '-∅', '-a', 'pas → psa (dog)'],
          ['Neuter', '-o / -e', 'same', 'more → more (sea)'],
          ['Neuter', '-o', 'same', 'selo → selo (village)'],
        ],
      },
      {
        type: 'rule',
        title: 'The Animate/Inanimate Distinction',
        body: "This is one of Croatian grammar's key rules: masculine nouns that refer to living beings (people, animals) are 'animate' and take -a in accusative, just like genitive. Inanimate masculine nouns (objects, places, concepts) take the same form as nominative. Ask: 'Is it alive?' If yes → add -a.",
        highlight: 'alive? → -a | not alive? → no change',
      },
      {
        type: 'example',
        title: 'Animate vs Inanimate — Listen',
        items: [
          {
            hr: 'Vidim brata.',
            en: 'I see my brother.',
            note: 'brat (masc. animate) → brata (acc.)',
          },
          {
            hr: 'Vidim grad.',
            en: 'I see the city.',
            note: 'grad (masc. inanimate) → grad (acc., no change)',
          },
          { hr: 'Volim mačku.', en: 'I love the cat.', note: 'mačka (fem.) → mačku (acc.)' },
          {
            hr: 'Volim more.',
            en: 'I love the sea.',
            note: 'more (neuter) → more (acc., no change)',
          },
          {
            hr: 'Zovem prijatelja.',
            en: "I'm calling a friend.",
            note: 'prijatelj (masc. animate) → prijatelja (acc.)',
          },
          {
            hr: 'Kupujem auto.',
            en: "I'm buying a car.",
            note: 'auto (masc. inanimate) → auto (acc., no change)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Accusative: Direction with u and na',
        body: "The prepositions u (into/to) and na (onto/to) trigger the accusative when they express movement toward a place. This contrasts with the locative (static location): 'u gradu' (in the city — locative) vs 'u grad' (into/to the city — accusative). The form of the noun is often the same, but the meaning is very different.",
        highlight: 'movement → accusative | location → locative',
      },
      {
        type: 'example',
        title: 'Direction (Acc.) vs Location (Loc.)',
        items: [
          {
            hr: 'Idem u Zagreb. (acc.)',
            en: "I'm going to Zagreb. (direction)",
            note: 'motion: u + accusative',
          },
          {
            hr: 'Živim u Zagrebu. (loc.)',
            en: 'I live in Zagreb. (location)',
            note: 'static: u + locative',
          },
          {
            hr: 'Sjeo je na stolicu. (acc.)',
            en: 'He sat down on the chair. (motion — onto)',
            note: 'na + accusative = direction',
          },
          {
            hr: 'Sjedi na stolici. (loc.)',
            en: "He's sitting on the chair. (location)",
            note: 'na + locative = static',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Accusative: Time Expressions',
        body: "Accusative also expresses duration of time — how long something lasts: 'cijeli dan' (the whole day), 'jedan sat' (one hour), 'tjedan dana' (a week). Also: specific days of the week with the preposition 'u' (u ponedjeljak — on Monday). These don't decline the noun differently but appear in their accusative form.",
        highlight: 'duration of time = accusative',
      },
      {
        type: 'quiz',
        q: 'Which sentence correctly uses the accusative for a masculine animate noun?',
        options: ['Vidim profesor.', 'Vidim profesora.', 'Vidim profesoru.', 'Vidim professore.'],
        correct: 1,
        explanation:
          "'Profesora' — profesor is masculine animate (a person), so accusative = genitive form: profesor → profesora. This is one of Croatian's most important rules. 'Vidim profesora' = I see the professor.",
      },
      {
        type: 'quiz',
        q: "Is this direction or location? 'Stavi knjigu na policu.'",
        options: [
          'Location — the book is on the shelf',
          'Direction — put the book onto the shelf (accusative)',
          "It doesn't matter — na always takes locative",
          'Direction with locative',
        ],
        correct: 1,
        explanation:
          "'Stavi' (put) indicates movement. 'Na policu' = onto the shelf (accusative, polica → policu). When na implies movement/direction, it takes accusative. When it describes where something statically is, it takes locative ('na polici' = on the shelf).",
      },
      {
        type: 'summary',
        title: 'Accusative — The Motion & Object Case',
        points: [
          'Feminine: -a → -u (žena → ženu, knjiga → knjigu)',
          'Masculine animate: + -a (brat → brata, pas → psa)',
          'Masculine inanimate + Neuter: no change (grad, more)',
          'u/na + accusative = movement toward | u/na + locative = static location',
          'Duration of time: cijeli dan, jedan sat, tjedan dana → accusative',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 16: Genitive Case — Possession, Absence & Quantity
  // ─────────────────────────────────────────────────────────
  {
    id: 'genitive-deep',
    title: 'Genitive Case: Possession & Absence',
    subtitle: 'Ownership, negation of existence, partitive quantities, and prepositions',
    icon: '📦',
    level: 'B1',
    duration: '~7 min',
    color: '#0891b2',
    bg: '#ecfeff',
    slides: [
      {
        type: 'intro',
        title: "Genitive — The Case of 'Of'",
        body: "The genitive answers the question 'koga/čega?' (of whom/what?). It's the second most common case after accusative, and it has four main jobs: showing possession ('the book of Ana'), negating existence ('there is no...'), expressing quantity ('a lot of water'), and appearing after dozens of prepositions (od, do, iz, bez, kod, za, s, prema...).",
        icon: '📦',
      },
      {
        type: 'table',
        title: 'Genitive Endings',
        headers: ['Gender', 'Nom.', 'Gen.', 'Example'],
        rows: [
          ['Feminine (-a)', '-a', '-e', 'žena → žene (of the woman)'],
          ['Feminine (-a)', '-a', '-e', 'knjiga → knjige (of the book)'],
          ['Masculine', 'cons.', '-a', 'brat → brata (of the brother)'],
          ['Masculine', 'cons.', '-a', 'grad → grada (of the city)'],
          ['Neuter (-o)', '-o', '-a', 'more → mora (of the sea)'],
          ['Neuter (-e)', '-e', '-a', 'polje → polja (of the field)'],
        ],
      },
      {
        type: 'rule',
        title: 'Use 1: Possession',
        body: "To say something belongs to someone, put the owner in the genitive. There is no separate word for 'of' — the ending does the work. 'Kov Ana' (Ana's key) = 'ključ Ane'. 'The city's centre' = 'centar grada'. The genitive noun follows the thing possessed.",
        highlight: 'owner → genitive',
      },
      {
        type: 'example',
        title: 'Possession in Genitive — Listen',
        items: [
          { hr: 'ključ Ane', en: "Ana's key", note: 'Ana → Ane (fem. gen.)' },
          { hr: 'centar grada', en: 'the city centre', note: 'grad → grada (masc. gen.)' },
          { hr: 'boja mora', en: 'the colour of the sea', note: 'more → mora (neut. gen.)' },
          { hr: 'soba moje sestre', en: "my sister's room", note: 'sestra → sestre (fem. gen.)' },
        ],
      },
      {
        type: 'rule',
        title: 'Use 2: Nema + Genitive (There is no...)',
        body: "The word 'nema' (there is no / there isn't) always takes the genitive. This is one of the most common patterns in Croatian. Its positive pair is 'ima' (there is). 'Ima kave?' (Is there coffee?) — 'Nema kave.' (There's no coffee.) The noun after nema is always genitive.",
        highlight: 'nema + genitive',
      },
      {
        type: 'example',
        title: 'Nema + Genitive',
        items: [
          {
            hr: 'Nema kave.',
            en: "There's no coffee.",
            note: 'kava → kave (fem. gen.) after nema',
          },
          { hr: 'Nema vremena.', en: "There's no time.", note: 'vrijeme → vremena (neut. gen.)' },
          { hr: 'Nema ga ovdje.', en: "He isn't here.", note: 'on → ga (gen. pronoun)' },
          { hr: 'Nema kruha.', en: "There's no bread.", note: 'kruh → kruha (masc. gen.)' },
        ],
      },
      {
        type: 'rule',
        title: 'Use 3: Quantities & Numbers (5+)',
        body: "After quantity words (mnogo, malo, puno, dosta, nekoliko — a lot, a little, many, some) and after numbers 5 and above, Croatian uses the genitive plural. 'Mnogo prijatelja' (many friends), 'pet boca' (five bottles). Numbers 2-4 use genitive singular; numbers 5+ use genitive plural.",
        highlight: '5+ and quantity words → genitive plural',
      },
      {
        type: 'table',
        title: 'Key Genitive Prepositions',
        headers: ['Preposition', 'Meaning', 'Example'],
        rows: [
          ['od', 'from, of, since', 'od Splita (from Split); od jučer (since yesterday)'],
          ['do', 'to, until, as far as', 'do Dubrovnika (to Dubrovnik); do sutra (until tomorrow)'],
          ['iz', 'out of, from inside', 'iz Zagreba (from Zagreb — lived there)'],
          ['bez', 'without', 'bez šećera (without sugar)'],
          ['kod', "at (someone's place)", "kod bake (at grandma's)"],
          ['za', 'for (genitive use)', 'za tjedan dana (in a week)'],
          ['s/sa', 'from (off of)', 's mora (from the sea)'],
          ['prema', 'toward, according to', 'prema gradu (toward the city)'],
        ],
      },
      {
        type: 'quiz',
        q: "Complete the sentence: 'Idem _____ (from Zagreb).'",
        options: ['iz Zagreb', 'u Zagreb', 'iz Zagreba', 'od Zagreb'],
        correct: 2,
        explanation:
          "'Iz' (from inside a place) takes the genitive. Zagreb → Zagreba (masculine genitive, -a ending). So: 'Idem iz Zagreba.' Note: 'od Zagreba' would mean 'away from Zagreb' (like a distance), while 'iz Zagreba' means 'from Zagreb' where you lived or were.",
      },
      {
        type: 'quiz',
        q: 'Which sentence correctly uses nema?',
        options: [
          'Nema kava u kuhinji.',
          'Nema kavu u kuhinji.',
          'Nema kave u kuhinji.',
          'Nema kavi u kuhinji.',
        ],
        correct: 2,
        explanation:
          "'Nema' always takes the genitive: kava → kave. 'Nema kave u kuhinji' = There's no coffee in the kitchen. This pattern (nema + genitive) is used thousands of times a day in Croatian conversation.",
      },
      {
        type: 'summary',
        title: 'Genitive — Four Core Uses',
        points: [
          "Possession: ključ Ane (Ana's key), centar grada (city centre)",
          "Nema + genitive: Nema kave. (There's no coffee.)",
          'After quantity words: mnogo prijatelja, malo vremena',
          'After numbers 5+: pet boca, deset dana',
          'After prepositions: od, do, iz, bez, kod, prema, s/sa',
          'Endings: fem. -e, masc./neut. -a (sg.)',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 17: Dative & Locative Cases
  // ─────────────────────────────────────────────────────────
  {
    id: 'dative-locative',
    title: 'Dative & Locative Cases',
    subtitle: 'Giving and telling vs staying in place',
    icon: '📍',
    level: 'B1',
    duration: '~6 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'Two Related Cases',
        body: "Dative and locative share the same endings in modern Croatian — yet they answer different questions and are used in completely different contexts. Dative = the recipient ('to whom?'); Locative = where something is, always with a preposition. Mastering them together is the most efficient approach.",
        icon: '📍',
      },
      {
        type: 'rule',
        title: 'Dative: The Recipient Case',
        body: "Dative answers 'komu? čemu?' (to whom? for what?). It's the case of the indirect object — the person who receives the action. 'I gave the book to Ana' — Ana is in dative. Key verbs that take dative: dati (give), reći (tell), poslati (send), pomoći (help), zahvaliti (thank), pokazati (show).",
        highlight: 'komu? čemu? → dative',
      },
      {
        type: 'table',
        title: 'Dative & Locative Endings',
        headers: ['Gender', 'Nominative', 'Dative/Locative', 'Example'],
        rows: [
          ['Feminine (-a)', 'žena', '-i', 'ženi (to/about the woman)'],
          ['Feminine (-a)', 'knjiga', '-i', 'knjizi (to/about the book)'],
          ['Masculine', 'brat', '-u', 'bratu (to/about the brother)'],
          ['Masculine', 'grad', '-u', 'gradu (to/in the city)'],
          ['Neuter (-o)', 'more', '-u', 'moru (to/about the sea)'],
          ['Neuter (-e)', 'polje', '-u', 'polju (to/about the field)'],
        ],
      },
      {
        type: 'example',
        title: 'Dative — Giving & Telling',
        items: [
          {
            hr: 'Dao sam knjugu Ani.',
            en: 'I gave the book to Ana.',
            note: 'Ana → Ani (fem. dat.)',
          },
          {
            hr: 'Rekla je sestri.',
            en: 'She told her sister.',
            note: 'sestra → sestri (fem. dat.)',
          },
          {
            hr: 'Pišem prijatelju.',
            en: "I'm writing to my friend.",
            note: 'prijatelj → prijatelju (masc. dat.)',
          },
          { hr: 'Pomozi mi!', en: 'Help me!', note: 'ja → mi (dative pronoun)' },
        ],
      },
      {
        type: 'rule',
        title: 'Locative: Location — Always with a Preposition',
        body: "The locative ONLY appears after a preposition — it never stands alone. The prepositions that take locative: u (in), na (on/at), o (about), po (around/throughout), pri (near/at). Locative answers 'gdje?' (where?) for static location. Remember the contrast: u Zagreb (acc. = going to) vs u Zagrebu (loc. = being in).",
        highlight: 'u, na, o, po, pri + locative = location',
      },
      {
        type: 'example',
        title: 'Locative — Static Locations',
        items: [
          {
            hr: 'Živim u Zagrebu.',
            en: 'I live in Zagreb.',
            note: 'Zagreb → Zagrebu (masc. loc.)',
          },
          {
            hr: 'Knjiga je na stolu.',
            en: 'The book is on the table.',
            note: 'stol → stolu (masc. loc.)',
          },
          {
            hr: 'Pričamo o moru.',
            en: "We're talking about the sea.",
            note: 'more → moru (neut. loc.)',
          },
          {
            hr: 'Šetamo po gradu.',
            en: "We're walking around the city.",
            note: 'grad → gradu (masc. loc.)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Dative Pronouns — The Most Common Clitics',
        body: 'In everyday speech, the dative pronouns appear as short unstressed clitics (unaccented forms that glue to the sentence). These are among the most common words in Croatian: mi (to me), ti (to you), mu (to him), joj (to her), nam (to us), vam (to you pl.), im (to them). They follow the second-position rule.',
        highlight: 'mi, ti, mu, joj, nam, vam, im',
      },
      {
        type: 'example',
        title: 'Dative Clitics in Action',
        items: [
          { hr: 'Dao mi je ključ.', en: 'He gave me the key.', note: 'mi = to me (dative clitic)' },
          {
            hr: 'Rekla mu je istinu.',
            en: 'She told him the truth.',
            note: 'mu = to him (dative clitic)',
          },
          {
            hr: 'Pišu nam svaki tjedan.',
            en: 'They write to us every week.',
            note: 'nam = to us (dative clitic)',
          },
          { hr: 'Zahvaljujem ti.', en: 'I thank you.', note: 'ti = to you (dative clitic)' },
        ],
      },
      {
        type: 'quiz',
        q: "How do you say 'I'm going to the city'? (direction — motion)",
        options: ['Idem u gradu.', 'Idem u grad.', 'Idem u gradu.', 'Idem po gradu.'],
        correct: 1,
        explanation:
          "'Idem u grad.' — Direction uses u + accusative. Masculine inanimate 'grad' takes no change in accusative: u grad. 'U gradu' (locative) means 'in the city' (static location). 'Po gradu' (locative) means 'around the city' (movement throughout, different meaning).",
      },
      {
        type: 'quiz',
        q: 'Which sentence correctly uses the dative?',
        options: [
          'Poslao sam pismo Ana.',
          'Poslao sam pismo Anu.',
          'Poslao sam pismo Ani.',
          'Poslao sam pismo Ane.',
        ],
        correct: 2,
        explanation:
          "'Poslao sam pismo Ani.' — Ana is the recipient (to whom?), so she takes the dative: Ana → Ani (feminine dative, -a → -i). 'Pismo' (letter) is the direct object in accusative (neuter, no change). 'Anu' would be accusative (direct object), 'Ane' genitive (of Ana).",
      },
      {
        type: 'summary',
        title: 'Dative & Locative — Key Differences',
        points: [
          'Dative: indirect object — to whom? (komu?) — no preposition needed',
          'Locative: location — where? (gdje?) — ALWAYS with u, na, o, po, pri',
          'Both share endings: fem. -i, masc./neut. -u',
          'Dative clitics: mi, ti, mu, joj, nam, vam, im',
          'Direction (acc.) vs Location (loc.): u grad vs u gradu',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 18: Instrumental Case
  // ─────────────────────────────────────────────────────────
  {
    id: 'instrumental',
    title: 'Instrumental Case: Means & Accompaniment',
    subtitle: "How you do things, who you're with, and what you are",
    icon: '🔧',
    level: 'B1',
    duration: '~6 min',
    color: '#0f766e',
    bg: '#f0fdfa',
    slides: [
      {
        type: 'intro',
        title: "Instrumental — The 'By Means Of' Case",
        body: "The instrumental answers 'čime?' (with what?) and 'kime?' (with whom?). It's the case of tools, means, and accompaniment. 'I write with a pen' — pen is instrumental. 'I came with my sister' — sister is instrumental. It's also used after s/sa (with) and several other prepositions, and to describe what you are (profession after biti).",
        icon: '🔧',
      },
      {
        type: 'table',
        title: 'Instrumental Endings',
        headers: ['Gender', 'Nominative', 'Instrumental', 'Example'],
        rows: [
          ['Feminine (-a)', 'žena', '-om', 'ženom (with the woman)'],
          ['Feminine (-a)', 'knjiga', '-om', 'knjigom (with a book)'],
          ['Masculine', 'brat', '-om', 'bratom (with brother)'],
          ['Masculine', 'stol', '-om', 'stolom (with the table)'],
          ['Neuter (-o)', 'more', '-em', 'morem (by/with sea)'],
          ['Neuter (-e)', 'polje', '-em', 'poljem (across the field)'],
        ],
      },
      {
        type: 'rule',
        title: 'Use 1: Means & Instrument',
        body: "When you use a tool or means to do something, put it in the instrumental. No preposition is needed — the ending is enough. 'Writing with a pen' = 'pisati olovkom' (olovka → olovkom). 'Travelling by car' = 'putovati autom'. 'Paying by card' = 'platiti karticom'.",
        highlight: 'tool / means → instrumental, no preposition',
      },
      {
        type: 'example',
        title: 'Means & Instrument — Listen',
        items: [
          {
            hr: 'Pišem olovkom.',
            en: "I'm writing with a pencil.",
            note: 'olovka → olovkom (fem. instr.)',
          },
          { hr: 'Putujem vlakom.', en: 'I travel by train.', note: 'vlak → vlakom (masc. instr.)' },
          {
            hr: 'Jedem vilicom.',
            en: 'I eat with a fork.',
            note: 'vilica → vilicom (fem. instr.)',
          },
          { hr: 'Plati karticom!', en: 'Pay by card!', note: 'kartica → karticom (fem. instr.)' },
        ],
      },
      {
        type: 'rule',
        title: 'Use 2: Accompaniment with s/sa',
        body: "The preposition s/sa (with someone) always takes the instrumental. Use 's' before consonants, 'sa' before s, z, š, ž, and some clusters. 'With Ana' = 's Anom'. 'With my friend' = 's prijateljem'. This is the most common preposition + instrumental combination you'll encounter.",
        highlight: 's/sa + instrumental = with someone',
      },
      {
        type: 'example',
        title: 'Accompaniment — s/sa + Instrumental',
        items: [
          { hr: 'Idem s Anom.', en: "I'm going with Ana.", note: 'Ana → Anom (fem. instr.)' },
          {
            hr: 'Razgovaram s prijateljem.',
            en: "I'm talking with a friend.",
            note: 'prijatelj → prijateljem (masc. instr.)',
          },
          {
            hr: 'Živim sa sestrom.',
            en: 'I live with my sister.',
            note: "sestra → sestrom (fem. instr.); 'sa' before consonant cluster",
          },
          {
            hr: 'Pije kavu s mlijekom.',
            en: 'She drinks coffee with milk.',
            note: 'mlijeko → mlijekom (neut. instr.)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Use 3: Profession / Characterization with biti',
        body: "After the verb biti (to be) when stating what someone is by nature — profession, nationality, religion — Croatian often uses the instrumental. 'Ona je liječnicom' (She is a doctor). This is a formal/literary register; colloquially, nominative is also common: 'Ona je liječnik/liječnica.' You will encounter both.",
        highlight: 'biti + profession → instrumental (formal)',
      },
      {
        type: 'table',
        title: 'Key Instrumental Prepositions',
        headers: ['Preposition', 'Meaning', 'Example'],
        rows: [
          ['s / sa', 'with (accompaniment)', 's prijateljem (with a friend)'],
          ['između', 'between', 'između stolova (between tables)'],
          ['pred', 'in front of', 'pred kućom (in front of the house)'],
          ['za', 'behind, after', 'za uglom (behind the corner)'],
          ['nad', 'above, over', 'nad gradom (above the city)'],
          ['pod', 'under, below', 'pod mostom (under the bridge)'],
          ['među', 'among', 'među prijateljima (among friends)'],
        ],
      },
      {
        type: 'quiz',
        q: "How do you say 'I'm going with my mother'?",
        options: ['Idem s majke.', 'Idem s majku.', 'Idem s majkom.', 'Idem s majki.'],
        correct: 2,
        explanation:
          "'Idem s majkom.' — s/sa (with) + instrumental. Majka (mother) is feminine, instrumental ending -om: majka → majkom. This is the accusation for one of Croatian's most common preposition patterns.",
      },
      {
        type: 'quiz',
        q: 'You pay at a restaurant. Which is correct Croatian?',
        options: ['Plaćam kartu.', 'Plaćam karticom.', 'Plaćam kartice.', 'Plaćam kartica.'],
        correct: 1,
        explanation:
          "'Plaćam karticom.' — The means (how you pay) = instrumental. Kartica → karticom. No preposition needed — the -om ending alone indicates the instrument. This pattern (means without a preposition) is a key feature of the instrumental case.",
      },
      {
        type: 'summary',
        title: 'Instrumental — Three Core Uses',
        points: [
          'Means/tool (no preposition): pisati olovkom, putovati vlakom, platiti karticom',
          's/sa + instrumental = with someone: s Anom, s prijateljem',
          'Other prepositions: između, pred, nad, pod, za, među + instrumental',
          'Profession with biti (formal): Ona je liječnicom.',
          'Endings: fem. -om, masc. -om, neut. -em (soft stems: -om → varies)',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 19: Adjective Agreement
  // ─────────────────────────────────────────────────────────
  {
    id: 'adjective-agreement',
    title: 'Adjective Agreement',
    subtitle: 'Matching adjectives to nouns in gender, number, and case',
    icon: '🎨',
    level: 'A2',
    duration: '~6 min',
    color: '#9333ea',
    bg: '#faf5ff',
    slides: [
      {
        type: 'intro',
        title: 'Adjectives Must Agree',
        body: "In Croatian, adjectives must match the noun they describe in three things: gender (masculine/feminine/neuter), number (singular/plural), and case (nominative, accusative, genitive, etc.). This is called 'agreement'. An adjective alone has no fixed form — it changes to mirror the noun it modifies.",
        icon: '🎨',
      },
      {
        type: 'table',
        title: 'Basic Adjective Endings — Nominative Singular',
        headers: ['Gender', 'Ending', 'Example (big)', 'Example (small)'],
        rows: [
          ['Masculine', '-i / -∅', 'veliki (big)', 'mali (small)'],
          ['Feminine', '-a', 'velika (big)', 'mala (small)'],
          ['Neuter', '-o / -e', 'veliko (big)', 'malo (small)'],
        ],
      },
      {
        type: 'rule',
        title: 'The Agreement Rule',
        body: "Find the gender of the noun. Match the adjective ending to that gender. Simple example: 'big city' = 'veliki grad' (grad = masc. → veliki). 'Big sea' = 'veliko more' (more = neut. → veliko). 'Big woman' = 'velika žena' (žena = fem. → velika). The noun's gender dictates the adjective's ending.",
        highlight: 'noun gender → adjective ending',
      },
      {
        type: 'example',
        title: 'Agreement in Action — Listen',
        items: [
          { hr: 'veliki grad', en: 'big city', note: 'grad = masc. → veliki' },
          { hr: 'lijepa žena', en: 'beautiful woman', note: 'žena = fem. → lijepa' },
          { hr: 'malo dijete', en: 'small child', note: 'dijete = neut. → malo' },
          { hr: 'crni pas', en: 'black dog', note: 'pas = masc. → crni' },
          { hr: 'plava haljina', en: 'blue dress', note: 'haljina = fem. → plava' },
          { hr: 'staro more', en: 'old sea / ancient sea', note: 'more = neut. → staro' },
        ],
      },
      {
        type: 'rule',
        title: 'Adjectives in Cases — Accusative',
        body: "Adjectives also change for case, following the noun they modify. In the accusative: masculine inanimate adjectives don't change ('Vidim veliki grad' — same as nominative). Masculine animate adjectives add -og ('Vidim velikog brata'). Feminine adjectives change -a → -u ('Vidim lijepu ženu'). Neuter stays the same.",
        highlight: 'adjective case follows noun case',
      },
      {
        type: 'table',
        title: 'Adjective Endings — Key Cases',
        headers: ['Case', 'Masc. (inanim.)', 'Masc. (anim.)', 'Feminine', 'Neuter'],
        rows: [
          ['Nominative', 'veliki', 'veliki', 'velika', 'veliko'],
          ['Accusative', 'veliki (no change)', 'velikog', 'veliku', 'veliko (no change)'],
          ['Genitive', 'velikog', 'velikog', 'velike', 'velikog'],
          ['Dative/Loc.', 'velikom', 'velikom', 'velikoj', 'velikom'],
          ['Instrumental', 'velikim', 'velikim', 'velikom', 'velikim'],
        ],
      },
      {
        type: 'example',
        title: 'Adjectives Across Cases — Listen',
        items: [
          {
            hr: 'Vidim veliki grad. (acc.)',
            en: 'I see the big city.',
            note: 'masc. inanim. acc. = no change',
          },
          {
            hr: 'Vidim velikog brata. (acc.)',
            en: 'I see my big brother.',
            note: 'masc. anim. acc. = -og',
          },
          {
            hr: 'Vidim lijepu ženu. (acc.)',
            en: 'I see a beautiful woman.',
            note: 'fem. acc. = -u',
          },
          {
            hr: 'Živim u velikom gradu. (loc.)',
            en: 'I live in a big city.',
            note: 'masc. loc. = -om',
          },
          {
            hr: 'Idem s lijepom ženom. (instr.)',
            en: "I'm going with a beautiful woman.",
            note: 'fem. instr. = -om',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Definite vs Indefinite Adjectives',
        body: "Croatian has two sets of adjective forms: definite (when the noun is specific/known: 'the big city') and indefinite (when it's new/general: 'a big city'). In modern spoken Croatian the distinction is fading — most speakers use definite forms everywhere. But knowing it exists explains why you sometimes see shorter forms like 'mlad' instead of 'mladi'.",
        highlight: 'definite: -i | indefinite: shorter (literary)',
      },
      {
        type: 'quiz',
        q: "Fill in the blank: 'To je _____ (beautiful) kuća.'",
        options: ['lijepa', 'lijep', 'lijepo', 'lijepom'],
        correct: 0,
        explanation:
          "'To je lijepa kuća.' — kuća is feminine (ends in -a), nominative (subject position). Feminine nominative adjective ending = -a. So 'lijep' + -a = 'lijepa'. 'Lijep' (no ending) would be indefinite masculine; 'lijepo' is neuter.",
      },
      {
        type: 'quiz',
        q: 'Which sentence has correct adjective agreement?',
        options: [
          'Vidim lijepi ženu.',
          'Vidim lijepa ženu.',
          'Vidim lijepu ženu.',
          'Vidim lijepom ženu.',
        ],
        correct: 2,
        explanation:
          "'Vidim lijepu ženu.' — žena (feminine noun) in accusative = ženu. The adjective must match: feminine accusative = -u ending. So 'lijepa' → 'lijepu'. 'Lijepi' is masculine, 'lijepa' is feminine nominative, 'lijepom' is dative/instrumental feminine.",
      },
      {
        type: 'summary',
        title: 'Adjective Agreement — The Core Rules',
        points: [
          'Adjectives agree with their noun in gender, number, and case',
          'Nominative: masc. -i, fem. -a, neut. -o/e',
          'Accusative: masc. inanim. = same; masc. anim. -og; fem. -u; neut. = same',
          'Genitive: masc./neut. -og; fem. -e',
          'Dative/Locative: masc./neut. -om; fem. -oj',
          'Instrumental: masc./neut. -im; fem. -om',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 20: C1 — Clitic Ordering Mastery
  // ─────────────────────────────────────────────────────────
  {
    id: 'clitics-advanced',
    title: 'C1: Clitic Ordering Mastery',
    subtitle: 'The exact rule no textbook explains clearly enough',
    icon: '⚡',
    level: 'C1',
    duration: '~8 min',
    color: '#b45309',
    bg: '#fffbeb',
    slides: [
      {
        type: 'intro',
        title: 'The Rule That Separates Learners from Speakers',
        body: 'Clitic placement is the feature of Croatian that most advanced learners still get wrong. Clitics are short, unstressed pronoun/auxiliary forms that cannot start or end a sentence — they must occupy the second position. Master this rule and you will sound genuinely Croatian. Get it wrong and every native speaker will notice.',
        icon: '⚡',
      },
      {
        type: 'rule',
        title: 'The Second-Position Rule',
        body: 'Clitics (sam/si/je/smo/ste/su, bi, mi/ti/mu/joj/nam/vam/im, me/te/ga/je/nas/vas/ih, se) cluster after the first stressed unit of the clause. The first stressed unit can be a single word, a whole noun phrase, or an adverb. After that first unit — the clitic cluster goes, in a fixed internal order.',
        highlight: 'first stressed unit → clitic cluster → rest of sentence',
      },
      {
        type: 'rule',
        title: 'The Internal Order of Clitics',
        body: "When multiple clitics appear together, they follow a strict internal order: (1) bi (conditional) → (2) auxiliary (je/sam/si/smo/ste/su) → (3) dative pronoun (mi/ti/mu/joj/nam/vam/im) → (4) accusative pronoun (me/te/ga/je/nas/vas/ih) → (5) se/si (reflexive) → (6) je again (if it's the verb 'biti' not auxiliary). Never change this order.",
        highlight: 'bi → aux → dat → acc → se → je',
      },
      {
        type: 'example',
        title: 'Clitic Order — Building Complexity',
        items: [
          {
            hr: 'Dao sam mu ga.',
            en: 'I gave it to him.',
            note: 'sam (aux) → mu (dat.) → ga (acc.) — correct order',
          },
          { hr: 'Rekla mi je.', en: 'She told me.', note: 'mi (dat.) → je (aux) — correct' },
          {
            hr: 'Kupit ću ti ga.',
            en: 'I will buy it for you.',
            note: 'ću (aux) → ti (dat.) → ga (acc.)',
          },
          {
            hr: 'Pokazao bi mi ga.',
            en: 'He would show it to me.',
            note: 'bi (cond.) → mi (dat.) → ga (acc.)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'The First Stressed Unit — What Counts',
        body: "Any of these can be the 'first unit' before the clitic cluster: a single noun, a whole noun phrase with modifiers, an adverb, a conjunction + noun. Examples: 'Marija je pjevala' (Marija = first unit), 'Moja stara prijateljica mi je rekla' (Moja stara prijateljica = entire noun phrase = first unit). The clitics follow whatever comes first.",
        highlight: 'entire first phrase → then clitics',
      },
      {
        type: 'example',
        title: 'First Unit Variations — Listen',
        items: [
          {
            hr: 'Marija mi je to rekla.',
            en: 'Marija told me that.',
            note: "'Marija' is the first unit; mi + je follow",
          },
          {
            hr: 'Moja stara prijateljica mi je to rekla.',
            en: 'My old friend told me that.',
            note: 'entire NP is first unit; mi + je follow',
          },
          {
            hr: 'Jučer mi je rekla.',
            en: 'She told me yesterday.',
            note: "'Jučer' (adverb) = first unit; mi + je follow",
          },
          {
            hr: 'Kad mi je to rekla...',
            en: 'When she told me that...',
            note: "'Kad' = first unit in subclause",
          },
        ],
      },
      {
        type: 'rule',
        title: "The 'je' Problem — Auxiliary vs Verb",
        body: "The clitic 'je' does double duty: it's both the 3rd person singular past auxiliary AND the present tense of 'biti' (to be). When 'je' means 'is' (not an auxiliary), it comes LAST in the clitic cluster, after all other clitics. When it's the past auxiliary (helping verb), it follows its normal slot. This is the subtlest rule in Croatian.",
        highlight: 'je (aux.) = early slot | je (= is) = last',
      },
      {
        type: 'example',
        title: "The Double 'je' — The Hardest Distinction",
        items: [
          {
            hr: 'Dao mu je.',
            en: 'He gave it to him.',
            note: 'je = past auxiliary (is in aux slot)',
          },
          {
            hr: 'Dao mu ga je.',
            en: "He gave it to him. (explicit 'it')",
            note: "je = 'is'/identity; comes after ga",
          },
          { hr: 'Rekla mu je.', en: 'She told him.', note: 'je = aux (she has told)' },
          {
            hr: 'To mu je rekla.',
            en: 'She told him that.',
            note: 'je = aux, to = object before cluster',
          },
        ],
      },
      {
        type: 'quiz',
        q: "What is the correct clitic order in: 'She gave it to me' (ona + dat. mi + acc. ga + aux je)?",
        options: [
          'Ona je mi ga dala.',
          'Ona ga mi je dala.',
          'Ona mi ga je dala.',
          'Ona dala je mi ga.',
        ],
        correct: 2,
        explanation:
          "'Ona mi ga je dala.' — Order: ona (first unit) → mi (dative) → ga (accusative) → je (auxiliary) → dala (participle). The rule: auxiliary comes after dative and accusative pronouns. 'Ona je mi ga dala' is wrong — je cannot precede mi/ga.",
      },
      {
        type: 'quiz',
        q: "Where does the clitic cluster go in 'My older sister told me'?",
        options: [
          'Mi je moja starija sestra rekla.',
          'Moja starija sestra mi je rekla.',
          'Moja mi je starija sestra rekla.',
          'Rekla mi je moja starija sestra.',
        ],
        correct: 1,
        explanation:
          "'Moja starija sestra mi je rekla.' — The entire noun phrase 'Moja starija sestra' is the first stressed unit. The clitic cluster (mi je) follows immediately after the complete NP. This is the second-position rule applied to a multi-word first unit.",
      },
      {
        type: 'summary',
        title: 'Clitic Mastery — The Complete Rules',
        points: [
          'Clitics occupy second position — after the first stressed unit',
          'Internal order: bi → aux (je/sam...) → dative (mi/ti/mu...) → accusative (me/ga...) → se → je (verb)',
          'First unit can be any phrase — a word, NP, or adverb',
          "je as auxiliary: normal slot | je meaning 'is': always last",
          'Never place clitics at the start or end of a clause',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 21: C1 — Advanced Verbal Nouns & Participles
  // ─────────────────────────────────────────────────────────
  {
    id: 'verbal-nouns',
    title: 'C1: Verbal Nouns & Participles',
    subtitle: 'Turning verbs into nouns and adjectives — formal and literary Croatian',
    icon: '📖',
    level: 'C1',
    duration: '~8 min',
    color: '#1e3a8a',
    bg: '#eff6ff',
    slides: [
      {
        type: 'intro',
        title: 'Beyond Conjugated Verbs',
        body: 'At C1 level, Croatian deploys a rich system of non-finite verb forms: verbal nouns (glagolske imenice) that turn verbs into nouns, and participles (glagolski pridjevi) that turn verbs into adjectives. These forms are essential in formal writing, news media, legal texts, and academic Croatian — and they mark fluency that no textbook exercises have yet trained.',
        icon: '📖',
      },
      {
        type: 'rule',
        title: 'Verbal Nouns (Glagolske Imenice)',
        body: "Verbal nouns are formed from the verb stem + -nje or -će. They behave exactly like regular nouns (they decline through all 7 cases) but carry verbal meaning. 'Pisati' (to write) → 'pisanje' (writing, the act of writing). 'Učiti' (to learn) → 'učenje' (learning). These are neuter nouns and extremely common in formal registers.",
        highlight: 'verb stem + -nje / -će = verbal noun (neuter)',
      },
      {
        type: 'table',
        title: 'Common Verbal Noun Formations',
        headers: ['Verb', 'Verbal Noun', 'English', 'Example'],
        rows: [
          ['pisati', 'pisanje', 'writing', 'Pisanje je vještina. (Writing is a skill.)'],
          ['učiti', 'učenje', 'learning', 'Učenje jezika traje. (Language learning takes time.)'],
          ['čitati', 'čitanje', 'reading', 'Volim čitanje. (I love reading.)'],
          ['pjevati', 'pjevanje', 'singing', 'Pjevanje je terapija. (Singing is therapy.)'],
          [
            'putovati',
            'putovanje',
            'travelling',
            'Putovanje širi horizonte. (Travel broadens horizons.)',
          ],
          ['misliti', 'mišljenje', 'thinking/opinion', 'Po mom mišljenju... (In my opinion...)'],
          ['odlučiti', 'odlučivanje', 'deciding', 'Odlučivanje je teško. (Deciding is hard.)'],
        ],
      },
      {
        type: 'rule',
        title: 'Active Participle (Glagolski Pridjev Radni)',
        body: "The active participle (also called past active participle) is the form used to build the past tense in Croatian — it's the form you already know: 'pisao/pisala/pisalo' (wrote). It declines as an adjective. But it also appears independently as an adjective: 'čovjek koji je pao' can become 'pali čovjek' (the fallen man). These forms are common in news headlines.",
        highlight: 'pisao/pisala/pisalo = active participle',
      },
      {
        type: 'rule',
        title: 'Passive Participle (Glagolski Pridjev Trpni)',
        body: "The passive participle is formed from the verb stem + -n/-na/-no or -t/-ta/-to. It means 'having been done to'. 'Napisati' → 'napisan/napisana/napisano' (written). 'Otvoriti' → 'otvoren/otvorena/otvoreno' (opened). Used to form passive sentences: 'Knjiga je napisana.' (The book has been written / was written.) Critical in formal and media Croatian.",
        highlight: 'stem + -n/-t = passive participle (was/been done)',
      },
      {
        type: 'example',
        title: 'Passive Participle in Context — Listen',
        items: [
          {
            hr: 'Knjiga je napisana.',
            en: 'The book has been written.',
            note: 'napisati → napisana (fem. passive part.)',
          },
          {
            hr: 'Vrata su otvorena.',
            en: 'The doors are open(ed).',
            note: 'otvoriti → otvorena (pl. passive part.)',
          },
          {
            hr: 'Odluka je donesena.',
            en: 'The decision has been made.',
            note: 'donijeti → donesena (formal news register)',
          },
          {
            hr: 'Sporazum je potpisan.',
            en: 'The agreement has been signed.',
            note: 'potpisati → potpisan (media/legal)',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Adverbial Participle (Glagolski Prilog)',
        body: "Croatian has two adverbial participles: present (while doing) and past (having done). Present adverbial: 'idući' (while going / going, he...), 'govoreći' (while speaking). Past adverbial: 'otišavši' (having gone / after going). These are used in formal writing, replacing relative clauses. Literary but important at C1.",
        highlight: 'present: -ći (while doing) | past: -vši (having done)',
      },
      {
        type: 'example',
        title: 'Adverbial Participles — Formal Register',
        items: [
          {
            hr: 'Idući kroz grad, vidio je prijatelja.',
            en: 'While walking through the city, he saw a friend.',
            note: 'idući = present adverbial (simultaneous)',
          },
          {
            hr: 'Govoreći o tome, nasmijao se.',
            en: 'Speaking about it, he laughed.',
            note: 'govoreći = present adverbial',
          },
          {
            hr: 'Otišavši rano, stigla je prva.',
            en: 'Having left early, she arrived first.',
            note: 'otišavši = past adverbial (sequence)',
          },
        ],
      },
      {
        type: 'quiz',
        q: "What is the verbal noun of 'putovati' (to travel)?",
        options: ['putovan', 'putovajući', 'putovanje', 'putovavši'],
        correct: 2,
        explanation:
          "'Putovanje' — the verbal noun is formed by adding -nje to the infinitive stem. Putovati → putova- + -nje = putovanje (travel, travelling). It declines as a neuter noun: putovanje (nom.), putovanju (dat./loc.), putovanjem (instr.), etc.",
      },
      {
        type: 'quiz',
        q: "Formal news Croatian: 'The law was passed.' How would you say this?",
        options: [
          'Zakon je prolazio.',
          'Zakon je prošao.',
          'Zakon je prošan.',
          'Zakon je usvojen.',
        ],
        correct: 3,
        explanation:
          "'Zakon je usvojen.' — In formal/legal Croatian, 'usvojiti' (to adopt/pass [a law]) → 'usvojen' (passive participle). This is the standard media formula. 'Prošao' means passed physically through; 'prošan' is not a standard form. The passive participle 'usvojen' with 'biti' forms the standard passive voice for formal announcements.",
      },
      {
        type: 'summary',
        title: 'Verbal Nouns & Participles',
        points: [
          'Verbal nouns: verb + -nje = neuter noun (pisanje, učenje, putovanje)',
          'Active participle: pisao/pisala/pisalo — used in past tense & as adjective',
          "Passive participle: napisan/otvorena — 'was/been done to'; essential in formal Croatian",
          'Present adverbial: -ći (idući, govoreći) = simultaneous action',
          'Past adverbial: -vši (otišavši) = prior completed action',
          'All forms essential for C1 reading: news, law, academic texts',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 22: C1 — Idiomatic Croatian & Advanced Register
  // ─────────────────────────────────────────────────────────
  {
    id: 'idioms-register',
    title: 'C1: Idiomatic Croatian & Register',
    subtitle: "Proverbs, idioms, formal vs colloquial, and what you won't find in any textbook",
    icon: '🎭',
    level: 'C1',
    duration: '~7 min',
    color: '#be185d',
    bg: '#fdf2f8',
    slides: [
      {
        type: 'intro',
        title: 'The Last 10% of Fluency',
        body: 'Grammar mastery gets you to B2. What takes you to C1 and native-level comfort is knowing: which word a Croatian would actually choose, which phrases mark you as educated vs uneducated, how to shift register from a job interview to a kafić conversation, and which idioms carry cultural weight no dictionary can fully explain.',
        icon: '🎭',
      },
      {
        type: 'rule',
        title: 'Formal vs Informal Register — The Key Signals',
        body: "Croatian has clear register markers. Formal signals: vi-form (plural second person as polite address), longer verbal nouns instead of infinitives, passive voice, no contractions. Informal signals: ti-form, shortened forms ('kak si' instead of 'kako si'), dialects, diminutives everywhere (kavica, kolačić, slatko). Wrong register in the wrong context is socially jarring.",
        highlight: 'Vi (formal) vs Ti (informal) — more than just grammar',
      },
      {
        type: 'table',
        title: 'Register Shifts — The Same Idea, Two Ways',
        headers: ['Formal', 'Informal/Colloquial', 'English'],
        rows: [
          ['Kako ste?', 'Kak si? / Šta ima?', 'How are you?'],
          ['Molim Vas.', 'Molim te. / Molim.', 'Please.'],
          ['Hvala lijepa.', 'Hvala! / Fala!', 'Thank you!'],
          ['Ne razumijem.', 'Ne kapim. / Nisam skužio.', "I don't understand."],
          ['Doviđenja.', 'Ćao! / Pa, ajde!', 'Goodbye!'],
          ['Sjesti', 'Sjediti / Sjest', 'To sit (formal/colloquial)'],
          ['Pisati izvještaj', 'Sklepati izvještaj', 'To write a report (formal/slangy)'],
        ],
      },
      {
        type: 'rule',
        title: "Diminutives — Croatian's Emotional Grammar",
        body: "Croatian speakers use diminutives far more than English speakers. Almost any noun can be made smaller and warmer with suffixes (-ić, -ica, -ce). 'Kava' → 'kavica' (affectionate little coffee). 'Kolač' → 'kolačić' (cookie/little cake). Diminutives signal warmth, informality, affection — even for big things. Getting this right makes you sound genuinely Croatian.",
        highlight: '-ić, -ica, -ce = diminutive (smaller + warmer)',
      },
      {
        type: 'example',
        title: 'Croatian Idioms — With Their Logic',
        items: [
          {
            hr: 'Pala mu je mrak na oči.',
            en: 'He saw red / lost it.',
            note: "Lit: 'Darkness fell on his eyes' — rage",
          },
          {
            hr: 'Čuvaj se kao od vatre.',
            en: 'Avoid it like the plague.',
            note: "Lit: 'Guard yourself as from fire'",
          },
          {
            hr: 'Nije mu sve doma.',
            en: "He's not all there / a bit odd.",
            note: "Lit: 'Not everything is home in him'",
          },
          {
            hr: 'Baciti rukavicu.',
            en: 'To throw down the gauntlet.',
            note: "Lit: 'To throw a glove' — same as English!",
          },
          {
            hr: 'Igrati se vatrom.',
            en: 'To play with fire.',
            note: 'Same as English — fire idioms cross cultures',
          },
          {
            hr: 'Svaka čast!',
            en: 'Well done! / Respect!',
            note: "Lit: 'Every honour!' — extremely common praise",
          },
        ],
      },
      {
        type: 'rule',
        title: 'Croatian Discourse Markers',
        body: "Native speakers pepper their speech with discourse markers that signal thinking, agreement, contrast, and emphasis. These are never taught in textbooks but are instantly heard: 'znači' (so / I mean), 'dakle' (so / therefore — more formal), 'eto' (there you have it / so), 'evo' (here / look), 'pa' (well...), 'baš' (exactly / really), 'ajde' (come on / OK then).",
        highlight: 'znači, dakle, eto, baš, ajde, pa',
      },
      {
        type: 'example',
        title: 'Discourse Markers in Context — Listen',
        items: [
          {
            hr: 'Znači, ti ne znaš.',
            en: "So, you don't know then.",
            note: "znači = 'so' / drawing conclusion",
          },
          {
            hr: 'Eto, tako je.',
            en: "There you have it, that's how it is.",
            note: 'eto = presenting a conclusion',
          },
          { hr: 'Pa, nisam siguran.', en: "Well, I'm not sure.", note: "pa = hedging / 'well'" },
          {
            hr: 'Baš si u pravu.',
            en: "You're exactly right.",
            note: "baš = emphasis ('exactly', 'really')",
          },
          { hr: 'Ajde, idemo!', en: "Come on, let's go!", note: "ajde = encouragement / 'let's'" },
        ],
      },
      {
        type: 'table',
        title: '30 Essential Croatian Proverbs — Cultural Keys',
        headers: ['Croatian', 'Literal', 'English Equivalent'],
        rows: [
          ['Bolje ikad nego nikad.', 'Better sometime than never.', 'Better late than never.'],
          [
            'Tko rano rani, dvije sreće grabi.',
            'Who rises early grabs two fortunes.',
            'The early bird catches two worms.',
          ],
          [
            'Svaka ptica svojem jatu leti.',
            'Every bird flies to its own flock.',
            'Birds of a feather flock together.',
          ],
          ['Nema ruže bez trnja.', 'No rose without thorns.', 'No rose without thorns.'],
          [
            'U zdravom tijelu zdrav duh.',
            'In a healthy body, a healthy spirit.',
            'A healthy mind in a healthy body.',
          ],
          [
            'Nije zlato sve što sja.',
            'Not all that glitters is gold.',
            'All that glitters is not gold.',
          ],
          [
            'Sitna kap kamen dubi.',
            'A tiny drop hollows stone.',
            'Constant dripping wears the stone.',
          ],
        ],
      },
      {
        type: 'quiz',
        q: "A Croatian friend says 'Svaka čast!' after you ace a language test. What do they mean?",
        options: [
          'Every piece of honour — a religious blessing',
          'Well done! / Respect! — genuine praise',
          "That's a bit much — mild sarcasm",
          'You should be honoured to receive this',
        ],
        correct: 1,
        explanation:
          "'Svaka čast!' (literally 'every honour') is one of the most common expressions of genuine admiration and respect in Croatian. It's used exactly as English 'Well done!' or 'Respect!' — sincere, warm, and very frequent among friends and family.",
      },
      {
        type: 'quiz',
        q: 'Which sentence sounds more informal/colloquial?',
        options: [
          'Molim Vas, možete li mi reći gdje je kolodvor?',
          'Hej, gdje je kolodvor? Znaš li?',
          'Imate li informacije o lokaciji kolodvora?',
          'Tražim kolodvor — možete li mi pomoći?',
        ],
        correct: 1,
        explanation:
          "'Hej, gdje je kolodvor? Znaš li?' — uses 'hej' (informal greeting), ti-form 'znaš', and direct question structure. Option A uses the polite 'Vi' form. Option C is bureaucratic/formal. Option D is polite neutral. The colloquial marker is the ti-form 'znaš' and the casual opener 'Hej'.",
      },
      {
        type: 'summary',
        title: 'C1 Register & Idioms — What Makes You Sound Croatian',
        points: [
          'Vi (formal) vs Ti (informal) — know which context demands which',
          'Discourse markers: znači, eto, pa, baš, ajde — use them, sound natural',
          'Diminutives (-ić/-ica/-ce) signal warmth and informality — use generously',
          "Idioms: 'Svaka čast!' / 'Nije mu sve doma' / 'Pala mu mrak na oči'",
          '30 Croatian proverbs encode the culture — knowing 10 makes you culturally fluent',
          'Read news, watch HRT, listen to podcasts — register is learned through exposure',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON A1-X1: Greetings & Farewells
  // ─────────────────────────────────────────────────────────
  {
    id: 'greetings-farewells',
    title: 'Greetings & Farewells',
    subtitle: 'Say hello, goodbye, and ask how someone is doing',
    icon: '👋',
    level: 'A1',
    duration: '~4 min',
    color: '#059669',
    bg: '#ecfdf5',
    slides: [
      {
        type: 'intro',
        title: 'Greetings in Croatian',
        body: "Croatian greetings change based on time of day and formality. The key distinction: 'ti' (informal, one person you know) vs 'Vi' (formal or plural). Get this right from day one.",
        icon: '👋',
      },
      {
        type: 'table',
        title: 'Time-of-Day Greetings',
        headers: ['Croatian', 'English', 'Use when'],
        rows: [
          ['Dobro jutro', 'Good morning', 'Until ~11 am'],
          ['Dobar dan', 'Good day', '11 am–6 pm'],
          ['Dobra večer', 'Good evening', 'After 6 pm'],
          ['Laku noć', 'Good night', 'Parting at night'],
          ['Bog / Bok', 'Hi / Bye', 'Casual, any time'],
          ['Ćao', 'Hi / Bye (very casual)', 'Friends only'],
        ],
      },
      {
        type: 'rule',
        title: 'Asking "How Are You?"',
        body: "Use 'Kako si?' with friends (ti-form). Use 'Kako ste?' with strangers, elders, or groups (Vi-form). Both mean 'How are you?' — the ending changes, not the meaning.",
        highlight: 'Kako si? / Kako ste?',
      },
      {
        type: 'example',
        title: 'Standard Replies',
        items: [
          { hr: 'Dobro, hvala.', en: 'Good, thanks.', note: 'Most common reply' },
          { hr: 'Odlično!', en: 'Excellent!', note: 'Very positive' },
          { hr: 'Tako-tako.', en: 'So-so.', note: 'Neutral / tired' },
          { hr: 'Moglo bi i bolje.', en: 'Could be better.', note: 'Honest / slightly negative' },
          { hr: 'A ti?', en: 'And you?', note: 'Always return the question' },
        ],
      },
      {
        type: 'table',
        title: 'Farewells',
        headers: ['Croatian', 'English', 'Register'],
        rows: [
          ['Doviđenja', 'Goodbye', 'Formal / neutral'],
          ['Bog / Bok', 'Bye', 'Casual'],
          ['Ćao', 'Ciao / Bye', 'Informal — borrowed from Italian'],
          ['Vidimo se', 'See you', 'Implies you will meet again'],
          ['Čujemo se', 'Talk soon', 'Phone/text context'],
          ['Sretno!', 'Good luck!', 'Before an event'],
        ],
      },
      {
        type: 'rule',
        title: 'Introducing Yourself',
        body: "Say 'Zovem se [name].' (My name is…) or simply '[Name], drago mi je.' (Nice to meet you). 'Drago mi je' literally means 'It is pleasant to me' — use it every time you meet someone new.",
        highlight: 'Drago mi je.',
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: 'Your new teacher enters the room at 9 am. You say:',
        opts: ['Ćao!', 'Dobro jutro!', 'Laku noć!'],
        correct: 1,
        explanation:
          "'Dobro jutro' is the correct formal morning greeting. 'Ćao' is too casual for a teacher. 'Laku noć' is only used at night.",
      },
      {
        type: 'summary',
        title: 'Greetings — Key Takeaways',
        points: [
          'Dobro jutro / Dobar dan / Dobra večer — match the time of day',
          'Kako si? (informal) vs Kako ste? (formal/plural)',
          'Drago mi je — say it every time you meet someone new',
          'Doviđenja = formal goodbye; Bog/Ćao = casual',
          'Always return the question: A ti? / A Vi?',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON A1-X2: Pronouns & Biti (to be)
  // ─────────────────────────────────────────────────────────
  {
    id: 'pronouns-biti',
    title: 'Pronouns & Biti',
    subtitle: 'Master personal pronouns and the verb "to be"',
    icon: '🔵',
    level: 'A1',
    duration: '~5 min',
    color: '#2563eb',
    bg: '#eff6ff',
    slides: [
      {
        type: 'intro',
        title: 'The Building Blocks: Pronouns',
        body: "Before you can say anything in Croatian, you need pronouns. Croatian has all the same pronouns as English — but the verb 'biti' (to be) changes form for each one. Learn both together.",
        icon: '🔵',
      },
      {
        type: 'table',
        title: 'Personal Pronouns',
        headers: ['Croatian', 'English', 'Note'],
        rows: [
          ['ja', 'I', 'Often dropped — verb ending is enough'],
          ['ti', 'you (singular informal)', 'Use with friends, peers, children'],
          ['on', 'he', ''],
          ['ona', 'she', ''],
          ['ono', 'it', 'Also: gender-neutral singular'],
          ['mi', 'we', ''],
          ['vi', 'you (plural or formal sing.)', 'Capital Vi = formal politeness'],
          ['oni / one / ona', 'they (m. / f. / n.)', ''],
        ],
      },
      {
        type: 'table',
        title: 'Biti (to be) — Present Tense',
        headers: ['Pronoun', 'Full form', 'Short clitic', 'Negative'],
        rows: [
          ['ja', 'jesam', 'sam', 'nisam'],
          ['ti', 'jesi', 'si', 'nisi'],
          ['on/ona/ono', 'jest', 'je', 'nije'],
          ['mi', 'jesmo', 'smo', 'nismo'],
          ['vi', 'jeste', 'ste', 'niste'],
          ['oni/one/ona', 'jesu', 'su', 'nisu'],
        ],
      },
      {
        type: 'rule',
        title: 'Full vs Clitic (Short) Form',
        body: "The full form ('jesam') is used for emphasis or yes/no answers. The clitic ('sam') attaches to the second position in a sentence and is used in everyday speech. In practice you will hear the clitic 90% of the time.",
        highlight: 'Jesam li? vs Ja sam tu.',
      },
      {
        type: 'example',
        title: 'Biti in Action',
        items: [
          { hr: 'Ja sam student.', en: 'I am a student.', note: 'Clitic — everyday' },
          { hr: 'On je Hrvat.', en: 'He is Croatian.', note: 'Masculine nationality' },
          { hr: 'Ona nije ovdje.', en: 'She is not here.', note: 'Negation: nije' },
          { hr: 'Mi smo u Zagrebu.', en: 'We are in Zagreb.', note: 'Location' },
          { hr: 'Jeste li gladni?', en: 'Are you hungry?', note: 'Full form in question' },
        ],
      },
      {
        type: 'rule',
        title: 'Dropping Pronouns',
        body: "Croatian is a pro-drop language — pronouns are often omitted because the verb ending already tells you who is doing the action. 'Jesam Hrvat.' means 'I am Croatian' — 'ja' (I) is not needed. Add the pronoun only for contrast or emphasis.",
        highlight: 'pro-drop',
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: "How do you say 'We are not tired.' in Croatian?",
        opts: ['Mi su umorni.', 'Mi nismo umorni.', 'Mi nije umorni.'],
        correct: 1,
        explanation:
          "'Nismo' is the negative plural 'we' form of biti. 'Su' is 3rd person plural (they). 'Nije' is 3rd person singular (he/she/it).",
      },
      {
        type: 'summary',
        title: 'Pronouns & Biti — Key Takeaways',
        points: [
          '8 pronouns: ja, ti, on, ona, ono, mi, vi, oni/one/ona',
          'Biti has full forms (jesam) and short clitics (sam) — clitics are used in everyday speech',
          'Negation: nisam, nisi, nije, nismo, niste, nisu',
          'Pronouns are often dropped — the verb ending is enough',
          'Capital Vi = formal singular address',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON A1-X3: Numbers & Telling Time
  // ─────────────────────────────────────────────────────────
  {
    id: 'numbers-time',
    title: 'Numbers & Telling Time',
    subtitle: 'Count to 100 and tell the time in Croatian',
    icon: '🕐',
    level: 'A1',
    duration: '~5 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'Numbers: The Foundation of Everything',
        body: 'You need numbers for prices, addresses, phone numbers, and time. Croatian numbers 1–10 must be memorised. From 11 onwards, patterns emerge that make them much easier.',
        icon: '🕐',
      },
      {
        type: 'table',
        title: '1–20: Memorise These',
        headers: ['Number', 'Croatian', 'Number', 'Croatian'],
        rows: [
          ['1', 'jedan / jedna / jedno', '11', 'jedanaest'],
          ['2', 'dva / dvije', '12', 'dvanaest'],
          ['3', 'tri', '13', 'trinaest'],
          ['4', 'četiri', '14', 'četrnaest'],
          ['5', 'pet', '15', 'petnaest'],
          ['6', 'šest', '16', 'šesnaest'],
          ['7', 'sedam', '17', 'sedamnaest'],
          ['8', 'osam', '18', 'osamnaest'],
          ['9', 'devet', '19', 'devetnaest'],
          ['10', 'deset', '20', 'dvadeset'],
        ],
      },
      {
        type: 'rule',
        title: 'Pattern: Tens & Hundreds',
        body: "Tens: add '-deset' after the base: tri+deset = trideset (30), četr+deset = četrdeset (40). Compounds: dvadeset jedan (21), trideset pet (35). Hundreds: sto (100), dvjesta (200), tristo (300), četiristo (400), petsto (500), tisuću (1000).",
        highlight: '-deset',
      },
      {
        type: 'rule',
        title: 'Genitive with Numbers',
        body: 'Croatian numbers trigger case changes on nouns. 1 → Nominative (jedan sat). 2/3/4 → Genitive singular (dva sata). 5+ → Genitive plural (pet sati). This is one of the trickiest early patterns — just memorise the three noun forms for common words.',
        highlight: 'jedan sat / dva sata / pet sati',
      },
      {
        type: 'table',
        title: 'Telling Time — Koliko je sati?',
        headers: ['Time', 'Croatian', 'Literal meaning'],
        rows: [
          ['1:00', 'Jedan sat.', 'One hour.'],
          ['2:00', 'Dva sata.', 'Two hours.'],
          ['5:00', 'Pet sati.', 'Five hours.'],
          ['8:15', 'Osam i petnaest.', 'Eight and fifteen.'],
          ['10:30', 'Deset i trideset. / Pola jedanaest.', 'Ten thirty / Half past ten.'],
          ['11:45', 'Dvanaest bez četvrt.', 'Quarter to twelve.'],
          ['12:00', 'Podne.', 'Noon.'],
          ['00:00', 'Ponoć.', 'Midnight.'],
        ],
      },
      {
        type: 'example',
        title: 'Practical Time Phrases',
        items: [
          { hr: 'Koliko je sati?', en: 'What time is it?', note: 'The standard question' },
          { hr: 'Imate li sat?', en: 'Do you have a watch?', note: 'Alternative question' },
          { hr: 'U koliko sati?', en: 'At what time?', note: 'Asking when something happens' },
          { hr: 'U sedam sati.', en: "At seven o'clock.", note: 'Stating a time (u + Genitive)' },
          { hr: 'Kasnim pet minuta.', en: 'I am five minutes late.', note: 'Very useful phrase' },
        ],
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: "How do you say 'quarter to twelve' in Croatian?",
        opts: ['Dvanaest i četvrt.', 'Dvanaest bez četvrt.', 'Pola dvanaest.'],
        correct: 1,
        explanation:
          "'Bez četvrt' means 'without a quarter' — subtract 15 minutes from the next hour. 'I četvrt' means 'and a quarter' (quarter past). 'Pola' means 'half past'.",
      },
      {
        type: 'summary',
        title: 'Numbers & Time — Key Takeaways',
        points: [
          'Memorise 1–20; tens follow the -deset pattern',
          '1 sat, 2/3/4 sata, 5+ sati — case changes with numbers',
          'Koliko je sati? = What time is it?',
          'Pola + next hour = half past (pola jedanaest = 10:30)',
          'Bez četvrt + next hour = quarter to (bez četvrt dvanaest = 11:45)',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON A1-X4: Basic Questions
  // ─────────────────────────────────────────────────────────
  {
    id: 'basic-questions',
    title: 'Basic Questions',
    subtitle: 'Ask and answer essential everyday questions',
    icon: '❓',
    level: 'A1',
    duration: '~4 min',
    color: '#d97706',
    bg: '#fffbeb',
    slides: [
      {
        type: 'intro',
        title: 'Question Words (Upitne Riječi)',
        body: 'Croatian question words come first in the sentence, just like in English. The verb then takes the question (interrogative) form — in most cases you simply use the regular verb form but with rising intonation, or add the particle "li".',
        icon: '❓',
      },
      {
        type: 'table',
        title: 'The Core Question Words',
        headers: ['Croatian', 'English', 'Example'],
        rows: [
          ['Tko?', 'Who?', 'Tko si ti? (Who are you?)'],
          ['Što?', 'What?', 'Što radiš? (What are you doing?)'],
          ['Gdje?', 'Where?', 'Gdje živiš? (Where do you live?)'],
          ['Kada?', 'When?', 'Kada ideš? (When are you going?)'],
          ['Kako?', 'How?', 'Kako si? (How are you?)'],
          ['Zašto?', 'Why?', 'Zašto kasniš? (Why are you late?)'],
          ['Koliko?', 'How much/many?', 'Koliko košta? (How much does it cost?)'],
          ['Koji / Koja / Koje?', 'Which?', 'Koji razred? (Which class?)'],
        ],
      },
      {
        type: 'rule',
        title: 'Yes/No Questions with "Li"',
        body: "For yes/no questions, Croatian uses the particle 'li' after the verb: 'Govoriš li engleski?' (Do you speak English?). In everyday speech, rising intonation is enough and 'li' is often dropped: 'Govoriš engleski?' is equally natural.",
        highlight: 'Govoriš li engleski?',
      },
      {
        type: 'example',
        title: 'Essential Questions to Memorise',
        items: [
          {
            hr: 'Kako se zoveš?',
            en: 'What is your name? (informal)',
            note: 'Most common way to ask',
          },
          { hr: 'Odakle si?', en: 'Where are you from?', note: 'Odakle = from where' },
          {
            hr: 'Koliko imaš godina?',
            en: 'How old are you?',
            note: 'Literally: How many years do you have?',
          },
          {
            hr: 'Govoriš li hrvatski?',
            en: 'Do you speak Croatian?',
            note: 'Very useful early on',
          },
          { hr: 'Možeš li ponoviti?', en: 'Can you repeat?', note: 'Essential in class' },
          { hr: 'Što znači ...?', en: 'What does ... mean?', note: 'Use constantly when learning' },
        ],
      },
      {
        type: 'rule',
        title: 'Answering Yes and No',
        body: "'Da' = yes. 'Ne' = no. For emphasis: 'Da, naravno!' (Yes, of course!). 'Ne, hvala.' (No, thank you.) Croatian also uses 'Nije' (it isn't) and 'Nisam' (I'm not) for negating with 'biti'.",
        highlight: 'Da / Ne',
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: "How do you ask 'Where do you live?' in Croatian?",
        opts: ['Kada živiš?', 'Gdje živiš?', 'Tko živiš?'],
        correct: 1,
        explanation:
          "'Gdje' = where. 'Kada' = when. 'Tko' = who. The verb 'živiš' is the ti-form of živjeti (to live).",
      },
      {
        type: 'summary',
        title: 'Questions — Key Takeaways',
        points: [
          'Tko / Što / Gdje / Kada / Kako / Zašto / Koliko / Koji',
          'Yes/no questions: add li after the verb, or use rising intonation',
          'Kako se zoveš? — the most important question when meeting someone',
          'Što znači ...? — use this constantly while learning',
          'Da = yes / Ne = no — simple and universal',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON B1-X1: Motion Verbs — Ići, Dolaziti & Aspect
  // ─────────────────────────────────────────────────────────
  {
    id: 'motion-verbs',
    title: 'Motion Verbs',
    subtitle: 'Master ići, doći, otići and the aspect of movement',
    icon: '🚶',
    level: 'B1',
    duration: '~6 min',
    color: '#b45309',
    bg: '#fef3c7',
    slides: [
      {
        type: 'intro',
        title: 'Croatian Motion Verbs',
        body: 'Croatian has dedicated verb pairs for motion direction — the imperfective describes the act of moving, while the perfective emphasises the completed arrival or departure. Mix them up and you will confuse native speakers.',
        icon: '🚶',
      },
      {
        type: 'table',
        title: 'Core Motion Verb Pairs',
        headers: ['Imperfective', 'Perfective', 'Direction', 'Example (Impf.)'],
        rows: [
          ['ići', 'otići', 'away (going, leaving)', 'Idem kući. (I am going home.)'],
          ['dolaziti', 'doći', 'toward (coming, arriving)', 'Dolazi u 8. (He arrives at 8.)'],
          ['hodati', '—', 'walking (no direction)', 'Hodao sam sat vremena.'],
          ['trčati', 'istrčati', 'running', 'Trčim svaki dan.'],
          ['voziti', 'odvoziti', 'driving', 'Vozim auto na posao.'],
          ['letjeti', 'odletjeti', 'flying', 'Let odlijeće u podne.'],
        ],
      },
      {
        type: 'rule',
        title: 'Ići vs Otići',
        body: "'Idem' (imperfective) = I am going / I go — the act of movement is ongoing or habitual. 'Otišao sam' (perfective) = I left / I went and am now gone — the departure is completed. Use imperfective for schedules and habits; use perfective when the point is that the person is now gone.",
        highlight: 'Idem vs Otišao sam',
      },
      {
        type: 'rule',
        title: 'Dolaziti vs Doći',
        body: "'Dolazi svaki tjedan.' = He comes every week. (Habit → imperfective.) 'Došao je u 8.' = He arrived at 8. (Completed arrival → perfective.) The perfective 'doći' always stresses that arrival is the completed event.",
        highlight: 'Dolazi vs Došao je',
      },
      {
        type: 'table',
        title: 'Present Tense of Ići',
        headers: ['Person', 'Form'],
        rows: [
          ['ja', 'idem'],
          ['ti', 'ideš'],
          ['on/ona/ono', 'ide'],
          ['mi', 'idemo'],
          ['vi', 'idete'],
          ['oni/one/ona', 'idu'],
        ],
      },
      {
        type: 'example',
        title: 'Motion Verbs in Context',
        items: [
          {
            hr: 'Idem u školu.',
            en: 'I am going to school.',
            note: 'Direction expressed by Accusative after u',
          },
          {
            hr: 'Otišao je na posao.',
            en: 'He has gone to work (and left).',
            note: 'Perfective — he is gone',
          },
          {
            hr: 'Dolazi li baka sutra?',
            en: 'Is grandma coming tomorrow?',
            note: 'Future arrangement with imperfective',
          },
          {
            hr: 'Dođi ovamo!',
            en: 'Come here!',
            note: 'Perfective imperative — one completed action',
          },
          {
            hr: 'Ne idi tamo!',
            en: "Don't go there!",
            note: 'Negative imperative — imperfective preferred',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Direction Cases with Motion Verbs',
        body: "Motion verbs trigger the Accusative case: 'Idem u grad' (I am going to the city — Accusative). Static location uses Locative: 'Ja sam u gradu' (I am in the city). The same preposition 'u' changes the case depending on whether there is motion.",
        highlight: 'u + Accusative (motion) vs u + Locative (static)',
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: "'She left an hour ago.' — which verb form is correct?",
        opts: ['Ona ide.', 'Ona odlazi.', 'Ona je otišla.'],
        correct: 2,
        explanation:
          "'Otišla je' (perfective past) = she left and is now gone. 'Ide' = she is going (present, ongoing). 'Odlazi' = she is leaving / she leaves (imperfective, still in the act).",
      },
      {
        type: 'summary',
        title: 'Motion Verbs — Key Takeaways',
        points: [
          'ići (impf.) / otići (pf.) — going away; dolaziti (impf.) / doći (pf.) — coming toward',
          'Imperfective = habit, schedule, ongoing; Perfective = completed arrival or departure',
          'Idem (I am going) vs Otišao sam (I went / I have left)',
          'Motion → Accusative after u/na; Static location → Locative after u/na',
          'Negative imperative strongly prefers imperfective: Ne idi! (not Nemoj otići for a general command)',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON B2-X1: Passive Voice
  // ─────────────────────────────────────────────────────────
  {
    id: 'passive-voice',
    title: 'Passive Voice',
    subtitle: 'Master the passive in formal and written Croatian',
    icon: '📝',
    level: 'B2',
    duration: '~6 min',
    color: '#0369a1',
    bg: '#f0f9ff',
    slides: [
      {
        type: 'intro',
        title: 'Why Passive Voice Matters at B2',
        body: 'The passive voice is common in news articles, official documents, academic writing, and formal speech. At B2 you need to understand it fluently and use it correctly when writing formally. Croatian has two main passive strategies.',
        icon: '📝',
      },
      {
        type: 'rule',
        title: 'Strategy 1: Biti + Past Passive Participle',
        body: "Form the passive with 'biti' (to be) + the past passive participle (trpni pridjev). The participle agrees with the grammatical subject in gender and number. This is the most explicit passive and is typical of formal/written Croatian.",
        highlight: 'biti + trpni pridjev',
      },
      {
        type: 'table',
        title: 'Past Passive Participle Formation',
        headers: ['Verb', 'Infinitive stem', 'Participle (m./f./n./pl.)', 'Meaning'],
        rows: [
          ['pisati', 'pisa-', 'pisan / pisana / pisano / pisani', 'written'],
          ['graditi', 'gradi-', 'građen / građena / građeno / građeni', 'built'],
          ['otvoriti', 'otvori-', 'otvoren / otvorena / otvoreno / otvoreni', 'opened'],
          ['vidjeti', 'viđ-', 'viđen / viđena / viđeno / viđeni', 'seen'],
          [
            'napraviti',
            'napravi-',
            'napravljen / napravljena / napravljeno / napravljeni',
            'made/done',
          ],
          ['zaključati', 'zaključa-', 'zaključan / zaključana / zaključano / zaključani', 'locked'],
        ],
      },
      {
        type: 'example',
        title: 'Biti Passive — Examples',
        items: [
          {
            hr: 'Roman je napisan 1925.',
            en: 'The novel was written in 1925.',
            note: 'Masc. sing. — napisan',
          },
          {
            hr: 'Kuća je sagrađena od kamena.',
            en: 'The house was built of stone.',
            note: 'Fem. sing. — sagrađena',
          },
          { hr: 'Vrata su otvorena.', en: 'The doors are open(ed).', note: 'Plural — otvorena' },
          {
            hr: 'Pismo je pisano s ljubavlju.',
            en: 'The letter was written with love.',
            note: 'Neuter — pisano',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Strategy 2: Se-Passive (Reflexive Passive)',
        body: "Add the reflexive particle 'se' to an active verb: 'Ovdje se govori engleski.' (English is spoken here.) This construction is very common in everyday speech. It avoids naming an agent and is more natural than the biti-passive in conversation.",
        highlight: 'se + verb',
      },
      {
        type: 'example',
        title: 'Se-Passive — Examples',
        items: [
          {
            hr: 'Ovdje se govori engleski.',
            en: 'English is spoken here.',
            note: '3rd sg. — no agent named',
          },
          {
            hr: 'Stan se iznajmljuje.',
            en: 'The apartment is for rent.',
            note: 'Very common in ads',
          },
          { hr: 'Vino se pije ohlađeno.', en: 'Wine is drunk chilled.', note: 'General truth' },
          {
            hr: 'Prodaju se stanovi.',
            en: 'Apartments are being sold.',
            note: '3rd pl. — subject after verb',
          },
        ],
      },
      {
        type: 'rule',
        title: 'Expressing the Agent (by whom)',
        body: "To say who performs the action, use 'od' + Genitive for people: 'Knjiga je napisana od poznatog pisca.' (The book was written by a famous author.) For instruments use 'pomoću' + Genitive: 'Napravljen je pomoću novih alata.' (Made with new tools.)",
        highlight: 'od + Genitiv (agent)',
      },
      {
        type: 'table',
        title: 'Biti Passive vs Se-Passive',
        headers: ['Feature', 'Biti passive', 'Se-passive'],
        rows: [
          ['Style', 'Formal / written', 'Conversational / everyday'],
          ['Agent', 'Can name with od + Gen', 'Never names agent'],
          ['Tense', 'All tenses possible', 'Most natural in present'],
          ['Example', 'Auto je popravljen.', 'Auto se popravio.'],
        ],
      },
      {
        type: 'quiz',
        title: 'Quick Check',
        q: "Which is the correct passive form of 'Gradili su most.' (They were building the bridge.)?",
        opts: ['Most gradio je.', 'Most je bio građen.', 'Gradeći most.'],
        correct: 1,
        explanation:
          "'Most je bio građen.' = The bridge was being built — biti (bio) + past passive participle (građen), agreeing with 'most' (masculine singular). The other options are not grammatical passive constructions.",
      },
      {
        type: 'summary',
        title: 'Passive Voice — Key Takeaways',
        points: [
          'Two strategies: biti + trpni pridjev (formal) and se + verb (conversational)',
          'Trpni pridjev agrees with the subject in gender and number: pisan/pisana/pisano/pisani',
          'Agent expressed with od + Genitive: od poznatog pisca (by a well-known author)',
          'Se-passive never names an agent — very common in notices and everyday speech',
          'Use biti-passive in academic/formal writing; use se-passive in speech and ads',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────
  // LESSON: Time & Calendar
  // ─────────────────────────────────────────────────────────
  {
    id: 'time-calendar',
    title: 'Time & Calendar',
    subtitle: 'Tell time, say dates, and talk about when things happen',
    icon: '🕐',
    level: 'A1',
    duration: '~8 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    slides: [
      {
        type: 'intro',
        title: 'Time & Calendar in Croatian',
        body: 'Knowing how to talk about time is essential from day one. In Croatian, you ask "Koliko je sati?" (What time is it?) and use a simple number system for hours and minutes. Days and months are not capitalized in Croatian.',
        icon: '🕐',
      },
      {
        type: 'rule',
        title: 'Asking & Telling the Time',
        body: 'To ask the time: "Koliko je sati?" (lit. How many is hours?). To answer, use the number + "sati" (hours): "Dva su sata" (It is 2 o\'clock), "Pet je sati" (It is 5 o\'clock). Note: 1 o\'clock is "Jedan sat", 2-4 use "sata", 5+ use "sati" — the same noun case rule applies to all counting in Croatian.',
        highlight: 'Koliko je sati?',
      },
      {
        type: 'table',
        title: 'Telling the Time — Examples',
        headers: ['Time', 'Croatian', 'Literal Meaning'],
        rows: [
          ['1:00', 'Jedan sat', 'One hour'],
          ['2:00', 'Dva su sata', 'Two are hours'],
          ['5:00', 'Pet je sati', 'Five is hours'],
          ['12:00', 'Dvanaest je sati', 'Twelve is hours'],
          ['3:30', 'Tri i pol', 'Three and a half'],
          ['6:15', 'Šest i četvrt', 'Six and a quarter'],
          ['8:45', 'Tri četvrt do devet', 'Three quarters to nine'],
        ],
      },
      {
        type: 'example',
        title: 'Time Expressions — Listen',
        items: [
          { hr: 'Koliko je sati?', en: 'What time is it?', note: 'The essential question' },
          { hr: 'Pet je sati.', en: "It is five o'clock.", note: '5+ hours → sati' },
          { hr: 'Dva su sata.', en: "It is two o'clock.", note: '2-4 hours → sata' },
          { hr: 'Tri i pol.', en: 'Half past three.', note: 'pol = half' },
          { hr: 'Četvrt do osam.', en: 'A quarter to eight.', note: 'do = to/until' },
        ],
      },
      {
        type: 'rule',
        title: 'Days of the Week',
        body: 'Days of the week are NOT capitalized in Croatian. They are: ponedjeljak (Monday), utorak (Tuesday), srijeda (Wednesday), četvrtak (Thursday), petak (Friday), subota (Saturday), nedjelja (Sunday). The week starts on Monday in Croatia. "Danas je..." = Today is... "Sutra je..." = Tomorrow is...',
        highlight: 'not capitalized',
      },
      {
        type: 'table',
        title: 'Days of the Week',
        headers: ['Croatian', 'English', 'Origin / Memory Aid'],
        rows: [
          ['ponedjeljak', 'Monday', 'after Sunday (nedjelja)'],
          ['utorak', 'Tuesday', 'second (drugi)'],
          ['srijeda', 'Wednesday', 'middle (sredina) of the week'],
          ['četvrtak', 'Thursday', 'fourth (četvrti) day'],
          ['petak', 'Friday', 'fifth (peti) day'],
          ['subota', 'Saturday', 'from Hebrew Shabbat'],
          ['nedjelja', 'Sunday', 'no work (ne + djelo)'],
        ],
      },
      {
        type: 'rule',
        title: 'Months of the Year',
        body: 'Months are also NOT capitalized in Croatian. Croatian uses Slavic month names — not the Latin/international ones. These names reflect nature and agriculture: siječanj (January, from "sjeći" = to cut), veljača (February), ožujak (March, from "orah" = walnut), travanj (April, from "trava" = grass), svibanj (May), lipanj (June, from "lipa" = linden), srpanj (July, from "srp" = sickle), kolovoz (August, lit. wheel-rut), rujan (September, from "rujati" = to roar), listopad (October, from "list" = leaf, "pad" = fall), studeni (November, from "studen" = cold), prosinac (December).',
        highlight: 'Slavic month names',
      },
      {
        type: 'table',
        title: 'Months of the Year',
        headers: ['Croatian', 'English', 'Meaning / Root'],
        rows: [
          ['siječanj', 'January', 'to cut (wood in winter)'],
          ['veljača', 'February', 'great/mighty (veljik)'],
          ['ožujak', 'March', 'walnut (orah)'],
          ['travanj', 'April', 'grass (trava)'],
          ['svibanj', 'May', 'may tree (sviba)'],
          ['lipanj', 'June', 'linden tree (lipa)'],
          ['srpanj', 'July', 'sickle (srp)'],
          ['kolovoz', 'August', 'wheel-rut (kolo+voz)'],
          ['rujan', 'September', 'to roar (rujati)'],
          ['listopad', 'October', 'leaf-fall (list+pad)'],
          ['studeni', 'November', 'cold (studen)'],
          ['prosinac', 'December', 'millet (proso)'],
        ],
      },
      {
        type: 'rule',
        title: 'Time Adverbs You Must Know',
        body: 'These time adverbs appear in everyday speech constantly. Memorize them: danas (today), jučer (yesterday), sutra (tomorrow), jutros (this morning), večeras (this evening), noćas (tonight), sada / sad (now), odmah (immediately), uvijek (always), nikad (never), često (often), ponekad (sometimes), rijetko (rarely).',
        highlight: 'danas / jučer / sutra',
      },
      {
        type: 'example',
        title: 'Time Adverbs in Sentences',
        items: [
          {
            hr: 'Danas imam sat jezika.',
            en: 'Today I have a language lesson.',
            note: 'danas = today',
          },
          {
            hr: 'Jučer sam bio u gradu.',
            en: 'Yesterday I was in the city.',
            note: 'jučer = yesterday',
          },
          {
            hr: 'Sutra idemo na more.',
            en: 'Tomorrow we are going to the sea.',
            note: 'sutra = tomorrow',
          },
          {
            hr: 'Uvijek pijem kavu ujutro.',
            en: 'I always drink coffee in the morning.',
            note: 'ujutro = in the morning (habitual)',
          },
          { hr: 'Nikad ne kasnim.', en: 'I am never late.', note: 'nikad = never' },
        ],
      },
      {
        type: 'quiz',
        q: 'How do you say "What time is it?" in Croatian?',
        options: ['Što je vremena?', 'Koliko je sati?', 'Kada je sat?', 'Koji je dan?'],
        correct: 1,
        explanation:
          '"Koliko je sati?" literally means "How many is hours?" — it is the standard way to ask the time in Croatian. "Što je vremena?" does not exist; "Koji je dan?" means "What day is it?"',
      },
      {
        type: 'quiz',
        q: 'Which Croatian month name means "leaf-fall"?',
        options: ['rujan', 'studeni', 'listopad', 'srpanj'],
        correct: 2,
        explanation:
          '"Listopad" = October. It combines "list" (leaf) + "pad" (fall). Croatian uses these evocative Slavic month names instead of the Latin-based names used in most European languages.',
      },
      {
        type: 'quiz',
        q: 'What does "sutra" mean?',
        options: ['yesterday', 'now', 'tomorrow', 'today'],
        correct: 2,
        explanation:
          '"Sutra" = tomorrow. The full trio to memorize: jučer (yesterday) — danas (today) — sutra (tomorrow). These are among the most frequently used time adverbs in Croatian.',
      },
      {
        type: 'summary',
        title: 'Time & Calendar — Complete!',
        points: [
          '"Koliko je sati?" = What time is it?',
          '1 sat, 2-4 sata, 5+ sati — counting rule applies',
          'Days and months are NOT capitalized in Croatian',
          'Croatian months have Slavic names based on nature',
          'Key adverbs: danas / jučer / sutra / jutros / večeras',
        ],
      },
    ],
  },
];
