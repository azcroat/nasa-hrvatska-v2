import React from 'react';
import { H, speak } from '../../data.jsx';
import { TEXTING } from '../../data.jsx';

function TextingScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("📱 Texting & Slang","How Croatian kids actually text",goBack)}
      {TEXTING.map(function(t,i){return (
        <button key={i} className="c" style={{marginBottom:8}} onClick={function(){speak(t.slang)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>{t.slang}{" 🔊"}</div>
            <div style={{fontSize:14,fontWeight:600,color:"#0e7490"}}>{t.means}</div>
          </div>
          <div style={{fontSize:12,color:"var(--subtext)",marginTop:2}}>{t.ctx}</div>
        </button>
      );})}
    </div>
  );
}

export default TextingScreen;
