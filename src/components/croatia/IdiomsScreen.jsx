import React from 'react';
import { H, IDIOMS, speak } from '../../data.jsx';

export default function IdiomsScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🗣️ Idioms & Slang","Speak like a real Croatian!")}
      {IDIOMS.map((idm,i)=>(
        <div key={i} className="c" style={{marginBottom:10,cursor:"pointer"}} onClick={()=>speak(idm.hr)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63"}}>{idm.hr} 🔊</div>
            <div style={{fontSize:14,fontWeight:600,color:"#0e7490"}}>{idm.en}</div>
          </div>
          <div style={{fontSize:12,color:"#78716c",marginTop:4}}>Literally: "{idm.lit}" — {idm.ctx}</div>
        </div>
      ))}
    </div>
  );
}
