import React, { useState } from 'react';
import { H, Bar } from '../../data.jsx';

export default function PlacementTest({ pq, pi, ps, pa, px, sPi, sPs, sPa, sPx, setScr, setSt }) {
  const [showResult, setShowResult] = useState(false);

  if (!pq.length) return null;

  const diff = ps >= 6 ? "advanced" : ps >= 3 ? "intermediate" : "beginner";

  if (showResult) {
    const levelLabel = { beginner: "Beginner (A1–A2)", intermediate: "Intermediate (B1)", advanced: "Advanced (B2+)" };
    const levelIcon  = { beginner: "🌱", intermediate: "🌿", advanced: "🏆" };
    const levelNote  = {
      beginner:     "Starting from the beginning is the right move — you'll build fast!",
      intermediate: "You've got a solid foundation. Keep building on it!",
      advanced:     "Impressive! You'll start with advanced content.",
    };
    return (
      <div className="scr-wrap">
        {H("📊 Your Level")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:72}}>{levelIcon[diff]}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:12}}>
            {levelLabel[diff]}
          </h2>
          <p style={{color:"#78716c",marginTop:8}}>{ps} / {pq.length} correct</p>
          <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:14,padding:"16px",marginTop:24,textAlign:"left"}}>
            <p style={{fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:6}}>{levelNote[diff]}</p>
            <p style={{fontSize:12,color:"#374151",lineHeight:1.6}}>
              You can adjust your level anytime in the Profile tab if you want more or less challenge.
            </p>
          </div>
          <button
            className="b bp"
            style={{width:"100%",marginTop:24}}
            onClick={() => { localStorage.setItem('nh_placement_done','true'); setSt(s => ({ ...s, diff })); setScr("dashboard"); }}>
            Start Learning →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H("Question " + (pi + 1) + " of " + pq.length)}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:-8}}>
        <button
          onClick={() => { localStorage.setItem('nh_placement_done','true'); setSt(s => ({ ...s, diff:'beginner' })); setScr("dashboard"); }}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#94a3b8",padding:"4px 8px",fontFamily:"'Outfit',sans-serif"}}>
          Skip test
        </button>
      </div>
      <Bar v={pi + 1} mx={pq.length} h={6} />
      <div className="c" style={{marginTop:20}}>
        <p style={{fontSize:20,fontWeight:700,marginBottom:24}}>{pq[pi].q}</p>
        {pq[pi].o.map((o, i) => (
          <button
            key={i}
            className={"ob " + (pa ? (i === pq[pi].c ? "ok" : px === i ? "no" : "") : "")}
            onClick={() => { if (!pa) { sPx(i); sPa(true); if (i === pq[pi].c) sPs(s => s + 1); } }}>
            {o}
          </button>
        ))}
        {pa && (
          <button
            className="b bp"
            style={{width:"100%",marginTop:20}}
            onClick={() => {
              if (pi < pq.length - 1) { sPi(i => i + 1); sPa(false); sPx(-1); }
              else { setShowResult(true); }
            }}>
            {pi < pq.length - 1 ? "Next →" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
