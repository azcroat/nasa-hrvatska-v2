import React, { useState } from 'react';

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
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>{pl.name}</span>
            <span style={{
              background: '#1ed760', color: '#000',
              fontSize: 9, fontWeight: 800, padding: '2px 7px',
              borderRadius: 20, border: '1px solid rgba(30,215,96,.3)',
              letterSpacing: '0.04em', flexShrink: 0,
            }}>{pl.tag}</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', lineHeight: 1.4 }}>{pl.desc}</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isOpen ? 'rgba(30,215,96,.2)' : 'rgba(255,255,255,.07)',
          border: `1px solid ${isOpen ? 'rgba(30,215,96,.4)' : 'rgba(255,255,255,.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--subtext)',
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
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>Not loading? Open directly in Spotify.</span>
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

export default function SpotifySection() {
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
            color: 'var(--subtext)',
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
