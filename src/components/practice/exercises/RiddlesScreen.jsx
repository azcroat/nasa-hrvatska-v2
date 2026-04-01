import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { RIDDLES } from '../../../data.jsx';

function RiddlesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🧩 Što je to?","Read the clues in Croatian, guess the answer!",goBack)}
      {shMemo("rid",RIDDLES,8).map(function(r,ri){return (
        <div key={ri} className="c" style={{marginBottom:14,padding:"14px 16px"}}>
          <button aria-label={`Play audio clue: ${r.clue}`} style={{fontSize:14,fontStyle:"italic",color:"#44403c",marginBottom:10,lineHeight:1.5,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(r.clue)}}><span aria-hidden="true">🔊</span> "{r.clue}"</button>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {sh(r.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 16px",border:"2px solid #d6d3d1",borderRadius:12,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===r.answer?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===r.answer?"#16a34a":"#dc2626";if(o===r.answer){award(5);speak(r.answer);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
          <div style={{fontSize:11,color:"#a8a29e",marginTop:6}}>{"🇬🇧 "}{r.en}</div>
        </div>
      );})}
    </div>
  );
}

export default RiddlesScreen;
