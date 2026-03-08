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

  // Daily challenge accordion — open by default if no questions answered yet
  const [dcOpen, setDcOpen] = useState(doneCount === 0);

  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Dobro jutro";
    if (h < 18) return "Dobar dan";
    return "Dobra večer";
  };

  // Learning path analysis — find active level and next item
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
    return {
      totalDone, totalItems,
      pct: Math.round(totalDone / totalItems * 100),
      activeLv, activeLvDone, nextItem,
    };
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
        background: "linear-gradient(145deg,#0c4a6e 0%,#0e7490 55%,#0369a1 100%)",
        borderRadius: 22, padding: "16px 18px", marginBottom: 12,
        position: "relative", overflow: "hidden", color: "white",
        boxShadow: "0 8px 32px rgba(14,116,144,.28)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:100,height:100,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>

        {/* Avatar */}
        <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,.18)",border:"2px solid rgba(255,255,255,.4)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,flexShrink:0,
          boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
          {nameInitial}
        </div>

        {/* Greeting */}
        <div style={{flex:1,minWidth:0,position:"relative"}}>
          <div style={{fontSize:10,fontWeight:600,opacity:.65,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>
            {greetingByTime()}
          </div>
          <div style={{fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif",letterSpacing:"-.01em",lineHeight:1.1,
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {name || "Učenik"}
          </div>
        </div>

        {/* Level + XP */}
        <div style={{background:"rgba(255,255,255,.14)",borderRadius:12,padding:"8px 12px",backdropFilter:"blur(10px)",
          flexShrink:0,textAlign:"center",minWidth:72}}>
          <div style={{fontSize:11,fontWeight:800,marginBottom:4}}>Level {level}</div>
          <div style={{background:"rgba(0,0,0,.25)",borderRadius:4,height:5,overflow:"hidden",width:60}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,#7dd3fc,#e0f2fe)",borderRadius:4,
              width:xpPct+"%",transition:"width .7s cubic-bezier(.4,0,.2,1)"}}/>
          </div>
          <div style={{fontSize:9,opacity:.6,marginTop:3,fontWeight:500}}>{xpPct}%</div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:16,
        msOverflowStyle:"none",scrollbarWidth:"none"}}>
        {[
          {icon:"🔥",value:streak.count,  label:"streak",   bg:"#fffbeb",border:"#fde68a",color:"#a16207"},
          {icon:"⭐",value:st.xp.toLocaleString(),label:"XP total",bg:"#f0f9ff",border:"#bae6fd",color:"#0e7490"},
          {icon:"📚",value:st.lc,          label:"lessons",  bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"},
          {icon:"💪",value:ws.strong,      label:"mastered", bg:"#f5f3ff",border:"#ddd6fe",color:"#7c3aed"},
        ].map((s,i) => (
          <div key={i} style={{display:"inline-flex",alignItems:"center",gap:5,
            padding:"7px 12px",borderRadius:20,border:`1.5px solid ${s.border}`,background:s.bg,
            whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontSize:14}}>{s.icon}</span>
            <span style={{fontSize:13,fontWeight:900,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
            <span style={{fontSize:10,fontWeight:600,color:s.color,opacity:.7}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── MY LEARNING JOURNEY (FOCAL POINT) ── */}
      <div style={{background:"var(--card)",border:`1.5px solid ${activePalette.border}`,borderRadius:22,
        padding:"18px 18px 16px",marginBottom:16,
        boxShadow:`0 8px 40px ${activePalette.border}44, 0 2px 8px rgba(0,0,0,.06)`}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",
              color:"var(--subtext)",marginBottom:2}}>My Learning Journey</div>
            <div style={{fontSize:18,fontWeight:900,color:"var(--heading)",fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>
              Road to Fluency
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:20,fontWeight:900,color:activePalette.text,fontVariantNumeric:"tabular-nums"}}>
              {pathData.pct}%
            </div>
            <div style={{fontSize:10,color:"var(--subtext)",fontWeight:600,marginTop:1}}>
              {pathData.totalDone}/{pathData.totalItems} done
            </div>
          </div>
        </div>

        {/* Level nodes strip */}
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:14,
          msOverflowStyle:"none",scrollbarWidth:"none"}}>
          {LEARN_PATH.map((lv, i) => {
            const lvDone = lv.items.filter(it => it.ck(st)).length;
            const isActive = lv.level === pathData.activeLv.level;
            const isComplete = lvDone === lv.items.length;
            const pal = LEVEL_PALETTE[i % LEVEL_PALETTE.length];
            if (isActive) return (
              <div key={lv.level} style={{
                borderRadius:20,padding:"6px 13px",flexShrink:0,
                background: pal.grad,
                fontSize:11,fontWeight:800,color:"white",
                boxShadow:`0 3px 12px ${pal.border}88`,
                animation:"pulse 2.5s ease-in-out infinite",
              }}>
                L{lv.level} {lv.title}
              </div>
            );
            if (isComplete) return (
              <div key={lv.level} style={{
                borderRadius:20,padding:"6px 13px",flexShrink:0,
                background:pal.light,border:`1.5px solid ${pal.border}`,
                fontSize:11,fontWeight:700,color:pal.text,
              }}>
                ✓ {lv.title}
              </div>
            );
            return (
              <div key={lv.level} style={{
                borderRadius:20,padding:"6px 13px",flexShrink:0,
                background:"#f1f5f9",border:"1.5px solid #e2e8f0",
                fontSize:11,fontWeight:600,color:"#94a3b8",
              }}>
                🔒 {lv.title}
              </div>
            );
          })}
        </div>

        {/* Active level expansion */}
        <div style={{background:`linear-gradient(145deg,${activePalette.light},#f8fafc)`,
          border:`1.5px solid ${activePalette.border}`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{background:activePalette.grad,color:"white",borderRadius:8,
              padding:"3px 9px",fontSize:10,fontWeight:800,flexShrink:0}}>
              L{pathData.activeLv.level}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:900,color:"var(--heading)",lineHeight:1}}>
                {pathData.activeLv.title}
              </div>
              <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{pathData.activeLv.desc}</div>
            </div>
            <div style={{fontSize:12,fontWeight:800,color:activePalette.text,flexShrink:0}}>
              {pathData.activeLvDone}/{pathData.activeLv.items.length}
            </div>
          </div>

          <Bar v={pathData.activeLvDone} mx={pathData.activeLv.items.length} color={activePalette.text} h={6} />
          <div style={{fontSize:10,color:"var(--subtext)",marginTop:4,marginBottom:10,fontWeight:500}}>
            {pathData.activeLv.items.length - pathData.activeLvDone} milestone{pathData.activeLv.items.length - pathData.activeLvDone !== 1 ? "s" : ""} remaining in this level
          </div>

          {/* Milestone chips */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {pathData.activeLv.items.map((it, i) => {
              const done = it.ck(st);
              const isNext = !done && pathData.nextItem && it.id === pathData.nextItem.id;
              if (done) return (
                <span key={it.id} style={{borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600,
                  background:"#dcfce7",border:"1.5px solid #86efac",color:"#166534"}}>
                  ✓ {it.name}
                </span>
              );
              if (isNext) return (
                <button key={it.id}
                  onClick={() => { setScr(it.go); sCurEx(it.go); }}
                  style={{borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:800,
                    background:activePalette.grad,border:"none",color:"white",cursor:"pointer",
                    boxShadow:`0 2px 10px ${activePalette.border}88`,fontFamily:"'Outfit',sans-serif"}}>
                  ▶ {it.name}
                </button>
              );
              return (
                <span key={it.id} style={{borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600,
                  background:"#f1f5f9",border:"1.5px solid #e2e8f0",color:"#94a3b8"}}>
                  {it.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setScr("learnpath")}
          style={{width:"100%",padding:"14px",borderRadius:14,
            background:activePalette.grad,
            color:"white",fontSize:14,fontWeight:800,border:"none",cursor:"pointer",
            boxShadow:`0 4px 18px ${activePalette.border}66`,fontFamily:"'Outfit',sans-serif",
            letterSpacing:".01em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span>View Full Learning Path</span>
          <span style={{fontSize:18,lineHeight:1}}>→</span>
        </button>
      </div>

      {/* ── DAILY CHALLENGES ── */}
      <div style={{background:"var(--card)",border:"1.5px solid #e0e7ff",borderRadius:20,
        marginBottom:16,overflow:"hidden",boxShadow:"0 4px 20px rgba(124,58,237,.07)"}}>

        {allDone ? (
          /* Completed state */
          <div style={{padding:"18px 18px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#16a34a",flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:800,color:"#16a34a",letterSpacing:".08em",textTransform:"uppercase"}}>Daily Challenges</span>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:9,height:9,borderRadius:"50%",background:"#16a34a",border:"1.5px solid #16a34a"}}/>
                ))}
                <span style={{fontSize:11,fontWeight:700,color:"#16a34a",marginLeft:2}}>3/3</span>
              </div>
            </div>
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{fontSize:36,marginBottom:4}}>
                {dchlA.filter((a,i) => a && dchlSl[i] === dc.challenges[i].a).length >= 2 ? "🏆" : "🎯"}
              </div>
              <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:2}}>
                {dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length}/3 correct
                {' '}· +{dc.challenges.filter((ch,i) => dchlSl[i] === ch.a).length * 10} XP earned
              </div>
              <div style={{fontSize:11,color:"var(--subtext)"}}>New challenges at midnight</div>
            </div>
          </div>
        ) : (
          <>
            {/* Accordion header */}
            <div
              onClick={() => setDcOpen(o => !o)}
              style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                borderBottom:dcOpen ? "1px solid #e0e7ff" : "none",
                background:dcOpen ? "linear-gradient(135deg,#faf5ff,#f5f3ff)" : "var(--card)",
                transition:"background .2s"}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,
                boxShadow:"0 2px 8px rgba(124,58,237,.3)"}}>
                🎯
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#7c3aed"}}>Daily Challenges</div>
                <div style={{fontSize:10,color:"var(--subtext)",marginTop:1}}>
                  {doneCount === 0 ? "3 questions · earn up to +30 XP" : `${doneCount}/3 answered`}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:8,height:8,borderRadius:"50%",
                    background:dchlA[i]?"#16a34a":"#e2e8f0",border:`1.5px solid ${dchlA[i]?"#16a34a":"#cbd5e1"}`,
                    transition:"background .2s"}}/>
                ))}
                <div style={{fontSize:16,color:"var(--subtext)",marginLeft:4,
                  transform:dcOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>›</div>
              </div>
            </div>

            {/* Expanded questions */}
            {dcOpen && (
              <div style={{padding:"14px 18px 16px",display:"flex",flexDirection:"column",gap:10}}>
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
                      padding:"11px",transition:"all .2s",
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                        <span style={{width:20,height:20,borderRadius:"50%",background:answered?(correct?"#16a34a":"#dc2626"):"#7c3aed",
                          color:"white",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {answered ? (correct ? "✓" : "✗") : ci + 1}
                        </span>
                        <span style={{fontSize:13,fontWeight:700,color:"#1e293b",lineHeight:1.4}}>{ch.q}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
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
                              style={{padding:"7px 9px",border:`1.5px solid ${border}`,borderRadius:10,background:bg,
                                fontSize:11,fontWeight:600,cursor:answered?"default":"pointer",textAlign:"left",
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
                        <div style={{marginTop:6,fontSize:11,fontWeight:700,color:correct?"#166534":"#991b1b"}}>
                          {correct ? "✅ Correct! +10 XP" : `❌ Correct answer: ${ch.a}`}
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

      {/* ── QUICK PRACTICE ── */}
      <h3 className="sh">Quick Practice</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:10,fontWeight:500}}>Jump straight into a drill</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"12px"}}
          onClick={() => {
            const pool = allCats.flatMap(cc => V[cc]);
            const items = sh(pool).slice(0,10);
            sMcQ(items.map(w => { const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; }));
            sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame");
          }}>
          <div style={{width:38,height:38,borderRadius:11,background:"#fff7ed",border:"1px solid #fed7aa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🎯</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:"var(--heading)"}}>Quick Quiz</div>
            <div style={{fontSize:10,color:"var(--subtext)",marginTop:1}}>10 random words</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"12px"}}
          onClick={() => { const pool=allCats.flatMap(cc=>V[cc]); sFcPool(sh(pool).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards"); }}>
          <div style={{width:38,height:38,borderRadius:11,background:"#f5f3ff",border:"1px solid #ddd6fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🃏</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:"var(--heading)"}}>Flashcards</div>
            <div style={{fontSize:10,color:"var(--subtext)",marginTop:1}}>20 random words</div>
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
