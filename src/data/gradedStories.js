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
    intro: 'Ana goes to the market every Saturday. Practice everyday shopping vocabulary and polite Croatian conversation.',
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
        opts: ['Jer je blizu kuće', 'Jer je besplatno', 'Jer je sve svježe i nije skupo', 'Jer je prodavač simpatičan'],
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
        en: 'My mother\'s name is Vesna. She is fifty-two years old and she is a primary school teacher. My father\'s name is Zvonko. He is a driver and he is fifty-five. They have been together for thirty years.',
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
        qEn: 'What does Marko\'s mother do?',
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
        qEn: 'What is Marko\'s dog called?',
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
    intro: 'Follow Ivan\'s morning routine. Croatian uses many reflexive verbs (ending in "se") for daily activities.',
    paragraphs: [
      {
        hr: 'Ivan se budi svako jutro u sedam sati. Kad se probudi, odmah ide u kupaonicu. Tamo se umiva hladnom vodom, pere zube i tuširа se.',
        en: 'Ivan wakes up every morning at seven o\'clock. When he wakes up, he immediately goes to the bathroom. There he washes his face with cold water, brushes his teeth and showers.',
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
    intro: 'A trip to Split! Practice the Croatian past tense and vocabulary for travel and sightseeing.',
    paragraphs: [
      {
        hr: 'Prošli vikend sam otišao u Split s prijateljicom Anom. Putovali smo autom — vožnja iz Zagreba traje oko dva i pol sata. Bilo je lijepo i sunčano.',
        en: 'Last weekend I went to Split with my friend Ana. We travelled by car — the drive from Zagreb takes about two and a half hours. It was nice and sunny.',
      },
      {
        hr: 'U Splitu smo posjetili Dioklecijanovu palaču. Hodali smo kroz uske ulice Starog grada i divili se staroj rimskoj arhitekturi. Ana je fotografirala sve što je vidjela. Za ručak smo sjeli u restoran na Rivi. Ja sam naručio prstace na buzaru, a Ana je uzela pečenu ribu s blitvom.',
        en: 'In Split we visited Diocletian\'s Palace. We walked through the narrow streets of the Old Town and admired the old Roman architecture. Ana photographed everything she saw. For lunch we sat at a restaurant on the Riva promenade. I ordered date mussels in garlic-wine sauce, and Ana had grilled fish with Swiss chard.',
      },
      {
        hr: 'Poslijepodne smo otišli na plaţu Bačvice. Kupali smo se u moru i gledali mladeţ kako igraju picigin — to je stara splitska igra s malenom lopticom. Sunce je jako peklo, ali bila je prekrasna atmosfera.',
        en: 'In the afternoon we went to Bačvice beach. We swam in the sea and watched young people playing picigin — that\'s an old Split game with a small ball. The sun was beating down hard, but the atmosphere was wonderful.',
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
    titleEn: 'At the Doctor\'s',
    duration: 5,
    focus: 'Genitive with "boli me" • Dative case • Imperative mood',
    intro: 'Marija isn\'t feeling well. Learn Croatian medical vocabulary and how to describe symptoms.',
    paragraphs: [
      {
        hr: 'Marija se nije osjećala dobro od jučer. Boljela ju je glava i grlo. Imala je i visoku temperaturu — trideset i osam stupnjeva. Jutros je nazvala svog liječnika i dobila termin za deset sati.',
        en: 'Marija hadn\'t been feeling well since yesterday. She had a headache and a sore throat. She also had a high temperature — thirty-eight degrees. This morning she called her doctor and got an appointment for ten o\'clock.',
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
      { hr: 'ordinacija', en: 'doctor\'s surgery / office', ex: 'Ušla je u ordinaciju.' },
      { hr: 'angina', en: 'tonsillitis / strep throat', ex: 'Imam anginu.' },
      { hr: 'antibiotici', en: 'antibiotics', ex: 'Uzimam antibiotike.' },
      { hr: 'tableta', en: 'tablet / pill', ex: 'Jedna tableta dnevno.' },
      { hr: 'mirovanje', en: 'rest (noun)', ex: 'Doktor je propisao mirovanje.' },
    ],
    quiz: [
      {
        q: 'Zašto Marija ide liječniku?',
        qEn: 'Why does Marija go to the doctor\'s?',
        opts: ['Boli je noga', 'Boli je glava i grlo i ima temperaturu', 'Ne može hodati', 'Ima alergiju'],
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
    intro: 'Juraj moves to Zagreb for the first time. Learn how Croatians introduce themselves and get to know neighbours.',
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
      { hr: 'skupština stanara', en: 'tenants\' meeting', ex: 'Skupština je u petak.' },
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
        qEn: 'When is the tenants\' meeting?',
        opts: ['U ponedjeljak navečer', 'U srijedu ujutro', 'U petak u sedam navečer', 'U subotu poslijepodne'],
        correct: 2,
      },
      {
        q: 'Što su susjedi radili nakon skupštine?',
        qEn: 'What did the neighbours do after the meeting?',
        opts: ['Otišli su kući', 'Zajedno su popili kavu', 'Gledali su televiziju', 'Šetali su po gradu'],
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
    intro: 'Moving to a new city is an adventure. Notice how Croatian uses IMPERFECTIVE verbs for ongoing/repeated actions and PERFECTIVE verbs for completed single actions.',
    paragraphs: [
      {
        hr: 'Kad sam se preselio iz Varaždina u Zagreb, nisam poznavao gotovo nikoga u gradu. Seoba je bila naporna — tjedan dana sam pakirao stvari, a na kraju sam sve uspio strpati u mali kombi koji sam unajmio.',
        en: 'When I moved from Varaždin to Zagreb, I hardly knew anyone in the city. The move was exhausting — for a week I was packing things (impf.), and in the end I managed to fit everything into a small van I had rented.',
      },
      {
        hr: 'Moj novi stan se nalazi u Dubravi, na rubu grada. Nije luksuzno, ali ima sve što treba: dvije sobe, kuhinju, kupaonicu i mali balkon s pogledom na park. Prvoga dana kad sam ušao, osjetio sam čudan mješavinu uzbuđenja i tuge — nisam više bio u svom rodnom gradu.',
        en: 'My new flat is in Dubrava, on the outskirts of the city. It\'s not luxurious, but it has everything you need: two rooms, a kitchen, a bathroom and a small balcony overlooking a park. On the first day when I walked in, I felt a strange mixture of excitement and sadness — I was no longer in my home town.',
      },
      {
        hr: 'Kolega s posla, Tomislav, pomogao mi je prenijeti teže komade namještaja. Bez njega bih se mučio sam sa strojem za pranje rublja i kavčem. Kad smo konačno završili, sjeli smo u kuhinji i popili hladno pivo. "Dobrodošao u Zagreb," rekao je Tomislav, "sad si pravi Zagrepčan!"',
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
      { hr: 'prenijeti (pf.)', en: 'to carry / move (furniture)', ex: 'Pomogao mi je prenijeti stvari.' },
      { hr: 'mučiti se', en: 'to struggle / toil', ex: 'Mučio bih se sam.' },
      { hr: 'postupno', en: 'gradually', ex: 'Postupno sam naučio grad.' },
      { hr: 'zamisliti (pf.)', en: 'to imagine (completed act)', ex: 'Ne mogu si zamisliti život drugdje.' },
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
        opts: ['Želi se preseliti natrag', 'Ne može zamisliti da živi negdje drugdje', 'Smatra grad preskupim', 'Nema prijatelja tamo'],
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
    focus: 'Habitual imperfective (svake godine = every year) • Relative clauses (koji/koja) • Cultural vocabulary',
    intro: 'Christmas traditions in Croatia are rich and family-centred. Notice how imperfective verbs describe habitual yearly customs.',
    paragraphs: [
      {
        hr: 'Svake godine, za Božić, naša baka Ružica dolazi autobusom iz Karlovca. Onoga dana kad stigne, cijela kuća odmah zamiriše na njezine kolače — orahnjaču i makovnjaču, koje je pekla noću u svom stanu.',
        en: 'Every year at Christmas, our grandmother Ružica comes by bus from Karlovac. The day she arrives, the whole house immediately fills with the smell of her pastries — walnut roll and poppy seed roll, which she baked overnight in her flat.',
      },
      {
        hr: 'Dok baka priprema kolače u kuhinji, tata iz podruma donosi jelku. Mi djeca украшavamo jelku šarenim kuglicama i lampicama. Mama kuha ribu jer je Badnjak — dan posta. Svake godine spremi isti meni: bakalar na bijelo s krumpirom i blitvu. "To se jede uz Badnjak," kaže uvijek.',
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
      { hr: 'orahnjača', en: 'walnut roll (Croatian Christmas pastry)', ex: 'Baka peče orahnjaču.' },
      { hr: 'makovnjača', en: 'poppy seed roll', ex: 'Volim makovnjaču.' },
      { hr: 'jelka', en: 'Christmas tree', ex: 'Ukrašavamo jelku.' },
      { hr: 'Badnjak', en: 'Christmas Eve', ex: 'Na Badnjak jedemo ribu.' },
      { hr: 'bakalar', en: 'salt cod / dried cod', ex: 'Bakalar na bijelo s krumpirom.' },
      { hr: 'blitva', en: 'Swiss chard', ex: 'Blitva i krumpir uz ribu.' },
      { hr: 'ponoćka', en: 'midnight mass (Christmas)', ex: 'Idemo na ponoćku.' },
      { hr: 'napamet', en: 'by heart', ex: 'Znaju pjesme napamet.' },
      { hr: 'mlinec (pl. mlinci)', en: 'baked flatbread (traditional side dish)', ex: 'Pečenka s mlincima.' },
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
        opts: ['Jer je najjeftinija', 'Jer djeca vole ribu', 'Jer je Badnjak dan posta', 'Jer nema mesa u trgovini'],
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
    intro: 'Ksenija interviews for a marketing job in Zadar. Listen for the conditional mood and formal Croatian used in professional contexts.',
    paragraphs: [
      {
        hr: 'Ksenija je aplicirala za posao marketinškog koordinatora u jednoj zadarskoj agenciji. Tjedan dana nakon što je poslala prijavu, dobila je poziv. Bila je i uzbuđena i nervozna — to bi bio njezin prvi pravi posao nakon završetka fakulteta.',
        en: 'Ksenija applied for a job as a marketing coordinator at an agency in Zadar. A week after sending her application, she received a call. She was both excited and nervous — it would be her first proper job after finishing university.',
      },
      {
        hr: 'Na razgovoru su je pitali o njezinom dosadašnjem iskustvu, zašto želi raditi baš u toj agenciji te kakve su njezine dugoročne ambicije. Ksenija je odgovarala smireno i samouzdano. "Što biste rekli da je vaša najveća slabost?" upitao je voditelj razgovora. Ksenija se nije zbunila: "Ponekad sam previše orijentirana na detalje — ali to mi pomaže da svaki projekt radim temeljito."',
        en: 'At the interview they asked her about her previous experience, why she wanted to work at that particular agency and what her long-term ambitions were. Ksenija answered calmly and confidently. "What would you say is your biggest weakness?" the interviewer asked. Ksenija didn\'t get flustered: "Sometimes I\'m too detail-oriented — but that helps me do every project thoroughly."',
      },
      {
        hr: 'Na kraju razgovora, Ksenija je pitala o radnom vremenu, visini plaće i mogućnostima napredovanja. "Kad biste mogli početi?" upitao je voditelj. "Odmah sljedećeg tjedna, ako bi to odgovaralo vama," odgovorila je Ksenija. Voditelj se zadovoljno nasmiješio.',
        en: 'At the end of the interview, Ksenija asked about working hours, salary and opportunities for advancement. "When could you start?" the interviewer asked. "As early as next week, if that would suit you," Ksenija answered. The interviewer smiled, satisfied.',
      },
      {
        hr: 'Dva dana kasnije, Ksenija je otvorila e-mail od agencije: bila je primljena! Odmah je nazvala mamu: "Dobila sam posao, mama!" Mama je bila toliko ponosna da joj je suze krenule niz lice. Ksenija je shvatila da su se sve godine truda i studija konačno isplatile.',
        en: 'Two days later, Ksenija opened an email from the agency: she had been hired! She immediately called her mum: "I got the job, mum!" Her mum was so proud that tears ran down her face. Ksenija realised that all those years of hard work and study had finally paid off.',
      },
    ],
    vocabulary: [
      { hr: 'aplicirati', en: 'to apply (for a job)', ex: 'Aplicirala je za posao.' },
      { hr: 'dosadašnje iskustvo', en: 'previous / prior experience', ex: 'Pitali su o iskustvu.' },
      { hr: 'smireno', en: 'calmly', ex: 'Odgovarala je smireno.' },
      { hr: 'samouzdanje', en: 'self-confidence', ex: 'Imala je samouzdanja.' },
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
        opts: ['Rekla je da nema slabosti', 'Rekla je da je previše orijentirana na detalje', 'Promijenila je temu', 'Nije odgovorila'],
        correct: 1,
      },
      {
        q: 'Što je Ksenija napravila odmah nakon što je dobila e-mail o poslu?',
        qEn: 'What did Ksenija do immediately after receiving the job email?',
        opts: ['Otišla je slaviti s prijatelicama', 'Nazvala je mamu', 'Odgovorila je na e-mail', 'Plakala je'],
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
    intro: 'Ivan orders coffee with a friend in a Zagreb café. Practice polite café conversation and drink vocabulary.',
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
    intro: 'Ante needs to get to Rijeka. Practice buying bus tickets and asking for travel information.',
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
    intro: 'Ana and her sister spend a summer day on a Croatian beach. Practice describing weather and beach activities.',
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
        en: 'After swimming, Ana and Ivana eat ice cream. The ice cream is chocolate and vanilla flavour. It is delicious! They stay at the beach until six o\'clock in the evening.',
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
    intro: 'Marko took his girlfriend Petra to a restaurant in Dubrovnik for her birthday. Practice restaurant language and past tense.',
    paragraphs: [
      {
        hr: 'Juče navečer, Marko je odveo svoju djevojku Petru u restoran u Dubrovniku. Bio je njezin rođendan. Restoran se zove "Konoba Dalmatia" i nalazi se blizu Stare gradske jezgre.',
        en: 'Yesterday evening, Marko took his girlfriend Petra to a restaurant in Dubrovnik. It was her birthday. The restaurant is called "Konoba Dalmatia" and is located near the Old Town.',
      },
      {
        hr: 'Naručili su dalmatinske specijalitete. Petra je jela prstace na buzaru — to su dagnje kuhane s češnjakom i vinom. Marko je naručio brancina na žaru s blitvom i krumpirom. Za desert, dijelili su fritule — male dalmatinske krofne posute šećerom.',
        en: 'They ordered Dalmatian specialities. Petra ate date mussels in buzara sauce — these are mussels cooked with garlic and wine. Marko ordered grilled sea bass with chard and potatoes. For dessert, they shared fritule — small Dalmatian doughnuts dusted with sugar.',
      },
      {
        hr: 'Večera je bila odlična. Petra je rekla da su fritule bile najbolji desert koji je ikada jela. Marko se smiješio i bio je sretan što je odabrao taj restoran. Platili su sto dvadeset eura, ali vrijelo je svake lipe.',
        en: 'The dinner was excellent. Petra said the fritule were the best dessert she had ever eaten. Marko smiled and was happy that he had chosen that restaurant. They paid one hundred and twenty euros, but it was worth every cent.',
      },
    ],
    vocabulary: [
      { hr: 'konoba', en: 'traditional Croatian restaurant / tavern', ex: 'Volim večerati u konobi.' },
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
        opts: ['Jer su bili gladni', 'Jer je bio Petrin rođendan', 'Jer je bio Markov rođendan', 'Jer su slavili posao'],
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
        opts: ['Da su bile preskupe', 'Da su bile premale', 'Da su bile najbolji desert koji je ikada jela', 'Da su bile premasne'],
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
    intro: 'Josip went to see his favourite football club, Dinamo Zagreb, play at Maksimir stadium. Practice sports language and narrating past events.',
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
        opts: ['U dvadeset i petoj minuti', 'Na poluvremenu', 'U devedeset i drugoj minuti', 'Na početku utakmice'],
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
    intro: 'Katarina heard a klapa group singing on the Šibenik waterfront. Practice describing cultural experiences and using mixed tenses.',
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
      { hr: 'klapa', en: 'klapa (traditional Dalmatian a cappella singing group)', ex: 'Klapa pjeva na rivi.' },
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
        opts: ['Na plaži u Splitu', 'Na rivi u Šibeniku', 'U kafiću u Zadru', 'Na stadionu u Zagrebu'],
        correct: 1,
      },
      {
        q: 'Što je klapa?',
        qEn: 'What is a klapa?',
        opts: ['Vrsta dalmatinske hrane', 'Tradicionalni ples', 'Tradicijski oblik a cappella pjevanja', 'Glazbeni instrument'],
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
    intro: 'Learn about peka, one of Croatia\'s most beloved cooking traditions, while practising passive voice and cultural description.',
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
      { hr: 'peka', en: 'peka (traditional Croatian domed cooking lid)', ex: 'Janjetina pod pekon je ukusna.' },
      { hr: 'žar', en: 'embers / hot coals', ex: 'Jelo se peče ispod žara.' },
      { hr: 'janjetina', en: 'lamb meat', ex: 'Janjetina pod pekon je specijalitet.' },
      { hr: 'marinirati', en: 'to marinate', ex: 'Mariniram meso u maslinovom ulju.' },
      { hr: 'maslinovo ulje', en: 'olive oil', ex: 'Dalmatinska kuhinja koristi maslinovo ulje.' },
      { hr: 'ružmarin', en: 'rosemary', ex: 'Ružmarin daje poseban okus mesu.' },
      { hr: 'ritual', en: 'ritual', ex: 'Peka je obiteljski ritual.' },
      { hr: 'zalogaj', en: 'bite / mouthful', ex: 'Svaki zalogaj je ukusan.' },
      { hr: 'dozrijevati', en: 'to mature / to slowly cook through', ex: 'Jelo dozrijeva ispod žara.' },
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
    intro: 'Explore the history and architecture of Dubrovnik\'s famous Old Town. Practice describing places, using the genitive case, and narrating historical facts.',
    paragraphs: [
      {
        hr: 'Dubrovnik je jedan od najočuvanijih primjera gotičko-renesansne arhitekture na Mediteranu. Stari grad okružen je moćnim kamenim zidinama dugim gotovo dva kilometra, koje su građene i pojačavane od 13. do 17. stoljeća. Dubrovnik je 1979. uvršten na UNESCO-ov popis mjesta Svjetske baštine.',
        en: 'Dubrovnik is one of the best-preserved examples of Gothic-Renaissance architecture in the Mediterranean. The Old Town is surrounded by mighty stone walls almost two kilometres long, which were built and reinforced from the 13th to the 17th century. In 1979 Dubrovnik was placed on UNESCO\'s World Heritage list.',
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
        opts: ['Dobrodošli u Dubrovnik', 'Sloboda se ne prodaje ni za sve zlato na svijetu', 'Bog i Hrvati', 'Mir i ljubav'],
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
    intro: 'Discover Istria\'s famous gastronomic landscape. Practice relative clauses, impersonal constructions, and vocabulary related to food and agriculture.',
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
        opts: ['Jer je plavo', 'Jer je bogata crvena "terra rossa" zemlja idealna za uzgoj', 'Jer je uvijek mokro', 'Jer nema minerala'],
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
        opts: ['Uz pomoć posebno obučenih pasa', 'Metal detektorom', 'Kopanjem na slijepo', 'Uz pomoć satelita'],
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
    intro: 'Explore the life and legacy of Croatia\'s greatest 20th-century writer, Miroslav Krleža. Practice formal literary register and complex sentence structures.',
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
      { hr: 'propitivati', en: 'to interrogate / question', ex: 'Roman propituje ulogu intelektualca.' },
      { hr: 'leksikografija', en: 'lexicography', ex: 'Bio je veliki doprinos leksikografiji.' },
      { hr: 'osporavati', en: 'to contest / dispute', ex: 'Krleža je i danas osporavan.' },
      { hr: 'aktualnost', en: 'relevance / topicality', ex: 'Njegova dijela imaju trajnu aktualnost.' },
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
        opts: ['Ustav Jugoslavije', 'Deklaraciju o nazivu i položaju hrvatskog književnog jezika', 'Sporazum o miru', 'Statut Dinama'],
        correct: 1,
      },
      {
        q: 'Čemu svjedoče Krležina dijela koja se i danas čitaju i igraju?',
        qEn: 'What do Krleža\'s works being read and performed today testify to?',
        opts: ['Nedostatku novih pisaca', 'Njihovoj trajnoj aktualnosti', 'Lošem ukusu publike', 'Državnoj cenzuri'],
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
    intro: 'A thoughtful exploration of how Croatia commemorates the 1990s Homeland War. Practise advanced past tense constructions, abstract vocabulary, and handling sensitive historical topics.',
    paragraphs: [
      {
        hr: 'Domovinski rat — koji je trajao od 1991. do 1995. — temeljni je događaj suvremene hrvatske identifikacije. Hrvatska je 25. lipnja 1991. proglasila neovisnost, no agresija Jugoslavenske narodne armije i srpskih paravojnih postrojbi uskoro je eskalirala u oružani sukob koji je obilježio čitavo desetljeće. Gradovi kao Vukovar, Dubrovnik i Šibenik postali su simboli otpora i patnje.',
        en: 'The Homeland War — which lasted from 1991 to 1995 — is the foundational event of contemporary Croatian identity. Croatia declared independence on 25 June 1991, but the aggression of the Yugoslav People\'s Army and Serbian paramilitary formations soon escalated into an armed conflict that marked an entire decade. Cities such as Vukovar, Dubrovnik and Šibenik became symbols of resistance and suffering.',
      },
      {
        hr: 'Vukovar je posebno mjesto u kolektivnoj memoriji. Opsada Vukovara trajala je od kolovoza do studenog 1991. Branitelji grada — vojnici i civili ramena uz rame — odolijevali su znatno nadmoćnijem neprijatelju 87 dana. Grad je na kraju pao 18. studenog 1991. Slika voduške vodotornja, izbucanog ali uspravnog usred razrušenoga grada, postala je jedan od najprepoznatljivijih simbola rata i otpora.',
        en: 'Vukovar holds a special place in collective memory. The siege of Vukovar lasted from August to November 1991. The city\'s defenders — soldiers and civilians side by side — held out against a vastly superior enemy for 87 days. The city finally fell on 18 November 1991. The image of the Vukovar water tower, riddled with bullets yet standing upright amid the ruined city, became one of the most recognisable symbols of the war and of resistance.',
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
        opts: ['Sportski maraton', 'Glazbeni festival', 'Šutljivi mimohod tisuća hodočasnika', 'Vojska parade'],
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
    intro: 'Explore the tensions and harmonies between Zagreb\'s historic character and its contemporary urban life. Practise contrast structures, complex subordination, and urban vocabulary.',
    paragraphs: [
      {
        hr: 'Zagreb je grad koji živi u produktivnoj napetosti između starog i novog. Gornji grad — s Kaptolom, katedralom i labirintom uskih kamenih ulica — svjedok je tisućljetne prošlosti, dok se samo petnaest minuta hoda dalje, na Savici i Novom Zagrebu, rasprostire sasvim drukčiji urbani pejzaž: betonski blokovi nastali u doba socijalizma, danas sve češće okruženi niklim kavarnama, coworking prostorima i kreativnim industrijama.',
        en: 'Zagreb is a city that lives in productive tension between the old and the new. The Upper Town — with Kaptol, the cathedral and a labyrinth of narrow stone streets — is a witness to a millennia-long past, while just fifteen minutes\' walk away, in Savica and New Zagreb, an entirely different urban landscape spreads out: concrete blocks built in the socialist era, today increasingly surrounded by new cafés, coworking spaces and creative industries.',
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
      { hr: 'sanacija', en: 'reconstruction / remediation', ex: 'Sanacija zgrada još nije završena.' },
      { hr: 'najam', en: 'rent / rental', ex: 'Privatni najam je sve skuplji.' },
      { hr: 'prigradski', en: 'suburban', ex: 'Mladi sele u prigradska naselja.' },
      { hr: 'kazalište', en: 'theatre', ex: 'Volim ići u kazalište.' },
      { hr: 'nostalgia', en: 'nostalgia', ex: 'Grad živi između nostalgije i inovacije.' },
      { hr: 'razgolititi', en: 'to lay bare / expose', ex: 'Potres je razgolitio strukturne probleme.' },
      { hr: 'nametnuti se', en: 'to assert itself / impose itself', ex: 'Zagreb se nameće kao kulturno središte.' },
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
        opts: ['Svojom veličinom', 'Međunarodnom slavom', 'Izložbom o ratu', 'Interaktivnim eksponatima'],
        correct: 1,
      },
      {
        q: 'Što mnogi mladi Zagrepčani rade zbog visokih cijena stanova u centru?',
        qEn: 'What do many young Zagrebians do because of high flat prices in the centre?',
        opts: ['Kupuju stanove na kredit', 'Ostaju s roditeljima', 'Sele se u prigradska naselja ili odlaze u inozemstvo', 'Renoviraju stare zgrade'],
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
    focus: 'Conditional and subjunctive-like constructions • Identity vocabulary • Complex argumentation',
    intro: 'An analytical text on Croatian identity, emigration, and the diaspora\'s relationship with the homeland. Practise advanced vocabulary, argumentation structures, and conditional constructions.',
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
        en: 'Contemporary emigration from Croatia — which accelerated particularly after EU accession in 2013 — raises new questions. Young, educated Croatians leave for better economic opportunities, lower bureaucratic burden and higher quality of public services in Western Europe. Demographic erosion, which is one of the most serious threats to Croatia\'s long-term stability, cannot easily be stopped without systematic structural reforms. The Croatian government attempts to attract returnees with special tax incentives, but the success of these measures remains modest. The diaspora question is not merely sentimental — it is closely tied to the future of the entire nation.',
      },
    ],
    vocabulary: [
      { hr: 'dijaspora', en: 'diaspora', ex: 'Hrvatska dijaspora je brojna.' },
      { hr: 'porijeklo', en: 'origin / descent', ex: 'Ona je hrvatskog porijekla.' },
      { hr: 'emigrant', en: 'emigrant', ex: 'Prve generacije emigranata čuvale su jezik.' },
      { hr: 'raskid', en: 'rupture / break', ex: 'Odlazak je bio traumatičan raskid.' },
      { hr: 'lobirati', en: 'to lobby', ex: 'Lobirali su za neovisnost.' },
      { hr: 'demografski', en: 'demographic (adj.)', ex: 'Demografska erozija je ozbiljan problem.' },
      { hr: 'porezna olakšica', en: 'tax incentive / relief', ex: 'Vlada nudi porezne olakšice povratnicima.' },
      { hr: 'povratnik', en: 'returnee', ex: 'Mnogi povratnici donose nova znanja.' },
      { hr: 'erozija', en: 'erosion', ex: 'Demografska erozija ugrožava budućnost.' },
    ],
    quiz: [
      {
        q: 'Koliko se Hrvata i osoba hrvatskog porijekla procjenjuje da živi izvan Hrvatske?',
        qEn: 'How many Croatians and persons of Croatian origin are estimated to live outside Croatia?',
        opts: ['Oko milijun', 'Između tri i četiri milijuna', 'Oko pet milijuna', 'Manje od pola milijuna'],
        correct: 1,
      },
      {
        q: 'Kakvu su ulogu imali Hrvati iz dijaspore 1991. i 1992. godine?',
        qEn: 'What role did Croatians from the diaspora play in 1991 and 1992?',
        opts: ['Slali su humanitarnu pomoć', 'Lobiranje za međunarodno priznavanje neovisnosti', 'Osnivali su nove političke stranke', 'Vraćali su se u Hrvatsku masovno'],
        correct: 1,
      },
      {
        q: 'Što hrvatska vlada čini kako bi privukla povratnike?',
        qEn: 'What does the Croatian government do to attract returnees?',
        opts: ['Gradi nove stanove', 'Nudi posebne porezne olakšice', 'Plaća putne troškove', 'Daje besplatne tečajeve'],
        correct: 1,
      },
    ],
  },

];
