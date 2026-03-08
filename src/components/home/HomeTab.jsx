import React, { useState } from 'react';
import { Bar, V, LEARN_PATH, getStreak, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak, getSR } from '../../data.jsx';

export default function HomeTab({
  name, level, st,
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats, award,
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

  const allOpts = dc.challenges.map(ch => ch.opts || [ch.a]);
  const doneCount = dchlA.filter(Boolean).length;
  const allDone = doneCount === 3;

  const [dcOpen, setDcOpen] = useState(doneCount === 0);

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Dobro jutro";
    if (h < 18) return "Dobar dan";
    return "Dobra večer";
  };

  const pathData = (() => {
    let totalDone = 0, totalItems = 0;
    let activeLv = null, activeLvDone = 0, nextItem = null;
    for (const lv of LEARN_PATH) {
      let lvd = 0;
      for (const it of lv.items) {
        totalItems++;
        if (it.ck(st)) { totalDone++; lvd++; }
        else if (!nextItem) nextItem = { ...it, levelTitle: lv.title };
      }
      if (!activeLv && lvd < lv.items.length) { activeLv = lv; activeLvDone = lvd; }
    }
    if (!activeLv) { activeLv = LEARN_PATH[LEARN_PATH.length - 1]; activeLvDone = activeLv.items.length; }
    return { totalDone, totalItems, pct: Math.round(totalDone / totalItems * 100), activeLv, activeLvDone, nextItem };
  })();

  const LEVEL_PALETTE = [
    { grad: "linear-gradient(135deg,#92400e,#b45309)", light: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    { grad: "linear-gradient(135deg,#065f46,#059669)", light: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
    { grad: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", light: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
    { grad: "linear-gradient(135deg,#4c1d95,#6d28d9)", light: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
    { grad: "linear-gradient(135deg,#7f1d1d,#dc2626)", light: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" },
  ];

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];
  const nameInitial = (name || "U")[0].toUpperCase();

  return (
    <React.Fragment>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(160deg,#0f172a 0%,#0c4a6e 50%,#0369a1 100%)",
        borderRadius: 0,
        padding: "24px 20px 20px",
        marginBottom: 0,
        position: "relative",
        overflow: "hidden",
        color: "white",
      }}>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:-60,right:-40,width:200,height:200,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-80,left:-50,width:180,height:180,background:"rgba(56,189,248,.07)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:10,right:80,width:80,height:80,background:"rgba(125,211,252,.04)",borderRadius:"50%",pointerEvents:"none"}}/>

        {/* Top row: avatar + greeting */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{
            width:48,height:48,borderRadius:"50%",
            background:"rgba(255,255,255,.15)",
            border:"2px solid rgba(255,255,255,.35)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:20,fontWeight:900,flexShrink:0,
            boxShadow:"0 4px 16px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.2)",
          }}>
            {nameInitial}
          </div>
          <div style={{
            fontSize:12,fontWeight:600,color:"rgba(255,255,255,.7)",
            letterSpacing:".04em",textAlign:"right",
          }}>
            {greetingByTime()} 👋
          </div>
        </div>

        {/* Large name */}
        <div style={{
          fontSize:28,fontWeight:900,
          fontFamily:"'Playfair Display',serif",
          letterSpacing:"-.02em",lineHeight:1.1,
          marginBottom:10,
          textShadow:"0 2px 16px rgba(0,0,0,.3)",
        }}>
          {name || "Učenik"}
        </div>

        {/* Level badge pill */}
        <div style={{display:"inline-flex",alignItems:"center",marginBottom:16}}>
          <span style={{
            background: activePalette.grad,
            borderRadius:20,
            padding:"5px 14px",
            fontSize:11,fontWeight:800,
            color:"white",
            letterSpacing:".06em",
            textTransform:"uppercase",
            boxShadow:`0 4px 14px rgba(0,0,0,.3)`,
          }}>
            <span>Level {level}</span><span style={{opacity:.65,fontWeight:600}}> · {pathData.activeLv.title}</span>
          </span>
        </div>

        {/* XP bar */}
        <div style={{marginBottom:8}}>
          <div style={{
            background:"rgba(255,255,255,.15)",
            borderRadius:10,height:10,overflow:"hidden",
            boxShadow:"inset 0 1px 3px rgba(0,0,0,.2)",
          }}>
            <div style={{
              height:"100%",
              background:"linear-gradient(90deg,#38bdf8,#7dd3fc)",
              borderRadius:10,
              width:xpPct+"%",
              transition:"width .9s cubic-bezier(.4,0,.2,1)",
              boxShadow:"0 0 12px rgba(56,189,248,.6)",
            }}/>
          </div>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:500,marginBottom:18,letterSpacing:".01em"}}>
          {xpCur.toLocaleString()} XP · Level {level + 1} in {(nXP(level) - st.xp).toLocaleString()} more XP
        </div>

        {/* Stat chips */}
        <div style={{display:"flex",gap:8,overflowX:"auto",msOverflowStyle:"none",scrollbarWidth:"none"}}>
          {[
            {icon:"🔥",value:streak.count,label:"streak"},
            {icon:"⭐",value:st.xp.toLocaleString(),label:"XP total"},
            {icon:"📚",value:st.lc,label:"lessons"},
            {icon:"💪",value:ws.strong,label:"mastered"},
          ].map((s,i) => (
            <div key={i} style={{
              display:"inline-flex",alignItems:"center",gap:5,
              padding:"7px 12px",
              borderRadius:20,
              border:"1.5px solid rgba(255,255,255,.2)",
              background:"rgba(255,255,255,.12)",
              whiteSpace:"nowrap",flexShrink:0,
              backdropFilter:"blur(8px)",
            }}>
              <span style={{fontSize:13}}>{s.icon}</span>
              <span style={{fontSize:13,fontWeight:900,color:"white",fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
              <span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,.65)"}}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTINUE LEARNING ── */}
      <div style={{
        background: activePalette.grad,
        borderRadius: "0 0 22px 22px",
        padding: "20px 20px 22px",
        marginBottom: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,.2)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,background:"rgba(255,255,255,.07)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,background:"rgba(0,0,0,.1)",borderRadius:"50%",pointerEvents:"none"}}/>

        <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.7)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>
          Your Next Lesson
        </div>
        <div style={{
          fontSize:20,fontWeight:900,
          fontFamily:"'Playfair Display',serif",
          color:"white",lineHeight:1.2,marginBottom:4,
          textShadow:"0 2px 8px rgba(0,0,0,.2)",
        }}>
          {pathData.nextItem?.name || "Learning Path Complete"}
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:600,marginBottom:14}}>
          Level {pathData.activeLv.level} · {pathData.activeLv.title}
        </div>

        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,.25)",borderRadius:6,height:6,overflow:"hidden",marginBottom:6}}>
          <div style={{
            height:"100%",background:"white",borderRadius:6,
            width: (pathData.activeLvDone / pathData.activeLv.items.length * 100) + "%",
            transition:"width .7s cubic-bezier(.4,0,.2,1)",
          }}/>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:500,marginBottom:16}}>
          {pathData.activeLvDone} of {pathData.activeLv.items.length} lessons complete
        </div>

        {/* Start Now button */}
        <button
          onClick={() => { if (pathData.nextItem) { setScr(pathData.nextItem.go); sCurEx(pathData.nextItem.go); } else setScr("learnpath"); }}
          style={{
            width:"100%",height:52,
            background:"white",
            color: activePalette.text,
            fontSize:16,fontWeight:800,
            border:"none",borderRadius:14,cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",
            letterSpacing:".01em",
            boxShadow:"0 4px 20px rgba(0,0,0,.25)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            transition:"transform .15s, box-shadow .15s",
          }}>
          <span style={{fontSize:18}}>▶</span>
          <span>Start Now</span>
        </button>
      </div>

      {/* ── DAILY CHALLENGES ── */}
      <div style={{
        background:"var(--card)",
        border:"1.5px solid #e0e7ff",
        borderRadius:20,
        marginBottom:16,
        overflow:"hidden",
        boxShadow:"0 4px 24px rgba(124,58,237,.08)",
      }}>
        {allDone ? (
          <div style={{padding:"20px 20px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{
                width:40,height:40,borderRadius:12,
                background:"linear-gradient(135deg,#16a34a,#15803d)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,flexShrink:0,
                boxShadow:"0 4px 12px rgba(22,163,74,.3)",
              }}>🏆</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:"#16a34a"}}>Daily Challenges</div>
                <div style={{fontSize:10,color:"var(--subtext)",marginTop:1}}>All complete · Come back tomorrow</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#16a34a",boxShadow:"0 0 6px rgba(22,163,74,.5)"}}/>
                ))}
                <span style={{fontSize:11,fontWeight:800,color:"#16a34a",marginLeft:4}}>3/3</span>
              </div>
            </div>
            <div style={{
              background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",
              border:"1.5px solid #86efac",
              borderRadius:16,padding:"18px",textAlign:"center",
            }}>
              <div style={{fontSize:42,marginBottom:8}}>
                {dchlA.filter((a,i) => a && dchlSl[i] === dc.challenges[i].a).length >= 2 ? "🏆" : "🎯"}
              </div>
              <div style={{fontSize:16,fontWeight:900,color:"#15803d",marginBottom:4}}>
                {dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length}/3 correct
                {' '}· +{dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length * 10} XP earned
              </div>
              <div style={{fontSize:12,color:"#166534",fontWeight:500}}>New challenges at midnight</div>
            </div>
          </div>
        ) : (
          <>
            {/* Accordion header */}
            <div
              onClick={() => setDcOpen(o => !o)}
              style={{
                padding:"16px 20px",cursor:"pointer",
                display:"flex",alignItems:"center",gap:12,
                borderBottom: dcOpen ? "1px solid #e0e7ff" : "none",
                background: dcOpen
                  ? "linear-gradient(135deg,#faf5ff,#f5f3ff)"
                  : "var(--card)",
                transition:"background .2s",
              }}>
              <div style={{
                width:40,height:40,borderRadius:12,
                background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,flexShrink:0,
                boxShadow:"0 4px 12px rgba(124,58,237,.35)",
              }}>
                🎯
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#7c3aed"}}>Daily Challenges</div>
                <div style={{fontSize:10,color:"var(--subtext)",marginTop:2}}>
                  {doneCount === 0
                    ? "earn up to +30 XP today"
                    : `${doneCount}/3 answered`}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{
                    width:9,height:9,borderRadius:"50%",
                    background:dchlA[i]?"#16a34a":"#e2e8f0",
                    border:`1.5px solid ${dchlA[i]?"#16a34a":"#cbd5e1"}`,
                    transition:"background .25s",
                    boxShadow:dchlA[i]?"0 0 6px rgba(22,163,74,.4)":"none",
                  }}/>
                ))}
                <div style={{
                  fontSize:18,color:"#7c3aed",marginLeft:4,fontWeight:300,
                  transform:dcOpen?"rotate(90deg)":"none",
                  transition:"transform .2s",
                  lineHeight:1,
                }}>›</div>
              </div>
            </div>

            {/* Expanded questions */}
            {dcOpen && (
              <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:12}}>
                {doneCount === 0 && (
                  <div style={{
                    background:"linear-gradient(135deg,#fdf4ff,#faf5ff)",
                    border:"1.5px solid #e9d5ff",
                    borderRadius:12,
                    padding:"10px 14px",
                    fontSize:12,fontWeight:700,color:"#7c3aed",
                    display:"flex",alignItems:"center",gap:8,
                  }}>
                    <span style={{fontSize:16}}>🔥</span>
                    <span>Today's Mission — answer all 3 for +30 XP</span>
                  </div>
                )}
                {dc.challenges.map((ch, ci) => {
                  const answered = dchlA[ci];
                  const selVal = dchlSl[ci];
                  const opts = allOpts[ci];
                  const correct = selVal === ch.a;
                  return (
                    <div key={ci} style={{
                      borderRadius:14,
                      border:`1.5px solid ${answered ? (correct ? "#bbf7d0" : "#fecaca") : "#e2e8f0"}`,
                      background: answered ? (correct ? "#f0fdf4" : "#fff5f5") : "#f8fafc",
                      padding:"14px",
                      transition:"all .25s",
                      boxShadow: answered
                        ? (correct ? "0 4px 16px rgba(22,163,74,.1)" : "0 4px 16px rgba(220,38,38,.08)")
                        : "0 2px 8px rgba(0,0,0,.04)",
                    }}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:10}}>
                        <span style={{
                          width:22,height:22,borderRadius:"50%",
                          background: answered ? (correct ? "#16a34a" : "#dc2626") : "#7c3aed",
                          color:"white",fontSize:10,fontWeight:900,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          flexShrink:0,marginTop:1,
                          boxShadow: answered
                            ? (correct ? "0 2px 8px rgba(22,163,74,.35)" : "0 2px 8px rgba(220,38,38,.3)")
                            : "0 2px 8px rgba(124,58,237,.3)",
                        }}>
                          {answered ? (correct ? "✓" : "✗") : ci + 1}
                        </span>
                        <span style={{fontSize:13,fontWeight:700,color:"#1e293b",lineHeight:1.5}}>{ch.q}</span>
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
                              data-dc-option="true"
                              disabled={answered}
                              style={{
                                padding:"9px 10px",
                                border:`1.5px solid ${border}`,
                                borderRadius:10,background:bg,
                                fontSize:11,fontWeight:600,
                                cursor:answered?"default":"pointer",
                                textAlign:"left",
                                fontFamily:"'Outfit',sans-serif",
                                color,lineHeight:1.4,
                                transition:"all .15s",
                                opacity:answered&&o!==ch.a&&o!==selVal?0.45:1,
                              }}
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
                        <div style={{
                          marginTop:10,fontSize:12,fontWeight:700,
                          color:correct?"#166534":"#991b1b",
                          display:"flex",alignItems:"center",gap:6,
                        }}>
                          <span>{correct ? "✅ Correct! +10 XP" : `❌ Correct answer: ${ch.a}`}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MY LEARNING JOURNEY ── */}
      <div style={{
        background:"var(--card)",
        border:`1.5px solid ${activePalette.border}`,
        borderRadius:22,
        padding:"20px 20px 18px",
        marginBottom:16,
        boxShadow:`0 8px 40px ${activePalette.border}44, 0 2px 8px rgba(0,0,0,.05)`,
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:"var(--subtext)",marginBottom:3}}>
              Progress
            </div>
            <div style={{fontSize:18,fontWeight:900,color:"var(--heading)",fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>
              My Learning Journey
            </div>
          </div>
          <div style={{
            background: activePalette.grad,
            color:"white",borderRadius:20,
            padding:"6px 12px",
            fontSize:13,fontWeight:900,
            fontVariantNumeric:"tabular-nums",
            boxShadow:`0 4px 12px ${activePalette.border}66`,
            flexShrink:0,marginTop:2,
          }}>
            {pathData.pct}%
          </div>
        </div>

        {/* Road map nodes */}
        <div style={{display:"flex",alignItems:"center",marginBottom:18,paddingBottom:4,overflowX:"auto",msOverflowStyle:"none",scrollbarWidth:"none"}}>
          {LEARN_PATH.map((lv, i) => {
            const lvDone = lv.items.filter(it => it.ck(st)).length;
            const isActive = lv.level === pathData.activeLv.level;
            const isComplete = lvDone === lv.items.length;
            const pal = LEVEL_PALETTE[i % LEVEL_PALETTE.length];
            return (
              <React.Fragment key={lv.level}>
                {i > 0 && (
                  <div style={{
                    flex:1,height:3,minWidth:12,
                    background: isComplete || (LEARN_PATH[i-1].items.filter(it=>it.ck(st)).length === LEARN_PATH[i-1].items.length)
                      ? pal.border
                      : "#e2e8f0",
                    borderRadius:2,
                    backgroundImage: (!isComplete && !(LEARN_PATH[i-1].items.filter(it=>it.ck(st)).length === LEARN_PATH[i-1].items.length))
                      ? "repeating-linear-gradient(90deg,#e2e8f0 0,#e2e8f0 6px,transparent 6px,transparent 12px)"
                      : "none",
                    flexShrink:1,
                  }}/>
                )}
                <div style={{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0,
                }}>
                  <div style={{
                    width: isActive ? 44 : 36,
                    height: isActive ? 44 : 36,
                    borderRadius:"50%",
                    background: isComplete ? pal.grad : isActive ? pal.grad : "#f1f5f9",
                    border: isActive ? `3px solid white` : isComplete ? "none" : `2px solid #e2e8f0`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize: isActive ? 16 : 13,
                    color: isComplete || isActive ? "white" : "#94a3b8",
                    fontWeight:900,
                    boxShadow: isActive
                      ? `0 0 0 4px ${pal.border}66, 0 4px 16px ${pal.border}88`
                      : isComplete
                      ? `0 4px 12px ${pal.border}55`
                      : "none",
                    transition:"all .3s",
                    animation: isActive ? "pulse 2.5s ease-in-out infinite" : "none",
                    position:"relative",
                  }}>
                    {isComplete ? "✓" : isActive ? lv.level : "🔒"}
                  </div>
                  <div style={{
                    fontSize:9,fontWeight:700,
                    color: isActive ? activePalette.text : isComplete ? pal.text : "#94a3b8",
                    letterSpacing:".04em",
                    textTransform:"uppercase",
                    maxWidth:52,textAlign:"center",lineHeight:1.2,
                  }}>
                    {lv.title}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Active level card */}
        <div style={{
          background:`linear-gradient(145deg,${activePalette.light},#f8fafc)`,
          border:`1.5px solid ${activePalette.border}`,
          borderRadius:16,padding:"16px",marginBottom:14,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{
              background:activePalette.grad,color:"white",
              borderRadius:10,padding:"4px 10px",
              fontSize:10,fontWeight:800,flexShrink:0,
              boxShadow:`0 2px 8px ${activePalette.border}66`,
            }}>
              L{pathData.activeLv.level}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:900,color:"var(--heading)",lineHeight:1}}>
                {pathData.activeLv.title}
              </div>
              <div style={{fontSize:11,color:"var(--subtext)",marginTop:2}}>{pathData.activeLv.desc}</div>
            </div>
            <div style={{fontSize:13,fontWeight:800,color:activePalette.text,flexShrink:0}}>
              {pathData.activeLvDone}/{pathData.activeLv.items.length}
            </div>
          </div>

          <Bar v={pathData.activeLvDone} mx={pathData.activeLv.items.length} color={activePalette.text} h={6} />
          <div style={{fontSize:10,color:"var(--subtext)",marginTop:5,marginBottom:12,fontWeight:500}}>
            {pathData.activeLv.items.length - pathData.activeLvDone} milestone{pathData.activeLv.items.length - pathData.activeLvDone !== 1 ? "s" : ""} remaining in this level
          </div>

          {/* Milestone chips */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {pathData.activeLv.items.map((it) => {
              const done = it.ck(st);
              const isNext = !done && pathData.nextItem && it.id === pathData.nextItem.id;
              if (done) return (
                <span key={it.id} style={{
                  borderRadius:20,padding:"5px 11px",
                  fontSize:11,fontWeight:600,
                  background:"#dcfce7",border:"1.5px solid #86efac",color:"#166534",
                }}>
                  ✓ {it.name}
                </span>
              );
              if (isNext) return (
                <button key={it.id}
                  onClick={() => { setScr(it.go); sCurEx(it.go); }}
                  style={{
                    borderRadius:20,padding:"5px 13px",
                    fontSize:11,fontWeight:800,
                    background:activePalette.grad,
                    border:"none",color:"white",cursor:"pointer",
                    boxShadow:`0 3px 12px ${activePalette.border}88`,
                    fontFamily:"'Outfit',sans-serif",
                  }}>
                  ▶ {it.name}
                </button>
              );
              return (
                <span key={it.id} style={{
                  borderRadius:20,padding:"5px 11px",
                  fontSize:11,fontWeight:600,
                  background:"#f1f5f9",border:"1.5px solid #e2e8f0",color:"#94a3b8",
                }}>
                  {it.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setScr("learnpath")}
          style={{
            width:"100%",padding:"15px",borderRadius:14,
            background:activePalette.grad,
            color:"white",fontSize:14,fontWeight:800,
            border:"none",cursor:"pointer",
            boxShadow:`0 6px 20px ${activePalette.border}66`,
            fontFamily:"'Outfit',sans-serif",
            letterSpacing:".02em",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            transition:"transform .15s, box-shadow .15s",
          }}>
          <span>View Full Learning Path</span>
          <span style={{fontSize:18,lineHeight:1}}>→</span>
        </button>
      </div>

      {/* ── QUICK PRACTICE ── */}
      <h3 className="sh">Quick Practice</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>
        Jump straight into a drill
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <button className="tc"
          style={{
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:8,padding:"18px 12px",minHeight:90,
          }}
          onClick={() => {
            const pool = allCats.flatMap(cc => V[cc]);
            const items = sh(pool).slice(0,10);
            sMcQ(items.map(w => {
              const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]);
              return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]};
            }));
            sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
          }}>
          <div style={{
            width:46,height:46,borderRadius:14,
            background:"linear-gradient(135deg,#fff7ed,#ffedd5)",
            border:"1.5px solid #fed7aa",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:22,flexShrink:0,
            boxShadow:"0 4px 12px rgba(251,146,60,.15)",
          }}>🎯</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Quick Quiz</div>
            <div style={{fontSize:10,color:"var(--subtext)",marginTop:2}}>10 random words</div>
          </div>
        </button>

        <button className="tc"
          style={{
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:8,padding:"18px 12px",minHeight:90,
          }}
          onClick={() => {
            const pool=allCats.flatMap(cc=>V[cc]);
            sFcPool(sh(pool).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards");
          }}>
          <div style={{
            width:46,height:46,borderRadius:14,
            background:"linear-gradient(135deg,#faf5ff,#f5f3ff)",
            border:"1.5px solid #ddd6fe",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:22,flexShrink:0,
            boxShadow:"0 4px 12px rgba(124,58,237,.12)",
          }}>🃏</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Flashcards</div>
            <div style={{fontSize:10,color:"var(--subtext)",marginTop:2}}>20 random words</div>
          </div>
        </button>
      </div>

      {/* ── TODAY'S CROATIAN ── */}
      <h3 className="sh">Today's Croatian</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:14,fontWeight:500}}>
        Tap any phrase to hear it spoken aloud
      </p>

      {/* Proverb */}
      <button
        style={{
          width:"100%",
          background:"linear-gradient(135deg,#fefce8,#fef9c3)",
          border:"1.5px solid #fde047",
          borderRadius:20,
          padding:"18px",marginBottom:12,
          cursor:"pointer",textAlign:"left",
          boxShadow:"0 4px 16px rgba(234,179,8,.12)",
          fontFamily:"'Outfit',sans-serif",
          transition:"transform .15s, box-shadow .15s",
        }}
        onClick={() => speak(proverb.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#a16207",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🌟 Poslovica dana · Proverb of the Day
        </div>
        <div style={{
          fontSize:16,fontWeight:700,color:"#78350f",fontStyle:"italic",
          marginBottom:8,lineHeight:1.6,
          fontFamily:"'Playfair Display',serif",
        }}>
          "{proverb.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#92400e",fontWeight:500,lineHeight:1.4,flex:1,marginRight:12}}>{proverb.en}</span>
          <span style={{
            fontSize:11,color:"#a16207",
            background:"rgba(161,98,7,.1)",
            borderRadius:20,padding:"4px 10px",
            fontWeight:600,flexShrink:0,
          }}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* Historical Fact */}
      <button
        style={{
          width:"100%",
          background:"linear-gradient(135deg,#faf5ff,#ede9fe)",
          border:"1.5px solid #c4b5fd",
          borderRadius:20,
          padding:"18px",marginBottom:20,
          cursor:"pointer",textAlign:"left",
          boxShadow:"0 4px 16px rgba(124,58,237,.1)",
          fontFamily:"'Outfit',sans-serif",
          transition:"transform .15s, box-shadow .15s",
        }}
        onClick={() => speak(fact.hr)}>
        <div style={{fontSize:11,fontWeight:800,color:"#6d28d9",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
          🏛️ Povijesna činjenica · Historical Fact
        </div>
        <div style={{
          fontSize:16,fontWeight:700,color:"#3b0764",fontStyle:"italic",
          marginBottom:8,lineHeight:1.6,
          fontFamily:"'Playfair Display',serif",
        }}>
          "{fact.hr}"
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#5b21b6",fontWeight:500,lineHeight:1.4,flex:1,marginRight:12}}>{fact.en}</span>
          <span style={{
            fontSize:11,color:"#6d28d9",
            background:"rgba(109,40,217,.1)",
            borderRadius:20,padding:"4px 10px",
            fontWeight:600,flexShrink:0,
          }}>🔊 Tap to hear</span>
        </div>
      </button>

      {/* ── QUICK TRANSLATE ── */}
      <h3 className="sh">Quick Translate</h3>
      <div style={{
        background:"var(--card)",
        border:"1.5px solid var(--card-b)",
        borderRadius:20,padding:"18px",
        marginBottom:24,
        boxShadow:"0 4px 16px rgba(0,0,0,.05)",
      }}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button
            style={{
              background:"none",
              border:"1.5px solid #bae6fd",
              borderRadius:10,padding:"6px 14px",
              fontSize:12,fontWeight:700,color:"#0e7490",
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",
              background:"#f0f9ff",
              transition:"background .15s",
            }}
            onClick={() => sTDir(tDir==="en-hr"?"hr-en":"en-hr")}>
            {tDir==="en-hr"?"EN → HR ⇄":"HR → EN ⇄"}
          </button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            type="text"
            value={tIn}
            onChange={e=>sTIn(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")doTr()}}
            placeholder={tDir==="en-hr"?"Type English…":"Unesite hrvatski…"}
            style={{flex:1,fontSize:14,padding:"12px 14px"}}
          />
          <button className="b bp" style={{fontSize:14,padding:"12px 20px",whiteSpace:"nowrap"}} onClick={doTr} disabled={tL}>
            {tL ? "⏳" : "Go"}
          </button>
        </div>
        {tOut && (
          <button
            style={{
              width:"100%",marginTop:12,padding:"14px 16px",
              background:"#f0f9ff",borderRadius:14,
              border:"1.5px solid #bae6fd",
              fontSize:16,fontWeight:700,color:"#0c4a6e",
              cursor:"pointer",textAlign:"left",
              fontFamily:"'Outfit',sans-serif",
              display:"flex",justifyContent:"space-between",alignItems:"center",
              boxShadow:"0 2px 8px rgba(14,116,144,.08)",
            }}
            onClick={() => speak(tDir==="en-hr"?tOut:tIn)}>
            <span>{tOut}</span>
            <span style={{fontSize:20}}>🔊</span>
          </button>
        )}
      </div>

    </React.Fragment>
  );
}
