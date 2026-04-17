// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar, Spk, speak } from '../../data';
import { markQuest } from '../../lib/quests.js';

export default function ReadingScreen({
  rp, rph, rqi, rsc, ra, rsl, hw,
  sRph, sRqi, sRsc, sRa, sRsl, sHw,
  goBack, setScr, award, setSt,
}) {
  const { stats, writeDelta } = useStats();
  const resultFired = useRef(false);
  const [passageOpen, setPassageOpen] = useState(true);

  // Reset guard and passage state whenever a new passage is loaded
  useEffect(() => {
    resultFired.current = false;
    setPassageOpen(true);
  }, [rp]);

  if (!rp) return null;
  return (
    <div className="scr-wrap">
      {H("📖 "+rp.title, rp.tEn)}

      {rph==="read" && <React.Fragment>
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

      {rph==="vocab" && <React.Fragment>
        {rp.vocab.map((v,i)=>(
          <button key={i} aria-label={`Play audio for ${v[0]}`} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",padding:"14px 20px"}} onClick={()=>speak(v[0])}>
            <span style={{fontWeight:700}}><span aria-hidden="true">🔊</span> {v[0]}</span>
            <span style={{color:"var(--subtext)"}}>{v[1]}</span>
          </button>
        ))}
        <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{sRph("quiz");sRqi(0);sRa(false);sRsl(-1);}}>Quiz →</button>
      </React.Fragment>}

      {rph==="quiz" && rp.qs[rqi] && <React.Fragment>
        <Bar v={rqi+1} mx={rp.qs.length} color="#4d7c0f" h={6} />

        {/* Passage reference — shown above questions so user can look up answers */}
        <div className="c" style={{marginTop:12,marginBottom:8,padding:"10px 16px"}}>
          <button
            style={{background:"none",border:"none",fontSize:13,fontWeight:600,color:"#0e7490",cursor:"pointer",padding:0,width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:6}}
            onClick={()=>setPassageOpen(o=>!o)}
          >
            <span style={{fontSize:16}}>📄</span>
            <span>{passageOpen ? "Hide" : "Show"} passage</span>
            <span style={{marginLeft:"auto",fontSize:11}}>{passageOpen ? "▲" : "▼"}</span>
          </button>
          {passageOpen && (
            <div style={{marginTop:10,maxHeight:200,overflowY:"auto",borderTop:"1px solid rgba(0,0,0,.06)",paddingTop:10}}>
              <p style={{fontSize:13,lineHeight:1.75,margin:0,color:"#44403c"}}>{rp.text}</p>
            </div>
          )}
        </div>

        <div className="c" style={{marginTop:8}}>
          <p style={{fontSize:18,fontWeight:700,marginBottom:20}}>{rp.qs[rqi].q}</p>
          {/* Disable pointer events on all buttons after an answer is selected */}
          <div style={ra ? {pointerEvents:"none"} : {}}>
            {rp.qs[rqi].o.map((o,i)=>{
              const isCorrect = i === rp.qs[rqi].c;
              const isSelected = rsl === i;
              let cls = "ob";
              if (ra) {
                if (isCorrect) cls = "ob ok";
                else if (isSelected) cls = "ob no";
              }
              return (
                <button key={i} className={cls}
                  onClick={()=>{if(!ra){sRsl(i);sRa(true);if(i===rp.qs[rqi].c)sRsc(s=>s+1);}}}
                >
                  {ra && isCorrect ? "✓ " : ra && isSelected && !isCorrect ? "✗ " : ""}{o}
                </button>
              );
            })}
          </div>
          {ra && <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
            if (rqi < rp.qs.length-1) {
              sRqi(i=>i+1); sRa(false); sRsl(-1);
            } else {
              if (resultFired.current) return;
              resultFired.current = true;
              const readKey = 'reading_' + (rp.title || 'passage').replace(/\s+/g, '_');
              const alreadyDone = stats.vs?.includes(readKey);
              if (typeof award === 'function') award(Math.round((rsc / rp.qs.length) * 35) + 10);
              markQuest('reading');
              if (rsc === rp.qs.length) markQuest('perfect');
              setSt(s => {
                const done = s.vs?.includes(readKey);
                const hasReadlist = s.vs?.includes('readlist');
                const newKeys = [...(done ? [] : [readKey]), ...(hasReadlist ? [] : ['readlist'])];
                if (done && hasReadlist) return { ...s, rc: (s.rc || 0) + 1 };
                return { ...s, rc: (s.rc || 0) + 1, lc: (s.lc || 0) + (done ? 0 : 1), vs: [...(s.vs || []), ...newKeys] };
              });
              if (alreadyDone) writeDelta({ rc: 1 });
              else writeDelta({ rc: 1, lc: 1, vs: [readKey, 'readlist'] });
              sRph("result");
            }
          }}>{rqi < rp.qs.length-1 ? "Next →" : "Results"}</button>}
        </div>
      </React.Fragment>}

      {rph==="result" && <div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64}}>{rsc===rp.qs.length ? "🌟" : rsc >= Math.ceil(rp.qs.length/2) ? "📖" : "💪"}</div>
        <p style={{fontSize:22,fontWeight:700,marginTop:12}}>{rsc}/{rp.qs.length} correct</p>
        <p style={{color:"#78716c",marginTop:4,fontSize:14}}>
          {rsc===rp.qs.length ? "Perfect score! Odlično!" : rsc >= Math.ceil(rp.qs.length/2) ? "Good effort! Keep reading." : "Keep practicing — try again!"}
        </p>
        <button className="b bp" style={{marginTop:24}} onClick={goBack}>Continue →</button>
      </div>}
    </div>
  );
}
