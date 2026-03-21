import React, { useRef } from 'react';
import { H, Bar, Spk, speak, srMark, sh, shuffleArr, V } from '../../data.jsx';

export default function LessonScreen({
  lt, li, lx, ls, lp, la, lsl, qi, icons,
  sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
  goBack, award, setSt,
}) {
  const resultFired = useRef(false);
  return (
    <div className="scr-wrap">
      
      {lp==="learn"&&<React.Fragment>
        {H((icons[lt]||"📚")+" "+lt)}
        {li.map((w,i)=>(
          <div key={i} className="c" onClick={()=>speak(w[0])} style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:20}}>🔊</span>
              <div>
                <div style={{fontSize:18,fontWeight:700}}>{w[0]}</div>
                {w[2]&&<div style={{fontSize:12,color:"#78716c"}}>/{w[2]}/</div>}
              </div>
            </div>
            <div style={{color:"#44403c"}}>{w[1]}</div>
          </div>
        ))}
        {li.length>=4&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
          const qPool=sh(li).slice(0,Math.min(li.length,15));
          const q=qPool.map(w=>{const wr=sh(li.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]);const o=sh([w[1],...wr]);return{...w,opts:o,ci:o.indexOf(w[1])};});
          sQi(q);sLx(0);sLp("quiz");sLa(false);sLsl(-1);
        }}>Quiz Me! →</button>}
      </React.Fragment>}
      {lp==="quiz"&&qi[lx]&&<React.Fragment>
        <Bar v={lx+1} mx={qi.length} h={6} />
        <div className="c" style={{marginTop:16}}>
          <div onClick={()=>speak(qi[lx][0])} style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,cursor:"pointer"}}>
            <span style={{fontSize:22}}>🔊</span>
            <p style={{fontSize:24,fontWeight:800,margin:0}}>{qi[lx][0]}</p>
          </div>
          {qi[lx].opts.map((o,i)=>(
            <button key={i} className={"ob "+(la?(i===qi[lx].ci?"ok":lsl===i?"no":""):"")}
              onClick={()=>{if(!la){sLsl(i);sLa(true);const ok=i===qi[lx].ci;if(ok)sLs(s=>s+1);srMark(qi[lx][0],ok);}}}>
              {o}
            </button>
          ))}
          {la&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
            if(lx<qi.length-1){sLx(i=>i+1);sLa(false);sLsl(-1);}
            else{if(resultFired.current)return;resultFired.current=true;const p=ls/qi.length;award(Math.round(p*30)+5);setSt(s=>({...s,lc:s.lc+1,pf:p===1?s.pf+1:s.pf,rs:[...s.rs,p],ct:[...new Set([...s.ct,lt])]}));sLp("result");}
          }}>{lx<qi.length-1?"Next →":"Results"}</button>}
        </div>
      </React.Fragment>}
      {lp==="result"&&<div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64}}>{ls===qi.length?"🌟":"🎉"}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>{ls===qi.length?"Perfect!":"Great Job!"}</h2>
        <p style={{color:"#78716c",marginTop:8}}>{ls}/{qi.length}</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:32}}>
          <button className="b bg" onClick={()=>{resultFired.current=false;sLi(shuffleArr(V[lt]));sLx(0);sLs(0);sLp("learn");sLa(false);}}>Retry</button>
          <button className="b bp" onClick={goBack}>Continue →</button>
        </div>
      </div>}
    </div>
  );
}
