import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data.jsx';

import { rnd } from '../../lib/random.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}

const DATA = [
  { root:"rad (work)", q:"She works in an office. → Ona ___ u uredu.", opts:["radi","rad","radnik","radnja"], answer:"radi", en:"She works in an office.", tip:"rad → raditi (verb: to work) → radi (3rd person sg present)" },
  { root:"liječ (heal)", q:"The ___ prescribed medicine. → ___ je propisao lijek.", opts:["liječnik","liječenje","liječiti","lijek"], answer:"liječnik", en:"The doctor prescribed medicine.", tip:"liječ → liječnik (doctor), liječiti (to treat), liječenje (treatment), lijek (medicine)" },
  { root:"učiti (learn)", q:"She is a ___. → Ona je ___.", opts:["učiteljica","učenje","učenik","učiti"], answer:"učiteljica", en:"She is a teacher.", tip:"učiti → učiteljica (female teacher), učenik (student), učenje (learning)" },
  { root:"pisati (write)", q:"The author is writing a ___. → Autor piše ___.", opts:["pismo","pisac","pisanje","pisaći"], answer:"pismo", en:"The author is writing a letter.", tip:"pisati → pismo (letter), pisac (writer), pisanje (writing), pisaći stol (desk)" },
  { root:"voziti (drive)", q:"The ___ drove the bus. → ___ je vozio autobus.", opts:["vozač","vožnja","vozilo","voziti"], answer:"vozač", en:"The driver drove the bus.", tip:"voziti → vozač (driver), vožnja (ride/driving), vozilo (vehicle)" },
  { root:"pjevati (sing)", q:"The ___ sang beautifully. → ___ je pjevala lijepo.", opts:["pjevačica","pjevanje","pjevati","pjesma"], answer:"pjevačica", en:"The singer sang beautifully.", tip:"pjevati → pjevačica (female singer), pjevanje (singing), pjesma (song)" },
  { root:"kupiti (buy)", q:"She went ___ . → Otišla je u ___.", opts:["kupovinu","kupac","kupovati","kupac"], answer:"kupovinu", en:"She went shopping.", tip:"kupiti → kupovina (shopping/purchase), kupac (buyer), kupovati (to be shopping)" },
  { root:"znati (know)", q:"His ___ is impressive. → Njegovo ___ je impresivno.", opts:["znanje","znalac","znati","znan"], answer:"znanje", en:"His knowledge is impressive.", tip:"znati → znanje (knowledge), znalac (expert/knowledgeable person)" },
  { root:"igrati (play)", q:"Children love ___. → Djeca vole ___.", opts:["igru","igrač","igračka","igrati"], answer:"igru", en:"Children love the game.", tip:"igrati → igra (game), igrač (player), igračka (toy)" },
  { root:"grad (city)", q:"He is a ___ of Zagreb. → On je ___ Zagreba.", opts:["građanin","gradan","gradski","gradnja"], answer:"građanin", en:"He is a citizen of Zagreb.", tip:"grad → građanin (citizen/inhabitant), gradski (urban/city-), gradnja (construction)" },
  { root:"ljubav (love)", q:"She is very ___. → Ona je jako ___.", opts:["ljubazna","ljubičasta","ljubiti","ljubav"], answer:"ljubazna", en:"She is very kind/polite.", tip:"ljubav → ljubazan/ljubazna (kind/polite) — the connection to 'love' survives!" },
  { root:"moć (power/ability)", q:"___ will be needed. → Bit će potrebna ___.", opts:["moćna","moguće","mogućnost","moći"], answer:"mogućnost", en:"Possibility/capability will be needed.", tip:"moć → moguć (possible), mogućnost (possibility), moćan (powerful)" },
  { root:"čist (clean)", q:"Please ___ the table. → Molim te ___ stol.", opts:["očisti","čistoća","čistač","čišćenje"], answer:"očisti", en:"Please clean the table.", tip:"čist → čistiti/očistiti (to clean), čistoća (cleanliness), čistač (cleaner)" },
  { root:"star (old)", q:"Respect for the ___. → Poštovanje prema ___ima.", opts:["starijima","stariji","starci","starinom"], answer:"starijima", en:"Respect for elders.", tip:"star → stariji (older/elder), starost (old age), starac (old man)" },
  { root:"brat (brother)", q:"They are ___. → Oni su ___.", opts:["braća","bratski","bratstvo","braću"], answer:"braća", en:"They are brothers.", tip:"brat → braća (brothers, collective noun), bratski (brotherly), bratstvo (brotherhood)" },
  { root:"sloboda (freedom)", q:"She has ___ time now. → Sada ima ___ vremena.", opts:["slobodnog","slobodan","slobodnjak","slobodi"], answer:"slobodnog", en:"She has free time now.", tip:"sloboda → slobodan (free), slobodnog (gen sg), slobodnjak (freelancer)" },
  { root:"zemlja (earth/land/country)", q:"He is a ___. → On je ___.", opts:["zemljoradnik","zemaljski","zemlja","zemljište"], answer:"zemljoradnik", en:"He is a farmer.", tip:"zemlja → zemljoradnik (farmer, lit. earth-worker), zemaljski (earthly), zemljište (land/plot)" },
  { root:"voda (water)", q:"The ___ cleaned the drain. → ___ je očistio odvod.", opts:["vodoinstalater","vodopad","vodeni","vodar"], answer:"vodoinstalater", en:"The plumber cleaned the drain.", tip:"voda → vodoinstalater (plumber, lit. water-installer), vodopad (waterfall)" },
  { root:"srce (heart)", q:"She spoke from the ___. → Govorila je iz ___.", opts:["srca","srčani","srčan","srdačnost"], answer:"srca", en:"She spoke from the heart.", tip:"srce → srca (gen sg), srčan (heartfelt/courageous), srdačnost (warmth/cordiality)" },
  { root:"knjiga (book)", q:"She works in a ___. → Radi u ___.", opts:["knjižnici","knjižara","knjižar","knjišar"], answer:"knjižnici", en:"She works in a library.", tip:"knjiga → knjižnica (library), knjižara (bookshop), knjižar (bookseller)" },
];

