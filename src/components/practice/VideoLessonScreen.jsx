import React, { useState, useRef, useEffect } from 'react';
import { speak } from '../../data.jsx';
import VideoBackground from '../shared/VideoBackground.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

// Topic → Croatian scene video key for VideoBackground
const TOPIC_SCENE = {
  cafe: 'food', restaurant: 'food',
  travel: 'dalmatian', weather: 'plitvice',
  sports: 'zagreb', work: 'zagreb', city: 'zagreb', market: 'zagreb',
  family: 'mostar', weekend: 'labin',
};

const TOPICS = [
  { key: 'cafe',       emoji: '☕',  hr: 'U kafiću',      en: 'At the Café',     scene: '/images/scenes/croatian-food.webp' },
  { key: 'market',     emoji: '🛒',  hr: 'Na tržnici',    en: 'At the Market',   scene: '/images/scenes/zagreb.webp' },
  { key: 'family',     emoji: '👨‍👩‍👧', hr: 'Obitelj',       en: 'Family',          scene: '/images/scenes/mostar.webp' },
  { key: 'travel',     emoji: '✈️',  hr: 'Putovanje',     en: 'Travel',          scene: '/images/scenes/dalmatian-coast.webp' },
  { key: 'weather',    emoji: '🌤️', hr: 'Vrijeme',       en: 'Weather',         scene: '/images/scenes/plitvice.webp' },
  { key: 'sports',     emoji: '⚽',  hr: 'Sport',         en: 'Sports',          scene: '/images/scenes/zagreb.webp' },
  { key: 'work',       emoji: '💼',  hr: 'Posao',         en: 'Work',            scene: '/images/scenes/zagreb.webp' },
  { key: 'weekend',    emoji: '🏖️', hr: 'Vikend',        en: 'Weekend',         scene: '/images/scenes/labin.webp' },
  { key: 'restaurant', emoji: '🍽️', hr: 'Restoran',      en: 'Restaurant',      scene: '/images/scenes/croatian-food.webp' },
  { key: 'city',       emoji: '🏙️', hr: 'Grad',          en: 'City',            scene: '/images/scenes/zagreb.webp' },
];

const LEVELS = ['A1','A2','B1','B2','C1','C2'];

