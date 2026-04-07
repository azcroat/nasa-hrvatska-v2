import React, { useState, useRef, useEffect } from 'react';
import { H } from '../../data.jsx';
import { markQuest } from '../../lib/quests.js';
import { AIContentSkeleton, AIProgressBar } from '../shared/SkeletonLoader.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { apiFetch } from '../../lib/apiFetch.js';
import { getVoicePreference } from '../../lib/soundSettings.js';

const TOPICS = [
  { key: 'cafe',       emoji: '☕',  hr: 'U kafiću',   en: 'At the Café' },
  { key: 'market',     emoji: '🛒',  hr: 'Na tržnici', en: 'At the Market' },
  { key: 'family',     emoji: '👨‍👩‍👧', hr: 'Obitelj',    en: 'Family' },
  { key: 'travel',     emoji: '✈️',  hr: 'Putovanje',  en: 'Travel' },
  { key: 'weather',    emoji: '🌤️', hr: 'Vrijeme',    en: 'Weather' },
  { key: 'sports',     emoji: '⚽',  hr: 'Sport',      en: 'Sports' },
  { key: 'work',       emoji: '💼',  hr: 'Posao',      en: 'Work' },
  { key: 'weekend',    emoji: '🏖️', hr: 'Vikend',     en: 'Weekend' },
  { key: 'restaurant', emoji: '🍽️', hr: 'Restoran',   en: 'Restaurant' },
  { key: 'city',       emoji: '🏙️', hr: 'Grad',       en: 'City' },
];

