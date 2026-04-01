import React, { useRef, useState } from 'react';
import { H, speak, sh } from '../../../data.jsx';
import { CONVMATCH } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';

function ConvMatchScreen({ goBack, award }) {
  const total = CONVMATCH.reduce(function(sum, conv){ return sum + conv.pairs.length; }, 0);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect, answer) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) { if (typeof award === 'function') award(5); speak(answer); }
    if (e.target.closest && e.target.closest("div")) e.target.closest("div").style.pointerEvents = "none";
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= total && !done) {
      markQuest('speak');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H("💬 Conversation Match","Pick the right response",goBack)}
      {CONVMATCH.map(function(conv,ci){return (
        <div key={ci} className="c" style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"🗣️ "}{conv.title}</div>
          {conv.pairs.map(function(p,pi){return (
            <div key={pi} style={{marginBottom:12,paddingBottom:12,borderBottom:pi<conv.pairs.length-1?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63",marginBottom:6,cursor:"pointer"}} onClick={function(){speak(p.q)}}>{"🗣️ "}{p.q}</div>
              {sh([p.a,p.wrong]).map(function(o,oi){return (
                <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:12,textAlign:"left",cursor:"pointer"}}
                  onClick={function(e){handleAnswer(e, o===p.a, p.a);}}>{o}</button>
              );})}
            </div>
          );})}
        </div>
      );})}
      {done && (
        <div className="c" style={{marginTop:16,padding:"20px 16px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>{correctRef.current/total>=0.8?"🏆":correctRef.current/total>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:18,fontWeight:800,color:"#164e63",marginBottom:4}}>{correctRef.current}/{total} correct</div>
          <button className="b bp" style={{marginTop:12}} onClick={goBack}>✓ Done</button>
        </div>
      )}
    </div>
  );
}

export default ConvMatchScreen;
