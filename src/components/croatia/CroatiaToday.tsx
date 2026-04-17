import React, { useState } from 'react';
import { H } from '../../data';

const CAT_COLORS = {
  Sport: '#dc2626',
  Kultura: '#7c3aed',
  Priroda: '#16a34a',
  Gospodarstvo: '#b45309',
  Turizam: '#0284c7',
  Tehnologija: '#0e7490',
};

const ARTICLES = [
  {
    id: 0,
    category: 'Sport',
    date: 'ponedjeljak, 23. ožujka 2026.',
    headline: 'Dinamo i Hajduk pripremaju se za vječni derbi: tko će trijumfirati u proljetnom ciklusu?',
    lead: 'Nogometaši Dinama i Hajduka ovaj tjedan intenzivno treniraju uoči jedne od najprestižnijih utakmica domaćeg nogometa. Vječni derbi uvijek donosi uzbuđenje i strast diljem Hrvatske.',
    body: `Svake sezone, kada Dinamo Zagreb i Hajduk Split dođu na teren zajedno, cijela Hrvatska zastane. Ova utakmica nije samo sport — ona je kultura, tradicija i ponos dvaju gradova koji se godinama natječu za vrh Prve HNL lige.

Dinamo Zagreb, s plavim dresovima koji se lako prepoznaju u cijeloj regiji, dolazi na utakmicu s odličnom formom. Trener je zadovoljan igrom obrambene linije, a napadači su u posljednjih pet kola zabili čak dvanaest golova. Navijači s tribina Maksimira svaki tjedan pjevaju i bodre svoju momčad.

Hajduk Split, s druge strane, ima jaku potporu navijača Torcide, koji se smatraju jednom od najglasnijih navijačkih skupina u Europi. Bijeli su ove sezone pokazali kvalitetu u europskim natjecanjima i žele dokazati da mogu parirati plavima i na domaćem terenu.

Trener Hajduka rekao je na presici: "Svaka utakmica protiv Dinama posebna je za nas. Igrači su fokusirani i motivirani. Vjerujem da ćemo pokazati karakter." Utakmica se igra u nedjelju, a ulaznice su rasprodane već tjednima.`,
    summary: 'Dinamo Zagreb and Hajduk Split are preparing for their upcoming "eternal derby" — the most watched match in Croatian football. Dinamo arrives in strong form with 12 goals in the last 5 rounds, while Hajduk is backed by the famous Torcida fan group. Both coaches are confident; tickets have been sold out for weeks.',
    vocab: [
      { hr: 'derbi', en: 'derby (rival match)', example: 'Vječni derbi uvijek donosi uzbuđenje.' },
      { hr: 'momčad', en: 'team', example: 'Trener je zadovoljan igrom momčadi.' },
      { hr: 'tribine', en: 'stands (stadium)', example: 'Navijači s tribina pjevaju i bodre momčad.' },
      { hr: 'presica', en: 'press conference', example: 'Trener je rekao na presici da su igrači motivirani.' },
      { hr: 'rasprodane', en: 'sold out', example: 'Ulaznice su rasprodane već tjednima.' },
      { hr: 'forma', en: 'form / condition', example: 'Dinamo dolazi na utakmicu s odličnom formom.' },
      { hr: 'natjecanje', en: 'competition', example: 'Hajduk je pokazao kvalitetu u europskim natjecanjima.' },
    ],
  },
  {
    id: 1,
    category: 'Turizam',
    date: 'utorak, 24. ožujka 2026.',
    headline: 'Hrvatska bilježi rekordnu turističku sezonu: više od 22 milijuna posjetitelja u 2025. godini',
    lead: 'Prema podacima Ministarstva turizma, Hrvatska je prošle godine primila više turista nego ikada u svojoj povijesti. Rast je posebno vidljiv na otocima i u unutrašnjosti.',
    body: `Hrvatska turistička zajednica objavila je da je 2025. godina bila apsolutno rekordna po broju posjetitelja. Ukupno je Hrvatsku posjetilo 22,4 milijuna turista, što je osam posto više nego godinu ranije. Prihodi od turizma dosegli su 15 milijardi eura, što čini oko 20 posto bruto domaćeg proizvoda.

Najveći rast zabilježen je na Dalmatinskim otocima — Hvaru, Braču i Visu — gdje su turisti sve dulje boravili, a ne samo prolazili. Kontinentalni turizam također raste, posebno u Slavoniji i Zagorju, gdje agroturizam privlači posjetitelje koji žele autentično iskustvo hrvatske kulture i gastronomije.

Ministar turizma izjavio je da vlada planira investirati u održivi turizam kako bi se smanjio pritisak na najposjećenija mjesta poput Dubrovnika i Plitvičkih jezera. Novi projekti uključuju biciklističke staze, kulturne rute i eko-objekte u manje poznatim regijama.

Turistički radnici ističu da sve više stranaca dolazi po drugi ili treći put, što pokazuje da Hrvatska nije samo ljetna destinacija, već zemlja kojoj se posjetitelji rado vraćaju.`,
    summary: 'Croatia recorded a historic tourism season in 2025, welcoming 22.4 million visitors — 8% more than the previous year — generating €15 billion in revenue (about 20% of GDP). Growth was strongest on Dalmatian islands and in continental agrotourism regions. The government plans to invest in sustainable tourism to reduce pressure on hotspots like Dubrovnik and Plitvice.',
    vocab: [
      { hr: 'posjetitelji', en: 'visitors', example: 'Hrvatska je primila više od 22 milijuna posjetitelja.' },
      { hr: 'prihodi', en: 'revenues / income', example: 'Prihodi od turizma dosegli su 15 milijardi eura.' },
      { hr: 'održivi', en: 'sustainable', example: 'Vlada planira investirati u održivi turizam.' },
      { hr: 'agroturizam', en: 'agrotourism', example: 'Agroturizam privlači posjetitelje koji žele autentično iskustvo.' },
      { hr: 'pritisak', en: 'pressure', example: 'Novi projekti smanjit će pritisak na najposjećenija mjesta.' },
      { hr: 'boravili', en: 'stayed / spent time', example: 'Turisti su sve dulje boravili na otocima.' },
    ],
  },
  {
    id: 2,
    category: 'Priroda',
    date: 'srijeda, 25. ožujka 2026.',
    headline: 'Plitvička jezera slave 75 godina UNESCO zaštite: prirodna ljepota koja osvaja svijet',
    lead: 'Ove godine Plitvička jezera obilježavaju 75 godina od upisa na UNESCO-ov popis svjetske baštine. Park privlači milijune posjetitelja, ali zaštita prirode ostaje glavna briga.',
    body: `Plitvička jezera, jedan od najljepših nacionalnih parkova u Europi, ove godine slave jubilej — 75 godina od kako su postala dio UNESCO-ove Svjetske baštine. Park, smješten u gorskoj Hrvatskoj između Karlovca i Gospića, poznat je po svom sustavu od šesnaest jezera i brojnim slapovima koji tvore jedinstvenu krajoliku sliku.

Direktor Nacionalnog parka izjavio je da su ove godine planirali posebne programe za posjetitelje, uključujući edukacijske šetnje s biologima i fotografskim vodičima. "Plitvice su živi organizam," rekao je, "i naša je dužnost osigurati da svake generacije mogu uživati u ovoj ljepoti."

Jedno od najvećih postignuća posljednjih godina je program obnove staništa divljih životinja. Volci, medvjedi i risovi koji žive u okolnim šumama sada imaju veće zaštićene zone. Stručnjaci za zaštitu prirode kažu da je biološka raznolikost parka povećana za 12 posto u zadnjih deset godina.

No izazovi ostaju. Klimatske promjene utječu na razinu vode u jezerima, a masovni turizam zahtijeva pametno upravljanje. Park je već uveo elektroničke ulaznice i ograničio dnevni broj posjetitelja na 8.000 kako bi sačuvao osjetljivi ekosustav.`,
    summary: 'Plitvice Lakes National Park celebrates 75 years of UNESCO World Heritage status in 2026. The park features 16 interconnected lakes and numerous waterfalls in mountainous central Croatia. Conservation programs have increased biodiversity by 12% over the last decade, with wolves, bears, and lynx benefiting from expanded protected zones. Daily visitor numbers are capped at 8,000 to protect the delicate ecosystem.',
    vocab: [
      { hr: 'baština', en: 'heritage', example: 'Plitvice su dio UNESCO-ove Svjetske baštine.' },
      { hr: 'slapovi', en: 'waterfalls', example: 'Brojni slapovi tvore jedinstvenu krajoliku sliku.' },
      { hr: 'staništa', en: 'habitats', example: 'Program obnove staništa divljih životinja ostvario je uspjeh.' },
      { hr: 'raznolikost', en: 'diversity', example: 'Biološka raznolikost parka povećana je za 12 posto.' },
      { hr: 'ekosustav', en: 'ecosystem', example: 'Broj posjetitelja ograničen je kako bi se sačuvao ekosustav.' },
      { hr: 'izazovi', en: 'challenges', example: 'Klimatske promjene ostaju veliki izazovi za park.' },
      { hr: 'upravljanje', en: 'management', example: 'Masovni turizam zahtijeva pametno upravljanje.' },
    ],
  },
  {
    id: 3,
    category: 'Gospodarstvo',
    date: 'četvrtak, 26. ožujka 2026.',
    headline: 'Brodosplit potpisao ugovor za gradnju dva luksuzna kruzera: 800 novih radnih mjesta',
    lead: 'Splitsko brodogradilište Brodosplit potpisalo je ugovor vrijedan 600 milijuna eura s norveškom kompanijom za isporuku dvaju modernih putničkih brodova. Projekt osigurava radna mjesta za stotine obitelji.',
    body: `Brodosplit, jedno od najstarijih i najpoznatijih brodogradilišta na Mediteranu, ove je nedjelje potpisalo ugovor koji se smatra jednim od najvećih u povijesti tvrtke. Norveška turistička kompanija Fjord Line naručila je dva kruzera kapaciteta 2.400 putnika svaki, a isporuka je planirana do 2029. godine.

Generalni direktor Brodosplita rekao je da ugovor donosi veliku sigurnost za brodogradilište i cijeli region. "Ovo nije samo posao — ovo je poruka da Split i Hrvatska mogu graditi brodove koji plove po cijelom svijetu," rekao je na konferenciji za novinare u splitskoj luci.

Projekt će osigurati 800 direktnih radnih mjesta i procjenjuje se da će stvoriti još 1.200 neizravnih radnih mjesta u dobavljačkim poduzećima u Dalmaciji i Herceg-Bosni. Brodosplit planira zaposliti mlade inženjere brodogradnje koji su diplomirali na Fakultetu elektrotehnike, strojarstva i brodogradnje u Splitu.

Analitičari kažu da je ovaj ugovor znak da europsko brodograditeljstvo doživljava oporavak nakon teških godina. Brodosplit je u prošlosti gradio brodove za mnoge svjetske kompanije, a ovaj projekt potvrđuje da im je kvaliteta i dalje na vrhu.`,
    summary: 'Brodosplit shipyard in Split signed a €600 million contract with Norwegian company Fjord Line to build two luxury cruise ships, each carrying 2,400 passengers, with delivery expected by 2029. The deal will create 800 direct jobs and an estimated 1,200 indirect jobs in the supplier network across Dalmatia. The shipyard plans to hire young engineers from Split\'s Faculty of Electrical Engineering, Mechanical Engineering and Naval Architecture.',
    vocab: [
      { hr: 'brodogradilište', en: 'shipyard', example: 'Brodosplit je jedno od najstarijih brodogradilišta na Mediteranu.' },
      { hr: 'ugovor', en: 'contract', example: 'Kompanija je potpisala ugovor vrijedan 600 milijuna eura.' },
      { hr: 'kapacitet', en: 'capacity', example: 'Svaki kruzer ima kapacitet 2.400 putnika.' },
      { hr: 'neizravnih', en: 'indirect', example: 'Projekt će stvoriti 1.200 neizravnih radnih mjesta.' },
      { hr: 'dobavljači', en: 'suppliers', example: 'Dobit će koristi i dobavljačka poduzeća u regiji.' },
      { hr: 'oporavak', en: 'recovery', example: 'Europsko brodograditeljstvo doživljava oporavak.' },
    ],
  },
  {
    id: 4,
    category: 'Kultura',
    date: 'petak, 27. ožujka 2026.',
    headline: 'Klapa osvaja srca stranih slušatelja: tradicijska glazba postaje globalni fenomen',
    lead: 'Klapa pjevanje, tradicijska dalmatinska glazba s višeglasnim harmonijama, privlači sve više obožavatelja izvan Hrvatske. Ansambli nastupaju diljem Europe, Australije i Amerike.',
    body: `Klapa je oblik tradicijskog višeglasnog pjevanja koji potječe iz Dalmacije i koji je 2012. godine upisan na UNESCO-ov popis nematerijalne kulturne baštine čovječanstva. No tek u posljednjih nekoliko godina ova glazba doista osvaja međunarodnu publiku.

Klapa Šibenik, jedan od najpriznatijih ansambala, ove je godine nastupila na festivalu world music u Berlinu pred publikom od 3.000 slušatelja, od kojih mnogi nikada nisu čuli za Hrvatsku. "Kada čujete te harmonije, ne trebate razumjeti tekst," rekla je glazbena novinarka iz Frankfurta. "Klapa vas dotakne direktno u srce."

Na internetu, snimke klapskih nastupa bilježe milijune pregleda. Kanal Klapa Cambi ima više od 400.000 pratitelja na YouTubeu, a njihova izvedba pjesme 'Moj galebe' digitalna je senzacija u Japanu i Južnoj Koreji. Glazbeni producenti iz Los Angelesa kontaktirali su nekoliko ansambala zbog suradnje na crossover albumima koji kombiniraju klapa tradiciju s modernim zvukovima.

Hrvatska turistička zajednica prepoznala je klapa pjevanje kao važan dio turističke ponude. Restorani u Splitu, Trogiru i Dubrovniku nude klapa večere, a mnogi turisti govore da je taj doživljaj najdragocjeniji uspomeni s odmora.`,
    summary: 'Klapa — traditional Dalmatian multi-voice harmonized singing, listed on UNESCO\'s Intangible Cultural Heritage list since 2012 — is finding a global audience. Klapa Šibenik performed at a world music festival in Berlin for 3,000 fans, and Klapa Cambi has 400,000+ YouTube subscribers with viral reach in Japan and South Korea. LA music producers have reached out about crossover collaborations.',
    vocab: [
      { hr: 'višeglasno', en: 'multi-voice / polyphonic', example: 'Klapa je tradicijsko višeglasno pjevanje iz Dalmacije.' },
      { hr: 'ansambl', en: 'ensemble / group', example: 'Klapa Šibenik je jedan od najpriznatijih ansambala.' },
      { hr: 'nematerijalna', en: 'intangible', example: 'Klapa je upisana na popis nematerijalne kulturne baštine.' },
      { hr: 'izvedba', en: 'performance', example: 'Njihova izvedba pjesme bila je digitalna senzacija.' },
      { hr: 'pratitelji', en: 'followers / subscribers', example: 'Kanal ima više od 400.000 pratitelja.' },
      { hr: 'suradnja', en: 'collaboration', example: 'Producenti su kontaktirali ansamble zbog suradnje.' },
      { hr: 'doživljaj', en: 'experience', example: 'Taj doživljaj bio je najdragocjeniji s odmora.' },
    ],
  },
  {
    id: 5,
    category: 'Sport',
    date: 'subota, 28. ožujka 2026.',
    headline: 'Split Marathon 2026: više od 12.000 trkača na ulicama povijesnog grada',
    lead: 'Splitski maraton ove je godine postavio novi rekord po broju sudionika. Trkači iz 60 zemalja trčali su kroz antičke ulice i uz obalu Jadranskog mora.',
    body: `Dvadeset i treće izdanje Splitskog maratona odvilo se ove nedjelje u savršenim uvjetima — sunčano jutro, temperatura 14 stupnjeva i blagi povetarac s mora. Ulice oko Dioklecijanove palače i Rive bile su punjene navijačima koji su glasno bodrili trkače.

Ukupno 12.340 trkača prijavilo se na natjecanje, od čega je 4.200 trčalo punu maratonsku dionicu od 42,195 kilometara, a ostatak je sudjelovao u polumaratonu i rekreativnoj utrci. Najdalji sudionici stigli su iz Australije, Brazila i Japana. Organizatori ističu da Split Marathon sve više postaje boutique maraton poznat po iznimnoj kulisi.

Pobjeda na muškoj trci otišla je kenijskom atletičaru Josephu Kipchoge, koji je trčao za splitski atletski klub nakon godinu dana treniranja u Dalmaciji. Pobjednik je rekao: "Nikad nisam trčao u tako ljepom gradu. Jadransko more me daje snagu." Ženska pobjeda pripala je hrvatskoj atletičarki Ani Kovačić iz Zagreba, koja je postavila novi nacionalni rekord.

Maraton je ujedno bio humanitarnog karaktera — prikupljeno je 45.000 eura za obnovu sportskih terena u školama diljem splitsko-dalmatinske županije.`,
    summary: 'The 23rd Split Marathon drew 12,340 runners from 60 countries through the streets of Diocletian\'s Palace and along the Adriatic waterfront in perfect conditions. Kenyan athlete Joseph Kipchoge (training in Dalmatia) won the men\'s race, while Croatian Ana Kovačić set a new national record in the women\'s category. The event raised €45,000 for school sports facilities.',
    vocab: [
      { hr: 'sudionici', en: 'participants', example: 'Maraton je postavio novi rekord po broju sudionika.' },
      { hr: 'dionica', en: 'section / distance segment', example: '4.200 trkača trčalo je punu maratonsku dionicu.' },
      { hr: 'kulisa', en: 'backdrop / setting', example: 'Split Marathon poznat je po iznimnoj kulisi.' },
      { hr: 'povetarac', en: 'light breeze', example: 'Blagi povetarac s mora hladio je trkače.' },
      { hr: 'humanitarno', en: 'charitable / humanitarian', example: 'Maraton je bio humanitarnog karaktera.' },
      { hr: 'prikupljeno', en: 'collected / raised', example: 'Prikupljeno je 45.000 eura za sportske terene.' },
    ],
  },
  {
    id: 6,
    category: 'Tehnologija',
    date: 'nedjelja, 29. ožujka 2026.',
    headline: 'Hrvatska startup Gideon AI prikupila 18 milijuna eura: revolucija u medicinskoj dijagnostici',
    lead: 'Zagrebački startup Gideon AI, koji razvija alate za ranu detekciju raka, prikupilo je 18 milijuna eura od europskih investitora. Osnivači su mladi liječnici i inženjeri iz Hrvatskog instituta za istraživanje mozga.',
    body: `Gideon AI, tvrtka osnovana 2023. godine u Medicinskom centru Sveučilišta u Zagrebu, prošlog je tjedna objavila uspješnu investicijsku rundu Series A u kojoj je prikupila 18 milijuna eura. Vodeći investitor je Berlin Ventures, a sudjelovali su i fondovi iz Amsterdama i Stockholma.

Tvrtka razvija softver temeljen na umjetnoj inteligenciji koji analizira medicinske snimke i može s velikom preciznošću prepoznati rane znakove raka pluća, dojke i debelog crijeva. U kliničkim testiranjima, Gideon AI sustav postigao je 94 posto točnost, što je više od prosjeka radiologa od 87 posto.

Osnivačica dr. Petra Marić rekla je: "Naš cilj je da svaki liječnik u maloj bolnici u Slavoniji ili na otoku ima isti dijagnostički alat kao i kirurg u najboljoj klinici u Londonu. To je pitanje pravednosti u zdravlju." Tvrtka planira u idućih 18 mjeseci zaposliti 60 novih stručnjaka i proširiti se na tržišta u Njemačkoj, Austriji i Švicarskoj.

Hrvatska vlada pohvalila je uspjeh mlade tvrtke i najavila nove poticaje za startupe u sektoru zdravstvenih tehnologija, uključujući lakši pristup fondovima Europske unije.`,
    summary: 'Zagreb-based startup Gideon AI raised €18 million in a Series A round led by Berlin Ventures. Founded by physicians and engineers from the Croatian Institute for Brain Research, the company\'s AI software analyzes medical images to detect early-stage lung, breast, and colon cancers with 94% accuracy — surpassing the 87% radiologist average. The company plans to expand to Germany, Austria, and Switzerland within 18 months.',
    vocab: [
      { hr: 'prikupila', en: 'raised / collected (funds)', example: 'Tvrtka je prikupila 18 milijuna eura od investitora.' },
      { hr: 'detekcija', en: 'detection', example: 'Alati za ranu detekciju raka spašavaju živote.' },
      { hr: 'preciznost', en: 'precision / accuracy', example: 'Sustav je postigao veliku preciznost u testiranjima.' },
      { hr: 'pravednost', en: 'fairness / equity', example: 'To je pitanje pravednosti u zdravlju.' },
      { hr: 'poticaji', en: 'incentives', example: 'Vlada je najavila nove poticaje za startupe.' },
      { hr: 'proširiti se', en: 'to expand', example: 'Tvrtka planira proširiti se na europska tržišta.' },
      { hr: 'stručnjaci', en: 'experts / specialists', example: 'Planiraju zaposliti 60 novih stručnjaka.' },
    ],
  },
  {
    id: 7,
    category: 'Priroda',
    date: 'ponedjeljak, 30. ožujka 2026.',
    headline: 'Berba lavande na Hvaru: otok mirise koji se pamte godinama',
    lead: 'Svake godine krajem lipnja i početkom srpnja, brda Hvara postaju ljubičasta od lavande. Ovaj tradicijski usjev sve više privlači turiste i donosi prihode lokalnim obiteljima.',
    body: `Hvar je oduvijek bio poznat po suncu, moru i povijesnim gradovima. No onaj tko posjeti unutrašnjost otoka u ljeto, naći će nešto posebno: beskrajne lavandine polje koja mirišu na samom rubu mora.

Lavanda se na Hvaru uzgaja već više od sto godina, a vrhunac berbe je između 24. lipnja i 10. srpnja. Obitelji koje se bave uzgojem lavande rade od zore do sumraka, ručno beru cvjetove i suše ih na suncu. Od svježe lavande destilira se eterično ulje koje ide u parfeme i kozmetičke proizvode diljem Europe i Japana.

Jurica Kovačević, farmer koji s obitelji vodi plantažu u blizini Vrbanja, rekao je da je ove sezone prinos bio iznimno dobar zahvaljujući blagoj zimi i dovoljno kiše u travnju. "Lavanda je osjetljiva biljka. Previše topline ili suše može uništiti cijelu berbu. Ali ove godine, sve je savršeno," rekao je dok je punio košare.

Turisti koji dolaze posebno zbog lavande sve su brojniji. Agencije u Splitu nude jednodnevne izlete s prelaskom trajektom, obilaskom plantaža i radionicama gdje posjetitelji mogu sami nabrati lavandu i napraviti mirisnu vrećicu. Lokalni producenti kažu da je lavandino ulje s Hvara prepoznato kao jedno od najkvalitetnijih na svijetu.`,
    summary: 'Every summer, the inland hills of Hvar Island turn purple with lavender in bloom. The harvest runs from late June through early July, with families hand-picking flowers and distilling essential oil for perfumes and cosmetics sold across Europe and Japan. A mild winter and spring rains made the 2026 harvest exceptional. Lavender tourism is growing, with day-trip agencies from Split offering plantation visits and oil-making workshops.',
    vocab: [
      { hr: 'berba', en: 'harvest', example: 'Vrhunac berbe lavande je krajem lipnja.' },
      { hr: 'uzgaja', en: 'is cultivated / grown', example: 'Lavanda se na Hvaru uzgaja već sto godina.' },
      { hr: 'prinos', en: 'yield / crop', example: 'Prinos je bio iznimno dobar zahvaljujući blagoj zimi.' },
      { hr: 'destilira', en: 'is distilled', example: 'Od svježe lavande destilira se eterično ulje.' },
      { hr: 'plantaža', en: 'plantation', example: 'Obitelj vodi plantažu u blizini Vrbanja.' },
      { hr: 'mirisna', en: 'fragrant / aromatic', example: 'Posjetitelji mogu napraviti mirisnu vrećicu.' },
      { hr: 'zora', en: 'dawn', example: 'Farmeri rade od zore do sumraka.' },
    ],
  },
  {
    id: 8,
    category: 'Sport',
    date: 'utorak, 31. ožujka 2026.',
    headline: 'Hrvatska rukometna reprezentacija na pragu plasmana na Svjetsko prvenstvo 2027.',
    lead: 'Kauboji su odigrali sjajnu kvalifikacijsku utakmicu u Osijeku i praktički osigurali plasman na Svjetsko rukometno prvenstvo 2027. godine. Kapetan Duvnjak vodio je momčad do pobjede.',
    body: `Hrvatska rukometna reprezentacija, poznata pod nadimkom "Kauboji", nastavlja svoju tradiciju uspješnog nastupa na međunarodnoj sceni. U utakmici igranoj u Osijeku pred 8.000 navijača, Hrvatska je pobijedila Slovačku rezultatom 34:27 i gotovo sigurno osigurala plasman na Svjetsko rukometno prvenstvo 2027. koje će se igrati u Egiptu.

Kapetan Domagoj Duvnjak, koji je ove sezone nadmašio sve očekivanja unatoč tome što mu je 37 godina, postigao je osam golova i raspodijelio šest asistencija. "Svaki put kada obučem dres s Kockom, osjećam istu emociju kao prvi dan," rekao je Duvnjak nakon utakmice. "Ovi navijači zaslužuju sve što dajemo."

Mladi golman Tin Petrović privukao je pažnju europskih skauta izvrsnim nastupom — obranio je čak 14 udaraca što je omjer od 38 posto obrana, znatno iznad prosjeka za ovu razinu natjecanja. Nekoliko bundesliga klubova već je pokazalo interes za dvadesetčetverogodišnjeg Splićanina.

Hrvatski rukometni savez objavio je plan za sljedeću sezonu koji uključuje više prijateljskih utakmica protiv top-ranked ekipa te tjedan intenzivnih priprema u austrijskom planinarskom centru. Cilj je ući u Egipat kao jedna od favorita za medalju.`,
    summary: 'Croatia\'s handball national team ("Kauboji") effectively secured qualification for the 2027 World Championship in Egypt with a 34:27 win over Slovakia in Osijek before 8,000 fans. Captain Domagoj Duvnjak scored 8 goals and added 6 assists at age 37. Young goalkeeper Tin Petrović made 14 saves (38% save rate), attracting interest from Bundesliga clubs.',
    vocab: [
      { hr: 'plasman', en: 'qualification / placement', example: 'Hrvatska je osigurala plasman na Svjetsko prvenstvo.' },
      { hr: 'kapetan', en: 'captain', example: 'Kapetan Duvnjak vodio je momčad do pobjede.' },
      { hr: 'asistencije', en: 'assists', example: 'Raspodijelio je šest asistencija u utakmici.' },
      { hr: 'golman', en: 'goalkeeper', example: 'Mladi golman Tin Petrović privukao je pažnju skauta.' },
      { hr: 'omjer', en: 'ratio / percentage', example: 'Postigao je omjer od 38 posto obrana.' },
      { hr: 'savez', en: 'federation / association', example: 'Hrvatski rukometni savez objavio je novi plan.' },
      { hr: 'pripreme', en: 'preparations / training camp', example: 'Planirane su pripreme u austrijskom planinarskom centru.' },
    ],
  },
  {
    id: 9,
    category: 'Kultura',
    date: 'srijeda, 1. travnja 2026.',
    headline: '"Dalmatinski blues" osvaja Cannes: hrvatska koprodukcija u glavnom programu festivala',
    lead: 'Film "Dalmatinski blues" redatelja Ivana Peroše odabran je za glavni natjecateljski program Cannes Film Festivala 2026. To je tek treći put u povijesti da je hrvatska produkcija ušla u La Sélection Officielle.',
    body: `Hrvatska filmska zajednica proslavila je veliku vijest: film "Dalmatinski blues" redatelja Ivana Peroše odabran je za natjecanje u glavnom programu Cannes Film Festivala koji se ove godine održava od 12. do 23. svibnja. To je veliki uspjeh za domaću kinematografiju i potvrda da hrvatska filmska scena raste.

Film prati priču o ribolovu jednog starog ribara iz Komiže na otoku Visu koji, suočen s nestankom tradicijskog ribolova, odlučuje naučiti svog unuka staroj tehnici. Sniman je u cijelosti na Visu, na hrvatskom jeziku s prizorima koji prikazuju svakodnevni život otočne zajednice. Producent kaže da je film tražio četiri godine rada i suradnju s Britanskim filmskim institutom.

Ivan Peroša, 39-godišnji redatelj koji je studirao filmsku režiju u Pragu i Njujorku, rekao je da mu je najveća nagrada što je film prikazati publici koja možda nikad nije čula za Vis. "Vis je jedno od najljepših mjesta na svijetu, ali i mjesto koje umire demografski. Htio sam snimiti tu ljepotu i taj bol istovremeno," rekao je.

Hrvatski ministar kulture čestitao je svim sudionicima i najavio povećanje proračuna za filmsku produkciju za 30 posto u 2027. godini. Karte za cannesku premijeru u Théâtre Lumière rasprodane su za manje od sat vremena.`,
    summary: '"Dalmatinski blues" by director Ivan Peroša has been selected for the main competition at the 2026 Cannes Film Festival — only the third time a Croatian production has entered the Official Selection. The film follows an elderly fisherman from the island of Vis teaching his grandson traditional fishing as the old way of life disappears. Shot entirely on Vis in Croatian, the film took four years to make with British Film Institute co-production support.',
    vocab: [
      { hr: 'redatelj', en: 'film director', example: 'Redatelj Ivan Peroša radi na filmu četiri godine.' },
      { hr: 'natjecanje', en: 'competition', example: 'Film je odabran za natjecanje u glavnom programu.' },
      { hr: 'kinematografija', en: 'cinematography / film industry', example: 'To je potvrda da hrvatska kinematografija raste.' },
      { hr: 'ribolov', en: 'fishing', example: 'Film prati priču o nestanku tradicijskog ribolova.' },
      { hr: 'demografski', en: 'demographically', example: 'Vis je mjesto koje umire demografski.' },
      { hr: 'proračun', en: 'budget', example: 'Ministar je najavio povećanje proračuna za filmsku produkciju.' },
      { hr: 'premijera', en: 'premiere', example: 'Karte za cannesku premijeru rasprodane su brzo.' },
    ],
  },
];

