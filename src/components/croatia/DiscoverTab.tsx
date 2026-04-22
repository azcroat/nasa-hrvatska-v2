import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PHOTO_CREDITS } from '../../lib/photos';
import CroatianKnight from '../shared/CroatianKnight';

// Seeded pseudo-random: same day → same result; no obvious pattern across days
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Rotating hero cities — one per day, 5-day cycle ──────────────────────────
// Each city carries 15 facts selected via seeded-random — no predictable sequence.
const HERO_CITIES = [
  {
    key: 'labin',
    src: '/images/scenes/labin.webp',
    alt: 'Labin, Istria — medieval hilltop town',
    name: '🏰 Labin, Istra',
    subtitle: 'Medieval hilltop town · first anti-fascist republic in Europe, 1921',
    credit: PHOTO_CREDITS.labin,
    pos: 'center 60%',
    facts: [
      {
        emoji: '✊',
        fact: "In 1921, Labin miners seized the local coal mine and declared an independent republic for 36 days — the first organised anti-fascist uprising in Europe, months before Mussolini's march on Rome.",
      },
      {
        emoji: '⛏️',
        fact: 'Labin was the coal-mining capital of Istria for centuries. The last mine finally closed in 1999, ending over 700 years of continuous underground mining beneath the old town.',
      },
      {
        emoji: '🏰',
        fact: "Labin's old town perches atop a 320-metre hill. Its medieval walls were built against Ottoman raids — even though the Ottomans never actually reached Istria.",
      },
      {
        emoji: '🫒',
        fact: 'The Labin area produces award-winning extra-virgin olive oil. Some of the groves supplying local producers contain trees over a thousand years old.',
      },
      {
        emoji: '🎨',
        fact: 'The Labin Art Republic festival transforms the old town every summer into an open-air gallery, with local and international artists taking over streets, staircases and stone walls.',
      },
      {
        emoji: '🌅',
        fact: "From Labin's hilltop on a clear day you can see the island of Cres, the Kvarner Gulf, and distant Alpine peaks in Slovenia — three countries in a single glance.",
      },
      {
        emoji: '🏛️',
        fact: "Inside Labin's Church of the Blessed Virgin Mary, a Roman tombstone was repurposed as an altar stone — layers of civilisation literally built on top of each other.",
      },
      {
        emoji: '🏴',
        fact: 'During WWII, Labin miners used their expert knowledge of underground tunnels to shelter partisan fighters and smuggle weapons past occupying forces.',
      },
      {
        emoji: '🪟',
        fact: "Labin's Renaissance loggia in the central square is one of the best-preserved examples of Venetian civic architecture in all of Istria.",
      },
      {
        emoji: '🐉',
        fact: 'Local legend holds that a dragon once lived in the caves beneath Labin hill. Miners would leave offerings of food at the mine entrance to appease it before each shift.',
      },
      {
        emoji: '🌐',
        fact: 'The town\'s name derives from the Roman settlement "Alvona" — a key waypoint on the ancient Roman road network that connected Pula to the wider empire.',
      },
      {
        emoji: '🦅',
        fact: "The Fortica fortress at Labin's highest point offers a full 360° panorama. On exceptionally clear winter days, the Italian coast near Trieste is visible across the sea.",
      },
      {
        emoji: '🎭',
        fact: 'Labin has produced a remarkable number of writers and poets relative to its size — a legacy of centuries of cultural exchange between Croatian, Italian and Venetian traditions.',
      },
      {
        emoji: '🪨',
        fact: "The cobblestone streets of Labin's old town are laid in a herringbone pattern — a paving technique introduced by Venetian craftsmen in the 15th century.",
      },
      {
        emoji: '🏺',
        fact: "The Narodni muzej Labin houses artefacts spanning prehistoric times through the miners' republic era, all within a beautifully restored 17th-century Baroque palace.",
      },
    ],
  },
  {
    key: 'rabac',
    src: '/images/scenes/rabac.webp',
    alt: 'Rabac, Istria — crystal-clear harbour',
    name: '🌊 Rabac, Istra',
    subtitle: 'The jewel of the Labin Riviera · crystal-clear Adriatic waters',
    credit: PHOTO_CREDITS.rabac,
    pos: 'center center',
    facts: [
      {
        emoji: '🏨',
        fact: "Rabac was a simple fishing village until Austrian aristocrats discovered it in the 1880s. Its first hotel opened in 1889, making it one of Istria's oldest resort destinations.",
      },
      {
        emoji: '💧',
        fact: 'The Adriatic at Rabac consistently ranks among the clearest seawater in Europe. On calm days, underwater visibility can exceed 30 metres.',
      },
      {
        emoji: '🌬️',
        fact: 'Rabac sits at the bottom of a sheltered bay directly below Labin, naturally protecting it from the fierce bura wind that batters much of the Kvarner coast in winter.',
      },
      {
        emoji: '🪨',
        fact: "Rabac's pebble beaches are formed by centuries of limestone erosion. Every stone has been individually smoothed by millennia of Adriatic wave action.",
      },
      {
        emoji: '🎬',
        fact: 'Rabac was a favoured location for Yugoslav film productions in the 1960s and 70s. Its dramatic bay and crystal waters made it a natural cinematic backdrop.',
      },
      {
        emoji: '🌡️',
        fact: 'Sea temperatures at Rabac peak around 26°C in August — warm enough for comfortable swimming from early June all the way through October.',
      },
      {
        emoji: '🚢',
        fact: 'In Roman times, a small port near modern Rabac served the inland town of Alvona (now Labin), exporting olive oil and wine to markets across the empire.',
      },
      {
        emoji: '🌲',
        fact: 'The Aleppo pine forests surrounding Rabac were planted in the early 1900s as part of an Austro-Hungarian beautification project — transforming what was once rocky scrubland.',
      },
      {
        emoji: '🎶',
        fact: 'The local festival "Rabačko ljeto" (Rabac Summer) runs every July and August, filling the harbour promenade with klapa singing, folk music and traditional Istrian dance.',
      },
      {
        emoji: '🐟',
        fact: 'Rabac lies where cold Adriatic deep currents meet warm surface water — conditions that produce exceptionally rich, flavourful seafood prized by chefs across Europe.',
      },
      {
        emoji: '🤿',
        fact: 'Scuba divers prize the waters around Rabac for several intact WWII wrecks at accessible depths, including an Italian torpedo boat sunk in 1944.',
      },
      {
        emoji: '📜',
        fact: 'The name "Rabac" likely derives from a pre-Slavic Illyrian word for a sheltered harbour — predating Croatian settlement of Istria by more than a thousand years.',
      },
      {
        emoji: '🏗️',
        fact: 'Dry-stone walls (gromače) on the hillsides above Rabac mark ancient field boundaries. Some of these walls have stood without mortar for over 500 years.',
      },
      {
        emoji: '🪁',
        fact: "Rabac hosts one of Croatia's most prestigious kiteboarding competitions each summer, drawing top athletes from across Europe to its reliably strong afternoon winds.",
      },
      {
        emoji: '🐢',
        fact: 'The shallow, warm bay in front of Rabac attracts loggerhead sea turtles (glavata kareta) in summer. The species has nested on nearby Istrian beaches since ancient times.',
      },
    ],
  },
  {
    key: 'mostar',
    src: '/images/scenes/mostar.webp',
    alt: 'Mostar, Bosnia-Herzegovina — Stari Most bridge',
    name: '🌉 Mostar, Hercegovina',
    subtitle: 'Stari Most — the Old Bridge rebuilt in 2004 · a symbol of reconciliation',
    credit: PHOTO_CREDITS.mostar,
    pos: 'center 55%',
    facts: [
      {
        emoji: '🌉',
        fact: 'Stari Most was built in 1566 by Ottoman architect Mimar Hayruddin. Its single stone arch spanning 29 metres was considered an engineering impossibility at the time of its construction.',
      },
      {
        emoji: '💔',
        fact: 'The bridge was deliberately destroyed on 9 November 1993 during the Bosnian War. Its reconstruction and reopening in 2004 became one of the most powerful symbols of reconciliation in the Balkans.',
      },
      {
        emoji: '🤿',
        fact: "Mostar's divers (mostari) have leapt from the 21-metre bridge into the Neretva River since 1664. Earning the title requires years of training under a certified master diver.",
      },
      {
        emoji: '🪨',
        fact: 'The bridge stone — called tenelija — is a local limestone that actually hardens as it ages. When freshly quarried, it can be worked almost like wood.',
      },
      {
        emoji: '🏙️',
        fact: 'Mostar gets its very name from the mostari (bridge-keepers) who guarded the original crossing. The entire city is literally named after its most famous structure.',
      },
      {
        emoji: '💚',
        fact: 'The Neretva River runs a striking emerald green through Mostar. The colour comes from glacial minerals dissolved from the Herzegovinian mountains far upstream.',
      },
      {
        emoji: '☀️',
        fact: "Mostar is one of the sunniest cities in Europe, averaging 2,700 sunshine hours per year — comparable to Croatia's most sun-drenched Adriatic islands.",
      },
      {
        emoji: '🌦️',
        fact: 'Mostar sits at the collision of Mediterranean and continental climates. It can snow in the city while just 40 kilometres away, the Adriatic coast stays relatively mild.',
      },
      {
        emoji: '🔨',
        fact: "Mostar's Old Bazaar (Kujundžiluk) has been a centre of copper craftsmanship since Ottoman times. Artisans still hand-beat vessels using techniques unchanged for five centuries.",
      },
      {
        emoji: '🕌',
        fact: 'Mostar was founded as an Ottoman military outpost in the 15th century. Within a century it had grown into one of the most important trading hubs in the western Balkans.',
      },
      {
        emoji: '💧',
        fact: 'The Blagaj Tekke — a Dervish monastery built in 1520 just outside Mostar — sits at the source of the Buna River, where millions of litres of water surge daily from a sheer cliff face.',
      },
      {
        emoji: '🐛',
        fact: 'In the 16th and 17th centuries, Mostar was famous throughout the Ottoman world for silk production. Mulberry trees were cultivated across the entire Neretva valley to feed the silkworms.',
      },
      {
        emoji: '🍷',
        fact: "Mostar's surrounding wine region produces Žilavka — one of the oldest indigenous white grape varieties in the Balkans, with a documented history stretching back to Roman times.",
      },
      {
        emoji: '🏄',
        fact: 'The Red Bull Cliff Diving World Series stops at Mostar each year. Professional divers compete from the same bridge where the mostari tradition has continued for over 360 years.',
      },
      {
        emoji: '🕊️',
        fact: "To this day, the Croatian, Bosniak and Serb communities of Mostar live in distinct neighbourhoods on either side of the Neretva — one of Europe's most visible examples of post-war urban division.",
      },
    ],
  },
  {
    key: 'bibinje',
    src: '/images/scenes/bibinje.webp',
    alt: 'Bibinje, Dalmatia — marina on the Adriatic',
    name: '⛵ Bibinje, Dalmacija',
    subtitle: 'Seaside village near Zadar · traditional Dalmatian fishing harbour',
    credit: PHOTO_CREDITS.bibinje,
    pos: 'center center',
    facts: [
      {
        emoji: '📍',
        fact: 'Bibinje lies just 12 kilometres south of Zadar — close enough to see the city lights at night, yet still retaining the unhurried rhythm of a traditional Dalmatian fishing village.',
      },
      {
        emoji: '🏺',
        fact: 'The village name derives from the Latin "Bibinium" — a small Roman settlement on the ancient coastal road that once connected Zadar to the southern Dalmatian cities.',
      },
      {
        emoji: '⚓',
        fact: "Bibinje's marina is one of the safest natural harbours on the northern Dalmatian coast, sheltered from open-sea swells by the islands of Ugljan and Pašman.",
      },
      {
        emoji: '🗿',
        fact: "The hills above Bibinje are dotted with Illyrian hillforts (gradine) built over 2,500 years ago — the ancestors of today's villagers looking out over the same Adriatic waters.",
      },
      {
        emoji: '🫒',
        fact: 'Bibinje is known across Dalmatia for its distinctive olive oil. The groves closest to the sea produce a fruity, slightly saline oil shaped by salt air and Mediterranean sun.',
      },
      {
        emoji: '🎵',
        fact: "Bibinje's klapa group has competed at national klapa festivals for over 40 years, keeping alive a Dalmatian vocal tradition that UNESCO recognised as an Intangible Cultural Heritage in 2012.",
      },
      {
        emoji: '🚣',
        fact: 'Traditional Dalmatian fishing boats called gajete are still hand-built in Bibinje using woodworking techniques brought to this coast by Venetian craftsmen in the 16th century.',
      },
      {
        emoji: '🛡️',
        fact: "During the Homeland War (1991–95), Bibinje's proximity to Zadar placed it near the front line. The village contributed disproportionately to the Croatian military effort.",
      },
      {
        emoji: '🥳',
        fact: 'Bibinje hosts a traditional summer festival (Bibinjsko ljeto) where folk dances, klapa performances and a communal feast bring the entire village together on the waterfront.',
      },
      {
        emoji: '🐢',
        fact: 'The shallow, warm bay in front of Bibinje attracts loggerhead sea turtles. The species has been documented nesting on nearby Dalmatian beaches since ancient Roman records.',
      },
      {
        emoji: '🦔',
        fact: "Local fishermen from Bibinje have long harvested sea urchins (ježinci) from the rocky seabed. Eaten raw with lemon juice, they're considered one of Dalmatia's greatest delicacies.",
      },
      {
        emoji: '🏗️',
        fact: "The stone walls of Bibinje's oldest houses are built without mortar using the dry-stone gromača technique — a construction method that has kept buildings standing for over 400 years.",
      },
      {
        emoji: '🌾',
        fact: 'Bibinje borders the Ravni Kotari plain, which has supplied Zadar with food since Roman times. The area is renowned for its wheat, wine and the finest figs in Dalmatia.',
      },
      {
        emoji: '🍷',
        fact: "On St Martin's Day (11 November), Bibinje celebrates the new wine harvest. Every family opens their konoba (wine cellar) and the entire village gathers to taste the new vintage together.",
      },
      {
        emoji: '🌅',
        fact: 'Sunsets from Bibinje\'s waterfront, looking west toward the islands, are among the most celebrated on the entire Dalmatian coast — the same views that inspired Alfred Hitchcock to call Zadar\'s sunsets "the most beautiful in the world."',
      },
    ],
  },
  {
    key: 'vinkovci',
    src: '/images/scenes/vinkovci.webp',
    alt: 'Vinkovci, Slavonia — central square',
    name: '🏛️ Vinkovci, Slavonija',
    subtitle: 'Oldest continuously inhabited city in Europe · 8,300+ years of history',
    credit: PHOTO_CREDITS.vinkovci,
    pos: 'center 45%',
    facts: [
      {
        emoji: '🕊️',
        fact: "The Vučedol Dove — a 4,800-year-old ceramic ritual vessel unearthed near Vinkovci — is now the symbol on Croatia's €1 coin, making this Slavonian town the unlikely birthplace of Croatia's most recognised icon.",
      },
      {
        emoji: '🌍',
        fact: 'Vinkovci is considered the oldest continuously inhabited city in Europe, with over 8,300 years of unbroken settlement on the same site — from the Neolithic through to the present day.',
      },
      {
        emoji: '⚔️',
        fact: 'Ancient Vinkovci was the Roman city of Cibalae. Emperor Valentinian I was born here in 321 AD — one of only two Roman emperors born in what is now Croatia (the other being Diocletian in Split).',
      },
      {
        emoji: '🏰',
        fact: "The Battle of Cibalae in 316 AD — fought near modern Vinkovci — was a pivotal clash between Emperor Constantine I and his co-emperor Licinius, helping establish Constantine's sole rule over the empire.",
      },
      {
        emoji: '🌳',
        fact: 'The Spačva forest near Vinkovci is one of the largest pedunculate oak forests in Europe. These ancient oaks have been harvested for shipbuilding and barrel-making for over 700 years.',
      },
      {
        emoji: '🪡',
        fact: 'The traditional Slavonian embroidery from the Vinkovci region (vinkovački vez) uses red thread on white linen in geometric patterns unchanged since medieval times. Each motif carries a specific cultural meaning.',
      },
      {
        emoji: '🎻',
        fact: 'The tamburica music tradition is strongest in the Vinkovci area. This small string instrument — related to the Turkish saz — arrived with Ottoman cultural influence and became the soul of Slavonian folk music.',
      },
      {
        emoji: '🎪',
        fact: "Vinkovci hosts one of Croatia's most famous folk festivals — Vinkovačke jeseni (Vinkovci Autumn) — celebrating Slavonian embroidery, music, dance and food every September since 1966.",
      },
      {
        emoji: '🛡️',
        fact: 'During the Homeland War (1991–95), Vinkovci endured over three years of Serbian artillery bombardment. The city never fell, and its resilience became a defining symbol of Croatian resistance in Slavonia.',
      },
      {
        emoji: '🏺',
        fact: "Vinkovci's Archaeological Museum holds 8,000 years of artefacts — including some of the finest Vučedol-culture pottery found anywhere in Europe — all within walking distance of the city centre.",
      },
      {
        emoji: '🌊',
        fact: 'The Bosut River flowing through Vinkovci marked a natural defensive boundary in the Roman Empire — separating the province of Pannonia from the barbarian territories to the north.',
      },
      {
        emoji: '🌶️',
        fact: 'Vinkovci is the heart of kulen production — a spiced Slavonian dry sausage made from free-range pigs fed on oak acorns. Kulen holds EU protected geographical indication status.',
      },
      {
        emoji: '🏛️',
        fact: "Vinkovci's central square has been the beating heart of public life since Roman times, when the forum of Cibalae stood on the very same spot beneath today's cobblestones.",
      },
      {
        emoji: '💒',
        fact: 'Slavonian weddings from the Vinkovci area can last three full days with hundreds of guests, featuring the svat (wedding escort) procession — an ancient ritual predating Croatian Christianity.',
      },
      {
        emoji: '🌾',
        fact: "The Vinkovci area sits at the heart of Slavonia's agricultural plain, one of the most fertile regions in Europe. Wheat, corn and sunflowers have been grown here continuously since Neolithic times.",
      },
    ],
  },
];

