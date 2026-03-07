import React from 'react';
import { H, Bar, Spk, speak } from '../../data.jsx';

export default function ReadingScreen({
  rp, rph, rqi, rsc, ra, rsl, hw,
  sRph, sRqi, sRsc, sRa, sRsl, sHw,
  goBack, setScr, award, setSt,
}) {
  if (!rp) return null;
  return (
    <div className="scr-wrap">
      
      {H("📖 "+rp.title,rp.tEn)}
      {rph==="read"&&<React.Fragment>
        <div className="c" style={{marginBottom:16}}>
          <Spk text={rp.text} label="Listen" />
          <p className="rt" style={{marginTop:12}}>
            {rp.text.split(/(\s+)/).map((w,i)=>/^\s+$/.test(w)?w:(
              <span key={i} className="w"
                onClick={()=>{speak(w.replace(/[.,!?]/g,""));sHw(w);}}
                style={hw===w?{background:"rgba(14,116,144,.15)"}:{}}>
                {w}
              </span>
            ))}
          </p>
        </div>
        <button className="b bp" style={{width:"100%"}} onClick={()=>sRph("vocab")}>Study Vocabulary →</button>
      </React.Fragment>}
      {rph==="vocab"&&<React.Fragment>
        {rp.vocab.map((v,i)=>(
          <div key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",padding:"14px 20px",cursor:"pointer"}} onClick={()=>speak(v[0])}>
            <span style={{fontWeight:700}}>🔊 {v[0]}</span>
            <span style={{color:"#78716c"}}>{v[1]}</span>
          </div>
        ))}
        <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{sRph("quiz");sRqi(0);sRa(false);sRsl(-1);}}>Quiz →</button>
      </React.Fragment>}
      {rph==="quiz"&&rp.qs[rqi]&&<React.Fragment>
        <Bar v={rqi+1} mx={rp.qs.length} color="#4d7c0f" h={6} />
        <div className="c" style={{marginTop:16}}>
          <p style={{fontSize:18,fontWeight:700,marginBottom:20}}>{rp.qs[rqi].q}</p>
          {rp.qs[rqi].o.map((o,i)=>(
            <button key={i} className={"ob "+(ra?(i===rp.qs[rqi].c?"ok":rsl===i?"no":""):"")}
              onClick={()=>{if(!ra){sRsl(i);sRa(true);if(i===rp.qs[rqi].c)sRsc(s=>s+1);}}}>
              {o}
            </button>
          ))}
          {ra&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
            if(rqi<rp.qs.length-1){sRqi(i=>i+1);sRa(false);sRsl(-1);}
            else{award(Math.round((rsc/rp.qs.length)*35)+10);setSt(s=>({...s,rc:s.rc+1}));sRph("result");}
          }}>{rqi<rp.qs.length-1?"Next →":"Results"}</button>}
        </div>
      </React.Fragment>}
      {rph==="result"&&<div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64}}>{rsc===rp.qs.length?"🌟":"📖"}</div>
        <p style={{color:"#78716c",marginTop:8}}>{rsc}/{rp.qs.length}</p>
        <button className="b bp" style={{marginTop:24}} onClick={goBack}>Continue →</button>
      </div>}
    </div>
  );
}
