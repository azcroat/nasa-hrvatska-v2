// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { MEDIA, incrementCulture } from '../../data';
import { useApp } from '../../context/AppContext';
import SpotifySection from './SpotifySection';
import ImmersionStreak from './ImmersionStreak';
import RadioPlayer from './RadioPlayer';
import MediaDetailDrawer from './MediaDetailDrawer';
import { getGoalPersonalization, sortMediaForGoal, tagMediaForGoal } from './MediaPlayerUtils';
import { openUrl } from '../../lib/platform.ts';

// ── Persistent "recently used" tracking ──────────────────────────────────────
function getRecentMedia() {
  try { return JSON.parse(localStorage.getItem('nh_media_used') || '{}'); } catch { return {}; }
}
function markMediaUsed(name) {
  try {
    const used = getRecentMedia();
    used[name] = Date.now();
    localStorage.setItem('nh_media_used', JSON.stringify(used));
  } catch {}
}

// ── Goal → Today's Pick preference order ─────────────────────────────────────
const GOAL_CAT_PREF = {
  heritage: ['music', 'culture'],
  family:   ['music', 'culture'],
  travel:   ['tv', 'podcast'],
  culture:  ['film', 'culture'],
  fluent:   ['podcast', 'tv'],
  partner:  ['music', 'culture'],
  '':       ['tv', 'music', 'podcast'],
};

function getTodaysPicks(goal) {
  const preferred = GOAL_CAT_PREF[goal] || GOAL_CAT_PREF[''];
  const usable = MEDIA.filter(m => !m.stream && (m.scr || m.web) && preferred.includes(m.cat));
  const sorted = sortMediaForGoal(usable, goal);
  // Rotate picks daily so they feel fresh
  const offset = new Date().getDate() % Math.max(sorted.length, 1);
  const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];
  return rotated.slice(0, 3);
}

// ── Genre vocabulary (Lingopie-style: learn words through media context) ─────
const GENRE_VOCAB = {
  tv: [
    { hr: 'vijesti', en: 'news' }, { hr: 'voditeljica', en: 'presenter (f)' },
    { hr: 'emisija', en: 'show / programme' }, { hr: 'prilog', en: 'report / segment' },
    { hr: 'prognoza', en: 'forecast' }, { hr: 'gledati', en: 'to watch' },
  ],
  music: [
    { hr: 'pjesma', en: 'song' }, { hr: 'pjevač', en: 'singer (m)' },
    { hr: 'glazba', en: 'music' }, { hr: 'stih', en: 'lyric / verse' },
    { hr: 'klapa', en: 'Dalmatian a cappella group' }, { hr: 'ritam', en: 'rhythm' },
  ],
  film: [
    { hr: 'film', en: 'film / movie' }, { hr: 'glumac', en: 'actor (m)' },
    { hr: 'redatelj', en: 'director (m)' }, { hr: 'scena', en: 'scene' },
    { hr: 'titl', en: 'subtitle' }, { hr: 'nagrade', en: 'awards' },
  ],
  sport: [
    { hr: 'utakmica', en: 'match / game' }, { hr: 'gol', en: 'goal' },
    { hr: 'igrač', en: 'player (m)' }, { hr: 'pobjednik', en: 'winner (m)' },
    { hr: 'liga', en: 'league' }, { hr: 'navijač', en: 'fan / supporter' },
  ],
  podcast: [
    { hr: 'epizoda', en: 'episode' }, { hr: 'domaćin', en: 'host (m)' },
    { hr: 'gost', en: 'guest' }, { hr: 'razgovor', en: 'conversation' },
    { hr: 'tema', en: 'topic / theme' }, { hr: 'slušati', en: 'to listen' },
  ],
  culture: [
    { hr: 'kultura', en: 'culture' }, { hr: 'tradicija', en: 'tradition' },
    { hr: 'baština', en: 'heritage' }, { hr: 'festival', en: 'festival' },
    { hr: 'povijest', en: 'history' }, { hr: 'umjetnost', en: 'art' },
  ],
};

// ── Category config ───────────────────────────────────────────────────────────
const CAT_ORDER = ['tv', 'music', 'film', 'sport', 'podcast', 'culture'];
const CAT_META = {
  tv:      { emoji: '📺', title: 'TV & News',        accent: '#0e7490' },
  music:   { emoji: '🎵', title: 'Music',             accent: '#9333ea' },
  film:    { emoji: '🎬', title: 'Film & Video',      accent: '#b91c1c' },
  sport:   { emoji: '⚽', title: 'Sport',             accent: '#1d4ed8' },
  podcast: { emoji: '🎙️', title: 'Podcasts & Audio', accent: '#16a34a' },
  culture: { emoji: '🌍', title: 'Culture & Press',  accent: '#7c3aed' },
};

