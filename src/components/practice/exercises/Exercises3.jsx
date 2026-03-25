import React from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { COLORAGREE, POSSESS, QWORDS, NEGATION, SIBIL, RESTCONV, PROFGENDER, COMPARE, COMPQUIZ, FUTURE } from '../../../data.jsx';

export function ColorAgreementScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🎨 Color + Gender Agreement","Colors change endings by noun gender — singular AND plural")}
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>{["Color","M","F","N","M pl","F pl","N pl"].map(function(h,i){return (<th key={i} style={{padding:"6px 4px",background:"#0e7490",color:"white"}}>{h}</th>);})}</tr></thead>
          <tbody>
            {COLORAGREE.colors.map(function(c2,ci){return (
              <tr key={ci} style={{background:ci%2?"#f0fdfa":"white"}}>
                <td style={{padding:"4px",fontWeight:700,color:"#164e63"}}>{c2.en}</td>
                {[c2.m,c2.f,c2.n,c2.mpl,c2.fpl,c2.npl].map(function(v,vi){return (<td key={vi} style={{padding:"4px",cursor:"pointer"}} role="button" tabIndex={0} onClick={function(){speak(v)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <h3 className="sh">🎯 Singular: Pick the right color form</h3>
      {shMemo("cs",COLORAGREE.singQuiz).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}><span style={{fontWeight:700}}>{q.noun}</span>{" ("}{q.en}{") je _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" je "+q.color);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🎯 Plural: Pick the right color form</h3>
      {shMemo("cp",COLORAGREE.plurQuiz).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}><span style={{fontWeight:700}}>{q.noun}</span>{" ("}{q.en}{") su _____"}</div>
          <div style={{display:"flex",gap:4}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" su "+q.color);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function PossessivesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("👤 Possessive Pronouns","moj/moja/moje — changes by noun gender")}
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Person","M","F","N","English"].map(function(h,i){return (<th key={i} style={{padding:"6px",background:"#0e7490",color:"white"}}>{h}</th>);})}</tr></thead>
          <tbody>
            {POSSESS.table.map(function(r,ri){return (
              <tr key={ri} style={{background:ri%2?"#f0fdfa":"white"}}>
                <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>{r.person}</td>
                {[r.m,r.f,r.n,r.en].map(function(v,vi){return (<td key={vi} style={{padding:"6px",cursor:"pointer"}} role="button" tabIndex={0} onClick={function(){speak(v)}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(v)}}>{v}</td>);})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="c" style={{marginBottom:16,padding:"10px",background:"rgba(245,158,11,.06)",fontSize:12}}>💡 Rule: -a noun = -a pronoun (moja kuća), -o/-e noun = -e pronoun (moje selo), consonant noun = no ending (moj stan)</div>
      <h3 className="sh">🎯 Ovo je _____ ...</h3>
      {shMemo("pq",POSSESS.quiz,10).map(function(q,qi){return (
        <div key={qi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1,fontSize:13}}>{"("}{q.person}{") Ovo je _____ "}<span style={{fontWeight:700}}>{q.noun}</span></div>
          <div style={{display:"flex",gap:4}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak("Ovo je "+q.a+" "+q.noun);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function QuestionWordsScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("❓ Question Words","Tko? Što? Gdje? Kad? Koliko? Kako? Zašto?")}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Croatian has specific question words for each type of information. Gender matters for 'what kind of' — Kakav (m), Kakva (f), Kakvo (n).</div>
      {shMemo("qw",QWORDS).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{q.q}{" — "}<span style={{color:"#78716c",fontStyle:"italic"}}>{q.en}</span></div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a));}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function NegationScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("❌ Positive ↔ Negative","Radim → Ne radim • Imam → Nemam")}
      <div className="c" style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Most verbs: add NE before the verb. Exception: imam → nemam, znam → ne znam.</div>
      {shMemo("ng",NEGATION).map(function(n,ni){return (
        <div key={ni} className="c" style={{marginBottom:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1}}>
            <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,color:"#16a34a",marginBottom:2,display:"block"}} onClick={function(){speak(n.pos)}}>{"✅ "}{n.pos}</button>
            <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,color:"#dc2626",display:"block"}} onClick={function(){speak(n.neg)}}>{"❌ "}{n.neg}</button>
          </div>
          <div style={{fontSize:11,color:"#78716c",maxWidth:140,textAlign:"right"}}>{n.en}</div>
        </div>
      );})}
    </div>
  );
}

export function SibilarizationScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🔄 Sibilarizacija","k→c, g→z, h→s before -i")}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(245,158,11,.06)",fontSize:13}}>{SIBIL.intro}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {SIBIL.examples.map(function(ex,i){return (
          <button key={i} className="c" style={{padding:"8px 12px",textAlign:"center"}} onClick={function(){speak(ex.lok)}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--heading)"}}>{ex.nom}{" → "}{ex.lok}</div>
            <div style={{fontSize:11,color:"#b45309"}}>{ex.rule}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("sq",SIBIL.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function RestaurantScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🍽️ At the Restaurant","Practice ordering food in Croatian")}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Tap any line to hear it spoken. Practice the waiter-customer dialogue until it feels natural.</div>
      {RESTCONV.map(function(r,ri){return (
        <div key={ri} style={{marginBottom:12}}>
          <div style={{display:"flex",gap:8,marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:800,color:"white",background:"#0e7490",padding:"2px 8px",borderRadius:10}}>K</div>
            <button style={{flex:1,padding:"8px 12px",background:"#f0fdfa",borderRadius:"4px 12px 12px 12px",fontSize:13,border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(r.waiter)}}>{r.waiter}</button>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={{flex:1,padding:"8px 12px",background:"#eff6ff",borderRadius:"12px 4px 12px 12px",fontSize:13,textAlign:"right",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(r.you)}}>{r.you}</button>
            <div style={{fontSize:11,fontWeight:800,color:"white",background:"#1e40af",padding:"2px 8px",borderRadius:10}}>Ti</div>
          </div>
        </div>
      );})}
    </div>
  );
}

export function ProfessionGenderScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("👨‍⚖️👩‍⚖️ Profession Pairs","Every job has a masculine AND feminine form")}
      {shMemo("pg",PROFGENDER).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button style={{flex:1,textAlign:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.m)}}><div style={{fontSize:14,fontWeight:700,color:"#1e40af"}}>{"👨 "}{p.m}</div></button>
          <div style={{fontSize:11,color:"var(--subtext)",padding:"0 8px"}}>{p.en}</div>
          <button style={{flex:1,textAlign:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.f)}}><div style={{fontSize:14,fontWeight:700,color:"#db2777"}}>{"👩 "}{p.f}</div></button>
        </div>
      );})}
    </div>
  );
}

export function ComparativesScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("📈 Lijep, Ljepši, Najljepši","Adjective → Comparative → Superlative")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:20}}>
        <div style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Base</div>
        <div style={{padding:"6px",background:"#b45309",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Comparative</div>
        <div style={{padding:"6px",background:"#7c3aed",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>Superlative</div>
        {COMPARE.map(function(cm){return [
          <button key={cm.base+"b"} style={{padding:"6px",fontSize:12,background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.base)}}>{cm.base}{" ("}{cm.en})</button>,
          <button key={cm.base+"c"} style={{padding:"6px",fontSize:12,fontWeight:700,color:"#b45309",background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.comp)}}>{cm.comp}</button>,
          <button key={cm.base+"s"} style={{padding:"6px",fontSize:12,fontWeight:700,color:"#7c3aed",background:"none",border:"none",borderBottom:"1px solid #e7e5e4",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(cm.super)}}>{cm.super}</button>
        ];}).flat()}
      </div>
      <h3 className="sh">🎯 Pick the right form</h3>
      {shMemo("cq",COMPQUIZ).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function FutureTenseScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🚀 Future Tense","ću, ćeš, će, ćemo, ćete, će + infinitive")}
      <div className="c" style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:13}}>{FUTURE.intro}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {["ja ću","ti ćeš","on/ona će","mi ćemo","vi ćete","oni/one će"].map(function(f,i){return (
          <button key={i} className="c" style={{textAlign:"center",padding:"8px"}} onClick={function(){speak(f)}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0e7490"}}>{f}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🎯 Fill the Blank</h3>
      {shMemo("fq",FUTURE.quiz).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(/** @type {any} */ e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}
