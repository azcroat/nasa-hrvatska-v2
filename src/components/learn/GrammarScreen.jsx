import React, { useRef, useMemo } from 'react';
import { H, Bar, speak, sh } from '../../data.jsx';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';
import { logError } from '../../lib/learnerErrors.js';

export default function GrammarScreen({
  gl, gp, gx, gs, ga, gsl,
  sGp, sGx, sGs, sGa, sGsl,
  goBack, award, setSt,
}) {
  const resultFired = useRef(false);

  // Shuffle questions once per lesson (when gl changes) and shuffle each
  // question's options, storing the correct answer by value rather than index.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledQs = useMemo(() => {
    if (!gl?.qs?.length) return [];
    return sh([...gl.qs]).map(q => {
      const correctText = q.o[q.c];
      const shuffledOpts = sh([...q.o]);
      return { ...q, o: shuffledOpts, c: shuffledOpts.indexOf(correctText) };
    });
  }, [gl]);

  if (!gl) return null;
  const qs = shuffledQs.length ? shuffledQs : (gl.qs || []);
  const currentQ = qs[gx];

  return (
    <div className="scr-wrap">

      {gp==="learn"&&<React.Fragment>
        {H("📐 "+gl.title)}
        <div className="c" style={{marginBottom:16}}>
          <p style={{fontSize:15,color:"#44403c",lineHeight:1.7}}>{gl.desc}</p>
        </div>
        {gl.exs.map((e,i)=>(
          <button key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",padding:"14px 20px"}} onClick={()=>speak(e[0])}>
            <span style={{fontWeight:700}}>{e[0]}</span>
            <span style={{color:"var(--subtext)"}}>{e[1]}</span>
          </button>
        ))}
        <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{sGp("ex");sGx(0);sGa(false);sGsl(-1);}}>Practice →</button>
      </React.Fragment>}
      {gp==="ex"&&currentQ&&<React.Fragment>
        <Bar v={gx+1} mx={qs.length} color="#b45309" h={6} />
        <div style={{textAlign:'right',marginBottom:4}}>
          <button
            onClick={goBack}
            style={{
              background:'none', border:'none',
              fontSize:'var(--text-sm)', color:'var(--subtext)',
              cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              fontWeight:700, padding:'4px 8px',
            }}>
            ✕ Exit
          </button>
        </div>
        <div className="c" style={{marginTop:8}}>
          <p style={{fontSize:20,fontWeight:700,marginBottom:20}}>{currentQ.q}</p>
          {currentQ.o.map((o,i)=>(
            <button key={i} className={"ob "+(ga?(i===currentQ.c?"ok":gsl===i?"no":""):"")}
              onClick={()=>{if(!ga){sGsl(i);sGa(true);const correct=i===currentQ.c;if(correct)sGs(s=>s+1);else logError(gl.title||'grammar_general','grammar',{wrong:o,correct:currentQ.o[currentQ.c],source:'grammar_screen'});recordTopicResult('grammar',correct);}}}>
              {o}
            </button>
          ))}
          {ga&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
            if(gx<qs.length-1){sGx(i=>i+1);sGa(false);sGsl(-1);}
            else{if(resultFired.current)return;resultFired.current=true;award(Math.round((gs/qs.length)*25)+10);markQuest('grammar');if(gs===qs.length)markQuest('perfect');setSt(s=>({...s,gc:s.gc+1}));sGp("result");}
          }}>{gx<qs.length-1?"Next →":"Results"}</button>}
        </div>
      </React.Fragment>}
      {gp==="result"&&<div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64}}>📝</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>Score: {gs}/{qs.length}</h2>
        <button className="b bp" style={{marginTop:24}} onClick={goBack}>Continue →</button>
      </div>}
    </div>
  );
}
