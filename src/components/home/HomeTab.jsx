import React, { useState, useMemo } from 'react';
import { Bar, V, LEARN_PATH, getStreak, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak, getSR } from '../../data.jsx';

const LEVEL_PALETTE = [
  { grad: "linear-gradient(135deg,#92400e,#b45309)", light: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  { grad: "linear-gradient(135deg,#065f46,#059669)", light: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { grad: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", light: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
  { grad: "linear-gradient(135deg,#4c1d95,#6d28d9)", light: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  { grad: "linear-gradient(135deg,#7f1d1d,#dc2626)", light: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" },
];

export default function HomeTab({
  name, level, st,
  tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats, award,
  setTab, setScr, sCurEx,
  allCats, sh,
  launchPathItem,
  syncReady, onSyncNow, authUser,
}) {
  const dc = useMemo(getDailyChallenge, []);
  const ws = useMemo(getWeekStats, [st]);
  const streak = useMemo(getStreak, []);
  const proverb = useMemo(getProverbOfDay, []);
  const fact = useMemo(getHistFact, []);
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

  const pathData = useMemo(() => {
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
  }, [st]);

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];
  const nameInitial = (name || "U")[0].toUpperCase();

  return (
    <React.Fragment>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(150deg,#0a1628 0%,#0c3d6b 45%,#0a5a8a 100%)",
        borderRadius: 0,
        padding: "0 0 0",
        marginBottom: 0,
        position: "relative",
        overflow: "hidden",
        color: "white",
      }}>
        {/* Croatian flag tricolor stripe — top */}
        <div style={{display:"flex",height:6,width:"100%",boxShadow:"0 2px 8px rgba(0,0,0,.4)"}}>
          <div style={{flex:1,background:"#D4002D"}}/>
          <div style={{flex:1,background:"#F5F5F5"}}/>
          <div style={{flex:1,background:"#003DA5"}}/>
        </div>

        {/* ── Šahovnica grb — top right, large, proper Croatian red/white ── */}
        <svg
          style={{position:"absolute",top:6,right:-8,width:170,height:170,opacity:.28,pointerEvents:"none",filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))"}}
          viewBox="0 0 60 60"
        >
          {/* Full 5×5 šahovnica — white top-left (standard grb orientation) */}
          {[0,1,2,3,4].map(r=>[0,1,2,3,4].map(c=>(
            <rect key={`${r}-${c}`} x={c*12} y={r*12} width={12} height={12}
              fill={(r+c)%2===0 ? "#FFFFFF" : "#CC1024"}/>
          )))}
          {/* Thin border around the grb */}
          <rect x={0} y={0} width={60} height={60} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
        </svg>

        {/* ── Croatian Pletar (three-ribbon interlace frieze) — bottom strip ── */}
        {/* Pletar = three parallel ribbons that weave over/under in a repeating band.
            Rendered as a horizontal frieze using layered sine-wave paths with
            over-under masking to create the woven braid effect. */}
        <svg
          style={{position:"absolute",bottom:0,left:0,width:"100%",height:40,opacity:.32,pointerEvents:"none"}}
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Mask to cut ribbon A where ribbon B passes over */}
            <mask id="mA">
              <rect width="400" height="40" fill="white"/>
              {/* cut-outs where B crosses over A */}
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>(
                <ellipse key={i} cx={i*26+6} cy={20} rx={5} ry={7} fill="black"/>
              ))}
            </mask>
            <mask id="mB">
              <rect width="400" height="40" fill="white"/>
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>(
                <ellipse key={i} cx={i*26+19} cy={20} rx={5} ry={7} fill="black"/>
              ))}
            </mask>
          </defs>
          {/* Ribbon C — bottom layer (dark navy, continuous) */}
          <path d="M-10,20 Q3,6 16,20 Q29,34 42,20 Q55,6 68,20 Q81,34 94,20 Q107,6 120,20 Q133,34 146,20 Q159,6 172,20 Q185,34 198,20 Q211,6 224,20 Q237,34 250,20 Q263,6 276,20 Q289,34 302,20 Q315,6 328,20 Q341,34 354,20 Q367,6 380,20 Q393,34 410,20"
            fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="7" strokeLinecap="round"/>
          {/* Ribbon A — mid layer (white), masked where B crosses over */}
          <path d="M-10,13 Q3,27 16,13 Q29,-1 42,13 Q55,27 68,13 Q81,-1 94,13 Q107,27 120,13 Q133,-1 146,13 Q159,27 172,13 Q185,-1 198,13 Q211,27 224,13 Q237,-1 250,13 Q263,27 276,13 Q289,-1 302,13 Q315,27 328,13 Q341,-1 354,13 Q367,27 380,13 Q393,-1 410,13"
            fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" mask="url(#mA)"/>
          {/* Ribbon B — top layer (red), masked where A crosses over */}
          <path d="M-10,27 Q3,13 16,27 Q29,41 42,27 Q55,13 68,27 Q81,41 94,27 Q107,13 120,27 Q133,41 146,27 Q159,13 172,27 Q185,41 198,27 Q211,13 224,27 Q237,41 250,27 Q263,13 276,27 Q289,41 302,27 Q315,13 328,27 Q341,41 354,27 Q367,13 380,27 Q393,41 410,27"
            fill="none" stroke="#CC1024" strokeWidth="6" strokeLinecap="round" mask="url(#mB)"/>
        </svg>

        <div style={{padding:"18px 20px 44px"}}>

        {/* Top row: brand label */}
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:20}}>
          <div style={{
            width:44,height:44,borderRadius:10,overflow:"hidden",
            border:"2px solid rgba(255,255,255,.3)",
            boxShadow:"0 4px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.2)",
            flexShrink:0,
          }}>
            <svg width="44" height="44" viewBox="0 0 3 3">
              {[0,1,2].map(r=>[0,1,2].map(c=>(
                <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1}
                  fill={(r+c)%2===0 ? "#FFFFFF" : "#CC1024"}/>
              )))}
            </svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:900,letterSpacing:".02em",lineHeight:1,color:"white",fontFamily:"'Playfair Display',serif"}}>Naša Hrvatska</div>
            <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,.55)",letterSpacing:".08em",textTransform:"uppercase",marginTop:2}}>Learn Croatian</div>
          </div>
        </div>

        {/* Greeting — centred, large, prominent */}
        <div style={{textAlign:"center",marginBottom:6}}>
          <div style={{
            fontSize:13,fontWeight:700,
            color:"rgba(255,255,255,.65)",
            letterSpacing:".12em",
            textTransform:"uppercase",
            marginBottom:4,
          }}>
            {greetingByTime()}
          </div>
          <div style={{
            fontSize:32,fontWeight:900,
            fontFamily:"'Playfair Display',serif",
            letterSpacing:"-.01em",lineHeight:1.1,
            textShadow:"0 2px 24px rgba(0,0,0,.5)",
          }}>
            {name || "Učenik"} 👋
          </div>
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
        </div>{/* end padding wrapper */}
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
          onClick={() => { if (pathData.nextItem) { launchPathItem(pathData.nextItem); } else setScr("learnpath"); }}
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

      {/* ── CLOUD SYNC STATUS ── */}
      {(() => {
        const lastSaved = authUser && authUser.u ? (() => {
          try { const p = JSON.parse(localStorage.getItem('uP_' + authUser.u) || 'null'); return p && p.savedAt ? new Date(p.savedAt) : null; } catch { return null; }
        })() : null;
        return (
          <div style={{
            background: syncReady ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
            border: `1.5px solid ${syncReady ? "#86efac" : "#cbd5e1"}`,
            borderRadius: 16, padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: syncReady ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#94a3b8,#64748b)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              {syncReady ? "☁️" : "⏳"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: syncReady ? "#15803d" : "#64748b", lineHeight: 1.2 }}>
                {syncReady ? "✓ Progress backed up to cloud" : "Connecting to cloud…"}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${lastSaved.toLocaleDateString()}` : syncReady ? "Saving now…" : "Please wait"}
              </div>
            </div>
            {syncReady && onSyncNow && (
              <button onClick={onSyncNow} style={{
                padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#16a34a,#15803d)",
                color: "#fff", fontSize: 11, fontWeight: 800,
                fontFamily: "'Outfit',sans-serif", flexShrink: 0,
              }}>
                Sync Now
              </button>
            )}
          </div>
        );
      })()}

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

      {/* ── PROGRESS SNAPSHOT ── */}
      <div style={{
        background:"var(--card)",
        border:`1.5px solid ${activePalette.border}`,
        borderRadius:18,padding:"14px 18px",
        marginBottom:16,
        display:"flex",alignItems:"center",gap:16,
        boxShadow:`0 4px 16px ${activePalette.border}33`,
      }}>
        <div style={{
          width:56,height:56,borderRadius:14,flexShrink:0,
          background:activePalette.grad,
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"white",fontWeight:900,fontSize:17,
          boxShadow:`0 4px 14px ${activePalette.border}55`,
        }}>
          {pathData.pct}%
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--subtext)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Overall Progress</div>
          <div style={{fontSize:15,fontWeight:900,color:"var(--heading)"}}>
            {pathData.activeLv.title}
            <span style={{fontSize:11,fontWeight:600,color:"var(--subtext)",marginLeft:6}}>Stage {pathData.activeLv.level}</span>
          </div>
          <div style={{height:5,background:"var(--bar-bg)",borderRadius:3,overflow:"hidden",marginTop:6}}>
            <div style={{height:"100%",width:pathData.pct+"%",background:activePalette.grad,borderRadius:3,transition:"width .6s ease"}}/>
          </div>
          <div style={{fontSize:10,color:"var(--subtext)",marginTop:4,fontWeight:500}}>
            {pathData.totalDone} of {pathData.totalItems} milestones complete
          </div>
        </div>
        <button
          onClick={() => setScr("learnpath")}
          style={{
            fontSize:11,fontWeight:800,
            background:"none",border:`1.5px solid ${activePalette.border}`,
            borderRadius:10,padding:"8px 12px",cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",flexShrink:0,
            whiteSpace:"nowrap",color:activePalette.text,
          }}>
          Full Path →
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
              background:"#f0f9ff",
              border:"1.5px solid #bae6fd",
              borderRadius:10,padding:"6px 14px",
              fontSize:12,fontWeight:700,color:"#0e7490",
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",
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
