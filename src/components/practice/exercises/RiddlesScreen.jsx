import React, { useRef, useState } from 'react';
import { H, speak, sh, shMemo } from '../../../data.jsx';
import { RIDDLES } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';

function RiddlesScreen({ goBack, award }) {
  const riddles = shMemo("rid",RIDDLES,8);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect, answer) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) { award(5); speak(answer); }
    if (e.target.closest && e.target.closest("div")) e.target.closest("div").style.pointerEvents = "none";
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= riddles.length && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H("🧩 Što je to?","Read the clues in Croatian, guess the answer!",goBack)}
      {riddles.map(function(r,ri){return (
        <div key={ri} className="c" style={{marginBottom:14,padding:"14px 16px"}}>
          <button aria-label={`Play audio clue: ${r.clue}`} style={{fontSize:14,fontStyle:"italic",color:"#44403c",marginBottom:10,lineHeight:1.5,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(r.clue)}}><span aria-hidden="true">🔊</span> "{r.clue}"</button>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {sh(r.opts).map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 16px",border:"2px solid #d6d3d1",borderRadius:12,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){handleAnswer(e, o===r.answer, r.answer);}}>{o}</button>
            );})}
          </div>
          <div style={{fontSize:11,color:"#a8a29e",marginTop:6}}>{"🇬🇧 "}{r.en}</div>
        </div>
      );})}
      {done && (
        <div className="c" style={{marginTop:16,padding:"20px 16px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>{correctRef.current/riddles.length>=0.8?"🏆":correctRef.current/riddles.length>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:18,fontWeight:800,color:"#164e63",marginBottom:4}}>{correctRef.current}/{riddles.length} correct</div>
          <button className="b bp" style={{marginTop:12}} onClick={goBack}>✓ Done</button>
        </div>
      )}
    </div>
  );
}

export default RiddlesScreen;
