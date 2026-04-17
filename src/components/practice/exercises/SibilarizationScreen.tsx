// @ts-nocheck
import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { SIBIL } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

function SibilarizationScreen({ goBack, award }) {
  const questions = shMemo("sq",SIBIL.quiz);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect, spoken) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) { if (typeof award === 'function') award(3); speak(spoken); }
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
      {H("🔄 Sibilarizacija","k→c, g→z, h→s before -i",goBack)}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(245,158,11,.06)",fontSize:13}}>{SIBIL.intro}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {SIBIL.examples.map(function(ex,i){return (
          <button key={i} className="c" style={{padding:"8px 12px",textAlign:"center"}} onClick={function(){speak(ex.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--heading)"}}>{ex.nom}{" → "}{ex.lok}</div>
            <div style={{fontSize:11,color:"#b45309"}}>{ex.rule}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {questions.map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {sh(q.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){handleAnswer(e, o===q.a, q.q.replace("_____",q.a).split("(")[0]);}}>
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

export default SibilarizationScreen;
