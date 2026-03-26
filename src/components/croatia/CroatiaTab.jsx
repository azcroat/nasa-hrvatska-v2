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
        {buffering ? <span style={{fontSize:'var(--text-sm)',fontWeight:900}}>…</span> : playing ? '⏸' : '▶'}
      </button>
      <div style={{flex:1,minWidth:0}}>
        {error
          ? <span style={{fontSize:'var(--text-xs)',color:'var(--error)',fontWeight:700}}>Stream unavailable — tap to retry</span>
          : playing
            ? <div style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'var(--error)',display:'inline-block',flexShrink:0,boxShadow:'0 0 6px var(--error)'}}/>
                <span style={{fontSize:'var(--text-xs)',fontWeight:900,color:'var(--error)',letterSpacing:'0.05em'}}>LIVE</span>
                <span style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginLeft:2}}>Streaming now</span>
              </div>
            : buffering
              ? <span style={{fontSize:'var(--text-xs)',color:'var(--subtext)'}}>Connecting to stream…</span>
              : <span style={{fontSize:'var(--text-xs)',color:'var(--subtext)'}}>Tap ▶ to stream live</span>
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
    <div className="media-card" style={{background:'var(--card)',borderRadius:16,border:'1px solid var(--card-b)',boxShadow:'0 2px 8px rgba(0,0,0,.04)',overflow:'hidden',marginBottom:10}}>
      {/* Info row */}
      <div style={{display:'flex',gap:12,padding:'14px 14px 12px',alignItems:'flex-start'}}>
        <div style={{width:46,height:46,borderRadius:13,background:m.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,border:`1px solid ${m.color}20`}}>
          {m.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:'var(--text-sm)',fontWeight:800,color:'var(--heading)'}}>{m.name}</span>
            {m.level && <span style={{background:`${lc}18`,color:lc,fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:`1px solid ${lc}35`,letterSpacing:'0.04em'}}>{m.level}</span>}
            {isHRTI && <span style={{background:'rgba(220,38,38,.08)',color:'var(--error)',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>HRT+</span>}
            {isInternal && <span style={{background:'rgba(14,116,144,.08)',color:'#0e7490',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(14,116,144,.2)',letterSpacing:'0.04em'}}>IN APP</span>}
            {m.stream && <span style={{background:'rgba(220,38,38,.08)',color:'var(--error)',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>LIVE</span>}
          </div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',lineHeight:1.5}}>{m.desc}</div>
          {domain && !isHRTI && !m.stream && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:'var(--text-xs)',color:'var(--subtext)'}}>
              <span>🌐</span><span>{domain}</span>
            </div>
          )}
          {isHRTI && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:'var(--text-xs)',color:'var(--error)'}}>
              <span>🔐</span><span>Subscription required · browser auto-fills saved login</span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderTop:'1px solid var(--card-b)',background:'rgba(0,0,0,.015)'}}>
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
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:btnBg,color:'white',border:'none',borderRadius:10,fontSize:'var(--text-xs)',fontWeight:800,cursor:'pointer',letterSpacing:'0.02em',boxShadow:btnShadow,flexShrink:0}}>
              {isLive && <span style={{width:6,height:6,borderRadius:'50%',background:'white',display:'inline-block',opacity:.9,flexShrink:0}}/>}
              {actionLabel}
            </button>
          )
        }
        {m.tip && (
          <button
            onClick={() => setTipOpen(o => !o)}
            style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'6px 10px',borderRadius:8,background:tipOpen?'rgba(14,116,144,.08)':'transparent',border:'1px solid '+(tipOpen?'rgba(14,116,144,.2)':'rgba(0,0,0,.07)'),color:tipOpen?'#0e7490':'#78716c',flexShrink:0}}>
            <span style={{fontSize:'var(--text-sm)'}}>💡</span>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700}}>Tip</span>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700}}>{tipOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Tip content */}
      {m.tip && tipOpen && (
        <div style={{padding:'12px 14px 16px',borderTop:'1px solid var(--card-b)',background:'var(--bar-bg)'}}>
          <p style={{margin:0,fontSize:'var(--text-xs)',color:'var(--body)',lineHeight:1.75}}>{m.tip}</p>
        </div>
      )}
    </div>
  );
}

