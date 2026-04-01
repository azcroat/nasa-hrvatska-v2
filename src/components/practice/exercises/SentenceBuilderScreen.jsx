import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { SENTBUILD } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';

function SentenceBuilderScreen({ goBack, award }) {
  const questions = shMemo("sb",SENTBUILD,15);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) award(5);
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
      {H("🏗️ Build the Sentence","Translate English to Croatian",goBack)}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12,color:"#164e63"}}>🇬🇧 Read the English sentence, then pick the correct Croatian translation.</div>
      {questions.map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:6}}>{"🇬🇧 "}{s.en}</div>
          {sh(s.opts).map(function(o,oi){return (
            <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:13,textAlign:"left",cursor:"pointer"}}
              onClick={function(e){handleAnswer(e, o===s.hr); if(o===s.hr)speak(s.hr);}}>
              {"🇭🇷 "}{o}
            </button>
          );})}
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

export default SentenceBuilderScreen;
