// src/data/grammar-advanced.js
// SP9: B2 + C1 grammar units. 10 total (5 B2 + 5 C1).
// Schema mirrors existing grammar.js exports (ASPECT_PAIRS shape).
//
// Each unit has:
//   id (kebab-case), cefr, title, subtitle, focus (comma-separated keywords),
//   intro (2-3 sentence prose),
//   forms (6+ rows of {label, hr, en?}),
//   examples (5+ entries of {hr, en, note?}),
//   tips (3+ strings),
//   drills (5+ {q, qEn?, opts (length 4), correct (index|string), explain?}).

export const FUTUR_II = {
  id: 'futur-ii',
  cefr: 'B2',
  title: 'Futur II — Future Perfect',
  subtitle: 'Used in time clauses ("when/if I have done X") and uncertainty about past',
  focus: 'futur ii, future perfect, conditional time clauses, kad ako future',
  intro:
    'Futur II is formed with the future of "biti" (budem, budeš, bude, budemo, budete, budu) plus the past participle. It appears almost exclusively in subordinate clauses introduced by ako (if), kad (when), čim (as soon as), or dok (while/until) when the main verb is in Futur I. Native speakers also use it to express uncertainty about a past event ("must have / might have").',
  forms: [
    { label: 'ja', hr: 'budem došao / došla', en: 'I will have come' },
    { label: 'ti', hr: 'budeš došao / došla', en: 'you will have come' },
    { label: 'on/ona/ono', hr: 'bude došao / došla / došlo', en: 's/he/it will have come' },
    { label: 'mi', hr: 'budemo došli / došle', en: 'we will have come' },
    { label: 'vi', hr: 'budete došli / došle', en: 'you (pl) will have come' },
    { label: 'oni/one/ona', hr: 'budu došli / došle / došla', en: 'they will have come' },
  ],
  examples: [
    {
      hr: 'Kad budem završio posao, nazvat ću te.',
      en: 'When I have finished work, I will call you.',
      note: 'Time clause: Futur II in `kad` clause + Futur I in main clause.',
    },
    {
      hr: 'Ako budeš imao vremena, dođi.',
      en: 'If you have time, come.',
      note: '`ako` clauses with future reference take Futur II, not Futur I.',
    },
    {
      hr: 'Čim budem stigao, javit ću ti.',
      en: 'As soon as I arrive, I will let you know.',
    },
    {
      hr: 'Dok ne budeš naučio ovo, nećeš proći ispit.',
      en: 'Until you have learned this, you will not pass the exam.',
    },
    {
      hr: 'Bude da je već otišao.',
      en: 'He has probably already left.',
      note: 'Colloquial — expresses speculation about a past event.',
    },
  ],
  tips: [
    'Always uses a past participle (radni glagolski pridjev) — same form used in Past Tense.',
    'Almost never appears in a main clause — look for ako / kad / čim / dok triggers.',
    'In modern speech, Futur I sometimes replaces Futur II in time clauses; both are accepted but Futur II is the literary / standard choice.',
    'The participle agrees in gender + number with the subject: muški došao, ženski došla, množina došli.',
  ],
  drills: [
    {
      q: 'Choose the correct form: Kad ____ vremena, javit ću se.',
      qEn: 'When I have time, I will get in touch.',
      opts: ['budem imati', 'budem imao', 'bit ću imao', 'imam'],
      correct: 1,
      explain: '`budem imao` — Futur II requires past participle after `budem`.',
    },
    {
      q: 'Ako ____ kasno, ne čekaj.',
      qEn: 'If I am late, do not wait.',
      opts: ['bit ću došao', 'budem došao', 'budem kasniti', 'budem zakasnio'],
      correct: 3,
      explain:
        '`budem zakasnio` — `kasniti` is imperfective; perfective `zakasniti` fits a single completed future action.',
    },
    {
      q: 'Čim ____ , idem doma.',
      qEn: 'As soon as I have finished, I am going home.',
      opts: ['budem završiti', 'završim', 'budem završio', 'bit ću završio'],
      correct: 2,
      explain:
        '`budem završio` — Futur II in `čim` clause. Present tense `završim` is also acceptable colloquially.',
    },
    {
      q: 'Singular feminine: "ona ____ ."',
      qEn: 'She will have come.',
      opts: ['bude došao', 'bude došla', 'bude došlo', 'budu došle'],
      correct: 1,
      explain: 'Feminine singular → `došla`. Participle agrees with subject gender.',
    },
    {
      q: 'Translate: "Until they have read the book, do not start the discussion."',
      opts: [
        'Dok ne budu pročitali knjigu, ne počinjite raspravu.',
        'Dok ne bude pročitao knjigu, ne počinjite raspravu.',
        'Dok ne čitaju knjigu, ne počinjite raspravu.',
        'Dok nisu pročitali knjigu, ne počinjite raspravu.',
      ],
      correct: 0,
      explain:
        'Plural subject `oni` → `budu pročitali`. `dok ne` introduces a future time clause taking Futur II.',
    },
  ],
};

