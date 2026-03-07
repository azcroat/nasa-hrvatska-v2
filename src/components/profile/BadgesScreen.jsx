import React from 'react';
import { H, BADGES } from '../../data.jsx';

export default function BadgesScreen({ badges, goBack }) {
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🏆 Achievements")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {BADGES.map(b=>{
          const u=badges.includes(b.id);
          return (
            <div key={b.id} className="c" style={{textAlign:"center",opacity:u?1:.4,border:u?"2px solid #fbbf24":undefined}}>
              <div style={{fontSize:36}}>{b.i}</div>
              <div style={{fontSize:14,fontWeight:700}}>{b.n}</div>
              <div style={{fontSize:11,color:"#78716c",marginTop:4}}>{b.d}</div>
              {u&&<div style={{fontSize:11,color:"#b45309",marginTop:6,fontWeight:700}}>✓ Earned</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
