import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { PHOTO_CREDITS } from '../../lib/photos';
import CroatianKnight from '../shared/CroatianKnight';

// ── Rotating hero cities — one per day, 4-day cycle ──────────────────────────
const HERO_CITIES = [
  {
    key: 'labin',
    src: '/images/scenes/labin.webp',
    alt: 'Labin, Istria — medieval hilltop town',
    name: '🏰 Labin, Istra',
    subtitle: 'Medieval hilltop town · first anti-fascist republic in Europe, 1921',
    credit: PHOTO_CREDITS.labin,
    pos: 'center 60%',
  },
  {
    key: 'rabac',
    src: '/images/scenes/rabac.webp',
    alt: 'Rabac, Istria — crystal-clear harbour',
    name: '🌊 Rabac, Istra',
    subtitle: 'The jewel of the Labin Riviera · crystal-clear Adriatic waters',
    credit: PHOTO_CREDITS.rabac,
    pos: 'center center',
  },
  {
    key: 'mostar',
    src: '/images/scenes/mostar.webp',
    alt: 'Mostar, Bosnia-Herzegovina — Stari Most bridge',
    name: '🌉 Mostar, Hercegovina',
    subtitle: 'Stari Most — the Old Bridge rebuilt in 2004 · a symbol of reconciliation',
    credit: PHOTO_CREDITS.mostar,
    pos: 'center 55%',
  },
  {
    key: 'bibinje',
    src: '/images/scenes/bibinje.webp',
    alt: 'Bibinje, Dalmatia — marina on the Adriatic',
    name: '⛵ Bibinje, Dalmacija',
    subtitle: 'Seaside village near Zadar · traditional Dalmatian fishing harbour',
    credit: PHOTO_CREDITS.bibinje,
    pos: 'center center',
  },
  {
    key: 'vinkovci',
    src: '/images/scenes/vinkovci.webp',
    alt: 'Vinkovci, Slavonia — central square',
    name: '🏛️ Vinkovci, Slavonija',
    subtitle: 'Oldest continuously inhabited city in Europe · 8,300+ years of history',
    credit: PHOTO_CREDITS.vinkovci,
    pos: 'center 45%',
  },
];

const DID_YOU_KNOW = [
  { fact: 'The necktie was invented in Croatia. The word "cravat" comes from "Hrvat" — Croatian.', emoji: '👔' },
  { fact: 'Labin declared itself an independent republic in 1921 — the first anti-fascist uprising in Europe.', emoji: '✊' },
  { fact: 'Nikola Tesla was born in Smiljan, Croatia. He rewired how the entire world uses electricity.', emoji: '⚡' },
  { fact: 'The Pula Arena is one of the six largest Roman amphitheatres still standing, built in 27 BC.', emoji: '🏛️' },
  { fact: 'Hvar gets 2,726 sunshine hours per year — more than anywhere else in Europe.', emoji: '☀️' },
  { fact: 'The Dalmatian dog breed is named after Dalmatia, the Croatian coastal region.', emoji: '🐾' },
  { fact: 'Marco Polo was (most likely) born on the island of Korčula, Croatia.', emoji: '⛵' },
  { fact: 'Croatian has been written in the same Gaj script since 1830 — one letter, one sound, always.', emoji: '📜' },
  { fact: 'The Stradun in Dubrovnik was paved in the 13th century and is still the main street today.', emoji: '🏰' },
  { fact: 'Vinkovci is the oldest continuously inhabited town in Europe — over 8,300 years old.', emoji: '🌍' },
];

const KNIGHT_MESSAGES = [
  { mood: 'happy',       text: 'Dobrodošli! New content rotates every day — a fresh city, phrase, and cultural fact just for you.' },
  { mood: 'thinking',    text: 'Try the Stories tab — real letters from Baka Marija. Authentic Croatian the way families actually write.' },
  { mood: 'encouraging', text: 'The Media tab has Croatian music and film. Listening is the fastest path to fluency — don\'t skip it!' },
  { mood: 'ready',       text: 'You can save any word from Baka\'s letters straight to your vocabulary journal. Tap "+ Save word" on any tile.' },
  { mood: 'celebrating', text: 'Svaki dan novi grad! Every day reveals a different Croatian city. Keep coming back.' },
];