export const RELATIVE_CLAUSES = {
  id: 'relative-clauses',
  cefr: 'B2',
  title: 'Relativne rečenice — Relative Clauses',
  subtitle: 'koji / koja / koje + cases — agreeing relative pronouns',
  focus: 'relative clauses, koji, koja, koje, relative pronouns, subordinate clauses',
  intro:
    'The relative pronoun `koji / koja / koje` ("who / which / that") agrees with its antecedent in gender and number, but its case is determined by the role it plays inside the relative clause — NOT by the case of the antecedent. This is the single most common stumbling block for English speakers: you must ask "what job does the pronoun do in the embedded clause?" and decline accordingly. Masculine accusative also splits into animate (= genitive) vs inanimate (= nominative) forms.',
  forms: [
    { label: 'Nominativ', hr: 'koji / koja / koje', en: 'who / which (subject)' },
    { label: 'Genitiv', hr: 'kojeg(a) / koje / kojeg(a)', en: 'of whom / of which' },
    { label: 'Dativ', hr: 'kojem(u) / kojoj / kojem(u)', en: 'to whom / to which' },
    {
      label: 'Akuzativ (m. anim. / inanim.)',
      hr: 'kojeg(a) / koji ; koju ; koje',
      en: 'whom / which (object)',
    },
    { label: 'Lokativ', hr: 'kojem(u) / kojoj / kojem(u)', en: 'about whom / about which' },
    { label: 'Instrumental', hr: 'kojim / kojom / kojim', en: 'with whom / with which' },
    {
      label: 'Plural (sve rodove)',
      hr: 'koji / koje / koja (N) — kojih / kojima …',
      en: 'plural forms',
    },
  ],
  examples: [
    {
      hr: 'Žena koja stoji pored prozora je moja sestra.',
      en: 'The woman who is standing by the window is my sister.',
      note: 'Antecedent `žena` (fem. sg.); pronoun is subject of the relative clause → nominative `koja`.',
    },
    {
      hr: 'Vidim ženu koju voliš.',
      en: 'I see the woman whom you love.',
      note: 'Antecedent `ženu` is accusative, but `koju` is also accusative because it is the object of `voliš` — coincidence of case here.',
    },
    {
      hr: 'Knjiga o kojoj smo razgovarali leži na stolu.',
      en: 'The book we were talking about is lying on the table.',
      note: 'Preposition `o` governs locative → `o kojoj` (fem. sg. loc.).',
    },
    {
      hr: 'Ljudi kojima sam dao knjigu su moji prijatelji.',
      en: 'The people to whom I gave the book are my friends.',
      note: 'Verb `dati` takes a dative recipient → plural dative `kojima`.',
    },
    {
      hr: 'Auto s kojim idem na posao je star.',
      en: 'The car with which I go to work is old.',
      note: 'Preposition `s/sa` + instrumental → `s kojim` (masc. sg. ins.).',
    },
    {
      hr: 'Vidim čovjeka kojeg poznajem.',
      en: 'I see the man whom I know.',
      note: 'Masculine animate accusative = genitive form `kojeg(a)`. For inanimate it would be `koji`.',
    },
  ],
  tips: [
    'Case is decided by the pronoun\'s role INSIDE the relative clause, not by the antecedent. Ask: "what verb / preposition governs it in the embedded clause?"',
    'Masculine animate accusative `kojeg(a)` vs inanimate `koji` — same split as for all masculine nouns.',
    '`koji` is the standard relative for both people and things; `što` exists but is colloquial or used for whole-clause antecedents ("što me jako veseli").',
    'Avoid English-style stacking. Croatian prefers shorter clauses; break long relative chains into separate sentences.',
    'When a preposition precedes the pronoun, the preposition + case go together: `o kojoj`, `s kojim`, `za koje`, `pred kojim`.',
  ],
  drills: [
    {
      q: 'Žena, ____ stoji ondje, je profesorica.',
      qEn: 'The woman who is standing there is a professor.',
      opts: ['koji', 'koja', 'koje', 'kojoj'],
      correct: 1,
      explain:
        '`žena` is feminine singular; pronoun is the subject of the relative clause → nominative `koja`.',
    },
    {
      q: 'To je čovjek ____ poznajem već godinama.',
      qEn: 'That is the man whom I have known for years.',
      opts: ['koji', 'kojeg', 'kojem', 'kojim'],
      correct: 1,
      explain: 'Masculine animate accusative of `koji` = `kojeg(a)`. Object of `poznajem`.',
    },
    {
      q: 'Grad o ____ smo čitali je Dubrovnik.',
      qEn: 'The city we read about is Dubrovnik.',
      opts: ['kojoj', 'koji', 'kojem', 'kojim'],
      correct: 2,
      explain: 'Preposition `o` governs locative; `grad` is masc. sg. → `o kojem(u)`.',
    },
    {
      q: 'Prijatelji ____ sam pisao stižu sutra.',
      qEn: 'The friends to whom I wrote are arriving tomorrow.',
      opts: ['kojima', 'koje', 'kojih', 'kojim'],
      correct: 0,
      explain: '`pisati` takes a dative recipient; plural dative of `koji` = `kojima`.',
    },
    {
      q: 'Auto ____ vidiš je nov.',
      qEn: 'The car you see is new.',
      opts: ['kojeg', 'koju', 'koji', 'kojem'],
      correct: 2,
      explain: 'Masculine INANIMATE accusative = nominative form `koji` (cars are inanimate).',
    },
    {
      q: 'Olovka ____ pišem je crvena.',
      qEn: 'The pen with which I write is red.',
      opts: ['kojoj', 'kojom', 'koju', 'koja'],
      correct: 1,
      explain:
        'Instrumental of means (implicit `s` often dropped for tools); fem. sg. ins. = `kojom`.',
    },
  ],
};

export const PASSIVE_VOICE = {
  id: 'passive-voice',
  cefr: 'B2',
  title: 'Trpni — Passive Voice',
  subtitle: 'Passive constructions: je + napisan / napisana / napisano',
  focus: 'passive voice, trpni, je napisan, biti + past passive participle',
  intro:
    'Croatian passive voice (trpni) is built from `biti` ("to be") + the past passive participle (trpni glagolski pridjev). The participle agrees in gender and number with the subject, exactly like an adjective. Tenses are formed by tensing `biti`: present `je napisan`, past `bio je napisan`, future `bit će napisan`. In everyday spoken Croatian, the `se`-construction (`Knjiga se piše` "the book is being written") is far more common; the true trpni belongs to literary, formal, and news registers.',
  forms: [
    { label: 'pisati → pisan, -a, -o', hr: 'pisan / pisana / pisano', en: 'written' },
    { label: 'čitati → čitan, -a, -o', hr: 'čitan / čitana / čitano', en: 'read' },
    { label: 'voljeti → voljen, -a, -o', hr: 'voljen / voljena / voljeno', en: 'loved' },
    { label: 'dati → dan, -a, -o', hr: 'dan / dana / dano', en: 'given' },
    {
      label: 'pročitati → pročitan, -a, -o',
      hr: 'pročitan / pročitana / pročitano',
      en: 'read (perfective)',
    },
    { label: 'kupiti → kupljen (j-mutation)', hr: 'kupljen / kupljena / kupljeno', en: 'bought' },
    { label: 'otvoriti → otvoren', hr: 'otvoren / otvorena / otvoreno', en: 'opened' },
  ],
  examples: [
    {
      hr: 'Knjiga je napisana na hrvatskom jeziku.',
      en: 'The book is / was written in Croatian.',
      note: 'Present passive. `knjiga` (fem. sg.) → participle ends in `-a`.',
    },
    {
      hr: 'Auto je prodan jučer.',
      en: 'The car was sold yesterday.',
      note: 'Masculine sg. → `prodan`. Croatian present passive often covers English simple past with a fresh-result reading.',
    },
    {
      hr: 'Pisma su poslana prošli tjedan.',
      en: 'The letters were sent last week.',
      note: 'Neuter plural `pisma` → `poslana`.',
    },
    {
      hr: 'Bio je voljen od svih.',
      en: 'He was loved by everyone.',
      note: 'Past passive: `bio je` + `voljen`. Agent introduced by `od` + genitive.',
    },
    {
      hr: 'Bit će objavljeno sutra.',
      en: 'It will be published tomorrow.',
      note: 'Future passive. Neuter sg. (e.g., `to`) → `objavljeno`.',
    },
    {
      hr: 'Vrata su zatvorena.',
      en: 'The door is / has been closed.',
      note: '`vrata` is plurale tantum (always plural) → plural participle `zatvorena`.',
    },
  ],
  tips: [
    'Trpni is literary / formal. In everyday speech Croatians prefer the `se`-passive: `Auto se prodaje` rather than `Auto je prodavan`.',
    'The participle agrees in gender AND number with the subject: `knjiga je napisana`, `roman je napisan`, `pisma su napisana`.',
    'j-mutation hits many `-iti` verbs: kupiti → kupljen, ljubiti → ljubljen, slaviti → slavljen, voditi → vođen.',
    'Aspect matters: perfective participles (`pročitan`, `prodan`) describe a completed result; imperfective (`čitan`, `prodavan`) describe a process or repeated action.',
    'The agent (the doer) is introduced by `od (strane)` + genitive: `napisan od (strane) studenta`. This is felt as bureaucratic; native speakers often drop the agent entirely.',
  ],
  drills: [
    {
      q: 'Knjiga ____ na hrvatskom.',
      qEn: 'The book is written in Croatian.',
      opts: ['je napisan', 'je napisana', 'je napisano', 'je napisali'],
      correct: 1,
      explain: '`knjiga` is feminine singular → participle ends in `-a`: `napisana`.',
    },
    {
      q: 'Pisma ____ jučer.',
      qEn: 'The letters were sent yesterday.',
      opts: ['je poslana', 'su poslane', 'su poslana', 'je poslan'],
      correct: 2,
      explain:
        '`pisma` is NEUTER plural → `su poslana`. (If it were `pisme`, fem. pl., it would be `su poslane`.)',
    },
    {
      q: 'Past passive: "Roman ____ prošlog stoljeća."',
      qEn: 'The novel was written last century.',
      opts: ['je napisan', 'bio je napisan', 'bit će napisan', 'napisao je'],
      correct: 1,
      explain:
        'Past passive = `bio/bila/bilo` + `je` + participle. Masculine sg. `roman` → `bio je napisan`.',
    },
    {
      q: 'Choose the correct passive form of "kupiti" (fem. sg.):',
      opts: ['kupita', 'kupljena', 'kupiljena', 'kupijena'],
      correct: 1,
      explain: 'j-mutation: kupiti → kupljen. Fem. sg. = `kupljena`.',
    },
    {
      q: 'Future passive: "Rezultati ____ na webu."',
      qEn: 'Results will be published on the web.',
      opts: ['bili su objavljeni', 'su objavljeni', 'bit će objavljeni', 'objavit će'],
      correct: 2,
      explain:
        'Future passive = `bit će` + participle. `rezultati` masc. pl. → `bit će objavljeni`.',
    },
    {
      q: 'Which sentence is grammatical?',
      opts: ['Auto je prodano.', 'Auto je prodana.', 'Auto je prodan.', 'Auto je prodali.'],
      correct: 2,
      explain:
        '`auto` is masculine singular → `prodan` (no ending). Options A and B are wrong gender; D is active past.',
    },
  ],
};

