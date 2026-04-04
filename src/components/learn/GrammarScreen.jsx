import React, { useRef, useMemo, useEffect } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar, speak } from '../../data.jsx';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';
import { logError } from '../../lib/learnerErrors.js';
import { knightSpeak } from '../../lib/knightSpeak.js';

// Local Fisher-Yates shuffle with Math.random() — ensures different question
// order every visit, unlike the date-seeded global sh() which produces the
// same sequence all day (causes Grammar 1 and Grammar 2 to show identical order).
function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GRAMMAR_ENTRY_TIPS = [
  { mood: 'thinking',    text: 'Read the rule first — understand the *why*, and the practice questions answer themselves. 📐' },
  { mood: 'ready',       text: 'Gramatika! Master this one pattern and dozens of sentences unlock instantly. ⚔️' },
  { mood: 'happy',       text: 'Croatian grammar is perfectly logical — every ending tells a story. One rule at a time. 🧩' },
  { mood: 'encouraging', text: 'Read each example sentence aloud before clicking Practice. Your ears remember what eyes forget. 🗣️' },
];

export default function GrammarScreen({
  gl, gp, gx, gs, ga, gsl,
  sGp, sGx, sGs, sGa, sGsl,
  goBack, award, setSt,
}) {
  const { writeDelta } = useStats();
  const resultFired = useRef(false);

  // Knight coaching — entry tip on learn phase
  useEffect(() => {
    const tip = GRAMMAR_ENTRY_TIPS[Math.floor(Math.random() * GRAMMAR_ENTRY_TIPS.length)];
    knightSpeak(tip.mood, tip.text, 900);
  }, []);  

  // Knight coaching — phase transitions
   
  useEffect(() => {
    if (gp === 'ex' && gx === 0) {
      knightSpeak('ready', 'Quiz time! Trust the pattern you just read — your brain already knows the answer. 🎯', 400);
    } else if (gp === 'result') {
      const pct = (gl?.qs?.length ?? 1) > 0 ? gs / (gl?.qs?.length ?? 1) : 0;
      knightSpeak(
        pct === 1 ? 'victory' : pct >= 0.7 ? 'celebrating' : 'encouraged',
        pct === 1 ? 'Savršeno! Perfect grammar score — this rule is yours forever. 🌟' :
        pct >= 0.7 ? `Odlično! ${Math.round(pct * 100)}% — solid Croatian grammar. 💪` :
        'Grammar takes repetition. Come back tomorrow — you\'ll score higher. 🛡️',
        500
      );
    }
  }, [gp]);  

  // Shuffle questions once per lesson (when gl changes) and shuffle each
  // question's options, storing the correct answer by value rather than index.
   
  const shuffledQs = useMemo(() => {
    if (!gl?.qs?.length) return [];
    return _shuffle(gl.qs).map(q => {
      const correctText = q.o[q.c];
      const shuffledOpts = _shuffle(q.o);
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
            else{if(resultFired.current)return;resultFired.current=true;if(typeof award==='function')award(Math.round((gs/qs.length)*25)+10);markQuest('grammar');if(gs===qs.length)markQuest('perfect');setSt(s=>({...s,gc:s.gc+1}));writeDelta({gc:1});sGp("result");}
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