export default function AIListeningScreen({ goBack, award }) {
  const isOnline = useOnlineStatus();
  const [phase, setPhase]               = useState('setup');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [style, setStyle]               = useState('dialogue');
  const [content, setContent]           = useState(null);
  const [audioUrl, setAudioUrl]         = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [hasPlayed, setHasPlayed]       = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speed, setSpeed]               = useState(1);
  const [qIndex, setQIndex]             = useState(0);
  const [answers, setAnswers]           = useState([]);
  const [score, setScore]               = useState(0);
  const [xpAwarded, setXpAwarded]       = useState(false);
  const [readyVisible, setReadyVisible] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [audioSource, setAudioSource]   = useState('loading');

  const audioRef   = useRef(null);
  const mountedRef = useRef(true);
  const readyTimer = useRef(null);

  const level = localStorage.getItem('nh_level') || 'B1';

  useEffect(() => () => {
    mountedRef.current = false;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => () => { clearTimeout(readyTimer.current); }, []);

  // ── Generate content + TTS ────────────────────────────────────────────────
  async function generate() {
    if (!selectedTopic) return;
    setErrorMsg('');
    setPhase('loading');

    try {
      const res = await apiFetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic, level, style }),
        signal: AbortSignal.timeout(30000),
      });
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error(`listening API error: ${res.status}`);
      const data = await res.json();
      setContent(data);

      // Build TTS text
      let fullText = '';
      if (style === 'dialogue' && data.speakers) {
        data.speakers.forEach(spk => {
          if (!Array.isArray(spk.lines)) return;
          spk.lines.forEach(line => {
            fullText += `${spk.name}: ${line}\n\n`;
          });
        });
      } else {
        fullText = data.narrator || '';
      }

      const ttsRes = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText.trim(), slow: speed < 1, voice: getVoicePreference() }),
        signal: AbortSignal.timeout(20000),
      });
      if (!mountedRef.current) return;
      if (!ttsRes.ok) {
        if (mountedRef.current) setAudioSource('unavailable');
      } else {
        const blob = await ttsRes.blob();
        const url  = URL.createObjectURL(blob);
        if (!mountedRef.current) { URL.revokeObjectURL(url); return; }
        setAudioUrl(url);
        setAudioSource('azure');
      }
      setPhase('listening');
      setReadyVisible(false);
      readyTimer.current = setTimeout(() => {
        if (mountedRef.current) setReadyVisible(true);
      }, 5000);
    } catch (err) {
      if (mountedRef.current) {
        const isNetwork = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
        setErrorMsg(!isOnline
          ? 'No connection — reconnect to generate listening exercises'
          : isNetwork
          ? 'Connection error — check your internet and try again'
          : 'Something went wrong — please try again');
        setPhase('setup');
      }
    }
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function getAudio() {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = speed;
      audioRef.current.onended = () => {
        if (mountedRef.current) { setIsPlaying(false); setHasPlayed(true); setReadyVisible(true); }
      };
      // Sync UI if audio is interrupted by system (Android screen lock, incoming call)
      audioRef.current.onpause = () => {
        if (mountedRef.current && !audioRef.current?.ended) setIsPlaying(false);
      };
    }
    return audioRef.current;
  }

  function togglePlay() {
    const a = getAudio();
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else           { a.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
  }

  function replayAudio() {
    const a = getAudio();
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }

  function setAudioSpeed(s) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  // ── Questions ─────────────────────────────────────────────────────────────
  function selectAnswer(optionIndex) {
    if (answers[qIndex] !== undefined) return;
    if (!content?.questions?.[qIndex]) return;
    const correct = content.questions[qIndex].correct;
    const isRight = optionIndex === correct;
    setAnswers(prev => { const a = [...prev]; a[qIndex] = optionIndex; return a; });
    if (isRight) setScore(s => s + 1);
  }

  function nextQuestion() {
    if (qIndex < content.questions.length - 1) setQIndex(i => i + 1);
    else goToResults();
  }

  function goToResults() {
    setPhase('results');
  }

  // Award XP exactly once on results mount.
  // All consumed values in deps — xpAwarded guard prevents double-award on re-runs.
  useEffect(() => {
    if (phase === 'results' && !xpAwarded) {
      const xp = 10 + score * 5;
      if (typeof award === 'function') award(xp);
      markQuest('speak');
      setXpAwarded(true);
    }
  }, [phase, xpAwarded, score, award]);

  function resetToSetup() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setContent(null);
    setPhase('setup');
    setIsPlaying(false);
    setHasPlayed(false);
    setShowTranscript(false);
    setSpeed(1);
    setQIndex(0);
    setAnswers([]);
    setScore(0);
    setXpAwarded(false);
    setReadyVisible(false);
    setAudioSource('loading');
  }

  // ── Build transcript text ─────────────────────────────────────────────────
  function buildTranscript() {
    if (!content) return '';
    if (style === 'dialogue' && content.speakers) {
      return content.speakers.map(spk => (spk.lines || []).map(l => `${spk.name}: ${l}`).join('\n')).join('\n\n');
    }
    return content.narrator || '';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: SETUP
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') return (
    <div className="scr-wrap">
      {H('🎧 AI Listening', 'Dynamically generated Croatian audio', goBack)}

      {!isOnline && (
        <div style={{
          background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:10,
          padding:'12px 16px', marginBottom:16, fontSize:13, fontWeight:600,
          color:'#92400e', display:'flex', alignItems:'center', gap:8
        }}>
          <span>📡</span>
          <span>You're offline. AI features need an internet connection. Your progress is saved locally.</span>
        </div>
      )}

      {/* Level badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ background: '#0e7490', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
          {level} Level
        </span>
        <span style={{ color: 'var(--subtext)', fontSize: 13 }}>Pick a topic to get started</span>
      </div>

      {/* Style toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ key: 'dialogue', label: '💬 Dijalog' }, { key: 'monologue', label: '🎤 Monolog' }].map(s => (
          <button key={s.key} onClick={() => setStyle(s.key)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
              borderColor: style === s.key ? '#0e7490' : 'var(--bar-bg)',
              background: style === s.key ? 'rgba(14,116,144,0.12)' : 'var(--card)',
              color: style === s.key ? '#0e7490' : 'var(--heading)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 14, color: '#dc2626', fontWeight: 600, lineHeight: 1.4 }}>
            ⚠️ {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#dc2626', fontSize: 18, lineHeight: 1, padding: '0 0 0 12px', fontWeight: 700,
          }} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Topic grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {TOPICS.map(t => {
          const sel = selectedTopic === t.key;
          return (
            <button key={t.key} onClick={() => setSelectedTopic(t.key)}
              style={{
                padding: '12px 10px', borderRadius: 12, border: '2px solid',
                borderColor: sel ? '#0e7490' : 'var(--bar-bg)',
                background: sel ? 'rgba(14,116,144,0.12)' : 'var(--card)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 22 }}>{t.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: sel ? '#0e7490' : 'var(--heading)', marginTop: 4 }}>{t.hr}</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{t.en}</div>
            </button>
          );
        })}
      </div>

      <button className="b bp" style={{ width: '100%', opacity: (selectedTopic && isOnline) ? 1 : 0.4, cursor: (selectedTopic && isOnline) ? 'pointer' : 'not-allowed' }}
        disabled={!selectedTopic || !isOnline} onClick={generate}>
        {!isOnline ? '📶 Offline — connect to generate' : 'Generate →'}
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: LOADING
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'loading') return (
    <div className="scr-wrap">
      <div style={{ padding: '0 0 32px' }}>
        <AIProgressBar phase="thinking" messages={['Generating Croatian dialogue…', 'Writing comprehension questions…', 'Preparing your listening exercise…', 'Almost ready…']} />
        <AIContentSkeleton message="Preparing your listening exercise" icon="🎧" />
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: LISTENING
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'listening' && content) return (
    <div className="scr-wrap">
      {H('🎧 ' + content.title, TOPICS.find(t => t.key === selectedTopic)?.en || '', goBack)}

      {/* English summary */}
      <div style={{ background: 'rgba(14,116,144,0.08)', border: '1px solid rgba(14,116,144,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Summary</div>
        <div style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.5 }}>{content.en_summary}</div>
      </div>

      {/* Audio controls */}
      <div className="c" style={{ textAlign: 'center', padding: 20 }}>
        <button onClick={togglePlay} aria-label={isPlaying ? "Pause audio" : "Play audio"} style={{
          width: 64, height: 64, borderRadius: '50%', border: 'none',
          background: '#0e7490', color: '#fff', fontSize: 26, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(14,116,144,0.35)', marginBottom: 14,
        }}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        {audioSource === 'unavailable' && (
          <div style={{
            fontSize: 11, color: 'var(--warning, #d97706)',
            textAlign: 'center', marginTop: 4, fontStyle: 'italic',
          }}>
            Audio unavailable — transcript only
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={replayAudio} aria-label="Replay from beginning" style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid var(--bar-bg)',
            background: 'var(--card)', color: 'var(--heading)', fontSize: 13, cursor: 'pointer',
          }}>🔁 Replay</button>

          {[0.75, 1].map(s => (
            <button key={s} onClick={() => setAudioSpeed(s)} aria-label={"Set speed to " + s + "x"} style={{
              padding: '6px 14px', borderRadius: 8, border: '2px solid',
              borderColor: speed === s ? '#0e7490' : 'var(--bar-bg)',
              background: speed === s ? 'rgba(14,116,144,0.12)' : 'var(--card)',
              color: speed === s ? '#0e7490' : 'var(--heading)', fontSize: 13, cursor: 'pointer', fontWeight: speed === s ? 700 : 400,
            }}>{s === 0.75 ? '🐢 0.75×' : '1×'}</button>
          ))}
        </div>
      </div>

      {/* Transcript toggle */}
      <button onClick={() => setShowTranscript(v => !v)} style={{
        width: '100%', padding: '10px 0', borderRadius: 10, border: '1px dashed var(--bar-bg)',
        background: 'transparent', color: 'var(--subtext)', fontSize: 13, cursor: 'pointer', marginBottom: showTranscript ? 0 : 12,
      }}>
        {showTranscript ? '▲ Hide Transcript' : '▼ Show Transcript'}
      </button>

      {showTranscript && (
        <div className="c" style={{ marginBottom: 12, whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.8, color: 'var(--heading)' }}>
          {buildTranscript()}
        </div>
      )}

      {/* Vocabulary */}
      {content.vocab && content.vocab.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Vocabulary</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {content.vocab.map((v, i) => (
              <span key={i} style={{
                background: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.2)',
                borderRadius: 20, padding: '4px 12px', fontSize: 13,
              }}>
                <span style={{ fontWeight: 700, color: '#003DA5' }}>{v.hr}</span>
                <span style={{ color: 'var(--subtext)', margin: '0 4px' }}>·</span>
                <span style={{ color: 'var(--subtext)' }}>{v.en}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ready button */}
      {(readyVisible || hasPlayed) && (
        <button className="b bp" style={{ width: '100%' }} onClick={() => setPhase('questions')}>
          I'm Ready — Take the Quiz →
        </button>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'questions' && content) {
    const q        = content.questions[qIndex];
    const answered = answers[qIndex] !== undefined;
    const chosen   = answers[qIndex];
    const isLast   = qIndex === content.questions.length - 1;

    return (
      <div className="scr-wrap">
        {H('🧠 Comprehension', `Question ${qIndex + 1} of ${content.questions.length}`, goBack)}

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {content.questions.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < qIndex ? '#0e7490' : i === qIndex ? '#0e7490' : 'var(--bar-bg)',
              opacity: i === qIndex ? 1 : i < qIndex ? 0.9 : 0.3,
            }} />
          ))}
        </div>

        <div className="c" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.5 }}>{q.q}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {q.options.map((opt, oi) => {
            let bg = 'var(--card)', border = 'var(--bar-bg)', color = 'var(--heading)';
            let suffix = '';
            if (answered) {
              if (oi === q.correct) { bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; color = '#065f46'; suffix = ' ✓'; }
              else if (oi === chosen) { bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; color = '#7f1d1d'; suffix = ' ✗'; }
            }
            return (
              <button key={oi} onClick={() => selectAnswer(oi)} style={{
                padding: '13px 16px', borderRadius: 10, border: `2px solid ${border}`,
                background: bg, color, textAlign: 'left', fontSize: 14, fontWeight: answered && oi === q.correct ? 700 : 400,
                cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ fontWeight: 700, marginRight: 8, color: '#0e7490' }}>{String.fromCharCode(65 + oi)}.</span>
                {opt}{suffix}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{
            background: chosen === q.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${chosen === q.correct ? '#10b981' : '#ef4444'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 14,
            color: chosen === q.correct ? '#065f46' : '#7f1d1d', fontWeight: 600,
          }}>
            {chosen === q.correct ? '✅ Točno! +5 XP' : '❌ Netočno — pogledaj točan odgovor'}
          </div>
        )}

        {answered && (
          <button className="b bp" style={{ width: '100%' }} onClick={nextQuestion}>
            {isLast ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'results' && content) {
    const total   = content.questions.length;
    const xpEarned = 10 + score * 5;
    const emoji   = score === total ? '🏆' : score >= total * 0.6 ? '🎉' : '💪';

    return (
      <div className="scr-wrap">
        {H('📊 Results', 'AI Listening Exercise', goBack)}

        <div className="c" style={{ textAlign: 'center', padding: '24px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>{emoji}</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0e7490', marginBottom: 4 }}>
            {score} / {total}
          </div>
          <div style={{ color: 'var(--subtext)', fontSize: 14, marginBottom: 16 }}>
            {score === total ? 'Perfect score!' : score >= total * 0.6 ? 'Good work!' : 'Keep practising!'}
          </div>
          <div style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #d97706, #f59e0b)',
            color: '#fff', borderRadius: 20, padding: '6px 20px', fontSize: 18, fontWeight: 900,
          }}>
            +{xpEarned} XP
          </div>
        </div>

        {/* Vocab recap */}
        {content.vocab && content.vocab.length > 0 && (
          <div className="c" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Vocabulary from this exercise
            </div>
            {content.vocab.map((v, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: i < content.vocab.length - 1 ? '1px solid var(--bar-bg)' : 'none',
              }}>
                <span style={{ fontWeight: 700, color: '#003DA5', fontSize: 15 }}>{v.hr}</span>
                <span style={{ color: 'var(--subtext)', fontSize: 14 }}>{v.en}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="b bg" style={{ flex: 1 }} onClick={resetToSetup}>🔁 Try Another</button>
          <button className="b bp" style={{ flex: 1 }} onClick={goBack}>← Done</button>
        </div>
      </div>
    );
  }

  return null;
}
