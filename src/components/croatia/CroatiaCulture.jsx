import React, { useState, useRef } from 'react';
import { H, speak } from '../../data.jsx';
import { TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, SCHOOL, GROCERY, HISTORY, BASKETBALL, GYM } from '../../data.jsx';

export function TextingScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("📱 Texting & Slang","How Croatian kids actually text",goBack)}
      {TEXTING.map(function(t,i){return (
        <button key={i} className="c" style={{marginBottom:8}} onClick={function(){speak(t.slang)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>{t.slang}{" 🔊"}</div>
            <div style={{fontSize:14,fontWeight:600,color:"#0e7490"}}>{t.means}</div>
          </div>
          <div style={{fontSize:12,color:"var(--subtext)",marginTop:2}}>{t.ctx}</div>
        </button>
      );})}
    </div>
  );
}

export function FriendsScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🤝 Making Friends","Real phrases kids use",goBack)}
      {FRIENDS.map(function(f,i){return (
        <button key={i} className="c" style={{marginBottom:8}} onClick={function(){speak(f.hr)}}>
          <div style={{fontSize:15,fontWeight:700,color:"var(--heading)"}}>{f.hr}{" 🔊"}</div>
          <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>{f.en}</div>
        </button>
      );})}
    </div>
  );
}

export function FoodOrderScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🍕 Ordering Food","Bakery, fast food, ice cream, restaurants",goBack)}
      {[FOODORDER.bakery,FOODORDER.fastfood,FOODORDER.icecream].map(function(sec,si){return (
        <div key={si} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:"#b45309",marginBottom:10}}>{sec.title}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
            {sec.items.map(function(w,i){return (
              <button key={i} style={{padding:"4px 6px",fontSize:13,background:"rgba(14,116,144,.07)",border:"1px solid rgba(14,116,144,.18)",borderRadius:6,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",color:"var(--text)"}} onClick={function(){speak(w[0])}}>
                <span style={{fontWeight:700,color:"var(--accent,#0e7490)"}}>{w[0]}</span>{" — "}{w[1]}
              </button>
            );})}
          </div>
          <div style={{borderTop:"1px solid var(--card-b)",paddingTop:8}}>
            {sec.phrases.map(function(p,i){return (
              <button key={i} style={{display:"block",width:"100%",fontSize:13,padding:"5px 8px",marginBottom:3,fontWeight:600,color:"var(--heading)",background:"rgba(14,116,144,.06)",border:"1px solid rgba(14,116,144,.15)",borderRadius:7,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(p)}}>{p}{" 🔊"}</button>
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
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
    </div>
  );
}

export function TransportScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🚌 Getting Around","Bus, tram, taxi phrases",goBack)}
      {TRANSPORT.map(function(t,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(t.hr)}}>
          <span style={{fontWeight:700,fontSize:14}}>{t.hr}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{t.en}</span>
        </button>
      );})}
    </div>
  );
}

export function EmergencyScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🚨 Emergency Phrases","Medical, police, urgent",goBack)}
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2",textAlign:"center"}}>
        <div style={{fontSize:48,fontWeight:800,color:"#dc2626"}}>112</div>
        <div style={{fontSize:14,fontWeight:700}}>{EMERGENCY.number}</div>
      </div>
      {EMERGENCY.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14,color:"#dc2626"}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🦴 Body Parts</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {EMERGENCY.bodyParts.map(function(b,i){return (
          <button key={i} className="c" style={{padding:"8px",textAlign:"center"}} onClick={function(){speak("Boli me "+b[0])}}>
            <div style={{fontSize:13,fontWeight:700}}>{b[0]}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{b[1]}</div>
          </button>
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
    <div className="scr-wrap">
      
      {H("⚽ Football & Water Polo","Croatia's biggest sports",goBack)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {FOOTBALL.vocab.map(function(w,i){return (
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <span style={{fontWeight:700,fontSize:13}}>{w[0]}</span>{" — "}<span style={{color:"var(--subtext)",fontSize:12}}>{w[1]}</span>
          </button>
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
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <span style={{fontWeight:700}}>{w[0]}</span>{" — "}<span style={{color:"var(--subtext)"}}>{w[1]}</span>
          </button>
        );})}
      </div>
    </div>
  );
}

export function PopCultureScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🎵 Croatian Pop Culture","Music, TV & artists your friends know",goBack)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {POPCULTURE.map(function(p,i){return (
          <button key={i} className="tc" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}
            onClick={function(e){e.preventDefault();window.open(p.web,"_blank","noopener,noreferrer")}}>
            <div style={{fontSize:24}}>{p.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--heading)"}}>{p.name}</div>
              <div style={{fontSize:11,color:"var(--subtext)"}}>{p.desc}</div>
            </div>
          </button>
        );})}
      </div>
    </div>
  );
}

