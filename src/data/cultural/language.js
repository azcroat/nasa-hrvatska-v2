// language.js
export const DIALECTS = {
  intro: 'Croatian has three main dialects named after how they say \u0027what\u0027:',
  types: [
    {
      name: 'Štokavski',
      what: 'Što?',
      region: 'Standard Croatian, most of Croatia, all of Bosnia',
      desc: 'The basis for standard Croatian. Used in schools, media, and official settings. If you learn standard Croatian, you\u0027re learning Štokavski.',
      color: '#0e7490',
    },
    {
      name: 'Kajkavski',
      what: 'Kaj?',
      region: 'Zagreb and northwestern Croatia (Zagorje)',
      desc: 'Spoken in and around Zagreb. Sounds quite different from standard — shorter words, different intonation. Many Zagreb expressions come from Kajkavski.',
      color: '#7c3aed',
    },
    {
      name: 'Čakavski',
      what: 'Ča?',
      region: 'Istria, Kvarner, Dalmatian islands',
      desc: 'The coastal dialect. Heard on islands and in Istria. Has Italian influences and archaic Croatian forms. Very different vocabulary from standard.',
      color: '#b45309',
    },
  ],
  examples: [
    { en: 'What?', std: 'Što?', kaj: 'Kaj?', cak: 'Ča?' },
    { en: 'What are you doing?', std: 'Što radiš?', kaj: 'Kaj delaš?', cak: 'Ča činiš?' },
    { en: 'Where?', std: 'Gdje?', kaj: 'Gde? / Kam?', cak: 'Di?' },
    { en: 'I don\u0027t know', std: 'Ne znam', kaj: 'Neznam / Nevem', cak: 'Ne znan' },
    { en: 'House', std: 'Kuća', kaj: 'Hiža', cak: 'Kaša / Kuća' },
    { en: 'Boy', std: 'Dječak', kaj: 'Deček', cak: 'Mulac' },
    { en: 'Beautiful', std: 'Lijep', kaj: 'Lep', cak: 'Lip' },
    { en: 'Bread', std: 'Kruh', kaj: 'Kruh', cak: 'Kru(h)' },
  ],
  chakavianNote:
    "Čakavian (Čakavski) is the dialect of the Adriatic coast — Istria, Kvarner, and the Dalmatian islands. It preserves many archaic Croatian features and shows Italian/Venetian influence (words like 'škulj' for hole, 'šufit' for attic from Italian 'soffitto'). If you visit Hvar, Brač, Vis, or Rovinj, locals may speak Čakavian at home. You don't need to speak it, but recognizing it prevents confusion. Key markers: 'ča' for 'what', 'di' for 'gdje/where', 'more' still means sea, 'znan' for 'znam'. Čakavian poems by writers like Tin Ujević are considered some of the most beautiful Croatian literature.",
  heritageNote:
    'Heritage speakers (diaspora Croatian) often mix Štokavian grammar with vocabulary frozen from the 1960s-1990s emigration wave, anglicisms, or regional forms from Dalmatia/Slavonia. Common heritage patterns: older vocabulary (auto instead of automobil), German/Australian English loanwords, simplified case system. If your Croatian comes from family, you may speak naturally but make systematic errors in formal cases — especially genitive plural. This is normal and fixable.',
  mutualIntelligibility:
    'All three dialects are mutually intelligible with effort, but Kajkavian and Čakavian can sound very foreign to a Štokavian speaker at first. Standard Croatian is always understood across all regions. Serbian is essentially mutually intelligible with Croatian — grammatically identical, vocabulary differs especially in loanwords (Serbian uses more Slavic/Russian roots; Croatian uses Latin/German).',
};
export const SHADOWING = [
  {
    hr: 'Dobro jutro! Kako ste?',
    en: 'Good morning! How are you?',
    tip: 'Formal greeting — ste is formal/plural',
  },
  {
    hr: 'Gdje je najbliža ljekarna?',
    en: 'Where is the nearest pharmacy?',
    tip: 'Asking directions — gdje = where',
  },
  {
    hr: 'Molim vas, možete li mi pomoći?',
    en: 'Please, can you help me?',
    tip: 'Polite request — molim vas = please (formal)',
  },
  {
    hr: 'Koliko košta taj kruh?',
    en: 'How much does that bread cost?',
    tip: 'Shopping — koliko košta = how much does it cost',
  },
  {
    hr: 'Trebam kartu za Split.',
    en: 'I need a ticket for Split.',
    tip: 'Travel vocabulary — trebam = I need',
  },
  {
    hr: 'Nisam razumio. Možete li ponoviti?',
    en: "I didn't understand. Can you repeat?",
    tip: 'Clarification — essential phrase for learners',
  },
  {
    hr: 'Volim Hrvatsku i njezin jezik.',
    en: 'I love Croatia and its language.',
    tip: 'Possessive — njezin = its/her (for feminine noun)',
  },
  {
    hr: 'Ona svaki dan uči hrvatski.',
    en: 'She studies Croatian every day.',
    tip: 'Daily routine — svaki dan = every day',
  },
  {
    hr: 'Djeca se igraju na plaži.',
    en: 'Children are playing on the beach.',
    tip: 'Reflexive verb — igrati se = to play',
  },
  {
    hr: 'Jesi li već večerao?',
    en: 'Have you had dinner yet?',
    tip: 'Perfect tense question — jesi li = have you',
  },
  {
    hr: 'Sutra ćemo ići u kino.',
    en: 'Tomorrow we will go to the cinema.',
    tip: 'Future tense — ćemo ići = we will go',
  },
  {
    hr: 'Ova kava je jako dobra.',
    en: 'This coffee is very good.',
    tip: 'Gender agreement — ova (fem.) kava (fem.)',
  },
  {
    hr: 'Mogu li platiti karticom?',
    en: 'Can I pay by card?',
    tip: 'Instrumental case — karticom = by card',
  },
  {
    hr: 'Rezervirao sam stol za dvoje.',
    en: 'I reserved a table for two.',
    tip: 'Past tense — rezervirao sam = I reserved',
  },
  {
    hr: 'Ne razumijem, govorite li engleski?',
    en: "I don't understand, do you speak English?",
    tip: 'Essential learner phrase',
  },
  {
    hr: "Kako se kaže 'hello' na hrvatskom?",
    en: "How do you say 'hello' in Croatian?",
    tip: 'Asking for translation',
  },
  {
    hr: 'Imam rezervaciju na ime Smith.',
    en: 'I have a reservation under the name Smith.',
    tip: 'Hotel/restaurant vocabulary',
  },
  {
    hr: 'Koja je razlika između tih dvaju vina?',
    en: 'What is the difference between those two wines?',
    tip: 'Genitive plural — dvaju = of two (genitive dual)',
  },
];
