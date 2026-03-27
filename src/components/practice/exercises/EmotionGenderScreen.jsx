import React from 'react';
import { H, speak, sh } from '../../../data.jsx';
import { EMOGENDER } from '../../../data.jsx';

function EmotionGenderScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("😀 How Are You Feeling?","Pick the right gender form for emotions")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Croatian adjectives change based on gender. 👨 = masculine ending, 👩 = feminine ending. Tap the correct form!</div>
      {EMOGENDER.map(function(eg,ei){return (
        <div key={ei} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{eg.subj}{" ("}{eg.gender==="m"?"👨":"👩"})</div>
          {eg.pairs.map(function(p,pi){const correct=eg.gender==="m"?p.m:p.f;const wrong=eg.gender==="m"?p.f:p.m;return (
            <div key={pi} style={{display:"flex",gap:8,marginBottom:6}}>
              {sh([correct,wrong]).map(function(o,oi){return (
                <button key={oi} style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                  onClick={function(/** @type {any} */ e){e.target.style.background=o===correct?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===correct?"#16a34a":"#dc2626";if(o===correct){award(2);speak(eg.subj.split("...")[0]+" "+correct);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                  {o}
                </button>
              );})}
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export default EmotionGenderScreen;
