import React, { useState, useRef, useEffect } from 'react';
import { H, MEDIA, getCityOfDay, incrementCulture, getProverbOfDay, getHistFact } from '../../data.jsx';
import PhotoHero from '../shared/PhotoHero';
import { PHOTOS } from '../../lib/photos';
import CroatianKnight from '../shared/CroatianKnight';

const LEVEL_COLORS = {A1:'#16a34a',A2:'#65a30d',B1:'#ca8a04',B2:'#b45309',C1:'#0e7490',C2:'#7c3aed'}; // TODO: move to CSS vars
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
    { id:'37i9dQZF1DZ06evO2GzzZj', name:'This Is Oliver Dragojević', desc:'The soul of Dalmatia — all the classics', icon:'🎤', color:'var(--info-dark, #0369a1)', tag:'Legend' },
    { id:'37i9dQZF1DZ06evO3UANd2', name:'This Is Prljavo Kazalište', desc:"Croatia's greatest rock band — essential listening", icon:'🎸', color:'var(--error)', tag:'Rock' },
    { id:'5OPhthDiArDJMPQfTKIYCn', name:'Thompson', desc:'Patriotic Croatian rock — Marko Perković Thompson', icon:'🇭🇷', color:'var(--error)', tag:'Patriotic' },
    { id:'37i9dQZF1EIUUk1h0TA16K', name:'Crvena Jabuka Mix', desc:'Timeless Croatian pop-rock from the 80s & 90s', icon:'🍎', color:'#e11d48', tag:'Pop/Rock' },
    { id:'5pFl9Ll0hBYydQPEVkMJsQ', name:'Magazin', desc:"Croatia's beloved pop group — hits spanning 4 decades", icon:'💫', color:'var(--lavender, #9333ea)', tag:'Pop' },
    { id:'37i9dQZF1E4zd1TBgRl9w6', name:'Klapa', desc:'UNESCO-listed Dalmatian choral tradition', icon:'🎶', color:'#0891b2', tag:'Traditional' },
  ],
  genres: [
    { id:'1iqFmUPFuPpBVgvrWccMVW', name:'Croatian Music 2025', desc:'The freshest Croatian tracks right now', icon:'⚡', color:'#059669', tag:'New Music' },
    { id:'1iFnviT7aGiPqpCpNT2hYy', name:'Croatian Hip Hop', desc:'The best of the hrvatski rap scene', icon:'🎤', color:'#6d28d9', tag:'Rap' },
    { id:'2J4UX2zKunR9uRkaAYLbgs', name:'Ljetni Hitovi', desc:"Croatia's biggest summer bangers", icon:'☀️', color:'#d97706', tag:'Summer' },
    { id:'0SFU1J9KaRmtPT5T1Ou6KN', name:'Ultra Europe 2025', desc:"The sound of Split's legendary festival", icon:'🎉', color:'var(--lavender, #7c3aed)', tag:'Festival' },
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

Jučer sam napravila sarmu — baš onako kako si ti volio kad si bio mali. Stavila sam puno riže i malo više paprike, jer znam da ti se sviđa ljuto.

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
    <div style={{
      borderRadius: 14, overflow: 'hidden', marginBottom: 8,
      background: isOpen ? 'var(--card)' : 'var(--bar-bg)',
      border: `1px solid ${isOpen ? 'rgba(30,215,96,.35)' : 'rgba(30,215,96,.15)'}`,
      transition: 'border-color .2s',
    }}>
      <button
        onClick={() => setOpenId(isOpen ? null : pl.id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
        }}
      >
        {/* Icon band */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg,${pl.color}cc,${pl.color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: `0 4px 12px ${pl.color}40`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute',top:0,left:0,right:0,bottom:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.15) 1px,transparent 1px)',backgroundSize:'10px 10px' }}/>
          <span style={{ position: 'relative' }}>{pl.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'white' }}>{pl.name}</span>
            <span style={{
              background: 'rgba(30,215,96,.18)', color: '#1ed760',
              fontSize: 9, fontWeight: 800, padding: '2px 7px',
              borderRadius: 20, border: '1px solid rgba(30,215,96,.3)',
              letterSpacing: '0.04em', flexShrink: 0,
            }}>{pl.tag}</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,.5)', lineHeight: 1.4 }}>{pl.desc}</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isOpen ? 'rgba(30,215,96,.2)' : 'rgba(255,255,255,.07)',
          border: `1px solid ${isOpen ? 'rgba(30,215,96,.4)' : 'rgba(255,255,255,.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isOpen ? '#1ed760' : 'rgba(255,255,255,.4)',
          fontSize: 14, transition: 'all .2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>⌄</div>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid rgba(30,215,96,.2)' }}>
          <iframe
            src={`https://open.spotify.com/embed/playlist/${pl.id}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; storage-access"
            loading="lazy"
            style={{ display: 'block' }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(30,215,96,.06)',
            borderTop: '1px solid rgba(30,215,96,.15)',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,.4)' }}>Not loading? Open directly in Spotify.</span>
            <a
              href={`https://open.spotify.com/playlist/${pl.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', background: '#1ed760',
                borderRadius: 20, fontSize: 'var(--text-xs)',
                fontWeight: 800, color: '#000', textDecoration: 'none', flexShrink: 0,
              }}
            >Open in Spotify ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}

function SpotifyPlaylists() {
  const [openId, setOpenId] = useState(null);
  const groups = [
    { label: '🎤 Croatian Icons', key: 'icons' },
    { label: '🎧 Genres & Moods', key: 'genres' },
    { label: '🗺️ By Region', key: 'regions' },
  ];
  return (
    <div>
      {groups.map(({ label, key }) => (
        <div key={key}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            letterSpacing: '.12em', textTransform: 'uppercase',
            marginBottom: 8, marginTop: key === 'icons' ? 0 : 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 16, height: 1, background: 'rgba(30,215,96,.4)' }}/>
            {label}
            <div style={{ flex: 1, height: 1, background: 'rgba(30,215,96,.15)' }}/>
          </div>
          {SPOTIFY_PLAYLISTS[key].map(pl => (
            <SpotifyCard key={pl.id} pl={pl} openId={openId} setOpenId={setOpenId} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Q-4: Removed dead state setters — target screens manage their own state.
export default function CroatiaTab({ setScr, sCurEx, award }) {
  const cats = ["tv","music","film","sport","podcast","culture"];
  const city = getCityOfDay();
  const proverb = getProverbOfDay();
  const histFact = getHistFact();
  const [activeStream, setActiveStream] = useState(null);
  const [activeMediaCat, setActiveMediaCat] = useState("tv");
  const [openLetter, setOpenLetter] = useState(null);
  const [expandedCtx, setExpandedCtx] = useState({});
  const toggleCtx = (key) => setExpandedCtx(prev => ({ ...prev, [key]: !prev[key] }));
  const [ctab, setCTab] = useState('discover');
  const [mediaFilter, setMediaFilter] = useState('all');

  return (
    <React.Fragment>
      {/* ── TAB HERO — always visible ── */}
      <div className="tab-hero">
        <div className="tab-hero-stripe" />
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.025) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 8s linear infinite',pointerEvents:'none'}} />
        <div className="tab-hero-body">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontSize:36,lineHeight:1}}>🇭🇷</span>
            <div>
              <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.45)',letterSpacing:'.16em',textTransform:'uppercase',marginBottom:3}}>Life in Croatia</div>
              <div style={{fontSize:26,fontWeight:900,color:'white',fontFamily:"'Playfair Display',serif",lineHeight:1.1,textShadow:'0 2px 16px rgba(0,0,0,.4)'}}>Naša Hrvatska</div>
            </div>
          </div>
          <div style={{fontSize:'var(--text-sm)',color:'rgba(255,255,255,.58)',lineHeight:1.5,fontWeight:500}}>
            Culture, history, daily life &amp; immersion
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
            {['🏰 History','🎵 Culture','📰 Stories','🌊 Immersion'].map(t=>(
              <span key={t} style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.55)',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:20,padding:'4px 10px'}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div style={{ display:'flex', gap:8, padding:'4px 0 16px', overflowX:'auto', scrollbarWidth:'none' }}>
        {[
          { id:'discover', label:'🗓️ Discover' },
          { id:'culture',  label:'🏰 Culture' },
          { id:'media',    label:'🎵 Media' },
          { id:'stories',  label:'📖 Stories' },
        ].map(t => (
          <button key={t.id} onClick={() => setCTab(t.id)} style={{
            padding:'7px 16px', borderRadius:20, border:'none', flexShrink:0,
            background: ctab === t.id ? 'var(--info)' : 'var(--bar-bg)',
            color: ctab === t.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap',
            transition:'background 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          DISCOVER TAB
      ══════════════════════════════════════════ */}
      {ctab === 'discover' && (
        <React.Fragment>
          {/* ── PHOTO HERO ── */}
          <PhotoHero
            src={PHOTOS.dubrovnik}
            alt="Dubrovnik old town"
            title="Naša Hrvatska"
            subtitle="Culture, history & language — all in one place"
            height={180}
            style={{marginBottom: 20}}
          />

          {/* ── KNIGHT WELCOME BANNER ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--card)', borderRadius: 12, margin: '0 0 12px' }}>
            <CroatianKnight size={44} mood="happy" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--heading)', display: 'block', marginBottom: 2 }}>Dobrodošli u Hrvatsku! 🇭🇷</strong>
              Explore culture, music, stories & language from the homeland.
            </div>
          </div>

          {/* ── CITY OF THE DAY ── */}
          <button style={{marginBottom:16,borderRadius:16,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.1)",width:"100%",border:"none",cursor:"pointer",padding:0,textAlign:"left"}} onClick={()=>{ incrementCulture('cityCnt'); if (award) award(3); setScr("cityofday"); }}>
            <div style={{background:"linear-gradient(135deg,"+city.color+"dd,"+city.color+")",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36,flexShrink:0}}>{city.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'var(--text-xs)',fontWeight:800,color:"rgba(255,255,255,.75)",letterSpacing:"0.08em",marginBottom:3}}>🗓️ CITY OF THE DAY</div>
                <div style={{fontSize:17,fontWeight:900,color:"white",lineHeight:1.2,display:'flex',alignItems:'center',gap:8}}>
                  <CroatianKnight size={36} mood="thinking" style={{ flexShrink: 0 }} />
                  {city.name}
                </div>
                <div style={{fontSize:'var(--text-xs)',color:"rgba(255,255,255,.75)",marginTop:2}}>{city.region} &nbsp;·&nbsp; <span style={{fontStyle:"italic"}}>"{city.tagline}"</span></div>
              </div>
              <div style={{fontSize:20,opacity:.7,color:"white"}}>→</div>
            </div>
            <div style={{background:"rgba(0,0,0,.55)",padding:"7px 16px",fontSize:'var(--text-xs)',color:"rgba(255,255,255,.65)"}}>
              New city every day · {city.facts.length} facts · {city.vocab.length} words to learn
            </div>
          </button>

          {/* ── PROVERB OF THE DAY ── */}
          <div style={{
            background:'var(--card)', border:'1px solid var(--card-b)',
            borderRadius:14, padding:'14px 16px', marginBottom:12,
            borderLeft:'3px solid #b45309',
          }}>
            <div style={{fontSize:10,fontWeight:900,color:'#b45309',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>📜 Proverb of the Day</div>
            <div style={{fontSize:'var(--text-sm)',fontWeight:800,color:'var(--heading)',marginBottom:4,lineHeight:1.4}}>{proverb.hr}</div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',fontStyle:'italic',lineHeight:1.4}}>{proverb.en}</div>
          </div>

          {/* ── HISTORICAL FACT OF THE DAY ── */}
          <div style={{
            background:'var(--card)', border:'1px solid var(--card-b)',
            borderRadius:14, padding:'14px 16px', marginBottom:16,
            borderLeft:'3px solid var(--lavender, #7c3aed)',
          }}>
            <div style={{fontSize:10,fontWeight:900,color:'var(--lavender, #7c3aed)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>📅 Did You Know?</div>
            <div style={{fontSize:'var(--text-sm)',fontWeight:800,color:'var(--heading)',marginBottom:4,lineHeight:1.4}}>{histFact.hr}</div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',fontStyle:'italic',lineHeight:1.4}}>{histFact.en}</div>
          </div>
        </React.Fragment>
      )}

      {/* ══════════════════════════════════════════
          CULTURE TAB
      ══════════════════════════════════════════ */}
      {ctab === 'culture' && (
        <React.Fragment>
          {/* ── HISTORY & REGIONS ── */}
          <PhotoHero
            src={PHOTOS.adriatic}
            alt="Dalmatian coast"
            title="🗺️ History & Regions"
            subtitle="Explore Croatia's rich cultural heritage"
            height={120}
            style={{marginBottom: 16, borderRadius: 12}}
          />
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(212,0,48,.12)'}}>🏰</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">History &amp; Regions</div>
                <div className="section-hdr-sub">Journey through Croatia's past and places</div>
              </div>
              <div className="section-hdr-badge">12 entries</div>
            </div>
            <div
              onClick={() => { if (!expandedCtx['history']) incrementCulture('regionCnt'); toggleCtx('history'); }}
              style={{
                fontSize:12, color:'var(--info)', cursor:'pointer',
                marginBottom: !!expandedCtx['history'] ? 0 : 12,
                display:'flex', alignItems:'center', gap:4, fontWeight:600
              }}
            >
              {!!expandedCtx['history'] ? '▲' : '▼'} Why this matters for your Croatian
            </div>
            {!!expandedCtx['history'] && (
              <div style={{
                fontSize:12, color:'var(--subtext)', lineHeight:1.6,
                padding:'10px 14px', background:'var(--info-bg)',
                borderRadius:10, marginBottom:12, border:'1px solid var(--info-b)'
              }}>
                🏰 <strong>Croatian history</strong> is woven into everyday conversation. References to the Domovinski Rat, Vukovar, and the medieval kings are part of how Croatians identify themselves. Understanding this context makes your Croatian feel genuine and earns respect from native speakers.
              </div>
            )}
            <div className="g2" style={{ gap:8 }}>
              {[
                [()=>{setScr("history");},"🇭🇷","Domovinski Rat","1991–1995 Homeland War","#dc2626","history"],
                [()=>setScr("region_vukovar"),"🕯️","Vukovar","Hero city — a deep dive","#dc2626","history"],
                [()=>{setScr("kings");sCurEx("kings");},"👑","Croatian Kings","Medieval dynasty","#b45309","history"],
                [()=>setScr("region_zagreb"),"🏛️","Zagreb","Croatia's capital","#0e7490","history"],
                [()=>setScr("region_split"),"🌊","Split","Rome on the Adriatic","#0284c7","history"],
                [()=>setScr("region_mostar"),"🌉","Mostar","The bridge reborn","var(--lavender, #7c3aed)","history"],
                [()=>setScr("region_tomislavgrad"),"👑","Tomislavgrad","Where the kingdom was born","#b45309","history"],
                [()=>setScr("region_knin"),"🏰","Knin","Liberated August 5, 1995","#dc2626","history"],
                [()=>setScr("region_labin"),"⛵","Labin & Rabac","Our home in Istria","#0e7490","history"],
                [()=>setScr("region_bibinje"),"🏖️","Bibinje & Zadar","Dalmatian gateway","#0284c7","history"],
                [()=>setScr("region_hercegovina"),"⚔️","Hercegovina","Croatian heritage","#b45309","history"],
                [()=>setScr("region_vinkovci"),"🏛️","Vinkovci","8,300 years of history","#78716c","history"],
              ].map((/** @type {any} */ [fn,icon,title,sub,color,type],i) => (
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
                    <span style={{
                      display:'inline-block', fontSize:9, fontWeight:800, padding:'2px 6px',
                      borderRadius:4, textTransform:'uppercase', letterSpacing:'0.06em',
                      marginTop:4,
                      background:'rgba(124,58,237,0.1)',
                      color:'var(--lavender, #7c3aed)',
                    }}>
                      {type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── NATURE & HERITAGE (Croatian Life) ── */}
          <PhotoHero
            src={PHOTOS.market}
            alt="Croatian market"
            title="🇭🇷 Croatian Life"
            subtitle="Daily customs, food, family & traditions"
            height={100}
            style={{marginBottom: 16, borderRadius: 12}}
          />
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(22,163,74,.12)'}}>🏘️</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Croatian Life</div>
                <div className="section-hdr-sub">Everyday vocabulary for real situations</div>
              </div>
              <div className="section-hdr-badge">12 topics</div>
            </div>
            <div className="g2" style={{ gap:8 }}>
              {[
                [()=>setScr("grocery"),"🛒","Grocery Shopping","Supermarket vocab","#16a34a","interactive"],
                [()=>{setScr("recipes");},"🍳","Croatian Recipes","Traditional dishes","#b45309","reading"],
                [()=>{setScr("roleplay");},"🎭","Role-Play","Real-life conversations","var(--lavender, #7c3aed)","interactive"],
                [()=>setScr("school"),"🏫","School Kit","For parents & students","#0e7490","language"],
                [()=>setScr("texting"),"📱","Texting & Slang","How Croatians text","var(--lavender, #7c3aed)","language"],
                [()=>setScr("friends"),"🤝","Making Friends","Social life","#16a34a","interactive"],
                [()=>setScr("foodorder"),"🍕","Ordering Food","Restaurants & cafés","#b45309","interactive"],
                [()=>setScr("transport"),"🚌","Transport","Buses, taxis & trams","#0284c7","language"],
                [()=>setScr("emergency"),"🚨","Emergency","Essential phrases","#dc2626","language"],
                [()=>setScr("practical"),"💼","Practical Life","Banks, doctors, admin","#78716c","language"],
                [()=>setScr("basketball"),"🏀","At Basketball","Croatian basketball","#b45309","culture"],
                [()=>setScr("gym"),"🏋️","At the Gym","Fitness vocabulary","#16a34a","language"],
              ].map((/** @type {any} */ [fn,icon,title,sub,color,type],i) => (
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
                    <span style={{
                      display:'inline-block', fontSize:9, fontWeight:800, padding:'2px 6px',
                      borderRadius:4, textTransform:'uppercase', letterSpacing:'0.06em',
                      marginTop:4,
                      background: type === 'interactive' ? 'rgba(14,116,144,0.1)' :
                                  type === 'reading' ? 'rgba(22,163,74,0.1)' :
                                  type === 'history' ? 'rgba(124,58,237,0.1)' : 'rgba(217,119,6,0.1)',
                      color: type === 'interactive' ? 'var(--info)' :
                             type === 'reading' ? 'var(--forest, #16a34a)' :
                             type === 'history' ? 'var(--lavender, #7c3aed)' : 'var(--harvest, #d97706)',
                    }}>
                      {type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── STORIES & NEWS ── */}
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>📰</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Stories &amp; News</div>
                <div className="section-hdr-sub">Live the language through real Croatian stories</div>
              </div>
            </div>
            <div className="g3" style={{ gap:10 }}>
              <button onClick={() => setScr("baka_summer")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(245,158,11,.3)', background:'rgba(245,158,11,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
                <span style={{
                  display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px',
                  borderRadius:4, background:'#dc2626', color:'white',
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  position:'absolute', top:8, right:8,
                }}>NEW</span>
                <div style={{ fontSize:26, marginBottom:6 }}>📖</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--warning)' }}>Baka's Summer</div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--warning)', marginTop:2, opacity:.75 }}>16-chapter story</div>
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
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🌊</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Immersion</div>
                <div className="section-hdr-sub">AI conversation + curated media from A1 to C2</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={() => setScr("aiconvo")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(99,102,241,.3)', background:'rgba(99,102,241,.07)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🤖</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>AI Conversations</div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>50 scenarios · all levels</div>
              </button>
              <button onClick={() => setScr("immersion")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(14,116,144,.3)', background:'rgba(14,116,144,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🌊</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--info)' }}>Immersion Hub</div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--info)', marginTop:2, opacity:.75 }}>A1 → C2 pathway</div>
              </button>
            </div>
          </div>

          {/* ── LANGUAGE & CULTURE ── */}
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(124,58,237,.12)'}}>🎭</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Language &amp; Culture</div>
                <div className="section-hdr-sub">Deepen your connection to Croatian identity</div>
              </div>
              <div className="section-hdr-badge">4 topics</div>
            </div>
            <div
              onClick={() => { if (!expandedCtx['kafic']) incrementCulture('regionCnt'); toggleCtx('kafic'); }}
              style={{
                fontSize:12, color:'var(--info)', cursor:'pointer',
                marginBottom: !!expandedCtx['kafic'] ? 0 : 12,
                display:'flex', alignItems:'center', gap:4, fontWeight:600
              }}
            >
              {!!expandedCtx['kafic'] ? '▲' : '▼'} Why this matters for your Croatian
            </div>
            {!!expandedCtx['kafic'] && (
              <div style={{
                fontSize:12, color:'var(--subtext)', lineHeight:1.6,
                padding:'10px 14px', background:'var(--info-bg)',
                borderRadius:10, marginBottom:12, border:'1px solid var(--info-b)'
              }}>
                ☕ <strong>U Kafiću</strong> (At the Café) is where Croatian social life happens. Croatians spend hours in kafići — it's not just coffee, it's connection. Mastering café vocabulary and small talk unlocks the most natural everyday conversations you'll ever have.
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { icon:'☕', title:'U Kafiću', desc:'The art of Croatian coffee culture', accent:'rgba(245,158,11,.25)', scr:'kafic' },
                { icon:'💙', title:'Diaspora Croatian', desc:'Code-switching & heritage language', accent:'rgba(14,116,144,.25)', scr:'diaspora' },
                { icon:'🎊', title:'Life Events', desc:'Weddings, funerals, baptisms', accent:'rgba(124,58,237,.25)', scr:'lifeevents' },
                { icon:'🏛️', title:'Civic Croatian', desc:'Vocabulary to read the news', accent:'rgba(22,163,74,.25)', scr:'civic' },
              ].map(c => (
                <button key={c.scr} className="tc"
                  style={{ textAlign:'center', padding:'16px 12px' }}
                  onClick={() => setScr(c.scr)}>
                  <div style={{ width:48, height:48, borderRadius:14, background:c.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 8px' }}>{c.icon}</div>
                  <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', lineHeight:1.2, marginBottom:4 }}>{c.title}</div>
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.3 }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── EXPLORE CROATIA ── */}
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(14,116,144,.12)'}}>🗺️</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Explore Croatia</div>
                <div className="section-hdr-sub">Cities, parks, beaches &amp; islands</div>
              </div>
            </div>
            <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px",width:"100%"}} onClick={() => { setScr("crmap"); }}>
              <div style={{fontSize:36}}>🗺️</div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"var(--heading)"}}>Interactive Map &amp; Directions</div>
                <div style={{fontSize:'var(--text-sm)',color:"var(--subtext)"}}>Explore Croatia — cities, parks, beaches, islands</div>
              </div>
            </button>
          </div>
        </React.Fragment>
      )}

      {/* ══════════════════════════════════════════
          MEDIA TAB
      ══════════════════════════════════════════ */}
      {ctab === 'media' && (
        <React.Fragment>
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

          {/* ─── MEDIA FILTER PILLS ────────────────────────── */}
          <div style={{ display:'flex', gap:8, padding:'4px 0 16px', overflowX:'auto', scrollbarWidth:'none' }}>
            {[
              { id:'all',     label:'🎯 All' },
              { id:'tv',      label:'📺 TV' },
              { id:'music',   label:'🎵 Music' },
              { id:'film',    label:'🎬 Film' },
              { id:'sport',   label:'⚽ Sport' },
              { id:'podcast', label:'🎙️ Podcast' },
              { id:'culture', label:'🎭 Culture' },
            ].map(f => (
              <button key={f.id} onClick={() => setMediaFilter(f.id)} style={{
                padding:'7px 14px', borderRadius:20, border:'none', flexShrink:0,
                background: mediaFilter === f.id ? '#D40030' : 'var(--bar-bg)',
                color: mediaFilter === f.id ? '#fff' : 'var(--subtext)',
                fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
                transition:'background 0.2s',
              }}>{f.label}</button>
            ))}
          </div>

          {/* ─── SPOTIFY PLAYLISTS ─────────────────────────── */}
          {(mediaFilter === 'all' || mediaFilter === 'music') && (
            <div style={{
              marginBottom:24, padding:'18px 14px 20px', borderRadius:16,
              background:'var(--card)',
              border:'1px solid rgba(30,215,96,.2)',
              boxShadow:'0 4px 20px rgba(0,0,0,.3)',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{
                  width:40,height:40,borderRadius:12,background:'#1ed760',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:20,flexShrink:0,boxShadow:'0 4px 12px rgba(30,215,96,.4)',
                }}>🎵</div>
                <div>
                  <div style={{fontSize:15,fontWeight:900,color:'white'}}>Croatian Music on Spotify</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.45)',marginTop:1}}>14 curated playlists · tap to expand</div>
                </div>
              </div>
              <SpotifyPlaylists/>
            </div>
          )}

          {/* ─── LIVE RADIO ────────────────────────────────── */}
          {mediaFilter === 'all' && (
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
          )}

          {/* ─── CONTENT CATEGORIES ─────────────────────────── */}
          {[
            {cat:'tv',     emoji:'📺', title:'TV & News',         accent:'#0e7490',  noStream:false},
            {cat:'music',  emoji:'🎵', title:'Music',              accent:'var(--lavender, #9333ea)',  noStream:true},
            {cat:'film',   emoji:'🎬', title:'Film & Video',       accent:'#b91c1c',  noStream:false},
            {cat:'sport',  emoji:'⚽', title:'Sport',              accent:'#1d4ed8',  noStream:false},
            {cat:'podcast',emoji:'🎙️',title:'Podcasts & Audio',   accent:'#16a34a',  noStream:false},
            {cat:'culture',emoji:'🌍', title:'Culture & Press',    accent:'var(--lavender, #7c3aed)',  noStream:false},
          ].map(({cat,emoji,title,accent,noStream}) => {
            if (mediaFilter !== 'all' && mediaFilter !== cat) return null;
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
                        onClick={() => { if (m.scr || m.web) { incrementCulture('mediaCnt'); if (award) award(3); } if (m.scr) setScr(m.scr); else if (m.web) window.open(m.web,'_blank','noopener,noreferrer'); }}
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
              </div>
            );
          })}
        </React.Fragment>
      )}

      {/* ══════════════════════════════════════════
          STORIES TAB
      ══════════════════════════════════════════ */}
      {ctab === 'stories' && (
        <React.Fragment>
          {/* ── LETTERS FROM BAKA ── */}
          <div className="section-block">
            <div className="section-hdr">
              <div className="section-hdr-icon" style={{background:'rgba(200,152,10,.14)'}}>💌</div>
              <div className="section-hdr-text">
                <div className="section-hdr-title">Letters from Baka</div>
                <div className="section-hdr-sub">Read Croatian the way family really writes it</div>
              </div>
              <CroatianKnight size={40} mood="happy" style={{ flexShrink: 0 }} />
            </div>
            <div style={{fontSize:12, color:'var(--subtext)', marginBottom:12, lineHeight:1.5}}>
              Personal letters written in authentic Croatian — perfect for understanding how family members actually speak, including regional expressions and emotional vocabulary.
            </div>
            <div
              onClick={() => { if (!expandedCtx['baka']) incrementCulture('regionCnt'); toggleCtx('baka'); }}
              style={{
                fontSize:12, color:'var(--info)', cursor:'pointer',
                marginBottom: !!expandedCtx['baka'] ? 0 : 12,
                display:'flex', alignItems:'center', gap:4, fontWeight:600
              }}
            >
              {!!expandedCtx['baka'] ? '▲' : '▼'} Why this matters for your Croatian
            </div>
            {!!expandedCtx['baka'] && (
              <div style={{
                fontSize:12, color:'var(--subtext)', lineHeight:1.6,
                padding:'10px 14px', background:'var(--info-bg)',
                borderRadius:10, marginBottom:12, border:'1px solid var(--info-b)'
              }}>
                💌 <strong>Baka's letters</strong> capture authentic Croatian as it's actually written between family members — warm, informal, full of dialect and emotion. This is the Croatian you won't find in textbooks, but will hear and read with your family.
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {BAKA_LETTERS.map(letter => (
                <div key={letter.id} style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:14, overflow:'hidden' }}>
                  <button
                    onClick={() => { const opening = openLetter !== letter.id; setOpenLetter(opening ? letter.id : null); if (opening) { incrementCulture('bakaCnt'); if (award) award(5); } }}
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
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