const KNIGHT_MESSAGES = [
  {
    mood: 'happy',
    text: 'Dobrodošli! New content rotates every day — a fresh city, phrase, and cultural fact just for you.',
  },
  {
    mood: 'thinking',
    text: 'Try the Stories tab — real letters from Baka Marija. Authentic Croatian the way families actually write.',
  },
  {
    mood: 'encouraging',
    text: "The Media tab has Croatian music and film. Listening is the fastest path to fluency — don't skip it!",
  },
  {
    mood: 'ready',
    text: 'You can save any word from Baka\'s letters straight to your vocabulary journal. Tap "+ Save word" on any tile.',
  },
  {
    mood: 'celebrating',
    text: 'Svaki dan novi grad! Every day reveals a different Croatian city. Keep coming back.',
  },
];

export default function DiscoverTab() {
  const { setScr } = useApp();
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const heroCity = HERO_CITIES[dayOfYear % HERO_CITIES.length]!;
  // Seeded-random fact selection: same day → same fact; no obvious repeating pattern
  const factIdx = Math.floor(seededRandom(dayOfYear) * heroCity.facts.length);
  const dailyFact = heroCity.facts[factIdx]!;

  // Rotating knight message
  const [kMsgIdx, setKMsgIdx] = useState(0);
  const [kMsgVisible, setKMsgVisible] = useState(true);
  const kTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    kTimerRef.current = setInterval(() => {
      setKMsgVisible(false);
      kFadeRef.current = setTimeout(() => {
        setKMsgIdx((i) => (i + 1) % KNIGHT_MESSAGES.length);
        setKMsgVisible(true);
      }, 350);
    }, 5500);
    return () => {
      clearInterval(kTimerRef.current ?? undefined);
      clearTimeout(kFadeRef.current ?? undefined);
    };
  }, []);

  const kMsg = KNIGHT_MESSAGES[kMsgIdx]!;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── HERO — Daily rotating city photo ── */}
      <div
        style={{
          position: 'relative',
          height: 210,
          overflow: 'hidden',
          borderRadius: 18,
          margin: '0 0 16px',
          boxShadow: '0 6px 24px rgba(0,0,0,.18)',
        }}
      >
        <img
          src={heroCity.src}
          alt={heroCity.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: heroCity.pos,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,.1) 30%, rgba(0,0,0,.7) 100%)',
          }}
        />
        {/* Daily badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            fontSize: 10,
            fontWeight: 800,
            color: 'white',
            background: 'rgba(14,116,144,.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 20,
            padding: '4px 10px',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          🗓️ Today's City
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: 'white',
              fontFamily: "'Playfair Display',serif",
              textShadow: '0 2px 12px rgba(0,0,0,.6)',
              marginBottom: 4,
            }}
          >
            {heroCity.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,.8)',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {heroCity.subtitle}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 9,
            color: 'rgba(255,255,255,.45)',
            background: 'rgba(0,0,0,.4)',
            borderRadius: 6,
            padding: '2px 6px',
          }}
        >
          {heroCity.credit}
        </div>
      </div>

      {/* ── DID YOU KNOW ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(124,58,237,.07),rgba(91,33,182,.04))',
          border: '1.5px solid rgba(124,58,237,.2)',
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--lavender,#7c3aed)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
            }}
          >
            Did You Know?
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>{dailyFact.emoji}</span>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.65, fontWeight: 500 }}>
            {dailyFact.fact}
          </div>
        </div>
      </div>

      {/* ── FEATURED STORY PREVIEW ── */}
      <button
        onClick={() => {
          const el = document.querySelector('[data-ctab="stories"]') as HTMLElement | null;
          if (el) el.click();
        }}
        className="tc"
        style={{
          background: 'linear-gradient(135deg,var(--warning-bg,#fffbeb),rgba(251,191,36,.08))',
          border: '1.5px solid var(--warning-b,#fde68a)',
          padding: '16px 18px',
          marginBottom: 12,
          display: 'block',
          width: '100%',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>💌</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--warning-dark,#92400e)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
            }}
          >
            Letters from Baka
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--warning-dark,#92400e)',
              background: 'var(--warning-bg,#fffbeb)',
              border: '1px solid var(--warning-b,#fde68a)',
              borderRadius: 20,
              padding: '2px 8px',
            }}
          >
            Stories tab →
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 6,
            fontFamily: "'Playfair Display',serif",
          }}
        >
          Baka Marija piše...
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            lineHeight: 1.6,
            fontStyle: 'italic',
            borderLeft: '3px solid var(--warning-b,#fde68a)',
            paddingLeft: 12,
          }}
        >
          &ldquo;Drago moje unuče, kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su
          procvjetali u vrtu...&rdquo;
        </div>
      </button>

      {/* ── HRVOJE COMPANION — rotating contextual messages ── */}
      <div
        className="c"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '14px 16px',
          marginBottom: 12,
        }}
      >
        <CroatianKnight size={58} mood={kMsg.mood} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--info)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 5,
            }}
          >
            Hrvoje kaže
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--body)',
              lineHeight: 1.65,
              opacity: kMsgVisible ? 1 : 0,
              transition: 'opacity .35s ease',
              minHeight: 38,
            }}
          >
            {kMsg.text}
          </div>
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {}
            {KNIGHT_MESSAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === kMsgIdx ? 14 : 5,
                  height: 5,
                  borderRadius: 3,
                  background: i === kMsgIdx ? 'var(--info)' : 'var(--card-b)',
                  transition: 'width .35s ease, background .35s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── DIALECT AWARENESS ── */}
      <button
        onClick={() => setScr('dialect_awareness')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          boxShadow: '0 4px 20px rgba(37,99,235,.35)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          🗣️
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: 'rgba(255,255,255,.6)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Linguistics · Culture
          </div>
          <div className="feature-card-title" style={{ color: '#fff', marginBottom: 3 }}>
            Croatian Dialect Explorer
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.72)' }}>
            Što vs Ča vs Kaj — discover the three dialects and where they come from.
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>

      {/* ── PHOTO VOCAB SCANNER ── */}
      <button
        onClick={() => setScr('photo_vocab')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#164e63,#0e7490)',
          boxShadow: '0 4px 20px rgba(14,116,144,.35)',
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          📷
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: 'rgba(255,255,255,.6)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            AI · Camera
          </div>
          <div className="feature-card-title" style={{ color: '#fff', marginBottom: 3 }}>
            Photo Vocabulary Scanner
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.72)' }}>
            Point your camera at menus, signs or labels — learn the Croatian words instantly.
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>
    </div>
  );
}
