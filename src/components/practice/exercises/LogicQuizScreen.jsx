import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { LOGICQUIZ } from '../../../data.jsx';

function LogicQuizScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🧠 Think in Croatian","Pick the answers that make sense")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Read the Croatian situation and pick ALL correct answers. Some questions have 2 right answers!</div>
      {shMemo("lq",LOGICQUIZ).map(function(lq,li){const allOpts=sh(lq.right.concat(lq.wrong));return (
        <div key={li} className="c" style={{marginBottom:12,padding:"12px 14px"}}>
          <button aria-label={`Play audio for ${lq.q}`} style={{fontSize:14,fontWeight:700,color:"var(--heading)",marginBottom:8,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(lq.q)}}><span aria-hidden="true">🔊</span>{" "}{lq.q}</button>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {allOpts.map(function(o,oi){const isRight=lq.right.indexOf(o)>=0;return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=isRight?"#dcfce7":"#fee2e2";e.target.style.borderColor=isRight?"#16a34a":"#dc2626";if(isRight){award(3);speak(o);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default LogicQuizScreen;
