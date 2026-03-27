import React from 'react';
import { H, speak } from '../../data.jsx';
import { TRANSPORT } from '../../data.jsx';

function TransportScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🚌 Getting Around","Bus, tram, taxi phrases",goBack)}
      {TRANSPORT.map(function(t,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(t.hr)}}>
          <span style={{fontWeight:700,fontSize:14}}>{t.hr}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{t.en}</span>
        </button>
      );})}
    </div>
  );
}

export default TransportScreen;