export const PARTICIPLES = {
  id: 'participles',
  cefr: 'B2',
  title: 'Glagolski pridjevi — Participles',
  subtitle: 'Past + passive participles, their declension, and uses',
  focus:
    'participles, glagolski pridjev radni, glagolski pridjev trpni, past participle, passive participle',
  intro:
    'Croatian has two productive participles. The active past participle (glagolski pridjev radni: pisao, pisala, pisalo) is what forms the past tense, Futur II, and Kondicional — it is a verbal auxiliary, not a free adjective. The passive past participle (glagolski pridjev trpni: pisan, pisana, pisano) forms the passive voice AND functions as a regular adjective ("an opened book"). Both decline like adjectives and agree with their subject in gender and number. Intransitive verbs (doći, pasti, otići) lack a trpni form — there is no patient to passivize.',
  forms: [
    {
      label: 'pisati',
      hr: 'pisao / pisala / pisalo  ||  pisan / pisana / pisano',
      en: 'wrote / written',
    },
    {
      label: 'čitati',
      hr: 'čitao / čitala / čitalo  ||  čitan / čitana / čitano',
      en: 'read / been read',
    },
    { label: 'doći (intransitive)', hr: 'došao / došla / došlo  ||  — (no trpni)', en: 'came / —' },
    { label: 'piti', hr: 'pio / pila / pilo  ||  pijen / pijena / pijeno', en: 'drank / drunk' },
    { label: 'pasti (intransitive)', hr: 'pao / pala / palo  ||  — (no trpni)', en: 'fell / —' },
    {
      label: 'otvoriti',
      hr: 'otvorio / otvorila / otvorilo  ||  otvoren / otvorena / otvoreno',
      en: 'opened / open(ed)',
    },
    {
      label: 'kupiti (j-mutation)',
      hr: 'kupio / kupila / kupilo  ||  kupljen / kupljena / kupljeno',
      en: 'bought / bought',
    },
  ],
  examples: [
    {
      hr: 'Pisao sam pismo cijelo jutro.',
      en: 'I was writing a letter all morning.',
      note: 'Radni participle inside Perfekt: `pisao sam` (1st sg. masc.).',
    },
    {
      hr: 'Pismo je napisano.',
      en: 'The letter is written / has been written.',
      note: 'Trpni participle in passive voice: `je napisano` (neut. sg.).',
    },
    {
      hr: 'Otvorena knjiga leži na stolu.',
      en: 'An open book is lying on the table.',
      note: 'Trpni used as an ordinary adjective modifying `knjiga`.',
    },
    {
      hr: 'Slomljen tanjur leži u kuhinji.',
      en: 'A broken plate is lying in the kitchen.',
      note: 'Adjectival trpni: `slomljen` (from slomiti, with j-mutation).',
    },
    {
      hr: 'Razgovarali smo do kasno u noć.',
      en: 'We talked until late at night.',
      note: 'Radni plural masc. inside Perfekt: `razgovarali smo`.',
    },
    {
      hr: 'Bila je voljena cijeli život.',
      en: 'She was loved her entire life.',
      note: 'Trpni in Past Passive: `bila je voljena` (fem. sg.).',
    },
  ],
  tips: [
    'Radni vs trpni: radni "did" (active), trpni "was done" (passive / adjectival). Both decline; only radni is required to build Perfekt / Futur II / Kondicional.',
    'Intransitive verbs (doći, pasti, otići, umrijeti, pasti) have NO trpni — there is nobody to undergo the action.',
    'j-mutation in -iti verbs: kupiti → kupljen, ljubiti → ljubljen, slaviti → slavljen, paziti → pažen, voziti → vožen.',
    'When the trpni functions as a free adjective (`otvorena vrata`, `slomljen tanjur`), it declines through all seven cases like any adjective.',
    'Radni endings: masc. sg. -o, fem. sg. -la, neut. sg. -lo; masc. pl. -li, fem. pl. -le, neut. pl. -la.',
  ],
  drills: [
    {
      q: 'Choose the right radni participle: "Ona ____ pismo."',
      qEn: 'She wrote the letter.',
      opts: ['je pisao', 'je pisala', 'je pisan', 'je pisana'],
      correct: 1,
      explain: 'Past tense uses RADNI; fem. sg. → `je pisala`. `pisan/a` would be trpni (passive).',
    },
    {
      q: 'Which form is the TRPNI of "kupiti" (fem. sg.)?',
      opts: ['kupila', 'kupljena', 'kupita', 'kupivši'],
      correct: 1,
      explain: 'j-mutation: kupiti → kupljen; fem. sg. = `kupljena`. `kupila` is radni.',
    },
    {
      q: 'Which verb has NO trpni participle?',
      opts: ['pisati', 'doći', 'kupiti', 'otvoriti'],
      correct: 1,
      explain: '`doći` is intransitive — no direct object means no passive / trpni form.',
    },
    {
      q: '"____ vrata stoje otvorena cijelo jutro."',
      qEn: 'The opened door has been standing open all morning.',
      opts: ['Otvoren', 'Otvorena', 'Otvorene', 'Otvoreni'],
      correct: 1,
      explain: '`vrata` is plurale tantum, treated as neuter plural → adjective form `otvorena`.',
    },
    {
      q: 'Plural masculine Perfekt: "Oni ____ kasno."',
      qEn: 'They arrived late.',
      opts: ['su došao', 'su došla', 'su došli', 'su došle'],
      correct: 2,
      explain: 'Plural masc. radni of `doći` = `došli`.',
    },
    {
      q: 'Choose the passive sentence:',
      opts: [
        'Knjigu je pročitao Marko.',
        'Marko je pročitao knjigu.',
        'Knjiga je pročitana.',
        'Marko čita knjigu.',
      ],
      correct: 2,
      explain: 'Passive uses TRPNI: `je pročitana`. The others are active.',
    },
  ],
};

