import React from 'react';
import { H, speak } from '../../data.jsx';
import { ASPECT } from '../../data.jsx';

function AspectScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🔄 Verb Aspect","Perfective vs Imperfective",goBack)}
      {ASPECT.pairs.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button style={{fontWeight:700,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.imp)}}>{p.imp}{" 🔊"}</button>
            <button style={{fontWeight:700,color:"#16a34a",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.perf)}}>{p.perf}{" 🔊"}</button>
          </div>
          <div style={{fontSize:13,color:"#78716c"}}>{p.en}</div>
        </div>
      );})}
    </div>
  );
}

export default AspectScreen;
