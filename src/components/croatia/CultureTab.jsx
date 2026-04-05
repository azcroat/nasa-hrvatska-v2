import React, { useState } from 'react';
import { incrementCulture } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import PhotoHero from '../shared/PhotoHero';
import { PHOTOS } from '../../lib/photos';

export default function CultureTab({ sCurEx }) {
  const { setScr } = useApp();
  const [expandedCtx, setExpandedCtx] = useState({});
  const toggleCtx = (key) => setExpandedCtx(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <React.Fragment>
      {/* ── HISTORY & REGIONS ── */}
      <div id="section-history" />
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
            <div className="section-hdr-title" role="heading" aria-level="2">History &amp; Regions</div>
            <div className="section-hdr-sub">Journey through Croatia's past and places</div>
          </div>
          <div className="section-hdr-badge">12 entries</div>
        </div>
        <div
          onClick={() => { if (!expandedCtx['history']) incrementCulture('regionCnt'); toggleCtx('history'); }}
          style={{
            fontSize:12, color:'var(--info)', cursor:'pointer',
            marginBottom: expandedCtx['history'] ? 0 : 12,
            display:'flex', alignItems:'center', gap:4, fontWeight:600
          }}
        >
          {expandedCtx['history'] ? '▲' : '▼'} Why this matters for your Croatian
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
              className="exercise-card"
              style={{ borderLeftColor: color, border: `1.5px solid ${color}25`, borderLeftWidth: 3 }}
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
      <div id="section-life" />
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
            <div className="section-hdr-title" role="heading" aria-level="2">Croatian Life</div>
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
              className="exercise-card"
              style={{ borderLeftColor: color, border: `1.5px solid ${color}25`, borderLeftWidth: 3 }}
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
            <div className="section-hdr-title" role="heading" aria-level="2">Stories &amp; News</div>
            <div className="section-hdr-sub">Live the language through real Croatian stories</div>
          </div>
        </div>
        <button
          onClick={() => setScr("personas")}
          style={{
            width:'100%', padding:'18px 20px', borderRadius:16,
            border:'2px solid rgba(212,0,48,.35)',
            background:'linear-gradient(135deg, rgba(212,0,48,.07) 0%, rgba(212,0,48,.03) 100%)',
            cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
            position:'relative', marginBottom:12, display:'flex', alignItems:'center', gap:16
          }}
        >
          {/* LIVE badge */}
          <span style={{
            display:'inline-block', fontSize:9, fontWeight:900, padding:'3px 7px', borderRadius:4,
            background:'#D4002D', color:'white', textTransform:'uppercase', letterSpacing:'0.08em',
            position:'absolute', top:10, right:12
          }}>AI · VOICE</span>

          {/* Avatar row — 4 small avatars */}
          <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
            <div style={{ display:'flex', gap:-6 }}>
              {[
                { src:'/images/portraits/tutor-hero.webp', emoji:'👩‍🏫', color:'#D4002D' },
                { src:'/images/portraits/fisherman.webp',  emoji:'⛵',   color:'#0284c7' },
                { src:'/images/portraits/mature-woman.webp', emoji:'💼', color:'#7c3aed' },
                { src:'/images/portraits/grandmother.webp', emoji:'👵',   color:'#b45309' },
              ].map(({ src, emoji, color }, i) => (
                <div
                  key={i}
                  style={{
                    width:32, height:32, borderRadius:'50%',
                    border:`2px solid ${color}`, overflow:'hidden',
                    marginLeft: i > 0 ? -8 : 0,
                    background: color + '22',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, flexShrink:0,
                  }}
                >
                  <img
                    src={src} alt=""
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display='none'; const p = /** @type {HTMLElement} */ (e.currentTarget.parentNode); if (p) p.innerText=emoji; }}
                  />
                </div>
              ))}
            </div>
            <span style={{ fontSize:9, color:'var(--subtext)', textAlign:'center' }}>4 personas</span>
          </div>

          {/* Text content */}
          <div>
            <div style={{ fontSize:17, fontWeight:900, color:'#D4002D', marginBottom:3 }}>Razgovaraj s Hrvatima →</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)', marginBottom:4 }}>Choose from 4 conversation partners</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              Maja · Marko · Ana · Baka Mara · Voice-to-voice AI
            </div>
          </div>
        </button>
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
          <button onClick={() => setScr("postcard")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(124,58,237,.3)', background:'rgba(124,58,237,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
            <span style={{ display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:4, background:'#7c3aed', color:'white', textTransform:'uppercase', letterSpacing:'0.06em', position:'absolute', top:8, right:8 }}>AI</span>
            <div style={{ fontSize:26, marginBottom:6 }}>📮</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#7c3aed' }}>Postcard</div>
            <div style={{ fontSize:'var(--text-xs)', color:'#7c3aed', marginTop:2, opacity:.75 }}>Write & share in Croatian</div>
          </button>
          <button onClick={() => setScr("storymode")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(14,116,144,.3)', background:'rgba(14,116,144,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
            <span style={{ display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:4, background:'#0e7490', color:'white', textTransform:'uppercase', letterSpacing:'0.06em', position:'absolute', top:8, right:8 }}>AI</span>
            <div style={{ fontSize:26, marginBottom:6 }}>📖</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--info)' }}>Immersive Stories</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--info)', marginTop:2, opacity:.75 }}>AI stories set in Croatia</div>
          </button>
          <button onClick={() => setScr("heritage")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(180,83,9,.3)', background:'rgba(180,83,9,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
            <span style={{ display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:4, background:'#b45309', color:'white', textTransform:'uppercase', letterSpacing:'0.06em', position:'absolute', top:8, right:8 }}>AI</span>
            <div style={{ fontSize:26, marginBottom:6 }}>🧬</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#b45309' }}>Your Heritage</div>
            <div style={{ fontSize:'var(--text-xs)', color:'#b45309', marginTop:2, opacity:.75 }}>Discover your Croatian roots</div>
          </button>
          <button onClick={() => setScr("croatianews")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(3,105,161,.3)', background:'rgba(3,105,161,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
            <span style={{ display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:4, background:'#0369a1', color:'white', textTransform:'uppercase', letterSpacing:'0.06em', position:'absolute', top:8, right:8 }}>AI</span>
            <div style={{ fontSize:26, marginBottom:6 }}>🗞️</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#0369a1' }}>Croatian News</div>
            <div style={{ fontSize:'var(--text-xs)', color:'#0369a1', marginTop:2, opacity:.75 }}>Real news at your level</div>
          </button>
          <button onClick={() => setScr("phraseofday")} style={{ padding:'14px 12px', borderRadius:14, border:'1.5px solid rgba(219,39,119,.3)', background:'rgba(219,39,119,.06)', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
            <span style={{ display:'inline-block', fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:4, background:'#db2777', color:'white', textTransform:'uppercase', letterSpacing:'0.06em', position:'absolute', top:8, right:8 }}>AI</span>
            <div style={{ fontSize:26, marginBottom:6 }}>💬</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#db2777' }}>Phrase of the Day</div>
            <div style={{ fontSize:'var(--text-xs)', color:'#db2777', marginTop:2, opacity:.75 }}>Daily cultural expressions</div>
          </button>
          {/* Only show during Easter season (March 20 - April 30) and only if not yet completed */}
          {(() => {
            const m = new Date().getMonth() + 1, d = new Date().getDate();
            const isEaster = (m === 3 && d >= 20) || (m === 4 && d <= 30);
            if (!isEaster) return null;
            const done = localStorage.getItem('nh_uskrs_kviz_done') === '1' ||
              (localStorage.getItem('nh_cq_easter_uskrs_q1') === '1' &&
               localStorage.getItem('nh_cq_easter_uskrs_q2') === '1' &&
               localStorage.getItem('nh_cq_easter_uskrs_q3') === '1');
            if (done) return null;
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
            <div className="section-hdr-title" role="heading" aria-level="2">Immersion</div>
            <div className="section-hdr-sub">AI conversation + curated media from A1 to C2</div>
          </div>
        </div>
        {/* Live Tutor — featured premium card */}
        <button
          onClick={() => setScr("live_tutor")}
          style={{
            width:'100%', padding:'16px', marginBottom:10,
            borderRadius:14, cursor:'pointer', textAlign:'left',
            border:'1.5px solid rgba(212,0,45,.35)',
            background:'linear-gradient(135deg,rgba(212,0,45,.07),rgba(212,0,45,.03))',
            fontFamily:"'Outfit',sans-serif",
            display:'flex', alignItems:'center', gap:14,
          }}
        >
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(212,0,45,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🎙️</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:900, color:'#D4002D', marginBottom:2 }}>Live Croatian Tutor</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.4 }}>Speak Croatian live with an AI tutor — adapts to your level</div>
          </div>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'#D4002D', flexShrink:0 }}>→</div>
        </button>
        {/* AI Voice Conversation — prominent featured card */}
        <button
          onClick={() => setScr("aiconvo")}
          style={{
            width:'100%', border:'none', cursor:'pointer', padding:0,
            borderRadius:16, overflow:'hidden',
            background:'linear-gradient(135deg,#0f0c29,#1a1654,#3730a3)',
            boxShadow:'0 4px 18px rgba(55,48,163,.35)',
            marginBottom:10, fontFamily:"'Outfit',sans-serif",
          }}
        >
          <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:46, height:46, borderRadius:13, flexShrink:0,
              background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.25)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
            }}>🎙️</div>
            <div style={{ flex:1, textAlign:'left' }}>
              <div style={{ fontSize:9, fontWeight:900, color:'rgba(165,180,252,.9)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:2 }}>SIGNATURE FEATURE</div>
              <div style={{ fontSize:14, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:2 }}>AI Voice Conversation</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', lineHeight:1.4 }}>47 real-life scenarios · speak Croatian now</div>
            </div>
            <div style={{
              flexShrink:0, background:'rgba(255,255,255,.18)',
              border:'1px solid rgba(255,255,255,.3)',
              borderRadius:9, padding:'5px 11px',
              fontSize:11, fontWeight:800, color:'#fff',
            }}>Start →</div>
          </div>
        </button>
        <button onClick={() => setScr("immersion")} style={{ width:'100%', padding:'13px 14px', borderRadius:14, border:'1.5px solid rgba(14,116,144,.3)', background:'rgba(14,116,144,.06)', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif", display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>🌊</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--info)' }}>Immersion Hub</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--info)', opacity:.75 }}>A1 → C2 pathway</div>
          </div>
          <span style={{ fontSize:14, color:'var(--info)', opacity:.6 }}>→</span>
        </button>
      </div>

      {/* ── LANGUAGE & CULTURE ── */}
      <div className="section-block">
        <div className="section-hdr">
          <div className="section-hdr-icon" style={{background:'rgba(124,58,237,.12)'}}>🎭</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title" role="heading" aria-level="2">Language &amp; Culture</div>
            <div className="section-hdr-sub">Deepen your connection to Croatian identity</div>
          </div>
          <div className="section-hdr-badge">4 topics</div>
        </div>
        <div
          onClick={() => { if (!expandedCtx['kafic']) incrementCulture('regionCnt'); toggleCtx('kafic'); }}
          style={{
            fontSize:12, color:'var(--info)', cursor:'pointer',
            marginBottom: expandedCtx['kafic'] ? 0 : 12,
            display:'flex', alignItems:'center', gap:4, fontWeight:600
          }}
        >
          {expandedCtx['kafic'] ? '▲' : '▼'} Why this matters for your Croatian
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
            <div className="section-hdr-title" role="heading" aria-level="2">Explore Croatia</div>
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
  );
}