export const REPORTED_SPEECH = {
  id: 'reported-speech',
  cefr: 'B2',
  title: 'Indirektni govor — Reported Speech',
  subtitle: 'da + present clauses, tense agreement, embedded questions',
  focus: 'reported speech, indirektni govor, da clauses, embedded questions, kaze da',
  intro:
    'Croatian reported speech is dramatically simpler than English: there is NO "backshift" of tenses. The embedded clause keeps the tense the speaker originally used. "He said: \'I am coming.\'" → `Rekao je da dolazi` (literally "He said that he is coming"), NOT `da je dolazio`. Statements are introduced by `da`; embedded yes/no questions take the interrogative particle `li` (or `da li`); embedded wh-questions reuse the original wh-word (gdje, kada, tko, što).',
  forms: [
    { label: 'reći (perf.) — to say', hr: 'Rekao je da + present', en: 'He said that …' },
    {
      label: 'kazati (perf./impf.) — to tell',
      hr: 'Kazao je da + present',
      en: 'He told (someone) that …',
    },
    { label: 'misliti — to think', hr: 'Mislim da + present', en: 'I think that …' },
    { label: 'znati — to know', hr: 'Znam da / gdje / kada …', en: 'I know that / where / when …' },
    {
      label: 'pitati — to ask',
      hr: 'Pitao je + (da) li / gdje / kada …',
      en: 'He asked whether / where …',
    },
    { label: 'čuti — to hear', hr: 'Čula je da + present', en: 'She heard that …' },
    { label: 'tvrditi — to claim', hr: 'Tvrdi da + present', en: 'He claims that …' },
  ],
  examples: [
    {
      hr: 'Pitao je dolazim li sutra.',
      en: 'He asked whether I am coming tomorrow.',
      note: 'Embedded yes/no question — particle `li` follows the verb. Tense stays present (no backshift).',
    },
    {
      hr: 'Rekao je da dolazi.',
      en: 'He said that he is coming. (lit. "he comes")',
      note: 'Original direct speech: "Dolazim." — present is preserved.',
    },
    {
      hr: 'Misli da nas voli.',
      en: 'He thinks that he loves us.',
      note: 'Statement with `da` + present.',
    },
    {
      hr: 'Zna gdje smo bili.',
      en: 'He knows where we were.',
      note: 'Embedded wh-question: `gdje` keeps the same form as in the direct question.',
    },
    {
      hr: 'Čula je da lijepo pjevaš.',
      en: 'She heard that you sing beautifully.',
      note: 'No backshift: "lijepo pjevaš" stays present, not past.',
    },
    {
      hr: 'Rekao mi je da dođem.',
      en: 'He told me to come.',
      note: 'Reported IMPERATIVE = `da` + present (subjunctive-like): `da dođem` ("that I come").',
    },
  ],
  tips: [
    'NO backshift unlike English: if the original speaker used present, you keep present. `He said he was coming` → Croatian still uses present `dolazi`.',
    'Yes/no questions: `da li dolazi?` or `dolazi li?` — both work. Embedded: `Pitao je dolazi li / da li dolazi`. Wh-questions reuse the wh-word: gdje, kada, tko, što, zašto, kako.',
    'Reported imperatives use `da` + present: "Dođi!" → `Rekao mi je da dođem`. NOT an infinitive — Croatian doesn\'t allow control infinitives the way English does.',
    'The `da li` form is older / more bookish; native speakers in Croatia generally prefer the inverted `dolazi li` pattern; `da li` is more common in Bosnian/Serbian.',
    'Reporting a future statement keeps the future: "Doći ću" → `Rekao je da će doći`.',
  ],
  drills: [
    {
      q: 'Direct: "Dolazim sutra." Reported by him:',
      opts: [
        'Rekao je da je dolazio sutra.',
        'Rekao je da dolazi sutra.',
        'Rekao je da bi došao sutra.',
        'Rekao je da je došao sutra.',
      ],
      correct: 1,
      explain:
        'NO backshift. Original present `dolazim` → reported `dolazi`. English would shift to past, Croatian does not.',
    },
    {
      q: 'Embedded yes/no question: "Pitao je ____ ."',
      qEn: 'He asked whether I am coming.',
      opts: ['da dolazim', 'dolazim li', 'da dolazi', 'ako dolazim'],
      correct: 1,
      explain:
        'Embedded yes/no question uses inverted `dolazim li` (or `da li dolazim`). `ako` is "if" in a conditional sense, not "whether".',
    },
    {
      q: 'Direct: "Gdje si bio?" Reported:',
      opts: [
        'Pitao me da sam bio.',
        'Pitao me jesam li bio.',
        'Pitao me gdje sam bio.',
        'Pitao me da li gdje sam bio.',
      ],
      correct: 2,
      explain:
        'Embedded wh-question reuses the wh-word `gdje` without `da`. Tense (Perfekt) is preserved.',
    },
    {
      q: 'Direct: "Doći ću." Reported:',
      opts: [
        'Rekao je da dolazi.',
        'Rekao je da je došao.',
        'Rekao je da će doći.',
        'Rekao je da bi došao.',
      ],
      correct: 2,
      explain: 'Future is preserved. `Doći ću` → `da će doći`.',
    },
    {
      q: 'Reported imperative — Direct: "Dođi!" He told me:',
      opts: [
        'Rekao mi je doći.',
        'Rekao mi je da dođem.',
        'Rekao mi je da sam došao.',
        'Rekao mi je dolazim.',
      ],
      correct: 1,
      explain:
        'Reported imperatives use `da` + present: `da dođem` ("that I come"). Croatian does not use a control infinitive here.',
    },
    {
      q: 'Which is the most natural Croatian rendering of "I think he loves us"?',
      opts: [
        'Mislim da nas je volio.',
        'Mislim da nas voli.',
        'Mislim ga voli nas.',
        'Mislim da bi nas volio.',
      ],
      correct: 1,
      explain: 'Statement clause: `da` + present, no backshift. `Mislim da nas voli`.',
    },
  ],
};

