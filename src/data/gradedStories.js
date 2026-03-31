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
];
