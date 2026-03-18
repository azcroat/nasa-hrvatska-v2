import React from 'react';
import { V, sh } from '../../data.jsx';

export default function McResult({ questions, score, setScr, goBack, onNewGame }) {
  const allCats = Object.keys(V);

  function playAgain() {
    const pool = allCats.flatMap(c => V[c]);
    const items = sh(pool).slice(0, 15).map(w => {
      const wr = sh(pool.filter(p => p[1] !== w[1])).slice(0, 3).map(p => p[1]);
      return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1], ...wr]), correct: w[1] };
    });
    onNewGame(items);
  }

  return (
    <div className="scr-wrap">
      <div style={{fontSize:64}}>
        {score === questions.length ? "🌟" : "🎉"}
      </div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>
        {score === questions.length ? "Perfect!" : "Great Job!"}
      </h2>
      <p style={{color:"#78716c",marginTop:8,fontSize:20}}>
        {score}/{questions.length}
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
