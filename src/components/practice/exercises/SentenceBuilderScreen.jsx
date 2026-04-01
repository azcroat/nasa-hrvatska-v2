import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { SENTBUILD } from '../../../data.jsx';

function SentenceBuilderScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🏗️ Build the Sentence","Translate English to Croatian",goBack)}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12,color:"#164e63"}}>🇬🇧 Read the English sentence, then pick the correct Croatian translation.</div>
      {shMemo("sb",SENTBUILD,15).map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:6}}>{"🇬🇧 "}{s.en}</div>
          {sh(s.opts).map(function(o,oi){return (
            <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:13,textAlign:"left",cursor:"pointer"}}
              onClick={function(/** @type {any} */ e){e.target.style.background=o===s.hr?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.hr?"#16a34a":"#dc2626";if(o===s.hr){award(5);speak(s.hr);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
              {"🇭🇷 "}{o}
            </button>
          );})}
        </div>
      );})}
    </div>
  );
}

export default SentenceBuilderScreen;
