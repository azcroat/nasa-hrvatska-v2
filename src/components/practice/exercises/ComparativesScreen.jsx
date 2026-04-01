import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { COMPARE, COMPQUIZ } from '../../../data.jsx';

function ComparativesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("📈 Lijep, Ljepši, Najljepši","Adjective → Comparative → Superlative",goBack)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:20}}>
        <div style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Base</div>
        <div style={{padding:"6px",background:"#b45309",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Comparative</div>
        <div style={{padding:"6px",background:"#7c3aed",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Superlative</div>
        {COMPARE.map(function(cm){return [
          <button key={cm.base+"b"} style={{padding:"6px",fontSize:12,background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.base)}}>{cm.base}{" ("}{cm.en})</button>,
          <button key={cm.base+"c"} style={{padding:"6px",fontSize:12,fontWeight:700,color:"#b45309",background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.comp)}}>{cm.comp}</button>,
          <button key={cm.base+"s"} style={{padding:"6px",fontSize:12,fontWeight:700,color:"#7c3aed",background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.super)}}>{cm.super}</button>
        ];}).flat()}
      </div>
      <h3 className="sh">🎯 Pick the right form</h3>
      {shMemo("cq",COMPQUIZ).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default ComparativesScreen;
