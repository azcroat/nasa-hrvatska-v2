import React, { useState, useRef, useEffect } from 'react';
import { H, MEDIA, getCityOfDay } from '../../data.jsx';

const LEVEL_COLORS = {A1:'#16a34a',A2:'#65a30d',B1:'#ca8a04',B2:'#b45309',C1:'#0e7490',C2:'#7c3aed'};
const CAT_LABELS = {tv:"📺 TV & News",music:"🎵 Music & Radio",sport:"⚽ Sports",film:"🎬 Film & Series",podcast:"🎙️ Podcasts",culture:"🌍 Culture & Press"};

function getDomain(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch(e) { return null; }
}

function getActionLabel(m, cat) {
  if (m.scr && !m.web) return ['Open →', false];
  if (m.live) {
    if (cat === 'tv') return ['Watch Live ↗', true];
    if (cat === 'music') return ['Listen Live ↗', true];
  }
  if (m.video) return ['Watch ↗', false];
  const labels = {tv:'Read ↗', music:'Listen ↗', film:'Watch ↗', sport:'Visit ↗', podcast:'Listen ↗', culture:'Read ↗'};
  return [labels[cat] || 'Open ↗', false];
}

function RadioPlayer({ src, color, streamId, activeStream, setActiveStream }) {
  const isActive = activeStream === streamId;
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!isActive && ref.current) {
      ref.current.pause();
      ref.current.removeAttribute('src');
      ref.current.load();
      setPlaying(false);
      setBuffering(false);
    }
  }, [isActive]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing || buffering) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      setPlaying(false);
      setBuffering(false);
      setActiveStream(null);
    } else {
      setError(false);
      setBuffering(true);
      setActiveStream(streamId);
      a.src = src;
      a.play().catch(() => { setError(true); setBuffering(false); setActiveStream(null); });
    }
  }

  return (
    <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
      <audio
        ref={ref}
        preload="none"
        onPlaying={() => { setPlaying(true); setBuffering(false); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onError={() => { setError(true); setBuffering(false); setPlaying(false); setActiveStream(null); }}
      />
      <button
        onClick={toggle}
        style={{
          width:40,height:40,borderRadius:'50%',
          background:(playing||buffering) ? color : `${color}18`,
          border:`2px solid ${color}50`,
          color:(playing||buffering) ? 'white' : color,
          fontSize:16,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          flexShrink:0,transition:'all .15s',
          boxShadow:(playing||buffering) ? `0 4px 14px ${color}50` : 'none',
        }}>
        {buffering ? <span style={{fontSize:12,fontWeight:900}}>…</span> : playing ? '⏸' : '▶'}
      </button>
      <div style={{flex:1,minWidth:0}}>
        {error
          ? <span style={{fontSize:11,color:'#dc2626',fontWeight:700}}>Stream unavailable — tap to retry</span>
          : playing
            ? <div style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'#dc2626',display:'inline-block',flexShrink:0,boxShadow:'0 0 6px #dc2626'}}/>
                <span style={{fontSize:11,fontWeight:900,color:'#dc2626',letterSpacing:'0.05em'}}>LIVE</span>
                <span style={{fontSize:11,color:'#6b7280',marginLeft:2}}>Streaming now</span>
              </div>
            : buffering
              ? <span style={{fontSize:11,color:'#6b7280'}}>Connecting to stream…</span>
              : <span style={{fontSize:11,color:'#6b7280'}}>Tap ▶ to stream live</span>
        }
      </div>
    </div>
  );
}

