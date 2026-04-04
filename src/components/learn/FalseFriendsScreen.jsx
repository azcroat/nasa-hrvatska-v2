import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { FALSEFR } from '../../data.jsx';

function FalseFriendsScreen({ goBack, award }) {
  const [completed, setCompleted] = useState(false);

  function handleComplete() {
    if (completed) return;
    setCompleted(true);
    if (award) award(30);
    goBack();
  }

  return (
    <div className="scr-wrap">

      {H("⚠️ False Friends","Croatian words that trick English speakers",goBack)}
      {FALSEFR.map(function(f,i){return (
        <button key={i} aria-label={`Play audio for ${f.hr}`} className="c" style={{marginBottom:10}} onClick={function(){speak(f.hr)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{f.hr}{" "}<span aria-hidden="true">🔊</span></span>
            <span style={{fontSize:14,color:"#78716c"}}>{"Looks like: "}{f.looks}</span>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:4}}>{"Actually means: "}{f.means}</div>
          {f.ex&&<div style={{fontSize:12,color:"var(--subtext)",fontStyle:"italic",marginTop:2}}>{f.ex}</div>}
        </button>
      );})}

      <button
        onClick={handleComplete}
        style={{
          width:"100%", marginTop:16, padding:"14px 0",
          background:"linear-gradient(135deg,#0e7490,#164e63)",
          color:"white", border:"none", borderRadius:14,
          fontSize:16, fontWeight:700, cursor:"pointer",
        }}
      >
        {"Complete Lesson  +30 XP"}
      </button>

    </div>
  );
}

export default FalseFriendsScreen;
