import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';

import { rnd } from '../../lib/random.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}
// Normalize Croatian diacritics for lenient free-text comparison
function normCro(s){return s.toLowerCase().replace(/[čć]/g,'c').replace(/š/g,'s').replace(/ž/g,'z').replace(/đ/g,'d').replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim();}

// ── Portrait mapping — scenario ID → portrait filename ──────────────────────
const DIALOGUE_PORTRAIT = {
  cafe:            'young-man',     // Konobar (waiter)
  directions:      'mature-man',    // Prolaznik (helpful local man)
  doctor:          'mature-man',    // Doktor
  shopping:        'young-woman',   // Prodavačica (shop assistant)
  meeting:         'young-man',     // Marko (new friend)
  transport:       'mature-woman',  // Blagajnica (ticket clerk)
  pharmacy:        'mature-woman',  // Ljekarnica Ana
  restaurant:      'young-man',     // Konobar / Recepcionista
  family_gathering:'grandmother',   // Gospođa Horvat / Baka
};

function DialogueAvatar({ scenarioId }) {
  const key = DIALOGUE_PORTRAIT[scenarioId];
  const [err, setErr] = React.useState(false);
  if (!key || err) return null;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', border: '2px solid #e0f2fe',
      background: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
      marginTop: 2,
    }}>
      <img
        src={`/images/portraits/${key}.jpg`}
        alt=""
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

