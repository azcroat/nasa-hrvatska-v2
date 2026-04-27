import React, { useState, useEffect, useRef, useCallback } from 'react';
import DiscoverTab from './DiscoverTab';
import CultureTab from './CultureTab';
import MediaTab from './MediaTab';
import StoriesTab from './StoriesTab';

const ANCHORS = [
  { id: 'section-discover', label: 'Discover', icon: '🌊', cefr: null },
  { id: 'section-history', label: 'History', icon: '🏰', cefr: 'A2+' },
  { id: 'section-life', label: 'Life', icon: '🥘', cefr: 'A1+' },
  { id: 'section-stories', label: 'Stories', icon: '📖', cefr: 'A1–B2' },
  { id: 'section-media', label: 'Media', icon: '🎬', cefr: 'A2–B1' },
];

interface CroatiaTabProps {
  sCurEx: unknown;
}

export default function CroatiaTab({ sCurEx }: CroatiaTabProps) {
  const [activeAnchor, setActiveAnchor] = useState('section-discover');
  const stripRef = useRef<HTMLDivElement | null>(null);

  // Track first-visit for "New" badges on Media and Stories
  const [visited, setVisited] = useState(() => ({
    media: !!localStorage.getItem('nh_visited_media'),
    stories: !!localStorage.getItem('nh_visited_stories'),
  }));

  // IntersectionObserver — highlights the anchor corresponding to the most
  // visible section as the user scrolls
  useEffect(() => {
    const els = ANCHORS.map((a) => document.getElementById(a.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top) setActiveAnchor(top.target.id);
      },
      { threshold: [0.05, 0.2, 0.5], rootMargin: '-48px 0px -45% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback(
    (anchorId: string) => {
      if (anchorId === 'section-media' && !visited.media) {
        try {
          localStorage.setItem('nh_visited_media', '1');
        } catch (_) {}
        setVisited((v) => ({ ...v, media: true }));
      }
      if (anchorId === 'section-stories' && !visited.stories) {
        try {
          localStorage.setItem('nh_visited_stories', '1');
        } catch (_) {}
        setVisited((v) => ({ ...v, stories: true }));
      }
      const el = document.getElementById(anchorId);
      if (!el) return;
      const stripH = (stripRef.current?.offsetHeight ?? 44) + 8;
      // Scroll the window — #main-content has no overflow-y so window is the scroll container
      const top = el.getBoundingClientRect().top + window.pageYOffset - stripH;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [visited],
  );

  return (
    <React.Fragment>
      {/* ── TAB HERO ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(150deg,#8B0010 0%,#B80020 30%,#1a1a3e 65%,#003087 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative',
          boxShadow: '0 8px 40px rgba(0,0,0,.4)',
        }}
      >
        {/* Croatian red-white-blue stripe */}
        <div
          style={{
            height: 5,
            background:
              'linear-gradient(90deg,#D40030 0%,#D40030 33.3%,#ffffff 33.3%,#ffffff 66.6%,#003DA5 66.6%,#003DA5 100%)',
          }}
        />
        {/* Light shimmer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 8s linear infinite',
            pointerEvents: 'none',
          }}
        />
        <div className="tab-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                flexShrink: 0,
                background: 'rgba(255,255,255,.12)',
                border: '1.5px solid rgba(255,255,255,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                boxShadow: '0 4px 16px rgba(0,0,0,.3)',
              }}
            >
              🇭🇷
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,.55)',
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Life in Croatia
              </div>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 900,
                  color: 'white',
                  fontFamily: "'Playfair Display',serif",
                  lineHeight: 1.1,
                  textShadow: '0 2px 20px rgba(0,0,0,.5)',
                }}
              >
                Naša Hrvatska
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'rgba(255,255,255,.65)',
              lineHeight: 1.5,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            Culture, history, daily life &amp; immersion
          </div>
        </div>
      </div>

      {/* ── SECTION ANCHOR STRIP ─────────────────────────────────────────── */}
      <style>{`
        .croatia-anchor-strip::-webkit-scrollbar { display: none; }
        @keyframes nh-new-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.7}}
      `}</style>
      <div
        ref={stripRef}
        className="croatia-anchor-strip"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bar-bg)',
          borderBottom: '1px solid var(--card-b)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          display: 'flex',
          padding: '0 4px',
          gap: 0,
        }}
      >
        {ANCHORS.map((a) => {
          const isActive = activeAnchor === a.id;
          const isNew =
            (a.id === 'section-media' && !visited.media) ||
            (a.id === 'section-stories' && !visited.stories);
          return (
            <button
              key={a.id}
              onClick={() => scrollTo(a.id)}
              style={{
                flexShrink: 0,
                padding: '8px 14px 7px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                borderBottom: isActive ? '3px solid #B80020' : '3px solid transparent',
                transition: 'color .18s, border-color .18s',
                whiteSpace: 'nowrap',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{a.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isActive ? '#B80020' : 'var(--subtext)',
                  letterSpacing: '.01em',
                }}
              >
                {a.label}
              </span>
              {a.cefr && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.03em',
                    color: isActive ? '#B80020' : 'var(--subtext)',
                    opacity: isActive ? 0.9 : 0.6,
                    marginTop: -1,
                  }}
                >
                  {a.cefr}
                </span>
              )}
              {isNew && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '1px solid var(--app-bg)',
                    animation: 'nh-new-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── DISCOVER ─────────────────────────────────────────────────────── */}
      <div id="section-discover">
        <DiscoverTab />
      </div>

      {/* ── HISTORY & LIFE — CultureTab renders both with in-page anchor IDs ── */}
      <CultureTab sCurEx={sCurEx as ((ex: string) => void) | undefined} />

      {/* ── STORIES ───────────────────────────────────────────────────────── */}
      <div id="section-stories">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '20px 0 14px',
            borderTop: '1.5px solid var(--card-b)',
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(22,163,74,.15),rgba(5,150,105,.1))',
              border: '1.5px solid rgba(22,163,74,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            📖
          </div>
          <div>
            <div
              style={{ fontSize: 17, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1 }}
            >
              Stories
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
              Letters from Baka Marija
            </div>
          </div>
        </div>
        <StoriesTab />
      </div>

      {/* ── MEDIA ─────────────────────────────────────────────────────────── */}
      <div id="section-media">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '20px 0 14px',
            borderTop: '1.5px solid var(--card-b)',
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(124,58,237,.15),rgba(91,33,182,.1))',
              border: '1.5px solid rgba(124,58,237,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🎵
          </div>
          <div>
            <div
              style={{ fontSize: 17, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1 }}
            >
              Media
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
              TV, music, film, sport &amp; podcasts
            </div>
          </div>
        </div>
        <MediaTab />
      </div>
    </React.Fragment>
  );
}