export default function DiscoverTab() {
  const { setScr } = useApp();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dailyFact = DID_YOU_KNOW[dayOfYear % DID_YOU_KNOW.length];
  const heroCity = HERO_CITIES[dayOfYear % HERO_CITIES.length];

  // Rotating knight message
  const [kMsgIdx, setKMsgIdx] = useState(0);
  const [kMsgVisible, setKMsgVisible] = useState(true);
  const kTimerRef = useRef(null);
  useEffect(() => {
    kTimerRef.current = setInterval(() => {
      setKMsgVisible(false);
      setTimeout(() => {
        setKMsgIdx(i => (i + 1) % KNIGHT_MESSAGES.length);
        setKMsgVisible(true);
      }, 350);
    }, 5500);
    return () => clearInterval(kTimerRef.current);
  }, []);
   
  const kMsg = KNIGHT_MESSAGES[kMsgIdx];

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ── HERO — Daily rotating city photo ── */}
      <div style={{ position: 'relative', height: 210, overflow: 'hidden', borderRadius: 18, margin: '0 0 16px', boxShadow: '0 6px 24px rgba(0,0,0,.18)' }}>
        <img
          src={heroCity.src}
          alt={heroCity.alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroCity.pos }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.1) 30%, rgba(0,0,0,.7) 100%)' }} />
        {/* Daily badge */}
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontSize: 10, fontWeight: 800, color: 'white',
          background: 'rgba(14,116,144,.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: 20, padding: '4px 10px', letterSpacing: '.08em', textTransform: 'uppercase',
        }}>🗓️ Today's City</div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', fontFamily: "'Playfair Display',serif", textShadow: '0 2px 12px rgba(0,0,0,.6)', marginBottom: 4 }}>
            {heroCity.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500, lineHeight: 1.4 }}>
            {heroCity.subtitle}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, color: 'rgba(255,255,255,.45)', background: 'rgba(0,0,0,.4)', borderRadius: 6, padding: '2px 6px' }}>
          {heroCity.credit}
        </div>
      </div>

      {/* ── DID YOU KNOW ── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(124,58,237,.07),rgba(91,33,182,.04))',
        border: '1.5px solid rgba(124,58,237,.2)',
        borderRadius: 16, padding: '14px 16px', marginBottom: 12,
        boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--lavender,#7c3aed)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Did You Know?</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>{dailyFact.emoji}</span>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.65, fontWeight: 500 }}>{dailyFact.fact}</div>
        </div>
      </div>

      {/* ── FEATURED STORY PREVIEW ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => { const el = document.querySelector('[data-ctab="stories"]'); if (el) el.click(); }}
        style={{
          background: 'linear-gradient(135deg,var(--warning-bg,#fffbeb),rgba(251,191,36,.08))',
          border: '1.5px solid var(--warning-b,#fde68a)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 12, cursor: 'pointer',
          boxShadow: 'var(--card-shadow)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(180,83,9,.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--card-shadow)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>💌</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--warning,#b45309)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Letters from Baka</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            color: 'var(--warning,#b45309)', background: 'var(--warning-bg,#fffbeb)',
            border: '1px solid var(--warning-b,#fde68a)', borderRadius: 20, padding: '2px 8px',
          }}>Stories tab →</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 6, fontFamily: "'Playfair Display',serif" }}>Baka Marija piše...</div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid var(--warning-b,#fde68a)', paddingLeft: 12 }}>
          &ldquo;Drago moje unuče, kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su procvjetali u vrtu...&rdquo;
        </div>
      </div>

      {/* ── HRVOJE COMPANION — rotating contextual messages ── */}
      <div className="c" style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 16px', marginBottom: 12,
      }}>
        <CroatianKnight size={58} mood={kMsg.mood} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>
            Hrvoje kaže
          </div>
          <div style={{
            fontSize: 12, color: 'var(--body)', lineHeight: 1.65,
            opacity: kMsgVisible ? 1 : 0,
            transition: 'opacity .35s ease',
            minHeight: 38,
          }}>
            {kMsg.text}
          </div>
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            { }
            {KNIGHT_MESSAGES.map((_, i) => (
              <div key={i} style={{
                width: i === kMsgIdx ? 14 : 5, height: 5, borderRadius: 3,
                background: i === kMsgIdx ? 'var(--info)' : 'var(--card-b)',
                transition: 'width .35s ease, background .35s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── DIALECT AWARENESS ── */}
      <button
        onClick={() => setScr('dialect_awareness')}
        style={{
          width: '100%', border: 'none', cursor: 'pointer', padding: '16px 18px',
          borderRadius: 18, overflow: 'hidden',
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          boxShadow: '0 4px 20px rgba(37,99,235,.35)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 16,
          transition: 'transform .15s, box-shadow .15s',
          fontFamily: "'Outfit',sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(37,99,235,.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(37,99,235,.35)'; }}
      >
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>🗣️</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.6)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Linguistics · Culture</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 3 }}>Croatian Dialect Explorer</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.72)', lineHeight: 1.4 }}>Što vs Ča vs Kaj — discover the three dialects and where they come from.</div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>

      {/* ── PHOTO VOCAB SCANNER ── */}
      <button
        onClick={() => setScr('photo_vocab')}
        style={{
          width: '100%', border: 'none', cursor: 'pointer', padding: '16px 18px',
          borderRadius: 18, overflow: 'hidden',
          background: 'linear-gradient(135deg,#164e63,#0e7490)',
          boxShadow: '0 4px 20px rgba(14,116,144,.35)',
          display: 'flex', alignItems: 'center', gap: 16,
          transition: 'transform .15s, box-shadow .15s',
          fontFamily: "'Outfit',sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(14,116,144,.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(14,116,144,.35)'; }}
      >
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>📷</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.6)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>AI · Camera</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 3 }}>Photo Vocabulary Scanner</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.72)', lineHeight: 1.4 }}>Point your camera at menus, signs or labels — learn the Croatian words instantly.</div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>

    </div>
  );
}
