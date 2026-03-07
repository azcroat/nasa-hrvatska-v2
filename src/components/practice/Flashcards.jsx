import React from 'react';
import { H, Bar, srMark } from '../../data.jsx';

export default function Flashcards({ fcPool, fcI, fcFlip, fcKnow, sFcFlip, sFcI, sFcKnow, goBack, award }) {
  if (!fcPool[fcI]) return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64}}>🌟</div>
        <h3>Done! Known: {fcKnow}/{fcPool.length}</h3>
        <button className="b bp" style={{marginTop:16}} onClick={goBack}>Continue</button>
      </div>
    </div>
  );
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🃏 Flashcards","Tap card to flip. Swipe through words.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>{fcI+1} / {fcPool.length}</div>
        <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>✅ Know: {fcKnow}</div>
      </div>
      <Bar v={fcI+1} mx={fcPool.length} h={6} color="#f59e0b" />
      <div onClick={()=>sFcFlip(f=>!f)}
        style={{minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:fcFlip?"linear-gradient(135deg,#dcfce7,#bbf7d0)":"linear-gradient(135deg,#dbeafe,#bfdbfe)",borderRadius:14,marginTop:20,cursor:"pointer",padding:32,transition:"all .3s"}}>
        <div style={{fontSize:fcFlip?18:32,fontWeight:800,color:fcFlip?"#16a34a":"#1e40af",fontFamily:"'Playfair Display',serif",textAlign:"center"}}>
          {fcFlip?fcPool[fcI][1]:fcPool[fcI][0]}
        </div>
        {fcPool[fcI][2]&&!fcFlip&&<div style={{fontSize:14,color:"#6b7280",marginTop:8}}>/{fcPool[fcI][2]}/</div>}
        <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>{fcFlip?"(tap to flip back)":"(tap to see English)"}</div>
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
