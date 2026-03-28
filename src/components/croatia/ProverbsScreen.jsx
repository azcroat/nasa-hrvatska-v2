import React from 'react';
import { H, PROVERBS, speak } from '../../data.jsx';

export default function ProverbsScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🌟 Hrvatske Poslovice","Croatian Proverbs — Tap to hear")}
      {PROVERBS.map((p,i)=>(
        <div key={i} className="c" role="button" tabIndex={0} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>speak(p.hr)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();speak(p.hr);}}} aria-label={"Hear proverb: "+p.hr}>
          <div style={{fontSize:15,fontWeight:700,color:"#92400e",fontStyle:"italic"}}>{p.hr} <span aria-hidden="true">🔊</span></div>
          <div style={{fontSize:14,color:"#0e7490",fontWeight:600,marginTop:4}}>{p.en}</div>
        </div>
      ))}
    </div>
  );
}
