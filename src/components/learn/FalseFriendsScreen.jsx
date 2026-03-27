import React from 'react';
import { H, speak } from '../../data.jsx';
import { FALSEFR } from '../../data.jsx';

function FalseFriendsScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("⚠️ False Friends","Croatian words that trick English speakers",goBack)}
      {FALSEFR.map(function(f,i){return (
        <button key={i} className="c" style={{marginBottom:10}} onClick={function(){speak(f.hr)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{f.hr}{" 🔊"}</span>
            <span style={{fontSize:14,color:"#78716c"}}>{"Looks like: "}{f.looks}</span>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:4}}>{"Actually means: "}{f.means}</div>
          {f.ex&&<div style={{fontSize:12,color:"var(--subtext)",fontStyle:"italic",marginTop:2}}>{f.ex}</div>}
        </button>
      );})}
    </div>
  );
}

export default FalseFriendsScreen;
