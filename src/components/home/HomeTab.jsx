import React, { useState } from 'react';
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
  const streak = getStreak();
  const proverb = getProverbOfDay();
  const fact = getHistFact();
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  // Shuffle each challenge's opts once (random per session, not seeded)
  const [allOpts] = useState(() => dc.challenges.map(ch => {
    const opts = [...(ch.opts || [ch.a])];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }));

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

      {/* ── HERO CARD ── */}
      <div style={{
        background: "linear-gradient(145deg,#0c4a6e 0%,#0e7490 55%,#0369a1 100%)",
        borderRadius: 24, padding: "24px 22px", marginBottom: 20,
        position: "relative", overflow: "hidden", color: "white",
        boxShadow: "0 8px 32px rgba(14,116,144,.3)"
      }}>
        {/* decorative glows */}
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          <div style={{fontSize:12,fontWeight:600,opacity:.7,marginBottom:2,letterSpacing:".04em",textTransform:"uppercase"}}>
            {greetingByTime()},
          </div>
          <div style={{fontSize:26,fontWeight:900,fontFamily:"'Playfair Display',serif",marginBottom:18,letterSpacing:"-.02em",lineHeight:1.1}}>
            {name || "Učenik"} 👋
          </div>

          {/* Level + XP bar */}
          <div style={{background:"rgba(255,255,255,.12)",borderRadius:14,padding:"12px 16px",backdropFilter:"blur(10px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:800,opacity:.95}}>Level {level}</span>
              <span style={{fontSize:12,opacity:.7,fontWeight:500}}>{st.xp.toLocaleString()} XP · {xpPct}%</span>
            </div>
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:8,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#7dd3fc,#e0f2fe)",borderRadius:8,
                width:xpPct+"%",transition:"width .7s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
            <div style={{fontSize:11,marginTop:7,opacity:.6,fontWeight:500}}>
              {(nXP(level) - st.xp).toLocaleString()} XP to Level {level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {icon:"🔥",value:streak.count,label:"Day Streak",color:"#f59e0b",bg:"#fffbeb",border:"#fde68a"},
          {icon:"⭐",value:st.xp.toLocaleString(),label:"Total XP",color:"#0e7490",bg:"#f0f9ff",border:"#bae6fd"},
          {icon:"📚",value:st.lc,label:"Lessons Done",color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"},
        ].map((s,i) => (
          <div key={i} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:900,color:s.color,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginTop:4,textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── DAILY CHALLENGES ── */}
      <div style={{background:"var(--card)",border:"1.5px solid #e0e7ff",borderRadius:20,padding:"20px",marginBottom:20,
        boxShadow:"0 4px 20px rgba(124,58,237,.07)"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#7c3aed"}}/>
          <span style={{fontSize:11,fontWeight:800,color:"#7c3aed",letterSpacing:".08em",textTransform:"uppercase"}}>Daily Challenges</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            {[0,1,2].map(i => (
              <div key={i} style={{width:10,height:10,borderRadius:"50%",
                background:dchlA[i] ? "#16a34a" : "#e2e8f0",
                border:`1.5px solid ${dchlA[i] ? "#16a34a" : "#cbd5e1"}`,
                transition:"background .2s"}}/>
            ))}
            <span style={{fontSize:11,fontWeight:700,color:allDone?"#16a34a":"#94a3b8",marginLeft:2}}>
              {doneCount}/3
            </span>
          </div>
        </div>

        {allDone ? (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:42,marginBottom:8}}>
              {dchlA.filter((a,i) => a && allOpts[i][dchlSl[i]] === dc.challenges[i].a).length >= 2 ? "🏆" : "🎯"}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:"#1e293b",marginBottom:4}}>
              {dc.challenges.filter((ch,i) => allOpts[i][dchlSl[i]] === ch.a).length} / 3 correct
              {' '}· +{dc.challenges.filter((ch,i) => allOpts[i][dchlSl[i]] === ch.a).length * 10} XP earned
            </div>
            <div style={{fontSize:12,color:"var(--subtext)"}}>New challenges at midnight</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {dc.challenges.map((ch, ci) => {
              const answered = dchlA[ci];
              const selIdx = dchlSl[ci];
              const opts = allOpts[ci];
              const correct = opts[selIdx] === ch.a;
              return (
                <div key={ci} style={{
                  borderRadius:14,
                  border:`1.5px solid ${answered ? (correct ? "#bbf7d0" : "#fecaca") : "#e2e8f0"}`,
                  background:answered ? (correct ? "#f0fdf4" : "#fff5f5") : "#f8fafc",
                  padding:"14px",transition:"all .2s",
                  opacity: answered ? 1 : 1,
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
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
                        else if (oi === selIdx) { bg="#fee2e2"; border="#fca5a5"; color="#991b1b"; }
                        else { bg="#f1f5f9"; color="#94a3b8"; }
                      }
                      return (
                        <button key={oi}
                          disabled={answered}
                          style={{padding:"9px 10px",border:`1.5px solid ${border}`,borderRadius:10,background:bg,
                            fontSize:12,fontWeight:600,cursor:answered?"default":"pointer",textAlign:"left",
                            fontFamily:"'Outfit',sans-serif",color,lineHeight:1.3,transition:"all .15s",
                            opacity:answered&&o!==ch.a&&oi!==selIdx?0.55:1}}
                          onMouseOver={e=>{if(!answered){e.currentTarget.style.borderColor="#7c3aed";e.currentTarget.style.background="#faf5ff"}}}
                          onMouseOut={e=>{if(!answered){e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff"}}}
                          onClick={() => {
                            const newA = [...dchlA]; newA[ci] = true; sDchlA(newA);
                            const newSl = [...dchlSl]; newSl[ci] = oi; sDchlSl(newSl);
                            localStorage.setItem("dcDay3", JSON.stringify({day:dc.dateKey,answered:newA,selected:newSl}));
                            if (o === ch.a) award(10);
                          }}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div style={{marginTop:8,fontSize:11,fontWeight:700,
                      color:correct?"#166534":"#991b1b"}}>
                      {correct ? "✅ Correct! +10 XP" : `❌ Correct answer: ${ch.a}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PROGRESS ── */}
      <div style={{background:"var(--card)",border:"1.5px solid var(--card-b)",borderRadius:20,padding:"18px",marginBottom:20,
        boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:11,fontWeight:800,color:"var(--sh-c)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14}}>
          Progress
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[
            {v:ws.lessons,l:"Lessons",i:"📖"},
            {v:ws.grammar,l:"Grammar",i:"✏️"},
            {v:streak.count,l:"Streak",i:"🔥"},
            {v:ws.strong,l:"Mastered",i:"💪"}
          ].map((s,i) => (
            <div key={i} style={{padding:"10px 4px",background:"var(--bar-bg)",borderRadius:12}}>
              <div style={{fontSize:16,marginBottom:4}}>{s.i}</div>
              <div style={{fontSize:18,fontWeight:900,color:"var(--heading)",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9,color:"var(--sh-c)",fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:".04em"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {ws.weak > 0 && (
          <div style={{fontSize:12,color:"#d97706",marginTop:12,padding:"8px 12px",background:"#fffbeb",borderRadius:10,fontWeight:600,border:"1px solid #fde68a"}}>
            ⚠️ {ws.weak} words need review — practice them in Weak Words
          </div>
        )}
      </div>

      {/* ── QUICK TRANSLATE ── */}
      <div style={{background:"var(--card)",border:"1.5px solid var(--card-b)",borderRadius:20,padding:"18px",marginBottom:20,
        boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:11,fontWeight:800,color:"var(--sh-c)",letterSpacing:".08em",textTransform:"uppercase"}}>
            Quick Translate
          </span>
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
          <div style={{marginTop:10,padding:"12px 16px",background:"#f0f9ff",borderRadius:12,border:"1.5px solid #bae6fd",
            fontSize:16,fontWeight:700,color:"#0c4a6e",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
            onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
            <span>{tOut}</span>
            <span style={{fontSize:18}}>🔊</span>
          </div>
        )}
      </div>

      {/* ── LEARNING PATH ── */}
      <div className="tc" style={{display:"flex",alignItems:"center",gap:16,padding:"18px",marginBottom:20}}
        onClick={() => setScr("learnpath")}>
        <div style={{width:52,height:52,borderRadius:16,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>📈</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:"var(--heading)",marginBottom:3}}>My Learning Path</div>
          <div style={{marginBottom:6}}>
            <Bar v={completedItems.d} mx={completedItems.t} color="#16a34a" h={6} />
          </div>
          <div style={{fontSize:12,color:"var(--subtext)"}}>
            {completedItems.d}/{completedItems.t} milestones · {completedItems.pct}% complete
          </div>
        </div>
        <div style={{fontSize:18,color:"#cbd5e1"}}>›</div>
      </div>

      {/* ── PROVERB OF THE DAY ── */}
      <div style={{background:"linear-gradient(135deg,#fefce8,#fef9c3)",border:"1.5px solid #fde047",borderRadius:20,
        padding:"18px",marginBottom:16,cursor:"pointer",boxShadow:"0 2px 8px rgba(234,179,8,.1)"}}
        onClick={() => speak(proverb.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#a16207",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🌟 Poslovica dana
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#78350f",fontStyle:"italic",marginBottom:6,lineHeight:1.5,fontFamily:"'Playfair Display',serif"}}>
          "{proverb.hr}"
        </div>
        <div style={{fontSize:13,color:"#92400e",fontWeight:500}}>{proverb.en}</div>
        <div style={{fontSize:11,color:"#a16207",marginTop:6,opacity:.7}}>Tap to hear pronunciation 🔊</div>
      </div>

      {/* ── HISTORICAL FACT ── */}
      <div style={{background:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"1.5px solid #c4b5fd",borderRadius:20,
        padding:"18px",marginBottom:20,cursor:"pointer",boxShadow:"0 2px 8px rgba(124,58,237,.08)"}}
        onClick={() => speak(fact.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#6d28d9",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🏛️ Povijesna činjenica
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#3b0764",fontStyle:"italic",marginBottom:6,lineHeight:1.5,fontFamily:"'Playfair Display',serif"}}>
          "{fact.hr}"
        </div>
        <div style={{fontSize:13,color:"#5b21b6",fontWeight:500}}>{fact.en}</div>
        <div style={{fontSize:11,color:"#6d28d9",marginTop:6,opacity:.7}}>Tap to hear pronunciation 🔊</div>
      </div>

      {/* ── QUICK START ── */}
      <div className="sh">Quick Start</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:8}}>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}}
          onClick={() => setTab("learn")}>
          <div style={{width:44,height:44,borderRadius:14,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📚</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Continue Learning</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{allCats.length} active categories</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}}
          onClick={() => {
            const pool = allCats.flatMap(cc => V[cc]);
            const items = sh(pool).slice(0,10);
            sMcQ(items.map(w => { const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; }));
            sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
          }}>
          <div style={{width:44,height:44,borderRadius:14,background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎯</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Quick Quiz</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>10 random words</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}}
          onClick={() => { const pool=allCats.flatMap(cc=>V[cc]); sFcPool(sh(pool).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards"); }}>
          <div style={{width:44,height:44,borderRadius:14,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🃏</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Flashcards</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>20 random words</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}}
          onClick={() => setTab("croatia")}>
          <div style={{width:44,height:44,borderRadius:14,background:"#fff1f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🇭🇷</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Life in Croatia</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>School, food, sports</div>
          </div>
        </div>
      </div>

    </React.Fragment>
  );
}