export default function CroatiaToday({ goBack }) {
  const [selected, setSelected] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const todayIndex = new Date().getDate() % 10;
  const featuredArticle = ARTICLES[todayIndex];

  const handleSelect = (idx) => {
    setSelected(idx);
    setShowSummary(false);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelected(null);
    setShowSummary(false);
  };

  if (selected !== null) {
    const art = ARTICLES[selected];
    const color = CAT_COLORS[art.category];
    return (
      <div className="scr-wrap">
        <button
          onClick={handleBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#78716c', marginBottom: 16, padding: '4px 0' }}
        >
          ← Sve vijesti
        </button>

        {/* Category badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ background: color + '18', color, fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${color}33` }}>
            {art.category}
          </span>
          <span style={{ color: '#a8a29e', fontSize: 12 }}>{art.date}</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#1c1917', lineHeight: 1.3, marginBottom: 14 }}>
          {art.headline}
        </h1>

        {/* Lead */}
        <p style={{ fontSize: 15, color: '#44403c', lineHeight: 1.7, fontWeight: 500, marginBottom: 20, borderLeft: `3px solid ${color}`, paddingLeft: 14 }}>
          {art.lead}
        </p>

        {/* Body */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', boxShadow: '0 1px 8px rgba(0,0,0,.07)', marginBottom: 16 }}>
          {art.body.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: 14, color: '#292524', lineHeight: 1.85, marginBottom: i < art.body.split('\n\n').length - 1 ? 14 : 0 }}>
              {para}
            </p>
          ))}
        </div>

        {/* English summary toggle */}
        <button
          onClick={() => setShowSummary(s => !s)}
          style={{ width: '100%', background: showSummary ? '#f0fdf4' : '#fafaf9', border: `1.5px solid ${showSummary ? '#16a34a' : '#e7e5e4'}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 700, color: showSummary ? '#15803d' : '#78716c', marginBottom: showSummary ? 0 : 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span>📝</span>
          <span>English Summary</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500 }}>{showSummary ? 'Hide ↑' : 'Show ↓'}</span>
        </button>

        {showSummary && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '0 0 12px 12px', padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.7, margin: 0 }}>{art.summary}</p>
          </div>
        )}

        {/* Vocabulary */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📚</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#292524' }}>Vocabulary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {art.vocab.map((v, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1c1917' }}>{v.hr}</span>
                  <span style={{ fontSize: 12, color: '#78716c', fontStyle: 'italic' }}>{v.en}</span>
                </div>
                <p style={{ fontSize: 12, color: '#57534e', margin: 0, lineHeight: 1.6 }}>{v.example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer back */}
        <button
          onClick={handleBack}
          style={{ width: '100%', background: '#f5f5f4', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#78716c' }}
        >
          ← Back to news
        </button>
      </div>
    );
  }

  // List view
  return (
    <div className="scr-wrap">
      {H('📰 Croatia Today', 'Daily Croatian news at B1 level', goBack)}

      {/* Featured article */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Istaknuti članak danas
        </div>
        <div
          onClick={() => handleSelect(featuredArticle.id)}
          style={{ background: `linear-gradient(145deg, ${CAT_COLORS[featuredArticle.category]}ee 0%, ${CAT_COLORS[featuredArticle.category]}99 100%)`, borderRadius: 18, padding: '22px 20px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'rgba(255,255,255,.07)', borderRadius: '0 0 0 120px' }} />
          <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 800, fontSize: 10, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 12, letterSpacing: '.04em' }}>
            {featuredArticle.category}
          </span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
            {featuredArticle.headline}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.88)', lineHeight: 1.6, marginBottom: 16 }}>
            {featuredArticle.lead}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{featuredArticle.date}</span>
            <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,.3)' }}>
              Čitaj članak →
            </span>
          </div>
        </div>
      </div>

      {/* All articles */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#78716c', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Sve vijesti
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ARTICLES.map((art) => {
          const color = CAT_COLORS[art.category];
          const isFeatured = art.id === featuredArticle.id;
          return (
            <div
              key={art.id}
              onClick={() => handleSelect(art.id)}
              style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', borderLeft: `4px solid ${color}`, boxShadow: isFeatured ? `0 0 0 2px ${color}44` : '0 1px 4px rgba(0,0,0,.06)', position: 'relative' }}
            >
              {isFeatured && (
                <span style={{ position: 'absolute', top: 10, right: 12, background: color + '18', color, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10, letterSpacing: '.04em' }}>
                  DANAS
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ background: color + '18', color, fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 12 }}>
                  {art.category}
                </span>
                <span style={{ color: '#a8a29e', fontSize: 11 }}>{art.date}</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#1c1917', lineHeight: 1.4, margin: '0 0 5px' }}>
                {art.headline}
              </p>
              <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, margin: 0 }}>
                {art.lead.length > 100 ? art.lead.slice(0, 100) + '…' : art.lead}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
