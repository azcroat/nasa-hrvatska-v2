import React, { useState } from 'react';
import { H, Bar, V, sh } from '../../data.jsx';

export default function TypingScreen({ goBack, award }) {
  const [[tyPool, firstWord]] = useState(() => {
    const allWords = Object.values(V).flat();
    const items = sh(allWords).slice(0, 10);
    return [items, items[0]];
  });
  const [tyI, sTyI] = useState(0);
  const [tyS, sTyS] = useState(0);
  const [tyIn, sTyIn] = useState("");
  const [tyA, sTyA] = useState(false);
  const [tyW, sTyW] = useState(firstWord);

  if (!tyPool.length || !tyW) return null;

  if (tyI >= tyPool.length) {
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
        {H("⌨️ Typing Practice","Type Croatian words with special characters")}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{tyS >= tyPool.length * 0.8 ? "🏆" : "📚"}</div>
          <h2>{tyS} / {tyPool.length}</h2>
          <button className="b bp" onClick={() => { award(tyS * 5); goBack(); }}>🏠 Done</button>
        </div>
      </div>
    );
  }

  const isCorrect = tyIn.trim().toLowerCase() === tyW[0].toLowerCase();

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("⌨️ Typing Practice","Type Croatian words with special characters")}
      <Bar v={tyI + 1} mx={tyPool.length} />
      <div className="c" style={{textAlign:"center",marginTop:16}}>
        <div style={{fontSize:13,color:"#78716c"}}>Type this word in Croatian:</div>
        <div style={{fontSize:24,fontWeight:800,color:"#164e63",marginTop:8}}>{tyW[1]}</div>
        <div style={{fontSize:13,color:"#78716c",marginTop:4}}>({tyW[0]})</div>
      </div>
      <input
        type="text"
        value={tyIn}
        onChange={e => sTyIn(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !tyA) { sTyA(true); if (isCorrect) sTyS(tyS + 1); } }}
        placeholder="Type Croatian..."
        style={{marginTop:16,textAlign:"center",fontSize:18}} />
      <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
        {["č","ć","š","ž","đ"].map(ch => (
          <button
            key={ch}
            style={{padding:"8px 16px",border:"2px solid #e7e5e4",borderRadius:10,fontSize:18,fontWeight:700,cursor:"pointer",background:"white"}}
            onClick={() => sTyIn(tyIn + ch)}>
            {ch}
          </button>
        ))}
      </div>
      {tyA && (
        <div style={{textAlign:"center",marginTop:16}}>
          <div style={{fontSize:18,fontWeight:700,color:isCorrect?"#16a34a":"#dc2626"}}>
            {isCorrect ? "✅ Correct!" : "❌ " + tyW[0]}
          </div>
          <button
            className="b bp"
            style={{marginTop:12}}
            onClick={() => {
              const next = tyI + 1;
              sTyI(next);
              sTyA(false);
              sTyIn("");
              if (next < tyPool.length) sTyW(tyPool[next]);
            }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
