import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';

import { rnd } from '../../lib/random.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}

const DATA = [
  { sentence:"Dao ___ ga je.", opts:["mu ga je","ga mu je","je ga mu","mu je ga"], answer:"mu ga je", en:"He gave it to him.", tip:"Clitic order: dative (mu) → accusative (ga) → auxiliary (je)" },
  { sentence:"Rekao sam ___ istinu.", opts:["mu","ga","je","se"], answer:"mu", en:"I told him the truth.", tip:"'Reći' takes dative — 'mu' = to him" },
  { sentence:"Pisala ___ je pismo.", opts:["mu","ga","se","mi"], answer:"mu", en:"She wrote him a letter.", tip:"Dative 'mu' — writing to someone uses dative" },
  { sentence:"Nije ___ svidjelo.", opts:["mi se","se mi","me si","mi je"], answer:"mi se", en:"I didn't like it. (It didn't please me.)", tip:"'Svidjeti se' uses dative: 'mi' (to me) + reflexive 'se'" },
  { sentence:"Kupila ___ ga je.", opts:["mu","joj","im","nam"], answer:"mu", en:"She bought it for him.", tip:"Dative 'mu' — she bought it for him" },
  { sentence:"Vidio ___ jutros.", opts:["sam ga","ga sam","se ga","ga je"], answer:"sam ga", en:"I saw him this morning.", tip:"Auxiliary 'sam' goes before accusative 'ga' in clitic order" },
  { sentence:"Pričala ___ o tome.", opts:["mi se","se mi","mi je","je mi"], answer:"mi je", en:"She told me about it.", tip:"Dative 'mi' comes before auxiliary 'je'" },
  { sentence:"On ___ se smiješi.", opts:["mu","joj","im","ga"], answer:"joj", en:"He smiles at her.", tip:"Dative 'joj' (to her) + reflexive 'se' — smiling at someone uses dative" },
  { sentence:"Uzeli su ___ novac.", opts:["im","mu","mi","nam"], answer:"im", en:"They took the money from them.", tip:"Dative 'im' (from/for them) — 'uzeti + dative of interest' expresses taking from someone's possession" },
  { sentence:"Zašto ___ ne javlja?", opts:["se ti","ti se","se","te"], answer:"ti se", en:"Why doesn't she call you?", tip:"Dative 'ti' (to you) + reflexive 'se' — javiti se uses reflexive" },
  { sentence:"Mama ___ kupila tortu.", opts:["mi je","je mi","mi se","se mi"], answer:"mi je", en:"Mom bought me a cake.", tip:"Dative 'mi' (for me) → auxiliary 'je'" },
  { sentence:"Poslali ___ pismo.", opts:["su nam","nam su","smo im","im smo"], answer:"su nam", en:"They sent us a letter.", tip:"Auxiliary 'su' then dative 'nam' (to us)" },
  { sentence:"Dala ___ ga je.", opts:["mu","joj","mi","nam"], answer:"mu", en:"She gave it to him.", tip:"Dative 'mu' — gave to him" },
  { sentence:"Nije ___ to rekla.", opts:["mi","me","meni","ja"], answer:"mi", en:"She didn't tell me that.", tip:"Short dative 'mi' used as clitic, not the long form 'meni'" },
  { sentence:"Sviđa ___ ovaj grad.", opts:["mi se","se mi","me se","me si"], answer:"mi se", en:"I like this city.", tip:"'Sviđati se' pattern: dative pronoun + se. 'Mi se sviđa' = to me it pleases" },
  { sentence:"Javite ___ kad stignete!", opts:["nam se","se nam","mi se","se mi"], answer:"nam se", en:"Call us when you arrive!", tip:"Dative 'nam' (to us) + reflexive 'se' in 'javiti se'" },
  { sentence:"On ___ vratio novac.", opts:["mi je","je mi","mi","me"], answer:"mi je", en:"He returned the money to me.", tip:"Dative 'mi' (to me) + auxiliary 'je'" },
  { sentence:"Zahvalila ___ se lijepo.", opts:["mu","ga","ga mu","mu ga"], answer:"mu", en:"She thanked him nicely.", tip:"'Zahvaliti se' + dative: 'zahvaliti se nekome' = to thank someone" },
  { sentence:"Daj ___ to!", opts:["mi","me","meni","mojem"], answer:"mi", en:"Give it to me!", tip:"Imperative with dative clitic 'mi' — give to me" },
  { sentence:"Nosila ___ je cvijeće.", opts:["joj","ju","je","nju"], answer:"joj", en:"She brought her flowers.", tip:"Dative 'joj' (to her) — bringing something to someone uses dative" },
  { sentence:"Sjeća ___ svega.", opts:["se","si","ga","je"], answer:"se", en:"He remembers everything.", tip:"Reflexive 'se' with 'sjećati se' (to remember) — always attached directly after the verb form" },
  { sentence:"Pitali ___ za pravac.", opts:["su nas","nas su","smo ih","ih smo"], answer:"su nas", en:"They asked us for directions.", tip:"Auxiliary 'su' then accusative 'nas' (us)" },
];

export default function CliticDrill({ goBack, award }) {
  const { stats, setStats, writeDelta } = useStats();
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
      if (!finishFired.current) { finishFired.current = true; if (award) award(score * 5); markQuest('grammar'); if (!stats.vs?.includes('clitic')) { setStats(prev => { if (prev.vs?.includes('clitic')) return prev; return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'clitic'] }; }); if (writeDelta) writeDelta({ gc: 1, vs: ['clitic'] }); } }
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H("🔗 Clitic Drill", "Master the hardest rule in Croatian", goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{score} / {total}</div>
          <div style={{ fontSize: 15, color: "#64748b", marginBottom: 16 }}>
            {score === total ? "Perfect! Clitic master! 🏆" : score >= total * 0.8 ? "Great work! 💪" : "Keep practising — clitics take time!"}
          </div>
          <button className="b bp" style={{ width: "100%" }} onClick={goBack}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H("🔗 Clitic Drill", "Master the hardest rule in Croatian", goBack)}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>{idx + 1} / {total}</span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Fill the blank</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0e7490", lineHeight: 1.4 }}>{cur.sentence}</div>
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
