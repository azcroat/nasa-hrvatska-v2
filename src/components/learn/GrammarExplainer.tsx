import React, { useState, useRef } from 'react';
import { H } from '../../data';
import { speak } from '../../lib/audio.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { _aiPost } from '../../lib/aiPost';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';

const TOPICS = [
  {
    id: 'gender',
    icon: '🏷️',
    title: 'Noun Gender',
    level: 'A1',
    desc: 'Masculine, feminine & neuter',
  },
  {
    id: 'present',
    icon: '🔧',
    title: 'Present Tense',
    level: 'A1',
    desc: 'Verb conjugation basics',
  },
  { id: 'past', icon: '⏪', title: 'Past Tense', level: 'A2', desc: 'Perfekt with biti + l-form' },
  {
    id: 'future',
    icon: '⏩',
    title: 'Future Tense',
    level: 'A2',
    desc: 'Two ways to express the future',
  },
  {
    id: 'cases_intro',
    icon: '📐',
    title: 'Cases Overview',
    level: 'A2',
    desc: 'What the 7 padeži do',
  },
  {
    id: 'nominative',
    icon: '①',
    title: 'Nominative Case',
    level: 'A2',
    desc: 'Subjects and complements',
  },
  { id: 'accusative', icon: '②', title: 'Accusative Case', level: 'A2', desc: 'Direct objects' },
  {
    id: 'genitive',
    icon: '③',
    title: 'Genitive Case',
    level: 'B1',
    desc: 'Possession, negation, quantity',
  },
  { id: 'dative', icon: '④', title: 'Dative Case', level: 'B1', desc: 'Indirect objects, to/for' },
  {
    id: 'locative',
    icon: '⑤',
    title: 'Locative Case',
    level: 'B1',
    desc: 'Location after u/na/o/po',
  },
  {
    id: 'instrumental',
    icon: '⑥',
    title: 'Instrumental Case',
    level: 'B1',
    desc: 'With/by means of',
  },
  { id: 'vocative', icon: '⑦', title: 'Vocative Case', level: 'B1', desc: 'Direct address' },
  {
    id: 'aspect',
    icon: '↔️',
    title: 'Verb Aspect',
    level: 'B1',
    desc: 'Perfective vs imperfective',
  },
  {
    id: 'clitics',
    icon: '📎',
    title: 'Clitic Pronouns',
    level: 'B1',
    desc: 'Second-position rule',
  },
  {
    id: 'conditional',
    icon: '💭',
    title: 'Conditional Mood',
    level: 'B2',
    desc: 'Wishes & hypotheticals with bi',
  },
  {
    id: 'impersonal',
    icon: '🌀',
    title: 'Impersonal Constructions',
    level: 'B2',
    desc: 'Se constructions',
  },
  { id: 'pitch', icon: '🎵', title: 'Pitch Accent', level: 'B2', desc: 'Four-way tone system' },
  {
    id: 'relative_clauses',
    icon: '🔗',
    title: 'Relative Clauses',
    level: 'C1',
    desc: 'koji/koja/koje with full case agreement',
  },
  {
    id: 'verbal_nouns',
    icon: '📦',
    title: 'Verbal Nouns',
    level: 'C1',
    desc: 'Glagolske imenice — čitanje, pisanje, učenje',
  },
  {
    id: 'aspect_narrative',
    icon: '📖',
    title: 'Aspect in Narrative',
    level: 'C1',
    desc: 'Perfective/imperfective for foreground/background',
  },
  {
    id: 'genitive_negation',
    icon: '🚫',
    title: 'Genitive of Negation',
    level: 'C1',
    desc: 'Negation shifts accusative → genitive',
  },
  {
    id: 'advanced_clitics',
    icon: '⚙️',
    title: 'Advanced Clitics',
    level: 'C1',
    desc: 'Clitic clusters, ordering rules & climbing',
  },
];

