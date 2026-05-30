// Hero data — level palettes, quick-reply pools (grammar/culture/motivate),
// contextual knight bubbles, and daily hero scenes. Extracted from HeroSection
// as part of the 1c decomposition. Data only, no logic.

export const LEVEL_PALETTE = [
  {
    grad: 'linear-gradient(135deg,#92400e,#b45309)',
    light: '#fef3c7',
    text: '#92400e',
    border: '#fcd34d',
  },
  {
    grad: 'linear-gradient(135deg,#065f46,#059669)',
    light: '#d1fae5',
    text: '#065f46',
    border: '#6ee7b7',
  },
  {
    grad: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
    light: '#dbeafe',
    text: '#1e3a8a',
    border: '#93c5fd',
  },
  {
    grad: 'linear-gradient(135deg,#4c1d95,#6d28d9)',
    light: '#ede9fe',
    text: '#4c1d95',
    border: '#c4b5fd',
  },
  {
    grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    light: '#fee2e2',
    text: '#7f1d1d',
    border: '#fca5a5',
  },
  {
    grad: 'linear-gradient(135deg,#134e4a,#0d9488)',
    light: '#ccfbf1',
    text: '#134e4a',
    border: '#5eead4',
  },
  {
    grad: 'linear-gradient(135deg,#1e1b4b,#3730a3)',
    light: '#e0e7ff',
    text: '#1e1b4b',
    border: '#a5b4fc',
  },
];

