import React from 'react';
import { H, Bar, speak, speakSlow } from '../../data.jsx';

export default function ListeningScreen({
  lsQ, lsI, lsS, lsA, lsSl, lsO,
  sLsQ, sLsI, sLsS, sLsA, sLsSl, sLsO,
  goBack, award, sh,
}) {
  const q = lsQ[lsI];
  if (!q) return null;
  const total = lsQ.length;
  const correct = q.en;
  if (lsI >= total) return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:64}}>{lsS>=total*0.7?"🏆":"👍"}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Listening Complete!</h2>
        <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{lsS} / {total}</div>
        <button className="b bp" style={{marginTop:16}} onClick={()=>{award(lsS*4+10);goBack();}}>Finish!</button>
      </div>
    </div>
  );
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("🎧 Listening Comprehension","Listen, then pick what you heard")}
      <Bar v={lsI+1} mx={total} h={6} />
      <div className="c" style={{marginTop:16,textAlign:"center"}}>
        <div style={{fontSize:14,color:"#78716c",marginBottom:12}}>Listen carefully, then choose what the sentence means:</div>
        <button className="b bp" style={{fontSize:16,padding:"14px 32px"}} onClick={()=>speak(q.hr)}>🔊 Play Sentence</button>
        <button className="b bg" style={{fontSize:13,marginLeft:8,padding:"14px 16px"}} onClick={()=>speakSlow(q.hr)}>🐢 Slow</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
        {lsO.map((o,oi)=>(
          <button key={oi} className={"ob "+(lsA?(o===correct?"ok":lsSl===oi?"no":""):"")}
            onClick={()=>{if(!lsA){sLsSl(oi);sLsA(true);if(o===correct)sLsS(s=>s+1);}}}>
            {o}
          </button>
        ))}
      </div>
      {lsA&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
        if(lsI<total-1){const n=lsQ[lsI+1];sLsO(sh(n.opts));sLsI(i=>i+1);sLsA(false);sLsSl(-1);}
        else sLsI(total);
      }}>{lsI<total-1?"Next →":"See Results"}</button>}
    </div>
  );
}
