// @ts-nocheck
import React, { useState, useRef } from 'react';
import { H, Bar, speak, sh, BOJE } from '../../data';

export default function BojeGame({ goBack, award }) {
  const finishFired = useRef(false);
  const [bjMode, sBjMode] = useState("learn");
  const [bjIdx, sBjIdx] = useState(0);
  const [bjSc, sBjSc] = useState(0);
  const [bjAns, sBjAns] = useState(false);
  const [bjSel, sBjSel] = useState(-1);
  const [bjOpts, sBjOpts] = useState([]);
  const [bjQ, sBjQ] = useState([]);

  function startQuiz() {
    finishFired.current = false;
    const q = sh(BOJE.quiz);
    sBjQ(q); sBjIdx(0); sBjSc(0); sBjAns(false); sBjSel(-1); sBjOpts([]);
  }

  function getOpts(q) {
    const allForms = BOJE.colors.flatMap(c => {
      if (q.g === "f") return [c.f];
      if (q.g === "n") return [c.n];
      if (q.g === "m") return [c.m];
      if (q.g === "fp") return [c.fp];
      if (q.g === "np") return [c.np];
      return [c.mp];
    });
    const wrongs = sh(allForms.filter(f => f !== q.answer)).slice(0, 3);
    return sh([q.answer, ...wrongs]);
  }

  return (
    <div className="scr-wrap">
      
      {H("🎨 " + BOJE.title,"Color adjectives change to match noun gender", goBack)}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["learn","quiz"].map(m => (
          <button
            key={m}
            className={"b " + (bjMode === m ? "bp" : "bg")}
            style={{fontSize:13,padding:"8px 16px"}}
            onClick={() => { sBjMode(m); if (m === "quiz") startQuiz(); }}>
            {m === "learn" ? "📖 Learn" : "✏️ Quiz"}
          </button>
        ))}
      </div>

      {bjMode === "learn" && (
        <React.Fragment>
          <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#92400e",marginBottom:8}}>🎨 How Colors Change by Gender</div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#1c1917"}}>
              <div>🔴 <b>Feminine (-a):</b> Ruža je crven<b style={{color:"#dc2626"}}>a</b>.</div>
              <div>🔵 <b>Neuter (-o):</b> Sunce je crven<b style={{color:"#2563eb"}}>o</b>.</div>
              <div>🟢 <b>Masculine (∅):</b> Cvijet je crven.</div>
              <div style={{marginTop:8}}>📚 <b>Feminine plural (-e):</b> Ruže su crven<b style={{color:"#dc2626"}}>e</b>.</div>
              <div>📚 <b>Neuter plural (-a):</b> Sunca su crven<b style={{color:"#2563eb"}}>a</b>.</div>
              <div>📚 <b>Masculine plural (-i):</b> Cvjetovi su crven<b style={{color:"#16a34a"}}>i</b>.</div>
            </div>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:"#0e7490",marginBottom:10}}>All Colors — Tap to hear:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {BOJE.colors.map((c, i) => (
              <button key={i} className="c" style={{padding:"12px 14px"}} onClick={() => speak(c.f)}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:24,height:24,borderRadius:10,background:c.hex,border:c.en === "white" ? "2px solid #d6d3d1" : "none"}} />
                  <span style={{fontSize:15,fontWeight:700}}>{c.en}</span>
                </div>
                <div style={{fontSize:12,display:"flex",gap:8}}>
                  <span style={{color:"#dc2626"}}>{c.f}</span>
                  <span style={{color:"#2563eb"}}>{c.n}</span>
                  <span style={{color:"#16a34a"}}>{c.m}</span>
                </div>
              </button>
            ))}
          </div>
          <button className="b bp" style={{width:"100%"}} onClick={() => { sBjMode("quiz"); startQuiz(); }}>
            Start Quiz →
          </button>
        </React.Fragment>
      )}

      {bjMode === "quiz" && (() => {
        if (bjQ.length === 0) return null;
        const total = bjQ.length;
        if (bjIdx >= total) {
          const pct = Math.round((bjSc / total) * 100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>{pct >= 80 ? "🎨" : "👍"}</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Colors Quiz Complete!</h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{bjSc} / {total}</div>
              <div style={{fontSize:24,fontWeight:900,color:"#d97706",margin:"8px 0 16px"}}>+{bjSc * 7} XP</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:0}}>
                <button className="b bg" onClick={() => sBjMode("learn")}>📖 Review</button>
                <button className="b bg" onClick={() => startQuiz()}>🔄 Retry</button>
                <button className="b bp" onClick={goBack}>🏠 Done</button>
              </div>
            </div>
          );
        }
        const q = bjQ[bjIdx];
        const gLabel = q.g === "f" ? "feminine" : q.g === "n" ? "neuter" : q.g === "m" ? "masculine" : q.g === "fp" ? "feminine plural" : q.g === "np" ? "neuter plural" : "masculine plural";
        const gColor = q.g.includes("f") ? "#dc2626" : q.g.includes("n") ? "#2563eb" : "#16a34a";

        // Initialize opts lazily if needed
        const opts = bjOpts.length > 0 ? bjOpts : null;
        if (!opts) {
          setTimeout(() => sBjOpts(getOpts(q)), 0);
          return <div style={{textAlign:"center",padding:40}}>Loading...</div>;
        }

        return (
          <React.Fragment>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700}}>{bjIdx + 1} / {total}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>Score: {bjSc}</div>
            </div>
            <Bar v={bjIdx + 1} mx={total} color={gColor} h={6} />
            <div className="c" style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:700,color:gColor,marginBottom:4}}>({gLabel})</div>
              <div style={{fontSize:18,color:"#1c1917"}}>
                <b>{q.noun}</b>{" je "}
                <span style={{borderBottom:"3px solid " + gColor,fontWeight:800,color:gColor,fontSize:20,padding:"0 4px"}}>
                  {bjAns ? q.answer : "___?"}
                </span>
              </div>
              <div style={{fontSize:13,color:"#78716c",fontStyle:"italic",marginTop:8}}>{q.en}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              {opts.map((o, oi) => (
                <button
                  key={oi}
                  className={"ob " + (bjAns ? (o === q.answer ? "ok" : bjSel === oi ? "no" : "") : "")}
                  onClick={() => {
                    if (bjAns) return;
                    sBjSel(oi); sBjAns(true);
                    if (o === q.answer) { sBjSc(s => s + 1); if (typeof award === 'function') award(5); }
                  }}>
                  {o}
                </button>
              ))}
            </div>
            {bjAns && (
              <button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={() => {
                  if (bjIdx < total - 1) {
                    const nq = bjQ[bjIdx + 1];
                    sBjOpts(getOpts(nq));
                    sBjIdx(i => i + 1);
                    sBjAns(false);
                    sBjSel(-1);
                  } else {
                    if (!finishFired.current) { finishFired.current = true; if (typeof award === 'function') award(bjSc * 2); }
                    sBjIdx(total);
                  }
                }}>
                {bjIdx < total - 1 ? "Next →" : "See Results"}
              </button>
            )}
          </React.Fragment>
        );
      })()}
    </div>
  );
}