export const QUICK_GRAMMAR = [
  {
    mood: 'thinking',
    text: 'Verb aspect: "piti" (drink, ongoing) vs "popiti" (drink, finished). This one distinction is the heart of Croatian. Master it and you\'ll sound native.',
  },
  {
    mood: 'thinking',
    text: 'Seven cases — but three do most of the work. Nominative (subject), Accusative (object), Dative (giving to someone). Start there.',
  },
  {
    mood: 'thinking',
    text: 'Clitic pronouns always land in second position. "Volim te" — never "Te volim." Your brain resists at first. Repetition wins.',
  },
  {
    mood: 'thinking',
    text: '"Grad" is masculine, "zemlja" is feminine, "more" is neuter. Adjectives change form to match. The patterns click faster than you think.',
  },
  {
    mood: 'thinking',
    text: 'Infinitives end in -ti or -ći. "Ići" (go), "raditi" (work), "moći" (be able). These three roots unlock hundreds of verb forms.',
  },
  {
    mood: 'thinking',
    text: 'Verb aspect in practice: "Pišem pismo" means I\'m in the middle of writing. "Napisao sam pismo" means I finished it. Two verbs, one action, different lens.',
  },
  {
    mood: 'thinking',
    text: 'Croatian cases signal meaning, not word order. "Pas grize čovjeka" and "Čovjeka grize pas" both mean the dog bites the man — the endings tell you who does what.',
  },
  {
    mood: 'thinking',
    text: 'The reflexive "se" turns many verbs into themselves: "zvati" (to call someone) vs "zvati se" (to call oneself, i.e. to be named). Your name: zovem se.',
  },
  {
    mood: 'thinking',
    text: 'Future tense: "ću + infinitive." Ja ću raditi = I will work. Short forms: radit ću. Both correct — and both sound Croatian.',
  },
  {
    mood: 'thinking',
    text: 'Negation in Croatian: "ne" + verb. "Ne govorim" (I don\'t speak). But with "nema" (there is no), the noun shifts to genitive: "Nema vremena." No time.',
  },
  {
    mood: 'thinking',
    text: 'Conditional mood: "bih, bi, bi, bismo, biste, bi." Ja bih volio — I would like. Essential for polite requests. Softer than the imperative.',
  },
  {
    mood: 'thinking',
    text: 'Diminutives abound in Croatian: "brat" (brother) → "bratić" (little brother / cousin). "Kuća" → "kućica". Warmth is built into the grammar.',
  },
  {
    mood: 'thinking',
    text: 'The genitive of negation: when a verb is negated, its object shifts from accusative to genitive. "Vidim psa" → "Ne vidim psa." Watch the ending change.',
  },
  {
    mood: 'thinking',
    text: '"Moći" (can/be able) is one of the most useful verbs. Mogu, možeš, može, možemo, možete, mogu. Learn this conjugation and open 100 sentences.',
  },
  {
    mood: 'thinking',
    text: 'Adjective agreement: every adjective matches its noun in gender, case, and number. "Lijep grad" (masc.) vs "Lijepa žena" (fem.) vs "Lijepo more" (neut.).',
  },
  {
    mood: 'thinking',
    text: 'Word order is flexible but the clitic rule is iron: the clitic cluster always lands after the first stressed unit. "Marko mu je dao knjigu" — not "Marko je mu dao."',
  },
  {
    mood: 'thinking',
    text: 'Vocative case: used when calling or addressing. "Marko!" becomes "Marko!" but "prijatelj" becomes "prijatelju!" and "doktore!" Rules, but learnable ones.',
  },
];
export const QUICK_CULTURE = [
  {
    mood: 'happy',
    text: '"Cravat" comes from "Hrvat" — Croatian soldiers introduced the necktie to Europe in the 17th century. Croatia gave the world fashion.',
  },
  {
    mood: 'happy',
    text: 'The Pula Arena is one of the six largest Roman amphitheatres still standing — built in 27 BC. Concerts happen inside it every summer.',
  },
  {
    mood: 'happy',
    text: 'Hvar gets 2,726 sunshine hours per year — more than Barcelona. The lavender fields bloom in June.',
  },
  {
    mood: 'happy',
    text: 'Nikola Tesla was born in Smiljan, Croatia. He rewired how the entire world uses electricity.',
  },
  {
    mood: 'happy',
    text: "The Za Križen procession in Hvar has run every year for 500 years — torchlight, 8 villages, all night. One of Europe's oldest living traditions.",
  },
  {
    mood: 'happy',
    text: 'Dalmatian dogs are named after Dalmatia. One coastal region gave a breed to the entire world. Small country, vast influence.',
  },
  {
    mood: 'happy',
    text: 'Klapa — unaccompanied Dalmatian folk harmony — is UNESCO intangible heritage. It sounds like the sea, the stone, and 500 years of memory.',
  },
  {
    mood: 'happy',
    text: 'The Croatian city of Dubrovnik was founded in the 7th century. It maintained independence for 450 years through diplomacy alone. Wit beat swords.',
  },
  {
    mood: 'happy',
    text: 'Marco Polo was (probably) born on Korčula. The man who connected East and West may have spoken Croatian as his first language.',
  },
  {
    mood: 'happy',
    text: 'The Baška Tablet (1100 AD) is one of the oldest inscriptions in Croatian Glagolitic script. Carved in stone — language outlasting empires.',
  },
  {
    mood: 'happy',
    text: 'Rakija is the national spirit — lozovača (grape), šljivovica (plum), travarica (herb). To share rakija is to share trust.',
  },
  {
    mood: 'happy',
    text: 'The Sinjska Alka — a jousting competition in Sinj — has run every August since 1715. It celebrates defeating the Ottomans. UNESCO heritage.',
  },
  {
    mood: 'happy',
    text: "Ivan Meštrović is considered Croatia's greatest sculptor. His work stands in the Vatican, in Washington D.C., and across the Croatian coast.",
  },
  {
    mood: 'happy',
    text: 'The White Guard in Dubrovnik and Split — dressed identically so no opponent can know which family is which. Equality through uniform tradition.',
  },
  {
    mood: 'happy',
    text: "Croatia has 8 UNESCO World Heritage Sites — Diocletian's Palace, Dubrovnik's Old City, Plitvice, Šibenik cathedral, and more. Per capita, remarkable.",
  },
  {
    mood: 'happy',
    text: 'The Adriatic coast has over 1,200 islands. Fewer than 50 are permanently inhabited. The rest are wilderness, pine, and sea.',
  },
  {
    mood: 'happy',
    text: 'The word "dalmatinac" means someone with an unshakeable connection to the sea and stone. Not just geography — a state of soul.',
  },
];
export const QUICK_MOTIVATE = [
  {
    mood: 'encouraged',
    text: "Polako, ali sigurno — slowly but surely. Every session compounds. You're not where you started.",
  },
  {
    mood: 'victory',
    text: "Luka Modrić grew up in a refugee hotel during the war and won the Ballon d'Or. Grit beats talent every time.",
  },
  {
    mood: 'ready',
    text: "Janica Kostelić broke her leg twice and still won four Olympic golds. A setback doesn't end the story.",
  },
  {
    mood: 'happy',
    text: '5 million Croatian speakers worldwide. With every session you get measurably closer to joining them.',
  },
  {
    mood: 'encouraged',
    text: "Svaki dan po malo — a little every day. Fluency isn't a single moment. It's an accumulation. Today just added to yours.",
  },
  {
    mood: 'victory',
    text: 'Goran Ivanišević was ranked 125th in the world and got a wildcard into Wimbledon 2001. He won the whole thing. Show up anyway.',
  },
  {
    mood: 'ready',
    text: "The hardest part of learning any language isn't grammar or vocabulary. It's the day you don't feel like showing up. That's today's test.",
  },
  {
    mood: 'encouraged',
    text: 'Svaka čast — respect is earned. Every lesson you complete earns a little more. Keep going.',
  },
  {
    mood: 'happy',
    text: 'The Croatian word for practice is "vježba." You\'re doing it right now. Vježbaj svaki dan — practice every day.',
  },
  {
    mood: 'victory',
    text: 'Dražen Petrović became one of the best basketball players in history playing in Zagreb. Local roots, world-class results. Same principle applies here.',
  },
  {
    mood: 'encouraged',
    text: "Language learning has a long plateau and a sudden cliff. You're climbing. The cliff is closer than it looks.",
  },
  {
    mood: 'ready',
    text: "\"Tko ne riskira, ne profitira.\" Who doesn't risk, doesn't gain. Speak imperfectly — that's how you get better.",
  },
  {
    mood: 'happy',
    text: 'Your first real conversation in Croatian will feel like lightning. Every word you learn today is one more in the bank for that moment.',
  },
  {
    mood: 'encouraged',
    text: "Marko Polo left Korčula and mapped the world. You're mapping a language. Both journeys start with a single step — or word.",
  },
  {
    mood: 'victory',
    text: 'The Croatian national team finished 2nd at the 2018 World Cup — population of 4 million. Punch above your weight. Learn the language.',
  },
  {
    mood: 'ready',
    text: "Hajde! The word has no perfect English translation. It's forward momentum. Let's go. Come on. Now. That energy, every day.",
  },
  {
    mood: 'encouraged',
    text: "Repetition isn't failure. It's the technique. Every master of Croatian you've ever heard reviewed the same words fifty times before they stuck.",
  },
];
export const CONTEXTUAL_POOL = [
  {
    mood: 'happy',
    text: '"Cravat" — the necktie — comes from "Hrvat" (Croatian). You already gave the world something. Now take the language back.',
  },
  {
    mood: 'thinking',
    text: 'Croatian verb aspect — piti vs popiti, učiti vs naučiti. Same action, different lens. Master this and you sound native.',
  },
  {
    mood: 'happy',
    text: 'Split, Dubrovnik, Rovinj, Zadar — every city sounds more magical when you understand what the name means.',
  },
  {
    mood: 'encouraged',
    text: '"Lijepa naša" — Our beautiful homeland. First line of the Croatian anthem. Learn enough and you\'ll mean it when you sing it.',
  },
  {
    mood: 'happy',
    text: 'Marco Polo was (probably) born on Korčula. Adventure has always run through Croatian veins. Today, set sail.',
  },
  {
    mood: 'happy',
    text: 'The Dalmatian dog is named after Dalmatia. One small region — a breed the whole world knows. Small nation, big footprint.',
  },
  {
    mood: 'thinking',
    text: 'Clitic pronouns cluster in a precise order: auxiliary → dative → accusative → se. Tricky to learn, immensely satisfying to master.',
  },
  {
    mood: 'encouraged',
    text: 'Polako, ali sigurno — slowly but surely. The Croatian phrase for exactly what language learning requires.',
  },
  {
    mood: 'ready',
    text: '5 million Croatian speakers worldwide. With every session, you get measurably closer to joining them.',
  },
  {
    mood: 'happy',
    text: 'Rakija flows in Dalmatia. Your sessions flow here. Both burn a little at first and get smoother with time.',
  },
  {
    mood: 'celebrating',
    text: "Hajduk Split's fans are called Torcida — most passionate supporters in the Balkans. Channel that energy into today's lesson.",
  },
  {
    mood: 'encouraged',
    text: "Croatian diaspora spans six continents. Wherever you are, you're part of something bigger than one small country.",
  },
  {
    mood: 'thinking',
    text: "Croatian has been written in the same script since Gaj's 1830 reform. One alphabet, perfectly logical. No exceptions.",
  },
  {
    mood: 'happy',
    text: "Diocletian's Palace in Split was built in 305 AD — and people still live inside it. Croatians don't abandon things that work. Neither should you.",
  },
  {
    mood: 'happy',
    text: "Luka Modrić grew up in a hotel for refugees during the war. Won the Ballon d'Or. Croatian grit is real. Channel some today.",
  },
  {
    mood: 'thinking',
    text: '7 cases. 2 verb aspects. 3 genders. It sounds like a lot — and it is. But it means you can say exactly what you mean. Always.',
  },
  {
    mood: 'encouraged',
    text: "Svaki dan po malo — a little every day. That's all it takes. Today's little bit is right here.",
  },
  {
    mood: 'happy',
    text: 'Summer in Croatia: lavender from Hvar, rosemary from stone walls, salt from the Adriatic. Learn the words. Then go live them.',
  },
  {
    mood: 'happy',
    text: '"Koliko jezika znaš, toliko vrijediš." You\'re worth as many people as languages you speak.',
  },
  {
    mood: 'thinking',
    text: 'The word "cravat" is Croatian. So is the concept of the necktie. So is Nikola Tesla\'s birthplace. Small country, enormous legacy.',
  },
];

// ── Daily rotating hero backgrounds ──────────────────────────────────────────
export const HERO_SCENES = [
  { img: 'dubrovnik-hero', label: 'Dubrovnik, Hrvatska', position: '35%' },
  { img: 'zagreb', label: 'Zagreb, Hrvatska', position: '40%' },
  { img: 'plitvice', label: 'Plitvička jezera', position: '50%' },
  { img: 'dalmatian-coast', label: 'Dalmatinska obala', position: '40%' },
  { img: 'labin', label: 'Labin, Istra', position: '45%' },
  { img: 'croatian-food', label: 'Hrvatska kuhinja', position: '40%' },
  { img: 'rabac', label: 'Rabac, Istra', position: '45%' },
];
