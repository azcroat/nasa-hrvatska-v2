import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { TENSEFLIP } from '../../../data.jsx';

function TenseFlipScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("⏳ Present → Past","Convert prezent to perfekt and negative")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 See the present tense, then tap to reveal the past (perfekt) and negative past forms.</div>
      {shMemo("tf",TENSEFLIP,10).map(function(t,ti){return (
        <div key={ti} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <button style={{fontSize:14,fontWeight:700,color:"var(--heading)",marginBottom:8,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(t.prez)}}>{"🔵 "}{t.prez}</button>
          <div style={{display:"flex",gap:8}}>
            <button style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
              onClick={function(/** @type {any} */ e){e.target.textContent="✅ "+t.perf;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(t.perf);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>🔵 Perfekt?</button>
            <button style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
              onClick={function(/** @type {any} */ e){e.target.textContent="❌ "+t.neg;e.target.style.background="#fee2e2";e.target.style.borderColor="#dc2626";speak(t.neg);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>🔴 Negative?</button>
          </div>
        </div>
      );})}
    </div>
  );
}

export default TenseFlipScreen;