export const KONDICIONAL_II = {
  id: 'kondicional-ii',
  cefr: 'C1',
  title: 'Kondicional II — Conditional Perfect',
  subtitle: 'bio bih + past participle — counterfactual past',
  focus: 'kondicional ii, conditional perfect, counterfactual, bio bih dosao, da je',
  intro:
    'Kondicional II expresses past counterfactuals — "I would have come" (but didn\'t). It is formed with the Kondicional I of `biti` (bio bih / bila bih) PLUS the past participle of the main verb. It is typically paired with a `da` clause stating the unfulfilled condition: `Da sam imao vremena, bio bih došao` ("If I had had time, I would have come"). Distinct from Kondicional I (`došao bih` — "I would come"), Kondicional II is firmly literary / formal and is increasingly replaced in speech by Kondicional I in past contexts.',
  forms: [
    { label: 'ja (m. / f.)', hr: 'bio bih došao / bila bih došla', en: 'I would have come' },
    { label: 'ti (m. / f.)', hr: 'bio bi došao / bila bi došla', en: 'you would have come' },
    {
      label: 'on / ona / ono',
      hr: 'bio bi došao / bila bi došla / bilo bi došlo',
      en: 's/he/it would have come',
    },
    { label: 'mi (m. / f.)', hr: 'bili bismo došli / bile bismo došle', en: 'we would have come' },
    {
      label: 'vi (m. / f.)',
      hr: 'bili biste došli / bile biste došle',
      en: 'you (pl) would have come',
    },
    {
      label: 'oni / one / ona',
      hr: 'bili bi došli / bile bi došle / bila bi došla',
      en: 'they would have come',
    },
    {
      label: 'Negative',
      hr: 'ne bih bio došao / ne bismo bili došli',
      en: 'I/we would not have come',
    },
  ],
  examples: [
    {
      hr: 'Da sam imao vremena, bio bih došao.',
      en: 'If I had had time, I would have come.',
      note: 'Classic counterfactual pairing: `da` + Perfekt (unreal past condition) → Kondicional II in main clause.',
    },
    {
      hr: 'Da nije kasnila, ne bismo zakasnili na vlak.',
      en: 'If she had not been late, we would not have missed the train.',
      note: 'Negative Kondicional II: `ne bismo + bili + zakasnili`. Plural masculine participle.',
    },
    {
      hr: 'Bilo bi lakše da smo to znali ranije.',
      en: 'It would have been easier if we had known that earlier.',
      note: 'Impersonal neuter: `bilo bi` + adverb. The `da` clause comes second.',
    },
    {
      hr: 'Da si ga vidio, ne bi mu vjerovao.',
      en: 'If you had seen him, you would not have believed him.',
      note: '2nd sg.: enclitic `bi` (the same form across persons 2/3 sg.) + masc. sg. participle.',
    },
    {
      hr: 'Bio bih ti pomogao da si me pitao.',
      en: 'I would have helped you had you asked me.',
      note: 'Note clitic order: `bih ti pomogao` — `bih` (aux) before `ti` (dat. pron.).',
    },
    {
      hr: 'Da nisu intervenirali, situacija bi bila gora.',
      en: 'Had they not intervened, the situation would have been worse.',
      note: 'Fem. sg. `bila` — agrees with `situacija`.',
    },
  ],
  tips: [
    'Almost always paired with a `da` + Perfekt clause stating the unfulfilled past condition. Without that pairing, Croatians often default to Kondicional I.',
    'The participle agrees in gender AND number with the subject — same rules as Perfekt: bio (m. sg.), bila (f. sg.), bilo (n. sg.), bili / bile / bila (plurals).',
    'Distinct from Kondicional I: `došao bih` = "I would come" (present hypothetical); `bio bih došao` = "I would have come" (past counterfactual).',
    'Register: firmly literary / formal. In everyday speech Kondicional I (`došao bih`) is often used for past counterfactuals too — context disambiguates.',
    'Clitic order in the full form: `bih` (aux) → other clitics (mu, joj, ga, je, se) → participle. Example: `bio bih mu rekao`.',
  ],
  drills: [
    {
      q: 'Da sam imao vremena, ____ došao.',
      qEn: 'If I had had time, I would have come.',
      opts: ['bih', 'bio bih', 'bit ću', 'bio sam'],
      correct: 1,
      explain:
        'Kondicional II = `bio bih` + participle. `bih došao` alone is Kondicional I; the past counterfactual needs `bio bih došao`.',
    },
    {
      q: 'Fem. sg.: "Ona ____ došla da je znala."',
      qEn: 'She would have come had she known.',
      opts: ['bio bi', 'bila bi', 'bili bi', 'bilo bi'],
      correct: 1,
      explain:
        'Feminine singular auxiliary participle = `bila` + clitic `bi` (3rd sg.) → `bila bi došla`.',
    },
    {
      q: 'Plural masc.: "Oni ____ pomogli."',
      qEn: 'They would have helped.',
      opts: ['bili bi pomogao', 'bila bi pomogli', 'bili bi pomogli', 'bilo bi pomoglo'],
      correct: 2,
      explain: 'Plural masc.: `bili bi` + plural masc. participle `pomogli`.',
    },
    {
      q: 'Which sentence uses Kondicional II correctly?',
      opts: [
        'Da budem znao, došao bih.',
        'Da sam znao, bio bih došao.',
        'Da znam, bio bih dolazio.',
        'Da bih znao, dolazim.',
      ],
      correct: 1,
      explain:
        'Counterfactual past: `da` + Perfekt (`sam znao`) → Kondicional II main clause (`bio bih došao`).',
    },
    {
      q: 'Negative: "Da ga nisi pitao, ne ____ ti pomogao."',
      qEn: 'Had you not asked him, he would not have helped you.',
      opts: ['bih bio', 'bi bio', 'bi se bio', 'budu bili'],
      correct: 1,
      explain:
        '3rd sg. masc.: `ne bi bio` + `pomogao` (with `ti` dat. clitic in between). Clitic order: `ne bi ti bio pomogao`.',
    },
    {
      q: 'Translate: "We would have known."',
      opts: ['Znali bismo.', 'Bili bismo znali.', 'Bili smo znali.', 'Bit ćemo znali.'],
      correct: 1,
      explain:
        '`Znali bismo` is Kondicional I ("we would know"). `Bili bismo znali` is Kondicional II ("we would have known").',
    },
  ],
};

export const BUSINESS_REGISTER = {
  id: 'business-register',
  cefr: 'C1',
  title: 'Poslovni jezik — Business Correspondence',
  subtitle: 'Formal letters, polite imperatives, advanced gospodin/gospođa usage',
  focus:
    'business register, formal correspondence, gospodin, gospodja, polite imperative, business email',
  intro:
    'Croatian business and formal correspondence relies on specific honorific patterns that go beyond the basic Ti/Vi distinction. Address lines use the vocative case of `gospodin` / `gospođa` with a capital G (`Poštovani gospodine Horvate`, `Poštovana gospođo Kovač`). In formal writing the pronouns Vi, Vam, Vas, Vaš are capitalized to signal respect. Requests are softened with `Molim Vas da` + present (subjunctive-like) rather than a bare imperative. Standard openings (`Poštovani`), sign-offs (`Srdačan pozdrav`, `S poštovanjem`), and email templates are tightly conventionalized — deviation reads as either rude or amateurish.',
  forms: [
    {
      label: 'Address (m. sg.)',
      hr: 'Poštovani gospodine Horvate,',
      en: 'Dear Mr. Horvat,',
    },
    {
      label: 'Address (f. sg.)',
      hr: 'Poštovana gospođo Kovač,',
      en: 'Dear Mrs. Kovač,',
    },
    {
      label: 'Address (group)',
      hr: 'Poštovani / Cijenjeni klijenti,',
      en: 'Dear / Esteemed clients,',
    },
    {
      label: 'Polite request',
      hr: 'Molim Vas da pošaljete dokumente.',
      en: 'Please send the documents.',
    },
    {
      label: 'Thanks',
      hr: 'Hvala Vam na razumijevanju.',
      en: 'Thank You for your understanding.',
    },
    {
      label: 'Sign-off (neutral)',
      hr: 'Srdačan pozdrav,',
      en: 'Kind regards,',
    },
    {
      label: 'Sign-off (formal)',
      hr: 'S poštovanjem,',
      en: 'Yours sincerely,',
    },
  ],
  examples: [
    {
      hr: 'Poštovani gospodine Horvate, hvala Vam na brzom odgovoru.',
      en: 'Dear Mr. Horvat, thank You for your prompt reply.',
      note: 'Vocative `gospodine Horvate`; capitalized `Vam` marks formal Vi.',
    },
    {
      hr: 'Molim Vas da nam dostavite ponudu do petka.',
      en: 'Please send us the offer by Friday.',
      note: 'Polite imperative via `Molim Vas da` + present — never bare `Pošaljite!` in business context.',
    },
    {
      hr: 'Cijenjeni klijenti, obavještavamo Vas o promjeni radnog vremena.',
      en: 'Esteemed clients, we inform You of a change in business hours.',
      note: 'Group address `Cijenjeni klijenti` — used in newsletters and notices.',
    },
    {
      hr: 'U privitku dostavljam tražene dokumente.',
      en: 'Attached you will find the requested documents.',
      note: 'Standard email phrase; `u privitku` (or `u prilogu`) = "attached".',
    },
    {
      hr: 'S poštovanjem, Ivana Marić, direktorica prodaje.',
      en: 'Yours sincerely, Ivana Marić, Director of Sales.',
      note: 'Formal sign-off + name + title. Feminine title `direktorica`, not `direktor`.',
    },
    {
      hr: 'Ako imate dodatnih pitanja, slobodno mi se obratite.',
      en: 'If You have any further questions, please feel free to contact me.',
      note: 'Standard closing courtesy line; `slobodno + imperative` softens the offer.',
    },
  ],
  tips: [
    'Capitalize Vi, Vam, Vas, Vaš throughout formal correspondence — this is a sign of respect, not a typo.',
    'Vocative of names: `gospodine Horvate` (m. sg. voc. of `Horvat`), `gospođo Kovač` (f. sg. voc. — surnames in -ić, -ač often stay unchanged for women).',
    'Never start a business email with the bare imperative `Pošaljite!`. Use `Molim Vas da pošaljete…` or `Bili bismo Vam zahvalni ako biste poslali…`.',
    'Sign-off hierarchy: `S poštovanjem` (most formal) > `Srdačan pozdrav` (neutral business) > `Pozdrav` (informal, internal). Match the opening.',
    'Use feminine professional titles for women: `direktorica`, `profesorica`, `inženjerka`, `voditeljica`. Using masculine forms (`direktor`) for a woman is increasingly considered tone-deaf in modern Croatian.',
  ],
  drills: [
    {
      q: 'Choose the correct opening for a letter to Mr. Horvat:',
      opts: ['Bok Horvat,', 'Poštovani gospodine Horvate,', 'Dragi Horvat,', 'Gospodin Horvat,'],
      correct: 1,
      explain:
        '`Poštovani` + vocative `gospodine Horvate`. `Bok` and `Dragi` are informal; `Gospodin Horvat` (nominative) is not an address form.',
    },
    {
      q: 'In a formal email, which spelling of "you" is correct?',
      opts: ['vi', 'Vi', 'VI', 'tebe'],
      correct: 1,
      explain:
        'Formal Vi is capitalized in correspondence: Vi, Vam, Vas, Vaš. Lowercase `vi` is for plural informal you.',
    },
    {
      q: 'Most polite way to ask a client to send documents:',
      opts: [
        'Pošalji dokumente.',
        'Pošaljite dokumente!',
        'Molim Vas da pošaljete dokumente.',
        'Hoćeš poslati dokumente?',
      ],
      correct: 2,
      explain:
        '`Molim Vas da` + present is the standard polite-request frame. The bare imperative is too direct for business.',
    },
    {
      q: 'Which sign-off matches the most formal register?',
      opts: ['Pozdrav,', 'Srdačan pozdrav,', 'S poštovanjem,', 'Bok,'],
      correct: 2,
      explain:
        '`S poštovanjem` ("Yours sincerely") is the most formal. `Pozdrav` and `Bok` are informal; `Srdačan pozdrav` is neutral business.',
    },
    {
      q: 'How do you address a female sales director named Marić?',
      opts: [
        'gospodina direktora Marić',
        'gospođo direktorice Marić',
        'gospođa direktor Marić',
        'gospodin Marić',
      ],
      correct: 1,
      explain:
        'Vocative + feminine title: `gospođo direktorice Marić`. Use feminine `direktorica` for a woman.',
    },
    {
      q: 'Translate the email phrase "Attached you will find the requested documents":',
      opts: [
        'Dokumenti su u kuhinji.',
        'U privitku dostavljam tražene dokumente.',
        'Zatraženi su dokumenti.',
        'Pošaljite tražene dokumente.',
      ],
      correct: 1,
      explain:
        '`U privitku dostavljam…` is the standard business email phrase. Note `tražene` (passive participle) agreeing with `dokumente`.',
    },
  ],
};