const WRITING_PROMPTS = {
  gender:
    'Write 3 sentences in Croatian using nouns of different genders (masculine, feminine, and neuter). For each noun, include an adjective that matches its gender.',
  present:
    'Write 4 sentences describing what you and people around you do every day. Use at least 3 different verbs.',
  past: 'Write about what you did yesterday morning. Describe at least 3 actions using the past tense.',
  future:
    'Write about your plans for next weekend. Use both ways of expressing the future if you can.',
  cases_intro:
    'Write 3 sentences in Croatian that each use a different grammatical case. Note which case you used in parentheses.',
  nominative:
    'Write 3 sentences where the subject does something. Make the subject as specific and interesting as possible.',
  accusative:
    'Write 3 sentences about what you see in your room right now. Use direct objects in the accusative case.',
  genitive:
    'Write 3 sentences expressing possession or quantity. For example, describe what belongs to someone or how much of something there is.',
  dative:
    'Write 3 sentences about giving, sending, or doing something for someone. Use the dative case for the recipient.',
  locative:
    'Write 3 sentences describing where things or people are. Use prepositions like u, na, or o with the locative case.',
  instrumental:
    'Write 3 sentences about doing something with a tool or together with someone. Use the instrumental case.',
  vocative:
    'Write a short note (3-4 sentences) addressing a friend or family member directly by name. Use the vocative case.',
  aspect:
    'Write 3 sentence pairs — each pair should describe the same action once as completed (perfective) and once as ongoing (imperfective).',
  clitics:
    'Write 4 sentences using clitic pronouns (mi, ti, mu, joj, ga, je, etc.). Pay attention to word order.',
  conditional:
    'Write 3 sentences about wishes or hypotheticals using the conditional mood (bi + past participle).',
  impersonal:
    'Write 3 sentences using se constructions to describe things that happen in general or without a specific subject.',
  pitch:
    'Write 3 Croatian sentences and mark which syllable carries stress in at least one word per sentence.',
  relative_clauses:
    'Write 3 sentences with relative clauses using koji, koja, or koje. Make sure the relative pronoun agrees with the noun it refers to.',
  verbal_nouns:
    'Write 3 sentences using verbal nouns (e.g. čitanje, pisanje, učenje). Describe activities you enjoy or find difficult.',
  aspect_narrative:
    'Write a short paragraph (3-4 sentences) about something that happened to you, mixing perfective and imperfective verbs to show background and foreground action.',
  genitive_negation:
    'Write 3 sentences using negation. Notice how the object shifts from accusative to genitive when you negate.',
  advanced_clitics:
    'Write 4 sentences that include clitic clusters (e.g. joj ga, mu se). Pay careful attention to the ordering rules.',
};

const FALLBACK_PROMPT =
  'Write 2-3 sentences in Croatian using what you just learned in this lesson.';

const LEVEL_COLORS = {
  A1: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  A2: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  B1: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  B2: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  C1: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
};

