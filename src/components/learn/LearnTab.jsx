import React from 'react';
import { H, V, GRAM } from '../../data.jsx';

function LevelBadge({ label, color, bg }) {
  return (
    <span style={{fontSize:9,fontWeight:800,color,background:bg,borderRadius:6,padding:"2px 7px",
      letterSpacing:".05em",textTransform:"uppercase",flexShrink:0}}>
      {label}
    </span>
  );
}

export default function LearnTab({
  allCats, icons, setScr, sCurEx,
  sh, sLt, sLi, sLx, sLs, sLp, sLa, sLsl,
  setTnVerb, setTnTense, setTnGender, setTnMode,
  sCzMode, sPfTab, sPfGender, sPfMode, sDcMode, sAsMode, sCjMode, sM7, sBjMode,
  sGl, sGp, sGx, sGs, sGa, sGsl,
}) {
  return (
    <React.Fragment>
      {H("📚 Learn Croatian", "Vocabulary, grammar & reading")}

      {/* ── VOCABULARY ── */}
      <h3 className="sh">📚 Vocabulary</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>
        {allCats.length} categories · tap any to start a lesson
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {allCats.map(t => (
          <button key={t} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => {
            const items = sh(V[t]);
            sLt(t); sLi(items); sCurEx("vocab_" + t); sLx(0); sLs(0); sLp("learn"); sLa(false); sLsl(-1);
            setScr("lesson"); sCurEx("lesson");
          }}>
            <div style={{fontSize:24}}>{icons[t] || "📚"}</div>
            <div style={{fontSize:12,fontWeight:700,marginTop:4,textTransform:"capitalize"}}>{t}</div>
            <div style={{fontSize:10,color:"var(--subtext)"}}>{V[t].length} words</div>
          </button>
        ))}
      </div>

      {/* ── VOCABULARY THEMES ── */}
      <h3 className="sh">🌏 Vocabulary Themes</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>Expand beyond everyday categories</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[
          ["🌍","Countries",    "countries"],
          ["💼","Professions",  "professions"],
          ["🌤️","Weather",     "weather"],
          ["👗","Clothing",     "clothes"],
          ["👤","Appearance",   "bodydesc"],
          ["🔤","Pronunciation","phonology"],
        ].map(([icon,label,screen]) => (
          <button key={screen} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => setScr(screen)}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{label}</div>
          </button>
        ))}
      </div>

      {/* ── GRAMMAR ── */}
      <h3 className="sh">📝 Grammar</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:14,fontWeight:500}}>Structured lessons from basics to advanced</p>

      {/* Foundation */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <LevelBadge label="Foundation" color="#16a34a" bg="#f0fdf4" />
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          ["📜","Grammar Intro",   () => { sGl(GRAM.beginner[0]); sGp("learn"); sGx(0); sGs(0); sGa(false); sGsl(-1); setScr("grammar"); sCurEx("grammar"); }],
          ["🔄","Tenses & Gender", () => { setTnVerb(0); setTnTense("present"); setTnGender("m"); setTnMode("learn"); setScr("tenses"); sCurEx("tenses"); }],
          ["📝","Cases Intro",     () => { sCzMode("learn"); setScr("padezi"); sCurEx("padezi"); }],
          ["🎨","Colors & Gender", () => { sBjMode("learn"); setScr("boje"); sCurEx("boje"); }],
        ].map(([icon, label, fn]) => (
          <button key={label} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",textAlign:"left"}} onClick={fn}>
            <div style={{fontSize:22,flexShrink:0}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:800,color:"var(--heading)"}}>{label}</div>
          </button>
        ))}
      </div>

      {/* Intermediate */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <LevelBadge label="Intermediate" color="#d97706" bg="#fffbeb" />
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          ["📚","Padeži Master", () => { sPfTab("sing"); sPfGender("f"); sPfMode("learn"); setScr("padezifull"); sCurEx("padezifull"); }],
          ["↔️","Verb Aspect",   () => { sAsMode("learn"); setScr("aspect"); }],
          ["🔀","Conjugation",   () => { sCjMode("menu"); setScr("conjdrill"); sCurEx("conjdrill"); }],
        ].map(([icon, label, fn]) => (
          <button key={label} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",textAlign:"left"}} onClick={fn}>
            <div style={{fontSize:22,flexShrink:0}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:800,color:"var(--heading)"}}>{label}</div>
          </button>
        ))}
      </div>

      {/* Advanced */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <LevelBadge label="Advanced" color="#7c3aed" bg="#f5f3ff" />
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[
          ["🔮","Modal Verbs", () => { sM7("menu"); setScr("modal"); }],
          ["📝","Declension",  () => { sDcMode("learn"); setScr("declension"); }],
        ].map(([icon, label, fn]) => (
          <button key={label} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",textAlign:"left"}} onClick={fn}>
            <div style={{fontSize:22,flexShrink:0}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:800,color:"var(--heading)"}}>{label}</div>
          </button>
        ))}
      </div>

      {/* ── READING ── */}
      <h3 className="sh">📖 Reading</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>Structured passages at A1 to B2 level</p>
      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:24}} onClick={() => setScr("readlist")}>
        <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #bbf7d0",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📖</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Reading Passages</div>
          <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>11 stories across 3 levels</div>
        </div>
        <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
      </button>

      {/* ── REFERENCE ── */}
      <h3 className="sh">📌 Reference</h3>
      <p style={{fontSize:12,color:"var(--subtext)",marginTop:-6,marginBottom:12,fontWeight:500}}>Quick guides to keep on hand</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          ["🔤","Alphabet",     "alphabet"],
          ["🧩","Word Patterns","wordform"],
          ["🐣","Diminutives",  "diminutives"],
          ["🗺️","Dialects",    "dialects"],
          ["⚠️","False Friends","falsefr"],
          ["🎨","Color Quirks", "colorquirk"],
          ["🪞","Svoj vs Moj",  "svojmoj"],
        ].map(([icon, label, screen]) => (
          <button key={screen} className="tc" style={{textAlign:"center",padding:"12px 8px"}} onClick={() => setScr(screen)}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{label}</div>
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}
