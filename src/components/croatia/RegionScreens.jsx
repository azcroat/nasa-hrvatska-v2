import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { REGIONS, ROLEPLAY, RECIPES } from '../../data.jsx';

export function RegionScreen({ regionKey, goBack }) {
  const r = REGIONS[regionKey];
  return (
    <div className="scr-wrap">
      
      {H(r.title, r.sub)}
      {r.sections.map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>{s.h}</div>
          <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>{s.t}</div>
        </div>
      );})}
    </div>
  );
}

export function RoleplayScreen({ goBack }) {
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
        <div style={{fontSize:13,color:"#78716c"}}>{r.en}</div>
      </div>
      {r.lines.slice(0,rpLine+1).map(function(l,i){return (
        <div key={i} style={{display:"flex",justifyContent:l.you?"flex-end":"flex-start",marginBottom:8}}>
          <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:l.you?"16px 16px 4px 16px":"16px 16px 16px 4px",
            background:l.you?"linear-gradient(135deg,#0e7490,#164e63)":"rgba(255,255,255,.8)",
            color:l.you?"white":"#1c1917",cursor:"pointer",border:l.you?"none":"1px solid #e7e5e4"}}
            onClick={function(){speak(l.text)}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,opacity:.7}}>{l.speaker}</div>
            <div style={{fontSize:15,fontWeight:600}}>{l.text}{" 🔊"}</div>
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

export function RecipesScreen({ goBack }) {
  const [rcIdx, setRcIdx] = useState(0);
  const [rcServ, setRcServ] = useState(RECIPES[0].servings);
  const r = RECIPES[rcIdx];
  const scale = rcServ / r.servings;
  return (
    <div className="scr-wrap">
      
      {H("🍳 Croatian Recipes","Cook & learn vocabulary")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {RECIPES.map(function(rec,i){return (
          <button key={i} className={"b "+(rcIdx===i?"bp":"bg")} style={{fontSize:13}}
            onClick={function(){setRcIdx(i);setRcServ(rec.servings)}}>
            {rec.name}
          </button>
        );})}
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b"}}>
        <div style={{fontSize:18,fontWeight:800,color:"#164e63"}}>{r.name}</div>
        <div style={{fontSize:14,color:"#78716c"}}>{r.en}{" • "}{r.time}{" min"}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          <span style={{fontSize:13,fontWeight:700}}>Servings:</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){if(rcServ>1)setRcServ(rcServ-1)}}>-</button>
          <span style={{fontSize:20,fontWeight:800,minWidth:30,textAlign:"center"}}>{rcServ}</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){setRcServ(rcServ+1)}}>+</button>
        </div>
      </div>
      <h3 className="sh">🥚 Ingredients (scaled)</h3>
      {r.ing.map(function(ig,i){var amt=ig[0];var num=parseFloat(amt);var unit=amt.replace(/[0-9./]+/g,"").trim();var scaled=!isNaN(num)?Math.round(num*scale*10)/10+unit:amt;return (
        <div key={i} style={{padding:"6px 0",fontSize:14,borderBottom:"1px solid #f3f4f6",display:"flex",gap:8,cursor:"pointer"}} onClick={function(){speak(ig[1].split("(")[0])}}>
          <span style={{fontWeight:800,color:"#0e7490",minWidth:60}}>{scaled}</span>
          <span>{ig[1]}{" 🔊"}</span>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>👨‍🍳 Steps</h3>
      {r.steps.map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:8,display:"flex",gap:12,cursor:"pointer"}} onClick={function(){speak(s.split("(")[0])}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#0e7490",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{i+1}</div>
          <div style={{fontSize:14,lineHeight:1.6}}>{s}{" 🔊"}</div>
        </div>
      );})}
    </div>
  );
}
