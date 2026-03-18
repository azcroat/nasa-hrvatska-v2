import React, { useState } from 'react';
import { H, Bar, srMark } from '../../data.jsx';

export default function Flashcards({ pool, goBack, award }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  if (!pool[idx]) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64}}>🌟</div>
        <h3>Done! Known: {known}/{pool.length}</h3>
        <button className="b bp" style={{marginTop:16}} onClick={goBack}>Continue</button>
      </div>
    </div>
  );
  return (
    <div className="scr-wrap">
      {H("🃏 Flashcards","Tap card to flip. Swipe through words.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>{idx+1} / {pool.length}</div>
        <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>✅ Know: {known}</div>
      </div>
      <Bar v={idx+1} mx={pool.length} h={6} color="#f59e0b" />
      <div className="fc-scene">
        <div className={`fc-card${flipped?" flipped":""}`} onClick={()=>setFlipped(f=>!f)}>
          <div className="fc-face fc-front">
            <div style={{fontSize:32,fontWeight:800,color:"#1e40af",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {pool[idx][0]}
            </div>
            {pool[idx][2]&&<div style={{fontSize:14,color:"#6b7280",marginTop:8}}>/{pool[idx][2]}/</div>}
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to see English</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:22,fontWeight:800,color:"#16a34a",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {pool[idx][1]}
            </div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to flip back</div>
          </div>
        </div>
      </div>
      {flipped&&<div style={{display:"flex",gap:12,marginTop:20,justifyContent:"center"}}>
        <button className="b bd" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(pool[idx][0],false);setFlipped(false);
          if(idx<pool.length-1)setIdx(i=>i+1);
          else{award(known*2+5);goBack();}
        }}>❌ Study Again</button>
        <button className="b bs" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(pool[idx][0],true);setKnown(k=>k+1);setFlipped(false);
          if(idx<pool.length-1)setIdx(i=>i+1);
          else{award(known*2+5);goBack();}
        }}>✅ I Know It</button>
      </div>}
    </div>
  );
}
