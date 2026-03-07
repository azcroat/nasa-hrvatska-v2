import React from 'react';
import { H, V } from '../../data.jsx';

export default function LearnTab({
  allCats, icons, setScr, sCurEx,
  sh, sLt, sLi, sLx, sLs, sLp, sLa, sLsl,
  setTnVerb, setTnTense, setTnGender, setTnMode,
  sCzMode, sPfTab, sPfGender, sPfMode, sDcMode, sAsMode, sCjMode, sM7, sBjMode,
}) {
  return (
    <React.Fragment>
      {H("📚 Learn Croatian", "Vocabulary, grammar & reading")}
      <h3 className="sh">{"📚 Vocabulary (" + allCats.length + " categories)"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {allCats.map(t => (
          <div key={t} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => {
            const items = sh(V[t]);
            sLt(t); sLi(items); sCurEx("vocab_" + t); sLx(0); sLs(0); sLp("learn"); sLa(false); sLsl(-1);
            setScr("lesson"); sCurEx("lesson");
          }}>
            <div style={{fontSize:24}}>{icons[t] || "📚"}</div>
            <div style={{fontSize:12,fontWeight:700,marginTop:4,textTransform:"capitalize"}}>{t}</div>
            <div style={{fontSize:10,color:"#a8a29e"}}>{V[t].length} words</div>
          </div>
        ))}
      </div>
      <h3 className="sh">📝 Grammar</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { setTnVerb(0); setTnTense("present"); setTnGender("m"); setTnMode("learn"); setScr("tenses"); sCurEx("tenses"); }}>
          <div style={{fontSize:28}}>🔄</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Tenses & Gender</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sCzMode("learn"); setScr("padezi"); sCurEx("padezi"); }}>
          <div style={{fontSize:28}}>📝</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Cases Intro</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sPfTab("sing"); sPfGender("f"); sPfMode("learn"); setScr("padezifull"); sCurEx("padezifull"); }}>
          <div style={{fontSize:28}}>📚</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Padeži Master</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sDcMode("learn"); setScr("declension"); }}>
          <div style={{fontSize:28}}>📝</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Declension</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sAsMode("learn"); setScr("aspect"); }}>
          <div style={{fontSize:28}}>🔄</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Verb Aspect</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sCjMode("menu"); setScr("conjdrill"); sCurEx("conjdrill"); }}>
          <div style={{fontSize:28}}>🔄</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Conjugation</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sM7("menu"); setScr("modal"); }}>
          <div style={{fontSize:28}}>🔮</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Modal Verbs</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sBjMode("learn"); setScr("boje"); sCurEx("boje"); }}>
          <div style={{fontSize:28}}>🎨</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Colors & Gender</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { setScr("grammar"); sCurEx("grammar"); }}>
          <div style={{fontSize:28}}>📜</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Grammar Intro</div>
        </div>
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
          <div key={screen} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={()=>setScr(screen)}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <h3 className="sh">📖 Reading</h3>
      <div className="tc" style={{padding:"14px"}} onClick={() => setScr("readlist")}>
        <div style={{fontSize:14,fontWeight:700}}>📖 Reading Passages</div>
        <div style={{fontSize:12,color:"#78716c"}}>11 stories across 3 levels</div>
      </div>
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
          <div key={screen} className="tc" style={{textAlign:"center",padding:"12px 8px"}} onClick={() => setScr(screen)}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
