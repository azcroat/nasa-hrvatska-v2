import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { CITYLOC } from '../../../data.jsx';

function CityLocativeScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🏙️ Where Do You Live?","City & country names in locative case")}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 "Gdje živiš?" uses the locative case. Zagreb → u Zagrebu, Hrvatska → u Hrvatskoj.</div>
      <h3 className="sh">🏙️ Gradovi (Cities)</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {CITYLOC.cities.map(function(c2,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}} onClick={function(){speak("Živim u "+c2.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>{c2.nom}</div>
            <div style={{fontSize:12,color:"#0e7490"}}>{"→ u "}{c2.lok}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🌍 Države (Countries)</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {CITYLOC.countries.map(function(c2,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}} onClick={function(){speak(c2.nom+" - u "+c2.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>{c2.nom}</div>
            <div style={{fontSize:12,color:"#b45309"}}>{"→ u "}{c2.lok}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🎯 Quick Quiz</h3>
      {shMemo("cl",CITYLOC.cities,8).map(function(c2,i){const wrong=CITYLOC.cities[(i+3)%CITYLOC.cities.length].lok;return (
        <div key={i} className="c" style={{marginBottom:6,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13}}>{c2.nom}{" → u _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {sh([c2.lok,wrong]).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===c2.lok?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===c2.lok?"#16a34a":"#dc2626";if(o===c2.lok)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default CityLocativeScreen;
