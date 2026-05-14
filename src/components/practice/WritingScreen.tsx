import React, { useState, useRef, useEffect } from 'react';
import { H } from '../../data';
import { AIProgressBar } from '../shared/SkeletonLoader';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { rnd } from '../../lib/random.js';
import { useStats } from '../../context/StatsContext';
import { logError } from '../../lib/learnerErrors.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { getVoicePreference } from '../../lib/soundSettings.js';
import { markQuest } from '../../lib/quests.js';
import { addWordToSRS } from '../../lib/srs.js';

const PROMPTS = [
  // A2 — simple present, basic vocabulary
  {
    en: 'Describe your morning routine',
    hr: 'Opiši svoju jutarnju rutinu',
    level: 'A2',
    focus: 'Present tense + daily verbs',
  },
  {
    en: 'Write about your family',
    hr: 'Napiši o svojoj obitelji',
    level: 'A2',
    focus: "Verb 'biti' + nominative",
  },
  {
    en: 'Describe the weather today',
    hr: 'Opiši današnje vrijeme',
    level: 'A2',
    focus: 'Adjective agreement',
  },
  {
    en: 'Write about where you live',
    hr: 'Napiši o tome gdje živiš',
    level: 'A2',
    focus: 'Locative case (u/na + place)',
  },
  // B1 — past tense, accusative, broader vocabulary
  {
    en: 'Describe a typical day in Croatia',
    hr: 'Opiši tipičan dan u Hrvatskoj',
    level: 'B1',
    focus: 'Past tense (perfective/imperfective)',
  },
  { en: 'Write about your hobby', hr: 'Opiši svoj hobi', level: 'B1', focus: 'Accusative case' },
  {
    en: 'Write a short text about Croatia',
    hr: 'Napiši kratki tekst o Hrvatskoj',
    level: 'B1',
    focus: 'Culture vocabulary',
  },
  {
    en: 'Describe a Croatian city you know',
    hr: 'Opiši hrvatski grad koji poznaješ',
    level: 'B1',
    focus: 'Genitive + prepositions',
  },
  {
    en: 'Write about your favorite Croatian food',
    hr: 'Napiši o svojoj omiljenoj hrvatskoj hrani',
    level: 'B1',
    focus: 'Adjective-noun agreement',
  },
  {
    en: 'Write about a recent trip or outing',
    hr: 'Napiši o nedavnom putovanju ili izletu',
    level: 'B1',
    focus: 'Past tense + travel vocabulary',
  },
  // B2 — conditional, complex sentences
  {
    en: 'If you could live in Croatia, where would you choose?',
    hr: 'Kad bi mogao/mogla živjeti u Hrvatskoj, gdje bi odabrao/la?',
    level: 'B2',
    focus: 'Conditional mood (bih/bi)',
  },
  {
    en: 'Describe a conversation you had recently',
    hr: 'Opiši razgovor koji si nedavno imao/imala',
    level: 'B2',
    focus: 'Reported speech + past tense',
  },
  {
    en: 'Write about Croatian culture or customs you admire',
    hr: 'Napiši o hrvatskoj kulturi ili običajima koji ti se sviđaju',
    level: 'B2',
    focus: 'Relative clauses',
  },
  {
    en: 'Why do you learn Croatian? Write a short letter.',
    hr: 'Zašto učiš hrvatski? Napiši kratko pismo.',
    level: 'B2',
    focus: 'Modal verbs + dative',
  },
  {
    en: 'Compare life in Croatia with your home country',
    hr: 'Usporedi život u Hrvatskoj s tvojom domovinom',
    level: 'B2',
    focus: 'Comparatives + contrast conjunctions',
  },
  // C1 — subjunctive-like structures, all 7 cases, complex syntax
  {
    en: 'Describe what would need to change for you to speak Croatian fluently',
    hr: 'Opiši što bi trebalo promijeniti da govoriš tečno hrvatski',
    level: 'C1',
    focus: 'da + present tense (subjunctive pattern)',
  },
  {
    en: 'Write a persuasive paragraph: why is Croatian worth learning?',
    hr: 'Napiši uvjerljiv odlomak: zašto je vrijedno učiti hrvatski?',
    level: 'C1',
    focus: 'Complex clauses + formal register',
  },
  {
    en: 'Describe a family tradition in Croatian',
    hr: 'Opiši obiteljsku tradiciju na hrvatskom',
    level: 'C1',
    focus: 'All 7 cases in natural context',
  },
  {
    en: 'Write about something you wish had been different',
    hr: 'Napiši o nečemu što bi željeo/željela promijeniti',
    level: 'C1',
    focus: 'Conditional + past tense contrast',
  },
  {
    en: 'Write about why you learn Croatian',
    hr: 'Napiši zašto učiš hrvatski',
    level: 'A2',
    focus: 'Basic sentence structure',
  },
];

