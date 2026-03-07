import React from 'react';
import { H, speak } from '../../data.jsx';
import { TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, SCHOOL, GROCERY } from '../../data.jsx';

export function TextingScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("📱 Texting & Slang","How Croatian kids actually text")}
      {TEXTING.map(function(t,i){return (
        <div key={i} className="c" style={{marginBottom:8,cursor:"pointer"}} onClick={function(){speak(t.slang)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>{t.slang}{" 🔊"}</div>
            <div style={{fontSize:14,fontWeight:600,color:"#0e7490"}}>{t.means}</div>
          </div>
          <div style={{fontSize:12,color:"#78716c",marginTop:2}}>{t.ctx}</div>
        </div>
      );})}
    </div>
  );
}

export function FriendsScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🤝 Making Friends","Real phrases kids use")}
      {FRIENDS.map(function(f,i){return (
        <div key={i} className="c" style={{marginBottom:8,cursor:"pointer"}} onClick={function(){speak(f.hr)}}>
          <div style={{fontSize:15,fontWeight:700,color:"#164e63"}}>{f.hr}{" 🔊"}</div>
          <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>{f.en}</div>
        </div>
      );})}
    </div>
  );
}

export function FoodOrderScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🍕 Ordering Food","Bakery, fast food, ice cream, restaurants")}
      {[FOODORDER.bakery,FOODORDER.fastfood,FOODORDER.icecream].map(function(sec,si){return (
        <div key={si} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:"#b45309",marginBottom:10}}>{sec.title}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
            {sec.items.map(function(w,i){return (
              <div key={i} style={{padding:"4px 0",cursor:"pointer",fontSize:13}} onClick={function(){speak(w[0])}}>
                <span style={{fontWeight:600}}>{w[0]}</span>{" — "}{w[1]}
              </div>
            );})}
          </div>
          <div style={{borderTop:"1px solid #f3f4f6",paddingTop:8}}>
            {sec.phrases.map(function(p,i){return (
              <div key={i} style={{fontSize:13,padding:"3px 0",cursor:"pointer",fontWeight:600,color:"#164e63"}} onClick={function(){speak(p)}}>{p}{" 🔊"}</div>
            );})}
          </div>
        </div>
      );})}
      <div className="c" style={{borderLeft:"4px solid #f59e0b"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>💡 Tipping</div>
        <div style={{fontSize:13}}>{FOODORDER.restaurant.tip}</div>
      </div>
      <h3 className="sh" style={{marginTop:16}}>🍽️ Restaurant Phrases</h3>
      {FOODORDER.restaurant.phrases.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"#78716c",fontSize:13}}>{p[1]}</span>
        </div>
      );})}
    </div>
  );
}

export function TransportScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🚌 Getting Around","Bus, tram, taxi phrases")}
      {TRANSPORT.map(function(t,i){return (
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(t.hr)}}>
          <span style={{fontWeight:700,fontSize:14}}>{t.hr}{" 🔊"}</span>
          <span style={{color:"#78716c",fontSize:13}}>{t.en}</span>
        </div>
      );})}
    </div>
  );
}

