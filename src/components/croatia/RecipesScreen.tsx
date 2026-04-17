// @ts-nocheck
import React, { useState } from 'react';
import { H, speak } from '../../data';
import { RECIPES } from '../../data';

function RecipesScreen({ goBack }) {
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
        <div style={{fontSize:18,fontWeight:800,color:"var(--info)"}}>{r.name}</div>
        <div style={{fontSize:14,color:"var(--subtext)"}}>{r.en}{" • "}{r.time}{" min"}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          <span style={{fontSize:13,fontWeight:700}}>Servings:</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid var(--info)",background:"var(--card)",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){if(rcServ>1)setRcServ(rcServ-1)}}>-</button>
          <span style={{fontSize:20,fontWeight:800,minWidth:30,textAlign:"center"}}>{rcServ}</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid var(--info)",background:"var(--card)",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){setRcServ(rcServ+1)}}>+</button>
        </div>
      </div>
      <h3 className="sh">🥚 Ingredients (scaled)</h3>
      {r.ing.map(function(ig,i){const amt=ig[0];const num=parseFloat(amt);const unit=amt.replace(/[0-9./]+/g,"").trim();const scaled=!isNaN(num)?Math.round(num*scale*10)/10+unit:amt;return (
        <div key={i} role="button" tabIndex={0} aria-label={`Play audio for ${ig[1]}`} style={{padding:"6px 0",fontSize:14,borderBottom:"1px solid #f3f4f6",display:"flex",gap:8,cursor:"pointer"}} onClick={function(){speak(ig[1].split("(")[0])}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();speak(ig[1].split("(")[0]);}}}>
          <span style={{fontWeight:800,color:"var(--info)",minWidth:60}}>{scaled}</span>
          <span>{ig[1]}{" "}<span aria-hidden="true">🔊</span></span>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>👨‍🍳 Steps</h3>
      {r.steps.map(function(s,i){return (
        <div key={i} role="button" tabIndex={0} aria-label={`Play audio for step ${i+1}`} className="c" style={{marginBottom:8,display:"flex",gap:12,cursor:"pointer"}} onClick={function(){speak(s.split("(")[0])}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();speak(s.split("(")[0]);}}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"var(--info)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{i+1}</div>
          <div style={{fontSize:14,lineHeight:1.6}}>{s}{" "}<span aria-hidden="true">🔊</span></div>
        </div>
      );})}
    </div>
  );
}

export default RecipesScreen;
