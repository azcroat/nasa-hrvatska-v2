import React from 'react';
import { H, ALPHA, speak } from '../../data.jsx';

export default function AlphabetScreen({ goBack }) {
  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🔤 Croatian Alphabet","30 letters — perfectly phonetic!")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {ALPHA.map((l,i)=>(
          <div key={i} className="c" style={{padding:"12px 16px",cursor:"pointer"}} onClick={()=>speak(l[2])}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:22,fontWeight:800,color:"#164e63",fontFamily:"monospace",minWidth:55}}>{l[0]}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:"#0e7490",fontWeight:700}}>/{l[1]}/</div>
                <div style={{fontSize:13}}>{l[2]} ({l[3]})</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