export function EmergencyScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🚨 Emergency Phrases","Medical, police, urgent")}
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2",textAlign:"center"}}>
        <div style={{fontSize:48,fontWeight:800,color:"#dc2626"}}>112</div>
        <div style={{fontSize:14,fontWeight:700}}>{EMERGENCY.number}</div>
      </div>
      {EMERGENCY.phrases.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14,color:"#dc2626"}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"#78716c",fontSize:13}}>{p[1]}</span>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🦴 Body Parts</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {EMERGENCY.bodyParts.map(function(b,i){return (
          <div key={i} className="c" style={{padding:"8px",cursor:"pointer",textAlign:"center"}} onClick={function(){speak("Boli me "+b[0])}}>
            <div style={{fontSize:13,fontWeight:700}}>{b[0]}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{b[1]}</div>
          </div>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>📞 Numbers</h3>
      {EMERGENCY.phoneNumbers.map(function(p,i){return (
        <div key={i} style={{display:"flex",gap:12,padding:"6px 0",fontSize:14}}>
          <span style={{fontWeight:800,color:"#dc2626",minWidth:60}}>{p[0]}</span>
          <span>{p[1]}</span>
        </div>
      );})}
    </div>
  );
}

export function FootballScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("⚽ Football & Water Polo","Croatia's biggest sports")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {FOOTBALL.vocab.map(function(w,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(w[0])}}>
            <span style={{fontWeight:700,fontSize:13}}>{w[0]}</span>{" — "}<span style={{color:"#78716c",fontSize:12}}>{w[1]}</span>
          </div>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>🏆 Major Teams</h3>
      {FOOTBALL.teams.map(function(t,i){return (
        <div key={i} className="c" style={{marginBottom:8,borderLeft:"4px solid "+t.color}}>
          <div style={{fontSize:16,fontWeight:800}}>{t.name}</div>
          <div style={{fontSize:13,color:"#78716c"}}>{t.desc}</div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🤽 Water Polo</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {FOOTBALL.waterPolo.map(function(w,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(w[0])}}>
            <span style={{fontWeight:700}}>{w[0]}</span>{" — "}<span style={{color:"#78716c"}}>{w[1]}</span>
          </div>
        );})}
      </div>
    </div>
  );
}

export function PopCultureScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🎵 Croatian Pop Culture","Music, TV & artists your friends know")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {POPCULTURE.map(function(p,i){return (
          <div key={i} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}
            onClick={function(e){e.preventDefault();window.open(p.web,"_blank","noopener,noreferrer")}}>
            <div style={{fontSize:24}}>{p.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#164e63"}}>{p.name}</div>
              <div style={{fontSize:11,color:"#78716c"}}>{p.desc}</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

export function PracticalScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("💼 Practical Life in Croatia","Documents, customs, culture")}
      <div className="c" style={{marginBottom:12,borderLeft:"4px solid #dc2626"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>{PRACTICAL.oib.title}</div>
        <div style={{fontSize:13,marginTop:4}}>{PRACTICAL.oib.desc}</div>
      </div>
      <div className="c" style={{marginBottom:12,borderLeft:"4px solid #0e7490"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0e7490"}}>{PRACTICAL.mbo.title}</div>
        <div style={{fontSize:13,marginTop:4}}>{PRACTICAL.mbo.desc}</div>
      </div>
      <h3 className="sh">📄 Documents</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {PRACTICAL.documents.map(function(d,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(d[0])}}>
            <div style={{fontSize:13,fontWeight:700}}>{d[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{d[1]}</div>
          </div>
        );})}
      </div>
      <div className="c" style={{marginTop:16,borderLeft:"4px solid #f59e0b"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>📅 School Calendar</div>
        <div style={{fontSize:13,marginTop:4}}>{PRACTICAL.schoolCalendar}</div>
      </div>
      <h3 className="sh" style={{marginTop:16}}>🇭🇷 Croatian Customs</h3>
      {PRACTICAL.customs.map(function(c,i){return (
        <div key={i} className="c" style={{marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>{c.rule}</div>
          <div style={{fontSize:13,color:"#44403c",marginTop:4}}>{c.desc}</div>
        </div>
      );})}
    </div>
  );
}

export function SchoolScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🏫 School Survival Kit","Everything for Croatian school")}
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>{SCHOOL.grading.title}</div>
        <div style={{fontSize:14,marginTop:4}}>{SCHOOL.grading.desc}</div>
      </div>
      <div className="c" style={{marginBottom:12,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#b45309"}}>⚠️ Formal Rules</div>
        <div style={{fontSize:13,marginTop:4}}>{SCHOOL.formal}</div>
      </div>
      <h3 className="sh">📚 Classroom Vocabulary</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {SCHOOL.classroom.map(function(w,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{w[1]}</div>
          </div>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>📝 Subjects</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {SCHOOL.subjects.map(function(w,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#7c3aed"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{w[1]}</div>
          </div>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>🗣️ Essential Phrases</h3>
      {SCHOOL.phrases.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"#78716c",fontSize:13}}>{p[1]}</span>
        </div>
      );})}
    </div>
  );
}

export function GroceryScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🛒 Grocery Shopping","Stores, brands & essential vocab")}
      <h3 className="sh">🏪 Supermarket Chains</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
        {GROCERY.stores.map(function(s,i){return (
          <div key={i} className="c" style={{textAlign:"center",padding:"10px",borderTop:"3px solid "+s.color}}>
            <div style={{fontSize:14,fontWeight:800}}>{s.name}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{s.desc}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">⭐ Croatian Brands to Know</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {GROCERY.brands.map(function(b,i){return (
          <div key={i} className="c" style={{padding:"8px 12px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#164e63"}}>{b[0]}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{b[1]}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">📚 Shopping Vocabulary</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {GROCERY.vocab.map(function(w,i){return (
          <div key={i} className="c" style={{padding:"8px 12px",cursor:"pointer"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#0e7490"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{w[1]}</div>
          </div>
        );})}
      </div>
      <h3 className="sh">🗣️ At the Store</h3>
      {GROCERY.phrases.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"#78716c",fontSize:13}}>{p[1]}</span>
        </div>
      );})}
    </div>
  );
}

export function HistoryScreen({ goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      {H("🇭🇷 "+HISTORY.title,HISTORY.subtitle)}
      <div className="c" style={{marginBottom:20,borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)"}}>
        <div style={{fontSize:14,lineHeight:1.8,color:"#1c1917"}}>{HISTORY.intro}</div>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Timeline</div>
      {HISTORY.timeline.map(function(e,i){return (
        <div key={i} className="c" style={{marginBottom:12,borderLeft:"4px solid "+(i<3?"#f59e0b":i<5?"#dc2626":"#16a34a")}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:24}}>{e.emoji}</span>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:"#b45309"}}>{e.year}</div>
              <div style={{fontSize:16,fontWeight:800,color:"#164e63",fontFamily:"'Playfair Display',serif"}}>{e.title}</div>
            </div>
          </div>
          <p style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>{e.text}</p>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:24}}>🏅 Key Figures</h3>
      {HISTORY.heroes.map(function(h,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"14px 20px"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#164e63"}}>{h.name}</div>
          <div style={{fontSize:12,color:"#b45309",fontWeight:600,marginBottom:4}}>{h.role}</div>
          <div style={{fontSize:13,color:"#44403c"}}>{h.desc}</div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:24}}>📅 Key Dates to Remember</h3>
      {HISTORY.keyDates.map(function(d,i){return (
        <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,.05)"}}>
          <div style={{minWidth:140,fontSize:13,fontWeight:700,color:"#dc2626"}}>{d[0]}</div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>{d[1]}</div>
            <div style={{fontSize:12,color:"#78716c"}}>{d[2]}</div>
          </div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:24}}>📝 Homeland War Vocabulary</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {HISTORY.vocabulary.map(function(v,i){return (
          <div key={i} className="c" style={{padding:"10px 14px",cursor:"pointer"}} onClick={function(){speak(v[0])}}>
            <div style={{fontSize:14,fontWeight:700,color:"#991b1b"}}>{v[0]}{" 🔊"}</div>
            <div style={{fontSize:12,color:"#78716c"}}>{v[1]}</div>
          </div>
        );})}
      </div>
      <div className="c" style={{marginTop:24,textAlign:"center",borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#991b1b",fontFamily:"'Playfair Display',serif",fontStyle:"italic",marginBottom:8}}>{HISTORY.quote}</div>
        <div style={{fontSize:20,fontWeight:700,color:"#b91c1c",fontFamily:"'Playfair Display',serif",fontStyle:"italic"}}>{HISTORY.quote2}</div>
      </div>
    </div>
  );
}
