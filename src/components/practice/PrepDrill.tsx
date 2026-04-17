import React, { useState, useRef } from 'react';
import { H, Bar, sh, PREPDRILL } from '../../data';

export default function PrepDrill({ goBack, award }) {
  const [ppQ] = useState(() => sh(PREPDRILL));
  const [ppI, sPpI] = useState(0);
  const [ppS, sPpS] = useState(0);
  const [ppA, sPpA] = useState(false);
  const [ppSl, sPpSl] = useState(-1);
  const finishFired = useRef(false);

  const total = ppQ.length;

  if (!ppQ.length) return null;

  if (ppI >= total) {
    return (
      <div className="scr-wrap">

        {H("📍 Preposition Drills","Fill in the correct preposition", goBack)}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{ppS >= total * 0.8 ? "🏆" : "📚"}</div>
          <h2>{ppS} / {total}</h2>
          <div style={{fontSize:24,fontWeight:900,color:"#d97706",margin:"8px 0 16px"}}>+{ppS * 5} XP</div>
          <button className="b bp" onClick={() => { if(finishFired.current)return; finishFired.current=true; if (typeof award === 'function') award(ppS * 5); goBack(); }}>🏠 Done</button>
        </div>
      </div>
    );
  }

  const q = ppQ[ppI];

  return (
    <div className="scr-wrap">

      {H("📍 Preposition Drills","Fill in the correct preposition", goBack)}
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>{ppI + 1} / {total}</span>
        <span style={{color:"#0e7490",fontWeight:700}}>Score: {ppS}</span>
      </div>
      <Bar v={ppI + 1} mx={total} />
      <div className="c" style={{marginTop:16}}>
        <div style={{fontSize:18}}>{q.sentence}</div>
        <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{q.en}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:16}}>
        {q.opts.map((o, oi) => (
          <button
            key={oi}
            className="ob"
            style={{
              textAlign:"center",
              background: ppA ? (o === q.answer ? "#dcfce7" : ppSl === oi ? "#fee2e2" : "white") : "white",
              borderColor: ppA ? (o === q.answer ? "#16a34a" : ppSl === oi ? "#dc2626" : "rgba(14,116,144,.12)") : "rgba(14,116,144,.12)"
            }}
            onClick={() => { if (!ppA) { sPpSl(oi); sPpA(true); if (o === q.answer) sPpS(ppS + 1); } }}>
            {o}
          </button>
        ))}
      </div>
      {ppA && (
        <button
          className="b bp"
          style={{width:"100%",marginTop:16}}
          onClick={() => { sPpI(ppI + 1); sPpA(false); sPpSl(-1); }}>
          Next →
        </button>
      )}
    </div>
  );
}
