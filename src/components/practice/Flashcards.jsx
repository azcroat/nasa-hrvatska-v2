import React from 'react';
import { H, Bar, srMark } from '../../data.jsx';

export default function Flashcards({ fcPool, fcI, fcFlip, fcKnow, sFcFlip, sFcI, sFcKnow, goBack, award }) {
  if (!fcPool[fcI]) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64}}>🌟</div>
        <h3>Done! Known: {fcKnow}/{fcPool.length}</h3>
        <button className="b bp" style={{marginTop:16}} onClick={goBack}>Continue</button>
      </div>
    </div>
  );
  return (
    <div className="scr-wrap">
      
      {H("🃏 Flashcards","Tap card to flip. Swipe through words.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>{fcI+1} / {fcPool.length}</div>
        <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>✅ Know: {fcKnow}</div>
      </div>
      <Bar v={fcI+1} mx={fcPool.length} h={6} color="#f59e0b" />
      <div className="fc-scene">
        <div className={`fc-card${fcFlip?" flipped":""}`} onClick={()=>sFcFlip(f=>!f)}>
          <div className="fc-face fc-front">
            <div style={{fontSize:32,fontWeight:800,color:"#1e40af",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {fcPool[fcI][0]}
            </div>
            {fcPool[fcI][2]&&<div style={{fontSize:14,color:"#6b7280",marginTop:8}}>/{fcPool[fcI][2]}/</div>}
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to see English</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:22,fontWeight:800,color:"#16a34a",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {fcPool[fcI][1]}
            </div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to flip back</div>
          </div>
        </div>
      </div>
      {fcFlip&&<div style={{display:"flex",gap:12,marginTop:20,justifyContent:"center"}}>
        <button className="b bd" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(fcPool[fcI][0],false);sFcFlip(false);
          if(fcI<fcPool.length-1)sFcI(i=>i+1);
          else{award(fcKnow*2+5);goBack();}
        }}>❌ Study Again</button>
        <button className="b bs" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(fcPool[fcI][0],true);sFcKnow(k=>k+1);sFcFlip(false);
          if(fcI<fcPool.length-1)sFcI(i=>i+1);
          else{award(fcKnow*2+5);goBack();}
        }}>✅ I Know It</button>
      </div>}
    </div>
  );
}
