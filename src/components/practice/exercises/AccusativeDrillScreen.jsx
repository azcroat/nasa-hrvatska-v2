import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { AKUFOOD, AKUCLOTHES } from '../../../data.jsx';

function AccusativeDrillScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🍽️ Accusative Case","How nouns change after Voliš li / Nosiš li / Jedeš li",goBack)}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Feminine nouns ending in -a change to -u in accusative. Masculine/neuter nouns usually stay the same.</div>
      <h3 className="sh">🍔 Hrana (Food)</h3>
      {shMemo("af",AKUFOOD).map(function(f,i){return (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:12}}><span style={{color:"#78716c"}}>{f.q.replace("_____","")}</span>{" "}<span style={{fontWeight:700,color:"#164e63"}}>{f.nom}</span>{" → ?"}</div>
          <button style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
            onClick={function(/** @type {any} */ e){e.target.textContent=f.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(f.q.replace("_____",f.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>Show</button>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>👚 Odjeća (Clothes)</h3>
      {shMemo("ac",AKUCLOTHES).map(function(cl,i){return (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:12}}><span style={{color:"#78716c"}}>{cl.q.replace("_____","")}</span>{" "}<span style={{fontWeight:700,color:"#164e63"}}>{cl.nom}</span>{" → ?"}</div>
          <button style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
            onClick={function(/** @type {any} */ e){e.target.textContent=cl.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(cl.q.replace("_____",cl.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>Show</button>
        </div>
      );})}
    </div>
  );
}

export default AccusativeDrillScreen;
