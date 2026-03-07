import React, { useState } from 'react';
import { H, Bar, speak, STORIES } from '../../data.jsx';

// Single component managing both story selection and playback
export default function StoryScreens({ goBack, award, sCurEx }) {
  const [stSt, sStSt] = useState(null);
  const [stSc, sStSc] = useState(0);

  if (!stSt) {
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📖 Mini Stories","Interactive stories where YOU choose what happens")}
        {STORIES.map((s, i) => (
          <div
            key={i}
            className="tc"
            onClick={() => { sStSt(s); sStSc(0); if (sCurEx) sCurEx("story"); }}
            style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <div style={{fontSize:36}}>
              {i === 0 ? "☕" : i === 1 ? "🍒" : "🏖️"}
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>{s.title}</div>
              <div style={{fontSize:12,color:"#78716c"}}>{s.tEn} · {s.scenes.length} scenes</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const scene = stSt.scenes[stSc];

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button
        className="b bg"
        style={{marginBottom:16,fontSize:13}}
        onClick={() => sStSt(null)}>
        ← Back
      </button>
      {H("📖 " + stSt.title, stSt.tEn)}
      {!scene ? (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>🌟</div>
          <h3>Story complete!</h3>
          <button
            className="b bp"
            style={{marginTop:16}}
            onClick={() => { award(15); sStSt(null); }}>
            Back to Stories
          </button>
        </div>
      ) : (
        <React.Fragment>
          <Bar v={stSc + 1} mx={stSt.scenes.length} h={6} />
          <div className="c" style={{marginTop:16}}>
            <div
              style={{fontSize:16,fontWeight:700,lineHeight:1.7,color:"#1c1917",cursor:"pointer"}}
              onClick={() => speak(scene.text)}>
              {scene.text} 🔊
            </div>
            <div style={{fontSize:14,color:"#78716c",fontStyle:"italic",marginTop:8,lineHeight:1.6}}>
              {scene.en}
            </div>
          </div>
          {scene.choices.length > 0 ? (
            <div style={{marginTop:16}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0e7490",marginBottom:8}}>
                Što radiš? — What do you do?
              </div>
              {scene.choices.map((ch, ci) => (
                <button
                  key={ci}
                  className="ob"
                  style={{borderColor:"#0e7490"}}
                  onClick={() => sStSc(ch.next)}>
                  {ch.text}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="b bp"
              style={{width:"100%",marginTop:20}}
              onClick={() => { award(15); sStSt(null); }}>
              ✅ Story Complete!
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
