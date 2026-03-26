import React, { useState, useEffect } from 'react';
import { H } from '../../data.jsx';

const CHAPTERS = [
  {
    id: 1,
    title: "Poglavlje 1: Ljeto počinje",
    date: "15. lipnja",
    croatian: `Dragi moji daleki, pišem vam iz moje male kuhinje dok vani sunce već peče kao ludi. Dalmacija je ove godine posebno lijepa — smokve su pune, lavanda miriši po cijelom dvorištu, a more je već toplije nego ikad u lipnju. Svaki dan ujutro idem u vrt i razgovaram s rajčicama kao da su moji stari prijatelji. Čekam vas, moja mila djeco — sobe su spravljene, kreveti namješteni, a u zamrzivaču sam već napravila sladoled od maline. Jedino što nedostaje ste vi.`,
    english: `My dear faraway ones, I'm writing to you from my little kitchen while the sun outside is already blazing like crazy. Dalmatia is especially beautiful this year — the figs are full, lavender scents the whole yard, and the sea is already warmer than ever in June. Every morning I go to the garden and talk to the tomatoes as if they were my old friends. I'm waiting for you, my dear children — the rooms are prepared, the beds made, and I've already made raspberry ice cream in the freezer. The only thing missing is you.`,
    vocab: [
      { hr: "peći", en: "to bake / to blaze (of sun)" },
      { hr: "dvorište", en: "yard / courtyard" },
      { hr: "rajčica", en: "tomato" },
      { hr: "zamrzivač", en: "freezer" },
      { hr: "namješten", en: "arranged / made up (bed)" },
      { hr: "nedostajati", en: "to be missing / to be missed" },
    ],
    cultural: "Dalmatian summers are legendary for their intensity — temperatures often exceed 35°C, yet locals carry on with markets, gardens, and family life with cheerful resilience.",
  },
  {
    id: 2,
    title: "Poglavlje 2: Na tržnici",
    date: "22. lipnja",
    croatian: `Danas sam rano ustala i otišla na tržnicu u grad. Gospođa Marica već je čekala s košarom trešanja, crvenijih nego što sam ikad vidjela. Kupila sam i svježe kozje mlijeko od starog Ante, koji mi uvijek dadne malo više nego što treba — tako je on, uvijek plemenit. Miris ribe s ribarne me podsjeti na djeda, koji je svaki petak donosio lubina s mora. Tržnica je živo mjesto, puno glasova i smijeha, kao da čitav grad priča u isto vrijeme. Nosila sam kući punu mrežu i srce ispunjeno toplinom.`,
    english: `Today I woke up early and went to the market in town. Mrs. Marica was already waiting with a basket of cherries, redder than I've ever seen. I also bought fresh goat's milk from old Ante, who always gives me a little more than necessary — that's just him, always generous. The smell of fish from the fish stall reminded me of grandfather, who every Friday would bring sea bass from the sea. The market is a lively place, full of voices and laughter, as if the whole town is talking at once. I carried home a full mesh bag and a heart filled with warmth.`,
    vocab: [
      { hr: "tržnica", en: "open-air market" },
      { hr: "trešnja", en: "cherry" },
      { hr: "kozje mlijeko", en: "goat's milk" },
      { hr: "lubin", en: "sea bass" },
      { hr: "mreža", en: "mesh bag / net" },
      { hr: "plemenit", en: "generous / noble" },
    ],
    cultural: "Croatian open-air markets (tržnice) are a cornerstone of daily life. Vendors and regular customers often know each other by name, and haggling or extra generosity from sellers is a common social ritual.",
  },
  {
    id: 3,
    title: "Poglavlje 3: Nedjeljna ručak",
    date: "29. lipnja",
    croatian: `Nedjelja je najljepši dan u tjednu. Od jutros u pet sati janje se pečelo na ražnju ispred kuće, a miris se širio cijelom ulicom — susjedi su znali što se sprema. Stigla je teta Mirjana s kruharom punim sominih kolačića, stric Branko s bocom domaćeg vina, a mala Petra trčala je ravno u moje naručje. Stol je bio dugačak kao brodski pontons, prekriven bijelim stolnjakom koji je moja mama vezla prije pedeset godina. Jeli smo, pričali i smijali se dok sunce nije palo iza brda. To su trenuci zbog kojih se živi.`,
    english: `Sunday is the most beautiful day of the week. Since five in the morning a lamb had been roasting on a spit in front of the house, and the smell spread down the whole street — the neighbors knew what was coming. Aunt Mirjana arrived with a bread basket full of sesame cookies, Uncle Branko with a bottle of homemade wine, and little Petra ran straight into my arms. The table was as long as a ship's gangway, covered with the white tablecloth my mother embroidered fifty years ago. We ate, talked and laughed until the sun fell behind the hills. These are the moments that make life worth living.`,
    vocab: [
      { hr: "ražanj", en: "spit (for roasting)" },
      { hr: "naručje", en: "arms (embrace)" },
      { hr: "stolnjak", en: "tablecloth" },
      { hr: "vesti", en: "to embroider" },
      { hr: "trenuci", en: "moments" },
      { hr: "janje", en: "lamb" },
    ],
    cultural: "Sunday lunch (nedjeljna ručak) is the most sacred family ritual in Croatia. Spit-roasted lamb (janjetina) is a hallmark of Dalmatian celebrations, often started before dawn and eaten in the early afternoon.",
  },
  {
    id: 4,
    title: "Poglavlje 4: Večer uz more",
    date: "7. srpnja",
    croatian: `Večeras sam sjedila na kamenim skalinama kraj mora i gledala kako sunce tone u Jadran. Nebo je postalo boja breskve, pa narančasto, pa tamnocrveno — kao da je netko prosuo vino po oblacima. Mislila sam na vašeg djedicu, koji je volio sjesti baš tu, na tu istu stijenu, i pušiti svoju lulu dok more šapuće. Prošlo je već deset godina, ali nekad mi se čini da ga mogu čuti u zvuku valova. More ne zaboravlja. I ja ne zaboravljam. A vi, moja draga djeco s daleka — pamtite li morski miris? Obećajte mi da ćete doći ove godine.`,
    english: `This evening I sat on the stone steps by the sea and watched the sun sink into the Adriatic. The sky turned the color of peaches, then orange, then dark red — as if someone had spilled wine across the clouds. I thought of your grandfather, who loved to sit right there, on that same rock, and smoke his pipe while the sea whispered. It has been ten years already, but sometimes I feel I can hear him in the sound of the waves. The sea does not forget. And I do not forget. And you, my dear children from afar — do you remember the smell of the sea? Promise me you'll come this year.`,
    vocab: [
      { hr: "skalina", en: "stone step (Dalmatian)" },
      { hr: "Jadran", en: "the Adriatic Sea" },
      { hr: "tonuti", en: "to sink / to set (sun)" },
      { hr: "lula", en: "pipe (for smoking)" },
      { hr: "šaptati", en: "to whisper" },
      { hr: "val", en: "wave" },
    ],
    cultural: "In Dalmatia, the sea is not just geography — it is identity. The word 'more' (sea) carries deep emotional weight, tied to memory, belonging, and the cycles of Croatian life.",
  },
  {
    id: 5,
    title: "Poglavlje 5: Tajna pašticade",
    date: "14. srpnja",
    croatian: `Danas sam kuhala pašticadu — naše najsvetije jelo. Meso sam marinirala tri dana u crnom vinu, klinčićima i lovorovim listom, i to je tajna koju vam sada otkrivam. Ali pravi trik, koji moja mama nije nikome rekla osim meni, je malo čokolade — jedva žličica tamne čokolade na kraju, dok se umak polako gušća na laganoj vatri. Kći moje susjede pitala me za recept, ali ja sam se samo nasmijala i rekla: "Ljubav je glavni sastojak." To nije šala. Hrana pripremljena bez ljubavi ne može nahraniti dušu. Kad dođete, skuhat ću vam pašticadu i gledati vaša lica dok probate prvi zalogaj.`,
    english: `Today I cooked pašticada — our most sacred dish. I marinated the meat for three days in red wine, cloves and bay leaves, and that is the secret I am now revealing to you. But the real trick, which my mother told no one except me, is a little chocolate — barely a teaspoon of dark chocolate at the end, while the sauce slowly thickens over a low flame. My neighbor's daughter asked me for the recipe, but I just smiled and said: "Love is the main ingredient." That's no joke. Food prepared without love cannot nourish the soul. When you come, I'll cook pašticada for you and watch your faces as you taste the first bite.`,
    vocab: [
      { hr: "pašticada", en: "Dalmatian braised beef dish" },
      { hr: "marinirati", en: "to marinate" },
      { hr: "klinčić", en: "clove (spice)" },
      { hr: "lovorov list", en: "bay leaf" },
      { hr: "umak", en: "sauce / gravy" },
      { hr: "zalogaj", en: "bite / morsel" },
    ],
    cultural: "Pašticada is the crown jewel of Dalmatian cuisine, traditionally prepared for weddings and major celebrations. Every family guards their version jealously, with secrets passed down only to trusted heirs.",
  },
  {
    id: 6,
    title: "Poglavlje 6: Fešta u selu",
    date: "25. srpnja",
    croatian: `Na Svetu Jakobu bila je fešta u selu — cijela ulica ukrašena zastavicama, miris pečene janjetine i bunjevačkog kola u zraku. Mladi su plesali kolo na trgu do ponoći, a ja sam sjedila s tetom Anđom i gledala. Bilo je prekrasno vidjeti djecu kako uče stare korake — mali Ivan, tek sedam godina, već zna okretati djevojčice. Jedna skupina iz Amerike, Hrvati koji su došli na ljetovanje, stajala je sa strane i gledala, a u njihovim očima vidjela sam nešto poput čežnje. Isti onaj izraz koji vidim kad zamislim vaša lica. Tradicija nas čuva — čak i kad smo daleko jedni od drugih.`,
    english: `On the feast of St. James there was a village festival — the whole street decorated with little flags, the smell of roasted lamb and the sound of kolo dancing in the air. The young people danced kolo in the square until midnight, and I sat with Aunt Anđa and watched. It was wonderful to see children learning the old steps — little Ivan, barely seven years old, already knows how to spin the girls around. A group from America, Croatians who had come for the summer, stood to the side and watched, and in their eyes I saw something like longing. The same expression I imagine on your faces. Tradition keeps us — even when we are far from one another.`,
    vocab: [
      { hr: "fešta", en: "village festival / feast day" },
      { hr: "kolo", en: "traditional circle dance" },
      { hr: "zastavica", en: "little flag / bunting" },
      { hr: "ljetovanje", en: "summer holiday / summer stay" },
      { hr: "čežnja", en: "longing / yearning" },
      { hr: "tradicija", en: "tradition" },
    ],
    cultural: "Kolo is Croatia's ancient circle dance, listed on UNESCO's Intangible Cultural Heritage list. Fešte (feast days) tied to patron saints are still celebrated in virtually every Croatian village and neighborhood.",
  },
  {
    id: 7,
    title: "Poglavlje 7: Pismo dijaspori",
    date: "3. kolovoza",
    croatian: `Moja mila djeco, vi koji živite u Australiji, Kanadi, Americi i Njemačkoj — pišem vam iz srca. Čujem da vaša djeca ponekad ne žele govoriti hrvatski. Razumijem — škola je na engleskom, prijatelji su na engleskom, svijet je na engleskom. Ali hrvatski je vaš dom koji nosite u sebi. Kad jednog dana dođete ovamo i čujete da neko starije kaže "Bog ti daj zdravlje" ili "Bok" na raskrižju — srce će vam se stisnuti na način koji samo mi razumijemo. Jezik je pamćenje. Jezik je grljenje bake kroz tisuće kilometara. Molim vas, ne dajte ga zaboraviti.`,
    english: `My dear children, you who live in Australia, Canada, America and Germany — I am writing to you from the heart. I hear that your children sometimes don't want to speak Croatian. I understand — school is in English, friends are in English, the world is in English. But Croatian is the home you carry inside you. When one day you come here and hear an elderly person say "God grant you health" or simply "Hi" at a crossroads — your heart will squeeze in a way that only we understand. Language is memory. Language is a grandmother's hug across thousands of kilometers. I beg you, do not let it be forgotten.`,
    vocab: [
      { hr: "dijaspora", en: "diaspora" },
      { hr: "raskrižje", en: "crossroads / intersection" },
      { hr: "stisnuti se", en: "to squeeze / to tighten (heart)" },
      { hr: "pamćenje", en: "memory / remembrance" },
      { hr: "grljenje", en: "hugging / embrace" },
      { hr: "zaboraviti", en: "to forget" },
    ],
    cultural: "Over 1.2 million Croatians live in the diaspora worldwide. The preservation of the Croatian language across generations is a central concern for communities in Australia, Canada, the USA, Germany, and beyond.",
  },
  {
    id: 8,
    title: "Poglavlje 8: Berba i ajvar",
    date: "12. rujna",
    croatian: `Rujan je stigao i s njim berba — najzaposleniji tjedan u godini. Susjedica Vera i ja smo dva dana rezale paprike i kuhale ajvar, a cijela kuća je mirisala kao da je unutra cijela Slavonija. Čaše rakije su pomagale — da ne bude dosadno, naravno. Moj vinograd dao je ovog ljeta bolje grožđe nego ikad, a muž Verin kaže da je to zbog suše. Ja kažem da je zbog molitve. Tegle ajvara su poredane na polici poput vojnika — šest tegli za vas kad dođete, pet za susjede, a dvije uvijek za iznenadne goste koji stignu bez poziva. Tako je to kod nas.`,
    english: `September arrived and with it the harvest — the busiest week of the year. Neighbor Vera and I spent two days cutting peppers and cooking ajvar, and the whole house smelled as if all of Slavonia were inside it. Glasses of rakija helped — so it wouldn't get boring, of course. My vineyard gave better grapes this summer than ever before, and Vera's husband says it's because of the drought. I say it's because of prayer. The jars of ajvar are lined up on the shelf like soldiers — six jars for you when you come, five for the neighbors, and two always for unexpected guests who arrive without notice. That's just how it is with us.`,
    vocab: [
      { hr: "berba", en: "harvest (grapes, peppers)" },
      { hr: "ajvar", en: "roasted red pepper relish" },
      { hr: "rakija", en: "fruit brandy" },
      { hr: "vinograd", en: "vineyard" },
      { hr: "tegla", en: "jar (preserving jar)" },
      { hr: "suša", en: "drought" },
    ],
    cultural: "Autumn ajvar-making is a beloved tradition across Croatia and the Balkans — neighbors gather to roast and grind red peppers together, and the process is as much social as culinary. Homemade ajvar is a prized gift.",
  },
  {
    id: 9,
    title: "Poglavlje 9: Svi Sveti",
    date: "1. studenog",
    croatian: `Jutros sam rano ustala i otišla na groblje. Nosila sam bijele krizanteme i svjećice, kao svake godine. Grob vašeg djedice je čist i uredan — sinovi su mu poredali kamenje prošlog tjedna. Zapalila sam svjećicu i stajala u tišini, slušajući vjetar između nadgrobnih ploča. Oko mene su stajale stotine obitelji — djeca, stari, svi tiho — i osjetila sam nešto što samo groblja mogu dati: mir. Ne tužan mir, nego onaj mir koji kaže da je sve u redu, da su mrtvi blizu, da je sjećanje dovoljno. Na povratku sam kupila kestene od dječaka na uglu. Djed bi ih volio.`,
    english: `This morning I woke up early and went to the cemetery. I carried white chrysanthemums and little candles, as every year. Your grandfather's grave is clean and tidy — the sons arranged the stones last week. I lit a candle and stood in silence, listening to the wind between the gravestones. Around me stood hundreds of families — children, the elderly, all quietly — and I felt something that only cemeteries can give: peace. Not sad peace, but that peace that says everything is all right, that the dead are near, that memory is enough. On the way back I bought chestnuts from a boy on the corner. Grandfather would have loved them.`,
    vocab: [
      { hr: "groblje", en: "cemetery" },
      { hr: "krizantema", en: "chrysanthemum" },
      { hr: "svjećica", en: "little candle / tea light" },
      { hr: "nadgrobna ploča", en: "gravestone / tombstone" },
      { hr: "kesten", en: "chestnut" },
      { hr: "ugao", en: "corner (street)" },
    ],
    cultural: "Svi Sveti (All Saints' Day, November 1st) is one of the most observed days in Croatia. Cemeteries are illuminated with thousands of candles at dusk, creating one of the most visually striking annual traditions in the country.",
  },
  {
    id: 10,
    title: "Poglavlje 10: Prva zimska oluja",
    date: "18. studenog",
    croatian: `Noćas je puhala bura kakvu nisam pamtila. Prozori su drhtali, dimnjak je urlao, a mačka Sinica skupila se uz mene kao da traži zaštitu. Zapalila sam kaminu i sjela pletući nove čarape za malog Luku — one crvene s bijelim zvjezdicama koje sam obećala u rujnu. Pletenje me smiri. Svaka petlja je jedna misao, svaki red je jedna molitva. Kuhala sam grah s kobasicama na sporom vatru i slušala radio — stara glazba, Arsen Dedić i Tereza Kesovija, koja me vraća u neki drugi život. Bura je vani, ali unutra je toplo. Čovjek ne treba puno.`,
    english: `Last night the bura blew like I hadn't remembered. The windows trembled, the chimney howled, and my cat Sinica curled up next to me as if seeking protection. I lit the fireplace and sat knitting new socks for little Luka — the red ones with white stars I promised in September. Knitting calms me down. Each stitch is one thought, each row is one prayer. I cooked beans with sausages on a slow fire and listened to the radio — old music, Arsen Dedić and Tereza Kesovija, which takes me back to another life. The bura is outside, but inside it is warm. A person doesn't need much.`,
    vocab: [
      { hr: "bura", en: "bura wind (cold NE wind)" },
      { hr: "dimnjak", en: "chimney" },
      { hr: "kamin", en: "fireplace" },
      { hr: "pletenje", en: "knitting" },
      { hr: "petlja", en: "stitch / loop" },
      { hr: "grah", en: "beans" },
    ],
    cultural: "The bura is a fierce, dry northeastern wind that sweeps down from the Dinaric Alps toward the Adriatic coast. In Dalmatia and the Kvarner region it is a cultural force — celebrated in folk sayings and feared in equal measure.",
  },
  {
    id: 11,
    title: "Poglavlje 11: Pripreme za Božić",
    date: "20. prosinca",
    croatian: `Božić se bliži i ja sam već tri dana u kuhinji. Jučer sam pekla fritule — malu hrpu za susjede, veliku hrpu za sebe, i onaj tajni red koji uvijek stavim u škrinju zamrzivača za vas, jer znam da ćete doći kad-tad. Ukrašavam kuću polako, bez žurbe. Na prozor sam stavila adventski vijenac od borovih grančica i suhih naranči, a na stol malu jaslicu koju je djed izrezao iz maslinovog drveta davne 1963. Crkva je večeras pjevala Rorate — najljepše pjevanje u godini. Osjetila sam suze, ali to su bile dobre suze, pune zahvalnosti. Bog da vas čuva, moja mila djeco.`,
    english: `Christmas is approaching and I have been in the kitchen for three days already. Yesterday I baked fritule — a small pile for the neighbors, a large pile for myself, and that secret row I always put in the freezer for you, because I know you'll come sooner or later. I'm decorating the house slowly, without hurry. In the window I placed an Advent wreath of pine branches and dried oranges, and on the table the little nativity scene grandfather carved from olive wood back in 1963. Church tonight sang Rorate — the most beautiful singing of the year. I felt tears, but they were good tears, full of gratitude. God keep you safe, my dear children.`,
    vocab: [
      { hr: "fritule", en: "small fried doughnuts (Christmas treat)" },
      { hr: "škrinja", en: "chest / deep freezer" },
      { hr: "adventski vijenac", en: "Advent wreath" },
      { hr: "jaslica", en: "nativity scene / manger" },
      { hr: "maslinovo drvo", en: "olive wood / olive tree" },
      { hr: "zahvalnost", en: "gratitude" },
    ],
    cultural: "Fritule are Croatia's beloved Christmas doughnuts — small, fried, dusted with sugar, often flavored with lemon zest and rum. Rorate masses, held at dawn during Advent, are a deeply cherished Catholic tradition in Croatia.",
  },
  {
    id: 12,
    title: "Poglavlje 12: Nova godina — Poruka bake",
    date: "31. prosinca",
    croatian: `Posljednji dan godine. Sjela sam uz prozor s čašom prošeka i papir i pero pred sobom, jer želim zapisati ono što nosim u srcu. Vi, moja dijaspora — vi ste najhrabriji Hrvati koje poznajem. Napustili ste dom ne iz kukavičluka, nego iz nade. Izgradili ste nove živote, ali niste izgubili stari. Dokaz tome je ova aplikacija, ove lekcije, ove priče koje čitate. Dokaz tome su vaša djeca koja znaju reći "hvala" i "volim te" na hrvatskom. Jezik nije samo riječ — jezik je duša naroda. Nova godina koja dolazi neka vam donese zdravlje, ljubav i uvijek malo domovine u srcu. Vaša baka vas voli. Laku noć i Sretna Nova Godina.`,
    english: `The last day of the year. I sat by the window with a glass of prošek and paper and pen before me, because I want to write down what I carry in my heart. You, my diaspora — you are the bravest Croatians I know. You left home not out of cowardice, but out of hope. You built new lives, but you didn't lose the old one. Proof of that is this app, these lessons, these stories you are reading. Proof of that is your children who know how to say "thank you" and "I love you" in Croatian. Language is not just a word — language is the soul of a people. May the new year that is coming bring you health, love, and always a little homeland in your heart. Your grandmother loves you. Goodnight and Happy New Year.`,
    vocab: [
      { hr: "prošek", en: "Dalmatian dessert wine" },
      { hr: "kukavičluk", en: "cowardice" },
      { hr: "nada", en: "hope" },
      { hr: "dokaz", en: "proof / evidence" },
      { hr: "duša", en: "soul" },
      { hr: "narod", en: "people / nation" },
    ],
    cultural: "Prošek is a traditional Dalmatian sweet wine made from dried grapes, sipped slowly and ceremonially. The Croatian diaspora numbers over 1.2 million people worldwide — their connection to language and homeland is the living heart of this app.",
  },
];

