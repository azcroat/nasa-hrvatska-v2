import React from 'react';
import { V, sh } from '../../data.jsx';

export default function McResult({ mcQ, mcS, setScr, goBack, award, sMcQ, sMcI, sMcS, sMcA, sMcSl }) {
  const allCats = Object.keys(V);

  function playAgain() {
    const pool = allCats.flatMap(c => V[c]);
    const items = sh(pool).slice(0, 15).map(w => {
      const wr = sh(pool.filter(p => p[1] !== w[1])).slice(0, 3).map(p => p[1]);
      const mixed = [w[1], ...wr];
      const shuffled = sh(mixed);
      return { hr: w[0], en: w[1], ph: w[2], opts: shuffled, correct: w[1] };
    });
    sMcQ(items); sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
  }

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"40px 24px",paddingBottom:80,textAlign:"center",position:"relative",zIndex:1}}>
      <div style={{fontSize:64}}>
        {mcS === mcQ.length ? "🌟" : "🎉"}
      </div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>
        {mcS === mcQ.length ? "Perfect!" : "Great Job!"}
      </h2>
      <p style={{color:"#78716c",marginTop:8,fontSize:20}}>
        {mcS}/{mcQ.length}
      </p>
      <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
        <button className="b bg" onClick={playAgain}>
          Play Again
        </button>
        <button className="b bp" onClick={goBack}>
          Continue →
        </button>
      </div>
      <button
        onClick={() => { setScr("dashboard"); }}
        style={{padding:"14px 32px",border:"2px solid #d6d3d1",borderRadius:14,background:"white",color:"#78716c",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,display:"block",margin:"16px auto 0"}}>
        ← Done
      </button>
    </div>
  );
}