const FILTERS = [
  { id: 'foryou',  label: '✨ For You' },
  { id: 'all',     label: '🎯 All' },
  { id: 'tv',      label: '📺 TV' },
  { id: 'music',   label: '🎵 Music' },
  { id: 'film',    label: '🎬 Film' },
  { id: 'sport',   label: '⚽ Sport' },
  { id: 'podcast', label: '🎙️ Podcast' },
  { id: 'culture', label: '🎭 Culture' },
];

// ── Compact carousel card (140px wide) ───────────────────────────────────────
function CarouselCard({ m, onOpen, goalTag }) {
  return (
    <button
      onClick={onOpen}
      style={{
        flexShrink: 0, width: 140, borderRadius: 14,
        border: '1px solid var(--card-b)', background: 'var(--card)',
        cursor: m.scr || m.web ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        textAlign: 'left', fontFamily: "'Outfit', sans-serif", padding: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'; }}
    >
      <div style={{
        height: 60, flexShrink: 0, position: 'relative',
        background: `linear-gradient(135deg, ${m.color}cc, ${m.color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 24 }}>{m.icon}</span>
        {m.level && (
          <span style={{
            position: 'absolute', bottom: 4, right: 6,
            background: 'rgba(0,0,0,.45)', color: '#fff',
            fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4,
          }}>{m.level}</span>
        )}
        {goalTag && (
          <span style={{
            position: 'absolute', top: 4, left: 5,
            background: 'rgba(212,0,48,.85)', color: '#fff',
            fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 3,
          }}>★ Pick</span>
        )}
      </div>
      <div style={{ padding: '8px 9px 10px', flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.25, marginBottom: 3 }}>
          {(m.name||'').length > 28 ? (m.name||'').slice(0, 26) + '…' : m.name}
        </div>
        <div style={{ fontSize: 9, color: 'var(--subtext)', lineHeight: 1.35 }}>
          {(m.desc||'').length > 52 ? (m.desc||'').slice(0, 50) + '…' : m.desc}
        </div>
      </div>
    </button>
  );
}

// ── Today's Pick card (flexible width, 3 per row) ────────────────────────────
function PickCard({ m, onOpen, isTop }) {
  return (
    <button
      onClick={onOpen}
      style={{
        flex: 1, minWidth: 0, borderRadius: 14,
        border: isTop ? `1.5px solid ${m.color}55` : '1px solid var(--card-b)',
        background: 'var(--card)', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        textAlign: 'left', fontFamily: "'Outfit', sans-serif", padding: 0,
        boxShadow: isTop ? `0 4px 16px ${m.color}22` : '0 2px 8px rgba(0,0,0,.05)',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isTop ? `0 4px 16px ${m.color}22` : '0 2px 8px rgba(0,0,0,.05)'; }}
    >
      <div style={{
        height: 54, flexShrink: 0, position: 'relative',
        background: `linear-gradient(135deg, ${m.color}cc, ${m.color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 22 }}>{m.icon}</span>
        {isTop && (
          <span style={{
            position: 'absolute', top: 4, left: 6,
            background: 'rgba(255,255,255,.28)', color: '#fff',
            fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 4,
          }}>🌟 TOP</span>
        )}
      </div>
      <div style={{ padding: '7px 9px 9px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.25, marginBottom: 2 }}>
          {(m.name||'').length > 22 ? (m.name||'').slice(0, 20) + '…' : m.name}
        </div>
        <div style={{ fontSize: 9, color: 'var(--subtext)', lineHeight: 1.3 }}>
          {(m.desc||'').length > 40 ? (m.desc||'').slice(0, 38) + '…' : m.desc}
        </div>
      </div>
    </button>
  );
}

// ── Expanded 2-col grid card ──────────────────────────────────────────────────
function GridCard({ m, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex', flexDirection: 'column', background: 'var(--card)',
        borderRadius: 14, border: '1px solid var(--card-b)', overflow: 'hidden',
        cursor: m.scr || m.web ? 'pointer' : 'default',
        textAlign: 'left', fontFamily: "'Outfit',sans-serif", padding: 0,
        transition: 'transform .15s, box-shadow .15s',
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${m.color}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; }}
    >
      <div style={{
        height: 64, background: `linear-gradient(135deg,${m.color}cc,${m.color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.13) 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
        <span style={{ fontSize: 28, position: 'relative' }}>{m.icon}</span>
        {m.level && <span style={{ position: 'absolute', bottom: 5, right: 7, background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 5px', borderRadius: 5 }}>{m.level}</span>}
      </div>
      <div style={{ padding: '9px 11px 11px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.3, marginBottom: 3 }}>{m.name}</div>
        <div style={{ fontSize: 10, color: 'var(--subtext)', lineHeight: 1.4, flex: 1 }}>
          {(m.desc||'').length > 55 ? (m.desc||'').slice(0, 52) + '…' : m.desc}
        </div>
      </div>
    </button>
  );
}

export default function MediaTab() {
  const { setScr, award } = useApp();
  const [activeStream, setActiveStream] = useState(null);
  const [mediaFilter, setMediaFilter] = useState('foryou');
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [drawerItem, setDrawerItem] = useState(null);
  // Incremented when an item is opened, to refresh the "Continue" row
  const [recentVersion, setRecentVersion] = useState(0);
  const userGoal = getGoalPersonalization();

  const recentMedia = useMemo(() => {
    const used = getRecentMedia();
    return Object.entries(used)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => MEDIA.find(m => m.name === name))
      .filter(Boolean);

  }, [recentVersion]);

  const todaysPicks = useMemo(() => getTodaysPicks(userGoal), [userGoal]);

  const openItem = useCallback((m) => {
    // Track engagement
    if (m.scr || m.web || m.ytId || m.stream) {
      incrementCulture('mediaCnt');
      if (award) award(3);
      markMediaUsed(m.name);
      setRecentVersion(v => v + 1);
    }

    // Internal screen navigation (football vocab, pop culture, etc.)
    if (m.scr) { setScr(m.scr); return; }

    // Items with an embedded player (YouTube or radio stream) → open drawer
    if (m.ytId || m.stream) { setDrawerItem(m); return; }

    // External links → open in native browser via @capacitor/browser
    // (Chrome Custom Tabs on Android, SFSafariViewController on iOS)
    if (m.web) { openUrl(m.web); return; }
  }, [setScr, award]);

  function toggleExpand(cat) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  // How many carousel items to show before "See all" in each filter mode
  const carouselMax = mediaFilter === 'foryou' ? 3 : 6;

  const catsToShow = (mediaFilter === 'all' || mediaFilter === 'foryou')
    ? CAT_ORDER
    : CAT_ORDER.filter(c => c === mediaFilter);

  return (
    <React.Fragment>
      {/* ─── Media detail drawer ──────────────────────── */}
      {drawerItem && (
        <MediaDetailDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          activeStream={activeStream}
          setActiveStream={setActiveStream}
        />
      )}

      {/* ─── Hero ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg,#060e1e 0%,#071830 50%,#0a2a50 100%)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 18,
        position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#D40030 0%,#D40030 50%,#F8F6F2 50%,#F8F6F2 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.035) 50%,transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 6s linear infinite', pointerEvents: 'none' }} />
        <div style={{ padding: '18px 20px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.45)', letterSpacing: '.18em', textTransform: 'uppercase' }}>LIVE FROM CROATIA</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white', fontFamily: "'Playfair Display',serif", lineHeight: 1.1, marginBottom: 8, textShadow: '0 2px 20px rgba(0,0,0,.5)' }}>
            Tune In to Croatia
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['📡 Live', '📺 TV', '🎵 Music', '⚽ Sport', '🎬 Film'].map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.55)', background: 'rgba(255,255,255,.07)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(255,255,255,.1)' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── IMMERSION STREAK ──────────────────────────── */}
      <ImmersionStreak />

      {/* ─── CONTINUE — recently used ──────────────────── */}
      {recentMedia.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
            ↩ Continue
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 }}>
            {recentMedia.map((m, i) => (
              <CarouselCard key={i} m={m} onOpen={() => openItem(m)} goalTag={null} />
            ))}
          </div>
        </div>
      )}

      {/* ─── TODAY'S PICK ──────────────────────────────── */}
      {todaysPicks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
            ✨ Today&apos;s Pick{userGoal ? ` · for ${userGoal}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {todaysPicks.map((m, i) => (
              <PickCard key={i} m={m} onOpen={() => openItem(m)} isTop={i === 0} />
            ))}
          </div>
        </div>
      )}

      {/* ─── FILTER PILLS ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 0 16px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setMediaFilter(f.id)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
            background: mediaFilter === f.id ? '#D40030' : 'var(--bar-bg)',
            color: mediaFilter === f.id ? '#fff' : 'var(--subtext)',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'background 0.2s', fontFamily: "'Outfit',sans-serif",
          }}>{f.label}</button>
        ))}
      </div>

      {/* ─── LIVE RADIO ────────────────────────────────── */}
      {(mediaFilter === 'all' || mediaFilter === 'foryou') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)', boxShadow: '0 0 8px var(--error)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Streaming Live</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {MEDIA.filter(m => !!m.stream).map((m, i) => (
              <div key={i} style={{
                background: `linear-gradient(175deg,#0c1520 0%,${m.color}40 100%)`,
                borderRadius: 16, overflow: 'hidden', border: `1px solid ${m.color}30`,
                display: 'flex', flexDirection: 'column',
                boxShadow: `0 4px 20px ${m.color}18`,
              }}>
                <div style={{ padding: '14px 10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 2 }}>
                    {m.name.split(' — ')[0].replace(' Live', '').replace(' Radio Live', '').trim()}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', lineHeight: 1.3, marginBottom: 6 }}>{m.level}</div>
                </div>
                <div style={{ padding: '0 8px 10px' }}>
                  <RadioPlayer src={m.stream} color={m.color} streamId={m.name} activeStream={activeStream} setActiveStream={setActiveStream} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SPOTIFY ───────────────────────────────────── */}
      {(mediaFilter === 'all' || mediaFilter === 'foryou' || mediaFilter === 'music') && (
        <div style={{ marginBottom: 24, padding: '16px 14px 18px', borderRadius: 16, background: 'var(--card)', border: '1px solid rgba(30,215,96,.2)', boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#1ed760', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 4px 12px rgba(30,215,96,.4)' }}>🎵</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--heading)' }}>Croatian Music on Spotify</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>14 curated playlists · tap to expand</div>
            </div>
          </div>
          <SpotifySection />
        </div>
      )}

      {/* ─── CONTENT CATEGORIES — horizontal carousels ── */}
      {catsToShow.map(cat => {
        const meta = CAT_META[cat];
        if (!meta) return null;
        const rawItems = MEDIA.filter(m => m.cat === cat && !m.stream);
        if (!rawItems.length) return null;
        const items = sortMediaForGoal(rawItems, userGoal);
        const isExpanded = expandedCats.has(cat);
        const showCount = carouselMax;
        const carouselItems = isExpanded ? items : items.slice(0, showCount);
        const hasMore = items.length > showCount;

        return (
          <div key={cat} style={{ marginBottom: 24, animation: 'nh-fade-in .35s ease both' }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              padding: '8px 12px', borderRadius: 10,
              background: `${meta.accent}0f`, borderLeft: `3px solid ${meta.accent}`,
            }}>
              <span style={{ fontSize: 16 }}>{meta.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--heading)', flex: 1 }}>{meta.title}</span>
              {userGoal && <span style={{ fontSize: 9, color: 'var(--subtext)', fontStyle: 'italic' }}>sorted for you</span>}
              <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, background: 'var(--bar-bg)', borderRadius: 8, padding: '2px 7px' }}>{items.length}</span>
            </div>

            {/* Genre vocabulary strip (Lingopie-style) */}
            {GENRE_VOCAB[cat] && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 8, marginBottom: 2 }}>
                {GENRE_VOCAB[cat].map(({ hr, en }) => (
                  <div key={hr} style={{
                    flexShrink: 0, borderRadius: 20, padding: '4px 11px',
                    background: `${meta.accent}12`, border: `1px solid ${meta.accent}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: meta.accent, fontStyle: 'italic' }}>{hr}</span>
                    <span style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 600 }}>{en}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Carousel row */}
            {!isExpanded ? (
              <div style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 4 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {carouselItems.map((m, i) => (
                    <CarouselCard
                      key={i} m={m}
                      onOpen={() => openItem(m)}
                      goalTag={tagMediaForGoal(m, userGoal)}
                    />
                  ))}
                  {/* "See all" sentinel card */}
                  {hasMore && (
                    <button
                      onClick={() => toggleExpand(cat)}
                      style={{
                        flexShrink: 0, width: 96, borderRadius: 14,
                        border: `1.5px dashed ${meta.accent}50`,
                        background: `${meta.accent}07`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', gap: 4,
                        fontFamily: "'Outfit', sans-serif", padding: 12,
                      }}
                    >
                      <span style={{ fontSize: 22, color: meta.accent }}>›</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: meta.accent, textAlign: 'center', lineHeight: 1.3 }}>
                        See all<br />{items.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Expanded 2-column grid */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }} className="nh-stagger">
                  {items.map((m, i) => (
                    <GridCard key={i} m={m} onOpen={() => openItem(m)} />
                  ))}
                </div>
                <button
                  onClick={() => toggleExpand(cat)}
                  style={{
                    width: '100%', padding: '9px', borderRadius: 10,
                    border: `1px solid ${meta.accent}30`, background: 'transparent',
                    color: meta.accent, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}
                >↑ Show less</button>
              </>
            )}
          </div>
        );
      })}
    </React.Fragment>
  );
}
