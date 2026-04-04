import React from 'react';
import { speak } from '../../data.jsx';

// Daily rotating Croatian landmarks — verified Unsplash + local CC photos only
const DAILY_SCENES = [
  { url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85&fit=crop&auto=format', label: 'Rovinj, Istra',          pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=1200&q=85&fit=crop&auto=format', label: 'Split, Dalmacija',       pos: 'center 40%' },
  { url: '/images/scenes/plitvice.webp',                                                                label: 'Plitvička Jezera',       pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=1200&q=85&fit=crop&auto=format', label: 'Hvar, Dalmacija',     pos: 'center 60%' },
  { url: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1200&q=85&fit=crop&auto=format', label: 'Zadar, Dalmacija',    pos: 'center 50%' },
  { url: '/images/scenes/zagreb.webp',                                                                  label: 'Zagreb, Hrvatska',       pos: 'center 45%' },
  { url: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1200&q=85&fit=crop&auto=format', label: 'Korčula, Dalmacija', pos: 'center 55%' },
  { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=85&fit=crop&auto=format', label: 'Pulska Arena, Istra',    pos: 'center 40%' },
  { url: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85&fit=crop&auto=format', label: 'Dalmacija, Hrvatska',    pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1588354918778-9e9f05701f90?w=1200&q=85&fit=crop&auto=format', label: 'Trogir, Dalmacija',  pos: 'center 50%' },
  { url: '/images/scenes/labin.webp',                                                                   label: 'Labin, Istra',           pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=85&fit=crop&auto=format', label: 'Šibenik, Dalmacija', pos: 'center 45%' },
  { url: '/images/scenes/rabac.webp',                                                                   label: 'Rabac, Istra',           pos: 'center 55%' },
  { url: 'https://images.unsplash.com/photo-1698785820846-35f06c39ced7?w=1200&q=85&fit=crop&auto=format', label: 'Omiš, Dalmacija',    pos: 'center 50%' },
  { url: '/images/scenes/zagreb.webp', label: 'Zagreb, Hrvatska', pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1565116175827-965e73c9be0e?w=1200&q=85&fit=crop&auto=format', label: 'Brač, Dalmacija',    pos: 'center 60%' },
  { url: '/images/scenes/dalmatian-coast.webp',                                                         label: 'Jadranska Obala',        pos: 'center 50%' },
  { url: 'https://images.unsplash.com/photo-1548268770-66184a21657e?w=1200&q=85&fit=crop&auto=format', label: 'Varaždin, Hrvatska',    pos: 'center 45%' },
  { url: 'https://images.unsplash.com/photo-1586161816003-bc944e3c7e27?w=1200&q=85&fit=crop&auto=format', label: 'Makarska, Dalmacija', pos: 'center 55%' },
  { url: '/images/scenes/mostar.webp',                                                                  label: 'Mostar, Hercegovina',    pos: 'center 50%' },
];

function getDailyScene() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return DAILY_SCENES[dayOfYear % DAILY_SCENES.length];
}

export default function DailyCroatianSection({ todayPhrases }) {
  const scene = getDailyScene();

  return (
    <>
      {/* ── DISCOVER CROATIAN HEADER — Daily Croatian Landmark ── */}
      <div style={{
        borderRadius:18, marginBottom:12, maxWidth:'100%',
        height:160, overflow:'hidden', position:'relative',
        boxShadow:'0 4px 24px rgba(0,0,0,.18)',
      }}>
        <img
          src={scene.url}
          alt={scene.label}
          style={{
            width:'100%', height:'100%', objectFit:'cover',
            objectPosition: scene.pos,
            filter:'brightness(1.05) saturate(1.1)',
          }}
          loading="lazy"
        />
        {/* Animated shimmer overlay — golden hour light sweep */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(105deg, transparent 30%, rgba(255,200,60,.07) 50%, transparent 70%)',
          backgroundSize:'200% 100%',
          animation:'heroShimmer 4s ease-in-out infinite',
          pointerEvents:'none',
        }} />
        {/* Vignette */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(0,0,0,.08) 0%, transparent 40%, rgba(0,0,0,.35) 100%)',
          pointerEvents:'none',
        }} />
        {/* Location badge */}
        <div style={{
          position:'absolute', bottom:10, left:12,
          background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)',
          borderRadius:20, padding:'4px 12px',
          fontSize:11, fontWeight:700, color:'rgba(255,255,255,.95)',
          letterSpacing:'.04em', display:'flex', alignItems:'center', gap:5,
        }}>
          <span>📍</span> {scene.label}
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:24}}>
        <div style={{width:3, height:20, background:'var(--color-croatian,#D40030)', borderRadius:2, flexShrink:0}}/>
        <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--font-sans)'}}>Discover Croatian</span>
      </div>

      {/* ── TODAY'S CROATIAN ── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🇭🇷</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Today's Croatian</div>
          <div className="section-hdr-sub">Tap any phrase to hear it spoken aloud</div>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24}}>
        {todayPhrases.map((p, i) => (
          <button
            key={i}
            aria-label={`Play audio for ${p.hr} — ${p.en}`}
            onClick={() => speak(p.hr)}
            style={{
              background:'var(--card)',
              border:'1.5px solid var(--card-b)',
              borderRadius:'var(--radius-lg)',
              padding:'14px 12px',
              textAlign:'left',
              cursor:'pointer',
              boxShadow:'var(--card-shadow)',
              fontFamily:'var(--font-sans)',
              transition:'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
              WebkitTapHighlightColor:'transparent',
              display:'flex',
              flexDirection:'column',
              gap:4,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
              e.currentTarget.style.borderColor = 'rgba(14,116,144,.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
              e.currentTarget.style.borderColor = 'var(--card-b)';
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{
              fontSize:10, fontWeight:800,
              color:'var(--color-croatian,#D40030)',
              textTransform:'uppercase', letterSpacing:'.07em',
              fontFamily:'var(--font-sans)',
              background:'rgba(212,0,48,.07)',
              borderRadius:'var(--radius-sm)',
              padding:'2px 6px',
              display:'inline-block',
              marginBottom:2,
            }}>{p.cat}</span>
            <span style={{
              fontSize:16, fontWeight:700,
              color:'var(--heading)', lineHeight:1.25,
              fontFamily:'var(--font-serif)',
              fontStyle:'italic',
            }}>{p.hr}</span>
            <span style={{fontSize:12, color:'var(--subtext)', fontWeight:500, fontFamily:'var(--font-sans)'}}>{p.en}</span>
            <div style={{
              display:'flex', alignItems:'center', gap:5, marginTop:6,
              padding:'4px 8px',
              background:'var(--accent-light)',
              borderRadius:'var(--radius-full)',
              alignSelf:'flex-start',
            }}>
              <span aria-hidden="true" style={{fontSize:12}}>🔊</span>
              <span style={{fontSize:10, fontWeight:700, color:'var(--accent)', fontFamily:'var(--font-sans)', letterSpacing:'.03em'}}>Slušaj</span>
            </div>
          </button>
        ))}
      </div>

    </>
  );
}
