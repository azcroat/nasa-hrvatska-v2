/**
 * gradedStories.js — Graded Croatian reading & listening content
 * 9 stories across A1, A2, and B1 CEFR levels.
 * Each story: Croatian paragraphs, English translations, vocabulary, comprehension quiz.
 */

export const GRADED_STORIES = [
  // ═══════════════════════════════════════════════════════
  // A1 — Survival level, present tense, basic vocabulary
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_a1_1',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '🛒',
    title: 'Na tržnici',
    titleEn: 'At the Market',
    duration: 4,
    focus: 'Present tense • Numbers & prices • Accusative (direct objects)',
    intro:
      'Ana goes to the market every Saturday. Practice everyday shopping vocabulary and polite Croatian conversation.',
    paragraphs: [
      {
        hr: 'Ana ide na tržnicu svake subote. Ona kupuje svježe voće i povrće za cijeli tjedan. Tržnica se nalazi u centru grada.',
        en: 'Ana goes to the market every Saturday. She buys fresh fruit and vegetables for the whole week. The market is in the city centre.',
      },
      {
        hr: '"Dobar dan! Koliko košta kilogram jabuka?" pita Ana.\n"Dva eura, gospodice," odgovara prodavač.\n"Dajte mi, molim vas, dva kilograma jabuka i jedan kilogram naranča."\n"Izvolite. Ima li još nešto?"\n"Da, još pola kilograma rajčica i dvije paprike, molim."\n"U redu, to je zajedno sedam eura."',
        en: '"Good day! How much does a kilogram of apples cost?" asks Ana.\n"Two euros, miss," answers the vendor.\n"Please give me two kilograms of apples and one kilogram of oranges."\n"Here you are. Anything else?"\n"Yes, half a kilogram of tomatoes and two peppers, please."\n"All right, that\'s seven euros in total."',
      },
      {
        hr: 'Ana plati i zahvali prodavaču. On se nasmiješi i kaže: "Vidimo se sljedeće subote!" Ana stavi voće i povrće u torbu i krene prema autu.',
        en: 'Ana pays and thanks the vendor. He smiles and says: "See you next Saturday!" Ana puts the fruit and vegetables in her bag and heads towards the car.',
      },
      {
        hr: 'Doma, Ana opere sve što je kupila i stavi u hladnjak. Ona je zadovoljna — sve je svježe i nije skupo. Tržnica je puno bolja od supermarketa!',
        en: 'At home, Ana washes everything she bought and puts it in the fridge. She is satisfied — everything is fresh and not expensive. The market is much better than a supermarket!',
      },
    ],
    vocabulary: [
      { hr: 'tržnica', en: 'market', ex: 'Ana ide na tržnicu.' },
      { hr: 'svježe', en: 'fresh (adj.)', ex: 'Svježe voće je ukusno.' },
      { hr: 'voće', en: 'fruit', ex: 'Jabuke su voće.' },
      { hr: 'povrće', en: 'vegetables', ex: 'Rajčice su povrće.' },
      { hr: 'koliko košta', en: 'how much does it cost', ex: 'Koliko košta kilogram?' },
      { hr: 'jabuke', en: 'apples', ex: 'Dajte mi kilo jabuka.' },
      { hr: 'naranče', en: 'oranges', ex: 'Naranče su narančaste.' },
      { hr: 'rajčice', en: 'tomatoes', ex: 'Rajčice su crvene.' },
      { hr: 'paprike', en: 'peppers', ex: 'Paprike su ukusne.' },
      { hr: 'hladnjak', en: 'refrigerator', ex: 'Stavi mlijeko u hladnjak.' },
    ],
    quiz: [
      {
        q: 'Kada Ana ide na tržnicu?',
        qEn: 'When does Ana go to the market?',
        opts: ['Svaki petak', 'Svake subote', 'Svake nedjelje', 'Svaki dan'],
        correct: 1,
      },
      {
        q: 'Koliko košta kilogram jabuka?',
        qEn: 'How much does a kilogram of apples cost?',
        opts: ['Jedan euro', 'Pet eura', 'Dva eura', 'Deset eura'],
        correct: 2,
      },
      {
        q: 'Zašto Ana voli tržnicu?',
        qEn: 'Why does Ana love the market?',
        opts: [
          'Jer je blizu kuće',
          'Jer je besplatno',
          'Jer je sve svježe i nije skupo',
          'Jer je prodavač simpatičan',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a1_2',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '👨‍👩‍👧‍👦',
    title: 'Moja obitelj',
    titleEn: 'My Family',
    duration: 4,
    focus: 'Nominative case • Possessives (moj/moja) • Professions',
    intro: 'Marko introduces his family. Practice describing people, their ages, and what they do.',
    paragraphs: [
      {
        hr: 'Zovem se Marko Horvat. Imam dvadeset i sedam godina i živim u Osijeku. Živim s obitelji u lijepoj kući blizu centra.',
        en: 'My name is Marko Horvat. I am twenty-seven years old and I live in Osijek. I live with my family in a nice house near the centre.',
      },
      {
        hr: 'Moja mama se zove Vesna. Ona ima pedeset dvije godine i ona je učiteljica u osnovnoj školi. Moj tata se zove Zvonko. On je vozač i ima pedeset pet godina. Oni su zajedno trideset godina.',
        en: "My mother's name is Vesna. She is fifty-two years old and she is a primary school teacher. My father's name is Zvonko. He is a driver and he is fifty-five. They have been together for thirty years.",
      },
      {
        hr: 'Imam jednu sestru. Ona se zove Petra i ima dvadeset godina. Petra studira medicinu na Sveučilištu u Osijeku. Ona je pametna i marljiva. Imam i jednog brata — on se zove Luka i ima deset godina. Luka voli igrati nogomet.',
        en: 'I have one sister. Her name is Petra and she is twenty years old. Petra studies medicine at the University of Osijek. She is clever and hard-working. I also have a brother — his name is Luka and he is ten years old. Luka loves playing football.',
      },
      {
        hr: 'Imamo i psa koji se zove Rex. Rex je mali bijeli pudl i ima četiri godine. On je veseo i volio bi igrati se cijeli dan. Volim svoju obitelj — mi smo sretni zajedno.',
        en: 'We also have a dog called Rex. Rex is a small white poodle and he is four years old. He is cheerful and would love to play all day. I love my family — we are happy together.',
      },
    ],
    vocabulary: [
      { hr: 'obitelj', en: 'family', ex: 'Volim svoju obitelj.' },
      { hr: 'mama', en: 'mum / mother', ex: 'Moja mama je učiteljica.' },
      { hr: 'tata', en: 'dad / father', ex: 'Moj tata je vozač.' },
      { hr: 'učiteljica', en: 'teacher (female)', ex: 'Ona je učiteljica u školi.' },
      { hr: 'vozač', en: 'driver', ex: 'On je vozač kamiona.' },
      { hr: 'sestra', en: 'sister', ex: 'Moja sestra studira medicinu.' },
      { hr: 'studirati', en: 'to study (at university)', ex: 'Petra studira medicinu.' },
      { hr: 'brat', en: 'brother', ex: 'Moj brat voli nogomet.' },
      { hr: 'pametan', en: 'clever / smart', ex: 'Ona je pametna studentica.' },
      { hr: 'marljiv', en: 'hard-working / diligent', ex: 'On je marljiv učenik.' },
    ],
    quiz: [
      {
        q: 'Što radi Markova mama?',
        qEn: "What does Marko's mother do?",
        opts: ['Ona je doktorica', 'Ona je učiteljica', 'Ona je vozačica', 'Ona je kuharica'],
        correct: 1,
      },
      {
        q: 'Koliko godina ima Petra?',
        qEn: 'How old is Petra?',
        opts: ['Deset godina', 'Petnaest godina', 'Dvadeset godina', 'Dvadeset pet godina'],
        correct: 2,
      },
      {
        q: 'Kako se zove Markov pas?',
        qEn: "What is Marko's dog called?",
        opts: ['Luka', 'Zvonko', 'Vesna', 'Rex'],
        correct: 3,
      },
    ],
  },

  {
    id: 'gs_a1_3',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '☀️',
    title: 'Jutarnja rutina',
    titleEn: 'Morning Routine',
    duration: 4,
    focus: 'Present tense • Reflexive verbs (se) • Time expressions',
    intro:
      'Follow Ivan\'s morning routine. Croatian uses many reflexive verbs (ending in "se") for daily activities.',
    paragraphs: [
      {
        hr: 'Ivan se budi svako jutro u sedam sati. Kad se probudi, odmah ide u kupaonicu. Tamo se umiva hladnom vodom, pere zube i tušira se.',
        en: "Ivan wakes up every morning at seven o'clock. When he wakes up, he immediately goes to the bathroom. There he washes his face with cold water, brushes his teeth and showers.",
      },
      {
        hr: 'Nakon tuširanja, Ivan se oblači. Odabere traperice i bijelu majicu. Onda ide u kuhinju i pripremi doručak — kuha kavu i namaže kruh maslacem i džemom. Ponekad pojede i jedno jaje.',
        en: 'After showering, Ivan gets dressed. He picks jeans and a white t-shirt. Then he goes to the kitchen and prepares breakfast — he makes coffee and spreads butter and jam on bread. Sometimes he also eats an egg.',
      },
      {
        hr: 'U pola osam Ivan uzima ranac i izlazi iz stana. Autobuska postaja je blizu, samo tri minute pješice. Ivan voli slušati glazbu dok čeka autobus.',
        en: 'At half past seven Ivan picks up his backpack and leaves the apartment. The bus stop is nearby, just three minutes on foot. Ivan likes listening to music while he waits for the bus.',
      },
      {
        hr: 'Na poslu počinje raditi u osam i četrdeset pet. Ivan je programer i voli svoj posao. "Svako jutro je nova prilika," misli Ivan dok ulazi u ured.',
        en: 'At work he starts at eight forty-five. Ivan is a programmer and he loves his job. "Every morning is a new opportunity," thinks Ivan as he walks into the office.',
      },
    ],
    vocabulary: [
      { hr: 'buditi se', en: 'to wake up (reflexive)', ex: 'Ivan se budi u sedam.' },
      { hr: 'kupaonica', en: 'bathroom', ex: 'Ide u kupaonicu.' },
      { hr: 'prati zube', en: 'to brush teeth', ex: 'Perem zube dva puta dnevno.' },
      { hr: 'tuširati se', en: 'to shower (reflexive)', ex: 'Tuširam se svako jutro.' },
      { hr: 'oblačiti se', en: 'to get dressed (reflexive)', ex: 'Ivan se oblači za posao.' },
      { hr: 'doručak', en: 'breakfast', ex: 'Jede doručak u kuhinji.' },
      { hr: 'kava', en: 'coffee', ex: 'Pijem kavu svako jutro.' },
      { hr: 'džem', en: 'jam', ex: 'Volim kruh s džemom.' },
      { hr: 'ranac', en: 'backpack', ex: 'Uzima ranac i ide.' },
      { hr: 'programer', en: 'programmer', ex: 'On je programer.' },
    ],
    quiz: [
      {
        q: 'U koliko sati se Ivan budi?',
        qEn: 'What time does Ivan wake up?',
        opts: ['U šest sati', 'U sedam sati', 'U osam sati', 'U devet sati'],
        correct: 1,
      },
      {
        q: 'Što Ivan jede za doručak?',
        qEn: 'What does Ivan eat for breakfast?',
        opts: ['Samo kavu', 'Joghurt i voće', 'Kruh s maslacem i džemom', 'Tost sa sirom'],
        correct: 2,
      },
      {
        q: 'Koliko minuta hoda Ivan do autobusne postaje?',
        qEn: 'How many minutes does Ivan walk to the bus stop?',
        opts: ['Jednu minutu', 'Pet minuta', 'Tri minute', 'Deset minuta'],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // A2 — Elementary, past tense, common cases
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_a2_1',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '🌊',
    title: 'Vikend u Splitu',
    titleEn: 'Weekend in Split',
    duration: 5,
    focus: 'Past tense (bio/bila + infinitive) • Accusative with motion verbs • Tourism vocabulary',
    intro:
      'A trip to Split! Practice the Croatian past tense and vocabulary for travel and sightseeing.',
    paragraphs: [
      {
        hr: 'Prošli vikend sam otišao u Split s prijateljicom Anom. Putovali smo autom — vožnja iz Zagreba traje oko dva i pol sata. Bilo je lijepo i sunčano.',
        en: 'Last weekend I went to Split with my friend Ana. We travelled by car — the drive from Zagreb takes about two and a half hours. It was nice and sunny.',
      },
      {
        hr: 'U Splitu smo posjetili Dioklecijanovu palaču. Hodali smo kroz uske ulice Starog grada i divili se staroj rimskoj arhitekturi. Ana je fotografirala sve što je vidjela. Za ručak smo sjeli u restoran na Rivi. Ja sam naručio prstace na buzaru, a Ana je uzela pečenu ribu s blitvom.',
        en: "In Split we visited Diocletian's Palace. We walked through the narrow streets of the Old Town and admired the old Roman architecture. Ana photographed everything she saw. For lunch we sat at a restaurant on the Riva promenade. I ordered date mussels in garlic-wine sauce, and Ana had grilled fish with Swiss chard.",
      },
      {
        hr: 'Poslijepodne smo otišli na plažu Bačvice. Kupali smo se u moru i gledali mladež kako igraju picigin — to je stara splitska igra s malenom lopticom. Sunce je jako peklo, ali bila je prekrasna atmosfera.',
        en: "In the afternoon we went to Bačvice beach. We swam in the sea and watched young people playing picigin — that's an old Split game with a small ball. The sun was beating down hard, but the atmosphere was wonderful.",
      },
      {
        hr: 'Navečer smo šetali po Rivi i pili kavu uz more. Vratio sam se doma sretan i odmoran. Split je prelijep grad — sigurno ću ga opet posjetiti uskoro!',
        en: 'In the evening we strolled along the Riva and drank coffee by the sea. I came back home happy and refreshed. Split is a beautiful city — I will definitely visit it again soon!',
      },
    ],
    vocabulary: [
      { hr: 'posjetiti', en: 'to visit (pf.)', ex: 'Posjetili smo palaču.' },
      { hr: 'hodati', en: 'to walk (impf.)', ex: 'Hodali smo po gradu.' },
      { hr: 'diviti se', en: 'to admire (refl.)', ex: 'Divimo se arhitekturi.' },
      { hr: 'naručiti', en: 'to order (in a restaurant, pf.)', ex: 'Naručio sam ribu.' },
      { hr: 'prstaci', en: 'date mussels (local delicacy)', ex: 'Prstaci su ukusni.' },
      { hr: 'blitva', en: 'Swiss chard', ex: 'Riba s blitvom i krumpirom.' },
      { hr: 'picigin', en: 'traditional Split beach ball game', ex: 'Mladi igraju picigin.' },
      { hr: 'šetati', en: 'to stroll / take a walk (impf.)', ex: 'Šetamo po gradu.' },
      { hr: 'odmoran', en: 'rested / refreshed', ex: 'Osjećam se odmorno.' },
      { hr: 'uskoro', en: 'soon', ex: 'Doći ću uskoro.' },
    ],
    quiz: [
      {
        q: 'Koliko dugo traje vožnja od Zagreba do Splita?',
        qEn: 'How long does the drive from Zagreb to Split take?',
        opts: ['Jedan sat', 'Oko dva i pol sata', 'Četiri sata', 'Šest sati'],
        correct: 1,
      },
      {
        q: 'Što je picigin?',
        qEn: 'What is picigin?',
        opts: ['Vrsta ribe', 'Stara splitska igra s loptom', 'Domaće jelo', 'Dio palače'],
        correct: 1,
      },
      {
        q: 'Što je naručio pripovjedač za ručak?',
        qEn: 'What did the narrator order for lunch?',
        opts: ['Pečenu ribu', 'Prstace na buzaru', 'Pizzu', 'Gulaš'],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_a2_2',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '🏥',
    title: 'Kod doktora',
    titleEn: "At the Doctor's",
    duration: 5,
    focus: 'Genitive with "boli me" • Dative case • Imperative mood',
    intro:
      "Marija isn't feeling well. Learn Croatian medical vocabulary and how to describe symptoms.",
    paragraphs: [
      {
        hr: 'Marija se nije osjećala dobro od jučer. Boljela ju je glava i grlo. Imala je i visoku temperaturu — trideset i osam stupnjeva. Jutros je nazvala svog liječnika i dobila termin za deset sati.',
        en: "Marija hadn't been feeling well since yesterday. She had a headache and a sore throat. She also had a high temperature — thirty-eight degrees. This morning she called her doctor and got an appointment for ten o'clock.",
      },
      {
        hr: 'U čekaonici je sjedila pola sata i listala stari časopis. Napokon je medicinska sestra pozvala njezino ime. Ušla je u ordinaciju. "Dobar dan, Marija. Što vas boli?" upitao je doktor Kovač. "Boli me grlo i imam temperaturu," odgovorila je ona. "I glava me boli već dva dana."',
        en: 'She sat in the waiting room for half an hour and leafed through an old magazine. Finally the nurse called her name. She entered the surgery. "Good day, Marija. What hurts?" asked Dr Kovač. "My throat hurts and I have a temperature," she answered. "And I\'ve had a headache for two days."',
      },
      {
        hr: 'Doktor ju je pregledao — pogledao je u grlo, poslušao pluća i izmjerio temperaturu. "Imate anginu," rekao je. "Moram vam propisati antibiotike. Uzimajte jednu tabletu tri puta dnevno, sedam dana. Pijte puno tekućine i mirovajte."',
        en: 'The doctor examined her — he looked at her throat, listened to her lungs and took her temperature. "You have tonsillitis," he said. "I need to prescribe you antibiotics. Take one tablet three times a day for seven days. Drink plenty of fluids and rest."',
      },
      {
        hr: 'Marija je otišla u ljekarnu i kupila lijek. Slijedila je sve doktorove upute. Za četiri dana se osjećala puno bolje. "Sljedeći put ću se bolje oblačiti po lošem vremenu," obećala je sebi.',
        en: 'Marija went to the pharmacy and bought the medicine. She followed all the doctor\'s instructions. After four days she felt much better. "Next time I\'ll dress more warmly in bad weather," she promised herself.',
      },
    ],
    vocabulary: [
      { hr: 'osjećati se', en: 'to feel (reflexive)', ex: 'Osjećam se loše.' },
      { hr: 'boljeti', en: 'to hurt/ache (boli me = it hurts me)', ex: 'Boli me glava.' },
      { hr: 'grlo', en: 'throat', ex: 'Boli me grlo.' },
      { hr: 'temperatura', en: 'temperature / fever', ex: 'Imam temperaturu.' },
      { hr: 'čekaonica', en: 'waiting room', ex: 'Čekam u čekaonici.' },
      { hr: 'ordinacija', en: "doctor's surgery / office", ex: 'Ušla je u ordinaciju.' },
      { hr: 'angina', en: 'tonsillitis / strep throat', ex: 'Imam anginu.' },
      { hr: 'antibiotici', en: 'antibiotics', ex: 'Uzimam antibiotike.' },
      { hr: 'tableta', en: 'tablet / pill', ex: 'Jedna tableta dnevno.' },
      { hr: 'mirovanje', en: 'rest (noun)', ex: 'Doktor je propisao mirovanje.' },
    ],
    quiz: [
      {
        q: 'Zašto Marija ide liječniku?',
        qEn: "Why does Marija go to the doctor's?",
        opts: [
          'Boli je noga',
          'Boli je glava i grlo i ima temperaturu',
          'Ne može hodati',
          'Ima alergiju',
        ],
        correct: 1,
      },
      {
        q: 'Koliko tableta treba uzimati svaki dan?',
        qEn: 'How many tablets should she take every day?',
        opts: ['Jednu tabletu', 'Dvije tablete', 'Tri tablete', 'Četiri tablete'],
        correct: 2,
      },
      {
        q: 'Za koliko dana se Marija osjećala bolje?',
        qEn: 'After how many days did Marija feel better?',
        opts: ['Jedan dan', 'Dva dana', 'Četiri dana', 'Tjedan dana'],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a2_3',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '🏠',
    title: 'Novi susjed',
    titleEn: 'The New Neighbour',
    duration: 5,
    focus: 'Future tense (će + inf.) • Introducing yourself • Dative of address',
    intro:
      'Juraj moves to Zagreb for the first time. Learn how Croatians introduce themselves and get to know neighbours.',
    paragraphs: [
      {
        hr: 'Juraj se uselio u stan na drugom katu prošle subote. Dolazi iz Rijeke i prvi put živi sam u Zagrebu. Sve mu je novo i malo strašno — ali i uzbudljivo.',
        en: 'Juraj moved into the flat on the second floor last Saturday. He comes from Rijeka and is living alone in Zagreb for the first time. Everything is new to him and a little frightening — but also exciting.',
      },
      {
        hr: 'U ponedjeljak je netko pokucao na njegova vrata. Bila je to susjeda s trećeg kata, gospođa Babić. "Dobrodošli! Ja sam Mirjana Babić. Ako vam treba ikakva pomoć, slobodno pitajte," rekla je ljubazno. Juraj se nasmiješio: "Hvala lijepa! Ja sam Juraj Horvat. Drago mi je što sam vas upoznao."',
        en: 'On Monday someone knocked on his door. It was the neighbour from the third floor, Mrs Babić. "Welcome! I am Mirjana Babić. If you need any help, please feel free to ask," she said kindly. Juraj smiled: "Thank you very much! I am Juraj Horvat. It\'s nice to meet you."',
      },
      {
        hr: 'Gospođa Babić mu je rekla da će u petak biti skupština stanara u sedam navečer u prizemlju. "Bit će dobra prilika da upoznate ostale susjede," dodala je. Juraj je obećao da će doći.',
        en: 'Mrs Babić told him that on Friday there would be a tenants\' meeting at seven in the evening in the ground floor. "It will be a good chance to meet the other neighbours," she added. Juraj promised he would come.',
      },
      {
        hr: 'Petak navečer, Juraj je otišao na skupštinu. Upoznao je još pet susjeda. Svi su bili srdačni i prijazni. Nakon skupštine, svi su zajedno popili kavu. Juraj je pomislio: "Mislim da ću se ovdje dobro osjećati."',
        en: 'Friday evening, Juraj went to the meeting. He met five more neighbours. Everyone was warm and friendly. After the meeting, everyone had coffee together. Juraj thought: "I think I\'m going to feel good here."',
      },
    ],
    vocabulary: [
      { hr: 'uselio se', en: 'moved in (pf., m.)', ex: 'Juraj se uselio u stan.' },
      { hr: 'kat', en: 'floor / storey', ex: 'Živim na trećem katu.' },
      { hr: 'susjed/susjeda', en: 'neighbour (m./f.)', ex: 'Moja susjeda je ljubazna.' },
      { hr: 'pokucati', en: 'to knock (pf.)', ex: 'Netko je pokucao na vrata.' },
      { hr: 'slobodno pitajte', en: 'feel free to ask', ex: 'Slobodno pitajte ako trebate.' },
      { hr: 'skupština stanara', en: "tenants' meeting", ex: 'Skupština je u petak.' },
      { hr: 'prizemlje', en: 'ground floor', ex: 'Pošta je u prizemlju.' },
      { hr: 'srdačan', en: 'warm / cordial', ex: 'Svi su bili srdačni.' },
      { hr: 'obećati', en: 'to promise (pf.)', ex: 'Obećao je da će doći.' },
      { hr: 'osjećati se', en: 'to feel (reflexive)', ex: 'Dobro se osjećam.' },
    ],
    quiz: [
      {
        q: 'Odakle dolazi Juraj?',
        qEn: 'Where does Juraj come from?',
        opts: ['Iz Zagreba', 'Iz Splita', 'Iz Rijeke', 'Iz Osijeka'],
        correct: 2,
      },
      {
        q: 'Kada je skupština stanara?',
        qEn: "When is the tenants' meeting?",
        opts: [
          'U ponedjeljak navečer',
          'U srijedu ujutro',
          'U petak u sedam navečer',
          'U subotu poslijepodne',
        ],
        correct: 2,
      },
      {
        q: 'Što su susjedi radili nakon skupštine?',
        qEn: 'What did the neighbours do after the meeting?',
        opts: [
          'Otišli su kući',
          'Zajedno su popili kavu',
          'Gledali su televiziju',
          'Šetali su po gradu',
        ],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // B1 — Intermediate, verbal aspect, complex sentences
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_b1_1',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '📦',
    title: 'Selidba u Zagreb',
    titleEn: 'Moving to Zagreb',
    duration: 7,
    focus: 'Perfective vs. imperfective aspect • Instrumental case (s + instr.) • Complex clauses',
    intro:
      'Moving to a new city is an adventure. Notice how Croatian uses IMPERFECTIVE verbs for ongoing/repeated actions and PERFECTIVE verbs for completed single actions.',
    paragraphs: [
      {
        hr: 'Kad sam se preselio iz Varaždina u Zagreb, nisam poznavao gotovo nikoga u gradu. Seoba je bila naporna — tjedan dana sam pakirao stvari, a na kraju sam sve uspio strpati u mali kombi koji sam unajmio.',
        en: 'When I moved from Varaždin to Zagreb, I hardly knew anyone in the city. The move was exhausting — for a week I was packing things (impf.), and in the end I managed to fit everything into a small van I had rented.',
      },
      {
        hr: 'Moj novi stan se nalazi u Dubravi, na rubu grada. Nije luksuzno, ali ima sve što treba: dvije sobe, kuhinju, kupaonicu i mali balkon s pogledom na park. Prvoga dana kad sam ušao, osjetio sam čudan mješavinu uzbuđenja i tuge — nisam više bio u svom rodnom gradu.',
        en: "My new flat is in Dubrava, on the outskirts of the city. It's not luxurious, but it has everything you need: two rooms, a kitchen, a bathroom and a small balcony overlooking a park. On the first day when I walked in, I felt a strange mixture of excitement and sadness — I was no longer in my home town.",
      },
      {
        hr: 'Kolega s posla, Tomislav, pomogao mi je prenijeti teže komade namještaja. Bez njega bih se mučio sam sa strojem za pranje rublja i kaučem. Kad smo konačno završili, sjeli smo u kuhinji i popili hladno pivo. "Dobrodošao u Zagreb," rekao je Tomislav, "sad si pravi Zagrepčanin!"',
        en: 'My colleague Tomislav helped me move the heavier pieces of furniture. Without him I would have struggled alone with the washing machine and the sofa. When we finally finished, we sat in the kitchen and drank a cold beer. "Welcome to Zagreb," said Tomislav, "now you\'re a true Zagrepčanin!"',
      },
      {
        hr: 'Prvih nekoliko tjedana bilo je izazovno. Morao sam naučiti tramvajske linije, pronaći najbliži supermarket i prijaviti promjenu adrese u nadležnom uredu. Ali postupno, grad mi je postajao poznat. Četiri godine kasnije, ne mogu si zamisliti da živim negdje drugdje.',
        en: 'The first few weeks were challenging. I had to learn the tram lines, find the nearest supermarket and register my change of address at the relevant office. But gradually, the city became familiar to me. Four years later, I cannot imagine living anywhere else.',
      },
    ],
    vocabulary: [
      { hr: 'seoba / selidba', en: 'moving house', ex: 'Selidba je bila naporna.' },
      { hr: 'pakirati (impf.)', en: 'to pack (ongoing)', ex: 'Cijeli tjedan sam pakirao.' },
      { hr: 'strpati (pf.)', en: 'to cram / fit in (completed)', ex: 'Strpao sam sve u kombi.' },
      { hr: 'kombi', en: 'van / minivan', ex: 'Unajmio sam kombi.' },
      { hr: 'rub grada', en: 'outskirts (of the city)', ex: 'Živim na rubu grada.' },
      { hr: 'uzbuđenje', en: 'excitement', ex: 'Osjećao sam uzbuđenje.' },
      {
        hr: 'prenijeti (pf.)',
        en: 'to carry / move (furniture)',
        ex: 'Pomogao mi je prenijeti stvari.',
      },
      { hr: 'mučiti se', en: 'to struggle / toil', ex: 'Mučio bih se sam.' },
      { hr: 'postupno', en: 'gradually', ex: 'Postupno sam naučio grad.' },
      {
        hr: 'zamisliti (pf.)',
        en: 'to imagine (completed act)',
        ex: 'Ne mogu si zamisliti život drugdje.',
      },
    ],
    quiz: [
      {
        q: 'Odakle se preselio pripovjedač?',
        qEn: 'Where did the narrator move from?',
        opts: ['Iz Rijeke', 'Iz Splita', 'Iz Varaždina', 'Iz Osijeka'],
        correct: 2,
      },
      {
        q: 'Tko mu je pomogao prenijeti namještaj?',
        qEn: 'Who helped him move the furniture?',
        opts: ['Brat', 'Kolega Tomislav', 'Susjed', 'Otac'],
        correct: 1,
      },
      {
        q: 'Kako se pripovjedač osjeća prema Zagrebu četiri godine kasnije?',
        qEn: 'How does the narrator feel about Zagreb four years later?',
        opts: [
          'Želi se preseliti natrag',
          'Ne može zamisliti da živi negdje drugdje',
          'Smatra grad preskupim',
          'Nema prijatelja tamo',
        ],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_b1_2',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '🎄',
    title: 'Baka dolazi za Božić',
    titleEn: 'Grandma Comes for Christmas',
    duration: 7,
    focus:
      'Habitual imperfective (svake godine = every year) • Relative clauses (koji/koja) • Cultural vocabulary',
    intro:
      'Christmas traditions in Croatia are rich and family-centred. Notice how imperfective verbs describe habitual yearly customs.',
    paragraphs: [
      {
        hr: 'Svake godine, za Božić, naša baka Ružica dolazi autobusom iz Karlovca. Onoga dana kad stigne, cijela kuća odmah zamiriše na njezine kolače — orahnjaču i makovnjaču, koje je pekla noću u svom stanu.',
        en: 'Every year at Christmas, our grandmother Ružica comes by bus from Karlovac. The day she arrives, the whole house immediately fills with the smell of her pastries — walnut roll and poppy seed roll, which she baked overnight in her flat.',
      },
      {
        hr: 'Dok baka priprema kolače u kuhinji, tata iz podruma donosi jelku. Mi djeca ukrašavamo jelku šarenim kuglicama i lampicama. Mama kuha ribu jer je Badnjak — dan posta. Svake godine spremi isti meni: bakalar na bijelo s krumpirom i blitvu. "To se jede uz Badnjak," kaže uvijek.',
        en: 'While grandma prepares pastries in the kitchen, dad brings the Christmas tree up from the basement. We children decorate the tree with colourful baubles and lights. Mum cooks fish because it\'s Christmas Eve — a day of fasting. Every year she makes the same menu: salt cod in white sauce with potatoes and Swiss chard. "That\'s what you eat on Christmas Eve," she always says.',
      },
      {
        hr: 'Nakon večere idemo na ponoćku — božićnu misu u obližnju crkvu. Crkva je uvijek puna, a orguljaš svira stare crkvene pjesme koje svi znaju napamet. Kad se vratimo, djeca odmah žure u krevet. Naravno, nitko ne može zaspati zbog uzbuđenja — pokloni čekaju pod jelkom.',
        en: 'After dinner we go to midnight mass — the Christmas mass at the nearby church. The church is always full, and the organist plays old church songs that everyone knows by heart. When we get back, the children rush straight to bed. Of course, no one can sleep for excitement — the presents are waiting under the tree.',
      },
      {
        hr: 'Ujutro na Božić svi rano ustajemo. Otvaramo poklone uz vesele uzvike i smijeh. Baka sjedi u naslonjaču i gleda nas — i plače od sreće, kao što čini svake godine. Za ručak jedemo juhu, pečenku s mlincima i za desert orahnjaču. "Taj dan je prebrzo prošao," kaže baka uvijek na odlasku. I uvijek ima pravo.',
        en: 'On Christmas morning we all get up early. We open presents amid happy exclamations and laughter. Grandma sits in the armchair and watches us — and cries with happiness, as she does every year. For lunch we have soup, roast meat with flatbread and for dessert walnut roll. "That day passes too quickly," grandma always says on leaving. And she is always right.',
      },
    ],
    vocabulary: [
      {
        hr: 'orahnjača',
        en: 'walnut roll (Croatian Christmas pastry)',
        ex: 'Baka peče orahnjaču.',
      },
      { hr: 'makovnjača', en: 'poppy seed roll', ex: 'Volim makovnjaču.' },
      { hr: 'jelka', en: 'Christmas tree', ex: 'Ukrašavamo jelku.' },
      { hr: 'Badnjak', en: 'Christmas Eve', ex: 'Na Badnjak jedemo ribu.' },
      { hr: 'bakalar', en: 'salt cod / dried cod', ex: 'Bakalar na bijelo s krumpirom.' },
      { hr: 'blitva', en: 'Swiss chard', ex: 'Blitva i krumpir uz ribu.' },
      { hr: 'ponoćka', en: 'midnight mass (Christmas)', ex: 'Idemo na ponoćku.' },
      { hr: 'napamet', en: 'by heart', ex: 'Znaju pjesme napamet.' },
      {
        hr: 'mlinec (pl. mlinci)',
        en: 'baked flatbread (traditional side dish)',
        ex: 'Pečenka s mlincima.',
      },
      { hr: 'naslonjač', en: 'armchair', ex: 'Sjedi u naslonjaču.' },
    ],
    quiz: [
      {
        q: 'Odakle dolazi baka Ružica?',
        qEn: 'Where does grandmother Ružica come from?',
        opts: ['Iz Splita', 'Iz Varaždina', 'Iz Karlovca', 'Iz Rijeke'],
        correct: 2,
      },
      {
        q: 'Zašto se na Badnjak jede riba?',
        qEn: 'Why is fish eaten on Christmas Eve?',
        opts: [
          'Jer je najjeftinija',
          'Jer djeca vole ribu',
          'Jer je Badnjak dan posta',
          'Jer nema mesa u trgovini',
        ],
        correct: 2,
      },
      {
        q: 'Što baka radi dok djeca otvaraju poklone?',
        qEn: 'What does grandma do while the children open presents?',
        opts: ['Kuha doručak', 'Sjedi i plače od sreće', 'Ide spavati', 'Razgovara telefonom'],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_b1_3',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '💼',
    title: 'Na razgovoru za posao',
    titleEn: 'At the Job Interview',
    duration: 8,
    focus: 'Conditional mood (bih/bi) • Formal register • Complex vocabulary',
    intro:
      'Ksenija interviews for a marketing job in Zadar. Listen for the conditional mood and formal Croatian used in professional contexts.',
    paragraphs: [
      {
        hr: 'Ksenija je aplicirala za posao marketinškog koordinatora u jednoj zadarskoj agenciji. Tjedan dana nakon što je poslala prijavu, dobila je poziv. Bila je i uzbuđena i nervozna — to bi bio njezin prvi pravi posao nakon završetka fakulteta.',
        en: 'Ksenija applied for a job as a marketing coordinator at an agency in Zadar. A week after sending her application, she received a call. She was both excited and nervous — it would be her first proper job after finishing university.',
      },
      {
        hr: 'Na razgovoru su je pitali o njezinom dosadašnjem iskustvu, zašto želi raditi baš u toj agenciji te kakve su njezine dugoročne ambicije. Ksenija je odgovarala smireno i samopouzdano. "Što biste rekli da je vaša najveća slabost?" upitao je voditelj razgovora. Ksenija se nije zbunila: "Ponekad sam previše orijentirana na detalje — ali to mi pomaže da svaki projekt radim temeljito."',
        en: 'At the interview they asked her about her previous experience, why she wanted to work at that particular agency and what her long-term ambitions were. Ksenija answered calmly and confidently. "What would you say is your biggest weakness?" the interviewer asked. Ksenija didn\'t get flustered: "Sometimes I\'m too detail-oriented — but that helps me do every project thoroughly."',
      },
      {
        hr: 'Na kraju razgovora, Ksenija je pitala o radnom vremenu, visini plaće i mogućnostima napredovanja. "Kad biste mogli početi?" upitao je voditelj. "Odmah sljedećeg tjedna, ako bi to odgovaralo vama," odgovorila je Ksenija. Voditelj se zadovoljno nasmiješio.',
        en: 'At the end of the interview, Ksenija asked about working hours, salary and opportunities for advancement. "When could you start?" the interviewer asked. "As early as next week, if that would suit you," Ksenija answered. The interviewer smiled, satisfied.',
      },
      {
        hr: 'Dva dana kasnije, Ksenija je otvorila e-mail od agencije: bila je primljena! Odmah je nazvala mamu: "Dobila sam posao, mama!" Mama je bila toliko ponosna da su joj suze krenule niz lice. Ksenija je shvatila da su se sve godine truda i studija konačno isplatile.',
        en: 'Two days later, Ksenija opened an email from the agency: she had been hired! She immediately called her mum: "I got the job, mum!" Her mum was so proud that tears ran down her face. Ksenija realised that all those years of hard work and study had finally paid off.',
      },
    ],
    vocabulary: [
      { hr: 'aplicirati', en: 'to apply (for a job)', ex: 'Aplicirala je za posao.' },
      { hr: 'dosadašnje iskustvo', en: 'previous / prior experience', ex: 'Pitali su o iskustvu.' },
      { hr: 'smireno', en: 'calmly', ex: 'Odgovarala je smireno.' },
      { hr: 'samopouzdanje', en: 'self-confidence', ex: 'Imala je samopouzdanja.' },
      { hr: 'voditelj razgovora', en: 'interviewer', ex: 'Voditelj je postavljao pitanja.' },
      { hr: 'slabost', en: 'weakness', ex: 'Koja je vaša slabost?' },
      { hr: 'temeljito', en: 'thoroughly', ex: 'Rade temeljito i pažljivo.' },
      { hr: 'napredovanje', en: 'advancement / promotion', ex: 'Ima li mogućnosti napredovanja?' },
      { hr: 'primljen/primljena', en: 'accepted / hired (m./f.)', ex: 'Bila je primljena!' },
      { hr: 'isplatiti se (pf.)', en: 'to pay off / be worth it', ex: 'Trud se isplatio.' },
    ],
    quiz: [
      {
        q: 'Za koji posao aplicira Ksenija?',
        qEn: 'What job is Ksenija applying for?',
        opts: ['Novinarka', 'Odvjetnica', 'Marketinška koordinatorica', 'Učiteljica'],
        correct: 2,
      },
      {
        q: 'Kako je Ksenija odgovorila na pitanje o njezinoj slabosti?',
        qEn: 'How did Ksenija answer the question about her weakness?',
        opts: [
          'Rekla je da nema slabosti',
          'Rekla je da je previše orijentirana na detalje',
          'Promijenila je temu',
          'Nije odgovorila',
        ],
        correct: 1,
      },
      {
        q: 'Što je Ksenija napravila odmah nakon što je dobila e-mail o poslu?',
        qEn: 'What did Ksenija do immediately after receiving the job email?',
        opts: [
          'Otišla je slaviti s prijatelicama',
          'Nazvala je mamu',
          'Odgovorila je na e-mail',
          'Plakala je',
        ],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // A1 — continued (gs_a1_4 – gs_a1_6)
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_a1_4',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '☕',
    title: 'U kafiću',
    titleEn: 'At the Café',
    duration: 3,
    focus: 'Ordering drinks • Polite phrases • Numbers',
    intro:
      'Ivan orders coffee with a friend in a Zagreb café. Practice polite café conversation and drink vocabulary.',
    paragraphs: [
      {
        hr: 'Ivan i Maja sjede u malom kafiću u centru Zagreba. Kafić se zove "Stari grad". Vani je sunčano i toplo.',
        en: 'Ivan and Maja are sitting in a small café in the centre of Zagreb. The café is called "Stari grad". Outside it is sunny and warm.',
      },
      {
        hr: 'Konobarica dolazi do stola. "Izvolite, što želite?" pita ona.\n"Ja bih jednu kavu, molim," kaže Ivan.\n"A ja bih jednu limunadu i jedan kroasan," kaže Maja.\n"Sve je to," kaže konobarica. "Odmah dolazi."',
        en: 'The waitress comes to the table. "What would you like?" she asks.\n"I\'d like a coffee, please," says Ivan.\n"And I\'d like a lemonade and a croissant," says Maja.\n"Is that everything?" says the waitress. "Coming right away."',
      },
      {
        hr: 'Kava i limonada su ukusni. Ivan i Maja razgovaraju o vikend planovima. Plaćaju zajedno — kava košta jedan euro i pedeset centi, limonada dva eura, a kroasan jedan euro i dvadeset centi.',
        en: 'The coffee and lemonade are delicious. Ivan and Maja talk about weekend plans. They pay together — the coffee costs one euro fifty, the lemonade two euros, and the croissant one euro twenty.',
      },
    ],
    vocabulary: [
      { hr: 'kafić', en: 'café', ex: 'Sjedimo u kafiću.' },
      { hr: 'konobarica', en: 'waitress', ex: 'Konobarica donosi kavu.' },
      { hr: 'kava', en: 'coffee', ex: 'Ja bih jednu kavu.' },
      { hr: 'limonada', en: 'lemonade', ex: 'Limonada je hladna.' },
      { hr: 'kroasan', en: 'croissant', ex: 'Kroasan je ukusan.' },
      { hr: 'plaćati', en: 'to pay', ex: 'Plaćamo zajedno.' },
      { hr: 'ukusan', en: 'delicious / tasty', ex: 'Kava je ukusna.' },
      { hr: 'odmah', en: 'immediately / right away', ex: 'Dolazim odmah.' },
      { hr: 'vani', en: 'outside', ex: 'Vani je lijepo.' },
    ],
    quiz: [
      {
        q: 'Gdje se nalazi kafić?',
        qEn: 'Where is the café located?',
        opts: ['U Splitu', 'Na plaži', 'U centru Zagreba', 'Blizu tržnice'],
        correct: 2,
      },
      {
        q: 'Što naručuje Maja?',
        qEn: 'What does Maja order?',
        opts: ['Kavu i kroasan', 'Limunadu i kroasan', 'Samo kavu', 'Čaj i kolač'],
        correct: 1,
      },
      {
        q: 'Koliko košta kava?',
        qEn: 'How much does the coffee cost?',
        opts: ['Dva eura', 'Jedan euro i dvadeset centi', 'Jedan euro i pedeset centi', 'Tri eura'],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a1_5',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '🚌',
    title: 'Na autobusnoj stanici',
    titleEn: 'At the Bus Station',
    duration: 3,
    focus: 'Transport vocabulary • Asking for information • Time',
    intro:
      'Ante needs to get to Rijeka. Practice buying bus tickets and asking for travel information.',
    paragraphs: [
      {
        hr: 'Ante stoji na autobusnoj stanici u Zagrebu. On treba ići u Rijeku. Putuje autobusom jer nema auto.',
        en: 'Ante is standing at the bus station in Zagreb. He needs to go to Rijeka. He travels by bus because he does not have a car.',
      },
      {
        hr: '"Oprostite, kada ide sljedeći autobus za Rijeku?" pita Ante na blagajni.\n"Sljedeći autobus ide u dvanaest i trideset," kaže blagajnik.\n"Jedna karta, molim vas. Koliko košta?"\n"Petnaest eura. Imate li studentsku iskaznicu?"\n"Da, imam." Ante plati trinaest eura.',
        en: '"Excuse me, when does the next bus to Rijeka go?" asks Ante at the ticket office.\n"The next bus goes at twelve thirty," says the clerk.\n"One ticket, please. How much does it cost?"\n"Fifteen euros. Do you have a student card?"\n"Yes, I do." Ante pays thirteen euros.',
      },
      {
        hr: 'Ante sjedne na klupu i čeka. Autobus dolazi na vrijeme. Vožnja traje oko dva sata. Ante gleda kroz prozor i sluša glazbu na slušalicama.',
        en: 'Ante sits on a bench and waits. The bus arrives on time. The journey takes about two hours. Ante looks out of the window and listens to music on headphones.',
      },
    ],
    vocabulary: [
      { hr: 'autobusna stanica', en: 'bus station', ex: 'Čekam na autobusnoj stanici.' },
      { hr: 'karta', en: 'ticket', ex: 'Kupujem kartu za Rijeku.' },
      { hr: 'blagajnik', en: 'ticket clerk (male)', ex: 'Blagajnik prodaje karte.' },
      { hr: 'studentska iskaznica', en: 'student card', ex: 'Imam studentsku iskaznicu.' },
      { hr: 'vožnja', en: 'journey / ride', ex: 'Vožnja traje dva sata.' },
      { hr: 'čekati', en: 'to wait', ex: 'Čekam autobus.' },
      { hr: 'na vrijeme', en: 'on time', ex: 'Autobus dolazi na vrijeme.' },
      { hr: 'prozor', en: 'window', ex: 'Gledam kroz prozor.' },
      { hr: 'slušalice', en: 'headphones', ex: 'Slušam glazbu na slušalicama.' },
    ],
    quiz: [
      {
        q: 'Zašto Ante putuje autobusom?',
        qEn: 'Why does Ante travel by bus?',
        opts: ['Jer voli autobuse', 'Jer nema auto', 'Jer je jeftinije', 'Jer je stanica blizu'],
        correct: 1,
      },
      {
        q: 'U koliko sati ide sljedeći autobus?',
        qEn: 'What time does the next bus go?',
        opts: ['U jedanaest i trideset', 'U dvanaest i trideset', 'U trinaest', 'U deset'],
        correct: 1,
      },
      {
        q: 'Koliko Ante plati za kartu?',
        qEn: 'How much does Ante pay for the ticket?',
        opts: ['Petnaest eura', 'Deset eura', 'Trinaest eura', 'Dvanaest eura'],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a1_6',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    icon: '🏖️',
    title: 'Na plaži',
    titleEn: 'At the Beach',
    duration: 3,
    focus: 'Weather vocabulary • Body parts • Simple descriptions',
    intro:
      'Ana and her sister spend a summer day on a Croatian beach. Practice describing weather and beach activities.',
    paragraphs: [
      {
        hr: 'Ana i njena sestra Ivana su na plaži u Zadru. More je plavo i mirno. Sunce sjaji i nije vjetrovito. Savršen je dan za plažu!',
        en: 'Ana and her sister Ivana are at the beach in Zadar. The sea is blue and calm. The sun is shining and it is not windy. It is a perfect day for the beach!',
      },
      {
        hr: 'Ana pliva u moru. Voda je hladna ali osvježavajuća. Ivana leži na ručniku i čita knjigu. Ona ne voli plivati ali voli sunčati se.',
        en: 'Ana swims in the sea. The water is cold but refreshing. Ivana lies on a towel and reads a book. She does not like swimming but she likes sunbathing.',
      },
      {
        hr: 'Poslije plivanja, Ana i Ivana jedu sladoled. Sladoled je od čokolade i vanilije. Ukusan je! Ostaju na plaži do šest sati navečer.',
        en: "After swimming, Ana and Ivana eat ice cream. The ice cream is chocolate and vanilla flavour. It is delicious! They stay at the beach until six o'clock in the evening.",
      },
    ],
    vocabulary: [
      { hr: 'plaža', en: 'beach', ex: 'Idemo na plažu.' },
      { hr: 'more', en: 'sea', ex: 'More je plavo.' },
      { hr: 'plivati', en: 'to swim', ex: 'Ana pliva svaki dan.' },
      { hr: 'ručnik', en: 'towel', ex: 'Ležim na ručniku.' },
      { hr: 'sunčati se', en: 'to sunbathe', ex: 'Volim sunčati se.' },
      { hr: 'sladoled', en: 'ice cream', ex: 'Jedem sladoled od jagode.' },
      { hr: 'osvježavajuć', en: 'refreshing', ex: 'Voda je osvježavajuća.' },
      { hr: 'mirno', en: 'calm / peaceful', ex: 'More je mirno danas.' },
      { hr: 'navečer', en: 'in the evening', ex: 'Idemo kući navečer.' },
    ],
    quiz: [
      {
        q: 'Gdje su Ana i Ivana?',
        qEn: 'Where are Ana and Ivana?',
        opts: ['U Splitu', 'U Dubrovniku', 'U Zadru', 'U Šibeniku'],
        correct: 2,
      },
      {
        q: 'Što radi Ivana na plaži?',
        qEn: 'What does Ivana do at the beach?',
        opts: ['Pliva u moru', 'Leži i čita knjigu', 'Jede burek', 'Spava'],
        correct: 1,
      },
      {
        q: 'Kada Ana i Ivana odlaze s plaže?',
        qEn: 'When do Ana and Ivana leave the beach?',
        opts: ['U četiri sata', 'U pet sati', 'U šest sati navečer', 'U sedam sati navečer'],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // A2 — continued (gs_a2_4 – gs_a2_6)
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_a2_4',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '🍕',
    title: 'Večera u restoranu',
    titleEn: 'Dinner at the Restaurant',
    duration: 3,
    focus: 'Past tense (jesam + participle) • Food vocabulary • Expressing opinions',
    intro:
      'Marko took his girlfriend Petra to a restaurant in Dubrovnik for her birthday. Practice restaurant language and past tense.',
    paragraphs: [
      {
        hr: 'Jučer navečer, Marko je odveo svoju djevojku Petru u restoran u Dubrovniku. Bio je njezin rođendan. Restoran se zove "Konoba Dalmatia" i nalazi se blizu Stare gradske jezgre.',
        en: 'Yesterday evening, Marko took his girlfriend Petra to a restaurant in Dubrovnik. It was her birthday. The restaurant is called "Konoba Dalmatia" and is located near the Old Town.',
      },
      {
        hr: 'Naručili su dalmatinske specijalitete. Petra je jela prstace na buzaru — to su dagnje kuhane s češnjakom i vinom. Marko je naručio brancina na žaru s blitvom i krumpirom. Za desert, dijelili su fritule — male dalmatinske krofne posute šećerom.',
        en: 'They ordered Dalmatian specialities. Petra ate date mussels in buzara sauce — these are mussels cooked with garlic and wine. Marko ordered grilled sea bass with chard and potatoes. For dessert, they shared fritule — small Dalmatian doughnuts dusted with sugar.',
      },
      {
        hr: 'Večera je bila odlična. Petra je rekla da su fritule bile najbolji desert koji je ikada jela. Marko se smiješio i bio je sretan što je odabrao taj restoran. Platili su sto dvadeset eura, ali vrijedilo je svake lipe.',
        en: 'The dinner was excellent. Petra said the fritule were the best dessert she had ever eaten. Marko smiled and was happy that he had chosen that restaurant. They paid one hundred and twenty euros, but it was worth every cent.',
      },
    ],
    vocabulary: [
      {
        hr: 'konoba',
        en: 'traditional Croatian restaurant / tavern',
        ex: 'Volim večerati u konobi.',
      },
      { hr: 'prstaci', en: 'date mussels (shellfish)', ex: 'Prstaci su dalmatinski specijalitet.' },
      { hr: 'brancin', en: 'sea bass', ex: 'Brancin na žaru je ukusan.' },
      { hr: 'blitva', en: 'Swiss chard', ex: 'Blitva s krumpirom je prilog.' },
      { hr: 'fritule', en: 'small Dalmatian doughnuts', ex: 'Fritule su slatke i ukusne.' },
      { hr: 'naručiti', en: 'to order (food)', ex: 'Naručio sam brancina.' },
      { hr: 'dijeliti', en: 'to share', ex: 'Dijelimo desert.' },
      { hr: 'vrijediti', en: 'to be worth', ex: 'To vrijedi svake lipe.' },
      { hr: 'odabrati', en: 'to choose / select', ex: 'Odabrali smo dobar restoran.' },
    ],
    quiz: [
      {
        q: 'Zašto su Marko i Petra otišli u restoran?',
        qEn: 'Why did Marko and Petra go to the restaurant?',
        opts: [
          'Jer su bili gladni',
          'Jer je bio Petrin rođendan',
          'Jer je bio Markov rođendan',
          'Jer su slavili posao',
        ],
        correct: 1,
      },
      {
        q: 'Što je Petra jela za glavno jelo?',
        qEn: 'What did Petra eat for the main course?',
        opts: ['Brancina na žaru', 'Prstace na buzaru', 'Fritule', 'Pastu'],
        correct: 1,
      },
      {
        q: 'Što je Petra rekla o fritulama?',
        qEn: 'What did Petra say about the fritule?',
        opts: [
          'Da su bile preskupe',
          'Da su bile premale',
          'Da su bile najbolji desert koji je ikada jela',
          'Da su bile premasne',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a2_5',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '⚽',
    title: 'Utakmica Dinama',
    titleEn: 'A Dinamo Match',
    duration: 3,
    focus: 'Past tense • Sports vocabulary • Expressing excitement',
    intro:
      'Josip went to see his favourite football club, Dinamo Zagreb, play at Maksimir stadium. Practice sports language and narrating past events.',
    paragraphs: [
      {
        hr: 'Prošle subote, Josip je otišao na stadion Maksimir gledati utakmicu Dinama. Dinamo je igrao protiv Hajduka iz Splita — to je najveći derbi u hrvatskom nogometu. Josip je kupio kartu tjedan dana ranije jer su karte brzo rasprodane.',
        en: 'Last Saturday, Josip went to the Maksimir stadium to watch a Dinamo match. Dinamo played against Hajduk from Split — this is the biggest derby in Croatian football. Josip bought his ticket a week earlier because tickets sell out quickly.',
      },
      {
        hr: 'Atmosfera na stadionu bila je nevjerojatna. Navijači su pjevali i vikali cijelu utakmicu. U dvadeset i petoj minuti, Dinamo je zabio gol i svi su skočili na noge. Na kraju prve poluvremena rezultat je bio jedan nula za Dinamo.',
        en: 'The atmosphere at the stadium was incredible. The fans sang and shouted throughout the match. In the twenty-fifth minute, Dinamo scored a goal and everyone jumped to their feet. At the end of the first half the score was one-nil to Dinamo.',
      },
      {
        hr: 'U drugom poluvremenu, Hajduk je izjednačio. Ali u devedeset i drugoj minuti, Dinamo je zabio pobjednički gol! Josip je bio presretan. Vratio se kući kasno navečer, ali nije mogao zaspati od uzbuđenja.',
        en: 'In the second half, Hajduk equalised. But in the ninety-second minute, Dinamo scored the winning goal! Josip was overjoyed. He got home late in the evening, but he could not fall asleep from excitement.',
      },
    ],
    vocabulary: [
      { hr: 'utakmica', en: 'match / game', ex: 'Idemo gledati utakmicu.' },
      { hr: 'stadion', en: 'stadium', ex: 'Maksimir je veliki stadion.' },
      { hr: 'navijač', en: 'fan / supporter', ex: 'Josip je navijač Dinama.' },
      { hr: 'zabiti gol', en: 'to score a goal', ex: 'Dinamo je zabio gol.' },
      { hr: 'derbi', en: 'derby (big local rivalry match)', ex: 'Dinamo-Hajduk derbi je poseban.' },
      { hr: 'izjednačiti', en: 'to equalise', ex: 'Hajduk je izjednačio u drugom poluvremenu.' },
      { hr: 'poluvrijeme', en: 'half time / half', ex: 'Rezultat na poluvremenu bio je 1:0.' },
      { hr: 'uzbuđenje', en: 'excitement', ex: 'Nije mogao spavati od uzbuđenja.' },
      { hr: 'rasprodati', en: 'to sell out', ex: 'Karte su rasprodane.' },
    ],
    quiz: [
      {
        q: 'Tko je igrao u utakmici?',
        qEn: 'Who played in the match?',
        opts: ['Dinamo i Rijeka', 'Dinamo i Hajduk', 'Hajduk i Osijek', 'Dinamo i Šibenik'],
        correct: 1,
      },
      {
        q: 'Koji je bio rezultat na poluvremenu?',
        qEn: 'What was the score at half time?',
        opts: ['Dva nula za Dinamo', 'Jedan jedan', 'Jedan nula za Dinamo', 'Nula nula'],
        correct: 2,
      },
      {
        q: 'Kada je Dinamo zabio pobjednički gol?',
        qEn: 'When did Dinamo score the winning goal?',
        opts: [
          'U dvadeset i petoj minuti',
          'Na poluvremenu',
          'U devedeset i drugoj minuti',
          'Na početku utakmice',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_a2_6',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    icon: '🎶',
    title: 'Klapa na rivi',
    titleEn: 'Klapa on the Promenade',
    duration: 3,
    focus: 'Past + present tense • Music vocabulary • Cultural descriptions',
    intro:
      'Katarina heard a klapa group singing on the Šibenik waterfront. Practice describing cultural experiences and using mixed tenses.',
    paragraphs: [
      {
        hr: 'Katarina je šetala rivom u Šibeniku jedne ljetne večeri. Bila je topla noć i grad je bio pun turista i mještana. Odjednom je čula pjevanje — grupu muškaraca koji su pjevali bez instrumenta.',
        en: 'Katarina was walking along the promenade in Šibenik one summer evening. It was a warm night and the town was full of tourists and locals. Suddenly she heard singing — a group of men singing without instruments.',
      },
      {
        hr: 'To je bila klapa — tradicionalni dalmatinski oblik pjevanja. Klapa se sastoji od muških glasova koji pjevaju u harmoniji. Pjesme su često o moru, ljubavi i zavičaju. Katarina je stala i slušala. Svi oko nje su također stali.',
        en: 'It was a klapa — the traditional Dalmatian form of singing. A klapa consists of male voices singing in harmony. The songs are often about the sea, love and homeland. Katarina stopped and listened. Everyone around her stopped too.',
      },
      {
        hr: 'Nakon nastupa, Katarina je prišla vođi klape i pitala ga o grupi. Rekao joj je da klapa postoji već dvadeset godina i da nastupaju svako ljeto na Šibenskoj rivi. UNESCO je 2012. godine proglasio klapu nematerijalnom kulturnom baštinom čovječanstva.',
        en: 'After the performance, Katarina approached the klapa leader and asked him about the group. He told her the klapa had existed for twenty years and that they perform every summer on the Šibenik waterfront. In 2012 UNESCO declared klapa an intangible cultural heritage of humanity.',
      },
    ],
    vocabulary: [
      { hr: 'riva', en: 'waterfront promenade', ex: 'Šetamo po rivi.' },
      {
        hr: 'klapa',
        en: 'klapa (traditional Dalmatian a cappella singing group)',
        ex: 'Klapa pjeva na rivi.',
      },
      { hr: 'harmonija', en: 'harmony', ex: 'Glasovi pjevaju u harmoniji.' },
      { hr: 'zavičaj', en: 'homeland / native region', ex: 'Pjesme su o zavičaju.' },
      { hr: 'nastup', en: 'performance', ex: 'Nastup klape bio je predivan.' },
      { hr: 'mještanin', en: 'local resident', ex: 'Mještani vole klapu.' },
      { hr: 'baština', en: 'heritage', ex: 'Klapa je kulturna baština.' },
      { hr: 'UNESCO', en: 'UNESCO', ex: 'UNESCO je proglasio klapu baštinom.' },
      { hr: 'odjednom', en: 'suddenly', ex: 'Odjednom je počela kiša.' },
    ],
    quiz: [
      {
        q: 'Gdje je Katarina čula klapu?',
        qEn: 'Where did Katarina hear the klapa?',
        opts: [
          'Na plaži u Splitu',
          'Na rivi u Šibeniku',
          'U kafiću u Zadru',
          'Na stadionu u Zagrebu',
        ],
        correct: 1,
      },
      {
        q: 'Što je klapa?',
        qEn: 'What is a klapa?',
        opts: [
          'Vrsta dalmatinske hrane',
          'Tradicionalni ples',
          'Tradicijski oblik a cappella pjevanja',
          'Glazbeni instrument',
        ],
        correct: 2,
      },
      {
        q: 'Kada je UNESCO proglasio klapu kulturnom baštinom?',
        qEn: 'When did UNESCO declare klapa cultural heritage?',
        opts: ['2000. godine', '2008. godine', '2012. godine', '2020. godine'],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // B1 — continued (gs_b1_4 – gs_b1_6)
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_b1_4',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '🫙',
    title: 'Peka — drevna tradicija',
    titleEn: 'Peka — Ancient Tradition',
    duration: 4,
    focus: 'Passive constructions • Cultural vocabulary • Instrumental case',
    intro:
      "Learn about peka, one of Croatia's most beloved cooking traditions, while practising passive voice and cultural description.",
    paragraphs: [
      {
        hr: 'Peka je jedan od najstarijih načina kuhanja u Dalmaciji i Istri. Radi se o metalnom poklopcu, koji se naziva peka ili čripnja, koji se stavlja iznad hrane dok se ona polako peče ispod žara od drvenog ugljena. Ovaj način kuhanja koristi se stoljećima i danas je simbolom dalmatinske kuhinje.',
        en: 'Peka is one of the oldest cooking methods in Dalmatia and Istria. It involves a metal lid, called peka or čripnja, which is placed over the food while it slowly cooks under the embers of charcoal. This cooking method has been used for centuries and today is a symbol of Dalmatian cuisine.',
      },
      {
        hr: 'Najčešće se pod pekom priprema janjetina, teletina ili piletina, obično s povrćem kao što su krumpiri, mrkva i luk. Meso se marinira nekoliko sati u maslinovom ulju, češnjaku i ružmarinu. Zatim se sve složi u plitku metalnu posudu, pokrije pekovim poklopcem i zaspe žarom. Jelo se priprema dva do tri sata.',
        en: 'Most often lamb, veal or chicken is prepared under the peka, usually with vegetables such as potatoes, carrots and onion. The meat is marinated for several hours in olive oil, garlic and rosemary. Then everything is arranged in a shallow metal dish, covered with the peka lid and buried under embers. The dish takes two to three hours to prepare.',
      },
      {
        hr: 'Ono što peku čini posebnom nije samo okus — to je cijeli ritual koji je oko nje nastao. U dalmatinskim obiteljima, priprema peke povod je za obiteljsko okupljanje. Dok jelo polako dozrijeva ispod žara, obitelj sjedi vani, razgovara i pije domaće vino. Gosti su uvijek dobrodošli. Kažu da je hrana pod pekon kuhana ljubavlju — i to se može osjetiti u svakom zalogaju.',
        en: 'What makes peka special is not just the flavour — it is the whole ritual that has grown up around it. In Dalmatian families, preparing a peka is an occasion for family gathering. While the dish slowly matures under the embers, the family sits outside, talks and drinks homemade wine. Guests are always welcome. They say food cooked under the peka is cooked with love — and you can taste it in every bite.',
      },
    ],
    vocabulary: [
      {
        hr: 'peka',
        en: 'peka (traditional Croatian domed cooking lid)',
        ex: 'Janjetina pod pekon je ukusna.',
      },
      { hr: 'žar', en: 'embers / hot coals', ex: 'Jelo se peče ispod žara.' },
      { hr: 'janjetina', en: 'lamb meat', ex: 'Janjetina pod pekon je specijalitet.' },
      { hr: 'marinirati', en: 'to marinate', ex: 'Mariniram meso u maslinovom ulju.' },
      { hr: 'maslinovo ulje', en: 'olive oil', ex: 'Dalmatinska kuhinja koristi maslinovo ulje.' },
      { hr: 'ružmarin', en: 'rosemary', ex: 'Ružmarin daje poseban okus mesu.' },
      { hr: 'ritual', en: 'ritual', ex: 'Peka je obiteljski ritual.' },
      { hr: 'zalogaj', en: 'bite / mouthful', ex: 'Svaki zalogaj je ukusan.' },
      {
        hr: 'dozrijevati',
        en: 'to mature / to slowly cook through',
        ex: 'Jelo dozrijeva ispod žara.',
      },
    ],
    quiz: [
      {
        q: 'Što je peka?',
        qEn: 'What is peka?',
        opts: ['Vrsta kruha', 'Metalni poklopac za kuhanje', 'Dalmatinski ples', 'Vrsta sira'],
        correct: 1,
      },
      {
        q: 'Koliko dugo se priprema jelo pod pekon?',
        qEn: 'How long does a peka dish take to prepare?',
        opts: ['Pola sata', 'Jedan sat', 'Dva do tri sata', 'Pet sati'],
        correct: 2,
      },
      {
        q: 'Što obitelj radi dok jelo dozrijeva ispod žara?',
        qEn: 'What does the family do while the dish matures under the embers?',
        opts: ['Spava', 'Ide u crkvu', 'Sjedi vani, razgovara i pije vino', 'Ide na plažu'],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_b1_5',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '🏰',
    title: 'Dubrovnik: grad i zidine',
    titleEn: 'Dubrovnik: the City and its Walls',
    duration: 4,
    focus: 'Historical present • Genitive of possession • Describing places',
    intro:
      "Explore the history and architecture of Dubrovnik's famous Old Town. Practice describing places, using the genitive case, and narrating historical facts.",
    paragraphs: [
      {
        hr: 'Dubrovnik je jedan od najočuvanijih primjera gotičko-renesansne arhitekture na Mediteranu. Stari grad okružen je moćnim kamenim zidinama dugim gotovo dva kilometra, koje su građene i pojačavane od 13. do 17. stoljeća. Dubrovnik je 1979. uvršten na UNESCO-ov popis mjesta Svjetske baštine.',
        en: "Dubrovnik is one of the best-preserved examples of Gothic-Renaissance architecture in the Mediterranean. The Old Town is surrounded by mighty stone walls almost two kilometres long, which were built and reinforced from the 13th to the 17th century. In 1979 Dubrovnik was placed on UNESCO's World Heritage list.",
      },
      {
        hr: 'Šetnja po zidinama traje otprilike sat i pol i nudi nevjerojatne poglede na Jadransko more i crvene krovove staroga grada. Duž zidina smješteno je nekoliko tvrđava: Lovrijenac, Minčeta i Revelin. Lovrijenac, koji stoji na 37 metara visokoj stijeni izvan zidina, posebno je impresivan. Na njemu piše natpis: "Non bene pro toto libertas venditur auro" — "Sloboda se ne prodaje ni za sve zlato na svijetu."',
        en: 'Walking the walls takes about an hour and a half and offers incredible views of the Adriatic Sea and the red rooftops of the old town. Along the walls several fortresses are positioned: Lovrijenac, Minčeta and Revelin. Lovrijenac, which stands on a 37-metre-high rock outside the walls, is particularly impressive. It bears the inscription: "Non bene pro toto libertas venditur auro" — "Freedom is not sold for all the gold in the world."',
      },
      {
        hr: 'Dubrovnik je bio slobodna republika — Dubrovačka Republika — od 1358. do 1808. godine. U tom razdoblju, grad je bio jedno od najvažnijih trgovačkih središta Mediterana, poznato po svojoj vještoj diplomaciji i bogatim trgovcima. Danas je Dubrovnik jedan od najpopularnijih turističkih odredišta u Europi i prima više od milijun posjetitelja godišnje.',
        en: 'Dubrovnik was a free republic — the Republic of Ragusa — from 1358 to 1808. During that period, the city was one of the most important trading centres of the Mediterranean, known for its skilled diplomacy and wealthy merchants. Today Dubrovnik is one of the most popular tourist destinations in Europe, receiving more than a million visitors a year.',
      },
    ],
    vocabulary: [
      { hr: 'zidine', en: 'city walls', ex: 'Šetamo po zidinama Dubrovnika.' },
      { hr: 'tvrđava', en: 'fortress', ex: 'Lovrijenac je stara tvrđava.' },
      { hr: 'baština', en: 'heritage', ex: 'Dubrovnik je Svjetska baština.' },
      { hr: 'arhitektura', en: 'architecture', ex: 'Dubrovnik ima prekrasnu arhitekturu.' },
      { hr: 'republika', en: 'republic', ex: 'Dubrovačka Republika bila je slobodna.' },
      { hr: 'diplomacija', en: 'diplomacy', ex: 'Grad je bio poznat po diplomaciji.' },
      { hr: 'trgovac', en: 'merchant / trader', ex: 'Bogati trgovci živjeli su u gradu.' },
      { hr: 'okružen', en: 'surrounded', ex: 'Grad je okružen zidinama.' },
      { hr: 'natpis', en: 'inscription', ex: 'Na tvrđavi je latinski natpis.' },
    ],
    quiz: [
      {
        q: 'Koliko je duga dubrovačka zidina?',
        qEn: 'How long are the Dubrovnik walls?',
        opts: ['Pola kilometra', 'Jedan kilometar', 'Gotovo dva kilometra', 'Tri kilometra'],
        correct: 2,
      },
      {
        q: 'Što znači natpis na tvrđavi Lovrijenac?',
        qEn: 'What does the inscription on fortress Lovrijenac mean?',
        opts: [
          'Dobrodošli u Dubrovnik',
          'Sloboda se ne prodaje ni za sve zlato na svijetu',
          'Bog i Hrvati',
          'Mir i ljubav',
        ],
        correct: 1,
      },
      {
        q: 'Koliko dugo je Dubrovnik bio slobodna republika?',
        qEn: 'How long was Dubrovnik a free republic?',
        opts: ['Oko sto godina', 'Od 1358. do 1808.', 'Od 1200. do 1500.', 'Samo pedeset godina'],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_b1_6',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    icon: '🌿',
    title: 'Istra: vino, tartufi i masline',
    titleEn: 'Istria: Wine, Truffles and Olives',
    duration: 4,
    focus: 'Relative clauses • Impersonal constructions • Agricultural vocabulary',
    intro:
      "Discover Istria's famous gastronomic landscape. Practice relative clauses, impersonal constructions, and vocabulary related to food and agriculture.",
    paragraphs: [
      {
        hr: 'Istra je poluotok koji se smatra kulinarskom prijestolnicom Hrvatske. Tlo Istre bogato je crvenom "terra rossa" zemljom, koja je idealna za uzgoj masline, vinove loze i mnogih aromatičnih biljaka. Upravo zbog tog jedinstvenog tla, istarsko vino i maslinovo ulje poznati su diljem Europe.',
        en: 'Istria is a peninsula that is considered the culinary capital of Croatia. Istrian soil is rich in red "terra rossa" earth, which is ideal for growing olives, vines and many aromatic plants. It is precisely because of this unique soil that Istrian wine and olive oil are well known throughout Europe.',
      },
      {
        hr: 'Posebno mjesto u istarskoj gastronomiji zauzima tartuf — gljiva koja raste skrivena pod zemljom u hrastovim šumama. Istra ima neke od najvrjednijih vrsta tartufa na svijetu: bijeli tartuf, koji se bere u jesen, smatra se "dijamantom kuhinje". Jedan kilogram bijelog tartufa može koštati nekoliko tisuća eura. Lovci na tartufe, poznati kao tartufari, obučavaju posebne pse koji njuhom pronalaze skrivena blaga pod lišćem i korijenjem.',
        en: 'A special place in Istrian gastronomy is held by the truffle — a fungus that grows hidden underground in oak forests. Istria has some of the most valuable species of truffles in the world: the white truffle, which is harvested in autumn, is considered the "diamond of cuisine". One kilogram of white truffle can cost several thousand euros. Truffle hunters, known as tartufari, train special dogs that use their sense of smell to find hidden treasures beneath leaves and roots.',
      },
      {
        hr: 'Istra nije samo poznata po tartufu i vinu. Rovinj i Pula privlače milhune turista, a unutrašnjost poluotoka nudi mirna sela s kamenim kućama i izvorne okuse koji se sve teže nalaze drugdje. Posebno se preporučuje posjetiti istarsku konferenci — međunarodni sajam tartufa koji se svake godine održava u Livadama kod Buzeta. Tko jednom proba istarsku kuhinju, teško je zaboravi.',
        en: 'Istria is not only famous for truffles and wine. Rovinj and Pula attract millions of tourists, while the interior of the peninsula offers quiet villages with stone houses and authentic flavours that are increasingly hard to find elsewhere. A visit to the Istrian truffle fair — an international truffle festival held each year in Livade near Buzet — is particularly recommended. Anyone who tries Istrian cuisine once can hardly forget it.',
      },
    ],
    vocabulary: [
      { hr: 'tartuf', en: 'truffle', ex: 'Bijeli tartuf je jako skup.' },
      { hr: 'tartufar', en: 'truffle hunter', ex: 'Tartufari obučavaju pse.' },
      { hr: 'poluotok', en: 'peninsula', ex: 'Istra je poluotok na Jadranu.' },
      { hr: 'tlo', en: 'soil / ground', ex: 'Istarsko tlo je bogato i crveno.' },
      { hr: 'uzgoj', en: 'cultivation / growing', ex: 'Uzgoj masline je važan u Istri.' },
      { hr: 'gljiva', en: 'mushroom / fungus', ex: 'Tartuf je vrsta gljive.' },
      { hr: 'loza', en: 'grapevine', ex: 'Na brežuljcima rastu vinove loze.' },
      { hr: 'njuh', en: 'sense of smell', ex: 'Psi imaju odličan njuh.' },
      { hr: 'sajam', en: 'fair / trade show', ex: 'Sajam tartufa je svake godine u Buzetu.' },
    ],
    quiz: [
      {
        q: 'Zašto je istarsko tlo posebno?',
        qEn: 'Why is Istrian soil special?',
        opts: [
          'Jer je plavo',
          'Jer je bogata crvena "terra rossa" zemlja idealna za uzgoj',
          'Jer je uvijek mokro',
          'Jer nema minerala',
        ],
        correct: 1,
      },
      {
        q: 'Kada se bere bijeli tartuf?',
        qEn: 'When is the white truffle harvested?',
        opts: ['U proljeće', 'Ljeti', 'U jesen', 'Zimi'],
        correct: 2,
      },
      {
        q: 'Kako tartufari pronalaze tartufe?',
        qEn: 'How do tartufari find truffles?',
        opts: [
          'Uz pomoć posebno obučenih pasa',
          'Metal detektorom',
          'Kopanjem na slijepo',
          'Uz pomoć satelita',
        ],
        correct: 0,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // B2 — Advanced (gs_b2_1 – gs_b2_4)
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_b2_1',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    icon: '📖',
    title: 'Miroslav Krleža i hrvatska književnost',
    titleEn: 'Miroslav Krleža and Croatian Literature',
    duration: 5,
    focus: 'Literary register • Subordinate clauses • Imperfect & pluperfect',
    intro:
      "Explore the life and legacy of Croatia's greatest 20th-century writer, Miroslav Krleža. Practice formal literary register and complex sentence structures.",
    paragraphs: [
      {
        hr: 'Miroslav Krleža — književnik, dramatičar, esejist i enciklopedist — najznačajnija je figura moderne hrvatske književnosti. Rođen je 1893. u Zagrebu, u doba kada je Hrvatska još uvijek bila dio Austro-Ugarske Monarhije, a umro je 1981. kao državno priznat velikan socijalističke Jugoslavije. Paradoks njegova položaja — neprilagodljivi buntovnik koji je istovremeno bio blizak vlastima — obilježava svu složenost njegova opusa i njegova vremena.',
        en: 'Miroslav Krleža — writer, playwright, essayist and encyclopaedist — is the most significant figure of modern Croatian literature. He was born in 1893 in Zagreb, at a time when Croatia was still part of the Austro-Hungarian Monarchy, and died in 1981 as a state-recognised giant of socialist Yugoslavia. The paradox of his position — an uncompromising rebel who was at the same time close to the authorities — marks all the complexity of his body of work and his era.',
      },
      {
        hr: 'Krležin književni opus je golem i raznovrstan. U dramama kao što su "Gospoda Glembajevi" i "U agoniji", Krleža razotkriva moralnu trulost građanske klase u predratnoj Hrvatskoj. U romanima "Na rubu pameti" i "Povratak Filipa Latinovicza" propituje ulogu intelektualca u društvu koje ga ne razumije i ne trpi. Njegova poezija, posebice zbirka "Balade Petrice Kerempuha" pisana čakavsko-kajkavskim jezičnim slojevima, postiže izniman lirski učinak koji se opire jednostavnom prevođenju.',
        en: 'Krleža\'s literary output is vast and varied. In plays such as "The Glembay Family" and "In Agony", Krleža exposes the moral rot of the bourgeois class in pre-war Croatia. In the novels "On the Edge of Reason" and "The Return of Philip Latinovicz", he interrogates the role of the intellectual in a society that neither understands nor tolerates him. His poetry, especially the collection "The Ballads of Petrica Kerempuh" written in Chakavian-Kajkavian linguistic layers, achieves an exceptional lyrical effect that resists simple translation.',
      },
      {
        hr: 'Uz književni rad, Krleža je bio glavni urednik Enciklopedije Jugoslavije, monumentalnog projekta koji je obilježio zlatno doba jugoslavenske leksikografije. Kao predsjednik Društva hrvatskih književnika, 1967. potpisao je "Deklaraciju o nazivu i položaju hrvatskog književnog jezika" — dokument koji je zahtijevao ravnopravnost hrvatskog jezika u odnosu na srpski, što mu je donijelo sukob s vlastima. Krleža je ostao kontroverzna figura: na Zapadu cijenjen kao autor europskog formata, u Hrvatskoj poštovan i osporavan istovremeno. Njegova djela i danas se čitaju, igraju i tumače na novim načinima, svjedočeći o njihovoj trajnoj aktualnosti.',
        en: 'Alongside his literary work, Krleža was chief editor of the Encyclopaedia of Yugoslavia, a monumental project that marked the golden age of Yugoslav lexicography. As president of the Society of Croatian Writers, in 1967 he signed the "Declaration on the Name and Status of the Croatian Literary Language" — a document demanding equal status for Croatian in relation to Serbian, which brought him into conflict with the authorities. Krleža remains a controversial figure: valued in the West as a writer of European stature, simultaneously revered and contested in Croatia. His works are still read, performed and interpreted in new ways today, testifying to their enduring relevance.',
      },
    ],
    vocabulary: [
      { hr: 'dramatičar', en: 'playwright', ex: 'Krleža je bio pisac i dramatičar.' },
      { hr: 'enciklopedist', en: 'encyclopaedist', ex: 'Radio je kao enciklopedist.' },
      { hr: 'buntovnik', en: 'rebel', ex: 'Bio je neprilagodljivi buntovnik.' },
      { hr: 'opus', en: 'body of work / oeuvre', ex: 'Krležin opus je golem.' },
      { hr: 'razotkrivati', en: 'to expose / reveal', ex: 'Drama razotkriva moralnu trulost.' },
      {
        hr: 'propitivati',
        en: 'to interrogate / question',
        ex: 'Roman propituje ulogu intelektualca.',
      },
      { hr: 'leksikografija', en: 'lexicography', ex: 'Bio je veliki doprinos leksikografiji.' },
      { hr: 'osporavati', en: 'to contest / dispute', ex: 'Krleža je i danas osporavan.' },
      {
        hr: 'aktualnost',
        en: 'relevance / topicality',
        ex: 'Njegova dijela imaju trajnu aktualnost.',
      },
    ],
    quiz: [
      {
        q: 'Kada je i gdje je rođen Miroslav Krleža?',
        qEn: 'When and where was Miroslav Krleža born?',
        opts: ['1893. u Splitu', '1893. u Zagrebu', '1900. u Dubrovniku', '1881. u Osijeku'],
        correct: 1,
      },
      {
        q: 'Što je Krleža potpisao 1967. godine?',
        qEn: 'What did Krleža sign in 1967?',
        opts: [
          'Ustav Jugoslavije',
          'Deklaraciju o nazivu i položaju hrvatskog književnog jezika',
          'Sporazum o miru',
          'Statut Dinama',
        ],
        correct: 1,
      },
      {
        q: 'Čemu svjedoče Krležina djela koja se i danas čitaju i igraju?',
        qEn: "What do Krleža's works being read and performed today testify to?",
        opts: [
          'Nedostatku novih pisaca',
          'Njihovoj trajnoj aktualnosti',
          'Lošem ukusu publike',
          'Državnoj cenzuri',
        ],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_b2_2',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    icon: '🌊',
    title: 'Domovinski rat i sjećanje',
    titleEn: 'The Homeland War and Memory',
    duration: 5,
    focus: 'Complex past constructions • Abstract nouns • Sensitive historical register',
    intro:
      'A thoughtful exploration of how Croatia commemorates the 1990s Homeland War. Practise advanced past tense constructions, abstract vocabulary, and handling sensitive historical topics.',
    paragraphs: [
      {
        hr: 'Domovinski rat — koji je trajao od 1991. do 1995. — temeljni je događaj suvremene hrvatske identifikacije. Hrvatska je 25. lipnja 1991. proglasila neovisnost, no agresija Jugoslavenske narodne armije i srpskih paravojnih postrojbi uskoro je eskalirala u oružani sukob koji je obilježio čitavo desetljeće. Gradovi kao Vukovar, Dubrovnik i Šibenik postali su simboli otpora i patnje.',
        en: "The Homeland War — which lasted from 1991 to 1995 — is the foundational event of contemporary Croatian identity. Croatia declared independence on 25 June 1991, but the aggression of the Yugoslav People's Army and Serbian paramilitary formations soon escalated into an armed conflict that marked an entire decade. Cities such as Vukovar, Dubrovnik and Šibenik became symbols of resistance and suffering.",
      },
      {
        hr: 'Vukovar je posebno mjesto u kolektivnoj memoriji. Opsada Vukovara trajala je od kolovoza do studenog 1991. Branitelji grada — vojnici i civili ramena uz rame — odolijevali su znatno nadmoćnijem neprijatelju 87 dana. Grad je na kraju pao 18. studenog 1991. Slika voduške vodotornja, izbucanog ali uspravnog usred razrušenoga grada, postala je jedan od najprepoznatljivijih simbola rata i otpora.',
        en: "Vukovar holds a special place in collective memory. The siege of Vukovar lasted from August to November 1991. The city's defenders — soldiers and civilians side by side — held out against a vastly superior enemy for 87 days. The city finally fell on 18 November 1991. The image of the Vukovar water tower, riddled with bullets yet standing upright amid the ruined city, became one of the most recognisable symbols of the war and of resistance.",
      },
      {
        hr: 'Pitanje sjećanja na Domovinski rat ostaje složeno i politički osjetljivo. Hrvatska društvo suočava se s izazovom koji je zajednički mnogim poslijeratnim društvima: kako kolektivno sjećanje učiniti mjestom pomirenja, a ne trajnog sukoba. Vukovar danas živi sporo gospodarsko oporavak, a demografski se nije vratio na predratnu razinu. Ipak, svake godine na Obljetnici pada Vukovara, 18. studenog, tisuće hodočasnika hodaju ulicama grada u tišini, noseći cvijeće i upaljene lampione. Taj šutljivi mimohod — kolona sjećanja — najmoćniji je odgovor na sve pokušaje brisanja prošlosti.',
        en: 'The question of memory of the Homeland War remains complex and politically sensitive. Croatian society faces a challenge common to many post-war societies: how to make collective memory a place of reconciliation rather than perpetual conflict. Vukovar today lives through a slow economic recovery, and demographically has not returned to pre-war levels. Yet every year on the Anniversary of the Fall of Vukovar, 18 November, thousands of pilgrims walk the city streets in silence, carrying flowers and lit lanterns. This silent march — the column of remembrance — is the most powerful response to all attempts to erase the past.',
      },
    ],
    vocabulary: [
      { hr: 'neovisnost', en: 'independence', ex: 'Hrvatska je proglasila neovisnost 1991.' },
      { hr: 'opsada', en: 'siege', ex: 'Opsada Vukovara trajala je 87 dana.' },
      { hr: 'branitelj', en: 'defender (of homeland)', ex: 'Branitelji su čuvali grad.' },
      { hr: 'vodotoranj', en: 'water tower', ex: 'Vukovarski vodotoranj je simbol otpora.' },
      { hr: 'pomirenje', en: 'reconciliation', ex: 'Pomirenje je dug i težak proces.' },
      { hr: 'hodočasnik', en: 'pilgrim', ex: 'Tisuće hodočasnika hodaju 18. studenog.' },
      { hr: 'lampion', en: 'lantern / paper lantern', ex: 'Nose upaljene lampione u sjećanje.' },
      { hr: 'oporavak', en: 'recovery', ex: 'Grad prolazi sporo gospodarski oporavak.' },
      { hr: 'mimohod', en: 'march / procession', ex: 'Šutljivi mimohod traje cijelo jutro.' },
    ],
    quiz: [
      {
        q: 'Koliko je dana trajala opsada Vukovara?',
        qEn: 'How many days did the siege of Vukovar last?',
        opts: ['50 dana', '87 dana', '120 dana', '200 dana'],
        correct: 1,
      },
      {
        q: 'Što je simbol otpora iz Vukovara?',
        qEn: 'What is the symbol of resistance from Vukovar?',
        opts: ['Stara crkva', 'Vodotoranj', 'Gradska vijećnica', 'Tvrđava'],
        correct: 1,
      },
      {
        q: 'Što se svake godine događa 18. studenog u Vukovaru?',
        qEn: 'What happens every year on 18 November in Vukovar?',
        opts: [
          'Sportski maraton',
          'Glazbeni festival',
          'Šutljivi mimohod tisuća hodočasnika',
          'Vojska parade',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_b2_3',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    icon: '🏙️',
    title: 'Zagreb između tradicije i suvremenosti',
    titleEn: 'Zagreb between Tradition and Modernity',
    duration: 5,
    focus: 'Contrast structures • Urban sociology vocabulary • Gerunds and verbal nouns',
    intro:
      "Explore the tensions and harmonies between Zagreb's historic character and its contemporary urban life. Practise contrast structures, complex subordination, and urban vocabulary.",
    paragraphs: [
      {
        hr: 'Zagreb je grad koji živi u produktivnoj napetosti između starog i novog. Gornji grad — s Kaptolom, katedralom i labirintom uskih kamenih ulica — svjedok je tisućljetne prošlosti, dok se samo petnaest minuta hoda dalje, na Savici i Novom Zagrebu, rasprostire sasvim drukčiji urbani pejzaž: betonski blokovi nastali u doba socijalizma, danas sve češće okruženi niklim kavarnama, coworking prostorima i kreativnim industrijama.',
        en: "Zagreb is a city that lives in productive tension between the old and the new. The Upper Town — with Kaptol, the cathedral and a labyrinth of narrow stone streets — is a witness to a millennia-long past, while just fifteen minutes' walk away, in Savica and New Zagreb, an entirely different urban landscape spreads out: concrete blocks built in the socialist era, today increasingly surrounded by new cafés, coworking spaces and creative industries.",
      },
      {
        hr: 'Potres koji je pogodio Zagreb u ožujku 2020. — jačine 5,5 po Richteru — razgolitio je dublje strukturne probleme: tisuće zgrada u gradskoj jezgri bile su oštećene, a u nekim dijelovima Gornjeg i Donjeg grada sanacija još uvijek nije završena. Potres je međutim potaknuo i širu javnu raspravu o urbanom planiranju, zaštiti kulturne baštine i položaju stanara u sve skupljim privatnim najmovima. Mnogi mladi Zagrepčani, suočeni s nemogućnošću kupnje stana u centru, sele se u prigradska naselja ili odlaze u inozemstvo.',
        en: 'The earthquake that struck Zagreb in March 2020 — measuring 5.5 on the Richter scale — laid bare deeper structural problems: thousands of buildings in the city centre were damaged, and in some parts of the Upper and Lower Town reconstruction is still not complete. The earthquake, however, also prompted a broader public debate about urban planning, the protection of cultural heritage and the situation of tenants in increasingly expensive private rentals. Many young Zagrebians, faced with the impossibility of buying a flat in the centre, are moving to suburban settlements or leaving for abroad.',
      },
      {
        hr: 'Unatoč tim izazovima, Zagreb se nameće kao regionalno kulturno središte. Muzej suvremene umjetnosti, Muzej prekinutih veza — koji je stekao međunarodnu slavu — i sve bogatija scena neovisnih kazališta i glazbenih festivala svjedoče o živoj kulturnoj energiji. Advent u Zagrebu proglašen je više puta najboljim božićnim tržištem u Europi, privlačeći posjetitelje iz cijeloga svijeta. Grad koji se gradi između trauma i nade, između nostalgije i inovacije, možda je upravo zbog te napetosti toliko živ.',
        en: 'Despite these challenges, Zagreb asserts itself as a regional cultural centre. The Museum of Contemporary Art, the Museum of Broken Relationships — which has gained international fame — and an increasingly rich scene of independent theatres and music festivals attest to a vibrant cultural energy. Zagreb Advent has been named the best Christmas market in Europe on multiple occasions, attracting visitors from all over the world. A city building itself between trauma and hope, between nostalgia and innovation, is perhaps precisely because of that tension so alive.',
      },
    ],
    vocabulary: [
      { hr: 'napetost', en: 'tension', ex: 'Zagreb živi u napetosti između starog i novog.' },
      { hr: 'pejzaž', en: 'landscape / cityscape', ex: 'Urbani pejzaž Novog Zagreba je drukčiji.' },
      {
        hr: 'sanacija',
        en: 'reconstruction / remediation',
        ex: 'Sanacija zgrada još nije završena.',
      },
      { hr: 'najam', en: 'rent / rental', ex: 'Privatni najam je sve skuplji.' },
      { hr: 'prigradski', en: 'suburban', ex: 'Mladi sele u prigradska naselja.' },
      { hr: 'kazalište', en: 'theatre', ex: 'Volim ići u kazalište.' },
      { hr: 'nostalgia', en: 'nostalgia', ex: 'Grad živi između nostalgije i inovacije.' },
      {
        hr: 'razgolititi',
        en: 'to lay bare / expose',
        ex: 'Potres je razgolitio strukturne probleme.',
      },
      {
        hr: 'nametnuti se',
        en: 'to assert itself / impose itself',
        ex: 'Zagreb se nameće kao kulturno središte.',
      },
    ],
    quiz: [
      {
        q: 'Kada je Zagreb pogodio potres opisan u tekstu?',
        qEn: 'When did the earthquake described in the text hit Zagreb?',
        opts: ['U siječnju 2019.', 'U prosincu 2020.', 'U ožujku 2020.', 'U lipnju 2021.'],
        correct: 2,
      },
      {
        q: 'Čime se Muzej prekinutih veza posebno ističe?',
        qEn: 'What is the Museum of Broken Relationships particularly noted for?',
        opts: [
          'Svojom veličinom',
          'Međunarodnom slavom',
          'Izložbom o ratu',
          'Interaktivnim eksponatima',
        ],
        correct: 1,
      },
      {
        q: 'Što mnogi mladi Zagrepčani rade zbog visokih cijena stanova u centru?',
        qEn: 'What do many young Zagrebians do because of high flat prices in the centre?',
        opts: [
          'Kupuju stanove na kredit',
          'Ostaju s roditeljima',
          'Sele se u prigradska naselja ili odlaze u inozemstvo',
          'Renoviraju stare zgrade',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_b2_4',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    icon: '🌍',
    title: 'Hrvatska dijaspora i identitet',
    titleEn: 'The Croatian Diaspora and Identity',
    duration: 5,
    focus:
      'Conditional and subjunctive-like constructions • Identity vocabulary • Complex argumentation',
    intro:
      "An analytical text on Croatian identity, emigration, and the diaspora's relationship with the homeland. Practise advanced vocabulary, argumentation structures, and conditional constructions.",
    paragraphs: [
      {
        hr: 'Procjenjuje se da između tri i četiri milijuna Hrvata i osoba hrvatskog porijekla živi izvan granica Republike Hrvatske — broj koji je gotovo usporediv s ukupnim brojem stanovnika same države. Hrvatska dijaspora koncentrirana je ponajprije u Njemačkoj, Australiji, Kanadi, Sjedinjenim Državama i u susjednim državama, ali i u Južnoj Americi, gdje postoje snažne zajednice u Argentini i Čileu, potomci emigrantskih valova s kraja 19. i početka 20. stoljeća.',
        en: 'It is estimated that between three and four million Croatians and persons of Croatian origin live outside the borders of the Republic of Croatia — a number almost comparable with the total number of inhabitants of the state itself. The Croatian diaspora is concentrated primarily in Germany, Australia, Canada, the United States and neighbouring countries, but also in South America, where there are strong communities in Argentina and Chile, descendants of emigrant waves from the late 19th and early 20th centuries.',
      },
      {
        hr: 'Odnos dijaspore prema domovini složen je i mijenja se iz generacije u generaciju. Za prve generacije emigranata, odlazak je bio traumatičan raskid, a čuvanje jezika, vjere i običaja postajalo je egzistencijalnim pitanjem identiteta. Druhge i treće generacije često govore o tzv. "dvostrukom identitetu" — osjećaju da ne pripadaju sasvim ni ovdje ni tamo. Zanimljivo je da su upravo Hrvati iz dijaspore imali ključnu ulogu u međunarodnom priznavanju hrvatske neovisnosti 1991. i 1992. godine, lobirajeći u parlamentima i vladama zemalja primitka.',
        en: 'The diaspora\'s relationship with the homeland is complex and changes from generation to generation. For first-generation emigrants, departure was a traumatic rupture, and the preservation of language, faith and customs became an existential question of identity. Second and third generations often speak of a so-called "dual identity" — the feeling of not belonging entirely either here or there. Interestingly, it was precisely Croatians from the diaspora who played a key role in the international recognition of Croatian independence in 1991 and 1992, lobbying in the parliaments and governments of their host countries.',
      },
      {
        hr: 'Suvremena emigracija iz Hrvatske — koja se posebno ubrzala ulaskom u Europsku uniju 2013. godine — donosi nova pitanja. Mladi, obrazovani Hrvati odlaze zbog boljih ekonomskih mogućnosti, niže birokratske opterećenosti i veće kvalitete javnih usluga u zapadnoj Europi. Demografska erozija, koja je jedna od najozbiljnijih prijetnji dugoročnoj stabilnosti Hrvatske, teško se može zaustaviti bez sustavnih strukturnih reformi. Hrvatska vlada pokušava privući povratnike posebnim poreznim olakšicama, ali uspjeh tih mjera ostaje skroman. Pitanje dijaspore nije samo sentimentalno — ono je usko vezano uz budućnost cijele nacije.',
        en: "Contemporary emigration from Croatia — which accelerated particularly after EU accession in 2013 — raises new questions. Young, educated Croatians leave for better economic opportunities, lower bureaucratic burden and higher quality of public services in Western Europe. Demographic erosion, which is one of the most serious threats to Croatia's long-term stability, cannot easily be stopped without systematic structural reforms. The Croatian government attempts to attract returnees with special tax incentives, but the success of these measures remains modest. The diaspora question is not merely sentimental — it is closely tied to the future of the entire nation.",
      },
    ],
    vocabulary: [
      { hr: 'dijaspora', en: 'diaspora', ex: 'Hrvatska dijaspora je brojna.' },
      { hr: 'porijeklo', en: 'origin / descent', ex: 'Ona je hrvatskog porijekla.' },
      { hr: 'emigrant', en: 'emigrant', ex: 'Prve generacije emigranata čuvale su jezik.' },
      { hr: 'raskid', en: 'rupture / break', ex: 'Odlazak je bio traumatičan raskid.' },
      { hr: 'lobirati', en: 'to lobby', ex: 'Lobirali su za neovisnost.' },
      {
        hr: 'demografski',
        en: 'demographic (adj.)',
        ex: 'Demografska erozija je ozbiljan problem.',
      },
      {
        hr: 'porezna olakšica',
        en: 'tax incentive / relief',
        ex: 'Vlada nudi porezne olakšice povratnicima.',
      },
      { hr: 'povratnik', en: 'returnee', ex: 'Mnogi povratnici donose nova znanja.' },
      { hr: 'erozija', en: 'erosion', ex: 'Demografska erozija ugrožava budućnost.' },
    ],
    quiz: [
      {
        q: 'Koliko se Hrvata i osoba hrvatskog porijekla procjenjuje da živi izvan Hrvatske?',
        qEn: 'How many Croatians and persons of Croatian origin are estimated to live outside Croatia?',
        opts: [
          'Oko milijun',
          'Između tri i četiri milijuna',
          'Oko pet milijuna',
          'Manje od pola milijuna',
        ],
        correct: 1,
      },
      {
        q: 'Kakvu su ulogu imali Hrvati iz dijaspore 1991. i 1992. godine?',
        qEn: 'What role did Croatians from the diaspora play in 1991 and 1992?',
        opts: [
          'Slali su humanitarnu pomoć',
          'Lobiranje za međunarodno priznavanje neovisnosti',
          'Osnivali su nove političke stranke',
          'Vraćali su se u Hrvatsku masovno',
        ],
        correct: 1,
      },
      {
        q: 'Što hrvatska vlada čini kako bi privukla povratnike?',
        qEn: 'What does the Croatian government do to attract returnees?',
        opts: [
          'Gradi nove stanove',
          'Nudi posebne porezne olakšice',
          'Plaća putne troškove',
          'Daje besplatne tečajeve',
        ],
        correct: 1,
      },
    ],
  },

  // ── C1 Stories ──────────────────────────────────────────────────────────────

  {
    id: 'gs_c1_1',
    level: 'C1',
    levelColor: '#4c1d95',
    levelBg: '#ede9fe',
    icon: '📖',
    title: 'Jezik kao ogledalo kulture',
    titleEn: 'Language as a Mirror of Culture',
    duration: 7,
    focus: 'Verbal nouns • Formal discourse • Abstract linguistic concepts',
    intro:
      'An analytical essay on the relationship between language and cultural identity in the Croatian context. Practise verbal nouns, formal discourse markers, and abstract vocabulary.',
    paragraphs: [
      {
        hr: 'Jezik nije samo sredstvo komunikacije — on je i nositelj kulture, sjećanja i kolektivnog identiteta. Za Hrvate, ta dimenzija jezičnoga pitanja ima posebno značenje, uzimajući u obzir burnu povijest standardizacije i višestoljetnih pokušaja nametanja stranih jezičnih normi. Glagoljica, najstarije hrvatsko pismo, simbol je toga kontinuiteta: ona svjedoči o pismenosti koja seže u 9. stoljeće i koja je odolijevala latinizaciji i germanizaciji jednako kao što je preživjela osmanske prodore na periferiji.',
        en: 'Language is not merely a means of communication — it is also a carrier of culture, memory and collective identity. For Croatians, this dimension of the language question has a particular significance, given the turbulent history of standardisation and centuries-long attempts to impose foreign linguistic norms. Glagolitic script, the oldest Croatian writing system, is a symbol of that continuity: it bears witness to literacy reaching back to the 9th century, which resisted Latinisation and Germanisation just as it survived Ottoman incursions on the periphery.',
      },
      {
        hr: 'Standardizacija hrvatskoga književnog jezika u 19. stoljeću nije bila tek filološki projekt — bila je i politički čin. Ilirski preporoditelji, na čelu s Ljudevitom Gajem, težili su ujedinjavanju rasutih hrvatskih dijalekata u jedinstven književni standard koji bi mogao parirati mađarskome i njemačkome na razini javnoga diskursa. Uvođenje štokavske novoštokavske osnovice u standardni jezik podrazumijevalo je odricanje dijela autohtonih čakavskih i kajkavskih oblika — žrtvu koja se i danas propituje u lingvističkim i kulturnim raspravama.',
        en: 'The standardisation of the Croatian literary language in the 19th century was not merely a philological project — it was also a political act. The Illyrian Revival figures, led by Ljudevit Gaj, sought to unify the scattered Croatian dialects into a single literary standard that could rival Hungarian and German at the level of public discourse. The introduction of the Shtokavian Neo-Shtokavian base into the standard language entailed the abandonment of some autochthonous Chakavian and Kajkavian forms — a sacrifice that is still debated in linguistic and cultural discussions today.',
      },
      {
        hr: 'Danas, u dobu digitalne komunikacije, pitanje jezičnoga identiteta dobiva novu dimenziju. Pisana forma — nekad privilegija obrazovanih — sada je svakodnevna stvarnost za milijune korisnika društvenih mreža koji pišu onako kako govore: na čakavskome, kajkavskome, ili mješavinom standarda i žargona. Ta spontana demokratizacija pisanja ne ugrožava standardni jezik — ona ga obogaćuje, uvodeći u javni diskurs jezičnu raznolikost koja je uvijek bila dio hrvatskoga identiteta. Standardni jezik ostaje stup kulturnoga i administrativnoga jedinstva, ali vitalni su mu živci dijalekatski korijeni koji ga hrane autentičnošću.',
        en: 'Today, in the age of digital communication, the question of linguistic identity takes on a new dimension. Written form — once the privilege of the educated — is now an everyday reality for millions of social media users who write as they speak: in Chakavian, Kajkavian, or a mixture of standard language and slang. This spontaneous democratisation of writing does not threaten the standard language — it enriches it, introducing into public discourse the linguistic diversity that has always been part of Croatian identity. The standard language remains a pillar of cultural and administrative unity, but its vital nerves are the dialectal roots that nourish it with authenticity.',
      },
    ],
    vocabulary: [
      { hr: 'nositelj', en: 'carrier / bearer', ex: 'Jezik je nositelj kulture i sjećanja.' },
      {
        hr: 'standardizacija',
        en: 'standardisation',
        ex: 'Standardizacija języka bila je politički čin.',
      },
      {
        hr: 'filološki',
        en: 'philological (adj.)',
        ex: 'Filološki projekt trajao je desetljećima.',
      },
      {
        hr: 'odricanje',
        en: 'abandonment / renunciation',
        ex: 'Odricanje dijalekata bio je veliki korak.',
      },
      {
        hr: 'propitovati',
        en: 'to question / interrogate',
        ex: 'Ta se žrtva još uvijek propituje.',
      },
      {
        hr: 'obogaćivati',
        en: 'to enrich (imperfective)',
        ex: 'Dijalekti obogaćuju standardni jezik.',
      },
      { hr: 'dijalekatski', en: 'dialectal (adj.)', ex: 'Dijalekatski korijeni su važni.' },
      {
        hr: 'autentičnost',
        en: 'authenticity',
        ex: 'Autentičnost je temelj kulturnoga identiteta.',
      },
      { hr: 'javni diskurs', en: 'public discourse', ex: 'Jezik je dio javnoga diskursa.' },
    ],
    quiz: [
      {
        q: 'Što je, po tekstu, Glagoljica?',
        qEn: 'What, according to the text, is Glagolitic script?',
        opts: [
          'Simbol kontinuiteta hrvatske pismenosti',
          'Pismo koje je nastalo u 15. stoljeću',
          'Tursko pismo adaptirano za Slavene',
          'Najstariji europski alfabet uopće',
        ],
        correct: 0,
      },
      {
        q: 'Zašto su ilirski preporoditelji uveli štokavsku osnovicu u standard?',
        qEn: 'Why did the Illyrian Revival figures introduce the Shtokavian base into the standard?',
        opts: [
          'Jer je bio najbogatiji dijalekt',
          'Kako bi standard mogao parirati mađarskome i njemačkome',
          'Jer je to zahtijevao austrijski car',
          'Kako bi ujedinili sve slavenske narode',
        ],
        correct: 1,
      },
      {
        q: 'Kakav je, po tekstu, utjecaj digitalne komunikacije na standardni jezik?',
        qEn: 'What effect, according to the text, does digital communication have on the standard language?',
        opts: [
          'Ugrožava ga i smanjuje njegovu upotrebu',
          'Nema vidljivog utjecaja',
          'Obogaćuje ga uvodeći jezičnu raznolikost',
          'Potiče povratak glagoljici',
        ],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_c1_2',
    level: 'C1',
    levelColor: '#4c1d95',
    levelBg: '#ede9fe',
    icon: '🍷',
    title: 'Dalmatinska kuhinja: okus i sjećanje',
    titleEn: 'Dalmatian Cuisine: Taste and Memory',
    duration: 6,
    focus: 'Sensory vocabulary • Implicit cultural meaning • Complex noun phrases',
    intro:
      'A cultural essay on Dalmatian cuisine as a layered historical record. Practise complex noun phrases, abstract cultural vocabulary, and C1-level reading comprehension.',
    paragraphs: [
      {
        hr: 'Dalmatinska kuhinja nije tek zbroj recepata — ona je kodirana povijest, zapis klimatske i geopolitičke sudbine jedne obale. Venecijanska vladavina ostavila je trag u upotrebi maslinovog ulja i vina kao temeljnih kulinarskih medija; osmansko susjedstvo uvelo je neke mirodije i načine konzerviranja; rimsko naslijeđe vidljivo je u odabiru riba i školjaka koji se malo promijenio kroz dva tisućljeća. Kuhati po dalmatinski znači, u svakom smislu, kuhati po slojevima povijesti.',
        en: 'Dalmatian cuisine is not merely a collection of recipes — it is a coded history, a record of the climatic and geopolitical fate of a coastline. Venetian rule left its mark in the use of olive oil and wine as foundational culinary media; Ottoman neighbourliness introduced some spices and methods of preservation; the Roman legacy is visible in the choice of fish and shellfish, which has changed little over two millennia. To cook in the Dalmatian way means, in every sense, to cook through layers of history.',
      },
      {
        hr: 'Peko — posuda za pečenje ispod žara — možda je najprecizniji simbol dalmatinskoga kulinarskog pristupa. Spora, pokrivena kuhinja: meso ili riba polaže se s povrćem i uljem, peko se poklopi, a zatim zaspe žarom. Strpljenje je ovdje tehnika, a ne vrlina — bez njega nema ni okusa. Takav se način kuhanja ne može ubrzati bez gubitka: onaj tko pokušava pečenku pod pekom brzopleto pretvoriti u ekspresni obrok, izgubit će precizno ono što peko obećava.',
        en: 'The peka — a bell-shaped lid for roasting under embers — is perhaps the most precise symbol of the Dalmatian culinary approach. Slow, covered cooking: meat or fish is arranged with vegetables and oil, the peka is closed, and then covered with embers. Patience here is technique, not virtue — without it there is no flavour either. This method of cooking cannot be hurried without loss: whoever tries to hastily turn a peka roast into an express meal will lose precisely what the peka promises.',
      },
      {
        hr: 'Primat ribe u dalmatinskoj kuhinji nije tek pitanje dostupnosti — on odražava dublje poimanje odnosa čovjeka i mora. Riba je svježa ili nikakva; marinada i mirodije služe naglašavanju, a ne prikrivanju okusa. Ovaj filozofski stav prema sirovini — koji akademski gastronomi danas nazivaju "kuhinjom minimalne intervencije" — u Dalmaciji nije moda ni trend, nego praksa stara koliko i sam ribolov. Ribari koji su ujutro izvukli mrežu, o podne su priredili roštilj, a navečer pojeli ostatke s malo kruha i vinom: to je recept koji ne treba poboljšavati.',
        en: "Fish's primacy in Dalmatian cuisine is not merely a question of availability — it reflects a deeper understanding of the relationship between people and the sea. Fish is fresh or nothing; marinade and spices serve to accentuate, not conceal, the flavour. This philosophical stance towards the raw ingredient — which academic gastronomes today call the 'cuisine of minimal intervention' — in Dalmatia is not a fashion or trend, but a practice as old as fishing itself. Fishermen who drew up their nets in the morning prepared a grill at noon and ate the leftovers with a little bread and wine in the evening: that is a recipe that needs no improvement.",
      },
    ],
    vocabulary: [
      {
        hr: 'kulinarski',
        en: 'culinary (adj.)',
        ex: 'To je kulinarska tradicija stara tisućljećima.',
      },
      {
        hr: 'peko',
        en: 'traditional bell-shaped roasting lid',
        ex: 'Janjetina ispod peka je specijalitet.',
      },
      { hr: 'strpljenje', en: 'patience', ex: 'Strpljenje je ključ dobrog jela.' },
      {
        hr: 'sirovina',
        en: 'raw ingredient / raw material',
        ex: 'Kvalitetna sirovina je temelj svega.',
      },
      {
        hr: 'mirodije',
        en: 'spices / aromatics',
        ex: 'Dalmatinska kuhinja ne koristi previše mirodija.',
      },
      { hr: 'marinada', en: 'marinade', ex: 'Riba leži u marinadi sat vremena.' },
      {
        hr: 'naglašavati',
        en: 'to accentuate / emphasise (impf.)',
        ex: 'Ulje naglašava okus ribe.',
      },
      {
        hr: 'poimanje',
        en: 'understanding / conception',
        ex: 'Poimanje hrane ovdje je filozofija.',
      },
      {
        hr: 'intervencija',
        en: 'intervention',
        ex: 'Minimalna intervencija znači poštovanje sirovine.',
      },
    ],
    quiz: [
      {
        q: 'Koji je, po tekstu, utjecaj venecijanske vladavine na dalmatinsku kuhinju?',
        qEn: 'What, according to the text, was the influence of Venetian rule on Dalmatian cuisine?',
        opts: [
          'Uvođenje mesa kao glavnog jela',
          'Upotreba maslinovog ulja i vina kao temeljnih kulinarskih medija',
          'Tradicija peka i sporoga kuhanja',
          'Donošenje egzotičnih ribljih vrsta',
        ],
        correct: 1,
      },
      {
        q: 'Što peko simbolizira u dalmatinskom pristupu kuhanju?',
        qEn: 'What does the peka symbolise in the Dalmatian approach to cooking?',
        opts: [
          'Brzo i efikasno kuhanje',
          'Talijansku kulinarsku tradiciju',
          'Sporo kuhanje koje zahtijeva strpljenje',
          'Modernu tehniku roštiljanja',
        ],
        correct: 2,
      },
      {
        q: 'Što znači "kuhinja minimalne intervencije" kako je opisana u tekstu?',
        qEn: 'What does "cuisine of minimal intervention" mean as described in the text?',
        opts: [
          'Kuhinja koja koristi malo posuđa i opreme',
          'Filozofija da sirovina treba biti naglašena, a ne prikrivena',
          'Japanski stil kuhanja adaptiran za Mediteran',
          'Kuhinja bez soli i mirodija',
        ],
        correct: 1,
      },
    ],
  },

  {
    id: 'gs_c1_3',
    level: 'C1',
    levelColor: '#4c1d95',
    levelBg: '#ede9fe',
    icon: '✍️',
    title: 'Miroslav Krleža i moderna hrvatska proza',
    titleEn: 'Miroslav Krleža and Modern Croatian Prose',
    duration: 7,
    focus: 'Literary Croatian • Critical analysis vocabulary • Complex subordination',
    intro:
      "An analytical introduction to Croatia's most important 20th-century writer. Practise literary register, critical vocabulary, and complex argument structures at C1 level.",
    paragraphs: [
      {
        hr: 'Miroslav Krleža (1893.–1981.) ostaje najmoćnijim glasom modernog hrvatskog romana, eseja i drame. Njegova proza — gruba, polifonična, prepuna aluzija na europsku povijest i filozofiju — nije salonska književnost za lagano čitanje, nego izazov koji traži od čitatelja punu angažiranost. Romani kao što su "Povratak Filipa Latinovicza" i "Zastave" mogu se čitati kao pokušaji razumijevanja raspada Austro-Ugarske Monarhije i rađanja novih, nerijetko krvavijih poredaka — ali i kao duboke studije psihičke i moralne razrovanosti modernoga čovjeka.',
        en: 'Miroslav Krleža (1893–1981) remains the most powerful voice of the modern Croatian novel, essay and drama. His prose — rough, polyphonic, full of allusions to European history and philosophy — is not salon literature for easy reading, but a challenge that demands full engagement from the reader. Novels such as "The Return of Filip Latinovicz" and "Banners" can be read as attempts to understand the collapse of the Austro-Hungarian Monarchy and the birth of new, often bloodier orders — but also as deep studies of the psychological and moral disintegration of modern man.',
      },
      {
        hr: "Krležin stil svjesno krši konvencije ujednačene proze: rečenice se nižu u dugačkim zamršenostima, digresije postaju temeljne, a svaki monolog junaka otkriva slojeve protuslovlja koja se nikad ne razrješuju. Ta fragmentarnost nije manjkavost nego poetički program — Krleža odbija laž zaključenosti i nudi čitatelju ono što opisuje kao 'otvorenu ranu' modernoga iskustva. Pod tim su utjecajem rasli Antun Šoljan, Slobodan Novak i cijela generacija šezdesetih, koji su razvijali vlastite varijante hrvatske postmoderne lirske proze.",
        en: "Krleža's style deliberately violates the conventions of smooth prose: sentences accumulate in long convolutions, digressions become foundational, and each character's monologue reveals layers of contradictions that are never resolved. This fragmentariness is not a shortcoming but a poetic programme — Krleža refuses the lie of closure and offers the reader what he describes as the 'open wound' of modern experience. Under this influence grew Antun Šoljan, Slobodan Novak and an entire generation of the 1960s, who developed their own variants of Croatian postmodern lyrical prose.",
      },
      {
        hr: 'Čitati Krležu danas znači suočiti se i s pitanjima koja nisu zastarjela: klasna napetost, ambivalentnost intelektualca u politički opterećenim vremenima, somatska i psihička cijena modernizacije. Njegova Enciklopedija — monumentalni projekt koji je Krleža vodio desetljećima — svjedoči o razlogu zbog kojega je bio toliko omiljen kod jugoslavenskih vlasti koliko i sumnjičav prema njima: bio je prevelik, presložen i previše protuslovit da bi se smjestio u bilo kakvu ideološku šablonu. Taj paradoks čini ga možda najpotpunijim hrvatskim intelektualcem 20. stoljeća.',
        en: 'To read Krleža today means confronting questions that have not aged: class tension, the ambivalence of the intellectual in politically burdened times, the somatic and psychological cost of modernisation. His Encyclopaedia — a monumental project that Krleža led for decades — bears witness to the reason he was as beloved by Yugoslav authorities as he was suspicious of them: he was too large, too complex and too contradictory to fit into any ideological template. This paradox makes him perhaps the most complete Croatian intellectual of the 20th century.',
      },
    ],
    vocabulary: [
      {
        hr: 'polifon/polifonija',
        en: 'polyphonic / polyphony',
        ex: 'Krležina proza je polifonična.',
      },
      { hr: 'aluzija', en: 'allusion', ex: 'Tekst je prepun aluzija na povijest.' },
      { hr: 'angažiranost', en: 'engagement / commitment', ex: 'Čitanje traži punu angažiranost.' },
      { hr: 'protuslovlje', en: 'contradiction', ex: 'Likovi su puni protuslovlja.' },
      { hr: 'fragmentarnost', en: 'fragmentariness', ex: 'Fragmentarnost je poetički program.' },
      {
        hr: 'ambivalentnost',
        en: 'ambivalence',
        ex: 'Ambivalentnost intelektualca je vječna tema.',
      },
      { hr: 'šablona', en: 'template / mould', ex: 'Ne uklapa se ni u jednu ideološku šablonu.' },
      { hr: 'paradoks', en: 'paradox', ex: 'To je temeljni paradoks njegova lika.' },
      {
        hr: 'poetički',
        en: 'poetic (pertaining to poetics)',
        ex: 'To je poetički, ne estetski izbor.',
      },
    ],
    quiz: [
      {
        q: 'Što karakterizira Krležin stilski pristup prema tekstu?',
        qEn: "What characterises Krleža's stylistic approach according to the text?",
        opts: [
          'Kratke, jasne rečenice i jednostavne priče',
          'Duge, digresivne rečenice s nerazrješenim protuslovljima',
          'Klasičan narativni format 19. stoljeća',
          'Humor i ironija kao dominantna sredstva',
        ],
        correct: 1,
      },
      {
        q: 'Što tekst govori o Krleži i jugoslavenskim vlastima?',
        qEn: 'What does the text say about Krleža and the Yugoslav authorities?',
        opts: [
          'Otvoreno se suprotstavljao vlastima i bio progonjen',
          'Bio je potpuno odan režimu',
          'Bio je omiljen, ali previše složen za svaku ideološku šablonu',
          'Živio je u emigraciji i pisao o domovini',
        ],
        correct: 2,
      },
      {
        q: 'Koji pisac je prema tekstu nastao pod Krležinim utjecajem?',
        qEn: "Which writer, according to the text, developed under Krleža's influence?",
        opts: ['Ivan Gundulić', 'Marko Marulić', 'Slobodan Novak', 'August Šenoa'],
        correct: 2,
      },
    ],
  },

  {
    id: 'gs_c1_4',
    level: 'C1',
    levelColor: '#4c1d95',
    levelBg: '#ede9fe',
    icon: '🌊',
    title: 'Ekološki izazovi Jadrana',
    titleEn: 'Ecological Challenges of the Adriatic',
    duration: 7,
    focus: 'Academic/formal register • Environmental vocabulary • Complex argument structures',
    intro:
      'A formal analytical text on the environmental pressures facing the Adriatic Sea. Practise academic register, scientific vocabulary, and C1-level argumentation in Croatian.',
    paragraphs: [
      {
        hr: 'Jadransko more, koje pokriva oko 138.000 četvornih kilometara i dostiže prosječnu dubinu od 173 metra, pripada ekološki najosjetljivijim morskim sustavima Mediterana. Kao poluotvoreno more s relativno ograničenom izmjenom vode s otvorenim Sredozemljem, Jadran je posebno podložan bioakumulaciji zagađivala iz industrijskih i poljoprivrednih izvora duž dalmatinske i talijanske obale. Povišene temperature mora, smanjena slanost u sjevernim plitkim vodama zbog porasta slatkovodnog otjecanja, te promjene u fitoplanktonskim zajednicama — sve su to pokazatelji koji upućuju na sustavne pomake u ekosustavu.',
        en: 'The Adriatic Sea, covering approximately 138,000 square kilometres and reaching an average depth of 173 metres, belongs to the most ecologically sensitive marine systems in the Mediterranean. As a semi-enclosed sea with relatively limited exchange of water with the open Mediterranean, the Adriatic is particularly susceptible to bioaccumulation of pollutants from industrial and agricultural sources along the Dalmatian and Italian coasts. Elevated sea temperatures, reduced salinity in the northern shallow waters due to increased freshwater runoff, and changes in phytoplankton communities — these are all indicators pointing to systemic shifts in the ecosystem.',
      },
      {
        hr: 'Ribarska industrija, nekada temelj obalne ekonomije, prolazi kroz sustavno iscrpljivanje resursa: stokovi plave ribe — sardina i skuša — smanjili su se za procijenjenih 30 do 40% u posljednjih dvadeset godina. Kvote propisane u okviru Zajedničke ribarske politike Europske unije dijelomično su suzbile prelov, ali nadzor nad provedbom ostaje nedostatan u malim lukama duž Dalmacije. Usporedno s tim, bilježi se širenje invazivnih vrsta — posebno blagovice Lagocephalus sceleratus — čija je prisutnost promijenila ponašanje i kretanje lokalnih ronioca i ribolovaca.',
        en: "The fishing industry, once the foundation of the coastal economy, is undergoing systematic resource depletion: stocks of blue fish — sardines and mackerel — have declined by an estimated 30 to 40% over the past twenty years. Quotas prescribed under the European Union's Common Fisheries Policy have partially suppressed overfishing, but enforcement oversight remains insufficient in the small harbours along Dalmatia. Concurrently, the spread of invasive species is being recorded — particularly the silver-cheeked toadfish Lagocephalus sceleratus — whose presence has changed the behaviour and movement of local divers and fishermen.",
      },
      {
        hr: 'Odgovori na ekološku krizu Jadrana ne mogu biti isključivo tehničko-regulatorni. Kulturna promjena u odnosu prema moru — od resursne prema suodgovornoj logici — preduvjet je za svaku dugoročnu strategiju. Inicijative kao što su morska zaštićena područja pokazuju pozitivne rezultate tamo gdje postoji lokalna podrška i edukacija, ali izostaju tamo gdje su standardi postavljeni izvana, bez uključivanja ribarskih zajednica u proces donošenja odluka. Budućnost Jadrana ovisi o sposobnosti institucija i lokalnih zajednica da pregovaraju oko interesa koji se čine nespojivima — ali koji su, u dugoročnoj perspektivi, zapravo zajednički.',
        en: 'Responses to the ecological crisis of the Adriatic cannot be exclusively technical-regulatory in nature. A cultural shift in the relationship towards the sea — from a resource logic to a co-responsible logic — is a precondition for any long-term strategy. Initiatives such as marine protected areas show positive results where local support and education exist, but are absent where standards are set from outside, without the inclusion of fishing communities in the decision-making process. The future of the Adriatic depends on the ability of institutions and local communities to negotiate around interests that appear incompatible — but which are, in the long-term perspective, actually shared.',
      },
    ],
    vocabulary: [
      {
        hr: 'bioakumulacija',
        en: 'bioaccumulation',
        ex: 'Bioakumulacija zagađivala je ozbiljan problem.',
      },
      {
        hr: 'fitoplankton',
        en: 'phytoplankton',
        ex: 'Promjene u fitoplanktonskim zajednicama su alarmantan znak.',
      },
      {
        hr: 'iscrpljivanje',
        en: 'depletion (verbal noun)',
        ex: 'Iscrpljivanje resursa mora se zaustaviti.',
      },
      { hr: 'prelov', en: 'overfishing', ex: 'Kvote trebaju spriječiti prelov.' },
      { hr: 'nadzor', en: 'oversight / supervision', ex: 'Nadzor nad provedbom je nedostatan.' },
      { hr: 'invazivna vrsta', en: 'invasive species', ex: 'Blagovica je opasna invazivna vrsta.' },
      {
        hr: 'suodgovornost',
        en: 'co-responsibility',
        ex: 'Suodgovornost je ključ ekološke politike.',
      },
      { hr: 'preduvjet', en: 'precondition', ex: 'Edukacija je preduvjet promjene.' },
      {
        hr: 'donošenje odluka',
        en: 'decision-making',
        ex: 'Ribari moraju sudjelovati u donošenju odluka.',
      },
    ],
    quiz: [
      {
        q: 'Zašto je Jadran posebno osjetljiv na zagađenje?',
        qEn: 'Why is the Adriatic particularly susceptible to pollution?',
        opts: [
          'Jer je najpliće more na Mediteranu',
          'Jer je poluotvoreno more s ograničenom izmjenom vode',
          'Jer ne prima slatku vodu iz rijeka',
          'Jer se ribolov odvija isključivo u sjevernom dijelu',
        ],
        correct: 1,
      },
      {
        q: 'Što tekst kaže o morskim zaštićenim područjima?',
        qEn: 'What does the text say about marine protected areas?',
        opts: [
          'Uvijek pokazuju pozitivne rezultate',
          'Nikad ne funkcioniraju bez EU potpore',
          'Rade bolje tamo gdje postoji lokalna podrška i edukacija',
          'Zabranjeni su prema međunarodnom pravu',
        ],
        correct: 2,
      },
      {
        q: 'Što, po tekstu, nije dovoljan odgovor na ekološku krizu?',
        qEn: 'What, according to the text, is not a sufficient response to the ecological crisis?',
        opts: [
          'Kulturna promjena u odnosu prema moru',
          'Isključivo tehnički i regulatorni pristup',
          'Uključivanje ribarskih zajednica u odlučivanje',
          'Suodgovorna logika upravljanja',
        ],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // B2 — Complex grammar, passive, conditional, formal register
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_b2_5',
    level: 'B2',
    levelColor: '#1d4ed8',
    levelBg: '#dbeafe',
    icon: '🏛️',
    title: 'Reforma Obrazovnog Sustava',
    titleEn: 'Reform of the Education System',
    duration: 10,
    focus: 'Passive voice • Conditional mood • Formal written register • Nominalisations',
    intro:
      'A newspaper editorial examines a proposed Croatian education reform. Practise understanding formal argumentation and the passive constructions common in written Croatian.',
    paragraphs: [
      {
        hr: 'Obrazovni sustav u Hrvatskoj suočava se s dubokim strukturnim problemima koji su se nakupljali desetljećima. Nedavno je Ministarstvo obrazovanja predstavilo prijedlog sveobuhvatne reforme koji bi, prema najavama, trebao biti proveden do 2027. godine. Kritičari, međutim, tvrde da je reforma zamišljena bez dovoljnog savjetovanja s nastavnicima i roditeljima.',
        en: 'The education system in Croatia is facing deep structural problems that have been accumulating for decades. Recently, the Ministry of Education presented a proposal for a comprehensive reform which, according to announcements, should be implemented by 2027. Critics, however, claim that the reform was conceived without sufficient consultation with teachers and parents.',
      },
      {
        hr: 'Prijedlog uključuje smanjenje broja obveznih predmeta u osnovnoj školi, uvođenje projektne nastave i veću autonomiju ravnatelja. Nastavnici su podijeljeni: jedni tvrde da bi reforme bile korisne kad bi bile praćene odgovarajućom podrškom i ulaganjima u infrastrukturu; drugi strahuju da bi smanjenje sati matematike i znanosti moglo oslabiti kompetencije učenika.',
        en: 'The proposal includes reducing the number of compulsory subjects in primary school, introducing project-based learning and greater autonomy for headteachers. Teachers are divided: some argue that the reforms would be useful if accompanied by appropriate support and investment in infrastructure; others fear that reducing mathematics and science hours could weaken pupil competencies.',
      },
      {
        hr: 'Reforma je bila podvrgnuta javnoj raspravi u kojoj je prikupljeno više od deset tisuća komentara. Analiza je pokazala da roditelji najčešće izražavaju zabrinutost zbog preopterećenosti djece, dok nastavnici uglavnom traže bolje plaće i manje administrativnih obveza. Mnogi stručnjaci ističu da bez sustavnog ulaganja u obrazovanje promjena kurikuluma sama po sebi neće donijeti željene rezultate.',
        en: 'The reform was subjected to a public consultation in which more than ten thousand comments were collected. The analysis showed that parents most frequently express concern about the overloading of children, while teachers mainly demand better pay and fewer administrative obligations. Many experts point out that without systematic investment in education, a curriculum change alone will not deliver the desired results.',
      },
      {
        hr: 'Bez obzira na ishod parlamentarnog glasanja koje se očekuje do kraja godine, jasno je da obrazovni sustav ne može ostati nepromijenjen. Pitanje je samo hoće li reforme biti provedene postupno, uz suglasnost svih dionika, ili će biti nametnute odozgo bez potrebnog konsenzusa.',
        en: "Regardless of the outcome of the parliamentary vote expected by year's end, it is clear that the education system cannot remain unchanged. The only question is whether the reforms will be implemented gradually, with the agreement of all stakeholders, or whether they will be imposed from above without the necessary consensus.",
      },
    ],
    vocabulary: [
      {
        hr: 'strukturni problemi',
        en: 'structural problems',
        ex: 'Sustav ima strukturne probleme.',
      },
      { hr: 'sveobuhvatan', en: 'comprehensive', ex: 'Sveobuhvatna reforma je potrebna.' },
      { hr: 'savjetovanje', en: 'consultation', ex: 'Savjetovanje s dionicima je važno.' },
      { hr: 'autonomija', en: 'autonomy', ex: 'Ravnatelji traže veću autonomiju.' },
      { hr: 'podvrgnut', en: 'subjected to', ex: 'Prijedlog je bio podvrgnut raspravi.' },
      {
        hr: 'preopterećenost',
        en: 'overload / being overburdened',
        ex: 'Djeca pate od preopterećenosti.',
      },
      { hr: 'dionici', en: 'stakeholders', ex: 'Svi dionici trebaju biti uključeni.' },
      { hr: 'nametnut', en: 'imposed', ex: 'Odluka je bila nametnuta odozgo.' },
      { hr: 'konsenzus', en: 'consensus', ex: 'Konsenzus je teško postići.' },
      { hr: 'kurikulum', en: 'curriculum', ex: 'Novi kurikulum uvodi projektnu nastavu.' },
    ],
    quiz: [
      {
        q: 'Koji je jedan od ciljeva predložene reforme?',
        qEn: 'What is one of the goals of the proposed reform?',
        opts: [
          'Povećanje broja obveznih predmeta',
          'Centralizacija upravljanja školama',
          'Uvođenje projektne nastave',
          'Ukidanje autonomije ravnatelja',
        ],
        correct: 2,
      },
      {
        q: 'Što roditelji najčešće ističu u javnoj raspravi?',
        qEn: 'What do parents most frequently raise in the public consultation?',
        opts: [
          'Potrebu za boljim plaćama nastavnika',
          'Zabrinutost zbog preopterećenosti djece',
          'Podršku smanjenju sati matematike',
          'Zahtjev za smanjenom autonomijom ravnatelja',
        ],
        correct: 1,
      },
      {
        q: 'Što stručnjaci ističu kao nužan uvjet za uspjeh reforme?',
        qEn: 'What do experts highlight as a necessary condition for the success of the reform?',
        opts: [
          'Brzo provođenje bez javne rasprave',
          'Sustavno ulaganje u obrazovanje',
          'Smanjenje broja nastavnika',
          'Ukidanje javnog obrazovanja',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'gs_b2_6',
    level: 'B2',
    levelColor: '#1d4ed8',
    levelBg: '#dbeafe',
    icon: '🧑‍⚖️',
    title: 'Potrošačka Prava',
    titleEn: 'Consumer Rights',
    duration: 9,
    focus: 'Conditional sentences • Passive constructions • Legal vocabulary • Formal letters',
    intro:
      'Ivan bought a faulty laptop and must navigate Croatian consumer rights law. This text introduces legal Croatian and the conditional constructions needed when making formal complaints.',
    paragraphs: [
      {
        hr: 'Ivan je kupio prijenosno računalo u jednoj od većih trgovina elektroničke robe. Dva tjedna nakon kupnje uređaj se počeo pregrijavati i iznenada isključivati. Kad bi se to ponovilo više puta, odlučio je potraži zaštitu svojih potrošačkih prava.',
        en: 'Ivan bought a laptop in one of the larger electronics stores. Two weeks after the purchase the device started overheating and switching off unexpectedly. When this repeated itself several times, he decided to seek protection of his consumer rights.',
      },
      {
        hr: 'Prema Zakonu o zaštiti potrošača, svaki kupac ima pravo na reklamaciju u roku od dvije godine od kupnje. Prodavač je dužan primiti reklamaciju i odgovoriti na nju u roku od petnaest dana. Ako bi prodavač odbio reklamaciju bez valjanog razloga, potrošač se može obratiti Državnom inspektoratu ili tražiti posredovanje putem europske platforme za rješavanje sporova.',
        en: 'According to the Consumer Protection Act, every buyer has the right to make a complaint within two years of purchase. The seller is obliged to accept the complaint and respond within fifteen days. If the seller were to refuse the complaint without valid reason, the consumer may contact the State Inspectorate or seek mediation through the European online dispute resolution platform.',
      },
      {
        hr: 'Ivan je napisao formalnu reklamaciju u kojoj je opisao kvar, priložio račun i fotografije zaslona s porukama o grešci. U pismu je naveo da zahtijeva popravak ili zamjenu uređaja, a u slučaju da nijedna opcija nije izvediva — povrat novca. Prodavač je odgovorio da će uređaj biti pregledan u ovlaštenom servisu te da će Ivan biti obaviješten o ishodu u roku od sedam radnih dana.',
        en: 'Ivan wrote a formal complaint in which he described the fault, attached the receipt and photographs of the screen with error messages. In the letter he stated that he was requesting repair or replacement of the device, and in the event that neither option was feasible — a refund. The seller responded that the device would be examined in an authorised service centre and that Ivan would be notified of the outcome within seven working days.',
      },
      {
        hr: 'Slučaj je na kraju riješen u Ivanovu korist — uređaj je zamijenjen novim modelom. Iskustvo ga je potaknulo da istraži svoja potrošačka prava podrobnije. Kako je sažeo: "Da sam znao svoja prava od početka, bio bih sigurniji u cijelom procesu."',
        en: 'The case was ultimately resolved in Ivan\'s favour — the device was replaced with a new model. The experience motivated him to explore his consumer rights more thoroughly. As he summarised: "If I had known my rights from the start, I would have been more confident throughout the whole process."',
      },
    ],
    vocabulary: [
      {
        hr: 'reklamacija',
        en: 'complaint (about defective goods)',
        ex: 'Predao je reklamaciju u trgovini.',
      },
      { hr: 'kvar', en: 'fault / breakdown', ex: 'Uređaj ima ozbiljan kvar.' },
      { hr: 'priložiti', en: 'to attach / enclose', ex: 'Priložio je račun uz reklamaciju.' },
      {
        hr: 'ovlašteni servis',
        en: 'authorised service centre',
        ex: 'Uređaj je poslan u ovlašteni servis.',
      },
      { hr: 'povrat novca', en: 'refund', ex: 'Tražio je povrat novca.' },
      {
        hr: 'Državni inspektorat',
        en: 'State Inspectorate',
        ex: 'Prijava je podnesena Državnom inspektoratu.',
      },
      { hr: 'posredovanje', en: 'mediation', ex: 'Posredovanje je brže od suda.' },
      {
        hr: 'valjani razlog',
        en: 'valid reason',
        ex: 'Odbijanje bez valjanog razloga je nezakonito.',
      },
      { hr: 'rok', en: 'deadline / time limit', ex: 'Rok za reklamaciju je dvije godine.' },
      { hr: 'izvediv', en: 'feasible', ex: 'Je li popravak izvediv?' },
    ],
    quiz: [
      {
        q: 'Koji je zakonski rok za reklamaciju u Hrvatskoj?',
        qEn: 'What is the legal deadline for a complaint in Croatia?',
        opts: ['Trideset dana', 'Šest mjeseci', 'Dvije godine', 'Pet godina'],
        correct: 2,
      },
      {
        q: 'Što je Ivan zatražio u formalnoj reklamaciji?',
        qEn: 'What did Ivan request in his formal complaint?',
        opts: [
          'Isključivo povrat novca',
          'Popravak, zamjenu ili povrat novca',
          'Besplatno produljenje jamstva',
          'Novi model uz nadoplatu',
        ],
        correct: 1,
      },
      {
        q: 'Čemu je Ivanovo iskustvo potaknulo druge?',
        qEn: "What did Ivan's experience motivate?",
        opts: [
          'Da izbjegavaju kupnju elektronike',
          'Da uvijek plaćaju gotovinom',
          'Da istraže svoja potrošačka prava',
          'Da kupuju isključivo online',
        ],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // C1 — Literary & academic Croatian, complex syntax
  // ═══════════════════════════════════════════════════════

  {
    id: 'gs_c1_5',
    level: 'C1',
    levelColor: '#7c3aed',
    levelBg: '#f5f3ff',
    icon: '⚖️',
    title: 'Demokratski Deficit',
    titleEn: 'Democratic Deficit',
    duration: 13,
    focus: 'Complex argument structure • Nominalisation • Academic register • Concessive clauses',
    intro:
      'A political science essay examines the concept of democratic deficit in the European Union. Practise reading dense academic Croatian with sophisticated argument structures.',
    paragraphs: [
      {
        hr: 'Pojam demokratskog deficita u Europskoj uniji odnosi se na strukturnu napetost između nadnacionalne naravi njezina upravljanja i demokratskih mehanizama koji ostaju, u velikoj mjeri, ukorijenjenima na razini nacionalnih država. Dok je Europski parlament ojačavao svoju ulogu Lisabonskim ugovorom, izvršna ovlast i dalje je disproporcionalno koncentrirana u Vijeću i Europskoj komisiji — tijelima čija je demokratska odgovornost neizravna ili posredovana.',
        en: 'The concept of democratic deficit in the European Union refers to the structural tension between the supranational nature of its governance and the democratic mechanisms that remain, to a large degree, rooted at the level of nation states. While the European Parliament strengthened its role through the Lisbon Treaty, executive power continues to be disproportionately concentrated in the Council and the European Commission — bodies whose democratic accountability is indirect or mediated.',
      },
      {
        hr: 'Teoričari poput Andrewa Moravcsika tvrde da se demokratski deficit preuveličava — da je EU zapravo usporediva s regulatornim agencijama unutar nacionalnih sustava i da njezina legitimnost proizlazi iz učinkovitosti i vladavine prava, a ne iz neposrednog mandata birača. Nasuprot tome, Jürgen Habermas argumentira da legitimnost kompleksnih pluralnih demokracija zahtijeva razvoj transeuropske javne sfere u kojoj bi se formirala istinska politička volja nadnacionalnog opsega.',
        en: 'Theorists such as Andrew Moravcsik argue that the democratic deficit is overstated — that the EU is actually comparable to regulatory agencies within national systems and that its legitimacy derives from effectiveness and the rule of law rather than from a direct electoral mandate. In contrast, Jürgen Habermas argues that the legitimacy of complex plural democracies requires the development of a trans-European public sphere in which genuine political will of a supranational scope would be formed.',
      },
      {
        hr: 'Hrvatska je u prvim godinama članstva u EU prolazila kroz intenzivan proces prilagodbe u kojemu su norme i procedure propisane iz Bruxellesa nerijetko dolazile u koliziju s ustaljenim domaćim administrativnim praksama. Ovaj je proces, paradoksalno, ojačao svjesnost o demokratskim deficitima i unutar samog nacionalnog sustava: transparentnost postupaka, neovisnost pravosuđa i uključenost civilnog društva postali su predmeti javnih rasprava koji ranije nisu imali institucionalnu rezonancu.',
        en: 'Croatia in its first years of EU membership went through an intensive process of adaptation in which the norms and procedures prescribed from Brussels often came into collision with established domestic administrative practices. This process, paradoxically, strengthened awareness of democratic deficits within the national system itself: transparency of procedures, judicial independence and the involvement of civil society became subjects of public debate that previously lacked institutional resonance.',
      },
      {
        hr: 'Rasprave o demokratskom deficitu nisu samo akademske — one impliciraju praktična pitanja o tome tko donosi odluke, u čije ime i uz kakvu odgovornost. Ostaje otvorenim pitanjem može li EU razviti oblike participativne demokracije koji bi nadišli formalne glasačke mehanizme i ponudili građanima osjećaj stvarnog sudjelovanja u oblikovanju zajedničke budućnosti.',
        en: 'Debates about democratic deficit are not merely academic — they imply practical questions about who makes decisions, in whose name and with what accountability. It remains an open question whether the EU can develop forms of participatory democracy that would transcend formal voting mechanisms and offer citizens a sense of genuine participation in shaping a common future.',
      },
    ],
    vocabulary: [
      { hr: 'nadnacionalan', en: 'supranational', ex: 'EU je nadnacionalna organizacija.' },
      {
        hr: 'disproporcionalno',
        en: 'disproportionately',
        ex: 'Moć je disproporcionalno raspodijeljena.',
      },
      { hr: 'posredovan', en: 'mediated / indirect', ex: 'Legitimnost je posredovana izborima.' },
      { hr: 'vladavina prava', en: 'rule of law', ex: 'Vladavina prava je temelj demokracije.' },
      { hr: 'javna sfera', en: 'public sphere', ex: 'Debate se vode u javnoj sferi.' },
      { hr: 'kolizija', en: 'collision / conflict', ex: 'Norme su došle u koliziju s praksama.' },
      { hr: 'transparentnost', en: 'transparency', ex: 'Transparentnost postupaka je ključna.' },
      { hr: 'rezonanca', en: 'resonance', ex: 'Tema nije imala institucionalnu rezonancu.' },
      {
        hr: 'participativna demokracija',
        en: 'participatory democracy',
        ex: 'Traže oblike participativne demokracije.',
      },
      { hr: 'implicirati', en: 'to imply / entail', ex: 'Ovo implicira ozbiljne posljedice.' },
    ],
    quiz: [
      {
        q: 'Što Moravcsik tvrdi o demokratskom deficitu EU?',
        qEn: "What does Moravcsik claim about the EU's democratic deficit?",
        opts: [
          'Da je to stvaran i ozbiljan problem',
          'Da je preuveličan i da EU podsjeća na regulatorne agencije',
          'Da EU nema nikakve demokratske mehanizme',
          'Da Europski parlament treba biti ukinut',
        ],
        correct: 1,
      },
      {
        q: 'Što je, prema tekstu, paradoksalno potaknulo demokratska pitanja u Hrvatskoj?',
        qEn: 'What, according to the text, paradoxically stimulated democratic questions in Croatia?',
        opts: [
          'Negativno iskustvo s EU fondovima',
          'Prilagodba normama EU-a',
          'Jačanje nacionalnog parlamenta',
          'Istraživanja akademskog sektora',
        ],
        correct: 1,
      },
      {
        q: 'Koje otvoreno pitanje tekst ističe na kraju?',
        qEn: 'Which open question does the text highlight at the end?',
        opts: [
          'Može li EU preživjeti bez Lisabonskog ugovora?',
          'Može li EU razviti participativnu demokraciju izvan formalnih glasačkih mehanizama?',
          'Treba li Hrvatska napustiti EU?',
          'Je li Europska komisija transparentnija od Vijeća?',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'gs_c1_6',
    level: 'C1',
    levelColor: '#7c3aed',
    levelBg: '#f5f3ff',
    icon: '🎭',
    title: 'Uloga Kulture u Izgradnji Identiteta',
    titleEn: 'The Role of Culture in Identity Construction',
    duration: 12,
    focus: 'Abstract argumentation • Relative clauses • Gerunds & verbal nouns • Cultural register',
    intro:
      'A cultural studies essay explores how culture constructs and constrains individual identity. This text uses the full range of C1 grammatical structures and cultivated literary Croatian.',
    paragraphs: [
      {
        hr: 'Kultura nije puka pozadina na kojoj se odvija individualni život — ona je aktivna sila koja oblikuje percepciju, usmjerava vrijednosti i određuje obrasce razumijevanja sebe i drugoga. Svaka zajednica nosi nasljedstvo simboličkih sustava — jezika, rituala, narativa — koji, prenošeni kroz generacije, konstituiraju ono što Anthony Giddens naziva "ontološkom sigurnošću": temeljnim osjećajem stalnosti i smislenosti koji nam omogućuje snalaženje u složenosti svakodnevnog iskustva.',
        en: "Culture is not merely a backdrop against which individual life unfolds — it is an active force that shapes perception, directs values and determines patterns of understanding oneself and others. Every community carries the inheritance of symbolic systems — language, rituals, narratives — which, transmitted across generations, constitute what Anthony Giddens calls 'ontological security': the fundamental sense of continuity and meaningfulness that enables us to navigate the complexity of everyday experience.",
      },
      {
        hr: 'Međutim, kultura nije monolitna ni nepromjenjiva. Identiteti koji se formiraju unutar kulturnih okvira nisu jednoznačni: oni su uvijek ispresjecani klasom, rodom, generacijskim iskustvima i migracijskim putanjama. Dijasporski identiteti, primjerice, svjedoče o tome kako kulturna memorija može biti istovremeno čvrst oslonac i teška obveza — ovisno o kontekstu u kojemu se priziva.',
        en: 'However, culture is neither monolithic nor unchanging. Identities formed within cultural frameworks are never unambiguous: they are always intersected by class, gender, generational experiences and migratory trajectories. Diasporic identities, for example, testify to how cultural memory can simultaneously be a firm anchor and a heavy obligation — depending on the context in which it is invoked.',
      },
      {
        hr: 'U hrvatskom kontekstu, rasprave o kulturnom identitetu nerijetko se odvijaju u sjeni traumatske povijesti 20. stoljeća i relativno kratke tradicije samostalne državnosti. Pitanje što "biti Hrvat" znači nije ni kulturno ni politički neutralno: ono je prepuno napetosti između regionalnih raznolikosti (slavonske, dalmatinske, zagorske, primorske tradicije), između urbano-ruralnih podjela i između naraštaja koji su živjeli bitno različite socijalizacijske prakse.',
        en: 'In the Croatian context, debates about cultural identity often unfold in the shadow of the traumatic history of the 20th century and a relatively short tradition of independent statehood. The question of what it means "to be Croatian" is neither culturally nor politically neutral: it is charged with tensions between regional diversities (Slavonian, Dalmatian, Zagorje, Primorje traditions), between urban-rural divisions and between generations that have lived through substantially different socialisation practices.',
      },
      {
        hr: 'Upravo ta višeslojnost čini kulturu i izazovnom i dragocjenom kategorijom za razumijevanje identiteta. Umjesto da kulturu promatramo kao statičan inventar navika i vrijednosti, produktivnije ju je konceptualizirati kao dinamičan prostor pregovaranja — prostor u kojemu se tradicija i inovacija neprestano dogovaraju, sukobljavaju i rekonstituiraju. U tom smislu, kulturna kompetencija nije poznavanje fiksiranih kulturnih sadržaja nego sposobnost navigiranja tim stalno promjenjivim prostorom.',
        en: 'It is precisely this multilayered quality that makes culture both a challenging and a precious category for understanding identity. Rather than viewing culture as a static inventory of habits and values, it is more productive to conceptualise it as a dynamic space of negotiation — a space in which tradition and innovation are constantly negotiating, colliding and reconstituting themselves. In this sense, cultural competence is not the knowledge of fixed cultural contents but the ability to navigate this continuously changing space.',
      },
    ],
    vocabulary: [
      {
        hr: 'konstituirati',
        en: 'to constitute / form',
        ex: 'Rituali konstituiraju zajednički identitet.',
      },
      {
        hr: 'ontološka sigurnost',
        en: 'ontological security',
        ex: 'Kultura nudi ontološku sigurnost.',
      },
      { hr: 'monolitan', en: 'monolithic', ex: 'Kultura nije monolitna.' },
      {
        hr: 'ispresjecan',
        en: 'intersected / cross-cut',
        ex: 'Identitet je ispresjecan rodom i klasom.',
      },
      { hr: 'dijasporski', en: 'diasporic', ex: 'Dijasporski identitet je složen.' },
      {
        hr: 'prizivati',
        en: 'to invoke / summon',
        ex: 'Pamćenje se priziva u posebnim trenucima.',
      },
      { hr: 'pregovaranje', en: 'negotiation', ex: 'Identitet nastaje kroz pregovaranje.' },
      {
        hr: 'rekonstituirati se',
        en: 'to reconstitute itself',
        ex: 'Tradicija se stalno rekonstituira.',
      },
      {
        hr: 'navigiranje',
        en: 'navigating',
        ex: 'Kulturna kompetencija je navigiranje složenošću.',
      },
      {
        hr: 'višeslojnost',
        en: 'multilayeredness / complexity',
        ex: 'Višeslojnost kulture je njena snaga.',
      },
    ],
    quiz: [
      {
        q: 'Što Giddens naziva "ontološkom sigurnošću"?',
        qEn: 'What does Giddens call "ontological security"?',
        opts: [
          'Ekonomsku stabilnost pojedinca',
          'Temeljni osjećaj stalnosti i smislenosti koji omogućuje snalaženje u iskustvu',
          'Politički konsenzus unutar zajednice',
          'Poznavanje kulturnih sadržaja i tradicija',
        ],
        correct: 1,
      },
      {
        q: 'Kako tekst opisuje dijasporske identitete?',
        qEn: 'How does the text describe diasporic identities?',
        opts: [
          'Kao stabilan i jednoznačan izvor ponosa',
          'Kao istovremeni čvrst oslonac i teška obveza',
          'Kao beznačajne za razumijevanje kulture',
          'Kao prevladane kategorije u globalnom dobu',
        ],
        correct: 1,
      },
      {
        q: 'Što, prema tekstu, znači kulturna kompetencija?',
        qEn: 'According to the text, what does cultural competence mean?',
        opts: [
          'Poznavanje fiksiranih kulturnih sadržaja',
          'Sposobnost navigiranja stalno promjenjivim kulturnim prostorom',
          'Vladanje svim dijalektima jednog jezika',
          'Prihvaćanje dominantnih kulturnih normi',
        ],
        correct: 1,
      },
    ],
  },
];