export default function VideoLessonScreen({ goBack, award }) {
  const [phase, setPhase]               = useState('setup');   // setup|loading|playing|quiz|result
  const [topic, setTopic]               = useState(null);
  const [level, setLevel]               = useState(() => localStorage.getItem('nh_level') || 'B1');
  const [content, setContent]           = useState(null);
  const [sceneVideoUrl, setSceneVideoUrl] = useState(null);
  const [lines, setLines]               = useState([]);        // flat array of {speaker, text}
  const [currentLine, setCurrentLine]   = useState(-1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [qIndex, setQIndex]             = useState(0);
  const [answers, setAnswers]           = useState([]);
  const [score, setScore]               = useState(0);
  const [xpAwarded, setXpAwarded]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  const mountedRef    = useRef(true);
  const playingRef    = useRef(false);
  const lineIndexRef  = useRef(0);
  const lineTransRef  = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    clearTimeout(lineTransRef.current);
  }, []);

  // Fetch scene video URL from Pexels API.
  // Reset to null on every topic change so no stale video bleeds through,
  // and abort the previous fetch if the user switches topics mid-request.
  useEffect(() => {
    setSceneVideoUrl(null);
    if (!topic) return;
    const sceneKey = TOPIC_SCENE[topic.key] || 'zagreb';
    const storageKey = `nh_scene_video_${sceneKey}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached) { setSceneVideoUrl(cached); return; }
    const controller = new AbortController();
    apiFetch(`/api/scene-video?scene=${sceneKey}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok && data.url) {
          setSceneVideoUrl(data.url);
          try { sessionStorage.setItem(storageKey, data.url); } catch {}
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [topic]);

  async function generate() {
    if (!topic) return;
    setErrorMsg('');
    setPhase('loading');
    try {
      const res = await apiFetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.key, level, style: 'dialogue' }),
      });
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (!mountedRef.current) return;
      setContent(data);

      // Flatten dialogue lines for sequential TTS playback
      const flat = [];
      if (data.speakers) {
        // Interleave lines from both speakers in order
        const maxLines = Math.max(...data.speakers.map(s => s.lines?.length ?? 0));
        for (let i = 0; i < maxLines; i++) {
          for (const spk of data.speakers) {
            if (Array.isArray(spk.lines) && i < spk.lines.length) flat.push({ speaker: spk.name, text: spk.lines[i] });
          }
        }
      } else if (data.narrator) {
        // Split narrator into sentences for line-by-line display
        data.narrator.split(/[.!?]+/).filter(s => s.trim()).forEach(s => {
          flat.push({ speaker: 'Narrator', text: s.trim() + '.' });
        });
      }
      setLines(flat);
      setPhase('playing');
      setCurrentLine(-1);
      setShowTranscript(false);
    } catch (e) {
      if (!mountedRef.current) return;
      const isNetwork = !navigator.onLine || e.message === 'Failed to fetch';
      setErrorMsg(
        isNetwork
          ? "Couldn't reach the server. Check your connection and try again."
          : "Something went wrong generating this lesson. Please try again."
      );
      setPhase('setup');
    }
  }

  // Sequential TTS playback — speak each line, highlight it, advance
  async function playAllLines() {
    if (playingRef.current || lines.length === 0) return;
    playingRef.current = true;
    lineIndexRef.current = 0;

    for (let i = 0; i < lines.length; i++) {
      if (!mountedRef.current || !playingRef.current) break;
      setCurrentLine(i);
      lineIndexRef.current = i;
      // Scroll active line into view (handled by CSS auto-scroll)
      try {
        await speak(lines[i].text);
      } catch {}
      // Brief pause between lines
      await new Promise(r => { lineTransRef.current = setTimeout(r, 400); });
    }

    if (mountedRef.current) {
      setCurrentLine(-1);
      playingRef.current = false;
      // Brief delay then show quiz
      lineTransRef.current = setTimeout(() => {
        if (mountedRef.current) setPhase('quiz');
      }, 800);
    }
  }

  function skipToQuiz() {
    playingRef.current = false;
    clearTimeout(lineTransRef.current);
    setCurrentLine(-1);
    setPhase('quiz');
  }

  function answerQuestion(optIdx) {
    if (!content) return;
    const q = content.questions?.[qIndex];
    if (!q) return;
    const correct = optIdx === q.correct;
    const newAnswers = [...answers, { optIdx, correct }];
    setAnswers(newAnswers);

    if (qIndex + 1 < content.questions.length) {
      setQIndex(qIndex + 1);
    } else {
      const finalScore = newAnswers.filter(a => a.correct).length;
      setScore(finalScore);
      setPhase('result');
      if (!xpAwarded && award) {
        const xp = finalScore >= content.questions.length ? 30 : finalScore > 0 ? 15 : 5;
        award(xp);
        setXpAwarded(true);
      }
    }
  }

  const topicMeta = topic ? TOPICS.find(t => t.key === topic.key) : null;

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={goBack} aria-label="Go back" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, color: 'var(--subtext)' }}>←</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>🎬 Video Lesson</div>
            <div style={{ fontSize: 12, color: 'var(--subtext)' }}>Watch a Croatian scene · Follow the dialogue · Answer questions</div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 10 }}>{errorMsg}</div>
            <button
              className="b bp"
              disabled={!topic}
              onClick={generate}
              style={{ fontSize: 13, padding: '8px 20px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Topic selector */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Choose a Topic</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
          {TOPICS.map(t => (
            <button
              key={t.key}
              onClick={() => setTopic(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                background: topic?.key === t.key ? 'var(--info-bg,#e0f2fe)' : 'var(--card-bg,#f8fafc)',
                outline: topic?.key === t.key ? '2px solid var(--info,#0284c7)' : '1px solid var(--card-b,#e2e8f0)',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: topic?.key === t.key ? 'var(--info,#0284c7)' : 'var(--heading)' }}>{t.hr}</div>
                <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{t.en}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Level selector */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Difficulty Level</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 12,
                background: level === l ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                color: level === l ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                outline: level === l ? '2px solid var(--info,#0284c7)' : 'none',
              }}
            >{l}</button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={!topic}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            cursor: topic ? 'pointer' : 'not-allowed', fontFamily: "'Outfit',sans-serif",
            fontWeight: 900, fontSize: 15,
            background: topic ? 'linear-gradient(135deg,#0e7490,#0c4a6e)' : 'var(--bar-bg)',
            color: topic ? '#fff' : 'var(--subtext)',
          }}
        >
          {topic ? `▶ Start Lesson — ${topic.hr}` : 'Select a topic above'}
        </button>
      </div>
    );
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 16, padding: 32 }}>
        <div style={{ fontSize: 40 }}>🎬</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--heading)' }}>Generating your lesson…</div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', textAlign: 'center' }}>Creating a {level} {topicMeta?.en || ''} dialogue with comprehension questions</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--info,#0284c7)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing' && content) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Scene video header */}
        <VideoBackground
          videoSrc={sceneVideoUrl}
          imageSrc={topicMeta?.scene || '/images/scenes/zagreb.webp'}
          overlay="linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.2) 60%,rgba(0,0,0,.7) 100%)"
          style={{ minHeight: 180, borderRadius: '0 0 18px 18px', marginBottom: 0 }}
        >
          <div style={{ padding: '16px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.65)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3 }}>
                Video Lesson · {level} · {topicMeta?.hr}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{content.title}</div>
              {content.en_summary && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{content.en_summary}</div>
              )}
            </div>
            <button onClick={goBack} aria-label="Close" style={{ background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 18, flexShrink: 0 }}>×</button>
          </div>
        </VideoBackground>

        <div style={{ padding: '14px 16px' }}>
          {/* Play controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {currentLine === -1 && !playingRef.current ? (
              <button
                onClick={playAllLines}
                style={{
                  flex: 1, padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 14,
                  background: 'linear-gradient(135deg,#0e7490,#0c4a6e)', color: '#fff',
                }}
              >▶ Play Dialogue</button>
            ) : (
              <div style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'var(--bar-bg)', textAlign: 'center', fontSize: 13, color: 'var(--subtext)', fontWeight: 700 }}>
                🔊 Playing line {currentLine + 1} of {lines.length}…
              </div>
            )}
            <button
              onClick={() => setShowTranscript(t => !t)}
              style={{
                padding: '11px 14px', borderRadius: 12, border: '1px solid var(--card-b)', background: 'none',
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
                color: 'var(--subtext)',
              }}
            >{showTranscript ? '📝 Hide' : '📝 Transcript'}</button>
          </div>

          {/* Transcript lines */}
          {showTranscript && (
            <div style={{ marginBottom: 14 }}>
              {lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    padding: '9px 12px', borderRadius: 10, marginBottom: 6,
                    background: currentLine === i ? 'var(--info-bg,#e0f2fe)' : 'var(--card-bg,#f8fafc)',
                    border: `1.5px solid ${currentLine === i ? 'var(--info,#0284c7)' : 'var(--card-b,#e2e8f0)'}`,
                    transition: 'all .2s',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: currentLine === i ? 'var(--info,#0284c7)' : 'var(--subtext)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {l.speaker}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: currentLine === i ? 800 : 600, color: 'var(--heading)' }}>{l.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Vocab reference */}
          {content.vocab && content.vocab.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Key Vocabulary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {content.vocab.map((v, i) => (
                  <span key={i} style={{
                    padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: 'var(--bar-bg)', border: '1px solid var(--card-b)', color: 'var(--heading)',
                  }}>
                    <span style={{ fontStyle: 'italic' }}>{v.hr}</span>
                    <span style={{ color: 'var(--subtext)', fontWeight: 500 }}> — {v.en}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skip to quiz */}
          <button
            onClick={skipToQuiz}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--card-b)',
              background: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              fontWeight: 700, fontSize: 13, color: 'var(--subtext)',
            }}
          >Skip to Questions →</button>
        </div>
      </div>
    );
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && content?.questions) {
    const q = content.questions[qIndex];
    const answered = answers[qIndex];
    return (
      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--heading)' }}>Comprehension Check</div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{qIndex + 1} / {content.questions.length}</div>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-bg,#f8fafc)', border: '1px solid var(--card-b)', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.4 }}>{q.q}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const isSelected = answered?.optIdx === i;
            const isCorrect = i === q.correct;
            let bg = 'var(--card-bg,#f8fafc)';
            let border = '1px solid var(--card-b)';
            if (answered) {
              if (isCorrect) { bg = '#f0fdf4'; border = '2px solid #16a34a'; }
              else if (isSelected) { bg = '#fef2f2'; border = '2px solid #dc2626'; }
            }
            return (
              <button
                key={i}
                onClick={() => !answered && answerQuestion(i)}
                disabled={!!answered}
                style={{
                  padding: '13px 16px', borderRadius: 12, cursor: answered ? 'default' : 'pointer',
                  border, background: bg, fontFamily: "'Outfit',sans-serif",
                  fontSize: 14, fontWeight: 700, color: 'var(--heading)', textAlign: 'left',
                  transition: 'all .2s',
                }}
              >
                {answered && isCorrect ? '✓ ' : answered && isSelected ? '✗ ' : ''}{opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result' && content) {
    const total = content.questions?.length || 0;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const xpEarned = score >= total ? 30 : score > 0 ? 15 : 5;
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>
          {pct === 100 ? '🏆' : pct >= 67 ? '🎉' : '📖'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', marginBottom: 6 }}>
          {pct === 100 ? 'Perfect!' : pct >= 67 ? 'Good Work!' : 'Keep Practicing!'}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 20 }}>
          {score} / {total} correct · +{xpEarned} XP
        </div>

        {/* Per-question review */}
        {content.questions && (
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            {content.questions.map((q, i) => {
              const a = answers[i];
              return (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 12, marginBottom: 8,
                  background: a?.correct ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${a?.correct ? '#86efac' : '#fca5a5'}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: a?.correct ? '#166534' : '#dc2626', marginBottom: 3 }}>
                    {a?.correct ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--heading)', fontWeight: 700 }}>{q.q}</div>
                  {!a?.correct && (
                    <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                      Correct answer: {q.options[q.correct]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setPhase('setup'); setContent(null); setLines([]); setAnswers([]); setScore(0); setQIndex(0); setXpAwarded(false); }}
            style={{
              flex: 1, padding: '13px', borderRadius: 12, border: '1px solid var(--card-b)',
              background: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              fontWeight: 700, fontSize: 14, color: 'var(--subtext)',
            }}
          >New Lesson</button>
          <button
            onClick={goBack}
            style={{
              flex: 1, padding: '13px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#0e7490,#0c4a6e)', cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 14, color: '#fff',
            }}
          >Back to Practice</button>
        </div>
      </div>
    );
  }

  return null;
}
