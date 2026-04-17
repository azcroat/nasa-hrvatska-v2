import React from 'react';
import { H, speak } from '../../../data';
import { SCENES } from '../../../data';

function ScenesScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🖼️ Describe the Scene","Answer questions about everyday situations",goBack)}
      {SCENES.map(function(scene,si){return (
        <div key={si} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:4}}>{scene.title}</div>
          <div style={{fontSize:12,color:"#78716c",marginBottom:10}}>{scene.desc}</div>
          {scene.qs.map(function(q,qi){return (
            <div key={qi} style={{marginBottom:10}}>
              <div role="button" tabIndex={0} aria-label={`Play audio for ${q.q}`} style={{fontSize:13,fontWeight:600,color:"#164e63",cursor:"pointer",marginBottom:4}} onClick={function(){speak(q.q)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();speak(q.q);}}}><span aria-hidden="true">🔊</span>{" "}{q.q}{q.hint?" ("+q.hint+" ...):":""}</div>
              <div style={{fontSize:12,color:"#78716c"}}>{"🇬🇧 "}{q.en}</div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export default ScenesScreen;