export function PracticalScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("💼 Practical Life in Croatia","Documents, customs, culture",goBack)}
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
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(d[0])}}>
            <div style={{fontSize:13,fontWeight:700}}>{d[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{d[1]}</div>
          </button>
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
    <div className="scr-wrap">
      
      {H("🏫 School Survival Kit","Everything for Croatian school",goBack)}
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
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--heading)"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{w[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>📝 Subjects</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {SCHOOL.subjects.map(function(w,i){return (
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#7c3aed"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{w[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>🗣️ Essential Phrases</h3>
      {SCHOOL.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
    </div>
  );
}

export function GroceryScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🛒 Grocery Shopping","Stores, brands & essential vocab",goBack)}
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
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#0e7490"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{w[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh">🗣️ At the Store</h3>
      {GROCERY.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
    </div>
  );
}

function HimnaPlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) { a.pause(); }
    else { a.play().catch(() => {}); }
  }

  function seek(e) {
    const a = ref.current;
    if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  }

  function fmt(s) {
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  return (
    <div className="c" style={{marginTop:24,borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)",padding:"20px"}}>
      <audio
        ref={ref}
        src="/audio/bojna-cavoglave-v3.m4a"
        preload="metadata"
        onLoadedMetadata={() => { if (ref.current) { setDuration(ref.current.duration); setLoaded(true); } }}
        onTimeUpdate={() => { const a = ref.current; if (a) { setCurrent(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); } }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); if (ref.current) ref.current.currentTime = 0; }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setError(true); setLoaded(false); }}
      />
      <div style={{fontSize:11,fontWeight:900,color:"#991b1b",letterSpacing:"0.07em",marginBottom:10,textTransform:"uppercase"}}>
        🎵 The Sound of the Homeland War
      </div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontSize:17,fontWeight:900,color:"#7f1d1d",fontFamily:"'Playfair Display',serif"}}>Bojna Čavoglave</div>
          <div style={{fontSize:12,color:"#b91c1c",fontWeight:600,marginTop:3}}>Marko Perković Thompson · 1991</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"#44403c",lineHeight:1.7,marginBottom:10}}>
        Written by Thompson while defending his village of Čavoglave in the Drniš area of Dalmatinska zagora, recorded on a cassette tape and passed hand-to-hand among soldiers and civilians. It became the battle himna of the Homeland War — sung in trenches, at funerals, and at the liberation of Knin on August 5, 1995.
      </div>
      <div style={{fontSize:12,color:"#44403c",lineHeight:1.7,marginBottom:16,padding:"10px 14px",background:"rgba(185,28,28,.06)",borderRadius:10}}>
        <strong style={{color:"#991b1b"}}>Why "Thompson"?</strong> During the war, Marko Perković carried a <em>Thompson M1A1</em> — the iconic American submachine gun, the same "Tommy gun" used in World War II and familiar to Croatian fighters who had inherited or acquired WWII-era surplus weapons. His fellow soldiers started calling him by the name of the gun he never put down. He kept the nickname as his stage name, and Marko Perković Thompson has been known simply as <em>Thompson</em> ever since.
      </div>
      {error ? (
        <div style={{fontSize:12,color:"#991b1b",fontStyle:"italic"}}>⚠️ Audio unavailable.</div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button
            onClick={toggle}
            style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#dc2626,#991b1b)",border:"none",color:"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 16px rgba(185,28,28,.4)"}}>
            {playing ? "⏸" : "▶"}
          </button>
          <div style={{flex:1}}>
            <div
              onClick={seek}
              style={{padding:"8px 0",cursor:"pointer",position:"relative",marginBottom:2}}>
              <div style={{height:6,background:"rgba(185,28,28,.2)",borderRadius:6,position:"relative"}}>
                <div style={{position:"absolute",top:0,left:0,height:"100%",width:progress+"%",background:"linear-gradient(90deg,#dc2626,#991b1b)",borderRadius:6,transition:"width .15s linear"}} />
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#991b1b",fontWeight:700}}>
              <span>{fmt(current)}</span>
              <span>{loaded ? fmt(duration) : "loading…"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🇭🇷 "+HISTORY.title,HISTORY.subtitle,goBack)}
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
          <button key={i} className="c" style={{padding:"10px 14px"}} onClick={function(){speak(v[0])}}>
            <div style={{fontSize:14,fontWeight:700,color:"#991b1b"}}>{v[0]}{" 🔊"}</div>
            <div style={{fontSize:12,color:"var(--subtext)"}}>{v[1]}</div>
          </button>
        );})}
      </div>
      <div className="c" style={{marginTop:24,textAlign:"center",borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#991b1b",fontFamily:"'Playfair Display',serif",fontStyle:"italic",marginBottom:8}}>{HISTORY.quote}</div>
        <div style={{fontSize:20,fontWeight:700,color:"#b91c1c",fontFamily:"'Playfair Display',serif",fontStyle:"italic"}}>{HISTORY.quote2}</div>
      </div>
      <HimnaPlayer />
    </div>
  );
}