export default function WordFamilies({ goBack, award }) {
  const finishFired = useRef(false);
  const [qs] = useState(() => shLocal(DATA));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);

  const total = qs.length;

  if (!qs.length) return null;

  if (idx >= total) {
    return (
      <div className="scr-wrap">
        {H("🌱 Word Families", "Learn one root, understand a hundred words")}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{score >= total * 0.8 ? "🏆" : "📚"}</div>
          <h2>{score} / {total}</h2>
          <button className="b bp" onClick={() => { if(finishFired.current)return; finishFired.current=true; award(score * 5); goBack(); }} style={{width:"100%",marginTop:16}}>🏠 Done</button>
        </div>
      </div>
    );
  }

  const q = qs[idx];

  return (
    <div className="scr-wrap">
      {H("🌱 Word Families", "Learn one root, understand a hundred words")}
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>{idx + 1} / {total}</span>
        <span style={{color:"#0e7490",fontWeight:700}}>Score: {score}</span>
      </div>
      <Bar v={idx + 1} mx={total} />
      <div className="c" style={{marginTop:16}}>
        <div>
          <div style={{background:"#dbeafe",borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:8,fontSize:12,fontWeight:800,color:"#1d4ed8"}}>Root: {q.root}</div>
        </div>
        <div style={{fontSize:17,fontWeight:600}}>{q.q}</div>
        <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{q.en}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:16}}>
        {q.opts.map((o, oi) => (
          <button
            key={oi}
            className="ob"
            style={{
              textAlign:"center",
              background: answered ? (o === q.answer ? "#dcfce7" : selected === oi ? "#fee2e2" : "white") : "white",
              borderColor: answered ? (o === q.answer ? "#16a34a" : selected === oi ? "#dc2626" : "rgba(14,116,144,.12)") : "rgba(14,116,144,.12)"
            }}
            onClick={() => {
              if (!answered) {
                setSelected(oi);
                setAnswered(true);
                if (o === q.answer) setScore(score + 1);
              }
            }}>
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div style={{background:"#f0f9ff",borderRadius:12,padding:"12px 16px",marginTop:12,border:"1.5px solid #bae6fd"}}>
          <div style={{fontSize:12,fontWeight:800,color:"#0369a1",marginBottom:4}}>💡 Word Family</div>
          <div style={{fontSize:13,color:"#075985"}}>{q.tip}</div>
        </div>
      )}
      {answered && (
        <button
          className="b bp"
          style={{width:"100%",marginTop:16}}
          onClick={() => { setIdx(idx + 1); setAnswered(false); setSelected(-1); }}>
          Next →
        </button>
      )}
    </div>
  );
}