export const VERBAL_NOUNS = {
  id: 'verbal-nouns',
  cefr: 'C1',
  title: 'Glagolske imenice — Verbal Nouns',
  subtitle: 'pisanje, čitanje, putovanje — gerund-like nouns from verbs',
  focus: 'verbal nouns, glagolska imenica, gerund, pisanje, citanje, -nje suffix',
  intro:
    'Verbal nouns (glagolske imenice) are nominalized verbs ending in -nje (pisanje "writing", čitanje "reading", putovanje "travelling"). They are formed productively from almost any imperfective verb by replacing the infinitive ending with -nje, often with phonological adjustments. They decline as neuter `-e/-a` nouns through all seven cases and are extremely frequent in formal Croatian (legal, academic, journalistic). Crucially, a verbal noun in a phrase like `umoran od putovanja` takes the case governed by the preposition (`od` → genitive), NOT the case the source verb would have demanded.',
  forms: [
    { label: 'N (nominativ)', hr: 'pisanje', en: 'writing (subject)' },
    { label: 'G (genitiv)', hr: 'pisanja', en: 'of writing' },
    { label: 'D (dativ)', hr: 'pisanju', en: 'to writing' },
    { label: 'A (akuzativ)', hr: 'pisanje', en: 'writing (object)' },
    { label: 'V (vokativ)', hr: 'pisanje', en: '— rarely used' },
    { label: 'L (lokativ)', hr: 'pisanju', en: 'about / in writing' },
    { label: 'I (instrumental)', hr: 'pisanjem', en: 'by / with writing' },
  ],
  examples: [
    {
      hr: 'Umoran sam od putovanja.',
      en: 'I am tired from travelling.',
      note: 'Preposition `od` governs genitive → `putovanja` (gen. sg. of `putovanje`).',
    },
    {
      hr: 'Prije pisanja izvještaja, pregledaj podatke.',
      en: 'Before writing the report, review the data.',
      note: '`prije` + genitive → `pisanja`. Note `izvještaja` (gen. of `izvještaj`) — verbal nouns govern genitive for their object.',
    },
    {
      hr: 'Tijekom čitanja knjige pravim bilješke.',
      en: 'During the reading of the book I take notes.',
      note: '`tijekom` + genitive → `čitanja`; `knjige` also genitive (object of the verbal noun).',
    },
    {
      hr: 'Nakon razgovora otišli smo kući.',
      en: 'After the conversation we went home.',
      note: '`nakon` + genitive → `razgovora` (verbal noun from `razgovarati`).',
    },
    {
      hr: 'U pjevanju nalazi mir.',
      en: 'She finds peace in singing.',
      note: '`u` + locative → `pjevanju`. Verbal noun from `pjevati`.',
    },
    {
      hr: 'Učenjem hrvatskog razvijaš um.',
      en: 'By learning Croatian you develop your mind.',
      note: 'Instrumental of means: `učenjem` (ins. sg.). Note `hrvatskog` — verbal noun takes genitive for its object.',
    },
  ],
  tips: [
    'Formation: drop the `-ti` of the infinitive, add `-nje`, with sound changes — pisati → pisanje, čitati → čitanje, putovati → putovanje, govoriti → govorenje (vowel shift), pjevati → pjevanje.',
    'Aspect of the source verb is preserved: imperfective `pisanje` (writing as activity) vs perfective-derived `napisanje` (the act of having written) — but imperfective forms are far more common.',
    'Object of a verbal noun goes into the GENITIVE: `pisanje pisma` (writing a letter), `čitanje knjige` (reading of the book). The original verb might have governed accusative, but in nominalized form it takes genitive.',
    'Case is determined by the preposition or syntactic role, not by the source verb: `od putovanja` (gen.), `pri pisanju` (loc.), `pisanjem` (ins.).',
    'In formal Croatian, verbal nouns often replace `da` + present clauses: `mogućnost dolaska` (the possibility of arrival) instead of `mogućnost da dođe`.',
  ],
  drills: [
    {
      q: 'Form the verbal noun from `čitati`:',
      opts: ['čitalo', 'čitanje', 'čitanost', 'čitač'],
      correct: 1,
      explain:
        '`čitati` → `čitanje` (-ti dropped, -nje added). `čitač` is an agent noun (reader = person).',
    },
    {
      q: '"Umoran sam ____ ."',
      qEn: 'I am tired from travelling.',
      opts: ['od putovanju', 'od putovanja', 'od putovanje', 'od putovanjem'],
      correct: 1,
      explain: '`od` requires genitive → `putovanja` (gen. sg. of `putovanje`).',
    },
    {
      q: '"Tijekom ____ knjige pravim bilješke."',
      qEn: 'During the reading of the book I take notes.',
      opts: ['čitanje', 'čitanja', 'čitanju', 'čitanjem'],
      correct: 1,
      explain: '`tijekom` governs genitive → `čitanja`.',
    },
    {
      q: 'The object of a verbal noun in Croatian goes into which case?',
      opts: ['accusative', 'genitive', 'dative', 'instrumental'],
      correct: 1,
      explain:
        'Verbal nouns take genitive for their object: `pisanje pisma` (not `pismo`), `čitanje knjige` (not `knjigu`).',
    },
    {
      q: '"____ hrvatskog razvijaš um."',
      qEn: 'By learning Croatian you develop your mind.',
      opts: ['Učenje', 'Učenju', 'Učenjem', 'Učenja'],
      correct: 2,
      explain: 'Instrumental of means: `učenjem` (ins. sg. of `učenje`).',
    },
    {
      q: 'Which sentence uses the verbal noun + object correctly?',
      opts: ['pisanje pismo', 'pisanje pismu', 'pisanje pisma', 'pisanje pismom'],
      correct: 2,
      explain:
        'Verbal noun governs genitive on its object → `pisanje pisma` (writing of a letter).',
    },
  ],
};

