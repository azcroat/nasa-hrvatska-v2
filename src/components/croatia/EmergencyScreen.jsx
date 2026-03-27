import React from 'react';
import { H, speak } from '../../data.jsx';
import { EMERGENCY } from '../../data.jsx';

function EmergencyScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🚨 Emergency Phrases","Medical, police, urgent",goBack)}
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2",textAlign:"center"}}>
        <div style={{fontSize:48,fontWeight:800,color:"#dc2626"}}>112</div>
        <div style={{fontSize:14,fontWeight:700}}>{EMERGENCY.number}</div>
      </div>
      {EMERGENCY.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14,color:"#dc2626"}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🦴 Body Parts</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {EMERGENCY.bodyParts.map(function(b,i){return (
          <button key={i} className="c" style={{padding:"8px",textAlign:"center"}} onClick={function(){speak("Boli me "+b[0])}}>
            <div style={{fontSize:13,fontWeight:700}}>{b[0]}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{b[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>📞 Numbers</h3>
      {EMERGENCY.phoneNumbers.map(function(p,i){return (
        <div key={i} style={{display:"flex",gap:12,padding:"6px 0",fontSize:14}}>
          <span style={{fontWeight:800,color:"#dc2626",minWidth:60}}>{p[0]}</span>
          <span>{p[1]}</span>
        </div>
      );})}
    </div>
  );
}

export default EmergencyScreen;
