import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { POSSESS } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';

function PossessivesScreen({ goBack, award }) {
  const questions = shMemo("pq",POSSESS.quiz,10);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect, spoken) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) { award(3); speak(spoken); }
    if (e.target.closest && e.target.closest("div")) e.target.closest("div").style.pointerEvents = "none";
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= questions.length && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

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
      {questions.map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}>{"("}{q.person}{") Ovo je _____ "}<span style={{fontWeight:700}}>{q.noun}</span></div>
          <div style={{display:"flex",gap:4}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(e){handleAnswer(e, o===q.a, "Ovo je "+q.a+" "+q.noun);}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
      {done && (
        <div className="c" style={{marginTop:16,padding:"20px 16px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>{correctRef.current/questions.length>=0.8?"🏆":correctRef.current/questions.length>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:18,fontWeight:800,color:"#164e63",marginBottom:4}}>{correctRef.current}/{questions.length} correct</div>
          <button className="b bp" style={{marginTop:12}} onClick={goBack}>✓ Done</button>
        </div>
      )}
    </div>
  );
}

export default PossessivesScreen;
