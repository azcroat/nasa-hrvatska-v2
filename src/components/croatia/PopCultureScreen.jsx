import React from 'react';
import { H } from '../../data.jsx';
import { POPCULTURE } from '../../data.jsx';

function PopCultureScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🎵 Croatian Pop Culture","Music, TV & artists your friends know",goBack)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {POPCULTURE.map(function(p,i){return (
          <button key={i} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}
            onClick={function(e){e.preventDefault();window.open(p.web,"_blank","noopener,noreferrer")}}>
            <div style={{fontSize:24}}>{p.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--heading)"}}>{p.name}</div>
              <div style={{fontSize:11,color:"var(--subtext)"}}>{p.desc}</div>
            </div>
          </button>
        );})}
      </div>
    </div>
  );
}

export default PopCultureScreen;
