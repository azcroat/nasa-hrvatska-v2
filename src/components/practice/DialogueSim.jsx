import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data.jsx';

import { rnd } from '../../lib/random.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}

const SCENARIOS = [
  {
    id:"cafe",
    title:"☕ At the Café",
    subtitle:"Order drinks and pay the bill",
    turns:[
      { speaker:"Konobar", line:"Dobar dan! Što ćete naručiti?", en:"Good day! What would you like to order?",
        opts:["Mogu li dobiti kavu, molim?","Ja hoću kava.","Daj mi kavu.","Kava!"],
        answer:0, tip:"'Mogu li dobiti...' is the polite way to order. 'Ja hoću...' is too direct/childlike." },
      { speaker:"Konobar", line:"S mlijekom ili bez?", en:"With milk or without?",
        opts:["S mlijekom, hvala.","Ja hoću s mlijekom.","Mlijeko da.","Sa mlijekom."],
        answer:0, tip:"'S mlijekom' (with milk) is correct. Note: 's' before consonants, 'sa' before consonant clusters." },
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
    turns:[
      { speaker:"Doktor", line:"Dobar dan. Što vas muči?", en:"Good day. What's bothering you?",
        opts:["Boli me grlo i imam temperaturu.","Ja imam bolestan.","Moj grlo boli.","Temperatura."],
        answer:0, tip:"'Boli me grlo' (my throat hurts, lit. 'it hurts me the throat') is the correct Croatian structure." },
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
    turns:[
      { speaker:"Stranger", line:"Bog! Jesi li ti novi u gradu?", en:"Hi! Are you new to the city?",
        opts:["Da, tek sam se doselio/doselila. Ja sam [ime].","Da, ja sam novi.","Da.","Novi sam."],
        answer:0, tip:"'Tek sam se doselio' (I just moved here) + introducing yourself is the natural full response." },
      { speaker:"Stranger", line:"Drago mi je! Ja sam Marko. Otkud si?", en:"Nice to meet you! I'm Marko. Where are you from?",
        opts:["Drago mi je, Marko! Ja sam iz Engleske, ali učim hrvatski.","Engleska.","Iz Engleske.","Ja sam Englez."],
        answer:0, tip:"Full response with their name + your origin + showing you're learning Croatian = great first impression!" },
      { speaker:"Marko", line:"Super! Kako ti ide s hrvatskim?", en:"Great! How's your Croatian going?",
        opts:["Polako, ali napradujem. Jezik mi je teži nego što sam mislio.","Dobro.","Teško.","Ok, teško."],
        answer:0, tip:"'Polako, ali napradujem' (slowly but I'm progressing) is honest and shows effort. Locals love this." },
      { speaker:"Marko", line:"Ha! Svima nam je bio težak. Hoćeš još piće?", en:"Ha! It was hard for all of us. Do you want another drink?",
        opts:["Rado! Hvala puno, Marko.","Da.","Hoću.","Ok."],
        answer:0, tip:"'Rado!' (gladly/with pleasure) is a warm enthusiastic yes — much better than just 'da'." },
    ]
  },
  {
    id:"transport",
    title:"🚌 Public Transport",
    subtitle:"Buy a ticket and find your platform",
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
        opts:["Hvala lijepa! Imate li neku kafu dok čekam?","Hvala.","Ok.","Razumijem."],
        answer:0, tip:"Option 0 is humorous but natural — shows confidence. All options are grammatically acceptable here." },
    ]
  },
  {
    id:"emergency",
    title:"🚨 Emergency",
    subtitle:"Handle an urgent situation in Croatian",
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
    turns:[
      { speaker:"Recepcionista", line:"Dobar večer, restoran 'Dubrovnik', izvolite.", en:"Good evening, restaurant 'Dubrovnik', how can I help?",
        opts:["Dobar večer. Htjela bih rezervirati stol za dvoje za petak navečer.","Rezervacija.","Htjeti stol.","Stol za dvoje."],
        answer:0, tip:"'Htjela bih' (I would like — conditional, feminine) is perfectly polite. Include all details upfront." },
      { speaker:"Recepcionista", line:"Za koliko sati?", en:"For what time?",
        opts:["Za osam sati navečer, ako je moguće.","Osam sati.","20:00.","Osam."],
        answer:0, tip:"'Ako je moguće' (if possible) is a polite hedge — shows you're flexible. Natural Croatian." },
      { speaker:"Recepcionista", line:"Savršeno. Ime i prezime?", en:"Perfect. Name and surname?",
        opts:["[Vaše ime i prezime], molim.","Moje ime je...","Ja sam...","[Ime]."],
        answer:0, tip:"In Croatian, you'd state your full name naturally. The polite 'molim' closing is good form." },
      { speaker:"Konobar (at restaurant)", line:"Što preporučujete?", en:"What do you recommend?",
        opts:["Što biste Vi preporučili — riba ili meso?","Riba.","Što je dobro?","Preporučite nešto."],
        answer:0, tip:"Turning the question back — 'što BISTE Vi preporučili' (what would YOU recommend) — is elegant and social." },
      { speaker:"Konobar", line:"Naša riba je danas posebno svježa. Dorade imate od lokalne flote.", en:"Our fish is especially fresh today. The sea bream is from the local fleet.",
        opts:["Zvuči odlično! Uzet ću dorade s povrćem.","Ok.","Da.","Dorade."],
        answer:0, tip:"'Zvuči odlično' (sounds excellent) + complete order = perfect response. Shows comprehension and decision." },
    ]
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
  const finishFired = useRef(false);
  const [scenario, setScenario] = useState(null);
  const [turnIdx, setTurnIdx] = useState(0);
  // shuffledTurns: array of { opts, correctIdx } parallel to scenario.turns
  const [shuffledTurns, setShuffledTurns] = useState([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [done, setDone] = useState(false);

  function startScenario(s) {
    finishFired.current = false;
    setScenario(s);
    setShuffledTurns(s.turns.map(shuffleTurnOpts));
    setTurnIdx(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setDone(false);
  }

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === shuffledTurns[turnIdx].correctIdx) {
      setScore(sc => sc + 1);
    }
  }

  function handleContinue() {
    const nextIdx = turnIdx + 1;
    if (nextIdx >= scenario.turns.length) {
      if (!finishFired.current) {
        finishFired.current = true;
        if (award) award((score + (selected === shuffledTurns[turnIdx].correctIdx ? 1 : 0)) * 6);
      }
      setDone(true);
    } else {
      setTurnIdx(nextIdx);
      setAnswered(false);
      setSelected(-1);
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
  }

  // --- MENU SCREEN ---
  if (!scenario) {
    return (
      <div className="scr-wrap">
        {H("💬 Dialogue Simulator", "Real conversations, real Croatian")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {SCENARIOS.map(s => (
            <button key={s.id} className="tc" onClick={() => startScenario(s)}
              style={{textAlign:"left",padding:"14px"}}>
              <div style={{fontSize:24,marginBottom:6}}>{s.title.split(' ')[0]}</div>
              <div style={{fontSize:13,fontWeight:800,color:"var(--heading)",lineHeight:1.3}}>{s.title.slice(2)}</div>
              <div style={{fontSize:11,color:"var(--subtext)",marginTop:4}}>{s.subtitle}</div>
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

      {/* Speaker bubble */}
      <div style={{
        background:"var(--card)",
        borderRadius:"16px 16px 16px 4px",
        padding:"14px 16px",
        marginBottom:16,
        border:"1.5px solid var(--card-b)",
        maxWidth:"85%",
      }}>
        <div style={{fontSize:11,fontWeight:800,color:"#0e7490",marginBottom:4}}>{turn.speaker}</div>
        <div style={{fontSize:16,fontWeight:600,color:"var(--heading)",lineHeight:1.5}}>{turn.line}</div>
        <div style={{fontSize:12,color:"var(--subtext)",marginTop:6,fontStyle:"italic"}}>{turn.en}</div>
      </div>

      {/* Your turn label */}
      <div style={{fontSize:12,fontWeight:800,color:"var(--subtext)",marginBottom:10,textAlign:"right"}}>
        Your response:
      </div>

      {/* Options — rendered from shuffled order */}
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

      {/* Feedback tip */}
      {answered && (
        <div style={{
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
  );
}
