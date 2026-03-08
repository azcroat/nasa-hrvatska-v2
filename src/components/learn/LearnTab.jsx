import React from 'react';
import { H, V, GRAM } from '../../data.jsx';

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
      <h3 className="sh">{"📚 Vocabulary (" + allCats.length + " categories)"}</h3>
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
      <h3 className="sh">📝 Grammar</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { setTnVerb(0); setTnTense("present"); setTnGender("m"); setTnMode("learn"); setScr("tenses"); sCurEx("tenses"); }}>
          <div style={{fontSize:28}}>🔄</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Tenses & Gender</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sCzMode("learn"); setScr("padezi"); sCurEx("padezi"); }}>
          <div style={{fontSize:28}}>📝</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Cases Intro</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sPfTab("sing"); sPfGender("f"); sPfMode("learn"); setScr("padezifull"); sCurEx("padezifull"); }}>
          <div style={{fontSize:28}}>📚</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Padeži Master</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sDcMode("learn"); setScr("declension"); }}>
          <div style={{fontSize:28}}>📝</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Declension</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sAsMode("learn"); setScr("aspect"); }}>
          <div style={{fontSize:28}}>↔️</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Verb Aspect</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sCjMode("menu"); setScr("conjdrill"); sCurEx("conjdrill"); }}>
          <div style={{fontSize:28}}>🔀</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Conjugation</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sM7("menu"); setScr("modal"); }}>
          <div style={{fontSize:28}}>🔮</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Modal Verbs</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sBjMode("learn"); setScr("boje"); sCurEx("boje"); }}>
          <div style={{fontSize:28}}>🎨</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Colors & Gender</div>
        </button>
        <button className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sGl(GRAM.beginner[0]); sGp("learn"); sGx(0); sGs(0); sGa(false); sGsl(-1); setScr("grammar"); sCurEx("grammar"); }}>
          <div style={{fontSize:28}}>📜</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Grammar Intro</div>
        </button>
      </div>
      <h3 className="sh" style={{marginTop:16}}>🌏 Vocabulary Themes</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[
          ["🌍","Countries","countries"],
          ["💼","Professions","professions"],
          ["🌤️","Weather","weather"],
          ["👗","Clothing","clothes"],
          ["👤","Appearance","bodydesc"],
          ["🔤","Pronunciation","phonology"],
        ].map(([icon,label,screen])=>(
          <button key={screen} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={()=>setScr(screen)}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{label}</div>
          </button>
        ))}
      </div>
      <h3 className="sh">📖 Reading</h3>
      <button className="tc" style={{padding:"14px"}} onClick={() => setScr("readlist")}>
        <div style={{fontSize:14,fontWeight:700}}>📖 Reading Passages</div>
        <div style={{fontSize:12,color:"var(--subtext)"}}>11 stories across 3 levels</div>
      </button>
      <h3 className="sh" style={{marginTop:16}}>📌 Reference</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          ["🔤","Alphabet","alphabet"],
          ["🧩","Word Patterns","wordform"],
          ["🐣","Diminutives","diminutives"],
          ["🗺️","Dialects","dialects"],
          ["⚠️","False Friends","falsefr"],
          ["🎨","Color Quirks","colorquirk"],
          ["🪞","Svoj vs Moj","svojmoj"],
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
