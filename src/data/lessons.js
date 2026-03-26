// ═══════════════════════════════════════════════════════════
// Animated Grammar Lesson Scripts — Naša Hrvatska
// Pre-written lesson content for the AnimatedLesson player
// ═══════════════════════════════════════════════════════════

export const LESSONS = [
  // ─────────────────────────────────────────────────────────
  // LESSON 1: Croatian Alphabet & Pronunciation
  // ─────────────────────────────────────────────────────────
  {
    id: "alphabet",
    title: "Croatian Alphabet & Pronunciation",
    subtitle: "Master all 30 letters, special characters, and digraphs",
    icon: "🔤",
    level: "A1",
    duration: "~5 min",
    color: "#0891b2",
    bg: "#ecfeff",
    slides: [
      {
        type: "intro",
        title: "Croatian Alphabet",
        body: "Croatian uses the Latin alphabet with 30 letters. The great news: Croatian is almost perfectly phonetic — every letter always makes the same sound. Once you learn the letters, you can read anything.",
        icon: "🔤",
      },
      {
        type: "rule",
        title: "The 30-Letter Alphabet",
        body: "Croatian has 30 letters: A B C Č Ć D Dž Đ E F G H I J K L Lj M N Nj O P R S Š T U V Z Ž. The digraphs Dž, Lj, and Nj each count as a single letter. There is no Q, W, X, or Y in native Croatian words.",
        highlight: "phonetic",
      },
      {
        type: "table",
        title: "Special Characters",
        headers: ["Letter", "Sound", "Like in English", "Example Word"],
        rows: [
          ["Č č", "/tʃ/", "ch as in church", "čaj (tea)"],
          ["Ć ć", "/tɕ/", "softer ch — between ch and ty", "ćao (bye)"],
          ["Đ đ", "/dʑ/", "j as in jump (soft)", "đon (sole of shoe)"],
          ["Š š", "/ʃ/", "sh as in ship", "šuma (forest)"],
          ["Ž ž", "/ʒ/", "s as in treasure", "život (life)"],
          ["Lj lj", "/ʎ/", "ly as in million", "ljubav (love)"],
          ["Nj nj", "/ɲ/", "ny as in canyon", "njiva (field)"],
          ["Dž dž", "/dʒ/", "j as in judge (hard)", "džem (jam)"],
        ],
      },
      {
        type: "rule",
        title: "The Rolled-R and the Vowel R",
        body: "In Croatian, R is always rolled (trilled). More unusually, R can act as a vowel — forming the nucleus of a syllable with no adjacent vowel. The word 'prst' (finger) has no written vowel at all, yet R carries the syllable.",
        highlight: "prst",
      },
      {
        type: "example",
        title: "R as a Vowel — Listen",
        items: [
          { hr: "prst", en: "finger", note: "R is the only vowel" },
          { hr: "crv", en: "worm", note: "R carries the syllable" },
          { hr: "trg", en: "square / market", note: "R between consonants" },
          { hr: "Krk", en: "Krk (island)", note: "Famous Croatian island — pure consonants!" },
        ],
      },
      {
        type: "rule",
        title: "Č vs Ć — The Classic Challenge",
        body: "Č (hard) and Ć (soft) are the most confusing pair for learners. Č sounds like 'ch' in 'church' — the tongue is against the hard palate. Ć is softer — the tongue is positioned further forward, near the teeth ridge, producing a 'ty'-like sound (think the English 'tune' said quickly as 'tyoon'). Native speakers always distinguish them.",
        highlight: "Č vs Ć",
      },
      {
        type: "example",
        title: "Minimal Pairs — Hear the Difference",
        items: [
          { hr: "čaj", en: "tea", note: "Hard č — like church" },
          { hr: "ćao", en: "bye (informal)", note: "Soft ć — softer than č" },
          { hr: "džem", en: "jam", note: "Hard dž — like judge" },
          { hr: "đon", en: "sole (of a shoe)", note: "Soft đ — softer than dž" },
          { hr: "šuma", en: "forest", note: "š = sh as in ship" },
          { hr: "život", en: "life", note: "ž = s as in treasure" },
        ],
      },
      {
        type: "rule",
        title: "Key Pronunciation Rules",
        body: "1. Every letter is always pronounced — no silent letters. 2. Stress is free but tends to fall on the first or second syllable. 3. Vowels are pure and never diphthongs. 4. C = 'ts' as in 'cats', not 'k'. 5. J = 'y' as in 'yes', never 'j' as in 'jam'.",
        highlight: "no silent letters",
      },
      {
        type: "example",
        title: "Common Words — Full Pronunciation",
        items: [
          { hr: "hvala", en: "thank you", note: "h is breathy; v-a-l-a — 4 clear sounds" },
          { hr: "molim", en: "please / you're welcome", note: "m-o-l-i-m — each letter pronounced" },
          { hr: "dobar dan", en: "good day", note: "d-o-b-a-r d-a-n — no silent letters" },
          { hr: "jutro", en: "morning", note: "j = 'y'; u-t-r-o" },
        ],
      },
      {
        type: "quiz",
        q: "The Croatian letter J is pronounced like which English sound?",
        options: ["j as in jump", "y as in yes", "zh as in treasure", "h as in hat"],
        correct: 1,
        explanation: "Croatian J always sounds like 'y' in 'yes'. The word 'ja' (I) sounds like 'ya'. This trips up English speakers who expect J to sound like 'jump'.",
      },
      {
        type: "quiz",
        q: "Which word uses R as a vowel (syllabic R)?",
        options: ["ljubav", "prst", "čaj", "more"],
        correct: 1,
        explanation: "'Prst' (finger) has no written vowel — R serves as the syllable nucleus. This is one of Croatian's most distinctive features, also found in Czech and Slovak.",
      },
      {
        type: "summary",
        title: "Croatian Alphabet — Complete!",
        points: [
          "Croatian has 30 letters — 3 digraphs (Lj, Nj, Dž) count as single letters",
          "It is perfectly phonetic: one letter = one sound, always",
          "The hardest pairs: Č (hard) vs Ć (soft), Dž (hard) vs Đ (soft)",
          "R can be a vowel — prst (finger), trg (square), Krk (island)",
          "J = 'y' as in yes; C = 'ts' as in cats; H = breathy as in loch",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 2: Noun Gender
  // ─────────────────────────────────────────────────────────
  {
    id: "gender",
    title: "Noun Gender",
    subtitle: "Learn masculine, feminine, and neuter nouns",
    icon: "⚖️",
    level: "A1",
    duration: "~5 min",
    color: "#16a34a",
    bg: "#f0fdf4",
    slides: [
      {
        type: "intro",
        title: "Noun Gender in Croatian",
        body: "Every Croatian noun has a grammatical gender: masculine, feminine, or neuter. Gender controls how adjectives, pronouns, and verbs agree with the noun. The good news: the ending of most nouns tells you the gender immediately.",
        icon: "⚖️",
      },
      {
        type: "rule",
        title: "Rule 1 — Feminine Nouns",
        body: "Most nouns ending in -A are feminine. This is the most reliable rule in Croatian grammar. Almost every noun ending in -a is feminine, regardless of biological sex. Exceptions exist for male names and a few loanwords.",
        highlight: "-A = feminine",
      },
      {
        type: "rule",
        title: "Rule 2 — Neuter Nouns",
        body: "Nouns ending in -O or -E are neuter. This is also very reliable. Neuter nouns behave differently from masculine and feminine nouns in all cases.",
        highlight: "-O / -E = neuter",
      },
      {
        type: "rule",
        title: "Rule 3 — Masculine Nouns",
        body: "Nouns ending in a consonant are masculine. This is the default category. Note: some masculine nouns end in -o (loanwords like 'auto', 'radio') and a few neuter nouns end in a consonant — but these are rare exceptions.",
        highlight: "consonant = masculine",
      },
      {
        type: "table",
        title: "Gender Endings at a Glance",
        headers: ["Gender", "Typical Endings", "Examples"],
        rows: [
          ["Masculine", "consonant, -o (loanwords)", "stol (table), brat (brother), auto (car)"],
          ["Feminine", "-a", "žena (woman), knjiga (book), ruka (hand)"],
          ["Neuter", "-o, -e", "selo (village), more (sea), dijete (child)"],
        ],
      },
      {
        type: "rule",
        title: "Natural Gender Exceptions",
        body: "Biological sex can override grammatical gender. Male names ending in -a are masculine despite the -a ending: Luka, Nikola, Matija all take masculine adjective agreement (mali Luka — little Luka). Occupational words ending in -a like 'kolega' (colleague) and 'vojvoda' (duke/warlord) can refer to males and take masculine agreement in practice: 'dobar kolega' (good colleague, male).",
        highlight: "biological sex overrides",
      },
      {
        type: "rule",
        title: "Adjective Agreement",
        body: "Adjectives must agree with the noun in gender, number, and case. A big table: veliki stol (masc). A big book: velika knjiga (fem). A big village: veliko selo (neut). The adjective changes its ending to match the noun.",
        highlight: "adjectives must agree",
      },
      {
        type: "example",
        title: "Gender in Sentences",
        items: [
          { hr: "Gdje je stol?", en: "Where is the table?", note: "stol = masculine (ends in consonant)" },
          { hr: "Knjiga je na stolu.", en: "The book is on the table.", note: "knjiga = feminine (ends in -a)" },
          { hr: "More je lijepo.", en: "The sea is beautiful.", note: "more = neuter (ends in -e)" },
          { hr: "Grad je velik.", en: "The city is big.", note: "grad = masculine (ends in consonant)" },
          { hr: "Soba je mala.", en: "The room is small.", note: "soba = feminine (ends in -a)" },
        ],
      },
      {
        type: "example",
        title: "Adjective Agreement — Watch It Change",
        items: [
          { hr: "veliki brat", en: "big brother", note: "veliki = masc. adj. form" },
          { hr: "velika sestra", en: "big sister", note: "velika = fem. adj. form" },
          { hr: "veliko dijete", en: "big child", note: "veliko = neut. adj. form" },
        ],
      },
      {
        type: "quiz",
        q: "What gender is the noun 'planina' (mountain)?",
        options: ["Masculine", "Feminine", "Neuter", "Cannot tell"],
        correct: 1,
        explanation: "'Planina' ends in -a, so it is feminine. This is the most reliable rule: almost all nouns ending in -a are feminine in Croatian.",
      },
      {
        type: "quiz",
        q: "Which ending indicates a neuter noun?",
        options: ["-a", "consonant", "-o or -e", "-i"],
        correct: 2,
        explanation: "Neuter nouns end in -o (like 'selo', village) or -e (like 'more', sea). Nouns ending in -a are feminine, and consonant endings indicate masculine.",
      },
      {
        type: "summary",
        title: "Noun Gender — Complete!",
        points: [
          "Three genders: masculine, feminine, neuter",
          "Ending -A = feminine (knjiga, žena, soba)",
          "Ending -O or -E = neuter (selo, more, dijete)",
          "Consonant ending = masculine (stol, brat, grad)",
          "Adjectives must match the noun's gender — the ending changes",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 3: Present Tense Conjugation
  // ─────────────────────────────────────────────────────────
  {
    id: "present",
    title: "Present Tense Conjugation",
    subtitle: "Three verb classes plus essential irregular verbs",
    icon: "🔄",
    level: "A2",
    duration: "~6 min",
    color: "#7c3aed",
    bg: "#faf5ff",
    slides: [
      {
        type: "intro",
        title: "Present Tense in Croatian",
        body: "Croatian verbs conjugate for person (1st, 2nd, 3rd) and number (singular, plural). There are three main conjugation classes, each with a characteristic ending pattern. Learn these three patterns and you can conjugate hundreds of verbs.",
        icon: "🔄",
      },
      {
        type: "rule",
        title: "Subject Pronouns",
        body: "In Croatian, subject pronouns (ja, ti, on/ona/ono...) are often dropped because the verb ending itself shows who is performing the action. You say 'Govorim' (I speak) without needing 'ja'. Pronouns are added for emphasis or contrast.",
        highlight: "pronouns are optional",
      },
      {
        type: "table",
        title: "Subject Pronouns",
        headers: ["Person", "Singular", "Plural"],
        rows: [
          ["1st", "ja (I)", "mi (we)"],
          ["2nd", "ti (you)", "vi (you all / formal you)"],
          ["3rd", "on/ona/ono (he/she/it)", "oni/one/ona (they)"],
        ],
      },
      {
        type: "rule",
        title: "Three Conjugation Classes",
        body: "Class 1 (-AM pattern): infinitives often ending in -ati → gledam, gledaš... Class 2 (-IM pattern): infinitives often ending in -iti, -ati → govorim, govoriš... Class 3 (-EM pattern): infinitives often ending in -ati, -eti, -uti → pišem, pišeš... The infinitive ending doesn't always predict the class — you must learn each verb's class.",
        highlight: "three classes",
      },
      {
        type: "table",
        title: "Class 1 (-AM) — gledati (to watch)",
        headers: ["Person", "Singular", "Plural"],
        rows: [
          ["1st", "gledam", "gledamo"],
          ["2nd", "gledaš", "gledate"],
          ["3rd", "gleda", "gledaju"],
        ],
      },
      {
        type: "table",
        title: "Class 2 (-IM) — govoriti (to speak)",
        headers: ["Person", "Singular", "Plural"],
        rows: [
          ["1st", "govorim", "govorimo"],
          ["2nd", "govoriš", "govorite"],
          ["3rd", "govori", "govore"],
        ],
      },
      {
        type: "table",
        title: "Class 3 (-EM) — pisati (to write)",
        headers: ["Person", "Singular", "Plural"],
        rows: [
          ["1st", "pišem", "pišemo"],
          ["2nd", "pišeš", "pišete"],
          ["3rd", "piše", "pišu"],
        ],
      },
      {
        type: "table",
        title: "Irregular — biti (to be)",
        headers: ["Person", "Singular", "Plural"],
        rows: [
          ["1st", "jesam / sam", "jesmo / smo"],
          ["2nd", "jesi / si", "jeste / ste"],
          ["3rd", "jest / je", "jesu / su"],
        ],
      },
      {
        type: "rule",
        title: "Other Key Irregular Verbs",
        body: "Imati (to have): imam, imaš, ima, imamo, imate, imaju. Ići (to go): idem, ideš, ide, idemo, idete, idu. Htjeti (to want/will): hoću/ću, hoćeš/ćeš, hoće/će, hoćemo/ćemo, hoćete/ćete, hoće/će. These are used constantly — memorise them first.",
        highlight: "imati · ići · htjeti",
      },
      {
        type: "example",
        title: "Present Tense in Action",
        items: [
          { hr: "Govorim hrvatski svaki dan.", en: "I speak Croatian every day.", note: "Class 2: govoriti → govorim" },
          { hr: "Ona gleda film.", en: "She is watching a film.", note: "Class 1: gledati → gleda" },
          { hr: "Idemo na plažu.", en: "We are going to the beach.", note: "Irregular: ići → idemo" },
          { hr: "Imam pitanje.", en: "I have a question.", note: "Irregular: imati → imam" },
          { hr: "Što piše u knjizi?", en: "What is written in the book?", note: "Class 3: pisati → piše" },
        ],
      },
      {
        type: "quiz",
        q: "How do you say 'She speaks' using govoriti (Class 2)?",
        options: ["govora", "govorim", "govori", "govorite"],
        correct: 2,
        explanation: "Class 2 (-IM) 3rd person singular is formed by dropping the -im ending and adding -i. Govoriti → govori (she/he/it speaks). The pattern is: govorim, govoriš, govori, govorimo, govorite, govore.",
      },
      {
        type: "summary",
        title: "Present Tense — Complete!",
        points: [
          "Three conjugation classes: -AM (gledati), -IM (govoriti), -EM (pisati)",
          "Subject pronouns (ja, ti, on...) are usually dropped — the verb ending is enough",
          "Key irregulars: biti (to be), imati (to have), ići (to go), htjeti (to want)",
          "biti has both long (jesam) and short (sam) forms — short forms are clitics",
          "Learn each verb's class when you first encounter it",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 4: The 7 Cases (Padeži Overview)
  // ─────────────────────────────────────────────────────────
  {
    id: "cases",
    title: "The 7 Cases (Padeži)",
    subtitle: "How and why Croatian changes noun endings",
    icon: "🏛️",
    level: "B1",
    duration: "~7 min",
    color: "#b45309",
    bg: "#fffbeb",
    slides: [
      {
        type: "intro",
        title: "Croatian Has 7 Cases",
        body: "In Croatian, nouns, pronouns, and adjectives change their endings depending on their role in the sentence. These different forms are called cases (padeži). Instead of using separate words like 'of', 'to', 'by', Croatian changes the noun's ending. It sounds daunting — but once you understand the logic, it becomes elegant.",
        icon: "🏛️",
      },
      {
        type: "rule",
        title: "What Cases Do",
        body: "Cases replace prepositions and word order to show meaning. 'I see the man' vs 'The man sees me' — in Croatian this is shown by changing 'čovjek' (man) to 'čovjeka'. You cannot move words around freely without changing meaning; instead, you change the noun's form.",
        highlight: "endings show meaning",
      },
      {
        type: "table",
        title: "The 7 Cases — Overview",
        headers: ["Case", "Croatian", "Answers", "Example"],
        rows: [
          ["Nominative", "Nominativ", "Who/What? (subject)", "Stol je velik. (The table is big.)"],
          ["Accusative", "Akuzativ", "Whom/What? (direct object)", "Vidim stol. (I see the table.)"],
          ["Genitive", "Genitiv", "Of whom/what? (possession, absence)", "Nema stola. (There is no table.)"],
          ["Dative", "Dativ", "To/for whom?", "Dajem Ani. (I give to Ana.)"],
          ["Locative", "Lokativ", "About/at/in (location, topic)", "Govori o stolu. (He speaks about the table.)"],
          ["Instrumental", "Instrumental", "With/by means of", "Piše olovkom. (He writes with a pen.)"],
          ["Vocative", "Vokativ", "Direct address", "Stole moj! (My table! — archaic/poetic)"],
        ],
      },
      {
        type: "rule",
        title: "Nominative — The Subject Case",
        body: "The nominative is the base form — what you find in dictionaries. It marks the subject of the sentence: the one doing the action. Stol je velik (The table is big). Žena čita (The woman reads). Adjectives in nominative: veliki (masc), velika (fem), veliko (neut).",
        highlight: "Nominative = subject, dictionary form",
      },
      {
        type: "rule",
        title: "Accusative — The Object Case",
        body: "The accusative marks the direct object — the thing being acted upon. Vidim stol (I see the table — stol doesn't change, it's inanimate masculine). But animate masculine nouns DO change: Vidim muškarca (I see a man — muškarac → muškarca). Also used after motion verbs with 'u' and 'na'.",
        highlight: "Accusative = direct object",
      },
      {
        type: "rule",
        title: "Genitive — Possession and Negation",
        body: "The genitive shows possession ('of'), quantity, and negation. Nema kruha (There is no bread). Auto mog brata (My brother's car). After nema (there is no), all nouns go into genitive. Also used after numbers 2-4 (genitive singular) and 5+ (genitive plural).",
        highlight: "Genitive = of, nema + genitive",
      },
      {
        type: "rule",
        title: "Locative — Always With a Preposition",
        body: "The locative ALWAYS requires a preposition — it never appears alone. Common prepositions: u (in), na (on/at), o (about), pri (at/near). Živim u Zagrebu (I live in Zagreb). Govori o knjizi (She speaks about the book). Key contrast: u Zagreb (accusative, going TO) vs u Zagrebu (locative, IN).",
        highlight: "always needs a preposition",
      },
      {
        type: "example",
        title: "Cases in Real Sentences",
        items: [
          { hr: "Vidim muškarca.", en: "I see a man.", note: "Accusative: muškarac → muškarca (masc. animate)" },
          { hr: "Nema kruha.", en: "There is no bread.", note: "Genitive negation: kruh → kruha" },
          { hr: "Idem u Zagreb.", en: "I am going to Zagreb.", note: "Accusative after 'u' (motion toward)" },
          { hr: "Živim u Zagrebu.", en: "I live in Zagreb.", note: "Locative after 'u' (static location)" },
          { hr: "Dajem knjizi.", en: "I give to the book.", note: "Dative: knjiga → knjizi" },
          { hr: "Pišem olovkom.", en: "I write with a pencil.", note: "Instrumental: olovka → olovkom" },
        ],
      },
      {
        type: "rule",
        title: "The u Zagreb / u Zagrebu Contrast",
        body: "This pair is the most important case contrast for beginners. MOTION uses accusative: Idem u Zagreb (I'm going to Zagreb). LOCATION uses locative: Živim u Zagrebu (I live in Zagreb). The same preposition 'u' triggers different cases depending on whether there is movement involved.",
        highlight: "motion = accusative, location = locative",
      },
      {
        type: "quiz",
        q: "Which case do you use after 'nema' (there is no)?",
        options: ["Nominative", "Accusative", "Genitive", "Locative"],
        correct: 2,
        explanation: "'Nema' (there is no) always triggers the genitive case. 'Nema kruha' = there is no bread (kruh → kruha). 'Nema vremena' = there is no time (vrijeme → vremena). This is one of the most useful rules to memorise first.",
      },
      {
        type: "summary",
        title: "The 7 Cases — Complete!",
        points: [
          "Nominative = subject (dictionary form) — Stol je velik",
          "Accusative = direct object, motion toward — Vidim stol / Idem u Zagreb",
          "Genitive = possession, negation — Nema kruha / auto mog brata",
          "Locative = static location/topic, always with a preposition — Živim u Zagrebu",
          "The u/na contrast: accusative for motion, locative for being there",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 5: Verb Aspect
  // ─────────────────────────────────────────────────────────
  {
    id: "aspect",
    title: "Verb Aspect",
    subtitle: "The most important concept in Croatian grammar",
    icon: "⏳",
    level: "B1",
    duration: "~7 min",
    color: "#0f766e",
    bg: "#f0fdfa",
    slides: [
      {
        type: "intro",
        title: "Verb Aspect — The Most Important Croatian Concept",
        body: "Almost every Croatian verb comes in two versions: imperfective (describes process, duration, habit) and perfective (describes completion, result). This is called verb aspect (glagolski vid). There is no direct equivalent in English — English uses tense to hint at aspect, but Croatian makes it mandatory and explicit.",
        icon: "⏳",
      },
      {
        type: "rule",
        title: "What Aspect Means",
        body: "Imperfective aspect focuses on the action itself — the process, the duration, the repetition. Perfective aspect focuses on the completion — the result, the moment it finished. You must choose every time you use a verb. There is no neutral option.",
        highlight: "process vs completion",
      },
      {
        type: "rule",
        title: "Imperfective — When to Use It",
        body: "Use the imperfective when: (1) describing a habit or routine — 'I read every day'; (2) describing an ongoing action — 'I was reading when he called'; (3) describing the activity without caring about completion — 'I was writing' (whether or not finished); (4) in questions about whether something happened at all.",
        highlight: "habit, process, duration",
      },
      {
        type: "rule",
        title: "Perfective — When to Use It",
        body: "Use the perfective when: (1) the action was completed — 'I read the whole book'; (2) the action happened once, suddenly — 'He jumped up'; (3) the result matters — 'I wrote the letter' (it's now written); (4) sequential actions — 'He came in, sat down, and opened his book'. Each step is a completed event.",
        highlight: "completion, result, single event",
      },
      {
        type: "table",
        title: "Aspect Pairs",
        headers: ["Imperfective (process)", "Perfective (completion)", "Meaning"],
        rows: [
          ["pisati", "napisati", "to write"],
          ["čitati", "pročitati", "to read"],
          ["učiti", "naučiti", "to learn"],
          ["jesti", "pojesti", "to eat"],
          ["gledati", "pogledati", "to watch / look"],
          ["dolaziti", "doći", "to come / arrive"],
          ["odlaziti", "otići", "to leave / go away"],
          ["kupovati", "kupiti", "to buy"],
        ],
      },
      {
        type: "example",
        title: "The Same Verb — Two Meanings",
        items: [
          { hr: "Jučer sam pisao pismo.", en: "Yesterday I was writing a letter. (process, unfinished)", note: "Imperfective — the writing was in progress" },
          { hr: "Jučer sam napisao pismo.", en: "Yesterday I wrote a letter. (completed)", note: "Perfective — the letter is done" },
          { hr: "Svaki dan čitam novine.", en: "Every day I read the newspaper. (habit)", note: "Imperfective for habitual actions" },
          { hr: "Pročitao sam cijelu knjigu.", en: "I read the whole book. (finished)", note: "Perfective — completed from start to finish" },
        ],
      },
      {
        type: "rule",
        title: "Aspect in the Future Tense",
        body: "In the future tense, the difference becomes even more important. 'Čitat ću' (I will be reading / I will read — imperfective, process or habit). 'Pročitat ću' (I will have read / I will finish reading — perfective, completion). 'Kad dođeš' (When you arrive — perfective in time clauses, not 'kad dolaziš').",
        highlight: "future aspect is critical",
      },
      {
        type: "rule",
        title: "Aspect Pairs — Patterns",
        body: "Many perfective verbs are formed by adding a prefix to the imperfective: pisati → napisati (na-), čitati → pročitati (pro-), učiti → naučiti (na-), jesti → pojesti (po-). But some pairs are completely different words: dolaziti (imperf.) / doći (perf.) — to come. You must learn each pair.",
        highlight: "prefixes often form perfectives",
      },
      {
        type: "example",
        title: "Aspect Contrast — Future and Time Clauses",
        items: [
          { hr: "Kad dođeš, nazovi me.", en: "When you arrive, call me.", note: "Perfective 'dođeš' — the arrival must be complete" },
          { hr: "Sutra ću kupiti kruh.", en: "Tomorrow I will buy bread.", note: "Perfective — the purchase will be completed" },
          { hr: "Svako jutro ću učiti sat vremena.", en: "Every morning I will study for an hour.", note: "Imperfective — repeated habit in the future" },
        ],
      },
      {
        type: "quiz",
        q: "You want to say 'I read the whole book' (it's finished). Which verb do you use?",
        options: ["čitao sam", "pročitao sam", "bit ću čitao", "čitat ću"],
        correct: 1,
        explanation: "'Pročitao sam' uses the perfective 'pročitati' — the reading is completed, the whole book is done. 'Čitao sam' (imperfective) would mean 'I was reading' — the process, not the completion. The word 'cijelu' (whole) also signals perfective meaning.",
      },
      {
        type: "summary",
        title: "Verb Aspect — Complete!",
        points: [
          "Every Croatian verb has two aspect versions: imperfective and perfective",
          "Imperfective = process, habit, duration, repetition (čitati, pisati)",
          "Perfective = completion, result, single event (pročitati, napisati)",
          "Many perfectives are formed with a prefix: pisati → na-pisati",
          "Some pairs are different words: dolaziti (imperf.) / doći (perf.)",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON 6: Clitic Pronouns & Word Order
  // ─────────────────────────────────────────────────────────
  {
    id: "clitics",
    title: "Clitic Pronouns & Word Order",
    subtitle: "The second-position rule and the clitic chain",
    icon: "🔗",
    level: "B2",
    duration: "~8 min",
    color: "#6d28d9",
    bg: "#faf5ff",
    slides: [
      {
        type: "intro",
        title: "Clitics — The Hardest Part of Croatian",
        body: "Croatian has a set of short, unstressed words called clitics (klitike) that must appear in a specific position in the sentence — always second — and always in a fixed internal order when multiple clitics cluster together. Native speakers use these automatically; learners find this the single hardest feature of Croatian.",
        icon: "🔗",
      },
      {
        type: "rule",
        title: "What Are Clitics?",
        body: "Clitics are short, unstressed forms of pronouns and the verb 'biti'. They cannot stand alone — they need to lean on surrounding words. Croatian clitics include: biti forms (sam, si, je, smo, ste, su), dative pronouns (mi, ti, mu, joj, nam, vam, im), accusative pronouns (me, te, ga, je, nas, vas, ih), and the reflexive se.",
        highlight: "short, unstressed, second position",
      },
      {
        type: "rule",
        title: "The Second-Position Rule",
        body: "Clitics must come SECOND in the clause — after the first stressed phrase (not necessarily the first word). The first phrase can be any constituent: a noun, a pronoun, an adverb, a prepositional phrase. Everything after that first phrase: clitics come immediately.",
        highlight: "clitics go SECOND",
      },
      {
        type: "rule",
        title: "First Phrase, Not First Word",
        body: "This is the key subtlety: 'second position' means after the first PHRASE, not the first word. 'Moj brat' is one phrase — two words but one unit. So: 'Moj brat ga je vidio' (My brother saw him) — 'Moj brat' is the first phrase, then 'ga je' are the clitics in position two.",
        highlight: "after the first phrase",
      },
      {
        type: "table",
        title: "The Clitic Chain — Fixed Order",
        headers: ["Position", "Clitics"],
        rows: [
          ["1", "bi (conditional auxiliary)"],
          ["2", "sam, si, je, smo, ste, su (biti — past-tense auxiliary)"],
          ["3", "mi, ti, mu, joj, nam, vam, im (dative pronouns)"],
          ["4", "me, te, ga, je, nas, vas, ih (accusative pronouns)"],
          ["5", "se (reflexive)"],
        ],
      },
      {
        type: "rule",
        title: "The Chain in Practice",
        body: "When multiple clitics appear together, they must follow the 5-slot order. You never say 'ga sam mu' — you must say 'sam mu ga' (biti → dative → accusative). The chain 'sam mu ga' is perfectly grammatical; reversing any element is not. Most sentences use only 2-3 clitics at once.",
        highlight: "sam mu ga — never ga sam mu",
      },
      {
        type: "example",
        title: "Clitic Chains — Correct Placement",
        items: [
          { hr: "Dao sam mu ga.", en: "I gave it to him.", note: "sam (biti) → mu (dative) → ga (accusative)" },
          { hr: "Večeras ću mu ga dati.", en: "Tonight I will give it to him.", note: "First phrase = 'Večeras', clitics follow immediately" },
          { hr: "Sjećam se toga.", en: "I remember that.", note: "se is reflexive — always after biti clitics" },
          { hr: "Nije mi ga dala.", en: "She didn't give it to me.", note: "Negation: nije + mi + ga" },
        ],
      },
      {
        type: "rule",
        title: "Negation and Clitics",
        body: "With negation, the negative form of 'biti' replaces the clitic 'biti' form. 'Je' becomes 'nije'. The other clitics stay in their positions after it: 'Nije mi ga rekao' (He didn't tell it to me). Notice: nije is stressed and is NOT a clitic — it is a full word, so it can appear in position one if needed.",
        highlight: "nije replaces je in negation",
      },
      {
        type: "rule",
        title: "Questions and Clitics",
        body: "In questions with 'li', the pattern shifts. 'Je li ti rekao?' (Did he tell you?) — 'Je' stays at the front when followed by 'li'. This is an exception to the second-position rule. In questions with question words (što, gdje, kada), normal second-position applies: 'Što ti je rekao?' (What did he tell you?).",
        highlight: "je li — special question pattern",
      },
      {
        type: "example",
        title: "More Clitic Examples",
        items: [
          { hr: "Rekao mi je.", en: "He told me.", note: "'Je' (3rd sg only) may appear sentence-finally after other clitics — 'Rekao mi je' is standard. Other biti forms (sam/si/smo/ste/su) always precede dative: 'Dao sam ti ga'" },
          { hr: "Ona mi se sviđa.", en: "I like her. (lit. She pleases me)", note: "mi (dative) → se (reflexive) — in that order" },
          { hr: "Kupio sam ga.", en: "I bought it.", note: "sam (biti position 2) → ga (accusative position 4)" },
          { hr: "Jeste li ga vidjeli?", en: "Did you (all) see him?", note: "li follows the biti clitic in yes/no questions" },
        ],
      },
      {
        type: "quiz",
        q: "In the sentence 'I gave it to him' (Dao ___ ___ ___ .), what is the correct clitic order?",
        options: ["ga mu sam", "sam ga mu", "sam mu ga", "mu ga sam"],
        correct: 2,
        explanation: "The correct order is 'sam mu ga': biti forms (sam) come first in the chain, then dative pronouns (mu = to him), then accusative pronouns (ga = it). 'Dao sam mu ga.' The chain order is fixed: bi → biti → dative → accusative → se.",
      },
      {
        type: "summary",
        title: "Clitic Pronouns — Complete!",
        points: [
          "Clitics are short unstressed words that must appear in second position",
          "Second position means after the first PHRASE (not just first word)",
          "The chain order is fixed: bi → sam/si/je → dative (mu/mi) → accusative (ga/me) → se",
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
    id: "conditional",
    title: "Kondicionalni način",
    subtitle: "Conditional mood — wishes, hypotheticals, and polite requests",
    icon: "🔮",
    level: "B2",
    duration: "~6 min",
    color: "#b45309",
    bg: "#fffbeb",
    slides: [
      {
        type: "intro",
        title: "The Conditional Mood",
        body: "The conditional mood expresses wishes, hypotheticals, and polite requests. It uses the auxiliary 'bi' + past active participle.",
        icon: "🔮",
      },
      {
        type: "table",
        title: "Formation — bi + Participle",
        headers: ["Person", "Masculine", "Feminine"],
        rows: [
          ["ja (I)", "ja bih radio", "ja bih radila"],
          ["ti (you sg.)", "ti bi radio", "ti bi radila"],
          ["on/ona (he/she)", "on/ona bi radio/radila", "on/ona bi radio/radila"],
          ["mi (we)", "mi bismo radili", "mi bismo radile"],
          ["vi (you pl.)", "vi biste radili", "vi biste radile"],
          ["oni/one (they)", "oni/one bi radili", "oni/one bi radile"],
        ],
      },
      {
        type: "rule",
        title: "Three Core Uses",
        body: "The conditional has three main uses: (1) Hypotheticals — 'Kad bih imao vremena, učio bih više.' (If I had time, I would study more.) (2) Polite requests — 'Biste li mi mogli pomoći?' (Could you help me?) (3) Wishes — 'Volio bih posjetiti Dubrovnik.' (I would love to visit Dubrovnik.)",
        highlight: "hypotheticals, requests, wishes",
      },
      {
        type: "rule",
        title: "Past Conditional — bio/bila + bi",
        body: "The past conditional expresses what would have happened but didn't. It adds 'bio/bila' (past of biti) before the main participle: 'Bio bih došao, ali nisam mogao.' (I would have come, but I couldn't.) The 'bio/bila' agrees in gender with the subject.",
        highlight: "bio bih + participle",
      },
      {
        type: "example",
        title: "Conditional in Context",
        items: [
          { hr: "Htio/Htjela bih kavu, molim.", en: "I would like a coffee, please.", note: "Most natural polite way to order" },
          { hr: "Biste li mogli govoriti sporije?", en: "Could you speak more slowly?", note: "Polite request with biste li" },
          { hr: "Kad bih živio u Zagrebu, svaki dan bih šetao Gornjim gradom.", en: "If I lived in Zagreb, I would walk Upper Town every day.", note: "Hypothetical present condition" },
          { hr: "Bila bih kupila kartu, ali nije ih bilo.", en: "I would have bought a ticket, but there were none.", note: "Past conditional — feminine subject" },
        ],
      },
      {
        type: "quiz",
        q: "How do you say 'I would like a coffee' politely?",
        options: ["Htio/Htjela bih kavu, molim.", "Ja hoću kavu.", "Mogu kavu.", "Kava, molim."],
        correct: 0,
        explanation: "'Htio/Htjela bih kavu, molim.' uses the conditional 'bih' with the participle 'htio/htjela' — this is the standard polite way to order or request in Croatian. 'Ja hoću kavu' is too blunt. 'Mogu kavu' is ungrammatical in this context.",
      },
      {
        type: "summary",
        title: "Conditional Mood — Complete!",
        points: [
          "Conditional = bi + past active participle (radio/radila)",
          "Forms: ja bih, ti bi, on/ona bi, mi bismo, vi biste, oni/one bi",
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
    id: "complex-sentences",
    title: "Složene rečenice",
    subtitle: "Complex sentences — subordinating conjunctions and relative clauses",
    icon: "🔗",
    level: "B2",
    duration: "~8 min",
    color: "#0f766e",
    bg: "#f0fdfa",
    slides: [
      {
        type: "intro",
        title: "Complex Sentences",
        body: "Complex sentences connect ideas using subordinating conjunctions. Mastering these moves you from basic communication to natural conversation.",
        icon: "🔗",
      },
      {
        type: "rule",
        title: "Temporal Clauses — When, While, As Soon As",
        body: "Key temporal conjunctions: kad/kada (when), dok (while), čim (as soon as), prije nego što (before), nakon što (after). Examples: 'Kad dođeš, nazovi me.' (When you arrive, call me.) 'Dok sam učio, slušao sam glazbu.' (While I was studying, I was listening to music.) 'Čim završim, idem.' (As soon as I finish, I'm going.) Key rule: use a perfective verb after 'kad' for future events.",
        highlight: "perfective after 'kad' for future",
      },
      {
        type: "table",
        title: "Temporal Conjunctions",
        headers: ["Croatian", "English", "Example"],
        rows: [
          ["kad / kada", "when", "Kad dođeš, nazovi me."],
          ["dok", "while", "Dok sam učio, slušao sam glazbu."],
          ["čim", "as soon as", "Čim završim, idem."],
          ["prije nego što", "before", "Jedi prije nego što odeš."],
          ["nakon što", "after", "Nakon što sam jeo, odmarao sam."],
        ],
      },
      {
        type: "rule",
        title: "Causal and Concessive Clauses",
        body: "jer (because), iako (although), premda (even though), budući da (since/given that). Examples: 'Učim hrvatski jer volim Hrvatsku.' (I study Croatian because I love Croatia.) 'Iako je teško, ne odustajem.' (Although it's hard, I'm not giving up.) 'Budući da imaš iskustva, možeš voditi tim.' (Since you have experience, you can lead the team.)",
        highlight: "jer, iako, premda, budući da",
      },
      {
        type: "rule",
        title: "Relative Clauses — koji/koja/koje",
        body: "Relative clauses use koji (who/which/that). Koji must agree in gender with the noun it refers to (its antecedent): 'Čovjek koji govori hrvatski.' (The man who speaks Croatian — koji = masculine.) 'Žena koja govori hrvatski.' (The woman who speaks Croatian — koja = feminine.) 'Dijete koje govori hrvatski.' (The child who speaks Croatian — koje = neuter.) Koji also declines for case within the relative clause.",
        highlight: "koji agrees in gender with antecedent",
      },
      {
        type: "rule",
        title: "Indirect Speech — da + Present/Past",
        body: "Indirect speech uses 'da' + the appropriate tense: 'Rekao je da uči hrvatski.' (He said that he is studying Croatian.) 'Mislim da je to točno.' (I think that's correct.) Common pitfall: do NOT use 'što' where 'da' is needed. 'Rekao je da dolazi.' ✓ 'Rekao je što dolazi.' ✗ — 'što' in this position means 'what', creating a different meaning.",
        highlight: "da for indirect speech — not što",
      },
      {
        type: "example",
        title: "Complex Sentences in Context",
        items: [
          { hr: "Kad završiš posao, dođi k meni.", en: "When you finish work, come to me.", note: "Perfective 'završiš' — completion triggers the main clause" },
          { hr: "Iako nisam Hrvat, govorim jezik.", en: "Although I'm not Croatian, I speak the language.", note: "Concessive iako — surprising contrast" },
          { hr: "Knjiga koju čitam je odlična.", en: "The book that I'm reading is excellent.", note: "koju = accusative of koja (fem.) — relative clause with case" },
          { hr: "Rekli su da će doći.", en: "They said they would come.", note: "da + future — indirect speech" },
        ],
      },
      {
        type: "quiz",
        q: "Complete: 'Volio bih posjetiti Dubrovnik, ___ sam čuo da je predivno.'",
        options: ["jer", "iako", "čim", "dok"],
        correct: 0,
        explanation: "'jer' (because) is correct — 'Volio bih posjetiti Dubrovnik, jer sam čuo da je predivno.' (I would love to visit Dubrovnik, because I've heard it's beautiful.) 'iako' would mean 'although', which contradicts the positive intent. 'čim' means 'as soon as' and 'dok' means 'while' — neither fits here.",
      },
      {
        type: "summary",
        title: "Complex Sentences — Complete!",
        points: [
          "Temporal: kad/kada (when), dok (while), čim (as soon as), prije nego što (before), nakon što (after)",
          "Use perfective verb after 'kad' for future events: 'Kad dođeš...'",
          "Causal/concessive: jer (because), iako (although), premda (even though), budući da (since)",
          "Relative clauses: koji/koja/koje agrees in gender with its antecedent",
          "Indirect speech: da + tense — NOT 'što' where 'da' is needed",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LESSON: Formalno obraćanje: Vi i ti
  // ─────────────────────────────────────────────────────────
  {
    id: "vi-vs-ti",
    title: "Formalno obraćanje: Vi i ti",
    subtitle: "Formal and informal address — when to use which",
    icon: "🤝",
    level: "A2",
    duration: "~4 min",
    color: "#7c3aed",
    bg: "#f5f3ff",
    slides: [
      {
        type: "intro",
        title: "Vi i ti — Formal vs Informal Address",
        body: "Croatian, like most European languages, has two ways to say 'you': Vi (formal, capitalized) and ti (informal). Choosing correctly is one of the most important social skills in Croatian — more so than grammar. Getting it wrong with elders is a noticeable social misstep.",
        icon: "🤝",
      },
      {
        type: "rule",
        title: "When to Use Vi (Formal)",
        body: "Use Vi (always capitalized in writing) with: elders and grandparents you are meeting for the first time, your partner's parents until they explicitly invite you to use ti, strangers over roughly 40 in formal situations, teachers, doctors, and officials. Vi is the safe default — when in doubt, start here.",
        highlight: "when in doubt, use Vi",
      },
      {
        type: "rule",
        title: "When to Use ti (Informal)",
        body: "Use ti with peers your own age, children, close friends and family, and anyone who has explicitly said 'možemo prijeći na ti' (we can switch to ti). Among younger Croatians (under ~30) and in casual settings, ti is often used right away — but with older acquaintances, always wait for the invitation.",
        highlight: "wait for the invitation",
      },
      {
        type: "table",
        title: "Vi vs ti — Quick Reference",
        headers: ["Situation", "Use"],
        rows: [
          ["Partner's parents, first meeting", "Vi"],
          ["Elders / grandparents (strangers)", "Vi"],
          ["Doctors, teachers, officials", "Vi"],
          ["Strangers over ~40 (formal)", "Vi"],
          ["Peers your age", "ti"],
          ["Children", "ti"],
          ["Close friends and family", "ti"],
          ["After 'možemo prijeći na ti'", "ti"],
        ],
      },
      {
        type: "rule",
        title: "The Switch Offer — Prijelaz na ti",
        body: "When someone says 'Možemo li prijeći na ti?' (Can we switch to ti?), always accept warmly. The natural reply is 'Naravno, s veseljem!' (Of course, with pleasure!) or 'Naravno, s radošću!' Refusing is considered awkward and cold. The offer itself signals you have been accepted.",
        highlight: "always accept warmly",
      },
      {
        type: "example",
        title: "Vi vs ti in Sentences",
        items: [
          { hr: "Kako ste Vi?", en: "How are you? (formal)", note: "Vi — formal singular or plural" },
          { hr: "Kako si ti?", en: "How are you? (informal)", note: "ti — informal, with a peer" },
          { hr: "Možete li mi pomoći?", en: "Can you help me? (formal)", note: "Možete — Vi verb form" },
          { hr: "Možeš li mi pomoći?", en: "Can you help me? (informal)", note: "Možeš — ti verb form" },
          { hr: "Možemo li prijeći na ti?", en: "Can we switch to ti?", note: "The classic switch offer" },
        ],
      },
      {
        type: "rule",
        title: "Cultural Note — Why This Matters",
        body: "Croatians notice when foreigners use Vi correctly with elders — it earns immediate respect. Using ti too early with someone's grandmother or with a doctor signals carelessness. Most Croatians will gently correct you if ti is appropriate, but switching to ti too soon with elders is harder to recover from. The effort to use Vi shows cultural awareness.",
        highlight: "Croatians will correct you kindly",
      },
      {
        type: "quiz",
        q: "You are meeting your Croatian partner's mother for the first time. Which form do you use?",
        options: ["ti — to seem friendly", "Vi — she is an elder you are meeting formally", "Either is fine", "Use first name only"],
        correct: 1,
        explanation: "Always start with Vi when meeting a partner's parents. Wait until they explicitly offer to switch to ti. Starting with ti signals a lack of respect for Croatian social norms, even if you mean to be warm.",
      },
      {
        type: "quiz",
        q: "A Croatian peer says: 'Možemo li prijeći na ti?' What do you do?",
        options: ["Politely decline to keep it formal", "Accept warmly — 'Naravno, s veseljem!'", "Ignore it and keep using Vi", "Ask why they want to switch"],
        correct: 1,
        explanation: "When someone offers to switch to ti, always accept warmly. The offer is a sign of welcome and acceptance. Refusing is considered awkward and cold in Croatian culture.",
      },
      {
        type: "summary",
        title: "Formalno obraćanje — Complete!",
        points: [
          "Vi (capitalized) = formal: elders, officials, partner's parents, strangers over ~40",
          "ti = informal: peers, children, friends, family",
          "When in doubt, use Vi — Croatians will invite you to switch if ti is appropriate",
          "When offered 'Možemo li prijeći na ti?' always accept warmly",
          "Getting Vi right with elders earns immediate respect as a foreigner",
        ],
      },
    ],
  },
];
