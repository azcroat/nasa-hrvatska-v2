import React from 'react';
import { speak } from '../../data.jsx';

export default function DailyCroatianSection({ todayPhrases }) {
  return (
    <>
      {/* ── DISCOVER CROATIAN HEADER — Real Croatia Photography ── */}
      <div style={{
        borderRadius:18, marginBottom:12, maxWidth:'100%',
        height:160, overflow:'hidden', position:'relative',
        boxShadow:'0 4px 24px rgba(0,0,0,.18)',
      }}>
        <picture>
          <source srcSet="/images/scenes/dubrovnik-ai.webp" type="image/webp" />
          <img
            src="/images/scenes/dubrovnik-ai.jpg"
            alt="Dubrovnik, Croatia"
            style={{
              width:'100%', height:'100%', objectFit:'cover',
              objectPosition:'center 60%',
              filter:'brightness(1.05) saturate(1.1)',
            }} loading="lazy"
          />
        </picture>
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
          <span>📍</span> Dubrovnik, Hrvatska
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:24}}>
        <div style={{width:3, height:20, background:'var(--color-croatian, #b61800)', borderRadius:2}}/>
        <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Discover Croatian</span>
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
              borderRadius:16,
              padding:'14px 12px',
              textAlign:'left',
              cursor:'pointer',
              boxShadow:'0 2px 8px rgba(0,0,0,.05)',
              fontFamily:"'Outfit',sans-serif",
              transition:'transform .12s, box-shadow .12s',
              WebkitTapHighlightColor:'transparent',
              display:'flex',
              flexDirection:'column',
              gap:4,
            }}
            onPointerDown={e => e.currentTarget.style.transform='scale(0.97)'}
            onPointerUp={e => e.currentTarget.style.transform=''}
            onPointerLeave={e => e.currentTarget.style.transform=''}
          >
            <span style={{fontSize:11, fontWeight:800, color:'var(--color-croatian,#b61800)', textTransform:'uppercase', letterSpacing:'.05em'}}>{p.cat}</span>
            <span style={{fontSize:15, fontWeight:800, color:'var(--heading)', lineHeight:1.3}}>{p.hr}</span>
            <span style={{fontSize:12, color:'var(--subtext)', fontWeight:500}}>{p.en}</span>
            <span aria-hidden="true" style={{marginTop:4, fontSize:16}}>🔊</span>
          </button>
        ))}
      </div>

    </>
  );
}