const SPOTIFY_PLAYLISTS = {
  icons: [
    { id:'37i9dQZF1DZ06evO2GzzZj', name:'This Is Oliver Dragojević', desc:'The soul of Dalmatia — all the classics', icon:'🎤', color:'#0369a1', tag:'Legend' },
    { id:'37i9dQZF1DZ06evO3UANd2', name:'This Is Prljavo Kazalište', desc:"Croatia's greatest rock band — essential listening", icon:'🎸', color:'var(--error)', tag:'Rock' },
    { id:'5OPhthDiArDJMPQfTKIYCn', name:'Thompson', desc:'Patriotic Croatian rock — Marin Čavić', icon:'🇭🇷', color:'var(--error)', tag:'Patriotic' },
    { id:'37i9dQZF1EIUUk1h0TA16K', name:'Crvena Jabuka Mix', desc:'Timeless Croatian pop-rock from the 80s & 90s', icon:'🍎', color:'#e11d48', tag:'Pop/Rock' },
    { id:'5pFl9Ll0hBYydQPEVkMJsQ', name:'Magazin', desc:"Croatia's beloved pop group — hits spanning 4 decades", icon:'💫', color:'#9333ea', tag:'Pop' },
    { id:'37i9dQZF1E4zd1TBgRl9w6', name:'Klapa', desc:'UNESCO-listed Dalmatian choral tradition', icon:'🎶', color:'#0891b2', tag:'Traditional' },
  ],
  genres: [
    { id:'1iqFmUPFuPpBVgvrWccMVW', name:'Croatian Music 2025', desc:'The freshest Croatian tracks right now', icon:'⚡', color:'#059669', tag:'New Music' },
    { id:'1iFnviT7aGiPqpCpNT2hYy', name:'Croatian Hip Hop', desc:'The best of the hrvatski rap scene', icon:'🎤', color:'#6d28d9', tag:'Rap' },
    { id:'2J4UX2zKunR9uRkaAYLbgs', name:'Ljetni Hitovi', desc:"Croatia's biggest summer bangers", icon:'☀️', color:'#d97706', tag:'Summer' },
    { id:'0SFU1J9KaRmtPT5T1Ou6KN', name:'Ultra Europe 2025', desc:"The sound of Split's legendary festival", icon:'🎉', color:'#7c3aed', tag:'Festival' },
  ],
  regions: [
    { id:'72YvCUCAsq0K5WD114It0J', name:'Sound of Tamburica', desc:'Folk tamburica from Slavonia & Baranja', icon:'🎻', color:'#b45309', tag:'Slavonia' },
    { id:'68hJgqwSmwChNNFsVtgEwo', name:'Dalmatinske Pjesme', desc:'Songs of the Adriatic coast', icon:'⚓', color:'#0284c7', tag:'Dalmatia' },
    { id:'37i9dQZF1E4vN6zhBCeoxe', name:'Istra Radio', desc:'The sound of Istrian music & culture', icon:'🫒', color:'#16a34a', tag:'Istria' },
    { id:'37i9dQZF1E4uGl0I2ksRYZ', name:'Dubrovnik Radio', desc:'Music from the Pearl of the Adriatic', icon:'🌊', color:'#0e7490', tag:'Dubrovnik' },
  ],
};