interface ChangeItem {
  original: string;
  corrected?: string;
  type?: string;
  note?: string;
}

interface HighlightedTextProps {
  original: string;
  changes: ChangeItem[];
}

function HighlightedText({ original, changes }: HighlightedTextProps) {
  if (!changes || changes.length === 0) {
    return <span>{original}</span>;
  }
  const text = original;
  const segments = [];
  let lastIdx = 0;
  // Sort changes by position in text
  const sorted = [...changes].sort((a, b) => {
    const ai = text.toLowerCase().indexOf(a.original.toLowerCase());
    const bi = text.toLowerCase().indexOf(b.original.toLowerCase());
    return ai - bi;
  });
  for (const change of sorted) {
    const idx = text.toLowerCase().indexOf(change.original.toLowerCase(), lastIdx);
    if (idx === -1) continue;
    if (idx > lastIdx) segments.push({ text: text.slice(lastIdx, idx), error: false });
    segments.push({ text: text.slice(idx, idx + change.original.length), error: true });
    lastIdx = idx + change.original.length;
  }
  if (lastIdx < text.length) segments.push({ text: text.slice(lastIdx), error: false });
  return (
    <span>
      {segments.map((seg, i) => (
        <span
          key={i}
          style={
            seg.error
              ? {
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: 3,
                  padding: '0 2px',
                  textDecoration: 'underline',
                  textDecorationColor: '#dc2626',
                  textDecorationStyle: 'wavy',
                }
              : {}
          }
        >
          {seg.text}
        </span>
      ))}
    </span>
  );
}

interface WritingResult {
  score?: number;
  level_demonstrated?: string;
  corrected_text?: string;
  strengths?: string[];
  changes?: ChangeItem[];
  encouragement?: string;
}

