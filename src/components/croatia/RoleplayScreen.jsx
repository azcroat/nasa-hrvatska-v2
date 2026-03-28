import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { ROLEPLAY } from '../../data.jsx';

function RoleplayScreen({ goBack }) {
  const [rpIdx, setRpIdx] = useState(0);
  const [rpLine, setRpLine] = useState(0);
  const [rpShow, setRpShow] = useState(false);
  const r = ROLEPLAY[rpIdx];
  return (
    <div className="scr-wrap">

      {H("🎭 Conversation Role-Play","Practice real-life dialogues")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {ROLEPLAY.map(function(rp,i){return (
          <button key={i} className={"b "+(rpIdx===i?"bp":"bg")} style={{fontSize:12}}
            onClick={function(){setRpIdx(i);setRpLine(0);setRpShow(false)}}>
            {rp.title}
          </button>
        );})}
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>{r.title}</div>
        <div style={{fontSize:13,color:"var(--subtext)"}}>{r.en}</div>
      </div>
      {r.lines.slice(0,rpLine+1).map(function(l,i){return (
        <div key={i} style={{display:"flex",justifyContent:l.you?"flex-end":"flex-start",marginBottom:8}}>
          <div role="button" tabIndex={0} aria-label={`Play audio for ${l.text}`} style={{maxWidth:"80%",padding:"12px 16px",borderRadius:l.you?"16px 16px 4px 16px":"16px 16px 16px 4px",
            background:l.you?"linear-gradient(135deg,#0e7490,#164e63)":"rgba(255,255,255,.8)",
            color:l.you?"white":"#1c1917",cursor:"pointer",border:l.you?"none":"1px solid #e7e5e4"}}
            onClick={function(){speak(l.text)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();speak(l.text);}}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,opacity:.7}}>{l.speaker}</div>
            <div style={{fontSize:15,fontWeight:600}}>{l.text}{" "}<span aria-hidden="true">🔊</span></div>
            {rpShow&&<div style={{fontSize:12,marginTop:4,opacity:.7,fontStyle:"italic"}}>{l.en}</div>}
          </div>
        </div>
      );})}
      <div style={{display:"flex",gap:8,marginTop:16}}>
        {rpLine<r.lines.length-1&&<button className="b bp" style={{flex:1}} onClick={function(){setRpLine(rpLine+1)}}>Next Line →</button>}
        <button className="b bg" onClick={function(){setRpShow(!rpShow)}}>{rpShow?"Hide English":"Show English"}</button>
        {rpLine>=r.lines.length-1&&<button className="b bp" style={{flex:1}} onClick={function(){setRpLine(0);setRpShow(false);if(rpIdx<ROLEPLAY.length-1)setRpIdx(rpIdx+1)}}>↻ Next Scenario</button>}
      </div>
    </div>
  );
}

export default RoleplayScreen;
