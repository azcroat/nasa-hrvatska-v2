import React from 'react';
import { H, speak } from '../../data.jsx';
import { FRIENDS } from '../../data.jsx';

function FriendsScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🤝 Making Friends","Real phrases kids use",goBack)}
      {FRIENDS.map(function(f,i){return (
        <button key={i} className="c" style={{marginBottom:8}} onClick={function(){speak(f.hr)}}>
          <div style={{fontSize:15,fontWeight:700,color:"var(--heading)"}}>{f.hr}{" 🔊"}</div>
          <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>{f.en}</div>
        </button>
      );})}
    </div>
  );
}

export default FriendsScreen;
