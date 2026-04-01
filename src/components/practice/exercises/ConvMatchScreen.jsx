import React from 'react';
import { H, speak, sh } from '../../../data.jsx';
import { CONVMATCH } from '../../../data.jsx';

function ConvMatchScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("💬 Conversation Match","Pick the right response",goBack)}
      {CONVMATCH.map(function(conv,ci){return (
        <div key={ci} className="c" style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"🗣️ "}{conv.title}</div>
          {conv.pairs.map(function(p,pi){return (
            <div key={pi} style={{marginBottom:12,paddingBottom:12,borderBottom:pi<conv.pairs.length-1?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63",marginBottom:6,cursor:"pointer"}} onClick={function(){speak(p.q)}}>{"🗣️ "}{p.q}</div>
              {sh([p.a,p.wrong]).map(function(o,oi){return (
                <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:12,textAlign:"left",cursor:"pointer"}}
                  onClick={function(/** @type {any} */ e){e.target.style.background=o===p.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===p.a?"#16a34a":"#dc2626";if(o===p.a){award(5);speak(p.a);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
              );})}
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export default ConvMatchScreen;