export default function BakaSummer({ goBack, award }) {
  const [chaptersDone, setChaptersDone] = useState(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('nh_baka_done') || '[]');
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const [chapter, setChapter] = useState(() => {
    const maxAllowed = chaptersDone.size; // can view up to last completed + 1 (0-indexed)
    const saved = parseInt(localStorage.getItem('nh_baka_ch') || '0', 10);
    return Math.min(saved, maxAllowed);
  });

  const [showTranslation, setShowTranslation] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(
    () => !!localStorage.getItem('nh_baka_done_bonus')
  );

  // Reset translation/vocab state when chapter changes
  useEffect(() => {
    setShowTranslation(false);
    setShowVocab(false);
  }, [chapter]);

  // Award completion bonus if all done and not yet awarded
  useEffect(() => {
    if (chaptersDone.size === 12 && !bonusAwarded) {
      award(100);
      localStorage.setItem('nh_baka_done_bonus', '1');
      setBonusAwarded(true);
    }
  }, [chaptersDone, bonusAwarded, award]);

  const current = CHAPTERS[chapter];
  const isCompleted = chaptersDone.has(chapter);
  const allDone = chaptersDone.size === 12;

  function markComplete() {
    const updated = new Set(chaptersDone);
    updated.add(chapter);
    setChaptersDone(updated);
    localStorage.setItem('nh_baka_done', JSON.stringify([...updated]));
    award(20);
    if (chapter < 11) {
      const next = chapter + 1;
      setChapter(next);
      localStorage.setItem('nh_baka_ch', String(next));
    } else {
      localStorage.setItem('nh_baka_ch', '11');
    }
  }

  function goToChapter(idx) {
    const maxAllowed = chaptersDone.size;
    if (idx >= 0 && idx <= Math.min(maxAllowed, 11)) {
      setChapter(idx);
      localStorage.setItem('nh_baka_ch', String(idx));
    }
  }

  return (
    <div className="scr-wrap" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            color: '#b61800',
            padding: '4px 8px',
            borderRadius: 6,
            lineHeight: 1,
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          {H("📖 Bakino Ljeto", "Baka's Summer — A Serialized Story")}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: '#78716c', marginBottom: 6,
        }}>
          <span style={{ fontWeight: 600 }}>Poglavlje {chapter + 1} od 12</span>
          <span>{chaptersDone.size} / 12 dovršeno</span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: 8, height: 8, overflow: 'hidden' }}>
          <div style={{
            background: '#b61800',
            height: '100%',
            width: `${(chaptersDone.size / 12) * 100}%`,
            borderRadius: 8,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {CHAPTERS.map((ch, idx) => {
            const done = chaptersDone.has(idx);
            const active = idx === chapter;
            const accessible = idx <= chaptersDone.size;
            return (
              <button
                key={idx}
                onClick={() => accessible && goToChapter(idx)}
                title={ch.title}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: active ? '2px solid #b61800' : '2px solid transparent',
                  background: done ? '#b61800' : active ? '#fca5a5' : '#e5e7eb',
                  cursor: accessible ? 'pointer' : 'default',
                  padding: 0,
                  fontSize: 9,
                  color: done ? '#fff' : '#78716c',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                aria-label={`Chapter ${idx + 1}${done ? ' (done)' : ''}`}
              >
                {done ? '✓' : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion card */}
      {allDone && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: '2px solid #f59e0b',
          borderRadius: 12,
          padding: '20px 16px',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>
            Završili ste Bakino Ljeto!
          </div>
          <div style={{ fontSize: 14, color: '#78350f', fontStyle: 'italic' }}>
            You finished all 12 chapters of Baka's Summer. Bravo!
          </div>
        </div>
      )}

      {/* Chapter card */}
      <div style={{
        background: '#fffbeb',
        borderRadius: 12,
        border: '1px solid #fde68a',
        boxShadow: '0 2px 12px rgba(180,96,0,0.08)',
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        {/* Chapter header */}
        <div style={{
          background: '#b61800',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              {current.date}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2 }}>
              {current.title}
            </div>
          </div>
          {isCompleted && (
            <div style={{
              background: '#fff',
              color: '#b61800',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              flexShrink: 0,
            }}>
              ✓
            </div>
          )}
        </div>

        {/* Croatian text */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 15,
            lineHeight: 1.9,
            color: '#292524',
            marginBottom: 16,
          }}>
            {current.croatian}
          </div>

          {/* Translation toggle */}
          <button
            onClick={() => setShowTranslation(v => !v)}
            style={{
              background: showTranslation ? '#0e7490' : '#fff',
              color: showTranslation ? '#fff' : '#0e7490',
              border: '2px solid #0e7490',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: showTranslation ? 12 : 0,
              transition: 'all 0.2s',
            }}
          >
            🌐 {showTranslation ? 'Hide English' : 'Show English'}
          </button>

          {/* English translation */}
          {showTranslation && (
            <div style={{
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: 8,
              padding: '14px 14px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 14,
              lineHeight: 1.8,
              color: '#134e4a',
              marginTop: 4,
            }}>
              {current.english}
            </div>
          )}
        </div>

        {/* Vocabulary section */}
        <div style={{ borderTop: '1px solid #fde68a', padding: '12px 16px' }}>
          <button
            onClick={() => setShowVocab(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#92400e',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📚 Vocabulary ({current.vocab.length} words) {showVocab ? '▲' : '▼'}
          </button>

          {showVocab && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {current.vocab.map((v, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  background: '#fef9ee',
                  borderRadius: 6,
                  padding: '6px 10px',
                  gap: 8,
                }}>
                  <span style={{ fontWeight: 700, color: '#b61800', fontSize: 14, fontFamily: 'Georgia, serif' }}>
                    {v.hr}
                  </span>
                  <span style={{ color: '#44403c', fontSize: 13, textAlign: 'right' }}>
                    {v.en}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cultural note */}
        <div style={{
          background: '#f0fdfa',
          borderTop: '1px solid #99f6e4',
          padding: '10px 16px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🌍</span>
          <p style={{ margin: 0, fontSize: 12, color: '#0f766e', lineHeight: 1.6, fontStyle: 'italic' }}>
            {current.cultural}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <button
          onClick={() => goToChapter(chapter - 1)}
          disabled={chapter === 0}
          style={{
            background: chapter === 0 ? '#e5e7eb' : '#fff',
            color: chapter === 0 ? '#9ca3af' : '#374151',
            border: '2px solid',
            borderColor: chapter === 0 ? '#e5e7eb' : '#d1d5db',
            borderRadius: 20,
            padding: '8px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: chapter === 0 ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ← Previous
        </button>

        {!isCompleted ? (
          <button
            onClick={markComplete}
            style={{
              background: '#b61800',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 22px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(182,24,0,0.3)',
              transition: 'all 0.2s',
            }}
          >
            ✓ Mark Complete
          </button>
        ) : chapter < 11 ? (
          <button
            onClick={() => goToChapter(chapter + 1)}
            style={{
              background: '#b61800',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 22px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(182,24,0,0.3)',
              transition: 'all 0.2s',
            }}
          >
            Continue →
          </button>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center' }}>
            🏆 All chapters done!
          </div>
        )}
      </div>
    </div>
  );
}
