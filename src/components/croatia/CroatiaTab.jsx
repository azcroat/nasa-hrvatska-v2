import React from 'react';
import { H, MEDIA } from '../../data.jsx';

export default function CroatiaTab({
  setScr, sHIdx, sKgTab, sCurEx,
  setRcIdx, setRcServ, setRpIdx, setRpLine, setRpShow,
  setMapCat, setMapSel,
}) {
  const cats = ["tv", "music", "sport", "film", "culture"];
  const labels = { tv: "📺 TV & News", music: "🎵 Music & Radio", sport: "⚽ Sports", film: "🎬 Film & Culture", culture: "⭐ Pop Culture" };

  return (
    <React.Fragment>
      {H("🇭🇷 Life in Croatia", "Culture, history, daily life")}
      <h3 className="sh">🇭🇷 History & Regions</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => { sHIdx(0); setScr("history"); }}>
          <div style={{fontSize:28}}>🇭🇷</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Domovinski Rat</div>
            <div style={{fontSize:11,color:"#78716c"}}>Homeland War</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => { sKgTab("timeline"); setScr("kings"); sCurEx("kings"); }}>
          <div style={{fontSize:28}}>👑</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Croatian Kings</div>
            <div style={{fontSize:11,color:"#78716c"}}>Medieval kingdom</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setScr("region_labin")}>
          <div style={{fontSize:28}}>⛵</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Labin & Rabac</div>
            <div style={{fontSize:11,color:"#78716c"}}>Our new home!</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setScr("region_bibinje")}>
          <div style={{fontSize:28}}>🏖️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Bibinje & Zadar</div>
            <div style={{fontSize:11,color:"#78716c"}}>Dalmatian gateway</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setScr("region_hercegovina")}>
          <div style={{fontSize:28}}>⚔️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Hrvati Hercegovine</div>
            <div style={{fontSize:11,color:"#78716c"}}>Our heritage</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setScr("region_vukovar")}>
          <div style={{fontSize:28}}>🕯️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Vukovar</div>
            <div style={{fontSize:11,color:"#78716c"}}>Hero city — deep dive</div>
          </div>
        </div>
        <div className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}} onClick={() => setScr("region_vinkovci")}>
          <div style={{fontSize:28}}>🏛️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Vinkovci</div>
            <div style={{fontSize:11,color:"#78716c"}}>8,300 years of history</div>
          </div>
        </div>
      </div>
      <h3 className="sh">🛒 Shopping & Food</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => setScr("grocery")}>
          <div style={{fontSize:28}}>🛒</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Grocery</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => { setRcIdx(0); setRcServ(4); setScr("recipes"); }}>
          <div style={{fontSize:28}}>🍳</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Recipes</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => { setRpIdx(0); setRpLine(0); setRpShow(false); setScr("roleplay"); }}>
          <div style={{fontSize:28}}>🎭</div>
          <div style={{fontSize:12,fontWeight:700,marginTop:4}}>Role-Play</div>
        </div>
      </div>
      <h3 className="sh">🏫 Daily Life</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[
          ["🏫", "School Kit", "school"],
          ["📱", "Texting", "texting"],
          ["🤝", "Make Friends", "friends"],
          ["🍕", "Order Food", "foodorder"],
          ["🚌", "Transport", "transport"],
          ["🚨", "Emergency", "emergency"],
          ["💼", "Practical Life", "practical"],
        ].map(([icon, label, screen]) => (
          <div key={screen} className="tc" style={{textAlign:"center",padding:"14px 8px"}} onClick={() => setScr(screen)}>
            <div style={{fontSize:28}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:700,marginTop:4}}>{label}</div>
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
      <h3 className="sh">📺 Media & TV</h3>
      <div style={{padding:"10px 14px",background:"rgba(14,116,144,.06)",borderRadius:12,marginBottom:12,fontSize:12,color:"#164e63"}}>
        💡 Tip: HRT streams play free in your browser. On mobile, if you see an app download banner, just tap X or Skip to watch directly.
      </div>
      <div>
        {cats.map(cat => {
          const items = MEDIA.filter(m => m.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat} style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:800,color:"#164e63",marginBottom:10,paddingBottom:6,borderBottom:"2px solid rgba(14,116,144,.1)"}}>
                {labels[cat]}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {items.map((m, i) => (
                  <div
                    key={i}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"12px",background:"white",borderRadius:12,border:"1px solid rgba(0,0,0,.06)",boxShadow:"0 1px 3px rgba(0,0,0,.04)",cursor:"pointer"}}
                    onClick={() => { if (m.scr) { setScr(m.scr); } else { window.open(m.web, "_blank", "noopener,noreferrer"); } }}>
                    <div style={{width:36,height:36,borderRadius:10,background:m.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {m.icon}
                    </div>
                    <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:12,fontWeight:700,color:m.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {m.name}
                      </div>
                      <div style={{fontSize:10,color:"#78716c",lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {m.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}
