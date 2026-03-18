import React, { useState } from 'react';
import { H, Bar } from '../../data.jsx';

function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;} // NOSONAR - Math.random() is acceptable for quiz/game shuffling

const DATA = [
  { q:"'To read' in Croatian:", opts:["čitati","ćitati","šitati","žitati"], answer:"čitati", en:"čitati = to read", tip:"Č is harder (like 'ch' in 'church'). 'Čitati' — the č makes a hard ch sound" },
  { q:"'Human' in Croatian:", opts:["čovjek","ćovjek","čovjek","đovjek"], answer:"čovjek", en:"čovjek = human/person", tip:"Č in čovjek: hard 'ch'. Never ć (soft) at the start here" },
  { q:"'Uncle' in Croatian:", opts:["stric","striċ","strić","stries"], answer:"stric", en:"stric = (paternal) uncle", tip:"'Stric' ends in c (like 'ts'). Compare: striček (affectionate form)" },
  { q:"'Begin' in Croatian:", opts:["početi","početi","početi","poćeti"], answer:"početi", en:"početi = to begin", tip:"'Početi' has č (hard). The ć (soft) would make a different, incorrect word" },
  { q:"'Girl' in Croatian:", opts:["djevojčica","djevojćica","đevojčica","djevojčića"], answer:"djevojčica", en:"djevojčica = little girl", tip:"The diminutive suffix -čica uses hard č" },
  { q:"'Uncle/Sir' (informal) in Croatian:", opts:["ujak","ćutak","ujak","ûjak"], answer:"ujak", en:"ujak = maternal uncle", tip:"'Ujak' — maternal uncle (different from 'stric' = paternal uncle)" },
  { q:"Which spells 'to want'?", opts:["htjeti","ćtjeti","htjeti","htjéti"], answer:"htjeti", en:"htjeti = to want/will", tip:"'Htjeti' — the h is silent in many forms. 'Hoću' = I want/will" },
  { q:"'Bridge' in Croatian:", opts:["most","mošt","mozt","most"], answer:"most", en:"most = bridge", tip:"'Most' — simple word. Compare: 'moštanica' (a type of grape brandy area)" },
  { q:"'Key' in Croatian:", opts:["ključ","ćluč","ključ","ključ"], answer:"ključ", en:"ključ = key", tip:"'Ključ' ends in č (hard). The lj is a single soft sound like 'lj' fused" },
  { q:"'Čokolada' or 'Ćokolada' — which is 'chocolate'?", opts:["Čokolada","Ćokolada","Šokolada","Džokolada"], answer:"Čokolada", en:"Čokolada = chocolate", tip:"Hard č at start of čokolada — borrowed from Italian 'cioccolata'" },
  { q:"'Grandfather' in Croatian:", opts:["djed","djet","đed","djed"], answer:"djed", en:"djed = grandfather", tip:"'Djed' — dj is two separate letters here (d+j), not a single phoneme like đ" },
  { q:"'Gentleman/Sir' in Croatian:", opts:["gospodin","gozpodin","gospođin","gospodin"], answer:"gospodin", en:"gospodin = Mr/gentleman", tip:"'Gospodin' — note 'gospođa' (Mrs) uses đ (soft)" },
  { q:"'Mrs/Madam' in Croatian:", opts:["gospođa","gospoda","gospoda","gospóđa"], answer:"gospođa", en:"gospođa = Mrs/Madam", tip:"'Gospođa' uses đ (soft d). 'Gospodin' (Mr) uses d" },
  { q:"'Yellow' in Croatian:", opts:["žut","šut","zut","žût"], answer:"žut", en:"žut = yellow", tip:"'Žut' — ž is like the French 'j' in 'bonjour' or 's' in 'measure'" },
  { q:"'Forest' in Croatian:", opts:["šuma","žuma","suma","šûma"], answer:"šuma", en:"šuma = forest", tip:"'Šuma' — š is like English 'sh'. Very common word!" },
  { q:"'Bread' in Croatian:", opts:["kruh","krûh","kruš","kruž"], answer:"kruh", en:"kruh = bread", tip:"'Kruh' ends in h (a breathy sound). Essential survival vocabulary!" },
  { q:"'Night' in Croatian:", opts:["noć","noc","noč","noc"], answer:"noć", en:"noć = night", tip:"'Noć' ends in ć (soft ch). 'Laku noć' = Good night" },
  { q:"'Star' in Croatian:", opts:["zvijezda","zvjezda","zviezda","zvijezda"], answer:"zvijezda", en:"zvijezda = star", tip:"Standard Croatian: 'zvijezda' (Ijekavian — ije). Ekavian dialects say 'zvezda'" },
  { q:"'Snow' in Croatian:", opts:["snijeg","sneg","snjeg","sniég"], answer:"snijeg", en:"snijeg = snow", tip:"Standard Croatian: 'snijeg' (Ijekavian — ije). One of the most important ije/e distinctions" },
  { q:"'Love' (noun) in Croatian:", opts:["ljubav","ljubav","ljübav","ljūbav"], answer:"ljubav", en:"ljubav = love", tip:"'Ljubav' — lj is a soft fused sound. The -av ending makes it feminine noun" },
  { q:"'Canyon/gorge' in Croatian:", opts:["klisura","kljisura","ćlisura","čisura"], answer:"klisura", en:"klisura = gorge/canyon", tip:"'Klisura' — kl cluster, no special letters here" },
  { q:"'Soft' in Croatian:", opts:["mek","meć","meč","meš"], answer:"mek", en:"mek = soft (masc adj)", tip:"'Mek' — basic adjective. Feminine: 'meka', neuter: 'meko'" },
  { q:"'Knife' in Croatian:", opts:["nož","noč","noc","noć"], answer:"nož", en:"nož = knife", tip:"'Nož' ends in ž. Not to be confused with 'noć' (night) which ends in ć" },
  { q:"'Warm' in Croatian:", opts:["topao","tôpao","topau","topla"], answer:"topao", en:"topao = warm (masc adj)", tip:"'Topao' — masc. Feminine is 'topla' (not topla-a)" },
  { q:"'Enough' in Croatian:", opts:["dosta","dôsta","dosta","doška"], answer:"dosta", en:"dosta = enough", tip:"'Dosta' — essential word. 'To je dosta' = That's enough" },
];

export default function PronunciationContrast({ goBack, award }) {
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
        {H("🔤 Sound Contrast", "Master č/ć, š/ž, đ/dž and more")}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{score >= total * 0.8 ? "🏆" : "📚"}</div>
          <h2>{score} / {total}</h2>
          <button className="b bp" onClick={() => { award(score * 5); goBack(); }} style={{width:"100%",marginTop:16}}>🏠 Done</button>
        </div>
      </div>
    );
  }

  const q = qs[idx];

  return (
    <div className="scr-wrap">
      {H("🔤 Sound Contrast", "Master č/ć, š/ž, đ/dž and more")}
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>{idx + 1} / {total}</span>
        <span style={{color:"#0e7490",fontWeight:700}}>Score: {score}</span>
      </div>
      <Bar v={idx + 1} mx={total} />
      <div className="c" style={{marginTop:16}}>
        <div style={{fontSize:18,fontWeight:600}}>{q.q}</div>
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
          <div style={{fontSize:12,fontWeight:800,color:"#0369a1",marginBottom:4}}>📢 Pronunciation Guide</div>
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