const SCENARIOS = [
  {
    id:"cafe",
    title:"☕ At the Café",
    subtitle:"Order drinks and pay the bill",
    difficulty:"A1",
    turns:[
      { speaker:"Konobar", line:"Dobar dan! Što ćete naručiti?", en:"Good day! What would you like to order?",
        opts:["Mogu li dobiti kavu, molim?","Ja hoću kava.","Daj mi kavu.","Kava!"],
        answer:0, tip:"'Mogu li dobiti...' is the polite way to order. 'Ja hoću...' is too direct/childlike." },
      { speaker:"Konobar", line:"S mlijekom ili bez?", en:"With milk or without?",
        opts:["S mlijekom, hvala.","Ja hoću s mlijekom.","Mlijeko da.","Sa mlijekom."],
        answer:0, tip:"'S mlijekom' (with milk) is correct. Note: 's' before consonants, 'sa' before consonant clusters. 📚 See: Instrumental Case (Lesson 4)" },
      { speaker:"Konobar", line:"Izvolite. Trebate li još nešto?", en:"Here you go. Do you need anything else?",
        opts:["Molim vas, možete li donijeti i čašu vode?","Ja trebam voda.","Daj vodu.","Ne, bog."],
        answer:0, tip:"Polite request with 'možete li donijeti' — could you bring. Always use 'molim vas' in formal settings." },
      { speaker:"Konobar", line:"Naravno! Još nešto?", en:"Of course! Anything else?",
        opts:["Ne, hvala, to je sve.","Ništa ne.","Nema.","Ne hvala."],
        answer:0, tip:"'To je sve' (that's all) is the natural way to close an order." },
      { speaker:"Konobar", line:"Mogu li vam donijeti račun?", en:"May I bring you the bill?",
        opts:["Da, molim. Koliko je to?","Koliko košta?","Daj račun.","Da, hvala."],
        answer:0, tip:"'Koliko je to?' (How much is that?) is more natural than just accepting. Both 0 and 3 are acceptable." },
    ]
  },
  {
    id:"directions",
    title:"🗺️ Asking for Directions",
    subtitle:"Find your way around a Croatian city",
    difficulty:"A1",
    turns:[
      { speaker:"You approach someone", line:"[You need to ask where the post office is]", en:"Ask politely for directions",
        opts:["Oprostite, gdje je pošta?","Gdje je pošta?","Pošta gdje?","Tražim poštu."],
        answer:0, tip:"'Oprostite' (excuse me) is essential before asking a stranger. Always start with it." },
      { speaker:"Prolaznik", line:"Pošta? Idite ravno, pa skrenite lijevo.", en:"The post office? Go straight, then turn left.",
        opts:["Hvala lijepa, koliko je daleko?","Što?","Hvala.","Ne razumijem."],
        answer:0, tip:"Asking 'koliko je daleko?' (how far is it?) shows you're engaged and gets useful extra info." },
      { speaker:"Prolaznik", line:"Otprilike deset minuta pješice.", en:"About ten minutes on foot.",
        opts:["Odlično, hvala puno!","Dobro.","Ok.","Hvala."],
        answer:0, tip:"'Odlično' (excellent) + 'hvala puno' (thank you very much) is warm and natural." },
      { speaker:"Prolaznik", line:"Nema na čemu! Sretno!", en:"Don't mention it! Good luck!",
        opts:["Hvala, i vama!","Ok.","Bog.","Hvala."],
        answer:0, tip:"'I vama' (to you too) is the standard response to a kind wish — don't just say 'hvala'." },
    ]
  },
  {
    id:"doctor",
    title:"🏥 At the Doctor",
    subtitle:"Describe symptoms and understand advice",
    difficulty:"A2",
    turns:[
      { speaker:"Doktor", line:"Dobar dan. Što vas muči?", en:"Good day. What's bothering you?",
        opts:["Boli me grlo i imam temperaturu.","Ja imam bolestan.","Moj grlo boli.","Temperatura."],
        answer:0, tip:"'Boli me grlo' (my throat hurts, lit. 'it hurts me the throat') is the correct Croatian structure. 📚 See: Cases — Accusative (Lesson 4)" },
      { speaker:"Doktor", line:"Koliko dugo imate te tegobe?", en:"How long have you had these symptoms?",
        opts:["Od jučer, oko dva dana.","Dva dana.","Ja imam ovo dva dana.","Jučer."],
        answer:0, tip:"'Od jučer' (since yesterday) + specific timeframe is natural. 'Oko' (approximately) adds precision." },
      { speaker:"Doktor", line:"Imate li kakve alergije na lijekove?", en:"Do you have any allergies to medications?",
        opts:["Ne, koliko znam, nemam alergija.","Ne.","Nemam.","Ja nemam alergija."],
        answer:0, tip:"'Koliko znam' (as far as I know) is a natural hedge. 'Nemam alergija' uses correct genitive of negation." },
      { speaker:"Doktor", line:"Prepisat ću vam antibiotike. Uzimajte tri puta dnevno.", en:"I'll prescribe antibiotics. Take them three times daily.",
        opts:["Razumijem. Koliko dana ih trebam uzimati?","Ok.","Hvala.","Razumijem."],
        answer:0, tip:"Always ask clarifying questions! 'Koliko dana' (how many days) shows you're engaged." },
      { speaker:"Doktor", line:"Sedam dana. I odmarajte se više.", en:"Seven days. And rest more.",
        opts:["Hoću, hvala doktore. Vidimo se!","Ok doktor.","Hvala.","Vidimo se."],
        answer:0, tip:"'Vidimo se!' (See you!) is a warm farewell to regular acquaintances including doctors." },
    ]
  },
  {
    id:"shopping",
    title:"🛍️ Shopping",
    subtitle:"Buy clothes at a Croatian shop",
    difficulty:"A2",
    turns:[
      { speaker:"Prodavačica", line:"Mogu li vam pomoći?", en:"Can I help you?",
        opts:["Samo gledam, hvala.","Ne.","Da.","Tražim majicu."],
        answer:0, tip:"'Samo gledam' (just browsing) is the universal polite answer. Option 3 is also fine if you want help." },
      { speaker:"Prodavačica", line:"[You found a shirt you like] Imate li ovo u većoj veličini?", en:"Do you have this in a larger size?",
        opts:["Imate li ovo u većoj veličini?","Ja hoću veće.","Veće, molim.","Ovo je malo."],
        answer:0, tip:"'Imate li' (do you have) + 'u većoj veličini' (in a larger size) is the full natural question." },
      { speaker:"Prodavačica", line:"Naravno, imate medium i large.", en:"Of course, we have medium and large.",
        opts:["Mogu li probati medium?","Daj mi medium.","Medium.","Probati?"],
        answer:0, tip:"'Mogu li probati' (may I try on) is polite and natural." },
      { speaker:"Prodavačica", line:"Svlačionica je tamo lijevo.", en:"The fitting room is over there on the left.",
        opts:["Hvala!","Ok.","Dobro.","Da."],
        answer:0, tip:"A simple warm 'Hvala!' is perfect here." },
      { speaker:"Prodavačica", line:"Kako vam stoji?", en:"How does it fit you?",
        opts:["Savršeno! Uzet ću ovo. Gdje se plaća?","Dobro.","Ok.","Stoji mi."],
        answer:0, tip:"'Savršeno!' (perfectly) + 'uzet ću' (I'll take it) + asking where to pay — complete natural transaction." },
    ]
  },
  {
    id:"meeting",
    title:"👋 Meeting Someone New",
    subtitle:"Introduce yourself at a social event",
    difficulty:"A1",
    turns:[
      { speaker:"Stranger", line:"Bog! Jesi li ti novi u gradu?", en:"Hi! Are you new to the city?",
        opts:["Da, tek sam se doselio/doselila. Ja sam [ime].","Da, ja sam novi.","Da.","Novi sam."],
        answer:0, tip:"'Tek sam se doselio' (I just moved here) + introducing yourself is the natural full response." },
      { speaker:"Stranger", line:"Drago mi je! Ja sam Marko. Otkud si?", en:"Nice to meet you! I'm Marko. Where are you from?",
        opts:["Drago mi je, Marko! Ja sam iz Engleske, ali učim hrvatski.","Engleska.","Iz Engleske.","Ja sam Englez."],
        answer:0, tip:"Full response with their name + your origin + showing you're learning Croatian = great first impression!" },
      { speaker:"Marko", line:"Super! Kako ti ide s hrvatskim?", en:"Great! How's your Croatian going?",
        opts:["Polako, ali napredujem. Jezik mi je teži nego što sam mislio.","Dobro.","Teško.","Ok, teško."],
        answer:0, tip:"'Polako, ali napredujem' (slowly but I'm progressing) is honest and shows effort. Locals love this." },
      { speaker:"Marko", line:"Ha! Svima nam je bio težak. Hoćeš još piće?", en:"Ha! It was hard for all of us. Do you want another drink?",
        opts:["Rado! Hvala puno, Marko.","Da.","Hoću.","Ok."],
        answer:0, tip:"'Rado!' (gladly/with pleasure) is a warm enthusiastic yes — much better than just 'da'." },
    ]
  },
  {
    id:"transport",
    title:"🚌 Public Transport",
    subtitle:"Buy a ticket and find your platform",
    difficulty:"A2",
    turns:[
      { speaker:"Blagajnica", line:"Izvolite, slušam vas.", en:"Yes, I'm listening.",
        opts:["Molim vas jednu kartu za Split, molim.","Jedan karta za Split.","Split karta.","Karta Split."],
        answer:0, tip:"'Jednu kartu za Split' — accusative 'kartu' (ticket-ACC) after verbs of giving/wanting." },
      { speaker:"Blagajnica", line:"Povratnu ili u jednom smjeru?", en:"Return or one-way?",
        opts:["U jednom smjeru, molim.","Jedan smjer.","One way.","Samo tamo."],
        answer:0, tip:"'U jednom smjeru' (one-way, lit. in one direction) is the Croatian term." },
      { speaker:"Blagajnica", line:"To je sto dvadeset kuna... pardon, eura.", en:"That's 120 euros.",
        opts:["Izvolite. S kojeg perona polazi vlak?","Hvala.","Ok.","Peron?"],
        answer:0, tip:"'S kojeg perona' (from which platform) — genitive after 's'. Essential travel question!" },
      { speaker:"Blagajnica", line:"S petog perona, polazi u 14:30.", en:"From platform 5, it departs at 14:30.",
        opts:["Hvala lijepa! Imate li neku kavu dok čekam?","Hvala.","Ok.","Razumijem."],
        answer:0, tip:"Option 0 is humorous but natural — shows confidence. All options are grammatically acceptable here." },
    ]
  },
  {
    id:"emergency",
    title:"🚨 Emergency",
    subtitle:"Handle an urgent situation in Croatian",
    difficulty:"A2",
    turns:[
      { speaker:"(You need to call for help)", line:"[You see someone fall and need help]", en:"Call for help urgently",
        opts:["Pomoć! Zovite hitnu pomoć, molim!","Pomoć!","Hitna pomoć!","Help!"],
        answer:0, tip:"Full clear sentence gives bystanders all the information. 'Zovite' (call!) is imperative plural." },
      { speaker:"Prolaznik", line:"Što se dogodilo?", en:"What happened?",
        opts:["Čovjek je pao i ne reagira. Zovite 112!","Pao je.","Hitna pomoć.","Ne znam."],
        answer:0, tip:"Clear description + '112' (Croatian emergency number) + instruction. Be specific in emergencies!" },
      { speaker:"Dispečer (112)", line:"Koji je vaš položaj?", en:"What is your location?",
        opts:["Nalazimo se na Trgu bana Jelačića, ispred fontane.","Trg.","Centar.","Ovdje."],
        answer:0, tip:"Specific landmark + position is critical. 'Nalazimo se' (we are located) is formal and clear." },
      { speaker:"Dispečer", line:"Hitna pomoć dolazi. Je li osoba svjesna?", en:"Ambulance is coming. Is the person conscious?",
        opts:["Čini se da nije. Disanje je nepravilno.","Ne.","Nesvjestan.","Ne znam."],
        answer:0, tip:"Providing breathing information is crucial medical data. 'Čini se' (it seems) shows appropriate uncertainty." },
    ]
  },
  {
    id:"pharmacy",
    title:"💊 At the Pharmacy",
    subtitle:"Get medication for a headache in Split",
    difficulty:"A2",
    turns:[
      { speaker:"Ljekarnica Ana", line:"Dobar dan! Mogu li vam pomoći?", en:"Good day! Can I help you?",
        opts:["Dobar dan! Imate li nešto za glavobolju?","Ja imam glavobolja.","Hoću lijek za glava.","Glavobolja."],
        answer:0, tip:"'Imate li nešto za glavobolju?' (Do you have something for a headache?) — correct accusative 'glavobolju' after 'za'. The other options use wrong case or broken phrasing." },
      { speaker:"Ljekarnica Ana", line:"Imate li recept, ili vam treba nešto bez recepta?", en:"Do you have a prescription, or do you need something over the counter?",
        opts:["Nemam recept. Trebam nešto bez recepta, molim.","Ja nemam recept.","Ne imam recept.","Bez recept."],
        answer:0, tip:"'Nemam recept' (I don't have a prescription) + 'trebam nešto bez recepta' (I need something without a prescription) is a complete natural response. 'Ne imam' is wrong — Croatian negation fuses as 'nemam', not 'ne imam'." },
      { speaker:"Ljekarnica Ana", line:"U redu. Preporučujem ibuprofen ili aspirin. Koji preferirate?", en:"Alright. I recommend ibuprofen or aspirin. Which do you prefer?",
        opts:["Ibuprofen, molim. Koliko tableta trebam uzimati i kako često?","Ibuprofen.","Dajte mi ibuprofen.","Hoću ibuprofen."],
        answer:0, tip:"Asking 'koliko tableta... i kako često?' (how many tablets and how often?) is essential — it shows competence and gets the dosage info you need. Just saying 'Ibuprofen' is too abrupt for a pharmacy." },
      { speaker:"Ljekarnica Ana", line:"Jednu do dvije tablete, svaka četiri do šest sati. Ne više od šest tableta dnevno.", en:"One to two tablets every four to six hours. No more than six tablets per day.",
        opts:["Razumijem, hvala. Smiju li se uzimati na prazan želudac?","Ok.","Razumijem.","Hvala, gotovo."],
        answer:0, tip:"'Smiju li se uzimati na prazan želudac?' (Can they be taken on an empty stomach?) is a practical follow-up question that shows real comprehension. 'Na prazan želudac' (on an empty stomach) is a useful phrase to know." },
      { speaker:"Ljekarnica Ana", line:"Bolje s hranom ili mlijekom. Ima li još nešto?", en:"Better with food or milk. Is there anything else?",
        opts:["Hvala lijepa. Koliko to košta?","Koliko košta?","Što košta?","Cijena?"],
        answer:0, tip:"'Hvala lijepa' (many thanks) before asking the price is polite. 'Koliko to košta?' (How much does that cost?) is more complete than bare 'Koliko košta?', and much more natural than just 'Cijena?' (Price?)." },
      { speaker:"Ljekarnica Ana", line:"Deset eura, molim. Evo vam račun.", en:"Ten euros, please. Here is your receipt.",
        opts:["Izvolite, hvala lijepa! Ugodan dan!","Hvala.","Ok, bog.","Bok."],
        answer:0, tip:"'Izvolite' (here you are, as you hand over payment) + 'hvala lijepa' + 'Ugodan dan!' (Have a pleasant day!) is the complete warm leave-taking. 'Ok, bog' is too casual for a pharmacy interaction." },
    ]
  },
  {
    id:"restaurant",
    title:"🍽️ Restaurant Reservation",
    subtitle:"Make a reservation and order a meal",
    difficulty:"B1",
    turns:[
      { speaker:"Recepcionista", line:"Dobra večer, restoran 'Dubrovnik', izvolite.", en:"Good evening, restaurant 'Dubrovnik', how can I help?",
        opts:["Dobra večer. Htjela bih rezervirati stol za dvoje za petak navečer.","Rezervacija.","Htjeti stol.","Stol za dvoje."],
        answer:0, tip:"'Htjela bih' (I would like — conditional, feminine) is perfectly polite. Include all details upfront." },
      { speaker:"Recepcionista", line:"Za koliko sati?", en:"For what time?",
        opts:["Za osam sati navečer, ako je moguće.","Osam sati.","20:00.","Osam."],
        answer:0, tip:"'Ako je moguće' (if possible) is a polite hedge — shows you're flexible. Natural Croatian." },
      { speaker:"Recepcionista", line:"Savršeno. Ime i prezime?", en:"Perfect. Name and surname?",
        opts:["[Vaše ime i prezime], molim.","Moje ime je...","Ja sam...","[Ime]."],
        answer:0, tip:"In Croatian, you'd state your full name naturally. The polite 'molim' closing is good form." },
      { speaker:"Konobar (at restaurant)", line:"Što preporučujete?", en:"What do you recommend?",
        opts:["Što biste Vi preporučili — riba ili meso?","Riba.","Što je dobro?","Preporučite nešto."],
        answer:0, tip:"Turning the question back — 'što BISTE Vi preporučili' (what would YOU recommend) — is elegant and social. 📚 See: Conditional Mood (Lesson 7)" },
      { speaker:"Konobar", line:"Naša riba je danas posebno svježa. Dorade imate od lokalne flote.", en:"Our fish is especially fresh today. The sea bream is from the local fleet.",
        opts:["Zvuči odlično! Uzet ću dorade s povrćem.","Ok.","Da.","Dorade."],
        answer:0, tip:"'Zvuči odlično' (sounds excellent) + complete order = perfect response. Shows comprehension and decision." },
    ]
  },
  {
    id: 'family_gathering',
    title: '🏠 Obiteljski susret',
    subtitle: 'Meet your Croatian partner\'s family for the first time',
    difficulty: 'B1',
    turns: [
      {
        speaker: 'Gospođa Horvat',
        line: 'Dobro došli! Drago mi je što ste konačno došli k nama.',
        en: 'Welcome! I\'m so glad you\'ve finally come to us.',
        opts: [
          'Hvala lijepa! I meni je drago. Lijepo ste uredili.',
          'Hvala. Tvoja kuća je lijepa.',
          'Ja sam sretan što sam ovdje.',
          'Hvala, bok.',
        ],
        answer: 0,
        tip: 'Use "Vi" (formal you) with elders and on first meetings — never "ti" until invited. "Lijepo ste uredili" is the perfect house compliment. "Tvoja" uses informal "ti" — wrong here. "Ja sam sretan" is grammatically off; "Sretan sam što sam ovdje" would be better. "Hvala, bok" is far too casual for a first introduction.',
      },
      {
        speaker: 'Gospođa Horvat',
        line: 'Hoćete li rakiju? Domaća je, od šljiva.',
        en: 'Would you like some rakija? It\'s homemade, from plums.',
        opts: [
          'Hvala lijepa, malo, molim. Čuo sam da je vaša domaća rakija posebna.',
          'Ne, ne volim rakiju.',
          'Da, ja pijem rakiju svaki dan.',
          'Što je rakija?',
        ],
        answer: 0,
        tip: 'Never flatly refuse — in Croatian hospitality, "malo, molim" (just a little) is the graceful acceptance. Complimenting the homemade quality earns immediate warmth. A flat refusal ("ne, ne volim") is rude. Saying you drink it daily is too casual for a first visit.',
      },
      {
        speaker: 'Baka',
        line: 'Probajte ovo! Ja sam to cijeli dan kuhala za vas.',
        en: 'Try this! I cooked it all day for you.',
        opts: [
          'Hvala, izvrsno je! Nikad nisam jeo/jela ovako ukusno.',
          'Hvala, ali nisam gladan/gladna.',
          'Što je ovo?',
          'Ok, probat ću.',
        ],
        answer: 0,
        tip: '"Izvrsno je" (it\'s excellent) said immediately upon tasting is mandatory Croatian table etiquette. Never refuse Baka\'s food — she cooked all day. "Što je ovo?" without complimenting first sounds ungrateful. Use jeo/jela (ate) — m/f agreement with yourself.',
      },
      {
        speaker: 'Gospodin Horvat',
        line: 'Kako učite naš jezik? Teško je, zar ne?',
        en: 'How are you learning our language? It\'s hard, isn\'t it?',
        opts: [
          'Polako napredujem. Jezik mi je teži nego što sam mislio, ali vrijedi svaki trud.',
          'Da, jako je težak. Možda odustanem.',
          'Nije teško, brzo učim.',
          'Učim malo svaki dan na telefonu.',
        ],
        answer: 0,
        tip: '"Vrijedi svaki trud" (it\'s worth every effort) shows respect for the language and the family. Saying you might give up ("možda odustanem") will concern them. Claiming it\'s easy ("nije teško") sounds dismissive. Honesty paired with determination is the right register here.',
      },
      {
        speaker: 'Tomislav (Anin bratić)',
        line: 'Hej, možemo li prijeći na ti? Vi mi zvuči čudno od nekoga Anine dobi.',
        en: 'Hey, can we switch to "ti"? "Vi" sounds strange from someone Ana\'s age.',
        opts: [
          'Naravno, s veseljem! Hvala što si predložio.',
          'Ne, preferiram Vi.',
          'Nisam razumio/razumjela — možeš li ponoviti?',
          'Sve mi je isto.',
        ],
        answer: 0,
        tip: 'When a Croatian peer explicitly offers to switch to "ti", always accept warmly — refusing is awkward. The offer itself is a sign of welcome. "S veseljem" (gladly/with pleasure) is the perfect warm acceptance. Only keep "Vi" when the elder themselves insists.',
      },
      {
        speaker: 'Gospodin Horvat',
        line: 'Za zdravlje naših obitelji! Živjeli!',
        en: 'To the health of our families! Cheers!',
        opts: [
          'Živjeli! Za zdravlje i sreću!',
          'Cheers!',
          'Hvala, živjeli.',
          'Ok.',
        ],
        answer: 0,
        tip: 'Always respond to "Živjeli!" with "Živjeli!" — it\'s the universal Croatian toast. Adding "Za zdravlje i sreću!" (to health and happiness) shows you\'ve done your homework. Saying "Cheers" in English at a Croatian family table misses a major connection moment. Make eye contact when toasting.',
      },
      {
        speaker: 'Gospođa Horvat',
        line: 'Ostanite na večeru! Imam još toliko hrane.',
        en: 'Stay for dinner! I have so much more food.',
        opts: [
          'Hvala puno na pozivu! Jako smo se lijepo proveli. Vidimo se uskoro!',
          'Ne možemo, idemo kući.',
          'Možda drugi put.',
          'Ok, doviđenja.',
        ],
        answer: 0,
        tip: '"Hvala puno na pozivu" (thank you so much for the invitation) is the essential parting phrase for any Croatian home visit. "Jako smo se lijepo proveli" (we had a wonderful time) seals the warmth. A blunt "idemo kući" or vague "možda drugi put" leaves the hosts feeling the visit wasn\'t appreciated.',
      },
    ],
  },
];

