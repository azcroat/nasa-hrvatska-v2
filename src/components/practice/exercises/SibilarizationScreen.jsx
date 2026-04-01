import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { SIBIL } from '../../../data.jsx';

function SibilarizationScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🔄 Sibilarizacija","k→c, g→z, h→s before -i",goBack)}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(245,158,11,.06)",fontSize:13}}>{SIBIL.intro}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {SIBIL.examples.map(function(ex,i){return (
          <button key={i} className="c" style={{padding:"8px 12px",textAlign:"center"}} onClick={function(){speak(ex.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--heading)"}}>{ex.nom}{" → "}{ex.lok}</div>
            <div style={{fontSize:11,color:"#b45309"}}>{ex.rule}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("sq",SIBIL.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default SibilarizationScreen;
