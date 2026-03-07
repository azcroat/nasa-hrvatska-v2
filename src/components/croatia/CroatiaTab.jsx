import React from 'react';
import { H, MEDIA } from '../../data.jsx';

const LEVEL_COLORS = {A1:'#16a34a',A2:'#65a30d',B1:'#ca8a04',B2:'#b45309',C1:'#0e7490',C2:'#7c3aed'};
const CAT_LABELS = {tv:"📺 TV & News",music:"🎵 Music & Radio",sport:"⚽ Sports",film:"🎬 Film & Series",podcast:"🎙️ Podcasts",culture:"🌍 Culture & Press"};

export default function CroatiaTab({
  setScr, sHIdx, sKgTab, sCurEx,
  setRcIdx, setRcServ, setRpIdx, setRpLine, setRpShow,
  setMapCat, setMapSel,
}) {
  const cats = ["tv","music","film","sport","podcast","culture"];

  return (
    <React.Fragment>
      {H("🇭🇷 Life in Croatia", "Culture, history, daily life")}

      {/* AI Conversation Partner */}
      <div
        style={{marginBottom:12,padding:"16px 20px",background:"linear-gradient(135deg,#1e1b4b,#3730a3)",borderRadius:18,cursor:"pointer",color:"white",boxShadow:"0 6px 24px rgba(55,48,163,.25)"}}
        onClick={() => setScr("aiconvo")}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:38,flexShrink:0}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:900,marginBottom:3}}>AI Conversation Partner</div>
            <div style={{fontSize:12,opacity:.85,lineHeight:1.5}}>Practice real Croatian conversations · Get personalised grammar feedback</div>
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              {["8 scenarios","All levels","Free"].map(t=>(
                <span key={t} style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{fontSize:20,opacity:.7}}>→</div>
        </div>
      </div>

      {/* Immersion Hub Hero Banner */}
      <div
        style={{marginBottom:20,padding:"18px 20px",background:"linear-gradient(135deg,#164e63,#0e7490)",borderRadius:18,cursor:"pointer",color:"white",boxShadow:"0 6px 24px rgba(14,116,144,.3)"}}
        onClick={() => setScr("immersion")}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:40,flexShrink:0}}>🌊</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:900,marginBottom:4}}>Immersion Hub</div>
            <div style={{fontSize:12,opacity:.85,lineHeight:1.5}}>Your curated path from first words to native fluency — media, schedules, tips & resources organized by level</div>
            <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
              {["A1","A2","B1","B2","C1","C2"].map(l=>(
                <span key={l} style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:800}}>{l}</span>
              ))}
            </div>
          </div>
          <div style={{fontSize:20,opacity:.7}}>→</div>
        </div>
      </div>

      <h3 className="sh">🇭🇷 History & Regions</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          [()=>{sHIdx(0);setScr("history");},"🇭🇷","Domovinski Rat","Homeland War"],
          [()=>{sKgTab("timeline");setScr("kings");sCurEx("kings");},"👑","Croatian Kings","Medieval kingdom"],
          [()=>setScr("region_labin"),"⛵","Labin & Rabac","Our new home!"],
          [()=>setScr("region_bibinje"),"🏖️","Bibinje & Zadar","Dalmatian gateway"],
          [()=>setScr("region_hercegovina"),"⚔️","Hrvati Hercegovine","Our heritage"],
          [()=>setScr("region_vukovar"),"🕯️","Vukovar","Hero city — deep dive"],
          [()=>setScr("region_vinkovci"),"🏛️","Vinkovci","8,300 years of history"],
        ].map(([fn,icon,title,sub],i)=>(
          <div key={i} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={fn}>
            <div style={{fontSize:28}}>{icon}</div>
            <div><div style={{fontSize:13,fontWeight:700}}>{title}</div><div style={{fontSize:11,color:"#78716c"}}>{sub}</div></div>
          </div>
        ))}
      </div>

      <h3 className="sh">🛒 Shopping & Food</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => setScr("grocery")}>
          <div style={{fontSize:28}}>🛒</div><div style={{fontSize:12,fontWeight:700,marginTop:4}}>Grocery</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => { setRcIdx(0); setRcServ(4); setScr("recipes"); }}>
          <div style={{fontSize:28}}>🍳</div><div style={{fontSize:12,fontWeight:700,marginTop:4}}>Recipes</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => { setRpIdx(0); setRpLine(0); setRpShow(false); setScr("roleplay"); }}>
          <div style={{fontSize:28}}>🎭</div><div style={{fontSize:12,fontWeight:700,marginTop:4}}>Role-Play</div>
        </div>
      </div>

      <h3 className="sh">🏫 Daily Life</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[["🏫","School Kit","school"],["📱","Texting","texting"],["🤝","Make Friends","friends"],["🍕","Order Food","foodorder"],["🚌","Transport","transport"],["🚨","Emergency","emergency"],["💼","Practical Life","practical"]].map(([icon,label,screen])=>(
          <div key={screen} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => setScr(screen)}>
            <div style={{fontSize:28}}>{icon}</div><div style={{fontSize:12,fontWeight:700,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px",marginBottom:20}} onClick={() => { setMapCat("all"); setMapSel(null); setScr("crmap"); }}>
        <div style={{fontSize:36}}>🗺️</div>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63"}}>Interactive Map & Directions</div>
          <div style={{fontSize:12,color:"#78716c"}}>Explore Croatia — cities, parks, beaches, islands</div>
        </div>
      </div>

      <h3 className="sh">📺 Media & Immersion</h3>
      <div style={{padding:"12px 14px",background:"linear-gradient(135deg,rgba(14,116,144,.06),rgba(14,116,144,.1))",borderRadius:12,marginBottom:16,borderLeft:"3px solid #0e7490"}}>
        <div style={{fontSize:12,fontWeight:800,color:"#164e63",marginBottom:4}}>💡 How to Use Media for Language Acquisition</div>
        <div style={{fontSize:12,color:"#44403c",lineHeight:1.6}}>
          Each resource below shows a <strong>level badge</strong> (A1–C2) and a tip explaining exactly why it helps.
          Tap <strong>Immersion Hub ↑</strong> above for a full structured path, daily schedule, and advanced tips.
        </div>
      </div>

      {cats.map(cat => {
        const items = MEDIA.filter(m => m.cat === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{marginBottom:24}}>
            <div style={{fontSize:14,fontWeight:800,color:"#164e63",marginBottom:10,paddingBottom:6,borderBottom:"2px solid rgba(14,116,144,.1)"}}>
              {CAT_LABELS[cat]}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.map((m, i) => {
                const lc = LEVEL_COLORS[m.level] || '#78716c';
                return (
                  <div key={i} style={{display:"flex",gap:12,padding:"14px",background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.06)",boxShadow:"0 1px 3px rgba(0,0,0,.04)",cursor:"pointer",alignItems:"flex-start"}}
                    onClick={() => { if (m.scr) { setScr(m.scr); } else if (m.web) { window.open(m.web, "_blank", "noopener,noreferrer"); } }}>
                    <div style={{width:44,height:44,borderRadius:12,background:m.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                      {m.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:800,color:m.color}}>{m.name}</span>
                        {m.level && <span style={{background:`${lc}20`,color:lc,fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:20,border:`1px solid ${lc}40`}}>{m.level}</span>}
                      </div>
                      <div style={{fontSize:11,color:"#78716c",marginBottom:6}}>{m.desc}</div>
                      {m.tip && <div style={{fontSize:11,color:"#44403c",background:"rgba(14,116,144,.04)",borderRadius:8,padding:"6px 10px",lineHeight:1.5,borderLeft:"2px solid rgba(14,116,144,.2)"}}>
                        {m.tip}
                      </div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}