const TOPIC_TO_SCREEN = {
  gender: 'genderdrill',
  present: 'verbdrill',
  past: 'tenseflip',
  future: 'future',
  cases_intro: 'padezi',
  nominative: 'padezi',
  accusative: 'accusativedrill',
  genitive: 'negation',
  dative: 'prepdrill',
  locative: 'prepdrill',
  instrumental: 'prepdrill',
  vocative: 'padezi',
  aspect: 'aspect',
  clitics: 'clitic',
  conditional: 'conditional',
  impersonal: 'impersonal',
  pitch: 'pitchaccent',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

interface Topic {
  id: string;
  icon: string;
  title: string;
  level: string;
  desc: string;
}
interface LessonQuizItem {
  q: string;
  opts?: string[];
  options?: string[];
  correct: number;
  explanation?: string;
}
interface WritingResult {
  score?: number;
  summary?: string;
  revised?: string;
  tip?: string;
  corrected_text?: string;
  encouragement?: string;
  changes?: { original: string; corrected: string; note?: string }[];
  strengths?: string[];
}
interface Lesson {
  title: string;
  intro: string;
  icon?: string;
  tip?: string;
  rule?: string;
  examples?: { hr: string; en: string; note?: string }[];
  table?: { headers: string[]; rows: string[][] };
  quiz?: LessonQuizItem[];
}

export default function GrammarExplainer({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { setStats, writeDelta } = useStats();
  const [phase, setPhase] = useState('pick');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [level, setLevel] = useState(() => {
    try {
      return localStorage.getItem('nh_placement_result') || 'A2';
    } catch {
      return 'A2';
    }
  });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const xpAwarded = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Writing practice state
  const [writingText, setWritingText] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);
  const [writingResult, setWritingResult] = useState<WritingResult | null>(null);
  const [writingError, setWritingError] = useState<string | null>(null);
  const [writingSkipped, setWritingSkipped] = useState(false);

  async function generateLesson() {
    if (!selectedTopic) return;
    setPhase('loading');
    setError(null);
    try {
      const res = await _aiPost('/api/ai-chat', {
        mode: 'explain',
        params: { topic: selectedTopic.title, level },
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLesson(data);
      setQuizAnswers(new Array((data.quiz || []).length).fill(null));
      setQuizSubmitted(false);
      xpAwarded.current = false;
      setWritingText('');
      setWritingResult(null);
      setWritingError(null);
      setWritingSkipped(false);
      setPhase('lesson');
    } catch (e) {
      setError((e instanceof Error ? e.message : null) || 'Failed to generate lesson');
      setPhase('pick');
    }
  }

  function handleQuizSubmit() {
    setQuizSubmitted(true);
    if (!xpAwarded.current && typeof award === 'function') {
      xpAwarded.current = true;
      award(20, false, 'grammar');
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      setPhase('done');
      setTimeout(() => setPhase('lesson'), 1800);
    }
  }

  function resetToPick() {
    setPhase('pick');
    setLesson(null);
    setSelectedTopic(null);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    xpAwarded.current = false;
    setError(null);
    setWritingText('');
    setWritingResult(null);
    setWritingError(null);
    setWritingSkipped(false);
  }

  async function handleCheckWriting() {
    if (!writingText.trim()) return;
    const promptText =
      (selectedTopic && (WRITING_PROMPTS as Record<string, string>)[selectedTopic.id]) ||
      FALLBACK_PROMPT;
    setWritingLoading(true);
    setWritingResult(null);
    setWritingError(null);
    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'writeeval',
          params: { level, writingPrompt: promptText },
          messages: [{ role: 'user', content: writingText.trim() }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWritingResult(data);
    } catch (e) {
      setWritingError((e instanceof Error ? e.message : null) || 'Failed to evaluate writing');
    } finally {
      setWritingLoading(false);
    }
  }

  // ── PHASE: loading ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--app-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div style={{ fontSize: 56, animation: 'spin 1.5s linear infinite' }}>🇭🇷</div>
        <p style={{ color: 'var(--subtext)', fontSize: 'var(--text-base)', fontWeight: 500 }}>
          Claude is preparing your lesson...
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        `}</style>
      </div>
    );
  }

  // ── PHASE: done (XP celebration) ─────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--app-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent)' }}>
          +20 XP
        </div>
        <p style={{ color: 'var(--subtext)', fontSize: 'var(--text-base)' }}>Great work!</p>
      </div>
    );
  }

  // ── PHASE: lesson ─────────────────────────────────────────────────────────
  if (phase === 'lesson' && lesson) {
    const _lc =
      (LEVEL_COLORS as Record<string, typeof LEVEL_COLORS.A1>)[level] || LEVEL_COLORS['A2'];
    const score = quizSubmitted
      ? (lesson.quiz || []).filter((q: LessonQuizItem, i: number) => quizAnswers[i] === q.correct)
          .length
      : null;
    const scoreColor = score === 3 ? '#16a34a' : score === 2 ? '#d97706' : '#dc2626';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--app-bg)', paddingBottom: 80 }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .example-card { animation: fadeUp 0.35s ease both; }
        `}</style>

        {/* Back button */}
        <div style={{ padding: '16px 16px 0' }}>
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--subtext)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Back
          </button>
        </div>

        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* 1. Header card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
              borderRadius: 16,
              padding: '24px 20px',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>{selectedTopic?.icon}</span>
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                  {lesson.title || selectedTopic?.title}
                </div>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                  }}
                >
                  {level}
                </span>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-base)',
                fontStyle: 'italic',
                opacity: 0.92,
                lineHeight: 1.55,
              }}
            >
              {lesson.intro}
            </p>
          </div>

          {/* 2. The Rule */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '20px 20px',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--heading)',
                marginBottom: 12,
              }}
            >
              📖 The Rule
            </div>
            <div
              style={{
                background: 'var(--bar-bg)',
                borderLeft: '4px solid var(--accent)',
                borderRadius: '0 10px 10px 0',
                padding: '14px 16px',
                fontSize: 'var(--text-base)',
                color: 'var(--heading)',
                lineHeight: 1.65,
              }}
            >
              {lesson.rule}
            </div>
          </div>

          {/* 3. Examples */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '20px 20px',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--heading)',
                marginBottom: 14,
              }}
            >
              📝 Examples
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(lesson.examples || []).map((ex, i) => (
                <div
                  key={i}
                  className="example-card"
                  style={{
                    background: 'var(--bar-bg)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--text-lg)',
                        fontWeight: 700,
                        color: 'var(--heading)',
                        lineHeight: 1.4,
                      }}
                    >
                      {ex.hr}
                    </div>
                    <button
                      onClick={() => speak(ex.hr)}
                      aria-label={`Play audio for ${ex.hr}`}
                      style={{
                        flexShrink: 0,
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: 8,
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      <span aria-hidden="true">🔊</span>
                    </button>
                  </div>
                  <div
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', marginTop: 4 }}
                  >
                    {ex.en}
                  </div>
                  {ex.note && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        background: 'var(--info)',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                      }}
                    >
                      {ex.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Table (optional) */}
          {lesson.table && lesson.table.headers && lesson.table.rows && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                padding: '20px 20px',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--heading)',
                  marginBottom: 14,
                }}
              >
                📊 Reference Table
              </div>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}
              >
                <thead>
                  <tr>
                    {lesson.table.headers.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          background: 'var(--accent)',
                          color: '#fff',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontWeight: 600,
                          borderRadius:
                            i === 0
                              ? '8px 0 0 0'
                              : i === lesson.table!.headers.length - 1
                                ? '0 8px 0 0'
                                : 0,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lesson.table.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{ background: ri % 2 === 0 ? 'var(--bar-bg)' : 'transparent' }}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            padding: '9px 14px',
                            color: 'var(--heading)',
                            borderBottom: '1px solid var(--card-b)',
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Quiz */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '20px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--heading)' }}>
                🎯 Quick Quiz
              </div>
              {quizSubmitted && (
                <span
                  style={{
                    background: scoreColor,
                    color: '#fff',
                    borderRadius: 20,
                    padding: '4px 14px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                  }}
                >
                  {score}/{(lesson.quiz || []).length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(lesson.quiz || []).map((q: LessonQuizItem, qi: number) => {
                const answered = quizAnswers[qi];
                const _isCorrect = quizSubmitted && answered === q.correct;
                const _isWrong = quizSubmitted && answered !== null && answered !== q.correct;
                return (
                  <div key={qi}>
                    <div
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: 'var(--heading)',
                        marginBottom: 10,
                      }}
                    >
                      {qi + 1}. {q.q}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(q.options || []).map((opt, oi) => {
                        let bg = 'var(--bar-bg)';
                        let border = '1px solid var(--card-b)';
                        let color = 'var(--heading)';
                        if (!quizSubmitted && answered === oi) {
                          border = '2px solid var(--accent)';
                          bg = 'rgba(99,102,241,0.08)';
                        }
                        if (quizSubmitted && oi === q.correct) {
                          bg = '#dcfce7';
                          border = '2px solid #16a34a';
                          color = '#166534';
                        }
                        if (quizSubmitted && answered === oi && oi !== q.correct) {
                          bg = '#fee2e2';
                          border = '2px solid #dc2626';
                          color = '#991b1b';
                        }
                        return (
                          <button
                            key={oi}
                            disabled={quizSubmitted}
                            onClick={() => {
                              if (!quizSubmitted) {
                                const next = [...quizAnswers];
                                next[qi] = oi;
                                setQuizAnswers(next);
                              }
                            }}
                            style={{
                              background: bg,
                              border,
                              borderRadius: 10,
                              padding: '10px 14px',
                              textAlign: 'left',
                              cursor: quizSubmitted ? 'default' : 'pointer',
                              fontSize: 'var(--text-sm)',
                              color,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              transition: 'all 0.15s',
                            }}
                          >
                            {quizSubmitted && oi === q.correct && <span>✓</span>}
                            {quizSubmitted && answered === oi && oi !== q.correct && <span>✗</span>}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 'var(--text-xs)',
                          color: 'var(--subtext)',
                          fontStyle: 'italic',
                          padding: '8px 12px',
                          background: 'var(--bar-bg)',
                          borderRadius: 8,
                        }}
                      >
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!quizSubmitted && (
              <button
                onClick={handleQuizSubmit}
                disabled={quizAnswers.some((a) => a === null)}
                style={{
                  marginTop: 20,
                  width: '100%',
                  background: quizAnswers.some((a) => a === null)
                    ? 'var(--bar-bg)'
                    : 'var(--accent)',
                  color: quizAnswers.some((a) => a === null) ? 'var(--subtext)' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: quizAnswers.some((a) => a === null) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Check Answers
              </button>
            )}
          </div>

          {/* 6. Writing Practice (shown after quiz is submitted) */}
          {quizSubmitted && !writingSkipped && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                padding: '20px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--heading)' }}
                >
                  ✍️ Practice Writing
                </div>
                <button
                  onClick={() => setWritingSkipped(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--subtext)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Skip
                </button>
              </div>
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--subtext)',
                  lineHeight: 1.6,
                }}
              >
                {(selectedTopic && (WRITING_PROMPTS as Record<string, string>)[selectedTopic.id]) ||
                  FALLBACK_PROMPT}
              </p>
              <textarea
                value={writingText}
                onChange={(e) => {
                  setWritingText(e.target.value);
                  setWritingResult(null);
                  setWritingError(null);
                }}
                placeholder="Napiši ovdje na hrvatskom..."
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bar-bg)',
                  border: '1px solid var(--card-b)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 'var(--text-base)',
                  color: 'var(--heading)',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              {writingError && (
                <div
                  style={{
                    marginTop: 10,
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#991b1b',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {writingError}
                </div>
              )}
              <button
                onClick={handleCheckWriting}
                disabled={!writingText.trim() || writingLoading}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background:
                    !writingText.trim() || writingLoading ? 'var(--bar-bg)' : 'var(--accent)',
                  color: !writingText.trim() || writingLoading ? 'var(--subtext)' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: !writingText.trim() || writingLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {writingLoading ? 'Checking...' : 'Check my writing'}
              </button>

              {/* AI Feedback */}
              {writingResult && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Score bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: 'var(--bar-bg)',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: (writingResult.score || 0) + '%',
                          background:
                            (writingResult.score ?? 0) >= 75
                              ? '#16a34a'
                              : (writingResult.score ?? 0) >= 50
                                ? '#d97706'
                                : '#dc2626',
                          borderRadius: 99,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--heading)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {writingResult.score}/100
                    </span>
                  </div>

                  {/* Corrected text */}
                  {writingResult.corrected_text &&
                    writingResult.corrected_text !== writingText.trim() && (
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: 10,
                          padding: '12px 14px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            color: '#166534',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 6,
                          }}
                        >
                          Corrected Version
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-sm)',
                            color: '#166534',
                            lineHeight: 1.65,
                          }}
                        >
                          {writingResult.corrected_text}
                        </p>
                      </div>
                    )}

                  {/* Changes */}
                  {writingResult.changes && writingResult.changes.length > 0 && (
                    <div
                      style={{
                        background: 'var(--bar-bg)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: 'var(--subtext)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}
                      >
                        Corrections
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {writingResult.changes.map((c, i) => (
                          <div key={i} style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                            <span
                              style={{
                                color: '#dc2626',
                                textDecoration: 'line-through',
                                marginRight: 6,
                              }}
                            >
                              {c.original}
                            </span>
                            <span style={{ color: '#16a34a', fontWeight: 700, marginRight: 6 }}>
                              → {c.corrected}
                            </span>
                            {c.note && (
                              <span style={{ color: 'var(--subtext)', fontStyle: 'italic' }}>
                                ({c.note})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {writingResult.strengths && writingResult.strengths.length > 0 && (
                    <div
                      style={{
                        background: 'var(--bar-bg)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: 'var(--subtext)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}
                      >
                        Strengths
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {writingResult.strengths.map((s, i) => (
                          <li
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 'var(--text-sm)',
                              color: 'var(--heading)',
                              lineHeight: 1.5,
                            }}
                          >
                            <span style={{ color: '#16a34a', fontWeight: 900, flexShrink: 0 }}>
                              ✓
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Encouragement */}
                  {writingResult.encouragement && (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          color: '#78350f',
                          lineHeight: 1.6,
                          fontStyle: 'italic',
                        }}
                      >
                        {writingResult.encouragement}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 7. Tip */}
          {lesson.tip && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: '#92400e',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                💡 Pro Tip
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-base)',
                  color: '#78350f',
                  lineHeight: 1.6,
                }}
              >
                {lesson.tip}
              </p>
            </div>
          )}

          {/* 8. Practice + Reset buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedTopic && (TOPIC_TO_SCREEN as Record<string, string>)[selectedTopic.id] && (
              <button
                onClick={() => {
                  // Navigate to practice screen via goBack + setScr would be ideal,
                  // but since we only have goBack, we use history
                  window.history.pushState(
                    {},
                    '',
                    '/' + (TOPIC_TO_SCREEN as Record<string, string>)[selectedTopic.id],
                  );
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Practice This Topic →
              </button>
            )}
            <button
              onClick={resetToPick}
              style={{
                background: 'var(--card)',
                color: 'var(--heading)',
                border: '1px solid var(--card-b)',
                borderRadius: 12,
                padding: '14px',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Generate Another Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: pick ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--subtext)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Back
        </button>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ marginBottom: 4 }}>{H('🧠 Grammar Explainer', '', goBack)}</div>
        <p style={{ color: 'var(--subtext)', fontSize: 'var(--text-sm)', margin: '4px 0 20px' }}>
          Pick a topic — Claude will generate a personalized lesson for your level
        </p>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#991b1b',
              fontSize: 'var(--text-sm)',
              marginBottom: 16,
            }}
          >
            {error} — please try again.
          </div>
        )}

        {/* Level selector */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--subtext)',
              marginBottom: 8,
            }}
          >
            Your Level
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: '2px solid',
                  borderColor: level === l ? 'var(--accent)' : 'var(--card-b)',
                  background: level === l ? 'var(--accent)' : 'var(--card)',
                  color: level === l ? '#fff' : 'var(--heading)',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Topic grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {TOPICS.map((topic) => {
            const lc =
              (LEVEL_COLORS as Record<string, typeof LEVEL_COLORS.A1>)[topic.level] ||
              LEVEL_COLORS['A2'];
            const isSelected = selectedTopic?.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(isSelected ? null : topic)}
                style={{
                  width: 'calc(50% - 6px)',
                  minWidth: 140,
                  background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--card)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--card-b)',
                  borderRadius: 14,
                  padding: '14px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{topic.icon}</span>
                  <span
                    style={{
                      background: lc.bg,
                      color: lc.text,
                      border: `1px solid ${lc.border}`,
                      borderRadius: 20,
                      padding: '2px 8px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                    }}
                  >
                    {topic.level}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--heading)',
                    marginBottom: 2,
                  }}
                >
                  {topic.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
                  {topic.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Generate button */}
        <button
          onClick={generateLesson}
          disabled={!selectedTopic}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: selectedTopic ? 'var(--accent)' : 'var(--bar-bg)',
            color: selectedTopic ? '#fff' : 'var(--subtext)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            cursor: selectedTopic ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {selectedTopic
            ? `Generate Lesson: ${selectedTopic.title} →`
            : 'Select a topic to continue'}
        </button>
      </div>
    </div>
  );
}
