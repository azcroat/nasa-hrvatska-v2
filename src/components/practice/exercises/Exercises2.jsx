import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES } from '../../../data.jsx';

export function TenseFlipScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("⏳ Present → Past","Convert prezent to perfekt and negative")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 See the present tense, then tap to reveal the past (perfekt) and negative past forms.</div>
      {shMemo("tf",TENSEFLIP,10).map(function(t,ti){return (
        <div key={ti} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <button style={{fontSize:14,fontWeight:700,color:"var(--heading)",marginBottom:8,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(t.prez)}}>{"🔵 "}{t.prez}</button>
          <div style={{display:"flex",gap:8}}>
            <button style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
              onClick={function(e){e.target.textContent="✅ "+t.perf;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(t.perf);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>🔵 Perfekt?</button>
            <button style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
              onClick={function(e){e.target.textContent="❌ "+t.neg;e.target.style.background="#fee2e2";e.target.style.borderColor="#dc2626";speak(t.neg);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>🔴 Negative?</button>
          </div>
        </div>
      );})}
    </div>
  );
}

export function RiddlesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🧩 Što je to?","Read the clues in Croatian, guess the answer!")}
      {shMemo("rid",RIDDLES,8).map(function(r,ri){return (
        <div key={ri} className="c" style={{marginBottom:14,padding:"14px 16px"}}>
          <button style={{fontSize:14,fontStyle:"italic",color:"#44403c",marginBottom:10,lineHeight:1.5,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(r.clue)}}>🔊 "{r.clue}"</button>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {r.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 16px",border:"2px solid #d6d3d1",borderRadius:12,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===r.answer?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===r.answer?"#16a34a":"#dc2626";if(o===r.answer){award(5);speak(r.answer);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
          <div style={{fontSize:11,color:"#a8a29e",marginTop:6}}>{"🇬🇧 "}{r.en}</div>
        </div>
      );})}
    </div>
  );
}

export function LogicQuizScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🧠 Think in Croatian","Pick the answers that make sense")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Read the Croatian situation and pick ALL correct answers. Some questions have 2 right answers!</div>
      {shMemo("lq",LOGICQUIZ).map(function(lq,li){const allOpts=lq.right.concat(lq.wrong).sort(function(){return Math.random()-0.5});return ( // NOSONAR - Math.random() is acceptable for quiz/game shuffling
        <div key={li} className="c" style={{marginBottom:12,padding:"12px 14px"}}>
          <button style={{fontSize:14,fontWeight:700,color:"var(--heading)",marginBottom:8,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(lq.q)}}>{"🔊 "}{lq.q}</button>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {allOpts.map(function(o,oi){const isRight=lq.right.indexOf(o)>=0;return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=isRight?"#dcfce7":"#fee2e2";e.target.style.borderColor=isRight?"#16a34a":"#dc2626";if(isRight){award(3);speak(o);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function OrdinalsScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🏢 Ordinal Numbers","prvi, drugi, treći... + locative (na ___om katu)")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:20}}>
        {ORDINALS.map(function(o,i){return (
          <div key={i} className="c" style={{textAlign:"center",padding:"8px 4px",cursor:"pointer"}} onClick={function(){speak(o.hr)}}>
            <div style={{fontSize:18,fontWeight:800,color:"#0e7490"}}>{o.num}.</div>
            <div style={{fontSize:13,fontWeight:700}}>{o.hr}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{o.en}</div>
            <div style={{fontSize:10,color:"#b45309",marginTop:2}}>{"na "}{o.loc}om</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🏢 Na kojem katu?</h3>
      {shMemo("oq",ORDQUIZ).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak("na "+q.a+" katu");}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function RelativePronounsScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🔗 Koji, Koja, Koje","Relative pronouns — which/that/who")}
      <div className="c" style={{marginBottom:16,padding:"12px",fontSize:12,background:"rgba(14,116,144,.06)"}}>{RELPRON.intro}</div>
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["","NOM","GEN","DAT","AKU","LOK"].map(function(h,i){return (<th key={i} style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700}}>{h}</th>);})}</tr></thead>
          <tbody>
            {["m","f","n"].map(function(g,gi){const r=RELPRON.table[g];return (
              <tr key={gi} style={{background:gi%2?"#f0fdfa":"white"}}>
                <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>{g==="m"?"♂ M":g==="f"?"♀ F":"⚧ N"}</td>
                {[r.nom,r.gen,r.dat,r.aku,r.lok].map(function(v,vi){return (<td key={vi} style={{padding:"6px",cursor:"pointer"}} onClick={function(){speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("rp",RELPRON.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function EmotionGenderScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("😀 How Are You Feeling?","Pick the right gender form for emotions")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Croatian adjectives change based on gender. 👨 = masculine ending, 👩 = feminine ending. Tap the correct form!</div>
      {EMOGENDER.map(function(eg,ei){return (
        <div key={ei} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{eg.subj}{" ("}{eg.gender==="m"?"👨":"👩"})</div>
          {eg.pairs.map(function(p,pi){const correct=eg.gender==="m"?p.m:p.f;const wrong=eg.gender==="m"?p.f:p.m;return (
            <div key={pi} style={{display:"flex",gap:8,marginBottom:6}}>
              {[correct,wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return ( // NOSONAR - Math.random() is acceptable for quiz/game shuffling
                <button key={oi} style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===correct?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===correct?"#16a34a":"#dc2626";if(o===correct){award(2);speak(eg.subj.split("...")[0]+" "+correct);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                  {o}
                </button>
              );})}
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export function OppositesScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("↔️ Opposites","Learn adjective pairs with animals")}
      {shMemo("ao",ADJOPPOSITES).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,textAlign:"center",cursor:"pointer"}} onClick={function(){speak(p.ex.a)}}>
            <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>{p.a}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{p.ex.a}</div>
          </div>
          <div style={{fontSize:18,color:"#d6d3d1"}}>↔</div>
          <div style={{flex:1,textAlign:"center",cursor:"pointer"}} onClick={function(){speak(p.ex.b)}}>
            <div style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{p.b}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{p.ex.b}</div>
          </div>
        </div>
      );})}
    </div>
  );
}

export function CityLocativeScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🏙️ Where Do You Live?","City & country names in locative case")}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 "Gdje živiš?" uses the locative case. Zagreb → u Zagrebu, Hrvatska → u Hrvatskoj.</div>
      <h3 className="sh">🏙️ Gradovi (Cities)</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {CITYLOC.cities.map(function(c2,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}} onClick={function(){speak("Živim u "+c2.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>{c2.nom}</div>
            <div style={{fontSize:12,color:"#0e7490"}}>{"→ u "}{c2.lok}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🌍 Države (Countries)</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {CITYLOC.countries.map(function(c2,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}} onClick={function(){speak(c2.nom+" - u "+c2.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>{c2.nom}</div>
            <div style={{fontSize:12,color:"#b45309"}}>{"→ u "}{c2.lok}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🎯 Quick Quiz</h3>
      {shMemo("cl",CITYLOC.cities,8).map(function(c2,i){const wrong=CITYLOC.cities[(i+3)%CITYLOC.cities.length].lok;return (
        <div key={i} className="c" style={{marginBottom:6,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13}}>{c2.nom}{" → u _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {[c2.lok,wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return ( // NOSONAR - Math.random() is acceptable for quiz/game shuffling
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===c2.lok?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===c2.lok?"#16a34a":"#dc2626";if(o===c2.lok)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function AccusativeDrillScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🍽️ Accusative Case","How nouns change after Voliš li / Nosiš li / Jedeš li")}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Feminine nouns ending in -a change to -u in accusative. Masculine/neuter nouns usually stay the same.</div>
      <h3 className="sh">🍔 Hrana (Food)</h3>
      {shMemo("af",AKUFOOD).map(function(f,i){return (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:12}}><span style={{color:"#78716c"}}>{f.q.replace("_____","")}</span>{" "}<span style={{fontWeight:700,color:"#164e63"}}>{f.nom}</span>{" → ?"}</div>
          <button style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
            onClick={function(e){e.target.textContent=f.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(f.q.replace("_____",f.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>Show</button>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>👚 Odjeća (Clothes)</h3>
      {shMemo("ac",AKUCLOTHES).map(function(cl,i){return (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:12}}><span style={{color:"#78716c"}}>{cl.q.replace("_____","")}</span>{" "}<span style={{fontWeight:700,color:"#164e63"}}>{cl.nom}</span>{" → ?"}</div>
          <button style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
            onClick={function(e){e.target.textContent=cl.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(cl.q.replace("_____",cl.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>Show</button>
        </div>
      );})}
    </div>
  );
}
