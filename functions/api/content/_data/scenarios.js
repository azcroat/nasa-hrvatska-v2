// scenarios.js — pure data, no imports needed
export const SCHOOL = {
  grading: {
    title: 'Croatian Grading (1-5)',
    desc: '5=odličan (excellent), 4=vrlo dobar (very good), 3=dobar (good), 2=dovoljan (sufficient), 1=nedovoljan (fail). Opposite of US!',
  },
  classroom: [
    ['udžbenik', 'textbook'],
    ['bilježnica', 'notebook'],
    ['olovka', 'pencil'],
    ['gumica', 'eraser'],
    ['ruksak', 'backpack'],
    ['raspored', 'schedule'],
    ['ocjena', 'grade'],
    ['zadatak', 'assignment'],
    ['domaća zadaća', 'homework'],
    ['ispit', 'exam'],
    ['sat', 'class/period'],
    ['odmor', 'break/recess'],
    ['učionica', 'classroom'],
    ['ploča', 'blackboard'],
    ['računalo', 'computer'],
    ['učitelj/učiteljica', 'teacher (m/f)'],
    ['ravnatelj', 'principal'],
    ['razred', 'grade/class'],
    ['svjedočba', 'report card'],
    ['izostanak', 'absence'],
  ],
  subjects: [
    ['matematika', 'math'],
    ['hrvatski jezik', 'Croatian'],
    ['engleski jezik', 'English'],
    ['biologija', 'biology'],
    ['kemija', 'chemistry'],
    ['fizika', 'physics'],
    ['povijest', 'history'],
    ['geografija', 'geography'],
    ['glazbeni', 'music'],
    ['likovni', 'art'],
    ['tjelesni', 'PE/gym'],
    ['informatika', 'IT'],
    ['vjeronauk', 'religion'],
  ],
  phrases: [
    ['Mogu li ići na WC?', 'Can I go to the bathroom?'],
    ['Oprostite, ne razumijem.', "Sorry, I don't understand."],
    ['Možete li ponoviti?', 'Can you repeat?'],
    ['Kako se to kaže na hrvatskom?', 'How do you say that in Croatian?'],
    ['Imam pitanje.', 'I have a question.'],
    ['Koji sat imamo sljedeći?', 'What class next?'],
    ['Kada je odmor?', 'When is break?'],
    ['Možete li mi pomoći?', 'Can you help me?'],
  ],
  formal:
    "Always use 'Vi' (formal) with teachers. Say 'Dobar dan' entering, 'Doviđenja' leaving. Stand when teacher enters.",
};
export const TEXTING = [
  { slang: 'di si?', means: 'Where are you?', ctx: 'Most common greeting' },
  { slang: 'ej / ej bog', means: 'Hey', ctx: 'Casual opener' },
  { slang: 'ajde', means: "Come on / Let's go", ctx: 'Used constantly' },
  { slang: 'ajmo', means: "Let's go (group)", ctx: 'Inviting friends' },
  { slang: 'nmvz', means: 'Nema veze = No worries', ctx: 'Text abbreviation' },
  { slang: 'nzm', means: 'Ne znam = IDK', ctx: 'Text abbreviation' },
  { slang: 'ful', means: 'Very/Really', ctx: "'Ful je dobro'" },
  { slang: 'kul', means: 'Cool', ctx: 'Borrowed from English' },
  { slang: 'stv?', means: 'Stvarno? = Really?', ctx: 'Surprise' },
  { slang: 'ekipa', means: 'The crew/squad', ctx: 'Friend group' },
  { slang: 'ma daj', means: 'Oh come on', ctx: 'Disbelief' },
  { slang: 'sve pet', means: 'All good', ctx: "Everything's fine" },
  { slang: 'čujemo se', means: 'Talk soon', ctx: 'Phone/text goodbye' },
  { slang: 'vidimo se', means: 'See you', ctx: 'In-person goodbye' },
  { slang: 'pošalji lokaciju', means: 'Send location', ctx: 'Meeting up' },
];
export const FRIENDS = [
  { hr: 'Ej, ja sam [name]. Ti?', en: "Hey, I'm [name]. You?" },
  { hr: 'Koji razred si?', en: 'What grade are you in?' },
  { hr: 'Imaš li Instagram?', en: 'Do you have Instagram?' },
  { hr: 'Igraš li košarku?', en: 'Do you play basketball?' },
  { hr: 'Hoćeš sjesti s nama?', en: 'Want to sit with us?' },
  { hr: 'Idemo van na odmoru?', en: 'Going outside for break?' },
  { hr: 'Došao sam iz Amerike.', en: 'I came from America.' },
  { hr: 'Došao/Došla sam iz Australije.', en: 'I came from Australia.' },
  { hr: 'Živim u Melbourneu.', en: 'I live in Melbourne.' },
  { hr: 'Došao/Došla sam iz Kanade.', en: 'I came from Canada.' },
  { hr: 'Živim u Torontu.', en: 'I live in Toronto.' },
  { hr: 'Moji su podrijetlom iz Dalmacije.', en: 'My family is originally from Dalmatia.' },
  { hr: 'Učim hrvatski zbog svog partnera.', en: "I'm learning Croatian because of my partner." },
  { hr: 'Još učim hrvatski, oprosti.', en: 'Still learning Croatian, sorry.' },
  { hr: 'Možeš li mi pomoći?', en: 'Can you help me with this?' },
  { hr: 'Hoćemo na sladoled?', en: 'Want ice cream?' },
  { hr: 'Koji ti je najdraži predmet?', en: 'Favorite subject?' },
  { hr: 'Ideš li na trening?', en: 'Going to practice?' },
  { hr: 'Dodaj me na Insta.', en: 'Add me on Insta.' },
];
export const FOODORDER = {
  bakery: {
    title: 'U Pekari',
    items: [
      ['burek sa sirom', 'cheese burek'],
      ['burek s mesom', 'meat burek'],
      ['pizza kriška', 'pizza slice'],
      ['kroasan', 'croissant'],
      ['kifla', 'roll'],
      ['kruh', 'bread'],
    ],
    phrases: ['Dajte mi jedan burek, molim.', 'Koliko košta?', 'To je sve, hvala.'],
  },
  fastfood: {
    title: 'Ćevapdžinica',
    items: [
      ['ćevapi', 'grilled sausages'],
      ['pljeskavica', 'burger patty'],
      ['ražnjići', 'skewers'],
      ['pomfrit', 'fries'],
      ['lepinja', 'flatbread'],
      ['ajvar', 'pepper spread'],
    ],
    phrases: ['Molim deset ćevapa u lepinji.', 'S ajvarom i lukom.', 'Za van.', 'Za ovdje.'],
  },
  icecream: {
    title: 'Sladoled',
    items: [
      ['čokolada', 'chocolate'],
      ['vanilija', 'vanilla'],
      ['jagoda', 'strawberry'],
      ['pistacija', 'pistachio'],
      ['limun', 'lemon'],
      ['šumsko voće', 'forest fruit'],
    ],
    phrases: ['Mogu li dvije kuglice?', 'U kornetu ili čašici?', 'Kornet, molim.'],
  },
  restaurant: {
    phrases: [
      ['Račun, molim.', 'Bill please.'],
      ['Mogu li platiti karticom?', 'Can I pay by card?'],
      ['Dnevni meni, molim.', 'Daily menu please.'],
      ['Što preporučate?', 'What do you recommend?'],
      ['Alergičan sam na...', "I'm allergic to..."],
    ],
    tip: 'Tipping: not mandatory, 10% appreciated. Round up or leave small change.',
  },
};
export const TRANSPORT = [
  { hr: 'Gdje je autobusna stanica?', en: 'Where is the bus station?' },
  { hr: 'Ide li ovaj bus do centra?', en: 'Does this bus go to center?' },
  { hr: 'Jednu kartu, molim.', en: 'One ticket please.' },
  { hr: 'Koja je sljedeća stanica?', en: "What's the next stop?" },
  { hr: 'Gdje moram sići?', en: 'Where do I get off?' },
  { hr: 'Trebam presjedati?', en: 'Do I need to transfer?' },
  { hr: 'Možete me odvesti do...?', en: 'Can you take me to...? (taxi)' },
  { hr: 'Koliko košta do aerodroma?', en: 'How much to the airport?' },
  { hr: 'Tramvaj broj pet.', en: 'Tram number five.' },
  { hr: 'Zadržite ostatak.', en: 'Keep the change.' },
];
export const EMERGENCY = {
  number: '112 — Hitna pomoć (Emergency)',
  phrases: [
    ['Trebam pomoć!', 'I need help!'],
    ['Zovite hitnu!', 'Call ambulance!'],
    ['Boli me glava.', 'Head hurts.'],
    ['Boli me trbuh.', 'Stomach hurts.'],
    ['Imam temperaturu.', 'I have fever.'],
    ['Slomio sam ruku.', 'I broke my arm.'],
    ['Alergičan sam na...', "I'm allergic to..."],
    ['Gdje je najbliža bolnica?', 'Nearest hospital?'],
    ['Gdje je ljekarna?', "Where's pharmacy?"],
    ['Ne osjećam se dobro.', "I don't feel well."],
    ['Možete li nazvati roditelje?', 'Call my parents?'],
  ],
  bodyParts: [
    ['glava', 'head'],
    ['oko', 'eye'],
    ['uho', 'ear'],
    ['nos', 'nose'],
    ['zub', 'tooth'],
    ['grlo', 'throat'],
    ['leđa', 'back'],
    ['ruka', 'arm'],
    ['noga', 'leg'],
    ['trbuh', 'stomach / belly'],
    ['prsa', 'chest'],
    ['koljeno', 'knee'],
  ],
  phoneNumbers: [
    ['112', 'Emergency'],
    ['192', 'Police'],
    ['193', 'Fire'],
    ['194', 'Ambulance'],
  ],
};
export const FOOTBALL = {
  vocab: [
    ['gol', 'goal'],
    ['lopta', 'ball'],
    ['sudac', 'referee'],
    ['korner', 'corner'],
    ['jedanaesterac', 'penalty'],
    ['poluvrijeme', 'half-time'],
    ['golman', 'goalkeeper'],
    ['napadač', 'striker'],
    ['veznjak', 'midfielder'],
    ['navijači', 'fans'],
    ['utakmica', 'match'],
    ['prvenstvo', 'championship'],
    ['liga', 'league'],
    ['derbi', 'derby'],
  ],
  teams: [
    { name: 'Dinamo Zagreb', desc: 'Most successful Croatian club. 24+ titles.', color: '#003da5' },
    {
      name: 'Hajduk Split',
      desc: "The people's club. Passionate Torcida ultras.",
      color: '#1e3a5f',
    },
    {
      name: 'Vatreni',
      desc: 'National team. 2018 WC finalists, 2022 3rd place!',
      color: '#dc2626',
    },
    { name: 'Rijeka', desc: 'Strong coastal club.', color: '#1e3a5f' },
  ],
  waterPolo: [
    ['vaterpolo', 'water polo'],
    ['bazen', 'pool'],
    ['golman', 'goalkeeper'],
    ['igrač', 'player'],
    ['Jug Dubrovnik', 'Top Croatian WP club'],
    ['Mladost Zagreb', 'Historic WP powerhouse'],
  ],
  commentary: [
    ['zabiti gol', 'to score a goal'],
    ['šutirati', 'to shoot'],
    ['driblati', 'to dribble'],
    ['blokirati', 'to block'],
    ['asistirati', 'to assist'],
    ['izgubiti loptu', 'to lose the ball'],
    ['slobodni udarac', 'free kick'],
    ['žuti karton', 'yellow card'],
    ['crveni karton', 'red card'],
    ['ofsajd', 'offside'],
    ['VAR', 'video assistant referee'],
    ['penali', 'penalty shootout'],
    ['produžeci', 'extra time'],
    ['navijačka pjesma', 'supporter song'],
    ['baklja', 'flare (at matches)'],
    ['Kauboji', 'The Cowboys (handball team nickname)'],
    ['rukomet', 'handball — Croatia 2003 & 2023 World Champions'],
  ],
};
export const PRACTICAL = {
  oib: {
    title: 'OIB — Osobni identifikacijski broj',
    desc: 'Personal ID number (like SSN). 11 digits. Needed for EVERYTHING: bank, school, doctor, phone. Get at police station (MUP).',
  },
  mbo: {
    title: 'MBO — Matični broj osiguranika',
    desc: 'Health insurance number. Get from HZZO. Required for doctor visits.',
  },
  documents: [
    ['osobna iskaznica', 'ID card'],
    ['putovnica', 'passport'],
    ['boravak', 'residence permit'],
    ['prijava boravišta', 'address registration'],
    ['zdravstvena iskaznica', 'health card'],
    ['IBAN', 'bank account'],
  ],
  customs: [
    {
      rule: 'Birthday treats',
      desc: 'Birthday PERSON buys treats for everyone — not the other way around!',
    },
    { rule: 'Name days', desc: "Croatians celebrate saint's name day. 'Sretan imendan!'" },
    {
      rule: 'Home visits',
      desc: 'Bring wine/cake/flowers. Shoes off. You WILL be fed. Refusing is rude.',
    },
    {
      rule: 'Greeting',
      desc: "Kiss both cheeks (friends). Handshake (formal). Say 'Dobar dan' in shops.",
    },
    { rule: 'Sunday', desc: 'Most shops CLOSED on Sundays. Grocery shop Saturday.' },
    {
      rule: 'Kava culture',
      desc: "'Ići na kavu' can last 2 hours. It's socializing, not just caffeine.",
    },
    {
      rule: 'Bura & Jugo',
      desc: 'Bura=cold north wind. Jugo=warm south wind everyone blames for tiredness.',
    },
    { rule: 'Fjaka', desc: "Dalmatian art of doing nothing. Not laziness — it's a lifestyle." },
  ],
  schoolCalendar:
    'School: Sept to mid-June. Christmas break (2wks), semester (Feb 1wk), Easter (1wk), summer (late June-early Sept).',
  phoneNumbers: [
    ['112', 'Emergency'],
    ['192', 'Police'],
    ['193', 'Fire'],
    ['194', 'Ambulance'],
  ],
};
export const RESTCONV = [
  { waiter: 'Dobar dan! Imate li rezervaciju?', you: 'Nemamo. Imate li slobodan stol?' },
  { waiter: 'Naravno! Stol za koliko osoba?', you: 'Stol za četvero, molim.' },
  { waiter: 'Izvolite jelovnik!', you: 'Hvala! Što možete preporučiti?' },
  { waiter: 'Preporučujem zagrebački odrezak.', you: 'Uzet ću to! I jednu salatu, molim.' },
  { waiter: 'Hoćete li nešto za popiti?', you: 'Jednu kavu s mlijekom i sok od naranče.' },
  { waiter: 'Je li sve u redu?', you: 'Da, hvala. Sve je izvrsno!' },
  { waiter: 'Želite li desert?', you: 'Da, palačinke s čokoladom, molim.' },
  { waiter: 'Izvolite!', you: 'Molim Vas račun!' },
  { waiter: 'Kako plaćate?', you: 'Karticom, molim.' },
];
export const GROCERY = {
  stores: [
    { name: 'Konzum', desc: 'Largest Croatian chain. Everywhere.', color: '#dc2626' },
    { name: 'Lidl', desc: 'German discount chain. Great prices.', color: '#003da5' },
    { name: 'Spar', desc: 'Austrian chain. Mid-range quality.', color: '#16a34a' },
    { name: 'Plodine', desc: 'Croatian-owned. Regional favorite.', color: '#f59e0b' },
    { name: 'Kaufland', desc: 'Large hypermarkets.', color: '#dc2626' },
    { name: 'Tommy', desc: 'Dalmatian chain. Great local products.', color: '#0e7490' },
  ],
  brands: [
    ['Dukat', 'Dairy — milk, yogurt, cheese'],
    ['Podravka', 'Soups, sauces, Vegeta seasoning'],
    ['Kraš', 'Chocolate, Baška cookies, Napolitanke'],
    ['Vindija', 'Dairy & juice brand'],
    ['Jamnica', 'Mineral water — most popular'],
    ['Cedevita', 'Vitamin drink powder — iconic'],
    ['Franck', 'Coffee brand — every Croatian drinks it'],
    ['Zvijezda', 'Oils, mayo, ketchup'],
    ['Gavrilović', 'Salami, kulen, meat products'],
    ['PIK Vrbovec', 'Processed meats'],
    ['Ledo', 'Ice cream & frozen food'],
    ['Koestlin', 'Cookies & crackers'],
    ['Jana', 'Premium water brand'],
    ['Dorina', 'Chocolate bars (by Kraš)'],
  ],
  vocab: [
    ['mlijeko', 'milk'],
    ['kruh', 'bread'],
    ['jaja', 'eggs'],
    ['sir', 'cheese'],
    ['maslac', 'butter'],
    ['jogurt', 'yogurt'],
    ['brašno', 'flour'],
    ['ulje', 'oil'],
    ['sol', 'salt'],
    ['papar', 'pepper'],
    ['šećer', 'sugar'],
    ['riža', 'rice'],
    ['tjestenina', 'pasta'],
    ['piletina', 'chicken'],
    ['svinjetina', 'pork'],
    ['govedina', 'beef'],
    ['riba', 'fish'],
    ['voće', 'fruit'],
    ['povrće', 'vegetables'],
    ['voda', 'water'],
    ['sok', 'juice'],
    ['pivo', 'beer'],
    ['vino', 'wine'],
    ['vrećica', 'bag'],
    ['blagajna', 'checkout'],
    ['popust', 'discount'],
    ['račun', 'receipt'],
    ['deka', '100g (ordering unit)'],
  ],
  phrases: [
    ['Dajte mi 20 deka kulena.', 'Give me 200g of kulen.'],
    ['Imate li vrećicu?', 'Do you have a bag?'],
    ['Gdje je mlijeko?', 'Where is the milk?'],
    ['Koliko košta?', 'How much does it cost?'],
    ['Mogu li platiti karticom?', 'Can I pay by card?'],
    ['Jeste li član?', 'Are you a member? (loyalty card)'],
    ['Na akciji je.', "It's on sale."],
    ['Dva za jedan.', 'Two for one.'],
  ],
};
export const RECIPES = [
  {
    name: 'Palačinke',
    en: 'Croatian Crepes',
    time: 20,
    servings: 4,
    ing: [
      ['250g', 'brašno (flour)'],
      ['2', 'jaja (eggs)'],
      ['300ml', 'mlijeko (milk)'],
      ['1 žličica', 'sol (salt)'],
      ['ulje', 'za prženje (for frying)'],
      ['Nutella/džem', 'za punjenje (filling)'],
    ],
    steps: [
      'Pomiješaj brašno, jaja, mlijeko i sol. (Mix flour, eggs, milk, salt.)',
      'Ostavi 15 minuta. (Rest 15 min.)',
      'Zagrij tavu s malo ulja. (Heat pan with oil.)',
      'Ulij tanki sloj tijesta. (Pour thin layer of batter.)',
      'Peči 1-2 minute po strani. (Cook 1-2 min per side.)',
      'Posluži s Nutellom ili džemom! (Serve with Nutella or jam!)',
    ],
  },
  {
    name: 'Ćevapi',
    en: 'Grilled Meat Sausages',
    time: 30,
    servings: 4,
    ing: [
      ['500g', 'mljeveno meso (ground beef/lamb mix)'],
      ['1', 'luk (onion, grated)'],
      ['2 češnja', 'bijeli luk (garlic)'],
      ['1 žličica', 'sol'],
      ['1/2 žličice', 'papar'],
      ['1 žličica', 'vegeta'],
    ],
    steps: [
      'Pomiješaj sve sastojke. (Mix all ingredients.)',
      'Stavi u hladnjak 2 sata. (Refrigerate 2 hours.)',
      'Oblikuj ćevape — 8cm dugi. (Shape into 8cm rolls.)',
      'Peči na roštilju 3-4 min po strani. (Grill 3-4 min per side.)',
      'Posluži u lepinji s lukom i ajvarom! (Serve in flatbread with onion & ajvar!)',
    ],
  },
  {
    name: 'Fritule',
    en: 'Croatian Donuts',
    time: 40,
    servings: 6,
    ing: [
      ['300g', 'brašno'],
      ['2', 'jaja'],
      ['50g', 'šećer (sugar)'],
      ['200ml', 'mlijeko'],
      ['1 vrećica', 'prašak za pecivo (baking powder)'],
      ['korica', 'limuna (lemon zest)'],
      ['rum', 'po želji (optional)'],
      ['grožđice', 'raisins'],
      ['ulje', 'za prženje'],
      ['prah šećer', 'powdered sugar'],
    ],
    steps: [
      'Pomiješaj brašno, šećer i prašak. (Mix dry ingredients.)',
      'Dodaj jaja, mlijeko, koricu limuna, rum. (Add wet ingredients.)',
      'Umiješaj grožđice. (Fold in raisins.)',
      'Zagrij ulje na 170°C. (Heat oil to 170°C.)',
      'Žlicom stavljaj tijesto u ulje. (Drop spoonfuls into oil.)',
      'Prži dok ne postanu zlatne. (Fry until golden.)',
      'Pospi prah šećerom! (Dust with powdered sugar!)',
    ],
  },
  {
    name: 'Štrukli',
    en: 'Zagreb Cheese Pastry',
    time: 60,
    servings: 6,
    ing: [
      ['400g', 'brašno'],
      ['1', 'jaje'],
      ['200ml', 'mlaka voda (warm water)'],
      ['2 žlice', 'ulje'],
      ['500g', 'svježi sir (fresh cheese/cottage)'],
      ['2', 'jaja (for filling)'],
      ['200ml', 'kiselo vrhnje (sour cream)'],
      ['sol', 'po okusu'],
    ],
    steps: [
      'Zamijesi tijesto od brašna, jajeta, vode i ulja. (Knead dough.)',
      'Odmori 30 minuta. (Rest 30 min.)',
      'Razvuci tijesto vrlo tanko. (Stretch dough paper-thin.)',
      'Pomiješaj sir, jaja, vrhnje i sol. (Mix filling.)',
      'Rasporedi nadjev po tijestu. (Spread filling on dough.)',
      'Zamotaj u roladu i reži. (Roll up and cut pieces.)',
      'Peci 40 min na 180°C ili kuhaj 15 min. (Bake 40min at 180°C or boil 15min.)',
    ],
  },
  {
    name: 'Sarma',
    en: 'Stuffed Cabbage Rolls',
    time: 180,
    servings: 8,
    ing: [
      ['1', 'kiseli kupus (sauerkraut head)'],
      ['500g', 'mljeveno meso'],
      ['100g', 'riža'],
      ['1', 'luk'],
      ['2 češnja', 'bijeli luk'],
      ['sol, papar, vegeta', 'začini'],
      ['200g', 'suha rebra / slanina (smoked ribs/bacon)'],
    ],
    steps: [
      'Odvoji listove kiselog kupusa. (Separate sauerkraut leaves.)',
      'Pomiješaj meso, rižu, luk, češnjak, začine. (Mix filling.)',
      'Stavi punjenje na list i zamotaj. (Place filling, roll tightly.)',
      'Posloži sarme u lonac s kupusom. (Layer rolls in pot with sauerkraut.)',
      'Dodaj suha rebra i vodu. (Add smoked meat and water.)',
      'Kuhaj na laganoj vatri 3 sata. (Simmer 3 hours!)',
      'Sarma je još bolja sutradan! (Even better next day!)',
    ],
  },
];
export const ROLEPLAY = [
  {
    title: 'U Školi — First Day',
    en: 'At School — Meeting Teacher',
    lines: [
      {
        speaker: 'Učiteljica',
        text: 'Dobar dan! Dobro došli u naš razred.',
        en: 'Good day! Welcome to our class.',
      },
      {
        speaker: 'Ti',
        text: 'Dobar dan, učiteljice. Hvala.',
        en: 'Good day, teacher. Thank you.',
        you: true,
      },
      { speaker: 'Učiteljica', text: 'Kako se zoveš?', en: 'What is your name?' },
      {
        speaker: 'Ti',
        text: 'Zovem se [ime]. Ja sam iz Amerike.',
        en: 'My name is [name]. I am from America.',
        you: true,
      },
      { speaker: 'Učiteljica', text: 'Govoriš li hrvatski?', en: 'Do you speak Croatian?' },
      {
        speaker: 'Ti',
        text: 'Malo. Još učim. Oprostite ako pogriješim.',
        en: 'A little. Still learning. Sorry if I make mistakes.',
        you: true,
      },
      {
        speaker: 'Učiteljica',
        text: 'Nema problema! Sjedi ovdje, pored Ivana.',
        en: 'No problem! Sit here, next to Ivan.',
      },
      {
        speaker: 'Ti',
        text: 'Hvala! Koji sat imamo prvi?',
        en: 'Thanks! What class do we have first?',
        you: true,
      },
    ],
  },
  {
    title: 'Kod Doktora',
    en: 'At the Doctor',
    lines: [
      {
        speaker: 'Ti',
        text: 'Dobar dan. Trebam pregled.',
        en: 'Good day. I need an examination.',
        you: true,
      },
      {
        speaker: 'Doktor',
        text: 'Dobar dan. Što vas muči?',
        en: "Good day. What's troubling you?",
      },
      {
        speaker: 'Ti',
        text: 'Boli me grlo i imam temperaturu.',
        en: 'My throat hurts and I have a fever.',
        you: true,
      },
      { speaker: 'Doktor', text: 'Koliko dugo?', en: 'How long?' },
      { speaker: 'Ti', text: 'Tri dana.', en: 'Three days.', you: true },
      {
        speaker: 'Doktor',
        text: 'Jeste li alergični na nešto?',
        en: 'Are you allergic to anything?',
      },
      {
        speaker: 'Ti',
        text: 'Ne, nisam alergičan/alergična.',
        en: "No, I'm not allergic. (m/f)",
        you: true,
      },
      {
        speaker: 'Doktor',
        text: 'Prepisat ću vam antibiotik. Idite u ljekarnu.',
        en: "I'll prescribe antibiotics. Go to the pharmacy.",
      },
      {
        speaker: 'Ti',
        text: 'Hvala, doktore. Doviđenja.',
        en: 'Thank you, doctor. Goodbye.',
        you: true,
      },
    ],
  },
  {
    title: 'U Banci',
    en: 'At the Bank',
    lines: [
      {
        speaker: 'Ti',
        text: 'Dobar dan. Želim otvoriti račun.',
        en: 'Good day. I want to open an account.',
        you: true,
      },
      {
        speaker: 'Službenik',
        text: 'Svakako. Imate li osobnu iskaznicu?',
        en: 'Of course. Do you have an ID card?',
      },
      { speaker: 'Ti', text: 'Imam putovnicu i OIB.', en: 'I have a passport and OIB.', you: true },
      {
        speaker: 'Službenik',
        text: 'Trebat će vam prijava boravišta.',
        en: "You'll need address registration.",
      },
      {
        speaker: 'Ti',
        text: 'Imam. Evo dokumenta.',
        en: "I have it. Here's the document.",
        you: true,
      },
      {
        speaker: 'Službenik',
        text: 'Odlično. Želite li karticu?',
        en: 'Excellent. Do you want a card?',
      },
      {
        speaker: 'Ti',
        text: 'Da, molim. I internetsko bankarstvo.',
        en: 'Yes please. And internet banking.',
        you: true,
      },
    ],
  },
  {
    title: 'Kod Susjeda',
    en: 'Meeting the Neighbors',
    lines: [
      { speaker: 'Susjed', text: 'Bog! Vi ste novi susjedi?', en: "Hi! You're the new neighbors?" },
      {
        speaker: 'Ti',
        text: 'Da! Ja sam [ime]. Drago mi je.',
        en: "Yes! I'm [name]. Nice to meet you.",
        you: true,
      },
      { speaker: 'Susjed', text: 'Odakle ste?', en: 'Where are you from?' },
      {
        speaker: 'Ti',
        text: 'Iz Amerike. Obitelj mi je iz Hercegovine.',
        en: 'From America. My family is from Herzegovina.',
        you: true,
      },
      {
        speaker: 'Susjed',
        text: 'Super! Dođite na kavu sutra.',
        en: 'Great! Come for coffee tomorrow.',
      },
      { speaker: 'Ti', text: 'Rado! U koliko sati?', en: 'Gladly! What time?', you: true },
      { speaker: 'Susjed', text: 'U deset. I dovedite djecu!', en: 'At ten. And bring the kids!' },
      { speaker: 'Ti', text: 'Hvala! Donosim kolač.', en: "Thanks! I'll bring cake.", you: true },
    ],
  },
  {
    title: 'Roditeljski Sastanak',
    en: 'Parent-Teacher Conference',
    lines: [
      {
        speaker: 'Ti',
        text: 'Dobar dan. Ja sam mama/tata od [ime].',
        en: "Good day. I'm [name]'s mom/dad.",
        you: true,
      },
      { speaker: 'Učiteljica', text: 'Dobar dan! Sjednite.', en: 'Good day! Have a seat.' },
      {
        speaker: 'Ti',
        text: 'Kako napreduje moje dijete?',
        en: 'How is my child progressing?',
        you: true,
      },
      {
        speaker: 'Učiteljica',
        text: 'Vrlo dobro! Marljivo radi.',
        en: 'Very well! Works diligently.',
      },
      {
        speaker: 'Ti',
        text: 'Ima li problema s jezikom?',
        en: 'Any problems with the language?',
        you: true,
      },
      {
        speaker: 'Učiteljica',
        text: 'Malo, ali svaki dan je bolje.',
        en: 'A little, but every day is better.',
      },
      {
        speaker: 'Ti',
        text: 'Trebamo li vježbati nešto kod kuće?',
        en: 'Should we practice anything at home?',
        you: true,
      },
      {
        speaker: 'Učiteljica',
        text: 'Čitanje na hrvatskom bi puno pomoglo.',
        en: 'Reading in Croatian would help a lot.',
      },
    ],
  },
  {
    title: 'Na Razgovoru za Posao',
    en: 'Job Interview',
    lines: [
      {
        speaker: 'Voditelj HR-a',
        text: 'Dobar dan! Sjednite. Hvala što ste došli.',
        en: 'Good day! Have a seat. Thank you for coming.',
      },
      {
        speaker: 'Ti',
        text: 'Hvala na pozivu. Drago mi je što sam ovdje.',
        en: "Thank you for the invitation. I'm glad to be here.",
        you: true,
      },
      {
        speaker: 'Voditelj HR-a',
        text: 'Recite mi nešto o sebi i svom iskustvu.',
        en: 'Tell me something about yourself and your experience.',
      },
      {
        speaker: 'Ti',
        text: 'Imam tri godine iskustva u marketingu. Radio/la sam na nekoliko velikih projekata.',
        en: 'I have three years of experience in marketing. I have worked on several large projects.',
        you: true,
      },
      {
        speaker: 'Voditelj HR-a',
        text: 'Zašto ste zainteresirani za ovu poziciju?',
        en: 'Why are you interested in this position?',
      },
      {
        speaker: 'Ti',
        text: 'Vaša tvrtka ima odličnu reputaciju i posao odgovara mojim vještinama.',
        en: 'Your company has an excellent reputation and the job matches my skills.',
        you: true,
      },
      {
        speaker: 'Voditelj HR-a',
        text: 'Koje su vaše snage i slabosti?',
        en: 'What are your strengths and weaknesses?',
      },
      {
        speaker: 'Ti',
        text: 'Snaga mi je organiziranost. Slabost — ponekad sam perfekcionist.',
        en: "My strength is organisation. Weakness — I'm sometimes a perfectionist.",
        you: true,
      },
      {
        speaker: 'Voditelj HR-a',
        text: 'Kakva su vaša očekivanja po pitanju plaće?',
        en: 'What are your salary expectations?',
      },
      {
        speaker: 'Ti',
        text: 'Tražim između 1.500 i 1.800 eura neto.',
        en: "I'm asking for between 1,500 and 1,800 euros net.",
        you: true,
      },
      {
        speaker: 'Voditelj HR-a',
        text: 'Odlično. Javit ćemo vam se sljedeći tjedan.',
        en: "Excellent. We'll get back to you next week.",
      },
      {
        speaker: 'Ti',
        text: 'Hvala lijepa. Jedva čekam vašu povratnu informaciju.',
        en: 'Thank you very much. I look forward to your feedback.',
        you: true,
      },
    ],
  },
  {
    title: 'Iznajmljivanje Stana',
    en: 'Renting an Apartment',
    lines: [
      {
        speaker: 'Vlasnik',
        text: 'Dobar dan! Vi ste zainteresirani za stan?',
        en: "Good day! You're interested in the apartment?",
      },
      {
        speaker: 'Ti',
        text: 'Da, vidio/vidjela sam oglas. Mogu li ga pogledati?',
        en: 'Yes, I saw the listing. May I view it?',
        you: true,
      },
      {
        speaker: 'Vlasnik',
        text: 'Naravno. Stan ima 50 kvadrata, dvije sobe i balkon.',
        en: 'Of course. The apartment is 50 square metres, two rooms and a balcony.',
      },
      {
        speaker: 'Ti',
        text: 'Kolika je stanarina na mjesec?',
        en: 'What is the monthly rent?',
        you: true,
      },
      {
        speaker: 'Vlasnik',
        text: '700 eura plus režije. Režije su otprilike 100 eura.',
        en: '700 euros plus utilities. Utilities are about 100 euros.',
      },
      {
        speaker: 'Ti',
        text: 'Je li dopušteno imati kućnog ljubimca?',
        en: 'Is it allowed to have a pet?',
        you: true,
      },
      {
        speaker: 'Vlasnik',
        text: 'Imam mačku. To bi bio problem.',
        en: 'I have a cat. That would be a problem.',
      },
      {
        speaker: 'Ti',
        text: 'Razumijem. Kolika je kaucija?',
        en: 'I understand. What is the deposit?',
        you: true,
      },
      { speaker: 'Vlasnik', text: 'Dvije stanarine unaprijed.', en: "Two months' rent upfront." },
      {
        speaker: 'Ti',
        text: 'Mogu li razmisliti do sutra i javiti vam se?',
        en: 'May I think about it until tomorrow and get back to you?',
        you: true,
      },
    ],
  },
  {
    title: 'Planiranje Izlaska',
    en: 'Planning a Night Out',
    lines: [
      {
        speaker: 'Prijatelj',
        text: 'Ej! Što radimo u petak navečer?',
        en: 'Hey! What are we doing Friday evening?',
      },
      {
        speaker: 'Ti',
        text: 'Nemam planova. Što predlažeš?',
        en: 'I have no plans. What do you suggest?',
        you: true,
      },
      {
        speaker: 'Prijatelj',
        text: 'Moglo bi se izaći na večeru negdje u centru.',
        en: 'We could go out for dinner somewhere in the centre.',
      },
      {
        speaker: 'Ti',
        text: 'Dobra ideja! Ima li neko dobro novo mjesto?',
        en: 'Good idea! Is there a good new place?',
        you: true,
      },
      {
        speaker: 'Prijatelj',
        text: 'Da, otvorio se novi restoran s dalmatinskom hranom na Tkalči.',
        en: 'Yes, a new restaurant with Dalmatian food opened on Tkalča street.',
      },
      {
        speaker: 'Ti',
        text: 'Odlično! Treba li rezervacija?',
        en: 'Excellent! Do we need a reservation?',
        you: true,
      },
      {
        speaker: 'Prijatelj',
        text: 'Vjerojatno da. Mogu ja rezervirati ako hoćeš.',
        en: 'Probably yes. I can make the reservation if you want.',
      },
      {
        speaker: 'Ti',
        text: 'Super, hvala! U koliko sati?',
        en: 'Great, thanks! What time?',
        you: true,
      },
      {
        speaker: 'Prijatelj',
        text: 'Recimo u osam. A poslije bi mogli na piće.',
        en: "Let's say at eight. And afterwards we could go for drinks.",
      },
      {
        speaker: 'Ti',
        text: 'Savršeno! Vidimo se u petak.',
        en: 'Perfect! See you Friday.',
        you: true,
      },
    ],
  },
];
export const BASKETBALL = {
  title: 'Na košarkaškom treningu',
  subtitle: 'At Basketball Practice',
  intro:
    "These are the real phrases a Croatian basketball coach uses on the court. Master these and you'll understand every drill, every play call, every correction.",
  sections: [
    {
      title: 'Osnove treninga',
      en: 'Training Basics',
      icon: '📋',
      phrases: [
        { hr: 'Zagrijavamo se!', en: "We're warming up!", note: 'Start of every practice' },
        { hr: 'Na linije!', en: 'To the lines!', note: 'Go to the baseline/lines' },
        { hr: 'Trčite krug!', en: 'Run a lap!', note: 'Run around the court' },
        { hr: 'Istezanje!', en: 'Stretching!', note: 'Time to stretch' },
        { hr: 'Slobodna baca!', en: 'Free throws!', note: 'Free throw practice' },
        { hr: 'Dribling!', en: 'Dribbling!', note: 'Dribbling drill' },
        { hr: 'Šut na koš!', en: 'Shoot at the basket!', note: 'Shooting drill' },
        { hr: 'Skok lopte!', en: 'Jump ball!', note: 'Tip-off / rebounding' },
        { hr: 'Pauza! Svi ovdje!', en: 'Break! Everyone here!', note: 'Huddle up' },
        { hr: 'Idemo!', en: "Let's go!", note: "Let's go / move it" },
      ],
    },
    {
      title: 'Pozicije i igrači',
      en: 'Positions & Players',
      icon: '🏀',
      phrases: [
        { hr: 'plej (razigravač)', en: 'point guard (PG)' },
        { hr: 'bek (bačker/šuter)', en: 'shooting guard (SG)' },
        { hr: 'mali krilni igrač', en: 'small forward (SF)' },
        { hr: 'krilni centar', en: 'power forward (PF)' },
        { hr: 'centar', en: 'center (C)' },
        { hr: 'starter', en: 'starter' },
        { hr: 'zamjena / rezerva', en: 'substitute / bench player' },
        { hr: 'kapetan', en: 'captain' },
        { hr: 'napadač', en: 'forward' },
        { hr: 'branič', en: 'defender' },
      ],
    },
    {
      title: 'Napadačke naredbe',
      en: 'Offensive Commands',
      icon: '⚡',
      phrases: [
        { hr: 'Napad!', en: 'Offense!', note: 'Switch to attack' },
        { hr: 'Probij!', en: 'Drive to the basket!', note: 'Drive in' },
        { hr: 'Dodaj!', en: 'Pass it!', note: 'Pass the ball' },
        { hr: 'Šutaj!', en: 'Shoot!', note: 'Take the shot' },
        { hr: 'Postavi blok!', en: 'Set a screen!', note: 'Pick / screen' },
        { hr: 'Izlazi na loptu!', en: 'Come to the ball!', note: 'Move toward the ball' },
        { hr: 'Otvori se!', en: 'Get open! / Space out!', note: 'Find open space' },
        { hr: 'Trokica!', en: 'Three-pointer!', note: 'Shoot from three' },
        { hr: 'Polagan napad!', en: 'Slow the offense!', note: 'Slow it down' },
        { hr: 'Brzi napad! Kontra!', en: 'Fast break! Counter!', note: 'Transition offense' },
      ],
    },
    {
      title: 'Obrambene naredbe',
      en: 'Defensive Commands',
      icon: '🛡️',
      phrases: [
        { hr: 'Obrana!', en: 'Defense!', note: 'Switch to defense' },
        { hr: 'Prati svog igrača!', en: 'Mark your man!', note: 'Man-to-man marking' },
        { hr: 'Zona obrana!', en: 'Zone defense!', note: 'Switch to zone' },
        { hr: 'Pritisak!', en: 'Press!', note: 'Full-court press' },
        { hr: 'Blokiraj šut!', en: 'Block the shot!', note: 'Contest the shot' },
        { hr: 'Uzmi skok!', en: 'Get the rebound!', note: 'Grab the board' },
        { hr: 'Kradi loptu!', en: 'Steal the ball!', note: 'Go for the steal' },
        { hr: 'Prati ruke!', en: 'Watch the hands!', note: 'Contest passing lanes' },
        { hr: 'Fauliraš!', en: "You're fouling!", note: "You're committing a foul" },
        { hr: 'Komunicirajte!', en: 'Communicate!', note: 'Talk on defense' },
      ],
    },
    {
      title: 'Pohvale i ispravci',
      en: 'Praise & Corrections',
      icon: '🗣️',
      phrases: [
        { hr: 'Odlično! Bravo!', en: 'Excellent! Well done!' },
        { hr: 'Tako je! To je to!', en: "That's it! That's the one!" },
        { hr: 'Još jednom!', en: 'One more time!' },
        { hr: 'Fokusiraj se!', en: 'Focus!' },
        { hr: 'Ne žuri!', en: "Don't rush!" },
        { hr: 'Glava gore!', en: 'Head up!', note: 'Keep your head up when dribbling' },
        { hr: 'Slušaj me!', en: 'Listen to me!' },
        { hr: 'Pogrešno! Ovako!', en: 'Wrong! Like this!' },
        { hr: 'Budi agresivniji!', en: 'Be more aggressive!' },
        { hr: 'Vjerujem u tebe!', en: 'I believe in you!' },
      ],
    },
    {
      title: 'Utakmica',
      en: 'Game Situations',
      icon: '🏆',
      phrases: [
        { hr: 'Igramo za pobjedu!', en: 'We play to win!' },
        { hr: 'Tajm-aut!', en: 'Time out!' },
        { hr: 'Izmjena!', en: 'Substitution!' },
        { hr: 'Izlazi! Ulazi!', en: 'Come out! Go in!', note: 'Sub off/on' },
        { hr: 'Vodimo! Gubimo!', en: "We're winning! We're losing!" },
        { hr: 'Još dvije minute!', en: 'Two minutes left!' },
        { hr: 'Faul! Osobna greška!', en: 'Foul! Personal foul!' },
        { hr: 'Koš vrijedi!', en: 'Basket counts!' },
        { hr: 'Kraj utakmice!', en: 'End of game!' },
        { hr: 'Pobijedili smo!', en: 'We won!' },
      ],
    },
    {
      title: 'Ključni košarkaški pojmovi',
      en: 'Key Basketball Terms',
      icon: '📖',
      phrases: [
        { hr: 'koš', en: 'basket / shot made' },
        { hr: 'lopta', en: 'ball' },
        { hr: 'teren / parket', en: 'court' },
        { hr: 'koš (obruč)', en: 'hoop / rim' },
        { hr: 'asistencija', en: 'assist' },
        { hr: 'skok (ofenzivni/defenzivni)', en: 'rebound (offensive/defensive)' },
        { hr: 'trica / trojka', en: 'three-pointer' },
        { hr: 'slobodno bacanje', en: 'free throw' },
        { hr: 'dodavanje', en: 'passing' },
        { hr: 'pogreška / prekršaj', en: 'turnover / violation' },
        { hr: 'poluvrijeme', en: 'halftime' },
        { hr: 'produžetak', en: 'overtime' },
        { hr: 'rezultat', en: 'score' },
        { hr: 'dvorana', en: 'gym / hall' },
      ],
    },
  ],
};
export const GYM = {
  title: 'U teretani',
  subtitle: 'At the Gym',
  intro:
    'Essential Croatian vocabulary for the gym — from equipment names to trainer instructions and tracking your workout.',
  sections: [
    {
      title: 'Oprema',
      en: 'Equipment',
      icon: '🏋️',
      phrases: [
        { hr: 'bučica', en: 'dumbbell' },
        { hr: 'bučice (par)', en: 'dumbbells (a pair)' },
        { hr: 'šipka', en: 'barbell' },
        { hr: 'uteg', en: 'weight plate' },
        { hr: 'čučanj stalak', en: 'squat rack' },
        { hr: 'klupaica', en: 'bench' },
        { hr: 'kabel stroj', en: 'cable machine' },
        { hr: 'sprava', en: 'machine' },
        { hr: 'traka za trčanje', en: 'treadmill' },
        { hr: 'bicikl ergometar', en: 'stationary bike' },
        { hr: 'eliptičar', en: 'elliptical' },
        { hr: 'konop za preskakanje', en: 'jump rope' },
        { hr: 'vučna traka / band', en: 'resistance band' },
        { hr: 'lopta za vježbanje', en: 'exercise ball / Swiss ball' },
        { hr: 'stalak za bučice', en: 'dumbbell rack' },
      ],
    },
    {
      title: 'Vježbe',
      en: 'Exercises',
      icon: '💪',
      phrases: [
        { hr: 'čučanj', en: 'squat' },
        { hr: 'mrtvo dizanje', en: 'deadlift' },
        { hr: 'potisak s klupe', en: 'bench press' },
        { hr: 'veslanje', en: 'rowing' },
        { hr: 'zgib', en: 'pull-up' },
        { hr: 'dip', en: 'dip' },
        { hr: 'iskorak', en: 'lunge' },
        { hr: 'plank', en: 'plank' },
        { hr: 'skleka', en: 'push-up' },
        { hr: 'biceps pregib', en: 'bicep curl' },
        { hr: 'triceps ekstenzija', en: 'tricep extension' },
        { hr: 'potisak iznad glave', en: 'overhead press' },
        { hr: 'bočni odručivanje', en: 'lateral raise' },
        { hr: 'pretklon s utegom', en: 'Romanian deadlift' },
        { hr: 'trbušnjak', en: 'crunch / sit-up' },
      ],
    },
    {
      title: 'Dijelovi tijela',
      en: 'Body Parts',
      icon: '🫀',
      phrases: [
        { hr: 'prsa', en: 'chest' },
        { hr: 'leđa', en: 'back' },
        { hr: 'ramena', en: 'shoulders' },
        { hr: 'biceps', en: 'biceps' },
        { hr: 'triceps', en: 'triceps' },
        { hr: 'prednjača / quad', en: 'quadriceps' },
        { hr: 'stražnjača', en: 'glutes / butt' },
        { hr: 'hamstringi', en: 'hamstrings' },
        { hr: 'telad / listovi', en: 'calves' },
        { hr: 'trbuh', en: 'abs / stomach' },
        { hr: 'core', en: 'core' },
        { hr: 'podlaktica', en: 'forearm' },
        { hr: 'trapez', en: 'traps' },
        { hr: 'latissimus / lats', en: 'lats (latissimus dorsi)' },
      ],
    },
    {
      title: 'Trening fraze',
      en: 'Training Phrases',
      icon: '📊',
      phrases: [
        { hr: 'serija', en: 'set' },
        { hr: 'ponavljanje', en: 'repetition / rep' },
        { hr: 'pauza / odmor', en: 'rest / break' },
        { hr: 'zagrijavanje', en: 'warm-up' },
        { hr: 'hlađenje', en: 'cool-down' },
        { hr: 'maksimalna težina', en: 'max weight / 1RM' },
        { hr: 'lagano / srednje / teško', en: 'light / medium / heavy' },
        { hr: 'Koliko serija?', en: 'How many sets?' },
        { hr: 'Koliko ponavljanja?', en: 'How many reps?' },
        { hr: 'Koliko kilograma?', en: 'How many kilograms?' },
        { hr: 'Povećaj težinu!', en: 'Increase the weight!' },
        { hr: 'Smanji težinu!', en: 'Lower the weight!' },
        { hr: 'Radi sporije!', en: 'Go slower!' },
        { hr: 'Drži leđa ravno!', en: 'Keep your back straight!' },
        { hr: 'Dublje! Niže!', en: 'Deeper! Lower!' },
      ],
    },
    {
      title: 'Trener i savjeti',
      en: 'Trainer & Advice',
      icon: '🗣️',
      phrases: [
        { hr: 'Mogu li koristiti ovu spravu?', en: 'Can I use this machine?' },
        { hr: 'Možete li mi pomoći?', en: 'Can you help me?' },
        { hr: 'Pokaži mi kako se radi.', en: "Show me how it's done." },
        { hr: 'Koliko trebam odmarati?', en: 'How long should I rest?' },
        { hr: 'Boli me _____.', en: 'My _____ hurts.' },
        { hr: 'Trebam osigurač.', en: 'I need a spotter.' },
        { hr: 'Jesi li slobodan?', en: 'Are you free? / Is this taken?' },
        { hr: 'Oslobodi spravu.', en: 'Free up the machine.' },
        { hr: 'Vrati utege na mjesto.', en: 'Put the weights back.' },
        { hr: 'Odlično! Još jedna serija!', en: 'Great! One more set!' },
      ],
    },
    {
      title: 'Fitness ciljevi',
      en: 'Fitness Goals',
      icon: '🎯',
      phrases: [
        { hr: 'Želim izgubiti kilograme.', en: 'I want to lose weight.' },
        { hr: 'Želim dobiti mišiće.', en: 'I want to build muscle.' },
        { hr: 'Trebam više snage.', en: 'I need more strength.' },
        { hr: 'Radim na kardiu.', en: "I'm working on cardio." },
        { hr: 'Idem u teretanu svaki dan.', en: 'I go to the gym every day.' },
        { hr: 'Danas treniram noge.', en: "Today I'm training legs." },
        { hr: 'Proteinski šejk', en: 'Protein shake' },
        { hr: 'Oporavljam se.', en: "I'm recovering." },
        { hr: 'Dobio/la sam ozljedu.', en: 'I got injured.' },
        { hr: 'Odmor dan', en: 'Rest day' },
      ],
    },
  ],
};
export const STORIES = [
  {
    title: 'U Kafi\u0107u',
    tEn: 'At the Caf\u00e9',
    cefr: 'A1',
    scenes: [
      {
        text: 'Ulazi\u0161 u kafi\u0107 u centru Zagreba. Konobar ti se smiješi.',
        en: 'You walk into a caf\u00e9 in downtown Zagreb. The waiter smiles at you.',
        choices: [
          { text: 'Naruči kavu', next: 1 },
          { text: 'Pitaj za jelovnik', next: 2 },
        ],
      },
      {
        text: 'Naručuje\u0161 kavu. Konobar pita: \u0027S mlijekom ili bez?\u0027',
        en: 'You order coffee. The waiter asks: \u0027With milk or without?\u0027',
        choices: [
          { text: 'S mlijekom, molim.', next: 3 },
          { text: 'Bez mlijeka, hvala.', next: 3 },
        ],
      },
      {
        text: 'Konobar donosi jelovnik. Vidiš kavu, čaj, kolače i sendviče.',
        en: 'The waiter brings the menu. You see coffee, tea, cakes and sandwiches.',
        choices: [
          { text: 'Želim kavu i kolač.', next: 3 },
          { text: 'Samo čaj, molim.', next: 3 },
        ],
      },
      {
        text: 'Konobar donosi tvoju narud\u017ebu. Ka\u017ee\u0161: \u0027Hvala lijepa!\u0027 On odgovara: \u0027Nema na \u010demu!\u0027 Sjedi\u0161 i u\u017eiva\u0161 u pogledu na trg.',
        en: 'The waiter brings your order. You say: \u0027Thank you!\u0027 He replies: \u0027You\u0027re welcome!\u0027 You sit and enjoy the view of the square.',
        choices: [],
      },
    ],
  },
  {
    title: 'Na Tr\u017enici',
    tEn: 'At the Market',
    cefr: 'A1',
    scenes: [
      {
        text: 'Dolazi\u0161 na Dola\u010dku tr\u017enicu u subotu ujutro. Puna je svje\u017eeg vo\u0107a i povr\u0107a.',
        en: 'You arrive at Dolac market on Saturday morning. It\u0027s full of fresh fruit and vegetables.',
        choices: [
          { text: 'Idi do prodavačice voća', next: 1 },
          { text: 'Idi do standa sa sirom', next: 2 },
        ],
      },
      {
        text: 'Prodava\u010dica ka\u017ee: \u0027Dobar dan! Imamo svje\u017ee jagode, tre\u0161nje i lubenice.\u0027',
        en: 'The seller says: \u0027Good day! We have fresh strawberries, cherries and watermelons.\u0027',
        choices: [
          { text: 'Koliko koštaju jagode?', next: 3 },
          { text: 'Dajte mi kilu trešanja.', next: 3 },
        ],
      },
      {
        text: 'Prodava\u010d sira ka\u017ee: \u0027Probajte na\u0161 doma\u0107i sir! Iz Like je.\u0027',
        en: 'The cheese seller says: \u0027Try our homemade cheese! It\u0027s from Lika.\u0027',
        choices: [
          { text: 'Da, molim! Koliko košta?', next: 3 },
          { text: 'Hvala, samo gledam.', next: 3 },
        ],
      },
      {
        text: 'Kupio/Kupila si sve \u0161to ti treba. Vre\u0107ica je puna. Ka\u017ee\u0161: \u0027Hvala i doviđenja!\u0027 Prodavačica odgovara: \u0027Doviđenja, vidimo se!\u0027',
        en: 'You bought everything you need. Your bag is full. You say: \u0027Thanks and goodbye!\u0027 The seller replies: \u0027Goodbye, see you!\u0027',
        choices: [],
      },
    ],
  },
  {
    title: 'Na Poslu',
    tEn: 'At Work',
    cefr: 'B1',
    scenes: [
      {
        text: "Tvoj šef ulazi u ured i kaže: 'Moraš do petka predati izvješće o projektu. Imaš li pitanja?'",
        en: "Your boss enters the office and says: 'You need to submit the project report by Friday. Do you have any questions?'",
        choices: [
          { text: 'Naravno, sve je jasno.', next: 1 },
          { text: 'Oprostite, do kojeg petka?', next: 2 },
        ],
      },
      {
        text: "Šef kaže: 'Odlično! Ako budeš trebao/trebala pomoć, javi mi se.' Počinješ raditi na izvješću.",
        en: "Boss says: 'Excellent! If you need help, let me know.' You start working on the report.",
        choices: [
          { text: 'Pišeš izvješće sam/sama.', next: 3 },
          { text: 'Pitaš kolegu za savjet.', next: 4 },
        ],
      },
      {
        text: "Šef odgovara: 'Ovog petka, dakle prekosutra. Znaš li koristiti naš softver za izvješća?'",
        en: "Boss replies: 'This Friday, so the day after tomorrow. Do you know how to use our reporting software?'",
        choices: [
          { text: 'Da, naučio/naučila sam ga prošli tjedan.', next: 3 },
          { text: 'Ne baš — možete li mi pokazati?', next: 4 },
        ],
      },
      {
        text: "Napisao/Napisala si izvješće. Šef ga čita i kaže: 'Izvrsno! Sve si objasnio/objasnila jasno. Bravo!'",
        en: "You wrote the report. Your boss reads it and says: 'Excellent! You explained everything clearly. Bravo!'",
        choices: [],
      },
      {
        text: 'Kolega ti pomaže i naučiš novi trik u softveru. Izvješće završavaš na vrijeme. Šef je zadovoljan.',
        en: 'A colleague helps you and you learn a new software trick. You finish the report on time. Your boss is satisfied.',
        choices: [],
      },
    ],
  },
  {
    title: 'Izgubljen/a u Splitu',
    tEn: 'Lost in Split',
    cefr: 'A2',
    scenes: [
      {
        text: 'Hoda\u0161 Splitom ali ne zna\u0161 gdje si. Vidi\u0161 prolaznika i policajca.',
        en: 'You\u0027re walking through Split but don\u0027t know where you are. You see a passerby and a police officer.',
        choices: [
          { text: 'Pitaj prolaznika', next: 1 },
          { text: 'Pitaj policajca', next: 2 },
        ],
      },
      {
        text: 'Kažeš: \u0027Oprostite, gdje je Dioklecijanova palača?\u0027 Prolaznik odgovara: \u0027Idite ravno pa skrenite lijevo kod crkve.\u0027',
        en: 'You say: \u0027Excuse me, where is Diocletian\u0027s Palace?\u0027 The passerby answers: \u0027Go straight then turn left at the church.\u0027',
        choices: [
          { text: 'Hvala! Idem ravno.', next: 3 },
          { text: 'Možete li mi pokazati na karti?', next: 3 },
        ],
      },
      {
        text: 'Policajac ka\u017ee: \u0027Pala\u010da? Vrlo blizu! Pet minuta pe\u0161ice. Pratite ovu ulicu do mora.\u0027',
        en: 'The officer says: \u0027The Palace? Very close! Five minutes on foot. Follow this street to the sea.\u0027',
        choices: [
          { text: 'Hvala puno!', next: 3 },
          { text: 'A gdje je dobra konoba?', next: 3 },
        ],
      },
      {
        text: 'Na\u0161ao/Na\u0161la si Dioklecijanovu pala\u010du! Prekrasna je. Sjeda\u0161 na Rivu i naručuje\u0161 gemišt. Život je lijep.',
        en: 'You found Diocletian\u0027s Palace! It\u0027s stunning. You sit on the Riva and order a gemišt. Life is beautiful.',
        choices: [],
      },
    ],
  },
  {
    title: 'Sastanak s Prijaviteljem',
    tEn: 'Meeting the Landlord',
    cefr: 'B2',
    scenes: [
      {
        text: "Zvonim na vrata stana koji želiš iznajmiti. Otvara ih Tomislav, vlasnik. Kaže: 'Izvolite, uđite. Stan je tek renoviran — mijenjali smo instalacije i parkete.'",
        en: "You ring the doorbell of the apartment you want to rent. Tomislav, the owner, opens it. 'Please come in. The apartment was just renovated — we replaced the plumbing and floors.'",
        choices: [
          { text: 'Prekrasno! Kada bih mogao/mogla uselit?', next: 1 },
          { text: 'Sjajno. Što je uključeno u najam?', next: 2 },
        ],
      },
      {
        text: "Tomislav razmišlja: 'Prošlotjedni stanari izlaze do 15-og. Kad biste mogli doći po ključeve?' Odgovaraš...",
        en: "Tomislav thinks: 'The current tenants leave by the 15th. When could you come for the keys?' You reply...",
        choices: [
          { text: 'Odgovara mi 16-i, ako vam je to u redu.', next: 3 },
          { text: 'Moram provjeriti s poslodavcem — mogu li vas nazvati sutra?', next: 3 },
        ],
      },
      {
        text: "'U najam je uključeno grijanje i voda. Struju i internet sami plaćate.' Pitaš o parkiranju.",
        en: "'Heating and water are included in the rent. You pay electricity and internet yourself.' You ask about parking.",
        choices: [
          { text: 'Ima li parking u blizini?', next: 3 },
          { text: 'Razumijem. A je li dozvoljeno imati kućnog ljubimca?', next: 3 },
        ],
      },
      {
        text: "Tomislav kaže: 'Odlično! Samo trebamo kopiju putovnice i jamčevinu od jednog stanarskog rata. Dogovoreno?' Suglasan/Suglasna si — ugovarate ključeve za sljedeći tjedan.",
        en: "Tomislav says: 'Great! We just need a copy of your passport and a deposit of one month's rent. Agreed?' You agree — you arrange to pick up the keys next week.",
        choices: [],
      },
    ],
  },
  // ── A2 Scenarios ────────────────────────────────────────────────────────────
  {
    title: 'Na Pošti',
    tEn: 'At the Post Office',
    cefr: 'A2',
    scenes: [
      {
        text: 'Ulaziš na poštu. Ima red — čekaš. Konačno si na šalteru. Djelatnik pita: "Izvolite?"',
        en: 'You enter the post office. There is a queue — you wait. Finally you are at the counter. The clerk asks: "How can I help?"',
        choices: [
          { text: 'Želim poslati paket.', next: 1 },
          { text: 'Trebam kupiti marke.', next: 2 },
        ],
      },
      {
        text: 'Djelatnik kaže: "Kamo šaljete?" Odgovaraš: "U Njemačku." On mjeri paket i kaže: "To je petnaest eura."',
        en: 'The clerk says: "Where are you sending it?" You reply: "To Germany." He weighs the package and says: "That is fifteen euros."',
        choices: [
          { text: 'Platit ću karticom, molim.', next: 3 },
          { text: 'Imam li opciju za hitnu dostavu?', next: 3 },
        ],
      },
      {
        text: 'Djelatnik donosi marke. "Koliko komada?" pita. Odgovaraš: "Pet maraka, molim."',
        en: 'The clerk brings the stamps. "How many?" he asks. You reply: "Five stamps, please."',
        choices: [
          { text: 'Koliko stoje sve zajedno?', next: 3 },
          { text: 'Hvala, to je sve.', next: 3 },
        ],
      },
      {
        text: 'Završavaš na pošti. Djelatnik ti daje potvrdu i kaže: "Paket stiže za tri do pet radnih dana." Zahvaljuješ se i izlaziš.',
        en: 'You finish at the post office. The clerk gives you a receipt and says: "The package arrives in three to five business days." You thank him and leave.',
        choices: [],
      },
    ],
  },
  {
    title: 'Kod Liječnika',
    tEn: "At the Doctor's",
    cefr: 'A2',
    scenes: [
      {
        text: 'Ne osjećaš se dobro. Nazivaš ordinaciju i dogovaraš termin. Sljedeći dan sjediš u čekaonici.',
        en: "You don't feel well. You call the clinic and arrange an appointment. The next day you are sitting in the waiting room.",
        choices: [
          { text: 'Ulaziš k liječniku kada te pozovu.', next: 1 },
          { text: 'Pitaš medicinsku sestru: "Koliko dugo ću čekati?"', next: 2 },
        ],
      },
      {
        text: 'Liječnik te pita: "Što vas boli?" Odgovaraš: "Boli me grlo i malo mi je muka."',
        en: 'The doctor asks: "What is hurting you?" You reply: "My throat hurts and I feel a little nauseous."',
        choices: [
          { text: 'I glava me boli već dva dana.', next: 3 },
          { text: 'Imam i temperaturu — 38 stupnjeva.', next: 3 },
        ],
      },
      {
        text: 'Sestra odgovara: "Još oko dvadeset minuta." Sjedaš i čitaš časopis.',
        en: 'The nurse replies: "About twenty more minutes." You sit down and read a magazine.',
        choices: [
          { text: 'Hvala. Čekat ću.', next: 1 },
          { text: 'U redu, pričekat ću vani.', next: 1 },
        ],
      },
      {
        text: 'Liječnik pregledava grlo i kaže: "Upala grla. Propisujem antibiotik. Pijte puno tekućine i odmarajte se." Daje ti recept.',
        en: 'The doctor examines your throat and says: "Throat infection. I am prescribing an antibiotic. Drink plenty of fluids and rest." He gives you a prescription.',
        choices: [],
      },
    ],
  },
  {
    title: 'Kupnja Karte',
    tEn: 'Buying a Ticket',
    cefr: 'A2',
    scenes: [
      {
        text: 'Stojiš pred blagajnom autobusnog kolodvora u Splitu. Trebaš kartu za Dubrovnik.',
        en: 'You are standing at the ticket window of the bus station in Split. You need a ticket to Dubrovnik.',
        choices: [
          { text: 'Jednu kartu za Dubrovnik, molim.', next: 1 },
          { text: 'Kada ide sljedeći autobus za Dubrovnik?', next: 2 },
        ],
      },
      {
        text: '"U jednom smjeru ili povratna?" pita blagajnik. Ti odgovaraš: "U jednom smjeru, molim." "Polazak je u 14:30. Cijena je dvanaest eura."',
        en: '"Single or return?" asks the clerk. You reply: "Single, please." "Departure is at 14:30. The price is twelve euros."',
        choices: [
          { text: 'Uzimam kartu. Evo dvadeset eura.', next: 3 },
          { text: 'Ima li raniji autobus?', next: 3 },
        ],
      },
      {
        text: '"Sljedeći ide u 13:15, ali to je direktni. Ovaj u 14:30 ima jednu postaju." Odabiraš...',
        en: '"The next one goes at 13:15, but it is direct. The 14:30 has one stop." You choose...',
        choices: [
          { text: 'Uzimam onaj u 13:15 — direktni je bolji.', next: 3 },
          { text: 'U redu, uzet ću onaj u 14:30.', next: 3 },
        ],
      },
      {
        text: 'Uzeo/Uzela si kartu. Blagajnik ti daje kusur i kaže: "Peron 4, sretno putovanje!"',
        en: 'You have your ticket. The clerk gives you change and says: "Platform 4, have a good journey!"',
        choices: [],
      },
    ],
  },
  // ── B1 Scenarios ────────────────────────────────────────────────────────────
  {
    title: 'Razgovor s Agentom za Nekretnine',
    tEn: 'Talking to a Real Estate Agent',
    cefr: 'B1',
    scenes: [
      {
        text: "Zoveš agenciju za nekretnine. Agent se javlja: 'Dobar dan, agencija Sunce, izvolite?' Tražiš stan za iznajmljivanje u centru grada.",
        en: "You call a real estate agency. An agent answers: 'Good day, Sunce Agency, how can I help?' You are looking for a rental apartment in the city centre.",
        choices: [
          { text: 'Tražim jednosobni stan, do 500 eura.', next: 1 },
          { text: 'Zanima me dvosobni stan, po mogućnosti namješten.', next: 2 },
        ],
      },
      {
        text: "'Odlično, imamo nekoliko opcija. Jedan stan u Donjem gradu — 45m², namješten, 480 eura s komunalijama. Zanima li vas termin za razgledavanje?'",
        en: "'Excellent, we have a few options. One apartment in Donji grad — 45m², furnished, 480 euros including utilities. Would you like to schedule a viewing?'",
        choices: [
          { text: 'Da, možemo li u srijedu poslijepodne?', next: 3 },
          { text: 'Je li dozvoljeno imati mačku?', next: 3 },
        ],
      },
      {
        text: "'Imamo dvosobni u Maksimiru — 65m², djelomično namješten, 620 eura bez komunalija. Stan je tek renoviran.'",
        en: "'We have a two-bedroom in Maksimir — 65m², partly furnished, 620 euros without utilities. The apartment was recently renovated.'",
        choices: [
          { text: 'Može li se pregovarati o cijeni?', next: 3 },
          { text: 'Kada bi se moglo uselit?', next: 3 },
        ],
      },
      {
        text: "Agent dogovara termin i kaže: 'Možemo vam pokazati oba stana u srijedu od 16 sati. Samo trebamo kopiju vašeg dokumenta za identifikaciju.' Prihvaćaš.",
        en: "The agent arranges a viewing and says: 'We can show you both apartments on Wednesday from 4 pm. We just need a copy of your ID.' You agree.",
        choices: [],
      },
    ],
  },
  {
    title: 'Na Bankovnom Šalteru',
    tEn: 'At the Bank Counter',
    cefr: 'B1',
    scenes: [
      {
        text: 'Ulaziš u banku i uzimeš broj na čekaonici. Broj 47 — tvoj. Na šalteru sjedi referentica.',
        en: 'You enter the bank and take a number from the queue dispenser. Number 47 — yours. At the counter sits a bank clerk.',
        choices: [
          { text: 'Dobar dan. Želim otvoriti tekući račun.', next: 1 },
          { text: 'Trebam napraviti međunarodni transfer.', next: 2 },
        ],
      },
      {
        text: "'Naravno. Trebat ćemo osobnu iskaznicu, OIB i potvrdu o zaposlenju ili stalne adrese.' Imaš sve s tobom.",
        en: "'Of course. We will need your ID, OIB (tax number) and proof of employment or fixed address.' You have everything with you.",
        choices: [
          { text: 'Evo dokumenti. Koliko traje postupak?', next: 3 },
          { text: 'Koji su troškovi vođenja računa?', next: 3 },
        ],
      },
      {
        text: "'Transfer zahtijeva IBAN primatelja i svrhu doznake. Naknada je 5 eura za europske zemlje.' Imaš IBAN.",
        en: "'The transfer requires the recipient's IBAN and the purpose of payment. The fee is 5 euros for European countries.' You have the IBAN.",
        choices: [
          { text: 'U redu, šaljem 200 eura za stanarinu.', next: 3 },
          { text: 'Može li se obaviti putem internetskog bankarstva?', next: 3 },
        ],
      },
      {
        text: "Referentica završava transakciju i kaže: 'Sve je u redu. Potvrda stiže na vašu e-mail adresu.' Zahvaljuješ se i odlaziš.",
        en: "The clerk completes the transaction and says: 'Everything is in order. A confirmation will arrive to your email address.' You thank her and leave.",
        choices: [],
      },
    ],
  },
  {
    title: 'Žalba Stanodavcu',
    tEn: 'Complaint to the Landlord',
    cefr: 'B1',
    scenes: [
      {
        text: 'U stanu koji iznajmljuješ pokvarila se perilica rublja. Naziveš stanodavca Mirka.',
        en: 'The washing machine in your rented apartment has broken down. You call your landlord Mirko.',
        choices: [
          { text: 'Mirko, pokvarila se perilica — ne radi već tri dana.', next: 1 },
          { text: 'Mirko, trebam razgovarati s vama o problemu u stanu.', next: 2 },
        ],
      },
      {
        text: "Mirko odgovara: 'Aha, hvala što ste javili. Je li prikazala neku poruku o grešci?' Ti opišeš što si vidio/vidjela.",
        en: "Mirko replies: 'Ah, thanks for letting me know. Did it show any error message?' You describe what you saw.",
        choices: [
          { text: 'Da, trepćuće je crveno svjetlo i ne odvodi vodu.', next: 3 },
          { text: 'Nema posebne poruke, ali se stroj uopće ne pali.', next: 3 },
        ],
      },
      {
        text: "Mirko pita: 'I u redu, koji je problem?' Objasniš mu s detaljima.",
        en: "Mirko asks: 'Alright, what's the problem exactly?' You explain with details.",
        choices: [
          { text: 'Perilica ne pali i u njoj je mokro rublje.', next: 3 },
          { text: 'Curi voda ispod perilice svaki put kad je pokrenemo.', next: 3 },
        ],
      },
      {
        text: "Mirko kaže: 'Dogovorit ću servisera za prekosutra između 10 i 12 sati. Hoće li vam to odgovarati?' Prihvaćate dogovor.",
        en: "Mirko says: 'I'll arrange a repairman for the day after tomorrow between 10 and 12. Will that work for you?' You accept the arrangement.",
        choices: [],
      },
    ],
  },
  // ── B2 Scenarios ────────────────────────────────────────────────────────────
  {
    title: 'Razgovor o Karijeri',
    tEn: 'Career Discussion',
    cefr: 'B2',
    scenes: [
      {
        text: "Tvoj mentor Ana kaže: 'Vidjela sam oglas za menadžersku poziciju u tvrtki Nexus. Misliš li da si spreman/a?' Razgovarate o opcijama.",
        en: "Your mentor Ana says: 'I saw an ad for a managerial position at Nexus. Do you think you are ready?' You discuss the options.",
        choices: [
          { text: 'Mislim da imam potrebno iskustvo, ali nije mi sigurno.', next: 1 },
          { text: 'Da, upravo sam razmišljao/la o toj opciji.', next: 2 },
        ],
      },
      {
        text: "'Razumljivo. Što te najviše zabrinjava?' Ana sluša pažljivo. Ti odgovaraš...",
        en: "'Understandable. What worries you most?' Ana listens carefully. You reply...",
        choices: [
          { text: 'Nisam siguran/a mogu li upravljati timom od petnaest ljudi.', next: 3 },
          { text: 'Brine me što nemam iskustva s proračunom odjela.', next: 3 },
        ],
      },
      {
        text: "Ana odgovara: 'Dobar instinkt. Preporučujem da razgovaraš s HR-om neformalno, prije nego što apliciraš. Koji su ti dugoročni ciljevi?'",
        en: "Ana replies: 'Good instinct. I recommend talking to HR informally before you apply. What are your long-term goals?'",
        choices: [
          { text: 'Za pet godina bih volio/htjela voditi vlastiti projekt.', next: 3 },
          { text: 'Zanima me menadžment, ali i ostajanje u struci.', next: 3 },
        ],
      },
      {
        text: "Ana zaključuje: 'Neovisno o ovom oglasu, vrijedi se prijaviti — čak i ako ne dobiješ posao, razgovor za posao je dragocjeno iskustvo.' Zahvaljuješ se na savjetu.",
        en: "Ana concludes: 'Regardless of this ad, it is worth applying — even if you don't get the job, the interview is a valuable experience.' You thank her for the advice.",
        choices: [],
      },
    ],
  },
  {
    title: 'Medicinska Konzultacija',
    tEn: 'Medical Consultation',
    cefr: 'B2',
    scenes: [
      {
        text: "Sjediš pred specijalistom — kardiologom dr. Horvat. On pregledava nalaze i kaže: 'Vaši EKG rezultati su uredni, ali krvni tlak mi je malo uznemirujući.'",
        en: "You are sitting in front of a specialist — cardiologist Dr. Horvat. He reviews the findings and says: 'Your ECG results are normal, but your blood pressure concerns me a little.'",
        choices: [
          { text: 'Što to točno znači za moje zdravlje?', next: 1 },
          { text: 'Imam li povišeni krvni tlak ili je to granično?', next: 2 },
        ],
      },
      {
        text: "'To znači da biste trebali pratiti tjedan dana i doći na kontrolu. Uzimate li ikakve lijekove?' Odgovaraš...",
        en: "'That means you should monitor for a week and come back for a check-up. Are you taking any medication?' You reply...",
        choices: [
          { text: 'Uzimam samo vitamin D i magnezij.', next: 3 },
          { text: 'Ne uzimam ništa, ali imam obiteljsku povijest hipertenzije.', next: 3 },
        ],
      },
      {
        text: "'Granično je — 145/90. Nije hitno, ali nije ni idealno.' Doktor nastavlja s pitanjima o stilu života.",
        en: "'It is borderline — 145/90. Not urgent, but not ideal either.' The doctor continues with questions about your lifestyle.",
        choices: [
          { text: 'Radim puno, spavam malo i vježbam rijetko.', next: 3 },
          { text: 'Imam dosta stresa na poslu zadnjih par mjeseci.', next: 3 },
        ],
      },
      {
        text: "Doktor kaže: 'Preporučujem aerobnu aktivnost trideset minuta dnevno i smanjenje soli. Ako se tlak ne normalizira za mjesec dana, razgovarat ćemo o terapiji.' Prihvaćaš preporuke.",
        en: "The doctor says: 'I recommend thirty minutes of aerobic activity daily and reducing salt intake. If the blood pressure does not normalise in a month, we will discuss medication.' You accept the recommendations.",
        choices: [],
      },
    ],
  },
  {
    title: 'Pregovaranje o Uvjetima Rada',
    tEn: 'Negotiating Work Conditions',
    cefr: 'B2',
    scenes: [
      {
        text: "Tvoj šef te pozvao na razgovor o tvojim uvjetima rada. Kaže: 'Tvoj rad u protekloj godini bio je izvanredan. Razmišljamo o promjenama.'",
        en: "Your boss has invited you for a conversation about your work conditions. He says: 'Your work over the past year has been outstanding. We are thinking about changes.'",
        choices: [
          { text: 'Hvala. I ja sam htio/htjela razgovarati o plaći.', next: 1 },
          { text: 'Drago mi je to čuti. Razmišljam i o fleksibilnom radnom vremenu.', next: 2 },
        ],
      },
      {
        text: "'Naravno, to je na stolu. Što smatraš pravednim, s obzirom na tržišne uvjete?' Odgovaraš...",
        en: "'Of course, that is on the table. What do you consider fair, given the market conditions?' You reply...",
        choices: [
          {
            text: 'Na temelju istraživanja tržišta, mislim da je povećanje od 15% opravdano.',
            next: 3,
          },
          {
            text: 'Bila bi mi važnija kombinacija povećanja i dva dodatna slobodna tjedna.',
            next: 3,
          },
        ],
      },
      {
        text: "'To je razumno. Ako bismo omogućili rad od kuće dva dana tjedno, bi li to zadovoljilo tvoje potrebe?' Razmišljaš...",
        en: "'That is understandable. If we enabled working from home two days a week, would that meet your needs?' You think...",
        choices: [
          { text: 'Da, to bi mi jako odgovaralo uz malu korekciju plaće.', next: 3 },
          { text: 'Hvala na ponudi — mogu li dobiti tjedan dana da razmislim?', next: 3 },
        ],
      },
      {
        text: "Šef kaže: 'Naravno. Pripremi nam pisani sažetak svojih prioriteta do sljedećeg ponedjeljka i formalizirat ćemo dogovor.' Zadovoljan/Zadovoljna si ishodom razgovora.",
        en: "Your boss says: 'Of course. Prepare a written summary of your priorities by next Monday and we will formalise the agreement.' You are satisfied with the outcome of the conversation.",
        choices: [],
      },
    ],
  },
  // ── C1 Scenarios ────────────────────────────────────────────────────────────
  {
    title: 'Akademska Obrana',
    tEn: 'Academic Defence',
    cefr: 'C1',
    scenes: [
      {
        text: "Stojiš pred povjerenstvom. Predsjednica komisije prof. dr. Kovač kaže: 'Molim vas da ukratko izložite ključne doprinose vašeg rada.'",
        en: "You stand before the committee. The committee chairwoman Prof. Dr. Kovač says: 'Please briefly present the key contributions of your work.'",
        choices: [
          {
            text: 'Središnja teza mog rada jest da institucionalni faktori nadilaze makroekonomske u objašnjenju konvergencije.',
            next: 1,
          },
          {
            text: 'Moj rad nudi trostruki okvir za analizu fiskalnih nesrazmjera unutar federalnih sustava.',
            next: 2,
          },
        ],
      },
      {
        text: "Drugi član komisije prof. Marić pita: 'Kako odgovarate na kritiku da vaš metodološki pristup zanemaruje endogenost varijabli?'",
        en: "The second committee member Prof. Marić asks: 'How do you respond to the criticism that your methodological approach neglects the endogeneity of variables?'",
        choices: [
          {
            text: 'Upotrijebio/Upotrijebila sam instrumentalne varijable kako bih riješio/riješila taj problem u poglavlju četiri.',
            next: 3,
          },
          {
            text: 'Svjestan/Svjesna sam tog ograničenja — eksplicitno ga navodim u odjeljku o ograničenjima rada.',
            next: 3,
          },
        ],
      },
      {
        text: "Prof. Marić sluša i nastavlja: 'A što s generalabilnošću nalaza izvan europskog konteksta?' Obrazlažeš...",
        en: "Prof. Marić listens and continues: 'And what about the generalisability of findings beyond the European context?' You explain...",
        choices: [
          {
            text: 'Uzorak je ograničen, ali teorijski okvir je primjenjiv uz primjerene prilagodbe.',
            next: 3,
          },
          {
            text: 'Buduća istraživanja mogla bi testirati hipotezu u kontekstu razvijajućih ekonomija.',
            next: 3,
          },
        ],
      },
      {
        text: "Predsjednica zahvaljuje i kaže: 'Povjerenstvo se povlači na kratko vijećanje.' Pet minuta kasnije: 'Čestitamo — rad je prihvaćen s pohvalom!'",
        en: "The chairwoman thanks you and says: 'The committee withdraws for a brief deliberation.' Five minutes later: 'Congratulations — the thesis is accepted with distinction!'",
        choices: [],
      },
    ],
  },
  {
    title: 'Kulturna Razmjena Mišljenja',
    tEn: 'Cultural Exchange of Opinions',
    cefr: 'C1',
    scenes: [
      {
        text: "Na književnoj večeri u Zagrebu razgovaraš s književnicom Anom Šimić. Pita te: 'Što misliš o utjecaju globalizacije na regionalnu književnost?'",
        en: "At a literary evening in Zagreb you are talking to author Ana Šimić. She asks you: 'What do you think about the impact of globalisation on regional literature?'",
        choices: [
          {
            text: 'Mislim da globalizacija paradoksalno potiče regionalne identitete jer ih stavlja u kontrast s globalnim.',
            next: 1,
          },
          {
            text: 'Postoji opasnost od standardizacije narativa koji brišu lokalne specifičnosti.',
            next: 2,
          },
        ],
      },
      {
        text: "Ana se namrštila zamišljeno. 'Zanimljivo stajalište. No, nije li regionalna književnost uvijek crpila snagu iz dijaloga s vanjskim utjecajima?'",
        en: "Ana frowns thoughtfully. 'Interesting stance. But hasn't regional literature always drawn strength from dialogue with external influences?'",
        choices: [
          {
            text: 'Svakako — dijalog je nužan, ali postoji razlika između dijaloga i asimilacije.',
            next: 3,
          },
          {
            text: 'Složio/Složila bih se, ali samo dok lokalna kultura zadržava kontrolu nad narativom.',
            next: 3,
          },
        ],
      },
      {
        text: "Ana nastavlja: 'Misliš li da književnost može odolijevati ekonomskim pritiscima i ostati relevantna?'",
        en: "Ana continues: 'Do you think literature can withstand economic pressures and remain relevant?'",
        choices: [
          { text: 'Relevantnost nije pitanje tržišta nego rezonancije s čitateljem.', next: 3 },
          {
            text: 'Sve dok postoje pisci koji odbijaju kompromise, hoće — bez obzira na ekonomske pritiske.',
            next: 3,
          },
        ],
      },
      {
        text: "Ana se smiješi. 'Potpisala bih svaku tvoju rečenicu. Ima li sličnih razmišljanja u tvojoj matičnoj kulturi?' Razgovor prelazi u dublje razmatranje kulturnih razlika.",
        en: "Ana smiles. 'I would sign every sentence of yours. Are there similar ideas in your home culture?' The conversation moves into a deeper consideration of cultural differences.",
        choices: [],
      },
    ],
  },
  {
    title: 'Etička Dilema na Poslu',
    tEn: 'Ethical Dilemma at Work',
    cefr: 'C1',
    scenes: [
      {
        text: "Kolegica ti se povjerava: 'Slučajno sam vidjela da je direktor lažno prikazao troškove projekta u izvještaju prema financijeru. Ne znam što napraviti.'",
        en: "A colleague confides in you: 'I accidentally saw that the director falsely reported project costs in the report to the funder. I don't know what to do.'",
        choices: [
          {
            text: 'To je ozbiljno. Trebala bi to prijaviti compliance officeru ili internoj reviziji.',
            next: 1,
          },
          { text: 'Razumijem tvoju zabrinutost. Jesi li sigurna u ono što si vidjela?', next: 2 },
        ],
      },
      {
        text: "'Razumijem, ali bojim se posljedica — direktoru sam izravno podređena.' Što savjetuješ?",
        en: "'I understand, but I am afraid of the consequences — I report directly to the director.' What do you advise?",
        choices: [
          {
            text: 'Postoji li u tvrtki mehanizam anonimne prijave? To bi ti dalo zaštitu.',
            next: 3,
          },
          { text: 'Možeš li dokumentirati što si vidjela, za slučaj da bude potrebno?', next: 3 },
        ],
      },
      {
        text: "'Bila sam prisutna kad je donesena odluka.' Nastaviš ispitivati...",
        en: "'I was present when the decision was made.' You continue to probe...",
        choices: [
          { text: 'Jesi li jedina koja to zna, ili postoje drugi svjedoci?', next: 3 },
          { text: 'Je li to bio jednokratni incident ili se to ponavlja?', next: 3 },
        ],
      },
      {
        text: "Kolegica zahvali i kaže: 'Nisam bila sigurna kojim putem ići — hvala ti što si razmotrio/razmotrila sa mnom. Razmislit ću o anonimnoj prijavi.' Savjet je pomogao.",
        en: "Your colleague thanks you and says: 'I was not sure which route to take — thank you for thinking it through with me. I will consider the anonymous report.' The advice helped.",
        choices: [],
      },
    ],
  },
  {
    title: 'Politički Diskurs',
    tEn: 'Political Discourse',
    cefr: 'C1',
    scenes: [
      {
        text: "Na panel diskusiji o EU politici moderator te pita: 'Kako biste ocijenili doprinos malih država poput Hrvatske oblikovanju europske agende?'",
        en: "At a panel discussion on EU policy the moderator asks you: 'How would you assess the contribution of small states like Croatia in shaping the European agenda?'",
        choices: [
          {
            text: 'Mali akteri imaju nerazmjeran utjecaj kada strateški koriste predsjedanje Vijećem.',
            next: 1,
          },
          {
            text: 'Hrvatska je u kratkom roku od ulaska pokazala sposobnost koalicijskog djelovanja unutar EU.',
            next: 2,
          },
        ],
      },
      {
        text: "Drugi panelist dodaje: 'No, strukturalni odnosi moći unutar EU-a i dalje favoriziraju veće ekonomije.' Repliciraš...",
        en: "Another panelist adds: 'But structural power relations within the EU still favour larger economies.' You reply...",
        choices: [
          {
            text: 'Slažem se, ali soft power diplomacija i tematska stručnost mogu kompenzirati veličinu.',
            next: 3,
          },
          {
            text: 'Asimetrija postoji, ali EU mehanizmi konsenzusa daju legitimitet i manjim glasovima.',
            next: 3,
          },
        ],
      },
      {
        text: "Moderator pita: 'Što bi trebala biti strateška odrednica Hrvatske u narednoj dekadi?'",
        en: "The moderator asks: 'What should be Croatia's strategic priority in the coming decade?'",
        choices: [
          {
            text: 'Pozicioniranje kao regionalni hub za energetsku tranziciju uz Jadran i koridor prema Balkanu.',
            next: 3,
          },
          {
            text: 'Jačanje obrazovnih i inovacijskih kapaciteta kako bi se smanjila emigracija stručnjaka.',
            next: 3,
          },
        ],
      },
      {
        text: "Moderator zahvaljuje panelistima. Nakon diskusije kolega ti kaže: 'Vaše izlaganje bilo je argumentirano i precizno. Jeste li razmišljali o objavljivanju članka?'",
        en: "The moderator thanks the panelists. After the discussion a colleague tells you: 'Your presentation was well-argued and precise. Have you considered publishing an article?'",
        choices: [],
      },
    ],
  },
];
export const CITYLOC = {
  cities: [
    { nom: 'Zagreb', lok: 'Zagrebu' },
    { nom: 'Zadar', lok: 'Zadru' },
    { nom: 'Vukovar', lok: 'Vukovaru' },
    { nom: 'Pariz', lok: 'Parizu' },
    { nom: 'Varaždin', lok: 'Varaždinu' },
    { nom: 'Dubrovnik', lok: 'Dubrovniku' },
    { nom: 'Opatija', lok: 'Opatiji' },
    { nom: 'Rijeka', lok: 'Rijeci' },
    { nom: 'Split', lok: 'Splitu' },
    { nom: 'Labin', lok: 'Labinu' },
    { nom: 'Bibinje', lok: 'Bibinjama' },
    { nom: 'Mostar', lok: 'Mostaru' },
    { nom: 'London', lok: 'Londonu' },
    { nom: 'Berlin', lok: 'Berlinu' },
  ],
  countries: [
    { nom: 'Hrvatska', lok: 'Hrvatskoj' },
    { nom: 'Italija', lok: 'Italiji' },
    { nom: 'Slovenija', lok: 'Sloveniji' },
    { nom: 'Njemačka', lok: 'Njemačkoj' },
    { nom: 'Francuska', lok: 'Francuskoj' },
    { nom: 'Kanada', lok: 'Kanadi' },
    { nom: 'Velika Britanija', lok: 'Velikoj Britaniji' },
    { nom: 'Bosna i Hercegovina', lok: 'Bosni i Hercegovini' },
    { nom: 'Amerika', lok: 'Americi' },
    { nom: 'Srbija', lok: 'Srbiji' },
  ],
};
export const AKUFOOD = [
  { nom: 'čokolada', aku: 'čokoladu', q: 'Voliš li _____?' },
  { nom: 'pizza', aku: 'pizzu', q: 'Voliš li _____?' },
  { nom: 'juha', aku: 'juhu', q: 'Voliš li _____?' },
  { nom: 'tjestenina', aku: 'tjesteninu', q: 'Voliš li _____?' },
  { nom: 'voda', aku: 'vodu', q: 'Piješ li _____?' },
  { nom: 'riža', aku: 'rižu', q: 'Jedeš li _____?' },
  { nom: 'kruh', aku: 'kruh', q: 'Jedeš li _____?' },
  { nom: 'džem', aku: 'džem', q: 'Voliš li _____?' },
  { nom: 'med', aku: 'med', q: 'Voliš li _____?' },
  { nom: 'sladoled', aku: 'sladoled', q: 'Voliš li _____?' },
  { nom: 'mlijeko', aku: 'mlijeko', q: 'Piješ li _____?' },
  { nom: 'voće', aku: 'voće', q: 'Jedeš li _____?' },
  { nom: 'povrće', aku: 'povrće', q: 'Jedeš li _____?' },
  { nom: 'meso', aku: 'meso', q: 'Jedeš li _____?' },
  { nom: 'kava', aku: 'kavu', q: 'Piješ li _____?' },
];
export const AKUCLOTHES = [
  { nom: 'majica', aku: 'majicu', q: 'Nosiš li _____?' },
  { nom: 'kaput', aku: 'kaput', q: 'Nosiš li _____?' },
  { nom: 'haljina', aku: 'haljinu', q: 'Nosiš li _____?' },
  { nom: 'košulja', aku: 'košulju', q: 'Nosiš li _____?' },
  { nom: 'suknja', aku: 'suknju', q: 'Nosiš li _____?' },
  { nom: 'torba', aku: 'torbu', q: 'Nosiš li _____?' },
  { nom: 'kravata', aku: 'kravatu', q: 'Nosiš li _____?' },
  { nom: 'jakna', aku: 'jaknu', q: 'Nosiš li _____?' },
  { nom: 'šešir', aku: 'šešir', q: 'Nosiš li _____?' },
  { nom: 'šal', aku: 'šal', q: 'Nosiš li _____?' },
];
export const CONVMATCH = [
  {
    title: 'U trgovini',
    pairs: [
      {
        q: 'Dobar dan! Mogu li Vam pomoći?',
        a: 'Da, molim Vas. Tražim knjigu.',
        wrong: 'Idem autobusom.',
      },
      {
        q: 'Kakvu knjigu želite?',
        a: 'Jednu sa slikama životinja.',
        wrong: 'Moja sestra kuha ručak.',
      },
      {
        q: 'Za koga je knjiga?',
        a: 'Za moju mamu. Uskoro je njezin rođendan.',
        wrong: 'Obično u podne.',
      },
      {
        q: 'Želi li Vaša mama ovu knjigu?',
        a: 'Da, ali je preskupa.',
        wrong: 'Počešljam se svako jutro.',
      },
      {
        q: 'Ova je jeftinija. Ima lijepe slike.',
        a: 'Savršeno! Želim ju kupiti.',
        wrong: 'Idem na posao pješice.',
      },
    ],
  },
  {
    title: 'O hrani',
    pairs: [
      {
        q: 'Koja je tvoja omiljena hrana?',
        a: 'Volim sir na pizzi i na kruhu.',
        wrong: 'Išao sam u kino.',
      },
      {
        q: 'Tko kuha tvoj ručak?',
        a: 'Moja sestra. Ona to voli raditi.',
        wrong: 'Imam deset godina.',
      },
      {
        q: 'Voliš li ti ponekad kuhati?',
        a: 'Da, ali samo jednostavna jela.',
        wrong: 'Autobusom idem na posao.',
      },
      {
        q: 'Kada si prvi put počela kuhati?',
        a: 'Imala sam možda deset godina.',
        wrong: 'Volim sir na pizzi.',
      },
      { q: 'U koje vrijeme imaš ručak?', a: 'Obično u podne.', wrong: 'Moja sestra kuha.' },
    ],
  },
  {
    title: 'O poslu',
    pairs: [
      {
        q: 'Ideš li uvijek pješice na posao?',
        a: 'Idem autobusom ako pada kiša.',
        wrong: 'Obično u podne.',
      },
      {
        q: 'Koliko ljudi tamo radi?',
        a: 'Samo nekoliko. To je malen biznis.',
        wrong: 'Da, volim kuhati.',
      },
      {
        q: 'Gdje jedeš ručak?',
        a: 'Ponekad u uredu, a ponekad vani.',
        wrong: 'Imam deset godina.',
      },
      {
        q: 'Mogu li koristiti računalo?',
        a: 'Dobro, ali samo kad sam na sastanku.',
        wrong: 'Išla sam na otok.',
      },
      {
        q: 'Kada se vraćaš s posla?',
        a: 'Obično kad završim sve za taj dan.',
        wrong: 'Volim sir na kruhu.',
      },
    ],
  },
];
