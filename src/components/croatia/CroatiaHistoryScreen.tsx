import React, { useState, useRef } from 'react';
import { H, speak } from '../../data';
import { HISTORY } from '../../data';

function HimnaPlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  }

  function fmt(s: number) {
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  return (
    <div
      className="c"
      style={{
        marginTop: 24,
        borderLeft: '4px solid #dc2626',
        background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
        padding: '20px',
      }}
    >
      <audio
        ref={ref}
        src="/audio/bojna-cavoglave-v3.m4a"
        preload="metadata"
        onLoadedMetadata={() => {
          if (ref.current) {
            setDuration(ref.current.duration);
            setLoaded(true);
          }
        }}
        onTimeUpdate={() => {
          const a = ref.current;
          if (a) {
            setCurrent(a.currentTime);
            setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrent(0);
          if (ref.current) ref.current.currentTime = 0;
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setError(true);
          setLoaded(false);
        }}
      />
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: '#991b1b',
          letterSpacing: '0.07em',
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        🎵 The Sound of the Homeland War
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#7f1d1d',
              fontFamily: "'Playfair Display',serif",
            }}
          >
            Bojna Čavoglave
          </div>
          <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600, marginTop: 3 }}>
            Marko Perković Thompson · 1991
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#44403c', lineHeight: 1.7, marginBottom: 10 }}>
        Written by Thompson while defending his village of Čavoglave in the Drniš area of
        Dalmatinska zagora, recorded on a cassette tape and passed hand-to-hand among soldiers and
        civilians. It became the battle himna of the Homeland War — sung in trenches, at funerals,
        and at the liberation of Knin on August 5, 1995.
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#44403c',
          lineHeight: 1.7,
          marginBottom: 16,
          padding: '10px 14px',
          background: 'rgba(185,28,28,.06)',
          borderRadius: 10,
        }}
      >
        <strong style={{ color: '#991b1b' }}>Why "Thompson"?</strong> During the war, Marko Perković
        carried a <em>Thompson M1A1</em> — the iconic American submachine gun, the same "Tommy gun"
        used in World War II and familiar to Croatian fighters who had inherited or acquired
        WWII-era surplus weapons. His fellow soldiers started calling him by the name of the gun he
        never put down. He kept the nickname as his stage name, and Marko Perković Thompson has been
        known simply as <em>Thompson</em> ever since.
      </div>
      {error ? (
        <div style={{ fontSize: 12, color: '#991b1b', fontStyle: 'italic' }}>
          ⚠️ Audio unavailable.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            aria-label={playing ? 'Pause Bojna Čavoglave' : 'Play Bojna Čavoglave'}
            onClick={toggle}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              border: 'none',
              color: 'white',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(185,28,28,.4)',
            }}
          >
            <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>
          </button>
          <div style={{ flex: 1 }}>
            <div
              onClick={seek}
              style={{ padding: '8px 0', cursor: 'pointer', position: 'relative', marginBottom: 2 }}
            >
              <div
                style={{
                  height: 6,
                  background: 'rgba(185,28,28,.2)',
                  borderRadius: 6,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: progress + '%',
                    background: 'linear-gradient(90deg,#dc2626,#991b1b)',
                    borderRadius: 6,
                    transition: 'width .15s linear',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#991b1b',
                fontWeight: 700,
              }}
            >
              <span>{fmt(current)}</span>
              <span>{loaded ? fmt(duration) : 'loading…'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CroatiaHistoryScreen({ goBack }: { goBack?: () => void }) {
  return (
    <div className="scr-wrap">
      {H('🇭🇷 ' + HISTORY.title, HISTORY.subtitle, goBack)}
      <div
        className="c"
        style={{
          marginBottom: 20,
          borderLeft: '4px solid #dc2626',
          background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
        }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#1c1917' }}>{HISTORY.intro}</div>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#dc2626',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Timeline
      </div>
      {HISTORY.timeline.map(function (e, i) {
        return (
          <div
            key={i}
            className="c"
            style={{
              marginBottom: 12,
              borderLeft: '4px solid ' + (i < 3 ? '#f59e0b' : i < 5 ? '#dc2626' : '#16a34a'),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{e.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309' }}>{e.year}</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#164e63',
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {e.title}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#44403c' }}>{e.text}</p>
          </div>
        );
      })}
      <h3 className="sh" style={{ marginTop: 24 }}>
        🏅 Key Figures
      </h3>
      {HISTORY.heroes.map(function (h, i) {
        return (
          <div key={i} className="c" style={{ marginBottom: 10, padding: '14px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#164e63' }}>{h.name}</div>
            <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginBottom: 4 }}>
              {h.role}
            </div>
            <div style={{ fontSize: 13, color: '#44403c' }}>{h.desc}</div>
          </div>
        );
      })}
      <h3 className="sh" style={{ marginTop: 24 }}>
        📅 Key Dates to Remember
      </h3>
      {HISTORY.keyDates.map(function (d, i) {
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid rgba(0,0,0,.05)',
            }}
          >
            <div style={{ minWidth: 140, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
              {d[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{d[1]}</div>
              <div style={{ fontSize: 12, color: '#78716c' }}>{d[2]}</div>
            </div>
          </div>
        );
      })}
      <h3 className="sh" style={{ marginTop: 24 }}>
        📝 Homeland War Vocabulary
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {HISTORY.vocabulary.map(function (v, i) {
          return (
            <button
              key={i}
              aria-label={`Play audio for ${v[0]}`}
              className="c"
              style={{ padding: '10px 14px' }}
              onClick={function () {
                speak(v[0] ?? '');
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
                {v[0]} <span aria-hidden="true">🔊</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{v[1]}</div>
            </button>
          );
        })}
      </div>
      <div
        className="c"
        style={{
          marginTop: 24,
          textAlign: 'center',
          borderLeft: '4px solid #dc2626',
          background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#991b1b',
            fontFamily: "'Playfair Display',serif",
            fontStyle: 'italic',
            marginBottom: 8,
          }}
        >
          {HISTORY.quote}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#b91c1c',
            fontFamily: "'Playfair Display',serif",
            fontStyle: 'italic',
          }}
        >
          {HISTORY.quote2}
        </div>
      </div>
      <HimnaPlayer />
    </div>
  );
}

export default CroatiaHistoryScreen;