// ── Shared inner component used by both sport screens ──────────────────────
function SportScreen({ data, accent, heroGradient, heroIcon }) {
  const [activeSection, setActiveSection] = useState(0);
  const [playing, setPlaying] = useState(null);
  const section = data.sections[activeSection];
  const totalPhrases = data.sections.reduce(function(sum,s){return sum+s.phrases.length},0);

  function playPhrase(hr, key) {
    setPlaying(key);
    speak(hr);
    setTimeout(function(){setPlaying(null);},2200);
  }

  // Detect vocab-style sections (short terms, no contextual notes)
  const isVocabSection = section.phrases.every(function(p){return p.hr.length<=35 && !p.note;});

  return (
    <div className="scr-wrap">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{marginBottom:24,borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
        <div style={{background:heroGradient,padding:"24px 20px 20px"}}>
          <div style={{fontSize:40,marginBottom:8}}>{heroIcon}</div>
          <div style={{fontSize:22,fontWeight:900,color:"white",letterSpacing:"-.02em",lineHeight:1.2}}>{data.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.75)",marginTop:4,fontWeight:500}}>{data.subtitle}</div>
          <div style={{marginTop:12,display:"flex",gap:8}}>
            <span style={{background:"rgba(255,255,255,.18)",color:"white",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
              {data.sections.length} categories
            </span>
            <span style={{background:"rgba(255,255,255,.18)",color:"white",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
              {totalPhrases}+ phrases
            </span>
          </div>
        </div>
        <div style={{background:"rgba(0,0,0,.45)",padding:"12px 20px"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.6}}>{data.intro}</div>
        </div>
      </div>

      {/* ── Category tab bar ─────────────────────────────────────────── */}
      <div style={{display:"flex",gap:0,overflowX:"auto",marginBottom:20,borderBottom:"2px solid #f1f5f9",paddingBottom:0}}>
        {data.sections.map(function(s,si){
          const isActive = activeSection===si;
          return (
            <button key={si} onClick={function(){setActiveSection(si)}}
              style={{flex:"0 0 auto",padding:"10px 14px",border:"none",borderBottom:isActive?"2.5px solid "+accent:"2.5px solid transparent",
                background:"transparent",fontSize:12,fontWeight:isActive?800:500,
                color:isActive?accent:"#78716c",cursor:"pointer",transition:"all .18s",
                whiteSpace:"nowrap",marginBottom:"-2px",lineHeight:1.2}}>
              <span style={{marginRight:4}}>{s.icon}</span>
              <span>{s.title}</span>
              <span style={{marginLeft:6,background:isActive?accent+"18":"#f1f5f9",color:isActive?accent:"#a8a29e",
                fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>
                {s.phrases.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Section label ────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#1c1917"}}>{section.icon} {section.title}</div>
          <div style={{fontSize:11,color:"#78716c",marginTop:2,fontWeight:500}}>{section.en} &nbsp;·&nbsp; {section.phrases.length} items</div>
        </div>
        <div style={{width:36,height:36,borderRadius:10,background:accent+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
          {section.icon}
        </div>
      </div>

      {/* ── Vocab grid (short terms) ──────────────────────────────────── */}
      {isVocabSection && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          {section.phrases.map(function(p,pi){
            const key=activeSection+"-"+pi;
            const isPlaying=playing===key;
            return (
              <button key={pi}
                onClick={function(){playPhrase(p.hr,key)}}
                style={{background:"white",borderRadius:14,border:"1px solid "+(isPlaying?accent:"rgba(0,0,0,.06)"),
                  boxShadow:isPlaying?"0 0 0 3px "+accent+"25":"0 1px 4px rgba(0,0,0,.05)",
                  padding:"12px 14px",cursor:"pointer",transition:"all .18s",
                  borderLeft:"3px solid "+(isPlaying?accent:accent+"50"),
                  width:"100%",textAlign:"left",fontFamily:"'Outfit',sans-serif"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:accent+"99",fontVariantNumeric:"tabular-nums"}}>
                    {String(pi+1).padStart(2,"0")}
                  </span>
                  <span style={{fontSize:14,opacity:isPlaying?1:.35,transition:"opacity .2s"}}>🔊</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:"#1c1917",lineHeight:1.3}}>{p.hr}</div>
                <div style={{fontSize:11,color:"#78716c",marginTop:3,lineHeight:1.4}}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Phrase list (full sentences / commands) ───────────────────── */}
      {!isVocabSection && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {section.phrases.map(function(p,pi){
            const key=activeSection+"-"+pi;
            const isPlaying=playing===key;
            return (
              <button key={pi}
                onClick={function(){playPhrase(p.hr,key)}}
                style={{display:"flex",alignItems:"stretch",background:"white",borderRadius:14,
                  border:"1px solid "+(isPlaying?accent:"rgba(0,0,0,.06)"),
                  boxShadow:isPlaying?"0 0 0 3px "+accent+"22":"0 2px 6px rgba(0,0,0,.05)",
                  overflow:"hidden",cursor:"pointer",transition:"all .18s",
                  width:"100%",textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:0}}>
                {/* Number gutter */}
                <div style={{width:40,flexShrink:0,background:isPlaying?accent:accent+"08",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:800,color:isPlaying?"white":accent+"80",
                  transition:"all .18s",fontVariantNumeric:"tabular-nums"}}>
                  {String(pi+1).padStart(2,"0")}
                </div>
                {/* Content */}
                <div style={{flex:1,padding:"13px 14px"}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#1c1917",lineHeight:1.3,marginBottom:4}}>{p.hr}</div>
                  <div style={{fontSize:12,color:"#44403c",lineHeight:1.4}}>{p.en}</div>
                  {p.note && (
                    <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:4,
                      background:accent+"0f",borderRadius:6,padding:"3px 8px"}}>
                      <span style={{fontSize:10,color:accent,fontWeight:700}}>ⓘ</span>
                      <span style={{fontSize:10,color:accent+"cc",lineHeight:1.4}}>{p.note}</span>
                    </div>
                  )}
                </div>
                {/* Speaker indicator */}
                <div style={{width:44,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",
                    background:isPlaying?accent:"rgba(0,0,0,.04)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:13,transition:"all .18s"}}>
                    {isPlaying ? <span style={{color:"white"}}>♪</span> : <span style={{opacity:.45}}>🔊</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BasketballScreen({ goBack }) {
  return (
    <div>
      {goBack&&<button onClick={goBack} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"#78716c",padding:"12px 16px 0",fontFamily:"'Outfit',sans-serif"}}>‹ Back</button>}
      <SportScreen
        data={BASKETBALL}
        accent="#ea580c"
        heroGradient="linear-gradient(145deg,#9a3412,#ea580c)"
        heroIcon="🏀"
      />
    </div>
  );
}

export function GymScreen({ goBack }) {
  return (
    <div>
      {goBack&&<button onClick={goBack} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"#78716c",padding:"12px 16px 0",fontFamily:"'Outfit',sans-serif"}}>‹ Back</button>}
      <SportScreen
        data={GYM}
        accent="#4f46e5"
        heroGradient="linear-gradient(145deg,#1e1b4b,#4f46e5)"
        heroIcon="🏋️"
      />
    </div>
  );
}
