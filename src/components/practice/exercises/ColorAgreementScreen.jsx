import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { COLORAGREE } from '../../../data.jsx';

function ColorAgreementScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🎨 Color + Gender Agreement","Colors change endings by noun gender — singular AND plural",goBack)}
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>{["Color","M","F","N","M pl","F pl","N pl"].map(function(h,i){return (<th key={i} style={{padding:"6px 4px",background:"#0e7490",color:"white"}}>{h}</th>);})}</tr></thead>
          <tbody>
            {COLORAGREE.colors.map(function(c2,ci){return (
              <tr key={ci} style={{background:ci%2?"#f0fdfa":"white"}}>
                <td style={{padding:"4px",fontWeight:700,color:"#164e63"}}>{c2.en}</td>
                {[c2.m,c2.f,c2.n,c2.mpl,c2.fpl,c2.npl].map(function(v,vi){return (<td key={vi} style={{padding:"4px",cursor:"pointer"}} role="button" tabIndex={0} onClick={function(){speak(v)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <h3 className="sh">🎯 Singular: Pick the right color form</h3>
      {shMemo("cs",COLORAGREE.singQuiz).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}><span style={{fontWeight:700}}>{q.noun}</span>{" ("}{q.en}{") je _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" je "+q.color);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🎯 Plural: Pick the right color form</h3>
      {shMemo("cp",COLORAGREE.plurQuiz).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}><span style={{fontWeight:700}}>{q.noun}</span>{" ("}{q.en}{") su _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" su "+q.color);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default ColorAgreementScreen;