function MediaCard({ m, cat, onOpen, activeStream, setActiveStream }) {
  const [tipOpen, setTipOpen] = useState(false);
  const lc = LEVEL_COLORS[m.level] || '#78716c';
  const isExternal = !!m.web;
  const isInternal = !!m.scr && !m.web;
  const hasAction = isExternal || isInternal;
  const domain = getDomain(m.web);
  const isHRTI = domain === 'hrti.hrt.hr';
  const [actionLabel, isLive] = getActionLabel(m, cat);
  const btnBg = isLive ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : isInternal ? '#0e7490' : m.color;
  const btnShadow = isLive ? '0 3px 10px rgba(220,38,38,.35)' : `0 2px 6px ${m.color}35`;
  const streamId = m.stream ? m.name : null;

  return (
    <div style={{background:'white',borderRadius:16,border:'1px solid rgba(0,0,0,.07)',boxShadow:'0 2px 8px rgba(0,0,0,.04)',overflow:'hidden',marginBottom:10}}>
      {/* Info row */}
      <div style={{display:'flex',gap:12,padding:'14px 14px 12px',alignItems:'flex-start'}}>
        <div style={{width:46,height:46,borderRadius:13,background:m.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,border:`1px solid ${m.color}20`}}>
          {m.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:13,fontWeight:800,color:'#1c1917'}}>{m.name}</span>
            {m.level && <span style={{background:`${lc}18`,color:lc,fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:`1px solid ${lc}35`,letterSpacing:'0.04em'}}>{m.level}</span>}
            {isHRTI && <span style={{background:'rgba(220,38,38,.08)',color:'#dc2626',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>HRT+</span>}
            {isInternal && <span style={{background:'rgba(14,116,144,.08)',color:'#0e7490',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(14,116,144,.2)',letterSpacing:'0.04em'}}>IN APP</span>}
            {m.stream && <span style={{background:'rgba(220,38,38,.08)',color:'#dc2626',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>LIVE</span>}
          </div>
          <div style={{fontSize:11.5,color:'#6b7280',lineHeight:1.5}}>{m.desc}</div>
          {domain && !isHRTI && !m.stream && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:10,color:'#a8a29e'}}>
              <span>🌐</span><span>{domain}</span>
            </div>
          )}
          {isHRTI && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:10,color:'#b91c1c'}}>
              <span>🔐</span><span>Subscription required · browser auto-fills saved login</span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderTop:'1px solid rgba(0,0,0,.05)',background:'rgba(0,0,0,.015)'}}>
        {m.stream
          ? <RadioPlayer
              src={m.stream}
              color={m.color}
              streamId={streamId}
              activeStream={activeStream}
              setActiveStream={setActiveStream}
            />
          : hasAction && (
            <button
              onClick={onOpen}
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:btnBg,color:'white',border:'none',borderRadius:10,fontSize:11,fontWeight:800,cursor:'pointer',letterSpacing:'0.02em',boxShadow:btnShadow,flexShrink:0}}>
              {isLive && <span style={{width:6,height:6,borderRadius:'50%',background:'white',display:'inline-block',opacity:.9,flexShrink:0}}/>}
              {actionLabel}
            </button>
          )
        }
        {m.tip && (
          <button
            onClick={() => setTipOpen(o => !o)}
            style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'6px 10px',borderRadius:8,background:tipOpen?'rgba(14,116,144,.08)':'transparent',border:'1px solid '+(tipOpen?'rgba(14,116,144,.2)':'rgba(0,0,0,.07)'),color:tipOpen?'#0e7490':'#78716c',flexShrink:0}}>
            <span style={{fontSize:12}}>💡</span>
            <span style={{fontSize:11,fontWeight:700}}>Tip</span>
            <span style={{fontSize:10,fontWeight:700}}>{tipOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Tip content */}
      {m.tip && tipOpen && (
        <div style={{padding:'12px 14px 16px',borderTop:'1px solid rgba(14,116,144,.08)',background:'rgba(14,116,144,.025)'}}>
          <p style={{margin:0,fontSize:11.5,color:'#44403c',lineHeight:1.75}}>{m.tip}</p>
        </div>
      )}
    </div>
  );
}

