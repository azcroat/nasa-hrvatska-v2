import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data.jsx';

import { rnd } from '../../lib/random.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}

const DATA = [
  { q:"___ auto (2)", opts:["dva auta","dva auto","dva auti","dva automobila"], answer:"dva auta", en:"2 cars", tip:"2/3/4 + Genitive singular: 'auto' → 'auta'" },
  { q:"___ kuća (5)", opts:["pet kuća","pet kući","pet kuće","pet kuće"], answer:"pet kuća", en:"5 houses", tip:"5+ requires Genitive plural: 'kuća' (the genitive plural of 'kuća')" },
  { q:"___ dijete (3)", opts:["tri djece","tri djeteta","tri djeci","tri dijete"], answer:"tri djeteta", en:"3 children", tip:"3 + Genitive singular of 'dijete' = 'djeteta' (irregular noun)" },
  { q:"___ žena (1)", opts:["jedna žena","jedan žena","jedna žene","jedno žena"], answer:"jedna žena", en:"1 woman", tip:"1 uses Nominative singular. 'žena' is feminine → 'jedna'" },
  { q:"___ knjiga (11)", opts:["jedanaest knjiga","jedanaest knjige","jedanaest knjizi","jedanaest knjigā"], answer:"jedanaest knjiga", en:"11 books", tip:"11-19 ALWAYS use Genitive plural, regardless of the -1 rule" },
  { q:"___ pas (4)", opts:["četiri psa","četiri psi","četiri pas","četiri pasa"], answer:"četiri psa", en:"4 dogs", tip:"4 + Genitive singular: 'pas' → 'psa'" },
  { q:"___ sat (21)", opts:["dvadeset i jedan sat","dvadeset i jedan sata","dvadeset i jednog sata","dvadeset i jedna sata"], answer:"dvadeset i jedan sat", en:"21 hours", tip:"21 follows the rule for 1: Nominative singular" },
  { q:"___ mačka (6)", opts:["šest mačaka","šest mačke","šest mački","šest mačaka"], answer:"šest mačaka", en:"6 cats", tip:"6+ Genitive plural: 'mačka' → 'mačaka'" },
  { q:"___ student (2)", opts:["dva studenta","dva studenti","dva studenata","dva student"], answer:"dva studenta", en:"2 students", tip:"2/3/4 + Genitive singular: 'student' → 'studenta'" },
  { q:"___ grad (100)", opts:["sto gradova","sto grad","sto grada","sto gradu"], answer:"sto gradova", en:"100 cities", tip:"100 = Genitive plural: 'grad' → 'gradova'" },
  { q:"___ djevojka (3)", opts:["tri djevojke","tri djevojaka","tri djevojka","tri djevojki"], answer:"tri djevojke", en:"3 girls", tip:"3 + Genitive singular: 'djevojka' → 'djevojke'" },
  { q:"___ brat (12)", opts:["dvanaest braće","dvanaest brata","dvanaest brati","dvanaest bratova"], answer:"dvanaest braće", en:"12 brothers", tip:"12 = Genitive plural. 'brat' has irregular plural root 'braća' → gen pl 'braće'" },
  { q:"___ prozor (5)", opts:["pet prozora","pet prozore","pet prozori","pet prozoru"], answer:"pet prozora", en:"5 windows", tip:"5+ Genitive plural: 'prozor' → 'prozora'" },
  { q:"___ dijete (21)", opts:["dvadeset i jedno dijete","dvadeset i jedan dijete","dvadeset i jedna dijete","dvadeset i jedno djeteta"], answer:"dvadeset i jedno dijete", en:"21 children", tip:"21 = Nominative singular. 'dijete' is neuter → 'jedno dijete'" },
  { q:"___ kava (2)", opts:["dvije kave","dva kave","dvije kava","dva kava"], answer:"dvije kave", en:"2 coffees", tip:"2/3/4 for feminine nouns uses 'dvije/tri/četiri'. 'kava' → 'kave' (gen sg)" },
  { q:"___ stan (7)", opts:["sedam stanova","sedam stana","sedam stani","sedam stan"], answer:"sedam stanova", en:"7 apartments", tip:"7+ Genitive plural: 'stan' → 'stanova'" },
  { q:"___ sat (2)", opts:["dva sata","dva sat","dvije sata","dva sati"], answer:"dva sata", en:"2 hours", tip:"2 + Genitive singular: 'sat' → 'sata'" },
  { q:"___ čovjek (5)", opts:["pet ljudi","pet čovjeka","pet čovjeci","pet čovjekā"], answer:"pet ljudi", en:"5 people", tip:"'čovjek' has suppletive plural 'ljudi' — gen pl is 'ljudi'" },
  { q:"___ automobil (4)", opts:["četiri automobila","četiri automobile","četiri automobili","četiri automobila"], answer:"četiri automobila", en:"4 cars", tip:"4 + Genitive singular: 'automobil' → 'automobila'" },
  { q:"___ zemlja (13)", opts:["trinaest zemalja","trinaest zemlja","trinaest zemlje","trinaest zemljama"], answer:"trinaest zemalja", en:"13 countries", tip:"13 = Genitive plural. 'zemlja' → gen pl 'zemalja'" },
  { q:"___ dijete (4)", opts:["četiri djeteta","četiri djece","četiri djetetu","četiri dijete"], answer:"četiri djeteta", en:"4 children", tip:"4 + Genitive singular: 'dijete' → 'djeteta'" },
  { q:"___ prijatelj (22)", opts:["dvadeset i dva prijatelja","dvadeset i dva prijatelja","dvadeset i dva prijatelji","dvadeset i dva prijatelju"], answer:"dvadeset i dva prijatelja", en:"22 friends", tip:"22 = follows rule for 2: Genitive singular 'prijatelja'" },
  { q:"___ muškarac (3)", opts:["tri muškarca","tri muškaraca","tri muškarci","tri muškarac"], answer:"tri muškarca", en:"3 men", tip:"3 + Genitive singular: 'muškarac' → 'muškarca'" },
  { q:"___ godina (30)", opts:["trideset godina","trideset godine","trideset godini","trideset godinu"], answer:"trideset godina", en:"30 years", tip:"30 = Genitive plural: 'godina' → 'godina' (same form, zero plural)" },
];

