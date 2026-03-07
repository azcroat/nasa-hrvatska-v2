import React from 'react';
import { H, PROVERBS, speak } from '../../data.jsx';

export default function ProverbsScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("🌟 Hrvatske Poslovice","Croatian Proverbs — Tap to hear")}
      {PROVERBS.map((p,i)=>(
        <div key={i} className="c" style={{marginBottom:10,cursor:"pointer"}} onClick={()=>speak(p.hr)}>
          <div style={{fontSize:15,fontWeight:700,color:"#92400e",fontStyle:"italic"}}>{p.hr} 🔊</div>
          <div style={{fontSize:14,color:"#0e7490",fontWeight:600,marginTop:4}}>{p.en}</div>
          <div style={{fontSize:12,color:"#78716c",marginTop:2}}>Literally: "{p.lit}"</div>
        </div>
      ))}
    </div>
  );
}