export default function CroatiaTab({
  setScr, sHIdx, sKgTab, sCurEx,
  setRcIdx, setRcServ, setRpIdx, setRpLine, setRpShow,
  setMapCat, setMapSel,
}) {
  const cats = ["tv","music","film","sport","podcast","culture"];
  const city = getCityOfDay();
  const [activeStream, setActiveStream] = useState(null);

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
              {["50 scenarios","All levels","Free"].map(t=>(
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[
          [()=>{sHIdx(0);setScr("history");},"🇭🇷","Domovinski Rat","Homeland War"],
          [()=>{sKgTab("timeline");setScr("kings");sCurEx("kings");},"👑","Croatian Kings","Medieval kingdom"],
          [()=>setScr("region_zagreb"),"🏛️","Zagreb","Capital city"],
          [()=>setScr("region_split"),"🌊","Split","Rome on the Adriatic"],
          [()=>setScr("region_mostar"),"🌉","Mostar","The bridge reborn"],
          [()=>setScr("region_tomislavgrad"),"👑","Tomislavgrad","Where Croatia was born"],
          [()=>setScr("region_knin"),"🏰","Knin","Liberated Aug 5, 1995"],
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

      {/* City of the Day */}
      <div style={{marginBottom:20,borderRadius:16,overflow:"hidden",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}} onClick={()=>setScr("cityofday")}>
        <div style={{background:"linear-gradient(135deg,"+city.color+"dd,"+city.color+")",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:36,flexShrink:0}}>{city.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.75)",letterSpacing:"0.08em",marginBottom:3}}>🗓️ CITY OF THE DAY</div>
            <div style={{fontSize:17,fontWeight:900,color:"white",lineHeight:1.2}}>{city.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)",marginTop:2}}>{city.region} &nbsp;·&nbsp; <span style={{fontStyle:"italic"}}>"{city.tagline}"</span></div>
          </div>
          <div style={{fontSize:20,opacity:.7,color:"white"}}>→</div>
        </div>
        <div style={{background:"rgba(0,0,0,.55)",padding:"7px 16px",fontSize:11,color:"rgba(255,255,255,.65)"}}>
          New city every day · {city.facts.length} facts · {city.vocab.length} words to learn
        </div>
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
        {[["🏫","School Kit","school"],["📱","Texting","texting"],["🤝","Make Friends","friends"],["🍕","Order Food","foodorder"],["🚌","Transport","transport"],["🚨","Emergency","emergency"],["💼","Practical Life","practical"],["🏀","At Basketball","basketball"],["🏋️","At the Gym","gym"]].map(([icon,label,screen])=>(
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
      <div style={{padding:'12px 14px',background:'linear-gradient(135deg,rgba(14,116,144,.06),rgba(14,116,144,.1))',borderRadius:12,marginBottom:20,borderLeft:'3px solid #0e7490'}}>
        <div style={{fontSize:12,fontWeight:800,color:'#164e63',marginBottom:5}}>📱 How it works</div>
        <div style={{fontSize:12,color:'#44403c',lineHeight:1.7}}>
          Radio stations with a{' '}
          <span style={{background:'rgba(220,38,38,.08)',color:'#dc2626',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)'}}>LIVE</span>{' '}
          badge stream directly inside the app — tap ▶ to start. TV and other media open in your browser.{' '}
          <span style={{background:'rgba(220,38,38,.08)',color:'#dc2626',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)'}}>HRT+</span>{' '}
          requires an HRT subscription.{' '}
          Tap <strong>💡 Tip</strong> on any card for a language-learning tip.
        </div>
      </div>

      {cats.map(cat => {
        const items = MEDIA.filter(m => m.cat === cat);
        if (!items.length) return null;
        const parts = CAT_LABELS[cat].split(' ');
        const catEmoji = parts[0];
        const catTitle = parts.slice(1).join(' ');
        return (
          <div key={cat} style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontSize:18}}>{catEmoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#1c1917'}}>{catTitle}</div>
                <div style={{height:2,width:36,background:'linear-gradient(90deg,#0e7490,transparent)',borderRadius:2,marginTop:2}}/>
              </div>
            </div>
            {items.map((m, i) => (
              <MediaCard
                key={i}
                m={m}
                cat={cat}
                onOpen={() => {
                  if (m.scr) setScr(m.scr);
                  else if (m.web) window.open(m.web, '_blank', 'noopener,noreferrer');
                }}
                activeStream={activeStream}
                setActiveStream={setActiveStream}
              />
            ))}
          </div>
        );
      })}
    </React.Fragment>
  );
}