const BAKA_LETTERS = [
  {
    id: 'letter1',
    from: 'Baka Marija',
    date: 'Nedjelja, 14. travnja',
    subject: 'Drago moje unuče...',
    preview: 'Kako si ti? Ovdje je lijepo proljetno vrijeme...',
    full: `Drago moje unuče,

Kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su procvjetali u vrtu i miris jorgovana dolazi kroz prozor.

Juče sam napravila sarmu — baš onako kako si ti volio kad si bio mali. Stavila sam puno riže i malo više paprike, jer znam da ti se sviđa ljuto.

Djed i ja često pričamo o tebi. Nedostaje nam tvoj smijeh. Jesi li naučio još koji novi glagol? Pišemo ti svaki tjedan, ali odgovori nam kad možeš.

Puno ljubavi i zagrljaj,
Tvoja Baka 💙`,
    words: [
      { hr: 'proljetno', en: 'spring (adj.)' },
      { hr: 'cvjetovi', en: 'flowers' },
      { hr: 'miris', en: 'scent/fragrance' },
      { hr: 'sarma', en: 'stuffed cabbage (traditional dish)' },
      { hr: 'nedostaje nam', en: 'we miss (you)' },
      { hr: 'zagrljaj', en: 'hug/embrace' },
    ],
  },
  {
    id: 'letter2',
    from: 'Baka Marija',
    date: 'Ponedjeljak, 22. travnja',
    subject: 'Vijesti iz sela...',
    preview: 'Jučer je bila svadba kod susjeda Ivića...',
    full: `Drago unuče,

Jučer je bila svadba kod susjeda Ivića. Cijelo selo je plesalo kolo do ponoći! Glazba je bila tako lijepa — tamburice i harmonika.

Tvoja teta Ana je donijela fritule — onaj recept koji smo ti uvijek davali za Božić. Svi su pitali za tebe. Rekla sam im da učiš hrvatski i da ćeš doći ljeti. Je li to istina?

Djed je nešto bolje. Hoda po vrtu svako jutro i kopa. Kaže da se bez rada ne može živjeti.

Čekamo te s nestrpljenjem.
Tvoja Baka 💙`,
    words: [
      { hr: 'svadba', en: 'wedding' },
      { hr: 'kolo', en: 'traditional circle dance' },
      { hr: 'tamburice', en: 'traditional string instruments' },
      { hr: 'fritule', en: 'Croatian doughnuts (holiday treat)' },
      { hr: 'nestrpljenje', en: 'impatience / anticipation' },
      { hr: 'kopati', en: 'to dig / to garden' },
    ],
  },
];

