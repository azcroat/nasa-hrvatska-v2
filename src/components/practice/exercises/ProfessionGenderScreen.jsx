import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { PROFGENDER } from '../../../data.jsx';

function ProfessionGenderScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("👨‍⚖️👩‍⚖️ Profession Pairs","Every job has a masculine AND feminine form",goBack)}
      {shMemo("pg",PROFGENDER).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button style={{flex:1,textAlign:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.m)}}><div style={{fontSize:14,fontWeight:700,color:"#1e40af"}}>{"👨 "}{p.m}</div></button>
          <div style={{fontSize:11,color:"var(--subtext)",padding:"0 8px"}}>{p.en}</div>
          <button style={{flex:1,textAlign:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.f)}}><div style={{fontSize:14,fontWeight:700,color:"#db2777"}}>{"👩 "}{p.f}</div></button>
        </div>
      );})}
    </div>
  );
}

export default ProfessionGenderScreen;
