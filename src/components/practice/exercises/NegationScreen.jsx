import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { NEGATION } from '../../../data.jsx';

function NegationScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("❌ Positive ↔ Negative","Radim → Ne radim • Imam → Nemam")}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Most verbs: add NE before the verb. Exception: imam → nemam, znam → ne znam.</div>
      {shMemo("ng",NEGATION).map(function(n,ni){return (
        <div key={ni} className="c" style={{marginBottom:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1}}>
            <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,color:"#16a34a",marginBottom:2,display:"block"}} onClick={function(){speak(n.pos)}}>{"✅ "}{n.pos}</button>
            <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,color:"#dc2626",display:"block"}} onClick={function(){speak(n.neg)}}>{"❌ "}{n.neg}</button>
          </div>
          <div style={{fontSize:11,color:"#78716c",maxWidth:140,textAlign:"right"}}>{n.en}</div>
        </div>
      );})}
    </div>
  );
}

export default NegationScreen;
