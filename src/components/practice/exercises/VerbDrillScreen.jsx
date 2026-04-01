import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { VERBDRILL, VBPERSONS } from '../../../data.jsx';

function VerbDrillScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("💪 20 Essential Verbs","Full present tense conjugation",goBack)}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Tap any form to hear it. Learn all 6 persons for each verb.</div>
      {shMemo("vd",VERBDRILL).map(function(v,vi){return (
        <div key={vi} className="c" style={{marginBottom:10,padding:0,overflow:"hidden"}}>
          <div style={{padding:"8px 14px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={function(){speak(v.inf)}}>
            <span style={{fontWeight:800}}>{v.inf}</span>
            <span style={{fontSize:12,opacity:.7}}>{v.en}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            {v.forms.map(function(f,fi){return (
              <div key={fi} style={{padding:"6px 12px",borderBottom:"1px solid #f0fdfa",borderRight:fi%2===0?"1px solid #f0fdfa":"none",fontSize:12,cursor:"pointer",display:"flex",gap:6}} onClick={function(){speak(f)}}>
                <span style={{fontWeight:700,color:"#0e7490",minWidth:50}}>{VBPERSONS[fi]}</span>
                <span>{f}</span>
              </div>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default VerbDrillScreen;
