import React from 'react';
import { Bar, V, LEARN_PATH, getStreak, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak, getSR } from '../../data.jsx';

export default function HomeTab({
  name, level, st,
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats,
  award,
  setTab, setScr, sCurEx,
  allCats, sh,
  sMcQ, sMcI, sMcS, sMcA, sMcSl,
  sFcPool, sFcI, sFcFlip, sFcKnow,
}) {
  const dc = getDailyChallenge();
  const ws = getWeekStats();
  const streak = getStreak();
  const proverb = getProverbOfDay();
  const fact = getHistFact();
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  // opts are already seeded-shuffled per day by getDailyChallenge — no random re-shuffle needed
  const allOpts = dc.challenges.map(ch => ch.opts || [ch.a]);

  const doneCount = dchlA.filter(Boolean).length;
  const allDone = doneCount === 3;

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Dobro jutro";
    if (h < 18) return "Dobar dan";
    return "Dobra večer";
  };

  const completedItems = (() => {
    let d = 0, t = 0;
    LEARN_PATH.forEach(lv => lv.items.forEach(it => { t++; if (it.ck(st)) d++; }));
    return { d, t, pct: Math.round(d / t * 100) };
  })();

  return (
    <React.Fragment>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(145deg,#0c4a6e 0%,#0e7490 55%,#0369a1 100%)",
        borderRadius: 24, padding: "22px 20px", marginBottom: 16,
        position: "relative", overflow: "hidden", color: "white",
        boxShadow: "0 8px 32px rgba(14,116,144,.3)"
      }}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:11,fontWeight:600,opacity:.65,marginBottom:2,letterSpacing:".05em",textTransform:"uppercase"}}>
            {greetingByTime()}
          </div>
          <div style={{fontSize:24,fontWeight:900,fontFamily:"'Playfair Display',serif",marginBottom:16,letterSpacing:"-.01em",lineHeight:1.1}}>
            {name || "Učenik"} 👋
          </div>
          <div style={{background:"rgba(255,255,255,.12)",borderRadius:14,padding:"11px 14px",backdropFilter:"blur(10px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
              <span style={{fontSize:12,fontWeight:800}}>Level {level}</span>
              <span style={{fontSize:11,opacity:.65,fontWeight:500}}>{xpPct}% to Level {level + 1}</span>
            </div>
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:8,height:7,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#7dd3fc,#e0f2fe)",borderRadius:8,
                width:xpPct+"%",transition:"width .7s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:10,opacity:.55}}>{st.xp.toLocaleString()} XP total</span>
              <span style={{fontSize:10,opacity:.55}}>{(nXP(level) - st.xp).toLocaleString()} XP to go</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {[
          {icon:"🔥",value:streak.count,         label:"Day Streak",color:"#f59e0b",bg:"#fffbeb",border:"#fde68a"},
          {icon:"⭐",value:st.xp.toLocaleString(),label:"Total XP",  color:"#0e7490",bg:"#f0f9ff",border:"#bae6fd"},
          {icon:"📚",value:st.lc,                label:"Lessons",   color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},
          {icon:"💪",value:ws.strong,            label:"Mastered",  color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"},
        ].map((s,i) => (
          <div key={i} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:900,color:s.color,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── DAILY CHALLENGES ── */}
      <div style={{background:"var(--card)",border:"1.5px solid #e0e7ff",borderRadius:20,padding:"18px 18px 16px",marginBottom:16,
        boxShadow:"0 4px 20px rgba(124,58,237,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#7c3aed",flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:800,color:"#7c3aed",letterSpacing:".08em",textTransform:"uppercase"}}>Daily Challenges</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
            {[0,1,2].map(i => (
              <div key={i} style={{width:9,height:9,borderRadius:"50%",
                background:dchlA[i] ? "#16a34a" : "#e2e8f0",
                border:`1.5px solid ${dchlA[i] ? "#16a34a" : "#cbd5e1"}`,
                transition:"background .2s"}}/>
            ))}
            <span style={{fontSize:11,fontWeight:700,color:allDone?"#16a34a":"#94a3b8",marginLeft:2}}>{doneCount}/3</span>
          </div>
        </div>

        {allDone ? (
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:38,marginBottom:6}}>
              {dchlA.filter((a,i) => a && dchlSl[i] === dc.challenges[i].a).length >= 2 ? "🏆" : "🎯"}
            </div>
            <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:3}}>
              {dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length}/3 correct
              {' '}· +{dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length * 10} XP earned
            </div>
            <div style={{fontSize:12,color:"var(--subtext)"}}>New challenges at midnight</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {dc.challenges.map((ch, ci) => {
              const answered = dchlA[ci];
              const selVal = dchlSl[ci];
              const opts = allOpts[ci];
              const correct = selVal === ch.a;
              return (
                <div key={ci} style={{
                  borderRadius:12,
                  border:`1.5px solid ${answered ? (correct ? "#bbf7d0" : "#fecaca") : "#e2e8f0"}`,
                  background:answered ? (correct ? "#f0fdf4" : "#fff5f5") : "#f8fafc",
                  padding:"12px",transition:"all .2s",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}>
                    <span style={{width:20,height:20,borderRadius:"50%",background:answered?(correct?"#16a34a":"#dc2626"):"#7c3aed",
                      color:"white",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {answered ? (correct ? "✓" : "✗") : ci + 1}
                    </span>
                    <span style={{fontSize:13,fontWeight:700,color:"#1e293b",lineHeight:1.4}}>{ch.q}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {opts.map((o, oi) => {
                      let bg = "#fff", border = "#e2e8f0", color = "#1e293b";
                      if (answered) {
                        if (o === ch.a) { bg="#dcfce7"; border="#86efac"; color="#166534"; }
                        else if (o === selVal) { bg="#fee2e2"; border="#fca5a5"; color="#991b1b"; }
                        else { bg="#f1f5f9"; color="#94a3b8"; }
                      }
                      return (
                        <button key={oi}
                          disabled={answered}
                          style={{padding:"9px 10px",border:`1.5px solid ${border}`,borderRadius:10,background:bg,
                            fontSize:12,fontWeight:600,cursor:answered?"default":"pointer",textAlign:"left",
                            fontFamily:"'Outfit',sans-serif",color,lineHeight:1.3,transition:"all .15s",
                            opacity:answered&&o!==ch.a&&o!==selVal?0.5:1}}
                          onClick={() => {
                            const newA = [...dchlA]; newA[ci] = true; sDchlA(newA);
                            const newSl = [...dchlSl]; newSl[ci] = o; sDchlSl(newSl);
                            localStorage.setItem("dcDay3", JSON.stringify({day:dc.dateKey,answered:newA,selected:newSl}));
                            if (o === ch.a) award(10);
                          }}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div style={{marginTop:7,fontSize:11,fontWeight:700,color:correct?"#166534":"#991b1b"}}>
                      {correct ? "✅ Correct! +10 XP" : `❌ Correct answer: ${ch.a}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* ── CONTINUE LEARNING ── */}
      <button className="tc" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:16,borderLeft:"3px solid #16a34a"}}
        onClick={() => setScr("learnpath")}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #bbf7d0",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📈</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)",marginBottom:4}}>My Learning Path</div>
          <Bar v={completedItems.d} mx={completedItems.t} color="#16a34a" h={6} />
          <div style={{fontSize:11,color:"var(--subtext)",marginTop:4}}>
            {completedItems.d}/{completedItems.t} milestones · {completedItems.pct}% complete
          </div>
        </div>
        <div style={{fontSize:18,color:"#16a34a",flexShrink:0,opacity:.6}}>›</div>
      </button>

      {/* ── JUMP IN ── */}
      <h3 className="sh">Jump In</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>Pick up where you left off</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"14px"}}
          onClick={() => setTab("learn")}>
          <div style={{width:42,height:42,borderRadius:13,background:"#f0f9ff",border:"1px solid #bae6fd",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📚</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Learn</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{allCats.length} categories</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"14px"}}
          onClick={() => {
            const pool = allCats.flatMap(cc => V[cc]);
            const items = sh(pool).slice(0,10);
            sMcQ(items.map(w => { const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; }));
            sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
          }}>
          <div style={{width:42,height:42,borderRadius:13,background:"#fff7ed",border:"1px solid #fed7aa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🎯</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Quick Quiz</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>10 random words</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"14px"}}
          onClick={() => { const pool=allCats.flatMap(cc=>V[cc]); sFcPool(sh(pool).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards"); }}>
          <div style={{width:42,height:42,borderRadius:13,background:"#f5f3ff",border:"1px solid #ddd6fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🃏</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Flashcards</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>20 random words</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"14px"}}
          onClick={() => setTab("practice")}>
          <div style={{width:42,height:42,borderRadius:13,background:"#fef9c3",border:"1px solid #fde047",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🎮</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Practice</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Games & exercises</div>
          </div>
        </button>
      </div>

      {/* ── PROVERB OF THE DAY ── */}
      <h3 className="sh">Today's Croatian</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>Tap any phrase to hear it spoken aloud</p>
      <button style={{width:"100%",background:"linear-gradient(135deg,#fefce8,#fef9c3)",border:"1.5px solid #fde047",borderRadius:18,
        padding:"16px",marginBottom:10,cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(234,179,8,.1)",fontFamily:"'Outfit',sans-serif"}}
        onClick={() => speak(proverb.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#a16207",letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>
          🌟 Poslovica dana · Proverb of the Day
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#78350f",fontStyle:"italic",marginBottom:5,lineHeight:1.5,fontFamily:"'Playfair Display',serif"}}>
          "{proverb.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#92400e",fontWeight:500}}>{proverb.en}</span>
          <span style={{fontSize:11,color:"#a16207",opacity:.7}}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* ── HISTORICAL FACT ── */}
      <button style={{width:"100%",background:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"1.5px solid #c4b5fd",borderRadius:18,
        padding:"16px",marginBottom:20,cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(124,58,237,.08)",fontFamily:"'Outfit',sans-serif"}}
        onClick={() => speak(fact.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#6d28d9",letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>
          🏛️ Povijesna činjenica · Historical Fact
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#3b0764",fontStyle:"italic",marginBottom:5,lineHeight:1.5,fontFamily:"'Playfair Display',serif"}}>
          "{fact.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#5b21b6",fontWeight:500}}>{fact.en}</span>
          <span style={{fontSize:11,color:"#6d28d9",opacity:.7}}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* ── QUICK TRANSLATE ── */}
      <h3 className="sh">Quick Translate</h3>
      <div style={{background:"var(--card)",border:"1.5px solid var(--card-b)",borderRadius:18,padding:"16px",marginBottom:24,
        boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
          <button
            style={{background:"none",border:"1.5px solid var(--card-b)",borderRadius:10,padding:"5px 12px",fontSize:11,
              fontWeight:700,color:"#0e7490",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}
            onClick={() => sTDir(tDir==="en-hr"?"hr-en":"en-hr")}>
            {tDir==="en-hr"?"EN → HR ⇄":"HR → EN ⇄"}
          </button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input type="text" value={tIn} onChange={e=>sTIn(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")doTr()}}
            placeholder={tDir==="en-hr"?"Type English…":"Unesite hrvatski…"}
            style={{flex:1,fontSize:14,padding:"11px 14px"}} />
          <button className="b bp" style={{fontSize:14,padding:"11px 18px",whiteSpace:"nowrap"}} onClick={doTr} disabled={tL}>
            {tL ? "⏳" : "Go"}
          </button>
        </div>
        {tOut && (
          <button style={{width:"100%",marginTop:10,padding:"12px 16px",background:"#f0f9ff",borderRadius:12,border:"1.5px solid #bae6fd",
            fontSize:16,fontWeight:700,color:"#0c4a6e",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}
            onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
            <span>{tOut}</span>
            <span style={{fontSize:18}}>🔊</span>
          </button>
        )}
      </div>

    </React.Fragment>
  );
}