function SpotifyCard({ pl, openId, setOpenId }) {
  const isOpen = openId === pl.id;
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--card-b)', marginBottom:8, background:'var(--card)' }}>
      <button
        onClick={() => setOpenId(isOpen ? null : pl.id)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}
      >
        <div style={{ width:42, height:42, borderRadius:11, background:pl.color+'18', border:`1px solid ${pl.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {pl.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>{pl.name}</span>
            <span style={{ background:pl.color+'18', color:pl.color, fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:20, border:`1px solid ${pl.color}30`, letterSpacing:'0.04em', flexShrink:0 }}>{pl.tag}</span>
          </div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.4 }}>{pl.desc}</div>
        </div>
        <div style={{ fontSize:18, color:'var(--subtext)', opacity:.5, transition:'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink:0 }}>⌄</div>
      </button>
      {isOpen && (
        <div style={{ borderTop:'1px solid var(--card-b)' }}>
          <iframe
            src={`https://open.spotify.com/embed/playlist/${pl.id}?utm_source=generator`}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; storage-access"
            loading="lazy"
            style={{ display:'block' }}
          />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(30,215,96,.05)', borderTop:'1px solid rgba(30,215,96,.12)' }}>
            <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>Not loading? Open directly in Spotify.</span>
            <a
              href={`https://open.spotify.com/playlist/${pl.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#1ed760', borderRadius:20, fontSize:'var(--text-xs)', fontWeight:800, color:'#000', textDecoration:'none', flexShrink:0 }}
            >
              <span>Open in Spotify ↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function SpotifyPlaylists() {
  const [openId, setOpenId] = useState(null);
  const groups = [
    { label:'🎤 Croatian Icons', key:'icons' },
    { label:'🎧 Genres & Moods', key:'genres' },
    { label:'🗺️ By Region', key:'regions' },
  ];
  return (
    <div>
      {groups.map(({ label, key }) => (
        <div key={key}>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8, marginTop: key==='icons' ? 0 : 14 }}>{label}</div>
          {SPOTIFY_PLAYLISTS[key].map(pl => (
            <SpotifyCard key={pl.id} pl={pl} openId={openId} setOpenId={setOpenId} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Q-4: Removed dead state setters — target screens manage their own state.
export default function CroatiaTab({ setScr, sCurEx }) {
  const cats = ["tv","music","film","sport","podcast","culture"];
  const city = getCityOfDay();
  const [activeStream, setActiveStream] = useState(null);
  const [activeMediaCat, setActiveMediaCat] = useState("tv");
  const [openLetter, setOpenLetter] = useState(null);

  return (
    <React.Fragment>
      {H("🇭🇷 Life in Croatia", "Culture, history, daily life")}

      {/* ── CITY OF THE DAY ── */}
      <button style={{marginBottom:16,borderRadius:16,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.1)",width:"100%",border:"none",cursor:"pointer",padding:0,textAlign:"left"}} onClick={()=>setScr("cityofday")}>
        <div style={{background:"linear-gradient(135deg,"+city.color+"dd,"+city.color+")",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:36,flexShrink:0}}>{city.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'var(--text-xs)',fontWeight:800,color:"rgba(255,255,255,.75)",letterSpacing:"0.08em",marginBottom:3}}>🗓️ CITY OF THE DAY</div>
            <div style={{fontSize:17,fontWeight:900,color:"white",lineHeight:1.2}}>{city.name}</div>
            <div style={{fontSize:'var(--text-xs)',color:"rgba(255,255,255,.75)",marginTop:2}}>{city.region} &nbsp;·&nbsp; <span style={{fontStyle:"italic"}}>"{city.tagline}"</span></div>
          </div>
          <div style={{fontSize:20,opacity:.7,color:"white"}}>→</div>
        </div>
        <div style={{background:"rgba(0,0,0,.55)",padding:"7px 16px",fontSize:'var(--text-xs)',color:"rgba(255,255,255,.65)"}}>
          New city every day · {city.facts.length} facts · {city.vocab.length} words to learn
        </div>
      </button>

      {/* ── HISTORY & REGIONS — always-visible 2-col grid ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>🇭🇷</span>
          <span style={{ fontSize:'var(--text-base)', fontWeight:800, color:'var(--heading)', flex:1 }}>History & Regions</span>
          <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>12 entries</span>
        </div>
        <div className="g2" style={{ gap:8 }}>
          {[
            [()=>{setScr("history");},"🇭🇷","Domovinski Rat","1991–1995 Homeland War","#dc2626"],
            [()=>setScr("region_vukovar"),"🕯️","Vukovar","Hero city — a deep dive","#dc2626"],
            [()=>{setScr("kings");sCurEx("kings");},"👑","Croatian Kings","Medieval dynasty","#b45309"],
            [()=>setScr("region_zagreb"),"🏛️","Zagreb","Croatia's capital","#0e7490"],
            [()=>setScr("region_split"),"🌊","Split","Rome on the Adriatic","#0284c7"],
            [()=>setScr("region_mostar"),"🌉","Mostar","The bridge reborn","#7c3aed"],
            [()=>setScr("region_tomislavgrad"),"👑","Tomislavgrad","Where the kingdom was born","#b45309"],
            [()=>setScr("region_knin"),"🏰","Knin","Liberated August 5, 1995","#dc2626"],
            [()=>setScr("region_labin"),"⛵","Labin & Rabac","Our home in Istria","#0e7490"],
            [()=>setScr("region_bibinje"),"🏖️","Bibinje & Zadar","Dalmatian gateway","#0284c7"],
            [()=>setScr("region_hercegovina"),"⚔️","Hercegovina","Croatian heritage","#b45309"],
            [()=>setScr("region_vinkovci"),"🏛️","Vinkovci","8,300 years of history","#78716c"],
          ].map((/** @type {any} */ [fn,icon,title,sub,color],i) => (
            <button key={i} onClick={fn}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'12px',
                background:'var(--card)', border:`1.5px solid ${color}25`,
                borderLeft:`3px solid ${color}`, borderRadius:12,
                cursor:'pointer', fontFamily:"'Outfit',sans-serif", textAlign:'left',
                transition:'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 4px 16px ${color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
            >
              <div style={{width:36,height:36,borderRadius:10,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--heading)',lineHeight:1.2,marginBottom:2}}>{title}</div>
                <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',lineHeight:1.3}}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── CROATIAN LIFE — always-visible 2-col grid ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>🏘️</span>
          <span style={{ fontSize:'var(--text-base)', fontWeight:800, color:'var(--heading)', flex:1 }}>Croatian Life</span>
          <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>12 topics</span>
        </div>
        <div className="g2" style={{ gap:8 }}>
          {[
            [()=>setScr("grocery"),"🛒","Grocery Shopping","Supermarket vocab","#16a34a"],
            [()=>{setScr("recipes");},"🍳","Croatian Recipes","Traditional dishes","#b45309"],
            [()=>{setScr("roleplay");},"🎭","Role-Play","Real-life conversations","#7c3aed"],
            [()=>setScr("school"),"🏫","School Kit","For parents & students","#0e7490"],
            [()=>setScr("texting"),"📱","Texting & Slang","How Croatians text","#7c3aed"],
            [()=>setScr("friends"),"🤝","Making Friends","Social life","#16a34a"],
            [()=>setScr("foodorder"),"🍕","Ordering Food","Restaurants & cafés","#b45309"],
            [()=>setScr("transport"),"🚌","Transport","Buses, taxis & trams","#0284c7"],
            [()=>setScr("emergency"),"🚨","Emergency","Essential phrases","#dc2626"],
            [()=>setScr("practical"),"💼","Practical Life","Banks, doctors, admin","#78716c"],
            [()=>setScr("basketball"),"🏀","At Basketball","Croatian basketball","#b45309"],
            [()=>setScr("gym"),"🏋️","At the Gym","Fitness vocabulary","#16a34a"],
          ].map((/** @type {any} */ [fn,icon,title,sub,color],i) => (
            <button key={i} onClick={fn}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'12px',
                background:'var(--card)', border:`1.5px solid ${color}25`,
                borderLeft:`3px solid ${color}`, borderRadius:12,
                cursor:'pointer', fontFamily:"'Outfit',sans-serif", textAlign:'left',
                transition:'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 4px 16px ${color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
            >
              <div style={{width:36,height:36,borderRadius:10,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--heading)',lineHeight:1.2,marginBottom:2}}>{title}</div>
                <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',lineHeight:1.3}}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── STORIES & NEWS ── */}
<div style={{ borderRadius:20, overflow:'hidden', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,.10)', border:'1px solid var(--card-b)' }}>
  <div style={{ background:'linear-gradient(135deg,#451a03,#92400e)', padding:'18px 20px', color:'#fff' }}>
    <div style={{ fontSize:'var(--text-xs)', fontWeight:700, opacity:.7, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:4 }}>STORIES & NEWS</div>
    <div style={{ fontSize:18, fontWeight:900, marginBottom:4 }}>Live the language</div>
    <div style={{ fontSize:'var(--text-sm)', opacity:.8, lineHeight:1.5 }}>Stories from Croatia + real Croatian news</div>
  </div>
  <div className="g3" style={{ background:'var(--card)', padding:'14px 16px', gap:10 }}>
    <button onClick={() => setScr("baka_summer")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(245,158,11,.3)', background:'rgba(245,158,11,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ fontSize:26, marginBottom:6 }}>📖</div>
      <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--warning)' }}>Baka's Summer</div>
      <div style={{ fontSize:'var(--text-xs)', color:'var(--warning)', marginTop:2, opacity:.75 }}>12-chapter story</div>
    </button>
    <button onClick={() => setScr("croatia_today")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(14,116,144,.3)', background:'rgba(14,116,144,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ fontSize:26, marginBottom:6 }}>📰</div>
      <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--info)' }}>Croatia Today</div>
      <div style={{ fontSize:'var(--text-xs)', color:'var(--info)', marginTop:2, opacity:.75 }}>Daily Croatian news</div>
    </button>
    <button onClick={() => setScr("survival_dinner")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(22,163,74,.3)', background:'rgba(22,163,74,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ fontSize:26, marginBottom:6 }}>🍽️</div>
      <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--success)' }}>At the Table</div>
      <div style={{ fontSize:'var(--text-xs)', color:'var(--success)', marginTop:2, opacity:.75 }}>Navigate any dinner</div>
    </button>
    {/* Only show during Easter season (March 20 - April 30) */}
    {(() => {
      const m = new Date().getMonth() + 1, d = new Date().getDate();
      const isEaster = (m === 3 && d >= 20) || (m === 4 && d <= 30);
      if (!isEaster) return null;
      return (
        <div
          onClick={() => setScr('easter')}
          style={{
            background: 'rgba(22,163,74,.06)',
            border: '1.5px solid rgba(22,163,74,.3)', borderRadius: 14,
            padding: '14px', cursor: 'pointer', position: 'relative', textAlign: 'center',
          }}
        >
          <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--error)', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: 6, padding: '2px 5px' }}>NEW</span>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🥚</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#166534' }}>Uskrs u Hrvatskoj</div>
          <div style={{ fontSize: 'var(--text-xs)', color: '#4ade80', fontWeight: 600, marginTop: 2 }}>Easter traditions & phrases</div>
        </div>
      );
    })()}
  </div>
</div>

      {/* ── IMMERSION FEATURE ── */}
      <div style={{ borderRadius:20, overflow:'hidden', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,.10)', border:'1px solid var(--card-b)' }}>
        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#3730a3)', padding:'18px 20px', color:'#fff' }}>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:700, opacity:.7, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:4 }}>IMMERSION</div>
          <div style={{ fontSize:18, fontWeight:900, marginBottom:4 }}>Level up your Croatian</div>
          <div style={{ fontSize:'var(--text-sm)', opacity:.8, lineHeight:1.5 }}>AI conversation practice + curated media from A1 to C2</div>
        </div>
        <div style={{ background:'var(--card)', padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={() => setScr("aiconvo")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid #c7d2fe', background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
            <div style={{ fontSize:26, marginBottom:6 }}>🤖</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#3730a3' }}>AI Conversations</div>
            <div style={{ fontSize:'var(--text-xs)', color:'#6366f1', marginTop:2 }}>50 scenarios · all levels</div>
          </button>
          <button onClick={() => setScr("immersion")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(14,116,144,.3)', background:'rgba(14,116,144,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
            <div style={{ fontSize:26, marginBottom:6 }}>🌊</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--info)' }}>Immersion Hub</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--info)', marginTop:2, opacity:.75 }}>A1 → C2 pathway</div>
          </button>
        </div>
      </div>

{/* ── LANGUAGE & CULTURE ──────────────────────────────────────────── */}
<div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10, marginTop:8 }}>
  Language & Culture
</div>
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
  {[
    { icon:'☕', title:'U Kafiću', desc:'The art of Croatian coffee culture', color:'#fff7ed', border:'#fed7aa', scr:'kafic' },
    { icon:'💙', title:'Diaspora Croatian', desc:'Code-switching & heritage language', color:'#f0f9ff', border:'#bae6fd', scr:'diaspora' },
    { icon:'🎊', title:'Life Events', desc:'Weddings, funerals, baptisms', color:'#fdf4ff', border:'#e9d5ff', scr:'lifeevents' },
    { icon:'🏛️', title:'Civic Croatian', desc:'Vocabulary to read the news', color:'#f0fdf4', border:'#86efac', scr:'civic' },
  ].map(c => (
    <button key={c.scr} className="tc"
      style={{ textAlign:'center', padding:'16px 12px', background:c.color, border:`1.5px solid ${c.border}` }}
      onClick={() => setScr(c.scr)}>
      <div style={{ fontSize:28, marginBottom:6 }}>{c.icon}</div>
      <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', lineHeight:1.2, marginBottom:3 }}>
        {c.title}
        <span style={{ background:'var(--error)', color:'#fff', fontSize:9, fontWeight:900, borderRadius:6, padding:'2px 5px', marginLeft:6, letterSpacing:0.5 }}>NEW</span>
      </div>
      <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.3 }}>{c.desc}</div>
    </button>
  ))}
</div>

      {/* ── LETTERS FROM BAKA ─── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase' }}>
            ✉️ Letters from Baka
          </div>
          <div style={{ flex:1, height:1, background:'var(--card-b)' }} />
        </div>
        <p style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:12, fontWeight:500, fontStyle:'italic' }}>
          Authentic letters to help you read Croatian the way family really writes it
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {BAKA_LETTERS.map(letter => (
            <div key={letter.id} style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:14, overflow:'hidden' }}>
              <button
                onClick={() => setOpenLetter(openLetter === letter.id ? null : letter.id)}
                style={{ width:'100%', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #fde68a',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💌</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>{letter.from}</div>
                    <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:1 }}>{letter.subject} · {letter.date}</div>
                  </div>
                  <span style={{ fontSize:'var(--text-base)', color:'var(--subtext)', opacity:.5 }}>{openLetter === letter.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {openLetter === letter.id && (
                <div style={{ borderTop:'1px solid var(--card-b)', padding:'16px' }}>
                  <div style={{
                    background:'#fffbeb', border:'1px solid #fde68a',
                    borderRadius:10, padding:'14px 16px', marginBottom:14,
                    fontFamily:"Georgia, serif", fontSize:'var(--text-sm)', lineHeight:1.8, color:'#451a03',
                    whiteSpace:'pre-line',
                  }}>
                    {letter.full}
                  </div>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                    📚 Words from this letter
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {letter.words.map(w => (
                      <div key={w.hr} style={{ background:'var(--bar-bg)', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#0e7490' }}>{w.hr}</div>
                        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>{w.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── EXPLORE CROATIA ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--subtext)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
          Explore Croatia
        </div>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px",width:"100%"}} onClick={() => { setScr("crmap"); }}>
          <div style={{fontSize:36}}>🗺️</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"var(--heading)"}}>Interactive Map & Directions</div>
            <div style={{fontSize:'var(--text-sm)',color:"var(--subtext)"}}>Explore Croatia — cities, parks, beaches, islands</div>
          </div>
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          TUNE IN TO CROATIA — Immersive Broadcast Hub
      ══════════════════════════════════════════════ */}

      {/* ─── Hero ─────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(160deg,#060e1e 0%,#071830 50%,#0a2a50 100%)',
        borderRadius:20, overflow:'hidden', marginBottom:22,
        position:'relative', boxShadow:'0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{height:4,background:'linear-gradient(90deg,#D40030 0%,#D40030 50%,#F8F6F2 50%,#F8F6F2 100%)'}}/>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.035) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 6s linear infinite',pointerEvents:'none'}}/>
        <div style={{padding:'22px 22px 24px',position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 10px #ef4444',animation:'pulse 1.5s ease-in-out infinite'}}/>
            <span style={{fontSize:10,fontWeight:900,color:'rgba(255,255,255,.45)',letterSpacing:'.18em',textTransform:'uppercase'}}>LIVE FROM CROATIA</span>
          </div>
          <div style={{fontSize:28,fontWeight:900,color:'white',fontFamily:"'Playfair Display',serif",lineHeight:1.1,marginBottom:8,textShadow:'0 2px 20px rgba(0,0,0,.5)'}}>
            Tune In to Croatia
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.6)',fontWeight:500,lineHeight:1.5,marginBottom:14}}>
            Real Croatian — live radio, TV, music, film & sport
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {['📡 Live Radio','📺 TV & News','🎵 Music','⚽ Sport','🎬 Film'].map(t => (
              <span key={t} style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.55)',background:'rgba(255,255,255,.07)',borderRadius:20,padding:'3px 10px',border:'1px solid rgba(255,255,255,.1)'}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── LIVE RADIO ────────────────────────────────── */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'var(--error)',boxShadow:'0 0 8px var(--error)',animation:'pulse 1.5s ease-in-out infinite'}}/>
          <span style={{fontSize:11,fontWeight:900,color:'var(--error)',textTransform:'uppercase',letterSpacing:'.1em'}}>Streaming Live</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {MEDIA.filter(m => !!m.stream).map((m,i) => (
            <div key={i} style={{
              background:`linear-gradient(175deg,#0c1520 0%,${m.color}40 100%)`,
              borderRadius:16,overflow:'hidden',border:`1px solid ${m.color}30`,
              display:'flex',flexDirection:'column',
              boxShadow:`0 4px 20px ${m.color}18`,
            }}>
              <div style={{padding:'16px 10px 8px',textAlign:'center'}}>
                <div style={{fontSize:30,marginBottom:6}}>{m.icon}</div>
                <div style={{fontSize:10,fontWeight:900,color:'white',lineHeight:1.25,marginBottom:3}}>
                  {m.name.split(' — ')[0].replace(' Live','').replace(' Radio Live','').trim()}
                </div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.4)',lineHeight:1.3,marginBottom:8}}>{m.level}</div>
              </div>
              <div style={{padding:'0 8px 10px'}}>
                <RadioPlayer src={m.stream} color={m.color} streamId={m.name} activeStream={activeStream} setActiveStream={setActiveStream}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CONTENT CATEGORIES ─────────────────────────── */}
      {[
        {cat:'tv',     emoji:'📺', title:'TV & News',         accent:'#0e7490',  noStream:false},
        {cat:'music',  emoji:'🎵', title:'Music',              accent:'#9333ea',  noStream:true},
        {cat:'film',   emoji:'🎬', title:'Film & Video',       accent:'#b91c1c',  noStream:false},
        {cat:'sport',  emoji:'⚽', title:'Sport',              accent:'#1d4ed8',  noStream:false},
        {cat:'podcast',emoji:'🎙️',title:'Podcasts & Audio',   accent:'#16a34a',  noStream:false},
        {cat:'culture',emoji:'🌍', title:'Culture & Press',    accent:'#7c3aed',  noStream:false},
      ].map(({cat,emoji,title,accent,noStream}) => {
        const items = MEDIA.filter(m => m.cat === cat && (noStream ? !m.stream : true));
        if (!items.length) return null;
        return (
          <div key={cat} style={{marginBottom:24}}>
            {/* Section header */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 14px',borderRadius:12,background:`${accent}10`,borderLeft:`3px solid ${accent}`}}>
              <span style={{fontSize:18}}>{emoji}</span>
              <span style={{fontSize:15,fontWeight:900,color:'var(--heading)',flex:1}}>{title}</span>
              <span style={{fontSize:10,color:'var(--subtext)',fontWeight:600,background:'var(--bar-bg)',borderRadius:8,padding:'2px 8px'}}>{items.length}</span>
            </div>
            {/* 2-column visual grid */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {items.map((m,i) => {
                const isInternal = !!m.scr && !m.web;
                const isExtLive = !!(m.live && !m.stream && m.web);
                const hasAction = !!(m.scr || m.web);
                return (
                  <button key={i}
                    onClick={() => { if (m.scr) setScr(m.scr); else if (m.web) window.open(m.web,'_blank','noopener,noreferrer'); }}
                    style={{
                      display:'flex',flexDirection:'column',background:'var(--card)',
                      borderRadius:16,border:'1px solid var(--card-b)',overflow:'hidden',
                      cursor:hasAction?'pointer':'default',textAlign:'left',
                      fontFamily:"'Outfit',sans-serif",padding:0,
                      transition:'transform .15s,box-shadow .15s',
                      boxShadow:'0 2px 8px rgba(0,0,0,.04)',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${m.color}28`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)';}}>
                    {/* Color band */}
                    <div style={{height:64,background:`linear-gradient(135deg,${m.color}cc,${m.color})`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',flexShrink:0}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.13) 1px,transparent 1px)',backgroundSize:'14px 14px'}}/>
                      <span style={{fontSize:30,position:'relative'}}>{m.icon}</span>
                      {m.level && <span style={{position:'absolute',bottom:6,right:8,background:'rgba(0,0,0,.45)',color:'white',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:6}}>{m.level}</span>}
                      {isInternal && <span style={{position:'absolute',top:6,right:8,background:'rgba(255,255,255,.22)',color:'white',fontSize:8,fontWeight:900,padding:'1px 5px',borderRadius:4,border:'1px solid rgba(255,255,255,.3)'}}>IN APP</span>}
                      {isExtLive && <span style={{position:'absolute',top:6,left:8,background:'#dc2626',color:'white',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:6}}>LIVE ↗</span>}
                    </div>
                    {/* Content */}
                    <div style={{padding:'10px 12px 12px',flex:1,display:'flex',flexDirection:'column'}}>
                      <div style={{fontSize:12,fontWeight:800,color:'var(--heading)',lineHeight:1.3,marginBottom:4}}>{m.name}</div>
                      <div style={{fontSize:10,color:'var(--subtext)',lineHeight:1.45,flex:1}}>
                        {m.desc.length > 58 ? m.desc.substring(0,55)+'…' : m.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Spotify section under Music */}
            {cat === 'music' && (
              <div style={{marginTop:14,padding:'16px 14px 20px',borderRadius:14,background:'linear-gradient(180deg,rgba(30,215,96,.05) 0%,rgba(30,215,96,.02) 100%)',border:'1px solid rgba(30,215,96,.15)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <div style={{width:32,height:32,borderRadius:10,background:'#1ed760',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🎵</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:900,color:'var(--heading)'}}>Croatian Music on Spotify</div>
                    <div style={{fontSize:11,color:'var(--subtext)'}}>14 curated playlists · tap to expand</div>
                  </div>
                </div>
                <SpotifyPlaylists/>
              </div>
            )}
          </div>
        );
      })}
    </React.Fragment>
  );
}
