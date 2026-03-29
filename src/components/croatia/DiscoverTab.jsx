import React from 'react';
import { getProverbOfDay, getHistFact } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import PhotoHero from '../shared/PhotoHero';
import { PHOTOS } from '../../lib/photos';
import CroatianKnight from '../shared/CroatianKnight';

export default function DiscoverTab() {
  const { setScr } = useApp();
  const proverb = getProverbOfDay();
  const histFact = getHistFact();

  return (
    <React.Fragment>
      {/* ── PHOTO HERO ── */}
      <PhotoHero
        src={PHOTOS.labin}
        alt="Labin hilltop town, Istria"
        title="Naša Hrvatska"
        subtitle="Culture, history & language — all in one place"
        height={180}
        style={{marginBottom: 20}}
        priority={true}
      />

      {/* ── KNIGHT WELCOME BANNER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--card)', borderRadius: 12, margin: '0 0 12px' }}>
        <CroatianKnight size={44} mood="ready" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--heading)', display: 'block', marginBottom: 2 }}>Dobrodošli u Hrvatsku! 🇭🇷</strong>
          Explore culture, music, stories & language from the homeland.
        </div>
      </div>

      {/* ── PHOTO VOCAB SCANNER ── */}
      <button
        onClick={() => setScr('photo_vocab')}
        style={{
          marginBottom:12, width:'100%', border:'none', cursor:'pointer', padding:0,
          borderRadius:16, overflow:'hidden',
          background:'linear-gradient(135deg,#164e63,#0e7490)',
          boxShadow:'0 4px 16px rgba(14,116,144,.35)',
        }}
      >
        <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:36,flexShrink:0}}>📷</div>
          <div style={{flex:1,textAlign:'left'}}>
            <div style={{fontSize:10,fontWeight:900,color:'rgba(255,255,255,.7)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:3}}>NEW · AI FEATURE</div>
            <div style={{fontSize:16,fontWeight:900,color:'#fff',marginBottom:2}}>Photo Vocabulary Scanner</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.75)',lineHeight:1.4}}>Point your camera at anything — menus, signs, labels — and learn the Croatian words instantly.</div>
          </div>
          <div style={{fontSize:20,color:'rgba(255,255,255,.7)'}}>→</div>
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
  );
}
