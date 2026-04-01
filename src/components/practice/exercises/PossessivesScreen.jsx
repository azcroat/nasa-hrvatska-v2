import React from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { POSSESS } from '../../../data.jsx';

function PossessivesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("👤 Possessive Pronouns","moj/moja/moje — changes by noun gender",goBack)}
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Person","M","F","N","English"].map(function(h,i){return (<th key={i} style={{padding:"6px",background:"#0e7490",color:"white"}}>{h}</th>);})}</tr></thead>
          <tbody>
            {POSSESS.table.map(function(r,ri){return (
              <tr key={ri} style={{background:ri%2?"#f0fdfa":"white"}}>
                <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>{r.person}</td>
                {[r.m,r.f,r.n,r.en].map(function(v,vi){return (<td key={vi} style={{padding:"6px",cursor:"pointer"}} role="button" tabIndex={0} onClick={function(){speak(v)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="c" style={{marginBottom:16,padding:"10px",background:"rgba(245,158,11,.06)",fontSize:12}}>💡 Rule: -a noun = -a pronoun (moja kuća), -o/-e noun = -e pronoun (moje selo), consonant noun = no ending (moj stan)</div>
      <h3 className="sh">🎯 Ovo je _____ ...</h3>
      {shMemo("pq",POSSESS.quiz,10).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}>{"("}{q.person}{") Ovo je _____ "}<span style={{fontWeight:700}}>{q.noun}</span></div>
          <div style={{display:"flex",gap:4}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak("Ovo je "+q.a+" "+q.noun);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default PossessivesScreen;
