import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { ADJOPPOSITES } from '../../../data.jsx';

function OppositesScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("↔️ Opposites","Learn adjective pairs with animals")}
      {shMemo("ao",ADJOPPOSITES).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,textAlign:"center",cursor:"pointer"}} onClick={function(){speak(p.ex.a)}}>
            <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>{p.a}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{p.ex.a}</div>
          </div>
          <div style={{fontSize:18,color:"#d6d3d1"}}>↔</div>
          <div style={{flex:1,textAlign:"center",cursor:"pointer"}} onClick={function(){speak(p.ex.b)}}>
            <div style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{p.b}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{p.ex.b}</div>
          </div>
        </div>
      );})}
    </div>
  );
}

export default OppositesScreen;
