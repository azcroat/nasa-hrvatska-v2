import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { RELPRON } from '../../../data.jsx';

function RelativePronounsScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🔗 Koji, Koja, Koje","Relative pronouns — which/that/who",goBack)}
      <div className="c" style={{marginBottom:16,padding:"12px",fontSize:12,background:"rgba(14,116,144,.06)"}}>{RELPRON.intro}</div>
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["","NOM","GEN","DAT","AKU","LOK"].map(function(h,i){return (<th key={i} style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700}}>{h}</th>);})}</tr></thead>
          <tbody>
            {["m","f","n"].map(function(g,gi){const r=RELPRON.table[g];return (
              <tr key={gi} style={{background:gi%2?"#f0fdfa":"white"}}>
                <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>{g==="m"?"♂ M":g==="f"?"♀ F":"⚧ N"}</td>
                {[r.nom,r.gen,r.dat,r.aku,r.lok].map(function(v,vi){return (<td key={vi} style={{padding:"6px",cursor:"pointer"}} onClick={function(){speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("rp",RELPRON.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default RelativePronounsScreen;
