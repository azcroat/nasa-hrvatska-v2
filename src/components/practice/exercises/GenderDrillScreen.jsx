import React, { useState } from 'react';
import { H, speak, sh } from '../../../data.jsx';
import { GENDERDRILL } from '../../../data.jsx';

function GenderDrillScreen({ goBack, award }) {
  const [revealedGenders, setRevealedGenders] = useState({});
  const [revealedPlurals, setRevealedPlurals] = useState({});
  const words = React.useMemo(() => sh(GENDERDRILL.sort).slice(0,12), []);
  return (
    <div className="scr-wrap">

      {H("♂️♀️ Gender, Plurals & Adjectives","Master noun genders and endings")}
      <h3 className="sh">📦 Sort by Gender — tap a word, then tap M / F / N</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20,pointerEvents:Object.keys(revealedGenders).length===words.length?"none":"auto"}}>
        {words.map(function(w,i){
          const revealed = revealedGenders[i];
          const bg = revealed ? (w.g==="m"?"#dbeafe":w.g==="f"?"#fce7f3":"#dcfce7") : "white";
          const bc = revealed ? (w.g==="m"?"#1e40af":w.g==="f"?"#db2777":"#16a34a") : "#d6d3d1";
          const label = revealed ? w.word+" ("+(w.g==="m"?"♂ M":w.g==="f"?"♀ F":"⚧ N")+")" : w.word;
          return (
            <button key={i} style={{padding:"8px 14px",border:"2px solid "+bc,borderRadius:10,background:bg,fontSize:13,fontWeight:600,cursor:revealed?"default":"pointer"}}
              onClick={function(){if(!revealed){setRevealedGenders(function(prev){return{...prev,[i]:true}});award(2);}}}
            >{label}</button>
          );
        })}
      </div>
      <h3 className="sh">📐 Make it Plural</h3>
      {GENDERDRILL.plurals.slice(0,10).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:8,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14}}><span style={{fontWeight:700,color:"#164e63"}}>{p.s}</span>{" → ?"}</div>
          {revealedPlurals[i]
            ? <span style={{padding:"6px 12px",border:"2px solid #16a34a",borderRadius:10,background:"#dcfce7",fontSize:12,fontWeight:600}}>{p.p}</span>
            : <button style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
                onClick={function(){setRevealedPlurals(function(prev){return{...prev,[i]:true}});speak(p.p);award(2);}}>Show</button>}
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🎨 Pick the Right Adjective</h3>
      {GENDERDRILL.adjectives.map(function(a,i){return (
        <div key={i} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,marginBottom:6}}><span style={{fontWeight:700,color:"#164e63"}}>{a.noun}</span>{" = "}{a.en}{" → _____ "}{a.noun}</div>
          <div style={{display:"flex",gap:6}}>
            {a.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===a.adj?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===a.adj?"#16a34a":"#dc2626";if(o===a.adj){award(3);speak(a.adj+" "+a.noun);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default GenderDrillScreen;
