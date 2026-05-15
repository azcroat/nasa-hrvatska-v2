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

// Aggregated array — Tasks 2-3 will extend this to all 10 units.
export const ADVANCED_UNITS = [
  FUTUR_II,
  RELATIVE_CLAUSES,
  PASSIVE_VOICE,
  PARTICIPLES,
  REPORTED_SPEECH,
];

// O(1) lookup by id for GrammarUnitDetail.
export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
