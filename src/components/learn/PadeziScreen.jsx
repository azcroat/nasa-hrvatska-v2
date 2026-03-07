import React, { useState } from 'react';
import { H, Bar, speak, sh, PADEZI, PREPS } from '../../data.jsx';

export default function PadeziScreen({ goBack, award, setSt }) {
  const [czMode, sCzMode] = useState("learn");
  const [czQ, sCzQ] = useState([]);
  const [czI, sCzI] = useState(0);
  const [czS, sCzS] = useState(0);
  const [czA, sCzA] = useState(false);
  const [czSl, sCzSl] = useState(-1);
  const [czO, sCzO] = useState([]);

  function startQuiz() {
    const q = sh(PADEZI.quiz);
    sCzQ(q); sCzI(0); sCzS(0); sCzA(false); sCzSl(-1);
    sCzO(sh([q[0].a].concat(q[0].al)));
  }

  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("📚 Padeži — 7 Croatian Cases","Master noun endings for every situation")}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["learn","quiz"].map(m => (
          <button
            key={m}
            className={"b " + (czMode === m ? "bp" : "bg")}
            style={{fontSize:13,padding:"8px 16px"}}
            onClick={() => {
              sCzMode(m); sCzI(0); sCzS(0); sCzA(false); sCzSl(-1);
              if (m === "quiz") { const q = sh(PADEZI.quiz); sCzQ(q); sCzO(sh([q[0].a].concat(q[0].al))); }
            }}>
            {m === "learn" ? "📖 Learn" : "✏️ Quiz"}
          </button>
        ))}
      </div>

      {czMode === "learn" && (
        <React.Fragment>
          {PADEZI.cases.map((c, i) => (
            <div
              key={i}
              className="c"
              style={{marginBottom:12,borderLeft:"4px solid " + (i < 2 ? "#0e7490" : i < 4 ? "#b45309" : "#7c3aed")}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:17,fontWeight:800,color:"#164e63"}}>{i + 1}. {c.name}</div>
                <div style={{fontSize:12,color:"#0e7490",fontWeight:700}}>{c.q}</div>
              </div>
              <div style={{fontSize:13,color:"#78716c",marginBottom:4}}>{c.en} — {c.use}</div>
              {c.exs.map((e, ei) => (
                <div key={ei} style={{fontSize:14,padding:"4px 0",cursor:"pointer"}} onClick={() => speak(e)}>
                  🔊 {e}
                </div>
              ))}
              <div style={{fontSize:12,color:"#b45309",marginTop:6,fontStyle:"italic"}}>💡 {c.tip}</div>
            </div>
          ))}
          <div className="c" style={{marginTop:16}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0e7490",marginBottom:10}}>📌 Prepositions & Their Cases</div>
            {PREPS.map((p, i) => (
              <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,.04)",fontSize:13}}>
                <div style={{minWidth:60,fontWeight:800,color:"#164e63"}}>{p.prep}</div>
                <div style={{minWidth:90,color:"#b45309",fontWeight:600}}>{p.cases.join(", ")}</div>
                <div style={{color:"#78716c"}}>{p.en}</div>
              </div>
            ))}
          </div>
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={() => { sCzMode("quiz"); startQuiz(); }}>
            Start Quiz →
          </button>
        </React.Fragment>
      )}

      {czMode === "quiz" && (() => {
        if (!czQ.length) return null;
        const total = czQ.length;
        if (czI >= total) {
          const pct = Math.round((czS / total) * 100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>{pct >= 80 ? "🏆" : "👍"}</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Cases Quiz Complete!</h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{czS} / {total}</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={() => sCzMode("learn")}>📖 Review</button>
                <button className="b bp" onClick={() => { award(czS * 3 + 15); setSt(s => ({...s, gc: s.gc + 1})); goBack(); }}>🏠 Finish!</button>
              </div>
            </div>
          );
        }
        const q = czQ[czI];
        const ci = czO.indexOf(q.a);
        return (
          <React.Fragment>
            <Bar v={czI + 1} mx={total} h={6} />
            <div className="c" style={{marginTop:16}}>
              <p style={{fontSize:17,fontWeight:700,lineHeight:1.6}}>{q.q}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              {czO.map((o, oi) => (
                <button
                  key={oi}
                  className={"ob " + (czA ? (oi === ci ? "ok" : czSl === oi ? "no" : "") : "")}
                  onClick={() => { if (!czA) { sCzSl(oi); sCzA(true); if (oi === ci) { sCzS(s => s + 1); award(4); } } }}>
                  {o}
                </button>
              ))}
            </div>
            {czA && (
              <button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={() => {
                  if (czI < total - 1) {
                    const n = czQ[czI + 1];
                    sCzO(sh([n.a].concat(n.al)));
                    sCzI(i => i + 1);
                    sCzA(false);
                    sCzSl(-1);
                  } else {
                    sCzI(total);
                  }
                }}>
                {czI < total - 1 ? "Next →" : "See Results"}
              </button>
            )}
          </React.Fragment>
        );
      })()}
    </div>
  );
}
