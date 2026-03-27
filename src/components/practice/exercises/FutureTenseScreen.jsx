import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { FUTURE } from '../../../data.jsx';

function FutureTenseScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("🚀 Future Tense","ću, ćeš, će, ćemo, ćete, će + infinitive")}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:13}}>{FUTURE.intro}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {["ja ću","ti ćeš","on/ona će","mi ćemo","vi ćete","oni/one će"].map(function(f,i){return (
          <button key={i} className="c" style={{textAlign:"center",padding:"8px"}} onClick={function(){speak(f)}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0e7490"}}>{f}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("fq",FUTURE.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
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

export default FutureTenseScreen;