// Build a shuffled options array for a single turn; returns { opts, correctIdx }
function shuffleTurnOpts(turn) {
  const indices = turn.opts.map((_, i) => i);
  // Fisher-Yates shuffle on the index array
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOpts = indices.map(i => turn.opts[i]);
  const correctIdx = indices.indexOf(turn.answer);
  return { opts: shuffledOpts, correctIdx };
}

export default function DialogueSim({ award }) {
  const { level: userLevel } = useApp();
  const finishFired = useRef(false);
  const [scenario, setScenario] = useState(null);
  const [turnIdx, setTurnIdx] = useState(0);
  // shuffledTurns: array of { opts, correctIdx } parallel to scenario.turns
  const [shuffledTurns, setShuffledTurns] = useState([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [done, setDone] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const [freeInput, setFreeInput] = useState('');
  const [freeResult, setFreeResult] = useState(null); // null | { matched: bool, input: string, correct: string }

  // AI Conversation Mode state
  const [aiMode, setAiMode] = useState(false);
  const [aiHistory, setAiHistory] = useState([]); // [{role:'user'|'assistant', content: string}]
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoaching, setAiCoaching] = useState(null); // null | string (last coaching note)
  const [aiTurns, setAiTurns] = useState(0);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState('');

  function startScenario(s) {
    finishFired.current = false;
    setScenario(s);
    setShuffledTurns(s.turns.map(shuffleTurnOpts));
    setTurnIdx(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setDone(false);
    setFreeInput('');
    setFreeResult(null);
    setAiMode(false);
    setAiHistory([]);
    setAiInput('');
    setAiLoading(false);
    setAiCoaching(null);
    setAiTurns(0);
    setAiDone(false);
    setAiError('');
  }

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === shuffledTurns[turnIdx].correctIdx) {
      setScore(sc => sc + 1);
    }
  }

  function handleFreeSubmit() {
    if (answered || !freeInput.trim()) return;
    const turn = scenario.turns[turnIdx];
    const correctAnswer = turn.opts[turn.answer];
    const userTrimmed = freeInput.trim().toLowerCase();
    const correctTrimmed = correctAnswer.toLowerCase();
    // Exact match first; fall back to diacritic-normalized match (for users without Croatian keyboard)
    const matched = userTrimmed === correctTrimmed || normCro(userTrimmed) === normCro(correctTrimmed);
    setFreeResult({ matched, input: freeInput.trim(), correct: correctAnswer });
    setAnswered(true);
    if (matched) {
      setScore(sc => sc + 1);
    }
  }

  function handleContinue() {
    const nextIdx = turnIdx + 1;
    if (nextIdx >= scenario.turns.length) {
      if (!finishFired.current) {
        finishFired.current = true;
        if (award) {
          const lastCorrect = freeMode
            ? (freeResult && freeResult.matched ? 1 : 0)
            : (selected === shuffledTurns[turnIdx].correctIdx ? 1 : 0);
          award((score + lastCorrect) * 6);
        }
      }
      setDone(true);
    } else {
      setTurnIdx(nextIdx);
      setAnswered(false);
      setSelected(-1);
      setFreeInput('');
      setFreeResult(null);
    }
  }

  function goBack() {
    setScenario(null);
    setDone(false);
    setAnswered(false);
    setSelected(-1);
    setTurnIdx(0);
    setScore(0);
    setShuffledTurns([]);
    setFreeInput('');
    setFreeResult(null);
    setAiMode(false);
    setAiHistory([]);
    setAiInput('');
    setAiLoading(false);
    setAiCoaching(null);
    setAiTurns(0);
    setAiDone(false);
    setAiError('');
  }

  async function sendAiMessage() {
    if (!aiInput.trim() || aiLoading || aiDone) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiLoading(true);
    setAiError('');
    const newHistory = [...aiHistory, { role: 'user', content: userMsg }];
    setAiHistory(newHistory);
    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario.id,
          userMessage: userMsg,
          history: aiHistory,
          level: userLevel || 'A2',
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAiHistory([...newHistory, { role: 'assistant', content: data.reply }]);
      setAiCoaching(data.coaching || null);
      setAiTurns(t => t + 1);
    } catch {
      setAiError('Could not connect. Check your internet and try again.');
      // Remove the user message we optimistically added on error
      setAiHistory(aiHistory);
    } finally {
      setAiLoading(false);
    }
  }

  // Difficulty badge colours
  const DIFF_COLORS = { A1:'#dcfce7', A2:'#dbeafe', B1:'#fef3c7', B2:'#fce7f3' };
  const DIFF_TEXT   = { A1:'#166534', A2:'#1e40af', B1:'#92400e', B2:'#9d174d' };

  // --- MENU SCREEN ---
  if (!scenario) {
    return (
      <div className="scr-wrap">
        {H("💬 Dialogue Simulator", "Real conversations, real Croatian")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {SCENARIOS.map(s => (
            <button key={s.id} className="tc" onClick={() => startScenario(s)}
              style={{textAlign:"left",padding:"14px",position:"relative"}}>
              <div style={{fontSize:24,marginBottom:6}}>{s.title.split(' ')[0]}</div>
              <div style={{fontSize:13,fontWeight:800,color:"var(--heading)",lineHeight:1.3}}>{s.title.slice(2)}</div>
              <div style={{fontSize:11,color:"var(--subtext)",marginTop:4}}>{s.subtitle}</div>
              {s.difficulty && (
                <div style={{
                  display:"inline-block",marginTop:8,
                  fontSize:10,fontWeight:800,
                  background:DIFF_COLORS[s.difficulty]||'#f3f4f6',
                  color:DIFF_TEXT[s.difficulty]||'#374151',
                  borderRadius:6,padding:"2px 7px",
                  letterSpacing:".04em",
                }}>
                  {s.difficulty}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const totalTurns = scenario.turns.length;

  // --- RESULTS SCREEN ---
  if (done) {
    const finalScore = score;
    const pct = Math.round((finalScore / totalTurns) * 100);
    const isExcellent = pct > 80;
    return (
      <div className="scr-wrap">
        {H("💬 Dialogue Simulator", scenario.title)}
        <div style={{
          background:"var(--card)",
          border:"1.5px solid var(--card-b)",
          borderRadius:18,
          padding:"28px 24px",
          textAlign:"center",
          marginBottom:16,
        }}>
          <div style={{fontSize:48,marginBottom:12}}>{isExcellent ? "🏆" : "💪"}</div>
          <div style={{fontSize:28,fontWeight:900,color:"var(--heading)",marginBottom:6}}>
            {finalScore} / {totalTurns}
          </div>
          <div style={{fontSize:15,color:"var(--subtext)",marginBottom:16}}>
            {pct}% correct responses
          </div>
          {isExcellent ? (
            <div style={{
              background:"#dcfce7",
              border:"1.5px solid #86efac",
              borderRadius:12,
              padding:"12px 16px",
              fontSize:15,
              fontWeight:700,
              color:"#166534",
            }}>
              Odlično! You handled that conversation beautifully!
            </div>
          ) : (
            <div style={{
              background:"#fef3c7",
              border:"1.5px solid #fcd34d",
              borderRadius:12,
              padding:"12px 16px",
              fontSize:15,
              fontWeight:700,
              color:"#92400e",
            }}>
              Good effort! Review the tips and try this scenario again.
            </div>
          )}
        </div>
        <button className="tc" onClick={goBack}
          style={{width:"100%",padding:"14px",fontWeight:800,fontSize:14,color:"var(--heading)"}}>
          ← Back to Scenarios
        </button>
      </div>
    );
  }

  // --- CONVERSATION SCREEN ---
  const turn = scenario.turns[turnIdx];
  const shuffled = shuffledTurns[turnIdx] || { opts: turn.opts, correctIdx: turn.answer };
  const isCorrect = selected === shuffled.correctIdx;

  return (
    <div className="scr-wrap">
      {H("💬 " + scenario.title, scenario.subtitle)}
      <Bar v={turnIdx + 1} mx={totalTurns} h={6} color="#0e7490" />

      <div style={{marginTop:16,marginBottom:8,fontSize:12,fontWeight:700,color:"var(--subtext)"}}>
        Turn {turnIdx + 1} of {totalTurns}
      </div>

      {/* Mode toggle */}
      <div style={{display:'flex', gap:8, marginBottom:16}}>
        <button
          onClick={() => { setAiMode(false); setAiHistory([]); setAiInput(''); setAiTurns(0); setAiDone(false); setAiCoaching(null); }}
          style={{
            flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
            background: !aiMode ? '#0e7490' : 'var(--card)',
            color: !aiMode ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif",
          }}
        >📋 Guided Practice</button>
        <button
          onClick={() => { setAiMode(true); setAiHistory([]); setAiInput(''); setAiTurns(0); setAiDone(false); setAiCoaching(null); }}
          style={{
            flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
            background: aiMode ? '#7c3aed' : 'var(--card)',
            color: aiMode ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif",
          }}
        >✨ AI Conversation</button>
      </div>

      {aiMode ? (
        /* ── AI CONVERSATION MODE ── */
        <div>
          {/* Character intro */}
          {aiHistory.length === 0 && (
            <div style={{
              background:'var(--card)', border:'1.5px solid var(--card-b)',
              borderRadius:14, padding:'14px 16px', marginBottom:16, textAlign:'center',
            }}>
              <div style={{fontSize:13, color:'var(--subtext)', marginBottom:6}}>
                You're now in a free conversation with
              </div>
              <div style={{fontSize:15, fontWeight:800, color:'var(--heading)'}}>
                {scenario.turns[0]?.speaker || 'Your conversation partner'}
              </div>
              <div style={{fontSize:12, color:'var(--subtext)', marginTop:4}}>
                Type anything in Croatian — they'll respond naturally. Don't worry about mistakes!
              </div>
            </div>
          )}

          {/* Conversation history */}
          <div style={{marginBottom:12}}>
            {aiHistory.map((msg, i) => (
              <div key={i} style={{
                display:'flex', flexDirection: msg.role==='user' ? 'row-reverse' : 'row',
                gap:8, marginBottom:10, alignItems:'flex-end',
              }}>
                {msg.role==='assistant' && <DialogueAvatar scenarioId={scenario.id} />}
                <div style={{
                  maxWidth:'80%',
                  background: msg.role==='user' ? '#0e7490' : 'var(--card)',
                  color: msg.role==='user' ? '#fff' : 'var(--heading)',
                  border: msg.role==='assistant' ? '1.5px solid var(--card-b)' : 'none',
                  borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding:'10px 14px',
                  fontSize:14, fontWeight:500, lineHeight:1.5,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{display:'flex', gap:8, marginBottom:10, alignItems:'flex-end'}}>
                <DialogueAvatar scenarioId={scenario.id} />
                <div style={{
                  background:'var(--card)', border:'1.5px solid var(--card-b)',
                  borderRadius:'18px 18px 18px 4px', padding:'12px 16px',
                }}>
                  <div style={{display:'flex', gap:4}}>
                    {[0,0.2,0.4].map((d,i) => (
                      <div key={i} style={{
                        width:7, height:7, borderRadius:'50%',
                        background:'var(--subtext)', opacity:.5,
                        animation:`maja-dot 1.2s ease-in-out ${d}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coaching note */}
          {aiCoaching && (
            <div style={{
              background:'#fef3c7', border:'1.5px solid #fcd34d',
              borderRadius:10, padding:'8px 12px', marginBottom:10,
              fontSize:12, fontWeight:600, color:'#92400e',
            }}>
              💡 {aiCoaching}
            </div>
          )}

          {/* Error */}
          {aiError && (
            <div style={{fontSize:12, color:'#dc2626', marginBottom:8, padding:'8px 12px', background:'#fee2e2', borderRadius:8}}>
              {aiError}
            </div>
          )}

          {/* Input */}
          {!aiDone && (
            <>
              <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') sendAiMessage(); }}
                  disabled={aiLoading}
                  placeholder="Upiši na hrvatskom..."
                  style={{
                    flex:1, padding:'11px 14px', borderRadius:12,
                    border:'1.5px solid var(--card-b)', background:'var(--card)',
                    color:'var(--heading)', fontSize:14, fontWeight:500,
                    fontFamily:"'Outfit',sans-serif", outline:'none',
                    opacity: aiLoading ? .6 : 1,
                  }}
                />
                <button
                  onClick={sendAiMessage}
                  disabled={aiLoading || !aiInput.trim()}
                  style={{
                    background:'#7c3aed', border:'none', borderRadius:12,
                    padding:'11px 16px', color:'#fff', fontSize:16,
                    cursor: aiLoading || !aiInput.trim() ? 'default' : 'pointer',
                    opacity: aiLoading || !aiInput.trim() ? .5 : 1,
                  }}
                >→</button>
              </div>
              {aiTurns >= 4 && (
                <button
                  onClick={() => {
                    if (!finishFired.current) {
                      finishFired.current = true;
                      if (award) award(aiTurns * 5);
                    }
                    setAiDone(true);
                  }}
                  style={{
                    width:'100%', padding:'12px', borderRadius:12, border:'none',
                    background:'var(--card)', color:'var(--subtext)', fontWeight:700,
                    fontSize:13, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                    marginBottom:8,
                  }}
                >
                  Finish Conversation →
                </button>
              )}
            </>
          )}

          {/* AI results */}
          {aiDone && (
            <div style={{
              background:'var(--card)', border:'1.5px solid var(--card-b)',
              borderRadius:16, padding:'24px 20px', textAlign:'center',
            }}>
              <div style={{fontSize:40, marginBottom:8}}>🎉</div>
              <div style={{fontSize:18, fontWeight:900, color:'var(--heading)', marginBottom:4}}>
                Great conversation!
              </div>
              <div style={{fontSize:13, color:'var(--subtext)', marginBottom:16}}>
                {aiTurns} exchange{aiTurns !== 1 ? 's' : ''} · +{aiTurns * 5} XP earned
              </div>
              <button className="tc" onClick={goBack}
                style={{width:'100%', padding:'13px', fontWeight:800, fontSize:14, color:'var(--heading)'}}>
                ← Back to Scenarios
              </button>
            </div>
          )}

          {/* Back button when in ai mode */}
          {!aiDone && (
            <button onClick={goBack} style={{
              background:'none', border:'none', color:'var(--subtext)',
              fontSize:12, fontWeight:600, cursor:'pointer', padding:'8px 0',
              fontFamily:"'Outfit',sans-serif",
            }}>
              ← Back to scenarios
            </button>
          )}
        </div>
      ) : (
        /* ── EXISTING MCQ / FREE TEXT MODE ── */
        <div>
          {/* Speaker bubble */}
          <div style={{display:'flex', alignItems:'flex-start', gap:10, marginBottom:16}}>
            <DialogueAvatar scenarioId={scenario.id} />
            <div aria-live="polite" aria-atomic="true" style={{
              background:"var(--card)",
              borderRadius:"16px 16px 16px 4px",
              padding:"14px 16px",
              border:"1.5px solid var(--card-b)",
              flex:1,
            }}>
              <div style={{fontSize:11,fontWeight:800,color:"#0e7490",marginBottom:4}}>{turn.speaker}</div>
              <div style={{fontSize:16,fontWeight:600,color:"var(--heading)",lineHeight:1.5}}>{turn.line}</div>
              <div style={{fontSize:12,color:"var(--subtext)",marginTop:6,fontStyle:"italic"}}>{turn.en}</div>
            </div>
          </div>

          {/* Your turn label + free mode toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:"var(--subtext)"}}>
              Your response:
            </div>
            <button
              onClick={() => {
                if (!answered) {
                  setFreeMode(m => !m);
                  setFreeInput('');
                  setFreeResult(null);
                }
              }}
              style={{
                background: freeMode ? "#7c3aed" : "var(--bar-bg)",
                border: "none",
                borderRadius:20,
                padding:"4px 10px",
                fontSize:11,
                fontWeight:700,
                color: freeMode ? "#fff" : "var(--subtext)",
                cursor: answered ? "default" : "pointer",
                fontFamily:"'Outfit',sans-serif",
                transition:"all 0.15s ease",
              }}
            >
              💬 Slobodan odgovor
            </button>
          </div>

          {freeMode ? (
            /* Free response input */
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",gap:8}}>
                <input
                  type="text"
                  value={freeInput}
                  onChange={e => setFreeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFreeSubmit(); }}
                  disabled={answered}
                  placeholder="Upiši svoj odgovor..."
                  style={{
                    flex:1,
                    padding:"11px 14px",
                    borderRadius:12,
                    border:"1.5px solid var(--card-b)",
                    background:"var(--card)",
                    color:"var(--heading)",
                    fontSize:14,
                    fontWeight:600,
                    fontFamily:"'Outfit',sans-serif",
                    outline:"none",
                  }}
                />
                <button
                  onClick={handleFreeSubmit}
                  disabled={answered || !freeInput.trim()}
                  style={{
                    background:"#0e7490",
                    border:"none",
                    borderRadius:12,
                    padding:"11px 16px",
                    color:"#fff",
                    fontSize:13,
                    fontWeight:800,
                    cursor: answered || !freeInput.trim() ? "default" : "pointer",
                    fontFamily:"'Outfit',sans-serif",
                    opacity: answered || !freeInput.trim() ? 0.5 : 1,
                    transition:"opacity 0.15s ease",
                  }}
                >
                  Provjeri
                </button>
              </div>

              {/* Free mode feedback */}
              {answered && freeResult && (
                <div role="alert" aria-live="assertive" style={{
                  background: freeResult.matched ? "#dcfce7" : "#fef3c7",
                  border: `1.5px solid ${freeResult.matched ? "#86efac" : "#fcd34d"}`,
                  borderRadius:12,
                  padding:"12px 14px",
                  marginTop:12,
                  marginBottom:4,
                }}>
                  <div style={{
                    fontSize:13,
                    fontWeight:800,
                    color: freeResult.matched ? "#166534" : "#92400e",
                    marginBottom:6,
                  }}>
                    {freeResult.matched ? "✅ Točno!" : "💡 Tvoj odgovor vs naš prijedlog:"}
                  </div>
                  {!freeResult.matched && (
                    <div style={{
                      fontSize:13,
                      color:"#78350f",
                      marginBottom:6,
                      lineHeight:1.5,
                    }}>
                      <span style={{fontWeight:700}}>Tvoj:</span> {freeResult.input}
                      <br />
                      <span style={{fontWeight:700}}>Prijedlog:</span> {freeResult.correct}
                    </div>
                  )}
                  <div style={{fontSize:13,color: freeResult.matched ? "#15803d" : "#78350f",lineHeight:1.5}}>
                    {turn.tip}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Multiple choice options — rendered from shuffled order */
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {shuffled.opts.map((opt, i) => {
                let bg = "var(--card)";
                let border = "1.5px solid var(--card-b)";
                let color = "var(--heading)";

                if (answered) {
                  if (i === shuffled.correctIdx) {
                    bg = "#dcfce7";
                    border = "1.5px solid #86efac";
                    color = "#166534";
                  } else if (i === selected && i !== shuffled.correctIdx) {
                    bg = "#fee2e2";
                    border = "1.5px solid #fca5a5";
                    color = "#991b1b";
                  } else {
                    bg = "var(--card)";
                    color = "var(--subtext)";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    style={{
                      background:bg,
                      border,
                      borderRadius:12,
                      padding:"12px 14px",
                      textAlign:"left",
                      fontSize:14,
                      fontWeight:600,
                      color,
                      cursor: answered ? "default" : "pointer",
                      transition:"all 0.15s ease",
                      fontFamily:"'Outfit',sans-serif",
                      lineHeight:1.4,
                    }}
                  >
                    <span style={{
                      display:"inline-block",
                      width:22,
                      height:22,
                      borderRadius:"50%",
                      background: answered && i === shuffled.correctIdx ? "#86efac"
                        : answered && i === selected && i !== shuffled.correctIdx ? "#fca5a5"
                        : "var(--bar-bg)",
                      color: answered && (i === shuffled.correctIdx || (i === selected && i !== shuffled.correctIdx)) ? "#fff" : "var(--subtext)",
                      fontSize:11,
                      fontWeight:800,
                      textAlign:"center",
                      lineHeight:"22px",
                      marginRight:10,
                      flexShrink:0,
                      verticalAlign:"middle",
                    }}>
                      {answered && i === shuffled.correctIdx ? "✓" : answered && i === selected && i !== shuffled.correctIdx ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback tip (multiple choice mode only — free mode has its own inline feedback) */}
          {answered && !freeMode && (
            <div role="alert" aria-live="assertive" style={{
              background: isCorrect ? "#dcfce7" : "#fef3c7",
              border: `1.5px solid ${isCorrect ? "#86efac" : "#fcd34d"}`,
              borderRadius:12,
              padding:"12px 14px",
              marginBottom:16,
            }}>
              <div style={{
                fontSize:13,
                fontWeight:800,
                color: isCorrect ? "#166534" : "#92400e",
                marginBottom:4,
              }}>
                {isCorrect ? "✅ Correct!" : "💡 Better choice:"}
              </div>
              <div style={{fontSize:13,color: isCorrect ? "#15803d" : "#78350f",lineHeight:1.5}}>
                {turn.tip}
              </div>
            </div>
          )}

          {/* Continue button */}
          {answered && (
            <button
              className="tc"
              onClick={handleContinue}
              style={{
                width:"100%",
                padding:"14px",
                fontWeight:800,
                fontSize:15,
                color:"var(--heading)",
              }}
            >
              {turnIdx + 1 >= totalTurns ? "See Results →" : "Next Turn →"}
            </button>
          )}

          {/* Back link */}
          <button
            onClick={goBack}
            style={{
              background:"none",
              border:"none",
              color:"var(--subtext)",
              fontSize:12,
              fontWeight:600,
              cursor:"pointer",
              padding:"8px 0",
              marginTop:4,
              fontFamily:"'Outfit',sans-serif",
            }}
          >
            ← Back to scenarios
          </button>
        </div>
      )}
    </div>
  );
}