export const REFLEXIVE_CONSTRUCTIONS = {
  id: 'reflexive-constructions',
  cefr: 'C1',
  title: 'Povratni glagoli — Reflexive Constructions',
  subtitle: 'se vs sebe, true reflexives, reciprocals, passives',
  focus: 'reflexive, povratni, se vs sebe, reciprocal, povratni glagoli',
  intro:
    'The Croatian clitic `se` is dramatically overloaded. It marks (1) TRUE reflexive action where subject = object (`umivati se` "to wash oneself"); (2) RECIPROCAL action ("each other") with plural subjects (`vidjeli smo se` "we saw each other"); (3) MIDDLE / passive voice (`knjiga se prodaje` "the book is being sold"); and (4) INHERENTLY reflexive verbs that simply require `se` lexically (`smijati se`, `bojati se` — there is no version without `se`). The full pronoun `sebe` replaces `se` for emphasis or when governed by a preposition. Distinguishing these four `se` functions is a hallmark of C1 fluency.',
  forms: [
    { label: 'True reflexive', hr: 'umivati se / oblačiti se', en: 'to wash / dress oneself' },
    { label: 'Reciprocal', hr: 'voljeti se / vidjeti se', en: 'to love / see each other' },
    {
      label: 'Middle (passive)',
      hr: 'knjiga se prodaje / vrata se zatvaraju',
      en: 'is sold / are closed',
    },
    {
      label: 'Inherently reflexive',
      hr: 'smijati se / bojati se / nadati se',
      en: 'to laugh / fear / hope (always with se)',
    },
    {
      label: 'Emphatic sebe',
      hr: 'Voli sebe iznad svega.',
      en: 'He loves himself above all.',
    },
    {
      label: 'sebe with preposition',
      hr: 'razgovarati sa sobom / misliti na sebe',
      en: 'to talk to oneself / think about oneself',
    },
    {
      label: 'Clitic placement (Wackernagel)',
      hr: 'Smijem se. — Marko se smije.',
      en: 'I am laughing. — Marko is laughing.',
    },
  ],
  examples: [
    {
      hr: 'Ujutro se umivam hladnom vodom.',
      en: 'In the morning I wash myself with cold water.',
      note: 'TRUE reflexive: subject = patient. `se` is the unstressed reflexive clitic.',
    },
    {
      hr: 'Vidjeli su se na koncertu.',
      en: 'They saw each other at the concert.',
      note: 'RECIPROCAL: plural subject + `se` = "each other". Without context could also mean "they saw themselves", but the reciprocal reading is default with plural humans.',
    },
    {
      hr: 'Ta se knjiga prodaje već godinama.',
      en: 'That book has been selling for years.',
      note: 'MIDDLE / passive `se`: `knjiga` is the patient promoted to subject; no overt agent.',
    },
    {
      hr: 'Smijem se tvojoj šali.',
      en: 'I am laughing at your joke.',
      note: 'INHERENTLY reflexive: `smijati se` always carries `se`. There is no verb `*smijati` without it.',
    },
    {
      hr: 'Voli sebe iznad svega.',
      en: 'He loves himself above all.',
      note: 'EMPHATIC `sebe` (full pronoun) instead of clitic `se`. Use sebe when contrasting or stressing the reflexive.',
    },
    {
      hr: 'Često razgovara sama sa sobom.',
      en: 'She often talks to herself.',
      note: 'After preposition `sa`, the clitic form is impossible — must use full instrumental `sobom`.',
    },
  ],
  tips: [
    'Four functions of `se`: TRUE reflexive (umivati se), RECIPROCAL (vidjeti se), MIDDLE/passive (prodaje se), INHERENTLY reflexive (smijati se, bojati se). Ask: "is the subject also the patient? are there two parties? is this a middle voice? is this lexically frozen?"',
    'Some verbs ONLY exist with `se`: smijati se, bojati se, nadati se, brinuti se, sjećati se, čuditi se. There is no version without `se`.',
    'Use full `sebe` (acc./gen.) or `sebi` (dat./loc.) or `sobom` (ins.) for EMPHASIS or after PREPOSITIONS: `sa sobom`, `o sebi`, `na sebe`, `za sebe`. Clitic `se` cannot follow a preposition.',
    '`se` is a second-position clitic — Wackernagel position. It cluster with other clitics in a fixed order: `je/sam/etc → mu/joj/mi → ga/je/ih → se`. Example: `Marko mu se nasmijao` ("Marko laughed at him").',
    'Verbs like `voljeti` (transitive) and `voljeti se` (reciprocal/reflexive) are formally distinct: `Marko voli Anu` (active) vs `Marko i Ana se vole` (reciprocal) vs `Marko voli sebe` (true reflexive, emphatic).',
  ],
  drills: [
    {
      q: 'Identify the function of `se`: "Knjiga se prodaje dobro."',
      qEn: 'The book sells well.',
      opts: ['true reflexive', 'reciprocal', 'middle / passive', 'inherently reflexive'],
      correct: 2,
      explain:
        'MIDDLE / passive `se`: `knjiga` is the patient promoted to subject; no overt agent. Common in Croatian everyday speech for the passive.',
    },
    {
      q: 'Identify the function of `se`: "Smijem se tvojoj šali."',
      qEn: 'I am laughing at your joke.',
      opts: ['true reflexive', 'reciprocal', 'middle / passive', 'inherently reflexive'],
      correct: 3,
      explain:
        '`smijati se` is INHERENTLY reflexive — there is no `*smijati` without `se`. The `se` is lexically frozen.',
    },
    {
      q: 'Which sentence requires `sebe` (NOT `se`)?',
      opts: ['Marko ____ umiva.', 'Razgovara sa ____ .', 'Vidjeli ____ jučer.', 'Ne ____ smijem.'],
      correct: 1,
      explain:
        'After a preposition (`sa`), the clitic `se` is impossible — must use instrumental `sobom` (full form): `sa sobom`.',
    },
    {
      q: '"Voli ____ iznad svega" (emphatic):',
      qEn: 'He loves himself above all.',
      opts: ['se', 'sebe', 'sobom', 'sebi'],
      correct: 1,
      explain:
        'EMPHATIC reflexive uses full `sebe` (acc.). Clitic `se` would be neutral and harder to stress.',
    },
    {
      q: 'Which is RECIPROCAL ("each other")?',
      opts: ['On se brije.', 'Pas se boji.', 'Marko i Ana se vole.', 'Knjiga se čita.'],
      correct: 2,
      explain:
        'Plural human subject + `se` = reciprocal. A is true reflexive; B is inherently reflexive; D is middle/passive.',
    },
    {
      q: 'Which verb is INHERENTLY reflexive (must always carry `se`)?',
      opts: ['umivati', 'voljeti', 'bojati', 'pisati'],
      correct: 2,
      explain:
        '`bojati se` ("to fear") never appears without `se`. The others can be transitive without `se`.',
    },
  ],
};

