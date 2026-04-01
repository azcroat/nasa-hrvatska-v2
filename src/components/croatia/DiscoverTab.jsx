import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// ── Daily Croatian phrases ────────────────────────────────────────────────────
const DAILY_PHRASES = [
  { hr: 'Kako si?', en: 'How are you?', note: 'Informal — use with friends and family' },
  { hr: 'Hvala lijepa!', en: 'Thank you very much!', note: 'Warmer than plain "hvala"' },
  { hr: 'Gdje je more?', en: 'Where is the sea?', note: 'Essential for any trip to Dalmatia' },
  { hr: 'Koliko košta?', en: 'How much does it cost?', note: 'Markets, restaurants, everywhere' },
  { hr: 'Jedna kava, molim.', en: 'One coffee, please.', note: 'The most Croatian sentence there is' },
  { hr: 'Lijepo je ovdje.', en: 'It\'s beautiful here.', note: 'You\'ll say this constantly in Croatia' },
  { hr: 'Idemo na plažu!', en: 'Let\'s go to the beach!', note: 'Summer vocabulary — critical' },
  { hr: 'Dobar tek!', en: 'Enjoy your meal!', note: 'Said before eating — like "bon appétit"' },
  { hr: 'Živjeli!', en: 'Cheers!', note: 'For rakija, wine, or pivo (beer)' },
  { hr: 'Nema problema.', en: 'No problem.', note: 'The Croatian spirit in two words' },
  { hr: 'Polako, ali sigurno.', en: 'Slowly but surely.', note: 'A saying — and a way of life' },
  { hr: 'Stvarno lijepo.', en: 'Truly beautiful.', note: 'Genuine appreciation, not just polite' },
  { hr: 'Gdje stanujete?', en: 'Where do you live?', note: 'Formal — for new acquaintances' },
  { hr: 'Učim hrvatski.', en: 'I am learning Croatian.', note: 'Guaranteed to make any Croatian smile' },
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
  const dailyPhrase = DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length];
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
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: 16, margin: '0 0 16px' }}>
        <img
          src={heroCity.src}
          alt={heroCity.alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroCity.pos }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.65) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', fontFamily: "'Playfair Display',serif", textShadow: '0 2px 8px rgba(0,0,0,.5)', marginBottom: 2 }}>
            {heroCity.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>
            {heroCity.subtitle}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: 'rgba(255,255,255,.45)', background: 'rgba(0,0,0,.35)', borderRadius: 6, padding: '2px 6px' }}>
          {heroCity.credit}
        </div>
      </div>

      {/* ── DAILY PHRASE ── */}
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--card-b)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          🗓️ Phrase of the Day
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>
          "{dailyPhrase.hr}"
        </div>
        <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 6 }}>{dailyPhrase.en}</div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', opacity: 0.75 }}>{dailyPhrase.note}</div>
      </div>

      {/* ── DID YOU KNOW ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-b)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          💡 Did You Know?
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{dailyFact.emoji}</span>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.6 }}>{dailyFact.fact}</div>
        </div>
      </div>

      {/* ── FEATURED STORY PREVIEW ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => { const el = document.querySelector('[data-ctab="stories"]'); if (el) el.click(); }}
        style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 16px', marginBottom: 12, cursor: 'pointer' }}
      >
        <div style={{ fontSize: 10, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          💌 Letters from Baka
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#451a03', marginBottom: 4 }}>Baka Marija piše...</div>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
          "Drago moje unuče, kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su procvjetali u vrtu..."
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>Read the full letter → Stories tab ↗</div>
      </div>

      {/* ── HRVOJE COMPANION — rotating contextual messages ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 16px', background: 'var(--card)',
        border: '1px solid var(--card-b)', borderRadius: 16, marginBottom: 12,
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

      {/* ── PHOTO VOCAB SCANNER ── */}
      <button
        onClick={() => setScr('photo_vocab')}
        style={{ width: '100%', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,#164e63,#0e7490)', boxShadow: '0 4px 16px rgba(14,116,144,.3)' }}
      >
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>📷</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.65)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>AI · CAMERA</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Photo Vocabulary Scanner</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.4 }}>Point your camera at menus, signs or labels — learn the Croatian words instantly.</div>
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,.6)' }}>→</div>
        </div>
      </button>

    </div>
  );
}
