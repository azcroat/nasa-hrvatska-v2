import React, { useState, useMemo } from 'react';
import { Bar, V, LEARN_PATH, getStreak, getStreakFreezes, spendFreeze, getProverbOfDay, getHistFact, getDailyChallenge, lXP, nXP, speak, getSR } from '../../data.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';

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
  const [freezes, setFreezes] = useState(getStreakFreezes);
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

        {/* ── Grb Hrvatske — proper heraldic coat of arms, top right ── */}
        <div style={{position:"absolute",top:10,right:10,pointerEvents:"none",opacity:.72,filter:"drop-shadow(0 6px 20px rgba(0,0,0,.7))"}}>
          <CroatianGrb size={148} />
        </div>

        {/* ── Croatian Pletar — traditional three-strand stone interlace frieze ── */}
        {/*
          The pletar (pleter) is a 9th–11th century Croatian pre-Romanesque
          interlace ornament carved in stone churches across Dalmatia & Slavonia.
          Three ribbon strands weave over and under each other in a continuous
          repeating braid. Rendered as thick stroked sine waves with layered
          shadow+colour and mask-based over/under crossings.
          Colors: Croatian red · parchment white · royal blue
        */}
        <svg
          style={{position:"absolute",bottom:0,left:0,width:"100%",height:54,opacity:.60,pointerEvents:"none"}}
          viewBox="0 0 400 54"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/*
              Three sine-wave strands, period P=40px:
                Strand R (red):   y = 27 + 14·sin(2πx/40)          phase 0
                Strand W (white): y = 27 + 14·sin(2πx/40 – 2π/3)   phase –P/3
                Strand B (blue):  y = 27 + 14·sin(2πx/40 – 4π/3)   phase –2P/3

              Crossings R∩W at x ≈  6.7, 26.7, 46.7, … (every 20px, offset 6.7)
              Crossings W∩B at x ≈ 20,   40,   60,   … (every 20px, offset 20)
              Crossings R∩B at x ≈ 13.3, 33.3, 53.3, … (every 20px, offset 13.3)

              Over/under order (clockwise braid): R over W, W over B, B over R
              → Cut R where B crosses over it (every 20px, offset ≈13)
              → Cut W where R crosses over it (every 20px, offset ≈7)
              → Cut B where W crosses over it (every 20px, offset ≈20)
            */}
            {/* Mask for Strand W — hide where R passes over W */}
            <mask id="htMW">
              <rect width="400" height="54" fill="white"/>
              {Array.from({length:21},(_,i)=>(
                <ellipse key={i} cx={i*20+6.7} cy={27} rx={6} ry={11} fill="black"/>
              ))}
            </mask>
            {/* Mask for Strand B — hide where W passes over B */}
            <mask id="htMB">
              <rect width="400" height="54" fill="white"/>
              {Array.from({length:21},(_,i)=>(
                <ellipse key={i} cx={i*20+20} cy={27} rx={6} ry={11} fill="black"/>
              ))}
            </mask>
            {/* Mask for Strand R — hide where B passes over R */}
            <mask id="htMR">
              <rect width="400" height="54" fill="white"/>
              {Array.from({length:21},(_,i)=>(
                <ellipse key={i} cx={i*20+13.3} cy={27} rx={6} ry={11} fill="black"/>
              ))}
            </mask>
          </defs>

          {/* ── Bottom fade gradient overlay (blends into hero) ── */}
          <defs>
            <linearGradient id="htFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(10,22,40,0)"/>
              <stop offset="100%" stopColor="rgba(10,22,40,0.55)"/>
            </linearGradient>
          </defs>

          {/* ── Layer 0: single dark shadow pass for all three strands (depth) ── */}
          {/* R shadow */}
          <path d="M-10,27 Q-5,13 0,27 Q5,41 10,27 Q15,13 20,27 Q25,41 30,27 Q35,13 40,27 Q45,41 50,27 Q55,13 60,27 Q65,41 70,27 Q75,13 80,27 Q85,41 90,27 Q95,13 100,27 Q105,41 110,27 Q115,13 120,27 Q125,41 130,27 Q135,13 140,27 Q145,41 150,27 Q155,13 160,27 Q165,41 170,27 Q175,13 180,27 Q185,41 190,27 Q195,13 200,27 Q205,41 210,27 Q215,13 220,27 Q225,41 230,27 Q235,13 240,27 Q245,41 250,27 Q255,13 260,27 Q265,41 270,27 Q275,13 280,27 Q285,41 290,27 Q295,13 300,27 Q305,41 310,27 Q315,13 320,27 Q325,41 330,27 Q335,13 340,27 Q345,41 350,27 Q355,13 360,27 Q365,41 370,27 Q375,13 380,27 Q385,41 390,27 Q395,13 410,27"
            fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="13" strokeLinecap="round"/>
          {/* W shadow */}
          <path d="M-23.3,27 Q-18.3,13 -13.3,27 Q-8.3,41 -3.3,27 Q1.7,13 6.7,27 Q11.7,41 16.7,27 Q21.7,13 26.7,27 Q31.7,41 36.7,27 Q41.7,13 46.7,27 Q51.7,41 56.7,27 Q61.7,13 66.7,27 Q71.7,41 76.7,27 Q81.7,13 86.7,27 Q91.7,41 96.7,27 Q101.7,13 106.7,27 Q111.7,41 116.7,27 Q121.7,13 126.7,27 Q131.7,41 136.7,27 Q141.7,13 146.7,27 Q151.7,41 156.7,27 Q161.7,13 166.7,27 Q171.7,41 176.7,27 Q181.7,13 186.7,27 Q191.7,41 196.7,27 Q201.7,13 206.7,27 Q211.7,41 216.7,27 Q221.7,13 226.7,27 Q231.7,41 236.7,27 Q241.7,13 246.7,27 Q251.7,41 256.7,27 Q261.7,13 266.7,27 Q271.7,41 276.7,27 Q281.7,13 286.7,27 Q291.7,41 296.7,27 Q301.7,13 306.7,27 Q311.7,41 316.7,27 Q321.7,13 326.7,27 Q331.7,41 336.7,27 Q341.7,13 346.7,27 Q351.7,41 356.7,27 Q361.7,13 366.7,27 Q371.7,41 376.7,27 Q381.7,13 386.7,27 Q391.7,41 396.7,27 Q401.7,13 416.7,27"
            fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="13" strokeLinecap="round"/>
          {/* B shadow */}
          <path d="M-16.7,27 Q-11.7,13 -6.7,27 Q-1.7,41 3.3,27 Q8.3,13 13.3,27 Q18.3,41 23.3,27 Q28.3,13 33.3,27 Q38.3,41 43.3,27 Q48.3,13 53.3,27 Q58.3,41 63.3,27 Q68.3,13 73.3,27 Q78.3,41 83.3,27 Q88.3,13 93.3,27 Q98.3,41 103.3,27 Q108.3,13 113.3,27 Q118.3,41 123.3,27 Q128.3,13 133.3,27 Q138.3,41 143.3,27 Q148.3,13 153.3,27 Q158.3,41 163.3,27 Q168.3,13 173.3,27 Q178.3,41 183.3,27 Q188.3,13 193.3,27 Q198.3,41 203.3,27 Q208.3,13 213.3,27 Q218.3,41 223.3,27 Q228.3,13 233.3,27 Q238.3,41 243.3,27 Q248.3,13 253.3,27 Q258.3,41 263.3,27 Q268.3,13 273.3,27 Q278.3,41 283.3,27 Q288.3,13 293.3,27 Q298.3,41 303.3,27 Q308.3,13 313.3,27 Q318.3,41 323.3,27 Q328.3,13 333.3,27 Q338.3,41 343.3,27 Q348.3,13 353.3,27 Q358.3,41 363.3,27 Q368.3,13 373.3,27 Q378.3,41 383.3,27 Q388.3,13 393.3,27 Q398.3,41 403.3,27 Q408.3,13 423.3,27"
            fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="13" strokeLinecap="round"/>

          {/* ── Layer 1: Strand R (red) — masked where B crosses over ── */}
          <path d="M-10,27 Q-5,13 0,27 Q5,41 10,27 Q15,13 20,27 Q25,41 30,27 Q35,13 40,27 Q45,41 50,27 Q55,13 60,27 Q65,41 70,27 Q75,13 80,27 Q85,41 90,27 Q95,13 100,27 Q105,41 110,27 Q115,13 120,27 Q125,41 130,27 Q135,13 140,27 Q145,41 150,27 Q155,13 160,27 Q165,41 170,27 Q175,13 180,27 Q185,41 190,27 Q195,13 200,27 Q205,41 210,27 Q215,13 220,27 Q225,41 230,27 Q235,13 240,27 Q245,41 250,27 Q255,13 260,27 Q265,41 270,27 Q275,13 280,27 Q285,41 290,27 Q295,13 300,27 Q305,41 310,27 Q315,13 320,27 Q325,41 330,27 Q335,13 340,27 Q345,41 350,27 Q355,13 360,27 Q365,41 370,27 Q375,13 380,27 Q385,41 390,27 Q395,13 410,27"
            fill="none" stroke="#D40030" strokeWidth="9" strokeLinecap="round" mask="url(#htMR)"/>

          {/* ── Layer 2: Strand W (parchment white) — masked where R crosses over ── */}
          <path d="M-23.3,27 Q-18.3,13 -13.3,27 Q-8.3,41 -3.3,27 Q1.7,13 6.7,27 Q11.7,41 16.7,27 Q21.7,13 26.7,27 Q31.7,41 36.7,27 Q41.7,13 46.7,27 Q51.7,41 56.7,27 Q61.7,13 66.7,27 Q71.7,41 76.7,27 Q81.7,13 86.7,27 Q91.7,41 96.7,27 Q101.7,13 106.7,27 Q111.7,41 116.7,27 Q121.7,13 126.7,27 Q131.7,41 136.7,27 Q141.7,13 146.7,27 Q151.7,41 156.7,27 Q161.7,13 166.7,27 Q171.7,41 176.7,27 Q181.7,13 186.7,27 Q191.7,41 196.7,27 Q201.7,13 206.7,27 Q211.7,41 216.7,27 Q221.7,13 226.7,27 Q231.7,41 236.7,27 Q241.7,13 246.7,27 Q251.7,41 256.7,27 Q261.7,13 266.7,27 Q271.7,41 276.7,27 Q281.7,13 286.7,27 Q291.7,41 296.7,27 Q301.7,13 306.7,27 Q311.7,41 316.7,27 Q321.7,13 326.7,27 Q331.7,41 336.7,27 Q341.7,13 346.7,27 Q351.7,41 356.7,27 Q361.7,13 366.7,27 Q371.7,41 376.7,27 Q381.7,13 386.7,27 Q391.7,41 396.7,27 Q401.7,13 416.7,27"
            fill="none" stroke="#F0E8D0" strokeWidth="9" strokeLinecap="round" mask="url(#htMW)"/>

          {/* ── Layer 3: Strand B (blue) — masked where W crosses over ── */}
          <path d="M-16.7,27 Q-11.7,13 -6.7,27 Q-1.7,41 3.3,27 Q8.3,13 13.3,27 Q18.3,41 23.3,27 Q28.3,13 33.3,27 Q38.3,41 43.3,27 Q48.3,13 53.3,27 Q58.3,41 63.3,27 Q68.3,13 73.3,27 Q78.3,41 83.3,27 Q88.3,13 93.3,27 Q98.3,41 103.3,27 Q108.3,13 113.3,27 Q118.3,41 123.3,27 Q128.3,13 133.3,27 Q138.3,41 143.3,27 Q148.3,13 153.3,27 Q158.3,41 163.3,27 Q168.3,13 173.3,27 Q178.3,41 183.3,27 Q188.3,13 193.3,27 Q198.3,41 203.3,27 Q208.3,13 213.3,27 Q218.3,41 223.3,27 Q228.3,13 233.3,27 Q238.3,41 243.3,27 Q248.3,13 253.3,27 Q258.3,41 263.3,27 Q268.3,13 273.3,27 Q278.3,41 283.3,27 Q288.3,13 293.3,27 Q298.3,41 303.3,27 Q308.3,13 313.3,27 Q318.3,41 323.3,27 Q328.3,13 333.3,27 Q338.3,41 343.3,27 Q348.3,13 353.3,27 Q358.3,41 363.3,27 Q368.3,13 373.3,27 Q378.3,41 383.3,27 Q388.3,13 393.3,27 Q398.3,41 403.3,27 Q408.3,13 423.3,27"
            fill="none" stroke="#003DA5" strokeWidth="9" strokeLinecap="round" mask="url(#htMB)"/>

          {/* ── Fade overlay ── */}
          <rect width="400" height="54" fill="url(#htFade)"/>
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

        {/* Streak freeze */}
        <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
          {freezes>0?(
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.15)',borderRadius:20,padding:'5px 12px'}}>
              <span style={{fontSize:14}}>🛡️</span>
              <span style={{fontSize:12,color:'white',fontWeight:700}}>{freezes} streak freeze{freezes>1?'s':''}</span>
            </div>
          ):(
            <button onClick={()=>{if(st.xp>=200){spendFreeze();setFreezes(f=>f+1);alert('Streak freeze earned! Your streak is now protected for one missed day.');} else alert('You need 200 XP to earn a streak freeze.');}}
              style={{background:'rgba(255,255,255,.15)',border:'1px dashed rgba(255,255,255,.4)',borderRadius:20,padding:'5px 12px',fontSize:12,color:'white',fontWeight:700,cursor:'pointer'}}>
              🛡️ Earn Streak Freeze (200 XP)
            </button>
          )}
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