export const WORD_ORDER = {
  id: 'word-order',
  cefr: 'C1',
  title: 'Red riječi — Complex Word Order',
  subtitle: 'Clitic placement, topicalization, fronting for emphasis',
  focus: 'word order, red rijeci, clitic placement, topicalization, fronting, second position',
  intro:
    'Croatian word order is famously "free" — but this freedom is governed by strict rules. Unstressed clitics (sam, si, je, smo, ste, su, bih/bi, ću/ćeš, me/te/ga/je/nas/vas/ih, mi/ti/mu/joj/nam/vam/im, se, li) must occupy the SECOND POSITION of their clause (Wackernagel\'s Law) and follow a fixed internal order. Sentence-initial elements carry topic / contrastive prominence: fronting an object marks contrast, fronting an adverbial backgrounds the action. Mastery of word order is the single most discriminating marker between competent B2 speakers and fluent C1 speakers — and the source of more written-Croatian mistakes than any other phenomenon.',
  forms: [
    {
      label: 'Clitic cluster order',
      hr: 'li → je/sam/etc → mi/ti/mu/joj → ga/je/ih → se',
      en: 'fixed internal order',
    },
    {
      label: 'Neutral SVO',
      hr: 'Marko je dao Ani knjigu.',
      en: 'Marko gave Ana the book.',
    },
    {
      label: 'Topicalized object',
      hr: 'Knjigu je Marko dao Ani.',
      en: 'The book, Marko gave to Ana.',
    },
    {
      label: 'Question with li',
      hr: 'Je li Marko došao?',
      en: 'Has Marko arrived?',
    },
    {
      label: 'Three clitics together',
      hr: 'Ja sam mu je dao.',
      en: 'I gave it to him.',
    },
    {
      label: 'Subordinate clause',
      hr: '… da mu ga je dao …',
      en: '… that he gave it to him …',
    },
    {
      label: 'Wrong (clitic-initial)',
      hr: '✗ Mu sam dao knjigu.',
      en: 'WRONG — clitic cannot be first.',
    },
  ],
  examples: [
    {
      hr: 'Ja sam mu to dala.',
      en: 'I gave that to him.',
      note: 'Neutral: subject `ja` fills position 1; clitics `sam mu` follow in position 2; `to dala` continues.',
    },
    {
      hr: 'Dala sam mu to ja.',
      en: 'I (and not someone else) gave that to him.',
      note: 'Subject `ja` postposed for CONTRASTIVE emphasis. The verb starts the clause; clitics follow in second position.',
    },
    {
      hr: 'Knjigu sam mu dala.',
      en: 'The book — that is what I gave him.',
      note: 'Object `knjigu` fronted as TOPIC / contrast; clitics `sam mu` still in second position.',
    },
    {
      hr: 'Je li ti Marko to rekao?',
      en: 'Did Marko tell you that?',
      note: '`li` opens the clitic cluster in yes/no questions; `je li ti` = clitic chain (3sg `je`, particle `li`, dat. `ti`).',
    },
    {
      hr: 'Rekao sam ti da mu ga je dao.',
      en: 'I told you that he gave it to him.',
      note: 'Each clause has its own second-position cluster: main `sam ti`; subordinate `mu ga je` (after `da`).',
    },
    {
      hr: 'Jučer mu je Marko dao knjigu.',
      en: 'Yesterday Marko gave him the book.',
      note: 'Adverb `jučer` in position 1 (topical setting); clitics `mu je` in position 2; subject `Marko` follows.',
    },
  ],
  tips: [
    'Clitics MUST be second-position. The first position can be any phrase (subject, object, adverb, fronted PP) — but it cannot be empty, and clitics cannot lead the clause.',
    'Fixed clitic order: (1) `li` → (2) auxiliary `je/sam/si/smo/ste/su/bih/bi/ću` → (3) dative pronoun `mi/ti/mu/joj/nam/vam/im` → (4) accusative pronoun `me/te/ga/je/nas/vas/ih` → (5) reflexive `se`. The 3sg `je` is exceptional and moves to the END of the cluster (`mu ga je dao`, not `je mu ga dao`).',
    'Topicalization: fronting an object (`Knjigu sam mu dala`) marks contrast or theme. Fronting an adverb (`Jučer sam ga vidio`) sets the scene. SVO is the unmarked / neutral order.',
    'After conjunctions like `da`, `kad`, `ako`, `što`, the clitic cluster snaps to the position right after the conjunction: `da mu ga je dao`, NOT `da dao mu ga je`.',
    'A common error: putting a clitic in first position — `*Mu sam dao knjigu` is ungrammatical. Always front a non-clitic element first.',
  ],
  drills: [
    {
      q: 'Which sentence has CORRECT clitic placement?',
      opts: [
        'Mu sam dao knjigu.',
        'Sam mu dao knjigu.',
        'Dao sam mu knjigu.',
        'Dao mu sam knjigu.',
      ],
      correct: 2,
      explain:
        'Clitics `sam mu` must be in second position. `Dao` opens the clause; `sam mu` follows; `knjigu` ends it. Options A and B start with a clitic; D has wrong internal order.',
    },
    {
      q: 'Choose the correct clitic order: "Ja ____ to dala."',
      qEn: 'I gave that to him.',
      opts: ['mu sam', 'sam mu', 'mu je', 'sam ga'],
      correct: 1,
      explain: 'Internal order: auxiliary `sam` → dative `mu`. So `sam mu` (NOT `mu sam`).',
    },
    {
      q: 'Where does `je` (3sg of biti) go in a clitic cluster?',
      opts: [
        'first in the cluster',
        'second in the cluster',
        'at the end of the cluster',
        'it never combines',
      ],
      correct: 2,
      explain:
        '3sg `je` is the EXCEPTION — it moves to the end of the cluster: `mu ga je dao`, not `*je mu ga dao`.',
    },
    {
      q: 'After `da`, where do the clitics go?',
      opts: [
        'before `da`',
        'immediately after `da`',
        'at the end of the clause',
        'optional, any position',
      ],
      correct: 1,
      explain:
        'After conjunctions like `da`, `kad`, `ako`, the clitic cluster comes RIGHT AFTER the conjunction: `da mu ga je dao`.',
    },
    {
      q: 'Choose the topicalized version of "Marko je dao Ani knjigu" emphasizing the BOOK:',
      opts: [
        'Marko je Ani dao knjigu.',
        'Knjigu je Marko dao Ani.',
        'Ani je Marko dao knjigu.',
        'Dao je Marko Ani knjigu.',
      ],
      correct: 1,
      explain:
        'Fronting `knjigu` (the object) puts it in TOPIC / contrastive position. Clitic `je` still occupies second position.',
    },
    {
      q: 'In "Je li ti Marko to rekao?", what is the role of `li`?',
      opts: [
        'it is the verb',
        'it is the subject',
        'it is a yes/no question particle in the clitic cluster',
        'it is an object pronoun',
      ],
      correct: 2,
      explain:
        '`li` is a yes/no question particle that opens the clitic cluster. Order here: `je li ti` = aux `je` + `li` + dat. `ti`.',
    },
  ],
};

// Aggregated array — all 10 SP9 units (5 B2 + 5 C1).
export const ADVANCED_UNITS = [
  FUTUR_II,
  RELATIVE_CLAUSES,
  PASSIVE_VOICE,
  PARTICIPLES,
  REPORTED_SPEECH,
  KONDICIONAL_II,
  BUSINESS_REGISTER,
  VERBAL_NOUNS,
  REFLEXIVE_CONSTRUCTIONS,
  WORD_ORDER,
];

// O(1) lookup by id for GrammarUnitDetail.
export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
