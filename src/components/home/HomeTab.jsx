import React from 'react';
import { Bar, V, LEARN_PATH, getStreak, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak } from '../../data.jsx';

export default function HomeTab({
  name, level, st,
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats,
  award,
  setTab, setScr,
  allCats, sh,
  sMcQ, sMcI, sMcS, sMcA, sMcSl,
  sFcPool, sFcI, sFcFlip, sFcKnow,
}) {
  const dc = getDailyChallenge();
  const ws = getWeekStats();

  return (
    <React.Fragment>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:4}}>⛵</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",fontWeight:800}}>
          {"Dobro došli, "}{name||"!"}
        </h2>
        <p style={{color:"#78716c",fontSize:14}}>
          {"Level "}{level}{" • "}{st.xp}{" XP"}
        </p>
      </div>
      <Bar v={st.xp-lXP(level)} mx={nXP(level)-lXP(level)} />
      <p style={{fontSize:12,color:"#a8a29e",textAlign:"center",marginTop:4,marginBottom:16}}>
        {nXP(level)-st.xp}{" XP to Level "}{level+1}
      </p>
      <div className="c" style={{marginTop:16,padding:"16px 18px",borderLeft:"4px solid #0e7490",background:"linear-gradient(135deg,rgba(14,116,144,.04),rgba(14,116,144,.08))"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>💬 Quick Translate</div>
          <button
            style={{background:"none",border:"1px solid rgba(14,116,144,.2)",borderRadius:10,padding:"8px 14px",fontSize:11,fontWeight:700,color:"#0e7490",cursor:"pointer"}}
            onClick={() => sTDir(tDir==="en-hr"?"hr-en":"en-hr")}>
            {tDir==="en-hr"?"EN → HR":"HR → EN"}
          </button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            type="text"
            value={tIn}
            onChange={e => sTIn(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter") doTr(); }}
            placeholder={tDir==="en-hr"?"Type English...":"Unesite hrvatski..."}
            style={{flex:1,fontSize:15,padding:"12px 14px"}} />
          <button className="b bp" style={{fontSize:14,padding:"10px 18px",whiteSpace:"nowrap"}} onClick={doTr} disabled={tL}>
            {tL?"⏳":"🔍"}
          </button>
        </div>
        {tOut&&<div
          style={{marginTop:10,padding:"12px 14px",background:"rgba(255,255,255,.7)",borderRadius:12,fontSize:16,fontWeight:700,color:"#164e63",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
          onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
          <span>{tOut}</span>
          <span style={{fontSize:13,color:"#0e7490"}}>🔊</span>
        </div>}
      </div>
      <div className="c" style={{marginBottom:16,padding:"14px 16px",background:"linear-gradient(135deg,rgba(14,116,144,.04),rgba(14,116,144,.08))",borderLeft:"4px solid #0e7490"}}>
        <div style={{fontSize:12,fontWeight:800,color:"#0e7490",marginBottom:8}}>📊 WEEKLY PROGRESS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[{v:ws.lessons,l:"Lessons",i:"📚"},{v:ws.grammar,l:"Grammar",i:"📝"},{v:ws.streak,l:"Streak",i:"🔥"},{v:ws.strong,l:"Mastered",i:"💪"}].map((s,i) => (
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:16}}>{s.i}</div>
              <div style={{fontSize:18,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:10,color:"#78716c"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {ws.weak>0&&<div style={{fontSize:12,color:"#b45309",marginTop:8}}>
          {"⚠️ "}{ws.weak}{" words need review"}
        </div>}
      </div>
      <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px",marginBottom:16}} onClick={() => setScr("learnpath")}>
        <div style={{fontSize:36}}>📈</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63"}}>My Learning Path</div>
          <div style={{fontSize:12,color:"#78716c"}}>
            {(function(){var d=0,t=0;LEARN_PATH.forEach(function(lv){lv.items.forEach(function(it){t++;if(it.ck(st))d++;})});return d+"/"+t+" • "+Math.round(d/t*100)+"%"})()}
          </div>
        </div>
        <div style={{fontSize:24}}>→</div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        <div className="c" style={{flex:1,textAlign:"center",padding:"12px"}}>
          <div style={{fontSize:28}}>🔥</div>
          <div style={{fontSize:20,fontWeight:800}}>{getStreak().count}</div>
          <div style={{fontSize:11,color:"#78716c"}}>Day Streak</div>
        </div>
        <div className="c" style={{flex:1,textAlign:"center",padding:"12px"}}>
          <div style={{fontSize:28}}>⭐</div>
          <div style={{fontSize:20,fontWeight:800}}>{st.xp}</div>
          <div style={{fontSize:11,color:"#78716c"}}>Total XP</div>
        </div>
        <div className="c" style={{flex:1,textAlign:"center",padding:"12px"}}>
          <div style={{fontSize:28}}>📚</div>
          <div style={{fontSize:20,fontWeight:800}}>{st.lc}</div>
          <div style={{fontSize:11,color:"#78716c"}}>Lessons</div>
        </div>
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",cursor:"pointer"}} onClick={() => speak(getProverbOfDay().hr)}>
        <div style={{fontSize:12,fontWeight:800,color:"#b45309",marginBottom:6}}>🌟 POSLOVICA DANA</div>
        <div style={{fontSize:15,fontWeight:700,color:"#92400e",fontStyle:"italic"}}>{getProverbOfDay().hr}{" 🔊"}</div>
        <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{getProverbOfDay().en}</div>
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",cursor:"pointer"}} onClick={() => speak(getHistFact().hr)}>
        <div style={{fontSize:12,fontWeight:800,color:"#7c3aed",marginBottom:6}}>🏛️ POVIJESNA ČINJENICA DANA</div>
        <div style={{fontSize:15,fontWeight:700,color:"#581c87",fontStyle:"italic"}}>{getHistFact().hr}{" 🔊"}</div>
        <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{getHistFact().en}</div>
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#7c3aed",marginBottom:4}}>🎯 DAILY CHALLENGE</div>
            <div style={{fontSize:15,fontWeight:700,color:"#1c1917"}}>{dc.challenge.q}</div>
          </div>
          {!dchlA?<div style={{display:"flex",flexDirection:"column",gap:4}}>
            {dc.challenge.opts.map((o, oi) => (
              <button
                key={oi}
                style={{padding:"6px 12px",border:"1px solid "+(dchlA?(o===dc.challenge.a?"#16a34a":dchlSl===oi?"#dc2626":"#e7e5e4"):"#d6d3d1"),borderRadius:10,background:dchlA?(o===dc.challenge.a?"#dcfce7":dchlSl===oi?"#fee2e2":"white"):"white",fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"left"}}
                onClick={() => {
                  if (!dchlA) {
                    sDchlSl(oi);
                    sDchlA(true);
                    localStorage.setItem("dcDay", String(Math.floor(Date.now()/86400000)));
                    if (o === dc.challenge.a) award(10);
                  }
                }}>
                {o}
              </button>
            ))}
          </div>:
          <div style={{textAlign:"center",padding:"8px"}}>
            <div style={{fontSize:24}}>✅</div>
            <div style={{fontSize:12,color:"#7c3aed",fontWeight:700}}>Answered! New challenge tomorrow.</div>
          </div>}
        </div>
      </div>
      <h3 className="sh" style={{marginTop:8}}>⚡ Quick Start</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setTab("learn")}>
          <div style={{fontSize:28}}>📚</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Continue Learning</div>
            <div style={{fontSize:11,color:"#78716c"}}>{allCats.length+" categories"}</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => {
          const pool = allCats.flatMap(cc => V[cc]);
          const items = sh(pool).slice(0,10);
          sMcQ(items.map(w => { const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; }));
          sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
        }}>
          <div style={{fontSize:28}}>🎮</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Quick Quiz</div>
            <div style={{fontSize:11,color:"#78716c"}}>Random 10 words</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => {
          const pool = allCats.flatMap(cc => V[cc]);
          sFcPool(sh(pool).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards");
        }}>
          <div style={{fontSize:28}}>🃏</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Flashcards</div>
            <div style={{fontSize:11,color:"#78716c"}}>20 random words</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setTab("croatia")}>
          <div style={{fontSize:28}}>🇭🇷</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Life in Croatia</div>
            <div style={{fontSize:11,color:"#78716c"}}>School, food, sports</div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
