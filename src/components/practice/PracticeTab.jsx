import React from 'react';
import { H, V, LISTEN, UNJUMBLE, PREPDRILL, NUMTIME, getSR } from '../../data.jsx';

export default function PracticeTab({
  allCats, sh, setScr, sCurEx,
  sMcQ, sMcI, sMcS, sMcA, sMcSl,
  sFcPool, sFcI, sFcFlip, sFcKnow,
  sMp, sMsl, sMm, sGsc, sGph,
  sTyPool, sTyI, sTyS, sTyIn, sTyA, sTyW,
  sLsQ, sLsI, sLsS, sLsA, sLsSl, sLsO,
  sSi, sSx, sSw, sSr, sSsc,
  sZnMode,
  sUjQ, sUjI, sUjS, sUjIn, sUjA,
  sPpQ, sPpI, sPpS, sPpA, sPpSl,
  sNtQ, sNtI, sNtS, sNtA, sNtSl, sNtO,
  sEvM,
}) {
  const pool = () => allCats.flatMap(cc => V[cc]);

  function startQuiz() {
    const p = pool();
    const items = sh(p).slice(0,10);
    sMcQ(items.map(w => { const wr=sh(p.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; }));
    sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame"); sCurEx("mcgame");
  }

  function startFlashcards() {
    const p = pool();
    sFcPool(sh(p).slice(0,20)); sFcI(0); sFcFlip(false); sFcKnow(0); setScr("flashcards"); sCurEx("flashcards");
  }

  function startMatch() {
    const p = pool();
    const sel = sh(p).slice(0,6);
    sMp(sh(sel.map((w,i)=>({id:"h"+i,t:w[0],p:i,tp:"hr"})).concat(sel.map((w,i)=>({id:"e"+i,t:w[1],p:i,tp:"en"})))));
    sMsl([]); sMm([]); sGsc(0); sGph("play"); setScr("match"); sCurEx("match");
  }

  function startTyping() {
    const p = pool();
    const items = sh(p).slice(0,10);
    sTyPool(items); sTyI(0); sTyS(0); sTyIn(""); sTyA(false); sTyW(items[0]); setScr("typing"); sCurEx("typing");
  }

  function startListening() {
    const q = sh(LISTEN).slice(0,8);
    sLsQ(q); sLsI(0); sLsS(0); sLsA(false); sLsSl(-1); sLsO(sh(q[0].opts)); setScr("listening"); sCurEx("listening");
  }

  function startSpeaking() {
    const p = pool();
    const items = sh(p).slice(0,6);
    sSi(items); sSx(0); sSw(items[0]); sSr(null); sSsc(0); setScr("speaking"); sCurEx("speaking");
  }

  function startWeakWords() {
    const d = getSR();
    const p = pool();
    const weak = Object.entries(d).filter(e=>e[1].w>0).sort((a,b)=>(b[1].w/(b[1].r+1))-(a[1].w/(a[1].r+1)));
    if (weak.length < 3) { alert("Keep practicing! Wrong words appear here."); return; }
    const weakWords = weak.slice(0,15).map(e=>p.find(w=>w[0]===e[0])).filter(Boolean);
    if (weakWords.length < 3) { alert("Not enough weak words yet."); return; }
    const items = weakWords.map(w => { const wr=sh(p.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; });
    sMcQ(items); sMcI(0); sMcS(0); sMcA(false); sMcSl(-1); setScr("mcgame"); sCurEx("mcgame");
  }

  const exercises = [
    ["🇭🇷","Translate","znam"],
    ["🧩","Word Order","unjumble"],
    ["📍","Prepositions","prepdrill"],
    ["🔢","Numbers","numtime"],
    ["👨‍⚖️","M/F Jobs","profgender"],
    ["📈","Compare","comparatives"],
    ["🚀","Future","future"],
    ["🔄","k→c/g→z","sibil"],
    ["🍽️","Restaurant","restaurant"],
    ["❓","Questions","qwords"],
    ["❌","Negation","negation"],
    ["👤","My/Your","possess"],
    ["🎨","Colors+","coloragree"],
    ["↔️","Opposites","opposites"],
    ["🏙️","Cities","cityloc"],
    ["🍽️","Accusative","akudrill"],
    ["🏢","Ordinals","ordinals"],
    ["🔗","Koji/Koja","relpron"],
    ["😀","Emotions","emogender"],
    ["💪","20 Verbs","verbdrill"],
    ["⏳","Tense Flip","tenseflip"],
    ["🧩","Riddles","riddles"],
    ["🧠","Think HR","logicquiz"],
    ["🎯","Pronouns","pronouns"],
    ["♂️♀️","Gender","genderdrill"],
    ["🏗️","Sentences","sentbuild"],
    ["🧲","SE Verbs","reflexive"],
    ["📝","Story Fill","fillstory"],
    ["💬","Conversations","convmatch"],
    ["🖼️","Describe","scenes"],
    ["📖","Stories","storyselect"],
    ["😝","Tongue Twisters","brzalice"],
  ];

  // exercises with custom init (not just setScr)
  const specialInit = {
    znam: () => { sZnMode("menu"); setScr("znam"); sCurEx("znam"); },
    unjumble: () => { const q=sh(UNJUMBLE).slice(0,10); sUjQ(q); sUjI(0); sUjS(0); sUjIn(""); sUjA(false); setScr("unjumble"); sCurEx("unjumble"); },
    prepdrill: () => { const q=sh(PREPDRILL); sPpQ(q); sPpI(0); sPpS(0); sPpA(false); sPpSl(-1); setScr("prepdrill"); sCurEx("prepdrill"); },
    numtime: () => { const q=sh([...NUMTIME.numbers,...NUMTIME.time]).slice(0,10); sNtQ(q); sNtI(0); sNtS(0); sNtA(false); sNtSl(-1); sNtO(sh([q[0].a].concat(q[0].al))); setScr("numtime"); sCurEx("numtime"); },
  };

  return (
    <React.Fragment>
      {H("🎮 Practice", "Games, exercises & review")}
      <h3 className="sh">⚡ Quick Games</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startQuiz}>
          <div style={{fontSize:28}}>🎯</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Quiz</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startFlashcards}>
          <div style={{fontSize:28}}>🃏</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Flashcards</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startMatch}>
          <div style={{fontSize:28}}>🃏</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Match Pairs</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startTyping}>
          <div style={{fontSize:28}}>⌨️</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Typing</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startListening}>
          <div style={{fontSize:28}}>🎧</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Listening</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={startSpeaking}>
          <div style={{fontSize:28}}>🎤</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Pronunciation</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px",gridColumn:"span 3",background:"linear-gradient(135deg,rgba(14,116,144,.06),rgba(14,116,144,.12))",borderLeft:"3px solid #0e7490"}} onClick={() => { setScr("wordsprint"); sCurEx("wordsprint"); }}>
          <div style={{fontSize:28}}>⚡</div>
          <div style={{fontSize:13,fontWeight:800,marginTop:4,color:"#0e7490"}}>Word Sprint</div>
          <div style={{fontSize:10,color:"#78716c",marginTop:2}}>30 sec speed challenge</div>
        </div>
      </div>
      <h3 className="sh">✏️ Exercises</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {exercises.map(([icon, label, screen]) => (
          <div
            key={screen}
            className="tc"
            style={{textAlign:"center",padding:"14px 8px"}}
            onClick={specialInit[screen] || (() => { setScr(screen); sCurEx(screen); })}>
            <div style={{fontSize:28}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:700,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <h3 className="sh">🧠 Review</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={startWeakWords}>
          <div style={{fontSize:28}}>🧠</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Weak Words</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { setScr("proverbs"); sCurEx("proverbs"); }}>
          <div style={{fontSize:28}}>🌟</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>All Proverbs</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { setScr("idioms"); sCurEx("idioms"); }}>
          <div style={{fontSize:28}}>🗣️</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Idioms & Slang</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px"}} onClick={() => { sEvM(new Date().getMonth()+1); setScr("events"); sCurEx("events"); }}>
          <div style={{fontSize:28}}>📅</div>
          <div style={{fontSize:13,fontWeight:700,marginTop:4}}>Croatian Events</div>
        </div>
      </div>
    </React.Fragment>
  );
}
