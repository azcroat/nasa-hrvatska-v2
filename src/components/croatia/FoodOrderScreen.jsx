import React from 'react';
import { H, speak } from '../../data.jsx';
import { FOODORDER } from '../../data.jsx';

function FoodOrderScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🍕 Ordering Food","Bakery, fast food, ice cream, restaurants",goBack)}
      {[FOODORDER.bakery,FOODORDER.fastfood,FOODORDER.icecream].map(function(sec,si){return (
        <div key={si} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:"#b45309",marginBottom:10}}>{sec.title}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
            {sec.items.map(function(w,i){return (
              <button key={i} style={{padding:"4px 6px",fontSize:13,background:"rgba(14,116,144,.07)",border:"1px solid rgba(14,116,144,.18)",borderRadius:6,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",color:"var(--text)"}} onClick={function(){speak(w[0])}}>
                <span style={{fontWeight:700,color:"var(--accent,#0e7490)"}}>{w[0]}</span>{" — "}{w[1]}
              </button>
            );})}
          </div>
          <div style={{borderTop:"1px solid var(--card-b)",paddingTop:8}}>
            {sec.phrases.map(function(p,i){return (
              <button key={i} style={{display:"block",width:"100%",fontSize:13,padding:"5px 8px",marginBottom:3,fontWeight:600,color:"var(--heading)",background:"rgba(14,116,144,.06)",border:"1px solid rgba(14,116,144,.15)",borderRadius:7,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(p)}}>{p}{" 🔊"}</button>
            );})}
          </div>
        </div>
      );})}
      <div className="c" style={{borderLeft:"4px solid #f59e0b"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>💡 Tipping</div>
        <div style={{fontSize:13}}>{FOODORDER.restaurant.tip}</div>
      </div>
      <h3 className="sh" style={{marginTop:16}}>🍽️ Restaurant Phrases</h3>
      {FOODORDER.restaurant.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
    </div>
  );
}

export default FoodOrderScreen;