interface WritingScreenProps {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

// ── Word-count gate ───────────────────────────────────────────────────────────
export const MIN_WORDS = 30;

export function countWords(raw: string): number {
  return raw.trim().split(/\s+/).filter(Boolean).length;
}

export default function WritingScreen({ goBack, award }: WritingScreenProps) {
  const finishFired = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const isOnline = useOnlineStatus();
  const { stats, setStats, writeDelta, level: userLevel } = useStats();
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(rnd() * PROMPTS.length));
  const [text, setText] = useState('');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('guided'); // "guided" | "free"
  const [customTopic, setCustomTopic] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);

  const prompt = PROMPTS[promptIdx] ?? PROMPTS[0]!;
  const effectivePrompt =
    mode === 'free'
      ? {
          en: customTopic || 'Write freely in Croatian',
          hr: '',
          level: userLevel,
          focus: 'Free expression',
        }
      : prompt;

  const wordCount = countWords(text);
  const meetsMinWords = wordCount >= MIN_WORDS;

  async function checkWithAI() {
    if (!text.trim() || text.trim().length < 10) {
      setError('Please write at least a sentence or two in Croatian.');
      return;
    }
    if (text.length > 3000) {
      setError('Text too long. Please keep your writing under 3000 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiFetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'writeeval',
          prompt: effectivePrompt.en,
          text: text.trim(),
          params: { level: userLevel, writingPrompt: effectivePrompt.en },
        }),
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      if (!mountedRef.current) return;
      setResult(data);
      // Log mistakes and add single-word corrections to SRS queue
      const corrections: ChangeItem[] = data.changes || data.mistakes || [];
      corrections.forEach((ch: ChangeItem) => {
        const orig = ch.original || '';
        const corr = (ch.corrected || '').trim();
        logError(
          ch.type || ch.note || 'writing_error',
          (ch.type || '').includes('grammar') ? 'grammar' : 'vocabulary',
          { wrong: orig, correct: corr, source: 'writing' },
        );
        // Single-word corrections → queue for spaced repetition
        if (corr && !corr.includes(' ') && corr.length >= 2 && corr.length <= 30) {
          addWordToSRS(corr);
        }
      });
    } catch (e) {
      if (!mountedRef.current) return;
      setError(
        !isOnline
          ? 'No connection — please reconnect to use AI feedback.'
          : 'Could not connect to AI correction service. Check your connection.',
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function newPrompt() {
    finishFired.current = false;
    setText('');
    setResult(null);
    setError('');
    setCustomTopic('');
    setPromptIdx(function (cur) {
      const next = Math.floor(rnd() * (PROMPTS.length - 1));
      return next >= cur ? next + 1 : next;
    });
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function playTTS(ttsText: string) {
    setTtsLoading(true);
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText.slice(0, 400),
          slow: false,
          voice: getVoicePreference(),
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const url = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } finally {
      if (mountedRef.current) setTtsLoading(false);
    }
  }

  return (
    <div className="scr-wrap">
      {H('✍️ Free Writing', 'Write in Croatian — get AI feedback', goBack)}

      {!isOnline && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>📡</span>
          <span>
            You're offline. AI features need an internet connection. Your progress is saved locally.
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '0 2px' }}>
        <button
          onClick={() => setMode('guided')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .15s',
            background: mode === 'guided' ? '#7c3aed' : 'var(--card)',
            color: mode === 'guided' ? '#fff' : 'var(--subtext)',
            border: mode === 'guided' ? 'none' : '1.5px solid var(--card-b)',
          }}
        >
          📚 Guided Prompt
        </button>
        <button
          onClick={() => setMode('free')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .15s',
            background: mode === 'free' ? '#7c3aed' : 'var(--card)',
            color: mode === 'free' ? '#fff' : 'var(--subtext)',
            border: mode === 'free' ? 'none' : '1.5px solid var(--card-b)',
          }}
        >
          ✏️ Free Topic
        </button>
      </div>

      {/* Prompt card — guided mode only */}
      {mode === 'guided' && (
        <div className="c" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>📝</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                {prompt.level && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background:
                        prompt.level === 'A2'
                          ? '#dcfce7'
                          : prompt.level === 'B1'
                            ? '#fef9c3'
                            : prompt.level === 'B2'
                              ? '#fef3c7'
                              : '#ede9fe',
                      color:
                        prompt.level === 'A2'
                          ? '#16a34a'
                          : prompt.level === 'B1'
                            ? '#a16207'
                            : prompt.level === 'B2'
                              ? '#b45309'
                              : '#7c3aed',
                    }}
                  >
                    {prompt.level}
                  </span>
                )}
                {prompt.focus && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--subtext)',
                      fontStyle: 'italic',
                      padding: '2px 0',
                    }}
                  >
                    📌 {prompt.focus}
                  </span>
                )}
              </div>
              <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--heading)', margin: 0 }}>
                {prompt.en}
              </p>
              <p
                style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2, fontStyle: 'italic' }}
              >
                {prompt.hr}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom topic input — free mode only */}
      {mode === 'free' && (
        <div className="c" style={{ padding: '16px', marginBottom: 16 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--heading)',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            What would you like to write about?
          </p>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g. My last holiday, My job, My favourite food..."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1.5px solid var(--card-b)',
              borderRadius: 10,
              fontFamily: "'Outfit',sans-serif",
              background: 'var(--card)',
              color: 'var(--heading)',
              boxSizing: 'border-box',
            }}
          />
          {customTopic && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--subtext)',
                marginTop: 6,
                marginBottom: 0,
                fontStyle: 'italic',
              }}
            >
              You'll write in Croatian about:{' '}
              <strong style={{ color: 'var(--heading)' }}>{customTopic}</strong>
            </p>
          )}
        </div>
      )}

      <div className="c" style={{ padding: '16px' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write in Croatian here... (Piši na hrvatskom...)"
          maxLength={3000}
          style={{
            width: '100%',
            minHeight: 140,
            padding: '12px',
            fontSize: 15,
            border: '1.5px solid var(--card-b)',
            borderRadius: 10,
            fontFamily: "'Outfit',sans-serif",
            resize: 'vertical',
            background: 'var(--card)',
            color: 'var(--heading)',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <span data-testid="word-count-label" style={{ fontSize: 12, color: 'var(--subtext)' }}>
            Word count: {wordCount} / {MIN_WORDS}
            {wordCount > 0 && wordCount < MIN_WORDS && (
              <span style={{ color: 'var(--error)' }}> (aim for {MIN_WORDS}+)</span>
            )}
            {wordCount >= MIN_WORDS && wordCount < 80 && (
              <span style={{ color: 'var(--info)' }}> ✓ good start</span>
            )}
            {wordCount >= 80 && <span style={{ color: 'var(--success)' }}> ✓ great length</span>}
          </span>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#7c3aed',
              fontWeight: 600,
            }}
            onClick={newPrompt}
          >
            🔄 New Prompt
          </button>
        </div>
        {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 10, lineHeight: 1.5 }}>
          🔒 Your text is sent to an AI for grammar feedback. It is not stored or used for training.
        </div>
        <button
          className="b bp"
          style={{
            width: '100%',
            marginTop: 8,
            transition: 'transform .15s ease,box-shadow .15s ease',
          }}
          onClick={checkWithAI}
          disabled={loading || !isOnline}
        >
          {!isOnline ? (
            '📶 Offline — AI check unavailable'
          ) : loading ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 'var(--text-sm)',
                color: 'inherit',
              }}
            >
              <span
                style={{
                  animation: 'spin .8s linear infinite',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                ⟳
              </span>{' '}
              Checking your Croatian...
            </span>
          ) : (
            '🤖 Check with AI'
          )}
        </button>
      </div>

      {loading && !result && (
        <AIProgressBar
          phase="processing"
          messages={[
            'Reading your Croatian…',
            'Checking grammar…',
            'Finding improvements…',
            'Almost done…',
          ]}
        />
      )}

      {result && (
        <div className="c" style={{ padding: '20px', marginTop: 0, animation: 'fadeIn .3s ease' }}>
          {/* Score header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>
              {(result.score ?? 0) >= 80 ? '🌟' : (result.score ?? 0) >= 60 ? '🎉' : '💪'}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--heading)', margin: 0 }}>
                Score: {result.score}/100
              </p>
              <p style={{ fontSize: 13, color: 'var(--subtext)', margin: '2px 0 0' }}>
                {result.level_demonstrated}
              </p>
            </div>
          </div>

          {/* Corrected text with TTS button */}
          {result.corrected_text && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--info)', marginBottom: 8 }}>
                ✅ Suggested version:
              </p>
              <div
                style={{
                  background: 'var(--info-bg)',
                  border: '1.5px solid var(--info-b)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--heading)',
                }}
              >
                {result.corrected_text}
              </div>
              <button
                style={{
                  background: 'none',
                  border: '1.5px solid var(--info)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                }}
                onClick={() => playTTS(result.corrected_text ?? '')}
                disabled={ttsLoading}
              >
                <span aria-hidden="true">{ttsLoading ? '⟳' : '🔊'}</span>{' '}
                {ttsLoading ? 'Loading...' : 'Hear corrected version'}
              </button>
            </div>
          )}

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p
                style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', marginBottom: 8 }}
              >
                ✅ What you did well:
              </p>
              {result.strengths.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'var(--success-bg)',
                    borderRadius: 8,
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <span>⭐</span>
                  <span style={{ color: 'var(--heading)' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Annotated diff with HighlightedText */}
          {result.changes && result.changes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--info)', marginBottom: 8 }}>
                📝 Your text — annotated:
              </p>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid var(--card-b)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 2,
                  color: 'var(--heading)',
                }}
              >
                <HighlightedText original={text} changes={result.changes} />
              </div>
              <div style={{ marginTop: 10 }}>
                {result.changes.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      background: 'var(--error-bg)',
                      border: '1px solid var(--error-b)',
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>✏️</span>
                    <div>
                      <span
                        style={{
                          color: 'var(--error)',
                          textDecoration: 'line-through',
                          fontWeight: 700,
                        }}
                      >
                        {c.original}
                      </span>
                      <span style={{ color: 'var(--subtext)', margin: '0 6px' }}>→</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                        {c.corrected}
                      </span>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--subtext)',
                          marginTop: 3,
                          fontStyle: 'italic',
                        }}
                      >
                        {c.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encouragement */}
          {result.encouragement && (
            <div
              style={{
                background: 'var(--success-bg)',
                border: '1.5px solid var(--success-b)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: 'var(--success)',
                fontWeight: 600,
              }}
            >
              💬 {result.encouragement}
            </div>
          )}

          {!meetsMinWords && (
            <p
              data-testid="word-count-warning"
              style={{
                color: 'var(--error)',
                fontSize: 13,
                marginTop: 12,
                marginBottom: 0,
                textAlign: 'center',
              }}
            >
              Write at least {MIN_WORDS} words to mark this complete.
            </p>
          )}
          <button
            data-testid="new-prompt-btn"
            className="b bp"
            style={{
              width: '100%',
              marginTop: 16,
              opacity: meetsMinWords ? 1 : 0.45,
              cursor: meetsMinWords ? 'pointer' : 'not-allowed',
            }}
            disabled={!meetsMinWords}
            onClick={() => {
              if (!meetsMinWords) {
                setError(`Write at least ${MIN_WORDS} words to mark this complete.`);
                return;
              }
              if (finishFired.current) return;
              finishFired.current = true;
              markQuest('write');
              if (typeof award === 'function') {
                const sc = result.score ?? 0;
                award(sc > 0 ? Math.round(sc / 10) + 5 : 5, false, 'writing');
              }
              if (!stats.vs?.includes('writing')) {
                setStats((prev) => {
                  if (prev.vs?.includes('writing')) return prev;
                  return { ...prev, vs: [...(prev.vs || []), 'writing'] };
                });
                if (writeDelta) writeDelta({ vs: ['writing'] });
              }
              setText('');
              setResult(null);
            }}
          >
            ✨ New Prompt
          </button>
        </div>
      )}
    </div>
  );
}