export default function NumbersCasesDrill({ goBack, award }) {
  const finishFired = useRef(false);
  const [q] = useState(() => shLocal(DATA));
  const total = q.length;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const cur = q[idx];
  const answered = chosen !== null;

  function pick(opt) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) setScore(s => s + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      if (!finishFired.current) { finishFired.current = true; if (award) award(score * 5); }
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H("🔢 Numbers + Cases", "The rule every learner must master", goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{score} / {total}</div>
          <div style={{ fontSize: 15, color: "#64748b", marginBottom: 16 }}>
            {score === total ? "Perfect! You nailed the number rules! 🏆" : score >= total * 0.8 ? "Really solid work! 💪" : "Numbers and cases take practice — keep going!"}
          </div>
          <button className="b bp" style={{ width: "100%" }} onClick={goBack}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H("🔢 Numbers + Cases", "The rule every learner must master", goBack)}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>{idx + 1} / {total}</span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Choose the correct form</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0e7490", lineHeight: 1.4 }}>{cur.q}</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{cur.en}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          {cur.opts.map(opt => {
            let bg = "white";
            let bc = "rgba(14,116,144,.12)";
            if (answered) {
              if (opt === cur.answer) { bg = "#dcfce7"; bc = "#16a34a"; }
              else if (opt === chosen) { bg = "#fee2e2"; bc = "#dc2626"; }
            }
            return (
              <button
                key={opt}
                className="ob"
                style={{ background: bg, borderColor: bc }}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd", fontSize: 14, color: "#0369a1" }}>
            <strong>{chosen === cur.answer ? "✅ Correct!" : "❌ Incorrect."}</strong> {cur.tip}
          </div>
        )}
        {answered && (
          <button className="b bp" style={{ width: "100%", marginTop: 16 }} onClick={next}>
            {idx + 1 >= total ? "See results" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
