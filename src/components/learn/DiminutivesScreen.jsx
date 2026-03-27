import React from 'react';
import { H, speak } from '../../data.jsx';
import { DIMWORDS } from '../../data.jsx';

function DiminutivesScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🐣 Umanjenice","Diminutives — making things small & cute",goBack)}
      {DIMWORDS.map(function(d,i){return (
        <button key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={function(){speak(d.dim)}}>
          <div>
            <span style={{fontSize:15,fontWeight:700}}>{d.base}</span>
            <span style={{color:"#78716c"}}>{" → "}</span>
            <span style={{fontSize:15,fontWeight:700,color:"#16a34a"}}>{d.dim}{" 🔊"}</span>
          </div>
          <div style={{fontSize:12,color:"var(--subtext)"}}>{d.suffix}</div>
        </button>
      );})}
    </div>
  );
}

export default DiminutivesScreen;
